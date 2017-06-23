// rough browser polyfill for require
if (typeof require === "undefined") {
    function require(source) {
        if (typeof source === "string" && (source.substr(0,2) == "./" && source.lastIndexOf(".js") == source.length - 3)) {
            return document.write("<script language=\"javascript\" type=\"text/javascript\" src=\"" + source + "\"></sc" + "ript>");
        }
        var err = new Error("This is a polyfill for the require function in the allume bootloader.");
        err.code = "MODULE_NOT_FOUND";
        throw err;
    }
}

var allume;
(function() {
    function getUrlParameters() {
        var params = {};
        location.search.substr(1).split("&").forEach(function (part) {
            if (!part) return;
            var item = part.split("=");
            params[item[0]] = item[1] ? decodeURIComponent(item[1]) : null;
        });
        return params;
    }
    function getNodeParameters() {
        return typeof process !== "undefined" && process.argv? process.argv.slice(1) : null;
    }

    function Allume(parameters) {
        var self = this;
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
        if (typeof document !== "undefined" && document.body.attributes[self.ATTR_BOOT_TIME].value == "") {
            document.body.attributes[self.ATTR_BOOT_TIME].value = new Date().toString();
        }

        console.log = function (msg) {
            if (msg == self.MSG_SUCCESS || self.msg == self.MSG_ERROR) {
                console.log = FN_CONS_LOG;
                if (typeof document !== "undefined") {
                    document.body.attributes[self.ATTR_BOOT_STATUS].value = msg == self.MSG_ERROR ? msg : "";
                }
                return;
            }
            else if (msg) {
                if (typeof document !== "undefined") {
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

            if (typeof document !== "undefined" && document.body.attributes[self.ATTR_BOOT_STATUS].value != self.MSG_ERROR) {
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

        // register global
        allume = self;
        if (typeof require.main !== "undefined") {
            global.allume = allume;
        }

        // load dependencies
        require("./using.js/using.js");
        require("./include.js");

        //start boot sequence
        require("./boot.js");
    }

    new Allume(getNodeParameters() || getUrlParameters());
})();