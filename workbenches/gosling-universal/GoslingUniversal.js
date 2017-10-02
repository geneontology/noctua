////
//// A little fun driving a view with YAS*.
////

// Let jshint pass over over our external globals (browserify takes
// care of it all).
/* global YASQE */
/* global YASR */
/* global jQuery */
/* global global_barista_token */
/* global global_barista_location */
/* global global_sparql_templates_universal */

var us = require('underscore');
var bbop = require('bbop-core');
//var bbop = require('bbop').bbop;
//var bbopx = require('bbopx');
var amigo_inst = require('amigo2-instance-data');
var amigo = new amigo_inst();
var bbop_legacy = require('bbop').bbop;

// Help with strings and colors--configured separately.
var aid = new bbop_legacy.context(amigo.data.context);

var widgetry = require('noctua-widgetry');

// Aliases
var each = us.each;
var uuid = bbop.uuid;

// Code here will be ignored by JSHint, as we are technically
// "redefining" jQuery (although we are not).
/* jshint ignore:start */
var jQuery = require('jquery');
/* jshint ignore:end */

//
var json_response = require('bbop-rest-response');
var jquery_engine = require('bbop-rest-manager').jquery;
var sparql_manager = require('bbop-manager-sparql');

///
/// ...
///

var sparql_select_id = 'spqlsel';
var yasqe_id = 'yasqe';
var yasr_id = 'yasr';

// Make the default ours at least.
YASQE.defaults.sparql.endpoint = "http://rdf.geneontology.org/blazegraph/sparql";
//YASQE.defaults.sparql.endpoint = "http://stove.lbl.gov/blazegraph/sparql";

///
var GoslingInit = function(){

    var logger = new bbop.logger('gosling');
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    ///
    /// Add option to dropdown.
    ///

    // Attach to interface.
    var app_map = {};
    var selopts_str = [];
    us.each(global_sparql_templates_universal, function(tmpl){
	var uuid = bbop.uuid();

	// Mental.
	app_map[uuid] = tmpl;

	// Physical.
	var str = '<option value="' + uuid + '">' + tmpl.title + '</option>';
	selopts_str.push(str);
    });
    jQuery('#'+sparql_select_id).append(selopts_str.join(''));

    ///
    /// Setup and glue YAS*.
    ///
    
    var yasqe = YASQE(document.getElementById("yasqe"), {
	sparql: {
	    showQueryButton: true,
	}
    });
    var yasr = YASR(document.getElementById("yasr"), {
	//this way, the URLs in the results are prettified using the
	//defined prefixes in the query
	getUsedPrefixes: yasqe.getPrefixesFromQuery
    });
    
    //link both together
    yasqe.options.sparql.callbacks.complete = yasr.setResponse;

    ///
    /// ...
    ///
    
    function _insertion(tmpl){

	var prefixes = '';
	us.each(tmpl['prefixes'], function(prefix){
	    prefixes +=
		'PREFIX '+ prefix['prefix'] +':'+ prefix['expansion'] +'\n';
	});
	var qstr = prefixes + tmpl['query'];
	
	yasqe.setValue(qstr);
	if( tmpl['endpoint'] ){
	    var ep = tmpl['endpoint'];
	    //yasqe.endpoint(tmpl['endpoint']);
	    //yasqe.defaults.sparql.endpoint = ep;
	    YASQE.defaults.sparql.endpoint = ep;
	}
    }

    // Make the interface live.
    jQuery("#"+sparql_select_id).change(function(){
        var tmpl_id = jQuery(this).val();
	console.log(tmpl_id);
	var tmpl = app_map[tmpl_id];
	console.log(tmpl);
	console.log(app_map);
	_insertion(tmpl);
    });

    // Insert first item.
    var stu = global_sparql_templates_universal;
    if( stu && stu[0] ){
	_insertion(stu[0]);
    }
};

// Start the day the jQuery way.
jQuery(document).ready(function(){
    console.log('jQuery ready');

    // Try to define token.
    var start_token = null;
    if( global_barista_token ){
	start_token = global_barista_token;
    }

    // Next we need a manager to try and pull in the model.
    if( typeof(global_minerva_definition_name) === 'undefined' ||
	typeof(global_barista_location) === 'undefined' ){
	    alert('environment not ready');
	}else{
	    // Only roll if the env is correct.
	    // Will use the above variables internally (sorry).
	    GoslingInit();

	    // When all is said and done, let's also fillout the user
	    // name just for niceness. This is also a test of CORS in
	    // express.
	    if( start_token ){
		widgetry.user_check(global_barista_location,
				    start_token, 'user_name_info', false);
	    }
	}
});
