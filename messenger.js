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

var msgport = 3400; // default val
var msgdebug = 0; // default val
if( process.env.MSGPORT ){
    msgport = process.env.MSGPORT;
    console.log('messenger server port taken from environment: ' + msgport);
}else{
    console.log('messenger server port taken from default: ' + msgport);
}
if( process.env.MSGDEBUG ){
    msgdebug = process.env.MSGDEBUG;
    console.log('messenger debug level taken from environment: ' + msgdebug);
}else{
    console.log('messenger debug level taken from default: ' + msgdebug);
}

// Spin up the chat server.
var chat_app = require('express')();
var chat_server = require('http').createServer(chat_app);
var sio = require('socket.io').listen(chat_server);
chat_server.listen(msgport);

chat_app.get('/', function (req, res) {
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
var client_sockets = {};

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
