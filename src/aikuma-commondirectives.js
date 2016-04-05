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
                    source: '@'
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
        // This is bound to the <body> element to pass key events to the keyService. Intended for low-level handling so
        // we can detect keys held-down (which angular hotkeys doesn't do) and left/right shift/ctrl which no key library does!
        .directive('keyFocus', ['keyService', function(keyService){
            return {
                restrict: 'A',
                link: function(scope, element, attr){
                    element.bind('keydown', function(event) {
                        if (!event.repeat) {keyService.handleKey(event);} // ignore repeated keys
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
        .directive("ngAnnotations", function() {
            return {
                restrict: "E",
                scope: {
                    annotationList: '=',
                    langIdNameMap: '=',
                    sessionId: '@'
                },
                templateUrl: "views/templates/annotations-template.html",
                controller: annotationsController,
                controllerAs: 'annoCtrl'
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
        ]);

        var topbarController = function ($scope, $translate, config, loginService, aikumaDialog) {
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
        };
        topbarController.$inject = ['$scope', '$translate', 'config', 'loginService', 'aikumaDialog'];

        var navController = function (config, $scope, $translate, $location, loginService, dataService, fileService, aikumaDialog) {
            var vm = this;
            vm.languages = config.languages;
            
            vm.getLoginStatus = loginService.getLoginStatus;
            vm.versionString = config.appVersion;
            
            $scope.$watch(vm.getLoginStatus, function(isLoggedin) {
                if(isLoggedin) {
                    dataService.get('user', loginService.getLoggedinUserId()).then(function(userObj) {
                        vm.currentUserName = function() { return userObj.data.names[0]; };
                    });
                } else {
                    vm.LOGINAS = '';
                    vm.currentUserName = function() { return ''; };
                }
            });
            
            vm.login = function() {
                
            };
            
            vm.logout = function() {
                loginService.logout();
                $location.path('/');
            };
            
            vm.menu = [
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
                    icon: 'action:bug_report',
                    state: 'reportbug',
                }
            ];
            
            vm.changeState = function(statename) {
                if(statename !== 'import') {
                    $location.path('/'+statename);
                }
            };

            vm.openAbout = function(ev) {
                aikumaDialog.help(ev, 'about');
            };
            // When 'Open File' is pressed
            $scope.$watch('file', function (file) {
                if (file && file.type.match('^audio/')) { 
                    fileService.setTempObject(file);
                    $location.path('/new');
                }
            });

        };
    navController.$inject = ['config', '$scope', '$translate', '$location', 'loginService', 'dataService', 'fileService', 'aikumaDialog'];

    var tagSelectorController = function ($scope, loginService, dataService) {
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

    };
    tagSelectorController.$inject = ['$scope', 'loginService', 'dataService'];

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

        var wsdefaults = {
            container: "#sessionPlayer",
            normalize: true,
            hideScrollbar: false,
            scrollParent: true
        };

        vm.options = angular.extend(wsdefaults, $attrs);
        vm.wsPlayback.init(vm.options);
        /* Minimap plugin */
        vm.wsPlayback.initMinimap({
            height: 30,
            waveColor: '#555',
            progressColor: '#999',
            cursorColor: '#999'
        });
        /* Initialize the time line */
        vm.timeline = Object.create(vm.wsPlayback.Timeline);
        vm.timeline.init({
            wavesurfer: vm.wsPlayback,
            normalize: false,
            container: "#session-timeline"
        });


        vm.wsPlayback.on('play', function () {
            vm.isplaying = true;
        });

        vm.wsPlayback.on('pause', function () {
            if (vm.wsPlayback.isPlaying()) {
                    vm.isplaying = true;
            } else {
                    vm.isplaying = false;
            }
        });


        vm.wsPlayback.on('finish', function () {
            vm.isplaying = false;
            vm.wsPlayback.seekTo(0);
            $scope.$apply();
        });

        $scope.$on('$destroy', function() {
            vm.wsPlayback.destroy();
        });
        
        $scope.$watch('source', function(url) {
            if(url) {
                vm.wsPlayback.load(url);
            }
        });
        
    };
    playerController.$inject = ['$scope', '$attrs'];

    var langSelectController = function (aikumaService, $scope, $attrs) {
        var vm = this;
        // list of `language` value/display objects
        vm.languages = loadAllx();
        if($scope.langIdList) {
            vm.selectedLanguages = $scope.langIdList.map(function(id) {
                var langStr = $scope.langIdNameMap[id];
                if(langStr) {
                    return {
                        langStr: langStr,
                        langISO: id
                    };
                } else {
                    return {
                        langStr: id,
                        langISO: ''
                    };
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
            console.log(chip);
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
            var langIds = vm.selectedLanguages.map(function(langViewModel) {
                return langViewModel.langISO? langViewModel.langISO : langViewModel.langStr;
            });
            $scope.onChange({langIds: langIds});
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
                return (language.value.indexOf(lowercaseQuery) === 0);
            };
        }
    };
    langSelectController.$inject = ['aikumaService', '$scope', '$attrs'];



    var personSelectorController = function ($scope, dataService, $mdDialog) {
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
        vm.sel = function() {console.log('select');};

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

            var imageurl = '';
            if (users[id].imageFileId) {
                imageurl = vm.userObj.data.files[users[id].imageFileId].url;
            } else {
                imageurl = 'img/placeholder_avatar.png';
            }

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
            $mdDialog.show({
                locals: {
                    name: newname
                },
                controller: newPersonDialogController,
                templateUrl: 'views/templates/person-selector-dialog.html',
                parent: angular.element(document.querySelector('#personSelector')),
                clickOutsideToClose: true
            }).then(function(names) {
                var personObj = {
                    names: names,
                    email: '',
                    imageFileId: null
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
            console.log(vm.sessionObj.data.roles[$scope.role]);
            vm.sessionObj.save();
        }
    };
    personSelectorController.$inject = ['$scope', 'dataService', '$mdDialog'];


    function newPersonDialogController($scope, $mdDialog, name) {
        $scope.names=[name,''];
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
            $scope.names = $scope.names.filter(function(n){ return n != ''; });
            $mdDialog.hide($scope.names);
        };
    }
    newPersonDialogController.$inject = ['$scope', '$mdDialog', 'name'];

    var annotationsController = function ($location, $scope, $translate, aikumaService, $mdDialog, $mdToast, $q, loginService, dataService) {
        var vm = this;
        vm.annotations = $scope.annotationList.map(function(annoData) {
            return {
                id: annoData._ID,
                type: angular.uppercase(annoData.type),
                langISO: annoData.source.langIds[0],
                langStr: $scope.langIdNameMap[ annoData.source.langIds[0] ]
            };
        });

        vm.addAnno = function (ev) {
            $mdDialog.show({
                controller: newAnnotationController,
                controllerAs: 'dCtrl',
                templateUrl: 'views/templates/dialog-newAnnotation.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true,
                locals: {thisScope: $scope}
            }).then(function(annotations){
                var promises = [];
                annotations.forEach(function(anno) {
                    var annotationData = {
                        names: [],  // need UI
                        type: angular.lowercase(anno.type),
                        creatorId: loginService.getLoggedinUserId(),
                        source: {
                            created: Date.now(),
                            langIds: [anno.langISO]
                        },
                        segment: {}
                    };

                    var promise = dataService.setSecondary(loginService.getLoggedinUserId(), $scope.sessionId, annotationData);
                    promises.push(promise);
                    $scope.annotationList.push(annotationData);
                });

                $q.all(promises).then(function(res) {
                    annotations.forEach(function(anno, index) {
                        anno.id = res[index][0];
                        vm.annotations.push(anno);
                    });
                });

            }, function() {
                console.log('cancelled');
            });
        };

        vm.deleteAnno = function(annoIdx,ev) {
            $translate(["ANNO_DELCONF1", "ANNO_DELCONF2", "ANNO_DELNO", "ANNO_DELYES"]).then(function (translations) {
                var confirm = $mdDialog.confirm()
                    .title(translations.ANNO_DELCONF1)
                    .textContent(translations.ANNO_DELCONF2)
                    .targetEvent(ev)
                    .ok(translations.ANNO_DELYES)
                    .cancel(translations.ANNO_DELNO);
                $mdDialog.show(confirm).then(function () {
                    dataService.remove('secondary', vm.annotations[annoIdx].id).then(function() {
                        vm.annotations.splice(annoIdx, 1);
                        $scope.annotationList.splice(annoIdx, 1);
                    });

                }, function () {
                    $mdToast.show(
                        $mdToast.simple()
                            .parent(angular.element( document.querySelector( '#annotationList' ) ))
                            .hideDelay(2000)
                            .position("top right")
                            .textContent('Cluck cluck cluck!')
                    );
                });
            });
        };
        vm.editAnno = function(annoIdx) {
            $location.path('/session/'+$scope.sessionId+'/annotate/' + vm.annotations[annoIdx].id);
        };

    };
    annotationsController.$inject = ['$location', '$scope', '$translate', 'aikumaService', '$mdDialog', '$mdToast', '$q', 'loginService', 'dataService'];

    var newAnnotationController = function ($mdDialog, $timeout, $q, $log, aikumaService) {
        var vm = this;
        vm.types = ['ANNO_ANNO','ANNO_TRANS','ANNO_COMM','ANNO_OTH'];
        vm.choices = [{type:'ANNO_ANNO'}];
        vm.hide = function() {
            $mdDialog.hide();
        };
        vm.cancel = function() {
            $mdDialog.cancel();
        };
        vm.answer = function(answer) {
            $mdDialog.hide(answer);
        };
        // list of `language` value/display objects
        vm.languages = loadAllx();

        vm.querySearch   = querySearch;
        vm.selectedItemChange = selectedItemChange;
        vm.invalid = true;
        vm.addNewChoice = function() {
            vm.choices.push({});
        };
        vm.removeChoice = function(idx) {
            vm.choices.splice(idx);
        };
        vm.makeAnno = function() {
            var annos = [];
            vm.choices.forEach(function(choice){
                if (choice.searchText) {
                    if (!choice.type) {choice.type='Unknown';}
                    annos.push({
                        langStr: choice.searchText,
                        langISO: choice.ISO,
                        type: choice.type
                    });
                }
            });
            $mdDialog.hide(annos);
        };
        vm.newLanguage = function(language) {
        };

        vm.isDisabled = function(item) {
            return vm.options[item].disabled;
        };

        vm.lastFilled = function() {
            var lastitem = _.last(vm.choices);
            if (lastitem.searchText && lastitem.type) {
                return true;
            } else {
                return false;
            }
        };

        function querySearch (query) {
            return query ? vm.languages.filter( createFilterFor(query) ) : vm.languages;
        }
        function selectedItemChange(item,idx) {
            if (item.id) {vm.choices[idx].ISO = item.id;}
        }

        function loadAllx() {
            var languages=[];
            aikumaService.languages.forEach( function(s) {
                languages.push({
                    value: s.Ref_Name.toLowerCase(),
                    display: s.Ref_Name,
                    id: s.Id
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
                return (language.value.indexOf(lowercaseQuery) === 0);
            };
        }
    };
    newAnnotationController.$inject = ['$mdDialog', '$timeout', '$q', '$log', 'aikumaService'];

})();
