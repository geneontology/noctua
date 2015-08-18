////
//// ...
////

// Let jshint pass over over our external globals (browserify takes
// care of it all).
/* global jQuery */
/* global global_barista_location */
/* global global_minerva_definition_name */
/* global jsPlumb */
/* global global_barista_token */

var us = require('underscore');
var bbop = require('bbop-core');
//var bbop = require('bbop').bbop;
//var bbopx = require('bbopx');
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

var barista_response = require('bbop-response-barista');
var class_expression = require('class-expression');
var minerva_requests = require('minerva-requests');
var noctua_model = require('bbop-graph-noctua');

//
var jquery_engine = require('bbop-rest-manager').jquery;
var minerva_manager = require('bbop-manager-minerva');

// Harumph.
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

    // Events registry.
    // Add manager and default callbacks to repl.
    var engine = new jquery_engine(barista_response);
    var manager = new minerva_manager(global_barista_location,
				      global_minerva_definition_name,
				      user_token, engine, 'async');

    // GOlr location and conf setup.
    var gserv = 'http://golr.berkeleybop.org/';
    var gconf = new bbop_legacy.golr.conf(amigo.data.golr);

    // Contact points for Chris's wizard.
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
    var model_export_by_id_def_button_id = 'button_id_for_def_export';
    var model_export_by_id_def_button_elt = '#'+model_export_by_id_def_button_id;
    var model_export_by_id_gaf_button_id = 'button_id_for_gaf_export';
    var model_export_by_id_gaf_button_elt = '#'+model_export_by_id_gaf_button_id;
    var model_export_by_id_gpd_button_id = 'button_id_for_gpd_export';
    var model_export_by_id_gpd_button_elt = '#'+model_export_by_id_gpd_button_id;
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
    // var wizard_jump_term = null;
    // var wizard_jump_db = null;
    var to_basic_form = false;
    function _generated_model(resp, man) {
      var id = resp.data()['id'];
      var new_url = "";
      if (to_basic_form) {
        new_url = '/basic/' + id;
      } else {
        new_url = '/seed/model/' + id;
      }
      _jump_to_page(new_url);
    }

    // Internal registrations.
    manager.register('prerun', _shields_up);
    manager.register('postrun', _shields_down, 9);
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

	if( resp.export_model() ){

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

	}else{

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

	    //console.log('meta', model_to_value_hash_list);

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

	    var model_meta_ids = us.keys(models_meta) || [];
	    //console.log(model_meta_ids);
	    var sorted_model_meta_ids = model_meta_ids.sort(function(a, b){
		var gt_p = _get_model_title(a) < _get_model_title(b);
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

	    // Insert model IDs into "Select by ID" interface.
	    jQuery(select_stored_jump_elt).empty(); // Clear interfaces.
	    var rep_cache = [];
	    each(sorted_model_meta_ids, function(model_id){

		var model_meta = models_meta[model_id];

		var mtitle =  _get_model_title(model_id);

		// Check to see if it's deprecated and highlight that
		// fact.
		if( _model_deprecated_p(model_id) ){
		    mtitle = '[DEPRECATED] ' + mtitle;
		}

		// Check to see if it's modified and highlight that
		// fact.
		if( _model_modified_p(model_id) ){
		    mtitle = mtitle + '*';
		}

		// Add to cache.
		rep_cache.push('<option value="'+ model_id +'">');
		rep_cache.push(mtitle);
		rep_cache.push('</option>');
	    });
	    var rep_str = rep_cache.join('');
	    jQuery(select_stored_jump_elt).append(rep_str);

	    jQuery("#select_stored_jump_basic").empty();
	    jQuery("#select_stored_jump_basic").append(rep_str);

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

	    // Make jump interface jump on click.
	    jQuery("#select_stored_jump_button_basic").click(function(evt) {
	      var id = jQuery("#select_stored_jump_basic").val();
	      //alert('val: '+ id);
	      var new_url = '/basic/' + id;
	      _jump_to_page(new_url);
	    });

	    jQuery("#new_jump_button_basic").click(function(evt) {
		to_basic_form = true;
		manager.add_model();
	    });
	    
	    // Make export interface trigger on click.
	    jQuery(model_export_by_id_def_button_elt).click(function(evt){
		var id = jQuery(model_export_by_id_input_elt).val();
		manager.export_model(id);
	    });
	    jQuery(model_export_by_id_gaf_button_elt).click(function(evt){
		var id = jQuery(model_export_by_id_input_elt).val();
		manager.export_model(id, 'gaf');
	    });
	    jQuery(model_export_by_id_gpd_button_elt).click(function(evt){
		var id = jQuery(model_export_by_id_input_elt).val();
		manager.export_model(id, 'gpad');
	    });

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
		manager.add_model(id, null);
	    });
	}
    });

    // Likely result of a new model being built on Minerva.
    manager.register('rebuild', function(resp, man){
	_generated_model(resp, man);
    }, 10);

    ///
    /// Activate autocomplete in input boxes.
    /// Add the local responders.
    ///

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
	    widgetry.user_check(global_barista_location,
				start_token, 'user_name_info');
	}
    }
});
