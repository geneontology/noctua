////
//// For the convenience of this prototype, all intializers, objects,
//// etc. are all kept in this file.
////

// ///
// /// Core model. Essentially several sets and an order.
// /// This is meant to be changed when we get a richer model working,
// /// but for the prototype, I don't want to lock in to the bbop
// /// graph model, so I'm using something much dumber than can
// /// be easily wrapped or changed later, but still have some editing
// /// options.
// ///

// // Edit control.
// function edit_core(){
//     this.core = {
// 	'nodes': {}, // map of id to edit_node
// 	'edges': {}, // map of id to edit_edge
// 	'node_order': [], // initial table order on redraws
// 	'node2elt': {}, // map of id to physical object id
// 	'elt2node': {}  // map of physical object id to id
// 	// Remeber that edge ids and elts ids are the same, so no map
// 	// is needed.
// 	// 'edge2elt': {}, // map of id to physical object id
// 	// 'elt2edge': {}  // map of physical object id to id
//     };
// }

// edit_core.prototype.add_edit_node = function(enode){
//     var enid = enode.id();
//     this.core['nodes'][enid] = enode; // add to nodes
//     this.core['node_order'].unshift(enid); // add to default order
//     var elt_id = bbop.core.uuid(); // generate the elt id we'll use
//     this.core['node2elt'][enid] = elt_id; // map it
//     this.core['elt2node'][elt_id] = enid; // map it
// };

// edit_core.prototype.edit_node_order = function(){
//     return this.core['node_order'] || [];
// };

// edit_core.prototype.get_edit_node = function(enid){
//     return this.core['nodes'][enid] || null;
// };

// edit_core.prototype.get_edit_node_elt_id = function(enid){
//     return this.core['node2elt'][enid] || null;
// };

// edit_core.prototype.get_edit_node_by_elt_id = function(elt_id){
//     var ret = null;
//     var enid = this.core['elt2node'][el_tid] || null;
//     if( enid ){
// 	ret = this.core['nodes'][enid] || null;
//     }
//     return ret;
// };

// edit_core.prototype.get_edit_nodes = function(){
//     return this.core['nodes'] || {};
// };

// edit_core.prototype.remove_edit_node = function(enid){
//     if( this.core['nodes'][enid] ){
// 	var enode = this.core['nodes'][enid];

// 	// Removing node removes all related edges.
// 	// TODO: Dumb scan right now.
// 	each(this.core['edges'],
// 	     function(edge){
// 		 if( edge.source() == enid || edge.target() == enid ){
// 		     var eeid = edge.id();
// 		     this.remove_edit_edge(eeid);
// 		 }
// 	     });

// 	// Also remove the node from the order list.
// 	// TODO: Is this a dumb scan?
// 	var ni = this.core['node_order'].indexOf(enid);
// 	if( ni != -1 ){
// 	    this.core['node_order'].splice(ni, 1);
// 	}

// 	// Clean the maps.
// 	var elt_id = this.core['node2elt'][enid];
// 	delete this.core['node2elt'][enid];
// 	delete this.core['elt2node'][elt_id];
//     }
// };

// edit_core.prototype.add_edit_edge = function(eedge){
//     var eeid = eedge.id();
//     this.core['edges'][eeid] = eedge;
//     var elt_id = bbop.core.uuid(); // generate the elt id we'll use
//     //this.core['edge2elt'][eeid] = elt_id; // map it
//     //this.core['elt2edge'][elt_id] = eeid; // map it
// };

// edit_core.prototype.get_edit_edge = function(eeid){
//     return this.core['edges'][eeid] || null;
// };

// edit_core.prototype.get_edit_edges = function(){
//     return this.core['edges'] || [];
// };

// edit_core.prototype.remove_edit_edge = function(eeid){
//     if( this.core['edges'][eeid] ){

// 	// Main bit out.
// 	delete this.core['edges'][eeid];

// 	// // And clean the maps.
// 	// var elt_id = this.core['node2elt'][eeid];
// 	// delete this.core['edge2elt'][eeid];
// 	// delete this.core['elt2edge'][elt_id];
//     }
// };

// // Edit nodes.
// function edit_node(in_id, in_type){

//     if( typeof(in_id) === 'undefined' ){
// 	this._id = bbop.core.uuid();
//     }else{
// 	this._id = in_id;
//     }
//     if( typeof(in_type) === 'undefined' ){
// 	this._type = 'real';
//     }
    
//     // Current model props.
//     this._enabled_by = '';
//     this._activity = '';
//     this._unknown = [];
//     this._process = '';
//     this._location = [];
    
//     // Optional layout hints.
//     this._x_init = null; // initial layout hint
//     this._y_init = null;
//     // this.xlast = null; // last known location
//     // this.ylast = null;
// }
// edit_node.prototype.id = function(value){ // (possibly generated) ID is RO
//     return this._id; };
// edit_node.prototype.type = function(value){
//     if(value) this._type = value; return this._type; };
// edit_node.prototype.enabled_by = function(value){
//     if(value) this._enabled_by = value; return this._enabled_by; };
// edit_node.prototype.activity = function(value){
//     if(value) this._activity = value; return this._activity; };
// edit_node.prototype.unknown = function(value){
//     if(value) this._unknown = value; return this._unknown; };
// edit_node.prototype.process = function(value){
//     if(value) this._process = value; return this._process; };
// edit_node.prototype.location = function(value){
//     if(value) this._location = value; return this._location; };
// edit_node.prototype.x_init = function(value){
//     if(value) this._x_init = value; return this._x_init; };
// edit_node.prototype.y_init = function(value){
//     if(value) this._y_init = value; return this._y_init; };

// // Edit edges.
// function edit_edge(src_id, rel_id, tgt_id){
//     this._id = bbop.core.uuid();
//     this._source_id = src_id;
//     this._relation_id = rel_id;
//     this._target_id = tgt_id;
// }
// edit_edge.prototype.id = function(){ // ID is RO
//     return this._id; };
// edit_edge.prototype.source = function(value){
//     if(value) this._source_id = value; return this._source_id; };
// edit_edge.prototype.relation = function(value){
//     if(value) this._relation_id = value; return this._relation_id; };
// edit_edge.prototype.target = function(value){
//     if(value) this._target_id = value; return this._target_id; };

///
/// Application initializer.
/// Initialze with (optional) incoming data ans setup the GUI.
///

var MMEEditorInit = function(){
    
    // TODO: Add this as an argument.
    var use_waypoints_p = true;
    //var use_waypoints_p = false;
    
    var logger = new bbop.logger('mmee');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Create the core model.
    //var bbop_mme_edit = require('./js/bbop-mme-edit');
    var bme_core = bbop_mme_edit.core;
    var bme_edge = bbop_mme_edit.edge;
    var bme_node = bbop_mme_edit.node;
    var ecore = new bme_core();

    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;
    var what_is = bbop.core.what_is;

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
    var add_btn_id = 'adder';
    var add_btn_elt = '#' + add_btn_id;
    var zin_btn_id = 'zoomin';
    var zin_btn_elt = '#' + zin_btn_id;
    var zret_btn_id = 'zoomret';
    var zret_btn_elt = '#' + zret_btn_id;
    var zout_btn_id = 'zoomout';
    var zout_btn_elt = '#' + zout_btn_id;
    
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

	var ret = {
	    'enabled_by': '',
	    'activity': '',
	    'unknown': [],
	    'process': '',
	    'location': []
	};

	ll('new enode id: ' + id);
	ll('node: ' + bbop.core.dump(node));
	var meta = node.metadata();
	if( meta ){
	    if( meta['enabled_by'] ){
		enode.enabled_by(meta['enabled_by']);
	    }
	    if( meta['unknown'] ){
		enode.unknown(meta['unknown']);
	    }
	    if( meta['activity'] ){
		enode.activity(meta['activity']);
	    }
	    if( meta['process'] ){
		enode.process(meta['process']);
	    }
	    if( meta['location'] ){
		enode.location(meta['location']);
	    }
	}

	return enode;
    }

    // Takes a core edit node as the argument.
    function _enode_to_stack(enode){
	
	// Simulate VisualizeServer's stack.
	var stack = [];

	if( enode.enabled_by() ){
	   ll('has enby');
	    stack.push({
			   'color': '#FFFFFF',
			   'field': 'enabled by',
			   'label': enode.enabled_by()
		       });
	}

	if( enode.activity() ){
	   ll('has act');
	    stack.push({
			   'color': '#ADD8E6',
			   'field': 'activity',
			   'label': enode.activity()
		       });
	}

	var unk = enode.unknown();
	if( unk && what_is(unk) == 'array' ){
	    ll('has unk');
	    each(unk,
		 function(item){
		     stack.push({
				    'color': '#FFF0F5',
				    'field': 'unknown',
				    'label': item
				});
		 });
	}

	if( enode.process() ){
	    ll('has pro');
	    stack.push({
			   'color': '#FF7F50',
			   'field': 'process',
			   'label': enode.process()
		       });
	}

	var loc = enode.location();
	if( loc && what_is(loc) == 'array' ){
	    ll('has loc');
	    each(loc,
		 function(item){
		     stack.push({
				    'color': '#FFFF00',
				    'field': 'location',
				    'label': item
				});
		 });
	}
	
	return stack;
    }

    ///
    /// jsPlumb preamble.
    ///

    var instance = jsPlumb.getInstance(
	{
	    DragOptions: {ccursor: 'pointer', zIndex:2000 },
	    PaintStyle: { strokeStyle:'#666' },
            Endpoints : ["Rectangle", ["Dot", { radius:8 } ]],
	    EndpointStyles : [
		{ 
		    width:15,
		    height:15,
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
    /// Graphy stuff.
    ///

    // var id = global_id;
    // var label = global_label;
    var graph_json = global_graph;

    // Load graph.
    var g = new bbop.model.graph();
    g.load_json(graph_json);

    // Extract the gross layout.
    var r = new bbop.layout.sugiyama.render();
    var layout = r.layout(g);

    // TODO: Using the graph and the layout, populate the edit core,
    // as well as the optional initial layout values.
    // ...

    // Add all graph-defined nodes.
    each(g.all_nodes(),
	 function(node){
	     var new_enode = _node_to_enode(node);
	     ecore.add_edit_node(new_enode);
	 });

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
    if( ! use_waypoints_p ){

	// All all graph-defined edges.
	each(g.all_edges(),
	     function(edge){
		 var new_eedge = new bme_edge(edge.subject_id(),
					      edge.predicate_id(),
					      edge.object_id());
		 ecore.add_edit_edge(new_eedge);
	     });

    }else{
	
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

	// Add additional waypoint path informatio to the edges.
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

    // Add graph_contents to descriptive table.
    function _edit_core_repaint_table(){
	var nav_tbl_headers =
	    ['enabled&nbsp;by', 'activity', 'unknown', 'process', 'location'];
	var nav_tbl = new bbop.html.table(nav_tbl_headers, [],
					  {'class': 'table table-bordered table-hover table-condensed'});

	//each(ecore.get_edit_nodes(),
	each(ecore.edit_node_order(),
	     function(enode_id){
		 var enode = ecore.get_edit_node(enode_id);
		 if( enode.type() == 'real' ){
		     var table_row = [];
		     table_row.push(enode.enabled_by());
		     table_row.push(enode.activity());
		     table_row.push(enode.unknown().join('<br />'));
		     table_row.push(enode.process());
		     table_row.push(enode.location().join('<br />'));
		     // Add possibly nested row into table
		     nav_tbl.add_to(table_row);		     
		 }
	     });

	// Add to display.
	jQuery(table_div).empty();
	jQuery(table_div).append(nav_tbl.to_string());
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

	// Colorful stack.
	var enode_table = new bbop.html.tag('table', {});
	each(_enode_to_stack(enode),
	     function(item){
		 var trstr = '<tr style="background-color: ' +
		     item['color'] + ';"><td>' 
		     + item['label'] + '</td></tr>';   
		 enode_table.add_to(trstr);
	     });
	w.add_to(enode_table);

	// Drag new connections.	
	var konn = new bbop.html.tag('div', {'class': 'konn'});
	w.add_to(konn);
	
	jQuery(graph_div).append(w.to_string());
    }

    function _edit_core_init_display(){

	jQuery(graph_div).empty();

	// For all of the enodes we've collected.
	each(ecore.get_edit_nodes(),
	     function(enode_id, enode){

		 if( enode.type() == 'real' ){ // if a "real" node

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
				connector:[ "Bezier", { curviness: 25 } ]
    			    });
    }

    function _make_selector_source(sel, subsel){
        instance.makeSource(jsPlumb.getSelector(sel), {
                                filter: subsel,
                                anchor:"Continuous",
                                connector:[ "Bezier", { curviness:25 } ]
                            });
    }
    
    // function _connect_edge(src_div, target_div, label){	
    // }

    function _connect_all_edges(){
    	each(ecore.get_edit_edges(),
	     function(eeid, eedge){
	    	 var sn = eedge.source();
	    	 var rn = eedge.relation() || null;
	    	 var tn = eedge.target();
    	    	 instance.connect(
    	    	     { // remember that edge ids and elts ids are the same 
    	    		 source: ecore.get_edit_node_elt_id(sn),
    	    		 target: ecore.get_edit_node_elt_id(tn),
    	    		 //anchors:["Top", "Bottom"],
    	    		 anchor:"Continuous",
    	    		 //connector:"Straight",
                         connector: ["Bezier", { curviness: 25 } ],
			 'overlays': [
			     ["Arrow", {'location': -4}],
			     ["Label", {'label': rn,
					'location': 0.5,
					'id': eedge.id() } ]
			 ]
		     });
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

    	    // Now let's try to add all the edges/connections.
	    _connect_all_edges();
    	});

    // TODO
    // Click-on-edge-event.
    instance.bind("click", function(c) {
                      //instance.detach(c);
		      alert('clicked!');
                  });
    // TODO
    // Connection event.
    instance.bind("connection", function(info) {
		      var cid = info.connection.id;
                      info.connection.getOverlay("label").setLabel(cid);
		  });
    
    // Reapaint with we scroll the graph.
    jQuery(graph_div).scroll(
        function(){
            jsPlumb.repaintEverything();
        }
    );

    ///
    /// Activate autocomplete in input boxes.
    ///

    // mf
    var mf_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['annotation_class_label']);
    	}
    };
    var mf_auto = new bbop.widget.search_box(gserv, gconf, 'mf_auto', mf_args);
    mf_auto.add_query_filter('document_category', 'ontology_class');
    mf_auto.add_query_filter('regulates_closure_label', 'molecular_function');
    mf_auto.set_personality('ontology');

    var b_args = {
    	'label_template': '{{bioentity_label}} ({{bioentity}})',
    	'value_template': '{{bioentity_label}}',
    	'list_select_callback':
    	function(doc){
    	    //alert('adding: ' + doc['bioentity_label']);
    	}
    };
    var b_auto = new bbop.widget.search_box(gserv, gconf, 'b_auto', b_args);
    b_auto.add_query_filter('document_category', 'bioentity');
    b_auto.set_personality('bioentity');

    ///
    /// Add GUI button activity.
    ///

    // Add new node.
    jQuery(add_btn_elt).click(
    	function(){
    	    var mf = mf_auto.content();
    	    var b = b_auto.content();

    	    if( mf == '' || b == '' ){
    		alert('necessary field empty');
    	    }else{

		var dyn_node = new bme_node();
		dyn_node.enabled_by(b);
		dyn_node.activity(mf);
    		var dyn_x = 100 + jQuery(graph_container_div).scrollLeft();
    		var dyn_y = 100 + jQuery(graph_container_div).scrollTop();
		dyn_node.x_init(dyn_x);
		dyn_node.y_init(dyn_y);
		
		ecore.add_edit_node(dyn_node);

    		// Redraw table with new info.
		_edit_core_repaint_table();

    		// Add to graph.
		_add_enode_to_display(dyn_node);

		// Make node active.
		var dnid = dyn_node.id();
		var ddid = '#' + ecore.get_edit_node_elt_id(dnid);
		_make_selector_draggable(ddid);
		_make_selector_target(ddid);
		_make_selector_source(ddid, '.konn');
		
    		jsPlumb.repaintEverything();
    	    }
    	}
    );

    // Zoom buttons.
    jQuery(zin_btn_elt).click(
    	function(){
    	    var nz = instance.getZoom() - 0.25;
    	    _set_zoom(nz);
    	});
    jQuery(zret_btn_elt).click(
    	function(){
    	    _set_zoom(1.0);
    	});
    jQuery(zout_btn_elt).click(
    	function(){
    	    var nz = instance.getZoom() + 0.25;
    	    _set_zoom(nz);
    	});
};

// Start the day the jsPlumb way.
jsPlumb.ready(function(){
		  // Only roll if the env is correct.
		  if( typeof(global_id) !== 'undefined' &&
		      typeof(global_label) !== 'undefined' &&
		      typeof(global_graph) !== 'undefined' ){
			  MMEEditorInit();
		      }else{
			  throw new Error('environment not ready');
		      }
	      });
