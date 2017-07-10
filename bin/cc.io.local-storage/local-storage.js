/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.io.local-storage.0.1.8/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.io.local-storage.0.1.8/";
    define.parameters.pkx = {
        "name": "cc.io.local-storage",
        "version": "0.1.8",
        "title": "IO Local Storage Module",
        "description": "IO module that implements local storage protocol support.",
        "license": "Apache-2.0",
        "main": "local-storage.js",
        "pkxDependencies": [
            "cc.event.0.1",
            "cc.type.0.1",
            "cc.io.0.1"
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.event.0.1/", "patch"));
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
        function LocalStorage(pkx, module) {
            var self = this;
    
            //
            // get dependencies
            //
            var type, event, io, crypt;
            if (typeof require === "function") {
                type = require("./cc.type");
                event = require("./cc.event");
                io = require("./cc.io");
            }
    
            if (typeof localStorage === "undefined") {
                return "The runtime does not support local storage.";
            }
    
            //
            // constants
            //
            this.PROTOCOL_LOCAL_STORAGE = "ls";
            this.MAX_SIZE = "5242880"; //5MB max for local storage: https://demo.agektmr.com/storage/
    
            //
            // private functions
            //
            function getItem(path) {
                return localStorage.getItem(self.PROTOCOL_LOCAL_STORAGE + ":///" + path);
            }
            function setItem(path, value) {
                return localStorage.setItem(self.PROTOCOL_LOCAL_STORAGE + ":///" + path, value);
            }
            function removeItem(path) {
                return localStorage.removeItem(self.PROTOCOL_LOCAL_STORAGE + ":///" + path);
            }
    
            //
            // public functions
            //
            this.LocalStorageStream = function(buffer, key, access)
            {
                var own = this;
    
                var seek_origin = io.SEEKORIGIN_BEGIN;
                var written = false;
                var closed = false;
    
                this.getName = function() {
                    if (key && key.lastIndexOf("/") >= 0) {
                        return key.substr(key.lastIndexOf("/"));
                    }
                    else {
                        return key;
                    }
                };
                this.getLength = function()
                {
                    return new Promise(function(resolve, refuse) {
                        if (closed) {
                            refuse(new Error(io.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
                        resolve(buffer.length);
                    });
                };
                this.read = function (len, position)
                {
                    if (!position) {
                        position = 0;
                    }
    
                    return new Promise(function(resolve, refuse) {
                        if (closed) {
                            refuse(new Error(io.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        if (len == null) {
                            own.getLength().then(function (length) {
                                doRead(length - position);
                            }, function(err) {
                                refuse(err);
                            });
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
                this.write = function(data, position) {
                    if (!position) {
                        position = 0;
                    }
                    
                    return new Promise(function(resolve, refuse) {
                        if (closed) {
                            refuse(new Error(io.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        try {
                            if (data == null) {
                                resolve();
                                return;
                            }
                            if (!((typeof Buffer != "undefined" && data instanceof Buffer) || (typeof Uint8Array != "undefined" && data instanceof Uint8Array) || type.isString(data))) {
                                refuse("Invalid parameter 'data'. The parameter should be of type 'Buffer', 'Uint8Array' or 'String'.");
                                return;
                            }
                            if (!type.isFunction(data.toString)) {
                                refuse("Invalid parameter 'data'. The parameter should have the toString() function.");
                                return;
                            }
                            var newData;
                            var newB;
                            var newLength;
                        /* if (typeof Buffer != "undefined") {
                                newData = data instanceof Buffer? data : data.toBuffer();
                                newLength = position + newData.length;
                                if (access == io.ACCESS_MODIFY && newLength < buffer.length) {
                                    newLength = buffer.length;
                                }
                                newB = Buffer.alloc(newLength);
                                //only write previous contents if not access is modify and data is not text, or has been written once (overwrite)
                                if (access == io.ACCESS_MODIFY || written) {
                                    for (var b = 0; b < buffer.length && b < position; b++) {
                                        newB.writeUInt8(buffer[b], b);
                                    }
                                }
                                else if (!written && type.isString(data)) {
                                    for (var b = 0; b < position; b++) {
                                        newB.write(" ", b);
                                    }
                                }
                                for (b=0;b<data.length;b++) {
                                    newB.writeUInt8(newData[b], position + b);
                                }
                            }
                            else {*/
                                newData = data instanceof Uint8Array? data : data.toUint8Array();
                                newLength = position + newData.length;
                                if (access == io.ACCESS_MODIFY && newLength < buffer.length) {
                                    newLength = buffer.length;
                                }
                                newB = new Uint8Array(newLength);
                                //only write previous contents if not access is modify and data is not text, or has been written once (overwrite)
                                if (access == io.ACCESS_MODIFY || written) {
                                    newB.set(buffer, 0);
                                }
                                else if (!written && type.isString(data)) {
                                    newB.set(" ".repeat(position).toUint8Array(), 0);
                                }
                                newB.set(newData, position);
                            //}
                            buffer = newB;
                            var bfrStr = buffer.toString();
                            setItem(key, bfrStr);
                            written = true;
                            resolve();
                        } catch(e) {
                            refuse(e);
                        }
                    });
                };
                this.close = function ()
                {
                    return new Promise(function(resolve, refuse) {
                        if (closed) {
                            refuse(new Error(io.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        buffer = null;
                        closed = true;
    
                        resolve();
                    });
                };
            };
            this.LocalStorageStream.open = function(uri, opt_access, opt_create) {
                return new Promise(function(resolve, reject) {
                    var buffer;
                    var data = getItem(uri.toString());
    
                    if (data) {
                        buffer = new Uint8Array(data.length);
                        Array.prototype.forEach.call(data, function (ch, i) {
                            buffer[i] = ch.charCodeAt(0);
                        });
    
                        resolve(new self.LocalStorageStream(buffer, uri.toString(), opt_access));
                        return;
                    }
                    else if (opt_access && opt_access != io.ACCESS_READ) {
                        setItem(uri.toString(), "");
                        resolve(new self.LocalStorageStream(new Uint8Array(0), uri.toString(), opt_access));
                        return;
                    }
    
                    reject(new Error(io.ERROR_FILE_NOT_FOUND, ""));
                });
            };
            this.LocalStorageStream.prototype = io.Stream;
    
            this.LocalStorageVolume = function(path) {
                this.err = [];
                this.name = "Browser Storage (Small)";
                this.protocol = self.PROTOCOL_LOCAL_STORAGE;
                this.description = "Browser Storage (Small)";
                this.size = self.MAX_SIZE;
                this.state = io.VOLUME_STATE_READY;
                this.type = io.VOLUME_TYPE_FIXED;
                this.scope = io.VOLUME_SCOPE_LOCAL;
                this.class = io.VOLUME_CLASS_PERSISTENT;
                this.readOnly = false;
                var deviceId = "NOT IMPLEMENTED";
                this.localId = ""; //crypt.guid(crypt.md5(this.name + "/" + this.description + "/" + deviceId)); //TODO - deviceId from host library, but that would cause circular dependency
                
                this.query = function(uri) {  
                    return new Promise(function(resolve, refuse) { 
                        if (uri && type.isString(uri)) {
                            uri = self.uri.parse(uri);
                        }
                        else if (uri && (typeof uri.scheme == "undefined" || typeof uri.path == "undefined")) {
                            uri = null;
                        }
    
                        if (!uri || uri.scheme != PROTOCOL_LOCAL_STORAGE) {
                            reject("Invalid scheme.");
                            return;
                        }
                        var dir = uri.toString();
                        var lastIdx = dir.lastIndexOf("/");
                        if (lastIdx != dir.length - 1) {
                            dir = dir.substr(0, lastIdx + 1);
                        }
    
                        var items = [];
                        for (var key in localStorage) {
                            if (key.indexOf(dir) == 0 && key.substr(dir.length).indexOf("/") == -1) {
                                items.push(io.URI.parse(key));
                            }
                        }
                        resolve(items);
                    });
                };
    
                this.open = function(path, opt_access, opt_create) {
                    return self.uri.open(path, opt_access, opt_create);
                };
    
                this.events = new event.Emitter(this);
            };
            this.LocalStorageVolume.prototype = io.Volume;
    
            this.uri = {};
            this.uri.parse = function(uri) {
                if(uri && type.isString(uri)) {
                    if (uri.length >= 5 && uri.substr(0,5) == self.PROTOCOL_LOCAL_STORAGE + "://") {
                        return new io.URI(uri, self);
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
                return self.LocalStorageStream.open(uri.path, opt_access, opt_create);
            };
            this.uri.exists = function(uri) {
                return new Promise(function(resolve, refuse) {
                    if (uri && type.isString(uri)) {
                        uri = self.uri.parse(uri);
                    }
                    else if (uri && (typeof uri.scheme == "undefined" || typeof uri.path == "undefined")) {
                        uri = null;
                    }
                    var val = getItem(uri.path);
                    if (val == null) {
                        resolve();
                        return;
                    }
                    resolve(io.FILE);
                });
    
            };
            this.uri.delete = function(uri) {
                return new Promise(function(resolve, refuse) {
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
                    var val = null;
                    if (uri) {
                        val = getItem(uri.path);
                    }
                    if (val == null) {
                        refuse(new Error(io.ERROR_FILE_NOT_FOUND, ""), "The file or directory does not exist local storage.");
                        return;
                    }
                    removeItem(uri.path);
                    resolve();
                });
    
            };
            this.uri.query = function(uri) {
                return volume.query(uri);
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
                    default:
                        return uri.toString();
                }
            };
            this.uri.getTemp = function() {
                return self.uri.parse(self.PROTOCOL_LOCAL_STORAGE + ":///tmp/");
            };
    
            // register protocol handler
            io.protocols.register({
                "protocol": this.PROTOCOL_LOCAL_STORAGE,
                "module": self
            });
    
            // register root
            var volume = new self.LocalStorageVolume("/");
            io.volumes.register(volume);
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
            singleton = new (Function.prototype.bind.apply(LocalStorage, arguments));
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
