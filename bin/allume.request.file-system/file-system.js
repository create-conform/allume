/////////////////////////////////////////////////////////////////////////////////////
//
// module 'allume.request.file-system.0.1.3/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "allume.request.file-system.0.1.3/";
    define.parameters.pkx = {
        "name": "allume.request.file-system",
        "version": "0.1.3",
        "title": "Allume Request File System Library",
        "description": "Allume request module for fetching releases from file system locations.",
        "bugs": null,
        "author": null,
        "contributors": null,
        "main": "file-system.js",
        "pkxDependencies": [
            "cc.version.0.1",
            "cc.string.0.1"
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.version.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.string.0.1/"));
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // allume.request.file-system
    //
    //    PKX request module for fetching releases from file system locations.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    /////////////////////////////////////////////////////////////////////////////////////////////
    
    (function() {
        var REQUEST_PROC_NAME = "file-system";
        var URI_PATH_FILESYSTEM_TEMPLATE = "$NAME/";
    
        function PKXRequestGitHub() {
            var self = this;
    
            this.process = function(selector) {
                if (selector.uri.scheme != "file" || 
                    selector.uri.path.lastIndexOf("/") == selector.uri.path.length -1 ||
                    selector.uri.path.lastIndexOf(".pkx") == selector.uri.path.length - 4) {
                    return;
                }
    
                return new Promise(function (resolve, reject) {
                    var path = selector.uri.toString();
                    var lastIdx = path.lastIndexOf("/");
                    if (lastIdx >= 0) {
                        path = path.substr(0, lastIdx);
                    }
                    selector.uri = path + "/" + URI_PATH_FILESYSTEM_TEMPLATE;
                    resolve();
                });
            };
    
            // register request processor
            define.Loader.waitFor("pkx", function(loader) {
                loader.addRequestProcessor(REQUEST_PROC_NAME, self.process);
            });
        }
    
        var processor = new PKXRequestGitHub();
        define(function () {
            return processor;
        });
    
        var version = require("./cc.version");
        var string = require("./cc.string");
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
