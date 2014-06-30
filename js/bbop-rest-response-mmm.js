/* 
 * Package: bbop_rest_response_mmm.js
 * 
 * Namespace: bbop_rest_response_mmm
 * 
 * Generic BBOP handler for dealing with the gross parsing of
 * responses from the GO Molecular Model Manager REST server JSON
 * responses.
 * 
 * It will detect if the incoming response is structured correctly and
 * give safe access to fields and properties.
 * 
 * It is not meant to be a model for the parts in the data section.
 *
 * BUG/NOTE: This is slated to replace the bbop.rest.response.mmm
 * package after it reaches maturity.
 */

// if ( typeof bbop == "undefined" ){ var bbop = {}; }
// if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
// if ( typeof bbop.rest.response == "undefined" ){ bbop.rest.response = {}; }
// TODO/BUG: workaround until I get this properly folded into bbop-js.
if ( typeof bbop == "undefined" ){ bbop = require('bbop').bbop; }

/*
 * Constructor: mmm
 * 
 * Contructor for a GO MMM REST JSON response object.
 * 
 * The constructor argument is an object or a string.
 * 
 * Arguments:
 *  raw - the JSON object as a string or object
 * 
 * Returns:
 *  response object
 */
//bbop.rest.response.mmm = function(raw){
var bbop_rest_response_mmm = function(raw){
    bbop.rest.response.call(this);
    //this._is_a = 'bbop.rest.response.mmm';
    this._is_a = 'bbop_rest_response_mmm';

    // Required top-level strings in the response.
    // message and message_type are defined in the superclass.
    this._uid = null; // initiating user
    this._intention = null; // what the user wanted to do
    this._signal = null; // 'merge', etc.

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
//bbop.core.extend(bbop.rest.response.mmm, bbop.rest.response);
bbop.core.extend(bbop_rest_response_mmm, bbop.rest.response);

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
bbop_rest_response_mmm.prototype.user_id = function(){
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
bbop_rest_response_mmm.prototype.intention = function(){
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
bbop_rest_response_mmm.prototype.signal = function(){
    var ret = null;
    if( this._signal ){ ret = this._signal; }
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
//bbop.rest.response.mmm.prototype.commentary = function(){
bbop_rest_response_mmm.prototype.commentary = function(){
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
//bbop.rest.response.mmm.prototype.data = function(){
bbop_rest_response_mmm.prototype.data = function(){
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
//bbop.rest.response.mmm.prototype.model_id = function(){
bbop_rest_response_mmm.prototype.model_id = function(){
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
//bbop.rest.response.mmm.prototype.inconsistent_p = function(){
bbop_rest_response_mmm.prototype.inconsistent_p = function(){
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
//bbop.rest.response.mmm.prototype.facts = function(){
bbop_rest_response_mmm.prototype.facts = function(){
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
//bbop.rest.response.mmm.prototype.properties = function(){
bbop_rest_response_mmm.prototype.properties = function(){
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
//bbop.rest.response.mmm.prototype.individuals = function(){
bbop_rest_response_mmm.prototype.individuals = function(){
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
//bbop.rest.response.mmm.prototype.individuals = function(){
bbop_rest_response_mmm.prototype.inferred_individuals = function(){
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
bbop_rest_response_mmm.prototype.relations = function(){
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
bbop_rest_response_mmm.prototype.evidence = function(){
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
bbop_rest_response_mmm.prototype.annotations = function(){
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
 */
bbop_rest_response_mmm.prototype.model_ids = function(){
    var ret = [];
    if( this._data && this._data['model_ids'] && 
	bbop.core.is_array(this._data['model_ids']) ){
	ret = this._data['model_ids'];
    }
    return ret;
};
