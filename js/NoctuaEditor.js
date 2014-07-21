////
//// ...
////

///
/// Application initializer.
/// Application logic.
/// Initialze with (optional) incoming data ans setup the GUI.
///

var MMEnvInit = function(in_model, in_relations, in_token){
    
    // TODO: Add this as an argument.
    //var use_waypoints_p = true;
    // var use_waypoints_p = false;
    // Form is: { <sub>: <obj>: [[x1, y1], ..., [xn, yn]] }
    // Where 1 is the initial node and n is the terminal node.
    var waypoints = {};
    
    var logger = new bbop.logger('noctua editor');
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
    var aid = new bbop.context(amigo.data.context);

    // Create the core model.
    //var bbop_mme_edit = require('./js/bbop-mme-edit');
    var ecore = new bme_core();

    // Optionally use the messaging server as an experiment.
    var barclient = null;

    // Where we move the nodes during this session.
    // BUG/TODO: Should be the domain of Barista.
    var historical_store = new bbop_location_store();

    // Events registry.
    var manager = new bbop_mme_manager2(global_barista_location,
					global_minerva_definition_name,
					in_token);
    //var manager = new bbop_mme_manager2(in_server_base, 'mmm', in_token);

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
    var model_ann_id = 'menu-model-annotations';
    var model_ann_elt = '#' + model_ann_id;
    var toggle_part_of_id = 'toggle_part_of';
    var toggle_part_of_elt = '#' + toggle_part_of_id;
    var toggle_screen_id = 'toggle_screen_of';
    var toggle_screen_elt = '#' + toggle_screen_id;
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
	    PaintStyle: { strokeStyle:'#0d78bc' },
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
	each(btype,
	     function(b){
		 jQuery(graph_div).css(b + "transform", scale_str);
	     });
	instance.setZoom(zlvl);
    };

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
		barclient.telekinesis(en.id(), t, l);
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
		    var ann_edit_modal = widgets.edit_annotations_modal;
		    var eam = ann_edit_modal(ecore, manager, enode.id(),
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
		    var nedit = widgets.edit_node_modal(ecore, manager, enode,
							in_relations, aid,
							gserv, gconf);
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

	// Append if there are comments, etc.
	var eanns = eedge.annotations();
	if( eanns.length != 0 ){
	    // Meta counts.
	    var n_ev = 0;
	    var n_other = 0;
	    each(eanns,
		 function(ann){
		     if( ann.property('evidence') ){ n_ev++;
		     }else{ n_other++; }
		 });
	    rn += ' <small style="color: grey;">'+n_ev+'/'+n_other+'</small>';
	}

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

	// Add activity listener to the new edge.
	new_conn.bind('dblclick',
		      function(connection, event){
			  //alert('edge click: ' + eedge.id());
			  var ann_edit_modal = widgets.edit_annotations_modal;
			  var eam = ann_edit_modal(ecore, manager, eedge.id(),
						   gserv, gconf);
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

    function _rebuild_meta(model_id, raw_annotations){

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
	// Completely replace the old ones in the process.
	if( raw_annotations ){
	    var annotations = [];
	    each(raw_annotations,
		 function(ann_kv_set){
		     var na = new bbop_mme_edit.annotation(ann_kv_set);
		     annotations.push(na);
		 });
	    ecore.annotations(annotations);
	}
    }
	
    // squeeze the inferred individual info out to id -> types
    function _squeezed_inferred(inferred_individuals){
	var inf_indv_lookup = {}; // ids to types
	each(inferred_individuals, // fold in inferred type information
		 function(indv){
		     // Get ID.
		     var inf_iid = indv['id'] || null;
		     if( inf_iid ){
			 inf_indv_lookup[inf_iid] = indv['type'] || [];
		     }
		 });
	return inf_indv_lookup;
    }

    // The core initial layout function.
    function _rebuild_model_and_display(model_id, individuals,
					inferred_individuals,
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

	var inf_indv_lookup = _squeezed_inferred(inferred_individuals);

	// Starting fresh, add everything coming in to the edit model.
	each(individuals, // add nodes
	     function(indv){
		 var unode = ecore.add_node_from_individual(indv);

		 // Add inferred info.
		 var inftypes = inf_indv_lookup[unode.id()];
		 if( inftypes ){ unode.add_types(inftypes, true); }
	     });
	each(facts, // add facts
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
		
		// Edit annotations on doible click.
		_attach_node_dblclick_ann('.demo-window');

		// Make nodes draggable.
		_attach_node_draggable(".demo-window");
		// if( use_waypoints_p ){	
		//     _attach_node_draggable(".waypoint");
		// }
		
		// Make nodes able to use edit dialog.
		_attach_node_click_edit('.open-dialog');

    		// Make normal nodes availables as edge targets.
		_make_selector_target('.demo-window');
    		// if( use_waypoints_p ){ // same for waypoints/virtual nodes
		//     _make_selector_target('.waypoint');
    		// }
		
		// Make the konn class available as source from inside the
		// real node class elements.
		_make_selector_source('.demo-window', '.konn');
		
    	    });	
    }

    // This is a very important core function. It's purpose is to
    // update the local model and UI to be consistent with the current
    // state and the data input.
    function _merge_from_new_data(individuals, inferred_individuals,
				  facts, raw_annotations){

	var inf_indv_lookup = _squeezed_inferred(inferred_individuals);

	// Next, look at individuals/nodes for addition or updating.
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

		     // Add inferred info.
		     var inftypes = inf_indv_lookup[unode.id()];
		     if( inftypes ){
			 ll('add inftypes: ' + inftypes.length);
			 ll('...and? ' + unode.add_types(inftypes, true));
		     }

		     // Wipe node contents; redraw node contents.
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

		     // Add inferred info.
		     var dinftypes = inf_indv_lookup[dyn_node.id()];
		     if( dinftypes ){ dyn_node.add_types(dinftypes, true); }

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
			 refresh_node_id = dyn_node.id();
		     }
		 }

		 // Refresh any node created or updated in the jsPlumb
		 // physical view.
		 if( refresh_node_id ){
		     
		     // Make node active in display.
		     var dnid = refresh_node_id;
		     var ddid = '#' + ecore.get_node_elt_id(dnid);
		     _attach_node_dblclick_ann('.demo-window');
		     _attach_node_draggable(ddid);
		     // //_make_selector_target(ddid);
		     // //_make_selector_source(ddid, '.konn');
		     // // _attach_node_draggable('.demo-window');
		     _attach_node_click_edit(".open-dialog");
		     _make_selector_target('.demo-window');
		     _make_selector_source('.demo-window', '.konn');
		     // _attach_node_click_edit(ddid);
		     // _make_selector_target(ddid);
		     // _make_selector_source(ddid, '.konn');
		     
    		     jsPlumb.repaintEverything();
		     refresh_node_id = null; // reset in case of error
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

	// Reinitiate from all annotations.
	var replacement_annotations = [];
	each(raw_annotations,
	     function(ann_kv_set){
		 var na = new bbop_mme_edit.annotation(ann_kv_set);
		 replacement_annotations.push(na);
	     });
	ecore.annotations(replacement_annotations);
    }
    
    ///
    /// Manager registration and ordering.
    ///
    
    // Internal registrations.
    manager.register('prerun', 'foo', _shields_up);
    manager.register('postrun', 'foo1', _inconsistency_check, 10);
    manager.register('postrun', 'foo2', _refresh_tables, 9);
    manager.register('postrun', 'foo3', _shields_down, 8);
    manager.register('postrun', 'foo4', function(resp, man){ // experimental
	barclient.message({'message_type': resp.message_type(),
			   'message': resp.message(),
			   'intention': resp.intention(),
			   'signal': resp.signal()
			  });
    }, 7);
    manager.register('manager_error', 'foo', function(message_type, message){
	alert('There was a connection error (' +
	      message_type + '): ' + message);
    }, 10);
    
    manager.register('warning', 'foo', function(resp, man){
	alert('Warning: ' + resp.message() + '; ' +
	      'your operation was likely not performed');
    }, 10);
    
    manager.register('error', 'foo', function(resp, man){

	var perm_flag = "InsufficientPermissionsException";
	if( resp.message() && resp.message().indexOf(perm_flag) != -1 ){
	    alert('Error: it seems like you do not have permission to ' +
		  'perform that operation.');
	}else{

	    var ex_msg = '';
	    if( resp.commentary() && resp.commentary().exceptionMsg ){
		ex_msg = ' ['+ resp.commentary().exceptionMsg +']';
	    }
	
	    alert('Error (' + resp.message_type() +'): '+ resp.message() +'; '+
		  'your operation was likely not performed'+ ex_msg);
	}
    }, 10);
    
    // Remote action registrations.
    manager.register('meta', 'foo', function(resp, man){
    	alert('Meta operation successful: ' + resp.message());
    }, 10);

    // Only run the internal function when the filters are passed.
    function _update_filter(resp, man, run_fun){
	
	// Need to extract our own ID from the manager.
	var my_uid = man.user_token();

	// Let's do some checking.
	var r_uid = resp.user_id();
	var r_sig = resp.signal();
	var r_int = resp.intention();
	ll(['uid: ', r_uid, ', sig: ', r_sig, ', int: ', r_int].join(''));
	// BUG/TODO: This will always be wrong since we cannot compare
	// tokens to ids.
	if( r_uid == my_uid ){
	    // Always run things I requiested.
	    ll('TODO: running own request');
	    //run_fun(resp, man);
	}else if( r_int != 'query' ){
	    // Run other people's requests as long as they are not
	    // queries.
	    ll("TODO: running other's non-query request");
	    //run_fun(resp, man);
	}else{
	    // Otherwise, ignore it.
	    ll("ignoring other's query request");
	}
    }

    manager.register('rebuild', 'foo',
		     function(resp, man){
			 // TODO: This function should have the rest
			 // of the function as an argument once the
			 // moderator is on.
			 _update_filter(resp, man);

			 var mid = resp.model_id();
			 var mindividuals = resp.individuals();
			 var mindividuals_i = resp.inferred_individuals();
			 var mfacts = resp.facts();
			 var mannotations = resp.annotations();

			 // Deal with model.
			 // if( ! mid || is_empty(mindividuals) ){
			 //     alert('no data/individuals in inconsistent');
			 // }else{
			 _rebuild_model_and_display(mid,
						    mindividuals,
						    mindividuals_i,
						    mfacts, mannotations);
			 // }
		     }, 10);

    manager.register('merge', 'foo',
		     function(resp, man){
			 // TODO: This function should have the rest
			 // of the function as an argument once the
			 // moderator is on.
			 _update_filter(resp, man);

			 var individuals = resp.individuals();
			 var individuals_i = resp.inferred_individuals();
			 var facts = resp.facts();
			 var annotations = resp.annotations();
			 if( ! individuals ){
			     alert('no data/individuals in merge--unable to do');
			 }else{
			     _merge_from_new_data(individuals,
						  individuals_i,
						  facts, annotations);
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
	    manager.store_model(ecore.get_id());
	    //alert('This functionality has been temporarily suspended.');
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

    var model_json = in_model;

    // Since we're doing this "manually", apply the prerun and postrun
    // "manually".
    _shields_up();
    var init_mid = model_json['id'];
    var init_indvs = model_json['individuals'];
    var init_indvs_i = model_json['individuals_i'] || [];
    var init_facts = model_json['facts'];
    var init_anns = model_json['annotations'] || [];
    _rebuild_model_and_display(init_mid, init_indvs, init_indvs_i,
			       init_facts, init_anns);
    _refresh_tables();
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
	    jQuery(message_area_tab_elt).click(
		function(){
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

    function _on_telekinesis_update(data){
	//function _on_telekinesis_update(uid, iid, top, left){

	var iid = data['item_id'];
	var top = data['top'];
	var left = data['left'];	

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

    if( typeof(global_barista_location) === 'undefined'  ){
	alert('no setup for messaging--not gunna happen');
    }else{
	// TODO: Eventually we'll
	ll('try setup for messaging at: ' + global_barista_location);
	barclient = new bbop_messenger_client(global_barista_location, in_token);
	barclient.register('connect', 'a', _on_connect);
	barclient.register('initialization', 'b', _on_initialization);
	barclient.register('message', 'c', _on_message_update);
	barclient.register('clairvoyance', 'd', _on_clairvoyance_update);
	barclient.register('telekinesis', 'e', _on_telekinesis_update);
	barclient.connect(ecore.get_id());
    }

    //
    jQuery(ping_btn_elt).click(function(){
	barclient.message({'message':
			   '<strong>please contact me for discussion</strong>',
			   'message_type': 'success'}
			 );
    });

    //
    jQuery(model_ann_elt).click(function(){
	var ann_edit_modal = widgets.edit_annotations_modal;
	var eam = ann_edit_modal(ecore, manager, ecore.get_id(),
				 gserv, gconf);
	eam.show();
    });

    // 
    jQuery(test_btn_elt).click(function(){
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
    });

    // Toggle the visibility of the part_of connectors. 
    var viz_p = true;
    jQuery(toggle_part_of_elt).click(function(){
	
	// First, collect all of the part_of connections.
	var poc = {};
	each(ecore.get_edges(),
	     function(edge_id){
		 var edge = ecore.get_edge(edge_id);
		 //if( edge && edge.relation() == 'part_of' ){
		 if( edge && edge.relation() == 'BFO:0000050' ){
		     var conn_id =
			 ecore.get_connector_id_by_edge_id(edge.id());
		     poc[conn_id] = true;
		 }
	     });	    
	
	// Switch viz.
	if( viz_p ){ viz_p = false; }else{ viz_p = true;  }
	
	// Toggle viz on and off.
	each(instance.getConnections(),
	     function(conn){
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
    
    // Let the canvas (div) underneath be dragged around in an
    // intuitive way.
    bbop_draggable_canvas(graph_container_id);

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
    
    // Finally, we're going to put up a giant warning for people to
    // remind them that this is alpha software.
    var wrn_txt = [
	'<p>',
	'Please understand the following before experimenting with the MME.',
	'</p>',
	'<p>',
	'<ol>',
	'<li>',
	'If you wish to save or continue your experimentation, you should regularly click <strong>[Model] > [Save]</strong>, which will the model to the disk on the server.',
	'</li>',
	'<li>',
	'If your work is particularly valuable, you should perform an extra step and click <strong>[Model] > [Export]</strong>, which will allow you to save your work in an export format to your local disk.',
	'</li>',
	'<li>',
	'Other people can edit your work; ff you want to preserve something in particular, see the previous note.',
	'</li>',
	'<li>',
	'Be aware that things can and will go wrong and <strong>work can be lost</strong> at any stage.',
	'</li>',
	'<li>',
	'While there are many <a href="https://github.com/kltm/go-mme#go-mme-editor">known</a> <a href="https://github.com/kltm/go-mme/issues?state=open">issues</a>, for the time being we are mostly interested in feedback concerning the functional possibilites of the base model.',
	'</li>',
	'</ol>',
	'</p>',
	'<p>',
	'</p>',
	'<p>',
	'</p>',
	'<p>',
	'</p>'
   ];
    var wrn = new bbop_mme_widgets.contained_modal(null,
						   '<strong>Read before using</strong>',
						   wrn_txt.join(''));
    wrn.show();
};

///
/// Startup.
///
/// TODO: It would be good to have a general standard registry set so
/// that the bits here and above share the same registry code. Or
/// maybe I can just apss the manager in?
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

	    // This manager bootstraps the editor by fetching the
	    // model out of Minerva.
	    var manager = new bbop_mme_manager2(global_barista_location,
						global_minerva_definition_name,
						start_token);

	    // Have a manager and model id, defined a success callback
	    // and try and get the full model to start the bootstrap.
	    manager.register('manager_error', 'foo',
			     function(message_type, message){
				 alert('There was an early connection error (' +
				       message_type + '): ' + message);
			     }, 10);
	    manager.register('error', 'foo',
			     function(resp, man){
				 
				 var ex_msg = '';
				 if( resp.commentary() &&
				     resp.commentary().exceptionMsg ){
					 ex_msg = ' ['+
					     resp.commentary().exceptionMsg +']';
				     }
				 alert('Error (' +
				       resp.message_type() + '): ' +
				       resp.message() + '; ' +
				       'your early operation was likely not performed'+
				       ex_msg);
			     }, 10);
	    manager.register('rebuild', 'foo',
			     function(resp, man){
				 //alert('in');
				 // Replace placeholder at top level for debug.
				 global_model = resp.data();
				 // Bootstrap rest of session.
				 MMEnvInit(resp.data(),
					   global_known_relations,
					   start_token);
			     });
	    manager.get_model(global_id);
	    //var rr = manager.get_model(global_id);
	    //console.log('rr: ' + rr);

	    // When all is said and done, let's also fillout the user
	    // name just for niceness. This is also a test of CORS in
	    // express.
	    if( start_token ){
	    	var user_info_loc = global_barista_location +
	    	    "/user_info_by_token/" + start_token;
	    	jQuery.ajax({
	    	    'type': "GET",
	    	    'url': user_info_loc,
	    	    'dataType': "json",
	    	    'error': function(){alert('had a user info error--oops!');},
	    	    'success': function(data){
			jQuery('#user_name_info').replaceWith(data['nickname']);
		    }
	    	});
	    }
	}

});
