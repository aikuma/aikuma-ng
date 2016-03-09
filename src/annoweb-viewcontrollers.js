/**
 * Created by Mat on 31/01/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-viewcontrollers', [])

        // removed dataService, unclear what role Firebase will play
        //.controller('homeController', ['$location', 'dataService', 'loginService', function($location, dataService, loginService) {
        .controller('homeController', ['$scope', '$location', 'dataService', 'loginService', '$route', function($scope, $location, dataService, loginService, $route) {
            var vm = this;
            var currentUserName = 'Unknown user';
            vm.username = function() { return currentUserName; };

            vm.getLoginStatus = loginService.getLoginStatus;    //wrapper function for js primitive data binding

            vm.userList = dataService.getUserList().then(function(userList) {
                vm.currentUser = userList[0];
                loginService.loginUser(vm.currentUser._ID);
                dataService.getSessionList(vm.currentUser._ID).then(function(sessionList) {
                    vm.sessionList = sessionList;
                });
                dataService.get('user', vm.currentUser._ID).then(function(userObj) {
                    currentUserName = userObj.data.names[0];       
                });
            });

            vm.goStatus = function(sessionIndex) {
                $location.path('session/'+vm.sessionList[sessionIndex]._ID);
            };
            vm.addNew = function() {
                $location.path('/new');
            };
            vm.wipeData = function() {
                console.log('yep');
                window.indexedDB.deleteDatabase('myIndexedDB');
                $timeout(function() {
                    $route.reload();
                }, 1000);
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
                        },
                        3: {
                            url: 'media/elan-example1.mp3',
                            type: 'audio/wav'
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
                            recordFileId: '3'
                        },
                        imageIds: ['2'],
                        creatorId: 'foo@gmail.com'
                    },
                    '2': {
                        names: ["A recording that doesn't actually exist"],
                        details: 'make up a details string or something',
                        roles: {
                            'speakerIds': ['1', '2', '3']
                        },
                        tagIds: ['1', '3']     ,
                        source: {
                            recordFileId: '3'
                        },
                        imageIds: ['2'],
                        creatorId: 'foo@gmail.com'
                    },
                    '3': {
                        names: ["Another fictional dummy data recording"],
                        details: 'make up a details string or something',
                        roles: {
                            'speakerIds': ['1', '2', '3']
                        },
                        tagIds: ['1', '3'],
                        source: {
                            recordFileId: '3'
                        },
                        imageIds: ['2'],
                        creatorId: 'foo@gmail.com'
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
    
        .controller('newSessionController', ['$location', 'loginService', 'dataService', function($location, loginService, dataService) {
            // For now, new.html is just a container of ngRecord directive
            var vm = this;
            
        }])

        .controller('statusController', ['$scope','$location', '$routeParams', 'loginService', 'dataService', function($scope,$location, $routeParams, loginService, dataService) {
            var vm = this;
            vm.olactypes = ['dialogue','drama','formulaic','ludic','narrative','oratory','procedural','report','singing','unintelligible'];
            vm.olac = 'drama';
            vm.location = 'MPI, Netherlands.';

            vm.userId = loginService.getLoggedinUserId();
            vm.sessionId = $routeParams.sessionId;
            
            dataService.get('user', vm.userId).then(function(userObj) {
                vm.userData = userObj.data;
            }).then(function() {
                dataService.get('session', vm.sessionId).then(function (sessionObj) {
                    vm.sessionData = sessionObj.data;
                    if (vm.sessionData.imageIds) {
                        vm.ImageCount = vm.sessionData.imageIds.length;
                        vm.currentImageIdx = 1;
                    } else {
                        vm.ImageCount = 0;
                    }
                    // This is the sort of extreme lengths we need to go to just to get a url for session source...
                    $scope.$broadcast('loadPlayer', {
                        url: vm.userData.files[vm.sessionData.source.recordingFileId].url
                    });
                });
            });

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
                return vm.currentImageIdx < vm.ImageCount;
            };

            // TODO: file-service
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

            vm.hasImage = function() {
                if(vm.sessionData && vm.sessionData.imageIds && vm.sessionData.imageIds.length > 0) {
                     return true;
                } else {
                     return false;
                }
            };
            
            // TODO: file-service for filesystem url
            vm.getImage = function() {  
                if(vm.userData) {
                    return vm.userData.files[ vm.sessionData.imageIds[0] ].url;
                } else {
                    return null;
                }
            };

            vm.edit = function(index) {
                $location.path('/session/'+vm.sessionId+'/annotate'+'/'+index);
            };

            vm.respeak = function() {
                $location.path('/session/'+vm.sessionId+'/respeak');
            };

            vm.clickOlac = function(clickwhat) {
                vm.olac = clickwhat;
            };

        }])
        // This is a skeletal view controller just for populating the breadcrumbs.
        .controller('respeakController', ['dataService', '$routeParams', function(dataService, $routeParams) {
            var vm = this;
            dataService.get('session', $routeParams.sessionId).then(function(sessionObj){
                vm.sessionData = sessionObj.data;
            });
        }]);
})();
