/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.type.0.1.4/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.type.0.1.4/";
    define.parameters.pkx = {
        "name": "cc.type",
        "version": "0.1.4",
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
            this.getProperty = function(obj, property) {
                var args = property.split(".");
                if (args.length == 0) {
                    return null;
                }
                if (obj == null) {
                    if (typeof window !== "undefined") {
                        obj = ((window.frameElement != null ? window.frameElement.contentWindow : null) || window || this);
                    } else {
                        obj = this;
                    }
                }
                var val = obj[args[0]];
                if (args.length > 1) {
                    return self.getProperty(val, property.substr(args[0].length + 1));
                }
                else {
                    return val;
                }
            };
            this.setProperty = function(obj, property, value) {
                var args = property.split(".");
                if (args.length == 0) {
                    return null;
                }
                if (obj == null) {
                    if (typeof window !== "undefined") {
                        obj = ((window.frameElement != null ? window.frameElement.contentWindow : null) || window || this);
                    } else {
                        obj = this;
                    }
                }
                if (args.length > 1) {
                    return self.setProperty(obj[args[0]], property.substr(args[0].length + 1), value);
                }
                else {
                    obj[args[0]] = value;
                }
            };
            this.merge = function(source1, source2, overwriteArray) {
                /*
                * Properties from the Source1 object will be copied to Source2 Object. Source1 will overwrite any existing attributes
                * Note: This method will return a new merged object, Source1 and Source2 original values will not be replaced.
                * */
                //var mergedJSON = Object.create(source2);// Copying Source2 to a new Object
                var mergedJSON = self.clone(source2);
    
                for (var attrname in source1) {
                    if(mergedJSON.hasOwnProperty(attrname)) {
                        if ( source1[attrname]!=null) {
                            if (source1[attrname].constructor==Object) {
                                /*
                                * Recursive call if the property is an object,
                                * Iterate the object and set all properties of the inner object.
                                */
                                mergedJSON[attrname] = self.merge(source1[attrname], mergedJSON[attrname], overwriteArray);
                            }
                            else if (self.isArray(source1[attrname]) && !overwriteArray) {
                                mergedJSON[attrname] = mergedJSON[attrname].concat(source1[attrname]);
                            }
                            else {
                                mergedJSON[attrname] = source1[attrname];
                            }
                        }
                    } else {
                        //else copy the property from source1
                        mergedJSON[attrname] = source1[attrname];
                    }
                }
    
                return mergedJSON;
            }
            this.clone = function(src, /* INTERNAL */ _visited) {
                /**
                 * Deep copy an object (make copies of all its object properties, sub-properties, etc.)
                 * An improved version of http://keithdevens.com/weblog/archive/2007/Jun/07/javascript.clone
                 * that doesn't break if the constructor has required parameters
                 *
                 * It also borrows some code from http://stackoverflow.com/a/11621004/560114
                 */
    
                //If Object.create isn't already defined, we just do the simple shim, without the second argument,
                //since that's all we need here
                var object_create = Object.create;
                if (typeof object_create !== "function") {
                    object_create = function(o) {
                        function F() {}
                        F.prototype = o;
                        return new F();
                    };
                }
    
                if(src == null || typeof(src) !== "object"){
                    return src;
                }
    
                // Initialize the visited objects array if needed
                // This is used to detect cyclic references
                if (_visited == undefined){
                    _visited = [];
                }
                // Otherwise, ensure src has not already been visited
                else {
                    var i, len = _visited.length;
                    for (i = 0; i < len; i++) {
                        // If src was already visited, don't try to copy it, just return the reference
                        if (src === _visited[i]) {
                            return src;
                        }
                    }
                }
    
                // Add this object to the visited array
                _visited.push(src);
    
                //Honor native/custom clone methods
                if(typeof src.clone == "function"){
                    return src.clone(true);
                }
    
                //Special cases:
                //Array
                if (Object.prototype.toString.call(src) == "[object Array]") {
                    //[].slice(0) would soft clone
                    ret = src.slice();
                    var i = ret.length;
                    while (i--){
                        ret[i] = self.clone(ret[i], _visited);
                    }
                    return ret;
                }
                //Date
                if (src instanceof Date){
                    return new Date(src.getTime());
                }
                //RegExp
                if(src instanceof RegExp){
                    return new RegExp(src);
                }
                //DOM Elements
                if(src.nodeType && typeof src.cloneNode == "function"){
                    return src.cloneNode(true);
                }
    
                //If we've reached here, we have a regular object, array, or function
    
                //make sure the returned object has the same prototype as the original
                var proto = (Object.getPrototypeOf ? Object.getPrototypeOf(src): src.__proto__);
                if (!proto) {
                    proto = src.constructor.prototype; //this line would probably only be reached by very old browsers
                }
                var ret = object_create(proto);
    
                for(var key in src){
                    //Note: this does NOT preserve ES5 property attributes like 'writable', 'enumerable', etc.
                    //For an example of how this could be modified to do so, see the singleMixin() function
                    ret[key] = self.clone(src[key], _visited);
                }
                return ret;
            }
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
    
            Buffer.prototype.toUint8Array = function() { 
                if (this.buffer)
                { 
                    return new Uint8Array(this.buffer, this.byteOffset, this.byteLength);
                } 
                else { 
                    var ab = new ArrayBuffer(this.length);
                    var view = new Uint8Array(ab);
                    for (var i = 0; i < this.length; ++i) { 
                        view[i] = this[i];
                    } 
                    return view;
                } 
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
            singleton = new (Function.prototype.bind.apply(Type, arguments));
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
