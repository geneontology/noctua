///
/// Core edit model. Essentially several sets and an order.
/// This is meant to be changed when we get a richer model working,
/// but for the prototype, I don't want to lock in to the bbop
/// graph model, so I'm using something much dumber than can
/// be easily wrapped or changed later, but still have some editing
/// options.
///

// // Support CommonJS if it looks like that's how we're rolling.
// if( typeof(exports) != 'undefined' ){
//     var
// }

// BUG/TODO:
// Temporary cleansing until 
var bme_context = new bbop.context(amigo.data.context);
var bme_clean = function(str){
    //return bme_context.cleanse(str);  
    return str;
};

var bbop_mme_edit = {};

/*
 * Edit annotations.
 * Everything can take annotations.
 * 
 * Parameters:
 *  kv_set - *[optional]* a set of keys and values; a simple object
 */
bbop_mme_edit.annotation = function(kv_set){
    this._id = bbop.core.uuid();

    this._properties = {};

    if( kv_set && bbop.core.what_is(kv_set) == 'object' ){
	this._properties = bbop.core.clone(kv_set);
    }
};

bbop_mme_edit.annotation.prototype.id = function(){ return this._id; };

bbop_mme_edit.annotation.prototype.property = function(key, value){

    var anchor = this;
    var ret = null;

    // Set if the key and value are there.
    if( key ){
	if( typeof(value) !== 'undefined' ){
	    anchor._properties[key] = value;
	}
	ret = anchor._properties[key];
    }

    return ret;
};

bbop_mme_edit.annotation.prototype.delete_property = function(key){

    var anchor = this;
    var ret = null;

    if( key ){
	ret = delete anchor._properties[key];
    }

    return ret;
};

///
/// Generic annotation operations
///

bbop_mme_edit._annotations = function(in_ann){
    if( in_ann && bbop.core.what_is(in_ann) == 'array' ){
	this._annotations = in_ann;
    }
    return this._annotations;
};
bbop_mme_edit._add_annotation = function(in_ann){
    if( in_ann && bbop.core.what_is(in_ann) != 'array' ){
	this._annotations.push(in_ann);
    }
    return this._annotations;
};
bbop_mme_edit._get_annotations_by_filter = function(filter){

    var anchor = this;
    var ret = [];
    bbop.core.each(anchor._annotations,
		  function(ann){
		      var res = filter(ann);
		      if( res && res == true ){
			  ret.push(ann);
		      }
		  });
    return ret;
};
bbop_mme_edit._get_annotation_by_id = function(aid){

    var anchor = this;
    var ret = null;
    bbop.core.each(anchor._annotations,
		  function(ann){
		      if( ann.id() == aid ){
			  ret = ann;
		      }
		  });
    return ret;
};

/*
 *  Edit control.
 * 
 * Parameters:
 *  n/a
 */
bbop_mme_edit.core = function(){
    this.core = {
	//'id': [], // currently optional
	'id': null, // currently optional
	'nodes': {}, // map of id to edit_node
	'edges': {}, // map of id to edit_edge
	'node_order': [], // initial table order on redraws
	'node2elt': {}, // map of id to physical object id
	'elt2node': {},  // map of physical object id to id
	// Remeber that edge ids and elts ids are the same, so no map
	// is needed.
	'edge2connector': {}, // map of edge id to virtual connector id
	'connector2edge': {}  // map of virtual connector id to edge id 
    };

    this._annotations = [];
};

bbop_mme_edit.core.prototype.add_id = function(id){
    // TODO: make this smarter/useful
    //this.core['id'].push(id);
    this.core['id'] = id;
    return this.core['id'];
};

bbop_mme_edit.core.prototype.get_id = function(){
    return this.core['id'];
};

bbop_mme_edit.core.prototype.add_node = function(enode){

    // Add/update node.
    var enid = enode.id();
    this.core['nodes'][enid] = enode; // add to nodes

    // Only create a new elt ID and order if one isn't already in
    // there (or reuse things to keep GUI working smoothly).
    var elt_id = this.core['node2elt'][enid];
    if( ! elt_id ){ // first time
	this.core['node_order'].unshift(enid); // add to default order
	elt_id = bbop.core.uuid(); // generate the elt id we'll use from now on
	this.core['node2elt'][enid] = elt_id; // map it
	this.core['elt2node'][elt_id] = enid; // map it	
    }
};

// Convert the JSON-LD lite model into the edit core.
// Creates or adds as necessary.
bbop_mme_edit.core.prototype.add_node_from_individual = function(indv){
    var anchor = this;

    var ret = null;

    // Add individual to edit core if properly structured.
    var iid = indv['id'];
    if( iid ){
	//var nn = new bbop.model.node(indv['id']);
	//var meta = {};
	//ll('indv');
	
	// See if there is type info that we want to add.
	var itypes = indv['type'] || [];
	if( bbop.core.what_is(itypes) != 'array' ){
	    throw new Error('types is wrong');
	}

	// Create the node.
	var ne = new bbop_mme_edit.node(iid, itypes, ianns);

	// See if there is type info that we want to add.
	var ianns = indv['annotations'] || [];
	if( bbop.core.what_is(ianns) != 'array' ){
	    throw new Error('annotations is wrong');
	}else{
	    // Add the annotations individually.
	    bbop.core.each(ianns,
			   function(ann_kv_set){
			       var na = new bbop_mme_edit.annotation(ann_kv_set);
			       ne.add_annotation(na);
			   });
	}

	anchor.add_node(ne);
	ret = ne;
    }
    
    return ne;
};

bbop_mme_edit.core.prototype.edit_node_order = function(){
    return this.core['node_order'] || [];
};

bbop_mme_edit.core.prototype.get_node = function(enid){
    return this.core['nodes'][enid] || null;
};

bbop_mme_edit.core.prototype.get_node_elt_id = function(enid){
    return this.core['node2elt'][enid] || null;
};

bbop_mme_edit.core.prototype.get_node_by_elt_id = function(elt_id){
    var ret = null;
    var enid = this.core['elt2node'][elt_id] || null;
    if( enid ){
	ret = this.core['nodes'][enid] || null;
    }
    return ret;
};

bbop_mme_edit.core.prototype.get_node_by_individual = function(indv){
    var anchor = this;

    var ret = null;

    // Add individual to edit core if properly structured.
    var iid = indv['id'];
    if( iid ){	
	ret = this.core['nodes'][iid] || null;
    }
    
    return ret;
};

bbop_mme_edit.core.prototype.get_nodes = function(){
    return this.core['nodes'] || {};
};

bbop_mme_edit.core.prototype.remove_node = function(enid){

    var anchor = this;

    if( this.core['nodes'][enid] ){
	var enode = this.core['nodes'][enid];

	// Removing node removes all related edges.
	// TODO: Dumb scan right now.
	bbop.core.each(this.core['edges'],
		       function(edge_id, edge){
			   if( edge.source() == enid || edge.target() == enid ){
			       var eeid = edge.id();
			       anchor.remove_edge(eeid);
			   }
		       });
	
	// Also remove the node from the order list.
	// TODO: Is this a dumb scan?
	var ni = this.core['node_order'].indexOf(enid);
	if( ni != -1 ){
	    this.core['node_order'].splice(ni, 1);
	}

	// Clean the maps.
	var elt_id = this.core['node2elt'][enid];
	delete this.core['node2elt'][enid];
	delete this.core['elt2node'][elt_id];

	// Finally, remove the node itself.
	delete this.core['nodes'][enid];
    }
};

bbop_mme_edit.core.prototype.add_edge = function(eedge){
    var eeid = eedge.id();
    this.core['edges'][eeid] = eedge;
    var elt_id = bbop.core.uuid(); // generate the elt id we'll use
    //this.core['edge2elt'][eeid] = elt_id; // map it
    //this.core['elt2edge'][elt_id] = eeid; // map it
};

// 
bbop_mme_edit.core.prototype.add_edge_from_fact = function(fact, aid){

    var anchor = this;
    var each = bbop.core.each;

    var ret_fact = null;
    
    // Add individual to edit core if properly structured.
    var sid = fact['subject'];
    var oid = fact['object'];
    var pid = fact['property'];
    var anns = fact['annotations'] || [];
    if( sid && oid && pid ){

	var en = new bbop_mme_edit.edge(sid, pid, oid, anns);
	if( bbop.core.what_is(anns) != 'array' ){
	    throw new Error('annotations is wrong');
	}else{
	    // Add the annotations individually.
	    bbop.core.each(anns,
			   function(ann_kv_set){
			       var na = new bbop_mme_edit.annotation(ann_kv_set);
			       en.add_annotation(na);
			   });
	}

	// Add and ready to return edge.
	anchor.add_edge(en);
	ret_fact = en;
    }
    
    return ret_fact;
};

// // TODO/BUG: aid is used as a crutch here to scan out the edges
// bbop_mme_edit.core.prototype.add_edges_from_individual = function(indv, aid){

//     var anchor = this;
//     var each = bbop.core.each;

//     var ret_facts = [];
    
//     // Add individual to edit core if properly structured.
//     var iid = indv['id'];
//     if( iid ){
// 	// Now, let's probe the model to see what edges
// 	// we can find.
// 	var possible_rels = aid.all_known();
// 	each(possible_rels,
// 	     function(try_rel){
// 		 if( indv[try_rel] && indv[try_rel].length ){
		     
// 		     // Cycle through each of the found
// 		     // rels.
// 		     var found_rels = indv[try_rel];
// 		     each(found_rels,
// 			  function(rel){
// 			      var tid = rel['id'];
// 			      var rt = rel['type'];
// 			      if( tid && rt && rt == 'NamedIndividual'){
// 				  var en =
// 				      new bbop_mme_edit.edge(iid, try_rel, tid);
// 				  anchor.add_edge(en);
// 				  ret_facts.push(en);
// 			      }
// 			  });
// 		 }
// 	     });
//     }
    
//     return ret_facts;
// };

bbop_mme_edit.core.prototype.get_edge_id_by_connector_id = function(cid){
    return this.core['connector2edge'][cid] || null;
};

bbop_mme_edit.core.prototype.get_connector_id_by_edge_id = function(eid){
    return this.core['edge2connector'][eid] || null;
};

// // Get all of the edges by individual.
// bbop_mme_edit.core.prototype.get_edges_by_individual = function(indv){

//     var anchor = this;
//     var each = bbop.core.each;

//     var ret_facts = [];
    
//     // Add individual to edit core if properly structured.
//     var iid = indv['id'];
//     if( iid ){
// 	// Now, let's probe the model to see what edges
// 	// we can find.
// 	var possible_rels = aid.all_known();
// 	each(possible_rels,
// 	     function(try_rel){
// 		 if( indv[try_rel] && indv[try_rel].length ){
		     
// 		     // Cycle through each of the found
// 		     // rels.
// 		     var found_rels = indv[try_rel];
// 		     each(found_rels,
// 			  function(rel){
// 			      var tid = rel['id'];
// 			      var rt = rel['type'];
// 			      if( tid && rt && rt == 'NamedIndividual'){
// 				  var en =
// 				      new bbop_mme_edit.edge(iid, try_rel, tid);
// 				  anchor.add_edge(en);
// 				  ret_facts.push(en);
// 			      }
// 			  });
// 		 }
// 	     });
//     }
    
//     return ret_facts;
// };

bbop_mme_edit.core.prototype.get_edge = function(eeid){
    return this.core['edges'][eeid] || null;
};

bbop_mme_edit.core.prototype.get_edges = function(){
    return this.core['edges'] || [];
};

/*
 * Function: 
 * 
 * Return a list of edges that are concerned with the nodes as source.
 */
bbop_mme_edit.core.prototype.get_edges_by_source = function(srcid){

    var rete = [];
    bbop.core.each(this.core['edges'],
		   function(edge_id, edge){
		       var src = edge.source();
		       if( src == srcid ){
			   rete.push(edge);
		       }
		   });

    return rete;
};

/*
 * Function: 
 * 
 * Return a list of edges that are concerned with the nodes as target.
 */
bbop_mme_edit.core.prototype.get_edges_by_target = function(tgtid){

    var rete = [];
    bbop.core.each(this.core['edges'],
		   function(edge_id, edge){
		       var tgt = edge.target();
		       if( tgt == tgtid ){
			   rete.push(edge);
		       }
		   });

    return rete;
};

bbop_mme_edit.core.prototype.remove_edge = function(eeid){
    if( this.core['edges'][eeid] ){

	// Main bit out.
	delete this.core['edges'][eeid];

	// And clean the maps.
	var cid = this.core['edge2connector'][eeid];
	delete this.core['edge2connector'][eeid];
	delete this.core['connector2edge'][cid];
    }
};

bbop_mme_edit.core.prototype.create_edge_mapping = function(eedge, connector){
    var eid = eedge.id();
    var cid = connector.id;
    this.core['edge2connector'][eid] = cid;
    this.core['connector2edge'][cid] = eid;
};

// Debugging text output function.
bbop_mme_edit.core.prototype.dump = function(){

    //
    var dcache = [];
    
    bbop.core.each(this.core['nodes'],
		   function(node_id, node){

		       var ncache = ['node'];
		       ncache.push(node.id());
		       // ncache.push(node.enabled_by());
		       // ncache.push(node.activity());
		       // ncache.push(node.unknown().join('|'));
		       // ncache.push(node.process());
		       // ncache.push(node.location().join('|'));
		       dcache.push(ncache.join("\t"));
		   });
    
    bbop.core.each(this.core['edges'],
		   function(edge_id, edge){
		       var ecache = ['edge'];
		       ecache.push(edge.source());
		       ecache.push(edge.relation());
		       ecache.push(edge.target());
		       dcache.push(ecache.join("\t"));
		   });
    
    return dcache.join("\n");
};

// Return gross high-level topology.
bbop_mme_edit.core.prototype.to_graph = function(){

    // 
    var ex_graph = new bbop.model.graph();
    
    // Add nodes.
    bbop.core.each(this.core['nodes'],
		   function(node_id, node){

		       // Create node.
		       var ex_node = new bbop.model.node(node_id);
		       //ex_node.metadata(ex_meta);

		       // Add to export graph.
		       ex_graph.add_node(ex_node);
		   });
    
    // Add edges to the export graph.
    bbop.core.each(this.core['edges'],
		   function(edge_id, edge){
		       //
		       var ex_edge = new bbop.model.edge(edge.source(),
							 edge.target(),
							 edge.relation());
		       ex_graph.add_edge(ex_edge);
		   });
    
    return ex_graph;
};

// Add annotation operations to prototype.
bbop_mme_edit.core.prototype.annotations =
    bbop_mme_edit._annotations;
bbop_mme_edit.core.prototype.add_annotation =
    bbop_mme_edit._add_annotation;
bbop_mme_edit.core.prototype.get_annotations_by_filter =
    bbop_mme_edit._get_annotations_by_filter;
bbop_mme_edit.core.prototype.get_annotation_by_id =
    bbop_mme_edit._get_annotation_by_id;

/**
 * Edit types.
 * 
 * A *very* simplified version of types, with just enough so that we
 * aren't constantly trying to work with them endlessly elsewhere in
 * the code.
 * 
 * Types can be: Class and the class expressions: SVF, union, and
 * intersection.
 * 
 * Categories is more a graphical distinction. They can be:
 * instance_of, <relation id>, union, and intersection.
 * 
 * This model also incorporates whether or not the type is inferred. At this
 * level they are treated the say, but higher level may (must) treat them
 * as display decorations.
 *
 * Parameters:
 *  in_types - the raw type blob from the server
 *  inferred_p - whether or not the type is inferred (default false)
 */
bbop_mme_edit.type = function(in_type, inferred_p){

    var anchor = this;
    var each = bbop.core.each;

    // Initialize.
    this._raw_type = in_type;
    this._inferred_p = inferred_p || false;
    this._id = bbop.core.uuid();

    // Derived property defaults.
    this._type = null;
    this._category = 'unknown';
    this._class_id = null;
    this._class_label = null;
    this._property_id = null;
    this._property_label = null;
    // For recursive elements.
    //this._frame_type = null;
    this._frame = [];

    // Helpers.
    function _decide_type(type){
	var rettype = null;

	// Easiest case.
	var t = type['type'] || null;
	if( t == 'Class' ){
	    rettype = 'class';
	}else{
	    // Okay, we're dealing with a class expression...but which
	    // one? Talking to Heiko, these can be only one--they are
	    // not going to be mixed.
	    if( type['unionOf'] ){
		rettype = 'union';
	    }else if( type['intersectionOf'] ){
		rettype = 'intersection';
	    }else{
		// Leaving us with SVF.
		rettype = 'svf';
	    }
	}

	return rettype;
    }

    // Define the category, and build up an instant picture of what we
    // need to know about the property.
    var t = _decide_type(in_type);
    if( t == 'class' ){

	// Easiest to extract.
	this._type = t;
	this._category = 'instance_of';
	this._class_id = in_type['id'];
	this._class_label = in_type['label'] || this._class_id;
	// No related properties.
	
    }else if( t == 'union' || t == 'intersection' ){

	// These are simply recursive.
	this._type = t;
	this._category = t;

	// Load stuff into the frame.
	this._frame = [];
	// TODO: argh! hardcody
	var f_set = in_type[t + 'Of'] || [];
	each(f_set,
	     function(f_type){
		 anchor._frame.push(new bbop_mme_edit.type(f_type));
	     });
    }else{
	    
	// We're then dealing with an SVF: a property plus a class
	// expression. In the future there may be many things, but
	// for now we are expecting a "Restriction", although we don't
	// really do anything with that information (maybe later).
	this._type = t;
	// Extract the property information
	this._category = in_type['onProperty']['id'];
	this._property_id = in_type['onProperty']['id'];
	this._property_label =
	    in_type['onProperty']['label'] || this._property_id;	    

	// Okay, let's recur down the class expression. It should be
	// one, but we'll use the frame. Access should be though
	// svf_class_expression().
	var f_type = in_type['someValuesFrom'];
	this._frame = [new bbop_mme_edit.type(f_type)];
    }
};

/**
 * Function: id
 * 
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string
 */
bbop_mme_edit.type.prototype.id = function(){
    return this._id;
};

/**
 * Function: inferred_p
 * 
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  boolean
 */
bbop_mme_edit.type.prototype.inferred_p = function(){
    return this._inferred_p;
};

/**
 * Function: signature
 * 
 * A cheap way of identifying if two types are the same.
 * This essentially returns a string of the main attributes of a type.
 * It is meant to be semi-unique and collide with dupe inferences.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string
 */
bbop_mme_edit.type.prototype.signature = function(){
    var anchor = this;
    var each = bbop.core.each;

    var sig = [];

    // The easy ones.
    sig.push(anchor.category() || '');
    sig.push(anchor.type() || '');
    sig.push(anchor.class_id() || '');
    sig.push(anchor.property_id() || '');

    // And now recursively on frames.
    if( anchor.frame() ){
	each(anchor.frame(),
	     function(f){
		 sig.push(f.signature() || '');
	     });
    }

    return sig.join('_');
};

/** 
 * Function: category
 *
 * Try to put an instance type into some kind of rendering
 * category.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string (default 'unknown')
 */
bbop_mme_edit.type.prototype.category = function(){
    return this._category;
};

/** 
 * Function: type
 *
 * The "type" of the type.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbop_mme_edit.type.prototype.type = function(){
    return this._type;
};

/** 
 * Function: svf_class_expression
 *
 * The class expression when we are dealing with SVF.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  type or null
 */
bbop_mme_edit.type.prototype.svf_class_expression = function(){
    // Yes, a reuse of _frame.
    return this._frame[0] || null;
};

// /** 
//  * Function: frame_type
//  *
//  * If the type has a recursive frame, the "type" of said frame.
//  *
//  * Parameters: 
//  *  n/a
//  *
//  * Returns:
//  *  string or null
//  */
// bbop_mme_edit.type.prototype.frame_type = function(){
//     return this._frame_type;
// };

/** 
 * Function: frame
 *
 * If the type has a recursive frame, a list of the types it contains.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  list
 */
bbop_mme_edit.type.prototype.frame = function(){
    return this._frame;
};

/** 
 * Function: class_id
 *
 * The considered class id.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbop_mme_edit.type.prototype.class_id = function(){
    return this._class_id;
};

/** 
 * Function: class_label
 *
 * The considered class label, defaults to ID if not found.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbop_mme_edit.type.prototype.class_label = function(){
    return this._class_label;
};

/** 
 * Function: property_id
 *
 * The considered class property id.
 * Not defined for 'Class' types.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbop_mme_edit.type.prototype.property_id = function(){
    return this._property_id;
};

/** 
 * Function: property_label
 *
 * The considered class property label.
 * Not defined for 'Class' types.
 *
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string or null
 */
bbop_mme_edit.type.prototype.property_label = function(){
    return this._property_label;
};

/**
 * Edit nodes.
 * 
 * Parameters:
 *  in_id - *[optional]* generated if not given
 *  in_types - *[serially optional]*
 */
bbop_mme_edit.node = function(in_id, in_types){

    var anchor = this;

    this._types = [];
    this._id2type = {};
    this._annotations = [];

    if( typeof(in_id) === 'undefined' ){
	this._id = bbop.core.uuid();
    }else{
	//this._id = in_id;
	this._id = bme_clean(in_id);
    }
    if( typeof(in_types) !== 'undefined' ){
	bbop.core.each(in_types,
		       function(in_type){
			   var new_type = new bbop_mme_edit.type(in_type);
			   anchor._id2type[new_type.id()] = new_type;
			   anchor._types.push(new bbop_mme_edit.type(in_type));
		       });
    }
    
    // Optional layout hints.
    this._x_init = null; // initial layout hint
    this._y_init = null;
    // this.xlast = null; // last known location
    // this.ylast = null;
};

// (possibly generated) ID is RO
bbop_mme_edit.node.prototype.id = function(value){
    return this._id; };

/**
 * Function: types
 * 
 * Get current types; replace current types.
 * 
 * Parameters:
 *  in_types - *[optional]* raw JSON type objects
 * 
 * Returns:
 *  array
 */
bbop_mme_edit.node.prototype.types = function(in_types){
    var anchor = this;    

    if( in_types && bbop.core.what_is(in_types) == 'array' ){

	// Wipe previous type set.
	anchor._id2type = {};
	anchor._types = [];

	bbop.core.each(in_types,
		       function(in_type){
			   var new_type = new bbop_mme_edit.type(in_type);
			   anchor._id2type[new_type.id()] = new_type;
			   anchor._types.push(new_type);
		       });
    }
    return this._types;
};

/**
 * Function: add_types
 * 
 * Add types to current types.
 * 
 * Parameters:
 *  in_types - raw JSON type objects
 *  inferred_p - whether or not the argument types are inferred
 * 
 * Returns:
 *  boolean
 */
bbop_mme_edit.node.prototype.add_types = function(in_types, inferred_p){
    var anchor = this;    
    var inf_p = inferred_p || false;

    var ret = false;

    if( in_types && bbop.core.what_is(in_types) == 'array' ){
	bbop.core.each(in_types,
		       function(in_type){
			   var new_type = new bbop_mme_edit.type(in_type, inf_p);
			   anchor._id2type[new_type.id()] = new_type;
			   anchor._types.push(new_type);

			   ret = true; // return true if did something
		       });
    }
    return ret;
};

/**
 * Function: get_type_by_id
 * 
 * Get the 
 * 
 * Parameters:
 *  type_id - type id
 * 
 * Returns:
 *  type or null
 */
bbop_mme_edit.node.prototype.get_type_by_id = function(type_id){
    var anchor = this;

    var ret = null;
    ret = anchor._id2type[type_id];

    return ret;
};

bbop_mme_edit.node.prototype.x_init = function(value){
    if(value) this._x_init = value; return this._x_init; };

bbop_mme_edit.node.prototype.y_init = function(value){
    if(value) this._y_init = value; return this._y_init; };

// Add annotation operations to prototype.
bbop_mme_edit.node.prototype.annotations =
    bbop_mme_edit._annotations;
bbop_mme_edit.node.prototype.add_annotation =
    bbop_mme_edit._add_annotation;
bbop_mme_edit.node.prototype.get_annotations_by_filter =
    bbop_mme_edit._get_annotations_by_filter;
bbop_mme_edit.node.prototype.get_annotation_by_id =
    bbop_mme_edit._get_annotation_by_id;

/*
 * Edit edges.
 * 
 * Parameters:
 *  src_id - source id
 *  rel_id - relation id
 *  tgt_id - target/object id
 */
bbop_mme_edit.edge = function(src_id, rel_id, tgt_id){
    this._id = bbop.core.uuid();
    // this._source_id = src_id;
    // this._relation_id = rel_id;
    // this._target_id = tgt_id;
    this._source_id = bme_clean(src_id);
    this._relation_id = bme_clean(rel_id);
    this._target_id = bme_clean(tgt_id);

    this._annotations = [];
};
bbop_mme_edit.edge.prototype.id = function(){ // ID is RO
    return this._id; };
bbop_mme_edit.edge.prototype.source = function(value){
    if(value) this._source_id = value; return this._source_id; };
bbop_mme_edit.edge.prototype.relation = function(value){
    if(value) this._relation_id = value; return this._relation_id; };
bbop_mme_edit.edge.prototype.target = function(value){
    if(value) this._target_id = value; return this._target_id; };

// Support CommonJS if it looks like that's how we're rolling.
if( typeof(exports) != 'undefined' ){
    exports.bbop_mme_edit = bbop_mme_edit;
}

// Add annotation operations to prototype.
bbop_mme_edit.edge.prototype.annotations =
    bbop_mme_edit._annotations;
bbop_mme_edit.edge.prototype.add_annotation =
    bbop_mme_edit._add_annotation;
bbop_mme_edit.edge.prototype.get_annotations_by_filter =
    bbop_mme_edit._get_annotations_by_filter;
bbop_mme_edit.edge.prototype.get_annotation_by_id =
    bbop_mme_edit._get_annotation_by_id;
