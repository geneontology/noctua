/*  
 * Package: server.js
 * 
 * This is a Heroku/NodeJS/local script, using the require environment.
 * 
 * A server that will render GO graphs into jsPlumb.
 * 
 * M3LOC=http://localhost:6800 MSGLOC=http://localhost:3400 make start-app
 */

// Required shareable Node libs.
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

var MMEnvLauncher = function() {
    var self = this;

    var laucher_app = require('express');

    // Deal with location of MMM server.
    var m3loc = 'http://toaster.lbl.gov:6800'; // default val
    if( process.env.M3LOC ){
	m3loc = process.env.M3LOC;
	console.log('server location taken from environment: ' + m3loc);
    }else{
	console.log('server location taken from default: ' + m3loc);
    }
    self.m3loc = m3loc;

    var msgloc = 'http://toaster.lbl.gov:3400'; // default val
    if( process.env.MSGLOC ){
	msgloc = process.env.MSGLOC;
	console.log('messenger location taken from environment: ' + msgloc);
    }else{
	console.log('messenger location taken from default: ' + msgloc);
    }

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
		'bootstrap.min.css': '',
		'jquery-ui-1.10.3.custom.min.css': '',
		'bbop.css': '',
		'amigo.css': '',
		'App.css': '',
		'jquery-1.9.1.min.js': '',
		'bootstrap.min.js': '',
		'jquery-ui-1.10.3.custom.min.js': '',
		'jquery.jsPlumb-1.5.5.js': '',
		'connectors-sugiyama.js': '',
		'jquery.tablesorter.min.js': '',
		'bbop.js': '',
		'amigo2.js': '',
		'bbop-rest-response-mmm.js': '',
		'bbop-mme-context.js': '',
		'bbop-mme-edit.js': '',
		'bbop-mme-manager.js': '',
		'bbop-mme-widgets.js': '',
		'bbop-draggable-canvas.js': '',
		'bbop-location-store.js': '',
		'bbop-messenger-client.js': '',
		'Landing.js': '',
		'Basic.js': '',
		'App.js': '',
		'waiting_ac.gif': '',
		'index_base.tmpl': '',
		'index_content.tmpl': '',
		'basic_base.tmpl': '',
		'basic_content.tmpl': '',
		'app_base.tmpl': '',
		'app_content.tmpl': ''
	    };
        }
	
        // Local cache for static content.
	each(self.zcache,
	     function(cache_item){
		 // Try to read from static and js.
		 each(['static', 'js', 'css', 'templates'],
		      function(loc){
			  var path = './' + loc + '/' + cache_item;
			  //console.log('l@: ' + path);
			  if( fs.existsSync(path) ){
			      //console.log('found: ' + path);
			      self.zcache[cache_item] = fs.readFileSync(path);
			  }
		      });
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

    // Initialize the server (laucher_app) and create the routes and register
    // the handlers.
    self.initializeServer = function(known_relations) {
        //self.createRoutes();
        self.app = laucher_app();
	// Middleware needed for POST and browserid
        self.app.use(laucher_app.bodyParser());

	///
	/// Static routes.
	///

	self.app.get('/',
		     function(req, res) {
			 //var ind = self.cache_get('index.html').toString();
			 var index_tmpl =
			     self.cache_get('index_content.tmpl').toString();
			 var ind_cont = mustache.render(index_tmpl);
			 var base_tmpl =
			     self.cache_get('index_base.tmpl').toString();
			 var base_tmpl_args = {
			     'title': 'go-mme',
			     'content': ind_cont,
			     'js_variables': [
				 {
				     'name': 'global_server_base',
				     'value': '"' + m3loc + '"'
				 },
				 {
				     'name': 'global_known_relations',
				     'value': bbop.core.dump(known_relations)
				 }
			     ]
			 };
			 var ind = mustache.render(base_tmpl, base_tmpl_args);

			 self.standard_response(res, 200, 'text/html', ind);
		     });

	self.app.get('/basic',
		     function(req, res) {
			 //var ind = self.cache_get('index.html').toString();
			 var index_tmpl =
			     self.cache_get('basic_content.tmpl').toString();
			 var ind_cont = mustache.render(index_tmpl);
			 var base_tmpl =
			     self.cache_get('basic_base.tmpl').toString();
			 var base_tmpl_args = {
			     'title': 'go-mme',
			     'content': ind_cont,
			     'js_variables': [
				 {
				     'name': 'global_server_base',
				     'value': '"' + m3loc+ '"'
				 },
				 {
				     'name': 'global_known_relations',
				     'value': bbop.core.dump(known_relations)
				 }
			     ]
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

	// // Load a null setup.
	// // TODO: first get new ID before kicking.
	// self.app.get('/seed/null',
	// 	     function(req, res) {
	// 		 // Assemble return doc.
	// 		 res.setHeader('Content-Type', 'text/html');

	// 		    var frame_tmpl =
	// 			self.cache_get('app_content.tmpl').toString();
	// 		    var frame_cont = mustache.render(frame_tmpl);

	// 		    var base_tmpl =
	// 			self.cache_get('app_base.tmpl').toString();
	// 		    var base_tmpl_args = {
	// 			'title': 'go-mme: editor',
	// 			'js_variables': [
	// 			    {
	// 				'name': 'global_id',
	// 				'value': '"unknown"'
	// 			    },
	// 			    {
	// 				'name': 'global_server_base',
	// 				'value': '"' + m3loc+ '"'
	// 			    },
	// 			    {
	// 				'name': 'global_model',
	// 				'value': '{"id": "???", "instances":[]}'
	// 			    }
	// 			],
	// 			'content': frame_cont
	// 		    };
	// 		 var ret = mustache.render(base_tmpl, base_tmpl_args);
	// 		 res.send(ret);
	// 	     });

	self.app.get('/seed/model/:query',
		     function(req, res) {

			 //console.log(req.route);
			 //console.log(req.route.params['query']);
			 var query = req.route.params['query'] || '';
			 if( ! query || query == '' ){
			     // Catch error here if no proper ID.
			     res.setHeader('Content-Type', 'text/html');
			     res.send('no identifier');
			 }else{
		    
			     //console.log('make attempt');

			     // 
			     function mme_callback_action(resp, man){

				 if( ! resp.okay() ){
				     res.setHeader('Content-Type', 'text/html');
				     res.send('bad doc:' + query);
				 }else{				   

				     //console.log('in success callback');

				     var obj = resp.data();
				     var obj_str = bbop.core.dump(obj);

				     // Assemble return doc.
				     res.setHeader('Content-Type', 'text/html');
				     
				     var frame_tmpl =
					 self.cache_get('app_content.tmpl').toString();
				     var frame_cont = mustache.render(frame_tmpl);
				     
				     var base_tmpl =
					 self.cache_get('app_base.tmpl').toString();
				     var base_tmpl_args = {
					 'title': 'go-mme: editor',
					 'messaging_server_location': msgloc,
					 'js_variables': [
					     {
						 'name': 'global_id',
						 'value': '"' + query + '"'
					     },
					     {
						 'name': 'global_server_base',
						 'value':  '"' + m3loc+ '"'
					     },
					     {
						 'name':'global_message_server',
						 'value':  '"' + msgloc+ '"'
					     },
					     {
						 'name': 'global_model',
						 'value': obj_str
					     },
					     {
						 'name':
						 'global_known_relations',
						 'value':
						 bbop.core.dump(known_relations)
					     }
					 ],
					 'content': frame_cont
				     };
				     var ret = mustache.render(base_tmpl,base_tmpl_args);
				     res.send(ret);
				 }
			     }
			  
			     // Assemble query to get the desired MM.
			     var m = new bbop.rest.manager.node(bbop.rest.response.mmm);
			     m.register('success', 'foo', mme_callback_action);
			     m.register('error', 'bar',
					function(resp, man){
					    res.setHeader('Content-Type',
							  'text/html');
					    res.send('failure ('+
						     resp.message_type() +'): '+
						     resp.message());
					});
			     var t = m3loc + '/m3GetModel';
			     var t_args = {
				 'modelId': query
			     };
			     var astr = m.action(t, t_args);
			     console.log("action to: " + astr);
			 }
		     });

	// self.app.post('/action/load',
	// 	     function(req, res) {

	// 		 // Deal with incoming parameters.
	// 		 var model_data = req.route.params['model_data'] ||
	// 		     req.body['model_data'] ||
	// 		     '{"id": "???", "instances":[]}';

	// 		 // Assemble return doc.
	// 		 res.setHeader('Content-Type', 'text/html');

	// 		    var frame_tmpl =
	// 			self.cache_get('app_content.tmpl').toString();
	// 		    var frame_cont = mustache.render(frame_tmpl);

	// 		    var base_tmpl =
	// 			self.cache_get('app_base.tmpl').toString();
	// 		    var base_tmpl_args = {
	// 			'title': 'go-mme: editor',
	// 			'js_variables': [
	// 			    {
	// 				// TODO: need to extract the ID.
	// 				'name': 'global_id',
	// 				'value': '"unknown"'
	// 			    },
	// 			    {
	// 				'name': 'global_server_base',
	// 				'value':  '"' + m3loc+ '"'
	// 			    },
	// 			    {
	// 				'name':'global_message_server',
	// 				'value':  '"' + msgloc+ '"'
	// 			    },
	// 			    {
	// 				'name': 'global_model',
	// 				'value': model_data
	// 			    }
	// 			],
	// 			'content': frame_cont
	// 		    };
	// 		 var ret = mustache.render(base_tmpl, base_tmpl_args);
	// 		 res.send(ret);
	// 	     });

	// Test export handler.
	self.app.post('/action/export',
		     function(req, res) {

			 // Deal with incoming parameters.
			 var mid = req.route.params['model_id'] ||
			     req.body['model_id'] || '???';

			 // // Assemble return doc.
			 // res.redirect(m3loc + '/m3ExportModel?modelId=' + mid); 
			 // //res.setHeader('Content-Type', 'text/plain');
			 // //res.send(data);

			 // 
			 function export_callback_action(resp, man){

			     if( ! resp.okay() ){
				 res.setHeader('Content-Type', 'text/html');
				 res.send('bad doc from: ' + mid);
			     }else{				   

				 //console.log('in success callback');

				 var obj = resp.data();
				 var obj_str = obj['export'];

				 // Assemble return doc.
				 //res.setHeader('Content-Type', 'text/owl');
				 res.setHeader('Content-Type', 'text/plain');
				 res.send(obj_str);
			     }
			 }
			  
			 // Assemble query to get the desired MM.
			 var m =
			     new bbop.rest.manager.node(bbop.rest.response.mmm);
			 m.register('success', 'foo', export_callback_action);
			 m.register('error', 'bar',
				    function(resp, man){
					res.setHeader('Content-Type',
						      'text/html');
					res.send('failure ('+
						 resp.message_type() +'): '+
						 resp.message());
				    });
			 var t = m3loc + '/m3ExportModel';
			 var t_args = {
			     'modelId': mid
			 };
			 var astr = m.action(t, t_args);
			 console.log("action to: " + astr);
		     });
    };

    // Initializes the sample application.
    self.initialize = function(known_relations){

	var knw_rel = known_relations || [];

        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer(knw_rel);
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

// Deliver the prototype JS MME application to the client.
var mmees = new MMEnvLauncher();

// Setup calls: don't finalize the startup until we pull the rest of
// the interesting things we need from the web.
// In this case, we're going after RO so we can pass it in once and
// early.
var imngr = new bbop.rest.manager.node(bbop.rest.response.mmm);
imngr.register('success', 's1',
	       function(resp, man){
		   console.log("got getRelations, starting initializing seq");
		   console.log(bbop.core.what_is(resp));
		   mmees.initialize(resp.relations());
		   mmees.start();
	       });
imngr.register('error', 'e1',
	       function(resp, man){
		   //console.log('erred out: %j', resp); 
		   console.log('okay: %j', resp.okay());
	       });
var t = mmees.m3loc + '/getRelations';
var t_args = {};
var astr = imngr.action(t, t_args);
console.log("action to: " + astr);
