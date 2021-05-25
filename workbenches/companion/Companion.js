////
//// A little fun driving a view with cytoscape.
////

// Let jshint pass over over our external globals (browserify takes
// care of it all).
/* global jQuery */
/* global global_id */
/* global global_golr_server */
/* global global_golr_neo_server */
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
var barista_response = require('bbop-response-barista');

// Help with strings and colors--configured separately.
var aid = new bbop_legacy.context(amigo.data.context);

var model = require('bbop-graph-noctua');
var widgetry = require('noctua-widgetry');

// Code here will be ignored by JSHint, as we are technically
// "redefining" jQuery (although we are not).
/* jshint ignore:start */
var jQuery = require('jquery');
/* jshint ignore:end */

// Items
var barista_response = require('bbop-response-barista');
var class_expression = require('class-expression');
var minerva_requests = require('minerva-requests');
//var noctua_model = require('bbop-graph-noctua');
var jquery_engine = require('bbop-rest-manager').jquery;
var minerva_manager = require('bbop-manager-minerva');

// Items for running the old AmiGO stuff.
var gconf = new bbop_legacy.golr.conf(amigo.data.golr);
var gserv = global_golr_server;
var defs = new amigo.data.definitions();
var handler = new amigo.handler();
var linker = new amigo.linker();
linker.app_base = 'http://amigo.geneontology.org';
//var dlimit = defs.download_limit();
var dlimit = 1000;

// Aliases
var each = us.each;
var noctua_graph = model.graph;
var noctua_node = model.node;
var noctua_annotation = model.annotation;
var edge = model.edge;
var each = us.each;
var is_defined = bbop.is_defined;
var what_is = bbop.what_is;
var uuid = bbop.uuid;

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

///
var CompanionInit = function(user_token){

    var logger = new bbop.logger('noctua w/comp');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    ll('startup');

    // Events registry.
    // Add manager and default callbacks to repl.
    var engine = new jquery_engine(barista_response);
    var mmanager = new minerva_manager(global_barista_location,
				       global_minerva_definition_name,
				       user_token, engine, 'async');

    // GOlr location and conf setup.
    var gconf = new bbop_legacy.golr.conf(amigo.data.golr);

    ///
    /// Minerva/Noctua comms.
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

    // Internal registrations.
    mmanager.register('prerun', _shields_up);
    mmanager.register('postrun', _shields_down, 9);
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
	ll('a meta callback?');
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
    }, 10);
    mmanager.register('rebuild', function(resp, man){
	ll('rebuild callback');
	var wrn = new widgetry.contained_modal(
	    null, '<strong>Operation a success</strong>', success_txt.join(''));
	wrn.show();
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
    widget_manager.add_query_filter('aspect', 'F'); // removable

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
    // The alrorithm is derived from a diagram here:
    // https://github.com/geneontology/noctua/issues/170#issuecomment-134414048
    var port_to_noctua_button = {
	label: 'Import',
	diabled_p: false,
	click_function_generator: function(results_table, widget_manager){ //

	    return function(event){

   		var selected_ids = results_table.get_selected_items();
   		var resp = results_table.last_response();

		if( ! resp || ! selected_ids || ! resp.success() ||
		  us.isEmpty(selected_ids) ){
		    alert('No action can be taken currently.');
		}else{
		    //alert('Actionable input.');

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
			// Who "did" it? Mark it for later request set
			// grouping.
			var assby = doc['assigned_by'];

			// Using aspect, place the information under a
			// paricular aspect grouping.
			var aspect = doc['aspect'];

			// Attempt at save ECO mapping.
			var ev = doc['evidence_type'];
			if( eco_lookup[ev] ){
			    // Apparently on our lookup.
			    ev = eco_lookup[ev];
			}else{
			    // @cmungall's preferred default
			    ev = 'ECO:0000305';
			}
			// Fix refs if necessary.
			var refs = doc['reference'];
			if( ! refs ){ // null to list
			    refs = [];
			}
			if( ! us.isArray(refs) ){ // string to list
			    refs = [refs];
			}
			// Fix withs if necessary.
			var withs = doc['evidence_with'];
			if( ! withs ){ // null to list
			    withs = [];
			}
			if( ! us.isArray(withs) ){ // string to list
			    withs = [withs];
			}

			// Okay, try and compact this down as much as
			// possible. First, select which aspect
			// grouping it's in, then ensure structure.
			if( ! acls_set[assby] ){
			    acls_set[assby] = {};
			}
			if( ! acls_set[assby][acls] ){
			    acls_set[assby][acls] = {};
			}
			if( ! acls_set[assby][acls][bio] ){
			    acls_set[assby][acls][bio] = [];
			}
			acls_set[assby][acls][bio].push({
			    ev: ev,
			    refs: refs,
			    withs: withs
			});
		    });

		    // WARNING: Warn if we are going to be batching a lot.
		    if( us.keys(acls_set).length > 3 ){
			alert('You have a lot of requests from different ' +
			      'sources; this many may not batch well; please ' +
			      'check that everything made it over.');
		    }

		    // A slightly harder algorithm here. Everything
		    // starts from F, no matter what, and we need to
		    // group them by assigned_by to give the group for
		    // providedBy.
		    us.each(acls_set, function(acls_assby_subset, assby){

			// Now let's actually assemble the /generic/ requests
			// for the run.
			var reqs = new minerva_requests.request_set(
			    global_barista_token, global_id);
			reqs.use_groups([
			    // WARNING: We're minting money that we
			    // might not honor here.
			    'http://purl.obolibrary.org/go/groups/' + assby
			]);

			us.each(acls_assby_subset, function(bio_set, acls){

			    var sub = reqs.add_individual(acls);

			    us.each(bio_set, function(ev_list, bio){

				var obj = reqs.add_individual(bio);
				var edge = reqs.add_fact(
				    [sub, obj, 'RO:0002333']);

				us.each(ev_list, function(ev_set){

				    // Recover.
				    var ev = ev_set['ev'];
				    var refs = ev_set['refs'];
				    var withs = ev_set['withs'];
				    var assby = ev_set['assigned_by'];

				    // Tag on the final evidence.
				    reqs.add_evidence(
					ev, refs, withs,
					[sub, obj, 'RO:0002333']);
				});
			    });

			    // ???
			});

			// Fire and forget.
			mmanager.request_with(reqs);
		    });

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
	filters.spin_up();
    });
    widget_manager.register('postrun', 'foo', function(){
	filters.spin_down();
    });

    // If we're all done, trigger initial hit.
    widget_manager.search();
};

// Start the day the jQuery way.
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
	// Only roll if the env is correct.  Will use the above
	// variables internally (sorry).
	CompanionInit(start_token);

	// When all is said and done, let's also fillout the user name
	// just for niceness. This is also a test of CORS in express.
	if( start_token ){
	    widgetry.user_check(global_barista_location,
				start_token, 'user_name_info', false);
	}
    }
});
