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

    var err = "";
    var errName = allume.ERROR_UNKNOWN;

    //TODO
    // -if dom, get url parameters
    // -if node, get cli parameters
    //
    // Usage:
    //   HTML Client:
    //     http://allume.cc/?cc.xeos.boot.0.1
    //   NPM CLI Tool:
    //     allume "cc.xeos.boot.0.1"
    //     allume "{ 'package' : 'cc.xeos.boot.0.1' }"
    //
    // Features:
    //   * HTML UI With Boot Progress
    //   * CLI UI With Boot Progress
    //   * Uses the HTML5 AppCache
    //
    // parameters
    //   <request>

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
    function linuxRedisplayRatpoisonWM() {
        var gui = null;
        var window = null;

        //nw.js hacks
        try {
            //hack -> don't show window until loaded. Else window could flash white.
            gui = require("nw.gui");
            window = gui.Window.get();
            window.show();

            //hack -> when started in browser mode (not hosting panels in the host OS), X11 sometimes does not show window
            //        fullscreen. If ratpoison is installed, invoke the redisplay command to fill the window te fullscreen.
            if (process.platform == "linux" && !gui.App.manifest.xeos.host_panels) {
                var cmd = "ratpoison -c redisplay";
                var childProcess = require("child_process");
                childProcess.exec(cmd, function (error, stdout, stderr) {
                    // ignore outcome, if it doesn't work, it just doesn't.
                });
            }
        }
        catch(e) {
            //ignore, not nw.js
        }
    }
    function boot(urlBase) {
        console.log("Loading packages...");

        var requests = [];
        for (var o in allume.parameters) {
            if (!allume.parameters[o]) {
                requests.push(o);
            }
            else if (o == "package") {
                request.push(allume.parameters[o]);
            }
        }

        if (requests) {
            using.apply(using, requests).then(function() {
                console.log("allume-hide");
            }, function(loader) {
                usingFailed(loader);
                var e = new Error(err);
                e.name = errName;
                console.error(e);
                console.log("allume-error");
            });
        }
        //"https://create-conform.github.io/cc.error/build/cc.error.1.0.pkx"
        //using("http://localhost:8081/cc.type.1.0.pkx").then(function() {
        //    console.log("Success!", arguments);

        //}, console.error);
        /*// attach request load event listener
        using.events.addEventListener("done", function (loader, results) {
            if (loader.err.length > 0) {
                var log = "";
                for (var i = 0; i < loader.err.length; i++) {
                    log += " " + loader.err[i] + "\r\n";
                }
                console.log("Request '" + JSON.stringify(loader.request) + "' failed to load.");
                console.log(log);
            }
            else {
                //console.log("Request '" + JSON.stringify(loader.request) + "' successfully loaded.");
            }
        });

        // boot xeos platform
        using("cc.xeos.boot.0.1", function(boot) {
            // hide the splash screen on nw.js platform
            if (gui) {
                var diff = new Date() - Date.parse(document.body.attributes["data-boot-time"].value);
                if (diff > BOOT_SCREEN_DURATION) {
                    window.hide();
                    window.setShowInTaskbar(true);
                }
                else {
                    setTimeout(function() {
                        window.hide();
                        window.setShowInTaskbar(true);
                    }, BOOT_SCREEN_DURATION - diff);
                }
            }
        });*/
    }

    define.Loader.waitFor("pkx", function(loader) {
        if (allume.parameters.profile && allume.parameters.profile.repo) {
            loader.addRepository("", allume.parameters.profile.repo);
        }
    });

    boot();
})(typeof global !== "undefined"? global.allume : allume);