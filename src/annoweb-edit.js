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
                controllerAs: 'mbCtrl'
            };
        })
        .directive('ngAnnoTab', function() {
            return {
                restrict: "E",
                templateUrl: "views/edit-tab-annotate.html",
                controller: annoTabController,
                controllerAs: 'atCtrl'
            };
        })

        .directive('focusOn', function() {
            return function(scope, elem, attr) {
                scope.$on(attr.focusOn, function(e) {
                    elem[0].focus();
                });
            };
        });

    /* Controller functions here to avoid in-line functions in the directives */

    var menuController = function($mdDialog, $scope, AnnowebService) {
        var vm = this;
        vm.settings = {
            printLayout: true,
            showRuler: true,
            showSpellingSuggestions: true,
            presentationMode: 'edit'
        };
        vm.sampleAction = function(name, ev) {
            if (name === 'Open') {vm.fileselect();}
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
    };
    menuController.$inject = ['$mdDialog', '$scope', 'AnnowebService'];

    var annoTabController = function ($scope, AnnowebService, AnnowebDialog) {
        var vm = this;
        vm.editable = false;
        vm.addanno = function () {
            AnnowebDialog.newanno();
        };
        $scope.$on('regionsloaded', function () {
            vm.editable = true;
            vm.mode = null;
            if (AnnowebService.annotationoptions.continuous) {
                vm.mode = 'continuous';
            } else {
                vm.mode = 'complex';
            }
        });
    };
    annoTabController.$inject = ['$scope', 'AnnowebService', 'AnnowebDialog'];


})();
