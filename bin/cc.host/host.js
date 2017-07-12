/////////////////////////////////////////////////////////////////////////////////////
//
// module 'cc.host.0.1.8/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "cc.host.0.1.8/";
    define.parameters.pkx = {
        "name": "cc.host",
        "version": "0.1.8",
        "title": "Host Module",
        "description": "Library that provides information about the host environment.",
        "bugs": null,
        "author": null,
        "contributors": null,
        "main": "host.js"
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // cc.host
    //
    //    Library that provides information about the host environment.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    /////////////////////////////////////////////////////////////////////////////////////////////
    
    (function() {
        function Host() {
            this.RUNTIME_BROWSER = "browser";
            this.RUNTIME_BROWSER_BLINK = "browser blink";
            this.RUNTIME_BROWSER_CHROME = "browser chrome";
            this.RUNTIME_BROWSER_FIREFOX = "browser firefox";
            this.RUNTIME_BROWSER_SAFARI = "browser safari";
            this.RUNTIME_BROWSER_INTERNET_EXPLORER = "browser internet-explorer";
            this.RUNTIME_BROWSER_EDGE = "browser edge";
            this.RUNTIME_BROWSER_OPERA = "browser opera";
            this.RUNTIME_NWJS = "nw-js";
            this.RUNTIME_NODEJS = "node-js";
            this.RUNTIME_ELECTRON = "electron";
            this.RUNTIME_ADOBECEP = "adobe-cep";
            this.RUNTIME_ADOBEJSX = "adobe-jsx";
            this.RUNTIME_UNKNOWN = "unknown";
            this.PLATFORM_WINDOWS = "windows";
            this.PLATFORM_LINUX = "linux";
            this.PLATFORM_MACOS = "macos";
            this.PLATFORM_IOS = "ios";
            this.PLATFORM_ANDROID = "android";
            this.PLATFORM_UNKNOWN = "unknown";
            this.PLATFORM_FREEBSD = "freebsd";
            this.PLATFORM_SOLARIS = "solaris";
            this.PLATFORM_LINUX_READYNASOS = "linux readynasos";
            this.PLATFORM_LINUX_DEBIAN = "linux debian";                                //unsupported
            this.PLATFORM_LINUX_FEDORA = "linux fedora";                                //unsupported
            this.PLATFORM_LINUX_GENTOO = "linux gentoo";                                //unsupported
            this.PLATFORM_LINUX_MANDRAKE = "linux mandrake";                            //unsupported
            this.PLATFORM_LINUX_SUSE = "linux suse";                                    //unsupported
            this.PLATFORM_LINUX_REDHAT = "linux red-hat";                               //unsupported
            this.PLATFORM_LINUX_SLACKWARE = "linux slackware";                          //unsupported
            this.PLATFORM_LINUX_UBUNTU = "linux ubuntu";
            this.PLATFORM_LINUX_CHAKRA = "linux chakra";
            this.PLATFORM_LINUX_IYCC = "linux iycc";
            this.PLATFORM_LINUX_MINT = "linux mint";
            this.VERSION_UNKNOWN = "unknown";
            this.PLATFORM_ARCHITECTURE_X86 = "x86";
            this.PLATFORM_ARCHITECTURE_X64 = "x64";
            this.PLATFORM_ARCHITECTURE_ARM = "arm";
            this.PLATFORM_ARCHITECTURE_ARM64 = "arm64";
            this.PLATFORM_ARCHITECTURE_UNKNOWN = "unknown";
    
            this.ERROR_RUNTIME_NOT_SUPPORTED = "error-runtime-not-supported";
    
            var runtime;
            Object.defineProperty(this, "runtime", {
                get: function () {
                    if (!runtime) {
                        runtime = detectRuntime();
                    }
                    return runtime;
                }
            });
    
            var runtimeVersion;
            Object.defineProperty(this, "runtimeVersion", {
                get: function () {
                    //runtimeVersion detection is dependent on platform detection
                    if (!runtimeVersion) {
                        runtimeVersion = detectRuntimeVersion();
                    }
                    return runtimeVersion;
                }
            });
    
            var platform;
            Object.defineProperty(this, "platform", {
                get: function () {
                    if (!platform) {
                        platform = detectPlatform();
                    }
                    return platform;
                }
            });
    
            var platformVersion;
            Object.defineProperty(this, "platformVersion", {
                get: function () {
                    //platformVersion detection is dependent on platform detection
                    if (!platformVersion) {
                        platformVersion = detectPlatformVersion();
                    }
                    return platformVersion;
                }
            });
    
            var platformArchitecture;
            Object.defineProperty(this, "platformArchitecture", {
                get: function () {
                    if (!platformArchitecture) {
                        platformArchitecture = detectPlatformArchitecture();
                    }
                    return platformArchitecture;
                }
            });
    
            this.isPlatformLinuxFamily = function () {
                switch (singleton.platform) {
                    case singleton.PLATFORM_LINUX:
                    case singleton.PLATFORM_LINUX_CHAKRA:
                    case singleton.PLATFORM_LINUX_DEBIAN:
                    case singleton.PLATFORM_LINUX_FEDORA:
                    case singleton.PLATFORM_LINUX_GENTOO:
                    case singleton.PLATFORM_LINUX_IYCC:
                    case singleton.PLATFORM_LINUX_MANDRAKE:
                    case singleton.PLATFORM_LINUX_MINT:
                    case singleton.PLATFORM_LINUX_READYNASOS:
                    case singleton.PLATFORM_LINUX_REDHAT:
                    case singleton.PLATFORM_LINUX_SLACKWARE:
                    case singleton.PLATFORM_LINUX_SUSE:
                    case singleton.PLATFORM_LINUX_UBUNTU:
                        return true;
                    default:
                        return false;
                }
            };
            this.isRuntimeBrowserFamily = function () {
                switch (singleton.runtime) {
                    case singleton.RUNTIME_BROWSER:
                    case singleton.RUNTIME_BROWSER_BLINK:
                    case singleton.RUNTIME_BROWSER_CHROME:
                    case singleton.RUNTIME_BROWSER_EDGE:
                    case singleton.RUNTIME_BROWSER_FIREFOX:
                    case singleton.RUNTIME_BROWSER_INTERNET_EXPLORER:
                    case singleton.RUNTIME_BROWSER_OPERA:
                    case singleton.RUNTIME_BROWSER_SAFARI:
                    case singleton.RUNTIME_NWJS:
                    case singleton.RUNTIME_ELECTRON:
                    case singleton.RUNTIME_ADOBECEP:
                        return true;
                    default:
                        return false;
                }
            };
            this.isRuntimeNodeFamily = function () {
                switch (singleton.runtime) {
                    case singleton.RUNTIME_NODEJS:
                    case singleton.RUNTIME_NWJS:
                    case singleton.RUNTIME_ELECTRON:
                    case singleton.RUNTIME_ADOBECEP:
                        return true;
                    default:
                        return false;
                }
            };
    
            function detectRuntime() {
                try {
                    var gui = require("nw.gui");
                    if (gui) {
                        return singleton.RUNTIME_NWJS;
                    }
                } catch (e) {
                    //TEST FAILED, CHECK OTHERS
                }
                //IS TESSEL A RUNTIME OR A PLATFORM??
                /*try {
                 var tessel = require('tessel');
                 return singleton.RUNTIME_TESSEL;
                 } catch(e) {
                 }*/
                if (typeof window !== "undefined" && window.process && window.process.type === "renderer") {
                    return singleton.RUNTIME_ELECTRON;
                }
                if (typeof window !== "undefined" && window.__adobe_cep__) {
                    return singleton.RUNTIME_ADOBECEP;
                }
                if (new Function("try {return this===global;}catch(e){return false;}") && typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node !== "undefined") {
                    return singleton.RUNTIME_NODEJS
                }
                if (typeof window !== "undefined" && new Function("try {return this===window;}catch(e){ return false;}")) {
                    //Thank you! specific browser detection
                    //http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
    
                    // Opera 8.0+
                    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
                    if (isOpera) {
                        return singleton.RUNTIME_BROWSER_OPERA;
                    }
    
                    // Firefox 1.0+
                    var isFirefox = typeof InstallTrigger !== 'undefined';
                    if (isFirefox) {
                        return singleton.RUNTIME_BROWSER_FIREFOX;
                    }
    
                    // Safari 3.0+ "[object HTMLElementConstructor]"
                    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0 || (function (p) {
                            return p.toString() === "[object SafariRemoteNotification]";
                        })(!window['safari'] || safari.pushNotification);
                    if (isSafari) {
                        return singleton.RUNTIME_BROWSER_SAFARI;
                    }
    
                    // Internet Explorer 6-11
                    var isIE = /*@cc_on!@*/false || !!document.documentMode;
                    if (isIE) {
                        return singleton.RUNTIME_BROWSER_INTERNET_EXPLORER;
                    }
    
                    // Edge 20+
                    var isEdge = !isIE && !!window.StyleMedia;
                    if (isEdge) {
                        return singleton.RUNTIME_BROWSER_EDGE;
                    }
    
                    // Chrome 1+
                    var isChrome = !!window.chrome && !!window.chrome.webstore;
                    if (isChrome) {
                        return singleton.RUNTIME_BROWSER_CHROME;
                    }
    
                    // Blink engine detection
                    var isBlink = (isChrome || isOpera) && !!window.CSS;
                    if (isBlink) {
                        return singleton.RUNTIME_BROWSER_BLINK;
                    }
    
                    //no match, unknown browser
                    return singleton.RUNTIME_BROWSER;
                }
                if (typeof JSXGlobals !== "undefined") {
                    return singleton.RUNTIME_ADOBEJSX;
                }
                return singleton.RUNTIME_UNKNOWN;
            }
    
            function detectRuntimeVersion() {
                if (!runtime) {
                    runtime = detectRuntime();
                }
                if (!platform) {
                    platform = detectPlatform();
                }
    
                //the version could have been set by running the detectPlatform function
                if (runtimeVersion) {
                    return runtimeVersion;
                }
    
                //for browsers the runtime version is aquired in by running the detectPlatform function.
                switch (runtime) {
                    case singleton.RUNTIME_NODEJS:
                        return process.versions.node;
                    case singleton.RUNTIME_NWJS:
                        return process.versions["node-webkit"];
                    case singleton.RUNTIME_ELECTRON:
                        return process.versions["electron"];
                    case singleton.RUNTIME_ADOBECEP:
                        if (typeof window.__adobe_cep__.getHostEnvironment == "function") {
                            var env = JSON.parse(window.__adobe_cep__.getHostEnvironment());
                            return env.appId + " " + env.appVersion;
                        }
                }
    
                return singleton.VERSION_UNKNOWN;
            }
    
            function detectPlatform() {
                if (!runtime) {
                    runtime = detectRuntime();
                }
    
                if (runtime == singleton.RUNTIME_BROWSER ||
                    runtime == singleton.RUNTIME_BROWSER_BLINK ||
                    runtime == singleton.RUNTIME_BROWSER_CHROME ||
                    runtime == singleton.RUNTIME_BROWSER_FIREFOX ||
                    runtime == singleton.RUNTIME_BROWSER_SAFARI ||
                    runtime == singleton.RUNTIME_BROWSER_INTERNET_EXPLORER ||
                    runtime == singleton.RUNTIME_BROWSER_EDGE ||
                    runtime == singleton.RUNTIME_BROWSER_OPERA) {
                    /*if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
                     return singleton.PLATFORM_IOS;
                     }
                     if (navigator.appVersion.indexOf("Win")!=-1) {
                     return singleton.PLATFORM_WINDOWS;
                     }
                     if (navigator.appVersion.indexOf("Mac")!=-1) {
                     return singleton.PLATFORM_MACOS;
                     }
                     if (navigator.appVersion.indexOf("Linux")!=-1) {
                     return singleton.PLATFORM_LINUX;
                     }*/
    
                    //Thank You! Platform detection code using navigator string
                    //http://stackoverflow.com/questions/9514179/how-to-find-the-operating-system-version-using-javascript
    
                    // browser
                    var nVer = navigator.appVersion;
                    var nAgt = navigator.userAgent;
                    var browser = navigator.appName;
                    var browserVersion = "" + parseFloat(navigator.appVersion);
                    var majorVersion = parseInt(navigator.appVersion, 10);
                    var nameOffset, verOffset, ix;
    
                    // Opera
                    if ((verOffset = nAgt.indexOf("Opera")) != -1) {
                        browser = "Opera";
                        browserVersion = nAgt.substring(verOffset + 6);
                        if ((verOffset = nAgt.indexOf("Version")) != -1) {
                            browserVersion = nAgt.substring(verOffset + 8);
                        }
                    }
                    // Opera Next
                    if ((verOffset = nAgt.indexOf("OPR")) != -1) {
                        browser = "Opera";
                        browserVersion = nAgt.substring(verOffset + 4);
                    }
                    // Edge
                    else if ((verOffset = nAgt.indexOf("Edge")) != -1) {
                        browser = "Microsoft Edge";
                        browserVersion = nAgt.substring(verOffset + 5);
                    }
                    // MSIE
                    else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
                        browser = "Microsoft Internet Explorer";
                        browserVersion = nAgt.substring(verOffset + 5);
                    }
                    // Chrome
                    else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
                        browser = "Chrome";
                        browserVersion = nAgt.substring(verOffset + 7);
                    }
                    // Safari
                    else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
                        browser = "Safari";
                        browserVersion = nAgt.substring(verOffset + 7);
                        if ((verOffset = nAgt.indexOf("Version")) != -1) {
                            browserVersion = nAgt.substring(verOffset + 8);
                        }
                    }
                    // Firefox
                    else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
                        browser = "Firefox";
                        browserVersion = nAgt.substring(verOffset + 8);
                    }
                    // MSIE 11+
                    else if (nAgt.indexOf("Trident/") != -1) {
                        browser = "Microsoft Internet Explorer";
                        browserVersion = nAgt.substring(nAgt.indexOf("rv:") + 3);
                    }
                    // Other browsers
                    else if ((nameOffset = nAgt.lastIndexOf(" ") + 1) < (verOffset = nAgt.lastIndexOf("/"))) {
                        browser = nAgt.substring(nameOffset, verOffset);
                        browserVersion = nAgt.substring(verOffset + 1);
                        if (browser.toLowerCase() == browser.toUpperCase()) {
                            browser = navigator.appName;
                        }
                    }
                    // trim the browserVersion string
                    if ((ix = browserVersion.indexOf(";")) != -1) browserVersion = browserVersion.substring(0, ix);
                    if ((ix = browserVersion.indexOf(" ")) != -1) browserVersion = browserVersion.substring(0, ix);
                    if ((ix = browserVersion.indexOf(")")) != -1) browserVersion = browserVersion.substring(0, ix);
    
                    majorVersion = parseInt("" + browserVersion, 10);
                    if (isNaN(majorVersion)) {
                        browserVersion = "" + parseFloat(navigator.appVersion);
                        majorVersion = parseInt(navigator.appVersion, 10);
                    }
    
                    // mobile browserVersion
                    //var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);
    
                    // system
                    var os = singleton.PLATFORM_UNKNOWN;
                    var clientStrings = [
                        {s: "Windows 10", r: /(Windows 10.0|Windows NT 10.0)/},
                        {s: "Windows 8.1", r: /(Windows 8.1|Windows NT 6.3)/},
                        {s: "Windows 8", r: /(Windows 8|Windows NT 6.2)/},
                        {s: "Windows 7", r: /(Windows 7|Windows NT 6.1)/},
                        {s: "Windows Vista", r: /Windows NT 6.0/},
                        {s: "Windows Server 2003", r: /Windows NT 5.2/},
                        {s: "Windows XP", r: /(Windows NT 5.1|Windows XP)/},
                        {s: "Windows 2000", r: /(Windows NT 5.0|Windows 2000)/},
                        {s: "Windows ME", r: /(Win 9x 4.90|Windows ME)/},
                        {s: "Windows 98", r: /(Windows 98|Win98)/},
                        {s: "Windows 95", r: /(Windows 95|Win95|Windows_95)/},
                        {s: "Windows NT 4.0", r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
                        {s: "Windows CE", r: /Windows CE/},
                        {s: "Windows 3.11", r: /Win16/},
                        {s: "Android", r: /Android/},
                        {s: "Open BSD", r: /OpenBSD/},
                        {s: "Sun OS", r: /SunOS/},
                        {s: "Linux", r: /(Linux|X11)/},
                        {s: "iOS", r: /(iPhone|iPad|iPod)/},
                        {s: "Mac OS X", r: /(Mac OS X|macOS)/},
                        {s: "Mac OS", r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
                        {s: "QNX", r: /QNX/},
                        {s: "UNIX", r: /UNIX/},
                        {s: "BeOS", r: /BeOS/},
                        {s: "OS/2", r: /OS\/2/},
                        {s: "Search Bot", r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
                    ];
                    for (var id in clientStrings) {
                        var cs = clientStrings[id];
                        if (cs.r.test(nAgt)) {
                            os = cs.s;
                            break;
                        }
                    }
    
                    var osVersion = singleton.VERSION_UNKNOWN;
                    switch (os) {
                        case "Windows 10":
                        case "Windows 8.1":
                        case "Windows 8":
                        case "Windows 7":
                        case "Windows Vista":
                        case "Windows Server 2003":
                        case "Windows XP":
                        case "Windows 2000":
                        case "Windows ME":
                        case "Windows 98":
                        case "Windows 95":
                        case "Windows NT 4.0":
                        case "Windows CE":
                        case "Windows 3.11":
                            osVersion = /Windows (.*)/.exec(os)[1];
                            os = singleton.PLATFORM_WINDOWS;
                            break;
                        case "Open BSD":
                            os = singleton.PLATFORM_FREEBSD;
                            break;
                        case "Sun OS":
                            os = singleton.PLATFORM_SOLARIS;
                            break;
                        case "Linux":
                            os = singleton.PLATFORM_LINUX;
                            break;
                        case "Mac OS X":
                            osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
                            osVersion = osVersion.replace(/\_/gi, ".");
                        case "Mac OS":
                            os = singleton.PLATFORM_MACOS;
                            break;
                        case "Android":
                            os = singleton.PLATFORM_ANDROID;
                            osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
                            break;
                        case "iOS":
                            os = singleton.PLATFORM_IOS;
                            osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                            osVersion = osVersion[1] + "." + osVersion[2] + "." + (osVersion[3] | 0);
                            break;
                    }
    
                    runtimeVersion = browserVersion;
                    platformVersion = osVersion;
                    return os;
                }
                else if (typeof process !== "undefined" && typeof process.platform != "undefined") {
                    switch (process.platform) {
                        case "darwin":
                            return singleton.PLATFORM_MACOS;
                            break;
                        case "freebsd":
                            return singleton.PLATFORM_FREEBSD;
                            break;
                        case "sunos":
                            return singleton.PLATFORM_SOLARIS;
                            break;
                        case "linux":
                            try {
                                //Read platformVersion files for various linux distros
    
                                //first test lsb-release file
                                var fs = require("fs");
                                try {
                                    var data = fs.readFileSync("/etc/lsb-release");
    
                                    /*
    
                                     DISTRIB_ID=Ubuntu
                                     DISTRIB_RELEASE=12.04
                                     DISTRIB_CODENAME=precise
                                     DISTRIB_DESCRIPTION="Ubuntu 12.04.3 LTS"
    
                                     */
                                    var release = null;
                                    data.toString().split("\n").forEach(function (line, index, arr) {
                                        if (index === arr.length - 1 && line === "") {
                                            return;
                                        }
    
                                        //index, line
                                        var kv = line.split("=");
                                        if (kv.length > 1) {
                                            switch (kv[0]) {
                                                case "DISTRIB_ID":
                                                    switch (kv[1]) {
                                                        case "Ubuntu":
                                                            release = singleton.PLATFORM_LINUX_UBUNTU;
                                                            break;
                                                        case "Chakra":
                                                            release = singleton.PLATFORM_LINUX_CHAKRA;
                                                            break;
                                                        case "IYCC":
                                                            release = singleton.PLATFORM_LINUX_IYCC;
                                                            break;
                                                        case "Mint":
                                                            release = singleton.PLATFORM_LINUX_MINT;
                                                            break;
                                                    }
                                                    break;
                                                case "DISTRIB_RELEASE":
                                                    platformVersion = kv[1];
                                                    break;
                                            }
                                        }
                                    });
    
                                    if (release) {
                                        return release;
                                    }
                                }
                                catch (e) {
                                    //file probably does not exist
                                }
    
                                try {
                                    var data = fs.readFileSync("/etc/os-release");
    
                                    var release = null;
                                    data.toString().split("\n").forEach(function (line, index, arr) {
                                        if (index === arr.length - 1 && line === "") {
                                            return;
                                        }
    
                                        //index, line
                                        var kv = line.split("=");
                                        if (kv.length > 1) {
                                            switch (kv[0]) {
                                                case "PRETTY_NAME":
                                                    //remove quotes
                                                    kv[1] = kv[1].replace(/^"(.+(?="$))"$/, '$1');
                                                    if (kv[1].length >= 10 && kv[1].substr(0, 10) == "ReadyNASOS") {
                                                        release = singleton.PLATFORM_LINUX_READYNASOS;
                                                        if (kv[1].length > 10) {
                                                            platformVersion = kv[1].substr(11);
                                                        }
                                                    }
                                                    break;
                                            }
                                        }
                                    });
    
                                    if (release) {
                                        return release;
                                    }
                                } catch (e) {
                                    //file probably does not exist
                                }
    
                                //TODO - implement more
                                //http://linuxmafia.com/faq/Admin/release-files.html
                            }
                            catch (e) {
                                //ignore error, return unknown linux
                                console.error("PLATFORM DETECTION ERROR: " + e);
                            }
                            return singleton.PLATFORM_LINUX;
                            break;
                        case "win32":
                            return singleton.PLATFORM_WINDOWS;
                            break;
                    }
                }
                else if (runtime == singleton.RUNTIME_ADOBEJSX) {
                    //TODO
                    //system.osName sometimes returns an empty string
                    //system.osVersion ex. returns "Build Number: 7601 Service Pack 1"
                }
    
                //unable to determine platform
                return singleton.PLATFORM_UNKNOWN;
            }
    
            function detectPlatformVersion() {
                if (!platform) {
                    platform = detectPlatform();
                }
    
                var os = null;
                try {
                    os = require("os");
                }
                catch (e) {
    
                }
                if (typeof process !== "undefined" && os != null) {
                    switch (platform) {
                        /*case singleton.PLATFORM_LINUX_DEBIAN:
                         case singleton.PLATFORM_LINUX_FEDORA:
                         case singleton.PLATFORM_LINUX_GENTOO:
                         case singleton.PLATFORM_LINUX_MANDRAKE:
                         case singleton.PLATFORM_LINUX_REDHAT:
                         case singleton.PLATFORM_LINUX_SLACKWARE:
                         case singleton.PLATFORM_LINUX_SUSE:
                         case singleton.PLATFORM_LINUX_UBUNTU:
                         return;*/
                        case singleton.PLATFORM_WINDOWS:
                            //see specific windows table
                            //https://msdn.microsoft.com/en-us/library/windows/desktop/ms724832(v=vs.85).aspx
                            //minimum supported is Windows 7 -> 6.1
                            var v = "";
                            var r = os.release();
                            if (isOfMinimumVersion(r, "6.1")) {
                                v = "7";
                            }
                            if (isOfMinimumVersion(r, "6.2")) {
                                v = "8";
                            }
                            if (isOfMinimumVersion(r, "6.3")) {
                                v = "8.1";
                            }
                            if (isOfMinimumVersion(r, "10.0")) {
                                v = "10";
                            }
                            //last known entry
                            if (isOfMinimumVersion(r, "16.4.0")) {
                                v = "> 10.12.2";
                            }
                            return v;
                        case singleton.PLATFORM_MACOS:
                            //see specific osx table
                            //https://en.wikipedia.org/wiki/Darwin_%28operating_system%29#Release_history
                            //minimum supported is 10.7 -> 11.0.0
                            var v = "";
                            var r = os.release();
                            if (isOfMinimumVersion(r, "11.0.0")) {
                                v = "10.7";
                            }
                            if (isOfMinimumVersion(r, "11.4.2")) {
                                v = "10.7.5";
                            }
                            if (isOfMinimumVersion(r, "12.0.0")) {
                                v = "10.8";
                            }
                            if (isOfMinimumVersion(r, "12.6.0")) {
                                v = "10.8.5";
                            }
                            if (isOfMinimumVersion(r, "13.0.0")) {
                                v = "10.9";
                            }
                            if (isOfMinimumVersion(r, "13.4.0")) {
                                v = "10.9.5";
                            }
                            if (isOfMinimumVersion(r, "14.0.0")) {
                                v = "10.10";
                            }
                            if (isOfMinimumVersion(r, "14.5.0")) {
                                v = "10.10.5";
                            }
                            if (isOfMinimumVersion(r, "15.0.0")) {
                                v = "10.11";
                            }
                            if (isOfMinimumVersion(r, "15.6.0")) {
                                v = "10.11.6";
                            }
                            if (isOfMinimumVersion(r, "16.0.0")) {
                                v = "10.12";
                            }
                            if (isOfMinimumVersion(r, "16.1.0")) {
                                v = "10.12.1";
                            }
                            if (isOfMinimumVersion(r, "16.3.0")) {
                                v = "10.12.2";
                            }
                            //last known entry
                            if (isOfMinimumVersion(r, "16.4.0")) {
                                v = "> 10.12.2";
                            }
                            return v;
                        default:
                            //Return default release value (often does not reflect the public OS platformVersion).
                            return os.release();
                    }
                }
                else {
                    return singleton.VERSION_UNKNOWN;
                }
            }
    
            function detectPlatformArchitecture() {
                if (typeof process !== "undefined" && typeof process.arch != "undefined") {
                    //'arm', 'arm64', 'ia32', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x', 'x32', 'x64', and 'x86'
                    switch (process.arch) {
                        case "arm":
                            return singleton.PLATFORM_ARCHITECTURE_ARM;
                        case "arm64":
                            return singleton.PLATFORM_ARCHITECTURE_ARM64;
                        case "x86":
                            return singleton.PLATFORM_ARCHITECTURE_X86;
                        case "x64":
                            return singleton.PLATFORM_ARCHITECTURE_X64;
                        default:
                            return singleton.PLATFORM_ARCHITECTURE_UNKNOWN;
                    }
                }
                else {
                    return singleton.PLATFORM_ARCHITECTURE_UNKNOWN;
                }
            }
    
            //thanks! https://www.packtpub.com/books/content/platform-detection-your-nwjs-app
            function isOfMinimumVersion(version, minimumVersion) {
                if (version == null || minimumVersion == null) {
                    return false;
                }
                else if (version == null) {
                    return true;
                }
                var actualVersionPieces = ("" + version).split("."),
                    pieces = minimumVersion.split("."),
                    numberOfPieces = pieces.length;
    
                for (var i = 0; i < numberOfPieces; i++) {
                    var piece = parseInt(pieces[i], 10),
                        actualPiece = parseInt(actualVersionPieces[i], 10);
    
                    if (typeof actualPiece === "undefined") {
                        break;
                    }
                    else if (actualPiece > piece) {
                        break;
                    }
                    else if (actualPiece === piece) {
                        continue;
                    }
                    else {
                        return false;
                    }
                }
    
                return true;
            }
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
            singleton = new (Function.prototype.bind.apply(Host, arguments));
    
            if (typeof document !== "undefined") {
                document.documentElement.setAttribute("data-runtime", singleton.runtime);
                document.documentElement.setAttribute("data-runtime-version", singleton.runtimeVersion);
                document.documentElement.setAttribute("data-platform", singleton.platform);
                document.documentElement.setAttribute("data-platform-version", singleton.platformVersion);
                document.documentElement.setAttribute("data-platform-architecture", singleton.platformArchitecture);
            }
    
            return singleton;
        }));
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
