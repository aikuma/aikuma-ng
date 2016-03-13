/**
 * Created by Mat on 3/03/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-audioService', [])
        .factory('audioService', ['config', function (config) {
            var service = {};

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

                console.log('Starting Offline Rendering');
                bufferSource_.connect(offlineContext_.destination);
                bufferSource_.start(0);
                offlineContext_.startRendering();
            };

            // time in seconds, returns milliseconds
            service.roundMs = function(time) {
                return Math.round(time * 1000);
            };

            service.arrayToBlob = function(audioData, channels, sampleRate) {
                var blob = new Blob([encodeWAV(audioData,channels,sampleRate)], {
                    type: "audio/wav"
                });
                return blob;
            };

            // Feed in one wav file and a segMap and function will return an array of arrays of audio data
            // corresponding to each segment
            service.audioRegionsFromFile = function(fileUrl, segMap){
                var request = new XMLHttpRequest();
                request.open( 'GET', fileUrl, true );
                request.responseType = 'arraybuffer';
                request.onload = function() {
                    var audioData = [];
                    segMap.forEach(function(seg){
                        var [seg_s, seg_e] = seg.child_samp;                // ES6 gets more Python-like
                        var dataSeg = request.response.getChannelData(0);
                        audioData.push(dataSeg.slice(seg_e,seg_s));
                    });
                    return audioData;
                };
                request.send();
            };

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

            service.playbackBuffer = function (context, inputbuffer, startpos, endpos) {
                console.log(startpos, endpos);
                var newSource = context.createBufferSource();
                var length = (endpos - startpos) + 1;
                var newBuffer = context.createBuffer(1, length, config.sampleRate);
                newBuffer.getChannelData(0).set(inputbuffer.slice(startpos,endpos));
                newSource.buffer = newBuffer;
                newSource.connect(context.destination);
                newSource.onended = function () {
                    // something when it's finished
                };
                newSource.start(0);
            };

            service.appendArrays = function(buffer1, buffer2) {
                var  newBuffer = new Float32Array(buffer1.length + buffer2.length);
                newBuffer.set(buffer1);
                newBuffer.set(buffer2, buffer1.length);
                return newBuffer;
            };

            service.chopFromArray = function(buffer1, choplength) {
                var newendpos = buffer1.length - choplength;
                var  newBuffer = new Float32Array(buffer1.length - choplength);
                newBuffer.set(buffer1.slice(0, newendpos));
                return newBuffer;
            };

            return service;
        }]);
})();
