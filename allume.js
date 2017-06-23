// rough browser polyfill for require
if (typeof require === "undefined") {
    function require(source) {
        if (typeof source === "string" && source.substr(0,2) == "./") {
            return document.write("<script language=\"javascript\" type=\"text/javascript\" src=\"" + source + "\"></sc" + "ript>");
        }
        throw "This is a polyfill for the require function in the allume bootloader.";
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
    function getNodeParametersOLD() {
        if (!require.main) {
            throw "Sorry, this platform is currently not supported.";
        }

        var fs = require("fs");
        var path = require("path");
        var program = require("commander");

        program
            .usage("[options] <package ...>")
            .option("--profile [add|remove|switch] <profile>", "Performs profile operations.")
            .option("--profile [current]", "Returns the active profile.")
            .option("--profile [list]", "Lists all profiles.")
            .option("--profile [set] <key> <value>", "Set the specified key value of the active profile.")
            .option("--repo <repository>", "Specifies the main repository.")
            .option("--set <key> <value>", "sets the given configuration key and value for the active profile.")
            .parse(process.argv);

        var configDefaultProfile = {
            "repo": "https://api.github.com/repos/create-conform"
        };
        var configDefault = {
            "activeProfile": "create-conform",
            "profiles" : {
                "create-conform": configDefaultProfile,
                "dev": {
                    "repo": "http://localhost:8080"
                },
                "prod": configDefaultProfile,
                "fs" : ""
            }
        };

        var configDir = path.join(__dirname, "..", "pkx", "config");
        var configFile = path.join(configDir, "default.json");

        //check if pkx config exists
        try {
            fs.accessSync(configDir, fs.F_OK);
        } catch (e) {
            configDir = path.join(__dirname, "config");
            configFile = path.join(configDir, "default.json");

            try {
                fs.mkdirSync(configDir);
            }
            catch(e) {
                if (e.code != "EEXIST") {
                    console.error("Could not create config directory!");
                    return;
                }
            }
            try {
                fs.accessSync(configFile, fs.F_OK);
            } catch (e) {
                try {
                    fs.writeFileSync(configFile, JSON.stringify(configDefault, null, "  "));
                }
                catch(e) {
                    console.error("Could not create default configuration file!");
                    return;
                }
            }
        }

        process.env["NODE_CONFIG_DIR"]= configDir;
        var config = require("config");

        if (program.profile) {
            if (Object.prototype.toString.call(program.profile) === "[object String]") {
                program.profile = [ program.profile, program.args[0] ];
            }

            switch(program.profile[0]) {
                case "list":
                    console.log("Profiles:");
                    for (var p in config.profiles) {
                        console.log("  " + p + ": " + JSON.stringify(config.profiles[p]));
                    }
                    return;
                case "switch":
                    config.activeProfile = program.profile[1];
                // fallthrough intended
                case "current":
                    console.log("Active profile: '" + config.activeProfile + "'.");
                    return;
                case "add":
                    if (config.has("profiles." + program.profile[1])) {
                        console.error("Profile '" + program.profile[1] + "' already exist.");
                        return;
                    }
                    config.profiles[program.profile[1]] = configDefaultProfile;
                    console.log("Profile '" + program.profile[1] + "' added.");
                    break;
                case "remove":
                    if (!config.has("profiles." + program.profile[1])) {
                        console.error("Profile '" + program.profile[1] + "' does not exist.");
                        return;
                    }
                    delete config.profiles[program.profile[1]];
                    console.log("Profile '" + program.profile[1] + "' removed.");
                    break;
                case "set":
                    if (!config.has("profiles." + config.activeProfile + "." + program.profile[1])) {
                        console.error("The profile key '" + program.profile[1] + "' is invalid.");
                        return;
                    }
                    if (Object.prototype.toString.call(program.profile[2]) !== "[object String]") {
                        console.error("The profile value is invalid, should be of type 'String'.");
                        return;
                    }
                    config.profiles[config.activeProfile][program.profile[1]] = program.profile[2];
                    console.log("Set '"+program.profile[1]+"': " + config.profiles[config.activeProfile][program.profile[1]]);
                    break;
                default:
                    console.log("Unknown profile operation '" + program.profile[0] + "'.");
                    return;
            }

            // update configuration
            fs.writeFileSync(configFile, JSON.stringify(config, null, "  "));
            return;
        }

        var params = {};
        //params.repo = program.repo || config.profiles[config.activeProfile].repo;
        params.profile = config.profiles[config.activeProfile];
        for (var o in program.args) {
            params[program.args[o]] = null;
        }
        return params;
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