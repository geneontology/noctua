////
//// If I spin the server out into a different project, what's added
//// above the MME laucher/base and messenger client code is:
////
////  barista.js
////  static/messenger.html
////  node_modules/socket.io/
////
//// : node barista.js --self http://localhost:3400
////

// Required shareable Node libs.
var mustache = require('mustache');
var fs = require('fs');
var yaml = require('yamljs');
var url = require('url');
var us = require('underscore');
var querystring = require('querystring');
var crypto = require('crypto');

var url = require('url');
var vantage = require('vantage')();

// Required add-on libs.
var bbop = require('bbop');
//var bbopx = require('bbopx');
var amigo = require('amigo2');
var bar_response = require('bbop-response-barista');

// We will require our own http client for proxying POST requests with
// modifications.
var http = require('http');

///
/// Helpers.
///

function ll(arg1){
    console.log('barista [' + (new Date()).toJSON() + ']: ', arg1); 
}

function _die(message){
    console.error('BARISTA [' + (new Date()).toJSON() + ']: ' + message);
    process.exit(-1);
}

// Aliases.
var each = bbop.core.each;
var what_is = bbop.core.what_is;
var is_defined = bbop.core.is_defined;
var clone =  bbop.core.clone;

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
/// CLI arguments and runtime environment.
///

var notw = 'Barista';

// CLI handling.
var argv = require('minimist')(process.argv.slice(2));

// Where the world thinks Barista is.
var publoc = argv['p'] || argv['public'] || 'http://localhost:3400';
ll('Barista location (public/persona): ' + publoc);

// Where Barista thinks it is in the world.
var runloc = argv['s'] || argv['self'] || 'http://localhost:3400';
ll('Barista location (self): ' + runloc);
var u = url.parse(runloc);
var runport = u.port || 80; // be expicit about ports

// Pull in and keyify the contributor information.
var user_fname = argv['u'] || argv['users'];
if( ! user_fname ){
    _die('Option (u|users) is required.');

    // Make sure extant, etc.
    var fstats = fs.statSync(user_fname);
    if( ! fstats.isFile() ){
	_die('Option (u|users) is not a file: ' + user_fname);
    }
}else{
    ll('Will pull user info from: ' + user_fname);
}

// Pull in and keyify the group information.
var group_fname = argv['g'] || argv['groups'];
if( ! group_fname ){
    _die('Option (g|groups) is required.');

    // Make sure extant, etc.
    var gstats = fs.statSync(group_fname);
    if( ! gstats.isFile() ){
	_die('Option (g|groups) is not a file: ' + group_fname);
    }
}else{
    ll('Will pull group info from: ' + group_fname);
}

// See if we want to use the (for now) optional barista context.
var barista_context = argv['c'] || argv['context'] || 'go';
if( barista_context ){
    ll('Barista operate as in context: "' + barista_context + '"');
}else{
    ll('Barista will try to operate without context.');
}

// Try and see if we run the optional repl port.
var barista_repl_port = null;
var barista_repl_port_raw = argv['r'] || argv['repl'] || null;
if( barista_repl_port_raw ){
    var raw_port = parseInt(barista_repl_port_raw);
    if( raw_port && isNaN(raw_port) === false ){
	barista_repl_port = raw_port;
	ll('Barista REPL will listen (locally) at: ' + barista_repl_port);
    }else{
	ll('Unable to parse Bariata REPL: ' + barista_repl_port_raw);
    }
}else{
    ll('Barista will not run REPL.');
}

// Debug level barista_debug
var barista_debug = argv['d'] || argv['debug'] || 0;
if( barista_debug ){ barista_debug = parseInt(barista_debug); }
ll('Barista debug level: ' + barista_debug);

if (barista_debug > 0) {
	// Execute this before require('socket.io')
	// Alternatively, set DEBUG='socket.io:*' via the shell environment.
	process.env['DEBUG'] = process.env['DEBUG'] + ' xsocket.io:*';
}

// Define bogus users.
var rand_user_token = bbop.core.randomness(4);
ll('Anonymous editor token: ' + rand_user_token);
var bogus_users = [
    {
	email: 'spam@genkisugi.net',
	token: '123',
	nickname: 'kltm (editor)',
	uri: 'GOC:kltm',
	'user-type': 'allow-edit'
    },
    {
	email: 'spam@genkisugi.net',
	token: '000',
	nickname: 'kltm (admin)',
	uri: 'GOC:kltm',
	'user-type': 'allow-admin'
    },
    // Create a random bogus user for this barista run.
    {
	email: 'anonymous@localhost',
	token: rand_user_token,
	nickname: 'anonymous',
	uri: 'TEMP:anonymous', 
	'user-type': 'allow-edit'
    }
];

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
	//ll('cubby dropoff: '+ key + ', ', value);
	
	return ret;
    };

    /*
     * returns hash for specified namespace
     */    
    self.pickup = function(model, namespace){
	var ret = {};

	// Give non-empty answer only if defined.
	//ll('data: ', cubby);
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
// implement either: a new token every response or rolling time window
// which is searched.
// {day1: {SET2}, day2: {SET2}}
var Sessioner = function(auth_list, group_list){
    var self = this;

    // NOTE: Order is important here--the later privs override earlier
    // ones.
    var known_user_types = [
	'allow-edit', // can edit models
	'allow-admin' // has powers
    ];
    
    var ucolor_list = [
	'red', 'green', 'purple', 'blue', 'brown', 'black', 'orange'
    ];

    // Hashify the contents of the group listing for later lookup.
    var group_info = {};
    us.each(group_list, function(group){
	if( us.isString(group['id']) && us.isString(group['label']) ){
	    group_info[group['id']] = group;
	}
    });

    // Generate a new token.
    function get_token(){
	var token = bbop.core.randomness(20);
	return token;
    }

    // Colors.
    function get_color(){
	var rci = Math.floor(Math.random() * ucolor_list.length);
	var color = ucolor_list[rci];
	return color;
    }

    // Strings to md5.
    // NOTE/TODO: Legacy after Persona switch.
    function str2md5(str){
	var shasum = crypto.createHash('md5');
	shasum.update(str);
	var ret = shasum.digest('hex');
	return ret;
    }

    // User information is statically stored by various keys. To
    // become a sessions, it is aggregated over in sessions_by_token.
    var uinf_by_md5 = {}; // NOTE/TODO: Legacy after Persona switch.
    var uinf_by_uri = {};
    //var uinf_by_socket = {}; // will have to be built as we go
    each(auth_list, function(auth_line){

	var a = us.clone(auth_line);

	// While we're here, cycle through and toss out any unknown
	// groups. Let's start with nuking all the groups in the
	// clone, then working back.
	a['groups'] = [];
	if( us.isArray(auth_line['groups']) ){
	    us.each(auth_line['groups'], function(group_id){
		if( group_info[group_id] ){
		    a['groups'].push(group_info[group_id]);
		}else{
		    console.log('Skipping unknown group in users: ' + group_id +
				' for ' + a['uri']);
		}
	    });
	}

	// Also, let's at least ensure that "accounts" is at least
	// defined as a hash.
	if( ! us.isObject(a['accounts']) ){
	    a['accounts'] = {};
	}
	
	// There are a list of valid emails, so hash for them all.
	var valid_em5_list = a['email-md5'];
	each(valid_em5_list, function(em5){
	    uinf_by_md5[em5] = a;
	});
	
	// Just the URI.
	uinf_by_uri[a['uri']] = a;

	//console.log(a);
    });

    // At the end, all sessions are keyed by the referring token.
    var sessions_by_token = {};
    // Maps that we need to manage tied to the session.
    var email2token = {}; // NOTE/TODO: Legacy after Persona switch.
    var uri2token = {};

    /*
     * Failure is an unknown, unauthorized, or ill-formed user. If no
     * user_type is listed, assume the lowest ranked one for the
     * attempt.
     * NOTE/TODO: Legacy after Persona switch.
     */
    self.authorize_by_email = function(email, user_type){
	var ret = false;
	
	// If no user_type is listed, assume the lowest ranked one for
	// the attempt.
	if( ! us.isString(user_type) ){
	    user_type = known_user_types[0];
	}
	
	// Our requirements are: email (by md5 proxy), uri, and
	// "noctua/go" authorization (empty is fine).
	var emd5 = str2md5(email);
	var uinf = uinf_by_md5[emd5];
	if( uinf ){
	    // Check the user credentials against what we had in the
	    // users' file for our specific context.
	    if( uinf['uri'] &&
		uinf['authorizations'] &&
		uinf['authorizations']['noctua'] &&
		uinf['authorizations']['noctua'][barista_context] &&
		uinf['authorizations']['noctua'][barista_context][user_type] ){
		ret = true;
	    // Legacy checking.
	    // TODO: Remove this and just leave the templated
	    // context-sensitive checking above.
	    }else if( uinf['uri'] &&
		      uinf['authorizations'] &&
		      uinf['authorizations']['noctua-go'] &&
		      uinf['authorizations']['noctua-go'][user_type] ){
		      ret = true;
	    }
	}
	
	return ret;
    };
    
    /*
     * Failure is an unknown, unauthorized, or ill-formed user. If no
     * user_type is listed, assume the lowest ranked one for the
     * attempt.
     */
    self.authorize_by_uri = function(uri, user_type){
	var ret = false;

	// If no user_type is listed, assume the lowest ranked one for
	// the attempt.
	if( ! us.isString(user_type) ){
	    user_type = known_user_types[0];
	}

	// Our requirements are: uri and "noctua/go" authorization
	// (empty is fine).
	var uinf = uinf_by_uri[uri];
	if( uinf ){
	    // Check the user credentials against what we had in the
	    // users' file for our specific context.
	    if( uinf['uri'] &&
		uinf['authorizations'] &&
		uinf['authorizations']['noctua'] &&
		uinf['authorizations']['noctua'][barista_context] &&
		uinf['authorizations']['noctua'][barista_context][user_type] ){
		ret = true;
	    // Legacy checking.
	    // TODO: Remove this and just leave the templated
	    // context-sensitive checking above.
	    }else if( uinf['uri'] &&
		      uinf['authorizations'] &&
		      uinf['authorizations']['noctua-go'] &&
		      uinf['authorizations']['noctua-go'][user_type] ){
		      ret = true;
	    }
	}
	
	return ret;
    };
    
    // Internal function to actually create the used session
    // structure.
    // NOTE/TODO: Can safely remove email stuff after Persona switch.
    function _gel_session(token, uri, user_type,
			  nickname, groups, accounts, email){

	// token and uri are super critical.
	if( ! us.isString(token) ){
	    throw new Error('bad user token');
	}
	if( ! us.isString(uri) ){
	    throw new Error('bad user uri');
	}

	// Double check user type.
	if( ! us.contains(known_user_types, user_type) ){
	    throw new Error('unknown user type: ' + user_type);
	}

	// Well, name is unimportant technically if we have the uri.
	console.log(nickname);
	if( ! us.isString(nickname) ){
	    nickname = '???';
	}
	
	// Groups and accounts, while not required, will be empty.
	var sess_groups = [];
	if( us.isArray(groups) ){
	    sess_groups = groups;
	}
	var sess_accounts = {};
	if( us.isObject(accounts) ){
	    sess_accounts = accounts;
	}
	
	// Email/md5 is now optional: moving to a post-Persona
	// universe.
	var emd5 = null;
	if( email ){
	    emd5 = str2md5(email);
	}else{
	    email = null;
	}

	// Color is random.
	var color = get_color();

	// Create new session.
	sessions_by_token[token] = {
	    'token': token,
	    'uri': uri,
	    'user-type': user_type, // this will be the highest rank available
	    'color': color,
	    'nickname': nickname,
	    'groups': sess_groups,
	    'accounts': sess_accounts,
	    'email': email,
	    'email-md5': emd5
	};
	email2token[email] = token;
	uri2token[uri] = token;
	
	// Clone for return.
	var ret = clone(sessions_by_token[token]);
	
	return ret;
    }

    /*
     * Will not clobber if a session exists--just return what's there.
     * Cloned object or null.
     */
    // NOTE/TODO: Legacy after Persona switch.
    // TODO: Session lifespan: every time a new session is created,
    // clear out old sessions.
    self.create_session_by_email = function(email){

	// Cycle through to see what kind of user we have.
	var user_type = null;
	us.each(known_user_types, function(try_user_type){
	    if( self.authorize_by_email(email, try_user_type) ){
		user_type = try_user_type;
	    }
	});

	var ret = null;
	if( ! user_type ){
	    // Cannot--likely bad info or unauthorized.
	}else{

	    // Get available user information.
	    var emd5 = str2md5(email);
	    var uinf = uinf_by_md5[emd5];
	    var new_uri = uinf['uri'];
	    var new_nick = uinf['nickname'] || '???';
	    var new_groups = uinf['groups'] || [];
	    var new_accounts = uinf['accounts'] || {};
	    
	    // Generate a new token.
	    var new_token = get_token();

	    // Gel and clone for return.
	    return _gel_session(new_token, new_uri, user_type,
				new_nick, new_groups, new_accounts, email);
	}

	return ret;
    };

    /*
     * Will not clobber if a session exists--just return what's there.
     * Cloned object or null.
     */
    // TODO: Session lifespan: every time a new session is created,
    // clear out old sessions.
    self.create_session_by_uri = function(uri){

	// Cycle through to see what kind of user we have.
	var user_type = null;
	us.each(known_user_types, function(try_user_type){
	    if( self.authorize_by_uri(uri, try_user_type) ){
		user_type = try_user_type;
	    }
	});

	var ret = null;
	if( ! user_type ){
	    // Cannot--likely bad info or unauthorized.
	}else{

	    // Get available user information.
	    var uinf = uinf_by_uri[uri];
	    var new_uri = uinf['uri'];
	    var new_nick = uinf['nickname'] || '???';
	    var new_email = uinf['email'] || null;
	    var new_groups = uinf['groups'] || [];
	    var new_accounts = uinf['accounts'] || {};
	    
	    // Generate a new token.
	    var new_token = get_token();

	    // Gel and clone for return.
	    return _gel_session(new_token, new_uri, user_type,
				new_nick, new_groups, new_accounts, new_email);
	}

	return ret;
    };

    /*
     * Add a bogus session for testing--dangerous!
     */
    self.create_bogus_session = function(token, uri, user_type,
					 nickname, groups, accounts, email){
	return _gel_session(token, uri, user_type,
			    nickname, groups, accounts, email);
    };

    /*
     * Cloned object or null.
     * NOTE/TODO: Legacy after Persona switch.
     */
    self.get_session_by_email = function(email){
    	var token = email2token[email];
    	var ret = self.get_session_by_token(token);
    	return ret;
    };

    /*
     * Cloned object or null.
     */
    self.get_session_by_uri = function(uri){
    	var token = uri2token[uri];
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
		 console.log(session);
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
    self.delete_session_by_token = function(token){
	var ret = false;

	if( sessions_by_token[token] ){
	    // Email deletion.
	    // NOTE/TODO: Legacy after Persona switch.
	    var email = sessions_by_token[token]['email'];
	    delete email2token[email];
	    // URI deletion.
	    var uri = sessions_by_token[token]['uri'];
	    delete uri2token[uri];
	    // Session deletion.
	    delete sessions_by_token[token];

	    ret = true;
	}
	
	return ret;
    };

    /*
     * True or false.
     * NOTE/TODO: Legacy after Persona switch.
     */
    self.delete_session_by_email = function(email){
    	var token = email2token[email];
	return self.delete_session_by_token(token);
    };

    /*
     * True or false.
     */
    self.delete_session_by_uri = function(uri){
	var token = uri2token[uri];	
	return self.delete_session_by_token(token);
    };
};

///
/// Session/authorization handling.
///

// Bring in metadata that will be used for identifying user. Spin-up
// session manager. Written as separate function to make the REPL easier
function _setup_sessioner(fname, gname){

    var auth_list = yaml.load(fname);
    var group_list = yaml.load(gname);

    var new_sessioner = new Sessioner(auth_list, group_list);

    // Bring on the listed bogus user sessions.
    us.each(bogus_users, function(bu){
	new_sessioner.create_bogus_session(
	    bu['token'],
	    bu['uri'],
	    bu['user-type'],
	    bu['nickname'],
	    [],
	    {},
	    bu['email']);
    });

    return new_sessioner;
}
var sessioner = _setup_sessioner(user_fname, group_fname);

// Bring in metadata that will be used for identifying
// application protections. Spin-up app manager.
var sconf = yaml.load('./startup.yaml');
var app_defs = sconf['APP_DEFINITIONS'].value;
if( ! app_defs || us.isEmpty(app_defs) ){
    _die();
}
var app_guard = new AppGuard(sconf['APP_DEFINITIONS'].value);

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
    var monitor_last_op = {};

    ///
    /// Setup a REPL system first--we'll be running the app out of
    /// here.
    ///

    // Wee helper.
    function rlog(context, out){
	context.log(out);
	ll(out);
    }

    // Optional REPL setup.
    if( barista_repl_port ){

	//var pmt = 'barista@'+socket.remoteAddress+':'+socket.remotePort +'> ';
	vantage.delimiter('barista@' + ':');

	// Not my problem, not my use case--try and get rid of it.
	var vnt_cmd = vantage.find('vantage');
	if( vnt_cmd ){ 
	    vnt_cmd.hidden();
	    vnt_cmd.remove();
	}
	
	// Reset.
	var rld_cmd = vantage.command('reset [user_filename] [group_filename]');
	rld_cmd.description("Reset using a specified file for the Sessioner, defaults to initial files.");
	rld_cmd.action(function(args, cb){
	    var fname = args.user_filename || user_fname;
	    var gname = args.group_filename || group_fname;
	    
	    var new_sessioner = null;
	    try {
		new_sessioner = _setup_sessioner(fname, gname);
	    }catch(e){
		rlog(this, 'Failed to load: ' + fname + ' or ' + gname);
	    }
	    
	    if( new_sessioner ){
		sessioner = new_sessioner;
		rlog(this, '(Re)loaded: ' + fname);
	    }
	    
	    cb();
	});

	// Refresh.
	var rfr_cmd =
		vantage.command('refresh [user_filename] [group_filename]');
	rfr_cmd.description("Refresh using a specified file for the Sessioner, defaults to initial files.");
	rfr_cmd.action(function(args, cb){
	    var fname = args.user_filename || user_fname;
	    var gname = args.group_filename || group_fname;
	    
	    var current_sessions = sessioner.get_sessions();

	    var new_sessioner = null;
	    try {
		new_sessioner = _setup_sessioner(fname, gname);
	    }catch(e){
		rlog(this, 'Failed to load: ' + fname + ' or ' + gname);
	    }
	    
	    if( new_sessioner ){

		us.each(current_sessions, function(cs){
		    new_sessioner.create_bogus_session(
			cs['token'],
			cs['uri'],
			cs['user-type'],
			cs['nickname'],
			[],
			{},
			cs['email']);
		});

		sessioner = new_sessioner;
		rlog(this, '(Re)loaded: ' + fname);
	    }
	    
	    cb();
	});

	// Setup bogus session.
	var bog_cmd = vantage.command('bogus [token] [uri] [user_type] [name] [email]');
	bog_cmd.description("Create a temporary bogus session; use with caution as this bad data can be saved. User types are 'allow-edit' and 'allow-admin'. No groups or accounts are current possible.");
	bog_cmd.action(function(args, cb){
	    // Required.
	    var token = args.token;
	    var uri = args.uri;
	    var user_type = args.user_type;
	    // Optional.
	    var name = args.name || '???';
	    var email = args.email;
	    
	    if( ! token || ! uri || ! user_type ){
		rlog(this, 'Cannot create bogus session with given info.' );
	    }else{
		sessioner.create_bogus_session(token, uri, user_type,
					       name, [], {}, email);
		rlog(this, 'Created bogus session with given info.' );
	    }
	    
	    cb();
	});
	
	var get_cmd = vantage.command('list');
	get_cmd.description("List all current sessions.");
	get_cmd.action(function(args, cb){
	    
	    var all_sess = sessioner.get_sessions();
	    rlog(this, all_sess);
	    
	    cb();
	});
	
	var delt_cmd = vantage.command('delete token [token]');
	delt_cmd.description("Delete a session by token.");
	delt_cmd.action(function(args, cb){
	    var token = args.token;
	    if( token ){
		var tf = sessioner.delete_session_by_token(token);
		rlog(this, 'Deleted session by token: ' + tf);
	    }
	    cb();
	});
	
	var dele_cmd = vantage.command('delete email [email]');
	dele_cmd.description("Delete a session by email address.");
	dele_cmd.action(function(args, cb){
	    var email = args.email;
	    if( email ){
		var tf = sessioner.delete_session_by_email(email);
		rlog(this, 'Deleted session by email: ' + tf);
	    }	
	    cb();
	});
	
	// // Veeery basic auth, just to keep the riff-raff out.
	// // BUG: Although in the docs, this does not seem to
	// // yet be supported...
	// vantage.auth("basic", {
	// 	"users": [
	// 	    {user: "kltm", pass:"123"}
	// 	],
	// 	"retry": 3,
	// 	"retryTime": 500,
	// 	"deny": 1,
	// 	"unlockTime": 3000
	// });
	
	// Can only be invoked after "listen", so we're down here.
	// NOTE/TODO: May want to add configurable firewall stuff later.
	// https://github.com/dthree/vantage/blob/master/examples/server/server.js
	vantage.listen(barista_repl_port);
	vantage.firewall.policy('REJECT');
	vantage.firewall.accept(
		['127', '0', '0', '1'].join('.')); // here
	vantage.firewall.accept(
		['192', '168', '0', '0'].join('.'), 16); // home/local
	vantage.firewall.accept(
		['131', '243', '0', '0'].join('.'), 16); // lbl-bbop	
    }

    ///
    /// Response helpers.
    ///

    function _get_token(req){
	var ret = null;
	if( req && req.query && req.query['barista_token'] ){
	    ret = req.query['barista_token'];
	}
	return ret;
    }

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

    function _standard_response(res, code, type, body){
	res.setHeader('Content-Type', type);
	res.setHeader('Content-Length', body.length);
	res.end(body);
	return res;
    }

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
	'jquery.dataTables.min.css',
	'/bbop.css',
	'/amigo.css']);
    pup_tent.set_common('js_libs', [
	'/jquery.min.js',
	'/bootstrap.min.js',
	'/jquery-ui-1.10.3.custom.min.js',
	'jquery.dataTables.min.js']);
	// //'/commonjs-runtime.js']);
	// '/bbop.js',
	// '/bbopx.js',
	// '/amigo2.js']);


    // Spin up the main messenging server.
    // http://expressjs.com/en/guide/migrating-4.html
    var express = require('express');
    var messaging_app = express();

    var errorHandler = require('errorhandler');
    messaging_app.use(errorHandler());

    var morgan = require('morgan');
    messaging_app.use(morgan('dev'));

    var cookieParser = require('cookie-parser');
    messaging_app.use(cookieParser());  // Must be placed after more specific route defs

	var cors = require('cors');
    messaging_app.use(cors());

    messaging_app.set('port', runport);

    // https://github.com/expressjs/session#options
    var session = require('express-session');
    var session_options = {
    	secret: 'notverysecret',
    	resave: false,
    	saveUninitialized: false
    };
    messaging_app.use(session(session_options));

    // Must match client browser's address bar.
    var persona_opts = {
	audience: publoc,

	// Internal function to run if remote login was susseccful or
	// a session remains open.
	verifyResponse: function(err, req, res, email){

	    ll('user has authenticated through persona: ' + email);

	    // First, we need to establish a session. Check if this
	    // email address already has a session associated with
	    // it. If so, don't bother creating a new one.
	    var sess = sessioner.get_session_by_email(email);
	    if( sess ){
		ll('recovered session:');
		ll(sess);
	    }else{
		// Not already there, so let's see if we can create
		// one from scratch.
		sess = sessioner.create_session_by_email(email);
		if( sess ){
		    // Create new user session.
		    ll('created new session:');
		    ll(sess);
		}else{
		    // Cannot create, so some kind of authorization
		    // issue.
		    ll('login fail; unknown/unauthorized user: ' + email);
		    res.json({status: "failure",
			      email: email,
			      reason:"unknown/unauthorized (check users.json)"});
		    return; // WARNING: out-of-flow return
		}
	    }

	    ll('session success (' + sess.email + '): ' + sess.token);

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
		    ll('logout: nulled authorization');
		    did_something_p = true;
		}

		// Recoverable email.
		if( req.session.email ){
		    var sess = sessioner.get_session_by_email(email);
		    var email = req.session.email;
		    var token = sess.token;

		    // Remove from internal session system.
		    sessioner.delete_session_by_email(email);

		    ll('logout: Barista delete ('+ email +'): '+ token);
		    did_something_p = true;
		}
	    }

	    if( ! did_something_p ){
		ll('logout: nothing to do');
	    }

	    // We did what we could, get out of here.
	    ll('logout: success');
	    res.json({status: "okay"});
	}
    };
    var express_persona = require('express-persona');
    express_persona(messaging_app, persona_opts);


    // Middleware that defines routes should be here, so that more-specific
    // route defs above have priority

    // Server creation and socket.io addition.
    var messaging_server = http.createServer(messaging_app);

    // This initial require() of socket.io respects the process.env
    // variable DEBUG (see the processing of the barista_debug value above).
    //
    var socketio = require('socket.io');
    var sio = socketio.listen(messaging_server);
    // Run app server through vantage to get vantage goodies.
    messaging_server.listen(messaging_app.get('port'), function(){
      console.log('Express server listening on port ' + messaging_app.get('port'));
    });

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
		 messaging_app.get('/' + thing, function(req, res) {
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

	ll('process heartbeat request');

	var monitor_sessions = sessioner.get_sessions().length;

	var ret_obj = {
	    'okay': true,
	    'name': 'Barista',
	    'date': (new Date()).toJSON(),
	    'location': runloc,
	    'public': publoc,
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
		// ,
		// {
		//     'name': 'last',
		//     'messages': monitor_last_op
		// }
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
    var SESS_BAD_USER_TYPE = -3;
    var SESS_GOOD_EDIT = 1;
    var SESS_GOOD_ADMIN = 2;

    // Check to see if we have access to the good stuff. Multi-state.
    function _session_status(req){

	var ret = null;

	var sess = null;
	if( req.query && req.query['barista_token'] ){
	    // Capture token.
	    var barista_token = req.query['barista_token'];
	    
	    // Try and retrieve by the barista token.
	    sess = sessioner.get_session_by_token(barista_token);
	    if( sess ){
		if( sess['user-type'] === 'allow-edit' ){
		    ret = SESS_GOOD_EDIT;
		    ll('barista session token (edit): ' + barista_token);
		}else if( sess['user-type'] === 'allow-admin' ){
		    ret = SESS_GOOD_ADMIN;
		    ll('barista session token (admin): ' + barista_token);
		}else{
		    // Not a known session.
		    ret = SESS_BAD_USER_TYPE;
		    ll('barista session fail on user type: '+ sess['user-type']);
		}
	    }else{
		ret = SESS_BAD_TOKEN;
		ll('non-session (old/bad?) token, ignore: ' + barista_token);
	    }
	}else{
	    ret = SESS_NO_TOKEN;
	    ll('no token');
	}

	return ret;
    }

    // Gross overview of current users.
    messaging_app.get('/user_info/:action?', function(req, res) {
	
	// First, check to see if we have access to the good stuff,
	// both for later drawing use and for local actions.
	var sess_stat = _session_status(req);
	var show_editor_p = false;
	var show_admin_p = false;
	if( sess_stat === SESS_GOOD_EDIT ){
	    show_editor_p = true;
	}else if( sess_stat === SESS_GOOD_ADMIN ){
	    show_editor_p = true;
	    show_admin_p = true;
	}

	// Now that we know what we're allowed to do, see what user
	// operation we're going to try and perform.
	var action = req.params['action'] || null;
	var do_reset_p = null;
	var do_refresh_p = null;
	var do_nothing_p = null;
	if( action === 'reset' ){
	    do_reset_p = true;
	    do_refresh_p = false;
	    do_nothing_p = false;
	}else if( action === 'refresh' ){
	    do_reset_p = false;
	    do_refresh_p = true;
	    do_nothing_p = false;
	}else{
	    do_reset_p = false;
	    do_refresh_p = false;
	    do_nothing_p = true;
	}

	// Perform refresh if we are ordered and we have permission.
	var barista_user_reset = null;
	var barista_user_refresh = null;
	if( do_reset_p && sess_stat !== SESS_GOOD_ADMIN ){
	    ll('non-admin triggered reset--ignoring');
	}else if( do_refresh_p && sess_stat !== SESS_GOOD_ADMIN ){
	    ll('non-admin triggered refresh--ignoring');
	}else if( (do_reset_p||do_refresh_p) && sess_stat === SESS_GOOD_ADMIN ){
	    
	    // In-place refresh from given files.
	    ll('admin triggered refresh');

	    // Dump current sessions, or not, depending the type of
	    // operation--refresh or reset--that we'll do.
	    var current_sessions = [];
	    if( do_refresh_p ){
		current_sessions = sessioner.get_sessions();
	    }

	    // Gingerly reload files, wiping out current session set.
	    var new_sessioner = null;
	    try {
		new_sessioner = _setup_sessioner(user_fname, group_fname);
	    }catch(e){
		ll('Failed to load: ' + user_fname);
	    }	    
	    if( new_sessioner ){

		// Load current sessions back into the system.
		us.each(current_sessions, function(cs){
		    new_sessioner.create_bogus_session(
			cs['token'],
			cs['uri'],
			cs['user-type'],
			cs['nickname'],
			[],
			{},
			cs['email']);
		});
	    
		// Final reload by switching.
		sessioner = new_sessioner;
		ll('(Re)loaded: ' + user_fname + ' and ' + group_fname);
	    }
	}

	// We'll need this URL in some cases.
	var token = _get_token(req);
	barista_user_reset = _build_token_link('/user_info/reset', token);
	barista_user_refresh = _build_token_link('/user_info/refresh', token);

	// Dump current sessions.
	var sessions = sessioner.get_sessions();

	// Decorate the session hash with last op results.
	each(sessions, function(s){
	    if( s['uri'] && monitor_last_op[s['uri']] ){
		s['_last_op'] = monitor_last_op[s['uri']];
	    }else{
		s['_last_op'] = '???';
	    }
	});

	// Mustache is dumb; do we have any sessions?
	var barista_sessions_p = false;
	if( us.isArray(sessions) && sessions.length > 0 ){
	    barista_sessions_p = true;
	}

	// Variables, render, and output.
	var tmpl_args = {
	    'show_editor_p': show_editor_p,
	    'show_admin_p': show_admin_p,
	    'barista_sessions_p': barista_sessions_p,
	    'barista_sessions': sessions,
	    'barista_user_reset': barista_user_reset,
	    'barista_user_refresh': barista_user_refresh,
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
	var token = req.params['token'] || null;
	var sess = sessioner.get_session_by_token(token);

	var ret_obj = {};
	
	// Gather session info.
	if( sess && token ){
	    ret_obj = sessioner.get_session_by_token(token);
	}

	// 
	var fin = JSON.stringify(ret_obj);
	ll('got user info for:' + fin['uri']);
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
    /// Unfortunately, due to problems upstream outside our control,
    /// we are unable to do the obvious thing here. In the case of
    /// trying to proxy GET requests, we use the (now hated)
    /// http-proxy package, taking the incoming request, making a
    /// couple of checks against it and changes to it, and then pass
    /// it on http-proxy to be taken care of.
    ///
    /// However, in the case of POST requests containing bodies, due
    /// upstream issues like and surrounding
    /// https://github.com/nodejitsu/node-http-proxy/issues/180 , we
    /// cannot examine and modify the body and have the proxy work
    /// (just hangs, or gives errors, or something) in a reliable and
    /// robust way. We tried all of the suggest solutions, and some of
    /// our own, with varying degrees of success, but the unpleasant
    /// outcome of this is that we are just going have to manually
    /// proxy requests ourselves using the http client. This is more
    /// complicated and has more overhead, but is more tracable,
    /// robust, and we have complete control without fighting with the
    /// various middlewares.
    ///
    /// TODO: In the future, if this works out, we may just switch the
    /// GET off of the api_proxy and just do manual for it as
    /// well--that will save us some code repetition and make it all a
    /// little more readable.
    ///

    // Generic function for notifying listeners of some events.
    function _notify_listeners(json_string){

	// Now what should we do with the JSON? Check it.
	var response_okay_p = true;
	var resp = null;
	try{
	    //ll(jsonp);
	    var resp_json = JSON.parse(json_string);
		// ll('barista.RESPONSE:\n' + JSON.stringify(resp_json, null, 2));
	    resp = new bar_response(resp_json);
	}catch(e){
	    response_okay_p = false;
	    ll("unparsable response: " + json_string);
	}

	// Emit to all listeners--cannot target all but call since
	// this was not done over messaging in the first place
	// (api proxy).
	// For filtering, there is a unique ID from Minerva so
	// that they can block messages they've heard
	// before--similar to the current model filtering. Ish.
	if( response_okay_p && resp && resp.okay() && resp.model_id() ){
	    if( resp.intention() !== 'action' ){
		ll("Skip broadcast of message (non-action).");
	    }else if( resp.signal() === 'merge' ){
		ll("Broadcast merge.");
		sio.emit('relay', {'class': 'merge',
					   'model_id': resp.model_id(),
					   'packet_id': resp.packet_id(),
					   'data': resp.raw()});
	    }else if( resp.signal() === 'rebuild' ){
		ll("Broadcast rebuild.");
		sio.emit('relay', {'class': 'rebuild',
					   'model_id': resp.model_id(),
					   'packet_id': resp.packet_id(),
					   'data': resp.raw()});
	    }else{
		ll("Skip broadcast of message (different signal).");
	    }
	}

	return response_okay_p;
    }

    // NOTE: Assuming either jQuery JSONP action JSON via CORS
    // or similar.
    // "jQuery1910009816080028417162_1412824223034(.*);"
    // Returns either the original string (no match) or the match in a
    // jQuery jsonp regexp.
    function _extract_json_from_jsonp( jsonp ){

	//ll('match: ', jsonp);
	var match = jsonp.match(jsonp_re);
	if( ! match || match.length !== 2 ){
	    //ll('response: n/a');
	}else{
	    //ll('response: ', match[1]);
	    jsonp = match[1];
	}

	return jsonp;
    }

    // Generic messages on a generic error.
    function _proxy_error(error_obj, error_msg, req, res){
	// Report...
	ll('We have proxy problem! Maybe a timeout error against Minerva? ' + 
	   error_msg);
	ll(error_obj);
	// ..then handle.
	// TODO: Wait until we have more experience with this before
	// we handle--obviously only the originating users needs to
	// know.
	// var resp = new bbopx.barista.response({});
	// resp.message_type('error');
	// resp.message('We have problem! Maybe a timeout error against Minerva?');
	// 	    sio.emit('relay', {'class': 'rebuild',
	// 				       'model_id': resp.model_id(),
	// 				       'packet_id': resp.packet_id(),
	// 				       'data': resp.raw()});
    }

    // GET version proxy--this is the use of the http-proxy package.
    var http_proxy = require('http-proxy');
    var api_proxy_opts = {
		changeOrigin: true,
		xfwd: true
		// prependPath: false,
    };
    var api_proxy = http_proxy.createProxyServer(api_proxy_opts);
    messaging_app.get("/api/:namespace/:call/:subcall?", function(req, res){ 

	// TODO: Request logging hooks could be placed in here.
	//ll('pre api req: ' + req.url);
	monitor_calls = monitor_calls +1;

	// console.log('####req.url:', req.url);
	// console.log('####req.query:', req.query);
	// console.log('####req.query.token:', req.query.token);
	// console.log('####req.params:', req.params);
	// Extract the arguments one way or another. The end product
	// is to try and get a session out for use. The important
	// thing we need here is the uri to pass back to the API if
	// session and possible.
	var has_token_p = false;
	var has_sess_p = false;
	var uuri = null;

	// Token extraction.
	var attempt_token = null;
	if( req && req['query'] && req['query']['token'] ){
	    attempt_token = req['query']['token'];
	}
	// Try to resolve to token into known sessions.
	if( attempt_token ){
	    ll('looks like a token was attempted');

	    // Best attempt at extracting a UID.
	    has_token_p = true;
	    var sess = sessioner.get_session_by_token(attempt_token);
	    if( sess ){
		ll('call using session:');
		ll(sess);
		uuri = sess.uri;
		has_sess_p = true;
	    }else{
		ll('token was not found');
	    }
	}
	else{
	    ll('no token was attempted');
	}

	// Extract token=??? from the request URL safely and add the
	// uri as uid.
	var url_obj = url.parse(req.url);
	var q_obj = querystring.parse(url_obj['query']);
	delete q_obj['token'];
	q_obj['uid'] = uuri; // may be null
	// The first works according to the docs, the
	// second according to real life.
	url_obj['query'] = querystring.encode(q_obj);
	url_obj['search'] = '?' + querystring.encode(q_obj);
	//ll('q_obj: ', q_obj);
	// Eliminate confounding fields to make sure it
	// parses out the one we modified.
	//delete url_obj['search'];
	req.url = url.format(url_obj);

	// Do we have permissions to make the call?
	var ns = req.params['namespace'] || '';
	var call = req.params['call'] || '';
	var subcall = req.params['subcall'] || '';
	call = call + subcall; // allow for things like seed/fromProcess
	if( ! app_guard.is_public(ns, call) && ! uuri ){
	    ll('blocking call: ' + req.url);
	    
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

	    // If this was requested as AJAX, not CORS, need to
	    // assemble it for the return.
	    if( req && req['query'] && req['query']['json.wrf'] ){
		ll('adjust for AJAX call (GET)');
		var envelope = req['query']['json.wrf'];
		eresp_str = envelope + '(' + eresp_str + ');';
	    }

	    //var eresp = new bbopx.barista.response(eresp_seed);
	    ll('inject response:');
	    ll(eresp_str);
	    res.send(eresp_str);

	}else{

	    // Good call, so let's make a note of it--we're looking to
	    // get a little info on currently active users.
	    if( uuri ){
		monitor_last_op[uuri] = (new Date()).toJSON();
	    }

	    // Not public or user is privileged.
	    // Route the simple call to the right place.
	    // Clip "/api/" and the namespace.
	    var api_loc = app_guard.app_target(ns);
	    req.url = req.url.substr(ns.length + 5);
	    ll('api xlate (GET): [' + api_loc + ']' + req.url);
	    // var urlObj = url.parse(req.url, true).query;
	    // if (urlObj.requests) {
	    // 	urlObj.requests = JSON.parse(urlObj.requests);
	    // }
	    // ll('barista.GET:\n' + JSON.stringify(urlObj, null, 2));
	    api_proxy.web(req, res, {
		'target': api_loc
	    });
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
	// wrapper.
	proxyRes.on('end', function(){

	    var possibly_jsonp = chunks.join('');

	    // Try and get something useful to pass to listening clients.
	    var json_string = _extract_json_from_jsonp(possibly_jsonp);

	    // Notify listeners of model.
	    _notify_listeners(json_string);
	});
    });

    // Uncomment this for debugging proxy requests.
    // api_proxy.on('proxyReq', function(proxyReq, req, res, options) {
    // 	console.log('proxyReq:', req.url, req.query, req.params, req.headers, options);
    // });


    // Not everything in life has happy endings. I've run into cases
    // where the ontologies slow minerva down enough that I get an
    // error thrown reporting: "Error: socket hang up".
    api_proxy.on('error', function (error, req, res) {
	_proxy_error(error, 'api_proxy proxy error', req, res);
    });

    // POST version.
    messaging_app.post("/api/:namespace/:call/:subcall?", function(req, res){ 

	// TODO: Request logging hooks could be placed in here.
	//ll('pre api req: ' + req.url);
	monitor_calls = monitor_calls +1;

	// Collect the full POST body (if there is one) before
	// proceeding.
	var full_body ='';
	req.on('data', function(chunk) {
	    full_body += chunk.toString();
	});
	req.on('end', function() {
	    ll("Received body data: " + full_body);
	    
	    var decoded_body = querystring.parse(full_body) || {};
	    console.log(api_loc);
	    console.log(decoded_body);
	    
	    // Extract the arguments one way or another. The end
	    // product is to try and get a session out for use. The
	    // important thing we need here is the uri to pass back to
	    // the API if session and possible.
	    var has_token_p = false;
	    var has_sess_p = false;
	    var uuri = null;

	    var attempt_token = null;
	    if( decoded_body && decoded_body['token'] ){
	        attempt_token = decoded_body['token'];
	        ll('looks like POST');
	    }
	    // Try to resolve to token into known sessions.
	    if( attempt_token ){
		ll('looks like a token was attempted');
		
		// Best attempt at extracting a UID.
		has_token_p = true;
		var sess = sessioner.get_session_by_token(attempt_token);
		if( sess ){
		    ll('call using session:');
		    ll(sess);
		    uuri = sess.uri;
		    has_sess_p = true;
		}else{
		    ll('no token was attempted');
		}
	    }

	    // Extract token=??? from the request body safely and add
	    // the uri as uid.
	    decoded_body['uid'] = uuri;
	    delete decoded_body['token'];

	    // Do we have permissions to make the call?
	    var ns = req.params['namespace'] || '';
	    var call = req.params['call'] || '';
	    var subcall = req.params['subcall'] || '';
	    call = call + subcall; // allow for things like seed/fromProcess
	    if( ! app_guard.is_public(ns, call) && ! uuri ){
		ll('blocking call: ' + req.url);
		
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

		// If this was requested as AJAX, not CORS, need to
		// assemble it for the return.
		if( decoded_body && decoded_body['json.wrf'] ){
		    ll('adjust for AJAX call (POST)');
		    var envelope = decoded_body['json.wrf'];
		    eresp_str = envelope + '(' + eresp_str + ');';
		}

		//var eresp = new bbopx.barista.response(eresp_seed);
		ll('inject response:');
		ll(eresp_str);
		res.send(eresp_str);

	    }else{

		// Not public or user is privileged.
		// Route the simple call to the right place.
		//ll('req: ', req);
		// Clip "/api/" and the namespace.
		var api_loc = app_guard.app_target(ns);
		req.url = req.url.substr(ns.length + 5);
		ll('api xlate (POST): [' + api_loc + ']' + req.url);
		//ll(req.url);
		//ll(req);
		// ll(decoded_body);

		// Okay, @#$@#$@. The proxy server simply will not
		// work the way we want (see:
		// https://github.com/nodejitsu/node-http-proxy/issues/180),
		// so write our own @#$@#%#$^% client to proxy.

		var proxy_url = url.parse(api_loc);
		var proxy_port = proxy_url.port || 80;

		var post_data = querystring.stringify(decoded_body);
		var options = {
		    hostname: proxy_url.hostname,
		    port: proxy_port,
		    path: req.url,
		    method: 'POST',
		    headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': post_data.length
		    }
		};
		
		var proxy_req = http.request(options, function(proxy_res) {

		    //console.log('status: '+proxy_res.statusCode);
		    //console.log('headers: '+JSON.stringify(proxy_res.headers));
		    proxy_res.setEncoding('utf8');

		    var proxied_body = '';
		    proxy_res.on('data', function (chunk) {
			proxied_body += chunk.toString();
		    });
		    proxy_res.on('end', function() {
			//console.log('BODY: ' + proxied_body);
			//console.log('No more data in response.');

			// Notify any listeners.
			var json_string = _extract_json_from_jsonp(proxied_body);
			_notify_listeners(json_string);

			// Well, three down, but we're finally
			// here. Send our data back up to the top.
			res.setHeader('Content-Type', 'application/json');
			res.send(proxied_body);
		    });
		});
		
		proxy_req.on('error', function(e) {
		    _proxy_error(e, 'result proxy problem: ' + e.message,
				 req, res);
		});
		
		// End by writing data to request body.
		proxy_req.write(post_data);
		proxy_req.end();
	    }
	});

	/// A little something in case of error.
	req.on('error', function(e) {
	    _proxy_error(e, 'POST proxy problem: ' + e.message, req, res);
	});
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
    // sio.enable('browser client minification');
    // sio.enable('browser client etag');
    // sio.enable('browser client gzip');
    // sio.set('log level', barista_debug);
    // Above sio.enable/set calls are no longer supported by socket.io
    // See: http://stackoverflow.com/questions/30793779/run-app-on-newest-versions-of-socket-io-gratter-than-1-0
    // See: http://socket.io/docs/migrating-from-0-9/

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
	    //ll('messenger data: ', data);
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
	    //ll('srv tele: ' + data);
	    monitor_messages = monitor_messages +1;

	    // Only really get involved if the user is logged in.
	    if( _is_logged_in_p(data) ){
		// Relay the actions of logged-in users.
		data = _mod_data_with_session_info(data);
		socket.broadcast.emit('relay', data);
		
		// Skim object location and update cubby layout
		// information when screen items are moving via
		// telekinesis by logged-in users.
		//ll('relay: ', data);
		if( data['class'] === 'telekinesis' ){
		    var mid = data['model_id'];
		    var obs = data['objects'];
		    if(typeof(mid) !== 'undefined' && typeof(obs) === 'object'){
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
				// ll('cubby m: ',
				// 	    cubby.model_count());
				// ll('cubby ns: ',
				// 	    cubby.namespace_count(mid));
				// ll('cubby ks: ',
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
	    //ll('srv tele: ' + data);
	    monitor_messages = monitor_messages +1;

	    // TODO: Respond to client query.
	    // Pong it back.
	    //ll('PROCESSING', socket_id);
	    //ll('PROCESSING', socket);
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
			ll('respond to query from '+socket_id);// +'with:',data);
		    }
		}
	    }
	});
	
	// Disconnect info.
	socket.on('disconnect', function(){
	    ll('srv disconnect');
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
