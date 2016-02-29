/**
 * Created by Mat on 31/01/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-viewcontrollers', [])

        // removed dataService, unclear what role Firebase will play
        .controller('homeController', ['$scope', '$state', '$stateParams', 'mockService', 'mockLoginService', function($scope, $state, $stateParams, mockService, mockLoginService) {
            var vm = this;
            vm.getLoginStatus = function () {
                return mockLoginService.getLoginStatus();
            };

            vm.userList = mockService.getUsers(function(userList) {
                mockLoginService.loginUser(userList[0].id);
                vm.sessionList = mockService.getSessionList(mockLoginService.getLoggedinUser());
            });

            //
            // Hard code the userId.
            //


            vm.goStatus = function(sessionIndex) {
                $state.go('status',
                    {
                        userId:mockLoginService.getLoggedinUser(),
                        sessionId:vm.sessionList[sessionIndex].id
                    });
            };
            vm.addNew = function() {
                $state.go('new');
            };

        }])

        .controller('statusController', ['$scope', '$state', '$stateParams', 'mockService', function($scope, $state, $stateParams, mockService) {
            var vm = this;
            vm.sessionId = $stateParams.sessionId;

            vm.userId = $stateParams.userId;

            console.log('sp',$stateParams);

            vm.details = [
                {
                    'name': 'Description',
                    'icon': 'action:description',
                    'data': 'Some guy at the MPI describes how to get somewhere to another guy. There are many Rotundas.'
                }
            ];

            vm.sessionData = mockService.getSessionData(vm.userId,vm.sessionId);
            $scope.sessionName = vm.sessionData.name;
            if (vm.sessionData.images.length) {
                vm.ImageCount = vm.sessionData.images.length;
                vm.currentImageIdx = 1;

            } else {
                vm.ImageCount = 0;
            }

            vm.nextImage = function() {
                ++vm.currentImageIdx;
            };

            vm.prevImage = function() {
                --vm.currentImageIdx;
            };
            vm.hasPreviousImage = function() {
               return vm.currentImageIdx > 1;
            };
            vm.hasNextImage = function() {
                return vm.currentImageIdx < vm.currentImageIdx;
            };

            vm.uploadNewImage = function() {
                var accepts = [{
                    mimeTypes: ['image/*'],
                    extensions: ['jpg', 'gif', 'png']
                }];
                chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, function(theEntry) {
                    if (!theEntry) {
                        vm.textContent = 'No file selected.';
                        return;
                    }
                    // use local storage to retain access to this file
                    chrome.storage.local.set({'chosenFile': chrome.fileSystem.retainEntry(theEntry)});

                });
            };

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
