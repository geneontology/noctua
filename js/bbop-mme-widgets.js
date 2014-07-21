////
//// Namespace for large drawing routines.
////

var bbop_mme_widgets = {};

/*
 * "Static" function.
 *
 * For the time being, the cannonical way of building a link with a
 * token.
 */
bbop_mme_widgets.build_token_link = function(url, token){
    var new_url = url;
    
    if( token ){
	if( new_url.indexOf('?') == -1 ){
	    new_url = new_url + '?' + 'barista_token=' + token;
	}else{
	    new_url = new_url + '&' + 'barista_token=' + token;
	}
    }
    
    return new_url;
};

// Add edit model node contents to a descriptive table.
bbop_mme_widgets.repaint_info = function(ecore, aid, info_div){

    // Node and edge counts.
    var nds = bbop.core.get_keys(ecore.get_nodes()) || [];
    var eds = bbop.core.get_keys(ecore.get_edges()) || [];

    // Any annotation information that came in.
    var anns = '';
    bbop.core.each(ecore.annotations(),
		   function(ann){
		       if( ann.property('comment') ){
			   anns += '<dd>' +
			       '<small><strong>comment</strong></small> ' +
			       ann.property('comment') +
			       '</dd>';
		       }
		   });
    if( anns == '' ){
	anns = '<dd>none</dd>';
    }

    var str_cache = [
	'<dl class="dl-horizontal">',
	// '<dt></dt>',
	// '<dd>',
	// '</dd>',
	'<dt>ID</dt>',
	'<dd>',
	ecore.get_id(),
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
};

// Add edit model node contents to a descriptive table.
bbop_mme_widgets.repaint_exp_table = function(ecore, aid, table_div){

    var each = bbop.core.each;

    // First, lets get the headers that we'll need by poking the
    // model and getting all of the possible categories.	
    var cat_list = [];
    each(ecore.get_nodes(),
	 function(enode_id, enode){
	     each(enode.types(),
		  function(in_type){
		      cat_list.push(in_type.category());
		  });
	 });
    // Dedupe list.
    var tmph = bbop.core.hashify(cat_list);
    cat_list = bbop.core.get_keys(tmph);

    // If we actually got something, render the table. Otherwise,
    // a message.
    if( bbop.core.is_empty(cat_list) ){
	
	// Add to display.
	jQuery(table_div).empty();
	jQuery(table_div).append('<p><h4>no instances</h4></p>');

    }else{
	
	// Sort header list according to known priorities.
	cat_list = cat_list.sort(
	    function(a, b){
		return aid.priority(b) - aid.priority(a);
	    });
	
	// Convert the ids into readable headers.
	var nav_tbl_headers = [];
	each(cat_list,
	     function(cat_id){
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
	each(ecore.edit_node_order(),
	     function(enode_id){
		 var enode = ecore.get_node(enode_id);
		     
		 // Now that we have an enode, we want to mimic
		 // the order that we created for the header
		 // (cat_list). Start by binning the types.
		 var bin = {};
		 each(enode.types(),
		      function(in_type){
			  var cat = in_type.category();
			  if( ! bin[cat] ){ bin[cat] = []; }
			  bin[cat].push(in_type);
		      });
		     
		 // Now unfold the binned types into the table row
		 // according to the sorted order.
		 var table_row = [];
		 each(cat_list,
		      function(cat_id){
			  var accumulated_types = bin[cat_id];
			  var cell_cache = [];
			  each(accumulated_types,
			       function(atype){
				   var tt = bme_type_to_span(atype, aid);
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
};

// Add edit model edge contents to a descriptive table.
bbop_mme_widgets.repaint_edge_table = function(ecore, aid, table_div){

    var each = bbop.core.each;

    var edge_list = ecore.get_edges();

    // If we actually got something, render the table. Otherwise,
    // a message.
    if( bbop.core.is_empty(edge_list) ){
	
	// Add to display.
	jQuery(table_div).empty();
	jQuery(table_div).append('<p><h4>no relations</h4></p>');

    }else{
	
	// Make the (obvjously known) headers pretty.
	var nav_tbl_headers = [];
	each(['subject', 'relation', 'object'],
	     function(hdr){
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
	
	each(edge_list,
	     function(edge_id){
		 var edge = ecore.get_edge(edge_id);
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
};

bbop_mme_widgets.wipe = function(div){
    jQuery(div).empty();
};

/*
 * Takes a core edit node as the argument, categorize the
 * contained types, order them.
 *
 * As a secondary function, remove overly "dupe-y" inferred types.
 */
bbop_mme_widgets.enode_to_stack = function(enode, aid){
	
    var each = bbop.core.each;
    var pare = bbop.core.pare;

    // 
    var sig_lookup = {};
    var bin_stack = enode.types() || [];

    // Get ready to remove "dupes", first by collecting the signatures
    // of the non-inferred individual types.
    each(bin_stack,
	 function(t){
	     if( ! t.inferred_p() ){
		 sig_lookup[t.signature()] = true;
	     }
	 });

    // Sort the types within the stack according to the known
    // type priorities.
    function _sorter(a, b){

	// Inferred nodes always have ??? priority.
	var ainf = a.inferred_p();
	var binf = b.inferred_p();
	if( ainf != binf ){
	    if( binf ){
		return 1;
	    }else{
		return -1;
	    }
	}
	
	// Otherwise, use aid property priority.
	var bpri = aid.priority(b.property_id());
	var apri = aid.priority(a.property_id());
	return apri - bpri;
    };

    // Filter anything out that has a matching signature.
    function _filterer(item){
	var ret = false;
	if( item.inferred_p() ){
	    if( sig_lookup[item.signature()] ){
		ret = true;
	    }
	}
	return ret;
    }

    bin_stack = pare(bin_stack, _filterer, _sorter);

    return bin_stack;
};
    
/*
 * 
 */
bbop_mme_widgets.render_node_stack = function(enode, aid){

    var each = bbop.core.each;

    // Create a colorful label stack into an individual table.
    var enode_stack_table = new bbop.html.tag('table',
					      {'class':'bbop-mme-stack-table'});

    // Add type/color information.
    var inferred_type_count = 0;
    var ordered_types = bbop_mme_widgets.enode_to_stack(enode, aid);
    each(ordered_types,
	 function(item){

	     // Special visual handling of inferred types.
	     if( item.inferred_p() ){ inferred_type_count++; }

	     var trstr = '<tr class="bbop-mme-stack-tr" ' +
		 'style="background-color: ' +
		 aid.color(item.category()) +
		 ';"><td class="bbop-mme-stack-td">' 
		 + bme_type_to_span(item, aid) + '</td></tr>';   
	     enode_stack_table.add_to(trstr);
	 });

    // Inject meta-information if extant.
    var anns = enode.annotations();
    if( anns.length != 0 ){

	// Meta counts.
	var n_ev = 0;
	var n_other = 0;
	each(anns,
	     function(ann){
		 if( ann.property('evidence') ){ n_ev++;
		 }else{ n_other++; }
	     });

	// Add to top.
	var trstr = '<tr class="bbop-mme-stack-tr">' +
	    '<td class="bbop-mme-stack-td"><small style="color: grey;">' 
	    + 'evidence: ' + n_ev + '; other: ' + n_other + 
	    '</small></td></tr>';
	enode_stack_table.add_to(trstr);
    }

    // Add external visual cue if there were inferred types.
    if( inferred_type_count > 0 ){
	var itcstr = '<tr class="bbop-mme-stack-tr">' +
		'<td class="bbop-mme-stack-td"><small style="color: grey;">' +
		'inferred types: ' + inferred_type_count + '</small></td></tr>';
	enode_stack_table.add_to(itcstr);
    }

    return enode_stack_table;
};

/*
 * Add a new enode.
 */
bbop_mme_widgets.add_enode = function(ecore, enode, aid, graph_div){

    var each = bbop.core.each;

    // Node as table nested into bbop.html div.
    var div_id = ecore.get_node_elt_id(enode.id());
    var style_str = 'top: ' + enode.y_init() + 'px; ' + 
	'left: ' + enode.x_init() + 'px;';
    //ll('style: ' + style_str);
    var w = new bbop.html.tag('div',
			      {'id': div_id,
			       'class': 'demo-window',
			       'style': style_str});
    
    var enode_stack_table = bbop_mme_widgets.render_node_stack(enode, aid);
    w.add_to(enode_stack_table);
    
    // Box to drag new connections from.	
    var konn = new bbop.html.tag('div', {'class': 'konn'});
    w.add_to(konn);
    
    // Box to click for edit dialog.
    var opend = new bbop.html.tag('div', {'class': 'open-dialog'});
    w.add_to(opend);
    
    // // Box to click for annotation dialog.
    // var openann = new bbop.html.tag('div', {'class': 'open-annotation-dialog'});
    // w.add_to(openann);
    
    jQuery(graph_div).append(w.to_string());
};

/*
 * Update the displayed contents of an enode.
 */
bbop_mme_widgets.update_enode = function(ecore, enode, aid){

    var each = bbop.core.each;

    // Node as table nested into bbop.html div.
    var uelt = ecore.get_node_elt_id(enode.id());
    jQuery('#' + uelt).empty();

    var enode_stack_table = bbop_mme_widgets.render_node_stack(enode, aid);
    jQuery('#' + uelt).append(enode_stack_table.to_string());
    
    // Box to drag new connections from.	
    var konn = new bbop.html.tag('div', {'class': 'konn'});
    jQuery('#' + uelt).append(konn.to_string());
    
    // Box to drag new connections from.	
    var opend = new bbop.html.tag('div', {'class': 'open-dialog'});
    jQuery('#' + uelt).append(opend.to_string());

    // // Box to click for annotation dialog.
    // var openann = new bbop.html.tag('div', {'class': 'open-annotation-dialog'});
    // jQuery('#' + uelt).append(openann.to_string());
};

/*
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
 */
bbop_mme_widgets.contained_modal = function(type, arg_title, arg_body){
    
    var tag = bbop.html.tag;

    var shield_p = false;
    if( type && type == 'shield' ){
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
    var x_btn = new tag('button', x_btn_args, '&times;');
    var close_btn_args = {
	'type': 'button',
	'class': 'btn btn-default',
	'data-dismiss': 'modal'
    };
    var close_btn = new tag('button', close_btn_args, 'Close');

    // Then the title.
    var title_args = {
	'generate_id': true,
	'class': 'modal-title'	
    };
    var title = new tag('div', title_args, arg_title);

    // One button and the title are in the header.
    var header_args = {
	'class': 'modal-header'
    };
    var header = null;
    if( shield_p ){
	header = new tag('div', header_args, title);
    }else{
	header = new tag('div', header_args, [x_btn, title]);
    }

    // The footer has the other button.
    var footer_args = {
	'generate_id': true,
	'class': 'modal-footer'
    };
    var footer = new tag('div', footer_args, close_btn);

    // Ready the body.
    var body_args = {
	'generate_id': true,
	'class': 'modal-body'	
    };
    var body = new tag('div', body_args, arg_body);

    // Content has header, body, and footer.
    var content_args = {
	'class': 'modal-content'
    };
    var content = null;
    if( shield_p ){
	content = new tag('div', content_args, [header, body]);
    }else{
	content = new tag('div', content_args, [header, body, footer]); 
    }

    // Dialog contains content.
    var dialog_args = {
	'class': 'modal-dialog'
    };
    var dialog = new tag('div', dialog_args, content); 
    
    // And the container contains it all.
    var container_args = {
	'generate_id': true,
	'class': 'modal fade',
	'tabindex': '-1',
	'role': 'dialog',
	'aria-labelledby': body.get_id(),
	'aria-hidden': 'true'
    };
    var container = new tag('div', container_args, dialog); 

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
};

/*
 * Contained blocking shield for general compute activity.
 * 
 * Function that returns object.
 * 
 * TODO: make subclass?
 */ 
bbop_mme_widgets.compute_shield = function(){

    var tag = bbop.html.tag;

    // Text.
    var p = new tag('p', {},
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
    var pb = new tag('div', pb_args, '<span class="sr-only">Working...</span>');
    var pb_container_args = {
	'class': 'progress progress-striped active'
    };
    var pb_container = new tag('div', pb_container_args, pb);

    var mdl = new bbop_mme_widgets.contained_modal('shield', 'Relax',
						   [p, pb_container]);
    return mdl;
};

/**
 * Function that returns a sorted relation list of the form [[id, label], ...]
 * 
 * Optional boost when we don't care using the boolean "relevant" field.
 * The boost is 10.
 * 
 * TODO: make subclass?
 */
bbop_mme_widgets.sorted_relation_list = function(relations, aid){
    
    var each = bbop.core.each;

    var boost = 10;

    // Get a sorted list of known rels.
    //var rels = aid.all_entities();
    var rels = relations.sort(
	function(a,b){ 
	    var id_a = a['id'];
	    var id_b = b['id'];

	    var pr_a = aid.priority(id_a);
	    var pr_b = aid.priority(id_b);

	    // Looking at the optional boolean "relevant" field, if we
	    // showed no preference in our context, give these a
	    // boost.
	    if( pr_a == 0 && a['relevant'] ){ pr_a = boost; }
	    if( pr_b == 0 && b['relevant'] ){ pr_b = boost; }

	    return pr_b - pr_a;
	});
    var rellist = [];
    each(rels,
	 function(rel){
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
};

/*
 * Contained shield for creating new edges between nodes.
 * 
 * Function that returns object.
 * 
 * TODO: make subclass?
 */
bbop_mme_widgets.add_edge_modal = function(ecore, manager,
					   relations, aid,
					   source_id, target_id){
    var each = bbop.core.each;
    var tag = bbop.html.tag;

    // Get a sorted list of known rels.
    var rellist = bbop_mme_widgets.sorted_relation_list(relations, aid);
    
    // Preamble.
    var mebe = [
	'<h4>Relation selection</h4>',
	'<b>Edge source:</b>',
	source_id,
	'<br />',
	'<b>Edge target:</b>',
	target_id
    ];

    // Randomized radio.
    var radio_name = bbop.core.uuid();
    var tcache = [mebe.join(' '),
		  '<div style="height: 25em; overflow-y: scroll;">'];
    each(rellist,
	 function(tmp_rel, rel_ind){
	     tcache.push('<div class="radio"><label>');
	     tcache.push('<input type="radio" ');
	     tcache.push('name="' + radio_name + '" ');
	     tcache.push('value="' + tmp_rel[0] +'"');
	     if( rel_ind == 0 ){
		 tcache.push('checked>');
	     }else{
		 tcache.push('>');
	     }
	     tcache.push(tmp_rel[1] + ' ');
	     tcache.push('(' + tmp_rel[0] + ')');
	     tcache.push('</label></div>');	     
	 });
    tcache.push('</div>');
    
    var save_btn_args = {
	'generate_id': true,
	'type': 'button',
	'class': 'btn btn-primary'
    };
    var save_btn = new tag('button', save_btn_args, 'Save');

    // Setup base modal.
    var mdl = new bbop_mme_widgets.contained_modal('dialog', 'Add Relation');
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
	manager.add_fact(ecore.get_id(), source_id,
			 target_id, rval);

	// Close modal.
	mdl.destroy();
    }
    // And add the new one for this instance.
    jQuery('#' + save_btn.get_id()).click(
	function(evt){
	    evt.stopPropagation();
	    _rel_save_button_start();
	});
    
    // Return our final product.
    return mdl;
};

/*
 * Contained shield for editing the properties of a node (including
 * deletion).
 * 
 * Function that returns object.
 * 
 * TODO: make subclass?
 */
bbop_mme_widgets.edit_node_modal = function(ecore, manager, enode,
					    relations, aid,
					    gserv, gconf){
    var each = bbop.core.each;
    var tag = bbop.html.tag;

    // Start with ID.
    var tid = enode.id();

    // Create a list of types associated with the instance, as well as
    // capture their information for further editing.
    var elt2type = {};
    var type_list = [];
    each(bbop_mme_widgets.enode_to_stack(enode, aid),
	 function(item){
	     var type_str = bme_type_to_full(item, aid);
	     var eid = bbop.core.uuid();
	     elt2type[eid] = item;		 
	     var acache = [];
	     acache.push('<li class="list-group-item" style="background-color: '
			 + aid.color(item.category()) + ';">');
	     acache.push(type_str);
	     if( ! item.inferred_p() ){
		 acache.push('<span id="'+ eid +
			     '" class="badge app-delete-mark">X</span>');
	     }
	     acache.push('<div class="clearfix"></div>');
	     acache.push('</li>');
	     type_list.push(acache.join(''));
	 });

    // Generate the dropdown for the 
    var rellist = bbop_mme_widgets.sorted_relation_list(relations, aid);
    var opts = [new tag('option',{'value': ''},'Select property')];
    each(rellist,
	 function(rel){
	     var opt = new tag('option',
			       {'value': rel[0]}, rel[1] +' ('+ rel[0] +')');
	     opts.push(opt);
	 });
    var svf_prop_select_args = {
    	'generate_id': true,
    	'type': 'text',
    	'class': 'form-control'
    	//'placeholder': 'Enter property'
    };
    var svf_prop_select = new tag('select', svf_prop_select_args, opts);

    var svf_class_text_args = {
    	'generate_id': true,
    	'type': 'text',
    	'class': 'form-control',
    	'placeholder': 'Enter ID or complex expression (enabled_by only)'
    };
    var svf_class_text = new tag('input', svf_class_text_args);

    // Create delete button.
    var add_svf_btn_args = {
    	'generate_id': true,
    	'type': 'button',
    	'class': 'btn btn-success'
    };
    var add_svf_btn = new tag('button', add_svf_btn_args, 'Add');

    var svf_form = [
    	'<div class="form">',
    	'<div class="form-group">',
	svf_prop_select.to_string(),
    	'</div>',
    	'<div class="form-group">',
	svf_class_text.to_string(),
    	'</div>',
    	add_svf_btn.to_string(),
    	'</div>'
    ];

    // Create delete button.
    var del_btn_args = {
    	'generate_id': true,
    	'type': 'button',
    	'class': 'btn btn-danger'
    };
    var del_btn = new tag('button', del_btn_args, 'Delete');

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
	svf_form.join(''),
	'</p>',
	'<hr />',
	'<h4>Other operations</h4>',
	// '<p>',
	del_btn.to_string(),
	'&nbsp;this individual'//,
	// '</p>'
    ];

    // Setup base modal.
    var mdl = new bbop_mme_widgets.contained_modal('dialog',
						   'Edit Instance: ' + tid);
    mdl.add_to_body(tcache.join(''));

    // Attach deletes to all of the listed types.
    each(elt2type,
	 function(elt_id, type){
	     jQuery('#' + elt_id).click(
		 function(evt){
		     evt.stopPropagation();
		     var target_id = evt.target.id;
		     var target_type = elt2type[target_id];
		     var cid = target_type.class_id();

		     // Trigger the delete.
		     if( target_type.type() == 'class' ){
			 manager.remove_class(ecore.get_id(), tid, cid);
		     }else{
			 var pid = target_type.property_id();
			 manager.remove_class_expression(ecore.get_id(), tid,
							 cid, target_type);
		     }
		     // Wipe out modal.
		     mdl.destroy();
		 });
	 });

    // Add add expression action.
    jQuery('#' + add_svf_btn.get_id()).click(
	function(evt){
	    evt.stopPropagation();

	    var cls = jQuery('#' + svf_class_text.get_id()).val();
	    var prp = jQuery('#' + svf_prop_select.get_id()).val();
	    if( cls && prp ){
		// Trigger the delete--hopefully inconsistent.
		manager.add_svf(ecore.get_id(), tid, cls, prp);

		// Wipe out modal.
		mdl.destroy();	    
	    }else if( cls ){
		// Trigger the delete--hopefully inconsistent.
		manager.add_class(ecore.get_id(), tid, cls);

		// Wipe out modal.
		mdl.destroy();	    
	    }else{
		// Allow modal to remain for retry.
		alert('At least class must be defined');
	    }
	});
    
    // Add delete action.
    jQuery('#' + del_btn.get_id()).click(
	function(evt){
	    evt.stopPropagation();

	    // Trigger the delete--hopefully inconsistent.
	    manager.remove_individual(ecore.get_id(), tid);

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
    	'label_template':'{{entity_label}} ({{entity}}/{{category}})',
    	'value_template': '{{entity}}',
    	'list_select_callback': function(doc){}
    };
    var gen_auto =
	new bbop.widget.search_box(gserv, gconf, svf_class_text.get_id(),
				   gen_auto_args);
    gen_auto.add_query_filter('document_category', 'general');
    //gen_auto.add_query_filter('source', 'eco', ['+']);
    gen_auto.set_personality('general');

    // Return our final product.
    return mdl;
};

/*
 * Contained shield for generically editing the annotations of an
 * identifier entity.
 * 
 * Function that returns object.
 * 
 * TODO: make subclass?
 */
bbop_mme_widgets.edit_annotations_modal = function(ecore, manager, entity_id,
						   gserv, gconf){
    var each = bbop.core.each;
    var tag = bbop.html.tag;

    // Try and determine what type of entity we are dealing with:
    // model, node, edge.
    var entity = null;
    var entity_type = null;
    var entity_title = null;
    if( ecore.get_id() == entity_id ){
	entity = ecore;
	entity_type = 'model';
	entity_title = entity_id;
    }else if( ecore.get_node(entity_id) ){
	entity = ecore.get_node(entity_id);
	entity_type = 'individual';
	entity_title = entity_id;
    }else if( ecore.get_edge(entity_id) ){
	entity = ecore.get_edge(entity_id);
	entity_type = 'fact';
	entity_title = entity.source() + ' / ' +
	    entity.relation() + ' / ' +
	    entity.target();
    }else{
	// Apparently a bum ID.
    }

    // Create a "generic" enity-based dispatch to control all the
    // possible combinations of our "generic" interface in this case.
    function _ann_dispatch(entity, entity_type, entity_op, model_id,
			   ann_key, ann_val){

	// Prepare args for ye olde dispatch.
	var args = {};
	if( entity_type == 'individual' ){
	    args['id'] = entity_id;
	}else if( entity_type == 'fact' ){
	    args['source'] = entity.source();
	    args['target'] = entity.target();
	    args['relation'] = entity.relation();
	}else{
	    // Model.
	}

	// First, select function.
	if( entity_type == 'individual' ){
	    var delfun = manager.add_individual_annotation;
	    if( entity_op == 'remove' ){
		delfun = manager.remove_individual_annotation;
	    }
	    // All add/remove operations run with the same argument:
	    // now run operation.
	    delfun(model_id, args['id'], ann_key, ann_val);
	}else if( entity_type == 'fact' ){
	    var delfun = manager.add_fact_annotation;
	    if( entity_op == 'remove' ){
		delfun = manager.remove_fact_annotation;
	    }
	    delfun(model_id, args['source'], args['target'], args['relation'],
		   ann_key, ann_val);
	}else{
	    // Model.
	    var delfun = manager.add_model_annotation;
	    if( entity_op == 'remove' ){
		delfun = manager.remove_model_annotation;
	    }
	    delfun(model_id, ann_key, ann_val);
	}
    }	
	    
    var mdl = null;
    if( ! entity ){
	alert('unknown id:' + entity_id);
    }else{
	
	// Create add button.
	var add_evi_btn_args = {
    	    'generate_id': true,
    	    'type': 'button',
    	    'class': 'btn btn-success'
	};
	var add_evi_btn = new tag('button', add_evi_btn_args, 'Add');

	var evi_text_args = {
    	    'generate_id': true,
    	    'type': 'text',
    	    'class': 'form-control',
    	    'placeholder': 'Enter evidence type'
	};
	var evi_text = new tag('input', evi_text_args);

	var ev_form = [
    	    '<div class="form-inline">',
    	    '<div class="form-group">',
	    evi_text.to_string(),
    	    '</div>',
    	    add_evi_btn.to_string(),
    	    '</div>'
	];
	
	// Create add button.
	var add_src_btn_args = {
    	    'generate_id': true,
    	    'type': 'button',
    	    'class': 'btn btn-success'
	};
	var add_src_btn = new tag('button', add_src_btn_args, 'Add');

	var src_text_args = {
    	    'generate_id': true,
    	    'type': 'text',
    	    'class': 'form-control',
    	    'placeholder': 'Enter reference type'
	};
	var src_text = new tag('input', src_text_args);

	var src_form = [
    	    '<div class="form-inline">',
    	    '<div class="form-group">',
	    src_text.to_string(),
    	    '</div>',
    	    add_src_btn.to_string(),
    	    '</div>'
	];
	
	// Buttons need to be generated first.
	// Create delete button.
	var add_cmm_btn_args = {
    	    'generate_id': true,
    	    'type': 'button',
    	    'class': 'btn btn-success'
	};
	var add_cmm_btn = new tag('button', add_cmm_btn_args, 'Add');
	
	var cmm_text_args = {
    	    'generate_id': true,
    	    'type': 'button',
    	    'class': 'form-control',
    	    'placeholder': 'Add comment...',
    	    'rows': '2'
	};
	var cmm_text = new tag('textarea', cmm_text_args);
	
	var cmm_form = [
	    '<div>',
	    '<div class="form-group">',
	    cmm_text.to_string(),
	    '</div>',
	    add_cmm_btn.to_string(),
	    '</div>'
	];
		
	// See what annotation information is around. Start with just
	// comments and evidence.
	// var elt2ann = {};
	var cache = {
	    'comment': {
		elt2ann: {},
		list: [],
		string: '???'
	    },
	    'source': {
		elt2ann: {},
		list: [],
		string: '???'
	    },
	    'evidence': {
		elt2ann: {},
		list: [],
		string: '???'
	    }
	};
	each(bbop.core.get_keys(cache),
	     function(key){
		 each(entity.get_annotations_by_filter(
			  function(ann){
			      var ret = false;
			      if( ann.property(key) ){ ret = true; }
			      return ret;
			  }),
		      function(ann){
			  var kval = ann.property(key);
			  var kid = bbop.core.uuid();
			  cache[key]['elt2ann'][kid] = ann.id();
			  var acache = [];
			  acache.push('<li class="list-group-item">');
			  acache.push(kval);
			  acache.push('<span id="'+ kid +'" class="badge app-delete-mark">X</span>');
			  acache.push('</li>');
			  cache[key]['list'].push(acache.join(''));
		      });    
		 var str = '<li class="list-group-item">none</li>';
		 if( cache[key]['list'].length > 0 ){
		     str = cache[key]['list'].join('');
		 }
		 cache[key]['string'] = str;
	     });

	//
	var tcache = [
	    '<h4>Evidence</h4>',
	    '<p>',
	    '<ul class="list-group">',
	    cache['evidence']['string'],
	    '</ul>',
	    '</p>',
	    ev_form.join(''),
	    '<h4>Source</h4>',
	    '<p>',
	    '<ul class="list-group">',
	    cache['source']['string'],
	    '</ul>',
	    '</p>',
	    src_form.join(''),
	    '<h4>Comments</h4>',
	    '<p>',
	    '<ul class="list-group">',
	    cache['comment']['string'],
	    '</ul>',
	    '</p>',
	    cmm_form.join('')
	];
	
	// Setup base modal.
	mdl = new bbop_mme_widgets.contained_modal('dialog','Annotations for: ' +
						   entity_title);
	mdl.add_to_body(tcache.join(''));
	
	// Add delete annotation actions. These are completely generic--
	// all annotations can be deleted in the same fashion.
	each(bbop.core.get_keys(cache),
	     function(ann_key){
		 each(cache[ann_key]['elt2ann'],
		      function(elt_id, ann_id){
			  jQuery('#' + elt_id).click(
			      function(evt){
				  evt.stopPropagation();
			 
				  //var annid = elt2ann[elt_id];
				  //alert('blow away: ' + annid);
				  var ann = entity.get_annotation_by_id(ann_id);
				  var ann_val = ann.property(ann_key);
				  _ann_dispatch(entity, entity_type, 'remove',
						ecore.get_id(),ann_key, ann_val);
			 
				  // Wipe out modal.
				  mdl.destroy();
			      });
		      });
	     });
	
	// Add add evidence action.
	jQuery('#' + add_evi_btn.get_id()).click(
	    function(evt){
		evt.stopPropagation();
		
		var val = jQuery('#' + evi_text.get_id()).val();
		if( val && val != '' ){
		    _ann_dispatch(entity, entity_type, 'add',
				  ecore.get_id(), 'evidence', val);
		}else{
		    alert('no evidence added for' + entity_id);
		}
		
		// Wipe out modal.
		mdl.destroy();
	    });	

	// Add add source action.
	jQuery('#' + add_src_btn.get_id()).click(
	    function(evt){
		evt.stopPropagation();
		
		var val = jQuery('#' + src_text.get_id()).val();
		if( val && val != '' ){
		    _ann_dispatch(entity, entity_type, 'add',
				  ecore.get_id(), 'source', val);
		}else{
		    alert('no source added for' + entity_id);
		}
		
		// Wipe out modal.
		mdl.destroy();
	    });	

	// Add add comment action.
	jQuery('#' + add_cmm_btn.get_id()).click(
	    function(evt){
		evt.stopPropagation();
		
		var val = jQuery('#' + cmm_text.get_id()).val();
		if( val && val != '' ){
		    _ann_dispatch(entity, entity_type, 'add',
				  ecore.get_id(), 'comment', val);
		}else{
		    alert('no comment added for' + entity_id);
		}
		
		// Wipe out modal.
		mdl.destroy();	    
	    });	

	// Add autocomplete box for ECO to evidence box.
	var eco_auto_args = {
    	    'label_template':'{{annotation_class_label}} ({{annotation_class}})',
    	    'value_template': '{{annotation_class}}',
    	    'list_select_callback': function(doc){}
	};
	var eco_auto =
	    new bbop.widget.search_box(gserv, gconf, evi_text.get_id(),
				       eco_auto_args);
	eco_auto.add_query_filter('document_category', 'ontology_class');
	eco_auto.add_query_filter('source', 'eco', ['+']);
	eco_auto.set_personality('ontology');

    }

    // Return our final product.
    return mdl;
};

/*
 * Object.
 * 
 * Output formatted commentary to element.
 */
bbop_mme_widgets.reporter = function(output_id){

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
	var new_list_id = bbop.core.uuid();
	list_elt = '#' + new_list_id;
	jQuery(output_elt).append('<ul id="' + new_list_id + '"></ul>');
    };

    this.comment = function(message){
	
	// Try and set some defaults.
	var uid = null;
	var color = null;
	if( message ){
	    uid = message['user_name']
		|| message['user_email']
		|| message['socket_id'];
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
	var intent = message['intention'] || '???';
	var sig = message['signal'] || '???';
	var mess = message['message'] || '???';
	var mess_type = message['message_type'] || '???';

	// make a sensible message.
	if( mess_type == 'error' ){
	    out += mess_type + ': there was a problem: ' + mess; 
	}else{
	    if( sig == 'merge' || sig == 'rebuild' ){
		if( intent == 'query' ){
		    out += mess_type + ': they likely refreshed';		
		}else{		    
		    out += 'performed  <span class="bbop-mme-message-op">' +
			intent + '</span> (' + mess + '), ' +
			'<span class="bbop-mme-message-req">' +
			'you should refresh' + '</span>';
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
};
