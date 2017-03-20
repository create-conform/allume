/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.boolean.1.0.1/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function() {
    var require = define.getRequire("cc.boolean.1.0.1/");
    define.parameters = {};
    define.parameters.system = "pkx";
    define.parameters.id = "cc.boolean.1.0.1/";
    define.parameters.pkx = {
        "company": "cc",
        "product": "",
        "name": "boolean",
        "version": "1.0.1",
        "title": "Boolean Processing And Validation Module",
        "description": "Library for processing and validating booleans.",
        "bugs": null,
        "license": "Apache-2.0",
        "author": null,
        "contributors": null,
        "main": "boolean.js",
        "dependencies": [
            {
                "package": "cc.validate.1.0",
                "optional": true
            }
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("[object Object]/"));
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
                    // set optional validator from dependencies
                    var mod = define.cache.get("cc.validate.1.*");
                    if (mod) {
                        Boolean.prototype = mod.factory().Validator;
                    }
                }
                supported = true;
            }
            if (typeof module === "object" && module.exports && typeof require != "undefined" && require.main !== module) {
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
})();
//# sourceURL=http://cc.boolean.1.0.1/boolean.js
