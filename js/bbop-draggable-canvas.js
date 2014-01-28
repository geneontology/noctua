////
//// Playing with graph area scroll.
//// Take a look at:
////  http://hitconsultants.com/dragscroll_scrollsync/scrollpane.html
////

function bbop_draggable_canvas(container_id){

    var logger = new bbop.logger('drag');
    logger.DEBUG = true;
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
    }
    function _scroller(move_evt){
	var page_x = move_evt.pageX;
	var page_y = move_evt.pageY;
    	var offx = page_x - px;
    	var offy = page_y - py;
	var old_left = jQuery(container_div).scrollLeft();
	var old_top = jQuery(container_div).scrollTop();
    	ll('scrolling: ' +
	   page_x + "," + page_y + '; ' +
	   offx + "," + offy + '; ' +
	   old_left + "," + old_top);
    	//window.scrollTo(offx, offy);
    	//jQuery(container_div).scrollTo(offx, offy);
	jQuery(container_div).scrollLeft(old_left - offx);
	jQuery(container_div).scrollTop(old_top - offy);
    	px = move_evt.pageX;
    	py = move_evt.pageY;
    }
    function _unbind_scroller(){
    	jQuery(container_div).unbind('mousemove');	
    }
    
    // Stat on mouse down.
    jQuery(container_div).mousedown(
    	function(e){
	     if( this == e.target ){ // only stat if actual, not child
    		 _update_start_pos(e);
    		 // Bind to moving.
    		 jQuery(container_div).mousemove(_scroller);
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
