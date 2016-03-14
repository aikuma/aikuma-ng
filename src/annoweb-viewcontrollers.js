/**
 * Created by Mat on 31/01/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-viewcontrollers', [])

        .controller('homeController', ['config', '$timeout', '$scope', '$location', 'dataService', 'loginService', '$route', function(config, $timeout, $scope, $location, dataService, loginService, $route) {
            var vm = this;
            vm.speedDial = false;

            vm.getLoginStatus = loginService.getLoginStatus;    //wrapper function for js primitive data binding
            
            $scope.$watch(vm.getLoginStatus, function(isLoggedin) {
                if(isLoggedin) {
                    dataService.get('user', loginService.getLoggedinUserId()).then(function(userObj) {
                        vm.currentUser = userObj.data;
                        vm.currentUserName = function() { return userObj.data.names[0]; };

                        return dataService.getSessionList(vm.currentUser._ID);
                    }).then(function(sessionList) {
                        vm.sessionList = sessionList;
                    });
                } else {
                    vm.currentUserName = function() { return 'Unknown user'; };

                    dataService.getUserList().then(function(userList) {
                        vm.userList = userList;
                    });
                }
            });
            
            vm.login = function(userIndex) {
                loginService.loginUser(vm.userList[userIndex]._ID);
            };
            
            vm.createNewUser = function() {
                var mockUserData = {
                    names: ['Anonymous'],
                    email: 'foo@gmail.com'
                };
                
                dataService.setUser(mockUserData).then(function(data) {
                    return dataService.getUserList();
                }).then(function(userList){
                    vm.userList = userList;
                });
            };
            
            vm.goStatus = function(sessionIndex) {
                $location.path('session/'+vm.sessionList[sessionIndex]._ID);
            };
            vm.recordNew = function() {
                $location.path('/new');
            };

        }])

        .controller('settingsController', ['config', '$timeout', '$scope', '$location', 'dataService', 'loginService', '$route', function(config, $timeout, $scope, $location, dataService, loginService, $route) {
            var vm = this;

            vm.wipeData = function() {
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
                            'imageFileId': null,
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
                        details: [
                            {
                                'name': 'Description',
                                'icon': 'action:description',
                                'data': 'Some guy at the MPI describes how to get somewhere to another guy. There are many Rotundas.'
                            },
                            {
                                'name': 'Location',
                                'icon': 'communication:location_on',
                                'data': ''
                            }
                        ],
                        roles: {
                            'speakerIds': ['1', '2', '3']
                        },
                        tagIds: ['1', '3'],
                        source: {
                            recordFileId: '3',
                            langIds: ['eng'],
                            duration: 36000
                        },
                        imageIds: ['2'],
                        creatorId: 'foo@gmail.com'
                    },
                    '2': {
                        names: ["A recording that doesn't actually exist"],
                        details: [
                            {
                                'name': 'Description',
                                'icon': 'action:description',
                                'data': 'Some guy at the MPI describes how to get somewhere to another guy. There are many Rotundas.'
                            },
                            {
                                'name': 'Location',
                                'icon': 'communication:location_on',
                                'data': ''
                            }
                        ],
                        roles: {
                            'speakerIds': ['1', '2', '3']
                        },
                        tagIds: ['1', '3']     ,
                        source: {
                            recordFileId: '3',
                            langIds: ['eng'],
                            duration: 36000
                        },
                        imageIds: ['2'],
                        creatorId: 'foo@gmail.com'
                    },
                    '3': {
                        names: ["Another fictional dummy data recording"],
                        details: [
                            {
                                'name': 'Description',
                                'icon': 'action:description',
                                'data': 'Some guy at the MPI describes how to get somewhere to another guy. There are many Rotundas.'
                            },
                            {
                                'name': 'Location',
                                'icon': 'communication:location_on',
                                'data': ''
                            }
                        ],
                        roles: {
                            'speakerIds': ['1', '2', '3']
                        },
                        tagIds: ['1', '3'],
                        source: {
                            recordFileId: '3',
                            langIds: ['eng'],
                            duration: 36000
                        },
                        imageIds: ['2'],
                        creatorId: 'foo@gmail.com'
                    }
                };

                dataService.setUser(mockUserData).then(function(ids) {
                    return ids[0];
                }).then(function(userId){
                    console.log('SUCCESS: ' + userId);
                    for(var i in mockSessionData) {
                        console.log(mockSessionData[i]);
                        dataService.setSession(userId, mockSessionData[i]).then(function(data) {
                            console.log('SUCCESS' + data);
                        }).catch(function(err) {
                            console.error('ERR: ' + err);
                        });
                    }
                }).catch(function(err) {
                    console.error('ERR: ' + err);
                });

                $timeout(function() {
                    $route.reload();
                }, 1000);

            };
        }])

        .controller('newSessionController', ['$location', 'loginService', 'userObj', function($location, loginService, userObj) {
            // For now, new.html is just a container of ngRecord directive
            var vm = this;
            
            vm.userObj = userObj;
        }])

        .controller('statusController', ['$location', '$scope', '$routeParams', 'loginService', 'fileService', 'AnnowebDialog', 'userObj', 'sessionObj', 'langObjList', function($location, $scope, $routeParams, loginService, fileService, AnnowebDialog, userObj, sessionObj, langObjList) {
            var vm = this;
            vm.olactypes = ['dialogue','drama','formulaic','ludic','narrative','oratory','procedural','report','singing','unintelligible'];
            vm.location = 'MPI, Netherlands.';

            // For directives in status.html
            vm.userId = loginService.getLoggedinUserId();
            vm.sessionId = $routeParams.sessionId;
            vm.userObj = userObj;
            vm.sessionObj = sessionObj;
            
            vm.userData = userObj.data;
            vm.sessionData = sessionObj.data;
            
            if (vm.sessionData.imageIds) {
                vm.ImageCount = vm.sessionData.imageIds.length;
                vm.currentImageIdx = 1;
            } else {
                vm.ImageCount = 0;
            }

            if(vm.sessionData.source && vm.sessionData.source.recordFileId) {
                vm.audioSourceUrl = vm.userData.files[vm.sessionData.source.recordFileId].url;
            } else {
                AnnowebDialog.toast('Aint no audio file for this session!');
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
                return vm.currentImageIdx < vm.ImageCount;
            };

            // When Image is imported
            $scope.$watch('imageFile', function (file) {
                if (file && file.type.match('^image/')) { 
                    var fileObjId;
                    fileService.createFile(loginService.getLoggedinUserId(), file).then(function(imageUrl) {
                        var fileObj = {
                            url: imageUrl,
                            type: file.type
                        };
                        
                        fileObjId = userObj.addUserFile(fileObj);
                        return userObj.save();
                    }).then(function() {
                        if(!sessionObj.data.imageIds)
                            sessionObj.data.imageIds = [];
                        sessionObj.data.imageIds.push(fileObjId);
                        return sessionObj.save();
                    }).then(function() {
                        vm.ImageCount = vm.sessionData.imageIds.length;
                        vm.currentImageIdx = 1;
                    }).catch(function(err) {
                        if(imageUrl)
                            fileService.deleteFile(imageUrl);
                    });
                }
            });

            vm.hasImage = function() {
                if(vm.sessionData && vm.sessionData.imageIds && vm.sessionData.imageIds.length > 0) {
                     return true;
                } else {
                     return false;
                }
            };
            
            vm.getImage = function() {  
                if(vm.userData) {
                    return vm.userData.files[ vm.sessionData.imageIds[ vm.currentImageIdx-1 ] ].url;
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

            vm.olac = sessionObj.data.olac || 'drama';
            vm.clickOlac = function(clickwhat) {
                vm.olac = clickwhat;
                sessionObj.data.olac = clickwhat;
                sessionObj.save();
            };

            var srcDurMsec = sessionObj.data.source.duration;
            vm.dur = srcDurMsec? srcDurMsec/1000 : 0;
            
            var srcLangIds = sessionObj.data.source.langIds;
            vm.langList = langObjList.filter(function(obj) { return srcLangIds.indexOf(obj.Id) !== -1; }).map(function(obj){ return obj.Ref_Name; }).join(', ');
        }])
        // This is a skeletal view controller just for populating the breadcrumbs.
        .controller('respeakController', ['userObj', 'sessionObj', function(userObj, sessionObj) {
            var vm = this;
            vm.userData = userObj.data;
            vm.sessionData = sessionObj.data;
        
            if(vm.sessionData.source && vm.sessionData.source.recordFileId) {
                vm.audioSourceUrl = vm.userData.files[vm.sessionData.source.recordFileId].url;
            }
        }]);
})();
