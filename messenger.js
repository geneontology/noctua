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

var msgport = '3400'; // default val
if( process.env.MSGPORT ){
    msgport = process.env.MSGPORT;
    console.log('messenger server port taken from environment: ' + msgport);
}else{
    console.log('messenger server port taken from default: ' + msgport);
}

// Spin up the chat server.
var chat_app = require('express')();
var chat_server = require('http').createServer(chat_app);
var sio = require('socket.io').listen(chat_server);
chat_server.listen(3400);

chat_app.get('/', function (req, res) {
		 res.sendfile(__dirname + '/static/messenger.html');
	     });

// TODO: Turn on recommended production settings when in production.
// https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO#wiki-recommended-production-settings
sio.enable('browser client minification');
sio.enable('browser client etag');
sio.enable('browser client gzip');
sio.set('log level', 0);

sio.sockets.on('connection',
	       function(socket){

		   // Relays.
		   socket.on('info',
			     function(data){
				 //console.log('srv info: ' + data['text']);
				 socket.broadcast.emit('info', data);
			     });
		   socket.on('remote',
			     function(data){
				 //console.log('srv remove: ' + data);
				 socket.broadcast.emit('remote', data);
			     });

		   // Disconnect info.
		   socket.on('disconnect',
			     function(data){
				 console.log('srv disconnect');
				 var dispack = {
				     text: 'client disconnected from server'
				 };
				 socket.broadcast.emit('info', dispack);
			     });
	       });
