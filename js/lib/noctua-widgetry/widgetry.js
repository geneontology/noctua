/**
 * Namespace for large drawing routines. Experimenting with starting
 * to pull some of bbopx.noctua.widgets and bbopx.noctua(.context) out
 * into the open.
 *
 * @module noctua-widgetry
 */

// Let jshint pass over over our external globals (browserify takes
// care of it all).
/* global jQuery */
/* global global_sparql_templates_named */

// Code here will be ignored by JSHint, as we are technically
// "redefining" jQuery (although we are not).
/* jshint ignore:start */
var jQuery = require('jquery');
/* jshint ignore:end */

var us = require('underscore');
var bbop_core = require('bbop-core');
var bbop = require('bbop').bbop; // for html, etc.
var minerva_requests = require('minerva-requests');
var class_expression = require('class-expression');

// To be used for SPARQL actions originating in widgets.
var response_json = require('bbop-rest-response').json;
var jquery_engine = require('bbop-rest-manager').jquery;
var sparql_manager = require('bbop-manager-sparql');

// Underscore aliases.
var each = us.each;

/**
 * "Static" function.
 *
 * For the time being, the cannonical way of building a link with a
 * token.
 */
function build_token_link(url, token){
    var new_url = url;
    
    if( token ){
	if( new_url.indexOf('?') === -1 ){
	    new_url = new_url + '?' + 'barista_token=' + token;
	}else{
	    new_url = new_url + '&' + 'barista_token=' + token;
	}
    }
    
    return new_url;
}

/**
 * Add edit model node contents to a descriptive table.
 */
function repaint_info(ecore, aid, info_div){

    // Node and edge counts.
    var nds = us.keys(ecore.get_nodes()) || [];
    var eds = us.keys(ecore.all_edges()) || [];
    
    // Any annotation information that came in.
    var anns = '';
    each(ecore.annotations(), function(ann){
	// if( ann.key() === 'comment' && ann.value() ){
	//     anns += '<dd>' + '<small><strong>comment</strong></small> ' +
	// 	ann.value() + '</dd>';
	// }
	var okay_annotations = {
	    'state' : true,
	    'date' : true,
	    'title' : true,
	    'contributor' : true,
	    'comment' : true
	};
	if( okay_annotations[ann.key()] && ann.value() ){
	    anns += '<dd>' + '<small><strong>' +
		ann.key() + '</strong></small> ' +
		ann.value() + '</dd>';
	}
    });
    if( anns === '' ){
	anns = '<dd>none</dd>';
    }

    // Try and get a title out of the model.
    var mtitle = '??? (title)';
    var tanns = ecore.get_annotations_by_key('title');
    if( tanns && tanns.length === 1 ){ mtitle = tanns[0].value(); }

    var str_cache = [
	'<dl class="dl-horizontal">',
	// '<dt></dt>',
	// '<dd>',
	// '</dd>',
	'<dt>ID</dt>',
	'<dd>',
	ecore.get_id(),
	'</dd>',
	'<dt>Name</dt>',
	'<dd>',
	mtitle,
	'</dd>',
	'<dt>Individuals</dt>',
	'<dd>',
	nds.length || 0,
	'</dd>',
	'<dt>Indv. Rels.</dt>',
	'<dd>',
	eds.length || 0,
	'</dd>',
	'<dt>Annotations</dt>',
	anns
    ];
    
    // Add to display.
    jQuery(info_div).empty();
     jQuery(info_div).append(str_cache.join(' '));
}

/*
 * Function: repaint_exp_table
 *
 * Add edit model node contents to a descriptive table.
 */
function repaint_exp_table(ecore, aid, table_div){

    // First, lets get the headers that we'll need by poking the
    // model and getting all of the possible categories.	
    var cat_list = [];
    each(ecore.get_nodes(), function(enode, enode_id){
	each(enode.types(), function(in_type){
	    cat_list.push(in_type.category());
	});
    });
    // Dedupe list.
    var tmph = bbop_core.hashify(cat_list);
    cat_list = us.keys(tmph);

    // If we actually got something, render the table. Otherwise,
    // a message.
    if( us.isEmpty(cat_list) ){
	
	// Add to display.
	jQuery(table_div).empty();
	jQuery(table_div).append('<p><h4>no instances</h4></p>');

    }else{
	
	// Sort header list according to known priorities.
	cat_list = cat_list.sort(function(a, b){
	    return aid.priority(b) - aid.priority(a);
	});
	
	// Convert the ids into readable headers.
	var nav_tbl_headers = [];
	each(cat_list, function(cat_id){
	    var hdrc = [
		aid.readable(cat_id),
		'&uarr;&darr;'
	    ];
	    nav_tbl_headers.push(hdrc.join(' '));
	});
	
	var nav_tbl =
	    new bbop.html.table(nav_tbl_headers, [],
				{'generate_id': true,
				 'class': ['table', 'table-bordered',
					   'table-hover',
					   'table-condensed'].join(' ')});
	
	//each(ecore.get_nodes(),
	each(ecore.edit_node_order(), function(enode_id){
	    var enode = ecore.get_node(enode_id);
	    
	    // Now that we have an enode, we want to mimic the order
	    // that we created for the header (cat_list). Start by
	    // binning the types.
	    var bin = {};
	    each(enode.types(), function(in_type){
		var cat = in_type.category();
		if( ! bin[cat] ){ bin[cat] = []; }
		bin[cat].push(in_type);
	    });
	    
	    // Now unfold the binned types into the table row
	    // according to the sorted order.
	    var table_row = [];
	    each(cat_list, function(cat_id){
		var accumulated_types = bin[cat_id];
		var cell_cache = [];
		each(accumulated_types, function(atype){
		    var tt = type_to_span(atype, aid);
		    cell_cache.push(tt);
		});
		table_row.push(cell_cache.join('<br />'));
	    });
	    nav_tbl.add_to(table_row);		     
	});
	
	// Add to display.
	jQuery(table_div).empty();
	jQuery(table_div).append(nav_tbl.to_string());

	// Make it sortable using the plugin.
	jQuery('#' + nav_tbl.get_id()).tablesorter(); 
    }
}

/**
 * Add edit model edge contents to a descriptive table.
 */
function repaint_edge_table(ecore, aid, table_div){

    var edge_list = ecore.all_edges();

    // If we actually got something, render the table. Otherwise,
    // a message.
    if( us.isEmpty(edge_list) ){
	
	// Add to display.
	jQuery(table_div).empty();
	jQuery(table_div).append('<p><h4>no relations</h4></p>');

    }else{
	
	// Make the (obvjously known) headers pretty.
	var nav_tbl_headers = [];
	each(['subject', 'relation', 'object'], function(hdr){
	    var hdrc = [
		hdr,
		'&uarr;&darr;'
	    ];
	    nav_tbl_headers.push(hdrc.join(' '));
	});
		
	var nav_tbl =
	    new bbop.html.table(nav_tbl_headers, [],
				{'generate_id': true,
				 'class': ['table', 'table-bordered',
					   'table-hover',
					   'table-condensed'].join(' ')});
	
	each(edge_list, function(edge){
	    var s = edge.source();
	    var r = edge.relation();
	    var t = edge.target();

	    // according to the sorted order.
	    var table_row = [
		aid.readable(s),
		aid.readable(r),
		aid.readable(t)
	    ];
	    
	    nav_tbl.add_to(table_row);		     
	});
	
	// Add to display.
	jQuery(table_div).empty();
	jQuery(table_div).append(nav_tbl.to_string());

	// Make it sortable using the plugin.
	jQuery('#' + nav_tbl.get_id()).tablesorter(); 
    }
}

/**
 * Wipe out the contents of a jQuery-identified div.
 */
function wipe(div){
    jQuery(div).empty();
}

/**
 * Takes a core edit node types as the argument, categorize the, order
 * them.
 */
function enode_types_to_ordered_stack(enode_types, aid){
	
    // Sort the types within the stack according to the known
    // type priorities.
    function _sorter(a, b){
	// Use aid property priority.
	var bpri = aid.priority(b.property_id());
	var apri = aid.priority(a.property_id());
	return apri - bpri;
    }

    // 
    var out_stack = enode_types.sort(_sorter);
    return out_stack;
}
    
/**
 * This is a silly little object that represents a node stack. It can
 * render the stack as a string (the original non-object purpose of
 * this little bit of code) and manager to relay the relation between
 * random DOM IDs and underlying edges (the reason it was turned into
 * an object).
 *
 * This change was made to make it possible to allow the evidence to
 * be clicked on in the display and the edge annotation dialog (with
 * the accompanying evidence) to come up for editing.
 *
 * This whole bit will change a lot with new evidence coming down the
 * pipe.
 */
function node_stack_object(enode, aid){

    var hook_list = [];
    
    // Create a colorful label stack into an individual table.
    var enode_stack_table = new bbop.html.tag('table',
					      {'class':'bbop-mme-stack-table'});

    // General function for adding type information to stack.
    function _add_table_row(item, color, prefix, suffix){
	//var rep_color = aid.color(item.category());
	var out_rep = type_to_span(item, color);
	//console.log('type_to_span' + type_to_span);
	if( prefix ){ out_rep = prefix + out_rep; }
	if( suffix ){ out_rep = out_rep + suffix; }
	var trstr = null;
	if( color ){
	    trstr = '<tr class="bbop-mme-stack-tr" ' +
		'style="background-color: ' + color +
		';"><td class="bbop-mme-stack-td">' + out_rep + '</td></tr>';   
	}else{
	    trstr = '<tr class="bbop-mme-stack-tr">' +
		'<td class="bbop-mme-stack-td">' + out_rep + '</td></tr>';   
	}
	enode_stack_table.add_to(trstr);
    }

    // Inferred types first.
    var inf_types = enode.get_unique_inferred_types();
    each(inf_types, function(item){ _add_table_row(item, null, '[', ']'); });
    // Editable types next.
    var std_types = enode.types();
    each(std_types, function(item){ _add_table_row(item); });

    // Now we trick our way through to adding the types^H^H^H^H^H
    // absorbed subgraph nodes of the subgraphs.
    var subgraph = enode.subgraph();
    if( subgraph ){

	// Gather the stack to display, abstractly do go up or down
	// the subgraph.
	var _folded_stack_gather = function(direction){

	    // First, get the parent/child sub-nodes.
	    var x_edges = [];
	    if( direction === 'standard' ){
		x_edges = subgraph.get_parent_edges(enode.id());
	    }else{
		x_edges = subgraph.get_child_edges(enode.id());
	    }
	    // Put an order on the edges.
	    x_edges.sort(function(e1, e2){
		return aid.priority(e1.relation()) - aid.priority(e2.relation());
	    });
	    each(x_edges, function(x_edge){
		// Edge info.
		var rel = x_edge.relation() || 'n/a';
		var rel_color = aid.color(rel);
		var rel_readable = aid.readable(rel);
		// If context aid doesn't work, see if it comes with a label.
		if( rel_readable === rel && typeof(x_edge.label) === 'function'){
		    var label_rn = x_edge.label();
		    if( label_rn !== rel ){
			rel = label_rn; // use label
		    }
		}else{
		    rel = rel_readable; // use context
		}

		// Try and extract proof of evidence.
		var ev_edge_anns = x_edge.get_annotations_by_key('evidence');
		// Get node.
		var x_ent_id = null;
		if( direction === 'standard' ){
		    x_ent_id = x_edge.object_id();
		}else{
		    x_ent_id = x_edge.subject_id();
		}
		var x_node = subgraph.get_node(x_ent_id);
		// Try and extract proof of evidence.
		if( x_node ){
		    var ev_node_anns = x_node.get_annotations_by_key('evidence');

		    // Add the edge/node combos to the table.
		    each(x_node.types(), function(x_type){

			//
			var elt_id = bbop_core.uuid();
			var edge_id = x_edge.id();
			hook_list.push([edge_id, elt_id]);
			if( ev_edge_anns.length > 0 ){
			    // In this case (which should be the only possible
			    // case), we'll capture the ID and pair it with an
			    // ID.
			    _add_table_row(x_type, rel_color, rel + '(',
					   ')<sup id="'+elt_id+'"><span class="bbop-noctua-embedded-evidence-symbol-with">E</button></sup>');
			}else{
			    _add_table_row(x_type, rel_color, rel + '(',
					   ')<sup id="'+elt_id+'"><span class="bbop-noctua-embedded-evidence-symbol-without">&nbsp;</button></sup>');
			}
		    });
		}
	    });
	};

	// Do it both ways--upstream and downstream.
	_folded_stack_gather('standard');
	_folded_stack_gather('reverse');

    }

    // Inject meta-information if extant.
    var anns = enode.annotations();
    if( anns.length !== 0 ){

	// Meta counts.
	var n_ev = 0;
	var n_other = 0;
	each(anns, function(ann){
	    if( ann.key() === 'evidence' ){
		n_ev++;
	    }else{
		if( ann.key() !== 'hint-layout-x' &&
		    ann.key() !== 'hint-layout-y' ){
		    n_other++;
		}
	    }
	});

	// Add to top. No longer need evidence count on individuals.
	var trstr = '<tr class="bbop-mme-stack-tr">' +
		'<td class="bbop-mme-stack-td"><small style="color: grey;">' +
		//'evidence: ' + n_ev + '; other: ' + n_other + 
		'annotations: ' + n_other + 
		'</small></td></tr>';
	enode_stack_table.add_to(trstr);
    }
    
    // Add external visual cue if there were inferred types.
    if( inf_types.length > 0 ){
	var itcstr = '<tr class="bbop-mme-stack-tr">' +
	    '<td class="bbop-mme-stack-td"><small style="color: grey;">' +
	    'inferred types: ' + inf_types.length + '</small></td></tr>';
	enode_stack_table.add_to(itcstr);
    }

    // return enode_stack_table;
    this.to_string = function(){
	return enode_stack_table.to_string();
    };

    //
    this.hooks = function(){
	return hook_list;
    };
}

/**
 * Add a new enode, need a lot of extra junk to pass on to make
 * annotation editor work, by plugging into the node stack creation
 * object.
 */
function add_enode(annotation_config, ecore, manager, enode, aid, graph_div, left, top, gserv, gconf){

    // See whether or not we need to place the nodes with style.
    var style_str = '';
    if( left !== null && top !== null ){
	style_str = 'top: ' + top + 'px; ' + 'left: ' + left + 'px;';
    }
    //ll('style: ' + style_str);

    // Node as table nested into bbop.html div.
    var div_id = ecore.get_node_elt_id(enode.id());
    var w = new bbop.html.tag('div',
			      {'id': div_id,
			       'class': 'demo-window',
			       'style': style_str});
    
    var enode_stack_table = new node_stack_object(enode, aid);
    w.add_to(enode_stack_table.to_string());
    
    // Box to drag new connections from.	
    var konn = new bbop.html.tag('div', {'class': 'konn'});
    w.add_to(konn);
    
    // Box to click for edit dialog.
    var opend = new bbop.html.tag('button',
				  {'class': 'open-dialog btn btn-default',
				   'title': 'Open edit annoton dialog'});
    w.add_to(opend);
    
    // Box to open annotation dialog.
    var openann = new bbop.html.tag('button',
				    {'class':
				     'open-annotation-dialog btn btn-default',
				     'title': 'Open annotation dialog'});
    w.add_to(openann);
    
    // Add to display.
    jQuery(graph_div).append(w.to_string());

    // 
    each(enode_stack_table.hooks(), function(hook_pair){
	var edge_id = hook_pair[0];
	var element_id = hook_pair[1];
	jQuery('#'+element_id).click(function(evt){
	    evt.stopPropagation();
	    
	    var eam = edit_annotations_modal(annotation_config, ecore, manager,
					     edge_id, gserv, gconf);
	    eam.show();
	});
    });
}

/**
 * Update the displayed contents of an enode.
 */
function update_enode(ecore, enode, aid){

    // Node as table nested into bbop.html div.
    var uelt = ecore.get_node_elt_id(enode.id());
    jQuery('#' + uelt).empty();

    var enode_stack_table = new node_stack_object(enode, aid);
    jQuery('#' + uelt).append(enode_stack_table.to_string());
    
    // Box to drag new connections from.	
    var konn = new bbop.html.tag('div', {'class': 'konn'});
    jQuery('#' + uelt).append(konn.to_string());
    
    // Box to open the edit dialog.	
    var opend = new bbop.html.tag('button',
				  {'class': 'open-dialog btn btn-default',
				   'title': 'Open edit annoton dialog'});
    jQuery('#' + uelt).append(opend.to_string());

    // Box to open annotation dialog.
    var openann = new bbop.html.tag('button',
				    {'class':
				     'open-annotation-dialog btn btn-default',
				     'title': 'Open annotation dialog'});
    jQuery('#' + uelt).append(openann.to_string());
}

/**
 * Object.
 * 
 * The contained_modal is a simple modal dialog 
 * Node modal: invisible until it's not modal dialog.
 * 
 * NOTE: We're skipping some of the bbop.html stuff since we
 * specifically want BS3 stuff and not the jQuery-UI stuff that is
 * sometimes haning around in there.
 * 
 * arg_title may be null, string, or bbop.html
 * arg_body may be null, string, or bbop.html
 * 
 * @constructor
 */
function contained_modal(type, arg_title, arg_body){
    
    var shield_p = false;
    if( type && type === 'shield' ){
	shield_p = true;
    }else{
	// ???
    }

    // Define buttons first.
    var x_btn_args = {
	'type': 'button',
	'class': 'close',
	'data-dismiss': 'modal',
	'aria-hidden': 'true'
    };
    var x_btn = new bbop.html.tag('button', x_btn_args, '&times;');
    var close_btn_args = {
	'type': 'button',
	'class': 'btn btn-default',
	'data-dismiss': 'modal'
    };
    var close_btn = new bbop.html.tag('button', close_btn_args, 'Close');

    // Then the title.
    var title_args = {
	'generate_id': true,
	'class': 'modal-title'	
    };
    var title = new bbop.html.tag('div', title_args, arg_title);

    // One button and the title are in the header.
    var header_args = {
	'class': 'modal-header'
    };
    var header = null;
    if( shield_p ){
	header = new bbop.html.tag('div', header_args, title);
    }else{
	header = new bbop.html.tag('div', header_args, [x_btn, title]);
    }

    // The footer has the other button.
    var footer_args = {
	'generate_id': true,
	'class': 'modal-footer'
    };
    var footer = new bbop.html.tag('div', footer_args, close_btn);

    // Ready the body.
    var body_args = {
	'generate_id': true,
	'class': 'modal-body'	
    };
    var body = new bbop.html.tag('div', body_args, arg_body);

    // Content has header, body, and footer.
    var content_args = {
	'class': 'modal-content'
    };
    var content = null;
    if( shield_p ){
	content = new bbop.html.tag('div', content_args, [header,body]);
    }else{
	content = new bbop.html.tag('div', content_args, [header,body,footer]); 
    }

    // Dialog contains content.
    var dialog_args = {
	'class': 'modal-dialog'
    };
    var dialog = new bbop.html.tag('div', dialog_args, content); 
    
    // And the container contains it all.
    var container_args = {
	'generate_id': true,
	'class': 'modal fade',
	'tabindex': '-1',
	'role': 'dialog',
	'aria-labelledby': body.get_id(),
	'aria-hidden': 'true'
    };
    var container = new bbop.html.tag('div', container_args, dialog); 

    // Attach the assembly to the DOM.
    var modal_elt = '#' + container.get_id();
    jQuery('body').append(container.to_string());
    var modal_opts = {
    };
    if( shield_p ){
	modal_opts['backdrop'] = 'static';
	modal_opts['keyboard'] = false;
    }

    // Add destructor to hidden listener--clicking on the close with
    // eliminate this dialog from the DOM completely.
    jQuery(modal_elt).on('hidden.bs.modal',
			 function(){ jQuery(this).remove(); });

    // Add activities.
    // TODO

    ///
    /// Add external controls, etc.
    ///

    // To be used before show--add elements (as a string) to the main
    // modal DOM (which can have events attached).
    this.add_to_body = function(str){
	var add_to_elt = '#' + body.get_id();
	jQuery(add_to_elt).append(str);
    };
    
    // // To be used before show--add elements (as a string) to the main
    // // modal DOM (which can have events attached).
    // this.reset_footer = function(){
    // 	var add_to_elt = '#' + footer.get_id();
    // 	jQuery(add_to_elt).append(str);
    // };
    
    // To be used before show--add elements (as a string) to the main
    // modal DOM (which can have events attached).
    this.add_to_footer = function(str){
	var add_to_elt = '#' + footer.get_id();
	jQuery(add_to_elt).append(str);
    };
    
    //
    this.show = function(){
	jQuery(modal_elt).modal(modal_opts);	
    };
    
    //
    // Will end up destorying it since we are listening for the
    // "hidden" event above.
    this.destroy = function(){
	jQuery(modal_elt).modal('hide');
    };
}

/**
 * Contained blocking shield for general compute activity.
 * 
 * Function that returns object.
 * 
 * TODO: make subclass?
 * 
 * @constructor
 */ 
function compute_shield(){

    // Text.
    var p =
	new bbop.html.tag('p', {},
			  'Doing remote processing. This may take a minute...');

    // Progress bar.
    var pb_args = {
	'class': 'progress-bar',
	'role': 'progressbar',
	'aria-valuenow': '100',
	'aria-valuemin': '0',
	'aria-valuemax': '100',
	'style': 'width: 100%'
    };
    var pb = new bbop.html.tag('div', pb_args,
			       '<span class="sr-only">Working...</span>');
    var pb_container_args = {
	'class': 'progress progress-striped active'
    };
    var pb_container = new bbop.html.tag('div', pb_container_args, pb);

    var mdl = new contained_modal('shield', 'Relax', [p, pb_container]);
    return mdl;
}

/**
 * Function that returns a sorted relation list of the form [[id, label], ...]
 * 
 * Optional boost when we don't care using the boolean "relevant" field.
 * The boost is 10.
 * 
 * TODO: make subclass?
 */
function sorted_relation_list(relations, aid){
    
    var boost = 10;

    // Get a sorted list of known rels.
    //var rels = aid.all_entities();
    var rels = relations.sort(function(a,b){ 
	var id_a = a['id'];
	var id_b = b['id'];
	
	var pr_a = aid.priority(id_a);
	var pr_b = aid.priority(id_b);
	
	// Looking at the optional boolean "relevant" field, if we
	// showed no preference in our context, give these a
	// boost.
	if( pr_a === 0 && a['relevant'] ){ pr_a = boost; }
	if( pr_b === 0 && b['relevant'] ){ pr_b = boost; }
	
	return pr_b - pr_a;
    });
    var rellist = [];
    each(rels, function(rel){
	// We have the id.
	var r = [rel['id']];
	if( rel['label'] ){ // use their label
	    r.push(rel['label']);
	}else{ // otherwise, try readable
	    r.push(aid.readable(rel['id']));
	}
	rellist.push(r);
    });

    return rellist;
}

/**
 * Contained shield for creating new edges between nodes.
 * 
 * Function that returns object.
 * 
 * TODO: make subclass?
 *
 * @constructor
 */
function add_edge_modal(ecore, manager, relations, aid, source_id, target_id){

    // Get a sorted list of known rels.
    var rellist = sorted_relation_list(relations, aid);
    
    // Preamble.
    var mebe = [
	// '<h4>Relation selection</h4>',
	'<b>Edge source:</b>',
	source_id,
	'<br />',
	'<b>Edge target:</b>',
	target_id
    ];

    // Randomized radio.
    var radio_name = bbop_core.uuid();

    // Hard-code tree from
    // https://github.com/geneontology/noctua/issues/165 as temporary
    // relief.
    function _fuse(rel_name, rel_id, radio_name, lvl, first_p){

	// Main.
	var str = '<label style="margin-bottom: 0px; font-weight: initial; font-size: initial;"><input type="radio" name="' +
	    radio_name + '" value="' + rel_id +'"';
	if( first_p ){
	    str += ' checked="checked" />';
	}else{
	    str += ' />';
	}
	str += '&nbsp;' + rel_name + ' (' + rel_id + ')</label>';

	var total = 5;

	// Front table buffer.
	(function(){
	    var bffr = [];
	    for( var i = 0; i < lvl; i++ ){
		bffr.push('&nbsp;&nbsp;&nbsp;');
	    }
	    str = bffr.join('') + str;
	})();

	// // Back table buffer.
	// (function(){
	//     var bffr = [];
	//     for( var i = lvl; i < total; i++ ){
	// 	bffr.push('<td></td>');
	//     }
	//     str = str + bffr.join('');
	// })();

	return '<div>' + str + '</div>';
    }
    
    // 
    var str_tree = [
	'<div style="padding-left: 5px; border-left: 0px solid gray; margin-bottom: 1em;">',
	'<div><em>Common relations</em></div>',
	_fuse('enabled by', 'RO:0002333', radio_name, 0, true),
	_fuse('occurs in', 'BFO:0000066', radio_name, 0),
	_fuse('part of', 'BFO:0000050', radio_name, 0),
	_fuse('causally upstream of or within', 'RO:0002418', radio_name, 0),
	_fuse('causally upstream of', 'RO:0002411', radio_name, 1),
	_fuse('causally upstream of, positive effect', 'RO:0002304', radio_name, 2),
	_fuse('causally upstream of, negative effect', 'RO:0002305', radio_name, 2),
	_fuse('immediately causally upstream of', 'RO:0002412', radio_name, 2),
	_fuse('directly provides input for', 'RO:0002413', radio_name, 3),
	_fuse('regulates', 'RO:0002211', radio_name, 2),
	_fuse('negatively regulates', 'RO:0002212', radio_name, 3),
	_fuse('directly negatively regulates', 'RO:0002630', radio_name, 4),
	_fuse('positively regulates', 'RO:0002213', radio_name, 3),
	_fuse('directly positively regulates', 'RO:0002629', radio_name, 4),
	_fuse('has participant',  'RO:0000057', radio_name, 0),
	_fuse('has input', 'RO:0002233', radio_name, 1),
	_fuse('has output', 'RO:0002234', radio_name, 1),
	_fuse('transports or maintains localization of', 'RO:0002313', radio_name, 1),
	'</div>'
    ];

    // List.
    var tcache = [
	mebe.join(' '),
	'<div style="height: 25em; overflow-y: scroll; margin-top: 5px;">',
	str_tree.join(' '),
	'<div class="well">',
	'<div><em>All relations</em></div>'
    ];
    each(rellist, function(tmp_rel, rel_ind){
	tcache.push('<div class="radio"><label>');
	tcache.push('<input type="radio" ');
	tcache.push('name="' + radio_name + '" ');
	tcache.push('value="' + tmp_rel[0] +'"');
	// if( rel_ind === 0 ){
	//     tcache.push('checked>');
	// }else{
	    tcache.push('>');
	// }
	tcache.push(tmp_rel[1] + ' ');
	tcache.push('(' + tmp_rel[0] + ')');
	tcache.push('</label></div>');	     
    });
    tcache.push('</div>');
    tcache.push('</div>');
    
    var save_btn_args = {
	'generate_id': true,
	'type': 'button',
	'class': 'btn btn-primary'
    };
    var save_btn = new bbop.html.tag('button', save_btn_args, 'Save');

    // Setup base modal.
    var mdl = new contained_modal('dialog', 'Add Relation');
    mdl.add_to_body(tcache.join(''));
    mdl.add_to_footer(save_btn.to_string());

    // Add action listener to the save button.
    function _rel_save_button_start(){

	//
	//ll('looks like edge (in cb): ' + eeid);
	var qstr ='input:radio[name=' + radio_name + ']:checked';
	var rval = jQuery(qstr).val();
	// ll('rval: ' + rval);
	
	// // TODO: Should I report this too? Smells a
	// // bit like the missing properties with
	// // setParameter/s(),
	// // Change label.
	// //conn.setLabel(rval); // does not work!?
	// conn.removeOverlay("label");
	// conn.addOverlay(["Label", {'label': rval,
	// 			 'location': 0.5,
	// 			 'cssClass': "aLabel",
	// 			 'id': 'label' } ]);

	// Kick off callback.	
	manager.add_fact(ecore.get_id(), source_id, target_id, rval);

	// Close modal.
	mdl.destroy();
    }
    // And add the new one for this instance.
    jQuery('#' + save_btn.get_id()).click(function(evt){
	evt.stopPropagation();
	_rel_save_button_start();
    });
    
    // Return our final product.
    return mdl;
}

/**
 * Contained shield for editing the properties of a node (including
 * deletion).
 * 
 * Function that returns object.
 * 
 * TODO: make subclass?
 *
 * @constructor
 */
function edit_node_modal(ecore, manager, enode, relations, aid, gserv, gconf, iworkbenches, user_token){
    
    // Start with ID.
    var tid = enode.id();

    // Create a list of types associated with the instance, as well as
    // capture their information for further editing.
    var elt2type = {};
    var type_list = [];
    each(enode_types_to_ordered_stack(enode.types(), aid), function(item){
	var type_str = type_to_full(item, aid);
	var eid = bbop_core.uuid();
	elt2type[eid] = item;		 
	var acache = [];
	acache.push('<li class="list-group-item" style="background-color: ' +
		    aid.color(item.category()) + ';">');
	acache.push(type_str);
	// if( ! item.inferred_p() ){
	acache.push('<span id="'+ eid +
		    '" class="badge app-delete-mark">X</span>');
	// }
	acache.push('<div class="clearfix"></div>');
	acache.push('</li>');
	type_list.push(acache.join(''));
    });

    ///
    /// Class expression input.
    ///

    // Create autocomplete box.
    var type_add_class_text_args = {
    	'generate_id': true,
    	'type': 'text',
    	'class': 'form-control',
    	'placeholder': 'Enter ID by selecting from dropdown'
    };
    var type_add_class_text =
	    new bbop.html.tag('input', type_add_class_text_args);

    // Create add class exp button.
    var type_add_btn_args = {
    	'generate_id': true,
    	'type': 'button',
    	'class': 'btn btn-success'
    };
    var type_add_btn = new bbop.html.tag('button', type_add_btn_args, 'Add');

    // Create NOT checkbox.
    var type_not_checkbox_args = {
    	'generate_id': true,
    	'type': 'checkbox',
    };
    var type_not_checkbox =
	    new bbop.html.tag('input', type_not_checkbox_args);

    // Final assembly.
    var type_form = [
    	'<div class="form">',
    	'<div class="form-group">',
	type_add_class_text.to_string(),
    	'</div>',
	'<div class="checkbox">',
	'<label>',
	type_not_checkbox.to_string(),
    	' NOT',
    	'</label>',
    	'</div>',
    	type_add_btn.to_string(),
    	'</div>'
    ];

    ///
    /// Create section for deleting folded elements.
    ///

    // Create a list of folded individuals to delete.
    var elt2ind = {};
    var ind_list = [];
    //console.log('enode', enode);
    var sub = enode.subgraph();
    if( sub ){
	each(sub.all_nodes(), function(snode){
	    
    	    var snid = snode.id();
	    
	    if( snid !== tid ){
		
    		var eid = bbop_core.uuid();
    		elt2ind[eid] = snid;

		// Get node labeling.
		var scache = [];
		each(snode.types(), function(stype){
		    scache.push(type_to_span(stype));
		});
		var slabel = scache.join(' / ') || '<none>'; 

		// See if we can get the edge labeling.
		var edge_labels = [];
		var edges = sub.get_edges(tid, snid);
		if( edges && edges.length > 0 ){
		    each(edges, function(e){
			edge_labels.push(e.label() || e.predicate_id());
		    });
		}
		
		// Build UI.
    		var acache = [];
    		acache.push('<li class="list-group-item">');
		if( edge_labels.length > 0 ){
    		    acache.push('[' + edge_labels.join('/') + '] ');
		}
    		acache.push(slabel);
    		acache.push('<span id="'+ eid +
    			    '" class="badge app-delete-mark">X</span>');
    		acache.push('<div class="clearfix"></div>');
    		acache.push('</li>');
    		ind_list.push(acache.join(''));
	    }
	});
    }

    ///
    /// Individual/fact bundle input.
    ///

    // Create autocomplete box (enabled_by).
    var bundle_add_class_text_args = {
    	'generate_id': true,
    	'type': 'text',
    	'class': 'form-control',
    	'placeholder': 'Enter ID by selecting from dropdown'
    };
    var bundle_add_class_text =
	    new bbop.html.tag('input', bundle_add_class_text_args);
    // Create autocomplete box (enabled_by).
    var bundle_add_fact_text_args = {
    	'generate_id': true,
    	'type': 'text',
    	'class': 'form-control',
    	'placeholder': 'Enter relation to connect with'
    };
    var bundle_add_fact_text =
	    new bbop.html.tag('input', bundle_add_fact_text_args);

    // Create add bundle button.
    var bundle_add_btn_args = {
    	'generate_id': true,
    	'type': 'button',
    	'class': 'btn btn-success'
    };
    var bundle_add_btn = new bbop.html.tag('button', bundle_add_btn_args, 'Add');

    var bundle_form = [
    	'<div class="form">',
    	'<div class="form-group">',
	bundle_add_fact_text.to_string(),
    	'</div>',
    	'<div class="form-group">',
	bundle_add_class_text.to_string(),
    	'</div>',
    	bundle_add_btn.to_string(),
    	'</div>'
    ];

    ///
    /// Create section for individual-level plugins/workbenches.
    /// Create delete button.
    ///

    // Workbench link/buttons.
    var workbench_buttons = [];
    var type_wb_btn_args = {
    	'generate_id': true,
    	'type': 'button',
	'target': '_blank',
    	'class': 'btn btn-success'
    };
    each(iworkbenches, function(wb){
	var workbench_id = wb['workbench-id'];
	var href = '/workbench/'+ workbench_id +'?model_id='+ ecore.id() +
		'&individual_id='+ encodeURIComponent(tid);
	if( user_token ){ // if have login, keep in
	    href = href + '&barista_token=' + user_token;
	}
	type_wb_btn_args['href'] = href;
	var type_wb_btn =
	    new bbop.html.tag('a', type_wb_btn_args, wb['menu-name']);
	workbench_buttons.push(type_wb_btn.to_string());
    });

    // Clone button.
    var type_clone_btn_args = {
    	'generate_id': true,
    	'type': 'button',
    	'class': 'btn btn-success'
    };
    var type_clone_btn =
	new bbop.html.tag('button', type_clone_btn_args, 'Clone');

    // Delete button.
    var type_del_btn_args = {
    	'generate_id': true,
    	'type': 'button',
    	'class': 'btn btn-danger'
    };
    var type_del_btn = new bbop.html.tag('button', type_del_btn_args, 'Delete');

    //
    var tcache = [
	'<h4>Types</h4>',
	'<p>',
	'<ul class="list-group">',
	type_list.join('') || '<li class="list-group-item">none</li>',
	'</ul>',
	'<hr />',
	'</p>',
	'<h4>Add type</h4>',
	'<p>',
	type_form.join(''),
	'</p>',
	'<hr />',
	'<h4>Sub-nodes</h4>',
	'<p>',
	'<ul class="list-group">',
	ind_list.join('') || '<li class="list-group-item">none</li>',
	'</ul>',
	'</p>',
	'<hr />',
	'<h4>Add edge & class expression</h4>',
	'<p>',
	bundle_form.join(''),
	'</p>',
	'<hr />',
	'<h4>Other operations</h4>',
	type_clone_btn.to_string(),
	' &nbsp; ',
	workbench_buttons.join(' '),
	'<hr />',
	type_del_btn.to_string(),
	'&nbsp;this individual'
    ];

    // Setup base modal.
    var mdl = new contained_modal('dialog', 'Edit Instance: ' + tid);
    mdl.add_to_body(tcache.join(''));

    // Attach deletes to all of the listed types.
    each(elt2type, function(type, elt_id){
	jQuery('#' + elt_id).click(function(evt){
	    evt.stopPropagation();
	    var target_id = evt.target.id;
	    var target_type = elt2type[target_id];
	    var cid = target_type.class_id();
	    
	    manager.remove_class_expression(ecore.get_id(), tid, target_type);
	    // // Trigger the delete.
	    // if( target_type.type() === 'class' ){
	    // 	manager.remove_class_expression(ecore.get_id(), tid, cid);
	    // }else{
	    // 	var pid = target_type.property_id();
	    // 	manager.remove_class_expression(ecore.get_id(), tid,
	    // 					cid, target_type);
	    // }
	    // Wipe out modal.
	    mdl.destroy();
	});
    });

    // Attach deletes to all of the listed sub-nodes.
    each(elt2ind, function(ind_id, elt_id){
	jQuery('#' + elt_id).click(function(evt){
	    evt.stopPropagation();
	    var target_id = evt.target.id;
	    var iid = elt2ind[target_id];	    

	    // Ready a new request.
	    var reqs = new minerva_requests.request_set(manager.user_token(),
							ecore.get_id());
	    reqs.remove_individual(iid);
	    manager.request_with(reqs);
	    mdl.destroy();
	});
    });

    // Generate the dropdown for the relations.
    var rellist = sorted_relation_list(relations, aid);
    // Make the property autocomplete dance.
    var prop_sel_ac_list = [];
    each(rellist, function(rel){
	prop_sel_ac_list.push(
	    {
		'value': rel[0],
		//'desc': '???',
		'label': rel[1] + ' ('+ rel[0] +')'
	    });
    });
    jQuery('#' + bundle_add_fact_text.get_id()).autocomplete({
    	'minLength': 0,
    	'source': prop_sel_ac_list,
    	'focus': function(event, ui){
    	    jQuery('#' + bundle_add_fact_text.get_id()).val(ui.item.value);
    	    return false;
    	},
    	select: function( event, ui ) {
    	    jQuery('#' + bundle_add_fact_text.get_id()).val(ui.item.value);
    	    return false;
    	}
    });// .autocomplete('#' + svf_prop_text.get_id()).val(ui.item.label)._renderItem = function(ul, item){
    // 	return jQuery('<li>')
    // 	    .append('<a>' + item.label + '<br />' + item.desc + '</a>')
    // 	    .appendTo(ul);
    // };

    // Add add expression action.
    jQuery('#' + type_add_btn.get_id()).click(function(evt){
	evt.stopPropagation();
	
	var cls = jQuery('#' + type_add_class_text.get_id()).val();
	if( cls ){

	    // Check to see if the input is checked.
	    var qstr = 'input:checkbox[id=' +
		    type_not_checkbox.get_id() + ']:checked';
	    var rval = jQuery(qstr).val();
	    if( rval === 'on' ){
		// Create a negated class expression.
		var ce = new class_expression();
		ce.as_complement(cls);
		// Trigger the addition--hopefully inconsistent.
		manager.add_class_expression(ecore.get_id(), tid, ce);
	    }else{
		// Trigger the addition--hopefully inconsistent.
		manager.add_class_expression(ecore.get_id(), tid, cls);
	    }
		
	    // Wipe out modal.
	    mdl.destroy();	    
	}else{
	    // Allow modal to remain for retry.
	    alert('At least class must be defined');
	}
    });
    
    // Add add bundle action.
    jQuery('#' + bundle_add_btn.get_id()).click(function(evt){
	evt.stopPropagation();
	
	var cls = jQuery('#' + bundle_add_class_text.get_id()).val();
	var rel = jQuery('#' + bundle_add_fact_text.get_id()).val();
	if( cls && rel ){

	    var reqs = new minerva_requests.request_set(manager.user_token(),
							ecore.get_id());
	    var ind = reqs.add_individual(cls);
	    reqs.add_fact([tid, ind, rel]);
	    manager.request_with(reqs);

	    // Wipe out modal.
	    mdl.destroy();	    
	}else{
	    // Allow modal to remain for retry.
	    alert('Class and relations must be defined');
	}
    });
    
    // Add clone action. "tid" is the closed individual identifier.
    jQuery('#' + type_clone_btn.get_id()).click(function(evt){
	evt.stopPropagation();

	// Function that add an individual and its type to a request,
	// the returns the new individual's id.
	var add_with_types = function (reqs, individual){

	    var itypes = individual.types();
	    var cloned_ind_id = null;
	    each(itypes, function(t, index){
		if( index === 0 ){
		    cloned_ind_id = reqs.add_individual(t);
		}else{
		    reqs.add_type_to_individual(t, cloned_ind_id);
		}
	    });

	    return cloned_ind_id;
	};

	// Ready a new request.
	var reqs = new minerva_requests.request_set(manager.user_token(),
						    ecore.get_id());

	// Add the individual itself to the request.
	var ind = ecore.get_node(tid);
	var cloned_ind_id = add_with_types(reqs, ind);

	// Next, collect anything in the subgraph.
	var subgr = ind.subgraph();
	if( subgr ){

	    console.log(subgr);

	    // Iterate over all of the edges; this will prevent adding
	    // the base node again.
	    each(subgr.all_edges(), function(e){

		var sid = e.subject_id();
		var oid = e.object_id();
		var pid = e.predicate_id();

		console.log(sid, oid, pid);

		if( sid === tid ){ // clone subject direction

		    console.log('sub', sid, oid, pid);

		    // Clone node.
		    var o_node = subgr.get_node(oid);
		    if( o_node ){
			var cloned_ob_id = add_with_types(reqs, o_node);
		    
			// Clone edge.
			reqs.add_fact([cloned_ind_id, cloned_ob_id, pid]);
		    }

		}else if( oid === tid ){ // clone object direction

		    console.log('ob', sid, oid, pid);
		    
		    // Clone node.
		    var s_node = subgr.get_node(sid);
		    if( s_node ){
			var cloned_sub_id = add_with_types(reqs, s_node);

			// Clone edge.
			reqs.add_fact([cloned_sub_id, cloned_ind_id, pid]);
		    }
		}
	    });
	}

	// Next, collect any surrounding edges, link the new top-level
	// clone to the originals.
	each(ecore.get_edges_by_subject(tid), function(e){
	    reqs.add_fact([cloned_ind_id, e.object_id(), e.predicate_id()]);
	});
	each(ecore.get_edges_by_object(tid), function(e){
	    reqs.add_fact([e.subject_id(), cloned_ind_id, e.predicate_id()]);
	});

	// Trigger the clone--hopefully consistent.
	manager.request_with(reqs);
	
	// Wipe out modal.
	mdl.destroy();
    });
    
    // Add delete action. "tid" is the closed individual identifier.
    jQuery('#' + type_del_btn.get_id()).click(function(evt){
	evt.stopPropagation();
	
	// Do NOT start with the main deletion target, just an empty
	// list--remember that the subgraphs contain the outer
	// individual, so we'd be adding it twice and cause errors.
	var to_delete_ids = [];

	// Next, collect anything in the subgraph; the edges should
	// come off naturally in Minerva.
	var ind = ecore.get_node(tid);
	var sub = ind.subgraph();
	if( sub ){
	    each(sub.all_nodes(), function(n){
		to_delete_ids.push(n.id());
	    });
	}else{
	    // However, if there was no subgraph, we need to add the
	    // original target so we delete /something/.
	    to_delete_ids = [tid];  
	}

	// Ready a new request.
	var reqs = new minerva_requests.request_set(manager.user_token(),
						    ecore.get_id());

	// Add all of the deletes to the request.
	each(to_delete_ids, function(id){
	    reqs.remove_individual(id);
	});

	// Trigger the delete--hopefully consistent.
	//manager.remove_individual(ecore.get_id(), tid);
	manager.request_with(reqs);
	
	// Wipe out modal.
	mdl.destroy();
    });
    
    // Add autocomplete box for ECO to evidence box.
    var eco_auto_args = {
    	'label_template':'{{annotation_class_label}} ({{annotation_class}})',
    	'value_template': '{{annotation_class}}',
    	'list_select_callback': function(doc){}
    };
    
    // Add general autocomplete to the input.
    var gen_auto_args = {
    	'label_template':'{{entity_label}} ({{entity}})',
    	'value_template': '{{entity}}',
    	'list_select_callback': function(doc){}
    };
    var gen_auto_type = new bbop.widget.search_box(
	gserv, gconf, type_add_class_text.get_id(), gen_auto_args);
    gen_auto_type.lite(true);
    gen_auto_type.add_query_filter('document_category', 'general');
    gen_auto_type.set_personality('general');
    var gen_auto_bundle = new bbop.widget.search_box(
	gserv, gconf, bundle_add_class_text.get_id(), gen_auto_args);
    gen_auto_bundle.lite(true);
    gen_auto_bundle.add_query_filter('document_category', 'general');
    gen_auto_bundle.set_personality('general');

    // Return our final product.
    return mdl;
}

/**
 * Contained shield for generically editing the annotations of an
 * identifier entity.
 * 
 * Function that returns object.
 * 
 * TODO: make subclass?
 * 
 * @constructor
 */
function edit_annotations_modal(annotation_config, ecore, manager, entity_id,
				gserv, gconf, context){

    ///
    /// This first section describes a semi-generic way of generating
    /// callbacks to delete and add annotations to various enities.
    ///

    // Try and determine what type of entity we are dealing with:
    // model, node, edge.
    var entity = null;
    var entity_type = null;
    var entity_title = null;
    if( ecore.get_id() === entity_id ){
	entity = ecore;
	entity_type = 'model';
	entity_title = entity_id;
    }else if( ecore.get_node(entity_id) ){
	entity = ecore.get_node(entity_id);
	entity_type = 'individual';
	entity_title = entity_id;
    }else if( ecore.get_edge_by_id(entity_id) ){
	entity = ecore.get_edge_by_id(entity_id);
	entity_type = 'fact';
	entity_title = entity.source() + ' / ' +
	    entity.relation() + ' / ' +
	    entity.target();
    }else{
	// TODO: Apparently a bum ID.
    }

    //
    // Create a "generic" enity-based dispatch to control all the
    // possible combinations of our "generic" interface in this case.
    // Usage of model brought in through closure.
    //
    // "ann_val" is either a string (for most types of annotation) or,
    // for evidence addition, a hash of the form:
    // : {evidence_id: STRING; source_ids: [LIST OF STRINGS] }
    //
    function _ann_dispatch(entity, entity_type, entity_op, model_id,
			   ann_key, ann_val){

	// We start by getting ready to check on the special case of
	// "evidence" psuedo-annotations.
	var is_ev_p = false;
	if( ann_key === 'evidence' ){
	    is_ev_p = true;
	}

	// Prepare args for ye olde dispatch.
	var args = {};
	if( entity_type === 'individual' ){
	    args['id'] = entity_id;
	}else if( entity_type === 'fact' ){
	    args['source'] = entity.source();
	    args['target'] = entity.target();
	    args['relation'] = entity.relation();
	}else{
	    // Model.
	    // TODO: would like a debug msg here.
	}

	// All evidence psuedo-annotations are handled one way, the
	// rest of the annotations another way.
	if( is_ev_p ){ // in the case of evidence...

	    if( entity_op === 'add' ){
		// Ensure that the argument is of the right type when
		// attempting to add evidence.
		if( ! ann_val['evidence_id'] || ! ann_val['source_ids'] ){
		    throw new Error('bad evidence ann args');
		}
				
		// Evidence addition is only defined for individuals
		// and facts.
		if( entity_type === 'individual' ){
		    manager.add_individual_evidence(model_id, args['id'],
						    ann_val['evidence_id'],
						    ann_val['source_ids'],
						    ann_val['with_strs']);
		}else if( entity_type === 'fact' &&  entity_op === 'add' ){
		    manager.add_fact_evidence(model_id,
					      args['source'],
					      args['target'],
					      args['relation'],
					      ann_val['evidence_id'],
					      ann_val['source_ids'],
					      ann_val['with_strs']);
		}else{
		    throw new Error('only fact and individual for evidence add');
		}

	    }else{
		// Removing evidence is all the same (ann_val as a
		// string referenceing the evidence individual to be
		// removed).
		manager.remove_evidence(model_id, ann_val);
	    }
	    
	}else{

	    // All add/remove operations run with the same arguments.
	    if( entity_type === 'individual' ){
		if( entity_op === 'remove' ){
		    manager.remove_individual_annotation(
			model_id, args['id'], ann_key, ann_val);
		}else{
		    manager.add_individual_annotation(
			model_id, args['id'], ann_key, ann_val);
		}
	    }else if( entity_type === 'fact' ){
		if( entity_op === 'remove' ){
		    manager.remove_fact_annotation(
			model_id,
			args['source'], args['target'], args['relation'],
			ann_key, ann_val);
		}else{
		    manager.add_fact_annotation(
			model_id,
			args['source'], args['target'], args['relation'],
			ann_key, ann_val);
		}
	    }else{
		// Models are a wee bit different, and more simple.
		if( entity_op === 'remove' ){
		    manager.remove_model_annotation(model_id, ann_key, ann_val);
		}else{
		    manager.add_model_annotation(model_id, ann_key, ann_val);
		}
	    }
	}
    }	

    ///
    /// This next section is concerned with generating the UI
    /// necessary and connecting it to the correct callbacks.
    ///
    
    // Constructor: 
    // A simple object to have a more object-like sub-widget for
    // handling the addition calls.
    //
    // widget_type - "text_area", "text", or "source_ref"
    function _abstract_annotation_widget(widget_type, placeholder,
					 placeholder_secondary,
					 placeholder_tertiary, dd_options){

	var anchor = this;

	///
	/// Detection and button generation for evidence cloning.
	///

	// Extract evidence profiles in the current graph.
	// Check to see if we're in the special evidence mode :(
	var all_evidence_profiles = [];
	if( dd_options && dd_options['special'] === 'evidence' ){

	    var over_graph = dd_options['graph'];
	    if( over_graph ){

		// Clone out, just in case.
		over_graph = over_graph.clone(); // use the clone

		// Make sure we're in the proper single-folded mode.
		over_graph.unfold();
		over_graph.fold_evidence();

		us.each(over_graph.all_edges(), function(e){
		    var profs = e.get_referenced_subgraph_profiles();
		    if( profs && profs.length > 0 ){
			us.each(profs, function(p){
			    all_evidence_profiles.push(p);
			});
		    }
		});
	    }
	}

	// Create clone button.
	var clone_btn_args = {
    	    'generate_id': true,
    	    'type': 'button',
    	    'class': 'btn' // plain
	};
	if( all_evidence_profiles.length === 0 ){
	    clone_btn_args['disabled'] =  'disabled';
	}
	anchor.clone_button =
	    new bbop.html.tag('button', clone_btn_args, 'Clone other');

	// As well, we'll need the evidence profiles for later.
	anchor.evidence_profiles = all_evidence_profiles;

	///
	/// Main collection segements.
	///

	// Create add button.
	var add_btn_args = {
    	    'generate_id': true,
    	    'type': 'button',
    	    'class': 'btn btn-success'
	};
	anchor.add_button = new bbop.html.tag('button', add_btn_args, 'Add');

	// The form control for the input area.
	var text_args = {
    	    'generate_id': true,
    	    //'type': 'text',
    	    'class': 'form-control',
    	    'placeholder': placeholder
	};
	if( widget_type === 'textarea' ){
	    text_args['type'] = 'text';
	    text_args['rows'] = '2';
	    anchor.text_input = new bbop.html.tag('textarea', text_args);
	}else if( widget_type === 'text' ){
	    text_args['type'] = 'text';
	    anchor.text_input = new bbop.html.tag('input', text_args);
	}else if( widget_type === 'dropdown' ){

	    // Jimmy in options for select
	    var optlist = [];
	    each(dd_options, function(dddef){

		//
		var opt_args = {
		    'alt': (dddef['comment'] || ''), // comment is optional
		    'value': dddef['identifier']
		};

		// Select one if identified in placeholder.
		if( placeholder && placeholder === dddef['identifier'] ){
		    opt_args['selected'] = 'selected';
		}

		var opt = new bbop.html.tag('option', opt_args, dddef['label']);
		optlist.push(opt);
	    });
	    //text_args['type'] = 'text';
	    anchor.text_input = new bbop.html.tag('select', text_args, optlist);

	}else{ // 'source_ref'
	    text_args['type'] = 'text';
	    anchor.text_input = new bbop.html.tag('input', text_args);
	    // Gets a second input.
	    text_args['placeholder'] = placeholder_secondary;
	    anchor.text_input_secondary = new bbop.html.tag('input', text_args);
	    // Gets a thirs input (with).
	    text_args['placeholder'] = placeholder_tertiary;
	    anchor.text_input_tertiary = new bbop.html.tag('input', text_args);
	}

	// Both placed into the larger form string.
	var form = [];
	if( widget_type === 'textarea' ){
	    form = [
		'<div>',
		'<div class="form-group">',
		anchor.text_input.to_string(),
		'</div>',
    		anchor.add_button.to_string(),
		'</div>'
	    ];
	}else if( widget_type === 'text' ){
	    form = [
    		'<div class="form-inline">',
    		'<div class="form-group">',
		anchor.text_input.to_string(),
    		'</div>',
    		anchor.add_button.to_string(),
    		'</div>'
	    ];
	}else if( widget_type === 'dropdown' ){
	    form = [
    		'<div class="form-inline">',
    		'<div class="form-group">',
		anchor.text_input.to_string(),
    		'</div>',
    		anchor.add_button.to_string(),
    		'</div>'
	    ];
	}else{ // 'source_ref'
	    form = [
    		//'<div class="form-inline">', // better button spacing
    		'<div>',
    		'<div class="form-group">',
		anchor.text_input.to_string(),
		// Secondary and tertiary flipped by suggestion in:
		// https://github.com/geneontology/noctua/issues/493
		'&nbsp;',
		anchor.text_input_tertiary.to_string(),
		'&nbsp;',
		anchor.text_input_secondary.to_string(),
    		'</div>',
    		anchor.add_button.to_string(),
		'&nbsp;',
    		anchor.clone_button.to_string(),
    		'</div>'
	    ];
	}
	anchor.form_string = form.join('');
    }

    ///
    /// Start main running body.
    ///

    //
    var mdl = null;
    if( ! entity ){
	alert('unknown id:' + entity_id);
    }else{

	// app_hooks = {
	//   'app-name': {
	//     <elt-uuid>: {<arg-to-function>},
	//     ...
	// }; 
	var app_hooks = {};
	

	// Go through our input list and create a mutable data
	// structure that we can then use to fill out the editor
	// slots.

	var ann_classes = {};
	each(annotation_config, function(ann_class){
	    var aid = ann_class['id'];

	    // Clone.
	    ann_classes[aid] = bbop_core.clone(ann_class);
	    
	    // Add our additions.
	    ann_classes[aid]['elt2ann'] = {};
	    ann_classes[aid]['list'] = [];
	    ann_classes[aid]['string'] = '???';
	    ann_classes[aid]['widget'] = null;
	});

	// Going through each of the annotation types, try and collect
	// them from the model.
	app_hooks['remote-pmid'] = {};
	each(us.keys(ann_classes), function(key){

	    // Skip adding anything if the policy is
	    // "read-only-optional" and there are no annotations for
	    // it.
	    // var anns_by_key = entity.get_annotations_by_key(key);
	    // if( ann_classes[key]['policy'] === 'read-only-optional' &&
	    // 	(! anns_by_key || anns_by_key.length === 0 ) ){
	    // 	    // skip
	    // }else{
	    
	    each(entity.get_annotations_by_key(key), function(ann){
		
		// For every one found, assemble the actual display
		// string while storing the ids for later use.
		var kval = ann.value();
		if( kval.split('http://').length === 2 ){ // cheap link
		    kval = '<a href="' +
			kval + '" target="_blank">' +
			kval + '</a>';
		}
		// However, evidence annotations are very different
		// for us now, and we need to dig out the guts from a
		// subgraph elsewhere.
		if( ann.key() === 'evidence' && ann.value_type() === 'IRI' ){
		    
		    // Setup a dummy in case we fail, like if we're
		    // fully exploded and there is no subgraph.
		    var ref_val = ann.value();
		    var ref_sub = entity.get_referenced_subgraph_by_id(ref_val);
		    kval = '(evidence annotation for: ' + ref_val + ')';
		    if( ref_sub ){ // we found the subgraph
			kval = '';
			// Collect class expressions, just using
			// the default profile extractor for now.
			var c_cache = [];
			each(ref_sub.all_nodes(), function(ref_ind){
			    // Collect the classes.
			    each(ref_ind.types(), function(ref_type){
				c_cache.push(type_to_span(ref_type));
			    });
			    kval += c_cache.join('/');
			    // Collect annotations (almost certainly
			    // had some class first, so no worries
			    // about the dumb tag on the end).
			    var ref_anns = ref_ind.annotations();
			    var sorted_ref_anns = ref_anns.sort(function(a, b){
				var va = a.key();
				var vb = b.key();
				var retval = 0;
				if( va < vb ){
				    retval = -1;
				}else if( va > vb ){
				    retval = 1;
				}
				return retval;
			    });
			    each(sorted_ref_anns, function(ref_ann){
				// Skip unnecessary information.
				//console.log('ref_ann.key():' + ref_ann.key() );
				if( ref_ann.key() !== 'hint-layout-x' &&
				    ref_ann.key() !== 'hint-layout-y' ){
				       var rav = ref_ann.value();
				       // link pmids silly
				       if( rav.split('PMID:').length === 2 ){
					   var pmid = rav.split('PMID:')[1];
					   var pmid_uuid = bbop_core.uuid();
					   kval += '<br />' + ref_ann.key() +': <a id="'+pmid_uuid+'" href="http://pmid.us/'+ pmid +'" target="_blank">'+ 'PMID:'+ pmid +' &#128279;</a>';
					   // As well, capture for later.
					   app_hooks['remote-pmid'][pmid_uuid] =
					       {'pmid': pmid};
				       }else if( rav.split('http://').length === 2 ){
					   kval +='<br />' + ref_ann.key() +': <a href="' + rav + '" target="_blank">'+ rav + ' &#128279;</a>';
				       }else{
					   kval +='<br /> '+ ref_ann.key() +': '+ rav;
				       }
				   }
			    });
			});
		    }
		}
		
		// And the annotation id for the key.
		var kid = bbop_core.uuid();
		
		// Only add to action set if mutable.
		if( ann_classes[key]['policy'] === 'mutable' ){
		    ann_classes[key]['elt2ann'][kid] = ann.id();
		}

		var acache = [];
		acache.push('<li class="list-group-item">');
		acache.push(kval);

		// Only add the delete UI bits if the policy says
		// mutable.
		if( ann_classes[key]['policy'] === 'mutable' ){
		    acache.push('<span id="'+ kid +
				'" class="badge app-delete-mark">X</span>');
		}

		acache.push('</li>');
		ann_classes[key]['list'].push(acache.join(''));
	    });

	    // Join wahtaver is in the list together to get the display
	    // string.
	    // If we didn't collect anything, it's empty.
	    var str = '';
	    if( ann_classes[key]['list'].length > 0 ){
		str = ann_classes[key]['list'].join('');
		str = '<ul class="list-group">' + str + '</ul>';
	    }
	    ann_classes[key]['string'] = str;

	});

	// TODO: Generate the final code from the created structure.
	// Use the original ordering of the argument list.
	var out_cache = [];
	each(annotation_config, function(list_entry){	
    
	    //
	    var eid = list_entry['id'];
	    var entry_info = ann_classes[eid];
	    
	    //
	    var elbl =  entry_info['label'];
	    var ewid =  entry_info['widget_type'];
	    var epol =  entry_info['policy'];
	    var ecrd =  entry_info['cardinality'];
	    var eplc =  entry_info['placeholder'];
	    var eopt =  entry_info['options'] || [];
	    // for evidence (ref)
	    var eplc_b = entry_info['placeholder_secondary'] || '';
	    // for evidence (with)
	    var eplc_c = entry_info['placeholder_tertiary'] || '';
	    // Has?
	    var ehas = entry_info['list'].length || 0;
	    // UI output string.
	    var eout = entry_info['string'];

	    // Add whatever annotations we have.
	    out_cache.push('<div class="panel panel-default">');
	    //out_cache.push('<h4>' + elbl + '</h4>');
	    out_cache.push('<div class="panel-heading">' + elbl + '</div>');
	    out_cache.push('<div class="panel-body">');
	    //out_cache.push('<p>');
	    out_cache.push('<ul class="list-group">' + eout + '</ul>');
	    //out_cache.push('</p>');
	    
	    // And add an input widget if mutable...
	    //console.log('epol: ' + epol);
	    if( epol && epol === 'mutable' ){
		// ...and cardinality not one or has no items in list.
		//console.log(' ecrd: ' + ecrd);
		//console.log(' ehas: ' + ehas);
		if( ecrd !== 'one' || ehas === 0 ){
		    console.log(' widget for: ' + eid);
		    var form_widget = null;
		    if( ewid === 'source_ref' ){ // evidence is special
			form_widget = new _abstract_annotation_widget(
			    ewid, eplc, eplc_b, eplc_c, {
				'special': 'evidence',
				'graph': ecore
			    });
		    }else{
			form_widget = new _abstract_annotation_widget(
			    ewid, eplc, null, null, eopt);
		    }

		    // Add to the literal output.
		    out_cache.push(form_widget.form_string);

		    // Add back to the collection for use after
		    // connecting to the DOM.
		    ann_classes[eid]['widget'] = form_widget;
		}
	    }

	    // Close out BS3 panel.
	    out_cache.push('</div>');
	    out_cache.push('</div>');
	});

	// Optionally, collect any annotations not in one of the given
	// defined categories.
	var all_undefined_annotations = entity.get_annotations_by_filter(
	    function(in_ann){
		var retval = false;
		if( in_ann.key() !== 'http://geneontology.org/lego/json-model' &&
		    in_ann.key() !== 'hint-layout-x' &&
		    in_ann.key() !== 'hint-layout-y' ){
		    if( ! ann_classes[in_ann.key()] ){ // ! defined ann class
			retval = true;
		    }
		}
		return retval;
	    }
	);
	// Add them to the display at the bottom if there is anything
	// worth acting on.
	if( ! us.isEmpty(all_undefined_annotations) ){
		
	    // As above, but manually add visible annotations.
	    out_cache.push('<div class="panel panel-default">');
	    out_cache.push('<div class="panel-heading">Other annotations</div>');
	    out_cache.push('<div class="panel-body">');
	    out_cache.push('<ul class="list-group"></ul>');
	    each(all_undefined_annotations, function(unann){

		out_cache.push('<li class="list-group-item">');
		out_cache.push(unann.key());
		out_cache.push(': ');
		out_cache.push(unann.value());
		if( unann.value_type() ){
		    out_cache.push(' [' + unann.value_type() + ']');
		}
		out_cache.push('</li>');
	    });
	    out_cache.push('</ul>');
	    out_cache.push('</div>');
	    out_cache.push('</div>');
	}

	// Cheaply inject a button for experimenting with markup tools,
	// GO-only.
	if( entity_type === 'model' && context === 'go' ){
	    out_cache.push('<div class="panel panel-default">');
	    out_cache.push('<div class="panel-heading">' +
			   'Paper markup tools <span class="alpha">ALPHA</span></div>');
	    out_cache.push('<div class="panel-body">');
	    // Markup buttons.
	    var pubann_model_btn_args = {
    		'generate_id': true,
    		'type': 'button',
    		'class': 'btn btn-success btn-xs',
		'style': 'padding-right: 1em;'
	    };
	    var textpr_btn =
		new bbop.html.tag('button', pubann_model_btn_args, 'Textpresso');
	    var tpc_btn =
		new bbop.html.tag('button', pubann_model_btn_args, 'TPC');
	    out_cache.push(textpr_btn.to_string());
	    out_cache.push('&nbsp;');
	    out_cache.push(tpc_btn.to_string());
	    out_cache.push('</div>');
	    out_cache.push('</div>');
	}
	// GO facts.
	//if( ( entity_type === 'fact' || entity_type === 'individual' ) &&
	    // context === 'go' ){
	if( entity_type === 'fact' && context === 'go' ){
	    out_cache.push('<div class="panel panel-default">');
	    out_cache.push('<div class="panel-heading">' +
			   'Paper markup tools <span class="alpha">ALPHA</span></div>');
	    out_cache.push('<div class="panel-body">');
	    // Markup buttons.
	    var pubann_fact_btn_args = {
    		'generate_id': true,
    		'type': 'button',
    		'class': 'btn btn-success btn-xs',
		'style': 'padding-right: 1em;'
	    };
	    var pubann_btn =
		    new bbop.html.tag('button', pubann_fact_btn_args,
				      'PubAnnotation');
	    out_cache.push(pubann_btn.to_string());
	    out_cache.push('</div>');
	    out_cache.push('</div>');
	}

	// Setup base modal.
	mdl = new contained_modal('dialog', 'Annotations for: ' + entity_title);
	mdl.add_to_body(out_cache.join(''));

	// Okay, still playing from just above, let's arm the
	// Textpresso and PubAnn buttons and start playing.
	if( entity_type === 'model' && context === 'go' ){

	    // Standard TPC--#316 implementation.
	    jQuery('#' + tpc_btn.get_id()).click( function(evt){
		evt.stopPropagation();
		
		// Close out what we had.
		mdl.destroy();
		
		var taemdl =
		    new contained_modal('dialog', 'TPC interaction');
		taemdl.add_to_body('<div><p>TPC!</p></div>');
		taemdl.show();

		// Kick people to new link in new window.
		var btkn = manager.user_token();
		if( ! btkn || ! us.isString(btkn) ){
		    alert('Need to be logged in to kick out to TPC.');
		}else{

		    //
		    var endpoint_url =
			    encodeURIComponent('http://'+ window.location.hostname +'/tractorbeam');

		    var reqs = new minerva_requests.request_set(btkn,
								ecore.get_id());
		    // Base.
		    reqs.use_groups(manager.use_groups());
		    // Fake.
		    reqs.external_model_id(ecore.get_id());
		    reqs.external_client_id('tpc');
		    //reqs.external_user_id('http://user1'); // not needed yet?
		    var endpoint_arguments =
			    encodeURIComponent(JSON.stringify(reqs.structure()));

		    // TODO: This seems to change a lot--maybe push it into
		    // a config, or start the plugin thinking?
		    var txtpr = 'http://tpc.textpresso.org';
		    window.open(txtpr + '/cgi-bin/tc/NoctuaIn?' +
				'endpoint_url=' + endpoint_url +
				'&endpoint_arguments=' + endpoint_arguments,
				'_blank');
		    
		}
		taemdl.destroy();
	    });	

	    // Standard Textpresso--token only.
	    jQuery('#' + textpr_btn.get_id()).click( function(evt){
		evt.stopPropagation();
		
		// Close out what we had.
		mdl.destroy();
		
		var taemdl =
		    new contained_modal('dialog', 'Textpresso interaction');
		taemdl.add_to_body('<div><p>Textpresso!</p></div>');
		taemdl.show();

		// Kick people to new link in new window.
		var btkn = manager.user_token();
		if( ! btkn || ! us.isString(btkn) ){
		    alert('Need to be logged in to kick out to Textpresso.');
		}else{
		    var txtpr = 'http://tpc.textpresso.org';
		    window.open(txtpr + '/cgi-bin/tc/NoctuaIn?token=' + btkn,
				'_blank');
		}
		taemdl.destroy();
	    });	

	// }else if( (entity_type === 'fact' || entity_type === 'individual' ) &&
	// 	  context === 'go' ){
	}else if( entity_type === 'fact' && context === 'go' ){

	    // PubAnnotation.
	    jQuery('#' + pubann_btn.get_id()).click( function(evt){
		evt.stopPropagation();
		
		// Close out what we had.
		mdl.destroy();
		
		var taemdl =
		    new contained_modal('dialog', 'PubAnnotation pattern interaction');
		var tofm = [
		    '<div><p>Markup a PubMed document for the comments in this entity.</p>',
		    '<form id="pubanninteraction" class="form-inline">',
		    '<div class="form-group">',
		    '<label for="pubannpubid">PubMed ID <i>or full service URL to PubMed markup page for an ID</i></label>',
		    '<input type="text" class="form-control" id="pubannpubid" placeholder="PMID:01234567 or 01234567 or full URL to service page" />',
		    '</div><br />',
		    '<button id="pubannpubidsend" type="submit" class="btn btn-default">Go to service</button>',
		    '</form>',
		    '</div>'
		];
		taemdl.add_to_body(tofm.join(''));
		taemdl.show();

		// TODO: Action on button click.
		// If input looks okay, kick people to PubAnnotation.
		jQuery("#pubanninteraction" ).submit(function(event){
		    event.preventDefault();

		    var btkn = manager.user_token();
		    if( ! btkn || ! us.isString(btkn) ){
			alert('Need to be logged in to transfer ' +
			      'to PubAnnotation.');
			taemdl.destroy();
		    }else{

			// Try to get the PubMed ID.
			var finputs = jQuery('#pubanninteraction :input');
			//console.log(finputs);
			var fvalues = {};
			each(finputs, function(finput){
			    fvalues[finput.id] = finput.value;
			    //console.log(finput);
			});
			//console.log(fvalues);
			var inp = fvalues['pubannpubid'];

			// If the PMID is good, build a link out to
			// PubAnnotation and kick.
			if( ! inp ){
			    alert('Need to input a PubMed ID.');
			}else{

			    var good_pmid_a = /^[0-9]+$/;
			    var good_pmid_b = /^PMID\:[0-9]+$/;
			    var good_pmid_c = /^http:\/\/.*[0-9]+.*/;
			    if( ! good_pmid_a.test(inp) &&
				! good_pmid_b.test(inp) &&
				! good_pmid_c.test(inp) ){
				alert('Not a recognized PubMed ID: ' + inp);
			    }else{

				// Assume PubAnnotation, unless otherwise
				// specified.
				// Get only the local if full short form.
				if( good_pmid_b.test(inp) ){
				    inp = inp.substr(5, inp.length);
				}
				    
				// Finally, kick out to PubAnnotation.
				var endp_url = 'http://'+ window.location.origin +'/tractorbeam';
				var endpoint_url = encodeURIComponent(endp_url);
				var reqs = new minerva_requests.request_set(
				    btkn, ecore.get_id());
				// Base.
				reqs.use_groups(manager.use_groups());
				// Fake.
				reqs.external_model_id(ecore.get_id());
				reqs.external_client_id('pubannotation.org');
				reqs.external_return_url(window.location.toString());
				if( entity_type === 'fact' ){
				    var xsource = entity.source();
				    var xtarget = entity.target();
				    var xrelation = entity.relation();
				    reqs.external_fact_source_id(xsource);
				    reqs.external_fact_target_id(xtarget);
				    reqs.external_fact_relation_id(xrelation);
				}else if( entity_type === 'individual' ){
				    reqs.external_individual_id(entity_id);
				}
				var endpoint_arguments =
					encodeURIComponent(JSON.stringify(reqs.structure()));

				// TODO: This seems to change a lot--maybe
				// push it into a config, or start the plugin
				// thinking?
				var kick_url = 'http://pubannotation.org/docs/sourcedb/PubMed/sourceid/' + inp + '?';
				if( good_pmid_c.test(inp) ){
				    kick_url = inp + '?';
				}
				window.open(kick_url +
				'endpoint_url=' + endpoint_url +
				'&endpoint_arguments=' + endpoint_arguments,
				'_blank');
				
				taemdl.destroy();
			    }
			}
		    }
		});
		
	    });
	}

	// Now that they're in the DOM, add the different app classes
	// we have defined.
	//console.log('app_hooks', app_hooks);
	each(us.keys(app_hooks), function(app_hook_set){
	    us.each(us.keys(app_hooks[app_hook_set]), function(app_elt_uuid){
		var app_elt_data = app_hooks[app_hook_set][app_elt_uuid];
		if( app_hook_set === 'remote-pmid' ){

		    var gptmpl = global_sparql_templates_named['get-pmid'];
		    if( gptmpl ){
			var sep = gptmpl['endpoint'];
			//var sqy = gptmpl['query'];
			console.log('sep', sep);
			//console.log('query', sqy);
			console.log('app_elt_data', app_elt_data);
			
			var engine_to_use = new jquery_engine(response_json);
			engine_to_use.headers(
			    [['accept', 'application/sparql-results+json']]);
			var sm = new sparql_manager(sep,
						    [],
						    response_json,
						    engine_to_use,
						    'async');
			sm.register('error', function(resp, man){
			    console.log('sparql_manager error', resp);
			});
			sm.register('success', function(resp, man){
			    //console.log('sparql_manager success', resp);
			    if( resp.raw()['results'] &&
				resp.raw()['results']['bindings'] &&
				resp.raw()['results']['bindings'][0] &&
				resp.raw()['results']['bindings'][0]['title'] ){
				    var tt = resp.raw()['results']['bindings'][0]['title']['value'];
				    jQuery("#"+app_elt_uuid).html(tt);
				}else{
				    console.log('wikidata return structure bad');
				}
			});
			sm.template(JSON.stringify(gptmpl), app_elt_data);
		    }
		}
            });
	});
	
	// Now that they're all in the DOM, add any delete annotation
	// actions. These are completely generic--all annotations can
	// be deleted in the same fashion.
	each(us.keys(ann_classes), function(ann_key){
	    //each(ann_classes[ann_key]['elt2ann'], function(elt_id, ann_id){
	    each(ann_classes[ann_key]['elt2ann'], function(ann_id, elt_id){
		jQuery('#' + elt_id).click( function(evt){
		    evt.stopPropagation();
		    
		    //var annid = elt2ann[elt_id];
		    //alert('blow away: ' + annid);
		    var ann = entity.get_annotation_by_id(ann_id);
		    var akey = ann.key();
		    var aval = ann.value();
		    _ann_dispatch(entity, entity_type, 'remove',
				  ecore.get_id(), akey, aval);
		    
		    // Wipe out modal on action.
		    mdl.destroy();
		});
	    });
	});
	
	// Walk through again, this time activating and annotation
	// "add" buttons that we added.
	each(us.keys(ann_classes), function(ann_key){
	    var form = ann_classes[ann_key]['widget'];
	    //console.log('ann_key: ' + ann_key, form);
	    if( form ){ // only act if we added/defined it earlier

		// Clone button add.
		if( form.evidence_profiles.length > 0 ){

    		    jQuery('#' + form.clone_button.get_id()).click(function(evt){

			// Assemble a little display from each
			// evidence profile for display.
			var cln_line_cache = {};
			var ce_cache = {};
			us.each(form.evidence_profiles, function(prof){

			    // Mine out class expressions..
			    var cln_ce_str = [];
			    var cln_ce = [];
			    us.each(prof.class_expressions, function(ce){
				cln_ce.push(ce.class_id());
				cln_ce_str.push(ce.to_string_plus());
				//console.log(ce);
				ce_cache[ce.class_id()] = true;
			    });
			    
			    // Mine out source and with.
			    var cln_src = [];
			    var cln_with = [];
			    //console.log(prof.annotations.length);
			    us.each(prof.annotations, function(ann){
				if( ann.key() === 'with' ){
				    cln_with.push(ann.value());
				}
				if( ann.key() === 'source' ){
				    cln_src.push(ann.value());
				}
				//console.log(ann);
			    });

			    // Store and add to display.
			    // BUG/TODO: Locking to single sized for now.
			    var uniq = cln_ce_str.join('/') + '_' +
				cln_src.join('/') + '_' +
				cln_with.join(' / ');
			    //console.log('uniq', uniq);
			    if( cln_ce_str.length === 1 &&
			    	cln_src.length > 0 ){
				
				// Create add button.
				var cln_btn_args = {
    				    'generate_id': true,
    				    'type': 'button',
    				    'class': 'btn btn-success'
				};
				var cln_btn = new bbop.html.tag(
				    'button', cln_btn_args,'Add');

				// Avoid dupes.
				var line = [
				    cln_ce_str.join(' / '),
				    cln_src.join(' / '),
				    cln_with.join(' / '),
				    cln_btn.to_string(),
				];
				// console.log('line', line);
				// Uniquify and store thinks we'll
				// need for the action later.
				cln_line_cache[uniq] = {
				    'line': line,
				    'button': cln_btn,
				    'class_expressions': cln_ce,
				    'sources': cln_src,
				    'withs': cln_with
				};
			    }
			});

			var cln_tbl = new bbop.html.table(
			    ['Class expression(s)','Source(s)','With','Action'],
			    us.map(us.values(cln_line_cache), function(store){
				return store['line'];
			    }),
			    {'generate_id': true,
			     'class': ['table',
				       'table-bordered',
				       'table-hover',
				       'table-condensed'].join(' ')});

			// Launch widget.
			var cdl = new contained_modal('dialog',
						      'Clone evidence to: ' +
						      entity_title);
			cdl.add_to_body(cln_tbl.to_string());
			cdl.show();

			///
			/// Now that it's in the DOM, add actions to
			/// the buttons.
			///

			// Make buttons from cache.
			us.each(us.values(cln_line_cache), function(store){

			    // 
			    var cln_btn = store['button'];
			    var cln_ce = store['class_expressions'];
			    var cln_src = store['sources'];
			    var cln_with = store['withs'] || []; // nil p?
			    
			    jQuery('#'+cln_btn.get_id()).click(function(evt){

				// BUG/TODO: class express still
				// locked to the first.
				// var line = [
				//     cln_ce.join(' / '),
				//     cln_src.join(' / '),
				//     cln_with.join(' / ')].join('; ');
				//console.log('pre-action line',line);
				_ann_dispatch(entity, entity_type, 'add',
					      ecore.get_id(), ann_key,
					      { 'evidence_id': cln_ce[0],
						'source_ids': cln_src,
						'with_strs': cln_with });
				cdl.destroy();
				mdl.destroy();
			    });
			});

    		    });
		}

		// The typical add button.
		jQuery('#' + form.add_button.get_id()).click(function(evt){
		    evt.stopPropagation();

		    if( ann_key === 'evidence' ){
			
			// In the case of evidence, we need to bring
			// in the two different text items and make
			// them into the correct object for
			// _ann_dispatch(). The "with" field is an
			// optional add-on.
			var val_a = 
			    jQuery('#'+form.text_input.get_id()).val();
			var val_b =
			    jQuery('#'+form.text_input_secondary.get_id()).val();
			var val_c =
			    jQuery('#'+form.text_input_tertiary.get_id()).val();

			// Need ECO and reference, "with" is optional
			// for now.
			if( val_a && val_a !== '' && val_b && val_b !== '' ){
			    _ann_dispatch(entity, entity_type, 'add',
					  ecore.get_id(), ann_key,
					  { 'evidence_id': val_a,
					    'source_ids': val_b,
					    'with_strs': val_c });
			}else{
			    alert('need all arguments added for ' + entity_id);
			}

		    }else{
			var val_d = jQuery('#' + form.text_input.get_id()).val();
			if( val_d && val_d !== '' ){
			    _ann_dispatch(entity, entity_type, 'add',
					  ecore.get_id(), ann_key, val_d);
			}else{
			    alert('no ' + ann_key + ' added for ' + entity_id);
			}
		    }
	    
		    // Wipe out modal.
		    mdl.destroy();	    
		});	
	    }
	});

	///
	/// Special section for special additions (autocomplete, etc.).
	/// TODO: Eventually, this should also be in the config.
	///
	
	// Add autocomplete box for ECO to evidence box.
	if( ann_classes['evidence'] && ann_classes['evidence']['widget'] ){
	    var ev_form = ann_classes['evidence']['widget'];
	    var eco_auto_args = {
    		'label_template':
		'{{annotation_class_label}} ({{annotation_class}})',
    		'value_template': '{{annotation_class}}',
    		'list_select_callback': function(doc){}
	    };
	    var eco_auto =
		    new bbop.widget.search_box(gserv, gconf,
					       ev_form.text_input.get_id(),
					       eco_auto_args);
	    eco_auto.lite(true);
	    eco_auto.add_query_filter('document_category', 'ontology_class');
	    eco_auto.add_query_filter('source', 'eco', ['+']);
	    eco_auto.set_personality('ontology');
	}
    }

    // Return our final product.
    return mdl;
}

/**
 * Object.
 * 
 * Output formatted commentary to element.
 *
 * @constructor
 */
function reporter(output_id){

    var output_elt = '#' + output_id;
    var list_elt = null;

    // ...
    function _date_str(n){

	function _zero_fill(n){
	    var ret = n;
	    if( ret < 10 ){
		ret = '0' + ret;
	    }
	    return ret;
	}
	
	var now = new Date();
	var dts = now.getFullYear() + '/' +
	    _zero_fill(now.getMonth() +1) + '/' +
	    _zero_fill(now.getDate()) + ' ' +
	    _zero_fill(now.getHours()) + ':' +
	    _zero_fill(now.getMinutes()) + ':' +
	    _zero_fill(now.getSeconds());
	return dts;
    }	
    
    this.reset = function(){
	jQuery(output_elt).empty();
	var new_list_id = bbop_core.uuid();
	list_elt = '#' + new_list_id;
	jQuery(output_elt).append('<ul id="' + new_list_id + '"></ul>');
    };

    this.comment = function(message){
	
	// Try and set some defaults.
	var uid = null;
	var color = null;
	if( message ){
	    uid = message['user_name'] ||
		message['user_email'] ||
		message['socket_id'];
	    color = message['user_color'];
	}

	// Start.
	var out = '<li>';

	// Add color if defined.
	out += _date_str() + ': ';
	if( uid && color ){
	    out += '<span class="bbop-mme-message-uid" style="color:' +
		color + ';">'+ uid + '</span>: ';
	}else if( uid ){
	    out += '<span class="bbop-mme-message-uid">'+ uid + '</span>: ';
	}

	// Complicated datagram.
	var intent = message['intention'] || '??? (intention)';
	var sig = message['signal'] || '??? (signal)';
	var mess = message['message'] || '??? (message)';
	var mess_type = message['message_type'] || '??? (meesage_type)';

	// make a sensible message.
	if( mess_type === 'error' ){
	    out += mess_type + ': there was a problem: ' + mess; 
	}else{
	    if( sig === 'merge' || sig === 'rebuild' ){
		if( intent === 'query' ){
		    out += mess_type + ': they likely refreshed';		
		}else{		    
		    out += 'performed  <span class="bbop-mme-message-op">' +
			intent + '</span> (' + mess + '), ' +
			'<span class="">' +
			'you may wish to refresh' + '</span>';
		}
	    }else{
		out += mess_type + ': ' + mess;		
	    }
	}

	// End.
	out += '</li>';

	// Actually do it.
	jQuery(list_elt).prepend(out);
    };

    // Initialize.
    this.reset();
}

/**
 * Given a token, either report a bad token ot
 *
 * Parameters: 
 *  barista_loc - barista location
 *  given_token - token
 *  elt_id - element to replace
 *  user_group_fun - [optional] function that returns the current user group id
 *  change_group_announce_fun - [optional] function that returns the current user group id; if false or null (a opposed to undefined), don't use callback and don't draw selector
 *  
 * Returns: function that returns current group id/state ???
 */
function user_check(barista_loc, given_token, elt_id,
		    change_group_announce_fun){

    // Decide whether to render the groups, and if there is a default
    // callback to use.
    var render_groups_p = true;
    if( typeof(change_group_announce_fun) === 'undefined' ){
	change_group_announce_fun = function(group_id){
	    alert('Ignoring group change to: ' + group_id);
	};
    }else if(change_group_announce_fun === false ){
	render_groups_p = false;
    }else if(change_group_announce_fun === null ){
	render_groups_p = false;
    }
    
    // Redraw the widget from scratch with the incoming data.
    var _redraw_widget = function(user_group_id, data){

	// Do a basic check on the data; if bad,
	// try and recover by clearing the token.
	if( ! data || ! data['uri'] ){

	    alert('You seem to have a bad token; will try to clean...');
	    var to_remove = 'barista_token=' + given_token;
	    var new_url = window.location.toString().replace(to_remove, '');
	    //var new_url = window.location;
	    
	    window.location.replace(new_url);
	    console.log('user_check window.location', window.location);

	}else{

	    var eid2gid = {};
	    
	    // Render a single entry in the groups dropdown.
	    var something_checked_p = false;
	    var _render_entry = function(user_uri, group_id, group_label){	

		var chk = '&#10004&nbsp;';
		var box = '&square;&nbsp;';
		var ret = '';

		var fresh_id = '_user_group_' + bbop_core.uuid();
		
		if( user_group_id === group_id ){
		    // Bold if it is our current group.
		    ret = '<li><a id=' + fresh_id + ' href="#">' +
			chk + group_label + '</a></li>';
		    eid2gid[fresh_id] = group_id;
		    something_checked_p = true;
		}else if( user_uri === group_id ){
		    // Bold if our "none" group.
		    ret = '<li><a id=' + fresh_id + ' href="#">' +
			chk + '(none)</a></li>';
		    eid2gid[fresh_id] = null;
		    something_checked_p = true;
		// }else if( ! group_id ){
		//     // Bold if no group at all.
		//     ret = '<li><a id=' + fresh_id + ' href="#">' +
		// 	chk + '(none)</a></li>';
		//     eid2gid[fresh_id] = null;
		//     something_checked_p = true;
		}else{
		    // Regular unchecked selection.
		    ret = '<li><a id=' + fresh_id + ' href="#">'+
			box + group_label +'</a></li>';
		    eid2gid[fresh_id] = group_id;
		}
		
		return ret;
	    };

	    // Try and get the best user name we can.
	    var name = data['nickname'] || data['uri'];
	    
	    // If there is group information, create an active widget,
	    // otherwise create a silent one.
	    if( ! us.isArray(data['groups']) ||
		data['groups'].length === 0 ||
		render_groups_p === false ){
		
		// Inactive replacement.
		var nsel = '<span id="user_name_info">' + name + '</span>';
		jQuery('#' + elt_id).replaceWith(nsel);

	    }else{
		
		// Create the groups list, select the first.
		// If the first is the uri of the user, select none.
		var group_list = [];
		var add_none_p = true;
		us.each(data['groups'], function(grp){
		    
		    // If the user's URI is in there, skip adding
		    // "none" later.
		    if( grp['id'] === data['uri'] ){
			add_none_p = false;
		    }
		    var ent = _render_entry(data['uri'],
					    grp['id'], grp['label']);
		    group_list.push(ent);
		});
		
		// If we did not run into the user's id, add "none" to
		// the bottom.
		if( add_none_p ){
		    var nent = null;
		    if( something_checked_p ){
			nent = _render_entry(data['uri'], null, "(none)");
		    }else{
			nent = _render_entry(data['uri'], data['uri'], "(none)");
		    }
		    group_list.push(nent);
		}
		
		// Create active widget.
		var gsel = [
		    '<!-- Group controls. -->',
		    '<li class="dropdown" id="' + elt_id + '">',
		    '<span class="dropdown-toggle" data-toggle="dropdown">'+
			name + ' <b class="caret"></b></span>',
		    '<ul class="dropdown-menu">',
		    group_list.join(' '),
		    '</ul>',
		    '</li>'
		];
		jQuery('#' + elt_id).replaceWith(gsel.join(''));
		
		// User callback on change.
		us.each(eid2gid, function(gid, eid){
		    jQuery('#' + eid).click(function(evt){
		    	evt.stopPropagation();

			// Redraw with new highlight.
			_redraw_widget(gid, data);

			// Apply user-supplied function.
			if( typeof(change_group_announce_fun) === 'function' ){
			    change_group_announce_fun(gid);
			}
		    });
		});		
	    }
	}	    
    };
    
    var user_info_loc = barista_loc + "/user_info_by_token/" + given_token;
    jQuery.ajax({
	'type': "GET",
	'url': user_info_loc,
	'dataType': "json",
	'error': function(){
	    alert('had an error getting user info for: ' + given_token);
	},
	'success': function(data){

	    // Figure out if there is an initial group to handle.
	    var init_user_group = null;
	    if( data && us.isArray(data['groups']) ){
		if( data['groups'].length > 0 ){
		    var first_group = data['groups'][0];
		    if( first_group && first_group['id'] ){
			init_user_group = first_group['id'];
		    }
		}
	    }

	    // Initial draw, hopefully with the right group.
	    _redraw_widget(init_user_group, data);

	    // Initial use of change group announce fun.
	    if( typeof(change_group_announce_fun) === 'function' ){
		change_group_announce_fun(init_user_group);
	    }
	}
    });
}

/**
 * Essentially, minimal rendered as a usable span, with a color
 * option.
 */
function type_to_span(in_type, color){

    var text = null;

    var min = in_type.to_string();
    var more = in_type.to_string_plus();
    if( color ){
	text = '<span ' + 'style="background-color: ' + color + ';" ' +
	    'alt="' + more + '" ' + 'title="' + more +'">' + min + '</span>';
    }else{
	text = '<span alt="' + more + '" title="' + more +'">' + min + '</span>';
    }

    return text;
}

/**
 * A recursive writer for when we no longer care--a table that goes on
 * and on...
 */
function type_to_full(in_type, aid){
    var anchor = this;

    var text = '[???]';

    var t = in_type.type();
    if( t === 'class' || t === 'complement' ){ // if simple, the easy way out
	text = in_type.to_string_plus();
    }else{
	// For everything else, we're gunna hafta do a little
	// lifting...
	var cache = [];
	if( t === 'union' || t === 'intersection' ){
	    
	    // Some kind of recursion on a frame then.
	    cache = [
		'<table width="80%" class="table table-bordered table-hover table-condensed mme-type-table" ' +
		    'style="background-color: ' +
	     	    aid.color(in_type.category()) + ';">',
		'<caption>' + t + '</caption>',
		//'<thead style="background-color: white;">',
		'<thead style="">',
		'</thead>',
		'<tbody>'
	    ];
	    // cache.push('<tr>'),
	    var frame = in_type.frame();
	    each(frame, function(ftype){
		cache.push('<tr style="background-color: ' +
		     	   aid.color(ftype.category()) + ';">');
		cache.push('<td>');
		// cache.push('<td style="background-color: ' +
	     	// 		aid.color(ftype.category()) + ';">'),
		cache.push(type_to_full(ftype, aid));
		cache.push('</td>');
		cache.push('</tr>');
	    });	
	    // cache.push('</tr>');
	    cache.push('</tbody>');
	    cache.push('</table>');
	    
	    text = cache.join('');	    

	}else{

	    // A little harder: need to a an SVF wrap before I recur.
	    var pid = in_type.property_id();
	    var plabel = in_type.property_label();
	    var svfce = in_type.svf_class_expression();
	    cache = [
		'<table width="80%" class="table table-bordered table-hover table-condensed mme-type-table">',
		'<thead style="background-color: ' + aid.color(pid) + ';">',
		plabel,
		'</thead>',
		'<tbody>'
	    ];
	    cache.push('<tr style="background-color: ' +
		       aid.color(svfce.category()) + ';"><td>');
	    cache.push(type_to_full(svfce, aid));
	    cache.push('</td></tr>');
	    cache.push('</tbody>');
	    cache.push('</table>');
	    
	    text = cache.join('');
	}
    }

    return text;
}

///
/// Exportable body.
///

module.exports = {
    'build_token_link': build_token_link,
    'repaint_info': repaint_info,
    'repaint_exp_table': repaint_exp_table,
    'repaint_edge_table': repaint_edge_table,
    'wipe': wipe,
    'enode_types_to_ordered_stack': enode_types_to_ordered_stack,
    'node_stack_object': node_stack_object,
    'add_enode': add_enode,
    'update_enode':update_enode ,
    'contained_modal': contained_modal,
    'compute_shield': compute_shield,
    'sorted_relation_list': sorted_relation_list,
    'add_edge_modal': add_edge_modal,
    'edit_node_modal': edit_node_modal,
    'edit_annotations_modal': edit_annotations_modal,
    'reporter': reporter,
    'user_check': user_check,
    'type_to_span': type_to_span,
    'type_to_full': type_to_full
};
