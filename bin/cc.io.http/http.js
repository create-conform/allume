/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.io.http.0.1.4/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.io.http.0.1.4/";
    define.parameters.pkx = {
        "name": "cc.io.http",
        "version": "0.1.4",
        "title": "IO HTTP Module",
        "description": "IO module that implements HTTP & HTTPS protocol support.",
        "license": "Apache-2.0",
        "main": "http.js",
        "pkxDependencies": [
            "cc.type.0.1",
            "cc.string.0.1",
            "cc.event.0.1",
            "cc.host.0.1",
            "cc.io.0.1"
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.type.0.1/", "patch"));
    define.parameters.dependencies.push(define.cache.get("cc.string.0.1/", "patch"));
    define.parameters.dependencies.push(define.cache.get("cc.event.0.1/", "patch"));
    define.parameters.dependencies.push(define.cache.get("cc.host.0.1/", "patch"));
    define.parameters.dependencies.push(define.cache.get("cc.io.0.1/", "patch"));
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.io.http
    //
    //    IO module that implements HTTP & HTTPS protocol support.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    /////////////////////////////////////////////////////////////////////////////////////////////
    
    (function() {
        function HTTP(pkx, module) {
            var self = this;
    
            var type, event, io, string, host;
            if (typeof require === "function") {
                type = require("./cc.type");
                event = require("./cc.event");
                string = require("./cc.string");
                io = require("./cc.io");
                host = require("./cc.host");
            }
    
            this.PROTOCOL_HTTP = "http";
            this.PROTOCOL_HTTPS = "https";
    
            this.FORMAT_PATH = "format-path";
    
            this.ERROR_NETWORK = "http-error-network";
    
            this.HTTPStream = function(uri, access)
            {
                var own = this;
    
                var written = false;
                var closed = false;
    
                var buffer = null;
                var acceptRanges = null;
    
                if (access && access != io.ACCESS_READ) {
                    throw new Error(io.ERROR_ACCESS_DENIED, "HTTPStream does not support '" + access + "'.");
                }
    
                this.headers = {};
    
                this.getAccess = function() {
                    return new Promise(function(resolve, refuse) { resolve(io.ACCESS_READ); });
                };
                this.getName = function() {
                    var name = uri.toString();
                    var idxLastSlash = name.lastIndexOf("/");
                    return idxLastSlash == name.length - 1? "" : (idxLastSlash >= 0? name.substr(idxLastSlash + 1) : name);
                };
                this.getLength = function()
                {
                    return new Promise(function(resolve, refuse) {
                        if (closed) {
                            refuse(new Error(io.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        if (buffer) {
                            resolve(buffer.length);
                        } else {
                            if (host.isRuntimeBrowserFamily()) {
                                getLengthXHR();
                                return;
                            }
                            switch(host.runtime) {
                                case host.RUNTIME_NWJS:
                                case host.RUNTIME_NODEJS:
                                    getLengthNode();
                                    break;
                                default:
                                    refuse(new Error(host.ERROR_RUNTIME_NOT_SUPPORTED, ""));
                            }
                        }
    
                        function getLengthXHR() {
                            var xhr = new XMLHttpRequest();
                            xhr.open("HEAD", uri, true);
                            for (var h in own.headers) {
                                xhr.setRequestHeader(h, own.headers[h]);
                            }
                            xhr.onreadystatechange = function () {
                                if (xhr.readyState == xhr.DONE) {
                                    acceptRanges = xhr.getResponseHeader("Accept-Ranges") == "bytes";
                                    doGetLength(xhr.getResponseHeader("Content-Length"));
                                }
                            };
                            xhr.send();
                        }
    
                        function getLengthNode() {
                            var http = uri.scheme.toLowerCase() == self.PROTOCOL_HTTP? require("http") : require("https");
    
                            try {
                                var req = http.request({
                                    "method": "HEAD",
                                    "protocol": uri.scheme.toLowerCase() + ":",
                                    "hostname": uri.authority.host,
                                    "port": uri.authority.port,
                                    "path": uri.path + (uri.query? uri.query : "") + (uri.fragment? uri.fragment : ""),
                                    "headers": own.headers
                                }, function (res) {
                                    res.on("error", error);
                                    res.on("data", function () {
                                        // ignore
                                    });
                                    res.on("end", function () {
                                        if (res.statusCode >= 300 && res.statusCode < 400) {
                                            var headers = Object.keys(headers || res.headers);
                                            var lHeaders = headers.map(function (h) {return h.toLowerCase()});
                                            for (var i=0;i<lHeaders.length;i++) {
                                                if (lHeaders[i] === "location") {
                                                    uri = io.URI.parse(res.headers[headers[i]]);
                                                    getLengthNode();
                                                    return;
                                                }
                                            }
                                        }
    
                                        acceptRanges = res.headers["accept-ranges"] == "bytes";
                                        doGetLength(res.headers["content-length"]);
                                    });
                                });
                                req.on("error", error);
                                req.end();
                            }
                            catch(e) {
                                error(e);
                            }
                        }
    
                        function doGetLength(len) {
                            if (!isNaN(len)) {
                                resolve(parseInt(len));
                            }
                            else {
                                refuse(new Error(io.ERROR_UNSUPPORTED_OPERATION, ""));
                            }
                        }
    
                        function error(e) {
                            refuse(new Error(self.ERROR_NETWORK, e));
                        }
                    });
                };
                this.read = function (len, position)
                {
                    if (typeof position === "undefined") {
                        position = 0;
                    }
    
                    return new Promise(function(resolve, refuse) {
                        if (closed) {
                            refuse(new Error(io.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        var total = 0;
                        var initialPos = position;
                        var initialLen = len;
                        var lastProgress = null;
    
                        function initHTTPRead() {
                            if (len != null) {
                                total = len;
                            }
    
                            if ((position > 0 || len != null) && acceptRanges == null) {
                                own.getLength().then(function (length) {
                                    total = length;
                                    initHTTPRead();
                                }, function(err) {
                                    if (err.name != io.ERROR_UNSUPPORTED_OPERATION) {
                                        refuse(err);
                                        return;
                                    }
                                    initHTTPRead();
                                });
                            }
                            else if ((position > 0 || len != null) && (acceptRanges || buffer)) {
                                if (len == null && buffer) {
                                    total = buffer.length - position;
                                }
                                read();
                            }
                            else {
                                // it's not possible to do a range request, download and buffer, then read
                                download();
                            }
                        }
    
                        function download() {
                            if (host.isRuntimeBrowserFamily()) {
                                downloadXHR();
                                return;
                            }
                            switch(host.runtime) {
                                case host.RUNTIME_NWJS:
                                case host.RUNTIME_NODEJS:
                                    downloadNode();
                                    break;
                                default:
                                    refuse(new Error(host.ERROR_RUNTIME_NOT_SUPPORTED, ""));
                            }
                        }
    
                        function downloadXHR() {
                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", uri, true);
                            for (var h in own.headers) {
                                xhr.setRequestHeader(h, own.headers[h]);
                            }
                            xhr.onprogress = progressXHR;
                            xhr.responseType = "arraybuffer";
                            xhr.onreadystatechange = function() {
                                if (xhr.readyState == xhr.DONE) {
                                    if (xhr.status != 200) {
                                        refuse(new Error(self.ERROR_NETWORK, "The server returned code '" + xhr.status + "': '" + xhr.statusText + "'."));
                                        return;
                                    }
                                    buffer = new Uint8Array(xhr.response);
                                    read();
                                }
                            };
                            xhr.send();
                        }
    
                        function downloadNode() {
                            var http = uri.scheme.toLowerCase() == self.PROTOCOL_HTTP? require("http") : require("https");
                            var dataLen = 0;
                            var data = [];
    
                            try {
                                var req = http.request({
                                    "method" : "GET",
                                    "protocol": uri.scheme.toLowerCase() + ":",
                                    "hostname": uri.authority.host,
                                    "port": uri.authority.port,
                                    "path": uri.path + (uri.query? uri.query : "") + (uri.fragment? uri.fragment : ""),
                                    "headers": own.headers
                                }, function(res) {
                                    res.on("response", function(resp) {
                                        if (!isNaN(resp.headers["content-length"])) {
                                            total = parseInt(resp.headers["content-length"]);
                                        }
                                    }).on("error", error)
                                        .on("data", function(chunk) {
                                            data.push(chunk);
                                            dataLen += chunk.length;
                                            progress(dataLen, total);
                                        }).on("end", function() {
                                            if (res.statusCode >= 300 && res.statusCode < 400) {
                                                var headers = Object.keys(headers || res.headers);
                                                var lHeaders = headers.map(function (h) {return h.toLowerCase()});
                                                for (var i=0;i<lHeaders.length;i++) {
                                                    if (lHeaders[i] === "location") {
                                                        uri = io.URI.parse(res.headers[headers[i]]);
                                                        downloadNode();
                                                        return;
                                                    }
                                                }
                                            }
                                            else if (res.statusCode != 200) {
                                                refuse(new Error(self.ERROR_NETWORK, "The server returned code '" + res.statusCode + "'."));
                                                return;
                                            }
    
                                            buffer = new Buffer(dataLen);
                                            for (var i=0, l = data.length, pos = 0; i < l; i++) {
                                                data[i].copy(buffer, pos);
                                                pos += data[i].length;
                                            }
                                            read();
                                        });
                                });
                                req.on("error", error);
                                req.end();
                            }
                            catch(e) {
                                error(e);
                            }
                        }
    
                        function read() {
                            if (buffer) {
                                if ((len == null && position == 0) || len == buffer.length) {
                                    endHTTPRead(buffer);
                                }
                                else if (position >= buffer.length) {
                                    refuse(new Error(io.ERROR_INVALID_LENGTH, ""));
                                }
                                else {
                                    var b = buffer.subarray(position, position + (len == null? buffer.length - position : len));
                                    position += len;
                                    endHTTPRead(b);
                                }
                            }
                            else {
                                if (host.isRuntimeBrowserFamily()) {
                                    readXHR();
                                    return;
                                }
                                switch (host.runtime) {
                                    case host.RUNTIME_NWJS:
                                    case host.RUNTIME_NODEJS:
                                        readNode();
                                        break;
                                    default:
                                        refuse(new Error(host.ERROR_RUNTIME_NOT_SUPPORTED, ""));
                                }
                            }
                        }
    
                        function readXHR() {
                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", uri, true);
                            for (var h in own.headers) {
                                xhr.setRequestHeader(h, own.headers[h]);
                            }
                            xhr.onprogress = progressXHR;
                            xhr.responseType = "arraybuffer";
                            xhr.setRequestHeader("Range", "bytes=" + position + "-" + (len? position + len - 1 : ""));
                            xhr.onreadystatechange = function () {
                                // If the offset is valid, the server will return an HTTP 206 status code.
                                // If the offset is invalid, the request will return an HTTP 416 status code (Requested Range Not Satisfiable).
                                if (xhr.statusCode == 200) {
                                    xhr.abort();
                                    refuse(new Error(io.ERROR_INVALID_LENGTH, xhr.statusText));
                                    return;
                                }
                                if (xhr.readyState == xhr.DONE) {
                                    if (xhr.status == 206) {
                                        endHTTPRead(new Uint8Array(xhr.response));
                                    }
                                    else if (xhr.status == 416) {
                                        refuse(new Error(io.ERROR_INVALID_LENGTH, xhr.statusText));
                                    }
                                    else {
                                        refuse(new Error(self.ERROR_NETWORK, "The server returned code '" + xhr.status + "': '" + xhr.statusText + "'."));
                                    }
                                }
                            };
                            xhr.send();
                        }
    
                        function readNode() {
                            var http = uri.scheme.toLowerCase() == self.PROTOCOL_HTTP? require("http") : require("https");
                            var dataLen = 0;
                            var data = [];
    
                            try {
                                var headers = {};
                                for (var h in own.headers) {
                                    headers[h] = own.headers[h];
                                }
                                headers["range"] = "bytes=" + position + "-" + (len? position + len - 1 : "");
                                var req = http.request({
                                    "method" : "GET",
                                    "headers": headers,
                                    "protocol": uri.scheme.toLowerCase() + ":",
                                    "hostname": uri.authority.host,
                                    "port": uri.authority.port,
                                    "path": uri.path + (uri.query? uri.query : "") + (uri.fragment? uri.fragment : "")
                                }, function(res) {
                                    if (!isNaN(res.headers["content-length"])) {
                                        total = parseInt(res.headers["content-length"]);
                                    }
                                    if (res.statusCode == 200) {
                                        refuse(new Error(io.ERROR_INVALID_LENGTH, ""));
                                        return;
                                    }
    
                                    res.on("error", error)
                                        .on("data", function(chunk) {
                                            data.push(chunk);
                                            dataLen += chunk.length;
                                            progress(dataLen, total);
                                        })
                                        .on("end", function() {
                                            if (res.statusCode >= 300 && res.statusCode < 400) {
                                                var headers = Object.keys(headers || res.headers);
                                                var lHeaders = headers.map(function (h) {return h.toLowerCase()});
                                                for (var i=0;i<lHeaders.length;i++) {
                                                    if (lHeaders[i] === "location") {
                                                        uri = io.URI.parse(res.headers[headers[i]]);
                                                        readNode();
                                                        return;
                                                    }
                                                }
                                            }
                                            else if (res.statusCode == 206) {
                                                var b = new Buffer(dataLen);
                                                for (var i=0, l = data.length, pos = 0; i < l; i++) {
                                                    data[i].copy(b, pos);
                                                    pos += data[i].length;
                                                }
                                                endHTTPRead(b);
                                            }
                                            else if (res.statusCode == 416) {
                                                refuse(new Error(io.ERROR_INVALID_LENGTH, ""));
                                            }
                                            else {
                                                refuse(new Error(self.ERROR_NETWORK, "The server returned code '" + res.statusCode + "'."));
                                            }
                                        });
                                });
                                req.on("error", error);
                                req.end();
                            }
                            catch(e) {
                                error(e);
                            }
                        }
    
                        function progressXHR(evt) {
                            if (evt.lengthComputable) {
                                progress(evt.loaded, evt.total);
                            }
                        }
    
                        function progress(loaded, total) {
                            if (total) {
                                var currentProgress =  (loaded / total) * 100;
                                if (lastProgress != currentProgress) {
                                    lastProgress = currentProgress;
                                    own.events.fire(io.EVENT_STREAM_READ_PROGRESS, new event.Progress({
                                        "percentage" : currentProgress,
                                        "operation" : {
                                            "type" : io.OPERATION_STREAM_READ,
                                            "data" : {
                                                "position": initialPos,
                                                "length": initialLen,
                                                "total": total
                                            }
                                        },
                                        "promise" : this
                                    }));
                                }
                            }
                        }
    
                        function error(e) {
                            refuse(new Error(self.ERROR_NETWORK, e));
                        }
    
                        function endHTTPRead(b) {
                            progress(1,1);
                            resolve(b);
                        }
    
                        initHTTPRead();
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
    
                this.events = new event.Emitter(this);
            };
            this.HTTPStream.open = function(uri, opt_access) {
                return new Promise(function(resolve, reject) {
                    if (opt_access && opt_access != io.ACCESS_READ) {
                        reject(new Error(io.ERROR_UNSUPPORTED_OPERATION, "Writing to HTTPStream is currently unsupported."));
                    }
    
                    resolve(new self.HTTPStream(uri, opt_access));
                });
            };
            this.HTTPStream.prototype = io.Stream;
    
            this.uri = {};
            this.uri.parse = function(uri) {
                if(string.isURL(uri)) {
                    if (uri.length >= 5 && uri.substr(0,5) == self.PROTOCOL_HTTP + "://" ||
                        uri.length >= 5 && uri.substr(0,5) == self.PROTOCOL_HTTPS + "://") {
                        return new io.URI(uri, self);
                    }
                }
                else if (type.isString(uri)) {
                    if (host.isRuntimeBrowserFamily() && typeof location != "undefined" && location.protocol && location.host && location.pathname) {
                        var idxLastSlash = location.pathname.lastIndexOf("/");
                        var path = "/";
                        if (idxLastSlash >= 0) {
                            path = location.pathname.substr(0, idxLastSlash + 1);
                        }
    
                        return new io.URI(location.protocol.substr(0, location.protocol.length - 1), location.host, uri.length > 0 && uri.substr(0, 1) == "/" ? uri : path + uri, null, null, self);
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
                return self.HTTPStream.open(uri, opt_access);
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
                throw new Error(io.ERROR_UNSUPPORTED_OPERATION, "The cc.io.http module does not support creating temp files.");
            };
    
            io.protocols.register({
                "protocol": this.PROTOCOL_HTTP,
                "module": self,
                "formats": [
                    self.FORMAT_PATH
                ]
            });
            io.protocols.register({
                "protocol": this.PROTOCOL_HTTPS,
                "module": self
            });
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
            singleton = new (Function.prototype.bind.apply(HTTP, arguments));
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
