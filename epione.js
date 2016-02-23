////
//// Greek Goddess of soothing pain.
////
//// Optional companion file monitor for Minerva. Should be turned on
//// before Minerva is started to make sure they're on the same page.
////
//// Requires custom document type for GOlr: "noctua_model_meta". Git
//// operations are not going to be initially implemented, in parens.
////
//// - On initial start
////  - wipes document type "noctua_model_meta"
////  - scans and reads all files
////  - adds all files to  GOlr
////  (- if there have been any uncommited changes, commit and push)
//// - Watches for file alterations
////  - On update/creation
////   - re-read document (scan single doc)
////   - Solr clobber (or is it delete and re-add?)
////   (- if add: commit add to git)
////   (- if change: commit change to git)
////   (- push commit)
////  - On deletion
////   - remove that ID from GOlr (model_id + document_category)
////   (- commit deletion to git)
////   (- push commit)
//// - Periodic
////  - ?Send optimize command to Solr?
////
//// Requires custom document type for GOlr.
//// amigo/metadata/noctua-model-meta-config.yaml
//// 
//// Usage: node epione.js --monitor A/B/ --golr http://localhost:8080/solr --users C/D
////
//// Note that the currently used FAM is a little slow, taking on the
//// order of seconds.
////

var document_category = 'noctua_model_meta';
var golr_location = null;

// Std utils.
var fs = require('fs');
var us = require('underscore');
var ustr = require('underscore.string');
//var Q = require('q');
var yaml = require('yamljs');
var url = require('url');

// TODO: External interaction.
//var watch = require('watch');
//var git = require('git');
var solr = require('solr-client');

var watch = require('watch');

//var N3 = require('n3');
//var parser = N3.Parser();

var wait = require('wait.for');

// CLI handling.
var argv = require('minimist')(process.argv.slice(2));
//console.dir(argv);

///
/// Helpers and aliases.
///

var each = us.each;

var quote_re = /\\\"/gi;

function ll(arg1){
    console.log('epione [' + (new Date()).toJSON() + ']: ', arg1); 
}

function _die(message){
    console.error('EPIONE [' + (new Date()).toJSON() + ']: ' + message);
    process.exit(-1);
}

// Until we get a parser, we just want to compile at startup.
var matcher = {
/* jshint ignore:start */
    ontology: /Ontology\: \<([^]*)\>/,
    title: /\<http\:\/\/purl\.org\/dc\/elements\/1\.1\/title\>\ \"([^]*)\"\^\^xsd\:string/,
    date: /\<http\:\/\/purl\.org\/dc\/elements\/1\.1\/date\>\ \"([^]*)\"\^\^xsd\:string/,
    contributor: /\<http\:\/\/purl\.org\/dc\/elements\/1\.1\/contributor\>\ \"([^]*)\"\^\^xsd\:string/,
    state: /\<http\:\/\/geneontology\.org\/lego\/modelstate\>\ \"([^]*)\"\^\^xsd\:string/,
    comment: /rdfs\:comment\ \"([^]*)\"\^\^xsd\:string/,
    owl_blob_json: /\<http\:\/\/geneontology\.org\/lego\/json\-model\>\ \"([^]*)\"\^\^xsd\:string/
/* jshint ignore:end */
};
var match_types = us.keys(matcher);
function _pull_line(str){
    var ret = null;

    if( str ){

	// Want to break quickly, so for loop and break.
	for( var i = 0; i < match_types.length; i++ ){
	    var type = match_types[i];
	    var regexp = matcher[type];

	    var match = str.match(regexp);
	    if( ! match ){
		//
	    }else{
		ret = {};
		ret[type] = match[1];
		break;
	    }
	}
    }

    return ret;
}

// File reading/parsing.
// TODO; is there a turtle parser? Do this by hand?
// TODO: async code here?
function _filename_to_json(fname){
    var ret = {};

    // TODO.
    var buf = fs.readFileSync(fname);
    if( buf ){
	var str = buf.toString();

	var lines = str.split(/\n/);
	var cache = {};
	each(lines, function(line){

	    var pulled = _pull_line(line);
	    if( pulled ){

		each(pulled, function(val, key){
		    if( typeof(cache[key]) === 'undefined' ){
			cache[key] = {};
		    }
		    cache[key][val] = true;
		});
	    }
	});

	each(cache, function(set, key){
	    ret[key] = us.keys(set);
	});	

	// Check that we have an ID.
	if( ret['ontology'] && ret['ontology'].length !== 1 ){
	    ret = null;
	}
	
	// Grrr--only Manchester seems to no exist for JS:
	// http://www.w3.org/community/rdfjs/wiki/Comparison_of_RDFJS_libraries#Parsing_libraries
	// // TODO: PARSING
	// parser.parse(str, function(error, triple, prefixes){
        //     if( triple ){
        //         ll(triple.subject, triple.predicate, triple.object, '.');
        //     }else{
        //         ll("# That's all, folks!", prefixes);
        //     }
	// });
    }
    
    return ret;
}

// Return whether or not the file likely seems like a model.
//var check_regexp = /\d{16}$/g;
var model_regexp = /\/([0-9a-f]{16})$/;
function _file_okay_p(fname){
    var ret = false;

    if( model_regexp.test(fname) ){
	ret = true;
    }

    return ret;
}

// Return a list of all files in a given dir.
// TODO: Recursive?
function _all_files(dir){
    var ret = [];

    ret = fs.readdirSync(dir);

    return ret;
}

//
function _file_to_payload(fname){

    var deliverable = null;

    var blob = _filename_to_json(fname);
    if( ! blob || us.isEmpty(blob) ){
	ll('Could NOT process: ' + fname);
    }else{
	ll('Read and processed: ' + fname);
	
	// Reuse contributor in lookup if possible.
	var ckeys = blob['contributor'];
	var clabels = [];
	each(ckeys, function(ckey){
	    if( keyed_users[ckey] ){
		clabels.push(keyed_users[ckey]);
	    }
	});

	// Model date should be last date.
	var model_date = null;	
	var all_dates = blob['date'];
	if( ! us.isEmpty(all_dates) ){
	    //model_date = all_dates.sort()[0]; // whoops - earliest
	    model_date = all_dates.sort()[all_dates.length -1];
	}

	var comment = null;
	if( blob['comment'] ){
	    comment = blob['comment'].join(' / ');
	}

	// Just the one, hopefully.
	var owl_blob_json = null;
	if( blob['owl_blob_json'] && blob['owl_blob_json'][0] ){
	    //ll( blob['owl_blob_json'][0] );
	    // Get rid of extra escaping that slips in.
	    //owl_blob_json = blob['owl_blob_json'][0];
	    owl_blob_json = blob['owl_blob_json'][0].replace(quote_re, '"');
	    //ll( owl_blob_json );
	}

	var title = '???';
	if( blob['title'] ){
	    title = blob['title'].join(', ');
	}

	var state = '???';
	if( blob['state'] ){
	    state = blob['state'].join(', ');
	}

	var mid =  blob['ontology'][0];

	// Transform to final Solr model.
	deliverable = {
	    id: document_category + '_' + mid,
	    document_category: document_category,
	    annotation_unit: mid,
	    //?//annotation_unit_searchable: mid,
	    annotation_unit_label: title,
	    annotation_unit_label_searchable: title,
	    contributor: clabels,
	    contributor_searchable: clabels,
	    model_date: model_date,
	    model_date_searchable: model_date,
	    model_state: state, 
	    //?//model_state_searchable: state, 
	    // TODO: Do not load comments until upstream is fixed:
	    // See ticket: https://github.com/geneontology/noctua/issues/182
	    comment: comment,
	    comment_searchable: comment,
	    // Models.
	    owl_blob_json: owl_blob_json
	};

	//ll(deliverable);

	return deliverable;
    }
}

// Add/clobber a document into GOlr.
// true on success, false otherwise
function _golr_add_and_commit_docs(payloads, success_callback){

    // Add everything we have back in.
    solr_client.add(payloads, function(err, obj){
	if(err){
	    _die('Could not do adds to server: ' + err);
	}else{

	    // 
	    solr_client.commit(function(err, obj){
		if(err){
		    _die('Could not commit adds to GOlr server: ' +
			 err);
		}else{
		    ll('All docs added; completed spin-up.');

		    // Run callback if there.
		    if( success_callback ){
			success_callback(payloads);
		    }
		}
	    });
	}
    });
}

//
function _golr_add_by_filename(fname, success_callback){

    var payload = _file_to_payload(fname);
    
    // Add everything we have back in.
    solr_client.add(payload, function(err, obj){
	if(err){
	    _die('Could not add ' + fname + ' to server: ' + err);
	}else{
	    
	    // 
	    solr_client.commit(function(err, obj){
		if(err){
		    _die('Could not commit add to GOlr server: ' + err);
		}else{
		    ll('Completed spin-up.');

		    // Run callback if there.
		    if( success_callback ){
			success_callback(fname);
		    }
		}
	    });
	}
    });
}

function _golr_delete_by_filename(fname, success_callback){

    // Recreate ID.
    var mid = null;
    var match = fname.match(model_regexp);
    if( ! match ){
	_die('Unable to reconstruct model ID.');
    }else{
	mid = match[1];
    }
    var full_id = document_category + '_gomodel:' + fname;

    //
    solr_client.deleteByID(full_id, function(err, obj){
	if(err){
	    _die('Could not delete doc on GOlr server: ' + err);
	}else{
	    //ll(obj);
	    solr_client.commit(function(err, obj){
		if(err){
		    _die('Could not commit delete on GOlr server: ' + err);
		}else{
		    ll('Deleted gomodel:' + full_id + ' from GOlr server.');

		    // Run callback if there.
		    if( success_callback ){
			success_callback(fname);
		    }
		}
	    });
	}
    });
}

// 
function _watchers(){

    // function _on_change(event, fname){
	
    // 	// event
    // 	if( event === 'rename' ){ // is a create/rename event
	    
    // 	    // For renames events, we only care about deletion since
    // 	    // the creation event will also throw a change.
    // 	    if( ! fs.existsSync(fname) ){
    // 		ll('deleted: ' + fname);
    // 	    }

    // 	}else{ // change event
    // 	    ll('delete and re-add: ' + fname);
    // 	}
    // }
		    
    // // TODO: 
    // ll('Starting watchers...');
    // var watch_opt = {
    // 	persistent: true,
    // 	recursive: false
    // };
    // fs.watch(monitor_dir, {}, _on_change);


    // watch.watchTree(monitor_dir, function (f, curr, prev) {
    // 	if (typeof f === "object" && prev === null && curr === null) {
    // 	    ll('Watcher is watching...');
    // 	} else if (prev === null) {
    // 	    // f is a new file
    // 	    ll('new: ' + f);
    // 	} else if (curr.nlink === 0) {
    // 	    // f was removed
    // 	    if( ! fs.existsSync(f) ){
    // 		ll('deleted: ' + f);
    // 		//ll('deleted: ' + fname);
    // 	    }

    // 	} else {
    // 	    // f was changed
    // 	    ll('changed: ' + f);
    // 	}
    // });

    //
    watch.createMonitor(monitor_dir, function (monitor){
	monitor.on("created", function (f, stat){
	    //ll('new: ' + f);
	    if( ! _file_okay_p(f) ){
		ll('Skipping questionable file (creation): ' + f);
	    }else{
		_golr_add_by_filename(f);
	    }
	});
	monitor.on("changed", function (f, curr, prev){
	    //ll('changed: ' + f);
	    if( ! _file_okay_p(f) ){
		ll('Skipping questionable file (changed): ' + f);
	    }else{
		_golr_delete_by_filename(f, _golr_add_by_filename);
	    }
	});
	monitor.on("removed", function (f, stat){
	    //ll('deleted: ' + f);
	    if( ! _file_okay_p(f) ){
		ll('Skipping questionable file (removal): ' + f);
	    }else{
		_golr_delete_by_filename(f);
	    }
	});
    });
    
    ll('Watchers probably standing watch.');
}

///
/// CLI handling, environment setup, and initialization of clients.
///

// What directory will we monitor/operate on.
var monitor_dir = argv['m'] || argv['monitor'];
if( ! monitor_dir ){
    _die('Option (m|monitor) is required.');

    // Make sure extant, etc.
    var dstats = fs.statSync(monitor_dir);
    if( ! dstats.isDirectory() ){
	_die('Option (m|monitor) is not a directory: ' + monitor_dir);
    }
}else{
    ll('Will monitor: ' + monitor_dir);
}

// What is our GOlr target.
golr_location = argv['g'] || argv['golr'];
if( ! golr_location ){
    _die('Option (g|golr) is required.');
    // TODO: make sure extant, etc.
}else{
    ll('Will operate on GOlr instance at: ' + golr_location);
}

// Pull in and keyify the contributor information.
var user_fname = argv['u'] || argv['users'];
if( ! user_fname ){
    _die('Option (u|users) is required.');

    // Make sure extant, etc.
    var fstats = fs.statSync(user_fname);
    if( ! fstats.isFile() ){
	_die('Option (u|users) is not a file: ' + user_fname);
    }
}else{
    ll('Will pull user info from: ' + user_fname);
}

var keyed_users = {};
var user_entries = yaml.load(user_fname);
each(user_entries, function(entry){
    var nick = entry['nickname'];
    if( nick ){
	var xref = entry['xref'];
	var uri = entry['uri'];
	if( xref ){ keyed_users[xref] = nick; }
	if( uri ){ keyed_users[uri] = nick; }
    }
});
	
///
/// Startup.
///

// Set the actual target.
var u = url.parse(golr_location);
var client_opts = {
    solrVersion: '3.6',
    host: u.hostname,
    port: u.port,
    path: ustr(u.path).rtrim('/').value()
};
//ll(client_opts);
var solr_client = solr.createClient(client_opts);
//var solr_client = solr.createClient(u.hostname, u.port, '', u.path);

// Not in our version?
// // Ping solr server. Only continue if.
// solr_client.ping(function(err, obj){
//    if(err){
//        _die('Could not make contact with GOlr server!');
//    }else{
//    	ll(obj);
//    }
// });

///
/// Start by flushing the current contents.
///

var flush_query = 'document_category:' + document_category;
//solr_client.deleteByQuery(flush_query, function(err, obj){
//var myObjData = wait.forMethod(
solr_client.deleteByQuery(flush_query, function(err, obj){
    if(err){
	_die('Could not flush GOlr server: ' + err);
    }else{
	//ll(obj);
	solr_client.commit(function(err, obj){
	    if(err){
		_die('Could not commit flush of GOlr server: ' + err);
	    }else{
		//ll('2');
		//ll(obj);

		///
		/// Do inital adds.
		///

		// Gather all of the payloads before committing.
		var payloads = [];
		var all_file_names = _all_files(monitor_dir);
		each(all_file_names, function(fname){

		    var filename = monitor_dir + fname;

		    if( ! _file_okay_p(filename) ){
			ll('Skipping questionable file: ' + filename);
		    }else{
			var payload = _file_to_payload(filename);
			if( payload ){
			    payloads.push(payload);
			}
		    }
		});

		// Add and commit everything, then start the eatchers.
		_golr_add_and_commit_docs(payloads, _watchers);
	    }
	});
    }
});

