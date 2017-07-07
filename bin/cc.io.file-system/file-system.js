/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.io.file-system.0.1.7/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.io.file-system.0.1.7/";
    define.parameters.pkx = {
        "name": "cc.io.file-system",
        "version": "0.1.7",
        "title": "IO File system Module",
        "description": "IO module that implements file protocol support.",
        "license": "Apache-2.0",
        "main": "file-system.js",
        "dependencies": {
            "drivelist": "5.0.22"
        },
        "pkxDependencies": [
            "cc.event.0.1",
            "cc.host.0.1",
            "cc.string.0.1",
            "cc.type.0.1",
            "cc.io.0.1"
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.event.0.1/", "patch"));
    define.parameters.dependencies.push(define.cache.get("cc.host.0.1/", "patch"));
    define.parameters.dependencies.push(define.cache.get("cc.string.0.1/", "patch"));
    define.parameters.dependencies.push(define.cache.get("cc.type.0.1/", "patch"));
    define.parameters.dependencies.push(define.cache.get("cc.io.0.1/", "patch"));
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.io.filesystem
    //
    //    Library for working with primitives.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    /////////////////////////////////////////////////////////////////////////////////////////////
    
    (function() {
        function FileSystem(pkx, module) {
            var self = this;
    
            var type, event, io, string, host;
            if (typeof require === "function") {
                type = require("./cc.type");
                event = require("./cc.event");
                string = require("./cc.string");
                io = require("./cc.io");
                host = require("./cc.host");
            }
    
            var drivelist = null;
            var fs = null;
            var nodePath = null;
            if (typeof process === "object" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined" && typeof require !== "undefined") {
                fs = require("fs");
                nodePath = require("path");
            }
            else {
                return "The runtime does not support file system access.";
            }
    
            function createPath(path) {   
                return new Promise(function(resolve, reject) {
                    function mkdir(dir) {
                        var next;
                        var idx = path.indexOf(nodePath.sep, dir.length + 1);
                        if (idx >= 0) {
                            next = path.substr(0, idx);
                        }
                        else {
                            next = path;
                        }
    
                        if (!dir) {
                            mkdir(next);
                            return;
                        }
    
                        if (path == dir) {
                            resolve();
                            return;
                        }
    
                        fs.mkdir(dir, function(err) {
                            if (err && err.code != "EEXIST") {
                                reject(new Error("Could not create directory '" + dir + "'. Code: '" + err.code + "'."));
                                return;
                            }
                            
                            // this conditional block would also create the last part in a path (this could be a filename, that's why it is disabled)
                            //if (path == dir) {
                            //    resolve();
                            //}
                            //else {
                                mkdir(next);
                            //}
                        });
                    }
    
                    mkdir("");
                });
            }
    
            this.PROTOCOL_FILESYSTEM = "file";
    
            this.FORMAT_PATH_WINDOWS = "format-path-windows";
            this.FORMAT_PATH_UNIX = "format-path-unix";
    
            this.FileSystemStream = function(handle, path, access) {
                if (!handle) {
                    return null;
                }
                var own = this;
    
                var written = false;
                var closed = false;
    
                this.getName = function() {
                    if (path && path.lastIndexOf("/") >= 0) {
                        return path.substr(path.lastIndexOf("/"));
                    }
                    else {
                        return path;
                    }
                };
                this.getLength = function()
                {
                    return new Promise(function(resolve, reject) {
                        if (closed) {
                            reject(new Error(io.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        fs.stat(path, function(err,stat) {
                            if (err) {
                                if (err.code == "ENOENT") {
                                    reject(new Error(io.ERROR_FILE_NOT_FOUND, ""));
                                }
                                else if (err.code == "EACCES") {
                                    reject(new Error(io.ERROR_ACCESS_DENIED, ""));
                                }
                                else {
                                    reject(err);
                                }
                                return;
                            }
    
                            resolve(stat["size"]);
                        });
                    });
                };
                this.read = function (len, position)
                {
                    if (!position) {
                        position = 0;
                    }
    
                    return new Promise(function(resolve, reject) {
                        if (closed) {
                            reject(new Error(io.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        if (len == null) {
                            own.getLength().then(function (length) {
                                doRead(length - position);
                            }, function(err) {
                                reject(err);
                            });
                        }
                        else {
                            doRead(len);
                        }
    
                        function doRead(len) {
                            var nBuf = new Buffer(len);
                            var nPos = position;
                            position += len;
                            fs.read(handle, nBuf, 0, len, nPos, function(err, bytesRead, buffer) {
                                if (err) {
                                    if (err.code == "ENOENT") {
                                        reject(new Error(io.ERROR_FILE_NOT_FOUND, ""));
                                    }
                                    else if (err.code == "EACCES") {
                                        reject(new Error(io.ERROR_ACCESS_DENIED, ""));
                                    }
                                    else {
                                        reject(err);
                                    }
                                    return;
                                }
                                resolve(buffer.toUint8Array());
                            });
                        }
                    });
                };
                this.write = function(data, position) {
                    if (!position) {
                        position = 0;
                    }
    
                    return new Promise(function(resolve, refuse) {
                        if (closed) {
                            refuse(new Error(io.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        if (!((typeof Buffer != "undefined" && data instanceof Buffer) || (typeof Uint8Array != "undefined" && data instanceof Uint8Array) || type.isString(data))) {
                            refuse("Invalid parameter 'data'. The parameter should be of type 'Buffer', 'Uint8Array' or 'String'.");
                            return;
                        }
    
                        var len = data.length;
                        var lastError = null;
    
                        try {
                            var pos = position;
                            if (type.isString(data) && pos > 0 && access == io.ACCESS_OVERWRITE && !written) {
                                data = " ".repeat(position) + data;
                                pos = 0;
                            }
    
                            var streamOptions = { "fd" : handle, "autoClose": false, "start" : pos };
                            //if (type.isString(data)) {
                            //    streamOptions.decodeStrings = false;
                            //}
                            var writeStream = fs.createWriteStream(null, streamOptions);
                            writeStream.on("error", function(err) {
                                lastError = err;
                            });
    
                            writeStream.write(data instanceof Uint8Array? new Buffer(data) : data, null, function(err) {
                                //check if errors occurred since last call, then reset errors
                                if (lastError) {
                                    if (lastError.code == "ENOENT") {
                                        refuse(new Error(io.ERROR_FILE_NOT_FOUND, ""));
                                    }
                                    else if (lastError.code == "EACCES") {
                                        refuse(new Error(io.ERROR_ACCESS_DENIED, ""));
                                    }
                                    else {
                                        refuse(lastError);
                                    }
                                    return;
                                }
                                if (err) {
                                    if (err.code == "ENOENT") {
                                        refuse(new Error(io.ERROR_FILE_NOT_FOUND, ""));
                                    }
                                    else if (err.code == "EACCES") {
                                        refuse(new Error(io.ERROR_ACCESS_DENIED, ""));
                                    }
                                    else {
                                        refuse(err);
                                    }
                                    return;
                                }
                                written = true;
                                position += len;
                                writeStream.end();
                                resolve();
                            });
                        }
                        catch(e) {
                            refuse(new Error(e));
                        }
                    });
                };
                this.close = function ()
                {
                    return new Promise(function(resolve, reject) {
                        if (closed) {
                            reject(new Error(io.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        fs.close(handle, function(err) {
                            if (err) {
                                if (err.code == "ENOENT") {
                                    reject(new Error(io.ERROR_FILE_NOT_FOUND, ""));
                                }
                                else if (err.code == "EACCES") {
                                    reject(new Error(io.ERROR_ACCESS_DENIED, ""));
                                }
                                else {
                                    reject(err);
                                }
                                return;
                            }
                            closed = true;
                            resolve();
                        });
                    });
                };
    
                this.events = new event.Emitter(this);
            };
            this.FileSystemStream.open = function(path, opt_access, opt_create) {
                return new Promise(function(resolve, reject) {
                    var access = "";
                    var attemptCreate;
                    if (!fs) {
                        reject(new Error(io.ERROR_RUNTIME, "The runtime does not support access to the local file system."));
                        return;
                    }
                    switch (opt_access) {
                        /*                    case io.ACCESS_APPEND:
                         opt_access = "a";
                         break;
                         case io.ACCESS_APPEND_CREATE:
                         opt_access = "a+";
                         break;
                         case io.ACCESS_WRITE:
                         opt_access = "w";
                         break;
                         case io.ACCESS_WRITE_CREATE:
                         opt_access = "w+";
                         break;
                         default:
                         opt_access = "r";
                         break;*/
                        case io.ACCESS_MODIFY:
                            access = "r+";
                            break;
                        case io.ACCESS_OVERWRITE:
                            access = "w+";
                            break;
                        default:
                            access = "r";
                            break;
                    }
                    fs.lstat(path, function(err) {
                        if (err)
                        {
                            if (err.code == "ENOENT" && (opt_access == io.ACCESS_MODIFY || opt_create)) {
                                access = "w+";
                                openFile();
                            }
                            else {
                                handleError(err);
                            }
                        }
                        else {
                            openFile();
                        }
                    });
                    function openFile() {
                        fs.open(path, access, function (err, fd) {
                            if (err) {
                                handleError(err);
                                return;
                            }
                            if (!fd) {
                                reject(new Error(io.ERROR_RUNTIME, "The host platform did not return a file handle."));
                                return;
                            }
                            resolve(new self.FileSystemStream(fd, path, opt_access));
                        });
                    }
    
                    function handleError(err) {
                        if (err) {
                            if (err.code == "ENOENT") {
                                if (opt_create && !attemptCreate) {
                                    attemptCreate = true;
                                    createPath(path).then(function() {
                                        openFile();
                                    }, function() {
                                        reject(new Error(io.ERROR_FILE_NOT_FOUND, ""));
                                    });
                                }
                            }
                            else if (err.code == "EACCES") {
                                reject(new Error(io.ERROR_ACCESS_DENIED, ""));
                            }
                            else {
                                reject(err);
                            }
                        }
                    }
                });
            };
            this.FileSystemStream.prototype = io.Stream;
    
            this.FileSystemVolume = function(driveInfo, drivePath) {
                //append slash if absent
                if (drivePath && type.isString(drivePath) && drivePath.length > 0 && drivePath.substr(drivePath.length - 1) != "/") {
                    drivePath += "/";
                }
    
                this.err = [];
                this.name = driveInfo.description; //TODO - generate name depending on Windows or not -> if windows, take mount point 'C:' and description ('Data Traveler 2.0')
                this.protocol = self.PROTOCOL_FILESYSTEM;
                this.description = driveInfo.description;
                this.size = driveInfo.size;
                this.state = io.VOLUME_STATE_READY;
                this.type = driveInfo.system? io.VOLUME_TYPE_FIXED : io.VOLUME_TYPE_REMOVABLE;
                this.scope = io.VOLUME_SCOPE_LOCAL;
                this.class = io.VOLUME_CLASS_PERSISTENT;
                this.readOnly = driveInfo.protected;
                this.localId = "";//crypt.guid(crypt.md5(this.name + "/" + this.description + "/" + this.device + "/" + drivePath));
    
                this.query = function(path) {
                    //show refuse with a file not found error if the path does not exist, and a file object if it does.
                    return new Promise(function(resolve, reject) {
                        if (!path) {
                            path = "";
                        }
                        else if (!type.isString(path)) {
                            reject(new Error("Invalid type '" + type.getType(path) + "' specified for path parameter."));
                        }
                        else if (path.substr(0,1) == "/") {
                            path = path.substr(1);
                        }
                        var fullPath = drivePath + path;
                        fs.readdir(fullPath, function(err, files) {
                            if (err) {
                                if (err.code == "ENOENT") {
                                    reject(new Error(io.ERROR_FILE_NOT_FOUND, err));
                                }
                                else {
                                    reject(new Error(err));
                                }
                                return;
                            }
    
                            //enumerate files, create file objects for each entry
                            //TODO - TO IMPLEMENT
                        });
                    });
                };
    
                this.open = function(path, opt_access, opt_create) {
                    return self.uri.open(drivePath + path, opt_access, opt_create);
                };
    
                this.events = new event.Emitter(this);
            };
            this.FileSystemVolume.scan = function() {
                return new Promise(function(resolve, refuse) {
                    try {
                        if (!drivelist) {
                            drivelist = require("drivelist");
                        }
                        //scan drives and register
                        drivelist.list(function (err, list) {
                            if (err) {
                                refuse(err);
                                return;
                            }
                            //DEBUG
                            //console.log(list);
                            for (var i = 0; i < list.length; i++) {
                                for (var m=0;m<list[i].mountpoints.length;m++) {
                                    io.volumes.register(new self.FileSystemVolume(list[i], list[i].mountpoints[m].path));
                                }
                            }
                            resolve();
                        });
                    }
                    catch(e) {
                        refuse(e);
                    }
                });
            };
            this.FileSystemVolume.prototype = io.Volume;
    
            this.uri = {};
            this.uri.parse = function(uri) {
                /*
                 * TYPES
                 *   FILESYSTEM
                 *      OSX, UNIX, LINUX, ...
                 *      /
                 *      WINDOWS
                 *      [DRIVE LETTER]:\
                 *   URL
                 *      ./
                 *      ../
                 *      [PROTOCOL]://[HOSTNAME OR IP]<:[PORT]>/<[PATH]><?[PARAMETERS]>
                 *
                 */
                if(uri && type.isString(uri)) {
                    if ((uri.length >= 1 && uri.substr(0,1) == "/") ||
                        (uri.length >= 3 && uri.substr(1,2) == ":\\")) {
                        return new io.URI(self.PROTOCOL_FILESYSTEM, null, uri.replace(/\\/g, "/"), null, null, self);
                    }
                    if (uri.length >= 7 && uri.substr(0,7) == self.PROTOCOL_FILESYSTEM + "://") {
                        return new io.URI(uri, self);
                    }
                    else if (type.isString(uri)) {// && host.features.includes(host.FEATURE_IO_FILE_SYSTEM)) {
                        if (process && process.cwd) {
                            var path = "/" + process.cwd().replace(/\\/g, "/");
                            if (path.lastIndexOf("/") != path.length - 1) {
                                path += "/";
                            }
    
                            return new io.URI(self.PROTOCOL_FILESYSTEM, null, uri.length > 0 && uri.substr(0,1) == "/"? uri : path + uri, null, null, self);
                        }
                    }
                }
            };
            this.uri.open = function(uri, opt_access, opt_create) {
                if (uri && type.isString(uri)) {
                    uri = self.uri.parse(uri);
                }
                else if (uri && (typeof uri.scheme == "undefined" || typeof uri.path == "undefined")) {
                    uri = null;
                }
                if (!uri) {
                    throw new Error(io.ERROR_URI_PARSE, "");
                }
                return self.FileSystemStream.open(uri.toString((process.platform == "win32" ? self.FORMAT_PATH_WINDOWS : io.FORMAT_PATH), nodePath.sep), opt_access, opt_create);
            };
            this.uri.exists = function(uri) {
                return new Promise(function(resolve, reject) {
                    if (uri && type.isString(uri)) {
                        uri = self.uri.parse(uri);
                    }
                    else if (uri && (typeof uri.scheme == "undefined" || typeof uri.path == "undefined")) {
                        uri = null;
                    }
                    if (!uri) {
                        reject(new Error(io.ERROR_URI_PARSE, ""));
                        return;
                    }
                    fs.lstat(uri.toString(io.FORMAT_PATH, nodePath.sep), function(err, stats) {
                        if (err) {
                            if (err.code == "ENOENT") {
                                resolve();
                            }
                            else if (err.code == "EACCES") {
                                reject(new Error(io.ERROR_ACCESS_DENIED, ""));
                            }
                            else {
                                reject(err);
                            }
                            return;
                        }
    
                        if (stats.isDirectory()) {
                            resolve(io.DIRECTORY);
                        }
                        else {
                            resolve(io.FILE);
                        }
                    });
                });
    
            };
            this.uri.delete = function(uri) {
                return new Promise(function(resolve, reject) {
                    if (uri && type.isString(uri)) {
                        uri = self.uri.parse(uri);
                    }
                    else if (uri && (typeof uri.scheme == "undefined" || typeof uri.path == "undefined")) {
                        uri = null;
                    }
                    if (!uri) {
                        reject(new Error(io.ERROR_URI_PARSE, ""));
                        return;
                    }
                    fs.unlink(uri.toString(io.FORMAT_PATH, nodePath.sep), function(err) {
                        if (err) {
                            if (err.code == "ENOENT") {
                                reject(new Error(io.ERROR_FILE_NOT_FOUND, ""));
                            }
                            else if (err.code == "EACCES") {
                                reject(new Error(io.ERROR_ACCESS_DENIED, ""));
                            }
                            else {
                                reject(err);
                            }
                            return;
                        }
                        resolve();
                    });
                });
            };
            this.uri.toString = function(uri, opt_format) {
                if (uri && type.isString(uri)) {
                    uri = self.uri.parse(uri);
                }
                else if (uri && (typeof uri.scheme == "undefined" || typeof uri.path == "undefined")) {
                    uri = null;
                }
                if (!uri) {
                    return "";
                }
                switch (opt_format) {
                    case self.FORMAT_PATH_UNIX:
                        return uri.path;
                    case self.FORMAT_PATH_WINDOWS:
                        return uri.path.substr(1).replace(/\//g, "\\");
                    default:
                        return uri.toString();
                    //only supports hostname
                    //prepend slash to path
                    //var p = uri.path || "";
                    /*if (p.substr(0,1) !== "/") {
                     p = "/" + p;
                     }*/
                    //return encodeURI(uri.protocol + "://" + (uri.hostname ? uri.hostname : "") + "/" + p);
                }
            };
            this.uri.getTemp = function() {
                try {
                    var path = require("os").tmpdir();
                    var pathSep = nodePath.sep;
                    if (path.substr(path.length - 1) != pathSep) {
                        path += pathSep;
                    }
                    return self.uri.parse(self.PROTOCOL_FILESYSTEM + ":///" + path);
                }
                catch(e) {
                    return null;
                }
            };
    
            //init
            io.protocols.register({
                "protocol": this.PROTOCOL_FILESYSTEM,
                "module": self,
                "formats": [
                    self.FORMAT_PATH_UNIX,
                    self.FORMAT_PATH_WINDOWS
                ]
            });
    
            if (!module || !module.parameters.wrapped) {
                self.FileSystemVolume.scan();
            }
        }
    
        var singleton;
        (function (obj, factory) {
            var supported = false;
            if (typeof define === "function" && (define.amd || define.using)) {
                define(factory);
    
                if (define.using) {
                    // create instance on define
                    define.cache.get().factory();
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
            singleton = new (Function.prototype.bind.apply(FileSystem, arguments));
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
