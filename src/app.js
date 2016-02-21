(function (){
    'use strict';
    angular
        .module('annoweb', [
            'ui.router',
            'ngMaterial',
            'annoweb-wavesurfer',       // the wavesurfer directive
            'annoweb-dialog',           // dialog and alert service
            'annoweb-service',          // old AnnowebService - needs to be removed
            'annoweb-status',           // directive and controller for the project/primary file status display
            'annoweb-annotation',       // directive and controller for annotation UI
            'annoweb-viewcontrollers',  // common controllers for view states (when we don't have separate files)
            'file-model',               // deprecated: made it a bit easier to select a file
            'cfp.hotkeys',              // hotkey controller system, hotkeys tend to be bound in views
            'ncy-angular-breadcrumb',   // breadcrumb directive based on ui router
            'angularResizable',         // used by annotation controller, Angular Material doesn't usually resize
            'ezfb'                      // Easy Facebook library
        ])
        .config(function (ezfbProvider) {
            ezfbProvider.setLocale('en_US');
            ezfbProvider.setInitParams({
                appId: '1052796451458015'
            });
        })
        .config(['$mdIconProvider', function($mdIconProvider) {
            $mdIconProvider
                .iconSet('social','img/icons/sets/social-icons.svg', 24)
                .iconSet('content','img/icons/sets/content-icons.svg', 24)
                .iconSet('action','img/icons/sets/action-icons.svg', 24)
                .iconSet('nav','img/icons/sets/navigation-icons.svg', 24)
                .iconSet('av','img/icons/sets/av-icons.svg', 24)
                .iconSet('file','img/icons/sets/file-icons.svg', 24)
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
        .config(['$stateProvider', '$urlRouterProvider',
            function ($stateProvider, $urlRouterProvider) {
                var projectId = 23784;
                $urlRouterProvider.otherwise("/home");
                $stateProvider
                    .state('home', {
                        url: '/home',
                        templateUrl: "views/home.html",
                        ncyBreadcrumb: {
                            label: 'Home'
                        }
                    })
                    .state('help', {
                        url: '/help',
                        templateUrl: "views/help.html",
                        ncyBreadcrumb: {
                            parent: 'home',
                            label: 'Help'
                        }
                    })
                    .state('login', {
                        url: '/login',
                        templateUrl: "views/login.html",
                        controller: 'authController',
                        ncyBreadcrumb: {
                            parent: 'home',
                            label: 'Log In'
                        }
                    })
                    .state('changes', {
                        url: '/changes',
                        templateUrl: "views/changes.html",
                        ncyBreadcrumb: {
                            parent: 'home',
                            label: 'Changes'
                        }
                    })
                    .state('chat', {
                        url: '/chat',
                        templateUrl: "views/chat.html",
                        ncyBreadcrumb: {
                            parent: 'home',
                            label: 'Chat'
                        }
                    })
                    .state('new', {
                        url: '/new',
                        templateUrl: "views/new.html",
                        ncyBreadcrumb: {
                            parent: 'home',
                            label: 'New'
                        }
                    })
                    .state('status', {
                        url: '/status/:primaryID',
                        templateUrl: "views/status.html",
                        controller: ['$scope', function($scope) {
                            $scope.projectId='The Rotunda Talk';
                        }],
                        ncyBreadcrumb: {
                            parent: 'home',
                            label: '{{projectId}}'
                        }
                    })
                    .state('annotate', {
                        url: '/{projectId}/annotate',
                        templateUrl: "views/annotate.html",
                        controller: ['$scope', function($scope) {
                            $scope.projectId='The Rotunda Talk';
                        }],
                        ncyBreadcrumb: {
                            parent: 'status',
                            label: 'Annotate'
                        }
                    })
                    .state('comment', {
                        url: '/{projectId}/comment',
                        templateUrl: "views/comment.html",
                        controller: ['$scope', function($scope) {
                            $scope.projectId='The Rotunda Talk';
                        }],
                        ncyBreadcrumb: {
                            parent: 'status',
                            label: 'Comment'
                        }
                    })
                    .state('respeak', {
                        url: '/{projectId}/respeak',
                        templateUrl: "views/respeak.html",
                        controller: ['$scope', function($scope) {
                            $scope.projectId='The Rotunda Talk';
                        }],
                        ncyBreadcrumb: {
                            parent: 'status',
                            label: 'Respeak'
                        }
                    })
                    .state('translate', {
                        url: '/{projectId}/translate',
                        templateUrl: "views/translate.html",
                        controller: ['$scope', function($scope) {
                            $scope.projectId='The Rotunda Talk';
                        }],
                        ncyBreadcrumb: {
                            parent: 'status',
                            label: 'Translate'
                        }
                    })
                    .state('metadata', {
                        url: '/{projectId}/metadata',
                        templateUrl: "views/metadata.html",
                        controller: ['$scope', function($scope) {
                            $scope.projectId='The Rotunda Talk';
                        }],
                        ncyBreadcrumb: {
                            parent: 'status',
                            label: 'Details'
                        }
                    })
                    .state('export', {
                        url: '/{projectId}/export',
                        templateUrl: "views/export.html",
                        controller: ['$scope', function($scope) {
                            $scope.projectId='The Rotunda Talk';
                        }],
                        ncyBreadcrumb: {
                            parent: 'status',
                            label: 'Export'
                        }
                    })
                    .state('share', {
                        url: '/{projectId}/share',
                        templateUrl: "views/share.html",
                        controller: ['$scope', function($scope) {
                            $scope.projectId='The Rotunda Talk';
                        }],
                        ncyBreadcrumb: {
                            parent: 'status',
                            label: 'Share'
                        }
                    })
                    .state('settings', {
                        url: '/settings',
                        templateUrl: "views/settings.html",
                        ncyBreadcrumb: {
                            parent: 'home',
                            label: 'Settings'
                        }
                    })
                    .state('reportbug', {
                        url: '/reportbug',
                        templateUrl: "views/reportbug.html",
                        ncyBreadcrumb: {
                            parent: 'home',
                            label: 'Report Bug'
                        }
                    });
            }])
        .filter('keyboardShortcut', ['$window', function($window) {
            return function(str) {
                if (!str) {return;}
                var keys = str.split('-');
                var isOSX = /Mac OS X/.test($window.navigator.userAgent);
                var seperator = (!isOSX || keys.length > 2) ? '+' : '';
                var abbreviations = {
                    M: isOSX ? '⌘' : 'Ctrl',
                    A: isOSX ? 'Option' : 'Alt',
                    S: 'Shift'
                };
                return keys.map(function(key, index) {
                    var last = index == keys.length - 1;
                    return last ? key : abbreviations[key];
                }).join(seperator);
            };
        }])
        .config(['$breadcrumbProvider', function($breadcrumbProvider) {
            $breadcrumbProvider.setOptions({
                templateUrl: 'views/templates/breadcrumbs.html' // this is an angular material-friendly breadcrumb template
            });
        }]);

})();
