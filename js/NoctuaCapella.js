////
//// ...
////

///
/// Application initializer.
/// Application logic.
/// Initialze with (optional) incoming data ans setup the GUI.
///

var CapellaInit = function(){
    
    var logger = new bbop.logger('cap kick');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;
    var is_empty = bbop.core.is_empty;
    var what_is = bbop.core.what_is;
    
    ///
    ///
    ///

    // Now that we have our best effort to
    // resolve IDs, we need to get the new
    // model going.
    var m3 = new bbop_mme_manager2(global_message_server,
			    	   'mmm', 'amigo');
    m3.register('manager_error', 'foo',
		function(message_type, message){
		    console.log('manager error (' +
			    	message_type + '): ' +
			    	message);
		}, 10);
    m3.register('warning', 'foo',
		function(resp, man){
		    console.log('warning: ' +
			    	resp.message());
		}, 10);
    m3.register('error', 'foo',
		function(resp, man){
		    console.log('error (' +
			    	resp.message_type() +
			    	'): ' +	resp.message());
		}, 10);
    m3.register('rebuild', 'foo',
		function(resp, man){
		    var id = resp.data()['id'];	
		    //window.location.replace("/seed/model/" + id);
		    console.log('forward to: ', id);
		}, 10);

    // Go!
    //m3.bootstrap_model(payload);
    
    jQuery('#pl').append('payload: ' + JSON.stringify(global_payload));
};

///
/// Startup.
///

// 
jQuery(document).ready(
    function(){
	CapellaInit();
    });
