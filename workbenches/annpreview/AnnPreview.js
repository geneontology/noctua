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
/* global global_collapsible_relations */

var us = require('underscore');
var bbop = require('bbop-core');
//var bbop = require('bbop').bbop;
//var bbopx = require('bbopx');
var amigo = require('amigo2');
var bbop_legacy = require('bbop').bbop;

// Help with strings and colors--configured separately.
var aid = new bbop_legacy.context(amigo.data.context);

var model = require('bbop-graph-noctua');

var widgetry = require('noctua-widgetry');

// Aliases
var each = us.each;
var noctua_graph = model.graph;
var noctua_node = model.node;
var noctua_annotation = model.annotation;
var edge = model.edge;
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

//
var jquery_engine = require('bbop-rest-manager').jquery;
var minerva_manager = require('bbop-manager-minerva');

// Barista (telekinesis, etc.) communication.
var barista_client = require('bbop-client-barista');
var barclient = null;

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
	console.log('shield up');
	compute_shield_modal = widgetry.compute_shield();
	compute_shield_modal.show();
    }
}
// Release interface when transaction done.
function _shields_down(){
    if( compute_shield_modal ){
	console.log('shield down');
	compute_shield_modal.destroy();
	compute_shield_modal = null;
    }else{
	// None to begin with.
    }
}

///
/// ...
///

///
var AnnPreviewInit = function(user_token){

    // var logger = new bbop.logger('noctua cvi');
    // logger.DEBUG = true;
    // function ll(str){ logger.kvetch(str); }

    // First, try and setup the barista listener.
    console.log('try setup for messaging at: ' + global_barista_location);
    barclient = new barista_client(global_barista_location, user_token);
    barclient.register('merge', function(a,b){
	console.log('barista/merge response');
	AnnPreviewInit(user_token);
    });
    barclient.register('rebuild', function(a,b){
	console.log('barista/rebuild response');
	AnnPreviewInit(user_token);	
    });
    barclient.connect(global_id);

    // Events registry.
    // Add manager and default callbacks to repl.
    var engine = new jquery_engine(barista_response);
    var model_manager = new minerva_manager(global_barista_location,
					    global_minerva_definition_name,
					    user_token, engine, 'async');
    var gpad_manager = new minerva_manager(global_barista_location,
					   global_minerva_definition_name,
					   user_token, engine, 'async');

    // GOlr location and conf setup.
    var gserv = global_golr_server;
    var gconf = new bbop_legacy.golr.conf(amigo.data.golr);

    ///
    /// Data.
    ///

    var cache = {};

    ///
    /// Management.
    ///

    // Internal general registrations for both managers.
    //us.each([model_manager, gpad_manager], function(manager){
    us.each([model_manager], function(manager){
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
	    }else if( resp.message() &&
		      resp.message().indexOf(token_flag) !== -1 ){
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
	    console.log('a meta callback?');
	});
    });
	
    // Likely result of a new model being built on Minerva.
    model_manager.register('rebuild', function(resp, man){
	console.log('rebuild callback for model');

	// Noctua graph.
	graph = new noctua_graph();
	graph.load_data_basic(resp.data());
	
	// Max node exposure.
	graph.unfold();
	
	// Populate the cache with the opened contents of the graph.
	cache = {};
	us.each(graph.all_nodes(), function(n){
	    us.each(n.types(), function(t){
		cache[t.class_id()] = t.class_label();
	    });
	});
	
	// Secondarily, go and get the GPAD.
	gpad_manager.export_model(global_id, 'gpad');
	
    }, 10);
			   
    // Likely result of a new model being built on Minerva.
    gpad_manager.register('meta', function(resp, man){
	console.log('rebuild callback for gpad');

	//var exmodel = resp.raw().data['export-model'];
	//var pstr = resp.raw().data['export-model'];
	var pstr = resp.raw().data['export-model'];

	// Fuse first column and clean.
	var fused =
		us.map(
		    us.filter(
			us.map(pstr.split('\n').slice(1),
			       function(line){
				   return line.split('\t');
			       }),
			function(set){
			    return set.length === 12;
			}),
		    function(a){
			var ns = a[0];
			var id = a[1];
			var cdr = a.slice(2);
			cdr.unshift(ns+':'+id);
			return cdr;
		    });
	var mstr = us.map(fused,
			  function(f){
			      return f.join('\t');
			  }).join('\n');

	// Replace globally.
	us.each(cache, function(lbl, id){
	    var re = new RegExp(id, "gi");
	    mstr = mstr.replace(re, lbl);
	});

	// Break into final table.
	var fjson = us.map(mstr.split('\n'),
			   function(line){
			       return line.split('\t');
			   });

	// Create table.
	var tbl_str = '';
	us.each(fjson, function(line){
	    tbl_str += '<tr><td>';
	    tbl_str += line.join('</td><td>');
	    tbl_str += '</td></tr>';
	});
	
	// Add to DOM.
	jQuery('#tbl').empty();
        jQuery('#tbl').append(tbl_str);
	if( jQuery('#ann-tbl').DataTable ){
            jQuery('#ann-tbl').DataTable(
		//{autoWidth: true, "order": [[3, "desc"], [0, "asc"]]}
            );
	}

    }, 10);

    // Trigger whole system first time.
    model_manager.get_model(global_id);
};

// Start the day the jQuery way.
jQuery(document).ready(function(){
    console.log('jQuery ready');

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
	    AnnPreviewInit(start_token);

	    // When all is said and done, let's also fillout the user
	    // name just for niceness. This is also a test of CORS in
	    // express.
	    if( start_token ){
		widgetry.user_check(global_barista_location,
				    start_token, 'user_name_info', false);
	    }
	}
});
