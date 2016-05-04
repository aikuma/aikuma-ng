(function (){
    'use strict';
    angular
        .module('aikuma', [
            'ngRoute',
            'ngMaterial',
            'aikuma-dialog',           // dialog and alert service (being deprecated)
            'pascalprecht.translate',  // AKA angular translate
            'aikuma-service',          // Aikuma service (annotations)
            'aikuma-annotation',       // directive and controller for annotation UI
            'aikuma-experimental',     // experimental directives
            'aikuma-anno-service',     // Annotation UI service helper
            'aikuma-viewcontrollers',  // common controllers for view routes (when we don't have separate files)
            'aikuma-commondirectives', // common directives including the nav bar
            'aikuma-audio',            // respeaking, recording
            'aikuma-audioService',     // resampling and audio format conversion
            'angularResizable',        // used by annotation controller, Angular Material doesn't usually resize
            'indexedDB',               // used by dataservice to store metadata
            'aikuma-dataservice',      // data service dealing with metadata and files
            'ngPrettyJson',            // for debugging
            'ngMessages'              // for validation messages (can we get rid of this?)
        ])
        .constant('config', {
            appName: 'AikumaNG',
            appVersion: '0.937',
            dataVersion: 1,
            sampleRate: 16000,
            fileStorageMB: 1000,
            debug: false,
            userMediaElement: false,
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
                .iconSet('mdi','img/icons/sets/mdi-icons.svg', 24)
                .iconSet('hardware','img/icons/sets/hardware-icons.svg', 24)
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
        // Views controllers are in aikuma-viewcontrollers.js
        .config(['$routeProvider',
            function($routeProvider) {
                $routeProvider
                    .when('/', {
                        templateUrl: 'views/home.html',
                        controller: 'homeController as hCtrl'
                    })
                    .when('/new', {
                        templateUrl: 'views/new.html',
                        controller: 'newSessionController as nCtrl',
                        authorize: true,
                        resolve: {
                            userObj: ['loginService', 'dataService', function(loginService, dataService) {
                                var userId = loginService.getLoggedinUserId();
                                if(userId) {
                                    return dataService.get('user', userId);
                                }
                            }]
                        }
                    })
                    .when('/import', {
                        templateUrl: 'views/new.html',
                        controller: 'newSessionController as nCtrl',
                        authorize: true,
                        resolve: {
                            userObj: ['loginService', 'dataService', function(loginService, dataService) {
                                var userId = loginService.getLoggedinUserId();
                                if(userId) {
                                    return dataService.get('user', userId);
                                }
                            }]
                        }
                    })
                    .when('/trash', {
                        templateUrl: 'views/trash.html',
                        controller: 'trashController as tCtrl',
                        authorize: true,
                        resolve: {
                            userObj: ['loginService', 'dataService', function(loginService, dataService) {
                                var userId = loginService.getLoggedinUserId();
                                if(userId) {
                                    return dataService.get('user', userId);
                                }
                            }]
                        }
                    })
                    .when('/session/:sessionId', {
                        templateUrl: 'views/status.html',
                        controller: 'statusController as sCtrl',
                        authorize: true,
                        resolve: {
                            userObj: ['loginService', 'dataService', function(loginService, dataService) {
                                var userId = loginService.getLoggedinUserId();
                                if(userId) {
                                    return dataService.get('user', userId);
                                }
                            }],
                            sessionObj: ['$route', 'dataService', function($route, dataService) {
                                var sessionId = $route.current.params.sessionId;
                                return dataService.get('session', sessionId);
                            }],
                            secondaryList: ['$route', 'loginService', 'dataService', function($route, loginService, dataService) {
                                var userId = loginService.getLoggedinUserId();
                                var sessionId = $route.current.params.sessionId;
                                if(userId) {
                                    return dataService.getSecondaryList(userId, sessionId);
                                }
                            }],
                            annotationObjList: ['$route', 'loginService', 'dataService', function($route, loginService, dataService) {
                                var userId = loginService.getLoggedinUserId();
                                var sessionId = $route.current.params.sessionId;
                                return dataService.getAnnotationObjList(userId, sessionId);
                            }],
                            langObjList: ['dataService', function(dataService) {
                                return dataService.getLanguages();
                            }]
                        }
                    })
                    .when('/session/:sessionId/respeak', {
                        templateUrl: 'views/respeak.html',
                        controller: 'respeakController as rsCtrl',
                        authorize: true,
                        resolve: {
                            dataObj: ['$q', '$route', 'loginService', 'dataService', function($q, $route, loginService, dataService) {
                                var promises = [];
                                var userId = loginService.getLoggedinUserId();
                                var sessionId = $route.current.params.sessionId;

                                promises.push(dataService.getLanguages());
                                promises.push(dataService.get('user', userId));
                                promises.push(dataService.get('session', sessionId));

                                return $q.all(promises);
                            }],
                            type: function() { return 'respeak'; }
                        }
                    })
                    .when('/session/:sessionId/respeak/:respeakId', {
                        templateUrl: 'views/respeak.html',
                        controller: 'respeakController as rsCtrl',
                        authorize: true,
                        resolve: {
                            dataObj: ['$q', '$route', 'loginService', 'dataService', function($q, $route, loginService, dataService) {
                                var promises = [];
                                var userId = loginService.getLoggedinUserId();
                                var sessionId = $route.current.params.sessionId;
                                var respeakId = $route.current.params.respeakId;

                                promises.push(dataService.getLanguages());
                                promises.push(dataService.get('user', userId));
                                promises.push(dataService.get('session', sessionId));
                                promises.push(dataService.get('secondary', respeakId));

                                return $q.all(promises);
                            }],
                            type: function() { return 'respeak'; }
                        }
                    })
                    .when('/session/:sessionId/translate', {
                        templateUrl: 'views/respeak.html',
                        controller: 'respeakController as rsCtrl',
                        authorize: true,
                        resolve: {
                            dataObj: ['$q', '$route', 'loginService', 'dataService', function($q, $route, loginService, dataService) {
                                var promises = [];
                                var userId = loginService.getLoggedinUserId();
                                var sessionId = $route.current.params.sessionId;

                                promises.push(dataService.getLanguages());
                                promises.push(dataService.get('user', userId));
                                promises.push(dataService.get('session', sessionId));

                                return $q.all(promises);
                            }],
                            type: function() { return 'translate'; }
                        }
                    })
                    .when('/session/:sessionId/translate/:translateId', {
                        templateUrl: 'views/respeak.html',
                        controller: 'respeakController as rsCtrl',
                        authorize: true,
                        resolve: {
                            dataObj: ['$q', '$route', 'loginService', 'dataService', function($q, $route, loginService, dataService) {
                                var promises = [];
                                var userId = loginService.getLoggedinUserId();
                                var sessionId = $route.current.params.sessionId;
                                var translateId = $route.current.params.translateId;

                                promises.push(dataService.getLanguages());
                                promises.push(dataService.get('user', userId));
                                promises.push(dataService.get('session', sessionId));
                                promises.push(dataService.get('secondary', translateId));

                                return $q.all(promises);
                            }],
                            type: function() { return 'translate'; }
                        }
                    })
                    .when('/session/:sessionId/annotate/:annotateId', {
                        templateUrl: 'views/annotate.html',
                        controller: 'annotateViewController as avCtrl',
                        authorize: true,
                        resolve: {
                            userObj: ['loginService', 'dataService', function(loginService, dataService) {
                                var userId = loginService.getLoggedinUserId();
                                if(userId) {
                                    return dataService.get('user', userId);
                                }
                            }],
                            sessionObj: ['$route', 'dataService', function($route, dataService) {
                                var sessionId = $route.current.params.sessionId;
                                return dataService.get('session', sessionId);
                            }],
                            annotationObjList: ['$route', 'loginService', 'dataService', function($route, loginService, dataService) {
                                var userId = loginService.getLoggedinUserId();
                                var sessionId = $route.current.params.sessionId;
                                return dataService.getAnnotationObjList(userId, sessionId);
                            }],
                            secondaryList: ['$route', 'loginService', 'dataService', function($route, loginService, dataService) {
                                var userId = loginService.getLoggedinUserId();
                                var sessionId = $route.current.params.sessionId;
                                if(userId) {
                                    return dataService.getSecondaryList(userId, sessionId);
                                }
                            }]
                        }
                    })
                    .when('/changes', {
                        templateUrl: 'views/changes.html',
                    })
                    .when('/help', {
                        templateUrl: 'views/help.html'
                    })
                    .when('/reportbug', {
                        templateUrl: 'views/reportbug.html'
                    })
                    .when('/settings', {
                        templateUrl: 'views/settings.html',
                        controller: 'settingsController as seCtrl',
                        authorize: true,
                        resolve: {
                            userObj: ['loginService', 'dataService', function (loginService, dataService) {
                                var userId = loginService.getLoggedinUserId();
                                if (userId) {
                                    return dataService.get('user', userId);
                                }
                            }]
                        }
                    })
                    .otherwise({
                        redirectTo: '/'
                    });
            }])
        .config(['$compileProvider', function($compileProvider) {
            $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|filesystem|chrome-extension):/);
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|data|filesystem|chrome-extension):/);
        }])
        .config(['$indexedDBProvider', function($indexedDBProvider) {
            $indexedDBProvider
                .connection('myIndexedDB')
                .upgradeDatabase(1, function(event, db, tx){    // Incremental upgrade is only supported with upgradeJsonDB
                    var userStore = db.createObjectStore('user', {keyPath: '_ID'});
                    userStore.createIndex('name_idx', 'name');

                    var itemStore = db.createObjectStore('session', {keyPath: '_ID'});
                    itemStore.createIndex('user_idx', 'userId');

                    var secondaryStore = db.createObjectStore('secondary', {keyPath: '_ID'});
                    secondaryStore.createIndex('user_session_idx', ['userId', 'sessionId']);
                });
        }])
        .run(['config', '$rootScope', '$location', 'dataService', 'loginService', '$mdDialog', function(config, $rootScope, $location, dataService, loginService, $mdDialog) {
            $rootScope.$on('$routeChangeStart', function(ev, dest) {
                if(dest.authorize) {
                    dest.resolve = dest.resolve || {};
                    dest.resolve.auth = ['loginService', function(loginService) {
                        if(loginService.getLoginStatus()) {
                            return true;
                        } else {
                            $location.path('/');
                            throw 'Authorization Error';
                        }
                    }];
                }
            });

            $rootScope.$on('$translateChangeSuccess', function(ev, data) {
                var userId = loginService.getLoggedinUserId();
                if(userId) {
                    dataService.get('user', userId).then(function(userObj) {
                        userObj.data.preferences.langCode = data.language;
                        return userObj.save();
                    }).then(function() {
                        //console.log('Language preference is saved');
                    });
                }
            });

            dataService.getDataVersion().then(function(ver) {
                ver = ver || 0;
                if(config.dataVersion > ver) {
                    var ProgressDialogController = function($scope, $mdDialog) {
                        dataService.upgradeData(ver).then(function(){
                            dataService.setDataVersion(config.dataVersion);
                            dataService.init();
                            $mdDialog.cancel();
                        }).catch(function(err){
                            $mdDialog.cancel();
                        });
                    };
                    ProgressDialogController.$inject = ['$scope', '$mdDialog'];
                    $mdDialog.show({
                        template:
                        '<md-dialog layout-align="center center">' +
                        '<md-progress-circular md-mode="indeterminate" md-diameter="96"></md-progress-circular>'+
                        '</md-dialog>',
                        controller: ProgressDialogController
                    });
                } else {
                    dataService.init();
                }
            });


        }]);
})();
