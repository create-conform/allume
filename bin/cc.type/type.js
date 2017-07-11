/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.type.0.1.1/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.type.0.1.1/";
    define.parameters.pkx = {
        "name": "cc.type",
        "version": "0.1.1",
        "title": "Type Module",
        "description": "Library for working with primitives.",
        "bugs": null,
        "author": null,
        "contributors": null,
        "main": "type.js"
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.type
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
        function Type() {
            var self = this;
    
            this.TYPE_UNKNOWN = "unknown";
            this.TYPE_STRING = "string";
            this.TYPE_NUMBER = "number";
            this.TYPE_BOOLEAN = "boolean";
            this.TYPE_ARRAY = "array";
            this.TYPE_OBJECT = "object";
            this.TYPE_FUNCTION = "function";
    
            this.getType = function(obj) {
                if(self.isString(obj)) {
                    return self.TYPE_STRING;
                }
                if(self.isBoolean(obj)) {
                    return self.TYPE_BOOLEAN;
                }
                if(self.isNumber(obj)) {
                    return self.TYPE_NUMBER;
                }
                if(self.isArray(obj)) {
                    return self.TYPE_ARRAY;
                }
                if(self.isObject(obj)) {
                    return self.TYPE_OBJECT;
                }
                if(self.isFunction(obj)) {
                    return self.TYPE_FUNCTION;
                }
                return self.TYPE_UNKNOWN;
            };
            /**
             * Tests if an object is an array.
             * @param {object} obj - The object to test.
             * @returns Returns true if the given object is an array.
             */
            this.isArray = function (obj) {
                return Object.prototype.toString.call(obj) === "[object Array]";
            };
            this.isString = function (obj) {
                return Object.prototype.toString.call(obj) === "[object String]";
            };
            this.isObject = function (obj) {
                return Object.prototype.toString.call(obj) === "[object Object]";
            };
            this.isNumber = function (obj) {
                return obj != null && obj !== true && obj !== false && !isNaN(obj);
            };
            this.isBoolean = function (obj) {
                return obj != null && obj.constructor === Boolean;
            };
            this.isFunction = function (obj) {
                var getType = {};
                return obj && getType.toString.call(obj) === '[object Function]';
            };
            this.isPrimitive = function (obj) {
                return self.isString(obj) || self.isNumber(obj) || self.isBoolean(obj);
            };
        }
    
        String.prototype.toUint8Array = function () {
            var binStr = this;
            var uA = new Uint8Array(binStr.length);
            Array.prototype.forEach.call(binStr, function (char, i) {
                uA[i] = char.charCodeAt(0);
            });
            return uA;
        };
    
        Uint8Array.prototype.toString = function () {
            var binStr = Array.prototype.map.call(this, function (char) {
                return String.fromCharCode(char);
            }).join("");
            return binStr;
        };
    
        if (typeof Buffer != "undefined") {
            String.prototype.toBuffer = function () {
                return Buffer.from(this);
            };
    
            Buffer.prototype.toUint8Array = function () {
                return new Uint8Array(this.buffer, this.byteOffset, this.byteLength);
            };
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
            singleton = new (Function.prototype.bind.apply(Type, arguments));
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
