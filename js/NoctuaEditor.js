/**
 * NoctuaEditor runner.
 * Application initializer.
 * Application logic.
 * Initialze with (optional) incoming data and setup the GUI.
 *
 * @module NoctuaEditor
 */

// Let jshint pass over over our external globals (browserify takes
// care of it all).
/* global jQuery */
/* global global_golr_server */
/* global global_golr_neo_server */
/* global global_barista_location */
/* global global_minerva_definition_name */
/* global jsPlumb */
/* global global_barista_token */
/* global global_collapsible_relations */
/* global global_collapsible_reverse_relations */
/* global global_id */
/* global global_model */
/* global global_known_relations */
/* global global_workbenches_individual */

// Code here will be ignored by JSHint, as we are technically
// "redefining" jQuery (although we are not).
/* jshint ignore:start */
var jQuery = require('jquery');
var jsPlumb = require('jsplumb');
/* jshint ignore:end */

//require('jquery-ui');
//require('bootstrap');
//require('tablesorter');
//require('./js/connectors-sugiyama.js');
var bbop_legacy = require('bbop').bbop;
var bbopx = require('bbopx');
var amigo = require('amigo2');

// The new backbone libs.
//var bbop
var us = require('underscore');
var bbop = require('bbop-core');
var model = require('bbop-graph-noctua');
var barista_response = require('bbop-response-barista');
var minerva_requests = require('minerva-requests');

//
var jquery_engine = require('bbop-rest-manager').jquery;
var minerva_manager = require('bbop-manager-minerva');

// Aliases.
var each = us.each;
var noctua_graph = model.graph;
var noctua_node = model.node;
var noctua_annotation = model.annotation;
var edge = model.edge;

// And its replacement
var widgetry = require('noctua-widgetry');
//alert(widgetry);

// Want a "global" shield to help deal with bridging the initial
// minerva contact load.
var compute_shield_modal = null;


/**
 * Bootstraps a working environment for the MME client.
 *
 * @param {Object} model_json TODO
 * @param {Object} in_relations TODO
 * @param {Object} in_token TODO
 */
var MMEnvInit = function(model_json, in_relations, in_token){

    //ll('model_json', model_json);
    
    var logger = new bbop.logger('noctua editor');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Help with strings and colors--configured separately.
    // // BUG/TODO: Some fixes for Paul as going upstream today is still
    // // fiddly--would like to spin this out as a separate package.
    // amigo.data.context['RO:0002411']['priority'] = 1;
    // amigo.data.context['RO:0002413']['priority'] = 1;
    // console.log(amigo.data.context);
    // // Instantiate.
    var aid = new bbop_legacy.context(amigo.data.context);

    // Create the core model.
    var ecore = new noctua_graph();

    // The type of view we'll use to edit; tells which load function
    // to use.
    //var view_type = 'basic'; // or 'ev_fold' or 'go_fold' or ...
    var view_type = 'go_fold'; // or 'ev_fold' or 'go_fold' or ...

    // Optionally use the messaging server as an experiment.
    var barclient = null;

    // Where we move the nodes during this session.
    // BUG/TODO: Should be the domain of Barista.
    var local_position_store = new bbopx.noctua.location_store();

    // Events registry.
    // Add manager and default callbacks to minerva/barista.
    var engine = new jquery_engine(barista_response);
    engine.method('POST');
    var manager = new minerva_manager(global_barista_location,
				      global_minerva_definition_name,
				      in_token, engine, 'async');

    // GOlr location and conf setup.
    var gserv = global_golr_server;
    var gserv_neo = global_golr_neo_server;
    var gconf = new bbop_legacy.golr.conf(amigo.data.golr);

    // Define what annotations are allowed to be edited where.
    // Looking eerily like GOlr config now.
    var model_annotation_config = [
	{
	    'id': 'title',
	    'label': 'Title',
	    'widget_type': 'text',
	    'policy': 'mutable',
	    'cardinality': 'one',
	    'placeholder': 'Add title'
	},
	{
	    'id': 'contributor',
	    'label': 'Contributor',
	    'policy': 'read-only'
	    //'cardinality': 'many'
	    //'placeholder': 'n/a!',
	    //'widget_type': 'text'
	},
	{
	    'id': 'date',
	    'label': 'Date',
	    'policy': 'read-only'
	    //'cardinality': 'many'
	    //'placeholder': 'n/a!',
	    //'widget_type': 'text'
	},
	{
	    'id': 'state',
	    'label': 'Annotation state',
	    'widget_type': 'dropdown',
	    'policy': 'mutable',
	    //'policy': 'read-only',
	    'cardinality': 'one',
	    'placeholder': 'development', // acts as default select here
	    'options': [
		{
		    'label': 'production',
		    'identifier': 'production',
		    'comment': 'Considered Good, always exported.'
		},
		{
		    'label': 'review',
		    'identifier': 'review',
		    'comment': 'Between production and development, may still be exported in data, but has possibly been flagged (in a manual or automated process) or is just setting out from development for the first time.'
		},
		{
		    'label': 'development',
		    'identifier': 'development',
		    'comment': 'The model is a work in progress, would only be exported in development environments; the standard initial state (public).'
		},
		{
		    'label': 'closed',
		    'identifier': 'closed',
		    'comment': 'Editable, but never exported.'
		}
	    ]
	},
	// {
	//     'id': 'evidence',
	//     'label': 'Evidence',
	//     'widget_type': 'text',
	//     'policy': 'mutable',
	//     'cardinality': 'many',
	//     'placeholder': 'Enter evidence type'
	    
	// },
	// {
	//     'id': 'source',
	//     'label': 'Source',
	//     'widget_type': 'text',
	//     'policy': 'mutable',
	//     'cardinality': 'many',
	//     'placeholder': 'Enter reference type'
	// },
	{
	    'id': 'deprecated',
	    'label': 'Deprecated',
	    'widget_type': 'dropdown',
	    'policy': 'mutable',
	    'cardinality': 'one',
	    'placeholder': 'false',
	    'options': [
		{
		    'label': 'True (model is deprecated)',
		    'identifier': 'true',
		    'comment': 'Considered Good, always exported.'
		},
		{
		    'label': 'False (default; model is good)',
		    'identifier': 'false',
		    'comment': 'Considered Bad never exported.'
		}
	    ]
	},
	// {
	//     'id': 'template',
	//     'label': 'Use as template',
	//     'widget_type': 'dropdown',
	//     'policy': 'mutable',
	//     'cardinality': 'one',
	//     'placeholder': 'false',
	//     'options': [
	// 	{
	// 	    'label': 'True (model is a template)',
	// 	    'identifier': 'true',
	// 	    'comment': 'Can be copied form workbench, but no longer edited.'
	// 	},
	// 	{
	// 	    'label': 'False (default; model is not a template)',
	// 	    'identifier': 'false',
	// 	    'comment': 'Edited as normal.'
	// 	}
	//     ]
	// },
	{
	    'id': 'comment',
	    'label': 'Comment',
	    'widget_type': 'textarea',
	    'policy': 'mutable',
	    'cardinality': 'many',
	    'placeholder': 'Add comment...'		
	}
    ];
    var instance_annotation_config = [
	// {
	//     'id': 'title',
	//     'label': 'Title',
	//     'widget_type': 'text',
	//     'policy': 'mutable',
	//     'cardinality': 'one',
	//     'placeholder': 'Add title'
	// },
	{
	    'id': 'contributor',
	    'label': 'Contributor',
	    'policy': 'read-only'
	    //'cardinality': 'many'
	    //'placeholder': 'n/a!',
	    //'widget_type': 'text'
	},
	{
	    'id': 'date',
	    'label': 'Date',
	    'policy': 'read-only'
	    //'cardinality': 'many'
	    //'placeholder': 'n/a!',
	    //'widget_type': 'text'
	},
	// {
	//     'id': 'with',
	//     'label': 'With',
	//     'policy': 'read-only-optional'
	//     //'cardinality': 'many'
	//     //'placeholder': 'n/a!',
	//     //'widget_type': 'text'
	// },
	{
	    'id': 'comment',
	    'label': 'Comment',
	    'widget_type': 'textarea',
	    'policy': 'mutable',
	    'cardinality': 'many',
	    'placeholder': 'Add comment...'		
	}
    ];
    var fact_annotation_config = [
	// {
	//     'id': 'title',
	//     'label': 'Title',
	//     'widget_type': 'text',
	//     'policy': 'mutable',
	//     'cardinality': 'one',
	//     'placeholder': 'Add title'
	// },
	{
	    'id': 'contributor',
	    'label': 'Contributor',
	    'policy': 'read-only'
	    //'cardinality': 'many'
	    //'placeholder': 'n/a!',
	    //'widget_type': 'text'
	},
	{
	    'id': 'date',
	    'label': 'Date',
	    'policy': 'read-only'
	    //'cardinality': 'many'
	    //'placeholder': 'n/a!',
	    //'widget_type': 'text'
	},
	{
	    'id': 'evidence',
	    'label': 'Evidence',
	    //'widget_type': 'text',
	    'widget_type': 'source_ref',
	    'policy': 'mutable',
	    'cardinality': 'many',
	    'placeholder': 'Enter evidence type (by ECO label)',
	    'placeholder_secondary': 'Enter source (e.g. PMID:1234567)',
	    'placeholder_tertiary': "Enter &quot;with&quot;; only for appropriate evidence types"
	},
	// {
	//     'id': 'source',
	//     'label': 'Source',
	//     'widget_type': 'text',
	//     'policy': 'mutable',
	//     'cardinality': 'many',
	//     'placeholder': 'Enter reference type'
	// },
	{
	    'id': 'comment',
	    'label': 'Comment',
	    'widget_type': 'textarea',
	    'policy': 'mutable',
	    'cardinality': 'many',
	    'placeholder': 'Add comment...'		
	}
    ];

    // Div contact points.
    var graph_container_id = 'main_exp_graph_container';
    var graph_container_div = '#' + graph_container_id;
    var graph_id = 'main_exp_graph';
    var graph_div = '#' + graph_id;
    var table_info_id = 'main_info_table';
    var table_info_div = '#' + table_info_id;
    var table_exp_id = 'main_exp_table';
    var table_exp_div = '#' + table_exp_id;
    var table_edge_id = 'main_edge_table';
    var table_edge_div = '#' + table_edge_id;
    var control_id = 'main_exp_gui';
    var control_div = '#' + control_id;
    // Ubernoodle contact points.
    var simple_ubernoodle_auto_id = 'simple_ubernoodle_auto';
    var simple_ubernoodle_auto_elt = '#' + simple_ubernoodle_auto_id;
    var simple_ubernoodle_add_btn_id ='simple_ubernoodle_adder_button';
    var simple_ubernoodle_add_btn_elt = '#' + simple_ubernoodle_add_btn_id;
    // MF (free form) button contact points.
    var simple_mf_free_enb_auto_id = 'simple_mf_free_enb_auto';
    var simple_mf_free_enb_auto_elt = '#' + simple_mf_free_enb_auto_id;
    var simple_mf_free_act_auto_id = 'simple_mf_free_act_auto';
    var simple_mf_free_act_auto_elt = '#' + simple_mf_free_act_auto_id;
    var simple_mf_free_occ_auto_id = 'simple_mf_free_occ_auto';
    var simple_mf_free_occ_auto_elt = '#' + simple_mf_free_occ_auto_id;
    var simple_mf_free_add_btn_id = 'simple_mf_free_adder_button';
    var simple_mf_free_add_btn_elt = '#' + simple_mf_free_add_btn_id;
    // BP (free form) button contact points.
    // var simple_bp_free_enb_auto_id = 'simple_bp_free_enb_auto';
    // var simple_bp_free_enb_auto_elt = '#' + simple_bp_free_enb_auto_id;
    var simple_bp_free_act_auto_id = 'simple_bp_free_act_auto';
    var simple_bp_free_act_auto_elt = '#' + simple_bp_free_act_auto_id;
    var simple_bp_free_occ_auto_id = 'simple_bp_free_occ_auto';
    var simple_bp_free_occ_auto_elt = '#' + simple_bp_free_occ_auto_id;
    var simple_bp_free_add_btn_id = 'simple_bp_free_adder_button';
    var simple_bp_free_add_btn_elt = '#' + simple_bp_free_add_btn_id;
    // Other contact points.
    var model_ann_id = 'menu-model-annotations';
    var model_ann_elt = '#' + model_ann_id;
    //
    var toggle_part_of_id = 'toggle_part_of';
    var toggle_part_of_elt = '#' + toggle_part_of_id;
    var toggle_screen_id = 'toggle_screen_of';
    var toggle_screen_elt = '#' + toggle_screen_id;
    //
    var view_basic_id = 'view_basic';
    var view_basic_elt = '#' + view_basic_id;
    var view_ev_fold_id = 'view_ev_fold';
    var view_ev_fold_elt = '#' + view_ev_fold_id;
    var view_go_fold_id = 'view_go_fold';
    var view_go_fold_elt = '#' + view_go_fold_id;
    //
    var zin_btn_id = 'zoomin';
    var zin_btn_elt = '#' + zin_btn_id;
    var zret_btn_id = 'zoomret';
    var zret_btn_elt = '#' + zret_btn_id;
    var zout_btn_id = 'zoomout';
    var zout_btn_elt = '#' + zout_btn_id;
    //
    var undo_btn_id = 'action_undo';
    var undo_btn_elt = '#' + undo_btn_id;
    var redo_btn_id = 'action_redo';
    var redo_btn_elt = '#' + redo_btn_id;
    //
    var refresh_btn_id = 'action_refresh';
    var refresh_btn_elt = '#' + refresh_btn_id;
    var reset_btn_id = 'action_reset';
    var reset_btn_elt = '#' + reset_btn_id;
    // var export_btn_id = 'action_export';
    // var export_btn_elt = '#' + export_btn_id;
    var save_btn_id = 'action_save';
    var save_btn_elt = '#' + save_btn_id;
    var ping_btn_id = 'action_ping';
    var ping_btn_elt = '#' + ping_btn_id;
    var test_btn_id = 'action_test';
    var test_btn_elt = '#' + test_btn_id;
    var exp_btn_id = 'action_shin';
    var exp_btn_elt = '#' + exp_btn_id;
    var help_btn_id = 'action_help';
    var help_btn_elt = '#' + help_btn_id;
    // A hidden for to communicate with the outside world.
    var action_form_id = 'invisible_action';
    var action_form_elt = '#' + action_form_id;
    var action_form_data_id = 'invisible_action_data';
    var action_form_data_elt = '#' + action_form_data_id;

    // Some experimental stuff for optional messaging server.
    var message_area_id = 'message_area';
    //var message_area_elt = '#' + message_area_id;
    var message_area_tab_id = 'message_area_tab';
    var message_area_tab_elt = '#' + message_area_tab_id;
    var reporter = new widgetry.reporter(message_area_id);

    ///
    /// Render helpers.
    ///

    // Add the necessary elements to the display.
    var h_spacer = 75;
    var v_spacer = 75;
    var box_width = 150;
    var box_height = 100;
    var vbox_width = 5;
    var vbox_height = 5;
    function _box_top(raw_y){
	return ((box_height + v_spacer) * raw_y) + v_spacer;	
    }
    function _box_left(raw_x){
	return ((box_width + h_spacer) * raw_x) + h_spacer;
    }
    function _vbox_top(raw_y){
	return _box_top(raw_y) + (box_height / 2.0);
    }
    function _vbox_left(raw_x){
	return _box_left(raw_x) + (box_width / 2.0);
    }

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
	    ret = hint_anns[0].value();
	    //ll('extracted coord ' + x_or_y + ': ' + ret);
	}else if( hint_anns.length === 0 ){
	    //ll('no coord');	    
	}else{
	    //ll('too many coord');
	}
	
	return ret;
    }

    ///
    /// jsPlumb preamble.
    ///

    var instance = jsPlumb.getInstance(
	{
	    // All connections have these properties.
	    DragOptions: {ccursor: 'pointer', zIndex:2000 },
            Endpoints : ["Rectangle", ["Dot", { radius:8 } ]],
            //Endpoints : [["Dot", { radius:8 } ], "Rectangle"],
	    EndpointStyles : [
		{ 
		    width: 15,
		    height: 15,
		    //strokeStyle: '#000000',
		    fillStyle: "#666666"  // subject endpoint color
		},
		{
		    fillStyle: "#0d78bc" // object endpoint
		    //fillStyle: "#006"
		}
	    ],
	    //PaintStyle: { strokeStyle:'#0d78bc' },
	    PaintStyle : {
		strokeStyle:"#666666", // color when creating new edge
		lineWidth: 5
	    },

	    Container: graph_id
        });

    ///
    /// jsPlumb helpers.
    ///

    function _set_zoom(zlvl) {
	var btype = [ "-webkit-", "-moz-", "-ms-", "-o-", "" ];
        var scale_str = "scale(" + zlvl + ")";
	each(btype, function(b){
	    jQuery(graph_div).css(b + "transform", scale_str);
	});
	instance.setZoom(zlvl);
    }

    ///
    /// jsPlumb/edit core helpers.
    ///

    function _attach_node_draggable(sel){

	var foo = jsPlumb.getSelector(sel);

	// Make it draggable, and update where it is when it is
	// dropped.
	function _on_drag_stop(evt, ui){

	    // Try an jimmy out the enode ssociated with this event.
	    var enid = ui.helper.attr('id');
	    var en = ecore.get_node_by_elt_id(enid);

	    // If we got something, locate it and save the position.
	    if( en ){

		// Grab position.
		var t = ui.position.top;
		var l = ui.position.left;

		//ll('stop (' + en.id() + ') at:' + t + ', ' + l);

		// Keep track of where we leave it when we move it.
		local_position_store.add(en.id(), l, t);
	    }
	}

	// While we are dragging, make note.
	function _on_dragging(evt, ui){

	    // Try an jimmy out the enode ssociated with this event.
	    var enid = ui.helper.attr('id');
	    var en = ecore.get_node_by_elt_id(enid);

	    // If we got something, locate it and save the position.
	    if( en ){

		// Grab position.
		var top = ui.position.top;
		var left = ui.position.left;

		//ll('dragging (' + en.id() + ') at:' + top + ', ' + left);
		if( barclient ){
		    barclient.telekinesis(en.id(), top, left);
		}
	    }
	}

	// Try top-level container containment to prevent inaccessible
	// nodes.
	//instance.draggable(foo, {stop: _on_drag_stop});
	instance.draggable(foo, {stop: _on_drag_stop,
				 drag: _on_dragging,
				 containment: graph_div,
				 scroll: false
				});
    }

    function _make_selector_target(sel){
	instance.makeTarget(jsPlumb.getSelector(sel), {
    	    anchor:"Continuous",
	    isTarget: true,
	    //maxConnections: -1,
	    connector:[ "Sugiyama", { curviness: 25 } ]
    	});
    }

    function _make_selector_source(sel, subsel){
        instance.makeSource(jsPlumb.getSelector(sel), {
            filter: subsel,
            anchor:"Continuous",
	    isSource: true,
	    //maxConnections: -1,
            connector:[ "Sugiyama", { curviness: 25 } ]
        });
    }
    
    function _attach_node_dblclick_ann(sel){

	// BUG/TODO: trial
	// Add activity listener to the new edge.
	jQuery(sel).unbind('dblclick');
	jQuery(sel).dblclick(
	    function(event){
		event.stopPropagation();
		
		//var target_elt = jQuery(event.target);
		var target_id = jQuery(this).attr('id');
		var enode = ecore.get_node_by_elt_id(target_id);
		if( enode ){		    
		    var ann_edit_modal = widgetry.edit_annotations_modal;
		    var eam = ann_edit_modal(instance_annotation_config,
					     ecore, manager, enode.id(),
					     gserv, gconf);
		    eam.show();
		}else{
		    alert('Could not find related test element.');
		}
	    });
    }

    function _attach_node_click_edit(sel){

	// Add this event to whatever we got called in.
	jQuery(sel).unbind('click');
	jQuery(sel).click(
	    function(evnt){
		evnt.stopPropagation();

		// Resolve the event into the edit core node.
		var target_elt = jQuery(evnt.target);
		var parent_elt = target_elt.parent();
		var parent_id = parent_elt.attr('id');
		var enode = ecore.get_node_by_elt_id(parent_id);
		if( enode ){		    
		    var nedit =
			widgetry.edit_node_modal(ecore, manager, enode,
						 in_relations, aid,
						 gserv_neo, gconf,
						 global_workbenches_individual,
						 in_token);
		    nedit.show();
		}else{
		    alert('Could not find related element.');
		}
	    });
    }

    // Delete all UI connections associated with node. This also
    // triggers the "connectionDetached" event, so the edges are being
    // removed from the model at the same time.
    function _delete_iae_from_ui(indv_id){

	// Node ID to element ID.
	var nelt = ecore.get_node_elt_id(indv_id);

	// Get rid of it's connections.
	instance.detachAllConnections(nelt);

	// Delete node from UI/model.
	jQuery('#' + nelt).remove();
    }

    // // Helper for getting rid of nodes. In all these cases, edges will
    // // come off naturally.
    // function _delete_iae_from_ecore(indv_id){
    // 	// Should recursively remove direct evidence, etc.
    // 	ecore.remove_node(indv_id, true);
    // }

    function _connect_with_edge(eedge){

	var sn = eedge.source();
	var tn = eedge.target();
	var rn = eedge.relation() || 'n/a';

	// Readable label.
	rn = aid.readable(rn);
	var clr = aid.color(rn);

	// Append if there are comments, etc.
	var eanns = eedge.annotations();
	if( eanns.length !== 0 ){
	    // Meta counts.
	    var n_ev = 0;
	    var n_other = 0;
	    each(eanns, function(ann){
		if( ann.key() === 'evidence' ){
		    n_ev++;
		}else{				  
		    n_other++;
		}
	    });
	    rn += ' <small style="color: grey;">'+n_ev+'/'+n_other+'</small>';
	}

	// Try and detect the proper edge type.
	var rglyph = aid.glyph(rn);
	var glyph = null;
	var glyph_args = {};
	if( rglyph === 'arrow' ){
	    glyph = 'Arrow';
	    glyph_args['location'] = -4;
	}else if( rglyph === 'diamond' ){
	    glyph = 'Diamond';
	    glyph_args['location'] = -5;
	}else if( rglyph === 'bar' ){
	    glyph = 'Arrow';
	    glyph_args['length'] = 2;
	    glyph_args['width'] = 25;
	    glyph_args['foldback'] = 2.0;
	    glyph_args['location'] = -5;
	}else if( rglyph === 'wedge' ){
	    glyph = 'PlainArrow';
	    glyph_args['location'] = -4;
	}else if( ! rglyph || rglyph === 'none' ){
	    // Let it go as nothing.
	}else{
	    // Unpossible.
	    throw new Error('unpossible glyph...is apparently possible');
	}

    	var new_conn_args = {
	    // remember that edge ids and elts ids are the same 
    	    'source': ecore.get_node_elt_id(sn),
    	    'target': ecore.get_node_elt_id(tn),
	    //'label': 'foo' // works
	    'anchor': "Continuous",
	    'connector': ["Sugiyama", { curviness: 75 } ],
            // Endpoints : [["Dot", { radius:8 } ], "Rectangle"],
	    'paintStyle': {
		strokeStyle: clr,
		lineWidth: 5
	    },
	    'overlays': [ // does not!?
		["Label", {'label': rn,
			   'location': 0.5,
			   'cssClass': "aLabel",
			   'id': 'label' } ]
	    ]
	    //}, {'PaintStyle': { strokeStyle: clr, lineWidth: 5}});
	};
	if( glyph ){
    	    new_conn_args['overlays'].push([glyph, glyph_args]);
	}
    	var new_conn = instance.connect(new_conn_args);

	// Associate the connection ID with the edge ID.
	ecore.create_edge_mapping(eedge, new_conn);

	// Add activity listener to the new edge.
	new_conn.bind('dblclick', function(connection, event){
	    //alert('edge click: ' + eedge.id());
	    var ann_edit_modal = widgetry.edit_annotations_modal;
	    var eam = ann_edit_modal(fact_annotation_config, ecore, manager,
				     eedge.id(), gserv, gconf);
	    eam.show();
	});
	
	// NOTE: This is necessary since these connectors are created
	// under the covers of jsPlumb--I don't have access during
	// creation like I do with the nodes.
	ecore.create_edge_mapping(eedge, new_conn);
    }

    ///
    /// Callback helpers and manager registration.
    ///

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

    // Update/repaint the table.
    function _refresh_tables(){
	ll('refreshing tables/info');

	widgetry.repaint_info(ecore, aid, table_info_div);
	widgetry.repaint_exp_table(ecore, aid, table_exp_div);
	widgetry.repaint_edge_table(ecore, aid, table_edge_div);

	// And update browser title.
	var mtitle = 'Untitled';
	var title_anns = ecore.get_annotations_by_key('title');
	if( title_anns && title_anns.length === 1 ){
	    mtitle = title_anns[0].value();
	    //alert(mtitle);
	}

	// Tag on modification mark.
	ll('modified-p: ' + ecore.modified_p());
	if( ecore.modified_p() === true ){
	    mtitle = '*' + mtitle + '*';
	}

	document.title = mtitle + ' (Noctua Editor)';
    }

    // WARNING: response-only as written.
    function _inconsistency_check(resp, man){
	ll('doing the inconsistent_p check: ' + ecore.inconsistent_p() );
	if( ecore.inconsistent_p() === true &&
	    ! jQuery(graph_container_div).hasClass('model-inconsistent') ){
	    // Recolor the interface.
	    jQuery(graph_container_div).addClass('model-inconsistent');
	}else if( ecore.inconsistent_p() !== true &&
		  jQuery(graph_container_div).hasClass('model-inconsistent') ){
	    // Restore the interface coloration.
	    jQuery(graph_container_div).removeClass('model-inconsistent');
	}
    }

    // See what the undo/redo listing looks like.
    function _trigger_undo_redo_lookup(){
	if( ! manager.user_token() ){ // only try if logged-in; priv op
	    ll('skip undo/redo lookup due to lack of standing');
	}else{
	    manager.get_model_undo_redo(ecore.get_id());
	}
    }

    // Build on new graph.
    function _fold_graph_appropriately(d_graph, d_view_type){
	// Undo whatever we've done before.
	d_graph.unfold();
	each([view_basic_elt, view_ev_fold_elt, view_go_fold_elt], function(elt){
	    jQuery(elt).css("font-weight","");
	});

	// Now do it again.
	if( d_view_type === 'basic' ){
	    // Nothing.
	    jQuery(view_basic_elt).css("font-weight","bold");
	}else if( d_view_type === 'ev_fold' ){
	    jQuery(view_ev_fold_elt).css("font-weight","bold");
	    d_graph.fold_evidence();
	}else if( d_view_type === 'go_fold' ){
	    jQuery(view_go_fold_elt).css("font-weight","bold");
	    d_graph.fold_go_noctua(global_collapsible_relations,
				   global_collapsible_reverse_relations);
	}else{
	    throw new Error('unknown graph editor view: ' + d_view_type);
	}	
    }

    // The core initial layout function.
    function _rebuild_model_and_display(model_data){

	// Wipe UI.
	each(ecore.get_nodes(), function(en, enid){
	    _delete_iae_from_ui(enid);
	});
	widgetry.wipe(graph_div); // rather severe

	// Wipe ecore and structures if not attempting to preserve
	// current data. Reasons to preserve could include switching
	// views.
	if( model_data ){
	    ll('REBUILD from scratch: ' + view_type);	
	    // each(ecore.get_nodes(), function(en, enid){
	    // 	_delete_iae_from_ecore(enid);
	    // });
	    // Nuke it from orbit--it's the only way to be sure.
	    ecore = new noctua_graph();

	    // Build with our incoming data.
	    ecore.load_data_basic(model_data);
	}else{
	    ll('REBUILD from current: ' + view_type);
	    // Rebuild using our current data.
	}

	// Make sure we're in the correct graph folding state.
	_fold_graph_appropriately(ecore, view_type);

	///
	/// We now have a well-defined edit core. Let's try and add
	/// some layout information if we can: edit core topology to
	/// graph.
	///

	// Extract/create a gross fallback layout, based on
	// Sugiyama. Find the initial layout position form the
	// layout. There might be some missing due to finding cycles
	// in the graph, so we have this two-step process.
	var r = new bbop_legacy.layout.sugiyama.render();
	var layout = r.layout(ecore);
	var fallback_position_store = new bbopx.noctua.location_store();
	each(layout['nodes'], function(litem, index){
	    var id = litem['id'];
	    var raw_x = litem['x'];
	    var raw_y = litem['y'];
	    var fin_x = _box_left(raw_x);
	    var fin_y = _box_top(raw_y);
	    fallback_position_store.add(id, fin_x, fin_y);
	    //ll('fallback: ' + id)
	});

	// Now got through all of the actual nodes.
	each(ecore.all_nodes(), function(en){
	    var enid = en.id();

	    // Try and see if we have coords; the precedence is:
	    // historical (drop), layout, make some up.
	    var fin_left = null;
	    var fin_top = null;
	    var local_coords = local_position_store.get(enid);
	    var fallback_coords = fallback_position_store.get(enid);
	    var model_left = _extract_node_position(en, 'x');
	    var model_top = _extract_node_position(en, 'y');
	    if( local_coords ){
		fin_left = local_coords['x'];
		fin_top = local_coords['y'];
		ll('take local for: '+ enid +': '+ fin_left +', '+ fin_top);
	    }else if( model_left !== null && model_top !== null ){
		fin_left = model_left;
		fin_top = model_top;
		ll('take minerva for: ' + enid +': '+ fin_left +', '+ fin_top);
	    }else if( fallback_coords ){
		fin_left = fallback_coords['x'];
		fin_top = fallback_coords['y'];
		ll('take fallback for: ' + enid +': '+ fin_left +', '+ fin_top);
	    }else{
		fin_left = _vari();
		fin_top = _vari();		 
		ll('take random for: ' + enid +': '+ fin_left +', '+ fin_top);
	    }
	    
	    // Update coordinates and report them to others.
	    local_position_store.add(enid, fin_left, fin_top);
	    if( barclient ){
		// Remember: telekinesis does t/l, not l/t (= x/y).
		barclient.telekinesis(enid, fin_top, fin_left);
	    }
	});	
	
	// For our intitialization/first drawing, suspend jsPlumb
	// stuff while we get a little work done rebuilding the UI.
	instance.doWhileSuspended(function(){
	    
	    // Initial render of nodes in the graph.
    	    each(ecore.get_nodes(), function(enode, enode_id){
		// Will have the most up-to-date location info.
		var left = null;
		var top = null;
		var local_coords = local_position_store.get(enode_id);
		if( local_coords ){
		    left = local_coords['x'];
		    top = local_coords['y'];
		}

    		widgetry.add_enode(fact_annotation_config, ecore, manager,
				   enode, aid, graph_div, left, top,
				   gserv, gconf);
    	    });

    	    // Now let's try to add all the edges/connections.
    	    each(ecore.all_edges(), function(eedge, eeid){
    		_connect_with_edge(eedge);
    	    });
		
	    // Edit annotations on double click.
	    _attach_node_dblclick_ann('.demo-window');

	    // Make nodes draggable.
	    _attach_node_draggable(".demo-window");
	    
	    // Make nodes able to use edit dialog.
	    _attach_node_click_edit('.open-dialog');
	    
    	    // Make normal nodes availables as edge targets.
	    _make_selector_target('.demo-window');
	    
	    // Make the konn class available as source from inside the
	    // real node class elements.
	    _make_selector_source('.demo-window', '.konn');
	    
    	});

	// As our final act, we will make some changes to the display
	// depending on the model annotations. Specifically, whether
	// or not this looks like a template.
	var template_p = false;
	var tanns = ecore.get_annotations_by_key('template');
	if( us.isArray(tanns) && tanns.length === 1 ){
	    var tann = tanns[0].value();
	    if( tann && tann === 'true' ){
		//document.title = 'TEMPLATE: ' + document.title;
		template_p = true;
	    }
	}
	// BUG/TODO: This all needs to be abstracted into the
	// widgetry.js in a more systematic way so that we can do
	// group controlling a little better in the UI.
	if( template_p ){
	    jQuery('.app-graph-container').css('margin-left', '0em');
	    jQuery('.app-controls').css('width', '0em');
	    //
	    jQuery('.open-dialog').css('width', '0');
	    jQuery('.konn').css('width', '0');
	    jQuery('.app-graph-container').css('background-color', '#e2e2e2');
	    jQuery('#template_announce_div').removeClass('hidden');	    
	}else{
	    jQuery('.app-graph-container').css('margin-left', '15em');
	    jQuery('.app-controls').css('width', '15em');
	    //
	    jQuery('.open-dialog').css('width', '1em');
	    jQuery('.konn').css('width', '1em');
	    jQuery('.app-graph-container').css('background-color', '#ffebcd');
	    jQuery('#template_announce_div').addClass('hidden');	    
	}

    }

    // This is a very important core function. It's purpose is to
    // update the local model and UI to be consistent with the current
    // state and the data input.
    //
    // Fundamentally, it adds/updates nodes, removes all edges
    // mentioned in the updated from the core/UI, and then readds the
    // edges with the new ones.
    function _merge_from_new_data(model_json){
	ll('in MERGE main');

	// Unfold the core data graph for operations with merge.
	ecore.unfold();

	// Create a new graph of incoming merge data.
	var merge_in_graph = new noctua_graph();
	merge_in_graph.load_data_basic(model_json);

	// Run the special "dumb" merge.
	// TODO: Replace later with an actual update.
	ecore.merge_special(merge_in_graph);

	// Farm it out to rebuild.
	_rebuild_model_and_display();

	///
	/// "[P]remature optimization is the root of all evil."
	/// -Donald Knuth
	///
	/// We'll come back to this if the merge ops are really
	/// slow. In fact, maybe only go the "optimized" merge path is
	/// the graph is structurally the same, but edge/node content
	/// has changed.
	///

	// // Take a snapshot of the current graph.
	// var ecore_snapshot = ecore.clone();

	// // We'll also need an easy lookup of the nodes coming in with
	// // the merge.
	// var updatable_nodes = {};

	// // Unfold the core data graph for operations with merge.
	// ecore.unfold();

	// // Create a new graph of incoming merge data.
	// var merge_in_graph = new noctua_graph();
	// merge_in_graph.load_data_basic(model_json);

	// // Suspend and restart for performance.
	// instance.doWhileSuspended(function(){

	//     // Next, look at individuals/nodes for addition or
	//     // updating.
	//     each(merge_in_graph.all_nodes(), function(ind){
	// 	// Update node. This is preferred since deleting it
	// 	// would mean that all the connections would have to
	// 	// be reconstructed as well.
	// 	var update_node = ecore.get_node(ind.id());
	// 	if( update_node ){
	// 	    ll('update node: ' + ind.id());
	// 	    updatable_nodes[ind.id()] = true;
		    
	// 	    // "Update" the edit node in core by clobbering
	// 	    // it.
	// 	    ecore.add_node(ind);
		    
	// 	    // Wipe node contents; redraw node contents.
	// 	    widgetry.update_enode(ecore, ind, aid);
	// 	}else{
	// 	    ll('add new node: ' + ind.id());
	// 	    updatable_nodes[ind.id()] = true;
		    
	// 	    // Initial node layout settings.
    	// 	    var dyn_x = _vari() +
	// 		jQuery(graph_container_div).scrollLeft();
    	// 	    var dyn_y = _vari() +
	// 		jQuery(graph_container_div).scrollTop();
	// 	    ind.x_init(dyn_x);
	// 	    ind.y_init(dyn_y);
		    
	// 	    // Add new node to edit core.
	// 	    ecore.add_node(ind);
		    
	// 	    // Update coordinates and report them.
	// 	    local_position_store.add(ind.id(), dyn_x, dyn_y);
	// 	    if( barclient ){
	// 		barclient.telekinesis(ind.id(), dyn_x, dyn_y);
	// 	    }

	// 	    // Draw it to screen.
	// 	    widgetry.add_enode(ecore, ind, aid, graph_div);
	// 	}	    
	//     });
	    
	//     // Now look at edges (by individual) for purging (and
	//     // reinstating later)--no going to try and update edges,
	//     // just remove/clobber.
	//     each(merge_in_graph.all_nodes(), function(source_node){
		
	// 	//ll('looking at node: ' + source_node.types()[0].to_string());

	// 	// WARNING: We cannot (apparently?) go from connection
	// 	// ID to connection easily, so removing from UI is a
	// 	// separate step.
	// 	//
	// 	// Look up what edges it has in /core/, as they will
	// 	// be the ones to update.
	// 	var snid = source_node.id();
	// 	var src_edges = ecore.get_edges_by_subject(snid);
		
	// 	// Delete all edges for said node in model if both the
	// 	// source and the target appear in the updatable list.
	// 	var connection_ids = {};
	// 	each(src_edges, function(src_edge){
	// 	    if( updatable_nodes(src_edge.subject_id()) &&
	// 		updatable_nodes(src_edge.object_id()) ){

	// 		// Save the connection id for later.
	// 		var eid = src_edge.id();
	// 		var cid = ecore.get_connector_id_by_edge_id(eid);
	// 		connection_ids[cid] = true;

	// 		// Remove the edge from reality.
	// 		ecore.remove_edge(src_edge.id());
	// 	    }else{
	// 		// unrelated edge outside of the complete
	// 		// merge subgraph
	// 	    }
	// 	});
		
	// 	// Now delete all connector/edges for the node in the
	// 	// UI.
	// 	var snid_elt = ecore.get_node_elt_id(snid);
	// 	var src_conns = instance.getConnections({'source': snid_elt});
	// 	each(src_conns, function(src_conn){
	// 	    // Similar to the above, we only want to remove UI
	// 	    // edges that are contained within the individuals
	// 	    // in the subgraph.
	// 	    if( connection_ids(src_conn) ){
	// 		instance.detach(src_conn);
	// 	    }else{
	// 		// This UI edge should be preserved.
	// 	    }
	// 	});
	//     });

	//     // Blitz our old annotations as all new will be incoming
	//     // (and the merge just takes the superset)
	//     ecore.annotations([]);
	//     // Now that the UI is without any possible conflicting items
	//     // (i.e. edges) have been purged from out core model, merge
	//     // the new graph into the core one.
	//     ecore.merge_in(merge_in_graph);

	//     // Re-apply folding to graph.
	//     _fold_graph_appropriately(ecore, view_type);

	//     ///
	//     /// Remove any standalone nodes from the /display/ that
	//     /// may remain after a fold-in; all edges should have been
	//     /// removed previously.
	//     ///

	//     each(ecore_snapshot.all_nodes(), function(snap_node){
	//     	var snid = snap_node.id();
	//     	if( ! ecore.get_node(snid) ){
	//     	    //gone_nodes.push(snid);
	//     	    ll("eliminating: " + snid)
	//     	    _delete_iae_from_ui(snid);
	//     	}
	//     });

	//     ///
	//     /// Refresh any node created or updated in the jsPlumb
	//     /// physical view.
	//     ///
	    
	//     // We previously updated/added nodes, so here just make
	//     // sure it's/they're active.
	//     each(merge_in_graph.all_nodes(), function(dn){
	// 	var dnid = dn.id();

	// 	// Only update nodes that are still "visible" after
	// 	// the folding.
	// 	if( ecore.get_node(dnid) ){
	// 	    var ddid = '#' + ecore.get_node_elt_id(dnid);
	// 	    _attach_node_draggable(ddid);
	// 	    // //_make_selector_target(ddid);
	// 	    // //_make_selector_source(ddid, '.konn');
	// 	    // _attach_node_click_edit(ddid);
	// 	    // _make_selector_target(ddid);
	// 	    // _make_selector_source(ddid, '.konn');
	// 	}
	//     });
	//     // And the reest of the general ops.
	//     _attach_node_dblclick_ann('.demo-window');
	//     // // _attach_node_draggable('.demo-window');
	//     _attach_node_click_edit(".open-dialog");
	//     _make_selector_target('.demo-window');
	//     _make_selector_source('.demo-window', '.konn');
    	//     jsPlumb.repaintEverything();

	//     // Now that the updated edges are in the model, reinstantiate
	//     // them in the UI.
	//     each(merge_in_graph.all_edges(), function(edg){
	//     	//ll('(re)create/add the edge in UI: ' + edg.relation());
	//     	_connect_with_edge(edg);
	//     });
	// }); // close out updating region
    }
    
    ///
    /// Manager registration and ordering.
    ///
    
    // Only run major internal functions when the filters are passed.
    var seen_packets = {};
    //function _continue_update_p(resp, man, run_fun){
    function _continue_update_p(resp, man){
	
	var ret = false;

	var this_packet = resp.packet_id();
	if( this_packet ){
	    if( seen_packets[this_packet] ){
		// Skip this update.
		ll('skip seen packet: ' + this_packet);
	    }else{
		// Add packet and continue.
		seen_packets[this_packet] = true;

		// Only run things that are intended actions.
		var r_int = resp.intention();
		ll('new packet: ' + this_packet + ', intent: ' + r_int);
		if( r_int === 'action' ){

		    // Only run things that require modification.
		    var r_sig = resp.signal();
		    if( r_sig === 'merge' || r_sig === 'rebuild' ){

			ret = true;

			// Currently, since running from all users, unecessary.
			// // Need to extract our own ID from the manager.
			// var my_uid = man.user_token();
			// // Let's do some checking.
			// var r_uid = resp.user_id();
			// ll(['uid: ', r_uid, ', sig: ',
			//     r_sig, ', int: ' ,r_int].join(''));
			// // BUG/TODO: This will always be wrong since
			// // we cannot compare tokens to ids.
			// if( r_uid === my_uid ){
			//     // Always run things I requested.
			//     ll('TODO: running own request');
			//     //run_fun(resp, man);
			// }else if( r_int !== 'query' ){
			//     // Run other people's requests as long as
			//     // they are not
			//     // queries.
			//     ll("TODO: running other's non-query request");
			//     //run_fun(resp, man);
			// }else{
			//     // Otherwise, ignore it.
			//     ll("ignoring other's query request");
			// }
			
		    }
		}
	    }
	}
	return ret;
    }

    // Internal registrations.
    var postruns = 0;
    ll('add internal callback registrations');
    manager.register('prerun', _shields_up);
    manager.register('postrun', function(a, b){ // DEBUGGING
	postruns++;
	ll('in postrun #' + postruns + '');
    }, 11);
    manager.register('postrun', _inconsistency_check, 10);
    manager.register('postrun', _refresh_tables, 9);
    manager.register('postrun', _shields_down, 8);
    manager.register('postrun', function(resp, man){ // experimental	
	
	// TODO: Still need this?
	// Sends message on minerva manager action completion.
	if( barclient ){
	    barclient.message({'message_type': resp.message_type(),
	    		       'message': resp.message(),
	    		       'intention': resp.intention(),
	    		       'signal': resp.signal()
	    		      });
	}

    }, 7);
    manager.register('manager_error', function(resp, man){
	alert('There was a manager error (' +
	      resp.message_type() + '): ' + resp.message());
    }, 10);
    
    manager.register('warning', function(resp, man){
	var comment = resp.commentary() || null;
	alert('Warning: ' + resp.message() + '; ' +
	      'your operation was likely not performed.\n' + comment);
    }, 10);
    
    manager.register('error', function(resp, man){

	var perm_flag = "InsufficientPermissionsException";
	var token_flag = "token";
	if( resp.message() && resp.message().indexOf(perm_flag) !== -1 ){
	    alert('Error: it seems like you do not have permission to ' +
		  'perform that operation. Did you remember to login?');
	}else if( resp.message() && resp.message().indexOf(token_flag) !== -1 ){
	    alert("Error: it seems like you have a bad token...");
	}else{
	    var comment = resp.commentary() || null;
	    alert('Error (' + resp.message_type() +'): '+ resp.message() +'; '+
		  'your operation was likely not performed.\n' + comment);
	}
    }, 10);
    
    // Remote action registrations.
    manager.register('meta', function(resp, man){
    	//alert('Meta operation successful: ' + resp.message());

	///
	/// Handle undo/redo.
	///

	//
	jQuery(undo_btn_elt).parent().addClass('disabled');
	jQuery(undo_btn_elt).unbind('click');
	if( resp.has_undo_p() ){
	    //ll('has UNDO');
	    jQuery(undo_btn_elt).parent().removeClass('disabled');
	    jQuery(undo_btn_elt).click(function(){
		manager.perform_undo(ecore.get_id());
	    });
	}
	//
	jQuery(redo_btn_elt).parent().addClass('disabled');
	jQuery(redo_btn_elt).unbind('click');
	if( resp.has_redo_p() ){
	    //ll('has REDO');
	    jQuery(redo_btn_elt).parent().removeClass('disabled');
	    jQuery(redo_btn_elt).click(function(){
		manager.perform_redo(ecore.get_id());
	    });
	}
    }, 10);

    manager.register('rebuild', function(resp, man){
	if( _continue_update_p(resp, man) ){
	    ll('rebuild display (manager/rebuild)');
	    model_json = resp.data();
	    _rebuild_model_and_display(model_json);

	    // Update locations according to Barista after rebuild
	    // event.
	    if( barclient ){
		ll('get layout (manager/rebuild)');
		barclient.get_layout();
	    }

	    // Update undo/redo info.
	    ll('start get-undo-redo (manager/rebuild)');
	    _trigger_undo_redo_lookup();
	}
    }, 10);

    manager.register('merge', function(resp, man){
	if( _continue_update_p(resp, man) ){
	
	    var individuals = resp.individuals();
	    if( ! individuals ){
		alert('no data/individuals in merge--unable to do');
	    }else{
		ll('merge display (manager/rebuild)');
		_merge_from_new_data(resp.data());
	    }

	    // Update locations according to Barista after merge
	    // event.
	    if( barclient ){
		ll('get layout (manager/merge)');
		barclient.get_layout();
	    }

	    // Update undo/redo info.
	    ll('start get-undo-redo (manager/merge)');
	    _trigger_undo_redo_lookup();
	}
    }, 10);

    ///
    /// UI event registration.
    ///    

    // TODO/BUG: Read on.
    // Connection event.
    instance.bind("connection", function(info, original_evt) {
	
	// If it looks like a new drag-and-drop event
	// connection.
	if( ! original_evt ){
	    ll('knock-on "connection": ignoring.');
	}else{
	    ll('direct "connection" event.');
	    
	    // Get the necessary info from the
	    // connection.
	    var sn = info.sourceId;
	    var tn = info.targetId;
	    
	    // TODO/BUG: Destroy the autogen one (I
	    // can't make them behave as well as the
	    // programmatic ones--need to understand:
	    // http://jsplumbtoolkit.com/doc/connections).
	    // then create the programmatic one.
	    // This connection is no longer needed.
	    instance.detach(info.connection);
	    
	    // Create a new edge based on this info.
	    var snode = ecore.get_node_by_elt_id(sn);
	    var tnode = ecore.get_node_by_elt_id(tn);
	    
	    // Pop up the modal.
	    var init_edge = widgetry.add_edge_modal(ecore, manager,
						    in_relations, aid,
						    snode.id(), tnode.id());
	    init_edge.show();
	}
    });
    
    // Detach event.
    instance.bind("connectionDetached", function(info, original_evt) {
	
	// Only to this for direct detachments, not
	// knock-on effects from things like merge.
	if( ! original_evt ){
	    ll('knock-on "connectionDetached": ignoring.');
	}else{
	    ll('direct "connectionDetach" event.');
	    
	    var cid = info.connection.id;
	    ll('there was a connection detached: ' + cid);
	    var eeid = ecore.get_edge_id_by_connector_id(cid);
	    ll('looks like edge: ' + eeid);
	    
	    var edge = ecore.get_edge_by_id(eeid);
	    manager.remove_fact(ecore.get_id(), edge.source(),
				edge.target(), edge.relation());
	}
    });
    
    // TODO: 
    // Would like this, since otherwise I'll have to deal with
    // decoding what is happening and possibly a race condition.
    // https://github.com/sporritt/jsPlumb/issues/157
    instance.bind("connectionMoved", function(info, original_evt) {
    	var cid = info.connection.id;
    	//ll('there was a connection moved: ' + cid);
    	alert('there was a "connectionMoved" event: ' + cid);
    });
    
    // Reapaint with we scroll the graph.
    jQuery(graph_div).scroll(function(){
        jsPlumb.repaintEverything();
    });

    ///
    /// Helpers for running the addition templates.
    ///
    
    function _add_composite(base_cls, additions){
	
	var reqs = new minerva_requests.request_set(manager.user_token(),
						    ecore.get_id());
	var new_base = reqs.add_individual(base_cls);
	
	// 
	each(additions, function(pair){
	    var cls_init = pair[0];
	    var rel = pair[1];
	    if( cls_init && rel ){
		var new_add = reqs.add_individual(cls_init);
		reqs.add_fact([new_base, new_add, rel]);
	    }
	});
	
	return reqs;
    }	    
    
    // The base settings for bioentity autocomplete.
    var base_enb_auto_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
	'additional_results_class': 'bbop-mme-more-results-ul'
    };

    ///
    /// Activate addition template for annoton.
    ///

    // The base settings for bioentity autocomplete.
    var base_annoton_auto_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class}}',
	'additional_results_class': 'bbop-mme-more-results-ul'
    };

    // Storage for the actual selected identifiers.
    var annoton_eb_auto_val = null;
    var annoton_mf_auto_val = null;
    var annoton_bp_auto_val = null;
    var annoton_cc_auto_val = null;

    // bioentity
    var annoton_eb_auto_args = us.clone(base_annoton_auto_args);
    // annoton_eb_auto_args['list_select_callback'] =
    // 	function(doc){
    // 	    annoton_eb_auto_val = doc['annotation_class'] || null;
    // 	};

    // biological process
    var annoton_bp_auto_args = us.clone(base_annoton_auto_args);
    // annoton_bp_auto_args['list_select_callback'] =
    // 	function(doc){
    // 	    annoton_bp_auto_val = doc['annotation_class'] || null;
    // 	};
    
    // molecular function
    var annoton_mf_auto_args = us.clone(base_annoton_auto_args);
    // annoton_mf_auto_args['list_select_callback'] =
    // 	function(doc){
    // 	    annoton_mf_auto_val = doc['annotation_class'] || null;
    // 	};
    
    // cellular component
    var annoton_cc_auto_args = us.clone(base_annoton_auto_args);
    // annoton_bp_auto_args['list_select_callback'] =
    // 	function(doc){
    // 	    annoton_bp_auto_val = doc['annotation_class'] || null;
    // 	};
    
    // Remember that we're using NEO for this now.
    var annoton_eb_auto =
	new bbop_legacy.widget.search_box(gserv_neo, gconf,
					  'annoton_eb_auto',
					  annoton_eb_auto_args);
    annoton_eb_auto.lite(true);
    annoton_eb_auto.add_query_filter('document_category', 'ontology_class');
    // Root is CHEBI:23367 ! molecular entity.
    annoton_eb_auto.add_query_filter('regulates_closure', 'CHEBI:23367', ['*']);
    annoton_eb_auto.set_personality('ontology');

    var annoton_mf_auto =
	new bbop_legacy.widget.search_box(gserv_neo, gconf,
					  'annoton_mf_auto',
					  annoton_mf_auto_args);
    annoton_mf_auto.lite(true);
    annoton_mf_auto.add_query_filter('document_category', 'ontology_class');
    annoton_mf_auto.add_query_filter('regulates_closure_label',
				     'molecular_function', ['*']);
    annoton_mf_auto.set_personality('ontology');

    var annoton_bp_auto =
	new bbop_legacy.widget.search_box(gserv_neo, gconf,
					  'annoton_bp_auto',
					  annoton_bp_auto_args);
    annoton_bp_auto.lite(true);
    annoton_bp_auto.add_query_filter('document_category', 'ontology_class');
    annoton_bp_auto.add_query_filter('regulates_closure_label',
				     'biological_process', ['*']);
    annoton_bp_auto.set_personality('ontology');

    var annoton_cc_auto =
	new bbop_legacy.widget.search_box(gserv_neo, gconf,
					  'annoton_cc_auto',
					  annoton_cc_auto_args);
    annoton_cc_auto.lite(true);
    annoton_cc_auto.add_query_filter('document_category', 'ontology_class');
    annoton_cc_auto.add_query_filter('regulates_closure_label',
				     'cellular_component', ['*']);
    annoton_cc_auto.set_personality('ontology');

    // Add new remote node button.
    jQuery('#' + 'annoton_adder_button').click(
    	function(){
    	    var eb = jQuery('#' + 'annoton_eb_auto').val() || '';
    	    var mf = jQuery('#' + 'annoton_mf_auto').val() || 'GO:0003674';
    	    var bp = jQuery('#' + 'annoton_bp_auto').val() || 'GO:0008150';
    	    var cc = jQuery('#' + 'annoton_cc_auto').val() || 'GO:0005575';

    	    if( eb === '' ){
    		alert('You must at least select a bioentity.');
    	    }else{
		
		// Ready new super request.
		var reqs = new minerva_requests.request_set(manager.user_token(),
							    ecore.get_id());

		var ind_eb = reqs.add_individual(eb);
		var ind_mf = reqs.add_individual(mf);
		var ind_bp = reqs.add_individual(bp);
		var ind_cc = reqs.add_individual(cc);
		reqs.add_fact([ind_mf, ind_eb, 'RO:0002333']);
		reqs.add_fact([ind_mf, ind_bp, 'BFO:0000050']);
		reqs.add_fact([ind_mf, ind_cc, 'BFO:0000066']);
		manager.request_with(reqs);

		// Finally, wipe controls' state, internal and external.
		annoton_eb_auto_val = null;
		annoton_mf_auto_val = null;
		annoton_bp_auto_val = null;
		annoton_cc_auto_val = null;
		jQuery('#' + 'annoton_eb_auto').val('');
		jQuery('#' + 'annoton_mf_auto').val('');
		jQuery('#' + 'annoton_bp_auto').val('');
		jQuery('#' + 'annoton_cc_auto').val('');
    	    }
    	}
    );

    ///
    /// Activate addition template for BP (free).
    ///

    // Storage for the actual selected identifiers.
    //var simple_bp_free_enb_auto_val = null;
    var simple_bp_free_act_auto_val = null;
    var simple_bp_free_occ_auto_val = null;

    // // bioentity
    // var simple_bp_free_enb_auto_args = us.clone(base_enb_auto_args);
    // simple_bp_free_enb_auto_args['list_select_callback'] =
    // 	function(doc){
    // 	    //alert('adding: ' + doc['bioentity_label']);
    // 	    simple_bp_free_enb_auto_val = doc['annotation_class'] || null;
    // 	};

    // molecular function
    var simple_bp_free_act_auto_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
	'additional_results_class': 'bbop-mme-more-results-ul',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
	    simple_bp_free_act_auto_val = doc['annotation_class'] || null;
    	}
    };
    // location/occurs_in
    var simple_bp_free_occ_auto_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
	'additional_results_class': 'bbop-mme-more-results-ul',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
	    simple_bp_free_occ_auto_val = doc['annotation_class'] || null;
    	}
    };

    // var simple_bp_free_enb_auto =
    // 	    new bbop_legacy.widget.search_box(gserv_neo, gconf,
    // 					      simple_bp_free_enb_auto_id,
    // 					      simple_bp_free_enb_auto_args);
    // simple_bp_free_enb_auto.lite(true);
    // simple_bp_free_enb_auto.add_query_filter('document_category',
    // 					     'ontology_class');
    // // Root is CHEBI:23367 ! molecular entity.
    // simple_bp_free_enb_auto.add_query_filter('regulates_closure',
    // 					     'CHEBI:23367', ['*']);
    // simple_bp_free_enb_auto.set_personality('ontology');

    var simple_bp_free_act_auto =
	new bbop_legacy.widget.search_box(gserv, gconf,
					  simple_bp_free_act_auto_id,
					  simple_bp_free_act_auto_args);
    simple_bp_free_act_auto.lite(true);
    simple_bp_free_act_auto.add_query_filter('document_category',
					     'ontology_class');
    simple_bp_free_act_auto.add_query_filter('regulates_closure_label',
    					     'biological_process');
    simple_bp_free_act_auto.set_personality('ontology');

    var simple_bp_free_occ_auto =
	    new bbop_legacy.widget.search_box(gserv, gconf, 
					      simple_bp_free_occ_auto_id,
					      simple_bp_free_occ_auto_args);
    simple_bp_free_occ_auto.lite(true);
    simple_bp_free_occ_auto.add_query_filter('document_category',
					     'ontology_class');
    simple_bp_free_occ_auto.add_query_filter('source',
					     'molecular_function', ['-']);
    simple_bp_free_occ_auto.add_query_filter('source',
					     'biological_process', ['-']);
    simple_bp_free_occ_auto.set_personality('ontology');

    // Add new remote node button.
    jQuery(simple_bp_free_add_btn_elt).click(
    	function(){
    	    //var enb = simple_bp_free_enb_auto_val || '';
    	    var act = simple_bp_free_act_auto_val || '';
    	    var occ = simple_bp_free_occ_auto_val || '';

    	    if( act === '' ){
    		alert('Must select activity field from autocomplete list.');
    	    }else{
		// Wipe controls' state, internal and external.
		//simple_bp_free_enb_auto_val = null;
    		simple_bp_free_act_auto_val = null;
    		simple_bp_free_occ_auto_val = null;
		//jQuery(simple_bp_free_enb_auto_elt).val('');
    		jQuery(simple_bp_free_act_auto_elt).val('');
    		jQuery(simple_bp_free_occ_auto_elt).val('');
		
		// Send message to server.
		// var reqs = _add_composite(act, [[enb, 'RO:0002333'],
		// 				[occ, 'BFO:0000066']]);
		var reqs = _add_composite(act, [[occ, 'BFO:0000066']]);
		manager.request_with(reqs);
    	    }
    	}
    );

    ///
    /// Activate addition template for Ubernoodle (free).
    ///

    var simple_ubernoodle_auto_val = null;

    // Add general autocomplete to the input.
    var simple_ubernoodle_auto_args = {
    	'label_template':'{{entity_label}} ({{entity}})',
    	'value_template': '{{entity_label}}',
    	'list_select_callback': function(doc){
	    simple_ubernoodle_auto_val = doc['entity'] || null;
	}
    };
    var simple_ubernoodle_auto = new bbop_legacy.widget.search_box(
	gserv_neo, gconf, simple_ubernoodle_auto_id,
	simple_ubernoodle_auto_args);
    simple_ubernoodle_auto.lite(true);
    simple_ubernoodle_auto.add_query_filter('document_category', 'general');
    simple_ubernoodle_auto.set_personality('general');

    // Add new remote node button.
    jQuery(simple_ubernoodle_add_btn_elt).click(function(){
	
    	if( ! simple_ubernoodle_auto_val || simple_ubernoodle_auto_val === '' ){
    	    alert('Must select something from autocomplete list.');
    	}else{

	    // Send message to server.
	    var reqs = new minerva_requests.request_set(manager.user_token(),
							ecore.get_id());
	    reqs.add_individual(simple_ubernoodle_auto_val);
	    manager.request_with(reqs);

	    // Wipe controls' state, internal and external.
	    simple_ubernoodle_auto_val = null;
	    jQuery(simple_ubernoodle_auto_elt).val('');	    
    	}
    });

    ///
    /// Activate addition template for MF (free form).
    ///

    // Storage for the actual selected identifiers.
    var simple_mf_free_enb_auto_val = null;
    var simple_mf_free_act_auto_val = null;
    var simple_mf_free_occ_auto_val = null;

    // bioentity
    var simple_mf_free_enb_auto_args = us.clone(base_enb_auto_args);
    simple_mf_free_enb_auto_args['list_select_callback'] =
    	function(doc){
    	    //alert('adding: ' + doc['bioentity_label']);
	    simple_mf_free_enb_auto_val = doc['annotation_class'] || null;
    };

    // molecular function
    var simple_mf_free_act_auto_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
	'additional_results_class': 'bbop-mme-more-results-ul',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
	    simple_mf_free_act_auto_val = doc['annotation_class'] || null;
    	}
    };
    // location/occurs_in
    var simple_mf_free_occ_auto_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
	'additional_results_class': 'bbop-mme-more-results-ul',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
	    simple_mf_free_occ_auto_val = doc['annotation_class'] || null;
    	}
    };

    var simple_mf_free_enb_auto =
	new bbop_legacy.widget.search_box(gserv_neo, gconf,
					  simple_mf_free_enb_auto_id,
					  simple_mf_free_enb_auto_args);
    simple_mf_free_enb_auto.lite(true);
    simple_mf_free_enb_auto.add_query_filter('document_category',
					     'ontology_class');
    // Root is CHEBI:23367 ! molecular entity.
    simple_mf_free_enb_auto.add_query_filter('regulates_closure',
    					     'CHEBI:23367', ['*']);
    simple_mf_free_enb_auto.set_personality('ontology');

    var simple_mf_free_act_auto =
	new bbop_legacy.widget.search_box(gserv, gconf,
					  simple_mf_free_act_auto_id,
					  simple_mf_free_act_auto_args);
    simple_mf_free_act_auto.lite(true);
    simple_mf_free_act_auto.add_query_filter('document_category',
					     'ontology_class');
    simple_mf_free_act_auto.add_query_filter('regulates_closure_label',
    					     'molecular_function');
    simple_mf_free_act_auto.set_personality('ontology');
    
    var simple_mf_free_occ_auto =
	new bbop_legacy.widget.search_box(gserv, gconf,
					  simple_mf_free_occ_auto_id,
					  simple_mf_free_occ_auto_args);
    simple_mf_free_occ_auto.lite(true);
    simple_mf_free_occ_auto.add_query_filter('document_category',
					     'ontology_class');
    simple_mf_free_occ_auto.add_query_filter('source',
					     'molecular_function', ['-']);
    simple_mf_free_occ_auto.add_query_filter('source',
					     'biological_process', ['-']);
    simple_mf_free_occ_auto.set_personality('ontology');

    // Add new remote node button.
    jQuery(simple_mf_free_add_btn_elt).click(function(){
    	var enb = simple_mf_free_enb_auto_val || '';
    	var act = simple_mf_free_act_auto_val || '';
    	var occ = simple_mf_free_occ_auto_val || '';
	
    	if( act === '' ){
    	    alert('Must select activity field from autocomplete list.');
    	}else{
	    // Wipe controls' state, internal and external.
	    simple_mf_free_enb_auto_val = null;
    	    simple_mf_free_act_auto_val = null;
    	    simple_mf_free_occ_auto_val = null;
	    jQuery(simple_mf_free_enb_auto_elt).val('');
    	    jQuery(simple_mf_free_act_auto_elt).val('');
    	    jQuery(simple_mf_free_occ_auto_elt).val('');
	    
	    // Send message to server.
	    var reqs = _add_composite(act, [[enb, 'RO:0002333'],
					    [occ, 'BFO:0000066']]);
	    manager.request_with(reqs);
    	}
    });

    ///
    /// Other button activities.
    ///

    // Zoom buttons.
    jQuery(zin_btn_elt).click(function(){
    	var nz = instance.getZoom() + 0.25;
    	_set_zoom(nz);
    });
    jQuery(zret_btn_elt).click(function(){
    	_set_zoom(1.0);
    });
    jQuery(zout_btn_elt).click(function(){
    	var nz = instance.getZoom() - 0.25;
    	_set_zoom(nz);
    });
    
    // Refresh button.
    // Trigger a model get and an inconsistent redraw.
    jQuery(refresh_btn_elt).click(function(){
	ll('starting refresh of model: ' + ecore.get_id());
	manager.get_model(ecore.get_id());
    });

    // // Export button.
    // jQuery(export_btn_elt).click(
    // 	function(){
    // 	    // Change the form to add the id.
    // 	    jQuery(action_form_data_elt).val(ecore.get_id());
    // 	    // Run it off in a new tab.
    // 	    jQuery(action_form_elt).submit();
    // 	});

    // Save button.
    jQuery(save_btn_elt).click(function(){

	// Start a new request.
	var reqs = new minerva_requests.request_set(manager.user_token(),
						    ecore.get_id());

	// Update all of the nodes with their current local (should be
	// most recent) positions before saving.
	each(ecore.all_nodes(), function(node){
	    var nid = node.id();

	    // Extract the current local coord.
	    var pos = local_position_store.get(nid);
	    var new_x = pos['x'];
	    var new_y = pos['y'];

	    // See if there are "hint-layout-* annotations and see if
	    // they need updating.
	    var old_x = _extract_node_position(node, 'x');
	    var old_y = _extract_node_position(node, 'y');
	    // If not defined or not up-to-date, remove the old
	    // annotations and add the new ones.
	    if( (old_x === null || old_y === null) ||
		(new_x !== old_x || new_y !== old_y) ){

		reqs.update_annotations(node, 'hint-layout-x', new_x);
		reqs.update_annotations(node, 'hint-layout-y', new_y);
	    }
	});

	// And add the actual storage.
	reqs.store_model();
	manager.request_with(reqs);
    });

    // // Help button.
    // jQuery(help_btn_elt).click(
    // 	function(){
    // 	    alert('In alphas, nobody can hear you scream.');
    // 	});

    ///
    /// Load the incoming graph into something useable for population
    /// of the editor.
    ///

    // // First assignment, of incoming argument graph.
    // model_json = in_model;

    // Since we're doing this "manually", apply the prerun and postrun
    // "manually".
    _shields_up();
    _rebuild_model_and_display(model_json);
    ll('refresh tables (startup)');
    _refresh_tables();
    // Get initial information.
    // TODO: This will be unnecessary in future versions where the 
    // model was pulled live (standard rebuild).
    ll('start get-undo-redo (startup)');
    _trigger_undo_redo_lookup();
    _shields_down();

    ///
    /// Optional: experiment with the messaging server.
    ///

    // Allow the message board to be cleared.
    // Also, just as the socket.io implementation, this cannot do an
    // awful lot--it's just a report that the TCP connection was
    // established.
    function _on_connect(nothingness){
	reporter.reset();
	nothingness['message_type'] = 'success';
	nothingness['message'] = 'you are connected';
	reporter.comment(nothingness);
    }

    // ...
    function _on_initialization(data){
	//var uid = data['user_id'];
	//var ucolor = data['user_color'];
	var sockid = data['socket_id'];

	ll('we are on socket: ' + sockid);

	// Add to the top of the message list.
	data['message_type'] = 'success';
	data['message'] = 'on socket: '+ sockid;
	reporter.comment(data);

	// // Change our user id.
	// manager.user_token(uid);
	// 
	// TODO: Actually, this call could be used to paint or display with
	// our user info beyond the token.
    }

    // Catch both the regular back-and-forth, as well as the 
    function _on_message_update(data){
	//function _on_message_update(data, uid, ucolor){

	var id = 'cursor_for_' + data['token'];
	var color = data['user_color'];
	var top = data['top'];
	var left = data['left'];

	// Add to the top of the message list.
	reporter.comment(data);
	
	// Visible alert when new information comes in.
	// Skip hightlighting if we're already over it.
	//alert('someone did something');
	var cls = 'bbop-mme-new-info';
	if( jQuery(message_area_tab_elt).parent().hasClass('active') ){
	    // Do not change.
	}else{
	    // Highlight.
	    jQuery(message_area_tab_elt).addClass(cls);
	    // Clear when clicked on.
	    jQuery(message_area_tab_elt).unbind('click');
	    jQuery(message_area_tab_elt).click(function(){
		jQuery(message_area_tab_elt).removeClass(cls);
	    });
	}
    }
    
    function _on_clairvoyance_update(data){
	//function _on_clairvoyance_update(id, color, top, left){

	var id = 'cursor_for_' + data['token'];
	var color = data['user_color'];
	var top = data['top'];
	var left = data['left'];

	// Ensure there is a div for the user.
	var jelt = '#' + id;
	if( ! jQuery(jelt).length ) {
	    jQuery('body').append('<div id="' +
				  id + '" class="bbop-mme-cursor" alt="user: ' +
				  id + '" title="user: ' +
				  id + '"></div>');
	    jQuery(jelt).css('border', 'solid 3px ' + color);
	}

	// Update to the most recent location data, but trying to
	// bound it within our window (doing otherwise causes the
	// document bounds to stretch in strange ways).
	var wX = jQuery(window).width();
	var wY = jQuery(window).height();
	var scroll_left = jQuery(graph_container_div).scrollLeft();
	var scroll_top = jQuery(graph_container_div).scrollTop();
	var cursor_spacer = 5;
	var cursor_buffer = 2 * cursor_spacer;
	if( top > (wY - cursor_buffer) ){ top = wY - cursor_buffer; }
	if( left > (wX - cursor_buffer) ){ left = wX - cursor_buffer; }
	if( top < cursor_spacer ){ top = cursor_spacer; }
	if( left < cursor_spacer ){ left = cursor_spacer; }
	jQuery(jelt).css('top', top - scroll_top);
	jQuery(jelt).css('left', left - scroll_left);
    }

    // Update locations for all items in the "objects" list.
    function _on_telekinesis_update(data){

	if( data && data['objects'] ){
	    var objects = data['objects'];
	    each(objects, function(obj){

		var iid = obj['item_id'];
		var top = obj['top'];
		var left = obj['left'];	

		//var en = ecore.get_node(iid);
		var enelt = ecore.get_node_elt_id(iid);
		if( enelt ){
		    //ll('tele callback: '+ iid +': '+ top +', '+ left);

		    // Stick into the local store.
		    local_position_store.add(iid, left, top);

		    // Update position.
		    jQuery('#' + enelt).css('top', top + 'px');
		    jQuery('#' + enelt).css('left', left + 'px');

		    // TODO: Still seems a bit slow. Tried throwing events as
		    // well, but didn't work. This is certainly the "right"
		    // way to do it...
    		    //instance.repaintEverything();	
		    instance.repaint(enelt);
		}
	    });
	}
    }

    // Serious translation into the minerva manager system.
    function _on_model_update(data){
	ll('try to update model from message');

	var mid = data['model_id'];
	var dresp = data['data'];
	var bar_resp = new barista_response(dresp);
	
	// // First, make sure we haven't seen this message before.
	// if( _continue_update_p(bar_resp, manager) ){
	
	// We can make some assumptions for now that since it came out
	// of Barista that it is good and clean.
	if( bar_resp.intention() !== 'action' ){
	    // Skip.
	    ll('MSG: skipping message resp w/intent: ' + bar_resp.intention());
	}else{
	    // TODO/BUG: Might be easier if we had a wrapping of
	    // _on_nominal_success() with with pre-/post-run within
	    // the manager itself.
	    if( bar_resp.signal() === 'merge' ){
		ll('MSG: try to update model from message as merge');
		manager.apply_callbacks('prerun', [manager]);
		manager.apply_callbacks('merge', [bar_resp, manager]);
		manager.apply_callbacks('postrun', [bar_resp, manager]);
	    }else if( bar_resp.signal() === 'rebuild' ){
		ll('MSG: try to update model from message as rebuild');
		manager.apply_callbacks('prerun', [manager]);
		manager.apply_callbacks('rebuild', [bar_resp, manager]);
		manager.apply_callbacks('postrun', [bar_resp, manager]);
	    }else{
		// Skip.
		ll('MSG: skipping message resp w/sig: ' + bar_resp.signal());
	    }
	}
	// }
    }

    // Jimmy into telekinesis format and trigger
    // _on_telekinesis_update().
    function _on_layout_response(data){
	
	//ll('_on_layout_response:', data);
	if( data && data['response'] ){
	    
	    // Prep layout info.
	    var tk_items = {'objects':[]};
	    each(data['response'], function(tnl, iid){
		tk_items['objects'].push({
		    'item_id': iid,
		    'top': tnl['top'],
		    'left': tnl['left']
		});
	    });
	    
	    //
	    //ll('tk_items:', tk_items);
	    _on_telekinesis_update(tk_items);
	}
    }

    if( typeof(global_barista_location) === 'undefined'  ){
	alert('no setup for messaging--not gunna happen');
    }else{
	// Setup the messaging client to listen to the common events
	// (telekinesis, clairvoyance) and the interesting one (merge,
	// rebuild) that will get translated into the minerva manager
	// calls.
	// NOTE/WARNING/TODO: that these are part of the old bbopx-js
	// lib and use the old registry.
	ll('try setup for messaging at: ' + global_barista_location);
	barclient = new bbopx.barista.client(global_barista_location, in_token);
	barclient.register('connect', 'a', _on_connect);
	barclient.register('initialization', 'b', _on_initialization);
	barclient.register('message', 'c', _on_message_update);
	barclient.register('clairvoyance', 'd', _on_clairvoyance_update);
	barclient.register('telekinesis', 'e', _on_telekinesis_update);
	barclient.register('merge', 'f', function(a,b){
	    console.log('barista/merge');
	    _on_model_update(a,b);
	});
	//_on_model_update);
	barclient.register('rebuild', 'g', function(a,b){
	    console.log('barista/rebuild');
	    _on_model_update(a,b);
	});
	//_on_model_update);
	barclient.register('query', 'h', function(a,b){
	    console.log('bar/query');
	    _on_layout_response(a,b);
	});
	//_on_layout_response);
	barclient.connect(ecore.get_id());

	// Playing with barista queries. This will trigger soon after
	// the first initialization layout is accomplished. Also look
	// in merge and redraw routines.
	ll('get layout (initial)');
	barclient.get_layout();

	// // DEBUG: Remove before commit.
	// ll('DESTROYING WORKING BARISTA CLIENT!!!');
	// barclient = null;
    }

    //
    jQuery(ping_btn_elt).click(function(){
	if( barclient ){
	    barclient.message(
		{'message':
		 '<strong>please contact me for discussion</strong>',
		 'message_type': 'success'}
	    );
	}
    });

    //
    jQuery(model_ann_elt).click(function(){
	var ann_edit_modal = widgetry.edit_annotations_modal;
	var eam = ann_edit_modal(model_annotation_config,
				 ecore, manager, ecore.get_id(),
				 gserv, gconf);
	eam.show();
    });

    // 
    jQuery(test_btn_elt).click(function(){
	//alert('in progress');
	
	// Grab node.
	var nset = ecore.get_nodes();
	var nkeys = us.keys(nset);
	var node = nset[nkeys[0]];
	if( node ){
	    // 
	    //alert('in progress: + ' + node.id());
	    //bbop_mme_widgetry.contained_modal('shield');
	    //var mdl = new bbop_mme_widgetry.contained_modal('dialog', 'hi');
	    var mdl = widgetry.compute_shield();
	    mdl.show();
	    
	    // Works.
 	    // Test that destroy works.
	    window.setTimeout(
		function(){
		    mdl.destroy();
		    alert('I did nothing. You wasted two seconds. Ha!');
		}, 2000);
	}
    });


    ///
    /// WARNING: Skunkworks for adding new things to the manager.
    ///

    // Simple save.
    jQuery('#' + 'action_save_wo_layout').click(function(){

	// Simple save request.
	var reqs = new minerva_requests.request_set(manager.user_token(),
						    ecore.get_id());

	// TODO: need to update minerva-requests/lib/requests.js so
	// that "store" is an action.
        var store_req = new minerva_requests.request('model', 'store');
        reqs.add(store_req, 'action');

	manager.request_with(reqs);
    });

    // Start with an empty model as we run through this.
    // TODO/BUG: DO_NOT_USE_THIS.
    jQuery(exp_btn_elt).click(function(){

	// Get the modal up.
	var mdl = new widgetry.contained_modal(
	    'dialog',
	    'Please be patient...',
	    'Hey!');
	mdl.show();

	// // Just a hook to an experimental method for easy access to
	// // the manager.
	// var reqs = new minerva_requests.request_set(manager.user_token(),
	// 					    'action', ecore.get_id());

	// /// Individuals.
	// // axon guidance receptor activity
	// reqs.add_simple_individual('GO:0008046');
	// var mf = reqs.last_individual_id();    
	// // neurogenesis
	// reqs.add_simple_individual('GO:0022008');
	// var bp = reqs.last_individual_id();
	// // cell part
	// reqs.add_simple_individual('GO:0004464');
	// var loc = reqs.last_individual_id();
	// // Drd3
	// reqs.add_simple_individual('MGI:MGI:94925');
	// var gp = reqs.last_individual_id();
	
	// // Edges and evidence.    
	// reqs.add_fact(mf, bp, 'part_of');
	// reqs.add_evidence_to_fact('ECO:0000001', ['PMID:0000000'],
	// 			  mf, bp, 'part_of');
	// reqs.add_fact(mf, loc, 'RO:0002333'); // enabled_by
	// reqs.add_fact(mf, gp, 'occurs_in');

	// manager.request_with(reqs, ecore.get_id());
    });

    // Toggle the visibility of the part_of connectors. 
    var viz_p = true; // obviously, start visible
    jQuery(toggle_part_of_elt).click(function(){
	
	// First, collect all of the part_of connections.
	var poc = {};
	each(ecore.all_edges(), function(edge){
	    if( edge && edge.relation() === 'BFO:0000050' ){
		var conn_id = ecore.get_connector_id_by_edge_id(edge.id());
		poc[conn_id] = true;
	    }
	});

	// Switch viz.
	if( viz_p ){ viz_p = false; }else{ viz_p = true;  }
	
	// Toggle viz on and off.
	each(instance.getConnections(), function(conn){
	    if( poc[conn.id] ){
		conn.setVisible(viz_p);
		conn.endpoints[0].setVisible(viz_p);
		conn.endpoints[1].setVisible(viz_p);
		     
		// Disappearing is easy, making visiable
		// leads to artifacts.
		if( viz_p ){
		    // _shields_up();
		    // instance.doWhileSuspended(
    		    // 	 function(){
		    instance.repaintEverything();
		    // });
		    // _shields_down();
		}
	    }
	});
    });
    
    // Toggle the screenshot mode.
    var screen_p = false;
    jQuery(toggle_screen_elt).click(function(){

	// Toggle switch.
	if( screen_p ){ screen_p = false; }else{ screen_p = true; }
	
	// Change the styles.
	if( screen_p ){
	    // Remove the side.
	    jQuery('.app-graph-container').css('margin-left', '0em');
	    jQuery('.app-editor-bounds').css('height', '100%');
	    jQuery('.app-table-bounds').css('height', '0%');
	    jQuery('.app-controls').css('width', '0em');		
	}else{
	    // Re-establish the sides.
	    jQuery('.app-graph-container').css('margin-left', '15em');
	    jQuery('.app-editor-bounds').css('height', '70%');
	    jQuery('.app-table-bounds').css('height', '30%');
	    jQuery('.app-controls').css('width', '15em');
	}
	
    });
    
    // Switch the edit view mode.
    jQuery(view_basic_elt).click(function(){
	view_type = 'basic';
	_shields_up();
	_rebuild_model_and_display(null);
	_refresh_tables();
	_shields_down();
    });
    jQuery(view_ev_fold_elt).click(function(){
	view_type = 'ev_fold';
	_shields_up();
	_rebuild_model_and_display(null);
	_refresh_tables();
	_shields_down();
    });
    jQuery(view_go_fold_elt).click(function(){
	view_type = 'go_fold';
	_shields_up();
	_rebuild_model_and_display(null);
	_refresh_tables();
	_shields_down();
    });
    
    // Let the canvas (div) underneath be dragged around in an
    // intuitive way.
    bbopx.noctua.draggable_canvas(graph_container_id);

    // conflict with draggable canvas
    jQuery(graph_container_div).on('mousemove', function(evt){
	if( barclient ){
	    var top = evt.pageY;
	    var left = evt.pageX;
	    var scroll_left = jQuery(graph_container_div).scrollLeft();
	    var scroll_top = jQuery(graph_container_div).scrollTop();
	    barclient.clairvoyance(top + scroll_top, left + scroll_left);
	}
    });
};

///
/// Startup.
///
/// TODO: It would be good to have a general standard registry set so
/// that the bits here and above share the same registry code. Or
/// maybe I can just pass the manager in?
///

// Start the day the jsPlumb way.
jsPlumb.ready(function(){

    // Try to define token.
    var start_token = null;
    if( global_barista_token ){
	start_token = global_barista_token;
    }

    // Next we need a manager to try and pull in the model.
    if( typeof(global_id) === 'undefined' ||
	typeof(global_minerva_definition_name) === 'undefined' ||
	typeof(global_barista_location) === 'undefined' ){
	    alert('environment not ready');
	}else{
	    
	    // BUG: Bad, bad, bad code...
	    // DEBUG: Path for heiko that prevents initial manager pass and
	    // uses embedded model.
	    if( ! global_id && global_model ){
		// Bootstrap model into viewer--cannot edit.
		MMEnvInit(global_model, global_known_relations, null);

	    }else{

		// This may take a minute, so let's do an initial
		// shield while people wait.
		compute_shield_modal = widgetry.compute_shield();
		compute_shield_modal.show();

		// This manager bootstraps the editor by fetching the
		// model out of Minerva.
		var engine = new jquery_engine(barista_response);
		engine.method('POST');
		var init_manager =
		    new minerva_manager(global_barista_location,
					global_minerva_definition_name,
					start_token, engine, 'async');
		
		// Have a manager and model id, defined a success callback
		// and try and get the full model to start the bootstrap.
		init_manager.register('manager_error', function(resp, man){
		    alert('Early manager error (' +
			  resp.message_type() + '): ' + resp.message());
		}, 10);
		init_manager.register('error', function(resp, man){		
		    if( ! resp.commentary() ){
			alert('Early error (' +
			      resp.message_type()+ '): ' + 
			      resp.message());
		    }else{
			alert('Early error (' +
			      resp.message_type() + '): ' +
			      resp.message() + '; ' +
			      resp.commentary());
		    }
		}, 10);
		init_manager.register('rebuild', function(resp, man){
		    //alert('in');
		    // Replace placeholder at top level for debug.
		    //global_model = resp.data();
		    // Bootstrap rest of session.
		    MMEnvInit(resp.data(),
			      global_known_relations,
			      start_token);
		});
		init_manager.get_model(global_id);
		//var rr = manager.get_model(global_id);
		//ll('rr: ' + rr);
		
		// When all is said and done, let's also fillout the user
		// name just for niceness. This is also a test of CORS in
		// express.
		if( start_token ){
	    	    widgetry.user_check(global_barista_location,
	    				start_token, 'user_name_info');
		}
	    }
	}

});
