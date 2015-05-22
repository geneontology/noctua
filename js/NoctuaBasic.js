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
        var title = jQuery('#title_input').val();

        var gp = jQuery('#select_gene_product').val();
        var qualifier = "a";
        var term = "monarch:phenotype100050-pn";
        validate_form(gp, qualifier, term);

        var r = new bbopx.minerva.request_set(manager.user_token())
        r.add_model();
        r.add_annotation_to_model("title", title);
        r.add_annotation_to_individual(qualifier, term, r.add_individual(gp));

        manager.request_with(r, "justdoit");

        //manager.add_simple_composite(id, gp, qualifier);
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

    var gconf = new bbop.golr.conf(golr_json);
    golr_loc = 'http://localhost:8983/solr/'; // TODO delete
    var golr_manager_for_gene = new bbop.golr.manager.jquery(golr_loc, gconf);

    var gene_selectize = jQuery('#select_gene_product').solrautocomplete({
        onChange: function(value) {
            console.log(value);
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
            return 'id:*' + query.replace(':', '\\:').toUpperCase() + '*' + ' OR ' +
                  'annotation_class_label_searchable:' + '*' + query.replace(':', '\\:') + '*';
        },
        golrManager: golr_manager_for_gene
    });

    var golr_manager_for_phenotype = new bbop.golr.manager.jquery(golr_loc, gconf);
    var phen = jQuery('#select_phenotype_product').solrautocomplete({
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
            return 'id:*' + query.replace(':', '\\:').toUpperCase() + '*' + ' OR ' +
                  'annotation_class_label_searchable:' + '*' + query.replace(':', '\\:') + '*';
        },
        golrManager: golr_manager_for_phenotype
    });

    var golr_manager_for_ageofonset = new bbop.golr.manager.jquery(golr_loc, gconf);
    var ageofonset = jQuery('#select_ageofonset_product').solrautocomplete({
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
            return 'id:*' + query.replace(':', '\\:').toUpperCase() + '*' + ' OR ' +
                  'annotation_class_label_searchable:' + '*' + query.replace(':', '\\:') + '*';
        },
        golrManager: golr_manager_for_ageofonset
    });

    var gp = "";
    var gp_ractive = new Ractive({
      el: 'gp_placeholder',
      //template: '{{#if gp==""}}<div>Cannot be null!</div>{{/if}}',
      model: gp
    });

    // initialize model
    //var id = null // dirty
    //manager.add_model();

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
jQuery.widget('bbop-widget.solrautocomplete', {
    options: {
        webserviceUrl: "http://localhost:8983/solr/select",
        onChange: console.log,
        required: false,
        optionDisplay: null,
        itemDisplay: null,
        valueField: null,
        searchField: null,
        queryData: null,
        golrManger: null
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
        var widgetGolrManager = this.options.golrManager;
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

                var customCallBack = function(res) {
                  _updateHits(res._raw.response.numFound);
                  callback(res._raw.response.docs);
                };
                widgetGolrManager.register('search', 'foo', customCallBack);
                widgetGolrManager.set_query(widgetQueryData(query));
                widgetGolrManager.search();

                // jQuery.ajax({
                //     url: widgetWebservicerUrl,
                //     data: widgetQueryData(query),
                //     dataType: 'jsonp',
                //     jsonp: 'json.wrf',
                //     error: function() {
                //         callback();
                //     },
                //     success: function(res) {
                //         _updateHits(res.response.numFound);
                //         //TODO load underscore.js
                //         //var uniq_only = _.uniq(res.response.docs) // remove potential duplicates
                //         //callback(uniq_only);
                //         callback(res.response.docs);
                //     }
                // });
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

// TODO take that conf from the Monarch App
var golr_json = JSON.parse('{"generic_association":{"result_weights":"subject^7.0 subject_category^6.2 subject_taxon^6.5 relation^6.0  object^5.0 evidence^4.0","filter_weights":"subject_category^8.0 subject_taxon^7.5 subject_closure_label^7.0 relation_closure_label^6.5 evidence_closure_label^6.0 object_category^5.0 object_closure_label^4.5","_infile":"/Users/cjm/repos/monarch-app/conf/golr-views/oban-config.yaml","display_name":"Annotations","description":"Associations following OBAN model","schema_generating":"true","boost_weights":"subject^2.0 subject_label^1.0 object^2.0 object_label^1.0","fields":[{"id":"id","type":"uuid","description":"A unique identifier (CURIE) for the association. Optional.","display_name":"Association id","property":[]},{"id":"subject","type":"string","description":"The CURIE for oban:association_has_subject. May be disease, variant, gene, person, ....","display_name":"Subject","property":[]},{"searchable":"true","id":"subject_label","type":"string","description":"Label for association_subject. This will always be rdfs:label. Conventions may vary as to what goes in the label. For genes will be symbol, but we may choose to uniquify by prefixing with species","display_name":"Subject","property":[]},{"cardinality":"multi","id":"subject_closure","type":"string","description":"Reflexive closure of association_has_subject. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Subject (Inferred)","property":[]},{"searchable":"true","cardinality":"multi","id":"subject_closure_label","type":"string","description":"Labels for subject_closure.","display_name":"Subject (Inferred)","property":[]},{"id":"subject_category","type":"string","description":"Category of association.subject. Examples: gene, protein, disease, variant","display_name":"Subject category","property":[]},{"id":"subject_category_label","type":"string","description":"Label for association_subject_category","display_name":"Subject category","property":[]},{"searchable":"true","id":"subject_description","type":"string","description":"A more descriptive label or full name for association_subject. For a gene this may be the full name (as opposed to symbol).","display_name":"Subject description","property":[]},{"cardinality":"multi","id":"subject_synonym","type":"string","description":"synonyms for the entity in the association.subject field.","display_name":"Synonym","property":[]},{"id":"subject_taxon","type":"string","description":"Taxonomic class of the subject. This is typically a CURIE of the form NCBITaxon:nnnn.","display_name":"Taxon","property":[]},{"searchable":"true","id":"subject_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},{"cardinality":"multi","id":"subject_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},{"searchable":"true","cardinality":"multi","id":"subject_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},{"searchable":"true","id":"subject_family","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},{"searchable":"true","id":"subject_family_label","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},{"id":"relation","type":"string","description":"A relationship type that connects the subject with object. TODO: check for correspondence in OBAN","display_name":"Relationship","property":[]},{"id":"relation_label","type":"string","description":"Label for association_relation","display_name":"Relationship","property":[]},{"cardinality":"multi","id":"relation_closure","type":"string","description":"SubPropertyOf reflexive closure for association_relation","display_name":"Inferred relationship","property":[]},{"cardinality":"multi","id":"relation_closure_label","type":"string","description":"labels for association_relation_closure","display_name":"Inferred relationship","property":[]},{"cardinality":"multi","id":"qualifier","type":"string","description":"Association qualifier. TBD: NEGATION should probably be handled differently somehow","display_name":"Qualifier","property":[]},{"id":"object","type":"string","description":"The CURIE for oban:association_has_object. This is often, but not always an ontology class. E.g. for a gene-gene interaction it is an (arbitrary) member of the pair.","display_name":"Object","property":[]},{"searchable":"true","id":"object_label","type":"string","description":"Label for association_object.","display_name":"Object","property":[]},{"cardinality":"multi","id":"object_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Object (Inferred)","property":[]},{"searchable":"true","cardinality":"multi","id":"object_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Object (Inferred)","property":[]},{"id":"object_category","type":"string","description":"Category of association.object. Examples: phenotype, function, process, location, tissue, gene. In GO this is called aspect","display_name":"Object type","property":[]},{"id":"object_category_label","type":"string","description":"Label for association_object_category","display_name":"Object type","property":[]},{"id":"object_taxon","type":"string","description":"Taxonomic class of the object. This is typically a CURIE of the form NCBITaxon:nnnn. This field may be unfilled when used with certain categories","display_name":"Taxon","property":[]},{"searchable":"true","id":"object_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},{"cardinality":"multi","id":"object_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},{"searchable":"true","cardinality":"multi","id":"object_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},{"id":"object_isoform","type":"string","description":"Assoc object alternate form. E.g. for a canonical protein may be isoforms. Can we generalize this? May be deleted","display_name":"Isoform","property":[]},{"cardinality":"multi","id":"object_class_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Inferred object","property":[]},{"searchable":"tru","cardinality":"multi","id":"object_class_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Involved in","property":[]},{"cardinality":"multi","id":"object_class_secondary_closure","type":"string","description":"Optional. This is similar to object_class_closure, but allows for the scenario whereby a different (more inclusive, or exclusive) closure is used. The exact OPs used will depend on the association type. This would ideally be communicating from loader conf through to the client somehow","display_name":"Inferred object","property":[]},{"searchable":"true","cardinality":"multi","id":"object_class_secondary_closure_label","type":"string","description":"Labels for object_class_secondary_closure.","display_name":"Involved in","property":[]},{"cardinality":"multi","id":"object_extension","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"searchable":"true","cardinality":"multi","id":"object_extension_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"cardinality":"multi","id":"object_extension_closure","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"searchable":"true","cardinality":"multi","id":"object_extension_closure_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"cardinality":"multi","id":"object_extension_json","type":"string","description":"Extension class for the annotation (JSON).","display_name":"Annotation extension","property":[]},{"id":"source","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Source","property":[]},{"id":"date","type":"string","description":"Date of assignment. The association may be derived from multiple source, but this should be the outer source, if applicable.","display_name":"Date","property":[]},{"id":"assigned_by","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Assigned by","property":[]},{"id":"is_redundant_for","type":"string","description":"Rational for redundancy of annotation.","display_name":"Redundant for","property":[]},{"id":"evidence_graph","type":"string","description":"Evidence graph","display_name":"Evidence graph formatted as graphson","property":[]},{"cardinality":"multi","id":"evidence","type":"string","description":"Evidence type. In Monarch we may have a graph/chain. This is always the outer evidence OR a list of all evidence types used?","display_name":"Evidence type","property":[]},{"cardinality":"multi","id":"evidence_label","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence label","property":[]},{"cardinality":"multi","id":"evidence_closure","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence type","property":[]},{"cardinality":"multi","id":"evidence_closure_label","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence label closure","property":[]},{"cardinality":"multi","id":"evidence_object","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence from","property":[]},{"cardinality":"multi","id":"citation","type":"string","description":"citation.","display_name":"Reference","property":[]}],"fields_hash":{"object_taxon_closure":{"cardinality":"multi","id":"object_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},"object_class_secondary_closure_label":{"searchable":"true","cardinality":"multi","id":"object_class_secondary_closure_label","type":"string","description":"Labels for object_class_secondary_closure.","display_name":"Involved in","property":[]},"date":{"id":"date","type":"string","description":"Date of assignment. The association may be derived from multiple source, but this should be the outer source, if applicable.","display_name":"Date","property":[]},"subject_family_label":{"searchable":"true","id":"subject_family_label","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},"object_isoform":{"id":"object_isoform","type":"string","description":"Assoc object alternate form. E.g. for a canonical protein may be isoforms. Can we generalize this? May be deleted","display_name":"Isoform","property":[]},"object_taxon":{"id":"object_taxon","type":"string","description":"Taxonomic class of the object. This is typically a CURIE of the form NCBITaxon:nnnn. This field may be unfilled when used with certain categories","display_name":"Taxon","property":[]},"relation_label":{"id":"relation_label","type":"string","description":"Label for association_relation","display_name":"Relationship","property":[]},"object_taxon_closure_label":{"searchable":"true","cardinality":"multi","id":"object_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},"subject_closure":{"cardinality":"multi","id":"subject_closure","type":"string","description":"Reflexive closure of association_has_subject. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Subject (Inferred)","property":[]},"subject_taxon_label":{"searchable":"true","id":"subject_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},"id":{"id":"id","type":"uuid","description":"A unique identifier (CURIE) for the association. Optional.","display_name":"Association id","property":[]},"subject_closure_label":{"searchable":"true","cardinality":"multi","id":"subject_closure_label","type":"string","description":"Labels for subject_closure.","display_name":"Subject (Inferred)","property":[]},"subject_taxon_closure":{"cardinality":"multi","id":"subject_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},"citation":{"cardinality":"multi","id":"citation","type":"string","description":"citation.","display_name":"Reference","property":[]},"subject":{"id":"subject","type":"string","description":"The CURIE for oban:association_has_subject. May be disease, variant, gene, person, ....","display_name":"Subject","property":[]},"subject_label":{"searchable":"true","id":"subject_label","type":"string","description":"Label for association_subject. This will always be rdfs:label. Conventions may vary as to what goes in the label. For genes will be symbol, but we may choose to uniquify by prefixing with species","display_name":"Subject","property":[]},"subject_category":{"id":"subject_category","type":"string","description":"Category of association.subject. Examples: gene, protein, disease, variant","display_name":"Subject category","property":[]},"evidence_closure":{"cardinality":"multi","id":"evidence_closure","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence type","property":[]},"subject_taxon":{"id":"subject_taxon","type":"string","description":"Taxonomic class of the subject. This is typically a CURIE of the form NCBITaxon:nnnn.","display_name":"Taxon","property":[]},"relation":{"id":"relation","type":"string","description":"A relationship type that connects the subject with object. TODO: check for correspondence in OBAN","display_name":"Relationship","property":[]},"evidence_object":{"cardinality":"multi","id":"evidence_object","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence from","property":[]},"assigned_by":{"id":"assigned_by","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Assigned by","property":[]},"object_closure_label":{"searchable":"true","cardinality":"multi","id":"object_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Object (Inferred)","property":[]},"evidence_label":{"cardinality":"multi","id":"evidence_label","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence label","property":[]},"source":{"id":"source","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Source","property":[]},"object_extension_closure_label":{"searchable":"true","cardinality":"multi","id":"object_extension_closure_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"object":{"id":"object","type":"string","description":"The CURIE for oban:association_has_object. This is often, but not always an ontology class. E.g. for a gene-gene interaction it is an (arbitrary) member of the pair.","display_name":"Object","property":[]},"object_extension_label":{"searchable":"true","cardinality":"multi","id":"object_extension_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"object_extension_closure":{"cardinality":"multi","id":"object_extension_closure","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"subject_family":{"searchable":"true","id":"subject_family","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},"relation_closure":{"cardinality":"multi","id":"relation_closure","type":"string","description":"SubPropertyOf reflexive closure for association_relation","display_name":"Inferred relationship","property":[]},"object_extension_json":{"cardinality":"multi","id":"object_extension_json","type":"string","description":"Extension class for the annotation (JSON).","display_name":"Annotation extension","property":[]},"subject_taxon_closure_label":{"searchable":"true","cardinality":"multi","id":"subject_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},"qualifier":{"cardinality":"multi","id":"qualifier","type":"string","description":"Association qualifier. TBD: NEGATION should probably be handled differently somehow","display_name":"Qualifier","property":[]},"object_extension":{"cardinality":"multi","id":"object_extension","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"evidence":{"cardinality":"multi","id":"evidence","type":"string","description":"Evidence type. In Monarch we may have a graph/chain. This is always the outer evidence OR a list of all evidence types used?","display_name":"Evidence type","property":[]},"object_label":{"searchable":"true","id":"object_label","type":"string","description":"Label for association_object.","display_name":"Object","property":[]},"object_closure":{"cardinality":"multi","id":"object_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Object (Inferred)","property":[]},"subject_synonym":{"cardinality":"multi","id":"subject_synonym","type":"string","description":"synonyms for the entity in the association.subject field.","display_name":"Synonym","property":[]},"object_class_secondary_closure":{"cardinality":"multi","id":"object_class_secondary_closure","type":"string","description":"Optional. This is similar to object_class_closure, but allows for the scenario whereby a different (more inclusive, or exclusive) closure is used. The exact OPs used will depend on the association type. This would ideally be communicating from loader conf through to the client somehow","display_name":"Inferred object","property":[]},"object_class_closure":{"cardinality":"multi","id":"object_class_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Inferred object","property":[]},"subject_category_label":{"id":"subject_category_label","type":"string","description":"Label for association_subject_category","display_name":"Subject category","property":[]},"relation_closure_label":{"cardinality":"multi","id":"relation_closure_label","type":"string","description":"labels for association_relation_closure","display_name":"Inferred relationship","property":[]},"evidence_graph":{"id":"evidence_graph","type":"string","description":"Evidence graph","display_name":"Evidence graph formatted as graphson","property":[]},"object_class_closure_label":{"searchable":"tru","cardinality":"multi","id":"object_class_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Involved in","property":[]},"object_taxon_label":{"searchable":"true","id":"object_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},"object_category_label":{"id":"object_category_label","type":"string","description":"Label for association_object_category","display_name":"Object type","property":[]},"subject_description":{"searchable":"true","id":"subject_description","type":"string","description":"A more descriptive label or full name for association_subject. For a gene this may be the full name (as opposed to symbol).","display_name":"Subject description","property":[]},"is_redundant_for":{"id":"is_redundant_for","type":"string","description":"Rational for redundancy of annotation.","display_name":"Redundant for","property":[]},"evidence_closure_label":{"cardinality":"multi","id":"evidence_closure_label","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence label closure","property":[]},"object_category":{"id":"object_category","type":"string","description":"Category of association.object. Examples: phenotype, function, process, location, tissue, gene. In GO this is called aspect","display_name":"Object type","property":[]}},"document_category":"generic_association","weight":"20","_strict":0,"id":"generic_association","_outfile":"/Users/cjm/repos/monarch-app/conf/golr-views/oban-config.yaml"}}');
