/* File: gulpfile.js */

// grab our gulp packages
const gulp = require('gulp'),
      csso = require('gulp-csso')
      concat = require('gulp-concat')
      uglify = require('gulp-uglify-es').default;
      browserSync = require('browser-sync').create();

gulp.task('build-css', function() {
  return gulp.src('source/css/*.css')
    .pipe(csso())
    .pipe(gulp.dest('public/css'))
    .pipe(browserSync.stream());
});

gulp.task('build-js', function () {
  return gulp.src('source/js/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('public/js'))
    .pipe(browserSync.stream());
});

gulp.task('watch', function() {
  gulp.watch('source/css/*.css', ['build-css']).on('change', browserSync.reload);
  gulp.watch('source/js/*.js', ['build-js']).on('change', browserSync.reload);
});

// Static server
gulp.task('browser-sync', function () {
  browserSync.init({
    server: {
      baseDir: "./"
    },
    port: 8000
  });
  gulp.watch("*.html").on('change', browserSync.reload);
});

// create a default task and just log a message
gulp.task('default', ['watch', 'browser-sync']);


