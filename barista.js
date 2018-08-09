////
//// Communications, translation, and authorization and authentication
//// server for Minerva and Noctua clients.
////
//// If I spin the server out into a different project, what's added
//// above the MME laucher/base and messenger client code is:
////
////  barista.js
////  static/messenger.html
////  node_modules/socket.io/
////
//// : node barista.js --debug 0 --users /tmp/users.yaml --groups /tmp/groups.yaml --public http://localhost:3400 --self http://localhost:3400 --context minerva_local --repl 7887
////

// Required shareable Node libs.
var mustache = require('mustache');
var fs = require('fs');
var yaml = require('yamljs');
var url = require('url');
var us = require('underscore');
var querystring = require('querystring');
var crypto = require('crypto');

var path = require('path');
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

// // Where the world thinks Barista is.
// var publoc = argv['p'] || argv['public'] || 'http://localhost:3400';
// ll('Barista location (public/persona): ' + publoc);

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

// CLI handling.
var argv = require('minimist')(process.argv.slice(2));
var secloc = argv['x'] || argv['secrets'];
if( ! secloc ){
    secloc = './secrets';
    ll('Secrets location defaulting to: ' + secloc);
}

// Make sure secloc extant, etc.
var fstats = null;
try {
    fstats = fs.statSync(secloc);
}catch(e){
    _die('Option secrets location does not exist: ' + secloc);
}
if( ! fstats.isDirectory() ){
    _die('Option (x|secrets) is not a directory: ' + secloc);
}else{
    ll('Will use secrets directory at: ' + secloc);
}

// Define bogus users.
// TODO: Put out into private file on filesystem; still report on startup.
var rand_user_token = bbop.core.randomness(4);
ll('Anonymous editor token: ' + rand_user_token);
var bogus_users = [
    {
	email: 'spam@genkisugi.net',
	token: '123',
	nickname: 'kltm (editor)',
	uri: 'GOC:kltm',
	'user-type': 'allow-edit',
	groups: []
    },
    {
	email: 'spam@genkisugi.net',
	token: '000',
	nickname: 'kltm (admin)',
	uri: 'GOC:kltm',
	'user-type': 'allow-admin',
	groups: []
    },
    // Create a random bogus user for this barista run.
    {
	email: 'anonymous@localhost',
	token: rand_user_token,
	nickname: 'anonymous',
	uri: 'TEMP:anonymous',
	'user-type': 'allow-edit',
	groups: []
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
    // NOTE/TODO: Legacy after Persona switch?
    function str2md5(str){
	var shasum = crypto.createHash('md5');
	shasum.update(str);
	var ret = shasum.digest('hex');
	return ret;
    }

    // User information is statically stored by various keys. To
    // become a sessions, it is aggregated over in sessions_by_token.
    var uinf_by_md5 = {}; // NOTE/TODO: Legacy after Persona switch?
    var uinf_by_uri = {};
    var uinf_by_account = {
	// second-level provider hashes will go here
    };
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
	// If available, add in the different accounts.
	us.each(a['accounts'], function(account_id, account_provider){
	    if( us.isString(account_id) && us.isString(account_provider) ){

		// Ensure second-level place to put accounts.
		if( ! uinf_by_account[account_provider] ){
		    uinf_by_account[account_provider] = {};
		}

		// Add second-level user information to provider/id
		// combo.
		uinf_by_account[account_provider][account_id] = a;
	    }
	});

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
    var email2token = {}; // NOTE/TODO: Legacy after Persona switch?
    var uri2token = {};

    /*
     * Failure is an unknown, unauthorized, or ill-formed user. If no
     * user_type is listed, assume the lowest ranked one for the
     * attempt.
     * NOTE/TODO: Legacy after Persona switch?
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
    // NOTE/TODO: Can safely remove email stuff after Persona switch?
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

	// Email/md5 is now optional? Moving to a post-Persona
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
     * Will not clobber or repeat if a session exists--just return what's there.
     * Cloned object or null.
     */
    // NOTE/TODO: Legacy after Persona switch?
    // TODO: Session lifespan: every time a new session is created,
    // clear out old sessions.
    self.create_session_by_email = function(email){

	var ret = null;

	// First, just return a current session if there is one--don't
	// create a new one.
	if( email && email2token[email] &&
	    sessions_by_token[email2token[email]] ){

	    ret = clone( sessions_by_token[email2token[email]]);

	}else{

	    // Cycle through to see what kind of user we have.
	    var user_type = null;
	    us.each(known_user_types, function(try_user_type){
		if( self.authorize_by_email(email, try_user_type) ){
		    user_type = try_user_type;
		}
	    });

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
				    new_nick, new_groups, new_accounts,
				    email);
	    }
	}

	return ret;
    };

    /*
     * Will not clobber or repeat if a session exists--just return what's there.
     * Cloned object or null.
     */
    // TODO: Session lifespan: every time a new session is created,
    // clear out old sessions.
    self.create_session_by_uri = function(uri){

	var ret = null;

	// First, just return a current session if there is one--don't
	// create a new one.
	if( uri && uri2token[uri] && sessions_by_token[uri2token[uri]] ){

	    ret = clone( sessions_by_token[uri2token[uri]]);

	}else{

	    // Cycle through to see what kind of user we have.
	    var user_type = null;
	    us.each(known_user_types, function(try_user_type){
		if( self.authorize_by_uri(uri, try_user_type) ){
		    user_type = try_user_type;
		}
	    });

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
				    new_nick, new_groups, new_accounts,
				    new_email);
	    }
	}

	return ret;
    };

    /*
     * Will not clobber or repeat if a session exists--just return what's there.
     * Cloned object or null.
     */
    // TODO: Session lifespan: every time a new session is created,
    // clear out old sessions.
    self.create_session_by_provider = function(provider_name, user_id){

	// First, try and recover URI, which we will then use to delegate to
	// a more full function.
	var try_uri = null;
	if( uinf_by_account[provider_name] &&
	    uinf_by_account[provider_name][user_id] ){

		var sess = uinf_by_account[provider_name][user_id];
		if( sess && sess['uri'] ){
		    try_uri = sess['uri'];
		}
	    }

	return self.create_session_by_uri(try_uri);
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
     * NOTE/TODO: Legacy after Persona switch?
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
	    // NOTE/TODO: Legacy after Persona switch?
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
     * NOTE/TODO: Legacy after Persona switch?
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

    // Whenever we referesh sessions, also bring in the listed
    // internal bogus user sessions.
    us.each(bogus_users, function(bu){
	new_sessioner.create_bogus_session(
	    bu['token'],
	    bu['uri'],
	    bu['user-type'],
	    bu['nickname'],
	    bu['groups'],
	    {}, // no accouts, pretty much by definition
	    bu['email']);
    });

    return new_sessioner;
}
var sessioner = _setup_sessioner(user_fname, group_fname);

///
/// Passport and strategy setup.
///

var passport = require('passport');
passport.serializeUser(function(user, done){
    console.log('passport serializeUser: ', user);
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    console.log('passport deserializeUser: ', id);
    done(null, {'id': id});
    // else done(err, null)
});

// Scan secloc for secrets at "<provider>.yaml". "local" is special,
// actually defining usernames and passwords keyed to user IDs.
var use_provider_local_p = false;
var use_provider_github_p = false;
var use_provider_google_plus_p = false;
var use_provider_orcid_p = false;
us.each(['local', 'github', 'google-plus', 'orcid'], function(provider){

    var provider_path = secloc + '/' + provider + '.yaml';
    var prov_stats = null;
    try {
	prov_stats = fs.statSync(provider_path);
    }catch(e){
	ll('Will not use provider: ' + provider);
    }

    if( prov_stats ){
	ll('Will search for (' + provider + ') secrets at: ' + secloc);

	if( ! prov_stats.isFile() ){
	    ll('Unable to read ' + provider +
	       ' provider file at: ' + provider_path);
	}else if( provider === 'local' ){

	    // Squeeze whatever we can out of the secrets files.
	    var local_secrets = {};
	    var local_secrets_list = yaml.load(provider_path);
	    us.each( local_secrets_list, function(local_secret){
		if( us.isString(local_secret['uri']) &&
		    us.isString(local_secret['username']) &&
		    us.isString(local_secret['password']) ){

		    local_secrets[local_secret['username']] = local_secret;
		}
	    });

	    // Local password strategy.
	    var LocalStrategy = require('passport-local').Strategy;
	    passport.use(new LocalStrategy({
		passReqToCallback: true//,
		//session: false
	    }, function(req, username, password, done) {
		console.log("Start local auth...");
		//console.log("Have req", req);
		if( ! local_secrets[username] ){
		    console.log("Incorrect username: " + username);
		    return done(null, false, { message: 'Incorrect username.' });
		}else if( password !== local_secrets[username]['password'] ){
		    console.log("Incorrect password: " + password);
		    return done(null, false, { message: 'Incorrect password.' });
		}else{
		    console.log("Authenticated with URI: " +
				local_secrets[username]['uri']);
		    return done(null, {
			"uri": local_secrets[username]['uri'],
			"provider_id": 'local',
			"user_id": local_secrets[username]['uri']
		    });
		}
	    }));

	    // We're go.
	    use_provider_local_p = true;

	}else if( provider === 'github' ){

	    // TODO.
	    // Pick-up secrets file and check structure.
	    var github_secrets = yaml.load(provider_path);
	    console.log('secrets for ' + provider, github_secrets);
	    if( github_secrets['clientID'] &&
		github_secrets['clientSecret'] &&
		github_secrets['callbackURL'] ){
		    // Pass.
		}else{
		    throw new Error(provider + ' not structured correctly!');
		}

	    var GitHubStrategy = require('passport-github').Strategy;
	    passport.use(new GitHubStrategy({
		passReqToCallback: true,
		session: false,
		clientID: github_secrets['clientID'],
		clientSecret: github_secrets['clientSecret'],
		callbackURL: github_secrets['callbackURL']
	    }, function(req, accessToken, refreshToken, profile, done) {

		console.log("Start GitHub auth...");
		//console.log(provider + ' callback profile: ', profile);
		console.log(provider + ' callback profile id: ',
			    profile['username']);

		// Try and extract from sessioner using github username.
		if( ! profile || ! us.isString(profile['username']) ){
		    return done(null, false, { message: 'Bad profile?' });
		}else{

		    // Looks good. Try and use github username to extract
		    // sessioner session to ORCID.
		    // TODO: Through different fail if it cannot.
		    console.log("Authenticated using GitHub username: " +
				profile['username']);
		    return done(null, {
			"provider_id": 'github',
			"user_id": profile['username']
		    });
		}
	    }));

	    // We're go.
	    use_provider_github_p = true;

	}else if( provider === 'google-plus' ){

	    // Pick-up secrets file and check structure.
	    var google_secrets = yaml.load(provider_path);
	    console.log('secrets for ' + provider, google_secrets);
	    if( google_secrets['clientID'] &&
		google_secrets['clientSecret'] &&
		google_secrets['callbackURL'] ){
		    // Pass.
		}else{
		    throw new Error(provider + ' not structured correctly!');
		}

	    var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
	    passport.use(new GoogleStrategy({
		passReqToCallback: true,
		session: false,
		clientID: google_secrets['clientID'],
		clientSecret: google_secrets['clientSecret'],
		callbackURL: google_secrets['callbackURL']
	    }, function(req, accessToken, refreshToken, profile, done) {

		console.log("Start G+ auth...");
		console.log(provider + ' callback profile id: ', profile['id']);

		// Try and extract from sessioner using g+ id.
		if( ! profile || ! us.isString(profile['id']) ){
		    return done(null, false, { message: 'Bad profile?' });
		}else{

		    // Looks good.
		    // TODO: Try and use g+ id to extract sessioner session to
		    // ORCID.
		    // TODO: Through different fail if it cannot.
		    console.log("Authenticated using profile G+ ID: " +
				profile['id']);
		    return done(null, {
			"provider_id": 'google-plus',
			"user_id": profile['id']
		    });
		}
	    }));

	    // We're go.
	    use_provider_google_plus_p = true;

	}else if( provider === 'orcid' ){
	    // WARNING: ORCID provides a somewhat standard OAuth2
	    // interface, but with quirks that need to be detected and
	    // dealt with.
	    // https://gist.github.com/JanKoppe/1491e37d1022c77a286087e6c81d6092#file-example-js-L5

	    // TODO.
	    // Pick-up secrets file and check structure.
	    var orcid_secrets = yaml.load(provider_path);
	    console.log('secrets for ' + provider, orcid_secrets);
	    if( orcid_secrets['clientID'] &&
		orcid_secrets['clientSecret'] &&
		orcid_secrets['callbackURL'] ){
		    // Pass.
		}else{
		    throw new Error(provider + ' not structured correctly!');
		}

	    var ORCIDStrategy = require('passport-oauth2').Strategy;
	    passport.use(new ORCIDStrategy({
	      passReqToCallback: true,
	      session: false,
	      authorizationURL: 'https://orcid.org/oauth/authorize',
	      tokenURL: 'https://pub.orcid.org/oauth/token',
              scope: '/authenticate',
	      clientID: orcid_secrets['clientID'],
	      clientSecret: orcid_secrets['clientSecret'],
	      callbackURL: orcid_secrets['callbackURL']
	    }, function(req, accessToken, refreshToken, params, profile, done){

		console.log("Start ORCID auth...");
		//console.log(provider + ' callback profile: ', profile);
		//console.log(provider + ' callback params: ', params);

		// Try and extract from sessioner using orcid id.
		if( ! params || ! us.isString(params['orcid']) ){
		    return done(null, false, { message: 'Bad profile?' });
		}else{

		    // Looks good.
		    // TODO: Try and use github username to extract sessioner session to
		    // ORCID.
		    // TODO: Through different fail if it cannot.
		    console.log("Authenticated");
		    return done(null, {
			"provider_id": 'orcid',
			"user_id": params['orcid']
		    });
		}
	    }));

	    // We're go.
	    use_provider_orcid_p = true;

	}else{
	    _die('Impossible to use provider: ' + provider);
	}
    }
});

///
///
///

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
		rlog(this, '(Re)loaded: ' + fname + ' and ' + gname);
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
			cs['groups'],
			cs['accounts'],
			cs['email']);
		});

		sessioner = new_sessioner;
		rlog(this, '(Re)loaded: ' + fname + ' and ' + gname);
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

    function _filter_token_from_url(url_str){
	var ret = url_str;

	if( ret ){
	    var url_obj = url.parse(ret);
	    var q_obj = querystring.parse(url_obj['query']);
	    delete q_obj['barista_token'];
	    url_obj['query'] = querystring.encode(q_obj);
	    var encodable = querystring.encode(q_obj);
	    if( encodable && encodable !== '' ){
		url_obj['search'] = '?' + encodable;
	    }else{
		url_obj['search'] = null;
	    }
	    ret = url.format(url_obj);
	}

	return ret;
    }

    function _standard_response(res, code, type, body){
	res.setHeader('Content-Type', type);
	res.setHeader('Content-Length', body.length);
	res.end(body);
	return res;
    }

    function _extract_referer_query_field(req, field){
	var ret = null;

	if( req && req['headers'] && req['headers']['referer'] ){
	    console.log('referer', req['headers']['referer']);
	    var ref_url = req['headers']['referer'];
	    if( us.isString(ref_url) ){
		var ref_query = url.parse(ref_url).query;
		if( us.isString( ref_query ) ){
		    var parsed_query = querystring.parse(ref_query);
		    if( parsed_query && parsed_query[field] ){
			ret = parsed_query[field];
		    }
		}
	    }
	}

	return ret;
    }

    function _response_redirect_to_success(res, ret_url, user_token){
	var base_url = '/login/success?barista_token=' +
		encodeURIComponent(user_token);
	if( ret_url ){
	    base_url += '&return=' + ret_url;
	}
	return res.redirect(base_url);
    }

    // Attempt to intelligently add a token to an input URL.
    // BUG: This code is repeated in bbop_mme_widgets.build_token_link()
    // and noctua.js.
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

    // Cookies initially needed for Persona, not used to store the
    // referring "return" location after oauth2 kickouts.
    // https://github.com/expressjs/session#options
    var session = require('express-session');
    var session_options = {
    	secret: 'notverysecret',
    	resave: false,
    	saveUninitialized: false
    };
    messaging_app.use(session(session_options));

    // Passport.
    messaging_app.use(passport.initialize());
    messaging_app.use(passport.session());

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
	    // 'location': runloc,
	    // 'public': publoc,
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
		ll('Failed to load: ' + user_fname + ' or ' + group_fname);
	    }
	    if( new_sessioner ){

		// Load current sessions back into the system.
		us.each(current_sessions, function(cs){
		    new_sessioner.create_bogus_session(
			cs['token'],
			cs['uri'],
			cs['user-type'],
			cs['nickname'],
			cs['groups'],
			cs['accounts'],
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

    // Shared login page.
    messaging_app.get('/login', function(req, res){

	// Get return argument (originating URL) if there.
	var ret = null;
	if( req.query && req.query['return'] ){
	    ret = req.query['return'];
	    req.session.return = ret;
	}

    	var tmpl_args = {
    	    'pup_tent_js_variables': [],
    	    'pup_tent_js_libraries': [],
    	    'title': notw + ': Session Login',
    	    'return': ret,
	    'use_provider_local_p': use_provider_local_p,
	    'use_provider_google_plus_p': use_provider_google_plus_p,
	    'use_provider_github_p': use_provider_github_p,
	    'use_provider_orcid_p': use_provider_orcid_p
    	};
    	var out = pup_tent.render('barista_passport_login.tmpl',
    				  tmpl_args,
    				  'barista_base.tmpl');
    	return _standard_response(res, 200, 'text/html', out);
    });

    // Shared success, requiring return and token.
    messaging_app.get('/login/success', function(req, res){

	// Get return argument (originating URL) if there.
	var ret = null;
	if( req.query && req.query['return'] ){
	    ret = req.query['return'];
	}
	// Get the token, which really should be there.
	var tok = null;
	if( req.query && req.query['barista_token'] ){
	    tok = req.query['barista_token'];
	}
	//console.log('tok', tok);

	// We'll need this URL in some cases.
	var return_link = _build_token_link(ret, tok);
	var logout_link = _build_token_link('/logout?return='+ ret, tok);
	var login_link = _build_token_link('/login?return='+ ret, tok);

	var sess = sessioner.get_session_by_token(tok);
	var user_name = '???';
	var user_email = null;
	var user_color = '???';
	console.log('sess', sess);
	if( sess ){
	    user_name = sess['nickname'];
	    //user_email = sess['email'];
	    user_color = sess['color'];
	}

	// Get return argument (originating URL) if there.
    	var tmpl_args = {
    	    'pup_tent_js_variables': [],
    	    'pup_tent_js_libraries': [],
    	    'title': notw + ': Login Success',
    	    'session': sess,
    	    'token': tok,
    	    'return': ret,
    	    'user_name': user_name,
    	    'user_email': user_email,
    	    'user_color': user_color,
	    'return_link': return_link,
	    'login_link': login_link,
	    'logout_link': logout_link
  	};
    	var out = pup_tent.render('barista_passport_success.tmpl',
    				  tmpl_args,
    				  'barista_base.tmpl');
    	return _standard_response(res, 200, 'text/html', out);
    });

    // General failure.
    messaging_app.get('/login/failure', function(req, res){

	console.log('Login FAILURE.');

	// Try and extract our return url by a few different
	// methods.
	// First, see if we stashed it in the url.
	var ret = null;
	if( req.query && req.query['return'] ){
	    ret = req.query['return'];
	    console.log('Recovered return URL from URL.');
	}
	// Next, see if we stashed it in the session.
	if( ! ret ){
	    if( req.session && us.isString(req.session['return']) ){
		console.log('Recovered return URL from session.');
		ret = req.session['return'];
	    }
	    // Fall back on trying to get return argument from the header
	    // referer.
	    if( ! ret ){
		ret = _extract_referer_query_field(req, 'return');
		if( ret ){
		    console.log('Recovered return URL from field.');
		}else{
		    console.log('No recoverable return field.');
		}
	    }
	}

	// We do not want a token floating around in the case of failure.
	//console.log('ret (pre)', ret);
	ret = _filter_token_from_url(ret);
	//console.log('ret (post)', ret);

	// We'll need this URL in some cases.
	var return_link = ret;
	var login_link = '/login?return='+ ret;

	// Get return argument (originating URL) if there.
    	var tmpl_args = {
    	    'pup_tent_js_variables': [],
    	    'pup_tent_js_libraries': [],
    	    'title': notw + ': Login Failure',
    	    'return': ret,
	    'return_link': return_link,
	    'login_link': login_link
  	};
    	var out = pup_tent.render('barista_passport_failure.tmpl',
    				  tmpl_args,
    				  'barista_base.tmpl');
    	return _standard_response(res, 200, 'text/html', out);
    });

    // Really requires a return and token.
    messaging_app.get('/logout', function(req, res){

	// Get return argument (originating URL) if there.
	var ret = null;
	if( req.query && req.query['return'] ){
	    ret = req.query['return'];
	}
	// Get the token, which reall should be there.
	var tok = null;
	if( req.query && req.query['barista_token'] ){
	    tok = req.query['barista_token'];
	}
	//console.log('tok', tok);

	// Now then, to keep from causing weirdness, we'll need to
	// remove any incoming barista token in the URL.
	//console.log('ret (pre)', ret);
	ret = _filter_token_from_url(ret);
	//console.log('ret (post)', ret);

	// We'll need this URL in some cases.
	var return_link = ret;
	var login_link = '/login?return='+ ret;

	//
	var deleted_session_p = sessioner.delete_session_by_token(tok);

	// Get return argument (originating URL) if there.
    	var tmpl_args = {
    	    'pup_tent_js_variables': [],
    	    'pup_tent_js_libraries': [],
    	    'title': notw + ': Login Success',
    	    'token': tok,
	    'deleted_session_p': deleted_session_p,
    	    'return': ret,
	    'return_link': return_link,
	    'login_link': login_link,
  	};
    	var out = pup_tent.render('barista_passport_logout.tmpl',
    				  tmpl_args,
    				  'barista_base.tmpl');
    	return _standard_response(res, 200, 'text/html', out);
    });

    ///
    /// Auth specific routes.
    ///

    // Create local loop for local.
    messaging_app.get('/auth/local', function(req, res){

	// Get return argument (originating URL) if there.
	var ret = null;
	if( req.query && req.query['return'] ){
	    ret = req.query['return'];
	}
	console.log('/auth/local GET got "return": ' + ret);
	// TODO: Err if nothing to return to?

	// Get return argument (originating URL) if there.
    	var tmpl_args = {
    	    'pup_tent_js_variables': [],
    	    'pup_tent_js_libraries': [],
    	    'title': notw + ': Local Login',
    	    'return': ret
  	};
    	var out = pup_tent.render('barista_passport_local_login.tmpl',
    				  tmpl_args,
    				  'barista_base.tmpl');
    	return _standard_response(res, 200, 'text/html', out);
    });

    // Throw Google+.
    messaging_app.get('/auth/google',
	    passport.authenticate(
		'google',
		{ scope: ['https://www.googleapis.com/auth/plus.login'] }
	    ));

    // Throw GitHub.
    messaging_app.get('/auth/github',	passport.authenticate('github'));

    // Throw orcid/oauth2.
    messaging_app.get('/auth/orcid', passport.authenticate('oauth2'));

    // Generalized final step callback.
    messaging_app.get('/auth/:method/callback', function(req, res, next) {

	var method = req.params.method;
	var method_title = method;

	// The orcid/oauth2 thing is a special case.
	if( method === 'orcid' ){
	    method = 'oauth2';
	}

	// Try and extract our return url by a couple of different
	// methods.
	// First, see if we stashed it in the session.
	var ret = null;
	if( req.session && us.isString(req.session['return']) ){
	    console.log('Recovered return URL from session.');
	    ret = req.session['return'];
	    req.session['return'] = null; // don't confuse ourselves later
	}
	// Fall back on trying to get return argument from the header
	// referer.
	if( ! ret ){
	    ret = _extract_referer_query_field(req, 'return');
	    if( ret ){
		console.log('Recovered return URL from field.');
	    }
	}
	console.log('/auth/'+method_title+'/callback GET got "return": ' + ret);

	// TODO: Err if nothing to return to? Or in the more likely case
	// of losing my return in the middle, tell people to start again
	// somewhere?

	// Final redirections.
	passport.authenticate(method, function(err, user, info){
	    if( err ){
		console.log('"'+method_title+'" unknown error:', err);
		return next(err);
	    }else if( ! user ){
		console.log('"'+method_title+'" error: lack of user?', info);
		return res.redirect('/login/failure');
	    }else{

		// Try and put together a session from the fragmentary
		// information that we captured.
		console.log('Captured user info', user);
		var sess = null;
		if( user['uri'] ){ // get lucky
		    sess = sessioner.create_session_by_uri(user['uri']);
		}else{
		    // Try and create one via provider.
		    sess = sessioner.create_session_by_provider(
			user['provider_id'], user['user_id']);
		}

		var created_token = null;
		if( sess && sess['token'] ){
		    created_token = sess['token'];
		}else{
		    // TODO: Something if in error?
		}

		return _response_redirect_to_success(res, ret, created_token);
	    }
	})(req, res, next);
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
