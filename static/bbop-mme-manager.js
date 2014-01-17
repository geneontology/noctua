/*
 * Constructor: bbop_mme_manager
 * 
 * A manager for handling the AJAX and registry.
 * Initial take from bbop.golr.manager.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  a classic manager
 */
var bbop_mme_manager = function(){
    bbop.registry.call(this, ['update_facts',
			      'error', // message, mtype, commentary
			      'manager_error' // message, mtype (impossible?)
			     ]);
    this._is_a = 'bbop_mme_manager';
    var anchor = this;

    // An internal manager for handling the unhappiness of AJAX callbacks.
    var jqm = new bbop.rest.manager.jquery(bbop.rest.response.mmm);

    function _on_fail(resp, man){
	var args = [resp.message_type(), resp.message()];
	anchor.apply_callbacks('manager_error', args);
    }
    jqm.register('error', 'foo', _on_fail);

    // When we have nominal success, we still need to do some kind of
    // dispatch to the proper functionality.
    function _on_nominal_success(resp, man){
	
	// // TODO
	// if( ){
	// }

    }
    jqm.register('success', 'bar', _on_nominal_success);

};
bbop.core.extend(bbop_mme_manager, bbop.registry);
