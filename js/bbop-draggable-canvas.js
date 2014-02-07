////
//// Playing with graph area scroll.
//// Take a look at:
////  http://hitconsultants.com/dragscroll_scrollsync/scrollpane.html
////

function bbop_draggable_canvas(container_id){

    var logger = new bbop.logger('drag');
    //logger.DEBUG = true;
    logger.DEBUG = false;
    function ll(str){ logger.kvetch(str); }

    var container_div = '#' + container_id;

    // TODO: This /should/ have worked, but the way the SVG is layed in
    // seems to make in not work very well at all.
    //jQuery(graph_div).draggable();

    // Hand made--not great either...
    var px = -1;
    var py = -1;
    function _update_start_pos(down_evt){
    	px = down_evt.pageX;
    	py = down_evt.pageY;
    	ll("down at: " + px + "," + py);
	// TODO: start cursor drag
    }
    function _scroller(move_evt){
	var page_x = move_evt.pageX;
	var page_y = move_evt.pageY;
    	var offx = page_x - px;
    	var offy = page_y - py;
	var pos_left = jQuery(container_div).position().left;
	var pos_top = jQuery(container_div).position().top;
	var old_left = jQuery(container_div).scrollLeft();
	var old_top = jQuery(container_div).scrollTop();
	var scroll_width = jQuery(container_div).get(0).scrollWidth;
	var scroll_height= jQuery(container_div).get(0).scrollHeight;
	var dim_width = jQuery(container_div).width();
	var dim_height = jQuery(container_div).height();
    	ll('scrolling: ' +
	   //'p:' + px + "," + py + '; ' +
	   'page:' + page_x + "," + page_y + '; ' +
	   'off: ' + offx + "," + offy + '; ' +
	   'pos: ' + pos_left + "," + pos_top + '; ' + 
	   'old: ' + old_left + "," + old_top + '; ' + 
	   'scroll: ' + scroll_width + "," + scroll_height + '; ' + 
	   'dim: ' + dim_width + "," + dim_height);

	// Check bounds, unbind if we stray.
	// TODO: complete if this is actually effective; get the
	// feeling it's not.
	if( pos_top >= page_y || // top
	    dim_height + pos_top <= page_y ){ //bottom
	    ll('dimensional unbind');
	    _unbind_scroller();
	}else{
	    // Otherwise, make the move.
	    jQuery(container_div).scrollLeft(old_left - offx);
	    jQuery(container_div).scrollTop(old_top - offy);
    	    px = move_evt.pageX;
    	    py = move_evt.pageY;	    
	}
    }
    function _unbind_scroller(){
    	jQuery(container_div).unbind('mousemove', _scroller);
	// TODO: revert cursor
    }
    
    // Stat on mouse down.
    jQuery(container_div).mousedown(
    	function(e){
	     if( this == e.target ){ // only stat if actual, not child
    		 _update_start_pos(e);
    		 // Bind to moving.
    		 jQuery(container_div).bind('mousemove', _scroller);
	     }
    	});

    // Stop for almost any reason.
    jQuery(container_div).mouseup(
    	function(e){
    	    ll('unbind on mouseup');
    	    _unbind_scroller();
    	});
    jQuery(container_div).mouseout(
    	function(e){
    	    ll('unbind on mouseup');
    	    _unbind_scroller();
    	});
    jQuery(container_div).mouseleave(
    	function(e){
    	    ll('unbind on mouseleave');
    	    _unbind_scroller();
    	});
    jQuery(container_div).select( // to trigger, we're moving fast
    	function(e){
    	    ll('unbind on select');
    	    _unbind_scroller();
    	});
    // jQuery(container_div).blur(
    // 	function(e){
    // 	    ll('unbind on blur');
    // 	    _unbind_scroller();
    // 	});
    // jQuery(container_div).focusout(
    // 	function(e){
    // 	    ll('unbind on focusout');
    // 	    _unbind_scroller();
    // 	});
}
