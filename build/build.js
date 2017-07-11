#! /usr/bin/env node
var childProcess = require("child_process");
var fs = require("fs");
var path = require("path");

var result;
var includeFile = "bin/include.js";
var appcacheFile = "offline.appcache";
var appcacheFiles = [
    "index.html",
    "run.js",
    "package.json",
    "bin/allume.js",
    "bin/boot.js",
    "bin/using.js/using.js",
    "res/allume-dark.css",
    "res/allume-dark-progress.css",
    "res/allume-36.png"
];

// pkx wrap --loader "include.js"
result  = childProcess.spawnSync("pkx", [ "wrap", "--appcache", appcacheFile ,"--loader", includeFile], { "cwd" : path.join(__dirname, "../bin") });
if (result.status != 0) {
    console.error("Could not wrap the dependencies.");
    console.error(result.stderr.toString());
    console.log(result.stdout.toString());
    return;
}

// increment build number
result = childProcess.spawnSync("npm", [ "version", "minor", "--force" ], { "cwd" : path.join(__dirname, "..") });
if (result.status != 0) {
    console.error("Could not bump the minor version.");
    console.error(result.stderr.toString());
    console.log(result.stdout.toString());
    return;
}

// add required files to appcache manifest (add after second line)
var appcacheLines = fs.readFileSync(appcacheFile).toString().split("\n");
for (var l in appcacheFiles) {
    appcacheLines.splice(2, 0, appcacheFiles[l]);
}
fs.writeFile(appcacheFile, appcacheLines.join("\n"), function (err) {
    if (err) return console.error("Could not add files to appcache file. Error: " + err);
});

console.log("Build successfully completed!");