/*
 * Package: noctua.js
 *
 * This is a Heroku/NodeJS/local script, using the require environment.
 *
 * A server that will render GO graphs into jsPlumb.
 *
 * : node noctua.js -c "RO:0002333 BFO:0000066 RO:0002233 RO:0002488" -g http://golr.geneontology.org/solr/ -b http://localhost:3400 -m minerva_local
 */

// Let jshint pass over over our external globals or oddities.
/* global unescape */
/* global parseInt */

// Required shareable Node libs.
var md = require('markdown');
var mustache = require('mustache');
var fs = require('fs');
var path = require('path');
var tilde = require('expand-home-dir');
var yaml = require('yamljs');
var mime = require('mime');
var url = require('url');
var querystring = require('querystring');

// Required add-on libs.
var amigo = require('amigo2');
var golr_conf = require('golr-conf');

var us = require('underscore');
var bbop = require('bbop-core');

var barista_response = require('bbop-response-barista');
var minerva_requests = require('minerva-requests');

// Extra manager stuff for exports.
var node_engine = require('bbop-rest-manager').node;
var minerva_manager = require('bbop-manager-minerva');

///
/// Helpers.
///

function _die(str){
    console.error(str);
    process.exit(-1);
}

function _tilde_expand(ufile){
    return tilde(ufile);
}

function _tilde_expand_list(list){
    return us.map(list, function(ufile){
	//console.log('ufile: ' + ufile);
	return tilde(ufile);
    });
}

// Aliases.
var each = us.each;
var what_is = bbop.what_is;
var is_defined = bbop.is_defined;
var dump = bbop.dump;

///
/// CLI arguments and runtime environment.
///

// CLI handling.
var argv = require('minimist')(process.argv.slice(2));

// Collapsible relations.
var collapsible_raw =
	argv['c'] || argv['collapsible-relations'] || '';
var collapsible_reverse_raw =
	argv['r'] || argv['collapsible-reverse-relations'] || '';
// GOlr server.
var golr_server_location =
	argv['g'] || argv['golr'] || 'http://golr.geneontology.org/';
var golr_neo_server_location =
	argv['n'] || argv['golr-neo'] || 'http://noctua-golr.geneontology.org/';
// Barista server.
var barloc =
	argv['b'] || argv['barista'] || 'http://barista.berkeleybop.org/';
// Main minerva app definition.
var min_def_name =
	argv['m'] || argv['minerva-definition'] || 'minerva_public';
// Work benches; will check and process a little later.
// Default to local workbenches.
var workbench_maybe_raw =
	argv['w'] || argv['workbenches'] || './workbenches/';
// Noctua's real location.
var noctua_context =
	argv['t'] || argv['noctua-context'] || 'go';
var noctua_location =
	argv['s'] || argv['noctua-self'] || 'http://localhost:8910';
// Noctua's self/public location (optional).
var noctua_frontend = argv['p'] || argv['noctua-public'];

// External browser location for models.
var external_browser_location =
	argv['e'] || argv['external-browser-location'] || null;

// External browser location for models.
var github_api = argv['github-api'] || null;
var github_org = argv['github-org'] || null;
var github_repo = argv['github-repo'] || null;

// Process strings to usable lists.
var collapsible_relations = [];
if( collapsible_raw ){
    collapsible_relations = collapsible_raw.split(/\s+/) || [];
}
var collapsible_reverse_relations = [];
if( collapsible_reverse_raw ){
    collapsible_reverse_relations = collapsible_reverse_raw.split(/\s+/) || [];
}
var workbench_maybe_dirs = workbench_maybe_raw.split(/\s+/) || [];

console.log('Will fold: ', collapsible_relations);
console.log('Will fold (reverse): ', collapsible_reverse_relations);
console.log('Using GOlr lookup server at: ', golr_server_location);
console.log('Using GOlr NEO lookup server at: ', golr_neo_server_location);
console.log('Barista location: ' + barloc);
console.log('Minerva definition name: ' + min_def_name);
console.log('External model browser: ' + external_browser_location);
var use_github_p = false;
if( github_api && github_org && github_repo ){
    console.log('Use GitHub API: ' +
		[github_api, github_org, github_repo].join(', '));
    use_github_p = true;
}else{
    console.log('Will not use GitHub API');
}

// Figure out our base and URLs we'll need to aim this locally.
var linker = new amigo.linker();
var sd = new amigo.data.server();
var app_base = sd.app_base();

// The name we're using this week.
var notw = 'Noctua (Beta)';

///
/// Define the loadable application.
///

var NoctuaLauncher = function(){
    var self = this;

    // Monitor some stats.
    var monitor_internal_kicks = 0;
    var monitor_external_kicks = 0;

    ///
    /// Process CLI environmental variables.
    ///

    // Get the location(s) of the workbench plugins.
    var workbenches_all_ids = {};
    var workbenches_universal = [];
    var workbenches_model = [];
    var workbenches_individual = [];
    var workbenches_edge = [];
    each(workbench_maybe_dirs, function(dir){
	//console.log('dir', dir);

	// Look at all of the listed directories.
	var maybe_dir_files = fs.readdirSync(dir);
	
	each(maybe_dir_files, function(subdir){
	    //console.log('subdir', subdir);

	    var dstats = null;
	    try {
		//console.log(dir + '/' + subdir);
		dstats = fs.statSync(dir + '/' + subdir);
	    } catch(e) {
		// Pass.
	    }
	    if( ! dstats || ! dstats.isDirectory() ){
		//console.log(subdir + ' not a directory.');
	    }else{

		var wbpath = dir + '/' + subdir;
		var wbid = subdir; // also the ID of our workbench
		//console.log('Checking ' + wbid + ' (' + wbpath + ')');
		
		// Check that the file looks right.
		var wb = null;
		try {
		    wb = yaml.load(wbpath + '/config.yaml');
		} catch(e) {
		    // Pass.
		}
		if( ! wb ){

		    console.log('Rejected workbench: ' + wbid + '; ' +
				'no good config.yaml');

		}else if( ! ( wb['menu-name'] &&
			      wb['page-name'] &&
			      wb['help-link'] &&
			      wb['type'] ) ){

		    console.log('Rejected workbench: ' + wbid + '; ' +
				'insufficient fields.');

		}else if( ! /^[a-zA-Z0-9-_]+$/.test(wbid) ){

		    console.log('Rejected workbench: ' + wbid + '; ' +
				'workbench ID not alphanum.');
		    
		}else if( workbenches_all_ids[wbid] ){

		    console.log('Rejected workbench: ' + wbid + '; ' +
				'workbench ID not unique.');
		    
		}else{

		    /// Get ready a second battery of more invasive
		    /// filesystem tests.
		    wb['workbench-id'] = wbid;

		    // Files and directories to test.
		    var wbpath_try_public = wbpath + '/public';
		    var wbpath_try_tmpl = wbpath_try_public + '/inject.tmpl';

		    // Test said entities.
		    var tmpl_fstats = null;
		    try {
			// We know the probably at least one of these
			// isn't gunna work, so the is the order of
			// criticality.
			tmpl_fstats = fs.statSync(wbpath_try_tmpl);
		    } catch(e) {
			// Pass.
		    } finally {
			// Pass.
		    }

		    if( ! tmpl_fstats || ! tmpl_fstats.isFile() ){

			console.log('Rejected workbench: ' + wbid + '; ' +
				    'no public/inject.tmpl');
		    
		    }else{

			/// It looks like we are probably going to be
			/// good to go.

			// Ensure that we don't hit this one again.
			workbenches_all_ids[wbid] = true;

			// Add things to the permenent record.
			wb['template-injectable'] = wbpath_try_tmpl;
			wb['public-directory'] = wbpath_try_public;
			
			// Load workbench for later.
			if( wb['type'] === 'universal' ){
			    workbenches_universal.push(wb);
			    console.log('Added workbench (u: '+wbid+')');
			}else if( wb['type'] === 'model' ){
			    workbenches_model.push(wb);
			    console.log('Added workbench (m: '+wbid+')');
			}else if( wb['type'] === 'individual' ){
			    workbenches_individual.push(wb);
			    console.log('Added workbench (i: '+wbid+')');
			}else if( wb['type'] === 'edge' ){
			    workbenches_edge.push(wb);
			    console.log('Added workbench (e: '+wbid+')');
			}else{
			    console.log('Rejected workbench (type)');
			}
		    }
		}
	    }
	});
    });

    // Apply external to internal variables.
    var all_workbenches = workbenches_universal.concat(workbenches_model).concat(workbenches_individual).concat(workbenches_edge);
    if( us.isEmpty(all_workbenches) ){
	console.log('No workbenches defined.');
    }else{
	console.log(all_workbenches.length + ' workbench(es) defined.');
    }

    // Barista location setting.
    //var barloc = config['BARISTA_LOOKUP_URL'].value;
    self.barista_location = barloc;
    // Initial setup of which minerva definition to use (to pass to
    // barista for translation).
    //    var min_def_name = config['DEFAULT_APP_DEFINITION'].value;
    self.minerva_definition_name = min_def_name;

    // Now that we have some context, try and grab context-specific
    // SPARQL queries.
    var sparql_templates_named = {};
    var sparql_templates_universal = [];
    var sparql_templates_model = [];
    var sparql_templates_individual = [];
    var sparql_templates_edge = [];
    var read_templates_count = 0;
    var ignored_templates_count = 0;
    var sparql_templates_path = 'context/'+ noctua_context +'/sparql-templates/';
    //console.log('Have canned SPARQL templates? '+sparql_templates_path);
    try {
	// Try and read the directory for files.
	var stp_stats = fs.statSync(sparql_templates_path);
	if( ! stp_stats.isDirectory() ){
	    console.log('No SPARQL templates for this context: '+noctua_context);
	}else{
	    
	    var sparql_template_files = fs.readdirSync(sparql_templates_path);
	    each(sparql_template_files, function(sparql_template_file_base){

		var sparql_template_file =
			sparql_templates_path + sparql_template_file_base;
		
		// Try and read the individual files.
		var stf_stats = fs.statSync(sparql_template_file);
		if( ! stf_stats.isFile() ){
		    console.log('WARNING: Skipping: ' + sparql_template_file);
		}else{
		    var stf = null;
		    try {
			stf = yaml.load(sparql_template_file);
		    } catch(e) {
			console.log('WARNING: Not YAML: '+sparql_template_file);
		    }

		    // Okay: we seem to have a thing.
		    if( stf ){
			//console.log('stf', stf);

			var read_p = false;
			
			// Store an named/addressable SPARQL template.
			if( stf['handle'] ){
			    sparql_templates_named[stf['handle']] = stf;
			    read_p = true;
			}
			
			// Scan the variable for Noctua location signals.
			if( ! stf['variables'] || us.isEmpty(stf['variables'] )){
			    sparql_templates_universal.push(stf);
			    read_p = true;
			    console.log('Gosling (universal): ' +
					sparql_template_file);
			}else{
			    if( stf['variables'] ){
				// Edge, individual, and model.
				if( stf['variables']['model_id'] &&
				    stf['variables']['subject_id'] &&
				    stf['variables']['object_id'] &&
				    stf['variables']['relation_id'] ){
				    sparql_templates_edge.push(stf);
				    read_p = true;
				    console.log('Gosling (edge): ' +
				    sparql_template_file);
				}else if( stf['variables']['model_id'] &&
					  stf['variables']['individual_id'] ){
				    sparql_templates_individual.push(stf);
				    read_p = true;
				    console.log('Gosling (individual): ' +
				    sparql_template_file);
				}else if( stf['variables']['model_id'] ){
				    sparql_templates_model.push(stf);
				    read_p = true;
				    console.log('Gosling (model): '+
				    sparql_template_file);
				}else{
				    console.log('Gosling (skip, missed var)): '+
				    sparql_template_file);
				}
			    }else{
				console.log('Gosling (skip, empty var)): '+
					    sparql_template_file);
			    }
			}
			
			// Increment how/if the template was read.
			if( read_p ){
			    read_templates_count++;
			}else{
			    ignored_templates_count++;
			}
		    }
		}
	    });
	}
    } catch(e) {
	console.log('WARNING: Issue while trying to get SPARQL templates ' +
		    'for this context: ' + noctua_context, e);
    }

    console.log( read_templates_count +
		 ' SPARQL template(s) read; ' +
		 ignored_templates_count +' ignored.');

    ///
    /// Environment helpers for deployment; also changing some of the
    /// default values depending on the environment to help with
    /// deployment.
    ///

    // Set up server IP address and port # using env variables/defaults.
    // WARNING: Port stuff gets weird:
    // https://www.openshift.com/forums/openshift/nodejs-websockets-sockjs-and-other-client-hostings

    self.IS_ENV_OPENSHIFT = false;
    self.IS_ENV_HEROKU = false;
    self.IS_ENV_LOCAL = false;
    
    if( process.env.OPENSHIFT_APP_DNS ){
	self.IS_ENV_OPENSHIFT = true;
	
	// Try and setup hostname and port as best we can.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port = process.env.OPENSHIFT_NODEJS_PORT;
	self.hostport = 'http://' + process.env.OPENSHIFT_APP_DNS;
	
	// Also, we need to use the public version or minerva or badness.
	//self.barista_location = barloc_public;
	console.log('Changing Barista location  to: ' +
		    self.barista_location + ' for openshift');
	console.log('Changing Minerva definition to: ' +
		    self.minerva_definition_name + ' for openshift');
	
        console.log('Running as: OPENSHIFT_NODEJS');
    }else if( process.env.PORT ){
	    self.IS_ENV_HEROKU = true;
	
	// Try and setup port as best we can.
        self.port = process.env.PORT || 8910; // why this default?
	self.hostport = '';
	
	// Also, we need to use the public version or minerva or badness.
	//self.barista_location = barloc_public;
	console.log('Changing Barista location  to: ' +
		    self.barista_location + ' for heroku');
	console.log('Changing Minerva definition to: ' +
		    self.minerva_definition_name + ' for heroku');
	
        console.log('Running as: HEROKU_NODEJS');
    }else{
	self.IS_ENV_LOCAL = true;
	
	// If Noctua host is env defined, use that, or sane default.
	var u = url.parse(noctua_location);
        self.ipaddress =  u.hostname || '127.0.0.1';
        self.port = u.port;
	self.hostport = 'http://'+ self.ipaddress +':'+ self.port;
	
        console.log('Running as: LOCAL_NODEJS');
    }
    // This allows the links available to be optionally
    // different than the literal operating address of noctua.
    self.frontend = noctua_frontend || self.hostport;
    console.log('Detected frontend: ' + self.frontend);
    
    // Attempt to intelligently add a token to an input URL.
    // BUG: This code is repeated in bbop_mme_widgets.build_token_link()
    // and barista.js.
    function _build_token_link(url, token, token_name){
	var new_url = url;

	// Default to "barista_token".
	if( ! token_name ){ token_name = 'barista_token'; }

	if( token ){
	    if( new_url.indexOf('?') === -1 ){
		new_url = new_url + '?' + token_name + '=' + token;
	    }else{
		new_url = new_url + '&' + token_name + '=' + token;
	    }
	}

	return new_url;
    }

    ///
    /// Response helper.
    ///

    self.get_token = function(req){
	var ret = null;
	if( req && req.query && req.query['barista_token'] ){
	   ret = req.query['barista_token'];
	}
	return ret;
    };

    self.get_qp = function(req, query_parameter){
	var ret = null;
	if( req && req.query && req.query[query_parameter] ){
	   ret = req.query[query_parameter];
	}
	return ret;
    };

    self.standard_response = function(res, code, type, body){
	res.setHeader('Content-Type', type);
	res.setHeader('Content-Length', body.length);
	res.end(body);
	return res;
    };

    // Standard template arguments payload.
    self.standard_variable_load = function(app_path, app_name, req,
					   model_id, model_obj,
					   individual_id, subject_individual_id,
					   object_individual_id, relation_id,
					   additional_args) {

	// Setup branding, driven by external variable.
	var noctua_branding = 'Noctua (?)'; // self-name
	var noctua_minimal_p = false; // use of side panel in graph editor
	if( noctua_context === 'go' ){
	    noctua_branding = 'Noctua';
	}else if( noctua_context === 'monarch' ){
	    noctua_branding = 'WebPhenote';
	}else if( noctua_context === 'open' ){
	    noctua_branding = 'Noctua';
	    noctua_minimal_p = true;
	}else{
	    // Unknown miss.
	    console.log('WARNING: unknown context "' + noctua_context + '"');
	}

	// Try and see if we have an API token from the request.
	var barista_token = self.get_token(req);
	var noctua_landing = _build_token_link(self.frontend, barista_token);
	var barista_loc = self.barista_location;
	var barista_login = null;
	var barista_logout = null;
	if( app_path === '' || app_path === '/' ){ // non-id based pages.
	    barista_login = barista_loc + '/login' + '?return=' +
		self.frontend + app_path;
	    // Make sure that _build_token_link() doesn't get the '?' from
	    // barista_loc when determining whether to use ? or &
	    barista_logout = barista_loc + '/logout' +
		'?barista_token=' + barista_token +
		'&return=' + _build_token_link(self.frontend + app_path,
					       barista_token);
	}else{
	    barista_login = barista_loc + '/login' + '?return=' +
		self.frontend + app_path;
	    // Make sure that _build_token_link() doesn't get the '?' from
	    // barista_loc when determining whether to use ? or &
	    barista_logout = barista_loc + '/logout' +
		'?barista_token=' + barista_token +
		'&return=' + _build_token_link(self.frontend + app_path,
					       barista_token);
	}
	    
	var barista_users =
		_build_token_link(self.barista_location +'/user_info',
				  barista_token);
	var out_known_rels = self.known_relations;

	// Limit out variables in some cases.
	if( app_path === '' || app_path === '/' ){
	    out_known_rels = null;
	}

	var tmpl_args = {
	    'pup_tent_js_variables': [
		{name: 'global_model',
		 value: (model_obj || null)},
		// BUG/TODO: Three (historical) ways of referring to
		// model id--fix this.
		{name: 'global_id',
		 value: model_id },
		{name: 'model_id',
		 value: model_id },
		{name: 'global_model_id',
		 value: model_id },
		{name: 'global_individual_id',
		 value: individual_id },
		{name: 'global_subject_individual_id',
		 value: subject_individual_id },
		{name: 'global_object_individual_id',
		 value: object_individual_id },
		{name: 'global_relation_id',
		 value: relation_id },
		{name: 'global_golr_server',
		 value: golr_server_location},
		{name: 'global_golr_neo_server',
		 value: golr_neo_server_location},
		{name: 'global_minerva_definition_name',
		 value: self.minerva_definition_name },
		{name: 'global_barista_location',
		 value: self.barista_location },
		{name: 'global_noctua_context',
		 value: noctua_context },
		{name: 'global_noctua_minimal_p',
		 value: noctua_minimal_p },
		{name: 'global_external_browser_location',
		 value: external_browser_location },
		{name: 'global_known_relations',
		 value: out_known_rels },
		{name: 'global_collapsible_relations',
		 value: collapsible_relations },
		{name: 'global_collapsible_reverse_relations',
		 value: collapsible_reverse_relations },
		{name: 'global_barista_token',
		 value: barista_token },
		// Workbenches.
		{name: 'global_workbenches_universal',
		 value: workbenches_universal },
		{name: 'global_workbenches_model',
		 value: workbenches_model },
		{name: 'global_workbenches_individual',
		 value: workbenches_individual },
		{name: 'global_workbenches_edge',
		 value: workbenches_edge },
		// SPARQL templates.
		{name: 'global_sparql_templates_named',
		 value: sparql_templates_named },
		{name: 'global_sparql_templates_universal',
		 value: sparql_templates_universal },
		{name: 'global_sparql_templates_model',
		 value: sparql_templates_model },
		{name: 'global_sparql_templates_individual',
		 value: sparql_templates_individual },
		{name: 'global_sparql_templates_edge',
		 value: sparql_templates_edge },
		// GitHub.
		{name: 'global_github_api',
		 value: github_api },
		{name: 'global_github_org',
		 value: github_org },
		{name: 'global_github_repo',
		 value: github_repo },
		{name: 'global_use_github_p',
		 value: use_github_p }
	    ],
	    'title': notw + ' ' + app_name,
	    'model_id': model_id,
	    'individual_id': individual_id,
	    'subject_individual_id': subject_individual_id,
	    'object_individual_id': object_individual_id,
	    'relation_id': relation_id,
	    'barista_token': barista_token,
	    'barista_location': self.barista_location,
	    'barista_users': barista_users,
	    'noctua_dev_tabs': noctua_context !== 'monarch',
	    'noctua_context': noctua_context,
	    'external_browser_location': external_browser_location,
	    'github_api': github_api,
	    'github_org': github_org,
	    'github_repo': github_repo,
	    'use_github_p': use_github_p,
	    'noctua_minimal_p': noctua_minimal_p,
	    'noctua_landing': noctua_landing,
	    'noctua_branding': noctua_branding,
	    'barista_login': barista_login,
	    'barista_logout': barista_logout,
	    'noctua_workbenches_universal': workbenches_universal,
	    'noctua_workbenches_model': workbenches_model,
	    'noctua_workbenches_individual': workbenches_individual,
	    'noctua_workbenches_edge': workbenches_edge
	};

	// Load in the additions.
	each(additional_args, function(val, key){
	    tmpl_args[key] = val;
	});
	    
	return tmpl_args;
    };

    // Assemble return doc.
    self.bootstrap_editor = function(req, res, model_id, model_obj){

	// Assemble return doc.
	res.setHeader('Content-Type', 'text/html');

	var tmpl_args = self.standard_variable_load(
	    '/editor/graph/'+ model_id, 'Editor', req,
	    model_id, model_obj,
	    null, null,
	    null, null,
	    {
		'pup_tent_css_libraries': [
		    '/toastr.css',
		    '/noctua_common.css',
		    '/NoctuaEditor.css'
		],
		'pup_tent_js_libraries': [
		    '/jquery.jsPlumb-1.5.5.js',
		    //'/jsPlumb-1.5.5.js',
		    //'/jsPlumb-1.7.10-min.js',
		    //'/jsPlumb-2.1.7-min.js',
		    '/jquery.tablesorter.min.js',
		    self.barista_location + '/socket.io/socket.io.js',
		    '/connectors-sugiyama.js',
		    '/NoctuaEditor.js'
		]
	    });

	var ret = pup_tent.render('noctua_editor.tmpl',
				  tmpl_args, 'noctua_base.tmpl');
	self.standard_response(res, 200, 'text/html', ret);
    };

    ///
    /// Cache and template rendering.
    ///

    // Will pick things up recursively.
    var ppaths = ['static', 'deploy', 'css', 'templates', 'external_js'];

    // Add the paths for the workbenches. While we don't need these
    // for the asset delivery (that is taken care of directly by
    // express in the dynamic route creation below), we need it to
    // allow pup-tent to render the templates.
    each(all_workbenches, function(wb){
    	// We know these are good.
    	var path = wb['public-directory'];
    	ppaths.push(path);
    });
    var pup_tent = require('pup-tent')(ppaths, null, true);
    pup_tent.use_cache_p(false);
    pup_tent.set_common('css_libs', [
	'/bootstrap.min.css',
	'/jquery-ui-1.10.3.custom.min.css',
	'/bbop.css',
	'/amigo.css']);
    pup_tent.set_common('js_libs', [
	'/jquery.min.js',
	'/bootstrap.min.js',
	'/jquery-ui-1.10.3.custom.min.js',
    ]);
    //console.log('pup_tent', pup_tent.cached_list().sort());

    ///
    /// Termination functions.
    ///

    // terminator === the termination handler
    // Terminate server on receipt of the specified signal.
    // @param {string} sig  Signal to terminate on.
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating noctua...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };

    // Setup termination handlers (for exit and a list of signals).
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };

    ///
    /// App server functions (main app logic here).
    ///

    // Initialize the server (launcher_app) and create the routes and register
    // the handlers.
    self.initializeServer = function(){

	var launcher_app = require('express');
	var body_parser = require('body-parser');
        self.app = launcher_app();
	// Middleware needed for POST and browserid
        //self.app.use(launcher_app.bodyParser());
	self.app.use(body_parser.json());
	self.app.use(body_parser.urlencoded({ extended: true }));

	///
	/// Static routes.
	///

	self.app.get('/', function(req, res) {
	    // Grab markdown renderable file.
	    var landing_raw = fs.readFileSync('./OVERVIEW.' + noctua_context + '.md').toString();
	    var landing_md = md.markdown.toHTML(landing_raw);
	    var about_raw = fs.readFileSync('./ABOUT.' + noctua_context + '.md').toString();
	    var about_md = md.markdown.toHTML(about_raw);

	    var tmpl_args = self.standard_variable_load(
		'/', 'Landing', req,
		null, null,
		null, null,
		null, null,
		{
		    'pup_tent_css_libraries': [
			'/toastr.css',
			'jquery.dataTables.min.css',
			'/noctua_common.css',
			'/noctua_landing.css'
		    ],
		    'pup_tent_js_libraries': [
			'jquery.dataTables.min.js',
			'/NoctuaLanding.js'
		    ],
		    'landing_html': landing_md,
		    'about_html': about_md
		});

	    // Render.
	    var o = pup_tent.render('noctua_landing.tmpl',
				    tmpl_args,
				    'noctua_base_landing.tmpl');
	    self.standard_response(res, 200, 'text/html', o);
	});

	// General markdown documentation.
	self.app.get('/doc/:fname', function(req, res) {

	    var final_content = '???';
	    var fname = req.params['fname'] || '';
	    if( ! fname || fname === '' ){
		// Catch error here if no proper fname.
		final_content = '<h5>doc/name required</h5>';
	    }else{

		// Optionally, remove .html (for now).
		fname = path.basename(fname, '.html');
		
		// For now, map this to a markdown doc in the context
		// directory.
		var mapped_fname = './context/' + noctua_context +
			'/markdown-docs/' + fname + '.md';

		// Detect if file exists.
		try {
		    var fstats = fs.statSync(mapped_fname);
		    if( ! fstats.isFile() ){
			// Catch error here if not found.
			final_content = '<h5>' + fname + '" not file</h5>';
		    }else{			
			// Grab markdown renderable file.
			var fname_raw = fs.readFileSync(mapped_fname).toString();
			final_content = md.markdown.toHTML(fname_raw);
		    }
		} catch(e) {
		    // Catch error here if not found.
		    final_content = '<h5>no "' + fname + '" for "' +
			noctua_context + '"</h5>: ' + mapped_fname;
		}
	    }

	    //
	    var tmpl_args = self.standard_variable_load(
		'/doc/' + fname, fname, req,
		null, null,
		null, null,
		null, null,
		{
		    'pup_tent_css_libraries': [
			//'/toastr.css',
			//'jquery.dataTables.min.css',
			'/noctua_common.css'//,
			//'/noctua_landing.css'
		    ],
		    'pup_tent_js_libraries': [
			//'jquery.dataTables.min.js',
		    ],
		    'content_insert': final_content
		});
	    
	    // Render.
	    var o = pup_tent.render('noctua_markdoc.tmpl',
				    tmpl_args,
				    'noctua_base_content_frame.tmpl');
	    self.standard_response(res, 200, 'text/html', o);
	});

	// 
	self.app.get('/basic/:model_type/:query', function(req, res) {

	    // Try and see if we have an API token.
	    var barista_token = self.get_token(req);
	    var model_type = req.params['model_type'] || '';
	    var model_id = req.params['query'] || '';
	    var noctua_landing = _build_token_link(self.frontend, barista_token);
	    var noctua_branding = 'Noctua';
	    if( noctua_context === 'monarch' ){ noctua_branding = 'WebPhenote'; }
	    var barista_login = self.barista_location + '/login?return=' +
		    self.frontend + '/basic/' + model_type + '/' + model_id;
	    var barista_logout =
		    _build_token_link(self.barista_location + '/logout' +
				      '?barista_token=' + barista_token +
				      '&return=' + self.frontend + '/basic/' +
				      model_type +'/'+ model_id, barista_token);

	    //
	    var model_obj = null;

		var tmpl_args = self.standard_variable_load(
		    '/basic/' + model_type + '/' + model_id, 'FormEditor', req,
		    model_id, model_obj,
		    null, null,
		    null, null,
		    {
				'pup_tent_js_libraries': [
				    '/deploy/js/NoctuaBasic/NoctuaBasicApp.js',
				    '/deploy/angular-toastr.tpls.min.js'
				],
				'pup_tent_css_libraries': [
				    '/noctua_common.css',
				    '/NoctuaBasic.css',
				    '/selectize.css',
				    '/selectize.bootstrap3.css',
				    '/selectize.custom.css',
				    '/angular-toastr.css',
				    '/ui-grid.css',
				    '/select.min.css',
				    '/toastr_custom.css'
				],
				'model_type': model_type
		    });

		tmpl_args.pup_tent_js_variables.push(
			{name: 'global_model_type',
			 value: model_type });

	    var ind = pup_tent.render('noctua_basic.tmpl',
				      tmpl_args,
				      'noctua_base_landing.tmpl');
	    self.standard_response(res, 200, 'text/html', ind);
	});

	// Routes for all static cache items.
	each(pup_tent.cached_list(), function(thing) {

	    var ctype = mime.lookup(thing);

	    // This will skip cached templates.
	    if (ctype !== null) {
		self.app.get('/' + thing, function(req, res) {

		    res.setHeader('Content-Type', ctype);
		    res.send(pup_tent.get(thing) );
		});
	    }
	});

	// Fonts are special!
	self.app.use('/fonts', launcher_app.static('static/fonts'));
	self.app.use('/ui-grid.svg', launcher_app.static('./node_modules/angular-ui-grid/ui-grid.svg'));
	self.app.use('/ui-grid.ttf', launcher_app.static('./node_modules/angular-ui-grid/ui-grid.ttf'));
	self.app.use('/ui-grid.woff', launcher_app.static('./node_modules/angular-ui-grid/ui-grid.woff'));

	// Other static routes.
	// BUG/TODO: Hardcoded--likely need a pathname getter in pup_tent.
	// Probably use _path_cache(key).
	var static_images = [ // BUG/TODO: Hack.
	    ['go_logo.png', 'png'],
	    ['open_logo.png', 'png'],
	    ['monarch_logo.png', 'png'],
	    ['waiting_ac.gif', 'gif'],
	    ['ui-bg_flat_100_ffffff_40x100.png', 'png'],
	    ['ui-bg_flat_75_d0ffee_40x100.png', 'png'],
	    ['sort_asc.png', 'png'],
	    ['sort_desc.png', 'png'],
	    ['sort_both.png', 'png']
	];
	each(static_images, function(item){
	    var fname = item[0];
	    var type = item[1];
	    self.app.get('/images/' + fname, function(req, res){
		res.setHeader('Content-Type', 'image/' + type);
		res.sendfile('static/' + fname);
	    });
	});

	// TODO: This obviously does not do anything than supress some types
	// of error messages.
	self.app.get('/favicon.ico', function(req, res){
	    self.standard_response(res, 200, 'image/x-icon', '');
	});

	// Error redirect catch.
	self.app.get('/error', function(req, res) {

	    console.log('caught intentional redirect for error report');

	    //console.log(req.route);
	    //console.log(req.params['query']);
	    var etype = self.get_qp(req, 'type') || 'unclassified error';
	    var emessage = self.get_qp(req, 'message') || 'unknown error';

	    var fin = [
		'<html>',
		'<div>',
		'<h4>',
		'ERROR: ' + etype,
		'</h4>',
		'<p>',
		emessage,
		'</p>',
		'</div>',
		'</html>',
	    ];
	    
	    self.standard_response(res, 200, 'text/html', fin.join(''));
	});

	///
	/// High-level status overview and heartbeat
	///

	self.app.get('/status', function(req, res) {

	    console.log('process heartbeat request');

	    var ret_obj = {
		'name': 'Noctua',
		'okay': true,
		'date': (new Date()).toJSON(),
		'location': self.frontend,
		'listening': self.hostport,
		'offerings': [
		    {
			'name': 'external_kicks',
			'value': monitor_external_kicks
		    },
		    {
			'name': 'internal_kicks',
			'value': monitor_internal_kicks
		    }
		]
	    };
	    var fin = JSON.stringify(ret_obj);

	    self.standard_response(res, 200, 'application/json', fin);
	});

	///
	/// Dynamic components/routes.
	///

	// Define the GOlr request conf.
	var gconf = new golr_conf.conf(amigo.data.golr);

	// Directly kick-to-edit an extant model--most things should
	// pass through here.
	self.app.get('/editor/graph/:query', function(req, res) {

	    monitor_internal_kicks = monitor_internal_kicks + 1;

	    //console.log(req.route);
	    //console.log(req.params['query']);
	    var query = req.params['query'] || '';
	    if( ! query || query === '' ){
		// Catch error here if no proper ID.
		res.setHeader('Content-Type', 'text/html');
		res.send('no identifier');
	    }else{

		// Try and see if we have an API token.
		var barista_token = self.get_token(req);
		self.bootstrap_editor(req, res, query, null);
	    }
	});

	// Realize all the detected workbenches into routes in our
	// system.
	var express = require('express'); // using this for convenience in
					  // defining static middleware below
	each(all_workbenches, function(wb){

	    // We know these are good from the checking above.
	    var menu_name = wb['menu-name'];
	    var page_name = wb['page-name'];
	    var wbtype = wb['type'];
	    var help_link = wb['help-link'];
	    var wbid = wb['workbench-id'];
	    var pub_dir = wb['public-directory'];
	    var tmpl_inj = wb['template-injectable'];

	    // Add the public directory for the workbenches to the
	    // standard express static delivery.
	    self.app.use('/workbench/' + wbid, express.static(pub_dir));

	    // Scrape out the content of the public directory
	    // for injection into template.
	    var injectable_js = wb['javascript'] || [];	
	    var injectable_css = wb['css'] || [];	

	    self.app.get('/workbench/' + wbid, function(req, res){
		    
		monitor_internal_kicks = monitor_internal_kicks + 1;
		
		// All possible workbench types. Jimmy out the arguments.
		var model_id = null;
		var individual_id = null;
		var subject_individual_id = null;
		var object_individual_id = null;
		var relation_id = null;
		if( wbtype === 'universal' ){
		    // Pass.
		}else if( wbtype === 'model' ){
	    	    model_id = req.query['model_id'] || null;
		    if( ! model_id ){
			self.standard_response(res, 500, 'text/html',
					       'Need model_id');
		    }
		}else if( wbtype === 'individual' ){
	    	    model_id = req.query['model_id'] || null;
	    	    individual_id = req.query['individual_id'] || null;
		    if( ! model_id || ! individual_id ){
			self.standard_response(res, 500, 'text/html',
					       'Need model_id or individual_id');
		    }
		}else if( wbtype === 'edge' ){
	    	    model_id = req.query['model_id'] || null;
	    	    subject_individual_id =
			req.query['subject_individual_id'] || null;
	    	    object_individual_id =
			req.query['object_individual_id'] || null;
	    	    relation_id = req.query['relation_id'] || null;
		    if( ! model_id || ! subject_individual_id ||
			! object_individual_id || ! relation_id ){
			self.standard_response(res, 500, 'text/html',
					       'Need model_id or ' +
					       'subject_individual_id or' +
					       'object_individual_id or' +
					       'relation_id');
			}
		}else{
		    // TODO: Error.
		}

		var tmpl_args = self.standard_variable_load(
		    '/workbench/' + wbid, page_name, req,
		    model_id, null,
		    individual_id, subject_individual_id,
		    object_individual_id, relation_id,
		    {
			'pup_tent_css_libraries': injectable_css,
			'pup_tent_js_libraries': injectable_js,
			'workbench_help_link': help_link
		    });
		
		// Render.
		//console.log('tmpl_inj', tmpl_inj);
		var ret = pup_tent.render(tmpl_inj, tmpl_args,
					  'noctua_base_workbench.tmpl');
		self.standard_response(res, 200, 'text/html', ret);
	    });
	});
	
	// DEBUG: A JSON model debugging tool for @hdietze
	/// This path will eventually be destroyed.
	self.app.post('/seed/json', function(req, res) {

	    monitor_internal_kicks = monitor_internal_kicks + 1;

	    var jmod_str = req.body['json-model'] || '';
	    if( ! jmod_str || jmod_str === '' ){
		// Catch error here if no proper ID.
		res.setHeader('Content-Type', 'text/html');
		res.send('no json model');
	    }else{
		var jmod = JSON.parse(jmod_str); // to obj

		// No token, no editing, because this is crazy.
		self.bootstrap_editor(req, res, null, jmod);
	    }
	});

	// Local logger for while we work this out.
	var tll = function(str){
	    console.log('tractorbeam ['+ (new Date()).toJSON() +']: ', str);
	};
	
	// A function to send a fail response to a client without
	// bothering barista/minerva with requests we know ain't gunna
	// work.
	var pre_fail = function(res, message, comment){
	    // Headers.
	    res.status(404);
	    res.setHeader('Content-Type', 'application/json');
	    
	    // Fake bbop-response-barista response as above.
	    var fail_resp = {
		"message-type": "error",
		"message": message,
		"commentary": comment
	    };
	    res.send(JSON.stringify(fail_resp));
	};

	// Offer POST, not GET.
	self.app.get('/tractorbeam', function(req, res){
	    tll('attempt to GET tractorbeam');
	    pre_fail(res, "no GET endpoint",
		     "try POST instead of GET at this URL");
	});
	self.app.post('/tractorbeam', function(req, res){

	    monitor_internal_kicks = monitor_internal_kicks + 1;

	    // BUG/TODO: This doesn't work because we're already using
	    // a body parser...?
	    // Collect the full POST body (if there is one) before
	    // proceeding.
	    // var full_body ='';
	    // req.on('data', function(chunk) {
	    // 	full_body += chunk.toString();
	    // });
	    // req.on('end', function() {
	    // 	console.log("Received body data: " + full_body);
		// // Chunks to object.
		// var decoded_body = querystring.parse(full_body) || {};
		// console.log('decoded body', decoded_body);

	    // Assume batched list.
	    var decoded_body = req.body || {};

            // At least token and requests are required to get through
            // here.
	    if( us.isEmpty(decoded_body) ){
		pre_fail(res, "no POST data", "meh");
	    }else if( ! decoded_body['token'] ){
		pre_fail(res, "no token in POST data", "meh");
	    }else if( ! decoded_body['requests'] ||
		      ! us.isArray(decoded_body['requests']) ){
		pre_fail(res, "no required requests in POST data", "meh");
	    }else if( us.isEmpty(decoded_body['requests']) ){
		pre_fail(res, "requests empty in POST data", "meh");
	    }else{

		// Assume that we're going to send a JSON payload back
		// over the wire. The other alternative is to forward
		// the user to a new HTML page on our end.
		var json_response_p = true;
		// Also want to know how to return.
		var x_return_url = decoded_body['x-return-url'];
		if( x_return_url && us.isString(x_return_url) ){
		    json_response_p = false;
		}
	    
		// We assume Textpresso, but others could be using
		// this too. 
		var external_client_id = null;
		if( decoded_body['x-client-id'] ){
		    external_client_id = decoded_body['x-client-id'];
		}
		
	        tll('looks like we can make minerva attempt');
	        var cap_token = decoded_body['token'];
		tll('with token: ' + cap_token);

		var rs = null;
		if( external_client_id === 'pubannotation.org' ){

		    // // TODO.
		    // // https://github.com/geneontology/noctua/issues/316
		    // pre_fail(res, "does not yet support pubannotator", "almost");

		    // Ready to roll. Confirm this type of input:
		    //{
		    //  "requests": [],
		    //  "x-return-url": "http://localhost:8910/editor/graph/gomodel:584b49fa00000194?barista_token=123",
		    //  "x-fact-relation-id": "RO:0002411",
		    //  "x-fact-target-id": "gomodel:584b49fa00000194/584b49fa00000205",
		    //  "x-fact-source-id": "gomodel:584b49fa00000194/586fc17a00000115",
		    //  "x-client-id": "pubannotation.org",
		    //  "x-model-id": "gomodel:584b49fa00000194",
		    //  "token": "1234567890"
		    //}
		    
		    // We require a model.
		    var pa_model_id = decoded_body['x-model-id'];
		    rs = new minerva_requests.request_set(cap_token, pa_model_id);
		    console.log('x-client: use model: ' + pa_model_id);

		    // And the rest for a fact location.
		    var pa_fact_source_id = decoded_body['x-fact-source-id'];
		    var pa_fact_target_id = decoded_body['x-fact-target-id'];
		    var pa_fact_relation_id = decoded_body['x-fact-relation-id'];
		    
		    // We can throw this out as it is Barista's problem,
		    // not ours.
		    var pa_user_id = null;
		    if( decoded_body['x-user-id'] ){
			pa_user_id = decoded_body['x-user-id'];
		    }

		    // This is known/hoped to be a populated array.
		    var pa_requests = decoded_body['requests'];
		    
		    // From here, loop through and collect all of the
		    // requests, depending on who we think the client is.
		    var comments = [];
		    each(pa_requests, function(pa_request){
			comments.push(pa_request);
		    });

		    if( ! pa_fact_source_id || ! pa_fact_target_id || ! pa_fact_relation_id || ! pa_model_id || ! us.isArray(comments) || (comments.length === 0) || ! cap_token ){
			
			pre_fail(res, 'insufficient arg data to continue',
				 'one of the necessary fields was not provided');
		    }else{

			// TODO: Add this to evidence in more sensible way.
			//var pf = rs.add_fact(
			rs.add_annotation_to_fact('comment', comments, null,
						  [pa_fact_source_id,
						   pa_fact_target_id,
						   pa_fact_relation_id]);
		    }
		
		}else if( external_client_id === 'tpc' ){
		    
		    // We first need to extract these:
		    // https://github.com/geneontology/noctua/issues/147
		    // https://github.com/geneontology/noctua/issues/283
		    // E.g.:
		    // {
		    //  "token": "sdlkjslkjd",
		    //  "x-model-id": "gomodel:01234567", // optional when new
		    //  "x-client-id": "textpresso"
		    //  "x-user-id": "http://happy.user", // optional, don't need
		    //  "requests": [
		    //   {
		    //    "database-id" : "UniProtKB:A0A005",
		    //    "evidence-id" : "ECO:0000314",
		    //    "class-id" : "GO:0050689",
		    //    "reference-id" : "PMID:666333",
		    //    "external-id" : "XXX:YYYYYYY",
		    //    "comments" : ["foo", "bar"]
		    //   }
		    //  ]
		    // }

		    // Also, if there is a model id number, use that,
		    // otherwise we'll be creating a new model. Start
		    // the request set we'll use as the collector. We
		    // might build our own model from scratch.
		    if( decoded_body['x-model-id'] ){
			// Has model in mind.
			var external_model_id = decoded_body['x-model-id'];
			rs = new minerva_requests.request_set(cap_token,
							      external_model_id);
			console.log('x-client: use model: ' + external_model_id);
		    }else{
			// No model; create new.
			rs = new minerva_requests.request_set(cap_token);
			rs.add_model();
			console.log('x-client: new model');
		    }

		    // We can throw this out as it is Barista's problem,
		    // not ours.
		    var external_user_id = null;
		    if( decoded_body['x-user-id'] ){
			external_user_id = decoded_body['x-user-id'];
		    }

		    // This is known to be a populated array, but the
		    // contents will depend on who the calling client is.
		    var incoming_requests = decoded_body['requests'];
		    
		    // From here, loop through and collect all of the
		    // requests, depending on who we think the client is.
		    each(incoming_requests, function(incoming_request){
			
			// GP/entity.
			var gpid = null;
			if( incoming_request['database-id'] ){
			    gpid = incoming_request['database-id'];
			}
			
			// Evidence.
			var evid = null;
			if( incoming_request['evidence-id'] ){
			    evid = incoming_request['evidence-id'];
			}
			
			// Class/term.
			var clsid = null;
			if( incoming_request['class-id'] ){
			    clsid = incoming_request['class-id'];
			}
			
			// Class/term.
			var refid = null;
			if( incoming_request['reference-id'] ){
			    refid = incoming_request['reference-id'];
			}
			
			// External ID.
			var txpid = null;
			if( incoming_request['external-id'] ){
			    txpid = incoming_request['external-id'];
			}
			
			// Comments, list of strings.
			var comments = [];
			if( incoming_request['comments'] ){
			    var cmts = incoming_request['comments'];
			    
			    if( us.isArray(cmts) ){
				comments = cmts;
			    }else if( us.isString(cmts) ){
				comments.push(cmts);
			    }
			}
			
			// TODO/BUG: For now, toss the textspresso id into
			// comments for experimentation.
			if( txpid ){
			    comments.push(txpid);
			}
			
			// Double check we're clear, then go.
			if( ! refid || ! clsid || ! evid || ! gpid ){
			    pre_fail(res, 'insufficient arg data to continue',
				     'n/a');
			}else{
			    
			    // Assemble a minerva-request to go along with
			    // rich annoton.
			    var ind1 = rs.add_individual(clsid);
			    var ind2 = rs.add_individual(gpid);
			    var f1 = rs.add_fact([ind1, ind2, 'RO:0002333']);
			    //rs.add_svf_expression(gpid, 'RO:0002333');	
			    var ev1 =
				    rs.add_evidence(evid, [refid], [],
						    [ind1, ind2, 'RO:0002333']);
			    
			    // BUG/TODO: temporarily store comments here.
			    rs.add_annotation_to_fact('comment', comments,
						      null, f1);
			}
		    });

		}else{

		    // TODO: The general case should be just
		    // converting the incoming requests directly as
		    // minerva requests.
		    pre_fail(res, "does not yet support min-req", "almost");

		}
		
		// Okay, we've got probably good input as we haven't
		// bailed out yet. Grab model for export with fresh
		// manager. Switch fundamentally on whether this is a
		// transparent JSON return or a forwarding situation.
		if( json_response_p ){

		    (function(){
			var cap_engine = new node_engine(barista_response);
			var cap_manager =
				new minerva_manager(self.barista_location,
						    self.minerva_definition_name,
						    cap_token, cap_engine,
						    'async');
			//null, cap_engine, 'async');
			
			// First, error callbacks.
			cap_manager.register('error', function(resp, man){
			    pre_fail(res, 'could not resolve model: ' +
				     JSON.stringify(resp.raw()), 'n/a');
			});
			cap_manager.register('manager_error',function(resp, man){
			    pre_fail(res, 'comms issues for this model: ' +
				     JSON.stringify(resp.raw()), 'n/a');
			});
		    
			// Possible success callback--return response
			// straight?
			cap_manager.register('merge', function(resp, man){
			    res.setHeader('Content-Type', 'application/json');
			    res.send(JSON.stringify(resp.raw()));
			});
			cap_manager.register('rebuild', function(resp, man){
			    res.setHeader('Content-Type', 'application/json');
			    res.send(JSON.stringify(resp.raw()));
			});
			
			// Trigger tractorbeam manager.
			tll('request_with: ' + JSON.stringify(rs.structure()));
			cap_manager.request_with(rs);
		    })();
		    
		}else{
		    
		    // TODO:
		    // Forward on success, display error page on
		    // failure.
		    (function(){
			var cap_engine = new node_engine(barista_response);
			var cap_manager =
				new minerva_manager(self.barista_location,
						    self.minerva_definition_name,
						    cap_token, cap_engine,
						    'async');
			//null, cap_engine, 'async');
			
			// First, error callbacks.
			cap_manager.register('error', function(resp, man){
			    var etype = encodeURIComponent(
				'server error; could not resolve model');
			    var emessage = encodeURIComponent(
				JSON.stringify(resp.raw()));
			    res.redirect('/error');
			});
			cap_manager.register('manager_error',function(resp, man){
			    var etype = encodeURIComponent(
				'manager error; could not resolve model');
			    var emessage = encodeURIComponent(
				JSON.stringify(resp.raw()));
			    res.redirect('/error');
			});
			
			// Possible success callback--return response
			// straight?
			cap_manager.register('merge', function(resp, man){
			    res.redirect(x_return_url);
			});
			cap_manager.register('rebuild', function(resp, man){
			    res.redirect(x_return_url);
			});
			
			// Trigger tractorbeam manager.
			tll('request_with: ' + JSON.stringify(rs.structure()));
			cap_manager.request_with(rs);
		    })();
		}
	    }
	    //});
	});
	
	// Test export handler.
	self.app.post('/action/display', function(req, res) {

	    // Deal with incoming parameters.
	    var mstr = req.query['thing'] ||
		    req.params['thing'] ||
		    req.body['thing'] ||
		    '???';
	    //console.log('display thing: ' + mstr);
	    
	    // Assemble return doc.
	    //res.setHeader('Content-Type', 'text/owl');
	    res.setHeader('Content-Type', 'text/plain');
	    res.send(unescape(mstr));
	});
	
	// Downloads for the impatient.
	self.app.get('/download/:model/:format?', function(req, res){

	    monitor_internal_kicks = monitor_internal_kicks + 1;
	    
	    // Listing of known download formats.
	    var known_formats = ['owl', 'gaf', 'gpad'];

	    //console.log(req.route);
	    //console.log(req.params['query']);
	    var model_id = req.params['model'] || '';
	    var format = req.params['format'] || 'owl';
	    if( ! model_id || model_id === '' ){
		// Catch error here if no proper ID.
		res.status(404);
		res.setHeader('Content-Type', 'text/plain');
		res.send('no model identifier');
	    }else if( ! format ){
		// Catch error here if no format.
		res.status(404);
		res.setHeader('Content-Type', 'text/plain');
		res.send('no format identifier');
	    }else if( us.indexOf(known_formats, format) === -1 ){
		// Catch error here if no known format.
		res.status(404);
		res.setHeader('Content-Type', 'text/plain');
		res.send('no known format identifier: ' + format);
	    }else{
		
		// Okay, we've got probably good input. Grab model for
		// export with fresh manager.
		var ex_engine = new node_engine(barista_response);
		var ex_manager =
			new minerva_manager(self.barista_location,
					    self.minerva_definition_name,
					    null, ex_engine, 'async');
		
		// First, error callbacks.
		ex_manager.register('error', function(resp, man){
		    res.status(400);
		    res.setHeader('Content-Type', 'text/plain');
		    res.send('apparently could not resolve model');
		});
		ex_manager.register('manager_error', function(resp, man){
		    res.status(400);
		    res.setHeader('Content-Type', 'text/plain');
		    res.send('comms issues for this model');
		});
		
		// Possible success callback.
		ex_manager.register('meta', function(resp, man){
	    	    // Export error.
	    	    if( ! resp.export_model() ){
			res.status(400);
			res.setHeader('Content-Type', 'text/plain');
			res.send('exported not working?');
		    }else{
			var exp = resp.export_model();
			res.setHeader('Content-Type', 'text/plain');
			res.send(exp);		    
		    }
		});
		
		// Trigger export, owl is default.
		if( format === 'owl' ){
	    	    ex_manager.export_model(model_id);
		}else{
		    // All other formats.
	    	    ex_manager.export_model(model_id, format);
		}
	    }
	});
    };

    // Initializes the sample application.
    self.initialize = function(known_relations){

	self.known_relations = known_relations || [];

        // self.setupVariables();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };

    // Start the server (starts up the sample application).
    // Either in Heroku, Openshift, or various local.
    self.start = function() {
	if( self.IS_ENV_HEROKU ){
	    // Heroku seems to want a more minimal launch.
	    self.app.listen(self.port, function() {
		console.log('%s: Node started (heroku) on http://%s:%d ...',
			    Date(Date.now()), self.ipaddress||'???', self.port);
	    });
	}else{
            // Start the app on the specific interface (and port).
            self.app.listen(self.port, self.ipaddress, function() {
		console.log('%s: Node started (custom) on http://%s:%d ...',
			    Date(Date.now()), self.ipaddress, self.port);
	    });
	}
    };
};

///
/// Main.
///

// Setup calls: don't finalize the startup until we pull the rest of
// the interesting things we need from the server first.
var init_engine = new node_engine(barista_response);
var init_manager = new minerva_manager(barloc, min_def_name,
				       null, init_engine, 'async');

init_manager.register('meta', function(resp, man){

    console.log('Continue bootstrap: response is: ' + what_is(resp));
    //console.log('response', resp.raw());
    var nrel = resp.relations().length;
    console.log("Continue bootstrap: got " + nrel +
		" relations, starting initializing sequence...");

    if( nrel > 0 ){
	// Deliver the prototype JS MME application to the client.
	var noctua = new NoctuaLauncher();
	noctua.initialize(resp.relations());
	noctua.start();
    }else{
	console.error('failure: no relations on initialization response');
    }
    
});
init_manager.register('manager_error', function(resp, man){
    console.log('okay?: %j', resp.okay());
    console.log('message type: %j', resp.message_type());
    console.log('message: %j', resp.message());
});
init_manager.register('error', function(resp, man){
    console.log('okay?: %j', resp.okay());
    console.log('message type: %j', resp.message_type());
    console.log('message: %j', resp.message());
});

init_manager.get_meta();
console.log("Started bootstrap with meta minerva request.");
