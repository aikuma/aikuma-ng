/**
 * Created by Mat on 23/02/2016.
 */
(function(){
    'use strict';
    angular
        .module('aikuma-commondirectives', [])
        .directive("ngNavbar", function() {
            return {
                restrict: "E",
                templateUrl: "views/templates/navbar-template.html",
                replace: true,
                controller: navController,
                controllerAs: 'navCtrl'
            };
        })
        .directive("ngTagSelector", function() {
            return {
                restrict: "E",
                scope: {
                    userObj: '=',
                    sessionObj: '='
                },
                templateUrl: "views/templates/tag-selector-template.html",
                controller: tagSelectorController,
                controllerAs: 'tsCtrl'
            };
        })
        .directive("ngMetadata", function() {
            return {
                restrict: "E",
                scope: {
                    sessionObj: '='
                },
                templateUrl: "views/templates/metadata-template.html",
                controller: metadataController,
                controllerAs: 'mCtrl'
            };
        })
        .directive("ngPlayer", function() {
            return {
                restrict: "E",
                scope: {
                    source: '@',
                    peaks: '=',
                    wavesurfer: '='
                },
                templateUrl: "views/templates/player-template.html",
                controller: playerController,
                controllerAs: 'pCtrl'
            };
        })
        .directive("ngTopbar", function() {
            return {
                restrict: "E",
                scope: {
                    session: '@',
                    sessionId: '@',
                    activity: '@'
                },
                templateUrl: "views/templates/toolbar-template.html",
                controller: topbarController,
                controllerAs: 'tbCtrl'
            };
        })
        .directive("ngWebcam", function() {
            return {
                restrict: "E",
                scope: {
                    userObj: '=',
                    sessionObj: '=',
                    imageId: '='
                },
                templateUrl: "views/templates/webcam-template.html",
                controller: webcamController,
                controllerAs: 'wCtrl'
            };
        })
        // This is bound to the <body> element to pass key events to the keyService. Intended for low-level handling so
        // we can detect keys held-down (which angular hotkeys doesn't do) and left/right shift/ctrl which no key library does!
        .directive('keyFocus', ['keyService', function(keyService){
            return {
                restrict: 'A',
                link: function(scope, element, attr){
                    element.bind('keydown', function(event) {
                        if (!event.repeat) {
                            keyService.handleKey(event);
                        }
                    });
                    element.bind('keyup', function(event) {
                        keyService.handleKey(event);
                    });
                }
            };
        }])
        .directive('focusOn', function() {
            return function(scope, elem, attr) {
                scope.$on(attr.focusOn, function(e) {
                    elem[0].focus();
                });
            };
        })
        .directive('ngLanguageSelector', [function(){
            return {
                restrict: 'E',
                scope: {
                    langIdList: '=',
                    langIdNameMap: '=',
                    onChange: '&'
                },
                templateUrl: "views/templates/language-selector-template.html",
                controller: langSelectController,
                controllerAs: 'lsCtrl'
            };
        }])
        .directive("ngPersonSelector", function() {
            return {
                restrict: "E",
                scope: {
                    userObj: '=',
                    sessionObj: '=',
                    role: '@'
                },
                templateUrl: "views/templates/person-selector-template.html",
                controller: personSelectorController,
                controllerAs: 'psCtrl'
            };
        })
        .directive('fileModel', [
            '$parse',
            function ($parse) {
                return {
                    restrict: 'A',
                    link: function(scope, element, attrs) {
                        var model = $parse(attrs.fileModel);
                        var modelSetter = model.assign;

                        element.bind('change', function(){
                            scope.$apply(function(){
                                if (attrs.multiple) {
                                    modelSetter(scope, element[0].files);
                                }
                                else {
                                    modelSetter(scope, element[0].files[0]);
                                }
                            });
                        });
                    }
                };
            }
        ])
        .directive("ngSessionList", function() {
            return {
                restrict: "E",
                scope: {
                    userObj: '=',
                    deleted: '=',
                    numberOfSessions: '=',
                    loaded: '='
                },
                templateUrl: "views/templates/sessionList-template.html",
                controller: sessionListController,
                controllerAs: 'slCtrl'
            };
        });

        var sessionListController = function($scope, dataService, $mdDialog, $translate, $location) {
            var vm = this;
            vm.currentUser = $scope.userObj.data;
            vm.deleted = $scope.deleted;
            $scope.loaded = false;
            $scope.$watch('numberOfSessions', function() {
                updateSessionList();
            });
            function updateSessionList() {
                dataService.getSessionObjList($scope.userObj.data._ID, vm.deleted).then(function(sessionList) {
                    vm.sessionList = sessionList;
                    $scope.numberOfSessions = sessionList.length;
                    $scope.loaded = true;
                });
            }
            vm.restoreSession = function(sessionIndex) {
                var sessionObj = vm.sessionList[sessionIndex];
                sessionObj.data.isTrashed = false;
                sessionObj.save();
                vm.sessionList.splice(sessionIndex, 1);
                $scope.numberOfSessions = $scope.numberOfSessions - 1;
            };
            vm.trashSession = function(ev, sessionIndex) {
                $translate(["SESSION_DELCONF1", "SESSION_DELCONF2", "SESSION_DELNO", "SESSION_DELYES"]).then(function (translations) {
                    var confirm = $mdDialog.confirm()
                        .title(translations.SESSION_DELCONF1)
                        .textContent(translations.SESSION_DELCONF2)
                        .targetEvent(ev)
                        .ok(translations.SESSION_DELYES)
                        .cancel(translations.SESSION_DELNO);
                    $mdDialog.show(confirm).then(function () {
                        var sessionObj = vm.sessionList[sessionIndex];
                        vm.sessionList.splice(sessionIndex, 1);
                        sessionObj.data.isTrashed = true;
                        sessionObj.save();
                    });
                });
            };
            vm.goStatus = function(sessionIndex) {
                $location.path('session/'+vm.sessionList[sessionIndex].data._ID);
            };
        };
        sessionListController.$inject = ['$scope', 'dataService', '$mdDialog', '$translate', '$location'];

        var topbarController = function ($scope, $translate, $mdMedia, $mdSidenav, config, loginService, aikumaDialog) {
            var vm = this;
            vm.languages = config.languages;
            vm.open = false;
            vm.getLoginStatus = loginService.getLoginStatus;
            vm.changeLang = function(lang) {
                $translate.use(lang);
            };
            vm.openProfile = function(ev) {
                aikumaDialog.profile();
            };
            vm.showMenuButton = function(){ return !$mdMedia('(min-width: 1024px)'); };
            vm.openMenu = function() {
                $mdSidenav('left').open();
            };
        };
        topbarController.$inject = ['$scope', '$translate', '$mdMedia', '$mdSidenav', 'config', 'loginService', 'aikumaDialog'];

        var navController = function ($timeout, config, $rootScope, $scope, $translate, $location, loginService, dataService, fileService, aikumaDialog, aikumaService, $animate) {
            var vm = this;
            vm.languages = config.languages;
            
            vm.debug = function() { return config.debug; };
            vm.getLoginStatus = loginService.getLoginStatus;
            vm.versionString = config.appVersion;
            $scope.onlineStatus = aikumaService;
            vm.logoElement = angular.element( document.querySelector( '#aikumaLogo' ) );
            $timeout(function(){
                $animate.removeClass(vm.logoElement, 'rollInLogo');
            },1500);

            $scope.$watch('onlineStatus.isOnline()', function(online) {
                vm.onlineStatus = online;
                vm.online_status_string = online ? 'online' : 'offline';
            });

            $scope.$watch(vm.getLoginStatus, function(isLoggedin) {
                if (isLoggedin) {
                    dataService.get('user', loginService.getLoggedinUserId()).then(function(userObj) {
                        vm.currentUserName = function() { return userObj.data.names[0]; };
                    });
                } else {
                    vm.LOGINAS = '';
                    vm.currentUserName = function() { return ''; };
                }
            });

            $rootScope.$on("$locationChangeStart", function() {
                $animate.addClass(vm.logoElement, 'rollLogo').then(function() {
                    $animate.removeClass(vm.logoElement, 'rollLogo');
                });
            });

            vm.goHome = function() {
                $location.path('/');
            };


            vm.logout = function() {
                loginService.logout();
                $location.path('/');
            };
            
            vm.menu = [
                {
                    class : '',
                    title: 'HOME',
                    icon: 'action:home',
                    state: 'home'
                },
                {
                    class : '',
                    title: 'NAV_HELP',
                    icon: 'action:help',
                    state: 'help'
                },
                {
                    class : '',
                    title: 'NAV_OPENF',
                    icon: 'file:folder_open',
                    state: 'import'
                },
                {
                    class : '',
                    title: 'NAV_RECORD',
                    icon: 'av:mic',
                    state: 'new'
                },
                {
                    class : '',
                    title: 'NAV_SHARE',
                    icon: 'social:share',
                    state: 'share',
                    tooltip: 'NOT_IMPLEMENTED'
                },
                {
                    class : '',
                    title: 'NAV_TRASH',
                    icon: 'action:delete',
                    state: 'trash',
                },
                {
                    class : '',
                    title: 'NAV_SETTINGS',
                    icon: 'action:settings',
                    state: 'settings'
                },
                {
                    class : '',
                    title: 'NAV_CHANGES',
                    icon: 'action:change_history',
                    state: 'changes'
                },
                {
                    class : '',
                    title: 'NAV_BUGREP',
                    icon: 'action:report_problem',
                    state: 'reportbug',
                },
                {
                    class : '',
                    title: 'NAV_EXTENSIONS',
                    icon: 'action:extension',
                    state: 'extensions'
                },
                {
                    class : '',
                    title: 'NAV_DEBUG',
                    icon: 'action:bug_report',
                    state: 'debug'
                }
            ];
            
            vm.changeState = function(statename) {
                if(statename === 'extensions' || statename === 'home' || 
                   (loginService.getLoginStatus() && statename !== 'import')) {
                    $location.path('/'+statename);
                }
            };

            vm.openAbout = function(ev) {
                aikumaDialog.help(ev, 'about');
            };
            
            vm.toggleDebug = function() {
                config.debug = !config.debug;
                $translate(['DEBUG_ON', 'DEBUG_OFF']).then(function (tstring) {
                    if (config.debug) {
                        aikumaDialog.toast(tstring.DEBUG_ON);
                    } else {
                        aikumaDialog.toast(tstring.DEBUG_OFF);
                    }
                });
                
            };
            
            // When 'Open File' is pressed
            $scope.$watch('file', function (file) {
                if (file) {
                    if (!file.type.match('^audio/')) {
                        aikumaDialog.toast('Not an audio file!');
                    } else {
                        fileService.setTempObject(file);
                        $location.path('/import');
                    }
                }
            });

        };
    navController.$inject = ['$timeout', 'config', '$rootScope', '$scope', '$translate', '$location', 'loginService', 'dataService', 'fileService', 'aikumaDialog', 'aikumaService', '$animate'];

    var tagSelectorController = function ($scope, aikumaDialog) {
        var vm = this;
        
        // load all user data from the service and create an array of contacts needed
        var userObject = $scope.userObj;
        vm.allTags = loadTags(userObject.data.tags);
        vm.tagQuerySearch = function(query) {
            var results = query ?
                vm.allTags.filter(createFilterForTag(query)) : [];
            return results;
        };
        
        // load the requested session from the service and get the currenttags
        var sessionObj = $scope.sessionObj,
            selectedTagIds = sessionObj.data.tagIds;
        // onload populate the chips selector with existing (based on ids)
        $scope.selectedTags = _.map(selectedTagIds, function(id) {
            return makeTagObj(userObject.data.tags, id);
        });

        // ordinary watch and ng-change don't work.
        $scope.$watchCollection('selectedTags', function() {
            var idList = _.pluck($scope.selectedTags, 'id');
            sessionObj.data.tagIds = idList;
            sessionObj.save();
        });

        vm.transformChip = function(chip) {
            // If it is an object, it's already a known chip
            if (angular.isObject(chip)) {
                return chip;
            }
            // Otherwise, create a new one - first add a new tag to the user pool
            var tid = userObject.addUserTag(angular.lowercase(chip));
            userObject.save();

            return {
                id: tid,
                name: angular.lowercase(chip)
            };
        };

        function makeTagObj(tags,id) {
            var tagObj = {
                'id': id,
                'name': tags[id],
                'fname': angular.lowercase(tags[id])
            };
            return tagObj;
        }

        function createFilterForTag(query) {
            var lowercaseQuery = angular.lowercase(query);
            return function filterFn(tag) {
                return (tag.fname.indexOf(lowercaseQuery) != -1);
            };
        }
        function loadTags(alltags) {
            var tags = [];
            _.each(_.keys(alltags), function (id) {
                tags.push(makeTagObj(alltags,id));
            });
            return tags;
        }
        
        vm.help = function(ev) {
            aikumaDialog.help(ev, 'sel_tags');
        };

    };
    tagSelectorController.$inject = ['$scope', 'aikumaDialog'];

    var metadataController = function ($scope, loginService, dataService, $mdDialog) {
        var vm = this;
        vm.defaultdisplay = ["META_DESC", "META_LOC"];
        if (!('details' in $scope.sessionObj.data)) {$scope.sessionObj.data.details = [];}
        if ($scope.sessionObj.data.details.length === 0) {
            $scope.sessionObj.data.details.push(
            {
                name: 'META_DESC',
                icon: 'action:description',
                data: ''
            });
            $scope.sessionObj.data.details.push(
            {
                name: 'META_LOC',
                icon: 'communication:location_on',
                data: ''
            });
            $scope.sessionObj.save();
        }
        vm.details = $scope.sessionObj.data.details;
        
        vm.addMetadata = function(ev) {
            $mdDialog.show({
                controller: newMetaDialogController,
                controllerAs: 'mdxCtrl',
                templateUrl: 'views/templates/dialog-newMeta.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true,
                locals: {
                    sessionObj: $scope.sessionObj
                }
            });
        };
        vm.editMetadata = function(ev, idx) {
            $mdDialog.show({
                controller: editMetaDialogController,
                controllerAs: 'mdyCtrl',
                templateUrl: 'views/templates/dialog-editMeta.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true,
                locals: {
                    metaindex: idx,
                    sessionObj: $scope.sessionObj
                }
            });
        };
        
    };
    metadataController.$inject = ['$scope', 'loginService', 'dataService', '$mdDialog'];

    var newMetaDialogController = function ($mdDialog, sessionObj) {
        var vm = this;
        vm.defaultMeta = [
            {
                name: 'META_CUSTOM',
                icon: 'action:assignment_ind'
            },
            {
                name: 'META_DESC',
                icon: 'action:description'
            },
            {
                name: 'META_LOC',
                icon: 'communication:location_on'
            },
            {
                name: 'META_CITY',
                icon: 'social:location_city'
            },
            {
                name: 'META_CONSENT',
                icon: 'communication:vpn_key'
            }
        ];

        vm.metaD = vm.defaultMeta[0];
        vm.save = function() {
            var detail = {};
            if(vm.metaD.name === 'META_CUSTOM')
                detail.name = vm.customName;
            else
                detail.name = vm.metaD.name;
            detail.icon = vm.metaD.icon;
            detail.data = vm.metaText;
            sessionObj.pushDetail(detail);
            sessionObj.save();
            $mdDialog.hide();
        };
        vm.close = function() {$mdDialog.cancel();};
    };
    newMetaDialogController.$inject = ['$mdDialog', 'sessionObj'];

    var editMetaDialogController = function (metaindex, $mdDialog, sessionObj) {
        var vm = this;
        vm.close = function() {$mdDialog.cancel();};
        vm.metaD = sessionObj.data.details[metaindex];
        if(vm.metaD.name === 'META_CUSTOM')
            vm.customName = vm.metaD.data.name;
        vm.metaText = sessionObj.data.details[metaindex].data;
        vm.save = function() {
            sessionObj.data.details[metaindex].data = vm.metaText;
            sessionObj.save();
            $mdDialog.hide();
        };
        vm.delete = function() {
            sessionObj.data.details.splice(metaindex);
            sessionObj.save();
            $mdDialog.hide();
        };
    };
    editMetaDialogController.$inject = ['metaindex', '$mdDialog', 'sessionObj'];

    var playerController = function ($scope, $attrs) {
        var vm = this;
        vm.wsPlayback = Object.create(WaveSurfer);
        $scope.wavesurfer = vm.wsPlayback;
        vm.loading = true;
        var wsdefaults = {
            container: "#sessionPlayer",
            renderer: "MultiCanvas",
            normalize: true,
            hideScrollbar: false,
            scrollParent: true
        };
        
        if($scope.peaks) {
            wsdefaults.backend = 'MediaElement';
            wsdefaults.minPxPerSec = $scope.peaks[0];
            vm.peakList = $scope.peaks[1];
        }

        vm.options = angular.extend(wsdefaults, $attrs);
        vm.wsPlayback.init(vm.options);
/*
        /!* Minimap plugin *!/
        vm.wsPlayback.initMinimap({
            height: 30,
            waveColor: '#555',
            progressColor: '#999',
            cursorColor: '#999'
        });
*/

        $scope.$watch('source', function(url) {
            if(url) {
                vm.wsPlayback.load(url, vm.peakList);
            }
        });

        vm.wsPlayback.on('play', function () {
            vm.isplaying = true;
        });
        vm.wsPlayback.on('ready', function () {
            vm.loading = false;
            /* Initialize the time line */
            vm.timeline = Object.create(vm.wsPlayback.Timeline);
            vm.timeline.init({
                wavesurfer: vm.wsPlayback,
                normalize: false,
                container: "#session-timeline"
            });
            $scope.$apply();
        });

        vm.wsPlayback.on('pause', function () {
            if (vm.wsPlayback.isPlaying()) {
                    vm.isplaying = true;
            } else {
                    vm.isplaying = false;
            }
        });
        vm.wsPlayback.on('loading', function(progress) {
           vm.wavesurferProgress = progress;
            $scope.$apply();
        });

        vm.wsPlayback.on('finish', function () {
            vm.isplaying = false;
            vm.wsPlayback.seekTo(0);
            $scope.$apply();
        });

        $scope.$on('$destroy', function() {
            vm.wsPlayback.destroy();
        });
        
    };
    playerController.$inject = ['$scope', '$attrs'];

    var langSelectController = function (aikumaService, $scope, aikumaDialog) {
        var vm = this;
        // list of `language` value/display objects
        vm.languages = loadAllx();
        if($scope.langIdList) {
            vm.selectedLanguages = $scope.langIdList;
            vm.selectedLanguages.forEach(function(langData) {
                if(langData.langISO) {
                    var defaultLangStr = $scope.langIdNameMap[langData.langISO];
                    if(!langData.langStr && defaultLangStr) {
                        langData.langStr = defaultLangStr;
                    }   
                }
            });   
        } else {
            vm.selectedLanguages = [];
        }

        vm.querySearch = querySearch;
        vm.selectedItemChange = selectedItemChange;

        function querySearch (query) {
            return query ? vm.languages.filter( createFilterFor(query) ) : vm.languages;
        }
        function selectedItemChange(item,idx) {

        }

        vm.transformChip = function(chip) {
            // If it is an object, it's already a known chip
            if (angular.isObject(chip)) {
                return {
                    langStr: chip.display,
                    langISO: chip.id
                };
            }
            // Otherwise, create a new one
            return {
                langStr: chip,
                langISO: ''
            };
        };


        vm.add = function() {
            $scope.onChange({langIds: vm.selectedLanguages});
        };
        vm.remove = function() {
            vm.add();
        };
        vm.sel = function() {

        };

        function loadAllx() {
            var languages=[];
            aikumaService.getLanguages(function(langs){
                langs.forEach( function(s) {
                    languages.push({
                        value: s.Ref_Name.toLowerCase(),
                        display: s.Ref_Name,
                        id: s.Id
                    });
                });
            });
            return languages;
        }
        /**
         * Create filter function for a query string
         */
        function createFilterFor(query) {
            var lowercaseQuery = angular.lowercase(query);
            return function filterFn(language) {
                return (language.value.indexOf(lowercaseQuery) === 0 || language.id.indexOf(lowercaseQuery) === 0);
            };
        }

        vm.help = function(ev) {
            aikumaDialog.help(ev, 'sel_langs');
        };

    };
    langSelectController.$inject = ['aikumaService', '$scope', 'aikumaDialog'];



    var personSelectorController = function ($sce, $scope, dataService, $mdDialog, aikumaDialog) {
        var vm = this;
        // load all user data from the service and create an array of contacts needed for md-contact-chips
        vm.userObj = $scope.userObj;
        vm.allPeople = loadPeople(vm.userObj.data.people);

        // load the requested session from the service and get the current users
        vm.sessionObj = $scope.sessionObj;
        vm.selectedIds = [];
        if(vm.sessionObj.data.roles) {
            vm.selectedIds = vm.sessionObj.data.roles[$scope.role];
        }
        // onload populate the chips selector with existing (based on ids)
        vm.selectedPeople = _.map(vm.selectedIds, function(id) {
            return makePersonObj(vm.userObj.data.people,id);
        });
        
        vm.filterSelectedPeople = true;
        vm.autocompleteDemoRequireMatch = false;
        vm.selectedItem = null;

        vm.add = function() {
            updateSession();
        };
        vm.rem = function() {
            updateSession();
        };

        vm.transformChip = function(chip) {
            // If it is an object, it's already a known chip
            if (angular.isObject(chip)) {
                return chip;
            }
            // Otherwise, create a new one
            vm.newPerson(chip);
            return null;
        };

        vm.personQuerySearch = function(query) {
            var results = query ?
                vm.allPeople.filter(createFilterForPerson(query)) : [];
            return results;
        };

        function createFilterForPerson(query) {
            var lowercaseQuery = angular.lowercase(query);
            return function filterFn(contact) {
                return (contact.fnames.indexOf(lowercaseQuery) != -1);
            };
        }
        function loadPeople(people) {
            var contacts = [];
            _.each(_.keys(people), function (id) {
                contacts.push(makePersonObj(people,id));
            });
            return contacts;
        }
        function makePersonObj(users,id) {
            // make a string from all of the user's names - we use this for search
            var fnames = angular.lowercase(users[id].names.join(' '));
            // make a pretty string from all of the user's names - we use this for display
            var pname = users[id].names[0];
            if (users[id].names.length > 1) {
                pname += ' (' + users[id].names.slice(1).join() + ')';
            }

            // create a contact object out of these constructed details

            var imageData = vm.userObj.data.files[users[id].imageFileId],
                imageurl = imageData? $sce.trustAsResourceUrl(imageData.url) : 'img/placeholder_avatar.png';

            var personObj = {
                'id': id,
                'pname': pname,
                'fnames': fnames,
                'email': users[id].email,
                'image': imageurl
            };
            return personObj;
        }
        vm.newPerson = function(newname) {
            vm.callDialog('new', newname);
        };
        vm.editPerson = function(chip) {
            if(!vm.userObj.data.files[ vm.userObj.data.people[chip.id].imageFileId ]) {
                vm.userObj.data.people[chip.id].imageFileId = null;
            }
            var imageid = vm.userObj.data.people[chip.id].imageFileId;
            vm.callDialog('edit', chip.pname, imageid, chip.id);
        };

        vm.callDialog = function(mode, newname, iid=null, userid=null) {
            $mdDialog.show({
                locals: {
                    mode: mode,
                    name: newname,
                    sessionObj: $scope.sessionObj,
                    userObj: $scope.userObj,
                    imageId: iid
                },
                controller: newPersonDialogController,
                templateUrl: 'views/templates/person-selector-dialog.html',
                parent: angular.element(document.querySelector('#personSelector')),
                clickOutsideToClose: true
            }).then(function([names, imageId]) {
                if (mode==='new') {
                    var personObj = {
                        names: names,
                        email: '',
                        imageFileId: imageId
                    };
                    // get a new person id and save it all
                    var pid = vm.userObj.addUserPerson(personObj);
                    vm.userObj.save();
                    // push the id to the selected ids
                    vm.selectedIds.push(pid);
                    // refresh the entire list of people
                    vm.allPeople = loadPeople(vm.userObj.data.people);
                    vm.selectedPeople = _.map(vm.selectedIds, function(id) {
                        return makePersonObj(vm.userObj.data.people,id);
                    });
                    // Save the refreshed list of people
                    updateSession();
                }
                if (mode ==='edit') {
                    vm.userObj.data.people[userid].names = names;
                    vm.userObj.data.people[userid].imageFileId = imageId;
                    vm.userObj.save();
                    vm.allPeople = loadPeople(vm.userObj.data.people);
                    vm.selectedPeople = _.map(vm.selectedIds, function(id) {
                        return makePersonObj(vm.userObj.data.people,id);
                    });
                }
            }, function() {
                console.log('cancelled');
            });
        };

        // gets shit from selected people
        function updateSession() {
            var idList = _.pluck(vm.selectedPeople, 'id');
            if(!vm.sessionObj.data.roles) {
                vm.sessionObj.data.roles = {};
            }
            vm.sessionObj.data.roles[$scope.role] = idList;
            vm.sessionObj.save();
        }

        vm.help = function(ev) {
            aikumaDialog.help(ev, 'sel_spks');
        };
    };
    personSelectorController.$inject = ['$sce', '$scope', 'dataService', '$mdDialog', 'aikumaDialog'];

    function newPersonDialogController($scope, $mdDialog, mode, name, sessionObj, userObj, imageId) {
        $scope.mode = mode; // 'edit' or 'new'
        $scope.sessionObj = sessionObj;
        $scope.userObj = userObj;
        $scope.names=[name,''];
        $scope.imageId = imageId;
        $scope.hide = function() {
            $mdDialog.hide();
        };
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
        $scope.process = function() {
            if (_.last($scope.names) != '') {
                $scope.names.push('');
            }
        };
        $scope.answer = function() {
            $scope.names = $scope.names.filter(function(n){ return n !== ''; });
            $mdDialog.hide([$scope.names, $scope.imageId]);
        };
    }
    newPersonDialogController.$inject = ['$scope', '$mdDialog', 'mode', 'name', 'sessionObj', 'userObj', 'imageId'];
    
    // image-id variable is passed in: it can be empty, if directive returns successfully a new or different image id will be set
    var webcamController = function ($scope, $mdDialog, loginService, fileService, $timeout, $q, $log, aikumaService) {
        var vm = this;
        vm.cameraEnabled = false;
        vm.cameraFrozen = false;
        vm.imageSelected = false;

        if ($scope.imageId) {
            vm.imageSaved = true;
        } else {
            vm.imageSaved = false;
        }

        //**dataURL to blob**
        function dataURLtoBlob(dataurl) {
            var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], {type:mime});
        }
        
        Webcam.set({
            // live preview size
            width: 320,
            height: 240,
            // device capture size
            dest_width: 320,
            dest_height: 240,
            // final cropped size
            crop_width: 240,
            crop_height: 240,
            // format and quality
            image_format: 'jpeg',
            jpeg_quality: 90
        });

        vm.enableCamera = function() {
            vm.cameraEnabled = true;
            // we have an ng-if statement which inserts the dom element, which is why we are waiting before calling the webcam
            // This hack was necesssary to stop the webcam from overlaying any other content, even if underlying divs were removed
            $timeout(function(){
                Webcam.attach( '#my_camera' );
            },0);
        };
        vm.toggleFreeze = function() {
            if (vm.cameraFrozen) {
                if (vm.saved) {
                    vm.saved = false;
                }
                Webcam.unfreeze();
                vm.cameraFrozen = false;
            } else {
                Webcam.freeze();
                vm.cameraFrozen = true;
            }
        };

        vm.saveImage = function() {
            vm.saved = true;
            if (vm.cameraEnabled) {
                Webcam.snap( function(data_uri) {
                    var imageblob = dataURLtoBlob(data_uri);
                    vm.writeFile(imageblob);
                } );
            } else {
                vm.writeFile($scope.wcimageFile);
            }
        };

        vm.writeFile = function(blobfile) {
            var fileObjId;
            fileService.createFile(loginService.getLoggedinUserId(), blobfile).then(function(imageUrl) {
                var fileObj = {
                    url: imageUrl,
                    type: blobfile.type
                };
                fileObjId = $scope.userObj.addUserFile(fileObj);
                $scope.imageId = fileObjId;
                return $scope.userObj.save();
            }).then(function() {
                vm.imageSaved = true;
                if (vm.cameraEnabled) {
                    vm.cameraEnabled = false;
                    Webcam.reset();
                }
            }).catch(function(err) {
                if(imageUrl)
                    fileService.deleteFile(imageUrl);
            });
        };

        $scope.$watch('wcimageFile', function(file) {
            if (file && file.type.match('^image/')) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    vm.imageSrc = e.target.result; // used for a preview
                    vm.imageSelected = true;
                    $scope.$apply();
                };
                reader.readAsDataURL(file);
            }
        });

        vm.showOptions = function() {
            return  (!vm.cameraEnabled && !vm.imageSelected && !vm.imageSaved);
        };
        vm.showPreview = function() {
            return ((vm.imageSelected && !vm.cameraEnabled) || vm.imageSaved);
        };

        vm.deleteImage = function() {
            if(vm.imageSaved) {
                fileService.deleteFileWithId(loginService.getLoggedinUserId(), $scope.imageId)
            }
            
            vm.imageSelected = false;
            vm.imageSaved = false;
            $scope.imageId = null;
            vm.cameraFrozen = false;
            if (vm.cameraEnabled) {
                vm.cameraEnabled = false;
                Webcam.reset();
            }
        };

        // Return a source image to view depending on how we got the image
        vm.previewImage = function() {
            if (vm.imageSaved && $scope.userObj.data.files[$scope.imageId]) {
                return $scope.userObj.data.files[$scope.imageId].url;
            }
            if (vm.imageSelected) {
                return vm.imageSrc;
            }
        };



        vm.cancel = function() {
            $mdDialog.cancel();
        };
        $scope.$on('$destroy', function() {
            Webcam.reset();
        });
    };
    webcamController.$inject = ['$scope', '$mdDialog', 'loginService', 'fileService', '$timeout', '$q', '$log', 'aikumaService'];

})();
