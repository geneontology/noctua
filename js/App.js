////
//// ...
////

///
/// Application initializer.
/// Application logic.
/// Initialze with (optional) incoming data ans setup the GUI.
///

var MMEnvInit = function(in_model, in_relations, in_server_base){
    
    // TODO: Add this as an argument.
    //var use_waypoints_p = true;
    // var use_waypoints_p = false;
    // Form is: { <sub>: <obj>: [[x1, y1], ..., [xn, yn]] }
    // Where 1 is the initial node and n is the terminal node.
    var waypoints = {};
    
    var logger = new bbop.logger('app');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;
    var is_empty = bbop.core.is_empty;
    var what_is = bbop.core.what_is;
    var bme_core = bbop_mme_edit.core;
    var bme_edge = bbop_mme_edit.edge;
    var bme_node = bbop_mme_edit.node;
    var widgets = bbop_mme_widgets;
    
    // Help with strings and colors--configured separately.
    var aid = new bbop_mme_context();

    // Create the core model.
    //var bbop_mme_edit = require('./js/bbop-mme-edit');
    var ecore = new bme_core();

    // Optionally use the messaging server as an experiment.
    var msngr = null;

    // Where we move the nodes during this session.
    var historical_store = new bbop_location_store();

    // Events registry.
    //var manager = new bbop_mme_manager(in_server_base);
    // BUG/TODO: Right now, just hardwiring the uid, but this needs to
    // be distributed by the moderator after authenication.
    var manager = new bbop_mme_manager2('amigo', in_server_base);

    // GOlr location and conf setup.
    var gserv = 'http://golr.berkeleybop.org/';
    var gconf = new bbop.golr.conf(amigo.data.golr);

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
    // BP button contact points.
    var simple_bp_enb_auto_id = 'simple_bp_enb_auto';
    var simple_bp_enb_auto_elt = '#' + simple_bp_enb_auto_id;
    var simple_bp_act_auto_id = 'simple_bp_act_auto';
    var simple_bp_act_auto_elt = '#' + simple_bp_act_auto_id;
    var simple_bp_occ_auto_id = 'simple_bp_occ_auto';
    var simple_bp_occ_auto_elt = '#' + simple_bp_occ_auto_id;
    var simple_bp_add_btn_id = 'simple_bp_adder_button';
    var simple_bp_add_btn_elt = '#' + simple_bp_add_btn_id;
    // MF button contact points.
    var simple_mf_enb_auto_id = 'simple_mf_enb_auto';
    var simple_mf_enb_auto_elt = '#' + simple_mf_enb_auto_id;
    var simple_mf_act_auto_id = 'simple_mf_act_auto';
    var simple_mf_act_auto_elt = '#' + simple_mf_act_auto_id;
    var simple_mf_occ_auto_id = 'simple_mf_occ_auto';
    var simple_mf_occ_auto_elt = '#' + simple_mf_occ_auto_id;
    var simple_mf_add_btn_id = 'simple_mf_adder_button';
    var simple_mf_add_btn_elt = '#' + simple_mf_add_btn_id;
    // Other contact points.
    var zin_btn_id = 'zoomin';
    var zin_btn_elt = '#' + zin_btn_id;
    var zret_btn_id = 'zoomret';
    var zret_btn_elt = '#' + zret_btn_id;
    var zout_btn_id = 'zoomout';
    var zout_btn_elt = '#' + zout_btn_id;
    var refresh_btn_id = 'action_refresh';
    var refresh_btn_elt = '#' + refresh_btn_id;
    var reset_btn_id = 'action_reset';
    var reset_btn_elt = '#' + reset_btn_id;
    var export_btn_id = 'action_export';
    var export_btn_elt = '#' + export_btn_id;
    var save_btn_id = 'action_save';
    var save_btn_elt = '#' + save_btn_id;
    var ping_btn_id = 'action_ping';
    var ping_btn_elt = '#' + ping_btn_id;
    var test_btn_id = 'action_test';
    var test_btn_elt = '#' + test_btn_id;
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
    var reporter = new widgets.reporter(message_area_id);

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

    ///
    /// jsPlumb preamble.
    ///

    var instance = jsPlumb.getInstance(
	{
	    // All connections have these properties.
	    DragOptions: {ccursor: 'pointer', zIndex:2000 },
	    PaintStyle: { strokeStyle:'#666' },
            Endpoints : ["Rectangle", ["Dot", { radius:8 } ]],
	    EndpointStyles : [
		{ 
		    width: 15,
		    height: 15,
		    strokeStyle: '#666',
		    fillStyle: "#333"
		},
		{
		    fillStyle: "#0d78bc"
		}
	    ],
	    PaintStyle : {
		strokeStyle:"#558822",
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
	each(btype,
	     function(b){
		 jQuery(graph_div).css(b + "transform", scale_str);
	     });
	instance.setZoom(zlvl);
    };

    ///
    /// jsPlumb/edit core helpers.
    ///

    function _make_selector_draggable(sel){

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
		historical_store.add(en.id(), l, t);
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
		var t = ui.position.top;
		var l = ui.position.left;

		//ll('dragging (' + en.id() + ') at:' + t + ', ' + l);
		msngr.telekinesis(en.id(), t, l);
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
    
    function _make_selector_on_node_editable(sel){

	// Add this event to whatever we got called in.
	jQuery(sel).click(
	    function(evnt){
		evnt.stopPropagation();

		// Resolve the event into the edit core node.
		var target_elt = jQuery(evnt.target);
		var parent_elt = target_elt.parent();
		var parent_id = parent_elt.attr('id');
		var enode = ecore.get_node_by_elt_id(parent_id);
		if( enode ){		    
		    var nedit = widgets.edit_node_modal(ecore, manager, enode);
		    nedit.show();
		}else{
		    alert('Could not find related element.');
		}
	    });
    }

    // TODO/BUG
    function _delete_iae_from_ui(indv_id){

	// Delete all UI connections associated with
	// node. This also triggers the "connectionDetached"
	// event, so the edges are being removed from the
	// model at the same time.
	var nelt = ecore.get_node_elt_id(indv_id);
	instance.detachAllConnections(nelt);

	// Delete node from UI/model.
	jQuery('#' + nelt).remove();
    }

    //
    function _delete_iae_from_ecore(indv_id){
	ecore.remove_node(indv_id); // recursively removes
    }

    function _connect_with_edge(eedge){

	var sn = eedge.source();
	var rn = eedge.relation() || 'n/a';
	var tn = eedge.target();

	// Readable label.
	rn = aid.readable(rn);
	var clr = aid.color(rn);

	// Try and detect the proper edge type.
	var rglyph = aid.glyph(rn);
	var glyph = null;
	var glyph_args = {};
	if( rglyph == 'arrow' ){
	    glyph = 'Arrow';
	    glyph_args['location'] = -4;
	}else if( rglyph == 'diamond' ){
	    glyph = 'Diamond';
	    glyph_args['location'] = -5;
	}else if( rglyph == 'bar' ){
	    glyph = 'Arrow';
	    glyph_args['length'] = 2;
	    glyph_args['width'] = 25;
	    glyph_args['foldback'] = 2.0;
	    glyph_args['location'] = -5;
	}else if( rglyph == 'wedge' ){
	    glyph = 'PlainArrow';
	    glyph_args['location'] = -4;
	}else if( ! rglyph || rglyph == 'none' ){
	    // Let it go as nothing.
	}else{
	    // Unpossible.
	    throw new Error('unpossible glyph...is apparently possible');
	}

	// Try and see if there are waypoints.
	var usable_waypoints = null;
	if( waypoints[sn] && waypoints[sn][tn] ){
	    usable_waypoints = waypoints[sn][tn];
	}

    	var new_conn_args = {
	    // remember that edge ids and elts ids are the same 
    	    'source': ecore.get_node_elt_id(sn),
    	    'target': ecore.get_node_elt_id(tn),
	    //'label': 'foo' // works
	    'anchor': "Continuous",
	    // TODO/BUG: Finish Sugiyama implementation.
	    //'connector': ["Sugiyama", { curviness: 75 } ],
	    'connector': ["Sugiyama", {
			      'curviness': 75,
			      'waypoints': usable_waypoints
			  } ],
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

	// Add activity listener to the new edge.
	new_conn.bind('click',
		      function(connection, event){
			  //alert('edge click: ' + eedge.id());
			  var ann_edit_modal = widgets.edit_annotations_modal;
			  var eam = ann_edit_modal(ecore, manager, eedge.id());
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

    var compute_shield_modal = null;

    // Block interface from taking user input while
    // operating.
    function _shields_up(){
	if( compute_shield_modal ){
	    // Already have one.
	}else{
	    ll('shield up');
	    compute_shield_modal = bbop_mme_widgets.compute_shield();
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
	widgets.repaint_info(ecore, aid, table_info_div);
	widgets.repaint_exp_table(ecore, aid, table_exp_div);
	widgets.repaint_edge_table(ecore, aid, table_edge_div);
    }

    // 
    function _inconsistency_check(resp, man){
	ll('doing the inconsistent_p check');
	if( resp.inconsistent_p() &&
	    ! jQuery(graph_container_div).hasClass('model-inconsistent') ){
	    // Recolor the interface.
	    jQuery(graph_container_div).addClass('model-inconsistent');
	}else if( ! resp.inconsistent_p() &&
		  jQuery(graph_container_div).hasClass('model-inconsistent') ){
	    // Restore the interface coloration.
	    jQuery(graph_container_div).removeClass('model-inconsistent');
	}
    }

    function _rebuild_meta(model_id, annotations){

	// Deal with ID(s).
	// First and only setting of this right now.
	// Override if there is real data.
	if( model_id ){
	    ecore.add_id(model_id);
	    ll('model id from data: ' + ecore.get_id());
	}else if( typeof(global_id) !== 'undefined' && global_id ){
	    ecore.add_id(global_id);
	    ll('model id from environment: ' + ecore.get_id());
	}else{
	    ll('model id missing');
	    throw new Error('missing model id');
	}

	// Bring in any annotations lying around.
	if( annotations ){
	    ecore.annotations(annotations);
	}
    }
	
    // The core initial layout function.
    function _rebuild_model_and_display(model_id, individuals,
					facts, annotations){

	ll('rebuilding from scratch');
	
	// Wipe UI.
	each(ecore.get_nodes(),
	     function(enid, en){
		 _delete_iae_from_ui(enid);
		 _delete_iae_from_ecore(enid);
	     });
	widgets.wipe(graph_div); // rather severe

	// Wipe ecore.
	ecore = new bme_core(); // nuke it from orbit

	// Reconstruct ecore meta.
	_rebuild_meta(model_id, annotations);

	// Starting fresh, add everything coming in to the edit model.
	each(individuals,
	     function(indv){
		 ecore.add_node_from_individual(indv);
	     });
	each(facts,
	     function(fact){
		 ecore.add_edge_from_fact(fact, aid);
	     });

	///
	/// We now have a well-defined edit core. Let's try and add
	/// some layout information if we can: edit core topology to
	/// graph.
	///

	// Extract the gross layout.
	var g = ecore.to_graph();
	var r = new bbop.layout.sugiyama.render();
	var layout = r.layout(g);

	// Find the initial layout position of the layout. There might
	// be some missing due to finding cycles in the graph, so we
	// have this two-step process.
	var layout_store = new bbop_location_store();
	each(layout['nodes'],
	     function(litem, index){
		 var id = litem['id'];
		 var raw_x = litem['x'];
		 var raw_y = litem['y'];
		 var fin_x = _box_left(raw_x);
		 var fin_y = _box_top(raw_y);
		 layout_store.add(id, fin_x, fin_y);
	     });
	// Now got through all of the actual nodes.
	each(ecore.get_nodes(),
	     function(enid, en){

		 // Try and see if we have coords; the precedence is:
		 // historical (drop), layout, make some up.
		 var fin_x = null;
		 var fin_y = null;
		 var hist_coords = historical_store.get(enid);
		 var layout_coords = layout_store.get(enid);
		 if( hist_coords ){
		     fin_x = hist_coords['x'];
		     fin_y = hist_coords['y'];
		 }else if( layout_coords ){
		     fin_x = layout_coords['x'];
		     fin_y = layout_coords['y'];
		 }else{
		     fin_x = _vari();
		     fin_y = _vari();		 
		 }

		 // Take the final coordinate and add it as a hint into
		 // the edit node.
		 en.x_init(fin_x);
		 en.y_init(fin_y);
	     });	

	///
	/// Assemble (optionally used) waypoint information.
	///

	// // Add waypoint virtual nodes.
	// each(layout['virtual_nodes'],
	//      function(litem, index){
	// 	 var id = litem['id'];
	// 	 var raw_x = litem['x'];
	// 	 var raw_y = litem['y'];

	// 	 var vn = new bme_node(id, 'virtual');
	// 	 vn.x_init(_vbox_left(raw_x));
	// 	 vn.y_init(_vbox_top(raw_y));
		 
	// 	 ecore.add_node(vn);
	//      });	
	
	// Add additional waypoint path information to the edges.
	// Points are either in the layout_store or they are virtual
	// and we will generate them as we go.
	each(layout['paths'],
    	     function(path){
		 
		 // Ensure the require waypoints structure using the
		 // only two real points of reference.
		 var nodes = path['nodes'];
		 var sub_id = nodes[0];
		 var obj_id = nodes[nodes.length -1];
		 
		 // Now iterate over all of the waypoints to make it
		 // there.
		 // Note that we realize that the first and last ones
		 // will be irrelevant since we'll be relying on
		 // jsPlumb to figure those out for us.
		 var layout_waypoints = path['waypoints'];
		 each(layout_waypoints, 
		      function(waypoint, wi){
			  if( wi > 0 && wi < (layout_waypoints.length -1) ){
			      var vc = [
				  _vbox_left(waypoint['x']),
				  _vbox_top(waypoint['y'])
			      ];

			      // To keep the output easier, only add
			      // new structure on need...
			      if( ! waypoints[sub_id] ){
				  waypoints[sub_id] = {};
			      }
			      if( ! waypoints[sub_id][obj_id] ){
				  waypoints[sub_id][obj_id] = [];
			      }

			      waypoints[sub_id][obj_id].push(vc);
			  }
		      });
	     });
	//ll('waypoints: ' + bbop.core.dump(waypoints));

	// For our intitialization/first drawing, suspend jsPlumb
	// stuff while we get a little work done rebuilding the UI.
	instance.doWhileSuspended(
    	    function(){

		// Initial render of the graph.
    		each(ecore.get_nodes(),
    		     function(enode_id, enode){
			 // Add if a "real" node.
    			 // if( enode.existential() == 'real' ){
    			     widgets.add_enode(ecore, enode, aid, graph_div);
    			 // }else{
			 //   // == 'virtual'; will not be used if no waypoints.
			 //     widgets.add_virtual_node(ecore, enode,
			 // 			      aid, graph_div);
    			 // }
    		     });
    		// Now let's try to add all the edges/connections.
    		each(ecore.get_edges(),
    		     function(eeid, eedge){
    			 _connect_with_edge(eedge);
    		     });
		
		// Make nodes draggable.
		_make_selector_draggable(".demo-window");
		// if( use_waypoints_p ){	
		//     _make_selector_draggable(".waypoint");
		// }
		
    		// Make normal nodes availables as edge targets.
		_make_selector_target('.demo-window');
    		// if( use_waypoints_p ){ // same for waypoints/virtual nodes
		//     _make_selector_target('.waypoint');
    		// }
		
		// Make the konn class available as source from inside the
		// real node class elements.
		_make_selector_source('.demo-window', '.konn');
		
		// Make nodes able to use edit dialog.
		_make_selector_on_node_editable(".open-dialog");
		
    	    });	
    }

    // This is a very important core function. It's purpose is to
    // update the loval model and UI to be consistent with the current
    // state and the data input.
    function _merge_from_new_data(individuals, facts, annotations){

	// First look at individuals/nodes for addition or updating.
	each(individuals,
	     function(ind){
		 // Update node. This is preferred since
		 // deleting it would mean that all the connections
		 // would have to be reconstructed as well.
		 var refresh_node_id = null;
		 var update_node = ecore.get_node_by_individual(ind);
		 if( update_node ){
		     ll('update node');

		     // "Update" the edit node in core by clobbering it.
		     var unode = ecore.add_node_from_individual(ind);

		     // // TODO: Re-draw the visible node.
		     // var uelt = ecore.get_node_elt_id(unode.id());
		     // ll('trying to wipe: ' + uelt);
		     // jQuery('#' + uelt).empty();
		 
		     // // TODO:
		     // // wipe_node_contents()
		     // // redraw_node_contents()
		     widgets.update_enode(ecore, unode, aid);

		     // Mark it for refreshing.
		     refresh_node_id = unode.id();

		     //alert('cannot update nodes yet; suggest refreshing');
		 }else{
		     ll('add node');

		     // Add new node to edit core, pull it out for
		     // some work.
		     ecore.add_node_from_individual(ind);
		     var dyn_node = ecore.get_node_by_individual(ind);
		     if( ! dyn_node ){
			 alert('id issue somewhere--refresh to see state');
		     }else{
			 
			 // Initial node layout settings.
    			 var dyn_x = _vari() +
			     jQuery(graph_container_div).scrollLeft();
    			 var dyn_y = _vari() +
			     jQuery(graph_container_div).scrollTop();
			 dyn_node.x_init(dyn_x);
			 dyn_node.y_init(dyn_y);
			 
			 // Draw it to screen.
			 widgets.add_enode(ecore, dyn_node, aid, graph_div);
			 
			 // Mark it for refreshing.
			 refresh_node_id = unode.id();
		     }
		 }

		 // Refresh any node created or updated.
		 if( refresh_node_id ){
		     
		     // Make node active in display.
		     var dnid = refresh_node_id;
		     var ddid = '#' + ecore.get_node_elt_id(dnid);
		     _make_selector_draggable(ddid);
		     //_make_selector_target(ddid);
		     //_make_selector_source(ddid, '.konn');
		     _make_selector_on_node_editable(".open-dialog");
		     // _make_selector_draggable('.demo-window');
		     _make_selector_target('.demo-window');
		     _make_selector_source('.demo-window', '.konn');
		     
    		     jsPlumb.repaintEverything();
		 }
	     });
	
	// Now look at individuals/edges (by individual) for
	// purging.
	each(individuals,
	     function(ind){
		 var source_node = ecore.get_node_by_individual(ind);
		 
		 var snid = source_node.id();
		 var src_edges = ecore.get_edges_by_source(snid);
		 //var src_edges = ecore.get_edges_by_target(snid);
		 
		 // Delete all edges/connectors for said node in
		 // model.
		 each(src_edges,
		      function(src_edge){
			  ecore.remove_edge(src_edge.id());
		      });
		 
		 // Now delete all edges for the node in the UI.
		 var snid_elt = ecore.get_node_elt_id(snid);
		 var src_conns =
		     instance.getConnections({'source': snid_elt});
		 each(src_conns,
		      function(src_conn){
			  instance.detach(src_conn);
		      });
		 
		 // // Add all edges from the new individuals to the
		 // // model.
		 // var redges = ecore.add_edges_from_individual(ind, aid);
		 
		 // // Now add them to the display.
		 // each(redges,
		 //      function(redge){
		 // 	  _connect_with_edge(redge);
		 //      });
	     });
	// Reinitiate from all facts.
	each(facts,
	     function(fact){
		 var edg = ecore.add_edge_from_fact(fact, aid);
		 _connect_with_edge(edg);
	     });
    }
    
    ///
    /// Manager registration and ordering.
    ///
    
    // Internal registrations.
    manager.register('prerun', 'foo', _shields_up);
    manager.register('postrun', 'foo1', _inconsistency_check, 10);
    manager.register('postrun', 'foo2', _refresh_tables, 9);
    manager.register('postrun', 'foo3', _shields_down, 8);
    manager.register('postrun', 'foo4',
		     function(resp, man){ // experimental
			 if( msngr ){	
			     // TODO/BUG: Get into a refresh war pretty
			     // easy since you trigger an inconsistent
			     // on refresh--need a better measure.
			     // TODO: Would this be fixed by also
			     // passing an "intent" argument? An intention
			     // of refreshing and getting an inconsistent
			     // is different than getting inconsistent on
			     // adding a term. Papered over for the
			     // time being by adding the additional
			     // "instantiate" message type.
			     var mtype = resp.message_type();
			     var msg = [
				 'completed op ',
				 '<span class="bbop-mme-message-op">',
				 mtype,
				 '</span>'
			     ];
			     if( mtype == 'inconsistent' || 
				 mtype == 'merge' ){
				 msg.push(', <span class="bbop-mme-message-req">you should refresh</span>'); 
				 }
			     msngr.info(msg.join(''));
			 }
		     }, 7);
    manager.register('manager_error', 'foo',
		     function(message_type, message){
			 alert('There was a connection error (' +
			       message_type + '): ' + message);
		     }, 10);

    manager.register('warning', 'foo',
		     function(resp, man){
			 alert('Warning: ' + resp.message() + '; ' +
			       'your operation was likely not performed');
		     }, 10);

    manager.register('error', 'foo',
		     function(resp, man){

			 var ex_msg = '';
			 if( resp.commentary() &&
			     resp.commentary().exceptionMsg ){
			     ex_msg = ' ['+ resp.commentary().exceptionMsg +']';
			 }

			 alert('Error (' +
			       resp.message_type() + '): ' +
			       resp.message() + '; ' +
			       'your operation was likely not performed' +
			       ex_msg);
		     }, 10);

    // Remote action registrations.
    manager.register('meta', 'foo',
    		     function(resp, man){
    			 alert('Meta operation successful: ' + resp.message());
    		     }, 10);

    manager.register('rebuild', 'foo',
		     function(resp, man){
			 var mid = resp.model_id();
			 var mindividuals = resp.individuals();
			 var mfacts = resp.facts();
			 var mannotations = resp.annotations();

			 // Deal with model.
			 if( ! mid || is_empty(mindividuals) ){
			     alert('no data/individuals in inconsistent');
			 }else{
			     _rebuild_model_and_display(mid, mindividuals,
							mfacts, mannotations);
			 }
		     }, 10);

    manager.register('merge', 'foo',
		     function(resp, man){
			 var individuals = resp.individuals();
			 var facts = resp.facts();
			 var annotations = resp.annotations();
			 if( ! individuals ){
			     alert('no data/individuals in merge--unable to do');
			 }else{
			     _merge_from_new_data(individuals, facts,
						  annotations);
			 }
		     }, 10);

    ///
    /// UI event registration.
    ///    

    // TODO/BUG: Read on.
    // Connection event.
    instance.bind("connection",
		  function(info, original_evt) {

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
			  var init_edge =
			      widgets.add_edge_modal(ecore, manager,
						     in_relations, aid,
						     snode.id(), tnode.id());
			  init_edge.show();
		      }
		  });

    // Detach event.
    instance.bind("connectionDetached",
		  function(info, original_evt) {
		      
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
		      
			  var edge = ecore.get_edge(eeid);
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
    jQuery(graph_div).scroll(
        function(){
            jsPlumb.repaintEverything();
        }
    );

    ///
    /// Activate addition template for BP.
    ///

    // Storage for the actual selected identifiers.
    var simple_bp_enb_auto_val = null;
    var simple_bp_act_auto_val = null;
    var simple_bp_occ_auto_val = null;

    // bioentity
    var simple_bp_enb_auto_args = {
    	'label_template': '{{bioentity_label}} ({{bioentity}})',
    	'value_template': '{{bioentity_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['bioentity_label']);
	    simple_bp_enb_auto_val = doc['bioentity'] || null;
    	}
    };
    // molecular function
    var simple_bp_act_auto_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
	    simple_bp_act_auto_val = doc['annotation_class'] || null;
    	}
    };
    // location/occurs_in
    var simple_bp_occ_auto_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
	    simple_bp_occ_auto_val = doc['annotation_class'] || null;
    	}
    };

    var simple_bp_enb_auto =
	new bbop.widget.search_box(gserv, gconf, simple_bp_enb_auto_id,
				   simple_bp_enb_auto_args);
    simple_bp_enb_auto.add_query_filter('document_category', 'bioentity');
    simple_bp_enb_auto.set_personality('bioentity');

    var simple_bp_act_auto =
	new bbop.widget.search_box(gserv, gconf, simple_bp_act_auto_id,
				   simple_bp_act_auto_args);
    simple_bp_act_auto.add_query_filter('document_category', 'ontology_class');
    simple_bp_act_auto.add_query_filter('regulates_closure_label',
    					'biological_process');
    simple_bp_act_auto.set_personality('ontology');

    var simple_bp_occ_auto =
	new bbop.widget.search_box(gserv, gconf, simple_bp_occ_auto_id,
				   simple_bp_occ_auto_args);
    simple_bp_occ_auto.add_query_filter('document_category', 'ontology_class');
    simple_bp_occ_auto.add_query_filter('source', 'molecular_function', ['-']);
    simple_bp_occ_auto.add_query_filter('source', 'biological_process', ['-']);
    simple_bp_occ_auto.set_personality('ontology');

    // Add new remote node button.
    jQuery(simple_bp_add_btn_elt).click(
    	function(){
    	    var enb = simple_bp_enb_auto_val || '';
    	    var act = simple_bp_act_auto_val || '';
    	    var occ = simple_bp_occ_auto_val || '';

    	    if( act == '' ){
    		alert('Must select activity field from autocomplete list.');
    	    }else{
		// Wipe controls' state, internal and external.
		simple_bp_enb_auto_val = null;
    		simple_bp_act_auto_val = null;
    		simple_bp_occ_auto_val = null;
		jQuery(simple_bp_enb_auto_elt).val('');
    		jQuery(simple_bp_act_auto_elt).val('');
    		jQuery(simple_bp_occ_auto_elt).val('');

		// Send message to server.
		manager.add_simple_composite(ecore.get_id(), act, enb, occ);
    	    }
    	}
    );

    ///
    /// Activate addition template for MF.
    ///

    // Storage for the actual selected identifiers.
    var simple_mf_enb_auto_val = null;
    var simple_mf_act_auto_val = null;
    var simple_mf_occ_auto_val = null;

    // bioentity
    var simple_mf_enb_auto_args = {
    	'label_template': '{{bioentity_label}} ({{bioentity}})',
    	'value_template': '{{bioentity_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['bioentity_label']);
	    simple_mf_enb_auto_val = doc['bioentity'] || null;
    	}
    };
    // molecular function
    var simple_mf_act_auto_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
	    simple_mf_act_auto_val = doc['annotation_class'] || null;
    	}
    };
    // location/occurs_in
    var simple_mf_occ_auto_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
	    simple_mf_occ_auto_val = doc['annotation_class'] || null;
    	}
    };

    var simple_mf_enb_auto =
	new bbop.widget.search_box(gserv, gconf, simple_mf_enb_auto_id,
				   simple_mf_enb_auto_args);
    simple_mf_enb_auto.add_query_filter('document_category', 'bioentity');
    simple_mf_enb_auto.set_personality('bioentity');

    var simple_mf_act_auto =
	new bbop.widget.search_box(gserv, gconf, simple_mf_act_auto_id,
				   simple_mf_act_auto_args);
    simple_mf_act_auto.add_query_filter('document_category', 'ontology_class');
    simple_mf_act_auto.add_query_filter('regulates_closure_label',
    					'molecular_function');
    simple_mf_act_auto.set_personality('ontology');

    var simple_mf_occ_auto =
	new bbop.widget.search_box(gserv, gconf, simple_mf_occ_auto_id,
				   simple_mf_occ_auto_args);
    simple_mf_occ_auto.add_query_filter('document_category', 'ontology_class');
    simple_mf_occ_auto.add_query_filter('source', 'molecular_function', ['-']);
    simple_mf_occ_auto.add_query_filter('source', 'biological_process', ['-']);
    simple_mf_occ_auto.set_personality('ontology');

    // Add new remote node button.
    jQuery(simple_mf_add_btn_elt).click(
    	function(){
    	    var enb = simple_mf_enb_auto_val || '';
    	    var act = simple_mf_act_auto_val || '';
    	    var occ = simple_mf_occ_auto_val || '';

    	    if( act == '' ){
    		alert('Must select activity field from autocomplete list.');
    	    }else{
		// Wipe controls' state, internal and external.
		simple_mf_enb_auto_val = null;
    		simple_mf_act_auto_val = null;
    		simple_mf_occ_auto_val = null;
		jQuery(simple_mf_enb_auto_elt).val('');
    		jQuery(simple_mf_act_auto_elt).val('');
    		jQuery(simple_mf_occ_auto_elt).val('');

		// Send message to server.
		manager.add_simple_composite(ecore.get_id(), act, enb, occ);
    	    }
    	}
    );

    ///
    /// Other button activities.
    ///

    // Zoom buttons.
    jQuery(zin_btn_elt).click(
    	function(){
    	    var nz = instance.getZoom() + 0.25;
    	    _set_zoom(nz);
    	});
    jQuery(zret_btn_elt).click(
    	function(){
    	    _set_zoom(1.0);
    	});
    jQuery(zout_btn_elt).click(
    	function(){
    	    var nz = instance.getZoom() - 0.25;
    	    _set_zoom(nz);
    	});

    // Refresh button.
    // Trigger a model get and an inconsistent redraw.
    jQuery(refresh_btn_elt).click(
	function(){
	    ll('starting refresh of model: ' + ecore.get_id());
	    manager.get_model(ecore.get_id());
	});

    // Export button.
    jQuery(export_btn_elt).click(
    	function(){
	    // Change the form to add the id.
	    jQuery(action_form_data_elt).val(ecore.get_id());
	    // Run it off in a new tab.
	    jQuery(action_form_elt).submit();
    	});

    // Save button.
    jQuery(save_btn_elt).click(
    	function(){
	    // Run it off in a new tab.
	    // TODO/BUG: Not extant in batch?
	    //manager.store_model(ecore.get_id());
	    alert('This functionality has been temporarily suspended.');
    	});

    // Help button.
    jQuery(help_btn_elt).click(
    	function(){
	    alert('In alphas, nobody can hear you scream.');
    	});

    ///
    /// Load the incoming graph into something useable for population
    /// of the editor.
    ///

    var model_json = in_model;

    // Since we're doing this "manually", apply the prerun and postrun
    // "manually".
    _shields_up();
    var init_mid = model_json['id'];
    var init_indvs = model_json['individuals'];
    var init_facts = model_json['facts'];
    var init_anns = model_json['annotations'] || [];
    _rebuild_model_and_display(init_mid, init_indvs, init_facts, init_anns);
    _refresh_tables();
    _shields_down();

    ///
    /// Optional: experiment with the messaging server.
    ///

    // Allow the message board to be cleared.
    function _on_connect(){
	reporter.reset();
	reporter.comment('you are connected');
    }

    function _on_info_update(uid, ucolor, message){

	// Add to the top of the message list.
	reporter.comment(message, uid, ucolor);
		
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
	    jQuery(message_area_tab_elt).click(
		function(){
		    jQuery(message_area_tab_elt).removeClass(cls);
		});
	}
    }

    function _on_clairvoyance_update(id, color, top, left){

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

    function _on_telekinesis_update(uid, iid, top, left){
	//var en = ecore.get_node(iid);
	var enelt = ecore.get_node_elt_id(iid);
	if( enelt ){
	    // ll('tkn callback: ' +
	    //    uid + ' moved '+ iid + ': ' +
	    //    top + ', ' + left);
	    jQuery('#' + enelt).css('top', top + 'px');
	    jQuery('#' + enelt).css('left', left + 'px');

	    // TODO: Still seems a bit slow. Tried throwing events as
	    // well, but didn't work. This is certainly the "right"
	    // way to do it...
    	    //instance.repaintEverything();	
	    instance.repaint(enelt);
	}
    }

    if( typeof(global_message_server) === 'undefined'  ){
	ll('no setup for messaging--passing');
    }else{
	//var msgloc_srv = 'http://localhost:3400';
	ll('try setup for messaging at: ' + global_message_server);
	msngr = new bbop_messenger_client(global_message_server,
					  _on_connect,
					  _on_info_update,
					  _on_clairvoyance_update,
					  _on_telekinesis_update);
	msngr.connect(ecore.get_id());
    }

    //
    jQuery(ping_btn_elt).click(
	function(){
	    if( msngr ){
		msngr.info('Please contact me for discussion about ' +
			   '<span class="bbop-mme-message-op">'+
			   ecore.get_id() + '</span>');
	    }
	}
    );

    // 
    jQuery(test_btn_elt).click(
	function(){
	    //alert('in progress');

	    // Grab node.
	    var nset = ecore.get_nodes();
	    var nkeys = bbop.core.get_keys(nset);
	    var node = nset[nkeys[0]];
	    if( node ){
		// 
		//alert('in progress: + ' + node.id());
		//bbop_mme_widgets.contained_modal('shield');
		//var mdl = new bbop_mme_widgets.contained_modal('dialog', 'hi');
		var mdl = bbop_mme_widgets.compute_shield();
		mdl.show();

		// Works.
 		// Test that destroy works.
		window.setTimeout(
		    function(){
			mdl.destroy();
			alert('I did nothing. You wasted two seconds.');
		    }, 2000);
	    }
	}
    );

    // Let the canvas (div) underneath be dragged around in an
    // intuitive way.
    bbop_draggable_canvas(graph_container_id);

    jQuery(graph_container_div).on( // conflict with draggable canvas
	'mousemove',
	function(evt){
	    if( msngr ){
		var top = evt.pageY;
		var left = evt.pageX;
		var scroll_left = jQuery(graph_container_div).scrollLeft();
		var scroll_top = jQuery(graph_container_div).scrollTop();
		msngr.clairvoyance(top + scroll_top, left + scroll_left);
	    }
	});
};

///
/// Startup.
///

// Start the day the jsPlumb way.
jsPlumb.ready(function(){
		  // Only roll if the env is correct.
		  if( typeof(global_id) !== 'undefined' &&
		      typeof(global_server_base) !== 'undefined' ){
			  if( typeof(global_model) !== 'undefined' &&
				    global_model ){
				  MMEnvInit(global_model,
					    global_known_relations,
					    global_server_base);
			  }else{
			      alert('nothing loadable found');
			      //throw new Error('nothing loadable found');
			  }
		      }else{
			  alert('environment not ready');
			  //throw new Error('environment not ready');
		      }
	      });
