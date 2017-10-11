/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.validate.0.2.0/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.validate.0.2.0/";
    define.parameters.pkx = {
        "name": "cc.validate",
        "version": "0.2.0",
        "title": "Data Validation Module",
        "description": "Library for validating data.",
        "license": "Apache-2.0",
        "pkx": {
            "main": "validate.js"
        }
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration", "requirer" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.validate
    //
    //    Library for validating data.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    ///////////////////////////////////////////////////////////////////////////////////////////// 
    
    (function() {
        var ERROR_IS_NULL = "error-is-null";
        var ERROR_IS_NOT_NULL = "error-is-not-null";
        var ERROR_PROPERTY_MISSING = "error-property-missing";
        var ERROR_PROPERTY_NOT_ALLOWED = "error-property-not-allowed";
        var ERROR_CONDITION_NOT_ALLOWED = "error-condition-not-allowed";
        var ERROR_CONDITION_NOT_MET = "error-condition-not-met";
    
        var ERROR_INVALID_CONDITION = "error-invalid-condition";
        var ERROR_INVALID_OPERATOR = "error-invalid-operator";
        var ERROR_INVALID_VALIDATOR = "error-invalid-validator";
        var ERROR_INVALID_MODE = "error-invalid-mode";
    
        var MODE_ALLOW = "mode-allow";
        var MODE_DENY = "mode-deny";
    
        var Validator = {
            getProperties : function() {
                throw new Error(ERROR_INVALID_VALIDATOR, "The validator does not implement the 'getProperties' function.");
            },
            isValid : function() {
                throw new Error(ERROR_INVALID_VALIDATOR, "The validator does not implement the 'isValid' function.");
            }
        };
        function Expression(obj, validator, errName) {
            var self = this;
            var opt_mode;
    
            // bypass check if script was loaded using require function in node.js
            if ((typeof require === "undefined" || (typeof module !== "undefined" && require.main === module)) && (!validator || (Object.getPrototypeOf(validator) != Validator))) {
                throw new Error(ERROR_INVALID_VALIDATOR, "Mandatory parameter 'validator' should be a prototype of 'cc.validate.Validator'.");
            }
    
            this.allow = function() {
                opt_mode = MODE_ALLOW;
                return self.has.apply(this, arguments);
            };
            this.deny = function() {
                opt_mode = MODE_DENY;
                return self.has.apply(this, arguments);
            };
            this.has = function() {
                if (obj) {
                    var args = [];
                    for (var a in arguments) {
                        if (Object.prototype.toString.call(arguments[a]) === "[object Array]") {
                            if (!opt_mode) {
                                var oneMatch = false;
                                for (var i in arguments[a]) {
                                    try {
                                        self.has(arguments[a][i]);
                                        oneMatch = true;
                                    }
                                    catch (e) {
                                        //ignore
                                    }
                                }
                                if (!oneMatch) {
                                    throw new Error(errName || ERROR_PROPERTY_MISSING, "The object is missing one of these properties: '" + JSON.stringify(arguments[a]) + "'.");
                                }
                            }
                            else {
                                for (var i in arguments[a]) {
                                    args.push(arguments[a][i]);
                                }
                            }
                        }
                        else {
                            args.push(arguments[a]);
                        }
                    }
                    var props = validator.getProperties(obj);
                    if (!opt_mode) {
                        for (var a in args) {
                            var found = false;
                            for (var p in props) {
                                if (args[a] == props[p]) {
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                throw new Error(errName || ERROR_PROPERTY_MISSING, "Property '" + args[a] + "' is missing.");
                            }
                        }
                    }
                    else if (opt_mode == MODE_ALLOW ||
                        opt_mode == MODE_DENY) {
                        for (var p in props) {
                            var found = false;
                            for (var a in args) {
                                if (args[a] == props[p]) {
                                    found = true;
                                    break;
                                }
                            }
                            if ((!found && opt_mode == MODE_ALLOW) ||
                                (found && opt_mode == MODE_DENY)) {
                                throw new Error(errName || ERROR_PROPERTY_NOT_ALLOWED, "Property '" + props[p] + "' is not allowed.");
                            }
                        }
                    }
                    else {
                        throw new Error(errName || ERROR_INVALID_MODE, "Mode '" + opt_mode + "' is not a known validation mode.");
                    }
                }
                return new Expression(obj, validator, errName);
            };
            this.when = function(condition) {
                if (obj) {
                    var match = true;
                    if (Object.prototype.toString.call(condition) === "[object Function]") {
                        var args = [obj];
                        for (var i = 1; i < arguments.length; i++) {
                            args.push(arguments[i]);
                        }
                        try {
                            match = condition.apply(condition, args);
                        }
                        catch (e) {
                            match = false;
                        }
                    }
                    if (!match ||
                        (!match && Object.prototype.toString.call(condition) === "[object Boolean]" && !condition)) {
                        throw new Error(errName || ERROR_INVALID_CONDITION, "Condition not met.");
                    }
                }
                return new Expression(obj, validator, errName);
            };
            this.notNull = function() {
                if (obj) {
                    return new Expression(obj, validator, errName);
                }
                throw new Error(errName || ERROR_IS_NULL, "The object should not be null.");
            };
        }
        function Validate(obj, validator, errName) {
            var self = this;
    
            this.ERROR_IS_NULL = ERROR_IS_NULL;
            this.ERROR_IS_NOT_NULL = ERROR_IS_NOT_NULL;
            this.ERROR_PROPERTY_MISSING = ERROR_PROPERTY_MISSING;
            this.ERROR_PROPERTY_NOT_ALLOWED = ERROR_PROPERTY_NOT_ALLOWED;
            this.ERROR_CONDITION_NOT_ALLOWED = ERROR_CONDITION_NOT_ALLOWED;
            this.ERROR_CONDITION_NOT_MET = ERROR_CONDITION_NOT_MET;
    
            this.ERROR_INVALID_CONDITION = ERROR_INVALID_CONDITION;
            this.ERROR_INVALID_OPERATOR = ERROR_INVALID_OPERATOR;
            this.ERROR_INVALID_VALIDATOR = ERROR_INVALID_VALIDATOR;
            this.ERROR_INVALID_MODE = ERROR_INVALID_MODE;
    
            this.Validator = Validator;
            this.Expression = Expression;
    
            if (!(this instanceof Validate) && arguments.length > 0) {
                if (Object.getPrototypeOf(validator) == Validator && obj) {
                    validator.isValid(obj);
                }
    
                return new Expression(obj, validator, errName);
            }
            else {
                return Validate;
            }
        }
        Validate.Validator = Validator;
        Validate.Expression = Expression;
    
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
            singleton = new (Function.prototype.bind.apply(Validate, arguments));
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
