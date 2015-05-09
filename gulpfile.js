////
//// Usage: node ./node_modules/gulp/bin/gulp.js doc
////

var gulp = require('gulp');
var jsdoc = require("gulp-jsdoc");
var mocha = require('gulp-mocha');
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

// Not all tasks need to use streams
// A gulpfile is just another node program and you can use all packages available on npm
gulp.task('clean', function(cb) {
  // You can use multiple globbing patterns as you would with `gulp.src`
  del(['build'], cb);
});

gulp.task('scripts', ['clean'], function() {
  // Minify and copy all JavaScript (except vendor scripts)
  // with sourcemaps all the way down
  return gulp.src(paths.scripts)
    .pipe(sourcemaps.init())
      .pipe(coffee())
      .pipe(uglify())
      .pipe(concat('all.min.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/js'));
});

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

gulp.task('doc', function() {
    gulp.src(paths.clients, paths.scripts)
        .pipe(jsdoc('./doc'));
});

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

// The default task (called when you run `gulp` from cli)
//gulp.task('default', ['watch', 'scripts', 'images']);
gulp.task('default', function() {
    console.log("'allo 'allo!");
});
