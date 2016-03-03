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
    var respeakController = function ($scope, $window, $attrs, audioService,$sce) {
        var rec;
        var vm = this;
        $scope.recording = '';
        vm.sessionData = {};
        vm.context = new AudioContext();

        vm.sessionData.name = 'The Rotunda Conversation';
        vm.sessionData.id = '1';

        $scope.segments = [];

        vm.wsPlayback = Object.create(WaveSurfer);
        vm.wsPlayback.init({
            container: "#respeakPlayback",
            normalize: true,
            hideScrollbar: true,
            scrollParent: false
        });
        vm.wsPlayback.load('media/elan-example1.mp3');

        vm.wsRecord = Object.create(WaveSurfer);
        vm.wsRecord.init({
            container: "#respeakRecord",
            normalize: false,
            scrollParent: true,
            cursorWidth: 0
        });

        // Init Microphone plugin
        var microphone = Object.create(WaveSurfer.Microphone);
        microphone.init({
            wavesurfer: vm.wsRecord
        });
        microphone.on('deviceReady', function() {
            console.info('Device ready!');
            microphone.pause();
        });
        microphone.on('deviceError', function(code) {
            console.warn('Device error: ' + code);
        });

        microphone.start();

        // start our own audio context for recorder.js. Because calling pause() on the wavesurfer microphone
        // plugin disconnects the node, we'll end up with an empty file!
        navigator.mediaDevices.getUserMedia( {video: false,audio: true})
            .then(function(mediastream) {
                vm.streamsource=  vm.context.createMediaStreamSource(mediastream);
                rec = new Recorder(vm.streamsource,{numChannels: 1});
            })
            .catch(function(feh) {
                console.log('audio spaz',feh);
            });

        function createDownsampledLink(targetSampleRate) {
            rec.getBuffer(function(buf){
                audioService.resampleAudioBuffer(microphone.micContext,buf,targetSampleRate,function(thinggy){
                    var url = thinggy.getFile();
/*                  var li = document.createElement('li');
                    var au = document.createElement('audio');
                    var hf = document.createElement('a');
                    au.controls = true;
                    au.src = url;
                    hf.href = url;
                    hf.download = new Date().toISOString() + '.wav';
                    hf.innerHTML = hf.download;
                    li.appendChild(au);
                    li.appendChild(hf);
                    recordingslist.appendChild(li);*/
                    $scope.recording=$sce.trustAsResourceUrl(url);
                });
            });
        }

        vm.hasrecording = function() {
            return !($scope.recording == '');
        };

        vm.playrecturn = 'play';
        $scope.playbackClass = 'activespeaker';
        $scope.recordClass = 'inactivespeaker';

        function spaceup () {
            if (vm.wsPlayback.isPlaying() && vm.playrecturn == 'play') {
                vm.playrecturn = 'record';
                microphone.play();

                $scope.playbackClass = 'inactivespeaker';
                $scope.recordClass = 'activespeaker';
                $scope.$apply();
                vm.wsPlayback.playPause();
                return;
            }
            if (!vm.wsPlayback.isPlaying() && vm.playrecturn == 'record' ) {
                console.log('stopping record');
                rec.stop();
                rec.getBuffer(function(buf){
                    var reclength = buf[0].length;
                    makeSegment(reclength);
                });
                //createDownsampledLink(22050);
                //rec.clear();
                microphone.pause();
                vm.wsRecord.empty();
                vm.playrecturn = 'play';
                $scope.playbackClass = 'activespeaker';
                $scope.recordClass = 'inactivespeaker';
                $scope.$apply();
            }
        }

        function spacedown () {
            if (!vm.wsPlayback.isPlaying()) {
                if (vm.playrecturn === 'play') {
                    vm.wsPlayback.playPause();
                    return;
                }
                if (vm.playrecturn === 'record') {
                    $scope.recordClass = 'activerecord';
                    $scope.$apply();
                    console.log('starting record');
                    rec.record();
                }
            }
        }

        // We must use this because the underlying library (mousetrap) used by angular-hotkeys does
        // not provide any way to handle keys that are held down, e.g. ignoring repeated events.
        //
        var listener = new $window.keypress.Listener();
        listener.register_combo({
            "keys"              : 'space',
            "on_keydown"        :spacedown,
            "on_keyup"          :spaceup,
            "prevent_repeat"    :true,
        });

        vm.save = function() {
            createDownsampledLink(22050);
        };

        vm.reset = function() {
            vm.lastRec = 0;
            vm.lastPlay = 0;
            rec.stop();
            rec.clear();
            vm.wsPlayback.stop();
            $scope.segments = [];
            vm.playrecturn = 'play';
            $scope.playbackClass = 'activespeaker';
            $scope.recordClass = 'inactivespeaker';
        };

        vm.lastRec = 0;
        vm.lastPlay = 0;
        function makeSegment(recordpoint) {
            var rectime = Math.floor(recordpoint / (microphone.micContext.sampleRate/1000));
            console.log('rt',rectime);
            var playtime = Math.floor(vm.wsPlayback.getCurrentTime()*1000);
            $scope.segments.push({
                'source': [vm.lastPlay, playtime],
                'respeak': [vm.lastRec, rectime]
            });
            vm.lastPlay = playtime;
            vm.lastRec = rectime;
            $scope.$apply();
        }

    };
    respeakController.$inject = ['$scope', '$window', '$attrs', 'audioService', '$sce'];

})();