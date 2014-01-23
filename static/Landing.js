////
//// ...
////

///
/// ...
///

var MMEnvBootstrappingInit = function(in_server_base){
    
    var logger = new bbop.logger('mme bsi');
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

    // Contact point's for Chris's wizard.
    var auto_wizard_term_id = 'auto_wizard_term';
    var auto_wizard_term_elt = '#' + auto_wizard_term_id;
    var auto_wizard_spdb_id = 'auto_wizard_spdb';
    var auto_wizard_spdb_elt = '#' + auto_wizard_spdb_id;
    var auto_wizard_button_generate_id = 'auto_wizard_button_generate';
    var auto_wizard_button_generate_elt = '#' + auto_wizard_button_generate_id;
    var auto_wizard_button_jump_id = 'auto_wizard_button_jump';
    var auto_wizard_button_jump_elt = '#' + auto_wizard_button_jump_id;
    // Hidden reusable modal for action blocking.
    var modal_blocking_id = 'modal_blocking';
    var modal_blocking_elt = '#' + modal_blocking_id;
    var modal_blocking_body_id = 'modal_blocking_body';
    var modal_blocking_body_elt = '#' + modal_blocking_body_id;
    var modal_blocking_title_id = 'modal_blocking_title';
    var modal_blocking_title_elt = '#' + modal_blocking_title_id;
    //
    var model_data_button_id = 'model_data_button';
    var model_data_button_elt = '#' + model_data_button_id;

    ///
    /// Helpers.
    ///

    // Block interface from taking user input while
    // operating.
    function _shields_up(){
	jQuery(modal_blocking_elt).modal({'backdrop': 'static',
					  'keyboard': false,
					  'show': true});
    }
    
    // Release interface when transaction done.
    function _shields_down(){
	jQuery(modal_blocking_elt).modal('hide');
    }

    // On model build success, forward to the new page.
    var wizard_jump_term = null;
    var wizard_jump_db = null;
    function _generated_model(resp, man){
	var id = resp.data()['id'];	
	window.location.replace("/seed/model/" + id);
    }

    // Internal registrations.
    manager.register('prerun', 'foo', _shields_up);
    manager.register('postrun', 'fooA', _shields_down, 9);
    manager.register('manager_error', 'foo',
		     function(message_type, message){
			 alert('There was a connection error (' +
			       message_type + '): ' + message);
		     }, 10);

    // Remote action registrations.
    manager.register('success', 'foo',
		     function(resp, man){
			 alert('Operation successful (' +
			       resp.message_type() + '): ' +
			       resp.message());
		     }, 10);

    manager.register('warning', 'foo',
		     function(resp, man){
			 alert('Warning (' +
			       resp.message_type() + '): ' +
			       resp.message() + '; ' +
			       'your operation was likely not performed');
		     }, 10);

    manager.register('error', 'foo',
		     function(resp, man){

			 var ex_msg = '';
			 if( resp.commentary() &&
			     resp.commentary().exceptionMsg ){
			     ex_msg = ' ['+ resp.commentary().exceptionMsg +']';
			 }

			 alert('Error (' +
			       resp.message_type() + '): ' +
			       resp.message() + '; ' +
			       'your operation was likely not performed' +
			       ex_msg);
		     }, 10);

    manager.register('inconsistent', 'foo',
		     function(resp, man){
			 _generated_model(resp, man);
			 // alert('Not yet handled (' +
			 //       resp.message_type() + '): ' +
			 //       resp.message() + '; ' +
			 //       'try refreshing your browser');
		     }, 10);

    ///
    /// Activate autocomplete in input boxes.
    /// Add the local responders.
    ///

    //var auto_wizard_term_val = null;
    var auto_wizard_term_args = {
    	'label_template': '{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class}}',
    	'list_select_callback':
    	function(doc){
    	    //auto_wizard_term_val = doc['annotation_class'];
    	}
    };
    var auto_wizard_term =
	new bbop.widget.search_box(gserv, gconf,
				   'auto_wizard_term', auto_wizard_term_args);
    auto_wizard_term.add_query_filter('document_category', 'ontology_class');
    auto_wizard_term.set_personality('ontology');

    // species database
    //var auto_wizard_spdb_val = null;
    var auto_wizard_spdb_args = {
    	'label_template': '{{assigned_by}}',
    	'value_template': '{{assigned_by}}',
    	'list_select_callback':
    	function(doc){
    	    //auto_wizard_spdb_val = doc['assigned_by'];
    	}
    };
    var auto_wizard_spdb =
	new bbop.widget.search_box(gserv, gconf,
				   'auto_wizard_spdb', auto_wizard_spdb_args);
    auto_wizard_spdb.add_query_filter('document_category', 'annotation');
    auto_wizard_spdb.set_personality('annotation');

    // ...
    jQuery(auto_wizard_button_generate_elt).click(
    	function(){
    	    var term = auto_wizard_term.content();
    	    var spdb = auto_wizard_spdb.content();

    	    if( ! term || term == '' || ! spdb || spdb == '' ){
    		alert('necessary field empty');
    	    }else{

		// BUG: For Chris.
		wizard_jump_term = term;
		wizard_jump_db = spdb;
		manager.generate_model(wizard_jump_term, wizard_jump_db);
    	    }
    	}
    );

    // 
    jQuery(model_data_button_elt).click(
    	function(evt){
	    evt.stopPropagation();
	    evt.preventDefault();
	    alert('not yet implemented');
	});

    // jQuery(auto_wizard_button_jump_elt).click(
    // 	function(){
    // 	    var term = auto_wizard_term.content();
    // 	    var spdb = auto_wizard_spdb.content();

    // 	    if( ! term || term == '' || ! spdb || spdb == '' ){
    // 		alert('necessary field empty');
    // 	    }else{

    // 		// BUG: For Chris.
    // 		wizard_jump_term = term;
    // 		wizard_jump_db = spdb;
    // 	    }
    // 	}
    // );
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
