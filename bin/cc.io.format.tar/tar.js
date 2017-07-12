/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.io.format.tar.0.1.2/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.io.format.tar.0.1.2/";
    define.parameters.pkx = {
        "name": "cc.io.format.tar",
        "version": "0.1.2",
        "title": "IO TAR Format Module",
        "description": "IO module that implements TAR stream support.",
        "bugs": null,
        "license": "Apache-2.0",
        "author": null,
        "contributors": null,
        "main": "tar.js",
        "pkxDependencies": [
            "cc.type.0.1",
            "cc.string.0.1",
            "cc.event.0.1",
            "cc.io.0.1"
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.type.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.string.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.event.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.io.0.1/"));
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.io.format.tar
    //
    //    IO module that implements TAR stream support.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    ///////////////////////////////////////////////////////////////////////////////////////////// 
    
    (function(){
        function Tar(pkx, module) {
            var own = this;
    
            var type, event, io, string;
            if (typeof require === "function") {
                type = require("./cc.type");
                event = require("./cc.event");
                string = require("./cc.string");
                io = require("./cc.io");
            }
    
            this.TAR_TAG_TYPE_OBJECT = "tar-tag-type-object";
    
            this.ERROR_READER_NOT_READY = "tar-error-reader-not-ready";
            this.ERROR_INVALID_TAR_VOLUME = "tar-error-invalid-tar-volume";
            this.ERROR_CORRUPTED_TAR_FILE = "tar-error-corrupted-tar-volume";
    
            this.TarObject = function(header, options)
            {
                var self = this;
    
                this.name = null;
                this.size = null;
                this.offset = null;
                this.checksum = null;
                this.isValid = false;
                this.isDirectory = false;
    
                //read bytes into name property
                this.name = readString(header, 0, 100);
                var prefix = readString(header, 345, 155);
                if (prefix != "") {
                    this.name = prefix + "/" + this.name;
                }
                this.size = readLong(header, 124, 12);
                this.checksum = readInt(header, 148, 8);
                this.isValid = header && header.length > 0? validateChecksum(header) : false;
    
                if (this.name.substr(this.name.length - 1) == "/") {
                    this.name = this.name.substr(0, this.name.length - 1);
                    this.isDirectory = true;
                }
    
                if (options && !isNaN(options.strip)) {
                    for (var s=0;s<options.strip;s++) {
                        var idx = self.name.indexOf("/");
                        if (idx >= 0) {
                            self.name = self.name.substr(idx + 1);
                        }
                        else {
                            self.name = "";
                        }
                    }
                }
    
                function validateChecksum(header)
                {
                    var sum = 0;
                    for (var b = 0; b < header.length; b++)
                    {
                        if (b >= 148 && b < 148 + 8)
                        {
                            sum += 32;
                        }
                        else
                        {
                            sum += header[b];
                        }
                    }
                    return sum == self.checksum;
                }
    
                function readString(header, pos, length)
                {
                    var bVal = [];
                    for (var i=pos;i<pos+length;i++)
                    {
                        bVal.push(header[i]);
                    }
                    return String.fromCharCode.apply(null, bVal).replace(/\0/g, ""); //remove 0 byte padding
                }
    
                function readLong(header, pos, length)
                {
                    var l = 0;
                    var str = readString(header, pos, length);
                    if (str != "")
                    {
                        try
                        {
                            l = parseInt(str, 8);
                        }
                        catch(e)
                        {
                            //not an integer
                        }
                    }
                    return l;
                }
    
                function readInt(header, pos, length)
                {
                    var l = 0;
                    var str = readString(header, pos, length);
                    if (str != "")
                    {
                        try
                        {
                            l = parseInt(str, 8);
                        }
                        catch(e)
                        {
                            //not an integer
                        }
                    }
                    return l;
                }
            };
    
            this.TarReader = function(stream, options)
            {
                var self = this;
    
                var streamPosition = 0;
                var objectCount = 0;
                var path = "";
                var initializing = false;
    
                var HEADER_USTAR = false;
                var HEADER_TYPE = "ustar "; //watch the zero byte padding (last space after "ustar")
                var HEADER_SIZE = 512;
    
                this.err = [];
                this.metadata = new own.TarMetadata();
    
                this.options = options || {};
    
                this.getTarObjectStream = function(obj, fileName)
                {
                    return new io.SubStream(stream, obj.offset, obj.size, fileName);
                };
    
                this.then = function(resolve, refuse) {
                    if (initializing) {
                        refuse(new Error(own.ERROR_READER_NOT_READY, "Reader initialization already started."));
                        return;
                    }
                    initializing = true;
    
                    init(resolve, refuse);
                };
    
                this.close = function()
                {
                    stream.close();
                };
    
                function init(resolve, refuse) {
                    probe().then(function() {
                        readMetadata().then(function() {
                            resolve(self);
                        }, refuse);
                    }, refuse);
                }
    
                function probe()
                {
                    return new Promise(function(resolve, refuse) {
                        stream.read(HEADER_SIZE, 0).then(function (header) {
                            var tObj = new own.TarObject(header);
                            if (!tObj.isValid)
                            {
                                refuse(new Error(io.ERROR_UNSUPPORTED_STREAM, "The stream does not seem to contain a valid tar file."));
                                return;
                            }
                            resolve();
                        }, refuse);
                    });
                }
                function readMetadata() {
                    return new Promise(function(resolve, refuse) {
                        function readNext() {
                            if (isNaN(streamPosition)) {
                                refuse();
                                return;
                            }
                            readNextHeader().then(readNext, function handleTarError(e) {
                                if (e.name != io.ERROR_INVALID_LENGTH) {
                                    refuse(e);
                                    return;
                                }
                                resolve();
                            });
                        }
    
                        readNext();
                    });
                }
                function readNextHeader() {
                    return new Promise(function readTarHeader(resolve, refuse) {
                        stream.read(HEADER_SIZE, streamPosition).then(function processTarHeader(header) {
                            var tT = new own.TarTag("object" + objectCount, own.TAR_TAG_TYPE_OBJECT, header, options);
                            var tObj = tT.value;
    
                            objectCount++;
    
                            tObj.offset = streamPosition + HEADER_SIZE;
                            streamPosition += HEADER_SIZE;// + tObj.size
    
                            if (!tObj.isValid && isNaN(tObj.size)) {
                                refuse(own.ERROR_CORRUPTED_TAR_FILE);
                                return;
                            }
    
                            // determine file length + zero bytes
                            var wholeSize = Math.floor(tObj.size / parseFloat(HEADER_SIZE)) * HEADER_SIZE;
                            if (wholeSize < tObj.size)
                            {
                                wholeSize += HEADER_SIZE;
                            }
                            streamPosition += wholeSize;
    
                            // if record is not empty, add to metadata
                            if (tObj.name != "" && ((tObj.size > 0 && !tObj.isDirectory) || tObj.isDirectory))
                            {
                                self.metadata.tags.push(tT);
                            }
    
                            resolve();
                        }, refuse);
                    });
                }
            };
    
            this.TarTag = function(key, type, data, options)
            {
                this.key = key;
                this.type = type;
                this.value = convertDataToValue(type, data);
                this.data = data;
    
                function convertDataToValue() {
                    switch(type) {
                        case own.TAR_TAG_TYPE_OBJECT:
                            return new own.TarObject(data, options);
                            break;
                        default:
                            throw "Not implemented";
                            break;
                    }
                }
            };
    
            this.TarMetadata = function()
            {
                this.tags = [];
            };
    
            this.TarVolume = function(stream, name, options) {
                var self = this;
    
                // validate arguments
                if (!stream || Object.getPrototypeOf(stream) != io.Stream) {
                    throw new Error(own.ERROR_INVALID_TAR_VOLUME, "Mandatory parameter 'stream' should be a prototype of 'cc.io.Stream'.");
                }
    
                var initializing = false;
                var tarReader = null;
    
                this.err = [];
                this.name = name;
                this.protocol = null;
                this.description = "Tape Archive";
                this.state = io.VOLUME_STATE_INITIALIZING;
                this.size = 0;
                this.type = io.VOLUME_TYPE_REMOVABLE;
                this.scope = io.VOLUME_SCOPE_LOCAL;
                this.class = io.VOLUME_CLASS_TEMPORARY;
                this.readOnly = true;
    
                this.open = function(path) {
                    if (initializing) {
                        return notReady();
                    }
    
                    return new Promise(function(resolve, refuse) {
                        for(var t=0;t<tarReader.metadata.tags.length;t++) {
                            var relPath = path.substr(0,1) == "/"? path.substr(1) : path;
                            var tarPath = tarReader.metadata.tags[t].value.name;
                            if (tarPath == relPath) {
                                resolve(tarReader.getTarObjectStream(tarReader.metadata.tags[t].value, relPath));
                                return;
                            }
                        }
                        refuse(new Error(io.ERROR_FILE_NOT_FOUND, ""));
                    });
                };
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
                    // need to probe the tar header
                    tarReader = new own.TarReader(stream, options);
                    tarReader.then(function(reader) {
                        initializing = false;
    
                        resolve(self);
                    }, refuse);
                    // TODO - IMPLEMENT PROGRESS
                }
    
                function notReady() {
                    return new Promise(function(resolve, refuse) { refuse(new Error(io.ERROR_VOLUME_NOT_READY, "")); });
                }
            };
            this.TarVolume.prototype = io.Volume;
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
            singleton = new (Function.prototype.bind.apply(Tar, arguments));
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
