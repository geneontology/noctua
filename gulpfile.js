////
//// Usage: node ./node_modules/.bin/gulp build, doc, etc.
////

var gulp = require('gulp');
var jsdoc = require("gulp-jsdoc");
var mocha = require('gulp-mocha');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var us = require('underscore');
//var concat = require('gulp-concat');
//var sourcemaps = require('gulp-sourcemaps');
//var del = require('del');

var paths = {
  clients: ['js/NoctuaEditor.js'],
  scripts: ['scripts/*'],
  tests: ['tests/*.test.js']
};

// Build docs directory with JSDoc.
gulp.task('doc', function() {
    gulp.src(paths.clients, paths.scripts)
        .pipe(jsdoc('./doc'));
});

// Testing with mocha/chai.
// NOTE: I'm using chai here.
gulp.task('test', function() {
    return gulp.src(paths.tests, { read: false }).pipe(mocha({
	reporter: 'spec',
	globals: {
	    // Use a different should.
	    should: require('chai').should()
	}
    }));
});

// Build the clients as best we can.
gulp.task('build', [
    'ready-non-commonjs-libs',
    'build-client-landing',
    'build-client-editor'
]);

gulp.task('ready-non-commonjs-libs', function(){
    var pkg = require('./package.json');
    us.each(pkg.browser, function(val, key){
	console.log('copy: ' + key);
	gulp.src(val)
	    .pipe(gulp.dest('./deploy/'));
    });
});


// See what browserify-shim is up to.
//process.env.BROWSERIFYSHIM_DIAGNOSTICS = 1;

// Browser runtime environment construction.
gulp.task('build-client-landing', function() {
    browserify('./js/NoctuaLanding.js')
    // not in npm, don't need in browser
	.exclude('ringo/httpclient')
	.bundle()
    // desired output filename to vinyl-source-stream
	.pipe(source('NoctuaLanding.js'))
	.pipe(gulp.dest('./deploy/'));
});
gulp.task('build-client-editor', function() {
    browserify('./js/NoctuaEditor.js')
    // not in npm, don't need in browser
	.exclude('ringo/httpclient')
	.bundle()
    // desired output filename to vinyl-source-stream
	.pipe(source('NoctuaEditor.js'))
	.pipe(gulp.dest('./deploy/')); // 
});

// // Rerun the task when a file changes
// gulp.task('watch', function() {
//   gulp.watch(paths.scripts, ['scripts']);
//   gulp.watch(paths.images, ['images']);
// });

// gulp.task('compress', function() {
//   return gulp.src('static/noctua-runtime.js')
//     .pipe(uglify())
//     .pipe(gulp.dest('./deploy/'));
// });

// The default task (called when you run `gulp` from cli)
//gulp.task('default', ['watch', 'scripts', 'images']);
gulp.task('default', function() {
    console.log("'allo 'allo!");
});
