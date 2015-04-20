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
amigo.version.revision = "2.2.3";

/*
 * Variable: release
 *
 * Partial version for this library: release (date-like) information.
 */
amigo.version.release = "20150316";
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
   "bbop_term_ac" : {
      "fields" : [
         {
            "required" : "false",
            "display_name" : "Acc",
            "cardinality" : "single",
            "searchable" : "false",
            "id" : "id",
            "description" : "Term acc/ID.",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         {
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "Term acc/ID.",
            "id" : "annotation_class",
            "required" : "false",
            "display_name" : "Term",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "id" : "annotation_class_label",
            "description" : "Common term name.",
            "required" : "false",
            "display_name" : "Term",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "id" : "synonym",
            "description" : "Term synonyms.",
            "searchable" : "true",
            "cardinality" : "multi",
            "display_name" : "Synonyms",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "id" : "alternate_id",
            "description" : "Alternate term id.",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Alt ID",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         }
      ],
      "fields_hash" : {
         "alternate_id" : {
            "id" : "alternate_id",
            "description" : "Alternate term id.",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Alt ID",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "synonym" : {
            "id" : "synonym",
            "description" : "Term synonyms.",
            "searchable" : "true",
            "cardinality" : "multi",
            "display_name" : "Synonyms",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "annotation_class" : {
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "Term acc/ID.",
            "id" : "annotation_class",
            "required" : "false",
            "display_name" : "Term",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "annotation_class_label" : {
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "id" : "annotation_class_label",
            "description" : "Common term name.",
            "required" : "false",
            "display_name" : "Term",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "id" : {
            "required" : "false",
            "display_name" : "Acc",
            "cardinality" : "single",
            "searchable" : "false",
            "id" : "id",
            "description" : "Term acc/ID.",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         }
      },
      "display_name" : "Term autocomplete",
      "searchable_extension" : "_searchable",
      "description" : "Easily find ontology classes in GO. For personality only - not a schema configuration.",
      "document_category" : "ontology_class",
      "id" : "bbop_term_ac",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/term-autocomplete-config.yaml",
      "_strict" : 0,
      "result_weights" : "annotation_class^8.0 synonym^3.0 alternate_id^2.0",
      "boost_weights" : "annotation_class^5.0 annotation_class_label^5.0 synonym^1.0 alternate_id^1.0",
      "weight" : "-20",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/term-autocomplete-config.yaml",
      "schema_generating" : "false",
      "filter_weights" : "annotation_class^8.0 synonym^3.0 alternate_id^2.0"
   },
   "complex_annotation" : {
      "filter_weights" : "annotation_group_label^5.0 enabled_by_label^4.5 location_list_closure_label^4.0 process_class_closure_label^3.0 function_class_closure_label^2.0",
      "weight" : "-5",
      "boost_weights" : "annotation_group_label^1.0 annotation_unit_label^1.0 enabled_by^1.0 enabled_by_label^1.0 location_list_closure^1.0 location_list_closure_label^1.0 process_class_closure_label^1.0 function_class_closure_label^1.0",
      "schema_generating" : "true",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/complex-ann-config.yaml",
      "result_weights" : "function_class^5.0 enabled_by^4.0 location_list^3.0 process_class^2.0 annotation_group^1.0",
      "_strict" : 0,
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/complex-ann-config.yaml",
      "document_category" : "complex_annotation",
      "description" : "An individual unit within LEGO. This is <strong>ALPHA</strong> software.",
      "id" : "complex_annotation",
      "fields_hash" : {
         "panther_family" : {
            "type" : "string",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "id" : "panther_family",
            "cardinality" : "single",
            "searchable" : "true",
            "display_name" : "PANTHER family",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         "annotation_group_url" : {
            "id" : "annotation_group_url",
            "description" : "???.",
            "cardinality" : "single",
            "searchable" : "false",
            "display_name" : "Annotation group URL",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "function_class_closure_label" : {
            "type" : "string",
            "id" : "function_class_closure_label",
            "description" : "???",
            "searchable" : "true",
            "cardinality" : "multi",
            "display_name" : "Function",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         "process_class_closure_label" : {
            "type" : "string",
            "required" : "false",
            "display_name" : "Process",
            "cardinality" : "multi",
            "searchable" : "true",
            "id" : "process_class_closure_label",
            "description" : "???",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "process_class_label" : {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "id" : "process_class_label",
            "description" : "Common process name.",
            "required" : "false",
            "display_name" : "Process"
         },
         "process_class" : {
            "type" : "string",
            "description" : "Process acc/ID.",
            "id" : "process_class",
            "cardinality" : "single",
            "searchable" : "false",
            "display_name" : "Process",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         "taxon_closure" : {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "description" : "Taxon IDs derived from GAF column 13 and ncbi_taxonomy.obo.",
            "id" : "taxon_closure",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Taxon (IDs)",
            "required" : "false",
            "type" : "string"
         },
         "process_class_closure" : {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "display_name" : "Process",
            "required" : "false",
            "id" : "process_class_closure",
            "description" : "???",
            "cardinality" : "multi",
            "searchable" : "false"
         },
         "annotation_group" : {
            "type" : "string",
            "searchable" : "false",
            "cardinality" : "single",
            "id" : "annotation_group",
            "description" : "???.",
            "required" : "false",
            "display_name" : "Annotation group",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "annotation_unit_label" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "cardinality" : "single",
            "description" : "???.",
            "id" : "annotation_unit_label",
            "required" : "false",
            "display_name" : "Annotation unit",
            "type" : "string"
         },
         "taxon" : {
            "id" : "taxon",
            "description" : "GAF column 13 (taxon).",
            "searchable" : "false",
            "cardinality" : "single",
            "display_name" : "Taxon",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "location_list_closure_label" : {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "description" : "",
            "id" : "location_list_closure_label",
            "searchable" : "false",
            "cardinality" : "multi",
            "display_name" : "Location",
            "required" : "false",
            "type" : "string"
         },
         "function_class_label" : {
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "description" : "Common function name.",
            "id" : "function_class_label",
            "required" : "false",
            "display_name" : "Function",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "annotation_group_label" : {
            "display_name" : "Annotation group",
            "required" : "false",
            "id" : "annotation_group_label",
            "description" : "???.",
            "searchable" : "true",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "enabled_by_label" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "cardinality" : "single",
            "id" : "enabled_by_label",
            "description" : "???",
            "required" : "false",
            "display_name" : "Enabled by",
            "type" : "string"
         },
         "taxon_label" : {
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "id" : "taxon_label",
            "description" : "Taxon derived from GAF column 13 and ncbi_taxonomy.obo.",
            "required" : "false",
            "display_name" : "Taxon",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "location_list_closure" : {
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "false",
            "description" : "",
            "id" : "location_list_closure",
            "required" : "false",
            "display_name" : "Location",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "function_class" : {
            "display_name" : "Function",
            "required" : "false",
            "id" : "function_class",
            "description" : "Function acc/ID.",
            "cardinality" : "single",
            "searchable" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "panther_family_label" : {
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family_label",
            "cardinality" : "single",
            "searchable" : "true",
            "display_name" : "PANTHER family",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "location_list_label" : {
            "id" : "location_list_label",
            "description" : "",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Location",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "id" : {
            "required" : "false",
            "display_name" : "ID",
            "cardinality" : "single",
            "searchable" : "false",
            "id" : "id",
            "description" : "A unique (and internal) thing.",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         "function_class_closure" : {
            "type" : "string",
            "required" : "false",
            "display_name" : "Function",
            "searchable" : "false",
            "cardinality" : "multi",
            "description" : "???",
            "id" : "function_class_closure",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "location_list" : {
            "display_name" : "Location",
            "required" : "false",
            "id" : "location_list",
            "description" : "",
            "searchable" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "topology_graph_json" : {
            "type" : "string",
            "required" : "false",
            "display_name" : "Topology graph (JSON)",
            "searchable" : "false",
            "cardinality" : "single",
            "description" : "JSON blob form of the local stepwise topology graph.",
            "id" : "topology_graph_json",
            "transform" : [],
            "property" : [],
            "indexed" : "false"
         },
         "annotation_unit" : {
            "id" : "annotation_unit",
            "description" : "???.",
            "searchable" : "false",
            "cardinality" : "single",
            "display_name" : "Annotation unit",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "owl_blob_json" : {
            "indexed" : "false",
            "transform" : [],
            "property" : [],
            "required" : "false",
            "display_name" : "???",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "???",
            "id" : "owl_blob_json",
            "type" : "string"
         },
         "enabled_by" : {
            "display_name" : "Enabled by",
            "required" : "false",
            "id" : "enabled_by",
            "description" : "???",
            "searchable" : "true",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "taxon_closure_label" : {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Taxon",
            "required" : "false",
            "id" : "taxon_closure_label",
            "description" : "Taxon label closure derived from GAF column 13 and ncbi_taxonomy.obo.",
            "cardinality" : "multi",
            "searchable" : "true",
            "type" : "string"
         }
      },
      "display_name" : "Complex annotations (ALPHA)",
      "fields" : [
         {
            "required" : "false",
            "display_name" : "ID",
            "cardinality" : "single",
            "searchable" : "false",
            "id" : "id",
            "description" : "A unique (and internal) thing.",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         {
            "id" : "annotation_unit",
            "description" : "???.",
            "searchable" : "false",
            "cardinality" : "single",
            "display_name" : "Annotation unit",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "cardinality" : "single",
            "description" : "???.",
            "id" : "annotation_unit_label",
            "required" : "false",
            "display_name" : "Annotation unit",
            "type" : "string"
         },
         {
            "type" : "string",
            "searchable" : "false",
            "cardinality" : "single",
            "id" : "annotation_group",
            "description" : "???.",
            "required" : "false",
            "display_name" : "Annotation group",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "display_name" : "Annotation group",
            "required" : "false",
            "id" : "annotation_group_label",
            "description" : "???.",
            "searchable" : "true",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "id" : "annotation_group_url",
            "description" : "???.",
            "cardinality" : "single",
            "searchable" : "false",
            "display_name" : "Annotation group URL",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "display_name" : "Enabled by",
            "required" : "false",
            "id" : "enabled_by",
            "description" : "???",
            "searchable" : "true",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "cardinality" : "single",
            "id" : "enabled_by_label",
            "description" : "???",
            "required" : "false",
            "display_name" : "Enabled by",
            "type" : "string"
         },
         {
            "type" : "string",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "id" : "panther_family",
            "cardinality" : "single",
            "searchable" : "true",
            "display_name" : "PANTHER family",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         {
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family_label",
            "cardinality" : "single",
            "searchable" : "true",
            "display_name" : "PANTHER family",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "id" : "taxon",
            "description" : "GAF column 13 (taxon).",
            "searchable" : "false",
            "cardinality" : "single",
            "display_name" : "Taxon",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "id" : "taxon_label",
            "description" : "Taxon derived from GAF column 13 and ncbi_taxonomy.obo.",
            "required" : "false",
            "display_name" : "Taxon",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "description" : "Taxon IDs derived from GAF column 13 and ncbi_taxonomy.obo.",
            "id" : "taxon_closure",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Taxon (IDs)",
            "required" : "false",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Taxon",
            "required" : "false",
            "id" : "taxon_closure_label",
            "description" : "Taxon label closure derived from GAF column 13 and ncbi_taxonomy.obo.",
            "cardinality" : "multi",
            "searchable" : "true",
            "type" : "string"
         },
         {
            "display_name" : "Function",
            "required" : "false",
            "id" : "function_class",
            "description" : "Function acc/ID.",
            "cardinality" : "single",
            "searchable" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "description" : "Common function name.",
            "id" : "function_class_label",
            "required" : "false",
            "display_name" : "Function",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "type" : "string",
            "required" : "false",
            "display_name" : "Function",
            "searchable" : "false",
            "cardinality" : "multi",
            "description" : "???",
            "id" : "function_class_closure",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "type" : "string",
            "id" : "function_class_closure_label",
            "description" : "???",
            "searchable" : "true",
            "cardinality" : "multi",
            "display_name" : "Function",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         {
            "type" : "string",
            "description" : "Process acc/ID.",
            "id" : "process_class",
            "cardinality" : "single",
            "searchable" : "false",
            "display_name" : "Process",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "id" : "process_class_label",
            "description" : "Common process name.",
            "required" : "false",
            "display_name" : "Process"
         },
         {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "display_name" : "Process",
            "required" : "false",
            "id" : "process_class_closure",
            "description" : "???",
            "cardinality" : "multi",
            "searchable" : "false"
         },
         {
            "type" : "string",
            "required" : "false",
            "display_name" : "Process",
            "cardinality" : "multi",
            "searchable" : "true",
            "id" : "process_class_closure_label",
            "description" : "???",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "display_name" : "Location",
            "required" : "false",
            "id" : "location_list",
            "description" : "",
            "searchable" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "id" : "location_list_label",
            "description" : "",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Location",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "false",
            "description" : "",
            "id" : "location_list_closure",
            "required" : "false",
            "display_name" : "Location",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "description" : "",
            "id" : "location_list_closure_label",
            "searchable" : "false",
            "cardinality" : "multi",
            "display_name" : "Location",
            "required" : "false",
            "type" : "string"
         },
         {
            "indexed" : "false",
            "transform" : [],
            "property" : [],
            "required" : "false",
            "display_name" : "???",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "???",
            "id" : "owl_blob_json",
            "type" : "string"
         },
         {
            "type" : "string",
            "required" : "false",
            "display_name" : "Topology graph (JSON)",
            "searchable" : "false",
            "cardinality" : "single",
            "description" : "JSON blob form of the local stepwise topology graph.",
            "id" : "topology_graph_json",
            "transform" : [],
            "property" : [],
            "indexed" : "false"
         }
      ],
      "searchable_extension" : "_searchable"
   },
   "bioentity" : {
      "result_weights" : "bioentity^8.0 bioentity_name^7.0 taxon^6.0 panther_family^5.0 type^4.0 source^3.0 annotation_class_list^2.0 synonym^1.0",
      "schema_generating" : "true",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/bio-config.yaml",
      "weight" : "30",
      "boost_weights" : "bioentity^2.0 bioentity_label^2.0 bioentity_name^1.0 bioentity_internal_id^1.0 synonym^1.0 isa_partof_closure_label^1.0 regulates_closure^1.0 regulates_closure_label^1.0 panther_family^1.0 panther_family_label^1.0 taxon_closure_label^1.0",
      "filter_weights" : "source^7.0 type^6.0 panther_family_label^5.0 annotation_class_list_label^3.5 taxon_closure_label^4.0 regulates_closure_label^2.0",
      "searchable_extension" : "_searchable",
      "fields" : [
         {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Acc",
            "required" : "false",
            "description" : "Gene of gene product ID.",
            "id" : "id",
            "searchable" : "false",
            "cardinality" : "single",
            "type" : "string"
         },
         {
            "type" : "string",
            "searchable" : "false",
            "cardinality" : "single",
            "id" : "bioentity",
            "description" : "Gene or gene product ID.",
            "required" : "false",
            "display_name" : "Acc",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "description" : "Symbol or name.",
            "id" : "bioentity_label",
            "searchable" : "true",
            "cardinality" : "single",
            "display_name" : "Label",
            "required" : "false"
         },
         {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Name",
            "required" : "false",
            "description" : "The full name of the gene product.",
            "id" : "bioentity_name",
            "searchable" : "true",
            "cardinality" : "single",
            "type" : "string"
         },
         {
            "indexed" : "false",
            "transform" : [],
            "property" : [],
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "The bioentity ID used at the database of origin.",
            "id" : "bioentity_internal_id",
            "required" : "false",
            "display_name" : "This should not be displayed",
            "type" : "string"
         },
         {
            "type" : "string",
            "display_name" : "Type",
            "required" : "false",
            "id" : "type",
            "description" : "Type class.",
            "cardinality" : "single",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "required" : "false",
            "display_name" : "Taxon",
            "searchable" : "false",
            "cardinality" : "single",
            "id" : "taxon",
            "description" : "Taxonomic group",
            "type" : "string"
         },
         {
            "type" : "string",
            "required" : "false",
            "display_name" : "Taxon",
            "searchable" : "true",
            "cardinality" : "single",
            "id" : "taxon_label",
            "description" : "Taxonomic group",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "required" : "false",
            "display_name" : "Taxon",
            "searchable" : "false",
            "cardinality" : "multi",
            "id" : "taxon_closure",
            "description" : "Taxonomic group and ancestral groups."
         },
         {
            "display_name" : "Taxon",
            "required" : "false",
            "description" : "Taxonomic group and ancestral groups.",
            "id" : "taxon_closure_label",
            "cardinality" : "multi",
            "searchable" : "true",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "required" : "false",
            "display_name" : "Involved in",
            "cardinality" : "multi",
            "searchable" : "false",
            "id" : "isa_partof_closure",
            "description" : "Closure of ids/accs over isa and partof."
         },
         {
            "description" : "Closure of labels over isa and partof.",
            "id" : "isa_partof_closure_label",
            "cardinality" : "multi",
            "searchable" : "true",
            "display_name" : "Involved in",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "id" : "regulates_closure",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "searchable" : "false",
            "cardinality" : "multi",
            "display_name" : "Inferred annotation",
            "required" : "false",
            "type" : "string"
         },
         {
            "display_name" : "Inferred annotation",
            "required" : "false",
            "id" : "regulates_closure_label",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "searchable" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "required" : "false",
            "display_name" : "Source",
            "searchable" : "false",
            "cardinality" : "single",
            "id" : "source",
            "description" : "Database source.",
            "type" : "string"
         },
         {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "required" : "false",
            "display_name" : "Direct annotation",
            "searchable" : "false",
            "cardinality" : "multi",
            "id" : "annotation_class_list",
            "description" : "Direct annotations."
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "cardinality" : "multi",
            "searchable" : "false",
            "id" : "annotation_class_list_label",
            "description" : "Direct annotations.",
            "required" : "false",
            "display_name" : "Direct annotation",
            "type" : "string"
         },
         {
            "type" : "string",
            "display_name" : "Synonyms",
            "required" : "false",
            "id" : "synonym",
            "description" : "Gene product synonyms.",
            "cardinality" : "multi",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         {
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family",
            "required" : "false",
            "display_name" : "PANTHER family",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "display_name" : "PANTHER family",
            "required" : "false",
            "id" : "panther_family_label",
            "description" : "PANTHER families that are associated with this entity.",
            "searchable" : "true",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "type" : "string",
            "display_name" : "This should not be displayed",
            "required" : "false",
            "description" : "JSON blob form of the phylogenic tree.",
            "id" : "phylo_graph_json",
            "cardinality" : "single",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "false"
         },
         {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "searchable" : "false",
            "cardinality" : "multi",
            "id" : "database_xref",
            "description" : "Database cross-reference.",
            "required" : "false",
            "display_name" : "DB xref"
         }
      ],
      "fields_hash" : {
         "panther_family" : {
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family",
            "required" : "false",
            "display_name" : "PANTHER family",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "synonym" : {
            "type" : "string",
            "display_name" : "Synonyms",
            "required" : "false",
            "id" : "synonym",
            "description" : "Gene product synonyms.",
            "cardinality" : "multi",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         "isa_partof_closure_label" : {
            "description" : "Closure of labels over isa and partof.",
            "id" : "isa_partof_closure_label",
            "cardinality" : "multi",
            "searchable" : "true",
            "display_name" : "Involved in",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "regulates_closure" : {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "id" : "regulates_closure",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "searchable" : "false",
            "cardinality" : "multi",
            "display_name" : "Inferred annotation",
            "required" : "false",
            "type" : "string"
         },
         "annotation_class_list_label" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "cardinality" : "multi",
            "searchable" : "false",
            "id" : "annotation_class_list_label",
            "description" : "Direct annotations.",
            "required" : "false",
            "display_name" : "Direct annotation",
            "type" : "string"
         },
         "phylo_graph_json" : {
            "type" : "string",
            "display_name" : "This should not be displayed",
            "required" : "false",
            "description" : "JSON blob form of the phylogenic tree.",
            "id" : "phylo_graph_json",
            "cardinality" : "single",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "false"
         },
         "taxon_closure" : {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "required" : "false",
            "display_name" : "Taxon",
            "searchable" : "false",
            "cardinality" : "multi",
            "id" : "taxon_closure",
            "description" : "Taxonomic group and ancestral groups."
         },
         "type" : {
            "type" : "string",
            "display_name" : "Type",
            "required" : "false",
            "id" : "type",
            "description" : "Type class.",
            "cardinality" : "single",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         "database_xref" : {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "searchable" : "false",
            "cardinality" : "multi",
            "id" : "database_xref",
            "description" : "Database cross-reference.",
            "required" : "false",
            "display_name" : "DB xref"
         },
         "taxon" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "required" : "false",
            "display_name" : "Taxon",
            "searchable" : "false",
            "cardinality" : "single",
            "id" : "taxon",
            "description" : "Taxonomic group",
            "type" : "string"
         },
         "bioentity_internal_id" : {
            "indexed" : "false",
            "transform" : [],
            "property" : [],
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "The bioentity ID used at the database of origin.",
            "id" : "bioentity_internal_id",
            "required" : "false",
            "display_name" : "This should not be displayed",
            "type" : "string"
         },
         "bioentity" : {
            "type" : "string",
            "searchable" : "false",
            "cardinality" : "single",
            "id" : "bioentity",
            "description" : "Gene or gene product ID.",
            "required" : "false",
            "display_name" : "Acc",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "id" : {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Acc",
            "required" : "false",
            "description" : "Gene of gene product ID.",
            "id" : "id",
            "searchable" : "false",
            "cardinality" : "single",
            "type" : "string"
         },
         "regulates_closure_label" : {
            "display_name" : "Inferred annotation",
            "required" : "false",
            "id" : "regulates_closure_label",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "searchable" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "bioentity_label" : {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "description" : "Symbol or name.",
            "id" : "bioentity_label",
            "searchable" : "true",
            "cardinality" : "single",
            "display_name" : "Label",
            "required" : "false"
         },
         "bioentity_name" : {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Name",
            "required" : "false",
            "description" : "The full name of the gene product.",
            "id" : "bioentity_name",
            "searchable" : "true",
            "cardinality" : "single",
            "type" : "string"
         },
         "panther_family_label" : {
            "display_name" : "PANTHER family",
            "required" : "false",
            "id" : "panther_family_label",
            "description" : "PANTHER families that are associated with this entity.",
            "searchable" : "true",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "taxon_label" : {
            "type" : "string",
            "required" : "false",
            "display_name" : "Taxon",
            "searchable" : "true",
            "cardinality" : "single",
            "id" : "taxon_label",
            "description" : "Taxonomic group",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "taxon_closure_label" : {
            "display_name" : "Taxon",
            "required" : "false",
            "description" : "Taxonomic group and ancestral groups.",
            "id" : "taxon_closure_label",
            "cardinality" : "multi",
            "searchable" : "true",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "isa_partof_closure" : {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "required" : "false",
            "display_name" : "Involved in",
            "cardinality" : "multi",
            "searchable" : "false",
            "id" : "isa_partof_closure",
            "description" : "Closure of ids/accs over isa and partof."
         },
         "source" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "required" : "false",
            "display_name" : "Source",
            "searchable" : "false",
            "cardinality" : "single",
            "id" : "source",
            "description" : "Database source.",
            "type" : "string"
         },
         "annotation_class_list" : {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "required" : "false",
            "display_name" : "Direct annotation",
            "searchable" : "false",
            "cardinality" : "multi",
            "id" : "annotation_class_list",
            "description" : "Direct annotations."
         }
      },
      "display_name" : "Genes and gene products",
      "description" : "Genes and gene products associated with GO terms.",
      "document_category" : "bioentity",
      "id" : "bioentity",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/bio-config.yaml",
      "_strict" : 0
   },
   "ontology" : {
      "result_weights" : "annotation_class^8.0 description^6.0 source^4.0 synonym^3.0 alternate_id^2.0",
      "schema_generating" : "true",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/ont-config.yaml",
      "weight" : "40",
      "boost_weights" : "annotation_class^3.0 annotation_class_label^5.5 description^1.0 comment^0.5 synonym^1.0 alternate_id^1.0 regulates_closure^1.0 regulates_closure_label^1.0",
      "filter_weights" : "source^4.0 subset^3.0 regulates_closure_label^1.0 is_obsolete^0.0",
      "searchable_extension" : "_searchable",
      "fields_hash" : {
         "database_xref" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getXref"
            ],
            "required" : "false",
            "display_name" : "DB xref",
            "cardinality" : "multi",
            "searchable" : "false",
            "description" : "Database cross-reference.",
            "id" : "database_xref",
            "type" : "string"
         },
         "comment" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getComment"
            ],
            "searchable" : "true",
            "cardinality" : "single",
            "id" : "comment",
            "description" : "Term comment.",
            "required" : "false",
            "display_name" : "Comment",
            "type" : "string"
         },
         "only_in_taxon_closure" : {
            "type" : "string",
            "required" : "false",
            "display_name" : "Only in taxon (IDs)",
            "cardinality" : "multi",
            "searchable" : "false",
            "description" : "Only in taxon closure.",
            "id" : "only_in_taxon_closure",
            "transform" : [],
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "indexed" : "true"
         },
         "isa_partof_closure_label" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050"
            ],
            "searchable" : "true",
            "cardinality" : "multi",
            "description" : "Ancestral terms (is_a/part_of).",
            "id" : "isa_partof_closure_label",
            "required" : "false",
            "display_name" : "Is-a/part-of",
            "type" : "string"
         },
         "synonym" : {
            "searchable" : "true",
            "cardinality" : "multi",
            "description" : "Term synonyms.",
            "id" : "synonym",
            "required" : "false",
            "display_name" : "Synonyms",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getOBOSynonymStrings"
            ]
         },
         "regulates_closure" : {
            "type" : "string",
            "id" : "regulates_closure",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "searchable" : "false",
            "cardinality" : "multi",
            "display_name" : "Ancestor",
            "required" : "false",
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
            "transform" : [],
            "indexed" : "true"
         },
         "only_in_taxon_closure_label" : {
            "cardinality" : "multi",
            "searchable" : "true",
            "description" : "Only in taxon label closure.",
            "id" : "only_in_taxon_closure_label",
            "required" : "false",
            "display_name" : "Only in taxon",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ]
         },
         "consider" : {
            "display_name" : "Consider",
            "required" : "false",
            "id" : "consider",
            "description" : "Others terms you might want to look at.",
            "cardinality" : "multi",
            "searchable" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [
               "getAnnotationPropertyValues",
               "consider"
            ],
            "transform" : []
         },
         "annotation_class_label" : {
            "searchable" : "true",
            "cardinality" : "single",
            "description" : "Identifier.",
            "id" : "annotation_class_label",
            "required" : "false",
            "display_name" : "Term",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getLabel"
            ]
         },
         "is_obsolete" : {
            "property" : [
               "getIsObsoleteBinaryString"
            ],
            "transform" : [],
            "indexed" : "true",
            "type" : "boolean",
            "display_name" : "Obsoletion",
            "required" : "false",
            "description" : "Is the term obsolete?",
            "id" : "is_obsolete",
            "cardinality" : "single",
            "searchable" : "false"
         },
         "topology_graph_json" : {
            "indexed" : "false",
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
            "transform" : [],
            "description" : "JSON blob form of the local stepwise topology graph. Uses various relations (including regulates, occurs in, capable_of).",
            "id" : "topology_graph_json",
            "cardinality" : "single",
            "searchable" : "false",
            "display_name" : "Topology graph (JSON)",
            "required" : "false",
            "type" : "string"
         },
         "isa_partof_closure" : {
            "required" : "false",
            "display_name" : "Is-a/part-of",
            "searchable" : "false",
            "cardinality" : "multi",
            "description" : "Ancestral terms (is_a/part_of).",
            "id" : "isa_partof_closure",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050"
            ]
         },
         "source" : {
            "searchable" : "false",
            "cardinality" : "single",
            "description" : "Term namespace.",
            "id" : "source",
            "required" : "false",
            "display_name" : "Ontology source",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getNamespace"
            ]
         },
         "regulates_closure_label" : {
            "transform" : [],
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
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "true",
            "id" : "regulates_closure_label",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "required" : "false",
            "display_name" : "Ancestor"
         },
         "id" : {
            "transform" : [],
            "property" : [
               "getIdentifier"
            ],
            "indexed" : "true",
            "type" : "string",
            "required" : "false",
            "display_name" : "Acc",
            "cardinality" : "single",
            "searchable" : "false",
            "id" : "id",
            "description" : "Term identifier."
         },
         "description" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getDef"
            ],
            "searchable" : "true",
            "cardinality" : "single",
            "id" : "description",
            "description" : "Term definition.",
            "required" : "false",
            "display_name" : "Definition",
            "type" : "string"
         },
         "definition_xref" : {
            "type" : "string",
            "id" : "definition_xref",
            "description" : "Definition cross-reference.",
            "searchable" : "false",
            "cardinality" : "multi",
            "display_name" : "Def xref",
            "required" : "false",
            "property" : [
               "getDefXref"
            ],
            "transform" : [],
            "indexed" : "true"
         },
         "annotation_class" : {
            "searchable" : "false",
            "cardinality" : "single",
            "id" : "annotation_class",
            "description" : "Term identifier.",
            "required" : "false",
            "display_name" : "Term",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getIdentifier"
            ]
         },
         "only_in_taxon_label" : {
            "transform" : [],
            "property" : [
               "getLabel"
            ],
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "description" : "Only in taxon label.",
            "id" : "only_in_taxon_label",
            "required" : "false",
            "display_name" : "Only in taxon"
         },
         "alternate_id" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getAnnotationPropertyValues",
               "alt_id"
            ],
            "required" : "false",
            "display_name" : "Alt ID",
            "cardinality" : "multi",
            "searchable" : "false",
            "description" : "Alternate term identifier.",
            "id" : "alternate_id",
            "type" : "string"
         },
         "replaced_by" : {
            "indexed" : "true",
            "property" : [
               "getAnnotationPropertyValues",
               "replaced_by"
            ],
            "transform" : [],
            "description" : "Term that replaces this term.",
            "id" : "replaced_by",
            "searchable" : "false",
            "cardinality" : "multi",
            "display_name" : "Replaced By",
            "required" : "false",
            "type" : "string"
         },
         "regulates_transitivity_graph_json" : {
            "type" : "string",
            "display_name" : "Regulates transitivity graph (JSON)",
            "required" : "false",
            "id" : "regulates_transitivity_graph_json",
            "description" : "JSON blob form of the local relation transitivity graph. Uses various relations (including regulates, occurs in, capable_of).",
            "searchable" : "false",
            "cardinality" : "single",
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
            "transform" : [],
            "indexed" : "false"
         },
         "subset" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getSubsets"
            ],
            "required" : "false",
            "display_name" : "Subset",
            "cardinality" : "multi",
            "searchable" : "false",
            "id" : "subset",
            "description" : "Special use collections of terms.",
            "type" : "string"
         },
         "only_in_taxon" : {
            "property" : [
               "getIdentifier"
            ],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "description" : "Only in taxon.",
            "id" : "only_in_taxon",
            "cardinality" : "single",
            "searchable" : "true",
            "display_name" : "Only in taxon",
            "required" : "false"
         }
      },
      "display_name" : "Ontology",
      "fields" : [
         {
            "transform" : [],
            "property" : [
               "getIdentifier"
            ],
            "indexed" : "true",
            "type" : "string",
            "required" : "false",
            "display_name" : "Acc",
            "cardinality" : "single",
            "searchable" : "false",
            "id" : "id",
            "description" : "Term identifier."
         },
         {
            "searchable" : "false",
            "cardinality" : "single",
            "id" : "annotation_class",
            "description" : "Term identifier.",
            "required" : "false",
            "display_name" : "Term",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getIdentifier"
            ]
         },
         {
            "searchable" : "true",
            "cardinality" : "single",
            "description" : "Identifier.",
            "id" : "annotation_class_label",
            "required" : "false",
            "display_name" : "Term",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getLabel"
            ]
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getDef"
            ],
            "searchable" : "true",
            "cardinality" : "single",
            "id" : "description",
            "description" : "Term definition.",
            "required" : "false",
            "display_name" : "Definition",
            "type" : "string"
         },
         {
            "searchable" : "false",
            "cardinality" : "single",
            "description" : "Term namespace.",
            "id" : "source",
            "required" : "false",
            "display_name" : "Ontology source",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getNamespace"
            ]
         },
         {
            "property" : [
               "getIsObsoleteBinaryString"
            ],
            "transform" : [],
            "indexed" : "true",
            "type" : "boolean",
            "display_name" : "Obsoletion",
            "required" : "false",
            "description" : "Is the term obsolete?",
            "id" : "is_obsolete",
            "cardinality" : "single",
            "searchable" : "false"
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getComment"
            ],
            "searchable" : "true",
            "cardinality" : "single",
            "id" : "comment",
            "description" : "Term comment.",
            "required" : "false",
            "display_name" : "Comment",
            "type" : "string"
         },
         {
            "searchable" : "true",
            "cardinality" : "multi",
            "description" : "Term synonyms.",
            "id" : "synonym",
            "required" : "false",
            "display_name" : "Synonyms",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getOBOSynonymStrings"
            ]
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getAnnotationPropertyValues",
               "alt_id"
            ],
            "required" : "false",
            "display_name" : "Alt ID",
            "cardinality" : "multi",
            "searchable" : "false",
            "description" : "Alternate term identifier.",
            "id" : "alternate_id",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "property" : [
               "getAnnotationPropertyValues",
               "replaced_by"
            ],
            "transform" : [],
            "description" : "Term that replaces this term.",
            "id" : "replaced_by",
            "searchable" : "false",
            "cardinality" : "multi",
            "display_name" : "Replaced By",
            "required" : "false",
            "type" : "string"
         },
         {
            "display_name" : "Consider",
            "required" : "false",
            "id" : "consider",
            "description" : "Others terms you might want to look at.",
            "cardinality" : "multi",
            "searchable" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [
               "getAnnotationPropertyValues",
               "consider"
            ],
            "transform" : []
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getSubsets"
            ],
            "required" : "false",
            "display_name" : "Subset",
            "cardinality" : "multi",
            "searchable" : "false",
            "id" : "subset",
            "description" : "Special use collections of terms.",
            "type" : "string"
         },
         {
            "type" : "string",
            "id" : "definition_xref",
            "description" : "Definition cross-reference.",
            "searchable" : "false",
            "cardinality" : "multi",
            "display_name" : "Def xref",
            "required" : "false",
            "property" : [
               "getDefXref"
            ],
            "transform" : [],
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getXref"
            ],
            "required" : "false",
            "display_name" : "DB xref",
            "cardinality" : "multi",
            "searchable" : "false",
            "description" : "Database cross-reference.",
            "id" : "database_xref",
            "type" : "string"
         },
         {
            "required" : "false",
            "display_name" : "Is-a/part-of",
            "searchable" : "false",
            "cardinality" : "multi",
            "description" : "Ancestral terms (is_a/part_of).",
            "id" : "isa_partof_closure",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050"
            ]
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050"
            ],
            "searchable" : "true",
            "cardinality" : "multi",
            "description" : "Ancestral terms (is_a/part_of).",
            "id" : "isa_partof_closure_label",
            "required" : "false",
            "display_name" : "Is-a/part-of",
            "type" : "string"
         },
         {
            "type" : "string",
            "id" : "regulates_closure",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "searchable" : "false",
            "cardinality" : "multi",
            "display_name" : "Ancestor",
            "required" : "false",
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
            "transform" : [],
            "indexed" : "true"
         },
         {
            "transform" : [],
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
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "true",
            "id" : "regulates_closure_label",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "required" : "false",
            "display_name" : "Ancestor"
         },
         {
            "indexed" : "false",
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
            "transform" : [],
            "description" : "JSON blob form of the local stepwise topology graph. Uses various relations (including regulates, occurs in, capable_of).",
            "id" : "topology_graph_json",
            "cardinality" : "single",
            "searchable" : "false",
            "display_name" : "Topology graph (JSON)",
            "required" : "false",
            "type" : "string"
         },
         {
            "type" : "string",
            "display_name" : "Regulates transitivity graph (JSON)",
            "required" : "false",
            "id" : "regulates_transitivity_graph_json",
            "description" : "JSON blob form of the local relation transitivity graph. Uses various relations (including regulates, occurs in, capable_of).",
            "searchable" : "false",
            "cardinality" : "single",
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
            "transform" : [],
            "indexed" : "false"
         },
         {
            "property" : [
               "getIdentifier"
            ],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "description" : "Only in taxon.",
            "id" : "only_in_taxon",
            "cardinality" : "single",
            "searchable" : "true",
            "display_name" : "Only in taxon",
            "required" : "false"
         },
         {
            "transform" : [],
            "property" : [
               "getLabel"
            ],
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "description" : "Only in taxon label.",
            "id" : "only_in_taxon_label",
            "required" : "false",
            "display_name" : "Only in taxon"
         },
         {
            "type" : "string",
            "required" : "false",
            "display_name" : "Only in taxon (IDs)",
            "cardinality" : "multi",
            "searchable" : "false",
            "description" : "Only in taxon closure.",
            "id" : "only_in_taxon_closure",
            "transform" : [],
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "indexed" : "true"
         },
         {
            "cardinality" : "multi",
            "searchable" : "true",
            "description" : "Only in taxon label closure.",
            "id" : "only_in_taxon_closure_label",
            "required" : "false",
            "display_name" : "Only in taxon",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ]
         }
      ],
      "description" : "Gene Ontology Term, Synonym, or Definition.",
      "id" : "ontology",
      "document_category" : "ontology_class",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/ont-config.yaml",
      "_strict" : 0
   },
   "general" : {
      "description" : "A generic search document to get a general overview of everything.",
      "id" : "general",
      "document_category" : "general",
      "searchable_extension" : "_searchable",
      "fields_hash" : {
         "entity" : {
            "required" : "false",
            "display_name" : "Entity",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "The ID/label for this entity.",
            "id" : "entity",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         "id" : {
            "type" : "string",
            "required" : "false",
            "display_name" : "Internal ID",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "The mangled internal ID for this entity.",
            "id" : "id",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "general_blob" : {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "required" : "false",
            "display_name" : "Generic blob",
            "searchable" : "true",
            "cardinality" : "single",
            "description" : "A hidden searchable blob document to access this item. It should contain all the goodies that we want to search for, like species(?), synonyms, etc.",
            "id" : "general_blob"
         },
         "category" : {
            "type" : "string",
            "required" : "false",
            "display_name" : "Document category",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "The document category that this enitity belongs to.",
            "id" : "category",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "entity_label" : {
            "required" : "false",
            "display_name" : "Enity label",
            "searchable" : "true",
            "cardinality" : "single",
            "description" : "The label for this entity.",
            "id" : "entity_label",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         }
      },
      "fields" : [
         {
            "type" : "string",
            "required" : "false",
            "display_name" : "Internal ID",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "The mangled internal ID for this entity.",
            "id" : "id",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "required" : "false",
            "display_name" : "Entity",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "The ID/label for this entity.",
            "id" : "entity",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         {
            "required" : "false",
            "display_name" : "Enity label",
            "searchable" : "true",
            "cardinality" : "single",
            "description" : "The label for this entity.",
            "id" : "entity_label",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         {
            "type" : "string",
            "required" : "false",
            "display_name" : "Document category",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "The document category that this enitity belongs to.",
            "id" : "category",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "required" : "false",
            "display_name" : "Generic blob",
            "searchable" : "true",
            "cardinality" : "single",
            "description" : "A hidden searchable blob document to access this item. It should contain all the goodies that we want to search for, like species(?), synonyms, etc.",
            "id" : "general_blob"
         }
      ],
      "display_name" : "General",
      "_strict" : 0,
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/general-config.yaml",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/general-config.yaml",
      "schema_generating" : "true",
      "boost_weights" : "entity^3.0 entity_label^3.0 general_blob^3.0",
      "weight" : "0",
      "result_weights" : "entity^3.0 category^1.0",
      "filter_weights" : "category^4.0"
   },
   "family" : {
      "_strict" : 0,
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/protein-family-config.yaml",
      "description" : "Information about protein (PANTHER) families.",
      "document_category" : "family",
      "id" : "family",
      "display_name" : "Protein families",
      "fields_hash" : {
         "bioentity_list" : {
            "type" : "string",
            "required" : "false",
            "display_name" : "Gene/products",
            "cardinality" : "multi",
            "searchable" : "false",
            "id" : "bioentity_list",
            "description" : "Gene/products annotated with this protein family.",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "phylo_graph_json" : {
            "type" : "string",
            "description" : "JSON blob form of the phylogenic tree.",
            "id" : "phylo_graph_json",
            "searchable" : "false",
            "cardinality" : "single",
            "display_name" : "This should not be displayed",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "false"
         },
         "panther_family_label" : {
            "required" : "false",
            "display_name" : "PANTHER family",
            "searchable" : "true",
            "cardinality" : "single",
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family_label",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         "panther_family" : {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "id" : "panther_family",
            "required" : "false",
            "display_name" : "PANTHER family"
         },
         "id" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "required" : "false",
            "display_name" : "Acc",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "Family ID.",
            "id" : "id",
            "type" : "string"
         },
         "bioentity_list_label" : {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "description" : "Gene/products annotated with this protein family.",
            "id" : "bioentity_list_label",
            "searchable" : "false",
            "cardinality" : "multi",
            "display_name" : "Gene/products",
            "required" : "false"
         }
      },
      "fields" : [
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "required" : "false",
            "display_name" : "Acc",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "Family ID.",
            "id" : "id",
            "type" : "string"
         },
         {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "id" : "panther_family",
            "required" : "false",
            "display_name" : "PANTHER family"
         },
         {
            "required" : "false",
            "display_name" : "PANTHER family",
            "searchable" : "true",
            "cardinality" : "single",
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family_label",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         {
            "type" : "string",
            "description" : "JSON blob form of the phylogenic tree.",
            "id" : "phylo_graph_json",
            "searchable" : "false",
            "cardinality" : "single",
            "display_name" : "This should not be displayed",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "false"
         },
         {
            "type" : "string",
            "required" : "false",
            "display_name" : "Gene/products",
            "cardinality" : "multi",
            "searchable" : "false",
            "id" : "bioentity_list",
            "description" : "Gene/products annotated with this protein family.",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "description" : "Gene/products annotated with this protein family.",
            "id" : "bioentity_list_label",
            "searchable" : "false",
            "cardinality" : "multi",
            "display_name" : "Gene/products",
            "required" : "false"
         }
      ],
      "searchable_extension" : "_searchable",
      "filter_weights" : "bioentity_list_label^1.0",
      "weight" : "5",
      "boost_weights" : "panther_family^2.0 panther_family_label^2.0 bioentity_list^1.0 bioentity_list_label^1.0",
      "schema_generating" : "true",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/protein-family-config.yaml",
      "result_weights" : "panther_family^5.0 bioentity_list^4.0"
   },
   "bbop_ann_ev_agg" : {
      "document_category" : "annotation_evidence_aggregate",
      "id" : "bbop_ann_ev_agg",
      "description" : "A description of annotation evidence aggregate for GOlr and AmiGO.",
      "searchable_extension" : "_searchable",
      "fields" : [
         {
            "cardinality" : "single",
            "searchable" : "false",
            "id" : "id",
            "description" : "Gene/product ID.",
            "required" : "false",
            "display_name" : "Acc",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         {
            "description" : "Column 1 + columns 2.",
            "id" : "bioentity",
            "searchable" : "false",
            "cardinality" : "single",
            "display_name" : "Gene/product ID",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "id" : "bioentity_label",
            "description" : "Column 3.",
            "cardinality" : "single",
            "searchable" : "true",
            "display_name" : "Gene/product label",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "display_name" : "Annotation class",
            "required" : "false",
            "description" : "Column 5.",
            "id" : "annotation_class",
            "searchable" : "false",
            "cardinality" : "single"
         },
         {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "id" : "annotation_class_label",
            "description" : "Column 5 + ontology.",
            "searchable" : "true",
            "cardinality" : "single",
            "display_name" : "Annotation class label",
            "required" : "false",
            "type" : "string"
         },
         {
            "required" : "false",
            "display_name" : "Evidence type",
            "cardinality" : "multi",
            "searchable" : "false",
            "id" : "evidence_type_closure",
            "description" : "All evidence for this term/gene product pair",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "description" : "All column 8s for this term/gene product pair",
            "id" : "evidence_with",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Evidence with",
            "required" : "false",
            "type" : "string"
         },
         {
            "type" : "string",
            "required" : "false",
            "display_name" : "Taxon",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "Column 13: taxon.",
            "id" : "taxon",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "description" : "Derived from C13 + ncbi_taxonomy.obo.",
            "id" : "taxon_label",
            "searchable" : "true",
            "cardinality" : "single",
            "display_name" : "Taxon",
            "required" : "false"
         },
         {
            "type" : "string",
            "id" : "taxon_closure",
            "description" : "IDs derived from C13 + ncbi_taxonomy.obo.",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Taxon (IDs)",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "cardinality" : "multi",
            "searchable" : "true",
            "id" : "taxon_closure_label",
            "description" : "Labels derived from C13 + ncbi_taxonomy.obo.",
            "required" : "false",
            "display_name" : "Taxon",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "cardinality" : "single",
            "searchable" : "true",
            "description" : "Family IDs that are associated with this entity.",
            "id" : "panther_family",
            "required" : "false",
            "display_name" : "Protein family",
            "type" : "string"
         },
         {
            "type" : "string",
            "description" : "Families that are associated with this entity.",
            "id" : "panther_family_label",
            "searchable" : "true",
            "cardinality" : "single",
            "display_name" : "Family",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         }
      ],
      "fields_hash" : {
         "evidence_with" : {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "description" : "All column 8s for this term/gene product pair",
            "id" : "evidence_with",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Evidence with",
            "required" : "false",
            "type" : "string"
         },
         "annotation_class_label" : {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "id" : "annotation_class_label",
            "description" : "Column 5 + ontology.",
            "searchable" : "true",
            "cardinality" : "single",
            "display_name" : "Annotation class label",
            "required" : "false",
            "type" : "string"
         },
         "panther_family" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "cardinality" : "single",
            "searchable" : "true",
            "description" : "Family IDs that are associated with this entity.",
            "id" : "panther_family",
            "required" : "false",
            "display_name" : "Protein family",
            "type" : "string"
         },
         "evidence_type_closure" : {
            "required" : "false",
            "display_name" : "Evidence type",
            "cardinality" : "multi",
            "searchable" : "false",
            "id" : "evidence_type_closure",
            "description" : "All evidence for this term/gene product pair",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         "bioentity" : {
            "description" : "Column 1 + columns 2.",
            "id" : "bioentity",
            "searchable" : "false",
            "cardinality" : "single",
            "display_name" : "Gene/product ID",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "id" : {
            "cardinality" : "single",
            "searchable" : "false",
            "id" : "id",
            "description" : "Gene/product ID.",
            "required" : "false",
            "display_name" : "Acc",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         "bioentity_label" : {
            "id" : "bioentity_label",
            "description" : "Column 3.",
            "cardinality" : "single",
            "searchable" : "true",
            "display_name" : "Gene/product label",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "panther_family_label" : {
            "type" : "string",
            "description" : "Families that are associated with this entity.",
            "id" : "panther_family_label",
            "searchable" : "true",
            "cardinality" : "single",
            "display_name" : "Family",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         "taxon_label" : {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "description" : "Derived from C13 + ncbi_taxonomy.obo.",
            "id" : "taxon_label",
            "searchable" : "true",
            "cardinality" : "single",
            "display_name" : "Taxon",
            "required" : "false"
         },
         "taxon_closure" : {
            "type" : "string",
            "id" : "taxon_closure",
            "description" : "IDs derived from C13 + ncbi_taxonomy.obo.",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Taxon (IDs)",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         "annotation_class" : {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "display_name" : "Annotation class",
            "required" : "false",
            "description" : "Column 5.",
            "id" : "annotation_class",
            "searchable" : "false",
            "cardinality" : "single"
         },
         "taxon_closure_label" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "cardinality" : "multi",
            "searchable" : "true",
            "id" : "taxon_closure_label",
            "description" : "Labels derived from C13 + ncbi_taxonomy.obo.",
            "required" : "false",
            "display_name" : "Taxon",
            "type" : "string"
         },
         "taxon" : {
            "type" : "string",
            "required" : "false",
            "display_name" : "Taxon",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "Column 13: taxon.",
            "id" : "taxon",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         }
      },
      "display_name" : "Advanced",
      "_strict" : 0,
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann_ev_agg-config.yaml",
      "schema_generating" : "true",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann_ev_agg-config.yaml",
      "weight" : "-10",
      "boost_weights" : "annotation_class^2.0 annotation_class_label^1.0 bioentity^2.0 bioentity_label^1.0 panther_family^1.0 panther_family_label^1.0 taxon_closure_label^1.0",
      "result_weights" : "bioentity^4.0 annotation_class^3.0 taxon^2.0",
      "filter_weights" : "evidence_type_closure^4.0 evidence_with^3.0 taxon_closure_label^2.0"
   },
   "annotation" : {
      "schema_generating" : "true",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann-config.yaml",
      "weight" : "20",
      "boost_weights" : "annotation_class^2.0 annotation_class_label^1.0 bioentity^2.0 bioentity_label^1.0 bioentity_name^1.0 annotation_extension_class^2.0 annotation_extension_class_label^1.0 reference^1.0 panther_family^1.0 panther_family_label^1.0 bioentity_isoform^1.0 regulates_closure^1.0 regulates_closure_label^1.0",
      "result_weights" : "bioentity^7.0 bioentity_name^6.0 qualifier^5.0 annotation_class^4.7 annotation_extension_json^4.5 assigned_by^4.0 taxon^3.0 evidence_type^2.5 evidence_with^2.0 panther_family^1.5 bioentity_isoform^0.5 reference^0.25 date^0.10",
      "filter_weights" : "source^7.0 assigned_by^6.5 aspect^6.25 evidence_type_closure^6.0 panther_family_label^5.5 qualifier^5.25 taxon_closure_label^5.0 annotation_class_label^4.5 regulates_closure_label^3.0 annotation_extension_class_closure_label^2.0",
      "document_category" : "annotation",
      "description" : "Associations between GO terms and genes or gene products.",
      "id" : "annotation",
      "searchable_extension" : "_searchable",
      "fields_hash" : {
         "annotation_extension_class_closure_label" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "cardinality" : "multi",
            "searchable" : "true",
            "id" : "annotation_extension_class_closure_label",
            "description" : "Extension class for the annotation.",
            "required" : "false",
            "display_name" : "Annotation extension",
            "type" : "string"
         },
         "annotation_extension_class_label" : {
            "cardinality" : "multi",
            "searchable" : "true",
            "id" : "annotation_extension_class_label",
            "description" : "Extension class for the annotation.",
            "required" : "false",
            "display_name" : "Annotation extension",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         "taxon" : {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Taxon",
            "required" : "false",
            "description" : "Taxonomic group.",
            "id" : "taxon",
            "searchable" : "false",
            "cardinality" : "single",
            "type" : "string"
         },
         "synonym" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "cardinality" : "multi",
            "id" : "synonym",
            "description" : "Gene or gene product synonyms.",
            "required" : "false",
            "display_name" : "Synonym",
            "type" : "string"
         },
         "regulates_closure" : {
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "false",
            "description" : "Annotations for this term or its children (over regulates).",
            "id" : "regulates_closure",
            "required" : "false",
            "display_name" : "Inferred annotation",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "secondary_taxon" : {
            "display_name" : "Secondary taxon",
            "required" : "false",
            "description" : "Secondary taxon.",
            "id" : "secondary_taxon",
            "searchable" : "false",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "annotation_extension_json" : {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "display_name" : "Annotation extension",
            "required" : "false",
            "description" : "Extension class for the annotation (JSON).",
            "id" : "annotation_extension_json",
            "cardinality" : "multi",
            "searchable" : "false"
         },
         "annotation_extension_class" : {
            "type" : "string",
            "description" : "Extension class for the annotation.",
            "id" : "annotation_extension_class",
            "searchable" : "false",
            "cardinality" : "multi",
            "display_name" : "Annotation extension",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         "aspect" : {
            "id" : "aspect",
            "description" : "Ontology aspect.",
            "searchable" : "false",
            "cardinality" : "single",
            "display_name" : "Ontology (aspect)",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "evidence_type_closure" : {
            "type" : "string",
            "id" : "evidence_type_closure",
            "description" : "All evidence (evidence closure) for this annotation",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Evidence type",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         "taxon_label" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "cardinality" : "single",
            "searchable" : "true",
            "id" : "taxon_label",
            "description" : "Taxonomic group and ancestral groups.",
            "required" : "false",
            "display_name" : "Taxon",
            "type" : "string"
         },
         "annotation_class" : {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "description" : "Direct annotations.",
            "id" : "annotation_class",
            "searchable" : "false",
            "cardinality" : "single",
            "display_name" : "Direct annotation",
            "required" : "false"
         },
         "id" : {
            "display_name" : "Acc",
            "required" : "false",
            "description" : "A unique (and internal) combination of bioentity and ontology class.",
            "id" : "id",
            "searchable" : "false",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "secondary_taxon_closure" : {
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "false",
            "id" : "secondary_taxon_closure",
            "description" : "Secondary taxon closure.",
            "required" : "false",
            "display_name" : "Secondary taxon",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "assigned_by" : {
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "false",
            "id" : "assigned_by",
            "description" : "Annotations assigned by group.",
            "required" : "false",
            "display_name" : "Assigned by",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "is_redundant_for" : {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "display_name" : "Redundant for",
            "required" : "false",
            "description" : "Rational for redundancy of annotation.",
            "id" : "is_redundant_for",
            "cardinality" : "single",
            "searchable" : "false"
         },
         "taxon_closure_label" : {
            "type" : "string",
            "required" : "false",
            "display_name" : "Taxon",
            "cardinality" : "multi",
            "searchable" : "true",
            "description" : "Taxonomic group and ancestral groups.",
            "id" : "taxon_closure_label",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "isa_partof_closure" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "cardinality" : "multi",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "id" : "isa_partof_closure",
            "required" : "false",
            "display_name" : "Involved in",
            "type" : "string"
         },
         "secondary_taxon_closure_label" : {
            "type" : "string",
            "id" : "secondary_taxon_closure_label",
            "description" : "Secondary taxon closure.",
            "cardinality" : "multi",
            "searchable" : "true",
            "display_name" : "Secondary taxon",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         "bioentity" : {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "Gene or gene product identifiers.",
            "id" : "bioentity",
            "required" : "false",
            "display_name" : "Gene/product"
         },
         "reference" : {
            "id" : "reference",
            "description" : "Database reference.",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Reference",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         "evidence_type" : {
            "type" : "string",
            "id" : "evidence_type",
            "description" : "Evidence type.",
            "cardinality" : "single",
            "searchable" : "false",
            "display_name" : "Evidence",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         "taxon_closure" : {
            "required" : "false",
            "display_name" : "Taxon",
            "searchable" : "false",
            "cardinality" : "multi",
            "id" : "taxon_closure",
            "description" : "Taxonomic group and ancestral groups.",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         "bioentity_internal_id" : {
            "indexed" : "false",
            "property" : [],
            "transform" : [],
            "id" : "bioentity_internal_id",
            "description" : "The bioentity ID used at the database of origin.",
            "cardinality" : "single",
            "searchable" : "false",
            "display_name" : "This should not be displayed",
            "required" : "false",
            "type" : "string"
         },
         "bioentity_isoform" : {
            "type" : "string",
            "description" : "Biological isoform.",
            "id" : "bioentity_isoform",
            "cardinality" : "single",
            "searchable" : "false",
            "display_name" : "Isoform",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         "type" : {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "display_name" : "Type class id",
            "required" : "false",
            "id" : "type",
            "description" : "Type class.",
            "cardinality" : "single",
            "searchable" : "false"
         },
         "date" : {
            "type" : "string",
            "required" : "false",
            "display_name" : "Date",
            "searchable" : "false",
            "cardinality" : "single",
            "id" : "date",
            "description" : "Date of assignment.",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "panther_family" : {
            "required" : "false",
            "display_name" : "PANTHER family",
            "cardinality" : "single",
            "searchable" : "true",
            "id" : "panther_family",
            "description" : "PANTHER families that are associated with this entity.",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         "annotation_class_label" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "required" : "false",
            "display_name" : "Direct annotation",
            "searchable" : "true",
            "cardinality" : "single",
            "description" : "Direct annotations.",
            "id" : "annotation_class_label",
            "type" : "string"
         },
         "secondary_taxon_label" : {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "description" : "Secondary taxon.",
            "id" : "secondary_taxon_label",
            "searchable" : "true",
            "cardinality" : "single",
            "display_name" : "Secondary taxon",
            "required" : "false"
         },
         "has_participant_closure" : {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Has participant (IDs)",
            "required" : "false",
            "description" : "Closure of ids/accs over has_participant.",
            "id" : "has_participant_closure",
            "cardinality" : "multi",
            "searchable" : "false",
            "type" : "string"
         },
         "evidence_with" : {
            "searchable" : "false",
            "cardinality" : "multi",
            "id" : "evidence_with",
            "description" : "Evidence with/from.",
            "required" : "false",
            "display_name" : "Evidence with",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         "isa_partof_closure_label" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "cardinality" : "multi",
            "searchable" : "true",
            "id" : "isa_partof_closure_label",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "required" : "false",
            "display_name" : "Involved in",
            "type" : "string"
         },
         "qualifier" : {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Qualifier",
            "required" : "false",
            "id" : "qualifier",
            "description" : "Annotation qualifier.",
            "searchable" : "false",
            "cardinality" : "multi",
            "type" : "string"
         },
         "panther_family_label" : {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family_label",
            "cardinality" : "single",
            "searchable" : "true",
            "display_name" : "PANTHER family",
            "required" : "false"
         },
         "regulates_closure_label" : {
            "type" : "string",
            "display_name" : "Inferred annotation",
            "required" : "false",
            "description" : "Annotations for this term or its children (over regulates).",
            "id" : "regulates_closure_label",
            "searchable" : "true",
            "cardinality" : "multi",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         "bioentity_label" : {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "searchable" : "true",
            "cardinality" : "single",
            "id" : "bioentity_label",
            "description" : "Gene or gene product identifiers.",
            "required" : "false",
            "display_name" : "Gene/product"
         },
         "bioentity_name" : {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "searchable" : "true",
            "cardinality" : "single",
            "description" : "The full name of the gene or gene product.",
            "id" : "bioentity_name",
            "required" : "false",
            "display_name" : "Gene/product name"
         },
         "annotation_extension_class_closure" : {
            "type" : "string",
            "description" : "Extension class for the annotation.",
            "id" : "annotation_extension_class_closure",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Annotation extension",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         "source" : {
            "type" : "string",
            "searchable" : "false",
            "cardinality" : "single",
            "id" : "source",
            "description" : "Database source.",
            "required" : "false",
            "display_name" : "Source",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         "has_participant_closure_label" : {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "required" : "false",
            "display_name" : "Has participant",
            "searchable" : "true",
            "cardinality" : "multi",
            "description" : "Closure of labels over has_participant.",
            "id" : "has_participant_closure_label",
            "type" : "string"
         }
      },
      "display_name" : "Annotations",
      "fields" : [
         {
            "display_name" : "Acc",
            "required" : "false",
            "description" : "A unique (and internal) combination of bioentity and ontology class.",
            "id" : "id",
            "searchable" : "false",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "type" : "string",
            "searchable" : "false",
            "cardinality" : "single",
            "id" : "source",
            "description" : "Database source.",
            "required" : "false",
            "display_name" : "Source",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "display_name" : "Type class id",
            "required" : "false",
            "id" : "type",
            "description" : "Type class.",
            "cardinality" : "single",
            "searchable" : "false"
         },
         {
            "type" : "string",
            "required" : "false",
            "display_name" : "Date",
            "searchable" : "false",
            "cardinality" : "single",
            "id" : "date",
            "description" : "Date of assignment.",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "false",
            "id" : "assigned_by",
            "description" : "Annotations assigned by group.",
            "required" : "false",
            "display_name" : "Assigned by",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "display_name" : "Redundant for",
            "required" : "false",
            "description" : "Rational for redundancy of annotation.",
            "id" : "is_redundant_for",
            "cardinality" : "single",
            "searchable" : "false"
         },
         {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Taxon",
            "required" : "false",
            "description" : "Taxonomic group.",
            "id" : "taxon",
            "searchable" : "false",
            "cardinality" : "single",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "cardinality" : "single",
            "searchable" : "true",
            "id" : "taxon_label",
            "description" : "Taxonomic group and ancestral groups.",
            "required" : "false",
            "display_name" : "Taxon",
            "type" : "string"
         },
         {
            "required" : "false",
            "display_name" : "Taxon",
            "searchable" : "false",
            "cardinality" : "multi",
            "id" : "taxon_closure",
            "description" : "Taxonomic group and ancestral groups.",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         {
            "type" : "string",
            "required" : "false",
            "display_name" : "Taxon",
            "cardinality" : "multi",
            "searchable" : "true",
            "description" : "Taxonomic group and ancestral groups.",
            "id" : "taxon_closure_label",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "display_name" : "Secondary taxon",
            "required" : "false",
            "description" : "Secondary taxon.",
            "id" : "secondary_taxon",
            "searchable" : "false",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "description" : "Secondary taxon.",
            "id" : "secondary_taxon_label",
            "searchable" : "true",
            "cardinality" : "single",
            "display_name" : "Secondary taxon",
            "required" : "false"
         },
         {
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "false",
            "id" : "secondary_taxon_closure",
            "description" : "Secondary taxon closure.",
            "required" : "false",
            "display_name" : "Secondary taxon",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "type" : "string",
            "id" : "secondary_taxon_closure_label",
            "description" : "Secondary taxon closure.",
            "cardinality" : "multi",
            "searchable" : "true",
            "display_name" : "Secondary taxon",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "cardinality" : "multi",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "id" : "isa_partof_closure",
            "required" : "false",
            "display_name" : "Involved in",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "cardinality" : "multi",
            "searchable" : "true",
            "id" : "isa_partof_closure_label",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "required" : "false",
            "display_name" : "Involved in",
            "type" : "string"
         },
         {
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "false",
            "description" : "Annotations for this term or its children (over regulates).",
            "id" : "regulates_closure",
            "required" : "false",
            "display_name" : "Inferred annotation",
            "transform" : [],
            "property" : [],
            "indexed" : "true"
         },
         {
            "type" : "string",
            "display_name" : "Inferred annotation",
            "required" : "false",
            "description" : "Annotations for this term or its children (over regulates).",
            "id" : "regulates_closure_label",
            "searchable" : "true",
            "cardinality" : "multi",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Has participant (IDs)",
            "required" : "false",
            "description" : "Closure of ids/accs over has_participant.",
            "id" : "has_participant_closure",
            "cardinality" : "multi",
            "searchable" : "false",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "required" : "false",
            "display_name" : "Has participant",
            "searchable" : "true",
            "cardinality" : "multi",
            "description" : "Closure of labels over has_participant.",
            "id" : "has_participant_closure_label",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "cardinality" : "multi",
            "id" : "synonym",
            "description" : "Gene or gene product synonyms.",
            "required" : "false",
            "display_name" : "Synonym",
            "type" : "string"
         },
         {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "false",
            "description" : "Gene or gene product identifiers.",
            "id" : "bioentity",
            "required" : "false",
            "display_name" : "Gene/product"
         },
         {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "searchable" : "true",
            "cardinality" : "single",
            "id" : "bioentity_label",
            "description" : "Gene or gene product identifiers.",
            "required" : "false",
            "display_name" : "Gene/product"
         },
         {
            "transform" : [],
            "property" : [],
            "indexed" : "true",
            "type" : "string",
            "searchable" : "true",
            "cardinality" : "single",
            "description" : "The full name of the gene or gene product.",
            "id" : "bioentity_name",
            "required" : "false",
            "display_name" : "Gene/product name"
         },
         {
            "indexed" : "false",
            "property" : [],
            "transform" : [],
            "id" : "bioentity_internal_id",
            "description" : "The bioentity ID used at the database of origin.",
            "cardinality" : "single",
            "searchable" : "false",
            "display_name" : "This should not be displayed",
            "required" : "false",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Qualifier",
            "required" : "false",
            "id" : "qualifier",
            "description" : "Annotation qualifier.",
            "searchable" : "false",
            "cardinality" : "multi",
            "type" : "string"
         },
         {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "description" : "Direct annotations.",
            "id" : "annotation_class",
            "searchable" : "false",
            "cardinality" : "single",
            "display_name" : "Direct annotation",
            "required" : "false"
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "required" : "false",
            "display_name" : "Direct annotation",
            "searchable" : "true",
            "cardinality" : "single",
            "description" : "Direct annotations.",
            "id" : "annotation_class_label",
            "type" : "string"
         },
         {
            "id" : "aspect",
            "description" : "Ontology aspect.",
            "searchable" : "false",
            "cardinality" : "single",
            "display_name" : "Ontology (aspect)",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "type" : "string",
            "description" : "Biological isoform.",
            "id" : "bioentity_isoform",
            "cardinality" : "single",
            "searchable" : "false",
            "display_name" : "Isoform",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         {
            "type" : "string",
            "id" : "evidence_type",
            "description" : "Evidence type.",
            "cardinality" : "single",
            "searchable" : "false",
            "display_name" : "Evidence",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         {
            "type" : "string",
            "id" : "evidence_type_closure",
            "description" : "All evidence (evidence closure) for this annotation",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Evidence type",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         {
            "searchable" : "false",
            "cardinality" : "multi",
            "id" : "evidence_with",
            "description" : "Evidence with/from.",
            "required" : "false",
            "display_name" : "Evidence with",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         {
            "id" : "reference",
            "description" : "Database reference.",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Reference",
            "required" : "false",
            "type" : "string",
            "indexed" : "true",
            "property" : [],
            "transform" : []
         },
         {
            "type" : "string",
            "description" : "Extension class for the annotation.",
            "id" : "annotation_extension_class",
            "searchable" : "false",
            "cardinality" : "multi",
            "display_name" : "Annotation extension",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         {
            "cardinality" : "multi",
            "searchable" : "true",
            "id" : "annotation_extension_class_label",
            "description" : "Extension class for the annotation.",
            "required" : "false",
            "display_name" : "Annotation extension",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         {
            "type" : "string",
            "description" : "Extension class for the annotation.",
            "id" : "annotation_extension_class_closure",
            "cardinality" : "multi",
            "searchable" : "false",
            "display_name" : "Annotation extension",
            "required" : "false",
            "property" : [],
            "transform" : [],
            "indexed" : "true"
         },
         {
            "indexed" : "true",
            "transform" : [],
            "property" : [],
            "cardinality" : "multi",
            "searchable" : "true",
            "id" : "annotation_extension_class_closure_label",
            "description" : "Extension class for the annotation.",
            "required" : "false",
            "display_name" : "Annotation extension",
            "type" : "string"
         },
         {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "display_name" : "Annotation extension",
            "required" : "false",
            "description" : "Extension class for the annotation (JSON).",
            "id" : "annotation_extension_json",
            "cardinality" : "multi",
            "searchable" : "false"
         },
         {
            "required" : "false",
            "display_name" : "PANTHER family",
            "cardinality" : "single",
            "searchable" : "true",
            "id" : "panther_family",
            "description" : "PANTHER families that are associated with this entity.",
            "type" : "string",
            "indexed" : "true",
            "transform" : [],
            "property" : []
         },
         {
            "property" : [],
            "transform" : [],
            "indexed" : "true",
            "type" : "string",
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family_label",
            "cardinality" : "single",
            "searchable" : "true",
            "display_name" : "PANTHER family",
            "required" : "false"
         }
      ],
      "_strict" : 0,
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann-config.yaml"
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
    var meta_data = {"js_dev_base":"http://localhost:9999/static/staging","species":[],"image_base":"http://localhost:9999/static/images","beta":"1","bbop_img_star":"http://localhost:9999/static/images/star.png","species_map":{},"css_base":"http://localhost:9999/static/css","js_base":"http://localhost:9999/static/js","ontologies":[],"app_base":"http://localhost:9999","evidence_codes":{},"sources":[],"galaxy_base":"http://galaxy.berkeleybop.org/","gp_types":[],"term_regexp":"all|GO:[0-9]{7}","golr_base":"http://localhost:8080/solr/","html_base":"http://localhost:9999/static"};

    ///
    /// Break out the data and various functions to access them...
    ///

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
   "h-invdb_cdna" : {
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.h-invitational.jp/",
      "id" : null,
      "database" : "H-invitational Database",
      "url_example" : "http://www.h-invitational.jp/hinv/spsoup/transcript_view?acc_id=AK093149",
      "datatype" : null,
      "fullname" : null,
      "abbreviation" : "H-invDB_cDNA",
      "example_id" : "H-invDB_cDNA:AK093148",
      "url_syntax" : "http://www.h-invitational.jp/hinv/spsoup/transcript_view?acc_id=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null
   },
   "aspgdid" : {
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=ASPL0000067538",
      "datatype" : null,
      "object" : null,
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "example_id" : "AspGD:ASPL0000067538",
      "abbreviation" : "AspGDID",
      "fullname" : null,
      "uri_prefix" : null,
      "local_id_syntax" : "ASPL[0-9]{10}",
      "id" : null,
      "database" : "Aspergillus Genome Database",
      "generic_url" : "http://www.aspergillusgenome.org/",
      "name" : null
   },
   "vmd" : {
      "url_example" : "http://vmd.vbi.vt.edu/cgi-bin/browse/browserDetail_new.cgi?gene_id=109198",
      "datatype" : null,
      "url_syntax" : "http://vmd.vbi.vt.edu/cgi-bin/browse/browserDetail_new.cgi?gene_id=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "VMD",
      "example_id" : "VMD:109198",
      "uri_prefix" : null,
      "database" : "Virginia Bioinformatics Institute Microbial Database",
      "id" : null,
      "name" : null,
      "generic_url" : "http://phytophthora.vbi.vt.edu"
   },
   "issn" : {
      "fullname" : null,
      "example_id" : "ISSN:1234-1231",
      "abbreviation" : "ISSN",
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "url_example" : null,
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://www.issn.org/",
      "id" : null,
      "database" : "International Standard Serial Number",
      "uri_prefix" : null
   },
   "phi" : {
      "datatype" : null,
      "url_example" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "example_id" : "PHI:0000055",
      "abbreviation" : "PHI",
      "uri_prefix" : null,
      "database" : "MeGO (Phage and Mobile Element Ontology)",
      "id" : null,
      "name" : null,
      "generic_url" : "http://aclame.ulb.ac.be/Classification/mego.html"
   },
   "gr_qtl" : {
      "uri_prefix" : null,
      "database" : "Gramene",
      "id" : null,
      "generic_url" : "http://www.gramene.org/",
      "name" : null,
      "datatype" : null,
      "url_example" : "http://www.gramene.org/db/qtl/qtl_display?qtl_accession_id=CQU7",
      "object" : null,
      "url_syntax" : "http://www.gramene.org/db/qtl/qtl_display?qtl_accession_id=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "GR_QTL",
      "example_id" : "GR_QTL:CQU7",
      "fullname" : null
   },
   "sp_sl" : {
      "database" : "UniProt Knowledgebase Subcellular Location vocabulary",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.uniprot.org/locations/",
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.uniprot.org/locations/[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "UniProtKB-SubCell:SL-0012",
      "abbreviation" : "SP_SL",
      "url_example" : "http://www.uniprot.org/locations/SL-0012",
      "datatype" : null
   },
   "ensembl_proteinid" : {
      "generic_url" : "http://www.ensembl.org/",
      "name" : null,
      "local_id_syntax" : "ENSP[0-9]{9,16}",
      "database" : "Ensembl database of automatically annotated genomic data",
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "ENSEMBL_ProteinID",
      "example_id" : "ENSEMBL_ProteinID:ENSP00000361027",
      "fullname" : null,
      "object" : null,
      "entity_type" : "PR:000000001 ! protein",
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "datatype" : null,
      "url_example" : "http://www.ensembl.org/id/ENSP00000361027"
   },
   "ma" : {
      "generic_url" : "http://www.informatics.jax.org/",
      "name" : null,
      "database" : "Adult Mouse Anatomical Dictionary",
      "description" : "Adult Mouse Anatomical Dictionary; part of Gene Expression Database",
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "MA",
      "example_id" : "MA:0000003",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.informatics.jax.org/searches/AMA.cgi?id=MA:[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "url_example" : "http://www.informatics.jax.org/searches/AMA.cgi?id=MA:0000003",
      "datatype" : null
   },
   "bhf-ucl" : {
      "uri_prefix" : null,
      "description" : "The Cardiovascular Gene Ontology Annotation Initiative is supported by the British Heart Foundation (BHF) and located at University College London (UCL).",
      "database" : "Cardiovascular Gene Ontology Annotation Initiative",
      "id" : null,
      "generic_url" : "http://www.ucl.ac.uk/cardiovasculargeneontology/",
      "name" : null,
      "datatype" : null,
      "url_example" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "BHF-UCL",
      "example_id" : null,
      "fullname" : null
   },
   "dictybase_gene_name" : {
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "dictyBase_gene_name:mlcE",
      "abbreviation" : "dictyBase_gene_name",
      "url_example" : "http://dictybase.org/gene/mlcE",
      "datatype" : null,
      "database" : "dictyBase",
      "id" : null,
      "name" : null,
      "generic_url" : "http://dictybase.org",
      "uri_prefix" : null
   },
   "rnamdb" : {
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://s59.cas.albany.edu/RNAmods/",
      "database" : "RNA Modification Database",
      "id" : null,
      "datatype" : null,
      "url_example" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?091",
      "fullname" : null,
      "example_id" : "RNAmods:037",
      "abbreviation" : "RNAMDB",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?[example_id]",
      "object" : null
   },
   "tgd" : {
      "url_example" : null,
      "datatype" : null,
      "example_id" : null,
      "abbreviation" : "TGD",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "uri_prefix" : null,
      "generic_url" : "http://www.ciliate.org/",
      "name" : null,
      "database" : "Tetrahymena Genome Database",
      "id" : null
   },
   "mod" : {
      "database" : "Proteomics Standards Initiative protein modification ontology",
      "id" : null,
      "name" : null,
      "generic_url" : "http://psidev.sourceforge.net/mod/",
      "uri_prefix" : null,
      "url_syntax" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "MOD",
      "example_id" : "MOD:00219",
      "url_example" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:00219",
      "datatype" : null
   },
   "spd" : {
      "local_id_syntax" : "[0-9]{2}/[0-9]{2}[A-Z][0-9]{2}",
      "database" : "Schizosaccharomyces pombe Postgenome Database at RIKEN; includes Orfeome Localisation data",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.riken.jp/SPD/",
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.riken.jp/SPD/[example_id].html",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "SPD",
      "example_id" : "SPD:05/05F01",
      "url_example" : "http://www.riken.jp/SPD/05/05F01.html",
      "datatype" : null
   },
   "cgd" : {
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=CAL0005516",
      "datatype" : null,
      "abbreviation" : "CGD",
      "example_id" : "CGD:CAL0005516",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "uri_prefix" : null,
      "generic_url" : "http://www.candidagenome.org/",
      "name" : null,
      "local_id_syntax" : "(CAL|CAF)[0-9]{7}",
      "id" : null,
      "database" : "Candida Genome Database"
   },
   "syscilia_ccnet" : {
      "abbreviation" : "SYSCILIA_CCNET",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "datatype" : null,
      "url_example" : null,
      "generic_url" : "http://syscilia.org/",
      "name" : null,
      "id" : null,
      "description" : "A systems biology approach to dissect cilia function and its disruption in human genetic disease",
      "database" : "Syscilia",
      "uri_prefix" : null
   },
   "ddanat" : {
      "fullname" : null,
      "example_id" : "DDANAT:0000068",
      "abbreviation" : "DDANAT",
      "url_syntax" : null,
      "entity_type" : "CARO:0000000 ! anatomical entity",
      "object" : null,
      "url_example" : null,
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://dictybase.org/Dicty_Info/dicty_anatomy_ontology.html",
      "id" : null,
      "local_id_syntax" : "[0-9]{7}",
      "database" : "Dictyostelium discoideum anatomy",
      "uri_prefix" : null
   },
   "hpa_antibody" : {
      "datatype" : null,
      "url_example" : "http://www.proteinatlas.org/antibody_info.php?antibody_id=HPA000237",
      "url_syntax" : "http://www.proteinatlas.org/antibody_info.php?antibody_id=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "example_id" : "HPA_antibody:HPA000237",
      "abbreviation" : "HPA_antibody",
      "uri_prefix" : null,
      "id" : null,
      "database" : "Human Protein Atlas antibody information",
      "name" : null,
      "generic_url" : "http://www.proteinatlas.org/"
   },
   "wbls" : {
      "fullname" : null,
      "example_id" : "WBls:0000010",
      "abbreviation" : "WBls",
      "entity_type" : "WBls:0000075 ! nematoda life stage",
      "url_syntax" : null,
      "object" : null,
      "url_example" : null,
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://www.wormbase.org/",
      "id" : null,
      "local_id_syntax" : "[0-9]{7}",
      "database" : "C. elegans development",
      "uri_prefix" : null
   },
   "prodom" : {
      "uri_prefix" : null,
      "description" : "ProDom protein domain families automatically generated from UniProtKB",
      "id" : null,
      "database" : "ProDom protein domain families",
      "generic_url" : "http://prodom.prabi.fr/prodom/current/html/home.php",
      "name" : null,
      "datatype" : null,
      "url_example" : "http://prodom.prabi.fr/prodom/current/cgi-bin/request.pl?question=DBEN&query=PD000001",
      "object" : null,
      "url_syntax" : "http://prodom.prabi.fr/prodom/current/cgi-bin/request.pl?question=DBEN&query=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "ProDom:PD000001",
      "abbreviation" : "ProDom",
      "fullname" : null
   },
   "wbbt" : {
      "database" : "C. elegans gross anatomy",
      "local_id_syntax" : "[0-9]{7}",
      "id" : null,
      "generic_url" : "http://www.wormbase.org/",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "UBERON:0001062 ! metazoan anatomical entity",
      "example_id" : "WBbt:0005733",
      "abbreviation" : "WBbt",
      "fullname" : null,
      "url_example" : null,
      "datatype" : null
   },
   "trait" : {
      "database" : "TRAnscript Integrated Table",
      "description" : "an integrated database of transcripts expressed in human skeletal muscle",
      "id" : null,
      "generic_url" : "http://muscle.cribi.unipd.it/",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "TRAIT",
      "example_id" : null,
      "fullname" : null,
      "url_example" : null,
      "datatype" : null
   },
   "kegg_enzyme" : {
      "database" : "KEGG Enzyme Database",
      "local_id_syntax" : "\\d(\\.\\d{1,2}){2}\\.\\d{1,3}",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.genome.jp/dbget-bin/www_bfind?enzyme",
      "uri_prefix" : null,
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?ec:[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "KEGG_ENZYME",
      "example_id" : "KEGG_ENZYME:2.1.1.4",
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?ec:2.1.1.4",
      "datatype" : null
   },
   "pubchem_bioassay" : {
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "id" : null,
      "database" : "NCBI PubChem database of bioassay records",
      "datatype" : null,
      "url_example" : "http://pubchem.ncbi.nlm.nih.gov/assay/assay.cgi?aid=177",
      "fullname" : null,
      "abbreviation" : "PubChem_BioAssay",
      "example_id" : "PubChem_BioAssay:177",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://pubchem.ncbi.nlm.nih.gov/assay/assay.cgi?aid=[example_id]",
      "object" : null
   },
   "kegg_ligand" : {
      "object" : null,
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?cpd:[example_id]",
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "abbreviation" : "KEGG_LIGAND",
      "example_id" : "KEGG_LIGAND:C00577",
      "fullname" : null,
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?cpd:C00577",
      "datatype" : null,
      "database" : "KEGG LIGAND Database",
      "local_id_syntax" : "C\\d{5}",
      "id" : null,
      "generic_url" : "http://www.genome.ad.jp/kegg/docs/upd_ligand.html",
      "name" : null,
      "uri_prefix" : null
   },
   "go_central" : {
      "database" : "GO Central",
      "description" : "Manual annotation from PAINT curators into the UniProt Protein2GO curation tool.",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.geneontology.org/GO.refgenome.shtml",
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "example_id" : null,
      "abbreviation" : "GO_Central",
      "datatype" : null,
      "url_example" : null
   },
   "gonuts" : {
      "fullname" : null,
      "abbreviation" : "GONUTS",
      "example_id" : "GONUTS:MOUSE:CD28",
      "url_syntax" : "http://gowiki.tamu.edu/wiki/index.php/[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "url_example" : "http://gowiki.tamu.edu/wiki/index.php/MOUSE:CD28",
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://gowiki.tamu.edu",
      "database" : "Gene Ontology Normal Usage Tracking System (GONUTS)",
      "description" : "Third party documentation for GO and community annotation system.",
      "id" : null,
      "uri_prefix" : null
   },
   "uniparc" : {
      "datatype" : null,
      "url_example" : "http://www.uniprot.org/uniparc/UPI000000000A",
      "url_syntax" : "http://www.uniprot.org/uniparc/[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "UniParc",
      "example_id" : "UniParc:UPI000000000A",
      "uri_prefix" : null,
      "database" : "UniProt Archive",
      "description" : "A non-redundant archive of protein sequences extracted from Swiss-Prot, TrEMBL, PIR-PSD, EMBL, Ensembl, IPI, PDB, RefSeq, FlyBase, WormBase, European Patent Office, United States Patent and Trademark Office, and Japanese Patent Office",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.uniprot.org/uniparc/"
   },
   "pir" : {
      "name" : null,
      "generic_url" : "http://pir.georgetown.edu/",
      "id" : null,
      "local_id_syntax" : "[A-Z]{1}[0-9]{5}",
      "database" : "Protein Information Resource",
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "PIR:I49499",
      "abbreviation" : "PIR",
      "url_syntax" : "http://pir.georgetown.edu/cgi-bin/pirwww/nbrfget?uid=[example_id]",
      "entity_type" : "PR:000000001 ! protein",
      "object" : null,
      "url_example" : "http://pir.georgetown.edu/cgi-bin/pirwww/nbrfget?uid=I49499",
      "datatype" : null
   },
   "jcvi_genprop" : {
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=GenProp0120",
      "datatype" : null,
      "fullname" : null,
      "abbreviation" : "JCVI_GenProp",
      "example_id" : "JCVI_GenProp:GenProp0120",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=[example_id]",
      "entity_type" : "GO:0008150 ! biological_process",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "database" : "Genome Properties database at the J. Craig Venter Institute",
      "local_id_syntax" : "GenProp[0-9]{4}",
      "id" : null
   },
   "gorel" : {
      "url_example" : null,
      "datatype" : null,
      "abbreviation" : "GOREL",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "uri_prefix" : null,
      "generic_url" : "http://purl.obolibrary.org/obo/ro",
      "name" : null,
      "description" : "Additional relations pending addition into RO",
      "database" : "GO Extensions to OBO Relation Ontology Ontology",
      "id" : null
   },
   "maizegdb" : {
      "fullname" : null,
      "abbreviation" : "MaizeGDB",
      "example_id" : "MaizeGDB:881225",
      "url_syntax" : "http://www.maizegdb.org/cgi-bin/id_search.cgi?id=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "datatype" : null,
      "url_example" : "http://www.maizegdb.org/cgi-bin/id_search.cgi?id=881225",
      "name" : null,
      "generic_url" : "http://www.maizegdb.org",
      "id" : null,
      "database" : "MaizeGDB",
      "uri_prefix" : null
   },
   "chebi" : {
      "object" : null,
      "url_syntax" : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:[example_id]",
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "example_id" : "CHEBI:17234",
      "abbreviation" : "ChEBI",
      "fullname" : null,
      "datatype" : null,
      "url_example" : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:17234",
      "id" : null,
      "database" : "Chemical Entities of Biological Interest",
      "local_id_syntax" : "[0-9]{1,6}",
      "generic_url" : "http://www.ebi.ac.uk/chebi/",
      "name" : null,
      "uri_prefix" : null
   },
   "wormbase" : {
      "datatype" : null,
      "url_example" : "http://www.wormbase.org/db/get?class=Gene;name=WBGene00003001",
      "object" : null,
      "entity_type" : "PR:000000001 ! protein",
      "url_syntax" : "http://www.wormbase.org/db/gene/gene?name=[example_id]",
      "abbreviation" : "WormBase",
      "example_id" : "WB:WBGene00003001",
      "fullname" : null,
      "uri_prefix" : null,
      "local_id_syntax" : "(WP:CE[0-9]{5})|(WB(Gene|Var|RNAi|Transgene)[0-9]{8})",
      "database" : "WormBase database of nematode biology",
      "id" : null,
      "generic_url" : "http://www.wormbase.org/",
      "name" : null
   },
   "jcvi" : {
      "url_example" : null,
      "datatype" : null,
      "abbreviation" : "JCVI",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "generic_url" : "http://www.jcvi.org/",
      "name" : null,
      "id" : null,
      "database" : "J. Craig Venter Institute"
   },
   "merops_fam" : {
      "datatype" : null,
      "url_example" : "http://merops.sanger.ac.uk/cgi-bin/famsum?family=m18",
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://merops.sanger.ac.uk/cgi-bin/famsum?family=[example_id]",
      "example_id" : "MEROPS_fam:M18",
      "abbreviation" : "MEROPS_fam",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "MEROPS peptidase database",
      "generic_url" : "http://merops.sanger.ac.uk/",
      "name" : null
   },
   "agi_locuscode" : {
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.arabidopsis.org",
      "id" : null,
      "local_id_syntax" : "A[Tt][MmCc0-5][Gg][0-9]{5}(\\.[0-9]{1})?",
      "description" : "Comprises TAIR, TIGR and MIPS",
      "database" : "Arabidopsis Genome Initiative",
      "url_example" : "http://arabidopsis.org/servlets/TairObject?type=locus&name=At2g17950",
      "datatype" : null,
      "fullname" : null,
      "example_id" : "AGI_LocusCode:At2g17950",
      "abbreviation" : "AGI_LocusCode",
      "url_syntax" : "http://arabidopsis.org/servlets/TairObject?type=locus&name=[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "object" : null
   },
   "tigr_egad" : {
      "uri_prefix" : null,
      "id" : null,
      "database" : "EGAD database at the J. Craig Venter Institute",
      "generic_url" : "http://cmr.jcvi.org/",
      "name" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=VCA0557",
      "datatype" : null,
      "object" : null,
      "entity_type" : "PR:000000001 ! protein",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=[example_id]",
      "example_id" : "JCVI_CMR:VCA0557",
      "abbreviation" : "TIGR_EGAD",
      "fullname" : null
   },
   "asap" : {
      "example_id" : "ASAP:ABE-0000008",
      "abbreviation" : "ASAP",
      "fullname" : null,
      "object" : null,
      "entity_type" : "SO:0000704 ! gene",
      "url_syntax" : "https://asap.ahabs.wisc.edu/annotation/php/feature_info.php?FeatureID=[example_id]",
      "datatype" : null,
      "url_example" : "https://asap.ahabs.wisc.edu/annotation/php/feature_info.php?FeatureID=ABE-0000008",
      "generic_url" : "https://asap.ahabs.wisc.edu/annotation/php/ASAP1.htm",
      "name" : null,
      "database" : "A Systematic Annotation Package for Community Analysis of Genomes",
      "id" : null,
      "uri_prefix" : null
   },
   "vbrc" : {
      "id" : null,
      "database" : "Viral Bioinformatics Resource Center",
      "generic_url" : "http://vbrc.org",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://vbrc.org/query.asp?web_id=VBRC:[example_id]",
      "example_id" : "VBRC:F35742",
      "abbreviation" : "VBRC",
      "fullname" : null,
      "datatype" : null,
      "url_example" : "http://vbrc.org/query.asp?web_id=VBRC:F35742"
   },
   "psi-mi" : {
      "uri_prefix" : null,
      "id" : null,
      "database" : "Proteomic Standard Initiative for Molecular Interaction",
      "name" : null,
      "generic_url" : "http://psidev.sourceforge.net/mi/xml/doc/user/index.html",
      "datatype" : null,
      "url_example" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "example_id" : "MI:0018",
      "abbreviation" : "PSI-MI"
   },
   "cbs" : {
      "generic_url" : "http://www.cbs.dtu.dk/",
      "name" : null,
      "id" : null,
      "database" : "Center for Biological Sequence Analysis",
      "uri_prefix" : null,
      "example_id" : "CBS:TMHMM",
      "abbreviation" : "CBS",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "url_example" : "http://www.cbs.dtu.dk/services/[example_id]/",
      "datatype" : null
   },
   "brenda" : {
      "url_example" : "http://www.brenda-enzymes.info/php/result_flat.php4?ecno=4.2.1.3",
      "datatype" : null,
      "fullname" : null,
      "example_id" : "BRENDA:4.2.1.3",
      "abbreviation" : "BRENDA",
      "entity_type" : "GO:0003824 ! catalytic activity",
      "url_syntax" : "http://www.brenda-enzymes.info/php/result_flat.php4?ecno=[example_id]",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.brenda-enzymes.info",
      "id" : null,
      "database" : "BRENDA, The Comprehensive Enzyme Information System"
   },
   "phenoscape" : {
      "database" : "PhenoScape Knowledgebase",
      "id" : null,
      "name" : null,
      "generic_url" : "http://phenoscape.org/",
      "uri_prefix" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "example_id" : null,
      "abbreviation" : "PhenoScape",
      "url_example" : null,
      "datatype" : null
   },
   "ddb_ref" : {
      "uri_prefix" : null,
      "generic_url" : "http://dictybase.org",
      "name" : null,
      "database" : "dictyBase literature references",
      "id" : null,
      "url_example" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=10157",
      "datatype" : null,
      "abbreviation" : "DDB_REF",
      "example_id" : "dictyBase_REF:10157",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=[example_id]",
      "entity_type" : "BET:0000000 ! entity"
   },
   "mgi" : {
      "name" : null,
      "generic_url" : "http://www.informatics.jax.org/",
      "database" : "Mouse Genome Informatics",
      "local_id_syntax" : "MGI:[0-9]{5,}",
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "abbreviation" : "MGI",
      "example_id" : "MGI:MGI:80863",
      "url_syntax" : "http://www.informatics.jax.org/accession/[example_id]",
      "entity_type" : "VariO:0001 ! variation",
      "object" : null,
      "datatype" : null,
      "url_example" : "http://www.informatics.jax.org/accession/MGI:80863"
   },
   "pr" : {
      "datatype" : null,
      "url_example" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:000025380",
      "object" : null,
      "entity_type" : "PR:000000001 ! protein",
      "url_syntax" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:[example_id]",
      "abbreviation" : "PR",
      "example_id" : "PR:000025380",
      "fullname" : null,
      "uri_prefix" : null,
      "database" : "Protein Ontology",
      "local_id_syntax" : "[0-9]{9}",
      "id" : null,
      "generic_url" : "http://www.proconsortium.org/pro/pro.shtml",
      "name" : null
   },
   "vz" : {
      "generic_url" : "http://viralzone.expasy.org/",
      "name" : null,
      "id" : null,
      "database" : "ViralZone",
      "uri_prefix" : null,
      "example_id" : "VZ:957",
      "abbreviation" : "VZ",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://viralzone.expasy.org/all_by_protein/[example_id].html",
      "entity_type" : "BET:0000000 ! entity",
      "datatype" : null,
      "url_example" : "http://viralzone.expasy.org/all_by_protein/957.html"
   },
   "flybase" : {
      "object" : null,
      "entity_type" : "SO:0000704 ! gene",
      "url_syntax" : "http://flybase.org/reports/[example_id].html",
      "abbreviation" : "FLYBASE",
      "example_id" : "FB:FBgn0000024",
      "fullname" : null,
      "datatype" : null,
      "url_example" : "http://flybase.org/reports/FBgn0000024.html",
      "id" : null,
      "local_id_syntax" : "FBgn[0-9]{7}",
      "database" : "FlyBase",
      "generic_url" : "http://flybase.org/",
      "name" : null,
      "uri_prefix" : null
   },
   "locsvmpsi" : {
      "abbreviation" : "LOCSVMpsi",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_example" : null,
      "datatype" : null,
      "generic_url" : "http://bioinformatics.ustc.edu.cn/locsvmpsi/locsvmpsi.php",
      "name" : null,
      "description" : "Subcellular localization for eukayotic proteins based on SVM and PSI-BLAST",
      "id" : null,
      "database" : "LOCSVMPSI",
      "uri_prefix" : null
   },
   "sgn" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.sgn.cornell.edu/",
      "name" : null,
      "id" : null,
      "database" : "Sol Genomics Network",
      "datatype" : null,
      "url_example" : "http://www.sgn.cornell.edu/phenome/locus_display.pl?locus_id=4476",
      "example_id" : "SGN:4476",
      "abbreviation" : "SGN",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.sgn.cornell.edu/phenome/locus_display.pl?locus_id=[example_id]",
      "entity_type" : "SO:0000704 ! gene"
   },
   "rgdid" : {
      "uri_prefix" : null,
      "id" : null,
      "database" : "Rat Genome Database",
      "local_id_syntax" : "[0-9]{4,7}",
      "generic_url" : "http://rgd.mcw.edu/",
      "name" : null,
      "datatype" : null,
      "url_example" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=2004",
      "object" : null,
      "url_syntax" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "abbreviation" : "RGDID",
      "example_id" : "RGD:2004",
      "fullname" : null
   },
   "sabio-rk" : {
      "datatype" : null,
      "url_example" : "http://sabio.villa-bosch.de/reacdetails.jsp?reactid=1858",
      "fullname" : null,
      "example_id" : "SABIO-RK:1858",
      "abbreviation" : "SABIO-RK",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://sabio.villa-bosch.de/reacdetails.jsp?reactid=[example_id]",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://sabio.villa-bosch.de/",
      "description" : "The SABIO-RK (System for the Analysis of Biochemical Pathways - Reaction Kinetics) is a web-based application based on the SABIO relational database that contains information about biochemical reactions, their kinetic equations with their parameters, and the experimental conditions under which these parameters were measured.",
      "id" : null,
      "database" : "SABIO Reaction Kinetics"
   },
   "img" : {
      "datatype" : null,
      "url_example" : "http://img.jgi.doe.gov/cgi-bin/pub/main.cgi?section=GeneDetail&page=geneDetail&gene_oid=640008772",
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://img.jgi.doe.gov/cgi-bin/pub/main.cgi?section=GeneDetail&page=geneDetail&gene_oid=[example_id]",
      "abbreviation" : "IMG",
      "example_id" : "IMG:640008772",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "Integrated Microbial Genomes; JGI web site for genome annotation",
      "generic_url" : "http://img.jgi.doe.gov",
      "name" : null
   },
   "h-invdb" : {
      "url_example" : null,
      "datatype" : null,
      "fullname" : null,
      "abbreviation" : "H-invDB",
      "example_id" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.h-invitational.jp/",
      "id" : null,
      "database" : "H-invitational Database"
   },
   "pamgo_vmd" : {
      "datatype" : null,
      "url_example" : "http://vmd.vbi.vt.edu/cgi-bin/browse/go_detail.cgi?gene_id=109198",
      "fullname" : null,
      "abbreviation" : "PAMGO_VMD",
      "example_id" : "PAMGO_VMD:109198",
      "url_syntax" : "http://vmd.vbi.vt.edu/cgi-bin/browse/go_detail.cgi?gene_id=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://phytophthora.vbi.vt.edu",
      "description" : "Virginia Bioinformatics Institute Microbial Database; member of PAMGO Interest Group",
      "database" : "Virginia Bioinformatics Institute Microbial Database",
      "id" : null
   },
   "rgd" : {
      "url_syntax" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "RGD",
      "example_id" : "RGD:2004",
      "datatype" : null,
      "url_example" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=2004",
      "id" : null,
      "local_id_syntax" : "[0-9]{4,7}",
      "database" : "Rat Genome Database",
      "name" : null,
      "generic_url" : "http://rgd.mcw.edu/",
      "uri_prefix" : null
   },
   "rfam" : {
      "database" : "Rfam database of RNA families",
      "id" : null,
      "name" : null,
      "generic_url" : "http://rfam.sanger.ac.uk/",
      "uri_prefix" : null,
      "url_syntax" : "http://rfam.sanger.ac.uk/family/[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "Rfam",
      "example_id" : "Rfam:RF00012",
      "datatype" : null,
      "url_example" : "http://rfam.sanger.ac.uk/family/RF00012"
   },
   "nif_subcellular" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.neurolex.org/wiki",
      "name" : null,
      "database" : "Neuroscience Information Framework standard ontology, subcellular hierarchy",
      "id" : null,
      "datatype" : null,
      "url_example" : "http://www.neurolex.org/wiki/sao1770195789",
      "example_id" : "NIF_Subcellular:sao1186862860",
      "abbreviation" : "NIF_Subcellular",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.neurolex.org/wiki/[example_id]",
      "entity_type" : "BET:0000000 ! entity"
   },
   "pato" : {
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "abbreviation" : "PATO",
      "example_id" : "PATO:0001420",
      "datatype" : null,
      "url_example" : null,
      "id" : null,
      "database" : "Phenotypic quality ontology",
      "name" : null,
      "generic_url" : "http://www.bioontology.org/wiki/index.php/PATO:Main_Page",
      "uri_prefix" : null
   },
   "gene3d" : {
      "url_syntax" : "http://gene3d.biochem.ucl.ac.uk/superfamily/?accession=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "Gene3D",
      "example_id" : "Gene3D:G3DSA:3.30.390.30",
      "datatype" : null,
      "url_example" : "http://gene3d.biochem.ucl.ac.uk/superfamily/?accession=G3DSA%3A3.30.390.30",
      "database" : "Domain Architecture Classification",
      "id" : null,
      "name" : null,
      "generic_url" : "http://gene3d.biochem.ucl.ac.uk/Gene3D/",
      "uri_prefix" : null
   },
   "cog" : {
      "uri_prefix" : null,
      "database" : "NCBI Clusters of Orthologous Groups",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "url_example" : null,
      "datatype" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "abbreviation" : "COG",
      "example_id" : null
   },
   "so" : {
      "uri_prefix" : null,
      "generic_url" : "http://sequenceontology.org/",
      "name" : null,
      "local_id_syntax" : "\\d{7}",
      "id" : null,
      "database" : "Sequence Ontology",
      "datatype" : null,
      "url_example" : "http://song.sourceforge.net/SOterm_tables.html#SO:0000195",
      "example_id" : "SO:0000195",
      "abbreviation" : "SO",
      "fullname" : null,
      "object" : null,
      "entity_type" : "SO:0000110 ! sequence feature",
      "url_syntax" : "http://song.sourceforge.net/SOterm_tables.html#SO:[example_id]"
   },
   "transfac" : {
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : null,
      "abbreviation" : "TRANSFAC",
      "fullname" : null,
      "datatype" : null,
      "url_example" : null,
      "id" : null,
      "database" : "TRANSFAC database of eukaryotic transcription factors",
      "generic_url" : "http://www.gene-regulation.com/pub/databases.html#transfac",
      "name" : null,
      "uri_prefix" : null
   },
   "medline" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.nlm.nih.gov/databases/databases_medline.html",
      "name" : null,
      "id" : null,
      "database" : "Medline literature database",
      "datatype" : null,
      "url_example" : null,
      "example_id" : "MEDLINE:20572430",
      "abbreviation" : "MEDLINE",
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "mo" : {
      "url_example" : "http://mged.sourceforge.net/ontologies/MGEDontology.php#Action",
      "datatype" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://mged.sourceforge.net/ontologies/MGEDontology.php#[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "MO:Action",
      "abbreviation" : "MO",
      "uri_prefix" : null,
      "database" : "MGED Ontology",
      "id" : null,
      "name" : null,
      "generic_url" : "http://mged.sourceforge.net/ontologies/MGEDontology.php"
   },
   "subtilistg" : {
      "url_example" : null,
      "datatype" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "SUBTILISTG:accC",
      "abbreviation" : "SUBTILISTG",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "Bacillus subtilis Genome Sequence Project",
      "generic_url" : "http://genolist.pasteur.fr/SubtiList/",
      "name" : null
   },
   "ensemblplants" : {
      "name" : null,
      "generic_url" : "http://plants.ensembl.org/",
      "database" : "Ensembl Plants, the Ensembl Genomes database for accessing plant genome data",
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "abbreviation" : "EnsemblPlants",
      "example_id" : "EnsemblPlants:LOC_Os01g22954",
      "entity_type" : "SO:0000704 ! gene",
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "object" : null,
      "url_example" : "http://www.ensemblgenomes.org/id/LOC_Os01g22954",
      "datatype" : null
   },
   "pubchem_compound" : {
      "datatype" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pccompound&term=2244",
      "object" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pccompound&term=[example_id]",
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "example_id" : "PubChem_Compound:2244",
      "abbreviation" : "PubChem_Compound",
      "fullname" : null,
      "uri_prefix" : null,
      "database" : "NCBI PubChem database of chemical structures",
      "local_id_syntax" : "[0-9]+",
      "id" : null,
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "name" : null
   },
   "kegg" : {
      "datatype" : null,
      "url_example" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "example_id" : null,
      "abbreviation" : "KEGG",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "Kyoto Encyclopedia of Genes and Genomes",
      "generic_url" : "http://www.genome.ad.jp/kegg/",
      "name" : null
   },
   "tgd_ref" : {
      "name" : null,
      "generic_url" : "http://www.ciliate.org/",
      "database" : "Tetrahymena Genome Database",
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "abbreviation" : "TGD_REF",
      "example_id" : "TGD_REF:T000005818",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://db.ciliate.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "object" : null,
      "url_example" : "http://db.ciliate.org/cgi-bin/reference/reference.pl?dbid=T000005818",
      "datatype" : null
   },
   "hpa" : {
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.proteinatlas.org/",
      "id" : null,
      "database" : "Human Protein Atlas tissue profile information",
      "url_example" : "http://www.proteinatlas.org/tissue_profile.php?antibody_id=HPA000237",
      "datatype" : null,
      "fullname" : null,
      "example_id" : "HPA:HPA000237",
      "abbreviation" : "HPA",
      "url_syntax" : "http://www.proteinatlas.org/tissue_profile.php?antibody_id=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null
   },
   "pmcid" : {
      "fullname" : null,
      "abbreviation" : "PMCID",
      "example_id" : "PMCID:PMC201377",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?db=pmc&cmd=search&term=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "datatype" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?db=pmc&cmd=search&term=PMC201377",
      "name" : null,
      "generic_url" : "http://www.pubmedcentral.nih.gov/",
      "id" : null,
      "database" : "Pubmed Central",
      "uri_prefix" : null
   },
   "agbase" : {
      "object" : null,
      "url_syntax" : "http://www.agbase.msstate.edu/cgi-bin/getEntry.pl?db_pick=[ChickGO/MaizeGO]&uid=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : null,
      "abbreviation" : "AgBase",
      "fullname" : null,
      "url_example" : null,
      "datatype" : null,
      "id" : null,
      "database" : "AgBase resource for functional analysis of agricultural plant and animal gene products",
      "generic_url" : "http://www.agbase.msstate.edu/",
      "name" : null,
      "uri_prefix" : null
   },
   "agricola_ind" : {
      "uri_prefix" : null,
      "database" : "AGRICultural OnLine Access",
      "id" : null,
      "name" : null,
      "generic_url" : "http://agricola.nal.usda.gov/",
      "datatype" : null,
      "url_example" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "example_id" : "AGRICOLA_IND:IND23252955",
      "abbreviation" : "AGRICOLA_IND"
   },
   "wbphenotype" : {
      "database" : "WormBase phenotype ontology",
      "local_id_syntax" : "[0-9]{7}",
      "id" : null,
      "generic_url" : "http://www.wormbase.org/",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "url_syntax" : "http://www.wormbase.org/species/c_elegans/phenotype/WBPhenotype:[example_id]",
      "entity_type" : "PATO:0000001 ! quality",
      "abbreviation" : "WBPhenotype",
      "example_id" : "WBPhenotype:0002117",
      "fullname" : null,
      "datatype" : null,
      "url_example" : "http://www.wormbase.org/species/c_elegans/phenotype/WBPhenotype:0000154"
   },
   "aracyc" : {
      "datatype" : null,
      "url_example" : "http://www.arabidopsis.org:1555/ARA/NEW-IMAGE?type=NIL&object=PWYQT-62",
      "object" : null,
      "url_syntax" : "http://www.arabidopsis.org:1555/ARA/NEW-IMAGE?type=NIL&object=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "AraCyc",
      "example_id" : "AraCyc:PWYQT-62",
      "fullname" : null,
      "uri_prefix" : null,
      "database" : "AraCyc metabolic pathway database for Arabidopsis thaliana",
      "id" : null,
      "generic_url" : "http://www.arabidopsis.org/biocyc/index.jsp",
      "name" : null
   },
   "taxon" : {
      "datatype" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "example_id" : "taxon:7227",
      "abbreviation" : "taxon",
      "uri_prefix" : null,
      "database" : "NCBI Taxonomy",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/"
   },
   "vega" : {
      "fullname" : null,
      "abbreviation" : "VEGA",
      "example_id" : "VEGA:OTTHUMP00000000661",
      "url_syntax" : "http://vega.sanger.ac.uk/perl/searchview?species=all&idx=All&q=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "url_example" : "http://vega.sanger.ac.uk/perl/searchview?species=all&idx=All&q=OTTHUMP00000000661",
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://vega.sanger.ac.uk/index.html",
      "database" : "Vertebrate Genome Annotation database",
      "id" : null,
      "uri_prefix" : null
   },
   "tigr_tigrfams" : {
      "uri_prefix" : null,
      "generic_url" : "http://search.jcvi.org/",
      "name" : null,
      "id" : null,
      "database" : "TIGRFAMs HMM collection at the J. Craig Venter Institute",
      "url_example" : "http://search.jcvi.org/search?p&q=TIGR00254",
      "datatype" : null,
      "abbreviation" : "TIGR_TIGRFAMS",
      "example_id" : "JCVI_TIGRFAMS:TIGR00254",
      "fullname" : null,
      "object" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "url_syntax" : "http://search.jcvi.org/search?p&q=[example_id]"
   },
   "seed" : {
      "url_syntax" : "http://www.theseed.org/linkin.cgi?id=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "example_id" : "SEED:fig|83331.1.peg.1",
      "abbreviation" : "SEED",
      "datatype" : null,
      "url_example" : "http://www.theseed.org/linkin.cgi?id=fig|83331.1.peg.1",
      "id" : null,
      "description" : "Project to annotate the first 1000 sequenced genomes, develop detailed metabolic reconstructions, and construct the corresponding stoichiometric matrices",
      "database" : "The SEED;",
      "name" : null,
      "generic_url" : "http://www.theseed.org",
      "uri_prefix" : null
   },
   "aspgd" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.aspergillusgenome.org/",
      "name" : null,
      "local_id_syntax" : "ASPL[0-9]{10}",
      "id" : null,
      "database" : "Aspergillus Genome Database",
      "datatype" : null,
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=ASPL0000067538",
      "abbreviation" : "AspGD",
      "example_id" : "AspGD:ASPL0000067538",
      "fullname" : null,
      "object" : null,
      "entity_type" : "SO:0000704 ! gene",
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=[example_id]"
   },
   "pamgo_gat" : {
      "url_example" : "http://agro.vbi.vt.edu/public/servlet/GeneEdit?&Search=Search&level=2&genename=atu0001",
      "datatype" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://agro.vbi.vt.edu/public/servlet/GeneEdit?&Search=Search&level=2&genename=[example_id]",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "PAMGO_GAT",
      "example_id" : "PAMGO_GAT:Atu0001",
      "uri_prefix" : null,
      "id" : null,
      "database" : "Genome Annotation Tool (Agrobacterium tumefaciens C58); PAMGO Interest Group",
      "name" : null,
      "generic_url" : "http://agro.vbi.vt.edu/public/"
   },
   "broad_neurospora" : {
      "url_example" : "http://www.broadinstitute.org/annotation/genome/neurospora/GeneDetails.html?sp=S7000007580576824",
      "datatype" : null,
      "fullname" : null,
      "abbreviation" : "Broad_NEUROSPORA",
      "example_id" : "BROAD_NEUROSPORA:7000007580576824",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.broadinstitute.org/annotation/genome/neurospora/GeneDetails.html?sp=S[example_id]",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.broadinstitute.org/annotation/genome/neurospora/MultiHome.html",
      "description" : "Neurospora crassa database at the Broad Institute",
      "id" : null,
      "database" : "Neurospora crassa Database"
   },
   "panther" : {
      "url_example" : "http://www.pantherdb.org/panther/lookupId.jsp?id=PTHR10000",
      "datatype" : null,
      "fullname" : null,
      "abbreviation" : "PANTHER",
      "example_id" : "PANTHER:PTHR11455",
      "entity_type" : "NCIT:C20130 ! protein family",
      "url_syntax" : "http://www.pantherdb.org/panther/lookupId.jsp?id=[example_id]",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.pantherdb.org/",
      "local_id_syntax" : "PTN[0-9]{9}|PTHR[0-9]{5}_[A-Z0-9]+",
      "database" : "Protein ANalysis THrough Evolutionary Relationships Classification System",
      "id" : null
   },
   "intact" : {
      "fullname" : null,
      "example_id" : "IntAct:EBI-17086",
      "abbreviation" : "IntAct",
      "entity_type" : "GO:0043234 ! protein complex",
      "url_syntax" : "http://www.ebi.ac.uk/intact/search/do/search?searchString=[example_id]",
      "object" : null,
      "url_example" : "http://www.ebi.ac.uk/intact/search/do/search?searchString=EBI-17086",
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://www.ebi.ac.uk/intact/",
      "local_id_syntax" : "EBI-[0-9]+",
      "database" : "IntAct protein interaction database",
      "id" : null,
      "uri_prefix" : null
   },
   "obo_sf_po" : {
      "datatype" : null,
      "url_example" : "https://sourceforge.net/tracker/index.php?func=detail&aid=3184921&group_id=76834&atid=835555",
      "url_syntax" : "https://sourceforge.net/tracker/index.php?func=detail&aid=[example_id]&group_id=76834&atid=835555",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "OBO_SF_PO",
      "example_id" : "OBO_SF_PO:3184921",
      "uri_prefix" : null,
      "database" : "Source Forge OBO Plant Ontology (PO) term request tracker",
      "id" : null,
      "name" : null,
      "generic_url" : "http://sourceforge.net/tracker/?func=browse&group_id=76834&atid=835555"
   },
   "tigr_genprop" : {
      "datatype" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=GenProp0120",
      "fullname" : null,
      "abbreviation" : "TIGR_GenProp",
      "example_id" : "JCVI_GenProp:GenProp0120",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=[example_id]",
      "entity_type" : "GO:0008150 ! biological_process",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "local_id_syntax" : "GenProp[0-9]{4}",
      "id" : null,
      "database" : "Genome Properties database at the J. Craig Venter Institute"
   },
   "jcvi_cmr" : {
      "uri_prefix" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "name" : null,
      "id" : null,
      "database" : "EGAD database at the J. Craig Venter Institute",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=VCA0557",
      "datatype" : null,
      "example_id" : "JCVI_CMR:VCA0557",
      "abbreviation" : "JCVI_CMR",
      "fullname" : null,
      "object" : null,
      "entity_type" : "PR:000000001 ! protein",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=[example_id]"
   },
   "multifun" : {
      "fullname" : null,
      "abbreviation" : "MultiFun",
      "example_id" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "datatype" : null,
      "url_example" : null,
      "name" : null,
      "generic_url" : "http://genprotec.mbl.edu/files/MultiFun.html",
      "database" : "MultiFun cell function assignment schema",
      "id" : null,
      "uri_prefix" : null
   },
   "reactome" : {
      "datatype" : null,
      "url_example" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=REACT_604",
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=[example_id]",
      "abbreviation" : "Reactome",
      "example_id" : "Reactome:REACT_604",
      "fullname" : null,
      "uri_prefix" : null,
      "local_id_syntax" : "REACT_[0-9]+",
      "id" : null,
      "database" : "Reactome - a curated knowledgebase of biological pathways",
      "generic_url" : "http://www.reactome.org/",
      "name" : null
   },
   "cas" : {
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "example_id" : "CAS:58-08-2",
      "abbreviation" : "CAS",
      "url_example" : null,
      "datatype" : null,
      "id" : null,
      "description" : "CAS REGISTRY is the most authoritative collection of disclosed chemical substance information, containing more than 54 million organic and inorganic substances and 62 million sequences. CAS REGISTRY covers substances identified from the scientific literature from 1957 to the present, with additional substances going back to the early 1900s.",
      "database" : "CAS Chemical Registry",
      "name" : null,
      "generic_url" : "http://www.cas.org/expertise/cascontent/registry/index.html",
      "uri_prefix" : null
   },
   "um-bbd" : {
      "abbreviation" : "UM-BBD",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "datatype" : null,
      "url_example" : null,
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "name" : null,
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "id" : null,
      "uri_prefix" : null
   },
   "ppi" : {
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "PPI",
      "example_id" : null,
      "fullname" : null,
      "url_example" : null,
      "datatype" : null,
      "database" : "Pseudomonas syringae community annotation project",
      "id" : null,
      "generic_url" : "http://genome.pseudomonas-syringae.org/",
      "name" : null,
      "uri_prefix" : null
   },
   "pmid" : {
      "uri_prefix" : null,
      "database" : "PubMed",
      "local_id_syntax" : "[0-9]+",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/PubMed/",
      "url_example" : "http://www.ncbi.nlm.nih.gov/pubmed/4208797",
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/pubmed/[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "PMID",
      "example_id" : "PMID:4208797"
   },
   "ri" : {
      "fullname" : null,
      "example_id" : null,
      "abbreviation" : "RI",
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "url_example" : null,
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://www.roslin.ac.uk/",
      "database" : "Roslin Institute",
      "id" : null,
      "uri_prefix" : null
   },
   "aspgd_ref" : {
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "AspGD_REF",
      "example_id" : "AspGD_REF:90",
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/reference/reference.pl?dbid=90",
      "datatype" : null,
      "database" : "Aspergillus Genome Database",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.aspergillusgenome.org/",
      "uri_prefix" : null
   },
   "doi" : {
      "url_example" : "http://dx.doi.org/DOI:10.1016/S0963-9969(99)00021-6",
      "datatype" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://dx.doi.org/DOI:[example_id]",
      "abbreviation" : "DOI",
      "example_id" : "DOI:10.1016/S0963-9969(99)00021-6",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "local_id_syntax" : "10\\.[0-9]+\\/.*",
      "database" : "Digital Object Identifier",
      "generic_url" : "http://dx.doi.org/",
      "name" : null
   },
   "resid" : {
      "uri_prefix" : null,
      "id" : null,
      "database" : "RESID Database of Protein Modifications",
      "generic_url" : "ftp://ftp.ncifcrf.gov/pub/users/residues/",
      "name" : null,
      "url_example" : null,
      "datatype" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "abbreviation" : "RESID",
      "example_id" : "RESID:AA0062",
      "fullname" : null
   },
   "obi" : {
      "datatype" : null,
      "url_example" : null,
      "fullname" : null,
      "example_id" : "OBI:0000038",
      "abbreviation" : "OBI",
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://obi-ontology.org/page/Main_Page",
      "local_id_syntax" : "\\d{7}",
      "id" : null,
      "database" : "Ontology for Biomedical Investigations"
   },
   "biosis" : {
      "datatype" : null,
      "url_example" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "BIOSIS",
      "example_id" : "BIOSIS:200200247281",
      "uri_prefix" : null,
      "database" : "BIOSIS previews",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.biosis.org/"
   },
   "apidb_plasmodb" : {
      "url_syntax" : "http://www.plasmodb.org/gene/[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "example_id" : "ApiDB_PlasmoDB:PF11_0344",
      "abbreviation" : "ApiDB_PlasmoDB",
      "url_example" : "http://www.plasmodb.org/gene/PF11_0344",
      "datatype" : null,
      "id" : null,
      "database" : "PlasmoDB Plasmodium Genome Resource",
      "name" : null,
      "generic_url" : "http://plasmodb.org/",
      "uri_prefix" : null
   },
   "ncbi" : {
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "example_id" : null,
      "abbreviation" : "NCBI",
      "fullname" : null,
      "url_example" : null,
      "datatype" : null,
      "id" : null,
      "database" : "National Center for Biotechnology Information",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "name" : null,
      "uri_prefix" : null
   },
   "parkinsonsuk-ucl" : {
      "fullname" : null,
      "abbreviation" : "ParkinsonsUK-UCL",
      "example_id" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "url_example" : null,
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://www.ucl.ac.uk/functional-gene-annotation/neurological",
      "database" : "Parkinsons Disease Gene Ontology Initiative",
      "id" : null,
      "uri_prefix" : null
   },
   "maizegdb_locus" : {
      "url_syntax" : "http://www.maizegdb.org/cgi-bin/displaylocusresults.cgi?term=[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "object" : null,
      "fullname" : null,
      "example_id" : "MaizeGDB_Locus:ZmPK1",
      "abbreviation" : "MaizeGDB_Locus",
      "datatype" : null,
      "url_example" : "http://www.maizegdb.org/cgi-bin/displaylocusresults.cgi?term=ZmPK1",
      "local_id_syntax" : "[A-Za-z][A-Za-z0-9]*",
      "database" : "MaizeGDB",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.maizegdb.org",
      "uri_prefix" : null
   },
   "unipathway" : {
      "datatype" : null,
      "url_example" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway/upa?upid=UPA00155",
      "object" : null,
      "url_syntax" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway/upa?upid=[example_id]",
      "entity_type" : "GO:0008150 ! biological_process",
      "example_id" : "UniPathway:UPA00155",
      "abbreviation" : "UniPathway",
      "fullname" : null,
      "uri_prefix" : null,
      "description" : "UniPathway is a a metabolic door to UniProtKB/Swiss-Prot, a curated resource of metabolic pathways for the UniProtKB/Swiss-Prot knowledgebase.",
      "database" : "UniPathway",
      "id" : null,
      "generic_url" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway",
      "name" : null
   },
   "go" : {
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://amigo.geneontology.org/",
      "local_id_syntax" : "\\d{7}",
      "id" : null,
      "database" : "Gene Ontology Database",
      "url_example" : "http://amigo.geneontology.org/amigo/term/GO:0004352",
      "datatype" : null,
      "fullname" : null,
      "example_id" : "GO:0004352",
      "abbreviation" : "GO",
      "entity_type" : "GO:0032991 ! macromolecular complex",
      "url_syntax" : "http://amigo.geneontology.org/amigo/term/GO:[example_id]",
      "object" : null
   },
   "ddbj" : {
      "url_example" : "http://arsa.ddbj.nig.ac.jp/arsa/ddbjSplSearch?KeyWord=AA816246",
      "datatype" : null,
      "example_id" : "DDBJ:AA816246",
      "abbreviation" : "DDBJ",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://arsa.ddbj.nig.ac.jp/arsa/ddbjSplSearch?KeyWord=[example_id]",
      "uri_prefix" : null,
      "generic_url" : "http://www.ddbj.nig.ac.jp/",
      "name" : null,
      "id" : null,
      "database" : "DNA Databank of Japan"
   },
   "germonline" : {
      "uri_prefix" : null,
      "id" : null,
      "database" : "GermOnline",
      "generic_url" : "http://www.germonline.org/",
      "name" : null,
      "datatype" : null,
      "url_example" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : null,
      "abbreviation" : "GermOnline",
      "fullname" : null
   },
   "fypo" : {
      "name" : null,
      "generic_url" : "http://www.pombase.org/",
      "local_id_syntax" : "\\d{7}",
      "id" : null,
      "database" : "Fission Yeast Phenotype Ontology",
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "FYPO:0000001",
      "abbreviation" : "FYPO",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "datatype" : null,
      "url_example" : null
   },
   "po_ref" : {
      "datatype" : null,
      "url_example" : "http://wiki.plantontology.org:8080/index.php/PO_REF:00001",
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://wiki.plantontology.org:8080/index.php/PO_REF:[example_id]",
      "example_id" : "PO_REF:00001",
      "abbreviation" : "PO_REF",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "Plant Ontology custom references",
      "generic_url" : "http://wiki.plantontology.org:8080/index.php/PO_references",
      "name" : null
   },
   "isbn" : {
      "database" : "International Standard Book Number",
      "id" : null,
      "name" : null,
      "generic_url" : "http://isbntools.com/",
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "https://en.wikipedia.org/w/index.php?title=Special%3ABookSources&isbn=[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "ISBN:0781702534",
      "abbreviation" : "ISBN",
      "datatype" : null,
      "url_example" : "https://en.wikipedia.org/w/index.php?title=Special%3ABookSources&isbn=0123456789"
   },
   "casref" : {
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "database" : "Catalog of Fishes publications database",
      "id" : null,
      "datatype" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getref.asp?id=2031",
      "fullname" : null,
      "example_id" : "CASREF:2031",
      "abbreviation" : "CASREF",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getref.asp?id=[example_id]",
      "object" : null
   },
   "ensembl_geneid" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.ensembl.org/",
      "name" : null,
      "local_id_syntax" : "ENSG[0-9]{9,16}",
      "database" : "Ensembl database of automatically annotated genomic data",
      "id" : null,
      "datatype" : null,
      "url_example" : "http://www.ensembl.org/id/ENSG00000126016",
      "abbreviation" : "ENSEMBL_GeneID",
      "example_id" : "ENSEMBL_GeneID:ENSG00000126016",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "entity_type" : "SO:0000704 ! gene"
   },
   "cog_cluster" : {
      "uri_prefix" : null,
      "id" : null,
      "database" : "NCBI COG cluster",
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "datatype" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/new/release/cow.cgi?cog=COG0001",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/new/release/cow.cgi?cog=[example_id]",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "COG_Cluster",
      "example_id" : "COG_Cluster:COG0001"
   },
   "uniprot" : {
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "datatype" : null,
      "entity_type" : "PR:000000001 ! protein",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "UniProt",
      "example_id" : "UniProtKB:P51587",
      "uri_prefix" : null,
      "local_id_syntax" : "([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z]([0-9][A-Z][A-Z0-9]{2}){1,2}[0-9])((-[0-9]+)|:PRO_[0-9]{10}|:VAR_[0-9]{6}){0,1}",
      "database" : "Universal Protein Knowledgebase",
      "id" : null,
      "description" : "A central repository of protein sequence and function created by joining the information contained in Swiss-Prot, TrEMBL, and PIR database",
      "name" : null,
      "generic_url" : "http://www.uniprot.org"
   },
   "sgn_ref" : {
      "database" : "Sol Genomics Network",
      "id" : null,
      "generic_url" : "http://www.sgn.cornell.edu/",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "url_syntax" : "http://www.sgn.cornell.edu/chado/publication.pl?pub_id=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "SGN_ref:861",
      "abbreviation" : "SGN_ref",
      "fullname" : null,
      "url_example" : "http://www.sgn.cornell.edu/chado/publication.pl?pub_id=861",
      "datatype" : null
   },
   "eco" : {
      "url_example" : null,
      "datatype" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "abbreviation" : "ECO",
      "example_id" : "ECO:0000002",
      "uri_prefix" : null,
      "local_id_syntax" : "\\d{7}",
      "database" : "Evidence Code ontology",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.geneontology.org/"
   },
   "interpro" : {
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.ebi.ac.uk/interpro/",
      "database" : "InterPro database of protein domains and motifs",
      "id" : null,
      "local_id_syntax" : "IPR\\d{6}",
      "url_example" : "http://www.ebi.ac.uk/interpro/entry/IPR015421",
      "datatype" : null,
      "fullname" : null,
      "abbreviation" : "INTERPRO",
      "example_id" : "InterPro:IPR000001",
      "url_syntax" : "http://www.ebi.ac.uk/interpro/entry/[example_id]",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "object" : null
   },
   "ecocyc" : {
      "example_id" : "EcoCyc:P2-PWY",
      "abbreviation" : "EcoCyc",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://biocyc.org/ECOLI/NEW-IMAGE?type=PATHWAY&object=[example_id]",
      "entity_type" : "GO:0008150 ! biological_process",
      "datatype" : null,
      "url_example" : "http://biocyc.org/ECOLI/NEW-IMAGE?type=PATHWAY&object=P2-PWY",
      "generic_url" : "http://ecocyc.org/",
      "name" : null,
      "local_id_syntax" : "EG[0-9]{5}",
      "database" : "Encyclopedia of E. coli metabolism",
      "id" : null,
      "uri_prefix" : null
   },
   "embl" : {
      "local_id_syntax" : "([A-Z]{1}[0-9]{5})|([A-Z]{2}[0-9]{6})|([A-Z]{4}[0-9]{8,9})",
      "description" : "International nucleotide sequence database collaboration, comprising EMBL-EBI nucleotide sequence data library (EMBL-Bank), DNA DataBank of Japan (DDBJ), and NCBI GenBank",
      "database" : "EMBL Nucleotide Sequence Database",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.ebi.ac.uk/embl/",
      "uri_prefix" : null,
      "url_syntax" : "http://www.ebi.ac.uk/cgi-bin/emblfetch?style=html&Submit=Go&id=[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "object" : null,
      "fullname" : null,
      "example_id" : "EMBL:AA816246",
      "abbreviation" : "EMBL",
      "url_example" : "http://www.ebi.ac.uk/cgi-bin/emblfetch?style=html&Submit=Go&id=AA816246",
      "datatype" : null
   },
   "prow" : {
      "id" : null,
      "database" : "Protein Reviews on the Web",
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/prow/",
      "uri_prefix" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "PROW",
      "example_id" : null,
      "datatype" : null,
      "url_example" : null
   },
   "merops" : {
      "uri_prefix" : null,
      "database" : "MEROPS peptidase database",
      "id" : null,
      "name" : null,
      "generic_url" : "http://merops.sanger.ac.uk/",
      "url_example" : "http://merops.sanger.ac.uk/cgi-bin/pepsum?mid=A08.001",
      "datatype" : null,
      "entity_type" : "PR:000000001 ! protein",
      "url_syntax" : "http://merops.sanger.ac.uk/cgi-bin/pepsum?mid=[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "MEROPS:A08.001",
      "abbreviation" : "MEROPS"
   },
   "wb_ref" : {
      "url_example" : "http://www.wormbase.org/db/misc/paper?name=WBPaper00004823",
      "datatype" : null,
      "example_id" : "WB_REF:WBPaper00004823",
      "abbreviation" : "WB_REF",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.wormbase.org/db/misc/paper?name=[example_id]",
      "uri_prefix" : null,
      "generic_url" : "http://www.wormbase.org/",
      "name" : null,
      "id" : null,
      "database" : "WormBase database of nematode biology"
   },
   "hugo" : {
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.hugo-international.org/",
      "database" : "Human Genome Organisation",
      "id" : null,
      "datatype" : null,
      "url_example" : null,
      "fullname" : null,
      "abbreviation" : "HUGO",
      "example_id" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null
   },
   "mtbbase" : {
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "MTBBASE",
      "example_id" : null,
      "fullname" : null,
      "url_example" : null,
      "datatype" : null,
      "id" : null,
      "database" : "Collection and Refinement of Physiological Data on Mycobacterium tuberculosis",
      "generic_url" : "http://www.ark.in-berlin.de/Site/MTBbase.html",
      "name" : null,
      "uri_prefix" : null
   },
   "sgd" : {
      "name" : null,
      "generic_url" : "http://www.yeastgenome.org/",
      "id" : null,
      "local_id_syntax" : "S[0-9]{9}",
      "database" : "Saccharomyces Genome Database",
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "SGD:S000006169",
      "abbreviation" : "SGD",
      "url_syntax" : "http://www.yeastgenome.org/locus/[example_id]/overview",
      "entity_type" : "SO:0000704 ! gene",
      "object" : null,
      "datatype" : null,
      "url_example" : "http://www.yeastgenome.org/locus/S000006169/overview"
   },
   "dflat" : {
      "abbreviation" : "DFLAT",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_example" : null,
      "datatype" : null,
      "generic_url" : "http://bcb.cs.tufts.edu/dflat/",
      "name" : null,
      "database" : "Developmental FunctionaL Annotation at Tufts",
      "id" : null,
      "uri_prefix" : null
   },
   "pharmgkb" : {
      "uri_prefix" : null,
      "database" : "Pharmacogenetics and Pharmacogenomics Knowledge Base",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.pharmgkb.org",
      "datatype" : null,
      "url_example" : "http://www.pharmgkb.org/do/serve?objId=PA267",
      "url_syntax" : "http://www.pharmgkb.org/do/serve?objId=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "example_id" : "PharmGKB:PA267",
      "abbreviation" : "PharmGKB"
   },
   "goc" : {
      "generic_url" : "http://www.geneontology.org/",
      "name" : null,
      "id" : null,
      "database" : "Gene Ontology Consortium",
      "uri_prefix" : null,
      "abbreviation" : "GOC",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "datatype" : null,
      "url_example" : null
   },
   "dbsnp" : {
      "fullname" : null,
      "abbreviation" : "dbSNP",
      "example_id" : "dbSNP:rs3131969",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=[example_id]",
      "object" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=rs3131969",
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/projects/SNP",
      "local_id_syntax" : "\\d+",
      "database" : "NCBI dbSNP",
      "id" : null,
      "uri_prefix" : null
   },
   "jcvi_tigrfams" : {
      "id" : null,
      "database" : "TIGRFAMs HMM collection at the J. Craig Venter Institute",
      "name" : null,
      "generic_url" : "http://search.jcvi.org/",
      "uri_prefix" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "url_syntax" : "http://search.jcvi.org/search?p&q=[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "JCVI_TIGRFAMS:TIGR00254",
      "abbreviation" : "JCVI_TIGRFAMS",
      "url_example" : "http://search.jcvi.org/search?p&q=TIGR00254",
      "datatype" : null
   },
   "pdb" : {
      "datatype" : null,
      "url_example" : "http://www.rcsb.org/pdb/cgi/explore.cgi?pdbId=1A4U",
      "fullname" : null,
      "example_id" : "PDB:1A4U",
      "abbreviation" : "PDB",
      "url_syntax" : "http://www.rcsb.org/pdb/cgi/explore.cgi?pdbId=[example_id]",
      "entity_type" : "PR:000000001 ! protein",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.rcsb.org/pdb/",
      "local_id_syntax" : "[A-Za-z0-9]{4}",
      "database" : "Protein Data Bank",
      "id" : null
   },
   "psort" : {
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.psort.org/",
      "database" : "PSORT protein subcellular localization databases and prediction tools for bacteria",
      "id" : null,
      "url_example" : null,
      "datatype" : null,
      "fullname" : null,
      "example_id" : null,
      "abbreviation" : "PSORT",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null
   },
   "pfamb" : {
      "url_example" : null,
      "datatype" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "PfamB",
      "example_id" : "PfamB:PB014624",
      "uri_prefix" : null,
      "database" : "Pfam-B supplement to Pfam",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.sanger.ac.uk/Software/Pfam/"
   },
   "corum" : {
      "datatype" : null,
      "url_example" : "http://mips.gsf.de/genre/proj/corum/complexdetails.html?id=837",
      "fullname" : null,
      "example_id" : "CORUM:837",
      "abbreviation" : "CORUM",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://mips.gsf.de/genre/proj/corum/complexdetails.html?id=[example_id]",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://mips.gsf.de/genre/proj/corum/",
      "database" : "CORUM - the Comprehensive Resource of Mammalian protein complexes",
      "id" : null
   },
   "tigr" : {
      "generic_url" : "http://www.jcvi.org/",
      "name" : null,
      "id" : null,
      "database" : "J. Craig Venter Institute",
      "uri_prefix" : null,
      "abbreviation" : "TIGR",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null
   },
   "tair" : {
      "entity_type" : "SO:0000185 ! primary transcript",
      "url_syntax" : "http://arabidopsis.org/servlets/TairObject?accession=[example_id]",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "TAIR",
      "example_id" : "TAIR:locus:2146653",
      "url_example" : "http://arabidopsis.org/servlets/TairObject?accession=locus:2146653",
      "datatype" : null,
      "database" : "The Arabidopsis Information Resource",
      "local_id_syntax" : "locus:[0-9]{7}",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.arabidopsis.org/",
      "uri_prefix" : null
   },
   "pompep" : {
      "datatype" : null,
      "url_example" : null,
      "fullname" : null,
      "example_id" : "Pompep:SPAC890.04C",
      "abbreviation" : "Pompep",
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "ftp://ftp.sanger.ac.uk/pub/yeast/pombe/Protein_data/",
      "id" : null,
      "database" : "Schizosaccharomyces pombe protein data"
   },
   "sgd_ref" : {
      "datatype" : null,
      "url_example" : "http://www.yeastgenome.org/reference/S000049602/overview",
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.yeastgenome.org/reference/[example_is]/overview",
      "abbreviation" : "SGD_REF",
      "example_id" : "SGD_REF:S000049602",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "Saccharomyces Genome Database",
      "generic_url" : "http://www.yeastgenome.org/",
      "name" : null
   },
   "genedb" : {
      "fullname" : null,
      "abbreviation" : "GeneDB",
      "example_id" : "PF3D7_1467300",
      "entity_type" : "SO:0000704 ! gene",
      "url_syntax" : "http://www.genedb.org/gene/[example_id]",
      "object" : null,
      "url_example" : "http://www.genedb.org/gene/PF3D7_1467300",
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://www.genedb.org/gene/",
      "local_id_syntax" : "((LmjF|LinJ|LmxM)\\.[0-9]{2}\\.[0-9]{4})|(PF3D7_[0-9]{7})|(Tb[0-9]+\\.[A-Za-z0-9]+\\.[0-9]+)|(TcCLB\\.[0-9]{6}\\.[0-9]+)",
      "id" : null,
      "database" : "GeneDB",
      "uri_prefix" : null
   },
   "lifedb" : {
      "name" : null,
      "generic_url" : "http://www.lifedb.de/",
      "description" : "LifeDB is a database for information on protein localization, interaction, functional assays and expression.",
      "id" : null,
      "database" : "LifeDB",
      "uri_prefix" : null,
      "fullname" : null,
      "abbreviation" : "LIFEdb",
      "example_id" : "LIFEdb:DKFZp564O1716",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.dkfz.de/LIFEdb/LIFEdb.aspx?ID=[example_id]",
      "object" : null,
      "url_example" : "http://www.dkfz.de/LIFEdb/LIFEdb.aspx?ID=DKFZp564O1716",
      "datatype" : null
   },
   "prosite" : {
      "abbreviation" : "Prosite",
      "example_id" : "Prosite:PS00365",
      "fullname" : null,
      "object" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "url_syntax" : "http://www.expasy.ch/cgi-bin/prosite-search-ac?[example_id]",
      "datatype" : null,
      "url_example" : "http://www.expasy.ch/cgi-bin/prosite-search-ac?PS00365",
      "generic_url" : "http://www.expasy.ch/prosite/",
      "name" : null,
      "database" : "Prosite database of protein families and domains",
      "id" : null,
      "uri_prefix" : null
   },
   "cgen" : {
      "database" : "Compugen Gene Ontology Gene Association Data",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.cgen.com/",
      "uri_prefix" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "example_id" : "CGEN:PrID131022",
      "abbreviation" : "CGEN",
      "datatype" : null,
      "url_example" : null
   },
   "coriell" : {
      "url_example" : "http://ccr.coriell.org/Sections/Search/Sample_Detail.aspx?Ref=GM07892",
      "datatype" : null,
      "abbreviation" : "CORIELL",
      "example_id" : "GM07892",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://ccr.coriell.org/Sections/Search/Sample_Detail.aspx?Ref=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "generic_url" : "http://ccr.coriell.org/",
      "name" : null,
      "id" : null,
      "description" : "The Coriell Cell Repositories provide essential research reagents to the scientific community by establishing, verifying, maintaining, and distributing cell cultures and DNA derived from cell cultures. These collections, supported by funds from the National Institutes of Health (NIH) and several foundations, are extensively utilized by research scientists around the world.",
      "database" : "Coriell Institute for Medical Research"
   },
   "paint_ref" : {
      "datatype" : null,
      "url_example" : "http://www.geneontology.org/gene-associations/submission/paint/PTHR10046/PTHR10046.txt",
      "fullname" : null,
      "abbreviation" : "PAINT_REF",
      "example_id" : "PAINT_REF:PTHR10046",
      "url_syntax" : "http://www.geneontology.org/gene-associations/submission/paint/[example_id]/[example_id].txt",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.pantherdb.org/",
      "id" : null,
      "database" : "Phylogenetic Annotation INference Tool References"
   },
   "ensemblfungi" : {
      "datatype" : null,
      "url_example" : "http://www.ensemblgenomes.org/id/YOR197W",
      "object" : null,
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "entity_type" : "SO:0000704 ! gene",
      "example_id" : "EnsemblFungi:YOR197W",
      "abbreviation" : "EnsemblFungi",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "Ensembl Fungi, the Ensembl Genomes database for accessing fungal genome data",
      "generic_url" : "http://fungi.ensembl.org/",
      "name" : null
   },
   "um-bbd_reactionid" : {
      "uri_prefix" : null,
      "id" : null,
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "name" : null,
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "url_example" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=r&reacID=r0129",
      "datatype" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=r&reacID=[example_id]",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "UM-BBD_reactionID",
      "example_id" : "UM-BBD_reactionID:r0129"
   },
   "locusid" : {
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "LocusID",
      "example_id" : "NCBI_Gene:4771",
      "datatype" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "database" : "NCBI Gene",
      "id" : null,
      "local_id_syntax" : "\\d+",
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "uri_prefix" : null
   },
   "unigene" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/UniGene",
      "name" : null,
      "database" : "UniGene",
      "description" : "NCBI transcript cluster database, organized by transcriptome. Each UniGene entry is a set of transcript sequences that appear to come from the same transcription locus (gene or expressed pseudogene).",
      "id" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/UniGene/clust.cgi?ORG=Hs&CID=212293",
      "datatype" : null,
      "abbreviation" : "UniGene",
      "example_id" : "UniGene:Hs.212293",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/UniGene/clust.cgi?ORG=[organism_abbreviation]&CID=[cluster_id]",
      "entity_type" : "BET:0000000 ! entity"
   },
   "alzheimers_university_of_toronto" : {
      "id" : null,
      "database" : "Alzheimers Project at University of Toronto",
      "name" : null,
      "generic_url" : "http://www.ims.utoronto.ca/",
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "abbreviation" : "Alzheimers_University_of_Toronto",
      "example_id" : null,
      "datatype" : null,
      "url_example" : null
   },
   "protein_id" : {
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "id" : null,
      "local_id_syntax" : "[A-Z]{3}[0-9]{5}(\\.[0-9]+)?",
      "description" : "protein identifier shared by DDBJ/EMBL-bank/GenBank nucleotide sequence databases",
      "database" : "DDBJ / ENA / GenBank",
      "url_example" : null,
      "datatype" : null,
      "fullname" : null,
      "example_id" : "protein_id:CAA71991",
      "abbreviation" : "protein_id",
      "url_syntax" : null,
      "entity_type" : "PR:000000001 ! protein",
      "object" : null
   },
   "cgdid" : {
      "database" : "Candida Genome Database",
      "local_id_syntax" : "(CAL|CAF)[0-9]{7}",
      "id" : null,
      "generic_url" : "http://www.candidagenome.org/",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "abbreviation" : "CGDID",
      "example_id" : "CGD:CAL0005516",
      "fullname" : null,
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=CAL0005516",
      "datatype" : null
   },
   "jcvi_egad" : {
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "example_id" : "JCVI_EGAD:74462",
      "abbreviation" : "JCVI_EGAD",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=74462",
      "datatype" : null,
      "id" : null,
      "database" : "JCVI CMR Egad",
      "name" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "uri_prefix" : null
   },
   "sp_kw" : {
      "generic_url" : "http://www.uniprot.org/keywords/",
      "name" : null,
      "database" : "UniProt Knowledgebase keywords",
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "SP_KW",
      "example_id" : "UniProtKB-KW:KW-0812",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.uniprot.org/keywords/[example_id]",
      "datatype" : null,
      "url_example" : "http://www.uniprot.org/keywords/KW-0812"
   },
   "casspc" : {
      "database" : "Catalog of Fishes species database",
      "id" : null,
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=[example_id]",
      "abbreviation" : "CASSPC",
      "example_id" : null,
      "fullname" : null,
      "datatype" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=1979"
   },
   "ncbi_taxid" : {
      "datatype" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "object" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "ncbi_taxid",
      "example_id" : "taxon:7227",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "NCBI Taxonomy",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "name" : null
   },
   "ncbi_locus_tag" : {
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "abbreviation" : "NCBI_locus_tag",
      "example_id" : "NCBI_locus_tag:CTN_0547",
      "url_example" : null,
      "datatype" : null,
      "database" : "NCBI locus tag",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "uri_prefix" : null
   },
   "echobase" : {
      "object" : null,
      "url_syntax" : "http://www.biolws1.york.ac.uk/echobase/Gene.cfm?recordID=[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "abbreviation" : "EchoBASE",
      "example_id" : "EchoBASE:EB0231",
      "fullname" : null,
      "url_example" : "http://www.biolws1.york.ac.uk/echobase/Gene.cfm?recordID=EB0231",
      "datatype" : null,
      "local_id_syntax" : "EB[0-9]{4}",
      "database" : "EchoBASE post-genomic database for Escherichia coli",
      "id" : null,
      "generic_url" : "http://www.ecoli-york.org/",
      "name" : null,
      "uri_prefix" : null
   },
   "wb" : {
      "fullname" : null,
      "abbreviation" : "WB",
      "example_id" : "WB:WBGene00003001",
      "url_syntax" : "http://www.wormbase.org/db/gene/gene?name=[example_id]",
      "entity_type" : "PR:000000001 ! protein",
      "object" : null,
      "datatype" : null,
      "url_example" : "http://www.wormbase.org/db/get?class=Gene;name=WBGene00003001",
      "name" : null,
      "generic_url" : "http://www.wormbase.org/",
      "id" : null,
      "local_id_syntax" : "(WP:CE[0-9]{5})|(WB(Gene|Var|RNAi|Transgene)[0-9]{8})",
      "database" : "WormBase database of nematode biology",
      "uri_prefix" : null
   },
   "ensembl" : {
      "uri_prefix" : null,
      "local_id_syntax" : "ENS[A-Z0-9]{10,17}",
      "database" : "Ensembl database of automatically annotated genomic data",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.ensembl.org/",
      "datatype" : null,
      "url_example" : "http://www.ensembl.org/id/ENSP00000265949",
      "entity_type" : "SO:0000673 ! transcript",
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "ENSEMBL:ENSP00000265949",
      "abbreviation" : "Ensembl"
   },
   "biomd" : {
      "uri_prefix" : null,
      "id" : null,
      "database" : "BioModels Database",
      "generic_url" : "http://www.ebi.ac.uk/biomodels/",
      "name" : null,
      "url_example" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=BIOMD0000000045",
      "datatype" : null,
      "object" : null,
      "url_syntax" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "BIOMD",
      "example_id" : "BIOMD:BIOMD0000000045",
      "fullname" : null
   },
   "eck" : {
      "name" : null,
      "generic_url" : "http://www.ecogene.org/",
      "id" : null,
      "local_id_syntax" : "ECK[0-9]{4}",
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "uri_prefix" : null,
      "fullname" : null,
      "abbreviation" : "ECK",
      "example_id" : "ECK:ECK3746",
      "url_syntax" : "http://www.ecogene.org/geneInfo.php?eck_id=[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "object" : null,
      "url_example" : "http://www.ecogene.org/geneInfo.php?eck_id=ECK3746",
      "datatype" : null
   },
   "genprotec" : {
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "abbreviation" : "GenProtEC",
      "example_id" : null,
      "url_example" : null,
      "datatype" : null,
      "database" : "GenProtEC E. coli genome and proteome database",
      "id" : null,
      "name" : null,
      "generic_url" : "http://genprotec.mbl.edu/",
      "uri_prefix" : null
   },
   "superfamily" : {
      "generic_url" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/index.html",
      "name" : null,
      "database" : "SUPERFAMILY protein annotation database",
      "description" : "A database of structural and functional protein annotations for completely sequenced genomes",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "SUPERFAMILY:51905",
      "abbreviation" : "SUPERFAMILY",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/cgi-bin/scop.cgi?ipid=SSF[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "url_example" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/cgi-bin/scop.cgi?ipid=SSF51905",
      "datatype" : null
   },
   "pinc" : {
      "generic_url" : "http://www.proteome.com/",
      "name" : null,
      "description" : "represents GO annotations created in 2001 for NCBI and extracted into UniProtKB-GOA from EntrezGene",
      "database" : "Proteome Inc.",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "abbreviation" : "PINC",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "datatype" : null,
      "url_example" : null
   },
   "iuphar_gpcr" : {
      "id" : null,
      "database" : "International Union of Pharmacology",
      "generic_url" : "http://www.iuphar.org/",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "url_syntax" : "http://www.iuphar-db.org/DATABASE/FamilyMenuForward?familyId=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "IUPHAR_GPCR",
      "example_id" : "IUPHAR_GPCR:1279",
      "fullname" : null,
      "url_example" : "http://www.iuphar-db.org/DATABASE/FamilyMenuForward?familyId=13",
      "datatype" : null
   },
   "enzyme" : {
      "datatype" : null,
      "url_example" : "http://www.expasy.ch/cgi-bin/nicezyme.pl?1.1.1.1",
      "url_syntax" : "http://www.expasy.ch/cgi-bin/nicezyme.pl?[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "example_id" : "ENZYME:EC 1.1.1.1",
      "abbreviation" : "ENZYME",
      "uri_prefix" : null,
      "id" : null,
      "database" : "Swiss Institute of Bioinformatics enzyme database",
      "name" : null,
      "generic_url" : "http://www.expasy.ch/"
   },
   "broad" : {
      "url_example" : null,
      "datatype" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "abbreviation" : "Broad",
      "example_id" : null,
      "uri_prefix" : null,
      "database" : "Broad Institute",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.broad.mit.edu/"
   },
   "biopixie_mefit" : {
      "datatype" : null,
      "url_example" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "example_id" : null,
      "abbreviation" : "bioPIXIE_MEFIT",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "biological Process Inference from eXperimental Interaction Evidence/Microarray Experiment Functional Integration Technology",
      "generic_url" : "http://pixie.princeton.edu/pixie/",
      "name" : null
   },
   "uniprotkb-kw" : {
      "name" : null,
      "generic_url" : "http://www.uniprot.org/keywords/",
      "database" : "UniProt Knowledgebase keywords",
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "UniProtKB-KW:KW-0812",
      "abbreviation" : "UniProtKB-KW",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.uniprot.org/keywords/[example_id]",
      "object" : null,
      "url_example" : "http://www.uniprot.org/keywords/KW-0812",
      "datatype" : null
   },
   "ipr" : {
      "fullname" : null,
      "abbreviation" : "IPR",
      "example_id" : "InterPro:IPR000001",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "url_syntax" : "http://www.ebi.ac.uk/interpro/entry/[example_id]",
      "object" : null,
      "url_example" : "http://www.ebi.ac.uk/interpro/entry/IPR015421",
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://www.ebi.ac.uk/interpro/",
      "database" : "InterPro database of protein domains and motifs",
      "local_id_syntax" : "IPR\\d{6}",
      "id" : null,
      "uri_prefix" : null
   },
   "pubmed" : {
      "object" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/pubmed/[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "PMID:4208797",
      "abbreviation" : "PubMed",
      "fullname" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/pubmed/4208797",
      "datatype" : null,
      "local_id_syntax" : "[0-9]+",
      "database" : "PubMed",
      "id" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/PubMed/",
      "name" : null,
      "uri_prefix" : null
   },
   "hamap" : {
      "example_id" : "HAMAP:MF_00031",
      "abbreviation" : "HAMAP",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://hamap.expasy.org/unirule/[example_id]",
      "datatype" : null,
      "url_example" : "http://hamap.expasy.org/unirule/MF_00131",
      "generic_url" : "http://hamap.expasy.org/",
      "name" : null,
      "id" : null,
      "database" : "High-quality Automated and Manual Annotation of microbial Proteomes",
      "uri_prefix" : null
   },
   "pamgo_mgg" : {
      "uri_prefix" : null,
      "description" : "Magnaporthe grisea database at North Carolina State University; member of PAMGO Interest Group",
      "database" : "Magnaporthe grisea database",
      "id" : null,
      "name" : null,
      "generic_url" : "http://scotland.fgl.ncsu.edu/smeng/GoAnnotationMagnaporthegrisea.html",
      "datatype" : null,
      "url_example" : "http://scotland.fgl.ncsu.edu/cgi-bin/adHocQuery.cgi?adHocQuery_dbName=smeng_goannotation&Action=Data&QueryName=Functional+Categorization+of+MGG+GO+Annotation&P_KeyWord=MGG_05132",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://scotland.fgl.ncsu.edu/cgi-bin/adHocQuery.cgi?adHocQuery_dbName=smeng_goannotation&Action=Data&QueryName=Functional+Categorization+of+MGG+GO+Annotation&P_KeyWord=[example_id]",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "PAMGO_MGG",
      "example_id" : "PAMGO_MGG:MGG_05132"
   },
   "ecogene_g" : {
      "abbreviation" : "ECOGENE_G",
      "example_id" : "ECOGENE_G:deoC",
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_example" : null,
      "datatype" : null,
      "generic_url" : "http://www.ecogene.org/",
      "name" : null,
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "id" : null,
      "uri_prefix" : null
   },
   "ddb" : {
      "datatype" : null,
      "url_example" : "http://dictybase.org/gene/DDB_G0277859",
      "abbreviation" : "DDB",
      "example_id" : "dictyBase:DDB_G0277859",
      "fullname" : null,
      "object" : null,
      "entity_type" : "SO:0000704 ! gene",
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "uri_prefix" : null,
      "generic_url" : "http://dictybase.org",
      "name" : null,
      "local_id_syntax" : "DDB_G[0-9]{7}",
      "database" : "dictyBase",
      "id" : null
   },
   "modbase" : {
      "uri_prefix" : null,
      "id" : null,
      "database" : "ModBase comprehensive Database of Comparative Protein Structure Models",
      "name" : null,
      "generic_url" : "http://modbase.compbio.ucsf.edu/",
      "url_example" : "http://salilab.org/modbase/searchbyid?databaseID=P04848",
      "datatype" : null,
      "url_syntax" : "http://salilab.org/modbase/searchbyid?databaseID=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "example_id" : "ModBase:P10815",
      "abbreviation" : "ModBase"
   },
   "geo" : {
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/GDSbrowser?acc=GDS2223",
      "datatype" : null,
      "object" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/GDSbrowser?acc=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "GEO:GDS2223",
      "abbreviation" : "GEO",
      "fullname" : null,
      "uri_prefix" : null,
      "database" : "NCBI Gene Expression Omnibus",
      "id" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/geo/",
      "name" : null
   },
   "bfo" : {
      "id" : null,
      "description" : "An upper ontology used by Open Bio Ontologies (OBO) Foundry. BFO contains upper-level classes as well as core relations such as part_of (BFO_0000050)",
      "database" : "Basic Formal Ontology",
      "generic_url" : "http://purl.obolibrary.org/obo/bfo",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "url_syntax" : "http://purl.obolibrary.org/obo/BFO_[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "BFO",
      "example_id" : "BFO:0000066",
      "fullname" : null,
      "datatype" : null,
      "url_example" : "http://purl.obolibrary.org/obo/BFO_0000066"
   },
   "unimod" : {
      "uri_prefix" : null,
      "id" : null,
      "description" : "protein modifications for mass spectrometry",
      "database" : "UniMod",
      "generic_url" : "http://www.unimod.org/",
      "name" : null,
      "datatype" : null,
      "url_example" : "http://www.unimod.org/modifications_view.php?editid1=1287",
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.unimod.org/modifications_view.php?editid1=[example_id]",
      "example_id" : "UniMod:1287",
      "abbreviation" : "UniMod",
      "fullname" : null
   },
   "subtilist" : {
      "uri_prefix" : null,
      "id" : null,
      "database" : "Bacillus subtilis Genome Sequence Project",
      "name" : null,
      "generic_url" : "http://genolist.pasteur.fr/SubtiList/",
      "url_example" : null,
      "datatype" : null,
      "url_syntax" : null,
      "entity_type" : "PR:000000001 ! protein",
      "object" : null,
      "fullname" : null,
      "example_id" : "SUBTILISTG:BG11384",
      "abbreviation" : "SUBTILIST"
   },
   "obo_rel" : {
      "fullname" : null,
      "example_id" : "OBO_REL:part_of",
      "abbreviation" : "OBO_REL",
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "datatype" : null,
      "url_example" : null,
      "name" : null,
      "generic_url" : "http://www.obofoundry.org/ro/",
      "id" : null,
      "database" : "OBO relation ontology",
      "uri_prefix" : null
   },
   "sgd_locus" : {
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.yeastgenome.org/locus/[example_id]/overview",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "SGD_LOCUS",
      "example_id" : "SGD_LOCUS:GAL4",
      "url_example" : "http://www.yeastgenome.org/locus/S000006169/overview",
      "datatype" : null,
      "id" : null,
      "database" : "Saccharomyces Genome Database",
      "name" : null,
      "generic_url" : "http://www.yeastgenome.org/",
      "uri_prefix" : null
   },
   "wikipedia" : {
      "uri_prefix" : null,
      "id" : null,
      "database" : "Wikipedia",
      "name" : null,
      "generic_url" : "http://en.wikipedia.org/",
      "url_example" : "http://en.wikipedia.org/wiki/Endoplasmic_reticulum",
      "datatype" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://en.wikipedia.org/wiki/[example_id]",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "Wikipedia",
      "example_id" : "Wikipedia:Endoplasmic_reticulum"
   },
   "um-bbd_pathwayid" : {
      "url_example" : "http://umbbd.msi.umn.edu/acr/acr_map.html",
      "datatype" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://umbbd.msi.umn.edu/[example_id]/[example_id]_map.html",
      "abbreviation" : "UM-BBD_pathwayID",
      "example_id" : "UM-BBD_pathwayID:acr",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "name" : null
   },
   "mesh" : {
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.nlm.nih.gov/cgi/mesh/2005/MB_cgi?mode=&term=[example_id]",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "MeSH",
      "example_id" : "MeSH:mitosis",
      "url_example" : "http://www.nlm.nih.gov/cgi/mesh/2005/MB_cgi?mode=&term=mitosis",
      "datatype" : null,
      "id" : null,
      "database" : "Medical Subject Headings",
      "name" : null,
      "generic_url" : "http://www.nlm.nih.gov/mesh/2005/MBrowser.html",
      "uri_prefix" : null
   },
   "cas_gen" : {
      "id" : null,
      "database" : "Catalog of Fishes genus database",
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=[example_id]",
      "example_id" : "CASGEN:1040",
      "abbreviation" : "CAS_GEN",
      "fullname" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=1040",
      "datatype" : null
   },
   "ncbi_gi" : {
      "object" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "abbreviation" : "NCBI_gi",
      "example_id" : "NCBI_gi:113194944",
      "fullname" : null,
      "datatype" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=113194944",
      "local_id_syntax" : "[0-9]{6,}",
      "id" : null,
      "database" : "NCBI databases",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "name" : null,
      "uri_prefix" : null
   },
   "gr_gene" : {
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.gramene.org/db/genes/search_gene?acc=[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "GR_GENE:GR:0060198",
      "abbreviation" : "GR_gene",
      "url_example" : "http://www.gramene.org/db/genes/search_gene?acc=GR:0060198",
      "datatype" : null,
      "database" : "Gramene",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.gramene.org/",
      "uri_prefix" : null
   },
   "ec" : {
      "example_id" : "EC:1.4.3.6",
      "abbreviation" : "EC",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.expasy.org/enzyme/[example_id]",
      "entity_type" : "GO:0003824 ! catalytic activity",
      "datatype" : null,
      "url_example" : "http://www.expasy.org/enzyme/1.4.3.6",
      "generic_url" : "http://www.chem.qmul.ac.uk/iubmb/enzyme/",
      "name" : null,
      "database" : "Enzyme Commission",
      "id" : null,
      "uri_prefix" : null
   },
   "tigr_ref" : {
      "datatype" : null,
      "url_example" : "http://cmr.jcvi.org/CMR/AnnotationSops.shtml",
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "example_id" : "JCVI_REF:GO_ref",
      "abbreviation" : "TIGR_REF",
      "uri_prefix" : null,
      "database" : "J. Craig Venter Institute",
      "id" : null,
      "name" : null,
      "generic_url" : "http://cmr.jcvi.org/"
   },
   "pro" : {
      "datatype" : null,
      "url_example" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:000025380",
      "url_syntax" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:[example_id]",
      "entity_type" : "PR:000000001 ! protein",
      "object" : null,
      "fullname" : null,
      "example_id" : "PR:000025380",
      "abbreviation" : "PRO",
      "uri_prefix" : null,
      "local_id_syntax" : "[0-9]{9}",
      "id" : null,
      "database" : "Protein Ontology",
      "name" : null,
      "generic_url" : "http://www.proconsortium.org/pro/pro.shtml"
   },
   "biomdid" : {
      "example_id" : "BIOMD:BIOMD0000000045",
      "abbreviation" : "BIOMDID",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "url_example" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=BIOMD0000000045",
      "datatype" : null,
      "generic_url" : "http://www.ebi.ac.uk/biomodels/",
      "name" : null,
      "id" : null,
      "database" : "BioModels Database",
      "uri_prefix" : null
   },
   "smd" : {
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "example_id" : null,
      "abbreviation" : "SMD",
      "url_example" : null,
      "datatype" : null,
      "database" : "Stanford Microarray Database",
      "id" : null,
      "name" : null,
      "generic_url" : "http://genome-www.stanford.edu/microarray",
      "uri_prefix" : null
   },
   "cgd_locus" : {
      "name" : null,
      "generic_url" : "http://www.candidagenome.org/",
      "database" : "Candida Genome Database",
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "CGD_LOCUS:HWP1",
      "abbreviation" : "CGD_LOCUS",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "object" : null,
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?locus=HWP1",
      "datatype" : null
   },
   "mim" : {
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=OMIM",
      "id" : null,
      "database" : "Mendelian Inheritance in Man",
      "uri_prefix" : null,
      "fullname" : null,
      "abbreviation" : "MIM",
      "example_id" : "OMIM:190198",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://omim.org/entry/[example_id]",
      "object" : null,
      "url_example" : "http://omim.org/entry/190198",
      "datatype" : null
   },
   "cazy" : {
      "name" : null,
      "generic_url" : "http://www.cazy.org/",
      "local_id_syntax" : "(CE|GH|GT|PL)\\d+",
      "description" : "The CAZy database describes the families of structurally-related catalytic and carbohydrate-binding modules (or functional domains) of enzymes that degrade, modify, or create glycosidic bonds.",
      "id" : null,
      "database" : "Carbohydrate Active EnZYmes",
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "CAZY:PL11",
      "abbreviation" : "CAZY",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.cazy.org/[example_id].html",
      "object" : null,
      "url_example" : "http://www.cazy.org/PL11.html",
      "datatype" : null
   },
   "mips_funcat" : {
      "example_id" : "MIPS_funcat:11.02",
      "abbreviation" : "MIPS_funcat",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://mips.gsf.de/cgi-bin/proj/funcatDB/search_advanced.pl?action=2&wert=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "datatype" : null,
      "url_example" : "http://mips.gsf.de/cgi-bin/proj/funcatDB/search_advanced.pl?action=2&wert=11.02",
      "generic_url" : "http://mips.gsf.de/proj/funcatDB/",
      "name" : null,
      "id" : null,
      "database" : "MIPS Functional Catalogue",
      "uri_prefix" : null
   },
   "prints" : {
      "datatype" : null,
      "url_example" : "http://www.bioinf.manchester.ac.uk/cgi-bin/dbbrowser/sprint/searchprintss.cgi?display_opts=Prints&category=None&queryform=false&regexpr=off&prints_accn=PR00025",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "url_syntax" : "http://www.bioinf.manchester.ac.uk/cgi-bin/dbbrowser/sprint/searchprintss.cgi?display_opts=Prints&category=None&queryform=false&regexpr=off&prints_accn=[example_id]",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "PRINTS",
      "example_id" : "PRINTS:PR00025",
      "uri_prefix" : null,
      "id" : null,
      "database" : "PRINTS compendium of protein fingerprints",
      "name" : null,
      "generic_url" : "http://www.bioinf.manchester.ac.uk/dbbrowser/PRINTS/"
   },
   "po" : {
      "local_id_syntax" : "[0-9]{7}",
      "database" : "Plant Ontology Consortium Database",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.plantontology.org/",
      "uri_prefix" : null,
      "url_syntax" : "http://www.plantontology.org/amigo/go.cgi?action=query&view=query&search_constraint=terms&query=PO:[example_id]",
      "entity_type" : "PO:0009012 ! plant structure development stage",
      "object" : null,
      "fullname" : null,
      "example_id" : "PO:0009004",
      "abbreviation" : "PO",
      "url_example" : "http://www.plantontology.org/amigo/go.cgi?action=query&view=query&search_constraint=terms&query=PO:0009004",
      "datatype" : null
   },
   "omssa" : {
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/omssa/",
      "id" : null,
      "database" : "Open Mass Spectrometry Search Algorithm",
      "datatype" : null,
      "url_example" : null,
      "fullname" : null,
      "abbreviation" : "OMSSA",
      "example_id" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null
   },
   "mi" : {
      "database" : "Proteomic Standard Initiative for Molecular Interaction",
      "id" : null,
      "name" : null,
      "generic_url" : "http://psidev.sourceforge.net/mi/xml/doc/user/index.html",
      "uri_prefix" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "abbreviation" : "MI",
      "example_id" : "MI:0018",
      "url_example" : null,
      "datatype" : null
   },
   "rhea" : {
      "datatype" : null,
      "url_example" : "http://www.ebi.ac.uk/rhea/reaction.xhtml?id=25811",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.ebi.ac.uk/rhea/reaction.xhtml?id=[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "RHEA:25811",
      "abbreviation" : "RHEA",
      "uri_prefix" : null,
      "description" : "Rhea is a freely available, manually annotated database of chemical reactions created in collaboration with the Swiss Institute of Bioinformatics (SIB).",
      "database" : "Rhea, the Annotated Reactions Database",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.ebi.ac.uk/rhea/"
   },
   "vida" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.biochem.ucl.ac.uk/bsm/virus_database/VIDA.html",
      "name" : null,
      "id" : null,
      "database" : "Virus Database at University College London",
      "datatype" : null,
      "url_example" : null,
      "abbreviation" : "VIDA",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "cacao" : {
      "database" : "Community Assessment of Community Annotation with Ontologies",
      "description" : "The Community Assessment of Community Annotation with Ontologies (CACAO) is a project to do large-scale manual community annotation of gene function using the Gene Ontology as a multi-institution student competition.",
      "id" : null,
      "generic_url" : "http://gowiki.tamu.edu/wiki/index.php/Category:CACAO",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "url_syntax" : "http://gowiki.tamu.edu/wiki/index.php/[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "CACAO",
      "example_id" : "MYCS2:A0QNF5",
      "fullname" : null,
      "datatype" : null,
      "url_example" : "http://gowiki.tamu.edu/wiki/index.php/MYCS2:A0QNF5"
   },
   "cgsc" : {
      "uri_prefix" : null,
      "id" : null,
      "database" : "CGSC",
      "generic_url" : "http://cgsc.biology.yale.edu/",
      "name" : null,
      "datatype" : null,
      "url_example" : "http://cgsc.biology.yale.edu/Site.php?ID=315",
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "example_id" : "CGSC:rbsK",
      "abbreviation" : "CGSC",
      "fullname" : null
   },
   "pubchem_substance" : {
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pcsubstance&term=4594",
      "datatype" : null,
      "object" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pcsubstance&term=[example_id]",
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "abbreviation" : "PubChem_Substance",
      "example_id" : "PubChem_Substance:4594",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "local_id_syntax" : "[0-9]{4,}",
      "database" : "NCBI PubChem database of chemical substances",
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "name" : null
   },
   "mengo" : {
      "name" : null,
      "generic_url" : "http://mengo.vbi.vt.edu/",
      "database" : "Microbial ENergy processes Gene Ontology Project",
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "abbreviation" : "MENGO",
      "example_id" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "datatype" : null,
      "url_example" : null
   },
   "cog_pathway" : {
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/new/release/coglist.cgi?pathw=14",
      "datatype" : null,
      "fullname" : null,
      "abbreviation" : "COG_Pathway",
      "example_id" : "COG_Pathway:14",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/new/release/coglist.cgi?pathw=[example_id]",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "database" : "NCBI COG pathway",
      "id" : null
   },
   "cl" : {
      "generic_url" : "http://cellontology.org",
      "name" : null,
      "local_id_syntax" : "[0-9]{7}",
      "database" : "Cell Type Ontology",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "CL:0000041",
      "abbreviation" : "CL",
      "fullname" : null,
      "object" : null,
      "entity_type" : "GO:0005623 ! cell",
      "url_syntax" : "http://purl.obolibrary.org/obo/CL_[example_id]",
      "datatype" : null,
      "url_example" : "http://purl.obolibrary.org/obo/CL_0000041"
   },
   "yeastfunc" : {
      "id" : null,
      "database" : "Yeast Function",
      "generic_url" : "http://func.med.harvard.edu/yeast/",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "abbreviation" : "YeastFunc",
      "example_id" : null,
      "fullname" : null,
      "url_example" : null,
      "datatype" : null
   },
   "iuphar" : {
      "uri_prefix" : null,
      "id" : null,
      "database" : "International Union of Pharmacology",
      "name" : null,
      "generic_url" : "http://www.iuphar.org/",
      "url_example" : null,
      "datatype" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "abbreviation" : "IUPHAR",
      "example_id" : null
   },
   "ro" : {
      "uri_prefix" : null,
      "generic_url" : "http://purl.obolibrary.org/obo/ro",
      "name" : null,
      "description" : "A collection of relations used across OBO ontologies",
      "id" : null,
      "database" : "OBO Relation Ontology Ontology",
      "datatype" : null,
      "url_example" : "http://purl.obolibrary.org/obo/RO_0002211",
      "example_id" : "RO:0002211",
      "abbreviation" : "RO",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://purl.obolibrary.org/obo/RO_[example_id]",
      "entity_type" : "BET:0000000 ! entity"
   },
   "ipi" : {
      "url_example" : null,
      "datatype" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "example_id" : "IPI:IPI00000005.1",
      "abbreviation" : "IPI",
      "fullname" : null,
      "uri_prefix" : null,
      "database" : "International Protein Index",
      "id" : null,
      "generic_url" : "http://www.ebi.ac.uk/IPI/IPIhelp.html",
      "name" : null
   },
   "sanger" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.sanger.ac.uk/",
      "name" : null,
      "id" : null,
      "database" : "Wellcome Trust Sanger Institute",
      "url_example" : null,
      "datatype" : null,
      "abbreviation" : "Sanger",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "casgen" : {
      "database" : "Catalog of Fishes genus database",
      "id" : null,
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "CASGEN:1040",
      "abbreviation" : "CASGEN",
      "fullname" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=1040",
      "datatype" : null
   },
   "jstor" : {
      "uri_prefix" : null,
      "database" : "Digital archive of scholarly articles",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.jstor.org/",
      "datatype" : null,
      "url_example" : "http://www.jstor.org/stable/3093870",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.jstor.org/stable/[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "JSTOR:3093870",
      "abbreviation" : "JSTOR"
   },
   "ena" : {
      "datatype" : null,
      "url_example" : "http://www.ebi.ac.uk/ena/data/view/AA816246",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.ebi.ac.uk/ena/data/view/[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "ENA:AA816246",
      "abbreviation" : "ENA",
      "uri_prefix" : null,
      "description" : "ENA is made up of a number of distinct databases that includes EMBL-Bank, the newly established Sequence Read Archive (SRA) and the Trace Archive. International nucleotide sequence database collaboration, comprising ENA-EBI nucleotide sequence data library (EMBL-Bank), DNA DataBank of Japan (DDBJ), and NCBI GenBank",
      "local_id_syntax" : "([A-Z]{1}[0-9]{5})|([A-Z]{2}[0-9]{6})|([A-Z]{4}[0-9]{8,9})",
      "database" : "European Nucleotide Archive",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.ebi.ac.uk/ena/"
   },
   "imgt_hla" : {
      "fullname" : null,
      "abbreviation" : "IMGT_HLA",
      "example_id" : "IMGT_HLA:HLA00031",
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "url_example" : null,
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://www.ebi.ac.uk/imgt/hla",
      "database" : "IMGT/HLA human major histocompatibility complex sequence database",
      "id" : null,
      "uri_prefix" : null
   },
   "gr_ref" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.gramene.org/",
      "name" : null,
      "id" : null,
      "database" : "Gramene",
      "datatype" : null,
      "url_example" : "http://www.gramene.org/db/literature/pub_search?ref_id=659",
      "example_id" : "GR_REF:659",
      "abbreviation" : "GR_REF",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.gramene.org/db/literature/pub_search?ref_id=[example_id]",
      "entity_type" : "BET:0000000 ! entity"
   },
   "poc" : {
      "uri_prefix" : null,
      "id" : null,
      "database" : "Plant Ontology Consortium",
      "name" : null,
      "generic_url" : "http://www.plantontology.org/",
      "datatype" : null,
      "url_example" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "fullname" : null,
      "abbreviation" : "POC",
      "example_id" : null
   },
   "rebase" : {
      "uri_prefix" : null,
      "database" : "REBASE restriction enzyme database",
      "id" : null,
      "generic_url" : "http://rebase.neb.com/rebase/rebase.html",
      "name" : null,
      "url_example" : "http://rebase.neb.com/rebase/enz/EcoRI.html",
      "datatype" : null,
      "object" : null,
      "url_syntax" : "http://rebase.neb.com/rebase/enz/[example_id].html",
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "REBASE:EcoRI",
      "abbreviation" : "REBASE",
      "fullname" : null
   },
   "fb" : {
      "uri_prefix" : null,
      "generic_url" : "http://flybase.org/",
      "name" : null,
      "id" : null,
      "local_id_syntax" : "FBgn[0-9]{7}",
      "database" : "FlyBase",
      "datatype" : null,
      "url_example" : "http://flybase.org/reports/FBgn0000024.html",
      "example_id" : "FB:FBgn0000024",
      "abbreviation" : "FB",
      "fullname" : null,
      "object" : null,
      "entity_type" : "SO:0000704 ! gene",
      "url_syntax" : "http://flybase.org/reports/[example_id].html"
   },
   "uniprotkb-subcell" : {
      "url_example" : "http://www.uniprot.org/locations/SL-0012",
      "datatype" : null,
      "fullname" : null,
      "abbreviation" : "UniProtKB-SubCell",
      "example_id" : "UniProtKB-SubCell:SL-0012",
      "url_syntax" : "http://www.uniprot.org/locations/[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.uniprot.org/locations/",
      "id" : null,
      "database" : "UniProt Knowledgebase Subcellular Location vocabulary"
   },
   "hgnc_gene" : {
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.genenames.org/data/hgnc_data.php?app_sym=[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "HGNC_gene:ABCA1",
      "abbreviation" : "HGNC_gene",
      "datatype" : null,
      "url_example" : "http://www.genenames.org/data/hgnc_data.php?app_sym=ABCA1",
      "id" : null,
      "database" : "HUGO Gene Nomenclature Committee",
      "name" : null,
      "generic_url" : "http://www.genenames.org/",
      "uri_prefix" : null
   },
   "agricola_id" : {
      "uri_prefix" : null,
      "generic_url" : "http://agricola.nal.usda.gov/",
      "name" : null,
      "database" : "AGRICultural OnLine Access",
      "id" : null,
      "url_example" : null,
      "datatype" : null,
      "abbreviation" : "AGRICOLA_ID",
      "example_id" : "AGRICOLA_NAL:TP248.2 P76 v.14",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null
   },
   "cas_spc" : {
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "name" : null,
      "database" : "Catalog of Fishes species database",
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "CAS_SPC",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=[example_id]",
      "datatype" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=1979"
   },
   "hgnc" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.genenames.org/",
      "name" : null,
      "id" : null,
      "local_id_syntax" : "[0-9]+",
      "database" : "HUGO Gene Nomenclature Committee",
      "url_example" : "http://www.genenames.org/data/hgnc_data.php?hgnc_id=HGNC:29",
      "datatype" : null,
      "abbreviation" : "HGNC",
      "example_id" : "HGNC:29",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.genenames.org/data/hgnc_data.php?hgnc_id=HGNC:[example_id]",
      "entity_type" : "SO:0000704 ! gene"
   },
   "kegg_pathway" : {
      "id" : null,
      "database" : "KEGG Pathways Database",
      "generic_url" : "http://www.genome.jp/kegg/pathway.html",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?path:[example_id]",
      "abbreviation" : "KEGG_PATHWAY",
      "example_id" : "KEGG_PATHWAY:ot00020",
      "fullname" : null,
      "datatype" : null,
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?path:ot00020"
   },
   "dictybase_ref" : {
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=[example_id]",
      "example_id" : "dictyBase_REF:10157",
      "abbreviation" : "dictyBase_REF",
      "fullname" : null,
      "url_example" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=10157",
      "datatype" : null,
      "database" : "dictyBase literature references",
      "id" : null,
      "generic_url" : "http://dictybase.org",
      "name" : null,
      "uri_prefix" : null
   },
   "cog_function" : {
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "id" : null,
      "database" : "NCBI COG function",
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "COG_Function:H",
      "abbreviation" : "COG_Function",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/grace/shokog.cgi?fun=[example_id]",
      "object" : null,
      "datatype" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/grace/shokog.cgi?fun=H"
   },
   "um-bbd_enzymeid" : {
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "id" : null,
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=ep&enzymeID=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "UM-BBD_enzymeID",
      "example_id" : "UM-BBD_enzymeID:e0413",
      "fullname" : null,
      "url_example" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=ep&enzymeID=e0230",
      "datatype" : null
   },
   "uberon" : {
      "entity_type" : "CARO:0000000 ! anatomical entity",
      "url_syntax" : "http://purl.obolibrary.org/obo/UBERON_[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "URBERON:0002398",
      "abbreviation" : "UBERON",
      "url_example" : "http://purl.obolibrary.org/obo/UBERON_0002398",
      "datatype" : null,
      "local_id_syntax" : "[0-9]{7}",
      "description" : "A multi-species anatomy ontology",
      "database" : "Uber-anatomy ontology",
      "id" : null,
      "name" : null,
      "generic_url" : "http://uberon.org",
      "uri_prefix" : null
   },
   "reac" : {
      "datatype" : null,
      "url_example" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=REACT_604",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=[example_id]",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "REAC",
      "example_id" : "Reactome:REACT_604",
      "uri_prefix" : null,
      "database" : "Reactome - a curated knowledgebase of biological pathways",
      "local_id_syntax" : "REACT_[0-9]+",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.reactome.org/"
   },
   "ncbitaxon" : {
      "fullname" : null,
      "example_id" : "taxon:7227",
      "abbreviation" : "NCBITaxon",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "database" : "NCBI Taxonomy",
      "id" : null,
      "uri_prefix" : null
   },
   "aspgd_locus" : {
      "datatype" : null,
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?locus=AN10942",
      "fullname" : null,
      "example_id" : "AspGD_LOCUS:AN10942",
      "abbreviation" : "AspGD_LOCUS",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.aspergillusgenome.org/",
      "database" : "Aspergillus Genome Database",
      "id" : null
   },
   "pamgo" : {
      "datatype" : null,
      "url_example" : null,
      "fullname" : null,
      "abbreviation" : "PAMGO",
      "example_id" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://pamgo.vbi.vt.edu/",
      "database" : "Plant-Associated Microbe Gene Ontology Interest Group",
      "id" : null
   },
   "tc" : {
      "fullname" : null,
      "abbreviation" : "TC",
      "example_id" : "TC:9.A.4.1.1",
      "url_syntax" : "http://www.tcdb.org/tcdb/index.php?tc=[example_id]",
      "entity_type" : "PR:000000001 ! protein",
      "object" : null,
      "url_example" : "http://www.tcdb.org/tcdb/index.php?tc=9.A.4.1.1",
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://www.tcdb.org/",
      "id" : null,
      "database" : "Transport Protein Database",
      "uri_prefix" : null
   },
   "ptarget" : {
      "url_example" : null,
      "datatype" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : null,
      "abbreviation" : "pTARGET",
      "fullname" : null,
      "uri_prefix" : null,
      "database" : "pTARGET Prediction server for protein subcellular localization",
      "id" : null,
      "generic_url" : "http://bioinformatics.albany.edu/~ptarget/",
      "name" : null
   },
   "ecoliwiki" : {
      "generic_url" : "http://ecoliwiki.net/",
      "name" : null,
      "local_id_syntax" : "[A-Za-z]{3,4}",
      "description" : "EcoliHub\\'s subsystem for community annotation of E. coli K-12",
      "database" : "EcoliWiki from EcoliHub",
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "EcoliWiki",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "entity_type" : "SO:0000704 ! gene",
      "url_syntax" : null,
      "datatype" : null,
      "url_example" : null
   },
   "eurofung" : {
      "id" : null,
      "database" : "Eurofungbase community annotation",
      "generic_url" : "http://www.eurofung.net/option=com_content&task=section&id=3&Itemid=4",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "Eurofung",
      "example_id" : null,
      "fullname" : null,
      "datatype" : null,
      "url_example" : null
   },
   "um-bbd_ruleid" : {
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/rule.jsp?rule=[example_id]",
      "example_id" : "UM-BBD_ruleID:bt0330",
      "abbreviation" : "UM-BBD_ruleID",
      "fullname" : null,
      "datatype" : null,
      "url_example" : "http://umbbd.msi.umn.edu/servlets/rule.jsp?rule=bt0330",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "id" : null,
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "name" : null,
      "uri_prefix" : null
   },
   "smart" : {
      "abbreviation" : "SMART",
      "example_id" : "SMART:SM00005",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://smart.embl-heidelberg.de/smart/do_annotation.pl?BLAST=DUMMY&DOMAIN=[example_id]",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "datatype" : null,
      "url_example" : "http://smart.embl-heidelberg.de/smart/do_annotation.pl?BLAST=DUMMY&DOMAIN=SM00005",
      "generic_url" : "http://smart.embl-heidelberg.de/",
      "name" : null,
      "id" : null,
      "database" : "Simple Modular Architecture Research Tool",
      "uri_prefix" : null
   },
   "h-invdb_locus" : {
      "url_example" : "http://www.h-invitational.jp/hinv/spsoup/locus_view?hix_id=HIX0014446",
      "datatype" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.h-invitational.jp/hinv/spsoup/locus_view?hix_id=[example_id]",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "H-invDB_locus",
      "example_id" : "H-invDB_locus:HIX0014446",
      "uri_prefix" : null,
      "id" : null,
      "database" : "H-invitational Database",
      "name" : null,
      "generic_url" : "http://www.h-invitational.jp/"
   },
   "rnamods" : {
      "datatype" : null,
      "url_example" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?091",
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?[example_id]",
      "example_id" : "RNAmods:037",
      "abbreviation" : "RNAmods",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "RNA Modification Database",
      "generic_url" : "http://s59.cas.albany.edu/RNAmods/",
      "name" : null
   },
   "mgd" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.informatics.jax.org/",
      "name" : null,
      "database" : "Mouse Genome Database",
      "id" : null,
      "url_example" : null,
      "datatype" : null,
      "example_id" : "MGD:Adcy9",
      "abbreviation" : "MGD",
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity"
   },
   "omim" : {
      "datatype" : null,
      "url_example" : "http://omim.org/entry/190198",
      "example_id" : "OMIM:190198",
      "abbreviation" : "OMIM",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://omim.org/entry/[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=OMIM",
      "name" : null,
      "database" : "Mendelian Inheritance in Man",
      "id" : null
   },
   "zfin" : {
      "entity_type" : "VariO:0001 ! variation",
      "url_syntax" : "http://zfin.org/cgi-bin/ZFIN_jump?record=[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "ZFIN:ZDB-GENE-990415-103",
      "abbreviation" : "ZFIN",
      "datatype" : null,
      "url_example" : "http://zfin.org/cgi-bin/ZFIN_jump?record=ZDB-GENE-990415-103",
      "id" : null,
      "local_id_syntax" : "ZDB-(GENE|GENO|MRPHLNO)-[0-9]{6}-[0-9]+",
      "database" : "Zebrafish Information Network",
      "name" : null,
      "generic_url" : "http://zfin.org/",
      "uri_prefix" : null
   },
   "gr_protein" : {
      "abbreviation" : "GR_protein",
      "example_id" : "GR_PROTEIN:Q6VSV0",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.gramene.org/db/protein/protein_search?acc=[example_id]",
      "entity_type" : "PR:000000001 ! protein",
      "datatype" : null,
      "url_example" : "http://www.gramene.org/db/protein/protein_search?acc=Q6VSV0",
      "generic_url" : "http://www.gramene.org/",
      "name" : null,
      "id" : null,
      "database" : "Gramene",
      "local_id_syntax" : "[A-Z][0-9][A-Z0-9]{3}[0-9]",
      "uri_prefix" : null
   },
   "rnacentral" : {
      "fullname" : null,
      "example_id" : "RNAcentral:URS000047C79B_9606",
      "abbreviation" : "RNAcentral",
      "url_syntax" : "http://rnacentral.org/rna/[example_id]",
      "entity_type" : "CHEBI:33697 ! ribonucleic acid",
      "object" : null,
      "url_example" : "http://rnacentral.org/rna/URS000047C79B_9606",
      "datatype" : null,
      "name" : null,
      "generic_url" : "http://rnacentral.org",
      "local_id_syntax" : "URS[0-9A-F]{10}([_\\/][0-9]+){0,1}",
      "description" : "An international database of ncRNA sequences",
      "id" : null,
      "database" : "RNAcentral",
      "uri_prefix" : null
   },
   "biocyc" : {
      "datatype" : null,
      "url_example" : "http://biocyc.org/META/NEW-IMAGE?type=PATHWAY&object=PWY-5271",
      "example_id" : "BioCyc:PWY-5271",
      "abbreviation" : "BioCyc",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://biocyc.org/META/NEW-IMAGE?type=PATHWAY&object=[example_id]",
      "uri_prefix" : null,
      "generic_url" : "http://biocyc.org/",
      "name" : null,
      "id" : null,
      "database" : "BioCyc collection of metabolic pathway databases"
   },
   "dictybase" : {
      "name" : null,
      "generic_url" : "http://dictybase.org",
      "database" : "dictyBase",
      "id" : null,
      "local_id_syntax" : "DDB_G[0-9]{7}",
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "dictyBase:DDB_G0277859",
      "abbreviation" : "DictyBase",
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "object" : null,
      "url_example" : "http://dictybase.org/gene/DDB_G0277859",
      "datatype" : null
   },
   "ecocyc_ref" : {
      "url_example" : "http://biocyc.org/ECOLI/reference.html?type=CITATION-FRAME&object=COLISALII",
      "datatype" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://biocyc.org/ECOLI/reference.html?type=CITATION-FRAME&object=[example_id]",
      "object" : null,
      "fullname" : null,
      "example_id" : "EcoCyc_REF:COLISALII",
      "abbreviation" : "ECOCYC_REF",
      "uri_prefix" : null,
      "id" : null,
      "database" : "Encyclopedia of E. coli metabolism",
      "name" : null,
      "generic_url" : "http://ecocyc.org/"
   },
   "refseq" : {
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/RefSeq/",
      "local_id_syntax" : "(NC|AC|NG|NT|NW|NZ|NM|NR|XM|XR|NP|AP|XP|YP|ZP)_[0-9]+(\\.[0-9]+){0,1}",
      "id" : null,
      "database" : "RefSeq",
      "datatype" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=XP_001068954",
      "fullname" : null,
      "example_id" : "RefSeq:XP_001068954",
      "abbreviation" : "RefSeq",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "entity_type" : "PR:000000001 ! protein",
      "object" : null
   },
   "gdb" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.gdb.org/",
      "name" : null,
      "id" : null,
      "database" : "Human Genome Database",
      "url_example" : "http://www.gdb.org/gdb-bin/genera/accno?accessionNum=GDB:306600",
      "datatype" : null,
      "abbreviation" : "GDB",
      "example_id" : "GDB:306600",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.gdb.org/gdb-bin/genera/accno?accessionNum=GDB:[example_id]"
   },
   "pseudocap" : {
      "uri_prefix" : null,
      "database" : "Pseudomonas Genome Project",
      "id" : null,
      "generic_url" : "http://v2.pseudomonas.com/",
      "name" : null,
      "datatype" : null,
      "url_example" : "http://v2.pseudomonas.com/getAnnotation.do?locusID=PA4756",
      "object" : null,
      "url_syntax" : "http://v2.pseudomonas.com/getAnnotation.do?locusID=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "PseudoCAP:PA4756",
      "abbreviation" : "PseudoCAP",
      "fullname" : null
   },
   "iuphar_receptor" : {
      "datatype" : null,
      "url_example" : "http://www.iuphar-db.org/DATABASE/ObjectDisplayForward?objectId=56",
      "abbreviation" : "IUPHAR_RECEPTOR",
      "example_id" : "IUPHAR_RECEPTOR:2205",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.iuphar-db.org/DATABASE/ObjectDisplayForward?objectId=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "generic_url" : "http://www.iuphar.org/",
      "name" : null,
      "id" : null,
      "database" : "International Union of Pharmacology"
   },
   "patric" : {
      "object" : null,
      "url_syntax" : "http://patric.vbi.vt.edu/gene/overview.php?fid=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "PATRIC",
      "example_id" : "PATRIC:cds.000002.436951",
      "fullname" : null,
      "url_example" : "http://patric.vbi.vt.edu/gene/overview.php?fid=cds.000002.436951",
      "datatype" : null,
      "description" : "PathoSystems Resource Integration Center at the Virginia Bioinformatics Institute",
      "database" : "PathoSystems Resource Integration Center",
      "id" : null,
      "generic_url" : "http://patric.vbi.vt.edu",
      "name" : null,
      "uri_prefix" : null
   },
   "ensembl_transcriptid" : {
      "datatype" : null,
      "url_example" : "http://www.ensembl.org/id/ENST00000371959",
      "object" : null,
      "entity_type" : "SO:0000673 ! transcript",
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "abbreviation" : "ENSEMBL_TranscriptID",
      "example_id" : "ENSEMBL_TranscriptID:ENST00000371959",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "local_id_syntax" : "ENST[0-9]{9,16}",
      "database" : "Ensembl database of automatically annotated genomic data",
      "generic_url" : "http://www.ensembl.org/",
      "name" : null
   },
   "psi-mod" : {
      "datatype" : null,
      "url_example" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:00219",
      "url_syntax" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "example_id" : "MOD:00219",
      "abbreviation" : "PSI-MOD",
      "uri_prefix" : null,
      "id" : null,
      "database" : "Proteomics Standards Initiative protein modification ontology",
      "name" : null,
      "generic_url" : "http://psidev.sourceforge.net/mod/"
   },
   "go_ref" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.geneontology.org/",
      "name" : null,
      "local_id_syntax" : "\\d{7}",
      "database" : "Gene Ontology Database references",
      "id" : null,
      "datatype" : null,
      "url_example" : "http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:0000001",
      "abbreviation" : "GO_REF",
      "example_id" : "GO_REF:0000001",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:[example_id]"
   },
   "pfam" : {
      "datatype" : null,
      "url_example" : "http://www.sanger.ac.uk/cgi-bin/Pfam/getacc?PF00046",
      "fullname" : null,
      "abbreviation" : "Pfam",
      "example_id" : "Pfam:PF00046",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "url_syntax" : "http://www.sanger.ac.uk/cgi-bin/Pfam/getacc?[example_id]",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.sanger.ac.uk/Software/Pfam/",
      "id" : null,
      "local_id_syntax" : "PF[0-9]{5}",
      "description" : "Pfam is a collection of protein families represented by sequence alignments and hidden Markov models (HMMs)",
      "database" : "Pfam database of protein families"
   },
   "sgdid" : {
      "uri_prefix" : null,
      "local_id_syntax" : "S[0-9]{9}",
      "database" : "Saccharomyces Genome Database",
      "id" : null,
      "name" : null,
      "generic_url" : "http://www.yeastgenome.org/",
      "url_example" : "http://www.yeastgenome.org/locus/S000006169/overview",
      "datatype" : null,
      "url_syntax" : "http://www.yeastgenome.org/locus/[example_id]/overview",
      "entity_type" : "SO:0000704 ! gene",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "SGDID",
      "example_id" : "SGD:S000006169"
   },
   "refgenome" : {
      "database" : "GO Reference Genomes",
      "id" : null,
      "generic_url" : "http://www.geneontology.org/GO.refgenome.shtml",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "example_id" : null,
      "abbreviation" : "RefGenome",
      "fullname" : null,
      "datatype" : null,
      "url_example" : null
   },
   "nmpdr" : {
      "uri_prefix" : null,
      "database" : "National Microbial Pathogen Data Resource",
      "id" : null,
      "generic_url" : "http://www.nmpdr.org",
      "name" : null,
      "datatype" : null,
      "url_example" : "http://www.nmpdr.org/linkin.cgi?id=fig|306254.1.peg.183",
      "object" : null,
      "url_syntax" : "http://www.nmpdr.org/linkin.cgi?id=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "abbreviation" : "NMPDR",
      "example_id" : "NMPDR:fig|306254.1.peg.183",
      "fullname" : null
   },
   "mitre" : {
      "generic_url" : "http://www.mitre.org/",
      "name" : null,
      "database" : "The MITRE Corporation",
      "id" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "abbreviation" : "MITRE",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "url_example" : null,
      "datatype" : null
   },
   "fma" : {
      "datatype" : null,
      "url_example" : null,
      "example_id" : "FMA:61905",
      "abbreviation" : "FMA",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "uri_prefix" : null,
      "generic_url" : "http://sig.biostr.washington.edu/projects/fm/index.html",
      "name" : null,
      "database" : "Foundational Model of Anatomy",
      "id" : null
   },
   "nc-iubmb" : {
      "id" : null,
      "database" : "Nomenclature Committee of the International Union of Biochemistry and Molecular Biology",
      "name" : null,
      "generic_url" : "http://www.chem.qmw.ac.uk/iubmb/",
      "uri_prefix" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "example_id" : null,
      "abbreviation" : "NC-IUBMB",
      "datatype" : null,
      "url_example" : null
   },
   "tgd_locus" : {
      "id" : null,
      "database" : "Tetrahymena Genome Database",
      "name" : null,
      "generic_url" : "http://www.ciliate.org/",
      "uri_prefix" : null,
      "url_syntax" : "http://db.ciliate.org/cgi-bin/locus.pl?locus=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "TGD_LOCUS",
      "example_id" : "TGD_LOCUS:PDD1",
      "url_example" : "http://db.ciliate.org/cgi-bin/locus.pl?locus=PDD1",
      "datatype" : null
   },
   "ntnu_sb" : {
      "datatype" : null,
      "url_example" : null,
      "fullname" : null,
      "example_id" : null,
      "abbreviation" : "NTNU_SB",
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "object" : null,
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://www.ntnu.edu/nt/systemsbiology",
      "id" : null,
      "database" : "Norwegian University of Science and Technology, Systems Biology team"
   },
   "metacyc" : {
      "datatype" : null,
      "url_example" : "http://biocyc.org/META/NEW-IMAGE?type=NIL&object=GLUTDEG-PWY",
      "abbreviation" : "MetaCyc",
      "example_id" : "MetaCyc:GLUTDEG-PWY",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://biocyc.org/META/NEW-IMAGE?type=NIL&object=[example_id]",
      "uri_prefix" : null,
      "generic_url" : "http://metacyc.org/",
      "name" : null,
      "id" : null,
      "database" : "Metabolic Encyclopedia of metabolic and other pathways"
   },
   "fbbt" : {
      "datatype" : null,
      "url_example" : "http://flybase.org/cgi-bin/fbcvq.html?query=FBbt:00005177",
      "example_id" : "FBbt:00005177",
      "abbreviation" : "FBbt",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://flybase.org/cgi-bin/fbcvq.html?query=FBbt:[example_id]",
      "uri_prefix" : null,
      "generic_url" : "http://flybase.org/",
      "name" : null,
      "id" : null,
      "database" : "Drosophila gross anatomy"
   },
   "jcvi_ref" : {
      "abbreviation" : "JCVI_REF",
      "example_id" : "JCVI_REF:GO_ref",
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_example" : "http://cmr.jcvi.org/CMR/AnnotationSops.shtml",
      "datatype" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "name" : null,
      "id" : null,
      "database" : "J. Craig Venter Institute",
      "uri_prefix" : null
   },
   "nasc_code" : {
      "id" : null,
      "database" : "Nottingham Arabidopsis Stock Centre Seeds Database",
      "generic_url" : "http://arabidopsis.info",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "url_syntax" : "http://seeds.nottingham.ac.uk/NASC/stockatidb.lasso?code=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "NASC_code:N3371",
      "abbreviation" : "NASC_code",
      "fullname" : null,
      "url_example" : "http://seeds.nottingham.ac.uk/NASC/stockatidb.lasso?code=N3371",
      "datatype" : null
   },
   "ncbi_gene" : {
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "local_id_syntax" : "\\d+",
      "id" : null,
      "database" : "NCBI Gene",
      "uri_prefix" : null,
      "fullname" : null,
      "abbreviation" : "NCBI_Gene",
      "example_id" : "NCBI_Gene:4771",
      "entity_type" : "SO:0000704 ! gene",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "object" : null,
      "datatype" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771"
   },
   "geneid" : {
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "local_id_syntax" : "\\d+",
      "database" : "NCBI Gene",
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "abbreviation" : "GeneID",
      "example_id" : "NCBI_Gene:4771",
      "entity_type" : "SO:0000704 ! gene",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "object" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "datatype" : null
   },
   "cdd" : {
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=cdd",
      "database" : "Conserved Domain Database at NCBI",
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "CDD:34222",
      "abbreviation" : "CDD",
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid=[example_id]",
      "object" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid=34222",
      "datatype" : null
   },
   "imgt_ligm" : {
      "generic_url" : "http://imgt.cines.fr",
      "name" : null,
      "description" : "Database of immunoglobulins and T cell receptors from human and other vertebrates, with translation for fully annotated sequences.",
      "id" : null,
      "database" : "ImMunoGeneTics database covering immunoglobulins and T-cell receptors",
      "uri_prefix" : null,
      "example_id" : "IMGT_LIGM:U03895",
      "abbreviation" : "IMGT_LIGM",
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "datatype" : null,
      "url_example" : null
   },
   "ensemblplants/gramene" : {
      "name" : null,
      "generic_url" : "http://plants.ensembl.org/",
      "id" : null,
      "database" : "Ensembl Plants, the Ensembl Genomes database for accessing plant genome data",
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "EnsemblPlants:LOC_Os01g22954",
      "abbreviation" : "EnsemblPlants/Gramene",
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "entity_type" : "SO:0000704 ! gene",
      "object" : null,
      "url_example" : "http://www.ensemblgenomes.org/id/LOC_Os01g22954",
      "datatype" : null
   },
   "pirsf" : {
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://pir.georgetown.edu/cgi-bin/ipcSF?id=[example_id]",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "PIRSF",
      "example_id" : "PIRSF:SF002327",
      "url_example" : "http://pir.georgetown.edu/cgi-bin/ipcSF?id=SF002327",
      "datatype" : null,
      "database" : "PIR Superfamily Classification System",
      "id" : null,
      "name" : null,
      "generic_url" : "http://pir.georgetown.edu/pirsf/",
      "uri_prefix" : null
   },
   "uniprotkb" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.uniprot.org",
      "name" : null,
      "local_id_syntax" : "([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z]([0-9][A-Z][A-Z0-9]{2}){1,2}[0-9])((-[0-9]+)|:PRO_[0-9]{10}|:VAR_[0-9]{6}){0,1}",
      "database" : "Universal Protein Knowledgebase",
      "description" : "A central repository of protein sequence and function created by joining the information contained in Swiss-Prot, TrEMBL, and PIR database",
      "id" : null,
      "datatype" : null,
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "example_id" : "UniProtKB:P51587",
      "abbreviation" : "UniProtKB",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "entity_type" : "PR:000000001 ! protein"
   },
   "cgd_ref" : {
      "url_example" : "http://www.candidagenome.org/cgi-bin/reference/reference.pl?dbid=1490",
      "datatype" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "example_id" : "CGD_REF:1490",
      "abbreviation" : "CGD_REF",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "database" : "Candida Genome Database",
      "generic_url" : "http://www.candidagenome.org/",
      "name" : null
   },
   "broad_mgg" : {
      "uri_prefix" : null,
      "generic_url" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/Home.html",
      "name" : null,
      "description" : "Magnaporthe grisea Database at the Broad Institute",
      "database" : "Magnaporthe grisea Database",
      "id" : null,
      "datatype" : null,
      "url_example" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/GeneLocus.html?sp=SMGG_05132",
      "example_id" : "Broad_MGG:MGG_05132.5",
      "abbreviation" : "Broad_MGG",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/GeneLocus.html?sp=S[example_id]"
   },
   "muscletrait" : {
      "uri_prefix" : null,
      "name" : null,
      "generic_url" : "http://muscle.cribi.unipd.it/",
      "id" : null,
      "description" : "an integrated database of transcripts expressed in human skeletal muscle",
      "database" : "TRAnscript Integrated Table",
      "url_example" : null,
      "datatype" : null,
      "fullname" : null,
      "abbreviation" : "MuscleTRAIT",
      "example_id" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : null,
      "object" : null
   },
   "pombase" : {
      "datatype" : null,
      "url_example" : "http://www.pombase.org/spombe/result/SPBC11B10.09",
      "url_syntax" : "http://www.pombase.org/spombe/result/[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "PomBase",
      "example_id" : "PomBase:SPBC11B10.09",
      "uri_prefix" : null,
      "id" : null,
      "local_id_syntax" : "S\\w+(\\.)?\\w+(\\.)?",
      "database" : "PomBase",
      "name" : null,
      "generic_url" : "http://www.pombase.org/"
   },
   "tigr_cmr" : {
      "object" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=[example_id]",
      "entity_type" : "PR:000000001 ! protein",
      "abbreviation" : "TIGR_CMR",
      "example_id" : "JCVI_CMR:VCA0557",
      "fullname" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=VCA0557",
      "datatype" : null,
      "id" : null,
      "database" : "EGAD database at the J. Craig Venter Institute",
      "generic_url" : "http://cmr.jcvi.org/",
      "name" : null,
      "uri_prefix" : null
   },
   "roslin_institute" : {
      "datatype" : null,
      "url_example" : null,
      "example_id" : null,
      "abbreviation" : "Roslin_Institute",
      "fullname" : null,
      "object" : null,
      "url_syntax" : null,
      "entity_type" : "BET:0000000 ! entity",
      "uri_prefix" : null,
      "generic_url" : "http://www.roslin.ac.uk/",
      "name" : null,
      "database" : "Roslin Institute",
      "id" : null
   },
   "ncbi_gp" : {
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=protein&val=EAL72968",
      "datatype" : null,
      "object" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=protein&val=[example_id]",
      "entity_type" : "PR:000000001 ! protein",
      "abbreviation" : "NCBI_GP",
      "example_id" : "NCBI_GP:EAL72968",
      "fullname" : null,
      "uri_prefix" : null,
      "local_id_syntax" : "[A-Z]{3}[0-9]{5}(\\.[0-9]+)?",
      "id" : null,
      "database" : "NCBI GenPept",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "name" : null
   },
   "gb" : {
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=[example_id]",
      "entity_type" : "PR:000000001 ! protein",
      "object" : null,
      "fullname" : null,
      "abbreviation" : "GB",
      "example_id" : "GB:AA816246",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=AA816246",
      "datatype" : null,
      "database" : "GenBank",
      "description" : "The NIH genetic sequence database, an annotated collection of all publicly available DNA sequences.",
      "id" : null,
      "local_id_syntax" : "([A-Z]{2}[0-9]{6})|([A-Z]{1}[0-9]{5})",
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "uri_prefix" : null
   },
   "jcvi_medtr" : {
      "id" : null,
      "database" : "Medicago truncatula genome database at the J. Craig Venter Institute",
      "generic_url" : "http://medicago.jcvi.org/cgi-bin/medicago/overview.cgi",
      "name" : null,
      "uri_prefix" : null,
      "object" : null,
      "url_syntax" : "http://medicago.jcvi.org/cgi-bin/medicago/search/shared/ORF_infopage.cgi?orf=[example_id]",
      "entity_type" : "BET:0000000 ! entity",
      "example_id" : "JCVI_Medtr:Medtr5g024510",
      "abbreviation" : "JCVI_Medtr",
      "fullname" : null,
      "datatype" : null,
      "url_example" : "http://medicago.jcvi.org/cgi-bin/medicago/search/shared/ORF_infopage.cgi?orf=Medtr5g024510"
   },
   "genbank" : {
      "example_id" : "GB:AA816246",
      "abbreviation" : "GenBank",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=[example_id]",
      "entity_type" : "PR:000000001 ! protein",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=AA816246",
      "datatype" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "name" : null,
      "description" : "The NIH genetic sequence database, an annotated collection of all publicly available DNA sequences.",
      "local_id_syntax" : "([A-Z]{2}[0-9]{6})|([A-Z]{1}[0-9]{5})",
      "id" : null,
      "database" : "GenBank",
      "uri_prefix" : null
   },
   "ecogene" : {
      "datatype" : null,
      "url_example" : "http://www.ecogene.org/geneInfo.php?eg_id=EG10818",
      "abbreviation" : "ECOGENE",
      "example_id" : "ECOGENE:EG10818",
      "fullname" : null,
      "object" : null,
      "url_syntax" : "http://www.ecogene.org/geneInfo.php?eg_id=[example_id]",
      "entity_type" : "SO:0000704 ! gene",
      "uri_prefix" : null,
      "generic_url" : "http://www.ecogene.org/",
      "name" : null,
      "id" : null,
      "local_id_syntax" : "EG[0-9]{5}",
      "database" : "EcoGene Database of Escherichia coli Sequence and Function"
   },
   "gr" : {
      "abbreviation" : "GR",
      "example_id" : "GR:sd1",
      "fullname" : null,
      "object" : null,
      "entity_type" : "PR:000000001 ! protein",
      "url_syntax" : "http://www.gramene.org/db/searches/browser?search_type=All&RGN=on&query=[example_id]",
      "datatype" : null,
      "url_example" : "http://www.gramene.org/db/searches/browser?search_type=All&RGN=on&query=sd1",
      "generic_url" : "http://www.gramene.org/",
      "name" : null,
      "local_id_syntax" : "[A-Z][0-9][A-Z0-9]{3}[0-9]",
      "id" : null,
      "database" : "Gramene",
      "uri_prefix" : null
   },
   "kegg_reaction" : {
      "datatype" : null,
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?rn:R02328",
      "example_id" : "KEGG:R02328",
      "abbreviation" : "KEGG_REACTION",
      "fullname" : null,
      "object" : null,
      "entity_type" : "BET:0000000 ! entity",
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?rn:[example_id]",
      "uri_prefix" : null,
      "generic_url" : "http://www.genome.jp/kegg/reaction/",
      "name" : null,
      "database" : "KEGG Reaction Database",
      "local_id_syntax" : "R\\d+",
      "id" : null
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
