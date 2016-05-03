/**
 * Created by Mat on 3/03/2016.
 */
(function(){
    'use strict';
    angular
        .module('aikuma-audioService', [])
        .factory('audioService', ['config', 'fileService', function (config, fileService) {
            var service = {};

            // deprecate both this mez function and the mediaelement playbackFile in favour of service.playFile
            service.playbackLocalFile = function(audioContext, fsUri, start, end, callback, playrate = 1) {
                service.playMediaElementFile(fsUri, start, end, callback, playrate);
/*                if (playrate !== 1) {
                    service.playMediaElementFile(fsUri, start, end, callback, playrate);
                } else {
                    fileService.getFile(fsUri).then(function(file) {
                        service.playbackFile(audioContext, file, start, end, callback);
                    });                    
                }*/
            };

            // play using web audio (this does not fire the callback reliably, so I'm favouring using the mediaelement version
            service.playbackFile = function(audioContext, file, start, end, callback) {
                var fileReader = new FileReader();
                fileReader.onload = function() {
                    audioContext.decodeAudioData(this.result, function(decodedBuffer) {
                        var audioSourceNode = audioContext.createBufferSource();
                        audioSourceNode.buffer = decodedBuffer;
                        audioSourceNode.connect(audioContext.destination);
                        audioSourceNode.onended = function() {
                            callback();
                        };
                        audioSourceNode.start(audioContext.currentTime, start/1000, (end-start)/1000);
                    });
                };
                fileReader.readAsArrayBuffer(file);
            };

            // play using HTML media element (needed for time stretching)
            service.playMediaElementFile = function(file, start, end = null, callback, playbackrate = 1) {
                var audioElement = new Audio(file);
                var thisTime;
                if (end) {
                    audioElement.ontimeupdate = function() {
                        thisTime = audioElement.currentTime;
                        if (thisTime >= (end/1000)) {
                            audioElement.pause();
                            audioElement.ontimeupdate = null;
                            audioElement.onended = null;
                            callback();
                        }
                    };
                }
                audioElement.onended = function() {
                    audioElement.ontimeupdate = null;
                    audioElement.onended = null;
                    callback();
                };
                audioElement.currentTime = start/1000;
                audioElement.playbackRate = playbackrate;
                audioElement.play();
                return audioElement;
            };
            
            // New play file , uses MediaElement, returns the audio element in case the caller wishes the pause it manually
            service.playFile = function(fsUri, startpos = 0, callback = null, endpos = null, playbackrate = 1) {
                var audioElement = new Audio(fsUri);
                var thisTime;
                if (endpos && callback) {
                    audioElement.ontimeupdate = function() {
                        thisTime = audioElement.currentTime;
                        if (thisTime >= (endpos/1000)) {
                            audioElement.pause();
                            audioElement.ontimeupdate = null;
                            audioElement.onended = null;
                            callback();
                        }
                    };
                }
                if (callback) {
                    audioElement.onended = function() {
                        audioElement.ontimeupdate = null;
                        audioElement.onended = null;
                        callback();
                    };
                }
                if (startpos) {
                    audioElement.currentTime = startpos/1000;
                }
                audioElement.playbackRate = playbackrate;
                audioElement.play();
                return audioElement;
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
                            }
                        });
                    }
                };
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

            var beep = new Audio("media/beep.wav");
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
