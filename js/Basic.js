////
//// ...
////

///
/// ...
///

var MMEnvBootstrappingInit = function(in_server_base){
    
    var logger = new bbop.logger('mme basic');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;
    var what_is = bbop.core.what_is;

    // Events registry.
    var manager = new bbop_mme_manager(in_server_base);

    // GOlr location and conf setup.
    var gserv = 'http://golr.berkeleybop.org/';
    var gconf = new bbop.golr.conf(amigo.data.golr);

    // Contact point's.
    var basic_gp_id = 'basic_gp_input';
    var basic_gp_elt = '#' + basic_gp_id;
    // TODO: etc etc

    ///
    /// Helpers.
    ///

    var compute_shield_modal = null;

    // Block interface from taking user input while
    // operating.
    function _shields_up(){
	if( compute_shield_modal ){
	    // Already have one.
	}else{
	    ll('shield up');
	    compute_shield_modal = bbop_mme_widgets.compute_shield();
	    compute_shield_modal.show();
	}
    }    
    // Release interface when transaction done.
    function _shields_down(){
	if( compute_shield_modal ){
	    ll('shield down');
	    compute_shield_modal.destroy();
	    compute_shield_modal = null;
	}else{
	    // None to begin with.
	}
    }

    // TODO
};

// Start the day the jsPlumb way.
jQuery(document).ready(
    function(){
	// Only roll if the env is correct.
	if( typeof(global_server_base) !== 'undefined' ){
	    MMEnvBootstrappingInit(global_server_base);
	}else{
	    throw new Error('not base to contact');
	}
    });
