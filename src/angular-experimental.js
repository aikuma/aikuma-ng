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
                    langNameList: '=',
                    sessionId: '@'
                },
                templateUrl: "views/templates/annotations-template.html",
                controller: annotationsController,
                controllerAs: 'annoCtrl'
            };
        });

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

        vm.placeholder = "Add speakers";
        vm.secondaryPlaceholder = "Add more";
        vm.filterSelectedPeople = true;
        vm.autocompleteDemoRequireMatch = false;
        vm.selectedItem = null;
        vm.searchText = null;

        vm.add = function() {
            console.log('add');
            updateSession();
        };
        vm.rem = function() {
            console.log('remove'); 
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
                type: convertType(annoData.type),
                langISO: annoData.source.langIds[0],
                langStr: $scope.langNameList[ annoData.source.langIds[0] ]
            };
        });
        
        function convertType(typeStr) {
            switch(typeStr) {
                case 'ANNO_ANNO':
                    return 'anno_annotation';
                case 'ANNO_TRANS':
                    return 'anno_translation';
                case 'ANNO_COMM':
                    return 'anno_comments';
                case 'ANNO_OTH':
                    return 'anno_other';
                case 'anno_annotation':
                    return 'ANNO_ANNO';
                case 'anno_translation':
                    return 'ANNO_TRANS';
                case 'anno_comments':
                    return 'ANNO_COMM';
                case 'anno_other':
                    return 'ANNO_OTH';
            }
        }
        
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
                        type: convertType(anno.type),
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
