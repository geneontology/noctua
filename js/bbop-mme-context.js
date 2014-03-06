///
/// Hints and trick for the client. Think AmiGO::Aid.
///

// // Support CommonJS if it looks like that's how we're rolling.
// if( typeof(exports) != 'undefined' ){
//     var
// }

/*
 * Constructor: bbop_mme_context
 * 
 * Initial take from AmiGO/Aid.pm
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  aiding object
 */
var bbop_mme_context = function(){

    // Relations.
    // Colors are X11: http://cng.seas.rochester.edu/CNG/docs/x11color.html
    var entities = {
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
		'has part',
		'has_part'
	    ],
	    color: '#6495ED' // cornflower blue
	},
	'RO:0002233':
	{
	    readable: 'has input',
	    priority: 14,
	    aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000051',
		'has_input'
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
		'positively regulates',
		'positively_regulates'
	    ],
	    glyph: 'arrow',
	    color: '#008000' //green
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
		'enabled by',
		'enabled_by'
	    ],
	    color: '#B8860B' // darkgoldenrod
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
	'RO:0002406':
	{
	    readable: 'directly activates',
	    priority: 20,
	    aliases: [
		//'http://purl.obolibrary.org/obo/directly_activates',
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
		'directly inhibits',
		'directly_inhibits'
	    ],
	    glyph: 'bar',
	    color: '#7FFF00' // chartreuse
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
	}
    };

    // Compile entity aliases.
    var entity_aliases = {};
    bbop.core.each(entities,
		   function(ekey, eobj){
		       entity_aliases[ekey] = ekey; // identity
		       bbop.core.each(eobj['aliases'],
				      function(alias){
					  entity_aliases[alias] = ekey;
				      });
		   });

    // Helper fuction to go from unknown id -> alias -> data structure.
    this._dealias_data = function(id){
	
	var ret = null;
	if( id ){
	    if( entity_aliases[id] ){ // directly pull
		var tru_id = entity_aliases[id];
		ret = entities[tru_id];
	    }
	}

	return ret;
    };

    /* 
     * Function: readable
     *
     * Returns a human readable form of the inputted string.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  readable string or original string
     */
    this.readable = function(ind){
	var ret = ind;

	var data = this._dealias_data(ind);
	if( data && data['readable'] ){
	    ret = data['readable'];
	}
	
	return ret;
    };

    /* 
     * Function: color
     *
     * Return the string of a color of a rel.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  appropriate color string or 'grey'
     */
    this.color = function(ind){
	
	var ret = '#808080'; // grey

	var data = this._dealias_data(ind);
	if( data && data['color'] ){
	    ret = data['color'];
	}
	
	return ret;
    };

    /* 
     * Function: relation_glyph
     *
     * Return the string indicating the glyph to use for the edge marking.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  appropriate color string or null
     */
    this.glyph = function(ind){
	
	var ret = null; // default

	var data = this._dealias_data(ind);
	if( data && data['glyph'] ){
	    ret = data['glyph'];
	}
	
	return ret;
    };

    /* 
     * Function: priority
     *
     * Return a number representing the relative priority of the
     * entity under consideration.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  appropriate integer or 0
     */
    this.priority = function(ind){
	
	var ret = 0;

	var data = this._dealias_data(ind);
	if( data && data['priority'] ){
	    ret = data['priority'];
	}
	
	return ret;
    };

    /* 
     * Function: all_entities
     *
     * Return a list of the currently known entities.
     *
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  list
     */
    this.all_entities = function(){	
	var rls = bbop.core.get_keys(entities);
	return rls;
    };

    /* 
     * Function: all_known
     *
     * Return a list of the currently known entities and their aliases.
     *
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  list
     */
    this.all_known = function(){	
	var rls = bbop.core.get_keys(entity_aliases);
	return rls;
    };

    // /* 
    //  * Function: categorize
    //  *
    //  * Try to put an intstance type into some kind of rendering
    //  * category.
    //  *
    //  * Parameters: 
    //  *  in_type - instance type as returned by JSON-LD service
    //  *
    //  * Returns:
    //  *  string (default 'unknown')
    //  */
    // this.categorize = function(in_type){

    // 	var ret = 'unknown';

    // 	var t = in_type['type'];
    // 	if( t == 'Class' ){
    // 	    ret = 'instance_of';
    // 	}else if( t == 'Restriction' ){
    // 	    ret = in_type['onProperty']['id'];
    // 	}else{
    // 	    // use default
    // 	}

    // 	return ret;
    // };

    /* 
     * Function: cleanse
     *
     * Turn ID strings into something standard:
     *  ':' -> '_' and 'http://foo/bar' -> 'bar'.
     * 
     * NOTE: Cleanse currently does nothing.
     *
     * Parameters: 
     *  id_string - the string to cleanse
     *
     * Returns:
     *  string
     */
    this.cleanse = function(id_string){

    	var retstr = id_string;

    	// // 'http://foo/bar' -> 'bar'
    	// retstr = retstr.substring(retstr.lastIndexOf("/") + 1, retstr.length);

    	// // ':' -> '_'
    	// retstr = retstr.replace(':', '_');

    	// // 
    	// if( ! retstr || retstr == '' ){
    	//     throw new Error('cleanse: entered with: ' +
    	// 		    retstr + ' ; nothing left');
    	//     retstr = id_string;
    	// }

    	return retstr;
    };
};

// var bme_categorize = function(in_type){

//     var ret = {
// 	category: 'unknown',
// 	text: '???'
//     };

//     var t = in_type['type'];
//     if( t == 'Class' ){
// 	var i = in_type['id'];
// 	var l = in_type['label'];
// 	ret['category'] = 'instance_of';
// 	ret['text'] = l + ' (' + i + ')';
//     }else if( t == 'Restriction' ){
// 	var thing = in_type['someValuesFrom']['id'];
// 	var thing_rel = in_type['onProperty']['id'];
// 	ret['category'] = thing_rel;
// 	ret['text'] = thing_rel + ' (' + thing + ')';
//     }

//     return ret;
// };

/*
 * 
 */
var bme_type_to_minimal = function(in_type, aid){
    var lbl = in_type.class_label();
    if( ! lbl ){
	// Maybe a frame then?
	var ft = in_type.frame_type();
	var f = in_type.frame();
	if( ft && f ){
	    lbl = ft + '[' + f.length + ']';
	}else{
	    lbl = '[???]';
	}
    }
    return lbl;
};

/*
 * 
 */
var bme_type_to_expanded = function(in_type, aid){

    var text = '[???]';

    var t = in_type.type();
    var ft = in_type.frame_type();
    var f = in_type.frame();
    if( t == 'Class' && ft == null ){
	text = in_type.class_label() + ' (' + in_type.class_id() + ')';
    }else if( t == 'Restriction' && ft == null ){
	var thing = in_type.class_label();
	var thing_prop = in_type.property_label();
	text = aid.readable(thing_prop) + '(' + thing + ')';
    }else if( ft ){
	var thing_prop = in_type.property_label();
	text = aid.readable(thing_prop) + '(' + ft + '[' + f.length + '])';
    }

    return text;
};

/*
 * 
 */
var bme_type_to_span = function(in_type, aid, color_p){

    var min = bme_type_to_minimal(in_type, aid);
    var exp = bme_type_to_expanded(in_type, aid);

    var text = null;
    if( color_p ){
	text = '<span ' +
	    'style="background-color: ' + aid.color(in_type.category()) + ';" ' +
	    'alt="' + exp + '" ' +
	    'title="' + exp +'">' +
	    min + '</span>';
    }else{
	text = '<span alt="' + exp + '" title="' + exp +'">' + min + '</span>';
    }

    return text;
};

/**
 * A recursive writer for when we no longer care.
 */
var bme_type_to_embed = function(in_type, aid){
    var anchor = this;
    var each = bbop.core.each;

    var text = '[???]';

    var ft = in_type.frame_type();
    var frame = in_type.frame();	
    if( ! ft ){ // if no frame, the usual
	//text = bme_type_to_span(in_type, aid);
	text = bme_type_to_expanded(in_type, aid);
    }else{
	// Now for some real fun.
	var pid = in_type.property_id();
	var plabel = in_type.property_label();
	var cache = [
	    '<table width="80%" class="table table-bordered table-hover">',
	    '<thead style="background-color: ' + aid.color(pid) + ';">',
	    plabel,
	    '</thead>',
	    '<tbody>'
	];
	each(frame,
	    function(ftype){
		cache.push('<tr style="background-color: ' +
			   aid.color(ftype.category()) + ';"><td>'),
		cache.push(bme_type_to_embed(ftype, aid));
		cache.push('</td></tr>');
	    });	
	cache.push('</tbody>');
	cache.push('</table>');

	text = cache.join('');
    }

    // var min = bme_type_to_minimal(in_type, aid);
    // var exp = bme_type_to_expanded(in_type, aid);
    // var text = '<span alt="' + exp + '" title="' + exp +'">' + min + '</span>';

    return text;
};

// {
//   "type": "Class",
//   "label": "phosphatase activity",
//   "id": "GO_0016791"
// }
///// 
// {
//   "someValuesFrom": {
//     "type": "Class",
//     "id": "WB_WBGene00000913"
//   },
//   "type": "Restriction",
//   "onProperty": {
//     "type": "ObjectProperty",
//     "id": "enabled_by"
//   }
/////
// {
//   "onProperty": {
//     "id": "RO:0002333",
//     "type": "ObjectProperty",
//     "label": "enabled_by"
//   },
//   "type": "Restriction",
//   "someValuesFrom": {
//     "intersectionOf": [
//       {
//         "id": "GO:0043234",
//         "type": "Class",
//         "label": "protein complex"
//       },
//       {
//         "onProperty": {
//           "id": "BFO:0000051",
//           "type": "ObjectProperty",
//           "label": "has part"
//         },
//         "type": "Restriction",
//         "someValuesFrom": {
//           "id": "UniProtKB:P0002",
//           "type": "Class"
//         }
//       },
//       {
//         "onProperty": {
//           "id": "BFO:0000051",
//           "type": "ObjectProperty",
//           "label": "has part"
//         },
//         "type": "Restriction",
//         "someValuesFrom": {
//           "id": "UniProtKB:P0003",
//           "type": "Class"
//         }
//       }
//     ]
//   }
// }

// Support CommonJS if it looks like that's how we're rolling.
if( typeof(exports) != 'undefined' ){
    exports.bbop_mme_context = bbop_mme_context;
    exports.bbop_type_to_tcell = bbop_type_to_tcell;
}

