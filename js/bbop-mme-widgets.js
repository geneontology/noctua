////
//// Namespace for large drawing routines.
////

var bbop_mme_widgets = {};

// Add edit model node contents to a descriptive table.
bbop_mme_widgets.repaint_info = function(ecore, aid, info_div){

    // Node and edge counts.
    var nds = bbop.core.get_keys(ecore.get_nodes()) || [];
    var eds = bbop.core.get_keys(ecore.get_edges()) || [];

    // Any annotation information that came in.
    var anns = '';
    bbop.core.each(ecore.annotations(),
		   function(ann){
		       if( ann['comment'] ){
			   anns += '<dd>' + ann['comment'] + '</dd>';
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
		      cat_list.push(aid.categorize(in_type));
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
	
	// Sort list according to known priorities.
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
			  var cat = aid.categorize(in_type);
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
				   var tt = bme_type_to_text(atype, aid);
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

// bbop_mme_widgets.add_virtual_node = function(ecore, enode, aid, graph_div){

//     var div_id = ecore.get_node_elt_id(enode.id());
//     var style_str =
// 	'top: ' + enode.y_init() + 'px; ' +
// 	'left: ' + enode.x_init() + 'px;';
//     var v = new bbop.html.tag('div',
//     			      {'id': div_id,
//     			       'class': 'waypoint',
//     			       'style': style_str});
//     jQuery(graph_div).append(v.to_string());
// };

bbop_mme_widgets.render_node_stack = function(enode, aid){

    var each = bbop.core.each;

    // Takes a core edit node as the argument, categorize the
    // contained types, order them.
    function _enode_to_stack(enode){
	
	// Attach a category to each type.
	var bin_stack = [];
	each(enode.types(),
	     function(in_type){
		 var bin = aid.categorize(in_type);
		 bin_stack.push({'category': bin, 'type': in_type});
	     });
	
	// Sort the types within the stack according to the known
	// type priorities.
	bin_stack = bin_stack.sort(
	    function(a, b){
		return aid.priority(b) - aid.priority(a);
	    });
	
	return bin_stack;
    }
    
    // Create a colorful label stack into an individual table.
    var enode_stack_table = new bbop.html.tag('table',
					      {'class':'bbop-mme-stack-table'});
    each(_enode_to_stack(enode),
	 function(item){
	     var trstr = '<tr class="bbop-mme-stack-tr" ' +
		 'style="background-color: ' +
		 aid.color(item['category']) +
		 ';"><td class="bbop-mme-stack-td">' 
		 + bme_type_to_text(item['type'], aid) + '</td></tr>';   
	     enode_stack_table.add_to(trstr);
	 });

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
    
    // Box to drag new connections from.	
    var opend = new bbop.html.tag('div', {'class': 'open-dialog'});
    w.add_to(opend);
    
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
    //var rels = aid.all_entities();
    var rels = relations.sort(
	function(a,b){ 
	    var rid_a = a['id'];
	    var rid_b = b['id'];
	    return aid.priority(rid_b) - aid.priority(rid_a);
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
bbop_mme_widgets.edit_node_modal = function(ecore, manager, enode){
    var each = bbop.core.each;
    var tag = bbop.html.tag;

    // Start with ID.
    var tid = enode.id();

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

    // // Create delete button.
    // var add_evi_btn_args = {
    // 	'generate_id': true,
    // 	'type': 'button',
    // 	'class': 'btn btn-success'
    // };
    // var add_evi_btn = new tag('button', add_evi_btn_args, 'Add');

    // Create delete button.
    var del_btn_args = {
    	'generate_id': true,
    	'type': 'button',
    	'class': 'btn btn-danger'
    };
    var del_btn = new tag('button', del_btn_args, 'Delete');

    // See what annotation information is around. Start with just
    // comments and evidence.
    var elt2ann = {};
    var cache = {'comment': [], 'evidence': []};
    each(bbop.core.get_keys(cache),
	 function(key){
	     each(enode.get_annotations_by_filter(
		      function(ann){
			  var ret = false;
			  if( ann.property(key) ){ ret = true; }
			  return ret;
		      }),
		  function(ann){
		      var kval = ann.property(key);
		      var acache = [];
		      var kid = bbop.core.uuid();
		      elt2ann[kid] = ann.id();
		      acache.push('<li class="list-group-item">');
		      acache.push(kval);
		      acache.push('<span id="'+ kid +'" class="badge app-delete-mark">X</span>');
		      acache.push('</li>');
		      cache[key].push(acache.join(''));
		  });    
	 });
    var cms_str = '<li class="list-group-item">none</li>';
    if( cache['comment'].length > 0 ){
	cms_str = cache['comment'].join('');
    }
    // var ev_str = 'none';
    // //if( cache['comment'].length > 0 ){ ev_str = cache['comment'].join(' '); }

    // var ev_frm = [
    // 	'<div class="form-inline">',
    // 	'<div class="form-group">',
    // 	'<input type="text" class="form-control" id="bar" placeholder="Enter evidence" />',
    // 	'</div>',
    // 	'<button class="btn btn-success">Add</button>',
    // 	'</div>'
    // ];

    //
    var tcache = [
	'<h4>Comments</h4>',
	'<p>',
	'<ul class="list-group">',
	cms_str,
	'</ul>',
	'</p>',
	cmm_form.join(''),
	'<hr />',
	// '<h4>Evidence</h4>',
	// '<p>',
	// ev_frm.join(''),
	// '</p>',
	// '<hr />',
	'<h4>Operations</h4>',
	'<p>',
	del_btn.to_string(),
	'&nbsp;this individual',
	'</p>'
    ];

    // Setup base modal.
    var mdl = new bbop_mme_widgets.contained_modal('dialog',
						   'Edit Instance: ' + tid);
    mdl.add_to_body(tcache.join(''));

    // Add delete comment actions.
    each(elt2ann,
	 function(elt_id){
	     jQuery('#' + elt_id).click(
		 function(evt){
		     evt.stopPropagation();
		     
		     var annid = elt2ann[elt_id];
		     //alert('blow away: ' + annid);
		     var ann = enode.get_annotation_by_id(annid);
		     var ann_cmm = ann.property('comment');
		     manager.delete_individual_annotation(ecore.get_id(), tid,
							  'comment', ann_cmm);
		     
		     // Wipe out modal.
		     mdl.destroy();
		 });
	 });

    // Add add comment action.
    jQuery('#' + add_cmm_btn.get_id()).click(
	function(evt){
	    evt.stopPropagation();
	    
	    var cmm = jQuery('#' + cmm_text.get_id()).val();
	    if( cmm && cmm != '' ){
		// Trigger the addition.
		//alert('add to ' + tid + ' comment: ' + cmm);
		manager.add_individual_annotation(ecore.get_id(), tid,
						  'comment', cmm);
	    }else{
		alert('no comment added for' + tid);
	    }

	    // Wipe out modal.
	    mdl.destroy();	    
	});
    
    // Add delete action.
    jQuery('#' + del_btn.get_id()).click(
	function(evt){
	    evt.stopPropagation();
	    // ll('deleteing node: ' + tid);
	    //alert('node deletion not yet supported on the server');

	    // Trigger the delete--hopefully inconsistent.
	    manager.remove_individual(ecore.get_id(), tid);

	    // Wipe out modal.
	    mdl.destroy();	    
	});
    
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

    this.comment = function(str, uid, color){
	var out = '<li>';
	out += _date_str() + ': ';
	if( uid && color ){
	    out += '<span class="bbop-mme-message-uid" style="color:' +
		color + ';">'+ uid + '</span>: ';
	}else if( uid ){
	    out += '<span class="bbop-mme-message-uid">'+ uid + '</span>: ';
	}
	out += str;
	out += '</li>';

	// Actually do it.
	jQuery(list_elt).prepend(out);
    };

    // this.heard_op = function(op, uid, color){
    // 	var out = '<li>';
    // 	out += _date_str() + ': ';

    // 	var msg = [
    // 	    'completed op ',
    // 	    '<span class="bbop-mme-message-op">',
    // 	    op,
    // 	    '</span>'
    // 	];
    // 	if( op == 'inconsistent' || op == 'merge' ){
    // 	    msg.push(', <span class="bbop-mme-message-req">you should refresh</span>'); 
    // 	}

    // 	out += msg.join('');
    // 	out += '</li>';

    // 	// Actually do it.
    // 	jQuery(list_elt).prepend(out);
    // };

    // Initialize.
    this.reset();
};