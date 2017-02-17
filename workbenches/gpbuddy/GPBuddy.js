////
//// A little fun driving a view with cytoscape.
////

// Let jshint pass over over our external globals (browserify takes
// care of it all).
/* global jQuery */
/* global global_model_id */
/* global global_individual_id */
/* global global_golr_server */
/* global global_golr_neo_server */
/* global global_barista_location */
/* global global_collapsible_relations */
/* global global_minerva_definition_name */
/* global global_barista_token */
/* global Vue */
/* global VueSpinner */

var us = require('underscore');
var bbop = require('bbop-core');
var bbop_legacy = require('bbop').bbop;

var amigo = require('amigo2');
var barista_response = require('bbop-response-barista');
var model = require('bbop-graph-noctua');
var widgetry = require('noctua-widgetry');
var class_expression = require('class-expression');
var minerva_requests = require('minerva-requests');
var jquery_engine = require('bbop-rest-manager').jquery;
var minerva_manager = require('bbop-manager-minerva');

// Code here will be ignored by JSHint, as we are technically
// "redefining" jQuery (although we are not).
/* jshint ignore:start */
var jQuery = require('jquery');
/* jshint ignore:end */

// Help with strings and colors--configured separately.
var aid = new bbop_legacy.context(amigo.data.context);

// Items for running the old AmiGO stuff.
var gconf = new bbop_legacy.golr.conf(amigo.data.golr);
var gserv = global_golr_server;
var handler = new amigo.handler();
var linker = new amigo.linker();

// Aliases
var each = us.each;
var noctua_graph = model.graph;
var noctua_node = model.node;
var noctua_annotation = model.annotation;
var edge = model.edge;
var is_defined = bbop.is_defined;
var what_is = bbop.what_is;
var uuid = bbop.uuid;

// Noticable logger.
var logger = new bbop.logger('noctua w/gbbuddy');
logger.DEBUG = true;
function ll(str){ logger.kvetch(str); }

// Placeholder for JS spinner once we start.
var spinner_vapp = null;
function _spinner_up(){
    spinner_vapp.loading = true;
}

function _spinner_down(){
    spinner_vapp.loading = false;
}		  

///
/// Ugly decode table necessary because of "hack" load we currently do
/// to support the three letter codes. Ask @cmungall about this.
///

// Lifted from:
// https://raw.githubusercontent.com/evidenceontology/evidenceontology/master/gaf-eco-mapping.txt,
// using all of the suggested defaults only.
var eco_lookup = {
    EXP: 'ECO:0000269',
    IBA: 'ECO:0000318',
    IBD: 'ECO:0000319',
    IC: 'ECO:0000305',
    IDA: 'ECO:0000314',
    IEA: 'ECO:0000501',
    IEP: 'ECO:0000270',
    IGC: 'ECO:0000317',
    IGI: 'ECO:0000316',
    IKR: 'ECO:0000320',
    IMP: 'ECO:0000315',
    IMR: 'ECO:0000320',
    IPI: 'ECO:0000353',
    IRD: 'ECO:0000321',
    ISA: 'ECO:0000247',
    ISM: 'ECO:0000255',
    ISO: 'ECO:0000266',
    ISS: 'ECO:0000250',
    NAS: 'ECO:0000303',
    ND: 'ECO:0000307',
    RCA: 'ECO:0000245',
    TAS: 'ECO:0000304'
};

///
///
///

// StageOne gets the current model and tries to extract any bioentity
// information from the given node id. After successful completion, it
// passes control to StageTwo.
var StageOne = function(user_token, model_id, indiv_id){

    ll('stage one start');

    // Get a manager up. We'll use promises here--a little easier when
    // not dealing with a ton of UI overhead and we're sure of the
    // answer.
    var engine = new jquery_engine(barista_response);
    var mmanager = new minerva_manager(global_barista_location,
				       global_minerva_definition_name,
				       user_token, engine, 'async');

    // Get the model and follow up.
    _spinner_up();
    mmanager.get_model(model_id).then(function(resp){

	// On response, load model and fold.
	var graph = new noctua_graph();
	var model_data = resp.data();
	graph.load_data_basic(model_data);
	graph.fold_go_noctua(global_collapsible_relations);

	// Get the individual we're all about.
	var bioentity_ids = [];
	var cc_indiv_ids = [];
	    
	// Get the individual.
	var ind = graph.get_node(indiv_id);
	if( ind ){

	    // Okay, probe self and any first-level subgraphs for
	    // GPs that we can use to narrow our search.
	    var all_types = ind.types() || []; // start with these
	    var sub = ind.subgraph();
	    if( sub ){
		
		// Get enabled_by nodes. Scan the types to see if
		// there is anything easily available and
		// interesting.
 		var enb_pnodes = sub.get_parent_nodes(indiv_id, 'RO:0002333');
		each(enb_pnodes, function(e){
		    
		    var ts = e.types();			
		    each(ts, function(t){
			bioentity_ids.push(t.class_id());
		    });
		});

		// Get occurs_in nodes. We'll be removing these later.
 		var occ_pnodes = sub.get_parent_nodes(indiv_id, 'BFO:0000066');
		each(occ_pnodes, function(e){
		    cc_indiv_ids.push(e.id());
		    // var ts = e.types();	
		    // each(ts, function(t){
		    // 	cc_indiv_ids.push(t.id());
		    // });
		});
	    }
	}
	
	// We got what we could--start up.
	if( ! bioentity_ids || bioentity_ids.length === 0 ){
	    alert('No workable bioentities in calling annoton. Closing.');
	    window.close();
	}else{
	    StageTwo(user_token, bioentity_ids, cc_indiv_ids,
		     model_id, indiv_id);
	}
	
	_spinner_down();
    }).done();

};

// TODO: Build the user interface with the information extracted from
// BioCompanionBootstrap.
var StageTwo = function(user_token, bioentity_ids, cc_indiv_ids,
			model_id, indiv_id){

    ll('stage two start');
    ll('bioentities: ' + bioentity_ids.join(', '));
    ll('extant ccs: ' + cc_indiv_ids.join(', '));

    // Events registry.
    // Add manager and default callbacks to repl.
    var engine = new jquery_engine(barista_response);
    var mmanager = new minerva_manager(global_barista_location,
				       global_minerva_definition_name,
				       user_token, engine, 'async');
    
    ///
    /// Minerva/Noctua comms.
    ///

    // Internal registrations.
    mmanager.register('prerun', _spinner_up);
    mmanager.register('postrun', _spinner_down, 9);
    mmanager.register('manager_error', function(resp, man){
	alert('There was a manager error (' +
	      resp.message_type() + '): ' + resp.message());
    }, 10);

    // Likely the result of unhappiness on Minerva.
    mmanager.register('warning', function(resp, man){
	alert('Warning: ' + resp.message() + '; ' +
	      'your operation was likely not performed');
    }, 10);

    // Likely the result of serious unhappiness on Minerva.
    mmanager.register('error', function(resp, man){

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

    // ???
    mmanager.register('meta', function(resp, man){
	ll('huh...a meta callback?');
    });

    // Likely results of a new model being built on Minerva.
    var success_txt = [
	'<p>',
	'Your operation was likely a success.',
	'<br />',
	'You may clear you selected items and continue.',
	'</p>'
    ];
    mmanager.register('merge', function(resp, man){
	ll('merge callback');
	var wrn = new widgetry.contained_modal(
	    null, '<strong>Operation a success</strong>', success_txt.join(''));
	wrn.show();
	window.close();
    }, 10);
    mmanager.register('rebuild', function(resp, man){
	ll('rebuild callback');
	var wrn = new widgetry.contained_modal(
	    null, '<strong>Operation a success</strong>', success_txt.join(''));
	wrn.show();
	window.close();
    }, 10);

    //mmanager.get_model(global_id);

    ///
    /// AmiGO comms.
    ///
    
    // Ready the primary widget manager.
    var widget_manager = new bbop_legacy.golr.manager.jquery(gserv, gconf);
    var confc = gconf.get_class('annotation');
    widget_manager.set_personality('annotation');
    widget_manager.add_query_filter('document_category',
				    confc.document_category(), ['*']);    
    widget_manager.add_query_filter('aspect', 'C'); // removable
    each(bioentity_ids, function(bid){
	widget_manager.add_query_filter('bioentity', bid); // removable
    });

    // Attach filters to manager.
    var hargs = {
	meta_label: 'Total documents:&nbsp;',
	// free_text_placeholder:
	// 'Input text to filter against all remaining documents',
	// 'display_free_text_p': false
    };
    var filters = new bbop_legacy.widget.live_filters(
	'input-filter-accordion', widget_manager, gconf, hargs);
    filters.establish_display();
    
    // Attach pager to manager.
    var pager_opts = {
    };
    var pager = new bbop_legacy.widget.live_pager('pager', widget_manager,
						  pager_opts);
    
    // Describe the button that will attempt to compact the selected 
    // annotations and send macro commands to noctua/minerva.
    // See: 
    var port_to_noctua_button = {
	label: 'Import',
	diabled_p: false,
	click_function_generator: function(results_table, widget_manager){ // 
	    
	    return function(event){
		
   		var selected_ids = results_table.get_selected_items();
   		var resp = results_table.last_response();

		if( ! selected_ids || us.isEmpty(selected_ids) ){
		    alert('No action can be taken if nothing is selected.');
		}else if( ! resp || ! resp.success() ){
		    alert('No action can--last request to server was empty.');
		}else if( selected_ids.length !== 1 ){
		    alert('Please select just one item for now.');
		}else{
		    //console.log('Actionable input.');
		    
		    // Extract the documents that we'll operate on.
		    var docs_to_run = [];
		    each(selected_ids, function(sid){
			var doc = resp.get_doc(sid);
			if( doc ){
			    docs_to_run.push(doc);
			}
		    });
		    
		    // Assemble a batch to run.
		    var acls_set = {};
		    each(docs_to_run, function(doc){
			
			// Who are we talking about?
			var acls = doc['annotation_class'];
			var bio = doc['bioentity'];

			// Attempt at safe ECO mapping.
			var ev = doc['evidence_type'];
			if( eco_lookup[ev] ){
			    // Apparently on our lookup.
			    ev = eco_lookup[ev];
			}else{
			    // @cmungall's preferred default
			    ev = 'ECO:0000305';
			}
			// Fix refs if necessary (must be list).
			var refs = doc['reference'];
			if( ! refs ){ // null to list
			    refs = [];
			}
			if( ! us.isArray(refs) ){ // string to list
			    refs = [refs];
			}
			// Fix withs if necessary (must be list).
			var withs = doc['evidence_with'];
			if( ! withs ){ // null to list
			    withs = [];
			}
			if( ! us.isArray(withs) ){ // string to list
			    withs = [withs];
			}

			// Okay, group by class, entity, ev.
			if( ! acls_set[acls] ){
			    acls_set[acls] = {};
			}
			if( ! acls_set[acls][bio] ){
			    acls_set[acls][bio] = [];
			}
			// Add on the evidence.
			//console.log(ev, refs, withs);
			//alert('breakpoint');
			acls_set[acls][bio].push({
			    ev: ev,
			    refs: refs,
			    withs: withs
			});
		    });
			
		    // Now let's actually assemble the requests for
		    // the run.
		    var reqs = new minerva_requests.request_set(
			global_barista_token, global_model_id);

		    // If there is already an "occurs_in" go
		    // ahead and take it out.
		    each(cc_indiv_ids, function(cc_indiv_id){
			var sub = indiv_id;
			var obj = cc_indiv_id;
			reqs.remove_fact([sub, obj, 'BFO:0000066']);
		    });
		    
		    // 
		    each(acls_set, function(bio_set, acls){
			
			var obj = reqs.add_individual(acls);

			each(bio_set, function(ev_list, bio){

			    var sub = indiv_id;
			    var edge = reqs.add_fact([sub, obj, 'BFO:0000066']);
			    
			    each(ev_list, function(ev_set){
				
				// Recover.
				var ev = ev_set['ev'];
				var refs = ev_set['refs'];
				var withs = ev_set['withs'];
				
				// Tag on the final evidence.
				reqs.add_evidence(ev, refs, withs,
						  [sub, obj, 'BFO:0000066']);
			    });
			});

			// ???
			
		    });
		    
		    // Final request action - fire and forget.
		    mmanager.request_with(reqs);
		}
	    };
	}
    };

    var results_opts = {
	//'callback_priority': -200,
	'user_buttons_div_id': pager.button_span_id(),
	'user_buttons': [
	    port_to_noctua_button//,
	    //model_into_noctua_button
	]
    };
    var results = new bbop_legacy.widget.live_results('results', widget_manager,
						      confc, handler, linker,
						      results_opts);
    
    // Add pre and post run spinner (borrow filter's for now).
    widget_manager.register('prerun', 'foo', function(){
	spinner_vapp.loading = true;
	//filters.spin_up();
    });
    widget_manager.register('postrun', 'foo', function(){
	spinner_vapp.loading = false;
	//filters.spin_down();
    });

    // If we're all done, trigger initial hit.
    widget_manager.search();
};

// Bootstrap: Start the day the jQuery way.
jQuery(document).ready(function(){

    ll('bootstrap start');
    
    // Try to define token and basic input IDs.
    if( ! global_barista_token || ! global_model_id || ! global_individual_id ){
	alert('basic environment not ready');	
    }else if( typeof(global_minerva_definition_name) === 'undefined' ||
	      typeof(global_barista_location) === 'undefined' ){
	// Next we need a manager to try and pull in the model.
	alert('remote environment not ready');
    }else{

	// Create a global spinner we can use.
	var PulseLoader = VueSpinner.PulseLoader;
	spinner_vapp = new Vue({
	    el: '#spinner-vapp',
	    components: {
		'PulseLoader': PulseLoader
	    },
	    data: function(){
		return {
		    loading: false,
		    color: '#3AB982',
		    size: '15px'
		};
	    }
	});
	
	// Only roll to if the env is correct: get the GPs from the
	// annoton.
	StageOne(global_barista_token, global_model_id, global_individual_id);

	// When all is said and done, let's also fillout the user name
	// just for niceness. This is also a test of CORS in express.
	if( global_barista_token ){
	    widgetry.user_check(global_barista_location,
				global_barista_token, 'user_name_info', false);
	}
    }
    
});
