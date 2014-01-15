////
//// ...
////

///
/// Application initializer.
/// Application logic.
/// Initialze with (optional) incoming data ans setup the GUI.
///

var MMEnvInit = function(in_model){
    
    // TODO: Add this as an argument.
    //var use_waypoints_p = true;
    var use_waypoints_p = false;
    
    var logger = new bbop.logger('mme');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;
    var what_is = bbop.core.what_is;
    var bme_core = bbop_mme_edit.core;
    var bme_edge = bbop_mme_edit.edge;
    var bme_node = bbop_mme_edit.node;
    
    // Help with strings and colors--configured separately.
    var aid = new bbop_mme_context();

    // Create the core model.
    //var bbop_mme_edit = require('./js/bbop-mme-edit');
    var ecore = new bme_core();

    // GOlr location and conf setup.
    var gserv = 'http://golr.berkeleybop.org/';
    var gconf = new bbop.golr.conf(amigo.data.golr);

    // Div contact points.
    var graph_container_id = 'main_exp_graph_container';
    var graph_container_div = '#' + graph_container_id;
    var graph_id = 'main_exp_graph';
    var graph_div = '#' + graph_id;
    var table_id = 'main_exp_table';
    var table_div = '#' + table_id;
    var control_id = 'main_exp_gui';
    var control_div = '#' + control_id;
    // Button contact points.
    var add_btn_local_id = 'adder_local';
    var add_btn_local_elt = '#' + add_btn_local_id;
    var add_btn_remote_id = 'adder_remote';
    var add_btn_remote_elt = '#' + add_btn_remote_id;
    var zin_btn_id = 'zoomin';
    var zin_btn_elt = '#' + zin_btn_id;
    var zret_btn_id = 'zoomret';
    var zret_btn_elt = '#' + zret_btn_id;
    var zout_btn_id = 'zoomout';
    var zout_btn_elt = '#' + zout_btn_id;
    var save_btn_id = 'action_save';
    var save_btn_elt = '#' + save_btn_id;
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

    // Right, but we also want real data and
    // meta-information.
    function _node_to_enode(node){
	
	var id = node.id();
	var enode = new bme_node(id);

	// TODO: Convert meta-structure to JSON-LD type structure.

	// var ret = {
	//     'enabled_by': '',
	//     'activity': '',
	//     'unknown': [],
	//     'process': '',
	//     'location': []
	// };

	// ll('new enode id: ' + id);
	// ll('node: ' + bbop.core.dump(node));
	// var meta = node.metadata();
	// if( meta ){
	//     if( meta['enabled_by'] ){
	// 	enode.enabled_by(meta['enabled_by']);
	//     }
	//     if( meta['unknown'] ){
	// 	enode.unknown(meta['unknown']);
	//     }
	//     if( meta['activity'] ){
	// 	enode.activity(meta['activity']);
	//     }
	//     if( meta['process'] ){
	// 	enode.process(meta['process']);
	//     }
	//     if( meta['location'] ){
	// 	enode.location(meta['location']);
	//     }
	// }

	return enode;
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
    /// Load the incoming graph into something useable for population
    /// of the editor.
    ///

    // var id = global_id;
    // var label = global_label;
    var model_json = in_model;

    // If we are actually working with a server model instead of a
    // graph, make a conversion first so we can work with things like
    // layout, etc.

    // Convert the JSON-LD lite model into the edit core.
    function _process_individuals(indv){

	// Add individual to edit core if properly structured.
	var iid = indv['id'];
	if( iid ){
	    //var nn = new bbop.model.node(indv['id']);
	    //var meta = {};
	    //ll('indv');
	    
	    // See if there is type info that we want to add.
	    var itypes = indv['type'] || [];
	    if( bbop.core.what_is(itypes) != 'array' ){
		throw new Error('types is wrong');
	    }
	    
	    var ne = new bme_node(iid, itypes);
	    ecore.add_edit_node(ne);
	    
	    // Now, let's probe the model to see what edges
	    // we can find.
	    var possible_rels = aid.all_known();
	    each(possible_rels,
		 function(rel_to_try){
		     if( indv[rel_to_try] && indv[rel_to_try].length ){
			 
			 // Cycle through each of the found
			 // rels.
			 var found_rels = indv[rel_to_try];
			 each(found_rels,
			      function(rel){
				  var tid = rel['id'];
				  var rt = rel['type'];
				  if( tid && rt && rt == 'NamedIndividual'){
				      var en =
					  new bme_edge(iid,rel_to_try,tid);
				      ecore.add_edit_edge(en);
				  }
			      });
		     }
		 });
	}
    }
    each(model_json['individuals'],
	 function(indv){
	     _process_individuals(indv);
	 });

    ///
    /// We now have a well-defined edit core. Let's try and add some
    /// layout information if we can: edit core topology to graph.
    ///

    // Extract the gross layout.
    var g = ecore.to_graph();
    var r = new bbop.layout.sugiyama.render();
    var layout = r.layout(g);

    // Add the initial layout position to the edit nodes.
    each(layout['nodes'],
	 function(litem, index){
	     var id = litem['id'];
	     var raw_x = litem['x'];
	     var raw_y = litem['y'];
	     var en = ecore.get_edit_node(id);
	     en.x_init(_box_left(raw_x));
	     en.y_init(_box_top(raw_y));
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
		 
		 ecore.add_edit_node(vn);
	     });	

	// Add additional waypoint path information to the edges.
	each(layout['paths'],
    	     function(path){
		 var nodes = path['nodes'];
		 //var waypoints = path['waypoints']; // don't need right now?
		 for(var ni = 0; ni < (nodes.length -1); ni++ ){
		     var sub_id = nodes[ni];
		     var obj_id = nodes[ni +1];
		     
		     var new_vedge = new bme_edge(sub_id, null, obj_id);
		     ecore.add_edit_edge(new_vedge);
		 }
	     });
    }

    ///
    /// Editor rendering functions.
    ///

    // Add edit model contents to descriptive table.
    function _edit_core_repaint_table(){

	// First, lets get the headers that we'll need by poking the
	// model and getting all of the possible categories.	
	var cat_list = [];
	each(ecore.get_edit_nodes(),
	     function(enode_id, enode){
		 each(enode.types(),
		      function(in_type){
			   cat_list.push(aid.categorize(in_type));
		      });
	     });
	// Dedupe list.
	var tmph = bbop.core.hashify(cat_list);
	cat_list = bbop.core.get_keys(tmph);

	// If we actually got something, render the table. Otherwise,
	// a message.
	if( bbop.core.is_empty(cat_list) ){
	    
	    // Add to display.
	    jQuery(table_div).empty();
	    jQuery(table_div).append('<p><h4>no instances</h4></p>');

	}else{
	    
	    // Sort list according to known priorities.
	    cat_list = cat_list.sort(
		function(a, b){
		    return aid.priority(b) - aid.priority(a);
		});
	    
	    // Convert the ids into readable headers.
	    var nav_tbl_headers = [];
	    each(cat_list,
		 function(cat_id){
		     nav_tbl_headers.push(aid.readable(cat_id));
		 });
	    
	    //	var nav_tbl_headers = cat_list;
	    //	    ['enabled&nbsp;by', 'activity', 'unknown', 'process', 'location'];
	    
	    var nav_tbl =
		new bbop.html.table(nav_tbl_headers, [],
				    {'class': ['table', 'table-bordered',
					       'table-hover',
					       'table-condensed'].join(' ')});
	    
	    //each(ecore.get_edit_nodes(),
	    each(ecore.edit_node_order(),
		 function(enode_id){
		     var enode = ecore.get_edit_node(enode_id);
		     if( enode.existential() == 'real' ){
			 
			 // Now that we have an enode, we want to mimic
			 // the order that we created for the header
			 // (cat_list). Start by binning the types.
			 var bin = {};
			 each(enode.types(),
			      function(in_type){
				  var cat = aid.categorize(in_type);
				  if( ! bin[cat] ){ bin[cat] = []; }
				  bin[cat].push(in_type);
			      });
			 
			 // Now unfold the binned types into the table row
			 // according to the sorted order.
			 var table_row = [];
			 each(cat_list,
			      function(cat_id){
				  var accumulated_types = bin[cat_id];
				  var cell_cache = [];
				  each(accumulated_types,
				       function(atype){
					   var tt = bme_type_to_text(atype);
					   cell_cache.push(tt);
				       });
				  table_row.push(cell_cache.join('<br />'));
			      });
			 nav_tbl.add_to(table_row);		     
		     }
		 });
	    
	    // Add to display.
	    jQuery(table_div).empty();
	    jQuery(table_div).append(nav_tbl.to_string());
	}
    }

    function _add_enode_to_display(enode){

	// Node as table nested into bbop.html div.
	var div_id = ecore.get_edit_node_elt_id(enode.id());
	var style_str = 'top: ' + enode.y_init() + 'px; ' + 
	    'left: ' + enode.x_init() + 'px;';
	ll('style: ' + style_str);
	var w = new bbop.html.tag('div',
				  {'id': div_id,
				   'class': 'demo-window',
				   'style': style_str});

	// Takes a core edit node as the argument, categorize the
	// contained types, order them.
	function _enode_to_stack(enode){
	
	    // Attach a category to each type.
	    var bin_stack = [];
	    each(enode.types(),
		 function(in_type){
		     var bin = aid.categorize(in_type);
		     bin_stack.push({'category': bin, 'type': in_type});
		 });
	    
	    // Sort the types within the stack according to the known
	    // type priorities.
	    bin_stack = bin_stack.sort(
		function(a, b){
		    return aid.priority(b) - aid.priority(a);
		});

	    return bin_stack;
	}

	// Create a colorful label stack into an individual table.
	var enode_stack_table = new bbop.html.tag('table', {});
	each(_enode_to_stack(enode),
	     function(item){
		 var trstr = '<tr style="background-color: ' +
		     aid.color(item['category']) + ';"><td>' 
		     + bme_type_to_text(item['type']) + '</td></tr>';   
		 enode_stack_table.add_to(trstr);
	     });
	w.add_to(enode_stack_table);

	// Box to drag new connections from.	
	var konn = new bbop.html.tag('div', {'class': 'konn'});
	w.add_to(konn);
	
	// Box to drag new connections from.	
	var opend = new bbop.html.tag('div', {'class': 'open-dialog'});
	w.add_to(opend);
	
	jQuery(graph_div).append(w.to_string());
    }

    function _edit_core_init_display(){

	jQuery(graph_div).empty();

	// For all of the enodes we've collected.
	each(ecore.get_edit_nodes(),
	     function(enode_id, enode){

		 if( enode.existential() == 'real' ){ // if a "real" node

		     _add_enode_to_display(enode);

		 }else{ // == 'virtual'; will not be used if added no waypoints
    		     
		     var div_id = ecore.get_edit_node_elt_id(enode.id());
		     var style_str = 'top: ' + enode.y_init() + 'px; ' + 
			 'left: ' + enode.x_init() + 'px;';
		     var v = new bbop.html.tag('div',
					       {'id': div_id,
						'class': 'waypoint',
						'style': style_str});
		     jQuery(graph_div).append(v.to_string());
		 }
	 });
    }

    ///
    /// Now that they are physically extant, add JS stuff.
    ///    

    function _make_selector_draggable(sel){
	var foo = jsPlumb.getSelector(sel);
	instance.draggable(foo);
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
	    jQuery(modal_node_body_elt).append('<h4>Information</h4>');
	    jQuery(modal_node_body_elt).append('<p>type: ' + ttype + '</p>');
	    jQuery(modal_node_body_elt).append('<hr />');
	    jQuery(modal_node_body_elt).append('<h4>Operations</h4>');
	    jQuery(modal_node_body_elt).append('<p><button id="' + dbid + '" type="button" class="btn btn-danger">Delete node</button></p>');

	    // Add the deletion callback
	    jQuery('#' + dbid).click(
		function(evt){
		    evt.stopPropagation();

		    // Delete all UI connections associated with
		    // node. This also triggers the "connectioDetached"
		    // event, so the edges are being removed from the
		    // model at the same time.
		    var nelt = ecore.get_edit_node_elt_id(tid);
		    instance.detachAllConnections(nelt);
		    //instance.removeAllEndpoints(nelt);

		    // Delete node from UI/model.
		    jQuery('#' + nelt).remove();
		    ecore.remove_edit_node(tid);

		    // Close modal.
		    jQuery(modal_node_elt).modal('hide');
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
		var enode = ecore.get_edit_node_by_elt_id(parent_id);
		if( enode ){		    
		    // TODO: Pass said node to be edited.
		    edit_node_by(enode);
		}else{
		    alert('Could not find related element.');
		}
	    });
    }

    // function _connect_edge(src_div, target_div, label){	
    // }

    // var std_conn_opts = {
    // 	//anchors:["Top", "Bottom"],
    // 	//connector:"Straight",
    // 	// 'overlays': [
    // 	// ]
    // };

    function _connect_with_edge(eedge){

	var sn = eedge.source();
	var rn = eedge.relation() || 'n/a';
	var tn = eedge.target();

	// Readable label.
	rn = aid.readable(rn);
	var clr = aid.color(rn);

    	var new_conn = instance.connect(
    	    { // remember that edge ids and elts ids are the same 
    	    	'source': ecore.get_edit_node_elt_id(sn),
    	    	'target': ecore.get_edit_node_elt_id(tn),
		//'label': 'foo' // works
		'anchor': "Continuous",
		'connector': ["Bezier", { curviness: 25 } ],
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

    // Programmatically (as opposed to implicitly by drag-and-drop)
    // all edges in edit model.
    function _connect_all_edges(){
    	each(ecore.get_edit_edges(),
	     function(eeid, eedge){
		 _connect_with_edge(eedge);
    	     });
    }

    // For our intitialzation/first drawing, suspend jsplumb stuff
    // while we get a little work done.
    instance.doWhileSuspended(
    	function(){
	    
	    // Initialize table with data.
	    _edit_core_repaint_table();

	    // Add all of the nodes to the display.
	    _edit_core_init_display();

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

    	    // Now let's try to add all the edges/connections.
	    _connect_all_edges();
    	});

    // TODO
    // Click-on-edge-event: Use modal to edit label.
    //instance.bind("dblclick", function(conn) {
    instance.bind("click", function(conn) {
		      
		      // Get the necessary info from the
		      // connection.
		      var eeid =
			  ecore.get_edit_edge_id_by_connector_id(conn.id);
		      ll('looks like edge: ' + eeid);
		      var ee = ecore.get_edit_edge(eeid);

		      // Assemble modal.
		      jQuery(modal_edge_title_elt).empty();
		      jQuery(modal_edge_title_elt).append('Edge: ' + eeid);
		      jQuery(modal_edge_body_elt).empty();
		      jQuery(modal_edge_body_elt).append('<h4>Set relation</h4>');
		      var tmp_rels = [
			  ['RO:0002333', 'enabled by'],
			  ['RO:0002332', 'regulates levels of'],
			  ['RO:0002331', 'involved in'],
			  ['RO:0002330', 'genomically related to'],
			  ['RO:0002213', 'positively regulates'],
			  ['RO:0002212', 'negatively regulates'],
			  ['RO:0002211', 'regulates'],
			  ['RO:0002202', 'develops from'],
			  ['BFO:0000066', 'occurs in'],
			  ['BFO:0000051', 'has part'],
			  ['BFO:0000050', 'part of'],
			  ['???', 'indirectly disables action of'],
			  ['???', 'directly inhibits'],
			  ['???', 'upstream of'],
			  ['???', 'directly activates']
		      ];
		      var tmp_cache = [];
		      each(tmp_rels,
			   function(tmp_rel, rel_ind){
			       tmp_cache.push('<div class="radio"><label>');
			       tmp_cache.push('<input type="radio" ');
			       tmp_cache.push('name="rel_val" ');
			       tmp_cache.push('value="' + tmp_rel[1] +'"');
				   if( rel_ind == 0 ){
				       tmp_cache.push('checked>');
				   }else{
				       tmp_cache.push('>');
				   }
			       tmp_cache.push(tmp_rel[1] + ' ');
			       tmp_cache.push('(' + tmp_rel[0] + ')');
			       tmp_cache.push('</label></div>');
			       
			   });

		      jQuery(modal_edge_body_elt).append(tmp_cache.join(''));
		      jQuery(modal_edge_elt).modal({});

		      // Add "save" callback to it to change the edge
		      // label and the edit edge relation.
		      function _save_callback(){

			  //
			  //ll('looks like edge (in cb): ' + eeid);
			  var rval =
			      jQuery("input:radio[name=rel_val]:checked").val();
			  //ll('rel_val: ' + rval);

			  // TODO: Should I report this too? Smells a
			  // bit like the missing properties with
			  // setParameter/s(),
			  // Change label.
			  //conn.setLabel(rval); // does not work!?
			  conn.removeOverlay("label");
			  conn.addOverlay(["Label", {'label': rval,
						     'location': 0.5,
						     'cssClass': "aLabel",
						     'id': 'label' } ]);

			  // TODO: Since we'll be talking to the
			  // server, this will actually be: ping
			  // server, destroy connector, create new
			  // connector.
			  
			  // Change edit model's releation.
			  ee.relation(rval);

			  // Close modal.
			  jQuery(modal_edge_elt).modal('hide');
		      }
		      // Remove the previous save listeners.
		      jQuery(modal_edge_save_elt).unbind('click');
		      // And add the new one for this instance.
		      jQuery(modal_edge_save_elt).click(
			  function(evt){
			      evt.stopPropagation();
			      _save_callback();
			  });
		  });

    // TODO/BUG: Read on.
    // Connection event.
    instance.bind("connection",
		  function(info, original_p) {

		      //var cid = info.connection.id;
		      //ll('there was a new connection: ' + cid);
		      //ll('oringinal?: ' + original_p);
		      
		      // TODO/BUG: This section needs to be redone/rethought.
		      // If it looks like a drag-and-drop event...
		      if( original_p ){

			  // Get the necessary info from the
			  // connection.
			  var sn = info.sourceId;
			  var tn = info.targetId;

			  // Create a new edge based on this info.
			  //alert(sn + ', ' + tn);
			  var snode = ecore.get_edit_node_by_elt_id(sn);
			  var tnode = ecore.get_edit_node_by_elt_id(tn);
			  var new_eedge =
			      new bme_edge(snode.id(), '???', tnode.id());
			  ecore.add_edit_edge(new_eedge);

			  // TODO/BUG: Destroy the autogen one (I
			  // can't make them behave as well as the
			  // programmatic ones--need to understand:
			  // http://jsplumbtoolkit.com/doc/connections).
			  // then create the programmatic one.
			  instance.detach(info.connection);
			  _connect_with_edge(new_eedge);
		      }
		  });

    // Detach event.
    instance.bind("connectionDetached", function(info) {

		      var cid = info.connection.id;
		      ll('there was a connection detached: ' + cid);
		      var eeid =
			  ecore.get_edit_edge_id_by_connector_id(cid);
		      ll('looks like edge: ' + eeid);
		      //var ee = ecore.get_edit_edge(eeid);
		      
		      ecore.remove_edit_edge(eeid);
		  });

    //
    // instance.bind("connectionMoved", function(info) {
    // 		      var cid = info.connection.id;
    // 		      ll('there was a connection moved: ' + cid);
    // 		  });
    
    // Reapaint with we scroll the graph.
    jQuery(graph_div).scroll(
        function(){
            jsPlumb.repaintEverything();
        }
    );

    ///
    /// Activate autocomplete in input boxes.
    /// Add the local responders.
    ///

    // bioentity
    var bio_args_local = {
    	'label_template': '{{bioentity_label}} ({{bioentity}})',
    	'value_template': '{{bioentity_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['bioentity_label']);
    	}
    };
    // molecular function
    var mfn_args_local = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
    	}
    };
    // location/occurs_in
    var loc_args_local = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
    	}
    };

    var bio_auto_local =
	new bbop.widget.search_box(gserv, gconf,
				   'bio_auto_local', bio_args_local);
    bio_auto_local.add_query_filter('document_category', 'bioentity');
    bio_auto_local.set_personality('bioentity');

    var mfn_auto_local =
	new bbop.widget.search_box(gserv, gconf,
				   'mfn_auto_local', mfn_args_local);
    mfn_auto_local.add_query_filter('document_category', 'ontology_class');
    mfn_auto_local.add_query_filter('regulates_closure_label',
				 'molecular_function');
    mfn_auto_local.set_personality('ontology');

    var loc_auto_local =
	new bbop.widget.search_box(gserv, gconf,
				   'loc_auto_local', loc_args_local);
    loc_auto_local.add_query_filter('document_category', 'ontology_class');
    loc_auto_local.set_personality('ontology');

    ///
    /// Activate autocomplete in input boxes.
    /// Add the remote responders.
    ///

    // Storage for the actual selected identifiers.
    var bio_val_remote = null;
    var mfn_val_remote = null;
    var loc_val_remote = null;

    // bioentity
    var bio_args_remote = {
    	'label_template': '{{bioentity_label}} ({{bioentity}})',
    	'value_template': '{{bioentity_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['bioentity_label']);
	    bio_val_remote = doc['bioentity'] || null;
    	}
    };
    // molecular function
    var mfn_args_remote = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
	    mfn_val_remote = doc['annotation_class'] || null;
    	}
    };
    // location/occurs_in
    var loc_args_remote = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
	    loc_val_remote = doc['annotation_class'] || null;
    	}
    };

    var bio_auto_remote =
	new bbop.widget.search_box(gserv, gconf,
				   'bio_auto_remote', bio_args_remote);
    bio_auto_remote.add_query_filter('document_category', 'bioentity');
    bio_auto_remote.set_personality('bioentity');

    var mfn_auto_remote =
	new bbop.widget.search_box(gserv, gconf,
				   'mfn_auto_remote', mfn_args_remote);
    mfn_auto_remote.add_query_filter('document_category', 'ontology_class');
    mfn_auto_remote.add_query_filter('regulates_closure_label',
				 'molecular_function');
    mfn_auto_remote.set_personality('ontology');

    var loc_auto_remote =
	new bbop.widget.search_box(gserv, gconf,
				   'loc_auto_remote', loc_args_remote);
    loc_auto_remote.add_query_filter('document_category', 'ontology_class');
    loc_auto_remote.set_personality('ontology');

    ///
    /// Add GUI button activity.
    ///

    // Add to model and then to the display.
    // Assume trivial single-valued arguments.
    function _integrate_trivial_node(bio, mfn, loc){

	// Initial node settings.
	var dyn_node = new bme_node();
	// dyn_node.enabled_by(bio);
	// dyn_node.activity(mfn);
	// dyn_node.location([loc]); // list type
    	var dyn_x = 100 + jQuery(graph_container_div).scrollLeft();
    	var dyn_y = 100 + jQuery(graph_container_div).scrollTop();
	dyn_node.x_init(dyn_x);
	dyn_node.y_init(dyn_y);
	
	// Add it to the edit model.
	ecore.add_edit_node(dyn_node);
	
    	// Redraw table with new info.
	_edit_core_repaint_table();
	
    	// Add to graph.
	_add_enode_to_display(dyn_node);
	
	// Make node active in display.
	var dnid = dyn_node.id();
	var ddid = '#' + ecore.get_edit_node_elt_id(dnid);
	_make_selector_draggable(ddid);
	//_make_selector_target(ddid);
	//_make_selector_source(ddid, '.konn');
	_make_selector_editable(".open-dialog");
	// _make_selector_draggable('.demo-window');
	_make_selector_target('.demo-window');
	_make_selector_source('.demo-window', '.konn');
	
    	jsPlumb.repaintEverything();	
    }

    // Add new local node button.
    jQuery(add_btn_local_elt).click(
    	function(){
    	    var bio = bio_auto_local.content();
    	    var mfn = mfn_auto_local.content();
    	    var loc = loc_auto_local.content();

    	    if( mfn == '' || bio == '' || loc == '' ){
    		alert('necessary field empty');
    	    }else{
		_integrate_trivial_node(bio, mfn, loc);
    	    }
    	}
    );

    // Add new remote node button.
    jQuery(add_btn_remote_elt).click(
    	function(){
    	    var bio = bio_auto_remote.content();
    	    var mfn = mfn_auto_remote.content();
    	    var loc = loc_auto_remote.content();

    	    if( mfn == '' || bio == '' || loc == '' ){
    		alert('Necessary field empty.');
    	    }else if( ! mfn_val_remote ||
		      ! bio_val_remote ||
		      ! loc_val_remote ){
    		alert('You actually need to have selected your ' +
		      'values from the dropdowns in the autocompletes.');
    	    }else{

		// Block interface from taking user input while
		// operating.
		function _shields_up(){
		    jQuery(modal_blocking).modal({'backdrop': 'static',
						  'keyboard': false,
						  'show': true});
		}

		// Release interface when transaction done.
		function _shields_down(){
		    jQuery(modal_blocking).modal('hide');
		}

		// If successful, add returned data to editor/UI.
		function on_success(resp, man){
		    
		    ll('Remote success (' +
		       resp.message_type() + '): ' +
		       resp.message());

		    // Parse out what we got back.

		    // Add to model and display.
		    _integrate_trivial_node(bio_val_remote,
					    mfn_val_remote,
					    loc_val_remote);

		    // Release interface when transaction done.
		    _shields_down();
		}

		// If failed, report and reset.
		function on_failure(resp, man){
		    
		    alert('This request failed (on ' +
			  resp.message_type() + ') with message: ' +
			  resp.message());

		    // Release interface when transaction done.
		    _shields_down();
		}

		// Attempt to adjust remote model with REST call.
		// var server_loc = 'http://localhost:8300';
		// var get_path = '/m3GetModel';
		// var server_args ={
		//   'modelId': ,
		//   '': 
		// };

		var t = "http://toaster.lbl.gov:9000/solr/select?defType=edismax&qt=standard&indent=on&wt=json&rows=10&start=0&fl=bioentity%2Cbioentity_name%2Cannotation_class%2Cannotation_extension_class_handler%2Csource%2Ctaxon%2Cevidence_type%2Cevidence_with%2Cpanther_family%2Cbioentity_isoform%2Creference%2Cbioentity_label%2Cannotation_class_label%2Ctaxon_label%2Cpanther_family_label%2Cscore%2Cid&facet=true&facet.mincount=1&facet.sort=count&json.nl=arrarr&facet.limit=25&hl=true&hl.simple.pre=%3Cem%20class=%22hilite%22%3E&fq=document_category:%22annotation%22&facet.field=source&facet.field=assigned_by&facet.field=aspect&facet.field=evidence_type_closure&facet.field=panther_family_label&facet.field=taxon_closure_label&facet.field=annotation_class_label&facet.field=isa_partof_closure_label&facet.field=regulates_closure_label&facet.field=annotation_extension_class_closure_label&q=apoptotic%20pro*&qf=annotation_class^2&qf=annotation_class_label_searchable^1&qf=bioentity^2&qf=bioentity_label_searchable^1&qf=bioentity_name_searchable^1&qf=annotation_extension_class^2&qf=annotation_extension_class_label_searchable^1&qf=reference^1&qf=panther_family_searchable^1&qf=panther_family_label_searchable^1&qf=bioentity_isoform^1&packet=27&callback_type=search";
		var m = new bbop.rest.manager.jquery(bbop.rest.response.json);
		m.use_jsonp(true); // use JSONP
		m.register('success', 'foo', on_success);
		m.register('error', 'bar', on_failure);
		_shields_up(); // block just before start of action
		m.action(t);
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

    // Save button.
    jQuery(save_btn_elt).click(
    	function(){
	    // Change the form to add the data.
	    //alert(ecore.dump());
	    //jQuery(action_form_data_elt).val(ecore.dump());
	    var exgraph = ecore.to_graph();
	    var jout_obj = exgraph.to_json();
	    var jout_str = bbop.core.dump(jout_obj);
	    jQuery(action_form_data_elt).val(jout_str);
	    // Run it off in a new tab.
	    jQuery(action_form_elt).submit();
    	});

    // Help button.
    jQuery(help_btn_elt).click(
    	function(){
	    alert('In prototypes nobody can hear you scream.');
    	});

    ///
    /// Playing with graph area scroll.
    /// Take a look at: http://hitconsultants.com/dragscroll_scrollsync/scrollpane.html
    ///

    // TODO: This /should/ have worked, but the way the SVG is layed in
    // seems to make in not work very well at all.
    //jQuery(graph_div).draggable();

    // // Hand made--not great either...
    // var px = -1;
    // var py = -1;
    // function _update_start_pos(down_evt){
    // 	px = down_evt.pageX;
    // 	py = down_evt.pageY;
    // 	ll("down at: " + px + "," + py);
    // }
    // function _scroller(move_evt){
    // 	var offx = move_evt.pageX - px;
    // 	var offy = move_evt.pageY - py;
    // 	ll('scrolling: ' + offx + "," + offy);
    // 	//window.scrollTo(offx, offy);
    // 	jQuery(graph_container_div).scrollTo(offx, offy);
    // 	px = move_evt.pageX;
    // 	py = move_evt.pageY;
    // }
    // function _unbind_scroller(){
    // 	jQuery(graph_container_div).unbind('mousemove');	
    // }
    
    // jQuery(graph_container_div).mousedown(
    // 	function(e){
    // 	    _update_start_pos(e);
    // 	    // Bind to moving.
    // 	    jQuery(graph_container_div).mousemove(_scroller);
    // 	});
    // jQuery(graph_container_div).mouseup(
    // 	function(e){
    // 	    ll('unbind on mouseup');
    // 	    _unbind_scroller();
    // 	});
    // jQuery(graph_container_div).mouseout(
    // 	function(e){
    // 	    ll('unbind on mouseup');
    // 	    _unbind_scroller();
    // 	});
};

// Start the day the jsPlumb way.
jsPlumb.ready(function(){
		  // Only roll if the env is correct.
		  if( typeof(global_id) !== 'undefined' &&
		      typeof(global_label) !== 'undefined' ){
			  if( typeof(global_model) !== 'undefined' &&
				    global_model ){
				  MMEnvInit(global_model);
			  }else{
			      throw new Error('to loadable anything found');
			  }
		      }else{
			  throw new Error('environment not ready');
		      }
	      });

// ///
// /// EXP
// ///

// var logger = new bbop.logger('exp');
// logger.DEBUG = true;
// function ll(str){ logger.kvetch(str); } 
// var m = new bbop.rest.manager.jquery(bbop.rest.response.json);
// var t = 'http://localhost/cgi-bin/amigo2/amigo/term/GO:0022008/json'; 
// var r = null;
// function on_success(resp, man){
//     r = resp;
//     ll('success (' + resp.message_type() + '): ' + resp.message());
// }
// function on_fail(resp, man){
//     r = resp;
//     ll('failure (' + resp.message_type() + '): ' + resp.message());
// }
// m.register('success', 'foo', on_success);
// m.register('error', 'foo', on_fail);
// m.action(t);
