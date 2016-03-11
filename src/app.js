(function (){
    'use strict';
    angular
        .module('annoweb', [
            'ngRoute',
            'ngMaterial',
            'annoweb-wavesurfer',       // the wavesurfer directive
            'annoweb-dialog',           // dialog and alert service
             //'annoweb-service',       // old AnnowebService - needs to be removed (it should be removed when the files are removed)
            'pascalprecht.translate',   // localization
            'annoweb-experimental',     // Directives being tested before replacing old versions
            'annoweb-newservice',       // new AnnowebService and mock data service
            'annoweb-annotation',       // directive and controller for annotation UI
            'annoweb-viewcontrollers',  // common controllers for view routes (when we don't have separate files)
            'annoweb-commondirectives', // common directives including the nav bar.
            'annoweb-audio',            // respeaking and stuff
            'annoweb-audioService',     // resampling and audio format conversion
            'file-model',               // deprecated: made it a bit easier to select a file
            'cfp.hotkeys',              // hotkey controller system, hotkeys tend to be bound in views
            'angularResizable',         // used by annotation controller, Angular Material doesn't usually resize
            'indexedDB',                // used by dataservice to store metadata
            'annoweb-dataservice',      // data service dealing with metadata and files
            'ngPrettyJson'              // for debugging
        ])
        .constant('config', {
            appName: 'Aikuma-ng',
            appVersion: 'alpha 17',
            sampleRate: 16000,
            languages: [
                {
                    code:'en',
                    toolfontsize: '18',
                    toolshort: 'EN',
                    name:'ENGLISH'
                },
                {
                    code:'zhTW',
                    toolfontsize: '14',
                    toolshort: '繁體',
                    name:'CHINESE_TRAD'
                },
                {
                    code:'zhCN',
                    toolfontsize: '14',
                    toolshort: '简体',
                    name:'CHINESE_SIMP'
                },
                {
                    code: 'ko',
                    toolfontsize: '16',
                    toolshort: '한글',
                    name: 'KOREAN'
                }]
            })
        .config(['$translateProvider', function ($translateProvider) {
            // add translation table
            $translateProvider.useStaticFilesLoader({
                prefix: 'languages/',
                suffix: '.json'
            });
            $translateProvider.preferredLanguage('en');
            $translateProvider.useSanitizeValueStrategy('escaped');
        }])
        .config(['$mdIconProvider', function($mdIconProvider) {
            $mdIconProvider
                .iconSet('social','img/icons/sets/social-icons.svg', 24)
                .iconSet('content','img/icons/sets/content-icons.svg', 24)
                .iconSet('action','img/icons/sets/action-icons.svg', 24)
                .iconSet('nav','img/icons/sets/navigation-icons.svg', 24)
                .iconSet('maps','img/icons/sets/maps-icons.svg', 24)
                .iconSet('av','img/icons/sets/av-icons.svg', 24)
                .iconSet('file','img/icons/sets/file-icons.svg', 24)
                .iconSet('image','img/icons/sets/image-icons.svg', 24)
                .iconSet('editor','img/icons/sets/editor-icons.svg', 24)
                .iconSet('communication','img/icons/sets/communication-icons.svg', 24)
                .defaultIconSet('img/icons/sets/core-icons.svg', 24);
        }])
        .config(['$mdThemingProvider', function ($mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('light-blue', {
                    'default': '300'
                })
                .accentPalette('deep-orange', {
                    'default': '500'
                });
        }])
        // Note that controllers are in annoweb-viewcontrollers.js
        .config(['$routeProvider',
            function($routeProvider) {
                $routeProvider
                    .when('/', {
                        templateUrl: 'views/home.html',
                        controller: 'homeController as hCtrl',
                    })
                    .when('/new', {
                        templateUrl: 'views/new.html',
                        controller: 'newSessionController as nCtrl'
                    })
                    .when('/session/:sessionId', {
                        templateUrl: 'views/status.html',
                        controller: 'statusController as sCtrl',
                    })
                    .when('/session/:sessionId/respeak', {
                        templateUrl: 'views/respeak.html',
                        controller: 'respeakController as rsCtrl',
                    })
                    .when('/changes', {
                        templateUrl: 'views/changes.html',
                    })
                    .when('/help', {
                        templateUrl: 'views/help.html'
                    })
                    .when('/session/:sessionId/annotate/:annoId', {
                        templateUrl: 'views/annotate.html',
                        controller: 'statusController as sCtrl'
                    })
                    .otherwise({
                        redirectTo: '/'
                    });
            }])

        /*.config(['$compileProvider', function($compileProvider) {
                $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|filesystem|chrome-extension):/);
        }])*/
        .config(['$indexedDBProvider', function($indexedDBProvider) {
            $indexedDBProvider
            .connection('myIndexedDB')
            .upgradeDatabase(1, function(event, db, tx){
                var userStore = db.createObjectStore('user', {keyPath: '_ID'});
                userStore.createIndex('name_idx', 'name');
                
                var itemStore = db.createObjectStore('session', {keyPath: '_ID'});
                itemStore.createIndex('user_idx', 'userId');
                
                var secondaryStore = db.createObjectStore('secondary', {keyPath: '_ID'});
                secondaryStore.createIndex('user_idx', 'userId');
                secondaryStore.createIndex('item_idx', 'itemId');
            });
        }]);
})();
