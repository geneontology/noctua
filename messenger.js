////
//// If I spin the server out into a different project, what's added
//// above the MME laucher/base and messenger client code is:
////
////  messenger.js
////  static/messenger.html
////  node_modules/socket.io/
////

// Spin up the chat server.
var chat_app = require('express')();
var chat_server = require('http').createServer(chat_app);
var sio = require('socket.io').listen(chat_server);
chat_server.listen(3400);

chat_app.get('/', function (req, res) {
		 res.sendfile(__dirname + '/static/messenger.html');
	     });

sio.sockets.on('connection',
	       function (socket) {
		   socket.emit('news', { hello: 'world' });
		   socket.on('my other event',
			     function (data) {
				 console.log(data);
			     });
	       });
