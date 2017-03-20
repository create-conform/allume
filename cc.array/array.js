/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.array.1.0.1/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function() {
    var require = define.getRequire("cc.array.1.0.1/");
    define.parameters = {};
    define.parameters.system = "pkx";
    define.parameters.id = "cc.array.1.0.1/";
    define.parameters.pkx = {
        "company": "cc",
        "product": "",
        "name": "array",
        "version": "1.0.1",
        "title": "Array Processing And Validation Module",
        "description": "Library for processing and validating arrays.",
        "bugs": null,
        "license": "Apache-2.0",
        "author": null,
        "contributors": null,
        "main": "array.js",
        "dependencies": [
            {
                "package": "cc.type.1.0"
            },
            {
                "package": "cc.validate.1.0",
                "optional": true
            }
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("[object Object]/"));
    define.parameters.dependencies.push(define.cache.get("[object Object]/"));
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.array
    //
    //    Library for processing and validating arrays.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    /////////////////////////////////////////////////////////////////////////////////////////////
    
    (function() {
        function Array(pkx, module) {
            var self = this;
    
            var type;
            if (typeof require === "function") {
                type = require("./cc.type");
            }
    
            this.STRING = "array-property-string";
            this.NUMBER = "array-property-number";
            this.BOOLEAN = "array-property-boolean";
            this.ARRAY = "array-property-array";
            this.OBJECT = "array-property-object";
            this.FUNCTION = "array-property-function";
            this.UNKNOWN = "array-property-unknown";
    
            this.hasString = function(obj) {
                return scan(obj, type.TYPE_STRING);
            };
            this.hasNumber = function(obj) {
                return scan(obj, type.TYPE_NUMBER);
            };
            this.hasBoolean = function(obj) {
                return scan(obj, type.TYPE_BOOLEAN);
            };
            this.hasArray = function(obj) {
                return scan(obj, type.TYPE_ARRAY);
            };
            this.hasObject = function(obj) {
                return scan(obj, type.TYPE_OBJECT);
            };
            this.hasFunction = function(obj) {
                return scan(obj, type.TYPE_FUNCTION);
            };
            this.hasUnknown = function(obj) {
                return scan(obj, type.TYPE_UNKNOWN);
            };
    
            // validator
            this.getProperties = function(obj) {
                var props = [];
                if (self.hasString(obj)) { props.push(self.STRING); }
                if (self.hasNumber(obj)) { props.push(self.NUMBER); }
                if (self.hasBoolean(obj)) { props.push(self.BOOLEAN); }
                if (self.hasArray(obj)) { props.push(self.ARRAY); }
                if (self.hasObject(obj)) { props.push(self.OBJECT); }
                if (self.hasFunction(obj)) { props.push(self.FUNCTION); }
                if (self.hasUnknown(obj)) { props.push(self.UNKNOWN); }
                return props;
            };
            this.isValid = function(obj) {
                return Object.prototype.toString.call(obj) === "[object Array]";
            };
    
            function scan(obj, t) {
                for (var p in obj) {
                    if (isNaN(p)) {
                        continue;
                    }
                    var objPType = type.getType(obj[p]);
                    if (objPType == t) {
                        return true;
                    }
                }
                return false;
            }
        }
    
        var singleton;
        (function (obj, factory) {
            var supported = false;
            if (typeof define === "function" && (define.amd || define.using)) {
                define(factory);
                if (define.using) {
                    // set optional validator from dependencies
                    var mod = define.cache.get("cc.validate.1.*");
                    if (mod) {
                        Array.prototype = mod.factory().Validator;
                    }
                }
                supported = true;
            }
            if (typeof module === "object" && module.exports && typeof require != "undefined" && require.main !== module) {
                module.exports = factory();
                Array.prototype = require("./cc.validate").Validator;
                supported = true;
            }
            if (!supported) {
                obj.returnExports = factory();
            }
        }(this, function() {
            if (singleton) {
                return singleton;
            }
            singleton = new (Function.prototype.bind.apply(Array, arguments));
            return singleton;
        }));
    })();
})();
//# sourceURL=http://cc.array.1.0.1/array.js
