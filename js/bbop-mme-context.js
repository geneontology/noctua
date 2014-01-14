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
    var relations = {
	'BFO_0000050':
	{
	    readable: 'part of',
	    color: 'lightblue'
	},
	'BFO_0000051':
	{
	    readable: 'has part',
	    color: 'cornflowerblue'
	},
	'BFO_0000066':
	{
	    readable: 'occurs in',
	    color: 'aquamarine4'
	},
	'RO_0002202':
	{
	    readable: 'develops from',
	    color: 'brown'
	},
	'RO_0002211':
	{
	    readable: 'regulates',
	    color: 'gray25'
	},
	'RO_0002212':
	{
	    readable: 'negatively regulates',
	    color: 'red'
	},
	'RO_0002213':
	{
	    readable: 'positively regulates',
	    color: 'green'
	},
	'RO_0002213':
	{
	    readable: 'positively regulates',
	    color: 'green'
	},
	'RO_0002330':
	{
	    readable: 'genomically related to',
	    color: 'darkorchid'
	},
	'RO_0002331':
	{
	    readable: 'involved in',
	    color: 'darksalmon'
	},
	'RO_0002332':
	{
	    readable: 'regulates level of',
	    color: 'darkolivegreen'
	},
	'RO_0002333':
	{
	    readable: 'enabled by',
	    color: 'darkgoldenrod'
	},
	'directly_activates':
	{
	    readable: 'directly activates',
	    color: 'darkseagreen'
	},
	'upstream_of':
	{
	    readable: 'upstream of',
	    color: 'deeppink'
	},
	'directly_inhibits':
	{
	    readable: 'directly inhibits',
	    color: 'chartreuse'
	},
	'indirectly_disables_action_of':
	{
	    readable: 'indirectly disables action of',
	    color: 'darkslateblue'
	}
    };

    // Relation aliases.
    var relation_aliases = {
	// BFO
	'http://purl.obolibrary.org/obo/BFO_0000050': 'BFO_0000050',
	'http://purl.obolibrary.org/obo/part_of': 'BFO_0000050',
	'part_of': 'BFO_0000050',
	'http://purl.obolibrary.org/obo/BFO_0000051': 'BFO_0000051',
	'has_part': 'BFO_0000051',
	'http://purl.obolibrary.org/obo/BFO_0000066': 'BFO_0000066',
	'occurs_in': 'BFO_0000066',
	'occurs in': 'BFO_0000066',
	// RO.
	'http://purl.obolibrary.org/obo/RO_0002211': 'RO_0002211',
	'http://purl.obolibrary.org/obo/RO_0002212': 'RO_0002212',
	'http://purl.obolibrary.org/obo/RO_0002213': 'RO_0002213',
	// ???
	'http://purl.obolibrary.org/obo/indirectly_disables_action_of':
	'indirectly_disables_action_of',
	'http://purl.obolibrary.org/obo/directly_activates':
	'directly_activates',
	'http://purl.obolibrary.org/obo/upstream_of': 'upstream_of',
	'http://purl.obolibrary.org/obo/directly_inhibits': 'directly_inhibits'
    };

    // Helper fuction to go from unknown id -> alias -> data structure.
    this._dealias_data = function(id){

	var ret = null;
	if( id ){
	    if( relations[id] ){ // directly pull
		ret = relations[id];
	    }else if( relations_aliases[id] ){ // dealias
		var unalias = relation_aliases[id];
		if( relations[unalias] ){ // indirect pull
		    ret = relations[unalias];
		}
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
     * Function: relationship_color
     *
     * Return the string of a color of a rel.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  appropriate color string or 'grey'
     */
    this.relationship_color = function(ind){
	
	var ret = 'grey';

	var data = this._dealias_data(ind);
	if( data && data['color'] ){
	    ret = data['color'];
	}
	
	return ret;
    };

    /* 
     * Function: known_relations
     *
     * Return a list of the currently known relations
     *
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  list
     */
    this.known_relations = function(){	
	var rls = bbop.core.get_keys(relations);
	var arls = bbop.core.get_keys(relation_aliases);
	var ret = rls.concat(arls);
	return ret;
    };
};


// Support CommonJS if it looks like that's how we're rolling.
if( typeof(exports) != 'undefined' ){
    exports.bbop_mme_context = bbop_mme_context;
}
