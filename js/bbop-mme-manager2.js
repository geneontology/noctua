/*
 * Constructor: bbop_mme_manager2
 * 
 * A manager for handling the AJAX and registry.
 * Initial take from bbop.golr.manager.
 * 
 * Arguments:
 *  user_id - identifying string for the user of the manager
 *  server_base - string for invariant part of URL.
 * 
 * Returns:
 *  a classic manager
 */
var bbop_mme_manager2 = function(user_id, server_base){
    bbop.registry.call(this, ['prerun', // internal
			      'postrun', // internal
			      'manager_error', // internal
			      //'success', // uninformative
			      'merge',
			      'rebuild',
			      'meta',
			      'warning', // trump
			      'error' //trump
			     ]);
    this._is_a = 'bbop_mme_manager2';
    var anchor = this;
    var url = server_base + '/m3Batch';

    // Kinda needs this for all calls.
    anchor._user_id = user_id;
    if( ! anchor._user_id ){
	throw new Error('user_id must be an argument');
    }

    // An internal manager for handling the unhappiness of AJAX callbacks.
    //var jqm = new bbop.rest.manager.jquery(bbop.rest.response.mmm);
    var jqm = new bbop.rest.manager.jquery(bbop_rest_response_mmm);
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
	if( m == 'error' ){
	    // Errors trump everything.
	    anchor.apply_callbacks('error', [resp, anchor]);
	}else if( m == 'warning' ){
	    // Don't really have anything warning yet.
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
    /// Actual mechanism.
    ///

    // Intent: "query".
    // Expect: "success" and "rebuild".
    anchor.get_model = function(model_id){

	// 
	var reqs = new bbop_mmm_request_set(anchor._user_id, 'query');
	var req = new bbop_mmm_request('model', 'get');
	req.model_id(model_id);
	reqs.add(req);
	var args = reqs.callable();
	
	anchor.apply_callbacks('prerun', [anchor]);
	jqm.action(url, args, 'GET');
    };
    
    // Intent: "query".
    // Expect: "success" and "meta".
    anchor.get_model_ids = function(){

	// 
	var reqs = new bbop_mmm_request_set(anchor._user_id, 'query');
	var req = new bbop_mmm_request('model', 'all-model-ids');
	reqs.add(req);
	var args = reqs.callable();
	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "merge".
    anchor.add_fact = function(model_id, source_id, target_id, rel_id){

	var reqs = new bbop_mmm_request_set(anchor._user_id, 'action');
	var req = new bbop_mmm_request('edge', 'add');
	req.model_id(model_id);
	req.fact(source_id, target_id, rel_id);
	reqs.add(req);
	var args = reqs.callable();

    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "merge".
    anchor.remove_fact = function(model_id, source_id, target_id, rel_id){

	var reqs = new bbop_mmm_request_set(anchor._user_id, 'action');
	var req = new bbop_mmm_request('edge', 'remove');
	req.model_id(model_id);
	req.fact(source_id, target_id, rel_id);
	reqs.add(req);
	var args = reqs.callable();

    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(url, args, 'GET');
    };
    
    // // Intent: "action".
    // // Expect: "success" and "merge".
    // anchor.add_simple_composite = function(model_id, class_id,
    // 					   enabled_by_id, occurs_in_id){
    // 	var url = server_base + '/m3CreateSimpleCompositeIndividual';
    // 	var args = {
    // 	    'modelId': model_id,
    // 	    'classId': class_id,
    // 	    'enabledById': enabled_by_id,
    // 	    'occursInId': occurs_in_id
    // 	};
    // 	anchor.apply_callbacks('prerun', [anchor]);
    // 	jqm.action(url, args, 'GET');
    // };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.remove_individual = function(model_id, indv_id){

	var reqs = new bbop_mmm_request_set(anchor._user_id, 'action');
	var req = new bbop_mmm_request('individual', 'remove');
	req.model_id(model_id);
	req.individual(indv_id);
	reqs.add(req);
	var args = reqs.callable();

    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(url, args, 'GET');
    };
    
    // // 
    // // Likely triggers "instantiate".
    // anchor.import_model = function(model_string){
    // 	var url = server_base + '/m3ImportModel';
    // 	var args = {
    // 	    'modelString': model_string
    // 	};
    // 	anchor.apply_callbacks('prerun', [anchor]);
    // 	jqm.action(url, args, 'GET');
    // };
    
    // // 
    // // BUG/TODO: Likely triggers ???
    // anchor.export_model = function(model_id){
    // 	var url = server_base + '/m3ExportModel';
    // 	var args = {
    // 	    'modelId': model_id
    // 	};
    // 	anchor.apply_callbacks('prerun', [anchor]);
    // 	jqm.action(url, args, 'GET');
    // };
    
    // // 
    // // Likely triggers "success", "error", etc.
    // anchor.store_model = function(model_id){
    // 	var url = server_base + '/m3StoreModel';
    // 	var args = {
    // 	    'modelId': model_id
    // 	};
    // 	anchor.apply_callbacks('prerun', [anchor]);
    // 	jqm.action(url, args, 'GET');
    // };
    
    // // 
    // // Likely triggers "inconsistent".
    // anchor.generate_model = function(class_id, db_id){
    // 	var url = server_base + '/m3GenerateMolecularModel';
    // 	var args = {
    // 	    'classId': class_id,
    // 	    'db': db_id
    // 	};
    // 	anchor.apply_callbacks('prerun', [anchor]);
    // 	jqm.action(url, args, 'GET');
    // };
    
    // // 
    // // Likely triggers "inconsistent".
    // anchor.generate_blank_model = function(db_id){
    // 	var url = server_base + '/m3GenerateBlankMolecularModel';
    // 	var args = {
    // 	    'db': db_id
    // 	};
    // 	anchor.apply_callbacks('prerun', [anchor]);
    // 	jqm.action(url, args, 'GET');
    // };
    
};
bbop.core.extend(bbop_mme_manager2, bbop.registry);
