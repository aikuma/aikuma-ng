(function (){
    'use strict';
    angular
        .module('annoweb', [
            'ui.router',
            'ngMaterial',
            'firebase',
            'annoweb-wavesurfer',
            'annoweb-dialog',
            'annoweb-service',
            'annoweb-edit',
            'annoweb-view',
            'annoweb-annotation',
            'annoweb-viewcontrollers',
            'file-model',
            'cfp.hotkeys',
            'ncy-angular-breadcrumb'
        ])
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
                        url: '/{projectId}',
                        templateUrl: "views/status.html",
                        controller: ['$scope', function($scope) {
                            $scope.projectId='The Rotunda Talk';
                        }],
                        ncyBreadcrumb: {
                            parent: 'home',
                            label: '{{projectId}}'
                        }
                    })
                    .state('edit', {
                        url: '/{projectId}/edit',
                        templateUrl: "views/edit.html",
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
                templateUrl: 'views/breadcrumb.html'
            });
        }]);

})();
