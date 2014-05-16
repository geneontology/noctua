/*
 * pup tent
 * 
 * File caching and template rendering femto framework using mustache
 * and some assumptions.
 */

var bbop = require('bbop').bbop;
var fs = require('fs');
var mustache = require('mustache');

module.exports = function(filename_list, search_path_list){

    var each = bbop.core.each;

    var zcache = {};
    var tcache = {
	css_libs: [],
	js_vars: [],
	js_libs: []
    };

    each(filename_list, // ['Login.js', 'login_content.tmpl'],
	 function(filename){
	     
	     // Try to read from static and js.
	     each(search_path_list, //['static', 'js', 'css', 'templates'],
		  function(loc){
		      var path = './' + loc + '/' + filename;
		      //console.log('l@: ' + path);
		      if( fs.existsSync(path) ){
			  //console.log('found: ' + path);
			  zcache[filename] = fs.readFileSync(path);
		      }
		  });
	 });

    /*
     * Permanently push an item or a list onto a list.
     */
    function _add_to(stack, item_or_list){

	var ret = [];
	
	if( tcache[stack] ){
	    if( item_or_list ){
		if( ! bbop.core.is_array(item_or_list) ){ // ensure listy
		    item_or_list = [item_or_list];
		}
 		ret = tcache[stack].concat(item_or_list);
	    }else{
		ret = tcache[stack].concat();
	    }
	}

	return ret;
    }

    /*
     * Permanently push an item or a list onto a list.
     */
    function _add_permanently_to(stack, item_or_list){
	if( item_or_list && tcache[stack] ){
	    if( ! bbop.core.is_array(item_or_list) ){ // atom
		tcache[stack].push(item_or_list);
	    }else{ // list
		tcache[stack] = tcache[stack].concat(item_or_list);
	    }
	}
	return tcache[stack];
    }

    /*
     * Push an item or a list onto a list.
     */
    function _set_common(stack_name, thing){
	if( stack_name == 'css_libs' ||
	    stack_name == 'js_libs' ||
	    stack_name == 'js_vars' ){
	    _add_permanently_to(stack_name, thing);
	}
	//console.log('added ' + thing.length + ' to ' + stack_name);
    }

    /*
     * Get a file from the cache by key; null otherwise.
     */
    function _get(key){
	return zcache[key];
    }

    /*
     * 
     */
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
	 * 
	 */
	get: function(key){
	    return _get(key);
	},

	/*
	 * 
	 */
	cached_list: function(){
	    return bbop.core.get_keys(zcache);
	},

	// 
	apply: function(tmpl_name, tmpl_args){
	    return _apply(tmpl_name, tmpl_args);
	},

	/*
	 * 
	 */
	set_common: function(stack_name, thing){
	    return _set_common(stack_name, thing);
	},

	/*
	 * Wrapper for my usual inner/outer pattern.
	 * 
	 * Special template/variable names in/for base:
	 * 
	 * pup_tent_css_libraries
	 * pup_tent_js_libraries
	 * pup_tent_js_variables
	 * pup_tent_content
	 */
	render_io: function(base_tmpl_name, content_tmpl_name, tmpl_args){

	    var c = [];
	    var v = [];
	    var j = [];
	    if( tmpl_args ){
		c = _add_to('css_libs', tmpl_args['pup_tent_css_libraries']);
		v = _add_to('js_vars', tmpl_args['pup_tent_js_variables']);
		j = _add_to('js_libs', tmpl_args['pup_tent_js_libraries']);
	    }

	    var content_rendered = _apply(content_tmpl_name, tmpl_args);

	    // Add in the special variables.
	    tmpl_args['pup_tent_content'] = content_rendered;
	    tmpl_args['pup_tent_css_libraries'] = c;
	    tmpl_args['pup_tent_js_libraries'] = j;

	    // Variables get special attention since we want them to
	    // intuitively render into JS on the other side.
	    var out_vars = [];
	    each(v,
		 function(nv_pair){
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

	    // Final rendering with everything together.
	    var final_rendered = _apply(base_tmpl_name, tmpl_args);
	    return final_rendered;
	}
    };
};
