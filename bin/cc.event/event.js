/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.event.0.1.1/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.event.0.1.1/";
    define.parameters.pkx = {
        "name": "cc.event",
        "version": "0.1.1",
        "title": "Event Module",
        "description": "Library for emitting events.",
        "bugs": null,
        "license": "Apache-2.0",
        "author": null,
        "contributors": null,
        "main": "event.js"
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration", "requirer" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.event
    //
    //    Library for emitting events.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    ///////////////////////////////////////////////////////////////////////////////////////////// 
    
    (function() {
        function Event() {
            var self = this;
    
            this.Emitter = function (context) {
                var own = this;
                var callbacks = [];
    
                this.on = function (type, callback) {
                    if (Object.prototype.toString.call(type) === "[object Array]") {
                        for (var t in type) {
                            own.on(type[t], callback);
                        }
                        return;
                    }
                    var clb = {"callback": callback, "type": type};
                    clb.id = callbacks.push(clb) - 1;
    
                    return clb.id;
                };
                this.addEventListener = this.on;
                if (context && !context.addEventListener) {
                    context.addEventListener = this.on;
                }
                if (context && !context.on) {
                    context.on = this.on;
                }
    
                this.removeEventListener = function (id) {
                    if (Object.prototype.toString.call(id) === "[object Function]") {
                        for (var i in callbacks) {
                            if (callbacks[i].callback == id) {
                                callbacks.splice(i, 1);
                                i--;
                            }
                        }
                    }
                    else {
                        callbacks.splice(id, 1);
                    }
                };
                if (context && !context.removeEventListener) {
                    context.removeEventListener = this.removeEventListener;
                }
    
                this.fire = function (type, opt_arg) {
                    for (var e = 0; e < callbacks.length; e++) {
                        if (callbacks[e] != null && (callbacks[e].type == type || callbacks[e].type == "*")) {
                            try {
                                var a = [context || global || window];
                                for (var i in arguments) {
                                    if (i == 0) {
                                        continue;
                                    }
                                    a.push(arguments[i]);
                                }
                                if (callbacks[e].type == "*") {
                                    a.unshift(type);
                                }
                                var retVal = callbacks[e].callback.apply(context, a);
                                if (retVal == true) {
                                    return true;
                                }
                            }
                            catch (ex) {
                                if (Object.prototype.toString.call(callbacks[e].callback) !== "[object Function]") {
                                    context.removeEventListener(e);
                                    e--;
                                }
                            }
                        }
                    }
                };
            };
            this.Progress = function (progress) {
                this.percentage = progress ? progress.percentage : 0;
                this.operation = new self.Operation(progress ? progress.operation : null);
                this.emitter = progress ? progress.emitter : null;
            };
            this.Operation = function (operation) {
                this.type = operation ? operation.type : null;
                this.data = operation ? operation.data : null;
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
            singleton = new (Function.prototype.bind.apply(Event, arguments));
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
