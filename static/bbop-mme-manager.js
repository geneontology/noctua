/*
 * Constructor: bbop_mme_manager
 * 
 * A manager for handling the AJAX and registry.
 * Initial take from bbop.golr.manager.
 * 
 * Arguments:
 *  server_base - string for invariant part of URL.
 * 
 * Returns:
 *  a classic manager
 */
var bbop_mme_manager = function(server_base){
    bbop.registry.call(this, ['prerun', // internal
			      'postrun', // internal
			      'manager_error', // internal
			      'success',
			      'warning',
			      'error', // message, mtype, commentary
			      'inconsistent',
			      'merge'
			     ]);
    this._is_a = 'bbop_mme_manager';
    var anchor = this;

    // An internal manager for handling the unhappiness of AJAX callbacks.
    var jqm = new bbop.rest.manager.jquery(bbop.rest.response.mmm);
    jqm.use_jsonp(true); // we are definitely doing this remotely

    function _on_fail(resp, man){
	var args = [resp.message_type(), resp.message()];
	anchor.apply_callbacks('manager_error', args);
    }
    jqm.register('error', 'foo', _on_fail);

    // When we have nominal success, we still need to do some kind of
    // dispatch to the proper functionality.
    function _on_nominal_success(resp, man){
	
	// Switch on message type when there isn't a complete failure.
	var m = resp.message_type();
	if( m == 'success' ){
	    anchor.apply_callbacks('success', [resp, anchor]);
	}else if( m == 'warning' ){
	    anchor.apply_callbacks('warning', [resp, anchor]);
	}else if( m == 'error' ){
	    anchor.apply_callbacks('error', [resp, anchor]);
	}else if( m == 'inconsistent' ){
	    anchor.apply_callbacks('inconsistent', [resp, anchor]);
	}else if( m == 'merge' ){
	    anchor.apply_callbacks('merge', [resp, anchor]);
	}else{
	    alert('unimplemented message_type');	    
	}

	// Postrun goes no matter what.
	anchor.apply_callbacks('postrun', [resp, anchor]);
    }
    jqm.register('success', 'bar', _on_nominal_success);

    ///
    /// Actual mechanism.
    ///

    // http://localhost:6800/m3GetModel?modelId=gomodel:wb-GO_0043053&json.wrf=jQuery191016787577188636982_1389946235386&_=1389946235387
    // Likely triggers "inconsistent".
    anchor.get_model = function(model_id){
	var url = server_base + '/m3GetModel';
	var args = {
	    'modelId': model_id
	};
	anchor.apply_callbacks('prerun', [anchor]);
	jqm.action(url, args, 'GET');
    };
    
    // http://localhost:6800/m3AddFact?modelId=gomodel:wb-GO-0043053&individualId=gomodel:wb-GO_0043053-GO_0008150-52d86a450000002&fillerId=gomodel:wb-GO_0043053-GO_0008150-52d86a450000001&propertyId=BFO_0000051
    // Likely triggers "merge".
    anchor.add_fact = function(model_id, source_id, target_id, rel_id){
	var url = server_base + '/m3AddFact';
	var args = {
	    'modelId': model_id,
	    'individualId': source_id,
	    'fillerId': target_id,
	    'propertyId': rel_id
	};
	anchor.apply_callbacks('prerun', [anchor]);
	jqm.action(url, args, 'GET');
    };
    
    // 
    // Likely triggers "inconsistent".
    anchor.generate_model = function(class_id, db_id){
	var url = server_base + '/m3GenerateMolecularModel';
	var args = {
	    'classId': class_id,
	    'db': db_id
	};
	anchor.apply_callbacks('prerun', [anchor]);
	jqm.action(url, args, 'GET');
    };
    
};
bbop.core.extend(bbop_mme_manager, bbop.registry);
