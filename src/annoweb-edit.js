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
                controllerAs: 'ctrl'
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
        })
        .directive("ngEditHotkeys", function() {
            return {
                restrict: "E",
                controller: editHotkeyController
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

    function annotationController($scope, AnnowebService, AnnowebDialog, hotkeys) {
        var vm = this;
        vm.cur = 0;
        vm.selectedTime = 0;
        vm.regions = [];
        vm.active = {};
        vm.repeat = false;
        vm.addanno = function(ev) {
            AnnowebDialog.newanno();
        };
        $scope.$on('regionsloaded', function() {
            vm.regions = AnnowebService.regions;
            vm.annolist = AnnowebService.annotationlist;
            vm.editable = true;
        });
        vm.previous = function() {
            if (vm.cur > 0) {vm.cur--;}
            vm.selectedTime = vm.cur;
            vm.regions[vm.cur].r.play();
        };
        vm.next = function() {
            if (vm.cur < (vm.regions.length-1)) {vm.cur++;}
            vm.selectedTime = vm.cur;
            vm.regions[vm.cur].r.play();
        };
        $scope.$watch('ctrl.selectedTime', angular.bind(vm, function(timeIndex) {
            vm.cur = timeIndex;
            if (vm.regions.length) {vm.regions[vm.cur].r.play();}
        }));
        vm.dataEnter = function() {
            console.log(vm.text);
            vm.text = '';
            vm.next();
        };

        vm.tstr = function(secs) {
            var date = new Date(null);
            date.setSeconds(secs);
            // retrieve each value individually - returns h:m:s
            if (date.getUTCHours() != 0) {
                return date.getUTCHours() + ':' + date.getUTCMinutes() + ':' +  date.getUTCSeconds() + '.' + (secs % 1).toFixed(1)*10;
            } else {
                return date.getUTCMinutes() + ':' +  date.getUTCSeconds() + '.' + (secs % 1).toFixed(1)*10;
            }

        };
        vm.toggleactive = function() {
            vm.repeat = !vm.repeat;
        };
        $scope.$on('next', function() {
            vm.next();
        });
        $scope.$on('previous', function() {
            vm.previous();
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

    /* This controller is called by a directive with ng-if watching the selected tab. The purpose of this is
    to create the $scope when the annotation tab is selected and destroy it when the user navigates away. In this way
    the hotkeys are accessible only when <ng-edit-hotkeys> is visible in the DOM, e.g. when the annotation tab is
    selected. Note: We maintain wavesurfer on the DOM when other tags are selected. Rebuilding it would be slow.
     */
    function editHotkeyController ($rootScope, $scope, hotkeys, AnnowebService) {
        console.log("edit keys run");
        hotkeys.bindTo($scope)
            .add({
                combo: 'ctrl+space',
                description: 'Toggle playback',
                callback: function() {AnnowebService.wavesurfer.playPause();}
            })
            .add({
                combo: 'ctrl+left',
                description: 'Go to previous region',
                callback: function() {$rootScope.$broadcast('previous');}
            })
            .add({
                combo: 'ctrl+right',
                description: 'Go to next region',
                callback: function() {$rootScope.$broadcast('next');}
        });

    }


})();
