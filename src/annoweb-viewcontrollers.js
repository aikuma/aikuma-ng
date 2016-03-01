/**
 * Created by Mat on 31/01/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-viewcontrollers', [])

        // removed dataService, unclear what role Firebase will play
        .controller('homeController', ['$location', 'dataService', 'loginService', function($location, dataService, loginService) {
            var vm = this;
            
            vm.getLoginStatus = loginService.getLoginStatus;    //wrapper function for js primitive data binding

            vm.userList = dataService.getUserList().then(function(userList) {
                console.log(userList);
                vm.currentUser = userList[0];
                
                loginService.loginUser(vm.currentUser._ID);
                dataService.getSessionList(vm.currentUser._ID).then(function(sessionList) {
                    vm.sessionList = sessionList;
                });
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
           
            vm.loadMockData = function() {
                var mockUserData = {
                    names: ['Mat Bettinson', '茂修'],
                    email: 'foo@gmail.com',
                    people: {
                        1: {
                            'names': ['Mat Bettinson', '茂修'],
                            'imageFileId': '1',
                            'email': 'foo@bar'
                        },
                        2: {
                            'names': ['Bo:ong Wind', '風高清'],
                            'imageFileId': '1',
                            'email': 'foo@bar'
                        },
                        3: {
                            'names': ['Nick Giannopoulos'],
                            'imageFileId': '1',
                            'email': 'foo@bar'
                        },
                        4: {
                            'names': ['Some-guy withalongalastaname', 'Terry'],
                            'imageFileId': '1',
                            'email': ''
                        }
                    },
                    tags: {
                        1: 'poor quality',
                        2: 'good quality',
                        3: 'requires approval',
                        4: 'received approval',
                        5: 'archived'
                    },
                    files: {
                        1: {
                            url: 'img/dummy_user.jpg',
                            type: 'image/jpeg'
                        },
                        2: {    
                            url: 'img/test_small.jpg',
                            type: 'image/jpeg',
                            description: 'A picture that has nothing to do with the recording.',
                        }
                    }
                };

                // mock data
                var mockSessionData = {
                    '1': {
                        names: ['The Rotunda Conversation'],
                        details: 'make up a details string or something',
                        roles: {
                            'speakerIds': ['1', '2', '3']
                        },
                        tagIds: ['1', '3'],
                        source: {
                            'duration': '30'
                        },
                        imageIds: ['2'],
                    },
                    '2': {
                        names: ["A recording that doesn't actually exist"],
                        details: 'make up a details string or something',
                        roles: {
                            'speakerIds': ['1', '2', '3']
                        },
                        tagIds: ['1', '3']     ,
                        source: {
                            'duration': '395'
                        },
                        imageIds: ['2'],
                    },
                    '3': {
                        names: ["Another fictional dummy data recording"],
                        details: 'make up a details string or something',
                        roles: {
                            'speakerIds': ['1', '2', '3']
                        },
                        tagIds: ['1', '3'],
                        source: {
                            'duration': '2210'
                        },
                        imageIds: ['2'],
                    }
                };

                dataService.setUser(mockUserData).then(function(data) {
                    console.log('SUCCESS: ' + data);
                }).catch(function(err) {
                    console.error('ERR: ' + err);
                });
                for(var i in mockSessionData) {
                    dataService.setSession(mockUserData.email, mockSessionData[i]).then(function(data) {
                        console.log('SUCCESS' + data);
                    }).catch(function(err) {
                        console.error('ERR: ' + err);
                    });
                }
            };

        }])

        .controller('statusController', ['$location', '$routeParams', 'mockService', 'loginService', 'AnnowebDialog', function($location, $routeParams, mockService, loginService, AnnowebDialog) {
            var vm = this;
            vm.sessionId = $routeParams.sessionId;
            vm.userId = loginService.getLoggedinUserId();
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
