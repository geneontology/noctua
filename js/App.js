////
//// ...
////

///
/// Application initializer.
/// Application logic.
/// Initialze with (optional) incoming data ans setup the GUI.
///

var MMEnvInit = function(in_model, in_server_base){
    
    // TODO: Add this as an argument.
    //var use_waypoints_p = true;
    var use_waypoints_p = false;
    
    var logger = new bbop.logger('app');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;
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
    var manager = new bbop_mme_manager(in_server_base);

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
    // Button contact points.
    // var add_btn_local_id = 'adder_local';
    // var add_btn_local_elt = '#' + add_btn_local_id;
    // var add_btn_remote_id = 'adder_remote';
    // var add_btn_remote_elt = '#' + add_btn_remote_id;
    var simple_enb_auto_id = 'simple_enb_auto';
    var simple_enb_auto_elt = '#' + simple_enb_auto_id;
    var simple_act_auto_id = 'simple_act_auto';
    var simple_act_auto_elt = '#' + simple_act_auto_id;
    var simple_occ_auto_id = 'simple_occ_auto';
    var simple_occ_auto_elt = '#' + simple_occ_auto_id;
    var simple_add_btn_id = 'simple_adder_button';
    var simple_add_btn_elt = '#' + simple_add_btn_id;
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
    var help_btn_id = 'action_help';
    var help_btn_elt = '#' + help_btn_id;
    // A hidden for to communicate with the outside world.
    var action_form_id = 'invisible_action';
    var action_form_elt = '#' + action_form_id;
    var action_form_data_id = 'invisible_action_data';
    var action_form_data_elt = '#' + action_form_data_id;
    // Hidden reusable modal dialog for nodes.
    var modal_node_id = 'modal_node_dialog';
    var modal_node_elt = '#' + modal_node_id;
    var modal_node_body_id = 'modal_node_dialog_body';
    var modal_node_body_elt = '#' + modal_node_body_id;
    var modal_node_title_id = 'modal_node_dialog_title';
    var modal_node_title_elt = '#' + modal_node_title_id;
    // Hidden reusable modal dialog for edges.
    var modal_edge_id = 'modal_edge_dialog';
    var modal_edge_elt = '#' + modal_edge_id;
    var modal_edge_body_id = 'modal_edge_dialog_body';
    var modal_edge_body_elt = '#' + modal_edge_body_id;
    var modal_edge_title_id = 'modal_edge_dialog_title';
    var modal_edge_title_elt = '#' + modal_edge_title_id;
    var modal_edge_save_id = 'modal_edge_dialog_save';
    var modal_edge_save_elt = '#' + modal_edge_save_id;
    // Hidden reusable modal for action blocking.
    var modal_blocking_id = 'modal_blocking';
    var modal_blocking_elt = '#' + modal_blocking_id;
    var modal_blocking_body_id = 'modal_blocking_body';
    var modal_blocking_body_elt = '#' + modal_blocking_body_id;
    var modal_blocking_title_id = 'modal_blocking_title';
    var modal_blocking_title_elt = '#' + modal_blocking_title_id;

    // Some experimental stuff for optional messaging server.
    var message_area_id = 'message_area';
    var message_area_elt = '#' + message_area_id;
    var message_area_tab_id = 'message_area_tab';
    var message_area_tab_elt = '#' + message_area_tab_id;
    var remote_area_id = 'remote_area';
    var remote_area_elt = '#' + remote_area_id;

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

	instance.draggable(foo, {stop: _on_drag_stop});
    }

    function _make_selector_target(sel){
	instance.makeTarget(jsPlumb.getSelector(sel), {
    				anchor:"Continuous",
				isTarget: true,
				//maxConnections: -1,
				connector:[ "Bezier", { curviness: 25 } ]
    			    });
    }

    function _make_selector_source(sel, subsel){
        instance.makeSource(jsPlumb.getSelector(sel), {
                                filter: subsel,
                                anchor:"Continuous",
				isSource: true,
				//maxConnections: -1,
                                connector:[ "Bezier", { curviness: 25 } ]
                            });
    }
    
    function _make_selector_editable(sel){

	// TODO: This is likely somewhere else later.
	function edit_node_by(enode){

	    // TODO: Jimmy out information about this node.
	    var tid = enode.id();
	    var ttype = enode.existential();

	    // Rewrite modal contents with node info and editing
	    // options.
	    var dbid = bbop.core.uuid();
	    jQuery(modal_node_title_elt).empty();
	    jQuery(modal_node_title_elt).append('Node: ' + tid);
	    jQuery(modal_node_body_elt).empty();
	    var appy = [
		'<h4>Information</h4>',
		'<p>type: ' + ttype + '</p>',
		'<hr />',
		'<h4>Operations</h4>',
		'<p>',
		'<button id="'+ dbid +'" type="button" class="btn btn-danger">',
		'Delete node',
		'</button>',
		'</p>'
	    ];
	    jQuery(modal_node_body_elt).append(appy.join(''));

	    // Add the deletion callback
	    jQuery('#' + dbid).click(
		function(evt){
		    evt.stopPropagation();
		    ll('deleteing node: ' + tid);
		    //alert('node deletion not yet supported on the server');

		    // Close modal.
		    jQuery(modal_node_elt).modal('hide');

		    // Trigger the delete--hopefully inconsistent.
		    manager.remove_individual(ecore.get_id(), tid);
		});

	    // Display modal.
	    var modal_node_opts = {
	    };
	    jQuery(modal_node_elt).modal(modal_node_opts);
	}

	// Add this event to whatever we got called in.
	jQuery(sel).click(
	    function(evnt){
		evnt.stopPropagation();

		// TODO: Resolve the event into the edit core node.
		var target_elt = jQuery(evnt.target);
		var parent_elt = target_elt.parent();
		var parent_id = parent_elt.attr('id');
		var enode = ecore.get_node_by_elt_id(parent_id);
		if( enode ){		    
		    // TODO: Pass said node to be edited.
		    edit_node_by(enode);
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

    	var new_conn = instance.connect(
    	    { // remember that edge ids and elts ids are the same 
    	    	'source': ecore.get_node_elt_id(sn),
    	    	'target': ecore.get_node_elt_id(tn),
		//'label': 'foo' // works
		'anchor': "Continuous",
		'connector': ["Bezier", { curviness: 75 } ],
		'paintStyle': {
		    strokeStyle: clr,
		    lineWidth: 5
		},
		'overlays': [ // does not!?
		    ["Label", {'label': rn,
			       'location': 0.5,
			       'cssClass': "aLabel",
			       'id': 'label' } ],
		    ["Arrow", {'location': -4}]
		 ]
	    //}, {'PaintStyle': { strokeStyle: clr, lineWidth: 5}});
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
	jQuery(modal_blocking_elt).modal({'backdrop': 'static',
					  'keyboard': false,
					  'show': true});
    }
    
    // Release interface when transaction done.
    function _shields_down(){
	jQuery(modal_blocking_elt).modal('hide');
    }

    // Update/repaint the table.
    function _refresh_tables(){
	ll('refreshing tables/info');
	widgets.repaint_info(ecore, aid, table_info_div);
	widgets.repaint_exp_table(ecore, aid, table_exp_div);
	widgets.repaint_edge_table(ecore, aid, table_edge_div);
    }

    function _rebuild_meta(model){

	// Deal with ID(s).
	// First and only setting of this right now.
	// Override if there is real data.
	if( model['id'] ){
	    ecore.add_id(model['id']);
	    ll('model id from data: ' + ecore.get_id());
	}else if( typeof(global_id) !== 'undefined' && global_id ){
	    ecore.add_id(global_id);
	    ll('model id from environment: ' + ecore.get_id());
	}else{
	    ll('model id missing');
	    throw new Error('missing model id');
	}
    }
	
    // The core initial layout function.
    function _rebuild_model_and_display(model){

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
	_rebuild_meta(model);

	var individuals = model['individuals'];

	// Starting fresh, add everything coming in to the edit model.
	each(individuals,
	     function(indv){
		 ecore.add_node_from_individual(indv);
		 ecore.add_edges_from_individual(indv, aid);
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

	// Add additional information if the waypoint flag is set.
	if( use_waypoints_p ){
	
	    alert('this method does not (yet) support rels on edges');

	    // Add waypoint virtual nodes.
	    each(layout['virtual_nodes'],
		 function(litem, index){
		     var id = litem['id'];
		     var raw_x = litem['x'];
		     var raw_y = litem['y'];

		     var vn = new bme_node(id, 'virtual');
		     vn.x_init(_vbox_left(raw_x));
		     vn.y_init(_vbox_top(raw_y));
		     
		     ecore.add_node(vn);
		 });	

	    // Add additional waypoint path information to the edges.
	    each(layout['paths'],
    		 function(path){
		     var nodes = path['nodes'];
		     //var waypoints = path['waypoints']; // not right now?
		     for(var ni = 0; ni < (nodes.length -1); ni++ ){
			 var sub_id = nodes[ni];
			 var obj_id = nodes[ni +1];
			 
			 var new_vedge = new bme_edge(sub_id, null, obj_id);
			 ecore.add_edge(new_vedge);
		     }
		 });
	}

	// For our intitialization/first drawing, suspend jsPlumb
	// stuff while we get a little work done rebuilding the UI.
	instance.doWhileSuspended(
    	    function(){

		// Initial render of the graph.
    		each(ecore.get_nodes(),
    		     function(enode_id, enode){
			 // Add if a "real" node.
    			 if( enode.existential() == 'real' ){
    			     widgets.add_enode(ecore, enode, aid, graph_div);
    			 }else{
			     // == 'virtual'; will not be used if no waypoints.
			     widgets.add_virtual_node(ecore, enode,
						      aid, graph_div);
    			 }
    		     });
    		// Now let's try to add all the edges/connections.
    		each(ecore.get_edges(),
    		     function(eeid, eedge){
    			 _connect_with_edge(eedge);
    		     });
		
		// Make nodes draggable.
		_make_selector_draggable(".demo-window");
		if( use_waypoints_p ){	
		    _make_selector_draggable(".waypoint");
		}
		
    		// Make normal nodes availables as edge targets.
		_make_selector_target('.demo-window');
    		if( use_waypoints_p ){ // same for waypoints/virtual nodes
		    _make_selector_target('.waypoint');
    		}
		
		// Make the konn class available as source from inside the
		// real node class elements.
		_make_selector_source('.demo-window', '.konn');
		
		// Make nodes able to use edit dialog.
		_make_selector_editable(".open-dialog");
		
    	    });	
    }

    // This is a very important core function. It's purpose is to
    // update the loval model and UI to be consistent with the current
    // state and the data input.
    function _merge_from_individuals(individuals){

	// First look at individuals/nodes for addition or updating.
	each(individuals,
	     function(ind){
		 var update_node = ecore.get_node_by_individual(ind);
		 if( update_node ){
		     // TODO: Update node. This is preferred since
		     // deleting it would mean that all the connections
		     // would have to be reconstructed as well.
		     // ecore.merge_node(ind)
		     // wipe_node_contents()
		     // redraw_node_contents()
		     ll('update node: cannot yet; suggest refreshing');
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
			 
			 // Make node active in display.
			 var dnid = dyn_node.id();
			 var ddid = '#' + ecore.get_node_elt_id(dnid);
			 _make_selector_draggable(ddid);
			 //_make_selector_target(ddid);
			 //_make_selector_source(ddid, '.konn');
			 _make_selector_editable(".open-dialog");
			 // _make_selector_draggable('.demo-window');
			 _make_selector_target('.demo-window');
			 _make_selector_source('.demo-window', '.konn');
			 
    			 jsPlumb.repaintEverything();	
		     }
		 }
	     });
	
	// Now look at individuals/edges (by individual) for
	// purging and reinitiation.
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
		 
		 // Add all edges from the new individuals to the
		 // model.
		 var redges = ecore.add_edges_from_individual(ind, aid);
		 
		 // Now add them to the display.
		 each(redges,
		      function(redge){
			  _connect_with_edge(redge);
		      });
	     });
    }
    
    ///
    /// Manager registration and ordering.
    ///
    
    // Internal registrations.
    manager.register('prerun', 'foo', _shields_up);
    manager.register('postrun', 'fooA', _refresh_tables, 10);
    manager.register('postrun', 'fooB', _shields_down, 9);
    manager.register('postrun', 'fooC', function(){ // experimental
			 if( msngr ){	
			     // var msg = 'another client completed an op: ' + 
			     // 	 'please refresh';
			     // TODO/BUG: Get into a refresh war pretty
			     // easy since you trigger an inconsistent
			     // on refresh--need a better measure.
			     var msg = 'FYI: another client completed an op'; 
			     msngr.info(msg);
			 }
		     }, 8);
    manager.register('manager_error', 'foo',
		     function(message_type, message){
			 alert('There was a connection error (' +
			       message_type + '): ' + message);
		     }, 10);

    // Remote action registrations.
    manager.register('success', 'foo',
		     function(resp, man){
			 alert('Operation successful (' +
			       resp.message_type() + '): ' +
			       resp.message());
		     }, 10);

    manager.register('warning', 'foo',
		     function(resp, man){
			 alert('Warning (' +
			       resp.message_type() + '): ' +
			       resp.message() + '; ' +
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

    manager.register('inconsistent', 'foo',
		     function(resp, man){
			 var dmodel = resp.data();

			 // Deal with model.
			 if( ! dmodel || ! dmodel['id'] ||
			     ! dmodel['individuals'] ){
			     alert('no data/individuals in inconsistent');
			 }else{
			     _rebuild_model_and_display(dmodel);
			 }
		     }, 10);

    manager.register('merge', 'foo',
		     function(resp, man){
			 var individuals = resp.data();
			 if( ! individuals ){
			     alert('no data/individuals in merge');
			 }else{
			     _merge_from_individuals(individuals);
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
			  widgets.render_edge_modal(aid, modal_edge_title_elt,
						    modal_edge_body_elt,
						    snode.id(), tnode.id());
			  jQuery(modal_edge_elt).modal({});

		  	  // Add action listener to the save button.
		  	  function _rel_save_button_start(){

		  	      //
		  	      //ll('looks like edge (in cb): ' + eeid);
		  	      var qstr ='input:radio[name=rel_val]:checked';
		  	      var rval = jQuery(qstr).val();
		  	      ll('rval: ' + rval);

		  	      // // TODO: Should I report this too? Smells a
		  	      // // bit like the missing properties with
		  	      // // setParameter/s(),
		  	      // // Change label.
		  	      // //conn.setLabel(rval); // does not work!?
		  	      // conn.removeOverlay("label");
		  	      // conn.addOverlay(["Label", {'label': rval,
		  	      // 			 'location': 0.5,
		  	      // 			 'cssClass': "aLabel",
		  	      // 			 'id': 'label' } ]);
			      
		  	      // Close modal.
		  	      jQuery(modal_edge_elt).modal('hide');
			      
			      manager.add_fact(ecore.get_id(), snode.id(),
					       tnode.id(), rval);
			  }
			  // Remove the previous save listeners.
			  jQuery(modal_edge_save_elt).unbind('click');
			  // And add the new one for this instance.
			  jQuery(modal_edge_save_elt).click(
		  	      function(evt){
		  		  evt.stopPropagation();
		  		  _rel_save_button_start();
		  	      });
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
    /// Activate autocomplete in input boxes.
    /// Add the remote responders.
    ///

    // Storage for the actual selected identifiers.
    var simple_enb_auto_val = null;
    var simple_act_auto_val = null;
    var simple_occ_auto_val = null;

    // bioentity
    var simple_enb_auto_args = {
    	'label_template': '{{bioentity_label}} ({{bioentity}})',
    	'value_template': '{{bioentity_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['bioentity_label']);
	    simple_enb_auto_val = doc['bioentity'] || null;
    	}
    };
    // molecular function
    var simple_act_auto_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
	    simple_act_auto_val = doc['annotation_class'] || null;
    	}
    };
    // location/occurs_in
    var simple_occ_auto_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
	    simple_occ_auto_val = doc['annotation_class'] || null;
    	}
    };

    var simple_enb_auto =
	new bbop.widget.search_box(gserv, gconf, simple_enb_auto_id,
				   simple_enb_auto_args);
    simple_enb_auto.add_query_filter('document_category', 'bioentity');
    simple_enb_auto.set_personality('bioentity');

    var simple_act_auto =
	new bbop.widget.search_box(gserv, gconf, simple_act_auto_id,
				   simple_act_auto_args);
    simple_act_auto.add_query_filter('document_category', 'ontology_class');
    // simple_act_auto.add_query_filter('regulates_closure_label',
    // 				     'molecular_function');
    simple_act_auto.set_personality('ontology');

    var simple_occ_auto =
	new bbop.widget.search_box(gserv, gconf, simple_occ_auto_id,
				   simple_occ_auto_args);
    simple_occ_auto.add_query_filter('document_category', 'ontology_class');
    simple_occ_auto.set_personality('ontology');

    ///
    /// Add GUI button activity.
    ///

    // Add new remote node button.
    jQuery(simple_add_btn_elt).click(
    	function(){
    	    // var enb = simple_enb_auto.content() || '';
    	    // var act = simple_act_auto.content() || '';
    	    // var occ = simple_occ_auto.content() || '';
    	    var enb = simple_enb_auto_val || '';
    	    var act = simple_act_auto_val || '';
    	    var occ = simple_occ_auto_val || '';

    	    if( act == '' ){
    		alert('Must select activity field from autocomplete list.');
    	    // }else if( ! mfn_val_remote ||
	    // 	      ! bio_val_remote ||
	    // 	      ! loc_val_remote ){
    	    // 	alert('You actually need to have selected your ' +
	    // 	      'values from the dropdowns in the autocompletes.');
    	    }else{
		// Wipe controls' state, internal and external.
		simple_enb_auto_val = null;
    		simple_act_auto_val = null;
    		simple_occ_auto_val = null;
		jQuery(simple_enb_auto_elt).val('');
    		jQuery(simple_act_auto_elt).val('');
    		jQuery(simple_occ_auto_elt).val('');

		// Send message to server.
		manager.add_simple_composite(ecore.get_id(), act, enb, occ);
    	    }
    	}
    );

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
    	});

    // Help button.
    jQuery(help_btn_elt).click(
    	function(){
	    alert('In prototypes nobody can hear you scream.');
    	});

    // Let the canvas (div) underneath be dragged around in an
    // intuitive way.
    bbop_draggable_canvas(graph_container_id);

    ///
    /// Load the incoming graph into something useable for population
    /// of the editor.
    ///

    var model_json = in_model;

    // Since we're doing this "manually", apply the prerun and postrun
    // "manually".
    _shields_up();
    _rebuild_model_and_display(model_json);
    _refresh_tables();
    _shields_down();

    ///
    /// Optional: experiment with the messaging server.
    ///

    // ...
    function _zero_fill(n){
	var ret = n;
	if( ret < 10 ){
	    ret = '0' + ret;
	}
	return ret;
    }
    
    // Allow the message board to be cleared.
    var new_list_elt = null;
    function _on_connect(){
	jQuery(message_area_elt).empty();
	var new_list_id = bbop.core.uuid();
	new_list_elt = '#' + new_list_id;
	jQuery(message_area_elt).append('<ul id="' + new_list_id + '"></ul>');
    }

    function _on_info_update(str){

	// Add to the top of the message
	// queue.
	var now = new Date();
	var dts = now.getFullYear() + '/' +
	    _zero_fill(now.getMonth() +1) + '/' +
	    _zero_fill(now.getDate()) + ' ' +
	    _zero_fill(now.getHours()) + ':' +
	    _zero_fill(now.getMinutes()) + ':' +
	    _zero_fill(now.getSeconds());
	jQuery(new_list_elt).prepend('<li>'+ dts +': '+ str +'</li>');
		
	//alert('someone did something');
	// Skip hightlighting if we're already over it.
	if( jQuery(message_area_tab_elt).parent().hasClass('active') ){
	    // Do not change.
	}else{
	    // Highlight.
	    jQuery(message_area_tab_elt).addClass('bbop-mme-new-info');
	    // Clear 
	    jQuery(message_area_tab_elt).unbind('click');
	    jQuery(message_area_tab_elt).click(
		function(){
		    jQuery(message_area_tab_elt).removeClass('bbop-mme-new-info');
		});
	}	
    }

    if( typeof(global_message_server) === 'undefined'  ){
	ll('no setup for messaging--passing');
    }else{
	//var msgloc_srv = 'http://localhost:3400';
	ll('try setup for messaging at: ' + global_message_server);
	msngr = new bbop_messenger_client(global_message_server,
					  _on_connect,
					  _on_info_update);
	msngr.connect(ecore.get_id());
    }
    jQuery(ping_btn_elt).click(
	function(){
	    if( msngr ){
		msngr.info('"hello" from another client for ' + ecore.get_id());
	    }
	}
    );
};

// Start the day the jsPlumb way.
jsPlumb.ready(function(){
		  // Only roll if the env is correct.
		  if( typeof(global_id) !== 'undefined' &&
		      typeof(global_server_base) !== 'undefined' ){
			  if( typeof(global_model) !== 'undefined' &&
				    global_model ){
				  MMEnvInit(global_model, global_server_base);
			  }else{
			      alert('nothing loadable found');
			      //throw new Error('nothing loadable found');
			  }
		      }else{
			  alert('environment not ready');
			  //throw new Error('environment not ready');
		      }
	      });
