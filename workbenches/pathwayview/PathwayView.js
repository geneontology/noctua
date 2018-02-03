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
var regCose = require('cytoscape-cose-bilkent');
regCose( cytoscape ); // register extension

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

var graph_id = 'pathwayview';
//var graph_layout = 'noctuadef'; // default
var graph_layout = 'cose-bilkent'; // default
var graph_fold = 'editor'; // default
var graph_nest = 'no'; // default
var graph_show_mf = 'no'; // default
var graph_show_hi = 'no'; // default
var graph_show_shape = 'ellipse'; // default
var graph = null; // the graph itself
var cy = null;
var layout_opts = null;

///
var PathwayViewInit = function(user_token){

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

    function _render_graph(ngraph, layout, fold, nest, show_mf_p, show_hi_p, show_shape){

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

	///
	/// Strip the graph down to the desired level by destruction.
	///

	// Get a copy to start--we're gunna take our scissors to it.
	var g = ngraph.clone();

	// Get a list of all the singletons we start with.
	var all_starting_singletons_by_id = {};
	var sings = g.get_singleton_nodes();
	us.each(sings, function(sing){
	    all_starting_singletons_by_id[sing.id()] = true;
	});

	// Remove all of the undesireable rels.
	var parent_trap = {};
	var note_sink = {}; // keep the reverse lookup info of parent_trap
	var nestable_rels = {};
	if( nest && nest === 'yes' ){
	    console.log('adding nestable rels');
	    nestable_rels["BFO:0000050"] = true; // part of
	}
	var strippable_rels = {
	    "BFO:0000050": true, // part of
	    "RO:0002220": true, // adjacent to
	    "BFO:0000066": true // occurs in
	};
	us.each(g.all_edges(), function(e){
	    if( nestable_rels[e.predicate_id()] ){
		if( ! parent_trap[e.subject_id()] ){
		    parent_trap[e.subject_id()] = [];
		}
		parent_trap[e.subject_id()].push(e.object_id());
		// Note the object for later checking.
		note_sink[e.object_id()] = true;
	    }
	    if( strippable_rels[e.predicate_id()] ){
		g.remove_edge(e.subject_id(),
			      e.object_id(),
			      e.predicate_id());
	    }
	});

	// If it wasn't a singleton before we started, but is one now,
	// remove it. In "nest" mode, only remove ones that are not
	// going to be nested.
	var all_ending_singletons_by_id = {};
	var eings = g.get_singleton_nodes();
	us.each(eings, function(eing){
	    if( ! all_starting_singletons_by_id[eing.id()] ){
		if( nest && nest === 'yes' && note_sink[eing.id()] ){
		    // pass
		}else{
		    g.remove_node(eing.id());
		}
	    }
	});

	///
	/// Assemble labels and draw.
	///

	// Stolen from the internal workings of widgetry.
	// Part 1.
	var cat_list = [];
	each(g.all_nodes(), function(enode, enode_id){
	    each(enode.types(), function(in_type){
		cat_list.push(in_type.category());
	    });
	});
	var tmph = bbop.hashify(cat_list);
	cat_list = us.keys(tmph);

	// Translate into something cytoscape can understand.
	var elements = [];
	each(g.all_nodes(), function(n){

	    var nid = n.id();

	    // Where we'll assemble the label.
	    var table_row = [];

	    // Collect rdfs:label if extant.
	    var anns = n.annotations();
	    var rdfs_label = null;
	    if( anns.length !== 0 ){
		each(anns, function(ann){
    		    // Capture rdfs:label annotation for visual override
		    // if extant. Allow clobber of last.
		    if( ann.key() === 'rdfs:label' ){
			rdfs_label = ann.value();
		    }
		});
	    }
	    if( rdfs_label ){
		table_row.push('<<' + rdfs_label + '>>');
	    }

	    // First, extract any GP info (or has_input, depending on
	    // rel), if it's there.  If it is, it is the exclusive
	    // displayed info.
	    var gp_identified_p = false;
	    var has_input_collection = [];
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
					    // Remove the species name
					    // from each label for
					    // readability.
					    var last = gpl.lastIndexOf(" ");
					    if( last > 0 ){
						    gpl = gpl.substring(0, last);
					    }
					    table_row.push(gpl);
					    gp_identified_p = true;
					});
				    }else if( show_hi_p === 'yes' &&
					      e.predicate_id() === 'RO:0002233' ){
						  var hin = sub.get_node(snid);
						  var hilbl = hin;
						  // Extract type
						  // labels and add
						  // them.
						  var hi_labels = _node_labels(hin, cat_list);
						  each(hi_labels, function(hil){
						      // Remove the
						      // species name
						      // from each
						      // label for
						      // readability.
						      var last = hil.lastIndexOf(" ");
						      if( last > 0 ){
							  hil = hil.substring(0, last);
						      }
						      has_input_collection.push(hil);
						  });
					      }
			    });
			}
		    }
		});
	    }

	    var bgc = 'white';
	    if( ! gp_identified_p ){

		// Extract node type labels and add them.
		each(_node_labels(n, cat_list), function(nl){
		    if( show_mf_p === 'yes' ){
			table_row.push('[' + nl + ']');
		    }else{
			table_row.push(nl);
		    }
		});

	    }else if( show_mf_p === 'yes' ){

		// Extract node type labels and add them.
		each(_node_labels(n, cat_list), function(nl){
		    table_row.push('[' + nl + ']');
		});

	    }else{
		bgc = 'yellow';
	    }

	    // Add the has_inputs last.
	    each(has_input_collection, function(itm){
		//table_row.push('has_input('+itm+')');
		table_row.push('('+itm+'➔)');
	    });

	    // Make a label from it.
	    var nlbl = table_row.join("\n");
	    console.log(table_row);
	    //console.log(nlbl);

	    // Add nesting where desired, if the nesting isn't
	    // breaking the single parent model.
	    var parent = null;
	    var text_v_align = null;
	    var text_h_align = null;
	    if( parent_trap[n.id()] ){
		var parents = parent_trap[n.id()];
		if( parents.length === 1 ){
		    console.log('adding parent for: ' + n.id());
		    parent = parents[0];
		    text_v_align = 'top';
		    text_h_align = 'left';
		}
	    }

	    // Create the final element.
	    elements.push({
		group: 'nodes',
		data: {
		    id: n.id(),
		    label: nlbl,
		    parent: parent,
		    'text-valign': text_v_align,
		    'text-halign': text_h_align,
		    'background-color': bgc,
		    degree: (g.get_child_nodes(n.id()).length * 10) +
			g.get_parent_nodes(n.id()).length
		}
	    });
	});
	each(g.all_edges(), function(e){

	    // Detect endpoint type as best as possible.
	    var rn = e.relation() || 'n/a';
	    var rglyph = aid.glyph(rn);
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
		// throw new Error('unpossible glyph...is apparently possible');
		// For things like diamonds, and other currently unspecified
		// relations.
		glyph = 'circle';
	    }

	    var readable_rn = aid.readable(rn) || rn;
	    // If context aid doesn't work, see if it comes with a label.
	    if( readable_rn === rn && typeof(e.label) === 'function' ){
		var label_rn = e.label();
		if( label_rn !== rn ){
		    readable_rn = label_rn; // use label
		}
	    }

	    // Push final edge data.
	    elements.push({
		group: 'edges',
		data: {
		    id: e.id(),
		    source: e.subject_id(),
		    target: e.object_id(),
		    predicate: e.predicate_id(),
		    label: readable_rn,
		    color: aid.color(rn),
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
	    	//animate: false,
	    	animate: true,
		'directed': true,
		'fit': true
		// //'maximalAdjustments': 0,
		// 'circle': false,
		//'roots': cyroots
	    },
	    'cose-bilkent': {
		name: 'cose-bilkent',
		// // Called on `layoutready`
		// ready: function () {
		// },
		// // Called on `layoutstop`
		// stop: function () {
		// },
		// // Whether to include labels in node dimensions. Useful for avoiding label overlap
		// nodeDimensionsIncludeLabels: false,
		// // number of ticks per frame; higher is faster but more jerky
		// refresh: 30,
		// // Whether to fit the network view after when done
		// fit: true,
		// // Padding on fit
		// padding: 10,
		// // Whether to enable incremental mode
		randomize: true,
		// // Node repulsion (non overlapping) multiplier
		// nodeRepulsion: 4500,
		// // Ideal (intra-graph) edge length
//		idealEdgeLength: 150,
		// // Divisor to compute edge forces
		// edgeElasticity: 0.45,
		// // Nesting factor (multiplier) to compute ideal edge length for inter-graph edges
		// nestingFactor: 0.1,
		// // Gravity force (constant)
		// gravity: 0.25,
		// // Maximum number of iterations to perform
		// numIter: 2500,
		// // Whether to tile disconnected nodes
		// tile: true,
		// // Type of layout animation. The option set is {'during', 'end', false}
		// animate: 'end',
		// // Amount of vertical space to put between degree zero nodes during tiling (can also be a function)
		// tilingPaddingVertical: 10,
		// // Amount of horizontal space to put between degree zero nodes during tiling (can also be a function)
		// tilingPaddingHorizontal: 10,
		// // Gravity range (constant) for compounds
		// gravityRangeCompound: 1.5,
		// // Gravity force (constant) for compounds
		// gravityCompound: 1.0,
		// // Gravity range (constant)
		// gravityRange: 3.8,
		// // Initial cooling factor for incremental layout
		// initialEnergyOnIncremental:0.8
	    },
	    'noctuadef': {
	        'name': 'preset',
	        'padding': 30,
		'fit': true,
	        'positions': function(a){

		    var nid = a.data('id');
		    var node = g.get_node(nid);

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
//			'width': 150,
//			'height': 100,
			'width': 50,
			'height': 35,
			'background-color': 'white',
//			'background-color': 'black',
			'border-width': 1,
			'border-color': 'black',
//			'font-size': 14,
			'font-size': 8,
			'min-zoomed-font-size': 3, //10,
                        'text-valign': 'center',
                        'color': 'black',
//                      'color': 'black',
//			'shape': 'roundrectangle',
			'shape': show_shape,
//                        'text-outline-width': 1,
//                        'text-outline-color': '#222222',
			'text-wrap': 'wrap',
			'text-max-width': '48px'
		    }
		},
		{
		    selector: 'edge',
		    style: {
			// NOTE/WARNING: From
			// http://js.cytoscape.org/#style/edge-line
			// and other places, we need to use 'bezier'
			// here, rather than the default 'haystack'
			// because the latter does not support glyphs
			// on the endpoints. However, this apparently
			// incurs a non-trivial performance hit.
			'curve-style': 'bezier',
			'text-rotation': 'autorotate',
			'text-margin-y': '-6px',
			'target-arrow-color': 'data(color)',
			'target-arrow-shape': 'data(glyph)',
			'target-arrow-fill': 'filled',
			'line-color': 'data(color)',
			'content': 'data(label)',
			'font-size': 6,
			'min-zoomed-font-size': 3, //10,
                        'text-valign': 'center',
                        'color': 'white',
//			'width': 6,
                        'text-outline-width': 1,
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
	    wheelSensitivity: 0.25,
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
		ll('pathwayview ready');
	    }
	});

	//
	cy.viewport({
	    //zoom: 2//,
	    //pan: { x: 100, y: 100 }
	});

	// Make sure that there is a notice of highlight when we are
	// working.
	// cy.on('select', function(evt){
	//     console.log( 'selected: ' + evt.target.id() );
	//     evt.target.style('background-color', 'gray');
	// });
	// cy.on('unselect', function(evt){
	//     console.log( 'unselected: ' + evt.target.id() );
	//     evt.target.style('background-color', 'white');
	// });

	// TODO: notice on hover.
	//
	// Hacky, but I think should work in practice.
	var color_holder = 'lightgreen';
	var offset = 25;
	cy.on('mouseover', function(evt){
	    if( evt && evt.target && evt.target.id ){
		// Detect if node or not.
		var entity_id = evt.target.id();
		if( entity_id.substr(0, 8) === 'gomodel:' ){
		    color_holder = evt.target.style('background-color');
		    console.log( 'mouseovered: (' +
				 color_holder + ') ' +
				 entity_id );
		    evt.target.style('background-color', 'lightgreen');

		    // jQuery("#hoverbox").append('info about: ' + entity_id);
		    var gotten_node = g.get_node(entity_id);
		    var nso = new node_stack_object(gotten_node, aid);
		    jQuery("#hoverbox").append(nso.to_string());

		    var scroll_left = jQuery(document).scrollLeft();
		    var scroll_top = jQuery(document).scrollTop();
		    var x = (evt.originalEvent.pageX + offset - scroll_left) +
			    'px';
		    var y = (evt.originalEvent.pageY + offset - scroll_top) +
			    'px';
		    jQuery('#hoverbox').css('border-width', '1px');
		    jQuery('#hoverbox').css('border-style', 'solid');
		    jQuery('#hoverbox').css('border-color', 'black');
		    jQuery('#hoverbox').css('border-radius', '3px');
		    jQuery('#hoverbox').css('background-color', 'white');
		    jQuery('#hoverbox').css('padding', '1em');
		    jQuery('#hoverbox').css('position', 'fixed');
		    jQuery('#hoverbox').css('top', y);
		    jQuery('#hoverbox').css('left', x);
		    jQuery("#hoverbox").removeClass('hidden');
		}
	    }
	});
	cy.on('mouseout', function(evt){
	    if( evt && evt.target && evt.target.id ){
		// Detect if node or not.
		var entity_id = evt.target.id();
		//console.log(evt);
		if( entity_id.substr(0, 8) === 'gomodel:' ){
		    console.log( 'mouseouted: (' +
				 color_holder + ') ' +
				 entity_id );
		    evt.target.style('background-color', color_holder);
		    jQuery("#hoverbox").addClass('hidden');
		    jQuery("#hoverbox").empty();
		}
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
	_render_graph(graph, graph_layout, graph_fold,
		      graph_nest, graph_show_mf, graph_show_hi,
		      graph_show_shape);

	// Go ahead and wire-up the interface.
	jQuery("#" + "layout_selection").change(function(event){
	    graph_layout = jQuery(this).val();
	    //_render_graph(graph, graph_layout, graph_fold);
	    console.log('layout_opts', layout_opts[graph_layout]);
	    var layout = cy.layout(layout_opts[graph_layout]);
	    layout.run();
	});
	// jQuery("#" + "fold_selection").change(function(event){
	//     graph_fold = jQuery(this).val();
	//     _render_graph(graph, graph_layout, graph_fold);
	// });
	jQuery("#" + "nest_selection").change(function(event){
	    graph_nest = jQuery(this).val();
	    console.log('nesting now: "' + graph_nest + '"');
	    _render_graph(graph, graph_layout, graph_fold,
			  graph_nest, graph_show_mf, graph_show_hi,
			  graph_show_shape);
	});
	jQuery("#" + "mf_selection").change(function(event){
	    graph_show_mf = jQuery(this).val();
	    console.log('show mf now: "' + graph_show_mf + '"');
	    _render_graph(graph, graph_layout, graph_fold,
			  graph_nest, graph_show_mf, graph_show_hi,
			  graph_show_shape);
	});
	jQuery("#" + "hi_selection").change(function(event){
	    graph_show_hi = jQuery(this).val();
	    console.log('show hi now: "' + graph_show_hi + '"');
	    _render_graph(graph, graph_layout, graph_fold,
			  graph_nest, graph_show_mf, graph_show_hi,
			  graph_show_shape);
	});
	jQuery("#" + "shape_selection").change(function(event){
	    graph_show_shape = jQuery(this).val();
	    console.log('show shape now: "' + graph_show_shape + '"');
	    _render_graph(graph, graph_layout, graph_fold,
			  graph_nest, graph_show_mf, graph_show_hi,
			  graph_show_shape);
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
	    PathwayViewInit(start_token);

	    // When all is said and done, let's also fillout the user
	    // name just for niceness. This is also a test of CORS in
	    // express.
	    if( start_token ){
		widgetry.user_check(global_barista_location,
				    start_token, 'user_name_info', false);
	    }
	}
});


///
/// Lifts from widgetry.js
///

function node_stack_object(enode, aid){

    var hook_list = [];

    // Create a colorful label stack into an individual table.
    var enode_stack_table = new bbop_legacy.html.tag('table',
					      {'class':'bbop-mme-stack-table'});

    // General function for adding type information to stack.
    function _add_table_row(item, color, prefix, suffix){
	//var rep_color = aid.color(item.category());
	var out_rep = type_to_span(item, color);
	if( prefix ){ out_rep = prefix + out_rep; }
	if( suffix ){ out_rep = out_rep + suffix; }
	var trstr = null;
	if( color ){
	    trstr = '<tr class="bbop-mme-stack-tr" ' +
		'style="background-color: ' + color +
		';"><td class="bbop-mme-stack-td">' + out_rep + '</td></tr>';
	}else{
	    trstr = '<tr class="bbop-mme-stack-tr">' +
		'<td class="bbop-mme-stack-td">' + out_rep + '</td></tr>';
	}
	enode_stack_table.add_to(trstr);
    }

    // Collect meta-information if extant.
    var anns = enode.annotations();
    var rdfs_label = null;
    if( anns.length !== 0 ){

	// Meta counts.
	var n_ev = 0;
	var n_other = 0;
	each(anns, function(ann){
	    if( ann.key() === 'evidence' ){
		n_ev++;
	    }else{
		if( ann.key() !== 'hint-layout-x' &&
		    ann.key() !== 'hint-layout-y' ){
			n_other++;
		}
    		// Capture rdfs:label annotation for visual override
		// if extant. Allow clobber of last.
		if( ann.key() === 'rdfs:label' ){
		    rdfs_label = ann.value();
		}
	    }
	});
    }

    // rdfs:label first, if extant.
    if( rdfs_label ){
	var trstr = '<tr class="bbop-mme-stack-tr">' +
		'<td class="bbop-mme-stack-td bbop-mme-stack-td-rdfslabel"><em style="color: grey;">' +
		rdfs_label +
		'</em></td></tr>';
	enode_stack_table.add_to(trstr);
    }
    // Inferred types first.
    var inf_types = enode.get_unique_inferred_types();
    each(inf_types, function(item){ _add_table_row(item, null, '[', ']'); });
    // Editable types next.
    var std_types = enode.types();
    each(std_types, function(item){ _add_table_row(item); });

    // Now we trick our way through to adding the types^H^H^H^H^H
    // absorbed subgraph nodes of the subgraphs.
    var subgraph = enode.subgraph();
    if( subgraph ){

	// Gather the stack to display, abstractly do go up or down
	// the subgraph.
	var _folded_stack_gather = function(direction){

	    // First, get the parent/child sub-nodes.
	    var x_edges = [];
	    if( direction === 'standard' ){
		x_edges = subgraph.get_parent_edges(enode.id());
	    }else{
		x_edges = subgraph.get_child_edges(enode.id());
	    }
	    // Put an order on the edges.
	    x_edges.sort(function(e1, e2){
		return aid.priority(e1.relation()) - aid.priority(e2.relation());
	    });
	    each(x_edges, function(x_edge){
		// Edge info.
		var rel = x_edge.relation() || 'n/a';
		var rel_color = aid.color(rel);
		var rel_readable = aid.readable(rel);
		// If context aid doesn't work, see if it comes with a label.
		if( rel_readable === rel && typeof(x_edge.label) === 'function'){
		    var label_rn = x_edge.label();
		    if( label_rn !== rel ){
			rel = label_rn; // use label
		    }
		}else{
		    rel = rel_readable; // use context
		}

		// Try and extract proof of evidence.
		var ev_edge_anns = x_edge.get_annotations_by_key('evidence');
		// Get node.
		var x_ent_id = null;
		if( direction === 'standard' ){
		    x_ent_id = x_edge.object_id();
		}else{
		    x_ent_id = x_edge.subject_id();
		}
		var x_node = subgraph.get_node(x_ent_id);
		// Try and extract proof of evidence.
		if( x_node ){
		    var ev_node_anns = x_node.get_annotations_by_key('evidence');

		    // Add the edge/node combos to the table.
		    each(x_node.types(), function(x_type){

			//
			var elt_id = uuid();
			var edge_id = x_edge.id();
			hook_list.push([edge_id, elt_id]);
			if( ev_edge_anns.length > 0 ){
			    // In this case (which should be the only possible
			    // case), we'll capture the ID and pair it with an
			    // ID.
			    _add_table_row(x_type, rel_color, rel + '(',
					   ')<sup id="'+elt_id+'"><span class="bbop-noctua-embedded-evidence-symbol-with">E</button></sup>');
			}else{
			    _add_table_row(x_type, rel_color, rel + '(',
					   ')<sup id="'+elt_id+'"><span class="bbop-noctua-embedded-evidence-symbol-without">&nbsp;</button></sup>');
			}
		    });
		}
	    });
	};

	// Do it both ways--upstream and downstream.
	_folded_stack_gather('standard');
	_folded_stack_gather('reverse');

    }

    // // Inject meta-information if extant.
    // var anns = enode.annotations();
    // if( anns.length !== 0 ){

    // 	// Meta counts.
    // 	var n_ev = 0;
    // 	var n_other = 0;
    // 	each(anns, function(ann){
    // 	    if( ann.key() === 'evidence' ){
    // 		n_ev++;
    // 	    }else{
    // 		if( ann.key() !== 'hint-layout-x' &&
    // 		    ann.key() !== 'hint-layout-y' ){
    // 		    n_other++;
    // 		}
    // 	    }
    // 	});

    // 	// Add to top. No longer need evidence count on individuals.
    // 	var trstr = '<tr class="bbop-mme-stack-tr">' +
    // 		'<td class="bbop-mme-stack-td"><small style="color: grey;">' +
    // 		//'evidence: ' + n_ev + '; other: ' + n_other +
    // 		'annotations: ' + n_other +
    // 		'</small></td></tr>';
    // 	enode_stack_table.add_to(trstr);
    // }

    // Add external visual cue if there were inferred types.
    if( inf_types.length > 0 ){
	var itcstr = '<tr class="bbop-mme-stack-tr">' +
	    '<td class="bbop-mme-stack-td"><small style="color: grey;">' +
	    'inferred types: ' + inf_types.length + '</small></td></tr>';
	enode_stack_table.add_to(itcstr);
    }

    // return enode_stack_table;
    this.to_string = function(){
	return enode_stack_table.to_string();
    };

    //
    this.hooks = function(){
	return hook_list;
    };
}

function type_to_span(in_type, color){

    var text = null;

    var min = in_type.to_string();
    var more = in_type.to_string_plus();
    if( color ){
	text = '<span ' + 'style="background-color: ' + color + ';" ' +
	    'alt="' + more + '" ' + 'title="' + more +'">' + min + '</span>';
    }else{
	text = '<span alt="' + more + '" title="' + more +'">' + min + '</span>';
    }

    return text;
}

/**
 * A recursive writer for when we no longer care--a table that goes on
 * and on...
 */
function type_to_full(in_type, aid){
    var anchor = this;

    var text = '[???]';

    var t = in_type.type();
    if( t === 'class' ){ // if simple, the easy way out
	text = in_type.to_string_plus();
    }else{
	// For everything else, we're gunna hafta do a little
	// lifting...
	var cache = [];
	if( t === 'union' || t === 'intersection' ){

	    // Some kind of recursion on a frame then.
	    cache = [
		'<table width="80%" class="table table-bordered table-hover table-condensed mme-type-table" ' +
		    'style="background-color: ' +
	     	    aid.color(in_type.category()) + ';">',
		'<caption>' + t + '</caption>',
		//'<thead style="background-color: white;">',
		'<thead style="">',
		'</thead>',
		'<tbody>'
	    ];
	    // cache.push('<tr>'),
	    var frame = in_type.frame();
	    each(frame, function(ftype){
		cache.push('<tr style="background-color: ' +
		     	   aid.color(ftype.category()) + ';">');
		cache.push('<td>');
		// cache.push('<td style="background-color: ' +
	     	// 		aid.color(ftype.category()) + ';">'),
		cache.push(type_to_full(ftype, aid));
		cache.push('</td>');
		cache.push('</tr>');
	    });
	    // cache.push('</tr>');
	    cache.push('</tbody>');
	    cache.push('</table>');

	    text = cache.join('');

	}else{

	    // A little harder: need to a an SVF wrap before I recur.
	    var pid = in_type.property_id();
	    var plabel = in_type.property_label();
	    var svfce = in_type.svf_class_expression();
	    cache = [
		'<table width="80%" class="table table-bordered table-hover table-condensed mme-type-table">',
		'<thead style="background-color: ' + aid.color(pid) + ';">',
		plabel,
		'</thead>',
		'<tbody>'
	    ];
	    cache.push('<tr style="background-color: ' +
		       aid.color(svfce.category()) + ';"><td>');
	    cache.push(type_to_full(svfce, aid));
	    cache.push('</td></tr>');
	    cache.push('</tbody>');
	    cache.push('</table>');

	    text = cache.join('');
	}
    }

    return text;
}
