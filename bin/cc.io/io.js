/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.io.0.1.6/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.io.0.1.6/";
    define.parameters.pkx = {
        "name": "cc.io",
        "version": "0.1.6",
        "title": "IO Library",
        "description": "Library for reading and writing data.",
        "license": "Apache-2.0",
        "main": "io.js",
        "pkxDependencies": [
            "cc.type.0.1",
            "cc.string.0.1",
            "cc.event.0.1"
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.type.0.1/", "patch"));
    define.parameters.dependencies.push(define.cache.get("cc.string.0.1/", "patch"));
    define.parameters.dependencies.push(define.cache.get("cc.event.0.1/", "patch"));
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.io
    //
    //    Library for reading and writing data.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    /////////////////////////////////////////////////////////////////////////////////////////////
    
    (function() {
        function IO(pkx, module) {
            var self = this;
    
            var type, event, string;
            type = require("./cc.type");
            event = require("./cc.event");
            string = require("./cc.string");
    
            this.FORMAT_URI = "uri";
            this.FORMAT_PATH = "path";
    
            this.DIRECTORY = "io-directory";
            this.FILE = "io-file";
    
            this.ACCESS_READ = "io-access-read";
            this.ACCESS_OVERWRITE = "io-access-overwrite";
            this.ACCESS_MODIFY = "io-access-modify";
    
            this.VOLUME_SCOPE_LOCAL = "io-volume-scope-local";
            this.VOLUME_SCOPE_REMOTE = "io-volume-scope-remote";
            this.VOLUME_CLASS_PERSISTENT = "io-volume-class-persistent";
            this.VOLUME_CLASS_TEMPORARY = "io-volume-class-temporary";
            this.VOLUME_SPEED_UNKOWN = "io-volume-speed-unknown";
            this.VOLUME_SPEED_SLOW = "io-volume-speed-slow";
            this.VOLUME_SPEED_REASONABLE = "io-volume-speed-reasonable";
            this.VOLUME_SPEED_FAST = "io-volume-speed-fast";
            this.VOLUME_SPEED_INSTANT = "io-volume-speed-instant";
            this.VOLUME_STATE_INITIALIZING = "io-volume-state-initializing";
            this.VOLUME_STATE_READY = "io-volume-state-ready";
            this.VOLUME_STATE_ERROR = "io-volume-state-error";
            this.VOLUME_TYPE_FIXED = "io-volume-type-fixed";
            this.VOLUME_TYPE_REMOVABLE = "io-volume-type-removable";
    
            this.OPERATION_STREAM_OPEN = "io-operation-stream-open";
            this.OPERATION_STREAM_CLOSE = "io-operation-stream-close";
            this.OPERATION_STREAM_GET_LENGTH = "io-operation-stream-get-length";
            this.OPERATION_STREAM_READ = "io-operation-stream-read";
            this.OPERATION_STREAM_WRITE = "io-operation-stream-write";
            this.OPERATION_VOLUME_INITIALIZATION = "io-operation-volume-initialization";
    
            this.SEEKORIGIN_BEGIN = 0;
            this.SEEKORIGIN_CURRENT = 1;
            this.SEEKORIGIN_END = 2;
    
            this.EVENT_PROTOCOL_ADDED = "io-event-protocol-added";
            this.EVENT_FORMAT_ADDED = "io-event-format-added";
            this.EVENT_VOLUME_ADDED = "io-event-volume-added";
            this.EVENT_VOLUME_REMOVED = "io-event-volume-removed";
            this.EVENT_VOLUME_STATE_CHANGED = "io-event-volume-state-changed";
            this.EVENT_VOLUME_INITIALIZATION_PROGRESS = "io-event-volume-initialization-progress";
            this.EVENT_STREAM_READ_PROGRESS = "io-event-stream-read-progress";
    
            this.ERROR_UNKNOWN_PROTOCOL = "io-error-unknown-protocol";
            this.ERROR_UNSUPPORTED_URI_FORMAT = "io-error-unsupported-uri-format";
            this.ERROR_UNSUPPORTED_OPERATION = "io-error-unsupported-operation";
            this.ERROR_UNSUPPORTED_STREAM = "io-error-unsupported-stream";
            this.ERROR_FILE_NOT_FOUND = "io-error-file-not-found";
            this.ERROR_VOLUME_NOT_READY = "io-error-volume-not-ready";
            this.ERROR_VOLUME_NOT_FOUND = "io-error-volume-not-found";
            this.ERROR_VOLUME_ALREADY_REGISTERED = "io-error-volume-already-registered";
            this.ERROR_STREAM_CLOSED = "io-error-stream-closed";
            this.ERROR_ACCESS_DENIED = "io-error-access-denied";
            this.ERROR_URI_PARSE = "io-error-uri-parse";
            this.ERROR_RUNTIME = "io-error-runtime";
            this.ERROR_INVALID_URI = "io-error-invalid-uri";
            this.ERROR_INVALID_LENGTH = "io-error-invalid-length";
            this.ERROR_INVALID_JSON_DATA = "io-error-invalid-json-data";
    
            var RE_URI = new RegExp(
                /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/
            );
            var RE_URI_AUTHORITY = new RegExp(
                /^(?!.*\n.*)(?:([^:]*)(?::(.*?))?@)?([^:]*)(?::([^:]*?))?$/
            );
    
            var protocols = {};
            var formats = {};
            var volumes = [];
    
            function unsupported() {
                return new Promise(function (resolve, refuse) {
                    refuse(new Error(self.ERROR_UNSUPPORTED_OPERATION, ""));
                });
            }
    
            this.Stream = {
                objectURL : null,
    
                getAccess : unsupported,
                getName : unsupported,
                getLength : unsupported,
                read : unsupported,
                readAsString : function () {
                    var own = this;
                    return new Promise(function (resolve, refuse) {
                        own.read(null, 0).then(function (bytes) {
                            try {
                                resolve(bytes.toString());
                            }
                            catch (e) {
                                refuse(e);
                            }
                        }, refuse);
                    });
                },
                readAsJSON : function () {
                    var own = this;
                    return new Promise(function (resolve, refuse) {
                        own.readAsString().then(function (str) {
                            try {
                                resolve(JSON.parse(str));
                            }
                            catch (e) {
                                refuse(new Error(self.ERROR_INVALID_JSON_DATA, e));
                            }
                        }, refuse);
                    });
                },
                copyTo : function (stream) {
                    var own = this;
                    return new Promise(function (resolve, refuse) {
                        own.read(null, 0).then(function (bytes) {
                            stream.write(bytes, 0).then(resolve, refuse);
                        }, refuse);
                    });
                },
                write : unsupported,
                getMimeType : function () {
                    var own = this;
                    return new Promise(function (resolve, refuse) {
                        own.read(4, 0).then(function (arr) {
                            try {
                                var header = "";
                                for (var i = 0; i < arr.length; i++) {
                                    header += arr[i].toString(16);
                                }
    
                                //TODO - IMPLEMENT MORE TYPES, GOOD START BELOW
                                //https://github.com/sindresorhus/file-type/blob/master/index.js
                                //http://www.garykessler.net/library/file_sigs.html
    
                                switch (header) {
                                    case "89504e47":
                                        resolve("image/png");
                                        break;
                                    case "47494638":
                                        resolve("image/gif");
                                        break;
                                    case "ffd8ffe0":
                                    case "ffd8ffe1":
                                    case "ffd8ffe2":
                                        resolve("image/jpeg");
                                        break;
                                    default:
                                        //try file extension
                                        var name = own.getName();
                                        if (name) {
                                            var ext = name.substr(name.lastIndexOf("."));
                                            switch (ext) {
                                                case ".svg":
                                                    resolve("image/svg+xml");
                                                    break;
                                                default:
                                                    resolve("unknown");
                                            }
                                        }
                                        break;
                                }
                            }
                            catch (e) {
                                refuse(e);
                            }
                        }, refuse);
                    });
                },
                createObjectURL : function () {
                    var own = this;
    
                    return new Promise(function (resolve, refuse) {
                        if (own.objectUrl) {
                            resolve(own.objectUrl);
                            return;
                        }
    
                        if (typeof URL == "undefined" && typeof btoa == "undefined") {
                            refuse(new Error(self.ERROR_UNSUPPORTED_OPERATION, "The environment does not support creating an object url."));
                            return;
                        }
    
                        own.read(null, 0).then(function (arr) {
                            own.getMimeType().then(function (mimeType) {
                                try {
                                    if (typeof URL !== "undefined" && type.isFunction(URL.createObjectURL)) {
                                        var blob = new Blob([arr], {"type": mimeType});
                                        own.objectUrl = URL.createObjectURL(blob);
                                    }
                                    else {
                                        //UNCOMMENT IF BROKEN LATER -> replaced by type.toString() prototype
                                        //code below duplicated from toString() method, for optimizing speed
                                        /*var str = "";
                                         var len = bytes.length;//bytes.byteLength;
                                         for (var i = 0; i < len; i++) {
                                         str += String.fromCharCode(bytes[i]);
                                         }*/
                                        own.objectUrl = "data:" + mimeType + ";base64," + btoa(bytes.toString());
                                    }
                                    resolve(own.objectUrl);
                                }
                                catch (e) {
                                    refuse(e);
                                }
                            }, refuse);
                        }, refuse);
                    });
                },
                close : unsupported
            };
    
            this.BufferedStream = function (buffer, name) {
                var own = this;
    
                var closed = false;
    
                //TODO - implement EVENT_STREAM_READ_PROGRESS
    
                this.getName = function () {
                    return name;
                };
                this.getLength = function () {
                    return new Promise(function (resolve, refuse) {
                        closed ? refuse(new Error(self.ERROR_STREAM_CLOSED, "")) : resolve(buffer.length);
                    });
                };
                this.read = function (len, position) {
                    if (!position) {
                        position = 0;
                    }
    
                    return new Promise(function (resolve, refuse) {
                        if (closed) {
                            refuse(new Error(self.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
                        if (len == null) {
                            own.getLength().then(function (length) {
                                doRead(length - position);
                            }, refuse);
                        }
                        else {
                            doRead(len);
                        }
    
                        function doRead(len) {
                            if (len == buffer.length) {
                                resolve(buffer);
                            }
                            else {
                                var nBuf = buffer.subarray(position, position + len);
                                position += len;
                                resolve(nBuf);
                            }
                        }
                    });
                };
                this.write = function (data, position) {
                    if (!position) {
                        position = 0;
                    }
    
                    return new Promise(function (resolve, refuse) {
                        if (closed) {
                            refuse(new Error(self.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        if (data == null) {
                            resolve();
                            return;
                        }
                        if (!((typeof Buffer != "undefined" && data instanceof Buffer) || (typeof Uint8Array != "undefined" && data instanceof Uint8Array) || type.isString(data))) {
                            refuse(new Error("Mandatory parameter 'data' should be of type 'Buffer', 'Uint8Array' or 'String'."));
                            return;
                        }
                        if (!type.isFunction(data.toString)) {
                            refuse(new Error("Mandatory parameter 'data' should have the toString() function."));
                            return;
                        }
                        var newData;
                        var newB;
                        var newLength;
    
                        newData = data instanceof Uint8Array ? data : data.toUint8Array();
                        newLength = position + newData.length;
                        newB = new Uint8Array(newLength);
                        newB.set(buffer, 0);
                        newB.set(newData, position);
    
                        buffer = newB;
                        resolve();
                    });
                };
                this.close = function () {
                    return new Promise(function (resolve, refuse) {
                        if (closed) {
                            refuse(new Error(self.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        buffer = null;
    
                        closed = true;
                        resolve();
                    });
                };
    
                this.events = new event.Emitter(this);
            };
            this.BufferedStream.prototype = self.Stream;
    
            this.SubStream = function (stream, offset, size, name) {
                var own = this;
    
                var closed = false;
    
                //TODO - implement EVENT_STREAM_READ_PROGRESS
    
                this.getName = function () {
                    return name;
                };
                this.getLength = function () {
                    return new Promise(function (resolve, refuse) {
                        closed ? refuse(new Error(self.ERROR_STREAM_CLOSED, "")) : resolve(size);
                    });
                };
                this.read = function (len, position) {
                    if (!position) {
                        position = 0;
                    }
    
                    return new Promise(function (resolve, refuse) {
                        if (closed) {
                            refuse(new Error(self.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        if (len == null) {
                            len = size;
                        }
    
                        if (offset + position + len > offset + size) {
                            len = (offset + size) - (offset + position);
                        }
                        stream.read(len, offset + position).then(resolve, refuse);
                    });
                };
                this.write = function (data, position) {
                    if (!position) {
                        position = 0;
                    }
    
                    return new Promise(function (resolve, refuse) {
                        if (closed) {
                            refuse(new Error(self.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        stream.write(data, offset + position).then(resolve, refuse);
                    });
                };
                this.close = function () {
                    return new Promise(function (resolve, refuse) {
                        if (closed) {
                            refuse(new Error(self.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        closed = true;
                        resolve();
                    });
                };
    
                this.events = new event.Emitter(this);
            };
            this.SubStream.prototype = self.Stream;
    
            this.URI = function (scheme, authority, path, query, fragment, module) {
                var own = this;
    
                var parts;
                if (arguments.length <= 2 && type.isString(scheme) && type.isObject(authority)) {
                    // rfc compliant - https://tools.ietf.org/html/rfc3986#appendix-B
                    parts = RE_URI.exec(scheme);
                    module = authority;
                }
                if (scheme instanceof self.URI) {
                    authority = new self.URIAuthority(scheme.authority.userInfo, scheme.authority.host, scheme.authority.port);
                    path = scheme.path;
                    query = scheme.query;
                    fragment = scheme.fragment;
                    scheme = scheme.scheme;
                }
    
                this.scheme = parts ? parts[2] : scheme;
                this.authority = parts ? parts[4] : authority;
                this.path = parts ? parts[5] : path;
                this.query = parts ? parts[7] : query;
                this.fragment = parts ? parts[9] : fragment;
    
                var initialScheme = own.scheme;
    
                // check if path starts with slash
                if (this.path && this.path.length > 1 && this.path.substr(0, 1) != "/") {
                    throw new Error(self.ERROR_INVALID_URI, "Path '" + this.path + "' does not start with '/'.");
                }
    
                // parse authority data
                if (!(this.authority instanceof self.URIAuthority)) {
                    this.authority = new self.URIAuthority(this.authority);
                }
    
                var UNKNOWN_PROTOCOL_ERROR = "Unknown protocol '" + this.scheme + "://'.";
    
                function getModule() {
                    // module is specified from the parse function. this is a fail-safe
                    if (!module || own.scheme != initialScheme) {
                        if (protocols[own.scheme]) {
                            module = protocols[own.scheme];
                            initialScheme = own.scheme;
                        }
                    }
                    return module;
                }
    
                // returns promise with first parameter stream object when fulfilled
                this.open = function (opt_access, opt_create) {
                    var module = getModule();
                    if (!module) {
                        throw new Error(self.ERROR_UNKNOWN_PROTOCOL, UNKNOWN_PROTOCOL_ERROR);
                    }
                    return new Promise(function (resolve, reject) {
                        try {
                            module.uri.open(own, opt_access, opt_create).then(function (stream) {
                                resolve(stream);
                            }, reject);
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                };
    
                this.exists = function () {
                    var module = getModule();
                    if (!module) {
                        throw new Error(self.ERROR_UNKNOWN_PROTOCOL, UNKNOWN_PROTOCOL_ERROR);
                    }
                    return new Promise(function (resolve, reject) {
                        try {
                            module.uri.exists(own).then(function (type) {
                                resolve(type);
                            }, reject);
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                };
    
                this.delete = function () {
                    var module = getModule();
                    if (!module) {
                        throw new Error(self.ERROR_UNKNOWN_PROTOCOL, UNKNOWN_PROTOCOL_ERROR);
                    }
                    return new Promise(function (resolve, reject) {
                        try {
                            module.uri.delete(own).then(function (type) {
                                resolve(type);
                            }, reject);
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                };
    
                this.toString = function (opt_format, opt_param) {
                    var module = getModule();
                    // rfc compliant - https://tools.ietf.org/html/rfc3986#section-5.3
                    if (!opt_format) {
                        return (own.scheme ? own.scheme + ":" : "") +
                            (own.authority ? "//" + own.authority : "") +
                            (own.path ? own.path : "") +
                            (own.query ? "?" + own.query : "") +
                            (own.fragment ? "#" + own.fragment : "");
                    }
    
                    try {
                        if (opt_format) {
                            if (opt_format == self.FORMAT_PATH) {
                                if (type.isString(opt_param)) {
                                    return own.path.replace(/\//g, opt_param);
                                } else {
                                    return own.path;
                                }
                            }
                            if (!formats[opt_format]) {
                                return "";
                            }
                            return formats[opt_format].uri.toString(own, opt_format);
                        }
                        else if (module) {
                            return module.uri.toString(own);
                        }
                    }
                    catch (e) {
                        //toString() must never fail
                        return "";
                    }
                };
            };
            this.URIAuthority = function (userInfo, host, port) {
                var parts;
                if (arguments.length == 1) {
                    parts = RE_URI_AUTHORITY.exec(userInfo);
                }
    
                this.userInfo = parts ? (parts[1] ? parts[1] + (parts[2] ? ":" + parts[2] : "") : null) : userInfo;
                this.host = parts ? parts[3] : host;
                this.port = parts ? parts[4] : port;
            };
            this.URIAuthority.prototype.toString = function () {
                return (this.userInfo ? this.userInfo + "@" : "") + (this.host ? this.host : "") + (this.port ? ":" + this.port : "");
            };
            this.URI.parse = function (uri, checkSupport) {
                if (string.isURL(uri)) {
                    for (var p in protocols) {
                        if (uri.substr(0, p.length + 3).toLowerCase() == p.toLowerCase() + "://") {
                            return new self.URI(uri, protocols[p]);
                        }
                    }
    
                    // unknown protocol, but valid uri
                    if (!checkSupport) {
                        return new self.URI(uri);
                    }
                }
    
                // probe the given uri for other formats
                for (var f in formats) {
                    var u = formats[f].uri.parse(uri);
                    if (u) {
                        return new self.URI(u.scheme, u.authority, u.path, u.query, u.fragment, formats[f]);
                    }
                }
    
                throw new Error(self.ERROR_UNSUPPORTED_URI_FORMAT, "Unsupported URI format '" + uri + "', no parser was found.");
            };
            this.URI.open = function (uri, opt_access, opt_create) {
                return self.URI.parse(uri).open(opt_access, opt_create);
            };
            this.URI.exists = function (uri) {
                return self.URI.parse(uri).exists();
            };
            this.URI.delete = function (uri) {
                return self.URI.parse(uri).delete();
            };
    
            this.Volume = {
                id : null,
    
                err : [],
                name : null,
                protocol : null,
                size : null,
                description : null,
                type : null,
                class : null,
                scope : null,
                bandwidth : null,
                latency : {
                    "read": {
                        "random": null,
                        "sequential": null
                    },
                    "write": {
                        "random": null,
                        "sequential": null
                    }
                },
                readOnly : null,
    
                speed : null,
    
                then : unsupported,
    
                open : unsupported,
                delete : unsupported,
                exists : unsupported,
                query : unsupported,
                getBytesUsed : unsupported,
                getBytesAvailable : unsupported,
                close : unsupported,
    
                // if implemented, needs to be overwritten
                events : new event.Emitter()
            };
            this.volumes = {};
            this.volumes.get = function (opt_localId, opt_name, opt_type, opt_scope, opt_class, opt_access, opt_size) {
                //TODO - add support for other parameters
                var found = [];
                for (var v in volumes) {
                    if (opt_localId && volumes[v].localId == opt_localId) {
                        found.push(volumes[v]);
                    }
                }
                return found;
            };
            this.volumes.register = function (volume) {
                //TODO - add volume check
                //console.warn(self.EVENT_VOLUME_ADDED, volume);
    
                var exists = false;
                for (var v in volumes) {
                    if (volumes[v] == volume) {
                        exists = true;
                        break;
                    }
                }
                if (exists) {
                    throw new Error(self.ERROR_VOLUME_ALREADY_REGISTERED, "Volume '" + volume.name + "' is already registered.", volume);
                }
    
                volumes.push(volume);
    
                self.Volume.events.fire(self.EVENT_VOLUME_ADDED, volume);
            };
            this.volumes.unRegister = function (volume) {
                //TODO - add volume check
                //console.warn(self.EVENT_VOLUME_REMOVED, volume);
    
                for (var v in volumes) {
                    if (volumes[v] == volume) {
                        volumes.splice(v, 1);
                        self.Volume.events.fire(self.EVENT_VOLUME_REMOVED, volume);
                        return;
                    }
                }
    
                throw new Error(self.ERROR_VOLUME_NOT_FOUND, "Volume '" + volume.name + "' was not registered.", volume);
            };
            this.volumes.events = new event.Emitter(this);
    
            this.protocols = {};
            this.protocols.register = function (config) {
                //check required parameters
                if (!config) {
                    throw "Invalid configuration 'null'.";
                }
                if (typeof config.protocol === "undefined") {
                    throw "Inavlid configuration. The 'protocol' parameter is missing.";
                }
                if (protocols[config.protocol]) {
                    throw "Protocol '" + config.protocol + "://' is already registered.";
                }
                if (typeof config.module === "undefined") {
                    throw "Inavlid configuration. The 'module' parameter is missing.";
                }
                if (typeof config.formats !== "undefined") {
                    if (!type.isArray(config.formats)) {
                        throw "Inavlid configuration. The 'formats' parameter should be of type 'Array'.";
                    }
                    for (var i = 0; i < config.formats.length; i++) {
                        if (!type.isString(config.formats[i])) {
                            throw "Inavlid configuration. The 'formats' parameter should be of type 'Array' that contains object of type 'String'.";
                        }
                        if (formats[config.formats[i]]) {
                            throw "Format '" + config.formats[i] + "' is already registered.";
                        }
                    }
                }
    
                //add protocol to list
                protocols[config.protocol] = config.module;
    
                //add any formats
                if (typeof config.formats !== "undefined") {
                    for (var f = 0; f < config.formats.length; f++) {
                        formats[config.formats[f]] = config.module;
                    }
                }
    
                //after everything is registered, fire events
                self.events.fire(self.EVENT_PROTOCOL_ADDED, config.protocol);
                if (typeof config.formats !== "undefined") {
                    for (f = 0; f < config.formats.length; f++) {
                        self.events.fire(self.EVENT_FORMAT_ADDED, config.formats[f]);
                    }
                }
            };
    
            this.events = new event.Emitter(this);
    
            // node.js polyfill
            if (typeof Buffer != "undefined" && typeof Buffer.prototype.subarray == "undefined") {
                Buffer.prototype.subarray = function (begin, end) {
                    return this.slice(begin, end);
                };
            }
        }
    
        var singleton;
        (function (obj, factory) {
            var supported = false;
            if (typeof define === "function" && (define.amd || define.using)) {
                define(factory);
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
            singleton = new (Function.prototype.bind.apply(IO, arguments));
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
