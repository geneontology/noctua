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
var amigo_inst = require('amigo2-instance-data');
var amigo = new amigo_inst();
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

    // Stolen from the internal workings of widgetry.
    // Part 1.
    function _node_labels(n, cat_list){

	var retlist = [];
	
	var bin = {};
	each(n.types(), function(in_type){
	    var cat = in_type.category();
	    if( ! bin[cat] ){ bin[cat] = []; }
	    bin[cat].push(in_type);
	});
	each(cat_list, function(cat_id){
	    var accumulated_types = bin[cat_id];
	    var cell_cache = [];
	    each(accumulated_types, function(atype){
		//var tt = widgetry.type_to_span(atype, aid);
		var tt = atype.to_string();
		cell_cache.push(tt);
	    });
	    retlist.push(cell_cache.join("\n"));
	});

	return retlist;
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

	    var nid = n.id();
	    
	    // Where we'll assemble the label.
	    var table_row = [];

	    // First, extract any GP info, if it's there.
	    var sub = n.subgraph();
	    if( sub ){
		each(sub.all_nodes(), function(snode){
  
    		    var snid = snode.id();
	    
		    if( nid !== snid ){

			var edges = sub.get_edges(nid, snid);
			if( edges && edges.length > 0 ){
			    each(edges, function(e){
				if( e.predicate_id() === 'http://purl.obolibrary.org/obo/RO_0002333' ||
				    e.predicate_id() === 'RO_0002333' ||
				    e.predicate_id() === 'RO:0002333' ){
					var gpn = sub.get_node(snid);
					var gplbl = gpn;
					// Extract gp type labels and add them.
					var gp_labels =
						_node_labels(gpn, cat_list);
					each(gp_labels, function(gpl){
					    table_row.push('[' + gpl + ']');
					});
				}
			    });
			}
		    }
		});
	    }

	    // Extract node type labels and add them.
	    var node_labels = _node_labels(n, cat_list);
	    each(node_labels, function(nl){
		table_row.push(nl);
	    });
	    
	    // Make a label from it.
	    var nlbl = table_row.join("\n");

	    // Create the final element.
	    elements.push({
		group: 'nodes',
		data: {
		    id: n.id(),
		    label: nlbl,
		    degree: (ngraph.get_child_nodes(n.id()).length * 10) +
			ngraph.get_parent_nodes(n.id()).length
		}
	    });
	});
	each(ngraph.all_edges(), function(e){

	    // Detect endpoint type as best as possible.
	    var rglyph = aid.glyph(e.predicate_id());
	    var glyph = null;
	    if( rglyph === 'arrow' ){ // Arrow is explicit filled "PlainArrow".
		glyph = 'triangle';
	    }else if( rglyph === 'bar' ){ // Bar simulated by flattened arrow.
		glyph = 'tee';
	    }else if( ! rglyph || rglyph === 'none' ){ // Default is small "V".
		// Choosing circle over backcurve as the latter looks
		// essentially just like the triangle, and the circle
		// is the target endpoint in the GE anyways.
		glyph = 'circle';
		//glyph = 'triangle-backcurve';
	    }else{
		// Unpossible.
		throw new Error('unpossible glyph...is apparently possible');
	    }

	    // Push final edge data.
	    elements.push({
		group: 'edges',
		data: {
		    id: e.id(),
		    source: e.subject_id(),
		    target: e.object_id(),
		    predicate: e.predicate_id(),
		    label: aid.readable(e.predicate_id()),
		    color: aid.color(e.predicate_id()),
		    glyph: glyph
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
			// NOTE/WARNING: From
			// http://js.cytoscape.org/#style/edge-line
			// and other places, we need to use 'bezier'
			// here, rather than the defaulr 'haystack'
			// because the latter does not support glyphs
			// on the endpoints. However, this apparently
			// incurs a non-trivial performance hit.
			'curve-style': 'bezier',
			'target-arrow-color': 'data(color)',
			'target-arrow-shape': 'data(glyph)',
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
	    boxSelectionEnabled: true,
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

	// Make sure that there is a notice of highlight when we are
	// working.
	cy.on('select', function(evt){
	    console.log( 'selected: ' + evt.target.id() );
	    evt.target.style('background-color', 'gray');
	});
	cy.on('unselect', function(evt){
	    console.log( 'unselected: ' + evt.target.id() );
	    evt.target.style('background-color', 'white');
	});
	
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
