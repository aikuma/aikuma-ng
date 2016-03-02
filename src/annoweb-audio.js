/**
 * Created by Mat on 2/03/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-audio', [])
        .directive("ngRespeak", function() {
            return {
                restrict: "E",
                templateUrl: "views/templates/respeak-template.html",
                controller: respeakController,
                controllerAs: 'rCtrl'
            };
        });
    var respeakController = function ($scope, $attrs, annoService) {
        var vm = this;
        vm.sessionData = {};
        vm.sessionData.name = 'The Rotunda Conversation';
        vm.sessionData.id = '1';
        vm.wsPlayback = Object.create(WaveSurfer);
        vm.wsPlayback.init({
            container: "#respeakPlayback",
            normalize: true,
            scrollParent: true
        });
        vm.wsPlayback.load('media/elan-example1.mp3');

        var playcontext = new AudioContext();


        vm.wsRecord = Object.create(WaveSurfer);
        vm.wsRecord.init({
            container: "#respeakRecord",
            normalize: true,
            scrollParent: true
        });

    };
    respeakController.$inject = ['$scope', '$attrs', 'annoService'];

})();