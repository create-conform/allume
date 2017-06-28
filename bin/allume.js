// rough browser polyfill for require
// allume is going to be overwritten later. This is just not to polute the global scope.
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

// inject polyfill
if (typeof require === "undefined") {
    require = allume.loadScript;
    allume.inject = true;
}

(function() {
    function getUrlParameters() {
        var params = [ "allume" ];
        location.search.substr(1).split("&").forEach(function (part) {
            if (!part) return;
            var item = part.split("=");
            params.push(decodeURIComponent(item[0]));
        });
        return params;
    }
    function getNWJSParameters() {
        try {
            var gui = require("nw.gui");
            return [ "allume"].concat(gui.App.argv);
        }
        catch(e) {
            return null;
        }
    }
    function getNodeParameters() {
        return typeof process !== "undefined" && process.argv? process.argv.slice(1) : null;
    }

    function Allume(parameters) {
        var self = this;

        // overwrite for runtimes that have both node and chromium (nw.js)
        var originalRequire;
        if (typeof document !== "undefined" && !allume.inject) {
            originalRequire = require;
            require = allume.loadScript;
        }

        // register global
        allume = self;
        if (typeof global !== "undefined") {
            global.allume = allume;
        }

        allume.require = originalRequire;

        // Add hook to console.log. If the bootloader success message appears, unhook.
        this.MSG_SUCCESS = "allume-hide";
        this.MSG_ERROR = "allume-error";
        this.ATTR_BOOT_STATUS = "data-allume-boot-status";
        this.ATTR_BOOT_TIME = "data-allume-boot-time";
        this.ATTR_BOOT_ERROR_MESSAGE = "data-allume-boot-error-message";
        this.ATTR_BOOT_ERROR_NAME = "data-allume-boot-error-name";
        this.ERROR_UNKNOWN = "error-unknown";
        var FN_CONS_LOG = console.log;
        var FN_CONS_ERROR = console.error;

        this.parameters = parameters;

        // set boot time attribute on first load
        if (typeof document !== "undefined" && document.body.attributes[self.ATTR_BOOT_TIME] && document.body.attributes[self.ATTR_BOOT_TIME].value == "") {
            document.body.attributes[self.ATTR_BOOT_TIME].value = new Date().toString();
        }

        console.log = function (msg) {
            if (msg == self.MSG_SUCCESS || self.msg == self.MSG_ERROR) {
                console.log = FN_CONS_LOG;
                if (typeof document !== "undefined" && document.body.attributes[self.ATTR_BOOT_STATUS]) {
                    document.body.attributes[self.ATTR_BOOT_STATUS].value = msg == self.MSG_ERROR ? msg : "";
                }
                return;
            }
            else if (msg) {
                if (typeof document !== "undefined" && document.body.attributes[self.ATTR_BOOT_STATUS]) {
                    document.body.attributes[self.ATTR_BOOT_STATUS].value = msg;
                }
            }
            try {
                FN_CONS_LOG.apply(FN_CONS_LOG, arguments);
            }
            catch (e) {
                // Safari
            }
        };
        console.error = function (e) {
            if (!e || typeof e === "string") {
                e = new Error(e);
                e.name = self.ERROR_UNKNOWN;
            }

            if (typeof document !== "undefined" && document.body.attributes[self.ATTR_BOOT_STATUS] && document.body.attributes[self.ATTR_BOOT_STATUS].value != self.MSG_ERROR) {
                document.body.attributes[self.ATTR_BOOT_ERROR_NAME].value = e.name;
                document.body.attributes[self.ATTR_BOOT_ERROR_MESSAGE].value = e.message;
            }
            else {
                // only show one error
                console.error = FN_CONS_ERROR;
            }

            try {
                FN_CONS_ERROR.apply(FN_CONS_ERROR, arguments);
            }
            catch (e) {
                // Safari
            }
        };

        // load dependencies
        require("./using.js/using.js");
        require("./include.js");

        //start boot sequence
        require("./boot.js");
    }

    new Allume(getNWJSParameters() || getNodeParameters() || getUrlParameters());
})();