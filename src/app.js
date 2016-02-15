(function (){
    'use strict';
    angular
        .module('annoweb', [
            'ui.router',
            'ngMaterial',
            'annoweb-wavesurfer',
            'annoweb-dialog',
            'annoweb-service',
            'annoweb-edit',
            'annoweb-view',
            'annoweb-annotation',
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
                .defaultIconSet('img/icons/sets/core-icons.svg', 24);
        }])
        .config(function ($mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('light-blue', {
                    'default': '300'
                })
                .accentPalette('deep-orange', {
                    'default': '500'
                });
        })
        .config(['$stateProvider', '$urlRouterProvider', '$logProvider',
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
                    .state('changes', {
                        url: '/changes',
                        templateUrl: "views/changes.html",
                        ncyBreadcrumb: {
                            parent: 'home',
                            label: 'Changes'
                        }
                    })
                    .state('record', {
                        url: '/record',
                        templateUrl: "views/record.html",
                        ncyBreadcrumb: {
                            parent: 'home',
                            label: 'Record'
                        }
                    })
                    .state('metadata', {
                        url: '/metadata',
                        templateUrl: "views/record.metadata.html",
                        ncyBreadcrumb: {
                            parent: 'record',
                            label: 'Metadata'
                        }
                    })
                    .state('edit', {
                        url: '/edit',
                        templateUrl: "views/edit.html",
                        ncyBreadcrumb: {
                            parent: 'home',
                            label: 'Edit'
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
        .config(function($breadcrumbProvider) {
            $breadcrumbProvider.setOptions({
                templateUrl: 'views/breadcrumb.html'
            });
        })
        .controller('menuCtrl', ['$scope', '$state', function($scope, $state) {
            var vm = this;
            $scope.menu = [
                {
                    link : '',
                    title: 'Getting started',
                    icon: 'action:help',
                    state: 'help'
                },
                {
                    link : '',
                    title: 'Open File',
                    icon: 'file:folder_open',
                    state: 'open'
                },
                {
                    link : '',
                    title: 'Record',
                    icon: 'av:mic',
                    state: 'record'
                },
                {
                    link : '',
                    title: 'Share',
                    icon: 'social:share',
                    state: 'share'
                },
                {
                    link : '',
                    title: 'Settings',
                    icon: 'action:settings'
                },
                {
                    link : '',
                    title: 'Changes',
                    icon: 'action:change_history',
                    state: 'changes'
                }
            ];
            $scope.changeState = function(statename) {
                $state.go(statename);
            };
        }]);
})();
