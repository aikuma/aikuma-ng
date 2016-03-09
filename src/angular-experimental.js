/**
 * Created by Mat on 9/03/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-experimental', [])
        .directive("ngPersonSelector", function() {
            return {
                restrict: "E",
                scope: {
                    userId: '@',
                    sessionId: '@',
                    role: '@'
                },
                templateUrl: "views/templates/person-selector-template.html",
                controller: personSelectorController,
                controllerAs: 'psCtrl'
            };
        });

    var personSelectorController = function ($scope, dataService, $mdDialog) {
        var vm = this;
        // load all user data from the service and create an array of contacts needed for md-contact-chips

        dataService.get('user', $scope.userId).then(function(userObj) {
            vm.userData = userObj;
            vm.allPeople = loadPeople(vm.userData.data.people);
            // load the requested session from the service and get the current users
            return dataService.get('session', $scope.sessionId);

        }).then(function(sessionObj) {
            vm.sessionData = sessionObj;
            vm.selectedIds = [];
            if(sessionObj.data.roles) {
                vm.selectedIds = sessionObj.data.roles[$scope.role];
            }
            // onload populate the chips selector with existing (based on ids)
            vm.selectedPeople = _.map(vm.selectedIds, function(id) {
                return makePersonObj(vm.userData.data.people,id);
            });
        });

        vm.placeholder = "Add speakers";
        vm.secondaryPlaceholder = "Add more";
        vm.filterSelectedPeople = true;
        vm.autocompleteDemoRequireMatch = false;
        vm.selectedItem = null;
        vm.searchText = null;

        vm.add = function() {console.log('add');};
        vm.rem = function() {console.log('remove');};
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
            var personObj = {
                'id': id,
                'pname': pname,
                'fnames': fnames,
                'email': users[id].email,
                'image': vm.userData.data.files[users[id].imageFileId].url
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
                    imageFileId: '1'
                };
                // get a new person id and save it all
                var pid = vm.userData.addUserPerson(personObj);
                vm.userData.save();
                // push the id to the selected ids
                vm.selectedIds.push(pid);
                // refresh the entire list of people
                vm.allPeople = loadPeople(vm.userData.data.people);
            }, function() {
                console.log('cancelled');
            });
        };
        // gets shit from selected people
        function updateSession() {
            var idList = _.pluck($scope.selectedPeople, 'id');
            if(!vm.sessionData.data.roles)
                vm.sessionData.data.roles = {};
            vm.sessionData.data.roles[$scope.role] = idList;
            vm.sessionData.save();
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
        $scope.answer = function(answer) {
            $scope.names = $scope.names.filter(function(n){ return n != ''; });
            $mdDialog.hide($scope.names);
        };
    }
    newPersonDialogController.$inject = ['$scope', '$mdDialog', 'name'];

})();
