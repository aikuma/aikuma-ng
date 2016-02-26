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
                templateUrl: "views/templates/user-selector-template.html",
                controller: userSelectorController,
                controllerAs: 'usCtrl'
            };
        })
        .directive("ngTagSelector", function() {
            return {
                restrict: "E",
                templateUrl: "views/templates/tag-selector-template.html",
                controller: tagSelectorController,
                controllerAs: 'tsCtrl'
            };
        });

        var navController = function ($scope, $state, ezfb) {
            var vm = this;
            vm.username = 'anonymous person';
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
                $state.go(statename);
            };

            updateFB();

            ezfb.Event.subscribe('auth.statusChange', function (statusRes) {
                $scope.loginStatus = statusRes;
                updateFB();

            });

            /**
             * Update api('/me') result
             */
            function updateFB () {
                ezfb.getLoginStatus()
                    .then(function (res) {
                        vm.loginStatus = res;
                        return ezfb.api('/me');
                    })
                    .then(function (me) {
                        vm.me = me;
                        if (vm.loginStatus.status=='connected') {
                            vm.username = vm.me.name;
                        } else {
                            vm.username = 'anonymous person';
                        }
                    });
            }
            vm.login = function () {
                ezfb.login(null, {scope: 'email'});
            };

            vm.logout = function () {
                ezfb.logout();
            };

        };
    navController.$inject = ['$scope', '$state', 'ezfb'];

    var userSelectorController = function ($scope, $attrs, mockService) {
        var vm = this;
        // load all user data from the service and create an array of contacts needed for md-contact-chips
        var userdata = mockService.getUserData($attrs.userId);
        vm.allPeople = loadPeople(userdata.people);
        // load the requested session from the service and get the current users
        var sessiondata = mockService.getSessionData($attrs.userId, $attrs.sessionId);
        var selectedIds = sessiondata.roles[$attrs.role];

        // onload populate the chips selector with existing (based on ids)
        $scope.selectedPeople = _.map(selectedIds, function(id) {
            return makePersonObj(userdata.people,id);
        });

        // ordinary watch and ng-change don't work.
        $scope.$watchCollection('selectedPeople', function() {
            var idList = _.pluck($scope.selectedPeople, 'id');
            mockService.setSessionPersonRoles($attrs.userId, $attrs.sessionId, $attrs.role, idList);
        });

        vm.placeholder = "Add speakers";
        vm.secondaryPlaceholder = "Add more";
        vm.filterSelectedPeople = true;

        vm.personQuerySearch = function(query) {
            var results = query ?
                vm.allPeople.filter(createFilterForPerson(query)) : [];
            return results;
        };

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
                'image': mockService.getFileURL($attrs.userId, users[id].imageFileId)
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
    userSelectorController.$inject = ['$scope', '$attrs', 'mockService'];

    var tagSelectorController = function ($scope, $attrs, mockService) {
        var vm = this;
        // load all user data from the service and create an array of contacts needed
        var userdata = mockService.getUserData($attrs.userId);
        vm.allTags = loadTags(userdata.tags);
        // load the requested session from the service and get the currenttags
        var sessiondata = mockService.getSessionData($attrs.userId, $attrs.sessionId);
        var selectedTagIds = sessiondata.tags;

        // onload populate the chips selector with existing (based on ids)
        $scope.selectedTags = _.map(selectedTagIds, function(id) {
            return makeTagObj(userdata.tags,id);
        });

        // ordinary watch and ng-change don't work.
        $scope.$watchCollection('selectedTags', function() {
            sessiondata.tags = _.pluck($scope.selectedTags, 'id');
        });

        vm.placeholder = "Add tags";
        vm.secondaryPlaceholder = "Add more";

        vm.tagQuerySearch = function(query) {
            var results = query ?
                vm.allTags.filter(createFilterForTag(query)) : [];
            return results;
        };

        function makeTagObj(tags,id) {
            var tagObj = {
                'id': id,
                'name': tags[id],
                'fname': angular.lowercase(tags[id])
            };
            return tagObj;
        }

        vm.transformChip = function(chip) {
            // If it is an object, it's already a known chip
            if (angular.isObject(chip)) {
                return chip;
            }
            // Otherwise, create a new one - first add a new tag to the user pool
            var tid = mockService.addUserTag($attrs.userId,angular.lowercase(chip));
            return {
                id: tid,
                name: angular.lowercase(chip)
            };
        };

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
    tagSelectorController.$inject = ['$scope', '$attrs', 'mockService'];

})();
