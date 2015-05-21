////
//// Usage: node ./node_modules/.bin/gulp doc
////

var gulp = require('gulp');
var jsdoc = require("gulp-jsdoc");
var mocha = require('gulp-mocha');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
//var concat = require('gulp-concat');
//var uglify = require('gulp-uglify');
//var sourcemaps = require('gulp-sourcemaps');
//var del = require('del');

var paths = {
  clients: ['js/*'],
  scripts: ['scripts/*'],
  tests: ['tests/*.test.js']
//  images: 'sr/*'
};

// // Not all tasks need to use streams
// // A gulpfile is just another node program and you can use all packages available on npm
// gulp.task('clean', function(cb) {
//   // You can use multiple globbing patterns as you would with `gulp.src`
//   del(['build'], cb);
// });

// gulp.task('scripts', ['clean'], function() {
//   // Minify and copy all JavaScript (except vendor scripts)
//   // with sourcemaps all the way down
//   return gulp.src(paths.scripts)
//     .pipe(sourcemaps.init())
//       .pipe(coffee())
//       .pipe(uglify())
//       .pipe(concat('all.min.js'))
//     .pipe(sourcemaps.write())
//     .pipe(gulp.dest('build/js'));
// });

// // Copy all static images
// gulp.task('images', ['clean'], function() {
//   return gulp.src(paths.images)
//     // Pass in options to the task
//     .pipe(imagemin({optimizationLevel: 5}))
//     .pipe(gulp.dest('build/img'));
// });

// // Rerun the task when a file changes
// gulp.task('watch', function() {
//   gulp.watch(paths.scripts, ['scripts']);
//   gulp.watch(paths.images, ['images']);
// });

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

// See what browserify-shim is up to.
process.env.BROWSERIFYSHIM_DIAGNOSTICS = 1;

// Browser runtime environment construction.
gulp.task('build', function() {
    return browserify()
    //.require('jquery')
    //.require('jquery-ui')
    //.require('bootstrap')
    //.require('jsplumb')
    //.require('tablesorter')
    //.require('./connectors-sugiyama.js')
    //.require('./js/NoctuaEditor.js')
	.require('bbop')
	.require('bbopx')
	.require('amigo2')
	.exclude('ringo/httpclient') // not in npm, don't need in browser
	.bundle()
    //Pass desired output filename to vinyl-source-stream
	.pipe(source('commonjs-runtime.js'))
    // Start piping stream to tasks!
	.pipe(gulp.dest('./static/'));
});


gulp.task('compress', function() {
  return gulp.src('static/noctua-runtime.js')
    .pipe(uglify())
    .pipe(gulp.dest('./static/'));
});

// The default task (called when you run `gulp` from cli)
//gulp.task('default', ['watch', 'scripts', 'images']);
gulp.task('default', function() {
    console.log("'allo 'allo!");
});
