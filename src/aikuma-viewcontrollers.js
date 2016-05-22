/**
 * Created by Mat on 31/01/2016.
 */
(function(){
    'use strict';
    angular
        .module('aikuma-viewcontrollers', [])
        .controller('homeController', ['$scope', '$location', 'dataService', 'loginService', 'aikumaDialog', '$animate', function($scope, $location, dataService, loginService, aikumaDialog, $animate) {
            var vm = this;
            
            vm.speedDial = false;
            vm.numberOfSessions = 0; // binding from session list directive
            vm.getLoginStatus = loginService.getLoginStatus;    //wrapper function for js primitive data binding
            vm.viewElement = angular.element( document.querySelector( '#viewcontent' ) );
            $scope.$watch(vm.getLoginStatus, function(isLoggedin) {
                if(isLoggedin) {
                    dataService.get('user', loginService.getLoggedinUserId()).then(function(userObj) {
                        vm.currentUserName = function() { return userObj.data.names[0]; };
                        $scope.userObj = userObj;
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

            vm.flash = function() {

            };
            
            vm.createNewUser = function() {
                aikumaDialog.profile().then(function(userData) {
                    if (!userData.data) {
                        dataService.setUser(userData).then(function(data) {
                            return dataService.getUserList();
                        }).then(function(userList){
                            vm.userList = userList;
                        });
                    }
                });
            };

            vm.recordNew = function() {
                $location.path('/new');
            };

        }])

        .controller('settingsController', ['userObj', 'config', '$scope', 'dataService', 'fileService', 'loginService', 'aikumaDialog', '$q', '$translate', '$mdDialog', function(userObj, config, $scope, dataService, fileService, loginService, aikumaDialog, $q, $translate, $mdDialog) {
            var vm = this;
            vm.debug = function() { return config.debug; };
            vm.preferences = userObj.data.preferences;
            
            // Temporary feature
            vm.cachePeak = config.cachePeak;
            vm.saveOption = function() {
                config.cachePeak = vm.cachePeak;
            }

            vm.userId = loginService.getLoggedinUserId();
            fileService.getFiles(vm.userId).then(function(fileList) {
                vm.fileList = fileList;
            })
            
            // If it's not an chrome-app, a hyperlink to file-URL will replace this function
            vm.downloadFile = function(file) {
                if(window.chrome && chrome.fileSystem) {
                    chrome.fileSystem.chooseFile({type: 'saveFile', suggestedName: file.name}, function(fileEntry) {
                        file.file(function(blob) {
                            fileService.writeFileToEntry(fileEntry, blob).then(function(){
                                console.log('success');
                            });  
                        }, function(err) {
                            console.error(err);
                        });
                        
                    });
                }
            };
            vm.deleteFile = function(ev, fileIndex) {
                $translate(["FILE_DELCONF1", "FILE_DELCONF2", "FILE_DELNO", "FILE_DELYES"]).then(function (translations) {
                    var confirm = $mdDialog.confirm()
                        .title(translations.FILE_DELCONF1)
                        .textContent(translations.FILE_DELCONF2)
                        .targetEvent(ev)
                        .ok(translations.FILE_DELYES)
                        .cancel(translations.FILE_DELNO);
                    $mdDialog.show(confirm).then(function () {
                        vm.fileList[fileIndex].remove(function() {
                            vm.fileList.splice(fileIndex, 1);
                            console.log("deleted");
                        }, function(err) {
                            console.error(err);
                        });
                    });
                });
            };
            
            dataService.getJsonBackup().then(function(db) {
                db['session'].forEach(function(sessionData){
                    var peakData = sessionData.source.peaks;
                    if(peakData)
                        sessionData.source.peaks = peakData[0] + 'px/sec, ' + peakData[1].length + " peaks";
                });
                vm.db = db;
                vm.keys = Object.keys(db);
                vm.isActive = {};
                vm.showElem = function(id) {
                    if(vm.isActive[id])
                        vm.isActive[id] = false;
                    else
                        vm.isActive[id] = true;
                };
            });
            
            vm.saveSetting = function() {
                config.debug = vm.preferences.debugMode;
                userObj.save();
            };
            
            vm.wipeData = function() {
                fileService.clear().then(function() {
                    return dataService.clear();
                }).then(function() {
                    aikumaDialog.toast('All data are wiped');
                }).catch(function(err){
                    aikumaDialog.toast('Wiping data failed: ' + err);
                });
            };
            
            vm.resetDb = function() {
                var request = window.indexedDB.deleteDatabase('myIndexedDB');
                request.onerror = function(event) {
                    aikumaDialog.toast('DB-reset failed');
                };
                request.onsuccess = function(event) {
                    aikumaDialog.toast('DB is reset');
                };
            };
            
            var mockUserData = {
                names: ['Mat Bettinson', '茂修'],
                email: 'foo@gmail.com',
                preferences: {
                    langCode: 'en'
                },
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
                            'name': 'META_DESC',
                            'icon': 'action:description',
                            'data': 'Some guy at the MPI describes how to get somewhere to another guy. There are many Rotundas.'
                        },
                        {
                            'name': 'META_LOC',
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

            vm.loadMockData = function() {
                dataService.setUser(mockUserData).then(function(ids) {
                    return ids[0];
                }).then(function(userId){
                    console.log('SUCCESS: ' + userId);
                    var promises = [];
                    for(var i in mockSessionData) {
                        console.log(mockSessionData[i]);
                        mockSessionData[i].source.created = Date.now();
                        promises.push(dataService.setSession(userId, mockSessionData[i]));
                    }
                    return $q.all(promises);
                }).then(function(){
                    aikumaDialog.toast('All mock-data are loaded');
                }).catch(function(err) {
                    aikumaDialog.toast('Mock-data loading failed: ' + err);
                });

            };
        }])
        .controller('extensionsController', ['$scope', 'dataService', 'fileService', 'aikumaDialog', function($scope, dataService, fileService, aikumaDialog){
            var vm = this;
            
            $scope.$watch('zipFile', function (file) {
                if(file) {
                    fileService.clear().then(function() {
                        return dataService.clear();
                    }).then(function() {
                        return fileService.importBackupFile(file);  
                    }).then(function(){
                        aikumaDialog.toast('All backup-data are loaded');
                    }).catch(function(err) {
                        aikumaDialog.toast('Backup-data loading failed: ' + err);
                    });
                }
            });
            
              
            if(window.chrome && chrome.fileSystem) {
                fileService.getBackupFile('blob').then(function(blob) {   
                    vm.export = function() {
                        chrome.fileSystem.chooseFile({type: 'saveFile', suggestedName: 'Backup.zip'}, function(fileEntry) {
                            fileService.writeFileToEntry(fileEntry, blob).then(function(){
                                aikumaDialog.toast('Backup.zip is exported');
                            });
                        });
                    };
                    vm.dataUri = 'views/settings.html'; // dummy Uri
                    vm.dataPrepared = true;
                });
                
            } else {
                fileService.getBackupFile('blob').then(function(blob) {
                    vm.dataUri = URL.createObjectURL(blob);
                    vm.backupName = "backup.zip"
                    vm.dataPrepared = true;
                })
            }
            
        }])
        .controller('newSessionController', ['$location', 'loginService', 'userObj', 'fileService', function($location, loginService, userObj, fileService) {
            // For now, new.html is just a container of ngRecord directive
            var vm = this;
            vm.externalRecord = fileService.getTempObject();
            
            vm.userObj = userObj;
        }])

        .controller('statusController', ['$mdDialog', '$location', '$scope', '$routeParams', 'loginService', 'fileService', 'aikumaDialog', 'userObj', 'sessionObj', 'langObjList', 'secondaryList', 'annotationObjList',
            function($mdDialog, $location, $scope, $routeParams, loginService, fileService, aikumaDialog, userObj, sessionObj, langObjList, secondaryList, annotationObjList) {
            var vm = this;
            vm.olactypes = [
                {
                    name: 'dialogue',
                    trans: 'OLAC1'
                },
                {
                    name: 'drama',
                    trans: 'OLAC2'
                },
                {
                    name: 'formulaic',
                    trans: 'OLAC3'
                },
                {
                    name: 'ludic',
                    trans: 'OLAC4'
                },
                {
                    name: 'narrative',
                    trans: 'OLAC5'
                },
                {
                    name: 'oratory',
                    trans: 'OLAC6'
                },
                {
                    name: 'procedural',
                    trans: 'OLAC7'
                },
                {
                    name: 'report',
                    trans: 'OLAC8'
                },
                {
                    name: 'singing',
                    trans: 'OLAC9'
                },
                {
                    name: 'unintelligible',
                    trans: 'OLAC10'
                }
            ];

            // For directives in status.html
            vm.userId = loginService.getLoggedinUserId();
            vm.sessionId = $routeParams.sessionId;
            vm.userObj = userObj;
            vm.sessionObj = sessionObj;
            vm.langObjList = langObjList;
            vm.secondaryList = secondaryList;
            vm.annoObjList = annotationObjList;
            
            vm.userData = userObj.data;
            vm.sessionData = sessionObj.data;


            // dummy data for respeaking/translation buttons
            vm.respeakings = vm.secondaryList.filter(function(secData) { return secData.type === 'respeak'; });
            vm.translations = vm.secondaryList.filter(function(secData) { return secData.type === 'translate'; });
            vm.annotations = vm.secondaryList.filter(function(secData) { return secData.type.indexOf('anno_') === 0; });
            vm.hasRespeaking = vm.respeakings.length !== 0;
            vm.hasTranslation = vm.translations.length !== 0;
            vm.numRespeaking = vm.respeakings.length;
            vm.numTranslation = vm.translations.length;
            
            vm.editTranslation = function(index) {
                // edit existing translation of index
                $location.path('/session/'+vm.sessionId+'/translate/'+vm.translations[index]._ID);
            };
            vm.editRespeaking = function(index) {
                // edit existing respeaking of index
                $location.path('/session/'+vm.sessionId+'/respeak/'+vm.respeakings[index]._ID);
            };
            vm.newTranslation = function() {
                // record a new translation
                $location.path('/session/'+vm.sessionId+'/translate');
            };
            vm.newRespeaking = function() {
                // record a new respeaking
                $location.path('/session/'+vm.sessionId+'/respeak');
            };

            
            if (vm.sessionData.imageIds) {
                vm.ImageCount = vm.sessionData.imageIds.length;
                vm.currentImageIdx = 1;
            } else {
                vm.ImageCount = 0;
            }

            if(vm.sessionData.source && vm.sessionData.source.recordFileId) {
                vm.audioSourceUrl = vm.userData.files[vm.sessionData.source.recordFileId].url;
                if(vm.sessionData.source.peaks) {
                    vm.audioSourcePeaks = vm.sessionData.source.peaks;
                }
            } else {
                aikumaDialog.toast('Aint no audio file for this session!');
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

            vm.openRspMenu = function($mdOpenMenu, ev) {
                $mdOpenMenu(ev);
            };
            vm.openTrnMenu = function($mdOpenMenu, ev) {
                $mdOpenMenu(ev);
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
            
            vm.deleteImage = function() {
                if(vm.sessionData && vm.sessionData.imageIds && vm.sessionData.imageIds.length > 0) {
                    var imageId = sessionObj.data.imageIds.splice(vm.currentImageIdx-1, 1)[0];
                    vm.currentImageIdx = 1;
                    vm.ImageCount--;
                    sessionObj.save().then(function(){
                        return fileService.deleteFileWithId(loginService.getLoggedinUserId(), imageId);
                    }).catch(function(err){
                        console.error(err);
                    });
                    
                }
            };

            vm.OLAChelp = function(ev) {
                aikumaDialog.help(ev, 'olac');
            };

            vm.edit = function(index) {
                $location.path('/session/'+vm.sessionId+'/annotate'+'/'+index);
            };

            vm.olac = sessionObj.data.olac;
            vm.clickOlac = function(clickwhat) {
                vm.olac = clickwhat;
                sessionObj.data.olac = clickwhat;
                sessionObj.save();
            };

            var srcDurMsec = sessionObj.data.source.duration;
            vm.dur = srcDurMsec? (srcDurMsec/1000).toFixed(1) : 0;
            
            vm.srcLangIds = sessionObj.data.source.langIds;
            vm.langIdNameMap = _.object(vm.langObjList.map(function(obj) { return [obj.Id, obj.Ref_Name]; }));
            vm.saveLangs = function(langIds) {
                sessionObj.data.source.langIds = langIds;
                sessionObj.save();
            };
            
            vm.myDate = new Date(sessionObj.data.source.created);
            vm.saveDate = function() {
                sessionObj.data.source.created = vm.myDate.getTime();
                sessionObj.save();
            };
            
            vm.getTopLine = function() {
                var displayfields = ["META_LOC"];
                var topLineList = [];
                if (!sessionObj.data.details) {return topLineList;}
                displayfields.forEach(function(df){
                    var metadata = sessionObj.data.details.filter(function(d){return d.name === df;});
                    if (metadata.length > 0) {
                        if (metadata[0].data !== '') {
                            topLineList.push({
                                icon: metadata[0].icon,
                                text: metadata[0].data
                            });
                        }
                    }
                });
                return topLineList;
            };

            // this is terrible because it wont update when we change metadata
            vm.TopLineMetadata = vm.getTopLine();


        }])
        // This is a skeletal view controller just for populating the breadcrumbs.
        .controller('respeakController', ['type', 'dataObj', function(type, dataObj) {
            var vm = this;
            vm.type = type;
            vm.langIdNameMap = _.object(dataObj[0].map(function(obj) { return [obj.Id, obj.Ref_Name]; }));
            vm.userObj = dataObj[1];
            vm.sessionObj = dataObj[2];
            if(dataObj.length === 4)
                vm.respeakObj = dataObj[3];
            vm.userData = vm.userObj.data;
            vm.sessionData = vm.sessionObj.data;
        
            if(vm.sessionData.source && vm.sessionData.source.recordFileId) {
                vm.audioSourceUrl = vm.userData.files[vm.sessionData.source.recordFileId].url;
                if(vm.sessionData.source.peaks) {
                    vm.audioSourcePeaks = vm.sessionData.source.peaks;
                }
            }
        }])
        .controller('annotateViewController', ['$scope', '$routeParams', 'userObj', 'sessionObj', 'annotationObjList', 'secondaryList', function($scope, $routeParams, userObj, sessionObj, annotationObjList, secondaryList) {
            $scope.userObj = userObj;
            $scope.sessionObj = sessionObj;
            $scope.userData = userObj.data;
            $scope.sessionData = sessionObj.data;
            $scope.annotationObjList = annotationObjList;
            $scope.selectedAnno = $routeParams.annotateId;
            $scope.secondaryList = secondaryList;

            if($scope.sessionData.source && $scope.sessionData.source.recordFileId) {
                $scope.audioSourceUrl = $scope.userData.files[$scope.sessionData.source.recordFileId].url;
            }
        }])
        .controller('trashController', ['$scope', 'userObj', '$mdDialog', '$translate', '$mdToast', 'dataService', 'fileService', '$q', function($scope, userObj, $mdDialog, $translate, $mdToast, dataService, fileService, $q) {
            $scope.userObj = userObj;
            var vm = this;
            vm.numberOfSessions = 0;
            vm.clearTrash = function(ev) {
                $translate(["TRASH_CLEANCONF1", "TRASH_CLEANCONF2", "ANNO_DELNO", "TRASH_CLEANYES"]).then(function (translations) {
                    var confirm = $mdDialog.confirm()
                        .title(translations.TRASH_CLEANCONF1)
                        .textContent(translations.TRASH_CLEANCONF2)
                        .targetEvent(ev)
                        .ok(translations.TRASH_CLEANYES)
                        .cancel(translations.ANNO_DELNO);
                    $mdDialog.show(confirm).then(function () {
                        // do it!
                        deleteAll();
                    }, function () {
                        $mdToast.show(
                            $mdToast.simple()
                                .parent(angular.element( document.querySelector( '#deletedItems' ) ))
                                .hideDelay(1500)
                                .position("bottom left")
                                .textContent('Cluck cluck cluck!')
                        );
                    });
                });
            };
            function deleteAll() {
                var promiseArray = [];
                dataService.getSessionObjList($scope.userObj.data._ID, true).then(function(sessionList) {
                    sessionList.forEach(function(session){
                        var promise = fileService.removeData('session', session.data._ID);
                        promiseArray.push(promise);
                    });
                    $q.all(promiseArray).then(function(){
                        vm.numberOfSessions = 0; // this will trigger a scope watch in the session list directive
                    }).catch(function(err) {
                        console.error(err);
                        vm.numberOfSessions = -1; // to trigger the update of session list directive 
                        
                        $mdToast.show(
                            $mdToast.simple()
                                .parent(angular.element( document.querySelector('#popupContainer')))
                                .hideDelay(1500)
                                .position('bottom left')
                                .textContent(err)
                        );
                    });
                });
            }
        }]);
    })();
