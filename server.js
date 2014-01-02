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

///
/// Define the sample application.
///

var MMEEditorServer = function() {

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
		'waiting_ac.gif': '',
		'base.tmpl': '',
		'app_base.tmpl': '',
		'index_content.tmpl': '',
		'frame.tmpl': '',
		'index.html': ''
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

	self.app.get('/',
		     function(req, res) {
			 //var ind = self.cache_get('index.html').toString();
			 var index_tmpl =
			     self.cache_get('index_content.tmpl').toString();
			 var ind_cont = mustache.render(index_tmpl);

			 var base_tmpl = self.cache_get('base.tmpl').toString();
			 var base_tmpl_args = {
			     'title': 'go-mme',
			     'content': ind_cont
			 };
			 var ind = mustache.render(base_tmpl, base_tmpl_args);

			 self.standard_response(res, 200, 'text/html', ind);
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
	self.app.get('/images/waiting_ac.gif',
		     function(req, res){
			 res.setHeader('Content-Type', 'image/gif');
			 res.send(self.cache_get('waiting_ac.gif'));
		     });
	// TODO: This obviously does not do anything than supress some types
	// of error messages.
	self.app.get('/favicon.ico',
		     function(req, res){
			 self.standard_response(res, 200, 'image/x-icon', '');
		     });

	///
	/// Dynamic components/routes.
	///

	// Define the GOlr request conf.
	var server_loc = 'http://golr.berkeleybop.org/';
	//var server_loc = 'http://localhost:8080/solr/';
	var gconf = new bbop.golr.conf(amigo.data.golr);

	// The request functions I use are very similar.
	// This is for jsPlumb.
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

		    // Hook the query through this field.
		    //go.set_id(query);
		    go.add_query_filter(id_field, query);

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

			    var frame_tmpl =
				self.cache_get('frame.tmpl').toString();
			    var frame_cont = mustache.render(frame_tmpl);

			    var base_tmpl =
				self.cache_get('app_base.tmpl').toString();
			    var base_tmpl_args = {
				'title': 'go-mme: editor',
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
				'content': frame_cont
			    };
			    var ret = mustache.render(base_tmpl,base_tmpl_args);
			    res.send(ret);
			}
		    }

		    // Run the agent action.
		    go.register('search', 'do', golr_callback_action);
		    //console.log('search: ' + go.get_query_url());
		    go.update('search');
		}
	    };
	}
	// Dynamic GOlr output.
	self.app.get('/seed/complex_annotation/:query',
		     create_request_function('complex_annotation',
					     'complex_annotation',
					     'annotation_group',
					     'annotation_group_label',
					     'topology_graph_json'));
	self.app.get('/seed/null',
		     function(req, res) {
			 // Assemble return doc.
			 res.setHeader('Content-Type', 'text/html');

			    var frame_tmpl =
				self.cache_get('frame.tmpl').toString();
			    var frame_cont = mustache.render(frame_tmpl);

			    var base_tmpl =
				self.cache_get('app_base.tmpl').toString();
			    var base_tmpl_args = {
				'title': 'go-mme: editor',
				'js_variables': [
				    {
					'name': 'global_id',
					'value': '"unknown"'
				    },
				    {
					'name': 'global_label',
					'value': '"unknown"'
				    },
				    {
					'name': 'global_graph',
					'value': '{"nodes":[], "edges":[]}'
				    }
				],
				'content': frame_cont
			    };
			 var ret = mustache.render(base_tmpl, base_tmpl_args);
			 res.send(ret);
		     });
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

var mmees = new MMEEditorServer();
mmees.initialize();
mmees.start();
