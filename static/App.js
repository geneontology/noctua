var expPlumbInit = function(){
    
    var logger = new bbop.logger('expPlumbApp');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }
    
    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;
    var what_is = bbop.core.what_is;

    var container_id = '#' + 'main_exp_graph';
    
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

    // function _stack_to_div(stack, x, y){	
    // }

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
	    Container: "main_exp_graph"
        });

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

	     jQuery(container_id).append('<div class="demo-window" style="top: ' + _box_top(raw_y) + 'px; left: ' + _box_left(raw_x) + 'px;" id="' + div_id + '">' + table + '<div class="konn"></div></div>');
	 });

    // Can not add to table.
    var nav_tbl = new bbop.html.table(table_nav_row_headers,
				      table_nav_rows,
				      {'class': 'table table-condensed'});
    jQuery('#main_exp_table').append(nav_tbl.to_string());

    // Virtual/routing nodes.
    each(layout['virtual_nodes'],
	 function(litem, index){

	     var id = litem['id'];
	     var raw_x = litem['x'];
	     var raw_y = litem['y'];
	     var div_id = 'vdid' + index;
	     term2div[id] = div_id;

	     jQuery(container_id).append('<div class="waypoint" style="top: ' + _vbox_top(raw_y) + 'px; left: ' + _vbox_left(raw_x) + 'px;" id="' + div_id + '">' + '' + '</div>');
	 });

    // Now that they are physically extant, add JS stuff.
    
    // Make nodes draggable.
    var foo = jsPlumb.getSelector(".demo-window");
    instance.draggable(foo);
    var bar = jsPlumb.getSelector(".waypoint");
    instance.draggable(bar);

    instance.doWhileSuspended(
	function(){
	    
	    // 
	    instance.makeTarget(jsPlumb.getSelector(".demo-window"), {
				    anchor:"Continuous",
                                    connector:[ "Bezier", { curviness:25 } ]
				});
	    instance.makeTarget(jsPlumb.getSelector(".waypoint"), {
				    anchor:"Continuous",
                                    connector:[ "Bezier", { curviness:25 } ]
				});

            instance.makeSource(jsPlumb.getSelector(".demo-window"), {
                                    filter:".konn",
                                    anchor:"Continuous",
                                    connector:[ "Bezier", { curviness:25 } ]
                                });

	    // Now let's try to add edges/connections.
	    each(layout['paths'],
    		 function(path){
		     var nodes = path['nodes'];
		     var waypoints = path['waypoints']; // don't need right now?
		     for(var ni = 0; ni < (nodes.length -1); ni++ ){
		     	 var sub_id = nodes[ni];
		     	 var obj_id = nodes[ni +1];
			 
		     	 // var sub_id = nodes[0];
		     	 // var obj_id = nodes[nodes.length -1];

			 var sub_div = term2div[sub_id];
			 var obj_div = term2div[obj_id];
			 
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
       		 });
	});

    jQuery(container_id).scroll(
        function(){
            jsPlumb.repaintEverything();
        }
    );

    //ll('starting:' + bbop.core.dump(layout));

    ///
    /// Activate AC
    ///

    var gserv = 'http://golr.berkeleybop.org/';
    var gconf = new bbop.golr.conf(amigo.data.golr);

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

    jQuery('#adder').click(
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
		jQuery('#main_exp_table').empty();
		jQuery('#main_exp_table').append(dyn_tbl.to_string());
		//jQuery('#main_exp_table').append(nav_tbl.to_string());
	    }

	    // Add to graph.
	    var dyn_id = bbop.core.uuid();
	    var dyn_x = 100 + jQuery(container_id).scrollLeft();
	    var dyn_y = 100 + jQuery(container_id).scrollTop();
	    var dyn_tbl = '<table><tr style="background-color: #FFFFFF;"><td>' + b + '</td></tr><tr style="background-color: #ADD8E6;"><td>' + mf + '</td></tr></table>';
	    jQuery(container_id).append('<div class="demo-window" style="top: ' + dyn_y + 'px; left: ' + dyn_x + 'px;" id="' + dyn_id + '">' + dyn_tbl + '<div class="konn"></div></div>');

	    instance.draggable(jsPlumb.getSelector('#' + dyn_id));
	    instance.makeTarget(jsPlumb.getSelector('#' + dyn_id));
            instance.makeSource(jsPlumb.getSelector('#' + dyn_id), {
                                    filter:".konn",
                                    anchor:"Continuous",
                                    connector:[ "Bezier", { curviness:25 } ]
                                });

            jsPlumb.repaintEverything();
	}
    );

};

var cytoscapeInit = function(){

    var logger = new bbop.logger('cytoscapeApp');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;

    var container_id = '#' + 'main_cy';
    
    ///
    /// Graphy stuff.
    ///

    var id = global_id;
    var label = global_label;
    var graph_json = global_graph;

    // Load graph and extract a layout.
    var g = new bbop.model.graph();
    g.load_json(graph_json);
    var r = new bbop.layout.sugiyama.render();
    var layout = r.layout(g);

    // Add the necessary elements to the display.
    var h_spacer = 75;
    var v_spacer = 75;
    var box_width = 120;
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

    var elements = [];

    each(layout['nodes'],
    	 function(litem, index){

    	     var id = litem['id'];
    	     var raw_x = litem['x'];
    	     var raw_y = litem['y'];
    	     var tx = _box_left(raw_x);
    	     var ty = _box_top(raw_y);

    	     ll('tx/y (' + id + '): ' + tx + ', ' + ty);

    	     elements.push(
    		 {
    		     'group': 'nodes',
    		     'data': {
    			 'id': id, 
    			 'label': id
    		     },
    		     'position': {
    			 //'renderedPosition': {
    			 'x': tx,
    			 'y': ty
    		     },
    		     'grabbable': true
    		 });	     
    	 });
    // // 
    // each(layout['virtual_nodes'],
    // 	 function(litem, index){

    // 	     var id = litem['id'];
    // 	     var raw_x = litem['x'];
    // 	     var raw_y = litem['y'];
    // 	     var tx = _vbox_left(raw_x);
    // 	     var ty = _vbox_top(raw_y);

    // 	     ll('tx/y (' + id + '): ' + tx + ', ' + ty);

    // 	     elements.push(
    // 		 {
    // 		     'group': 'nodes',
    // 		     'data': {
    // 			 'id': id, 
    // 			 'label': '' 
    // 		     },
    // 		     'position': {
    // 			 //'renderedPosition': {
    // 		     	 x: tx,
    // 		     	 y: ty
    // 		     },
    // 		     'grabbable': true
    // 		 });	     
    // 	 });

    // Now let's try to add edges.
    each(layout['paths'],
    	 function(path, pindex){
    	     var nodes = path['nodes'];
    	     //var waypoints = path['waypoints']; // don't need right now?

    	     // for(var ni = 0; ni < (nodes.length -1); ni++ ){
    	     // 	 var sub_id = nodes[ni];
    	     // 	 var obj_id = nodes[ni +1];
			 
    	     // 	 elements.push(
    	     // 	     {
    	     // 		 'group': 'edges',
    	     // 		 'data': {
    	     // 		     'id': '' + pindex + '_' + ni,
    	     // 		     'source': sub_id,
    	     // 		     'target': obj_id
    	     // 		 }
    	     // 	     });
    	     // }
	     
    	     var sub_id = nodes[0];
    	     var obj_id = nodes[nodes.length -1];	 
    	     elements.push(
    		 {
    		     'group': 'edges',
    		     'data': {
    			 'id': '' + pindex + '_' + sub_id + '_' + obj_id,
    			 //'source': sub_id,
    			 //'target': obj_id
    			 'source': obj_id,
    			 'target': sub_id
    		     }
    		 });
       	 });

    ///
    /// Runner.
    ///

    // Note they we've been triggered here from jsPlumb already, so
    // ther might be a slight lag.
    jQuery(container_id).cytoscape(
	{
	    'elements': elements,
	    'layout': {
		// // Mine.
		// 'name': 'preset',
		// 'fit': false
		// 
		// NOTE: took out virtual nodes to use theirs. See above.
		'name': 'breadthfirst',
		'directed': true,
		'fit': true
	    },
	    'style': [
		{
		    selector: 'node',
		    css: {
			//'content': 'data(id)'
			'content': 'data(label)',
			'text-valign': 'center',
			'color': 'white',
			'text-outline-width': 2,
			'text-outline-color': '#888'
		    }
		},
		{
		    selector: 'edge',
		    css: {
			//'content': 'data(id)'
			'width': 2,
			'line-color': '#6fb1fc',
			'source-arrow-shape': 'triangle'
		    }
		}
	    ]
	});

    // //  jQuery('#main_cy').cytoscape("get").add({group:"nodes", data:{id:"foo"}, position: { x: 200, y: 200 }})
    // var cy = jQuery('#main_cy').cytoscape("get");

    //ll('starting:' + bbop.core.dump(layout));
    //ll('starting:' + bbop.core.dump('elts: ' + elements.length));
};

var jsPlumbInit = function(){
    
    var logger = new bbop.logger('jsPlumbApp');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }
    
    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;

    var container_id = '#' + 'main_jsp';
    
    ///
    /// jsPlumb preamble.
    ///

    var instance = jsPlumb.getInstance(
	{
	    DragOptions: {ccursor: 'pointer', zIndex:2000 },
	    PaintStyle: { strokeStyle:'#666' },
	    EndpointStyles : [{ fillStyle:"#0d78bc" },
			      { width:15, height:15, strokeStyle:'#666', fillStyle:"#333" }],
            Endpoints : [ ["Dot", { radius:7 } ], "Rectangle" ],
	    //Endpoint : "Rectangle",
//	    Anchor : "AutoDefault",
	    // Anchors : [
	    // 	"TopCenter",
	    // 	"TopCenter",
	    // 	"TopLeft",
	    // 	"TopRight",
	    // 	"BottomCenter",
	    // 	"BottomCenter",
	    // 	"BottomLeft",
	    // 	"BottomRight"
	    // ],
	    PaintStyle : {
		strokeStyle:"#558822",
		lineWidth: 2
	    },
	    Container: "main_jsp"
        });

    ///
    /// Graphy stuff.
    ///

    var id = global_id;
    var label = global_label;
    var graph_json = global_graph;

    // Load graph and extract a layout.
    var g = new bbop.model.graph();
    g.load_json(graph_json);
    var r = new bbop.layout.sugiyama.render();
    var layout = r.layout(g);

    // Add the necessary elements to the display.
    var h_spacer = 75;
    var v_spacer = 75;
    var box_width = 120;
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

    var term2div = {};
    each(layout['nodes'],
	 function(litem, index){

	     var id = litem['id'];
	     var raw_x = litem['x'];
	     var raw_y = litem['y'];
	     var div_id = 'ddid' + index;
	     term2div[id] = div_id;

	     jQuery(container_id).append('<div class="window" style="top: ' + _box_top(raw_y) + 'px; left: ' + _box_left(raw_x) + 'px;" id="' + div_id + '">' + id + '</div>');
	 });
    each(layout['virtual_nodes'],
	 function(litem, index){

	     var id = litem['id'];
	     var raw_x = litem['x'];
	     var raw_y = litem['y'];
	     var div_id = 'vdid' + index;
	     term2div[id] = div_id;

	     jQuery(container_id).append('<div class="waypoint" style="top: ' + _vbox_top(raw_y) + 'px; left: ' + _vbox_left(raw_x) + 'px;" id="' + div_id + '">' + '' + '</div>');
	 });

    // Now that they are physically extant, add JS stuff.
    
    // Make nodes draggable.
    var foo = jsPlumb.getSelector(".window");
    instance.draggable(foo);
    var bar = jsPlumb.getSelector(".waypoint");
    instance.draggable(bar);

    instance.doWhileSuspended(
	function(){
	    
	    // 
	    //instance.makeSource(jsPlumb.getSelector(".window"),{isSource:true});
	    //instance.makeSource(jsPlumb.getSelector(".waypoint"),{isSource:true});
	    instance.makeTarget(jsPlumb.getSelector(".window"));
	    instance.makeTarget(jsPlumb.getSelector(".waypoint"));

	    // Now let's try to add edges/connections.
	    each(layout['paths'],
    		 function(path){
		     var nodes = path['nodes'];
		     var waypoints = path['waypoints']; // don't need right now?
		     for(var ni = 0; ni < (nodes.length -1); ni++ ){
			 var sub_id = nodes[ni];
			 var obj_id = nodes[ni +1];
			 
			 var sub_div = term2div[sub_id];
			 var obj_div = term2div[obj_id];
			 
			 instance.connect(
			     {
			 	 source: sub_div,
			 	 target: obj_div,
				 anchors:["Top", "Bottom"],
				 //connector:"Straight",
                                 connector: ["Bezier", { curviness: 25 } ]
			     });
		     }
       		 });
	});

    // jQuery(container_id).scroll(
    //     function(){
    //         jsPlumb.repaintEverything();
    //     }
    // );

    //ll('starting:' + bbop.core.dump(layout));
};

// Start the day the jsPumb way.
jsPlumb.ready(function(){
		  // Aliases
		  var is_defined = bbop.core.is_defined;
		  
		  // Only roll if the env is correct.
		  if( typeof(global_id) !== 'undefined' &&
		      typeof(global_label) !== 'undefined' &&
		      typeof(global_graph) !== 'undefined' ){
		      if( global_switch == 'cytoscape' ){
			  jQuery('#main_jsp').remove();
			  jQuery('#main_exp').remove();
			  cytoscapeInit();
		      }else if( global_switch == 'jsPlumb' ){
			  jQuery('#main_cy').remove();
			  jQuery('#main_exp').remove();
			  jsPlumbInit();
		      }else if( global_switch == 'expPlumb' ){
			  jQuery('#main_cy').remove();
			  jQuery('#main_jsp').remove();
			  expPlumbInit();
		      }else{
			  throw new Error('unknown switch in App');
		      }
		  }else{
		      jQuery('#main_cy').remove();
		      jQuery('#main_jsp').remove();
		      jQuery('#main_exp').remove();
		  }
	      });
