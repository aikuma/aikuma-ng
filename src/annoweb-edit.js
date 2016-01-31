/**
 * Created by Mat on 31/01/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-edit', [])
        .directive('ngMenubar', function() {
            return {
                restrict: "E",
                templateUrl: "views/edit-menubar.html",
                controller: menuController,
                controllerAs: 'ctrl'
            };
        })
        .directive("ngAnnotation", function() {
            return {
                restrict: "E",
                templateUrl: "views/edit-tab-annotate.html",
                controller: annotationController,
                controllerAs: 'aeditCtrl'
            };
        })
        .directive("ngMetadata", function() {
            return {
                restrict: "E",
                templateUrl: "views/edit-tab-metadata.html",
                controller: MetadataController,
                controllerAs: 'xxx'
            };
        })
        .directive("ngChanges", function() {
            return {
                restrict: "E",
                templateUrl: "views/edit-tab-changes.html"
            };
        });

    /* Controller functions here to avoid in-line functions in the directives */

    function menuController($mdDialog, $scope, AnnowebService) {
        var vm = this;
        vm.settings = {
            printLayout: true,
            showRuler: true,
            showSpellingSuggestions: true,
            presentationMode: 'edit'
        };
        vm.sampleAction = function(name, ev) {
            if (name === 'Open') vm.fileselect();
            else {
                $mdDialog.show($mdDialog.alert()
                    .title(name)
                    .textContent('You triggered the "' + name + '" action')
                    .ok('Great')
                    .targetEvent(ev)
                );
            }
        };
        /* A hack to click on the file element (called from menu etc) - some parts of web-apps are still kludgy */
        vm.fileselect = function() {
            setTimeout(function() {
                document.getElementById('fileinput').click();
                vm.clicked = true;
            }, 0);
        };
        /* If that's worked then the file selector value changes. Ask the service to load the file handle */
        $scope.$watch('file', function (newVal) {
            if (newVal) { AnnowebService.loadfile(newVal); }
        });
    }

    function annotationController($scope, AnnowebService, AnnowebDialog) {
        var vm = this;
        $scope.$on('regions_loaded', function() {
            console.log('annotation controller received msg.');
            console.log(AnnowebService.regionlist);
            vm.regionlist = AnnowebService.regionlist;
            if (vm.regionlist.length) vm.editable = true;
            $scope.$apply();
        });
        vm.addanno = function(ev) {
            AnnowebDialog.newanno();
        };
        $scope.$on('initannotations', function() {
            vm.editable = true;
            vm.alist = AnnowebService.annotationlist;
        });
        $scope.$on('initregions', function() {
            vm.editable = true;
            vm.regionlist = AnnowebService.regionlist;
        });
    }

    function MetadataController($scope, AnnowebService) {
        $scope.today = function() {
            $scope.dt = new Date();
        };
        $scope.today();

        $scope.clear = function() {
            $scope.dt = null;
        };

        $scope.open1 = function() {
            $scope.popup1.opened = true;
        };

        $scope.setDate = function(year, month, day) {
            $scope.dt = new Date(year, month, day);
        };

        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };

        $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
        $scope.format = $scope.formats[0];
        $scope.altInputFormats = ['M!/d!/yyyy'];

        $scope.popup1 = {
            opened: false
        };

        $scope.popup2 = {
            opened: false
        };


        $scope.getDayClass = function(date, mode) {
            if (mode === 'day') {
                var dayToCheck = new Date(date).setHours(0,0,0,0);

                for (var i = 0; i < $scope.events.length; i++) {
                    var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

                    if (dayToCheck === currentDay) {
                        return $scope.events[i].status;
                    }
                }
            }
            return '';
        };
        $scope.tags = ["Needs approval", "Unsolicited", "Narrative"];
    }


})();
