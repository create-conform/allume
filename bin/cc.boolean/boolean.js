/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.boolean.0.1.1/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.boolean.0.1.1/";
    define.parameters.pkx = {
        "name": "cc.boolean",
        "version": "0.1.1",
        "title": "Boolean Processing And Validation Module",
        "description": "Library for processing and validating booleans.",
        "license": "Apache-2.0",
        "main": "boolean.js",
        "pkxDependencies": [
            {
                "package": "cc.validate.0.1",
                "optional": true
            }
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.validate.0.1/", "patch"));
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.boolean
    //
    //    Library for processing and validating booleans.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    /////////////////////////////////////////////////////////////////////////////////////////////
    
    (function() {
        function Boolean() {
            var self = this;
    
            // validator
            this.getProperties = function(obj) {
                return [];
            };
            this.isValid = function(obj) {
                return Object.prototype.toString.call(obj) === "[object Boolean]";
            };
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
                            Boolean.prototype = mod.factory().Validator;
                        }
                    });
                }
                supported = true;
            }
            if (typeof module === "object" && module.exports && typeof require != "undefined" && typeof require.main != "undefined" && require.main !== module) {
                module.exports = factory();
                Boolean.prototype = require("./cc.validate").Validator;
                supported = true;
            }
            if (!supported) {
                obj.returnExports = factory();
            }
        }(this, function() {
            if (singleton) {
                return singleton;
            }
            singleton = new (Function.prototype.bind.apply(Boolean, arguments));
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
