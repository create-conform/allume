/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.version.0.1.2/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.version.0.1.2/";
    define.parameters.pkx = {
        "name": "cc.version",
        "version": "0.1.2",
        "title": "Semantic Version String Processing And Validation Module",
        "description": "Library for processing and validating semantic version strings.",
        "license": "Apache-2.0",
        "main": "version.js",
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
    // cc.version
    //
    //    Library for processing and validating semantic version strings.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    ///////////////////////////////////////////////////////////////////////////////////////////// 
    
    (function() {
        function Version() {
            var self = this;
    
            this.MAJOR = "version-property-major";
            this.MINOR = "version-property-minor";
            this.PATCH = "version-property-patch";
            this.UPGRADABLE_NONE = null;
            this.UPGRADABLE_PATCH = "patch";
            this.UPGRADABLE_MINOR = "minor";
            this.UPGRADABLE_MAJOR = "major";
    
            function countNumberParts(str) {
                var parts = str.split(".");
                var numbers = 0;
                for (var p = parts.length; p > 0; p--) {
                    if (isNaN(parts[p - 1])) {
                        break;
                    }
                    numbers++;
                }
                return numbers;
            }
    
            this.hasMajor = function(str) {
                return countNumberParts(str) >= 1;
            };
            this.hasMinor = function(str) {
                return countNumberParts(str) >= 2;
            };
            this.hasPatch = function(str) {
                return countNumberParts(str) >= 3;
            };
    
            this.find = function(collection, search, opt_upgradable) {
                var sortedCollection = self.sort(collection, "desc");
                for (var p in sortedCollection) {
                    if (self.compare(sortedCollection[p], search, opt_upgradable)) {
                        return collection[sortedCollection[p]];
                    }
                }
            };
            this.sort = function(collection, order) {
                var props = [];
                for (var p in collection) {
                    props.push(p);
                }
    
                var sort = {
                    asc: function (a, b) {
                        var reA = /[^a-zA-Z]/g;
                        var reN = /[^0-9]/g;
                        for (var l=0;l < Math.min(a.value.length, b.value.length); l++) {
                            if (a.value[l] === b.value[l]) {
                                continue;
                            }
                            // put numbers before strings
                            if (!isNaN(a.value[l]) && isNaN(b.value[l])) {
                                return 1;
                            }
                            if (isNaN(a.value[l]) && !isNaN(b.value[l])) {
                                return -1;
                            }
                            // compare
                            var aA = a.value[l].replace(reA, "");
                            var bA = b.value[l].replace(reA, "");
                            if(aA === bA) {
                                var aN = parseInt(a.value[l].replace(reN, ""), 10);
                                var bN = parseInt(b.value[l].replace(reN, ""), 10);
                                //return aN === bN ? 0 : aN > bN ? 1 : -1;
                                if (aN === bN) {
                                    continue;
                                }
                                return aN > bN ? 1 : -1;
                            } else {
                                return aA > bA ? 1 : -1;
                            }
                        }
                        return 0;
                    },
                    desc: function (a, b) {
                        return sort.asc(b, a);
                    }
                };
    
                var mapped = props.map(function (el, i) {
                    return { index: i, value: el.split(/[\.\/]+/), name : el };
                });
    
                mapped.sort(sort[order] || sort.asc);
    
                return mapped.map(function (el) {
                    return el.name;
                });
            };
            this.compare = function(str, search, opt_upgradable) {
                if (!str || !search) {
                    return;
                }
                var strRes = str.split("/");
                str = strRes[0];
                strRes = strRes.join("/").substr(str.length);
                var searchRes = search.split("/");
                search = searchRes[0];
                searchRes = searchRes.join("/").substr(search.length);
                var groups = 0;
                switch (opt_upgradable) {
                    case "patch":
                        groups = 1;
                        break;
                    case "minor":
                        groups = 2;
                        break;
                    case "major":
                        groups = 3;
                        break;
                }
                //if (groups === 0) {
                //    return str == search;
                //}
                var parts = search.split(".");
                var numbers = 0;
                for (var p = parts.length; p > 0; p--) {
                    if (isNaN(parts[p - 1])) {
                        break;
                    }
                    numbers++;
                }
                var match = str.split(".");
                // if parts are not equal, they can't match
                if (match.length != (parts.length - numbers) + 3 || strRes != searchRes) {
                    return false;
                }
                // check if id string without number parts match
                for (var p = 0; p < parts.length - numbers; p++) {
                    if (match.length < p || match[p] != parts[p]) {
                        return false;
                    }
                }
                // check the number parts
                for (var g = 0; g < 3; g++) {
                    if (g < 3 - numbers) {
                        continue;
                    }
                    if (g < groups && match[match.length - 1 - g] < parts[parts.length - 1 - (g - (3 - numbers))]) {
                        return false;
                    }
                    else if(g >= groups && match[match.length - 1 - g] != parts[parts.length - 1 - (g - (3 - numbers))]) {
                        return false;
                    }
                }
    
                return true;
            };
    
            // validator
            this.getProperties = function(str) {
                var props = [];
                var numbers = countNumberParts(str);
                if (numbers >= 3) {
                    props.push(self.PATCH);
                }
                if (numbers >= 2) {
                    props.push(self.MINOR);
                }
                if (numbers >= 1) {
                    props.push(self.MAJOR);
                }
                return props;
            };
            this.isValid = function(str) {
                return Object.prototype.toString.call(str) === "[object String]";
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
                            Version.prototype = mod.factory().Validator;
                        }
                    });
                }
                supported = true;
            }
            if (typeof module === "object" && module.exports && typeof require != "undefined" && typeof require.main != "undefined" && require.main !== module) {
                module.exports = factory();
                Version.prototype = require("./cc.validate").Validator;
                supported = true;
            }
            if (!supported) {
                obj.returnExports = factory();
            }
        }(this, function() {
            if (singleton) {
                return singleton;
            }
            singleton = new (Function.prototype.bind.apply(Version, arguments));
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
