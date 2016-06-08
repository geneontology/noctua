var jQuery = require('jquery');
var bbop = require('bbop').bbop;
var bbopx = require('bbopx');
var amigo = require('amigo2');
var underscore = require('underscore');
var graph_api = require('bbop-graph-noctua');
var minerva_requests = require('minerva-requests');
// var solrautocomplete = require('bbop-widget-solr-autocomplete');
var angular = require('angular');
var widgetry = require('noctua-widgetry');
var selectize = require('selectize');

var annotationSubjectKey = 'http://purl.org/dc/elements/1.1/subject'; // 'source';
var annotationSubjectKeyShorthand = 'dc11:subject'; // 'source';
var USE_UI_GRID = false;
var USE_HP_RESTRICTION = false;


function createSolrAutocompleteForElement(element, options) {
  var jqElement = jQuery(element);
  jqElement.solrautocomplete(options);
}

var solrautocomplete = {
  createSolrAutocompleteForElement: createSolrAutocompleteForElement
};
window.Solrautocomplete = solrautocomplete;

jQuery.widget('widget.solrautocomplete', {
  options: {
    webserviceUrl: "http://localhost:8983/solr/select",
    onChange: console.log,
    required: false,
    optionDisplay: null,
    itemDisplay: null,
    valueField: null,
    searchField: null,
    queryData: null,
    golrManager: null,
    maxItems: 1
  },

  _create: function() {
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
    var widgetMaxItems = this.options.maxItems;
    var _currentValue = null;

    // Right label for user feedback
    var feedbackLabel = jQuery('<div class="feedback_label"></div>');
    this.element.before(feedbackLabel);

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
        if (widgetMaxItems == 1) {
          _clearCache(); // in order to request the server at each typing, only for single items
        }
      },
      onBlur: function() {
        _checkSanity(_currentValue);
      },
      maxItems: widgetMaxItems
    });

    var _checkSanity = function(value) {
      if (widgetRequired && (value == null || value == "")) {
        feedbackLabel.show();
        feedbackLabel.text('Cannot be empty!');
      } else {
        feedbackLabel.hide();
        feedbackLabel.text('');
      }
    }

    var _clearCache = function() {
      selectized[0].selectize.clearCache("option");
      selectized[0].selectize.clearOptions();
    };

    var _updateHits = function(h) {
      feedbackLabel.show();
      feedbackLabel.text(h + ' hits');
    };

  },

  _destroy: function() {
    selectized[0].selectize.destroy();
  },


  _setOptions: function(options) {
    this._super(options);
    this.refresh();
  }
});


//
// Angular controller
//

function NoctuaBasicController($q, $scope, $animate, $timeout, $interval, $location, $anchorScroll, toastr, $window, $rootScope) {
  var that = this;

  this.$timeout = $timeout;
  this.$interval = $interval;
  this.$scope = $scope;
  this.$q = $q;
  this.USE_UI_GRID = USE_UI_GRID;

  if (USE_UI_GRID) {
    this.gridOptions = {
      rowHeight: 38,
      enableCellSelection: true,
      enableCellEditOnFocus: true
    };

    this.diseases = [
                      {
                        node_id: 'MESH:C562989',
                        id: 'idMESH:C562989',
                        label: 'labelMESH:C562989'
                      },
                      {
                        node_id: 'OMIM:276800',
                        id: 'idOMIM:276800',
                        label: 'labelOMIM:276800'
                      },
                      {
                        node_id: 'HP:123456',
                        id: 'idHP:123456',
                        label: 'labelHP:123456'
                      }
                    ];

    this.gridOptions.columnDefs = [
      {
        name: 'disease.label',
        field: 'disease',
        displayName: 'Disease',
        xeditableCellTemplate: 'ui-grid/dropdownEditor',
        width: '40%',
        // cellFilter: 'mapGender',
        // editDropdownIdLabel: 'id',
        // editDropdownValueLabel: 'label',
        editDropdownOptionsArray: that.diseases,

        editableCellTemplate: 'uiSelect'
      },
      { name: 'phenotype.label', displayName: 'Phenotype' },
      { name: 'ageofonset.label', displayName: 'Age of Onset' }
    ];

    this.refreshOptions = function (search) {
      console.log('refreshOptions', search);

      var diseaseCol = that.gridOptions.columnDefs[0];
      diseaseCol.editDropdownOptionsArray = that.diseases;
      // diseaseCol.editDropdownOptionsArray = diseases.map(function(d) {return d.label; });
      this.gridRowSelectedDisease = that.diseases[0];
    };

    this.saveRow = function(rowEntity) {
      console.log('saveRow...this:', this, ' row:', rowEntity);
      // create a fake promise - normally you'd use the promise returned by $http or $resource
      var promise = this.$q.defer();
      this.gridApi.rowEdit.setSavePromise(rowEntity, promise.promise );

      that.$interval( function() {
        console.log('interval:', rowEntity);
        promise.resolve();
      }, 110, 1);
    };

    this.gridOptions.onRegisterApi = function(gridApi) {
      //set gridApi on scope
      that.gridApi = gridApi;
      that.$scope.gridApi = gridApi;
      gridApi.rowEdit.on.saveRow(null, function(rowEntity) {
        that.saveRow(rowEntity);
      });
      that.$timeout(function() {
        that.gridApi.core.handleWindowResize();
        that.refreshOptions();
      });
    };
  }

  this.model_id = model_id;
  this.export_owl_url = '/download/' + this.model_id + '/owl';
  this.edit_graph_url = '/editor/graph/' + this.model_id;

  this.toastr = toastr;
  this.$window = $window;
  this.$rootScope = $rootScope;

  var phenotype_ageofonset_relation = "RO:0002488";
  var has_phenotype_relation = "BFO:0000051";

  // Events registry.
  var manager = null;
  var user_token = null;
  var compute_shield_modal = null;
  var _shields_up = null;
  var _shields_down = null;
  var graph = new graph_api.graph();
  this.grid_model = [];
  this.editing_row = null;
  this.new_row = null;
  this.selected_disease = null;
  this.selected_phenotype = null;
  this.selected_ageofonset = null;
  this.selected_ev_ref_list = [];
  this.selected_description = null;

  this.response_model = null;

  this.editingTitle = false;
  this.newTitle = null;
  this.modelTitle = undefined;

  this.editingSubject = false;
  this.modelSubject = null;
  this.modelSubjectLabel = null;
  this.modelSubjectNodeId = null;

  this.newSubject = null;

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
  };

  this.init = function() {
    // Only roll if the env is correct.

    // Try to define token.
    if (global_barista_token) {
      user_token = global_barista_token;
      that.user_token = user_token;

      if( user_token ){
          widgetry.user_check(global_barista_location,
            user_token, 'user_name_info');
          that.edit_graph_url = widgetry.build_token_link('/editor/graph/' + that.model_id, user_token);
      }
    }

    // Next we need a manager to try and pull in the model.
    if (typeof(global_minerva_definition_name) === 'undefined' ||
      typeof(global_barista_location) === 'undefined') {
      alert('environment not ready');
    } else {
      _shields_up();
      manager = new bbopx.minerva.manager(global_barista_location,
        global_minerva_definition_name,
        user_token);
      initializeAutocomplete();
      initializeCallbacks();
      manager.get_model(model_id);
    }
  }

  // type is 'error' or 'success'
  this.displayToast = function(type, msg) {
    var toastrFuncMap = {
      success: that.toastr.success,
      error: that.toastr.error
    };
    var toastrFunc = toastrFuncMap[type];
    toastrFunc(msg, msg);
  };


  sanity_check = function() {
    if (that.selected_disease == "" || that.selected_disease == null) {
      that.displayToast('error', 'Disease cannot be empty.');
      return false;
    } else if (that.selected_phenotype == "" || that.selected_phenotype == null) {
      that.displayToast('error', 'Phenotype cannot be empty.');
      return false;
    } else {
      return true;
    }
  };

  this.store = function() {
    // this.setTitle(this.modelTitle);
    _shields_up();
    manager.store_model(model_id);
    _shields_down();
  };

  this.editTitle = function(optionalDefaultTitle) {
    that.newTitle = optionalDefaultTitle || that.modelTitle;
    that.editingTitle = true;
    $timeout(function () {
      angular.element('#modelTitle').focus();
    }, 10);
  };

  this.cancelEditTitle = function(newTitle) {
    that.editingTitle = false;
  };

  this.saveEditedTitle = function() {
    if (that.modelTitle !== that.newTitle) {
      _shields_up();
      var r = new minerva_requests.request_set(manager.user_token(), model_id)
      r.remove_annotation_from_model("title", that.modelTitle);
      r.add_annotation_to_model("title", that.newTitle);
      that.modelTitle = that.newTitle;
      r.store_model(model_id);

      manager.request_with(r, "edit_title");
      _shields_down();
    }
    that.editingTitle = false;
  };


  this.editSubject = function() {
    that.newSubject = that.modelSubject;
    that.editingSubject = true;

    var disease_selectize = jQuery('#select_subject_default')[0].selectize;
    disease_selectize.clearCache("option");
    disease_selectize.clearOptions();
    disease_selectize.addOption([{
      "id": that.newSubject,
      "annotation_class_label_searchable": that.modelSubjectLabel
    }]);

    disease_selectize.setValue(that.newSubject);

    $timeout(function () {
      angular.element('#modelSubject').focus();
    }, 10);
  };

  this.cancelEditSubject = function(newSubject) {
    that.editingSubject = false;
  };

  this.saveEditedSubject = function() {
    if (that.modelSubject !== that.newSubject) {
      _shields_up();

      var r = new minerva_requests.request_set(manager.user_token(), model_id);
      r.remove_annotation_from_model(annotationSubjectKey, that.modelSubject);
      r.add_annotation_to_model(annotationSubjectKey, that.newSubject);

      var nodes = graph.get_nodes();

      var existing_disease_id = getExistingIndividualId(that.modelSubject, nodes);
      var subject_tmp_id = r.add_individual(that.newSubject);

      that.modelSubject = that.newSubject;
      that.modelSubjectLabel = [that.newSubject, ' (Label NYI)'];
      that.modelSubjectNodeId = subject_tmp_id;
      that.editingSubject = true;
      manager.request_with(r, "edit_subject");
      _shields_down();
    }
    // that.editingSubject = false;

    // if (!that.modelTitle) {
    //   that.refresh_title();
    // }
  };


  // // TODO this should not be called on load
  // this.$watch('modelTitle', function(newValue, oldValue) {
  //   if (manager.user_token() && newValue != oldValue) {
  //     if (this.modelTitle != "" && this.modelTitle != null) {
  //       var r = new minerva_requests.request_set(manager.user_token(), model_id)
  //       r.remove_annotation_from_model("title", oldValue);
  //       r.add_annotation_to_model("title", newValue);

  //       manager.request_with(r, "edit_title");
  //     } else {
  //       this.displayToast("error", "Model title cannot be empty.");
  //     }
  //   }
  // });

  getExistingIndividualId = function(id, nodes) {
    var hit = null;
    for (var key in nodes) {
      var value = nodes[key];
      if (isType(id, value)) {
        hit = value;
        break;
      }
    }
    if (hit == null) {
      return null;
    } else {
      return hit._id;
    }
  }

  isType = function(type, node) {
    var types = node._types;
    if (types.length == 1) {
      return types[0].class_id() === type;
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
  };

  function extract_class_label_from_node(node) {
    var types = node._types;

    if (types.length === 1) {
      return types[0].class_label();
    }
    else {
      return "";
    }
  }

  function build_joined_label(id, label) {
    return id === label ? [label, label] : [id, label];
  }

  refresh_ui = function() {
    build_table();
    that.refresh_subject();
    that.refresh_title();
    that.$timeout(function () {
      that.initializeSubjectAutocomplete();
    }, 100);
    // if (that.user_token) {
    //   that.ensure_ev(that.selected_ev_ref_list);
    // }
  }

  this.refresh_subject = function() {
    var annotations = graph.get_annotations_by_key(annotationSubjectKeyShorthand);
    if (annotations.length === 0) {
      // no subject set yet
    }
    else {
      var subject = annotations[0].value(); // there should be only one
      that.modelSubject = subject;
      that.modelSubjectNodeId = subject;
      that.modelSubjectLabel = [subject, subject];
    }
  };

  this.refresh_title = function() {
    var annotations = graph.get_annotations_by_key("title");
    if (annotations.length == 0) {
      // no title set yet
      that.editTitle(that.modelSubjectLabel);
    } else {
      title = annotations[0].value(); // there should be only one
      that.modelTitle = title;
    }
  }

  this.isValidModel = function () {
    return  that.modelTitle && that.modelTitle.length > 0 &&
            that.grid_model.length > 0;
  };


  this.isValidAssociation = function () {
    return  that.selected_disease &&
            that.selected_phenotype;
            // that.selected_ageofonset &&
            // that.selected_ev_ref_list.length > 0 &&
            // that.selected_ev_ref_list[0].ev &&
            // that.selected_ev_ref_list[0].ev.length &&
            // that.selected_description;
  };

  this.create = function() {
    var disease_id = that.selected_disease;
    var phenotype_id = that.selected_phenotype;
    var ageofonset_id = that.selected_ageofonset;
    var evidence_reference = that.selected_ev_ref_list;
    var description = that.selected_description;

    _shields_up();
    if (sanity_check()) {
      var r = new minerva_requests.request_set(manager.user_token(), model_id);
      var nodes = graph.get_nodes();
      // fetching exising disease individual if it exists
      var existing_disease_id = getExistingIndividualId(disease_id, nodes);
      requestSetForCreation(r, disease_id, phenotype_id, ageofonset_id, evidence_reference, description, existing_disease_id);
      var result = manager.request_with(r, "create");

    } else {
      _shields_down();
    }
  }


  this.addRow = function() {
    var row = {
      "disease": null,
      "disease_node_id": null,
      "disease_id": null,
      "disease_label": null,
      "phenotype": null,
      "phenotype_node_id": null,
      "phenotype_id": null,
      "phenotype_label": null,
      "ageofonset": null,
      "ageofonset_node_id": null,
      "ageofonset_id": null,
      "ageofonset_label": null,
      "evidence": null,
      "evidence_metadata": [],
      "reference": null,
      "description": null
    };

    row.disease = this.modelSubject;
    row.disease_id = this.modelSubject;
    row.disease_node_id = this.modelSubjectNodeId;
    row.disease_label = this.modelSubjectLabel;

    that.grid_model.push(row);
    $timeout(function() {
      that.editRow(row, that.grid_model.length - 1, true);
    }, 10);
  };


  this.editRow = function(row, rowIndex, isNew) {
    that.editing_row = row;
    that.new_row = isNew ? row : null;
    that.selected_disease = row.disease_id;
    that.selected_phenotype = row.phenotype_id;
    that.selected_ageofonset = row.ageofonset_id;
    evidence_ids = underscore.map(row.evidence_metadata, function(ev) {
      return ev.id;
    });
    that.selected_evidence = evidence_ids;
    that.selected_reference = row.reference;
    that.selected_description = row.description;
    that.selected_ev_ref_list = row.evidence_metadata;

    // keep them as reference for the deletion
    that.selected_disease_node_id_previous = row.disease_node_id;
    that.selected_disease_id_previous = row.disease_id;
    that.selected_phenotype_node_id_previous = row.phenotype_node_id;
    that.selected_ageofonset_node_id_previous = row.ageofonset_node_id;

    that.initializeRowAutocomplete(rowIndex);

    var disease_selectize = jQuery('#select_disease_' + rowIndex)[0].selectize;
    disease_selectize.clearCache("option");
    disease_selectize.clearOptions();
    disease_selectize.addOption([{
      "id": row.disease_id,
      "annotation_class_label_searchable": row.disease_label
    }]);
    disease_selectize.setValue(row.disease_id);

    var phenotype_selectize = jQuery('#select_phenotype_' + rowIndex)[0].selectize;
    phenotype_selectize.clearCache("option");
    phenotype_selectize.clearOptions();
    phenotype_selectize.addOption([{
      "id": row.phenotype_id,
      "annotation_class_label_searchable": row.phenotype_label
    }]);
    phenotype_selectize.setValue(row.phenotype_id);

    var ageofonset_selectize = jQuery('#select_ageofonset_' + rowIndex)[0].selectize;
    ageofonset_selectize.clearCache("option");
    ageofonset_selectize.clearOptions();
    ageofonset_selectize.addOption([{
      "id": row.ageofonset_id,
      "annotation_class_label_searchable": row.ageofonset_label
    }]);
    ageofonset_selectize.setValue(row.ageofonset_id);

    that.ensure_ev(that.selected_ev_ref_list, rowIndex);
    var parentIndex = rowIndex;

    var evIndex = 0;
    underscore.each(that.selected_ev_ref_list, function(ev_ref) {
      $timeout(function() {
        var selector = '#' + ev_ref.htmlid + '_' + parentIndex + '_' + evIndex;
        var el = jQuery(selector);
        var selectize = el[0].selectize;
        if (selectize) {
        }
        else {
          Solrautocomplete.createSolrAutocompleteForElement(selector, that.evidence_autocomplete_options(function(value) {
            $timeout(function() {
              ev_ref.ev = value;
            }, 10);
          }));
        }

        var selectize = jQuery(selector)[0].selectize;
        selectize.clearCache("option");
        selectize.clearOptions();
        selectize.addOption([{
          "id": ev_ref.id,
          "annotation_class_label_searchable": ev_ref.label
        }]);
        selectize.setValue(ev_ref.id);
        ++evIndex;
      }, 10);
    });
    $timeout(function() {
      $location.hash('select_disease_' + rowIndex);
      $anchorScroll();
    }, 50);
  };


  this.cancelEditRow = function(rowIndex) {
    that.cleanupRowAutocomplete(rowIndex);

    if (that.new_row === underscore.last(that.grid_model)) {
      that.grid_model.pop();
    }

    that.editing_row = null;
  };

  this.saveEditedRow = function() {
    that.editing_row = null;

    _shields_up();

    var existing_disease = null;
    if (that.selected_disease_id_previous == that.selected_disease) {
      var edges_from_disease = graph.get_edges_by_subject(that.selected_disease_node_id_previous);
      if (edges_from_disease.length > 1) { // disease is not scheduled for deletion
        existing_disease = that.selected_disease_node_id_previous;
      }
    }

    var ev_ref_list = that.selected_ev_ref_list;
    if (ev_ref_list.length === 1 &&
        ev_ref_list[0].ev === '') {
      ev_ref_list = [];
    }

    var r = new minerva_requests.request_set(manager.user_token(), model_id);
    requestSetForDeletion(r, that.selected_disease_node_id_previous, that.selected_phenotype_node_id_previous, that.selected_ageofonset_node_id_previous);
    requestSetForCreation(r, that.selected_disease, that.selected_phenotype, that.selected_ageofonset, ev_ref_list, that.selected_description, existing_disease);
    r.store_model(model_id);
    manager.request_with(r, "edit_row");
  };

  this.duplicateRow = function(sourceRow, sourceRowIndex) {
    var row = {
      "disease": sourceRow.disease,
      "disease_node_id": null,
      "disease_id": sourceRow.disease_id,
      "disease_label": sourceRow.disease_label,
      "phenotype": sourceRow.phenotype,
      "phenotype_node_id": null,
      "phenotype_id": sourceRow.phenotype_id,
      "phenotype_label": sourceRow.phenotype_label,
      "ageofonset": sourceRow.ageofonset,
      "ageofonset_node_id": null,
      "ageofonset_id": sourceRow.ageofonset_id,
      "ageofonset_label": sourceRow.ageofonset_label,
      "evidence": null,
      "evidence_metadata": [],
      "reference": null,
      "description": null
    };
    that.grid_model.push(row);
    $timeout(function() {
      that.editRow(row, that.grid_model.length - 1, true);
    }, 10);
  };

  this.deleteRow = function(disease_node_id, phenotype_node_id, ageofonset_node_id) {
    if (that.$window.confirm('Are you sure you want to delete this entry?')) {
      _shields_up();
      var r = new minerva_requests.request_set(manager.user_token(), model_id);
      requestSetForDeletion(r, disease_node_id, phenotype_node_id, ageofonset_node_id);
      manager.request_with(r, "remove_row");
    }
  };

  requestSetForDeletion = function(request_set, disease_node_id, phenotype_node_id, ageofonset_node_id) {
    var edges_from_disease = graph.get_edges_by_subject(disease_node_id);

    if (edges_from_disease.length == 1) { // delete only if there will be no edges left
      request_set.remove_individual(disease_node_id);
    }
    request_set.remove_individual(phenotype_node_id);
    if (ageofonset_node_id != "") {
      request_set.remove_individual(ageofonset_node_id);
    }
  };

  requestSetForCreation = function(request_set, disease_id, phenotype_id, ageofonset_id, evidence_reference, description, existing_disease_id) {
    var phenotype_tmp_id = request_set.add_individual(phenotype_id);
    if (existing_disease_id == null) {
      request_set.add_fact([request_set.add_individual(disease_id),
        phenotype_tmp_id,
        has_phenotype_relation
      ]);
    } else {
      request_set.add_fact([existing_disease_id,
        phenotype_tmp_id,
        has_phenotype_relation
      ]);
    }

    // Attach the metadata to the phenotype individual
    if (evidence_reference != "" && evidence_reference != null && evidence_reference.length != 0) {
      underscore.map(evidence_reference, function(ev_ref) {
        var evidence_tmp_id = request_set.add_individual(ev_ref.ev);
        request_set.add_annotation_to_individual("evidence", evidence_tmp_id, null, phenotype_tmp_id);
        var ref_list = ev_ref.ref_list;
        if (ref_list != "" && ref_list != null && ref_list.length != 0) {
          underscore.map(ref_list, function(ref) {
            // TODO create a proper individual when it'll supported by Minerva and Noctua
            //var ref_tmp_id = request_set.add_individual(ref.ref);
            //request_set.add_annotation_to_individual("source", ref_tmp_id, evidence_tmp_id);
            request_set.add_annotation_to_individual("source", ref.ref, null, evidence_tmp_id);
          });
        }
      });
    }

    // if (reference != "" && reference != null) {
    //   request_set.add_annotation_to_individual("source", reference, phenotype_tmp_id, model_id);
    // }

    if (description != "" && description != null) {
      request_set.add_annotation_to_individual("comment", description, null, phenotype_tmp_id);
    }

    if (ageofonset_id != "" && ageofonset_id != null) {
      request_set.add_fact([phenotype_tmp_id, request_set.add_individual(ageofonset_id), phenotype_ageofonset_relation]);
    }
  }

  this.convertECOId = function(colonId) {
    if (colonId) {
      colonId = colonId.replace(':', '_');
    }
    return colonId;
  };

  this.add_ev = function(selected_ev_ref_list, rowIndex) {
    var newItemNo = selected_ev_ref_list.length + 1;
    var new_id = 'evref' + newItemNo;
    var ev_ref = {
      'htmlid': new_id
    };
    selected_ev_ref_list.push(ev_ref);
    that.add_ref(ev_ref);
    $timeout(function() {
      activate_evidence_widget(ev_ref, new_id, rowIndex, selected_ev_ref_list.length - 1);
    }, 10);
  };

  this.ensure_ev = function(selected_ev_ref_list, rowIndex) {
    if (selected_ev_ref_list.length === 0) {
      that.add_ev(selected_ev_ref_list, rowIndex);
    }
    else {
      underscore.each(that.selected_ev_ref_list, function(ev_ref) {
        if (!ev_ref.ref_list || ev_ref.ref_list.length === 0) {
          that.add_ref(ev_ref);
        }
      });
    }
  };

  this.lookup_ev_by_id = function(ev_id) {
    var result = null;
    underscore.each(that.selected_ev_ref_list, function(ev_ref) {
      if (ev_ref.ev === ev_id) {
        result = ev_ref;
      }
    });
    return result;
  };

  var activate_evidence_widget = function(ev_ref, id, rowIndex, refIndex) {
    var selector = '#' + ev_ref.htmlid + '_' + rowIndex + '_' + refIndex;
    var selectize = jQuery(selector)[0].selectize;
    if (selectize) {

    }
    else {
      Solrautocomplete.createSolrAutocompleteForElement(selector, that.evidence_autocomplete_options(function(value) {
        ev_ref.ev = value;
        if (value && value.length > 0) {
          var ev = that.lookup_ev_by_id(ev_ref.ev);
          // console.log('ADD_REF:', ev_ref, ev);
          // that.add_ref(ev);
        }
      }));
      selectize = jQuery(selector)[0].selectize;
    }
    selectize.clearOptions();
  }

  this.ensure_reflist = function(ev_ref) {
    if (ev_ref.ref_list == null || ev_ref.ref_list == undefined) {
      ev_ref.ref_list = [];
    }
  };

  this.add_ref = function(ev_ref) {
    this.ensure_reflist(ev_ref);
    var newItemNo = ev_ref.ref_list.length + 1;
    var new_id = ev_ref.htmlid + 'ref' + newItemNo;
    ev_ref.ref_list.push({
      'htmlid': new_id
    });
  };

  build_table = function() {
    if (that.USE_UI_GRID) {
      that.gridOptions.data = [];
    }

    var firstModelSubject = null;
    var firstModelSubjectLabel = '';

    that.grid_model = [];
    var edges = graph.all_edges();
    var has_phenotype_edges = underscore.filter(edges, function(edge) {
      return edge._predicate_id === has_phenotype_relation;
    });
    var phenotype_ageofonset_edges = underscore.filter(edges, function(edge) {
      return edge._predicate_id === phenotype_ageofonset_relation;
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
        age_of_onset_display = build_joined_label(age_of_onset_id, age_of_onset_label);
      }

      var disease_node = graph.get_node(current_edge.source());

      var phenotype_node = graph.get_node(current_edge.target());
      var annotations = phenotype_node._annotations;

      var evidence_annotations = [];
      var description = "";
      for (var i in annotations) {
        var annotation = annotations[i];
        var key = annotation._properties.key;
        var value = annotation._properties.value;
        if (key == "evidence") {
          evidence_annotations.push(value);
        } else if (key === "comment") {
          description = value;
        }
      }

      var reference = [];
      var evidences = underscore.map(evidence_annotations, function(ev) {
        var evidence_node = graph.get_node(ev);
        return build_joined_label(extract_class_id_from_node(evidence_node), extract_class_label_from_node(evidence_node));
      });
      var counter = 0;
      var evidence_metadata = underscore.map(evidence_annotations, function(ev) {
        counter += 1;
        var evidence_node = graph.get_node(ev);
        var evidence_node_annotations = evidence_node._annotations;
        var current_evidence_refs = [];

        // TODO bad reference display string at the moment
        for (var i in evidence_node_annotations) {
          var annotation = evidence_node_annotations[i];
          var key = annotation._properties.key;
          var value = annotation._properties.value;
          if (key == "source") {
            reference.push(value);
            current_evidence_refs.push({
              "ref": value,
              "htmlid": "ref" + (i + 1)
            });
          }
        }

        return {
          node_id: evidence_node._id,
          id: extract_class_id_from_node(evidence_node),
          label: extract_class_label_from_node(evidence_node),
          ref_list: current_evidence_refs,
          htmlid: "ev" + counter
        };
      });
      if (evidences.length === 0) {
        evidences = "";
      }

      var entry = {
        "disease_node_id": disease_node.id(),
        "disease_id": extract_class_id_from_node(disease_node),
        "disease_label": extract_class_label_from_node(disease_node),
        "phenotype_node_id": phenotype_node.id(),
        "phenotype_id": extract_class_id_from_node(phenotype_node),
        "phenotype_label": extract_class_label_from_node(phenotype_node),
        "ageofonset_node_id": age_of_onset_node_id,
        "ageofonset_id": age_of_onset_id,
        "ageofonset_label": age_of_onset_label,
        "evidence": evidences,
        "evidence_metadata": evidence_metadata,
        "reference": reference.join(),
        "description": description
      };

      entry.index = entry.disease_id + '/' + entry.phenotype_id + '/' + age_of_onset_id;
      entry.disease = build_joined_label(entry.disease_id, entry.disease_label);
      entry.phenotype = build_joined_label(entry.phenotype_id, entry.phenotype_label);
      entry.ageofonset = build_joined_label(entry.ageofonset_id, entry.ageofonset_label);

      that.grid_model.push(entry);

      if (!firstModelSubject) {
        that.modelSubject = entry.disease_id;
        that.modelSubjectLabel = build_joined_label(entry.disease_id, entry.disease_label);
      }

      if (that.USE_UI_GRID) {
        var gridEntry = {
          disease: {
            node_id: entry.disease_node_id,
            id: entry.disease_id,
            label: entry.disease_label
          },

          phenotype: {
            node_id: entry.phenotype_node_id,
            id: entry.phenotype_id,
            label: entry.phenotype_label
          },

          ageofonset: {
            node_id: entry.ageofonset_node_id,
            id: entry.ageofonset_id,
            label: entry.ageofonset_label
          }
        };
        that.gridOptions.data.push(gridEntry);
      }
    }

    if (firstModelSubject) {
      that.modelSubject = firstModelSubject;
      that.modelSubjectLabel = firstModelSubjectLabel;
    }
  }

  initializeCallbacks = function() {
    manager.register('manager_error', 'manager_errorx', function(resp, man){
      console.log("manager_error");
      console.log(resp);
      console.log(man);
      _shields_down();
      that.displayToast("error", resp._message);
    }, 10);

    manager.register('error', 'errorargh', function(resp, man) {
      console.log("error");
      console.log(resp);
      _shields_down();
      that.displayToast("error", resp._message);
    }, 10);


    manager.register('rebuild', 'foorebuild', function(resp, man) {
      // console.log("manager_rebuild");
      // console.log(resp.data());
      // console.log(man);

      that.response_model = JSON.stringify(resp);

      var tmp_graph = new graph_api.graph();
      tmp_graph.load_data_basic(resp.data());
      graph = tmp_graph;

      that.$rootScope.$apply(refresh_ui);

      _shields_down();
      // that.displayToast("success", resp._message);
    }, 10);

    manager.register('merge', 'merdge', function(resp, man) {
      // console.log("manager_merge");
      var data = resp.data();
      // console.log(data);

      that.response_model = JSON.stringify(resp);
      var tmp_graph = new graph_api.graph();
      tmp_graph.load_data_basic(resp.data());
      graph.merge_special(tmp_graph);

      if (that.editingSubject) {
        var individuals = data.individuals;
        var subjectId = individuals[0].type[0].id;
        var subjectLabel = individuals[0].type[0].label;

        // console.log('subjectId:', subjectId);
        // console.log('subjectLabel:', subjectLabel);
        // console.log('that.modelTitle:', that.modelTitle);
        // console.log('that.newTitle:', that.newTitle);
        // console.log('that.editingSubject:', that.editingSubject);
        that.modelSubjectLabel = [subjectId, subjectLabel];
        that.editingSubject = false;
        that.newTitle = subjectId + ' - ' + subjectLabel;
        that.modelTitle = null;
        that.saveEditedTitle();
      }
      else {
        that.selected_disease = null;
        that.selected_phenotype = null;
        that.selected_ageofonset = null;

        that.selected_ev_ref_list = [];
        that.selected_description = null;

        that.$rootScope.$apply(refresh_ui);

        _shields_down();
        that.displayToast("success", resp._message);
      }
    }, 10);
  }

  initializeAutocomplete = function() {
    var gconf = new bbop.golr.conf(golr_json);
    golr_loc = 'https://solr.monarchinitiative.org/solr/ontology/';

    var golr_manager_for_disease = new bbop.golr.manager.jquery(golr_loc, gconf);
    golr_manager_for_disease.set_results_count(50);

    // dirty trick to make jQuery avaiable in the golrmanager's scope.
    golr_manager_for_disease.JQ = jQuery;
    that.disease_autocomplete_options = function(onChangeFunc) {
      return {
        onChange: onChangeFunc,
        required: true,
        optionDisplay: function(item, escape) {
          return '<div>' +
            item.id + ' (' + item.annotation_class_label_searchable + ')' +
            '</div>';
        },
        itemDisplay: function(item, escape) {
          return '<div>' +
            item.id + ' (' + item.annotation_class_label_searchable + ')' +
            '</div>';
        },
        valueField: 'id',
        searchField: ['id', 'annotation_class_label_searchable'],
        queryData: function(query) {
          var idRestriction = '';
          if (USE_HP_RESTRICTION) {
            idRestriction = ' AND id:OMIM\\:*';
          }
          //return 'isa_partof_closure_label_searchable:disease AND id:*' + query.replace(':', '\\:').toUpperCase() + '*';
          // return 'isa_partof_closure_label_searchable:disease AND annotation_class_label_searchable:*' + query + '*';
          return 'isa_partof_closure_label_searchable:disease' + idRestriction + ' AND annotation_class_label_searchable:*' + query + '*';
        },
        golrManager: golr_manager_for_disease
      }
    };

    var golr_manager_for_phenotype = new bbop.golr.manager.jquery(golr_loc, gconf);
    golr_manager_for_phenotype.set_results_count(50);
    // dirty trick to make jQuery avaiable in the golrmanager's scope.
    golr_manager_for_phenotype.JQ = jQuery;
    that.phenotype_autocomplete_options = function(onChangeFunc) {
      return {
        onChange: onChangeFunc,
        required: true,
        optionDisplay: function(item, escape) {
          return '<div>' +
            item.id + ' (' + item.annotation_class_label_searchable + ')' +
            '</div>';
        },
        itemDisplay: function(item, escape) {
          return '<div>' +
            item.id + ' (' + item.annotation_class_label_searchable + ')' +
            '</div>';
        },
        valueField: 'id',
        searchField: ['id', 'annotation_class_label_searchable'],
        queryData: function(query) {
          var idRestriction = '';
          if (USE_HP_RESTRICTION) {
            idRestriction = ' AND id:HP\\:*';
          }

          //return 'isa_partof_closure_label_searchable:phenotype AND id:*' + query.replace(':', '\\:').toUpperCase() + '*';
          // return 'isa_partof_closure_label_searchable:phenotype AND annotation_class_label_searchable:*' + query + '*';
          return 'isa_partof_closure_label_searchable:phenotype' + idRestriction + ' AND annotation_class_label_searchable:*' + query + '*';
        },
        golrManager: golr_manager_for_phenotype
      }
    };


    var golr_manager_for_ageofonset = new bbop.golr.manager.jquery(golr_loc, gconf);
    golr_manager_for_ageofonset.set_results_count(50);
    // dirty trick to make jQuery avaiable in the golrmanager's scope.
    golr_manager_for_ageofonset.JQ = jQuery;
    that.ageofonset_autocomplete_options = function(onChangeFunc) {
      return {
        onChange: onChangeFunc,
        optionDisplay: function(item, escape) {
          return '<div>' +
            item.id + ' (' + item.annotation_class_label_searchable + ')' +
            '</div>';
        },
        itemDisplay: function(item, escape) {
          return '<div>' +
            item.id + ' (' + item.annotation_class_label_searchable + ')' +
            '</div>';
        },
        valueField: 'id',
        searchField: ['id', 'annotation_class_label_searchable'],
        queryData: function(query) {
          //return 'isa_partof_closure_label_searchable:Onset AND id:*' + query.replace(':', '\\:').toUpperCase() + '*';
          return 'isa_partof_closure_label_searchable:Onset AND annotation_class_label_searchable:*' + query + '*';
        },
        golrManager: golr_manager_for_ageofonset
      }
    };


    var golr_manager_for_evidence = new bbop.golr.manager.jquery(golr_loc, gconf);
    golr_manager_for_evidence.set_results_count(50);
    that.evidence_autocomplete_options = function(onChangeFunc) {
      return {
        onChange: onChangeFunc,
        optionDisplay: function(item, escape) {
          return '<div>' +
            item.id + ' (' + item.annotation_class_label_searchable + ')' +
            '</div>';
        },
        itemDisplay: function(item, escape) {
          return '<div>' +
            item.id + ' (' + item.annotation_class_label_searchable + ')' +
            '</div>';
        },
        valueField: 'id',
        searchField: ['id', 'annotation_class_label_searchable'],
        queryData: function(query) {
          //return 'isa_partof_closure_label_searchable:evidence AND id:*' + query.replace(':', '\\:').toUpperCase() + '*';
            return 'isa_partof_closure_label_searchable:evidence AND annotation_class_label_searchable:*' + query + '*';
        },
        golrManager: golr_manager_for_evidence
      };
    };
  }

  this.initializeSubjectAutocomplete = function() {
    var ssd = jQuery('#select_subject_default');
    var disease_selectize = ssd[0].selectize;

    if (!disease_selectize) {
      Solrautocomplete.createSolrAutocompleteForElement(
        '#select_subject_default', that.disease_autocomplete_options(function(value) {
        $timeout(function() {
          that.newSubject = value;
        }, 10);
      }));
      disease_selectize = ssd[0].selectize;
    }

    $timeout(function() {
      disease_selectize.focus();
    }, 300);
  }

  this.initializeRowAutocomplete = function(rowIndex) {
    var disease_selectize = jQuery('#select_disease_' + rowIndex)[0].selectize;

    if (disease_selectize) {
    }
    else {
      Solrautocomplete.createSolrAutocompleteForElement(
        '#select_disease_' + rowIndex, that.disease_autocomplete_options(function(value) {
        $timeout(function() {
          that.selected_disease = value;
        }, 10);
      }));

      Solrautocomplete.createSolrAutocompleteForElement('#select_phenotype_' + rowIndex, that.phenotype_autocomplete_options(function(value) {
        $timeout(function() {
          that.selected_phenotype = value;
        }, 10);
      }));


      Solrautocomplete.createSolrAutocompleteForElement('#select_ageofonset_' + rowIndex, that.ageofonset_autocomplete_options(function(value) {
        $timeout(function() {
          that.selected_ageofonset = value;
        }, 10);
      }));
    }
  }


  this.cleanupRowAutocomplete = function(rowIndex) {
    var disease_selectize = jQuery('#select_disease_' + rowIndex)[0].selectize;
    var phenotype_selectize = jQuery('#select_phenotype_' + rowIndex)[0].selectize;
    var ageofonset_selectize = jQuery('#select_ageofonset_' + rowIndex)[0].selectize;
    if (false && disease_selectize) {
      disease_selectize.destroy();
      phenotype_selectize.destroy();
      ageofonset_selectize.destroy();

      var parentIndex = rowIndex;
      var evIndex = 0;
      underscore.each(that.selected_ev_ref_list, function(ev_ref) {
        var selector = '#' + ev_ref.htmlid + '_' + parentIndex + '_' + evIndex;
        var selectize = jQuery(selector)[0].selectize;
        selectize.destroy();
        ++evIndex;
      });
    }
  };

  // TODO take that conf from the Monarch App
  var golr_json = JSON.parse('{"generic_association":{"result_weights":"subject^7.0 subject_category^6.2 subject_taxon^6.5 relation^6.0  object^5.0 evidence^4.0","filter_weights":"subject_category^8.0 subject_taxon^7.5 subject_closure_label^7.0 relation_closure_label^6.5 evidence_closure_label^6.0 object_category^5.0 object_closure_label^4.5","_infile":"/Users/cjm/repos/monarch-app/conf/golr-views/oban-config.yaml","display_name":"Annotations","description":"Associations following OBAN model","schema_generating":"true","boost_weights":"subject^2.0 subject_label^1.0 object^2.0 object_label^1.0","fields":[{"id":"id","type":"uuid","description":"A unique identifier (CURIE) for the association. Optional.","display_name":"Association id","property":[]},{"id":"subject","type":"string","description":"The CURIE for oban:association_has_subject. May be disease, variant, gene, person, ....","display_name":"Subject","property":[]},{"searchable":"true","id":"subject_label","type":"string","description":"Label for association_subject. This will always be rdfs:label. Conventions may vary as to what goes in the label. For genes will be symbol, but we may choose to uniquify by prefixing with species","display_name":"Subject","property":[]},{"cardinality":"multi","id":"subject_closure","type":"string","description":"Reflexive closure of association_has_subject. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Subject (Inferred)","property":[]},{"searchable":"true","cardinality":"multi","id":"subject_closure_label","type":"string","description":"Labels for subject_closure.","display_name":"Subject (Inferred)","property":[]},{"id":"subject_category","type":"string","description":"Category of association.subject. Examples: gene, protein, disease, variant","display_name":"Subject category","property":[]},{"id":"subject_category_label","type":"string","description":"Label for association_subject_category","display_name":"Subject category","property":[]},{"searchable":"true","id":"subject_description","type":"string","description":"A more descriptive label or full name for association_subject. For a gene this may be the full name (as opposed to symbol).","display_name":"Subject description","property":[]},{"cardinality":"multi","id":"subject_synonym","type":"string","description":"synonyms for the entity in the association.subject field.","display_name":"Synonym","property":[]},{"id":"subject_taxon","type":"string","description":"Taxonomic class of the subject. This is typically a CURIE of the form NCBITaxon:nnnn.","display_name":"Taxon","property":[]},{"searchable":"true","id":"subject_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},{"cardinality":"multi","id":"subject_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},{"searchable":"true","cardinality":"multi","id":"subject_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},{"searchable":"true","id":"subject_family","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},{"searchable":"true","id":"subject_family_label","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},{"id":"relation","type":"string","description":"A relationship type that connects the subject with object. TODO: check for correspondence in OBAN","display_name":"Relationship","property":[]},{"id":"relation_label","type":"string","description":"Label for association_relation","display_name":"Relationship","property":[]},{"cardinality":"multi","id":"relation_closure","type":"string","description":"SubPropertyOf reflexive closure for association_relation","display_name":"Inferred relationship","property":[]},{"cardinality":"multi","id":"relation_closure_label","type":"string","description":"labels for association_relation_closure","display_name":"Inferred relationship","property":[]},{"cardinality":"multi","id":"qualifier","type":"string","description":"Association qualifier. TBD: NEGATION should probably be handled differently somehow","display_name":"Qualifier","property":[]},{"id":"object","type":"string","description":"The CURIE for oban:association_has_object. This is often, but not always an ontology class. E.g. for a gene-gene interaction it is an (arbitrary) member of the pair.","display_name":"Object","property":[]},{"searchable":"true","id":"object_label","type":"string","description":"Label for association_object.","display_name":"Object","property":[]},{"cardinality":"multi","id":"object_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Object (Inferred)","property":[]},{"searchable":"true","cardinality":"multi","id":"object_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Object (Inferred)","property":[]},{"id":"object_category","type":"string","description":"Category of association.object. Examples: phenotype, function, process, location, tissue, gene. In GO this is called aspect","display_name":"Object type","property":[]},{"id":"object_category_label","type":"string","description":"Label for association_object_category","display_name":"Object type","property":[]},{"id":"object_taxon","type":"string","description":"Taxonomic class of the object. This is typically a CURIE of the form NCBITaxon:nnnn. This field may be unfilled when used with certain categories","display_name":"Taxon","property":[]},{"searchable":"true","id":"object_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},{"cardinality":"multi","id":"object_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},{"searchable":"true","cardinality":"multi","id":"object_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},{"id":"object_isoform","type":"string","description":"Assoc object alternate form. E.g. for a canonical protein may be isoforms. Can we generalize this? May be deleted","display_name":"Isoform","property":[]},{"cardinality":"multi","id":"object_class_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Inferred object","property":[]},{"searchable":"tru","cardinality":"multi","id":"object_class_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Involved in","property":[]},{"cardinality":"multi","id":"object_class_secondary_closure","type":"string","description":"Optional. This is similar to object_class_closure, but allows for the scenario whereby a different (more inclusive, or exclusive) closure is used. The exact OPs used will depend on the association type. This would ideally be communicating from loader conf through to the client somehow","display_name":"Inferred object","property":[]},{"searchable":"true","cardinality":"multi","id":"object_class_secondary_closure_label","type":"string","description":"Labels for object_class_secondary_closure.","display_name":"Involved in","property":[]},{"cardinality":"multi","id":"object_extension","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"searchable":"true","cardinality":"multi","id":"object_extension_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"cardinality":"multi","id":"object_extension_closure","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"searchable":"true","cardinality":"multi","id":"object_extension_closure_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},{"cardinality":"multi","id":"object_extension_json","type":"string","description":"Extension class for the annotation (JSON).","display_name":"Annotation extension","property":[]},{"id":"source","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Source","property":[]},{"id":"date","type":"string","description":"Date of assignment. The association may be derived from multiple source, but this should be the outer source, if applicable.","display_name":"Date","property":[]},{"id":"assigned_by","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Assigned by","property":[]},{"id":"is_redundant_for","type":"string","description":"Rational for redundancy of annotation.","display_name":"Redundant for","property":[]},{"id":"evidence_graph","type":"string","description":"Evidence graph","display_name":"Evidence graph formatted as graphson","property":[]},{"cardinality":"multi","id":"evidence","type":"string","description":"Evidence type. In Monarch we may have a graph/chain. This is always the outer evidence OR a list of all evidence types used?","display_name":"Evidence type","property":[]},{"cardinality":"multi","id":"evidence_label","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence label","property":[]},{"cardinality":"multi","id":"evidence_closure","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence type","property":[]},{"cardinality":"multi","id":"evidence_closure_label","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence label closure","property":[]},{"cardinality":"multi","id":"evidence_object","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence from","property":[]},{"cardinality":"multi","id":"citation","type":"string","description":"citation.","display_name":"Reference","property":[]}],"fields_hash":{"object_taxon_closure":{"cardinality":"multi","id":"object_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},"object_class_secondary_closure_label":{"searchable":"true","cardinality":"multi","id":"object_class_secondary_closure_label","type":"string","description":"Labels for object_class_secondary_closure.","display_name":"Involved in","property":[]},"date":{"id":"date","type":"string","description":"Date of assignment. The association may be derived from multiple source, but this should be the outer source, if applicable.","display_name":"Date","property":[]},"subject_family_label":{"searchable":"true","id":"subject_family_label","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},"object_isoform":{"id":"object_isoform","type":"string","description":"Assoc object alternate form. E.g. for a canonical protein may be isoforms. Can we generalize this? May be deleted","display_name":"Isoform","property":[]},"object_taxon":{"id":"object_taxon","type":"string","description":"Taxonomic class of the object. This is typically a CURIE of the form NCBITaxon:nnnn. This field may be unfilled when used with certain categories","display_name":"Taxon","property":[]},"relation_label":{"id":"relation_label","type":"string","description":"Label for association_relation","display_name":"Relationship","property":[]},"object_taxon_closure_label":{"searchable":"true","cardinality":"multi","id":"object_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},"subject_closure":{"cardinality":"multi","id":"subject_closure","type":"string","description":"Reflexive closure of association_has_subject. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Subject (Inferred)","property":[]},"subject_taxon_label":{"searchable":"true","id":"subject_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},"id":{"id":"id","type":"uuid","description":"A unique identifier (CURIE) for the association. Optional.","display_name":"Association id","property":[]},"subject_closure_label":{"searchable":"true","cardinality":"multi","id":"subject_closure_label","type":"string","description":"Labels for subject_closure.","display_name":"Subject (Inferred)","property":[]},"subject_taxon_closure":{"cardinality":"multi","id":"subject_taxon_closure","type":"string","description":"Reflexive closure of taxon. ALWAYS up SubClassOf.","display_name":"Taxon","property":[]},"citation":{"cardinality":"multi","id":"citation","type":"string","description":"citation.","display_name":"Reference","property":[]},"subject":{"id":"subject","type":"string","description":"The CURIE for oban:association_has_subject. May be disease, variant, gene, person, ....","display_name":"Subject","property":[]},"subject_label":{"searchable":"true","id":"subject_label","type":"string","description":"Label for association_subject. This will always be rdfs:label. Conventions may vary as to what goes in the label. For genes will be symbol, but we may choose to uniquify by prefixing with species","display_name":"Subject","property":[]},"subject_category":{"id":"subject_category","type":"string","description":"Category of association.subject. Examples: gene, protein, disease, variant","display_name":"Subject category","property":[]},"evidence_closure":{"cardinality":"multi","id":"evidence_closure","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence type","property":[]},"subject_taxon":{"id":"subject_taxon","type":"string","description":"Taxonomic class of the subject. This is typically a CURIE of the form NCBITaxon:nnnn.","display_name":"Taxon","property":[]},"relation":{"id":"relation","type":"string","description":"A relationship type that connects the subject with object. TODO: check for correspondence in OBAN","display_name":"Relationship","property":[]},"evidence_object":{"cardinality":"multi","id":"evidence_object","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence from","property":[]},"assigned_by":{"id":"assigned_by","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Assigned by","property":[]},"object_closure_label":{"searchable":"true","cardinality":"multi","id":"object_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Object (Inferred)","property":[]},"evidence_label":{"cardinality":"multi","id":"evidence_label","type":"string","description":"Closure for evidence_type. Always SubClassof","display_name":"Evidence label","property":[]},"source":{"id":"source","type":"string","description":"TBD: ALIGN GO AND DC TERMINOLOGY. Source of association. The association may be derived from multiple source, but this should be the outer source, if applicable","display_name":"Source","property":[]},"object_extension_closure_label":{"searchable":"true","cardinality":"multi","id":"object_extension_closure_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"object":{"id":"object","type":"string","description":"The CURIE for oban:association_has_object. This is often, but not always an ontology class. E.g. for a gene-gene interaction it is an (arbitrary) member of the pair.","display_name":"Object","property":[]},"object_extension_label":{"searchable":"true","cardinality":"multi","id":"object_extension_label","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"object_extension_closure":{"cardinality":"multi","id":"object_extension_closure","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"subject_family":{"searchable":"true","id":"subject_family","type":"string","description":"PANTHER families that are associated with this entity.","display_name":"PANTHER family","property":[]},"relation_closure":{"cardinality":"multi","id":"relation_closure","type":"string","description":"SubPropertyOf reflexive closure for association_relation","display_name":"Inferred relationship","property":[]},"object_extension_json":{"cardinality":"multi","id":"object_extension_json","type":"string","description":"Extension class for the annotation (JSON).","display_name":"Annotation extension","property":[]},"subject_taxon_closure_label":{"searchable":"true","cardinality":"multi","id":"subject_taxon_closure_label","type":"string","description":"Labels for taxon_closure.","display_name":"Taxon","property":[]},"qualifier":{"cardinality":"multi","id":"qualifier","type":"string","description":"Association qualifier. TBD: NEGATION should probably be handled differently somehow","display_name":"Qualifier","property":[]},"object_extension":{"cardinality":"multi","id":"object_extension","type":"string","description":"Extension class for the annotation.","display_name":"Annotation extension","property":[]},"evidence":{"cardinality":"multi","id":"evidence","type":"string","description":"Evidence type. In Monarch we may have a graph/chain. This is always the outer evidence OR a list of all evidence types used?","display_name":"Evidence type","property":[]},"object_label":{"searchable":"true","id":"object_label","type":"string","description":"Label for association_object.","display_name":"Object","property":[]},"object_closure":{"cardinality":"multi","id":"object_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Object (Inferred)","property":[]},"subject_synonym":{"cardinality":"multi","id":"subject_synonym","type":"string","description":"synonyms for the entity in the association.subject field.","display_name":"Synonym","property":[]},"object_class_secondary_closure":{"cardinality":"multi","id":"object_class_secondary_closure","type":"string","description":"Optional. This is similar to object_class_closure, but allows for the scenario whereby a different (more inclusive, or exclusive) closure is used. The exact OPs used will depend on the association type. This would ideally be communicating from loader conf through to the client somehow","display_name":"Inferred object","property":[]},"object_class_closure":{"cardinality":"multi","id":"object_class_closure","type":"string","description":"Reflexive closure of association_has_object. A list of CURIEs. If an individual, first traverse rdf:tpye. The default closure is subclass, but other may optionally be added depending on what type of association this is and what the class is. E.g. for expression associations, the object is an anatomy class, and the closure will include part_of","display_name":"Inferred object","property":[]},"subject_category_label":{"id":"subject_category_label","type":"string","description":"Label for association_subject_category","display_name":"Subject category","property":[]},"relation_closure_label":{"cardinality":"multi","id":"relation_closure_label","type":"string","description":"labels for association_relation_closure","display_name":"Inferred relationship","property":[]},"evidence_graph":{"id":"evidence_graph","type":"string","description":"Evidence graph","display_name":"Evidence graph formatted as graphson","property":[]},"object_class_closure_label":{"searchable":"tru","cardinality":"multi","id":"object_class_closure_label","type":"string","description":"Labels for object_class_closure.","display_name":"Involved in","property":[]},"object_taxon_label":{"searchable":"true","id":"object_taxon_label","type":"string","description":"Label of taxon.","display_name":"Taxon","property":[]},"object_category_label":{"id":"object_category_label","type":"string","description":"Label for association_object_category","display_name":"Object type","property":[]},"subject_description":{"searchable":"true","id":"subject_description","type":"string","description":"A more descriptive label or full name for association_subject. For a gene this may be the full name (as opposed to symbol).","display_name":"Subject description","property":[]},"is_redundant_for":{"id":"is_redundant_for","type":"string","description":"Rational for redundancy of annotation.","display_name":"Redundant for","property":[]},"evidence_closure_label":{"cardinality":"multi","id":"evidence_closure_label","type":"string","description":"List of CURIES of all entities that form part of the evidence graph.","display_name":"Evidence label closure","property":[]},"object_category":{"id":"object_category","type":"string","description":"Category of association.object. Examples: phenotype, function, process, location, tissue, gene. In GO this is called aspect","display_name":"Object type","property":[]}},"document_category":"generic_association","weight":"20","_strict":0,"id":"generic_association","_outfile":"/Users/cjm/repos/monarch-app/conf/golr-views/oban-config.yaml"}}')

  this.init();
}

var NoctuaBasicControllerBundle = ['$q', '$scope', '$animate', '$timeout', '$interval', '$location', '$anchorScroll', 'toastr', '$window', '$rootScope', NoctuaBasicController];

var app = angular.module('noctuaBasicApp');
app.controller('NoctuaBasicController', NoctuaBasicControllerBundle);
app.filter('mapGender', function() {
  var genderHash = {
    1: 'male',
    2: 'female'
  };

  return function(input) {
    console.log('mapGender:', input);
    return input;
    // if (!input){
    //   return '';
    // } else {
    //   return genderHash[input];
    // }
  };
});




if (USE_UI_GRID) {

  uiSelectWrapIcon.$inject = ['$document', 'uiGridEditConstants'];
  function uiSelectWrapIcon($document, uiGridEditConstants) {
    return function link($scope, $elm, $attr) {
      $document.on('clickIcon', docClick);

      function docClick(evt) {
        if (jQuery(evt.target).closest('.ui-select-container').size() === 0) {
          $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
          $document.off('click', docClick);
        }
      }
    };
  }


  uiSelectWrap.$inject = ['$document', 'uiGridEditConstants'];
  function uiSelectWrap($document, uiGridEditConstants) {
    return {
      require: '?^uiGrid',
      link: link
    };

    function link($scope, $elm, $attr, uiGridCtrl) {
      $document.on('click', docClick);

      //set focus at start of edit
      $scope.$on(uiGridEditConstants.events.BEGIN_CELL_EDIT, function (evt, args) {
        hideOnCellnav();
      });

      function hideOnCellnav() {
        if (uiGridCtrl && uiGridCtrl.grid.api.cellNav) {
          var dereg = uiGridCtrl.grid.api.cellNav.on.navigate($scope, function (newRowCol, oldRowCol) {
            if ($scope.col.colDef.enableCellEditOnFocus) {
              if (newRowCol.row !== $scope.row || newRowCol.col !== $scope.col) {
                $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
                dereg();
              }
            }
          });
        }
      }

      function docClick(evt) {
        if (jQuery(evt.target).closest('.ui-select-container').size() === 0) {
          $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
          $document.off('click', docClick);
        }
      }
    }
  }

  app.directive('uiSelectWrap', uiSelectWrap);
  app.directive('uiSelectWrapIcon', uiSelectWrapIcon);
}

// NoctuaBasicController.$inject = ['$animate', '$timeout', '$location', '$anchorScroll', 'toastr', '$window', '$rootScope'];

