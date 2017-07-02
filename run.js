#! /usr/bin/env node
// fix nw.js cwd issue
/*if(process.env.PWD) {
    process.chdir(process.env.PWD);
}

console.log("CWD: " + process.cwd());

if (process.argv[2] == "debug" && typeof require != "undefined") {
    // start node in debug mode
    var childProcess = require("child_process");

    var PATH_CWD = process.cwd();

    process.argv.splice(2, 1);
    process.argv.splice(0, 1);
    process.argv.splice(0, 0, "debug");
    for (var a in process.argv) {
        process.argv[a] = process.argv[a].replace(/"/g, "\"");
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
else {*/
    require("./bin/allume.js");
//}