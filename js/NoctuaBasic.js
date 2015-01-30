////
//// ...
////

///
/// ...
///

var MMEnvBootstrappingInit = function(user_token){
    
    var logger = new bbop.logger('mme basic');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;
    var what_is = bbop.core.what_is;

    // Events registry.
    var manager = new bbopx.minerva.manager(global_barista_location,
                        global_minerva_definition_name,
                        user_token);

    // Contact point's.
    var basic_gp_id = 'basic_gp_input';
    var basic_gp_elt = '#' + basic_gp_id;
    var save_btn_id = 'select_stored_jump_button';
    var save_btn_elt = '#' + save_btn_id; 
    var basic_qualifier_id = 'basic_qualifier_input';
    var basic_qualifier_elt = '#' + basic_qualifier_id;
    var basic_term_id = 'basic_term_input';
    var basic_term_elt = '#' + basic_term_id;

    
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

    jQuery(save_btn_elt).click(function(){
        console.log(jQuery(basic_gp_elt).val());
        var gp = "HP:0000001";
        var qualifier = "a";
        var term = "monarch:phenotype100050-pn";
        validate_form(gp, qualifier, term);

        manager.add_simple_composite(id, gp, qualifier);
    });


    jQuery('#save_button').click(function(){
        _store_it();
    });

    jQuery('#add_title_button').click(function(){
        var title = jQuery('#title_input').val();
        manager.add_model_annotation(id, "title", title);
    });

    function validate_form(gp, qualifier, term) {

    }

    manager.register('rebuild', 'foorebuild', function(resp, man){
        console.log('rebuild');
        console.log(resp);
        _set_alert("success", resp._message);
        set_model_id(resp, man)
    }, 10);


    manager.register('error', 'errorargh', function(resp, man){
        print_error(resp);
        _set_alert("danger", resp._message);
    }, 10);

    manager.register('merge', 'merdge', function(resp, man){
        console.log('merge');
        console.log(resp);
        _set_alert("success", resp._message);
    }, 10);

    function print_error(err) {
        console.log("An error has occured!");
        console.log(err);
    }

    function set_model_id(resp, man){
        id = resp.data()['id'];
    }

    function _store_it(){
        manager.store_model(id);
    }

    // Type can be: success info warning danger
    function _set_alert(type, message) {
        var alert_wrapper = jQuery('#alert-wrapper');
        var alert_message = jQuery('#alert-message');
        alert_message.text(message);
        alert_wrapper.removeClass();
        alert_wrapper.addClass("alert alert-dismissible alert-" + type);
        alert_wrapper.css('display', 'inherit');
    }

    // initialize model
    var id = null // dirty
    manager.generate_model();


    jQuery('#select_gene_product').selectize({
    valueField: 'id',
    labelField: 'id',
    searchField: ['id', 'annotation_class_label_searchable'],
    options: [],
    create: false,
    render: {
        option: function(item, escape) {
            return '<div>' +
                item.id + " (" + item.annotation_class_label_searchable + ")" +
            '</div>';
        }
    },
    load: function(query, callback) {
        if (!query.length) return callback();
        jQuery.ajax({
            url: 'http://localhost:8983/solr/select',
            data: {'wt':'json', 'fl':'id,annotation_class_label_searchable', 'q':'id:' + encodeURIComponent(query.replace(':', '\\:').toUpperCase()) + '*' + ' OR ' + 'annotation_class_label_searchable:' + '*' + encodeURIComponent(query) + '*'},
            dataType: 'jsonp',
            jsonp: 'json.wrf',
            error: function() {
                callback();
            },
            success: function(res) {
                console.log(res.response.docs);
                callback(res.response.docs);
            }
        });
    }
});

};


// Start the day the jsPlumb way.
jQuery(document).ready(
    function(){
	// Only roll if the env is correct.

    // Try to define token.
    var user_token = null;
    if( global_barista_token ){
        user_token = global_barista_token;
    }

    // Next we need a manager to try and pull in the model.
    if( typeof(global_minerva_definition_name) === 'undefined' ||
    typeof(global_barista_location) === 'undefined' ) {
        alert('environment not ready');
	} else {
	    MMEnvBootstrappingInit(user_token);
	}
    });
