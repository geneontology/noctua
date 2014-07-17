/*
 * Constructor: bbop_mme_manager2
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
var bbop_mme_manager2 = function(barista_location, namespace, user_token){
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'query');
	var req = new bbop_mmm_request('model', 'get');
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'query');
	var req = new bbop_mmm_request('model', 'all-model-ids');
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "merge".
    anchor.add_fact = function(model_id, source_id, target_id, rel_id){

	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('edge', 'add');
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

	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('edge', 'remove');
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('individual', 'create');
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('individual', 'add-type');
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('individual', 'add-type');
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('individual', 'remove-type');
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('individual', 'remove-type');
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

	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('individual', 'remove');
	req.model_id(model_id);
	req.individual(indv_id);
	reqs.add(req);

	var args = reqs.callable();
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "query".
    // Expect: "success" and "meta".
    anchor.export_model = function(model_id){

	// 
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'query');
	var req = new bbop_mmm_request('model', 'export');
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('model', 'import');
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'query');
	var req = new bbop_mmm_request('model', 'store');
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('individual', 'add-annotation');
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('edge', 'add-annotation');
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('model', 'add-annotation');
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('individual', 'remove-annotation');
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('edge', 'remove-annotation');
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
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('model', 'remove-annotation');
	req.model_id(model_id);
	req.annotation_values(key, value);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.generate_model = function(class_id, db_id){

	//
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('model', 'generate');
	req.add('db', db_id);
	req.add('subject', class_id);
	reqs.add(req);

	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.generate_blank_model = function(db_id){

	//
	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');
	var req = new bbop_mmm_request('model', 'generate-blank');
	req.add('db', db_id);
	reqs.add(req);
	
	var args = reqs.callable();	
    	anchor.apply_callbacks('prerun', [anchor]);
    	jqm.action(anchor._url, args, 'GET');
    };
    
    // Intent: "action".
    // Expect: "success" and "rebuild".
    anchor.bootstrap_model = function(bootstrap_obj){

	var reqs = new bbop_mmm_request_set(anchor.user_token(), 'action');

	// Just get a new model going.
	var req = new bbop_mmm_request('model', 'generate-blank');
	//req.add('db', db_id); // unecessary
	reqs.add(req);

	each(bootstrap_obj,
	     function(ob){

		 // Now, for each of these, we are going to be adding
		 // stuff to MF instances. If there is no MF coming
		 // in, we are just going to use GO:0003674.
		 var mfs = [];
		 var bps = [];
		 var ccs = [];
		 each(bo['terms'],
		      function(tid){
			  if( t2a[tid] == 'molecular_function' ){
			      mfs.push(tid);
			  }else if( t2a[tid] == 'biological_process' ){
			      bps.push(tid);
			  }else if( t2a[tid] == 'cellular_component' ){
			      ccs.push(tid);
			  }
		      });
		 // There must be this no matter what.
		 if( bbop.core.is_empty(mfs) ){
 		     mfs.push('GO:0003674');
		 }

		 // We are going to be creating instances off of the
		 // MFs.
		 each(mfs,
		      function(mf){
			  var req = new bbop_mmm_request('individual','create');
			  
			  // Add in the occurs_in from CC.
			  each(ccs,
			       function(cc){
				   req.svf_expressions(cc, 'occurs_in');
			       });

			  // Add in the enabled_by from entities.
			  each(bo['entities'],
			       function(ent){
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
bbop.core.extend(bbop_mme_manager2, bbop.registry);
