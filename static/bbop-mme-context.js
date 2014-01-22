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
	'BFO_0000050':
	{
	    readable: 'part of',
	    priority: 0,
	    aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000050',
		//'http://purl.obolibrary.org/obo/part_of',
		'part of',
		'part_of'
	    ],
	    color: '#add8e6' // light blue
	},
	'BFO_0000051':
	{
	    readable: 'has part',
	    priority: 0,
	    aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000051',
		'has part',
		'has_part'
	    ],
	    color: '#6495ED' // cornflower blue
	},
	'BFO_0000066':
	{
	    readable: 'occurs in',
	    priority: 2,
	    aliases: [
		//'http://purl.obolibrary.org/obo/BFO_0000066',
		'occurs in',
		'occurs_in'
	    ],
	    color: '#66CDAA' // medium aquamarine
	},
	'RO_0002202':
	{
	    readable: 'develops from',
	    priority: 0,
	    aliases: [
		'develops from',
		'develops_from'
	    ],
	    color: '#A52A2A' // brown
	},
	'RO_0002211':
	{
	    readable: 'regulates',
	    priority: 0,
	    aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002211'
		'regulates'
	    ],
	    color: '#2F4F4F' // dark slate grey
	},
	'RO_0002212':
	{
	    readable: 'negatively regulates',
	    priority: 0,
	    aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002212'
		'negatively regulates',
		'negatively_regulates'
	    ],
	    color: '#FF0000' // red
	},
	'RO_0002213':
	{
	    readable: 'positively regulates',
	    priority: 0,
	    aliases: [
		//'http://purl.obolibrary.org/obo/RO_0002213'
		'positively regulates',
		'positively_regulates'
	    ],
	    color: '#008000' //green
	},
	'RO_0002330':
	{
	    readable: 'genomically related to',
	    priority: 0,
	    aliases: [
		'genomically related to',
		'genomically_related_to'
	    ],
	    color: '#9932CC' // darkorchid
	},
	'RO_0002331':
	{
	    readable: 'involved in',
	    priority: 3,
	    aliases: [
		'involved in',
		'involved_in'
	    ],
	    color: '#E9967A' // darksalmon
	},
	'RO_0002332':
	{
	    readable: 'regulates level of',
	    priority: 0,
	    aliases: [
		'regulates level of',
		'regulates_level_of'
	    ],
	    color: '#556B2F' // darkolivegreen
	},
	'RO_0002333':
	{
	    readable: 'enabled by',
	    priority: 9,
	    aliases: [
		'enabled by',
		'enabled_by'
	    ],
	    color: '#B8860B' // darkgoldenrod
	},
	'directly_activates':
	{
	    readable: 'directly activates',
	    priority: 0,
	    aliases: [
		//'http://purl.obolibrary.org/obo/directly_activates',
		'directly activates',
		'directly_activates'
	    ],
	    color: '#8FBC8F' // darkseagreen
	},
	'upstream_of':
	{
	    readable: 'upstream of',
	    priority: 0,
	    aliases: [
		//'http://purl.obolibrary.org/obo/upstream_of'
		'upstream of',
		'upstream_of'
	    ],
	    color: '#FF1493' // deeppink
	},
	'directly_inhibits':
	{
	    readable: 'directly inhibits',
	    priority: 0,
	    aliases: [
		//'http://purl.obolibrary.org/obo/directly_inhibits'
		'directly inhibits',
		'directly_inhibits'
	    ],
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

    // The 
    var suggested_stack_order = [
	'RO_0002333', // enabled by
	'instance_of', // activity
	'',	
	'BFO_0000066' // occurs in
    ];

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

    /* 
     * Function: categorize
     *
     * Try to put an intstance type into some kind of rendering
     * category.
     *
     * Parameters: 
     *  in_type - instance type as returned by JSON-LD service
     *
     * Returns:
     *  string (default 'unknown')
     */
    this.categorize = function(in_type){

	var ret = 'unknown';

	var t = in_type['type'];
	if( t == 'Class' ){
	    ret = 'instance_of';
	}else if( t == 'Restriction' ){
	    ret = in_type['onProperty']['id'];
	}else{
	    // use default
	}

	return ret;
    };

    /* 
     * Function: cleanse
     *
     * Turn ID strings into something standard:
     *  ':' -> '_' and 'http://foo/bar' -> 'bar'.
     *
     * Parameters: 
     *  id_string - the string to cleanse
     *
     * Returns:
     *  string
     */
    this.cleanse = function(id_string){

    	var retstr = id_string;

    	// 'http://foo/bar' -> 'bar'
    	retstr = retstr.substring(retstr.lastIndexOf("/") + 1, retstr.length);

    	// ':' -> '_'
    	retstr = retstr.replace(':', '_');

    	// 
    	if( ! retstr || retstr == '' ){
    	    throw new Error('cleanse: entered with: ' +
    			    retstr + ' ; nothing left');
    	    retstr = id_string;
    	}

    	return retstr;
    };
};

var bme_categorize = function(in_type){

    var ret = {
	category: 'unknown',
	text: '???'
    };

    var t = in_type['type'];
    if( t == 'Class' ){
	var i = in_type['id'];
	var l = in_type['label'];
	ret['category'] = 'instance_of';
	ret['text'] = l + ' (' + i + ')';
    }else if( t == 'Restriction' ){
	var thing = in_type['someValuesFrom']['id'];
	var thing_rel = in_type['onProperty']['id'];
	ret['category'] = thing_rel;
	ret['text'] = thing_rel + ' (' + thing + ')';
    }

    return ret;
};

/*
 * 
 */
var bme_type_to_text = function(in_type){

    var text = '???';

    var t = in_type['type'];
    if( t == 'Class' ){
	var i = in_type['id'];
	var l = in_type['label'];
	text = '<span alt="' + l + '(' + i + ')' + '" title="' + l + ' (' + i + ')' + '">' + l + ' (' + i + ')' + '</span>';
    }else if( t == 'Restriction' ){
	var thing = in_type['someValuesFrom']['id'];
	var thing_rel = in_type['onProperty']['id'];
	//text = thing_rel + '(' + thing + ')';
	text = '<span alt="' + thing_rel + '(' + thing + ')' + '" title="' + thing_rel + '(' + thing + ')' + '">' + thing + '</span>';
    }

    return text;
};
          // {
          //   "type": "Class",
          //   "label": "phosphatase activity",
          //   "id": "GO_0016791"
          // },
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

// Support CommonJS if it looks like that's how we're rolling.
if( typeof(exports) != 'undefined' ){
    exports.bbop_mme_context = bbop_mme_context;
    exports.bbop_type_to_tcell = bbop_type_to_tcell;
}

