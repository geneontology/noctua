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
    /// Very similar to NoctuaLanding.
    ///

    // Events registry.
    var manager = new bbopx.minerva.manager(global_barista_location,
					    global_minerva_definition_name,
					    global_barista_token);

    manager.register('manager_error', 'foo', function(message_type, message){
	console.log('manager error (' + message_type + '): ' + message);
    }, 10);
    manager.register('warning', 'foo', function(resp, man){
	console.log('warning: ' + resp.message());
    }, 10);
    // NOTE: This is the most likely place we'll have an error--taken
    // from NoctuaLanding.
    manager.register('error', 'foo', function(resp, man){

	// Do something different if we think that this is a
	// permissions issue.
	var perm_flag = "InsufficientPermissionsException";
	var token_flag = "token";
	if( resp.message() && resp.message().indexOf(perm_flag) != -1 ){
	    alert('Error: it seems like you do not have permission to ' +
		  'perform that operation. Did you remember to login?');
	}else if( resp.message() && resp.message().indexOf(token_flag) != -1 ){
	    alert("Error: it seems like you have a bad token...");
	}else{
	    // Generic error.
	    alert('Error (' +
		  resp.message_type() + '): ' +
		  resp.message() + '; ' +
		  'your operation was likely not performed.');
	}	console.log('error (' +	resp.message_type() + '): ' +
			    resp.message());
    }, 10);
    manager.register('rebuild', 'foo', function(resp, man){
	var id = resp.data()['id'];	
	console.log('forward to: ', id);
	//alert('forward to: ' + id);
	window.location.replace("/seed/model/" + id);
    }, 10);

    // Go!
    manager.capella_bootstrap_model(global_payload, global_term2aspect);
};

///
/// Startup.
///

// 
jQuery(document).ready(function(){
    // Only 
    if( typeof(global_attempt_creation_p) !== 'undefined' &&
	global_attempt_creation_p == true ){
	console.log('looks good to try CapellaInit');
	CapellaInit();
    }
});
