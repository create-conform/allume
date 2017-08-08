//////////////////////////////////////////////////////////////////////////////////
//
// boot
//
//    allume boot sequence.
//
//
// Copyright Nick Verlinden (info@createconform.com)
//
//////////////////////////////////////////////////////////////////////////////////
(function(allume) {
    //
    // CONSTANTS
    //
    var BOOT_SCREEN_DURATION = 3000;
    var CONFIG_DEFAULT = {
        "allume" : true,
        "activeProfile": "local",
        "profiles": {
            "local": {
                "repositories": {
                    "": {
                        "url": "http://localhost:8080"
                    },
                    "allume": {
                        "url": "https://api.github.com/repos/create-conform"
                    },
                    "cc": { 
                        "url": "https://api.github.com/repos/create-conform"
                    }
                }
            }
        }
    };
    var CONFIG_PROFILE_TEMPLATE = {
         "repositories": {
         }
    };
    var MSG_MISSING_FEATURE = "This feature is not yet implemented.";
    var MSG_UI_UNAVAILABLE = "UI Runtime is unavailable on this host.";
    var MSG_DEBUG_UNAVAILABLE = "Debugging is only available in node.js runtime.";
    var MODULE_ID_CONFIG = "cc.config.0";
    var MODULE_ID_CLI = "cc.cli.0";
    var MODULE_ID_HOST = "cc.host.0";
    var PATH_CONFIG = "allume/allume.json";
    var ERROR_INVALID_PROFILE = "allume-error-invalid-profile";
    var ERROR_INVALID_SECTION = "allume-error-invalid-section";
    var ERROR_SAVE_CONFIG = "allume-error-save-config";

    //
    // PRIVATES
    //
    var err = "";
    var errName = allume.ERROR_UNKNOWN;

    var cfg;
    var repo;
    var profile;
    var firstOpen = true;

    var config;
    var cli;
    var host;
    var io;
    var childProcess;
    var path;

    // fix nw.js cwd issue
    if(typeof process !== "undefined" && process.env.PWD) {
        process.chdir(process.env.PWD);
    }

    function getDeepestError(e) {
        if (e.innerError) {
            return getDeepestError(e.innerError);
        }
        if (e.name) {
            errName = e.name;
        }
        return e;
    }
    function usingFailed(loader, indent) {
        if (!indent) {
            indent = "";
        }

        // something went wrong with the loader
        for (var e in loader.err) {
            err += indent + loader.err[e] + "\n";
            if (loader.err[e].name) {
                errName = loader.err[e].name;
            }
        }

        // something went wrong with the individual requests
        for (var r in loader.requests) {
            if (loader.requests[r].module) {
                usingFailedModuleInfo(loader.requests[r].module, indent);
            }
            for (var e in loader.requests[r].err) {
                if (loader.requests[r].err[e].name == "pkx-error-dependency") {
                    err += indent + "    Dependencies:" + "\n";
                    err += indent + "        One or more dependencies failed to load." + "\n";
                    usingFailed(loader.requests[r].err[e].data, indent + "    ");
                }
                else {
                    var id = loader.requests[r].request;
                    if (typeof id === "object") {
                        id =  loader.requests[r].request.package;
                    }
                    var deepE = getDeepestError(loader.requests[r].err[e]);
                    err += indent + "    " + deepE + "\n";
                }
            }
        }
    }
    function usingFailedModuleInfo(module, indent) {
        if (!indent) {
            indent = "";
        }
        // display basic package info
        err += "\n" + indent + "Request '" + module.id + "':" + "\n";
        if (module.parameters && module.parameters.pkx) {
            err += indent + "    Title  : " + module.parameters.pkx.title + "\n";
            err += indent + "    Version: " + module.parameters.pkx.version + "\n";
            err += indent + "    Description:" + "\n";
            err += indent + "        " + module.parameters.pkx.description + "\n";
        }

        // display dependencies
        var foundDependencies = false;
        for (var m in module.dependencies) {
            // skip named dependencies, pkx, module & configuration
            if (isNaN(m) || m <= 2) {
                continue;
            }
            if (!foundDependencies) {
                err += indent + "    Dependencies:" + "\n";
                foundDependencies = true;
            }
            err += indent + "        • " + module.dependencies[m].id + "\n";
        }
    }

    //
    // CLI -> PROFILE COMMANDS
    //
    function profileList(args) {
         for (var p in config.profiles) {
            profilePrint(p);
        }
    }
    function profileAdd(args) {
        if (profileExists(args.name)) {
            allume.update(new Error(ERROR_INVALID_PROFILE, "Profile '" + args.name + "' already exist."));
            return;
        }

        config.profiles[args.name] = CONFIG_PROFILE_TEMPLATE;

        cfg.save(config, PATH_CONFIG).then(function() {
            // success!
        }, function(e) {
            allume.update(new Error(ERROR_SAVE_CONFIG, "An error occurred while trying to save the configuration.", e));
        });
    }
    function profileCopy(args) {
        if (profileExists(args.name)) {
            allume.update(new Error(ERROR_INVALID_PROFILE, "Profile '" + args.name + "' already exist."));
            return;
        }

        config.profiles[args.name] = config.profiles[config.activeProfile];

        cfg.save(config, PATH_CONFIG).then(function() {
            // success!
        }, function(e) {
            allume.update(new Error(ERROR_SAVE_CONFIG, "An error occurred while trying to save the configuration.", e));
        });
    }
    function profileRemove(args) {
        if (!profileExists(args.name)) {
            allume.update(new Error(ERROR_INVALID_PROFILE, "Profile '" + args.name + "' does not exist."));
            return;
        }

        delete config.profiles[args.name];

        cfg.save(config, PATH_CONFIG).then(function() {
            // success!
        }, function(e) {
            allume.update(new Error(ERROR_SAVE_CONFIG, "An error occurred while trying to save the configuration.", e));
        });
    }
    function profileCurrent(args) {
        profilePrint(config.activeProfile);
    }
    function profileSwitch(args) {
        if (!profileExists(args.name)) {
            allume.update(new Error(ERROR_INVALID_PROFILE, "Profile '" + args.name + "' does not exist."));
            return;
        }
        config.activeProfile = args.name;

        cfg.save(config, PATH_CONFIG).then(function() {
            // success!
        }, function(e) {
            allume.update(new Error(ERROR_SAVE_CONFIG, "An error occurred while trying to save the configuration.", e));
        });
    }
    function profileSet(args) {
        if (!config.profiles[config.activeProfile][args.section]) {
            allume.update(new Error(ERROR_INVALID_SECTION, "Profile '" + config.activeProfile + "' does not have configuration section '" + args.section + "'."));
            return;
        }
        config.profiles[config.activeProfile][args.section][args.key] = args.value;

        cfg.save(config, PATH_CONFIG).then(function() {
            // success!
        }, function(e) {
            allume.update(new Error(ERROR_SAVE_CONFIG, "An error occurred while trying to save the configuration.", e));
        });
    }

    function profileExists(name) {
        for (var p in config.profiles) {
            if (p == name) {
                return true;
            }
        }
        return false;
    }
    function profilePrint(name) {
        allume.update(allume.STATUS_DONE, "'" + name + "':" + "\n" + JSON.stringify(config.profiles[name], null, "  "));
    }

    //
    // CLI -> LOAD PACKAGE
    //
    function boot() {
        // load dependencies
        cli = cli || define.cache.get(MODULE_ID_CLI, "minor").factory();
        host = host || define.cache.get(MODULE_ID_HOST, "minor").factory();

        var nw;
        var ui;
        try {
            // listen for OS open file event
            nw = require("nw");
            ui = require("nw.gui");
        }
        catch(e) {
            // ignore
        }

        // specify cli options
        if (nw) {
            cli.option("--ui", "Opens the selector in nw.js.");
        }
        else if (!host.isRuntimeBrowserFamily()) {
            cli.option("--ui", MSG_UI_UNAVAILABLE);
        }
        if (host.runtime == host.RUNTIME_NODEJS) {
            cli.option("--debug [port]", "Starts node.js in debug mode.");
        }
        else {
            cli.option("--debug [port]", MSG_DEBUG_UNAVAILABLE);
        }
        cli.option("--repo <url>", "Overrides the main repository for the active profile.");
        if (host.isRuntimeBrowserFamily()) {
            cli.option("--theme <url>", "Loads the specified css theme.");
        }
        cli.option("--config <json>", "A JSON object with parameters for the package module loaded.");
        cli.option("--profile <name>", "Overrides the active profile.");
        cli.option("--gh-username <username>", "Overrides the global configuration GitHub username key.");
        cli.option("--gh-password <password>", "Overrides the global configuration GitHub password key.");
        cli.option("--gh-token <token>", "Overrides the global configuration GitHub token key.");
        cli.option("--gh-branch <branch>", "Overrides the global configuration GitHub branch key.");
        cli.option("--gh-enable-pre-release <enable>", "Overrides the global configuration GitHub enable pre-release key.");
        cli.command("profile", "Performs configuration profile operations.")
            .command("list", "Lists all of the profiles available in the configuration.")
            .action(profileList);
        cli.command("profile")
            .command("add <name>", "Add a new profile.")
            .action(profileAdd);
        cli.command("profile")
            .command("copy <name>", "Creates a copy of the current profile with the given name.")
            .action(profileCopy);
        cli.command("profile")
            .command("remove <name>", "Removes the profile with the given name.")
            .action(profileRemove);
        cli.command("profile")
            .command("current", "Displays the name of the active profile.")
            .action(profileCurrent);
        cli.command("profile")
            .command("switch <name>", "Activates the profile with the given name.")
            .action(profileSwitch);
        cli.command("profile")
            .command("set <section> <key> <value>", "Sets the key value combination in the active profile.")
            .action(profileSet);
        cli.parameter("allume <selector>");
        var p = cli.parse(allume.parameters);

        //
        // start the loading process for the specified selector
        //
        function open(selector) {
            if (p["--debug"] && host.runtime == host.RUNTIME_NODEJS) {
                return debug(p);
            }
            if (p["--ui"] && !ui) {
                if (!nw) {
                    allume.update(allume.STATUS_ERROR, MSG_UI_UNAVAILABLE);
                    return;
                }

                // spawn nw.js process for allume with parameters
                var findpath = nw.findpath;
                childProcess = childProcess || require("child_process");
                path = path || require("path");

                var PATH_NW = findpath();
                var PATH_APP = path.join(__dirname, "..");
                var PATH_CWD = process.cwd();
                var env = Object.create(process.env);
                env.PWD = process.cwd();

                process.argv.splice(1, 1);
                process.argv[0] = PATH_APP;
                for (var a in process.argv) {
                    process.argv[a] = process.argv[a].replace(/"/g, "\"");
                }

                var ls = childProcess.spawn(PATH_NW, process.argv, {"cwd": PATH_CWD, "env" : env});

                ls.stdout.on("data", function(data) {
                    console.log(data.toString().trim());
                });

                ls.stderr.on("data", function(data) {
                    console.error(data.toString().trim());
                });

                return;
            }

            var requests = [];
            var request = selector;
            if (p["--config"]) {
                var json;
                try {
                    json = JSON.parse(p["--config"].json);
                }
                catch(e) {
                    var e = new Error("Make sure the data you pass to the --config switch is valid JSON data.");
                    e.name = "error-invalid-configuration";
                    if (typeof document !== "undefined" && firstOpen) {
                        allume.update(e);
                    }
                    else {
                        console.error(e);
                    }
                    firstOpen = false;
                    return;
                }
                request = { "package" : selector, "configuration" : json };
            }
            requests.push(request);

            if (requests) {
                using.apply(using, requests).then(function () {
                    if (firstOpen) {
                        allume.hide();
                        firstOpen = false;
                    }
                }, function (loader) {
                    usingFailed(loader);
                    var e = new Error(err);
                    e.name = errName;
                    if (typeof document !== "undefined" && firstOpen) {
                        allume.update(e);
                        firstOpen = false;
                    }
                    else {
                        console.error(e);
                    }
                });
            }
        }

        if (p) {
            // attach config function to allume
            allume.config = config;

            // process commands and options
            if (p.repo) {
                repo = p.repo;
            }
            if (p["--profile"]) {
                allume.update(allume.STATUS_ERROR, MSG_MISSING_FEATURE);
                profile = p.profile;
            }
            if (p["--theme"] && typeof document !== "undefined") {
                var theme = document.createElement("link");
                theme.rel = "stylesheet";
                theme.href = p["--theme"].url;
                document.head.appendChild(theme);
            }
            if (p["--gh-username"]) {
                config.github = config.github || {};
                config.github.username = p["--gh-username"].username;
            }
            if (p["--gh-password"]) {
                config.github = config.github || {};
                config.github.password = p["--gh-password"].password;
            }
            if (p["--gh-token"]) {
                config.github = config.github || {};
                config.github.token = p["--gh-token"].token;
            }
            if (p["--gh-branch"]) {
                config.github = config.github || {};
                config.github.branch = p["--gh-branch"].branch;
            }
            if (p["--gh-enable-pre-release"]) {
                var val = p["--gh-enable-pre-release"].enable;
                config.github = config.github || {};
                config.github.enablePreRelease = !(val == "false" || !val);
            }
            if (p["--help"]) {
                if (typeof document !== "undefined") {
                    var e = new Error(p["--help"]);
                    e.name = "help";
                    allume.update(e);
                }
            }
            else if (!p.selector && !p.profile && (!p["--ui"] || ui)) {
                if (host.isRuntimeBrowserFamily() && !host.isRuntimeNodeFamily()) {
                    //debug
                    window.location = "../about.html";
                }
                else {
                    var e = new Error("The boot sequence can't start because no package was specified. If you are the developer of the app using allume, then please make sure you specify the package to load.");
                    e.name = "error-invalid-package";
                    if (typeof document !== "undefined") {
                        allume.update(e);
                    }
                    else {
                        console.error(e);
                    }
                }
            }
            else if (p.selector || p["--ui"]) {
                if (ui) {
                    // listen for OS open file event
                    ui.App.on("open", function(cmdline) {
                        cmdline = cmdline.replace(/"([^"]+)"/g, function(a) {
                            return a.replace(/\s/g, "&nbsp;");
                        }).split(" ");
                        for (var i = 0, length = cmdline.length, arg = "", args = []; i < length; ++i) {
                            arg = cmdline[i].replace(/&nbsp;/g, " ");
                            // filter by exe file and exe args.
                            if (arg === "\"" + process.execPath + "\"" || arg.search(/^\-\-/) === 0) continue;
                            args.push(arg);
                        }
                        console.log("OPEN", args);
                        open(args[args.length -1]);
                    });
                }

                open(p.selector);
            }
        }
        else {
            if (typeof document !== "undefined") {
                var e = new Error("Parameters where missing or invalid. Please check your browser javascript console.");
                e.name = "error-invalid-parameter";
                allume.update(e);
            }
        }
    }

    //
    // CLI -> DEBUG COMMAND
    //
    function debug(cmd) {
        // start node in debug mode
        childProcess = childProcess || require("child_process");

        var PATH_CWD = process.cwd();

        // splice out allume command
        process.argv.splice(0, 1);

        // find debug argument
        var debugIdx = -1;
        for (var a in process.argv) {
            if (process.argv[a] == "--debug") {
                debugIdx = a;
            }
            process.argv[a] = process.argv[a].replace(/"/g, "\"");
        }
        if (debugIdx >= 0) {
            process.argv.splice(debugIdx, 1);
        }
        if (!cmd["--debug"].port) {
            process.argv.splice(0, 0, "--debug-brk");
            //process.argv.splice(0, 0, "--inspect");
        }
        else {
            if (debugIdx >= 0) {
                process.argv.splice(debugIdx, 1);
            }
            process.argv.splice(0, 0, "--debug-brk=" + cmd["--debug"].port);
            //process.argv.splice(0, 0, "--inspect=" + cmd["--debug"].port);
        }
    

        var ls = childProcess.spawn("node", process.argv, {"cwd": PATH_CWD});

        ls.stdout.on("data", function(data) {
            console.log(data.toString().trim());
        });

        ls.stderr.on("data", function(data) {
            console.error(data.toString().trim());
        });

        return;
    }

    //
    // Wait for pkx loader to be ready
    //
    // Once the pkx loader is ready, we can read configuration and
    // load the repositories and profiles.
    //
    define.Loader.waitFor("pkx", function(loader) {
        // load dependencies
        cfg = cfg || define.cache.get(MODULE_ID_CONFIG, "minor").factory();

        // reset require polyfill
        if (allume.require) {
            require = allume.require;
        }

        // add main repo
        if (repo) {
            loader.addRepository("", repo);
        }

        // get configuration, then boot
        function configSuccess(c) {
            config = c;
            configDone();
        }
        function configFail(e) {
            console.error(e);
            configDone();
        }
        function configDone() {
            // if empty object, set to default
            if (!config || Object.keys(config).length === 0 || !config.allume) {
                config = CONFIG_DEFAULT;

                // attempt to save default config
                cfg.save(config, PATH_CONFIG).then(function() {
                    startBoot();
                }, startBoot);
            }
            else {
                startBoot();
            }
        }
        function startBoot() {
            // get active profile
            var profile = config.profiles[config.activeProfile];

            // add all repositories from profile
            for (var r in profile.repositories) {
                if (r == "" && repo) {
                    continue;
                }
                loader.addRepository(r, profile.repositories[r].url);
            }

            boot();
        }

        cfg.load(PATH_CONFIG).then(function(cfg) {
            configSuccess(cfg);   
        }, configFail);
    });
})(typeof global !== "undefined"? global.allume : allume);