var jQuery = require('jquery');
var bbop = require('bbop').bbop;
var bbopx = require('bbopx');
var amigo = require('amigo2');
var underscore = require('underscore');

angular
  .module('noctuaBasicApp')
  .controller('NoctuaBasicController', NoctuaBasicController);

function NoctuaBasicController($scope, $mdToast, $animate) {
  var phenotype_ageofonset_relation = "RO:0002488";
  var has_phenotype_relation = "BFO:0000051";

  // Events registry.
  var manager = null;
  var user_token = null;
  var compute_shield_modal = null;
  var _shields_up = null;
  var _shields_down = null;
  $scope.selected_disease = null;
  $scope.selected_phenotype = null;
  $scope.selected_ageofonset = null;
  $scope.selected_evidence = null;
  $scope.selected_reference = null;
  $scope.selected_description = null;

  $scope.response_model = null;


  $scope.init = function() {
    // Only roll if the env is correct.

    // Try to define token.
    if (global_barista_token) {
      user_token = global_barista_token;
    }

    // Next we need a manager to try and pull in the model.
    if (typeof(global_minerva_definition_name) === 'undefined' ||
      typeof(global_barista_location) === 'undefined') {
      alert('environment not ready');
    } else {
      manager = new bbopx.minerva.manager(global_barista_location,
        global_minerva_definition_name,
        user_token);
      initializeAutocomplete();
      initializeCallbacks();
      manager.get_model(model_id);
    }
  }

  var displayToast = function(type, msg) {
    $mdToast.show({
      template: '<md-toast class="md-toast ' + type + ' md-capsule">' + msg + '</md-toast>',
      hideDelay: 5000,
      position: 'bottom'
    });
  };

  $scope.create = function() {
    var r = new bbopx.minerva.request_set(manager.user_token())
    r.add_fact([r.add_individual($scope.selected_disease, model_id),
        r.add_individual($scope.selected_phenotype, model_id),
        has_phenotype_relation
      ],
      model_id);

    if ($scope.selected_ageofonset != "" && $scope.selected_ageofonset != null) {
      r.add_fact([r.last_individual_id(), r.add_individual($scope.selected_ageofonset, model_id), phenotype_ageofonset_relation], model_id);
    }

    if ($scope.selected_evidence != "" && $scope.selected_evidence != null) {
      r.add_annotation_to_individual("evidence", $scope.selected_evidence, r.last_individual_id(), model_id);
    }

    if ($scope.selected_reference != "" && $scope.selected_reference != null) {
      r.add_annotation_to_individual("source", $scope.selected_reference, r.last_individual_id(), model_id);
    }

    if ($scope.selected_description != "" && $scope.selected_description != null) {
      r.add_annotation_to_individual("comment", $scope.selected_description, r.last_individual_id(), model_id);
    }

    manager.request_with(r, "justdoit");
  }

  initializeCallbacks = function() {
    manager.register('error', 'errorargh', function(resp, man) {
      console.log("error");
      console.log(resp);
      displayToast("error", resp._message);
    }, 10);

    manager.register('rebuild', 'foorebuild', function(resp, man) {
      console.log('rebuild');
      console.log(resp);
      displayToast("success", resp._message);

      $scope.response_model = JSON.stringify(resp);
      $scope.$apply();
    }, 10);

    manager.register('merge', 'merdge', function(resp, man) {
      console.log('merge');
      console.log(resp);
      displayToast("success", resp._message);

      $scope.response_model = JSON.stringify(resp);
      $scope.$apply();
    }, 10);
  }

  initializeAutocomplete = function() {
    var gconf = new bbop.golr.conf(golr_json);
    golr_loc = 'http://localhost:8983/solr/'; // TODO delete
    var golr_manager_for_disease = new bbop.golr.manager.jquery(golr_loc, gconf);

    var gene_selectize = jQuery('#select_disease').solrautocomplete({
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
      golrManager: golr_manager_for_disease
    });

    var golr_manager_for_phenotype = new bbop.golr.manager.jquery(golr_loc, gconf);
    var phen = jQuery('#select_phenotype').solrautocomplete({
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
      golrManager: golr_manager_for_phenotype
    });

    var golr_manager_for_ageofonset = new bbop.golr.manager.jquery(golr_loc, gconf);
    var ageofonset = jQuery('#select_ageofonset').solrautocomplete({
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
  }


  // TODO take that conf from the Monarch App
  var golr_json = JSON.parse('{"generic_association":{"result_weights":"subject^7.0 subject_category^6.2 subject_taxon^6.5 relation^6.0  object^5.0 evidence^4.0","filter_weights":"subject_category^8.0 subject_taxon^7.5 subject_closure_label^7.0 relation_closure_label^6.5 evidence_closure_label^6.0 object_category^5.0 object_closure_label^4.5","_infile":"/Users/cjm/repos/monarch-app/conf/golr-views/oban-config.yaml","display_name":"Annotations","description":"Associations following OBAN model","schema_generating":"true","boost_weights":"subject^2.0 subject_label^1.0 object^2.0 object_label^1.0","fields":[{"id":"id","type":"uuid","description":"A unique identifier (CURIE) for the association. Optional.","display_name":"Association id","property":[]},{"id":"subject","type":"string","description":"The CURIE for oban:association_has_subject. May be disease, variant, gene, person, ....","display_name":"Subject","property":[]},{"searchable":"true","id":"subject_label","type":"string","description":"Label for association_subject. This will always be rdfs:label. Conventions may vary as to what goes in the label. For genes will be symbol, but we may choose to uniquify by prefixing with species","display_name":"Subject","property":[]},{"cardinality":"multi","id":"subject_closure","type":"string","description":"Reflexive closure of association_has_subject. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Subject (Inferred)","property":[]},{"searchable":"true","cardinality":"multi","id":"subject_closure_label","type":"string","description":"Labels for subject_closure.","display_name":"Subject (Inferred)","property":[]},{"id":"subject_category","type":"string","description":"Category of association.subject. Examples: gene, protein, disease, variant","display_name":"Subject category","property":[]},{"id":"subject_category_label","type":"string","description":"Label for association_subject_category","display_name":"Subject category","property":[]},{"searchable":"true","id":"subject_description","type":"string","description":"A more descriptive label or full name for association_subject. For a gene this may be the full name (as opposed to symbol).","display_name":"Subject description","property":[]},{"cardinality":"multi","id":"subject_synonym","type":"string","description":"synonyms for the entity in the association.subject field.","display_name":"Synonym","property":[]},{"id":"subject_taxon","type":"string","description":"Taxonomic class of the subject. This is typically a CURIE of the form NCBITaxon:nnnn.","display_name":"Taxon","property":[]},{"searchable":"true","id":"subject_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},{"cardinality":"multi","id":"subject_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},{"searchable":"true","cardinality":"multi","id":"subject_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},{"searchable":"true","id":"subject_family","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},{"searchable":"true","id":"subject_family_label","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},{"id":"relation","type":"string","description":"A relationship type that connects the subject with object. TODO: check for correspondence in OBAN","display_name":"Relationship","property":[]},{"id":"relation_label","type":"string","description":"Label for association_relation","display_name":"Relationship","property":[]},{"cardinality":"multi","id":"relation_closure","type":"string","description":"SubPropertyOf reflexive closure for association_relation","display_name":"Inferred relationship","property":[]},{"cardinality":"multi","id":"relation_closure_label","type":"string","description":"labels for association_relation_closure","display_name":"Inferred relationship","property":[]},{"cardinality":"multi","id":"qualifier","type":"string","description":"Association qualifier. TBD: NEGATION should probably be handled differently somehow","display_name":"Qualifier","property":[]},{"id":"object","type":"string","description":"The CURIE for oban:association_has_object. This is often, but not always an ontology class. E.g. for a gene-gene interaction it is an (arbitrary) member of the pair.","display_name":"Object","property":[]},{"searchable":"true","id":"object_label","type":"string","description":"Label for association_object.","display_name":"Object","property":[]},{"cardinality":"multi","id":"object_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Object (Inferred)","property":[]},{"searchable":"true","cardinality":"multi","id":"object_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Object (Inferred)","property":[]},{"id":"object_category","type":"string","description":"Category of association.object. Examples: phenotype, function, process, location, tissue, gene. In GO this is called aspect","display_name":"Object type","property":[]},{"id":"object_category_label","type":"string","description":"Label for association_object_category","display_name":"Object type","property":[]},{"id":"object_taxon","type":"string","description":"Taxonomic class of the object. This is typically a CURIE of the form NCBITaxon:nnnn. This field may be unfilled when used with certain categories","display_name":"Taxon","property":[]},{"searchable":"true","id":"object_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},{"cardinality":"multi","id":"object_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},{"searchable":"true","cardinality":"multi","id":"object_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},{"id":"object_isoform","type":"string","description":"Assoc object alternate form. E.g. for a canonical protein may be isoforms. Can we generalize this? May be deleted","display_name":"Isoform","property":[]},{"cardinality":"multi","id":"object_class_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Inferred object","property":[]},{"searchable":"tru","cardinality":"multi","id":"object_class_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Involved in","property":[]},{"cardinality":"multi","id":"object_class_secondary_closure","type":"string","description":"Optional. This is similar to object_class_closure, but allows for the scenario whereby a different (more inclusive, or exclusive) closure is used. The exact OPs used will depend on the association type. This would ideally be communicating from loader conf through to the client somehow","display_name":"Inferred object","property":[]},{"searchable":"true","cardinality":"multi","id":"object_class_secondary_closure_label","type":"string","description":"Labels for object_class_secondary_closure.","display_name":"Involved in","property":[]},{"cardinality":"multi","id":"object_extension","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"searchable":"true","cardinality":"multi","id":"object_extension_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"cardinality":"multi","id":"object_extension_closure","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"searchable":"true","cardinality":"multi","id":"object_extension_closure_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"cardinality":"multi","id":"object_extension_json","type":"string","description":"Extension class for the annotation (JSON).","display_name":"Annotation extension","property":[]},{"id":"source","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Source","property":[]},{"id":"date","type":"string","description":"Date of assignment. The association may be derived from multiple source, but this should be the outer source, if applicable.","display_name":"Date","property":[]},{"id":"assigned_by","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Assigned by","property":[]},{"id":"is_redundant_for","type":"string","description":"Rational for redundancy of annotation.","display_name":"Redundant for","property":[]},{"id":"evidence_graph","type":"string","description":"Evidence graph","display_name":"Evidence graph formatted as graphson","property":[]},{"cardinality":"multi","id":"evidence","type":"string","description":"Evidence type. In Monarch we may have a graph/chain. This is always the outer evidence OR a list of all evidence types used?","display_name":"Evidence type","property":[]},{"cardinality":"multi","id":"evidence_label","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence label","property":[]},{"cardinality":"multi","id":"evidence_closure","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence type","property":[]},{"cardinality":"multi","id":"evidence_closure_label","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence label closure","property":[]},{"cardinality":"multi","id":"evidence_object","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence from","property":[]},{"cardinality":"multi","id":"citation","type":"string","description":"citation.","display_name":"Reference","property":[]}],"fields_hash":{"object_taxon_closure":{"cardinality":"multi","id":"object_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},"object_class_secondary_closure_label":{"searchable":"true","cardinality":"multi","id":"object_class_secondary_closure_label","type":"string","description":"Labels for object_class_secondary_closure.","display_name":"Involved in","property":[]},"date":{"id":"date","type":"string","description":"Date of assignment. The association may be derived from multiple source, but this should be the outer source, if applicable.","display_name":"Date","property":[]},"subject_family_label":{"searchable":"true","id":"subject_family_label","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},"object_isoform":{"id":"object_isoform","type":"string","description":"Assoc object alternate form. E.g. for a canonical protein may be isoforms. Can we generalize this? May be deleted","display_name":"Isoform","property":[]},"object_taxon":{"id":"object_taxon","type":"string","description":"Taxonomic class of the object. This is typically a CURIE of the form NCBITaxon:nnnn. This field may be unfilled when used with certain categories","display_name":"Taxon","property":[]},"relation_label":{"id":"relation_label","type":"string","description":"Label for association_relation","display_name":"Relationship","property":[]},"object_taxon_closure_label":{"searchable":"true","cardinality":"multi","id":"object_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},"subject_closure":{"cardinality":"multi","id":"subject_closure","type":"string","description":"Reflexive closure of association_has_subject. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Subject (Inferred)","property":[]},"subject_taxon_label":{"searchable":"true","id":"subject_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},"id":{"id":"id","type":"uuid","description":"A unique identifier (CURIE) for the association. Optional.","display_name":"Association id","property":[]},"subject_closure_label":{"searchable":"true","cardinality":"multi","id":"subject_closure_label","type":"string","description":"Labels for subject_closure.","display_name":"Subject (Inferred)","property":[]},"subject_taxon_closure":{"cardinality":"multi","id":"subject_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},"citation":{"cardinality":"multi","id":"citation","type":"string","description":"citation.","display_name":"Reference","property":[]},"subject":{"id":"subject","type":"string","description":"The CURIE for oban:association_has_subject. May be disease, variant, gene, person, ....","display_name":"Subject","property":[]},"subject_label":{"searchable":"true","id":"subject_label","type":"string","description":"Label for association_subject. This will always be rdfs:label. Conventions may vary as to what goes in the label. For genes will be symbol, but we may choose to uniquify by prefixing with species","display_name":"Subject","property":[]},"subject_category":{"id":"subject_category","type":"string","description":"Category of association.subject. Examples: gene, protein, disease, variant","display_name":"Subject category","property":[]},"evidence_closure":{"cardinality":"multi","id":"evidence_closure","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence type","property":[]},"subject_taxon":{"id":"subject_taxon","type":"string","description":"Taxonomic class of the subject. This is typically a CURIE of the form NCBITaxon:nnnn.","display_name":"Taxon","property":[]},"relation":{"id":"relation","type":"string","description":"A relationship type that connects the subject with object. TODO: check for correspondence in OBAN","display_name":"Relationship","property":[]},"evidence_object":{"cardinality":"multi","id":"evidence_object","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence from","property":[]},"assigned_by":{"id":"assigned_by","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Assigned by","property":[]},"object_closure_label":{"searchable":"true","cardinality":"multi","id":"object_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Object (Inferred)","property":[]},"evidence_label":{"cardinality":"multi","id":"evidence_label","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence label","property":[]},"source":{"id":"source","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Source","property":[]},"object_extension_closure_label":{"searchable":"true","cardinality":"multi","id":"object_extension_closure_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"object":{"id":"object","type":"string","description":"The CURIE for oban:association_has_object. This is often, but not always an ontology class. E.g. for a gene-gene interaction it is an (arbitrary) member of the pair.","display_name":"Object","property":[]},"object_extension_label":{"searchable":"true","cardinality":"multi","id":"object_extension_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"object_extension_closure":{"cardinality":"multi","id":"object_extension_closure","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"subject_family":{"searchable":"true","id":"subject_family","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},"relation_closure":{"cardinality":"multi","id":"relation_closure","type":"string","description":"SubPropertyOf reflexive closure for association_relation","display_name":"Inferred relationship","property":[]},"object_extension_json":{"cardinality":"multi","id":"object_extension_json","type":"string","description":"Extension class for the annotation (JSON).","display_name":"Annotation extension","property":[]},"subject_taxon_closure_label":{"searchable":"true","cardinality":"multi","id":"subject_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},"qualifier":{"cardinality":"multi","id":"qualifier","type":"string","description":"Association qualifier. TBD: NEGATION should probably be handled differently somehow","display_name":"Qualifier","property":[]},"object_extension":{"cardinality":"multi","id":"object_extension","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"evidence":{"cardinality":"multi","id":"evidence","type":"string","description":"Evidence type. In Monarch we may have a graph/chain. This is always the outer evidence OR a list of all evidence types used?","display_name":"Evidence type","property":[]},"object_label":{"searchable":"true","id":"object_label","type":"string","description":"Label for association_object.","display_name":"Object","property":[]},"object_closure":{"cardinality":"multi","id":"object_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Object (Inferred)","property":[]},"subject_synonym":{"cardinality":"multi","id":"subject_synonym","type":"string","description":"synonyms for the entity in the association.subject field.","display_name":"Synonym","property":[]},"object_class_secondary_closure":{"cardinality":"multi","id":"object_class_secondary_closure","type":"string","description":"Optional. This is similar to object_class_closure, but allows for the scenario whereby a different (more inclusive, or exclusive) closure is used. The exact OPs used will depend on the association type. This would ideally be communicating from loader conf through to the client somehow","display_name":"Inferred object","property":[]},"object_class_closure":{"cardinality":"multi","id":"object_class_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Inferred object","property":[]},"subject_category_label":{"id":"subject_category_label","type":"string","description":"Label for association_subject_category","display_name":"Subject category","property":[]},"relation_closure_label":{"cardinality":"multi","id":"relation_closure_label","type":"string","description":"labels for association_relation_closure","display_name":"Inferred relationship","property":[]},"evidence_graph":{"id":"evidence_graph","type":"string","description":"Evidence graph","display_name":"Evidence graph formatted as graphson","property":[]},"object_class_closure_label":{"searchable":"tru","cardinality":"multi","id":"object_class_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Involved in","property":[]},"object_taxon_label":{"searchable":"true","id":"object_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},"object_category_label":{"id":"object_category_label","type":"string","description":"Label for association_object_category","display_name":"Object type","property":[]},"subject_description":{"searchable":"true","id":"subject_description","type":"string","description":"A more descriptive label or full name for association_subject. For a gene this may be the full name (as opposed to symbol).","display_name":"Subject description","property":[]},"is_redundant_for":{"id":"is_redundant_for","type":"string","description":"Rational for redundancy of annotation.","display_name":"Redundant for","property":[]},"evidence_closure_label":{"cardinality":"multi","id":"evidence_closure_label","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence label closure","property":[]},"object_category":{"id":"object_category","type":"string","description":"Category of association.object. Examples: phenotype, function, process, location, tissue, gene. In GO this is called aspect","display_name":"Object type","property":[]}},"document_category":"generic_association","weight":"20","_strict":0,"id":"generic_association","_outfile":"/Users/cjm/repos/monarch-app/conf/golr-views/oban-config.yaml"}}');
}
