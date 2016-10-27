
// 
var fs = require('fs');
var yaml = require('yamljs');
var us = require('underscore');
var url = require('url');
var queryparser = require('querystring');

// For new stuff.
var express = require('express');
var session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

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

function _standard_response(res, code, type, body){
    res.setHeader('Content-Type', type);
    res.setHeader('Content-Length', body.length);
    res.end(body);
    return res;
}

function _extract_referer_query_field(req, field){
    var ret = null;

    if( req && req['headers'] && req['headers']['referer'] ){	
	console.log('req', req['headers']['referer']);
	var ref_url = req['headers']['referer'];
	if( us.isString(ref_url) ){
	    var ref_query = url.parse(ref_url).query;
	    if( us.isString( ref_query ) ){
		var parsed_query = queryparser.parse(ref_query);
		if( parsed_query && parsed_query[field] ){
		    ret = parsed_query[field];
		}
	    }
	}
    }

    return ret;
}

///
/// Credential probing and processing.
///

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
us.each(['local', 'google-plus', 'github'], function(provider){

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
		    console.log("TODO: Authenticated with URI: " +
				local_secrets[username]['uri']);
		    return done(null, local_secrets[username]);
		}
	    }));
					   
	    // We're go.
	    use_provider_local_p = true;
	    
	}else if( provider === 'google-plus' ){

	    // Pick-up secrets file and check structure.
	    var google_secrets = yaml.load(provider_path);
	    console.log('google_secrets', google_secrets);
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

		console.log("Start auth...");
		//console.log('google callback accessToken: ', accessToken);
		//console.log('google callback refreshToken: ', refreshToken);
		console.log('google callback profile id: ', profile['id']);

		// Try and extract from sessioner using g+ id.
		if( ! profile || ! us.isString(profile['id']) ){
		    return done(null, false, { message: 'Bad profile?' });
		}else{

		    // Looks good.
		    // TODO: Try and use g+ id to extract sessioner session to
		    // ORCID.
		    // TODO: Through different fail if it cannot.
		    console.log("Authenticated");
		    return done(null, {"id": "TEMP:anonymous",
				       "uri": "TEMP:anonymous:" + profile['id'],
				       "displayName": "???"});
		}
	    }));

	    // We're go.
	    use_provider_google_plus_p = true;
	    
	}else if( provider === 'github' ){

	    // TODO.
	    _die('Not yet implemented: ' + provider);
	    
	    // We're go.
	    use_provider_github_p = true;
	    
	}else{
	    _die('Impossible to use provider: ' + provider);
	}
    }    
});

// 
// 
// 

var app = express();

// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('port', '8899');

// 
// 
// 

app.use(cookieParser());
app.use(bodyParser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

///
/// Shared routes.
///

// Nothing.
app.get('/', function(req, res){
    return _standard_response(res, 200, 'text/html', 'home');
});

// Shared login page.
app.get('/login', function(req, res){

    // Get return argument (originating URL) if there.
    var ret = null;
    if( req.query && req.query['return'] ){
	ret = req.query['return'];
    }

    // TODO: Complain if nothing to return to.
    var insert = '';
    if( ! ret ){
	insert = '<div>no place to return to :(</div>';
    }else{
	insert = '<div>will return to "' + ret + '"</div>';
    }
	
    return _standard_response(res, 200, 'text/html', insert+ '<div><p><a href="/auth/local?return=' + ret + '">Sign In Locally</a></p></div><div><p><a href="/auth/google?return=' + ret + '">Sign In with Google</a></p></div>');
});

// Shared success, requiring return and token.
app.get('/login/success', function(req, res){

    // Get return argument (originating URL) if there.
    var ret = null;
    if( req.query && req.query['return'] ){
	ret = req.query['return'];
    }
    // Get return argument (originating URL) if there.
    var tok = null;
    if( req.query && req.query['barista_token'] ){
	tok = req.query['barista_token'];
    }
    // TODO: Err if not both of those?

    return _standard_response(res, 200, 'text/html', 'success: ' +
			      tok + ', ' + ret);
});

// General failure.
app.get('/login/failure', function(req, res){
    return _standard_response(res, 200, 'text/html', 'failure');
});

///
/// Local specific routes.
///

app.get('/auth/local', function(req, res){

    // Get return argument (originating URL) if there.
    var ret = null;
    if( req.query && req.query['return'] ){
	ret = req.query['return'];
    }
    console.log('/auth/local GET got "return": ' + ret);
    // TODO: Err if nothing to return to?

    return _standard_response(res, 200, 'text/html', '<form action="/auth/local/callback?return=' + ret + '" method="GET"><div><label>Username:</label><input type="text" name="username" /></div><div><label>Password:</label><input type="password" name="password" /></div><div><input type="submit" value="Log In" /></div></form>');
});




app.get('/auth/local/callback', function(req, res, next) {

    // Get return argument (originating URL) if there.
    var ret = _extract_referer_query_field(req, 'return');
    console.log('/auth/local/callback GET got "return": ' + ret);
    // TODO: Err if nothing to return to?

    passport.authenticate('local', function(err, user, info){
	if( err ){
	    console.log('"local" unknown error:', err);
	    return next(err);
	}else if( ! user ){
	    console.log('"local" error: lack of user?', info);
	    return res.redirect('/login/failure');
	}else{
	    // TODO: Real token get and register new session.
	    console.log('user', user);
	    return res.redirect('/login/success?return=' + ret +
				'&barista_token=' +
				encodeURIComponent(user['uri']));
	}
    })(req, res, next);
});

///
/// Google+ specific routes.
///

// Throw.
app.get('/auth/google',
	passport.authenticate(
	    'google',
	    { scope: ['https://www.googleapis.com/auth/plus.login'] }
	));

// Catch.
// app.get('/auth/google/callback',
// 	passport.authenticate('google', { failureRedirect: '/login/failure' }),
// 	function(req, res) {
// 	    //	    console.log('/auth/google/callback req', );
// 	    res.redirect('/login/success');
// 	});
app.get('/auth/google/callback', function(req, res, next) {

    // Get return argument (originating URL) if there.
    var ret = _extract_referer_query_field(req, 'return');
    console.log('/auth/google/callback GET got "return": ' + ret);
    // TODO: Err if nothing to return to?

    passport.authenticate('google', function(err, user, info){
	if( err ){
	    console.log('"google" unknown error:', err);
	    return next(err);
	}else{
	    // Return real token get and referer.
	    console.log('user', user);
	    return res.redirect('/login/success?return=' + ret +
				'&barista_token=' +
				encodeURIComponent(user['uri']));
	}
    })(req, res, next);
});

///
/// Spin up server.
///

app.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
