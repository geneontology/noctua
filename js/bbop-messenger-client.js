////
//// Let's try and communicate with the socket.io server for
//// messages and the like. For the time being, this is a brittle
//// and optional test. If it goes any where, it will be factored
//// out.
////

var bbop_messenger_client = function(msgloc,
				     on_connect,
				     on_initialization,
				     on_info_event,
				     on_clairvoyance_event,
				     on_telekinesis_event){

    var anchor = this;
    anchor.socket = null;
    anchor.model_id = null;
    anchor.okay_p = null;

    var logger = new bbop.logger('msg client');
    //logger.DEBUG = true;
    logger.DEBUG = false;
    function ll(str){ logger.kvetch(str); }

    // Check to make sure that the optional library was correctly
    // loaded.
    if( typeof(io) === 'undefined' || typeof(io.connect) === 'undefined' ){
	ll('was unable to load server.io from messaging server (io undefined)');
	anchor.okay_p = false;
    }else{
	ll('likely have the right setup--attempting');
	anchor.okay_p = true;
    }	

    // 
    anchor.okay = function(){
	var ret = false;
	//if( anchor.okay_p && anchor.socket && anchor.model_id ){
	if( anchor.okay_p ){
	    ret = true;
	}
	return ret;
    };

    // TODO: Specify the channel over and above the general server.
    // For the time being, just using the model id in the message.
    anchor.connect = function(model_id){
	if( ! anchor.okay() ){
	    ll('no good socket on connect; did you connect()?');
	}else{

	    // Set internal variables.
	    anchor.socket = io.connect(msgloc);
	    anchor.model_id = model_id;
	    
	    function _internal_on_connect(){
		
		// Emit general packet.
		var connect_packet = {
		    'model_id': anchor.model_id,
		    'message': 'new client connected',
		    'message_type': 'success'
		};
		anchor.socket.emit('info', connect_packet);
		
		// Run our external callback.
		if( typeof(on_connect) !== 'undefined' && on_connect ){
		    on_connect();
		}
	    }
	    anchor.socket.on('connect', _internal_on_connect);

	    // Our initialization data from the server.
	    function _got_initialization(data){
		var uid = data['user_id'] || '???';
		var ucolor = data['user_color'] || '???';

		ll('received initialization info: ' + uid);
		
		// Trigger whatever function we were given.
		if( typeof(on_initialization) !== 'undefined' &&
		    on_initialization ){
		    on_initialization(data);
		}
	    }
	    anchor.socket.on('intialization', _got_initialization);

	    // Setup to catch info events from the clients and pass them
	    // on if they were meant for us.
	    function _got_info(data){
		var mid = data['model_id'] || null;
		var uid = data['user_id'] || '???';
		var ucolor = data['user_color'] || '???';
		var signal = data['signal'] || '???';
		var intention = data['intention'] || '???';
		var message = data['message'] || '???';
		var message_type = data['message_type'] || '???';

		// Check to make sure it interests us.
		if( ! mid || mid != anchor.model_id ){
		    ll('skip info packet--not for us');
		}else{
		    ll('received info');
		
		    // Trigger whatever function we were given.
		    if(typeof(on_info_event) !== 'undefined' && on_info_event){
			on_info_event(data, uid, ucolor);
		    }
		}
	    }
	    anchor.socket.on('info', _got_info);

	    function _got_clairvoyance(data){
		var mid = data['model_id'] || null;
		var top = data['top'] || null;
		var left = data['left'] || null;
		var uid = data['user_id'] || '???';
		var ucolor = data['user_color'] || '#ffffff';

		// Check to make sure it interestes us.
		if( ! mid || mid != anchor.model_id ){
		    ll('skip info packet--not for us');
		}else{
		    //ll('received clairvoyance: ' + str);
		
		    // Trigger whatever function we were given.
		    if(typeof(on_clairvoyance_event) !== 'undefined' &&
		       on_clairvoyance_event){
			on_clairvoyance_event(uid, ucolor, top, left);
		    }
		}		
	    }
	    anchor.socket.on('clairvoyance', _got_clairvoyance);

	    function _got_telekinesis(data){
		var mid = data['model_id'] || null;
		var top = data['top'] || null;
		var left = data['left'] || null;
		var uid = data['user_id'] || '???';
		var iid = data['item_id'] || null;

		// Check to make sure it interestes us.
		if( ! mid || mid != anchor.model_id ){
		    ll('skip info packet--not for us');
		}else{
		    //ll('received telekinesis: ' + str);
		
		    // Trigger whatever function we were given.
		    if(typeof(on_telekinesis_event) !== 'undefined' &&
		       on_telekinesis_event){
			on_telekinesis_event(uid, iid, top, left);
		    }
		}		
	    }
	    anchor.socket.on('telekinesis', _got_telekinesis);
	}
    };

    // 
    anchor.info = function(data){
	if( ! anchor.okay() ){
	    ll('no good socket on info; did you connect()?');
	}else{
	    //ll('send info: (' + anchor.model_id + ') "' + str + '"');
	    ll('send info: (' + anchor.model_id + ')');

	    // Add in model ID.
	    data['model_id'] = anchor.model_id;
	    anchor.socket.emit('info', data);
	}
    };

    // Remote awareness of location.
    anchor.clairvoyance = function(top, left){
	if( ! anchor.okay() ){
	    ll('no good socket on location; did you connect()?');
	}else{
	    ll('send location: (' + anchor.model_id + ')');

	    var loc_packet = {
		model_id: anchor.model_id,
		top: top,
		left: left
	    };
	    anchor.socket.emit('clairvoyance', loc_packet);
	}
    };

    // Move objects at a distance.
    anchor.telekinesis = function(item_id, top, left){
	if( ! anchor.okay() ){
	    ll('no good socket on location; did you connect()?');
	}else{
	    ll('send location (tkn): (' + anchor.model_id + ')');

	    var tkn_packet = {
		model_id: anchor.model_id,
		top: top,
		left: left,
		item_id: item_id
	    };
	    anchor.socket.emit('telekinesis', tkn_packet);
	}
    };
};
