/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.pkx.0.1.33/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.pkx.0.1.33/";
    define.parameters.pkx = {
        "name": "cc.pkx",
        "version": "0.1.33",
        "title": "PKX Module Library",
        "description": "Library for loading PKX modules, and working with PKX packages.",
        "bugs": null,
        "author": null,
        "contributors": null,
        "main": "pkx.js",
        "pkxDependencies": [
            "cc.host.0.1",
            "cc.io.0.1",
            "cc.io.format.tar.0.1",
            "cc.io.format.gzip.0.1",
            "cc.log.0.1",
            "cc.string.0.1",
            "cc.object.0.1",
            "cc.boolean.0.1",
            "cc.array.0.1",
            "cc.type.0.1",
            "cc.version.0.1",
            "cc.event.0.1",
            "cc.validate.0.1"
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.host.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.io.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.io.format.tar.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.io.format.gzip.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.log.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.string.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.object.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.boolean.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.array.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.type.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.version.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.event.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.validate.0.1/"));
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.pkx
    //
    //    Library for loading PKX modules, and working with PKX packages.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    ///////////////////////////////////////////////////////////////////////////////////////////// 
    
    (function() {
        var PKX_SYSTEM = "pkx";
        var DEPENDENCY_PKX = PKX_SYSTEM;
        var DEPENDENCY_CONFIG = "configuration";
    
        function PKX(pkx, module, configuration) {
            var self = this;
    
            this.repositoryURL = "";
            this.repositoryResolveLocal = false; // if set to true, dependencies will be resolved relative to root of package (embedded).
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
            var processors = {};
            var repositories = [];
            var volumes = [];
            var requested = {};
    
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
            var gzip;
            var version;
    
            this.PKX_SYSTEM = PKX_SYSTEM;
            this.PKX_FILE_EXTENSION = "." + PKX_SYSTEM;
            this.PKX_DESCRIPTOR_FILENAME = "package.json";
            this.DEPENDENCY_PKX = DEPENDENCY_PKX;
            this.DEPENDENCY_CONFIG = DEPENDENCY_CONFIG;
            this.PROTOCOL_PKX = PKX_SYSTEM;
    
            this.OPERATION_FETCH_PKX = "pkx-operation-fetch-" + PKX_SYSTEM;
    
            this.ERROR_INVALID_PKX_VOLUME = "pkx-error-invalid-volume";
            this.ERROR_INVALID_PKX_DESCRIPTOR = "pkx-error-invalid-descriptor";
            this.ERROR_INVALID_PKX_SELECTOR = "pkx-error-invalid-selector";
            this.ERROR_INVALID_REPOSITORY = "pkx-error-invalid-repository";
            this.ERROR_INVALID_REQUEST_PROCESSOR = "pkx-error-invalid-request-processor";
            this.ERROR_TARGET_MISMATCH = "pkx-error-target-mismatch";
            this.ERROR_NO_ENTRY_POINT = "pkx-error-no-entry-point";
            this.ERROR_DEPENDENCY = "pkx-error-dependency";
    
            var INDENT_OFFSET = 4;
    
            function findVolume(selector) {
                var id = selector.package + "/" + (selector.resource? selector.resource : "");
                for (var v in volumes) {
                    if (version.compare(id, v, selector.upgradable) || id == v) {
                        return volumes[v];
                    }
                }
            }
    
            this.load = function(request, handler) {
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
    
                function fetch(callback, fail) {
                    // check target
                    try {
                        validate(selector.target, object)
                            .when(object.compare, host);
                    }
                    catch(e) {
                        if (selector.optional) {
                            // gracefully stop
                            callback(null, true);
                            return;
                        }
                        else {
                            throw new Error(self.ERROR_TARGET_MISMATCH, "Target does not match, and the request is not optional.", selector.target);
                        }
                    }
    
                    // change relative paths for embedded resources
                    if (selector.package.substr(0, 2) == "./" && handler && handler.context) {
                        selector.package = "pkx:///" + handler.context.id.substr(0, handler.context.id.indexOf("/")) + (selector.package.length > 2 ? "/" + selector.package.substr(2) : "");
                    }
    
                    var pkxVolume;
                    function fetchModule(options) {
                        // check define cache for existing module
                        if (typeof define != "undefined" && define.using && !selector.raw) {
                            var cached = define.cache.get(selector.id, selector.upgradable);
                            if (cached) {
                                complete(cached);
                                return;
                            }
                        }
    
                        // if scheme is pkx, then it's most likely a dependency
                        if (selector.uri.scheme == "pkx") {
                            for (var v in volumes) {
                                if (selector.uri.path && volumes[v].pkx.id == selector.uri.path.substr(1)) {
                                    pkxVolume = volumes[v];
    
                                    getPackageDependencies(pkxVolume);
                                    return;
                                }
                            }
                        }
    
                        // get existing volume for package
                        var packageId = selector.package + "/" + (selector.resource? selector.resource : "");
                        pkxVolume = findVolume(selector);
    
                        // create new volume
                        if (!pkxVolume) {
                            pkxVolume = new self.PKXVolume(selector.uri, options);
                            pkxVolume.events.addEventListener(io.EVENT_VOLUME_INITIALIZATION_PROGRESS, progress);
                            
                            // add the volume already (during initialisation)
                            var volAlreadyExists = volumes[packageId]? true : false;
                            if (!volAlreadyExists) {
                                volumes[packageId] = pkxVolume;
                            }
    
                            pkxVolume.then(function (volume) {
                                // delete temp vol
                                if (volume.pkx.id != packageId && !volAlreadyExists) {
                                    delete volumes[packageId];
                                }
    
                                // register volume
                                io.volumes.register(volume);
    
                                getPackageDependencies(volume);
                            }, error);
                        }
                        else {
                            pkxVolume.ready().then(getPackageDependencies).catch(error);
                        }
    
                        function getPackageDependencies(volume) {
                            var requests = [];
                            var pkxDeps = volume.pkx.pkxDependencies;
                            if (selector.raw && selector.ignoreDependencies) {
                                getResourceFromVolume();
                                return;
                            }
                            else {
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
                                            if (selector.raw) {
                                                requests[d].wrap = selector.wrap;
                                                requests[d].raw = true;
                                            }
                                            break;
                                        default:
                                            // unknown system
                                            requests[d] = pkxDeps[d];
                                    }
    
                                    // modify relative uri for embedded packages
                                    var embedded;
                                    if (requests[d].package.substr(0, 2) == "./") {
                                        requests[d].package = "pkx:///" + volume.pkx.id + (requests[d].package.length > 2 ? "/" + requests[d].package.substr(2) : "");
                                        embedded = true;
                                    }
                                    else if (volume.localId.lastIndexOf("/") == volume.localId.length - 1 && self.repositoryResolveLocal) {
                                        requests[d].package = "pkx:///" + volume.pkx.id + "/" + requests[d].package;
                                        embedded = true;
                                    }
    
                                    if (requests[d].wrap) {
                                        requests[d].ignoreCache = true;
                                    }
    
                                    // skip circular, embedded dependencies
                                    if (embedded && selector.uri.scheme == "pkx") {
                                        requests[d] = null;
                                    }
    
                                    // modify package url if parent is not an archive (for debugging)
                                    // fix this code below if you want non-archive packages to load it's dependencies directly from the code in the subfolders instead of fetching from repo.
                                    // The reason the code below is commented, is because if you use embedded packages the code below breaks it.
                                    // Specifically in node.js.
                                    /*if (!selector.isArchive) {
                                        var name = "";
                                        var nameParts = requests[d].package.substr(requests[d].package.lastIndexOf("/") + 1).split(".");
                                        for (var i = 0; i < nameParts.length; i++) {
                                            if (isNaN(nameParts[i])) {
                                                name += (name != "" ? "." : "") + nameParts[i];
                                            }
                                        }
                                        requests[d].package = requests[d].package.substr(0, requests[d].package.lastIndexOf("/") + 1) + name + "/";
                                    }*/
                                }
                            }
    
                            // filter out removed dependencies
                            var filtered = [];
                            for (var r in requests) {
                                if (requests[r]) {
                                    filtered.push(requests[r]);
                                }
                            }
                            requests = filtered;
    
                            if (typeof using === "undefined") {
                                error(new Error("It seems that using.js is missing. Please make sure it is loaded."));
                                return;
                            }
                            using.apply(this, requests).then(getResourceFromVolume, function(loader) {
                                var halt;
                                var mods = [];
                                for (var r in loader.requests) {
                                    if (loader.requests[r].err.length > 0 && !loader.requests[r].request.optional) {
                                        halt = true;
                                    }
                                    else {
                                        mods.push(loader.requests[r].module);
                                    }
                                }
                                if (!halt) {                                  
                                    getResourceFromVolume.apply(this, mods);
                                    return;
                                }
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
    
                            if (!requested[pkxVolume.pkx.id + resource]) {
                                requested[pkxVolume.pkx.id + resource] = true;
                            }
                            else {
                                define.cache.waitFor(pkxVolume.pkx.id + (selector.resource || pkxVolume.pkx.id.substr(pkxVolume.pkx.id.length - 1) == "/"? selector.resource : "/"), complete);
                                return;
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
    
                                    var name = stream.getName();
                                    var ext = name.substr(stream.getName().lastIndexOf(".") + 1);
                                    var raw =  ext != "js" && ext != "json" && (ext != "css" || (ext == "css" && !host.isRuntimeBrowserFamily() && host.runtime != host.RUNTIME_NWJS));
    
                                    // wrap code for define
                                    if (ext == "js") {
                                        data = self.load.wrap(data, pkxVolume.pkx, selector.resource, pkxVolume.pkx.pkxDependencies, selector.configuration, host.runtime != host.RUNTIME_NODEJS, pkxVolume.pkx.id + resource, selector.raw && selector.wrap);
                                    }
    
                                    if (selector.raw || raw) {
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
    
                                    if (ext == "js") {
                                        // load code
                                        if (host.isRuntimeNodeFamily() && !host.isRuntimeBrowserFamily()) {
                                            try {
                                                require("vm").runInThisContext(data, {filename: (selector.uri.scheme == "file"? process.cwd() : "") + resource, lineOffset: -1});
                                            }
                                            catch (e) {
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
                                            catch (e) {
                                                error(e);
                                                return;
                                            }
                                            complete(null, null, true);
                                        }
                                        else {
                                            error(new Error("Loading code in runtime '" + host.runtime + "' is not supported."));
                                        }
                                    }
                                    if (ext == "json") {
                                        var json;
                                        try {
                                            json = JSON.parse(data);
                                        }
                                        catch (e) {
                                            error(e);
                                            return;
                                        }
                                        complete(json, dependencies);
                                    }
                                    if (ext == "css") {
                                        if (typeof document !== "undefined") {
                                            data += "\r\n/*# sourceURL=http://" + (pkxVolume.pkx.id + resource) + "*/";
                                            var style = document.createElement("style");
                                            style.rel = "stylesheet";
                                            style.type = "text/css";
                                            if (style.styleSheet) {
                                                style.styleSheet.cssText = data;
                                            }
                                            else {
                                                style.appendChild(document.createTextNode(data));
                                            }
                                            try {
                                                document.head.appendChild(style);
                                            }
                                            catch (e) {
                                                error(e);
                                                return;
                                            }
                                        }
                                        complete(data, dependencies);
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
    
                    // find a processor
                    for (var p in processors) {
                        var promise = processors[p](selector);
                        if (!promise) {
                            continue;
                        }
                        promise.then(fetchModule, error);
                        return;
                    }
    
                    // no processor was found
                    try {
                        selector = new self.PKXSelector(request, true);
                    }
                    catch(e) {
                        error(e);
                        return;
                    }
                    fetchModule();
                }
    
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
                        type && string && object && array && boolean && validate) {
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
                var moduleCode = "(function(using, require) {\n";
                if (isEmbedded) {
                    // add configuration
                    configuration = configuration? "\ndefine.parameters.configuration = " + JSON.stringify(configuration, null, Array(INDENT_OFFSET + 1).join(" ")) + ";" : "";
    
                    // add package dependency
                    depStr += "\ndefine.parameters.dependencies = [ \"" + DEPENDENCY_PKX + "\", \"module\", \"" + DEPENDENCY_CONFIG + "\" ];";
                    depStr += "\ndefine.parameters.dependencies[0] = define.parameters.pkx;";
    
                    if (dependencies) {
                        for (var t = 0; t < dependencies.length; t++) {
                            var dep = dependencies[t];
                            if (dep) {
                                var resName = dep + "/";
                                if (Object.prototype.toString.call(dep) === "[object Object]") {
                                    resName = dep.package + (dep.resource ? dep.resource : "/");
                                }
                                depStr += "\ndefine.parameters.dependencies.push(define.cache.get(\"" + resName +  "\"));";
                            }
                        }
                    }
    
                    moduleCode += "define.parameters = {};\n" + (isEmbedded? "define.parameters.wrapped = true;\n" : "") + "define.parameters.system = \"" + PKX_SYSTEM + "\";\ndefine.parameters.id = \"" + pkx.id + resourceId + "\";\ndefine.parameters.pkx = " + descriptor + ";" + depStr + configuration + "\n";
                }
                moduleCode += "using = define.getUsing(define.parameters.id);\n";
                moduleCode += "require = define.getRequire(define.parameters.id, require);\n";
                moduleCode += code + "\n})(typeof using != \"undefined\"? using : null, typeof require != \"undefined\"? require : null);" + (addSourceMap? "\n//# sourceURL=http://" + (sourceMapName? sourceMapName : (pkx.id + resourceId)) : "");
    
                // add code indent to make it pretty
                var moduleLines = moduleCode.split(/\r*\n/);
                var indentWhiteSpace = Array(INDENT_OFFSET + 1).join(" ");
    
                // add header to make it pretty
                if (isEmbedded) {
                    moduleCode = "/////////////////////////////////////////////////////////////////////////////////////\n";
                    moduleCode += "//\n";
                    moduleCode += "// module '" + pkx.id + resourceId + "'\n";
                    moduleCode += "//\n";
                    moduleCode += "/////////////////////////////////////////////////////////////////////////////////////\n";
                    moduleCode += moduleLines[0] + "\n";
                    for (var l=1;l<moduleLines.length - (addSourceMap? 2 : 1);l++) {
                        moduleCode += indentWhiteSpace + moduleLines[l] + "\n";
                    }
                    if (addSourceMap) {
                        moduleCode += moduleLines[moduleLines.length - 2] + "\n";
                    }
                    moduleCode += moduleLines[moduleLines.length - 1] + "\n";
                }
    
                return moduleCode;
            };
            this.load.addRepository = function(name, url) {
                if (url.substr(url.length - 1) != "/") {
                    url += "/";
                }
    
                if (!name || name == "") {
                    if (self.repositoryURL) {
                        throw new Error(self.ERROR_INVALID_REPOSITORY, "Main repository is already registered to '" + repositories[name] + "'.");
                    }
                    self.repositoryURL = url;
                    return;
                }
    
                if (repositories[name]) {
                    throw new Error(self.ERROR_INVALID_REPOSITORY, "Repository '" + name + "' is already registered to '" + repositories[name] + "'.");
                }
                repositories[name] = url;
            };
            this.load.addRequestProcessor = function(name, fn) {
                if (processors[name]) {
                    throw new Error(self.ERROR_INVALID_REQUEST_PROCESSOR, "A processor with name '" + name + "' is already registered.");
                }
                processors[name] = fn;
            };
    
            this.PKXSelector = function(selector, validateId) {
                var own = this;
                var errName = self.ERROR_INVALID_PKX_SELECTOR;
                var addDefaultResource = false;
                var valid = true; // indicates invalid naming pattern
                var majorVersion = null;
                var minorVersion = null;
                var patchVersion = null;
                var repository = null;
    
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
                // when a slash is detected trim off pkx extension if present
                var parts = (idxSlash >= 0? selector.package.substring(idxSlash + 1, selector.package.lastIndexOf(self.PKX_FILE_EXTENSION) == selector.package.length - self.PKX_FILE_EXTENSION.length? selector.package.length - self.PKX_FILE_EXTENSION.length: null) : selector.package).split(".");
                if (parts.length > 0 && parts[parts.length - 1].substr(parts[parts.length - 1].length - 1) == "/") {
                    parts[parts.length - 1] = parts[parts.length - 1].substr(0,parts[parts.length - 1].length - 1);
                }
                // if package does not contain any slashes, assume it is an id
                if (selector.package.indexOf("/") == -1) {
                    if (!isNaN(parts[parts.length - 1]) && !isNaN(parts[parts.length - 3])) {
                        patchVersion = isNaN(parts[parts.length - 1]);
                    }
                    minorVersion = parts[parts.length - (isNaN(parts[parts.length - 3]) ? 1 : 2)];
                    if (isNaN(minorVersion)) {
                        minorVersion = null;
                        valid = false;
                    }
                    majorVersion = parts[parts.length - (isNaN(parts[parts.length - 3]) ? 2 : 3)];
                    if (isNaN(majorVersion)) {
                        majorVersion = null;
                        valid = false;
                    }
                }
                if (validateId && !valid) {
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
                var vers = {};
                Object.defineProperty(vers, "major", {
                    get: function() {
                        return majorVersion;
                    }
                });
                Object.defineProperty(vers, "minor", {
                    get: function() {
                        return minorVersion;
                    }
                });
                Object.defineProperty(vers, "patch", {
                    get: function() {
                        return patchVersion;
                    }
                });
                Object.defineProperty(this, "version", {
                    get: function() {
                        return vers;
                    }
                });
                Object.defineProperty(this, "id", {
                    get: function() {
                        return own.package + (addDefaultResource? "/" : (own.resource || ""));
                    }
                });
                Object.defineProperty(this, "name", {
                    get: function() {
                        // get full name (strip version numbers from id string)
                        var name = "";
                        var nameParts = own.package.split(".");
                        for (var i = 0; i < nameParts.length; i++) {
                            if (isNaN(nameParts[i])) {
                                name += (name != "" ? "." : "") + nameParts[i];
                            }
                        }
                        return name;
                    }
                });
                Object.defineProperty(this, "repository", {
                    get: function() {
                        return repository;
                    }
                });
                Object.defineProperty(this, "uri", {
                    get: function() {
                        return uri;
                    },
                    set: function(u) {
                        if (typeof u === "string") {
                            uri = io.URI.parse(replaceVariables(u));
                        }
                        else if ((u instanceof io.URI)) {
                            uri = u;
                        }
                        else {
                            throw new Error("The URI should be of type 'String' or 'URI'.");
                        }
                    }
                });
                Object.defineProperty(this, "isArchive", {
                    get: function() {
                        return own.package.lastIndexOf("/") != own.package.length - 1;
                    }
                });
                this.package = selector.package;
                this.resource = selector.resource;
                this.target = selector.target;
                this.raw = selector.raw || false;
                this.wrap = selector.wrap || false;
                this.system = selector.system;
                this.optional = selector.optional || false;
                this.upgradable = selector.upgradable || (using? using.UPGRADABLE_NONE : null);
                this.ignoreDependencies = selector.ignoreDependencies || false;
                this.configuration = selector.configuration || null;
    
                this.parseURI = function(u) {
                    return io.URI.parse(replaceVariables(u));
                };
    
                function replaceVariables(u) {
                    // add .pkx extension
                    var uriPKXName = own.package + (own.package.lastIndexOf(self.PKX_FILE_EXTENSION) != own.package.length - self.PKX_FILE_EXTENSION.length && own.isArchive ? self.PKX_FILE_EXTENSION : "");
                    // replace variables
                    return u.replace(/\$NAME/g, own.name)
                        .replace(/\$PATCH/g, patchVersion)
                        .replace(/\$MINOR/g, minorVersion)
                        .replace(/\$MAJOR/g, majorVersion)
                        .replace(/\$PACKAGE/g, uriPKXName)
                        .replace(/\$ID/g, own.package);
                }
    
                // find repository
                var protocolDetected = selector.package.indexOf("://") != -1;
                if (protocolDetected || ((host.runtime == host.RUNTIME_NODEJS || host.runtime == host.RUNTIME_NWJS) && selector.package.indexOf(".") == 0)) {
                    repository = {"namespace": "", "url": ""};
                }
                else {
                    var reposSorted = version.sort(repositories, "desc");
                    for (var r in reposSorted) {
                        if (selector.package.indexOf(reposSorted[r] + ".") == 0) {
                            repository = {"namespace": reposSorted[r], "url": repositories[reposSorted[r]]};
                        }
                    }
                    if (!repository) {
                        repository = {"namespace": "", "url": self.repositoryURL};
                    }
                    repository.url = replaceVariables(repository.url);
                }
    
                try {
                    if ((host.runtime == host.RUNTIME_NODEJS || host.runtime == host.RUNTIME_NWJS) && !protocolDetected) {
                        var cwd = process.cwd();
                        cwd = cwd.indexOf("/") == 0? cwd : ("/" + cwd);
                        own.uri = require("url").resolve(repository.url != ""? repository.url : cwd + require("path").sep, selector.package);
                        //overriding the scheme for nw.js
                        if (own.uri.scheme == "chrome-extension") {
                            own.uri.scheme = "file";
                            own.uri.authority.userInfo = null;
                            own.uri.authority.host = null;
                        }
                    }
                    else {
                        own.uri = repository.url + selector.package;
                    }
                }
                catch (e) {
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
                validate(descriptor.name, string, errName)
                    .allow(name, string.DOT)
                    .when(descriptor.name != "")
                    .notNull();
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
                validate(descriptor.pkxDependencies, array, errName)
                    .allow(array.STRING, array.OBJECT);
                validate(descriptor.target, object, errName);
    
                this.name = descriptor.name;
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
                        return own.name + "." + own.version;
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
            this.PKXVolume = function(uri, options) {
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
                options = options || {};
    
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
                            if (options.headers && stream.headers) {
                                stream.headers = options.headers;
                            }
                            var gzipReader = new gzip.GZipReader(stream);
                            gzipReader.then(function() {
                                for(var t=0;t<gzipReader.metadata.tags.length;t++) {
                                    if (gzipReader.metadata.tags[t].type == gzip.GZIP_TAG_TYPE_OBJECT) {
                                        stream = gzipReader.getGZipObjectStream(gzipReader.metadata.tags[t].value);
                                        openTar();
                                        return;
                                    }
                                }
                                error(new Error(self.ERROR_INVALID_PKX_VOLUME, "The gzip stream does not seem to contain a file."));
                            }, openTar);
    
                            function openTar(err) {
                                    if (err && err.name != io.ERROR_UNSUPPORTED_STREAM) {
                                    error(err);
                                    return;
                                }
                                // what is returned here is a stream that is in the tar format.
                                tarVolume = new tar.TarVolume(stream, packageId, options.strip? { "strip" : options.strip } : null);
                                tarVolume.events.addEventListener(io.EVENT_VOLUME_INITIALIZATION_PROGRESS, progress);
                                tarVolume.then(function (volume) {
                                    volume.open("/" + self.PKX_DESCRIPTOR_FILENAME).then(function (s) {
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
    
                                            pkxJSONStream.close().then(function () {
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
    
                                                registerVolume();
    
                                                resolve(own);
                                            }, error);
                                        }, error);
                                    }, error);
                                }, error);
                            }
                        }, error);
                    }
                    else {
                        uri.path += self.PKX_DESCRIPTOR_FILENAME;
                        uri.open().then(function(s) {
                            if (options.headers && s.headers) {
                                s.headers = options.headers;
                            }
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
                                    //own.close = Function.prototype.bind.call(volume.close, volume); //TODO - implement close
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
    
                                    registerVolume();
    
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
                        else if (e.name == self.ERROR_INVALID_PKX_VOLUME) {
                            err = e;
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
    
                function registerVolume() {
                    if (!volumes[own.pkx.id]) {
                        volumes[own.pkx.id] = own;
                    }
                    else {
                        volumes[own.pkx.id + " <" + volumes.length + ">"] = own;
                        //if (console) {
                        //    console.warn("A PKXVolume with id '" + own.pkx.id + "' was already mounted and still present in cache.");
                        //}
                    }
                }
    
                function notReady() {
                    return new Promise(function(resolve, refuse) { refuse(io.ERROR_VOLUME_NOT_READY); });
                }
    
                this.ready = function() {
                    return new Promise(function(resolve, refuse) { 
                        own.events.addEventListener(io.EVENT_VOLUME_STATE_CHANGED, function(sender, state) {
                            if (state == io.VOLUME_STATE_READY) { 
                                var origThen = own.then;
                                own.then = null;
                                resolve(own);
                                own.then = origThen;
                            } else { 
                                    refuse(io.ERROR_VOLUME_NOT_READY);
                            }
                        })
                    });
                }
            };
    
            this.uri = {};
            this.uri.parse = function(uri) {
                if(string.isURL(uri)) {
                    if (uri.length >= 5 && uri.substr(0,5) == self.PROTOCOL_PKX + "://") {
                        return new io.URI(uri, self);
                    }
                }
            };
            this.uri.open = function(uri, opt_access) {
                if (uri && type.isString(uri)) {
                    uri = self.uri.parse(uri);
                }
                else if (uri && (typeof uri.scheme== "undefined" || typeof uri.path == "undefined")) {
                    uri = null;
                }
                var idxSlash = uri.path.indexOf("/", 1);
                var volId = uri.path? uri.path.substring(1, idxSlash > -1 ? idxSlash : undefined) : null;
                var resId = uri.path? uri.path.substr(volId.length + 1) : null;
                if (!volumes[volId]) {
                    throw new Error(self.ERROR_INVALID_PKX_VOLUME, "PKXVolume '" + volId + "' is not mounted.");
                }
                return volumes[volId].open(resId, opt_access);
            };
            this.uri.exists = function(uri) {
                return new Promise(function(resolve, reject) {
                    reject(new Error(io.ERROR_UNSUPPORTED_OPERATION, "The cc.pkx module does not support querying files from pkx volumes."));
                });
            };
            this.uri.toString = function(uri) {
                return uri.toString();
            };
            this.uri.delete = function(uri) {
                return new Promise(function(resolve, reject) {
                    reject(new Error(io.ERROR_UNSUPPORTED_OPERATION, "The cc.pkx module does not support deleting files from pkx volumes."));
                });
            };
            this.uri.getTemp = function() {
                throw new Error(io.ERROR_UNSUPPORTED_OPERATION, "The cc.pkx module does not support creating temp files.");
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
    
                try {
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
                    gzip = require("./cc.io.format.gzip");
                    version = require("./cc.version");
                }
                catch(e) {
                    if (e.code != "MODULE_NOT_FOUND") {
                        throw e;
                    }
                }
    
                init = true;
            }
            if (!init && typeof define != "undefined" && define.using) {
                try {
                    type = define.cache.get("cc.type.0", "minor").factory();
                    event = define.cache.get("cc.event.0", "minor").factory();
                    validate = define.cache.get("cc.validate.0", "minor").factory();
                    string = define.cache.get("cc.string.0", "minor").factory();
                    object = define.cache.get("cc.object.0", "minor").factory();
                    boolean = define.cache.get("cc.boolean.0", "minor").factory();
                    array = define.cache.get("cc.array.0", "minor").factory();
                    log = define.cache.get("cc.log.0", "minor").factory();
                    host = define.cache.get("cc.host.0", "minor").factory();
                    io = define.cache.get("cc.io.0", "minor").factory();
                    tar = define.cache.get("cc.io.format.tar.0", "minor").factory();
                    gzip = define.cache.get("cc.io.format.gzip.0", "minor").factory();
                    version = define.cache.get("cc.version.0", "minor").factory();
    
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
    
            this.PKXVolume.prototype = io.Volume;
            io.protocols.register({
                "protocol": this.PROTOCOL_PKX,
                "module": self
            });
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
            if (typeof module === "object" && module.exports && typeof require != "undefined" && typeof require.main != "undefined" && require.main !== module) {
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
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
