var AppInit = function(){
    
    var logger = new bbop.logger('App');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }
    
    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;

    var container_id = '#' + 'main';
    
    ///
    /// jsPlumb preamble.
    ///

    var instance = jsPlumb.getInstance(
	{
	    DragOptions: {ccursor: 'pointer', zIndex:2000 },
	    PaintStyle: { strokeStyle:'#666' },
	    EndpointStyle : { width:20, height:16, strokeStyle:'#666' },
	    Endpoint : "Rectangle",
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
	    Container: "main"
        });

    ///
    ///
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

    ll('starting:' + bbop.core.dump(layout));
};

// Start the day the jsPumb way.
jsPlumb.ready(function(){
		  // Aliases
		  var is_defined = bbop.core.is_defined;
		  
		  // Only roll if the env is correct.
		  if( is_defined(global_id) &&
		      is_defined(global_label) &&
		      is_defined(global_graph) ){
		      AppInit();
		  }
	      });
