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
amigo.version.revision = "2.2.1";

/*
 * Variable: release
 *
 * Partial version for this library: release (date-like) information.
 */
amigo.version.release = "20140730";
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
   "annotation" : {
      "display_name" : "Annotations",
      "schema_generating" : "true",
      "fields" : [
         {
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "description" : "A unique (and internal) combination of bioentity and ontology class.",
            "id" : "id",
            "property" : [],
            "display_name" : "Acc",
            "transform" : [],
            "searchable" : "false"
         },
         {
            "id" : "source",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Source",
            "property" : [],
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "Database source."
         },
         {
            "display_name" : "Type class id",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "id" : "type",
            "description" : "Type class.",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "description" : "Date of assignment.",
            "type" : "string",
            "id" : "date",
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Date",
            "property" : []
         },
         {
            "id" : "assigned_by",
            "display_name" : "Assigned by",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "description" : "Annotations assigned by group.",
            "type" : "string"
         },
         {
            "description" : "Rational for redundancy of annotation.",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Redundant for",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "id" : "is_redundant_for"
         },
         {
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "description" : "Taxonomic group.",
            "id" : "taxon",
            "property" : [],
            "display_name" : "Taxon",
            "transform" : [],
            "searchable" : "false"
         },
         {
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "description" : "Taxonomic group and ancestral groups.",
            "type" : "string",
            "id" : "taxon_label",
            "property" : [],
            "display_name" : "Taxon",
            "searchable" : "true",
            "transform" : []
         },
         {
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true",
            "type" : "string",
            "description" : "Taxonomic group and ancestral groups.",
            "id" : "taxon_closure",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Taxon",
            "property" : []
         },
         {
            "id" : "taxon_closure_label",
            "property" : [],
            "display_name" : "Taxon",
            "searchable" : "true",
            "transform" : [],
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "description" : "Taxonomic group and ancestral groups.",
            "type" : "string"
         },
         {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "description" : "Secondary taxon.",
            "type" : "string",
            "id" : "secondary_taxon",
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Secondary taxon",
            "property" : []
         },
         {
            "id" : "secondary_taxon_label",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "Secondary taxon",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "description" : "Secondary taxon.",
            "type" : "string"
         },
         {
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "description" : "Secondary taxon closure.",
            "type" : "string",
            "id" : "secondary_taxon_closure",
            "display_name" : "Secondary taxon",
            "property" : [],
            "searchable" : "false",
            "transform" : []
         },
         {
            "description" : "Secondary taxon closure.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "Secondary taxon",
            "id" : "secondary_taxon_closure_label"
         },
         {
            "type" : "string",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "Involved in",
            "id" : "isa_partof_closure"
         },
         {
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "Involved in",
            "id" : "isa_partof_closure_label",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi"
         },
         {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "description" : "Annotations for this term or its children (over regulates).",
            "type" : "string",
            "id" : "regulates_closure",
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Inferred annotation",
            "property" : []
         },
         {
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "description" : "Annotations for this term or its children (over regulates).",
            "type" : "string",
            "id" : "regulates_closure_label",
            "display_name" : "Inferred annotation",
            "property" : [],
            "searchable" : "true",
            "transform" : []
         },
         {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "description" : "Closure of ids/accs over has_participant.",
            "type" : "string",
            "id" : "has_participant_closure",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "display_name" : "Has participant (IDs)"
         },
         {
            "display_name" : "Has participant",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "id" : "has_participant_closure_label",
            "description" : "Closure of labels over has_participant.",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false"
         },
         {
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "Synonym",
            "id" : "synonym",
            "type" : "string",
            "description" : "Gene or gene product synonyms.",
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true"
         },
         {
            "id" : "bioentity",
            "property" : [],
            "display_name" : "Gene/product",
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "description" : "Gene or gene product identifiers.",
            "type" : "string"
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "Gene or gene product identifiers.",
            "id" : "bioentity_label",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "display_name" : "Gene/product"
         },
         {
            "id" : "bioentity_name",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "display_name" : "Gene/product name",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "description" : "The full name of the gene or gene product."
         },
         {
            "id" : "bioentity_internal_id",
            "display_name" : "This should not be displayed",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "false",
            "cardinality" : "single",
            "required" : "false",
            "description" : "The bioentity ID used at the database of origin.",
            "type" : "string"
         },
         {
            "id" : "qualifier",
            "property" : [],
            "display_name" : "Qualifier",
            "transform" : [],
            "searchable" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "description" : "Annotation qualifier."
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "Direct annotations.",
            "id" : "annotation_class",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "Direct annotation"
         },
         {
            "id" : "annotation_class_label",
            "transform" : [],
            "searchable" : "true",
            "display_name" : "Direct annotation",
            "property" : [],
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "Direct annotations."
         },
         {
            "id" : "aspect",
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Ontology (aspect)",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "description" : "Ontology aspect.",
            "type" : "string"
         },
         {
            "type" : "string",
            "description" : "Biological isoform.",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "display_name" : "Isoform",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "id" : "bioentity_isoform"
         },
         {
            "description" : "Evidence type.",
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "display_name" : "Evidence",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "id" : "evidence_type"
         },
         {
            "description" : "All evidence (evidence closure) for this annotation",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "display_name" : "Evidence type",
            "id" : "evidence_type_closure"
         },
         {
            "id" : "evidence_with",
            "display_name" : "Evidence with",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "description" : "Evidence with/from."
         },
         {
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Database reference.",
            "type" : "string",
            "id" : "reference",
            "property" : [],
            "display_name" : "Reference",
            "searchable" : "false",
            "transform" : []
         },
         {
            "type" : "string",
            "description" : "Extension class for the annotation.",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "display_name" : "Annotation extension",
            "transform" : [],
            "searchable" : "false",
            "id" : "annotation_extension_class"
         },
         {
            "id" : "annotation_extension_class_label",
            "transform" : [],
            "searchable" : "true",
            "display_name" : "Annotation extension",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "description" : "Extension class for the annotation."
         },
         {
            "id" : "annotation_extension_class_closure",
            "property" : [],
            "display_name" : "Annotation extension",
            "transform" : [],
            "searchable" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "description" : "Extension class for the annotation."
         },
         {
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Extension class for the annotation.",
            "type" : "string",
            "id" : "annotation_extension_class_closure_label",
            "display_name" : "Annotation extension",
            "property" : [],
            "searchable" : "true",
            "transform" : []
         },
         {
            "type" : "string",
            "description" : "Extension class for the annotation (JSON).",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Annotation extension",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "id" : "annotation_extension_json"
         },
         {
            "id" : "panther_family",
            "searchable" : "true",
            "transform" : [],
            "display_name" : "PANTHER family",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "description" : "PANTHER families that are associated with this entity.",
            "type" : "string"
         },
         {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family_label",
            "transform" : [],
            "searchable" : "true",
            "display_name" : "PANTHER family",
            "property" : []
         }
      ],
      "result_weights" : "bioentity^7.0 bioentity_name^6.0 qualifier^5.0 annotation_class^4.7 annotation_extension_json^4.5 source^4.0 taxon^3.0 evidence_type^2.5 evidence_with^2.0 panther_family^1.5 bioentity_isoform^0.5 reference^0.25",
      "document_category" : "annotation",
      "weight" : "20",
      "id" : "annotation",
      "boost_weights" : "annotation_class^2.0 annotation_class_label^1.0 bioentity^2.0 bioentity_label^1.0 bioentity_name^1.0 annotation_extension_class^2.0 annotation_extension_class_label^1.0 reference^1.0 panther_family^1.0 panther_family_label^1.0 bioentity_isoform^1.0 regulates_closure^1.0 regulates_closure_label^1.0",
      "searchable_extension" : "_searchable",
      "filter_weights" : "source^7.0 assigned_by^6.5 aspect^6.25 evidence_type_closure^6.0 panther_family_label^5.5 qualifier^5.25 taxon_closure_label^5.0 annotation_class_label^4.5 regulates_closure_label^3.0 annotation_extension_class_closure_label^2.0",
      "_outfile" : "./metadata/ann-config.yaml",
      "fields_hash" : {
         "qualifier" : {
            "id" : "qualifier",
            "property" : [],
            "display_name" : "Qualifier",
            "transform" : [],
            "searchable" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "description" : "Annotation qualifier."
         },
         "date" : {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "description" : "Date of assignment.",
            "type" : "string",
            "id" : "date",
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Date",
            "property" : []
         },
         "secondary_taxon_closure" : {
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "description" : "Secondary taxon closure.",
            "type" : "string",
            "id" : "secondary_taxon_closure",
            "display_name" : "Secondary taxon",
            "property" : [],
            "searchable" : "false",
            "transform" : []
         },
         "taxon_label" : {
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "description" : "Taxonomic group and ancestral groups.",
            "type" : "string",
            "id" : "taxon_label",
            "property" : [],
            "display_name" : "Taxon",
            "searchable" : "true",
            "transform" : []
         },
         "assigned_by" : {
            "id" : "assigned_by",
            "display_name" : "Assigned by",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "description" : "Annotations assigned by group.",
            "type" : "string"
         },
         "has_participant_closure" : {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "description" : "Closure of ids/accs over has_participant.",
            "type" : "string",
            "id" : "has_participant_closure",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "display_name" : "Has participant (IDs)"
         },
         "has_participant_closure_label" : {
            "display_name" : "Has participant",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "id" : "has_participant_closure_label",
            "description" : "Closure of labels over has_participant.",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false"
         },
         "secondary_taxon_closure_label" : {
            "description" : "Secondary taxon closure.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "Secondary taxon",
            "id" : "secondary_taxon_closure_label"
         },
         "aspect" : {
            "id" : "aspect",
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Ontology (aspect)",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "description" : "Ontology aspect.",
            "type" : "string"
         },
         "synonym" : {
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "Synonym",
            "id" : "synonym",
            "type" : "string",
            "description" : "Gene or gene product synonyms.",
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true"
         },
         "evidence_type_closure" : {
            "description" : "All evidence (evidence closure) for this annotation",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "display_name" : "Evidence type",
            "id" : "evidence_type_closure"
         },
         "annotation_extension_class_label" : {
            "id" : "annotation_extension_class_label",
            "transform" : [],
            "searchable" : "true",
            "display_name" : "Annotation extension",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "description" : "Extension class for the annotation."
         },
         "type" : {
            "display_name" : "Type class id",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "id" : "type",
            "description" : "Type class.",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false"
         },
         "isa_partof_closure_label" : {
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "Involved in",
            "id" : "isa_partof_closure_label",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi"
         },
         "annotation_class_label" : {
            "id" : "annotation_class_label",
            "transform" : [],
            "searchable" : "true",
            "display_name" : "Direct annotation",
            "property" : [],
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "Direct annotations."
         },
         "is_redundant_for" : {
            "description" : "Rational for redundancy of annotation.",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Redundant for",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "id" : "is_redundant_for"
         },
         "evidence_with" : {
            "id" : "evidence_with",
            "display_name" : "Evidence with",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "description" : "Evidence with/from."
         },
         "bioentity_internal_id" : {
            "id" : "bioentity_internal_id",
            "display_name" : "This should not be displayed",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "false",
            "cardinality" : "single",
            "required" : "false",
            "description" : "The bioentity ID used at the database of origin.",
            "type" : "string"
         },
         "evidence_type" : {
            "description" : "Evidence type.",
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "display_name" : "Evidence",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "id" : "evidence_type"
         },
         "annotation_extension_json" : {
            "type" : "string",
            "description" : "Extension class for the annotation (JSON).",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Annotation extension",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "id" : "annotation_extension_json"
         },
         "regulates_closure_label" : {
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "description" : "Annotations for this term or its children (over regulates).",
            "type" : "string",
            "id" : "regulates_closure_label",
            "display_name" : "Inferred annotation",
            "property" : [],
            "searchable" : "true",
            "transform" : []
         },
         "id" : {
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "description" : "A unique (and internal) combination of bioentity and ontology class.",
            "id" : "id",
            "property" : [],
            "display_name" : "Acc",
            "transform" : [],
            "searchable" : "false"
         },
         "annotation_extension_class_closure_label" : {
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Extension class for the annotation.",
            "type" : "string",
            "id" : "annotation_extension_class_closure_label",
            "display_name" : "Annotation extension",
            "property" : [],
            "searchable" : "true",
            "transform" : []
         },
         "annotation_class" : {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "Direct annotations.",
            "id" : "annotation_class",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "Direct annotation"
         },
         "annotation_extension_class" : {
            "type" : "string",
            "description" : "Extension class for the annotation.",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "display_name" : "Annotation extension",
            "transform" : [],
            "searchable" : "false",
            "id" : "annotation_extension_class"
         },
         "taxon_closure_label" : {
            "id" : "taxon_closure_label",
            "property" : [],
            "display_name" : "Taxon",
            "searchable" : "true",
            "transform" : [],
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "description" : "Taxonomic group and ancestral groups.",
            "type" : "string"
         },
         "annotation_extension_class_closure" : {
            "id" : "annotation_extension_class_closure",
            "property" : [],
            "display_name" : "Annotation extension",
            "transform" : [],
            "searchable" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "description" : "Extension class for the annotation."
         },
         "secondary_taxon_label" : {
            "id" : "secondary_taxon_label",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "Secondary taxon",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "description" : "Secondary taxon.",
            "type" : "string"
         },
         "bioentity_isoform" : {
            "type" : "string",
            "description" : "Biological isoform.",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "display_name" : "Isoform",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "id" : "bioentity_isoform"
         },
         "reference" : {
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Database reference.",
            "type" : "string",
            "id" : "reference",
            "property" : [],
            "display_name" : "Reference",
            "searchable" : "false",
            "transform" : []
         },
         "panther_family" : {
            "id" : "panther_family",
            "searchable" : "true",
            "transform" : [],
            "display_name" : "PANTHER family",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "description" : "PANTHER families that are associated with this entity.",
            "type" : "string"
         },
         "bioentity_name" : {
            "id" : "bioentity_name",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "display_name" : "Gene/product name",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "description" : "The full name of the gene or gene product."
         },
         "isa_partof_closure" : {
            "type" : "string",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "Involved in",
            "id" : "isa_partof_closure"
         },
         "bioentity" : {
            "id" : "bioentity",
            "property" : [],
            "display_name" : "Gene/product",
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "description" : "Gene or gene product identifiers.",
            "type" : "string"
         },
         "taxon_closure" : {
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true",
            "type" : "string",
            "description" : "Taxonomic group and ancestral groups.",
            "id" : "taxon_closure",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Taxon",
            "property" : []
         },
         "taxon" : {
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "description" : "Taxonomic group.",
            "id" : "taxon",
            "property" : [],
            "display_name" : "Taxon",
            "transform" : [],
            "searchable" : "false"
         },
         "regulates_closure" : {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "description" : "Annotations for this term or its children (over regulates).",
            "type" : "string",
            "id" : "regulates_closure",
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Inferred annotation",
            "property" : []
         },
         "panther_family_label" : {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family_label",
            "transform" : [],
            "searchable" : "true",
            "display_name" : "PANTHER family",
            "property" : []
         },
         "secondary_taxon" : {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "description" : "Secondary taxon.",
            "type" : "string",
            "id" : "secondary_taxon",
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Secondary taxon",
            "property" : []
         },
         "bioentity_label" : {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "Gene or gene product identifiers.",
            "id" : "bioentity_label",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "display_name" : "Gene/product"
         },
         "source" : {
            "id" : "source",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Source",
            "property" : [],
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "Database source."
         }
      },
      "description" : "Associations between GO terms and genes or gene products.",
      "_strict" : 0,
      "_infile" : "./metadata/ann-config.yaml"
   },
   "ontology" : {
      "fields" : [
         {
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "description" : "Term identifier.",
            "id" : "id",
            "display_name" : "Acc",
            "property" : [
               "getIdentifier"
            ],
            "transform" : [],
            "searchable" : "false"
         },
         {
            "type" : "string",
            "description" : "Term identifier.",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "display_name" : "Term",
            "property" : [
               "getIdentifier"
            ],
            "transform" : [],
            "searchable" : "false",
            "id" : "annotation_class"
         },
         {
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "description" : "Identifier.",
            "type" : "string",
            "id" : "annotation_class_label",
            "display_name" : "Term",
            "property" : [
               "getLabel"
            ],
            "searchable" : "true",
            "transform" : []
         },
         {
            "property" : [
               "getDef"
            ],
            "display_name" : "Definition",
            "transform" : [],
            "searchable" : "true",
            "id" : "description",
            "type" : "string",
            "description" : "Term definition.",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "type" : "string",
            "description" : "Term namespace.",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "property" : [
               "getNamespace"
            ],
            "display_name" : "Ontology source",
            "transform" : [],
            "searchable" : "false",
            "id" : "source"
         },
         {
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "type" : "boolean",
            "description" : "Is the term obsolete?",
            "id" : "is_obsolete",
            "property" : [
               "getIsObsoleteBinaryString"
            ],
            "display_name" : "Obsoletion",
            "transform" : [],
            "searchable" : "false"
         },
         {
            "description" : "Term comment.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Comment",
            "property" : [
               "getComment"
            ],
            "id" : "comment"
         },
         {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "description" : "Term synonyms.",
            "id" : "synonym",
            "transform" : [],
            "searchable" : "true",
            "property" : [
               "getOBOSynonymStrings"
            ],
            "display_name" : "Synonyms"
         },
         {
            "searchable" : "false",
            "transform" : [],
            "property" : [
               "getAnnotationPropertyValues",
               "alt_id"
            ],
            "display_name" : "Alt ID",
            "id" : "alternate_id",
            "description" : "Alternate term identifier.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true"
         },
         {
            "id" : "replaced_by",
            "display_name" : "Replaced By",
            "property" : [
               "getAnnotationPropertyValues",
               "replaced_by"
            ],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "description" : "Term that replaces this term.",
            "type" : "string"
         },
         {
            "id" : "consider",
            "display_name" : "Consider",
            "property" : [
               "getAnnotationPropertyValues",
               "consider"
            ],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "description" : "Others terms you might want to look at.",
            "type" : "string"
         },
         {
            "type" : "string",
            "description" : "Special use collections of terms.",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Subset",
            "property" : [
               "getSubsets"
            ],
            "transform" : [],
            "searchable" : "false",
            "id" : "subset"
         },
         {
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Definition cross-reference.",
            "type" : "string",
            "id" : "definition_xref",
            "display_name" : "Def xref",
            "property" : [
               "getDefXref"
            ],
            "searchable" : "false",
            "transform" : []
         },
         {
            "type" : "string",
            "description" : "Database cross-reference.",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "DB xref",
            "property" : [
               "getXref"
            ],
            "id" : "database_xref"
         },
         {
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050"
            ],
            "display_name" : "Is-a/part-of",
            "transform" : [],
            "searchable" : "false",
            "id" : "isa_partof_closure",
            "type" : "string",
            "description" : "Ancestral terms (is_a/part_of).",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false"
         },
         {
            "display_name" : "Is-a/part-of",
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050"
            ],
            "transform" : [],
            "searchable" : "true",
            "id" : "isa_partof_closure_label",
            "type" : "string",
            "description" : "Ancestral terms (is_a/part_of).",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false"
         },
         {
            "id" : "regulates_closure",
            "transform" : [],
            "searchable" : "false",
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
            "display_name" : "Ancestor",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "description" : "Ancestral terms (regulates, occurs in, capable_of)."
         },
         {
            "display_name" : "Ancestor",
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
            "transform" : [],
            "searchable" : "true",
            "id" : "regulates_closure_label",
            "type" : "string",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false"
         },
         {
            "required" : "false",
            "indexed" : "false",
            "cardinality" : "single",
            "type" : "string",
            "description" : "JSON blob form of the local stepwise topology graph. Uses various relations (including regulates, occurs in, capable_of).",
            "id" : "topology_graph_json",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Topology graph (JSON)",
            "property" : [
               "getSegmentShuntGraphJSON",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ]
         },
         {
            "required" : "false",
            "indexed" : "false",
            "cardinality" : "single",
            "type" : "string",
            "description" : "JSON blob form of the local relation transitivity graph. Uses various relations (including regulates, occurs in, capable_of).",
            "id" : "regulates_transitivity_graph_json",
            "transform" : [],
            "searchable" : "false",
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
            "display_name" : "Regulates transitivity graph (JSON)"
         },
         {
            "description" : "Only in taxon.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "searchable" : "true",
            "transform" : [],
            "property" : [
               "getIdentifier"
            ],
            "display_name" : "Only in taxon",
            "id" : "only_in_taxon"
         },
         {
            "id" : "only_in_taxon_label",
            "property" : [
               "getLabel"
            ],
            "display_name" : "Only in taxon",
            "transform" : [],
            "searchable" : "true",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "description" : "Only in taxon label."
         },
         {
            "type" : "string",
            "description" : "Only in taxon closure.",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Only in taxon (IDs)",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "transform" : [],
            "searchable" : "false",
            "id" : "only_in_taxon_closure"
         },
         {
            "display_name" : "Only in taxon",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "transform" : [],
            "searchable" : "true",
            "id" : "only_in_taxon_closure_label",
            "type" : "string",
            "description" : "Only in taxon label closure.",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false"
         }
      ],
      "result_weights" : "annotation_class^8.0 description^6.0 source^4.0 synonym^3.0 alternate_id^2.0",
      "schema_generating" : "true",
      "display_name" : "Ontology",
      "boost_weights" : "annotation_class^3.0 annotation_class_label^5.5 description^1.0 comment^0.5 synonym^1.0 alternate_id^1.0 regulates_closure^1.0 regulates_closure_label^1.0",
      "filter_weights" : "source^4.0 subset^3.0 regulates_closure_label^1.0 is_obsolete^0.0",
      "searchable_extension" : "_searchable",
      "id" : "ontology",
      "weight" : "40",
      "document_category" : "ontology_class",
      "description" : "Ontology classes for GO.",
      "fields_hash" : {
         "synonym" : {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "description" : "Term synonyms.",
            "id" : "synonym",
            "transform" : [],
            "searchable" : "true",
            "property" : [
               "getOBOSynonymStrings"
            ],
            "display_name" : "Synonyms"
         },
         "replaced_by" : {
            "id" : "replaced_by",
            "display_name" : "Replaced By",
            "property" : [
               "getAnnotationPropertyValues",
               "replaced_by"
            ],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "description" : "Term that replaces this term.",
            "type" : "string"
         },
         "isa_partof_closure" : {
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050"
            ],
            "display_name" : "Is-a/part-of",
            "transform" : [],
            "searchable" : "false",
            "id" : "isa_partof_closure",
            "type" : "string",
            "description" : "Ancestral terms (is_a/part_of).",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false"
         },
         "alternate_id" : {
            "searchable" : "false",
            "transform" : [],
            "property" : [
               "getAnnotationPropertyValues",
               "alt_id"
            ],
            "display_name" : "Alt ID",
            "id" : "alternate_id",
            "description" : "Alternate term identifier.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true"
         },
         "topology_graph_json" : {
            "required" : "false",
            "indexed" : "false",
            "cardinality" : "single",
            "type" : "string",
            "description" : "JSON blob form of the local stepwise topology graph. Uses various relations (including regulates, occurs in, capable_of).",
            "id" : "topology_graph_json",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Topology graph (JSON)",
            "property" : [
               "getSegmentShuntGraphJSON",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ]
         },
         "subset" : {
            "type" : "string",
            "description" : "Special use collections of terms.",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Subset",
            "property" : [
               "getSubsets"
            ],
            "transform" : [],
            "searchable" : "false",
            "id" : "subset"
         },
         "is_obsolete" : {
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "type" : "boolean",
            "description" : "Is the term obsolete?",
            "id" : "is_obsolete",
            "property" : [
               "getIsObsoleteBinaryString"
            ],
            "display_name" : "Obsoletion",
            "transform" : [],
            "searchable" : "false"
         },
         "consider" : {
            "id" : "consider",
            "display_name" : "Consider",
            "property" : [
               "getAnnotationPropertyValues",
               "consider"
            ],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "description" : "Others terms you might want to look at.",
            "type" : "string"
         },
         "comment" : {
            "description" : "Term comment.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Comment",
            "property" : [
               "getComment"
            ],
            "id" : "comment"
         },
         "only_in_taxon_closure" : {
            "type" : "string",
            "description" : "Only in taxon closure.",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Only in taxon (IDs)",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "transform" : [],
            "searchable" : "false",
            "id" : "only_in_taxon_closure"
         },
         "definition_xref" : {
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Definition cross-reference.",
            "type" : "string",
            "id" : "definition_xref",
            "display_name" : "Def xref",
            "property" : [
               "getDefXref"
            ],
            "searchable" : "false",
            "transform" : []
         },
         "only_in_taxon_label" : {
            "id" : "only_in_taxon_label",
            "property" : [
               "getLabel"
            ],
            "display_name" : "Only in taxon",
            "transform" : [],
            "searchable" : "true",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "description" : "Only in taxon label."
         },
         "only_in_taxon_closure_label" : {
            "display_name" : "Only in taxon",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "transform" : [],
            "searchable" : "true",
            "id" : "only_in_taxon_closure_label",
            "type" : "string",
            "description" : "Only in taxon label closure.",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false"
         },
         "isa_partof_closure_label" : {
            "display_name" : "Is-a/part-of",
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050"
            ],
            "transform" : [],
            "searchable" : "true",
            "id" : "isa_partof_closure_label",
            "type" : "string",
            "description" : "Ancestral terms (is_a/part_of).",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false"
         },
         "annotation_class_label" : {
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "description" : "Identifier.",
            "type" : "string",
            "id" : "annotation_class_label",
            "display_name" : "Term",
            "property" : [
               "getLabel"
            ],
            "searchable" : "true",
            "transform" : []
         },
         "regulates_closure_label" : {
            "display_name" : "Ancestor",
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
            "transform" : [],
            "searchable" : "true",
            "id" : "regulates_closure_label",
            "type" : "string",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false"
         },
         "annotation_class" : {
            "type" : "string",
            "description" : "Term identifier.",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "display_name" : "Term",
            "property" : [
               "getIdentifier"
            ],
            "transform" : [],
            "searchable" : "false",
            "id" : "annotation_class"
         },
         "id" : {
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "description" : "Term identifier.",
            "id" : "id",
            "display_name" : "Acc",
            "property" : [
               "getIdentifier"
            ],
            "transform" : [],
            "searchable" : "false"
         },
         "database_xref" : {
            "type" : "string",
            "description" : "Database cross-reference.",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "DB xref",
            "property" : [
               "getXref"
            ],
            "id" : "database_xref"
         },
         "source" : {
            "type" : "string",
            "description" : "Term namespace.",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "property" : [
               "getNamespace"
            ],
            "display_name" : "Ontology source",
            "transform" : [],
            "searchable" : "false",
            "id" : "source"
         },
         "regulates_closure" : {
            "id" : "regulates_closure",
            "transform" : [],
            "searchable" : "false",
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
            "display_name" : "Ancestor",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "description" : "Ancestral terms (regulates, occurs in, capable_of)."
         },
         "description" : {
            "property" : [
               "getDef"
            ],
            "display_name" : "Definition",
            "transform" : [],
            "searchable" : "true",
            "id" : "description",
            "type" : "string",
            "description" : "Term definition.",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false"
         },
         "regulates_transitivity_graph_json" : {
            "required" : "false",
            "indexed" : "false",
            "cardinality" : "single",
            "type" : "string",
            "description" : "JSON blob form of the local relation transitivity graph. Uses various relations (including regulates, occurs in, capable_of).",
            "id" : "regulates_transitivity_graph_json",
            "transform" : [],
            "searchable" : "false",
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
            "display_name" : "Regulates transitivity graph (JSON)"
         },
         "only_in_taxon" : {
            "description" : "Only in taxon.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "searchable" : "true",
            "transform" : [],
            "property" : [
               "getIdentifier"
            ],
            "display_name" : "Only in taxon",
            "id" : "only_in_taxon"
         }
      },
      "_outfile" : "./metadata/ont-config.yaml",
      "_infile" : "./metadata/ont-config.yaml",
      "_strict" : 0
   },
   "bioentity" : {
      "_outfile" : "./metadata/bio-config.yaml",
      "description" : "Genes and gene products associated with GO terms.",
      "fields_hash" : {
         "taxon_label" : {
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Taxon",
            "property" : [],
            "id" : "taxon_label",
            "description" : "Taxonomic group",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true"
         },
         "panther_family" : {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "description" : "PANTHER families that are associated with this entity.",
            "type" : "string",
            "id" : "panther_family",
            "searchable" : "true",
            "transform" : [],
            "display_name" : "PANTHER family",
            "property" : []
         },
         "isa_partof_closure" : {
            "type" : "string",
            "description" : "Closure of ids/accs over isa and partof.",
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "Involved in",
            "id" : "isa_partof_closure"
         },
         "synonym" : {
            "description" : "Gene product synonyms.",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "display_name" : "Synonyms",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "id" : "synonym"
         },
         "bioentity_name" : {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "The full name of the gene product.",
            "id" : "bioentity_name",
            "transform" : [],
            "searchable" : "true",
            "display_name" : "Name",
            "property" : []
         },
         "annotation_class_list" : {
            "display_name" : "Direct annotation",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "id" : "annotation_class_list",
            "type" : "string",
            "description" : "Direct annotations.",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false"
         },
         "taxon_closure" : {
            "type" : "string",
            "description" : "Taxonomic group and ancestral groups.",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "display_name" : "Taxon",
            "transform" : [],
            "searchable" : "false",
            "id" : "taxon_closure"
         },
         "bioentity" : {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "description" : "Gene or gene product ID.",
            "id" : "bioentity",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Acc",
            "property" : []
         },
         "annotation_class_list_label" : {
            "display_name" : "Direct annotation",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "id" : "annotation_class_list_label",
            "type" : "string",
            "description" : "Direct annotations.",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false"
         },
         "phylo_graph_json" : {
            "id" : "phylo_graph_json",
            "display_name" : "This should not be displayed",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "indexed" : "false",
            "required" : "false",
            "description" : "JSON blob form of the phylogenic tree.",
            "type" : "string"
         },
         "regulates_closure" : {
            "type" : "string",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Inferred annotation",
            "property" : [],
            "id" : "regulates_closure"
         },
         "taxon" : {
            "id" : "taxon",
            "display_name" : "Taxon",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "description" : "Taxonomic group",
            "type" : "string"
         },
         "type" : {
            "type" : "string",
            "description" : "Type class.",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "display_name" : "Type",
            "transform" : [],
            "searchable" : "false",
            "id" : "type"
         },
         "id" : {
            "id" : "id",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "Acc",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "description" : "Gene of gene product ID."
         },
         "source" : {
            "id" : "source",
            "display_name" : "Source",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "description" : "Database source.",
            "type" : "string"
         },
         "database_xref" : {
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Database cross-reference.",
            "type" : "string",
            "id" : "database_xref",
            "property" : [],
            "display_name" : "DB xref",
            "searchable" : "false",
            "transform" : []
         },
         "taxon_closure_label" : {
            "id" : "taxon_closure_label",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "Taxon",
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true",
            "description" : "Taxonomic group and ancestral groups.",
            "type" : "string"
         },
         "panther_family_label" : {
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family_label",
            "display_name" : "PANTHER family",
            "property" : [],
            "transform" : [],
            "searchable" : "true"
         },
         "isa_partof_closure_label" : {
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "description" : "Closure of labels over isa and partof.",
            "id" : "isa_partof_closure_label",
            "property" : [],
            "display_name" : "Involved in",
            "transform" : [],
            "searchable" : "true"
         },
         "bioentity_label" : {
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "Label",
            "id" : "bioentity_label",
            "description" : "Symbol or name.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true"
         },
         "regulates_closure_label" : {
            "display_name" : "Inferred annotation",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "id" : "regulates_closure_label",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false"
         },
         "bioentity_internal_id" : {
            "cardinality" : "single",
            "indexed" : "false",
            "required" : "false",
            "type" : "string",
            "description" : "The bioentity ID used at the database of origin.",
            "id" : "bioentity_internal_id",
            "display_name" : "This should not be displayed",
            "property" : [],
            "transform" : [],
            "searchable" : "false"
         }
      },
      "_strict" : 0,
      "_infile" : "./metadata/bio-config.yaml",
      "display_name" : "Genes and gene products",
      "result_weights" : "bioentity^8.0 bioentity_name^7.0 taxon^6.0 panther_family^5.0 type^4.0 source^3.0 annotation_class_list^2.0 synonym^1.0",
      "fields" : [
         {
            "id" : "id",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "Acc",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "description" : "Gene of gene product ID."
         },
         {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "description" : "Gene or gene product ID.",
            "id" : "bioentity",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Acc",
            "property" : []
         },
         {
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "Label",
            "id" : "bioentity_label",
            "description" : "Symbol or name.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true"
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "The full name of the gene product.",
            "id" : "bioentity_name",
            "transform" : [],
            "searchable" : "true",
            "display_name" : "Name",
            "property" : []
         },
         {
            "cardinality" : "single",
            "indexed" : "false",
            "required" : "false",
            "type" : "string",
            "description" : "The bioentity ID used at the database of origin.",
            "id" : "bioentity_internal_id",
            "display_name" : "This should not be displayed",
            "property" : [],
            "transform" : [],
            "searchable" : "false"
         },
         {
            "type" : "string",
            "description" : "Type class.",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "display_name" : "Type",
            "transform" : [],
            "searchable" : "false",
            "id" : "type"
         },
         {
            "id" : "taxon",
            "display_name" : "Taxon",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "description" : "Taxonomic group",
            "type" : "string"
         },
         {
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Taxon",
            "property" : [],
            "id" : "taxon_label",
            "description" : "Taxonomic group",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true"
         },
         {
            "type" : "string",
            "description" : "Taxonomic group and ancestral groups.",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "display_name" : "Taxon",
            "transform" : [],
            "searchable" : "false",
            "id" : "taxon_closure"
         },
         {
            "id" : "taxon_closure_label",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "Taxon",
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true",
            "description" : "Taxonomic group and ancestral groups.",
            "type" : "string"
         },
         {
            "type" : "string",
            "description" : "Closure of ids/accs over isa and partof.",
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "Involved in",
            "id" : "isa_partof_closure"
         },
         {
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "type" : "string",
            "description" : "Closure of labels over isa and partof.",
            "id" : "isa_partof_closure_label",
            "property" : [],
            "display_name" : "Involved in",
            "transform" : [],
            "searchable" : "true"
         },
         {
            "type" : "string",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Inferred annotation",
            "property" : [],
            "id" : "regulates_closure"
         },
         {
            "display_name" : "Inferred annotation",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "id" : "regulates_closure_label",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false"
         },
         {
            "id" : "source",
            "display_name" : "Source",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "description" : "Database source.",
            "type" : "string"
         },
         {
            "display_name" : "Direct annotation",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "id" : "annotation_class_list",
            "type" : "string",
            "description" : "Direct annotations.",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false"
         },
         {
            "display_name" : "Direct annotation",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "id" : "annotation_class_list_label",
            "type" : "string",
            "description" : "Direct annotations.",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false"
         },
         {
            "description" : "Gene product synonyms.",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "display_name" : "Synonyms",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "id" : "synonym"
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "description" : "PANTHER families that are associated with this entity.",
            "type" : "string",
            "id" : "panther_family",
            "searchable" : "true",
            "transform" : [],
            "display_name" : "PANTHER family",
            "property" : []
         },
         {
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family_label",
            "display_name" : "PANTHER family",
            "property" : [],
            "transform" : [],
            "searchable" : "true"
         },
         {
            "id" : "phylo_graph_json",
            "display_name" : "This should not be displayed",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "indexed" : "false",
            "required" : "false",
            "description" : "JSON blob form of the phylogenic tree.",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Database cross-reference.",
            "type" : "string",
            "id" : "database_xref",
            "property" : [],
            "display_name" : "DB xref",
            "searchable" : "false",
            "transform" : []
         }
      ],
      "schema_generating" : "true",
      "id" : "bioentity",
      "weight" : "30",
      "document_category" : "bioentity",
      "searchable_extension" : "_searchable",
      "filter_weights" : "source^7.0 type^6.0 panther_family_label^5.0 annotation_class_list_label^3.5 taxon_closure_label^4.0 regulates_closure_label^2.0",
      "boost_weights" : "bioentity^2.0 bioentity_label^2.0 bioentity_name^1.0 bioentity_internal_id^1.0 synonym^1.0 isa_partof_closure_label^1.0 regulates_closure^1.0 regulates_closure_label^1.0 panther_family^1.0 panther_family_label^1.0 taxon_closure_label^1.0"
   },
   "family" : {
      "schema_generating" : "true",
      "fields" : [
         {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "Family ID.",
            "id" : "id",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "Acc"
         },
         {
            "searchable" : "true",
            "transform" : [],
            "display_name" : "PANTHER family",
            "property" : [],
            "id" : "panther_family",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single"
         },
         {
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "PANTHER family",
            "id" : "panther_family_label",
            "description" : "PANTHER families that are associated with this entity.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true"
         },
         {
            "description" : "JSON blob form of the phylogenic tree.",
            "type" : "string",
            "indexed" : "false",
            "cardinality" : "single",
            "required" : "false",
            "property" : [],
            "display_name" : "This should not be displayed",
            "searchable" : "false",
            "transform" : [],
            "id" : "phylo_graph_json"
         },
         {
            "id" : "bioentity_list",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Gene/products",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "description" : "Gene/products annotated with this protein family."
         },
         {
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Gene/products annotated with this protein family.",
            "type" : "string",
            "id" : "bioentity_list_label",
            "property" : [],
            "display_name" : "Gene/products",
            "searchable" : "false",
            "transform" : []
         }
      ],
      "result_weights" : "panther_family^5.0 bioentity_list^4.0",
      "display_name" : "Protein families",
      "boost_weights" : "panther_family^2.0 panther_family_label^2.0 bioentity_list^1.0 bioentity_list_label^1.0",
      "filter_weights" : "bioentity_list_label^1.0",
      "searchable_extension" : "_searchable",
      "document_category" : "family",
      "weight" : "5",
      "id" : "family",
      "fields_hash" : {
         "bioentity_list" : {
            "id" : "bioentity_list",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Gene/products",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "description" : "Gene/products annotated with this protein family."
         },
         "panther_family" : {
            "searchable" : "true",
            "transform" : [],
            "display_name" : "PANTHER family",
            "property" : [],
            "id" : "panther_family",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single"
         },
         "id" : {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "Family ID.",
            "id" : "id",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "Acc"
         },
         "panther_family_label" : {
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "PANTHER family",
            "id" : "panther_family_label",
            "description" : "PANTHER families that are associated with this entity.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true"
         },
         "bioentity_list_label" : {
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "Gene/products annotated with this protein family.",
            "type" : "string",
            "id" : "bioentity_list_label",
            "property" : [],
            "display_name" : "Gene/products",
            "searchable" : "false",
            "transform" : []
         },
         "phylo_graph_json" : {
            "description" : "JSON blob form of the phylogenic tree.",
            "type" : "string",
            "indexed" : "false",
            "cardinality" : "single",
            "required" : "false",
            "property" : [],
            "display_name" : "This should not be displayed",
            "searchable" : "false",
            "transform" : [],
            "id" : "phylo_graph_json"
         }
      },
      "description" : "Information about protein (PANTHER) families.",
      "_outfile" : "./metadata/protein-family-config.yaml",
      "_infile" : "./metadata/protein-family-config.yaml",
      "_strict" : 0
   },
   "general" : {
      "_strict" : 0,
      "_infile" : "./metadata/general-config.yaml",
      "_outfile" : "./metadata/general-config.yaml",
      "fields_hash" : {
         "category" : {
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "description" : "The document category that this enitity belongs to.",
            "id" : "category",
            "display_name" : "Document category",
            "property" : [],
            "transform" : [],
            "searchable" : "false"
         },
         "entity" : {
            "property" : [],
            "display_name" : "Entity",
            "transform" : [],
            "searchable" : "false",
            "id" : "entity",
            "type" : "string",
            "description" : "The ID/label for this entity.",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false"
         },
         "general_blob" : {
            "id" : "general_blob",
            "display_name" : "Generic blob",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "description" : "A hidden searchable blob document to access this item. It should contain all the goodies that we want to search for, like species(?), synonyms, etc."
         },
         "id" : {
            "id" : "id",
            "display_name" : "Internal ID",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "description" : "The mangled internal ID for this entity.",
            "type" : "string"
         },
         "entity_label" : {
            "id" : "entity_label",
            "transform" : [],
            "searchable" : "true",
            "display_name" : "Enity label",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "description" : "The label for this entity."
         }
      },
      "description" : "A generic search document to get a general overview of everything.",
      "document_category" : "general",
      "weight" : "0",
      "id" : "general",
      "filter_weights" : "category^4.0",
      "searchable_extension" : "_searchable",
      "boost_weights" : "entity^3.0 entity_label^3.0 general_blob^3.0",
      "display_name" : "General",
      "schema_generating" : "true",
      "result_weights" : "entity^3.0 category^1.0",
      "fields" : [
         {
            "id" : "id",
            "display_name" : "Internal ID",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "description" : "The mangled internal ID for this entity.",
            "type" : "string"
         },
         {
            "property" : [],
            "display_name" : "Entity",
            "transform" : [],
            "searchable" : "false",
            "id" : "entity",
            "type" : "string",
            "description" : "The ID/label for this entity.",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false"
         },
         {
            "id" : "entity_label",
            "transform" : [],
            "searchable" : "true",
            "display_name" : "Enity label",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "description" : "The label for this entity."
         },
         {
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "description" : "The document category that this enitity belongs to.",
            "id" : "category",
            "display_name" : "Document category",
            "property" : [],
            "transform" : [],
            "searchable" : "false"
         },
         {
            "id" : "general_blob",
            "display_name" : "Generic blob",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "description" : "A hidden searchable blob document to access this item. It should contain all the goodies that we want to search for, like species(?), synonyms, etc."
         }
      ]
   },
   "complex_annotation" : {
      "_infile" : "./metadata/complex-ann-config.yaml",
      "_strict" : 0,
      "description" : "An individual unit within LEGO. This is <strong>ALPHA</strong> software.",
      "fields_hash" : {
         "process_class_closure_label" : {
            "display_name" : "Process",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "id" : "process_class_closure_label",
            "description" : "???",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false"
         },
         "function_class_label" : {
            "id" : "function_class_label",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "display_name" : "Function",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "description" : "Common function name."
         },
         "taxon_label" : {
            "description" : "Taxon derived from GAF column 13 and ncbi_taxonomy.obo.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "Taxon",
            "id" : "taxon_label"
         },
         "enabled_by" : {
            "description" : "???",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Enabled by",
            "property" : [],
            "id" : "enabled_by"
         },
         "function_class" : {
            "description" : "Function acc/ID.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "display_name" : "Function",
            "id" : "function_class"
         },
         "process_class_label" : {
            "description" : "Common process name.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Process",
            "property" : [],
            "id" : "process_class_label"
         },
         "panther_family" : {
            "id" : "panther_family",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "PANTHER family",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "type" : "string"
         },
         "owl_blob_json" : {
            "id" : "owl_blob_json",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "???",
            "required" : "false",
            "indexed" : "false",
            "cardinality" : "single",
            "type" : "string",
            "description" : "???"
         },
         "location_list_label" : {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "description" : "",
            "type" : "string",
            "id" : "location_list_label",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "display_name" : "Location"
         },
         "taxon_closure" : {
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "description" : "Taxon IDs derived from GAF column 13 and ncbi_taxonomy.obo.",
            "type" : "string",
            "id" : "taxon_closure",
            "property" : [],
            "display_name" : "Taxon (IDs)",
            "searchable" : "false",
            "transform" : []
         },
         "process_class" : {
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "description" : "Process acc/ID.",
            "type" : "string",
            "id" : "process_class",
            "property" : [],
            "display_name" : "Process",
            "searchable" : "false",
            "transform" : []
         },
         "process_class_closure" : {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "description" : "???",
            "type" : "string",
            "id" : "process_class_closure",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "display_name" : "Process"
         },
         "enabled_by_label" : {
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Enabled by",
            "property" : [],
            "id" : "enabled_by_label",
            "description" : "???",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true"
         },
         "topology_graph_json" : {
            "required" : "false",
            "indexed" : "false",
            "cardinality" : "single",
            "description" : "JSON blob form of the local stepwise topology graph.",
            "type" : "string",
            "id" : "topology_graph_json",
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Topology graph (JSON)",
            "property" : []
         },
         "annotation_unit_label" : {
            "id" : "annotation_unit_label",
            "display_name" : "Annotation unit",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "description" : "???."
         },
         "location_list_closure_label" : {
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "",
            "type" : "string",
            "id" : "location_list_closure_label",
            "display_name" : "Location",
            "property" : [],
            "searchable" : "false",
            "transform" : []
         },
         "taxon" : {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "description" : "GAF column 13 (taxon).",
            "id" : "taxon",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "Taxon"
         },
         "location_list" : {
            "display_name" : "Location",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "id" : "location_list",
            "description" : "",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false"
         },
         "function_class_closure_label" : {
            "type" : "string",
            "description" : "???",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "true",
            "display_name" : "Function",
            "property" : [],
            "id" : "function_class_closure_label"
         },
         "annotation_group" : {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "description" : "???.",
            "type" : "string",
            "id" : "annotation_group",
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Annotation group",
            "property" : []
         },
         "location_list_closure" : {
            "id" : "location_list_closure",
            "display_name" : "Location",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "",
            "type" : "string"
         },
         "panther_family_label" : {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "description" : "PANTHER families that are associated with this entity.",
            "type" : "string",
            "id" : "panther_family_label",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "PANTHER family"
         },
         "annotation_unit" : {
            "description" : "???.",
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "display_name" : "Annotation unit",
            "searchable" : "false",
            "transform" : [],
            "id" : "annotation_unit"
         },
         "function_class_closure" : {
            "id" : "function_class_closure",
            "property" : [],
            "display_name" : "Function",
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "???",
            "type" : "string"
         },
         "id" : {
            "searchable" : "false",
            "transform" : [],
            "display_name" : "ID",
            "property" : [],
            "id" : "id",
            "description" : "A unique (and internal) thing.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single"
         },
         "taxon_closure_label" : {
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Taxon",
            "property" : [],
            "id" : "taxon_closure_label",
            "description" : "Taxon label closure derived from GAF column 13 and ncbi_taxonomy.obo.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true"
         },
         "annotation_group_label" : {
            "property" : [],
            "display_name" : "Annotation group",
            "searchable" : "true",
            "transform" : [],
            "id" : "annotation_group_label",
            "description" : "???.",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false"
         }
      },
      "_outfile" : "./metadata/complex-ann-config.yaml",
      "filter_weights" : "annotation_group_label^5.0 enabled_by_label^4.5 location_list_closure_label^4.0 process_class_closure_label^3.0 function_class_closure_label^2.0",
      "boost_weights" : "annotation_group_label^1.0 annotation_unit_label^1.0 enabled_by^1.0 enabled_by_label^1.0 location_list_closure^1.0 location_list_closure_label^1.0 process_class_closure_label^1.0 function_class_closure_label^1.0",
      "searchable_extension" : "_searchable",
      "id" : "complex_annotation",
      "document_category" : "complex_annotation",
      "weight" : "-5",
      "result_weights" : "function_class^5.0 enabled_by^4.0 location_list^3.0 process_class^2.0 annotation_group^1.0",
      "fields" : [
         {
            "searchable" : "false",
            "transform" : [],
            "display_name" : "ID",
            "property" : [],
            "id" : "id",
            "description" : "A unique (and internal) thing.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single"
         },
         {
            "description" : "???.",
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "display_name" : "Annotation unit",
            "searchable" : "false",
            "transform" : [],
            "id" : "annotation_unit"
         },
         {
            "id" : "annotation_unit_label",
            "display_name" : "Annotation unit",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "type" : "string",
            "description" : "???."
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "description" : "???.",
            "type" : "string",
            "id" : "annotation_group",
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Annotation group",
            "property" : []
         },
         {
            "property" : [],
            "display_name" : "Annotation group",
            "searchable" : "true",
            "transform" : [],
            "id" : "annotation_group_label",
            "description" : "???.",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "description" : "???",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Enabled by",
            "property" : [],
            "id" : "enabled_by"
         },
         {
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Enabled by",
            "property" : [],
            "id" : "enabled_by_label",
            "description" : "???",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true"
         },
         {
            "id" : "panther_family",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "PANTHER family",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "description" : "PANTHER family IDs that are associated with this entity.",
            "type" : "string"
         },
         {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "description" : "PANTHER families that are associated with this entity.",
            "type" : "string",
            "id" : "panther_family_label",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "PANTHER family"
         },
         {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "description" : "GAF column 13 (taxon).",
            "id" : "taxon",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "Taxon"
         },
         {
            "description" : "Taxon derived from GAF column 13 and ncbi_taxonomy.obo.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "searchable" : "true",
            "transform" : [],
            "property" : [],
            "display_name" : "Taxon",
            "id" : "taxon_label"
         },
         {
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "description" : "Taxon IDs derived from GAF column 13 and ncbi_taxonomy.obo.",
            "type" : "string",
            "id" : "taxon_closure",
            "property" : [],
            "display_name" : "Taxon (IDs)",
            "searchable" : "false",
            "transform" : []
         },
         {
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Taxon",
            "property" : [],
            "id" : "taxon_closure_label",
            "description" : "Taxon label closure derived from GAF column 13 and ncbi_taxonomy.obo.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true"
         },
         {
            "description" : "Function acc/ID.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "display_name" : "Function",
            "id" : "function_class"
         },
         {
            "id" : "function_class_label",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "display_name" : "Function",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "description" : "Common function name."
         },
         {
            "id" : "function_class_closure",
            "property" : [],
            "display_name" : "Function",
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "???",
            "type" : "string"
         },
         {
            "type" : "string",
            "description" : "???",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "transform" : [],
            "searchable" : "true",
            "display_name" : "Function",
            "property" : [],
            "id" : "function_class_closure_label"
         },
         {
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "description" : "Process acc/ID.",
            "type" : "string",
            "id" : "process_class",
            "property" : [],
            "display_name" : "Process",
            "searchable" : "false",
            "transform" : []
         },
         {
            "description" : "Common process name.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Process",
            "property" : [],
            "id" : "process_class_label"
         },
         {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "description" : "???",
            "type" : "string",
            "id" : "process_class_closure",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "display_name" : "Process"
         },
         {
            "display_name" : "Process",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "id" : "process_class_closure_label",
            "description" : "???",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false"
         },
         {
            "display_name" : "Location",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "id" : "location_list",
            "description" : "",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false"
         },
         {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "description" : "",
            "type" : "string",
            "id" : "location_list_label",
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "display_name" : "Location"
         },
         {
            "id" : "location_list_closure",
            "display_name" : "Location",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "",
            "type" : "string"
         },
         {
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "description" : "",
            "type" : "string",
            "id" : "location_list_closure_label",
            "display_name" : "Location",
            "property" : [],
            "searchable" : "false",
            "transform" : []
         },
         {
            "id" : "owl_blob_json",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "display_name" : "???",
            "required" : "false",
            "indexed" : "false",
            "cardinality" : "single",
            "type" : "string",
            "description" : "???"
         },
         {
            "required" : "false",
            "indexed" : "false",
            "cardinality" : "single",
            "description" : "JSON blob form of the local stepwise topology graph.",
            "type" : "string",
            "id" : "topology_graph_json",
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Topology graph (JSON)",
            "property" : []
         }
      ],
      "schema_generating" : "true",
      "display_name" : "Complex annotations (ALPHA)"
   },
   "bbop_term_ac" : {
      "_strict" : 0,
      "_infile" : "./metadata/term-autocomplete-config.yaml",
      "_outfile" : "./metadata/term-autocomplete-config.yaml",
      "fields_hash" : {
         "id" : {
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "display_name" : "Acc",
            "id" : "id",
            "description" : "Term acc/ID.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single"
         },
         "annotation_class" : {
            "display_name" : "Term",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "id" : "annotation_class",
            "description" : "Term acc/ID.",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false"
         },
         "alternate_id" : {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "description" : "Alternate term id.",
            "id" : "alternate_id",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Alt ID",
            "property" : []
         },
         "annotation_class_label" : {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "Common term name.",
            "id" : "annotation_class_label",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "display_name" : "Term"
         },
         "synonym" : {
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Synonyms",
            "property" : [],
            "id" : "synonym",
            "description" : "Term synonyms.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi"
         }
      },
      "description" : "Easily find ontology classes in GO. For personality only - not a schema configuration.",
      "weight" : "-20",
      "document_category" : "ontology_class",
      "id" : "bbop_term_ac",
      "searchable_extension" : "_searchable",
      "boost_weights" : "annotation_class^5.0 annotation_class_label^5.0 synonym^1.0 alternate_id^1.0",
      "filter_weights" : "annotation_class^8.0 synonym^3.0 alternate_id^2.0",
      "display_name" : "Term autocomplete",
      "schema_generating" : "false",
      "result_weights" : "annotation_class^8.0 synonym^3.0 alternate_id^2.0",
      "fields" : [
         {
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "display_name" : "Acc",
            "id" : "id",
            "description" : "Term acc/ID.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single"
         },
         {
            "display_name" : "Term",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "id" : "annotation_class",
            "description" : "Term acc/ID.",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "Common term name.",
            "id" : "annotation_class_label",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "display_name" : "Term"
         },
         {
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Synonyms",
            "property" : [],
            "id" : "synonym",
            "description" : "Term synonyms.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi"
         },
         {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "description" : "Alternate term id.",
            "id" : "alternate_id",
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Alt ID",
            "property" : []
         }
      ]
   },
   "bbop_ann_ev_agg" : {
      "searchable_extension" : "_searchable",
      "boost_weights" : "annotation_class^2.0 annotation_class_label^1.0 bioentity^2.0 bioentity_label^1.0 panther_family^1.0 panther_family_label^1.0 taxon_closure_label^1.0",
      "filter_weights" : "evidence_type_closure^4.0 evidence_with^3.0 taxon_closure_label^2.0",
      "id" : "bbop_ann_ev_agg",
      "document_category" : "annotation_evidence_aggregate",
      "weight" : "-10",
      "fields" : [
         {
            "property" : [],
            "display_name" : "Acc",
            "transform" : [],
            "searchable" : "false",
            "id" : "id",
            "type" : "string",
            "description" : "Gene/product ID.",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false"
         },
         {
            "type" : "string",
            "description" : "Column 1 + columns 2.",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "property" : [],
            "display_name" : "Gene/product ID",
            "transform" : [],
            "searchable" : "false",
            "id" : "bioentity"
         },
         {
            "description" : "Column 3.",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Gene/product label",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "id" : "bioentity_label"
         },
         {
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Annotation class",
            "property" : [],
            "id" : "annotation_class",
            "type" : "string",
            "description" : "Column 5.",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true"
         },
         {
            "display_name" : "Annotation class label",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "id" : "annotation_class_label",
            "type" : "string",
            "description" : "Column 5 + ontology.",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false"
         },
         {
            "description" : "All evidence for this term/gene product pair",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Evidence type",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "id" : "evidence_type_closure"
         },
         {
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "description" : "All column 8s for this term/gene product pair",
            "id" : "evidence_with",
            "property" : [],
            "display_name" : "Evidence with",
            "transform" : [],
            "searchable" : "false"
         },
         {
            "type" : "string",
            "description" : "Column 13: taxon.",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "display_name" : "Taxon",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "id" : "taxon"
         },
         {
            "description" : "Derived from C13 + ncbi_taxonomy.obo.",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "property" : [],
            "display_name" : "Taxon",
            "searchable" : "true",
            "transform" : [],
            "id" : "taxon_label"
         },
         {
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "display_name" : "Taxon (IDs)",
            "id" : "taxon_closure",
            "description" : "IDs derived from C13 + ncbi_taxonomy.obo.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true"
         },
         {
            "id" : "taxon_closure_label",
            "property" : [],
            "display_name" : "Taxon",
            "transform" : [],
            "searchable" : "true",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "description" : "Labels derived from C13 + ncbi_taxonomy.obo."
         },
         {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "Family IDs that are associated with this entity.",
            "id" : "panther_family",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "display_name" : "Protein family"
         },
         {
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Family",
            "property" : [],
            "id" : "panther_family_label",
            "description" : "Families that are associated with this entity.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single"
         }
      ],
      "result_weights" : "bioentity^4.0 annotation_class^3.0 taxon^2.0",
      "schema_generating" : "true",
      "display_name" : "Advanced",
      "_infile" : "./metadata/ann_ev_agg-config.yaml",
      "_strict" : 0,
      "description" : "A description of annotation evidence aggregate for GOlr and AmiGO.",
      "fields_hash" : {
         "annotation_class" : {
            "transform" : [],
            "searchable" : "false",
            "display_name" : "Annotation class",
            "property" : [],
            "id" : "annotation_class",
            "type" : "string",
            "description" : "Column 5.",
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true"
         },
         "id" : {
            "property" : [],
            "display_name" : "Acc",
            "transform" : [],
            "searchable" : "false",
            "id" : "id",
            "type" : "string",
            "description" : "Gene/product ID.",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false"
         },
         "taxon_closure_label" : {
            "id" : "taxon_closure_label",
            "property" : [],
            "display_name" : "Taxon",
            "transform" : [],
            "searchable" : "true",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "description" : "Labels derived from C13 + ncbi_taxonomy.obo."
         },
         "panther_family_label" : {
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Family",
            "property" : [],
            "id" : "panther_family_label",
            "description" : "Families that are associated with this entity.",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single"
         },
         "annotation_class_label" : {
            "display_name" : "Annotation class label",
            "property" : [],
            "transform" : [],
            "searchable" : "true",
            "id" : "annotation_class_label",
            "type" : "string",
            "description" : "Column 5 + ontology.",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false"
         },
         "taxon_closure" : {
            "searchable" : "false",
            "transform" : [],
            "property" : [],
            "display_name" : "Taxon (IDs)",
            "id" : "taxon_closure",
            "description" : "IDs derived from C13 + ncbi_taxonomy.obo.",
            "type" : "string",
            "required" : "false",
            "cardinality" : "multi",
            "indexed" : "true"
         },
         "bioentity_label" : {
            "description" : "Column 3.",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "display_name" : "Gene/product label",
            "property" : [],
            "searchable" : "true",
            "transform" : [],
            "id" : "bioentity_label"
         },
         "evidence_with" : {
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "description" : "All column 8s for this term/gene product pair",
            "id" : "evidence_with",
            "property" : [],
            "display_name" : "Evidence with",
            "transform" : [],
            "searchable" : "false"
         },
         "evidence_type_closure" : {
            "description" : "All evidence for this term/gene product pair",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "multi",
            "required" : "false",
            "display_name" : "Evidence type",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "id" : "evidence_type_closure"
         },
         "bioentity" : {
            "type" : "string",
            "description" : "Column 1 + columns 2.",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "property" : [],
            "display_name" : "Gene/product ID",
            "transform" : [],
            "searchable" : "false",
            "id" : "bioentity"
         },
         "taxon_label" : {
            "description" : "Derived from C13 + ncbi_taxonomy.obo.",
            "type" : "string",
            "indexed" : "true",
            "cardinality" : "single",
            "required" : "false",
            "property" : [],
            "display_name" : "Taxon",
            "searchable" : "true",
            "transform" : [],
            "id" : "taxon_label"
         },
         "panther_family" : {
            "required" : "false",
            "cardinality" : "single",
            "indexed" : "true",
            "type" : "string",
            "description" : "Family IDs that are associated with this entity.",
            "id" : "panther_family",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "display_name" : "Protein family"
         },
         "taxon" : {
            "type" : "string",
            "description" : "Column 13: taxon.",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "display_name" : "Taxon",
            "property" : [],
            "transform" : [],
            "searchable" : "false",
            "id" : "taxon"
         }
      },
      "_outfile" : "./metadata/ann_ev_agg-config.yaml"
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
    var meta_data = {"css_base":"http://localhost:9999/static/css","js_dev_base":"http://localhost:9999/static/staging","species_map":{},"ontologies":[],"beta":"1","html_base":"http://localhost:9999/static","galaxy_base":null,"gp_types":[],"golr_base":"http://localhost:8080/solr/","species":[],"sources":[],"app_base":"http://localhost:9999","image_base":"http://localhost:9999/static/images","evidence_codes":{},"bbop_img_star":"http://localhost:9999/static/images/star.png","term_regexp":"all|GO:[0-9]{7}","js_base":"http://localhost:9999/static/js"};

    ///
    /// Break out the data and various functions to access them...
    ///

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
   "prodom" : {
      "datatype" : null,
      "description" : "ProDom protein domain families automatically generated from UniProtKB",
      "database" : "ProDom protein domain families",
      "generic_url" : "http://prodom.prabi.fr/prodom/current/html/home.php",
      "example_id" : "ProDom:PD000001",
      "fullname" : null,
      "object" : "Accession",
      "uri_prefix" : null,
      "url_example" : "http://prodom.prabi.fr/prodom/current/cgi-bin/request.pl?question=DBEN&query=PD000001",
      "abbreviation" : "ProDom",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://prodom.prabi.fr/prodom/current/cgi-bin/request.pl?question=DBEN&query=[example_id]"
   },
   "genedb_pfalciparum" : {
      "uri_prefix" : null,
      "url_example" : "http://www.genedb.org/genedb/Search?organism=malaria&name=PFD0755c",
      "fullname" : null,
      "shorthand_name" : "Pfalciparum",
      "example_id" : "GeneDB_Pfalciparum:PFD0755c",
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=malaria&name=[example_id]",
      "id" : null,
      "abbreviation" : "GeneDB_Pfalciparum",
      "object" : "Gene identifier",
      "is_obsolete" : "true",
      "database" : "Plasmodium falciparum GeneDB",
      "generic_url" : "http://www.genedb.org/genedb/malaria/",
      "datatype" : null,
      "local_id_syntax" : "^SP[A-Z0-9]+\\.[A-Za-z0-9]+$",
      "name" : null,
      "replaced_by" : "GeneDB"
   },
   "iuphar" : {
      "name" : null,
      "abbreviation" : "IUPHAR",
      "url_syntax" : null,
      "id" : null,
      "database" : "International Union of Pharmacology",
      "generic_url" : "http://www.iuphar.org/",
      "example_id" : null,
      "datatype" : null,
      "object" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "fullname" : null
   },
   "ensembl_proteinid" : {
      "abbreviation" : "ENSEMBL_ProteinID",
      "name" : null,
      "local_id_syntax" : "^ENSP[0-9]{9,16}$",
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "id" : null,
      "datatype" : null,
      "generic_url" : "http://www.ensembl.org/",
      "database" : "Ensembl database of automatically annotated genomic data",
      "example_id" : "ENSEMBL_ProteinID:ENSP00000361027",
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "url_example" : "http://www.ensembl.org/id/ENSP00000361027",
      "uri_prefix" : null,
      "object" : "Protein identifier"
   },
   "ncbi_gp" : {
      "object" : "Protein identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=protein&val=EAL72968",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "database" : "NCBI GenPept",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "example_id" : "NCBI_GP:EAL72968",
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=protein&val=[example_id]",
      "id" : null,
      "local_id_syntax" : "^[A-Z]{3}[0-9]{5}(\\.[0-9]+)?$",
      "name" : null,
      "abbreviation" : "NCBI_GP"
   },
   "pro" : {
      "name" : null,
      "local_id_syntax" : "^[0-9]{9}$",
      "abbreviation" : "PRO",
      "url_syntax" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:[example_id]",
      "id" : null,
      "generic_url" : "http://www.proconsortium.org/pro/pro.shtml",
      "example_id" : "PR:000025380",
      "database" : "Protein Ontology",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:000025380",
      "object" : "Identifer",
      "entity_type" : "PR:000000001 ! protein ",
      "fullname" : null
   },
   "sgdid" : {
      "local_id_syntax" : "^S[0-9]{9}$",
      "name" : null,
      "abbreviation" : "SGDID",
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "id" : null,
      "database" : "Saccharomyces Genome Database",
      "example_id" : "SGD:S000006169",
      "generic_url" : "http://www.yeastgenome.org/",
      "datatype" : null,
      "object" : "Identifier for SGD Loci",
      "uri_prefix" : null,
      "url_example" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=S000006169",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene"
   },
   "fb" : {
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "url_example" : "http://flybase.org/reports/FBgn0000024.html",
      "uri_prefix" : null,
      "object" : "Identifier",
      "datatype" : null,
      "example_id" : "FB:FBgn0000024",
      "generic_url" : "http://flybase.org/",
      "database" : "FlyBase",
      "url_syntax" : "http://flybase.org/reports/[example_id].html",
      "id" : null,
      "abbreviation" : "FB",
      "name" : null,
      "local_id_syntax" : "^FBgn[0-9]{7}$"
   },
   "ecogene" : {
      "object" : "EcoGene accession",
      "url_example" : "http://www.ecogene.org/geneInfo.php?eg_id=EG10818",
      "uri_prefix" : null,
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "generic_url" : "http://www.ecogene.org/",
      "example_id" : "ECOGENE:EG10818",
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "datatype" : null,
      "url_syntax" : "http://www.ecogene.org/geneInfo.php?eg_id=[example_id]",
      "id" : null,
      "local_id_syntax" : "^EG[0-9]{5}$",
      "name" : null,
      "abbreviation" : "ECOGENE"
   },
   "swiss-prot" : {
      "description" : "A curated protein sequence database which provides a high level of annotation and a minimal level of redundancy",
      "datatype" : null,
      "generic_url" : "http://www.uniprot.org",
      "database" : "UniProtKB/Swiss-Prot",
      "example_id" : "Swiss-Prot:P51587",
      "is_obsolete" : "true",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "object" : "Accession",
      "abbreviation" : "Swiss-Prot",
      "name" : null,
      "replaced_by" : "UniProtKB",
      "id" : null,
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]"
   },
   "geo" : {
      "abbreviation" : "GEO",
      "name" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/GDSbrowser?acc=[example_id]",
      "id" : null,
      "datatype" : null,
      "database" : "NCBI Gene Expression Omnibus",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/geo/",
      "example_id" : "GEO:GDS2223",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/GDSbrowser?acc=GDS2223",
      "object" : null
   },
   "so" : {
      "url_syntax" : "http://song.sourceforge.net/SOterm_tables.html#SO:[example_id]",
      "id" : null,
      "abbreviation" : "SO",
      "name" : null,
      "local_id_syntax" : "^\\d{7}$",
      "entity_type" : "SO:0000110 ! sequence feature",
      "fullname" : null,
      "url_example" : "http://song.sourceforge.net/SOterm_tables.html#SO:0000195",
      "uri_prefix" : null,
      "object" : "Identifier",
      "datatype" : null,
      "example_id" : "SO:0000195",
      "generic_url" : "http://sequenceontology.org/",
      "database" : "Sequence Ontology"
   },
   "pmid" : {
      "database" : "PubMed",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/PubMed/",
      "example_id" : "PMID:4208797",
      "datatype" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/pubmed/4208797",
      "fullname" : null,
      "local_id_syntax" : "^[0-9]+$",
      "name" : null,
      "abbreviation" : "PMID",
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/pubmed/[example_id]"
   },
   "tigr_ath1" : {
      "fullname" : null,
      "object" : "Accession",
      "uri_prefix" : null,
      "url_example" : null,
      "datatype" : null,
      "is_obsolete" : "true",
      "example_id" : "JCVI_Ath1:At3g01440",
      "generic_url" : "http://www.tigr.org/tdb/e2k1/ath1/ath1.shtml",
      "database" : "Arabidopsis thaliana database at the J. Craig Venter Institute",
      "url_syntax" : null,
      "id" : null,
      "abbreviation" : "TIGR_Ath1",
      "name" : null
   },
   "unipathway" : {
      "url_syntax" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway/upa?upid=[example_id]",
      "id" : null,
      "abbreviation" : "UniPathway",
      "name" : null,
      "entity_type" : "GO:0008150 ! biological process",
      "fullname" : null,
      "url_example" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway/upa?upid=UPA00155",
      "uri_prefix" : null,
      "object" : "Identifier",
      "description" : "UniPathway is a a metabolic door to UniProtKB/Swiss-Prot, a curated resource of metabolic pathways for the UniProtKB/Swiss-Prot knowledgebase.",
      "datatype" : null,
      "example_id" : "UniPathway:UPA00155",
      "generic_url" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway",
      "database" : "UniPathway"
   },
   "modbase" : {
      "datatype" : null,
      "example_id" : "ModBase:P10815",
      "generic_url" : "http://modbase.compbio.ucsf.edu/ ",
      "database" : "ModBase comprehensive Database of Comparative Protein Structure Models",
      "fullname" : null,
      "object" : "Accession",
      "url_example" : "http://salilab.org/modbase/searchbyid?databaseID=P04848",
      "uri_prefix" : null,
      "abbreviation" : "ModBase",
      "name" : null,
      "url_syntax" : "http://salilab.org/modbase/searchbyid?databaseID=[example_id]",
      "id" : null
   },
   "eurofung" : {
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "generic_url" : "http://www.eurofung.net/option=com_content&task=section&id=3&Itemid=4",
      "database" : "Eurofungbase community annotation",
      "example_id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "id" : null,
      "name" : null,
      "abbreviation" : "Eurofung"
   },
   "parkinsonsuk-ucl" : {
      "datatype" : null,
      "generic_url" : "http://www.ucl.ac.uk/cardiovasculargeneontology",
      "example_id" : null,
      "database" : "Parkinsons Disease Gene Ontology Initiative",
      "fullname" : null,
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "abbreviation" : "ParkinsonsUK-UCL",
      "name" : null,
      "url_syntax" : null,
      "id" : null
   },
   "h-invdb_locus" : {
      "name" : null,
      "abbreviation" : "H-invDB_locus",
      "url_syntax" : "http://www.h-invitational.jp/hinv/spsoup/locus_view?hix_id=[example_id]",
      "id" : null,
      "database" : "H-invitational Database",
      "generic_url" : "http://www.h-invitational.jp/",
      "example_id" : "H-invDB_locus:HIX0014446",
      "datatype" : null,
      "url_example" : "http://www.h-invitational.jp/hinv/spsoup/locus_view?hix_id=HIX0014446",
      "uri_prefix" : null,
      "object" : "Cluster identifier",
      "fullname" : null
   },
   "ppi" : {
      "object" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "fullname" : null,
      "generic_url" : "http://genome.pseudomonas-syringae.org/",
      "database" : "Pseudomonas syringae community annotation project",
      "example_id" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "name" : null,
      "abbreviation" : "PPI"
   },
   "superfamily" : {
      "id" : null,
      "url_syntax" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/cgi-bin/scop.cgi?ipid=SSF[example_id]",
      "abbreviation" : "SUPERFAMILY",
      "name" : null,
      "fullname" : null,
      "url_example" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/cgi-bin/scop.cgi?ipid=SSF51905",
      "uri_prefix" : null,
      "object" : "Accession",
      "description" : "A database of structural and functional protein annotations for completely sequenced genomes",
      "datatype" : null,
      "example_id" : "SUPERFAMILY:51905",
      "generic_url" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/index.html",
      "database" : "SUPERFAMILY protein annotation database"
   },
   "merops_fam" : {
      "id" : null,
      "url_syntax" : "http://merops.sanger.ac.uk/cgi-bin/famsum?family=[example_id]",
      "name" : null,
      "abbreviation" : "MEROPS_fam",
      "object" : "Peptidase family identifier",
      "url_example" : "http://merops.sanger.ac.uk/cgi-bin/famsum?family=m18",
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "MEROPS_fam:M18",
      "generic_url" : "http://merops.sanger.ac.uk/",
      "database" : "MEROPS peptidase database",
      "datatype" : null
   },
   "patric" : {
      "url_syntax" : "http://patric.vbi.vt.edu/gene/overview.php?fid=[example_id]",
      "id" : null,
      "abbreviation" : "PATRIC",
      "name" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://patric.vbi.vt.edu/gene/overview.php?fid=cds.000002.436951",
      "object" : "Feature identifier",
      "description" : "PathoSystems Resource Integration Center at the Virginia Bioinformatics Institute",
      "datatype" : null,
      "example_id" : "PATRIC:cds.000002.436951",
      "generic_url" : "http://patric.vbi.vt.edu",
      "database" : "PathoSystems Resource Integration Center"
   },
   "hpa_antibody" : {
      "url_example" : "http://www.proteinatlas.org/antibody_info.php?antibody_id=HPA000237",
      "uri_prefix" : null,
      "object" : "Identifier",
      "fullname" : null,
      "generic_url" : "http://www.proteinatlas.org/",
      "database" : "Human Protein Atlas antibody information",
      "example_id" : "HPA_antibody:HPA000237",
      "datatype" : null,
      "url_syntax" : "http://www.proteinatlas.org/antibody_info.php?antibody_id=[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "HPA_antibody"
   },
   "nc-iubmb" : {
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "object" : null,
      "datatype" : null,
      "generic_url" : "http://www.chem.qmw.ac.uk/iubmb/",
      "database" : "Nomenclature Committee of the International Union of Biochemistry and Molecular Biology",
      "example_id" : null,
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "NC-IUBMB",
      "name" : null
   },
   "roslin_institute" : {
      "generic_url" : "http://www.roslin.ac.uk/",
      "database" : "Roslin Institute",
      "example_id" : null,
      "datatype" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null,
      "fullname" : null,
      "name" : null,
      "abbreviation" : "Roslin_Institute",
      "url_syntax" : null,
      "id" : null
   },
   "pir" : {
      "local_id_syntax" : "^[A-Z]{1}[0-9]{5}$",
      "name" : null,
      "abbreviation" : "PIR",
      "id" : null,
      "url_syntax" : "http://pir.georgetown.edu/cgi-bin/pirwww/nbrfget?uid=[example_id]",
      "generic_url" : "http://pir.georgetown.edu/",
      "example_id" : "PIR:I49499",
      "database" : "Protein Information Resource",
      "datatype" : null,
      "object" : "Accession",
      "url_example" : "http://pir.georgetown.edu/cgi-bin/pirwww/nbrfget?uid=I49499",
      "uri_prefix" : null,
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein"
   },
   "ptarget" : {
      "datatype" : null,
      "generic_url" : "http://bioinformatics.albany.edu/~ptarget/",
      "example_id" : null,
      "database" : "pTARGET Prediction server for protein subcellular localization",
      "fullname" : null,
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "abbreviation" : "pTARGET",
      "name" : null,
      "id" : null,
      "url_syntax" : null
   },
   "gr_qtl" : {
      "name" : null,
      "abbreviation" : "GR_QTL",
      "id" : null,
      "url_syntax" : "http://www.gramene.org/db/qtl/qtl_display?qtl_accession_id=[example_id]",
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "example_id" : "GR_QTL:CQU7",
      "generic_url" : "http://www.gramene.org/",
      "database" : null,
      "datatype" : null,
      "object" : "QTL identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.gramene.org/db/qtl/qtl_display?qtl_accession_id=CQU7",
      "fullname" : null
   },
   "go_central" : {
      "url_syntax" : null,
      "id" : null,
      "abbreviation" : "GO_Central",
      "name" : null,
      "fullname" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null,
      "description" : "Manual annotation from PAINT curators into the UniProt Protein2GO curation tool.",
      "datatype" : null,
      "database" : "GO Central",
      "generic_url" : "http://www.geneontology.org/GO.refgenome.shtml",
      "example_id" : null
   },
   "jcvi_medtr" : {
      "url_syntax" : "http://medicago.jcvi.org/cgi-bin/medicago/search/shared/ORF_infopage.cgi?orf=[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "JCVI_Medtr",
      "object" : "Accession",
      "uri_prefix" : null,
      "url_example" : "http://medicago.jcvi.org/cgi-bin/medicago/search/shared/ORF_infopage.cgi?orf=Medtr5g024510",
      "fullname" : null,
      "example_id" : "JCVI_Medtr:Medtr5g024510",
      "generic_url" : "http://medicago.jcvi.org/cgi-bin/medicago/overview.cgi",
      "database" : "Medicago truncatula genome database at the J. Craig Venter Institute ",
      "datatype" : null
   },
   "genedb" : {
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "object" : "Identifier",
      "url_example" : "http://www.genedb.org/gene/PF3D7_1467300",
      "uri_prefix" : null,
      "datatype" : null,
      "database" : "GeneDB",
      "generic_url" : "http://www.genedb.org/gene/",
      "example_id" : "PF3D7_1467300",
      "url_syntax" : "http://www.genedb.org/gene/[example_id]",
      "id" : null,
      "abbreviation" : "GeneDB",
      "local_id_syntax" : "^Tb\\d+\\.[A-Za-z0-9]+\\.\\d+$",
      "name" : null
   },
   "mtbbase" : {
      "abbreviation" : "MTBBASE",
      "name" : null,
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "database" : "Collection and Refinement of Physiological Data on Mycobacterium tuberculosis",
      "generic_url" : "http://www.ark.in-berlin.de/Site/MTBbase.html",
      "example_id" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "object" : null
   },
   "ensembl" : {
      "fullname" : null,
      "entity_type" : "SO:0000673 ! transcript",
      "object" : "Identifier (unspecified)",
      "uri_prefix" : null,
      "url_example" : "http://www.ensembl.org/id/ENSP00000265949",
      "datatype" : null,
      "generic_url" : "http://www.ensembl.org/",
      "database" : "Ensembl database of automatically annotated genomic data",
      "example_id" : "ENSEMBL:ENSP00000265949",
      "id" : null,
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "abbreviation" : "Ensembl",
      "local_id_syntax" : "^ENS[A-Z0-9]{10,17}$",
      "name" : null
   },
   "trembl" : {
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "id" : null,
      "replaced_by" : "UniProtKB",
      "name" : null,
      "abbreviation" : "TrEMBL",
      "url_example" : "http://www.uniprot.org/uniprot/O31124",
      "uri_prefix" : null,
      "object" : "Accession",
      "fullname" : null,
      "generic_url" : "http://www.uniprot.org",
      "database" : "UniProtKB-TrEMBL protein sequence database",
      "example_id" : "TrEMBL:O31124",
      "is_obsolete" : "true",
      "description" : "UniProtKB-TrEMBL, a computer-annotated protein sequence database supplementing UniProtKB and containing the translations of all coding sequences (CDS) present in the EMBL Nucleotide Sequence Database but not yet integrated in UniProtKB/Swiss-Prot",
      "datatype" : null
   },
   "wbphenotype" : {
      "database" : "WormBase phenotype ontology",
      "generic_url" : "http://www.wormbase.org/",
      "example_id" : "WBPhenotype:0002117",
      "datatype" : null,
      "url_example" : "http://www.wormbase.org/species/c_elegans/phenotype/WBPhenotype:0000154",
      "uri_prefix" : null,
      "object" : "Gene identifier",
      "entity_type" : "PATO:0000001 ! Quality",
      "fullname" : null,
      "name" : null,
      "local_id_syntax" : "^[0-9]{7}$",
      "abbreviation" : "WBPhenotype",
      "id" : null,
      "url_syntax" : "http://www.wormbase.org/species/c_elegans/phenotype/WBPhenotype:[example_id]"
   },
   "cgen" : {
      "fullname" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : null,
      "datatype" : null,
      "database" : "Compugen Gene Ontology Gene Association Data",
      "generic_url" : "http://www.cgen.com/",
      "example_id" : "CGEN:PrID131022",
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "CGEN",
      "name" : null
   },
   "pfamb" : {
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "Accession",
      "fullname" : null,
      "generic_url" : "http://www.sanger.ac.uk/Software/Pfam/",
      "database" : "Pfam-B supplement to Pfam",
      "example_id" : "PfamB:PB014624",
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "name" : null,
      "abbreviation" : "PfamB"
   },
   "pr" : {
      "object" : "Identifer",
      "uri_prefix" : null,
      "url_example" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:000025380",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein ",
      "generic_url" : "http://www.proconsortium.org/pro/pro.shtml",
      "example_id" : "PR:000025380",
      "database" : "Protein Ontology",
      "datatype" : null,
      "url_syntax" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:[example_id]",
      "id" : null,
      "local_id_syntax" : "^[0-9]{9}$",
      "name" : null,
      "abbreviation" : "PR"
   },
   "nif_subcellular" : {
      "abbreviation" : "NIF_Subcellular",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://www.neurolex.org/wiki/[example_id]",
      "datatype" : null,
      "generic_url" : "http://www.neurolex.org/wiki",
      "example_id" : "NIF_Subcellular:sao1186862860",
      "database" : "Neuroscience Information Framework standard ontology, subcellular hierarchy",
      "fullname" : null,
      "object" : "ontology term",
      "uri_prefix" : null,
      "url_example" : "http://www.neurolex.org/wiki/sao1770195789"
   },
   "um-bbd_pathwayid" : {
      "abbreviation" : "UM-BBD_pathwayID",
      "name" : null,
      "url_syntax" : "http://umbbd.msi.umn.edu/[example_id]/[example_id]_map.html",
      "id" : null,
      "datatype" : null,
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "example_id" : "UM-BBD_pathwayID:acr",
      "fullname" : null,
      "object" : "Pathway identifier",
      "url_example" : "http://umbbd.msi.umn.edu/acr/acr_map.html",
      "uri_prefix" : null
   },
   "muscletrait" : {
      "id" : null,
      "url_syntax" : null,
      "name" : null,
      "abbreviation" : "MuscleTRAIT",
      "uri_prefix" : null,
      "url_example" : null,
      "object" : null,
      "fullname" : null,
      "generic_url" : "http://muscle.cribi.unipd.it/",
      "example_id" : null,
      "database" : "TRAnscript Integrated Table",
      "description" : "an integrated database of transcripts expressed in human skeletal muscle",
      "datatype" : null
   },
   "pubchem_substance" : {
      "datatype" : null,
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "example_id" : "PubChem_Substance:4594",
      "database" : "NCBI PubChem database of chemical substances",
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pcsubstance&term=4594",
      "object" : "Identifier",
      "abbreviation" : "PubChem_Substance",
      "name" : null,
      "local_id_syntax" : "^[0-9]{4,}$",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pcsubstance&term=[example_id]",
      "id" : null
   },
   "sgd_locus" : {
      "generic_url" : "http://www.yeastgenome.org/",
      "example_id" : "SGD_LOCUS:GAL4",
      "database" : "Saccharomyces Genome Database",
      "datatype" : null,
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "uri_prefix" : null,
      "url_example" : "http://db.yeastgenome.org/cgi-bin/locus.pl?locus=GAL4",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "SGD_LOCUS",
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "id" : null
   },
   "agricola_ind" : {
      "database" : "AGRICultural OnLine Access",
      "generic_url" : "http://agricola.nal.usda.gov/",
      "example_id" : "AGRICOLA_IND:IND23252955",
      "datatype" : null,
      "object" : "AGRICOLA IND number",
      "uri_prefix" : null,
      "url_example" : null,
      "fullname" : null,
      "name" : null,
      "abbreviation" : "AGRICOLA_IND",
      "id" : null,
      "url_syntax" : null
   },
   "kegg" : {
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "identifier",
      "fullname" : null,
      "generic_url" : "http://www.genome.ad.jp/kegg/",
      "example_id" : null,
      "database" : "Kyoto Encyclopedia of Genes and Genomes",
      "datatype" : null,
      "url_syntax" : null,
      "id" : null,
      "name" : null,
      "abbreviation" : "KEGG"
   },
   "jcvi" : {
      "abbreviation" : "JCVI",
      "name" : null,
      "id" : null,
      "url_syntax" : null,
      "datatype" : null,
      "database" : "J. Craig Venter Institute",
      "generic_url" : "http://www.jcvi.org/",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "uri_prefix" : null,
      "url_example" : null
   },
   "mim" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=OMIM",
      "database" : "Mendelian Inheritance in Man",
      "example_id" : "OMIM:190198",
      "datatype" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://omim.org/entry/190198",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "MIM",
      "id" : null,
      "url_syntax" : "http://omim.org/entry/[example_id]"
   },
   "ec" : {
      "url_syntax" : "http://www.expasy.org/enzyme/[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "EC",
      "object" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.expasy.org/enzyme/1.4.3.6",
      "fullname" : null,
      "entity_type" : "GO:0003824 ! catalytic activity",
      "! url_example" : "http://www.chem.qmw.ac.uk/iubmb/enzyme/EC1/4/3/6.html",
      "generic_url" : "http://www.chem.qmul.ac.uk/iubmb/enzyme/",
      "database" : "Enzyme Commission",
      "example_id" : "EC:1.4.3.6",
      "datatype" : null
   },
   "gdb" : {
      "generic_url" : "http://www.gdb.org/",
      "database" : "Human Genome Database",
      "example_id" : "GDB:306600",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.gdb.org/gdb-bin/genera/accno?accessionNum=GDB:306600",
      "object" : "Accession",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "GDB",
      "id" : null,
      "url_syntax" : "http://www.gdb.org/gdb-bin/genera/accno?accessionNum=GDB:[example_id]"
   },
   "refseq_prot" : {
      "datatype" : null,
      "is_obsolete" : "true",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/RefSeq/",
      "example_id" : "RefSeq_Prot:YP_498627",
      "database" : "RefSeq (Protein)",
      "fullname" : null,
      "object" : "Identifier",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=YP_498627",
      "uri_prefix" : null,
      "abbreviation" : "RefSeq_Prot",
      "name" : null,
      "replaced_by" : "RefSeq",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "id" : null
   },
   "gorel" : {
      "abbreviation" : "GOREL",
      "name" : null,
      "url_syntax" : null,
      "id" : null,
      "description" : "Additional relations pending addition into RO",
      "datatype" : null,
      "example_id" : null,
      "generic_url" : "http://purl.obolibrary.org/obo/ro",
      "database" : "GO Extensions to OBO Relation Ontology Ontology",
      "fullname" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "ena" : {
      "abbreviation" : "ENA",
      "name" : null,
      "local_id_syntax" : "^([A-Z]{1}[0-9]{5})|([A-Z]{2}[0-9]{6})|([A-Z]{4}[0-9]{8,9})$",
      "url_syntax" : "http://www.ebi.ac.uk/ena/data/view/[example_id]",
      "id" : null,
      "description" : "ENA is made up of a number of distinct databases that includes EMBL-Bank, the newly established Sequence Read Archive (SRA) and the Trace Archive. International nucleotide sequence database collaboration, comprising ENA-EBI nucleotide sequence data library (EMBL-Bank), DNA DataBank of Japan (DDBJ), and NCBI GenBank",
      "datatype" : null,
      "generic_url" : "http://www.ebi.ac.uk/ena/",
      "example_id" : "ENA:AA816246",
      "database" : "European Nucleotide Archive",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.ebi.ac.uk/ena/data/view/AA816246",
      "object" : "Sequence accession"
   },
   "psort" : {
      "name" : null,
      "abbreviation" : "PSORT",
      "id" : null,
      "url_syntax" : null,
      "example_id" : null,
      "generic_url" : "http://www.psort.org/",
      "database" : "PSORT protein subcellular localization databases and prediction tools for bacteria",
      "datatype" : null,
      "object" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "fullname" : null
   },
   "cgd_locus" : {
      "datatype" : null,
      "example_id" : "CGD_LOCUS:HWP1",
      "generic_url" : "http://www.candidagenome.org/",
      "database" : "Candida Genome Database",
      "fullname" : null,
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "uri_prefix" : null,
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?locus=HWP1",
      "abbreviation" : "CGD_LOCUS",
      "name" : null,
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "id" : null
   },
   "tigr" : {
      "datatype" : null,
      "example_id" : null,
      "database" : "J. Craig Venter Institute",
      "generic_url" : "http://www.jcvi.org/",
      "fullname" : null,
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "abbreviation" : "TIGR",
      "name" : null,
      "url_syntax" : null,
      "id" : null
   },
   "wormpep" : {
      "is_obsolete" : "true",
      "generic_url" : "http://www.wormbase.org/",
      "database" : "Wormpep database of proteins of C. elegans",
      "example_id" : "WP:CE25104",
      "datatype" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.wormbase.org/db/get?class=Protein;name=WP:CE15104",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "Wormpep",
      "url_syntax" : "http://www.wormbase.org/db/get?class=Protein;name=WP:[example_id]",
      "id" : null
   },
   "ma" : {
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.informatics.jax.org/searches/AMA.cgi?id=MA:0000003",
      "fullname" : null,
      "generic_url" : "http://www.informatics.jax.org/",
      "example_id" : "MA:0000003",
      "database" : "Adult Mouse Anatomical Dictionary",
      "datatype" : null,
      "description" : "Adult Mouse Anatomical Dictionary; part of Gene Expression Database",
      "url_syntax" : "http://www.informatics.jax.org/searches/AMA.cgi?id=MA:[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "MA"
   },
   "tigr_ref" : {
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "TIGR_REF",
      "name" : null,
      "fullname" : null,
      "object" : "Reference locator",
      "uri_prefix" : null,
      "url_example" : "http://cmr.jcvi.org/CMR/AnnotationSops.shtml",
      "datatype" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "example_id" : "JCVI_REF:GO_ref",
      "database" : "J. Craig Venter Institute"
   },
   "cas" : {
      "fullname" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "Identifier",
      "description" : "CAS REGISTRY is the most authoritative collection of disclosed chemical substance information, containing more than 54 million organic and inorganic substances and 62 million sequences. CAS REGISTRY covers substances identified from the scientific literature from 1957 to the present, with additional substances going back to the early 1900s.",
      "datatype" : null,
      "generic_url" : "http://www.cas.org/expertise/cascontent/registry/index.html",
      "database" : "CAS Chemical Registry",
      "example_id" : "CAS:58-08-2",
      "url_syntax" : null,
      "id" : null,
      "abbreviation" : "CAS",
      "name" : null
   },
   "tgd_ref" : {
      "uri_prefix" : null,
      "url_example" : "http://db.ciliate.org/cgi-bin/reference/reference.pl?dbid=T000005818",
      "object" : "Literature Reference Identifier",
      "fullname" : null,
      "generic_url" : "http://www.ciliate.org/",
      "database" : "Tetrahymena Genome Database",
      "example_id" : "TGD_REF:T000005818",
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://db.ciliate.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "name" : null,
      "abbreviation" : "TGD_REF"
   },
   "pamgo" : {
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "generic_url" : "http://pamgo.vbi.vt.edu/",
      "example_id" : null,
      "database" : "Plant-Associated Microbe Gene Ontology Interest Group",
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "name" : null,
      "abbreviation" : "PAMGO"
   },
   "uniprotkb/trembl" : {
      "uri_prefix" : null,
      "url_example" : "http://www.uniprot.org/uniprot/O31124",
      "object" : "Accession",
      "fullname" : null,
      "generic_url" : "http://www.uniprot.org",
      "example_id" : "TrEMBL:O31124",
      "database" : "UniProtKB-TrEMBL protein sequence database",
      "is_obsolete" : "true",
      "description" : "UniProtKB-TrEMBL, a computer-annotated protein sequence database supplementing UniProtKB and containing the translations of all coding sequences (CDS) present in the EMBL Nucleotide Sequence Database but not yet integrated in UniProtKB/Swiss-Prot",
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "name" : null,
      "replaced_by" : "UniProtKB",
      "abbreviation" : "UniProtKB/TrEMBL"
   },
   "cgsc" : {
      "abbreviation" : "CGSC",
      "name" : null,
      "id" : null,
      "url_syntax" : null,
      "datatype" : null,
      "example_id" : "CGSC:rbsK",
      "generic_url" : "http://cgsc.biology.yale.edu/",
      "database" : null,
      "fullname" : null,
      "object" : "Gene symbol",
      "uri_prefix" : null,
      "database: CGSC" : "E.coli Genetic Stock Center",
      "url_example" : "http://cgsc.biology.yale.edu/Site.php?ID=315"
   },
   "geneid" : {
      "datatype" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "example_id" : "NCBI_Gene:4771",
      "database" : "NCBI Gene",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "abbreviation" : "GeneID",
      "local_id_syntax" : "^\\d+$",
      "name" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "id" : null
   },
   "zfin" : {
      "generic_url" : "http://zfin.org/",
      "example_id" : "ZFIN:ZDB-GENE-990415-103",
      "database" : "Zebrafish Information Network",
      "datatype" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://zfin.org/cgi-bin/ZFIN_jump?record=ZDB-GENE-990415-103",
      "fullname" : null,
      "entity_type" : "VariO:0001 ! variation",
      "local_id_syntax" : "^ZDB-(GENE|GENO|MRPHLNO)-[0-9]{6}-[0-9]+$",
      "name" : null,
      "abbreviation" : "ZFIN",
      "url_syntax" : "http://zfin.org/cgi-bin/ZFIN_jump?record=[example_id]",
      "id" : null
   },
   "germonline" : {
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "object" : null,
      "datatype" : null,
      "generic_url" : "http://www.germonline.org/",
      "example_id" : null,
      "database" : "GermOnline",
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "GermOnline",
      "name" : null
   },
   "enzyme" : {
      "abbreviation" : "ENZYME",
      "name" : null,
      "url_syntax" : "http://www.expasy.ch/cgi-bin/nicezyme.pl?[example_id]",
      "id" : null,
      "datatype" : null,
      "generic_url" : "http://www.expasy.ch/",
      "example_id" : "ENZYME:EC 1.1.1.1",
      "database" : "Swiss Institute of Bioinformatics enzyme database",
      "fullname" : null,
      "object" : "Identifier",
      "url_example" : "http://www.expasy.ch/cgi-bin/nicezyme.pl?1.1.1.1",
      "uri_prefix" : null
   },
   "interpro" : {
      "generic_url" : "http://www.ebi.ac.uk/interpro/",
      "database" : "InterPro database of protein domains and motifs",
      "example_id" : "InterPro:IPR000001",
      "datatype" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.ebi.ac.uk/interpro/entry/IPR015421",
      "fullname" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "local_id_syntax" : "^IPR\\d{6}$",
      "name" : null,
      "abbreviation" : "INTERPRO",
      "url_syntax" : "http://www.ebi.ac.uk/interpro/entry/[example_id]",
      "id" : null
   },
   "dbsnp" : {
      "datatype" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/projects/SNP",
      "database" : "NCBI dbSNP",
      "example_id" : "dbSNP:rs3131969",
      "fullname" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=rs3131969",
      "abbreviation" : "dbSNP",
      "local_id_syntax" : "^\\d+$",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=[example_id]"
   },
   "wormbase" : {
      "local_id_syntax" : "^WB(Gene|Var|RNAi|Transgene)[0-9]{8}$",
      "name" : null,
      "abbreviation" : "WormBase",
      "id" : null,
      "url_syntax" : "http://www.wormbase.org/db/gene/gene?name=[example_id]",
      "example_id" : "WB:WBGene00003001",
      "generic_url" : "http://www.wormbase.org/",
      "database" : "WormBase database of nematode biology",
      "datatype" : null,
      "object" : "Gene identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.wormbase.org/db/get?class=Gene;name=WBGene00003001",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein"
   },
   "ipi" : {
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "IPI",
      "name" : null,
      "fullname" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : null,
      "datatype" : null,
      "generic_url" : "http://www.ebi.ac.uk/IPI/IPIhelp.html",
      "database" : "International Protein Index",
      "example_id" : "IPI:IPI00000005.1"
   },
   "pharmgkb" : {
      "url_syntax" : "http://www.pharmgkb.org/do/serve?objId=[example_id]",
      "id" : null,
      "abbreviation" : "PharmGKB",
      "name" : null,
      "fullname" : null,
      "url_example" : "http://www.pharmgkb.org/do/serve?objId=PA267",
      "uri_prefix" : null,
      "object" : null,
      "datatype" : null,
      "generic_url" : "http://www.pharmgkb.org",
      "database" : "Pharmacogenetics and Pharmacogenomics Knowledge Base",
      "example_id" : "PharmGKB:PA267"
   },
   "hamap" : {
      "url_syntax" : "http://hamap.expasy.org/unirule/[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "HAMAP",
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://hamap.expasy.org/unirule/MF_00131",
      "fullname" : null,
      "example_id" : "HAMAP:MF_00031",
      "generic_url" : "http://hamap.expasy.org/",
      "database" : "High-quality Automated and Manual Annotation of microbial Proteomes",
      "datatype" : null
   },
   "cog_function" : {
      "object" : "Identifier",
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/grace/shokog.cgi?fun=H",
      "uri_prefix" : null,
      "fullname" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "database" : "NCBI COG function",
      "example_id" : "COG_Function:H",
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/grace/shokog.cgi?fun=[example_id]",
      "name" : null,
      "abbreviation" : "COG_Function"
   },
   "uniprotkb-subcell" : {
      "name" : null,
      "abbreviation" : "UniProtKB-SubCell",
      "url_syntax" : "http://www.uniprot.org/locations/[example_id]",
      "id" : null,
      "generic_url" : "http://www.uniprot.org/locations/",
      "database" : "UniProt Knowledgebase Subcellular Location vocabulary",
      "example_id" : "UniProtKB-SubCell:SL-0012",
      "datatype" : null,
      "url_example" : "http://www.uniprot.org/locations/SL-0012",
      "uri_prefix" : null,
      "object" : "Identifier",
      "fullname" : null
   },
   "mips_funcat" : {
      "object" : "Identifier",
      "url_example" : "http://mips.gsf.de/cgi-bin/proj/funcatDB/search_advanced.pl?action=2&wert=11.02",
      "uri_prefix" : null,
      "fullname" : null,
      "generic_url" : "http://mips.gsf.de/proj/funcatDB/",
      "database" : "MIPS Functional Catalogue",
      "example_id" : "MIPS_funcat:11.02",
      "datatype" : null,
      "url_syntax" : "http://mips.gsf.de/cgi-bin/proj/funcatDB/search_advanced.pl?action=2&wert=[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "MIPS_funcat"
   },
   "ncbi_gene" : {
      "local_id_syntax" : "^\\d+$",
      "name" : null,
      "abbreviation" : "NCBI_Gene",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "id" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "database" : "NCBI Gene",
      "example_id" : "NCBI_Gene:4771",
      "datatype" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene"
   },
   "jcvi_ref" : {
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://cmr.jcvi.org/CMR/AnnotationSops.shtml",
      "object" : "Reference locator",
      "datatype" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "database" : "J. Craig Venter Institute",
      "example_id" : "JCVI_REF:GO_ref",
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "JCVI_REF",
      "name" : null
   },
   "pompep" : {
      "generic_url" : "ftp://ftp.sanger.ac.uk/pub/yeast/pombe/Protein_data/",
      "example_id" : "Pompep:SPAC890.04C",
      "database" : "Schizosaccharomyces pombe protein data",
      "datatype" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "Gene/protein identifier",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "Pompep",
      "url_syntax" : null,
      "id" : null
   },
   "po" : {
      "generic_url" : "http://www.plantontology.org/",
      "database" : "Plant Ontology Consortium Database",
      "example_id" : "PO:0009004",
      "datatype" : null,
      "url_example" : "http://www.plantontology.org/amigo/go.cgi?action=query&view=query&search_constraint=terms&query=PO:0009004",
      "uri_prefix" : null,
      "object" : "Identifier",
      "entity_type" : "PO:0009012 ! plant structure development stage ",
      "fullname" : null,
      "name" : null,
      "local_id_syntax" : "^[0-9]{7}$",
      "abbreviation" : "PO",
      "url_syntax" : "http://www.plantontology.org/amigo/go.cgi?action=query&view=query&search_constraint=terms&query=PO:[example_id]",
      "id" : null
   },
   "fbbt" : {
      "name" : null,
      "abbreviation" : "FBbt",
      "url_syntax" : "http://flybase.org/cgi-bin/fbcvq.html?query=FBbt:[example_id]",
      "id" : null,
      "generic_url" : "http://flybase.org/",
      "example_id" : "FBbt:00005177",
      "database" : "Drosophila gross anatomy",
      "datatype" : null,
      "url_example" : "http://flybase.org/cgi-bin/fbcvq.html?query=FBbt:00005177",
      "uri_prefix" : null,
      "object" : "Identifier",
      "fullname" : null
   },
   "ncbi_locus_tag" : {
      "name" : null,
      "abbreviation" : "NCBI_locus_tag",
      "id" : null,
      "url_syntax" : null,
      "example_id" : "NCBI_locus_tag:CTN_0547",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "database" : "NCBI locus tag",
      "datatype" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "Identifier",
      "fullname" : null
   },
   "jcvi_ath1" : {
      "is_obsolete" : "true",
      "example_id" : "JCVI_Ath1:At3g01440",
      "generic_url" : "http://www.tigr.org/tdb/e2k1/ath1/ath1.shtml",
      "database" : "Arabidopsis thaliana database at the J. Craig Venter Institute",
      "datatype" : null,
      "object" : "Accession",
      "url_example" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "name" : null,
      "abbreviation" : "JCVI_Ath1",
      "url_syntax" : null,
      "id" : null
   },
   "ro" : {
      "url_syntax" : "http://purl.obolibrary.org/obo/RO_[example_id]",
      "id" : null,
      "abbreviation" : "RO",
      "name" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://purl.obolibrary.org/obo/RO_0002211",
      "object" : null,
      "description" : "A collection of relations used across OBO ontologies",
      "datatype" : null,
      "database" : "OBO Relation Ontology Ontology",
      "generic_url" : "http://purl.obolibrary.org/obo/ro",
      "example_id" : "RO:0002211"
   },
   "mesh" : {
      "url_syntax" : "http://www.nlm.nih.gov/cgi/mesh/2005/MB_cgi?mode=&term=[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "MeSH",
      "url_example" : "http://www.nlm.nih.gov/cgi/mesh/2005/MB_cgi?mode=&term=mitosis",
      "uri_prefix" : null,
      "object" : "MeSH heading",
      "fullname" : null,
      "example_id" : "MeSH:mitosis",
      "generic_url" : "http://www.nlm.nih.gov/mesh/2005/MBrowser.html",
      "database" : "Medical Subject Headings",
      "datatype" : null
   },
   "tigr_tigrfams" : {
      "datatype" : null,
      "generic_url" : "http://search.jcvi.org/",
      "database" : "TIGRFAMs HMM collection at the J. Craig Venter Institute",
      "example_id" : "JCVI_TIGRFAMS:TIGR00254",
      "fullname" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "object" : "Accession",
      "url_example" : "http://search.jcvi.org/search?p&q=TIGR00254",
      "uri_prefix" : null,
      "abbreviation" : "TIGR_TIGRFAMS",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://search.jcvi.org/search?p&q=[example_id]"
   },
   "coriell" : {
      "example_id" : "GM07892",
      "generic_url" : "http://ccr.coriell.org/",
      "database" : "Coriell Institute for Medical Research",
      "description" : "The Coriell Cell Repositories provide essential research reagents to the scientific community by establishing, verifying, maintaining, and distributing cell cultures and DNA derived from cell cultures. These collections, supported by funds from the National Institutes of Health (NIH) and several foundations, are extensively utilized by research scientists around the world. ",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://ccr.coriell.org/Sections/Search/Sample_Detail.aspx?Ref=GM07892",
      "object" : "Identifier",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "CORIELL",
      "id" : null,
      "url_syntax" : "http://ccr.coriell.org/Sections/Search/Sample_Detail.aspx?Ref=[example_id]"
   },
   "um-bbd" : {
      "example_id" : null,
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "object" : "Prefix",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "UM-BBD",
      "id" : null,
      "url_syntax" : null
   },
   "mgi" : {
      "object" : "Accession",
      "url_example" : "http://www.informatics.jax.org/accession/MGI:80863",
      "uri_prefix" : null,
      "fullname" : null,
      "entity_type" : "VariO:0001 ! variation",
      "generic_url" : "http://www.informatics.jax.org/",
      "example_id" : "MGI:MGI:80863",
      "database" : "Mouse Genome Informatics",
      "datatype" : null,
      "url_syntax" : "http://www.informatics.jax.org/accession/[example_id]",
      "id" : null,
      "local_id_syntax" : "^MGI:[0-9]{5,}$",
      "name" : null,
      "abbreviation" : "MGI"
   },
   "obi" : {
      "name" : null,
      "local_id_syntax" : "^\\d{7}$",
      "abbreviation" : "OBI",
      "id" : null,
      "url_syntax" : null,
      "database" : "Ontology for Biomedical Investigations",
      "generic_url" : "http://obi-ontology.org/page/Main_Page",
      "example_id" : "OBI:0000038",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "object" : "Identifier",
      "fullname" : null
   },
   "sabio-rk" : {
      "abbreviation" : "SABIO-RK",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://sabio.villa-bosch.de/reacdetails.jsp?reactid=[example_id]",
      "datatype" : null,
      "description" : "The SABIO-RK (System for the Analysis of Biochemical Pathways - Reaction Kinetics) is a web-based application based on the SABIO relational database that contains information about biochemical reactions, their kinetic equations with their parameters, and the experimental conditions under which these parameters were measured.",
      "generic_url" : "http://sabio.villa-bosch.de/",
      "database" : "SABIO Reaction Kinetics",
      "example_id" : "SABIO-RK:1858",
      "fullname" : null,
      "object" : "reaction",
      "url_example" : "http://sabio.villa-bosch.de/reacdetails.jsp?reactid=1858",
      "uri_prefix" : null
   },
   "cl" : {
      "entity_type" : "CL:0000000 ! cell ",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://purl.obolibrary.org/obo/CL_0000041",
      "object" : "Identifier",
      "datatype" : null,
      "database" : "Cell Type Ontology",
      "generic_url" : "http://cellontology.org",
      "example_id" : "CL:0000041",
      "url_syntax" : "http://purl.obolibrary.org/obo/CL_[example_id]",
      "id" : null,
      "abbreviation" : "CL",
      "name" : null,
      "local_id_syntax" : "^[0-9]{7}$"
   },
   "rnamdb" : {
      "datatype" : null,
      "example_id" : "RNAmods:037",
      "generic_url" : "http://s59.cas.albany.edu/RNAmods/",
      "database" : "RNA Modification Database",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?091",
      "object" : "Identifier",
      "abbreviation" : "RNAMDB",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?[example_id]"
   },
   "casgen" : {
      "id" : null,
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=[example_id]",
      "abbreviation" : "CASGEN",
      "name" : null,
      "fullname" : null,
      "object" : "Identifier",
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=1040",
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "CASGEN:1040",
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "database" : "Catalog of Fishes genus database"
   },
   "pdb" : {
      "name" : null,
      "local_id_syntax" : "^[A-Za-z0-9]{4}$",
      "abbreviation" : "PDB",
      "id" : null,
      "url_syntax" : "http://www.rcsb.org/pdb/cgi/explore.cgi?pdbId=[example_id]",
      "generic_url" : "http://www.rcsb.org/pdb/",
      "example_id" : "PDB:1A4U",
      "database" : "Protein Data Bank",
      "datatype" : null,
      "url_example" : "http://www.rcsb.org/pdb/cgi/explore.cgi?pdbId=1A4U",
      "uri_prefix" : null,
      "object" : "Identifier",
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null
   },
   "img" : {
      "datatype" : null,
      "example_id" : "IMG:640008772",
      "generic_url" : "http://img.jgi.doe.gov",
      "database" : "Integrated Microbial Genomes; JGI web site for genome annotation",
      "fullname" : null,
      "object" : "Identifier",
      "url_example" : "http://img.jgi.doe.gov/cgi-bin/pub/main.cgi?section=GeneDetail&page=geneDetail&gene_oid=640008772",
      "uri_prefix" : null,
      "abbreviation" : "IMG",
      "name" : null,
      "url_syntax" : "http://img.jgi.doe.gov/cgi-bin/pub/main.cgi?section=GeneDetail&page=geneDetail&gene_oid=[example_id]",
      "id" : null
   },
   "ipr" : {
      "datatype" : null,
      "example_id" : "InterPro:IPR000001",
      "database" : "InterPro database of protein domains and motifs",
      "generic_url" : "http://www.ebi.ac.uk/interpro/",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.ebi.ac.uk/interpro/entry/IPR015421",
      "object" : "Identifier",
      "abbreviation" : "IPR",
      "name" : null,
      "local_id_syntax" : "^IPR\\d{6}$",
      "id" : null,
      "url_syntax" : "http://www.ebi.ac.uk/interpro/entry/[example_id]"
   },
   "biosis" : {
      "fullname" : null,
      "object" : "Identifier",
      "url_example" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.biosis.org/",
      "example_id" : "BIOSIS:200200247281",
      "database" : "BIOSIS previews",
      "url_syntax" : null,
      "id" : null,
      "abbreviation" : "BIOSIS",
      "name" : null
   },
   "tigr_cmr" : {
      "uri_prefix" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=VCA0557",
      "object" : "Locus",
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "database" : "Comprehensive Microbial Resource at the J. Craig Venter Institute",
      "example_id" : "JCVI_CMR:VCA0557",
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=[example_id]",
      "name" : null,
      "abbreviation" : "TIGR_CMR"
   },
   "reac" : {
      "local_id_syntax" : "^REACT_[0-9]+$",
      "name" : null,
      "abbreviation" : "REAC",
      "id" : null,
      "url_syntax" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=[example_id]",
      "generic_url" : "http://www.reactome.org/",
      "example_id" : "Reactome:REACT_604",
      "database" : "Reactome - a curated knowledgebase of biological pathways",
      "datatype" : null,
      "object" : "Identifier",
      "url_example" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=REACT_604",
      "uri_prefix" : null,
      "fullname" : null
   },
   "transfac" : {
      "datatype" : null,
      "generic_url" : "http://www.gene-regulation.com/pub/databases.html#transfac",
      "example_id" : null,
      "database" : "TRANSFAC database of eukaryotic transcription factors",
      "fullname" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "TRANSFAC",
      "name" : null,
      "id" : null,
      "url_syntax" : null
   },
   "rgd" : {
      "name" : null,
      "local_id_syntax" : "^[0-9]{4,7}$",
      "abbreviation" : "RGD",
      "id" : null,
      "url_syntax" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=[example_id]",
      "database" : "Rat Genome Database",
      "generic_url" : "http://rgd.mcw.edu/",
      "example_id" : "RGD:2004",
      "datatype" : null,
      "url_example" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=2004",
      "uri_prefix" : null,
      "object" : "Accession",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null
   },
   "casspc" : {
      "datatype" : null,
      "example_id" : null,
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "database" : "Catalog of Fishes species database",
      "fullname" : null,
      "object" : "Identifier",
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=1979",
      "uri_prefix" : null,
      "abbreviation" : "CASSPC",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=[example_id]"
   },
   "sanger" : {
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "Sanger",
      "name" : null,
      "fullname" : null,
      "object" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "datatype" : null,
      "generic_url" : "http://www.sanger.ac.uk/",
      "database" : "Wellcome Trust Sanger Institute",
      "example_id" : null
   },
   "um-bbd_enzymeid" : {
      "fullname" : null,
      "object" : "Enzyme identifier",
      "url_example" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=ep&enzymeID=e0230",
      "uri_prefix" : null,
      "datatype" : null,
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "example_id" : "UM-BBD_enzymeID:e0413",
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=ep&enzymeID=[example_id]",
      "id" : null,
      "abbreviation" : "UM-BBD_enzymeID",
      "name" : null
   },
   "smart" : {
      "datatype" : null,
      "example_id" : "SMART:SM00005",
      "generic_url" : "http://smart.embl-heidelberg.de/",
      "database" : "Simple Modular Architecture Research Tool",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "url_example" : "http://smart.embl-heidelberg.de/smart/do_annotation.pl?BLAST=DUMMY&DOMAIN=SM00005",
      "uri_prefix" : null,
      "object" : "Accession",
      "abbreviation" : "SMART",
      "name" : null,
      "url_syntax" : "http://smart.embl-heidelberg.de/smart/do_annotation.pl?BLAST=DUMMY&DOMAIN=[example_id]",
      "id" : null
   },
   "ncbi_gi" : {
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "id" : null,
      "abbreviation" : "NCBI_gi",
      "local_id_syntax" : "^[0-9]{6,}$",
      "name" : null,
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "object" : "Identifier",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=113194944",
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "database" : "NCBI databases",
      "example_id" : "NCBI_gi:113194944"
   },
   "ddb" : {
      "datatype" : null,
      "database" : "dictyBase",
      "example_id" : "dictyBase:DDB_G0277859",
      "generic_url" : "http://dictybase.org",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://dictybase.org/gene/DDB_G0277859",
      "abbreviation" : "DDB",
      "local_id_syntax" : "^DDB_G[0-9]{7}$",
      "name" : null,
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "id" : null
   },
   "ncbi_taxid" : {
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "id" : null,
      "abbreviation" : "ncbi_taxid",
      "name" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "object" : "Identifier",
      "datatype" : null,
      "example_id" : "taxon:7227",
      "database" : "NCBI Taxonomy",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/"
   },
   "iuphar_receptor" : {
      "example_id" : "IUPHAR_RECEPTOR:2205",
      "generic_url" : "http://www.iuphar.org/",
      "database" : "International Union of Pharmacology",
      "datatype" : null,
      "object" : "Receptor identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.iuphar-db.org/DATABASE/ObjectDisplayForward?objectId=56",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "IUPHAR_RECEPTOR",
      "id" : null,
      "url_syntax" : "http://www.iuphar-db.org/DATABASE/ObjectDisplayForward?objectId=[example_id]"
   },
   "sp_sl" : {
      "url_syntax" : "http://www.uniprot.org/locations/[example_id]",
      "id" : null,
      "abbreviation" : "SP_SL",
      "name" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.uniprot.org/locations/SL-0012",
      "object" : "Identifier",
      "datatype" : null,
      "database" : "UniProt Knowledgebase Subcellular Location vocabulary",
      "generic_url" : "http://www.uniprot.org/locations/",
      "example_id" : "UniProtKB-SubCell:SL-0012"
   },
   "refseq" : {
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=XP_001068954",
      "object" : "Identifier",
      "datatype" : null,
      "database" : "RefSeq",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/RefSeq/",
      "example_id" : "RefSeq:XP_001068954",
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "abbreviation" : "RefSeq",
      "name" : null,
      "local_id_syntax" : "^(NC|AC|NG|NT|NW|NZ|NM|NR|XM|XR|NP|AP|XP|ZP)_\\d+$"
   },
   "cbs" : {
      "name" : null,
      "abbreviation" : "CBS",
      "url_syntax" : null,
      "id" : null,
      "generic_url" : "http://www.cbs.dtu.dk/",
      "example_id" : "CBS:TMHMM",
      "database" : "Center for Biological Sequence Analysis",
      "datatype" : null,
      "object" : "prediction tool",
      "url_example" : "http://www.cbs.dtu.dk/services/[example_id]/",
      "uri_prefix" : null,
      "fullname" : null
   },
   "sp_kw" : {
      "datatype" : null,
      "generic_url" : "http://www.uniprot.org/keywords/",
      "database" : "UniProt Knowledgebase keywords",
      "example_id" : "UniProtKB-KW:KW-0812",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.uniprot.org/keywords/KW-0812",
      "object" : "Identifier",
      "abbreviation" : "SP_KW",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://www.uniprot.org/keywords/[example_id]"
   },
   "aspgdid" : {
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=ASPL0000067538",
      "object" : "Identifier for AspGD Loci",
      "datatype" : null,
      "database" : "Aspergillus Genome Database",
      "generic_url" : "http://www.aspergillusgenome.org/",
      "example_id" : "AspGD:ASPL0000067538",
      "id" : null,
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "abbreviation" : "AspGDID",
      "name" : null,
      "local_id_syntax" : "^ASPL[0-9]{10}$"
   },
   "broad" : {
      "abbreviation" : "Broad",
      "name" : null,
      "id" : null,
      "url_syntax" : null,
      "datatype" : null,
      "example_id" : null,
      "generic_url" : "http://www.broad.mit.edu/",
      "database" : "Broad Institute",
      "fullname" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "wikipedia" : {
      "datatype" : null,
      "generic_url" : "http://en.wikipedia.org/",
      "database" : "Wikipedia",
      "example_id" : "Wikipedia:Endoplasmic_reticulum",
      "fullname" : null,
      "object" : "Page Reference Identifier",
      "url_example" : "http://en.wikipedia.org/wiki/Endoplasmic_reticulum",
      "uri_prefix" : null,
      "abbreviation" : "Wikipedia",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://en.wikipedia.org/wiki/[example_id]"
   },
   "biopixie_mefit" : {
      "database" : "biological Process Inference from eXperimental Interaction Evidence/Microarray Experiment Functional Integration Technology",
      "generic_url" : "http://pixie.princeton.edu/pixie/",
      "example_id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "object" : null,
      "fullname" : null,
      "name" : null,
      "abbreviation" : "bioPIXIE_MEFIT",
      "url_syntax" : null,
      "id" : null
   },
   "vmd" : {
      "name" : null,
      "abbreviation" : "VMD",
      "url_syntax" : "http://vmd.vbi.vt.edu/cgi-bin/browse/browserDetail_new.cgi?gene_id=[example_id]",
      "id" : null,
      "generic_url" : "http://phytophthora.vbi.vt.edu",
      "database" : "Virginia Bioinformatics Institute Microbial Database",
      "example_id" : "VMD:109198",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://vmd.vbi.vt.edu/cgi-bin/browse/browserDetail_new.cgi?gene_id=109198",
      "object" : "Gene identifier",
      "fullname" : null
   },
   "uniprotkb" : {
      "generic_url" : "http://www.uniprot.org",
      "example_id" : "UniProtKB:P51587",
      "database" : "Universal Protein Knowledgebase",
      "datatype" : null,
      "description" : "A central repository of protein sequence and function created by joining the information contained in Swiss-Prot, TrEMBL, and PIR database",
      "object" : "Accession",
      "uri_prefix" : null,
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein ",
      "local_id_syntax" : "^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z]([0-9][A-Z][A-Z0-9]{2}){1,2}[0-9])((-[0-9]+)|:PRO_[0-9]{10}|:VAR_[0-9]{6}){0,1}$",
      "name" : null,
      "abbreviation" : "UniProtKB",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "id" : null
   },
   "ensemblplants" : {
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "id" : null,
      "abbreviation" : "EnsemblPlants",
      "name" : null,
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "object" : "Identifier",
      "url_example" : "http://www.ensemblgenomes.org/id/LOC_Os01g22954",
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "EnsemblPlants:LOC_Os01g22954",
      "generic_url" : "http://plants.ensembl.org/",
      "database" : "Ensembl Plants, the Ensembl Genomes database for accessing plant genome data"
   },
   "jcvi_genprop" : {
      "id" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=[example_id]",
      "abbreviation" : "JCVI_GenProp",
      "name" : null,
      "local_id_syntax" : "^GenProp[0-9]{4}$",
      "entity_type" : "GO:0008150 ! biological process",
      "fullname" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=GenProp0120",
      "uri_prefix" : null,
      "object" : "Accession",
      "datatype" : null,
      "example_id" : "JCVI_GenProp:GenProp0120",
      "generic_url" : "http://cmr.jcvi.org/",
      "database" : "Genome Properties database at the J. Craig Venter Institute"
   },
   "cog_cluster" : {
      "abbreviation" : "COG_Cluster",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/new/release/cow.cgi?cog=[example_id]",
      "datatype" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "database" : "NCBI COG cluster",
      "example_id" : "COG_Cluster:COG0001",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/new/release/cow.cgi?cog=COG0001",
      "object" : "Identifier"
   },
   "corum" : {
      "url_syntax" : "http://mips.gsf.de/genre/proj/corum/complexdetails.html?id=[example_id]",
      "id" : null,
      "abbreviation" : "CORUM",
      "name" : null,
      "fullname" : null,
      "object" : "Identifier",
      "url_example" : "http://mips.gsf.de/genre/proj/corum/complexdetails.html?id=837",
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://mips.gsf.de/genre/proj/corum/",
      "example_id" : "CORUM:837",
      "database" : "CORUM - the Comprehensive Resource of Mammalian protein complexes"
   },
   "tc" : {
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.tcdb.org/tcdb/index.php?tc=9.A.4.1.1",
      "datatype" : null,
      "generic_url" : "http://www.tcdb.org/",
      "example_id" : "TC:9.A.4.1.1",
      "database" : "Transport Protein Database",
      "url_syntax" : "http://www.tcdb.org/tcdb/index.php?tc=[example_id]",
      "id" : null,
      "abbreviation" : "TC",
      "name" : null
   },
   "metacyc" : {
      "abbreviation" : "MetaCyc",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://biocyc.org/META/NEW-IMAGE?type=NIL&object=[example_id]",
      "datatype" : null,
      "generic_url" : "http://metacyc.org/",
      "example_id" : "MetaCyc:GLUTDEG-PWY",
      "database" : "Metabolic Encyclopedia of metabolic and other pathways",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://biocyc.org/META/NEW-IMAGE?type=NIL&object=GLUTDEG-PWY",
      "object" : "Identifier (pathway or reaction)"
   },
   "hgnc" : {
      "abbreviation" : "HGNC",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://www.genenames.org/data/hgnc_data.php?hgnc_id=HGNC:[example_id]",
      "datatype" : null,
      "generic_url" : "http://www.genenames.org/",
      "database" : "HUGO Gene Nomenclature Committee",
      "example_id" : "HGNC:29",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.genenames.org/data/hgnc_data.php?hgnc_id=HGNC:29"
   },
   "genedb_tbrucei" : {
      "generic_url" : "http://www.genedb.org/genedb/tryp/",
      "database" : "Trypanosoma brucei GeneDB",
      "is_obsolete" : "true",
      "datatype" : null,
      "object" : "Gene identifier",
      "name" : null,
      "replaced_by" : "GeneDB",
      "local_id_syntax" : "^Tb\\d+\\.\\d+\\.\\d+$",
      "example_id" : "GeneDB_Tbrucei:Tb927.1.5250",
      "uri_prefix" : null,
      "url_example" : "http://www.genedb.org/genedb/Search?organism=tryp&name=Tb927.1.5250",
      "shorthand_name" : "Tbrucei",
      "fullname" : null,
      "abbreviation" : "GeneDB_Tbrucei",
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=tryp&name=[example_id]",
      "id" : null
   },
   "casref" : {
      "fullname" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getref.asp?id=2031",
      "datatype" : null,
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "example_id" : "CASREF:2031",
      "database" : "Catalog of Fishes publications database",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getref.asp?id=[example_id]",
      "id" : null,
      "abbreviation" : "CASREF",
      "name" : null
   },
   "refgenome" : {
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null,
      "fullname" : null,
      "generic_url" : "http://www.geneontology.org/GO.refgenome.shtml",
      "example_id" : null,
      "database" : "GO Reference Genomes",
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "name" : null,
      "abbreviation" : "RefGenome"
   },
   "pubchem_bioassay" : {
      "datatype" : null,
      "example_id" : "PubChem_BioAssay:177",
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "database" : "NCBI PubChem database of bioassay records",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://pubchem.ncbi.nlm.nih.gov/assay/assay.cgi?aid=177",
      "object" : "Identifier",
      "abbreviation" : "PubChem_BioAssay",
      "name" : null,
      "url_syntax" : "http://pubchem.ncbi.nlm.nih.gov/assay/assay.cgi?aid=[example_id]",
      "id" : null
   },
   "rfam" : {
      "datatype" : null,
      "generic_url" : "http://rfam.sanger.ac.uk/",
      "database" : "Rfam database of RNA families",
      "example_id" : "Rfam:RF00012",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://rfam.sanger.ac.uk/family/RF00012",
      "object" : "accession",
      "abbreviation" : "Rfam",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://rfam.sanger.ac.uk/family/[example_id]"
   },
   "agi_locuscode" : {
      "example_id" : "AGI_LocusCode:At2g17950",
      "description" : "Comprises TAIR, TIGR and MIPS",
      "url_example" : "http://arabidopsis.org/servlets/TairObject?type=locus&name=At2g17950",
      "uri_prefix" : null,
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "abbreviation" : "AGI_LocusCode",
      "id" : null,
      "url_syntax" : "http://arabidopsis.org/servlets/TairObject?type=locus&name=[example_id]",
      "generic_url" : "http://www.arabidopsis.org",
      "database" : "Arabidopsis Genome Initiative",
      "!url_example" : "http://www.tigr.org/tigr-scripts/euk_manatee/shared/ORF_infopage.cgi?db=ath1&orf=At2g17950",
      "datatype" : null,
      "object" : "Locus identifier",
      "name" : null,
      "local_id_syntax" : "^AT[MC0-5]G[0-9]{5}(\\.[0-9]{1})?$",
      "!url_syntax" : "http://www.tigr.org/tigr-scripts/euk_manatee/shared/ORF_infopage.cgi?db=ath1&orf=[example_id]"
   },
   "obo_rel" : {
      "abbreviation" : "OBO_REL",
      "name" : null,
      "id" : null,
      "url_syntax" : null,
      "datatype" : null,
      "generic_url" : "http://www.obofoundry.org/ro/",
      "example_id" : "OBO_REL:part_of",
      "database" : "OBO relation ontology",
      "fullname" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : null
   },
   "aspgd_locus" : {
      "id" : null,
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "name" : null,
      "abbreviation" : "AspGD_LOCUS",
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?locus=AN10942",
      "uri_prefix" : null,
      "fullname" : null,
      "generic_url" : "http://www.aspergillusgenome.org/",
      "database" : "Aspergillus Genome Database",
      "example_id" : "AspGD_LOCUS:AN10942",
      "datatype" : null
   },
   "cdd" : {
      "abbreviation" : "CDD",
      "name" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid=[example_id]",
      "id" : null,
      "datatype" : null,
      "database" : "Conserved Domain Database at NCBI",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=cdd",
      "example_id" : "CDD:34222",
      "fullname" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid=34222",
      "uri_prefix" : null,
      "object" : "Identifier"
   },
   "ncbi_nm" : {
      "abbreviation" : "NCBI_NM",
      "name" : null,
      "replaced_by" : "RefSeq",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "is_obsolete" : "true",
      "example_id" : "NCBI_NM:123456",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "database" : "NCBI RefSeq",
      "fullname" : null,
      "object" : "mRNA identifier",
      "url_example" : null,
      "uri_prefix" : null
   },
   "uniparc" : {
      "name" : null,
      "abbreviation" : "UniParc",
      "url_syntax" : "http://www.uniprot.org/uniparc/[example_id]",
      "id" : null,
      "example_id" : "UniParc:UPI000000000A",
      "generic_url" : "http://www.uniprot.org/uniparc/",
      "database" : "UniProt Archive",
      "datatype" : null,
      "description" : "A non-redundant archive of protein sequences extracted from Swiss-Prot, TrEMBL, PIR-PSD, EMBL, Ensembl, IPI, PDB, RefSeq, FlyBase, WormBase, European Patent Office, United States Patent and Trademark Office, and Japanese Patent Office",
      "object" : "Accession",
      "uri_prefix" : null,
      "url_example" : "http://www.uniprot.org/uniparc/UPI000000000A",
      "fullname" : null
   },
   "jcvi_tba1" : {
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "object" : "Accession",
      "datatype" : null,
      "example_id" : "JCVI_Tba1:25N14.10",
      "generic_url" : "http://www.tigr.org/tdb/e2k1/tba1/",
      "database" : "Trypanosoma brucei database at the J. Craig Venter Institute",
      "is_obsolete" : "true",
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "JCVI_Tba1",
      "name" : null
   },
   "pamgo_mgg" : {
      "name" : null,
      "abbreviation" : "PAMGO_MGG",
      "id" : null,
      "url_syntax" : "http://scotland.fgl.ncsu.edu/cgi-bin/adHocQuery.cgi?adHocQuery_dbName=smeng_goannotation&Action=Data&QueryName=Functional+Categorization+of+MGG+GO+Annotation&P_KeyWord=[example_id]",
      "example_id" : "PAMGO_MGG:MGG_05132",
      "generic_url" : "http://scotland.fgl.ncsu.edu/smeng/GoAnnotationMagnaporthegrisea.html",
      "database" : "Magnaporthe grisea database",
      "description" : "Magnaporthe grisea database at North Carolina State University; member of PAMGO Interest Group",
      "datatype" : null,
      "url_example" : "http://scotland.fgl.ncsu.edu/cgi-bin/adHocQuery.cgi?adHocQuery_dbName=smeng_goannotation&Action=Data&QueryName=Functional+Categorization+of+MGG+GO+Annotation&P_KeyWord=MGG_05132",
      "uri_prefix" : null,
      "object" : "Locus",
      "fullname" : null
   },
   "locsvmpsi" : {
      "abbreviation" : "LOCSVMpsi",
      "name" : null,
      "url_syntax" : null,
      "id" : null,
      "description" : "Subcellular localization for eukayotic proteins based on SVM and PSI-BLAST",
      "datatype" : null,
      "generic_url" : "http://bioinformatics.ustc.edu.cn/locsvmpsi/locsvmpsi.php",
      "database" : "LOCSVMPSI",
      "example_id" : null,
      "fullname" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null
   },
   "ntnu_sb" : {
      "example_id" : null,
      "generic_url" : "http://www.ntnu.edu/nt/systemsbiology",
      "database" : "Norwegian University of Science and Technology, Systems Biology team",
      "datatype" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null,
      "fullname" : null,
      "name" : null,
      "abbreviation" : "NTNU_SB",
      "id" : null,
      "url_syntax" : null
   },
   "biomd" : {
      "url_syntax" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=[example_id]",
      "id" : null,
      "abbreviation" : "BIOMD",
      "name" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=BIOMD0000000045",
      "object" : "Accession",
      "datatype" : null,
      "generic_url" : "http://www.ebi.ac.uk/biomodels/",
      "example_id" : "BIOMD:BIOMD0000000045",
      "database" : "BioModels Database"
   },
   "bhf-ucl" : {
      "url_syntax" : null,
      "id" : null,
      "name" : null,
      "abbreviation" : "BHF-UCL",
      "object" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "fullname" : null,
      "example_id" : null,
      "generic_url" : "http://www.ucl.ac.uk/cardiovasculargeneontology/",
      "database" : "Cardiovascular Gene Ontology Annotation Initiative",
      "datatype" : null,
      "description" : "The Cardiovascular Gene Ontology Annotation Initiative is supported by the British Heart Foundation (BHF) and located at University College London (UCL)."
   },
   "tgd" : {
      "datatype" : null,
      "example_id" : null,
      "generic_url" : "http://www.ciliate.org/",
      "database" : "Tetrahymena Genome Database",
      "fullname" : null,
      "object" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "abbreviation" : "TGD",
      "name" : null,
      "id" : null,
      "url_syntax" : null
   },
   "sgn" : {
      "name" : null,
      "abbreviation" : "SGN",
      "url_syntax" : "http://www.sgn.cornell.edu/phenome/locus_display.pl?locus_id=[example_id]",
      "id" : null,
      "database" : "Sol Genomics Network",
      "generic_url" : "http://www.sgn.cornell.edu/",
      "example_id" : "SGN:4476",
      "datatype" : null,
      "object" : "Gene identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.sgn.cornell.edu/phenome/locus_display.pl?locus_id=4476",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene"
   },
   "ensemblplants/gramene" : {
      "url_example" : "http://www.ensemblgenomes.org/id/LOC_Os01g22954",
      "uri_prefix" : null,
      "object" : "Identifier",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "generic_url" : "http://plants.ensembl.org/",
      "database" : "Ensembl Plants, the Ensembl Genomes database for accessing plant genome data",
      "example_id" : "EnsemblPlants:LOC_Os01g22954",
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "name" : null,
      "abbreviation" : "EnsemblPlants/Gramene"
   },
   "iuphar_gpcr" : {
      "datatype" : null,
      "example_id" : "IUPHAR_GPCR:1279",
      "generic_url" : "http://www.iuphar.org/",
      "database" : "International Union of Pharmacology",
      "fullname" : null,
      "object" : "G-protein-coupled receptor family identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.iuphar-db.org/DATABASE/FamilyMenuForward?familyId=13",
      "abbreviation" : "IUPHAR_GPCR",
      "name" : null,
      "url_syntax" : "http://www.iuphar-db.org/DATABASE/FamilyMenuForward?familyId=[example_id]",
      "id" : null
   },
   "broad_mgg" : {
      "url_syntax" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/GeneLocus.html?sp=S[example_id]",
      "id" : null,
      "abbreviation" : "Broad_MGG",
      "name" : null,
      "fullname" : null,
      "object" : "Locus",
      "uri_prefix" : null,
      "url_example" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/GeneLocus.html?sp=SMGG_05132",
      "datatype" : null,
      "description" : "Magnaporthe grisea Database at the Broad Institute",
      "example_id" : "Broad_MGG:MGG_05132.5",
      "generic_url" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/Home.html",
      "database" : "Magnaporthe grisea Database"
   },
   "ensembl_geneid" : {
      "id" : null,
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "name" : null,
      "local_id_syntax" : "^ENSG[0-9]{9,16}$",
      "abbreviation" : "ENSEMBL_GeneID",
      "uri_prefix" : null,
      "url_example" : "http://www.ensembl.org/id/ENSG00000126016",
      "object" : "Gene identifier",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "example_id" : "ENSEMBL_GeneID:ENSG00000126016",
      "generic_url" : "http://www.ensembl.org/",
      "database" : "Ensembl database of automatically annotated genomic data",
      "datatype" : null
   },
   "tigr_tba1" : {
      "example_id" : "JCVI_Tba1:25N14.10",
      "generic_url" : "http://www.tigr.org/tdb/e2k1/tba1/",
      "database" : "Trypanosoma brucei database at the J. Craig Venter Institute",
      "is_obsolete" : "true",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "object" : "Accession",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "TIGR_Tba1",
      "id" : null,
      "url_syntax" : null
   },
   "ddb_ref" : {
      "abbreviation" : "DDB_REF",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=[example_id]",
      "datatype" : null,
      "generic_url" : "http://dictybase.org",
      "database" : "dictyBase literature references",
      "example_id" : "dictyBase_REF:10157",
      "fullname" : null,
      "object" : "Literature Reference Identifier",
      "url_example" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=10157",
      "uri_prefix" : null
   },
   "cgdid" : {
      "local_id_syntax" : "^(CAL|CAF)[0-9]{7}$",
      "name" : null,
      "abbreviation" : "CGDID",
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "id" : null,
      "generic_url" : "http://www.candidagenome.org/",
      "database" : "Candida Genome Database",
      "example_id" : "CGD:CAL0005516",
      "datatype" : null,
      "object" : "Identifier for CGD Loci",
      "uri_prefix" : null,
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=CAL0005516",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene"
   },
   "uniprotkb-kw" : {
      "id" : null,
      "url_syntax" : "http://www.uniprot.org/keywords/[example_id]",
      "name" : null,
      "abbreviation" : "UniProtKB-KW",
      "object" : "Identifier",
      "url_example" : "http://www.uniprot.org/keywords/KW-0812",
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "UniProtKB-KW:KW-0812",
      "generic_url" : "http://www.uniprot.org/keywords/",
      "database" : "UniProt Knowledgebase keywords",
      "datatype" : null
   },
   "prosite" : {
      "generic_url" : "http://www.expasy.ch/prosite/",
      "database" : "Prosite database of protein families and domains",
      "example_id" : "Prosite:PS00365",
      "datatype" : null,
      "url_example" : "http://www.expasy.ch/cgi-bin/prosite-search-ac?PS00365",
      "uri_prefix" : null,
      "object" : "Accession",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "Prosite",
      "id" : null,
      "url_syntax" : "http://www.expasy.ch/cgi-bin/prosite-search-ac?[example_id]"
   },
   "mi" : {
      "datatype" : null,
      "example_id" : "MI:0018",
      "generic_url" : "http://psidev.sourceforge.net/mi/xml/doc/user/index.html",
      "database" : "Proteomic Standard Initiative for Molecular Interaction",
      "fullname" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "Interaction identifier",
      "abbreviation" : "MI",
      "name" : null,
      "id" : null,
      "url_syntax" : null
   },
   "issn" : {
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "ISSN",
      "name" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "object" : "Identifier",
      "datatype" : null,
      "generic_url" : "http://www.issn.org/",
      "example_id" : "ISSN:1234-1231",
      "database" : "International Standard Serial Number"
   },
   "multifun" : {
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "generic_url" : "http://genprotec.mbl.edu/files/MultiFun.html",
      "database" : "MultiFun cell function assignment schema",
      "example_id" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "name" : null,
      "abbreviation" : "MultiFun"
   },
   "gr_gene" : {
      "datatype" : null,
      "generic_url" : "http://www.gramene.org/",
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "database" : null,
      "example_id" : "GR_GENE:GR:0060198",
      "fullname" : null,
      "object" : "Gene identifier",
      "url_example" : "http://www.gramene.org/db/genes/search_gene?acc=GR:0060198",
      "uri_prefix" : null,
      "abbreviation" : "GR_gene",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://www.gramene.org/db/genes/search_gene?acc=[example_id]"
   },
   "tair" : {
      "id" : null,
      "url_syntax" : "http://arabidopsis.org/servlets/TairObject?accession=[example_id]",
      "local_id_syntax" : "^locus:[0-9]{7}$",
      "name" : null,
      "abbreviation" : "TAIR",
      "object" : "Accession",
      "url_example" : "http://arabidopsis.org/servlets/TairObject?accession=locus:2146653",
      "uri_prefix" : null,
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "example_id" : "TAIR:locus:2146653",
      "generic_url" : "http://www.arabidopsis.org/",
      "database" : "The Arabidopsis Information Resource",
      "datatype" : null
   },
   "lifedb" : {
      "generic_url" : "http://www.lifedb.de/",
      "example_id" : "LIFEdb:DKFZp564O1716",
      "database" : "LifeDB",
      "datatype" : null,
      "description" : "LifeDB is a database for information on protein localization, interaction, functional assays and expression.",
      "object" : "cDNA clone identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.dkfz.de/LIFEdb/LIFEdb.aspx?ID=DKFZp564O1716",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "LIFEdb",
      "url_syntax" : "http://www.dkfz.de/LIFEdb/LIFEdb.aspx?ID=[example_id]",
      "id" : null
   },
   "jcvi_tigrfams" : {
      "id" : null,
      "url_syntax" : "http://search.jcvi.org/search?p&q=[example_id]",
      "name" : null,
      "abbreviation" : "JCVI_TIGRFAMS",
      "object" : "Accession",
      "uri_prefix" : null,
      "url_example" : "http://search.jcvi.org/search?p&q=TIGR00254",
      "fullname" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "generic_url" : "http://search.jcvi.org/",
      "example_id" : "JCVI_TIGRFAMS:TIGR00254",
      "database" : "TIGRFAMs HMM collection at the J. Craig Venter Institute",
      "datatype" : null
   },
   "go" : {
      "local_id_syntax" : "^\\d{7}$",
      "name" : null,
      "abbreviation" : "GO",
      "url_syntax" : "http://amigo.geneontology.org/cgi-bin/amigo/term-details.cgi?term=GO:[example_id]",
      "id" : null,
      "generic_url" : "http://amigo.geneontology.org/",
      "database" : "Gene Ontology Database",
      "example_id" : "GO:0004352",
      "datatype" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://amigo.geneontology.org/cgi-bin/amigo/term-details.cgi?term=GO:0004352",
      "fullname" : null,
      "entity_type" : "GO:0032991 ! macromolecular complex"
   },
   "ecocyc_ref" : {
      "id" : null,
      "url_syntax" : "http://biocyc.org/ECOLI/reference.html?type=CITATION-FRAME&object=[example_id]",
      "abbreviation" : "ECOCYC_REF",
      "name" : null,
      "fullname" : null,
      "url_example" : "http://biocyc.org/ECOLI/reference.html?type=CITATION-FRAME&object=COLISALII",
      "uri_prefix" : null,
      "object" : "Reference identifier",
      "datatype" : null,
      "database" : "Encyclopedia of E. coli metabolism",
      "example_id" : "EcoCyc_REF:COLISALII",
      "generic_url" : "http://ecocyc.org/"
   },
   "genedb_gmorsitans" : {
      "shorthand_name" : "Tsetse",
      "fullname" : null,
      "object" : "Gene identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.genedb.org/genedb/Search?organism=glossina&name=Gmm-0142",
      "datatype" : null,
      "is_obsolete" : "true",
      "example_id" : "GeneDB_Gmorsitans:Gmm-0142",
      "generic_url" : "http://www.genedb.org/genedb/glossina/",
      "database" : "Glossina morsitans GeneDB",
      "id" : null,
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=glossina&name=[example_id]",
      "abbreviation" : "GeneDB_Gmorsitans",
      "replaced_by" : "GeneDB",
      "name" : null
   },
   "um-bbd_reactionid" : {
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=r&reacID=[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "UM-BBD_reactionID",
      "uri_prefix" : null,
      "url_example" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=r&reacID=r0129",
      "object" : "Reaction identifier",
      "fullname" : null,
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "example_id" : "UM-BBD_reactionID:r0129",
      "datatype" : null
   },
   "rhea" : {
      "fullname" : null,
      "object" : "Accession",
      "url_example" : "http://www.ebi.ac.uk/rhea/reaction.xhtml?id=25811",
      "uri_prefix" : null,
      "datatype" : null,
      "description" : "Rhea is a freely available, manually annotated database of chemical reactions created in collaboration with the Swiss Institute of Bioinformatics (SIB).",
      "generic_url" : "http://www.ebi.ac.uk/rhea/",
      "example_id" : "RHEA:25811",
      "database" : "Rhea, the Annotated Reactions Database",
      "id" : null,
      "url_syntax" : "http://www.ebi.ac.uk/rhea/reaction.xhtml?id=[example_id]",
      "abbreviation" : "RHEA",
      "name" : null
   },
   "flybase" : {
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "url_example" : "http://flybase.org/reports/FBgn0000024.html",
      "uri_prefix" : null,
      "object" : "Identifier",
      "datatype" : null,
      "generic_url" : "http://flybase.org/",
      "database" : "FlyBase",
      "example_id" : "FB:FBgn0000024",
      "url_syntax" : "http://flybase.org/reports/[example_id].html",
      "id" : null,
      "abbreviation" : "FLYBASE",
      "name" : null,
      "local_id_syntax" : "^FBgn[0-9]{7}$"
   },
   "cog_pathway" : {
      "fullname" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/new/release/coglist.cgi?pathw=14",
      "uri_prefix" : null,
      "object" : "Identifier",
      "datatype" : null,
      "example_id" : "COG_Pathway:14",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "database" : "NCBI COG pathway",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/new/release/coglist.cgi?pathw=[example_id]",
      "id" : null,
      "abbreviation" : "COG_Pathway",
      "name" : null
   },
   "mitre" : {
      "name" : null,
      "abbreviation" : "MITRE",
      "url_syntax" : null,
      "id" : null,
      "generic_url" : "http://www.mitre.org/",
      "database" : "The MITRE Corporation",
      "example_id" : null,
      "datatype" : null,
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "fullname" : null
   },
   "vega" : {
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://vega.sanger.ac.uk/perl/searchview?species=all&idx=All&q=OTTHUMP00000000661",
      "fullname" : null,
      "generic_url" : "http://vega.sanger.ac.uk/index.html",
      "example_id" : "VEGA:OTTHUMP00000000661",
      "database" : "Vertebrate Genome Annotation database",
      "datatype" : null,
      "url_syntax" : "http://vega.sanger.ac.uk/perl/searchview?species=all&idx=All&q=[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "VEGA"
   },
   "syscilia_ccnet" : {
      "url_syntax" : null,
      "id" : null,
      "name" : null,
      "abbreviation" : "SYSCILIA_CCNET",
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "database" : "Syscilia",
      "generic_url" : "http://syscilia.org/",
      "example_id" : null,
      "datatype" : null,
      "description" : "A systems biology approach to dissect cilia function and its disruption in human genetic disease"
   },
   "spd" : {
      "id" : null,
      "url_syntax" : "http://www.riken.jp/SPD/[example_id].html",
      "abbreviation" : "SPD",
      "name" : null,
      "local_id_syntax" : "^[0-9]{2}/[0-9]{2}[A-Z][0-9]{2}$",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.riken.jp/SPD/05/05F01.html",
      "object" : "Identifier",
      "datatype" : null,
      "example_id" : "SPD:05/05F01",
      "generic_url" : "http://www.riken.jp/SPD/",
      "database" : "Schizosaccharomyces pombe Postgenome Database at RIKEN; includes Orfeome Localisation data"
   },
   "goc" : {
      "id" : null,
      "url_syntax" : null,
      "name" : null,
      "abbreviation" : "GOC",
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null,
      "fullname" : null,
      "generic_url" : "http://www.geneontology.org/",
      "example_id" : null,
      "database" : "Gene Ontology Consortium",
      "datatype" : null
   },
   "brenda" : {
      "name" : null,
      "abbreviation" : "BRENDA",
      "url_syntax" : "http://www.brenda-enzymes.info/php/result_flat.php4?ecno=[example_id]",
      "id" : null,
      "database" : "BRENDA, The Comprehensive Enzyme Information System",
      "generic_url" : "http://www.brenda-enzymes.info",
      "example_id" : "BRENDA:4.2.1.3",
      "datatype" : null,
      "url_example" : "http://www.brenda-enzymes.info/php/result_flat.php4?ecno=4.2.1.3",
      "uri_prefix" : null,
      "object" : "EC enzyme identifier",
      "entity_type" : "GO:0003824 ! catalytic activity",
      "fullname" : null
   },
   "pfam" : {
      "abbreviation" : "Pfam",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://www.sanger.ac.uk/cgi-bin/Pfam/getacc?[example_id]",
      "description" : "Pfam is a collection of protein families represented by sequence alignments and hidden Markov models (HMMs)",
      "datatype" : null,
      "database" : "Pfam database of protein families",
      "generic_url" : "http://www.sanger.ac.uk/Software/Pfam/",
      "example_id" : "Pfam:PF00046",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "url_example" : "http://www.sanger.ac.uk/cgi-bin/Pfam/getacc?PF00046",
      "uri_prefix" : null,
      "object" : "Accession"
   },
   "wb_ref" : {
      "name" : null,
      "abbreviation" : "WB_REF",
      "id" : null,
      "url_syntax" : "http://www.wormbase.org/db/misc/paper?name=[example_id]",
      "database" : "WormBase database of nematode biology",
      "generic_url" : "http://www.wormbase.org/",
      "example_id" : "WB_REF:WBPaper00004823",
      "datatype" : null,
      "object" : "Literature Reference Identifier",
      "url_example" : "http://www.wormbase.org/db/misc/paper?name=WBPaper00004823",
      "uri_prefix" : null,
      "fullname" : null
   },
   "wb" : {
      "url_syntax" : "http://www.wormbase.org/db/gene/gene?name=[example_id]",
      "id" : null,
      "abbreviation" : "WB",
      "local_id_syntax" : "^WB(Gene|Var|RNAi|Transgene)[0-9]{8}$",
      "name" : null,
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "object" : "Gene identifier",
      "url_example" : "http://www.wormbase.org/db/get?class=Gene;name=WBGene00003001",
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.wormbase.org/",
      "database" : "WormBase database of nematode biology",
      "example_id" : "WB:WBGene00003001"
   },
   "trait" : {
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "object" : null,
      "description" : "an integrated database of transcripts expressed in human skeletal muscle",
      "datatype" : null,
      "generic_url" : "http://muscle.cribi.unipd.it/",
      "database" : "TRAnscript Integrated Table",
      "example_id" : null,
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "TRAIT",
      "name" : null
   },
   "jstor" : {
      "object" : "journal article",
      "url_example" : "http://www.jstor.org/stable/3093870",
      "uri_prefix" : null,
      "fullname" : null,
      "generic_url" : "http://www.jstor.org/",
      "example_id" : "JSTOR:3093870",
      "database" : "Digital archive of scholarly articles",
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.jstor.org/stable/[example_id]",
      "name" : null,
      "abbreviation" : "JSTOR"
   },
   "refseq_na" : {
      "example_id" : "RefSeq_NA:NC_000913",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/RefSeq/",
      "database" : "RefSeq (Nucleic Acid)",
      "is_obsolete" : "true",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=NC_000913",
      "object" : "Identifier",
      "fullname" : null,
      "name" : null,
      "replaced_by" : "RefSeq",
      "abbreviation" : "RefSeq_NA",
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]"
   },
   "ri" : {
      "id" : null,
      "url_syntax" : null,
      "name" : null,
      "abbreviation" : "RI",
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : null,
      "generic_url" : "http://www.roslin.ac.uk/",
      "database" : "Roslin Institute",
      "datatype" : null
   },
   "resid" : {
      "name" : null,
      "abbreviation" : "RESID",
      "url_syntax" : null,
      "id" : null,
      "database" : "RESID Database of Protein Modifications",
      "generic_url" : "ftp://ftp.ncifcrf.gov/pub/users/residues/",
      "example_id" : "RESID:AA0062",
      "datatype" : null,
      "object" : "Identifier",
      "url_example" : null,
      "uri_prefix" : null,
      "fullname" : null
   },
   "ddbj" : {
      "object" : "Sequence accession",
      "uri_prefix" : null,
      "url_example" : "http://arsa.ddbj.nig.ac.jp/arsa/ddbjSplSearch?KeyWord=AA816246",
      "fullname" : null,
      "generic_url" : "http://www.ddbj.nig.ac.jp/",
      "example_id" : "DDBJ:AA816246",
      "database" : "DNA Databank of Japan",
      "datatype" : null,
      "url_syntax" : "http://arsa.ddbj.nig.ac.jp/arsa/ddbjSplSearch?KeyWord=[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "DDBJ"
   },
   "phi" : {
      "url_syntax" : null,
      "id" : null,
      "abbreviation" : "PHI",
      "name" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "object" : null,
      "datatype" : null,
      "example_id" : "PHI:0000055",
      "generic_url" : "http://aclame.ulb.ac.be/Classification/mego.html",
      "database" : "MeGO (Phage and Mobile Element Ontology)"
   },
   "alzheimers_university_of_toronto" : {
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null,
      "fullname" : null,
      "generic_url" : "http://www.ims.utoronto.ca/",
      "example_id" : null,
      "database" : "Alzheimers Project at University of Toronto",
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "name" : null,
      "abbreviation" : "Alzheimers_University_of_Toronto"
   },
   "mo" : {
      "uri_prefix" : null,
      "url_example" : "http://mged.sourceforge.net/ontologies/MGEDontology.php#Action",
      "object" : "ontology term",
      "fullname" : null,
      "example_id" : "MO:Action",
      "generic_url" : "http://mged.sourceforge.net/ontologies/MGEDontology.php",
      "database" : "MGED Ontology",
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://mged.sourceforge.net/ontologies/MGEDontology.php#[example_id]",
      "name" : null,
      "abbreviation" : "MO"
   },
   "aspgd_ref" : {
      "object" : "Literature Reference Identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/reference/reference.pl?dbid=90",
      "fullname" : null,
      "generic_url" : "http://www.aspergillusgenome.org/",
      "database" : "Aspergillus Genome Database",
      "example_id" : "AspGD_REF:90",
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "name" : null,
      "abbreviation" : "AspGD_REF"
   },
   "mengo" : {
      "generic_url" : "http://mengo.vbi.vt.edu/",
      "database" : "Microbial ENergy processes Gene Ontology Project",
      "example_id" : null,
      "datatype" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null,
      "fullname" : null,
      "name" : null,
      "abbreviation" : "MENGO",
      "url_syntax" : null,
      "id" : null
   },
   "sgn_ref" : {
      "url_syntax" : "http://www.sgn.cornell.edu/chado/publication.pl?pub_id=[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "SGN_ref",
      "url_example" : "http://www.sgn.cornell.edu/chado/publication.pl?pub_id=861",
      "uri_prefix" : null,
      "object" : "Reference identifier",
      "fullname" : null,
      "generic_url" : "http://www.sgn.cornell.edu/",
      "example_id" : "SGN_ref:861",
      "database" : "Sol Genomics Network",
      "datatype" : null
   },
   "tigr_genprop" : {
      "abbreviation" : "TIGR_GenProp",
      "name" : null,
      "local_id_syntax" : "^GenProp[0-9]{4}$",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=[example_id]",
      "id" : null,
      "datatype" : null,
      "database" : "Genome Properties database at the J. Craig Venter Institute",
      "generic_url" : "http://cmr.jcvi.org/",
      "example_id" : "JCVI_GenProp:GenProp0120",
      "entity_type" : "GO:0008150 ! biological process",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=GenProp0120",
      "object" : "Accession"
   },
   "go_ref" : {
      "datatype" : null,
      "generic_url" : "http://www.geneontology.org/",
      "example_id" : "GO_REF:0000001",
      "database" : "Gene Ontology Database references",
      "fullname" : null,
      "object" : "Accession (for reference)",
      "uri_prefix" : null,
      "url_example" : "http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:0000001",
      "abbreviation" : "GO_REF",
      "local_id_syntax" : "^\\d{7}$",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:[example_id]"
   },
   "wp" : {
      "abbreviation" : "WP",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://www.wormbase.org/db/get?class=Protein;name=WP:[example_id]",
      "datatype" : null,
      "is_obsolete" : "true",
      "generic_url" : "http://www.wormbase.org/",
      "example_id" : "WP:CE25104",
      "database" : "Wormpep database of proteins of C. elegans",
      "fullname" : null,
      "object" : "Identifier",
      "url_example" : "http://www.wormbase.org/db/get?class=Protein;name=WP:CE15104",
      "uri_prefix" : null
   },
   "ncbi" : {
      "! url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=",
      "example_id" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "database" : "National Center for Biotechnology Information",
      "datatype" : null,
      "object" : "Prefix",
      "uri_prefix" : null,
      "url_example" : null,
      "fullname" : null,
      "name" : null,
      "abbreviation" : "NCBI",
      "id" : null,
      "! url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "url_syntax" : null
   },
   "phenoscape" : {
      "abbreviation" : "PhenoScape",
      "name" : null,
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "generic_url" : "http://phenoscape.org/",
      "database" : "PhenoScape Knowledgebase",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "uri_prefix" : null,
      "url_example" : null
   },
   "genprotec" : {
      "id" : null,
      "url_syntax" : null,
      "name" : null,
      "abbreviation" : "GenProtEC",
      "uri_prefix" : null,
      "url_example" : null,
      "object" : null,
      "fullname" : null,
      "generic_url" : "http://genprotec.mbl.edu/",
      "database" : "GenProtEC E. coli genome and proteome database",
      "example_id" : null,
      "datatype" : null
   },
   "asap" : {
      "datatype" : null,
      "generic_url" : "https://asap.ahabs.wisc.edu/annotation/php/ASAP1.htm",
      "database" : "A Systematic Annotation Package for Community Analysis of Genomes",
      "example_id" : "ASAP:ABE-0000008",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "object" : "Feature identifier",
      "url_example" : "https://asap.ahabs.wisc.edu/annotation/php/feature_info.php?FeatureID=ABE-0000008",
      "uri_prefix" : null,
      "abbreviation" : "ASAP",
      "name" : null,
      "url_syntax" : "https://asap.ahabs.wisc.edu/annotation/php/feature_info.php?FeatureID=[example_id]",
      "id" : null
   },
   "wbbt" : {
      "entity_type" : "WBbt:0005766 ! anatomy",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "object" : "Identifier",
      "datatype" : null,
      "generic_url" : "http://www.wormbase.org/",
      "database" : "C. elegans gross anatomy",
      "example_id" : "WBbt:0005733",
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "WBbt",
      "name" : null,
      "local_id_syntax" : "[0-9]{7}"
   },
   "apidb_plasmodb" : {
      "url_syntax" : "http://www.plasmodb.org/gene/[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "ApiDB_PlasmoDB",
      "object" : "PlasmoDB Gene ID",
      "uri_prefix" : null,
      "url_example" : "http://www.plasmodb.org/gene/PF11_0344",
      "fullname" : null,
      "database" : "PlasmoDB Plasmodium Genome Resource",
      "generic_url" : "http://plasmodb.org/",
      "example_id" : "ApiDB_PlasmoDB:PF11_0344",
      "datatype" : null
   },
   "hgnc_gene" : {
      "generic_url" : "http://www.genenames.org/",
      "example_id" : "HGNC_gene:ABCA1",
      "database" : "HUGO Gene Nomenclature Committee",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.genenames.org/data/hgnc_data.php?app_sym=ABCA1",
      "object" : "Gene symbol",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "HGNC_gene",
      "id" : null,
      "url_syntax" : "http://www.genenames.org/data/hgnc_data.php?app_sym=[example_id]"
   },
   "unigene" : {
      "object" : "Identifier (for transcript cluster)",
      "url_example" : "http://www.ncbi.nlm.nih.gov/UniGene/clust.cgi?ORG=Hs&CID=212293",
      "uri_prefix" : null,
      "fullname" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/UniGene",
      "example_id" : "UniGene:Hs.212293",
      "database" : "UniGene",
      "datatype" : null,
      "description" : "NCBI transcript cluster database, organized by transcriptome. Each UniGene entry is a set of transcript sequences that appear to come from the same transcription locus (gene or expressed pseudogene).",
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/UniGene/clust.cgi?ORG=[organism_abbreviation]&CID=[cluster_id]",
      "name" : null,
      "abbreviation" : "UniGene"
   },
   "vbrc" : {
      "fullname" : null,
      "url_example" : "http://vbrc.org/query.asp?web_id=VBRC:F35742",
      "uri_prefix" : null,
      "object" : "Identifier",
      "datatype" : null,
      "database" : "Viral Bioinformatics Resource Center",
      "generic_url" : "http://vbrc.org",
      "example_id" : "VBRC:F35742",
      "url_syntax" : "http://vbrc.org/query.asp?web_id=VBRC:[example_id]",
      "id" : null,
      "abbreviation" : "VBRC",
      "name" : null
   },
   "fypo" : {
      "fullname" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "Identifier",
      "datatype" : null,
      "database" : "Fission Yeast Phenotype Ontology",
      "generic_url" : "http://www.pombase.org/",
      "example_id" : "FYPO:0000001",
      "url_syntax" : null,
      "id" : null,
      "abbreviation" : "FYPO",
      "name" : null,
      "local_id_syntax" : "^\\d{7}$"
   },
   "aracyc" : {
      "fullname" : null,
      "object" : "Identifier",
      "url_example" : "http://www.arabidopsis.org:1555/ARA/NEW-IMAGE?type=NIL&object=PWYQT-62",
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.arabidopsis.org/biocyc/index.jsp",
      "example_id" : "AraCyc:PWYQT-62",
      "database" : "AraCyc metabolic pathway database for Arabidopsis thaliana",
      "id" : null,
      "url_syntax" : "http://www.arabidopsis.org:1555/ARA/NEW-IMAGE?type=NIL&object=[example_id]",
      "abbreviation" : "AraCyc",
      "name" : null
   },
   "pubchem_compound" : {
      "local_id_syntax" : "^[0-9]+$",
      "name" : null,
      "abbreviation" : "PubChem_Compound",
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pccompound&term=[example_id]",
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "example_id" : "PubChem_Compound:2244",
      "database" : "NCBI PubChem database of chemical structures",
      "datatype" : null,
      "object" : "Identifier",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pccompound&term=2244",
      "uri_prefix" : null,
      "fullname" : null,
      "entity_type" : "CHEBI:24431 ! chemical entity"
   },
   "kegg_enzyme" : {
      "fullname" : null,
      "object" : "Enzyme Commission ID, as stored in KEGG",
      "uri_prefix" : null,
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?ec:2.1.1.4",
      "datatype" : null,
      "database" : "KEGG Enzyme Database",
      "generic_url" : "http://www.genome.jp/dbget-bin/www_bfind?enzyme",
      "example_id" : "KEGG_ENZYME:2.1.1.4",
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?ec:[example_id]",
      "id" : null,
      "abbreviation" : "KEGG_ENZYME",
      "local_id_syntax" : "^\\d(\\.\\d{1,2}){2}\\.\\d{1,3}$",
      "name" : null
   },
   "vz" : {
      "example_id" : "VZ:957",
      "generic_url" : "http://viralzone.expasy.org/",
      "database" : "ViralZone",
      "datatype" : null,
      "object" : "Page Reference Identifier",
      "uri_prefix" : null,
      "url_example" : "http://viralzone.expasy.org/all_by_protein/957.html",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "VZ",
      "id" : null,
      "url_syntax" : "http://viralzone.expasy.org/all_by_protein/[example_id].html"
   },
   "gr_ref" : {
      "abbreviation" : "GR_REF",
      "name" : null,
      "url_syntax" : "http://www.gramene.org/db/literature/pub_search?ref_id=[example_id]",
      "id" : null,
      "datatype" : null,
      "generic_url" : "http://www.gramene.org/",
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "example_id" : "GR_REF:659",
      "database" : null,
      "fullname" : null,
      "object" : "Reference",
      "uri_prefix" : null,
      "url_example" : "http://www.gramene.org/db/literature/pub_search?ref_id=659"
   },
   "mod" : {
      "datatype" : null,
      "generic_url" : "http://psidev.sourceforge.net/mod/",
      "example_id" : "MOD:00219",
      "database" : "Proteomics Standards Initiative protein modification ontology",
      "fullname" : null,
      "url_example" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:00219",
      "uri_prefix" : null,
      "object" : "Protein modification identifier",
      "abbreviation" : "MOD",
      "name" : null,
      "url_syntax" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:[example_id]",
      "id" : null
   },
   "prow" : {
      "name" : null,
      "abbreviation" : "PROW",
      "url_syntax" : null,
      "id" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/prow/",
      "example_id" : null,
      "database" : "Protein Reviews on the Web",
      "datatype" : null,
      "object" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "fullname" : null
   },
   "jcvi_cmr" : {
      "datatype" : null,
      "example_id" : "JCVI_CMR:VCA0557",
      "generic_url" : "http://cmr.jcvi.org/",
      "database" : "Comprehensive Microbial Resource at the J. Craig Venter Institute",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "object" : "Locus",
      "uri_prefix" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=VCA0557",
      "abbreviation" : "JCVI_CMR",
      "name" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=[example_id]",
      "id" : null
   },
   "ecogene_g" : {
      "datatype" : null,
      "example_id" : "ECOGENE_G:deoC",
      "generic_url" : "http://www.ecogene.org/",
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "fullname" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "EcoGene Primary Gene Name",
      "abbreviation" : "ECOGENE_G",
      "name" : null,
      "url_syntax" : null,
      "id" : null
   },
   "panther" : {
      "url_syntax" : "http://www.pantherdb.org/panther/lookupId.jsp?id=[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "PANTHER",
      "url_example" : "http://www.pantherdb.org/panther/lookupId.jsp?id=PTHR10000",
      "uri_prefix" : null,
      "object" : "Protein family tree identifier",
      "fullname" : null,
      "generic_url" : "http://www.pantherdb.org/",
      "database" : "Protein ANalysis THrough Evolutionary Relationships Classification System",
      "example_id" : "PANTHER:PTHR11455",
      "datatype" : null
   },
   "pirsf" : {
      "name" : null,
      "abbreviation" : "PIRSF",
      "url_syntax" : "http://pir.georgetown.edu/cgi-bin/ipcSF?id=[example_id]",
      "id" : null,
      "generic_url" : "http://pir.georgetown.edu/pirsf/",
      "database" : "PIR Superfamily Classification System",
      "example_id" : "PIRSF:SF002327",
      "datatype" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://pir.georgetown.edu/cgi-bin/ipcSF?id=SF002327",
      "fullname" : null
   },
   "vida" : {
      "name" : null,
      "abbreviation" : "VIDA",
      "url_syntax" : null,
      "id" : null,
      "database" : "Virus Database at University College London",
      "generic_url" : "http://www.biochem.ucl.ac.uk/bsm/virus_database/VIDA.html",
      "example_id" : null,
      "datatype" : null,
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "fullname" : null
   },
   "cazy" : {
      "url_syntax" : "http://www.cazy.org/[example_id].html",
      "id" : null,
      "name" : null,
      "local_id_syntax" : "^(CE|GH|GT|PL)\\d+$",
      "abbreviation" : "CAZY",
      "url_example" : "http://www.cazy.org/PL11.html",
      "uri_prefix" : null,
      "object" : "Identifier",
      "fullname" : null,
      "generic_url" : "http://www.cazy.org/",
      "database" : "Carbohydrate Active EnZYmes",
      "example_id" : "CAZY:PL11",
      "description" : "The CAZy database describes the families of structurally-related catalytic and carbohydrate-binding modules (or functional domains) of enzymes that degrade, modify, or create glycosidic bonds.",
      "datatype" : null
   },
   "kegg_ligand" : {
      "object" : "Compound",
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?cpd:C00577",
      "uri_prefix" : null,
      "fullname" : null,
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "generic_url" : "http://www.genome.ad.jp/kegg/docs/upd_ligand.html",
      "example_id" : "KEGG_LIGAND:C00577",
      "database" : "KEGG LIGAND Database",
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?cpd:[example_id]",
      "local_id_syntax" : "^C\\d{5}$",
      "name" : null,
      "abbreviation" : "KEGG_LIGAND"
   },
   "dflat" : {
      "datatype" : null,
      "database" : "Developmental FunctionaL Annotation at Tufts",
      "generic_url" : "http://bcb.cs.tufts.edu/dflat/",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "abbreviation" : "DFLAT",
      "name" : null,
      "id" : null,
      "url_syntax" : null
   },
   "sgd" : {
      "abbreviation" : "SGD",
      "name" : null,
      "local_id_syntax" : "^S[0-9]{9}$",
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "id" : null,
      "datatype" : null,
      "example_id" : "SGD:S000006169",
      "generic_url" : "http://www.yeastgenome.org/",
      "database" : "Saccharomyces Genome Database",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=S000006169",
      "object" : "Identifier for SGD Loci"
   },
   "fma" : {
      "uri_prefix" : null,
      "url_example" : null,
      "object" : "Identifier",
      "fullname" : null,
      "database" : "Foundational Model of Anatomy",
      "generic_url" : "http://sig.biostr.washington.edu/projects/fm/index.html",
      "example_id" : "FMA:61905",
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "name" : null,
      "abbreviation" : "FMA"
   },
   "intact" : {
      "example_id" : "IntAct:EBI-17086",
      "generic_url" : "http://www.ebi.ac.uk/intact/",
      "database" : "IntAct protein interaction database",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.ebi.ac.uk/intact/search/do/search?searchString=EBI-17086",
      "object" : "Accession",
      "entity_type" : "MI:0315 ! protein complex ",
      "fullname" : null,
      "name" : null,
      "local_id_syntax" : "^[0-9]+$",
      "abbreviation" : "IntAct",
      "id" : null,
      "url_syntax" : "http://www.ebi.ac.uk/intact/search/do/search?searchString=[example_id]"
   },
   "pubmed" : {
      "local_id_syntax" : "^[0-9]+$",
      "name" : null,
      "abbreviation" : "PubMed",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/pubmed/[example_id]",
      "id" : null,
      "example_id" : "PMID:4208797",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/PubMed/",
      "database" : "PubMed",
      "datatype" : null,
      "object" : "Identifier",
      "url_example" : "http://www.ncbi.nlm.nih.gov/pubmed/4208797",
      "uri_prefix" : null,
      "fullname" : null
   },
   "isbn" : {
      "uri_prefix" : null,
      "url_example" : "https://en.wikipedia.org/w/index.php?title=Special%3ABookSources&isbn=0123456789",
      "object" : "Identifier",
      "fullname" : null,
      "database" : "International Standard Book Number",
      "generic_url" : "http://isbntools.com/",
      "example_id" : "ISBN:0781702534",
      "datatype" : null,
      "url_syntax" : "https://en.wikipedia.org/w/index.php?title=Special%3ABookSources&isbn=[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "ISBN"
   },
   "reactome" : {
      "database" : "Reactome - a curated knowledgebase of biological pathways",
      "generic_url" : "http://www.reactome.org/",
      "example_id" : "Reactome:REACT_604",
      "datatype" : null,
      "object" : "Identifier",
      "url_example" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=REACT_604",
      "uri_prefix" : null,
      "fullname" : null,
      "local_id_syntax" : "^REACT_[0-9]+$",
      "name" : null,
      "abbreviation" : "Reactome",
      "url_syntax" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=[example_id]",
      "id" : null
   },
   "genedb_spombe" : {
      "example_id" : "GeneDB_Spombe:SPAC890.04C",
      "uri_prefix" : null,
      "url_example" : "http://old.genedb.org/genedb/Search?organism=pombe&name=SPAC890.04C",
      "entity_type" : "SO:0000704 ! gene ",
      "shorthand_name" : "Spombe",
      "fullname" : null,
      "abbreviation" : "GeneDB_Spombe",
      "url_syntax" : "http://old.genedb.org/genedb/Search?organism=pombe&name=[example_id]",
      "id" : null,
      "database" : "Schizosaccharomyces pombe GeneDB",
      "generic_url" : "http://old.genedb.org/genedb/pombe/index.jsp",
      "is_obsolete" : "true",
      "datatype" : null,
      "object" : "Gene identifier",
      "name" : null,
      "replaced_by" : "PomBase",
      "local_id_syntax" : "^SP[A-Z0-9]+\\.[A-Za-z0-9]+$"
   },
   "ncbi_np" : {
      "fullname" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "Protein identifier",
      "datatype" : null,
      "database" : "NCBI RefSeq",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "example_id" : "NCBI_NP:123456",
      "is_obsolete" : "true",
      "url_syntax" : null,
      "id" : null,
      "abbreviation" : "NCBI_NP",
      "replaced_by" : "RefSeq",
      "name" : null
   },
   "hugo" : {
      "abbreviation" : "HUGO",
      "name" : null,
      "id" : null,
      "url_syntax" : null,
      "datatype" : null,
      "example_id" : null,
      "generic_url" : "http://www.hugo-international.org/",
      "database" : "Human Genome Organisation",
      "fullname" : null,
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null
   },
   "gr_protein" : {
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "object" : "Protein identifier",
      "url_example" : "http://www.gramene.org/db/protein/protein_search?acc=Q6VSV0",
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "GR_PROTEIN:Q6VSV0",
      "database" : null,
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "generic_url" : "http://www.gramene.org/",
      "url_syntax" : "http://www.gramene.org/db/protein/protein_search?acc=[example_id]",
      "id" : null,
      "abbreviation" : "GR_protein",
      "local_id_syntax" : "^[A-Z][0-9][A-Z0-9]{3}[0-9]$",
      "name" : null
   },
   "pato" : {
      "name" : null,
      "abbreviation" : "PATO",
      "url_syntax" : null,
      "id" : null,
      "generic_url" : "http://www.bioontology.org/wiki/index.php/PATO:Main_Page",
      "example_id" : "PATO:0001420",
      "database" : "Phenotypic quality ontology",
      "datatype" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "Identifier",
      "fullname" : null
   },
   "kegg_pathway" : {
      "database" : "KEGG Pathways Database",
      "generic_url" : "http://www.genome.jp/kegg/pathway.html",
      "example_id" : "KEGG_PATHWAY:ot00020",
      "datatype" : null,
      "object" : "Pathway",
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?path:ot00020",
      "uri_prefix" : null,
      "fullname" : null,
      "name" : null,
      "abbreviation" : "KEGG_PATHWAY",
      "id" : null,
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?path:[example_id]"
   },
   "ensemblfungi" : {
      "database" : "Ensembl Fungi, the Ensembl Genomes database for accessing fungal genome data",
      "generic_url" : "http://fungi.ensembl.org/",
      "example_id" : "EnsemblFungi:YOR197W",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.ensemblgenomes.org/id/YOR197W",
      "object" : "Identifier",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "EnsemblFungi",
      "id" : null,
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]"
   },
   "maizegdb" : {
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.maizegdb.org/cgi-bin/id_search.cgi?id=881225",
      "object" : "MaizeGDB Object ID Number",
      "datatype" : null,
      "generic_url" : "http://www.maizegdb.org",
      "example_id" : "MaizeGDB:881225",
      "database" : "MaizeGDB",
      "id" : null,
      "url_syntax" : "http://www.maizegdb.org/cgi-bin/id_search.cgi?id=[example_id]",
      "abbreviation" : "MaizeGDB",
      "name" : null
   },
   "taxon" : {
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "abbreviation" : "taxon",
      "name" : null,
      "fullname" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "datatype" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "example_id" : "taxon:7227",
      "database" : "NCBI Taxonomy"
   },
   "sgd_ref" : {
      "id" : null,
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "abbreviation" : "SGD_REF",
      "name" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://db.yeastgenome.org/cgi-bin/reference/reference.pl?dbid=S000049602",
      "object" : "Literature Reference Identifier",
      "datatype" : null,
      "generic_url" : "http://www.yeastgenome.org/",
      "database" : "Saccharomyces Genome Database",
      "example_id" : "SGD_REF:S000049602"
   },
   "tigr_pfa1" : {
      "object" : "Accession",
      "uri_prefix" : null,
      "url_example" : null,
      "fullname" : null,
      "is_obsolete" : "true",
      "database" : "Plasmodium falciparum database at the J. Craig Venter Institute",
      "generic_url" : "http://www.tigr.org/tdb/e2k1/pfa1/pfa1.shtml",
      "example_id" : "JCVI_Pfa1:PFB0010w",
      "datatype" : null,
      "url_syntax" : null,
      "id" : null,
      "name" : null,
      "abbreviation" : "TIGR_Pfa1"
   },
   "eco" : {
      "name" : null,
      "local_id_syntax" : "^\\d{7}$",
      "abbreviation" : "ECO",
      "id" : null,
      "url_syntax" : null,
      "generic_url" : "http://www.geneontology.org/",
      "database" : "Evidence Code ontology",
      "example_id" : "ECO:0000002",
      "datatype" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "Identifier",
      "fullname" : null
   },
   "omim" : {
      "database" : "Mendelian Inheritance in Man",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=OMIM",
      "example_id" : "OMIM:190198",
      "datatype" : null,
      "object" : "Identifier",
      "url_example" : "http://omim.org/entry/190198",
      "uri_prefix" : null,
      "fullname" : null,
      "name" : null,
      "abbreviation" : "OMIM",
      "url_syntax" : "http://omim.org/entry/[example_id]",
      "id" : null
   },
   "smd" : {
      "abbreviation" : "SMD",
      "name" : null,
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "generic_url" : "http://genome-www.stanford.edu/microarray",
      "example_id" : null,
      "database" : "Stanford Microarray Database",
      "fullname" : null,
      "object" : null,
      "uri_prefix" : null,
      "url_example" : null
   },
   "pamgo_vmd" : {
      "abbreviation" : "PAMGO_VMD",
      "name" : null,
      "url_syntax" : "http://vmd.vbi.vt.edu/cgi-bin/browse/go_detail.cgi?gene_id=[example_id]",
      "id" : null,
      "datatype" : null,
      "description" : "Virginia Bioinformatics Institute Microbial Database; member of PAMGO Interest Group",
      "generic_url" : "http://phytophthora.vbi.vt.edu",
      "example_id" : "PAMGO_VMD:109198",
      "database" : "Virginia Bioinformatics Institute Microbial Database",
      "fullname" : null,
      "object" : "Gene identifier",
      "url_example" : "http://vmd.vbi.vt.edu/cgi-bin/browse/go_detail.cgi?gene_id=109198",
      "uri_prefix" : null
   },
   "cgd" : {
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "object" : "Identifier for CGD Loci",
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=CAL0005516",
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : "CGD:CAL0005516",
      "generic_url" : "http://www.candidagenome.org/",
      "database" : "Candida Genome Database",
      "id" : null,
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "abbreviation" : "CGD",
      "local_id_syntax" : "^(CAL|CAF)[0-9]{7}$",
      "name" : null
   },
   "um-bbd_ruleid" : {
      "object" : "Rule identifier",
      "uri_prefix" : null,
      "url_example" : "http://umbbd.msi.umn.edu/servlets/rule.jsp?rule=bt0330",
      "fullname" : null,
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "example_id" : "UM-BBD_ruleID:bt0330",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "datatype" : null,
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/rule.jsp?rule=[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "UM-BBD_ruleID"
   },
   "psi-mi" : {
      "generic_url" : "http://psidev.sourceforge.net/mi/xml/doc/user/index.html",
      "database" : "Proteomic Standard Initiative for Molecular Interaction",
      "example_id" : "MI:0018",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "object" : "Interaction identifier",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "PSI-MI",
      "id" : null,
      "url_syntax" : null
   },
   "gene3d" : {
      "abbreviation" : "Gene3D",
      "name" : null,
      "url_syntax" : "http://gene3d.biochem.ucl.ac.uk/superfamily/?accession=[example_id]",
      "id" : null,
      "datatype" : null,
      "generic_url" : "http://gene3d.biochem.ucl.ac.uk/Gene3D/",
      "database" : "Domain Architecture Classification",
      "example_id" : "Gene3D:G3DSA:3.30.390.30",
      "fullname" : null,
      "object" : "Accession",
      "uri_prefix" : null,
      "url_example" : "http://gene3d.biochem.ucl.ac.uk/superfamily/?accession=G3DSA%3A3.30.390.30"
   },
   "psi-mod" : {
      "example_id" : "MOD:00219",
      "generic_url" : "http://psidev.sourceforge.net/mod/",
      "database" : "Proteomics Standards Initiative protein modification ontology",
      "datatype" : null,
      "object" : "Protein modification identifier",
      "url_example" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:00219",
      "uri_prefix" : null,
      "fullname" : null,
      "name" : null,
      "abbreviation" : "PSI-MOD",
      "id" : null,
      "url_syntax" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:[example_id]"
   },
   "genedb_lmajor" : {
      "example_id" : "GeneDB_Lmajor:LM5.32",
      "url_example" : "http://www.genedb.org/genedb/Search?organism=leish&name=LM5.32",
      "uri_prefix" : null,
      "shorthand_name" : "Lmajor",
      "fullname" : null,
      "abbreviation" : "GeneDB_Lmajor",
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=leish&name=[example_id]",
      "id" : null,
      "database" : "Leishmania major GeneDB",
      "generic_url" : "http://www.genedb.org/genedb/leish/",
      "is_obsolete" : "true",
      "datatype" : null,
      "object" : "Gene identifier",
      "name" : null,
      "replaced_by" : "GeneDB",
      "local_id_syntax" : "^LmjF\\.\\d+\\.\\d+$"
   },
   "broad_neurospora" : {
      "url_example" : "http://www.broadinstitute.org/annotation/genome/neurospora/GeneDetails.html?sp=S7000007580576824",
      "uri_prefix" : null,
      "object" : "Identifier for Broad_Ncrassa Loci",
      "fullname" : null,
      "example_id" : "BROAD_NEUROSPORA:7000007580576824",
      "generic_url" : "http://www.broadinstitute.org/annotation/genome/neurospora/MultiHome.html",
      "database" : "Neurospora crassa Database",
      "description" : "Neurospora crassa database at the Broad Institute",
      "datatype" : null,
      "url_syntax" : "http://www.broadinstitute.org/annotation/genome/neurospora/GeneDetails.html?sp=S[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "Broad_NEUROSPORA"
   },
   "rnamods" : {
      "example_id" : "RNAmods:037",
      "generic_url" : "http://s59.cas.albany.edu/RNAmods/",
      "database" : "RNA Modification Database",
      "datatype" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?091",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "RNAmods",
      "id" : null,
      "url_syntax" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?[example_id]"
   },
   "ecoliwiki" : {
      "url_syntax" : null,
      "id" : null,
      "abbreviation" : "EcoliWiki",
      "local_id_syntax" : "^[A-Za-z]{3,4}$",
      "name" : null,
      "fullname" : null,
      "object" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "datatype" : null,
      "description" : "EcoliHub's subsystem for community annotation of E. coli K-12",
      "generic_url" : "http://ecoliwiki.net/",
      "database" : "EcoliWiki from EcoliHub",
      "example_id" : null
   },
   "genbank" : {
      "abbreviation" : "GenBank",
      "local_id_syntax" : "^[A-Z]{2}[0-9]{6}$",
      "name" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=[example_id]",
      "id" : null,
      "datatype" : null,
      "description" : "The NIH genetic sequence database, an annotated collection of all publicly available DNA sequences.",
      "database" : "GenBank",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "example_id" : "GB:AA816246",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein ",
      "object" : "Sequence accession",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=AA816246",
      "uri_prefix" : null
   },
   "h-invdb_cdna" : {
      "name" : null,
      "abbreviation" : "H-invDB_cDNA",
      "url_syntax" : "http://www.h-invitational.jp/hinv/spsoup/transcript_view?acc_id=[example_id]",
      "id" : null,
      "generic_url" : "http://www.h-invitational.jp/",
      "example_id" : "H-invDB_cDNA:AK093148",
      "database" : "H-invitational Database",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.h-invitational.jp/hinv/spsoup/transcript_view?acc_id=AK093149",
      "object" : "Accession",
      "fullname" : null
   },
   "rebase" : {
      "name" : null,
      "abbreviation" : "REBASE",
      "url_syntax" : "http://rebase.neb.com/rebase/enz/[example_id].html",
      "id" : null,
      "generic_url" : "http://rebase.neb.com/rebase/rebase.html",
      "database" : "REBASE restriction enzyme database",
      "example_id" : "REBASE:EcoRI",
      "datatype" : null,
      "object" : "Restriction enzyme name",
      "uri_prefix" : null,
      "url_example" : "http://rebase.neb.com/rebase/enz/EcoRI.html",
      "fullname" : null
   },
   "cas_spc" : {
      "name" : null,
      "abbreviation" : "CAS_SPC",
      "id" : null,
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=[example_id]",
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "example_id" : null,
      "database" : "Catalog of Fishes species database",
      "datatype" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=1979",
      "uri_prefix" : null,
      "object" : "Identifier",
      "fullname" : null
   },
   "chebi" : {
      "id" : null,
      "url_syntax" : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:[example_id]",
      "abbreviation" : "ChEBI",
      "name" : null,
      "local_id_syntax" : "^[0-9]{1,6}$",
      "entity_type" : "CHEBI:24431 ! chemical entity ",
      "fullname" : null,
      "url_example" : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:17234",
      "uri_prefix" : null,
      "object" : "Identifier",
      "datatype" : null,
      "example_id" : "CHEBI:17234",
      "generic_url" : "http://www.ebi.ac.uk/chebi/",
      "database" : "Chemical Entities of Biological Interest"
   },
   "imgt_ligm" : {
      "fullname" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null,
      "description" : "Database of immunoglobulins and T cell receptors from human and other vertebrates, with translation for fully annotated sequences.",
      "datatype" : null,
      "database" : "ImMunoGeneTics database covering immunoglobulins and T-cell receptors",
      "generic_url" : "http://imgt.cines.fr",
      "example_id" : "IMGT_LIGM:U03895",
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "IMGT_LIGM",
      "name" : null
   },
   "cacao" : {
      "name" : null,
      "abbreviation" : "CACAO",
      "id" : null,
      "url_syntax" : "http://gowiki.tamu.edu/wiki/index.php/[example_id]",
      "database" : "Community Assessment of Community Annotation with Ontologies",
      "generic_url" : "http://gowiki.tamu.edu/wiki/index.php/Category:CACAO",
      "example_id" : "MYCS2:A0QNF5",
      "datatype" : null,
      "description" : "The Community Assessment of Community Annotation with Ontologies (CACAO) is a project to do large-scale manual community annotation of gene function using the Gene Ontology as a multi-institution student competition. ",
      "object" : "accession",
      "url_example" : "http://gowiki.tamu.edu/wiki/index.php/MYCS2:A0QNF5",
      "uri_prefix" : null,
      "fullname" : null
   },
   "jcvi_pfa1" : {
      "name" : null,
      "abbreviation" : "JCVI_Pfa1",
      "id" : null,
      "url_syntax" : null,
      "is_obsolete" : "true",
      "generic_url" : "http://www.tigr.org/tdb/e2k1/pfa1/pfa1.shtml",
      "example_id" : "JCVI_Pfa1:PFB0010w",
      "database" : "Plasmodium falciparum database at the J. Craig Venter Institute",
      "datatype" : null,
      "object" : "Accession",
      "url_example" : null,
      "uri_prefix" : null,
      "fullname" : null
   },
   "locusid" : {
      "abbreviation" : "LocusID",
      "name" : null,
      "local_id_syntax" : "^\\d+$",
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "datatype" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "example_id" : "NCBI_Gene:4771",
      "database" : "NCBI Gene",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "object" : "Identifier"
   },
   "tgd_locus" : {
      "url_example" : "http://db.ciliate.org/cgi-bin/locus.pl?locus=PDD1",
      "uri_prefix" : null,
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "fullname" : null,
      "example_id" : "TGD_LOCUS:PDD1",
      "generic_url" : "http://www.ciliate.org/",
      "database" : "Tetrahymena Genome Database",
      "datatype" : null,
      "url_syntax" : "http://db.ciliate.org/cgi-bin/locus.pl?locus=[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "TGD_LOCUS"
   },
   "hpa" : {
      "generic_url" : "http://www.proteinatlas.org/",
      "database" : "Human Protein Atlas tissue profile information",
      "example_id" : "HPA:HPA000237",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.proteinatlas.org/tissue_profile.php?antibody_id=HPA000237",
      "object" : "Identifier",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "HPA",
      "id" : null,
      "url_syntax" : "http://www.proteinatlas.org/tissue_profile.php?antibody_id=[example_id]"
   },
   "subtilistg" : {
      "example_id" : "SUBTILISTG:accC",
      "generic_url" : "http://genolist.pasteur.fr/SubtiList/",
      "database" : "Bacillus subtilis Genome Sequence Project",
      "datatype" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "Gene symbol",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "SUBTILISTG",
      "id" : null,
      "url_syntax" : null
   },
   "cog" : {
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null,
      "fullname" : null,
      "database" : "NCBI Clusters of Orthologous Groups",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "example_id" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "name" : null,
      "abbreviation" : "COG"
   },
   "pseudocap" : {
      "database" : "Pseudomonas Genome Project",
      "generic_url" : "http://v2.pseudomonas.com/",
      "example_id" : "PseudoCAP:PA4756",
      "datatype" : null,
      "url_example" : "http://v2.pseudomonas.com/getAnnotation.do?locusID=PA4756",
      "uri_prefix" : null,
      "object" : "Identifier",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "PseudoCAP",
      "id" : null,
      "url_syntax" : "http://v2.pseudomonas.com/getAnnotation.do?locusID=[example_id]"
   },
   "seed" : {
      "name" : null,
      "abbreviation" : "SEED",
      "url_syntax" : "http://www.theseed.org/linkin.cgi?id=[example_id]",
      "id" : null,
      "example_id" : "SEED:fig|83331.1.peg.1",
      "generic_url" : "http://www.theseed.org",
      "database" : "The SEED;",
      "datatype" : null,
      "description" : "Project to annotate the first 1000 sequenced genomes, develop detailed metabolic reconstructions, and construct the corresponding stoichiometric matrices",
      "object" : "identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.theseed.org/linkin.cgi?id=fig|83331.1.peg.1",
      "fullname" : null
   },
   "gonuts" : {
      "fullname" : null,
      "url_example" : "http://gowiki.tamu.edu/wiki/index.php/MOUSE:CD28",
      "uri_prefix" : null,
      "object" : "Identifier (for gene or gene product)",
      "description" : "Third party documentation for GO and community annotation system.",
      "datatype" : null,
      "generic_url" : "http://gowiki.tamu.edu",
      "database" : "Gene Ontology Normal Usage Tracking System (GONUTS)",
      "example_id" : "GONUTS:MOUSE:CD28",
      "id" : null,
      "url_syntax" : "http://gowiki.tamu.edu/wiki/index.php/[example_id]",
      "abbreviation" : "GONUTS",
      "name" : null
   },
   "bfo" : {
      "id" : null,
      "url_syntax" : "http://purl.obolibrary.org/obo/BFO_[example_id]",
      "name" : null,
      "abbreviation" : "BFO",
      "uri_prefix" : null,
      "url_example" : "http://purl.obolibrary.org/obo/BFO_0000066",
      "object" : null,
      "fullname" : null,
      "generic_url" : "http://purl.obolibrary.org/obo/bfo",
      "database" : "Basic Formal Ontology",
      "example_id" : "BFO:0000066",
      "description" : "An upper ontology used by Open Bio Ontologies (OBO) Foundry. BFO contains upper-level classes as well as core relations such as part_of (BFO_0000050)",
      "datatype" : null
   },
   "dictybase_gene_name" : {
      "database" : "dictyBase",
      "generic_url" : "http://dictybase.org",
      "example_id" : "dictyBase_gene_name:mlcE",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://dictybase.org/gene/mlcE",
      "object" : "Gene name",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "dictyBase_gene_name",
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "id" : null
   },
   "unimod" : {
      "name" : null,
      "abbreviation" : "UniMod",
      "url_syntax" : "http://www.unimod.org/modifications_view.php?editid1=[example_id]",
      "id" : null,
      "generic_url" : "http://www.unimod.org/",
      "database" : "UniMod",
      "example_id" : "UniMod:1287",
      "datatype" : null,
      "description" : "protein modifications for mass spectrometry",
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://www.unimod.org/modifications_view.php?editid1=1287",
      "fullname" : null
   },
   "biomdid" : {
      "url_syntax" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=[example_id]",
      "id" : null,
      "abbreviation" : "BIOMDID",
      "name" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=BIOMD0000000045",
      "object" : "Accession",
      "datatype" : null,
      "database" : "BioModels Database",
      "example_id" : "BIOMD:BIOMD0000000045",
      "generic_url" : "http://www.ebi.ac.uk/biomodels/"
   },
   "nmpdr" : {
      "name" : null,
      "abbreviation" : "NMPDR",
      "id" : null,
      "url_syntax" : "http://www.nmpdr.org/linkin.cgi?id=[example_id]",
      "database" : "National Microbial Pathogen Data Resource",
      "generic_url" : "http://www.nmpdr.org",
      "example_id" : "NMPDR:fig|306254.1.peg.183",
      "datatype" : null,
      "object" : "Identifier",
      "url_example" : "http://www.nmpdr.org/linkin.cgi?id=fig|306254.1.peg.183",
      "uri_prefix" : null,
      "fullname" : null
   },
   "ncbitaxon" : {
      "abbreviation" : "NCBITaxon",
      "name" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "id" : null,
      "datatype" : null,
      "database" : "NCBI Taxonomy",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "example_id" : "taxon:7227",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "object" : "Identifier"
   },
   "ecocyc" : {
      "id" : null,
      "url_syntax" : "http://biocyc.org/ECOLI/NEW-IMAGE?type=PATHWAY&object=[example_id]",
      "abbreviation" : "EcoCyc",
      "name" : null,
      "local_id_syntax" : "^EG[0-9]{5}$",
      "entity_type" : "GO:0008150 ! biological process",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://biocyc.org/ECOLI/NEW-IMAGE?type=PATHWAY&object=P2-PWY",
      "object" : "Pathway identifier",
      "datatype" : null,
      "generic_url" : "http://ecocyc.org/",
      "database" : "Encyclopedia of E. coli metabolism",
      "example_id" : "EcoCyc:P2-PWY"
   },
   "pinc" : {
      "example_id" : null,
      "generic_url" : "http://www.proteome.com/",
      "database" : "Proteome Inc.",
      "description" : "represents GO annotations created in 2001 for NCBI and extracted into UniProtKB-GOA from EntrezGene",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : null,
      "object" : null,
      "fullname" : null,
      "name" : null,
      "abbreviation" : "PINC",
      "id" : null,
      "url_syntax" : null
   },
   "gb" : {
      "local_id_syntax" : "^[A-Z]{2}[0-9]{6}$",
      "name" : null,
      "abbreviation" : "GB",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=[example_id]",
      "id" : null,
      "example_id" : "GB:AA816246",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "database" : "GenBank",
      "datatype" : null,
      "description" : "The NIH genetic sequence database, an annotated collection of all publicly available DNA sequences.",
      "object" : "Sequence accession",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=AA816246",
      "uri_prefix" : null,
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein "
   },
   "nasc_code" : {
      "abbreviation" : "NASC_code",
      "name" : null,
      "url_syntax" : "http://seeds.nottingham.ac.uk/NASC/stockatidb.lasso?code=[example_id]",
      "id" : null,
      "datatype" : null,
      "example_id" : "NASC_code:N3371",
      "generic_url" : "http://arabidopsis.info",
      "database" : "Nottingham Arabidopsis Stock Centre Seeds Database",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://seeds.nottingham.ac.uk/NASC/stockatidb.lasso?code=N3371",
      "object" : "NASC code Identifier"
   },
   "h-invdb" : {
      "datatype" : null,
      "generic_url" : "http://www.h-invitational.jp/",
      "example_id" : null,
      "database" : "H-invitational Database",
      "fullname" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null,
      "abbreviation" : "H-invDB",
      "name" : null,
      "id" : null,
      "url_syntax" : null
   },
   "uniprotkb/swiss-prot" : {
      "object" : "Accession",
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "uri_prefix" : null,
      "fullname" : null,
      "is_obsolete" : "true",
      "generic_url" : "http://www.uniprot.org",
      "database" : "UniProtKB/Swiss-Prot",
      "example_id" : "Swiss-Prot:P51587",
      "datatype" : null,
      "description" : "A curated protein sequence database which provides a high level of annotation and a minimal level of redundancy",
      "id" : null,
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "name" : null,
      "replaced_by" : "UniProtKB",
      "abbreviation" : "UniProtKB/Swiss-Prot"
   },
   "mgd" : {
      "id" : null,
      "! url_syntax" : "http://www.informatics.jax.org/searches/marker.cgi?",
      "url_syntax" : null,
      "name" : null,
      "abbreviation" : "MGD",
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "Gene symbol",
      "fullname" : null,
      "generic_url" : "http://www.informatics.jax.org/",
      "database" : "Mouse Genome Database",
      "example_id" : "MGD:Adcy9",
      "datatype" : null
   },
   "maizegdb_locus" : {
      "fullname" : null,
      "url_example" : "http://www.maizegdb.org/cgi-bin/displaylocusresults.cgi?term=ZmPK1",
      "uri_prefix" : null,
      "object" : "Maize gene name",
      "datatype" : null,
      "generic_url" : "http://www.maizegdb.org",
      "example_id" : "MaizeGDB_Locus:ZmPK1",
      "database" : "MaizeGDB",
      "url_syntax" : "http://www.maizegdb.org/cgi-bin/displaylocusresults.cgi?term=[example_id]",
      "id" : null,
      "abbreviation" : "MaizeGDB_Locus",
      "name" : null,
      "local_id_syntax" : "^[A-Za-z][A-Za-z0-9]*$"
   },
   "ensembl_transcriptid" : {
      "datatype" : null,
      "database" : "Ensembl database of automatically annotated genomic data",
      "generic_url" : "http://www.ensembl.org/",
      "example_id" : "ENSEMBL_TranscriptID:ENST00000371959",
      "fullname" : null,
      "entity_type" : "SO:0000673 ! transcript",
      "object" : "Transcript identifier",
      "url_example" : "http://www.ensembl.org/id/ENST00000371959",
      "uri_prefix" : null,
      "abbreviation" : "ENSEMBL_TranscriptID",
      "local_id_syntax" : "^ENST[0-9]{9,16}$",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://www.ensembl.org/id/[example_id]"
   },
   "pombase" : {
      "datatype" : null,
      "generic_url" : "http://www.pombase.org/",
      "example_id" : "PomBase:SPBC11B10.09",
      "database" : "PomBase",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene ",
      "object" : "Identifier",
      "url_example" : "http://www.pombase.org/spombe/result/SPBC11B10.09",
      "uri_prefix" : null,
      "abbreviation" : "PomBase",
      "local_id_syntax" : "^S\\w+(\\.)?\\w+(\\.)?$",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://www.pombase.org/spombe/result/[example_id]"
   },
   "biocyc" : {
      "database" : "BioCyc collection of metabolic pathway databases",
      "generic_url" : "http://biocyc.org/",
      "example_id" : "BioCyc:PWY-5271",
      "datatype" : null,
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://biocyc.org/META/NEW-IMAGE?type=PATHWAY&object=PWY-5271",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "BioCyc",
      "url_syntax" : "http://biocyc.org/META/NEW-IMAGE?type=PATHWAY&object=[example_id]",
      "id" : null
   },
   "echobase" : {
      "abbreviation" : "EchoBASE",
      "name" : null,
      "local_id_syntax" : "^EB[0-9]{4}$",
      "url_syntax" : "http://www.biolws1.york.ac.uk/echobase/Gene.cfm?recordID=[example_id]",
      "id" : null,
      "datatype" : null,
      "example_id" : "EchoBASE:EB0231",
      "generic_url" : "http://www.ecoli-york.org/",
      "database" : "EchoBASE post-genomic database for Escherichia coli",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "url_example" : "http://www.biolws1.york.ac.uk/echobase/Gene.cfm?recordID=EB0231",
      "uri_prefix" : null,
      "object" : "Identifier"
   },
   "cgd_ref" : {
      "name" : null,
      "abbreviation" : "CGD_REF",
      "id" : null,
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "database" : "Candida Genome Database",
      "generic_url" : "http://www.candidagenome.org/",
      "example_id" : "CGD_REF:1490",
      "datatype" : null,
      "object" : "Literature Reference Identifier",
      "url_example" : "http://www.candidagenome.org/cgi-bin/reference/reference.pl?dbid=1490",
      "uri_prefix" : null,
      "fullname" : null
   },
   "ddanat" : {
      "name" : null,
      "local_id_syntax" : "[0-9]{7}",
      "abbreviation" : "DDANAT",
      "id" : null,
      "url_syntax" : null,
      "generic_url" : "http://dictybase.org/Dicty_Info/dicty_anatomy_ontology.html",
      "database" : "Dictyostelium discoideum anatomy",
      "example_id" : "DDANAT:0000068",
      "datatype" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "Identifier",
      "entity_type" : "UBERON:0001062 ! anatomical entity",
      "fullname" : null
   },
   "dictybase" : {
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "url_example" : "http://dictybase.org/gene/DDB_G0277859",
      "uri_prefix" : null,
      "object" : "Identifier",
      "datatype" : null,
      "generic_url" : "http://dictybase.org",
      "example_id" : "dictyBase:DDB_G0277859",
      "database" : "dictyBase",
      "id" : null,
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "abbreviation" : "DictyBase",
      "name" : null,
      "local_id_syntax" : "^DDB_G[0-9]{7}$"
   },
   "kegg_reaction" : {
      "abbreviation" : "KEGG_REACTION",
      "name" : null,
      "local_id_syntax" : "^R\\d+$",
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?rn:[example_id]",
      "id" : null,
      "datatype" : null,
      "generic_url" : "http://www.genome.jp/kegg/reaction/",
      "example_id" : "KEGG:R02328",
      "database" : "KEGG Reaction Database",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?rn:R02328",
      "object" : "Reaction"
   },
   "doi" : {
      "fullname" : null,
      "object" : "Identifier",
      "url_example" : "http://dx.doi.org/DOI:10.1016/S0963-9969(99)00021-6",
      "uri_prefix" : null,
      "datatype" : null,
      "database" : "Digital Object Identifier",
      "generic_url" : "http://dx.doi.org/",
      "example_id" : "DOI:10.1016/S0963-9969(99)00021-6",
      "url_syntax" : "http://dx.doi.org/DOI:[example_id]",
      "id" : null,
      "abbreviation" : "DOI",
      "local_id_syntax" : "^10\\.[0-9]+\\/.*$",
      "name" : null
   },
   "obo_sf_po" : {
      "fullname" : null,
      "object" : "Term request",
      "uri_prefix" : null,
      "url_example" : "https://sourceforge.net/tracker/index.php?func=detail&aid=3184921&group_id=76834&atid=835555",
      "datatype" : null,
      "example_id" : "OBO_SF_PO:3184921",
      "generic_url" : "http://sourceforge.net/tracker/?func=browse&group_id=76834&atid=835555",
      "database" : "Source Forge OBO Plant Ontology (PO) term request tracker",
      "id" : null,
      "url_syntax" : "https://sourceforge.net/tracker/index.php?func=detail&aid=[example_id]&group_id=76834&atid=835555",
      "abbreviation" : "OBO_SF_PO",
      "name" : null
   },
   "poc" : {
      "name" : null,
      "abbreviation" : "POC",
      "id" : null,
      "url_syntax" : null,
      "generic_url" : "http://www.plantontology.org/",
      "example_id" : null,
      "database" : "Plant Ontology Consortium",
      "datatype" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : null,
      "fullname" : null
   },
   "uniprot" : {
      "entity_type" : "PR:000000001 ! protein ",
      "fullname" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "object" : "Accession",
      "description" : "A central repository of protein sequence and function created by joining the information contained in Swiss-Prot, TrEMBL, and PIR database",
      "datatype" : null,
      "example_id" : "UniProtKB:P51587",
      "database" : "Universal Protein Knowledgebase",
      "generic_url" : "http://www.uniprot.org",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "id" : null,
      "abbreviation" : "UniProt",
      "name" : null,
      "local_id_syntax" : "^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z]([0-9][A-Z][A-Z0-9]{2}){1,2}[0-9])((-[0-9]+)|:PRO_[0-9]{10}|:VAR_[0-9]{6}){0,1}$"
   },
   "eck" : {
      "name" : null,
      "local_id_syntax" : "^ECK[0-9]{4}$",
      "abbreviation" : "ECK",
      "id" : null,
      "url_syntax" : "http://www.ecogene.org/geneInfo.php?eck_id=[example_id]",
      "generic_url" : "http://www.ecogene.org/",
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "example_id" : "ECK:ECK3746",
      "datatype" : null,
      "url_example" : "http://www.ecogene.org/geneInfo.php?eck_id=ECK3746",
      "uri_prefix" : null,
      "object" : "ECK accession (E. coli K-12 gene identifier)",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null
   },
   "wbls" : {
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : null,
      "fullname" : null,
      "entity_type" : "WBls:0000075 ! nematoda Life Stage",
      "database" : "C. elegans development",
      "generic_url" : "http://www.wormbase.org/",
      "example_id" : "WBls:0000010",
      "datatype" : null,
      "url_syntax" : null,
      "id" : null,
      "local_id_syntax" : "[0-9]{7}",
      "name" : null,
      "abbreviation" : "WBls"
   },
   "po_ref" : {
      "abbreviation" : "PO_REF",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://wiki.plantontology.org:8080/index.php/PO_REF:[example_id]",
      "datatype" : null,
      "generic_url" : "http://wiki.plantontology.org:8080/index.php/PO_references",
      "example_id" : "PO_REF:00001",
      "database" : "Plant Ontology custom references",
      "fullname" : null,
      "url_example" : "http://wiki.plantontology.org:8080/index.php/PO_REF:00001",
      "uri_prefix" : null,
      "object" : "Reference identifier"
   },
   "omssa" : {
      "datatype" : null,
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/omssa/",
      "database" : "Open Mass Spectrometry Search Algorithm",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "abbreviation" : "OMSSA",
      "name" : null,
      "id" : null,
      "url_syntax" : null
   },
   "agbase" : {
      "abbreviation" : "AgBase",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://www.agbase.msstate.edu/cgi-bin/getEntry.pl?db_pick=[ChickGO/MaizeGO]&uid=[example_id]",
      "datatype" : null,
      "generic_url" : "http://www.agbase.msstate.edu/",
      "database" : "AgBase resource for functional analysis of agricultural plant and animal gene products",
      "example_id" : null,
      "fullname" : null,
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null
   },
   "uberon" : {
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://purl.obolibrary.org/obo/UBERON_0002398",
      "fullname" : null,
      "entity_type" : "UBERON:0001062 ! anatomical entity",
      "database" : "Uber-anatomy ontology",
      "generic_url" : "http://uberon.org",
      "example_id" : "URBERON:0002398",
      "datatype" : null,
      "description" : "A multi-species anatomy ontology",
      "id" : null,
      "url_syntax" : "http://purl.obolibrary.org/obo/UBERON_[example_id]",
      "local_id_syntax" : "^[0-9]{7}$",
      "name" : null,
      "abbreviation" : "UBERON"
   },
   "medline" : {
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : null,
      "fullname" : null,
      "generic_url" : "http://www.nlm.nih.gov/databases/databases_medline.html",
      "example_id" : "MEDLINE:20572430",
      "database" : "Medline literature database",
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "name" : null,
      "abbreviation" : "MEDLINE"
   },
   "embl" : {
      "datatype" : null,
      "description" : "International nucleotide sequence database collaboration, comprising EMBL-EBI nucleotide sequence data library (EMBL-Bank), DNA DataBank of Japan (DDBJ), and NCBI GenBank",
      "example_id" : "EMBL:AA816246",
      "generic_url" : "http://www.ebi.ac.uk/embl/",
      "database" : "EMBL Nucleotide Sequence Database",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "object" : "Sequence accession",
      "uri_prefix" : null,
      "url_example" : "http://www.ebi.ac.uk/cgi-bin/emblfetch?style=html&Submit=Go&id=AA816246",
      "abbreviation" : "EMBL",
      "local_id_syntax" : "^([A-Z]{1}[0-9]{5})|([A-Z]{2}[0-9]{6})|([A-Z]{4}[0-9]{8,9})$",
      "name" : null,
      "id" : null,
      "url_syntax" : "http://www.ebi.ac.uk/cgi-bin/emblfetch?style=html&Submit=Go&id=[example_id]"
   },
   "merops" : {
      "object" : "Identifier",
      "uri_prefix" : null,
      "url_example" : "http://merops.sanger.ac.uk/cgi-bin/pepsum?mid=A08.001",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "generic_url" : "http://merops.sanger.ac.uk/",
      "example_id" : "MEROPS:A08.001",
      "database" : "MEROPS peptidase database",
      "datatype" : null,
      "url_syntax" : "http://merops.sanger.ac.uk/cgi-bin/pepsum?mid=[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "MEROPS"
   },
   "dictybase_ref" : {
      "name" : null,
      "abbreviation" : "dictyBase_REF",
      "id" : null,
      "url_syntax" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=[example_id]",
      "generic_url" : "http://dictybase.org",
      "example_id" : "dictyBase_REF:10157",
      "database" : "dictyBase literature references",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=10157",
      "object" : "Literature Reference Identifier",
      "fullname" : null
   },
   "subtilist" : {
      "name" : null,
      "abbreviation" : "SUBTILIST",
      "url_syntax" : null,
      "id" : null,
      "database" : "Bacillus subtilis Genome Sequence Project",
      "generic_url" : "http://genolist.pasteur.fr/SubtiList/",
      "example_id" : "SUBTILISTG:BG11384",
      "datatype" : null,
      "object" : "Accession",
      "uri_prefix" : null,
      "url_example" : null,
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein"
   },
   "pamgo_gat" : {
      "url_syntax" : "http://agro.vbi.vt.edu/public/servlet/GeneEdit?&Search=Search&level=2&genename=[example_id]",
      "id" : null,
      "name" : null,
      "abbreviation" : "PAMGO_GAT",
      "uri_prefix" : null,
      "url_example" : "http://agro.vbi.vt.edu/public/servlet/GeneEdit?&Search=Search&level=2&genename=atu0001",
      "object" : "Gene",
      "fullname" : null,
      "generic_url" : "http://agro.vbi.vt.edu/public/",
      "database" : "Genome Annotation Tool (Agrobacterium tumefaciens C58); PAMGO Interest Group",
      "example_id" : "PAMGO_GAT:Atu0001",
      "datatype" : null
   },
   "yeastfunc" : {
      "fullname" : null,
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "example_id" : null,
      "generic_url" : "http://func.med.harvard.edu/yeast/",
      "database" : "Yeast Function",
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "YeastFunc",
      "name" : null
   },
   "rgdid" : {
      "datatype" : null,
      "database" : "Rat Genome Database",
      "generic_url" : "http://rgd.mcw.edu/",
      "example_id" : "RGD:2004",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "url_example" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=2004",
      "uri_prefix" : null,
      "object" : "Accession",
      "abbreviation" : "RGDID",
      "name" : null,
      "local_id_syntax" : "^[0-9]{4,7}$",
      "url_syntax" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=[example_id]",
      "id" : null
   },
   "paint_ref" : {
      "example_id" : "PAINT_REF:PTHR10046",
      "generic_url" : "http://www.pantherdb.org/",
      "database" : "Phylogenetic Annotation INference Tool References",
      "datatype" : null,
      "url_example" : "http://www.geneontology.org/gene-associations/submission/paint/PTHR10046/PTHR10046.txt",
      "uri_prefix" : null,
      "object" : "Reference locator",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "PAINT_REF",
      "url_syntax" : "http://www.geneontology.org/gene-associations/submission/paint/[example_id]/[example_id].txt",
      "id" : null
   },
   "aspgd" : {
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "object" : "Identifier for AspGD Loci",
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=ASPL0000067538",
      "uri_prefix" : null,
      "datatype" : null,
      "generic_url" : "http://www.aspergillusgenome.org/",
      "example_id" : "AspGD:ASPL0000067538",
      "database" : "Aspergillus Genome Database",
      "id" : null,
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "abbreviation" : "AspGD",
      "local_id_syntax" : "^ASPL[0-9]{10}$",
      "name" : null
   },
   "pmcid" : {
      "abbreviation" : "PMCID",
      "!url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?cmd=Search&db=PMC&term=[example_id]",
      "name" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?db=pmc&cmd=search&term=[example_id]",
      "id" : null,
      "datatype" : null,
      "!url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?cmd=Search&db=PMC&term=PMC201377",
      "generic_url" : "http://www.pubmedcentral.nih.gov/",
      "example_id" : "PMCID:PMC201377",
      "database" : "Pubmed Central",
      "fullname" : null,
      "object" : "Identifier",
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?db=pmc&cmd=search&term=PMC201377",
      "uri_prefix" : null
   },
   "tigr_egad" : {
      "id" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=[example_id]",
      "name" : null,
      "abbreviation" : "TIGR_EGAD",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=74462",
      "uri_prefix" : null,
      "object" : "Accession",
      "fullname" : null,
      "database" : "EGAD database at the J. Craig Venter Institute",
      "example_id" : "JCVI_EGAD:74462",
      "generic_url" : "http://cmr.jcvi.org/",
      "datatype" : null
   },
   "protein_id" : {
      "description" : "protein identifier shared by DDBJ/EMBL-bank/GenBank nucleotide sequence databases",
      "datatype" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "database" : "DDBJ / ENA / GenBank",
      "example_id" : "protein_id:CAA71991",
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "object" : "Identifier",
      "abbreviation" : "protein_id",
      "name" : null,
      "local_id_syntax" : "^[A-Z]{3}[0-9]{5}(\\.[0-9]+)?$",
      "url_syntax" : null,
      "id" : null
   },
   "prints" : {
      "generic_url" : "http://www.bioinf.manchester.ac.uk/dbbrowser/PRINTS/",
      "database" : "PRINTS compendium of protein fingerprints",
      "example_id" : "PRINTS:PR00025",
      "datatype" : null,
      "uri_prefix" : null,
      "url_example" : "http://www.bioinf.manchester.ac.uk/cgi-bin/dbbrowser/sprint/searchprintss.cgi?display_opts=Prints&category=None&queryform=false&regexpr=off&prints_accn=PR00025",
      "object" : "Accession",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "PRINTS",
      "id" : null,
      "url_syntax" : "http://www.bioinf.manchester.ac.uk/cgi-bin/dbbrowser/sprint/searchprintss.cgi?display_opts=Prints&category=None&queryform=false&regexpr=off&prints_accn=[example_id]"
   },
   "cas_gen" : {
      "database" : "Catalog of Fishes genus database",
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "example_id" : "CASGEN:1040",
      "datatype" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=1040",
      "uri_prefix" : null,
      "object" : "Identifier",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "CAS_GEN",
      "id" : null,
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=[example_id]"
   },
   "jcvi_egad" : {
      "example_id" : "JCVI_EGAD:74462",
      "generic_url" : "http://cmr.jcvi.org/",
      "database" : "EGAD database at the J. Craig Venter Institute",
      "datatype" : null,
      "object" : "Accession",
      "uri_prefix" : null,
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=74462",
      "fullname" : null,
      "name" : null,
      "abbreviation" : "JCVI_EGAD",
      "id" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=[example_id]"
   },
   "imgt_hla" : {
      "name" : null,
      "abbreviation" : "IMGT_HLA",
      "url_syntax" : null,
      "id" : null,
      "database" : "IMGT/HLA human major histocompatibility complex sequence database",
      "generic_url" : "http://www.ebi.ac.uk/imgt/hla",
      "example_id" : "IMGT_HLA:HLA00031",
      "datatype" : null,
      "object" : null,
      "url_example" : null,
      "uri_prefix" : null,
      "fullname" : null
   },
   "gr" : {
      "abbreviation" : "GR",
      "name" : null,
      "local_id_syntax" : "^[A-Z][0-9][A-Z0-9]{3}[0-9]$",
      "id" : null,
      "url_syntax" : "http://www.gramene.org/db/searches/browser?search_type=All&RGN=on&query=[example_id]",
      "datatype" : null,
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "example_id" : "GR:sd1",
      "generic_url" : "http://www.gramene.org/",
      "database" : null,
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "url_example" : "http://www.gramene.org/db/searches/browser?search_type=All&RGN=on&query=sd1",
      "uri_prefix" : null,
      "object" : "Identifier (any)"
   },
   "agricola_id" : {
      "abbreviation" : "AGRICOLA_ID",
      "name" : null,
      "id" : null,
      "url_syntax" : null,
      "datatype" : null,
      "example_id" : "AGRICOLA_NAL:TP248.2 P76 v.14",
      "generic_url" : "http://agricola.nal.usda.gov/",
      "database" : "AGRICultural OnLine Access",
      "fullname" : null,
      "object" : "AGRICOLA call number",
      "url_example" : null,
      "uri_prefix" : null
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
