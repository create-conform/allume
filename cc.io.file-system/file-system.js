/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.io.file-system.1.1.4/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function() {
    var require = define.getRequire("cc.io.file-system.1.1.4/");
    define.parameters = {};
    define.parameters.system = "pkx";
    define.parameters.id = "cc.io.file-system.1.1.4/";
    define.parameters.pkx = {
        "company": "cc",
        "product": "",
        "name": "io",
        "component": "file-system",
        "version": "1.1.4",
        "title": "IO File system Module",
        "description": "IO module that implements file protocol support.",
        "bugs": null,
        "license": "Apache-2.0",
        "author": null,
        "contributors": null,
        "main": "file-system.js",
        "dependencies": [
            "drivelist"
        ],
        "pkxDependencies": [
            "cc.event.1.0",
            "cc.host.1.0",
            "cc.string.1.0",
            "cc.type.1.0",
            "cc.io.1.0"
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
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
        function FileSystem() {
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
                drivelist = require("drivelist");
            }
            else {
                throw "The runtime does not support file system access.";
            }
    
            this.PROTOCOL_FILESYSTEM = "file";
    
            this.FORMAT_PATH_WINDOWS = "format-path-windows";
            this.FORMAT_PATH_UNIX = "format-path-unix";
    
            this.FileSystemStream = function(handle, path, access) {
                if (!handle) {
                    return null;
                }
                var own = this;
    
                var position = 0;
                var seek_origin = io.SEEKORIGIN_BEGIN;
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
                this.getPosition = function()
                {
                    if (closed) {
                        throw new Error(io.ERROR_STREAM_CLOSED, "");
                    }
                    return position;
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
                this.seek = function (pos, origin)
                {
                    if (origin != null)
                    {
                        seek_origin = origin;
                    }
    
                    return new Promise(function(resolve, refuse) {
                        if (closed) {
                            refuse(new Error(io.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        switch (seek_origin) {
                            case io.SEEKORIGIN_BEGIN:
                                position = pos;
                                break;
                            case io.SEEKORIGIN_CURRENT:
                                position += pos;
                                break;
                            case io.SEEKORIGIN_END:
                                position = own.getLength().then(function(len) {
                                    position = len - pos;
                                    resolve();
                                }, function(err) {
                                    refuse(err);
                                });
                                return;
                            default:
                                refuse(new Error("Unsupported seek origin '" + seek_origin + "'."));
                                return;
                        }
    
                        resolve();
                    });
                };
                this.read = function (len)
                {
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
                this.write = function(data) {
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
            this.FileSystemStream.open = function(path, opt_access) {
                return new Promise(function(resolve, reject) {
                    var access = "";
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
                    if (opt_access == io.ACCESS_MODIFY) {
                        fs.lstat(path, function(err) {
                            if (err)
                            {
                                if (err.code == "ENOENT") {
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
                    }
                    else {
                        openFile();
                    }
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
                                reject(new Error(io.ERROR_FILE_NOT_FOUND, ""));
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
                this.localId = //crypt.guid(crypt.md5(this.name + "/" + this.description + "/" + this.device + "/" + drivePath));
    
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
    
                this.open = function(path, opt_access) {
                    return self.uri.open(drivePath + path, opt_access);
                };
    
                this.events = new event.Emitter(this);
            };
            this.FileSystemVolume.scan = function() {
                return new Promise(function(resolve, refuse) {
                    try {
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
                        return new io.URI(uri);
                    }
                    else if (type.isString(uri)) {// && host.features.includes(host.FEATURE_IO_FILE_SYSTEM)) {
                        if (process && process.cwd) {
                            var path = typeof __dirname != "undefined"? __dirname : "";
                            if (__filename == "[stdin]") {
                                path = process.cwd;
                            }
                            path = path.replace(/\\/g, "/");
                            if (path.lastIndexOf("/") != path.length - 1) {
                                path += "/";
                            }
    
                            return new io.URI(self.PROTOCOL_FILESYSTEM, null, uri.length > 0 && uri.substr(0,1) == "/"? uri : path + uri, null, null, self);
                        }
                    }
                }
            };
            this.uri.open = function(uri, opt_access) {
                if (uri && type.isString(uri)) {
                    uri = self.uri.parse(uri);
                }
                else if (uri && (typeof uri.scheme == "undefined" || typeof uri.path == "undefined")) {
                    uri = null;
                }
                if (!uri) {
                    throw new Error(io.ERROR_URI_PARSE, "");
                }
                return self.FileSystemStream.open(uri.toString((process.platform == "win32" ? self.FORMAT_PATH_WINDOWS : io.FORMAT_PATH), nodePath.sep), opt_access);
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
    
            self.FileSystemVolume.scan();
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
            singleton = new (Function.prototype.bind.apply(FileSystem, arguments));
            return singleton;
        }));
    })();
})();
//# sourceURL=http://cc.io.file-system.1.1.4/file-system.js