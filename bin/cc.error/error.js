/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.error.0.1.1/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.error.0.1.1/";
    define.parameters.pkx = {
        "name": "cc.error",
        "version": "0.1.1",
        "title": "Error Module",
        "description": "Library for standardizing error throwing.",
        "bugs": null,
        "license": "Apache-2.0",
        "author": null,
        "contributors": null,
        "main": "error.js"
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration", "requirer" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.error
    //
    //    Library for standardizing error throwing.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    ///////////////////////////////////////////////////////////////////////////////////////////// 
    
    (function() {
        var ERROR_UNKNOWN = "error-unknown";
    
        var originalError = Error;
    
        Error = function(name, message, innerError, data) {
            this.innerError = null;
            this.data = null;
    
            if (!(this instanceof Error)) {
                throw new TypeError("Constructor 'Error' cannot be invoked without 'new'.");
            }
            else if (arguments.length >= 4) {
                this.data = data;
                this.innerError = innerError instanceof Error || innerError instanceof originalError ? innerError : null;
                this.message = message;
                this.name = name;
            }
            else if (arguments.length >= 3) {
                if (innerError instanceof Error || innerError instanceof originalError) {
                    this.innerError = innerError;
                }
                else {
                    this.data = innerError;
                }
                this.message = message;
                this.name = name;
            }
            else if (arguments.length == 2) {
                this.name = name;
                if (message instanceof Error || message instanceof originalError) {
                    this.innerError = message;
                }
                else {
                    this.message = message;
                }
            }
            else {
                this.name = ERROR_UNKNOWN;
                if (name instanceof Error) {
                    this.innerError = name;
                }
                else {
                    this.message = name;
                }
            }
    
            if (this.innerError) {
                // set stack to innerError stack
                this.stack = this.innerError.stack;
            }
            else if (originalError.captureStackTrace) {
                // stack trace in V8
                originalError.captureStackTrace(this, Error);
            }
            else {
                this.stack = (new originalError).stack;
            }
        };
        Error.prototype = Object.create(originalError.prototype);
        Error.prototype.name = "Error";
        Error.captureStackTrace = originalError.captureStackTrace;
    
        (function (obj, factory) {
            if (typeof define === "function" && (define.amd || define.using)) {
                define(factory);
            } else if (typeof module === "object" && module.exports) {
                module.exports = new factory();
            } else {
                obj.returnExports = new factory();
            }
        }(this, function Error() {
            this.ERROR_UNKNOWN = ERROR_UNKNOWN;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
