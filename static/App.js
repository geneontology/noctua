var expPlumbInit = function(){
    
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
