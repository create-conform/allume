/////////////////////////////////////////////////////////////////////////////////////
//
// module 'allume.request.bitbucket.0.2.0/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "allume.request.bitbucket.0.2.0/";
    define.parameters.pkx = {
        "name": "allume.request.bitbucket",
        "version": "0.2.0",
        "title": "Allume Request BitBucket Library",
        "description": "Allume request module for fetching releases from BitBucket.",
        "pkx": {
            "main": "bitbucket.js",
            "dependencies": [
                "cc.version.0.2",
                "cc.string.0.2",
                "cc.config.0.2",
                "cc.io.0.2"
            ]
        }
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration", "requirer" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.version.0.2/"));
    define.parameters.dependencies.push(define.cache.get("cc.string.0.2/"));
    define.parameters.dependencies.push(define.cache.get("cc.config.0.2/"));
    define.parameters.dependencies.push(define.cache.get("cc.io.0.2/"));
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // allume.request.bitbucket
    //
    //    PKX request module for fetching releases from BitBucket.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    ///////////////////////////////////////////////////////////////////////////////////////////// 
    
    (function() {
        var REQUEST_PROC_NAME = "bitbucket";
        var HOST_BITBUCKETAPI = "api.bitbucket.org";
        var HOST_BITBUCKET = "bitbucket.org";
        var URI_PATH_CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
        var URI_PATH_BITBUCKETAPI_TAGS_TEMPLATE = "$NAME/refs/tags";
        var URI_PATH_BITBUCKETAPI_BRANCH_TEMPLATE = "$NAME/get/";
        var PATH_CACHE = "allume.request.bitbucket/cache/";
        var EXT_PKX = "pkx";
    
        function AllumeRequestBitBucket() {
            var self = this;
    
            this.process = function(selector) {
                var direct;
                var directRepo;
                var triedCORSProxy;
    
                if (selector.uri.authority.host == HOST_BITBUCKET) {
                    selector.uri.authority.host = HOST_BITBUCKETAPI;
                    direct = selector.uri.path.substr(selector.uri.path.lastIndexOf("/") + 1);
                    directRepo = selector.uri.path.substr(0, selector.uri.path.lastIndexOf("/"));
                    directRepo = directRepo.substr(directRepo.lastIndexOf("/") + 1);
                    selector.uri.path = "/repos" + (selector.uri.path.lastIndexOf("/") == selector.uri.path.length - 1? selector.uri.path.substr(0, selector.uri.path.length - 2) : selector.uri.path);
                }
                if (selector.uri.authority.host != HOST_BITBUCKETAPI) {
                    return;
                }
    
                return new Promise(function (resolve, reject) {
                    var headers = { "user-agent": "allume" };
    
                    // get active profile from config
                    var profile = typeof allume != "undefined"? allume.config.profiles[allume.config.activeProfile] : {};
    
                    var bbConf;
                    if (profile.repositories[selector.repository.namespace] && profile.repositories[selector.repository.namespace].bitbucket) {
                        bbConf = profile.repositories[selector.repository.namespace].bitbucket;
                    }
                    else if (profile.bitbucket) {
                        bbConf = profile.bitbucket;
                    }
                    else if (typeof allume != "undefined" && allume.config && allume.config.bitbucket) {
                        bbConf = allume.config.bitbucket;
                    }
    
                    // setup bitbucket data
                    var bbUsername = bbConf? bbConf.username : null;
                    var bbPassword = bbConf? bbConf.password : null;
                    var bbToken = bbConf? bbConf.token : null;
                    var bbBranch = bbConf? bbConf.branch : null;
                    var bbEnableCORSProxy = bbConf && bbConf.enableCORSProxy != null? bbConf.enableCORSProxy : false;
                    var bbEnableCache = bbConf && bbConf.enableCache != null? bbConf.enableCache : true;
    
                    if (bbToken) {
                        headers["Authorization"] = "Bearer " + bbToken;
                    }
                    else if (bbUsername) {
                        headers["Authorization"] = "Basic " + string.toBase64((bbUsername + ":" + (bbPassword ? bbPassword : "")));
                    }
    
                    if (bbBranch) {
                        if (!direct) {
                            selector.uri = selector.parseURI("https://" + HOST_BITBUCKET + selector.repository.url.substr(selector.repository.url.lastIndexOf("/", selector.repository.url.length - 2)) + URI_PATH_BITBUCKETAPI_BRANCH_TEMPLATE + bbBranch + ".tar.gz").toString();
                        }
                        else {
                            selector.uri.path += "/get/" + bbBranch + ".tar.gz";
                        }
                        resolve({"strip": 1, "headers": headers});
                        return;
                    }
    
                    function bbDone(tag) {
                        if (tag instanceof Error) {
                            //console.error(release);
                            tag = null;
                        }
    
                        // variable will contain error message when download of tarball url fails.
                        var tagErr;
    
                        if (bbEnableCache) {
                            config.getVolume().then(function(cacheVolume) {
                                function cacheQueryDone(uriList) {
                                    if (uriList && uriList.code == "ENOENT") {
                                        uriList = [];
                                    }
                                    else if (uriList && uriList.code) {
                                        console.error("Cache disk error.", uriList);
                                        resolveURI(tag? (tag.target.hash.substr(0,4) == "http"? tag.target.hash : selector.parseURI("https://" + HOST_BITBUCKET + selector.repository.url.substr(selector.repository.url.lastIndexOf("/", selector.repository.url.length - 2)) + URI_PATH_BITBUCKETAPI_BRANCH_TEMPLATE + tag.target.hash + ".tar.gz").toString()) : null);
                                    }
                                    var cache = {};
                                    for (var u in uriList) {
                                        if (uriList[u].path.lastIndexOf("/") != uriList[u].path.length - 1) {
                                            var file = uriList[u].path.substr(uriList[u].path.lastIndexOf("/") + 1);
                                            cache[file.substr(0,file.length - 4)] = uriList[u];
                                        }
                                    }
    
                                    // get highest version from cache
                                    var highestCache = version.find(cache, direct? direct : selector.package, selector.upgradable || version.UPGRADABLE_NONE);
    
                                    if (!tag) {
                                        // resolve highest cache version
                                        resolveURI(highestCache);
                                    }
                                    else {
                                        var id = (direct? directRepo + "/" + direct : (selector.repository.namespace + (selector.repository.namespace != ""? "/" : "") + selector.package)) + "." + (tag.name.indexOf("v") == 0? tag.name.substr(1) : tag.name);
                                        var found;
                                        for (var u in cache) {
                                            if (u == ((direct? direct : selector.package) + "." + (tag.name.indexOf("v") == 0? tag.name.substr(1) : tag.name))) {
                                                found = u;
                                                break;
                                            }
                                        }
                                        if (found) {
                                            // release version from bitbucket is present in cache
                                            resolveURI(cache[found]);
                                        }
                                        else {
                                            // download new uri and save to cache
                                            io.URI.open((tag.target.hash.substr(0,4) == "http"? tag.target.hash : selector.parseURI("https://" + HOST_BITBUCKET + selector.repository.url.substr(selector.repository.url.lastIndexOf("/", selector.repository.url.length - 2)) + URI_PATH_BITBUCKETAPI_BRANCH_TEMPLATE + tag.target.hash + ".tar.gz").toString())).then(function(repoStream) {
                                                function repoFail() {
                                                    repoStream.close().then(repoResolve, repoResolve);
                                                }
                                                function repoResolve() {
                                                    resolveURI((tag.target.hash.substr(0,4) == "http"? tag.target.hash : selector.parseURI("https://" + HOST_BITBUCKET + selector.repository.url.substr(selector.repository.url.lastIndexOf("/", selector.repository.url.length - 2)) + URI_PATH_BITBUCKETAPI_BRANCH_TEMPLATE + tag.target.hash + ".tar.gz").toString()));
                                                };
                                                
                                                var cacheURI = cacheVolume.getURI(PATH_CACHE + id + "." + EXT_PKX);
                                                cacheURI.open(io.ACCESS_OVERWRITE, true).then(function(cacheStream) {
                                                    function cacheDone(e) {
                                                        if (e instanceof Error) {
                                                            tagErr = e;
                                                        }
                                                        cacheStream.close(tagErr).then(function() {
                                                            repoStream.close().then(cacheResolve, cacheResolve);
                                                        }, cacheFail);
                                                    }
                                                    function cacheFail() {
                                                        cacheStream.close().then(repoFail, repoFail);
                                                    }
                                                    function cacheResolve() {
                                                        if (tagErr) {
                                                            // an error occurred while downloading the tarball (could be CORS), fallback to highest cached version.
                                                            resolveURI(highestCache);
                                                            return;
                                                        }
                                                        resolveURI(cacheURI);
                                                    }
                                                    repoStream.headers = headers;
                                                    repoStream.copyTo(cacheStream).then(cacheDone, cacheDone);
                                                }, repoFail);
                                            }, resolveURI);
                                        }
                                    }
                                }
    
                                cacheVolume.query(PATH_CACHE + (direct? (directRepo + "/") : (selector.repository.namespace + (selector.repository.namespace != ""? "/" : "")))).then(cacheQueryDone, cacheQueryDone);
                            }, function() {
                                // cache path error
                                resolveURI(tag? (tag.target.hash.substr(0,4) == "http"? tag.target.hash : selector.parseURI("https://" + HOST_BITBUCKET + selector.repository.url.substr(selector.repository.url.lastIndexOf("/", selector.repository.url.length - 2)) + URI_PATH_BITBUCKETAPI_BRANCH_TEMPLATE + tag.target.hash + ".tar.gz").toString()) : null);
                            });
                        }
                        else {
                            resolveURI(tag? (tag.target.hash.substr(0,4) == "http"? tag.target.hash : selector.parseURI("https://" + HOST_BITBUCKET + selector.repository.url.substr(selector.repository.url.lastIndexOf("/", selector.repository.url.length - 2)) + URI_PATH_BITBUCKETAPI_BRANCH_TEMPLATE + tag.target.hash + ".tar.gz").toString()) : null);
                        }
    
                        function resolveURI(uri) {
                            if (uri && uri.name) {
                                reject(new Error("An error occured while trying to fetch '" + selector.package + "' from the BitBucket repository."));
                                return;
                            }
                            else if (!uri && !tagErr) {
                                reject(new Error("Couldn't find any suitable tag for package '" + selector.package + "' in the BitBucket repository."));
                                return;
                            }
                            else if (!uri && tagErr) {
                                if (!tag || triedCORSProxy || !enableCORSProxy) {
                                    reject(new Error("Downloading of package '" + selector.package + "' from BitBucket failed. If you are running this in a browser, CORS might be the problem."));
                                }
                                else if (tag) {
                                    tag.target.hash = selector.parseURI(URI_PATH_CORS_PROXY + selector.parseURI("https://" + HOST_BITBUCKET + selector.repository.url.substr(selector.repository.url.lastIndexOf("/", selector.repository.url.length - 2)) + URI_PATH_BITBUCKETAPI_BRANCH_TEMPLATE + tag.target.hash + ".tar.gz").toString()).toString();
                                    triedCORSProxy = true;
    
                                    bbDone(tag);
                                }
                                return;
                            }
                            try {
                                selector.uri = uri;
                                resolve({"strip": 1, "headers" : headers});
                            }
                            catch (e) {
                                reject(e);
                            }
                        }
                    }
    
                    var uriTags;
                    if (direct) {
                        selector.uri.path += "/refs/tags";
                        uriTags = selector.uri;
                    }
                    else {
                        uriTags = selector.parseURI(selector.repository.url + URI_PATH_BITBUCKETAPI_TAGS_TEMPLATE);
                    }
    
                    uriTags.open().then(function (stream) {
                        stream.headers = headers;
                        stream.readAsJSON().then(function (tags) {
                            if (tags) {
                                tags = tags.values;
                            }
                            if (!tags || tags.length == 0) {
                                reject(new Error("Package '" + selector.package + "' does not have any tags in the BitBucket repository."));
                            }
                            var versions = [];
                            var count = 0;
                            for (var r in tags) {
                                //if (tags[r].draft) {
                                //    continue;
                                //}
                                //if (tags[r].prerelease && !bbEnablePreRelease) {
                                //    continue;
                                //}
                                var tagName = tags[r].name;
                                if (tagName.substr(0,1) == "v") {
                                    tagName = tagName.substr(1);
                                }
    
                                //TODO
                                // CHECK SEMANTIC VERSION -> VALID
    
                                if (direct) {
                                    versions[tagName] = tags[r];
                                }
                                else {
                                    versions[selector.name + "." + tagName] = tags[r];
                                }
                                count++;
                            }
                            if (count == 0) {
                                reject(new Error("Package '" + selector.package + "' does not contain one or more valid tags in the BitBucket repository."));
                                return;
                            }
    
                            var tag = version.find(versions, direct? "" : selector.package, selector.upgradable || version.UPGRADABLE_NONE);
                            
                            bbDone(tag);
                        }, bbDone);
                    }, bbDone);
                });
            };
    
            // register request processor
            define.Loader.waitFor("pkx", function(loader) {
                loader.addRequestProcessor(REQUEST_PROC_NAME, self.process);
            });
        }
        
        var processor = new AllumeRequestBitBucket();
        define(function () {
            return processor;
        });
    
        var version = require("./cc.version");
        var string = require("./cc.string");
        var config = require("./cc.config");
        var io = require("./cc.io");
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
