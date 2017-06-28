#! /usr/bin/env node
try {
    var findpath = require("nw").findpath;
    var childProcess = require("child_process");
    var path = require("path");

    var PATH_NW = findpath();
    var PATH_APP = __dirname;//path.join(__dirname, "bin");

    // spawn nw.js process for allume with parameters
    process.argv.splice(1, 1);
    process.argv[0] = PATH_APP;
    var cmd = PATH_NW;
    for (var a in process.argv) {
        cmd += " " + process.argv[a];
    }

    //var result  = childProcess.execSync(PATH_NW, [ process.argv ], { "cwd" : PATH_APP });
    var result  = childProcess.execSync(cmd, { "cwd" : PATH_APP });
    //if (result.status != 0) {
    //    console.error("Could not start nw.js.");
    if (result.stderr) {
        console.error(result.stderr.toString());
    }
    if (result.stdout) {
        console.log(result.stdout.toString());
    }
    //    return;
    //}
}
catch(e) {
    console.error(e);
    require("./bin/allume.js");
}