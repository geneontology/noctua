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
    golrManger: null,
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
        if(widgetMaxItems == 1){
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
        feedbackLabel.text('Cannot be empty!');
      } else {
        feedbackLabel.text('');
      }
    }

    var _clearCache = function() {
      selectized[0].selectize.clearCache("option");
      selectized[0].selectize.clearOptions();
    };

    var _updateHits = function(h) {
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
