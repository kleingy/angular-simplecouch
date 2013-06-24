angular.module('SimpleCouch',[]).provider('couchConfig', {
    // internal configuration data; configured through setter function
    serverUrl: null,
    db : null,
    method : 'GET',
    usrCtx : { name: null, roles: [] },
    // configuration method for setting the server url
    setServer: function(serverUrl) {
        this.serverUrl = serverUrl;
    },
	// set the dbName
    setDB : function (db) {
        this.db = db;
    },

    $get: function() {
        // return the service instance
        return {
            server : this.serverUrl,
            db : this.db,
            method : this.method,
            usrCtx : this.usrCtx
        };
    }
}).factory('couchdb', function (couchConfig, $http) {

    var extendJSONP = function (config) {

        if (config.method === "JSONP")
            if (config.params)
                config.params.callback = "JSON_CALLBACK";
            else
                config.params = { callback: "JSON_CALLBACK" };

        return config;
    }

    var encodeUri = function (base, part1, part2) {
        var uri = base;
        if (part1) uri = uri + "/" + encodeURIComponent(part1);
        if (part2) uri = uri + "/" + encodeURIComponent(part2);
        return uri.replace('%2F', '/');
    };

    var executeQuery = function (config, cb) {
        return $http(config).success(function (data, status) {
            if (data.rows === undefined) {
                cb(data);
            } else {
                cb(data.rows);
            }
        });
    };

    var getDbUri = function () {
        return encodeUri(couchConfig.server, couchConfig.db);
    }

    return {
		//private method
        _queryView: function (viewURL, qparams, cb) {
            var config = {
                method: couchConfig.method,
                url: getDbUri() + viewURL
            };

            if (qparams) {
                // Raise limit by 1 for pagination
                if (qparams.limit) qparams.limit++;
                // Convert key parameters to JSON
                for (p in qparams) switch (p) {
                    case "key":
                    case "keys":
                    case "startkey":
                    case "endkey":
                        qparams[p] = angular.toJson(qparams[p]);
                }
                config.params = qparams;
            }

            return executeQuery(extendJSONP(config), cb);
        },

        config: {
            getServer: function () {
                return couchConfig.server;
            },
            setServer: function (url) {
                couchConfig.server = url;
            },
            setMethod: function (method) {
                couchConfig.method = method;
            },
            getMethod: function () {
                return couchConfig.method;
            }
        },
        db: {
            use: function (dbName) {
                couchConfig.db = dbName;
            },
            getName: function () {
                return couchConfig.db;
            }

        },
        // all doc manipulation
        doc: {
            post: function (data, cb) {
                return $http({
                    method: "POST",
                    url: getDbUri(),
                    data: data,
                    headers: {'Content-Type': 'application/json'}
                }).success(function (data, status) {
                        cb(data);
                    });

            },
            delete: function (doc, cb) {
                return $http({
                    method: "DELETE",
                    url: encodeUri(getDbUri(), doc._id),
                    params: { rev: doc._rev }
                }).success(function (data, status) {
                        cb(data);
                    });
            },
            get: function (id, cb) {
                var config = {
                    method: couchConfig.method,
                    url: encodeUri(getDbUri(), id)
                };
                return $http(extendJSONP(config)).success(function (data, status) {
                    cb(data);
                });
            },
            put: function (data, cb) {
                return $http({
                    method: "PUT",
                    url: encodeUri(getDbUri(), data._id),
                    data: data,
                    headers: {'Content-Type': 'application/json'}
                }).success(function (data, status) {
                        cb(data);
                    });
            }
        },
        // attachments manipulation
        attach: {
            put: function (doc, file, options, cb) {
                return $http({
                    method: "PUT",
                    url: encodeUri(getDbUri(), doc._id, options.name || file.name),
                    params: { rev: doc._rev },
                    headers: { "Content-Type": options.fileType || file.type },
                    data: file
                }).success(function (data, status) {
                        cb(data);
                    });
            },
            get: function (id, name, cb) {
                return $http({
                    method: "GET",
                    url: encodeUri(getDbUri(), id, name)
                }).success(function (data, status) {
                        cb(data);
                    });
            },
            delete: function (doc, name, cb) {
                return $http({
                    method: "DELETE",
                    url: encodeUri(getDbUri(), id, name),
                    params: { rev: doc._rev }
                }).success(function (data, status) {
                        cb(data);
                    });
            }
        },
        // user part
        user: {
            session: function (cb) {

                var server = this;
                return $http({
                    method: "GET",
                    url: encodeUri(couchConfig.server) + "/_session"
                })
                    .success(function (data) {
                        couchConfig.usrCtx = data.userCtx;
                        cb(couchConfig.usrCtx);
                    });
            },
            create: function (userName, password, cb) {
                var userData = {
                    _id: 'org.couchdb.user:' + userName,
                    name: userName,
                    password: password,
                    roles: [],
                    type: 'user'
                };

                return $http({
                    method: "POST",
                    url: encodeUri(couchConfig.server) + "/_users",
                    data: userData,
                    headers: {'Content-Type': 'application/json'}
                }).success(function (data) {
                        cb(data);
                    });
            },
            login: function (usr, pwd, cb) {
                var body =
                    "name=" + encodeURIComponent(usr) +
                        "&password=" + encodeURIComponent(pwd);

                return $http({
                    method: "POST",
                    url: encodeUri(couchConfig.server) + "/_session",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    data: body.replace(/%20/g, "+")
                }).success(function (data, status, header, config) {

                        delete data["ok"];
                        data.name = usr;
                        couchConfig.usrCtx = data;
                        cb(data);

                    });
            },
            isAuthenticated: function (cb) {

                var server = this;
                return $http({
                    method: "GET",
                    url: encodeUri(couchConfig.server) + "/_session"
                })
                    .success(function (data) {
                        if (data.name === null) {
                            cb(false);
                        } else {
                            couchConfig.usrCtx = data.userCtx;
                            cb(true);
                        }

                    });
            },
            get: function () {
                return couchConfig.usrCtx;
            },
            logout: function (cb) {
                var server = this;
                return $http({
                    method: "DELETE",
                    url: encodeUri(couchConfig.server) + "/_session"
                }).success(function () {
                        couchConfig.usrCtx = { name: null, roles: [] };
                        cb(true);
                    });
            }
        },
        //query view
        view: function (design, view, qparams, cb) {
            return this._queryView(
                "/_design/" + encodeURIComponent(design) +
                    "/_view/" + encodeURIComponent(view),
                qparams,
                cb
            );
        },
        // home made query
        query: function (config, cb) {
            return executeQuery(extendJSONP(config), cb);
        }

    };

});
