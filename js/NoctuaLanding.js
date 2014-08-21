////
//// ...
////

var global_known_taxons = [
    ['3702', 'Arabidopsis thaliana'],
    ['9913', 'Bos taurus'],
    ['6239', 'Caenorhabditis elegans'],
    ['237561', 'Candida albicans (SC5314)'],
    ['9615', 'Canis lupus familiaris'],
    ['7955', 'Danio rerio'],
    ['44689', 'Dictyostelium discoideum'],
    ['7227', 'Drosophila melanogaster'],
    ['83333', 'Escherichia coli (K-12)'],
    ['9031', 'Gallus gallus'],
    ['9606', 'Homo sapiens'],
    ['10090', 'Mus musculus'],
    ['39947', 'Oryza sativa (Japonica Group)'],
    ['208964', 'Pseudomonas aeruginosa (PAO1)'],
    ['10116', 'Rattus norvegicus'],
    ['559292', 'Saccharomyces cerevisiae'],
    ['284812', 'Schizosaccharomyces pombe'],
    ['9823', 'Sus scrofa']
];

var MMEnvBootstrappingInit = function(user_token){
    
    var logger = new bbop.logger('mme bsi');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;
    var what_is = bbop.core.what_is;

    // Events registry.
    //var manager = new bbop_mme_manager(in_server_base);
    // BUG/TODO: Right now, just hardwiring the uid, but this needs to
    // be distributed by the moderator after authenication.
    var manager = new bbopx.minerva.manager(global_barista_location,
					    global_minerva_definition_name,
					    user_token);

    // GOlr location and conf setup.
    var gserv = 'http://golr.berkeleybop.org/';
    var gconf = new bbop.golr.conf(amigo.data.golr);

    // Contact points for Chris's wizard.
    var auto_wizard_term_id = 'auto_wizard_term';
    var auto_wizard_term_elt = '#' + auto_wizard_term_id;
    var auto_wizard_spdb_id = 'auto_wizard_spdb';
    var auto_wizard_spdb_elt = '#' + auto_wizard_spdb_id;
    var auto_wizard_button_generate_id = 'auto_wizard_button_generate';
    var auto_wizard_button_generate_elt = '#' + auto_wizard_button_generate_id;
    // // Contact point for the simpler blank generator.
    // var auto_blank_spdb_id = 'auto_blank_spdb';
    // var auto_blank_spdb_elt = '#' + auto_blank_spdb_id;
    // var auto_blank_button_generate_id = 'auto_blank_button_generate';
    // var auto_blank_button_generate_elt = '#' + auto_blank_button_generate_id;
    //
    // var select_memory_jump_id = 'select_memory_jump';
    // var select_memory_jump_elt = '#' + select_memory_jump_id;
    // var select_memory_jump_button_id = 'select_memory_jump_button';
    // var select_memory_jump_button_elt = '#' + select_memory_jump_button_id;
    var select_stored_jump_id = 'select_stored_jump';
    var select_stored_jump_elt = '#' + select_stored_jump_id;
    var select_stored_jump_button_id = 'select_stored_jump_button';
    var select_stored_jump_button_elt = '#' + select_stored_jump_button_id;
    // var select_scratch_jump_id = 'select_scratch_jump';
    // var select_scratch_jump_elt = '#' + select_scratch_jump_id;
    // var select_scratch_jump_button_id = 'select_scratch_jump_button';
    // var select_scratch_jump_button_elt = '#' + select_scratch_jump_button_id;
    //
    var model_data_button_id = 'model_data_button';
    var model_data_button_elt = '#' + model_data_button_id;
    var model_data_input_id = 'model_data_input';
    var model_data_input_elt = '#' + model_data_input_id;
    // Create new model from taxon.
    var model_create_by_taxon_button_id = 'button_taxon_for_create';
    var model_create_by_taxon_button_elt = '#' + model_create_by_taxon_button_id;
    var model_create_by_taxon_input_id = 'select_taxon_for_create';
    var model_create_by_taxon_input_elt = '#' + model_create_by_taxon_input_id;
    // Create new model from nothing.
    var model_create_by_nothing_id = 'button_nothing_for_create';
    var model_create_by_nothing_elt = '#' + model_create_by_nothing_id;
    // Create new model from nothing.
    var model_export_by_id_button_id = 'button_id_for_export';
    var model_export_by_id_button_elt = '#' + model_export_by_id_button_id;
    var model_export_by_id_input_id = 'select_id_for_export';
    var model_export_by_id_input_elt = '#' + model_export_by_id_input_id;

    ///
    /// Helpers.
    ///

    var compute_shield_modal = null;

    // Block interface from taking user input while
    // operating.
    function _shields_up(){
	if( compute_shield_modal ){
	    // Already have one.
	}else{
	    ll('shield up');
	    compute_shield_modal = bbopx.noctua.widgets.compute_shield();
	    compute_shield_modal.show();
	}
    }    
    // Release interface when transaction done.
    function _shields_down(){
	if( compute_shield_modal ){
	    ll('shield down');
	    compute_shield_modal.destroy();
	    compute_shield_modal = null;
	}else{
	    // None to begin with.
	}
    }

    function _jump_to_page(page_url){
	var newrl = bbopx.noctua.widgets.build_token_link(page_url, user_token);
	window.location.replace(newrl);
    }

    // On any model build success, forward to the new page.
    // var wizard_jump_term = null;
    // var wizard_jump_db = null;
    function _generated_model(resp, man){
	var id = resp.data()['id'];
	var new_url = '/seed/model/' + id;
	_jump_to_page(new_url);
    }

    // Internal registrations.
    manager.register('prerun', 'foo', _shields_up);
    manager.register('postrun', 'fooA', _shields_down, 9);
    manager.register('manager_error', 'foo', function(resp, man){
	alert('There was a manager error (' +
	      resp.message_type() + '): ' + resp.message());
    }, 10);

    // Likely the result of unhappiness on Minerva.
    manager.register('warning', 'foo', function(resp, man){
	alert('Warning: ' + resp.message() + '; ' +
	      'your operation was likely not performed');
    }, 10);

    // Likely the result of serious unhappiness on Minerva.
    manager.register('error', 'foo', function(resp, man){

	// Do something different if we think that this is a
	// permissions issue.
	var perm_flag = "InsufficientPermissionsException";
	var token_flag = "token";
	if( resp.message() && resp.message().indexOf(perm_flag) != -1 ){
	    alert('Error: it seems like you do not have permission to ' +
		  'perform that operation.');
	}else if( resp.message() && resp.message().indexOf(token_flag) != -1 ){
	    alert("Error: it seems like you have a bad token...");
	}else{
	    // Generic error.
	    alert('Error (' +
		  resp.message_type() + '): ' +
		  resp.message() + '; ' +
		  'your operation was likely not performed.');
	}
    }, 10);

    // Likely the result of a meta operation performed against
    // Minerva. Likely will be performing UI updates given the new
    // data.
    // However, export also comes through this way, so we check for
    // that first.
    manager.register('meta', 'foo', function(resp, man){
	
	if( resp.export_model() ){

	    // 
	    var exp = resp.export_model();
	    var rand = bbop.core.uuid();
	    //alert(exp);

	    var enc_exp = encodeURIComponent(exp);
	    var form_set = [
		'<form id="'+ rand +'" method="POST" action="/action/display">',
		'<input type="hidden" name="thing" value="'+ enc_exp +'">',
		'</form>'
	    ];
	    jQuery('body').append(form_set.join(''));
	    jQuery('#'+rand).submit();

	    // var expdia = new bbopx.noctua.widgets.contained_modal(null, '<strong>Export</strong>', exp);
	    // expdia.show();

	}else{
	    
	    // Insert model IDs into "Select by ID" interface.
	    jQuery(select_stored_jump_elt).empty(); // Clear interfaces.
	    var model_ids = resp.model_ids();
	    var rep_cache = [];
	    each(model_ids, function(model_id){
		rep_cache.push('<option>');
		rep_cache.push(model_id);
		rep_cache.push('</option>');
	    });
	    var rep_str = rep_cache.join('');
	    jQuery(select_stored_jump_elt).append(rep_str);
	    
	    // Also add this list to the export interface.
	    jQuery(model_export_by_id_input_elt).empty();
	    jQuery(model_export_by_id_input_elt).append(rep_str);
	    
	    // Make jump interface jump on click.
	    jQuery(select_stored_jump_button_elt).click(function(evt){
		var id = jQuery(select_stored_jump_elt).val();
		//alert('val: '+ id);
		var new_url = '/seed/model/' + id;
		_jump_to_page(new_url);
	    });
	    
	    // //
	    
	    // // Insert model IDs into "Select by ID" interface.
	    // jQuery(model_export_by_id_input_elt).empty(); // Clear interfaces.
	    // var exp_cache = [];
	    // each(model_ids, function(model_id){
	    //     ex_cache.push('<option>');
	    //     rep_cache.push(model_id);
	    //     rep_cache.push('</option>');
	    // });
	    // var rep_str = rep_cache.join('');
	    // jQuery(select_stored_jump_elt).append(rep_str);
	    
	    // Make jump interface jump on click.
	    jQuery(select_stored_jump_button_elt).click(function(evt){
		var id = jQuery(select_stored_jump_elt).val();
		//alert('val: '+ id);
		var new_url = '/seed/model/' + id;
		_jump_to_page(new_url);
	    });
	    
	    // Make export interface trigger on click.
	    jQuery(model_export_by_id_button_elt).click(function(evt){
		var id = jQuery(model_export_by_id_input_elt).val();
		manager.export_model(id);
		//alert('val: '+ id);
		// var new_url = '/action/export/' + id;
		// _jump_to_page(new_url);
	    });

	    //
	    
	    // Insert taxon info into "Create new fmodel fron taxon"
	    // interface.
	    jQuery(model_create_by_taxon_input_elt).empty();
	    var tax_cache = [];
	    each(global_known_taxons, function(tax_pair){
		var taxid = tax_pair[0];
		var tname = tax_pair[1];
		tax_cache.push('<option value="' + taxid + '">');
		tax_cache.push(tname);
		tax_cache.push('</option>');
	    });
	    var tax_str = tax_cache.join('');
	    jQuery(model_create_by_taxon_input_elt).append(tax_str);
	    
	    // Get create-by-taxon ready to go.
	    jQuery(model_create_by_taxon_button_elt).click(function(evt){
		var id = jQuery(model_create_by_taxon_input_elt).val();
		//alert('val: ' + id);
		manager.generate_model_by_taxon(id);
	    });
	}
    });

    // Likely result of a new model being built on Minerva.
    manager.register('rebuild', 'foo', function(resp, man){
	_generated_model(resp, man);
    }, 10);

    ///
    /// Activate autocomplete in input boxes.
    /// Add the local responders.
    ///

    //var auto_wizard_term_val = null;
    var auto_wizard_term_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class}}',
    	'list_select_callback':
    	function(doc){
    	    //auto_wizard_term_val = doc['annotation_class'];
    	}
    };
    var auto_wizard_term =
	new bbop.widget.search_box(gserv, gconf,
				   'auto_wizard_term', auto_wizard_term_args);
    auto_wizard_term.add_query_filter('document_category', 'ontology_class');
    auto_wizard_term.set_personality('ontology');

    // // species database
    // //var auto_wizard_spdb_val = null;
    // var auto_wizard_spdb_args = {
    // 	'label_template': '{{assigned_by}}',
    // 	'value_template': '{{assigned_by}}',
    // 	'list_select_callback':
    // 	function(doc){
    // 	    //auto_wizard_spdb_val = doc['assigned_by'];
    // 	}
    // };
    // var auto_wizard_spdb =
    // 	new bbop.widget.search_box(gserv, gconf,
    // 				   'auto_wizard_spdb', auto_wizard_spdb_args);
    // auto_wizard_spdb.add_query_filter('document_category', 'annotation');
    // auto_wizard_spdb.set_personality('annotation');

    ///
    /// Activate UI buttons.
    ///

    // NOTE: Activate from taxon is done in the meta return handler
    // because we want to model the (not yet) return of current
    // species from Minerva.

    // Active create-from-nothing.
    jQuery(model_create_by_nothing_elt).click(function(evt){
	evt.stopPropagation();
	evt.preventDefault();
	manager.generate_model();
    });

    // Activate create from class and db.
    jQuery(auto_wizard_button_generate_elt).click(function(){
    	var term = auto_wizard_term.content();
    	//var spdb = auto_wizard_spdb.content();
    	var spdb = jQuery(auto_wizard_spdb_elt).val();

    	if( ! term || term == '' || ! spdb || spdb == '' ){
    	    alert('necessary field empty');
    	}else{
	    // BUG: For Chris.
	    // wizard_jump_term = term;
	    // wizard_jump_db = spdb;
	    // manager.generate_model(wizard_jump_term, wizard_jump_db);
	    manager.generate_model_by_class_and_db(term, spdb);
    	}
    }
						 );
    // // ...
    // jQuery(auto_blank_button_generate_elt).click(function(){
    // 	var spdb = jQuery(auto_blank_spdb_elt).val();

    // 	if( ! spdb || spdb == '' ){
    // 	    alert('necessary field empty');
    // 	}else{
    // 	    manager.generate_model_by_db(spdb);
    // 	}
    // });

    // Activate importer.
    jQuery(model_data_button_elt).click(function(evt){
	evt.stopPropagation();
	evt.preventDefault();
	//alert('not yet implemented');
	var in_str = jQuery(model_data_input_elt).val(); 
	manager.import_model(in_str);
    });

    ///
    /// Get info from server.
    ///

    manager.get_model_ids();
};

// Start the day the jsPlumb way.
jsPlumb.ready(function(){

    // Try to define token.
    var start_token = null;
    if( global_barista_token ){
	start_token = global_barista_token;
    }

    // Next we need a manager to try and pull in the model.
    if( typeof(global_minerva_definition_name) === 'undefined' ||
	typeof(global_barista_location) === 'undefined' ){
	alert('environment not ready');
    }else{
	// Only roll if the env is correct.
	// Will use the above variables internally (sorry).
	MMEnvBootstrappingInit(start_token);

	// When all is said and done, let's also fillout the user
	// name just for niceness. This is also a test of CORS in
	// express.
	if( start_token ){
	    bbopx.noctua.widgets.user_check(global_barista_location,
					    start_token, 'user_name_info');
	}
    }
});
