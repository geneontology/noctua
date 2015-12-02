////
//// Usage: node ./node_modules/.bin/gulp doc|build|test|watch|clean
////

var gulp = require('gulp');
//var jsdoc = require("gulp-jsdoc");
var mocha = require('gulp-mocha');
var shell = require('gulp-shell');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var us = require('underscore');
var del = require('del');
var yaml = require('yamljs');
var fs = require('fs');
var url = require('url');
var tilde = require('expand-home-dir');
var bump = require('gulp-bump');
var flatten = require('gulp-flatten');
var request = require('request');
//var git = require('gulp-git');
//var watch = require('gulp-watch');
//var watchify = require('watchify');
//var concat = require('gulp-concat');
//var sourcemaps = require('gulp-sourcemaps');
///
/// Helpers.
///

function _die(str){
    console.error(str);
    process.exit(-1);
}

// Ping server; used during certain commands.
function _ping_count(){

    if( count_url && typeof(count_url) === 'string' && count_url !== '' ){

	request({
	    url: count_url
	}, function(error, response, body){
	    if( error || response.statusCode !== 200 ){
		console.log('Unable to ping: ' + count_url);
	    }else{
		console.log('Pinged: ' + count_url);
	    }
	});
    }else{
	console.log('Will not ping home.');
    }
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

function _run_cmd(command_bits){
    var final_command = command_bits.join(' ');
    return ['echo \'' + final_command + '\'', final_command];
}

function _run_cmd_list(commands){
    var final_list = [];

    us.each(commands, function(cmd){
	final_list.push('echo \'' + cmd + '\'');
	final_list.push(cmd);
    });
    
    return final_list;
}

///
///
///

var paths = {
    // WARNING: Cannot use glob for clients--I use the explicit listing
    // to generate a dynamic browserify set.
    clients: ['js/NoctuaEditor.js', 
	      'js/NoctuaLanding.js',
	      'workbenches/bioentity_companion/BioentityCompanion.js',
	      'workbenches/companion/Companion.js',
	      'workbenches/cytoview/CytoView.js',
	      // 'js/NoctuaBasic/NoctuaBasicApp.js',
	      // 'js/NoctuaBasic/NoctuaBasicController.js',
	      'js/BaristaLogin.js',
	      'js/BaristaLogout.js',
	      'js/BaristaSession.js'
	     ],
    support: ['js/connectors-sugiyama.js'],
    scripts: ['scripts/*'],
    tests: ['tests/*.test.js']
};

///
/// Build tasks.
///

// // Build docs directory with JSDoc.
// gulp.task('doc', function() {
//   gulp.src(paths.clients, paths.scripts)
//     .pipe(jsdoc('./doc'));
// });

// Testing with mocha/chai.
// NOTE: I'm using chai here.
gulp.task('test', function() {
  return gulp.src(paths.tests, {
    read: false
  }).pipe(mocha({
    reporter: 'spec',
    globals: {
      // Use a different should.
      should: require('chai').should()
    }
  }));
});

//
gulp.task('ready-non-commonjs-libs', function() {
  var pkg = require('./package.json');
  us.each(pkg.browser, function(val, key) {
    console.log('copy: ' + key);
    gulp.src(val)
      .pipe(gulp.dest('./deploy/'));
  });
});

gulp.task('copy-css-from-npm-deps', function() {
  gulp.src('./node_modules/**/*.css', {
      base: './node_modules'
    })
    .pipe(flatten())
    .pipe(gulp.dest('./deploy/css'));
});

// Build the clients as best we can.
var build_tasks = [
  'ready-non-commonjs-libs',
  'copy-css-from-npm-deps'
];
// Dynamically define tasks.
us.each(paths.clients, function(file, index) {

  var taskname = 'build-client_' + file;

  // Add to task list.
  build_tasks.push(taskname);

  // See what browserify-shim is up to.
  //process.env.BROWSERIFYSHIM_DIAGNOSTICS = 1;

  // Browser runtime environment construction.
  function _client_task(file) {
    return browserify(file)
      // not in npm, don't need in browser
      .exclude('ringo/httpclient')
      .bundle()
      // desired output filename to vinyl-source-stream
      .pipe(source(file))
      .pipe(gulp.dest('./deploy/'));
  }

  // Define task.
  gulp.task(taskname, function(cb) {
    //return _client_task(file);
    _client_task(file);
    cb(null);
  });

});

gulp.task('build', build_tasks);
//     'build-client-landing',
//     'build-client-editor'
// ]);

// gulp.task('build-client-landing', function() {
//     return _client_task('./js/NoctuaLanding.js');
// });
// gulp.task('build-client-editor', function() {
//     return _client_task('./js/NoctuaEditor.js');
// });

// Rerun tasks when a file changes.
gulp.task('watch', function(cb) {
  gulp.watch(paths.clients, ['build']);
  gulp.watch(paths.support, ['build']);
  cb(null);
});

//
gulp.task('clean', function(cb) {
  del(['./deploy/*', './deploy/js/*', '!./deploy/README.org',
    './doc/*', '!./doc/README.org'
  ]);
  cb(null);
});

// Release tools for patch release.
gulp.task('release', ['patch-bump', 'publish-npm']);

gulp.task('patch-bump', function() {
  gulp.src('./package.json')
    .pipe(bump({
      type: 'patch'
    }))
    .pipe(gulp.dest('./'));
});

//
gulp.task('publish-npm', function(cb) {
  var npm = require("npm");
  npm.load(function(er, npm) {
    // NPM
    npm.commands.publish();
  });
  cb(null);
});

///
/// Runtime tasks/coordination.
///

var conf_file = './startup.yaml';

// Pull in our configuration.
var config = null;
try {
    config = yaml.load(conf_file);
}catch(e){
    _die('Could not find "' + conf_file + '", look in ./config for examples.');
}

// Lookup/public locations.
var golr_lookup_url = config['GOLR_LOOKUP_URL'].value;
var golr_neo_lookup_url = config['GOLR_NEO_LOOKUP_URL'].value;
var noctua_lookup_url = config['NOCTUA_LOOKUP_URL'].value;
var barista_lookup_url = config['BARISTA_LOOKUP_URL'].value;

// Real/self/internal locations.
var golr_location = config['GOLR_LOCATION'].value;
var noctua_location = config['NOCTUA_LOCATION'].value;
var barista_location = config['BARISTA_LOCATION'].value;
var minerva_location = config['MINERVA_LOCATION'].value;


var minerva_port = url.parse(minerva_location).port || 80;

// Optional.
var barista_repl_port = config['BARISTA_REPL_PORT'].value;

// 
var noctua_models = config['NOCTUA_MODELS'].value;
var user_data = config['USER_DATA'].value;
var geneontology_catalog = config['GENEONTOLOGY_CATALOG'].value;
var workbench_dirs = config['WORKBENCHES'].value;
var workbench_dirs_str = workbench_dirs.join(' ');
var collapsible_relations = config['COLLAPSIBLE_RELATIONS'].value;
var collapsible_relations_str = collapsible_relations.join(' ');
var def_app_def = config['DEFAULT_APP_DEFINITION'].value;
// NOTE: Allowing barista to slurp up startup.yaml itself to get the
// application definitions.

// Execute by default; variable must be present and empty to stop.
var count_url =
	'https://s3-us-west-1.amazonaws.com/go-noctua-usage-master/ping.json';
if( config['NOCTUA_COUNTER_URL'] && config['NOCTUA_COUNTER_URL'].value ){
    count_url = config['NOCTUA_COUNTER_URL'].value;
}

// Execute counter.
_ping_count();

// Mineva runner.
gulp.task('run-minerva', shell.task(_run_cmd(
    ['java -Xmx4G -cp ./java/lib/minerva-cli.jar org.geneontology.minerva.server.StartUpTool --use-golr-url-logging --use-request-logging --slme-elk',
     '-g', 'http://purl.obolibrary.org/obo/go/extensions/go-lego.owl',
     '--set-important-relation-parent', 'http://purl.obolibrary.org/obo/LEGOREL_0000000',
     '--golr-labels', golr_neo_lookup_url,
     '--golr-seed', golr_lookup_url,
     '-c', geneontology_catalog,
     '-f', noctua_models,
     '--port', minerva_port
    ]
)));

//node barista.js --self http://localhost:3400
gulp.task('run-barista', shell.task(_run_cmd(
    ['node', 'barista.js',
     '--debug', 0,
     '--users', user_data,
     '--public', barista_lookup_url,
     '--self', barista_location,
     '--repl', barista_repl_port
    ]
)));

//node noctua.js -c "RO:0002333 BFO:0000066 RO:0002233 RO:0002488" -g http://golr.geneontology.org/solr/ -b http://localhost:3400 -m minerva_local
gulp.task('run-noctua', shell.task(_run_cmd(
    ['node', 'noctua.js',
     '--golr', golr_lookup_url,
     '--golr-neo', golr_neo_lookup_url,
     '--barista', barista_lookup_url,
     '--noctua-public', noctua_lookup_url,
     '--noctua-self', noctua_location,
     '--minerva-definition', def_app_def,
     // Lists need to be quoted.
     '--workbenches', '"' + workbench_dirs_str + '"',
     '--collapsible-relations', '"' + collapsible_relations_str + '"'
    ]
)));

// node epione.js --monitor /home/swdev/local/src/git/noctua-models/models --golr http://toaster.lbl.gov:9000/solr --users /home/swdev/local/src/git/go-site/metadata/users.yaml                                                        
gulp.task('run-epione', shell.task(_run_cmd(
    ['node', 'epione.js',
     '--users', user_data,
     '--monitor', noctua_models,
     '--golr', golr_location
    ]
)));

///
/// Default.
///

// The default task (called when you run `gulp` from cli)
//gulp.task('default', ['doc', 'build', 'test']);
