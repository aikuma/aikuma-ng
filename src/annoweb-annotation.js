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
                scope: {
                    userObj: '=',
                    sessionObj: '=',
                    source: "@"
                },
                controller: annotationController,
                controllerAs: 'axCtrl'
            };
        })
        .directive("ngTranscript", function() {
            return {
                restrict: "E",
                templateUrl: "views/templates/transcript-template.html",
                scope: {
                    userObj: '=',
                    sessionObj: '=',
                    source: "@"
                },
                controller: transcriptController,
                controllerAs: 'tCtrl'
            };
        });

    // The new annotation controller.
    var annotationController = function ($scope, keyService) {
        var vm = this;
        vm.userObj = $scope.userObj;
        vm.sessionObj = $scope.sessionObj;

        var playKeyCode = 17;   // control key (16 is shift)

        //
        // Set up Wavesurfer
        //
        var wsAnnotate = WaveSurfer.create({
            backend: "WebAudio",
            container: "#annotatePlayback",
            normalize: true,
            hideScrollbar: false,
            scrollParent: true
        });

        /* Initialize the time line */
        var timeline = Object.create(wsAnnotate.Timeline);
        timeline.init({
            wavesurfer: wsAnnotate,
            container: "#annotate-timeline"
        });
        /* Minimap plugin */
        var miniMap = wsAnnotate.initMinimap({
            height: 40,
            waveColor: '#555',
            progressColor: '#999',
            cursorColor: '#999'
        });
        wsAnnotate.load($scope.source);
        wsAnnotate.on('ready', function(){
            // this is a hack to resize the minimap when we resize wavesurfer, it depends on any-rezize-event.js
            var wavesurferelement = document.getElementById('annotatePlayback');
            wavesurferelement.addEventListener('onresize', _.debounce(function(){
                    miniMap.render();
                    miniMap.progress(miniMap.wavesurfer.backend.getPlayedPercents());
                }, 25)
            );
            keyService.regKey(playKeyCode,'keydown', function(ev) {vm.playKeyDown(true);});
            keyService.regKey(playKeyCode,'keyup', function(ev) {vm.playKeyUp(true);});
        });

        vm.playKeyDown = function(nokey) {
            wsAnnotate.play();
        };
        vm.playKeyUp = function(nokey) {
            wsAnnotate.pause();
        };

    };
    annotationController.$inject = ['$scope','keyService'];

    var transcriptController = function ($scope) {
        var vm = this;
        vm.userObj = $scope.userObj;
        vm.sessionObj = $scope.sessionObj;


    };
    transcriptController.$inject = ['$scope'];

})();
