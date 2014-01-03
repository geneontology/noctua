///
/// Core model. Essentially several sets and an order.
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

var bbop_mme_edit = {};

// Edit control.
bbop_mme_edit.core = function(){
    this.core = {
	'nodes': {}, // map of id to edit_node
	'edges': {}, // map of id to edit_edge
	'node_order': [], // initial table order on redraws
	'node2elt': {}, // map of id to physical object id
	'elt2node': {}  // map of physical object id to id
	// Remeber that edge ids and elts ids are the same, so no map
	// is needed.
	// 'edge2elt': {}, // map of id to physical object id
	// 'elt2edge': {}  // map of physical object id to id
    };
};

bbop_mme_edit.core.prototype.add_edit_node = function(enode){
    var enid = enode.id();
    this.core['nodes'][enid] = enode; // add to nodes
    this.core['node_order'].unshift(enid); // add to default order
    var elt_id = bbop.core.uuid(); // generate the elt id we'll use
    this.core['node2elt'][enid] = elt_id; // map it
    this.core['elt2node'][elt_id] = enid; // map it
};

bbop_mme_edit.core.prototype.edit_node_order = function(){
    return this.core['node_order'] || [];
};

bbop_mme_edit.core.prototype.get_edit_node = function(enid){
    return this.core['nodes'][enid] || null;
};

bbop_mme_edit.core.prototype.get_edit_node_elt_id = function(enid){
    return this.core['node2elt'][enid] || null;
};

bbop_mme_edit.core.prototype.get_edit_node_by_elt_id = function(elt_id){
    var ret = null;
    var enid = this.core['elt2node'][el_tid] || null;
    if( enid ){
	ret = this.core['nodes'][enid] || null;
    }
    return ret;
};

bbop_mme_edit.core.prototype.get_edit_nodes = function(){
    return this.core['nodes'] || {};
};

bbop_mme_edit.core.prototype.remove_edit_node = function(enid){
    if( this.core['nodes'][enid] ){
	var enode = this.core['nodes'][enid];

	// Removing node removes all related edges.
	// TODO: Dumb scan right now.
	each(this.core['edges'],
	     function(edge){
		 if( edge.source() == enid || edge.target() == enid ){
		     var eeid = edge.id();
		     this.remove_edit_edge(eeid);
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
    }
};

bbop_mme_edit.core.prototype.add_edit_edge = function(eedge){
    var eeid = eedge.id();
    this.core['edges'][eeid] = eedge;
    var elt_id = bbop.core.uuid(); // generate the elt id we'll use
    //this.core['edge2elt'][eeid] = elt_id; // map it
    //this.core['elt2edge'][elt_id] = eeid; // map it
};

bbop_mme_edit.core.prototype.get_edit_edge = function(eeid){
    return this.core['edges'][eeid] || null;
};

bbop_mme_edit.core.prototype.get_edit_edges = function(){
    return this.core['edges'] || [];
};

bbop_mme_edit.core.prototype.remove_edit_edge = function(eeid){
    if( this.core['edges'][eeid] ){

	// Main bit out.
	delete this.core['edges'][eeid];

	// // And clean the maps.
	// var elt_id = this.core['node2elt'][eeid];
	// delete this.core['edge2elt'][eeid];
	// delete this.core['elt2edge'][elt_id];
    }
};
bbop_mme_edit.core.prototype.dump = function(){

    //
    var dcache = [];
    
    bbop.core.each(this.core['nodes'],
		   function(node_id, node){
		       if( node.type() && node.type() == 'real' ){
			   var ncache = ['node'];
			   ncache.push(node.enabled_by());
			   ncache.push(node.activity());
			   ncache.push(node.unknown());
			   ncache.push(node.process());
			   ncache.push(node.location());
			   dcache.push(ncache.join("\t"));
		       }
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

// Edit nodes.
bbop_mme_edit.node = function(in_id, in_type){

    if( typeof(in_id) === 'undefined' ){
	this._id = bbop.core.uuid();
    }else{
	this._id = in_id;
    }
    if( typeof(in_type) === 'undefined' ){
	this._type = 'real';
    }
    
    // Current model props.
    this._enabled_by = '';
    this._activity = '';
    this._unknown = [];
    this._process = '';
    this._location = [];
    
    // Optional layout hints.
    this._x_init = null; // initial layout hint
    this._y_init = null;
    // this.xlast = null; // last known location
    // this.ylast = null;
};
bbop_mme_edit.node.prototype.id = function(value){ // (possibly generated) ID is RO
    return this._id; };
bbop_mme_edit.node.prototype.type = function(value){
    if(value) this._type = value; return this._type; };
bbop_mme_edit.node.prototype.enabled_by = function(value){
    if(value) this._enabled_by = value; return this._enabled_by; };
bbop_mme_edit.node.prototype.activity = function(value){
    if(value) this._activity = value; return this._activity; };
bbop_mme_edit.node.prototype.unknown = function(value){
    if(value) this._unknown = value; return this._unknown; };
bbop_mme_edit.node.prototype.process = function(value){
    if(value) this._process = value; return this._process; };
bbop_mme_edit.node.prototype.location = function(value){
    if(value) this._location = value; return this._location; };
bbop_mme_edit.node.prototype.x_init = function(value){
    if(value) this._x_init = value; return this._x_init; };
bbop_mme_edit.node.prototype.y_init = function(value){
    if(value) this._y_init = value; return this._y_init; };

// Edit edges.
bbop_mme_edit.edge = function(src_id, rel_id, tgt_id){
    this._id = bbop.core.uuid();
    this._source_id = src_id;
    this._relation_id = rel_id;
    this._target_id = tgt_id;
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
