/**
 * Created by Mat on 31/01/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-viewcontrollers', [])

        // removed dataService, unclear what role Firebase will play
        .controller('homeController', ['$location', 'mockService', 'mockLoginService', function($location, mockService, mockLoginService) {
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
                $location.path('session/'+vm.sessionList[sessionIndex].id);
            };
            vm.addNew = function() {
                $location.path('/new');
            };

        }])

        .controller('statusController', ['$location', '$routeParams', 'mockService', 'mockLoginService', 'AnnowebDialog', function($location, $routeParams, mockService, mockLoginService, AnnowebDialog) {
            var vm = this;
            vm.sessionId = $routeParams.sessionId;
            vm.userId = mockLoginService.getLoggedinUser();
            vm.sessionData = mockService.getSessionData(vm.userId,vm.sessionId);

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
            vm.details = [
                {
                    'name': 'Description',
                    'icon': 'action:description',
                    'data': 'Some guy at the MPI describes how to get somewhere to another guy. There are many Rotundas.'
                }
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
                $location.path('/session/'+vm.sessionId+'/annotate'+'/'+index);
            };

            vm.addAnno = function (ev) {
               var nd = AnnowebDialog.newAnno(ev);
                console.log(nd);
            };

        }]);




})();
