/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.array.0.1.1/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.array.0.1.1/";
    define.parameters.pkx = {
        "name": "cc.array",
        "version": "0.1.1",
        "title": "Array Processing And Validation Module",
        "description": "Library for processing and validating arrays.",
        "license": "Apache-2.0",
        "main": "array.js",
        "pkxDependencies": [
            "cc.type.0.1",
            {
                "package": "cc.validate.0.1",
                "optional": true
            }
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.type.0.1/", "patch"));
    define.parameters.dependencies.push(define.cache.get("cc.validate.0.1/", "patch"));
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
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
                    define.Loader.waitFor("pkx", function() {
                        // set optional validator from dependencies
                        var mod = define.cache.get("cc.validate.1", "minor");
                        if (mod) {
                            Array.prototype = mod.factory().Validator;
                        }
                    });
                }
                supported = true;
            }
            if (typeof module === "object" && module.exports && typeof require != "undefined" && typeof require.main != "undefined" && require.main !== module) {
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
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
