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
     * Push an item or a list onto a list.
     */
    function _add_to(stack, item_or_list){
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
	    _add_to(stack_name, thing);
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

	    if( tmpl_args ){
		_add_to('css_libs', tmpl_args['pup_tent_css_libraries']);
		_add_to('js_vars', tmpl_args['pup_tent_js_variables']);
		_add_to('js_libs', tmpl_args['pup_tent_js_libraries']);
	    }
	    
	    var content_rendered = _apply(content_tmpl_name, tmpl_args);
	    tmpl_args['pup_tent_content'] = content_rendered;
	    tmpl_args['pup_tent_css_libraries'] = tcache['css_libs'];
	    tmpl_args['pup_tent_js_variables'] = tcache['js_vars'];
	    tmpl_args['pup_tent_js_libraries'] = tcache['js_libs'];
	    var final_rendered = _apply(base_tmpl_name, tmpl_args);
	    return final_rendered;
	}
    };
};
