(function (){
    'use strict';
    angular
        .module('annoweb', [
            'ngRoute',
            'ngMaterial',
            'annoweb-wavesurfer',
            'annoweb-dialog',
            'annoweb-service',
            'annoweb-edit',
            'annoweb-view',
            'file-model',
            'cfp.hotkeys'
        ])
        .config(['$mdIconProvider', function($mdIconProvider) {
            $mdIconProvider
                .iconSet('social','img/icons/sets/social-icons.svg', 24)
                .iconSet('content','img/icons/sets/content-icons.svg', 24)
                .iconSet('action','img/icons/sets/action-icons.svg', 24)
                .iconSet('nav','img/icons/sets/navigation-icons.svg', 24)
                .iconSet('av','img/icons/sets/av-icons.svg', 24)
                .defaultIconSet('img/icons/sets/core-icons.svg', 24);
        }])
        /* Direct URLs to different template paths */
        .config( ['$routeProvider', function ($routeProvider) {
            $routeProvider
                .when('/view', {
                    templateUrl: 'views/view-main.html'
                })
                .when('/edit', {
                    templateUrl: 'views/edit-main.html'
                })
                .otherwise({
                    redirectTo: '/edit'
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
        }]);


})();
