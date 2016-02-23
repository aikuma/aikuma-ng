/**
 * Created by Mat on 23/02/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-commondirectives', [])
        .directive("ngNavbar", function() {
            return {
                restrict: "E",
                templateUrl: "views/templates/navbar-template.html",
                controller: navController,
                controllerAs: 'navCtrl'
            };
        });

        var navController = function ($scope, $state, ezfb) {
            var vm = this;
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

        };
    navController.$inject = ['$scope', '$state', 'ezfb'];

})();
