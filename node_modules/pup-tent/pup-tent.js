/*
 * Pup Tent
 * 
 * File caching and template rendering femto-framework using mustache
 * and some assumptions.
 */

var us = require('underscore');
var mustache = require('mustache');

///
/// The internal file abstraction necessary to run in both Node.js and
/// Rhino environments.
///

/*
 * Constructor: AbstractFS
 * 
 * Synchronous cross-platform filesystem abstraction for a few common
 * operations. Not meant to a be full-blown fix for these issues
 * (http://www.gigamonkeys.com/book/files-and-file-io.html#filenames).
 * 
 * Currently supports Node.js and RingoJS. Will hopefully be
 * unnecessary when CommonJS and everybody get it together:
 * http://wiki.commonjs.org/wiki/Filesystem
 *
 * Parameters:
 *  n/a
 *
 * Returns:
 *    An instance of the AbstractFS abstraction.
 */
function AbstractFS(){

    var anchor = this;

    // NOTE: We're leaning on the fact here that require('fs') is
    // legitimate in both RingoJS and Node.js, and are available in
    // them both automatically.
    var fs = require('fs');
    
    // First things first: probe our environment and make a best
    // guess.
    anchor._env_type = null;
    if( typeof(org) != 'undefined' && typeof(org.ringo) != 'undefined' ){
	anchor._env_type = 'RingoJS';
    }else if( typeof(org) != 'undefined' && typeof(org.rhino) != 'undefined' ){
	// TODO
	//anchor._env_type = 'Rhino';
    }else if( typeof(global) != 'undefined' &&
	      typeof(global.process) != 'undefined' ){
	anchor._env_type = 'Node.js';
    }else{
	anchor._env_type = '???';
    }

    /*
     * Function: environment
     * 
     * Return a string representation og the current running
     * environment.
     *
     * Parameters:
     *  n/a
     *
     * Returns:
     *    string
     */
    anchor.environment = function(){
	return anchor._env_type;
    };

    // Some internal mechanisms to make this process easier.
    function _node_p(){
	var ret = false;
	if( anchor.environment() == 'Node.js' ){ ret = true; }
	return ret;
    }
    function _ringo_p(){
	var ret = false;
	if( anchor.environment() == 'RingoJS' ){ ret = true; }
	return ret;
    }
    function _unimplemented(funname){
	throw new Error('The function "' + funname +
			'" is not implemented for ' + anchor.environment());
    }

    /*
     * Function: exists_p
     * 
     * Whether or not a path exists.
     *
     * Parameters:
     *  path - the desired path as a string
     *
     * Returns:
     *    boolean
     */
    anchor.exists_p = function(path){
	var ret = null;
	if( _node_p() ){
	    ret = fs.existsSync(path);
	}else if( _ringo_p() ){
	    ret = fs.exists(path);
	}else{
	    _unimplemented('exists_p');
	}
	return ret;
    };

    /*
     * Function: file_p
     * 
     * Returns whether or not a path is a file.
     *
     * Parameters:
     *  path - the desired path as a string
     *
     * Returns:
     *    boolean
     */
    anchor.file_p = function(path){
	var ret = false;
	if( _node_p() ){
	    var stats = fs.statSync(path);
	    if( stats && stats.isFile() ){ ret = true; }
	}else if( _ringo_p() ){
	    ret = fs.isFile(path);
	}else{
	    _unimplemented('file_p');
	}
	return ret;
    };

    /*
     * Function: read_file
     * 
     * Read a file, returning it as a string.
     *
     * Parameters:
     *  path - the desired path as a string
     *
     * Returns:
     *    string or null
     */
    anchor.read_file = function(path){
	var ret = null;
	if( _node_p() ){
	    var buf = fs.readFileSync(path)
	    if( buf ){ ret = buf.toString(); }
	}else if( _ringo_p() ){
	    ret = fs.read(path);
	}else{
	    _unimplemented('read_file');
	}
	return ret;
    };

    /*
     * Function: list_directory
     * 
     * Return a list of the files in a directory (names relative to
     * the directory) as strings.
     *
     * Parameters:
     *  path - the desired path as a string
     *
     * Returns:
     *    list of strings
     */
    anchor.list_directory = function(path){
	var ret = [];
	if( _node_p() ){
	    ret = fs.readdirSync(path);
	}else if( _ringo_p() ){
	    ret = fs.list(path);
	}else{
	    _unimplemented('list_dir');
	}
	return ret;
    };

}

///
/// External sections.
///

/*
 * Constructor: require('pup-tent')
 * 
 * Creates an instance of the Pup Tent femto-framework.
 *
 * Parameters:
 *    search_path_list - list of directories to search for static files (e.g. ['static', 'js', 'css', 'templates'])
 *    filename_list - *[optional]* list of static files (e.g. ['Login.js', 'login_content.tmpl'])
 *
 * Returns:
 *    An instance of the Pup Tent femto-framework.
 */
module.exports = function(search_path_list, filename_list){

    var each = us.each;

    // Use our own abstraction.
    var afs = new AbstractFS();

    var zcache = {}; // file cache
    var tcache = { // variant cache
	css_libs: [],
	js_vars: [],
	js_libs: []
    };

    // If we have a filename list, just look for those in out search
    // paths. If we don't have a filename_list, just grab all of the
    // files in the search path.
    if( us.isArray(filename_list) ){
    
	each(filename_list, // e.g. ['Login.js', 'login_content.tmpl']
	     function(filename){
		 
		 // Try to read from static and js.
		 each(search_path_list, // e.g. ['static', 'js', ...]
		      function(loc){
			  var path = './' + loc + '/' + filename;
			  //console.log('l@: ' + path);
			  if( afs.exists_p(path) ){
			      //console.log('found: ' + path);
			      zcache[filename] = afs.read_file(path);
			  }
		      });
	     });
    }else{

	// Try to read from static and js.
	each(search_path_list, // e.g. ['static', 'js', ...]
	     function(loc){
		 var path = './' + loc;
		 //console.log('in loc: ' + loc);
		 var files = afs.list_directory(loc);
		 each(files,
		      function(file){
			  // Get only files, not directories.
			  //console.log('found file: ' + file);
			  var full_file = loc + '/' + file;
			  if( afs.exists_p(full_file) ){
			      if( afs.file_p(full_file) ){
				  zcache[file] = afs.read_file(full_file);
			      }
			  }
		      });
	     });
    }

    // Push an item or a list onto a list, returning the new list.
    // This is a copy--no shared structure.
    function _add_to(stack, item_or_list){

	var ret = [];
	
	if( tcache[stack] ){
	    if( item_or_list ){
		if( ! us.isArray(item_or_list) ){ // ensure listy
		    item_or_list = [item_or_list];
		}
 		ret = tcache[stack].concat(item_or_list);
	    }else{
		ret = tcache[stack].concat();
	    }
	}

	return ret;
    }

    // Permanently push an item or a list onto the internal list structure.
    // Changes structure.
    function _add_permanently_to(stack, item_or_list){
	if( item_or_list && tcache[stack] ){
	    if( ! us.isArray(item_or_list) ){ // atom
		tcache[stack].push(item_or_list);
	    }else{ // list
		tcache[stack] = tcache[stack].concat(item_or_list);
	    }
	}
	return tcache[stack];
    }

    // Permanently push an item or a list onto an internal list.
    // Meant for all common variables across pup tent renderings.
    function _set_common(stack_name, thing){
	var ret = null;
	if( stack_name == 'css_libs' ||
	    stack_name == 'js_libs' ||
	    stack_name == 'js_vars' ){
	    _add_permanently_to(stack_name, thing);
	    ret = thing;
	}
	//console.log('added ' + thing.length + ' to ' + stack_name);

	return ret;
    }

    // Get a file, as string, from the cache by key; null otherwise.
    function _get(key){
	return zcache[key];
    }

    // Get a string from a named mustache template, with optional
    // args.
    function _apply (tmpl_name, tmpl_args){
	
	var ret = null;
	
	var tmpl = _get(tmpl_name);
	if( tmpl ){
	    ret = mustache.render(tmpl, tmpl_args);
	}
	// if( tmpl ){ console.log('rendered string length: ' + ret.length); }
	
	return ret;
    }

    return {

	/*
	 * Function: apply
	 * 
	 * Get a file from the cache by key; null otherwise.
	 *
	 * Parameters:
	 *    tmpl_name - the (string) name of the template to run
	 *    thing - *[optional]* argument hash
	 *
	 * Returns:
	 *    string or null
	 */
	get: function(key){
	    return _get(key);
	},

	/*
	 * Function: cached_list
	 * 
	 * Returns a list of the cached files.
	 *
	 * Parameters:
	 *  n/a
	 *
	 * Returns:
	 *    list of strings
	 */
	cached_list: function(){
	    return us.keys(zcache);
	},

	/*
	 * Function: apply
	 * 
	 * Run a template with the given arguments.
	 *
	 * Parameters:
	 *    tmpl_name - the (string) name of the template to run
	 *    thing - *[optional]* argument hash
	 *
	 * Returns:
	 *    string
	 *
	 * Also see:
	 *  <render>
	 */
	apply: function(tmpl_name, tmpl_args){
	    return _apply(tmpl_name, tmpl_args);
	},

	/*
	 * Function: set_common
	 * 
	 * Add variables and libraries to special variables for all
	 * calls to <render>.
	 *
	 * Available stacks are:
	 *  - css_libs: will map to pup_tent_css_libraries
	 *  - js_vars: will map to pup_tent_js_variables
	 *  - js_libs: will map to pup_tent_js_libraries
	 *
	 * Parameters:
	 *    stack_name - the name of the stact to add to (list above)
	 *    thing - variable structure; either a string for *_libs or {'name': name, 'value': value} for js_vars
	 *
	 * Returns:
	 *    return thing or null
	 *
	 * Also see:
	 *  <render>
	 */
	set_common: function(stack_name, thing){
	    return _set_common(stack_name, thing);
	},

	/*
	 * Function: render
	 * 
	 * Render with special variables. Also wrapper for the usual
	 * inner/outer pattern.
	 *
	 * Special template/variable names in/for base:
	 * 
	 *  - pup_tent_css_libraries: list of CSS files to use
	 *  - pup_tent_js_libraries: list of JS files to use
	 *  - pup_tent_js_variables: list of name/value objects to convert to vaiables
	 *  - pup_tent_content: meant for use in *[base_tmpl_name]* to embed one template in another
	 *
	 * Parameters:
	 *  tmpl_name - content template name (in path)
	 *  tmpl_args - variable arguments
	 *  frame_tmpl_name - *[optional]* using variable *[pup_tent_content]* embed content_tmpl_name
	 *
	 * Returns:
	 *  string
	 */
	render: function(tmpl_name, tmpl_args, frame_tmpl_name){

	    // Add in any additional libs/etc that we may want.
	    var c = [];
	    var v = [];
	    var j = [];
	    if( tmpl_args ){
		c = _add_to('css_libs', tmpl_args['pup_tent_css_libraries']);
		v = _add_to('js_vars', tmpl_args['pup_tent_js_variables']);
		j = _add_to('js_libs', tmpl_args['pup_tent_js_libraries']);
	    }

	    // Determine whether or not we'll be embedding; get the
	    // inner content if there is any.
	    var outer_tmpl_name = frame_tmpl_name;
	    var inner_tmpl_name = tmpl_name;
	    var inner_content_rendered = null;
	    if( ! frame_tmpl_name ){
		outer_tmpl_name = tmpl_name;
		inner_tmpl_name = null;
	    }else{
		inner_content_rendered = _apply(inner_tmpl_name, tmpl_args);
		// First special variable.
		tmpl_args['pup_tent_content'] = inner_content_rendered;
	    }

	    // Add in the rest of the special variables.
	    tmpl_args['pup_tent_css_libraries'] = c;
	    tmpl_args['pup_tent_js_libraries'] = j;

	    // Variables get special attention since we want them to
	    // intuitively render into JS on the other side.
	    var out_vars = [];
	    each(v, function(nv_pair){
		var out_val = 'null'; // literally null.
		
		// Convert the value into the best JS
		// representation.
		var in_val = nv_pair['value'];
		var type = typeof(in_val);	
		if( in_val === null ){
		    // nuttin
		}else if( type == 'string' ){
		    out_val = JSON.stringify(in_val);
		}else if( type == 'object' ){
		    out_val = JSON.stringify(in_val);
		}else if( type == 'number' ){
		    out_val = in_val;
		}else{
		    // some kind of null/undefined anyways?
		}
		
		out_vars.push({name: nv_pair['name'], value: out_val});
	    });
	    tmpl_args['pup_tent_js_variables'] = out_vars;

	    //console.log('tmpl_args: ', tmpl_args);

	    // Final rendering with everything together.
	    var final_rendered = _apply(outer_tmpl_name, tmpl_args);
	    return final_rendered;
	}
    };
};
