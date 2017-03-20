#! /usr/bin/env node
var childProcess = require("child_process");
var fs = require("fs");
var path = require("path");

var result;
var includeFile = "include.js";
var appcacheFile = "offline.appcache";
var appcacheFiles = [
    "allume.js",
    "allume-dark.css",
    "using.js/using.js"
];

// pkx wrap --loader "include.js"
result  = childProcess.spawnSync("pkx", [ "wrap", "--appcache", appcacheFile ,"--loader", includeFile], { "cwd" : path.join(__dirname, "..") });
if (result.status != 0) {
    console.error("Could not wrap the dependencies.");
    console.error(result.stderr.toString());
    console.log(result.stdout.toString());
    return;
}

// increment build number
result = childProcess.spawnSync("npm", [ "version", "minor" ], { "cwd" : path.join(__dirname, "..") });
if (result.status != 0) {
    console.error("Could not bump the minor version.");
    console.error(result.stderr.toString());
    console.log(result.stdout.toString());
    return;
}

// add required files to appcache manifest (add after second line)
var appcacheLines = fs.readFileSync(appcacheFile).toString().split("\r\n");
appcacheLines.splice(2, 0, appcacheFiles);
fs.writeFile(appcacheFile, appcacheLines.join("\r\n"), function (err) {
    if (err) return console.error("Could not add files to appcache file. Error: " + err);
});