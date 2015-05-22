////
//// If I spin the server out into a different project, what's added
//// above the MME laucher/base and messenger client code is:
////
////  barista.js
////  static/messenger.html
////  node_modules/socket.io/
////
//// BARISTA_PORT=3400 make start-barista
////

// Required shareable Node libs.
var mustache = require('mustache');
var fs = require('fs');
var url = require('url');
var querystring = require('querystring');
var crypto = require('crypto');
var cors = require('cors');

// Required add-on libs.
var bbop = require('bbop');
var bbopx = require('bbopx');
var amigo = require('amigo2');

// Aliases.
var each = bbop.core.each;
var what_is = bbop.core.what_is;
var is_defined = bbop.core.is_defined;
var clone =  bbop.core.clone;

var notw = 'Barista';

///
/// REs to compile once.
///

// Recognize jQuery JSONP and extract payload.
var jsonp_re = /^jQuery[\d\_]+\((.*)\)$/;

// Cached static routes.
var js_re = /\.js$/;
var css_re = /\.css$/;
var html_re = /\.html$/;

///
/// ModelCubby: per-model message caching management.
///

var ModelCubby = function(){
    var self = this;

    // All data here.
    var cubby = {};

    /*
     * Function: dropoff
     *
     * returns true if new, false if update
     *
     * Parameters: 
     *  model - model id
     *  namespace - namespace
     *  key - key
     *  value - value
     *
     * Returns: 
     *  boolean
     */ 
    self.dropoff = function(model, namespace, key, value){

	var ret = null;

	// Ensure existence of entities.
	if( typeof(cubby[model]) === 'undefined' ){
	    cubby[model] = {};
	}
	if( typeof(cubby[model][namespace]) === 'undefined' ){
	    cubby[model][namespace] = {};
	}

	// Decide the return type.
	if( typeof(cubby[model][namespace][key]) === 'undefined' ){
	    ret = true;
	}else{
	    ret = false;
	}

	// Add to data bundle.
	cubby[model][namespace][key] = value;
	//console.log('cubby dropoff: '+ key + ', ', value);
	
	return ret;
    };

    /*
     * returns hash for specified namespace
     */    
    self.pickup = function(model, namespace){
	var ret = {};

	// Give non-empty answer only if defined.
	//console.log('data: ', cubby);
	if( typeof(cubby[model]) !== 'undefined' &&
	    typeof(cubby[model][namespace]) !== 'undefined' ){
	    ret = cubby[model][namespace];
	}

	return ret;
    };

    /*
     * number: count of models known to cubby
     */
    self.model_count = function(){

	var ret = Object.keys(cubby).length;

	return ret;
    };

    /*
     * number: count of namespaces in a model known to cubby
     */
    self.namespace_count = function(model){
	var ret = 0;

	if( typeof(cubby[model]) !== 'undefined' ){
	    ret = Object.keys(cubby[model]).length;
	}

	return ret;
    };

    /*
     * number: count of keys in a namespaces in a model known to cubby
     */
    self.key_count = function(model, namespace){
	var ret = 0;

	if( typeof(cubby[model]) !== 'undefined' &&
	    typeof(cubby[model][namespace]) !== 'undefined' ){
	    ret = Object.keys(cubby[model][namespace]).length;
	}
	
	return ret;
    };
};

///
/// Backend application authorization monitor.
///

var AppGuard = function(app_list){
    var self = this;

    // Assemble easy-to-access information for all of the apps behind
    // Barista.
    var app_by_namespace = {};
    each(app_list,
	 function(a){
	     
	     var aid = a['id'];
	     app_by_namespace[aid] = {
		 "target": a['target'],
		 "public": a['public']
	     };
	     
	     each(a['public'],
		  function(p){
		      app_by_namespace[aid]['public'][p] = true;
		  });
	 });
    
    /*
     * true or false.
     */
    self.has_app = function(namespace){
	var ret = false;

	if( app_by_namespace[namespace] ){
	    ret = true;
	}
	
	return ret;
    };

    /*
     * string or null.
     */
    self.app_target = function(namespace){
	var ret = null;

	if( app_by_namespace[namespace] ){
	    ret = app_by_namespace[namespace]['target'];
	}
	
	return ret;
    };

    /*
     * true or false.
     */
    self.is_public = function(namespace, path){
	var ret = false;

	if( self.has_app(namespace) ){
	    if( app_by_namespace[namespace]['public'][path] ){
		ret = true;
	    }
	}

	return ret;
    };

};

///
/// User information/sessions/login.
///

// BUG/TODO: Currently, Barista tokens do not expire. Need to
// implement either: a new token every response or a a rolling time
// window which is searched.
// {day1: {SET2}, day2: {SET2}}
var Sessioner = function(auth_list){
    var self = this;

    // Generate a new token.
    function get_token(){
	var token = bbop.core.randomness(20);
	return token;
    }

    // Colors.
    function get_color(){
	var ucolor_list = ['red', 'green', 'purple', 'blue', 'brown', 'black'];
	var rci = Math.floor(Math.random() * ucolor_list.length);
	var color = ucolor_list[rci];
	return color;
    }

    // Strings to md5.
    function str2md5(str){
	var shasum = crypto.createHash('md5');
	shasum.update(str);
	var ret = shasum.digest('hex');
	return ret;
    }

    // User information is statically stored by various keys. To
    // become a sessions, it is aggregated over in sessions_by_token.
    var uinf_by_md5 = {};
    //var uinf_by_email = {};
    //var uinf_by_socket = {}; // will have to be built as we go
    each(auth_list, function(a){
	// There are a list of valid emails, so hash for them all.
	var valid_em5_list = a['email-md5'];
	each(valid_em5_list, function(em5){
	    uinf_by_md5[em5] = a;
	});
    });

    // At the end, all sessions are keyed by the referring token.
    var sessions_by_token = {};
    // This is tied to the session.
    var email2token = {};

    /*
     * Failure is an unknown, unauthorized, or ill-formed user.
     */
    self.authorize_by_email = function(email){
	var ret = false;

	// Our requirements are: email (by md5 proxy), uri, and
	// "minerva-go" authorization (empty is fine).
	var emd5 = str2md5(email);
	var uinf = uinf_by_md5[emd5];
	if( uinf ){
	    if( uinf['uri'] &&
		uinf['authorizations'] &&
		uinf['authorizations']['minerva-go'] ){
		    ret = true;
		}
	}

	return ret;
    };
    
    // Internal function to actually create the used session
    // structure.
    function _gel_session(email, token, nickname, uri){

	// Create new session.
	var emd5 = str2md5(email);
	var color = get_color(); // random color
	sessions_by_token[token] = {
	    'nickname': nickname,
	    'uri': uri,
	    'email': email,
	    'email-md5': emd5,
	    'token': token,
	    'color': color
	};
	email2token[email] = token;
	
	// Clone for return.
	var ret = clone(sessions_by_token[token]);
	
	return ret;
    }

    /*
     * Will not clobber if a session exists--just return what's there.
     * Cloned object or null.
     */
    // TODO: Session lifespan: every time a new session is created,
    // clear out old sessions.
    self.create_session_by_email = function(email){
	var ret = null;

	if( ! self.authorize_by_email(email) ){
	    // Cannot--likely bad info or unauthorized.
	}else{

	    // Get available user information.
	    var emd5 = str2md5(email);
	    var uinf = uinf_by_md5[emd5];
	    var new_nick = uinf['nickname'] || '???';
	    var new_uri = uinf['uri'];

	    // Generate a new token.
	    var new_token = get_token();

	    // Gel and clone for return.
	    return _gel_session(email, new_token, new_nick, new_uri);
	}

	return ret;
    };

    /*
     * Add a bogus session for testing--dangerous!
     */
    self.create_bogus_session = function(email, token, nickname, uri){
	return _gel_session(email, token, nickname, uri);
    };

    /*
     * Cloned object or null.
     */
    self.get_session_by_email = function(email){
	var token = email2token[email];
	var ret = self.get_session_by_token(token);
	return ret;
    };

    /*
     * Cloned objects or empty list.
     */
    self.get_sessions = function(){

	var ret = [];
	
	each(sessions_by_token,
	     function(token, session){
		 ret.push(clone(session));
	     });

	return ret;
    };

    /*
     * Cloned object or null.
     */
    self.get_session_by_token = function(token){
	var ret = null;

	if( token ){
	    var sess =  sessions_by_token[token];
	    if( sess ){
		ret = clone(sess);
	    }
	}

	return ret;
    };

    /*
     * True or false.
     */
    self.delete_session_by_email = function(email){
	var ret = null;
	
	var token = email2token[email];
	if( token ){
	    delete sessions_by_token[token];
	    delete email2token[email];
	    ret = true;
	}

	return ret;
    };

    /*
     * True or false.
     */
    self.delete_session_by_token = function(token){
	var ret = false;

	if( sessions_by_token[token] ){
	    var email = sessions_by_token[token]['email'];
	    delete email2token[email];
	    delete sessions_by_token[token];
	    ret = true;
	}
	
	return ret;
    };
};

///
/// Session/authorization handling.
///

// Bring in metadata that will be used for identifying
// user. Spin-up session manager.
var auth_str = fs.readFileSync('./config/users.json');
var auth_list = JSON.parse(auth_str);
var sessioner = new Sessioner(auth_list);

// BUG/TODO/DEBUG: create an always user so I don't go crazy when
// reloading Barista during experiments..
// Will need to go at some point, or be more subtle.
sessioner.create_bogus_session('spam@genkisugi.net', '123', 'kltm', 'GOC:kltm');

// Bring in metadata that will be used for identifying
// application protections. Spin-up app manager.
var app_str = fs.readFileSync('./config/app.json');
var app_list = JSON.parse(app_str);
var app_guard = new AppGuard(app_list);

// Start the model cubby.
var cubby = new ModelCubby();

///
/// Main.
///
var BaristaLauncher = function(){
    var self = this;

    // Monitor some stats.
    var monitor_messages = 0;
    var monitor_calls = 0;
    
    ///
    /// Process CLI environmental variables.
    ///

    var runport = 3400; // default val
    // This, while seemingly redundant, is necessary to get absolutely
    // the correct audience for Persona.
    var runloc = 'http://localhost:' + runport; // default val
    var barista_debug = 0; // default val
    if( process.env.BARISTA_PORT ){
	runport = process.env.BARISTA_PORT;
	console.log('Barista server port taken from environment: ' + runport);
    }else{
	console.log('Barista server port taken from default: ' + runport);
    }
    if( process.env.BARISTA_LOCATION ){
	runloc = process.env.BARISTA_LOCATION;
	console.log("Barista's Persona audience will be: " + runloc);
    }else{
	console.log("Barista's Persona audience will default to: " + runloc);
    }
    if( process.env.BARISTA_DEBUG ){
	barista_debug = process.env.BARISTA_DEBUG;
	console.log('Barista debug level taken from env: ' + barista_debug);
    }else{
	console.log('Barista debug level taken from default: ' + barista_debug);
    }

    ///
    /// Response helper.
    ///

    function _standard_response(res, code, type, body){
	res.setHeader('Content-Type', type);
	res.setHeader('Content-Length', body.length);
	res.end(body);
	return res;
    };

    ///
    /// Cache and template rendering.
    ///

    var ppaths = ['static', 'deploy', 'deploy/js', 'css', 'templates'];
    var pup_tent = require('pup-tent')(ppaths);
    pup_tent.use_cache_p(false);

    // Ready the common libs (the actually mapping is taken care of
    // later on).
    pup_tent.set_common('css_libs', [
	'/bootstrap.min.css',
	'/jquery-ui-1.10.3.custom.min.css',
	'/bbop.css',
	'/amigo.css']);
    pup_tent.set_common('js_libs', [
	'/jquery.js',
	'/bootstrap.min.js',
	'/jquery-ui-1.10.3.custom.min.js']);
	// //'/commonjs-runtime.js']);
	// '/bbop.js',
	// '/bbopx.js',
	// '/amigo2.js']);

    // Spin up the main messenging server.
    var express = require('express');
    var messaging_app = express();
    // 
    //messaging_app.use(express.logger());
    //messaging_app.use(express.static(__dirname));
    messaging_app.use(express.json());
    messaging_app.use(express.urlencoded());
    messaging_app.use(express.cookieParser());
    messaging_app.use(cors());
    messaging_app.use(express.session({secret: 'notverysecret'}));
    // Must match client browser's address bar.
    var persona_opts = {
	audience: runloc,

	// Internal function to run if remote login was susseccful or
	// a session remains open.
	verifyResponse: function(err, req, res, email){

	    console.log('user has authenticated through persona: ' + email);

	    // First, we need to establish a session. Check if this
	    // email address already has a session associated with
	    // it. If so, don't bother creating a new one.
	    var sess = sessioner.get_session_by_email(email);
	    if( sess ){
		console.log('recovered session: ', sess);
	    }else{
		// Not already there, so let's see if we can create
		// one from scratch.
		sess = sessioner.create_session_by_email(email);
		if( sess ){
		    // Create new user session.
		    console.log('created new session: ', sess);
		}else{
		    // Cannot create, so some kind of authorization
		    // issue.
		    console.log('login fail; unknown/unauthorized user: '+email);
		    res.json({status: "failure",
			      email: email,
			      reason:"unknown/unauthorized (check users.json)"});
		    return; // WARNING: out-of-flow return
		}
	    }

	    console.log('session success (' + sess.email + '): ' + sess.token);

	    // Adjust this client/server session.
	    req.session.authorized = true;
		
	    // Pass back the interesting bits to the 
	    res.json({status: "okay",
		      email: sess.email,
		      nickname: sess.nickname,
		      uri: sess.uri,
		      token: sess.token,
		      color: sess.color});
	    return; // return success
	},

	// Code to run when the user has or is logged out.
	logoutResponse: function(err, req, res) {

	    // Destroy as much of the session information as we can.
	    var did_something_p = false;
	    if( req && req.session ){

		// Looks still authorized?
		if( req.session.authorized ){
		    // Adjust this client/server session.
		    req.session.authorized = null;
		    console.log('logout: nulled authorization');
		    did_something_p = true;
		}

		// Recoverable email.
		if( req.session.email ){
		    var sess = sessioner.get_session_by_email(email);
		    var email = req.session.email;
		    var token = sess.token;

		    // Remove from internal session system.
		    sessioner.delete_session_by_email(email);

		    console.log('logout: Barista delete ('+ email +'): '+ token);
		    did_something_p = true;
		}
	    }

	    if( ! did_something_p ){
		console.log('logout: nothing to do');
	    }

	    // We did what we could, get out of here.
	    console.log('logout: success');
	    res.json({status: "okay"});
	}
    };
    require("express-persona")(messaging_app, persona_opts);

    // Server creation and socket.io addition.
    var messaging_server = require('http').createServer(messaging_app);
    var sio = require('socket.io').listen(messaging_server);
    messaging_server.listen(runport);

    ///
    /// Cached static routes.
    ///

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
		 messaging_app.get('/' + thing, 
				   function(req, res) {
				       res.setHeader('Content-Type', ctype);
				       res.send(pup_tent.get(thing) );
				   });
	     }
	 });

    ///
    /// High-level status overview and hearbeat
    ///

    // General use--no need for a&a.
    messaging_app.get('/status', function(req, res) {

	console.log('process heartbeat request');

	var monitor_sessions = sessioner.get_sessions().length;

	var ret_obj = {
	    'okay': true,
	    'name': 'Barista',
	    'date': (new Date()).toJSON(),
	    'location': runloc,
	    'offerings': [
		{
		    'name': 'sessions',
		    'value': monitor_sessions
		},
		{
		    'name': 'calls',
		    'calls': monitor_calls
		},
		{
		    'name': 'messages',
		    'messages': monitor_messages
		}
	    ]
	};
	var fin = JSON.stringify(ret_obj);

	_standard_response(res, 200, 'application/json', fin);
    });

    ///
    /// Authentication and Authorization.
    ///

    var SESS_NO_TOKEN = -1;
    var SESS_BAD_TOKEN = -2;
    var SESS_GOOD = 1;

    // Check to see if we have access to the good stuff. Tri-state.
    function _session_status(req){

	var ret = null;

	var sess = null;
	if( req.query && req.query['barista_token'] ){
	    // Capture token.
	    var barista_token = req.query['barista_token'];
	    
	    // Try and retrieve by the barista token.
	    sess = sessioner.get_session_by_token(barista_token);
	    if( sess ){
		ret = SESS_GOOD;
		console.log('barista session token: ' + barista_token);
	    }else{
		ret = SESS_BAD_TOKEN;
		console.log('non-session (old/bad?) token, ignore: ' +
			    barista_token);
	    }
	}else{
	    ret = SESS_NO_TOKEN;
	    console.log('no token');
	}

	return ret;
    }

    // Gross overview of current users.
    messaging_app.get('/user_info', function(req, res) {
	
	// Check to see if we have access to the good stuff.
	var show_all_p = false;
	var sess_stat = _session_status(req);
	if( sess_stat == SESS_GOOD ){
	    show_all_p = true;
	}

	// Gather all session info.
	var sessions = sessioner.get_sessions();
	
	// Variables, render, and output.
	var tmpl_args = {
	    'show_all_p': show_all_p,
	    'barista_sessions': sessions,
	    'title': notw + ': Status'
	};
	var out = pup_tent.render('barista_status.tmpl',
				  tmpl_args,
				  'barista_base.tmpl');
	_standard_response(res, 200, 'text/html', out);
    });
    
    // REST service that 
    messaging_app.get('/user_info_by_token/:token', function(req, res) {
	
	// Do we have permissions to make the call?
	var token = req.route.params['token'] || null;
	var sess = sessioner.get_session_by_token(token);

	var ret_obj = {};
	
	// Gather session info.
	if( sess && token ){
	    ret_obj = sessioner.get_session_by_token(token);
	}

	// 
	var fin = JSON.stringify(ret_obj);
	console.log('got user info for: ', fin['uri']);
	_standard_response(res, 200, 'application/json', fin);
    });
    
    messaging_app.get('/session', function(req, res) {

	// Get return argument (originating URL) if there.
	var ret = null;
	if( req.query && req.query['return'] ){
	    ret = req.query['return'];
	}
	
	var tmpl_args = {
	    'pup_tent_js_variables': [
		{'name': 'global_barista_return', 'value': ret }
	    ],
	    'pup_tent_js_libraries': [
		'https://login.persona.org/include.js',
		'/BaristaSession.js'
	    ],
	    'title': notw + ': Session Manager',
	    'return': ret
	};
	var out = pup_tent.render('barista_session.tmpl',
				  tmpl_args,
				  'barista_base.tmpl');
	_standard_response(res, 200, 'text/html', out);
    });

    ///
    /// API proxy.
    ///

    var http_proxy = require('http-proxy');
    var api_proxy = http_proxy.createProxyServer({});
    messaging_app.get("/api/:namespace/:call", function(req, res){ 

	// TODO: Request logging hooks could be placed in here.
	//console.log('pre api req: ' + req.url);
	monitor_calls = monitor_calls +1;

	// Try and get a session out for use. The important thing we
	// need here is the uri to pass back to the API if session
	// and possible.
	var uuri = null;
	var has_token_p = false;
	var has_sess_p = false;
	if( req && req['query'] && req['query']['token'] ){
	    // Best attempt at extracting a UID.
	    has_token_p = true;
	    var btok = req['query']['token'];
	    var sess = sessioner.get_session_by_token(btok);
	    if( sess ){
		console.log('call using session: ', sess);
		uuri = sess.uri;
		has_sess_p = true;
	    }
	}

	// // TODO: Create a doctored request.
	// // Either way, no token goes back.
	// each(['query', 'body', 'params'],
	// 	   function(field){
	// 	       if( req[field] && req[field]['token'] ){
	// 		   delete req[field]['token'];
	// 		   req[field]['uid'] = uid;
	// 	       }
	// 	   });
	// //req.url = req.url + '&uid=' + uid;

	// Extract token=??? from the request URL safely
	// and add the uri as uid.
	var url_obj = url.parse(req.url);
	var q_obj = querystring.parse(url_obj['query']);
	delete q_obj['token'];
	q_obj['uid'] = uuri; // may be null
	// The first works according to the docs, the
	// second according to real life.
	url_obj['query'] = querystring.encode(q_obj);
	url_obj['search'] = '?' + querystring.encode(q_obj);
	//console.log('q_obj: ', q_obj);
	// Eliminate confounding fields to make sure it
	// parses out the one we modified.
	//delete url_obj['search'];
	req.url = url.format(url_obj);

	// Do we have permissions to make the call?
	var ns = req.route.params['namespace'] || '';
	var call = req.route.params['call'] || '';
	if( ! app_guard.is_public(ns, call) && ! uuri ){
	    console.log('blocking call: ' + req.url);
	    
	    var error_msg = 'sproing!';
	    if( has_token_p && ! has_sess_p ){
		error_msg = 'You are using a bad token; please remove it.';
	    }else{
		error_msg = 'You do not have permission for this operation.';
	    }

	    // Catch error here if no proper ID on non-public.
	    res.setHeader('Content-Type', 'text/json');
	    var eresp = {
		message_type: 'error',
		message: error_msg
	    };
	    var eresp_str = JSON.stringify(eresp);

	    // This was requested as AJAX, not CORS, so need to
	    // assemble it for the return.
	    if( req && req['query'] && req['query']['json.wrf'] ){
		var envelope = req['query']['json.wrf'];
		eresp_str = envelope + '(' + eresp_str + ');';
	    }

	    //var eresp = new bbopx.barista.response(eresp_seed);
	    console.log('inject response: ', eresp_str);
	    res.send(eresp_str);
	}else{
	    // Not public or user is privileged.
	    // Route the simple call to the right place.
	    //console.log('req: ', req);
	    // Clip "/api/" and the namespace.
	    var api_loc = app_guard.app_target(ns);
	    req.url = req.url.substr(ns.length + 5);
	    api_proxy.web(req, res, {
		'target': api_loc
	    });
	    console.log('api xlate: ' + api_loc + req.url);
	}
    });

    // TODO: Pass certain types of responses to /all/ listening
    // clients. (TODO: eventually, just the ones on the model
    // channel.)
    api_proxy.on('proxyRes', function (proxyRes, req, res) {

	// Unfortunately, we do not have access to the completed
	// response, so we have to assemble it ourselves.
	var chunks = [];
	proxyRes.on('data', function(chunk){
    	    //var util = require('util');
	    var jsonp_partial = chunk.toString();
	    chunks.push(jsonp_partial);
	});
	// When we got it all, assemble it, remove the jQuery JSONP
	// wrapper
	proxyRes.on('end', function(){

	    var jsonp = chunks.join('');

	    // NOTE: Assuming either jQuery JSONP action JSON via CORS
	    // or similar.
	    // "jQuery1910009816080028417162_1412824223034(.*);"
	    //console.log('match: ', jsonp);
	    var match = jsonp.match(jsonp_re);
	    if( ! match || ! match.length == 2 ){
		//console.log('response: n/a');
	    }else{
		//console.log('response: ', match[1]);
		jsonp = match[1];
	    }

	    // Now what should we do with the JSON? Check it.
	    var response_okay_p = true;
	    var resp = null;
	    try{
		//console.log(jsonp);
		var resp_json = JSON.parse(jsonp);
		resp = new bbopx.barista.response(resp_json);
	    }catch(e){
		response_okay_p = false;
		console.log("unparsable response!");
	    }

	    // Emit to all listeners--cannot target all but call since
	    // this was not done over messaging in the first place
	    // (api proxy).
	    // For filtering, there is a unique ID from Minerva so
	    // that they can block messages they've heard
	    // before--similar to the current model filtering. Ish.
	    if( response_okay_p && resp && resp.okay() && resp.model_id() ){
		if( resp.intention() !== 'action' ){
		    console.log("Skip broadcast of message (non-action).");
		}else if( resp.signal() === 'merge' ){
		    console.log("Broadcast merge.");
		    sio.sockets.emit('relay', {'class': 'merge',
					       'model_id': resp.model_id(),
					       'packet_id': resp.packet_id(),
					       'data': resp.raw()});
		}else if( resp.signal() === 'rebuild' ){
		    console.log("Broadcast rebuild.");
		    sio.sockets.emit('relay', {'class': 'rebuild',
					       'model_id': resp.model_id(),
					       'packet_id': resp.packet_id(),
					       'data': resp.raw()});
		}else{
		    console.log("Skip broadcast of message (different signal).");
		}
	    }
	});
    });

    // Not everything in life has happy endings. I've run into cases
    // where the ontologies slow minerva down enough that I get an
    // error thrown reporting: "Error: socket hang up".
    api_proxy.on('error', function (error, req, res) {
	// Report...
	console.log('We have problem! Maybe a timeout error against Minerva?', 
		    error);
	// ..then handle.
	// TODO: Wait until we have more experience with this before
	// we handle--obviously only the originating users needs to
	// know.
	// var resp = new bbopx.barista.response({});
	// resp.message_type('error');
	// resp.message('We have problem! Maybe a timeout error against Minerva?');
	// 	    sio.sockets.emit('relay', {'class': 'rebuild',
	// 				       'model_id': resp.model_id(),
	// 				       'packet_id': resp.packet_id(),
	// 				       'data': resp.raw()});
    });

    ///
    /// Everything here on down is Socket.IO messaging works.
    ///

    // This is the main socket.io hook.
    //messaging_app.get('/messenger', function (req, res) {
    messaging_app.get('/', function (req, res) {
	res.sendfile(__dirname + '/static/messenger.html');
    });

    // TODO: Turn on recommended production settings when in production.
    // https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO#wiki-recommended-production-settings
    sio.enable('browser client minification');
    sio.enable('browser client etag');
    sio.enable('browser client gzip');
    sio.set('log level', barista_debug);

    // This would eventually be information delivered by the
    // authentication system.
    // TODO: This would disappear in a merged moderator system.
    //    var client_sockets = {}; // essentially users
    // TODO: The initial stash that a client gets for a channel when first
    // connecting--essentially the recorded history to date.
    //var channel_stash = {};

    sio.sockets.on('connection', function(socket){

	// Store for injection.
	var socket_id = socket.id;

	// Add session identification information where available.
	function _is_logged_in_p(data){
	    var ret = false;

	    var in_token = data['token'];
	    //console.log('messenger data: ', data);
	    var sess = sessioner.get_session_by_token(in_token);
	    if( sess ){
		ret = true;
	    }
	    
	    return ret;
	}

	// Add session identification information where available.
	function _mod_data_with_session_info(data){
	    
	    var user_name = '???';
	    var user_email = '???';
	    var user_color = 'white';
	    
	    // If possibles, the info packet can tie us to the
	    // information via the passed token.
	    if( ! data ){
		data = {};
	    }else{

		// Try and jimmy the info out of the data stream and
		// connect it to the session.
		var in_token = data['token'];
		var sess = sessioner.get_session_by_token(in_token);
		if( sess ){
		    user_name = sess['nickname'];
		    user_email = sess['email'];
		    user_color = sess['color'];
		}
	    
		// Inject user data into data.
		//data['user_id'] = user_id;
		data['user_name'] = user_name;
		data['user_email'] = user_email;
		data['user_color'] = user_color;
	    }
	    
	    // Can always add socket id.
	    data['socket_id'] = socket_id;

	    return data;
	}

	// Initial data--just-connected user. This is very very
	// minimal since we don't know anything without a session.
	var init_data = _mod_data_with_session_info(null);
	socket.emit('initialization', init_data);

	//
	socket.on('relay', function(data){
	    //console.log('srv tele: ' + data);
	    monitor_messages = monitor_messages +1;

	    // Only really get involved if the user is logged in.
	    if( _is_logged_in_p(data) ){
		// Relay the actions of logged-in users.
		data = _mod_data_with_session_info(data);
		socket.broadcast.emit('relay', data);
		
		// Skim object location and update cubby layout
		// information when screen items are moving via
		// telekinesis by logged-in users.
		//console.log('relay: ', data);
		if( data['class'] === 'telekinesis' ){
		    var mid = data['model_id'];
		    var obs = data['objects'];
		    if( typeof(mid) !== 'undefined' && 
			typeof(obs) === 'object' ){
			    each(obs, function(ob){
				var iid = ob['item_id'];
				var itop = ob['top'];
				var ileft = ob['left'];
				if( typeof(iid) !== 'undefined' &&
				    typeof(itop) !== 'undefined' &&
				    typeof(ileft) !== 'undefined' ){
					cubby.dropoff(mid, 'layout', iid,
						      {'top': itop,
						       'left': ileft});
					// console.log('cubby m: ',
					// 	    cubby.model_count());
					// console.log('cubby ns: ',
					// 	    cubby.namespace_count(mid));
					// console.log('cubby ks: ',
					// 	    cubby.key_count(mid,
					//          'layout'));
				    }
			    });
			}
		}
	    }
	});
	
	//
	socket.on('query', function(data){
	    //console.log('srv tele: ' + data);
	    monitor_messages = monitor_messages +1;

	    // TODO: Respond to client query.
	    // Pong it back.
	    //console.log('PROCESSING', socket_id);
	    //console.log('PROCESSING', socket);
	    // Send message back to just the sending client.
	    // TODO: I feel there has to be a better way of doing this.
	    if( sio.sockets.sockets[socket_id] ){

		// Check that we have a good looking packet.
		var dq = data['query'];
		var mid = data['model_id'];
		if( dq && mid ){

		    // Give the current layout information from cubby.
		    if( dq === 'layout' ){

			// Inject response.
			data['response'] = cubby.pickup(mid, 'layout');

			// Send back.
			sio.sockets.sockets[socket_id].emit('query', data);
			console.log('respond to query from ' +
				    socket_id);// + ' with:', data);
		    }
		}
	    }
	});
	
	// Disconnect info.
	socket.on('disconnect', function(){
	    console.log('srv disconnect');
	    // TODO: find a way to report disconnecting from a
	    // specific model or user--might have to wait for using
	    // channels.
	    // // Broadcast the disconnection.
	    // var data = {
	    //     type: 'disconnect',
	    //     message: 'disconnect from server'
	    // };
	    // data['user_id'] = user_id;
	    // data['user_color'] = user_color;
	    // socket.broadcast.emit('info', data);
	});
    });
};

// 
var barista = new BaristaLauncher();
