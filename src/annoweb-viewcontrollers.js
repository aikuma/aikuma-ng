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

            //vm.userData = mockService.getUserData(1);

            ezfb.getLoginStatus()
                .then(function (res) {
                    if (res.status == 'connected') {
                        vm.userid = res.authResponse.userID;
                        vm.sessionList = mockService.getSessionList(vm.userid);
                        vm.loggedin = true;
                    } else {
                        vm.loggedin = false;
                    }
                });

            vm.goStatus = function(sessionIndex) {
                $state.go('status',{userId:vm.userid,sessionId:vm.sessionList[sessionIndex].id});
            };
            vm.addNew = function() {
                $state.go('new');
            };

            ezfb.Event.subscribe('auth.statusChange', function (statusRes) {
                if (statusRes.status == 'connected') {
                    vm.loggedin = true;
                    vm.userid = statusRes.authResponse.userID;
                    vm.sessionList = mockService.getSessionList(vm.userId);
                } else {
                    vm.loggedin = false;
                }
            });

        }])

        .controller('statusController', ['$scope', '$state', '$stateParams', 'mockService', function($scope, $state, $stateParams, mockService) {
            var vm = this;
            vm.sessionId = $stateParams.sessionId;
            vm.userId = $stateParams.userId;

            vm.details = [
                {
                    'name': 'Description',
                    'icon': 'action:description',
                    'data': 'Some guy at the MPI describes how to get somewhere to another guy. There are many Rotundas.'
                }
            ];

            vm.sessionData = mockService.getSessionData(vm.userId,vm.sessionId);

            vm.mockSegs = [
                [
                    {
                        'type': 'Transcription',
                        'lang': 'English',
                        'snippet': 'You go down to the rotunda...'
                    },
                    {
                        'type': 'Translation',
                        'lang': 'Chinese',
                        'snippet': '你要往下面去...'
                    }
                ],
                [
                    {
                        'type': 'Comment',
                        'lang': 'English',
                        'snippet': 'Boris is gesturing...'
                    }
                ]
            ];

            vm.hasImage = function() {
                 if (vm.sessionData.images.length) {
                     return true;
                } else {
                     return false;
                 }
            };
            vm.getImage = function() {
                return mockService.getFileURL(vm.userId,vm.sessionData.images[0].fileId);
            };

            vm.edit = function(index) {
                $state.go('annotate', {sessionId:$stateParams.sessionId});
            };

        }]);


})();
