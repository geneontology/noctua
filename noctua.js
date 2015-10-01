/*
 * Package: noctua.js
 *
 * This is a Heroku/NodeJS/local script, using the require environment.
 *
 * A server that will render GO graphs into jsPlumb.
 *
 * : BARISTA_LOCATION=http://localhost:3400 make start-noctua
 */

// Let jshint pass over over our external globals or oddities.
/* global unescape */

// Required shareable Node libs.
var mustache = require('mustache');
var fs = require('fs');
var yaml = require('yamljs');
var mime = require('mime');

// Required add-on libs.
var bbop_legacy = require('bbop').bbop;
//var bbopx = require('bbopx');
var amigo = require('amigo2');

var us = require('underscore');
var bbop = require('bbop-core');

var barista_response = require('bbop-response-barista');
var minerva_requests = require('minerva-requests');

// Aliases.
var each = us.each;
var what_is = bbop.what_is;
var is_defined = bbop.is_defined;
var dump = bbop.dump;

// Figure out our base and URLs we'll need to aim this locally.
var linker = new amigo.linker();
var sd = new amigo.data.server();
var app_base = sd.app_base();

// Get some information about what we'll be folding away.
var collapsible_relations = require('./config/collapsible_relations.json');
console.log('Will fold: ', collapsible_relations);

//var golr_server_location = 'http://golr.berkeleybop.org/';
// Local testing.
var golr_server_location = 'http://localhost:8080/solr/';
// Emergency public backup.
//var golr_server_location = 'http://geneontology-golr.stanford.edu/solr/';
console.log('Using GOlr server at: ', golr_server_location);

// The name we're using this week.
var notw = 'Noctua (Preview)';

///
/// Define the sample application.
///

var NoctuaLauncher = function(){
    var self = this;

    // Monitor some stats.
    var monitor_internal_kicks = 0;
    var monitor_external_kicks = 0;

    ///
    /// Process CLI environmental variables.
    ///

    // Get the location(s) of the workbench plugins.
    var workbenches = [];
    process.env.WORKBENCHES = 'workbenches'; // TODO: we're internal for now...
    if( process.env.WORKBENCHES ){

	var raw_w = process.env.WORKBENCHES;
	if( raw_w ){

	    // Break the incoming string along the whitespace.
	    var maybe_dirs = raw_w.split(/\s+/);
	    each(maybe_dirs, function(dir){
		//console.log('dir', dir);

		// Look at all of the listed directories.
		var files = fs.readdirSync(dir);
		//console.log('files', files);

		// Only try to scan the YAML files in those
		// directories.
		each(files, function(file){
		    //console.log('file', file);
		    
		    var suf = '.yaml';
		    if( file.indexOf(suf, file.length - suf.length) !== -1 ){
			
			// Check that the file looks right.
			var wb = yaml.load(dir + '/' + file);
			if( wb['menu-name'] && wb['page-name'] &&
			    wb['help-link'] && wb['path-id'] &&
			    wb['body-template'] &&
			    wb['css'] && wb['javascript'] ){
				
		            // Add the base file location of the wb.
		            wb['base-location'] = dir;
				
			    // Load workbench for later.
			    workbenches.push(wb);
			    console.log(
				'Added workbench ('+ wb['path-id']+ '): '+ file);
			}else{
			    console.log('Rejected workbench: ' + file);
			}
		    }
		});
	    });
	}	
    }
    if( us.isEmpty(workbenches) ){
	console.log('No workbenches defined.');
    }
    self.workbenches = workbenches;

    // Barista.
    var barloc = 'http://localhost:3400';
    //var barloc_public = 'http://toaster.lbl.gov:3400';
    var barloc_public = 'http://barista.berkeleybop.org'; // BUG: tmp chris fix
    if( process.env.BARISTA_LOCATION ){
	barloc = process.env.BARISTA_LOCATION;
	console.log('Barista location taken from environment: ' + barloc);
    }else{
	console.log('Barista location taken from default: ' + barloc);
    }
    self.barista_location = barloc;

    // Initial setup of which minerva definition to use (to pass to
    // barista for translation).
    var min_def_name = 'minerva_localhost';
    var min_def_name_public = 'minerva_public'; // used in remote deployments
    if( process.env.MINERVA_DEFINITION ){
	min_def_name = process.env.MINERVA_DEFINITION;
	console.log('Minerva definition name from environment: ' + min_def_name);
    }else{
	console.log('Minerva definition name from default: ' + min_def_name);
    }
    self.minerva_definition_name = min_def_name;

    ///
    /// Environment helpers for deployment; also changing some of the
    /// default values depending on the environment to help with
    /// deployment.
    ///

    // Set up server IP address and port # using env variables/defaults.
    // WARNING: Port stuff gets weird:
    // https://www.openshift.com/forums/openshift/nodejs-websockets-sockjs-and-other-client-hostings
    // self.setupVariables = function() {

	var non_std_local_port = 8910;

	self.IS_ENV_OPENSHIFT = false;
	self.IS_ENV_HEROKU = false;
	self.IS_ENV_LOCAL = false;

	if( process.env.OPENSHIFT_APP_DNS ){
	    self.IS_ENV_OPENSHIFT = true;

	    // Try and setup hostname and port as best we can.
            self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
            self.port = process.env.OPENSHIFT_NODEJS_PORT;
	    self.hostport = 'http://' + process.env.OPENSHIFT_APP_DNS;

	    // Also, we need to use the public version or minerva or badness.
	    self.barista_location = barloc_public;
	    self.minerva_definition_name = min_def_name_public;
	    console.log('Changing Barista location  to: ' +
			self.barista_location + ' for openshift');
	    console.log('Changing Minerva definition to: ' +
			self.minerva_definition_name + ' for openshift');

            console.warn('Running as: OPENSHIFT_NODEJS');
	}else if( process.env.PORT ){
	    self.IS_ENV_HEROKU = true;

	    // Try and setup port as best we can.
            self.port = process.env.PORT || non_std_local_port;
	    self.hostport = '';

	    // Also, we need to use the public version or minerva or badness.
	    self.barista_location = barloc_public;
	    self.minerva_definition_name = min_def_name_public;
	    console.log('Changing Barista location  to: ' +
			self.barista_location + ' for heroku');
	    console.log('Changing Minerva definition to: ' +
			self.minerva_definition_name + ' for heroku');

            console.warn('Running as: HEROKU_NODEJS');
	}else{
	    self.IS_ENV_LOCAL = true;

	    // If Noctua host is env defined, use that, or sane default.
            self.ipaddress =  process.env.NOCTUA_HOST || '127.0.0.1';
            self.port = process.env.NOCTUA_PORT || non_std_local_port;
	    self.hostport = 'http://'+ self.ipaddress +':'+ self.port;
	    // This allows the links available to be optionally
	    // different than the literal operating address of noctua.
	    self.frontend = process.env.NOCTUA_FRONTEND || self.hostport;

            console.warn('Running as: LOCAL_NODEJS');
	}
//    };

    // Attempt to intelligently add a token to an input URL.
    // BUG: This code is repeated in
    // bbop_mme_widgets.build_token_link().
    function _build_token_link(url, token, token_name){
	var new_url = url;

	// Default to "barista_token".
	if( ! token_name ){ token_name = 'barista_token'; }

	if( token ){
	    if( new_url.indexOf('?') === -1 ){
		new_url = new_url + '?' + token_name + '=' + token;
	    }else{
		new_url = new_url + '&' + token_name + '=' + token;
	    }
	}

	return new_url;
    }

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

    // Standard template arguments payload.
    self.standard_variable_load = function(app_path, app_name, req,
					   model_id, model_obj, additional_args){

	// Try and see if we have an API token from the request.
	var barista_token = self.get_token(req);
	var noctua_landing = _build_token_link(self.frontend, barista_token);
	var barista_loc = self.barista_location;
	var barista_login = null;
	var barista_logout = null;
	if( app_path === '' || app_path === '/' ){ // non-id based pages.
	    barista_login = barista_loc + '/session' + '?return=' +
		self.frontend + app_path;
	    barista_logout =
		_build_token_link(barista_loc + '/session' + '?return=' +
				  self.frontend + app_path, barista_token);
	}else{
	    barista_login = barista_loc + '/session' + '?return=' +
		self.frontend + app_path + '/' + model_id;
	    barista_logout =
		_build_token_link(barista_loc + '/session' + '?return=' +
				  self.frontend + app_path + '/' +
				  model_id, barista_token);
	}
	var barista_users =
		_build_token_link(self.barista_location +'/user_info',
				  barista_token);
	var out_known_rels = self.known_relations;

	// Limit out variables in some cases.
	if( app_path === '' || app_path === '/' ){
	    out_known_rels = null;
	}

	var tmpl_args = {
	    'pup_tent_js_variables': [
		{name: 'global_id',
		 value: model_id },
		{name: 'global_model',
		 value: (model_obj || null)},
		{name: 'global_golr_server',
		 value: golr_server_location},
		{name: 'global_minerva_definition_name',
		 value: self.minerva_definition_name },
		{name: 'global_barista_location',
		 value: self.barista_location },
		{name: 'global_known_relations',
		 value: out_known_rels },
		{name: 'global_collapsible_relations',
		 value: collapsible_relations },
		{name: 'global_barista_token',
		 value: barista_token }
	    ],
	    'title': notw + ' ' + app_name,
	    'model_id': model_id,
	    'barista_token': barista_token,
	    'barista_location': self.barista_location,
	    'barista_users': barista_users,
	    'noctua_landing': noctua_landing,
	    'barista_login': barista_login,
	    'barista_logout': barista_logout,
	    'noctua_workbenches': workbenches
	};

	// Load in the additions.
	each(additional_args, function(val, key){
	    tmpl_args[key] = val;
	});
	
	return tmpl_args;
    };

    // Assemble return doc.
    self.bootstrap_editor = function(req, res, model_id, model_obj){

	// Assemble return doc.
	res.setHeader('Content-Type', 'text/html');

	var tmpl_args = self.standard_variable_load(
	    '/editor/graph', 'Editor', req, model_id, model_obj,
	    {
		'pup_tent_css_libraries': [
		    '/NoctuaEditor.css'
		],
		'pup_tent_js_libraries': [
		    '/jquery.jsPlumb-1.5.5.js',
		    '/jquery.tablesorter.min.js',
		    self.barista_location + '/socket.io/socket.io.js',
		    '/connectors-sugiyama.js',
		    '/NoctuaEditor.js'
		]
	    });

	var ret = pup_tent.render('noctua_editor.tmpl',
				  tmpl_args, 'noctua_base.tmpl');
	self.standard_response(res, 200, 'text/html', ret);
    };

    ///
    /// Cache and template rendering.
    ///

    // Will pick things up recursively.
    var ppaths = ['static', 'deploy', 'css', 'templates'];
  
    // Add the paths for the workbench plugins. The workbench JS will
    // get compiled into the deploy directory, but we still need to
    // pickup the templates and keep them ready.
    each(workbenches, function(wb){
    	// We know these are good.
    	var path_id = wb['path-id'];
    	// var css_list = wb['css'];
    	// var js_list = wb['javascript'];
    	var base_location = wb['base-location'];
    	ppaths.push(base_location +'/'+ path_id);
    });
    var pup_tent = require('pup-tent')(ppaths, null, true);
    pup_tent.use_cache_p(false);
    pup_tent.set_common('css_libs', [
	'/bootstrap.min.css',
	'/jquery-ui-1.10.3.custom.min.css',
	'/bbop.css',
	'/amigo.css']);
    pup_tent.set_common('js_libs', [
	'/jquery.js',
	'/bootstrap.min.js',
	'/jquery-ui-1.10.3.custom.min.js',
    ]);
    //console.log('pup_tent', pup_tent.cached_list());

    ///
    /// Termination functions.
    ///

    // terminator === the termination handler
    // Terminate server on receipt of the specified signal.
    // @param {string} sig  Signal to terminate on.
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating noctua...',
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
    self.initializeServer = function(){

	var launcher_app = require('express');
        self.app = launcher_app();
	// Middleware needed for POST and browserid
        self.app.use(launcher_app.bodyParser());

	///
	/// Static routes.
	///

	self.app.get('/', function(req, res) {

	    // // Capella takes a bit more care.
	    // var capella_blank = _build_token_link(self.frontend + '/capella',
	    // 					  barista_token);
	    // var capella_payload = '[{"publication_id": "PMID:000000","annotation_id": "foo:0000000","terms": [ "GO:0003674", "GO:0008150"],"entities": [ "UniProtKB:P0000" ]}]';
	    // var capella_test =
	    // 	    _build_token_link(self.frontend + '/capella?bootstrap=' +
	    // 			      capella_payload, barista_token);

	    var tmpl_args = self.standard_variable_load(
		'/', 'Select', req, null, null,
		{
		    'pup_tent_css_libraries': [
			'/noctua_landing.css'
		    ],
		    'pup_tent_js_libraries': [
			'/NoctuaLanding.js'
		    ],
		    // 'capella_blank': capella_blank,
		    // 'capella_payload': capella_payload,
		    // 'capella_test': capella_test
		});
	    
	    // Render.
	    var o = pup_tent.render('noctua_landing.tmpl',
				    tmpl_args,
				    'noctua_base_landing.tmpl');
	    self.standard_response(res, 200, 'text/html', o);
	});

	self.app.get('/basic/:query', function(req, res) {

	    // Try and see if we have an API token.
	    var barista_token = self.get_token(req);
	    var model_id = req.route.params['query'] || '';

	    var noctua_landing = _build_token_link(self.frontend, barista_token);
	    var barista_login = self.barista_location + '/session' + '?return=' +
		    self.frontend + '/basic/' + model_id;
	    var barista_logout =
		    _build_token_link(self.barista_location + '/session' +
				      '?return=' + self.frontend + '/basic/' +
				      model_id, barista_token);

	    //
	    var tmpl_args = {
		'title': notw + ': Simple',
		'barista_token': barista_token,
		'noctua_landing': noctua_landing,
		'barista_login': barista_login,
		'barista_logout': barista_logout,
		'pup_tent_js_variables': [
		    {name: 'global_minerva_definition_name',
		     value: self.minerva_definition_name },
		    {name: 'global_known_relations',
		     value: self.known_relations},
		    {name: 'global_barista_token',
		     value: barista_token},
		    {name:'global_barista_location',
		     value: self.barista_location },
		    {name: 'golr_loc',
		     value: golr_server_location},
		    {name: 'model_id',
		     value: model_id}
		],
		'pup_tent_js_libraries': [
		    // TODO load via npm
		    //'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.min.js',
    		    //'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular-route.min.js',
    		    //'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular-animate.min.js',
    		    //'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular-aria.min.js',
    		    //'https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular-touch.min.js',
    		    //'https://ajax.googleapis.com/ajax/libs/angular_material/0.8.3/angular-material.min.js',
		    //'/selectize.min.js',
		    //'/xeditable.min.js',
		    //'/bs-table.min.js',
		    //'/bbop-widget-solr-autocomplete.js',
		    '/deploy/js/NoctuaBasic/NoctuaBasicApp.js',
		    '/deploy/js/NoctuaBasic/NoctuaBasicController.js'
		],
		'pup_tent_css_libraries': [
		    '/css/NoctuaBasic.css',
		    '/selectize.css',
		    '/selectize.bootstrap3.css',
		    '/selectize.custom.css',
		    '/xeditable.css',
		    '/angular-material.css'
		    //'https://ajax.googleapis.com/ajax/libs/angular_material/0.8.3/angular-material.min.css'
		]
	    };
	    var ind = pup_tent.render('noctua_basic.tmpl',
				      tmpl_args,
				      'noctua_base_landing.tmpl');
	    self.standard_response(res, 200, 'text/html', ind);
	});

	// Routes for all static cache items.
	each(pup_tent.cached_list(), function(thing){

	    var ctype = mime.lookup(thing);

	    // This will skip cached templates.
	    if( ctype !== null ){
		self.app.get('/' + thing, function(req, res) {

		    res.setHeader('Content-Type', ctype);
		    res.send(pup_tent.get(thing) );
		});
	    }
	});

	// Fonts are special!
	self.app.use('/fonts', launcher_app.static('static/fonts'));

	// Other static routes.
	self.app.get('/images/waiting_ac.gif', function(req, res){
	    res.setHeader('Content-Type', 'image/gif');
	    // BUG/TODO: Hardcoded--likely need a pathname getter in pup_tent.
	    // Probably use _path_cache(key).
	    res.sendfile('static/waiting_ac.gif');
	});
	self.app.get('/images/ui-bg_flat_100_ffffff_40x100.png', function(req, res){
	    res.setHeader('Content-Type', 'image/png');
	    // BUG/TODO: See above.
	    res.sendfile('static/waiting_ac.gif');
	});
	// TODO: This obviously does not do anything than supress some types
	// of error messages.
	self.app.get('/favicon.ico', function(req, res){
	    self.standard_response(res, 200, 'image/x-icon', '');
	});

	///
	/// High-level status overview and heartbeat
	///

	self.app.get('/status', function(req, res) {

	    console.log('process heartbeat request');

	    var ret_obj = {
		'name': 'Noctua',
		'okay': true,
		'date': (new Date()).toJSON(),
		'location': self.frontend,
		'offerings': [
		    {
			'name': 'external_kicks',
			'value': monitor_external_kicks
		    },
		    {
			'name': 'internal_kicks',
			'value': monitor_internal_kicks
		    }
		]
	    };
	    var fin = JSON.stringify(ret_obj);

	    self.standard_response(res, 200, 'application/json', fin);
	});

	///
	/// Dynamic components/routes.
	///

	// Define the GOlr request conf.
	var gconf = new bbop_legacy.golr.conf(amigo.data.golr);

	// Directly kick-to-edit an extant model--most things should
	// pass through here.
	self.app.get('/editor/graph/:query', function(req, res) {

	    monitor_internal_kicks = monitor_internal_kicks + 1;

	    //console.log(req.route);
	    //console.log(req.route.params['query']);
	    var query = req.route.params['query'] || '';
	    if( ! query || query === '' ){
		// Catch error here if no proper ID.
		res.setHeader('Content-Type', 'text/html');
		res.send('no identifier');
	    }else{

		// Try and see if we have an API token.
		var barista_token = self.get_token(req);
		self.bootstrap_editor(req, res, query, null);
	    }
	});

	// Bring in all the detected workbenches.
	each(workbenches, function(wb){

	    // We know these are good.
	    var menu_name = wb['menu-name'];
	    var page_name = wb['page-name'];
	    var help_link = wb['help-link'];
	    var path_id = wb['path-id'];
	    var body_template = wb['body-template'];
	    var css_list = wb['css'];
	    var js_list = wb['javascript'];
	    var base_location = wb['base-location'];

	    self.app.get('/workbench/' + path_id +'/:query', function(req, res){

		monitor_internal_kicks = monitor_internal_kicks + 1;

		//console.log(req.route);
		//console.log(req.route.params['query']);
		var query = req.route.params['query'] || '';
		if( ! query || query === '' ){
		    // Catch error here if no proper ID.
		    res.setHeader('Content-Type', 'text/html');
		    res.send('no identifier');
		}else{
		    
		    // Make sure to map the plugin assets to the right
		    // location.
		    //var home = path_id + '/';
		    var home = base_location +'/' + path_id + '/';
		    var css_home = '/' + base_location +'/' + path_id + '/';
		    var js_home = '/deploy/'+ base_location +'/'+ path_id +'/';
		    var final_css = [];
		    each(css_list, function(css){
			final_css.push(css_home + css);
		    });
		    var final_js = [];
		    each(js_list, function(js){
			final_js.push(js_home + js);
		    });

		    var tmpl_args = self.standard_variable_load(
			'/workbench/' + path_id, page_name, req, query, null,
			{
			    'pup_tent_css_libraries': final_css,
			    'pup_tent_js_libraries': final_js,
			    'workbench_help_link': help_link
			});
		
		    // Render.
		    var ret = pup_tent.render(home + body_template,
					      tmpl_args,
					      'noctua_base_workbench.tmpl');
		    self.standard_response(res, 200, 'text/html', ret);
		}
	    });
	});
	
	// DEBUG: A JSON model debugging tool for @hdietze
	/// This path will eventually be destroyed.
	self.app.post('/seed/json', function(req, res) {

	    monitor_internal_kicks = monitor_internal_kicks + 1;

	    var jmod_str = req.body['json-model'] || '';
	    if( ! jmod_str || jmod_str === '' ){
		// Catch error here if no proper ID.
		res.setHeader('Content-Type', 'text/html');
		res.send('no json model');
	    }else{
		var jmod = JSON.parse(jmod_str); // to obj

		// No token, no editing, because this is crazy.
		self.bootstrap_editor(req, res, null, jmod);
	    }
	});

	// Try to bootstrap coming in from Capella. After the model is
	// confirmed generated, go through the usual model/seed path.
	self.app.get('/capella', function(req, res) {

	    // Let us know that we tried.
	    monitor_external_kicks = monitor_external_kicks + 1;

	    // Start working through what we have incoming.
	    var payload_str = req.query['bootstrap'] || null;
	    console.log('payload_str: ', payload_str);
	    var payload = JSON.parse(payload_str); // to obj

	    // Since we want to reuse the same templates, even on
	    // serious errors, we are going to get some setup done up
	    // front.
	    var tmpl_args = {
		'pup_tent_js_variables': [
		    {name: 'global_minerva_definition_name',
		     value: self.minerva_definition_name },
		    {name: 'global_barista_location',
		     value: self.barista_location },
		    {name: 'global_model',
		     value: null },
		    {name: 'global_barista_token',
		     value:  self.get_token(req) },
		    {name: 'global_payload',
		     value: payload }
		],
		'pup_tent_js_libraries': [
		    '/NoctuaCapella.js'
		],
		'title': notw + ': Capella'
		//'messaging_server_location': barista_loc
	    };

	    // Start possible outputs.
	    if( ! payload ){
		// Catch error here if no proper ID.
		tmpl_args.okay_p = false;
		tmpl_args.message = 'No proper bootstrap argument.';
		var ret = pup_tent.render('noctua_capella.tmpl', tmpl_args,
					  'noctua_base.tmpl');
		self.standard_response(res, 200, 'text/html', ret);
	    }else{

		console.log('payload: ', payload);

		// Collect the terms to resolve--we need the aspects
		// of the IDs to progress.
		var terms_to_resolve = [];
		each(payload, function(pi){
		    if( pi['terms'] ){
			terms_to_resolve = terms_to_resolve.concat(pi['terms']);
		    }
		});
		var qf_to_add = [];
		each(terms_to_resolve, function(ttr){
		    qf_to_add.push('annotation_class:"' + ttr + '"');
		});

		// Generic error return.
		var _generic_error_resp = function(resp, man){
		    res.setHeader('Content-Type', 'text/html');
		    res.send('failure (' + resp.message_type() + '): ' +
			     resp.message());
		};

		// Define the action to perform after we resolve our
		// terms.
		var action_after_resolution_call = function(resp, man){
		    console.log('in success callback');
		    if( ! resp.success() ){
			tmpl_args.okay_p = false;
			tmpl_args.message =
			    'Bad docs: "' + payload_str + '".';
			var ret = pup_tent.render('noctua_capella.tmpl',
						  tmpl_args, 'noctua_base.tmpl');
			self.standard_response(res, 200, 'text/html', ret);
		    }else{
			// console.log('in success callback else');

			// Map terms to aspect.
			var t2a = {};
			each(resp.documents(), function(d){
			    var ac = d['annotation_class'];
			    var s = d['source'];
			    if( ac && s ){ t2a[ac] = s; }
			});
			console.log('t2a: ', t2a);

			// Add some variable to signal the JS to make
			// the attempt to communicate with Minerva and
			// then forward.
			tmpl_args['pup_tent_js_variables'].push(
			    {name:'global_attempt_creation_p',
			     value: true });
			tmpl_args['pup_tent_js_variables'].push(
			    {name:'global_payload',
			     value: payload });
			tmpl_args['pup_tent_js_variables'].push(
			    {name:'global_term2aspect',
			     value: t2a });

			// Final template.
			tmpl_args.okay_p = true;
			tmpl_args.message = 'Trying to spin up a new model...';
			ret = pup_tent.render('noctua_capella.tmpl',
					      tmpl_args, 'noctua_base.tmpl');
			self.standard_response(res, 200, 'text/html', ret);
		    }
		};

		// Assemble query to get the desired minimal term
		// information; this information then goes into the
		// above callback, that then starts the model building
		// process.
		var m = new bbop_legacy.golr.manager.nodejs(golr_server_location,
							    gconf);
		m.add_query_filter('document_category', 'ontology_class');
		m.set_personality('ontology');
		m.register('search', 'foo', action_after_resolution_call);
		m.register('error', 'bar', _generic_error_resp);
		m.set('fq', qf_to_add.join(' OR '));
		// Apparently need score to make it "success".
		m.set('fl', 'id,annotation_class,source,score');
		m.search();
		console.log('resolve query: ', m.get_query_url());
	    }
	});

	// Test export handler.
	self.app.post('/action/display', function(req, res) {

	    // Deal with incoming parameters.
	    var mstr = req.query['thing'] ||
		    req.route.params['thing'] ||
		    req.body['thing'] ||
		    '???';
	    //console.log('display thing: ' + mstr);

	    // Assemble return doc.
	    //res.setHeader('Content-Type', 'text/owl');
	    res.setHeader('Content-Type', 'text/plain');
	    res.send(unescape(mstr));
	});
    };

    // Initializes the sample application.
    self.initialize = function(known_relations){

	self.known_relations = known_relations || [];

        // self.setupVariables();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };

    // Start the server (starts up the sample application).
    // Either in Heroku, Openshift, or various local.
    self.start = function() {
	if( self.IS_ENV_HEROKU ){
	    // Heroku seems to want a more minimal launch.
	    self.app.listen(self.port, function() {
		console.log('%s: Node started (heroku) on %s:%d ...',
			    Date(Date.now()), self.ipaddress||'???', self.port);
	    });
	}else{
            // Start the app on the specific interface (and port).
            self.app.listen(self.port, self.ipaddress, function() {
		console.log('%s: Node started (custom) on %s:%d ...',
			    Date(Date.now()), self.ipaddress, self.port);
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
var imngr = new bbop_legacy.rest.manager.node(barista_response);
imngr.register('success', 's1', function(resp, man){
    console.log('Continue boostrap: response is: ' + what_is(resp));
    //console.log('response', resp);
    var nrel = resp.relations().length;
    console.log("Continue bootstrap: got " + nrel + " relations, starting initializing sequence...");
    if( nrel > 0 ){
	noctua.initialize(resp.relations());
	noctua.start();
    }else{
	console.error('failure: no relations on initialization response');
    }
});
imngr.register('error', 'e1', function(resp, man){
    //console.log('erred out: %j', resp);
    //console.log(what_is(resp));
    //console.log(resp._raw);
    //console.log(resp.relations());
    console.log('okay?: %j', resp.okay());
    console.log('message type: %j', resp.message_type());
    console.log('message: %j', resp.message());
});

// Assemble initial request to get relations for bootstrap.
var reqs = new minerva_requests.request_set();
reqs.get_meta();
var t = noctua.barista_location + '/api/' + noctua.minerva_definition_name +
    '/m3Batch';
var astr = imngr.action(t, reqs.callable());
console.log("Started bootstrap: minerva request to: " + astr);
