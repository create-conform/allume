/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.string.0.1.2/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.string.0.1.2/";
    define.parameters.pkx = {
        "name": "cc.string",
        "version": "0.1.2",
        "title": "String Processing And Validation Module",
        "description": "Library for processing and validating strings.",
        "bugs": null,
        "license": "Apache-2.0",
        "author": null,
        "contributors": null,
        "main": "string.js",
        "pkxDependencies": [
            {
                "package": "cc.validate.0.1",
                "optional": true
            }
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.validate.0.1/"));
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.string
    //
    //    Library for processing and validating strings.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    ///////////////////////////////////////////////////////////////////////////////////////////// 
    
    (function() {
        function String() {
            var self = this;
    
            // Copyright (c) 2010-2013 Diego Perini (http://www.iport.it), LICENSE MIT
            var RE_URL = new RegExp(
                "^" +
                    // protocol identifier (modified for matching any protocol)
                "(?:(?:[a-zA-Z]+)://)" +
                    // user:pass authentication
                "(?:\\S+(?::\\S*)?@)?" +
                "(?:" +
                    // host name
                "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
                    // domain name
                "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
                    // domain may end with dot
                "\\.?" +
                ")" +
                    // port number
                "(?::\\d{2,5})?" +
                    // resource path
                "(?:[/?#]\\S*)?" +
                "$", "i"
            );
            var RE_URL_PUBLIC = new RegExp(
                "^" +
                    // protocol identifier (modified for matching any protocol)
                "(?:(?:[a-zA-Z]+)://)" +
                    // user:pass authentication
                "(?:\\S+(?::\\S*)?@)?" +
                "(?:" +
                    // IP address exclusion
                    // private & local networks
                "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
                "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
                "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
                    // IP address dotted notation octets
                    // excludes loopback network 0.0.0.0
                    // excludes reserved space >= 224.0.0.0
                    // excludes network & broacast addresses
                    // (first & last IP address of each class)
                "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
                "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
                "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
                "|" +
                    // host name
                "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
                    // domain name
                "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
                    // TLD identifier
                "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
                    // TLD may end with dot
                "\\.?" +
                ")" +
                    // port number
                "(?::\\d{2,5})?" +
                    // resource path
                "(?:[/?#]\\S*)?" +
                "$", "i"
            );
            var RE_EMAIL = new RegExp(
                /^[A-Za-z0-9](([_\.\-]?[a-zA-Z0-9]+)*)@([A-Za-z0-9]+)(([\.\-]?[a-zA-Z0-9]+)*)\.([A-Za-z]{2,})$/
            );
            var RE_EMAIL_RFC2822 = new RegExp(
                /((([a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*)|("(([\x01-\x08\x0B\x0C\x0E-\x1F\x7F]|[\x21\x23-\x5B\x5D-\x7E])|(\\[\x01-\x09\x0B\x0C\x0E-\x7F]))*"))@(([a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*)|(\[(([\x01-\x08\x0B\x0C\x0E-\x1F\x7F]|[\x21-\x5A\x5E-\x7E])|(\\[\x01-\x09\x0B\x0C\x0E-\x7F]))*])))/
            );
            var RE_SEMVER = new RegExp(
                /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(\+[0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*)?$/
            );
    
            this.UPPERCASE_LETTER = "string-property-uppercase-letter";
            this.LOWERCASE_LETTER = "string-property-lowercase-letter";
            this.LETTER = [ this.UPPERCASE_LETTER, this.LOWERCASE_LETTER ];
            this.DIGIT = "string-property-digit";
            this.DOT = "string-property-dot";
            this.DASH = "string-property-dash";
            this.UNDERSCORE = "string-property-underscore";
            this.BACKSLASH = "string-property-backslash";
            this.SLASH = "string-property-slash";
            this.AT = "string-property-at";
            this.QUOTE = "string-property-quote";
            this.DOUBLEQUOTE = "string-property-doublequote";
            this.SPACE = "string-property-space";
            this.COLON = "string-property-colon";
            this.COMMA = "string-property-comma";
            this.SEMICOLON = "string-property-semicolon";
            this.OTHER = "string-property-other";
    
            this.trim = (function () {
                "use strict";
    
                function escapeRegex(string) {
                    return string.replace(/[\[\](){}?*+\^$\\.|\-]/g, "\\$&");
                }
    
                return function trim(str, characters, flags) {
                    characters = characters != null && characters != ""? characters : " ";
                    flags = flags || "g";
                    if (typeof str !== "string" || typeof characters !== "string" || typeof flags !== "string") {
                        throw new TypeError("Argument must be string.");
                    }
    
                    if (!/^[gi]*$/.test(flags)) {
                        throw new RangeError("Invalid flags supplied '" + flags.match(new RegExp("[^gi]*")) + "'.");
                    }
    
                    characters = escapeRegex(characters);
    
                    return str.replace(new RegExp("^[" + characters + "]+|[" + characters + "]+$", flags), '');
                };
            }());
            this.padLeft = function(str, length, char) {
                return typeof str != "string" || length <= str.length? str : (new Array((length - str.length) + 1)).join(char || " ") + str;
            };
            this.padRight = function(str, length, char) {
                return typeof str != "string" || length <= str.length? str : str + (new Array((length - str.length) + 1)).join(char || " ");
            };
            this.toBase64 = function(str) {
                if (typeof btoa != "undefined" && Object.prototype.toString.call(btoa) === "[object Function]") {
                    return btoa(str);
                }
                if (typeof Buffer != "undefined") {
                    return new Buffer(str).toString("base64");
                }
                throw "Can't convert string to base64. Runtime is not supported.";
            };
    
            this.isUpperCase = function(str) {
                return str === str.toUpperCase();
            };
            this.isLowerCase = function(str) {
                return str && str === str.toLowerCase();
            };
            this.isURL = function(str, type) {
                if (typeof str !== "string") {
                    return false;
                }
                switch(type) {
                    case "public":
                        return str && RE_URL_PUBLIC.test(str);
                    default:
                        return str && RE_URL.test(str);
                }
            };
            this.isPath = function(str) {
                return str && (str.match(/^(\/)?([^\/\0]+(\/)?)+$/) != null);
            };
            this.isEmail = function(str) {
                return str && RE_EMAIL.test(str);
            };
            this.isEmailRFC2822 = function(str) {
                return str && RE_EMAIL_RFC2822.test(str);
            };
            this.isSemVer = function(str) {
                return str && RE_SEMVER.test(str);
            };
            this.isEmpty = function(str) {
                return str && str != "";
            };
            this.hasLowerCase = function(str) {
                return str && (str.match(/[a-z]/) != null);
            };
            this.hasUpperCase = function(str) {
                return str && (str.match(/[A-Z]/) != null);
            };
            this.hasLetter = function(str) {
                return str && (str.match(/[a-z]/i) != null);
            };
            this.hasDigit = function(str) {
                return str && (str.match(/[0-9]/i) != null);
            };
            this.hasDot = function(str) {
                return str && (str.match(/\./i) != null);
            };
            this.hasDash = function(str) {
                return str && (str.match(/\-/i) != null);
            };
            this.hasUnderscore = function(str) {
                return str && (str.match(/_/i) != null);
            };
            this.hasBackslash = function(str) {
                return str && (str.match(/\\/i) != null);
            };
            this.hasSlash = function(str) {
                return str && (str.match(/\//i) != null);
            };
            this.hasAt = function(str) {
                return str && (str.match(/@/i) != null);
            };
            this.hasQuote = function(str) {
                return str && (str.match(/'/i) != null);
            };
            this.hasDoubleQuote = function(str) {
                return str && (str.match(/"/i) != null);
            };
            this.hasSpace = function(str) {
                return str && (str.match(/\s/) != null);
            };
            this.hasColon = function(str) {
                return str && (str.match(/:/) != null);
            };
            this.hasComma = function(str) {
                return str && (str.match(/,/) != null);
            };
            this.hasSemiColon = function(str) {
                return str && (str.match(/;/) != null);
            };
            this.hasOther = function(str) {
                return str && (str.match(/[^A-Za-z0-9\.\-_\\\/@'"\s:,;]/) != null);
            };
    
            String.prototype.isUpperCase = function () { return self.isUpperCase(this.toString()); };
            String.prototype.isLowerCase = function () { return self.isLowerCase(this.toString()); };
            String.prototype.toBase64 = function () { return self.toBase64(this.toString()); };
    
            // validator
            this.getProperties = function(str) {
                var props = [];
                if (self.hasLowerCase(str)) { props.push(self.LOWERCASE_LETTER); }
                if (self.hasUpperCase(str)) { props.push(self.UPPERCASE_LETTER); }
                if (self.hasDigit(str)) { props.push(self.DIGIT); }
                if (self.hasDot(str)) { props.push(self.DOT); }
                if (self.hasDash(str)) { props.push(self.DASH); }
                if (self.hasUnderscore(str)) { props.push(self.UNDERSCORE); }
                if (self.hasBackslash(str)) { props.push(self.BACKSLASH); }
                if (self.hasSlash(str)) { props.push(self.SLASH); }
                if (self.hasAt(str)) { props.push(self.AT); }
                if (self.hasQuote(str)) { props.push(self.QUOTE); }
                if (self.hasDoubleQuote(str)) { props.push(self.DOUBLEQUOTE); }
                if (self.hasSpace(str)) { props.push(self.SPACE); }
                if (self.hasColon(str)) { props.push(self.COLON); }
                if (self.hasComma(str)) { props.push(self.COMMA); }
                if (self.hasSemiColon(str)) { props.push(self.SEMICOLON); }
                if (self.hasOther(str)) { props.push(self.OTHER); }
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
                            String.prototype = mod.factory().Validator;
                        }
                    });
                }
                supported = true;
            }
            if (typeof module === "object" && module.exports && typeof require != "undefined" && typeof require.main != "undefined" && require.main !== module) {
                module.exports = factory();
                String.prototype = require("./cc.validate").Validator;
                supported = true;
            }
            if (!supported) {
                obj.returnExports = factory();
            }
        }(this, function() {
            if (singleton) {
                return singleton;
            }
            singleton = new (Function.prototype.bind.apply(String, arguments));
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
