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

(function() {
    var BOOT_SCREEN_DURATION = 3000;

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


    if (typeof require === "function") {
        require("./using.js/using.js");
        require("./include.js");
    }

    function boot(url_base) {
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

        console.log("Loading packages...");

        // attach request load event listener
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
        });
    }

    boot();
})();