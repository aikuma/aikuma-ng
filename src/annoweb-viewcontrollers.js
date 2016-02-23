/**
 * Created by Mat on 31/01/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-viewcontrollers', [])


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
        .controller('homeController', ['$scope', '$state', '$stateParams', 'ezfb', 'mockService', function($scope, $state, $stateParams, ezfb, mockService) {
            var vm = this;
            //
            // Hard code the userId.
            //
            ezfb.getLoginStatus()
                .then(function (res) {
                    if (res.status == 'connected') {
                        vm.userid = res.authResponse.userID;
                        vm.PrimaryList = mockService.getPrimaryList(vm.userid);
                        vm.loggedin = true;
                    } else {
                        vm.loggedin = false;
                    }
                });

            vm.goStatus = function(primaryIndex) {
                $state.go('status',{primaryId:vm.PrimaryList[primaryIndex].id});
            };
            vm.addNew = function() {
                $state.go('new');
            };

            ezfb.Event.subscribe('auth.statusChange', function (statusRes) {
                if (statusRes.status == 'connected') {
                    vm.loggedin = true;
                    vm.userid = statusRes.authResponse.userID;
                    vm.PrimaryList = mockService.getPrimaryList(vm.userid);
                } else {
                    vm.loggedin = false;
                }
            });

        }])

        .controller('statusController', ['$scope', '$state', '$stateParams', 'mockService', function($scope, $state, $stateParams, mockService) {
            var vm = this;
            var id = $stateParams.primaryId;

            vm.projectData = mockService.getPrimaryDetails(id);
            $scope.projectId = vm.projectData.name;

        }]);


})();
