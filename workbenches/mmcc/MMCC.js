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
/* global global_golr_neo_server */
/* global jsPlumb */
/* global global_barista_token */
/* global global_collapsible_relations */
/* global global_barista_token */

var jQuery = require('jquery');
var selectize = require('selectize');

var us = require('underscore');
var bbop = require('bbop-core');
//var bbop = require('bbop').bbop;
//var bbopx = require('bbopx');
//var bbop_legacy = require('bbop').bbop;
//var barista_response = require('bbop-response-barista');

var amigo = require('amigo2');
var golr_manager = require('bbop-manager-golr');
var golr_conf = require('golr-conf');
var golr_response = require('bbop-response-golr');

// // Help with strings and colors--configured separately.
// var aid = new bbop_legacy.context(amigo.data.context);

var model = require('bbop-graph-noctua');
var minerva_requests = require('minerva-requests');
var class_expression = require('class-expression');

var widgetry = require('noctua-widgetry');

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

var barista_response = require('bbop-response-barista');
var class_expression = require('class-expression');
var minerva_requests = require('minerva-requests');
var noctua_model = require('bbop-graph-noctua');

//
var jquery_engine = require('bbop-rest-manager').jquery;
var minerva_manager = require('bbop-manager-minerva');

///
/// ...
///

var createNEOBioAC = function(element_id){

    // GOlr manager.
    var engine = new jquery_engine(golr_response);
    engine.use_jsonp(true);
    var gconf = new golr_conf.conf(amigo.data.golr);
    var manager =
	    new golr_manager(global_golr_neo_server, gconf, engine, 'async');
    manager.set_personality('ontology');
    manager.add_query_filter('document_category', 'ontology_class', ['*']);
    manager.add_query_filter('regulates_closure', 'CHEBI:23367', ['*']);

    var items = {};

    var selectized = jQuery('#' + element_id).selectize({
	valueField: 'annotation_class',
	labelField: 'annotation_class_label',
	searchField: 'annotation_class_label',
	create: false,
	render: {
            option: function(item, escape) {
		return '<div>' +
		    escape(item['annotation_class_label']) + ' (' +
		    escape(item['annotation_class']) + ')' +
		    '</div>';
            }
	},

	load: function(query, callback) {
	    // At least a length of 3 to operate.
            if( ! query.length ){
	    	return callback();
	    }
	    
	    manager.set_comfy_query(query);
            manager.search().then(function(resp){
		callback(resp.documents() || []);
            }).done();
	},
	// onType: function(){
	//     selectized[0].selectize.clearCache("option");
	//     selectized[0].selectize.clearOptions();
	// },
	onItemAdd: function(value, $item){
	    items[value] = true;
	},
	onItemRemove: function(value){
	    delete items[value];
	},
	onInitialize: function(){
	    if( jQuery('#' + element_id).val() ){
		items[jQuery('#' + element_id).val()] = true;
	    }
	}
    });

    
    this.values = function(){
	return us.keys(items);
    };

    
};

var createComplexAC = function(element_id){

    // GOlr manager.
    var engine = new jquery_engine(golr_response);
    engine.use_jsonp(true);
    var gconf = new golr_conf.conf(amigo.data.golr);
    var manager =
	    new golr_manager(global_golr_server, gconf, engine, 'async');
    manager.set_personality('ontology');
    manager.add_query_filter('document_category', 'ontology_class', ['*']);
    // macromolecular complex
    //manager.add_query_filter('regulates_closure', 'GO:0032991', ['*']);
    // protein complex
    manager.add_query_filter('regulates_closure', 'GO:0043234', ['*']);

    var items = {};

    var selectized = jQuery('#' + element_id).selectize({
	valueField: 'annotation_class',
	labelField: 'annotation_class_label',
	searchField: 'annotation_class_label',
	create: false,
	render: {
            option: function(item, escape) {
		return '<div>' +
		    escape(item['annotation_class_label']) + ' (' +
		    escape(item['annotation_class']) + ')' +
		    '</div>';
            }
	},
	load: function(query, callback) {
	    // At least a length of 3 to operate.
            if( ! query.length ){
	    	return callback();
	    }
	    
	    manager.set_comfy_query(query);
            manager.search().then(function(resp){
		callback(resp.documents() || []);
            }).done();
	},
	onItemAdd: function(value, $item){
	    items[value] = true;
	},
	onItemRemove: function(value){
	    delete items[value];
	},
	onInitialize: function(){
	    if( jQuery('#' + element_id).val() ){
		items[jQuery('#' + element_id).val()] = true;
	    }
	}
    });

    
    this.values = function(){
	return us.keys(items);
    };

    
};


// Start the day the jQuery way.
jQuery(document).ready(function(){
    //jQuery('#select').selectize({});

    console.log('mmcc ready');
 
    var bioac = new createNEOBioAC('select-bio');
    var compac = new createComplexAC('select-term');

    jQuery('#submit').click(function(){

	if( compac.values().length !== 1 ){
	    alert('You must enter and select *one* protein complex.');
	}else if( bioac.values().length === 0 ){
	    alert('You must enter and select one or more bioentities.');
	}else{

	    // We know we have just one, convert it if it is the
	    // default value.
	    var cp = compac.values()[0];
	    if( cp === 'protein complex' ){
		cp = 'GO:0043234';
	    }

	    var reqs = new minerva_requests.request_set(global_barista_token,
							global_id);

	    // All as link in to complex.
	    //var ce = new class_expression();
	    //ce.as_set('intersection', [cp].concat(bio_svfs));
	    var complex_ind_id = reqs.add_individual(cp);

	    // Collect as has_parts.
	    each(bioac.values(), function(bid){
		var bind = reqs.add_individual(bid);
		reqs.add_fact([complex_ind_id, bind, 'BFO:0000051']);
	    });

	    sendRequestToMinerva(reqs);

	    //alert('submitted:' + bioac.values().join(', '));
	}
    });

    // When all is said and done, let's also fillout the user name
    // just for niceness. This is also a test of CORS in express.
    if( global_barista_token ){
	widgetry.user_check(global_barista_location,
			    global_barista_token, 'user_name_info');
    }
});

///
function sendRequestToMinerva(request_set){

    var logger = new bbop.logger('noctua mmcc');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Events registry.
    // Add manager and default callbacks to repl.
    var engine = new jquery_engine(barista_response);
    var manager = new minerva_manager(global_barista_location,
				      global_minerva_definition_name,
				      global_barista_token, engine, 'async');

    // GOlr location and conf setup.
    var gserv = global_golr_server;
    var gconf = new golr_conf.conf(amigo.data.golr);

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

    ///
    /// Management.
    ///

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

    }, 10);

    manager.request_with(request_set);
}
