/*  
 * Package: server.js
 * 
 * This is a Heroku/NodeJS/local script, using the require environment.
 * 
 * A server that will render GO graphs into jsPlumb.
 */

// Required Node libs.
var express = require('express');
var mustache = require('mustache');
var fs = require('fs');

// Required add-on libs.
var bbop = require('bbop').bbop;
var amigo = require('amigo2').amigo;

// Aliases.
var each = bbop.core.each;
var what_is = bbop.core.what_is;
var is_defined = bbop.core.is_defined;

// Figure out our base and URLs we'll need to aim this locally.
var linker = new amigo.linker();
var sd = new amigo.data.server();
var app_base = sd.app_base();

// // Logger.
// var logger = new bbop.logger();
// logger.DEBUG = true;
// function _ll(str){ logger.kvetch('app: ' + str); }

///
/// Define the sample application.
///

var Sugiyama = function() {

    var self = this;

    ///
    /// Environment helpers.
    ///

    // Set up server IP address and port # using env variables/defaults.
    // WARNING: Port stuff gets weird: https://www.openshift.com/forums/openshift/nodejs-websockets-sockjs-and-other-client-hostings
    self.setupVariables = function() {

	var non_std_local_port = 8910;

	self.IS_ENV_OPENSHIFT = false;
	self.IS_ENV_HEROKU = false;
	self.IS_ENV_LOCAL = false;

	if( process.env.OPENSHIFT_APP_DNS ){
	    self.IS_ENV_OPENSHIFT = true;	    

            self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
            self.port = process.env.OPENSHIFT_NODEJS_PORT;
	    self.hostport = 'http://' + process.env.OPENSHIFT_APP_DNS;

            console.warn('OPENSHIFT_NODEJS');
	}else if( process.env.PORT ){
	    self.IS_ENV_HEROKU = true;

            self.port = process.env.PORT || non_std_local_port;
	    self.hostport = '';

            console.warn('HEROKU_NODEJS');
	}else{
	    self.IS_ENV_LOCAL = true;

            self.ipaddress = '127.0.0.1';
            self.port = non_std_local_port;
	    self.hostport = 'http://'+ self.ipaddress +':'+ non_std_local_port;

            console.warn('LOCAL_NODEJS');
	}
    };

    ///
    /// Various static document helpers.
    ///

    // Default top-level page. Just say "hi!"
    self.static_index = function(){

	var indexdoc = [
	    '<html>',
	    '<head>',
	    '<meta charset="utf-8">',
	    '</head>',
	    '<body>',
	    '<p>',
	    'Hello, World! (dynamic)',
	    '</p>',
	    '</body>',
	    '</html>'
	].join(' ');
	return indexdoc;
    };

    ///
    /// Response helper.
    ///
    
    self.standard_response = function(res, code, type, body){
	res.setHeader('Content-Type', type);
	res.setHeader('Content-Length', body.length);
	res.end(body);
	return res;
    };

    ///
    /// Cache helpers.
    ///

    //  Populate the cache.
    self.populateCache = function() {
        if( typeof self.zcache === "undefined" ){
            self.zcache = {
		'bootstrap.min.js': '',
		'jquery-ui-1.10.3.custom.min.css': '',
		'bbop.css': '',
		'amigo.css': '',
		'App.css': '',
		'jquery-1.9.1.min.js': '',
		'bootstrap.min.js': '',
		'jquery-ui-1.10.3.custom.min.js': '',
		'jquery.jsPlumb-1.5.5.js': '',
		'bbop.js': '',
		'amigo2.js': '',
		'App.js': '',
		'frame.tmpl': ''
//		'index.html': ''
	    };
        }
	
        // Local cache for static content.
	each(self.zcache,
	     function(cache_item){
		 self.zcache[cache_item] =
		     fs.readFileSync('./static/' + cache_item);
	     });
    };

    // Retrieve entry (content) from cache.
    // @param {string} key  Key identifying content to retrieve from cache.
    self.cache_get = function(key) {
	return self.zcache[key];
    };

    // terminator === the termination handler
    // Terminate server on receipt of the specified signal.
    // @param {string} sig  Signal to terminate on.
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };

    // Setup termination handlers (for exit and a list of signals).
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };

    ///
    /// App server functions (main app logic here).
    ///

    // Initialize the server (express) and create the routes and register
    // the handlers.
    self.initializeServer = function() {
        //self.createRoutes();
        self.app = express();

	///
	/// Static routes.
	///

	// Internal static routes.
	// self.app.get('/',
	// 	     function(req, res){
	// 		 self.standard_response(res, 200, 'text/html',
	// 					self.static_index());
	// 	     });
	self.app.get('/',
		     function(req, res) {
			 res.setHeader('Content-Type', 'text/html');
			 var tmpl = self.cache_get('frame.tmpl').toString();
			 var tmpl_args = {
			     // 'js_variables': [
			     // 	 {'name': 'foo', 'value': 1}
			     // ],
			     'body_content':
			     'Try GO term ID URLs like: <a class="button" href="/term/GO:0022008">/term/GO:0022008</a>'
			 };
			 //console.log(tmpl.toString());
			 //console.log(tmpl_args);
			 //var ret = mustache.to_html(tmpl, tmpl_args);
			 var ret = mustache.to_html(tmpl, tmpl_args);
			 res.send(ret);
			 //res.send(tmpl);
		     });

	// Cached static routes.
	var js_re = /\.js$/;
	var css_re = /\.css$/;
	var html_re = /\.html$/;
	// Routes for all static cache items.
	each(self.zcache,
	     function(thing){
		 var ctype = null;
		 if( js_re.test(thing) ){
		     ctype = 'text/javascript';
		 }else if( css_re.test(thing) ){
		     ctype = 'text/css';
		 }else if( html_re.test(thing) ){
		     ctype = 'text/html';
		 }

		 // This will skip cached templates.
		 if( ctype !== null ){
		     self.app.get('/' + thing, 
				  function(req, res) {
				      res.setHeader('Content-Type', ctype);
				      res.send(self.cache_get(thing) );
				  });
		 }
	     });

	// Other static routes.
	// TODO: This obviously does not do anything than supress some types
	// of error messages.
	self.app.get('/favicon.ico',
		     function(req, res){
			 self.standard_response(res, 200, 'image/x-icon', '');
		     });

	///
	/// Dynamic OpenSearch components/routes.
	///

	// Define the GOlr request conf.
	var server_loc = 'http://golr.berkeleybop.org/';
	var gconf = new bbop.golr.conf(amigo.data.golr);

	// The request functions I use are very similar.
	function create_request_function(personality, doc_type,
					 id_field, label_field, graph_field){

	    return function(req, res) {

		//console.log(req.route);
		//console.log(req.route.params['query']);
		var query = req.route.params['query'] || '';
		if( ! query || query == '' ){
		    // Catch error here if no proper ID.
		    res.setHeader('Content-Type', 'text/html');
		    res.send('no identifier');
		}else{
		    
		    // Try AmiGO 2 action.
		    var go = new bbop.golr.manager.nodejs(server_loc, gconf);
		    go.set_personality(personality); // profile in gconf
		    go.add_query_filter('document_category', doc_type);
		    go.set_id(query);

		    // Define what we do when our GOlr (async) information
		    // comes back within the scope of the response we
		    // need to end.
		    function golr_callback_action(gresp){

			// There should be only one return doc.
			var doc = gresp.get_doc(0);
			if( ! doc ){
			    res.setHeader('Content-Type', 'text/html');
			    res.send('bad doc:' + query);
			}else{
			    var id = doc[id_field];
			    var label = doc[label_field];
			    var graph = doc[graph_field];
			    
			    // Assemble return doc.
			    res.setHeader('Content-Type', 'text/html');
			    var tmpl = self.cache_get('frame.tmpl').toString();
			    var tmpl_args = {
				'js_variables': [
					 {
					     'name': 'global_id',
					     'value': '"' + id + '"'
					 },
					 {
					     'name': 'global_label',
					     'value': '"' + label + '"'
					 },
					 {
					     'name': 'global_graph',
					     'value': graph
					 }
				],
				'body_content': label + ' (' + id + ')'
			    };
			    var ret = mustache.render(tmpl, tmpl_args);
			    res.send(ret);
			}
		    }

		    // Run the agent action.
		    go.register('search', 'do', golr_callback_action);
		    go.update('search');
		    //console.log('update: search');
		}
	    };
	}

	// Dynamic GOlr output.
	self.app.get('/term/:query',
		     create_request_function('ontology',
					     'ontology_class',
					     'annotation_class',
					     'annotation_class_label',
					     'topology_graph_json'));
    };

    // Initializes the sample application.
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };

    // Start the server (starts up the sample application).
    // Either in Heroku, Openshift, or various local.
    self.start = function() {
	if( self.IS_ENV_HEROKU ){
	    // Heroku seems to want a more minimal launch.
	    self.app.listen(self.port,
			    function() {
				console.log('%s: Node started on %s:%d ...',
					    Date(Date.now()),
					    self.ipaddress || '???',
					    self.port);
			    });
	}else{
            // Start the app on the specific interface (and port).
            self.app.listen(self.port, self.ipaddress,
			    function() {
				console.log('%s: Node started on %s:%d ...',
					    Date(Date.now()),
					    self.ipaddress,
					    self.port);
			    });
	}
    };
};

///
/// Main.
///

var goo = new Sugiyama();
goo.initialize();
goo.start();
