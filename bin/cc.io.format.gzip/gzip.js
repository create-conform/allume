/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.io.format.gzip.0.1.1/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.io.format.gzip.0.1.1/";
    define.parameters.pkx = {
        "name": "cc.io.format.gzip",
        "version": "0.1.1",
        "title": "IO GZIP Format Module",
        "description": "IO module that implements GZIP stream support.",
        "bugs": null,
        "license": "Apache-2.0",
        "author": null,
        "contributors": null,
        "main": "gzip.js",
        "pkxDependencies": [
            "cc.type.0.1",
            "cc.string.0.1",
            "cc.event.0.1",
            "cc.io.0.1",
            "cc.inflate.0.1"
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.type.0.1/", "undefined"));
    define.parameters.dependencies.push(define.cache.get("cc.string.0.1/", "undefined"));
    define.parameters.dependencies.push(define.cache.get("cc.event.0.1/", "undefined"));
    define.parameters.dependencies.push(define.cache.get("cc.io.0.1/", "undefined"));
    define.parameters.dependencies.push(define.cache.get("cc.inflate.0.1/", "undefined"));
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.io.format.gzip
    //
    //    IO module that implements GZIP stream support.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    ///////////////////////////////////////////////////////////////////////////////////////////// 
    
    (function(){
        function GZip(pkx, module) {
            var own = this;
    
            var type, event, inflate, io, string;
            if (typeof require === "function") {
                type = require("./cc.type");
                event = require("./cc.event");
                string = require("./cc.string");
                io = require("./cc.io");
                inflate = require("./cc.inflate");
            }
    
            this.GZIP_TAG_TYPE_OBJECT = "gzip-tag-type-object";
    
            this.ERROR_READER_NOT_READY = "gzip-error-reader-not-ready";
            this.ERROR_CORRUPTED_GZIP_FILE = "gzip-error-corrupted-gzip-file";
    
            var T_DEFLATE=  8;
            var F_TEXT=     1 << 0;
            var F_CRC=      1 << 1;
            var F_EXTRA=    1 << 2;
            var F_NAME=     1 << 3;
            var F_COMMENT=  1 << 4;
    
            this.GZipObject = function(header, stream)
            {
                var self = this;
                this.isValid = false;
    
                if (!header) {
                    return;
                }
    
                //https://gist.github.com/kig/417483
                //http://www.zlib.org/rfc-gzip.html
                this.id1 = header[0]; //BYTE 0 - BYTE
                this.id2 = header[1]; //BYTE 1 - BYTE
                this.compressionMethod = header[2]; //BYTE 2 - BYTE
                this.flags = header[3]; //BYTE 3 - BYTE
                this.mTime = null; //BYTE 4 - UInt32LE
                this.extraFlags = header[8]; //BYTE 8 - BYTE
                this.operatingSystem = header[9]; //BYTE 9 - BYTE
    
                var offset = 10;
                //if flags extra
                this.extraField = "";
                if (self.flags & F_EXTRA) {
                    var xLen = readInt(header, offset, 2);
                    offset += 2;
                    self.extraField = header.subarray(offset, offset + xLen); //BYTE 10 -> 11 = XLENGTH - UInt16LE, BYTE 12 -> XLENGTH = FIELD - STRING
                    offset += xLen;
                }
                //if flags name
                this.name = "";
                if (self.flags & F_NAME) {
                    self.name = readString(header, offset); //BYTE 10 + 2 + XLENGTH + STRINGLENGTH UNTIL 0 BYTE
                    offset += self.name.length + 1;
                }
                //if flags comment
                this.comment = "";
                if (self.flags & F_COMMENT) {
                    self.comment = readString(header, offset); //BYTE 10 + 2 + XLENGTH + FILENAMELENGTH + 1
                    offset += self.comment.length + 1;
                }
                //this.computedCRC16 = null; //CRC16(BYTE 10 + 2 + XLENGTH + FILENAMELENGTH + 1 + COMMENTLENGTH + 1);
                //if flags header checksum
                //this.headerCRC16 = null; //BYTE 10 + 2 + XLENGTH + FILENAMELENGTH + 1 + COMMENTLENGTH + 1 - UInt16LE
    
                if (self.flags & F_CRC) {
                    //    h.headerCRC16 = Bin.UInt16LE(s, offset);
                    //    if (h.computedHeaderCRC16 != null && h.headerCRC16 != h.computedHeaderCRC16)
                    //        throw("Header CRC16 check failed");
                    offset += 2;
                }
    
                this.offset = offset; //BYTE 10 + 2 + XLENGTH + FILENAMELENGTH + 1 + COMMENTLENGTH + 1 + 2
                this.size = null; //CALCULATE FROM LENGTH
    
                self.isValid = validate(header);
    
                function validate(header)
                {
                    // check compression method
                    if (self.id1 != 0x1f || self.id2 != 0x8b || self.compressionMethod != T_DEFLATE) {
                        return false;
                    }
    
                    // header checksum
                    /*var sum = 0;
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
                     return sum == self.checksum;*/
                    return true;
                }
    
                function readString(header, pos, length) {
                    var zeroIdx = pos;
                    for (; zeroIdx<header.length; zeroIdx++) {
                        if (header[zeroIdx] == 0 || (length && zeroIdx == pos + length)) {
                            break;
                        }
                    }
                    if (zeroIdx == header.length && !length) {
                        throw("No null byte encountered");
                    }
                    return header.subarray(pos, zeroIdx);
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
    
            this.GZipReader = function(stream)
            {
                var self = this;
    
                var streamPosition = 0;
                var objectCount = 0;
                var initializing = false;
    
                var HEADER_SIZE = 10;
    
                this.err = [];
                this.metadata = new own.GZipMetadata();
    
                this.getGZipObjectStream = function(obj)
                {
                    return new own.GZipStream(stream, obj);
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
                            var tObj = new own.GZipObject(header, stream);
                            if (!tObj.isValid)
                            {
                                refuse(new Error(io.ERROR_UNSUPPORTED_STREAM, "The stream does not seem to contain a valid gzip file."));
                                return;
                            }
                            resolve();
                        }, refuse);
                    });
                }
                function readMetadata() {
                    return new Promise(function(resolve, refuse) {
                        readNextHeader().then(resolve, function handleGZipError(e) { // when implementing multi file support, change "resolve" to "readNext"
                            if (e.name != io.ERROR_INVALID_LENGTH) {
                                refuse(e);
                                return;
                            }
                            resolve();
                        });
                    });
                }
                function readNextHeader() {
                    return new Promise(function readGZipHeader(resolve, refuse) {
                        stream.read(HEADER_SIZE, streamPosition).then(function processGZipHeader(header) {
                            var tT = new own.GZipTag("object" + objectCount, own.GZIP_TAG_TYPE_OBJECT, { "header" : header, "stream" : stream } );
    
                            objectCount++;
                            streamPosition += HEADER_SIZE + tT.size;
                            self.metadata.tags.push(tT);
    
                            resolve();
                        }, refuse);
                    });
                }
            };
    
            this.GZipTag = function(key, type, data)
            {
                this.key = key;
                this.type = type;
                this.value = convertDataToValue(type, data);
                this.data = data;
    
                function convertDataToValue() {
                    switch(type) {
                        case own.GZIP_TAG_TYPE_OBJECT:
                            return new own.GZipObject(data.header, data.stream);
                            break;
                        default:
                            throw "Not implemented";
                            break;
                    }
                }
            };
    
            this.GZipMetadata = function()
            {
                this.tags = [];
            };
    
            this.GZipStream = function(stream, object) {
                if (!stream || !object) {
                    return null;
                }
                var self = this;
    
                var inflatedBuffer = null;
                var closed = false;
    
                function inflateStream() {
                    return new Promise(function(resolve, reject) {
                        stream.read(null, object.offset).then(function(buff) {
                            inflatedBuffer = inflate(buff);
    
                            //TODO - After reading verify checksum in footer
                            //if (!tObj.checksum) {
                            //    refuse(own.ERROR_CORRUPTED_GZIP_FILE);
                            //    return;
                            //}
                            if (!inflatedBuffer || inflatedBuffer.length == 0) {
                                reject(new Error(own.ERROR_CORRUPTED_GZIP_FILE, ""));
                            }
                            else {
                                resolve();
                            }
                        }, reject);
                    });
                }
    
                this.getName = function() {
                    return object.name;
                };
                this.getLength = function() {
                    return new Promise(function(resolve, reject) {
                        if (closed) {
                            reject(new Error(io.ERROR_STREAM_CLOSED, ""));
                            return;
                        }
    
                        if (!inflatedBuffer) {
                            inflateStream().then(function() {
                                self.getLength().then(resolve, reject);
                            }, reject);
                        }
                        else if (inflatedBuffer) {
                            resolve(inflatedBuffer.length);
                        }
                        else {
                            reject(new Error(own.ERROR_CORRUPTED_GZIP_FILE, ""));
                        }
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
                            self.getLength().then(function (length) {
                                doRead(length - position);
                            }, function(err) {
                                reject(err);
                            });
                        }
                        else {
                            doRead(len);
                        }
    
                        function doRead(len) {
                            if (!inflatedBuffer) {
                                inflateStream().then(function() {
                                    self.read(len, position).then(resolve, reject);
                                }, reject);
                            }
                            else if (inflatedBuffer) {
                                if (position + len > inflatedBuffer.length) {
                                    reject(new Error(io.ERROR_INVALID_LENGTH, ""));
                                }
                                else if (len == inflatedBuffer.length) {
                                    resolve(inflatedBuffer);
                                }
                                else {
                                    var nBuf = inflatedBuffer.subarray(position, position + len);
                                    position += len;
                                    resolve(nBuf);
                                }
                            }
                            else {
                                reject(new Error(own.ERROR_CORRUPTED_GZIP_FILE, ""));
                            }
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
    
                        inflatedBuffer = null;
                        closed = true;
    
                        resolve();
                    });
                };
    
                this.events = new event.Emitter(this);
            };
            this.GZipStream.prototype = io.Stream;
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
            singleton = new (Function.prototype.bind.apply(GZip, arguments));
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
