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
    var respeakController = function ($scope, $window, $attrs, annoService) {
        var vm = this;
        var rec;
        vm.recording = false;

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

        vm.wsRecord = Object.create(WaveSurfer);
        vm.wsRecord.init({
            container: "#respeakRecord",
            normalize: false,
            scrollParent: true
        });

        // Init Microphone plugin
        var microphone = Object.create(WaveSurfer.Microphone);
        microphone.init({
            wavesurfer: vm.wsRecord
        });
        microphone.on('deviceReady', function() {
            console.info('Device ready!');
           rec = new Recorder(microphone.mediaStreamSource,{numChannels: 1});
            console.log(rec);
        });
        microphone.on('deviceError', function(code) {
            console.warn('Device error: ' + code);
        });

        vm.microphone = function() {
            if (microphone.active) {
                microphone.stop();
            } else {
                microphone.start();
            }
        };

        vm.record = function() {
            if (vm.recording) {
                rec.stop();
                //createDownloadLink();
                createDownsampledLink(22050);
                rec.clear();
                vm.recording = false;
            } else {
                rec.record();
                vm.recording = true;
            }
            console.log(microphone.mediaStreamSource);
        };

        function createDownloadLink() {
            rec.getBuffer(function(buf){
                console.log(buf.length);

            });
            rec && rec.exportWAV(function(blob) {
                var url = URL.createObjectURL(blob);
                var li = document.createElement('li');
                var au = document.createElement('audio');
                var hf = document.createElement('a');

                au.controls = true;
                au.src = url;
                hf.href = url;
                hf.download = new Date().toISOString() + '.wav';
                hf.innerHTML = hf.download;
                li.appendChild(au);
                li.appendChild(hf);
                recordingslist.appendChild(li);
            });
        }

        function createDownsampledLink(targetSampleRate) {
            rec.getBuffer(function(buf){
                resampleAudioBuffer(buf,targetSampleRate,function(thinggy){
                    var url = thinggy.getFile();

                    var li = document.createElement('li');
                    var au = document.createElement('audio');
                    var hf = document.createElement('a');

                    au.controls = true;
                    au.src = url;
                    hf.href = url;
                    hf.download = new Date().toISOString() + '.wav';
                    hf.innerHTML = hf.download;
                    li.appendChild(au);
                    li.appendChild(hf);
                    recordingslist.appendChild(li);
                });
            });
        }

        function resampleAudioBuffer(audioBuffer,targetSampleRate,oncomplete) {
            var newBuffer = microphone.micContext.createBuffer( 1, audioBuffer[0].length, microphone.micContext.sampleRate );
            newBuffer.getChannelData(0).set(audioBuffer[0]);
            console.log(audioBuffer[0].length,targetSampleRate,microphone.micContext.sampleRate);
            var numFrames_ = audioBuffer[0].length * targetSampleRate / microphone.micContext.sampleRate;

            var offlineContext_ = new OfflineAudioContext(1, numFrames_, targetSampleRate);
            var bufferSource_ = offlineContext_.createBufferSource();
            bufferSource_.buffer = newBuffer;

            offlineContext_.oncomplete = function(event) {
                var resampeledBuffer = event.renderedBuffer;
                console.log('Done Rendering');
                if (typeof oncomplete === 'function') {
                    oncomplete({
                        getAudioBuffer: function() {
                            return resampeledBuffer;
                        },
                        getFile: function() {
                            var audioData = {
                                sampleRate: resampeledBuffer.sampleRate,
                                channelData: []
                            };
                            for (var i = 0; i < resampeledBuffer.numberOfChannels; i++) {
                                audioData.channelData[i] = resampeledBuffer.getChannelData(i);
                            }
                            var blob = new Blob([encodeWAV(audioData.channelData[0],resampeledBuffer.numberOfChannels,resampeledBuffer.sampleRate)], {
                                type: "audio/wav"
                            });
                            return URL.createObjectURL(blob);
                        }
                    });
                }
            };

            console.log('Starting Offline Rendering');
            bufferSource_.connect(offlineContext_.destination);
            bufferSource_.start(0);
            offlineContext_.startRendering();
        }


        function floatTo16BitPCM(output, offset, input) {
            for (var i = 0; i < input.length; i++, offset += 2) {
                var s = Math.max(-1, Math.min(1, input[i]));
                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
        }

        function writeString(view, offset, string) {
            for (var i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }

        function encodeWAV(samples,numChannels,sampleRate) {
            var buffer = new ArrayBuffer(44 + samples.length * 2);
            console.log(samples.length);
            var view = new DataView(buffer);

            /* RIFF identifier */
            writeString(view, 0, 'RIFF');
            /* RIFF chunk length */
            view.setUint32(4, 36 + samples.length * 2, true);
            /* RIFF type */
            writeString(view, 8, 'WAVE');
            /* format chunk identifier */
            writeString(view, 12, 'fmt ');
            /* format chunk length */
            view.setUint32(16, 16, true);
            /* sample format (raw) */
            view.setUint16(20, 1, true);
            /* channel count */
            view.setUint16(22, numChannels, true);
            /* sample rate */
            view.setUint32(24, sampleRate, true);
            /* byte rate (sample rate * block align) */
            view.setUint32(28, sampleRate * 4, true);
            /* block align (channel count * bytes per sample) */
            view.setUint16(32, numChannels * 2, true);
            /* bits per sample */
            view.setUint16(34, 16, true);
            /* data chunk identifier */
            writeString(view, 36, 'data');
            /* data chunk length */
            view.setUint32(40, samples.length * 2, true);

            floatTo16BitPCM(view, 44, samples);

            return view;
        }

    };
    respeakController.$inject = ['$scope', '$window', '$attrs', 'annoService'];

})();