// If it looks like we're in an environment that supports CommonJS
// Modules 1.0, bbop-js might not be extant in this namespace. Try and
// get at it. Otherwise, if we're in browser-land, it should be
// included in the global and we can proceed.
if( typeof(exports) != 'undefined' ){
    var bbop = require('bbop').bbop;
}
/* 
 * Package: bbopx.barista.response.js
 * 
 * Namespace: bbopx.barista.response
 * 
 * Generic BBOP handler for dealing with the gross parsing of
 * responses from the GO Molecular Model Manager REST server JSON
 * responses.
 * 
 * It will detect if the incoming response is structured correctly and
 * give safe access to fields and properties.
 * 
 * It is not meant to be a model for the parts in the data section.
 */

// if ( typeof bbop == "undefined" ){ var bbop = {}; }
// if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
// if ( typeof bbop.rest.response == "undefined" ){ bbop.rest.response = {}; }
// TODO/BUG: workaround until I get this properly folded into bbop-js.
if ( typeof bbopx == "undefined" ){ bbopx = {}; }
if ( typeof bbopx.barista == "undefined" ){ bbopx.barista = {}; }

/*
 * Constructor: response
 * 
 * Contructor for a Minerva REST JSON response object.
 * 
 * The constructor argument is an object or a string.
 * 
 * Arguments:
 *  raw - the JSON object as a string or object
 * 
 * Returns:
 *  response object
 */
bbopx.barista.response = function(raw){
    bbop.rest.response.call(this);
    this._is_a = 'bbopx.barista.response';

    // Required top-level strings in the response.
    // message and message_type are defined in the superclass.
    this._uid = null; // initiating user
    this._packet_id = null; // identify the packet
    this._intention = null; // what the user wanted to do ('query', 'action')
    this._signal = null; // 'merge', 'rebuild', 'meta', etc.

    // Optional top-level strings in the response.
    this._commentary = null;

    // Optional top-level objects.
    // Data contains model_id, inconsistency, etc.
    this._data = null;

    // Start with the assumption that the response is bad, try and
    // prove otherwise.
    this.okay(false);

    // Raw will only be provided in that cases that it makes sense.
    this._raw = null;
    
    // If we have no data coming in, there is a problem...
    if( ! raw ){
	
	this.message('empty response in handler');
	this.message_type('error');

    }else{

	// If we do have something coming in, And it looks like
	// something we might be able to deal with, do our best to
	// decode it.
	var itsa = bbop.core.what_is(raw);
	if( itsa != 'string' && itsa != 'object' ){
	    
	    // No idea what this thing is...
	    this.message('bad argument type in handler');
	    this.message_type('error');

	}else{
	    
	    // Try to make the string an object.
	    if( itsa == 'string' ){
		try {
		    this._raw = bbop.json.parse(raw);
		}catch(e){
		    // Didn't make it--chuck it to create a signal.
		    this._raw = null;
		    this.message('handler could not parse string response');
		    this.message_type('error');
		}
	    }else{
		// Looks like somebody else got here first.
		this._raw = raw;
	    }

	    // If we managed to define some kind of raw incoming data
	    // that is (or has been parsed to) a model, start probing
	    // it out to see if it is structured correctly.
	    if( this._raw ){

		// Check required fields.
		var jresp = this._raw;
		// These must always be defined.
		if( ! jresp['message_type'] || ! jresp['message'] ){
		    // Core info.
		    this.message_type('error');
		    this.message('message and message_type must always exist');
		}else{

		    // Take out the individual optional bits for
		    // examination.
		    var cdata = jresp['commentary'] || null;
		    var odata = jresp['data'] || null;

		    // If data, object.
		    if( odata && bbop.core.what_is(odata) != 'object' ){
		    // if( odata && bbop.core.what_is(odata) != 'object' &&
		    // 	bbop.core.what_is(odata) != 'array' ){
			this.message('data not object');
			this.message_type('error');
		    }else{
			// If commentary, string.
			if( cdata && bbop.core.what_is(cdata) != 'string' ){
			    this.message('commentary not string');
			    this.message_type('error');
			}else{
			    // Looks fine then I guess.
			    this.okay(true);

			    // Super-class.
			    this.message_type(jresp['message_type']);
			    this.message(jresp['message']);

			    // Plug in the other required fields.
			    this._uid = jresp['uid'] || 'unknown';
			    this._intention = jresp['intention'] || 'unknown';
			    this._signal = jresp['signal'] || 'unknown';
			    this._packet_id = jresp['packet_id'] || 'unknown';

			    // Add any additional fields.
			    if( cdata ){ this._commentary = cdata; }
			    if( odata ){ this._data = odata; }
			}
		    }
		}
	    }
	}
    }
};
bbop.core.extend(bbopx.barista.response, bbop.rest.response);

/*
 * Function: user_id
 * 
 * Returns the user id (uid) for a call if it was generated my a known
 * user.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string or null
 */
bbopx.barista.response.prototype.user_id = function(){
    var ret = null;
    if( this._uid ){ ret = this._uid; }
    return ret;
};

/*
 * Function: intention
 * 
 * Returns the user intention for a call.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string or null
 */
bbopx.barista.response.prototype.intention = function(){
    var ret = null;
    if( this._intention ){ ret = this._intention; }
    return ret;
};

/*
 * Function: signal
 * 
 * Returns the server's action signal, if there was one.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string or null
 */
bbopx.barista.response.prototype.signal = function(){
    var ret = null;
    if( this._signal ){ ret = this._signal; }
    return ret;
};

/*
 * Function: packet_id
 * 
 * Returns the response's unique id. Usful to make sure you're not
 * talking to yourself in some cases.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string or null
 */
bbopx.barista.response.prototype.packet_id = function(){
    var ret = null;
    if( this._packet_id ){ ret = this._packet_id; }
    return ret;
};

/*
 * Function: commentary
 * 
 * Returns the commentary object (whatever that might be in any given
 * case).
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  copy of commentary object or null
 */
bbopx.barista.response.prototype.commentary = function(){
    var ret = null;
    if( this._commentary ){
	ret = bbop.core.clone(this._commentary);
    }
    return ret;
};

/*
 * Function: data
 * 
 * Returns the data object (whatever that might be in any given
 * case). This grossly returns all response data, if any.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  copy of data object or null
 */
bbopx.barista.response.prototype.data = function(){
    var ret = null;
    if( this._data ){
	ret = bbop.core.clone(this._data);
    }
    return ret;
};

/*
 * Function: model_id
 * 
 * Returns the model id of the response.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string or null
 */
bbopx.barista.response.prototype.model_id = function(){
    var ret = null;
    if( this._data && this._data['id'] ){
	ret = this._data['id'];
    }
    return ret;
};

/*
 * Function: inconsistent_p
 * 
 * Returns true or false on whether or not the returned model is
 * thought to be inconsistent. Starting assumption is that it is not.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  true or false
 */
bbopx.barista.response.prototype.inconsistent_p = function(){
    var ret = false;
    if( this._data &&
	typeof(this._data['inconsistent_p']) !== 'undefined' &&
	this._data['inconsistent_p'] == true ){
	ret = true;
    }
    return ret;
};

/*
 * Function: facts
 * 
 * Returns a list of the facts in the response. Empty list if none.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbopx.barista.response.prototype.facts = function(){
    var ret = [];
    if( this._data && this._data['facts'] && 
	bbop.core.is_array(this._data['facts']) ){
	ret = this._data['facts'];
    }
    return ret;
};

/*
 * Function: properties
 * 
 * Returns a list of the properties in the response. Empty list if none.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbopx.barista.response.prototype.properties = function(){
    var ret = [];
    if( this._data && this._data['properties'] && 
	bbop.core.is_array(this._data['properties']) ){
	ret = this._data['properties'];
    }
    return ret;
};

/*
 * Function: individuals
 * 
 * Returns a list of the individuals in the response. Empty list if none.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbopx.barista.response.prototype.individuals = function(){
    var ret = [];
    if( this._data && this._data['individuals'] && 
	bbop.core.is_array(this._data['individuals']) ){
	ret = this._data['individuals'];
    }
    return ret;
};

/*
 * Function: inferred_individuals
 * 
 * Returns a list of the inferred_individuals in the response. Empty
 * list if none.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbopx.barista.response.prototype.inferred_individuals = function(){
    var ret = [];
    if( this._data && this._data['individuals_i'] && 
	bbop.core.is_array(this._data['individuals_i']) ){
	ret = this._data['individuals_i'];
    }
    return ret;
};

/*
 * Function: relations
 * 
 * Returns a list of the relations found in the response. Sometimes not
 * there, so check the return.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbopx.barista.response.prototype.relations = function(){
    var ret = [];
    if( this._data && this._data['relations'] && 
	bbop.core.is_array(this._data['relations']) ){
	ret = this._data['relations'];
    }
    return ret;
};

/*
 * Function: evidence
 * 
 * Returns a list of the evidence found in the response. Sometimes not
 * there, so check the return.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbopx.barista.response.prototype.evidence = function(){
    var ret = [];
    if( this._data && this._data['evidence'] && 
	bbop.core.is_array(this._data['evidence']) ){
	ret = this._data['evidence'];
    }
    return ret;
};

/*
 * Function: annotations
 * 
 * Returns a list of the (complex) annotations found in the
 * response. Sometimes not there, so check the return.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbopx.barista.response.prototype.annotations = function(){
    var ret = [];
    if( this._data && this._data['annotations'] && 
	bbop.core.is_array(this._data['annotations']) ){
	ret = this._data['annotations'];
    }
    return ret;
};

/*
 * Function: model_ids
 * 
 * Returns a list the model ids found in the response. Sometimes not
 * there, so check the return.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 *
 * See Also:
 *  <models_meta>
 */
bbopx.barista.response.prototype.model_ids = function(){
    var ret = [];
    if( this._data && this._data['model_ids'] && 
	bbop.core.is_array(this._data['model_ids']) ){
	ret = this._data['model_ids'];
    }
    return ret;
};

/*
 * Function: models_meta
 * 
 * Returns a hash of the model ids to models properties found in the
 * response.
 *
 * Sometimes not there, so check the return.
 *
 * WARNING: A work in progress, but this is intended as an eventual
 * replacement to model_ids.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  hash
 *
 * See Also:
 *  <model_ids>
 */
bbopx.barista.response.prototype.models_meta = function(){
    var ret = {};
    if( this._data && this._data['models_meta'] && 
	bbop.core.is_hash(this._data['models_meta']) ){
	ret = this._data['models_meta'];
    }
    return ret;
};

/*
 * Function: export
 * 
 * Returns the string of the export found in the return.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string
 */
bbopx.barista.response.prototype.export_model = function(){
    var ret = '';
    if( this._data && this._data['export'] ){
	ret = this._data['export'];
    }
    return ret;
};
////
//// Let's try and communicate with the socket.io server for
//// messages and the like.
////
//// There are two makor categories: "relay" and "query". Relays are
//// for passing information on to other clients (e.g. "where I am");
//// queries are for asking barista information about what it might
//// know (e.g. "where is X").
////

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.barista == "undefined" ){ bbopx.barista = {}; }

bbopx.barista.client = function(barista_location, token){
    bbop.registry.call(this, ['connect',
			      'initialization',
			      //'disconnect',
			      'relay', // catch-all
			      'merge', // data is raw response 
			      'rebuild', // data is raw response 
			      'message',
			      'clairvoyance',
			      'telekinesis',
			      'query']); // asking barista something for yourself
    this._is_a = 'bbopx.barista.client';

    var anchor = this;
    anchor._token = token;
    anchor.socket = null;
    anchor.model_id = null;
    anchor.okay_p = null;

    // These are the non-internal ones that we know about.
    var known_relay_classes = {
	'relay': true,
	// Specific forms of relay.
	'message': true,
	'merge': true,
	'rebuild': true,
	'clairvoyance': true,
	'telekinesis': true
    };
    var known_query_classes = {
	'query': true
    };

    var logger = new bbop.logger('barista client');
    logger.DEBUG = true;
    //logger.DEBUG = false;
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

    /*
     *
     */
    anchor.okay = function(){
	var ret = false;
	//if( anchor.okay_p && anchor.socket && anchor.model_id ){
	if( anchor.okay_p ){
	    ret = true;
	}
	return ret;
    };

    /*
     * Operate on your identifying token.
     */
    anchor.token = function(in_token){
	if( in_token ){
	    anchor._token = in_token;
	}
	return anchor._token;
    };

    /*
     * General structure for relaying information between clients.
     * Always check that the comm is on.
     * Always inject 'token' and 'model_id'.
     */
    anchor.relay = function(relay_class, data){
	if( ! anchor.okay() ){
	    ll('no good socket on location; did you connect()?');
	}else{
	    //ll('relay: (' + anchor.model_id + ', ' + anchor.token() + ')');

	    // Inject our data.
	    data['class'] = relay_class;
	    data['model_id'] = anchor.model_id;
	    data['token'] = anchor.token();

	    anchor.socket.emit('relay', data);
	}
    };

    /*
     * General structure for requesting information from Barista about
     * things it might know.
     * Always check that the comm is on.
     * Always inject 'token' and 'model_id'.
     */
    anchor.query = function(query_class, data){
	if( ! anchor.okay() ){
	    ll('no good socket on location; did you connect()?');
	}else{
	    ll('sending query: ('+ anchor.model_id +', '+ anchor.token() +')');

	    // Inject our data.
	    data['class'] = query_class;
	    data['model_id'] = anchor.model_id;
	    data['token'] = anchor.token();

	    anchor.socket.emit('query', data);
	}
    };

    /*
     * Wrapper for the only thing query is currently used for.
     */
    anchor.get_layout = function(){
	anchor.query('query', {'query': 'layout'});
    };

    /*
     * Required call before using messenger.
     */
    // TODO: Specify the channel over and above the general server.
    // For the time being, just using the model id in the message.
    anchor.connect = function(model_id){
	if( ! anchor.okay() ){
	    ll('no good socket on connect; did you connect()?');
	}else{

	    // Set internal variables and make actual connection.
	    //anchor.socket = io.connect(barista_location + '/messenger');
	    anchor.socket = io.connect(barista_location);
	    anchor.model_id = model_id;
	    anchor.socket_id = anchor.socket.id;
	    
	    function _inject_data_with_client_info(data){
		if( ! data ){
		    data = {};
		    //}else{
		}

		// // Standard.
		// data['model_id'] = anchor.model_id;
		// data['socket_id'] = anchor.socket_id;
		// data['token'] = anchor.token();

		// // Optional.
		// data['message_type'] = null;
		// data['message'] = null;
		// data['signal'] = null;
		// data['intention'] = null;
		// data['top'] = null;
		// data['left'] = null;
		// data['data'] = null;
		// data['state'] = null;
		
		return data;
	    }

	    // Check whether ot not we should ignore the incoming
	    // data.
	    function _applys_to_us_p(data){
		var ret = false;

		var mid = data['model_id'] || null;
		if( ! mid || mid != anchor.model_id ){
		    ll('skip packet--not for us');
		}else{
		    ret = true;
		}

		return ret;
	    }

	    // This internal connect is special since no data is
	    // actually coming from the outsice world.
	    anchor.socket.on('connect', function (empty_placeholder){
		var data = _inject_data_with_client_info(empty_placeholder);

		// Let others know that I have connected using the 
		data['message_type'] = 'success';
		data['message'] = 'new client connected';
		//anchor.socket.emit('relay', data);
		anchor.relay('message', data);

		// Run appropriate callbacks.
		ll('apply "connect" callbacks');
		anchor.apply_callbacks('connect', [data]);
	    });

	    // Our initialization data from the server.
	    anchor.socket.on('initialization', function (data){
		data = _inject_data_with_client_info(data);
		//ll('received initialization info from socket: ' + sid);
		
		// Run appropriate callbacks.
		ll('apply "initialization" callbacks');
		anchor.apply_callbacks('initialization', [data]);
	    });

	    // Setup to catch info events from the clients and pass
	    // them on if they were meant for us. 
	    anchor.socket.on('relay', function(data){
		data = _inject_data_with_client_info(data);

		// Check to make sure it interests us.
		if( _applys_to_us_p(data) ){

		    var dclass = data['class'];
		    if( ! dclass ){
			ll('no relay class found');
		    }else if( ! known_relay_classes[dclass] ){
			ll('unknown relay class: ' + dclass);
		    }else{
			// Run appropriate callbacks.
			ll('apply (relay) "'+ dclass +'" callbacks');
			anchor.apply_callbacks(dclass, [data]);
		    }
		}
	    });

	    // Setup to catch query events from things we'veasked
	    // barista.
	    anchor.socket.on('query', function(data){
		data = _inject_data_with_client_info(data);

		// Check to make sure it interests us.
		if( _applys_to_us_p(data) ){

		    var dclass = data['class'];
		    if( ! dclass ){
			ll('no query class found');
		    }else if( ! known_query_classes[dclass] ){
			ll('unknown query class: ' + dclass);
		    }else{
			// Run appropriate callbacks.
			ll('apply (query) "'+ dclass +'" callbacks');
			anchor.apply_callbacks(dclass, [data]);
		    }
		}
	    });
     	}
    };

    // 
    anchor.message = function(m){
	m['class'] = 'message';
	// var packet = {
	//     'class': 'message',
	//     'message_type': m['message_type'],
	//     'message': m['message'],
	//     'me': m['message_type'],
	//     'message_type': m['message_type']
	// };
	// anchor.relay('message', packet);
	anchor.relay('message', m);
    };

    // Remote awareness of our location.
    anchor.clairvoyance = function(top, left){
	var packet = {
	    'class': 'clairvoyance',
	    'top': top,
	    'left': left
	};
	anchor.relay('clairvoyance', packet);
    };

    // Move objects at a distance.
    anchor.telekinesis = function(item_id, top, left){
	var packet = {
	    'class': 'telekinesis',
	    'objects': [{
		'item_id': item_id,
		'top': top,
		'left': left
	    }]
	};
	anchor.relay('telekinesis', packet);
    };

};
bbop.core.extend(bbopx.barista.client, bbop.registry);
if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.minerva == "undefined" ){ bbopx.minerva = {}; }

/*
 * Constructor: bbopx.minerva.manager
 * 
 * A manager for handling the AJAX and registry.
 * Initial take from bbop.golr.manager.
 * 
 * Arguments:
 *  barista_location - string for invariant part of API
 *  namespace - string for namespace of API to use
 *  app_blob - JSON object that defines targets
 *  user_token - identifying string for the user of the manager (Barista token)
 * 
 * Returns:
 *  a classic manager
 */
bbopx.minerva.manager = function(barista_location, namespace, user_token){
    bbop.registry.call(this, ['prerun', // internal; anchor only
			      'postrun', // internal
			      'manager_error', // internal/external...odd
			      //'success', // uninformative
			      'merge',
			      'rebuild',
			      'meta',
			      'warning', // trump
			      'error' //trump
			     ]);
    this._is_a = 'bbopx.minerva.manager';
    var anchor = this;

    //var url = barista_location + '/api/' + namespace + '/m3Batch';
    anchor._url = null;
    // 
    anchor._user_token = user_token;

    // Will use this one other spot, where the user can change the
    // token.
    function _set_url_from_token(in_token){	
	var url = null;
	if( in_token ){
	    url = barista_location + '/api/' + namespace + '/m3BatchPrivileged';
	}else{
	    url = barista_location + '/api/' + namespace + '/m3Batch';
	}
	anchor._url = url;
	return url;
    }
    _set_url_from_token(user_token);

    // An internal manager for handling the unhappiness of AJAX callbacks.
    //var jqm = new bbop.rest.manager.jquery(bbop.rest.response.mmm);
    var jqm = new bbop.rest.manager.jquery(bbopx.barista.response);
    jqm.use_jsonp(true); // we are definitely doing this remotely

    function _on_fail(resp, man){
	// See if we got any traction.
	if( ! resp || ! resp.message_type() || ! resp.message() ){
	    // Something dark has happened, try to put something
	    // together.
	    // console.log('bad resp!?: ', resp);
	    var resp_seed = {
		'message_type': 'error',
		'message': 'deep manager error'
	    }
	    resp = new bbopx.barista.response(resp_seed);
	}
	anchor.apply_callbacks('manager_error', [resp, anchor]);
    }
    jqm.register('error', 'foo', _on_fail);

    // When we have nominal success, we still need to do some kind of
    // dispatch to the proper functionality.
    function _on_nominal_success(resp, man){
	
	// Switch on message type when there isn't a complete failure.
	var m = resp.message_type();
	if( m == 'error' ){
	    // Errors trump everything.
	    anchor.apply_callbacks('error', [resp, anchor]);
	}else if( m == 'warning' ){
	    // Don't really have anything for warning yet...remove?
	    anchor.apply_callbacks('warning', [resp, anchor]);
	}else if( m == 'success' ){
	    var sig = resp.signal();
	    if( sig == 'merge' || sig == 'rebuild' || sig == 'meta' ){
		anchor.apply_callbacks(sig, [resp, anchor]);		
	    }else{
		alert('unknown signal: very bad');
	    }
	}else{
	    alert('unimplemented message_type');	    
	}

	// Postrun goes no matter what.
	anchor.apply_callbacks('postrun', [resp, anchor]);
    }
    jqm.register('success', 'bar', _on_nominal_success);

    ///
    /// Control our identity.
    ///

    /**
     * DEPRECATED: use user_token()
     */
    anchor.user_id = function(user_token){
	return anchor.user_token(user_token);
    };

    /**
     * Get/set the user token
     */
    anchor.user_token = function(user_token){

	// Adjust the internal token.
	if( user_token ){
	    anchor._user_token = user_token;
	}

	// Make sure we're using the right URL considering how we're
	// identified.
	_set_url_from_token(anchor._user_token);

	return anchor._user_token;
    };


    ///
    /// Actual mechanism.
    ///

    // Intent: "query".
    // Expect: "success" and "rebuild".
    anchor.get_model = function(model_id){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'query');
	var req = new bbopx.minerva.request('model', 'get');
	req.model_id(model_id);
	reqs.add(req);

	var args = reqs.callable();	
	anchor.apply_callbacks('prerun', [anchor]);
	//console.log('get_model anchor._url: ' + anchor._url);
	//console.log('get_model args: ', args);
	//console.log('get_model ass: ' + jqm.assemble());
	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "query".
    // Expect: "success" and "meta".
    anchor.get_model_ids = function(){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'query');
	var req = new bbopx.minerva.request('model', 'all-model-ids');
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "query".
    // Expect: "success" and "meta".
    anchor.get_models_meta = function(){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'query');
	var req = new bbopx.minerva.request('model', 'all-model-meta');
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "merge".
    anchor.add_fact = function(model_id, source_id, target_id, rel_id){

	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('edge', 'add');
	req.model_id(model_id);
	req.fact(source_id, target_id, rel_id);
	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "merge".
    anchor.remove_fact = function(model_id, source_id, target_id, rel_id){

	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('edge', 'remove');
	req.model_id(model_id);
	req.fact(source_id, target_id, rel_id);
	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "merge".
    anchor.add_simple_composite = function(model_id, class_id,
    					   enabled_by_id, occurs_in_id){

	// Minimal requirements.
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'create');
	req.model_id(model_id);
	req.subject_class(class_id);

	// Optional set expressions.
	if( enabled_by_id ){
	    //req.svf_expressions(enabled_by_id, 'enabled_by');
	    req.svf_expressions(enabled_by_id, 'RO:0002333');
	}
	if( occurs_in_id ){
	    req.svf_expressions(occurs_in_id, 'occurs_in');	    
	}
	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "merge".
    anchor.add_class = function(model_id, individual_id, class_id){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'add-type');
	req.model_id(model_id);
	req.individual(individual_id);
	req.class_expressions(class_id);

	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "merge".
    anchor.add_svf = function(model_id, individual_id, class_id, property_id){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'add-type');
	req.model_id(model_id);
	req.individual(individual_id);
	req.svf_expressions(class_id, property_id);

	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "merge".
    anchor.remove_class = function(model_id, individual_id, class_id){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'remove-type');
	req.model_id(model_id);
	req.individual(individual_id);
	req.class_expressions(class_id);

	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "merge".
    anchor.remove_class_expression = function(model_id, individual_id,
					      class_id, type){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'remove-type');
	req.model_id(model_id);
	req.individual(individual_id);
	req.complex_class_expressions(class_id, type);

	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.remove_individual = function(model_id, indv_id){

	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'remove');
	req.model_id(model_id);
	req.individual(indv_id);
	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "query".
    // Expect: "success" and "meta".
    anchor.export_model = function(model_id, format){

	if( typeof(format) === 'undefined' ){ format = 'default'; }

	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'query');
	var req = null;
	if( format == 'gaf' ){
	    req = new bbopx.minerva.request('model', 'export-legacy');
	    req.add('format', 'gaf');
	}else if( format == 'gpad' ){
	    req = new bbopx.minerva.request('model', 'export-legacy');
	    req.add('format', 'gpad');
	}else{
	    // Default (non-legacy) case is simpler.
	    req = new bbopx.minerva.request('model', 'export');
	}

	// Add the model to the request.
	req.model_id(model_id);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.import_model = function(model_string){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'import');
	req.add('importModel', model_string);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.store_model = function(model_id){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'query');
	var req = new bbopx.minerva.request('model', 'store');
	req.model_id(model_id);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.add_individual_annotation = function(model_id, indv_id, key, value){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'add-annotation');
	req.model_id(model_id);
	req.individual(indv_id);
	req.annotation_values(key, value);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.add_fact_annotation = function(model_id,
					  source_id, target_id, rel_id,
					  key, value){

	//
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('edge', 'add-annotation');
	req.model_id(model_id);
	req.fact(source_id, target_id, rel_id);
	req.annotation_values(key, value);
	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.add_model_annotation = function(model_id, key, value){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'add-annotation');
	req.model_id(model_id);
	req.annotation_values(key, value);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.remove_individual_annotation =function(model_id, indv_id, key, value){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('individual', 'remove-annotation');
	req.model_id(model_id);
	req.individual(indv_id);
	req.annotation_values(key, value);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.remove_fact_annotation = function(model_id,
					     source_id, target_id, rel_id,
					     key, value){

	//
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('edge', 'remove-annotation');
	req.model_id(model_id);
	req.fact(source_id, target_id, rel_id);
	req.annotation_values(key, value);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.remove_model_annotation =function(model_id, key, value){

	// 
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'remove-annotation');
	req.model_id(model_id);
	req.annotation_values(key, value);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.generate_model_by_class_and_db = function(class_id, db_id){

	//
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'generate');
	req.add('db', db_id);
	req.add('subject', class_id);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.generate_model_by_db = function(db_id){

	//
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'generate-blank');
	req.add('db', db_id);
	reqs.add(req);
	
	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.generate_model_by_taxon = function(taxon_id){

	//
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'generate-blank');
	req.add('taxonId', taxon_id);
	reqs.add(req);
	
	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.generate_model = function(){

	//
	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');
	var req = new bbopx.minerva.request('model', 'generate-blank');
	reqs.add(req);
	
	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.capella_bootstrap_model = function(bootstrap_obj, term2aspect){

	var reqs = new bbopx.minerva.request_set(anchor.user_token(), 'action');

	// Just get a new model going.
	var req = new bbopx.minerva.request('model', 'generate-blank');
	//req.add('db', db_id); // unecessary
	reqs.add(req);

	var each = bbop.core.each;
	each(bootstrap_obj, function(ob){

	    // Now, for each of these, we are going to be adding
	    // stuff to MF instances. If there is no MF coming
	    // in, we are just going to use GO:0003674.
	    var mfs = [];
	    var bps = [];
	    var ccs = [];
	    each(ob['terms'], function(tid){
		if( term2aspect[tid] == 'molecular_function' ){
		    mfs.push(tid);
		}else if( term2aspect[tid] == 'biological_process' ){
		    bps.push(tid);
		}else if( term2aspect[tid] == 'cellular_component' ){
		    ccs.push(tid);
		}
	    });
	    // There must be this no matter what.
	    if( bbop.core.is_empty(mfs) ){
 		mfs.push('GO:0003674');
	    }

	    // We are going to be creating instances off of the
	    // MFs.
	    each(mfs, function(mf){
		var req = new bbopx.minerva.request('individual','create');
			  
		// Add in the occurs_in from CC.
		each(ccs, function(cc){
		    req.svf_expressions(cc, 'occurs_in');
		});

		// Add in the enabled_by from entities.
		each(ob['entities'], function(ent){
		    req.svf_expressions(ent, 'RO:0002333');
		});
	    });		 
	});

	// Final send-off.
	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
};
bbop.core.extend(bbopx.minerva.manager, bbop.registry);
/* 
 * Package: requests.js
 * 
 * Namespace: bbopx.minerva.request/bbopx.minerva.request_set
 * 
 * Handle requests to Minerva in a somewhat structured way.
 * 
 * NOTE: This might eventually find its way into bbop-js.
 */

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.minerva == "undefined" ){ bbopx.minerva = {}; }

/*
 * Constructor: requests
 * 
 * Contructor for a Minerva request item.
 * 
 * Arguments:
 *  entity - string
 *  operation - string
 * 
 * Returns:
 *  request object
 */
bbopx.minerva.request = function(entity, operation){
    var anchor = this;

    // "individual", "edge", "model", "relations"
    anchor._entity = entity;

    // "get", "remove", "add", "generate", etc.
    anchor._operation = operation;
    
    //	
    anchor._arguments = {};

    anchor.bundle = function(){
	return {
	    'entity': anchor._entity,
	    'operation': anchor._operation,
	    'arguments': anchor._arguments
	};
    };

    // Generic.
    anchor.add = function(key, val){
	anchor._arguments[key] = val;
    };

    anchor.model_id = function(model_id){
	anchor.add('modelId', model_id);
    };

    anchor.fact = function(sub_id, obj_id, pred_id){
	anchor.add('subject', sub_id);
	anchor.add('object', obj_id);
	anchor.add('predicate', pred_id);
    };

    anchor.individual = function(ind_id){
	anchor.add('individual', ind_id);
    };

    anchor.subject_class = function(class_id){
	anchor.add('subject', class_id);
    };

    anchor.annotation_values = function(key, val){
	// Our list of values must be defined if we go this way.
	if( ! anchor._arguments['values'] ){
	    anchor._arguments['values'] = [];
	}
	anchor._arguments['values'].push({'key': key, 'value': val});
    };

    /**
     * Special use.
     * A short form for "addition" requests that can overload the
     * literal (on the server side) with Manchester syntax.
     */
    anchor.svf_expressions = function(class_id, property_id){
	// Our list of expressions must be defined if we go this way.
        if( ! anchor._arguments['expressions'] ){
            anchor._arguments['expressions'] = [];
        }
	var expression = {
            'type': 'svf',
            'literal': class_id,
            'onProp': property_id
	};
	anchor._arguments['expressions'].push(expression);
    };

    /**
     * General use for simple ops.
     */
    anchor.class_expressions = function(class_id){
	// Our list of expressions must be defined if we go this way.
	if( ! anchor._arguments['expressions'] ){
	    anchor._arguments['expressions'] = [];
	}
	var expression = {
	    'type': 'class',
	    'literal': class_id
	};
	anchor._arguments['expressions'].push(expression);
    };

    // Create a usable argument bundle from a type.
    function _gen_class_exp(type){

	var each = bbop.core.each;
	
	// We'll return this.
	var expression = {};
	
	// Extract type.
	var t = type.type(); 
	if( t == 'class' ){ // trivial
	    expression['type'] = 'class';
	    expression['literal'] = type.class_id();
	}else if( t == 'union' || t == 'intersection' ){

	    expression['type'] = t;

	    // Recursively add all of the types in the frame.
	    var ecache = [];
	    var frame = type.frame();
	    each(frame,
		 function(ftype){
		     ecache.push(_gen_class_exp(ftype));
		 });
	    expression['expressions'] = ecache;
	    
	}else if( t == 'svf' ){

	    // Easy part of SVF.
	    expression['type'] = 'svf';
	    expression['onProp'] = type.property_id();
	    
	    // The hard part: grab or recur.
	    var svfce = type.svf_class_expression();
	    var st = svfce.type();
	    if( st == 'class' ){
		expression['literal'] = svfce.class_id();
	    }else if( t == 'union' || t == 'intersection' || t == 'svf' ){
		expression['expressions'] = [_gen_class_exp(svfce)];
	    }else{
		throw new Error('unknown type in sub-request prcessing: ' + st);
	    }
	    
	}else{
	    throw new Error('unknown type in request prcessing: ' + t);
	}

	return expression;
    }

    anchor.complex_class_expressions = function(class_id, type){
	// Our list of expressions must be defined if we go this way.
	if( ! anchor._arguments['expressions'] ){
	    anchor._arguments['expressions'] = [];
	}

	// May be very complicated--recursively assemble.
	var expression = _gen_class_exp(type);

	anchor._arguments['expressions'].push(expression);
    };
};

/*
 * Constructor: request_set
 * 
 * Contructor for a Minerva request item set.
 * 
 * Arguments:
 *  entity - string
 *  operation - string
 * 
 * Returns:
 *  request object
 */
bbopx.minerva.request_set = function(user_token, intention){
    var anchor = this;

    var each = bbop.core.each;

    anchor._user_token = user_token || null;
    anchor._intention = intention;
    anchor._requests = [];
    
    anchor.add = function(req){
	anchor._requests.push(req);
    };

    anchor.callable = function(){

	// Ready the base return.
	var rset = {
	    'token': anchor._user_token,
	    'intention': anchor._intention
	};

	// Add a JSON stringified request arguments.
	var reqs = [];
	each(anchor._requests,
	     function(req){
		 reqs.push(req.bundle());
	     });
	var str = bbop.json.stringify(reqs);
	var enc = encodeURIComponent(str);
	rset['requests'] = enc;

	return rset;
    };
};

////
//// ...
////

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.noctua == "undefined" ){ bbopx.noctua = {}; }

// var bbopx.noctua.categorize = function(in_type){

//     var ret = {
// 	category: 'unknown',
// 	text: '???'
//     };

//     var t = in_type['type'];
//     if( t == 'Class' ){
// 	var i = in_type['id'];
// 	var l = in_type['label'];
// 	ret['category'] = 'instance_of';
// 	ret['text'] = l + ' (' + i + ')';
//     }else if( t == 'Restriction' ){
// 	var thing = in_type['someValuesFrom']['id'];
// 	var thing_rel = in_type['onProperty']['id'];
// 	ret['category'] = thing_rel;
// 	ret['text'] = thing_rel + ' (' + thing + ')';
//     }

//     return ret;
// };

/**
 * Return a single-line text-only one-level representation of a type.
 */
bbopx.noctua.type_to_minimal = function(in_type, aid){

    var ret = '[???]';
    
    var t = in_type.type();
    var f = in_type.frame();

    if( t == 'class' ){
	ret = in_type.class_label();
    }else if( t == 'union' || t == 'intersection' ){
	ret = t + '[' + f.length + ']';
    }else{
	// SVF a little harder.
	var ctype = in_type.category();
	var ctype_r = aid.readable(ctype);

	// Probe it a bit.
	var ce = in_type.svf_class_expression();
	var cetype = ce.type();

	var inner_lbl = '???';
	if( cetype == 'class' ){
	    inner_lbl = ce.class_label();
	}else if( cetype == 'union' || cetype == 'intersection' ){
	    var cef = ce.frame();
	    inner_lbl = cetype + '[' + cef.length + ']';
	}else{
	    inner_lbl = '[SVF]';
	}

	//var cr = aid.readable(cat);
	ret = ctype_r + '(' + inner_lbl + ')';
    }

    // A little special "hi" for inferred types.
    if( in_type.inferred_p() ){
	ret = '[' + ret + ']';
    }

    return ret;
};

// /*
//  * 
//  */
// var bbopx.noctua.type_to_expanded = function(in_type, aid){

//     var text = '[???]';

//     var t = in_type.type();
//     //var ft = in_type.frame_type();
//     var ft = null;
//     var f = in_type.frame();
//     if( t == 'Class' && ft == null ){
// 	text = in_type.class_label() + ' (' + in_type.class_id() + ')';
//     }else if( t == 'Restriction' && ft == null ){
// 	var thing = in_type.class_label();
// 	var thing_prop = in_type.property_label();
// 	text = aid.readable(thing_prop) + '(' + thing + ')';
//     }else if( ft == 'intersectionOf' ){
// 	var thing_prop = in_type.property_label();
// 	text = aid.readable(thing_prop) + '(' + ft + '[' + f.length + '])';
//     }else if( ft == 'unionOf' ){
// 	text = ft + '[' + f.length + ']';
//     }

//     return text;
// };

/**
 * Essentially, minimal rendered as a usable span, with a color
 * option.
 */
bbopx.noctua.type_to_span = function(in_type, aid, color_p){

    var min = bbopx.noctua.type_to_minimal(in_type, aid);
    //var exp = bbopx.noctua.type_to_expanded(in_type, aid);

    var text = null;
    if( color_p ){
	text = '<span ' +
	    'style="background-color: ' + aid.color(in_type.category()) + ';" ' +
	    'alt="' + min + '" ' +
	    'title="' + min +'">' +
	    min + '</span>';
    }else{
	text = '<span alt="' + min + '" title="' + min +'">' + min + '</span>';
    }

    return text;
};

/**
 * A recursive writer for when we no longer care--a table that goes on
 * and on...
 */
bbopx.noctua.type_to_full = function(in_type, aid){
    var anchor = this;
    var each = bbop.core.each;

    var text = '[???]';

    var t = in_type.type();
    if( t == 'class' ){ // if simple, the easy way out
	text = bbopx.noctua.type_to_minimal(in_type, aid);
    }else{
	// For everything else, we're gunna hafta do a little
	// lifting...
	var cache = [];
	if( t == 'union' || t == 'intersection' ){
	    
	    // Some kind of recursion on a frame then.
	    cache = [
		'<table width="80%" class="table table-bordered table-hover table-condensed mme-type-table" ' +
		    'style="background-color: ' +
	     	    aid.color(in_type.category()) + ';">',
		'<caption>' + t + '</caption>',
		//'<thead style="background-color: white;">',
		'<thead style="">',
		'</thead>',
		'<tbody>'
	    ];
	    // cache.push('<tr>'),
	    var frame = in_type.frame();
	    each(frame,
		 function(ftype){
		     cache.push('<tr style="background-color: ' +
		     		aid.color(ftype.category()) + ';">'),
		     cache.push('<td>');
		     // cache.push('<td style="background-color: ' +
	     	     // 		aid.color(ftype.category()) + ';">'),
		     cache.push(bbopx.noctua.type_to_full(ftype, aid));
		     cache.push('</td>');
		     cache.push('</tr>');
		 });	
	    // cache.push('</tr>');
	    cache.push('</tbody>');
	    cache.push('</table>');
	    
	    text = cache.join('');	    

	}else{

	    // A little harder: need to a an SVF wrap before I recur.
	    var pid = in_type.property_id();
	    var plabel = in_type.property_label();
	    var svfce = in_type.svf_class_expression();
	    cache = [
		'<table width="80%" class="table table-bordered table-hover table-condensed mme-type-table">',
		'<thead style="background-color: ' + aid.color(pid) + ';">',
		plabel,
		'</thead>',
		'<tbody>'
	    ];
	    cache.push('<tr style="background-color: ' +
		       aid.color(svfce.category()) + ';"><td>'),
	    cache.push(bbopx.noctua.type_to_full(svfce, aid));
	    cache.push('</td></tr>');
	    cache.push('</tbody>');
	    cache.push('</table>');
	    
	    text = cache.join('');
	}
    }


    // var min = bbopx.noctua.type_to_minimal(in_type, aid);
    // var exp = bbopx.noctua.type_to_expanded(in_type, aid);
    // var text = '<span alt="' + exp + '" title="' + exp +'">' + min + '</span>';

    return text;
};

// {
//   "type": "Class",
//   "label": "phosphatase activity",
//   "id": "GO_0016791"
// }
///// 
// {
//   "someValuesFrom": {
//     "type": "Class",
//     "id": "WB_WBGene00000913"
//   },
//   "type": "Restriction",
//   "onProperty": {
//     "type": "ObjectProperty",
//     "id": "enabled_by"
//   }
/////
// {
//   "onProperty": {
//     "id": "RO:0002333",
//     "type": "ObjectProperty",
//     "label": "enabled_by"
//   },
//   "type": "Restriction",
//   "someValuesFrom": {
//     "intersectionOf": [
//       {
//         "id": "GO:0043234",
//         "type": "Class",
//         "label": "protein complex"
//       },
//       {
//         "onProperty": {
//           "id": "BFO:0000051",
//           "type": "ObjectProperty",
//           "label": "has part"
//         },
//         "type": "Restriction",
//         "someValuesFrom": {
//           "id": "UniProtKB:P0002",
//           "type": "Class"
//         }
//       },
//       {
//         "onProperty": {
//           "id": "BFO:0000051",
//           "type": "ObjectProperty",
//           "label": "has part"
//         },
//         "type": "Restriction",
//         "someValuesFrom": {
//           "id": "UniProtKB:P0003",
//           "type": "Class"
//         }
//       }
//     ]
//   }
// }

// // Support CommonJS if it looks like that's how we're rolling.
// if( typeof(exports) != 'undefined' ){
//     //exports.bbop_mme_context = bbop_mme_context;
//     //exports.bbop_type_to_tcell = bbop_type_to_tcell;
// }

////
//// Playing with graph area scroll.
//// Take a look at:
////  http://hitconsultants.com/dragscroll_scrollsync/scrollpane.html
////

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.noctua == "undefined" ){ bbopx.noctua = {}; }

bbopx.noctua.draggable_canvas = function(container_id){

    var logger = new bbop.logger('drag');
    //logger.DEBUG = true;
    logger.DEBUG = false;
    function ll(str){ logger.kvetch(str); }

    var container_div = '#' + container_id;

    // TODO: This /should/ have worked, but the way the SVG is layed in
    // seems to make in not work very well at all.
    //jQuery(graph_div).draggable();

    // Hand made--not great either...
    var px = -1;
    var py = -1;
    function _update_start_pos(down_evt){
    	px = down_evt.pageX;
    	py = down_evt.pageY;
    	ll("down at: " + px + "," + py);
	// TODO: start cursor drag
    }
    function _scroller(move_evt){
	var page_x = move_evt.pageX;
	var page_y = move_evt.pageY;
    	var offx = page_x - px;
    	var offy = page_y - py;
	var pos_left = jQuery(container_div).position().left;
	var pos_top = jQuery(container_div).position().top;
	var old_left = jQuery(container_div).scrollLeft();
	var old_top = jQuery(container_div).scrollTop();
	var scroll_width = jQuery(container_div).get(0).scrollWidth;
	var scroll_height= jQuery(container_div).get(0).scrollHeight;
	var dim_width = jQuery(container_div).width();
	var dim_height = jQuery(container_div).height();
    	ll('scrolling: ' +
	   //'p:' + px + "," + py + '; ' +
	   'page:' + page_x + "," + page_y + '; ' +
	   'off: ' + offx + "," + offy + '; ' +
	   'pos: ' + pos_left + "," + pos_top + '; ' + 
	   'old: ' + old_left + "," + old_top + '; ' + 
	   'scroll: ' + scroll_width + "," + scroll_height + '; ' + 
	   'dim: ' + dim_width + "," + dim_height);

	// Check bounds, unbind if we stray.
	// TODO: complete if this is actually effective; get the
	// feeling it's not.
	if( pos_top >= page_y || // top
	    dim_height + pos_top <= page_y ){ //bottom
	    ll('dimensional unbind');
	    _unbind_scroller();
	}else{
	    // Otherwise, make the move.
	    jQuery(container_div).scrollLeft(old_left - offx);
	    jQuery(container_div).scrollTop(old_top - offy);
    	    px = move_evt.pageX;
    	    py = move_evt.pageY;	    
	}
    }
    function _unbind_scroller(){
    	jQuery(container_div).unbind('mousemove', _scroller);
	// TODO: revert cursor
    }
    
    // Stat on mouse down.
    jQuery(container_div).mousedown(
    	function(e){
	    if( this == e.target ){ // only stat if actual, not child
    		_update_start_pos(e);
    		// Bind to moving.
    		jQuery(container_div).bind('mousemove', _scroller);
	    }
    	});

    // Stop for almost any reason.
    jQuery(container_div).mouseup(
    	function(e){
    	    ll('unbind on mouseup');
    	    _unbind_scroller();
    	});
    jQuery(container_div).mouseout(
    	function(e){
    	    ll('unbind on mouseup');
    	    _unbind_scroller();
    	});
    jQuery(container_div).mouseleave(
    	function(e){
    	    ll('unbind on mouseleave');
    	    _unbind_scroller();
    	});
    jQuery(container_div).select( // to trigger, we're moving fast
    	function(e){
    	    ll('unbind on select');
    	    _unbind_scroller();
    	});
    // jQuery(container_div).blur(
    // 	function(e){
    // 	    ll('unbind on blur');
    // 	    _unbind_scroller();
    // 	});
    // jQuery(container_div).focusout(
    // 	function(e){
    // 	    ll('unbind on focusout');
    // 	    _unbind_scroller();
    // 	});
}
///
/// Core edit model. Essentially several sets and an order.
/// This is meant to be changed when we get a richer model working,
/// but for the prototype, I don't want to lock in to the bbop
/// graph model, so I'm using something much dumber than can
/// be easily wrapped or changed later, but still have some editing
/// options.
///

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.noctua == "undefined" ){ bbopx.noctua = {}; }
if ( typeof bbopx.noctua.edit == "undefined" ){ bbopx.noctua.edit = {}; }

// BUG/TODO:
// Temporary cleansing until 
//bbopx.noctua.context = new bbop.context(amigo.data.context);
bbopx.noctua.clean = function(str){
    //return bbopx.noctua.context.cleanse(str);  
    return str;
};

/*
 * Edit annotations.
 * Everything can take annotations.
 * 
 * Parameters:
 *  kv_set - *[optional]* a set of keys and values; a simple object
 */
bbopx.noctua.edit.annotation = function(kv_set){
    this._id = bbop.core.uuid();

    this._properties = {};

    if( kv_set && bbop.core.what_is(kv_set) == 'object' ){
	this._properties = bbop.core.clone(kv_set);
    }
};

bbopx.noctua.edit.annotation.prototype.id = function(){ return this._id; };

bbopx.noctua.edit.annotation.prototype.property = function(key, value){

    var anchor = this;
    var ret = null;

    // Set if the key and value are there.
    if( key ){
	if( typeof(value) !== 'undefined' ){
	    anchor._properties[key] = value;
	}
	ret = anchor._properties[key];
    }

    return ret;
};

bbopx.noctua.edit.annotation.prototype.delete_property = function(key){

    var anchor = this;
    var ret = null;

    if( key ){
	ret = delete anchor._properties[key];
    }

    return ret;
};

///
/// Generic annotation operations
///

bbopx.noctua.edit._annotations = function(in_ann){
    if( in_ann && bbop.core.what_is(in_ann) == 'array' ){
	this._annotations = in_ann;
    }
    return this._annotations;
};
bbopx.noctua.edit._add_annotation = function(in_ann){
    if( in_ann && bbop.core.what_is(in_ann) != 'array' ){
	this._annotations.push(in_ann);
    }
    return this._annotations;
};
bbopx.noctua.edit._get_annotations_by_filter = function(filter){

    var anchor = this;
    var ret = [];
    bbop.core.each(anchor._annotations, function(ann){
	var res = filter(ann);
	if( res && res == true ){
	    ret.push(ann);
	}
    });
    return ret;
};
bbopx.noctua.edit._get_annotation_by_id = function(aid){

    var anchor = this;
    var ret = null;
    bbop.core.each(anchor._annotations, function(ann){
	if( ann.id() == aid ){
	    ret = ann;
	}
    });
    return ret;
};

/*
 *  Edit control.
 * 
 * Parameters:
 *  n/a
 */
bbopx.noctua.edit.core = function(){
    this.core = {
	//'id': [], // currently optional
	'id': null, // currently optional
	'nodes': {}, // map of id to edit_node
	'edges': {}, // map of id to edit_edge
	'node_order': [], // initial table order on redraws
	'node2elt': {}, // map of id to physical object id
	'elt2node': {},  // map of physical object id to id
	// Remeber that edge ids and elts ids are the same, so no map
	// is needed.
	'edge2connector': {}, // map of edge id to virtual connector id
	'connector2edge': {}  // map of virtual connector id to edge id 
    };

    this._annotations = [];
};

bbopx.noctua.edit.core.prototype.add_id = function(id){
    // TODO: make this smarter/useful
    //this.core['id'].push(id);
    this.core['id'] = id;
    return this.core['id'];
};

bbopx.noctua.edit.core.prototype.get_id = function(){
    return this.core['id'];
};

bbopx.noctua.edit.core.prototype.add_node = function(enode){

    // Add/update node.
    var enid = enode.id();
    this.core['nodes'][enid] = enode; // add to nodes

    // Only create a new elt ID and order if one isn't already in
    // there (or reuse things to keep GUI working smoothly).
    var elt_id = this.core['node2elt'][enid];
    if( ! elt_id ){ // first time
	this.core['node_order'].unshift(enid); // add to default order
	elt_id = bbop.core.uuid(); // generate the elt id we'll use from now on
	this.core['node2elt'][enid] = elt_id; // map it
	this.core['elt2node'][elt_id] = enid; // map it	
    }
};

// Convert the JSON-LD lite model into the edit core.
// Creates or adds as necessary.
bbopx.noctua.edit.core.prototype.add_node_from_individual = function(indv){
    var anchor = this;

    var ret = null;

    // Add individual to edit core if properly structured.
    var iid = indv['id'];
    if( iid ){
	//var nn = new bbop.model.node(indv['id']);
	//var meta = {};
	//ll('indv');
	
	// See if there is type info that we want to add.
	var itypes = indv['type'] || [];
	if( bbop.core.what_is(itypes) != 'array' ){
	    throw new Error('types is wrong');
	}

	// Create the node.
	var ne = new bbopx.noctua.edit.node(iid, itypes, ianns);

	// See if there is type info that we want to add.
	var ianns = indv['annotations'] || [];
	if( bbop.core.what_is(ianns) != 'array' ){
	    throw new Error('annotations is wrong');
	}else{
	    // Add the annotations individually.
	    bbop.core.each(ianns, function(ann_kv_set){
		var na = new bbopx.noctua.edit.annotation(ann_kv_set);
		ne.add_annotation(na);
	    });
	}

	anchor.add_node(ne);
	ret = ne;
    }
    
    return ne;
};

bbopx.noctua.edit.core.prototype.edit_node_order = function(){
    return this.core['node_order'] || [];
};

bbopx.noctua.edit.core.prototype.get_node = function(enid){
    return this.core['nodes'][enid] || null;
};

bbopx.noctua.edit.core.prototype.get_node_elt_id = function(enid){
    return this.core['node2elt'][enid] || null;
};

bbopx.noctua.edit.core.prototype.get_node_by_elt_id = function(elt_id){
    var ret = null;
    var enid = this.core['elt2node'][elt_id] || null;
    if( enid ){
	ret = this.core['nodes'][enid] || null;
    }
    return ret;
};

bbopx.noctua.edit.core.prototype.get_node_by_individual = function(indv){
    var anchor = this;

    var ret = null;

    // Add individual to edit core if properly structured.
    var iid = indv['id'];
    if( iid ){	
	ret = this.core['nodes'][iid] || null;
    }
    
    return ret;
};

bbopx.noctua.edit.core.prototype.get_nodes = function(){
    return this.core['nodes'] || {};
};

bbopx.noctua.edit.core.prototype.remove_node = function(enid){

    var anchor = this;

    if( this.core['nodes'][enid] ){
	var enode = this.core['nodes'][enid];

	// Removing node removes all related edges.
	// TODO: Dumb scan right now.
	bbop.core.each(this.core['edges'], function(edge_id, edge){
	    if( edge.source() == enid || edge.target() == enid ){
		var eeid = edge.id();
		anchor.remove_edge(eeid);
	    }
	});
	
	// Also remove the node from the order list.
	// TODO: Is this a dumb scan?
	var ni = this.core['node_order'].indexOf(enid);
	if( ni != -1 ){
	    this.core['node_order'].splice(ni, 1);
	}

	// Clean the maps.
	var elt_id = this.core['node2elt'][enid];
	delete this.core['node2elt'][enid];
	delete this.core['elt2node'][elt_id];

	// Finally, remove the node itself.
	delete this.core['nodes'][enid];
    }
};

bbopx.noctua.edit.core.prototype.add_edge = function(eedge){
    var eeid = eedge.id();
    this.core['edges'][eeid] = eedge;
    var elt_id = bbop.core.uuid(); // generate the elt id we'll use
    //this.core['edge2elt'][eeid] = elt_id; // map it
    //this.core['elt2edge'][elt_id] = eeid; // map it
};

// 
bbopx.noctua.edit.core.prototype.add_edge_from_fact = function(fact, aid){

    var anchor = this;
    var each = bbop.core.each;

    var ret_fact = null;
    
    // Add individual to edit core if properly structured.
    var sid = fact['subject'];
    var oid = fact['object'];
    var pid = fact['property'];
    var anns = fact['annotations'] || [];
    if( sid && oid && pid ){

	var en = new bbopx.noctua.edit.edge(sid, pid, oid, anns);
	if( bbop.core.what_is(anns) != 'array' ){
	    throw new Error('annotations is wrong');
	}else{
	    // Add the annotations individually.
	    bbop.core.each(anns, function(ann_kv_set){
		var na = new bbopx.noctua.edit.annotation(ann_kv_set);
		en.add_annotation(na);
	    });
	}

	// Add and ready to return edge.
	anchor.add_edge(en);
	ret_fact = en;
    }
    
    return ret_fact;
};

// // TODO/BUG: aid is used as a crutch here to scan out the edges
// bbopx.noctua.edit.core.prototype.add_edges_from_individual = function(indv, aid){

//     var anchor = this;
//     var each = bbop.core.each;

//     var ret_facts = [];
    
//     // Add individual to edit core if properly structured.
//     var iid = indv['id'];
//     if( iid ){
// 	// Now, let's probe the model to see what edges
// 	// we can find.
// 	var possible_rels = aid.all_known();
// 	each(possible_rels,
// 	     function(try_rel){
// 		 if( indv[try_rel] && indv[try_rel].length ){
		     
// 		     // Cycle through each of the found
// 		     // rels.
// 		     var found_rels = indv[try_rel];
// 		     each(found_rels,
// 			  function(rel){
// 			      var tid = rel['id'];
// 			      var rt = rel['type'];
// 			      if( tid && rt && rt == 'NamedIndividual'){
// 				  var en =
// 				      new bbopx.noctua.edit.edge(iid, try_rel, tid);
// 				  anchor.add_edge(en);
// 				  ret_facts.push(en);
// 			      }
// 			  });
// 		 }
// 	     });
//     }
    
//     return ret_facts;
// };

bbopx.noctua.edit.core.prototype.get_edge_id_by_connector_id = function(cid){
    return this.core['connector2edge'][cid] || null;
};

bbopx.noctua.edit.core.prototype.get_connector_id_by_edge_id = function(eid){
    return this.core['edge2connector'][eid] || null;
};

// // Get all of the edges by individual.
// bbopx.noctua.edit.core.prototype.get_edges_by_individual = function(indv){

//     var anchor = this;
//     var each = bbop.core.each;

//     var ret_facts = [];
    
//     // Add individual to edit core if properly structured.
//     var iid = indv['id'];
//     if( iid ){
// 	// Now, let's probe the model to see what edges
// 	// we can find.
// 	var possible_rels = aid.all_known();
// 	each(possible_rels,
// 	     function(try_rel){
// 		 if( indv[try_rel] && indv[try_rel].length ){
		     
// 		     // Cycle through each of the found
// 		     // rels.
// 		     var found_rels = indv[try_rel];
// 		     each(found_rels,
// 			  function(rel){
// 			      var tid = rel['id'];
// 			      var rt = rel['type'];
// 			      if( tid && rt && rt == 'NamedIndividual'){
// 				  var en =
// 				      new bbopx.noctua.edit.edge(iid, try_rel, tid);
// 				  anchor.add_edge(en);
// 				  ret_facts.push(en);
// 			      }
// 			  });
// 		 }
// 	     });
//     }
    
//     return ret_facts;
// };

bbopx.noctua.edit.core.prototype.get_edge = function(eeid){
    return this.core['edges'][eeid] || null;
};

bbopx.noctua.edit.core.prototype.get_edges = function(){
    return this.core['edges'] || [];
};

/*
 * Function: 
 * 
 * Return a list of edges that are concerned with the nodes as source.
 */
bbopx.noctua.edit.core.prototype.get_edges_by_source = function(srcid){

    var rete = [];
    bbop.core.each(this.core['edges'], function(edge_id, edge){
	var src = edge.source();
	if( src == srcid ){
	    rete.push(edge);
	}
    });

    return rete;
};

/*
 * Function: 
 * 
 * Return a list of edges that are concerned with the nodes as target.
 */
bbopx.noctua.edit.core.prototype.get_edges_by_target = function(tgtid){

    var rete = [];
    bbop.core.each(this.core['edges'], function(edge_id, edge){
	var tgt = edge.target();
	if( tgt == tgtid ){
	    rete.push(edge);
	}
    });

    return rete;
};

bbopx.noctua.edit.core.prototype.remove_edge = function(eeid){
    if( this.core['edges'][eeid] ){

	// Main bit out.
	delete this.core['edges'][eeid];

	// And clean the maps.
	var cid = this.core['edge2connector'][eeid];
	delete this.core['edge2connector'][eeid];
	delete this.core['connector2edge'][cid];
    }
};

bbopx.noctua.edit.core.prototype.create_edge_mapping = function(eedge, connector){
    var eid = eedge.id();
    var cid = connector.id;
    this.core['edge2connector'][eid] = cid;
    this.core['connector2edge'][cid] = eid;
};

// Debugging text output function.
bbopx.noctua.edit.core.prototype.dump = function(){

    //
    var dcache = [];
    
    bbop.core.each(this.core['nodes'], function(node_id, node){

	var ncache = ['node'];
	ncache.push(node.id());
	// ncache.push(node.enabled_by());
	// ncache.push(node.activity());
	// ncache.push(node.unknown().join('|'));
	// ncache.push(node.process());
	// ncache.push(node.location().join('|'));
	dcache.push(ncache.join("\t"));
    });
    
    bbop.core.each(this.core['edges'], function(edge_id, edge){
	var ecache = ['edge'];
	ecache.push(edge.source());
	ecache.push(edge.relation());
	ecache.push(edge.target());
	dcache.push(ecache.join("\t"));
    });
    
    return dcache.join("\n");
};

// Return gross high-level topology.
bbopx.noctua.edit.core.prototype.to_graph = function(){

    // 
    var ex_graph = new bbop.model.graph();
    
    // Add nodes.
    bbop.core.each(this.core['nodes'], function(node_id, node){

	// Create node.
	var ex_node = new bbop.model.node(node_id);
	//ex_node.metadata(ex_meta);
	
	// Add to export graph.
	ex_graph.add_node(ex_node);
    });
    
    // Add edges to the export graph.
    bbop.core.each(this.core['edges'], function(edge_id, edge){
	//
	var ex_edge =
	    new bbop.model.edge(edge.source(), edge.target(), edge.relation());
	ex_graph.add_edge(ex_edge);
    });
    
    return ex_graph;
};

// Add annotation operations to prototype.
bbopx.noctua.edit.core.prototype.annotations =
    bbopx.noctua.edit._annotations;
bbopx.noctua.edit.core.prototype.add_annotation =
    bbopx.noctua.edit._add_annotation;
bbopx.noctua.edit.core.prototype.get_annotations_by_filter =
    bbopx.noctua.edit._get_annotations_by_filter;
bbopx.noctua.edit.core.prototype.get_annotation_by_id =
    bbopx.noctua.edit._get_annotation_by_id;

/**
 * Edit types.
 * 
 * A *very* simplified version of types, with just enough so that we
 * aren't constantly trying to work with them endlessly elsewhere in
 * the code.
 * 
 * Types can be: Class and the class expressions: SVF, union, and
 * intersection.
 * 
 * Categories is more a graphical distinction. They can be:
 * instance_of, <relation id>, union, and intersection.
 * 
 * This model also incorporates whether or not the type is inferred. At this
 * level they are treated the say, but higher level may (must) treat them
 * as display decorations.
 *
 * Parameters:
 *  in_types - the raw type blob from the server
 *  inferred_p - whether or not the type is inferred (default false)
 */
bbopx.noctua.edit.type = function(in_type, inferred_p){

    var anchor = this;
    var each = bbop.core.each;

    // Initialize.
    this._raw_type = in_type;
    this._inferred_p = inferred_p || false;
    this._id = bbop.core.uuid();

    // Derived property defaults.
    this._type = null;
    this._category = 'unknown';
    this._class_id = null;
    this._class_label = null;
    this._property_id = null;
    this._property_label = null;
    // For recursive elements.
    //this._frame_type = null;
    this._frame = [];

    // Helpers.
    function _decide_type(type){
	var rettype = null;

	// Easiest case.
	var t = type['type'] || null;
	if( t == 'Class' ){
	    rettype = 'class';
	}else{
	    // Okay, we're dealing with a class expression...but which
	    // one? Talking to Heiko, these can be only one--they are
	    // not going to be mixed.
	    if( type['unionOf'] ){
		rettype = 'union';
	    }else if( type['intersectionOf'] ){
		rettype = 'intersection';
	    }else{
		// Leaving us with SVF.
		rettype = 'svf';
	    }
	}

	return rettype;
    }

    // Define the category, and build up an instant picture of what we
    // need to know about the property.
    var t = _decide_type(in_type);
    if( t == 'class' ){

	// Easiest to extract.
	this._type = t;
	this._category = 'instance_of';
	this._class_id = in_type['id'];
	this._class_label = in_type['label'] || this._class_id;
	// No related properties.
	
    }else if( t == 'union' || t == 'intersection' ){

	// These are simply recursive.
	this._type = t;
	this._category = t;

	// Load stuff into the frame.
	this._frame = [];
	// TODO: argh! hardcody
	var f_set = in_type[t + 'Of'] || [];
	each(f_set, function(f_type){
	    anchor._frame.push(new bbopx.noctua.edit.type(f_type));
	});
    }else{
	    
	// We're then dealing with an SVF: a property plus a class
	// expression. In the future there may be many things, but
	// for now we are expecting a "Restriction", although we don't
	// really do anything with that information (maybe later).
	this._type = t;
	// Extract the property information
	this._category = in_type['onProperty']['id'];
	this._property_id = in_type['onProperty']['id'];
	this._property_label =
	    in_type['onProperty']['label'] || this._property_id;	    

	// Okay, let's recur down the class expression. It should be
	// one, but we'll use the frame. Access should be though
	// svf_class_expression().
	var f_type = in_type['someValuesFrom'];
	this._frame = [new bbopx.noctua.edit.type(f_type)];
    }
};

/**
 * Function: id
 * 
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string
 */
bbopx.noctua.edit.type.prototype.id = function(){
    return this._id;
};

/**
 * Function: inferred_p
 * 
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  boolean
 */
bbopx.noctua.edit.type.prototype.inferred_p = function(){
    return this._inferred_p;
};

/**
 * Function: signature
 * 
 * A cheap way of identifying if two types are the same.
 * This essentially returns a string of the main attributes of a type.
 * It is meant to be semi-unique and collide with dupe inferences.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string
 */
bbopx.noctua.edit.type.prototype.signature = function(){
    var anchor = this;
    var each = bbop.core.each;

    var sig = [];

    // The easy ones.
    sig.push(anchor.category() || '');
    sig.push(anchor.type() || '');
    sig.push(anchor.class_id() || '');
    sig.push(anchor.property_id() || '');

    // And now recursively on frames.
    if( anchor.frame() ){
	each(anchor.frame(), function(f){
	    sig.push(f.signature() || '');
	});
    }

    return sig.join('_');
};

/** 
 * Function: category
 *
 * Try to put an instance type into some kind of rendering
 * category.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string (default 'unknown')
 */
bbopx.noctua.edit.type.prototype.category = function(){
    return this._category;
};

/** 
 * Function: type
 *
 * The "type" of the type.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbopx.noctua.edit.type.prototype.type = function(){
    return this._type;
};

/** 
 * Function: svf_class_expression
 *
 * The class expression when we are dealing with SVF.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  type or null
 */
bbopx.noctua.edit.type.prototype.svf_class_expression = function(){
    // Yes, a reuse of _frame.
    return this._frame[0] || null;
};

// /** 
//  * Function: frame_type
//  *
//  * If the type has a recursive frame, the "type" of said frame.
//  *
//  * Parameters: 
//  *  n/a
//  *
//  * Returns:
//  *  string or null
//  */
// bbopx.noctua.edit.type.prototype.frame_type = function(){
//     return this._frame_type;
// };

/** 
 * Function: frame
 *
 * If the type has a recursive frame, a list of the types it contains.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  list
 */
bbopx.noctua.edit.type.prototype.frame = function(){
    return this._frame;
};

/** 
 * Function: class_id
 *
 * The considered class id.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbopx.noctua.edit.type.prototype.class_id = function(){
    return this._class_id;
};

/** 
 * Function: class_label
 *
 * The considered class label, defaults to ID if not found.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbopx.noctua.edit.type.prototype.class_label = function(){
    return this._class_label;
};

/** 
 * Function: property_id
 *
 * The considered class property id.
 * Not defined for 'Class' types.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbopx.noctua.edit.type.prototype.property_id = function(){
    return this._property_id;
};

/** 
 * Function: property_label
 *
 * The considered class property label.
 * Not defined for 'Class' types.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbopx.noctua.edit.type.prototype.property_label = function(){
    return this._property_label;
};

/**
 * Edit nodes.
 * 
 * Parameters:
 *  in_id - *[optional]* generated if not given
 *  in_types - *[serially optional]*
 */
bbopx.noctua.edit.node = function(in_id, in_types){

    var anchor = this;

    this._types = [];
    this._id2type = {};
    this._annotations = [];

    if( typeof(in_id) === 'undefined' ){
	this._id = bbop.core.uuid();
    }else{
	//this._id = in_id;
	this._id = bbopx.noctua.clean(in_id);
    }
    if( typeof(in_types) !== 'undefined' ){
	bbop.core.each(in_types, function(in_type){
	    var new_type = new bbopx.noctua.edit.type(in_type);
	    anchor._id2type[new_type.id()] = new_type;
	    anchor._types.push(new bbopx.noctua.edit.type(in_type));
	});
    }
    
    // Optional layout hints.
    this._x_init = null; // initial layout hint
    this._y_init = null;
    // this.xlast = null; // last known location
    // this.ylast = null;
};

// (possibly generated) ID is RO
bbopx.noctua.edit.node.prototype.id = function(value){
    return this._id;
};

/**
 * Function: types
 * 
 * Get current types; replace current types.
 * 
 * Parameters:
 *  in_types - *[optional]* raw JSON type objects
 * 
 * Returns:
 *  array
 */
bbopx.noctua.edit.node.prototype.types = function(in_types){
    var anchor = this;    

    if( in_types && bbop.core.what_is(in_types) == 'array' ){

	// Wipe previous type set.
	anchor._id2type = {};
	anchor._types = [];

	bbop.core.each(in_types, function(in_type){
	    var new_type = new bbopx.noctua.edit.type(in_type);
	    anchor._id2type[new_type.id()] = new_type;
	    anchor._types.push(new_type);
	});
    }
    return this._types;
};

/**
 * Function: add_types
 * 
 * Add types to current types.
 * 
 * Parameters:
 *  in_types - raw JSON type objects
 *  inferred_p - whether or not the argument types are inferred
 * 
 * Returns:
 *  boolean
 */
bbopx.noctua.edit.node.prototype.add_types = function(in_types, inferred_p){
    var anchor = this;    
    var inf_p = inferred_p || false;

    var ret = false;

    if( in_types && bbop.core.what_is(in_types) == 'array' ){
	bbop.core.each(in_types, function(in_type){
	    var new_type = new bbopx.noctua.edit.type(in_type, inf_p);
	    anchor._id2type[new_type.id()] = new_type;
	    anchor._types.push(new_type);
	    
	    ret = true; // return true if did something
	});
    }
    return ret;
};

/**
 * Function: get_type_by_id
 * 
 * Get the 
 * 
 * Parameters:
 *  type_id - type id
 * 
 * Returns:
 *  type or null
 */
bbopx.noctua.edit.node.prototype.get_type_by_id = function(type_id){
    var anchor = this;

    var ret = null;
    ret = anchor._id2type[type_id];

    return ret;
};

bbopx.noctua.edit.node.prototype.x_init = function(value){
    if(value) this._x_init = value; return this._x_init; };

bbopx.noctua.edit.node.prototype.y_init = function(value){
    if(value) this._y_init = value; return this._y_init; };

// Add annotation operations to prototype.
bbopx.noctua.edit.node.prototype.annotations =
    bbopx.noctua.edit._annotations;
bbopx.noctua.edit.node.prototype.add_annotation =
    bbopx.noctua.edit._add_annotation;
bbopx.noctua.edit.node.prototype.get_annotations_by_filter =
    bbopx.noctua.edit._get_annotations_by_filter;
bbopx.noctua.edit.node.prototype.get_annotation_by_id =
    bbopx.noctua.edit._get_annotation_by_id;

/*
 * Edit edges.
 * 
 * Parameters:
 *  src_id - source id
 *  rel_id - relation id
 *  tgt_id - target/object id
 */
bbopx.noctua.edit.edge = function(src_id, rel_id, tgt_id){
    this._id = bbop.core.uuid();
    // this._source_id = src_id;
    // this._relation_id = rel_id;
    // this._target_id = tgt_id;
    this._source_id = bbopx.noctua.clean(src_id);
    this._relation_id = bbopx.noctua.clean(rel_id);
    this._target_id = bbopx.noctua.clean(tgt_id);

    this._annotations = [];
};
bbopx.noctua.edit.edge.prototype.id = function(){ // ID is RO
    return this._id; };
bbopx.noctua.edit.edge.prototype.source = function(value){
    if(value) this._source_id = value; return this._source_id; };
bbopx.noctua.edit.edge.prototype.relation = function(value){
    if(value) this._relation_id = value; return this._relation_id; };
bbopx.noctua.edit.edge.prototype.target = function(value){
    if(value) this._target_id = value; return this._target_id; };

// Add annotation operations to prototype.
bbopx.noctua.edit.edge.prototype.annotations =
    bbopx.noctua.edit._annotations;
bbopx.noctua.edit.edge.prototype.add_annotation =
    bbopx.noctua.edit._add_annotation;
bbopx.noctua.edit.edge.prototype.get_annotations_by_filter =
    bbopx.noctua.edit._get_annotations_by_filter;
bbopx.noctua.edit.edge.prototype.get_annotation_by_id =
    bbopx.noctua.edit._get_annotation_by_id;
////
//// Simple abstraction to take care of operating on stored locations.
////

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.noctua == "undefined" ){ bbopx.noctua = {}; }

bbopx.noctua.location_store = function(){

    var anchor = this;

    var logger = new bbop.logger('lcstr');
    logger.DEBUG = true;
    //logger.DEBUG = false;
    function ll(str){ logger.kvetch(str); }

    // 
    var lstore = {};

    // True if new, false if update.
    anchor.add = function(id, x, y){
	var ret = true;

	if( lstore[id] ){
	    ret = false;
	}
	lstore[id] = {'x': x, 'y': y};

	return ret;
    };

    // True is removal, false if wasn't there.
    anchor.remove = function(id){
	var ret = false;

	if( lstore[id] ){
	    ret = true;
	}
	delete lstore[id];

	return ret;
    };

    // 
    anchor.get = function(id){
	var ret = null;

	if( lstore[id] ){
	    ret = lstore[id];
	}

	return ret;
    };

};
////
//// Namespace for large drawing routines.
////

if ( typeof bbopx == "undefined" ){ var bbopx = {}; }
if ( typeof bbopx.noctua == "undefined" ){ bbopx.noctua = {}; }
if ( typeof bbopx.noctua.widgets == "undefined" ){ bbopx.noctua.widgets = {}; }

/*
 * "Static" function.
 *
 * For the time being, the cannonical way of building a link with a
 * token.
 */
bbopx.noctua.widgets.build_token_link = function(url, token){
    var new_url = url;
    
    if( token ){
	if( new_url.indexOf('?') == -1 ){
	    new_url = new_url + '?' + 'barista_token=' + token;
	}else{
	    new_url = new_url + '&' + 'barista_token=' + token;
	}
    }
    
    return new_url;
};

// Add edit model node contents to a descriptive table.
bbopx.noctua.widgets.repaint_info = function(ecore, aid, info_div){

    // Node and edge counts.
    var nds = bbop.core.get_keys(ecore.get_nodes()) || [];
    var eds = bbop.core.get_keys(ecore.get_edges()) || [];

    // Any annotation information that came in.
    var anns = '';
    bbop.core.each(ecore.annotations(), function(ann){
	if( ann.property('comment') ){
	    anns += '<dd>' +
		'<small><strong>comment</strong></small> ' +
		ann.property('comment') +
		'</dd>';
	}
    });
    if( anns == '' ){
	anns = '<dd>none</dd>';
    }

    // Try and get a title out of the model.
    var mtitle = '???';
    var tanns = ecore.get_annotations_by_filter(function(a){
	var ret = false;
	if( a.property('title') ){
	    ret = true;
	}
	return ret;
    });
    if( tanns && tanns[0] ){ mtitle = tanns[0].property('title'); }

    var str_cache = [
	'<dl class="dl-horizontal">',
	// '<dt></dt>',
	// '<dd>',
	// '</dd>',
	'<dt>ID</dt>',
	'<dd>',
	ecore.get_id(),
	'</dd>',
	'<dt>Name</dt>',
	'<dd>',
	mtitle,
	'</dd>',
	'<dt>Individuals</dt>',
	'<dd>',
	nds.length || 0,
	'</dd>',
	'<dt>Indv. Rels.</dt>',
	'<dd>',
	eds.length || 0,
	'</dd>',
	'<dt>Annotations</dt>',
	anns
    ];
    
    // Add to display.
    jQuery(info_div).empty();
    jQuery(info_div).append(str_cache.join(' '));
};

// Add edit model node contents to a descriptive table.
bbopx.noctua.widgets.repaint_exp_table = function(ecore, aid, table_div){

    var each = bbop.core.each;

    // First, lets get the headers that we'll need by poking the
    // model and getting all of the possible categories.	
    var cat_list = [];
    each(ecore.get_nodes(), function(enode_id, enode){
	each(enode.types(), function(in_type){
	    cat_list.push(in_type.category());
	});
    });
    // Dedupe list.
    var tmph = bbop.core.hashify(cat_list);
    cat_list = bbop.core.get_keys(tmph);

    // If we actually got something, render the table. Otherwise,
    // a message.
    if( bbop.core.is_empty(cat_list) ){
	
	// Add to display.
	jQuery(table_div).empty();
	jQuery(table_div).append('<p><h4>no instances</h4></p>');

    }else{
	
	// Sort header list according to known priorities.
	cat_list = cat_list.sort(function(a, b){
	    return aid.priority(b) - aid.priority(a);
	});
	
	// Convert the ids into readable headers.
	var nav_tbl_headers = [];
	each(cat_list, function(cat_id){
	    var hdrc = [
		aid.readable(cat_id),
		'&uarr;&darr;'
	    ];
	    nav_tbl_headers.push(hdrc.join(' '));
	});
	
	var nav_tbl =
	    new bbop.html.table(nav_tbl_headers, [],
				{'generate_id': true,
				 'class': ['table', 'table-bordered',
					   'table-hover',
					   'table-condensed'].join(' ')});
	
	//each(ecore.get_nodes(),
	each(ecore.edit_node_order(), function(enode_id){
	    var enode = ecore.get_node(enode_id);
	    
	    // Now that we have an enode, we want to mimic the order
	    // that we created for the header (cat_list). Start by
	    // binning the types.
	    var bin = {};
	    each(enode.types(), function(in_type){
		var cat = in_type.category();
		if( ! bin[cat] ){ bin[cat] = []; }
		bin[cat].push(in_type);
	    });
	    
	    // Now unfold the binned types into the table row
	    // according to the sorted order.
	    var table_row = [];
	    each(cat_list, function(cat_id){
		var accumulated_types = bin[cat_id];
		var cell_cache = [];
		each(accumulated_types, function(atype){
		    var tt = bbopx.noctua.type_to_span(atype, aid);
		    cell_cache.push(tt);
		});
		table_row.push(cell_cache.join('<br />'));
	    });
	    nav_tbl.add_to(table_row);		     
	});
	
	// Add to display.
	jQuery(table_div).empty();
	jQuery(table_div).append(nav_tbl.to_string());

	// Make it sortable using the plugin.
	jQuery('#' + nav_tbl.get_id()).tablesorter(); 
    }
};

// Add edit model edge contents to a descriptive table.
bbopx.noctua.widgets.repaint_edge_table = function(ecore, aid, table_div){

    var each = bbop.core.each;

    var edge_list = ecore.get_edges();

    // If we actually got something, render the table. Otherwise,
    // a message.
    if( bbop.core.is_empty(edge_list) ){
	
	// Add to display.
	jQuery(table_div).empty();
	jQuery(table_div).append('<p><h4>no relations</h4></p>');

    }else{
	
	// Make the (obvjously known) headers pretty.
	var nav_tbl_headers = [];
	each(['subject', 'relation', 'object'], function(hdr){
	    var hdrc = [
		hdr,
		'&uarr;&darr;'
	    ];
	    nav_tbl_headers.push(hdrc.join(' '));
	});
		
	var nav_tbl =
	    new bbop.html.table(nav_tbl_headers, [],
				{'generate_id': true,
				 'class': ['table', 'table-bordered',
					   'table-hover',
					   'table-condensed'].join(' ')});
	
	each(edge_list, function(edge_id){
	    var edge = ecore.get_edge(edge_id);
	    var s = edge.source();
	    var r = edge.relation();
	    var t = edge.target();

	    // according to the sorted order.
	    var table_row = [
		aid.readable(s),
		aid.readable(r),
		aid.readable(t)
	    ];
	    
	    nav_tbl.add_to(table_row);		     
	});
	
	// Add to display.
	jQuery(table_div).empty();
	jQuery(table_div).append(nav_tbl.to_string());

	// Make it sortable using the plugin.
	jQuery('#' + nav_tbl.get_id()).tablesorter(); 
    }
};

bbopx.noctua.widgets.wipe = function(div){
    jQuery(div).empty();
};

/*
 * Takes a core edit node as the argument, categorize the
 * contained types, order them.
 *
 * As a secondary function, remove overly "dupe-y" inferred types.
 */
bbopx.noctua.widgets.enode_to_stack = function(enode, aid){
	
    var each = bbop.core.each;
    var pare = bbop.core.pare;

    // 
    var sig_lookup = {};
    var bin_stack = enode.types() || [];

    // Get ready to remove "dupes", first by collecting the signatures
    // of the non-inferred individual types.
    each(bin_stack, function(t){
	if( ! t.inferred_p() ){
	    sig_lookup[t.signature()] = true;
	}
    });

    // Sort the types within the stack according to the known
    // type priorities.
    function _sorter(a, b){

	// Inferred nodes always have ??? priority.
	var ainf = a.inferred_p();
	var binf = b.inferred_p();
	if( ainf != binf ){
	    if( binf ){
		return 1;
	    }else{
		return -1;
	    }
	}
	
	// Otherwise, use aid property priority.
	var bpri = aid.priority(b.property_id());
	var apri = aid.priority(a.property_id());
	return apri - bpri;
    };

    // Filter anything out that has a matching signature.
    function _filterer(item){
	var ret = false;
	if( item.inferred_p() ){
	    if( sig_lookup[item.signature()] ){
		ret = true;
	    }
	}
	return ret;
    }

    bin_stack = pare(bin_stack, _filterer, _sorter);

    return bin_stack;
};
    
/*
 * 
 */
bbopx.noctua.widgets.render_node_stack = function(enode, aid){

    var each = bbop.core.each;

    // Create a colorful label stack into an individual table.
    var enode_stack_table = new bbop.html.tag('table',
					      {'class':'bbop-mme-stack-table'});

    // Add type/color information.
    var inferred_type_count = 0;
    var ordered_types = bbopx.noctua.widgets.enode_to_stack(enode, aid);
    each(ordered_types, function(item){
	
	// Special visual handling of inferred types.
	if( item.inferred_p() ){ inferred_type_count++; }
	
	var trstr = '<tr class="bbop-mme-stack-tr" ' +
		 'style="background-color: ' +
	    aid.color(item.category()) +
	    ';"><td class="bbop-mme-stack-td">' 
	    + bbopx.noctua.type_to_span(item, aid) + '</td></tr>';   
	enode_stack_table.add_to(trstr);
    });

    // Inject meta-information if extant.
    var anns = enode.annotations();
    if( anns.length != 0 ){

	// Meta counts.
	var n_ev = 0;
	var n_other = 0;
	each(anns, function(ann){
	    if( ann.property('evidence') ){ n_ev++; }
	    else{ n_other++; }
	});

	// Add to top.
	var trstr = '<tr class="bbop-mme-stack-tr">' +
	    '<td class="bbop-mme-stack-td"><small style="color: grey;">' 
	    + 'evidence: ' + n_ev + '; other: ' + n_other + 
	    '</small></td></tr>';
	enode_stack_table.add_to(trstr);
    }
    
    // Add external visual cue if there were inferred types.
    if( inferred_type_count > 0 ){
	var itcstr = '<tr class="bbop-mme-stack-tr">' +
	    '<td class="bbop-mme-stack-td"><small style="color: grey;">' +
	    'inferred types: ' + inferred_type_count + '</small></td></tr>';
	enode_stack_table.add_to(itcstr);
    }

    return enode_stack_table;
};

/*
 * Add a new enode.
 */
bbopx.noctua.widgets.add_enode = function(ecore, enode, aid, graph_div){

    var each = bbop.core.each;

    // Node as table nested into bbop.html div.
    var div_id = ecore.get_node_elt_id(enode.id());
    var style_str = 'top: ' + enode.y_init() + 'px; ' + 
	'left: ' + enode.x_init() + 'px;';
    //ll('style: ' + style_str);
    var w = new bbop.html.tag('div',
			      {'id': div_id,
			       'class': 'demo-window',
			       'style': style_str});
    
    var enode_stack_table = bbopx.noctua.widgets.render_node_stack(enode, aid);
    w.add_to(enode_stack_table);
    
    // Box to drag new connections from.	
    var konn = new bbop.html.tag('div', {'class': 'konn'});
    w.add_to(konn);
    
    // Box to click for edit dialog.
    var opend = new bbop.html.tag('div', {'class': 'open-dialog'});
    w.add_to(opend);
    
    // // Box to click for annotation dialog.
    // var openann = new bbop.html.tag('div', {'class': 'open-annotation-dialog'});
    // w.add_to(openann);
    
    jQuery(graph_div).append(w.to_string());
};

/*
 * Update the displayed contents of an enode.
 */
bbopx.noctua.widgets.update_enode = function(ecore, enode, aid){

    var each = bbop.core.each;

    // Node as table nested into bbop.html div.
    var uelt = ecore.get_node_elt_id(enode.id());
    jQuery('#' + uelt).empty();

    var enode_stack_table = bbopx.noctua.widgets.render_node_stack(enode, aid);
    jQuery('#' + uelt).append(enode_stack_table.to_string());
    
    // Box to drag new connections from.	
    var konn = new bbop.html.tag('div', {'class': 'konn'});
    jQuery('#' + uelt).append(konn.to_string());
    
    // Box to drag new connections from.	
    var opend = new bbop.html.tag('div', {'class': 'open-dialog'});
    jQuery('#' + uelt).append(opend.to_string());

    // // Box to click for annotation dialog.
    // var openann = new bbop.html.tag('div', {'class': 'open-annotation-dialog'});
    // jQuery('#' + uelt).append(openann.to_string());
};

/*
 * Object.
 * 
 * The contained_modal is a simple modal dialog 
 * Node modal: invisible until it's not modal dialog.
 * 
 * NOTE: We're skipping some of the bbop.html stuff since we
 * specifically want BS3 stuff and not the jQuery-UI stuff that is
 * sometimes haning around in there.
 * 
 * arg_title may be null, string, or bbop.html
 * arg_body may be null, string, or bbop.html
 * 
 */
bbopx.noctua.widgets.contained_modal = function(type, arg_title, arg_body){
    
    var tag = bbop.html.tag;

    var shield_p = false;
    if( type && type == 'shield' ){
	shield_p = true;
    }else{
	// ???
    }

    // Define buttons first.
    var x_btn_args = {
	'type': 'button',
	'class': 'close',
	'data-dismiss': 'modal',
	'aria-hidden': 'true'
    };
    var x_btn = new tag('button', x_btn_args, '&times;');
    var close_btn_args = {
	'type': 'button',
	'class': 'btn btn-default',
	'data-dismiss': 'modal'
    };
    var close_btn = new tag('button', close_btn_args, 'Close');

    // Then the title.
    var title_args = {
	'generate_id': true,
	'class': 'modal-title'	
    };
    var title = new tag('div', title_args, arg_title);

    // One button and the title are in the header.
    var header_args = {
	'class': 'modal-header'
    };
    var header = null;
    if( shield_p ){
	header = new tag('div', header_args, title);
    }else{
	header = new tag('div', header_args, [x_btn, title]);
    }

    // The footer has the other button.
    var footer_args = {
	'generate_id': true,
	'class': 'modal-footer'
    };
    var footer = new tag('div', footer_args, close_btn);

    // Ready the body.
    var body_args = {
	'generate_id': true,
	'class': 'modal-body'	
    };
    var body = new tag('div', body_args, arg_body);

    // Content has header, body, and footer.
    var content_args = {
	'class': 'modal-content'
    };
    var content = null;
    if( shield_p ){
	content = new tag('div', content_args, [header, body]);
    }else{
	content = new tag('div', content_args, [header, body, footer]); 
    }

    // Dialog contains content.
    var dialog_args = {
	'class': 'modal-dialog'
    };
    var dialog = new tag('div', dialog_args, content); 
    
    // And the container contains it all.
    var container_args = {
	'generate_id': true,
	'class': 'modal fade',
	'tabindex': '-1',
	'role': 'dialog',
	'aria-labelledby': body.get_id(),
	'aria-hidden': 'true'
    };
    var container = new tag('div', container_args, dialog); 

    // Attach the assembly to the DOM.
    var modal_elt = '#' + container.get_id();
    jQuery('body').append(container.to_string());
    var modal_opts = {
    };
    if( shield_p ){
	modal_opts['backdrop'] = 'static';
	modal_opts['keyboard'] = false;
    }

    // Add destructor to hidden listener--clicking on the close with
    // eliminate this dialog from the DOM completely.
    jQuery(modal_elt).on('hidden.bs.modal',
			 function(){ jQuery(this).remove(); });

    // Add activities.
    // TODO

    ///
    /// Add external controls, etc.
    ///

    // To be used before show--add elements (as a string) to the main
    // modal DOM (which can have events attached).
    this.add_to_body = function(str){
	var add_to_elt = '#' + body.get_id();
	jQuery(add_to_elt).append(str);
    };
    
    // // To be used before show--add elements (as a string) to the main
    // // modal DOM (which can have events attached).
    // this.reset_footer = function(){
    // 	var add_to_elt = '#' + footer.get_id();
    // 	jQuery(add_to_elt).append(str);
    // };
    
    // To be used before show--add elements (as a string) to the main
    // modal DOM (which can have events attached).
    this.add_to_footer = function(str){
	var add_to_elt = '#' + footer.get_id();
	jQuery(add_to_elt).append(str);
    };
    
    //
    this.show = function(){
	jQuery(modal_elt).modal(modal_opts);	
    };
    
    //
    // Will end up destorying it since we are listening for the
    // "hidden" event above.
    this.destroy = function(){
	jQuery(modal_elt).modal('hide');
    };
};

/*
 * Contained blocking shield for general compute activity.
 * 
 * Function that returns object.
 * 
 * TODO: make subclass?
 */ 
bbopx.noctua.widgets.compute_shield = function(){

    var tag = bbop.html.tag;

    // Text.
    var p = new tag('p', {},
		    'Doing remote processing. This may take a minute...');

    // Progress bar.
    var pb_args = {
	'class': 'progress-bar',
	'role': 'progressbar',
	'aria-valuenow': '100',
	'aria-valuemin': '0',
	'aria-valuemax': '100',
	'style': 'width: 100%'
    };
    var pb = new tag('div', pb_args, '<span class="sr-only">Working...</span>');
    var pb_container_args = {
	'class': 'progress progress-striped active'
    };
    var pb_container = new tag('div', pb_container_args, pb);

    var mdl = new bbopx.noctua.widgets.contained_modal('shield', 'Relax',
						   [p, pb_container]);
    return mdl;
};

/**
 * Function that returns a sorted relation list of the form [[id, label], ...]
 * 
 * Optional boost when we don't care using the boolean "relevant" field.
 * The boost is 10.
 * 
 * TODO: make subclass?
 */
bbopx.noctua.widgets.sorted_relation_list = function(relations, aid){
    
    var each = bbop.core.each;

    var boost = 10;

    // Get a sorted list of known rels.
    //var rels = aid.all_entities();
    var rels = relations.sort(function(a,b){ 
	var id_a = a['id'];
	var id_b = b['id'];
	
	var pr_a = aid.priority(id_a);
	var pr_b = aid.priority(id_b);
	
	// Looking at the optional boolean "relevant" field, if we
	// showed no preference in our context, give these a
	// boost.
	if( pr_a == 0 && a['relevant'] ){ pr_a = boost; }
	if( pr_b == 0 && b['relevant'] ){ pr_b = boost; }
	
	return pr_b - pr_a;
    });
    var rellist = [];
    each(rels, function(rel){
	// We have the id.
	var r = [rel['id']];
	if( rel['label'] ){ // use their label
	    r.push(rel['label']);
	}else{ // otherwise, try readable
	    r.push(aid.readable(rel['id']));
	}
	rellist.push(r);
    });

    return rellist;
};

/*
 * Contained shield for creating new edges between nodes.
 * 
 * Function that returns object.
 * 
 * TODO: make subclass?
 */
bbopx.noctua.widgets.add_edge_modal = function(ecore, manager,
					       relations, aid,
					       source_id, target_id){
    var each = bbop.core.each;
    var tag = bbop.html.tag;

    // Get a sorted list of known rels.
    var rellist = bbopx.noctua.widgets.sorted_relation_list(relations, aid);
    
    // Preamble.
    var mebe = [
	'<h4>Relation selection</h4>',
	'<b>Edge source:</b>',
	source_id,
	'<br />',
	'<b>Edge target:</b>',
	target_id
    ];

    // Randomized radio.
    var radio_name = bbop.core.uuid();
    var tcache = [mebe.join(' '),
		  '<div style="height: 25em; overflow-y: scroll;">'];
    each(rellist, function(tmp_rel, rel_ind){
	tcache.push('<div class="radio"><label>');
	tcache.push('<input type="radio" ');
	tcache.push('name="' + radio_name + '" ');
	tcache.push('value="' + tmp_rel[0] +'"');
	if( rel_ind == 0 ){
	    tcache.push('checked>');
	}else{
	    tcache.push('>');
	}
	tcache.push(tmp_rel[1] + ' ');
	tcache.push('(' + tmp_rel[0] + ')');
	tcache.push('</label></div>');	     
    });
    tcache.push('</div>');
    
    var save_btn_args = {
	'generate_id': true,
	'type': 'button',
	'class': 'btn btn-primary'
    };
    var save_btn = new tag('button', save_btn_args, 'Save');

    // Setup base modal.
    var mdl = new bbopx.noctua.widgets.contained_modal('dialog', 'Add Relation');
    mdl.add_to_body(tcache.join(''));
    mdl.add_to_footer(save_btn.to_string());

    // Add action listener to the save button.
    function _rel_save_button_start(){

	//
	//ll('looks like edge (in cb): ' + eeid);
	var qstr ='input:radio[name=' + radio_name + ']:checked';
	var rval = jQuery(qstr).val();
	// ll('rval: ' + rval);
	
	// // TODO: Should I report this too? Smells a
	// // bit like the missing properties with
	// // setParameter/s(),
	// // Change label.
	// //conn.setLabel(rval); // does not work!?
	// conn.removeOverlay("label");
	// conn.addOverlay(["Label", {'label': rval,
	// 			 'location': 0.5,
	// 			 'cssClass': "aLabel",
	// 			 'id': 'label' } ]);

	// Kick off callback.	
	manager.add_fact(ecore.get_id(), source_id,
			 target_id, rval);

	// Close modal.
	mdl.destroy();
    }
    // And add the new one for this instance.
    jQuery('#' + save_btn.get_id()).click(function(evt){
	evt.stopPropagation();
	_rel_save_button_start();
    });
    
    // Return our final product.
    return mdl;
};

/*
 * Contained shield for editing the properties of a node (including
 * deletion).
 * 
 * Function that returns object.
 * 
 * TODO: make subclass?
 */
bbopx.noctua.widgets.edit_node_modal = function(ecore, manager, enode,
						relations, aid,
						gserv, gconf){
    var each = bbop.core.each;
    var tag = bbop.html.tag;

    // Start with ID.
    var tid = enode.id();

    // Create a list of types associated with the instance, as well as
    // capture their information for further editing.
    var elt2type = {};
    var type_list = [];
    each(bbopx.noctua.widgets.enode_to_stack(enode, aid), function(item){
	var type_str = bbopx.noctua.type_to_full(item, aid);
	var eid = bbop.core.uuid();
	elt2type[eid] = item;		 
	var acache = [];
	acache.push('<li class="list-group-item" style="background-color: '
		    + aid.color(item.category()) + ';">');
	acache.push(type_str);
	if( ! item.inferred_p() ){
	    acache.push('<span id="'+ eid +
			'" class="badge app-delete-mark">X</span>');
	}
	acache.push('<div class="clearfix"></div>');
	acache.push('</li>');
	type_list.push(acache.join(''));
    });

    // Generate embedded autocomplete for the relations.
    var svf_prop_text_args = {
    	'generate_id': true,
    	'type': 'text',
    	'class': 'form-control',
    	'placeholder':
	'Enter property to use (e.g. directly_activates, has_input)'
    };
    var svf_prop_text = new tag('input', svf_prop_text_args);

    // Create autocomplete box (enabled_by).
    var svf_class_text_args = {
    	'generate_id': true,
    	'type': 'text',
    	'class': 'form-control',
    	'placeholder': 'Enter ID or complex expression (enabled_by only)'
    };
    var svf_class_text = new tag('input', svf_class_text_args);

    // Create delete button.
    var add_svf_btn_args = {
    	'generate_id': true,
    	'type': 'button',
    	'class': 'btn btn-success'
    };
    var add_svf_btn = new tag('button', add_svf_btn_args, 'Add');

    var svf_form = [
    	'<div class="form">',
    	'<div class="form-group">',
	svf_prop_text.to_string(),
    	'</div>',
    	'<div class="form-group">',
	svf_class_text.to_string(),
    	'</div>',
    	add_svf_btn.to_string(),
    	'</div>'
    ];

    // Create delete button.
    var del_btn_args = {
    	'generate_id': true,
    	'type': 'button',
    	'class': 'btn btn-danger'
    };
    var del_btn = new tag('button', del_btn_args, 'Delete');

    //
    var tcache = [
	'<h4>Types</h4>',
	'<p>',
	'<ul class="list-group">',
	type_list.join('') || '<li class="list-group-item">none</li>',
	'</ul>',
	'<hr />',
	'</p>',
	'<h4>Add type</h4>',
	'<p>',
	svf_form.join(''),
	'</p>',
	'<hr />',
	'<h4>Other operations</h4>',
	// '<p>',
	del_btn.to_string(),
	'&nbsp;this individual'//,
	// '</p>'
    ];

    // Setup base modal.
    var mdl = new bbopx.noctua.widgets.contained_modal('dialog',
						   'Edit Instance: ' + tid);
    mdl.add_to_body(tcache.join(''));

    // Attach deletes to all of the listed types.
    each(elt2type, function(elt_id, type){
	jQuery('#' + elt_id).click(function(evt){
	    evt.stopPropagation();
	    var target_id = evt.target.id;
	    var target_type = elt2type[target_id];
	    var cid = target_type.class_id();
	    
	    // Trigger the delete.
	    if( target_type.type() == 'class' ){
		manager.remove_class(ecore.get_id(), tid, cid);
	    }else{
		var pid = target_type.property_id();
		manager.remove_class_expression(ecore.get_id(), tid,
						cid, target_type);
	    }
	    // Wipe out modal.
	    mdl.destroy();
	});
    });

    // Generate the dropdown for the relations.
    var rellist = bbopx.noctua.widgets.sorted_relation_list(relations, aid);
    // Make the property autocomplete dance.
    var prop_sel_ac_list = [];
    each(rellist, function(rel){
	prop_sel_ac_list.push(
	    {
		'value': rel[0],
		//'desc': '???',
		'label': rel[1] + ' ('+ rel[0] +')'
	    });
    });
    jQuery('#' + svf_prop_text.get_id()).autocomplete({
	'minLength': 0,
	'source': prop_sel_ac_list,
	'focus': function(event, ui){
	    jQuery('#' + svf_prop_text.get_id()).val(ui.item.value);
	    return false;
	},
	select: function( event, ui ) {
	    jQuery('#' + svf_prop_text.get_id()).val(ui.item.value);
	    return false;
	}
    });// .autocomplete('#' + svf_prop_text.get_id()).val(ui.item.label)._renderItem = function(ul, item){
    // 	return jQuery('<li>')
    // 	    .append('<a>' + item.label + '<br />' + item.desc + '</a>')
    // 	    .appendTo(ul);
    // };

    // Add add expression action.
    jQuery('#' + add_svf_btn.get_id()).click(function(evt){
	evt.stopPropagation();
	
	var cls = jQuery('#' + svf_class_text.get_id()).val();
	//var prp = jQuery('#' + svf_prop_select.get_id()).val();
	var prp = jQuery('#' +  svf_prop_text.get_id()).val();
	if( cls && prp ){
	    // Trigger the delete--hopefully inconsistent.
	    manager.add_svf(ecore.get_id(), tid, cls, prp);
	    
	    // Wipe out modal.
	    mdl.destroy();	    
	}else if( cls ){
	    // Trigger the delete--hopefully inconsistent.
	    manager.add_class(ecore.get_id(), tid, cls);
	    
	    // Wipe out modal.
	    mdl.destroy();	    
	}else{
	    // Allow modal to remain for retry.
	    alert('At least class must be defined');
	}
    });
    
    // Add delete action.
    jQuery('#' + del_btn.get_id()).click(function(evt){
	evt.stopPropagation();
	
	// Trigger the delete--hopefully inconsistent.
	manager.remove_individual(ecore.get_id(), tid);
	
	// Wipe out modal.
	mdl.destroy();	    
    });
    
    // Add autocomplete box for ECO to evidence box.
    var eco_auto_args = {
    	'label_template':'{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class}}',
    	'list_select_callback': function(doc){}
    };
    
    // Add general autocomplete to the input.
    var gen_auto_args = {
    	'label_template':'{{entity_label}} ({{entity}}/{{category}})',
    	'value_template': '{{entity}}',
    	'list_select_callback': function(doc){}
    };
    var gen_auto =
	new bbop.widget.search_box(gserv, gconf, svf_class_text.get_id(),
				   gen_auto_args);
    gen_auto.lite(true);
    gen_auto.add_query_filter('document_category', 'general');
    //gen_auto.add_query_filter('source', 'eco', ['+']);
    gen_auto.set_personality('general');

    // Return our final product.
    return mdl;
};

/*
 * Contained shield for generically editing the annotations of an
 * identifier entity.
 * 
 * Function that returns object.
 * 
 * TODO: make subclass?
 */
bbopx.noctua.widgets.edit_annotations_modal = function(annotation_config,
						       ecore, manager, entity_id,
						       gserv, gconf){
    var each = bbop.core.each;
    var tag = bbop.html.tag;

    ///
    /// This first section describes a semi-generic way of generating
    /// callbacks to delete and add annotations to various enities.
    ///

    // Try and determine what type of entity we are dealing with:
    // model, node, edge.
    var entity = null;
    var entity_type = null;
    var entity_title = null;
    if( ecore.get_id() == entity_id ){
	entity = ecore;
	entity_type = 'model';
	entity_title = entity_id;
    }else if( ecore.get_node(entity_id) ){
	entity = ecore.get_node(entity_id);
	entity_type = 'individual';
	entity_title = entity_id;
    }else if( ecore.get_edge(entity_id) ){
	entity = ecore.get_edge(entity_id);
	entity_type = 'fact';
	entity_title = entity.source() + ' / ' +
	    entity.relation() + ' / ' +
	    entity.target();
    }else{
	// Apparently a bum ID.
    }

    // Create a "generic" enity-based dispatch to control all the
    // possible combinations of our "generic" interface in this case.
    // Usage of model brought in through closure.
    function _ann_dispatch(entity, entity_type, entity_op, model_id,
			   ann_key, ann_val){

	// Prepare args for ye olde dispatch.
	var args = {};
	if( entity_type == 'individual' ){
	    args['id'] = entity_id;
	}else if( entity_type == 'fact' ){
	    args['source'] = entity.source();
	    args['target'] = entity.target();
	    args['relation'] = entity.relation();
	}else{
	    // Model.
	    // TODO: would like a debug msg here.
	}

	// First, select function.
	var delegate_function = null;
	if( entity_type == 'individual' ){
	    delegate_function = manager.add_individual_annotation;
	    if( entity_op == 'remove' ){
		delegate_function = manager.remove_individual_annotation;
	    }
	    // All add/remove operations run with the same arguments:
	    // now run operation.
	    delegate_function(model_id, args['id'], ann_key, ann_val);
	}else if( entity_type == 'fact' ){
	    delegate_function = manager.add_fact_annotation;
	    if( entity_op == 'remove' ){
		delegate_function = manager.remove_fact_annotation;
	    }
	    delegate_function(model_id,
			      args['source'], args['target'], args['relation'],
			      ann_key, ann_val);
	}else{
	    // Model a wee bit different, and more simple.
	    delegate_function = manager.add_model_annotation;
	    if( entity_op == 'remove' ){
		delegate_function = manager.remove_model_annotation;
	    }
	    delegate_function(model_id, ann_key, ann_val);
	}
    }	

    ///
    /// This next section is concerned with generating the UI
    /// necessary and connecting it to the correct callbacks.
    ///
    
    // Constructor: 
    // A simple object to have a more object-like sub-widget for
    // handling the addition calls.
    //
    // widget_type - "text_area" or "text"
    function _abstract_annotation_widget(widget_type, placeholder){

	var anchor = this;

	// Create add button.
	var add_btn_args = {
    	    'generate_id': true,
    	    'type': 'button',
    	    'class': 'btn btn-success'
	};
	anchor.add_button = new tag('button', add_btn_args, 'Add');

	// The form control for the input area.
	var text_args = {
    	    'generate_id': true,
    	    //'type': 'text',
    	    'class': 'form-control',
    	    'placeholder': placeholder
	};
	if( widget_type == 'textarea' ){
	    text_args['type'] = 'text';
	    text_args['rows'] = '2';
	    anchor.text_input = new tag('textarea', text_args);
	}else{ // 'text'
	    text_args['type'] = 'text';
	    anchor.text_input = new tag('input', text_args);
	}

	// Both placed into the larger form string.
	var form = [];
	if( widget_type == 'textarea' ){
	    form = [
		'<div>',
		'<div class="form-group">',
		anchor.text_input.to_string(),
		'</div>',
    		anchor.add_button.to_string(),
		'</div>'
	    ];
	}else{ // 'text'
	    form = [
    		'<div class="form-inline">',
    		'<div class="form-group">',
		anchor.text_input.to_string(),
    		'</div>',
    		anchor.add_button.to_string(),
    		'</div>'
	    ];
	}
	anchor.form_string = form.join('');
    }

    //
    var mdl = null;
    if( ! entity ){
	alert('unknown id:' + entity_id);
    }else{
	
	// Go through our input list and create a mutable data
	// structure that we can then use to fill out the editor
	// slots.

	var ann_classes = {};
	each(annotation_config, function(ann_class){
	    var aid = ann_class['id'];

	    // Clone.
	    ann_classes[aid] = bbop.core.clone(ann_class);
	    
	    // Add our additions.
	    ann_classes[aid]['elt2ann'] = {};
	    ann_classes[aid]['list'] = [];
	    ann_classes[aid]['string'] = '???';
	    ann_classes[aid]['widget'] = null;
	});

	// Going through each of the annotation types, try and collect
	// them from the model.
	each(bbop.core.get_keys(ann_classes), function(key){
	    each(entity.get_annotations_by_filter(function(ann){
		var ret = false;
		if( ann.property(key) ){ ret = true; }
		return ret;
	    }), function(ann){

		// For every one found, assemble the actual display
		// string while storing the ids for later use.
		var kval = ann.property(key);
		var kid = bbop.core.uuid();

		// Only add to action set if mutable.
		if( ann_classes[key]['policy'] == 'mutable' ){
		    ann_classes[key]['elt2ann'][kid] = ann.id();
		}

		var acache = [];
		acache.push('<li class="list-group-item">');
		acache.push(kval);

		// Only add the delete UI bits if the policy says
		// mutable.
		if( ann_classes[key]['policy'] == 'mutable' ){
		    acache.push('<span id="'+ kid +
				'" class="badge app-delete-mark">X</span>');
		}

		acache.push('</li>');
		ann_classes[key]['list'].push(acache.join(''));
	    });

	    // Join whtaver is in the list together to get the display
	    // string.
	    // If we didn't collect anything, it's empty.
	    var str = '';
	    if( ann_classes[key]['list'].length > 0 ){
		str = ann_classes[key]['list'].join('');
		str = '<ul class="list-group">' + str + '</ul>';
	    }
	    ann_classes[key]['string'] = str;
	});

	// TODO: Generate the final code from the created structure.
	// Use the original ordering of the argument list.
	var out_cache = [];
	each(annotation_config, function(list_entry){	
    
	    //
	    var eid = list_entry['id'];
	    var entry_info = ann_classes[eid];
	    
	    //
	    var elbl =  entry_info['label'];
	    var ewid =  entry_info['widget_type'];
	    var epol =  entry_info['policy'];
	    var ecrd =  entry_info['cardinality'];
	    var eplc =  entry_info['placeholder'];
	    // Has?
	    var ehas = entry_info['list'].length || 0;
	    // UI output string.
	    var eout = entry_info['string'];

	    // Add whatever annotations we have.
	    out_cache.push('<div class="panel panel-default">');
	    //out_cache.push('<h4>' + elbl + '</h4>');
	    out_cache.push('<div class="panel-heading">' + elbl + '</div>');
	    out_cache.push('<div class="panel-body">');
	    //out_cache.push('<p>');
	    out_cache.push('<ul class="list-group">' + eout + '</ul>');
	    //out_cache.push('</p>');
	    
	    // And add an input widget if mutable...
	    //console.log('epol: ' + epol);
	    if( epol && epol == 'mutable' ){
		// ...and cardinality not one or has no items in list.
		//console.log(' ecrd: ' + ecrd);
		//console.log(' ehas: ' + ehas);
		if( ecrd != 'one' || ehas == 0 ){
		    console.log(' widget for: ' + eid);
		    var form_widget =
			    new _abstract_annotation_widget(ewid, eplc);

		    // Add to the literal output.
		    out_cache.push(form_widget.form_string);

		    // Add back to the collection for use after
		    // connecting to the DOM.
		    ann_classes[eid]['widget'] = form_widget;
		}
	    }

	    // Close out BS3 panel.
	    out_cache.push('</div>');
	    out_cache.push('</div>');
	});

	// Setup base modal.
	mdl = new bbopx.noctua.widgets.contained_modal('dialog',
						       'Annotations for: ' +
						       entity_title);
	mdl.add_to_body(out_cache.join(''));
	
	// Now that they're all in the DOM, add any delete annotation
	// actions. These are completely generic--all annotations can
	// be deleted in the same fashion.
	each(bbop.core.get_keys(ann_classes), function(ann_key){
	    each(ann_classes[ann_key]['elt2ann'], function(elt_id, ann_id){
		jQuery('#' + elt_id).click( function(evt){
		    evt.stopPropagation();
		    
		    //var annid = elt2ann[elt_id];
		    //alert('blow away: ' + annid);
		    var ann = entity.get_annotation_by_id(ann_id);
		    var ann_val = ann.property(ann_key);
		    _ann_dispatch(entity, entity_type, 'remove',
				  ecore.get_id(),ann_key, ann_val);
		    
		    // Wipe out modal on action.
		    mdl.destroy();
		});
	    });
	});
	
	// Walk through again, this time activating and annotation
	// "add" buttons that we added.
	each(bbop.core.get_keys(ann_classes), function(ann_key){
	    var form = ann_classes[ann_key]['widget'];
	    console.log('ann_key: ' + ann_key, form);
	    if( form ){ // only act if we added/defined it earlier
		
		jQuery('#' + form.add_button.get_id()).click(function(evt){
		    evt.stopPropagation();
	    
		    var val = jQuery('#' + form.text_input.get_id()).val();
		    if( val && val != '' ){
			_ann_dispatch(entity, entity_type, 'add',
				      ecore.get_id(), ann_key, val);
		    }else{
			alert('no ' + ann_key + ' added for ' + entity_id);
		    }
	    
		    // Wipe out modal.
		    mdl.destroy();	    
		});	
	    }
	});

	///
	/// Special section for special additions (autocomplete, etc.).
	/// TODO: Eventually, this should also be in the config.
	///
	
	// Add autocomplete box for ECO to evidence box.
	if( ann_classes['evidence'] && ann_classes['evidence']['widget'] ){
	    var ev_form = ann_classes['evidence']['widget'];
	    var eco_auto_args = {
    		'label_template':
		'{{annotation_class_label}} ({{annotation_class}})',
    		'value_template': '{{annotation_class}}',
    		'list_select_callback': function(doc){}
	    };
	    var eco_auto =
		    new bbop.widget.search_box(gserv, gconf,
					       ev_form.text_input.get_id(),
					       eco_auto_args);
	    eco_auto.lite(true);
	    eco_auto.add_query_filter('document_category', 'ontology_class');
	    eco_auto.add_query_filter('source', 'eco', ['+']);
	    eco_auto.set_personality('ontology');
	}
    }

    // Return our final product.
    return mdl;
};

/*
 * Object.
 * 
 * Output formatted commentary to element.
 */
bbopx.noctua.widgets.reporter = function(output_id){

    var output_elt = '#' + output_id;
    var list_elt = null;

    // ...
    function _date_str(n){

	function _zero_fill(n){
	    var ret = n;
	    if( ret < 10 ){
		ret = '0' + ret;
	    }
	    return ret;
	}
	
	var now = new Date();
	var dts = now.getFullYear() + '/' +
	    _zero_fill(now.getMonth() +1) + '/' +
	    _zero_fill(now.getDate()) + ' ' +
	    _zero_fill(now.getHours()) + ':' +
	    _zero_fill(now.getMinutes()) + ':' +
	    _zero_fill(now.getSeconds());
	return dts;
    }	
    
    this.reset = function(){
	jQuery(output_elt).empty();
	var new_list_id = bbop.core.uuid();
	list_elt = '#' + new_list_id;
	jQuery(output_elt).append('<ul id="' + new_list_id + '"></ul>');
    };

    this.comment = function(message){
	
	// Try and set some defaults.
	var uid = null;
	var color = null;
	if( message ){
	    uid = message['user_name']
		|| message['user_email']
		|| message['socket_id'];
	    color = message['user_color'];
	}

	// Start.
	var out = '<li>';

	// Add color if defined.
	out += _date_str() + ': ';
	if( uid && color ){
	    out += '<span class="bbop-mme-message-uid" style="color:' +
		color + ';">'+ uid + '</span>: ';
	}else if( uid ){
	    out += '<span class="bbop-mme-message-uid">'+ uid + '</span>: ';
	}

	// Complicated datagram.
	var intent = message['intention'] || '???';
	var sig = message['signal'] || '???';
	var mess = message['message'] || '???';
	var mess_type = message['message_type'] || '???';

	// make a sensible message.
	if( mess_type == 'error' ){
	    out += mess_type + ': there was a problem: ' + mess; 
	}else{
	    if( sig == 'merge' || sig == 'rebuild' ){
		if( intent == 'query' ){
		    out += mess_type + ': they likely refreshed';		
		}else{		    
		    out += 'performed  <span class="bbop-mme-message-op">' +
			intent + '</span> (' + mess + '), ' +
			'<span class="bbop-mme-message-req">' +
			'you should refresh' + '</span>';
		}
	    }else{
		out += mess_type + ': ' + mess;		
	    }
	}

	// End.
	out += '</li>';

	// Actually do it.
	jQuery(list_elt).prepend(out);
    };

    // Initialize.
    this.reset();
};

/*
 * Function: user_check
 *
 * Given a token, either report a bad token ot
 *
 * Parameters: 
 *  barista_loc - barista location
 *  given_token - token
 *  
 * Returns: n/a
 */
bbopx.noctua.widgets.user_check = function(barista_loc, given_token, div_id){

    var user_info_loc = barista_loc + "/user_info_by_token/" + given_token;
    jQuery.ajax({
	'type': "GET",
	'url': user_info_loc,
	'dataType': "json",
	'error': function(){alert('had an error getting user info--oops!');},
	'success': function(data){
	    if( data && data['nickname'] ){
		jQuery('#' + div_id).replaceWith(data['nickname']);
	    }else{
		alert('You seem to have a bad token; will try to clean...');
		var to_remove = 'barista_token=' + given_token;
		var new_url = window.location.toString().replace(to_remove, '');
		//var new_url = window.location;
		window.location.replace(new_url);
	    }
	}
    });
};

// If it looks like we're in an environment that supports CommonJS
// Modules 1.0, take the bbop namespace whole and iteratively export
// it. Otherwise (browser environment, etc.), take no action and
// depend on the global namespace.
if( typeof(exports) != 'undefined' ){
    //exports.bbopx = bbopx;
    bbop.core.each(bbopx, function(k, v){
	exports[k] = v;
    });
}
