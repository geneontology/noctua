////
//// If I spin the server out into a different project, what's added
//// above the MME laucher/base and messenger client code is:
////
////  messenger.js
////  static/messenger.html
////  node_modules/socket.io/
////
//// MSGPORT=3400 make start-messenger
////
//// TODO: Rename "barista".
////

var msgport = 3400; // default val
var msgdebug = 0; // default val
var m3loc = 'http://toaster.lbl.gov:6800'; // default val
if( process.env.M3LOC ){
    m3loc = process.env.M3LOC;
    console.log('MMM server location taken from environment: ' + m3loc);
}else{
    console.log('MMM server location taken from default: ' + m3loc);
    }
if( process.env.MSGPORT ){
    msgport = process.env.MSGPORT;
    console.log('Barista server port taken from environment: ' + msgport);
}else{
    console.log('Barista server port taken from default: ' + msgport);
}
if( process.env.MSGDEBUG ){
    msgdebug = process.env.MSGDEBUG;
    console.log('Barista debug level taken from environment: ' + msgdebug);
}else{
    console.log('Barista debug level taken from default: ' + msgdebug);
}

// Spin up the main messenging server.
var messaging_app = require('express')();
var messaging_server = require('http').createServer(messaging_app);
var sio = require('socket.io').listen(messaging_server);
messaging_server.listen(msgport);

///
/// TODO: High-level status overview and hearbeat
///

///
/// Authenitcation and Authorization.
/// TODO: This needs to tie into the sockets.
///

//messaging_app.get('/login', function (req, res) {
//messaging_app.get('/logout', function (req, res) {

///
/// TODO: API proxy.
///

var http_proxy = require('http-proxy');
var api_proxy = http_proxy.createProxyServer({});
messaging_app.get("/api/:namespace/:call", function(req, res){ 
		      // TODO: Request logging hooks could be placed in here.
		      console.log('api req: ' + req.url);

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
var ucolor_list = ['red', 'green', 'purple', 'blue', 'brown', 'black'];
var client_sockets = {}; // essentially users
// TODO: The initial stash that a client gets for a channel when first
// connecting--essentially the recorded history to date.
var channel_stash = {};

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
