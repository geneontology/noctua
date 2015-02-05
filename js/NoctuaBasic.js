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

    var gserv = 'http://localhost:8983/solr/';

    // Aliases
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;
    var what_is = bbop.core.what_is;

    // Events registry.
    var manager = new bbopx.minerva.manager(global_barista_location,
                        global_minerva_definition_name,
                        user_token);

    // Contact point's.
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
        var gp = gp_ractive.get('gp');
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

    var gene_selectize = jQuery('#select_gene_product').zearch({
        onChange: function(value) {
            gp_ractive.set('gp', value);
        },
        required: true,
        optionDisplay: function(item, escape) {
            return '<div>' +
                item.id + " (" + item.annotation_class_label_searchable + ")" +
            '</div>';
        },
        itemDisplay: function(item, escape) {
            return '<div>' +
                item.id + " (" + item.annotation_class_label_searchable + ")" +
            '</div>';
        },
        valueField: 'id',
        searchField: ['id', 'annotation_class_label_searchable'],
        queryData: function(query) {
            return {'wt':'json', 'fl':'id,annotation_class_label_searchable', 'q':'id:' + query.replace(':', '\\:').toUpperCase() + '*' + ' OR ' +
                    'annotation_class_label_searchable:' + '*' + query + '*'}
        }
    });

    var phen = jQuery('#select_phenotype_product').zearch({
        onChange: function(value) {
            console.log(value);
        },
        optionDisplay: function(item, escape) {
            return '<div>' +
                item.id + " (" + item.annotation_class_label_searchable + ")" +
            '</div>';
        },
        itemDisplay: function(item, escape) {
            return '<div>' +
                item.id + " (" + item.annotation_class_label_searchable + ")" +
            '</div>';
        },
        valueField: 'id',
        searchField: ['id', 'annotation_class_label_searchable'],
        queryData: function(query) {
            return {'wt':'json', 'fl':'id,annotation_class_label_searchable', 'q':'id:' + query.replace(':', '\\:').toUpperCase() + '*' + ' OR ' +
                    'annotation_class_label_searchable:' + '*' + query + '*'}
        }
    });

    var gp = "";
    var gp_ractive = new Ractive({
      el: 'gp_placeholder',
      //template: '{{#if gp==""}}<div>Cannot be null!</div>{{/if}}',
      model: gp
    });

    var qualifier_ractive = new Ractive({
      el: 'qualifier_placeholder',
      template: '<input id="select_qualifier" value="{{qualifier}}" placeholder="qualifier"> <div>{{qualifier}}</div>'
    });


    // initialize model
    var id = null // dirty
    manager.generate_model();

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




// Depends on selectize
jQuery.widget('jj.zearch', {
    options: {
        webserviceUrl: "http://localhost:8983/solr/select",
        onChange: console.log,
        required: false,
        optionDisplay: null,
        itemDisplay: null,
        valueField: null,
        searchField: null,
        queryData: null
    },

    _create: function () {
        // redefine the variables to avoid conflicts with selectize's scope
        var widgetOnChange = this.options.onChange;
        var widgetWebservicerUrl = this.options.webserviceUrl;
        var widgetRequired = this.options.required;
        var widgetOptionDisplay = this.options.optionDisplay;
        var widgetItemDisplay = this.options.itemDisplay;
        var widgetValueField = this.options.valueField;
        var widgetSearchField = this.options.searchField;
        var widgetQueryData = this.options.queryData;
        var _currentValue = null;

        // Right label for user feedback
        var feedbackLabel = jQuery('<div style="width:130px;padding-left:15px;"></div>');
        this.element.after(feedbackLabel);

        var selectized = this.element.selectize({
            valueField: widgetValueField,
            searchField: widgetSearchField,
            create: false,
            render: {
                option: widgetOptionDisplay,
                item: widgetItemDisplay
            },
            load: function(query, callback) {
                if (!query.length) return callback();
                jQuery.ajax({
                    url: widgetWebservicerUrl,
                    data: widgetQueryData(query),
                    dataType: 'jsonp',
                    jsonp: 'json.wrf',
                    error: function() {
                        callback();
                    },
                    success: function(res) {
                        _updateHits(res.response.numFound);
                        //TODO load underscore.js
                        //var uniq_only = _.uniq(res.response.docs) // remove potential duplicates
                        //callback(uniq_only);
                        callback(res.response.docs);
                    }
                });
            }, 
            onChange: function(value) {
                widgetOnChange(value);
                _checkSanity(value);
                _currentValue = value;
            },
            onType: function(str) {        
                _clearCache(); // in order to request the server at each typing
            },
            onBlur: function() {
                _checkSanity(_currentValue);
            }
        });

        var _checkSanity = function(value) {
            if(widgetRequired && (value == null || value == "")) {
                feedbackLabel.text('Cannot be empty!');
            } else {
                feedbackLabel.text('');
            }
        }

        var _clearCache = function () {
            selectized[0].selectize.clearCache("option");
            selectized[0].selectize.clearOptions();
        };

        var _updateHits = function(h) {
            feedbackLabel.text(h + ' hits');
        };

    },

    _destroy: function () {
        selectized[0].selectize.destroy();
    },


    _setOptions: function (options) {
        this._super( options );
        this.refresh();
    }
});