/////////////////////////////////////////////////////////////////////////////////////////////
//
// allume
//
//    Cross-runtime javascript bootloader.
//
// License
//    Apache License Version 2.0
//
// Copyright Nick Verlinden (info@createconform.com)
//
/////////////////////////////////////////////////////////////////////////////////////////////

//
// Application cache check
//
// Check application cache every five minutes for updates, and initiate
// the download procedure when an update was done.
//
if (typeof window !== "undefined" && window.applicationCache) {
    // add event listener for cache update
    window.addEventListener("load", function(e) {
        window.applicationCache.addEventListener("updateready", function(e) {
            if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
                // cache updated. Next reload will feature new version.
                document.documentElement.attributes["data-allume-notify"].value = "updated";
            } else {
                // manifest did not change.
            }
        }, false);
    }, false);

    // check cache every five minutes
    setInterval(function() {
        window.applicationCache.update();
    }, 1000 * 60 * 5);
}

//
// Rough browser polyfill for require
//
// To load allume's dependencies, the require function is used on supproted platforms.
// If require is absent, then this polyfill is used.
// The allume variable is going to be overwritten later. It is used to prevent pollution of the global scope.
// The document.write method of script injection is used to guarantee the correct load order of the scripts.
//
var allume = {};
allume.loadScript = function(source) {
    if (typeof source === "string" && (source.substr(0,2) == "./" && source.lastIndexOf(".js") == source.length - 3)) {
        return document.write("<script language=\"javascript\" type=\"text/javascript\" src=\"" + source + "\"></sc" + "ript>");
    }
    else if (allume.require) {
        return allume.require(source);
    }
    var err = new Error("This is a polyfill for the require function in the allume bootloader.");
    err.code = "MODULE_NOT_FOUND";
    throw err;
};
if (typeof require === "undefined") {
    require = allume.loadScript;
    allume.inject = true;
}

//
// Anonymous function
//
// Starts the boot sequence by getting the parameters depending on the current runtime, overwrites
// console.log and console.error to listen for boot messages and displaying status.
//
(function() {
    //
    // getUrlParameters
    //
    // Returns url parameters if running inside browser, else returns an array containing one string;
    // which is the name of the command invoked 'allume' to be compatible with CLI runtimes.
    //
    function getUrlParameters() {
        var params = [ "allume" ];
        location.search.substr(1).split("&").forEach(function (part) {
            if (!part) return;
            var item = part.split("=");
            params.push(decodeURIComponent(item[0]));
        });
        return params;
    }

    //
    // getNWJSParameters
    //
    // Returns cli parameters when running from inside nw.js, else returns null.
    //
    function getNWJSParameters() {
        try {
            return [ "allume"].concat(require("nw.gui").App.argv);
        }
        catch(e) {
            return null;
        }
    }

    //
    // getNodeParameters
    //
    // Returns cli parameters when running from inside node.js, else returns null.
    //
    function getNodeParameters() {
        return typeof process !== "undefined" && process.argv && process.argv.length > 1 ? process.argv.slice(1) : null;
    }

    //
    // Allume
    //
    // Class that initiates a new bootstrap and overwrites the 'allume' variable in the global scope.
    // It has some public properties that can be used:
    //   .require                     the original require function of the current runtime.
    //   .parameters                  the parameters passed to allume
    //   .hide()                      hides the allume boot screen
    //   .show()                      shows the allume boot screen
    //   .update(status, message)     updates the allume boot screen with the specified message
    //                                the message can be an object of type Error. If status is omitted,
    //                                and message is an object of type Error, allume's boot status will
    //                                automatically be set to error.
    //
    function Allume(parameters) {
        var self = this;

        //
        // CONSTANTS
        //
        this.STATUS_DONE = "";
        this.STATUS_ERROR = "allume-error";
        this.STATUS_BOOTING = "allume-booting";
        this.ERROR_UNKNOWN = "error-unknown";
        var ATTR_BOOT_STATUS = "data-allume-boot-status";
        var ATTR_BOOT_TIME = "data-allume-boot-time";
        var ATTR_BOOT_MESSAGE = "data-allume-boot-message";
        var ATTR_BOOT_ERROR_MESSAGE = "data-allume-boot-error-message";
        var ATTR_BOOT_ERROR_NAME = "data-allume-boot-error-name";

        // overwrite for runtimes that have both node and chromium (nw.js)
        var originalRequire;
        if (typeof document !== "undefined" && !allume.inject) {
            originalRequire = require;
            require = allume.loadScript;
        }

        //
        // PUBLIC PROPERTIES
        //
        this.parameters = parameters;
        this.require = originalRequire;

        // register global
        allume = self;
        if (typeof global !== "undefined") {
            global.allume = allume;
        }

        // set boot time attribute on first load
        if (typeof document !== "undefined" && document.documentElement.attributes[ATTR_BOOT_TIME] && document.documentElement.attributes[ATTR_BOOT_TIME].value == "") {
            document.documentElement.attributes[ATTR_BOOT_TIME].value = new Date().toString();
        }

        //
        // PUBLIC FUNCTIONS
        //
        this.hide = function() {
            document.documentElement.attributes[ATTR_BOOT_STATUS].value = self.STATUS_DONE;
        }
        this.show = function() {
            document.documentElement.attributes[ATTR_BOOT_STATUS].value = self.STATUS_BOOTING;
        }
        this.update = function(status, msg) {
            // if only one argument, then is booting message
            if (arguments.length == 1) {
                msg = status;
                if (msg instanceof Error) {
                    status = self.STATUS_ERROR;
                }
                else {
                    status = self.STATUS_BOOTING;
                }
            }

            // conform error printing
            if ((!msg || typeof msg === "string") && status == self.STATUS_ERROR) {
                e = new Error(e);
                e.name = self.ERROR_UNKNOWN;
            }

            // update the document attributes
            if (typeof document !== "undefined" && document.documentElement.attributes[ATTR_BOOT_STATUS]) {
                switch(status) {
                    case self.STATUS_BOOTING:
                        document.documentElement.attributes[ATTR_BOOT_STATUS].value = status;
                        break;
                    case self.STATUS_ERROR:
                        document.documentElement.attributes[ATTR_BOOT_STATUS].value = status;
                        document.body.attributes[ATTR_BOOT_ERROR_NAME].value = msg.name;
                        document.body.attributes[ATTR_BOOT_ERROR_MESSAGE].value = msg.message;

                        // show window if nw.js
                        try {
                            var nw = require("nw.gui");
                            var win = nw.Window.get();
                            var ignoreClose;
                            nw.Window.open("error.html", { "resizable" : false, "show" : false, "width" : 440, "height" : 160 }, function(err) {
                                err.on("loaded", function() {
                                    err.window.setMain({ 
                                        "message" : "The package could not be loaded. For more information click on the 'Show console' below.",
                                        "close" : function() {
                                            if (ignoreClose) {
                                                return;
                                            }
                                            win.close();
                                        }, 
                                        "show" : function() {
                                            ignoreClose = true;
                                            err.close();
                                            win.show();
                                        }});
                                    err.show();
                                    err.setShowInTaskbar(true);
                                });
                            });
                        }
                        catch(e) {
                            // ignore
                        }
                        break;
                    default:
                        document.documentElement.attributes[ATTR_BOOT_STATUS].value = status;
                        document.body.attributes[ATTR_BOOT_MESSAGE].value = msg || "";
                        break;
                }
            }
        }

        // load dependencies
        require("./using.js/using.js");
        require("./include.js");

        // start boot sequence
        require("./boot.js");
    }

    // create new bootstrap using available parameters
    new Allume(getNWJSParameters() || getNodeParameters() || getUrlParameters());
})();