////
//// A little fun driving a view with cytoscape.
////

// Let jshint pass over over our external globals (browserify takes
// care of it all).
/* global jQuery */
/* global global_id */
/* global global_golr_server */
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
var sd = new amigo.data.server();
var defs = new amigo.data.definitions();
var handler = new amigo.handler();
var linker = new amigo.linker();
var solr_server = global_golr_server;
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
    var manager = new minerva_manager(global_barista_location,
				      global_minerva_definition_name,
				      user_token, engine, 'async');

    // GOlr location and conf setup.
    var gserv = global_golr_server;
    var gconf = new bbop_legacy.golr.conf(amigo.data.golr);

    // Contact points...
    // ...

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

    // ???
    manager.register('meta', function(resp, man){
	ll('a meta callback?');
    });

    // Likely result of a new model being built on Minerva.
    manager.register('rebuild', function(resp, man){
	ll('rebuild callback');
	alert('Model rebuilt.');
    }, 10);

    //manager.get_model(global_id);

    ///
    /// AmiGO comms.
    ///
    
    // Ready the manager.
    var search = new bbop_legacy.golr.manager.jquery(solr_server, gconf);
    var confc = gconf.get_class('annotation');
    search.set_personality('annotation');
    search.add_query_filter('document_category',
			    confc.document_category(), ['*']);

    // Attach filters to manager.
    var hargs = {
	meta_label: 'Total pool:&nbsp;',
	// free_text_placeholder:
	// 'Input text to filter against all remaining documents',
	'display_free_text_p': false
    };
    var filters = new bbop_legacy.widget.live_filters(
	'input-filter-accordion', search, gconf, hargs);
    filters.establish_display();
    
    // Attach pager to manager.
    var pager_opts = {
    };
    var pager = new bbop_legacy.widget.live_pager('pager', search, pager_opts);
    
    // // Attach the results pane and download buttons to manager.
    // var btmpl = bbop_legacy.widget.display.button_templates;
    // var default_fields = confc.field_order_by_weight('result');
    // var flex_download_button =
    // 	    btmpl.flexible_download_b3('<span class="glyphicon glyphicon-download"></span> Download',// (up to '+dlimit+')',
    // 				       dlimit,
    // 				       default_fields,
    // 				       'annotation',
    // 				       gconf);
    var results_opts = {
	//'callback_priority': -200,
	'user_buttons_div_id': pager.button_span_id(),
	'user_buttons': [
	    //	    flex_download_button
	]
    };
    var results = new bbop_legacy.widget.live_results('results', search, confc,
						      handler, linker,
						      results_opts);
    
    // // Test of the entry override.
    // bbop.widget.display.results_table_by_class_conf_b3.prototype.process_entry = function(){
    //     return 'foo';
    // };
    
    // Add pre and post run spinner (borrow filter's for now).
    search.register('prerun', 'foo', function(){
	filters.spin_up();
    });
    search.register('postrun', 'foo', function(){
	filters.spin_down();
    });

    // If we're all done, trigger initial hit.
    search.search();
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
	// Only roll if the env is correct.
	// Will use the above variables internally (sorry).
	CompanionInit(start_token);

	// When all is said and done, let's also fillout the user
	// name just for niceness. This is also a test of CORS in
	// express.
	if( start_token ){
	    widgetry.user_check(global_barista_location,
				start_token, 'user_name_info');
	}
    }
});
