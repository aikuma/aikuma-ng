// Karma configuration
// Generated on Sat Apr 30 2016 22:07:17 GMT+1000 (오스트레일리아 동부 표준시)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
        //bower:js
        //endbower
        'node_modules/angular-mocks/angular-mocks.js',
        'src/**/*.js',
        'views/templates/*.html',
        'test/**/*spec.js',
        // fixtures
        //{pattern: 'languages/*.json', watched: true, served: true, included: false}
    ],


    // list of files to exclude
    exclude: [
      '**/*.swp'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        'views/templates/*.html': ['ng-html2js']
    },

    ngHtml2JsPreprocessor: {
        // If your build process changes the path to your templates,
        // use stripPrefix and prependPrefix to adjust it.
        //stripPrefix: "views/templates/",
        moduleName: 'viewtemplates'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
