#! /usr/bin/env node
(function() {
    try {
        // spawn nw.js process for allume with parameters
        var findpath = require("nw").findpath;
        var childProcess = require("child_process");

        var PATH_NW = findpath();
        var PATH_APP = __dirname;

        process.argv.splice(1, 1);
        process.argv[0] = PATH_APP;
        var cmd = PATH_NW;
        for (var a in process.argv) {
            cmd += " " + process.argv[a];
        }

        var ls = childProcess.spawn(PATH_NW, process.argv, {"cwd": PATH_APP});

        ls.stdout.on("data", function(data) {
            console.log(data.toString().trim());
        });

        ls.stderr.on("data", function(data) {
            console.error(data.toString().trim());
        });

        //ls.on("close", function(code) {
        //    if (code != 0) {
        //          throw code;
        //    }
        //});
    }
    catch (e) {
        require("./bin/allume.js");
    }
})();