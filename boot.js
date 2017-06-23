//////////////////////////////////////////////////////////////////////////////////
//
// bootloader
//
//    allume bootloader script.
//
//
// Copyright Nick Verlinden (info@createconform.com)
//
//////////////////////////////////////////////////////////////////////////////////
(function(allume) {
    var BOOT_SCREEN_DURATION = 3000;
    var CONFIG_DEFAULT = {
        "activeProfile": "local",
        "profiles": {
            "local": {
                "repositories": {
                    "": {
                        "url": "http://localhost:8080"
                    },
                    "cc": {
                        "url": "https://api.github.com/repos/create-conform"
                    }
                }
            }
        }
    };
    var MODULE_ID_IO = "cc.io.0";
    var MODULE_ID_CLI = "cc.cli.0";

    var err = "";
    var errName = allume.ERROR_UNKNOWN;

    var config;
    var repo;
    var profile;

    var cli;
    var io;

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

    function profileList(args) {
        //TODO
    }
    function profileAdd(args) {
        //TODO
    }
    function profileRemove(args) {
        //TODO
    }
    function profileCurrent(args) {
        //TODO
    }
    function profileSwitch(args) {
        //TODO
    }
    function profileSet(args) {
        //TODO
    }

    function boot() {
        // load dependencies
        cli = cli || define.cache.get(MODULE_ID_CLI, "minor").factory();

        // specify cli options
        cli.option("--repo <url>", "Overrides the main repository for the active profile.");
        cli.option("--profile <name>", "Overrides the active profile.");
        cli.option("--theme <url>", "Loads the specified css theme (only in browser).");
        cli.option("--param <json>", "A JSON object with parameters for the package module loaded.");
        cli.command("profile", "Performs configuration profile operations.")
            .command("list", "Lists all of the profiles available in the configuration.")
            .action(profileList);
        cli.command("profile")
            .command("add <name>", "Add a new profile.")
            .action(profileAdd);
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
            .command("set <key> <value>", "Sets the key value combination in the active profile.")
            .action(profileSet);
        cli.parameter("allume <selector>");
        var p = cli.parse(allume.parameters);

        if (p) {
            // attach config function to allume
            allume.config = config;

            // process commands and options
            if (p.repo) {
                repo = p.repo;
            }
            if (p.profile) {
                profile = p.profile;
            }
            if (p["--theme"] && typeof document !== "undefined") {
                var theme = document.createElement("link");
                theme.rel = "stylesheet";
                theme.href = p["--theme"].url;
                document.head.appendChild(theme);
            }
            if (p["--help"]) {
                if (typeof document !== "undefined") {
                    var e = new Error(p["--help"]);
                    e.name = "help";
                    console.error(e);
                    console.log("allume-error");
                }
            }
            else if (!p.selector) {
                if (typeof document !== "undefined") {
                    //window.location = "./about.html";
                }
                else {
                    var e = new Error("The boot sequence can't start because no package was specified. If you are the developer of the app using allume, then please make sure you specify the package to load.");
                    e.name = "error-invalid-package";
                    console.error(e);
                    if (typeof document !== "undefined") {
                        console.log("allume-error");
                    }
                }
            }
            else {
                // NOTE: currently cc.cli supports only one selector parameter
                var requests = [];
                var request = p.selector;
                if (p["--param"]) {
                    var json;
                    try {
                        json = JSON.parse(p["--param"].json);
                    }
                    catch(e) {
                        var e = new Error("Make sure the data you pass to the --param switch is valid JSON data.");
                        e.name = "error-invalid-parameter";
                        console.error(e);
                        if (typeof document !== "undefined") {
                            console.log("allume-error");
                        }
                        return;
                    }
                    request = { "package" : p.selector, "configuration" : json };
                }
                requests.push(request);

                if (requests) {
                    using.apply(using, requests).then(function () {
                        console.log("allume-hide");
                    }, function (loader) {
                        usingFailed(loader);
                        var e = new Error(err);
                        e.name = errName;
                        console.error(e);
                        if (typeof document !== "undefined") {
                            console.log("allume-error");
                        }
                    });
                }
            }
        }
        else {
            if (typeof document !== "undefined") {
                var e = new Error("Parameters where missing or invalid. Please check your browser javascript console.");
                e.name = "error-invalid-parameter";
                console.error(e);
                console.log("allume-error");
            }
        }
    }

    define.Loader.waitFor("pkx", function(loader) {
        // load dependencies
        io = io || define.cache.get(MODULE_ID_IO, "minor").factory();

        // add main repo
        if (repo) {
            loader.addRepository("", repo);
        }

        // get configuration, then boot
        function success(c) {
            config = c;
            done();
        }
        function fail() {
            config = CONFIG_DEFAULT;
            done();
        }
        function done() {
            // get active profile
            var profile = config.profiles[config.activeProfile];

            //add all repositories from profile
            for (var r in profile.repositories) {
                if (r == "" && repo) {
                    continue;
                }
                loader.addRepository(r, profile.repositories[r].url);
            }

            boot();
        }
        var configVolume = io.volumes.get("config");
        if (configVolume.length > 0) {
            configVolume[0].open("allume.json", io.ACCESS_MODIFY).then(function (stream) {
                config = stream.readAsJSON().then(success, fail);
            }, fail);
        }
        else {
            fail();
        }
    });
})(typeof global !== "undefined"? global.allume : allume);