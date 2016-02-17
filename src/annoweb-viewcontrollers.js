/**
 * Created by Mat on 31/01/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-viewcontrollers', [])

        .controller('navController', ['$scope', '$state', 'Auth', function($scope, $state, Auth) {
            var vm = this;
            vm.auth = Auth;
            vm.username = 'anonymous person';
            vm.menu = [
                {
                    class : '',
                    title: 'Getting started',
                    icon: 'action:help',
                    state: 'help'
                },
                {
                    class : '',
                    title: 'Open File',
                    icon: 'file:folder_open',
                    state: 'new'
                },
                {
                    class : '',
                    title: 'Record',
                    icon: 'av:mic',
                    state: 'new'
                },
                {
                    class : '',
                    title: 'Share',
                    icon: 'social:share',
                    state: 'share'
                },
                {
                    class : '',
                    title: 'Settings',
                    icon: 'action:settings',
                    state: 'settings'
                },
                {
                    class : '',
                    title: 'Changes',
                    icon: 'action:change_history',
                    state: 'changes'
                },
                {
                    class : '',
                    title: 'Chat',
                    icon: 'communication:chat',
                    state: 'chat'
                }
            ];
            vm.changeState = function(statename) {
                $state.go(statename);
            };
            vm.auth.$onAuth(function(authData) {
                vm.authData = authData;
                if (vm.authData) {
                    vm.username = vm.authData.facebook.displayName;
                } else {
                    vm.username = 'anonymous person';
                }
            });
        }])

        .controller('authController', ['$scope', function($scope) {
            $scope.val = "test";
        }])

        .controller('loginController', ['$scope', '$state', 'Auth', function($scope, $state, Auth) {
            var vm = this;
            vm.auth = Auth;
            // any time auth status updates, add the user data to scope
            vm.auth.$onAuth(function(authData) {
                vm.authData = authData;
            });
        }]);

})();
