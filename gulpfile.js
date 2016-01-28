/**
 * Created by Mat on 28/01/2016.
 */
var wiredep = require('wiredep').stream,
    inject = require('gulp-inject'),
    gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    gulpif = require('gulp-if'),
    minifyCss = require('gulp-minify-css'),
    gutil = require('gulp-util'),
    useref = require('gulp-useref');

gulp.task('build', function () {
    var sources = gulp.src(['../src/**/*.js', '../src/**/.css'], {read: false, cwd: './build/'});
    gulp.src('./src/index.html')
        .pipe(inject(sources, {relative: false, addRootSlash: false}))
        .pipe(wiredep({

        }))
        .pipe(gulp.dest('./build'));
});

gulp.task('dist', function () {
    gulp.src('./build/index.html')
        .pipe(useref())
        .pipe(gulpif('*.js', uglify().on('error', gutil.log)))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulp.dest('dist'));
});
