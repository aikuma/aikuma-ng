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
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    useref = require('gulp-useref');

gulp.task('wavesurfer', function () {
    // We need to build wavesurfer since the package only deploys minified files
    // and has no unminified file anywhere
    var ws_src = ['src/wavesurfer.js',
            'src/util.js',
            'src/webaudio.js',
            'src/mediaelement.js',
            'src/drawer.js',
            'src/drawer.*.js',
            'src/html-init.js'
        ],
        fileNames = [];
    ws_src.forEach(function (n) {
        fileNames.push('bower_components/wavesurfer.js/' + n);
    });
    return gulp.src(fileNames)
        .pipe(concat('wavesurfer.js'))
        .pipe(gulp.dest('./build'));
});

gulp.task('build', ['wavesurfer'], function () {
    // inject all of the js dependencies into the html
    var sources = gulp.src(['./src/**/*.js', './src/**/.css'], {read: false, cwd: './'});
    return gulp.src('./src/index.html', {cwd: './'})
        .pipe(inject(sources, {relative: false, addRootSlash: false}))
        .pipe(wiredep({ignorePath: '../'}))
        .pipe(gulp.dest('./'));
});

gulp.task('cleandist', function () {
    // clean dist folder
    return gulp.src('./dist', {read: false})
        .pipe(clean());
});

gulp.task('deploy', ['cleandist'], function () {
    // copy view templates
    gulp.src('./views/**/*', {base: './'})
        .pipe(gulp.dest('dist'));
    // copy external data
    gulp.src('./extdata/**/*', {base: './'})
        .pipe(gulp.dest('dist'));
    // copy images
    gulp.src('./img/**/*', {base: './'})
        .pipe(gulp.dest('dist'));
    // copy chrome app files
    gulp.src('./chromeapp/**/*', {base: './chromeapp'})
        .pipe(gulp.dest('dist'));
    // build the final root html with a single minified js
    return gulp.src('./index.html')
        .pipe(rename('window.html'))
        .pipe(useref())
        .pipe(gulpif('*.js', uglify().on('error', gutil.log)))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulp.dest('dist'));
});


