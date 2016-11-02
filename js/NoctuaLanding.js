////
//// ...
////

// Let jshint pass over over our external globals (browserify takes
// care of it all).
/* global jQuery */
/* global global_golr_server */
/* global global_golr_neo_server */
/* global global_minerva_definition_name */
/* global global_barista_location */
/* global global_noctua_context */
/* global jsPlumb */
/* global global_barista_token */

var us = require('underscore');
var bbop = require('bbop-core');
var amigo = require('amigo2');
var bbop_legacy = require('bbop').bbop;

var widgetry = require('noctua-widgetry');

// Aliases
var each = us.each;
var is_defined = bbop.is_defined;
var what_is = bbop.what_is;
var uuid = bbop.uuid;

// Code here will be ignored by JSHint, as we are technically
// "redefining" jQuery (although we are not).
/* jshint ignore:start */
var jQuery = require('jquery');
/* jshint ignore:end */

var notify_minerva = require('toastr'); // notifications
var notify_amigo = require('toastr'); // notifications

var class_expression = require('class-expression');
var minerva_requests = require('minerva-requests');
var noctua_model = require('bbop-graph-noctua');

//
var jquery_engine = require('bbop-rest-manager').jquery;
//
var minerva_manager = require('bbop-manager-minerva');
var barista_response = require('bbop-response-barista');
//
var golr_manager = require('bbop-manager-golr');
var golr_conf = require('golr-conf');
var golr_response = require('bbop-response-golr');


// // Harumph.
// var global_known_taxons = [
//     ['NCBITaxon:3702', 'Arabidopsis thaliana'],
//     ['NCBITaxon:9913', 'Bos taurus'],
//     ['NCBITaxon:6239', 'Caenorhabditis elegans'],
//     ['NCBITaxon:237561', 'Candida albicans (SC5314)'],
//     ['NCBITaxon:9615', 'Canis lupus familiaris'],
//     ['NCBITaxon:7955', 'Danio rerio'],
//     ['NCBITaxon:44689', 'Dictyostelium discoideum'],
//     ['NCBITaxon:7227', 'Drosophila melanogaster'],
//     ['NCBITaxon:83333', 'Escherichia coli (K-12)'],
//     ['NCBITaxon:9031', 'Gallus gallus'],
//     ['NCBITaxon:9606', 'Homo sapiens'],
//     ['NCBITaxon:10090', 'Mus musculus'],
//     ['NCBITaxon:39947', 'Oryza sativa (Japonica Group)'],
//     ['NCBITaxon:208964', 'Pseudomonas aeruginosa (PAO1)'],
//     ['NCBITaxon:10116', 'Rattus norvegicus'],
//     ['NCBITaxon:559292', 'Saccharomyces cerevisiae'],
//     ['NCBITaxon:284812', 'Schizosaccharomyces pombe'],
//     ['NCBITaxon:9823', 'Sus scrofa']
// ];

///
/// Helpers.
///

// Button/link as edit.
function _generate_jump_url(id, editor_type) {
    var new_url = "";
    if (editor_type === 'monarch' || editor_type === 'hpo') {
	new_url = '/basic/' + editor_type + '/' + id;
    }
    else {
	new_url = '/editor/graph/' + id;
    }
    return new_url;
}

///
/// Main.
///

var MinervaBootstrapping = function(user_token){

    var logger = new bbop.logger('min bstr');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Events registry.
    // Add manager and default callbacks to repl.
    var engine = new jquery_engine(barista_response);
    var manager = new minerva_manager(global_barista_location,
				      global_minerva_definition_name,
				      user_token, engine, 'async');

    // GOlr location and conf setup.
    var gserv = global_golr_server;
    var gconf = new bbop_legacy.golr.conf(amigo.data.golr);

    // Create new model from nothing.
    var model_create_by_nothing_id = 'create_button_graph';
    var model_create_by_nothing_elt = '#' + model_create_by_nothing_id;
    // Create new model from process and taxon.
    var model_create_by_protax_button_id = 'button_protax_for_create';
    var model_create_by_protax_button_elt =
	    '#' + model_create_by_protax_button_id;
    var model_create_by_protax_input_proc_id = 'select_protax_proc_for_create';
    var model_create_by_protax_input_proc_elt =
	    '#' + model_create_by_protax_input_proc_id;
    var model_create_by_protax_input_tax_id = 'select_protax_tax_for_create';
    var model_create_by_protax_input_tax_elt =
	    '#' + model_create_by_protax_input_tax_id;
    // Create new model from nothing for form.
    var model_create_monarch_button_id = 'create_button_monarch';
    var model_create_monarch_button_elt = '#' + model_create_monarch_button_id;
    var model_create_hpo_button_id = 'create_button_hpo';
    var model_create_hpo_button_elt = '#' + model_create_hpo_button_id;
    // // Export DOM hooks.
    // var model_export_by_id_def_button_id = 'button_id_for_def_export';
    // var model_export_by_id_def_button_elt = '#'+model_export_by_id_def_button_id;
    // var model_export_by_id_gaf_button_id = 'button_id_for_gaf_export';
    // var model_export_by_id_gaf_button_elt = '#'+model_export_by_id_gaf_button_id;
    // var model_export_by_id_gpd_button_id = 'button_id_for_gpd_export';
    // var model_export_by_id_gpd_button_elt = '#'+model_export_by_id_gpd_button_id;
    // var model_export_by_id_input_id = 'select_id_for_export';
    // var model_export_by_id_input_elt = '#' + model_export_by_id_input_id;
    // Importer DOM hooks.
    var model_data_button_id = 'model_data_button';
    var model_data_button_elt = '#' + model_data_button_id;
    var model_data_input_id = 'model_data_input';
    var model_data_input_elt = '#' + model_data_input_id;

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
	    compute_shield_modal = widgetry.compute_shield();
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
	var newrl = widgetry.build_token_link(page_url, user_token);
	window.location.replace(newrl);
    }

    // On any model build success, forward to the new page.
    // Typically a callback for rebuild.
    var to_editor = 'graph';
    function _generated_model(resp, man) {
	var id = resp.data()['id'];
	_jump_to_page(_generate_jump_url(id, to_editor));
    }

    // Internal registrations.
    manager.register('prerun', function(){
	//_shields_up();
	notify_minerva.info("Getting meta-information from Minerva...");
    });
    manager.register('postrun', function(){
	//_shields_down();
	notify_minerva.clear();
    });
    manager.register('manager_error', function(resp, man){
	alert('There was a manager error (' +
	      resp.message_type() + '): ' + resp.message());
    }, 10);

    // Likely the result of unhappiness on Minerva.
    manager.register('warning', function(resp, man){
	alert('Warning: ' + resp.message() + '; ' +
	      'your operation was likely not performed');
    }, 10);

    // Likely the result of serious unhappiness on Minerva.
    manager.register('error', function(resp, man){

	// Do something different if we think that this is a
	// permissions issue.
	var perm_flag = "InsufficientPermissionsException";
	var token_flag = "token";
	if( resp.message() && resp.message().indexOf(perm_flag) !== -1 ){
	    alert('Error: it seems like you do not have permission to ' +
		  'perform that operation. Did you remember to login?');
	}else if( resp.message() && resp.message().indexOf(token_flag) !== -1 ){
	    alert("Error: it seems like you have a bad token...");
	}else{
	    // Generic error.
	    alert('Error (' +
		  resp.message_type() + '): ' +
		  resp.message() + '; ' +
		  'your operation was likely not performed.');
	}
    }, 10);

    // A regexp we'll compile now to try and get rid of some pretty
    // uggo strings that may come back for the model titles.
    var uggo_string = /\"([^]*)\"\^\^xsd\:string/;

    // Likely the result of a meta operation performed against
    // Minerva. Likely will be performing UI updates given the new
    // data.
    // However, export also comes through this way, so we check for
    // that first.
    manager.register('meta', function(resp, man){
	// Got a model export.
	if( resp.export_model() ){
	    console.log('meta: export kick');

	    //
	    var exp = resp.export_model();
	    var rand = uuid();
	    //alert(exp);

	    var enc_exp = encodeURIComponent(exp);
	    var form_set = [
		'<form id="'+ rand +'" method="POST" action="/action/display">',
		'<input type="hidden" name="thing" value="'+ enc_exp +'">',
		'</form>'
	    ];
	    jQuery('body').append(form_set.join(''));
	    jQuery('#'+rand).submit();

	    // var expdia = new widgetry.contained_modal(null, '<strong>Export</strong>', exp);
	    // expdia.show();

	}else if( resp.data() && resp.data()['id'] &&
		  us.keys(resp.data()).length === 1 ){
	    // Got a seeding response?
	    console.log('meta: seeding kick');
	    
	    // Kick out to the new model.
	    _generated_model(resp, man);
	    
	}else{
	    // Rebuild interface with general meta data.

	    // We'll construct a hash that looks like:
	    // {'<MODEL_ID>' : {<ANN_KEY_1>: [VAL, VAL], <ANN_KEY_2>: [], },  }
	    var model_to_value_hash_list = {};
	    
	    // Get the model meta information and sort the models by
	    // alphabetical titles.
	    var models_meta = resp.models_meta();
	    var models_meta_ro = resp.models_meta_read_only();
	    each(models_meta, function(annotations, mid){
		
		// Ensure mid.
		if( ! model_to_value_hash_list[mid] ){
		    model_to_value_hash_list[mid] = {};
		}
		
		// Collect and bin all the annotations.
		var key_to_value_list = {};
		each(annotations, function(ann){
		    var k = ann['key'];
		    // Ensure list.
		    if( typeof(key_to_value_list[k]) === 'undefined' ){
			key_to_value_list[k] = [];
		    }
		    key_to_value_list[k].push(ann['value']);
		});
		
		// Attach results to model id in hash.
		model_to_value_hash_list[mid] = key_to_value_list;
	    });
	    
	    // Try and probe out the best title from the data we
	    // having there.
	    var _get_model_title = function(model_id){
		
		var mtitle = model_id; // default return
		var hlists = model_to_value_hash_list[model_id];
		
		if( hlists && hlists['title'] ){
		    var tmp_title = hlists['title'].join("|");
		    var match = tmp_title.match(uggo_string);
		    if( ! match ){
			mtitle = tmp_title;
		    }else{
			mtitle = match[1];
		    }
		}
		
		return mtitle;
	    };
	    
	    // Get user contributors to model.
	    var _model_contributor_list = function(model_id){
		var retlist = [];
		
		if( models_meta && models_meta[model_id]){
		    each(models_meta[model_id], function(row) {
			if (row.key === 'contributor') {
			    var url = '<a href=' + row.value +
				    ' target="blank">' + row.value +
				    '</a>';
			    retlist.push(url);
			}
		    });
		}
		
		return retlist;
	    };
	    
	    // Get group contributors to model.
	    var _model_group_list = function(model_id){
		var retlist = [];
		
		if( models_meta && models_meta[model_id]){
		    each(models_meta[model_id], function(row) {
			if (row.key === 'providedBy') {
			    var url = '<a href=' + row.value +
				    ' target="blank">' + row.value +
				    '</a>';
			    retlist.push(url);
			}
		    });
		}
		
		return retlist;
	    };
	    
	    //
	    var _model_type = function(model_id){
		var retval = 'hpo';
		
		var hlists = model_to_value_hash_list[model_id];
		if ( hlists && hlists['dc11:type'] ) {
		    // Search all annotations for state.
		    each(hlists['dc11:type'], function(entry){
			if (entry ) {
			    retval = entry;
			}
		    });
		}
		return retval;
	    };
	    
	    //
	    var _model_state = function(model_id){
		var retval = '???';
		
		var hlists = model_to_value_hash_list[model_id];
		if( hlists && hlists['state'] ){
		    var valcache = [];
		    // Search all annotations for state.
		    each(hlists['state'], function(entry){
			if(entry){
			    valcache.push(entry);
			}
		    });
		    //
		    if( valcache.length > 0 ){
			retval = valcache.join(', ');
		    }
		}
		
		return retval;
	    };
	    
	    //
	    var _model_date = function(model_id){
		var retval = '???';
		
		if( models_meta && models_meta[model_id] ){
		    each(models_meta[model_id], function(row) {
		    	if (row.key === 'date') {
		    	    retval = row.value;
		    	}
		    });
		}
		
		return retval;
	    };
	    
	    // Check if model is modified.
	    var _model_modified_p = function(model_id){
		var retval = false;
		
		if( models_meta_ro && models_meta_ro[model_id] &&
		    models_meta_ro[model_id]['modified-p'] &&
		    models_meta_ro[model_id]['modified-p'] === true ){
			
			retval = true;
		    }
		
		return retval;
	    };
	    
	    // Check if model is a template.
	    var _model_template_p = function(model_id){
		var retval = false;
		
		var hlists = model_to_value_hash_list[model_id];
		
		if( hlists && hlists['template'] ){
		    // Search all annotations for templateness.
		    each(hlists['template'], function(entry){
			if(entry === 'true'){
			    retval = true;
			}
		    });
		}
		
		return retval;
	    };
	    
	    // Check if model is deprecated.
	    var _model_deprecated_p = function(model_id){
		var retval = false;
		
		var hlists = model_to_value_hash_list[model_id];
		
		if( hlists && hlists['deprecated'] ){
		    // Search all annotations for deprecatedness.
		    each(hlists['deprecated'], function(entry){
			if(entry === 'true'){
			    retval = true;
			}
		    });
		}
		
		return retval;
	    };
	    
	    var model_meta_ids = us.keys(models_meta) || [];
	    //console.log(model_meta_ids);
	    var sorted_model_meta_ids = model_meta_ids.sort(function(a, b){
		var lc_a = _get_model_title(a).toLowerCase();
		var lc_b = _get_model_title(b).toLowerCase();
		var gt_p = lc_a < lc_b;
		var retval = 0;
		// Std sort.
		if( gt_p === true ){ retval = -1; }
		else if( gt_p === false ){ retval = 1; }
		// Bad if one is deprecated.
		if( _model_deprecated_p(a) !== _model_deprecated_p(b)){
		    if( _model_deprecated_p(a) ){
			retval = 1;
		    }else if( _model_deprecated_p(b) ){
			retval = -1;
		    }
		}
		
		return retval;
	    });
	    
	    if (sorted_model_meta_ids.length > 0) {

		// Generate table contents.
		var geneont_table_cache = [];
		var monarch_table_cache = [];
		each(sorted_model_meta_ids, function(model_id){
		    
		    var geneont_tr_cache = [];
		    var monarch_tr_cache = [];
		    
		    // Title (go+monarch).
		    var mtitle =  _get_model_title(model_id);
		    geneont_tr_cache.push(mtitle);
		    monarch_tr_cache.push(mtitle);
		    
		    // Contributors (go+monarch).
		    var clist = _model_contributor_list(model_id);
		    geneont_tr_cache.push(clist.join(', '));
		    monarch_tr_cache.push(clist.join(', '));

		    // State (go+monarch).
		    var state = _model_state(model_id);
	            geneont_tr_cache.push(state);
	            monarch_tr_cache.push(state);
		    
		    // Date (go+monarch).
		    var date = _model_date(model_id);
		    geneont_tr_cache.push(date);
		    monarch_tr_cache.push(date);
		    
		    // Check to see if it's modified and highlight that
		    // fact (go).
		    if( _model_modified_p(model_id) ){
			geneont_tr_cache.push('&#x2699;');
		    }else{
			geneont_tr_cache.push('');
		    }
		    
		    // Check to see if it's a template and
		    // highlight that fact (go).
		    if( _model_template_p(model_id) ){
			geneont_tr_cache.push('&#x1F503;');
		    }else{
			geneont_tr_cache.push('');
		    }
		    
		    // Check to see if it's deprecated and
		    // highlight that fact (go).
		    if( _model_deprecated_p(model_id) ){
			geneont_tr_cache.push('&#x1F622;');
		    }else{
			geneont_tr_cache.push('');
		    }
		    
	            // Cram all the buttons in.
		    var bstrs = [];
		    if (global_noctua_context !== 'monarch') {
			bstrs = [
			    '<a class="btn btn-primary btn-xs" href="' + widgetry.build_token_link(_generate_jump_url(model_id, 'graph'), user_token) +'" role="button">Edit</a>',
			    // '<a class="btn btn-primary btn-xs" href="' + widgetry.build_token_link(_generate_jump_url(model_id, 'basic'), user_token) +'" role="button"><strike>Form</strike></a>',
			    '<a class="btn btn-primary btn-xs" href="/download/'+model_id+'/gaf" role="button">GAF</a>',
			    '<a class="btn btn-primary btn-xs" href="/download/'+model_id+'/owl" role="button">OWL</a>'
			];

			geneont_tr_cache.push(bstrs.join('&nbsp;'));

		    }else{ // monarch

			var model_type = _model_type(model_id);
			
	        	bstrs.push('<a class="btn btn-primary btn-xs" href="' + widgetry.build_token_link(_generate_jump_url(model_id, model_type), user_token) +'" role="button">Form</a>');
	    		bstrs.push('<a class="btn btn-primary btn-xs" href="' + widgetry.build_token_link(_generate_jump_url(model_id, 'graph'), user_token) +'" role="button">Graph</a>');
	        	bstrs.push('<a class="btn btn-primary btn-xs" href="/download/'+model_id+'/gaf" role="button" target="_blank">GAF</a>');
			bstrs.push('<a class="btn btn-primary btn-xs" href="/download/'+model_id+'/owl" role="button" target="_blank">OWL</a>');

			monarch_tr_cache.push(bstrs.join(' '));
		    }

		    // Add row to cache.
		    var geneont_tr_str = '<td>' + geneont_tr_cache.join('</td><td>') + '</td>';
		    var monarch_tr_str = '<td>' + monarch_tr_cache.join('</td><td>') + '</td>';
		    geneont_table_cache.push(geneont_tr_str);
		    monarch_table_cache.push(monarch_tr_str);
		});

		// Final tables string selection.
		var table_str = '<tr>';
		if( global_noctua_context !== 'monarch' ){
		    table_str += geneont_table_cache.join('</tr><tr>');
		}else{
		    table_str += monarch_table_cache.join('</tr><tr>');
		}
		table_str += '</tr>';
		
		// Make the tables real nice. Sort by date.
		jQuery('#mmm-selection-data').empty();
		jQuery('#mmm-selection-data').append(table_str);
		jQuery('#mmm-selection').DataTable(
		    {autoWidth: true, "order": [[3, "desc"], [0, "asc"]]}
		);
	    }
	}
	
	// Creation for form. Since default is in the callback is
	// "graph", goose it over to kick me to form instead.
	jQuery(model_create_monarch_button_elt).click(function(evt) {
	    to_editor = "monarch";
	    manager.add_model();
	});
	jQuery(model_create_hpo_button_elt).click(function(evt) {
	    to_editor = "hpo";
	    manager.add_model();
	});
	
	///
	/// Make the process/taxon seeding interactive.
	///
	
	var protax_proc_auto_val = null;
	var protax_tax_auto_val = null;
	
	// go process
	var protax_proc_auto_args = {
    	    'label_template':
	    '{{annotation_class_label}} ({{annotation_class}})',
    	    'value_template': '{{annotation_class_label}}',
	    'additional_results_class': 'bbop-mme-more-results-ul',
    	    'list_select_callback':
    	    function(doc){
    		//alert('adding: ' + doc['annotation_class_label']);
		protax_proc_auto_val = doc['annotation_class'] || null;
    	    }
	};
	var protax_proc_auto =
	    	new bbop_legacy.widget.search_box(
		    gserv, gconf, model_create_by_protax_input_proc_id,
		    protax_proc_auto_args);
	protax_proc_auto.lite(true);
	protax_proc_auto.add_query_filter('document_category',
					  'ontology_class');
	protax_proc_auto.add_query_filter('regulates_closure_label',
    					  'biological_process');
	protax_proc_auto.set_personality('ontology');
	
	// taxon
	var protax_tax_auto_args = {
    	    'label_template':
	    '{{annotation_class_label}} ({{annotation_class}})',
    	    'value_template': '{{annotation_class_label}}',
	    'additional_results_class': 'bbop-mme-more-results-ul',
    	    'list_select_callback':
    	    function(doc){
    		//alert('adding: ' + doc['annotation_class_label']);
		protax_tax_auto_val = doc['annotation_class'] || null;
    	    }
	};
	var protax_tax_auto =
	    	new bbop_legacy.widget.search_box(
		    gserv, gconf, model_create_by_protax_input_tax_id,
		    protax_tax_auto_args);
	protax_tax_auto.lite(true);
	protax_tax_auto.add_query_filter('document_category',
					 'ontology_class');
	protax_tax_auto.add_query_filter('source',
    					 'ncbi_taxonomy');
	protax_tax_auto.set_personality('ontology');
	
	// Get create-by-process/taxon ready to go.
	jQuery(model_create_by_protax_button_elt).click(function(evt){
	    
	    if( protax_proc_auto_val && protax_tax_auto_val ){
		// alert('You have: ' + protax_proc_auto_val +
		// 	  ' and ' + protax_tax_auto_val);
		manager.seed_from_process(protax_proc_auto_val,
		    			  protax_tax_auto_val);
	    }else{
		alert('ERROR: Need both process ID (GO:XXXXXXX) and ' +
		      'taxon ID (NCBITaxon:XXXXXXX) to proceed.');
	    }
	});	
    });

    // Likely result of a new model being built on Minerva.
    manager.register('rebuild', function(resp, man){
	console.log('rebuild: UI kick: ' + to_editor);
	_generated_model(resp, man);
    }, 10);

    ///
    /// Activate UI buttons.
    ///

    // NOTE: Activate from taxon is done in the meta return handler
    // because we want to model the (not yet) return of current
    // species from Minerva.

    // Active learn-more button.
    var learn_more_trigger_elt = '#learn_more_trigger';
    var learn_more_trigger_target_elt = '#about_trigger > a';
    jQuery(learn_more_trigger_elt).click(function(evt){
	evt.stopPropagation();
	evt.preventDefault();
	jQuery('.navbar-nav li.active').removeClass('active');
	jQuery('.tab-content div.active').removeClass('active');
	jQuery(learn_more_trigger_target_elt).tab('show');
    });

    jQuery('.overview_trigger').click(function(evt){
	evt.stopPropagation();
	evt.preventDefault();
	jQuery('.navbar-nav li.active').removeClass('active');
	jQuery('.tab-content div.active').removeClass('active');
	jQuery(this).tab('show');
    });

    var tabId = location.hash; // will look something like "#h-02"
    if (tabId === '#about') {
	// This will fired only when url get hash.
	jQuery(learn_more_trigger_elt).tab('show');
    }
    var path = window.location.pathname + window.location.search;
    history.replaceState({}, document.title, path);

    // Active create-from-nothing.
    jQuery(model_create_by_nothing_elt).click(function(evt){
	evt.stopPropagation();
	evt.preventDefault();
	manager.add_model();
    });

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

    manager.get_meta();
};

// Start the day the jsPlumb way.
jQuery(document).ready(function(){
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
	    MinervaBootstrapping(start_token);

	    // When all is said and done, let's also fillout the user
	    // name just for niceness. This is also a test of CORS in
	    // express.
	    if( start_token ){
		widgetry.user_check(global_barista_location,
				    start_token, 'user_name_info');
	    }
	}
});
