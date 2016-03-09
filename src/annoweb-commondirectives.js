/**
 * Created by Mat on 23/02/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-commondirectives', [])
        .directive("ngNavbar", function() {
            return {
                restrict: "E",
                templateUrl: "views/templates/navbar-template.html",
                controller: navController,
                controllerAs: 'navCtrl'
            };
        })
        .directive("ngUserSelector", function() {
            return {
                restrict: "E",
                scope: {
                    userId: '@',
                    sessionId: '@',
                    role: '@'
                },
                templateUrl: "views/templates/user-selector-template.html",
                controller: userSelectorController,
                controllerAs: 'usCtrl'
            };
        })
        .directive("ngTagSelector", function() {
            return {
                restrict: "E",
                scope: {
                    userId: '@',
                    sessionId: '@'
                },
                templateUrl: "views/templates/tag-selector-template.html",
                controller: tagSelectorController,
                controllerAs: 'tsCtrl'
            };
        })
        .directive("ngAnnotationList", function() {
            return {
                restrict: "E",
                templateUrl: "views/templates/annotationList-template.html",
                controller: annotationListController,
                controllerAs: 'alCtrl'
            };
        })
        .directive("ngMetadata", function() {
            return {
                restrict: "E",
                scope: {
                    userId: '@',
                    sessionId: '@'
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
                    foo: '@'
                },
                templateUrl: "views/templates/player-template.html",
                controller: playerController,
                controllerAs: 'pCtrl'
            };
        });

        var annotationListController = function ($scope, $attrs, annoService, AnnowebDialog) {
            var vm = this;
            vm.annotations = annoService.getAnnotations($attrs.userId,$attrs.sessionId);
            vm.addAnno = function (ev) {
                AnnowebDialog.newAnno(ev, $attrs.userId,$attrs.sessionId);

            };


        };
        annotationListController.$inject = ['$scope', '$attrs', 'annoService', 'AnnowebDialog'];

        var navController = function (config, $scope, $location, loginService) {
            var vm = this;
            vm.username = 'anonymous';
            vm.getLoginStatus = loginService.getLoginStatus;
            vm.versionString = config.appName+' '+config.appVersion;
            vm.menu = [
                {
                    class : '',
                    title: 'Getting started',
                    icon: 'action:help',
                    state: 'help'
                },
                {
                    class : '',
                    title: 'Open File',
                    icon: 'file:folder_open',
                    state: 'new'
                },
                {
                    class : '',
                    title: 'Record',
                    icon: 'av:mic',
                    state: 'new'
                },
                {
                    class : '',
                    title: 'Share',
                    icon: 'social:share',
                    state: 'share'
                },
                {
                    class : '',
                    title: 'Settings',
                    icon: 'action:settings',
                    state: 'settings'
                },
                {
                    class : '',
                    title: 'Changes',
                    icon: 'action:change_history',
                    state: 'changes'
                },
                {
                    class : '',
                    title: 'Bug Report',
                    icon: 'action:bug_report',
                    state: 'reportbug'
                }
            ];
            vm.changeState = function(statename) {
                $location.path('/'+statename);
            };

        };
    navController.$inject = ['config', '$scope', '$location', 'loginService'];

    var userSelectorController = function ($scope, loginService, dataService) {
        var vm = this;
        
        // load all user data from the service and create an array of contacts needed for md-contact-chips
        var userdata;
        dataService.get('user', $scope.userId).then(function(userObj) {
            userdata = userObj.data;
            vm.allPeople = loadPeople(userdata.people);
            vm.personQuerySearch = function(query) {
                var results = query ?
                    vm.allPeople.filter(createFilterForPerson(query)) : [];
                return results;
            };
        
            // load the requested session from the service and get the current users
            return dataService.get('session', $scope.sessionId);
            
        }).then(function(sessionObj) {
            var selectedIds = [];
            if(sessionObj.data.roles) {
                selectedIds = sessionObj.data.roles[$scope.role];
            }
            
            // onload populate the chips selector with existing (based on ids)
            $scope.selectedPeople = _.map(selectedIds, function(id) {
                return makePersonObj(userdata.people,id);
            });
            
            // ordinary watch and ng-change don't work.
            $scope.$watchCollection('selectedPeople', function() {
                var idList = _.pluck($scope.selectedPeople, 'id');
                if(!sessionObj.data.roles)
                    sessionObj.data.roles = {};
                sessionObj.data.roles[$scope.role] = idList;
                sessionObj.save();
            });
        });
        

        vm.placeholder = "Add speakers";
        vm.secondaryPlaceholder = "Add more";
        vm.filterSelectedPeople = true;

        function makePersonObj(users,id) {
            // make a string from all of the user's names - we use this for search
            var fnames = angular.lowercase(users[id].names.join(' '));
            // make a pretty string from all of the user's names - we use this for display
            var pname = users[id].names[0];
            if (users[id].names.length > 1) {
                pname += ' (' + users[id].names.slice(1).join() + ')';
            }
            
            // create a contact object out of these constructed details
            var personObj = {
                'id': id,
                'pname': pname,
                'fnames': fnames,
                'email': users[id].email,
                'image': userdata.files[users[id].imageFileId].url
            };
            return personObj;
        }

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

    };
    userSelectorController.$inject = ['$scope', 'loginService', 'dataService'];

    var tagSelectorController = function ($scope, loginService, dataService) {
        var vm = this;
        
        // load all user data from the service and create an array of contacts needed
        var userObject;
        dataService.get('user', $scope.userId).then(function(userObj) {
            userObject = userObj;
            vm.allTags = loadTags(userObject.data.tags);
            vm.tagQuerySearch = function(query) {
                var results = query ?
                    vm.allTags.filter(createFilterForTag(query)) : [];
                return results;
            };
            
            // load the requested session from the service and get the currenttags
            return dataService.get('session', $scope.sessionId);
        }).then(function(sessionObj) {
            var selectedTagIds = sessionObj.data.tagIds;
            
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
            
            // Sangyeop: should this really be nested inside this 'then'?
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
        });

        vm.placeholder = "Add tags";
        vm.secondaryPlaceholder = "Add more";

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

    var metadataController = function ($scope, loginService, dataService, AnnowebDialog) {
        var vm = this;
        dataService.get('session', $scope.sessionId).then(function(sessionObj){
            vm.sessionData = sessionObj.data;
        });

        vm.addMetadata = function(ev) {
            AnnowebDialog.newMetdata();
        };

        vm.defaultdisplay = ['Description','Location'];

        vm.details = [
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
        ];

    };
    metadataController.$inject = ['$scope', 'loginService', 'dataService', 'AnnowebDialog'];

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

        /* Initialize the time line */
        vm.timeline = Object.create(vm.wsPlayback.Timeline);
        vm.timeline.init({
            wavesurfer: vm.wsPlayback,
            normalize: false,
            container: "#session-timeline"
        });
        /* Minimap plugin */
        vm.wsPlayback.initMinimap({
            height: 40,
            waveColor: '#555',
            progressColor: '#999',
            cursorColor: '#999'
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

        // listen for the event in the relevant $scope
        $scope.$on('loadPlayer', function (event, data) {
            console.log(data); // 'Data to send'
            if (data.url != '') {
                vm.wsPlayback.load(data.url);
            }
        });
    };
    playerController.$inject = ['$scope', '$attrs'];

})();
