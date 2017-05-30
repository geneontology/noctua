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

var cytoscape = require('cytoscape');

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

// Barista (telekinesis, etc.) communication.
var barista_client = require('bbop-client-barista');

//
var jquery_engine = require('bbop-rest-manager').jquery;
var minerva_manager = require('bbop-manager-minerva');

///
/// ...
///

var graph_id = 'cytoview';
var graph_layout = 'noctuadef'; // default
var graph_fold = 'editor'; // default
var graph = null; // the graph itself
var cy = null;
var layout_opts = null;

///
var CytoViewInit = function(user_token){

    var logger = new bbop.logger('noctua cvi');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Events registry.
    // Add manager and default callbacks to repl.
    var engine = new jquery_engine(barista_response);
    engine.method('POST');
    var manager = new minerva_manager(global_barista_location,
				      global_minerva_definition_name,
				      user_token, engine, 'async');

    // GOlr location and conf setup.
    var gserv = global_golr_server;
    var gconf = new bbop_legacy.golr.conf(amigo.data.golr);

    // Contact points...
    // ...

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

    function _render_graph(ngraph, layout, fold){

	// Wipe it and start again.
	jQuery('#'+graph_id).empty();

	// Try and get it folded as desired.
	ngraph.unfold();
	if( fold === 'evidence' ){
	    graph_fold = fold;
	    ngraph.fold_evidence();
	}else if( fold === 'editor' ){
	    graph_fold = fold;
	    ngraph.fold_go_noctua(global_collapsible_relations);
	}else{
	    graph_fold = fold;
	}

	// Stolen from the internal workings of widgetry.
	// Part 1.
	var cat_list = [];
	each(ngraph.all_nodes(), function(enode, enode_id){
	    each(enode.types(), function(in_type){
		cat_list.push(in_type.category());
	    });
	});
	var tmph = bbop.hashify(cat_list);
	cat_list = us.keys(tmph);

	// Translate into something cytoscape can understand.
	var elements = [];
	each(ngraph.all_nodes(), function(n){

	    // Stolen from the internal workings of widgetry.
	    // Part 1.
	    var bin = {};
	    each(n.types(), function(in_type){
		var cat = in_type.category();
		if( ! bin[cat] ){ bin[cat] = []; }
		bin[cat].push(in_type);
	    });
	    var table_row = [];
	    each(cat_list, function(cat_id){
		var accumulated_types = bin[cat_id];
		var cell_cache = [];
		each(accumulated_types, function(atype){
		    //var tt = widgetry.type_to_span(atype, aid);
		    var tt = atype.to_string();
		    cell_cache.push(tt);
		});
		table_row.push(cell_cache.join("\n"));
	    });

	    // Make a label from it.
	    var nlbl = table_row.join("\n");

	    // Create the final element.
	    elements.push({
		group: 'nodes',
		data: {
		    id: n.id(),
		    label: nlbl,
		    degree: (ngraph.get_child_nodes(n.id()).length * 10)+
			ngraph.get_parent_nodes(n.id()).length
		}
	    });
	});
	each(ngraph.all_edges(), function(e){
	    elements.push({
		group: 'edges',
		data: {
		    id: e.id(),
		    source: e.subject_id(),
		    target: e.object_id(),
		    predicate: e.predicate_id(),
		    label: aid.readable(e.predicate_id()),
		    color: aid.color(e.predicate_id())
		}
	    });
	});

	// Get roots for algorithms that need it.
	var roots = graph.get_root_nodes();
	var root_ids = [];
	each(roots, function(root){
	    root_ids.push(root.id());
	});

	// Setup possible layouts.
	layout_opts = {
	    'cose': {
		name: 'cose',
	    	padding: 10,
	    	animate: false,
	    	// animate: true,
		// 'directed': true,
		'fit': true
		// //'maximalAdjustments': 0,
		// 'circle': false,
		// 'roots': cyroots
	    },
	    'noctuadef': {
	        'name': 'preset',
	        'padding': 30,
		'fit': true,
	        'positions': function(a){

		    var nid = a.data('id');
		    var node = ngraph.get_node(nid);
		    
		    // Somewhat vary the intitial placement.
		    function _vari(){
			var min = -25;
			var max = 25;
			var rand = Math.random();
			var seed = Math.floor(rand * (max-min+1) +min);
			return seed + 100;
		    }
		    function _extract_node_position(node, x_or_y){
			var ret = null;
			
			var hint_str = null;
			if( x_or_y === 'x' || x_or_y === 'y' ){
			    hint_str = 'hint-layout-' + x_or_y;
			}
			
			var hint_anns = node.get_annotations_by_key(hint_str);
			if( hint_anns.length === 1 ){
			    ret = parseInt(hint_anns[0].value());
			    //ll('extracted coord ' + x_or_y + ': ' + ret);
			}else if( hint_anns.length === 0 ){
			    //ll('no coord');	    
			}else{
			    //ll('too many coord');
			}
	
			return ret;
		    }
		    
		    var old_x = _extract_node_position(node, 'x') || _vari();
		    var old_y = _extract_node_position(node, 'y') || _vari();
		    console.log('nid', nid, 'old_x', old_x, 'old_y', old_y);
		    
		    return {'x': old_x, 'y': old_y };
		}
	    },
	    // 'sugiyama': {
	    //     'name': 'grid',
	    //     'padding': 30,
	    //     'position': get_pos
	    // },
	    'random': {
		name: 'random',
		fit: true
	    },
	    'grid': {
		name: 'grid',
		fit: true,
		padding: 30,
		rows: undefined,
		columns: undefined
	    },
	    'circle': {
		name: 'circle',
		fit: true,
		sort: function(a, b){
		    return a.data('degree') - b.data('degree');
		}
	    },
	    'breadthfirst': {
		name: 'breadthfirst',
		directed: true,
		fit: true,
		//nodeDimensionsIncludeLabels: true,
		spacingFactor: 1.0,// 1.75,
		padding: 30,// 30,
		//maximalAdjustments: 0,
		circle: false//,
		//roots: root_ids
	    }
	    // 'arbor': {
	    // 	name: 'arbor',
	    // 	fit: true, // whether to fit to viewport
	    // 	padding: 10 // fit padding
	    // },
	};
	
	// Ramp up view.
	cy = cytoscape({
	    // UI loc
	    container: document.getElementById(graph_id),
	    // actual renderables
	    elements: elements,
	    layout: layout_opts[layout],
	    style: [
		{
		    selector: 'node',
		    style: {
			'content': 'data(label)',
			'width': 150,
			'height': 100,
			'background-color': 'white',
			'border-width': 2,
			'border-color': 'black',
			'font-size': 14,
			'min-zoomed-font-size': 3, //10,
                        'text-valign': 'center',
                        'color': 'black',
			'shape': 'roundrectangle',
                        //'text-outline-width': 2,
                        //'text-outline-color': '#222222',
			'text-wrap': 'wrap',
			'text-max-width': '100px'
		    }
		},
		{
		    selector: 'edge',
		    style: {
			'target-arrow-color': 'data(color)',
			'target-arrow-shape': 'triangle',
			'target-arrow-fill': 'filled',
			'line-color': 'data(color)',
			'content': 'data(label)',
			'font-size': 14,
			'min-zoomed-font-size': 3, //10,
                        'text-valign': 'center',
                        'color': 'white',
			'width': 6,
                        'text-outline-width': 2,
                        'text-outline-color': '#222222'
		    }
		}
	    ],
	    // initial viewport state:
	    //zoom: 1,
	    //pan: { x: 0, y: 0 },
	    // interaction options:
	    minZoom: 0.1,
	    maxZoom: 3.0,
	    zoomingEnabled: true,
	    userZoomingEnabled: true,
	    panningEnabled: true,
	    userPanningEnabled: true,
	    boxSelectionEnabled: false,
	    selectionType: 'single',
	    touchTapThreshold: 8,
	    desktopTapThreshold: 4,
	    autolock: false,
	    autoungrabify: false,
	    autounselectify: false,
	    ready: function(){
		ll('cytoview ready');
	    }
	});

	//
	cy.viewport({
	    //zoom: 2//,
	    //pan: { x: 100, y: 100 }
	});
	cy.boxSelectionEnabled( true );
	
	///
	/// We have environment and token, get ready to allow live
	/// layout work.
	///
		
	// Zoom has no affect on the "position" of the nodes, so we can
	// just find a box and translate it into noctua.
	jQuery('#button').click(function(){

	    // Manager to push saved locations back to the server.
	    var laymanager = new minerva_manager(global_barista_location,
						 global_minerva_definition_name,
						 user_token, engine, 'async');
	    laymanager.register('prerun', _shields_up);
	    laymanager.register('postrun', _shields_down, 9);
	    // Likely save success.
	    laymanager.register('rebuild', function(resp, man){
		ll('rebuild callback--save success, so close');
		window.close();
	    });

	    // Barista client for pushing changes to barista, and
	    // update listing clients.
	    var barclient = new barista_client(global_barista_location,
					       user_token);
	    barclient.connect(global_id);

	    var cnodes = cy.nodes();
	    if( cnodes && cnodes.length !== 0 ){
		// Default to something real before loop.
		var least_x = cnodes[0].position('x');
		var least_y = cnodes[0].position('y');
		us.each(cnodes, function(cnode){
		    var x = cnode.position('x');
		    if( x < least_x ){ least_x = x; }
		    var y = cnode.position('y');
		    if( y < least_y ){ least_y = y; }
		    
		    console.log('position', cnode.position());
		});
		//alert(cy.zoom());
		
		console.log('zoom', cy.zoom());
		console.log('least_x', least_x);
		console.log('least_y', least_y);
		
		//
		var base_shift = 50;
		var x_shift = (-1.0 * least_x) + base_shift;
		var y_shift = (-1.0 * least_y) + base_shift;
		
		// Start a new request and cycle through all the nodes
		// to force updates.
		var reqs = new minerva_requests.request_set(
		    laymanager.user_token(), global_id);
		us.each(cnodes, function(cnode){

		    var nid = cnode.data('id');
		    var node = ngraph.get_node(nid);
		    
		    var new_x =  cnode.position('x') + x_shift;
		    var new_y =  cnode.position('y') + y_shift;

		    console.log('nx', new_x, 'ny', new_y);

		    reqs.update_annotations(
		    	node, 'hint-layout-x', new_x);
		    reqs.update_annotations(
		    	node, 'hint-layout-y', new_y);

		    // There is no "local store" to speak of here, so
		    // just push out to other clients.
		    if( barclient ){
			// Remember: telekinesis does t/l, not l/t (= x/y).
			barclient.telekinesis(nid, new_y, new_x);
		    }
		});

		// And add the actual storage.
		reqs.store_model();
		laymanager.request_with(reqs);
	    }
	});
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

	// Noctua graph.
	graph = new noctua_graph();
	graph.load_data_basic(resp.data());

	// Initial rendering of the graph.
	_render_graph(graph, graph_layout, graph_fold);

	// Go ahead and wire-up the interface.
	jQuery("#" + "layout_selection").change(function(event){
	    graph_layout = jQuery(this).val();
	    //_render_graph(graph, graph_layout, graph_fold);
	    console.log('layout_opts', layout_opts[graph_layout]);
	    var layout = cy.layout(layout_opts[graph_layout]);
	    layout.run();
	});
	jQuery("#" + "fold_selection").change(function(event){
	    graph_fold = jQuery(this).val();
	    _render_graph(graph, graph_layout, graph_fold);
	});
    }, 10);

    manager.get_model(global_id);
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
	    CytoViewInit(start_token);

	    // When all is said and done, let's also fillout the user
	    // name just for niceness. This is also a test of CORS in
	    // express.
	    if( start_token ){
		widgetry.user_check(global_barista_location,
				    start_token, 'user_name_info', false);
	    }
	}
});
