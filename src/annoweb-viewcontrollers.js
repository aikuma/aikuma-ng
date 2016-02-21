/**
 * Created by Mat on 31/01/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-viewcontrollers', [])

        .controller('navController', ['$scope', '$state', 'ezfb', function($scope, $state, ezfb) {
            var vm = this;
            //vm.auth = dataService.auth;
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
                },
                {
                    class : '',
                    title: 'Bug Report',
                    icon: 'action:bug_report',
                    state: 'reportbug'
                }
            ];
            vm.changeState = function(statename) {
                $state.go(statename);
            };

            updateFB();

            ezfb.Event.subscribe('auth.statusChange', function (statusRes) {
                $scope.loginStatus = statusRes;
                updateFB();

            });

            /**
             * Update api('/me') result
             */
            function updateFB () {
                ezfb.getLoginStatus()
                    .then(function (res) {
                        vm.loginStatus = res;
                        return ezfb.api('/me');
                    })
                    .then(function (me) {
                        vm.me = me;
                        if (vm.loginStatus.status=='connected') {
                            vm.username = vm.me.name;
                        } else {
                            vm.username = 'anonymous person';
                        }
                    });
            }
            vm.login = function () {
                ezfb.login(null, {scope: 'email'});
            };

            vm.logout = function () {
                ezfb.logout();
            };

        }])

        .controller('authController', ['$scope', function($scope) {
            $scope.val = "test";
        }])

        .controller('loginController', ['$scope', 'authService', function($scope, authService) {
            var vm = this;
            vm.loginstatus = authService.loginStatus;
            vm.apiMe = authService.apiMe;
            vm.login = function() {
                authService.login();
            };
            vm.logout = function() {
                authService.logout();
            };
            $scope.$on('authchange', function() {
                console.log('yep');
                $scope.$apply();
            });

        }])

        // removed dataService, unclear what role Firebase will play
        .controller('homeController', ['$scope', '$state', function($scope, $state) {
            var vm = this;
            //
            // Hard code the userId. It should be something like the Firebase auth service but we need to do it locally.
            //
            vm.userId = 1;

            //vm.auth = dataService.auth;
            //vm.profile = dataService.profile;
            // any time auth status updates, add the user data to scope
            //vm.auth.$onAuth(function(authData) {
            //    vm.authData = authData;
            //});

        }]);


})();
