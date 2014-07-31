/*
 * pup tent
 * 
 * File caching and template rendering femto-framework using mustache
 * and some assumptions.
 */

//var bbop = require('bbop').bbop;
var fs = require('fs');
var us = require('underscore');
var mustache = require('mustache');

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
			  if( fs.existsSync(path) ){
			      //console.log('found: ' + path);
			      zcache[filename] = fs.readFileSync(path);
			  }
		      });
	     });
    }else{

	// Try to read from static and js.
	each(search_path_list, // e.g. ['static', 'js', ...]
	     function(loc){
		 var path = './' + loc;
		 //console.log('in loc: ' + loc);
		 var files = fs.readdirSync(loc);
		 each(files,
		      function(file){
			  // Get only files, not directories.
			  //console.log('found file: ' + file);
			  var full_file = loc + '/' + file;
			  var stats = fs.statSync(full_file);
			  if( stats.isFile() ){
			      if( fs.existsSync(full_file) ){
				  zcache[file] = fs.readFileSync(full_file);
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
	    tmpl.toString();
	    ret = mustache.render(tmpl.toString(), tmpl_args);
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
