/**
 * Created by Mat on 4/02/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-annotation', [])
        .directive("ngAnnotator", function() {
            return {
                restrict: "E",
                templateUrl: "views/templates/annotate-template.html",
                controller: annotationController,
                controllerAs: 'axCtrl'
            };
        })
        .directive("ngTranscript", function() {
            return {
                restrict: "E",
                templateUrl: "views/templates/transcript-template.html",
                controller: transcriptController,
                controllerAs: 'tCtrl'
            };
        });

    // The new annotation controller. Uses the new annoService instead of AnnowebService
    var annotationController = function ($scope, loginService, audioService, dataService, fileService) {
        var vm = this;
        vm.userObj = $scope.userObj;
        vm.sessionObj = $scope.sessionObj;

    };
    annotationController.$inject = ['$scope', 'loginService', 'audioService', 'dataService', 'fileService'];

    var transcriptController = function ($scope) {
        var vm = this;
        vm.regions = AnnowebService.regions;
        vm.alist = AnnowebService.annotationlist;
        vm.ws = AnnowebService.wavesurfer;
        vm.cur = AnnowebService.currentanno;
    };
    transcriptController.$inject = ['$scope'];

})();
