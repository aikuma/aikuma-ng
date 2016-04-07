/**
 * Created by Mat on 3/03/2016.
 */
(function(){
    'use strict';
    angular
        .module('aikuma-audioService', [])
        .factory('audioService', ['config', 'fileService', function (config, fileService) {
            var service = {};


            service.playbackLocalFile = function(audioContext, fsUri, start, end, callback) {
                fileService.getFile(fsUri).then(function(file) {
                    service.playbackFile(audioContext, file, start, end, callback);
                });
            };
            
            service.playbackFile = function(audioContext, file, start, end, callback) {
                var fileReader = new FileReader();
                fileReader.onload = function() {
                    audioContext.decodeAudioData(this.result, function(decodedBuffer) {
                        var audioSourceNode = audioContext.createBufferSource();
                        audioSourceNode.buffer = decodedBuffer;
                        audioSourceNode.connect(audioContext.destination);
                        audioSourceNode.onended = function() { callback(); };
                        audioSourceNode.start(audioContext.currentTime, start/1000, (end-start)/1000);
                    });
                };
                fileReader.readAsArrayBuffer(file);
            };
            
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
                            },/*
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
                            }*/
                        });
                    }
                };
                //console.log('Starting Offline Rendering');
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
            
            service.floatTo16BitPCM = function(samples) {
                var buffer = new ArrayBuffer(samples.length * 2);
                var view = new DataView(buffer);
                floatTo16BitPCM(view, 0, samples);
                return new Int16Array(buffer);
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
                var newBuffer = new Float32Array(buffer1.length - choplength);
                newBuffer.set(buffer1.subarray(0, newendpos));
                return newBuffer;
            };

            var beep = new Audio("data:audio/ogg;base64,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");
            service.playBeep = function(callback) {
                beep.onended = callback;
                beep.play();
            };

            service.initVoiceRecog = function() {
                service.recognition = new webkitSpeechRecognition();
                service.recognition.continuous = false;
                service.recognition.interimResults = true;
                service.recognition.onstart = function() {
                    service.playBeep();
                };
                service.recognition.onerror = function(event) {
                    if (event.error === 'no-speech') {
                        console.log('info_no_speech');
                    }
                    if (event.error === 'audio-capture') {
                        console.log('info_no_microphone');
                    }
                    if (event.error === 'not-allowed') {
                        if (event.timeStamp - service.voice_start_timestamp < 100) {
                            connsole.log('info_blocked');
                        } else {
                            console.log('info_denied');
                        }
                    }
                };

            };

            service.startVoiceRecog = function(langCode, callbackUpdate, callbackFinished) {
                service.recognition.lang = langCode;
                service.voice_start_timestamp = Date.now();
                service.recognition.onresult = function(event) {
                    service.interim_transcript = '';
                    for (var i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            service.final_transcript += event.results[i][0].transcript;
                        } else {
                            service.interim_transcript += event.results[i][0].transcript;
                        }
                    }
                    callbackUpdate(service.final_transcript, service.interim_transcript);
                };
                service.recognition.onend = function() {
                    callbackFinished(service.final_transcript);
                    service.playBeep();
                };
                service.final_transcript = '';
                service.recognition.start();
            };
            
            return service;
        }]);
})();
