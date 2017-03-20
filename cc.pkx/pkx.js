/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.pkx.1.2.2/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function() {
    var require = define.getRequire("cc.pkx.1.2.2/");
    define.parameters = {};
    define.parameters.system = "pkx";
    define.parameters.id = "cc.pkx.1.2.2/";
    define.parameters.pkx = {
        "company": "cc",
        "product": "",
        "name": "pkx",
        "version": "1.2.2",
        "title": "PKX Module Library",
        "description": "Library for loading PKX modules, and working with PKX packages.",
        "bugs": null,
        "author": null,
        "contributors": null,
        "main": "pkx.js",
        "dependencies": [
            {
                "package": "cc.host.1.0"
            },
            {
                "package": "cc.io.1.0"
            },
            {
                "package": "cc.io.format.tar.1.0"
            },
            {
                "package": "cc.log.1.0"
            },
            {
                "package": "cc.string.1.0"
            },
            {
                "package": "cc.object.1.0"
            },
            {
                "package": "cc.boolean.1.0"
            },
            {
                "package": "cc.array.1.0"
            },
            {
                "package": "cc.type.1.0"
            },
            {
                "package": "cc.event.1.0"
            },
            {
                "package": "cc.validate.1.0"
            }
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("[object Object]/"));
    define.parameters.dependencies.push(define.cache.get("[object Object]/"));
    define.parameters.dependencies.push(define.cache.get("[object Object]/"));
    define.parameters.dependencies.push(define.cache.get("[object Object]/"));
    define.parameters.dependencies.push(define.cache.get("[object Object]/"));
    define.parameters.dependencies.push(define.cache.get("[object Object]/"));
    define.parameters.dependencies.push(define.cache.get("[object Object]/"));
    define.parameters.dependencies.push(define.cache.get("[object Object]/"));
    define.parameters.dependencies.push(define.cache.get("[object Object]/"));
    define.parameters.dependencies.push(define.cache.get("[object Object]/"));
    define.parameters.dependencies.push(define.cache.get("[object Object]/"));
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.pkx
    //
    //    Library for loading PKX modules, and working with PKX packages.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (ipkx installnfo@createconform.com)
    //
    /////////////////////////////////////////////////////////////////////////////////////////////
    
    (function() {
        var PKX_SYSTEM = "pkx";
        var DEPENDENCY_PKX = PKX_SYSTEM;
        var DEPENDENCY_CONFIG = "configuration";
        var HOST_GITHUB = "github.com";
        var URI_PATH_GITHUB_TEMPLATE = "$FULLNAME/raw/master/build/$PACKAGE";
    
        function PKX(pkx, module, configuration) {
            var self = this;
    
            this.repositoryURL = "";
            if (!configuration && typeof define != "undefined" && define.parameters.configuration) {
                configuration = define.parameters.configuration;
            }
            if (configuration && configuration.repository) {
                this.repositoryURL = configuration.repository;
                if (this.repositoryURL.substr(this.repositoryURL.length - 1) != "/") {
                    this.repositoryURL += "/";
                }
            }
    
            var init = false;
    
            var host;
            var event;
            var io;
            var log;
            var string;
            var object;
            var boolean;
            var array;
            var tar;
            var type;
            var validate;
    
            this.PKX_SYSTEM = PKX_SYSTEM;
            this.PKX_FILE_EXTENSION = "." + PKX_SYSTEM;
            this.PKX_DESCRIPTOR_FILENAME = "package.json";
            this.DEPENDENCY_PKX = DEPENDENCY_PKX;
            this.DEPENDENCY_CONFIG = DEPENDENCY_CONFIG;
            this.PROTOCOL_PKX = PKX_SYSTEM;
    
            this.OPERATION_FETCH_PKX = "pkx-operation-fetch-" + PKX_SYSTEM;
    
            this.ERROR_INVALID_PKX_VOLUME = "pkx-error-invalid-" + PKX_SYSTEM + "-volume";
            this.ERROR_INVALID_PKX_DESCRIPTOR = "pkx-error-invalid-" + PKX_SYSTEM + "-descriptor";
            this.ERROR_INVALID_PKX_SELECTOR = "pkx-error-invalid-" + PKX_SYSTEM + "-selector";
            this.ERROR_TARGET_MISMATCH = "pkx-error-target-mismatch";
            this.ERROR_NO_ENTRY_POINT = "pkx-error-no-entry-point";
            this.ERROR_DEPENDENCY = "pkx-error-dependency";
    
            var INDENT_OFFSET = 4;
    
            this.load = function(request) {
                var loader = null;
                var selector;
                try {
                    selector = new self.PKXSelector(request);
                }
                catch(e) {
                    if (e instanceof Error && e.name == self.ERROR_INVALID_PKX_SELECTOR) {
                        throw new RangeError(e.message);
                    }
                    else {
                        throw e;
                    }
                }
    
                var fetch = function (callback, fail) {
                    // check target
                    try {
                        validate(selector.target, object)
                            .when(object.compare, host);
                    }
                    catch(e) {
                        if (selector.optional) {
                            // gracefully stop
                            callback();
                            return;
                        }
                        else {
                            throw new Error(self.ERROR_TARGET_MISMATCH, "Target does not match, and the request is not optional.", selector.target);
                        }
                    }
    
                    // check define cache for existing module
                    if (typeof define != "undefined" && define.using && !selector.raw) {
                        // add wildcard before first slash (to specify any build number)
                        var idxSlash = selector.id.indexOf("/");
                        var idSearch = selector.id.substr(0,idxSlash) + ".*" + selector.id.substr(idxSlash);
                        var cached = define.cache.get(idSearch);
                        if (cached) {
                            complete(cached);
                            return;
                        }
                    }
    
                    // get existing volume for package
                    var pkxVolume = io.volumes.get(selector.uri);
    
                    // create new volume
                    if (pkxVolume.length == 0) {
                        pkxVolume = new self.PKXVolume(selector.uri);
                        pkxVolume.events.addEventListener(io.EVENT_VOLUME_INITIALIZATION_PROGRESS, progress);
                        pkxVolume.then(function (volume) {
                            // register volume
                            io.volumes.register(volume);
    
                            getPackageDependencies(volume);
                        }, error);
                    }
                    else {
                        pkxVolume = pkxVolume[0];
                        getPackageDependencies(pkxVolume);
                    }
    
                    function getPackageDependencies(volume) {
                        var requests = [];
                        if (selector.raw && selector.ignoreDependencies) {
                            getResourceFromVolume();
                            return;
                        }
                        else if (selector.raw) {
                            var pkxDeps = volume.pkx.pkxDependencies || volume.pkx.dependencies;
                            for (var d in pkxDeps) {
                                switch (type.getType(pkxDeps[d])) {
                                    case type.TYPE_OBJECT:
                                        if (pkxDeps[d].system &&
                                            pkxDeps[d].system != PKX_SYSTEM) {
                                            requests[d] = pkxDeps[d];
                                        }
                                    // fallthrough intended
                                    case type.TYPE_STRING:
                                        requests[d] = new self.PKXSelector(pkxDeps[d]);
                                        requests[d].wrap = selector.wrap;
                                        requests[d].raw = true;
                                        break;
                                    default:
                                        // unknown system
                                        requests[d] = pkxDeps[d];
                                }
                            }
                        }
                        else {
                            requests = volume.pkx.pkxDependencies || volume.pkx.dependencies;
                        }
                        if (typeof using === "undefined") {
                            error(new Error("It seems that using.js is missing. Please make sure it is loaded."));
                            return;
                        }
                        using.apply(this, requests).then(getResourceFromVolume, function(loader) {
                            error(new Error(self.ERROR_DEPENDENCY, "", loader));
                        }, true);
                    }
    
                    function getResourceFromVolume() {
                        // find out which resource to load
                        var resource = null;
                        if (selector.resource) {
                            resource = selector.resource;
                        }
                        else {
                            // get first matching main (by target)
                            if (type.isString(pkxVolume.pkx.pkxMain)) {
                                resource = pkxVolume.pkx.pkxMain;
                            }
                            else if (pkxVolume.pkx.pkxMain) {
                                for (var m in pkxVolume.pkx.pkxMain) {
                                    if(pkxVolume.pkx.pkxMain[m].target) {
                                        try {
                                            validate(pkxVolume.pkx.pkxMain[m].target, object)
                                                .when(object.compare, host);
                                            resource = pkxVolume.pkx.pkxMain[m].resource;
                                        }
                                        catch(e) {
                                            // ignore for now
                                        }
                                    }
                                }
                            }
                            else {
                                resource = pkxVolume.pkx.main;
                            }
                        }
    
                        if (!resource) {
                            error(new Error(self.ERROR_NO_ENTRY_POINT, "Package '" + pkxVolume.pkx.id + "' does not have an entry point defined for the current target."));
                            return;
                        }
    
                        if (resource.substr(0,1) != "/") {
                            resource = "/" + resource;
                        }
    
                        var dependencies = [];
                        for (var a=0;a<arguments.length;a++) {
                            // dependency module
                            dependencies[a] = arguments[a];
                        }
    
                        pkxVolume.open(resource).then(function readDataFromResourceStream(stream) {
                            if (selector.raw && !selector.wrap) {
                                complete(stream, dependencies);
                                return;
                            }
    
                            stream.events.addEventListener(io.EVENT_STREAM_READ_PROGRESS, progress);
                            stream.readAsString().then(function processCode(data) {
                                // remove progress listener
                                stream.events.removeEventListener(progress);
    
                                // wrap code for define
                                data = self.load.wrap(data, pkxVolume.pkx, selector.resource, pkxVolume.pkx.pkxDependencies || pkxVolume.pkx.dependencies, selector.configuration, true, pkxVolume.pkx.id + resource, selector.raw && selector.wrap);
    
                                if (selector.raw) {
                                    complete(new io.BufferedStream(data.toUint8Array()), dependencies);
                                    return;
                                }
    
                                // add dependencies
                                define.parameters = {};
                                define.parameters.system = PKX_SYSTEM;
                                define.parameters.id = pkxVolume.pkx.id + (selector.resource || pkxVolume.pkx.id.substr(pkxVolume.pkx.id.length - 1) == "/"? selector.resource : "/");
                                define.parameters.pkx = pkxVolume.pkx;
                                define.parameters.dependencies = [ DEPENDENCY_PKX, "module", DEPENDENCY_CONFIG ];
                                define.parameters.dependencies[0] = pkxVolume.pkx;
                                for(var d in dependencies) {
                                    define.parameters.dependencies.push(dependencies[d]);
                                }
    
                                // load code
                                if (host.runtime == host.RUNTIME_NODEJS) {
                                    try {
                                        require("vm").runInThisContext(require("module").wrap(data),{ filename : resource })(exports, require, module, __filename, __dirname);
                                    }
                                    catch(e) {
                                        error(e);
                                        return;
                                    }
                                    complete(null, null, true);
                                }
                                else if (host.isRuntimeBrowserFamily()) {
                                    var script = document.createElement("script");
                                    script.language = "javascript";
                                    script.type = "text/javascript";
                                    script.text = data;
                                    try {
                                        document.body.appendChild(script);
                                    }
                                    catch(e) {
                                        error(e);
                                        return;
                                    }
                                    complete(null, null, true);
                                }
                                else {
                                    error(new Error("Loading code in runtime '" + host.runtime + "' is not supported."));
                                }
                            }, error);
                        }, error);
                    }
    
                    var waiters = [];
                    function complete(fact, dependencies, checkWait) {
                        if (loader) {
                            // check for delayed loading
                            if (checkWait && define.parameters.wait) {
                                waiters =  define.parameters.wait;
    
                                for (var w in waiters) {
                                    waiters[w].then(complete, error);
                                }
                                return;
                            }
                            else {
                                // wait for all waiters to complete
                                var allDone = true;
                                for (var w in waiters) {
                                    if (!waiters[w].done) {
                                        allDone = false;
                                        break;
                                    }
                                }
                                if (!allDone) {
                                    return;
                                }
                            }
    
                            if (!fact) {
                                fact = define.cache.get(pkxVolume.pkx.id + (request.resource? request.resource : "/"));
                            }
                            else if (!(fact instanceof define.Module)) {
                                var mod = new define.Module();
                                mod.id = pkxVolume.pkx.id + (selector.resource || pkxVolume.pkx.id.substr(pkxVolume.pkx.id.length - 1) == "/"? selector.resource : "/");
                                mod.factory = fact;
                                mod.dependencies = dependencies || [];
                                mod.parameters = {
                                    "id" : pkxVolume.pkx.id + (request.resource? request.resource : "/"),
                                    "system" : PKX_SYSTEM,
                                    "pkx" : pkxVolume.pkx
                                };
                                fact = mod;
                            }
    
                            callback(fact);
                            return;
                        }
    
                        callback(fact);
                    }
    
                    function error(e) {
                        if (loader) {
                            loader.err.push(e);
    
                            if (!loader.module && pkxVolume) {
                                loader.module = new define.Module();
                                loader.module.id = (pkxVolume.pkx? pkxVolume.pkx.id : (request.package? request.package : request)) + (request.resource || (pkxVolume.pkx && pkxVolume.pkx.id.substr(pkxVolume.pkx.id.length - 1) == "/")? request.resource : "/");
                                if (pkxVolume.pkx) {
                                    loader.module.parameters = {
                                        "id": pkxVolume.pkx.id + (request.resource ? request.resource : "/"),
                                        "system": PKX_SYSTEM,
                                        "pkx": pkxVolume.pkx
                                    }
                                }
                            }
    
                            callback();
                            return;
                        }
                        fail(e);
                    }
    
                    var lastPVol = null;
                    var lastPStr = null;
                    var lastPercentage = null;
                    function progress(sender, p) {
                        if (loader) {
                            if (sender == pkxVolume) {
                                lastPVol = p.percentage;
                            }
                            if (sender == resStr) {
                                lastPStr = p.percentage;
                            }
                            var currentPercentage = ((lastPVol? lastPVol : 0) + (lastPStr? lastPStr : 0)) / 2;
                            if (lastPercentage != currentPercentage) {
                                lastPercentage = currentPercentage;
                                loader.progress = new type.Progress({
                                    "percentage" : currentPercentage,
                                    "operation" : {
                                        "type" : self.OPERATION_FETCH_PKX
                                    },
                                    "emitter" : sender
                                });
                            }
                        }
                    }
                };
    
                if (typeof define != "undefined" && define.using) {
                    loader = new define.Loader(request, fetch);
                    return loader;
                }
                else {
                    return new Promise(function(resolve, refuse) {
                        fetch(resolve, refuse);
                    });
                }
            };
            this.load.factory = function(module, factory, request) {
                // decorate dependencies
                var dependencies = module.dependencies.slice(0);
                var args = [];
    
                // add package object to front if there was no string left in dependencies to process
                var addPkx = true;
                for (var d in dependencies) {
                    if (!isNaN(d)) {
                        if (Object.prototype.toString.call(dependencies[d]) !== "[object String]") {
                            if (dependencies[d] === module.parameters.pkx) {
                                addPkx = false;
                                break;
                            }
                        }
                    }
                }
    
                if (addPkx) {
                    args.push(module.parameters.pkx);
                }
    
                // Replace the pkx descriptor or pkx placeholder with an instance of PKX, unless type, string and validate
                // are not loaded yet. This means that when they are first instantiated by this module, they will not have
                // the functions available to a PKX instance. This is not a disaster since those base libraries do not use
                // them. Any instances created after the initial load will have them available, except if they're singleton.
                for (var d in dependencies) {
                    if ((dependencies[d] === module.parameters.pkx ||
                        !isNaN(d) && dependencies[d] == DEPENDENCY_PKX) &&
                        type && string && validate) {
                        dependencies[d] = new self.PKX(dependencies[d]);
                    }
                    if (!isNaN(d) && dependencies[d] == DEPENDENCY_CONFIG) {
                        dependencies[d] = request && request.configuration? request.configuration : (module.parameters.configuration? module.parameters.configuration : {});
                    }
                }
    
                // add other dependencies (only numbered index)
                for (var a=0;a<dependencies.length;a++) {
                    args.push(dependencies[a]);
                }
    
                // execute module factory
                return factory.apply(factory, args);
            };
            this.load.wrap = function(code, pkx, resourceId, dependencies, configuration, addSourceMap, sourceMapName, isEmbedded) {
                if (!resourceId) {
                    resourceId = "/";
                }
    
                var depStr = "";
    
                if (isEmbedded) {
                }
    
                // stringify the package definition (pretty print)
                var descriptor = JSON.stringify(pkx, null, Array(INDENT_OFFSET + 1).join(" "));
    
                // generate module definition code
                var moduleCode = "(function() {\r\nvar require = define.getRequire(\"" + pkx.id + resourceId + "\");\r\n";
                if (isEmbedded) {
                    // add configuration
                    configuration = configuration? "\r\ndefine.parameters.configuration = " + JSON.stringify(configuration, null, Array(INDENT_OFFSET + 1).join(" ")) + ";" : "";
    
                    // add package dependency
                    depStr += "\r\ndefine.parameters.dependencies = [ \"" + DEPENDENCY_PKX + "\", \"module\", \"" + DEPENDENCY_CONFIG + "\" ];";
                    depStr += "\r\ndefine.parameters.dependencies[0] = define.parameters.pkx;";
    
                    if (dependencies) {
                        for (var t = 0; t < dependencies.length; t++) {
                            var dep = dependencies[t];
                            if (dep && Object.prototype.toString.call(dep) === "[object Object]") {
                                depStr += "\r\ndefine.parameters.dependencies.push(define.cache.get(\"" + dep + "/\"));";
                            }
                        }
                    }
    
                    moduleCode += "define.parameters = {};\r\ndefine.parameters.system = \"" + PKX_SYSTEM + "\";\r\ndefine.parameters.id = \"" + pkx.id + resourceId + "\";\r\ndefine.parameters.pkx = " + descriptor + ";" + depStr + configuration + "\r\n";
                }
                moduleCode += code + "\r\n})();" + (addSourceMap? "\r\n//# sourceURL=http://" + (sourceMapName? sourceMapName : (pkx.id + resourceId)) : "");
    
                // add code indent to make it pretty
                var moduleLines = moduleCode.split(/\r*\n/);
                var indentWhiteSpace = Array(INDENT_OFFSET + 1).join(" ");
    
                // add header to make it pretty
                if (isEmbedded) {
                    moduleCode = "/////////////////////////////////////////////////////////////////////////////////////\r\n";
                    moduleCode += "//\r\n";
                    moduleCode += "// module '" + pkx.id + resourceId + "'\r\n";
                    moduleCode += "//\r\n";
                    moduleCode += "/////////////////////////////////////////////////////////////////////////////////////\r\n";
                    moduleCode += moduleLines[0] + "\r\n";
                    for (var l=1;l<moduleLines.length - (addSourceMap? 2 : 1);l++) {
                        moduleCode += indentWhiteSpace + moduleLines[l] + "\r\n";
                    }
                    if (addSourceMap) {
                        moduleCode += moduleLines[moduleLines.length - 2] + "\r\n";
                    }
                    moduleCode += moduleLines[moduleLines.length - 1] + "\r\n";
                }
    
                return moduleCode;
            };
    
            // register require as module loader
            if (typeof define === "function" && define.cache && define.using) {
                try {
                    define.Loader.register(PKX_SYSTEM, self.load);
                }
                catch(e) {
                    if (!(e instanceof RangeError)) {
                        throw e;
                    }
                }
            }
    
            if (typeof require === "function") {
                // replace node.js's require with our own
                if (require.main) {
                    var Module = require("module");
                    var originalRequire = Module.prototype.require;
                    var requireCache = [];
    
                    Module.prototype.require = function(id) {
                        if (!requireCache[id]) {
                            requireCache[id] = originalRequire.call(this, id);
                        }
                        return requireCache[id];
                    };
                }
    
                type = require("./cc.type");
                event = require("./cc.event");
                validate = require("./cc.validate");
                string = require("./cc.string");
                object = require("./cc.object");
                boolean = require("./cc.boolean");
                array = require("./cc.array");
                log = require("./cc.log");
                host = require("./cc.host");
                io = require("./cc.io");
                tar = require("./cc.io.format.tar");
    
                init = true;
            }
            else if (typeof define != "undefined" && define.using) {
                try {
                    type = define.cache.get("cc.type.1.*").factory();
                    event = define.cache.get("cc.event.1.*").factory();
                    validate = define.cache.get("cc.validate.1.*").factory();
                    string = define.cache.get("cc.string.1.*").factory();
                    object = define.cache.get("cc.object.1.*").factory();
                    boolean = define.cache.get("cc.boolean.1.*").factory();
                    array = define.cache.get("cc.array.1.*").factory();
                    log = define.cache.get("cc.log.1.*").factory();
                    host = define.cache.get("cc.host.1.*").factory();
                    io = define.cache.get("cc.io.1.*").factory();
                    tar = define.cache.get("cc.tar.1.*").factory();
                    init = true;
                }
                catch(e) {
                    if (typeof require !== "function") {
                        throw new Error("In order to use cc.pkx, you need to manually load wrapped dependencies before the first package is requested or module being instantiated.", e);
                    }
                }
            }
            if(!init) {
                throw new Error("Unsupported runtime.");
            }
    
            this.PKXSelector = function(selector) {
                var own = this;
                var errName = own.ERROR_INVALID_PKX_SELECTOR;
                var addDefaultResource = false;
    
                switch(type.getType(selector)) {
                    case type.TYPE_STRING:
                        selector = { "package" : selector };
                        addDefaultResource = true;
                        break;
                    case type.TYPE_OBJECT:
                        break;
                    default:
                        throw new Error(errName, "Mandatory parameter 'selector' should be of type 'String' or 'Object'.");
                }
    
                // name
                try {
                    validate(selector.package, string, errName, "package")
                        .when(string.isURL);
                }
                catch(e) {
                    validate(selector.package, string, errName, "package")
                        .allow(string.LOWERCASE_LETTER, string.DIGIT, string.DASH, string.DOT, string.SLASH)
                        .notNull();
                }
                // verify naming pattern
                var idxSlash = selector.package.lastIndexOf("/", selector.package.length - 2);
                var parts = (idxSlash >= 0? selector.package.substr(idxSlash) : selector.package).split(".");
                if (parts.length > 0 && parts[parts.length - 1].substr(parts[parts.length - 1].length - 1) == "/") {
                    parts[parts.length - 1] = parts[parts.length - 1].substr(0,parts[parts.length - 1].length - 1);
                }
                if (selector.package.lastIndexOf("/") != selector.package.length - 1 &&
                    (parts.length < 3 ||
                    isNaN(parts[parts.length - 1]) || // last part should be number
                    isNaN(parts[parts.length - 2]) || // second last part should be number
                    !isNaN(parts[parts.length - 3]))) { // third last part needs to have letters
                    throw new Error(errName, "Mandatory property 'package' does not match the " + PKX_SYSTEM + " naming pattern.");
                }
                validate(selector.resource, string, errName)
                    .when(string.isPath);
                validate(selector.target, object, errName);
                validate(selector.raw, boolean, errName);
                validate(selector.wrap, boolean, errName);
                validate(selector.system, string, errName);
                validate(selector.optional, boolean, errName);
    
                // normalise path (add leading slash)
                if (selector.resource && selector.resource.length > 0 && selector.resource.substr(0,1) != "/") {
                    selector.resource = "/" + selector.resource;
                }
    
                var uri;
                Object.defineProperty(this, "id", {
                    get: function() {
                        return own.package + (addDefaultResource? "/" : (own.resource || ""));
                    }
                });
                Object.defineProperty(this, "uri", {
                    get: function() {
                        return uri;
                    }
                });
                Object.defineProperty(this, "archive", {
                    get: function() {
                        return selector.package.lastIndexOf("/") != selector.package.length - 1;
                    }
                });
                this.package = selector.package;
                this.resource = selector.resource;
                this.target = selector.target;
                this.raw = selector.raw || false;
                this.wrap = selector.wrap || false;
                this.system = selector.system;
                this.optional = selector.optional || false;
                this.ignoreDependencies = selector.ignoreDependencies || false;
                this.configuration = selector.configuration || null;
    
                try {
                    //if package does not end with .pkx and is an archive
                    //  -add .pkx
                    //if there is no slash
                    //  -prepend repository url
                    var repo = self.repositoryURL;
                    var uriPKXName = selector.package + (selector.package.lastIndexOf(self.PKX_FILE_EXTENSION) != selector.package.length - self.PKX_FILE_EXTENSION.length && own.archive ? self.PKX_FILE_EXTENSION : "");
                    var repoURI = io.URI.parse(repo);
                    switch(repoURI.authority.host) {
                        case HOST_GITHUB:
                            repo = self.repositoryURL + URI_PATH_GITHUB_TEMPLATE;
                            break;
                        default:
                            repo = self.repositoryURL;
                            break;
                    }
                    var fullName = "";
                    var nameParts = selector.package.split(".");
                    for (var i=0;i<nameParts.length;i++) {
                        if (isNaN(nameParts[i])) {
                            fullName += (fullName != ""? "." : "") + nameParts[i];
                        }
                    }
                    repo = repo.replace(/\$FULLNAME/, fullName);
                    if (repo.indexOf("$PACKAGE") > -1) {
                        repo = repo.replace(/\$PACKAGE/, uriPKXName);
                    }
                    else {
                        repo += selector.package;
                    }
    
                    var uriStr = selector.package.indexOf("/") > -1? uriPKXName : repo;
                    if (host.runtime == host.RUNTIME_NODEJS) {
                        var url = require("url");
                        uriStr = url.resolve(self.repositoryURL, uriStr);
                    }
                    uri = io.URI.parse(uriStr);
                }
                catch(e) {
                    // invalid request
                    throw new Error(errName, e);
                }
            };
            this.PKX = function(descriptor){
                var own = this;
                var errName = self.ERROR_INVALID_PKX_DESCRIPTOR;
    
                switch(type.getType(descriptor)) {
                    case type.TYPE_STRING:
                        try {
                            descriptor = JSON.parse(descriptor);
                        }
                        catch(e) {
                            throw new Error(errName, "Could not parse the JSON string.", e);
                        }
                        break;
                    case type.TYPE_OBJECT:
                        break;
                    default:
                        throw new Error(errName, "Mandatory parameter 'descriptor' should be of type 'String' or 'Object'.");
                }
    
                var name = [ string.LOWERCASE_LETTER, string.DIGIT, string.DASH ];
                validate(descriptor.company, string, errName)
                    .allow(name);
                validate(descriptor.product, string, errName)
                    .allow(name);
                validate(descriptor.name, string, errName)
                    .allow(name)
                    .when(descriptor.name != "")
                    .notNull();
                validate(descriptor.component, string, errName)
                    .allow(name, string.DOT);
                validate(descriptor.version, string, errName)
                    .when(string.isSemVer)
                    .notNull();
                validate(descriptor.title, string, errName);
                validate(descriptor.description, string, errName);
                validate(descriptor.keywords, array, errName)
                    .allow(array.STRING);
                validate(descriptor.homepage, string, errName)
                    .when(string.isURL);
                validate(descriptor.bugs, object, errName);
                validate(descriptor.license, string, errName);
                validate(descriptor.author, object, errName);
                validate(descriptor.contributors, array, errName)
                    .allow(array.STRING);
                validate(descriptor.main, string, errName)
                    .when(string.isPath);
                validate(descriptor.pkxMain, array, errName)
                    .allow(array.STRING);
                validate(descriptor.dependencies, array, errName)
                    .allow(array.STRING, array.OBJECT);
                validate(descriptor.target, object, errName);
    
                this.company = descriptor.company;
                this.product = descriptor.product;
                this.name = descriptor.name;
                this.component = descriptor.component;
                this.version = descriptor.version;
                this.title = descriptor.title;
                this.description = descriptor.description;
                this.keywords = descriptor.keywords;
                this.homepage = descriptor.homepage;
                this.bugs = descriptor.bugs? new self.PKXBugs(descriptor.bugs) : null;
                this.license = descriptor.license;
                this.author = descriptor.author? new self.PKXPerson(descriptor.author) : null;
                this.contributors = null;
                if (descriptor.contributors) {
                    this.contributors = [];
                    for (var c=0;c<descriptor.contributors;c++) {
                        this.contributors.push(new self.PKXPerson(descriptor.contributors[c]));
                    }
                }
                this.main = descriptor.main;
                this.pkxMain = descriptor.pkxMain;
                this.repository = !descriptor.repository || type.isString(descriptor.repository)? descriptor.repository : new self.PKXRepository(descriptor.repository);
                this.dependencies = descriptor.dependencies;
                this.pkxDependencies = descriptor.pkxDependencies;
                this.target = descriptor.target;
    
                Object.defineProperty(this, "id", {
                    get : function() {
                        return (own.company != null && own.company != ""? own.company + "." : "")
                            + (own.product != null && own.product != ""? own.product + "." : "")
                            + own.name + "."
                            + (own.component != null && own.component != ""? own.component + "." : "")
                            + own.version;
                    }
                });
            };
            this.PKXPerson = function(person) {
                var errName = self.ERROR_INVALID_PKX_DESCRIPTOR;
    
                validate(person.name, string, errName).notNull();
                validate(person.name, string, errName).when(string.isEmailRFC2822).notNull();
                validate(person.name, string, errName).when(string.isURL);
    
                this.name = person.name;
                this.email = person.email;
                this.url = person.url;
            };
            this.PKXBugs = function(bugs) {
                var errName = self.ERROR_INVALID_PKX_DESCRIPTOR;
    
                validate(bugs.email, string, errName).when(string.isEmailRFC2822).notNull();
                validate(bugs.url, string, errName).when(string.isURL).notNull();
    
                this.email = bugs.email;
                this.url = bugs.url;
            };
            this.PKXRepository = function(repository) {
                var errName = self.ERROR_INVALID_PKX_DESCRIPTOR;
    
                validate(repository.type, string, errName).notNull();
                validate(repository.url, string, errName).when(string.isURL).notNull();
    
                this.type = repository.type;
                this.url = repository.url;
            };
            this.PKXVolume = function(uri) {
                var own = this;
    
                if (typeof uri == "string") {
                    uri = io.URI.parse(uri);
                }
    
                // validate arguments
                if (!(uri instanceof io.URI)) {
                    throw new TypeError("Mandatory parameter 'uri' should be of type 'URI'.");
                }
    
                var initializing = false;
                var idxLastSlash = uri.path.lastIndexOf("/");
                var isArchive = idxLastSlash != uri.path.length - 1;
                var tarVolume = null;
                var packageId = idxLastSlash >= 0 && isArchive? uri.path.substr(idxLastSlash + 1) : uri.path;
                if (packageId.length > self.PKX_FILE_EXTENSION.length && packageId.substr(packageId.length - self.PKX_FILE_EXTENSION.length) == self.PKX_FILE_EXTENSION) {
                    packageId = packageId.substr(0, packageId.length - self.PKX_FILE_EXTENSION.length);
                }
                if (packageId == "") {
                    packageId = uri;
                }
    
                var uriPath = uri.path;
    
                this.err = [];
                this.name = packageId;
                this.protocol = self.PROTOCOL_PKX;
                this.description = "Package " + packageId;
                this.state = io.VOLUME_STATE_INITIALIZING;
                this.size = 0;
                this.type = io.VOLUME_TYPE_REMOVABLE;
                this.scope = io.VOLUME_SCOPE_LOCAL;
                this.class = io.VOLUME_CLASS_TEMPORARY;
                this.readOnly = true;
                this.localId = uri.toString();
                this.pkx = null;
    
                this.open = notReady;
                this.delete = notReady;
                this.query = notReady;
                this.getBytesUsed = notReady;
                this.getBytesAvailable = notReady;
    
                this.events = new event.Emitter(this);
    
                this.then = function(resolve, refuse) {
                    if (initializing) {
                        refuse(new Error(io.ERROR_VOLUME_NOT_READY, "Volume initialization already started."));
                        return;
                    }
                    initializing = true;
    
                    init(resolve, refuse);
                };
    
                function init(resolve, refuse) {
                    var pkxJSONStream;
                    if (isArchive) {
                        uri.open().then(function (stream) {
                            // what is returned here is a stream that is in the tar format.
                            tarVolume = new tar.TarVolume(stream, packageId);
                            tarVolume.events.addEventListener(io.EVENT_VOLUME_INITIALIZATION_PROGRESS, progress);
                            tarVolume.then(function(volume) {
                                volume.open("/" + self.PKX_DESCRIPTOR_FILENAME).then(function(s) {
                                    pkxJSONStream = s;
                                    pkxJSONStream.events.addEventListener(io.EVENT_STREAM_READ_PROGRESS, progress);
                                    pkxJSONStream.readAsJSON().then(function (pkxJSON) {
                                        // validate pkx
                                        try {
                                            own.pkx = new self.PKX(pkxJSON);
                                        }
                                        catch (e) {
                                            error(e);
                                            return;
                                        }
    
                                        pkxJSONStream.close().then(function() {
                                            // bind operations to tar volume
                                            own.open = Function.prototype.bind.call(volume.open, volume);
                                            own.delete = Function.prototype.bind.call(volume.delete, volume);
                                            own.query = Function.prototype.bind.call(volume.query, volume);
                                            own.getBytesUsed = Function.prototype.bind.call(volume.getBytesUsed, volume);
                                            own.getBytesAvailable = Function.prototype.bind.call(volume.getBytesAvailable, volume);
                                            own.close = Function.prototype.bind.call(volume.close, volume);
    
                                            own.state = io.VOLUME_STATE_READY;
                                            own.events.fire(io.EVENT_VOLUME_STATE_CHANGED, own.state);
    
                                            initializing = false;
    
                                            resolve(own);
                                        }, error);
                                    }, error);
                                }, error);
                            }, error);
                        }, error);
                    }
                    else {
                        uri.path += self.PKX_DESCRIPTOR_FILENAME;
                        uri.open().then(function(s) {
                            pkxJSONStream = s;
                            pkxJSONStream.events.addEventListener(io.EVENT_STREAM_READ_PROGRESS, progress);
                            pkxJSONStream.readAsJSON().then(function (pkxJSON) {
                                // validate pkx
                                try {
                                    own.pkx = new self.PKX(pkxJSON);
                                }
                                catch (e) {
                                    error(e);
                                    return;
                                }
    
                                pkxJSONStream.close().then(function() {
                                    // bind operations to tar volume
                                    //own.open = Function.prototype.bind.call(volume.open, volume);
                                    //own.close = Function.prototype.bind.call(volume.close, volume);
                                    own.open = function(id, opt_access) {
                                        if (!type.isString(id) || id == "" || id == "/") {
                                            refuse(new Error(io.ERROR_FILE_NOT_FOUND, ""));
                                            return;
                                        }
                                        // trim slash
                                        id = id.substr(0,1) == "/"? id.substr(1) : id;
    
                                        return new Promise(function(resolve, refuse) {
                                            var rUri = new io.URI(uri);
                                            rUri.path = uriPath + id;
                                            rUri.open(opt_access).then(resolve, refuse);
                                        });
                                    };
    
                                    own.state = io.VOLUME_STATE_READY;
                                    own.events.fire(io.EVENT_VOLUME_STATE_CHANGED, own.state);
    
                                    initializing = false;
    
                                    resolve(own);
                                }, error);
                            }, error);
                        }, error);
                    }
    
                    function error(e) {
                        var err;
                        if (e &&
                            (e.name == tar.ERROR_INVALID_TAR_VOLUME ||
                            e.name == io.ERROR_INVALID_JSON_DATA ||
                            e.name == self.ERROR_INVALID_PKX_DESCRIPTOR)) {
                            err = new Error(self.ERROR_INVALID_PKX_VOLUME, e);
                        }
                        else {
                            err = new Error(e);
                        }
                        own.err.push(err);
                        own.state = io.VOLUME_STATE_ERROR;
                        own.events.fire(io.EVENT_VOLUME_STATE_CHANGED, own.state);
                        refuse(err);
                    }
    
                    var lastPVol = null;
                    var lastPStr = null;
                    var lastProgress = null;
                    function progress(sender, p) {
                        if (sender == tarVolume) {
                            lastPVol = p.percentage;
                        }
                        if (sender == pkxJSONStream) {
                            lastPStr = p.percentage;
                        }
                        var currentProgress = ((lastPVol? lastPVol : 0) + (lastPStr? lastPStr : 0)) / 2;
                        if (lastProgress == currentProgress) {
                            return;
                        }
                        lastProgress = currentProgress;
                        own.events.fire(io.EVENT_VOLUME_INITIALIZATION_PROGRESS, new type.Progress({
                            "percentage" : currentProgress,
                            "operation" : {
                                "type" : io.OPERATION_VOLUME_INITIALIZATION
                            },
                            "emitter" : sender
                        }));
                    }
                }
    
                function notReady() {
                    return new Promise(function(resolve, refuse) { refuse(io.ERROR_VOLUME_NOT_READY); });
                }
            };
            this.PKXVolume.prototype = io.Volume;
        }
    
        var singleton;
        (function (obj, factory) {
            var supported = false;
            if (typeof define === "function" && (define.amd || define.using)) {
                define(factory);
    
                if (define.using) {
                    // self instantiate
                    factory();
                }
                supported = true;
            }
            if (typeof module === "object" && module.exports && typeof require != "undefined" && require.main !== module) {
                module.exports = factory();
                supported = true;
            }
            if (!supported) {
                obj.returnExports = factory();
            }
        }(this, function() {
            if (singleton) {
                return singleton;
            }
            singleton = new (Function.prototype.bind.apply(PKX, arguments));
            return singleton;
        }));
    })();
})();
//# sourceURL=http://cc.pkx.1.2.2/pkx.js
