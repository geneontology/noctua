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
amigo.version.revision = "2.2.2";

/*
 * Variable: release
 *
 * Partial version for this library: release (date-like) information.
 */
amigo.version.release = "20140817";
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
      "id" : "annotation",
      "_strict" : 0,
      "searchable_extension" : "_searchable",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann-config.yaml",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann-config.yaml",
      "result_weights" : "bioentity^7.0 bioentity_name^6.0 qualifier^5.0 annotation_class^4.7 annotation_extension_json^4.5 source^4.0 taxon^3.0 evidence_type^2.5 evidence_with^2.0 panther_family^1.5 bioentity_isoform^0.5 reference^0.25",
      "document_category" : "annotation",
      "fields" : [
         {
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "id",
            "property" : [],
            "searchable" : "false",
            "display_name" : "Acc",
            "transform" : [],
            "description" : "A unique (and internal) combination of bioentity and ontology class."
         },
         {
            "display_name" : "Source",
            "transform" : [],
            "description" : "Database source.",
            "id" : "source",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         },
         {
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "id" : "type",
            "description" : "Type class.",
            "transform" : [],
            "display_name" : "Type class id"
         },
         {
            "transform" : [],
            "display_name" : "Date",
            "description" : "Date of assignment.",
            "id" : "date",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "false",
            "property" : []
         },
         {
            "id" : "assigned_by",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Assigned by",
            "description" : "Annotations assigned by group."
         },
         {
            "id" : "is_redundant_for",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Redundant for",
            "description" : "Rational for redundancy of annotation."
         },
         {
            "description" : "Taxonomic group.",
            "display_name" : "Taxon",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "taxon"
         },
         {
            "description" : "Taxonomic group and ancestral groups.",
            "transform" : [],
            "display_name" : "Taxon",
            "property" : [],
            "searchable" : "true",
            "id" : "taxon_label",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string"
         },
         {
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "taxon_closure",
            "description" : "Taxonomic group and ancestral groups.",
            "transform" : [],
            "display_name" : "Taxon"
         },
         {
            "property" : [],
            "searchable" : "true",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "taxon_closure_label",
            "description" : "Taxonomic group and ancestral groups.",
            "transform" : [],
            "display_name" : "Taxon"
         },
         {
            "description" : "Secondary taxon.",
            "transform" : [],
            "display_name" : "Secondary taxon",
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "id" : "secondary_taxon"
         },
         {
            "transform" : [],
            "display_name" : "Secondary taxon",
            "description" : "Secondary taxon.",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "id" : "secondary_taxon_label",
            "searchable" : "true",
            "property" : []
         },
         {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "secondary_taxon_closure",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "display_name" : "Secondary taxon",
            "description" : "Secondary taxon closure."
         },
         {
            "display_name" : "Secondary taxon",
            "transform" : [],
            "description" : "Secondary taxon closure.",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "secondary_taxon_closure_label",
            "searchable" : "true",
            "property" : []
         },
         {
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "isa_partof_closure",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "display_name" : "Involved in",
            "transform" : []
         },
         {
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "transform" : [],
            "display_name" : "Involved in",
            "searchable" : "true",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "isa_partof_closure_label"
         },
         {
            "transform" : [],
            "display_name" : "Inferred annotation",
            "description" : "Annotations for this term or its children (over regulates).",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "regulates_closure",
            "searchable" : "false",
            "property" : []
         },
         {
            "searchable" : "true",
            "property" : [],
            "id" : "regulates_closure_label",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "description" : "Annotations for this term or its children (over regulates).",
            "transform" : [],
            "display_name" : "Inferred annotation"
         },
         {
            "description" : "Closure of ids/accs over has_participant.",
            "transform" : [],
            "display_name" : "Has participant (IDs)",
            "searchable" : "false",
            "property" : [],
            "id" : "has_participant_closure",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "multi"
         },
         {
            "display_name" : "Has participant",
            "transform" : [],
            "description" : "Closure of labels over has_participant.",
            "id" : "has_participant_closure_label",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "searchable" : "true"
         },
         {
            "searchable" : "false",
            "property" : [],
            "cardinality" : "multi",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "synonym",
            "description" : "Gene or gene product synonyms.",
            "display_name" : "Synonym",
            "transform" : []
         },
         {
            "description" : "Gene or gene product identifiers.",
            "transform" : [],
            "display_name" : "Gene/product",
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "id" : "bioentity"
         },
         {
            "description" : "Gene or gene product identifiers.",
            "display_name" : "Gene/product",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "id" : "bioentity_label",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true"
         },
         {
            "description" : "The full name of the gene or gene product.",
            "transform" : [],
            "display_name" : "Gene/product name",
            "searchable" : "true",
            "property" : [],
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "id" : "bioentity_name"
         },
         {
            "transform" : [],
            "display_name" : "This should not be displayed",
            "description" : "The bioentity ID used at the database of origin.",
            "indexed" : "false",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "id" : "bioentity_internal_id",
            "property" : [],
            "searchable" : "false"
         },
         {
            "description" : "Annotation qualifier.",
            "display_name" : "Qualifier",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "qualifier"
         },
         {
            "id" : "annotation_class",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Direct annotation",
            "description" : "Direct annotations."
         },
         {
            "description" : "Direct annotations.",
            "transform" : [],
            "display_name" : "Direct annotation",
            "property" : [],
            "searchable" : "true",
            "id" : "annotation_class_label",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string"
         },
         {
            "description" : "Ontology aspect.",
            "transform" : [],
            "display_name" : "Ontology (aspect)",
            "property" : [],
            "searchable" : "false",
            "id" : "aspect",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string"
         },
         {
            "description" : "Biological isoform.",
            "transform" : [],
            "display_name" : "Isoform",
            "property" : [],
            "searchable" : "false",
            "id" : "bioentity_isoform",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single"
         },
         {
            "transform" : [],
            "display_name" : "Evidence",
            "description" : "Evidence type.",
            "id" : "evidence_type",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "searchable" : "false",
            "property" : []
         },
         {
            "searchable" : "false",
            "property" : [],
            "id" : "evidence_type_closure",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "description" : "All evidence (evidence closure) for this annotation",
            "transform" : [],
            "display_name" : "Evidence type"
         },
         {
            "id" : "evidence_with",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Evidence with",
            "description" : "Evidence with/from."
         },
         {
            "description" : "Database reference.",
            "transform" : [],
            "display_name" : "Reference",
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "reference"
         },
         {
            "searchable" : "false",
            "property" : [],
            "id" : "annotation_extension_class",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "description" : "Extension class for the annotation.",
            "transform" : [],
            "display_name" : "Annotation extension"
         },
         {
            "description" : "Extension class for the annotation.",
            "display_name" : "Annotation extension",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "id" : "annotation_extension_class_label",
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "required" : "false"
         },
         {
            "transform" : [],
            "display_name" : "Annotation extension",
            "description" : "Extension class for the annotation.",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "annotation_extension_class_closure",
            "property" : [],
            "searchable" : "false"
         },
         {
            "description" : "Extension class for the annotation.",
            "display_name" : "Annotation extension",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "id" : "annotation_extension_class_closure_label",
            "cardinality" : "multi",
            "type" : "string",
            "required" : "false",
            "indexed" : "true"
         },
         {
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "id" : "annotation_extension_json",
            "property" : [],
            "searchable" : "false",
            "display_name" : "Annotation extension",
            "transform" : [],
            "description" : "Extension class for the annotation (JSON)."
         },
         {
            "display_name" : "PANTHER family",
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "property" : [],
            "searchable" : "true"
         },
         {
            "transform" : [],
            "display_name" : "PANTHER family",
            "description" : "PANTHER families that are associated with this entity.",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "id" : "panther_family_label",
            "searchable" : "true",
            "property" : []
         }
      ],
      "filter_weights" : "source^7.0 assigned_by^6.5 aspect^6.25 evidence_type_closure^6.0 panther_family_label^5.5 qualifier^5.25 taxon_closure_label^5.0 annotation_class_label^4.5 regulates_closure_label^3.0 annotation_extension_class_closure_label^2.0",
      "schema_generating" : "true",
      "display_name" : "Annotations",
      "boost_weights" : "annotation_class^2.0 annotation_class_label^1.0 bioentity^2.0 bioentity_label^1.0 bioentity_name^1.0 annotation_extension_class^2.0 annotation_extension_class_label^1.0 reference^1.0 panther_family^1.0 panther_family_label^1.0 bioentity_isoform^1.0 regulates_closure^1.0 regulates_closure_label^1.0",
      "fields_hash" : {
         "bioentity_name" : {
            "description" : "The full name of the gene or gene product.",
            "transform" : [],
            "display_name" : "Gene/product name",
            "searchable" : "true",
            "property" : [],
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "id" : "bioentity_name"
         },
         "panther_family_label" : {
            "transform" : [],
            "display_name" : "PANTHER family",
            "description" : "PANTHER families that are associated with this entity.",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "id" : "panther_family_label",
            "searchable" : "true",
            "property" : []
         },
         "annotation_extension_class_label" : {
            "description" : "Extension class for the annotation.",
            "display_name" : "Annotation extension",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "id" : "annotation_extension_class_label",
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "required" : "false"
         },
         "annotation_extension_class_closure_label" : {
            "description" : "Extension class for the annotation.",
            "display_name" : "Annotation extension",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "id" : "annotation_extension_class_closure_label",
            "cardinality" : "multi",
            "type" : "string",
            "required" : "false",
            "indexed" : "true"
         },
         "regulates_closure_label" : {
            "searchable" : "true",
            "property" : [],
            "id" : "regulates_closure_label",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "description" : "Annotations for this term or its children (over regulates).",
            "transform" : [],
            "display_name" : "Inferred annotation"
         },
         "is_redundant_for" : {
            "id" : "is_redundant_for",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Redundant for",
            "description" : "Rational for redundancy of annotation."
         },
         "annotation_class_label" : {
            "description" : "Direct annotations.",
            "transform" : [],
            "display_name" : "Direct annotation",
            "property" : [],
            "searchable" : "true",
            "id" : "annotation_class_label",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string"
         },
         "assigned_by" : {
            "id" : "assigned_by",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Assigned by",
            "description" : "Annotations assigned by group."
         },
         "regulates_closure" : {
            "transform" : [],
            "display_name" : "Inferred annotation",
            "description" : "Annotations for this term or its children (over regulates).",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "regulates_closure",
            "searchable" : "false",
            "property" : []
         },
         "annotation_extension_class_closure" : {
            "transform" : [],
            "display_name" : "Annotation extension",
            "description" : "Extension class for the annotation.",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "annotation_extension_class_closure",
            "property" : [],
            "searchable" : "false"
         },
         "aspect" : {
            "description" : "Ontology aspect.",
            "transform" : [],
            "display_name" : "Ontology (aspect)",
            "property" : [],
            "searchable" : "false",
            "id" : "aspect",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string"
         },
         "has_participant_closure_label" : {
            "display_name" : "Has participant",
            "transform" : [],
            "description" : "Closure of labels over has_participant.",
            "id" : "has_participant_closure_label",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "searchable" : "true"
         },
         "taxon_closure_label" : {
            "property" : [],
            "searchable" : "true",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "taxon_closure_label",
            "description" : "Taxonomic group and ancestral groups.",
            "transform" : [],
            "display_name" : "Taxon"
         },
         "taxon" : {
            "description" : "Taxonomic group.",
            "display_name" : "Taxon",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "taxon"
         },
         "type" : {
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "id" : "type",
            "description" : "Type class.",
            "transform" : [],
            "display_name" : "Type class id"
         },
         "annotation_class" : {
            "id" : "annotation_class",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Direct annotation",
            "description" : "Direct annotations."
         },
         "evidence_type_closure" : {
            "searchable" : "false",
            "property" : [],
            "id" : "evidence_type_closure",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "description" : "All evidence (evidence closure) for this annotation",
            "transform" : [],
            "display_name" : "Evidence type"
         },
         "secondary_taxon" : {
            "description" : "Secondary taxon.",
            "transform" : [],
            "display_name" : "Secondary taxon",
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "id" : "secondary_taxon"
         },
         "bioentity" : {
            "description" : "Gene or gene product identifiers.",
            "transform" : [],
            "display_name" : "Gene/product",
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "id" : "bioentity"
         },
         "reference" : {
            "description" : "Database reference.",
            "transform" : [],
            "display_name" : "Reference",
            "property" : [],
            "searchable" : "false",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "reference"
         },
         "secondary_taxon_closure_label" : {
            "display_name" : "Secondary taxon",
            "transform" : [],
            "description" : "Secondary taxon closure.",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "secondary_taxon_closure_label",
            "searchable" : "true",
            "property" : []
         },
         "id" : {
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "id",
            "property" : [],
            "searchable" : "false",
            "display_name" : "Acc",
            "transform" : [],
            "description" : "A unique (and internal) combination of bioentity and ontology class."
         },
         "qualifier" : {
            "description" : "Annotation qualifier.",
            "display_name" : "Qualifier",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "qualifier"
         },
         "isa_partof_closure" : {
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "isa_partof_closure",
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "display_name" : "Involved in",
            "transform" : []
         },
         "taxon_closure" : {
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "taxon_closure",
            "description" : "Taxonomic group and ancestral groups.",
            "transform" : [],
            "display_name" : "Taxon"
         },
         "evidence_with" : {
            "id" : "evidence_with",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Evidence with",
            "description" : "Evidence with/from."
         },
         "synonym" : {
            "searchable" : "false",
            "property" : [],
            "cardinality" : "multi",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "synonym",
            "description" : "Gene or gene product synonyms.",
            "display_name" : "Synonym",
            "transform" : []
         },
         "bioentity_internal_id" : {
            "transform" : [],
            "display_name" : "This should not be displayed",
            "description" : "The bioentity ID used at the database of origin.",
            "indexed" : "false",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "id" : "bioentity_internal_id",
            "property" : [],
            "searchable" : "false"
         },
         "evidence_type" : {
            "transform" : [],
            "display_name" : "Evidence",
            "description" : "Evidence type.",
            "id" : "evidence_type",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "searchable" : "false",
            "property" : []
         },
         "date" : {
            "transform" : [],
            "display_name" : "Date",
            "description" : "Date of assignment.",
            "id" : "date",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "false",
            "property" : []
         },
         "annotation_extension_json" : {
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "id" : "annotation_extension_json",
            "property" : [],
            "searchable" : "false",
            "display_name" : "Annotation extension",
            "transform" : [],
            "description" : "Extension class for the annotation (JSON)."
         },
         "annotation_extension_class" : {
            "searchable" : "false",
            "property" : [],
            "id" : "annotation_extension_class",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "description" : "Extension class for the annotation.",
            "transform" : [],
            "display_name" : "Annotation extension"
         },
         "secondary_taxon_closure" : {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "secondary_taxon_closure",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "display_name" : "Secondary taxon",
            "description" : "Secondary taxon closure."
         },
         "bioentity_isoform" : {
            "description" : "Biological isoform.",
            "transform" : [],
            "display_name" : "Isoform",
            "property" : [],
            "searchable" : "false",
            "id" : "bioentity_isoform",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single"
         },
         "taxon_label" : {
            "description" : "Taxonomic group and ancestral groups.",
            "transform" : [],
            "display_name" : "Taxon",
            "property" : [],
            "searchable" : "true",
            "id" : "taxon_label",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string"
         },
         "has_participant_closure" : {
            "description" : "Closure of ids/accs over has_participant.",
            "transform" : [],
            "display_name" : "Has participant (IDs)",
            "searchable" : "false",
            "property" : [],
            "id" : "has_participant_closure",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "multi"
         },
         "panther_family" : {
            "display_name" : "PANTHER family",
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity.",
            "id" : "panther_family",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "property" : [],
            "searchable" : "true"
         },
         "bioentity_label" : {
            "description" : "Gene or gene product identifiers.",
            "display_name" : "Gene/product",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "id" : "bioentity_label",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true"
         },
         "source" : {
            "display_name" : "Source",
            "transform" : [],
            "description" : "Database source.",
            "id" : "source",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         },
         "secondary_taxon_label" : {
            "transform" : [],
            "display_name" : "Secondary taxon",
            "description" : "Secondary taxon.",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "id" : "secondary_taxon_label",
            "searchable" : "true",
            "property" : []
         },
         "isa_partof_closure_label" : {
            "description" : "Annotations for this term or its children (over is_a/part_of).",
            "transform" : [],
            "display_name" : "Involved in",
            "searchable" : "true",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "isa_partof_closure_label"
         }
      },
      "description" : "Associations between GO terms and genes or gene products.",
      "weight" : "20"
   },
   "ontology" : {
      "display_name" : "Ontology",
      "schema_generating" : "true",
      "fields_hash" : {
         "annotation_class" : {
            "description" : "Term identifier.",
            "transform" : [],
            "display_name" : "Term",
            "searchable" : "false",
            "property" : [
               "getIdentifier"
            ],
            "id" : "annotation_class",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single"
         },
         "is_obsolete" : {
            "description" : "Is the term obsolete?",
            "transform" : [],
            "display_name" : "Obsoletion",
            "property" : [
               "getIsObsoleteBinaryString"
            ],
            "searchable" : "false",
            "id" : "is_obsolete",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "boolean"
         },
         "definition_xref" : {
            "property" : [
               "getDefXref"
            ],
            "searchable" : "false",
            "id" : "definition_xref",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "description" : "Definition cross-reference.",
            "transform" : [],
            "display_name" : "Def xref"
         },
         "database_xref" : {
            "cardinality" : "multi",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "database_xref",
            "property" : [
               "getXref"
            ],
            "searchable" : "false",
            "display_name" : "DB xref",
            "transform" : [],
            "description" : "Database cross-reference."
         },
         "subset" : {
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "subset",
            "property" : [
               "getSubsets"
            ],
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Subset",
            "description" : "Special use collections of terms."
         },
         "isa_partof_closure_label" : {
            "searchable" : "true",
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050"
            ],
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "isa_partof_closure_label",
            "description" : "Ancestral terms (is_a/part_of).",
            "transform" : [],
            "display_name" : "Is-a/part-of"
         },
         "topology_graph_json" : {
            "searchable" : "false",
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
            "id" : "topology_graph_json",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "false",
            "description" : "JSON blob form of the local stepwise topology graph. Uses various relations (including regulates, occurs in, capable_of).",
            "display_name" : "Topology graph (JSON)",
            "transform" : []
         },
         "comment" : {
            "description" : "Term comment.",
            "display_name" : "Comment",
            "transform" : [],
            "property" : [
               "getComment"
            ],
            "searchable" : "true",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "comment"
         },
         "only_in_taxon_label" : {
            "id" : "only_in_taxon_label",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "searchable" : "true",
            "property" : [
               "getLabel"
            ],
            "display_name" : "Only in taxon",
            "transform" : [],
            "description" : "Only in taxon label."
         },
         "only_in_taxon_closure_label" : {
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "searchable" : "true",
            "id" : "only_in_taxon_closure_label",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "description" : "Only in taxon label closure.",
            "transform" : [],
            "display_name" : "Only in taxon"
         },
         "source" : {
            "transform" : [],
            "display_name" : "Ontology source",
            "description" : "Term namespace.",
            "id" : "source",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "false",
            "property" : [
               "getNamespace"
            ]
         },
         "consider" : {
            "display_name" : "Consider",
            "transform" : [],
            "description" : "Others terms you might want to look at.",
            "id" : "consider",
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "property" : [
               "getAnnotationPropertyValues",
               "consider"
            ],
            "searchable" : "false"
         },
         "regulates_transitivity_graph_json" : {
            "id" : "regulates_transitivity_graph_json",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "false",
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
            "display_name" : "Regulates transitivity graph (JSON)",
            "transform" : [],
            "description" : "JSON blob form of the local relation transitivity graph. Uses various relations (including regulates, occurs in, capable_of)."
         },
         "only_in_taxon_closure" : {
            "transform" : [],
            "display_name" : "Only in taxon (IDs)",
            "description" : "Only in taxon closure.",
            "id" : "only_in_taxon_closure",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "searchable" : "false"
         },
         "id" : {
            "property" : [
               "getIdentifier"
            ],
            "searchable" : "false",
            "id" : "id",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "description" : "Term identifier.",
            "display_name" : "Acc",
            "transform" : []
         },
         "alternate_id" : {
            "description" : "Alternate term identifier.",
            "display_name" : "Alt ID",
            "transform" : [],
            "property" : [
               "getAnnotationPropertyValues",
               "alt_id"
            ],
            "searchable" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "alternate_id"
         },
         "only_in_taxon" : {
            "id" : "only_in_taxon",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "searchable" : "true",
            "property" : [
               "getIdentifier"
            ],
            "display_name" : "Only in taxon",
            "transform" : [],
            "description" : "Only in taxon."
         },
         "synonym" : {
            "id" : "synonym",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "property" : [
               "getOBOSynonymStrings"
            ],
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Synonyms",
            "description" : "Term synonyms."
         },
         "regulates_closure" : {
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
            "searchable" : "false",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "regulates_closure",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "transform" : [],
            "display_name" : "Ancestor"
         },
         "description" : {
            "display_name" : "Definition",
            "transform" : [],
            "description" : "Term definition.",
            "id" : "description",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "searchable" : "true",
            "property" : [
               "getDef"
            ]
         },
         "annotation_class_label" : {
            "display_name" : "Term",
            "transform" : [],
            "description" : "Identifier.",
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "annotation_class_label",
            "property" : [
               "getLabel"
            ],
            "searchable" : "true"
         },
         "replaced_by" : {
            "description" : "Term that replaces this term.",
            "display_name" : "Replaced By",
            "transform" : [],
            "property" : [
               "getAnnotationPropertyValues",
               "replaced_by"
            ],
            "searchable" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "replaced_by"
         },
         "isa_partof_closure" : {
            "display_name" : "Is-a/part-of",
            "transform" : [],
            "description" : "Ancestral terms (is_a/part_of).",
            "cardinality" : "multi",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "isa_partof_closure",
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050"
            ],
            "searchable" : "false"
         },
         "regulates_closure_label" : {
            "display_name" : "Ancestor",
            "transform" : [],
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "cardinality" : "multi",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "regulates_closure_label",
            "searchable" : "true",
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050",
               "BFO:0000066",
               "RO:0002211",
               "RO:0002212",
               "RO:0002213",
               "RO:0002215",
               "RO:0002216"
            ]
         }
      },
      "description" : "Ontology classes for GO.",
      "weight" : "40",
      "boost_weights" : "annotation_class^3.0 annotation_class_label^5.5 description^1.0 comment^0.5 synonym^1.0 alternate_id^1.0 regulates_closure^1.0 regulates_closure_label^1.0",
      "_strict" : 0,
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/ont-config.yaml",
      "searchable_extension" : "_searchable",
      "id" : "ontology",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/ont-config.yaml",
      "document_category" : "ontology_class",
      "result_weights" : "annotation_class^8.0 description^6.0 source^4.0 synonym^3.0 alternate_id^2.0",
      "filter_weights" : "source^4.0 subset^3.0 regulates_closure_label^1.0 is_obsolete^0.0",
      "fields" : [
         {
            "property" : [
               "getIdentifier"
            ],
            "searchable" : "false",
            "id" : "id",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "description" : "Term identifier.",
            "display_name" : "Acc",
            "transform" : []
         },
         {
            "description" : "Term identifier.",
            "transform" : [],
            "display_name" : "Term",
            "searchable" : "false",
            "property" : [
               "getIdentifier"
            ],
            "id" : "annotation_class",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single"
         },
         {
            "display_name" : "Term",
            "transform" : [],
            "description" : "Identifier.",
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "annotation_class_label",
            "property" : [
               "getLabel"
            ],
            "searchable" : "true"
         },
         {
            "display_name" : "Definition",
            "transform" : [],
            "description" : "Term definition.",
            "id" : "description",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "searchable" : "true",
            "property" : [
               "getDef"
            ]
         },
         {
            "transform" : [],
            "display_name" : "Ontology source",
            "description" : "Term namespace.",
            "id" : "source",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "false",
            "property" : [
               "getNamespace"
            ]
         },
         {
            "description" : "Is the term obsolete?",
            "transform" : [],
            "display_name" : "Obsoletion",
            "property" : [
               "getIsObsoleteBinaryString"
            ],
            "searchable" : "false",
            "id" : "is_obsolete",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "boolean"
         },
         {
            "description" : "Term comment.",
            "display_name" : "Comment",
            "transform" : [],
            "property" : [
               "getComment"
            ],
            "searchable" : "true",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "comment"
         },
         {
            "id" : "synonym",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "property" : [
               "getOBOSynonymStrings"
            ],
            "searchable" : "true",
            "transform" : [],
            "display_name" : "Synonyms",
            "description" : "Term synonyms."
         },
         {
            "description" : "Alternate term identifier.",
            "display_name" : "Alt ID",
            "transform" : [],
            "property" : [
               "getAnnotationPropertyValues",
               "alt_id"
            ],
            "searchable" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "alternate_id"
         },
         {
            "description" : "Term that replaces this term.",
            "display_name" : "Replaced By",
            "transform" : [],
            "property" : [
               "getAnnotationPropertyValues",
               "replaced_by"
            ],
            "searchable" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "replaced_by"
         },
         {
            "display_name" : "Consider",
            "transform" : [],
            "description" : "Others terms you might want to look at.",
            "id" : "consider",
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "property" : [
               "getAnnotationPropertyValues",
               "consider"
            ],
            "searchable" : "false"
         },
         {
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "subset",
            "property" : [
               "getSubsets"
            ],
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Subset",
            "description" : "Special use collections of terms."
         },
         {
            "property" : [
               "getDefXref"
            ],
            "searchable" : "false",
            "id" : "definition_xref",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "description" : "Definition cross-reference.",
            "transform" : [],
            "display_name" : "Def xref"
         },
         {
            "cardinality" : "multi",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "database_xref",
            "property" : [
               "getXref"
            ],
            "searchable" : "false",
            "display_name" : "DB xref",
            "transform" : [],
            "description" : "Database cross-reference."
         },
         {
            "display_name" : "Is-a/part-of",
            "transform" : [],
            "description" : "Ancestral terms (is_a/part_of).",
            "cardinality" : "multi",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "isa_partof_closure",
            "property" : [
               "getRelationIDClosure",
               "BFO:0000050"
            ],
            "searchable" : "false"
         },
         {
            "searchable" : "true",
            "property" : [
               "getRelationLabelClosure",
               "BFO:0000050"
            ],
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "isa_partof_closure_label",
            "description" : "Ancestral terms (is_a/part_of).",
            "transform" : [],
            "display_name" : "Is-a/part-of"
         },
         {
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
            "searchable" : "false",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "regulates_closure",
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "transform" : [],
            "display_name" : "Ancestor"
         },
         {
            "display_name" : "Ancestor",
            "transform" : [],
            "description" : "Ancestral terms (regulates, occurs in, capable_of).",
            "cardinality" : "multi",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "regulates_closure_label",
            "searchable" : "true",
            "property" : [
               "getRelationLabelClosure",
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
            "searchable" : "false",
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
            "id" : "topology_graph_json",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "false",
            "description" : "JSON blob form of the local stepwise topology graph. Uses various relations (including regulates, occurs in, capable_of).",
            "display_name" : "Topology graph (JSON)",
            "transform" : []
         },
         {
            "id" : "regulates_transitivity_graph_json",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "false",
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
            "display_name" : "Regulates transitivity graph (JSON)",
            "transform" : [],
            "description" : "JSON blob form of the local relation transitivity graph. Uses various relations (including regulates, occurs in, capable_of)."
         },
         {
            "id" : "only_in_taxon",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "searchable" : "true",
            "property" : [
               "getIdentifier"
            ],
            "display_name" : "Only in taxon",
            "transform" : [],
            "description" : "Only in taxon."
         },
         {
            "id" : "only_in_taxon_label",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "searchable" : "true",
            "property" : [
               "getLabel"
            ],
            "display_name" : "Only in taxon",
            "transform" : [],
            "description" : "Only in taxon label."
         },
         {
            "transform" : [],
            "display_name" : "Only in taxon (IDs)",
            "description" : "Only in taxon closure.",
            "id" : "only_in_taxon_closure",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "searchable" : "false"
         },
         {
            "property" : [
               "getRelationLabelClosure",
               "RO:0002160"
            ],
            "searchable" : "true",
            "id" : "only_in_taxon_closure_label",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "description" : "Only in taxon label closure.",
            "transform" : [],
            "display_name" : "Only in taxon"
         }
      ]
   },
   "bbop_term_ac" : {
      "result_weights" : "annotation_class^8.0 synonym^3.0 alternate_id^2.0",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/term-autocomplete-config.yaml",
      "document_category" : "ontology_class",
      "filter_weights" : "annotation_class^8.0 synonym^3.0 alternate_id^2.0",
      "fields" : [
         {
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "id" : "id",
            "description" : "Term acc/ID.",
            "transform" : [],
            "display_name" : "Acc"
         },
         {
            "display_name" : "Term",
            "transform" : [],
            "description" : "Term acc/ID.",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "annotation_class",
            "property" : [],
            "searchable" : "false"
         },
         {
            "description" : "Common term name.",
            "display_name" : "Term",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "annotation_class_label"
         },
         {
            "description" : "Term synonyms.",
            "transform" : [],
            "display_name" : "Synonyms",
            "searchable" : "true",
            "property" : [],
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "synonym"
         },
         {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "alternate_id",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "display_name" : "Alt ID",
            "description" : "Alternate term id."
         }
      ],
      "id" : "bbop_term_ac",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/term-autocomplete-config.yaml",
      "_strict" : 0,
      "searchable_extension" : "_searchable",
      "boost_weights" : "annotation_class^5.0 annotation_class_label^5.0 synonym^1.0 alternate_id^1.0",
      "fields_hash" : {
         "annotation_class_label" : {
            "description" : "Common term name.",
            "display_name" : "Term",
            "transform" : [],
            "property" : [],
            "searchable" : "true",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "annotation_class_label"
         },
         "id" : {
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "id" : "id",
            "description" : "Term acc/ID.",
            "transform" : [],
            "display_name" : "Acc"
         },
         "alternate_id" : {
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "alternate_id",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "display_name" : "Alt ID",
            "description" : "Alternate term id."
         },
         "synonym" : {
            "description" : "Term synonyms.",
            "transform" : [],
            "display_name" : "Synonyms",
            "searchable" : "true",
            "property" : [],
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "synonym"
         },
         "annotation_class" : {
            "display_name" : "Term",
            "transform" : [],
            "description" : "Term acc/ID.",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "annotation_class",
            "property" : [],
            "searchable" : "false"
         }
      },
      "description" : "Easily find ontology classes in GO. For personality only - not a schema configuration.",
      "weight" : "-20",
      "schema_generating" : "false",
      "display_name" : "Term autocomplete"
   },
   "bioentity" : {
      "fields" : [
         {
            "transform" : [],
            "display_name" : "Acc",
            "description" : "Gene of gene product ID.",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "id" : "id",
            "searchable" : "false",
            "property" : []
         },
         {
            "description" : "Gene or gene product ID.",
            "display_name" : "Acc",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "id" : "bioentity",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true"
         },
         {
            "description" : "Symbol or name.",
            "transform" : [],
            "display_name" : "Label",
            "property" : [],
            "searchable" : "true",
            "id" : "bioentity_label",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string"
         },
         {
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "bioentity_name",
            "searchable" : "true",
            "property" : [],
            "display_name" : "Name",
            "transform" : [],
            "description" : "The full name of the gene product."
         },
         {
            "description" : "The bioentity ID used at the database of origin.",
            "transform" : [],
            "display_name" : "This should not be displayed",
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "false",
            "cardinality" : "single",
            "type" : "string",
            "id" : "bioentity_internal_id"
         },
         {
            "description" : "Type class.",
            "display_name" : "Type",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "id" : "type",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "required" : "false"
         },
         {
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "taxon",
            "property" : [],
            "searchable" : "false",
            "display_name" : "Taxon",
            "transform" : [],
            "description" : "Taxonomic group"
         },
         {
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "id" : "taxon_label",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Taxon",
            "description" : "Taxonomic group"
         },
         {
            "description" : "Taxonomic group and ancestral groups.",
            "display_name" : "Taxon",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "cardinality" : "multi",
            "required" : "false",
            "indexed" : "true",
            "id" : "taxon_closure"
         },
         {
            "description" : "Taxonomic group and ancestral groups.",
            "transform" : [],
            "display_name" : "Taxon",
            "property" : [],
            "searchable" : "true",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "taxon_closure_label"
         },
         {
            "id" : "isa_partof_closure",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Involved in",
            "description" : "Closure of ids/accs over isa and partof."
         },
         {
            "id" : "isa_partof_closure_label",
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "searchable" : "true",
            "display_name" : "Involved in",
            "transform" : [],
            "description" : "Closure of labels over isa and partof."
         },
         {
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "regulates_closure",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Inferred annotation",
            "description" : "Bioentities associated with this term or its children (over regulates)."
         },
         {
            "searchable" : "true",
            "property" : [],
            "id" : "regulates_closure_label",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "transform" : [],
            "display_name" : "Inferred annotation"
         },
         {
            "searchable" : "false",
            "property" : [],
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "id" : "source",
            "description" : "Database source.",
            "display_name" : "Source",
            "transform" : []
         },
         {
            "transform" : [],
            "display_name" : "Direct annotation",
            "description" : "Direct annotations.",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "annotation_class_list",
            "property" : [],
            "searchable" : "false"
         },
         {
            "id" : "annotation_class_list_label",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "display_name" : "Direct annotation",
            "description" : "Direct annotations."
         },
         {
            "transform" : [],
            "display_name" : "Synonyms",
            "description" : "Gene product synonyms.",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "synonym",
            "property" : [],
            "searchable" : "false"
         },
         {
            "id" : "panther_family",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "searchable" : "true",
            "display_name" : "PANTHER family",
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity."
         },
         {
            "display_name" : "PANTHER family",
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity.",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "id" : "panther_family_label",
            "property" : [],
            "searchable" : "true"
         },
         {
            "display_name" : "This should not be displayed",
            "transform" : [],
            "description" : "JSON blob form of the phylogenic tree.",
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "false",
            "required" : "false",
            "id" : "phylo_graph_json",
            "property" : [],
            "searchable" : "false"
         },
         {
            "property" : [],
            "searchable" : "false",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "database_xref",
            "description" : "Database cross-reference.",
            "transform" : [],
            "display_name" : "DB xref"
         }
      ],
      "filter_weights" : "source^7.0 type^6.0 panther_family_label^5.0 annotation_class_list_label^3.5 taxon_closure_label^4.0 regulates_closure_label^2.0",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/bio-config.yaml",
      "result_weights" : "bioentity^8.0 bioentity_name^7.0 taxon^6.0 panther_family^5.0 type^4.0 source^3.0 annotation_class_list^2.0 synonym^1.0",
      "document_category" : "bioentity",
      "id" : "bioentity",
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/bio-config.yaml",
      "searchable_extension" : "_searchable",
      "_strict" : 0,
      "boost_weights" : "bioentity^2.0 bioentity_label^2.0 bioentity_name^1.0 bioentity_internal_id^1.0 synonym^1.0 isa_partof_closure_label^1.0 regulates_closure^1.0 regulates_closure_label^1.0 panther_family^1.0 panther_family_label^1.0 taxon_closure_label^1.0",
      "description" : "Genes and gene products associated with GO terms.",
      "weight" : "30",
      "fields_hash" : {
         "source" : {
            "searchable" : "false",
            "property" : [],
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "id" : "source",
            "description" : "Database source.",
            "display_name" : "Source",
            "transform" : []
         },
         "annotation_class_list_label" : {
            "id" : "annotation_class_list_label",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "false",
            "property" : [],
            "transform" : [],
            "display_name" : "Direct annotation",
            "description" : "Direct annotations."
         },
         "bioentity" : {
            "description" : "Gene or gene product ID.",
            "display_name" : "Acc",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "id" : "bioentity",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true"
         },
         "isa_partof_closure_label" : {
            "id" : "isa_partof_closure_label",
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "searchable" : "true",
            "display_name" : "Involved in",
            "transform" : [],
            "description" : "Closure of labels over isa and partof."
         },
         "database_xref" : {
            "property" : [],
            "searchable" : "false",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "database_xref",
            "description" : "Database cross-reference.",
            "transform" : [],
            "display_name" : "DB xref"
         },
         "taxon_label" : {
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "id" : "taxon_label",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Taxon",
            "description" : "Taxonomic group"
         },
         "taxon_closure_label" : {
            "description" : "Taxonomic group and ancestral groups.",
            "transform" : [],
            "display_name" : "Taxon",
            "property" : [],
            "searchable" : "true",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "taxon_closure_label"
         },
         "taxon" : {
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "taxon",
            "property" : [],
            "searchable" : "false",
            "display_name" : "Taxon",
            "transform" : [],
            "description" : "Taxonomic group"
         },
         "panther_family" : {
            "id" : "panther_family",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "searchable" : "true",
            "display_name" : "PANTHER family",
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity."
         },
         "bioentity_label" : {
            "description" : "Symbol or name.",
            "transform" : [],
            "display_name" : "Label",
            "property" : [],
            "searchable" : "true",
            "id" : "bioentity_label",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string"
         },
         "phylo_graph_json" : {
            "display_name" : "This should not be displayed",
            "transform" : [],
            "description" : "JSON blob form of the phylogenic tree.",
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "false",
            "required" : "false",
            "id" : "phylo_graph_json",
            "property" : [],
            "searchable" : "false"
         },
         "type" : {
            "description" : "Type class.",
            "display_name" : "Type",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "id" : "type",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "required" : "false"
         },
         "regulates_closure_label" : {
            "searchable" : "true",
            "property" : [],
            "id" : "regulates_closure_label",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "description" : "Bioentities associated with this term or its children (over regulates).",
            "transform" : [],
            "display_name" : "Inferred annotation"
         },
         "isa_partof_closure" : {
            "id" : "isa_partof_closure",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Involved in",
            "description" : "Closure of ids/accs over isa and partof."
         },
         "annotation_class_list" : {
            "transform" : [],
            "display_name" : "Direct annotation",
            "description" : "Direct annotations.",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "annotation_class_list",
            "property" : [],
            "searchable" : "false"
         },
         "taxon_closure" : {
            "description" : "Taxonomic group and ancestral groups.",
            "display_name" : "Taxon",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "cardinality" : "multi",
            "required" : "false",
            "indexed" : "true",
            "id" : "taxon_closure"
         },
         "regulates_closure" : {
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "regulates_closure",
            "property" : [],
            "searchable" : "false",
            "transform" : [],
            "display_name" : "Inferred annotation",
            "description" : "Bioentities associated with this term or its children (over regulates)."
         },
         "synonym" : {
            "transform" : [],
            "display_name" : "Synonyms",
            "description" : "Gene product synonyms.",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "synonym",
            "property" : [],
            "searchable" : "false"
         },
         "bioentity_internal_id" : {
            "description" : "The bioentity ID used at the database of origin.",
            "transform" : [],
            "display_name" : "This should not be displayed",
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "false",
            "cardinality" : "single",
            "type" : "string",
            "id" : "bioentity_internal_id"
         },
         "bioentity_name" : {
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "bioentity_name",
            "searchable" : "true",
            "property" : [],
            "display_name" : "Name",
            "transform" : [],
            "description" : "The full name of the gene product."
         },
         "panther_family_label" : {
            "display_name" : "PANTHER family",
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity.",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "id" : "panther_family_label",
            "property" : [],
            "searchable" : "true"
         },
         "id" : {
            "transform" : [],
            "display_name" : "Acc",
            "description" : "Gene of gene product ID.",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "id" : "id",
            "searchable" : "false",
            "property" : []
         }
      },
      "schema_generating" : "true",
      "display_name" : "Genes and gene products"
   },
   "bbop_ann_ev_agg" : {
      "schema_generating" : "true",
      "display_name" : "Advanced",
      "boost_weights" : "annotation_class^2.0 annotation_class_label^1.0 bioentity^2.0 bioentity_label^1.0 panther_family^1.0 panther_family_label^1.0 taxon_closure_label^1.0",
      "weight" : "-10",
      "description" : "A description of annotation evidence aggregate for GOlr and AmiGO.",
      "fields_hash" : {
         "taxon_closure" : {
            "searchable" : "false",
            "property" : [],
            "id" : "taxon_closure",
            "type" : "string",
            "cardinality" : "multi",
            "required" : "false",
            "indexed" : "true",
            "description" : "IDs derived from C13 + ncbi_taxonomy.obo.",
            "display_name" : "Taxon (IDs)",
            "transform" : []
         },
         "evidence_with" : {
            "display_name" : "Evidence with",
            "transform" : [],
            "description" : "All column 8s for this term/gene product pair",
            "id" : "evidence_with",
            "cardinality" : "multi",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         },
         "bioentity" : {
            "transform" : [],
            "display_name" : "Gene/product ID",
            "description" : "Column 1 + columns 2.",
            "id" : "bioentity",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "searchable" : "false",
            "property" : []
         },
         "evidence_type_closure" : {
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "evidence_type_closure",
            "description" : "All evidence for this term/gene product pair",
            "transform" : [],
            "display_name" : "Evidence type"
         },
         "annotation_class_label" : {
            "searchable" : "true",
            "property" : [],
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "annotation_class_label",
            "description" : "Column 5 + ontology.",
            "display_name" : "Annotation class label",
            "transform" : []
         },
         "taxon_label" : {
            "transform" : [],
            "display_name" : "Taxon",
            "description" : "Derived from C13 + ncbi_taxonomy.obo.",
            "id" : "taxon_label",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "property" : []
         },
         "taxon_closure_label" : {
            "description" : "Labels derived from C13 + ncbi_taxonomy.obo.",
            "transform" : [],
            "display_name" : "Taxon",
            "property" : [],
            "searchable" : "true",
            "id" : "taxon_closure_label",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string"
         },
         "taxon" : {
            "id" : "taxon",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false",
            "display_name" : "Taxon",
            "transform" : [],
            "description" : "Column 13: taxon."
         },
         "id" : {
            "transform" : [],
            "display_name" : "Acc",
            "description" : "Gene/product ID.",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "id" : "id",
            "searchable" : "false",
            "property" : []
         },
         "panther_family" : {
            "transform" : [],
            "display_name" : "Protein family",
            "description" : "Family IDs that are associated with this entity.",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "id" : "panther_family",
            "property" : [],
            "searchable" : "true"
         },
         "bioentity_label" : {
            "transform" : [],
            "display_name" : "Gene/product label",
            "description" : "Column 3.",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "id" : "bioentity_label",
            "property" : [],
            "searchable" : "true"
         },
         "annotation_class" : {
            "description" : "Column 5.",
            "display_name" : "Annotation class",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "annotation_class"
         },
         "panther_family_label" : {
            "display_name" : "Family",
            "transform" : [],
            "description" : "Families that are associated with this entity.",
            "id" : "panther_family_label",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "searchable" : "true"
         }
      },
      "id" : "bbop_ann_ev_agg",
      "_strict" : 0,
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann_ev_agg-config.yaml",
      "searchable_extension" : "_searchable",
      "fields" : [
         {
            "transform" : [],
            "display_name" : "Acc",
            "description" : "Gene/product ID.",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "id" : "id",
            "searchable" : "false",
            "property" : []
         },
         {
            "transform" : [],
            "display_name" : "Gene/product ID",
            "description" : "Column 1 + columns 2.",
            "id" : "bioentity",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "searchable" : "false",
            "property" : []
         },
         {
            "transform" : [],
            "display_name" : "Gene/product label",
            "description" : "Column 3.",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "id" : "bioentity_label",
            "property" : [],
            "searchable" : "true"
         },
         {
            "description" : "Column 5.",
            "display_name" : "Annotation class",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "annotation_class"
         },
         {
            "searchable" : "true",
            "property" : [],
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "annotation_class_label",
            "description" : "Column 5 + ontology.",
            "display_name" : "Annotation class label",
            "transform" : []
         },
         {
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "evidence_type_closure",
            "description" : "All evidence for this term/gene product pair",
            "transform" : [],
            "display_name" : "Evidence type"
         },
         {
            "display_name" : "Evidence with",
            "transform" : [],
            "description" : "All column 8s for this term/gene product pair",
            "id" : "evidence_with",
            "cardinality" : "multi",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false"
         },
         {
            "id" : "taxon",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "property" : [],
            "searchable" : "false",
            "display_name" : "Taxon",
            "transform" : [],
            "description" : "Column 13: taxon."
         },
         {
            "transform" : [],
            "display_name" : "Taxon",
            "description" : "Derived from C13 + ncbi_taxonomy.obo.",
            "id" : "taxon_label",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "searchable" : "true",
            "property" : []
         },
         {
            "searchable" : "false",
            "property" : [],
            "id" : "taxon_closure",
            "type" : "string",
            "cardinality" : "multi",
            "required" : "false",
            "indexed" : "true",
            "description" : "IDs derived from C13 + ncbi_taxonomy.obo.",
            "display_name" : "Taxon (IDs)",
            "transform" : []
         },
         {
            "description" : "Labels derived from C13 + ncbi_taxonomy.obo.",
            "transform" : [],
            "display_name" : "Taxon",
            "property" : [],
            "searchable" : "true",
            "id" : "taxon_closure_label",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string"
         },
         {
            "transform" : [],
            "display_name" : "Protein family",
            "description" : "Family IDs that are associated with this entity.",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "id" : "panther_family",
            "property" : [],
            "searchable" : "true"
         },
         {
            "display_name" : "Family",
            "transform" : [],
            "description" : "Families that are associated with this entity.",
            "id" : "panther_family_label",
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "searchable" : "true"
         }
      ],
      "filter_weights" : "evidence_type_closure^4.0 evidence_with^3.0 taxon_closure_label^2.0",
      "result_weights" : "bioentity^4.0 annotation_class^3.0 taxon^2.0",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/ann_ev_agg-config.yaml",
      "document_category" : "annotation_evidence_aggregate"
   },
   "complex_annotation" : {
      "searchable_extension" : "_searchable",
      "_strict" : 0,
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/complex-ann-config.yaml",
      "id" : "complex_annotation",
      "filter_weights" : "annotation_group_label^5.0 enabled_by_label^4.5 location_list_closure_label^4.0 process_class_closure_label^3.0 function_class_closure_label^2.0",
      "fields" : [
         {
            "transform" : [],
            "display_name" : "ID",
            "description" : "A unique (and internal) thing.",
            "id" : "id",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "property" : [],
            "searchable" : "false"
         },
         {
            "searchable" : "false",
            "property" : [],
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "annotation_unit",
            "description" : "???.",
            "display_name" : "Annotation unit",
            "transform" : []
         },
         {
            "property" : [],
            "searchable" : "true",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "id" : "annotation_unit_label",
            "description" : "???.",
            "transform" : [],
            "display_name" : "Annotation unit"
         },
         {
            "description" : "???.",
            "display_name" : "Annotation group",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "annotation_group"
         },
         {
            "property" : [],
            "searchable" : "true",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "id" : "annotation_group_label",
            "description" : "???.",
            "transform" : [],
            "display_name" : "Annotation group"
         },
         {
            "display_name" : "Annotation group URL",
            "transform" : [],
            "description" : "???.",
            "id" : "annotation_group_url",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "searchable" : "false",
            "property" : []
         },
         {
            "transform" : [],
            "display_name" : "Enabled by",
            "description" : "???",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "id" : "enabled_by",
            "searchable" : "true",
            "property" : []
         },
         {
            "transform" : [],
            "display_name" : "Enabled by",
            "description" : "???",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "id" : "enabled_by_label",
            "property" : [],
            "searchable" : "true"
         },
         {
            "display_name" : "PANTHER family",
            "transform" : [],
            "description" : "PANTHER family IDs that are associated with this entity.",
            "id" : "panther_family",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "property" : [],
            "searchable" : "true"
         },
         {
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "panther_family_label",
            "searchable" : "true",
            "property" : [],
            "display_name" : "PANTHER family",
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity."
         },
         {
            "id" : "taxon",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "searchable" : "false",
            "property" : [],
            "display_name" : "Taxon",
            "transform" : [],
            "description" : "GAF column 13 (taxon)."
         },
         {
            "id" : "taxon_label",
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "searchable" : "true",
            "display_name" : "Taxon",
            "transform" : [],
            "description" : "Taxon derived from GAF column 13 and ncbi_taxonomy.obo."
         },
         {
            "display_name" : "Taxon (IDs)",
            "transform" : [],
            "description" : "Taxon IDs derived from GAF column 13 and ncbi_taxonomy.obo.",
            "id" : "taxon_closure",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "searchable" : "false"
         },
         {
            "transform" : [],
            "display_name" : "Taxon",
            "description" : "Taxon label closure derived from GAF column 13 and ncbi_taxonomy.obo.",
            "id" : "taxon_closure_label",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "true",
            "property" : []
         },
         {
            "description" : "Function acc/ID.",
            "transform" : [],
            "display_name" : "Function",
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "id" : "function_class"
         },
         {
            "description" : "Common function name.",
            "transform" : [],
            "display_name" : "Function",
            "searchable" : "true",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "id" : "function_class_label"
         },
         {
            "display_name" : "Function",
            "transform" : [],
            "description" : "???",
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "id" : "function_class_closure",
            "searchable" : "false",
            "property" : []
         },
         {
            "id" : "function_class_closure_label",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Function",
            "description" : "???"
         },
         {
            "display_name" : "Process",
            "transform" : [],
            "description" : "Process acc/ID.",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "process_class",
            "property" : [],
            "searchable" : "false"
         },
         {
            "display_name" : "Process",
            "transform" : [],
            "description" : "Common process name.",
            "id" : "process_class_label",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "searchable" : "true",
            "property" : []
         },
         {
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "process_class_closure",
            "description" : "???",
            "transform" : [],
            "display_name" : "Process"
         },
         {
            "id" : "process_class_closure_label",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Process",
            "description" : "???"
         },
         {
            "id" : "location_list",
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "searchable" : "false",
            "property" : [],
            "display_name" : "Location",
            "transform" : [],
            "description" : ""
         },
         {
            "display_name" : "Location",
            "transform" : [],
            "description" : "",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "location_list_label",
            "property" : [],
            "searchable" : "false"
         },
         {
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "location_list_closure",
            "property" : [],
            "searchable" : "false",
            "display_name" : "Location",
            "transform" : [],
            "description" : ""
         },
         {
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "location_list_closure_label",
            "searchable" : "false",
            "property" : [],
            "display_name" : "Location",
            "transform" : [],
            "description" : ""
         },
         {
            "transform" : [],
            "display_name" : "???",
            "description" : "???",
            "id" : "owl_blob_json",
            "indexed" : "false",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "property" : [],
            "searchable" : "false"
         },
         {
            "id" : "topology_graph_json",
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "false",
            "required" : "false",
            "searchable" : "false",
            "property" : [],
            "display_name" : "Topology graph (JSON)",
            "transform" : [],
            "description" : "JSON blob form of the local stepwise topology graph."
         }
      ],
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/complex-ann-config.yaml",
      "document_category" : "complex_annotation",
      "result_weights" : "function_class^5.0 enabled_by^4.0 location_list^3.0 process_class^2.0 annotation_group^1.0",
      "display_name" : "Complex annotations (ALPHA)",
      "schema_generating" : "true",
      "description" : "An individual unit within LEGO. This is <strong>ALPHA</strong> software.",
      "weight" : "-5",
      "fields_hash" : {
         "location_list_label" : {
            "display_name" : "Location",
            "transform" : [],
            "description" : "",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "location_list_label",
            "property" : [],
            "searchable" : "false"
         },
         "annotation_unit_label" : {
            "property" : [],
            "searchable" : "true",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "id" : "annotation_unit_label",
            "description" : "???.",
            "transform" : [],
            "display_name" : "Annotation unit"
         },
         "taxon_closure" : {
            "display_name" : "Taxon (IDs)",
            "transform" : [],
            "description" : "Taxon IDs derived from GAF column 13 and ncbi_taxonomy.obo.",
            "id" : "taxon_closure",
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "searchable" : "false"
         },
         "owl_blob_json" : {
            "transform" : [],
            "display_name" : "???",
            "description" : "???",
            "id" : "owl_blob_json",
            "indexed" : "false",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "property" : [],
            "searchable" : "false"
         },
         "function_class_label" : {
            "description" : "Common function name.",
            "transform" : [],
            "display_name" : "Function",
            "searchable" : "true",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "id" : "function_class_label"
         },
         "annotation_group_url" : {
            "display_name" : "Annotation group URL",
            "transform" : [],
            "description" : "???.",
            "id" : "annotation_group_url",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "searchable" : "false",
            "property" : []
         },
         "location_list" : {
            "id" : "location_list",
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "searchable" : "false",
            "property" : [],
            "display_name" : "Location",
            "transform" : [],
            "description" : ""
         },
         "process_class" : {
            "display_name" : "Process",
            "transform" : [],
            "description" : "Process acc/ID.",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "process_class",
            "property" : [],
            "searchable" : "false"
         },
         "annotation_unit" : {
            "searchable" : "false",
            "property" : [],
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "id" : "annotation_unit",
            "description" : "???.",
            "display_name" : "Annotation unit",
            "transform" : []
         },
         "function_class_closure_label" : {
            "id" : "function_class_closure_label",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Function",
            "description" : "???"
         },
         "id" : {
            "transform" : [],
            "display_name" : "ID",
            "description" : "A unique (and internal) thing.",
            "id" : "id",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "property" : [],
            "searchable" : "false"
         },
         "process_class_closure" : {
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "process_class_closure",
            "description" : "???",
            "transform" : [],
            "display_name" : "Process"
         },
         "process_class_label" : {
            "display_name" : "Process",
            "transform" : [],
            "description" : "Common process name.",
            "id" : "process_class_label",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "searchable" : "true",
            "property" : []
         },
         "annotation_group_label" : {
            "property" : [],
            "searchable" : "true",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "id" : "annotation_group_label",
            "description" : "???.",
            "transform" : [],
            "display_name" : "Annotation group"
         },
         "panther_family_label" : {
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "panther_family_label",
            "searchable" : "true",
            "property" : [],
            "display_name" : "PANTHER family",
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity."
         },
         "location_list_closure_label" : {
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "location_list_closure_label",
            "searchable" : "false",
            "property" : [],
            "display_name" : "Location",
            "transform" : [],
            "description" : ""
         },
         "process_class_closure_label" : {
            "id" : "process_class_closure_label",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "true",
            "property" : [],
            "transform" : [],
            "display_name" : "Process",
            "description" : "???"
         },
         "topology_graph_json" : {
            "id" : "topology_graph_json",
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "false",
            "required" : "false",
            "searchable" : "false",
            "property" : [],
            "display_name" : "Topology graph (JSON)",
            "transform" : [],
            "description" : "JSON blob form of the local stepwise topology graph."
         },
         "function_class_closure" : {
            "display_name" : "Function",
            "transform" : [],
            "description" : "???",
            "cardinality" : "multi",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "id" : "function_class_closure",
            "searchable" : "false",
            "property" : []
         },
         "function_class" : {
            "description" : "Function acc/ID.",
            "transform" : [],
            "display_name" : "Function",
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "id" : "function_class"
         },
         "panther_family" : {
            "display_name" : "PANTHER family",
            "transform" : [],
            "description" : "PANTHER family IDs that are associated with this entity.",
            "id" : "panther_family",
            "cardinality" : "single",
            "type" : "string",
            "required" : "false",
            "indexed" : "true",
            "property" : [],
            "searchable" : "true"
         },
         "annotation_group" : {
            "description" : "???.",
            "display_name" : "Annotation group",
            "transform" : [],
            "property" : [],
            "searchable" : "false",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "annotation_group"
         },
         "taxon_closure_label" : {
            "transform" : [],
            "display_name" : "Taxon",
            "description" : "Taxon label closure derived from GAF column 13 and ncbi_taxonomy.obo.",
            "id" : "taxon_closure_label",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "searchable" : "true",
            "property" : []
         },
         "taxon" : {
            "id" : "taxon",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "searchable" : "false",
            "property" : [],
            "display_name" : "Taxon",
            "transform" : [],
            "description" : "GAF column 13 (taxon)."
         },
         "taxon_label" : {
            "id" : "taxon_label",
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "property" : [],
            "searchable" : "true",
            "display_name" : "Taxon",
            "transform" : [],
            "description" : "Taxon derived from GAF column 13 and ncbi_taxonomy.obo."
         },
         "enabled_by_label" : {
            "transform" : [],
            "display_name" : "Enabled by",
            "description" : "???",
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "single",
            "id" : "enabled_by_label",
            "property" : [],
            "searchable" : "true"
         },
         "location_list_closure" : {
            "type" : "string",
            "cardinality" : "multi",
            "indexed" : "true",
            "required" : "false",
            "id" : "location_list_closure",
            "property" : [],
            "searchable" : "false",
            "display_name" : "Location",
            "transform" : [],
            "description" : ""
         },
         "enabled_by" : {
            "transform" : [],
            "display_name" : "Enabled by",
            "description" : "???",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string",
            "id" : "enabled_by",
            "searchable" : "true",
            "property" : []
         }
      },
      "boost_weights" : "annotation_group_label^1.0 annotation_unit_label^1.0 enabled_by^1.0 enabled_by_label^1.0 location_list_closure^1.0 location_list_closure_label^1.0 process_class_closure_label^1.0 function_class_closure_label^1.0"
   },
   "family" : {
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/protein-family-config.yaml",
      "result_weights" : "panther_family^5.0 bioentity_list^4.0",
      "document_category" : "family",
      "filter_weights" : "bioentity_list_label^1.0",
      "fields" : [
         {
            "description" : "Family ID.",
            "display_name" : "Acc",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "id"
         },
         {
            "description" : "PANTHER family IDs that are associated with this entity.",
            "display_name" : "PANTHER family",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "panther_family"
         },
         {
            "display_name" : "PANTHER family",
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity.",
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "panther_family_label",
            "searchable" : "true",
            "property" : []
         },
         {
            "description" : "JSON blob form of the phylogenic tree.",
            "transform" : [],
            "display_name" : "This should not be displayed",
            "searchable" : "false",
            "property" : [],
            "id" : "phylo_graph_json",
            "required" : "false",
            "indexed" : "false",
            "cardinality" : "single",
            "type" : "string"
         },
         {
            "description" : "Gene/products annotated with this protein family.",
            "transform" : [],
            "display_name" : "Gene/products",
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "bioentity_list"
         },
         {
            "description" : "Gene/products annotated with this protein family.",
            "transform" : [],
            "display_name" : "Gene/products",
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "bioentity_list_label"
         }
      ],
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/protein-family-config.yaml",
      "_strict" : 0,
      "searchable_extension" : "_searchable",
      "id" : "family",
      "fields_hash" : {
         "phylo_graph_json" : {
            "description" : "JSON blob form of the phylogenic tree.",
            "transform" : [],
            "display_name" : "This should not be displayed",
            "searchable" : "false",
            "property" : [],
            "id" : "phylo_graph_json",
            "required" : "false",
            "indexed" : "false",
            "cardinality" : "single",
            "type" : "string"
         },
         "panther_family" : {
            "description" : "PANTHER family IDs that are associated with this entity.",
            "display_name" : "PANTHER family",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "panther_family"
         },
         "id" : {
            "description" : "Family ID.",
            "display_name" : "Acc",
            "transform" : [],
            "searchable" : "false",
            "property" : [],
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "id"
         },
         "bioentity_list_label" : {
            "description" : "Gene/products annotated with this protein family.",
            "transform" : [],
            "display_name" : "Gene/products",
            "searchable" : "false",
            "property" : [],
            "required" : "false",
            "indexed" : "true",
            "type" : "string",
            "cardinality" : "multi",
            "id" : "bioentity_list_label"
         },
         "bioentity_list" : {
            "description" : "Gene/products annotated with this protein family.",
            "transform" : [],
            "display_name" : "Gene/products",
            "searchable" : "false",
            "property" : [],
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "multi",
            "type" : "string",
            "id" : "bioentity_list"
         },
         "panther_family_label" : {
            "display_name" : "PANTHER family",
            "transform" : [],
            "description" : "PANTHER families that are associated with this entity.",
            "type" : "string",
            "cardinality" : "single",
            "indexed" : "true",
            "required" : "false",
            "id" : "panther_family_label",
            "searchable" : "true",
            "property" : []
         }
      },
      "weight" : "5",
      "description" : "Information about protein (PANTHER) families.",
      "boost_weights" : "panther_family^2.0 panther_family_label^2.0 bioentity_list^1.0 bioentity_list_label^1.0",
      "display_name" : "Protein families",
      "schema_generating" : "true"
   },
   "general" : {
      "schema_generating" : "true",
      "display_name" : "General",
      "boost_weights" : "entity^3.0 entity_label^3.0 general_blob^3.0",
      "weight" : "0",
      "description" : "A generic search document to get a general overview of everything.",
      "fields_hash" : {
         "category" : {
            "description" : "The document category that this enitity belongs to.",
            "transform" : [],
            "display_name" : "Document category",
            "property" : [],
            "searchable" : "false",
            "id" : "category",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string"
         },
         "id" : {
            "property" : [],
            "searchable" : "false",
            "id" : "id",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "description" : "The mangled internal ID for this entity.",
            "transform" : [],
            "display_name" : "Internal ID"
         },
         "general_blob" : {
            "description" : "A hidden searchable blob document to access this item. It should contain all the goodies that we want to search for, like species(?), synonyms, etc.",
            "display_name" : "Generic blob",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "id" : "general_blob"
         },
         "entity_label" : {
            "transform" : [],
            "display_name" : "Enity label",
            "description" : "The label for this entity.",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "id" : "entity_label",
            "searchable" : "true",
            "property" : []
         },
         "entity" : {
            "display_name" : "Entity",
            "transform" : [],
            "description" : "The ID/label for this entity.",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "entity",
            "searchable" : "false",
            "property" : []
         }
      },
      "id" : "general",
      "_strict" : 0,
      "_infile" : "/home/sjcarbon/local/src/git/amigo/metadata/general-config.yaml",
      "searchable_extension" : "_searchable",
      "filter_weights" : "category^4.0",
      "fields" : [
         {
            "property" : [],
            "searchable" : "false",
            "id" : "id",
            "indexed" : "true",
            "required" : "false",
            "cardinality" : "single",
            "type" : "string",
            "description" : "The mangled internal ID for this entity.",
            "transform" : [],
            "display_name" : "Internal ID"
         },
         {
            "display_name" : "Entity",
            "transform" : [],
            "description" : "The ID/label for this entity.",
            "type" : "string",
            "cardinality" : "single",
            "required" : "false",
            "indexed" : "true",
            "id" : "entity",
            "searchable" : "false",
            "property" : []
         },
         {
            "transform" : [],
            "display_name" : "Enity label",
            "description" : "The label for this entity.",
            "indexed" : "true",
            "required" : "false",
            "type" : "string",
            "cardinality" : "single",
            "id" : "entity_label",
            "searchable" : "true",
            "property" : []
         },
         {
            "description" : "The document category that this enitity belongs to.",
            "transform" : [],
            "display_name" : "Document category",
            "property" : [],
            "searchable" : "false",
            "id" : "category",
            "required" : "false",
            "indexed" : "true",
            "cardinality" : "single",
            "type" : "string"
         },
         {
            "description" : "A hidden searchable blob document to access this item. It should contain all the goodies that we want to search for, like species(?), synonyms, etc.",
            "display_name" : "Generic blob",
            "transform" : [],
            "searchable" : "true",
            "property" : [],
            "cardinality" : "single",
            "type" : "string",
            "indexed" : "true",
            "required" : "false",
            "id" : "general_blob"
         }
      ],
      "document_category" : "general",
      "_outfile" : "/home/sjcarbon/local/src/git/amigo/metadata/general-config.yaml",
      "result_weights" : "entity^3.0 category^1.0"
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
    var meta_data = {"js_base":"http://localhost:9999/static/js","bbop_img_star":"http://localhost:9999/static/images/star.png","ontologies":[],"species_map":{},"gp_types":[],"species":[],"app_base":"http://localhost:9999","image_base":"http://localhost:9999/static/images","term_regexp":"all|GO:[0-9]{7}","golr_base":"http://localhost:8080/solr/","css_base":"http://localhost:9999/static/css","sources":[],"js_dev_base":"http://localhost:9999/static/staging","galaxy_base":null,"beta":"1","evidence_codes":{},"html_base":"http://localhost:9999/static"};

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
   "fypo" : {
      "name" : null,
      "url_example" : null,
      "object" : "Identifier",
      "database" : "Fission Yeast Phenotype Ontology",
      "generic_url" : "http://www.pombase.org/",
      "example_id" : "FYPO:0000001",
      "fullname" : null,
      "local_id_syntax" : "^\\d{7}$",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "abbreviation" : "FYPO"
   },
   "dbsnp" : {
      "abbreviation" : "dbSNP",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "local_id_syntax" : "^\\d+$",
      "fullname" : null,
      "example_id" : "dbSNP:rs3131969",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/projects/SNP",
      "url_example" : "http://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=rs3131969",
      "object" : "Identifier",
      "database" : "NCBI dbSNP",
      "name" : null
   },
   "pubmed" : {
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/pubmed/[example_id]",
      "abbreviation" : "PubMed",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "example_id" : "PMID:4208797",
      "local_id_syntax" : "^[0-9]+$",
      "database" : "PubMed",
      "object" : "Identifier",
      "url_example" : "http://www.ncbi.nlm.nih.gov/pubmed/4208797",
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/PubMed/"
   },
   "doi" : {
      "local_id_syntax" : "^10\\.[0-9]+\\/.*$",
      "example_id" : "DOI:10.1016/S0963-9969(99)00021-6",
      "fullname" : null,
      "generic_url" : "http://dx.doi.org/",
      "name" : null,
      "url_example" : "http://dx.doi.org/DOI:10.1016/S0963-9969(99)00021-6",
      "object" : "Identifier",
      "database" : "Digital Object Identifier",
      "abbreviation" : "DOI",
      "url_syntax" : "http://dx.doi.org/DOI:[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "po_ref" : {
      "fullname" : null,
      "example_id" : "PO_REF:00001",
      "url_example" : "http://wiki.plantontology.org:8080/index.php/PO_REF:00001",
      "database" : "Plant Ontology custom references",
      "object" : "Reference identifier",
      "name" : null,
      "generic_url" : "http://wiki.plantontology.org:8080/index.php/PO_references",
      "url_syntax" : "http://wiki.plantontology.org:8080/index.php/PO_REF:[example_id]",
      "abbreviation" : "PO_REF",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null
   },
   "ncbi" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "database" : "National Center for Biotechnology Information",
      "url_example" : null,
      "object" : "Prefix",
      "name" : null,
      "! url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=",
      "fullname" : null,
      "example_id" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "! url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "abbreviation" : "NCBI",
      "url_syntax" : null
   },
   "reac" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=[example_id]",
      "abbreviation" : "REAC",
      "object" : "Identifier",
      "database" : "Reactome - a curated knowledgebase of biological pathways",
      "url_example" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=REACT_604",
      "name" : null,
      "generic_url" : "http://www.reactome.org/",
      "fullname" : null,
      "example_id" : "Reactome:REACT_604",
      "local_id_syntax" : "^REACT_[0-9]+$"
   },
   "cas_spc" : {
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "name" : null,
      "object" : "Identifier",
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=1979",
      "database" : "Catalog of Fishes species database",
      "example_id" : null,
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "CAS_SPC",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=[example_id]"
   },
   "mo" : {
      "fullname" : null,
      "example_id" : "MO:Action",
      "generic_url" : "http://mged.sourceforge.net/ontologies/MGEDontology.php",
      "database" : "MGED Ontology",
      "url_example" : "http://mged.sourceforge.net/ontologies/MGEDontology.php#Action",
      "object" : "ontology term",
      "name" : null,
      "abbreviation" : "MO",
      "url_syntax" : "http://mged.sourceforge.net/ontologies/MGEDontology.php#[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "iuphar_receptor" : {
      "fullname" : null,
      "example_id" : "IUPHAR_RECEPTOR:2205",
      "database" : "International Union of Pharmacology",
      "url_example" : "http://www.iuphar-db.org/DATABASE/ObjectDisplayForward?objectId=56",
      "object" : "Receptor identifier",
      "name" : null,
      "generic_url" : "http://www.iuphar.org/",
      "url_syntax" : "http://www.iuphar-db.org/DATABASE/ObjectDisplayForward?objectId=[example_id]",
      "abbreviation" : "IUPHAR_RECEPTOR",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "eurofung" : {
      "generic_url" : "http://www.eurofung.net/option=com_content&task=section&id=3&Itemid=4",
      "url_example" : null,
      "database" : "Eurofungbase community annotation",
      "object" : null,
      "name" : null,
      "fullname" : null,
      "example_id" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "Eurofung",
      "url_syntax" : null
   },
   "goc" : {
      "example_id" : null,
      "fullname" : null,
      "generic_url" : "http://www.geneontology.org/",
      "name" : null,
      "object" : null,
      "url_example" : null,
      "database" : "Gene Ontology Consortium",
      "abbreviation" : "GOC",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "tigr_egad" : {
      "example_id" : "JCVI_EGAD:74462",
      "fullname" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "name" : null,
      "database" : "EGAD database at the J. Craig Venter Institute",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=74462",
      "object" : "Accession",
      "abbreviation" : "TIGR_EGAD",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "prow" : {
      "abbreviation" : "PROW",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/prow/",
      "url_example" : null,
      "object" : null,
      "database" : "Protein Reviews on the Web",
      "name" : null
   },
   "asap" : {
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "example_id" : "ASAP:ABE-0000008",
      "generic_url" : "https://asap.ahabs.wisc.edu/annotation/php/ASAP1.htm",
      "url_example" : "https://asap.ahabs.wisc.edu/annotation/php/feature_info.php?FeatureID=ABE-0000008",
      "object" : "Feature identifier",
      "database" : "A Systematic Annotation Package for Community Analysis of Genomes",
      "name" : null,
      "abbreviation" : "ASAP",
      "url_syntax" : "https://asap.ahabs.wisc.edu/annotation/php/feature_info.php?FeatureID=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "gr_ref" : {
      "abbreviation" : "GR_REF",
      "url_syntax" : "http://www.gramene.org/db/literature/pub_search?ref_id=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "GR_REF:659",
      "fullname" : null,
      "generic_url" : "http://www.gramene.org/",
      "name" : null,
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "url_example" : "http://www.gramene.org/db/literature/pub_search?ref_id=659",
      "object" : "Reference",
      "database" : null
   },
   "genedb_pfalciparum" : {
      "id" : null,
      "uri_prefix" : null,
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=malaria&name=[example_id]",
      "shorthand_name" : "Pfalciparum",
      "generic_url" : "http://www.genedb.org/genedb/malaria/",
      "database" : "Plasmodium falciparum GeneDB",
      "url_example" : "http://www.genedb.org/genedb/Search?organism=malaria&name=PFD0755c",
      "local_id_syntax" : "^SP[A-Z0-9]+\\.[A-Za-z0-9]+$",
      "example_id" : "GeneDB_Pfalciparum:PFD0755c",
      "fullname" : null,
      "replaced_by" : "GeneDB",
      "datatype" : null,
      "is_obsolete" : "true",
      "abbreviation" : "GeneDB_Pfalciparum",
      "name" : null,
      "object" : "Gene identifier"
   },
   "ncbi_taxid" : {
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "abbreviation" : "ncbi_taxid",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "fullname" : null,
      "example_id" : "taxon:7227",
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "database" : "NCBI Taxonomy",
      "object" : "Identifier",
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/"
   },
   "sp_sl" : {
      "example_id" : "UniProtKB-SubCell:SL-0012",
      "fullname" : null,
      "generic_url" : "http://www.uniprot.org/locations/",
      "name" : null,
      "url_example" : "http://www.uniprot.org/locations/SL-0012",
      "database" : "UniProt Knowledgebase Subcellular Location vocabulary",
      "object" : "Identifier",
      "abbreviation" : "SP_SL",
      "url_syntax" : "http://www.uniprot.org/locations/[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "genedb_gmorsitans" : {
      "abbreviation" : "GeneDB_Gmorsitans",
      "shorthand_name" : "Tsetse",
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=glossina&name=[example_id]",
      "id" : null,
      "datatype" : null,
      "is_obsolete" : "true",
      "uri_prefix" : null,
      "example_id" : "GeneDB_Gmorsitans:Gmm-0142",
      "replaced_by" : "GeneDB",
      "fullname" : null,
      "generic_url" : "http://www.genedb.org/genedb/glossina/",
      "name" : null,
      "url_example" : "http://www.genedb.org/genedb/Search?organism=glossina&name=Gmm-0142",
      "database" : "Glossina morsitans GeneDB",
      "object" : "Gene identifier"
   },
   "alzheimers_university_of_toronto" : {
      "fullname" : null,
      "example_id" : null,
      "database" : "Alzheimers Project at University of Toronto",
      "url_example" : null,
      "object" : null,
      "name" : null,
      "generic_url" : "http://www.ims.utoronto.ca/",
      "url_syntax" : null,
      "abbreviation" : "Alzheimers_University_of_Toronto",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "ddb_ref" : {
      "name" : null,
      "database" : "dictyBase literature references",
      "object" : "Literature Reference Identifier",
      "url_example" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=10157",
      "generic_url" : "http://dictybase.org",
      "example_id" : "dictyBase_REF:10157",
      "fullname" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=[example_id]",
      "abbreviation" : "DDB_REF"
   },
   "pamgo_mgg" : {
      "url_syntax" : "http://scotland.fgl.ncsu.edu/cgi-bin/adHocQuery.cgi?adHocQuery_dbName=smeng_goannotation&Action=Data&QueryName=Functional+Categorization+of+MGG+GO+Annotation&P_KeyWord=[example_id]",
      "abbreviation" : "PAMGO_MGG",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "description" : "Magnaporthe grisea database at North Carolina State University; member of PAMGO Interest Group",
      "example_id" : "PAMGO_MGG:MGG_05132",
      "fullname" : null,
      "name" : null,
      "url_example" : "http://scotland.fgl.ncsu.edu/cgi-bin/adHocQuery.cgi?adHocQuery_dbName=smeng_goannotation&Action=Data&QueryName=Functional+Categorization+of+MGG+GO+Annotation&P_KeyWord=MGG_05132",
      "object" : "Locus",
      "database" : "Magnaporthe grisea database",
      "generic_url" : "http://scotland.fgl.ncsu.edu/smeng/GoAnnotationMagnaporthegrisea.html"
   },
   "um-bbd_pathwayid" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://umbbd.msi.umn.edu/[example_id]/[example_id]_map.html",
      "abbreviation" : "UM-BBD_pathwayID",
      "name" : null,
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "url_example" : "http://umbbd.msi.umn.edu/acr/acr_map.html",
      "object" : "Pathway identifier",
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "example_id" : "UM-BBD_pathwayID:acr",
      "fullname" : null
   },
   "lifedb" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.dkfz.de/LIFEdb/LIFEdb.aspx?ID=[example_id]",
      "abbreviation" : "LIFEdb",
      "object" : "cDNA clone identifier",
      "url_example" : "http://www.dkfz.de/LIFEdb/LIFEdb.aspx?ID=DKFZp564O1716",
      "database" : "LifeDB",
      "name" : null,
      "generic_url" : "http://www.lifedb.de/",
      "fullname" : null,
      "description" : "LifeDB is a database for information on protein localization, interaction, functional assays and expression.",
      "example_id" : "LIFEdb:DKFZp564O1716"
   },
   "biocyc" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://biocyc.org/META/NEW-IMAGE?type=PATHWAY&object=[example_id]",
      "abbreviation" : "BioCyc",
      "database" : "BioCyc collection of metabolic pathway databases",
      "url_example" : "http://biocyc.org/META/NEW-IMAGE?type=PATHWAY&object=PWY-5271",
      "object" : "Identifier",
      "name" : null,
      "generic_url" : "http://biocyc.org/",
      "fullname" : null,
      "example_id" : "BioCyc:PWY-5271"
   },
   "mgd" : {
      "name" : null,
      "url_example" : null,
      "database" : "Mouse Genome Database",
      "object" : "Gene symbol",
      "generic_url" : "http://www.informatics.jax.org/",
      "example_id" : "MGD:Adcy9",
      "fullname" : null,
      "! url_syntax" : "http://www.informatics.jax.org/searches/marker.cgi?",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "MGD"
   },
   "rhea" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "RHEA",
      "url_syntax" : "http://www.ebi.ac.uk/rhea/reaction.xhtml?id=[example_id]",
      "generic_url" : "http://www.ebi.ac.uk/rhea/",
      "name" : null,
      "url_example" : "http://www.ebi.ac.uk/rhea/reaction.xhtml?id=25811",
      "object" : "Accession",
      "database" : "Rhea, the Annotated Reactions Database",
      "description" : "Rhea is a freely available, manually annotated database of chemical reactions created in collaboration with the Swiss Institute of Bioinformatics (SIB).",
      "example_id" : "RHEA:25811",
      "fullname" : null
   },
   "merops" : {
      "entity_type" : "PR:000000001 ! protein",
      "example_id" : "MEROPS:A08.001",
      "fullname" : null,
      "generic_url" : "http://merops.sanger.ac.uk/",
      "name" : null,
      "url_example" : "http://merops.sanger.ac.uk/cgi-bin/pepsum?mid=A08.001",
      "object" : "Identifier",
      "database" : "MEROPS peptidase database",
      "abbreviation" : "MEROPS",
      "url_syntax" : "http://merops.sanger.ac.uk/cgi-bin/pepsum?mid=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "jstor" : {
      "abbreviation" : "JSTOR",
      "url_syntax" : "http://www.jstor.org/stable/[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "JSTOR:3093870",
      "fullname" : null,
      "generic_url" : "http://www.jstor.org/",
      "name" : null,
      "object" : "journal article",
      "url_example" : "http://www.jstor.org/stable/3093870",
      "database" : "Digital archive of scholarly articles"
   },
   "pato" : {
      "example_id" : "PATO:0001420",
      "fullname" : null,
      "name" : null,
      "database" : "Phenotypic quality ontology",
      "url_example" : null,
      "object" : "Identifier",
      "generic_url" : "http://www.bioontology.org/wiki/index.php/PATO:Main_Page",
      "url_syntax" : null,
      "abbreviation" : "PATO",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null
   },
   "protein_id" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "url_example" : null,
      "object" : "Identifier",
      "database" : "DDBJ / ENA / GenBank",
      "name" : null,
      "local_id_syntax" : "^[A-Z]{3}[0-9]{5}(\\.[0-9]+)?$",
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "description" : "protein identifier shared by DDBJ/EMBL-bank/GenBank nucleotide sequence databases",
      "example_id" : "protein_id:CAA71991",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "protein_id",
      "url_syntax" : null
   },
   "genedb_spombe" : {
      "datatype" : null,
      "is_obsolete" : "true",
      "abbreviation" : "GeneDB_Spombe",
      "object" : "Gene identifier",
      "name" : null,
      "entity_type" : "SO:0000704 ! gene ",
      "id" : null,
      "uri_prefix" : null,
      "shorthand_name" : "Spombe",
      "url_syntax" : "http://old.genedb.org/genedb/Search?organism=pombe&name=[example_id]",
      "generic_url" : "http://old.genedb.org/genedb/pombe/index.jsp",
      "database" : "Schizosaccharomyces pombe GeneDB",
      "url_example" : "http://old.genedb.org/genedb/Search?organism=pombe&name=SPAC890.04C",
      "local_id_syntax" : "^SP[A-Z0-9]+\\.[A-Za-z0-9]+$",
      "replaced_by" : "PomBase",
      "fullname" : null,
      "example_id" : "GeneDB_Spombe:SPAC890.04C"
   },
   "brenda" : {
      "generic_url" : "http://www.brenda-enzymes.info",
      "name" : null,
      "url_example" : "http://www.brenda-enzymes.info/php/result_flat.php4?ecno=4.2.1.3",
      "database" : "BRENDA, The Comprehensive Enzyme Information System",
      "object" : "EC enzyme identifier",
      "entity_type" : "GO:0003824 ! catalytic activity",
      "example_id" : "BRENDA:4.2.1.3",
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "BRENDA",
      "url_syntax" : "http://www.brenda-enzymes.info/php/result_flat.php4?ecno=[example_id]"
   },
   "taxon" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "taxon",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "object" : "Identifier",
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "database" : "NCBI Taxonomy",
      "name" : null,
      "fullname" : null,
      "example_id" : "taxon:7227"
   },
   "ensemblfungi" : {
      "abbreviation" : "EnsemblFungi",
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "entity_type" : "SO:0000704 ! gene",
      "example_id" : "EnsemblFungi:YOR197W",
      "fullname" : null,
      "generic_url" : "http://fungi.ensembl.org/",
      "name" : null,
      "database" : "Ensembl Fungi, the Ensembl Genomes database for accessing fungal genome data",
      "url_example" : "http://www.ensemblgenomes.org/id/YOR197W",
      "object" : "Identifier"
   },
   "genprotec" : {
      "fullname" : null,
      "example_id" : null,
      "url_example" : null,
      "database" : "GenProtEC E. coli genome and proteome database",
      "object" : null,
      "name" : null,
      "generic_url" : "http://genprotec.mbl.edu/",
      "url_syntax" : null,
      "abbreviation" : "GenProtEC",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "ptarget" : {
      "fullname" : null,
      "example_id" : null,
      "generic_url" : "http://bioinformatics.albany.edu/~ptarget/",
      "object" : null,
      "url_example" : null,
      "database" : "pTARGET Prediction server for protein subcellular localization",
      "name" : null,
      "abbreviation" : "pTARGET",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "jcvi_egad" : {
      "object" : "Accession",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=74462",
      "database" : "EGAD database at the J. Craig Venter Institute",
      "name" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "fullname" : null,
      "example_id" : "JCVI_EGAD:74462",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/EgadSearch.cgi?search_string=[example_id]",
      "abbreviation" : "JCVI_EGAD"
   },
   "nif_subcellular" : {
      "fullname" : null,
      "example_id" : "NIF_Subcellular:sao1186862860",
      "object" : "ontology term",
      "url_example" : "http://www.neurolex.org/wiki/sao1770195789",
      "database" : "Neuroscience Information Framework standard ontology, subcellular hierarchy",
      "name" : null,
      "generic_url" : "http://www.neurolex.org/wiki",
      "url_syntax" : "http://www.neurolex.org/wiki/[example_id]",
      "abbreviation" : "NIF_Subcellular",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null
   },
   "cacao" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://gowiki.tamu.edu/wiki/index.php/[example_id]",
      "abbreviation" : "CACAO",
      "url_example" : "http://gowiki.tamu.edu/wiki/index.php/MYCS2:A0QNF5",
      "database" : "Community Assessment of Community Annotation with Ontologies",
      "object" : "accession",
      "name" : null,
      "generic_url" : "http://gowiki.tamu.edu/wiki/index.php/Category:CACAO",
      "fullname" : null,
      "example_id" : "MYCS2:A0QNF5",
      "description" : "The Community Assessment of Community Annotation with Ontologies (CACAO) is a project to do large-scale manual community annotation of gene function using the Gene Ontology as a multi-institution student competition. "
   },
   "trait" : {
      "example_id" : null,
      "description" : "an integrated database of transcripts expressed in human skeletal muscle",
      "fullname" : null,
      "name" : null,
      "url_example" : null,
      "object" : null,
      "database" : "TRAnscript Integrated Table",
      "generic_url" : "http://muscle.cribi.unipd.it/",
      "url_syntax" : null,
      "abbreviation" : "TRAIT",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "pharmgkb" : {
      "name" : null,
      "database" : "Pharmacogenetics and Pharmacogenomics Knowledge Base",
      "url_example" : "http://www.pharmgkb.org/do/serve?objId=PA267",
      "object" : null,
      "generic_url" : "http://www.pharmgkb.org",
      "example_id" : "PharmGKB:PA267",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.pharmgkb.org/do/serve?objId=[example_id]",
      "abbreviation" : "PharmGKB"
   },
   "maizegdb_locus" : {
      "example_id" : "MaizeGDB_Locus:ZmPK1",
      "fullname" : null,
      "local_id_syntax" : "^[A-Za-z][A-Za-z0-9]*$",
      "name" : null,
      "database" : "MaizeGDB",
      "url_example" : "http://www.maizegdb.org/cgi-bin/displaylocusresults.cgi?term=ZmPK1",
      "object" : "Maize gene name",
      "generic_url" : "http://www.maizegdb.org",
      "url_syntax" : "http://www.maizegdb.org/cgi-bin/displaylocusresults.cgi?term=[example_id]",
      "abbreviation" : "MaizeGDB_Locus",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "so" : {
      "generic_url" : "http://sequenceontology.org/",
      "name" : null,
      "database" : "Sequence Ontology",
      "url_example" : "http://song.sourceforge.net/SOterm_tables.html#SO:0000195",
      "object" : "Identifier",
      "entity_type" : "SO:0000110 ! sequence feature",
      "local_id_syntax" : "^\\d{7}$",
      "example_id" : "SO:0000195",
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "SO",
      "url_syntax" : "http://song.sourceforge.net/SOterm_tables.html#SO:[example_id]"
   },
   "dictybase_ref" : {
      "abbreviation" : "dictyBase_REF",
      "url_syntax" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "dictyBase_REF:10157",
      "fullname" : null,
      "generic_url" : "http://dictybase.org",
      "name" : null,
      "database" : "dictyBase literature references",
      "url_example" : "http://dictybase.org/db/cgi-bin/dictyBase/reference/reference.pl?refNo=10157",
      "object" : "Literature Reference Identifier"
   },
   "obo_sf_po" : {
      "example_id" : "OBO_SF_PO:3184921",
      "fullname" : null,
      "name" : null,
      "object" : "Term request",
      "url_example" : "https://sourceforge.net/tracker/index.php?func=detail&aid=3184921&group_id=76834&atid=835555",
      "database" : "Source Forge OBO Plant Ontology (PO) term request tracker",
      "generic_url" : "http://sourceforge.net/tracker/?func=browse&group_id=76834&atid=835555",
      "url_syntax" : "https://sourceforge.net/tracker/index.php?func=detail&aid=[example_id]&group_id=76834&atid=835555",
      "abbreviation" : "OBO_SF_PO",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "ecogene_g" : {
      "url_example" : null,
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "object" : "EcoGene Primary Gene Name",
      "name" : null,
      "generic_url" : "http://www.ecogene.org/",
      "fullname" : null,
      "example_id" : "ECOGENE_G:deoC",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "ECOGENE_G"
   },
   "mtbbase" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "MTBBASE",
      "url_syntax" : null,
      "generic_url" : "http://www.ark.in-berlin.de/Site/MTBbase.html",
      "name" : null,
      "url_example" : null,
      "database" : "Collection and Refinement of Physiological Data on Mycobacterium tuberculosis",
      "object" : null,
      "example_id" : null,
      "fullname" : null
   },
   "agbase" : {
      "example_id" : null,
      "fullname" : null,
      "generic_url" : "http://www.agbase.msstate.edu/",
      "name" : null,
      "url_example" : null,
      "database" : "AgBase resource for functional analysis of agricultural plant and animal gene products",
      "object" : null,
      "abbreviation" : "AgBase",
      "url_syntax" : "http://www.agbase.msstate.edu/cgi-bin/getEntry.pl?db_pick=[ChickGO/MaizeGO]&uid=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "hpa_antibody" : {
      "name" : null,
      "object" : "Identifier",
      "url_example" : "http://www.proteinatlas.org/antibody_info.php?antibody_id=HPA000237",
      "database" : "Human Protein Atlas antibody information",
      "generic_url" : "http://www.proteinatlas.org/",
      "example_id" : "HPA_antibody:HPA000237",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.proteinatlas.org/antibody_info.php?antibody_id=[example_id]",
      "abbreviation" : "HPA_antibody"
   },
   "rnamods" : {
      "name" : null,
      "database" : "RNA Modification Database",
      "url_example" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?091",
      "object" : "Identifier",
      "generic_url" : "http://s59.cas.albany.edu/RNAmods/",
      "example_id" : "RNAmods:037",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?[example_id]",
      "abbreviation" : "RNAmods"
   },
   "aspgdid" : {
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "abbreviation" : "AspGDID",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "example_id" : "AspGD:ASPL0000067538",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^ASPL[0-9]{10}$",
      "name" : null,
      "object" : "Identifier for AspGD Loci",
      "database" : "Aspergillus Genome Database",
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=ASPL0000067538",
      "generic_url" : "http://www.aspergillusgenome.org/"
   },
   "ddb" : {
      "fullname" : null,
      "example_id" : "dictyBase:DDB_G0277859",
      "local_id_syntax" : "^DDB_G[0-9]{7}$",
      "entity_type" : "SO:0000704 ! gene",
      "url_example" : "http://dictybase.org/gene/DDB_G0277859",
      "object" : "Identifier",
      "database" : "dictyBase",
      "name" : null,
      "generic_url" : "http://dictybase.org",
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "abbreviation" : "DDB",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "tigr_tigrfams" : {
      "url_syntax" : "http://search.jcvi.org/search?p&q=[example_id]",
      "abbreviation" : "TIGR_TIGRFAMS",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "example_id" : "JCVI_TIGRFAMS:TIGR00254",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "object" : "Accession",
      "database" : "TIGRFAMs HMM collection at the J. Craig Venter Institute",
      "url_example" : "http://search.jcvi.org/search?p&q=TIGR00254",
      "name" : null,
      "generic_url" : "http://search.jcvi.org/"
   },
   "ensemblplants/gramene" : {
      "entity_type" : "SO:0000704 ! gene",
      "example_id" : "EnsemblPlants:LOC_Os01g22954",
      "fullname" : null,
      "generic_url" : "http://plants.ensembl.org/",
      "name" : null,
      "database" : "Ensembl Plants, the Ensembl Genomes database for accessing plant genome data",
      "url_example" : "http://www.ensemblgenomes.org/id/LOC_Os01g22954",
      "object" : "Identifier",
      "abbreviation" : "EnsemblPlants/Gramene",
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "refseq" : {
      "abbreviation" : "RefSeq",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "local_id_syntax" : "^(NC|AC|NG|NT|NW|NZ|NM|NR|XM|XR|NP|AP|XP|ZP)_\\d+$",
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "example_id" : "RefSeq:XP_001068954",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/RefSeq/",
      "database" : "RefSeq",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=XP_001068954",
      "object" : "Identifier",
      "name" : null
   },
   "locusid" : {
      "abbreviation" : "LocusID",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^\\d+$",
      "example_id" : "NCBI_Gene:4771",
      "fullname" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "name" : null,
      "object" : "Identifier",
      "database" : "NCBI Gene",
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771"
   },
   "rgdid" : {
      "abbreviation" : "RGDID",
      "url_syntax" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^[0-9]{4,7}$",
      "example_id" : "RGD:2004",
      "fullname" : null,
      "generic_url" : "http://rgd.mcw.edu/",
      "name" : null,
      "object" : "Accession",
      "url_example" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=2004",
      "database" : "Rat Genome Database"
   },
   "biomdid" : {
      "example_id" : "BIOMD:BIOMD0000000045",
      "fullname" : null,
      "name" : null,
      "database" : "BioModels Database",
      "object" : "Accession",
      "url_example" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=BIOMD0000000045",
      "generic_url" : "http://www.ebi.ac.uk/biomodels/",
      "url_syntax" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=[example_id]",
      "abbreviation" : "BIOMDID",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null
   },
   "pinc" : {
      "description" : "represents GO annotations created in 2001 for NCBI and extracted into UniProtKB-GOA from EntrezGene",
      "example_id" : null,
      "fullname" : null,
      "generic_url" : "http://www.proteome.com/",
      "name" : null,
      "url_example" : null,
      "object" : null,
      "database" : "Proteome Inc.",
      "abbreviation" : "PINC",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "gb" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "name" : null,
      "database" : "GenBank",
      "object" : "Sequence accession",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=AA816246",
      "entity_type" : "PR:000000001 ! protein ",
      "local_id_syntax" : "^[A-Z]{2}[0-9]{6}$",
      "description" : "The NIH genetic sequence database, an annotated collection of all publicly available DNA sequences.",
      "example_id" : "GB:AA816246",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "GB",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=[example_id]"
   },
   "germonline" : {
      "fullname" : null,
      "example_id" : null,
      "generic_url" : "http://www.germonline.org/",
      "url_example" : null,
      "object" : null,
      "database" : "GermOnline",
      "name" : null,
      "abbreviation" : "GermOnline",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "go" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "GO",
      "url_syntax" : "http://amigo.geneontology.org/cgi-bin/amigo/term-details.cgi?term=GO:[example_id]",
      "generic_url" : "http://amigo.geneontology.org/",
      "url_example" : "http://amigo.geneontology.org/cgi-bin/amigo/term-details.cgi?term=GO:0004352",
      "database" : "Gene Ontology Database",
      "object" : "Identifier",
      "name" : null,
      "local_id_syntax" : "^\\d{7}$",
      "entity_type" : "GO:0032991 ! macromolecular complex",
      "fullname" : null,
      "example_id" : "GO:0004352"
   },
   "cgen" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "CGEN",
      "url_syntax" : null,
      "generic_url" : "http://www.cgen.com/",
      "object" : "Identifier",
      "url_example" : null,
      "database" : "Compugen Gene Ontology Gene Association Data",
      "name" : null,
      "fullname" : null,
      "example_id" : "CGEN:PrID131022"
   },
   "mi" : {
      "example_id" : "MI:0018",
      "fullname" : null,
      "name" : null,
      "object" : "Interaction identifier",
      "database" : "Proteomic Standard Initiative for Molecular Interaction",
      "url_example" : null,
      "generic_url" : "http://psidev.sourceforge.net/mi/xml/doc/user/index.html",
      "url_syntax" : null,
      "abbreviation" : "MI",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "ri" : {
      "name" : null,
      "database" : "Roslin Institute",
      "object" : null,
      "url_example" : null,
      "generic_url" : "http://www.roslin.ac.uk/",
      "example_id" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "RI"
   },
   "pdb" : {
      "object" : "Identifier",
      "url_example" : "http://www.rcsb.org/pdb/cgi/explore.cgi?pdbId=1A4U",
      "database" : "Protein Data Bank",
      "name" : null,
      "generic_url" : "http://www.rcsb.org/pdb/",
      "fullname" : null,
      "example_id" : "PDB:1A4U",
      "local_id_syntax" : "^[A-Za-z0-9]{4}$",
      "entity_type" : "PR:000000001 ! protein",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.rcsb.org/pdb/cgi/explore.cgi?pdbId=[example_id]",
      "abbreviation" : "PDB"
   },
   "cog_function" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/grace/shokog.cgi?fun=[example_id]",
      "abbreviation" : "COG_Function",
      "name" : null,
      "object" : "Identifier",
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/grace/shokog.cgi?fun=H",
      "database" : "NCBI COG function",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "example_id" : "COG_Function:H",
      "fullname" : null
   },
   "pfam" : {
      "url_syntax" : "http://www.sanger.ac.uk/cgi-bin/Pfam/getacc?[example_id]",
      "abbreviation" : "Pfam",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "fullname" : null,
      "example_id" : "Pfam:PF00046",
      "description" : "Pfam is a collection of protein families represented by sequence alignments and hidden Markov models (HMMs)",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "object" : "Accession",
      "url_example" : "http://www.sanger.ac.uk/cgi-bin/Pfam/getacc?PF00046",
      "database" : "Pfam database of protein families",
      "name" : null,
      "generic_url" : "http://www.sanger.ac.uk/Software/Pfam/"
   },
   "uniprotkb/swiss-prot" : {
      "generic_url" : "http://www.uniprot.org",
      "object" : "Accession",
      "database" : "UniProtKB/Swiss-Prot",
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "name" : null,
      "fullname" : null,
      "replaced_by" : "UniProtKB",
      "description" : "A curated protein sequence database which provides a high level of annotation and a minimal level of redundancy",
      "example_id" : "Swiss-Prot:P51587",
      "datatype" : null,
      "id" : null,
      "is_obsolete" : "true",
      "uri_prefix" : null,
      "abbreviation" : "UniProtKB/Swiss-Prot",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]"
   },
   "unigene" : {
      "fullname" : null,
      "example_id" : "UniGene:Hs.212293",
      "description" : "NCBI transcript cluster database, organized by transcriptome. Each UniGene entry is a set of transcript sequences that appear to come from the same transcription locus (gene or expressed pseudogene).",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/UniGene",
      "url_example" : "http://www.ncbi.nlm.nih.gov/UniGene/clust.cgi?ORG=Hs&CID=212293",
      "object" : "Identifier (for transcript cluster)",
      "database" : "UniGene",
      "name" : null,
      "abbreviation" : "UniGene",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/UniGene/clust.cgi?ORG=[organism_abbreviation]&CID=[cluster_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "flybase" : {
      "abbreviation" : "FLYBASE",
      "url_syntax" : "http://flybase.org/reports/[example_id].html",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^FBgn[0-9]{7}$",
      "example_id" : "FB:FBgn0000024",
      "fullname" : null,
      "generic_url" : "http://flybase.org/",
      "name" : null,
      "object" : "Identifier",
      "database" : "FlyBase",
      "url_example" : "http://flybase.org/reports/FBgn0000024.html"
   },
   "ecoliwiki" : {
      "abbreviation" : "EcoliWiki",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "local_id_syntax" : "^[A-Za-z]{3,4}$",
      "description" : "EcoliHub's subsystem for community annotation of E. coli K-12",
      "example_id" : null,
      "fullname" : null,
      "generic_url" : "http://ecoliwiki.net/",
      "name" : null,
      "url_example" : null,
      "database" : "EcoliWiki from EcoliHub",
      "object" : null
   },
   "imgt_ligm" : {
      "abbreviation" : "IMGT_LIGM",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "description" : "Database of immunoglobulins and T cell receptors from human and other vertebrates, with translation for fully annotated sequences.",
      "example_id" : "IMGT_LIGM:U03895",
      "generic_url" : "http://imgt.cines.fr",
      "url_example" : null,
      "database" : "ImMunoGeneTics database covering immunoglobulins and T-cell receptors",
      "object" : null,
      "name" : null
   },
   "refgenome" : {
      "name" : null,
      "database" : "GO Reference Genomes",
      "url_example" : null,
      "object" : null,
      "generic_url" : "http://www.geneontology.org/GO.refgenome.shtml",
      "example_id" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "abbreviation" : "RefGenome"
   },
   "rebase" : {
      "example_id" : "REBASE:EcoRI",
      "fullname" : null,
      "name" : null,
      "url_example" : "http://rebase.neb.com/rebase/enz/EcoRI.html",
      "object" : "Restriction enzyme name",
      "database" : "REBASE restriction enzyme database",
      "generic_url" : "http://rebase.neb.com/rebase/rebase.html",
      "url_syntax" : "http://rebase.neb.com/rebase/enz/[example_id].html",
      "abbreviation" : "REBASE",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null
   },
   "coriell" : {
      "fullname" : null,
      "description" : "The Coriell Cell Repositories provide essential research reagents to the scientific community by establishing, verifying, maintaining, and distributing cell cultures and DNA derived from cell cultures. These collections, supported by funds from the National Institutes of Health (NIH) and several foundations, are extensively utilized by research scientists around the world. ",
      "example_id" : "GM07892",
      "url_example" : "http://ccr.coriell.org/Sections/Search/Sample_Detail.aspx?Ref=GM07892",
      "database" : "Coriell Institute for Medical Research",
      "object" : "Identifier",
      "name" : null,
      "generic_url" : "http://ccr.coriell.org/",
      "url_syntax" : "http://ccr.coriell.org/Sections/Search/Sample_Detail.aspx?Ref=[example_id]",
      "abbreviation" : "CORIELL",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "sgn" : {
      "entity_type" : "SO:0000704 ! gene",
      "example_id" : "SGN:4476",
      "fullname" : null,
      "generic_url" : "http://www.sgn.cornell.edu/",
      "name" : null,
      "database" : "Sol Genomics Network",
      "url_example" : "http://www.sgn.cornell.edu/phenome/locus_display.pl?locus_id=4476",
      "object" : "Gene identifier",
      "abbreviation" : "SGN",
      "url_syntax" : "http://www.sgn.cornell.edu/phenome/locus_display.pl?locus_id=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "issn" : {
      "url_syntax" : null,
      "abbreviation" : "ISSN",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "example_id" : "ISSN:1234-1231",
      "fullname" : null,
      "name" : null,
      "database" : "International Standard Serial Number",
      "url_example" : null,
      "object" : "Identifier",
      "generic_url" : "http://www.issn.org/"
   },
   "metacyc" : {
      "generic_url" : "http://metacyc.org/",
      "name" : null,
      "url_example" : "http://biocyc.org/META/NEW-IMAGE?type=NIL&object=GLUTDEG-PWY",
      "object" : "Identifier (pathway or reaction)",
      "database" : "Metabolic Encyclopedia of metabolic and other pathways",
      "example_id" : "MetaCyc:GLUTDEG-PWY",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "MetaCyc",
      "url_syntax" : "http://biocyc.org/META/NEW-IMAGE?type=NIL&object=[example_id]"
   },
   "pmcid" : {
      "abbreviation" : "PMCID",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?db=pmc&cmd=search&term=[example_id]",
      "!url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?cmd=Search&db=PMC&term=PMC201377",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "PMCID:PMC201377",
      "fullname" : null,
      "!url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?cmd=Search&db=PMC&term=[example_id]",
      "generic_url" : "http://www.pubmedcentral.nih.gov/",
      "name" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?db=pmc&cmd=search&term=PMC201377",
      "object" : "Identifier",
      "database" : "Pubmed Central"
   },
   "poc" : {
      "object" : null,
      "url_example" : null,
      "database" : "Plant Ontology Consortium",
      "name" : null,
      "generic_url" : "http://www.plantontology.org/",
      "fullname" : null,
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "abbreviation" : "POC"
   },
   "spd" : {
      "url_syntax" : "http://www.riken.jp/SPD/[example_id].html",
      "abbreviation" : "SPD",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "example_id" : "SPD:05/05F01",
      "local_id_syntax" : "^[0-9]{2}/[0-9]{2}[A-Z][0-9]{2}$",
      "object" : "Identifier",
      "url_example" : "http://www.riken.jp/SPD/05/05F01.html",
      "database" : "Schizosaccharomyces pombe Postgenome Database at RIKEN; includes Orfeome Localisation data",
      "name" : null,
      "generic_url" : "http://www.riken.jp/SPD/"
   },
   "kegg" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "KEGG",
      "name" : null,
      "database" : "Kyoto Encyclopedia of Genes and Genomes",
      "url_example" : null,
      "object" : "identifier",
      "generic_url" : "http://www.genome.ad.jp/kegg/",
      "example_id" : null,
      "fullname" : null
   },
   "wb" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "WB",
      "url_syntax" : "http://www.wormbase.org/db/gene/gene?name=[example_id]",
      "generic_url" : "http://www.wormbase.org/",
      "name" : null,
      "url_example" : "http://www.wormbase.org/db/get?class=Gene;name=WBGene00003001",
      "database" : "WormBase database of nematode biology",
      "object" : "Gene identifier",
      "entity_type" : "PR:000000001 ! protein",
      "local_id_syntax" : "^WB(Gene|Var|RNAi|Transgene)[0-9]{8}$",
      "example_id" : "WB:WBGene00003001",
      "fullname" : null
   },
   "swiss-prot" : {
      "example_id" : "Swiss-Prot:P51587",
      "description" : "A curated protein sequence database which provides a high level of annotation and a minimal level of redundancy",
      "fullname" : null,
      "replaced_by" : "UniProtKB",
      "generic_url" : "http://www.uniprot.org",
      "name" : null,
      "object" : "Accession",
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "database" : "UniProtKB/Swiss-Prot",
      "abbreviation" : "Swiss-Prot",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "id" : null,
      "datatype" : null,
      "is_obsolete" : "true",
      "uri_prefix" : null
   },
   "refseq_prot" : {
      "replaced_by" : "RefSeq",
      "fullname" : null,
      "example_id" : "RefSeq_Prot:YP_498627",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/RefSeq/",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=YP_498627",
      "object" : "Identifier",
      "database" : "RefSeq (Protein)",
      "name" : null,
      "abbreviation" : "RefSeq_Prot",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "is_obsolete" : "true"
   },
   "locsvmpsi" : {
      "url_syntax" : null,
      "abbreviation" : "LOCSVMpsi",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "example_id" : null,
      "description" : "Subcellular localization for eukayotic proteins based on SVM and PSI-BLAST",
      "url_example" : null,
      "object" : null,
      "database" : "LOCSVMPSI",
      "name" : null,
      "generic_url" : "http://bioinformatics.ustc.edu.cn/locsvmpsi/locsvmpsi.php"
   },
   "omim" : {
      "abbreviation" : "OMIM",
      "url_syntax" : "http://omim.org/entry/[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "OMIM:190198",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=OMIM",
      "url_example" : "http://omim.org/entry/190198",
      "database" : "Mendelian Inheritance in Man",
      "object" : "Identifier",
      "name" : null
   },
   "broad" : {
      "example_id" : null,
      "fullname" : null,
      "name" : null,
      "database" : "Broad Institute",
      "url_example" : null,
      "object" : null,
      "generic_url" : "http://www.broad.mit.edu/",
      "url_syntax" : null,
      "abbreviation" : "Broad",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "ecogene" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.ecogene.org/geneInfo.php?eg_id=[example_id]",
      "abbreviation" : "ECOGENE",
      "name" : null,
      "url_example" : "http://www.ecogene.org/geneInfo.php?eg_id=EG10818",
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "object" : "EcoGene accession",
      "generic_url" : "http://www.ecogene.org/",
      "example_id" : "ECOGENE:EG10818",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^EG[0-9]{5}$"
   },
   "mod" : {
      "generic_url" : "http://psidev.sourceforge.net/mod/",
      "name" : null,
      "object" : "Protein modification identifier",
      "database" : "Proteomics Standards Initiative protein modification ontology",
      "url_example" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:00219",
      "example_id" : "MOD:00219",
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "MOD",
      "url_syntax" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:[example_id]"
   },
   "wormpep" : {
      "generic_url" : "http://www.wormbase.org/",
      "name" : null,
      "database" : "Wormpep database of proteins of C. elegans",
      "object" : "Identifier",
      "url_example" : "http://www.wormbase.org/db/get?class=Protein;name=WP:CE15104",
      "example_id" : "WP:CE25104",
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "is_obsolete" : "true",
      "uri_prefix" : null,
      "abbreviation" : "Wormpep",
      "url_syntax" : "http://www.wormbase.org/db/get?class=Protein;name=WP:[example_id]"
   },
   "cgsc" : {
      "example_id" : "CGSC:rbsK",
      "fullname" : null,
      "generic_url" : "http://cgsc.biology.yale.edu/",
      "name" : null,
      "url_example" : "http://cgsc.biology.yale.edu/Site.php?ID=315",
      "database" : null,
      "object" : "Gene symbol",
      "abbreviation" : "CGSC",
      "database: CGSC" : "E.coli Genetic Stock Center",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "biomd" : {
      "example_id" : "BIOMD:BIOMD0000000045",
      "fullname" : null,
      "name" : null,
      "url_example" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=BIOMD0000000045",
      "database" : "BioModels Database",
      "object" : "Accession",
      "generic_url" : "http://www.ebi.ac.uk/biomodels/",
      "url_syntax" : "http://www.ebi.ac.uk/compneur-srv/biomodels-main/publ-model.do?mid=[example_id]",
      "abbreviation" : "BIOMD",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "seed" : {
      "name" : null,
      "url_example" : "http://www.theseed.org/linkin.cgi?id=fig|83331.1.peg.1",
      "object" : "identifier",
      "database" : "The SEED;",
      "generic_url" : "http://www.theseed.org",
      "description" : "Project to annotate the first 1000 sequenced genomes, develop detailed metabolic reconstructions, and construct the corresponding stoichiometric matrices",
      "example_id" : "SEED:fig|83331.1.peg.1",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.theseed.org/linkin.cgi?id=[example_id]",
      "abbreviation" : "SEED"
   },
   "isbn" : {
      "abbreviation" : "ISBN",
      "url_syntax" : "https://en.wikipedia.org/w/index.php?title=Special%3ABookSources&isbn=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "ISBN:0781702534",
      "generic_url" : "http://isbntools.com/",
      "database" : "International Standard Book Number",
      "url_example" : "https://en.wikipedia.org/w/index.php?title=Special%3ABookSources&isbn=0123456789",
      "object" : "Identifier",
      "name" : null
   },
   "dictybase_gene_name" : {
      "fullname" : null,
      "example_id" : "dictyBase_gene_name:mlcE",
      "generic_url" : "http://dictybase.org",
      "object" : "Gene name",
      "url_example" : "http://dictybase.org/gene/mlcE",
      "database" : "dictyBase",
      "name" : null,
      "abbreviation" : "dictyBase_gene_name",
      "url_syntax" : "http://dictybase.org/gene/[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "transfac" : {
      "url_example" : null,
      "database" : "TRANSFAC database of eukaryotic transcription factors",
      "object" : null,
      "name" : null,
      "generic_url" : "http://www.gene-regulation.com/pub/databases.html#transfac",
      "fullname" : null,
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "abbreviation" : "TRANSFAC"
   },
   "ncbi_gene" : {
      "local_id_syntax" : "^\\d+$",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "example_id" : "NCBI_Gene:4771",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "object" : "Identifier",
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "database" : "NCBI Gene",
      "name" : null,
      "abbreviation" : "NCBI_Gene",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "ntnu_sb" : {
      "abbreviation" : "NTNU_SB",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "fullname" : null,
      "generic_url" : "http://www.ntnu.edu/nt/systemsbiology",
      "name" : null,
      "object" : null,
      "url_example" : null,
      "database" : "Norwegian University of Science and Technology, Systems Biology team"
   },
   "sgd_ref" : {
      "generic_url" : "http://www.yeastgenome.org/",
      "name" : null,
      "database" : "Saccharomyces Genome Database",
      "url_example" : "http://db.yeastgenome.org/cgi-bin/reference/reference.pl?dbid=S000049602",
      "object" : "Literature Reference Identifier",
      "example_id" : "SGD_REF:S000049602",
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "SGD_REF",
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]"
   },
   "po" : {
      "abbreviation" : "PO",
      "url_syntax" : "http://www.plantontology.org/amigo/go.cgi?action=query&view=query&search_constraint=terms&query=PO:[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "local_id_syntax" : "^[0-9]{7}$",
      "entity_type" : "PO:0009012 ! plant structure development stage ",
      "fullname" : null,
      "example_id" : "PO:0009004",
      "generic_url" : "http://www.plantontology.org/",
      "url_example" : "http://www.plantontology.org/amigo/go.cgi?action=query&view=query&search_constraint=terms&query=PO:0009004",
      "database" : "Plant Ontology Consortium Database",
      "object" : "Identifier",
      "name" : null
   },
   "tgd_locus" : {
      "fullname" : null,
      "example_id" : "TGD_LOCUS:PDD1",
      "generic_url" : "http://www.ciliate.org/",
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "url_example" : "http://db.ciliate.org/cgi-bin/locus.pl?locus=PDD1",
      "database" : "Tetrahymena Genome Database",
      "name" : null,
      "abbreviation" : "TGD_LOCUS",
      "url_syntax" : "http://db.ciliate.org/cgi-bin/locus.pl?locus=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "genedb_tbrucei" : {
      "id" : null,
      "uri_prefix" : null,
      "shorthand_name" : "Tbrucei",
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=tryp&name=[example_id]",
      "generic_url" : "http://www.genedb.org/genedb/tryp/",
      "url_example" : "http://www.genedb.org/genedb/Search?organism=tryp&name=Tb927.1.5250",
      "database" : "Trypanosoma brucei GeneDB",
      "local_id_syntax" : "^Tb\\d+\\.\\d+\\.\\d+$",
      "fullname" : null,
      "replaced_by" : "GeneDB",
      "example_id" : "GeneDB_Tbrucei:Tb927.1.5250",
      "datatype" : null,
      "is_obsolete" : "true",
      "abbreviation" : "GeneDB_Tbrucei",
      "object" : "Gene identifier",
      "name" : null
   },
   "hgnc" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.genenames.org/data/hgnc_data.php?hgnc_id=HGNC:[example_id]",
      "abbreviation" : "HGNC",
      "name" : null,
      "url_example" : "http://www.genenames.org/data/hgnc_data.php?hgnc_id=HGNC:29",
      "object" : "Identifier",
      "database" : "HUGO Gene Nomenclature Committee",
      "generic_url" : "http://www.genenames.org/",
      "example_id" : "HGNC:29",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene"
   },
   "mesh" : {
      "generic_url" : "http://www.nlm.nih.gov/mesh/2005/MBrowser.html",
      "name" : null,
      "database" : "Medical Subject Headings",
      "url_example" : "http://www.nlm.nih.gov/cgi/mesh/2005/MB_cgi?mode=&term=mitosis",
      "object" : "MeSH heading",
      "example_id" : "MeSH:mitosis",
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "MeSH",
      "url_syntax" : "http://www.nlm.nih.gov/cgi/mesh/2005/MB_cgi?mode=&term=[example_id]"
   },
   "ena" : {
      "name" : null,
      "url_example" : "http://www.ebi.ac.uk/ena/data/view/AA816246",
      "object" : "Sequence accession",
      "database" : "European Nucleotide Archive",
      "generic_url" : "http://www.ebi.ac.uk/ena/",
      "description" : "ENA is made up of a number of distinct databases that includes EMBL-Bank, the newly established Sequence Read Archive (SRA) and the Trace Archive. International nucleotide sequence database collaboration, comprising ENA-EBI nucleotide sequence data library (EMBL-Bank), DNA DataBank of Japan (DDBJ), and NCBI GenBank",
      "example_id" : "ENA:AA816246",
      "fullname" : null,
      "local_id_syntax" : "^([A-Z]{1}[0-9]{5})|([A-Z]{2}[0-9]{6})|([A-Z]{4}[0-9]{8,9})$",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.ebi.ac.uk/ena/data/view/[example_id]",
      "abbreviation" : "ENA"
   },
   "pamgo" : {
      "url_example" : null,
      "database" : "Plant-Associated Microbe Gene Ontology Interest Group",
      "object" : null,
      "name" : null,
      "generic_url" : "http://pamgo.vbi.vt.edu/",
      "fullname" : null,
      "example_id" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "abbreviation" : "PAMGO"
   },
   "ma" : {
      "name" : null,
      "url_example" : "http://www.informatics.jax.org/searches/AMA.cgi?id=MA:0000003",
      "database" : "Adult Mouse Anatomical Dictionary",
      "object" : "Identifier",
      "generic_url" : "http://www.informatics.jax.org/",
      "example_id" : "MA:0000003",
      "description" : "Adult Mouse Anatomical Dictionary; part of Gene Expression Database",
      "fullname" : null,
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.informatics.jax.org/searches/AMA.cgi?id=MA:[example_id]",
      "abbreviation" : "MA"
   },
   "ensemblplants" : {
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "example_id" : "EnsemblPlants:LOC_Os01g22954",
      "generic_url" : "http://plants.ensembl.org/",
      "object" : "Identifier",
      "url_example" : "http://www.ensemblgenomes.org/id/LOC_Os01g22954",
      "database" : "Ensembl Plants, the Ensembl Genomes database for accessing plant genome data",
      "name" : null,
      "abbreviation" : "EnsemblPlants",
      "url_syntax" : "http://www.ensemblgenomes.org/id/[example_ID]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "hgnc_gene" : {
      "url_syntax" : "http://www.genenames.org/data/hgnc_data.php?app_sym=[example_id]",
      "abbreviation" : "HGNC_gene",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "example_id" : "HGNC_gene:ABCA1",
      "fullname" : null,
      "name" : null,
      "url_example" : "http://www.genenames.org/data/hgnc_data.php?app_sym=ABCA1",
      "database" : "HUGO Gene Nomenclature Committee",
      "object" : "Gene symbol",
      "generic_url" : "http://www.genenames.org/"
   },
   "genbank" : {
      "description" : "The NIH genetic sequence database, an annotated collection of all publicly available DNA sequences.",
      "example_id" : "GB:AA816246",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein ",
      "local_id_syntax" : "^[A-Z]{2}[0-9]{6}$",
      "name" : null,
      "database" : "GenBank",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=AA816246",
      "object" : "Sequence accession",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Genbank/",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=nucleotide&val=[example_id]",
      "abbreviation" : "GenBank",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "kegg_ligand" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "KEGG_LIGAND",
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?cpd:[example_id]",
      "generic_url" : "http://www.genome.ad.jp/kegg/docs/upd_ligand.html",
      "database" : "KEGG LIGAND Database",
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?cpd:C00577",
      "object" : "Compound",
      "name" : null,
      "local_id_syntax" : "^C\\d{5}$",
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "fullname" : null,
      "example_id" : "KEGG_LIGAND:C00577"
   },
   "modbase" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://salilab.org/modbase/searchbyid?databaseID=[example_id]",
      "abbreviation" : "ModBase",
      "url_example" : "http://salilab.org/modbase/searchbyid?databaseID=P04848",
      "object" : "Accession",
      "database" : "ModBase comprehensive Database of Comparative Protein Structure Models",
      "name" : null,
      "generic_url" : "http://modbase.compbio.ucsf.edu/ ",
      "fullname" : null,
      "example_id" : "ModBase:P10815"
   },
   "nc-iubmb" : {
      "generic_url" : "http://www.chem.qmw.ac.uk/iubmb/",
      "name" : null,
      "url_example" : null,
      "database" : "Nomenclature Committee of the International Union of Biochemistry and Molecular Biology",
      "object" : null,
      "example_id" : null,
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "NC-IUBMB",
      "url_syntax" : null
   },
   "wp" : {
      "name" : null,
      "object" : "Identifier",
      "url_example" : "http://www.wormbase.org/db/get?class=Protein;name=WP:CE15104",
      "database" : "Wormpep database of proteins of C. elegans",
      "generic_url" : "http://www.wormbase.org/",
      "example_id" : "WP:CE25104",
      "fullname" : null,
      "uri_prefix" : null,
      "is_obsolete" : "true",
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.wormbase.org/db/get?class=Protein;name=WP:[example_id]",
      "abbreviation" : "WP"
   },
   "go_central" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "GO_Central",
      "name" : null,
      "object" : null,
      "url_example" : null,
      "database" : "GO Central",
      "generic_url" : "http://www.geneontology.org/GO.refgenome.shtml",
      "description" : "Manual annotation from PAINT curators into the UniProt Protein2GO curation tool.",
      "example_id" : null,
      "fullname" : null
   },
   "um-bbd" : {
      "abbreviation" : "UM-BBD",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : null,
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "url_example" : null,
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "object" : "Prefix",
      "name" : null
   },
   "smd" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "SMD",
      "url_syntax" : null,
      "generic_url" : "http://genome-www.stanford.edu/microarray",
      "object" : null,
      "url_example" : null,
      "database" : "Stanford Microarray Database",
      "name" : null,
      "fullname" : null,
      "example_id" : null
   },
   "kegg_reaction" : {
      "abbreviation" : "KEGG_REACTION",
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?rn:[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "local_id_syntax" : "^R\\d+$",
      "example_id" : "KEGG:R02328",
      "fullname" : null,
      "generic_url" : "http://www.genome.jp/kegg/reaction/",
      "name" : null,
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?rn:R02328",
      "database" : "KEGG Reaction Database",
      "object" : "Reaction"
   },
   "vida" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "abbreviation" : "VIDA",
      "name" : null,
      "url_example" : null,
      "database" : "Virus Database at University College London",
      "object" : null,
      "generic_url" : "http://www.biochem.ucl.ac.uk/bsm/virus_database/VIDA.html",
      "example_id" : null,
      "fullname" : null
   },
   "pr" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:[example_id]",
      "abbreviation" : "PR",
      "url_example" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:000025380",
      "database" : "Protein Ontology",
      "object" : "Identifer",
      "name" : null,
      "generic_url" : "http://www.proconsortium.org/pro/pro.shtml",
      "fullname" : null,
      "example_id" : "PR:000025380",
      "local_id_syntax" : "^[0-9]{9}$",
      "entity_type" : "PR:000000001 ! protein "
   },
   "ppi" : {
      "example_id" : null,
      "fullname" : null,
      "name" : null,
      "database" : "Pseudomonas syringae community annotation project",
      "url_example" : null,
      "object" : null,
      "generic_url" : "http://genome.pseudomonas-syringae.org/",
      "url_syntax" : null,
      "abbreviation" : "PPI",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null
   },
   "tigr" : {
      "generic_url" : "http://www.jcvi.org/",
      "name" : null,
      "url_example" : null,
      "database" : "J. Craig Venter Institute",
      "object" : null,
      "example_id" : null,
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "TIGR",
      "url_syntax" : null
   },
   "prints" : {
      "generic_url" : "http://www.bioinf.manchester.ac.uk/dbbrowser/PRINTS/",
      "url_example" : "http://www.bioinf.manchester.ac.uk/cgi-bin/dbbrowser/sprint/searchprintss.cgi?display_opts=Prints&category=None&queryform=false&regexpr=off&prints_accn=PR00025",
      "database" : "PRINTS compendium of protein fingerprints",
      "object" : "Accession",
      "name" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "example_id" : "PRINTS:PR00025",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "PRINTS",
      "url_syntax" : "http://www.bioinf.manchester.ac.uk/cgi-bin/dbbrowser/sprint/searchprintss.cgi?display_opts=Prints&category=None&queryform=false&regexpr=off&prints_accn=[example_id]"
   },
   "pubchem_bioassay" : {
      "abbreviation" : "PubChem_BioAssay",
      "url_syntax" : "http://pubchem.ncbi.nlm.nih.gov/assay/assay.cgi?aid=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "PubChem_BioAssay:177",
      "fullname" : null,
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/",
      "name" : null,
      "url_example" : "http://pubchem.ncbi.nlm.nih.gov/assay/assay.cgi?aid=177",
      "database" : "NCBI PubChem database of bioassay records",
      "object" : "Identifier"
   },
   "syscilia_ccnet" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "SYSCILIA_CCNET",
      "url_syntax" : null,
      "generic_url" : "http://syscilia.org/",
      "name" : null,
      "url_example" : null,
      "database" : "Syscilia",
      "object" : null,
      "description" : "A systems biology approach to dissect cilia function and its disruption in human genetic disease",
      "example_id" : null,
      "fullname" : null
   },
   "embl" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "EMBL",
      "url_syntax" : "http://www.ebi.ac.uk/cgi-bin/emblfetch?style=html&Submit=Go&id=[example_id]",
      "generic_url" : "http://www.ebi.ac.uk/embl/",
      "name" : null,
      "url_example" : "http://www.ebi.ac.uk/cgi-bin/emblfetch?style=html&Submit=Go&id=AA816246",
      "database" : "EMBL Nucleotide Sequence Database",
      "object" : "Sequence accession",
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^([A-Z]{1}[0-9]{5})|([A-Z]{2}[0-9]{6})|([A-Z]{4}[0-9]{8,9})$",
      "example_id" : "EMBL:AA816246",
      "description" : "International nucleotide sequence database collaboration, comprising EMBL-EBI nucleotide sequence data library (EMBL-Bank), DNA DataBank of Japan (DDBJ), and NCBI GenBank",
      "fullname" : null
   },
   "pmid" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/PubMed/",
      "name" : null,
      "database" : "PubMed",
      "url_example" : "http://www.ncbi.nlm.nih.gov/pubmed/4208797",
      "object" : "Identifier",
      "local_id_syntax" : "^[0-9]+$",
      "example_id" : "PMID:4208797",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "PMID",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/pubmed/[example_id]"
   },
   "apidb_plasmodb" : {
      "url_syntax" : "http://www.plasmodb.org/gene/[example_id]",
      "abbreviation" : "ApiDB_PlasmoDB",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "example_id" : "ApiDB_PlasmoDB:PF11_0344",
      "fullname" : null,
      "name" : null,
      "url_example" : "http://www.plasmodb.org/gene/PF11_0344",
      "object" : "PlasmoDB Gene ID",
      "database" : "PlasmoDB Plasmodium Genome Resource",
      "generic_url" : "http://plasmodb.org/"
   },
   "cas" : {
      "abbreviation" : "CAS",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "CAS:58-08-2",
      "description" : "CAS REGISTRY is the most authoritative collection of disclosed chemical substance information, containing more than 54 million organic and inorganic substances and 62 million sequences. CAS REGISTRY covers substances identified from the scientific literature from 1957 to the present, with additional substances going back to the early 1900s.",
      "fullname" : null,
      "generic_url" : "http://www.cas.org/expertise/cascontent/registry/index.html",
      "name" : null,
      "url_example" : null,
      "database" : "CAS Chemical Registry",
      "object" : "Identifier"
   },
   "genedb_lmajor" : {
      "is_obsolete" : "true",
      "datatype" : null,
      "abbreviation" : "GeneDB_Lmajor",
      "object" : "Gene identifier",
      "name" : null,
      "uri_prefix" : null,
      "id" : null,
      "shorthand_name" : "Lmajor",
      "url_syntax" : "http://www.genedb.org/genedb/Search?organism=leish&name=[example_id]",
      "url_example" : "http://www.genedb.org/genedb/Search?organism=leish&name=LM5.32",
      "database" : "Leishmania major GeneDB",
      "generic_url" : "http://www.genedb.org/genedb/leish/",
      "fullname" : null,
      "replaced_by" : "GeneDB",
      "example_id" : "GeneDB_Lmajor:LM5.32",
      "local_id_syntax" : "^LmjF\\.\\d+\\.\\d+$"
   },
   "unipathway" : {
      "entity_type" : "GO:0008150 ! biological process",
      "example_id" : "UniPathway:UPA00155",
      "description" : "UniPathway is a a metabolic door to UniProtKB/Swiss-Prot, a curated resource of metabolic pathways for the UniProtKB/Swiss-Prot knowledgebase.",
      "fullname" : null,
      "generic_url" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway",
      "name" : null,
      "url_example" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway/upa?upid=UPA00155",
      "database" : "UniPathway",
      "object" : "Identifier",
      "abbreviation" : "UniPathway",
      "url_syntax" : "http://www.grenoble.prabi.fr/obiwarehouse/unipathway/upa?upid=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "parkinsonsuk-ucl" : {
      "fullname" : null,
      "example_id" : null,
      "generic_url" : "http://www.ucl.ac.uk/cardiovasculargeneontology",
      "database" : "Parkinsons Disease Gene Ontology Initiative",
      "url_example" : null,
      "object" : null,
      "name" : null,
      "abbreviation" : "ParkinsonsUK-UCL",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "prodom" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://prodom.prabi.fr/prodom/current/cgi-bin/request.pl?question=DBEN&query=[example_id]",
      "abbreviation" : "ProDom",
      "name" : null,
      "database" : "ProDom protein domain families",
      "url_example" : "http://prodom.prabi.fr/prodom/current/cgi-bin/request.pl?question=DBEN&query=PD000001",
      "object" : "Accession",
      "generic_url" : "http://prodom.prabi.fr/prodom/current/html/home.php",
      "description" : "ProDom protein domain families automatically generated from UniProtKB",
      "example_id" : "ProDom:PD000001",
      "fullname" : null
   },
   "phenoscape" : {
      "generic_url" : "http://phenoscape.org/",
      "name" : null,
      "database" : "PhenoScape Knowledgebase",
      "url_example" : null,
      "object" : null,
      "example_id" : null,
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "PhenoScape",
      "url_syntax" : null
   },
   "psort" : {
      "example_id" : null,
      "fullname" : null,
      "generic_url" : "http://www.psort.org/",
      "name" : null,
      "object" : null,
      "url_example" : null,
      "database" : "PSORT protein subcellular localization databases and prediction tools for bacteria",
      "abbreviation" : "PSORT",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "unimod" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "UniMod",
      "url_syntax" : "http://www.unimod.org/modifications_view.php?editid1=[example_id]",
      "generic_url" : "http://www.unimod.org/",
      "url_example" : "http://www.unimod.org/modifications_view.php?editid1=1287",
      "object" : "Identifier",
      "database" : "UniMod",
      "name" : null,
      "fullname" : null,
      "description" : "protein modifications for mass spectrometry",
      "example_id" : "UniMod:1287"
   },
   "panther" : {
      "abbreviation" : "PANTHER",
      "url_syntax" : "http://www.pantherdb.org/panther/lookupId.jsp?id=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "PANTHER:PTHR11455",
      "fullname" : null,
      "generic_url" : "http://www.pantherdb.org/",
      "name" : null,
      "url_example" : "http://www.pantherdb.org/panther/lookupId.jsp?id=PTHR10000",
      "object" : "Protein family tree identifier",
      "database" : "Protein ANalysis THrough Evolutionary Relationships Classification System"
   },
   "obi" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "OBI",
      "url_syntax" : null,
      "generic_url" : "http://obi-ontology.org/page/Main_Page",
      "object" : "Identifier",
      "url_example" : null,
      "database" : "Ontology for Biomedical Investigations",
      "name" : null,
      "local_id_syntax" : "^\\d{7}$",
      "fullname" : null,
      "example_id" : "OBI:0000038"
   },
   "pombase" : {
      "abbreviation" : "PomBase",
      "url_syntax" : "http://www.pombase.org/spombe/result/[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "entity_type" : "SO:0000704 ! gene ",
      "local_id_syntax" : "^S\\w+(\\.)?\\w+(\\.)?$",
      "example_id" : "PomBase:SPBC11B10.09",
      "fullname" : null,
      "generic_url" : "http://www.pombase.org/",
      "name" : null,
      "url_example" : "http://www.pombase.org/spombe/result/SPBC11B10.09",
      "object" : "Identifier",
      "database" : "PomBase"
   },
   "cog" : {
      "example_id" : null,
      "fullname" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "name" : null,
      "url_example" : null,
      "database" : "NCBI Clusters of Orthologous Groups",
      "object" : null,
      "abbreviation" : "COG",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "jcvi" : {
      "abbreviation" : "JCVI",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : null,
      "generic_url" : "http://www.jcvi.org/",
      "url_example" : null,
      "object" : null,
      "database" : "J. Craig Venter Institute",
      "name" : null
   },
   "agricola_id" : {
      "abbreviation" : "AGRICOLA_ID",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "AGRICOLA_NAL:TP248.2 P76 v.14",
      "fullname" : null,
      "generic_url" : "http://agricola.nal.usda.gov/",
      "name" : null,
      "url_example" : null,
      "object" : "AGRICOLA call number",
      "database" : "AGRICultural OnLine Access"
   },
   "trembl" : {
      "replaced_by" : "UniProtKB",
      "fullname" : null,
      "example_id" : "TrEMBL:O31124",
      "description" : "UniProtKB-TrEMBL, a computer-annotated protein sequence database supplementing UniProtKB and containing the translations of all coding sequences (CDS) present in the EMBL Nucleotide Sequence Database but not yet integrated in UniProtKB/Swiss-Prot",
      "generic_url" : "http://www.uniprot.org",
      "url_example" : "http://www.uniprot.org/uniprot/O31124",
      "database" : "UniProtKB-TrEMBL protein sequence database",
      "object" : "Accession",
      "name" : null,
      "abbreviation" : "TrEMBL",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "id" : null,
      "datatype" : null,
      "is_obsolete" : "true",
      "uri_prefix" : null
   },
   "wb_ref" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "WB_REF",
      "url_syntax" : "http://www.wormbase.org/db/misc/paper?name=[example_id]",
      "generic_url" : "http://www.wormbase.org/",
      "database" : "WormBase database of nematode biology",
      "url_example" : "http://www.wormbase.org/db/misc/paper?name=WBPaper00004823",
      "object" : "Literature Reference Identifier",
      "name" : null,
      "fullname" : null,
      "example_id" : "WB_REF:WBPaper00004823"
   },
   "vmd" : {
      "abbreviation" : "VMD",
      "url_syntax" : "http://vmd.vbi.vt.edu/cgi-bin/browse/browserDetail_new.cgi?gene_id=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "VMD:109198",
      "fullname" : null,
      "generic_url" : "http://phytophthora.vbi.vt.edu",
      "name" : null,
      "database" : "Virginia Bioinformatics Institute Microbial Database",
      "url_example" : "http://vmd.vbi.vt.edu/cgi-bin/browse/browserDetail_new.cgi?gene_id=109198",
      "object" : "Gene identifier"
   },
   "ipi" : {
      "url_syntax" : null,
      "abbreviation" : "IPI",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "example_id" : "IPI:IPI00000005.1",
      "object" : "Identifier",
      "url_example" : null,
      "database" : "International Protein Index",
      "name" : null,
      "generic_url" : "http://www.ebi.ac.uk/IPI/IPIhelp.html"
   },
   "aspgd" : {
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=ASPL0000067538",
      "database" : "Aspergillus Genome Database",
      "object" : "Identifier for AspGD Loci",
      "name" : null,
      "generic_url" : "http://www.aspergillusgenome.org/",
      "fullname" : null,
      "example_id" : "AspGD:ASPL0000067538",
      "local_id_syntax" : "^ASPL[0-9]{10}$",
      "entity_type" : "SO:0000704 ! gene",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "abbreviation" : "AspGD"
   },
   "agricola_ind" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "AGRICOLA_IND",
      "name" : null,
      "url_example" : null,
      "object" : "AGRICOLA IND number",
      "database" : "AGRICultural OnLine Access",
      "generic_url" : "http://agricola.nal.usda.gov/",
      "example_id" : "AGRICOLA_IND:IND23252955",
      "fullname" : null
   },
   "kegg_pathway" : {
      "generic_url" : "http://www.genome.jp/kegg/pathway.html",
      "database" : "KEGG Pathways Database",
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?path:ot00020",
      "object" : "Pathway",
      "name" : null,
      "fullname" : null,
      "example_id" : "KEGG_PATHWAY:ot00020",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "KEGG_PATHWAY",
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?path:[example_id]"
   },
   "medline" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "MEDLINE",
      "url_syntax" : null,
      "generic_url" : "http://www.nlm.nih.gov/databases/databases_medline.html",
      "url_example" : null,
      "database" : "Medline literature database",
      "object" : "Identifier",
      "name" : null,
      "fullname" : null,
      "example_id" : "MEDLINE:20572430"
   },
   "ro" : {
      "database" : "OBO Relation Ontology Ontology",
      "url_example" : "http://purl.obolibrary.org/obo/RO_0002211",
      "object" : null,
      "name" : null,
      "generic_url" : "http://purl.obolibrary.org/obo/ro",
      "fullname" : null,
      "example_id" : "RO:0002211",
      "description" : "A collection of relations used across OBO ontologies",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://purl.obolibrary.org/obo/RO_[example_id]",
      "abbreviation" : "RO"
   },
   "fbbt" : {
      "abbreviation" : "FBbt",
      "url_syntax" : "http://flybase.org/cgi-bin/fbcvq.html?query=FBbt:[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "FBbt:00005177",
      "generic_url" : "http://flybase.org/",
      "database" : "Drosophila gross anatomy",
      "url_example" : "http://flybase.org/cgi-bin/fbcvq.html?query=FBbt:00005177",
      "object" : "Identifier",
      "name" : null
   },
   "pompep" : {
      "url_syntax" : null,
      "abbreviation" : "Pompep",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "fullname" : null,
      "example_id" : "Pompep:SPAC890.04C",
      "database" : "Schizosaccharomyces pombe protein data",
      "url_example" : null,
      "object" : "Gene/protein identifier",
      "name" : null,
      "generic_url" : "ftp://ftp.sanger.ac.uk/pub/yeast/pombe/Protein_data/"
   },
   "psi-mi" : {
      "generic_url" : "http://psidev.sourceforge.net/mi/xml/doc/user/index.html",
      "name" : null,
      "database" : "Proteomic Standard Initiative for Molecular Interaction",
      "url_example" : null,
      "object" : "Interaction identifier",
      "example_id" : "MI:0018",
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "PSI-MI",
      "url_syntax" : null
   },
   "patric" : {
      "fullname" : null,
      "description" : "PathoSystems Resource Integration Center at the Virginia Bioinformatics Institute",
      "example_id" : "PATRIC:cds.000002.436951",
      "database" : "PathoSystems Resource Integration Center",
      "url_example" : "http://patric.vbi.vt.edu/gene/overview.php?fid=cds.000002.436951",
      "object" : "Feature identifier",
      "name" : null,
      "generic_url" : "http://patric.vbi.vt.edu",
      "url_syntax" : "http://patric.vbi.vt.edu/gene/overview.php?fid=[example_id]",
      "abbreviation" : "PATRIC",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "multifun" : {
      "example_id" : null,
      "fullname" : null,
      "generic_url" : "http://genprotec.mbl.edu/files/MultiFun.html",
      "name" : null,
      "url_example" : null,
      "object" : null,
      "database" : "MultiFun cell function assignment schema",
      "abbreviation" : "MultiFun",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "rnamdb" : {
      "url_syntax" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?[example_id]",
      "abbreviation" : "RNAMDB",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "fullname" : null,
      "example_id" : "RNAmods:037",
      "database" : "RNA Modification Database",
      "object" : "Identifier",
      "url_example" : "http://s59.cas.albany.edu/RNAmods/cgi-bin/rnashow.cgi?091",
      "name" : null,
      "generic_url" : "http://s59.cas.albany.edu/RNAmods/"
   },
   "broad_neurospora" : {
      "example_id" : "BROAD_NEUROSPORA:7000007580576824",
      "description" : "Neurospora crassa database at the Broad Institute",
      "fullname" : null,
      "name" : null,
      "url_example" : "http://www.broadinstitute.org/annotation/genome/neurospora/GeneDetails.html?sp=S7000007580576824",
      "database" : "Neurospora crassa Database",
      "object" : "Identifier for Broad_Ncrassa Loci",
      "generic_url" : "http://www.broadinstitute.org/annotation/genome/neurospora/MultiHome.html",
      "url_syntax" : "http://www.broadinstitute.org/annotation/genome/neurospora/GeneDetails.html?sp=S[example_id]",
      "abbreviation" : "Broad_NEUROSPORA",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "obo_rel" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "OBO_REL",
      "url_syntax" : null,
      "generic_url" : "http://www.obofoundry.org/ro/",
      "name" : null,
      "object" : "Identifier",
      "url_example" : null,
      "database" : "OBO relation ontology",
      "example_id" : "OBO_REL:part_of",
      "fullname" : null
   },
   "sgd" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "SGD",
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "generic_url" : "http://www.yeastgenome.org/",
      "name" : null,
      "url_example" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=S000006169",
      "database" : "Saccharomyces Genome Database",
      "object" : "Identifier for SGD Loci",
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^S[0-9]{9}$",
      "example_id" : "SGD:S000006169",
      "fullname" : null
   },
   "sp_kw" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.uniprot.org/keywords/[example_id]",
      "abbreviation" : "SP_KW",
      "name" : null,
      "database" : "UniProt Knowledgebase keywords",
      "object" : "Identifier",
      "url_example" : "http://www.uniprot.org/keywords/KW-0812",
      "generic_url" : "http://www.uniprot.org/keywords/",
      "example_id" : "UniProtKB-KW:KW-0812",
      "fullname" : null
   },
   "ensembl" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "abbreviation" : "Ensembl",
      "database" : "Ensembl database of automatically annotated genomic data",
      "url_example" : "http://www.ensembl.org/id/ENSP00000265949",
      "object" : "Identifier (unspecified)",
      "name" : null,
      "generic_url" : "http://www.ensembl.org/",
      "fullname" : null,
      "example_id" : "ENSEMBL:ENSP00000265949",
      "local_id_syntax" : "^ENS[A-Z0-9]{10,17}$",
      "entity_type" : "SO:0000673 ! transcript"
   },
   "ensembl_proteinid" : {
      "url_example" : "http://www.ensembl.org/id/ENSP00000361027",
      "object" : "Protein identifier",
      "database" : "Ensembl database of automatically annotated genomic data",
      "name" : null,
      "generic_url" : "http://www.ensembl.org/",
      "fullname" : null,
      "example_id" : "ENSEMBL_ProteinID:ENSP00000361027",
      "local_id_syntax" : "^ENSP[0-9]{9,16}$",
      "entity_type" : "PR:000000001 ! protein",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "abbreviation" : "ENSEMBL_ProteinID"
   },
   "ec" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "EC",
      "url_syntax" : "http://www.expasy.org/enzyme/[example_id]",
      "generic_url" : "http://www.chem.qmul.ac.uk/iubmb/enzyme/",
      "name" : null,
      "object" : null,
      "url_example" : "http://www.expasy.org/enzyme/1.4.3.6",
      "database" : "Enzyme Commission",
      "! url_example" : "http://www.chem.qmw.ac.uk/iubmb/enzyme/EC1/4/3/6.html",
      "entity_type" : "GO:0003824 ! catalytic activity",
      "example_id" : "EC:1.4.3.6",
      "fullname" : null
   },
   "psi-mod" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "PSI-MOD",
      "url_syntax" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:[example_id]",
      "generic_url" : "http://psidev.sourceforge.net/mod/",
      "name" : null,
      "url_example" : "http://www.ebi.ac.uk/ontology-lookup/?termId=MOD:00219",
      "database" : "Proteomics Standards Initiative protein modification ontology",
      "object" : "Protein modification identifier",
      "example_id" : "MOD:00219",
      "fullname" : null
   },
   "fb" : {
      "url_syntax" : "http://flybase.org/reports/[example_id].html",
      "abbreviation" : "FB",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "fullname" : null,
      "example_id" : "FB:FBgn0000024",
      "local_id_syntax" : "^FBgn[0-9]{7}$",
      "entity_type" : "SO:0000704 ! gene",
      "url_example" : "http://flybase.org/reports/FBgn0000024.html",
      "object" : "Identifier",
      "database" : "FlyBase",
      "name" : null,
      "generic_url" : "http://flybase.org/"
   },
   "go_ref" : {
      "generic_url" : "http://www.geneontology.org/",
      "name" : null,
      "database" : "Gene Ontology Database references",
      "url_example" : "http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:0000001",
      "object" : "Accession (for reference)",
      "local_id_syntax" : "^\\d{7}$",
      "example_id" : "GO_REF:0000001",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "GO_REF",
      "url_syntax" : "http://www.geneontology.org/cgi-bin/references.cgi#GO_REF:[example_id]"
   },
   "intact" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "IntAct",
      "url_syntax" : "http://www.ebi.ac.uk/intact/search/do/search?searchString=[example_id]",
      "generic_url" : "http://www.ebi.ac.uk/intact/",
      "name" : null,
      "object" : "Accession",
      "url_example" : "http://www.ebi.ac.uk/intact/search/do/search?searchString=EBI-17086",
      "database" : "IntAct protein interaction database",
      "entity_type" : "MI:0315 ! protein complex ",
      "local_id_syntax" : "^[0-9]+$",
      "example_id" : "IntAct:EBI-17086",
      "fullname" : null
   },
   "pfamb" : {
      "fullname" : null,
      "example_id" : "PfamB:PB014624",
      "generic_url" : "http://www.sanger.ac.uk/Software/Pfam/",
      "database" : "Pfam-B supplement to Pfam",
      "url_example" : null,
      "object" : "Accession",
      "name" : null,
      "abbreviation" : "PfamB",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "mengo" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "abbreviation" : "MENGO",
      "name" : null,
      "url_example" : null,
      "database" : "Microbial ENergy processes Gene Ontology Project",
      "object" : null,
      "generic_url" : "http://mengo.vbi.vt.edu/",
      "example_id" : null,
      "fullname" : null
   },
   "pirsf" : {
      "url_syntax" : "http://pir.georgetown.edu/cgi-bin/ipcSF?id=[example_id]",
      "abbreviation" : "PIRSF",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "fullname" : null,
      "example_id" : "PIRSF:SF002327",
      "url_example" : "http://pir.georgetown.edu/cgi-bin/ipcSF?id=SF002327",
      "object" : "Identifier",
      "database" : "PIR Superfamily Classification System",
      "name" : null,
      "generic_url" : "http://pir.georgetown.edu/pirsf/"
   },
   "pamgo_vmd" : {
      "name" : null,
      "object" : "Gene identifier",
      "url_example" : "http://vmd.vbi.vt.edu/cgi-bin/browse/go_detail.cgi?gene_id=109198",
      "database" : "Virginia Bioinformatics Institute Microbial Database",
      "generic_url" : "http://phytophthora.vbi.vt.edu",
      "description" : "Virginia Bioinformatics Institute Microbial Database; member of PAMGO Interest Group",
      "example_id" : "PAMGO_VMD:109198",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://vmd.vbi.vt.edu/cgi-bin/browse/go_detail.cgi?gene_id=[example_id]",
      "abbreviation" : "PAMGO_VMD"
   },
   "ecocyc" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://biocyc.org/ECOLI/NEW-IMAGE?type=PATHWAY&object=[example_id]",
      "abbreviation" : "EcoCyc",
      "name" : null,
      "object" : "Pathway identifier",
      "url_example" : "http://biocyc.org/ECOLI/NEW-IMAGE?type=PATHWAY&object=P2-PWY",
      "database" : "Encyclopedia of E. coli metabolism",
      "generic_url" : "http://ecocyc.org/",
      "example_id" : "EcoCyc:P2-PWY",
      "fullname" : null,
      "entity_type" : "GO:0008150 ! biological process",
      "local_id_syntax" : "^EG[0-9]{5}$"
   },
   "iuphar" : {
      "abbreviation" : "IUPHAR",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "fullname" : null,
      "generic_url" : "http://www.iuphar.org/",
      "name" : null,
      "url_example" : null,
      "object" : null,
      "database" : "International Union of Pharmacology"
   },
   "sgd_locus" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "SGD_LOCUS",
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "generic_url" : "http://www.yeastgenome.org/",
      "name" : null,
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "url_example" : "http://db.yeastgenome.org/cgi-bin/locus.pl?locus=GAL4",
      "database" : "Saccharomyces Genome Database",
      "example_id" : "SGD_LOCUS:GAL4",
      "fullname" : null
   },
   "sgdid" : {
      "url_syntax" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "abbreviation" : "SGDID",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "example_id" : "SGD:S000006169",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^S[0-9]{9}$",
      "name" : null,
      "database" : "Saccharomyces Genome Database",
      "object" : "Identifier for SGD Loci",
      "url_example" : "http://db.yeastgenome.org/cgi-bin/locus.pl?dbid=S000006169",
      "generic_url" : "http://www.yeastgenome.org/"
   },
   "mim" : {
      "object" : "Identifier",
      "url_example" : "http://omim.org/entry/190198",
      "database" : "Mendelian Inheritance in Man",
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=OMIM",
      "fullname" : null,
      "example_id" : "OMIM:190198",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://omim.org/entry/[example_id]",
      "abbreviation" : "MIM"
   },
   "tigr_genprop" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=[example_id]",
      "abbreviation" : "TIGR_GenProp",
      "database" : "Genome Properties database at the J. Craig Venter Institute",
      "object" : "Accession",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=GenProp0120",
      "name" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "fullname" : null,
      "example_id" : "JCVI_GenProp:GenProp0120",
      "local_id_syntax" : "^GenProp[0-9]{4}$",
      "entity_type" : "GO:0008150 ! biological process"
   },
   "mips_funcat" : {
      "abbreviation" : "MIPS_funcat",
      "url_syntax" : "http://mips.gsf.de/cgi-bin/proj/funcatDB/search_advanced.pl?action=2&wert=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "MIPS_funcat:11.02",
      "generic_url" : "http://mips.gsf.de/proj/funcatDB/",
      "url_example" : "http://mips.gsf.de/cgi-bin/proj/funcatDB/search_advanced.pl?action=2&wert=11.02",
      "object" : "Identifier",
      "database" : "MIPS Functional Catalogue",
      "name" : null
   },
   "um-bbd_ruleid" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/rule.jsp?rule=[example_id]",
      "abbreviation" : "UM-BBD_ruleID",
      "url_example" : "http://umbbd.msi.umn.edu/servlets/rule.jsp?rule=bt0330",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "object" : "Rule identifier",
      "name" : null,
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "fullname" : null,
      "example_id" : "UM-BBD_ruleID:bt0330"
   },
   "ecocyc_ref" : {
      "generic_url" : "http://ecocyc.org/",
      "name" : null,
      "database" : "Encyclopedia of E. coli metabolism",
      "object" : "Reference identifier",
      "url_example" : "http://biocyc.org/ECOLI/reference.html?type=CITATION-FRAME&object=COLISALII",
      "example_id" : "EcoCyc_REF:COLISALII",
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "ECOCYC_REF",
      "url_syntax" : "http://biocyc.org/ECOLI/reference.html?type=CITATION-FRAME&object=[example_id]"
   },
   "gr_qtl" : {
      "generic_url" : "http://www.gramene.org/",
      "object" : "QTL identifier",
      "url_example" : "http://www.gramene.org/db/qtl/qtl_display?qtl_accession_id=CQU7",
      "database" : null,
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "name" : null,
      "fullname" : null,
      "example_id" : "GR_QTL:CQU7",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "GR_QTL",
      "url_syntax" : "http://www.gramene.org/db/qtl/qtl_display?qtl_accession_id=[example_id]"
   },
   "mgi" : {
      "local_id_syntax" : "^MGI:[0-9]{5,}$",
      "entity_type" : "VariO:0001 ! variation",
      "fullname" : null,
      "example_id" : "MGI:MGI:80863",
      "generic_url" : "http://www.informatics.jax.org/",
      "url_example" : "http://www.informatics.jax.org/accession/MGI:80863",
      "object" : "Accession",
      "database" : "Mouse Genome Informatics",
      "name" : null,
      "abbreviation" : "MGI",
      "url_syntax" : "http://www.informatics.jax.org/accession/[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "hamap" : {
      "abbreviation" : "HAMAP",
      "url_syntax" : "http://hamap.expasy.org/unirule/[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "HAMAP:MF_00031",
      "generic_url" : "http://hamap.expasy.org/",
      "url_example" : "http://hamap.expasy.org/unirule/MF_00131",
      "database" : "High-quality Automated and Manual Annotation of microbial Proteomes",
      "object" : "Identifier",
      "name" : null
   },
   "vbrc" : {
      "example_id" : "VBRC:F35742",
      "fullname" : null,
      "generic_url" : "http://vbrc.org",
      "name" : null,
      "database" : "Viral Bioinformatics Resource Center",
      "url_example" : "http://vbrc.org/query.asp?web_id=VBRC:F35742",
      "object" : "Identifier",
      "abbreviation" : "VBRC",
      "url_syntax" : "http://vbrc.org/query.asp?web_id=VBRC:[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "jcvi_tigrfams" : {
      "url_syntax" : "http://search.jcvi.org/search?p&q=[example_id]",
      "abbreviation" : "JCVI_TIGRFAMS",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "example_id" : "JCVI_TIGRFAMS:TIGR00254",
      "fullname" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "name" : null,
      "url_example" : "http://search.jcvi.org/search?p&q=TIGR00254",
      "object" : "Accession",
      "database" : "TIGRFAMs HMM collection at the J. Craig Venter Institute",
      "generic_url" : "http://search.jcvi.org/"
   },
   "paint_ref" : {
      "url_syntax" : "http://www.geneontology.org/gene-associations/submission/paint/[example_id]/[example_id].txt",
      "abbreviation" : "PAINT_REF",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "example_id" : "PAINT_REF:PTHR10046",
      "fullname" : null,
      "name" : null,
      "database" : "Phylogenetic Annotation INference Tool References",
      "url_example" : "http://www.geneontology.org/gene-associations/submission/paint/PTHR10046/PTHR10046.txt",
      "object" : "Reference locator",
      "generic_url" : "http://www.pantherdb.org/"
   },
   "wbphenotype" : {
      "generic_url" : "http://www.wormbase.org/",
      "name" : null,
      "database" : "WormBase phenotype ontology",
      "url_example" : "http://www.wormbase.org/species/c_elegans/phenotype/WBPhenotype:0000154",
      "object" : "Gene identifier",
      "entity_type" : "PATO:0000001 ! Quality",
      "local_id_syntax" : "^[0-9]{7}$",
      "example_id" : "WBPhenotype:0002117",
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "WBPhenotype",
      "url_syntax" : "http://www.wormbase.org/species/c_elegans/phenotype/WBPhenotype:[example_id]"
   },
   "jcvi_ref" : {
      "generic_url" : "http://cmr.jcvi.org/",
      "object" : "Reference locator",
      "url_example" : "http://cmr.jcvi.org/CMR/AnnotationSops.shtml",
      "database" : "J. Craig Venter Institute",
      "name" : null,
      "fullname" : null,
      "example_id" : "JCVI_REF:GO_ref",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "JCVI_REF",
      "url_syntax" : null
   },
   "subtilistg" : {
      "generic_url" : "http://genolist.pasteur.fr/SubtiList/",
      "url_example" : null,
      "database" : "Bacillus subtilis Genome Sequence Project",
      "object" : "Gene symbol",
      "name" : null,
      "fullname" : null,
      "example_id" : "SUBTILISTG:accC",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "SUBTILISTG",
      "url_syntax" : null
   },
   "wbbt" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "WBbt",
      "url_syntax" : null,
      "generic_url" : "http://www.wormbase.org/",
      "name" : null,
      "object" : "Identifier",
      "url_example" : null,
      "database" : "C. elegans gross anatomy",
      "entity_type" : "WBbt:0005766 ! anatomy",
      "local_id_syntax" : "[0-9]{7}",
      "example_id" : "WBbt:0005733",
      "fullname" : null
   },
   "tigr_ref" : {
      "abbreviation" : "TIGR_REF",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "JCVI_REF:GO_ref",
      "fullname" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "name" : null,
      "database" : "J. Craig Venter Institute",
      "object" : "Reference locator",
      "url_example" : "http://cmr.jcvi.org/CMR/AnnotationSops.shtml"
   },
   "um-bbd_reactionid" : {
      "example_id" : "UM-BBD_reactionID:r0129",
      "fullname" : null,
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "name" : null,
      "url_example" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=r&reacID=r0129",
      "object" : "Reaction identifier",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "abbreviation" : "UM-BBD_reactionID",
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=r&reacID=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "casref" : {
      "example_id" : "CASREF:2031",
      "fullname" : null,
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "name" : null,
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getref.asp?id=2031",
      "database" : "Catalog of Fishes publications database",
      "object" : "Identifier",
      "abbreviation" : "CASREF",
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getref.asp?id=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "chebi" : {
      "fullname" : null,
      "example_id" : "CHEBI:17234",
      "local_id_syntax" : "^[0-9]{1,6}$",
      "entity_type" : "CHEBI:24431 ! chemical entity ",
      "object" : "Identifier",
      "database" : "Chemical Entities of Biological Interest",
      "url_example" : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:17234",
      "name" : null,
      "generic_url" : "http://www.ebi.ac.uk/chebi/",
      "url_syntax" : "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:[example_id]",
      "abbreviation" : "ChEBI",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null
   },
   "cgdid" : {
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=[example_id]",
      "abbreviation" : "CGDID",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "fullname" : null,
      "example_id" : "CGD:CAL0005516",
      "local_id_syntax" : "^(CAL|CAF)[0-9]{7}$",
      "entity_type" : "SO:0000704 ! gene",
      "object" : "Identifier for CGD Loci",
      "database" : "Candida Genome Database",
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=CAL0005516",
      "name" : null,
      "generic_url" : "http://www.candidagenome.org/"
   },
   "gr_protein" : {
      "abbreviation" : "GR_protein",
      "url_syntax" : "http://www.gramene.org/db/protein/protein_search?acc=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "entity_type" : "PR:000000001 ! protein",
      "local_id_syntax" : "^[A-Z][0-9][A-Z0-9]{3}[0-9]$",
      "example_id" : "GR_PROTEIN:Q6VSV0",
      "fullname" : null,
      "generic_url" : "http://www.gramene.org/",
      "name" : null,
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "object" : "Protein identifier",
      "database" : null,
      "url_example" : "http://www.gramene.org/db/protein/protein_search?acc=Q6VSV0"
   },
   "merops_fam" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://merops.sanger.ac.uk/cgi-bin/famsum?family=[example_id]",
      "abbreviation" : "MEROPS_fam",
      "name" : null,
      "url_example" : "http://merops.sanger.ac.uk/cgi-bin/famsum?family=m18",
      "database" : "MEROPS peptidase database",
      "object" : "Peptidase family identifier",
      "generic_url" : "http://merops.sanger.ac.uk/",
      "example_id" : "MEROPS_fam:M18",
      "fullname" : null
   },
   "uniprotkb" : {
      "generic_url" : "http://www.uniprot.org",
      "name" : null,
      "database" : "Universal Protein Knowledgebase",
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "object" : "Accession",
      "entity_type" : "PR:000000001 ! protein ",
      "local_id_syntax" : "^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z]([0-9][A-Z][A-Z0-9]{2}){1,2}[0-9])((-[0-9]+)|:PRO_[0-9]{10}|:VAR_[0-9]{6}){0,1}$",
      "example_id" : "UniProtKB:P51587",
      "description" : "A central repository of protein sequence and function created by joining the information contained in Swiss-Prot, TrEMBL, and PIR database",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "UniProtKB",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]"
   },
   "dictybase" : {
      "generic_url" : "http://dictybase.org",
      "database" : "dictyBase",
      "object" : "Identifier",
      "url_example" : "http://dictybase.org/gene/DDB_G0277859",
      "name" : null,
      "local_id_syntax" : "^DDB_G[0-9]{7}$",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "example_id" : "dictyBase:DDB_G0277859",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "DictyBase",
      "url_syntax" : "http://dictybase.org/gene/[example_id]"
   },
   "casspc" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=[example_id]",
      "abbreviation" : "CASSPC",
      "database" : "Catalog of Fishes species database",
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Species&id=1979",
      "object" : "Identifier",
      "name" : null,
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "fullname" : null,
      "example_id" : null
   },
   "hpa" : {
      "name" : null,
      "database" : "Human Protein Atlas tissue profile information",
      "url_example" : "http://www.proteinatlas.org/tissue_profile.php?antibody_id=HPA000237",
      "object" : "Identifier",
      "generic_url" : "http://www.proteinatlas.org/",
      "example_id" : "HPA:HPA000237",
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.proteinatlas.org/tissue_profile.php?antibody_id=[example_id]",
      "abbreviation" : "HPA"
   },
   "fma" : {
      "abbreviation" : "FMA",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "FMA:61905",
      "generic_url" : "http://sig.biostr.washington.edu/projects/fm/index.html",
      "database" : "Foundational Model of Anatomy",
      "url_example" : null,
      "object" : "Identifier",
      "name" : null
   },
   "rfam" : {
      "generic_url" : "http://rfam.sanger.ac.uk/",
      "name" : null,
      "url_example" : "http://rfam.sanger.ac.uk/family/RF00012",
      "object" : "accession",
      "database" : "Rfam database of RNA families",
      "example_id" : "Rfam:RF00012",
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "Rfam",
      "url_syntax" : "http://rfam.sanger.ac.uk/family/[example_id]"
   },
   "broad_mgg" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "Broad_MGG",
      "url_syntax" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/GeneLocus.html?sp=S[example_id]",
      "generic_url" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/Home.html",
      "name" : null,
      "object" : "Locus",
      "url_example" : "http://www.broad.mit.edu/annotation/genome/magnaporthe_grisea/GeneLocus.html?sp=SMGG_05132",
      "database" : "Magnaporthe grisea Database",
      "example_id" : "Broad_MGG:MGG_05132.5",
      "description" : "Magnaporthe grisea Database at the Broad Institute",
      "fullname" : null
   },
   "pir" : {
      "local_id_syntax" : "^[A-Z]{1}[0-9]{5}$",
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "example_id" : "PIR:I49499",
      "generic_url" : "http://pir.georgetown.edu/",
      "database" : "Protein Information Resource",
      "url_example" : "http://pir.georgetown.edu/cgi-bin/pirwww/nbrfget?uid=I49499",
      "object" : "Accession",
      "name" : null,
      "abbreviation" : "PIR",
      "url_syntax" : "http://pir.georgetown.edu/cgi-bin/pirwww/nbrfget?uid=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "cbs" : {
      "generic_url" : "http://www.cbs.dtu.dk/",
      "name" : null,
      "database" : "Center for Biological Sequence Analysis",
      "url_example" : "http://www.cbs.dtu.dk/services/[example_id]/",
      "object" : "prediction tool",
      "example_id" : "CBS:TMHMM",
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "CBS",
      "url_syntax" : null
   },
   "refseq_na" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/RefSeq/",
      "name" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=NC_000913",
      "database" : "RefSeq (Nucleic Acid)",
      "object" : "Identifier",
      "example_id" : "RefSeq_NA:NC_000913",
      "fullname" : null,
      "replaced_by" : "RefSeq",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "is_obsolete" : "true",
      "abbreviation" : "RefSeq_NA",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]"
   },
   "muscletrait" : {
      "url_syntax" : null,
      "abbreviation" : "MuscleTRAIT",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "description" : "an integrated database of transcripts expressed in human skeletal muscle",
      "example_id" : null,
      "fullname" : null,
      "name" : null,
      "database" : "TRAnscript Integrated Table",
      "object" : null,
      "url_example" : null,
      "generic_url" : "http://muscle.cribi.unipd.it/"
   },
   "h-invdb_cdna" : {
      "fullname" : null,
      "example_id" : "H-invDB_cDNA:AK093148",
      "generic_url" : "http://www.h-invitational.jp/",
      "url_example" : "http://www.h-invitational.jp/hinv/spsoup/transcript_view?acc_id=AK093149",
      "database" : "H-invitational Database",
      "object" : "Accession",
      "name" : null,
      "abbreviation" : "H-invDB_cDNA",
      "url_syntax" : "http://www.h-invitational.jp/hinv/spsoup/transcript_view?acc_id=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "genedb" : {
      "local_id_syntax" : "^Tb\\d+\\.[A-Za-z0-9]+\\.\\d+$",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "example_id" : "PF3D7_1467300",
      "generic_url" : "http://www.genedb.org/gene/",
      "url_example" : "http://www.genedb.org/gene/PF3D7_1467300",
      "database" : "GeneDB",
      "object" : "Identifier",
      "name" : null,
      "abbreviation" : "GeneDB",
      "url_syntax" : "http://www.genedb.org/gene/[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "ensembl_geneid" : {
      "local_id_syntax" : "^ENSG[0-9]{9,16}$",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "example_id" : "ENSEMBL_GeneID:ENSG00000126016",
      "generic_url" : "http://www.ensembl.org/",
      "url_example" : "http://www.ensembl.org/id/ENSG00000126016",
      "object" : "Gene identifier",
      "database" : "Ensembl database of automatically annotated genomic data",
      "name" : null,
      "abbreviation" : "ENSEMBL_GeneID",
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "ddbj" : {
      "example_id" : "DDBJ:AA816246",
      "fullname" : null,
      "generic_url" : "http://www.ddbj.nig.ac.jp/",
      "name" : null,
      "url_example" : "http://arsa.ddbj.nig.ac.jp/arsa/ddbjSplSearch?KeyWord=AA816246",
      "object" : "Sequence accession",
      "database" : "DNA Databank of Japan",
      "abbreviation" : "DDBJ",
      "url_syntax" : "http://arsa.ddbj.nig.ac.jp/arsa/ddbjSplSearch?KeyWord=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "pubchem_compound" : {
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pccompound&term=[example_id]",
      "abbreviation" : "PubChem_Compound",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "example_id" : "PubChem_Compound:2244",
      "fullname" : null,
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "local_id_syntax" : "^[0-9]+$",
      "name" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pccompound&term=2244",
      "object" : "Identifier",
      "database" : "NCBI PubChem database of chemical structures",
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/"
   },
   "wormbase" : {
      "abbreviation" : "WormBase",
      "url_syntax" : "http://www.wormbase.org/db/gene/gene?name=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "local_id_syntax" : "^WB(Gene|Var|RNAi|Transgene)[0-9]{8}$",
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "example_id" : "WB:WBGene00003001",
      "generic_url" : "http://www.wormbase.org/",
      "object" : "Gene identifier",
      "url_example" : "http://www.wormbase.org/db/get?class=Gene;name=WBGene00003001",
      "database" : "WormBase database of nematode biology",
      "name" : null
   },
   "corum" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "CORUM",
      "url_syntax" : "http://mips.gsf.de/genre/proj/corum/complexdetails.html?id=[example_id]",
      "generic_url" : "http://mips.gsf.de/genre/proj/corum/",
      "name" : null,
      "object" : "Identifier",
      "url_example" : "http://mips.gsf.de/genre/proj/corum/complexdetails.html?id=837",
      "database" : "CORUM - the Comprehensive Resource of Mammalian protein complexes",
      "example_id" : "CORUM:837",
      "fullname" : null
   },
   "hugo" : {
      "name" : null,
      "url_example" : null,
      "database" : "Human Genome Organisation",
      "object" : null,
      "generic_url" : "http://www.hugo-international.org/",
      "example_id" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "abbreviation" : "HUGO"
   },
   "imgt_hla" : {
      "abbreviation" : "IMGT_HLA",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "IMGT_HLA:HLA00031",
      "fullname" : null,
      "generic_url" : "http://www.ebi.ac.uk/imgt/hla",
      "name" : null,
      "url_example" : null,
      "object" : null,
      "database" : "IMGT/HLA human major histocompatibility complex sequence database"
   },
   "cl" : {
      "fullname" : null,
      "example_id" : "CL:0000041",
      "local_id_syntax" : "^[0-9]{7}$",
      "entity_type" : "CL:0000000 ! cell ",
      "object" : "Identifier",
      "url_example" : "http://purl.obolibrary.org/obo/CL_0000041",
      "database" : "Cell Type Ontology",
      "name" : null,
      "generic_url" : "http://cellontology.org",
      "url_syntax" : "http://purl.obolibrary.org/obo/CL_[example_id]",
      "abbreviation" : "CL",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null
   },
   "sabio-rk" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "SABIO-RK",
      "url_syntax" : "http://sabio.villa-bosch.de/reacdetails.jsp?reactid=[example_id]",
      "generic_url" : "http://sabio.villa-bosch.de/",
      "name" : null,
      "database" : "SABIO Reaction Kinetics",
      "url_example" : "http://sabio.villa-bosch.de/reacdetails.jsp?reactid=1858",
      "object" : "reaction",
      "description" : "The SABIO-RK (System for the Analysis of Biochemical Pathways - Reaction Kinetics) is a web-based application based on the SABIO relational database that contains information about biochemical reactions, their kinetic equations with their parameters, and the experimental conditions under which these parameters were measured.",
      "example_id" : "SABIO-RK:1858",
      "fullname" : null
   },
   "maizegdb" : {
      "url_syntax" : "http://www.maizegdb.org/cgi-bin/id_search.cgi?id=[example_id]",
      "abbreviation" : "MaizeGDB",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "example_id" : "MaizeGDB:881225",
      "fullname" : null,
      "name" : null,
      "database" : "MaizeGDB",
      "url_example" : "http://www.maizegdb.org/cgi-bin/id_search.cgi?id=881225",
      "object" : "MaizeGDB Object ID Number",
      "generic_url" : "http://www.maizegdb.org"
   },
   "tair" : {
      "abbreviation" : "TAIR",
      "url_syntax" : "http://arabidopsis.org/servlets/TairObject?accession=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "local_id_syntax" : "^locus:[0-9]{7}$",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "example_id" : "TAIR:locus:2146653",
      "generic_url" : "http://www.arabidopsis.org/",
      "url_example" : "http://arabidopsis.org/servlets/TairObject?accession=locus:2146653",
      "database" : "The Arabidopsis Information Resource",
      "object" : "Accession",
      "name" : null
   },
   "sanger" : {
      "name" : null,
      "object" : null,
      "url_example" : null,
      "database" : "Wellcome Trust Sanger Institute",
      "generic_url" : "http://www.sanger.ac.uk/",
      "example_id" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "abbreviation" : "Sanger"
   },
   "smart" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "SMART",
      "url_syntax" : "http://smart.embl-heidelberg.de/smart/do_annotation.pl?BLAST=DUMMY&DOMAIN=[example_id]",
      "generic_url" : "http://smart.embl-heidelberg.de/",
      "url_example" : "http://smart.embl-heidelberg.de/smart/do_annotation.pl?BLAST=DUMMY&DOMAIN=SM00005",
      "database" : "Simple Modular Architecture Research Tool",
      "object" : "Accession",
      "name" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "example_id" : "SMART:SM00005"
   },
   "biosis" : {
      "fullname" : null,
      "example_id" : "BIOSIS:200200247281",
      "generic_url" : "http://www.biosis.org/",
      "url_example" : null,
      "object" : "Identifier",
      "database" : "BIOSIS previews",
      "name" : null,
      "abbreviation" : "BIOSIS",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "casgen" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=[example_id]",
      "abbreviation" : "CASGEN",
      "object" : "Identifier",
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=1040",
      "database" : "Catalog of Fishes genus database",
      "name" : null,
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "fullname" : null,
      "example_id" : "CASGEN:1040"
   },
   "pamgo_gat" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "PAMGO_GAT",
      "url_syntax" : "http://agro.vbi.vt.edu/public/servlet/GeneEdit?&Search=Search&level=2&genename=[example_id]",
      "generic_url" : "http://agro.vbi.vt.edu/public/",
      "database" : "Genome Annotation Tool (Agrobacterium tumefaciens C58); PAMGO Interest Group",
      "url_example" : "http://agro.vbi.vt.edu/public/servlet/GeneEdit?&Search=Search&level=2&genename=atu0001",
      "object" : "Gene",
      "name" : null,
      "fullname" : null,
      "example_id" : "PAMGO_GAT:Atu0001"
   },
   "tgd" : {
      "fullname" : null,
      "example_id" : null,
      "generic_url" : "http://www.ciliate.org/",
      "object" : null,
      "url_example" : null,
      "database" : "Tetrahymena Genome Database",
      "name" : null,
      "abbreviation" : "TGD",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "gr_gene" : {
      "abbreviation" : "GR_gene",
      "url_syntax" : "http://www.gramene.org/db/genes/search_gene?acc=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "GR_GENE:GR:0060198",
      "generic_url" : "http://www.gramene.org/",
      "database" : null,
      "url_example" : "http://www.gramene.org/db/genes/search_gene?acc=GR:0060198",
      "object" : "Gene identifier",
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "name" : null
   },
   "geo" : {
      "abbreviation" : "GEO",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/GDSbrowser?acc=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "GEO:GDS2223",
      "fullname" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/geo/",
      "name" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/GDSbrowser?acc=GDS2223",
      "object" : null,
      "database" : "NCBI Gene Expression Omnibus"
   },
   "cazy" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "CAZY",
      "url_syntax" : "http://www.cazy.org/[example_id].html",
      "generic_url" : "http://www.cazy.org/",
      "object" : "Identifier",
      "url_example" : "http://www.cazy.org/PL11.html",
      "database" : "Carbohydrate Active EnZYmes",
      "name" : null,
      "local_id_syntax" : "^(CE|GH|GT|PL)\\d+$",
      "fullname" : null,
      "example_id" : "CAZY:PL11",
      "description" : "The CAZy database describes the families of structurally-related catalytic and carbohydrate-binding modules (or functional domains) of enzymes that degrade, modify, or create glycosidic bonds."
   },
   "iuphar_gpcr" : {
      "abbreviation" : "IUPHAR_GPCR",
      "url_syntax" : "http://www.iuphar-db.org/DATABASE/FamilyMenuForward?familyId=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : "IUPHAR_GPCR:1279",
      "fullname" : null,
      "generic_url" : "http://www.iuphar.org/",
      "name" : null,
      "url_example" : "http://www.iuphar-db.org/DATABASE/FamilyMenuForward?familyId=13",
      "object" : "G-protein-coupled receptor family identifier",
      "database" : "International Union of Pharmacology"
   },
   "uniparc" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.uniprot.org/uniparc/[example_id]",
      "abbreviation" : "UniParc",
      "url_example" : "http://www.uniprot.org/uniparc/UPI000000000A",
      "database" : "UniProt Archive",
      "object" : "Accession",
      "name" : null,
      "generic_url" : "http://www.uniprot.org/uniparc/",
      "fullname" : null,
      "example_id" : "UniParc:UPI000000000A",
      "description" : "A non-redundant archive of protein sequences extracted from Swiss-Prot, TrEMBL, PIR-PSD, EMBL, Ensembl, IPI, PDB, RefSeq, FlyBase, WormBase, European Patent Office, United States Patent and Trademark Office, and Japanese Patent Office"
   },
   "vega" : {
      "abbreviation" : "VEGA",
      "url_syntax" : "http://vega.sanger.ac.uk/perl/searchview?species=all&idx=All&q=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "VEGA:OTTHUMP00000000661",
      "generic_url" : "http://vega.sanger.ac.uk/index.html",
      "url_example" : "http://vega.sanger.ac.uk/perl/searchview?species=all&idx=All&q=OTTHUMP00000000661",
      "database" : "Vertebrate Genome Annotation database",
      "object" : "Identifier",
      "name" : null
   },
   "zfin" : {
      "generic_url" : "http://zfin.org/",
      "name" : null,
      "object" : "Identifier",
      "url_example" : "http://zfin.org/cgi-bin/ZFIN_jump?record=ZDB-GENE-990415-103",
      "database" : "Zebrafish Information Network",
      "entity_type" : "VariO:0001 ! variation",
      "local_id_syntax" : "^ZDB-(GENE|GENO|MRPHLNO)-[0-9]{6}-[0-9]+$",
      "example_id" : "ZFIN:ZDB-GENE-990415-103",
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "ZFIN",
      "url_syntax" : "http://zfin.org/cgi-bin/ZFIN_jump?record=[example_id]"
   },
   "aspgd_ref" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "abbreviation" : "AspGD_REF",
      "object" : "Literature Reference Identifier",
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/reference/reference.pl?dbid=90",
      "database" : "Aspergillus Genome Database",
      "name" : null,
      "generic_url" : "http://www.aspergillusgenome.org/",
      "fullname" : null,
      "example_id" : "AspGD_REF:90"
   },
   "tigr_tba1" : {
      "uri_prefix" : null,
      "is_obsolete" : "true",
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "abbreviation" : "TIGR_Tba1",
      "name" : null,
      "database" : "Trypanosoma brucei database at the J. Craig Venter Institute",
      "object" : "Accession",
      "url_example" : null,
      "generic_url" : "http://www.tigr.org/tdb/e2k1/tba1/",
      "example_id" : "JCVI_Tba1:25N14.10",
      "fullname" : null
   },
   "cdd" : {
      "abbreviation" : "CDD",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "CDD:34222",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?db=cdd",
      "database" : "Conserved Domain Database at NCBI",
      "url_example" : "http://www.ncbi.nlm.nih.gov/Structure/cdd/cddsrv.cgi?uid=34222",
      "object" : "Identifier",
      "name" : null
   },
   "reactome" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=[example_id]",
      "abbreviation" : "Reactome",
      "name" : null,
      "url_example" : "http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID=REACT_604",
      "database" : "Reactome - a curated knowledgebase of biological pathways",
      "object" : "Identifier",
      "generic_url" : "http://www.reactome.org/",
      "example_id" : "Reactome:REACT_604",
      "fullname" : null,
      "local_id_syntax" : "^REACT_[0-9]+$"
   },
   "uniprotkb-kw" : {
      "database" : "UniProt Knowledgebase keywords",
      "url_example" : "http://www.uniprot.org/keywords/KW-0812",
      "object" : "Identifier",
      "name" : null,
      "generic_url" : "http://www.uniprot.org/keywords/",
      "fullname" : null,
      "example_id" : "UniProtKB-KW:KW-0812",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.uniprot.org/keywords/[example_id]",
      "abbreviation" : "UniProtKB-KW"
   },
   "h-invdb_locus" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "H-invDB_locus",
      "url_syntax" : "http://www.h-invitational.jp/hinv/spsoup/locus_view?hix_id=[example_id]",
      "generic_url" : "http://www.h-invitational.jp/",
      "object" : "Cluster identifier",
      "url_example" : "http://www.h-invitational.jp/hinv/spsoup/locus_view?hix_id=HIX0014446",
      "database" : "H-invitational Database",
      "name" : null,
      "fullname" : null,
      "example_id" : "H-invDB_locus:HIX0014446"
   },
   "tgd_ref" : {
      "url_syntax" : "http://db.ciliate.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "abbreviation" : "TGD_REF",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "example_id" : "TGD_REF:T000005818",
      "fullname" : null,
      "name" : null,
      "database" : "Tetrahymena Genome Database",
      "url_example" : "http://db.ciliate.org/cgi-bin/reference/reference.pl?dbid=T000005818",
      "object" : "Literature Reference Identifier",
      "generic_url" : "http://www.ciliate.org/"
   },
   "pseudocap" : {
      "object" : "Identifier",
      "url_example" : "http://v2.pseudomonas.com/getAnnotation.do?locusID=PA4756",
      "database" : "Pseudomonas Genome Project",
      "name" : null,
      "generic_url" : "http://v2.pseudomonas.com/",
      "fullname" : null,
      "example_id" : "PseudoCAP:PA4756",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://v2.pseudomonas.com/getAnnotation.do?locusID=[example_id]",
      "abbreviation" : "PseudoCAP"
   },
   "pro" : {
      "local_id_syntax" : "^[0-9]{9}$",
      "entity_type" : "PR:000000001 ! protein ",
      "fullname" : null,
      "example_id" : "PR:000025380",
      "generic_url" : "http://www.proconsortium.org/pro/pro.shtml",
      "object" : "Identifer",
      "database" : "Protein Ontology",
      "url_example" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:000025380",
      "name" : null,
      "abbreviation" : "PRO",
      "url_syntax" : "http://www.proconsortium.org/cgi-bin/pro/entry_pro?id=PR:[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "tigr_ath1" : {
      "generic_url" : "http://www.tigr.org/tdb/e2k1/ath1/ath1.shtml",
      "object" : "Accession",
      "database" : "Arabidopsis thaliana database at the J. Craig Venter Institute",
      "url_example" : null,
      "name" : null,
      "fullname" : null,
      "example_id" : "JCVI_Ath1:At3g01440",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "is_obsolete" : "true",
      "abbreviation" : "TIGR_Ath1",
      "url_syntax" : null
   },
   "img" : {
      "abbreviation" : "IMG",
      "url_syntax" : "http://img.jgi.doe.gov/cgi-bin/pub/main.cgi?section=GeneDetail&page=geneDetail&gene_oid=[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "example_id" : "IMG:640008772",
      "fullname" : null,
      "generic_url" : "http://img.jgi.doe.gov",
      "name" : null,
      "url_example" : "http://img.jgi.doe.gov/cgi-bin/pub/main.cgi?section=GeneDetail&page=geneDetail&gene_oid=640008772",
      "object" : "Identifier",
      "database" : "Integrated Microbial Genomes; JGI web site for genome annotation"
   },
   "resid" : {
      "url_syntax" : null,
      "abbreviation" : "RESID",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "example_id" : "RESID:AA0062",
      "database" : "RESID Database of Protein Modifications",
      "url_example" : null,
      "object" : "Identifier",
      "name" : null,
      "generic_url" : "ftp://ftp.ncifcrf.gov/pub/users/residues/"
   },
   "subtilist" : {
      "entity_type" : "PR:000000001 ! protein",
      "example_id" : "SUBTILISTG:BG11384",
      "fullname" : null,
      "generic_url" : "http://genolist.pasteur.fr/SubtiList/",
      "name" : null,
      "object" : "Accession",
      "url_example" : null,
      "database" : "Bacillus subtilis Genome Sequence Project",
      "abbreviation" : "SUBTILIST",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "ncbi_gi" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "NCBI_gi",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=[example_id]",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "name" : null,
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?val=113194944",
      "object" : "Identifier",
      "database" : "NCBI databases",
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^[0-9]{6,}$",
      "example_id" : "NCBI_gi:113194944",
      "fullname" : null
   },
   "ncbi_np" : {
      "abbreviation" : "NCBI_NP",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "is_obsolete" : "true",
      "fullname" : null,
      "replaced_by" : "RefSeq",
      "example_id" : "NCBI_NP:123456",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "url_example" : null,
      "database" : "NCBI RefSeq",
      "object" : "Protein identifier",
      "name" : null
   },
   "geneid" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "object" : "Identifier",
      "database" : "NCBI Gene",
      "url_example" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=4771",
      "name" : null,
      "local_id_syntax" : "^\\d+$",
      "entity_type" : "SO:0000704 ! gene",
      "fullname" : null,
      "example_id" : "NCBI_Gene:4771",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "GeneID",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/sites/entrez?cmd=Retrieve&db=gene&list_uids=[example_id]"
   },
   "kegg_enzyme" : {
      "example_id" : "KEGG_ENZYME:2.1.1.4",
      "fullname" : null,
      "local_id_syntax" : "^\\d(\\.\\d{1,2}){2}\\.\\d{1,3}$",
      "name" : null,
      "object" : "Enzyme Commission ID, as stored in KEGG",
      "url_example" : "http://www.genome.jp/dbget-bin/www_bget?ec:2.1.1.4",
      "database" : "KEGG Enzyme Database",
      "generic_url" : "http://www.genome.jp/dbget-bin/www_bfind?enzyme",
      "url_syntax" : "http://www.genome.jp/dbget-bin/www_bget?ec:[example_id]",
      "abbreviation" : "KEGG_ENZYME",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "interpro" : {
      "url_syntax" : "http://www.ebi.ac.uk/interpro/entry/[example_id]",
      "abbreviation" : "INTERPRO",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "example_id" : "InterPro:IPR000001",
      "fullname" : null,
      "entity_type" : "SO:0000839 ! polypeptide region",
      "local_id_syntax" : "^IPR\\d{6}$",
      "name" : null,
      "object" : "Identifier",
      "database" : "InterPro database of protein domains and motifs",
      "url_example" : "http://www.ebi.ac.uk/interpro/entry/IPR015421",
      "generic_url" : "http://www.ebi.ac.uk/interpro/"
   },
   "h-invdb" : {
      "fullname" : null,
      "example_id" : null,
      "database" : "H-invitational Database",
      "url_example" : null,
      "object" : null,
      "name" : null,
      "generic_url" : "http://www.h-invitational.jp/",
      "url_syntax" : null,
      "abbreviation" : "H-invDB",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "vz" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "VZ",
      "url_syntax" : "http://viralzone.expasy.org/all_by_protein/[example_id].html",
      "generic_url" : "http://viralzone.expasy.org/",
      "database" : "ViralZone",
      "url_example" : "http://viralzone.expasy.org/all_by_protein/957.html",
      "object" : "Page Reference Identifier",
      "name" : null,
      "fullname" : null,
      "example_id" : "VZ:957"
   },
   "nmpdr" : {
      "fullname" : null,
      "example_id" : "NMPDR:fig|306254.1.peg.183",
      "generic_url" : "http://www.nmpdr.org",
      "object" : "Identifier",
      "url_example" : "http://www.nmpdr.org/linkin.cgi?id=fig|306254.1.peg.183",
      "database" : "National Microbial Pathogen Data Resource",
      "name" : null,
      "abbreviation" : "NMPDR",
      "url_syntax" : "http://www.nmpdr.org/linkin.cgi?id=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "jcvi_ath1" : {
      "generic_url" : "http://www.tigr.org/tdb/e2k1/ath1/ath1.shtml",
      "database" : "Arabidopsis thaliana database at the J. Craig Venter Institute",
      "url_example" : null,
      "object" : "Accession",
      "name" : null,
      "fullname" : null,
      "example_id" : "JCVI_Ath1:At3g01440",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "is_obsolete" : "true",
      "abbreviation" : "JCVI_Ath1",
      "url_syntax" : null
   },
   "cgd_ref" : {
      "fullname" : null,
      "example_id" : "CGD_REF:1490",
      "generic_url" : "http://www.candidagenome.org/",
      "database" : "Candida Genome Database",
      "url_example" : "http://www.candidagenome.org/cgi-bin/reference/reference.pl?dbid=1490",
      "object" : "Literature Reference Identifier",
      "name" : null,
      "abbreviation" : "CGD_REF",
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/reference/reference.pl?dbid=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "gonuts" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "GONUTS",
      "url_syntax" : "http://gowiki.tamu.edu/wiki/index.php/[example_id]",
      "generic_url" : "http://gowiki.tamu.edu",
      "database" : "Gene Ontology Normal Usage Tracking System (GONUTS)",
      "url_example" : "http://gowiki.tamu.edu/wiki/index.php/MOUSE:CD28",
      "object" : "Identifier (for gene or gene product)",
      "name" : null,
      "fullname" : null,
      "example_id" : "GONUTS:MOUSE:CD28",
      "description" : "Third party documentation for GO and community annotation system."
   },
   "sgn_ref" : {
      "example_id" : "SGN_ref:861",
      "fullname" : null,
      "name" : null,
      "url_example" : "http://www.sgn.cornell.edu/chado/publication.pl?pub_id=861",
      "database" : "Sol Genomics Network",
      "object" : "Reference identifier",
      "generic_url" : "http://www.sgn.cornell.edu/",
      "url_syntax" : "http://www.sgn.cornell.edu/chado/publication.pl?pub_id=[example_id]",
      "abbreviation" : "SGN_ref",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "wbls" : {
      "generic_url" : "http://www.wormbase.org/",
      "name" : null,
      "url_example" : null,
      "database" : "C. elegans development",
      "object" : "Identifier",
      "entity_type" : "WBls:0000075 ! nematoda Life Stage",
      "local_id_syntax" : "[0-9]{7}",
      "example_id" : "WBls:0000010",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "WBls",
      "url_syntax" : null
   },
   "cog_pathway" : {
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/new/release/coglist.cgi?pathw=14",
      "database" : "NCBI COG pathway",
      "object" : "Identifier",
      "name" : null,
      "fullname" : null,
      "example_id" : "COG_Pathway:14",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "COG_Pathway",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/new/release/coglist.cgi?pathw=[example_id]"
   },
   "jcvi_genprop" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=[example_id]",
      "abbreviation" : "JCVI_GenProp",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenomePropDefinition.cgi?prop_acc=GenProp0120",
      "database" : "Genome Properties database at the J. Craig Venter Institute",
      "object" : "Accession",
      "name" : null,
      "generic_url" : "http://cmr.jcvi.org/",
      "fullname" : null,
      "example_id" : "JCVI_GenProp:GenProp0120",
      "local_id_syntax" : "^GenProp[0-9]{4}$",
      "entity_type" : "GO:0008150 ! biological process"
   },
   "gdb" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "GDB",
      "url_syntax" : "http://www.gdb.org/gdb-bin/genera/accno?accessionNum=GDB:[example_id]",
      "generic_url" : "http://www.gdb.org/",
      "name" : null,
      "database" : "Human Genome Database",
      "url_example" : "http://www.gdb.org/gdb-bin/genera/accno?accessionNum=GDB:306600",
      "object" : "Accession",
      "example_id" : "GDB:306600",
      "fullname" : null
   },
   "ipr" : {
      "abbreviation" : "IPR",
      "url_syntax" : "http://www.ebi.ac.uk/interpro/entry/[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "local_id_syntax" : "^IPR\\d{6}$",
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "example_id" : "InterPro:IPR000001",
      "generic_url" : "http://www.ebi.ac.uk/interpro/",
      "database" : "InterPro database of protein domains and motifs",
      "object" : "Identifier",
      "url_example" : "http://www.ebi.ac.uk/interpro/entry/IPR015421",
      "name" : null
   },
   "jcvi_tba1" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "is_obsolete" : "true",
      "abbreviation" : "JCVI_Tba1",
      "url_syntax" : null,
      "generic_url" : "http://www.tigr.org/tdb/e2k1/tba1/",
      "object" : "Accession",
      "url_example" : null,
      "database" : "Trypanosoma brucei database at the J. Craig Venter Institute",
      "name" : null,
      "fullname" : null,
      "example_id" : "JCVI_Tba1:25N14.10"
   },
   "gene3d" : {
      "url_example" : "http://gene3d.biochem.ucl.ac.uk/superfamily/?accession=G3DSA%3A3.30.390.30",
      "object" : "Accession",
      "database" : "Domain Architecture Classification",
      "name" : null,
      "generic_url" : "http://gene3d.biochem.ucl.ac.uk/Gene3D/",
      "fullname" : null,
      "example_id" : "Gene3D:G3DSA:3.30.390.30",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://gene3d.biochem.ucl.ac.uk/superfamily/?accession=[example_id]",
      "abbreviation" : "Gene3D"
   },
   "um-bbd_enzymeid" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "UM-BBD_enzymeID",
      "url_syntax" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=ep&enzymeID=[example_id]",
      "generic_url" : "http://umbbd.msi.umn.edu/",
      "object" : "Enzyme identifier",
      "url_example" : "http://umbbd.msi.umn.edu/servlets/pageservlet?ptype=ep&enzymeID=e0230",
      "database" : "University of Minnesota Biocatalysis/Biodegradation Database",
      "name" : null,
      "fullname" : null,
      "example_id" : "UM-BBD_enzymeID:e0413"
   },
   "wikipedia" : {
      "url_syntax" : "http://en.wikipedia.org/wiki/[example_id]",
      "abbreviation" : "Wikipedia",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "example_id" : "Wikipedia:Endoplasmic_reticulum",
      "fullname" : null,
      "name" : null,
      "database" : "Wikipedia",
      "url_example" : "http://en.wikipedia.org/wiki/Endoplasmic_reticulum",
      "object" : "Page Reference Identifier",
      "generic_url" : "http://en.wikipedia.org/"
   },
   "ncbi_locus_tag" : {
      "abbreviation" : "NCBI_locus_tag",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "NCBI_locus_tag:CTN_0547",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "object" : "Identifier",
      "url_example" : null,
      "database" : "NCBI locus tag",
      "name" : null
   },
   "eco" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "abbreviation" : "ECO",
      "url_example" : null,
      "object" : "Identifier",
      "database" : "Evidence Code ontology",
      "name" : null,
      "generic_url" : "http://www.geneontology.org/",
      "fullname" : null,
      "example_id" : "ECO:0000002",
      "local_id_syntax" : "^\\d{7}$"
   },
   "agi_locuscode" : {
      "entity_type" : "SO:0000704 ! gene",
      "name" : null,
      "object" : "Locus identifier",
      "abbreviation" : "AGI_LocusCode",
      "datatype" : null,
      "local_id_syntax" : "^AT[MC0-5]G[0-9]{5}(\\.[0-9]{1})?$",
      "example_id" : "AGI_LocusCode:At2g17950",
      "description" : "Comprises TAIR, TIGR and MIPS",
      "fullname" : null,
      "!url_syntax" : "http://www.tigr.org/tigr-scripts/euk_manatee/shared/ORF_infopage.cgi?db=ath1&orf=[example_id]",
      "generic_url" : "http://www.arabidopsis.org",
      "database" : "Arabidopsis Genome Initiative",
      "url_example" : "http://arabidopsis.org/servlets/TairObject?type=locus&name=At2g17950",
      "url_syntax" : "http://arabidopsis.org/servlets/TairObject?type=locus&name=[example_id]",
      "!url_example" : "http://www.tigr.org/tigr-scripts/euk_manatee/shared/ORF_infopage.cgi?db=ath1&orf=At2g17950",
      "id" : null,
      "uri_prefix" : null
   },
   "biopixie_mefit" : {
      "generic_url" : "http://pixie.princeton.edu/pixie/",
      "url_example" : null,
      "database" : "biological Process Inference from eXperimental Interaction Evidence/Microarray Experiment Functional Integration Technology",
      "object" : null,
      "name" : null,
      "fullname" : null,
      "example_id" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "bioPIXIE_MEFIT",
      "url_syntax" : null
   },
   "jcvi_cmr" : {
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "JCVI_CMR",
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=[example_id]",
      "generic_url" : "http://cmr.jcvi.org/",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=VCA0557",
      "object" : "Locus",
      "database" : "Comprehensive Microbial Resource at the J. Craig Venter Institute",
      "name" : null,
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "example_id" : "JCVI_CMR:VCA0557"
   },
   "enzyme" : {
      "abbreviation" : "ENZYME",
      "url_syntax" : "http://www.expasy.ch/cgi-bin/nicezyme.pl?[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "fullname" : null,
      "example_id" : "ENZYME:EC 1.1.1.1",
      "generic_url" : "http://www.expasy.ch/",
      "object" : "Identifier",
      "url_example" : "http://www.expasy.ch/cgi-bin/nicezyme.pl?1.1.1.1",
      "database" : "Swiss Institute of Bioinformatics enzyme database",
      "name" : null
   },
   "uniprot" : {
      "fullname" : null,
      "example_id" : "UniProtKB:P51587",
      "description" : "A central repository of protein sequence and function created by joining the information contained in Swiss-Prot, TrEMBL, and PIR database",
      "local_id_syntax" : "^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z]([0-9][A-Z][A-Z0-9]{2}){1,2}[0-9])((-[0-9]+)|:PRO_[0-9]{10}|:VAR_[0-9]{6}){0,1}$",
      "entity_type" : "PR:000000001 ! protein ",
      "database" : "Universal Protein Knowledgebase",
      "object" : "Accession",
      "url_example" : "http://www.uniprot.org/uniprot/P51587",
      "name" : null,
      "generic_url" : "http://www.uniprot.org",
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "abbreviation" : "UniProt",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "pubchem_substance" : {
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pcsubstance&term=[example_id]",
      "abbreviation" : "PubChem_Substance",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "example_id" : "PubChem_Substance:4594",
      "local_id_syntax" : "^[0-9]{4,}$",
      "entity_type" : "CHEBI:24431 ! chemical entity",
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/query.fcgi?CMD=search&DB=pcsubstance&term=4594",
      "database" : "NCBI PubChem database of chemical substances",
      "object" : "Identifier",
      "name" : null,
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/"
   },
   "gr" : {
      "example_id" : "GR:sd1",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "local_id_syntax" : "^[A-Z][0-9][A-Z0-9]{3}[0-9]$",
      "name" : null,
      "database: Gramene" : "A Comparative Mapping Resource for Grains",
      "object" : "Identifier (any)",
      "url_example" : "http://www.gramene.org/db/searches/browser?search_type=All&RGN=on&query=sd1",
      "database" : null,
      "generic_url" : "http://www.gramene.org/",
      "url_syntax" : "http://www.gramene.org/db/searches/browser?search_type=All&RGN=on&query=[example_id]",
      "abbreviation" : "GR",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null
   },
   "aracyc" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.arabidopsis.org:1555/ARA/NEW-IMAGE?type=NIL&object=[example_id]",
      "abbreviation" : "AraCyc",
      "database" : "AraCyc metabolic pathway database for Arabidopsis thaliana",
      "url_example" : "http://www.arabidopsis.org:1555/ARA/NEW-IMAGE?type=NIL&object=PWYQT-62",
      "object" : "Identifier",
      "name" : null,
      "generic_url" : "http://www.arabidopsis.org/biocyc/index.jsp",
      "fullname" : null,
      "example_id" : "AraCyc:PWYQT-62"
   },
   "tigr_pfa1" : {
      "name" : null,
      "object" : "Accession",
      "database" : "Plasmodium falciparum database at the J. Craig Venter Institute",
      "url_example" : null,
      "generic_url" : "http://www.tigr.org/tdb/e2k1/pfa1/pfa1.shtml",
      "example_id" : "JCVI_Pfa1:PFB0010w",
      "fullname" : null,
      "uri_prefix" : null,
      "is_obsolete" : "true",
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "abbreviation" : "TIGR_Pfa1"
   },
   "ddanat" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : null,
      "abbreviation" : "DDANAT",
      "object" : "Identifier",
      "url_example" : null,
      "database" : "Dictyostelium discoideum anatomy",
      "name" : null,
      "generic_url" : "http://dictybase.org/Dicty_Info/dicty_anatomy_ontology.html",
      "fullname" : null,
      "example_id" : "DDANAT:0000068",
      "local_id_syntax" : "[0-9]{7}",
      "entity_type" : "UBERON:0001062 ! anatomical entity"
   },
   "rgd" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=[example_id]",
      "abbreviation" : "RGD",
      "name" : null,
      "database" : "Rat Genome Database",
      "url_example" : "http://rgd.mcw.edu/generalSearch/RgdSearch.jsp?quickSearch=1&searchKeyword=2004",
      "object" : "Accession",
      "generic_url" : "http://rgd.mcw.edu/",
      "example_id" : "RGD:2004",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^[0-9]{4,7}$"
   },
   "aspgd_locus" : {
      "url_syntax" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "abbreviation" : "AspGD_LOCUS",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "fullname" : null,
      "example_id" : "AspGD_LOCUS:AN10942",
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "url_example" : "http://www.aspergillusgenome.org/cgi-bin/locus.pl?locus=AN10942",
      "database" : "Aspergillus Genome Database",
      "name" : null,
      "generic_url" : "http://www.aspergillusgenome.org/"
   },
   "dflat" : {
      "abbreviation" : "DFLAT",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "fullname" : null,
      "generic_url" : "http://bcb.cs.tufts.edu/dflat/",
      "name" : null,
      "url_example" : null,
      "object" : null,
      "database" : "Developmental FunctionaL Annotation at Tufts"
   },
   "prosite" : {
      "entity_type" : "SO:0000839 ! polypeptide region",
      "fullname" : null,
      "example_id" : "Prosite:PS00365",
      "generic_url" : "http://www.expasy.ch/prosite/",
      "url_example" : "http://www.expasy.ch/cgi-bin/prosite-search-ac?PS00365",
      "database" : "Prosite database of protein families and domains",
      "object" : "Accession",
      "name" : null,
      "abbreviation" : "Prosite",
      "url_syntax" : "http://www.expasy.ch/cgi-bin/prosite-search-ac?[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null
   },
   "jcvi_pfa1" : {
      "generic_url" : "http://www.tigr.org/tdb/e2k1/pfa1/pfa1.shtml",
      "url_example" : null,
      "object" : "Accession",
      "database" : "Plasmodium falciparum database at the J. Craig Venter Institute",
      "name" : null,
      "fullname" : null,
      "example_id" : "JCVI_Pfa1:PFB0010w",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "is_obsolete" : "true",
      "abbreviation" : "JCVI_Pfa1",
      "url_syntax" : null
   },
   "uniprotkb/trembl" : {
      "object" : "Accession",
      "database" : "UniProtKB-TrEMBL protein sequence database",
      "url_example" : "http://www.uniprot.org/uniprot/O31124",
      "name" : null,
      "generic_url" : "http://www.uniprot.org",
      "replaced_by" : "UniProtKB",
      "fullname" : null,
      "description" : "UniProtKB-TrEMBL, a computer-annotated protein sequence database supplementing UniProtKB and containing the translations of all coding sequences (CDS) present in the EMBL Nucleotide Sequence Database but not yet integrated in UniProtKB/Swiss-Prot",
      "example_id" : "TrEMBL:O31124",
      "uri_prefix" : null,
      "is_obsolete" : "true",
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.uniprot.org/uniprot/[example_id]",
      "abbreviation" : "UniProtKB/TrEMBL"
   },
   "omssa" : {
      "name" : null,
      "url_example" : null,
      "object" : null,
      "database" : "Open Mass Spectrometry Search Algorithm",
      "generic_url" : "http://pubchem.ncbi.nlm.nih.gov/omssa/",
      "example_id" : null,
      "fullname" : null,
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "abbreviation" : "OMSSA"
   },
   "nasc_code" : {
      "url_syntax" : "http://seeds.nottingham.ac.uk/NASC/stockatidb.lasso?code=[example_id]",
      "abbreviation" : "NASC_code",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "fullname" : null,
      "example_id" : "NASC_code:N3371",
      "url_example" : "http://seeds.nottingham.ac.uk/NASC/stockatidb.lasso?code=N3371",
      "object" : "NASC code Identifier",
      "database" : "Nottingham Arabidopsis Stock Centre Seeds Database",
      "name" : null,
      "generic_url" : "http://arabidopsis.info"
   },
   "bhf-ucl" : {
      "url_syntax" : null,
      "abbreviation" : "BHF-UCL",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "description" : "The Cardiovascular Gene Ontology Annotation Initiative is supported by the British Heart Foundation (BHF) and located at University College London (UCL).",
      "example_id" : null,
      "fullname" : null,
      "name" : null,
      "database" : "Cardiovascular Gene Ontology Annotation Initiative",
      "url_example" : null,
      "object" : null,
      "generic_url" : "http://www.ucl.ac.uk/cardiovasculargeneontology/"
   },
   "phi" : {
      "example_id" : "PHI:0000055",
      "fullname" : null,
      "generic_url" : "http://aclame.ulb.ac.be/Classification/mego.html",
      "name" : null,
      "object" : null,
      "url_example" : null,
      "database" : "MeGO (Phage and Mobile Element Ontology)",
      "abbreviation" : "PHI",
      "url_syntax" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null
   },
   "eck" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.ecogene.org/geneInfo.php?eck_id=[example_id]",
      "abbreviation" : "ECK",
      "name" : null,
      "url_example" : "http://www.ecogene.org/geneInfo.php?eck_id=ECK3746",
      "database" : "EcoGene Database of Escherichia coli Sequence and Function",
      "object" : "ECK accession (E. coli K-12 gene identifier)",
      "generic_url" : "http://www.ecogene.org/",
      "example_id" : "ECK:ECK3746",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^ECK[0-9]{4}$"
   },
   "ncbi_gp" : {
      "url_example" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=protein&val=EAL72968",
      "database" : "NCBI GenPept",
      "object" : "Protein identifier",
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "fullname" : null,
      "example_id" : "NCBI_GP:EAL72968",
      "local_id_syntax" : "^[A-Z]{3}[0-9]{5}(\\.[0-9]+)?$",
      "entity_type" : "PR:000000001 ! protein",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/entrez/viewer.fcgi?db=protein&val=[example_id]",
      "abbreviation" : "NCBI_GP"
   },
   "cas_gen" : {
      "database" : "Catalog of Fishes genus database",
      "url_example" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=1040",
      "object" : "Identifier",
      "name" : null,
      "generic_url" : "http://research.calacademy.org/research/ichthyology/catalog/fishcatsearch.html",
      "fullname" : null,
      "example_id" : "CASGEN:1040",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://research.calacademy.org/research/ichthyology/catalog/getname.asp?rank=Genus&id=[example_id]",
      "abbreviation" : "CAS_GEN"
   },
   "uniprotkb-subcell" : {
      "generic_url" : "http://www.uniprot.org/locations/",
      "name" : null,
      "object" : "Identifier",
      "url_example" : "http://www.uniprot.org/locations/SL-0012",
      "database" : "UniProt Knowledgebase Subcellular Location vocabulary",
      "example_id" : "UniProtKB-SubCell:SL-0012",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "UniProtKB-SubCell",
      "url_syntax" : "http://www.uniprot.org/locations/[example_id]"
   },
   "superfamily" : {
      "url_syntax" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/cgi-bin/scop.cgi?ipid=SSF[example_id]",
      "abbreviation" : "SUPERFAMILY",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "description" : "A database of structural and functional protein annotations for completely sequenced genomes",
      "example_id" : "SUPERFAMILY:51905",
      "fullname" : null,
      "name" : null,
      "url_example" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/cgi-bin/scop.cgi?ipid=SSF51905",
      "database" : "SUPERFAMILY protein annotation database",
      "object" : "Accession",
      "generic_url" : "http://supfam.cs.bris.ac.uk/SUPERFAMILY/index.html"
   },
   "ncbitaxon" : {
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=[example_id]",
      "abbreviation" : "NCBITaxon",
      "database" : "NCBI Taxonomy",
      "url_example" : "http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3702",
      "object" : "Identifier",
      "name" : null,
      "generic_url" : "http://www.ncbi.nlm.nih.gov/Taxonomy/taxonomyhome.html/",
      "fullname" : null,
      "example_id" : "taxon:7227"
   },
   "roslin_institute" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : null,
      "abbreviation" : "Roslin_Institute",
      "url_example" : null,
      "database" : "Roslin Institute",
      "object" : null,
      "name" : null,
      "generic_url" : "http://www.roslin.ac.uk/",
      "fullname" : null,
      "example_id" : null
   },
   "uberon" : {
      "abbreviation" : "UBERON",
      "url_syntax" : "http://purl.obolibrary.org/obo/UBERON_[example_id]",
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "entity_type" : "UBERON:0001062 ! anatomical entity",
      "local_id_syntax" : "^[0-9]{7}$",
      "example_id" : "URBERON:0002398",
      "description" : "A multi-species anatomy ontology",
      "fullname" : null,
      "generic_url" : "http://uberon.org",
      "name" : null,
      "object" : "Identifier",
      "url_example" : "http://purl.obolibrary.org/obo/UBERON_0002398",
      "database" : "Uber-anatomy ontology"
   },
   "bfo" : {
      "database" : "Basic Formal Ontology",
      "url_example" : "http://purl.obolibrary.org/obo/BFO_0000066",
      "object" : null,
      "name" : null,
      "generic_url" : "http://purl.obolibrary.org/obo/bfo",
      "fullname" : null,
      "example_id" : "BFO:0000066",
      "description" : "An upper ontology used by Open Bio Ontologies (OBO) Foundry. BFO contains upper-level classes as well as core relations such as part_of (BFO_0000050)",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://purl.obolibrary.org/obo/BFO_[example_id]",
      "abbreviation" : "BFO"
   },
   "mitre" : {
      "generic_url" : "http://www.mitre.org/",
      "name" : null,
      "url_example" : null,
      "object" : null,
      "database" : "The MITRE Corporation",
      "example_id" : null,
      "fullname" : null,
      "datatype" : null,
      "id" : null,
      "uri_prefix" : null,
      "abbreviation" : "MITRE",
      "url_syntax" : null
   },
   "cgd" : {
      "generic_url" : "http://www.candidagenome.org/",
      "name" : null,
      "database" : "Candida Genome Database",
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=CAL0005516",
      "object" : "Identifier for CGD Loci",
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^(CAL|CAF)[0-9]{7}$",
      "example_id" : "CGD:CAL0005516",
      "fullname" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "CGD",
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?dbid=[example_id]"
   },
   "echobase" : {
      "example_id" : "EchoBASE:EB0231",
      "fullname" : null,
      "entity_type" : "SO:0000704 ! gene",
      "local_id_syntax" : "^EB[0-9]{4}$",
      "name" : null,
      "database" : "EchoBASE post-genomic database for Escherichia coli",
      "url_example" : "http://www.biolws1.york.ac.uk/echobase/Gene.cfm?recordID=EB0231",
      "object" : "Identifier",
      "generic_url" : "http://www.ecoli-york.org/",
      "url_syntax" : "http://www.biolws1.york.ac.uk/echobase/Gene.cfm?recordID=[example_id]",
      "abbreviation" : "EchoBASE",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null
   },
   "cog_cluster" : {
      "example_id" : "COG_Cluster:COG0001",
      "fullname" : null,
      "name" : null,
      "object" : "Identifier",
      "url_example" : "http://www.ncbi.nlm.nih.gov/COG/new/release/cow.cgi?cog=COG0001",
      "database" : "NCBI COG cluster",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/COG/",
      "url_syntax" : "http://www.ncbi.nlm.nih.gov/COG/new/release/cow.cgi?cog=[example_id]",
      "abbreviation" : "COG_Cluster",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null
   },
   "tigr_cmr" : {
      "name" : null,
      "object" : "Locus",
      "database" : "Comprehensive Microbial Resource at the J. Craig Venter Institute",
      "url_example" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=VCA0557",
      "generic_url" : "http://cmr.jcvi.org/",
      "example_id" : "JCVI_CMR:VCA0557",
      "fullname" : null,
      "entity_type" : "PR:000000001 ! protein",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://cmr.jcvi.org/cgi-bin/CMR/shared/GenePage.cgi?locus=[example_id]",
      "abbreviation" : "TIGR_CMR"
   },
   "tc" : {
      "abbreviation" : "TC",
      "url_syntax" : "http://www.tcdb.org/tcdb/index.php?tc=[example_id]",
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "entity_type" : "PR:000000001 ! protein",
      "fullname" : null,
      "example_id" : "TC:9.A.4.1.1",
      "generic_url" : "http://www.tcdb.org/",
      "url_example" : "http://www.tcdb.org/tcdb/index.php?tc=9.A.4.1.1",
      "database" : "Transport Protein Database",
      "object" : "Identifier",
      "name" : null
   },
   "yeastfunc" : {
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "abbreviation" : "YeastFunc",
      "url_syntax" : null,
      "generic_url" : "http://func.med.harvard.edu/yeast/",
      "url_example" : null,
      "database" : "Yeast Function",
      "object" : null,
      "name" : null,
      "fullname" : null,
      "example_id" : null
   },
   "cgd_locus" : {
      "database" : "Candida Genome Database",
      "url_example" : "http://www.candidagenome.org/cgi-bin/locus.pl?locus=HWP1",
      "object" : "Gene name (gene symbol in mammalian nomenclature)",
      "name" : null,
      "generic_url" : "http://www.candidagenome.org/",
      "fullname" : null,
      "example_id" : "CGD_LOCUS:HWP1",
      "uri_prefix" : null,
      "datatype" : null,
      "id" : null,
      "url_syntax" : "http://www.candidagenome.org/cgi-bin/locus.pl?locus=[example_id]",
      "abbreviation" : "CGD_LOCUS"
   },
   "jcvi_medtr" : {
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "url_syntax" : "http://medicago.jcvi.org/cgi-bin/medicago/search/shared/ORF_infopage.cgi?orf=[example_id]",
      "abbreviation" : "JCVI_Medtr",
      "url_example" : "http://medicago.jcvi.org/cgi-bin/medicago/search/shared/ORF_infopage.cgi?orf=Medtr5g024510",
      "database" : "Medicago truncatula genome database at the J. Craig Venter Institute ",
      "object" : "Accession",
      "name" : null,
      "generic_url" : "http://medicago.jcvi.org/cgi-bin/medicago/overview.cgi",
      "fullname" : null,
      "example_id" : "JCVI_Medtr:Medtr5g024510"
   },
   "ncbi_nm" : {
      "abbreviation" : "NCBI_NM",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "is_obsolete" : "true",
      "fullname" : null,
      "replaced_by" : "RefSeq",
      "example_id" : "NCBI_NM:123456",
      "generic_url" : "http://www.ncbi.nlm.nih.gov/",
      "object" : "mRNA identifier",
      "url_example" : null,
      "database" : "NCBI RefSeq",
      "name" : null
   },
   "ensembl_transcriptid" : {
      "url_syntax" : "http://www.ensembl.org/id/[example_id]",
      "abbreviation" : "ENSEMBL_TranscriptID",
      "uri_prefix" : null,
      "id" : null,
      "datatype" : null,
      "fullname" : null,
      "example_id" : "ENSEMBL_TranscriptID:ENST00000371959",
      "local_id_syntax" : "^ENST[0-9]{9,16}$",
      "entity_type" : "SO:0000673 ! transcript",
      "url_example" : "http://www.ensembl.org/id/ENST00000371959",
      "object" : "Transcript identifier",
      "database" : "Ensembl database of automatically annotated genomic data",
      "name" : null,
      "generic_url" : "http://www.ensembl.org/"
   },
   "gorel" : {
      "abbreviation" : "GOREL",
      "url_syntax" : null,
      "id" : null,
      "datatype" : null,
      "uri_prefix" : null,
      "example_id" : null,
      "description" : "Additional relations pending addition into RO",
      "fullname" : null,
      "generic_url" : "http://purl.obolibrary.org/obo/ro",
      "name" : null,
      "url_example" : null,
      "database" : "GO Extensions to OBO Relation Ontology Ontology",
      "object" : null
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
