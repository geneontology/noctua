var MMEEditorInit = function(){
    
    var logger = new bbop.logger('mmee');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    //var use_waypoints_p = true;
    var use_waypoints_p = false;
    
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

    ///
    /// jsPlumb preamble.
    ///

    var instance = jsPlumb.getInstance(
	{
	    DragOptions: {ccursor: 'pointer', zIndex:2000 },
	    PaintStyle: { strokeStyle:'#666' },
	    EndpointStyles : [{ fillStyle:"#0d78bc" },
			      { width:15, height:15,
				strokeStyle:'#666', fillStyle:"#333" }],
            Endpoints : [ ["Dot", { radius:7 } ], "Rectangle"],
            //Endpoint : ["Dot", { radius:7 } ],
	    PaintStyle : {
		strokeStyle:"#558822",
		lineWidth: 2
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

    var id = global_id;
    var label = global_label;
    var graph_json = global_graph;

    // Load graph.
    var g = new bbop.model.graph();
    g.load_json(graph_json);

    // Extract the gross layout.
    var r = new bbop.layout.sugiyama.render();
    var layout = r.layout(g);

    //
    var term2div = {};
    var table_nav_row_headers =
	['enabled&nbsp;by', 'activity', 'unknown', 'process', 'location'];
    var table_nav_rows = [];
    each(layout['nodes'],
	 function(litem, index){

	     var id = litem['id'];
	     var raw_x = litem['x'];
	     var raw_y = litem['y'];
	     var div_id = 'ddid' + index;
	     term2div[id] = div_id;

	     // Right, but we also want real data and
	     // meta-information.
	     var enby = '';
	     var actv = '';
	     var unk = [];
	     var proc = '';
	     var loc = [];
	     var node = g.get_node(id);
	     //var node = g._nodes.hash[id];
	     if( node ){
		 ll('node id: ' + id);
		 ll('node: ' + bbop.core.dump(node));
		 var meta = node.metadata();
		 if( meta ){
		     if( meta['enabled_by'] ){
			 enby = meta['enabled_by'];
		     }
		     if( meta['unknown'] ){
			 unk = meta['unknown'];
		     }
		     if( meta['activity'] ){
			 actv = meta['activity'];
		     }
		     if( meta['process'] ){
			 proc = meta['process'];
		     }
		     if( meta['location'] ){
			 loc = meta['location'];
		     }
		 }
	     }

	     // Simulate VisualizeServer's stack.
	     var table_row = [];
	     var stack = [];

	     table_row.push(enby);
	     if( enby ){
		 stack.push({
				'color': '#FFFFFF',
				'field': 'enabled by',
				'label': enby
			    });
	     }

	     table_row.push(actv);
	     if( actv ){
		 stack.push({
				'color': '#ADD8E6',
				'field': 'activity',
				'label': actv
			    });
	     }

	     table_row.push(unk.join('<br />'));
	     if( unk && what_is(unk) == 'array' ){
		 each(unk,
		     function(item){
			 stack.push({
					'color': '#FFF0F5',
					'field': 'unknown',
					'label': item
				    });
		     });
	     }

	     table_row.push(proc);
	     if( proc ){
		 stack.push({
				'color': '#FF7F50',
				'field': 'process',
				'label': proc
			    });
	     }

	     table_row.push(loc.join('<br />'));
	     if( loc && what_is(loc) == 'array' ){
		 each(loc,
		     function(item){
			 stack.push({
					'color': '#FFFF00',
					'field': 'location',
					'label': item
				    });
		     });
	     }

	     // Add possibly nested row into table
	     table_nav_rows.push(table_row);

	     // Assemble the stack into a table.
	     var tr_cache = [];
	     each(stack,
		  function(item){
		      tr_cache.push('<tr style="background-color: ' + item['color'] + ';"><td>' + item['label'] + '</td></tr>');   
		  });
	     var table = '<table>' + tr_cache.join('') + '</table>';
	     ll('stack.length: ' + stack.length);
	     //ll('table: ' + table);

	     jQuery(graph_div).append('<div class="demo-window" style="top: ' + _box_top(raw_y) + 'px; left: ' + _box_left(raw_x) + 'px;" id="' + div_id + '">' + table + '<div class="konn"></div></div>');
	 });

    // Can not add to table.
    var nav_tbl = new bbop.html.table(table_nav_row_headers,
				      table_nav_rows,
				      {'class': 'table table-condensed'});
    jQuery(table_div).append(nav_tbl.to_string());

    // Virtual/routing nodes.
    if( use_waypoints_p ){	
	each(layout['virtual_nodes'],
	     function(litem, index){

		 var id = litem['id'];
		 var raw_x = litem['x'];
		 var raw_y = litem['y'];
		 var div_id = 'vdid' + index;
		 term2div[id] = div_id;

		 jQuery(graph_div).append('<div class="waypoint" style="top: ' + _vbox_top(raw_y) + 'px; left: ' + _vbox_left(raw_x) + 'px;" id="' + div_id + '">' + '' + '</div>');
	     });
    }

    // Now that they are physically extant, add JS stuff.
    
    // Make nodes draggable.
    var foo = jsPlumb.getSelector(".demo-window");
    instance.draggable(foo);

    if( use_waypoints_p ){	
	var bar = jsPlumb.getSelector(".waypoint");
	instance.draggable(bar);
    }

    instance.doWhileSuspended(
	function(){
	    
	    // 
	    instance.makeTarget(jsPlumb.getSelector(".demo-window"), {
				    anchor:"Continuous",
                                    connector:[ "Bezier", { curviness:25 } ]
				});
	    if( use_waypoints_p ){	
		instance.makeTarget(jsPlumb.getSelector(".waypoint"), {
					anchor:"Continuous",
					connector:[ "Bezier", { curviness:25 } ]
				    });
	    }

            instance.makeSource(jsPlumb.getSelector(".demo-window"), {
                                    filter:".konn",
                                    anchor:"Continuous",
                                    connector:[ "Bezier", { curviness:25 } ]
                                });

	    // Now let's try to add edges/connections.
	    function _make_connection(src_node_id, tgt_node_id){
		var sub_div = term2div[src_node_id];
		var obj_div = term2div[tgt_node_id];
		instance.connect(
			     {
			 	 source: sub_div,
			 	 target: obj_div,
				 //anchors:["Top", "Bottom"],
				 anchor:"Continuous",
				 //connector:"Straight",
                                 connector: ["Bezier", { curviness: 25 } ]
			     });
		
	    }
	    each(layout['paths'],
    		 function(path){
		     var nodes = path['nodes'];
		     var waypoints = path['waypoints']; // don't need right now?
		     if( use_waypoints_p ){
			 // Add all ways points (assumes they are
			 // already in the graph).
			 for(var ni = 0; ni < (nodes.length -1); ni++ ){
		     	     var sub_id = nodes[ni];
		     	     var obj_id = nodes[ni +1];
			     _make_connection(sub_id, obj_id);
			 }
		     }else{
			 // Just the first and last points.
		     	 var sub_id = nodes[0];
		     	 var obj_id = nodes[nodes.length -1];
			 _make_connection(sub_id, obj_id);
		     }
       		 });
	});

    jQuery(graph_div).scroll(
        function(){
            jsPlumb.repaintEverything();
        }
    );

    //ll('starting:' + bbop.core.dump(layout));

    ///
    /// Activate AC
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
    /// Add button function activity.
    ///

    // Add new node.
    jQuery(add_btn_elt).click(
	function(){
	    var mf = mf_auto.content();
	    var b = b_auto.content();

	    if( mf == '' || b == '' ){
		alert('necessary field empty');
	    }else{
		// Add to table.
		table_nav_rows.unshift([b, mf, '', '', '']);
		var dyn_tbl = new bbop.html.table(table_nav_row_headers,
						  table_nav_rows,
						  {'class':
						   'table table-condensed'});
		jQuery(table_div).empty();
		jQuery(table_div).append(dyn_tbl.to_string());
		//jQuery(table_div).append(nav_tbl.to_string());

		// Add to graph.
		var dyn_id = bbop.core.uuid();
		var dyn_x = 100 + jQuery(graph_container_div).scrollLeft();
		var dyn_y = 100 + jQuery(graph_container_div).scrollTop();
		var dyn_node = '<table><tr style="background-color: #FFFFFF;"><td>' + b + '</td></tr><tr style="background-color: #ADD8E6;"><td>' + mf + '</td></tr></table>';
		jQuery(graph_div).append('<div class="demo-window" style="top: ' + dyn_y + 'px; left: ' + dyn_x + 'px;" id="' + dyn_id + '">' + dyn_node + '<div class="konn"></div></div>');

		instance.draggable(jsPlumb.getSelector('#' + dyn_id));
		instance.makeTarget(jsPlumb.getSelector('#' + dyn_id));
		instance.makeSource(jsPlumb.getSelector('#' + dyn_id), {
					filter:".konn",
					anchor:"Continuous",
					connector:[ "Bezier", { curviness:25 } ]
                                    });

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
