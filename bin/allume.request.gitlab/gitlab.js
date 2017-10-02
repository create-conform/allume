/////////////////////////////////////////////////////////////////////////////////////
//
// module 'allume.request.gitlab.0.1.6/'
//
/////////////////////////////////////////////////////////////////////////////////////
(function(using, require) {
    define.parameters = {};
    define.parameters.wrapped = true;
    define.parameters.system = "pkx";
    define.parameters.id = "allume.request.gitlab.0.1.6/";
    define.parameters.pkx = {
        "name": "allume.request.gitlab",
        "version": "0.1.6",
        "title": "Allume Request GitLab Library",
        "description": "Allume request module for fetching releases from GitLab.",
        "bugs": null,
        "author": null,
        "contributors": null,
        "main": "gitlab.js",
        "pkxDependencies": [
            "cc.version.0.1",
            "cc.string.0.1",
            "cc.config.0.1",
            "cc.io.0.1"
        ]
    };
    define.parameters.dependencies = [ "pkx", "module", "configuration", "requirer" ];
    define.parameters.dependencies[0] = define.parameters.pkx;
    define.parameters.dependencies.push(define.cache.get("cc.version.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.string.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.config.0.1/"));
    define.parameters.dependencies.push(define.cache.get("cc.io.0.1/"));
    using = define.getUsing(define.parameters.id);
    require = define.getRequire(define.parameters.id, require);
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // allume.request.gitlab
    //
    //    PKX request module for fetching releases from GitLab.
    //
    // License
    //    Apache License Version 2.0
    //
    // Copyright Nick Verlinden (info@createconform.com)
    //
    ///////////////////////////////////////////////////////////////////////////////////////////// 
    
    (function() {
        var REQUEST_PROC_NAME = "gitlab";
        var HOST_GITLAB = "gitlab.com";
        var URI_PATH_GITLABAPI_TAGS_TEMPLATE = "%2F$NAME/repository/tags";
        var URI_PATH_GITLABAPI_BRANCH_TEMPLATE = "%2F$NAME/repository/archive?sha=";
        var PATH_CACHE = "allume.request.gitlab/cache/";
        var EXT_PKX = "pkx";
    
        // user url expected:
        //   https://gitlab.com/create-conform/
        // direct:
        //   https://gitlab.com/create-conform/cc_demo
        // 
    
        // https://gitlab.com/api/v4/projects/create-conform%2Fcc_demo/repository/tags
        // https://gitlab.com/api/v4/projects/create-conform%2Fcc_demo/repository/archive?sha=v1.0.0
    
        function AllumeRequestGitLab() {
            var self = this;
    
            this.process = function(selector) {
                var direct;
                var directRepo;
    
                if (selector.uri.authority.host == HOST_GITLAB && (selector.package.substr(0,7) == "http://" || selector.package.substr(0,8) == "https://")) {
                    direct = selector.uri.path.substr(selector.uri.path.lastIndexOf("/") + 1);
                    directRepo = selector.uri.path.substr(0, selector.uri.path.lastIndexOf("/"));
                    directRepo = directRepo.substr(directRepo.lastIndexOf("/") + 1);
                    selector.uri.path = "/api/v4/projects/" + (selector.uri.path.lastIndexOf("/") == selector.uri.path.length - 1? selector.uri.path.substr(1, selector.uri.path.length - 2) : selector.uri.path.substr(1)).replace(/\//g, "%2F");
                }
                if (selector.uri.authority.host != HOST_GITLAB) {
                    return;
                }
    
                return new Promise(function (resolve, reject) {
                    var headers = { "user-agent": "allume" };
    
                    // get active profile from config
                    var profile = typeof allume != "undefined"? allume.config.profiles[allume.config.activeProfile] : {};
    
                    var glConf;
                    if (profile.repositories[selector.repository.namespace] && profile.repositories[selector.repository.namespace].gitlab) {
                        glConf = profile.repositories[selector.repository.namespace].gitlab;
                    }
                    else if (profile.gitlab) {
                        glConf = profile.gitlab;
                    }
                    else if (typeof allume != "undefined" && allume.config && allume.config.gitlab) {
                        glConf = allume.config.gitlab;
                    }
    
                    // setup gitlab data
                    var glToken = glConf? glConf.token : null;
                    var glBranch = glConf? glConf.branch : null;
                    var glURLNamespaceSeperator = glConf? glConf.urlNamespaceSeperator : null;
                    var glEnableCache = glConf && glConf.enableCache != null? glConf.enableCache : true;
                    var glEnableNamespaceStripping = glConf && glConf.enableNamespaceStripping != null? glConf.enableNamespaceStripping : true;
    
                    var repoName;
                    var userName;
    
                    if (glToken) {
                        headers["PRIVATE-TOKEN"] = glToken;
                    }
    
                    if (direct) {
                        repoName = selector.uri.path.substr(selector.uri.path.lastIndexOf("/", selector.uri.path.length - 2)).split("%2F");
                        userName = repoName[0].substr(1);
                        repoName = repoName[1];
                    }
                    else {
                        repoName = selector.uri.path.split("/");
                        userName = repoName[1];
                        repoName = repoName[2];
                    }
    
                    if (glBranch) {
                        if (!direct) {
                            selector.uri = selector.parseURI("https://" + HOST_GITLAB + "/api/v4/projects/" + userName + (glEnableNamespaceStripping? URI_PATH_GITLABAPI_BRANCH_TEMPLATE.replace("%2F$NAME/", "%2F$NAME_NO_NS/") : URI_PATH_GITLABAPI_BRANCH_TEMPLATE) + glBranch, glURLNamespaceSeperator).toString();
                        }
                        else {                            
                            selector.uri = selector.parseURI("https://" + HOST_GITLAB + "/api/v4/projects/" + userName + "%2F" + repoName + "/repository/archive?sha=" + glBranch, glURLNamespaceSeperator).toString();
                        }
                        resolve({"strip": 1, "headers": headers});
                        return;
                    }
    
                    function glDone(tag) {
                        if (tag instanceof Error) {
                            //console.error(release);
                            tag = null;
                        }
    
                        // variable will contain error message when download of tarball url fails.
                        var tagErr;
    
                        if (!repoName) {
                            repoName = selector.uri.path.substr(selector.uri.path.lastIndexOf("/", selector.uri.path.length - 2));
                            userName = selector.uri.path.substr(selector.uri.path.lastIndexOf("/", selector.uri.path.length - repoName.length - 2) + 1);
                            userName = userName.substr(0, userName.length - 1);
                            repoName = repoName.substr(0, repoName.length - 1);
                        }
    
                        if (tag) {
                            var archiveURL = archiveURL || selector.parseURI("https://" + HOST_GITLAB + "/api/v4/projects/" + userName + "%2F" + (direct? repoName : (glEnableNamespaceStripping? "$NAME_NO_NS" : "$NAME")) + "/repository/archive?sha=" + tag.name, glURLNamespaceSeperator).toString();
                        }
    
                        if (glEnableCache) {
                            config.getVolume().then(function(cacheVolume) {
                                function cacheQueryDone(uriList) {
                                    if (uriList && uriList.code == "ENOENT") {
                                        uriList = [];
                                    }
                                    else if (uriList && uriList.code) {
                                        console.error("Cache disk error.", uriList);
    
                                        resolveURI(tag? archiveURL : null);
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
                                            // release version from GitLab is present in cache
                                            resolveURI(cache[found]);
                                        }
                                        else {
                                            // download new uri and save to cache
                                            io.URI.open(archiveURL).then(function(repoStream) {
                                                function repoFail() {
                                                    repoStream.close().then(repoResolve, repoResolve);
                                                }
                                                function repoResolve() {
                                                    resolveURI(archiveURL);
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
                                resolveURI(tag? archiveURL : null);
                            });
                        }
                        else {
                            resolveURI(tag? archiveURL : null);
                        }
    
                        //TODO
                        //   I WAS HERE
    
                        function resolveURI(uri) {
                            if (uri && uri.name) {
                                reject(new Error("An error occured while trying to fetch '" + selector.package + "' from the GitLab repository."));
                                return;
                            }
                            else if (!uri && !tagErr) {
                                reject(new Error("Couldn't find any suitable tag for package '" + selector.package + "' in the GitLab repository."));
                                return;
                            }
                            else if (!uri && tagErr) {
                                if (!tag) {
                                    reject(new Error("Downloading of package '" + selector.package + "' from GitLab failed. If you are running this in a browser, CORS might be the problem."));
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
                        //selector.uri.path += "repository/tags";
                        //uriTags = selector.uri;
                        repoName = selector.uri.path.substr(selector.uri.path.lastIndexOf("/", selector.uri.path.length - 2)).split("%2F");
                        userName = repoName[0].substr(1);
                        repoName = repoName[1];
    
                        selector.uri.path = "/api/v4/projects/" + userName + (URI_PATH_GITLABAPI_TAGS_TEMPLATE).replace(/\$NAME/g,repoName);
                    }
                    else {
                        selector.uri = selector.parseURI("https://" + HOST_GITLAB + "/api/v4/projects/" + userName + (glEnableNamespaceStripping? URI_PATH_GITLABAPI_TAGS_TEMPLATE.replace("%2F$NAME/", "%2F$NAME_NO_NS/") : URI_PATH_GITLABAPI_TAGS_TEMPLATE), glURLNamespaceSeperator).toString();
                    }
                    uriTags = selector.uri;
    
                    uriTags.open().then(function (stream) {
                        stream.headers = headers;
                        stream.readAsJSON().then(function (tags) {
                            if (!tags || tags.length == 0) {
                                reject(new Error("Package '" + selector.package + "' does not have any tags in the GitLab repository."));
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
                                reject(new Error("Package '" + selector.package + "' does not contain one or more valid tags in the GitLab repository."));
                                return;
                            }
    
                            var tag = version.find(versions, direct? "" : selector.package, selector.upgradable || version.UPGRADABLE_NONE);
                            
                            glDone(tag);
                        }, glDone);
                    }, glDone);
                });
            };
    
            // register request processor
            define.Loader.waitFor("pkx", function(loader) {
                loader.addRequestProcessor(REQUEST_PROC_NAME, self.process);
            });
        }
        
        var processor = new AllumeRequestGitLab();
        define(function () {
            return processor;
        });
    
        var version = require("./cc.version");
        var string = require("./cc.string");
        var config = require("./cc.config");
        var io = require("./cc.io");
    })();
})(typeof using != "undefined"? using : null, typeof require != "undefined"? require : null);
