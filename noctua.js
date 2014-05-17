/*  
 * Package: noctua.js
 * 
 * This is a Heroku/NodeJS/local script, using the require environment.
 * 
 * A server that will render GO graphs into jsPlumb.
 * 
 * : MSGLOC=http://localhost:3400 make start-noctua
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

// The name we're using this week.
var notw = 'Noctua';

///
/// Define the sample application.
///

var NoctuaLauncher = function(){
    var self = this;

    ///
    /// Process CLI environmental variables.
    ///

    var msgloc = 'http://toaster.lbl.gov:3400'; // default val
    if( process.env.MSGLOC ){
	msgloc = process.env.MSGLOC;
	console.log('Barista location taken from environment: ' + msgloc);
    }else{
	console.log('Barista location taken from default: ' + msgloc);
    }
    self.msgloc = msgloc;

    ///
    /// Environment helpers for deployment.
    ///

    // Set up server IP address and port # using env variables/defaults.
    // WARNING: Port stuff gets weird:
    // https://www.openshift.com/forums/openshift/nodejs-websockets-sockjs-and-other-client-hostings
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
    
    self.get_token = function(req){
	var ret = null;
	if( req && req.query && req.query['barista_token'] ){
	   ret = req.query['barista_token'];
	}
	return ret;
    };

    self.standard_response = function(res, code, type, body){
	res.setHeader('Content-Type', type);
	res.setHeader('Content-Length', body.length);
	res.end(body);
	return res;
    };

    ///
    /// Cache and template rendering.
    ///

    var pt = require('./js/pup-tent.js');
    var pup_tent = pt(
	[   // Req CSS.
	    'bootstrap.min.css',
	    'jquery-ui-1.10.3.custom.min.css',
	    'bbop.css',
	    'amigo.css',
	    'NoctuaEditor.css',
	    // 'App.css',
	    'jquery-1.9.1.min.js',
	    'bootstrap.min.js',
	    'jquery-ui-1.10.3.custom.min.js',
	    'jquery.jsPlumb-1.5.5.js',
	    'connectors-sugiyama.js',
	    'jquery.tablesorter.min.js',
	    'bbop.js',
	    'amigo2.js',
	    'bbop-rest-response-mmm.js',
	    'bbop-mmm-requests.js',
	    'bbop-mme-context.js',
	    'bbop-mme-edit.js',
	    'bbop-mme-manager2.js',
	    'bbop-mme-widgets.js',
	    'bbop-draggable-canvas.js',
	    'bbop-location-store.js',
	    'bbop-messenger-client.js',
	    'NoctuaEditor.js',
	    'NoctuaLanding.js',
	    'NoctuaBasic.js',
	    // 'Basic.js',
	    // 'App.js',
	    'waiting_ac.gif',
	    'noctua_base.tmpl',
	    'noctua_base_landing.tmpl',
	    'noctua_landing.tmpl',
	    'noctua_editor.tmpl',
	    // 'index_base.tmpl',
	    // 'index_content.tmpl',
	    'noctua_basic.tmpl'
	    // 'basic_base.tmpl',
	    // 'basic_content.tmpl'
	    // 'app_base.tmpl',
	    // 'app_content.tmpl'
	], ['static', 'js', 'css', 'templates']);
    pup_tent.set_common('css_libs', [
			    '/bootstrap.min.css',
			    '/jquery-ui-1.10.3.custom.min.css',
			    '/bbop.css',
			    '/amigo.css']);
    pup_tent.set_common('js_libs', [
			    '/jquery-1.9.1.min.js',
			    '/bootstrap.min.js',
			    '/jquery-ui-1.10.3.custom.min.js',
			    '/jquery.jsPlumb-1.5.5.js',
			    '/jquery.tablesorter.min.js',
			    '/bbop.js',
			    '/amigo2.js']);

    ///
    /// Termination functions.
    ///

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

    // Initialize the server (launcher_app) and create the routes and register
    // the handlers.
    self.initializeServer = function(known_relations){

	var launcher_app = require('express');
        self.app = launcher_app();
	// Middleware needed for POST and browserid
        self.app.use(launcher_app.bodyParser());

	///
	/// Static routes.
	///

	self.app.get('/',
		     function(req, res) {

			 // Libs and render.
			 var tmpl_args = {
			     'pup_tent_js_libraries': [
				 '/bbop-rest-response-mmm.js',
				 '/bbop-mmm-requests.js',
				 '/bbop-mme-context.js',
				 '/bbop-mme-edit.js',
				 '/bbop-mme-manager2.js',
				 '/bbop-mme-widgets.js',
				 '/NoctuaLanding.js'
			     ],
			     'pup_tent_js_variables': [
				 {name: 'global_server_base', value: msgloc },
				 {name: 'global_known_relations',
				  value: bbop.core.dump(known_relations) }
			     ],
			     'title': notw + ': Selection'
			 };
			 var o = pup_tent.render_io('noctua_base_landing.tmpl',
						    'noctua_landing.tmpl',
						    tmpl_args);
			 self.standard_response(res, 200, 'text/html', o);
		     });

	self.app.get('/basic',
		     function(req, res) {
			 
			 //
			 var tmpl_args = {
			     'title': notw + ': Simple',
			     'pup_tent_js_variables': [
				 {name: 'global_server_base',
				  value: msgloc },
				 {name: 'global_known_relations',
				  value: known_relations}
			     ],
			     'pup_tent_js_libraries': [
				 '/bbop-mme-context.js',
				 '/bbop-mme-edit.js',
				 '/bbop-mme-manager2.js',
				 '/bbop-mme-widgets.js',
				 '/NoctuaBasic.js'
			     ]
			 };
			 var ind =
			     pup_tent.render_io('noctua_base_landing.tmpl',
						'noctua_basic.tmpl',
						tmpl_args);
			 self.standard_response(res, 200, 'text/html', ind);
		     });

	// Cached static routes.
	var js_re = /\.js$/;
	var css_re = /\.css$/;
	var html_re = /\.html$/;
	// Routes for all static cache items.
	each(pup_tent.cached_list(),
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
				      res.send(pup_tent.get(thing) );
				  });
		 }
	     });

	// Other static routes.
	self.app.get('/images/waiting_ac.gif',
		     function(req, res){
			 res.setHeader('Content-Type', 'image/gif');
			 res.send(pup_tent.get('waiting_ac.gif'));
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
	// 				'value': '"' + msgloc+ '"'
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

			     // Try and see if we have an API token.
			     var barista_token = self.get_token(req);
			     
			     // 
			     function mme_callback_action(resp, man){

				 if( ! resp.okay() ){
				     res.setHeader('Content-Type', 'text/html');
				     res.send('bad doc:' + query);
				 }else{				   

				     //console.log('in success callback');

				     var obj = resp.data();

				     // Assemble return doc.
				     res.setHeader('Content-Type', 'text/html');
				     
				     var barista_login = msgloc + '/login' +
					 '?return=' + self.hostport +
					 '/seed/model/' + query;
				     var barista_logout = msgloc + '/logout' +
					 '?return=' + self.hostport +
					 '/seed/model/' + query +
					 '&barista_token=' + barista_token;
				     var tmpl_args = {
					 'pup_tent_css_libraries': [
					     '/NoctuaEditor.css'
					 ],
					 'pup_tent_js_variables': [
					     {name: 'global_id',
					      value: query },
					     {name: 'global_server_base',
					      value: msgloc },
					     {name:'global_message_server',
					      value: msgloc },
					     {name: 'global_model',
					      value: obj },
					     {name: 'global_known_relations',
					      value: known_relations },
					     {name: 'global_barista_token',
					      value: barista_token }
					 ],
					 'pup_tent_js_libraries': [
					     msgloc + '/socket.io/socket.io.js',
					     '/jquery.jsPlumb-1.5.5.js',
					     '/connectors-sugiyama.js',
					     '/bbop-rest-response-mmm.js',
					     '/bbop-mmm-requests.js',
					     '/bbop-mme-context.js',
					     '/bbop-mme-edit.js',
					     '/bbop-mme-manager2.js',
					     '/bbop-mme-widgets.js',
					     '/bbop-draggable-canvas.js',
					     '/bbop-location-store.js',
					     '/bbop-messenger-client.js',
					     '/NoctuaEditor.js'
					 ],
					 'title': notw + ': Editor',
					 'messaging_server_location': msgloc,
					 barista_token: barista_token,
					 barista_login: barista_login,
					 barista_logout: barista_logout
				     };
				     var ret = pup_tent.render_io(
					 'noctua_base.tmpl',
					 'noctua_editor.tmpl',
					 tmpl_args);
				     self.standard_response(res, 200,
							    'text/html', ret);
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
			     var t = msgloc + '/api/mmm/m3GetModel';
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
	// 				'value':  '"' + msgloc+ '"'
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
			  // res.redirect(msgloc + '/api/mmm/m3ExportModel?modelId=' + mid); 
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
			  var t = msgloc + '/api/mmm/m3ExportModel';
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
var noctua = new NoctuaLauncher();

// Setup calls: don't finalize the startup until we pull the rest of
// the interesting things we need from the web.
// In this case, we're going after RO so we can pass it in once and
// early.
var imngr = new bbop.rest.manager.node(bbop.rest.response.mmm);
imngr.register('success', 's1',
	       function(resp, man){
		   console.log("got getRelations, starting initializing seq");
		   console.log(bbop.core.what_is(resp));
		   console.log('rel count: ' + resp.relations().length);
		   noctua.initialize(resp.relations());
		   noctua.start();
	       });
imngr.register('error', 'e1',
	       function(resp, man){
		   //console.log('erred out: %j', resp); 
		   console.log('not okay: %j', resp.okay());
	       });
var t = noctua.msgloc + '/api/mmm/getRelations';
var t_args = {};
var astr = imngr.action(t, t_args);
console.log("base ctarget " + t);
console.log("action to: " + astr);
