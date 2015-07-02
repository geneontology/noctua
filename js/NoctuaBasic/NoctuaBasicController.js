var jQuery = require('jquery');
var bbop = require('bbop').bbop;
var bbopx = require('bbopx');
var amigo = require('amigo2');
var underscore = require('underscore');
var graph_api = require('bbop-graph-noctua');

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
  var graph = new graph_api.graph();
  $scope.selected_disease = null;
  $scope.selected_phenotype = null;
  $scope.selected_ageofonset = null;
  $scope.selected_evidence = null;
  $scope.selected_reference = null;
  $scope.selected_description = null;
  $scope.grid_model = [];

  $scope.response_model = null;

  var compute_shield_modal = null;

  // Block interface from taking user input while
  // operating.
  var _shields_up = function() {
    if (compute_shield_modal) {
      // Already have one.
    } else {
      compute_shield_modal = bbopx.noctua.widgets.compute_shield();
      compute_shield_modal.show();
    }
  }

  // Release interface when transaction done.
  var _shields_down = function() {
    if (compute_shield_modal) {
      compute_shield_modal.destroy();
      compute_shield_modal = null;
    } else {
      // None to begin with.
    }
  }

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

  // type is 'error' or 'success'
  var displayToast = function(type, msg) {
    $mdToast.show({
      template: '<md-toast class="md-toast ' + type + ' md-capsule">' + msg + '</md-toast>',
      hideDelay: 5000,
      position: 'bottom'
    });
  };

  sanity_check = function() {
    if ($scope.selected_disease == "" || $scope.selected_disease == null) {
      displayToast('error', 'Disease cannot be empty.');
      return false;
    } else if ($scope.selected_phenotype == "" || $scope.selected_phenotype == null) {
      displayToast('error', 'Phenotype cannot be empty.');
      return false;
    } else {
      return true;
    }
  }

  $scope.store = function() {
    _shields_up();
    manager.store_model(model_id);
    _shields_down();
  }

  // TODO this should not be called on load
  $scope.$watch('model_title', function(newValue, oldValue) {
    if (newValue != oldValue) {
      if ($scope.model_title != "" && $scope.model_title != null) {
        var r = new bbopx.minerva.request_set(manager.user_token())
        r.remove_annotation_from_model("title", oldValue, model_id);
        r.add_annotation_to_model("title", newValue, model_id);

        manager.request_with(r, "edit_title");
      } else {
        displayToast("error", "Model title cannot be empty.");
      }
    }
  });

  getExistingIndividualId = function(id, nodes) {
    var returnVal = null; // jQuery loop does not stop on return
    jQuery.each(nodes, function(key, value) {
      if (isType(id, value)) {
        returnVal = value;
      }
    });
    return returnVal._id;
  }

  isType = function(type, node) {
    var types = node._types;
    if (types.length == 1) {
      return types[0].class_id() == type;
    } else {
      return false;
    }
  }

  extract_class_id_from_node = function(node) {
    var types = node._types;
    if (types.length == 1) {
      return types[0].class_id();
    } else {
      return "";
    }
  }

  extract_class_label_from_node = function(node) {
    var types = node._types;
    if (types.length == 1) {
      return types[0].class_label();
    } else {
      return "";
    }
  }

  refresh_ui = function() {
    build_table();
    refresh_title();
  }

  refresh_title = function() {
    annotations = graph.get_annotations_by_key("title");
    if (annotations.length == 0) {
      // no title set yet
    } else {
      title = annotations[0].value(); // there should be only one
      $scope.model_title = title;
    }
  }

  $scope.create = function(disease_id, phenotype_id, ageofonset_id, evidence, reference, description) {
    _shields_up();
    if (sanity_check()) {
      var r = new bbopx.minerva.request_set(manager.user_token());
      var nodes = graph.get_nodes();
      // fetching exising disease individual if it exists
      var existing_disease_id = getExistingIndividualId(disease_id, nodes)
      requestSetForCreation(r, disease_id, phenotype_id, ageofonset_id, evidence, reference, description, existing_disease_id);
      manager.request_with(r, "create");
    }
  }

  $scope.editRowModal = function(row) {
    $scope.selected_disease_modal = row.disease_id;
    $scope.selected_phenotype_modal = row.phenotype_id;
    $scope.selected_ageofonset_modal = row.ageofonset_id;
    $scope.selected_evidence_modal = row.evidence;
    $scope.selected_reference_modal = row.reference;
    $scope.selected_description_modal = row.description;

    // keep them as reference for the deletion
    $scope.selected_disease_node_id_modal_previous = row.disease_node_id;
    $scope.selected_disease_id_modal_previous = row.disease_id;
    $scope.selected_phenotype_node_id_modal_previous = row.phenotype_node_id;
    $scope.selected_ageofonset_node_id_modal_previous = row.ageofonset_node_id;
    $

    disease_selectize = jQuery('#select_disease_modal')[0].selectize;
    disease_selectize.clearCache("option");
    disease_selectize.clearOptions();
    disease_selectize.addOption([{
      "object": row.disease_id,
      "object_label_searchable": row.disease_label
    }]);
    disease_selectize.setValue(row.disease_id);

    phenotype_selectize = jQuery('#select_phenotype_modal')[0].selectize;
    phenotype_selectize.clearCache("option");
    phenotype_selectize.clearOptions();
    phenotype_selectize.addOption([{
      "object": row.phenotype_id,
      "object_label_searchable": row.phenotype_label
    }]);
    phenotype_selectize.setValue(row.phenotype_id);

    ageofonset_selectize = jQuery('#select_ageofonset_modal')[0].selectize;
    ageofonset_selectize.clearCache("option");
    ageofonset_selectize.clearOptions();
    ageofonset_selectize.addOption([{
      "object": row.ageofonset_id,
      "object_label_searchable": row.ageofonset_label
    }]);
    ageofonset_selectize.setValue(row.ageofonset_id);

    jQuery('#myModal').modal();
  }

  $scope.editRow = function() {
    _shields_up();

    var existing_disease = null;
    if ($scope.selected_disease_id_modal_previous == $scope.selected_disease_modal) {
      var edges_from_disease = graph.get_edges_by_subject($scope.selected_disease_node_id_modal_previous);
      if (edges_from_disease.length > 1) { // disease is not scheduled for deletion
        existing_disease = $scope.selected_disease_node_id_modal_previous;
      }
    }

    var r = new bbopx.minerva.request_set(manager.user_token());
    requestSetForDeletion(r, $scope.selected_disease_node_id_modal_previous, $scope.selected_phenotype_node_id_modal_previous, $scope.selected_ageofonset_node_id_modal_previous);
    requestSetForCreation(r, $scope.selected_disease_modal, $scope.selected_phenotype_modal, $scope.selected_ageofonset_modal, $scope.selected_evidence_modal, $scope.selected_reference_modal, $scope.selected_description_modal, existing_disease);
    manager.request_with(r, "edit_row");
  }

  $scope.deleteRow = function(disease_node_id, phenotype_node_id, ageofonset_node_id) {
    _shields_up();
    var r = new bbopx.minerva.request_set(manager.user_token());
    requestSetForDeletion(r, disease_node_id, phenotype_node_id, ageofonset_node_id);
    manager.request_with(r, "remove_row");
  }

  requestSetForDeletion = function(request_set, disease_node_id, phenotype_node_id, ageofonset_node_id) {
    var edges_from_disease = graph.get_edges_by_subject(disease_node_id);

    if (edges_from_disease.length == 1) { // delete only if there will be no edges left
      request_set.remove_individual(disease_node_id, model_id);
    }
    request_set.remove_individual(phenotype_node_id, model_id);
    if (ageofonset_node_id != "") {
      request_set.remove_individual(ageofonset_node_id, model_id);
    }
  }

  requestSetForCreation = function(request_set, disease_id, phenotype_id, ageofonset_id, evidence, reference, description, existing_disease_id) {
    if (existing_disease_id == null) {
      request_set.add_fact([request_set.add_individual(disease_id, model_id),
          request_set.add_individual(phenotype_id, model_id),
          has_phenotype_relation
        ],
        model_id);
    } else {
      request_set.add_fact([existing_disease_id,
          request_set.add_individual(phenotype_id, model_id),
          has_phenotype_relation
        ],
        model_id);
    }

    // Attach the metadata to the phenotype individual
    if (evidence != "" && evidence != null) {
      request_set.add_annotation_to_individual("evidence", evidence, request_set.last_individual_id(), model_id);
    }

    if (reference != "" && reference != null) {
      request_set.add_annotation_to_individual("source", reference, request_set.last_individual_id(), model_id);
    }

    if (description != "" && description != null) {
      request_set.add_annotation_to_individual("comment", description, request_set.last_individual_id(), model_id);
    }

    if (ageofonset_id != "" && ageofonset_id != null) {
      request_set.add_fact([request_set.last_individual_id(), request_set.add_individual(ageofonset_id, model_id), phenotype_ageofonset_relation], model_id);
    }
  }

  build_table = function() {
    $scope.grid_model = [];
    var edges = graph.all_edges();
    var has_phenotype_edges = underscore.filter(edges, function(edge) {
      return edge._predicate_id == has_phenotype_relation;
    });
    var phenotype_ageofonset_edges = underscore.filter(edges, function(edge) {
      return edge._predicate_id == phenotype_ageofonset_relation;
    });

    for (var i in has_phenotype_edges) {
      var current_edge = has_phenotype_edges[i];
      var edges_from_phenotype = graph.get_edges_by_subject(current_edge.target());
      var age_of_onset_node_id = "";
      var age_of_onset_id = "";
      var age_of_onset_label = "";
      var age_of_onset_display = "";
      if (edges_from_phenotype.length > 0) {
        age_of_onset_node = graph.get_node(edges_from_phenotype[0].target());
        age_of_onset_id = extract_class_id_from_node(age_of_onset_node);
        age_of_onset_node_id = age_of_onset_node.id();
        age_of_onset_label = extract_class_label_from_node(age_of_onset_node);
        age_of_onset_display = age_of_onset_id + " (" + age_of_onset_label + ")";
      }

      var disease_node = graph.get_node(current_edge.source());

      var phenotype_node = graph.get_node(current_edge.target());
      var annotations = phenotype_node._annotations;

      var evidence = "";
      var reference = "";
      var description = "";
      for (var i in annotations) {
        var annotation = annotations[i];
        var key = annotation._properties.key;
        var value = annotation._properties.value;
        if (key == "evidence") {
          evidence = value;
        } else if (key == "source") {
          reference = value;
        } else if (key == "comment") {
          description = value;
        }
      }

      $scope.grid_model.push({
        "disease": extract_class_id_from_node(disease_node) + " (" + extract_class_label_from_node(disease_node) + ")",
        "disease_node_id": disease_node.id(),
        "disease_id": extract_class_id_from_node(disease_node),
        "disease_label": extract_class_label_from_node(disease_node),
        "phenotype": extract_class_id_from_node(phenotype_node) + " (" + extract_class_label_from_node(phenotype_node) + ")",
        "phenotype_node_id": phenotype_node.id(),
        "phenotype_id": extract_class_id_from_node(phenotype_node),
        "phenotype_label": extract_class_label_from_node(phenotype_node),
        "ageofonset": age_of_onset_display,
        "ageofonset_node_id": age_of_onset_node_id,
        "ageofonset_id": age_of_onset_id,
        "ageofonset_label": age_of_onset_label,
        "evidence": evidence,
        "reference": reference,
        "description": description
      });
    }
  }

  initializeCallbacks = function() {
    manager.register('error', 'errorargh', function(resp, man) {
      console.log("error");
      console.log(resp);
      _shields_down();
      displayToast("error", resp._message);
    }, 10);

    manager.register('rebuild', 'foorebuild', function(resp, man) {
      console.log('rebuild');
      console.log(resp);
      _shields_down();
      displayToast("success", resp._message);

      $scope.response_model = JSON.stringify(resp);

      var tmp_graph = new graph_api.graph();
      tmp_graph.load_data_base(resp.data());
      graph = tmp_graph;
      refresh_ui();

      $scope.$apply();
    }, 10);

    manager.register('merge', 'merdge', function(resp, man) {
      console.log('merge');
      console.log(resp);
      _shields_down();
      displayToast("success", resp._message);

      $scope.response_model = JSON.stringify(resp);
      var tmp_graph = new graph_api.graph();
      tmp_graph.load_data_base(resp.data());
      graph.update_with(tmp_graph);
      refresh_ui();

      $scope.$apply();
    }, 10);
  }

  initializeAutocomplete = function() {
    var gconf = new bbop.golr.conf(golr_json);
    //golr_loc = 'http://localhost:8983/solr/';
    golr_loc = 'http://sirius.monarchinitiative.org:8080/solr/golr/';

    var golr_manager_for_disease = new bbop.golr.manager.jquery(golr_loc, gconf);
    disease_autocomplete_options = {
      onChange: function(value) {
        console.log(value);
      },
      required: true,
      optionDisplay: function(item, escape) {
        return '<div>' +
          item.object + ' (' + item.object_label_searchable + ')' +
          '</div>';
      },
      itemDisplay: function(item, escape) {
        return '<div>' +
          item.object + ' (' + item.object_label_searchable + ')' +
          '</div>';
      },
      valueField: 'object',
      searchField: ['object', 'object_label_searchable'],
      queryData: function(query) {
        return 'object_category:disease AND object:*' + query.replace(':', '\\:').toUpperCase() + '*';
      },
      golrManager: golr_manager_for_disease
    };
    jQuery('#select_disease').solrautocomplete(disease_autocomplete_options);
    jQuery('#select_disease_modal').solrautocomplete(disease_autocomplete_options);

    var golr_manager_for_phenotype = new bbop.golr.manager.jquery(golr_loc, gconf);
    phenotype_autocomplete_options = {
      onChange: function(value) {
        console.log(value);
      },
      required: true,
      optionDisplay: function(item, escape) {
        return '<div>' +
          item.object + ' (' + item.object_label_searchable + ')' +
          '</div>';
      },
      itemDisplay: function(item, escape) {
        return '<div>' +
          item.object + ' (' + item.object_label_searchable + ')' +
          '</div>';
      },
      valueField: 'object',
      searchField: ['object', 'object_label_searchable'],
      queryData: function(query) {
        return 'object_category:phenotype AND object:*' + query.replace(':', '\\:').toUpperCase() + '*';
      },
      golrManager: golr_manager_for_phenotype
    };
    jQuery('#select_phenotype').solrautocomplete(phenotype_autocomplete_options);
    jQuery('#select_phenotype_modal').solrautocomplete(phenotype_autocomplete_options);

    var golr_manager_for_ageofonset = new bbop.golr.manager.jquery(golr_loc, gconf);
    var ageofonset_autocomplete_options = {
      onChange: function(value) {
        console.log(value);
      },
      optionDisplay: function(item, escape) {
        return '<div>' +
          item.object + ' (' + item.object_label_searchable + ')' +
          '</div>';
      },
      itemDisplay: function(item, escape) {
        return '<div>' +
          item.object + ' (' + item.object_label_searchable + ')' +
          '</div>';
      },
      valueField: 'object',
      searchField: ['object', 'object_label_searchable'],
      queryData: function(query) {
        return 'object_category:ageofonset AND object:*' + query.replace(':', '\\:').toUpperCase() + '*';
      },
      golrManager: golr_manager_for_ageofonset
    };
    jQuery('#select_ageofonset').solrautocomplete(ageofonset_autocomplete_options);
    jQuery('#select_ageofonset_modal').solrautocomplete(ageofonset_autocomplete_options);
  }


  // TODO take that conf from the Monarch App
  var golr_json = JSON.parse('{"generic_association":{"result_weights":"subject^7.0 subject_category^6.2 subject_taxon^6.5 relation^6.0  object^5.0 evidence^4.0","filter_weights":"subject_category^8.0 subject_taxon^7.5 subject_closure_label^7.0 relation_closure_label^6.5 evidence_closure_label^6.0 object_category^5.0 object_closure_label^4.5","_infile":"/Users/cjm/repos/monarch-app/conf/golr-views/oban-config.yaml","display_name":"Annotations","description":"Associations following OBAN model","schema_generating":"true","boost_weights":"subject^2.0 subject_label^1.0 object^2.0 object_label^1.0","fields":[{"id":"id","type":"uuid","description":"A unique identifier (CURIE) for the association. Optional.","display_name":"Association id","property":[]},{"id":"subject","type":"string","description":"The CURIE for oban:association_has_subject. May be disease, variant, gene, person, ....","display_name":"Subject","property":[]},{"searchable":"true","id":"subject_label","type":"string","description":"Label for association_subject. This will always be rdfs:label. Conventions may vary as to what goes in the label. For genes will be symbol, but we may choose to uniquify by prefixing with species","display_name":"Subject","property":[]},{"cardinality":"multi","id":"subject_closure","type":"string","description":"Reflexive closure of association_has_subject. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Subject (Inferred)","property":[]},{"searchable":"true","cardinality":"multi","id":"subject_closure_label","type":"string","description":"Labels for subject_closure.","display_name":"Subject (Inferred)","property":[]},{"id":"subject_category","type":"string","description":"Category of association.subject. Examples: gene, protein, disease, variant","display_name":"Subject category","property":[]},{"id":"subject_category_label","type":"string","description":"Label for association_subject_category","display_name":"Subject category","property":[]},{"searchable":"true","id":"subject_description","type":"string","description":"A more descriptive label or full name for association_subject. For a gene this may be the full name (as opposed to symbol).","display_name":"Subject description","property":[]},{"cardinality":"multi","id":"subject_synonym","type":"string","description":"synonyms for the entity in the association.subject field.","display_name":"Synonym","property":[]},{"id":"subject_taxon","type":"string","description":"Taxonomic class of the subject. This is typically a CURIE of the form NCBITaxon:nnnn.","display_name":"Taxon","property":[]},{"searchable":"true","id":"subject_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},{"cardinality":"multi","id":"subject_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},{"searchable":"true","cardinality":"multi","id":"subject_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},{"searchable":"true","id":"subject_family","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},{"searchable":"true","id":"subject_family_label","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},{"id":"relation","type":"string","description":"A relationship type that connects the subject with object. TODO: check for correspondence in OBAN","display_name":"Relationship","property":[]},{"id":"relation_label","type":"string","description":"Label for association_relation","display_name":"Relationship","property":[]},{"cardinality":"multi","id":"relation_closure","type":"string","description":"SubPropertyOf reflexive closure for association_relation","display_name":"Inferred relationship","property":[]},{"cardinality":"multi","id":"relation_closure_label","type":"string","description":"labels for association_relation_closure","display_name":"Inferred relationship","property":[]},{"cardinality":"multi","id":"qualifier","type":"string","description":"Association qualifier. TBD: NEGATION should probably be handled differently somehow","display_name":"Qualifier","property":[]},{"id":"object","type":"string","description":"The CURIE for oban:association_has_object. This is often, but not always an ontology class. E.g. for a gene-gene interaction it is an (arbitrary) member of the pair.","display_name":"Object","property":[]},{"searchable":"true","id":"object_label","type":"string","description":"Label for association_object.","display_name":"Object","property":[]},{"cardinality":"multi","id":"object_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Object (Inferred)","property":[]},{"searchable":"true","cardinality":"multi","id":"object_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Object (Inferred)","property":[]},{"id":"object_category","type":"string","description":"Category of association.object. Examples: phenotype, function, process, location, tissue, gene. In GO this is called aspect","display_name":"Object type","property":[]},{"id":"object_category_label","type":"string","description":"Label for association_object_category","display_name":"Object type","property":[]},{"id":"object_taxon","type":"string","description":"Taxonomic class of the object. This is typically a CURIE of the form NCBITaxon:nnnn. This field may be unfilled when used with certain categories","display_name":"Taxon","property":[]},{"searchable":"true","id":"object_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},{"cardinality":"multi","id":"object_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},{"searchable":"true","cardinality":"multi","id":"object_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},{"id":"object_isoform","type":"string","description":"Assoc object alternate form. E.g. for a canonical protein may be isoforms. Can we generalize this? May be deleted","display_name":"Isoform","property":[]},{"cardinality":"multi","id":"object_class_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Inferred object","property":[]},{"searchable":"tru","cardinality":"multi","id":"object_class_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Involved in","property":[]},{"cardinality":"multi","id":"object_class_secondary_closure","type":"string","description":"Optional. This is similar to object_class_closure, but allows for the scenario whereby a different (more inclusive, or exclusive) closure is used. The exact OPs used will depend on the association type. This would ideally be communicating from loader conf through to the client somehow","display_name":"Inferred object","property":[]},{"searchable":"true","cardinality":"multi","id":"object_class_secondary_closure_label","type":"string","description":"Labels for object_class_secondary_closure.","display_name":"Involved in","property":[]},{"cardinality":"multi","id":"object_extension","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"searchable":"true","cardinality":"multi","id":"object_extension_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"cardinality":"multi","id":"object_extension_closure","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"searchable":"true","cardinality":"multi","id":"object_extension_closure_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"cardinality":"multi","id":"object_extension_json","type":"string","description":"Extension class for the annotation (JSON).","display_name":"Annotation extension","property":[]},{"id":"source","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Source","property":[]},{"id":"date","type":"string","description":"Date of assignment. The association may be derived from multiple source, but this should be the outer source, if applicable.","display_name":"Date","property":[]},{"id":"assigned_by","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Assigned by","property":[]},{"id":"is_redundant_for","type":"string","description":"Rational for redundancy of annotation.","display_name":"Redundant for","property":[]},{"id":"evidence_graph","type":"string","description":"Evidence graph","display_name":"Evidence graph formatted as graphson","property":[]},{"cardinality":"multi","id":"evidence","type":"string","description":"Evidence type. In Monarch we may have a graph/chain. This is always the outer evidence OR a list of all evidence types used?","display_name":"Evidence type","property":[]},{"cardinality":"multi","id":"evidence_label","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence label","property":[]},{"cardinality":"multi","id":"evidence_closure","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence type","property":[]},{"cardinality":"multi","id":"evidence_closure_label","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence label closure","property":[]},{"cardinality":"multi","id":"evidence_object","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence from","property":[]},{"cardinality":"multi","id":"citation","type":"string","description":"citation.","display_name":"Reference","property":[]}],"fields_hash":{"object_taxon_closure":{"cardinality":"multi","id":"object_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},"object_class_secondary_closure_label":{"searchable":"true","cardinality":"multi","id":"object_class_secondary_closure_label","type":"string","description":"Labels for object_class_secondary_closure.","display_name":"Involved in","property":[]},"date":{"id":"date","type":"string","description":"Date of assignment. The association may be derived from multiple source, but this should be the outer source, if applicable.","display_name":"Date","property":[]},"subject_family_label":{"searchable":"true","id":"subject_family_label","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},"object_isoform":{"id":"object_isoform","type":"string","description":"Assoc object alternate form. E.g. for a canonical protein may be isoforms. Can we generalize this? May be deleted","display_name":"Isoform","property":[]},"object_taxon":{"id":"object_taxon","type":"string","description":"Taxonomic class of the object. This is typically a CURIE of the form NCBITaxon:nnnn. This field may be unfilled when used with certain categories","display_name":"Taxon","property":[]},"relation_label":{"id":"relation_label","type":"string","description":"Label for association_relation","display_name":"Relationship","property":[]},"object_taxon_closure_label":{"searchable":"true","cardinality":"multi","id":"object_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},"subject_closure":{"cardinality":"multi","id":"subject_closure","type":"string","description":"Reflexive closure of association_has_subject. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Subject (Inferred)","property":[]},"subject_taxon_label":{"searchable":"true","id":"subject_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},"id":{"id":"id","type":"uuid","description":"A unique identifier (CURIE) for the association. Optional.","display_name":"Association id","property":[]},"subject_closure_label":{"searchable":"true","cardinality":"multi","id":"subject_closure_label","type":"string","description":"Labels for subject_closure.","display_name":"Subject (Inferred)","property":[]},"subject_taxon_closure":{"cardinality":"multi","id":"subject_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},"citation":{"cardinality":"multi","id":"citation","type":"string","description":"citation.","display_name":"Reference","property":[]},"subject":{"id":"subject","type":"string","description":"The CURIE for oban:association_has_subject. May be disease, variant, gene, person, ....","display_name":"Subject","property":[]},"subject_label":{"searchable":"true","id":"subject_label","type":"string","description":"Label for association_subject. This will always be rdfs:label. Conventions may vary as to what goes in the label. For genes will be symbol, but we may choose to uniquify by prefixing with species","display_name":"Subject","property":[]},"subject_category":{"id":"subject_category","type":"string","description":"Category of association.subject. Examples: gene, protein, disease, variant","display_name":"Subject category","property":[]},"evidence_closure":{"cardinality":"multi","id":"evidence_closure","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence type","property":[]},"subject_taxon":{"id":"subject_taxon","type":"string","description":"Taxonomic class of the subject. This is typically a CURIE of the form NCBITaxon:nnnn.","display_name":"Taxon","property":[]},"relation":{"id":"relation","type":"string","description":"A relationship type that connects the subject with object. TODO: check for correspondence in OBAN","display_name":"Relationship","property":[]},"evidence_object":{"cardinality":"multi","id":"evidence_object","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence from","property":[]},"assigned_by":{"id":"assigned_by","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Assigned by","property":[]},"object_closure_label":{"searchable":"true","cardinality":"multi","id":"object_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Object (Inferred)","property":[]},"evidence_label":{"cardinality":"multi","id":"evidence_label","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence label","property":[]},"source":{"id":"source","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Source","property":[]},"object_extension_closure_label":{"searchable":"true","cardinality":"multi","id":"object_extension_closure_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"object":{"id":"object","type":"string","description":"The CURIE for oban:association_has_object. This is often, but not always an ontology class. E.g. for a gene-gene interaction it is an (arbitrary) member of the pair.","display_name":"Object","property":[]},"object_extension_label":{"searchable":"true","cardinality":"multi","id":"object_extension_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"object_extension_closure":{"cardinality":"multi","id":"object_extension_closure","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"subject_family":{"searchable":"true","id":"subject_family","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},"relation_closure":{"cardinality":"multi","id":"relation_closure","type":"string","description":"SubPropertyOf reflexive closure for association_relation","display_name":"Inferred relationship","property":[]},"object_extension_json":{"cardinality":"multi","id":"object_extension_json","type":"string","description":"Extension class for the annotation (JSON).","display_name":"Annotation extension","property":[]},"subject_taxon_closure_label":{"searchable":"true","cardinality":"multi","id":"subject_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},"qualifier":{"cardinality":"multi","id":"qualifier","type":"string","description":"Association qualifier. TBD: NEGATION should probably be handled differently somehow","display_name":"Qualifier","property":[]},"object_extension":{"cardinality":"multi","id":"object_extension","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"evidence":{"cardinality":"multi","id":"evidence","type":"string","description":"Evidence type. In Monarch we may have a graph/chain. This is always the outer evidence OR a list of all evidence types used?","display_name":"Evidence type","property":[]},"object_label":{"searchable":"true","id":"object_label","type":"string","description":"Label for association_object.","display_name":"Object","property":[]},"object_closure":{"cardinality":"multi","id":"object_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Object (Inferred)","property":[]},"subject_synonym":{"cardinality":"multi","id":"subject_synonym","type":"string","description":"synonyms for the entity in the association.subject field.","display_name":"Synonym","property":[]},"object_class_secondary_closure":{"cardinality":"multi","id":"object_class_secondary_closure","type":"string","description":"Optional. This is similar to object_class_closure, but allows for the scenario whereby a different (more inclusive, or exclusive) closure is used. The exact OPs used will depend on the association type. This would ideally be communicating from loader conf through to the client somehow","display_name":"Inferred object","property":[]},"object_class_closure":{"cardinality":"multi","id":"object_class_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Inferred object","property":[]},"subject_category_label":{"id":"subject_category_label","type":"string","description":"Label for association_subject_category","display_name":"Subject category","property":[]},"relation_closure_label":{"cardinality":"multi","id":"relation_closure_label","type":"string","description":"labels for association_relation_closure","display_name":"Inferred relationship","property":[]},"evidence_graph":{"id":"evidence_graph","type":"string","description":"Evidence graph","display_name":"Evidence graph formatted as graphson","property":[]},"object_class_closure_label":{"searchable":"tru","cardinality":"multi","id":"object_class_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Involved in","property":[]},"object_taxon_label":{"searchable":"true","id":"object_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},"object_category_label":{"id":"object_category_label","type":"string","description":"Label for association_object_category","display_name":"Object type","property":[]},"subject_description":{"searchable":"true","id":"subject_description","type":"string","description":"A more descriptive label or full name for association_subject. For a gene this may be the full name (as opposed to symbol).","display_name":"Subject description","property":[]},"is_redundant_for":{"id":"is_redundant_for","type":"string","description":"Rational for redundancy of annotation.","display_name":"Redundant for","property":[]},"evidence_closure_label":{"cardinality":"multi","id":"evidence_closure_label","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence label closure","property":[]},"object_category":{"id":"object_category","type":"string","description":"Category of association.object. Examples: phenotype, function, process, location, tissue, gene. In GO this is called aspect","display_name":"Object type","property":[]}},"document_category":"generic_association","weight":"20","_strict":0,"id":"generic_association","_outfile":"/Users/cjm/repos/monarch-app/conf/golr-views/oban-config.yaml"}}')
}
