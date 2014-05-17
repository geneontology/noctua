////
//// If I spin the server out into a different project, what's added
//// above the MME laucher/base and messenger client code is:
////
////  barista.js
////  static/messenger.html
////  node_modules/socket.io/
////
//// MSGPORT=3400 make start-barista
////

// Required shareable Node libs.
var mustache = require('mustache');
var fs = require('fs');
var url = require('url');
var querystring = require('querystring');

// Required add-on libs.
var bbop = require('bbop').bbop;
var amigo = require('amigo2').amigo;

// Aliases.
var each = bbop.core.each;
var what_is = bbop.core.what_is;
var is_defined = bbop.core.is_defined;

var notw = 'Barista';

///
/// User information/sessions/login.
///

var BaristaLauncher = function(){
    var self = this;

    ///
    /// Process CLI environmental variables.
    ///

    var msgport = 3400; // default val
    // This, while seemingly redundant, is necessary to get absolutely
    // the correct audience for Persona.
    var msgloc = 'http://localhost:' + msgport; // default val
    var m3loc = 'http://toaster.lbl.gov:6800'; // default val
    var msgdebug = 0; // default val
    if( process.env.MSGPORT ){
	msgport = process.env.MSGPORT;
	console.log('Barista server port taken from environment: ' + msgport);
    }else{
	console.log('Barista server port taken from default: ' + msgport);
    }
    if( process.env.MSGLOC ){
	msgloc = process.env.MSGLOC;
	console.log("Barista's Persona audience will be: " + msgloc);
    }else{
	console.log("Barista's Persona audience will default to: " + msgloc);
    }
    if( process.env.M3LOC ){
	m3loc = process.env.M3LOC;
	console.log('MMM server location taken from environment: ' + m3loc);
    }else{
	console.log('MMM server location taken from default: ' + m3loc);
    }
    if( process.env.MSGDEBUG ){
	msgdebug = process.env.MSGDEBUG;
	console.log('Barista debug level taken from environment: ' + msgdebug);
    }else{
	console.log('Barista debug level taken from default: ' + msgdebug);
    }

    ///
    /// Session/authorization handling.
    ///

    // Bring in metadata that will be used for 
    var ud_str = fs.readFileSync('./config/permissions.json');
    var user_metadata = JSON.parse(ud_str);

    // Colors.
    var ucolor_list = ['red', 'green', 'purple', 'blue', 'brown', 'black'];

    // BUG/TODO: Currently, Barista tokens do not expire. Need to
    // implement either: a new token every response or a a rolling time
    // window which is searched.
    // {day1: {SET2}, day2: {SET2}}
    var user_info_by_token = {};
    // BUG: this actuall needs to be a hash to list since a user may have
    // more than one sessions per email address.
    // Punting until I have the full structure figured out.
    var user_info_by_email = {};

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
    messaging_app.use(express.session({secret: 'notverysecret'}));
    // Must match client browser's address bar.
    var persona_opts = {
	// BUG/TODO: get that off of localhost--do detection like...the
	// search?
	audience: msgloc,
	verifyResponse: function(err, req, res, email){
	    if( user_metadata[email] ){

		// Adjust this client/server session.
		req.session.authorized = true;

		// Add to internal session system--generate the token and
		// attach it to user information.
		var token = bbop.core.randomness(20);
		var rci = Math.floor(Math.random() * ucolor_list.length);
		var color = ucolor_list[rci];
		var user_data = {
		    'email': email,
		    'color': color,
		    'token': token
		};
		user_info_by_token[token] = user_data;
		user_info_by_email[email] = user_data;

		console.log('login success (' + email + '): ' + token);
		//console.log('session: ', req.session);

		res.json({status: "okay", email: email,
			  token: token, color: color});
		return;
	    }
	    console.log('login fail; unknown email: ' + email);
	    res.json({status: "failure", reason: "not in permissions.json"});
	},
	logoutResponse: function(err, req, res) {
	    if (req.session.authorized) {

		// Adjust this client/server session.
		req.session.authorized = null;

		// Remove from internal session system.
		var email = req.session.email;
		var token = user_info_by_email[email];
		console.log('logging out (' + email + '): ' + token);
		// console.log('logging out (' + email + '): ' + token, ' ',
		// 	    req.session);

		// BUG/TODO: There two need to be replaced by an
		// object that can destroy all tokens related to an
		// email address.
		// delete user_info_by_email[email];
		// delete user_info_by_token[token];
	    }
	    console.log('logout success');
	    res.json({status: "okay"});
	}
    };
    require("express-persona")(messaging_app, persona_opts);

    // Server creation and socket.io addition.
    var messaging_server = require('http').createServer(messaging_app);
    var sio = require('socket.io').listen(messaging_server);
    messaging_server.listen(msgport);

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

    // TODO: Gross overview and your specifics if you provide a token.
    messaging_app.get(
	'/status',
	function(req, res) {

	    // Gather session info.
	    var sessions = [];
	    each(user_info_by_token, function(k,v){ sessions.push(v); });

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
    
    messaging_app.get(
	'/logout',
	function(req, res) {
	    
	    //console.log(req);
	    var in_token = null;
	    var barista_token = null;
	    if( req.query && req.query['barista_token'] ){
		in_token = req.query['barista_token'];
		
		// Try and retrieve the barista token.
		if( user_info_by_token[in_token] ){
		    barista_token = user_info_by_token[in_token];
		    
		    // If we have the barista token, destroy it.
		    delete user_info_by_token[in_token];
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
		// // 
		// if( tmpret && tmpret !== '' ){
		// 	var uo = url.parse(tmpret);
		// 	uo.query['barista_token'] = 
		// 	ret = 
		// }
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

    messaging_app.get(
    '/login',
    function(req, res) {

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

		      // TODO: A lot of authorization will happen
		      // around here.
		      // Try and get the barista_key out for use.
		      var uid = 'anonymous';
		      if( req && req['query'] && req['query']['token'] ){

			  // Best attempt at extracting a UID.
			  var btok = req['query']['token'];
			  var uinfo = user_info_by_token[btok];
			  if( uinfo ){
			      var email_bits =
				  bbop.core.first_split('@', uinfo['email']);
			      uid = email_bits[0] || 'anonymous';
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
		      // and add the uid.
		      var url_obj = url.parse(req.url);
		      var q_obj = querystring.parse(url_obj['query']);
		      delete q_obj['token'];
		      q_obj['uid'] = uid;
		      // The first works according to the docs, the
		      // second according to real life.
		      url_obj['query'] = querystring.encode(q_obj);
		      url_obj['search'] = '?' + querystring.encode(q_obj);
		      //console.log('q_obj: ', q_obj);
		      // Eliminate confounding fields to make sure it
		      // parses out the one we modified.
		      //delete url_obj['search'];
		      req.url = url.format(url_obj);

		      //console.log('req.url: ', req.url);
		      //console.log('post api req: ', req);
		      //console.log('uid: ' + uid);

		      // TODO: These two will eventually have to check
		      // in registries created at startup (from config
		      // file?).
		      var ns = req.route.params['namespace'] || '';
		      var call = req.route.params['call'] || '';
		      var ns_to_target ={
			'mmm': m3loc
		      };
		      var api_loc = ns_to_target[ns];
		      if( ! api_loc || ! call ){
			  // Catch error here if no proper ID.
			  res.setHeader('Content-Type', 'text/json');
			  res.send('{}');
		      }else{
			  // Route the simple call to the right place.
			  //console.log('req: ', req);
			  // Clip "/api/" and the namespace.
			  req.url = req.url.substr(ns.length + 5);
			  api_proxy.web(req, res, {
					    target: api_loc
					});
			  console.log('api run: ' + api_loc + req.url);
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
sio.set('log level', msgdebug);

// This would eventually be information delivered by the
// authentication system.
// TODO: This would disappear in a merged moderator system.
var client_sockets = {}; // essentially users
// TODO: The initial stash that a client gets for a channel when first
// connecting--essentially the recorded history to date.
//var channel_stash = {};

sio.sockets.on('connection',
	       function(socket){

		   // Add this client to the socket list.
		   // Store for injection.
		   var socket_id = socket.id;
		   var rci = Math.floor(Math.random() * ucolor_list.length);
		   client_sockets[socket_id] = {
		       'uid': socket_id,
		       'ucolor': ucolor_list[rci]
		   };
		   var user_id = client_sockets[socket_id]['uid'];
		   var user_color = client_sockets[socket_id]['ucolor'];

		   // Immediately emit user meta-information to the
		   // just-connected user.
		   var init_data = {
		       'user_metadata': true,
		       'user_id': user_id,
		       'user_color': user_color
		   };
		   socket.emit('intialization', init_data);

		   // Relays.
		   socket.on('info',
			     function(data){
				 //console.log('srv info: %j', data);

				 // Inject user data.
				 data['user_id'] = user_id;
				 data['user_color'] = user_color;
				 socket.broadcast.emit('info', data);
			     });

		   socket.on('clairvoyance',
			     function(data){
				 //console.log('srv remove: ' + data);
				 data['user_id'] = user_id;
				 data['user_color'] = user_color;
				 socket.broadcast.emit('clairvoyance', data);
			     });

		   socket.on('telekinesis',
			     function(data){
				 //console.log('srv remove: ' + data);
				 data['user_id'] = user_id;
				 data['user_color'] = user_color;
				 socket.broadcast.emit('telekinesis', data);
			     });

		   // Disconnect info.
		   socket.on('disconnect',
			     function(){
				 console.log('srv disconnect');

				 // TODO: find a way to report disconnecting
				 // from a specific model--might have to wait
				 // for using channels.
				 // // Broadcast the disconnection.
				 // var data = {
				 //     type: 'disconnect',
				 //     message: 'disconnect from server'
				 // };
				 // data['user_id'] = user_id;
				 // data['user_color'] = user_color;
				 // socket.broadcast.emit('info', data);
				 
				 // Remove from the pack.
				 delete client_sockets[socket_id];
			     });
	       });
};

// 
var barista = new BaristaLauncher();
