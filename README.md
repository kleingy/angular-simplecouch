angular-simplecouch
===================

An angularjs simple and configurable couchdb client.

Inspired by [CornerCouch](https://github.com/eddelplus/CornerCouch)
and nano [Nano](https://github.com/dscape/nano)

Fully written in AngularJs (JQuery not required).

## How to use it

include angular.js
include angular.simplecouch.js

## Configuration

``` js
angular.module('Config', ['SimpleCouch']).config(function (couchConfigProvider,$httpProvider) {
    couchConfigProvider.setServer('http://127.0.0.1:5984');
    couchConfigProvider.setDB('dbname');
    
});
```

## API

### Configuration

    config.getServer()
    config.setServer('server_name')
	config.setMethod('method GET/JSONP')
	config.getMethod()

### DB
	db.use('db_name')
	db.getName()

### Documents	
	doc.post (data, function callback(data))
	doc.delete (doc, function callback(data))
	doc.get (doc_id, function callback(data))
	doc.put (data, function callback(data))
	
### Attachments
	attach.put (doc, file, options{fileType}, function callback(data))
	attach.get (doc_id, name, function callback(data))
	attach.delete (doc, name, function callback(data))
	
### Views
	view(design, view, qparams, function callback(data))
	
### Queries
	query(config, function callback(data))

### Users	
	user.session(function callback(data))
	user.create(username, password, function callback(data)
	user.login(username, password, function callback(data))
	user.isAuthenticated(function callback(data))
	user.get
	user.logout(function callback(data))
	
