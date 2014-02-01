////
//// Let's try and communicate with the socket.io server for
//// messages and the like. For the time being, this is a brittle
//// and optional test. If it goes any where, it will be factored
//// out.
////

var bbop_messenger_client = function(msgloc){

    var logger = new bbop.logger('msg dbg');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Check to make sure that the optional library was correctly
    // loaded.
    if( typeof(io) === 'undefined' || typeof(io.connect) === 'undefined' ){
	ll('unable to load');
    }else{
	ll('likely have the right setup--attempting');
	
	// 
	var socket = io.connect(msgloc);
	socket.on('news', function (data) {
		      console.log(data);
		      socket.emit('my other event', { my: 'app_base' });
		  });
    }    
};
