// If it looks like we're in an environment that supports CommonJS
// Modules 1.0, bbop-js might not be extant in this namespace. Try and
// get at it. Otherwise, if we're in browser-land, it should be
// included in the global and we can proceed.
if( typeof(exports) != 'undefined' ){
    var bbop = require('bbop').bbop;
}
/* 
 * Package: version.js
 * 
 * Namespace: amigo.version
 * 
 * This package was automatically generated during the build process
 * and contains its version information--this is the release of the
 * API that you have.
 */

if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.version == "undefined" ){ amigo.version = {}; }

/*
 * Variable: revision
 *
 * Partial version for this library; revision (major/minor version numbers)
 * information.
 */
amigo.version.revision = "2.3.0";

/*
 * Variable: release
 *
 * Partial version for this library: release (date-like) information.
 */
amigo.version.release = "20150422";
/*
 * Package: api.js
 * 
 * Namespace: amigo.api
 * 
 * Core for AmiGO 2 remote functionality.
 * 
 * Provide methods for accessing AmiGO/GO-related web resources from
 * the host server. A loose analog to the perl AmiGO.pm top-level.
 * 
 * This module should contain nothing to do with the DOM, but rather
 * methods to access and make sense of resources provided by AmiGO and
 * its related services on the host.
 * 
 * WARNING: This changes very quickly as parts get spun-out into more
 * stable packages.
 */

// Module and namespace checking.
if( typeof amigo == "undefined" ){ var amigo = {}; }

/*
 * Constructor: api
 * 
 * Contructor for the AmiGO API object.
 * Hooks to useful things back on AmiGO.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  AmiGO object
 */
amigo.api = function(){

    ///
    /// General AmiGO (perl server) AJAX response checking (after
    /// parsing).
    ///

    this.response = {};

    // Check to see if the server thinks we were successful.
    this.response.success = function(robj){
	var retval = false;
	if( robj && robj.success && robj.success == 1 ){
	    retval = true;
	}
	return retval;
    };

    // Check to see what the server thinks about its own condition.
    this.response.type = function(robj){
	var retval = 'unknown';
	if( robj && robj.type ){
	    retval = robj.type;
	}
	return retval;
    };

    // Check to see if the server thinks the data was successful.
    this.response.errors = function(robj){
	var retval = new Array();
	if( robj && robj.errors ){
	    retval = robj.errors;
	}
	return retval;
    };

    // Check to see if the server thinks the data was correct.
    this.response.warnings = function(robj){
	var retval = new Array();
	if( robj && robj.warnings ){
	    retval = robj.warnings;
	}
	return retval;
    };

    // Get the results chunk.
    this.response.results = function(robj){
	var retval = {};
	if( robj && robj.results ){
	    retval = robj.results;
	}
	return retval;
    };

    // Get the arguments chunk.
    this.response.arguments = function(robj){
	var retval = {};
	if( robj && robj.arguments ){
	    retval = robj.arguments;
	}
	return retval;
    };

    ///
    /// Workspaces' linking.
    ///

    function _abstract_head_template(head){
	return head + '?';
    }

    // Convert a hash (with possible arrays as arguments) into a link
    // string.
    // NOTE: Non-recursive--there are some interesting ways to create
    // cyclic graph hashes in SpiderMonkey, and I'd rather not think
    // about it right now.
    function _abstract_segment_template(segments){
	
	var maxibuf = new Array();
	for( var segkey in segments ){

	    var segval = segments[segkey];

	    // If the value looks like an array, iterate over it and
	    // collect.
	    if( segval &&
		segval != null &&
		typeof segval == 'object' &&
		segval.length ){

		for( var i = 0; i < segval.length; i++ ){
		    var minibuffer = new Array();
		    minibuffer.push(segkey);
		    minibuffer.push('=');
		    minibuffer.push(segval[i]);
		    maxibuf.push(minibuffer.join(''));
		}

	    }else{
		var minibuf = new Array();
		minibuf.push(segkey);
		minibuf.push('=');
		minibuf.push(segval);
		maxibuf.push(minibuf.join(''));
	    }
	}
	return maxibuf.join('&');
    }

    // Similar to the above, but creating a solr filter set.
    function _abstract_solr_filter_template(filters){
	
	var allbuf = new Array();
	for( var filter_key in filters ){

	    var filter_val = filters[filter_key];

	    // If the value looks like an array, iterate over it and
	    // collect.
	    if( filter_val &&
		filter_val != null &&
		typeof filter_val == 'object' &&
		filter_val.length ){

		    for( var i = 0; i < filter_val.length; i++ ){
			var minibuffer = new Array();
			var try_val = filter_val[i];
			if( typeof(try_val) != 'undefined' &&
			try_val != '' ){
			    minibuffer.push('fq=');
			    minibuffer.push(filter_key);
			    minibuffer.push(':');
			    minibuffer.push('"');
			    minibuffer.push(filter_val[i]);
			    minibuffer.push('"');
			    allbuf.push(minibuffer.join(''));
			}
		    }		    
		}else{
		    var minibuf = new Array();
		    if( typeof(filter_val) != 'undefined' &&
			filter_val != '' ){
			    minibuf.push('fq=');
			    minibuf.push(filter_key);
			    minibuf.push(':');
			    minibuf.push('"');
			    minibuf.push(filter_val);
			    minibuf.push('"');
			    allbuf.push(minibuf.join(''));
			}
		}
	}
	return allbuf.join('&');
    }

    // Construct the templates using head and segments.
    function _abstract_link_template(head, segments){	
	return _abstract_head_template(head) +
	    _abstract_segment_template(segments);
    }

    // // Construct the templates using the segments.
    // function _navi_client_template(segments){
    // 	segments['mode'] = 'layers_graph';
    // 	return _abstract_link_template('amigo_exp', segments);
    // }

    // // Construct the templates using the segments.
    // function _navi_data_template(segments){
    // 	segments['mode'] = 'navi_js_data';
    // 	return _abstract_link_template('aserve_exp', segments);
    // }

    // Construct the templates using the segments.
    function _ws_template(segments){
	segments['mode'] = 'workspace';
	return _abstract_link_template('amigo_exp', segments);
    }

    // // Construct the templates using the segments.
    // function _ls_assoc_template(segments){
    // 	segments['mode'] = 'live_search_association';
    // 	return _abstract_link_template('aserve', segments);
    // }
    // function _ls_gp_template(segments){
    // 	segments['mode'] = 'live_search_gene_product';
    // 	return _abstract_link_template('aserve', segments);
    // }
    // function _ls_term_template(segments){
    // 	segments['mode'] = 'live_search_term';
    // 	return _abstract_link_template('aserve', segments);
    // }

    // Construct the templates using the segments.
    function _completion_template(segments){
    	return _abstract_link_template('completion', segments);
    }

    // // Construct the templates using the segments.
    // function _nmatrix_template(segments){
    // 	segments['mode'] = 'nmatrix';
    // 	return _abstract_link_template('amigo_exp', segments);
    // }

    this.api = {};
    this.link = {};
    this.html = {};

    //     // Some handling for a workspace object once we get one.
    //     this.util.workspace = {};
    //     this.util.workspace.get_terms = function(ws){
    // 	var all_terms = new Array();
    // 	for( var t = 0; t < ws.length; t++ ){
    // 	    var item = ws[t];
    // 	    if( item.type == 'term' ){
    // 		all_terms.push(item.key);
    // 	    }
    // 	}
    // 	return all_terms;
    //     };

    ///
    /// JSON? JS? API functions for workspaces.
    ///

    this.workspace = {};

    this.workspace.remove = function(ws_name){
	return _ws_template({
	    action: 'remove_workspace',
	    workspace: ws_name
	});
    };
    this.workspace.add = function(ws_name){
	return _ws_template({
	    action: 'add_workspace',
	    workspace: ws_name
	});
    };
    this.workspace.copy = function(ws_from_name, ws_to_name){
	return _ws_template({
	    action: 'copy_workspace',
	    workspace: ws_from_name,
	    copy_to_workspace: ws_to_name
	});
    };
    this.workspace.clear = function(ws_name){
	return _ws_template({
	    action: 'clear_workspace',
	    workspace: ws_name
	});
    };
    this.workspace.list = function(ws_name){
	return _ws_template({
	    action: 'list_workspaces',
	    workspace: ws_name
	});
    };

    // API functions for workspace items.
    //     this.workspace.add_item = function(ws_name, key, type, name){
    this.workspace.add_item = function(ws_name, key, name){
	return _ws_template({
	    action: 'add_item',
	    workspace: ws_name,
	    key: key,
            // _t_y_p_e_: _t_y_p_e_, // prevent naturaldocs from finding this
	    name: name
	});
    };
    this.workspace.remove_item = function(ws_name, key){
	return _ws_template({
	    action: 'remove_item',
	    workspace: ws_name,
	    key: key
	});
    };
    this.workspace.list_items = function(ws_name){
	return _ws_template({
	    action: 'list_items',
	    workspace: ws_name
	});
    };

    // Just the workspace and item status. Essentially do nothing and
    // link to the current session status.
    this.workspace.status = function(){
	return _ws_template({ action: '' });
    };

    ///
    /// API function for completion/search information.
    ///

    this.completion = function(args){

	var format = 'amigo';
	var type = 'general';
	var ontology = null;
	var narrow = 'false';
	var query = '';
	if( args ){
	    if( args['format'] ){ format = args['format']; }
	    if( args['type'] ){ type = args['type']; }
	    if( args['ontology'] ){ontology = args['ontology']; }
	    if( args['narrow'] ){narrow = args['narrow']; }
	    if( args['query'] ){query = args['query']; }
	}

	return _completion_template({format: format,
				     type: type,
				     ontology: ontology,
				     narrow: narrow,
				     query: encodeURIComponent(query)});
    };

    ///
    /// API functions for live search.
    ///
    this.live_search = {};

    // General search:
    // http://accordion.lbl.gov:8080/solr/select?indent=on&version=2.2&q=annotation_class_label%3Abinding&fq=&start=0&rows=10&fl=*%2Cscore&qt=standard&wt=json&explainOther=&hl.fl=
    // Facet on date:
    // http://accordion.lbl.gov:8080/solr/select?indent=on&version=2.2&q=annotation_class_label%3Abinding&fq=&start=0&rows=10&fl=*%2Cscore&qt=standard&wt=json&explainOther=&hl.fl=&facet=true&facet.field=date    
    this.live_search.golr = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_query_args =
	    {
		// TODO/BUG? need jsonp things here?
		qt: 'standard',
		indent: 'on',
		wt: 'json',
		version: '2.2',
		rows: 10,
		//start: 1,
		start: 0, // Solr is offset indexing
		fl: '*%2Cscore',

		// Control of facets.
		facet: '',
		'facet.field': [],

		// Facet filtering.
		fq: [],

		// Query-type stuff.
		q: '',

		// Our bookkeeping.
		packet: 0
	    };
	var final_query_args = bbop.core.fold(default_query_args, in_args);
		
	var default_filter_args =
	    {
		// Filter stuff.
		document_category: [],
		type: [],
		source: [],
		taxon: [],
		evidence_type: [],
		evidence_closure: [],
		isa_partof_label_closure: [],
		annotation_extension_class_label: [],
		annotation_extension_class_label_closure: []
	    };
	var final_filter_args = bbop.core.fold(default_filter_args, in_args);

	// ...
	//return _abstract_link_template('select', segments);	
	var complete_query = _abstract_head_template('select') +
	    _abstract_segment_template(final_query_args);
	var addable_filters = _abstract_solr_filter_template(final_filter_args);
	if( addable_filters.length > 0 ){
	    complete_query = complete_query + '&' + addable_filters;
	}
	return complete_query;
    };

    ///
    /// API functions for the ontology.
    ///
    this.ontology = {};
    this.ontology.roots = function(){
	return _abstract_link_template('aserve_exp', {'mode': 'ontology'});
    };

    ///
    /// API functions for navi js data.
    ///

    this.navi_js_data = function(args){

	if( ! args ){ args = {}; }

	var final_args = {};

	// Transfer the name/value pairs in opt_args into final args
	// if extant.
	var opt_args = ['focus', 'zoom', 'lon', 'lat'];
	//var opt_args_str = '';
	for( var oa = 0; oa < opt_args.length; oa++ ){
	    var arg_name = opt_args[oa];
	    if( args[arg_name] ){
		// opt_args_str =
		// opt_args_str + '&' + arg_name + '=' + args[arg_name];
		final_args[arg_name] = args[arg_name];
	    }
	}

	//
	var terms_buf = new Array();
	if( args.terms &&
	    args.terms.length &&
	    args.terms.length > 0 ){

	    //
	    for( var at = 0; at < args.terms.length; at++ ){
		terms_buf.push(args.terms[at]);
	    } 
	}
	final_args['terms'] = terms_buf.join(' '); 

	return _navi_data_template(final_args);
    };

    ///
    /// Links for terms and gene products.
    ///

    function _term_link(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		acc: ''
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	var acc = final_args['acc'];
	//return 'term_details?term=' + acc;
	return 'amigo?mode=golr_term_details&term=' + acc;
    }
    this.link.term = _term_link;

    // BUG/TODO: should this actually be in widgets? How core is this
    // convenience?
    this.html.term_link = function(acc, label){
	if( ! label ){ label = acc; }
	return '<a title="Go to term details page for ' + label +
	    '." href="' + _term_link({acc: acc}) + '">' + label +'</a>';
    };

    function _gene_product_link(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		acc: ''
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	var acc = final_args['acc'];
	//return 'gp-details.cgi?gp=' + acc;
	return 'amigo?mode=golr_gene_product_details&gp=' + acc;
    }
    this.link.gene_product = _gene_product_link;

    // BUG/TODO: should this actually be in widgets? How core is this
    // convenience?
    this.html.gene_product_link = function(acc, label){
	if( ! label ){ label = acc; }
	return '<a title="Go to gene product details page for ' + label +
	    '." href="' + _gene_product_link({acc: acc}) + '">' + label +'</a>';
    };

    ///
    /// Links for term product associations.
    ///

    this.link.term_assoc = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		acc: '',
		speciesdb: [],
		taxid: []
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	var acc = final_args['acc'];
	var speciesdbs = final_args['speciesdb'];
	var taxids = final_args['taxid'];

	//
	var spc_fstr = speciesdbs.join('&speciesdb');
	var tax_fstr = taxids.join('&taxid=');
	//core.kvetch('LINK SRCS: ' + spc_fstr);
	//core.kvetch('LINK TIDS: ' + tax_fstr);

	return 'term-assoc.cgi?term=' + acc +
	    '&speciesdb=' + spc_fstr +
	    '&taxid=' + tax_fstr;
    };

    ///
    /// Link function for blast.
    ///

    this.link.single_blast = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		acc: ''
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	var acc = final_args['acc'];
	return 'blast.cgi?action=blast&seq_id=' + acc;
    };

    ///
    /// Link function for term enrichment.
    ///

    this.link.term_enrichment = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		gp_list: [] 
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	var acc = final_args['acc'];
	return 'term_enrichment?' +
	    'gp_list=' + final_args['gp_list'].join(' ');
    };

    ///
    /// Link function for slimmer.
    ///

    this.link.slimmer = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		gp_list: [], 
		slim_list: []
	    };
	var final_args = bbop.core.fold(default_args, in_args);
	
	return 'slimmer?' +
	    'gp_list=' + final_args['gp_list'].join(' ') +
	    '&slim_list=' + final_args['slim_list'].join(' ');
    };

    ///
    /// Link function for N-Matrix.
    ///

    this.link.nmatrix = function(in_args){

	if( ! in_args ){ in_args = {}; }
	var default_args =
	    {
		term_set_1: '',
		term_set_2: ''
	    };
	var final_args = bbop.core.fold(default_args, in_args);

	//
	var terms_buf = new Array();
	if( in_args.terms &&
	    in_args.terms.length &&
	    in_args.terms.length > 0 ){

		//
	    for( var at = 0; at < in_args.terms.length; at++ ){
		terms_buf.push(in_args.terms[at]);
	    } 
	}
	final_args['term_set_1'] = terms_buf.join(' '); 
	final_args['term_set_2'] = terms_buf.join(' '); 

	return _nmatrix_template(final_args);
    };

    ///
    /// Link functions for navi client (bookmark).
    ///

    this.link.layers_graph = function(args){

	//
	var final_args = {};
	if( args['lon'] &&
	    args['lat'] &&
	    args['zoom'] &&
	    args['focus'] ){

	    //
	    final_args['lon'] = args['lon'];
	    final_args['lat'] = args['lat'];
	    final_args['zoom'] = args['zoom'];
	    final_args['focus'] = args['focus'];
	}

	if( args['terms'] &&
	    args['terms'].length &&
	    args['terms'].length > 0 ){

	    //
	    var aterms = args['terms'];
	    var terms_buf = new Array();
	    for( var at = 0; at < aterms.length; at++ ){
		terms_buf.push(aterms[at]);
	    }
	    final_args['terms'] = terms_buf.join(' '); 
	}
	
	return _navi_client_template(final_args);
    };

    // TODO:
};
/* 
 * Package: linker.js
 * 
 * Namespace: amigo.linker
 * 
 * Generic AmiGO link generator, fed by <amigo.data.server> for local
 * links and <amigo.data.xrefs> for non-local links.
 * 
 * NOTE: A lot of this is lifted from the (defunct) amigo2.js
 * package. However, the future should be here.
 */

// Module and namespace checking.
if( typeof amigo == "undefined" ){ var amigo = {}; }

/*
 * Constructor: linker
 * 
 * Create an object that can make URLs and/or anchors.
 * 
 * These functions have a well defined interface so that other
 * packages can use it.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  self
 */
amigo.linker = function (){
    this._is_a = 'amigo.linker';

    // With the new dispatcher, relative URLs no longer work, so we
    // have to bring in server data--first let's ensure it.
    if( ! amigo.data.server ){
	throw new Error('we are missing access to amigo.data.server!');
    }
    // Easy app base.
    var sd = new amigo.data.server();
    this.app_base = sd.app_base();
    // Internal term matcher.
    this.term_regexp = null;
    var internal_regexp_str = sd.term_regexp();    
    if( internal_regexp_str ){
	this.term_regexp = new RegExp(internal_regexp_str);
    }

    // Categories for different special cases (internal links).
    this.ont_category = {
	'term': true,
	'ontology_class': true,
	'annotation_class': true,
	'annotation_class_closure': true,
	'annotation_class_list': true
    };
    this.bio_category = {
        'gp': true,
	'gene_product': true,
	'bioentity': true
    };
    this.complex_annotation_category = {
        //'complex_annotation': true,
        'annotation_group': true
        //'annotation_unit': true
    };
    this.search_category = { // not including the trivial medial_search below
        'search': true,
	'live_search': true
    };
    this.search_modifier = {
	// Possibly "dynamic".
	'gene_product': '/bioentity',
	'bioentity': '/bioentity',
	'ontology': '/ontology',
	'annotation': '/annotation',
	'complex_annotation': '/complex_annotation',
	'family': '/family',
	'lego_unit': '/lego_unit',
	'general': '/general'
    };
    this.other_interlinks = {
	'medial_search': '/amigo/medial_search',
	'landing': '/amigo/landing',
	'tools': '/amigo/software_list',
	'schema_details': '/amigo/schema_details',
	'load_details': '/amigo/load_details',
	'browse': '/amigo/browse',
	'goose': '/goose',
	'grebe': '/grebe',
	'gannet': '/gannet',
	'repl': '/repl'	
    };
};

/*
 * Function: url
 * 
 * Return a url string.
 * 
 * Arguments:
 *  args - id
 *  xid - *[optional]* an internal transformation id
 *  modifier - *[optional]* modify xid; only used with xid
 * 
 * Returns:
 *  string (url); null if it couldn't create anything
 */
amigo.linker.prototype.url = function (id, xid, modifier){
    
    var retval = null;

    ///
    /// AmiGO hard-coded internal link types.
    ///

    // For us, having an xid means that we will be doing some more
    // complicated routing.
    if( xid && xid != '' ){

	// First let's do the ones that need an associated id to
	// function--either data urls or searches.
	if( id && id != '' ){
	    if( this.ont_category[xid] ){
		retval = this.app_base + '/amigo/term/' + id;
		//retval = _add_restmark_modifier(retval, modifier);
            }else if( this.bio_category[xid] ){
		retval = this.app_base + '/amigo/gene_product/' + id;
		//retval = _add_restmark_modifier(retval, modifier);
            }else if( this.complex_annotation_category[xid] ){
		retval = this.app_base + '/amigo/complex_annotation/'+ id;
            }else if( this.search_category[xid] ){

		// First, try and get the proper path out. Will
		// hardcode for now since some paths don't map
		// directly to the personality.
		var search_path = '';
		if( this.search_modifier[modifier] ){
		    search_path = this.search_modifier[modifier];
		}
		
		retval = this.app_base + '/amigo/search' + search_path;
		if( id ){
		    // Ugh...decide if the ID indicated a restmark or
		    // a full http action bookmark.
		    var http_re = new RegExp("^http");
		    if( http_re.test(id) ){
			// HTTP bookmark.
			retval = retval + '?bookmark='+ id;
		    }else{
			// minimalist RESTy restmark.
			retval = retval + '?' + id;
		    }
		}
	    }
	}

	// Things that do not need an id to function--like just
	// popping somebody over to Grebe or the medial search.
	if( ! retval ){
	    if( this.other_interlinks[xid] ){
		var extension = this.other_interlinks[xid];
		retval = this.app_base + extension;

		// Well, for medial search really, but it might be
		// general?
		if( xid == 'medial_search' ){
		    // The possibility of just tossing back an empty
		    // search for somebody downstream to fill in.
		    if( bbop.core.is_defined(id) && id != null ){
			retval = retval + '?q=' + id;
		    }
		}
	    }
	}
    }

    ///
    /// External resources. For us, if we haven't found something
    /// so far, try the data xrefs.
    ///
    
    // Since we couldn't find anything with our explicit local
    // transformation set, drop into the great abyss of the xref data.
    if( ! retval && id && id != '' ){ // not internal, but still has an id
	if( ! amigo.data.xrefs ){
	    throw new Error('amigo.data.xrefs is missing!');
	}
	
	// First, extract the probable source and break it into parts.
	var full_id_parts = bbop.core.first_split(':', id);
	if( full_id_parts && full_id_parts[0] && full_id_parts[1] ){
	    var src = full_id_parts[0];
	    var sid = full_id_parts[1];
	    
	    // Now, check to see if it is indeed in our store.
	    var lc_src = src.toLowerCase();
	    var xref = amigo.data.xrefs[lc_src];
	    if( xref && xref['url_syntax'] ){
		retval =
		    xref['url_syntax'].replace('[example_id]', sid, 'g');
	    }
	}
    }
    
    return retval;
};

/*
 * Function: anchor
 * 
 * Return a link as a chunk of HTML, all ready to consume in a
 * display.
 * 
 * Arguments:
 *  args - hash--'id' required; 'label' and 'hilite' are inferred if not extant
 *  xid - *[optional]* an internal transformation id
 *  rest - *[optional]* modify xid; only used with xid
 * 
 * Returns:
 *  string (link); null if it couldn't create anything
 */
amigo.linker.prototype.anchor = function(args, xid, modifier){
    
    var anchor = this;
    var retval = null;

    // Don't even start if there is nothing.
    if( args ){

	// Get what fundamental arguments we can.
	var id = args['id'];
	if( id ){
	
	    // Infer label from id if not present.
	    var label = args['label'];
	    if( ! label ){ label = id; }
	
	    // Infer hilite from label if not present.
	    var hilite = args['hilite'];
	    if( ! hilite ){ hilite = label; }
	
	    // See if the URL is legit. If it is, make something for it.
	    var url = this.url(id, xid, modifier);
	    if( url ){
		
		// First, see if it is one of the internal ones we know about
		// and make something special for it.
		if( xid ){
		    if( this.ont_category[xid] ){
		    
			// Possible internal/external detection here.
			// var class_str = ' class="amigo-ui-term-internal" ';
			var class_str = '';
			var title_str = 'title="' + // internal default
			id + ' (go to the term details page for ' +
			    label + ')"';
			if( this.term_regexp ){
			    if( this.term_regexp.test(id) ){
			    }else{
				class_str = ' class="amigo-ui-term-external" ';
				title_str = ' title="' +
				    id + ' (is an external term; click ' +
				    'to view our internal information for ' +
				    label + ')" ';
			    }
			}
			
			//retval = '<a title="Go to the term details page for '+
 			retval = '<a ' + class_str + title_str +
			    ' href="' + url + '">' + hilite + '</a>';
		    }else if( this.bio_category[xid] ){
 			retval = '<a title="' + id +
			    ' (go to the details page for ' + label +
			    ')" href="' + url + '">' + hilite + '</a>';
		    }else if( this.search_category[xid] ){
			retval = '<a title="Reinstate bookmark for ' + label +
			    '." href="' + url + '">' + hilite + '</a>';
		    }
		}
		
		// If it wasn't in the special transformations, just make
		// something generic.
		if( ! retval ){
		    retval = '<a title="' + id +
			' (go to the page for ' + label +
			')" href="' + url + '">' + hilite + '</a>';
		}
	    }
	}
    }

    return retval;
};
/* 
 * Package: handler.js
 * 
 * Namespace: amigo.handler
 * 
 * Generic AmiGO handler (conforming to what /should/ be described in
 * the BBOP JS documentation), fed by <amigo.data.dispatch>.
 */

// Module and namespace checking.
if( typeof amigo == "undefined" ){ var amigo = {}; }

/*
 * Constructor: handler
 * 
 * Create an object that will run functions in the namespace with a
 * specific profile.
 * 
 * These functions have a well defined interface so that other
 * packages can use them (for example, the results display in
 * LiveSearch.js).
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  self
 */
amigo.handler = function (){
    this._is_a = 'amigo.handler';

    var is_def = bbop.core.is_defined;

    // Let's ensure we're sane.
    if( ! is_def(amigo) ||
	! is_def(amigo.data) ||
	! is_def(amigo.data.dispatch) ){
	throw new Error('we are missing access to amigo.data.dispatch!');
    }

    // Okay, since trying functions into existance is slow, we'll
    // create a cache of strings to functions.
    this.mangle = bbop.core.uuid();
    this.string_to_function_map = {};
    this.entries = 0; // a little extra for debugging and testing
};

/*
 * Function: dispatch
 * 
 * Return a string.
 * 
 * The fallback function is called if no match could be found in the
 * amigo.data.dispatch. It is called with the name and context
 * arguments in the same order.
 * 
 * Arguments:
 *  data - the incoming thing to be handled
 *  name - the field name to be processed
 *  context - *[optional]* a string to add extra context to the call
 *  fallback - *[optional]* a fallback function to call in case nothing is found
 * 
 * Returns:
 *  string; null if it couldn't create anything
 */
amigo.handler.prototype.dispatch = function(data, name, context, fallback){
    
    // Aliases.
    var is_def = bbop.core.is_defined;

    // First, get the specific id for this combination.
    var did = name || '';
    did += '_' + this.mangle;
    if( context ){
	did += '_' + context;
    }

    // If the combination is not already in the map, fill it in as
    // best we can.
    if( ! is_def(this.string_to_function_map[did]) ){
	
	this.entries += 1;

	// First, try and get the most specific.
	if( is_def(amigo.data.dispatch[name]) ){

	    var field_hash = amigo.data.dispatch[name];
	    var function_string = null;

	    if( is_def(field_hash['context']) &&
		is_def(field_hash['context'][context]) ){
		// The most specific.
		function_string = field_hash['context'][context];
	    }else{
		// If the most specific cannot be found, try and get
		// the more general one.
		if( is_def(field_hash['default']) ){
		    function_string = field_hash['default'];
		}
	    }

	    // At the end of this section, if we don't have a string
	    // to resolve into a function, the data format we're
	    // working from is damaged.
	    if( function_string == null ){
		throw new Error('amigo.data.dispatch appears to be damaged!');
	    }
	    
	    // We have a string. Pop it into existance with eval.
	    var evalled_thing = eval(function_string);

	    // Final test, make sure it is a function.
	    if( ! is_def(evalled_thing) ||
		evalled_thing == null ||
		bbop.core.what_is(evalled_thing) != 'function' ){
		throw new Error('"' + function_string + '" did not resolve!');
	    }else{
		this.string_to_function_map[did] = evalled_thing;		
	    }

	}else if( is_def(fallback) ){
	    // Nothing could be found, so add the fallback if it is
	    // there.
	    this.string_to_function_map[did] = fallback;
	}else{
	    // Whelp, nothing there, so stick an indicator in.
	    this.string_to_function_map[did] = null;
	}
    }

    // We are now ensured that either we have a callable function or
    // null, so let's finish it--either the return value of the called
    // function or null.
    var retval = null;
    if( this.string_to_function_map[did] != null ){
	var cfunc = this.string_to_function_map[did];
	retval = cfunc(data, name, context);
    }
    return retval;
};
/* 
 * Package: echo.js
 * 
 * Namespace: amigo.handlers.echo
 * 
 * Static function handler for echoing inputs--really used for
 * teaching and testing.
 */

if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.handlers == "undefined" ){ amigo.handlers = {}; }

/*
 * Function: echo
 * 
 * Applies bbop.core.dump to whatever comes in.
 * 
 * Parameters:
 *  thing
 * 
 * Returns:
 *  a string; it /will/ be a string
 * 
 * Also See: <bbop.handler>
 */
amigo.handlers.echo = function(thing, name, context){

    // Force a return string into existence.
    var retstr = null;
    try {
	retstr = bbop.core.dump(thing);
    } catch (x) {
	retstr = '';
    }

    // // Appaend any optional stuff.
    // var is_def = bbop.core.is_defined;
    // var what = bbop.core.what_is;
    // if( is_def(name) && what(name) == 'string' ){
    // 	retstr += ' (' + name + ')';
    // }
    // if( is_def(context) && what(context) == 'string' ){
    // 	retstr += ' (' + context + ')';
    // }

    return retstr;
};
/* 
 * Package: owl_class_expression.js
 * 
 * Namespace: amigo.handlers.owl_class_expression
 * 
 * Static function handler for displaying OWL class expression
 * results. To be used for GAF column 16 stuff.
 */

if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.handlers == "undefined" ){ amigo.handlers = {}; }

/*
 * Function: owl_class_expression
 * 
 * Example incoming data (as a string or object):
 * 
 * : { relationship: {
 * :     relation: [{id: "RO:001234", label: "regulates"},
 * :                {id:"BFO:0003456", label: "hp"}], 
 * :     id: "MGI:MGI:185963",
 * :     label: "kidney"
 * :   }
 * : }
 * 
 * Parameters:
 *  JSON object as *[string or object]*; see above
 * 
 * Returns:
 *  HTML string
 * 
 * Also See: <bbop.handler>
 */
amigo.handlers.owl_class_expression = function(in_owlo){

    var retstr = "";

    // // Add logging.
    // var logger = new bbop.logger();
    // logger.DEBUG = true;
    // //logger.DEBUG = false;
    // function ll(str){ logger.kvetch(str); }

    // Aliases.
    var is_def = bbop.core.is_defined;
    var what_is = bbop.core.what_is;
    var loop = bbop.core.each;

    var owlo = in_owlo;
    if( what_is(owlo) == 'string' ){
	// This should be an unnecessary robustness check as
	// everything /should/ be a legit JSON string...but things
	// happen in testing. We'll check to make sure that it looks
	// like what it should be as well.
	if( in_owlo.charAt(0) == '{' &&
	    in_owlo.charAt(in_owlo.length-1) == '}' ){
	    owlo = bbop.json.parse(in_owlo) || {};
	}else{
	    // Looks like a normal string string.
	    // Do nothing for now, but catch in the next section.
	}
    }

    // Check to make sure that it looks right.
    if( what_is(owlo) == 'string' ){
	// Still a string means bad happened--we want to see that.
	retstr = owlo + '?';
    }else if( ! is_def(owlo) ||
	      ! is_def(owlo['relationship']) ||
	      ! what_is(owlo['relationship']) == 'object' ||
	      ! what_is(owlo['relationship']['relation']) == 'array' ||
	      ! is_def(owlo['relationship']['id']) ||
	      ! is_def(owlo['relationship']['label']) ){
	// 'Twas an error--ignore.
	//throw new Error('sproing!');
    }else{
	
	//throw new Error('sproing!');
	var link = new amigo.linker();

	// Okay, right structure--first assemble the relationships,
	// then tag onto end.
	var rel_buff = [];
	bbop.core.each(owlo['relationship']['relation'],
		       function(rel){
			   // Check to make sure that these are
			   // structured correctly as well.
			   var rel_id = rel['id'];
			   var rel_lbl = rel['label'];
			   if( is_def(rel_id) && is_def(rel_lbl) ){
			       var an =
				   link.anchor({id: rel_id, label: rel_lbl});
			       // Final check: if we didn't get
			       // anything reasonable, just a label.
			       if( ! an ){ an = rel_lbl; }
			       rel_buff.push(an);
			       // ll('in ' + rel_id + ' + ' + rel_lbl + ': ' + an);
			   }
		       });
	var ranc = link.anchor({id: owlo['relationship']['id'],
				label: owlo['relationship']['label']});
	// Again, a final check
	if( ! ranc ){ ranc = owlo['relationship']['label']; }
	retstr = rel_buff.join(' &rarr; ') + ' ' + ranc;
    }
    
    return retstr;
};
/* 
 * Package: qualifiers.js
 * 
 * Namespace: amigo.handlers.qualifiers
 * 
 * 
 */

if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.handlers == "undefined" ){ amigo.handlers = {}; }

/*
 * Function: qualifiers
 * 
 * Essentially catch certain strings and hightlight them.
 * 
 * Example incoming data as string:
 * 
 * : "not"
 * 
 * Parameters:
 *  string or null
 * 
 * Returns:
 *  HTML string
 * 
 * Also See: <bbop.handler>
 */
amigo.handlers.qualifiers = function(in_qual){

    var retstr = in_qual;

    // Aliases.
    var is_def = bbop.core.is_defined;
    var what_is = bbop.core.what_is;

    if( is_def(in_qual) ){
	if( what_is(in_qual) == 'string' ){
	    if( in_qual == 'not' || in_qual == 'NOT' ){
		retstr = '<span class="qualifier-not">NOT</span>';
	    }
	}
    }

    return retstr;
};
/* 
 * Package: golr.js
 * 
 * Namespace: amigo.data.golr
 * 
 * This package was automatically created during an AmiGO 2 installation
 * from the YAML configuration files that AmiGO pulls in.
 *
 * Useful information about GOlr. See the package <golr_conf.js>
 * for the API to interact with this data file.
 *
 * NOTE: This file is generated dynamically at installation time.
 * Hard to work with unit tests--hope it's not too bad. You have to
 * occasionally copy back to keep the unit tests sane.
 *
 * NOTE: This file has a slightly different latout from the YAML
 * configurations files--in addition instead of the fields
 * being in lists (fields), they are in hashes keyed by the
 * field id (fields_hash).
 */

// All of the server/instance-specific meta-data.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Variable: golr
 * 
 * The configuration for the data.
 * Essentially a JSONification of the OWLTools YAML files.
 * This should be consumed directly by <bbop.golr.conf>.
 */
amigo.data.golr = {
   "bioentity" : {
      "display_name" : "Genes and gene products",
      "description" : "Genes and gene products associated with GO terms.",
      "_strict" : 0,
      "searchable_extension" : "_searchable",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/bio-config.yaml",
      "result_weights" : "bioentity^8.0 bioentity_name^7.0 taxon^6.0 panther_family^5.0 type^4.0 source^3.0 annotation_class_list^2.0 synonym^1.0",
      "boost_weights" : "bioentity^2.0 bioentity_label^2.0 bioentity_name^1.0 bioentity_internal_id^1.0 synonym^1.0 isa_partof_closure_label^1.0 regulates_closure^1.0 regulates_closure_label^1.0 panther_family^1.0 panther_family_label^1.0 taxon_closure_label^1.0",
      "document_category" : "bioentity",
      "schema_generating" : "true",
      "fields" : [
         {
            "required" : "false",
            "cardinality" : "single",
            "description" : "Gene of gene product ID.",
            "display_name" : "Acc",
            "id" : "id",
            "indexed" : "true",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "type" : "string"
         },
         {
            "id" : "bioentity",
            "indexed" : "true",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "description" : "Gene or gene product ID.",
            "display_name" : "Acc",
            "required" : "false",
            "cardinality" : "single"
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "description" : "Symbol or name.",
            "display_name" : "Label",
            "id" : "bioentity_label",
            "indexed" : "true",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "type" : "string"
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "description" : "The full name of the gene product.",
            "display_name" : "Name",
            "id" : "bioentity_name",
            "indexed" : "true",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "type" : "string"
         },
         {
            "id" : "bioentity_internal_id",
            "indexed" : "false",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "description" : "The bioentity ID used at the database of origin.",
            "display_name" : "This should not be displayed",
            "required" : "false",
            "cardinality" : "single"
         },
         {
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "type",
            "display_name" : "Type",
            "description" : "Type class.",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Taxon",
            "description" : "Taxonomic group",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "id" : "taxon"
         },
         {
            "indexed" : "true",
            "id" : "taxon_label",
            "type" : "string",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "description" : "Taxonomic group",
            "display_name" : "Taxon"
         },
         {
            "type" : "string",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "id" : "taxon_closure",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Taxon",
            "description" : "Taxonomic group and ancestral groups."
         },
         {
            "type" : "string",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "indexed" : "true",
            "id" : "taxon_closure_label",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Taxon",
            "description" : "Taxonomic group and ancestral groups."
         },
         {
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "id" : "isa_partof_closure",
            "indexed" : "true",
            "display_name" : "Involved in",
            "description" : "Closure of ids/accs over isa and partof.",
            "required" : "false",
            "cardinality" : "multi"
         },
         {
            "type" : "string",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "indexed" : "true",
            "id" : "isa_partof_closure_label",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Involved in",
            "description" : "Closure of labels over isa and partof."
         },
         {
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "display_name" : "Inferred annotation",
            "id" : "regulates_closure",
            "indexed" : "true",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "type" : "string"
         },
         {
            "display_name" : "Inferred annotation",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "id" : "regulates_closure_label",
            "indexed" : "true"
         },
         {
            "cardinality" : "single",
            "required" : "false",
            "description" : "Database source.",
            "display_name" : "Source",
            "indexed" : "true",
            "id" : "source",
            "type" : "string",
            "searchable" : "false",
            "transform" : [],
            "property" : []
         },
         {
            "indexed" : "true",
            "id" : "annotation_class_list",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Direct annotations.",
            "display_name" : "Direct annotation"
         },
         {
            "indexed" : "true",
            "id" : "annotation_class_list_label",
            "type" : "string",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Direct annotations.",
            "display_name" : "Direct annotation"
         },
         {
            "required" : "false",
            "cardinality" : "multi",
            "display_name" : "Synonyms",
            "description" : "Gene product synonyms.",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "id" : "synonym",
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "id" : "panther_family",
            "type" : "string",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity.",
            "display_name" : "PANTHER family",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "display_name" : "PANTHER family",
            "description" : "PANTHER families that are associated with this entity.",
            "required" : "false",
            "cardinality" : "single",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "id" : "panther_family_label",
            "indexed" : "true"
         },
         {
            "description" : "JSON blob form of the phylogenic tree.",
            "display_name" : "This should not be displayed",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "false",
            "id" : "phylo_graph_json",
            "type" : "string",
            "searchable" : "false",
            "property" : [],
            "transform" : []
         },
         {
            "type" : "string",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "id" : "database_xref",
            "display_name" : "DB xref",
            "description" : "Database cross-reference.",
            "cardinality" : "multi",
            "required" : "false"
         }
      ],
      "filter_weights" : "source^7.0 type^6.0 panther_family_label^5.0 annotation_class_list_label^3.5 taxon_closure_label^4.0 regulates_closure_label^2.0",
      "id" : "bioentity",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/bio-config.yaml",
      "weight" : "30",
      "fields_hash" : {
         "isa_partof_closure" : {
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "id" : "isa_partof_closure",
            "indexed" : "true",
            "display_name" : "Involved in",
            "description" : "Closure of ids/accs over isa and partof.",
            "required" : "false",
            "cardinality" : "multi"
         },
         "taxon" : {
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Taxon",
            "description" : "Taxonomic group",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "id" : "taxon"
         },
         "bioentity_label" : {
            "required" : "false",
            "cardinality" : "single",
            "description" : "Symbol or name.",
            "display_name" : "Label",
            "id" : "bioentity_label",
            "indexed" : "true",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "type" : "string"
         },
         "synonym" : {
            "required" : "false",
            "cardinality" : "multi",
            "display_name" : "Synonyms",
            "description" : "Gene product synonyms.",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "id" : "synonym",
            "indexed" : "true"
         },
         "bioentity" : {
            "id" : "bioentity",
            "indexed" : "true",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "description" : "Gene or gene product ID.",
            "display_name" : "Acc",
            "required" : "false",
            "cardinality" : "single"
         },
         "id" : {
            "required" : "false",
            "cardinality" : "single",
            "description" : "Gene of gene product ID.",
            "display_name" : "Acc",
            "id" : "id",
            "indexed" : "true",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "type" : "string"
         },
         "taxon_closure" : {
            "type" : "string",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "id" : "taxon_closure",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Taxon",
            "description" : "Taxonomic group and ancestral groups."
         },
         "bioentity_internal_id" : {
            "id" : "bioentity_internal_id",
            "indexed" : "false",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "description" : "The bioentity ID used at the database of origin.",
            "display_name" : "This should not be displayed",
            "required" : "false",
            "cardinality" : "single"
         },
         "panther_family" : {
            "indexed" : "true",
            "id" : "panther_family",
            "type" : "string",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity.",
            "display_name" : "PANTHER family",
            "cardinality" : "single",
            "required" : "false"
         },
         "taxon_closure_label" : {
            "type" : "string",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "indexed" : "true",
            "id" : "taxon_closure_label",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Taxon",
            "description" : "Taxonomic group and ancestral groups."
         },
         "type" : {
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "type",
            "display_name" : "Type",
            "description" : "Type class.",
            "cardinality" : "single",
            "required" : "false"
         },
         "regulates_closure_label" : {
            "display_name" : "Inferred annotation",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "id" : "regulates_closure_label",
            "indexed" : "true"
         },
         "database_xref" : {
            "type" : "string",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "id" : "database_xref",
            "display_name" : "DB xref",
            "description" : "Database cross-reference.",
            "cardinality" : "multi",
            "required" : "false"
         },
         "source" : {
            "cardinality" : "single",
            "required" : "false",
            "description" : "Database source.",
            "display_name" : "Source",
            "indexed" : "true",
            "id" : "source",
            "type" : "string",
            "searchable" : "false",
            "transform" : [],
            "property" : []
         },
         "taxon_label" : {
            "indexed" : "true",
            "id" : "taxon_label",
            "type" : "string",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "cardinality" : "single",
            "required" : "false",
            "description" : "Taxonomic group",
            "display_name" : "Taxon"
         },
         "panther_family_label" : {
            "display_name" : "PANTHER family",
            "description" : "PANTHER families that are associated with this entity.",
            "required" : "false",
            "cardinality" : "single",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "id" : "panther_family_label",
            "indexed" : "true"
         },
         "bioentity_name" : {
            "required" : "false",
            "cardinality" : "single",
            "description" : "The full name of the gene product.",
            "display_name" : "Name",
            "id" : "bioentity_name",
            "indexed" : "true",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "type" : "string"
         },
         "annotation_class_list_label" : {
            "indexed" : "true",
            "id" : "annotation_class_list_label",
            "type" : "string",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Direct annotations.",
            "display_name" : "Direct annotation"
         },
         "annotation_class_list" : {
            "indexed" : "true",
            "id" : "annotation_class_list",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Direct annotations.",
            "display_name" : "Direct annotation"
         },
         "regulates_closure" : {
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "display_name" : "Inferred annotation",
            "id" : "regulates_closure",
            "indexed" : "true",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "type" : "string"
         },
         "phylo_graph_json" : {
            "description" : "JSON blob form of the phylogenic tree.",
            "display_name" : "This should not be displayed",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "false",
            "id" : "phylo_graph_json",
            "type" : "string",
            "searchable" : "false",
            "property" : [],
            "transform" : []
         },
         "isa_partof_closure_label" : {
            "type" : "string",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "indexed" : "true",
            "id" : "isa_partof_closure_label",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Involved in",
            "description" : "Closure of labels over isa and partof."
         }
      }
   },
   "bbop_ann_ev_agg" : {
      "document_category" : "annotation_evidence_aggregate",
      "schema_generating" : "true",
      "fields" : [
         {
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "type" : "string",
            "id" : "id",
            "indexed" : "true",
            "display_name" : "Acc",
            "description" : "Gene/product ID.",
            "required" : "false",
            "cardinality" : "single"
         },
         {
            "id" : "bioentity",
            "indexed" : "true",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "description" : "Column 1 + columns 2.",
            "display_name" : "Gene/product ID"
         },
         {
            "display_name" : "Gene/product label",
            "description" : "Column 3.",
            "required" : "false",
            "cardinality" : "single",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "type" : "string",
            "id" : "bioentity_label",
            "indexed" : "true"
         },
         {
            "display_name" : "Annotation class",
            "description" : "Column 5.",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "id" : "annotation_class"
         },
         {
            "display_name" : "Annotation class label",
            "description" : "Column 5 + ontology.",
            "required" : "false",
            "cardinality" : "single",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "id" : "annotation_class_label",
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "id" : "evidence_type_closure",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "description" : "All evidence for this term/gene product pair",
            "display_name" : "Evidence type"
         },
         {
            "display_name" : "Evidence with",
            "description" : "All column 8s for this term/gene product pair",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "evidence_with"
         },
         {
            "id" : "taxon",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "description" : "Column 13: taxon.",
            "display_name" : "Taxon"
         },
         {
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "id" : "taxon_label",
            "indexed" : "true",
            "display_name" : "Taxon",
            "description" : "Derived from C13 + ncbi_taxonomy.obo.",
            "required" : "false",
            "cardinality" : "single"
         },
         {
            "indexed" : "true",
            "id" : "taxon_closure",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "description" : "IDs derived from C13 + ncbi_taxonomy.obo.",
            "display_name" : "Taxon (IDs)",
            "cardinality" : "multi",
            "required" : "false"
         },
         {
            "display_name" : "Taxon",
            "description" : "Labels derived from C13 + ncbi_taxonomy.obo.",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "type" : "string",
            "id" : "taxon_closure_label",
            "indexed" : "true"
         },
         {
            "type" : "string",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "id" : "panther_family",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Protein family",
            "description" : "Family IDs that are associated with this entity."
         },
         {
            "type" : "string",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "id" : "panther_family_label",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Family",
            "description" : "Families that are associated with this entity."
         }
      ],
      "id" : "bbop_ann_ev_agg",
      "filter_weights" : "evidence_type_closure^4.0 evidence_with^3.0 taxon_closure_label^2.0",
      "weight" : "-10",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann_ev_agg-config.yaml",
      "fields_hash" : {
         "evidence_with" : {
            "display_name" : "Evidence with",
            "description" : "All column 8s for this term/gene product pair",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "evidence_with"
         },
         "panther_family" : {
            "type" : "string",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "id" : "panther_family",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Protein family",
            "description" : "Family IDs that are associated with this entity."
         },
         "evidence_type_closure" : {
            "indexed" : "true",
            "id" : "evidence_type_closure",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "multi",
            "required" : "false",
            "description" : "All evidence for this term/gene product pair",
            "display_name" : "Evidence type"
         },
         "taxon_closure" : {
            "indexed" : "true",
            "id" : "taxon_closure",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "description" : "IDs derived from C13 + ncbi_taxonomy.obo.",
            "display_name" : "Taxon (IDs)",
            "cardinality" : "multi",
            "required" : "false"
         },
         "id" : {
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "type" : "string",
            "id" : "id",
            "indexed" : "true",
            "display_name" : "Acc",
            "description" : "Gene/product ID.",
            "required" : "false",
            "cardinality" : "single"
         },
         "taxon_closure_label" : {
            "display_name" : "Taxon",
            "description" : "Labels derived from C13 + ncbi_taxonomy.obo.",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "type" : "string",
            "id" : "taxon_closure_label",
            "indexed" : "true"
         },
         "annotation_class_label" : {
            "display_name" : "Annotation class label",
            "description" : "Column 5 + ontology.",
            "required" : "false",
            "cardinality" : "single",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "id" : "annotation_class_label",
            "indexed" : "true"
         },
         "bioentity" : {
            "id" : "bioentity",
            "indexed" : "true",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "description" : "Column 1 + columns 2.",
            "display_name" : "Gene/product ID"
         },
         "bioentity_label" : {
            "display_name" : "Gene/product label",
            "description" : "Column 3.",
            "required" : "false",
            "cardinality" : "single",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "type" : "string",
            "id" : "bioentity_label",
            "indexed" : "true"
         },
         "panther_family_label" : {
            "type" : "string",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "id" : "panther_family_label",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Family",
            "description" : "Families that are associated with this entity."
         },
         "taxon_label" : {
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "id" : "taxon_label",
            "indexed" : "true",
            "display_name" : "Taxon",
            "description" : "Derived from C13 + ncbi_taxonomy.obo.",
            "required" : "false",
            "cardinality" : "single"
         },
         "taxon" : {
            "id" : "taxon",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "description" : "Column 13: taxon.",
            "display_name" : "Taxon"
         },
         "annotation_class" : {
            "display_name" : "Annotation class",
            "description" : "Column 5.",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "id" : "annotation_class"
         }
      },
      "display_name" : "Advanced",
      "description" : "A description of annotation evidence aggregate for GOlr and AmiGO.",
      "_strict" : 0,
      "searchable_extension" : "_searchable",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann_ev_agg-config.yaml",
      "result_weights" : "bioentity^4.0 annotation_class^3.0 taxon^2.0",
      "boost_weights" : "annotation_class^2.0 annotation_class_label^1.0 bioentity^2.0 bioentity_label^1.0 panther_family^1.0 panther_family_label^1.0 taxon_closure_label^1.0"
   },
   "family" : {
      "description" : "Information about protein (PANTHER) families.",
      "_strict" : 0,
      "searchable_extension" : "_searchable",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/protein-family-config.yaml",
      "display_name" : "Protein families",
      "result_weights" : "panther_family^5.0 bioentity_list^4.0",
      "boost_weights" : "panther_family^2.0 panther_family_label^2.0 bioentity_list^1.0 bioentity_list_label^1.0",
      "filter_weights" : "bioentity_list_label^1.0",
      "id" : "family",
      "fields" : [
         {
            "required" : "false",
            "cardinality" : "single",
            "description" : "Family ID.",
            "display_name" : "Acc",
            "id" : "id",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "type" : "string"
         },
         {
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "indexed" : "true",
            "id" : "panther_family",
            "display_name" : "PANTHER family",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "type" : "string",
            "id" : "panther_family_label",
            "indexed" : "true",
            "display_name" : "PANTHER family",
            "description" : "PANTHER families that are associated with this entity.",
            "required" : "false",
            "cardinality" : "single"
         },
         {
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "indexed" : "false",
            "id" : "phylo_graph_json",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "This should not be displayed",
            "description" : "JSON blob form of the phylogenic tree."
         },
         {
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Gene/products",
            "description" : "Gene/products annotated with this protein family.",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "id" : "bioentity_list"
         },
         {
            "id" : "bioentity_list_label",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Gene/products annotated with this protein family.",
            "display_name" : "Gene/products"
         }
      ],
      "schema_generating" : "true",
      "document_category" : "family",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/protein-family-config.yaml",
      "weight" : "5",
      "fields_hash" : {
         "id" : {
            "required" : "false",
            "cardinality" : "single",
            "description" : "Family ID.",
            "display_name" : "Acc",
            "id" : "id",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "type" : "string"
         },
         "panther_family" : {
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "indexed" : "true",
            "id" : "panther_family",
            "display_name" : "PANTHER family",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "cardinality" : "single",
            "required" : "false"
         },
         "panther_family_label" : {
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "type" : "string",
            "id" : "panther_family_label",
            "indexed" : "true",
            "display_name" : "PANTHER family",
            "description" : "PANTHER families that are associated with this entity.",
            "required" : "false",
            "cardinality" : "single"
         },
         "bioentity_list" : {
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Gene/products",
            "description" : "Gene/products annotated with this protein family.",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "id" : "bioentity_list"
         },
         "bioentity_list_label" : {
            "id" : "bioentity_list_label",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Gene/products annotated with this protein family.",
            "display_name" : "Gene/products"
         },
         "phylo_graph_json" : {
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "indexed" : "false",
            "id" : "phylo_graph_json",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "This should not be displayed",
            "description" : "JSON blob form of the phylogenic tree."
         }
      }
   },
   "annotation" : {
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann-config.yaml",
      "weight" : "20",
      "fields_hash" : {
         "annotation_class_label" : {
            "indexed" : "true",
            "id" : "annotation_class_label",
            "type" : "string",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "description" : "Direct annotations.",
            "display_name" : "Direct annotation",
            "cardinality" : "single",
            "required" : "false"
         },
         "is_redundant_for" : {
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "type" : "string",
            "id" : "is_redundant_for",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Redundant for",
            "description" : "Rational for redundancy of annotation."
         },
         "synonym" : {
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "id" : "synonym",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "display_name" : "Synonym",
            "description" : "Gene or gene product synonyms."
         },
         "reference" : {
            "id" : "reference",
            "indexed" : "true",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Database reference.",
            "display_name" : "Reference"
         },
         "bioentity" : {
            "id" : "bioentity",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "description" : "Gene or gene product identifiers.",
            "display_name" : "Gene/product"
         },
         "annotation_extension_class_closure_label" : {
            "description" : "Extension class for the annotation.",
            "display_name" : "Annotation extension",
            "required" : "false",
            "cardinality" : "multi",
            "id" : "annotation_extension_class_closure_label",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "type" : "string"
         },
         "taxon_closure" : {
            "display_name" : "Taxon",
            "description" : "Taxonomic group and ancestral groups.",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "id" : "taxon_closure"
         },
         "bioentity_internal_id" : {
            "display_name" : "This should not be displayed",
            "description" : "The bioentity ID used at the database of origin.",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "id" : "bioentity_internal_id",
            "indexed" : "false"
         },
         "taxon_closure_label" : {
            "display_name" : "Taxon",
            "description" : "Taxonomic group and ancestral groups.",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "indexed" : "true",
            "id" : "taxon_closure_label"
         },
         "taxon" : {
            "display_name" : "Taxon",
            "description" : "Taxonomic group.",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "id" : "taxon",
            "indexed" : "true"
         },
         "secondary_taxon_closure" : {
            "id" : "secondary_taxon_closure",
            "indexed" : "true",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Secondary taxon closure.",
            "display_name" : "Secondary taxon"
         },
         "annotation_class" : {
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "annotation_class",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Direct annotation",
            "description" : "Direct annotations."
         },
         "bioentity_isoform" : {
            "indexed" : "true",
            "id" : "bioentity_isoform",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "description" : "Biological isoform.",
            "display_name" : "Isoform",
            "cardinality" : "single",
            "required" : "false"
         },
         "regulates_closure" : {
            "description" : "Annotations for this term or its children (over regulates).",
            "display_name" : "Inferred annotation",
            "cardinality" : "multi",
            "required" : "false",
            "indexed" : "true",
            "id" : "regulates_closure",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : []
         },
         "annotation_extension_class" : {
            "id" : "annotation_extension_class",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "description" : "Extension class for the annotation.",
            "display_name" : "Annotation extension",
            "required" : "false",
            "cardinality" : "multi"
         },
         "has_participant_closure" : {
            "description" : "Closure of ids/accs over has_participant.",
            "display_name" : "Has participant (IDs)",
            "required" : "false",
            "cardinality" : "multi",
            "id" : "has_participant_closure",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "type" : "string"
         },
         "has_participant_closure_label" : {
            "indexed" : "true",
            "id" : "has_participant_closure_label",
            "type" : "string",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "description" : "Closure of labels over has_participant.",
            "display_name" : "Has participant",
            "cardinality" : "multi",
            "required" : "false"
         },
         "isa_partof_closure_label" : {
            "id" : "isa_partof_closure_label",
            "indexed" : "true",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "display_name" : "Involved in"
         },
         "qualifier" : {
            "type" : "string",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "id" : "qualifier",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Qualifier",
            "description" : "Annotation qualifier."
         },
         "annotation_extension_class_label" : {
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Annotation extension",
            "description" : "Extension class for the annotation.",
            "type" : "string",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "id" : "annotation_extension_class_label"
         },
         "panther_family_label" : {
            "type" : "string",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "indexed" : "true",
            "id" : "panther_family_label",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "PANTHER family",
            "description" : "PANTHER families that are associated with this entity."
         },
         "taxon_label" : {
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "indexed" : "true",
            "id" : "taxon_label",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Taxon",
            "description" : "Taxonomic group and ancestral groups."
         },
         "evidence_type" : {
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Evidence",
            "description" : "Evidence type.",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "type" : "string",
            "id" : "evidence_type",
            "indexed" : "true"
         },
         "panther_family" : {
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "indexed" : "true",
            "id" : "panther_family",
            "display_name" : "PANTHER family",
            "description" : "PANTHER families that are associated with this entity.",
            "cardinality" : "single",
            "required" : "false"
         },
         "evidence_with" : {
            "display_name" : "Evidence with",
            "description" : "Evidence with/from.",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "id" : "evidence_with",
            "indexed" : "true"
         },
         "evidence_type_closure" : {
            "display_name" : "Evidence type",
            "description" : "All evidence (evidence closure) for this annotation",
            "required" : "false",
            "cardinality" : "multi",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "id" : "evidence_type_closure",
            "indexed" : "true"
         },
         "id" : {
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Acc",
            "description" : "A unique (and internal) combination of bioentity and ontology class.",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "id" : "id",
            "indexed" : "true"
         },
         "type" : {
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "id" : "type",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Type class id",
            "description" : "Type class."
         },
         "isa_partof_closure" : {
            "id" : "isa_partof_closure",
            "indexed" : "true",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "display_name" : "Involved in",
            "required" : "false",
            "cardinality" : "multi"
         },
         "secondary_taxon" : {
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Secondary taxon",
            "description" : "Secondary taxon.",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "id" : "secondary_taxon"
         },
         "date" : {
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "id" : "date",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Date",
            "description" : "Date of assignment."
         },
         "bioentity_label" : {
            "display_name" : "Gene/product",
            "description" : "Gene or gene product identifiers.",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "indexed" : "true",
            "id" : "bioentity_label"
         },
         "annotation_extension_json" : {
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Extension class for the annotation (JSON).",
            "display_name" : "Annotation extension",
            "indexed" : "true",
            "id" : "annotation_extension_json",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         "assigned_by" : {
            "description" : "Annotations assigned by group.",
            "display_name" : "Assigned by",
            "required" : "false",
            "cardinality" : "single",
            "id" : "assigned_by",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "type" : "string"
         },
         "aspect" : {
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Ontology (aspect)",
            "description" : "Ontology aspect.",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "aspect"
         },
         "annotation_extension_class_closure" : {
            "display_name" : "Annotation extension",
            "description" : "Extension class for the annotation.",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "id" : "annotation_extension_class_closure"
         },
         "regulates_closure_label" : {
            "required" : "false",
            "cardinality" : "multi",
            "display_name" : "Inferred annotation",
            "description" : "Annotations for this term or its children (over regulates).",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "id" : "regulates_closure_label",
            "indexed" : "true"
         },
         "secondary_taxon_closure_label" : {
            "required" : "false",
            "cardinality" : "multi",
            "display_name" : "Secondary taxon",
            "description" : "Secondary taxon closure.",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "id" : "secondary_taxon_closure_label",
            "indexed" : "true"
         },
         "source" : {
            "description" : "Database source.",
            "display_name" : "Source",
            "required" : "false",
            "cardinality" : "single",
            "id" : "source",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string"
         },
         "secondary_taxon_label" : {
            "required" : "false",
            "cardinality" : "single",
            "description" : "Secondary taxon.",
            "display_name" : "Secondary taxon",
            "id" : "secondary_taxon_label",
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "type" : "string"
         },
         "bioentity_name" : {
            "required" : "false",
            "cardinality" : "single",
            "description" : "The full name of the gene or gene product.",
            "display_name" : "Gene/product name",
            "id" : "bioentity_name",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string"
         }
      },
      "filter_weights" : "source^7.0 assigned_by^6.5 aspect^6.25 evidence_type_closure^6.0 panther_family_label^5.5 qualifier^5.25 taxon_closure_label^5.0 annotation_class_label^4.5 regulates_closure_label^3.0 annotation_extension_class_closure_label^2.0",
      "id" : "annotation",
      "schema_generating" : "true",
      "fields" : [
         {
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Acc",
            "description" : "A unique (and internal) combination of bioentity and ontology class.",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "id" : "id",
            "indexed" : "true"
         },
         {
            "description" : "Database source.",
            "display_name" : "Source",
            "required" : "false",
            "cardinality" : "single",
            "id" : "source",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string"
         },
         {
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "id" : "type",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Type class id",
            "description" : "Type class."
         },
         {
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "id" : "date",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Date",
            "description" : "Date of assignment."
         },
         {
            "description" : "Annotations assigned by group.",
            "display_name" : "Assigned by",
            "required" : "false",
            "cardinality" : "single",
            "id" : "assigned_by",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "type" : "string"
         },
         {
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "type" : "string",
            "id" : "is_redundant_for",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Redundant for",
            "description" : "Rational for redundancy of annotation."
         },
         {
            "display_name" : "Taxon",
            "description" : "Taxonomic group.",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "id" : "taxon",
            "indexed" : "true"
         },
         {
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "indexed" : "true",
            "id" : "taxon_label",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Taxon",
            "description" : "Taxonomic group and ancestral groups."
         },
         {
            "display_name" : "Taxon",
            "description" : "Taxonomic group and ancestral groups.",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "id" : "taxon_closure"
         },
         {
            "display_name" : "Taxon",
            "description" : "Taxonomic group and ancestral groups.",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "indexed" : "true",
            "id" : "taxon_closure_label"
         },
         {
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Secondary taxon",
            "description" : "Secondary taxon.",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "id" : "secondary_taxon"
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "description" : "Secondary taxon.",
            "display_name" : "Secondary taxon",
            "id" : "secondary_taxon_label",
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "type" : "string"
         },
         {
            "id" : "secondary_taxon_closure",
            "indexed" : "true",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Secondary taxon closure.",
            "display_name" : "Secondary taxon"
         },
         {
            "required" : "false",
            "cardinality" : "multi",
            "display_name" : "Secondary taxon",
            "description" : "Secondary taxon closure.",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "id" : "secondary_taxon_closure_label",
            "indexed" : "true"
         },
         {
            "id" : "isa_partof_closure",
            "indexed" : "true",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "display_name" : "Involved in",
            "required" : "false",
            "cardinality" : "multi"
         },
         {
            "id" : "isa_partof_closure_label",
            "indexed" : "true",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "display_name" : "Involved in"
         },
         {
            "description" : "Annotations for this term or its children (over regulates).",
            "display_name" : "Inferred annotation",
            "cardinality" : "multi",
            "required" : "false",
            "indexed" : "true",
            "id" : "regulates_closure",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : []
         },
         {
            "required" : "false",
            "cardinality" : "multi",
            "display_name" : "Inferred annotation",
            "description" : "Annotations for this term or its children (over regulates).",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "id" : "regulates_closure_label",
            "indexed" : "true"
         },
         {
            "description" : "Closure of ids/accs over has_participant.",
            "display_name" : "Has participant (IDs)",
            "required" : "false",
            "cardinality" : "multi",
            "id" : "has_participant_closure",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "id" : "has_participant_closure_label",
            "type" : "string",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "description" : "Closure of labels over has_participant.",
            "display_name" : "Has participant",
            "cardinality" : "multi",
            "required" : "false"
         },
         {
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "id" : "synonym",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "display_name" : "Synonym",
            "description" : "Gene or gene product synonyms."
         },
         {
            "id" : "bioentity",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "description" : "Gene or gene product identifiers.",
            "display_name" : "Gene/product"
         },
         {
            "display_name" : "Gene/product",
            "description" : "Gene or gene product identifiers.",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "indexed" : "true",
            "id" : "bioentity_label"
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "description" : "The full name of the gene or gene product.",
            "display_name" : "Gene/product name",
            "id" : "bioentity_name",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string"
         },
         {
            "display_name" : "This should not be displayed",
            "description" : "The bioentity ID used at the database of origin.",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "id" : "bioentity_internal_id",
            "indexed" : "false"
         },
         {
            "type" : "string",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "id" : "qualifier",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Qualifier",
            "description" : "Annotation qualifier."
         },
         {
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "annotation_class",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Direct annotation",
            "description" : "Direct annotations."
         },
         {
            "indexed" : "true",
            "id" : "annotation_class_label",
            "type" : "string",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "description" : "Direct annotations.",
            "display_name" : "Direct annotation",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Ontology (aspect)",
            "description" : "Ontology aspect.",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "aspect"
         },
         {
            "indexed" : "true",
            "id" : "bioentity_isoform",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "description" : "Biological isoform.",
            "display_name" : "Isoform",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Evidence",
            "description" : "Evidence type.",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "type" : "string",
            "id" : "evidence_type",
            "indexed" : "true"
         },
         {
            "display_name" : "Evidence type",
            "description" : "All evidence (evidence closure) for this annotation",
            "required" : "false",
            "cardinality" : "multi",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "id" : "evidence_type_closure",
            "indexed" : "true"
         },
         {
            "display_name" : "Evidence with",
            "description" : "Evidence with/from.",
            "required" : "false",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "id" : "evidence_with",
            "indexed" : "true"
         },
         {
            "id" : "reference",
            "indexed" : "true",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Database reference.",
            "display_name" : "Reference"
         },
         {
            "id" : "annotation_extension_class",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "description" : "Extension class for the annotation.",
            "display_name" : "Annotation extension",
            "required" : "false",
            "cardinality" : "multi"
         },
         {
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Annotation extension",
            "description" : "Extension class for the annotation.",
            "type" : "string",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "id" : "annotation_extension_class_label"
         },
         {
            "display_name" : "Annotation extension",
            "description" : "Extension class for the annotation.",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "id" : "annotation_extension_class_closure"
         },
         {
            "description" : "Extension class for the annotation.",
            "display_name" : "Annotation extension",
            "required" : "false",
            "cardinality" : "multi",
            "id" : "annotation_extension_class_closure_label",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "type" : "string"
         },
         {
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Extension class for the annotation (JSON).",
            "display_name" : "Annotation extension",
            "indexed" : "true",
            "id" : "annotation_extension_json",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         {
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "indexed" : "true",
            "id" : "panther_family",
            "display_name" : "PANTHER family",
            "description" : "PANTHER families that are associated with this entity.",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "type" : "string",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "indexed" : "true",
            "id" : "panther_family_label",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "PANTHER family",
            "description" : "PANTHER families that are associated with this entity."
         }
      ],
      "document_category" : "annotation",
      "result_weights" : "bioentity^7.0 bioentity_name^6.0 qualifier^5.0 annotation_class^4.7 annotation_extension_json^4.5 assigned_by^4.0 taxon^3.0 evidence_type^2.5 evidence_with^2.0 panther_family^1.5 bioentity_isoform^0.5 reference^0.25 date^0.10",
      "boost_weights" : "annotation_class^2.0 annotation_class_label^1.0 bioentity^2.0 bioentity_label^1.0 bioentity_name^1.0 annotation_extension_class^2.0 annotation_extension_class_label^1.0 reference^1.0 panther_family^1.0 panther_family_label^1.0 bioentity_isoform^1.0 regulates_closure^1.0 regulates_closure_label^1.0",
      "searchable_extension" : "_searchable",
      "description" : "Associations between GO terms and genes or gene products.",
      "_strict" : 0,
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann-config.yaml",
      "display_name" : "Annotations"
   },
   "ontology" : {
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/ont-config.yaml",
      "description" : "Gene Ontology Term, Synonym, or Definition.",
      "_strict" : 0,
      "searchable_extension" : "_searchable",
      "display_name" : "Ontology",
      "boost_weights" : "annotation_class^3.0 annotation_class_label^5.5 description^1.0 comment^0.5 synonym^1.0 alternate_id^1.0 regulates_closure^1.0 regulates_closure_label^1.0",
      "result_weights" : "annotation_class^8.0 description^6.0 source^4.0 synonym^3.0 alternate_id^2.0",
      "filter_weights" : "source^4.0 subset^3.0 regulates_closure_label^1.0 is_obsolete^0.0",
      "id" : "ontology",
      "schema_generating" : "true",
      "fields" : [
         {
            "display_name" : "Acc",
            "description" : "Term identifier.",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "property" : [
               "getIdentifier"
            ],
            "transform" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "id"
         },
         {
            "searchable" : "false",
            "transform" : [],
            "property" : [
               "getIdentifier"
            ],
            "type" : "string",
            "id" : "annotation_class",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Term",
            "description" : "Term identifier."
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Term",
            "description" : "Identifier.",
            "property" : [
               "getLabel"
            ],
            "transform" : [],
            "searchable" : "true",
            "type" : "string",
            "id" : "annotation_class_label",
            "indexed" : "true"
         },
         {
            "searchable" : "true",
            "property" : [
               "getDef"
            ],
            "transform" : [],
            "type" : "string",
            "id" : "description",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Definition",
            "description" : "Term definition."
         },
         {
            "indexed" : "true",
            "id" : "source",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "property" : [
               "getNamespace"
            ],
            "cardinality" : "single",
            "required" : "false",
            "description" : "Term namespace.",
            "display_name" : "Ontology source"
         },
         {
            "display_name" : "Obsoletion",
            "description" : "Is the term obsolete?",
            "cardinality" : "single",
            "required" : "false",
            "type" : "boolean",
            "property" : [
               "getIsObsoleteBinaryString"
            ],
            "transform" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "is_obsolete"
         },
         {
            "indexed" : "true",
            "id" : "comment",
            "type" : "string",
            "property" : [
               "getComment"
            ],
            "transform" : [],
            "searchable" : "true",
            "description" : "Term comment.",
            "display_name" : "Comment",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "type" : "string",
            "property" : [
               "getOBOSynonymStrings"
            ],
            "searchable" : "true",
            "transform" : [],
            "indexed" : "true",
            "id" : "synonym",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Synonyms",
            "description" : "Term synonyms."
         },
         {
            "id" : "alternate_id",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "property" : [
               "getAnnotationPropertyValues",
               "alt_id"
            ],
            "type" : "string",
            "description" : "Alternate term identifier.",
            "display_name" : "Alt ID",
            "required" : "false",
            "cardinality" : "multi"
         },
         {
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Term that replaces this term.",
            "display_name" : "Replaced By",
            "id" : "replaced_by",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "property" : [
               "getAnnotationPropertyValues",
               "replaced_by"
            ],
            "type" : "string"
         },
         {
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Others terms you might want to look at.",
            "display_name" : "Consider",
            "id" : "consider",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getAnnotationPropertyValues",
               "consider"
            ],
            "searchable" : "false",
            "type" : "string"
         },
         {
            "id" : "subset",
            "indexed" : "true",
            "property" : [
               "getSubsets"
            ],
            "transform" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Special use collections of terms.",
            "display_name" : "Subset"
         },
         {
            "indexed" : "true",
            "id" : "definition_xref",
            "type" : "string",
            "transform" : [],
            "property" : [
               "getDefXref"
            ],
            "searchable" : "false",
            "description" : "Definition cross-reference.",
            "display_name" : "Def xref",
            "cardinality" : "multi",
            "required" : "false"
         },
         {
            "id" : "database_xref",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "property" : [
               "getXref"
            ],
            "type" : "string",
            "description" : "Database cross-reference.",
            "display_name" : "DB xref",
            "required" : "false",
            "cardinality" : "multi"
         },
         {
            "id" : "isa_partof_closure",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050"
            ],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Ancestral terms (is_a/part_of).",
            "display_name" : "Is-a/part-of"
         },
         {
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050"
            ],
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "id" : "isa_partof_closure_label",
            "indexed" : "true",
            "display_name" : "Is-a/part-of",
            "description" : "Ancestral terms (is_a/part_of).",
            "required" : "false",
            "cardinality" : "multi"
         },
         {
            "searchable" : "false",
            "transform" : [],
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "type" : "string",
            "id" : "regulates_closure",
            "indexed" : "true",
            "display_name" : "Ancestor",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "required" : "false",
            "cardinality" : "multi"
         },
         {
            "required" : "false",
            "cardinality" : "multi",
            "display_name" : "Ancestor",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "id" : "regulates_closure_label",
            "indexed" : "true"
         },
         {
            "type" : "string",
            "property" : [
               "getSegmentShuntGraphJSON",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "false",
            "id" : "topology_graph_json",
            "display_name" : "Topology graph (JSON)",
            "description" : "JSON blob form of the local stepwise topology graph. Uses various relations (including regulates, occurs in, capable_of).",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "type" : "string",
            "property" : [
               "getLineageShuntGraphJSON",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "false",
            "id" : "regulates_transitivity_graph_json",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Regulates transitivity graph (JSON)",
            "description" : "JSON blob form of the local relation transitivity graph. Uses various relations (including regulates, occurs in, capable_of)."
         },
         {
            "type" : "string",
            "searchable" : "true",
            "property" : [
               "getIdentifier"
            ],
            "transform" : [],
            "indexed" : "true",
            "id" : "only_in_taxon",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Only in taxon",
            "description" : "Only in taxon."
         },
         {
            "description" : "Only in taxon label.",
            "display_name" : "Only in taxon",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "only_in_taxon_label",
            "type" : "string",
            "property" : [
               "getLabel"
            ],
            "transform" : [],
            "searchable" : "true"
         },
         {
            "searchable" : "false",
            "transform" : [],
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "type" : "string",
            "id" : "only_in_taxon_closure",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "display_name" : "Only in taxon (IDs)",
            "description" : "Only in taxon closure."
         },
         {
            "indexed" : "true",
            "id" : "only_in_taxon_closure_label",
            "type" : "string",
            "searchable" : "true",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "transform" : [],
            "description" : "Only in taxon label closure.",
            "display_name" : "Only in taxon",
            "cardinality" : "multi",
            "required" : "false"
         }
      ],
      "document_category" : "ontology_class",
      "fields_hash" : {
         "definition_xref" : {
            "indexed" : "true",
            "id" : "definition_xref",
            "type" : "string",
            "transform" : [],
            "property" : [
               "getDefXref"
            ],
            "searchable" : "false",
            "description" : "Definition cross-reference.",
            "display_name" : "Def xref",
            "cardinality" : "multi",
            "required" : "false"
         },
         "regulates_closure" : {
            "searchable" : "false",
            "transform" : [],
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "type" : "string",
            "id" : "regulates_closure",
            "indexed" : "true",
            "display_name" : "Ancestor",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "required" : "false",
            "cardinality" : "multi"
         },
         "only_in_taxon" : {
            "type" : "string",
            "searchable" : "true",
            "property" : [
               "getIdentifier"
            ],
            "transform" : [],
            "indexed" : "true",
            "id" : "only_in_taxon",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Only in taxon",
            "description" : "Only in taxon."
         },
         "replaced_by" : {
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Term that replaces this term.",
            "display_name" : "Replaced By",
            "id" : "replaced_by",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "property" : [
               "getAnnotationPropertyValues",
               "replaced_by"
            ],
            "type" : "string"
         },
         "only_in_taxon_label" : {
            "description" : "Only in taxon label.",
            "display_name" : "Only in taxon",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "only_in_taxon_label",
            "type" : "string",
            "property" : [
               "getLabel"
            ],
            "transform" : [],
            "searchable" : "true"
         },
         "isa_partof_closure_label" : {
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050"
            ],
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "id" : "isa_partof_closure_label",
            "indexed" : "true",
            "display_name" : "Is-a/part-of",
            "description" : "Ancestral terms (is_a/part_of).",
            "required" : "false",
            "cardinality" : "multi"
         },
         "alternate_id" : {
            "id" : "alternate_id",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "property" : [
               "getAnnotationPropertyValues",
               "alt_id"
            ],
            "type" : "string",
            "description" : "Alternate term identifier.",
            "display_name" : "Alt ID",
            "required" : "false",
            "cardinality" : "multi"
         },
         "regulates_closure_label" : {
            "required" : "false",
            "cardinality" : "multi",
            "display_name" : "Ancestor",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "id" : "regulates_closure_label",
            "indexed" : "true"
         },
         "only_in_taxon_closure_label" : {
            "indexed" : "true",
            "id" : "only_in_taxon_closure_label",
            "type" : "string",
            "searchable" : "true",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "transform" : [],
            "description" : "Only in taxon label closure.",
            "display_name" : "Only in taxon",
            "cardinality" : "multi",
            "required" : "false"
         },
         "database_xref" : {
            "id" : "database_xref",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "property" : [
               "getXref"
            ],
            "type" : "string",
            "description" : "Database cross-reference.",
            "display_name" : "DB xref",
            "required" : "false",
            "cardinality" : "multi"
         },
         "only_in_taxon_closure" : {
            "searchable" : "false",
            "transform" : [],
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "type" : "string",
            "id" : "only_in_taxon_closure",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "display_name" : "Only in taxon (IDs)",
            "description" : "Only in taxon closure."
         },
         "is_obsolete" : {
            "display_name" : "Obsoletion",
            "description" : "Is the term obsolete?",
            "cardinality" : "single",
            "required" : "false",
            "type" : "boolean",
            "property" : [
               "getIsObsoleteBinaryString"
            ],
            "transform" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "is_obsolete"
         },
         "topology_graph_json" : {
            "type" : "string",
            "property" : [
               "getSegmentShuntGraphJSON",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "false",
            "id" : "topology_graph_json",
            "display_name" : "Topology graph (JSON)",
            "description" : "JSON blob form of the local stepwise topology graph. Uses various relations (including regulates, occurs in, capable_of).",
            "cardinality" : "single",
            "required" : "false"
         },
         "comment" : {
            "indexed" : "true",
            "id" : "comment",
            "type" : "string",
            "property" : [
               "getComment"
            ],
            "transform" : [],
            "searchable" : "true",
            "description" : "Term comment.",
            "display_name" : "Comment",
            "cardinality" : "single",
            "required" : "false"
         },
         "subset" : {
            "id" : "subset",
            "indexed" : "true",
            "property" : [
               "getSubsets"
            ],
            "transform" : [],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Special use collections of terms.",
            "display_name" : "Subset"
         },
         "source" : {
            "indexed" : "true",
            "id" : "source",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "property" : [
               "getNamespace"
            ],
            "cardinality" : "single",
            "required" : "false",
            "description" : "Term namespace.",
            "display_name" : "Ontology source"
         },
         "consider" : {
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Others terms you might want to look at.",
            "display_name" : "Consider",
            "id" : "consider",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getAnnotationPropertyValues",
               "consider"
            ],
            "searchable" : "false",
            "type" : "string"
         },
         "synonym" : {
            "type" : "string",
            "property" : [
               "getOBOSynonymStrings"
            ],
            "searchable" : "true",
            "transform" : [],
            "indexed" : "true",
            "id" : "synonym",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Synonyms",
            "description" : "Term synonyms."
         },
         "annotation_class_label" : {
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Term",
            "description" : "Identifier.",
            "property" : [
               "getLabel"
            ],
            "transform" : [],
            "searchable" : "true",
            "type" : "string",
            "id" : "annotation_class_label",
            "indexed" : "true"
         },
         "id" : {
            "display_name" : "Acc",
            "description" : "Term identifier.",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "property" : [
               "getIdentifier"
            ],
            "transform" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "id"
         },
         "regulates_transitivity_graph_json" : {
            "type" : "string",
            "property" : [
               "getLineageShuntGraphJSON",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "false",
            "id" : "regulates_transitivity_graph_json",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Regulates transitivity graph (JSON)",
            "description" : "JSON blob form of the local relation transitivity graph. Uses various relations (including regulates, occurs in, capable_of)."
         },
         "isa_partof_closure" : {
            "id" : "isa_partof_closure",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050"
            ],
            "searchable" : "false",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Ancestral terms (is_a/part_of).",
            "display_name" : "Is-a/part-of"
         },
         "annotation_class" : {
            "searchable" : "false",
            "transform" : [],
            "property" : [
               "getIdentifier"
            ],
            "type" : "string",
            "id" : "annotation_class",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Term",
            "description" : "Term identifier."
         },
         "description" : {
            "searchable" : "true",
            "property" : [
               "getDef"
            ],
            "transform" : [],
            "type" : "string",
            "id" : "description",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Definition",
            "description" : "Term definition."
         }
      },
      "weight" : "40",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/ont-config.yaml"
   },
   "complex_annotation" : {
      "boost_weights" : "annotation_group_label^1.0 annotation_unit_label^1.0 enabled_by^1.0 enabled_by_label^1.0 location_list_closure^1.0 location_list_closure_label^1.0 process_class_closure_label^1.0 function_class_closure_label^1.0",
      "result_weights" : "function_class^5.0 enabled_by^4.0 location_list^3.0 process_class^2.0 annotation_group^1.0",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/complex-ann-config.yaml",
      "description" : "An individual unit within LEGO. This is <strong>ALPHA</strong> software.",
      "searchable_extension" : "_searchable",
      "_strict" : 0,
      "display_name" : "Complex annotations (ALPHA)",
      "fields_hash" : {
         "annotation_group_url" : {
            "description" : "???.",
            "display_name" : "Annotation group URL",
            "required" : "false",
            "cardinality" : "single",
            "id" : "annotation_group_url",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "type" : "string"
         },
         "function_class_label" : {
            "cardinality" : "single",
            "required" : "false",
            "description" : "Common function name.",
            "display_name" : "Function",
            "indexed" : "true",
            "id" : "function_class_label",
            "type" : "string",
            "searchable" : "true",
            "transform" : [],
            "property" : []
         },
         "panther_family" : {
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "PANTHER family",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "type" : "string",
            "id" : "panther_family",
            "indexed" : "true"
         },
         "id" : {
            "display_name" : "ID",
            "description" : "A unique (and internal) thing.",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "id"
         },
         "taxon_closure" : {
            "required" : "false",
            "cardinality" : "multi",
            "display_name" : "Taxon (IDs)",
            "description" : "Taxon IDs derived from GAF column 13 and ncbi_taxonomy.obo.",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "id" : "taxon_closure",
            "indexed" : "true"
         },
         "enabled_by" : {
            "display_name" : "Enabled by",
            "description" : "???",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "id" : "enabled_by",
            "indexed" : "true"
         },
         "taxon_closure_label" : {
            "indexed" : "true",
            "id" : "taxon_closure_label",
            "type" : "string",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "description" : "Taxon label closure derived from GAF column 13 and ncbi_taxonomy.obo.",
            "display_name" : "Taxon",
            "cardinality" : "multi",
            "required" : "false"
         },
         "taxon" : {
            "description" : "GAF column 13 (taxon).",
            "display_name" : "Taxon",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "taxon",
            "type" : "string",
            "searchable" : "false",
            "transform" : [],
            "property" : []
         },
         "process_class" : {
            "required" : "false",
            "cardinality" : "single",
            "description" : "Process acc/ID.",
            "display_name" : "Process",
            "id" : "process_class",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string"
         },
         "location_list_label" : {
            "description" : "",
            "display_name" : "Location",
            "cardinality" : "multi",
            "required" : "false",
            "indexed" : "true",
            "id" : "location_list_label",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false"
         },
         "location_list_closure" : {
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Location",
            "description" : "",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "id" : "location_list_closure"
         },
         "process_class_label" : {
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "id" : "process_class_label",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Process",
            "description" : "Common process name."
         },
         "annotation_unit_label" : {
            "description" : "???.",
            "display_name" : "Annotation unit",
            "required" : "false",
            "cardinality" : "single",
            "id" : "annotation_unit_label",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "type" : "string"
         },
         "annotation_group_label" : {
            "id" : "annotation_group_label",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "description" : "???.",
            "display_name" : "Annotation group"
         },
         "owl_blob_json" : {
            "display_name" : "???",
            "description" : "???",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "false",
            "id" : "owl_blob_json"
         },
         "location_list" : {
            "indexed" : "true",
            "id" : "location_list",
            "type" : "string",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "description" : "",
            "display_name" : "Location",
            "cardinality" : "multi",
            "required" : "false"
         },
         "annotation_unit" : {
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "annotation_unit",
            "display_name" : "Annotation unit",
            "description" : "???.",
            "cardinality" : "single",
            "required" : "false"
         },
         "function_class_closure" : {
            "required" : "false",
            "cardinality" : "multi",
            "description" : "???",
            "display_name" : "Function",
            "id" : "function_class_closure",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "type" : "string"
         },
         "annotation_group" : {
            "display_name" : "Annotation group",
            "description" : "???.",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "id" : "annotation_group",
            "indexed" : "true"
         },
         "location_list_closure_label" : {
            "indexed" : "true",
            "id" : "location_list_closure_label",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "",
            "display_name" : "Location"
         },
         "enabled_by_label" : {
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "id" : "enabled_by_label",
            "indexed" : "true",
            "display_name" : "Enabled by",
            "description" : "???",
            "required" : "false",
            "cardinality" : "single"
         },
         "process_class_closure" : {
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "process_class_closure",
            "display_name" : "Process",
            "description" : "???",
            "cardinality" : "multi",
            "required" : "false"
         },
         "panther_family_label" : {
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "type" : "string",
            "id" : "panther_family_label",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "PANTHER family",
            "description" : "PANTHER families that are associated with this entity."
         },
         "function_class_closure_label" : {
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "indexed" : "true",
            "id" : "function_class_closure_label",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Function",
            "description" : "???"
         },
         "topology_graph_json" : {
            "indexed" : "false",
            "id" : "topology_graph_json",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "description" : "JSON blob form of the local stepwise topology graph.",
            "display_name" : "Topology graph (JSON)",
            "cardinality" : "single",
            "required" : "false"
         },
         "taxon_label" : {
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "indexed" : "true",
            "id" : "taxon_label",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Taxon",
            "description" : "Taxon derived from GAF column 13 and ncbi_taxonomy.obo."
         },
         "function_class" : {
            "cardinality" : "single",
            "required" : "false",
            "description" : "Function acc/ID.",
            "display_name" : "Function",
            "indexed" : "true",
            "id" : "function_class",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         "process_class_closure_label" : {
            "required" : "false",
            "cardinality" : "multi",
            "description" : "???",
            "display_name" : "Process",
            "id" : "process_class_closure_label",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "type" : "string"
         }
      },
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/complex-ann-config.yaml",
      "weight" : "-5",
      "id" : "complex_annotation",
      "filter_weights" : "annotation_group_label^5.0 enabled_by_label^4.5 location_list_closure_label^4.0 process_class_closure_label^3.0 function_class_closure_label^2.0",
      "document_category" : "complex_annotation",
      "schema_generating" : "true",
      "fields" : [
         {
            "display_name" : "ID",
            "description" : "A unique (and internal) thing.",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "id"
         },
         {
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "annotation_unit",
            "display_name" : "Annotation unit",
            "description" : "???.",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "description" : "???.",
            "display_name" : "Annotation unit",
            "required" : "false",
            "cardinality" : "single",
            "id" : "annotation_unit_label",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "type" : "string"
         },
         {
            "display_name" : "Annotation group",
            "description" : "???.",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "id" : "annotation_group",
            "indexed" : "true"
         },
         {
            "id" : "annotation_group_label",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "description" : "???.",
            "display_name" : "Annotation group"
         },
         {
            "description" : "???.",
            "display_name" : "Annotation group URL",
            "required" : "false",
            "cardinality" : "single",
            "id" : "annotation_group_url",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "type" : "string"
         },
         {
            "display_name" : "Enabled by",
            "description" : "???",
            "required" : "false",
            "cardinality" : "single",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "id" : "enabled_by",
            "indexed" : "true"
         },
         {
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "id" : "enabled_by_label",
            "indexed" : "true",
            "display_name" : "Enabled by",
            "description" : "???",
            "required" : "false",
            "cardinality" : "single"
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "PANTHER family",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "type" : "string",
            "id" : "panther_family",
            "indexed" : "true"
         },
         {
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "type" : "string",
            "id" : "panther_family_label",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "PANTHER family",
            "description" : "PANTHER families that are associated with this entity."
         },
         {
            "description" : "GAF column 13 (taxon).",
            "display_name" : "Taxon",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "taxon",
            "type" : "string",
            "searchable" : "false",
            "transform" : [],
            "property" : []
         },
         {
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "indexed" : "true",
            "id" : "taxon_label",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Taxon",
            "description" : "Taxon derived from GAF column 13 and ncbi_taxonomy.obo."
         },
         {
            "required" : "false",
            "cardinality" : "multi",
            "display_name" : "Taxon (IDs)",
            "description" : "Taxon IDs derived from GAF column 13 and ncbi_taxonomy.obo.",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "type" : "string",
            "id" : "taxon_closure",
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "id" : "taxon_closure_label",
            "type" : "string",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "description" : "Taxon label closure derived from GAF column 13 and ncbi_taxonomy.obo.",
            "display_name" : "Taxon",
            "cardinality" : "multi",
            "required" : "false"
         },
         {
            "cardinality" : "single",
            "required" : "false",
            "description" : "Function acc/ID.",
            "display_name" : "Function",
            "indexed" : "true",
            "id" : "function_class",
            "type" : "string",
            "transform" : [],
            "searchable" : "false",
            "property" : []
         },
         {
            "cardinality" : "single",
            "required" : "false",
            "description" : "Common function name.",
            "display_name" : "Function",
            "indexed" : "true",
            "id" : "function_class_label",
            "type" : "string",
            "searchable" : "true",
            "transform" : [],
            "property" : []
         },
         {
            "required" : "false",
            "cardinality" : "multi",
            "description" : "???",
            "display_name" : "Function",
            "id" : "function_class_closure",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "type" : "string"
         },
         {
            "type" : "string",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "indexed" : "true",
            "id" : "function_class_closure_label",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Function",
            "description" : "???"
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "description" : "Process acc/ID.",
            "display_name" : "Process",
            "id" : "process_class",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string"
         },
         {
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "type" : "string",
            "id" : "process_class_label",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Process",
            "description" : "Common process name."
         },
         {
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "id" : "process_class_closure",
            "display_name" : "Process",
            "description" : "???",
            "cardinality" : "multi",
            "required" : "false"
         },
         {
            "required" : "false",
            "cardinality" : "multi",
            "description" : "???",
            "display_name" : "Process",
            "id" : "process_class_closure_label",
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "id" : "location_list",
            "type" : "string",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "description" : "",
            "display_name" : "Location",
            "cardinality" : "multi",
            "required" : "false"
         },
         {
            "description" : "",
            "display_name" : "Location",
            "cardinality" : "multi",
            "required" : "false",
            "indexed" : "true",
            "id" : "location_list_label",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false"
         },
         {
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Location",
            "description" : "",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "id" : "location_list_closure"
         },
         {
            "indexed" : "true",
            "id" : "location_list_closure_label",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "",
            "display_name" : "Location"
         },
         {
            "display_name" : "???",
            "description" : "???",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "false",
            "id" : "owl_blob_json"
         },
         {
            "indexed" : "false",
            "id" : "topology_graph_json",
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "description" : "JSON blob form of the local stepwise topology graph.",
            "display_name" : "Topology graph (JSON)",
            "cardinality" : "single",
            "required" : "false"
         }
      ]
   },
   "bbop_term_ac" : {
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/term-autocomplete-config.yaml",
      "_strict" : 0,
      "searchable_extension" : "_searchable",
      "description" : "Easily find ontology classes in GO. For personality only - not a schema configuration.",
      "display_name" : "Term autocomplete",
      "boost_weights" : "annotation_class^5.0 annotation_class_label^5.0 synonym^1.0 alternate_id^1.0",
      "result_weights" : "annotation_class^8.0 synonym^3.0 alternate_id^2.0",
      "id" : "bbop_term_ac",
      "filter_weights" : "annotation_class^8.0 synonym^3.0 alternate_id^2.0",
      "schema_generating" : "false",
      "document_category" : "ontology_class",
      "fields" : [
         {
            "display_name" : "Acc",
            "description" : "Term acc/ID.",
            "required" : "false",
            "cardinality" : "single",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "id" : "id",
            "indexed" : "true"
         },
         {
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "id" : "annotation_class",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Term",
            "description" : "Term acc/ID."
         },
         {
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "indexed" : "true",
            "id" : "annotation_class_label",
            "display_name" : "Term",
            "description" : "Common term name.",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "id" : "synonym",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Term synonyms.",
            "display_name" : "Synonyms"
         },
         {
            "indexed" : "true",
            "id" : "alternate_id",
            "type" : "string",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "description" : "Alternate term id.",
            "display_name" : "Alt ID",
            "cardinality" : "multi",
            "required" : "false"
         }
      ],
      "fields_hash" : {
         "annotation_class" : {
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "id" : "annotation_class",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Term",
            "description" : "Term acc/ID."
         },
         "annotation_class_label" : {
            "type" : "string",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "indexed" : "true",
            "id" : "annotation_class_label",
            "display_name" : "Term",
            "description" : "Common term name.",
            "cardinality" : "single",
            "required" : "false"
         },
         "synonym" : {
            "id" : "synonym",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "description" : "Term synonyms.",
            "display_name" : "Synonyms"
         },
         "alternate_id" : {
            "indexed" : "true",
            "id" : "alternate_id",
            "type" : "string",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "description" : "Alternate term id.",
            "display_name" : "Alt ID",
            "cardinality" : "multi",
            "required" : "false"
         },
         "id" : {
            "display_name" : "Acc",
            "description" : "Term acc/ID.",
            "required" : "false",
            "cardinality" : "single",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "id" : "id",
            "indexed" : "true"
         }
      },
      "weight" : "-20",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/term-autocomplete-config.yaml"
   },
   "general" : {
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/general-config.yaml",
      "weight" : "0",
      "fields_hash" : {
         "entity_label" : {
            "type" : "string",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "indexed" : "true",
            "id" : "entity_label",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Enity label",
            "description" : "The label for this entity."
         },
         "category" : {
            "id" : "category",
            "indexed" : "true",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "description" : "The document category that this enitity belongs to.",
            "display_name" : "Document category",
            "required" : "false",
            "cardinality" : "single"
         },
         "general_blob" : {
            "display_name" : "Generic blob",
            "description" : "A hidden searchable blob document to access this item. It should contain all the goodies that we want to search for, like species(?), synonyms, etc.",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "indexed" : "true",
            "id" : "general_blob"
         },
         "id" : {
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Internal ID",
            "description" : "The mangled internal ID for this entity.",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "id" : "id"
         },
         "entity" : {
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Entity",
            "description" : "The ID/label for this entity.",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "type" : "string",
            "id" : "entity",
            "indexed" : "true"
         }
      },
      "filter_weights" : "category^4.0",
      "id" : "general",
      "document_category" : "general",
      "fields" : [
         {
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Internal ID",
            "description" : "The mangled internal ID for this entity.",
            "type" : "string",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "id" : "id"
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "display_name" : "Entity",
            "description" : "The ID/label for this entity.",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "type" : "string",
            "id" : "entity",
            "indexed" : "true"
         },
         {
            "type" : "string",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "indexed" : "true",
            "id" : "entity_label",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Enity label",
            "description" : "The label for this entity."
         },
         {
            "id" : "category",
            "indexed" : "true",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "type" : "string",
            "description" : "The document category that this enitity belongs to.",
            "display_name" : "Document category",
            "required" : "false",
            "cardinality" : "single"
         },
         {
            "display_name" : "Generic blob",
            "description" : "A hidden searchable blob document to access this item. It should contain all the goodies that we want to search for, like species(?), synonyms, etc.",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "indexed" : "true",
            "id" : "general_blob"
         }
      ],
      "schema_generating" : "true",
      "result_weights" : "entity^3.0 category^1.0",
      "boost_weights" : "entity^3.0 entity_label^3.0 general_blob^3.0",
      "_strict" : 0,
      "description" : "A generic search document to get a general overview of everything.",
      "searchable_extension" : "_searchable",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/general-config.yaml",
      "display_name" : "General"
   }
};
/*
 * Package: server.js
 * 
 * Namespace: amigo.data.server
 * 
 * This package was automatically created during AmiGO 2 installation.
 * 
 * Purpose: Useful information about GO and the AmiGO installation.
 *          Also serves as a repository and getter for web
 *          resources such as images.
 * 
 * NOTE: This file is generated dynamically at installation time.
 *       Hard to work with unit tests--hope it's not too bad.
 *       Want to keep this real simple.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Constructor: server
 * 
 * The configuration for the server settings.
 * Essentially a JSONification of the config.pl AmiGO 2 file.
 * 
 * Arguments:
 *  n/a
 */
amigo.data.server = function(){

    // All of the server/instance-specific meta-data.
    var meta_data = {"js_base":"http://localhost:9999/static/js","html_base":"http://localhost:9999/static","js_dev_base":"http://localhost:9999/static/staging","bbop_img_star":"http://localhost:9999/static/images/star.png","species":[],"galaxy_base":"http://galaxy.berkeleybop.org/","evidence_codes":{},"css_base":"http://localhost:9999/static/css","app_base":"http://localhost:9999","image_base":"http://localhost:9999/static/images","species_map":{},"beta":"1","term_regexp":"all|GO:[0-9]{7}","sources":[],"ontologies":[],"gp_types":[],"golr_base":"http://localhost:8080/solr/"};

    ///
    /// Break out the data and various functions to access them...
    ///

    /*
     * Function: js_base
     * 
     * Access to AmiGO variable js_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var js_base = meta_data.js_base;
    this.js_base = function(){ return js_base; };

    /*
     * Function: html_base
     * 
     * Access to AmiGO variable html_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var html_base = meta_data.html_base;
    this.html_base = function(){ return html_base; };

    /*
     * Function: js_dev_base
     * 
     * Access to AmiGO variable js_dev_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var js_dev_base = meta_data.js_dev_base;
    this.js_dev_base = function(){ return js_dev_base; };

    /*
     * Function: bbop_img_star
     * 
     * Access to AmiGO variable bbop_img_star.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var bbop_img_star = meta_data.bbop_img_star;
    this.bbop_img_star = function(){ return bbop_img_star; };

    /*
     * Function: species
     * 
     * Access to AmiGO variable species.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var species = meta_data.species;
    this.species = function(){ return species; };

    /*
     * Function: galaxy_base
     * 
     * Access to AmiGO variable galaxy_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var galaxy_base = meta_data.galaxy_base;
    this.galaxy_base = function(){ return galaxy_base; };

    /*
     * Function: evidence_codes
     * 
     * Access to AmiGO variable evidence_codes.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var evidence_codes = meta_data.evidence_codes;
    this.evidence_codes = function(){ return evidence_codes; };

    /*
     * Function: css_base
     * 
     * Access to AmiGO variable css_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var css_base = meta_data.css_base;
    this.css_base = function(){ return css_base; };

    /*
     * Function: app_base
     * 
     * Access to AmiGO variable app_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var app_base = meta_data.app_base;
    this.app_base = function(){ return app_base; };

    /*
     * Function: image_base
     * 
     * Access to AmiGO variable image_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var image_base = meta_data.image_base;
    this.image_base = function(){ return image_base; };

    /*
     * Function: species_map
     * 
     * Access to AmiGO variable species_map.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var species_map = meta_data.species_map;
    this.species_map = function(){ return species_map; };

    /*
     * Function: beta
     * 
     * Access to AmiGO variable beta.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var beta = meta_data.beta;
    this.beta = function(){ return beta; };

    /*
     * Function: term_regexp
     * 
     * Access to AmiGO variable term_regexp.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var term_regexp = meta_data.term_regexp;
    this.term_regexp = function(){ return term_regexp; };

    /*
     * Function: sources
     * 
     * Access to AmiGO variable sources.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var sources = meta_data.sources;
    this.sources = function(){ return sources; };

    /*
     * Function: ontologies
     * 
     * Access to AmiGO variable ontologies.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var ontologies = meta_data.ontologies;
    this.ontologies = function(){ return ontologies; };

    /*
     * Function: gp_types
     * 
     * Access to AmiGO variable gp_types.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var gp_types = meta_data.gp_types;
    this.gp_types = function(){ return gp_types; };

    /*
     * Function: golr_base
     * 
     * Access to AmiGO variable golr_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    var golr_base = meta_data.golr_base;
    this.golr_base = function(){ return golr_base; };


    // Does it look like a term?
    var tre_str = meta_data.term_regexp;
    var tre = new RegExp(tre_str);

    /*
     * Function: term_id_p
     * 
     * True or false on whether or not a string looks like a GO term id.
     * 
     * Parameters:
     *  term_id - the string to test
     * 
     * Returns:
     *  boolean
     */
    this.term_id_p = function(term_id){
       var retval = false;
       if( tre.test(term_id) ){
          retval = true;
       }
       return retval;
    };

    /*
     * Function: get_image_resource
     * 
     * Get a named resource from the meta_data hash if possible.
     * 
     * Parameters:
     *  resource - the string id of the resource
     * 
     * Returns:
     * string (url) of resource
     */
    this.get_image_resource = function(resource){

       var retval = null;
       var mangled_res = 'bbop_img_' + resource;

       if( meta_data[mangled_res] ){
          retval = meta_data[mangled_res];
       }
       return retval;
    };
};
/*
 * Package: definitions.js
 * 
 * Namespace: amigo.data.definitions
 * 
 * Purpose: Useful information about common GO datatypes and
 * structures, as well as some constants.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Constructor: definitions
 * 
 * Encapsulate common structures and constants.
 * 
 * Arguments:
 *  n/a
 */
amigo.data.definitions = function(){

    /*
     * Function: gaf_from_golr_fields
     * 
     * A list of fields to generate a GAF from using golr fields.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  list of strings
     */
    this.gaf_from_golr_fields = function(){
	return [
	    'source', // c1
	    'bioentity_internal_id', // c2; not bioentity
	    'bioentity_label', // c3
	    'qualifier', // c4
	    'annotation_class', // c5
	    'reference', // c6
	    'evidence_type', // c7
	    'evidence_with', // c8
	    'aspect', // c9
	    'bioentity_name', // c10
	    'synonym', // c11
	    'type', // c12
	    'taxon', // c13
	    'date', // c14
	    'assigned_by', // c15
	    'annotation_extension_class', // c16
	    'bioentity_isoform' // c17
	];
    };

    /*
     * Function: download_limit
     * 
     * The maximum allowed number of items to download for out server.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  integer
     */
    this.download_limit = function(){
	//return 7500;
	return 10000;
    };

};
/* 
 * Package: xrefs.js
 * 
 * Namespace: amigo.data.xrefs
 * 
 * This package was automatically created during an AmiGO 2 installation
 * from the GO.xrf_abbs file at: "http://www.geneontology.org/doc/GO.xrf_abbs".
 *
 * NOTE: This file is generated dynamically at installation time.
 * Hard to work with unit tests--hope it's not too bad. You have to
 * occasionally copy back to keep the unit tests sane.
 */

// All of the server/instance-specific meta-data.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Variable: xrefs
 * 
 * All the external references that we know about.
 */
amigo.data.xrefs = {
   "hgnc" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://www.genenames.org/data/hgnc_data.php?hgnc_id=HGNC:29",
      "url_syntax" : "http://www.genenames.org/data/hgnc_data.php?hgnc_id=HGNC:[example_id]",
      "abbreviation" : "HGNC",
      "generic_url" : "http://www.genenames.org/",
      "datatype" : null,
      "local_id_syntax" : "[0-9]+",
      "fullname" : null,
      "example_id" : "HGNC:29",
      "name" : null,
      "database" : "HUGO Gene Nomenclature Committee",
      "entity_type" : "SO:0000704 ! gene"
   },
   "roslin_institute" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : null,
      "url_example" : null,
      "generic_url" : "http://www.roslin.ac.uk/",
      "abbreviation" : "Roslin_Institute",
      "datatype" : null,
      "fullname" : null,
      "database" : "Roslin Institute",
      "example_id" : null,
      "name" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "pubmed" : {
      "name" : null,
      "database" : "PubMed",
      "example_id" : "PMID:4208797",
      "entity_type" : "BET:0000000 ! entity",
      "local_id_syntax" : "[0-9]+",
      "fullname" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/pubmed/[example_id]",
      "url_example" : "http://www.ncbi.nlm.nih.gov/pubmed/4208797",
      "datatype" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/PubMed/",
      "abbreviation" : "PubMed",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "ddbj" : {
      "fullname" : null,
      "name" : null,
      "example_id" : "DDBJ:AA816246",
      "database" : "DNA Databank of Japan",
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://arsa.ddbj.nig.ac.jp/arsa/ddbjSplSearch?KeyWord=AA816246",
      "url_syntax" : "http://arsa.ddbj.nig.ac.jp/arsa/ddbjSplSearch?KeyWord=[example_id]",
      "abbreviation" : "DDBJ",
      "generic_url" : "http://www.ddbj.nig.ac.jp/",
      "datatype" : null
   },
   "cdd" : {
      "database" : "Conserved Domain Database at NCBI",
      "example_id" : "CDD:34222",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid=34222",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid=[example_id]",
      "datatype" : null,
      "abbreviation" : "CDD",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=cdd",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "hgnc_gene" : {
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "HGNC_gene:ABCA1",
      "name" : null,
      "database" : "HUGO Gene Nomenclature Committee",
      "fullname" : null,
      "datatype" : null,
      "abbreviation" : "HGNC_gene",
      "generic_url" : "http://www.genenames.org/",
      "url_example" : "http://www.genenames.org/data/hgnc_data.php?app_sym=ABCA1",
      "url_syntax" : "http://www.genenames.org/data/hgnc_data.php?app_sym=[example_id]",
      "id" : null,
      "object" : null,
      "uri_prefix" : null
   },
   "wikipedia" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "Wikipedia:Endoplasmic_reticulum",
      "database" : "Wikipedia",
      "name" : null,
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "abbreviation" : "Wikipedia",
      "generic_url" : "http://en.wikipedia.org/",
      "url_syntax" : "http://en.wikipedia.org/wiki/[example_id]",
      "url_example" : "http://en.wikipedia.org/wiki/Endoplasmic_reticulum"
   },
   "nif_subcellular" : {
      "url_syntax" : "http://www.neurolex.org/wiki/[example_id]",
      "url_example" : "http://www.neurolex.org/wiki/sao1770195789",
      "generic_url" : "http://www.neurolex.org/wiki",
      "abbreviation" : "NIF_Subcellular",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "example_id" : "NIF_Subcellular:sao1186862860",
      "database" : "Neuroscience Information Framework standard ontology, subcellular hierarchy",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "ppi" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : null,
      "url_syntax" : null,
      "generic_url" : "http://genome.pseudomonas-syringae.org/",
      "abbreviation" : "PPI",
      "datatype" : null,
      "fullname" : null,
      "name" : null,
      "example_id" : null,
      "database" : "Pseudomonas syringae community annotation project",
      "entity_type" : "BET:0000000 ! entity"
   },
   "cas_spc" : {
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "CAS_SPC",
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "datatype" : null,
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=[example_id]",
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=1979",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : null,
      "name" : null,
      "database" : "Catalog of Fishes species database"
   },
   "dictybase_gene_name" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "dictyBase",
      "example_id" : "dictyBase_gene_name:mlcE",
      "name" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "dictyBase_gene_name",
      "generic_url" : "http://dictybase.org",
      "datatype" : null,
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "url_example" : "http://dictybase.org/gene/mlcE"
   },
   "dictybase" : {
      "local_id_syntax" : "DDB_G[0-9]{7}",
      "fullname" : null,
      "database" : "dictyBase",
      "example_id" : "dictyBase:DDB_G0277859",
      "name" : null,
      "entity_type" : "SO:0000704 ! gene",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://dictybase.org/gene/DDB_G0277859",
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "abbreviation" : "DictyBase",
      "generic_url" : "http://dictybase.org",
      "datatype" : null
   },
   "cgd_locus" : {
      "name" : null,
      "example_id" : "CGD_LOCUS:HWP1",
      "database" : "Candida Genome Database",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?locus=HWP1",
      "generic_url" : "http://www.candidagenome.org/",
      "abbreviation" : "CGD_LOCUS",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "pseudocap" : {
      "name" : null,
      "example_id" : "PseudoCAP:PA4756",
      "database" : "Pseudomonas Genome Project",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_example" : "http://v2.pseudomonas.com/getAnnotation.do?locusID=PA4756",
      "url_syntax" : "http://v2.pseudomonas.com/getAnnotation.do?locusID=[example_id]",
      "datatype" : null,
      "generic_url" : "http://v2.pseudomonas.com/",
      "abbreviation" : "PseudoCAP",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "tigr_cmr" : {
      "generic_url" : "http://cmr.jcvi.org/",
      "abbreviation" : "TIGR_CMR",
      "datatype" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=VCA0557",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=[example_id]",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "PR:000000001 ! protein",
      "database" : "EGAD database at the J. Craig Venter Institute",
      "name" : null,
      "example_id" : "JCVI_CMR:VCA0557",
      "fullname" : null
   },
   "obo_sf_po" : {
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "OBO_SF_PO:3184921",
      "database" : "Source Forge OBO Plant Ontology (PO) term request tracker",
      "name" : null,
      "fullname" : null,
      "generic_url" : "http://sourceforge.net/tracker/?func=browse&group_id=76834&atid=835555",
      "abbreviation" : "OBO_SF_PO",
      "datatype" : null,
      "url_syntax" : "https://sourceforge.net/tracker/index.php?func=detail&aid=[example_id]&group_id=76834&atid=835555",
      "url_example" : "https://sourceforge.net/tracker/index.php?func=detail&aid=3184921&group_id=76834&atid=835555",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "eurofung" : {
      "datatype" : null,
      "abbreviation" : "Eurofung",
      "generic_url" : "http://www.eurofung.net/option=com_content&task=section&id=3&Itemid=4",
      "url_syntax" : null,
      "url_example" : null,
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : null,
      "database" : "Eurofungbase community annotation",
      "fullname" : null
   },
   "uberon" : {
      "fullname" : null,
      "description" : "A multi-species anatomy ontology",
      "local_id_syntax" : "[0-9]{7}",
      "entity_type" : "CARO:0000000 ! anatomical entity",
      "database" : "Uber-anatomy ontology",
      "example_id" : "URBERON:0002398",
      "name" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "UBERON",
      "generic_url" : "http://uberon.org",
      "datatype" : null,
      "url_syntax" : "http://purl.obolibrary.org/obo/UBERON_[example_id]",
      "url_example" : "http://purl.obolibrary.org/obo/UBERON_0002398"
   },
   "prodom" : {
      "url_example" : "http://prodom.prabi.fr/prodom/current/cgi-bin/request.pl?question=DBEN&query=PD000001",
      "url_syntax" : "http://prodom.prabi.fr/prodom/current/cgi-bin/request.pl?question=DBEN&query=[example_id]",
      "generic_url" : "http://prodom.prabi.fr/prodom/current/html/home.php",
      "abbreviation" : "ProDom",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "example_id" : "ProDom:PD000001",
      "database" : "ProDom protein domain families",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "description" : "ProDom protein domain families automatically generated from UniProtKB"
   },
   "pubchem_bioassay" : {
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "PubChem_BioAssay",
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "datatype" : null,
      "url_example" : "http://pubchem.ncbi.nlm.nih.gov/assay/assay.cgi?aid=177",
      "url_syntax" : "http://pubchem.ncbi.nlm.nih.gov/assay/assay.cgi?aid=[example_id]",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "PubChem_BioAssay:177",
      "name" : null,
      "database" : "NCBI PubChem database of bioassay records"
   },
   "genbank" : {
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=AA816246",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=[example_id]",
      "abbreviation" : "GenBank",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "example_id" : "GB:AA816246",
      "name" : null,
      "database" : "GenBank",
      "entity_type" : "PR:000000001 ! protein",
      "local_id_syntax" : "([A-Z]{2}[0-9]{6})|([A-Z]{1}[0-9]{5})",
      "fullname" : null,
      "description" : "The NIH genetic sequence database, an annotated collection of all publicly available DNA sequences."
   },
   "um-bbd" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "example_id" : null,
      "name" : null,
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "abbreviation" : "UM-BBD",
      "url_example" : null,
      "url_syntax" : null
   },
   "prosite" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : "http://www.expasy.ch/cgi-bin/prosite-search-ac?[example_id]",
      "url_example" : "http://www.expasy.ch/cgi-bin/prosite-search-ac?PS00365",
      "datatype" : null,
      "generic_url" : "http://www.expasy.ch/prosite/",
      "abbreviation" : "Prosite",
      "fullname" : null,
      "example_id" : "Prosite:PS00365",
      "name" : null,
      "database" : "Prosite database of protein families and domains",
      "entity_type" : "SO:0000839 ! polypeptide region"
   },
   "biocyc" : {
      "fullname" : null,
      "database" : "BioCyc collection of metabolic pathway databases",
      "example_id" : "BioCyc:PWY-5271",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : "http://biocyc.org/META/NEW-IMAGE?type=PATHWAY&object=[example_id]",
      "url_example" : "http://biocyc.org/META/NEW-IMAGE?type=PATHWAY&object=PWY-5271",
      "datatype" : null,
      "abbreviation" : "BioCyc",
      "generic_url" : "http://biocyc.org/"
   },
   "unipathway" : {
      "example_id" : "UniPathway:UPA00155",
      "name" : null,
      "database" : "UniPathway",
      "entity_type" : "GO:0008150 ! biological_process",
      "description" : "UniPathway is a a metabolic door to UniProtKB/Swiss-Prot, a curated resource of metabolic pathways for the UniProtKB/Swiss-Prot knowledgebase.",
      "fullname" : null,
      "url_example" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway/upa?upid=UPA00155",
      "url_syntax" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway/upa?upid=[example_id]",
      "datatype" : null,
      "abbreviation" : "UniPathway",
      "generic_url" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "go_central" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.geneontology.org/GO.refgenome.shtml",
      "abbreviation" : "GO_Central",
      "url_syntax" : null,
      "url_example" : null,
      "description" : "Manual annotation from PAINT curators into the UniProt Protein2GO curation tool.",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : null,
      "database" : "GO Central"
   },
   "cog" : {
      "fullname" : null,
      "example_id" : null,
      "name" : null,
      "database" : "NCBI Clusters of Orthologous Groups",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : null,
      "url_syntax" : null,
      "datatype" : null,
      "abbreviation" : "COG",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/"
   },
   "iuphar_gpcr" : {
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "IUPHAR_GPCR:1279",
      "database" : "International Union of Pharmacology",
      "name" : null,
      "fullname" : null,
      "datatype" : null,
      "generic_url" : "http://www.iuphar.org/",
      "abbreviation" : "IUPHAR_GPCR",
      "url_syntax" : "http://www.iuphar-db.org/DATABASE/FamilyMenuForward?familyId=[example_id]",
      "url_example" : "http://www.iuphar-db.org/DATABASE/FamilyMenuForward?familyId=13",
      "id" : null,
      "object" : null,
      "uri_prefix" : null
   },
   "ncbi_gp" : {
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=protein&val=EAL72968",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=protein&val=[example_id]",
      "datatype" : null,
      "abbreviation" : "NCBI_GP",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "example_id" : "NCBI_GP:EAL72968",
      "name" : null,
      "database" : "NCBI GenPept",
      "entity_type" : "PR:000000001 ! protein",
      "local_id_syntax" : "[A-Z]{3}[0-9]{5}(\\.[0-9]+)?",
      "fullname" : null
   },
   "pamgo_vmd" : {
      "database" : "Virginia Bioinformatics Institute Microbial Database",
      "example_id" : "PAMGO_VMD:109198",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "description" : "Virginia Bioinformatics Institute Microbial Database; member of PAMGO Interest Group",
      "url_example" : "http://vmd.vbi.vt.edu/cgi-bin/browse/go_detail.cgi?gene_id=109198",
      "url_syntax" : "http://vmd.vbi.vt.edu/cgi-bin/browse/go_detail.cgi?gene_id=[example_id]",
      "abbreviation" : "PAMGO_VMD",
      "generic_url" : "http://phytophthora.vbi.vt.edu",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "jcvi_egad" : {
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=[example_id]",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=74462",
      "datatype" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "abbreviation" : "JCVI_EGAD",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "name" : null,
      "example_id" : "JCVI_EGAD:74462",
      "database" : "JCVI CMR Egad",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "pamgo_mgg" : {
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Magnaporthe grisea database",
      "example_id" : "PAMGO_MGG:MGG_05132",
      "name" : null,
      "fullname" : null,
      "description" : "Magnaporthe grisea database at North Carolina State University; member of PAMGO Interest Group",
      "abbreviation" : "PAMGO_MGG",
      "generic_url" : "http://scotland.fgl.ncsu.edu/smeng/GoAnnotationMagnaporthegrisea.html",
      "datatype" : null,
      "url_example" : "http://scotland.fgl.ncsu.edu/cgi-bin/adHocQuery.cgi?adHocQuery_dbName=smeng_goannotation&Action=Data&QueryName=Functional+Categorization+of+MGG+GO+Annotation&P_KeyWord=MGG_05132",
      "url_syntax" : "http://scotland.fgl.ncsu.edu/cgi-bin/adHocQuery.cgi?adHocQuery_dbName=smeng_goannotation&Action=Data&QueryName=Functional+Categorization+of+MGG+GO+Annotation&P_KeyWord=[example_id]",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "so" : {
      "abbreviation" : "SO",
      "generic_url" : "http://sequenceontology.org/",
      "datatype" : null,
      "url_example" : "http://song.sourceforge.net/SOterm_tables.html#SO:0000195",
      "url_syntax" : "http://song.sourceforge.net/SOterm_tables.html#SO:[example_id]",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "SO:0000110 ! sequence feature",
      "example_id" : "SO:0000195",
      "database" : "Sequence Ontology",
      "name" : null,
      "fullname" : null,
      "local_id_syntax" : "\\d{7}"
   },
   "unimod" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : "http://www.unimod.org/modifications_view.php?editid1=[example_id]",
      "url_example" : "http://www.unimod.org/modifications_view.php?editid1=1287",
      "datatype" : null,
      "generic_url" : "http://www.unimod.org/",
      "abbreviation" : "UniMod",
      "description" : "protein modifications for mass spectrometry",
      "fullname" : null,
      "example_id" : "UniMod:1287",
      "name" : null,
      "database" : "UniMod",
      "entity_type" : "BET:0000000 ! entity"
   },
   "cgen" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : "CGEN:PrID131022",
      "database" : "Compugen Gene Ontology Gene Association Data",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://www.cgen.com/",
      "abbreviation" : "CGEN",
      "datatype" : null,
      "url_example" : null,
      "url_syntax" : null
   },
   "casref" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "abbreviation" : "CASREF",
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getref.asp?id=[example_id]",
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getref.asp?id=2031",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "CASREF:2031",
      "database" : "Catalog of Fishes publications database",
      "name" : null
   },
   "pfam" : {
      "local_id_syntax" : "PF[0-9]{5}",
      "fullname" : null,
      "description" : "Pfam is a collection of protein families represented by sequence alignments and hidden Markov models (HMMs)",
      "example_id" : "Pfam:PF00046",
      "database" : "Pfam database of protein families",
      "name" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : "http://www.sanger.ac.uk/cgi-bin/Pfam/getacc?[example_id]",
      "url_example" : "http://www.sanger.ac.uk/cgi-bin/Pfam/getacc?PF00046",
      "generic_url" : "http://www.sanger.ac.uk/Software/Pfam/",
      "abbreviation" : "Pfam",
      "datatype" : null
   },
   "gr_ref" : {
      "name" : null,
      "example_id" : "GR_REF:659",
      "database" : "Gramene",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_syntax" : "http://www.gramene.org/db/literature/pub_search?ref_id=[example_id]",
      "url_example" : "http://www.gramene.org/db/literature/pub_search?ref_id=659",
      "abbreviation" : "GR_REF",
      "generic_url" : "http://www.gramene.org/",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "tigr_genprop" : {
      "abbreviation" : "TIGR_GenProp",
      "generic_url" : "http://cmr.jcvi.org/",
      "datatype" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=[example_id]",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=GenProp0120",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "GO:0008150 ! biological_process",
      "database" : "Genome Properties database at the J. Craig Venter Institute",
      "name" : null,
      "example_id" : "JCVI_GenProp:GenProp0120",
      "fullname" : null,
      "local_id_syntax" : "GenProp[0-9]{4}"
   },
   "ncbitaxon" : {
      "abbreviation" : "NCBITaxon",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "NCBI Taxonomy",
      "example_id" : "taxon:7227",
      "name" : null,
      "fullname" : null
   },
   "ensemblfungi" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://www.ensemblgenomes.org/id/YOR197W",
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "abbreviation" : "EnsemblFungi",
      "generic_url" : "http://fungi.ensembl.org/",
      "datatype" : null,
      "fullname" : null,
      "name" : null,
      "example_id" : "EnsemblFungi:YOR197W",
      "database" : "Ensembl Fungi, the Ensembl Genomes database for accessing fungal genome data",
      "entity_type" : "SO:0000704 ! gene"
   },
   "ecogene_g" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : null,
      "url_example" : null,
      "generic_url" : "http://www.ecogene.org/",
      "abbreviation" : "ECOGENE_G",
      "datatype" : null,
      "fullname" : null,
      "example_id" : "ECOGENE_G:deoC",
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "um-bbd_pathwayid" : {
      "fullname" : null,
      "example_id" : "UM-BBD_pathwayID:acr",
      "name" : null,
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : "http://umbbd.msi.umn.edu/[example_id]/[example_id]_map.html",
      "url_example" : "http://umbbd.msi.umn.edu/acr/acr_map.html",
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "abbreviation" : "UM-BBD_pathwayID",
      "datatype" : null
   },
   "kegg_ligand" : {
      "local_id_syntax" : "C\\d{5}",
      "fullname" : null,
      "example_id" : "KEGG_LIGAND:C00577",
      "database" : "KEGG LIGAND Database",
      "name" : null,
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?cpd:C00577",
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?cpd:[example_id]",
      "abbreviation" : "KEGG_LIGAND",
      "generic_url" : "http://www.genome.ad.jp/kegg/docs/upd_ligand.html",
      "datatype" : null
   },
   "mitre" : {
      "fullname" : null,
      "example_id" : null,
      "name" : null,
      "database" : "The MITRE Corporation",
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : null,
      "url_example" : null,
      "generic_url" : "http://www.mitre.org/",
      "abbreviation" : "MITRE",
      "datatype" : null
   },
   "ecoliwiki" : {
      "description" : "EcoliHub\\'s subsystem for community annotation of E. coli K-12",
      "fullname" : null,
      "local_id_syntax" : "[A-Za-z]{3,4}",
      "entity_type" : "SO:0000704 ! gene",
      "example_id" : null,
      "database" : "EcoliWiki from EcoliHub",
      "name" : null,
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://ecoliwiki.net/",
      "abbreviation" : "EcoliWiki",
      "url_syntax" : null,
      "url_example" : null
   },
   "pharmgkb" : {
      "database" : "Pharmacogenetics and Pharmacogenomics Knowledge Base",
      "example_id" : "PharmGKB:PA267",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_example" : "http://www.pharmgkb.org/do/serve?objId=PA267",
      "url_syntax" : "http://www.pharmgkb.org/do/serve?objId=[example_id]",
      "datatype" : null,
      "generic_url" : "http://www.pharmgkb.org",
      "abbreviation" : "PharmGKB",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "panther" : {
      "name" : null,
      "example_id" : "PANTHER:PTHR11455",
      "database" : "Protein ANalysis THrough Evolutionary Relationships Classification System",
      "entity_type" : "NCIT:C20130 ! protein family",
      "local_id_syntax" : "PTN[0-9]{9}|PTHR[0-9]{5}_[A-Z0-9]+",
      "fullname" : null,
      "url_example" : "http://www.pantherdb.org/panther/lookupId.jsp?id=PTHR10000",
      "url_syntax" : "http://www.pantherdb.org/panther/lookupId.jsp?id=[example_id]",
      "abbreviation" : "PANTHER",
      "generic_url" : "http://www.pantherdb.org/",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "wbbt" : {
      "example_id" : "WBbt:0005733",
      "database" : "C. elegans gross anatomy",
      "name" : null,
      "entity_type" : "UBERON:0001062 ! metazoan anatomical entity",
      "local_id_syntax" : "[0-9]{7}",
      "fullname" : null,
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "abbreviation" : "WBbt",
      "generic_url" : "http://www.wormbase.org/",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "bfo" : {
      "example_id" : "BFO:0000066",
      "database" : "Basic Formal Ontology",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "description" : "An upper ontology used by Open Bio Ontologies (OBO) Foundry. BFO contains upper-level classes as well as core relations such as part_of (BFO_0000050)",
      "fullname" : null,
      "url_syntax" : "http://purl.obolibrary.org/obo/BFO_[example_id]",
      "url_example" : "http://purl.obolibrary.org/obo/BFO_0000066",
      "datatype" : null,
      "generic_url" : "http://purl.obolibrary.org/obo/bfo",
      "abbreviation" : "BFO",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "issn" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.issn.org/",
      "abbreviation" : "ISSN",
      "url_example" : null,
      "url_syntax" : null,
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "International Standard Serial Number",
      "example_id" : "ISSN:1234-1231",
      "name" : null
   },
   "vmd" : {
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Virginia Bioinformatics Institute Microbial Database",
      "example_id" : "VMD:109198",
      "name" : null,
      "fullname" : null,
      "datatype" : null,
      "generic_url" : "http://phytophthora.vbi.vt.edu",
      "abbreviation" : "VMD",
      "url_example" : "http://vmd.vbi.vt.edu/cgi-bin/browse/browserDetail_new.cgi?gene_id=109198",
      "url_syntax" : "http://vmd.vbi.vt.edu/cgi-bin/browse/browserDetail_new.cgi?gene_id=[example_id]",
      "id" : null,
      "object" : null,
      "uri_prefix" : null
   },
   "ncbi_gi" : {
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=113194944",
      "abbreviation" : "NCBI_gi",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "name" : null,
      "example_id" : "NCBI_gi:113194944",
      "database" : "NCBI databases",
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "[0-9]{6,}",
      "fullname" : null
   },
   "tigr_tigrfams" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://search.jcvi.org/",
      "abbreviation" : "TIGR_TIGRFAMS",
      "url_syntax" : "http://search.jcvi.org/search?p&q=[example_id]",
      "url_example" : "http://search.jcvi.org/search?p&q=TIGR00254",
      "fullname" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "name" : null,
      "example_id" : "JCVI_TIGRFAMS:TIGR00254",
      "database" : "TIGRFAMs HMM collection at the J. Craig Venter Institute"
   },
   "jcvi_medtr" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "abbreviation" : "JCVI_Medtr",
      "generic_url" : "http://medicago.jcvi.org/cgi-bin/medicago/overview.cgi",
      "url_example" : "http://medicago.jcvi.org/cgi-bin/medicago/search/shared/ORF_infopage.cgi?orf=Medtr5g024510",
      "url_syntax" : "http://medicago.jcvi.org/cgi-bin/medicago/search/shared/ORF_infopage.cgi?orf=[example_id]",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Medicago truncatula genome database at the J. Craig Venter Institute",
      "example_id" : "JCVI_Medtr:Medtr5g024510",
      "name" : null
   },
   "ncbi" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "abbreviation" : "NCBI",
      "datatype" : null,
      "url_example" : null,
      "url_syntax" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : null,
      "name" : null,
      "database" : "National Center for Biotechnology Information",
      "fullname" : null
   },
   "aspgd_ref" : {
      "example_id" : "AspGD_REF:90",
      "name" : null,
      "database" : "Aspergillus Genome Database",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/reference/reference.pl?dbid=90",
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "datatype" : null,
      "generic_url" : "http://www.aspergillusgenome.org/",
      "abbreviation" : "AspGD_REF",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "rhea" : {
      "description" : "Rhea is a freely available, manually annotated database of chemical reactions created in collaboration with the Swiss Institute of Bioinformatics (SIB).",
      "fullname" : null,
      "example_id" : "RHEA:25811",
      "name" : null,
      "database" : "Rhea, the Annotated Reactions Database",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://www.ebi.ac.uk/rhea/reaction.xhtml?id=25811",
      "url_syntax" : "http://www.ebi.ac.uk/rhea/reaction.xhtml?id=[example_id]",
      "datatype" : null,
      "generic_url" : "http://www.ebi.ac.uk/rhea/",
      "abbreviation" : "RHEA"
   },
   "prints" : {
      "fullname" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "example_id" : "PRINTS:PR00025",
      "database" : "PRINTS compendium of protein fingerprints",
      "name" : null,
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.bioinf.manchester.ac.uk/dbbrowser/PRINTS/",
      "abbreviation" : "PRINTS",
      "url_example" : "http://www.bioinf.manchester.ac.uk/cgi-bin/dbbrowser/sprint/searchprintss.cgi?display_opts=Prints&category=None&queryform=false&regexpr=off&prints_accn=PR00025",
      "url_syntax" : "http://www.bioinf.manchester.ac.uk/cgi-bin/dbbrowser/sprint/searchprintss.cgi?display_opts=Prints&category=None&queryform=false&regexpr=off&prints_accn=[example_id]"
   },
   "cl" : {
      "url_example" : "http://purl.obolibrary.org/obo/CL_0000041",
      "url_syntax" : "http://purl.obolibrary.org/obo/CL_[example_id]",
      "abbreviation" : "CL",
      "generic_url" : "http://cellontology.org",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "example_id" : "CL:0000041",
      "name" : null,
      "database" : "Cell Type Ontology",
      "entity_type" : "GO:0005623 ! cell",
      "local_id_syntax" : "[0-9]{7}",
      "fullname" : null
   },
   "doi" : {
      "example_id" : "DOI:10.1016/S0963-9969(99)00021-6",
      "name" : null,
      "database" : "Digital Object Identifier",
      "entity_type" : "BET:0000000 ! entity",
      "local_id_syntax" : "10\\.[0-9]+\\/.*",
      "fullname" : null,
      "url_example" : "http://dx.doi.org/DOI:10.1016/S0963-9969(99)00021-6",
      "url_syntax" : "http://dx.doi.org/DOI:[example_id]",
      "datatype" : null,
      "generic_url" : "http://dx.doi.org/",
      "abbreviation" : "DOI",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "mengo" : {
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : null,
      "database" : "Microbial ENergy processes Gene Ontology Project",
      "name" : null,
      "fullname" : null,
      "abbreviation" : "MENGO",
      "generic_url" : "http://mengo.vbi.vt.edu/",
      "datatype" : null,
      "url_example" : null,
      "url_syntax" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "echobase" : {
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "EchoBASE",
      "generic_url" : "http://www.ecoli-york.org/",
      "datatype" : null,
      "url_syntax" : "http://www.biolws1.york.ac.uk/echobase/Gene.cfm?recordID=[example_id]",
      "url_example" : "http://www.biolws1.york.ac.uk/echobase/Gene.cfm?recordID=EB0231",
      "fullname" : null,
      "local_id_syntax" : "EB[0-9]{4}",
      "entity_type" : "SO:0000704 ! gene",
      "name" : null,
      "example_id" : "EchoBASE:EB0231",
      "database" : "EchoBASE post-genomic database for Escherichia coli"
   },
   "mim" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=OMIM",
      "abbreviation" : "MIM",
      "datatype" : null,
      "url_syntax" : "http://omim.org/entry/[example_id]",
      "url_example" : "http://omim.org/entry/190198",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Mendelian Inheritance in Man",
      "name" : null,
      "example_id" : "OMIM:190198",
      "fullname" : null
   },
   "pompep" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : null,
      "url_syntax" : null,
      "datatype" : null,
      "abbreviation" : "Pompep",
      "generic_url" : "ftp://ftp.sanger.ac.uk/pub/yeast/pombe/Protein_data/",
      "fullname" : null,
      "database" : "Schizosaccharomyces pombe protein data",
      "example_id" : "Pompep:SPAC890.04C",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "pdb" : {
      "fullname" : null,
      "local_id_syntax" : "[A-Za-z0-9]{4}",
      "entity_type" : "PR:000000001 ! protein",
      "example_id" : "PDB:1A4U",
      "name" : null,
      "database" : "Protein Data Bank",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "abbreviation" : "PDB",
      "generic_url" : "http://www.rcsb.org/pdb/",
      "url_example" : "http://www.rcsb.org/pdb/cgi/explore.cgi?pdbId=1A4U",
      "url_syntax" : "http://www.rcsb.org/pdb/cgi/explore.cgi?pdbId=[example_id]"
   },
   "jcvi" : {
      "database" : "J. Craig Venter Institute",
      "example_id" : null,
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "abbreviation" : "JCVI",
      "generic_url" : "http://www.jcvi.org/",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "kegg_pathway" : {
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "KEGG_PATHWAY:ot00020",
      "database" : "KEGG Pathways Database",
      "name" : null,
      "fullname" : null,
      "abbreviation" : "KEGG_PATHWAY",
      "generic_url" : "http://www.genome.jp/kegg/pathway.html",
      "datatype" : null,
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?path:ot00020",
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?path:[example_id]",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "prow" : {
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : null,
      "database" : "Protein Reviews on the Web",
      "fullname" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/prow/",
      "abbreviation" : "PROW",
      "datatype" : null,
      "url_syntax" : null,
      "url_example" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "cgsc" : {
      "fullname" : null,
      "example_id" : "CGSC:rbsK",
      "name" : null,
      "database" : "CGSC",
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : null,
      "url_example" : "http://cgsc.biology.yale.edu/Site.php?ID=315",
      "generic_url" : "http://cgsc.biology.yale.edu/",
      "abbreviation" : "CGSC",
      "datatype" : null
   },
   "enzyme" : {
      "fullname" : null,
      "database" : "Swiss Institute of Bioinformatics enzyme database",
      "example_id" : "ENZYME:EC 1.1.1.1",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://www.expasy.ch/cgi-bin/nicezyme.pl?1.1.1.1",
      "url_syntax" : "http://www.expasy.ch/cgi-bin/nicezyme.pl?[example_id]",
      "datatype" : null,
      "abbreviation" : "ENZYME",
      "generic_url" : "http://www.expasy.ch/"
   },
   "tigr_egad" : {
      "entity_type" : "PR:000000001 ! protein",
      "name" : null,
      "database" : "EGAD database at the J. Craig Venter Institute",
      "example_id" : "JCVI_CMR:VCA0557",
      "fullname" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "abbreviation" : "TIGR_EGAD",
      "datatype" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=[example_id]",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=VCA0557",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "um-bbd_ruleid" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/rule.jsp?rule=[example_id]",
      "url_example" : "http://umbbd.msi.umn.edu/servlets/rule.jsp?rule=bt0330",
      "datatype" : null,
      "abbreviation" : "UM-BBD_ruleID",
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "fullname" : null,
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "example_id" : "UM-BBD_ruleID:bt0330",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "spd" : {
      "url_syntax" : "http://www.riken.jp/SPD/[example_id].html",
      "url_example" : "http://www.riken.jp/SPD/05/05F01.html",
      "datatype" : null,
      "generic_url" : "http://www.riken.jp/SPD/",
      "abbreviation" : "SPD",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "Schizosaccharomyces pombe Postgenome Database at RIKEN; includes Orfeome Localisation data",
      "example_id" : "SPD:05/05F01",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "local_id_syntax" : "[0-9]{2}/[0-9]{2}[A-Z][0-9]{2}",
      "fullname" : null
   },
   "metacyc" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://biocyc.org/META/NEW-IMAGE?type=NIL&object=GLUTDEG-PWY",
      "url_syntax" : "http://biocyc.org/META/NEW-IMAGE?type=NIL&object=[example_id]",
      "datatype" : null,
      "generic_url" : "http://metacyc.org/",
      "abbreviation" : "MetaCyc",
      "fullname" : null,
      "name" : null,
      "example_id" : "MetaCyc:GLUTDEG-PWY",
      "database" : "Metabolic Encyclopedia of metabolic and other pathways",
      "entity_type" : "BET:0000000 ! entity"
   },
   "maizegdb_locus" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://www.maizegdb.org/cgi-bin/displaylocusresults.cgi?term=ZmPK1",
      "url_syntax" : "http://www.maizegdb.org/cgi-bin/displaylocusresults.cgi?term=[example_id]",
      "abbreviation" : "MaizeGDB_Locus",
      "generic_url" : "http://www.maizegdb.org",
      "datatype" : null,
      "local_id_syntax" : "[A-Za-z][A-Za-z0-9]*",
      "fullname" : null,
      "database" : "MaizeGDB",
      "example_id" : "MaizeGDB_Locus:ZmPK1",
      "name" : null,
      "entity_type" : "SO:0000704 ! gene"
   },
   "pubchem_compound" : {
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "example_id" : "PubChem_Compound:2244",
      "database" : "NCBI PubChem database of chemical structures",
      "name" : null,
      "fullname" : null,
      "local_id_syntax" : "[0-9]+",
      "abbreviation" : "PubChem_Compound",
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pccompound&term=[example_id]",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pccompound&term=2244",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "goc" : {
      "datatype" : null,
      "generic_url" : "http://www.geneontology.org/",
      "abbreviation" : "GOC",
      "url_example" : null,
      "url_syntax" : null,
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : null,
      "database" : "Gene Ontology Consortium",
      "fullname" : null
   },
   "pir" : {
      "example_id" : "PIR:I49499",
      "name" : null,
      "database" : "Protein Information Resource",
      "entity_type" : "PR:000000001 ! protein",
      "local_id_syntax" : "[A-Z]{1}[0-9]{5}",
      "fullname" : null,
      "url_syntax" : "http://pir.georgetown.edu/cgi-bin/pirwww/nbrfget?uid=[example_id]",
      "url_example" : "http://pir.georgetown.edu/cgi-bin/pirwww/nbrfget?uid=I49499",
      "generic_url" : "http://pir.georgetown.edu/",
      "abbreviation" : "PIR",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "uniprotkb-subcell" : {
      "datatype" : null,
      "generic_url" : "http://www.uniprot.org/locations/",
      "abbreviation" : "UniProtKB-SubCell",
      "url_example" : "http://www.uniprot.org/locations/SL-0012",
      "url_syntax" : "http://www.uniprot.org/locations/[example_id]",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "UniProtKB-SubCell:SL-0012",
      "database" : "UniProt Knowledgebase Subcellular Location vocabulary",
      "name" : null,
      "fullname" : null
   },
   "ecogene" : {
      "datatype" : null,
      "abbreviation" : "ECOGENE",
      "generic_url" : "http://www.ecogene.org/",
      "url_example" : "http://www.ecogene.org/geneInfo.php?eg_id=EG10818",
      "url_syntax" : "http://www.ecogene.org/geneInfo.php?eg_id=[example_id]",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "SO:0000704 ! gene",
      "example_id" : "ECOGENE:EG10818",
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "name" : null,
      "fullname" : null,
      "local_id_syntax" : "EG[0-9]{5}"
   },
   "jcvi_tigrfams" : {
      "entity_type" : "SO:0000839 ! polypeptide region",
      "example_id" : "JCVI_TIGRFAMS:TIGR00254",
      "database" : "TIGRFAMs HMM collection at the J. Craig Venter Institute",
      "name" : null,
      "fullname" : null,
      "datatype" : null,
      "generic_url" : "http://search.jcvi.org/",
      "abbreviation" : "JCVI_TIGRFAMS",
      "url_syntax" : "http://search.jcvi.org/search?p&q=[example_id]",
      "url_example" : "http://search.jcvi.org/search?p&q=TIGR00254",
      "id" : null,
      "object" : null,
      "uri_prefix" : null
   },
   "pato" : {
      "name" : null,
      "example_id" : "PATO:0001420",
      "database" : "Phenotypic quality ontology",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_example" : null,
      "url_syntax" : null,
      "datatype" : null,
      "abbreviation" : "PATO",
      "generic_url" : "http://www.bioontology.org/wiki/index.php/PATO:Main_Page",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "genedb" : {
      "datatype" : null,
      "abbreviation" : "GeneDB",
      "generic_url" : "http://www.genedb.org/gene/",
      "url_syntax" : "http://www.genedb.org/gene/[example_id]",
      "url_example" : "http://www.genedb.org/gene/PF3D7_1467300",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "SO:0000704 ! gene",
      "name" : null,
      "example_id" : "PF3D7_1467300",
      "database" : "GeneDB",
      "fullname" : null,
      "local_id_syntax" : "((LmjF|LinJ|LmxM)\\.[0-9]{2}\\.[0-9]{4})|(PF3D7_[0-9]{7})|(Tb[0-9]+\\.[A-Za-z0-9]+\\.[0-9]+)|(TcCLB\\.[0-9]{6}\\.[0-9]+)"
   },
   "apidb_plasmodb" : {
      "fullname" : null,
      "database" : "PlasmoDB Plasmodium Genome Resource",
      "example_id" : "ApiDB_PlasmoDB:PF11_0344",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : "http://www.plasmodb.org/gene/[example_id]",
      "url_example" : "http://www.plasmodb.org/gene/PF11_0344",
      "generic_url" : "http://plasmodb.org/",
      "abbreviation" : "ApiDB_PlasmoDB",
      "datatype" : null
   },
   "cbs" : {
      "fullname" : null,
      "name" : null,
      "example_id" : "CBS:TMHMM",
      "database" : "Center for Biological Sequence Analysis",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://www.cbs.dtu.dk/services/[example_id]/",
      "url_syntax" : null,
      "datatype" : null,
      "abbreviation" : "CBS",
      "generic_url" : "http://www.cbs.dtu.dk/"
   },
   "tigr" : {
      "fullname" : null,
      "name" : null,
      "database" : "J. Craig Venter Institute",
      "example_id" : null,
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : null,
      "url_syntax" : null,
      "generic_url" : "http://www.jcvi.org/",
      "abbreviation" : "TIGR",
      "datatype" : null
   },
   "cgdid" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=CAL0005516",
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "datatype" : null,
      "abbreviation" : "CGDID",
      "generic_url" : "http://www.candidagenome.org/",
      "local_id_syntax" : "(CAL|CAF)[0-9]{7}",
      "fullname" : null,
      "name" : null,
      "database" : "Candida Genome Database",
      "example_id" : "CGD:CAL0005516",
      "entity_type" : "SO:0000704 ! gene"
   },
   "broad" : {
      "example_id" : null,
      "name" : null,
      "database" : "Broad Institute",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "generic_url" : "http://www.broad.mit.edu/",
      "abbreviation" : "Broad",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "ddb" : {
      "local_id_syntax" : "DDB_G[0-9]{7}",
      "fullname" : null,
      "example_id" : "dictyBase:DDB_G0277859",
      "database" : "dictyBase",
      "name" : null,
      "entity_type" : "SO:0000704 ! gene",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "url_example" : "http://dictybase.org/gene/DDB_G0277859",
      "datatype" : null,
      "abbreviation" : "DDB",
      "generic_url" : "http://dictybase.org"
   },
   "fypo" : {
      "example_id" : "FYPO:0000001",
      "database" : "Fission Yeast Phenotype Ontology",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "local_id_syntax" : "\\d{7}",
      "fullname" : null,
      "url_example" : null,
      "url_syntax" : null,
      "abbreviation" : "FYPO",
      "generic_url" : "http://www.pombase.org/",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "poc" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : null,
      "url_example" : null,
      "generic_url" : "http://www.plantontology.org/",
      "abbreviation" : "POC",
      "datatype" : null,
      "fullname" : null,
      "example_id" : null,
      "name" : null,
      "database" : "Plant Ontology Consortium",
      "entity_type" : "BET:0000000 ! entity"
   },
   "go" : {
      "fullname" : null,
      "local_id_syntax" : "\\d{7}",
      "entity_type" : "GO:0032991 ! macromolecular complex",
      "example_id" : "GO:0004352",
      "name" : null,
      "database" : "Gene Ontology Database",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "abbreviation" : "GO",
      "generic_url" : "http://amigo.geneontology.org/",
      "url_syntax" : "http://amigo.geneontology.org/amigo/term/GO:[example_id]",
      "url_example" : "http://amigo.geneontology.org/amigo/term/GO:0004352"
   },
   "eck" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : "http://www.ecogene.org/geneInfo.php?eck_id=[example_id]",
      "url_example" : "http://www.ecogene.org/geneInfo.php?eck_id=ECK3746",
      "datatype" : null,
      "abbreviation" : "ECK",
      "generic_url" : "http://www.ecogene.org/",
      "local_id_syntax" : "ECK[0-9]{4}",
      "fullname" : null,
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "example_id" : "ECK:ECK3746",
      "name" : null,
      "entity_type" : "SO:0000704 ! gene"
   },
   "sabio-rk" : {
      "url_example" : "http://sabio.villa-bosch.de/reacdetails.jsp?reactid=1858",
      "url_syntax" : "http://sabio.villa-bosch.de/reacdetails.jsp?reactid=[example_id]",
      "datatype" : null,
      "generic_url" : "http://sabio.villa-bosch.de/",
      "abbreviation" : "SABIO-RK",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "SABIO Reaction Kinetics",
      "example_id" : "SABIO-RK:1858",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "description" : "The SABIO-RK (System for the Analysis of Biochemical Pathways - Reaction Kinetics) is a web-based application based on the SABIO relational database that contains information about biochemical reactions, their kinetic equations with their parameters, and the experimental conditions under which these parameters were measured.",
      "fullname" : null
   },
   "agbase" : {
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : null,
      "name" : null,
      "database" : "AgBase resource for functional analysis of agricultural plant and animal gene products",
      "fullname" : null,
      "generic_url" : "http://www.agbase.msstate.edu/",
      "abbreviation" : "AgBase",
      "datatype" : null,
      "url_example" : null,
      "url_syntax" : "http://www.agbase.msstate.edu/cgi-bin/getEntry.pl?db_pick=[ChickGO/MaizeGO]&uid=[example_id]",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "yeastfunc" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : null,
      "database" : "Yeast Function",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://func.med.harvard.edu/yeast/",
      "abbreviation" : "YeastFunc",
      "datatype" : null,
      "url_syntax" : null,
      "url_example" : null
   },
   "biosis" : {
      "url_example" : null,
      "url_syntax" : null,
      "datatype" : null,
      "abbreviation" : "BIOSIS",
      "generic_url" : "http://www.biosis.org/",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "name" : null,
      "example_id" : "BIOSIS:200200247281",
      "database" : "BIOSIS previews",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "ntnu_sb" : {
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : null,
      "name" : null,
      "database" : "Norwegian University of Science and Technology, Systems Biology team",
      "fullname" : null,
      "generic_url" : "http://www.ntnu.edu/nt/systemsbiology",
      "abbreviation" : "NTNU_SB",
      "datatype" : null,
      "url_example" : null,
      "url_syntax" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "subtilistg" : {
      "database" : "Bacillus subtilis Genome Sequence Project",
      "example_id" : "SUBTILISTG:accC",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_example" : null,
      "url_syntax" : null,
      "datatype" : null,
      "abbreviation" : "SUBTILISTG",
      "generic_url" : "http://genolist.pasteur.fr/SubtiList/",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "dflat" : {
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "abbreviation" : "DFLAT",
      "generic_url" : "http://bcb.cs.tufts.edu/dflat/",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "example_id" : null,
      "name" : null,
      "database" : "Developmental FunctionaL Annotation at Tufts",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "sgn_ref" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "SGN_ref:861",
      "name" : null,
      "database" : "Sol Genomics Network",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.sgn.cornell.edu/",
      "abbreviation" : "SGN_ref",
      "url_example" : "http://www.sgn.cornell.edu/chado/publication.pl?pub_id=861",
      "url_syntax" : "http://www.sgn.cornell.edu/chado/publication.pl?pub_id=[example_id]"
   },
   "rgd" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://rgd.mcw.edu/",
      "abbreviation" : "RGD",
      "url_syntax" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=[example_id]",
      "url_example" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=2004",
      "fullname" : null,
      "local_id_syntax" : "[0-9]{4,7}",
      "entity_type" : "SO:0000704 ! gene",
      "example_id" : "RGD:2004",
      "database" : "Rat Genome Database",
      "name" : null
   },
   "sp_sl" : {
      "url_example" : "http://www.uniprot.org/locations/SL-0012",
      "url_syntax" : "http://www.uniprot.org/locations/[example_id]",
      "generic_url" : "http://www.uniprot.org/locations/",
      "abbreviation" : "SP_SL",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "database" : "UniProt Knowledgebase Subcellular Location vocabulary",
      "name" : null,
      "example_id" : "UniProtKB-SubCell:SL-0012",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "h-invdb" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : null,
      "database" : "H-invitational Database",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://www.h-invitational.jp/",
      "abbreviation" : "H-invDB",
      "datatype" : null,
      "url_example" : null,
      "url_syntax" : null
   },
   "sgn" : {
      "fullname" : null,
      "example_id" : "SGN:4476",
      "name" : null,
      "database" : "Sol Genomics Network",
      "entity_type" : "SO:0000704 ! gene",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://www.sgn.cornell.edu/phenome/locus_display.pl?locus_id=4476",
      "url_syntax" : "http://www.sgn.cornell.edu/phenome/locus_display.pl?locus_id=[example_id]",
      "generic_url" : "http://www.sgn.cornell.edu/",
      "abbreviation" : "SGN",
      "datatype" : null
   },
   "pinc" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : null,
      "url_syntax" : null,
      "generic_url" : "http://www.proteome.com/",
      "abbreviation" : "PINC",
      "datatype" : null,
      "fullname" : null,
      "description" : "represents GO annotations created in 2001 for NCBI and extracted into UniProtKB-GOA from EntrezGene",
      "name" : null,
      "example_id" : null,
      "database" : "Proteome Inc.",
      "entity_type" : "BET:0000000 ! entity"
   },
   "bhf-ucl" : {
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "abbreviation" : "BHF-UCL",
      "generic_url" : "http://www.ucl.ac.uk/cardiovasculargeneontology/",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "example_id" : null,
      "name" : null,
      "database" : "Cardiovascular Gene Ontology Annotation Initiative",
      "entity_type" : "BET:0000000 ! entity",
      "description" : "The Cardiovascular Gene Ontology Annotation Initiative is supported by the British Heart Foundation (BHF) and located at University College London (UCL).",
      "fullname" : null
   },
   "imgt_ligm" : {
      "example_id" : "IMGT_LIGM:U03895",
      "database" : "ImMunoGeneTics database covering immunoglobulins and T-cell receptors",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "description" : "Database of immunoglobulins and T cell receptors from human and other vertebrates, with translation for fully annotated sequences.",
      "fullname" : null,
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "generic_url" : "http://imgt.cines.fr",
      "abbreviation" : "IMGT_LIGM",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "tgd_locus" : {
      "fullname" : null,
      "database" : "Tetrahymena Genome Database",
      "example_id" : "TGD_LOCUS:PDD1",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://db.ciliate.org/cgi-bin/locus.pl?locus=PDD1",
      "url_syntax" : "http://db.ciliate.org/cgi-bin/locus.pl?locus=[example_id]",
      "generic_url" : "http://www.ciliate.org/",
      "abbreviation" : "TGD_LOCUS",
      "datatype" : null
   },
   "nc-iubmb" : {
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Nomenclature Committee of the International Union of Biochemistry and Molecular Biology",
      "example_id" : null,
      "name" : null,
      "fullname" : null,
      "datatype" : null,
      "generic_url" : "http://www.chem.qmw.ac.uk/iubmb/",
      "abbreviation" : "NC-IUBMB",
      "url_example" : null,
      "url_syntax" : null,
      "id" : null,
      "object" : null,
      "uri_prefix" : null
   },
   "interpro" : {
      "local_id_syntax" : "IPR\\d{6}",
      "fullname" : null,
      "example_id" : "InterPro:IPR000001",
      "database" : "InterPro database of protein domains and motifs",
      "name" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : "http://www.ebi.ac.uk/interpro/entry/[example_id]",
      "url_example" : "http://www.ebi.ac.uk/interpro/entry/IPR015421",
      "datatype" : null,
      "generic_url" : "http://www.ebi.ac.uk/interpro/",
      "abbreviation" : "INTERPRO"
   },
   "img" : {
      "fullname" : null,
      "example_id" : "IMG:640008772",
      "name" : null,
      "database" : "Integrated Microbial Genomes; JGI web site for genome annotation",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://img.jgi.doe.gov/cgi-bin/pub/main.cgi?section=GeneDetail&page=geneDetail&gene_oid=640008772",
      "url_syntax" : "http://img.jgi.doe.gov/cgi-bin/pub/main.cgi?section=GeneDetail&page=geneDetail&gene_oid=[example_id]",
      "datatype" : null,
      "abbreviation" : "IMG",
      "generic_url" : "http://img.jgi.doe.gov"
   },
   "hamap" : {
      "url_syntax" : "http://hamap.expasy.org/unirule/[example_id]",
      "url_example" : "http://hamap.expasy.org/unirule/MF_00131",
      "generic_url" : "http://hamap.expasy.org/",
      "abbreviation" : "HAMAP",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "example_id" : "HAMAP:MF_00031",
      "name" : null,
      "database" : "High-quality Automated and Manual Annotation of microbial Proteomes",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "aspgd_locus" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Aspergillus Genome Database",
      "example_id" : "AspGD_LOCUS:AN10942",
      "name" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "AspGD_LOCUS",
      "generic_url" : "http://www.aspergillusgenome.org/",
      "datatype" : null,
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?locus=AN10942",
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?locus=[example_id]"
   },
   "biomdid" : {
      "url_syntax" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=[example_id]",
      "url_example" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=BIOMD0000000045",
      "datatype" : null,
      "generic_url" : "http://www.ebi.ac.uk/biomodels/",
      "abbreviation" : "BIOMDID",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "example_id" : "BIOMD:BIOMD0000000045",
      "database" : "BioModels Database",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "ensembl" : {
      "fullname" : null,
      "local_id_syntax" : "ENS[A-Z0-9]{10,17}",
      "entity_type" : "SO:0000673 ! transcript",
      "name" : null,
      "database" : "Ensembl database of automatically annotated genomic data",
      "example_id" : "ENSEMBL:ENSP00000265949",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.ensembl.org/",
      "abbreviation" : "Ensembl",
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "url_example" : "http://www.ensembl.org/id/ENSP00000265949"
   },
   "wbls" : {
      "database" : "C. elegans development",
      "example_id" : "WBls:0000010",
      "name" : null,
      "entity_type" : "WBls:0000075 ! nematoda life stage",
      "local_id_syntax" : "[0-9]{7}",
      "fullname" : null,
      "url_example" : null,
      "url_syntax" : null,
      "datatype" : null,
      "generic_url" : "http://www.wormbase.org/",
      "abbreviation" : "WBls",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "coriell" : {
      "url_example" : "http://ccr.coriell.org/Sections/Search/Sample_Detail.aspx?Ref=GM07892",
      "url_syntax" : "http://ccr.coriell.org/Sections/Search/Sample_Detail.aspx?Ref=[example_id]",
      "datatype" : null,
      "abbreviation" : "CORIELL",
      "generic_url" : "http://ccr.coriell.org/",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "Coriell Institute for Medical Research",
      "example_id" : "GM07892",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "description" : "The Coriell Cell Repositories provide essential research reagents to the scientific community by establishing, verifying, maintaining, and distributing cell cultures and DNA derived from cell cultures. These collections, supported by funds from the National Institutes of Health (NIH) and several foundations, are extensively utilized by research scientists around the world.",
      "fullname" : null
   },
   "taxon" : {
      "name" : null,
      "example_id" : "taxon:7227",
      "database" : "NCBI Taxonomy",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "abbreviation" : "taxon",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "smart" : {
      "fullname" : null,
      "name" : null,
      "example_id" : "SMART:SM00005",
      "database" : "Simple Modular Architecture Research Tool",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://smart.embl-heidelberg.de/smart/do_annotation.pl?BLAST=DUMMY&DOMAIN=SM00005",
      "url_syntax" : "http://smart.embl-heidelberg.de/smart/do_annotation.pl?BLAST=DUMMY&DOMAIN=[example_id]",
      "datatype" : null,
      "generic_url" : "http://smart.embl-heidelberg.de/",
      "abbreviation" : "SMART"
   },
   "tc" : {
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "example_id" : "TC:9.A.4.1.1",
      "name" : null,
      "database" : "Transport Protein Database",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://www.tcdb.org/",
      "abbreviation" : "TC",
      "datatype" : null,
      "url_example" : "http://www.tcdb.org/tcdb/index.php?tc=9.A.4.1.1",
      "url_syntax" : "http://www.tcdb.org/tcdb/index.php?tc=[example_id]"
   },
   "paint_ref" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://www.geneontology.org/gene-associations/submission/paint/PTHR10046/PTHR10046.txt",
      "url_syntax" : "http://www.geneontology.org/gene-associations/submission/paint/[example_id]/[example_id].txt",
      "abbreviation" : "PAINT_REF",
      "generic_url" : "http://www.pantherdb.org/",
      "datatype" : null,
      "fullname" : null,
      "example_id" : "PAINT_REF:PTHR10046",
      "database" : "Phylogenetic Annotation INference Tool References",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "nmpdr" : {
      "fullname" : null,
      "name" : null,
      "example_id" : "NMPDR:fig|306254.1.peg.183",
      "database" : "National Microbial Pathogen Data Resource",
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : "http://www.nmpdr.org/linkin.cgi?id=[example_id]",
      "url_example" : "http://www.nmpdr.org/linkin.cgi?id=fig|306254.1.peg.183",
      "abbreviation" : "NMPDR",
      "generic_url" : "http://www.nmpdr.org",
      "datatype" : null
   },
   "jcvi_ref" : {
      "abbreviation" : "JCVI_REF",
      "generic_url" : "http://cmr.jcvi.org/",
      "datatype" : null,
      "url_syntax" : null,
      "url_example" : "http://cmr.jcvi.org/CMR/AnnotationSops.shtml",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : "JCVI_REF:GO_ref",
      "database" : "J. Craig Venter Institute",
      "fullname" : null
   },
   "tgd_ref" : {
      "datatype" : null,
      "generic_url" : "http://www.ciliate.org/",
      "abbreviation" : "TGD_REF",
      "url_syntax" : "http://db.ciliate.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "url_example" : "http://db.ciliate.org/cgi-bin/reference/reference.pl?dbid=T000005818",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Tetrahymena Genome Database",
      "example_id" : "TGD_REF:T000005818",
      "name" : null,
      "fullname" : null
   },
   "uniprot" : {
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "UniProt",
      "generic_url" : "http://www.uniprot.org",
      "datatype" : null,
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "fullname" : null,
      "description" : "A central repository of protein sequence and function created by joining the information contained in Swiss-Prot, TrEMBL, and PIR database",
      "local_id_syntax" : "([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z]([0-9][A-Z][A-Z0-9]{2}){1,2}[0-9])((-[0-9]+)|:PRO_[0-9]{10}|:VAR_[0-9]{6}){0,1}",
      "entity_type" : "PR:000000001 ! protein",
      "database" : "Universal Protein Knowledgebase",
      "name" : null,
      "example_id" : "UniProtKB:P51587"
   },
   "ncbi_gene" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "datatype" : null,
      "abbreviation" : "NCBI_Gene",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "local_id_syntax" : "\\d+",
      "fullname" : null,
      "database" : "NCBI Gene",
      "example_id" : "NCBI_Gene:4771",
      "name" : null,
      "entity_type" : "SO:0000704 ! gene"
   },
   "ptarget" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : null,
      "database" : "pTARGET Prediction server for protein subcellular localization",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "pTARGET",
      "generic_url" : "http://bioinformatics.albany.edu/~ptarget/",
      "datatype" : null,
      "url_example" : null,
      "url_syntax" : null
   },
   "fbbt" : {
      "url_example" : "http://flybase.org/cgi-bin/fbcvq.html?query=FBbt:00005177",
      "url_syntax" : "http://flybase.org/cgi-bin/fbcvq.html?query=FBbt:[example_id]",
      "datatype" : null,
      "generic_url" : "http://flybase.org/",
      "abbreviation" : "FBbt",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "name" : null,
      "example_id" : "FBbt:00005177",
      "database" : "Drosophila gross anatomy",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "jstor" : {
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Digital archive of scholarly articles",
      "example_id" : "JSTOR:3093870",
      "name" : null,
      "fullname" : null,
      "datatype" : null,
      "abbreviation" : "JSTOR",
      "generic_url" : "http://www.jstor.org/",
      "url_syntax" : "http://www.jstor.org/stable/[example_id]",
      "url_example" : "http://www.jstor.org/stable/3093870",
      "id" : null,
      "object" : null,
      "uri_prefix" : null
   },
   "rgdid" : {
      "url_example" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=2004",
      "url_syntax" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=[example_id]",
      "generic_url" : "http://rgd.mcw.edu/",
      "abbreviation" : "RGDID",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "name" : null,
      "database" : "Rat Genome Database",
      "example_id" : "RGD:2004",
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "[0-9]{4,7}",
      "fullname" : null
   },
   "refgenome" : {
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "generic_url" : "http://www.geneontology.org/GO.refgenome.shtml",
      "abbreviation" : "RefGenome",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "example_id" : null,
      "database" : "GO Reference Genomes",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "mesh" : {
      "url_syntax" : "http://www.nlm.nih.gov/cgi/mesh/2005/MB_cgi?mode=&term=[example_id]",
      "url_example" : "http://www.nlm.nih.gov/cgi/mesh/2005/MB_cgi?mode=&term=mitosis",
      "generic_url" : "http://www.nlm.nih.gov/mesh/2005/MBrowser.html",
      "abbreviation" : "MeSH",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "name" : null,
      "example_id" : "MeSH:mitosis",
      "database" : "Medical Subject Headings",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "isbn" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : "ISBN:0781702534",
      "database" : "International Standard Book Number",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://isbntools.com/",
      "abbreviation" : "ISBN",
      "datatype" : null,
      "url_syntax" : "https://en.wikipedia.org/w/index.php?title=Special%3ABookSources&isbn=[example_id]",
      "url_example" : "https://en.wikipedia.org/w/index.php?title=Special%3ABookSources&isbn=0123456789"
   },
   "alzheimers_university_of_toronto" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Alzheimers Project at University of Toronto",
      "example_id" : null,
      "name" : null,
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.ims.utoronto.ca/",
      "abbreviation" : "Alzheimers_University_of_Toronto",
      "url_example" : null,
      "url_syntax" : null
   },
   "agricola_ind" : {
      "datatype" : null,
      "abbreviation" : "AGRICOLA_IND",
      "generic_url" : "http://agricola.nal.usda.gov/",
      "url_example" : null,
      "url_syntax" : null,
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "AGRICultural OnLine Access",
      "example_id" : "AGRICOLA_IND:IND23252955",
      "name" : null,
      "fullname" : null
   },
   "nasc_code" : {
      "url_example" : "http://seeds.nottingham.ac.uk/NASC/stockatidb.lasso?code=N3371",
      "url_syntax" : "http://seeds.nottingham.ac.uk/NASC/stockatidb.lasso?code=[example_id]",
      "abbreviation" : "NASC_code",
      "generic_url" : "http://arabidopsis.info",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "name" : null,
      "example_id" : "NASC_code:N3371",
      "database" : "Nottingham Arabidopsis Stock Centre Seeds Database",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "cgd" : {
      "entity_type" : "SO:0000704 ! gene",
      "example_id" : "CGD:CAL0005516",
      "database" : "Candida Genome Database",
      "name" : null,
      "fullname" : null,
      "local_id_syntax" : "(CAL|CAF)[0-9]{7}",
      "abbreviation" : "CGD",
      "generic_url" : "http://www.candidagenome.org/",
      "datatype" : null,
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=CAL0005516",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "wb_ref" : {
      "datatype" : null,
      "abbreviation" : "WB_REF",
      "generic_url" : "http://www.wormbase.org/",
      "url_syntax" : "http://www.wormbase.org/db/misc/paper?name=[example_id]",
      "url_example" : "http://www.wormbase.org/db/misc/paper?name=WBPaper00004823",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "WB_REF:WBPaper00004823",
      "database" : "WormBase database of nematode biology",
      "name" : null,
      "fullname" : null
   },
   "mips_funcat" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://mips.gsf.de/cgi-bin/proj/funcatDB/search_advanced.pl?action=2&wert=11.02",
      "url_syntax" : "http://mips.gsf.de/cgi-bin/proj/funcatDB/search_advanced.pl?action=2&wert=[example_id]",
      "abbreviation" : "MIPS_funcat",
      "generic_url" : "http://mips.gsf.de/proj/funcatDB/",
      "datatype" : null,
      "fullname" : null,
      "name" : null,
      "example_id" : "MIPS_funcat:11.02",
      "database" : "MIPS Functional Catalogue",
      "entity_type" : "BET:0000000 ! entity"
   },
   "hpa" : {
      "database" : "Human Protein Atlas tissue profile information",
      "example_id" : "HPA:HPA000237",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_syntax" : "http://www.proteinatlas.org/tissue_profile.php?antibody_id=[example_id]",
      "url_example" : "http://www.proteinatlas.org/tissue_profile.php?antibody_id=HPA000237",
      "abbreviation" : "HPA",
      "generic_url" : "http://www.proteinatlas.org/",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "dbsnp" : {
      "local_id_syntax" : "\\d+",
      "fullname" : null,
      "example_id" : "dbSNP:rs3131969",
      "name" : null,
      "database" : "NCBI dbSNP",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=[example_id]",
      "url_example" : "http://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=rs3131969",
      "datatype" : null,
      "abbreviation" : "dbSNP",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/projects/SNP"
   },
   "gr_qtl" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : "http://www.gramene.org/db/qtl/qtl_display?qtl_accession_id=[example_id]",
      "url_example" : "http://www.gramene.org/db/qtl/qtl_display?qtl_accession_id=CQU7",
      "datatype" : null,
      "generic_url" : "http://www.gramene.org/",
      "abbreviation" : "GR_QTL",
      "fullname" : null,
      "example_id" : "GR_QTL:CQU7",
      "name" : null,
      "database" : "Gramene",
      "entity_type" : "BET:0000000 ! entity"
   },
   "ec" : {
      "fullname" : null,
      "entity_type" : "GO:0003824 ! catalytic activity",
      "example_id" : "EC:1.4.3.6",
      "name" : null,
      "database" : "Enzyme Commission",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://www.chem.qmul.ac.uk/iubmb/enzyme/",
      "abbreviation" : "EC",
      "datatype" : null,
      "url_syntax" : "http://www.expasy.org/enzyme/[example_id]",
      "url_example" : "http://www.expasy.org/enzyme/1.4.3.6"
   },
   "mtbbase" : {
      "fullname" : null,
      "name" : null,
      "example_id" : null,
      "database" : "Collection and Refinement of Physiological Data on Mycobacterium tuberculosis",
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : null,
      "url_example" : null,
      "abbreviation" : "MTBBASE",
      "generic_url" : "http://www.ark.in-berlin.de/Site/MTBbase.html",
      "datatype" : null
   },
   "mod" : {
      "abbreviation" : "MOD",
      "generic_url" : "http://psidev.sourceforge.net/mod/",
      "datatype" : null,
      "url_example" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:00219",
      "url_syntax" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:[example_id]",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Proteomics Standards Initiative protein modification ontology",
      "name" : null,
      "example_id" : "MOD:00219",
      "fullname" : null
   },
   "muscletrait" : {
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "database" : "TRAnscript Integrated Table",
      "example_id" : null,
      "fullname" : null,
      "description" : "an integrated database of transcripts expressed in human skeletal muscle",
      "generic_url" : "http://muscle.cribi.unipd.it/",
      "abbreviation" : "MuscleTRAIT",
      "datatype" : null,
      "url_syntax" : null,
      "url_example" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "kegg_reaction" : {
      "database" : "KEGG Reaction Database",
      "example_id" : "KEGG:R02328",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "local_id_syntax" : "R\\d+",
      "fullname" : null,
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?rn:[example_id]",
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?rn:R02328",
      "generic_url" : "http://www.genome.jp/kegg/reaction/",
      "abbreviation" : "KEGG_REACTION",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "protein_id" : {
      "entity_type" : "PR:000000001 ! protein",
      "example_id" : "protein_id:CAA71991",
      "name" : null,
      "database" : "DDBJ / ENA / GenBank",
      "description" : "protein identifier shared by DDBJ/EMBL-bank/GenBank nucleotide sequence databases",
      "fullname" : null,
      "local_id_syntax" : "[A-Z]{3}[0-9]{5}(\\.[0-9]+)?",
      "datatype" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "abbreviation" : "protein_id",
      "url_example" : null,
      "url_syntax" : null,
      "id" : null,
      "object" : null,
      "uri_prefix" : null
   },
   "ipi" : {
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : "IPI:IPI00000005.1",
      "database" : "International Protein Index",
      "fullname" : null,
      "generic_url" : "http://www.ebi.ac.uk/IPI/IPIhelp.html",
      "abbreviation" : "IPI",
      "datatype" : null,
      "url_syntax" : null,
      "url_example" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "ensembl_geneid" : {
      "url_example" : "http://www.ensembl.org/id/ENSG00000126016",
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "abbreviation" : "ENSEMBL_GeneID",
      "generic_url" : "http://www.ensembl.org/",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "database" : "Ensembl database of automatically annotated genomic data",
      "example_id" : "ENSEMBL_GeneID:ENSG00000126016",
      "name" : null,
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "ENSG[0-9]{9,16}",
      "fullname" : null
   },
   "agricola_id" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "generic_url" : "http://agricola.nal.usda.gov/",
      "abbreviation" : "AGRICOLA_ID",
      "fullname" : null,
      "database" : "AGRICultural OnLine Access",
      "example_id" : "AGRICOLA_NAL:TP248.2 P76 v.14",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "h-invdb_locus" : {
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://www.h-invitational.jp/",
      "abbreviation" : "H-invDB_locus",
      "datatype" : null,
      "url_syntax" : "http://www.h-invitational.jp/hinv/spsoup/locus_view?hix_id=[example_id]",
      "url_example" : "http://www.h-invitational.jp/hinv/spsoup/locus_view?hix_id=HIX0014446",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "H-invDB_locus:HIX0014446",
      "name" : null,
      "database" : "H-invitational Database"
   },
   "aspgdid" : {
      "example_id" : "AspGD:ASPL0000067538",
      "name" : null,
      "database" : "Aspergillus Genome Database",
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "ASPL[0-9]{10}",
      "fullname" : null,
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=ASPL0000067538",
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "datatype" : null,
      "generic_url" : "http://www.aspergillusgenome.org/",
      "abbreviation" : "AspGDID",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "unigene" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/UniGene/clust.cgi?ORG=Hs&CID=212293",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/UniGene/clust.cgi?ORG=[organism_abbreviation]&CID=[cluster_id]",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/UniGene",
      "abbreviation" : "UniGene",
      "datatype" : null,
      "fullname" : null,
      "description" : "NCBI transcript cluster database, organized by transcriptome. Each UniGene entry is a set of transcript sequences that appear to come from the same transcription locus (gene or expressed pseudogene).",
      "example_id" : "UniGene:Hs.212293",
      "database" : "UniGene",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "mgi" : {
      "datatype" : null,
      "abbreviation" : "MGI",
      "generic_url" : "http://www.informatics.jax.org/",
      "url_example" : "http://www.informatics.jax.org/accession/MGI:80863",
      "url_syntax" : "http://www.informatics.jax.org/accession/[example_id]",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "VariO:0001 ! variation",
      "database" : "Mouse Genome Informatics",
      "example_id" : "MGI:MGI:80863",
      "name" : null,
      "fullname" : null,
      "local_id_syntax" : "MGI:[0-9]{5,}"
   },
   "jcvi_cmr" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=[example_id]",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=VCA0557",
      "abbreviation" : "JCVI_CMR",
      "generic_url" : "http://cmr.jcvi.org/",
      "datatype" : null,
      "fullname" : null,
      "example_id" : "JCVI_CMR:VCA0557",
      "name" : null,
      "database" : "EGAD database at the J. Craig Venter Institute",
      "entity_type" : "PR:000000001 ! protein"
   },
   "multifun" : {
      "abbreviation" : "MultiFun",
      "generic_url" : "http://genprotec.mbl.edu/files/MultiFun.html",
      "datatype" : null,
      "url_example" : null,
      "url_syntax" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : null,
      "database" : "MultiFun cell function assignment schema",
      "fullname" : null
   },
   "tair" : {
      "entity_type" : "SO:0000185 ! primary transcript",
      "example_id" : "TAIR:locus:2146653",
      "database" : "The Arabidopsis Information Resource",
      "name" : null,
      "fullname" : null,
      "local_id_syntax" : "locus:[0-9]{7}",
      "generic_url" : "http://www.arabidopsis.org/",
      "abbreviation" : "TAIR",
      "datatype" : null,
      "url_example" : "http://arabidopsis.org/servlets/TairObject?accession=locus:2146653",
      "url_syntax" : "http://arabidopsis.org/servlets/TairObject?accession=[example_id]",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "maizegdb" : {
      "url_syntax" : "http://www.maizegdb.org/cgi-bin/id_search.cgi?id=[example_id]",
      "url_example" : "http://www.maizegdb.org/cgi-bin/id_search.cgi?id=881225",
      "datatype" : null,
      "generic_url" : "http://www.maizegdb.org",
      "abbreviation" : "MaizeGDB",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "example_id" : "MaizeGDB:881225",
      "name" : null,
      "database" : "MaizeGDB",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "uniprotkb-kw" : {
      "example_id" : "UniProtKB-KW:KW-0812",
      "database" : "UniProt Knowledgebase keywords",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_example" : "http://www.uniprot.org/keywords/KW-0812",
      "url_syntax" : "http://www.uniprot.org/keywords/[example_id]",
      "generic_url" : "http://www.uniprot.org/keywords/",
      "abbreviation" : "UniProtKB-KW",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "pombase" : {
      "local_id_syntax" : "S\\w+(\\.)?\\w+(\\.)?",
      "fullname" : null,
      "example_id" : "PomBase:SPBC11B10.09",
      "name" : null,
      "database" : "PomBase",
      "entity_type" : "SO:0000704 ! gene",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : "http://www.pombase.org/spombe/result/[example_id]",
      "url_example" : "http://www.pombase.org/spombe/result/SPBC11B10.09",
      "generic_url" : "http://www.pombase.org/",
      "abbreviation" : "PomBase",
      "datatype" : null
   },
   "cog_cluster" : {
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : "COG_Cluster:COG0001",
      "database" : "NCBI COG cluster",
      "fullname" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "abbreviation" : "COG_Cluster",
      "datatype" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/new/release/cow.cgi?cog=COG0001",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/new/release/cow.cgi?cog=[example_id]",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "pmid" : {
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/pubmed/[example_id]",
      "url_example" : "http://www.ncbi.nlm.nih.gov/pubmed/4208797",
      "abbreviation" : "PMID",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/PubMed/",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "database" : "PubMed",
      "example_id" : "PMID:4208797",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "local_id_syntax" : "[0-9]+",
      "fullname" : null
   },
   "aracyc" : {
      "url_example" : "http://www.arabidopsis.org:1555/ARA/NEW-IMAGE?type=NIL&object=PWYQT-62",
      "url_syntax" : "http://www.arabidopsis.org:1555/ARA/NEW-IMAGE?type=NIL&object=[example_id]",
      "abbreviation" : "AraCyc",
      "generic_url" : "http://www.arabidopsis.org/biocyc/index.jsp",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "database" : "AraCyc metabolic pathway database for Arabidopsis thaliana",
      "example_id" : "AraCyc:PWYQT-62",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "jcvi_genprop" : {
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=[example_id]",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=GenProp0120",
      "generic_url" : "http://cmr.jcvi.org/",
      "abbreviation" : "JCVI_GenProp",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "example_id" : "JCVI_GenProp:GenProp0120",
      "database" : "Genome Properties database at the J. Craig Venter Institute",
      "name" : null,
      "entity_type" : "GO:0008150 ! biological_process",
      "local_id_syntax" : "GenProp[0-9]{4}",
      "fullname" : null
   },
   "rfam" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Rfam database of RNA families",
      "example_id" : "Rfam:RF00012",
      "name" : null,
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "abbreviation" : "Rfam",
      "generic_url" : "http://rfam.sanger.ac.uk/",
      "url_example" : "http://rfam.sanger.ac.uk/family/RF00012",
      "url_syntax" : "http://rfam.sanger.ac.uk/family/[example_id]"
   },
   "reac" : {
      "datatype" : null,
      "abbreviation" : "REAC",
      "generic_url" : "http://www.reactome.org/",
      "url_example" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=REACT_604",
      "url_syntax" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=[example_id]",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "Reactome:REACT_604",
      "database" : "Reactome - a curated knowledgebase of biological pathways",
      "name" : null,
      "fullname" : null,
      "local_id_syntax" : "REACT_[0-9]+"
   },
   "um-bbd_reactionid" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "abbreviation" : "UM-BBD_reactionID",
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=r&reacID=[example_id]",
      "url_example" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=r&reacID=r0129",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "UM-BBD_reactionID:r0129",
      "name" : null,
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database"
   },
   "ensemblplants" : {
      "example_id" : "EnsemblPlants:LOC_Os01g22954",
      "database" : "Ensembl Plants, the Ensembl Genomes database for accessing plant genome data",
      "name" : null,
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "url_example" : "http://www.ensemblgenomes.org/id/LOC_Os01g22954",
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "datatype" : null,
      "abbreviation" : "EnsemblPlants",
      "generic_url" : "http://plants.ensembl.org/",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "pfamb" : {
      "fullname" : null,
      "database" : "Pfam-B supplement to Pfam",
      "example_id" : "PfamB:PB014624",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : null,
      "url_syntax" : null,
      "generic_url" : "http://www.sanger.ac.uk/Software/Pfam/",
      "abbreviation" : "PfamB",
      "datatype" : null
   },
   "rnacentral" : {
      "entity_type" : "CHEBI:33697 ! ribonucleic acid",
      "name" : null,
      "example_id" : "RNAcentral:URS000047C79B_9606",
      "database" : "RNAcentral",
      "fullname" : null,
      "description" : "An international database of ncRNA sequences",
      "local_id_syntax" : "URS[0-9A-F]{10}([_\\/][0-9]+){0,1}",
      "generic_url" : "http://rnacentral.org",
      "abbreviation" : "RNAcentral",
      "datatype" : null,
      "url_syntax" : "http://rnacentral.org/rna/[example_id]",
      "url_example" : "http://rnacentral.org/rna/URS000047C79B_9606",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "tigr_ref" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : null,
      "url_example" : "http://cmr.jcvi.org/CMR/AnnotationSops.shtml",
      "datatype" : null,
      "abbreviation" : "TIGR_REF",
      "generic_url" : "http://cmr.jcvi.org/",
      "fullname" : null,
      "database" : "J. Craig Venter Institute",
      "name" : null,
      "example_id" : "JCVI_REF:GO_ref",
      "entity_type" : "BET:0000000 ! entity"
   },
   "corum" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "CORUM:837",
      "name" : null,
      "database" : "CORUM - the Comprehensive Resource of Mammalian protein complexes",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://mips.gsf.de/genre/proj/corum/",
      "abbreviation" : "CORUM",
      "datatype" : null,
      "url_syntax" : "http://mips.gsf.de/genre/proj/corum/complexdetails.html?id=[example_id]",
      "url_example" : "http://mips.gsf.de/genre/proj/corum/complexdetails.html?id=837"
   },
   "mgd" : {
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "generic_url" : "http://www.informatics.jax.org/",
      "abbreviation" : "MGD",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "example_id" : "MGD:Adcy9",
      "name" : null,
      "database" : "Mouse Genome Database",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "pro" : {
      "url_syntax" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:[example_id]",
      "url_example" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:000025380",
      "generic_url" : "http://www.proconsortium.org/pro/pro.shtml",
      "abbreviation" : "PRO",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "database" : "Protein Ontology",
      "name" : null,
      "example_id" : "PR:000025380",
      "entity_type" : "PR:000000001 ! protein",
      "local_id_syntax" : "[0-9]{9}",
      "fullname" : null
   },
   "merops_fam" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : "http://merops.sanger.ac.uk/cgi-bin/famsum?family=[example_id]",
      "url_example" : "http://merops.sanger.ac.uk/cgi-bin/famsum?family=m18",
      "abbreviation" : "MEROPS_fam",
      "generic_url" : "http://merops.sanger.ac.uk/",
      "datatype" : null,
      "fullname" : null,
      "database" : "MEROPS peptidase database",
      "example_id" : "MEROPS_fam:M18",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "sgd_ref" : {
      "fullname" : null,
      "name" : null,
      "example_id" : "SGD_REF:S000049602",
      "database" : "Saccharomyces Genome Database",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://www.yeastgenome.org/reference/S000049602/overview",
      "url_syntax" : "http://www.yeastgenome.org/reference/[example_is]/overview",
      "datatype" : null,
      "abbreviation" : "SGD_REF",
      "generic_url" : "http://www.yeastgenome.org/"
   },
   "patric" : {
      "description" : "PathoSystems Resource Integration Center at the Virginia Bioinformatics Institute",
      "fullname" : null,
      "example_id" : "PATRIC:cds.000002.436951",
      "database" : "PathoSystems Resource Integration Center",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : "http://patric.vbi.vt.edu/gene/overview.php?fid=[example_id]",
      "url_example" : "http://patric.vbi.vt.edu/gene/overview.php?fid=cds.000002.436951",
      "datatype" : null,
      "abbreviation" : "PATRIC",
      "generic_url" : "http://patric.vbi.vt.edu"
   },
   "h-invdb_cdna" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.h-invitational.jp/",
      "abbreviation" : "H-invDB_cDNA",
      "url_syntax" : "http://www.h-invitational.jp/hinv/spsoup/transcript_view?acc_id=[example_id]",
      "url_example" : "http://www.h-invitational.jp/hinv/spsoup/transcript_view?acc_id=AK093149",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "H-invitational Database",
      "example_id" : "H-invDB_cDNA:AK093148",
      "name" : null
   },
   "pubchem_substance" : {
      "local_id_syntax" : "[0-9]{4,}",
      "fullname" : null,
      "database" : "NCBI PubChem database of chemical substances",
      "example_id" : "PubChem_Substance:4594",
      "name" : null,
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pcsubstance&term=4594",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pcsubstance&term=[example_id]",
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "abbreviation" : "PubChem_Substance",
      "datatype" : null
   },
   "refseq" : {
      "datatype" : null,
      "abbreviation" : "RefSeq",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/RefSeq/",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=XP_001068954",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "PR:000000001 ! protein",
      "example_id" : "RefSeq:XP_001068954",
      "database" : "RefSeq",
      "name" : null,
      "fullname" : null,
      "local_id_syntax" : "(NC|AC|NG|NT|NW|NZ|NM|NR|XM|XR|NP|AP|XP|YP|ZP)_[0-9]+(\\.[0-9]+){0,1}"
   },
   "omim" : {
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "OMIM:190198",
      "name" : null,
      "database" : "Mendelian Inheritance in Man",
      "fullname" : null,
      "abbreviation" : "OMIM",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=OMIM",
      "datatype" : null,
      "url_example" : "http://omim.org/entry/190198",
      "url_syntax" : "http://omim.org/entry/[example_id]",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "brenda" : {
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "BRENDA",
      "generic_url" : "http://www.brenda-enzymes.info",
      "datatype" : null,
      "url_syntax" : "http://www.brenda-enzymes.info/php/result_flat.php4?ecno=[example_id]",
      "url_example" : "http://www.brenda-enzymes.info/php/result_flat.php4?ecno=4.2.1.3",
      "fullname" : null,
      "entity_type" : "GO:0003824 ! catalytic activity",
      "database" : "BRENDA, The Comprehensive Enzyme Information System",
      "example_id" : "BRENDA:4.2.1.3",
      "name" : null
   },
   "vbrc" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : "VBRC:F35742",
      "database" : "Viral Bioinformatics Resource Center",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "VBRC",
      "generic_url" : "http://vbrc.org",
      "datatype" : null,
      "url_syntax" : "http://vbrc.org/query.asp?web_id=VBRC:[example_id]",
      "url_example" : "http://vbrc.org/query.asp?web_id=VBRC:F35742"
   },
   "ri" : {
      "generic_url" : "http://www.roslin.ac.uk/",
      "abbreviation" : "RI",
      "datatype" : null,
      "url_example" : null,
      "url_syntax" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "database" : "Roslin Institute",
      "example_id" : null,
      "fullname" : null
   },
   "medline" : {
      "url_example" : null,
      "url_syntax" : null,
      "datatype" : null,
      "abbreviation" : "MEDLINE",
      "generic_url" : "http://www.nlm.nih.gov/databases/databases_medline.html",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "example_id" : "MEDLINE:20572430",
      "name" : null,
      "database" : "Medline literature database",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "seed" : {
      "fullname" : null,
      "description" : "Project to annotate the first 1000 sequenced genomes, develop detailed metabolic reconstructions, and construct the corresponding stoichiometric matrices",
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "SEED:fig|83331.1.peg.1",
      "name" : null,
      "database" : "The SEED;",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://www.theseed.org",
      "abbreviation" : "SEED",
      "datatype" : null,
      "url_syntax" : "http://www.theseed.org/linkin.cgi?id=[example_id]",
      "url_example" : "http://www.theseed.org/linkin.cgi?id=fig|83331.1.peg.1"
   },
   "mi" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : null,
      "url_example" : null,
      "generic_url" : "http://psidev.sourceforge.net/mi/xml/doc/user/index.html",
      "abbreviation" : "MI",
      "datatype" : null,
      "fullname" : null,
      "example_id" : "MI:0018",
      "database" : "Proteomic Standard Initiative for Molecular Interaction",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "iuphar_receptor" : {
      "url_syntax" : "http://www.iuphar-db.org/DATABASE/ObjectDisplayForward?objectId=[example_id]",
      "url_example" : "http://www.iuphar-db.org/DATABASE/ObjectDisplayForward?objectId=56",
      "abbreviation" : "IUPHAR_RECEPTOR",
      "generic_url" : "http://www.iuphar.org/",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "example_id" : "IUPHAR_RECEPTOR:2205",
      "name" : null,
      "database" : "International Union of Pharmacology",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "biopixie_mefit" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : null,
      "database" : "biological Process Inference from eXperimental Interaction Evidence/Microarray Experiment Functional Integration Technology",
      "name" : null,
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "abbreviation" : "bioPIXIE_MEFIT",
      "generic_url" : "http://pixie.princeton.edu/pixie/",
      "url_example" : null,
      "url_syntax" : null
   },
   "gdb" : {
      "name" : null,
      "example_id" : "GDB:306600",
      "database" : "Human Genome Database",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_example" : "http://www.gdb.org/gdb-bin/genera/accno?accessionNum=GDB:306600",
      "url_syntax" : "http://www.gdb.org/gdb-bin/genera/accno?accessionNum=GDB:[example_id]",
      "generic_url" : "http://www.gdb.org/",
      "abbreviation" : "GDB",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "sgdid" : {
      "fullname" : null,
      "local_id_syntax" : "S[0-9]{9}",
      "entity_type" : "SO:0000704 ! gene",
      "database" : "Saccharomyces Genome Database",
      "example_id" : "SGD:S000006169",
      "name" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://www.yeastgenome.org/",
      "abbreviation" : "SGDID",
      "datatype" : null,
      "url_syntax" : "http://www.yeastgenome.org/locus/[example_id]/overview",
      "url_example" : "http://www.yeastgenome.org/locus/S000006169/overview"
   },
   "parkinsonsuk-ucl" : {
      "database" : "Parkinsons Disease Gene Ontology Initiative",
      "example_id" : null,
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_syntax" : null,
      "url_example" : null,
      "abbreviation" : "ParkinsonsUK-UCL",
      "generic_url" : "http://www.ucl.ac.uk/functional-gene-annotation/neurological",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "hugo" : {
      "url_syntax" : null,
      "url_example" : null,
      "generic_url" : "http://www.hugo-international.org/",
      "abbreviation" : "HUGO",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "database" : "Human Genome Organisation",
      "example_id" : null,
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "flybase" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://flybase.org/",
      "abbreviation" : "FLYBASE",
      "url_syntax" : "http://flybase.org/reports/[example_id].html",
      "url_example" : "http://flybase.org/reports/FBgn0000024.html",
      "fullname" : null,
      "local_id_syntax" : "FBgn[0-9]{7}",
      "entity_type" : "SO:0000704 ! gene",
      "name" : null,
      "example_id" : "FB:FBgn0000024",
      "database" : "FlyBase"
   },
   "transfac" : {
      "fullname" : null,
      "example_id" : null,
      "name" : null,
      "database" : "TRANSFAC database of eukaryotic transcription factors",
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : null,
      "url_syntax" : null,
      "generic_url" : "http://www.gene-regulation.com/pub/databases.html#transfac",
      "abbreviation" : "TRANSFAC",
      "datatype" : null
   },
   "cog_pathway" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "abbreviation" : "COG_Pathway",
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/new/release/coglist.cgi?pathw=14",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/new/release/coglist.cgi?pathw=[example_id]",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "COG_Pathway:14",
      "database" : "NCBI COG pathway",
      "name" : null
   },
   "merops" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://merops.sanger.ac.uk/cgi-bin/pepsum?mid=A08.001",
      "url_syntax" : "http://merops.sanger.ac.uk/cgi-bin/pepsum?mid=[example_id]",
      "datatype" : null,
      "abbreviation" : "MEROPS",
      "generic_url" : "http://merops.sanger.ac.uk/",
      "fullname" : null,
      "example_id" : "MEROPS:A08.001",
      "name" : null,
      "database" : "MEROPS peptidase database",
      "entity_type" : "PR:000000001 ! protein"
   },
   "pamgo" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : null,
      "name" : null,
      "database" : "Plant-Associated Microbe Gene Ontology Interest Group",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://pamgo.vbi.vt.edu/",
      "abbreviation" : "PAMGO",
      "url_syntax" : null,
      "url_example" : null
   },
   "ensemblplants/gramene" : {
      "entity_type" : "SO:0000704 ! gene",
      "example_id" : "EnsemblPlants:LOC_Os01g22954",
      "name" : null,
      "database" : "Ensembl Plants, the Ensembl Genomes database for accessing plant genome data",
      "fullname" : null,
      "generic_url" : "http://plants.ensembl.org/",
      "abbreviation" : "EnsemblPlants/Gramene",
      "datatype" : null,
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "url_example" : "http://www.ensemblgenomes.org/id/LOC_Os01g22954",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "biomd" : {
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "BIOMD:BIOMD0000000045",
      "name" : null,
      "database" : "BioModels Database",
      "fullname" : null,
      "generic_url" : "http://www.ebi.ac.uk/biomodels/",
      "abbreviation" : "BIOMD",
      "datatype" : null,
      "url_syntax" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=[example_id]",
      "url_example" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=BIOMD0000000045",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "omssa" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : null,
      "database" : "Open Mass Spectrometry Search Algorithm",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/omssa/",
      "abbreviation" : "OMSSA",
      "datatype" : null,
      "url_syntax" : null,
      "url_example" : null
   },
   "po_ref" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://wiki.plantontology.org:8080/index.php/PO_references",
      "abbreviation" : "PO_REF",
      "url_example" : "http://wiki.plantontology.org:8080/index.php/PO_REF:00001",
      "url_syntax" : "http://wiki.plantontology.org:8080/index.php/PO_REF:[example_id]",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Plant Ontology custom references",
      "example_id" : "PO_REF:00001",
      "name" : null
   },
   "phenoscape" : {
      "url_example" : null,
      "url_syntax" : null,
      "generic_url" : "http://phenoscape.org/",
      "abbreviation" : "PhenoScape",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "example_id" : null,
      "database" : "PhenoScape Knowledgebase",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "eco" : {
      "database" : "Evidence Code ontology",
      "example_id" : "ECO:0000002",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "local_id_syntax" : "\\d{7}",
      "fullname" : null,
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "abbreviation" : "ECO",
      "generic_url" : "http://www.geneontology.org/",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "agi_locuscode" : {
      "entity_type" : "SO:0000704 ! gene",
      "example_id" : "AGI_LocusCode:At2g17950",
      "database" : "Arabidopsis Genome Initiative",
      "name" : null,
      "fullname" : null,
      "description" : "Comprises TAIR, TIGR and MIPS",
      "local_id_syntax" : "A[Tt][MmCc0-5][Gg][0-9]{5}(\\.[0-9]{1})?",
      "generic_url" : "http://www.arabidopsis.org",
      "abbreviation" : "AGI_LocusCode",
      "datatype" : null,
      "url_syntax" : "http://arabidopsis.org/servlets/TairObject?type=locus&name=[example_id]",
      "url_example" : "http://arabidopsis.org/servlets/TairObject?type=locus&name=At2g17950",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "psort" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.psort.org/",
      "abbreviation" : "PSORT",
      "url_example" : null,
      "url_syntax" : null,
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "PSORT protein subcellular localization databases and prediction tools for bacteria",
      "example_id" : null,
      "name" : null
   },
   "obo_rel" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "OBO relation ontology",
      "example_id" : "OBO_REL:part_of",
      "name" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "OBO_REL",
      "generic_url" : "http://www.obofoundry.org/ro/",
      "datatype" : null,
      "url_syntax" : null,
      "url_example" : null
   },
   "rnamdb" : {
      "fullname" : null,
      "database" : "RNA Modification Database",
      "name" : null,
      "example_id" : "RNAmods:037",
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?[example_id]",
      "url_example" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?091",
      "generic_url" : "http://s59.cas.albany.edu/RNAmods/",
      "abbreviation" : "RNAMDB",
      "datatype" : null
   },
   "uniprotkb" : {
      "datatype" : null,
      "generic_url" : "http://www.uniprot.org",
      "abbreviation" : "UniProtKB",
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "PR:000000001 ! protein",
      "database" : "Universal Protein Knowledgebase",
      "example_id" : "UniProtKB:P51587",
      "name" : null,
      "description" : "A central repository of protein sequence and function created by joining the information contained in Swiss-Prot, TrEMBL, and PIR database",
      "fullname" : null,
      "local_id_syntax" : "([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z]([0-9][A-Z][A-Z0-9]{2}){1,2}[0-9])((-[0-9]+)|:PRO_[0-9]{10}|:VAR_[0-9]{6}){0,1}"
   },
   "mo" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://mged.sourceforge.net/ontologies/MGEDontology.php#Action",
      "url_syntax" : "http://mged.sourceforge.net/ontologies/MGEDontology.php#[example_id]",
      "abbreviation" : "MO",
      "generic_url" : "http://mged.sourceforge.net/ontologies/MGEDontology.php",
      "datatype" : null,
      "fullname" : null,
      "example_id" : "MO:Action",
      "database" : "MGED Ontology",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "ensembl_transcriptid" : {
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "url_example" : "http://www.ensembl.org/id/ENST00000371959",
      "datatype" : null,
      "generic_url" : "http://www.ensembl.org/",
      "abbreviation" : "ENSEMBL_TranscriptID",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "example_id" : "ENSEMBL_TranscriptID:ENST00000371959",
      "name" : null,
      "database" : "Ensembl database of automatically annotated genomic data",
      "entity_type" : "SO:0000673 ! transcript",
      "local_id_syntax" : "ENST[0-9]{9,16}",
      "fullname" : null
   },
   "smd" : {
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://genome-www.stanford.edu/microarray",
      "abbreviation" : "SMD",
      "datatype" : null,
      "url_example" : null,
      "url_syntax" : null,
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : null,
      "database" : "Stanford Microarray Database",
      "name" : null
   },
   "ncbi_taxid" : {
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "ncbi_taxid",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "database" : "NCBI Taxonomy",
      "example_id" : "taxon:7227"
   },
   "reactome" : {
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "Reactome",
      "generic_url" : "http://www.reactome.org/",
      "datatype" : null,
      "url_example" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=REACT_604",
      "url_syntax" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=[example_id]",
      "fullname" : null,
      "local_id_syntax" : "REACT_[0-9]+",
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "Reactome:REACT_604",
      "name" : null,
      "database" : "Reactome - a curated knowledgebase of biological pathways"
   },
   "lifedb" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : "http://www.dkfz.de/LIFEdb/LIFEdb.aspx?ID=[example_id]",
      "url_example" : "http://www.dkfz.de/LIFEdb/LIFEdb.aspx?ID=DKFZp564O1716",
      "datatype" : null,
      "generic_url" : "http://www.lifedb.de/",
      "abbreviation" : "LIFEdb",
      "description" : "LifeDB is a database for information on protein localization, interaction, functional assays and expression.",
      "fullname" : null,
      "name" : null,
      "example_id" : "LIFEdb:DKFZp564O1716",
      "database" : "LifeDB",
      "entity_type" : "BET:0000000 ! entity"
   },
   "ncbi_locus_tag" : {
      "example_id" : "NCBI_locus_tag:CTN_0547",
      "name" : null,
      "database" : "NCBI locus tag",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_example" : null,
      "url_syntax" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "abbreviation" : "NCBI_locus_tag",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "ddb_ref" : {
      "datatype" : null,
      "abbreviation" : "DDB_REF",
      "generic_url" : "http://dictybase.org",
      "url_syntax" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=[example_id]",
      "url_example" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=10157",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "dictyBase literature references",
      "example_id" : "dictyBase_REF:10157",
      "name" : null,
      "fullname" : null
   },
   "ddanat" : {
      "entity_type" : "CARO:0000000 ! anatomical entity",
      "example_id" : "DDANAT:0000068",
      "name" : null,
      "database" : "Dictyostelium discoideum anatomy",
      "fullname" : null,
      "local_id_syntax" : "[0-9]{7}",
      "datatype" : null,
      "generic_url" : "http://dictybase.org/Dicty_Info/dicty_anatomy_ontology.html",
      "abbreviation" : "DDANAT",
      "url_syntax" : null,
      "url_example" : null,
      "id" : null,
      "object" : null,
      "uri_prefix" : null
   },
   "resid" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "RESID:AA0062",
      "name" : null,
      "database" : "RESID Database of Protein Modifications",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "ftp://ftp.ncifcrf.gov/pub/users/residues/",
      "abbreviation" : "RESID",
      "url_syntax" : null,
      "url_example" : null
   },
   "embl" : {
      "example_id" : "EMBL:AA816246",
      "database" : "EMBL Nucleotide Sequence Database",
      "name" : null,
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "([A-Z]{1}[0-9]{5})|([A-Z]{2}[0-9]{6})|([A-Z]{4}[0-9]{8,9})",
      "description" : "International nucleotide sequence database collaboration, comprising EMBL-EBI nucleotide sequence data library (EMBL-Bank), DNA DataBank of Japan (DDBJ), and NCBI GenBank",
      "fullname" : null,
      "url_example" : "http://www.ebi.ac.uk/cgi-bin/emblfetch?style=html&Submit=Go&id=AA816246",
      "url_syntax" : "http://www.ebi.ac.uk/cgi-bin/emblfetch?style=html&Submit=Go&id=[example_id]",
      "datatype" : null,
      "generic_url" : "http://www.ebi.ac.uk/embl/",
      "abbreviation" : "EMBL",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "superfamily" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/cgi-bin/scop.cgi?ipid=SSF[example_id]",
      "url_example" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/cgi-bin/scop.cgi?ipid=SSF51905",
      "abbreviation" : "SUPERFAMILY",
      "generic_url" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/index.html",
      "datatype" : null,
      "fullname" : null,
      "description" : "A database of structural and functional protein annotations for completely sequenced genomes",
      "name" : null,
      "example_id" : "SUPERFAMILY:51905",
      "database" : "SUPERFAMILY protein annotation database",
      "entity_type" : "BET:0000000 ! entity"
   },
   "trait" : {
      "description" : "an integrated database of transcripts expressed in human skeletal muscle",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : null,
      "name" : null,
      "database" : "TRAnscript Integrated Table",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "abbreviation" : "TRAIT",
      "generic_url" : "http://muscle.cribi.unipd.it/",
      "url_syntax" : null,
      "url_example" : null
   },
   "sp_kw" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "database" : "UniProt Knowledgebase keywords",
      "example_id" : "UniProtKB-KW:KW-0812",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://www.uniprot.org/keywords/",
      "abbreviation" : "SP_KW",
      "datatype" : null,
      "url_syntax" : "http://www.uniprot.org/keywords/[example_id]",
      "url_example" : "http://www.uniprot.org/keywords/KW-0812"
   },
   "gonuts" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : "http://gowiki.tamu.edu/wiki/index.php/[example_id]",
      "url_example" : "http://gowiki.tamu.edu/wiki/index.php/MOUSE:CD28",
      "abbreviation" : "GONUTS",
      "generic_url" : "http://gowiki.tamu.edu",
      "datatype" : null,
      "fullname" : null,
      "description" : "Third party documentation for GO and community annotation system.",
      "database" : "Gene Ontology Normal Usage Tracking System (GONUTS)",
      "example_id" : "GONUTS:MOUSE:CD28",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "rnamods" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "RNAmods:037",
      "database" : "RNA Modification Database",
      "name" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "RNAmods",
      "generic_url" : "http://s59.cas.albany.edu/RNAmods/",
      "datatype" : null,
      "url_example" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?091",
      "url_syntax" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?[example_id]"
   },
   "zfin" : {
      "url_example" : "http://zfin.org/cgi-bin/ZFIN_jump?record=ZDB-GENE-990415-103",
      "url_syntax" : "http://zfin.org/cgi-bin/ZFIN_jump?record=[example_id]",
      "generic_url" : "http://zfin.org/",
      "abbreviation" : "ZFIN",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "example_id" : "ZFIN:ZDB-GENE-990415-103",
      "name" : null,
      "database" : "Zebrafish Information Network",
      "entity_type" : "VariO:0001 ! variation",
      "local_id_syntax" : "ZDB-(GENE|GENO|MRPHLNO)-[0-9]{6}-[0-9]+",
      "fullname" : null
   },
   "broad_neurospora" : {
      "fullname" : null,
      "description" : "Neurospora crassa database at the Broad Institute",
      "example_id" : "BROAD_NEUROSPORA:7000007580576824",
      "name" : null,
      "database" : "Neurospora crassa Database",
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://www.broadinstitute.org/annotation/genome/neurospora/GeneDetails.html?sp=S7000007580576824",
      "url_syntax" : "http://www.broadinstitute.org/annotation/genome/neurospora/GeneDetails.html?sp=S[example_id]",
      "abbreviation" : "Broad_NEUROSPORA",
      "generic_url" : "http://www.broadinstitute.org/annotation/genome/neurospora/MultiHome.html",
      "datatype" : null
   },
   "sgd_locus" : {
      "url_syntax" : "http://www.yeastgenome.org/locus/[example_id]/overview",
      "url_example" : "http://www.yeastgenome.org/locus/S000006169/overview",
      "datatype" : null,
      "abbreviation" : "SGD_LOCUS",
      "generic_url" : "http://www.yeastgenome.org/",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "name" : null,
      "example_id" : "SGD_LOCUS:GAL4",
      "database" : "Saccharomyces Genome Database",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "hpa_antibody" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Human Protein Atlas antibody information",
      "example_id" : "HPA_antibody:HPA000237",
      "name" : null,
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "HPA_antibody",
      "generic_url" : "http://www.proteinatlas.org/",
      "datatype" : null,
      "url_syntax" : "http://www.proteinatlas.org/antibody_info.php?antibody_id=[example_id]",
      "url_example" : "http://www.proteinatlas.org/antibody_info.php?antibody_id=HPA000237"
   },
   "pirsf" : {
      "url_example" : "http://pir.georgetown.edu/cgi-bin/ipcSF?id=SF002327",
      "url_syntax" : "http://pir.georgetown.edu/cgi-bin/ipcSF?id=[example_id]",
      "datatype" : null,
      "generic_url" : "http://pir.georgetown.edu/pirsf/",
      "abbreviation" : "PIRSF",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "name" : null,
      "example_id" : "PIRSF:SF002327",
      "database" : "PIR Superfamily Classification System",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "subtilist" : {
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://genolist.pasteur.fr/SubtiList/",
      "abbreviation" : "SUBTILIST",
      "datatype" : null,
      "url_example" : null,
      "url_syntax" : null,
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "database" : "Bacillus subtilis Genome Sequence Project",
      "example_id" : "SUBTILISTG:BG11384",
      "name" : null
   },
   "locusid" : {
      "entity_type" : "SO:0000704 ! gene",
      "example_id" : "NCBI_Gene:4771",
      "name" : null,
      "database" : "NCBI Gene",
      "fullname" : null,
      "local_id_syntax" : "\\d+",
      "abbreviation" : "LocusID",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "obi" : {
      "local_id_syntax" : "\\d{7}",
      "fullname" : null,
      "database" : "Ontology for Biomedical Investigations",
      "example_id" : "OBI:0000038",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "abbreviation" : "OBI",
      "generic_url" : "http://obi-ontology.org/page/Main_Page"
   },
   "wormbase" : {
      "name" : null,
      "example_id" : "WB:WBGene00003001",
      "database" : "WormBase database of nematode biology",
      "entity_type" : "PR:000000001 ! protein",
      "local_id_syntax" : "(WP:CE[0-9]{5})|(WB(Gene|Var|RNAi|Transgene)[0-9]{8})",
      "fullname" : null,
      "url_syntax" : "http://www.wormbase.org/db/gene/gene?name=[example_id]",
      "url_example" : "http://www.wormbase.org/db/get?class=Gene;name=WBGene00003001",
      "generic_url" : "http://www.wormbase.org/",
      "abbreviation" : "WormBase",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "sgd" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : "http://www.yeastgenome.org/locus/[example_id]/overview",
      "url_example" : "http://www.yeastgenome.org/locus/S000006169/overview",
      "datatype" : null,
      "generic_url" : "http://www.yeastgenome.org/",
      "abbreviation" : "SGD",
      "local_id_syntax" : "S[0-9]{9}",
      "fullname" : null,
      "example_id" : "SGD:S000006169",
      "name" : null,
      "database" : "Saccharomyces Genome Database",
      "entity_type" : "SO:0000704 ! gene"
   },
   "gb" : {
      "entity_type" : "PR:000000001 ! protein",
      "database" : "GenBank",
      "name" : null,
      "example_id" : "GB:AA816246",
      "description" : "The NIH genetic sequence database, an annotated collection of all publicly available DNA sequences.",
      "fullname" : null,
      "local_id_syntax" : "([A-Z]{2}[0-9]{6})|([A-Z]{1}[0-9]{5})",
      "datatype" : null,
      "abbreviation" : "GB",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=AA816246",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=[example_id]",
      "id" : null,
      "object" : null,
      "uri_prefix" : null
   },
   "cog_function" : {
      "fullname" : null,
      "database" : "NCBI COG function",
      "example_id" : "COG_Function:H",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/grace/shokog.cgi?fun=[example_id]",
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/grace/shokog.cgi?fun=H",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "abbreviation" : "COG_Function",
      "datatype" : null
   },
   "gr" : {
      "abbreviation" : "GR",
      "generic_url" : "http://www.gramene.org/",
      "datatype" : null,
      "url_syntax" : "http://www.gramene.org/db/searches/browser?search_type=All&RGN=on&query=[example_id]",
      "url_example" : "http://www.gramene.org/db/searches/browser?search_type=All&RGN=on&query=sd1",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "PR:000000001 ! protein",
      "name" : null,
      "example_id" : "GR:sd1",
      "database" : "Gramene",
      "fullname" : null,
      "local_id_syntax" : "[A-Z][0-9][A-Z0-9]{3}[0-9]"
   },
   "iuphar" : {
      "example_id" : null,
      "name" : null,
      "database" : "International Union of Pharmacology",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_syntax" : null,
      "url_example" : null,
      "abbreviation" : "IUPHAR",
      "generic_url" : "http://www.iuphar.org/",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "uniparc" : {
      "url_example" : "http://www.uniprot.org/uniparc/UPI000000000A",
      "url_syntax" : "http://www.uniprot.org/uniparc/[example_id]",
      "datatype" : null,
      "abbreviation" : "UniParc",
      "generic_url" : "http://www.uniprot.org/uniparc/",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "example_id" : "UniParc:UPI000000000A",
      "database" : "UniProt Archive",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "description" : "A non-redundant archive of protein sequences extracted from Swiss-Prot, TrEMBL, PIR-PSD, EMBL, Ensembl, IPI, PDB, RefSeq, FlyBase, WormBase, European Patent Office, United States Patent and Trademark Office, and Japanese Patent Office",
      "fullname" : null
   },
   "psi-mod" : {
      "abbreviation" : "PSI-MOD",
      "generic_url" : "http://psidev.sourceforge.net/mod/",
      "datatype" : null,
      "url_syntax" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:[example_id]",
      "url_example" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:00219",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "MOD:00219",
      "database" : "Proteomics Standards Initiative protein modification ontology",
      "name" : null,
      "fullname" : null
   },
   "gr_gene" : {
      "url_syntax" : "http://www.gramene.org/db/genes/search_gene?acc=[example_id]",
      "url_example" : "http://www.gramene.org/db/genes/search_gene?acc=GR:0060198",
      "generic_url" : "http://www.gramene.org/",
      "abbreviation" : "GR_gene",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "example_id" : "GR_GENE:GR:0060198",
      "name" : null,
      "database" : "Gramene",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "vz" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "abbreviation" : "VZ",
      "generic_url" : "http://viralzone.expasy.org/",
      "url_example" : "http://viralzone.expasy.org/all_by_protein/957.html",
      "url_syntax" : "http://viralzone.expasy.org/all_by_protein/[example_id].html",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "VZ:957",
      "database" : "ViralZone",
      "name" : null
   },
   "cgd_ref" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : "CGD_REF:1490",
      "database" : "Candida Genome Database",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.candidagenome.org/",
      "abbreviation" : "CGD_REF",
      "url_example" : "http://www.candidagenome.org/cgi-bin/reference/reference.pl?dbid=1490",
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]"
   },
   "aspgd" : {
      "entity_type" : "SO:0000704 ! gene",
      "example_id" : "AspGD:ASPL0000067538",
      "database" : "Aspergillus Genome Database",
      "name" : null,
      "fullname" : null,
      "local_id_syntax" : "ASPL[0-9]{10}",
      "datatype" : null,
      "generic_url" : "http://www.aspergillusgenome.org/",
      "abbreviation" : "AspGD",
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=ASPL0000067538",
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "id" : null,
      "object" : null,
      "uri_prefix" : null
   },
   "cas_gen" : {
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Catalog of Fishes genus database",
      "example_id" : "CASGEN:1040",
      "name" : null,
      "fullname" : null,
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "abbreviation" : "CAS_GEN",
      "datatype" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=1040",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=[example_id]",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "cas" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : null,
      "url_syntax" : null,
      "datatype" : null,
      "abbreviation" : "CAS",
      "generic_url" : "http://www.cas.org/expertise/cascontent/registry/index.html",
      "description" : "CAS REGISTRY is the most authoritative collection of disclosed chemical substance information, containing more than 54 million organic and inorganic substances and 62 million sequences. CAS REGISTRY covers substances identified from the scientific literature from 1957 to the present, with additional substances going back to the early 1900s.",
      "fullname" : null,
      "example_id" : "CAS:58-08-2",
      "database" : "CAS Chemical Registry",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "vida" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : null,
      "url_syntax" : null,
      "datatype" : null,
      "abbreviation" : "VIDA",
      "generic_url" : "http://www.biochem.ucl.ac.uk/bsm/virus_database/VIDA.html",
      "fullname" : null,
      "example_id" : null,
      "name" : null,
      "database" : "Virus Database at University College London",
      "entity_type" : "BET:0000000 ! entity"
   },
   "gene3d" : {
      "datatype" : null,
      "generic_url" : "http://gene3d.biochem.ucl.ac.uk/Gene3D/",
      "abbreviation" : "Gene3D",
      "url_example" : "http://gene3d.biochem.ucl.ac.uk/superfamily/?accession=G3DSA%3A3.30.390.30",
      "url_syntax" : "http://gene3d.biochem.ucl.ac.uk/superfamily/?accession=[example_id]",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : "Gene3D:G3DSA:3.30.390.30",
      "database" : "Domain Architecture Classification",
      "fullname" : null
   },
   "ecocyc" : {
      "url_example" : "http://biocyc.org/ECOLI/NEW-IMAGE?type=PATHWAY&object=P2-PWY",
      "url_syntax" : "http://biocyc.org/ECOLI/NEW-IMAGE?type=PATHWAY&object=[example_id]",
      "datatype" : null,
      "generic_url" : "http://ecocyc.org/",
      "abbreviation" : "EcoCyc",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "name" : null,
      "example_id" : "EcoCyc:P2-PWY",
      "database" : "Encyclopedia of E. coli metabolism",
      "entity_type" : "GO:0008150 ! biological_process",
      "local_id_syntax" : "EG[0-9]{5}",
      "fullname" : null
   },
   "ecocyc_ref" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://biocyc.org/ECOLI/reference.html?type=CITATION-FRAME&object=COLISALII",
      "url_syntax" : "http://biocyc.org/ECOLI/reference.html?type=CITATION-FRAME&object=[example_id]",
      "abbreviation" : "ECOCYC_REF",
      "generic_url" : "http://ecocyc.org/",
      "datatype" : null,
      "fullname" : null,
      "database" : "Encyclopedia of E. coli metabolism",
      "name" : null,
      "example_id" : "EcoCyc_REF:COLISALII",
      "entity_type" : "BET:0000000 ! entity"
   },
   "tgd" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "generic_url" : "http://www.ciliate.org/",
      "abbreviation" : "TGD",
      "fullname" : null,
      "example_id" : null,
      "database" : "Tetrahymena Genome Database",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "geneid" : {
      "entity_type" : "SO:0000704 ! gene",
      "name" : null,
      "database" : "NCBI Gene",
      "example_id" : "NCBI_Gene:4771",
      "fullname" : null,
      "local_id_syntax" : "\\d+",
      "datatype" : null,
      "abbreviation" : "GeneID",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "id" : null,
      "object" : null,
      "uri_prefix" : null
   },
   "cacao" : {
      "url_example" : "http://gowiki.tamu.edu/wiki/index.php/MYCS2:A0QNF5",
      "url_syntax" : "http://gowiki.tamu.edu/wiki/index.php/[example_id]",
      "datatype" : null,
      "generic_url" : "http://gowiki.tamu.edu/wiki/index.php/Category:CACAO",
      "abbreviation" : "CACAO",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "example_id" : "MYCS2:A0QNF5",
      "name" : null,
      "database" : "Community Assessment of Community Annotation with Ontologies",
      "entity_type" : "BET:0000000 ! entity",
      "description" : "The Community Assessment of Community Annotation with Ontologies (CACAO) is a project to do large-scale manual community annotation of gene function using the Gene Ontology as a multi-institution student competition.",
      "fullname" : null
   },
   "intact" : {
      "entity_type" : "GO:0043234 ! protein complex",
      "name" : null,
      "example_id" : "IntAct:EBI-17086",
      "database" : "IntAct protein interaction database",
      "fullname" : null,
      "local_id_syntax" : "EBI-[0-9]+",
      "datatype" : null,
      "abbreviation" : "IntAct",
      "generic_url" : "http://www.ebi.ac.uk/intact/",
      "url_example" : "http://www.ebi.ac.uk/intact/search/do/search?searchString=EBI-17086",
      "url_syntax" : "http://www.ebi.ac.uk/intact/search/do/search?searchString=[example_id]",
      "id" : null,
      "object" : null,
      "uri_prefix" : null
   },
   "wb" : {
      "generic_url" : "http://www.wormbase.org/",
      "abbreviation" : "WB",
      "datatype" : null,
      "url_example" : "http://www.wormbase.org/db/get?class=Gene;name=WBGene00003001",
      "url_syntax" : "http://www.wormbase.org/db/gene/gene?name=[example_id]",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "PR:000000001 ! protein",
      "database" : "WormBase database of nematode biology",
      "example_id" : "WB:WBGene00003001",
      "name" : null,
      "fullname" : null,
      "local_id_syntax" : "(WP:CE[0-9]{5})|(WB(Gene|Var|RNAi|Transgene)[0-9]{8})"
   },
   "germonline" : {
      "fullname" : null,
      "example_id" : null,
      "name" : null,
      "database" : "GermOnline",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "abbreviation" : "GermOnline",
      "generic_url" : "http://www.germonline.org/"
   },
   "broad_mgg" : {
      "example_id" : "Broad_MGG:MGG_05132.5",
      "database" : "Magnaporthe grisea Database",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "description" : "Magnaporthe grisea Database at the Broad Institute",
      "url_syntax" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/GeneLocus.html?sp=S[example_id]",
      "url_example" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/GeneLocus.html?sp=SMGG_05132",
      "generic_url" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/Home.html",
      "abbreviation" : "Broad_MGG",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "casgen" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "abbreviation" : "CASGEN",
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=1040",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=[example_id]",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : "CASGEN:1040",
      "database" : "Catalog of Fishes genus database"
   },
   "gr_protein" : {
      "abbreviation" : "GR_protein",
      "generic_url" : "http://www.gramene.org/",
      "datatype" : null,
      "url_syntax" : "http://www.gramene.org/db/protein/protein_search?acc=[example_id]",
      "url_example" : "http://www.gramene.org/db/protein/protein_search?acc=Q6VSV0",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "PR:000000001 ! protein",
      "name" : null,
      "database" : "Gramene",
      "example_id" : "GR_PROTEIN:Q6VSV0",
      "fullname" : null,
      "local_id_syntax" : "[A-Z][0-9][A-Z0-9]{3}[0-9]"
   },
   "ma" : {
      "fullname" : null,
      "description" : "Adult Mouse Anatomical Dictionary; part of Gene Expression Database",
      "name" : null,
      "example_id" : "MA:0000003",
      "database" : "Adult Mouse Anatomical Dictionary",
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://www.informatics.jax.org/searches/AMA.cgi?id=MA:0000003",
      "url_syntax" : "http://www.informatics.jax.org/searches/AMA.cgi?id=MA:[example_id]",
      "generic_url" : "http://www.informatics.jax.org/",
      "abbreviation" : "MA",
      "datatype" : null
   },
   "syscilia_ccnet" : {
      "description" : "A systems biology approach to dissect cilia function and its disruption in human genetic disease",
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : null,
      "name" : null,
      "database" : "Syscilia",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "abbreviation" : "SYSCILIA_CCNET",
      "generic_url" : "http://syscilia.org/",
      "url_syntax" : null,
      "url_example" : null
   },
   "gorel" : {
      "url_example" : null,
      "url_syntax" : null,
      "datatype" : null,
      "generic_url" : "http://purl.obolibrary.org/obo/ro",
      "abbreviation" : "GOREL",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "GO Extensions to OBO Relation Ontology Ontology",
      "example_id" : null,
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "description" : "Additional relations pending addition into RO",
      "fullname" : null
   },
   "dictybase_ref" : {
      "datatype" : null,
      "generic_url" : "http://dictybase.org",
      "abbreviation" : "dictyBase_REF",
      "url_syntax" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=[example_id]",
      "url_example" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=10157",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "dictyBase_REF:10157",
      "name" : null,
      "database" : "dictyBase literature references",
      "fullname" : null
   },
   "cazy" : {
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "abbreviation" : "CAZY",
      "generic_url" : "http://www.cazy.org/",
      "url_example" : "http://www.cazy.org/PL11.html",
      "url_syntax" : "http://www.cazy.org/[example_id].html",
      "description" : "The CAZy database describes the families of structurally-related catalytic and carbohydrate-binding modules (or functional domains) of enzymes that degrade, modify, or create glycosidic bonds.",
      "fullname" : null,
      "local_id_syntax" : "(CE|GH|GT|PL)\\d+",
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Carbohydrate Active EnZYmes",
      "example_id" : "CAZY:PL11",
      "name" : null
   },
   "po" : {
      "database" : "Plant Ontology Consortium Database",
      "example_id" : "PO:0009004",
      "name" : null,
      "entity_type" : "PO:0009012 ! plant structure development stage",
      "local_id_syntax" : "[0-9]{7}",
      "fullname" : null,
      "url_syntax" : "http://www.plantontology.org/amigo/go.cgi?action=query&view=query&search_constraint=terms&query=PO:[example_id]",
      "url_example" : "http://www.plantontology.org/amigo/go.cgi?action=query&view=query&search_constraint=terms&query=PO:0009004",
      "generic_url" : "http://www.plantontology.org/",
      "abbreviation" : "PO",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "ipr" : {
      "local_id_syntax" : "IPR\\d{6}",
      "fullname" : null,
      "database" : "InterPro database of protein domains and motifs",
      "example_id" : "InterPro:IPR000001",
      "name" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_syntax" : "http://www.ebi.ac.uk/interpro/entry/[example_id]",
      "url_example" : "http://www.ebi.ac.uk/interpro/entry/IPR015421",
      "generic_url" : "http://www.ebi.ac.uk/interpro/",
      "abbreviation" : "IPR",
      "datatype" : null
   },
   "phi" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "PHI:0000055",
      "name" : null,
      "database" : "MeGO (Phage and Mobile Element Ontology)",
      "id" : null,
      "object" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://aclame.ulb.ac.be/Classification/mego.html",
      "abbreviation" : "PHI",
      "url_syntax" : null,
      "url_example" : null
   },
   "casspc" : {
      "fullname" : null,
      "database" : "Catalog of Fishes species database",
      "example_id" : null,
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=1979",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=[example_id]",
      "abbreviation" : "CASSPC",
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "datatype" : null
   },
   "genprotec" : {
      "fullname" : null,
      "name" : null,
      "example_id" : null,
      "database" : "GenProtEC E. coli genome and proteome database",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "generic_url" : "http://genprotec.mbl.edu/",
      "abbreviation" : "GenProtEC"
   },
   "locsvmpsi" : {
      "description" : "Subcellular localization for eukayotic proteins based on SVM and PSI-BLAST",
      "fullname" : null,
      "name" : null,
      "example_id" : null,
      "database" : "LOCSVMPSI",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : null,
      "url_syntax" : null,
      "datatype" : null,
      "generic_url" : "http://bioinformatics.ustc.edu.cn/locsvmpsi/locsvmpsi.php",
      "abbreviation" : "LOCSVMpsi"
   },
   "fma" : {
      "database" : "Foundational Model of Anatomy",
      "example_id" : "FMA:61905",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null,
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "abbreviation" : "FMA",
      "generic_url" : "http://sig.biostr.washington.edu/projects/fm/index.html",
      "object" : null,
      "uri_prefix" : null,
      "id" : null
   },
   "wbphenotype" : {
      "example_id" : "WBPhenotype:0002117",
      "database" : "WormBase phenotype ontology",
      "name" : null,
      "entity_type" : "PATO:0000001 ! quality",
      "local_id_syntax" : "[0-9]{7}",
      "fullname" : null,
      "url_syntax" : "http://www.wormbase.org/species/c_elegans/phenotype/WBPhenotype:[example_id]",
      "url_example" : "http://www.wormbase.org/species/c_elegans/phenotype/WBPhenotype:0000154",
      "generic_url" : "http://www.wormbase.org/",
      "abbreviation" : "WBPhenotype",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null
   },
   "pamgo_gat" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "PAMGO_GAT:Atu0001",
      "name" : null,
      "database" : "Genome Annotation Tool (Agrobacterium tumefaciens C58); PAMGO Interest Group",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://agro.vbi.vt.edu/public/",
      "abbreviation" : "PAMGO_GAT",
      "datatype" : null,
      "url_example" : "http://agro.vbi.vt.edu/public/servlet/GeneEdit?&Search=Search&level=2&genename=atu0001",
      "url_syntax" : "http://agro.vbi.vt.edu/public/servlet/GeneEdit?&Search=Search&level=2&genename=[example_id]"
   },
   "pmcid" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?db=pmc&cmd=search&term=PMC201377",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?db=pmc&cmd=search&term=[example_id]",
      "datatype" : null,
      "abbreviation" : "PMCID",
      "generic_url" : "http://www.pubmedcentral.nih.gov/",
      "fullname" : null,
      "database" : "Pubmed Central",
      "example_id" : "PMCID:PMC201377",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "kegg" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : null,
      "url_syntax" : null,
      "abbreviation" : "KEGG",
      "generic_url" : "http://www.genome.ad.jp/kegg/",
      "datatype" : null,
      "fullname" : null,
      "example_id" : null,
      "name" : null,
      "database" : "Kyoto Encyclopedia of Genes and Genomes",
      "entity_type" : "BET:0000000 ! entity"
   },
   "psi-mi" : {
      "url_example" : null,
      "url_syntax" : null,
      "generic_url" : "http://psidev.sourceforge.net/mi/xml/doc/user/index.html",
      "abbreviation" : "PSI-MI",
      "datatype" : null,
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "example_id" : "MI:0018",
      "name" : null,
      "database" : "Proteomic Standard Initiative for Molecular Interaction",
      "entity_type" : "BET:0000000 ! entity",
      "fullname" : null
   },
   "asap" : {
      "fullname" : null,
      "database" : "A Systematic Annotation Package for Community Analysis of Genomes",
      "example_id" : "ASAP:ABE-0000008",
      "name" : null,
      "entity_type" : "SO:0000704 ! gene",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : "https://asap.ahabs.wisc.edu/annotation/php/feature_info.php?FeatureID=[example_id]",
      "url_example" : "https://asap.ahabs.wisc.edu/annotation/php/feature_info.php?FeatureID=ABE-0000008",
      "datatype" : null,
      "generic_url" : "https://asap.ahabs.wisc.edu/annotation/php/ASAP1.htm",
      "abbreviation" : "ASAP"
   },
   "rebase" : {
      "abbreviation" : "REBASE",
      "generic_url" : "http://rebase.neb.com/rebase/rebase.html",
      "datatype" : null,
      "url_syntax" : "http://rebase.neb.com/rebase/enz/[example_id].html",
      "url_example" : "http://rebase.neb.com/rebase/enz/EcoRI.html",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "REBASE:EcoRI",
      "database" : "REBASE restriction enzyme database",
      "name" : null,
      "fullname" : null
   },
   "ensembl_proteinid" : {
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "url_example" : "http://www.ensembl.org/id/ENSP00000361027",
      "datatype" : null,
      "generic_url" : "http://www.ensembl.org/",
      "abbreviation" : "ENSEMBL_ProteinID",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "example_id" : "ENSEMBL_ProteinID:ENSP00000361027",
      "database" : "Ensembl database of automatically annotated genomic data",
      "name" : null,
      "entity_type" : "PR:000000001 ! protein",
      "local_id_syntax" : "ENSP[0-9]{9,16}",
      "fullname" : null
   },
   "ena" : {
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "ENA",
      "generic_url" : "http://www.ebi.ac.uk/ena/",
      "datatype" : null,
      "url_syntax" : "http://www.ebi.ac.uk/ena/data/view/[example_id]",
      "url_example" : "http://www.ebi.ac.uk/ena/data/view/AA816246",
      "fullname" : null,
      "description" : "ENA is made up of a number of distinct databases that includes EMBL-Bank, the newly established Sequence Read Archive (SRA) and the Trace Archive. International nucleotide sequence database collaboration, comprising ENA-EBI nucleotide sequence data library (EMBL-Bank), DNA DataBank of Japan (DDBJ), and NCBI GenBank",
      "local_id_syntax" : "([A-Z]{1}[0-9]{5})|([A-Z]{2}[0-9]{6})|([A-Z]{4}[0-9]{8,9})",
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "ENA:AA816246",
      "database" : "European Nucleotide Archive",
      "name" : null
   },
   "go_ref" : {
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "generic_url" : "http://www.geneontology.org/",
      "abbreviation" : "GO_REF",
      "datatype" : null,
      "url_syntax" : "http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:[example_id]",
      "url_example" : "http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:0000001",
      "fullname" : null,
      "local_id_syntax" : "\\d{7}",
      "entity_type" : "BET:0000000 ! entity",
      "database" : "Gene Ontology Database references",
      "example_id" : "GO_REF:0000001",
      "name" : null
   },
   "sanger" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null,
      "generic_url" : "http://www.sanger.ac.uk/",
      "abbreviation" : "Sanger",
      "fullname" : null,
      "example_id" : null,
      "name" : null,
      "database" : "Wellcome Trust Sanger Institute",
      "entity_type" : "BET:0000000 ! entity"
   },
   "vega" : {
      "entity_type" : "BET:0000000 ! entity",
      "name" : null,
      "example_id" : "VEGA:OTTHUMP00000000661",
      "database" : "Vertebrate Genome Annotation database",
      "fullname" : null,
      "abbreviation" : "VEGA",
      "generic_url" : "http://vega.sanger.ac.uk/index.html",
      "datatype" : null,
      "url_example" : "http://vega.sanger.ac.uk/perl/searchview?species=all&idx=All&q=OTTHUMP00000000661",
      "url_syntax" : "http://vega.sanger.ac.uk/perl/searchview?species=all&idx=All&q=[example_id]",
      "id" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "modbase" : {
      "generic_url" : "http://modbase.compbio.ucsf.edu/",
      "abbreviation" : "ModBase",
      "datatype" : null,
      "url_syntax" : "http://salilab.org/modbase/searchbyid?databaseID=[example_id]",
      "url_example" : "http://salilab.org/modbase/searchbyid?databaseID=P04848",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "ModBase comprehensive Database of Comparative Protein Structure Models",
      "example_id" : "ModBase:P10815",
      "name" : null,
      "fullname" : null
   },
   "ro" : {
      "description" : "A collection of relations used across OBO ontologies",
      "fullname" : null,
      "database" : "OBO Relation Ontology Ontology",
      "example_id" : "RO:0002211",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://purl.obolibrary.org/obo/RO_0002211",
      "url_syntax" : "http://purl.obolibrary.org/obo/RO_[example_id]",
      "datatype" : null,
      "generic_url" : "http://purl.obolibrary.org/obo/ro",
      "abbreviation" : "RO"
   },
   "imgt_hla" : {
      "fullname" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "IMGT_HLA:HLA00031",
      "name" : null,
      "database" : "IMGT/HLA human major histocompatibility complex sequence database",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "IMGT_HLA",
      "generic_url" : "http://www.ebi.ac.uk/imgt/hla",
      "datatype" : null,
      "url_syntax" : null,
      "url_example" : null
   },
   "fb" : {
      "uri_prefix" : null,
      "object" : null,
      "id" : null,
      "url_example" : "http://flybase.org/reports/FBgn0000024.html",
      "url_syntax" : "http://flybase.org/reports/[example_id].html",
      "abbreviation" : "FB",
      "generic_url" : "http://flybase.org/",
      "datatype" : null,
      "local_id_syntax" : "FBgn[0-9]{7}",
      "fullname" : null,
      "database" : "FlyBase",
      "example_id" : "FB:FBgn0000024",
      "name" : null,
      "entity_type" : "SO:0000704 ! gene"
   },
   "geo" : {
      "abbreviation" : "GEO",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/geo/",
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/GDSbrowser?acc=[example_id]",
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/GDSbrowser?acc=GDS2223",
      "id" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "database" : "NCBI Gene Expression Omnibus",
      "example_id" : "GEO:GDS2223",
      "name" : null,
      "fullname" : null
   },
   "chebi" : {
      "local_id_syntax" : "[0-9]{1,6}",
      "fullname" : null,
      "example_id" : "CHEBI:17234",
      "name" : null,
      "database" : "Chemical Entities of Biological Interest",
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:17234",
      "url_syntax" : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:[example_id]",
      "datatype" : null,
      "generic_url" : "http://www.ebi.ac.uk/chebi/",
      "abbreviation" : "ChEBI"
   },
   "um-bbd_enzymeid" : {
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "url_example" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=ep&enzymeID=e0230",
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=ep&enzymeID=[example_id]",
      "datatype" : null,
      "abbreviation" : "UM-BBD_enzymeID",
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "fullname" : null,
      "example_id" : "UM-BBD_enzymeID:e0413",
      "name" : null,
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "entity_type" : "BET:0000000 ! entity"
   },
   "kegg_enzyme" : {
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?ec:2.1.1.4",
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?ec:[example_id]",
      "datatype" : null,
      "generic_url" : "http://www.genome.jp/dbget-bin/www_bfind?enzyme",
      "abbreviation" : "KEGG_ENZYME",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "KEGG Enzyme Database",
      "example_id" : "KEGG_ENZYME:2.1.1.4",
      "name" : null,
      "entity_type" : "BET:0000000 ! entity",
      "local_id_syntax" : "\\d(\\.\\d{1,2}){2}\\.\\d{1,3}",
      "fullname" : null
   },
   "pr" : {
      "url_syntax" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:[example_id]",
      "url_example" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:000025380",
      "datatype" : null,
      "generic_url" : "http://www.proconsortium.org/pro/pro.shtml",
      "abbreviation" : "PR",
      "object" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "Protein Ontology",
      "example_id" : "PR:000025380",
      "name" : null,
      "entity_type" : "PR:000000001 ! protein",
      "local_id_syntax" : "[0-9]{9}",
      "fullname" : null
   }
};
/* 
 * Package: dispatch.js
 * 
 * Namespace: amigo.data.dispatch
 * 
 * This package was automatically created during an AmiGO 2 installation
 * from the YAML configuration files that AmiGO pulls in.
 *
 * The mapping file for data fields and contexts to functions, often
 * used for displays. See the package <handler.js> for the API to interact
 * with this data file.
 *
 * NOTE: This file is generated dynamically at installation time.
 * Hard to work with unit tests--hope it's not too bad. You have to
 * occasionally copy back to keep the unit tests sane.
 *
 * NOTE: This file has a slightly different latout from the YAML
 * configuration file.
 */

// All of the server/instance-specific meta-data.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Variable: dispatch
 * 
 * The configuration for the data.
 * Essentially a JSONification of the YAML file.
 * This should be consumed directly by <amigo.handler>.
 */
amigo.data.dispatch = {
   "qualifier" : {
      "context" : {
         "bbop.widgets.search_pane" : "amigo.handlers.qualifiers"
      }
   },
   "annotation_extension_json" : {
      "context" : {
         "bbop.widgets.search_pane" : "amigo.handlers.owl_class_expression"
      }
   }
};
/*
 * Package: context.js
 * 
 * Namespace: amigo.data.context
 * 
 * Another context.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }

/*
 * Variable: context
 * 
 * Colors are X11: http://cng.seas.rochester.edu/CNG/docs/x11color.html
 */
amigo.data.context = {
    'instance_of':
    {
	readable: 'activity',
	priority: 8,
	aliases: [
	    'activity'
	],
	color: '#FFFAFA' // snow
    },
    'BFO:0000050':
    {
	readable: 'part of',
	priority: 15,
	aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000050',
		//'http://purl.obolibrary.org/obo/part_of',
	    'BFO_0000050',
	    'part:of',
	    'part of',
	    'part_of'
	],
	color: '#add8e6' // light blue
    },
    'BFO:0000051':
    {
	readable: 'has part',
	priority: 4,
	aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000051',
	    'has:part',
	    'has part',
	    'has_part'
	],
	color: '#6495ED' // cornflower blue
    },
    'BFO:0000066':
    {
	readable: 'occurs in',
	priority: 12,
	aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000066',
		//'BFO_0000066',
	    'occurs:in',
	    'occurs in',
	    'occurs_in'
	],
	color: '#66CDAA' // medium aquamarine
    },
    'RO:0002202':
    {
	readable: 'develops from',
	priority: 0,
	aliases: [
	    'develops:from',
	    'develops from',
	    'develops_from'
	],
	color: '#A52A2A' // brown
    },
    'RO:0002211':
    {
	readable: 'regulates',
	priority: 16,
	aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002211'
	    'regulates'
	],
	color: '#2F4F4F' // dark slate grey
    },
    'RO:0002212':
    {
	readable: 'negatively regulates',
	priority: 17,
	aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002212'
	    'negatively:regulates',
	    'negatively regulates',
	    'negatively_regulates'
	],
	glyph: 'bar',
	color: '#FF0000' // red
    },
    'RO:0002213':
    {
	readable: 'positively regulates',
	priority: 18,
	aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002213'
	    'positively:regulates',
	    'positively regulates',
	    'positively_regulates'
	],
	glyph: 'arrow',
	color: '#008000' //green
    },
    'RO:0002233':
    {
	readable: 'has input',
	priority: 14,
	aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000051',
	    'has:input',
	    'has input',
	    'has_input'
	],
	color: '#6495ED' // cornflower blue
    },
    'RO:0002234':
    {
	readable: 'has output',
	priority: 0,
	aliases: [
	    'has:output',
	    'has output',
	    'has_output'
	],
	color: '#ED6495' // ??? - random
    },
    'RO:0002330':
    {
	readable: 'genomically related to',
	priority: 0,
	aliases: [
	    'genomically related to',
	    'genomically_related_to'
	],
	color: '#9932CC' // darkorchid
    },
    'RO:0002331':
    {
	readable: 'involved in',
	priority: 3,
	aliases: [
	    'involved:in',
	    'involved in',
	    'involved_in'
	],
	color: '#E9967A' // darksalmon
    },
    'RO:0002332':
    {
	readable: 'regulates level of',
	priority: 0,
	aliases: [
	    'regulates level of',
	    'regulates_level_of'
	],
	color: '#556B2F' // darkolivegreen
    },
    'RO:0002333':
    {
	readable: 'enabled by',
	priority: 13,
	aliases: [
	    'RO_0002333',
	    'enabled:by',
	    'enabled by',
	    'enabled_by'
	],
	color: '#B8860B' // darkgoldenrod
    },
    'RO:0002334':
    {
	readable: 'regulated by',
	priority: 0,
	aliases: [
	    'RO_0002334',
	    'regulated by',
	    'regulated_by'
	],
	color: '#86B80B' // ??? - random
    },
    'RO:0002335':
    {
	readable: 'negatively regulated by',
	priority: 0,
	aliases: [
	    'RO_0002335',
	    'negatively regulated by',
	    'negatively_regulated_by'
	],
	color: '#0B86BB' // ??? - random
    },
    'RO:0002336':
    {
	readable: 'positively regulated by',
	priority: 0,
	aliases: [
	    'RO_0002336',
	    'positively regulated by',
	    'positively_regulated_by'
	],
	color: '#BB0B86' // ??? - random
    },
    'activates':
    {
	readable: 'activates',
	priority: 0,
	aliases: [
	    'http://purl.obolibrary.org/obo/activates'
	],
	//glyph: 'arrow',
	//glyph: 'diamond',
	//glyph: 'wedge',
	//glyph: 'bar',
	color: '#8FBC8F' // darkseagreen
    },
    'RO:0002404':
    {
	readable: 'causally downstream of',
	priority: 2,
	aliases: [
	    'causally_downstream_of'
	],
	color: '#FF1493' // deeppink
    },
    'RO:0002406':
    {
	readable: 'directly activates',
	priority: 20,
	aliases: [
		//'http://purl.obolibrary.org/obo/directly_activates',
	    'directly:activates',
	    'directly activates',
	    'directly_activates'
	],
	glyph: 'arrow',
	color: '#2F4F4F' // darkslategray
    },
    'upstream_of':
    {
	readable: 'upstream of',
	priority: 2,
	aliases: [
		//'http://purl.obolibrary.org/obo/upstream_of'
	    'upstream:of',
	    'upstream of',
	    'upstream_of'
	],
	color: '#FF1493' // deeppink
    },
    'RO:0002408':
    {
	readable: 'directly inhibits',
	priority: 19,
	aliases: [
		//'http://purl.obolibrary.org/obo/directly_inhibits'
	    'directly:inhibits',
	    'directly inhibits',
	    'directly_inhibits'
	],
	glyph: 'bar',
	color: '#7FFF00' // chartreuse
    },
    'RO:0002411':
    {
	readable: 'causally upstream of',
	priority: 2,
	aliases: [
	    'causally_upstream_of'
	],
	color: '#483D8B' // darkslateblue
    },
    'indirectly_disables_action_of':
    {
	readable: 'indirectly disables action of',
	priority: 0,
	aliases: [
		//'http://purl.obolibrary.org/obo/indirectly_disables_action_of'
	    'indirectly disables action of',
	    'indirectly_disables_action_of'
	],
	color: '#483D8B' // darkslateblue
    },
    'provides_input_for':
    {
	readable: 'provides input for',
	priority: 0,
	aliases: [
	    'GOREL_provides_input_for',
	    'http://purl.obolibrary.org/obo/GOREL_provides_input_for'
	],
	color: '#483D8B' // darkslateblue
    },
    'RO:0002413':
    {
	readable: 'directly provides input for',
	priority: 1,
	aliases: [
	    'directly_provides_input_for',
	    'GOREL_directly_provides_input_for',
	    'http://purl.obolibrary.org/obo/GOREL_directly_provides_input_for'
	],
	glyph: 'diamond',
	color: '#483D8B' // darkslateblue
    },
    // New ones for monarch.
    'subclass_of':
    {
	readable: 'subclass of',
	priority: 100,
	aliases: [
	    'SUBCLASS_OF'
	],
	glyph: 'diamond',
	color: '#E9967A' // darksalmon
    },
    'superclass_of':
    {
	readable: 'superclass of',
	priority: 100,
	aliases: [
	    'SUPERCLASS_OF'
	],
	glyph: 'diamond',
	color: '#556B2F' // darkolivegreen
    },
    'annotation':
    {
	readable: 'annotation',
	priority: 100,
	aliases: [
	    'ANNOTATION'
	],
	glyph: 'diamond',
	color: '#483D8B' // darkslateblue
    }
};
/*
 * Package: statistics.js
 * 
 * Namespace: amigo.data.statistics
 * 
 * This package was automatically created during an AmiGO 2 installation.
 * 
 * Purpose: Useful numbers about the current data in the store.
 * 
 * Requirements: amigo2.js for bbop.amigo namespace.
 * 
 * NOTE: This file is generated dynamically at installation time.
 *       Hard to work with unit tests--hope it's not too bad.
 *       Want to keep this real simple.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.data == "undefined" ){ amigo.data = {}; }
if ( typeof amigo.data.statistics == "undefined" ){ amigo.data.statistics = {}; }

/*
 * Variable: annotation_evidence
 * 
 * TBD
 */
amigo.data.statistics.annotation_source = [["MGI", 143898], ["UniProtKB", 131680], ["ZFIN", 88093], ["WB", 68439], ["TAIR", 68319], ["SGD", 44070], ["PomBase", 38714], ["RGD", 23674], ["dictyBase", 20561], ["InterPro", 12251], ["TIGR", 11229], ["RefGenome", 7252], ["GOC", 6282], ["BHF-UCL", 4758], ["IntAct", 2036], ["HGNC", 532], ["UniPathway", 499], ["DFLAT", 311], ["PINC", 18], ["Roslin_Institute", 10], ["ENSEMBL", 5], ["Reactome", 3]];

/*
 * Variable: annotation_source
 * 
 * TBD
 */
amigo.data.statistics.annotation_evidence = [["experimental evidence", 192016], ["similarity evidence", 132787], ["curator inference", 68788], ["combinatorial evidence", 15414], ["author statement", 11503]];

/*
 * Variable: annotation_overview
 * 
 * TBD
 */
amigo.data.statistics.annotation_overview = [["Source", "similarity evidence", "experimental evidence", "curator inference", "author statement", "combinatorial evidence", "genomic context evidence", "biological system reconstruction", "imported information"], ["dictyBase", 9289, 4311, 6478, 483, 0, 0, 0, 0], ["EcoCyc", 0, 0, 0, 0, 0, 0, 0, 0], ["FlyBase", 0, 0, 0, 0, 0, 0, 0, 0], ["MGI", 53520, 55284, 32957, 2002, 135, 0, 0, 0], ["PomBase", 10204, 16257, 3661, 2286, 511, 0, 0, 0], ["RGD", 23674, 0, 0, 0, 0, 0, 0, 0], ["SGD", 3396, 33774, 4578, 2321, 1, 0, 0, 0], ["TAIR", 11078, 16661, 6626, 1663, 14752, 0, 0, 0], ["WB", 861, 33166, 60, 144, 1, 0, 0, 0], ["ZFIN", 507, 10672, 10946, 127, 0, 0, 0, 0]];
/*
 * Package: rollup.js
 * 
 * Namespace: amigo.ui.rollup
 * 
 * BBOP method to roll an information are up to save real estate.
 * This requires jQuery and an HTML format like:
 * 
 * : <div id="ID_TEXT" class="SOME_CLASS_FOR_YOUR_STYLING">
 * :  <span class="ANOTHERONE">ANCHOR_TEXT<a href="#"><img src="?" /></span></a>
 * :  <div>
 * :   ABC
 * :  </div>
 * : </div>
 * 
 * Usage would then simply be:
 * 
 * : amigo.ui.rollup(['ID_TEXT']);
 * 
 * As a note, for AmiGO 2, his is handled by the common templates
 * info_rollup_start.tmpl and info_rollup_end.tmpl in the amigo git
 * repo. Usage would be like:
 * 
 * : [% rollup_id = "ID_TEXT" %]
 * : [% rollup_anchor = "ANCHOR_TEXT" %]
 * : [% INCLUDE "common/info_rollup_start.tmpl" %]
 * : ABC
 * : [% INCLUDE "common/info_rollup_end.tmpl" %]
 * 
 * Again, this is a method, not an object constructor.
 */

// Module and namespace checking.
if ( typeof amigo == "undefined" ){ var amigo = {}; }
if ( typeof amigo.ui == "undefined" ){ amigo.ui = {}; }

/*
 * Method: rollup
 * 
 * See top-level for details.
 * 
 * Arguments:
 *  elt_ids - a list if element ids of the areas to roll up
 * 
 * Returns:
 *  n/a
 */
amigo.ui.rollup = function(elt_ids){

    var each = bbop.core.each;
    each(elt_ids,
    	 function(eltid){
	     var eheader = '#' + eltid + ' > div';
	     var earea = '#' + eltid + ' > span > a';
	     jQuery(eheader).hide();
    	     var click_elt =
		 jQuery(earea).click(function(){
					 jQuery(eheader).toggle("blind",{},250);
					 return false;
				     });
	 });
};

// If it looks like we're in an environment that supports CommonJS
// Modules 1.0, take the amigo namespace whole and export it. Otherwise
// (browser environment, etc.), take no action and depend on the
// global namespace.
if( typeof(exports) != 'undefined' ){

    // Old style--exporting separate namespace.
    exports.amigo = amigo;

    // New, better, style--assemble; these should not collide.
    bbop.core.each(amigo, function(k, v){
	exports[k] = v;
    });
}
