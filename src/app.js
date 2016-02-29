(function (){
    'use strict';
    angular
        .module('annoweb', [
            'ui.router',
            'ngMaterial',
            'annoweb-wavesurfer',       // the wavesurfer directive
            'annoweb-dialog',           // dialog and alert service
            'annoweb-service',          // old AnnowebService - needs to be removed
            'annoweb-newservice',       // new AnnowebService and mock data service
            'annoweb-annotation',       // directive and controller for annotation UI
            'annoweb-viewcontrollers',  // common controllers for view states (when we don't have separate files)
            'annoweb-commondirectives', // common directives including the nav bar.
            'file-model',               // deprecated: made it a bit easier to select a file
            'cfp.hotkeys',              // hotkey controller system, hotkeys tend to be bound in views
            'ncy-angular-breadcrumb',   // breadcrumb directive based on ui router
            'angularResizable',         // used by annotation controller, Angular Material doesn't usually resize
            'LocalForageModule',        // used by data service, angular version of local-forage
            'annoweb-dataservice',
        ])
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
        .config(['$stateProvider', '$urlRouterProvider',
            function ($stateProvider, $urlRouterProvider) {
                $urlRouterProvider.otherwise("/home");
                $stateProvider
                    .state('home', {
                        url: '/home',
                        templateUrl: "views/home.html",
                        ncyBreadcrumb: {
                            label: 'Home'
                        },
                        controller: 'homeController',
                        controllerAs: 'hCtrl'
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
                    .state('new', {
                        url: '/new',
                        templateUrl: "views/new.html",
                        ncyBreadcrumb: {
                            parent: 'home',
                            label: 'New'
                        }
                    })
                    .state('status', {
                        url: '/session/:sessionId',
                        templateUrl: "views/status.html",
                        controller: 'statusController',
                        controllerAs: 'sCtrl',
                        ncyBreadcrumb: {
                            parent: 'home',
                            label: '{{sessionName}}'
                        }
                    })
                    .state('annotate', {
                        url: '/annotate/:sessionId',
                        templateUrl: "views/annotate.html",
                        ncyBreadcrumb: {
                            parent: 'status',
                            label: 'Annotate'
                        }
                    })
                    .state('comment', {
                        url: '/{sessionId}/comment',
                        templateUrl: "views/comment.html",
                        controller: ['$scope', function($scope) {
                            $scope.sessionId='The Rotunda Talk';
                        }],
                        ncyBreadcrumb: {
                            parent: 'status',
                            label: 'Comment'
                        }
                    })
                    .state('respeak', {
                        url: '/{sessionId}/respeak',
                        templateUrl: "views/respeak.html",
                        controller: ['$scope', function($scope) {
                            $scope.sessionId='The Rotunda Talk';
                        }],
                        ncyBreadcrumb: {
                            parent: 'status',
                            label: 'Respeak'
                        }
                    })
                    .state('translate', {
                        url: '/{sessionId}/translate',
                        templateUrl: "views/translate.html",
                        controller: ['$scope', function($scope) {
                            $scope.sessionId='The Rotunda Talk';
                        }],
                        ncyBreadcrumb: {
                            parent: 'status',
                            label: 'Translate'
                        }
                    })
                    .state('metadata', {
                        url: '/{sessionId}/metadata',
                        templateUrl: "views/metadata.html",
                        controller: ['$scope', function($scope) {
                            $scope.sessionId='The Rotunda Talk';
                        }],
                        ncyBreadcrumb: {
                            parent: 'status',
                            label: 'Details'
                        }
                    })
                    .state('export', {
                        url: '/{sessionId}/export',
                        templateUrl: "views/export.html",
                        controller: ['$scope', function($scope) {
                            $scope.sessionId='The Rotunda Talk';
                        }],
                        ncyBreadcrumb: {
                            parent: 'status',
                            label: 'Export'
                        }
                    })
                    .state('share', {
                        url: '/{sessionId}/share',
                        templateUrl: "views/share.html",
                        controller: ['$scope', function($scope) {
                            $scope.sessionId='The Rotunda Talk';
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
        .config(['$breadcrumbProvider', function($breadcrumbProvider) {
            $breadcrumbProvider.setOptions({
                templateUrl: 'views/templates/breadcrumbs.html' // this is an angular material-friendly breadcrumb template
            });
        }])
        .config(['$compileProvider', function($compileProvider) {
            //$compileProvider.aHrefSanitizationWhitelist('/chrome/');
        }])
        .config(['$localForageProvider', function($localForageProvider) {
            $localForageProvider.config({
               size: (100 * 1024 * 1024) 
            });
        }]);

})();
