/**
 * Created by Mat on 16/03/2016.
 */
(function(){
    'use strict';
    angular
        .module('aikuma-video', [])

        .controller('videoController', ['config', '$timeout', '$scope', '$location', 'dataService', 'loginService', '$route', function(config, $timeout, $scope, $location, dataService, loginService, $route) {
            var vm = this;
            vm.test = true;
            vm.getLoginStatus = loginService.getLoginStatus;    //wrapper function for js primitive data binding

            var vidPlayer = videojs("example_video_1");

            vidPlayer.on('timeupdate', function(something){
                vm.update = vidPlayer.currentTime();
                $scope.$apply();
            });

            var videoelement = document.getElementsByClassName("videoloader");
            var video = document.createElement("video");
            video.setAttribute("src", "media/saisiyat.MP4");

            video.controls = true;
            video.autoplay = true;
            videoelement.appendChild(video);

            service.resampleAudioBuffer = function (audiocontext,audioBuffer,targetSampleRate,oncomplete) {
                var newBuffer = audiocontext.createBuffer( 1, audioBuffer[0].length, audiocontext.sampleRate );
                newBuffer.getChannelData(0).set(audioBuffer[0]);
                var numFrames_ = audioBuffer[0].length * targetSampleRate / audiocontext.sampleRate;
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
                                return blob;
                                //return URL.createObjectURL(blob);
                            }
                        });
                    }
                };
                //console.log('Starting Offline Rendering');
                bufferSource_.connect(offlineContext_.destination);
                bufferSource_.start(0);
                offlineContext_.startRendering();
            };

            // When 'Open File' is pressed
            $scope.$watch('videofile', function (file) {
                if (!file) {
                    return;
                }
                var objectURL = URL.createObjectURL(file);
                console.log(objectURL);
                vidPlayer.src([
                    { type: "video/mp4", src: objectURL }
                ]);
            });

        }]);
})();


