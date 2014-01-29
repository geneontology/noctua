////
//// Simple abstraction to take care of operating on stored locations.
////

var bbop_location_store = function(){

    var anchor = this;

    var logger = new bbop.logger('lcstr');
    logger.DEBUG = true;
    //logger.DEBUG = false;
    function ll(str){ logger.kvetch(str); }

    // 
    var lstore = {};

    // True if new, false if update.
    anchor.add = function(id, x, y){
	var ret = true;

	if( lstore[id] ){
	    ret = false;
	}
	lstore[id] = {'x': x, 'y': y};

	return ret;
    };

    // True is removal, false if wasn't there.
    anchor.remove = function(id){
	var ret = false;

	if( lstore[id] ){
	    ret = true;
	}
	delete lstore[id];

	return ret;
    };

    // 
    anchor.get = function(id){
	var ret = null;

	if( lstore[id] ){
	    ret = lstore[id];
	}

	return ret;
    };

};
