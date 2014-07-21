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
var bbop = require('bbop').bbop;
var amigo = require('amigo2').amigo;

// Aliases.
var each = bbop.core.each;
var what_is = bbop.core.what_is;
var is_defined = bbop.core.is_defined;
var clone =  bbop.core.clone;

var notw = 'Barista';

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
    each(auth_list,
	 function(a){
	     //uinf_by_email[a['email']] = a;
	     uinf_by_md5[a['email-md5']] = a;
	     //uinf_by_socket[a['email-md5']] = a;
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

	// Our requirements are: email (by md5 proxy), xref, and
	// "minerva-go" authorization (empty is fine).
	var emd5 = str2md5(email);
	var uinf = uinf_by_md5[emd5];
	if( uinf ){
	    if( uinf['xref'] &&
		uinf['authorizations'] &&
		uinf['authorizations']['minerva-go'] ){
		    ret = true;
		}
	}

	return ret;
    };
    
    // Internal function to actually create the used session
    // structure.
    function _gel_session(email, token, nickname, xref){

	// Create new session.
	var emd5 = str2md5(email);
	var color = get_color(); // random color
	sessions_by_token[token] = {
	    'nickname': nickname,
	    'xref': xref,
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
	    // Cannot.
	}else{

	    // Get available user information.
	    var emd5 = str2md5(email);
	    var uinf = uinf_by_md5[emd5];
	    var new_nick = uinf['nickname'] || '???';
	    var new_xref = uinf['xref'];

	    // Generate a new token.
	    var new_token = get_token();

	    // Gel and clone for return.
	    return _gel_session(email, new_token, new_nick, new_xref);
	    // ret = clone(sessions_by_token[new_token]);
	}

	return ret;
    };

    /*
     * Add a bogus session for testing--dangerous!
     */
    self.create_bogus_session = function(email, token, nickname, xref){
	return _gel_session(email, token, nickname, xref);
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
var auth_str = fs.readFileSync('./config/auth.json');
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

///
/// Main.
///
var BaristaLauncher = function(){
    var self = this;

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

    var pt = require('./js/pup-tent.js');
    var pup_tent = pt(
	[   // Req CSS.
	    'bootstrap.min.css',
	    'jquery-ui-1.10.3.custom.min.css',
	    'bbop.css',
	    'amigo.css',
	    // Req JS.
	    'jquery-1.9.1.min.js',
	    'bootstrap.min.js',
	    'jquery-ui-1.10.3.custom.min.js',
	    'jquery.tablesorter.min.js',
	    'bbop.js',
	    'amigo2.js',
	    // Page apps.
	    'BaristaLogout.js',
	    'BaristaLogin.js',
	    // Base.
	    'barista_base.tmpl',
	    // Pages.
	    'barista_status.tmpl',
	    'barista_logout.tmpl',
	    'barista_login.tmpl'
	], ['static', 'js', 'css', 'templates']);

    // Ready the common libs (the actually mapping is taken care of
    // later on).
    pup_tent.set_common('css_libs', [
	'/bootstrap.min.css',
	'/jquery-ui-1.10.3.custom.min.css',
	'/bbop.css',
	'/amigo.css']);
    pup_tent.set_common('js_libs', [
	'/jquery-1.9.1.min.js',
	'/bootstrap.min.js',
	'/jquery-ui-1.10.3.custom.min.js',
	'/bbop.js',
	'/amigo2.js']);

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
	// BUG/TODO: get that off of localhost--do detection like...the
	// search?
	audience: runloc,
	verifyResponse: function(err, req, res, email){

	    // Can get session?
	    var sess = sessioner.create_session_by_email(email);
	    console.log('sess: ', sess);
	    if( ! sess ){
		console.log('login fail; unknown/ill-formed user: ' + email);
		res.json({status: "failure", reason: "not in/bad auth.json?"});
	    }else{

		// Adjust this client/server session.
		req.session.authorized = true;
		
		console.log('login success (' + sess.email + '): ' + sess.token);
		//console.log('session: ', req.session);

		// Pass back the interesting bits.
		res.json({status: "okay",
			  email: sess.email,
			  nickname: sess.nickname,
			  xref: sess.xref,
			  token: sess.token,
			  color: sess.color});
		return; // return success
	    }
	},
	logoutResponse: function(err, req, res) {
	    if (req.session.authorized) {

		// Adjust this client/server session.
		req.session.authorized = null;

		// Remove from internal session system.
		var email = req.session.email;
		var sess = sessioner.get_session_by_email(email);
		var token = sess.token;
		console.log('logging out (' + email + '): ' + token);
		// console.log('logging out (' + email + '): ' + token, ' ',
		// 	    req.session);

		sessioner.delete_session_by_email(email);
	    }
	    console.log('logout success');
	    res.json({status: "okay"});
	}
    };
    require("express-persona")(messaging_app, persona_opts);

    // Server creation and socket.io addition.
    var messaging_server = require('http').createServer(messaging_app);
    var sio = require('socket.io').listen(messaging_server);
    messaging_server.listen(runport);

    ///
    /// TODO: High-level status overview and hearbeat
    ///

    // messaging_app.get(
    //     '/status',
    //     function(req, res) {

    ///
    /// Cached static routes.
    ///

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
		 messaging_app.get('/' + thing, 
				   function(req, res) {
				       res.setHeader('Content-Type', ctype);
				       res.send(pup_tent.get(thing) );
				   });
	     }
	 });

    ///
    /// Authentication and Authorization.
    ///

    // Gross overview of current users.
    messaging_app.get('/status', function(req, res) {
	
	// Gather session info.
	var sessions = sessioner.get_sessions();
	
	// Variables, render, and output.
	var tmpl_args = {
	    'barista_sessions': sessions,
	    'title': notw + ': Status'
	};
	var out = pup_tent.render_io('barista_base.tmpl',
				     'barista_status.tmpl',
				     tmpl_args);
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
	console.log('got user info for: ', fin['xref']);
	_standard_response(res, 200, 'application/json', fin);
    });
    
    messaging_app.get('/logout', function(req, res) {
	    
	//console.log(req);
	var in_token = null;
	var barista_token = null;
	if( req.query && req.query['barista_token'] ){
	    // Capture token.
	    in_token = req.query['barista_token'];
	    
	    // Try and retrieve by the barista token.
	    var sess = sessioner.get_session_by_token(in_token);
	    if( sess ){
		// If we have it, destroy it.
		sessioner.delete_session_by_token(in_token);
		console.log('barista token destroyed: ' + barista_token);
	    }else{
		console.log('non-session token: ' + in_token);
	    }
	}else{
	    console.log('no token');
	}	
	
	// Get return argument if there.
	var ret = null;
	if( req.query && req.query['return'] ){
	    ret = req.query['return'];
	}
	
	// Render what we did, and launch Logout.js to purge the
	// cookie session (that is frankly unrelated to what we're
	// doing).
	var tmpl_args = {
	    'pup_tent_js_variables': [
		{name: 'global_barista_token', value: barista_token},
		{name: 'global_barista_return', value: ret}
	    ],
	    'pup_tent_js_libraries': [
		'https://login.persona.org/include.js',
		'/BaristaLogout.js'
	    ],
	    'in_token': in_token,
	    'barista_token': barista_token,
	    'return': ret,
	    'title': notw + ': Logout'
	};
	var out = pup_tent.render_io('barista_base.tmpl',
				     'barista_logout.tmpl',
				     tmpl_args);
	_standard_response(res, 200, 'text/html', out);
    });
    
    messaging_app.get('/login',	function(req, res) {

	// Get return argument if there.
	var ret = null;
	if( req.query && req.query['return'] ){
	    ret = req.query['return'];
	    // // 
	    // if( tmpret && tmpret !== '' ){
	    // 	var uo = url.parse(tmpret);
	    // 	uo.query['barista_token'] = 
	    // 	ret = 
	    // }
	}
	
	var tmpl_args = {
	    'pup_tent_js_variables': [
		{'name': 'global_barista_return', 'value': ret }
	    ],
	    'pup_tent_js_libraries': [
		'https://login.persona.org/include.js',
		'/BaristaLogin.js'
	    ],
	    'title': notw + ': Login',
	    'return': ret
	};
	var out = pup_tent.render_io('barista_base.tmpl',
				     'barista_login.tmpl',
				     tmpl_args);
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

	// Try and get a session out for use. The important thing we
	// need here is the xref to pass back to the API if session
	// and possible.
	var uxref = null;
	if( req && req['query'] && req['query']['token'] ){
	    // Best attempt at extracting a UID.
	    var btok = req['query']['token'];
	    var sess = sessioner.get_session_by_token(btok);
	    if( sess ){
		console.log('sess: ', sess);
		uxref = sess.xref;
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
	// and add the xref as uid.
	var url_obj = url.parse(req.url);
	var q_obj = querystring.parse(url_obj['query']);
	delete q_obj['token'];
	q_obj['uid'] = uxref; // may be null
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
	if( ! app_guard.is_public(ns, call) && ! uxref ){
	    console.log('blocking call: ' + req.url);

	    // Catch error here if no proper ID on non-public.
	    res.setHeader('Content-Type', 'text/json');
	    // TODO/BUG: Send better fail.
	    res.send('{}');
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

	// // Relays to others that new user is on and ties
	// // socket and token.
	// socket.on('info', function(data){
	//     //console.log('srv info: %j', data);
	//     if( _is_logged_in_p(data) ){
	// 	data = _mod_data_with_session_info(data);
	// 	socket.broadcast.emit('info', data);
	//     }
	// });
	
	// socket.on('clairvoyance', function(data){
	//     //console.log('srv clair: ' + data);
	//     if( _is_logged_in_p(data) ){
	// 	data = _mod_data_with_session_info(data);
	// 	socket.broadcast.emit('clairvoyance', data);
	//     }
	// });

	// // TODO: This needs to be blocked on auth issues.
	// socket.on('telekinesis', function(data){
	//     //console.log('srv tele: ' + data);
	//     if( _is_logged_in_p(data) ){
	// 	data = _mod_data_with_session_info(data);
	// 	socket.broadcast.emit('telekinesis', data);
	//     }
	// });
	
	//
	socket.on('relay', function(data){
	    //console.log('srv tele: ' + data);

	    // Only really get involved if the user is logged in.
	    if( _is_logged_in_p(data) ){
		data = _mod_data_with_session_info(data);
		socket.broadcast.emit('relay', data);
		
		// TODO: Update board.
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
