////
//// Namespace for large drawing routines.
////

var bbop_mme_widgets = {};

// Add edit model contents to descriptive table.
bbop_mme_widgets.repaint_table = function(ecore, aid, table_div){

    var each = bbop.core.each;

    // First, lets get the headers that we'll need by poking the
    // model and getting all of the possible categories.	
    var cat_list = [];
    each(ecore.get_edit_nodes(),
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
		 nav_tbl_headers.push(aid.readable(cat_id));
	     });
	
	//	var nav_tbl_headers = cat_list;
	//	    ['enabled&nbsp;by', 'activity', 'unknown', 'process', 'location'];
	
	var nav_tbl =
	    new bbop.html.table(nav_tbl_headers, [],
				{'class': ['table', 'table-bordered',
					   'table-hover',
					   'table-condensed'].join(' ')});
	
	//each(ecore.get_edit_nodes(),
	each(ecore.edit_node_order(),
	     function(enode_id){
		 var enode = ecore.get_edit_node(enode_id);
		 if( enode.existential() == 'real' ){
		     
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
				       var tt = bme_type_to_text(atype);
				       cell_cache.push(tt);
				   });
			      table_row.push(cell_cache.join('<br />'));
			  });
		     nav_tbl.add_to(table_row);		     
		 }
	     });
	
	// Add to display.
	jQuery(table_div).empty();
	jQuery(table_div).append(nav_tbl.to_string());
    }
};

bbop_mme_widgets.wipe = function(div){
    jQuery(div).empty();
};

bbop_mme_widgets.add_virtual_node = function(ecore, enode, aid, graph_div){

    var div_id = ecore.get_edit_node_elt_id(enode.id());
    var style_str =
	'top: ' + enode.y_init() + 'px; ' +
	'left: ' + enode.x_init() + 'px;';
    var v = new bbop.html.tag('div',
    			      {'id': div_id,
    			       'class': 'waypoint',
    			       'style': style_str});
    jQuery(graph_div).append(v.to_string());
};

bbop_mme_widgets.add_enode = function(ecore, enode, aid, graph_div){

    var each = bbop.core.each;

    // Node as table nested into bbop.html div.
    var div_id = ecore.get_edit_node_elt_id(enode.id());
    var style_str = 'top: ' + enode.y_init() + 'px; ' + 
	'left: ' + enode.x_init() + 'px;';
    //ll('style: ' + style_str);
    var w = new bbop.html.tag('div',
			      {'id': div_id,
			       'class': 'demo-window',
			       'style': style_str});
    
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
    var enode_stack_table = new bbop.html.tag('table', {});
    each(_enode_to_stack(enode),
	 function(item){
	     var trstr = '<tr style="background-color: ' +
		 aid.color(item['category']) + ';"><td>' 
		 + bme_type_to_text(item['type']) + '</td></tr>';   
	     enode_stack_table.add_to(trstr);
	 });
    w.add_to(enode_stack_table);
    
    // Box to drag new connections from.	
    var konn = new bbop.html.tag('div', {'class': 'konn'});
    w.add_to(konn);
    
    // Box to drag new connections from.	
    var opend = new bbop.html.tag('div', {'class': 'open-dialog'});
    w.add_to(opend);
    
    jQuery(graph_div).append(w.to_string());
};

bbop_mme_widgets.render_edge_modal = function(aid, modal_edge_title_elt,
					      modal_edge_body_elt,
					     source_id, target_id){
    var each = bbop.core.each;

    // Get a sorted list of known rels.
    var rels = aid.all_known();
    rels = rels.sort(
	function(a,b){ 
	    return aid.priority(b) - aid.priority(a);
	});
    var rellist = [];
    each(rels,
	 function(rel){
	     rellist.push([rel, aid.readable(rel)]);
	 });
    
    // Assemble modal content.
    var mete = modal_edge_title_elt;
    var mebe = modal_edge_body_elt;
    jQuery(mete).empty();
    jQuery(mete).append('Add Edge');
    jQuery(mebe).empty();
    jQuery(mebe).append('<h4>Relation selection</h4>');
    jQuery(mebe).append('<b>Edge source:</b> ' +
			source_id);
    jQuery(mebe).append('<br />');
    jQuery(mebe).append('<b>Edge target:</b> ' +
			target_id);
    var tcache = [];
    each(rellist,
	 function(tmp_rel, rel_ind){
	     tcache.push('<div class="radio"><label>');
	     tcache.push('<input type="radio" ');
	     tcache.push('name="rel_val" ');
	     tcache.push('value="' + tmp_rel[1] +'"');
	     if( rel_ind == 0 ){
		 tcache.push('checked>');
	     }else{
				       tcache.push('>');
	     }
	     tcache.push(tmp_rel[1] + ' ');
	     tcache.push('(' + tmp_rel[0] + ')');
	     tcache.push('</label></div>');
	     
	 });
    
    // Put up modal shield.
    jQuery(modal_edge_body_elt).append(tcache.join(''));
};