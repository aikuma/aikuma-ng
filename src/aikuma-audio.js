/**
 * Created by Mat on 2/03/2016.
 */
(function(){
    'use strict';
    angular
        .module('aikuma-audio', [])
        .directive('ngRecord', function() {
            return {
                restrict: 'E',
                scope: {
                    userObj: '='
                },
                templateUrl: 'views/templates/record-template.html',
                controller: newRecordDirectiveController,
                controllerAs: 'nrCtrl'
            };
        })
        .directive("ngRespeak2", function() {
            return {
                restrict: "E",
                scope: {
                    userObj: '=',
                    sessionObj: '=',
                    respeakObj: '=',
                    langIdNameMap: '=',
                    type: '@',
                    source: '@',
                    peaks: '='
                },
                templateUrl: "views/templates/respeak2-template.html",
                controller: respeak2DirectiveController,
                controllerAs: 'rCtrl'
            };
        });


    //
    // RECORD DIRECTIVE
    //
    var newRecordDirectiveController = function ($timeout, config, $scope, $rootScope, $location, $window, loginService, audioService, dataService, fileService, $sce, $mdDialog, $translate) {
        var vm = this;
        var rec;
        vm.externalRecord = fileService.getTempObject();
        vm.wsRecord = Object.create(WaveSurfer);
        vm.context = new AudioContext();
        vm.loadingStatus = false;
        vm.isLoading = function() {
            return vm.loadingStatus;
        };

        // AudioBuffer and Waveform-width
        var peaks = null;
        var minPxPerSec = config.cachePeak? 4 : 20;
        var getPeaks = function (buffer, pxPerSec, width) {
            pxPerSec = pxPerSec || 1;
            width = width || Math.round(buffer.duration * pxPerSec * window.devicePixelRatio);
            
            var sampleSize = buffer.length / width; 
            var sampleStep = ~~(sampleSize / 10) || 1; // 10 samples for one peak
            //var peaks = [];
            var mergedPeaks = [];
            
            for (var ch = 0; ch < buffer.numberOfChannels; ch++) {
                //peaks[ch] = [];
                var channelData = buffer.getChannelData(ch);
                
                // Extract waveform-peaks
                for (var i = 0; i < width; i++) {
                    var start = ~~(i * sampleSize);
                    var end = ~~(start + sampleSize);
                    var min = 0;
                    var max = 0;

                    for (var j = start; j < end; j += sampleStep) {
                        var value = channelData[j];

                        if (value > max) {
                            max = value;
                        }

                        if (value < min) {
                            min = value;
                        }
                    }

                    //peaks[ch][2 * i] = max;
                    //peaks[ch][2 * i + 1] = min;
                    
                    if (ch == 0 || max > mergedPeaks[2 * i]) {
                        mergedPeaks[2 * i] = max;
                    }

                    if (ch == 0 || min < mergedPeaks[2 * i + 1]) {
                        mergedPeaks[2 * i + 1] = min;
                    }
                }
            }

            // max/min within sampleSize across all channels
            //return peaks;
            return mergedPeaks;
        }
        
        if(vm.externalRecord) {
            vm.wsRecord.init({
                container: "#respeakRecord",
                //backend: "WebAudio",
                backend: (config.cachePeak? "MediaElement" : "WebAudio"),
                minPxPerSec: minPxPerSec,
                renderer: "MultiCanvas",
                normalize: true,
                hideScrollbar: false,
                scrollParent: true,
                progressColor: '##33627c',
                waveColor: '#4FC3F7'
            });
            vm.wsRecord.on('ready', function() {
                vm.recordDurMsec = Math.floor(vm.wsRecord.getDuration() * 1000);
                vm.hasrecdata = true;
                $scope.$apply();
            });

            vm.loadingStatus = true;
            var fileReader = new FileReader();
            fileReader.onload = function() {
                
                vm.context.decodeAudioData(this.result, function (buffer) {
                    if(config.cachePeak) {
                        peaks = getPeaks(buffer, minPxPerSec);
                    }
                    vm.loadingStatus = false;
                    var u = URL.createObjectURL(vm.externalRecord);
                    vm.wsRecord.load(u, peaks);
                }).catch( function(err) {
                    vm.loadingStatus = false;
                    $scope.$apply();
                    $translate(['AUDIO_IMPERR', "OHNO"]).then(function (translations) {
                        $mdDialog.show(
                            $mdDialog.alert()
                                .parent(angular.element(document.querySelector('#popupContainer')))
                                .clickOutsideToClose(true)
                                .title(translations.AUDIO_IMPERR)
                                .textContent('' + err)
                                .ariaLabel('Audio file unsupported')
                                .ok(translations.OHNO)
                        ).then(function () {
                            $location.path('/');
                        });
                    });
                });
            };
            fileReader.readAsArrayBuffer(vm.externalRecord);
        } else {
            vm.wsRecord.init({
                container: "#respeakRecord",
                normalize: false,
                scrollParent: true,
                cursorWidth: 0,
                progressColor: '##33627c',
                waveColor: '#4FC3F7'
            });
            // Init Microphone plugin
            var microphone = Object.create(WaveSurfer.Microphone);
            microphone.init({
                wavesurfer: vm.wsRecord
            });
            microphone.on('deviceReady', function() {
                microphone.play();
                $scope.$apply(function() {
                    $scope.recordClass = 'activespeaker';
                });
            });
            microphone.on('deviceError', function(code) {
                console.warn('Device error: ' + code);
            });
            microphone.start();

            // start our own audio context for recorder.js. Because calling pause() on the wavesurfer microphone
            // plugin disconnects the node, we'll end up with an empty file!
            navigator.mediaDevices.getUserMedia({video: false, audio: true})
                .then(function (mediastream) {
                    vm.streamsource = vm.context.createMediaStreamSource(mediastream);
                    rec = new Recorder(vm.streamsource, {numChannels: 1});
                })
                .catch(function (feh) {
                    console.log('audio spaz out', feh);
                });
        }

        function createDownsampledLink(targetSampleRate, callback) {
            if(vm.externalRecord) {
                fileService.createFile(loginService.getLoggedinUserId(), vm.externalRecord).then(function(url) {
                    callback(url);
                });
            } else {
                rec.getBuffer(function(buf){
                    vm.recordDurMsec = Math.floor(buf[0].length / (microphone.micContext.sampleRate/1000));
                    audioService.resampleAudioBuffer(microphone.micContext,buf,targetSampleRate,function(thinggy){
                        var audioBuf = thinggy.getAudioBuffer();
                        var blob = audioService.arrayToBlob(audioBuf.getChannelData(0), 1, audioBuf.sampleRate);
                        fileService.createFile(loginService.getLoggedinUserId(), blob).then(function(url) {
                            callback(url);
                            $scope.recording=$sce.trustAsResourceUrl(url);
                        });
                    });
                });
            }
        }

        function playbackAudio(inputbuffer) {
            var newSource = vm.context.createBufferSource();
            var newBuffer = vm.context.createBuffer( 1, inputbuffer[0].length, vm.context.sampleRate );
            newBuffer.getChannelData(0).set(inputbuffer[0]);
            newSource.buffer = newBuffer;
            newSource.connect( vm.context.destination );
            newSource.onended = function() {
                $scope.$apply(function() {
                    $scope.playbackClass = '';
                });
            };
            newSource.start(0);
            vm.reviewPlayback = true;
            $scope.$apply(function() {
                $scope.playbackClass = 'nowplaying';
            });
        }

        vm.play = function() {
            if (vm.externalRecord) {
                vm.wsRecord.playPause();
            } else {
                rec.getBuffer(function (buffer) {
                    playbackAudio(buffer);
                });
            }
        };

        vm.isrecording = false; // used for applying classes to buttons
        $scope.recordClass = 'inactivespeaker'; // becomes activespeaker when user permits microphone

        vm.toggleRecord = function () {
            if (!vm.isrecording) {
                $scope.recordClass = 'activerecord';
                vm.isrecording=true;
                audioService.playBeep(function() {
                    $timeout(function(){
                        rec.record();
                    },500);
                });
            } else {
                $scope.recordClass = 'activespeaker';
                vm.isrecording = false;
                rec.stop();
                audioService.playBeep();
                vm.hasrecdata = true; // used for review/play button status
                vm.wsRecord.empty();
            }
        };

        vm.check = function() {
            // Disable/Clean microphone/recorder
            $scope.recordClass = 'inactivespeaker';
            microphone.pause();
            if(vm.isRecording) {
                rec.stop();
                vm.wsRecord.empty();
                vm.isrecording = false;
                $scope.$apply();
            }
            
            // File created and url is stored
            createDownsampledLink(config.sampleRate);
        };

        // This might not work right. Errors observed on querying length of unset variables.
        vm.isMetaEmpty = function() {
            return !vm.hasrecdata || vm.selectedLanguages.length === 0 || !vm.selectedTitle;// vm.selectedTitles.length === 0;
        };
        
        vm.save = function() {
            // moved into the save, no need to downsample just for playback
            createDownsampledLink(config.sampleRate, saveDownsampled);

            function saveDownsampled(url) {
                recordUrl = url;
                // This should all be in the data service. Too much logic here.
                var fileObj = {
                    url: recordUrl,
                    type: vm.recordType
                };
                var fileObjId = $scope.userObj.addUserFile(fileObj);
                $scope.userObj.save().then(function() {
                    // Create new session metadata
                    var sessionData = {};
                    vm.selectedTitles.push(vm.selectedTitle);
                    sessionData.names = vm.selectedTitles;
                    sessionData.creatorId = loginService.getLoggedinUserId();
                    sessionData.source = {
                        recordFileId: fileObjId,
                        created: Date.now(),
                        duration: vm.recordDurMsec,
                        langIds: vm.selectedLanguages,
                        //langIds: vm.selectedLanguages.map(function(lang) { return lang.id; })
                    };
                    if(peaks) {
                        sessionData.source.peaks = [minPxPerSec, peaks];
                    }

                    return dataService.setSession(loginService.getLoggedinUserId(), sessionData);
                }).then(function(sessionId) {
                    // Recording file and session metadata are both created
                    vm.isCompleted = true;

                    $location.path('session/'+sessionId);
                });
                    
            }

        };

        vm.cancelDelete = function(ev) {
            if(rec) {
                rec.stop();
                rec.clear();   
            }
            $scope.recordClass = 'inactivespeaker';
            $scope.recording = '';
            if (vm.hasrecdata) {
                $translate(['DELETE_CONF', 'ANNO_DELCONF2', 'DELETE_RECORD', 'ANNO_DELNO']).then(function (translations) {
                    var confirm = $mdDialog.confirm()
                        .title(translations.DELETE_CONF)
                        .textContent(translations.ANNO_DELCONF2)
                        .ariaLabel('Delete')
                        .targetEvent(ev)
                        .ok(translations.DELETE_RECORD)
                        .cancel(translations.ANNO_DELNO);
                    $mdDialog.show(confirm).then(function () {
                        $location.path('/');
                    }, function () {
                        //
                    });
                });
            } else {
                $location.path('/');
            }
        };

        $rootScope.$on('$routeChangeStart', function() {
            if (!vm.externalRecord) {
                microphone.stopDevice();
                microphone.destroy();
                vm.wsRecord.destroy();
            }
        });

        $scope.$on('$destroy', function() {
            if (!vm.externalRecord) {
                if(rec)
                    rec.clear();
                vm.context.close();
            } else {
                fileService.setTempObject(null);
            }
        });
        
        $window.onbeforeunload = function() {
            // When a file is created but metadata is not
            if(recordUrl && !vm.isCompleted)
                fileService.deleteFile(recordUrl);
        };
        
        ///////////////////////////////
        $scope.recording = '';
        vm.hasrecdata = false; // used for review/play button status
        vm.isCompleted = false;
        var recordUrl = '';
        vm.recordDurMsec = 0;
        vm.recordType = (vm.externalRecord && vm.externalRecord.type) || 'audio/wav';
        
        vm.selectedTitles = [];
        vm.selectedLanguages = [];

        // Language input interface for session
        vm.saveLangs = function(langIds) {
            vm.selectedLanguages = langIds;
        };

    };
    newRecordDirectiveController.$inject = ['$timeout','config', '$scope', '$rootScope', '$location', '$window', 'loginService', 'audioService', 'dataService', 'fileService', '$sce', '$mdDialog', '$translate'];


    //
    // RESPEAK2 DIRECTIVE
    //
    var respeak2DirectiveController = function ($timeout, config, $scope, $location, keyService, loginService, audioService, dataService, fileService, $mdDialog, $translate, $mdToast) {
        var vm = this;
        vm.playBoxesEnabled = false;    //playSegment will not work
        var recorder;           // recorder.js
        var ctrlKeyCode = 16;   // control key (16 is shift)
        var ffKeyCode = 39;     // right arrow
        var rwKeyCode = 37;     // left arrow
        var escKeyCode = 27;    // escape
        var skipTimeValue = 1;  // amount of time to skip backwards for rewind
        var ffPlaybackRate = 2; // playback speed in FF mode
        var respeakAudioContext = new AudioContext();
        // Variables that record playin position, array of wavesurfer regions, segmentation map and more
        var recordedAudioBuffer = null;
        var resampledRate = config.sampleRate;

        var lastAction = null;
        
        // set up play rate defaults based on the user preference for enabling time stretching
        if ($scope.userObj.data.preferences.timeStretchSrc) {
            vm.timestretchEnabled = true;
            vm.playRate = 80;
        } else {
            vm.timestretchEnabled = false;
            vm.playRate = 100;
        }
        vm.isPlaying = false;
        vm.isRecording = false;
        vm.playrecturn = 'play';
        vm.begunrecording = false;
        vm.recordDisabled = true;
        vm.undoDisabled = false;
        vm.clickPlaybackOn = false;

        // used to block multiple key presses
        vm.leftKeyDown = false;
        vm.rightKeyDown = false;
        vm.ffKeyDown = false;
        vm.recordClass = 'activespeaker';
        vm.startedMicrophone = false;
        vm.hasSeeked = false;
        vm.hasRecording = false;
        // VM bindings to the UI
        vm.saveFile = createFile;
        vm.redo = function() {
            escKey(false);
        };

        var textStrings = ['RSPK_HELP1','RSPK_HELP2','RSPK_HELP3','RSPK_HELP4','RSPK_HELP5','RSPK_HELP6','RSPK_HELP7',''];
        vm.helpIdx = 0;
        vm.helpText = textStrings[vm.helpIdx];

        //
        // This is code which restores from a backend
        //
        var prevState = $scope.respeakObj? {} : null;
        vm.playIn = 0;
        vm.regionList = [];
        vm.segMap = [];
        function restoreState() {
            if ($scope.respeakObj) {
                prevState.fileObj = $scope.userObj.data.files[$scope.respeakObj.data.source.recordFileId];
                prevState.sampleLength = $scope.respeakObj.data.source.sampleLength;
                prevState.sampleRate = $scope.respeakObj.data.source.sampleRate;
                prevState.srcSegId = $scope.respeakObj.data.segment.sourceSegId;
                
                var sourceSeg = $scope.sessionObj.data.segments[prevState.srcSegId];
                var respeakSeg = $scope.respeakObj.data.segment.segMsec;
                if(sourceSeg.length !== respeakSeg.length) {
                    vm.recordDisabled = true;
                    vm.undoDisabled = true;
                }
                var respeakSegSample = $scope.respeakObj.data.segment.segSample;
                vm.segMap = _.zip(sourceSeg, respeakSeg, respeakSegSample).map(function(arr) {
                    return {
                        source: arr[0],
                        child_ms: arr[1],
                        child_samp: arr[2]
                    };
                });
                
                var colcol = 1;
                vm.segMap.forEach(function(seg) {
                    if (colcol === 0) {colcol = 1;}
                    else {colcol = 0;}
                    var slen = seg.child_samp[1] - seg.child_samp[0] + 1;
                    var coldat = {
                        colidx: colcol,
                        audioLength: slen
                    };
                    var hue = 198 + (colcol*40);
                    var reg = wsPlayback.addRegion({
                        start: seg.source[0]/1000,
                        end: seg.source[1]/1000,
                        color: 'hsla('+hue+', 100%, 30%, 0.15)',
                        drag: false,
                        resize: false,
                        data: coldat
                    });
                    vm.regionList.push(reg);
                });
                vm.playIn = _.last(vm.regionList).end;
                recordedAudioBuffer = new Float32Array(prevState.sampleLength);
            }
        }
        
        //
        // Set up Wavesurfer
        //
        var wsOptions = {
            backend: vm.timestretchEnabled? 'MediaElement' : 'WebAudio',
            container: "#respeakPlayback",
            normalize: true,
            hideScrollbar: false,
            scrollParent: true
        };
        
        if($scope.peaks) {
            wsOptions.backend = 'MediaElement';
            wsOptions.minPxPerSec = $scope.peaks[0];
            vm.peakList = $scope.peaks[1];
        }
        
        var wsPlayback = WaveSurfer.create(wsOptions);

        /* Initialize the time line */
        var timeline = Object.create(wsPlayback.Timeline);
        timeline.init({
            wavesurfer: wsPlayback,
            container: "#respeak-timeline"
        });
        /* Minimap plugin */
        wsPlayback.initMinimap({
            height: 40,
            waveColor: '#555',
            progressColor: '#999',
            cursorColor: '#999'
        });
        wsPlayback.load($scope.source, vm.peakList);
        // Register key bindings after wavesurfer is ready to play
        wsPlayback.on('ready', function() {
            $scope.$apply(restoreState);
            // fancy new key handling service bound to <BODY> element, now we can handle left-right modifier keys
            keyService.regKey(ctrlKeyCode,'keydown', function(ev) {
                ev.preventDefault();
                if (ev.location === 1 && !vm.isPlaying) {
                    leftKeyDown(true);}
                if (ev.location === 2 && !vm.isRecording) {rightKeyDown(true);}
            });
            keyService.regKey(ctrlKeyCode,'keyup', function(ev) {
                ev.preventDefault();
                if (ev.location === 1) {
                    leftKeyUp(true);
                }
                if (ev.location === 2) {
                    rightKeyUp(true);
                }
            });
            keyService.regKey(ffKeyCode,'keydown',  function(ev) {
                ev.preventDefault();
                if (!vm.ffKeyDown) {ffKeyDown(true);}
            });
            keyService.regKey(ffKeyCode,'keyup',    function(ev) {
                ev.preventDefault();
                ffKeyUp(true);
            });
            keyService.regKey(rwKeyCode,'keydown',  function(ev) {
                ev.preventDefault();
                rwKey(true);
            });
            keyService.regKey(escKeyCode,'keydown', function(ev) {
                ev.preventDefault();
                escKey(true);
            });
        });
        wsPlayback.on('seek', function() {
            vm.hasSeeked = true;
            disableRecording();
            $scope.$apply();
        });
        wsPlayback.on('audioprocess', function() {
            var currentPos = wsPlayback.getCurrentTime();
            if (vm.isPlaying) {
                _.last(vm.regionList).update({end: currentPos});
            }
        });

        //
        // Set up the wavesurfer microphone record visualising and the microphone plugin
        // Note that we run them in parallel because pausing the wavesurfer microphone will disconnect the
        // recorder.js audio node!
        var wsRecord = Object.create(WaveSurfer);

        wsRecord.init({
            container: "#respeakRecord",
            normalize: false,
            scrollParent: true,
            cursorWidth: 0
        });
        // Init Microphone plugin
        var microphone = Object.create(WaveSurfer.Microphone);
        microphone.init({
            wavesurfer: wsRecord
        });
        microphone.on('deviceReady', function() {
            console.info('Device ready!');
            //microphone.pause();
        });
        microphone.on('deviceError', function(code) {
            console.warn('Device error: ' + code);
        });
        //microphone.start();

        // start our own audio context for recorder.js. Because calling pause() on the wavesurfer microphone
        // plugin disconnects the node, we'll end up with an empty file!
        navigator.mediaDevices.getUserMedia({video: false, audio: true})
            .then(function (mediastream) {
                var streamsource = respeakAudioContext.createMediaStreamSource(mediastream);
                recorder = new Recorder(streamsource, {numChannels: 1});
            })
            .catch(function (feh) {
                console.log('audio spaz', feh);
            });

        vm.playSegment = function(regidx) { // recordedAudioBuffer needs to be converted to make this function work
            var thisPosition = wsPlayback.getCurrentTime();
            disableRecording();
            wsPlayback.toggleInteraction();
            // segmap and regionlist have elements in the same order, we use the wavesurfer region for playback of the source
            var reg = vm.regionList[regidx];
            wsPlayback.setPlaybackRate(vm.playRate/100);
            reg.play();
            wsPlayback.once('pause', function(){
                seekToTime(thisPosition);
                wsPlayback.toggleInteraction();
                var startpos = vm.segMap[regidx].child_samp[0];
                var endpos = vm.segMap[regidx].child_samp[1];
                audioService.playbackBuffer(respeakAudioContext, recordedAudioBuffer, startpos, endpos);
            });
        };

        // Most of these key handling functions will silently return if the user is holding another key
        // Note the order of setting the keydown status. We allow for people releasing keys before return, but we will not register keys down under simultaneous keypress conditions.
        // left key actions for playback
        function leftKeyDown(waskey) {
            if (vm.rightKeyDown || vm.ffKeyDown) {return;}  // Block multiple keys
            vm.leftKeyDown = true;
            disableRecording();
            // We need to be careful about seeking. If we have seeked LEFT of the current region, don't let them play from there
            // If they want to seek forwards, that's fine. Reset the playIn point.
            var thisTime = wsPlayback.getCurrentTime();
            if (vm.hasSeeked) {
                if (thisTime > vm.playIn) {
                   vm.playIn = thisTime;
                }
                vm.hasSeeked = false;
            }
            // If this is a repeat action, we only need to update the region
            if (lastAction !== 'play') {
                makeNewRegion(vm.playIn);
            }
            wsPlayback.setPlaybackRate(vm.playRate/100);
            wsPlayback.play(vm.playIn);
            lastAction = 'play';
            vm.isPlaying = true;
            recorder.clear();
            if (waskey) {$scope.$apply();}
        }
        function leftKeyUp(waskey) {
            vm.leftKeyDown = false;
            if (vm.rightKeyDown || vm.ffKeyDown) {return;}  // Block multiple keys
            wsPlayback.pause();
            vm.isPlaying = false;
            vm.recordDisabled = false;
            if (vm.startedMicrophone) {
                microphone.play(); // resume the waveform on the right when playing.
            } else {
                microphone.start();
                vm.startedMicrophone = true;
            }
            vm.recordClass = 'activespeaker';
            updateHelpText();
            if (waskey) {$scope.$apply();}
        }
        vm.playDown = function() {
            leftKeyDown(false);
        };
        vm.playUp = function() {
            leftKeyUp(false);
        };
        // right key actions for playback
        function rightKeyDown(waskey) {
            if (vm.leftKeyDown || vm.ffKeyDown) {return;}  // Block multiple keys
            vm.rightKeyDown = true;
            if (vm.recordDisabled) {return;}               // do nothing if record is disabled
            if (lastAction === 'play') {
                vm.playIn = wsPlayback.getCurrentTime();
            }
            lastAction = 'record';
            setRegionRecording();
            vm.recordClass = 'activerecord';
            recorder.record();                  // begin recorder.js
            vm.isRecording = true;
            if (waskey) {$scope.$apply();}
        }
        function rightKeyUp(waskey) {
            vm.rightKeyDown = false;
            if (vm.leftKeyDown || vm.ffKeyDown) {return;}  // Block multiple keys
            vm.isRecording = false;
            // stop recorder.js and save audio buffer (will be appended)
            recorder.stop();
            setRegionFinishedRecording();
            saveAudioBuffer();
            // Now let's update the UI
            vm.recordClass = 'activespeaker';
            updateHelpText();
            if (waskey) {$scope.$apply();}
        }
        vm.recDown = function() {
            rightKeyDown(false);
        };
        vm.recUp = function() {
            rightKeyUp(false);
        };
        // fast forward key triggers playback at ffPlaybackRate times normal speed
        // We can also use this to create different region entry points, e.g. skip content we don't wish to respeak.
        function ffKeyDown(waskey) {
            if (vm.leftKeyDown || vm.rightKeyDown) {return;}  // Block multiple keys
            vm.ffKeyDown = true;
            vm.hasSeeked = true;
            if (lastAction === 'play') {
                deleteLastRegion();
            } else {
                disableRecording();
            }
            wsPlayback.setPlaybackRate(ffPlaybackRate);
            wsPlayback.play();
            updateHelpText();
            if (waskey) {$scope.$apply();}
        }
        function ffKeyUp(waskey) {
            vm.ffKeyDown = false;
            if (vm.leftKeyDown || vm.rightKeyDown) {return;}  // Block multiple keys
            wsPlayback.pause();
            wsPlayback.setPlaybackRate(1);
        }
        // rewind key just jumps the cursor back 1 second each time. No playback.
        function rwKey(waskey) {
            disableRecording();
            var thistime =  wsPlayback.getCurrentTime();
            if ((thistime-skipTimeValue) < vm.playIn) {
                seekToPlayin();
            } else {
                wsPlayback.skipBackward(skipTimeValue);
            }
            if (waskey) {$scope.$apply();}
        }

        //
        // DELETE LAST REGION
        //
        // escape key to undo last region - currently infinite length
        // after removing a region, update the UI
        function escKey(waskey) {
            if (vm.undoDisabled) {return;}               // do nothing if undo is disabled
            deleteLastRegion();
            updateHelpText();
            if (waskey) {$scope.$apply();}
        }

        // delete the last audio, remove the wavesurfer region, seek to playIn, disable recording and make a new Segmap
        function deleteLastRegion() {
            var isAudioDeleted = false;
            if (vm.regionList.length) {
                // if this is not the case, then the user is undoing a region that doesn't have recorded data yet.
                if (vm.segMap.length === vm.regionList.length) {
                    deleteLastAudio();
                    isAudioDeleted = true;
                }
                var reg = vm.regionList.pop();
                reg.remove();
                if (vm.regionList.length) {
                    vm.playIn = _.last(vm.regionList).end;
                } else {
                    vm.playIn = 0;
                }
                // this is so we don't start moving a record-mode region!
                lastAction = 'delete';
                makeSegmap(); // update the Segmap
                if(isAudioDeleted) {
                    saveToBackend();
                }
                
                seekToPlayin();
                disableRecording();
            }
        }

        function deleteLastAudio() {
            if (!vm.segMap.length) {return;}
            var start = _.last(vm.segMap).child_samp[0];
            var end = _.last(vm.segMap).child_samp[1];
            recordedAudioBuffer = audioService.chopFromArray(recordedAudioBuffer, ((end - start) + 1));
            if(prevState) {
                prevState.sampleLength -= (end - start + 1);
            }
        }

        //
        // MAKE NEW REGION
        //

        // let's make a region when we begin playing (it'll be green at first)
        function makeNewRegion(starttime) {
            // this stuff just alternates which we use to colour when the region switches to record mode
            var colidx = 1;
            if (vm.regionList.length) {
                colidx = _.last(vm.regionList).data.colidx;
            } else {
                colidx = 1;
            }
            if (colidx === 0) {
                colidx = 1;
            } else {
                colidx = 0;
            }
            var col = {
                colidx: colidx
            };
            var hue = 90; // region is green for now
            var reg = wsPlayback.addRegion({
                start: starttime,
                end: starttime,
                color: 'hsla('+hue+', 100%, 30%, 0.15)',
                drag: false,
                resize: false,
                data: col
            });
            vm.regionList.push(reg);
        }
        // Set region to one colour when recording
        function setRegionRecording() {
            var hue = 0;
            _.last(vm.regionList).update(
                {
                    color: 'hsla('+hue+', 100%, 30%, 0.2)'
                }
            );
        }
        // Alternate colours slightly so you can tell them apart.
        function setRegionFinishedRecording() {
            var colidx = _.last(vm.regionList).data.colidx;
            var hue = 198 + (colidx*40);
            _.last(vm.regionList).update(
                {
                    color: 'hsla('+hue+', 100%, 30%, 0.1)',
                    data: {colidx:colidx}
                }
            );
        }

        // Dump the recorder audio buffer directly into the region data.
        // Since our array of regions in regionList is order sorted, we can simply serialise them all on save/export
        // Resample the audio also.
        function saveAudioBuffer() {
            var reg = _.last(vm.regionList);
            recorder.getBuffer(function(buffer) {
                audioService.resampleAudioBuffer(microphone.micContext, buffer, config.sampleRate, function(resampledBuffer) {
                    var audioArrayData = resampledBuffer.getAudioBuffer().getChannelData(0);
                    var length = audioArrayData.length;
                    if (recordedAudioBuffer) {
                        recordedAudioBuffer = audioService.appendArrays(recordedAudioBuffer, audioArrayData);
                    } else {
                        recordedAudioBuffer = audioArrayData;
                    }
                    resampledRate = resampledBuffer.getAudioBuffer().sampleRate;
                    vm.debug = recordedAudioBuffer.length;
                    reg.data.audioLength = length;
                    makeSegmap();
                    saveToBackend();
                });
            });
        }

        // creates a segmentation map array of objects, based on the currently existing regions
        // the values are in milliseconds but are based on sample-based absolute offsets to avoid
        // cumulative rounding errors.
        function makeSegmap() {
            vm.segMap = [];
            var sampleOffset = 0;
            vm.regionList.forEach(function(reg){
                var restart = audioService.roundMs(sampleOffset / config.sampleRate);
                var reend = audioService.roundMs((sampleOffset + reg.data.audioLength) / config.sampleRate);
                vm.segMap.push(
                    {
                        source: [audioService.roundMs(reg.start), audioService.roundMs(reg.end)],
                        child_ms: [restart, reend],
                        child_samp: [sampleOffset, (sampleOffset + reg.data.audioLength - 1)]
                    }
                );
                sampleOffset += reg.data.audioLength;
            });
        }


        //
        // UTILITY FUNCTIONS
        //
        // Simple cycle through help text strings. This needs to be updated to be based on handles in the localisation files.
        function updateHelpText() {
            if (($translate.use() !== 'en') || vm.helpIdx == (textStrings.length-1)) {return;} // skip this if not in English
            console.log($translate.use());
            ++vm.helpIdx;
            vm.helpText = textStrings[vm.helpIdx];
            showActionToast(vm.helpText);
        }
        function showActionToast(text_id) {
            $translate(text_id).then(function(tran) {
                var toast = $mdToast.simple()
                    .textContent(tran)
                    .action('X')
                    .parent(angular.element(document.querySelector('#toastContainer')))
                    .highlightAction(false)
                    .position('top left');
                $mdToast.show(toast).then(function(response) {
                    if ( response === 'ok' ) {
                        vm.helpIdx = textStrings.length-1;
                    }
                });
            });

        };

        // Called from several places as a means to pause the microphone and disable record controls
        // and update UI elements to show that the user cannot record at this point.
        function disableRecording() {
            vm.recordClass = 'inactivespeaker';
            microphone.pause();
            wsRecord.empty();
            vm.recordDisabled = true;
        }
        // Often we force seek to play-in because we don't allow the user to play back where they cannot record.
        function seekToPlayin() {
            var length = wsPlayback.getDuration();
            var floatpos = vm.playIn / length;
            wsPlayback.seekTo(floatpos);
        }
        function seekToTime(time) {
            var length = wsPlayback.getDuration();
            var floatpos = time / length;
            wsPlayback.seekTo(floatpos);
        }
        // With just one array, it's easy to make a file as required
        // DEPRECATED
        function createFile() {
            if(fileProcessPromise && recordedAudioBuffer.length !== prevState.sampleLength) {
                fileProcessPromise.then(function() {
                    saveToBackend();
                    return fileProcessPromise;
                }).then(function() {
                    $location.path('session/' + $scope.sessionObj.data._ID);
                });
            } else {
                $location.path('session/' + $scope.sessionObj.data._ID);
            }
        }
        //
        // This is called every time there is data to be saved
        //
        vm.isTempObjsaving = false;
        var fileProcessPromise;
        function saveToBackend() {
            if(prevState && prevState.sampleRate && prevState.sampleRate !== resampledRate) {
                // error
                return;
            }
            if(vm.isTempObjsaving) {return;}
            vm.isTempObjsaving = true;
            var newBlob;
            if(prevState) {
                var newAudioBuffer = recordedAudioBuffer.subarray(prevState.sampleLength);
                newBlob = new Blob([audioService.floatTo16BitPCM(newAudioBuffer)], { type: 'audio/wav' });
                
                fileProcessPromise = fileService.writeFile(prevState.fileObj.url, newBlob, 44 + prevState.sampleLength*2).then(function() {
                    
                    prevState.sampleLength += newAudioBuffer.length;
                    
                    var sourceSegList = _.pluck(vm.segMap, 'source');
                    if($scope.sessionObj.data.segments[prevState.srcSegId]) {
                        $scope.sessionObj.data.segments[prevState.srcSegId] = sourceSegList;
                    }
                    return $scope.sessionObj.save();
                }).then(function() {
                    if($scope.respeakObj.data) {
                        $scope.respeakObj.data.source.duration = Math.floor(recordedAudioBuffer.length / (resampledRate/1000));
                        $scope.respeakObj.data.source.sampleLength = recordedAudioBuffer.length;
                        $scope.respeakObj.data.source.langIds = vm.srcLangIds;
                        $scope.respeakObj.data.segment.segMsec = _.pluck(vm.segMap, 'child_ms');
                        $scope.respeakObj.data.segment.segSample = _.pluck(vm.segMap, 'child_samp');
                    }
                    return $scope.respeakObj.save();
                }).then(function() {
                    vm.isTempObjsaving = false;
                }).catch(function(err){
                    console.error(err);
                });
            } else {
                newBlob = audioService.arrayToBlob(recordedAudioBuffer, 1, resampledRate);
                
                var respeakFileId;
                fileProcessPromise = fileService.createFile(loginService.getLoggedinUserId(), newBlob).then(function(url) {
                    prevState = {};
                    prevState.fileObj = {
                        url: url,
                        type: newBlob.type
                    };
                    prevState.sampleLength = recordedAudioBuffer.length;
                    prevState.sampleRate = resampledRate;
                    
                    respeakFileId = $scope.userObj.addUserFile(prevState.fileObj);
                    return $scope.userObj.save();
                }).then(function() {
                    var sourceSegList = _.pluck(vm.segMap, 'source');
                    prevState.srcSegId = $scope.sessionObj.addSrcSegment(sourceSegList);
                    return $scope.sessionObj.save();
                }).then(function() {
                    var respeakData = {
                        names: [],          // need UI
                        type: $scope.type
                    };
                    respeakData.creatorId = loginService.getLoggedinUserId();    
                    respeakData.source = {
                        recordFileId: respeakFileId,
                        created: Date.now(),
                        duration: Math.floor(recordedAudioBuffer.length / (resampledRate/1000)),
                        langIds: vm.srcLangIds,
                        
                        sampleRate: resampledRate,
                        sampleLength: recordedAudioBuffer.length
                    };
                    respeakData.segment = {
                        sourceSegId: prevState.srcSegId,
                        segMsec: _.pluck(vm.segMap, 'child_ms'),
                        segSample: _.pluck(vm.segMap, 'child_samp')
                    };

                    return dataService.setSecondary(loginService.getLoggedinUserId(), $scope.sessionObj.data._ID, respeakData);
                }).then(function(secId) {
                    return dataService.get('secondary', secId[0]);
                }).then(function(respeakObj){
                    $scope.respeakObj = respeakObj;
                    vm.isTempObjsaving = false;
                }).catch(function(err){
                    console.error(err);
                });
            }
        }
        
        // language directives
        vm.srcLangIds = [];
        if($scope.type === 'translate' && $scope.respeakObj) {
            vm.srcLangIds = $scope.respeakObj.data.source.langIds;
        } else if($scope.type === 'respeak') {
            vm.srcLangIds = $scope.sessionObj.data.source.langIds;
        }
        
        vm.saveLangs = function(langIds) {
            vm.srcLangIds = langIds;
            if($scope.type === 'translate' && $scope.respeakObj) {
                $scope.respeakObj.data.source.langIds = vm.srcLangIds;
                $scope.respeakObj.save();
            }
        };

        vm.cancelDelete = function(ev) {
            if (vm.segMap.length > 0) {
                $translate(['DELETE_CONF', 'ANNO_DELCONF2', 'DELETE_TRANS', 'DELETE_RESPK', 'ANNO_DELNO']).then(function (translations) {
                    var okaytext;
                    switch ($scope.type) {
                        case 'respeak':
                            okaytext = translations.DELETE_RESPK;
                            break;
                        case 'translate':
                            okaytext = translations.DELETE_TRANS;
                            break;
                    }
                    var confirm = $mdDialog.confirm()
                        .title(translations.DELETE_CONF)
                        .textContent(translations.ANNO_DELCONF2)
                        .ariaLabel('Delete')
                        .targetEvent(ev)
                        .ok(okaytext)
                        .cancel(translations.ANNO_DELNO);
                    $mdDialog.show(confirm).then(function () {
                        fileService.removeData('secondary', $scope.respeakObj.data._ID);
                        $location.path('session/' + $scope.sessionObj.data._ID);
                    }, function () {
                        //
                    });
                });
            } else {
                $location.path('session/' + $scope.sessionObj.data._ID);
            }

        };


        // on navigating away, clean up the key events, wavesurfer instances and clear recorder data (it has no destroy method)
        $scope.$on('$destroy', function() {
            keyService.clearAll();
            timeline.destroy();
            wsPlayback.destroy();
            microphone.destroy();
            wsRecord.destroy();
            respeakAudioContext.close();
            if(recorder) 
                recorder.clear();
        });
    };
    respeak2DirectiveController.$inject = ['$timeout', 'config', '$scope', '$location', 'keyService', 'loginService', 'audioService', 'dataService', 'fileService', '$mdDialog', '$translate', '$mdToast'];

})();
