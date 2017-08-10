/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.object.0.1.1/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.object.0.1.1/";
    define.parameters.pkx = {
        "name": "cc.object",
        "version": "0.1.1",
        "title": "Object Processing And Validation Module",
        "description": "Library for processing and validating objects.",
        "bugs": null,
        "license": "Apache-2.0",
        "author": null,
        "contributors": null,
        "main": "object.js",
        "pkxDependencies": [
            "cc.type.0.1",
            {
                "package": "cc.validate.0.1",
                "optional": true
            }
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration", "requirer" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.type.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.validate.0.1/"));
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.object
    //
    //    Library for processing and validating objects.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    ///////////////////////////////////////////////////////////////////////////////////////////// 
    
    (function() {
        function Object(pkx, module) {
            var self = this;
    
            var type;
            if (typeof require === "function") {
                type = require("./cc.type");
            }
    
            this.FUNCTION = "object-property-function";
            this.PROPERTY = "object-property-property";
    
            this.hasFunction = function(obj) {
                return scan(obj, "[object Function]");
            };
            this.hasProperty = function(obj) {
                for (var p in obj) {
                    return true;
                }
                return false;
            };
    
            this.compare = function(source, target) {
                var match = true;
    
                for (var p in source) {
                    var hPropType = type.getType(target[p]);
                    var val = source[p];
                    var invert = false;
                    var lower = false;
                    var higher = false;
                    var between = false;
    
                    // filter
                    if (type.isString(source[p])) {
                        if (val.indexOf("!") == 0) {
                            // value may not be equal
                            val = val.substr(1);
                            invert = true;
                        }
                        var idx = val.indexOf("~");
                        if (idx == 0) {
                            // value may be lower than or equal to the specified
                            val = val.substr(1);
                            lower = true;
                        }
                        else if (idx == val.length - 1) {
                            // value may be equal to or higher than the specified
                            val = val.substring(0, val.length - 1);
                            higher = true;
                        }
                        else if (idx != -1) {
                            // value is between two values
                            val = val.substring(0, idx);
                            between = val.substr(idx + 1);
                        }
                    }
    
                    // check property match
                    switch(hPropType) {
                        case type.TYPE_STRING:
                            if (lower || higher || between) {
                                // cannonical version string matching
                                if (lower && (string.isOfMinimumVersion(target[p], val) || val == target[p])) {
                                    match = false;
                                } else if (higher && !string.isOfMinimumVersion(target[p], val)) {
                                    match = false;
                                } else if (between && ((string.isOfMinimumVersion(target[p], between) && between != target[p]) && !string.isOfMinimumVersion(target[p], val))) {
                                    match = false;
                                }
                            } else if (val != target[p]) {
                                match = false;
                            }
                            break;
                        case type.TYPE_NUMBER:
                            if (isNaN(val)) {
                                match = false;
                                break;
                            }
                            val = parseFloat(val);
    
                            if (lower || higher || between) {
                                if (lower && val > target[p]) {
                                    match = false;
                                } else if (higher && val < target[p]) {
                                    match = false;
                                } else if (between && (between < target[p] && val > target[p])) {
                                    match = false;
                                }
                            } else if (val != target[p]) {
                                match = false;
                            }
                            break;
                        case type.TYPE_BOOLEAN:
                            val = (val == "true");
    
                            if (val != target[p]) {
                                match = false;
                            }
                            break;
                        case type.TYPE_ARRAY:
                            //TODO
                            // check does contain or does not contain
                            break;
                    }
    
                    if (invert) {
                        match = !match;
                    }
    
                    // stop enumerating source properties if one fails
                    if (!match) {
                        break;
                    }
                }
    
                return match;
            };
    
            // validator
            this.getProperties = function(obj) {
                var props = [];
                if (self.hasFunction(obj)) { props.push(self.FUNCTION); }
                if (self.hasProperty(obj)) { props.push(self.PROPERTY); }
                return props;
            };
            this.isValid = function(obj) {
                return Object.prototype.toString.call(obj) === "[object Object]";
            };
    
            function scan(obj, type) {
                for (var p in obj) {
                    var objPType = Object.prototype.toString.call(obj[p]);
                    if (objPType == type ||
                        Object.getPrototypeOf(obj[p]) == type) {
                        return true;
                    }
    
                    // recursion
                    //if (objPType == "[object Object]") {
                    //    if (scan(obj[p], type)) {
                    //        return true;
                    //    }
                    //}
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
                            Object.prototype = mod.factory().Validator;
                        }
                    });
                }
                supported = true;
            }
            if (typeof module === "object" && module.exports && typeof require != "undefined" && typeof require.main != "undefined" && require.main !== module) {
                module.exports = factory();
                Object.prototype = require("./cc.validate").Validator;
                supported = true;
            }
            if (!supported) {
                obj.returnExports = factory();
            }
        }(this, function() {
            if (singleton) {
                return singleton;
            }
            singleton = new (Function.prototype.bind.apply(Object, arguments));
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
