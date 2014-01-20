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

    // GOlr location and conf setup.
    var gserv = 'http://golr.berkeleybop.org/';
    var gconf = new bbop.golr.conf(amigo.data.golr);

    // Contact point's for Chris's wizard.
    var auto_wizard_term_id = 'auto_wizard_term';
    var auto_wizard_term_elt = '#auto_wizard_term';
    var auto_wizard_spdb_id = 'auto_wizard_spdb';
    var auto_wizard_spdb_elt = '#auto_wizard_spdb';
    var auto_wizard_button_id = 'auto_wizard_button';
    var auto_wizard_button_elt = '#auto_wizard_button';

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
    jQuery(auto_wizard_button_elt).click(
    	function(){
    	    var term = auto_wizard_term.content();
    	    var spdb = auto_wizard_spdb.content();

    	    if( ! term || term == '' || ! spdb || spdb == '' ){
    		alert('necessary field empty');
    	    }else{
		//alert('go!');
		window.location.replace("/seed/model/gomodel:" +
					spdb + '-' +
					//term);
					term.replace(':', '_'));
    	    }
    	}
    );
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
