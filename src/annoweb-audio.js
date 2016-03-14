/**
 * Created by Mat on 2/03/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-audio', [])
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
        .directive("ngRespeak", function() {
            return {
                restrict: "E",
                templateUrl: "views/templates/respeak-template.html",
                controller: respeakDirectiveController,
                controllerAs: 'rCtrl'
            };
        })
        .directive("ngRespeak2", function() {
            return {
                restrict: "E",
                scope: {
                    userObj: '=',
                    sessionObj: '=',
                    source: "@"
                },
                templateUrl: "views/templates/respeak2-template.html",
                controller: respeak2DirectiveController,
                controllerAs: 'rCtrl'
            };
        });


    //
    // RECORD DIRECTIVE
    //
    var newRecordDirectiveController = function (config, $scope, $location, $window, loginService, audioService, dataService, fileService, $sce) {
        var vm = this;
        var rec;

        vm.externalRecord = fileService.getTempObject();
        
        vm.wsRecord = Object.create(WaveSurfer);
        vm.wsRecord.init({
            container: "#respeakRecord",
            normalize: false,
            scrollParent: true,
            cursorWidth: 0
        });
        
        if(vm.externalRecord) {
            vm.wsRecord.on('ready', function() {
                vm.recordDurMsec = Math.floor(vm.wsRecord.getDuration() * 1000);
                vm.hasrecdata = true;
            });
            vm.wsRecord.loadBlob(vm.externalRecord);
        } else {
            vm.context = new AudioContext();
            
            // Init Microphone plugin
            var microphone = Object.create(WaveSurfer.Microphone);
            microphone.init({
                wavesurfer: vm.wsRecord
            });
            microphone.on('deviceReady', function() {
                console.info('Device ready!');
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
                    console.log('audio spaz', feh);
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
                    console.log('rt', vm.recordDurMsec);
                    audioService.resampleAudioBuffer(microphone.micContext,buf,targetSampleRate,function(thinggy){
                        var blob = thinggy.getFile();
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
            rec.getBuffer(function(buffer) {
                playbackAudio(buffer);
            });
        };

        vm.isrecording = false; // used for applying classes to buttons
        $scope.recordClass = 'inactivespeaker'; // becomes activespeaker when user permits microphone

        vm.toggleRecord = function () {
            if (!vm.isrecording) {
                console.log('starting record');
                rec.record();
                $scope.recordClass = 'activerecord';
                vm.isrecording=true;
            } else {
                console.log('stopping record');
                rec.stop();
                vm.hasrecdata = true; // used for review/play button status
                vm.wsRecord.empty();
                $scope.recordClass = 'activespeaker';
                vm.isrecording = false;
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
            return !vm.hasrecdata || vm.selectedLanguages.length === 0 || vm.selectedTitles.length === 0;
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
                    sessionData.names = vm.selectedTitles;
                    sessionData.creatorId = loginService.getLoggedinUserId();
                    sessionData.source = {
                        recordFileId: fileObjId,
                        created: Date.now(),
                        duration: vm.recordDurMsec,
                        langIds: vm.selectedLanguages.map(function(lang) { return lang.id; })
                    };

                    return dataService.setSession(loginService.getLoggedinUserId(), sessionData);
                }).then(function(sessionId) {
                    // Recording file and session metadata are both created
                    vm.isCompleted = true;

                    $location.path('session/'+sessionId);
                });
                    
            }

        };

        vm.reset = function() {
            if(rec) {
                rec.stop();
                rec.clear();   
            }
            vm.hasrecdata = false;
            $scope.recordClass = 'inactivespeaker';
            $scope.recording = '';
        };

        $scope.$on('$destroy', function() {
            if(rec)
                rec.clear();
            fileService.setTempObject(null);
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
        vm.langFilterOn = true;
        
        vm.langPlaceholder = "Add languages";
        vm.langSecPlaceholder = "Add more";
        vm.titlePlaceholder = "Add titles";
        vm.titleSecPlaceholder = "Add more";
        
        // Language input interface for session
        fileService.getLanguages().then(function(langObjList) {
            var langList = langObjList.map(function(langObj) {
                return {
                    id: langObj.Id,
                    name: langObj.Ref_Name,
                    value: langObj.Ref_Name.toLowerCase()
                };
            });
            
            vm.langQuerySearch = function(query) {
                var results = [];
                query = query.toLowerCase();
                if(query) {
                    results = langList.filter(function(lang) {
                        return lang.value.indexOf(query) === 0;
                    });
                }
                return results;
            };
        });

    };
    newRecordDirectiveController.$inject = ['config', '$scope', '$location', '$window', 'loginService', 'audioService', 'dataService', 'fileService', '$sce'];


    //
    // RESPEAK DIRECTIVE
    //
    var respeakDirectiveController = function (config, $scope, $window, $attrs, loginService, audioService, dataService, fileService, $sce) {
        var vm = this;
        var rec;

        vm.isplaying = false;
        vm.isrecording = false;


        $scope.recording = '';
        // vm.sessionData is never used. this controller is used in the directive ngRespeak not in respeak.html
        /*dataService.get("session", $attrs.sessionId).then(function(sd) {
            vm.sessionData = sd.data;
            console.log(vm.sessionData);
        });*/

        vm.context = new AudioContext();

        vm.segments = [];
        
        vm.wsPlayback = Object.create(WaveSurfer);
        vm.wsPlayback.init({
            container: "#respeakPlayback",
            normalize: true,
            hideScrollbar: false,
            scrollParent: true
        });
        /* Initialize the time line */
        vm.timeline = Object.create(vm.wsPlayback.Timeline);
        vm.timeline.init({
            wavesurfer: vm.wsPlayback,
            container: "#respeak-timeline"
        });
        /* Minimap plugin */
        vm.wsPlayback.initMinimap({
            height: 40,
            waveColor: '#555',
            progressColor: '#999',
            cursorColor: '#999'
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
        navigator.mediaDevices.getUserMedia({video: false, audio: true})
            .then(function (mediastream) {
                vm.streamsource = vm.context.createMediaStreamSource(mediastream);
                rec = new Recorder(vm.streamsource, {numChannels: 1});
            })
            .catch(function (feh) {
                console.log('audio spaz', feh);
            });


        function createDownsampledLink(targetSampleRate) {
            rec.getBuffer(function(buf){
                audioService.resampleAudioBuffer(microphone.micContext,buf,targetSampleRate,function(thinggy){
                    //var url = thinggy.getFile();
                    //$scope.recording=$sce.trustAsResourceUrl(url);
                    
                    var blob = thinggy.getFile();
                    fileService.createFile(loginService.getLoggedinUserId(), blob).then(function(url) {
                        $scope.recording=$sce.trustAsResourceUrl(url);
                    });
                });
            });
        }

        vm.hasrecording = function() {
            return $scope.recording !== '';
        };

        vm.playrecturn = 'play';
        vm.begunrecording = false;
        $scope.playbackClass = 'activespeaker';
        $scope.recordClass = 'inactivespeaker';

        function spaceup () {
            // if already playing... then stop and switch to record mode
            if (vm.wsPlayback.isPlaying() && vm.playrecturn == 'play') {
                vm.playrecturn = 'record';
                microphone.play();
                $scope.playbackClass = 'inactivespeaker';
                $scope.recordClass = 'activespeaker';
                vm.wsPlayback.playPause();
                vm.isplaying=false;
                $scope.$apply();
                return;
            }
            // if not playing then we were recording, so go to play mode
            if (!vm.wsPlayback.isPlaying() && vm.playrecturn == 'record' ) {
                console.log('stopping record');
                rec.stop();
                vm.isrecording = false;

                microphone.pause();
                vm.wsRecord.empty();
                vm.playrecturn = 'play';
                $scope.playbackClass = 'activespeaker';
                $scope.recordClass = 'inactivespeaker';
                $scope.$apply();
            }
        }

        function spacedown () {
            // if we weren't playing already ...
            if (!vm.wsPlayback.isPlaying()) {
                if (vm.playrecturn === 'play') {

                    // if we have previously recorded a buffer, then make a segment now
                    if (vm.begunrecording) {
                        rec.getBuffer(function (buf) {
                            var reclength = buf[0].length;
                            makeSegment(reclength);
                        });
                    }

                    vm.wsPlayback.playPause();
                    vm.isplaying=true;
                    $scope.$apply();
                    return;
                }
                if (vm.playrecturn === 'record') {
                    vm.begunrecording = true;
                    $scope.recordClass = 'activerecord';
                    $scope.$apply();
                    vm.isrecording=true;
                    console.log('starting record');
                    rec.record();
                    $scope.$apply();
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
            "prevent_repeat"    :true
        });

        vm.save = function() {
            createDownsampledLink(config.sampleRate);
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
            $scope.recording = '';
        };

        vm.lastRec = 0;
        vm.lastPlay = 0;
        function makeSegment(recordpoint) {
            var rectime = Math.floor(recordpoint / (microphone.micContext.sampleRate/1000));
            console.log('rt',rectime);
            var playtime = Math.floor(vm.wsPlayback.getCurrentTime()*1000);
            vm.segments.push({
                'source': [vm.lastPlay, playtime],
                'respeak': [vm.lastRec, rectime]
            });
            vm.lastPlay = playtime;
            vm.lastRec = rectime;
            $scope.$apply();
        }

        $scope.$on('$destroy', function() {
            listener.destroy();
            vm.wsPlayback.destroy();
            vm.wsPlayback.destroy();
            if(rec)
                rec.clear();
        });

    };
    respeakDirectiveController.$inject = ['config', '$scope', '$window', '$attrs', 'loginService', 'audioService', 'dataService', 'fileService', '$sce'];

    //
    // RESPEAK2 DIRECTIVE
    //
    var respeak2DirectiveController = function ($timeout, config, $scope, keyService, $attrs, loginService, audioService, dataService, fileService, $sce) {
        var vm = this;
        vm.playBoxesEnabled = false;
        var recorder;           // recorder.js
        var ctrlKeyCode = 16;   // control key (16 is shift)
        var ffKeyCode = 39;     // right arrow
        var rwKeyCode = 37;     // left arrow
        var escKeyCode = 27;    // escape
        var skipTimeValue = 1;  // amount of time to skip backwards for rewind
        var ffPlaybackRate = 2; // playback speed in FF mode
        var minRegionLength = 1;
        var respeakAudioContext = new AudioContext();
        // Variables that record playin position, array of wavesurfer regions, segmentation map and more
        var recordedAudioBuffer = null;

        var lastAction = null;
        vm.isPlaying = false;
        vm.isRecording = false;
        vm.playrecturn = 'play';
        vm.begunrecording = false;
        vm.recordDisabled = true;
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
        vm.redo = escKey;

        var textStrings = ['RSPK_HELP1','RSPK_HELP2','RSPK_HELP3','RSPK_HELP4','RSPK_HELP5','RSPK_HELP6','RSPK_HELP7',''];
        vm.helpIdx = 0;
        vm.helpText = textStrings[vm.helpIdx];

        //
        // This is code which restores from a backend
        //
        // if we have saved data...
        if ($scope.respeakSegmap) {
            vm.segMap = $scope.respeakSegmap;
            var colcol = 1;
            vm.segMap.forEach(function(seg){
                if (colcol === 0) {colcol = 1;}
                else {colcol = 0;}
                var slen = seg.child_ms[1] - seg.child_ms[0] + 1;
                var coldat = {
                    colidx: colcol,
                    audioLength: slen
                };
                var hue = 198 + (colcol*40);
                var reg = wsPlayback.addRegion({
                    start: seg.source[0],
                    end: seg.source[1],
                    color: 'hsla('+hue+', 100%, 30%, 0.15)',
                    drag: false,
                    resize: false,
                    data: coldat
                });
                vm.regionList.push(reg);
            });
            vm.playIn = _.last(vm.regionList.end);
            var arrayBuffer;
            var fileReader = new FileReader();
            fileReader.onload = function() {
                arrayBuffer = this.result;
                recordedAudioBuffer = new Float32Array(arrayBuffer);
            };
        } else {
            vm.playIn = 0;
            vm.regionList = [];
            vm.segMap = [];
        }

        //
        // Set up Wavesurfer
        //
        var wsPlayback = WaveSurfer.create({
            backend: "WebAudio",
            container: "#respeakPlayback",
            normalize: true,
            hideScrollbar: false,
            scrollParent: true
        });
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
        wsPlayback.load($scope.source);
        // Register key bindings after wavesurfer is ready to play
        wsPlayback.on('ready', function() {
            // fancy new key handling service bound to <BODY> element, now we can handle left-right modifier keys
            keyService.regKey(ctrlKeyCode,'keydown', function(ev) {
                if (ev.location === 1) {leftKeyDown();}
                if (ev.location === 2) {rightKeyDown();}
            });
            keyService.regKey(ctrlKeyCode,'keyup', function(ev) {
                    if (ev.location === 1) {leftKeyUp();}
                    if (ev.location === 2) {rightKeyUp();}
            });
            keyService.regKey(ffKeyCode,'keydown',  function(ev) {ffKeyDown(ev);});
            keyService.regKey(ffKeyCode,'keyup',    function(ev) {ffKeyUp(ev);});
            keyService.regKey(rwKeyCode,'keydown',  function(ev) {rwKey(ev);});
            keyService.regKey(escKeyCode,'keydown', function(ev) {escKey(ev);});
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

        vm.playSegment = function(regidx) {
            var thisPosition = wsPlayback.getCurrentTime();
            disableRecording();
            wsPlayback.toggleInteraction();
            // segmap and regionlist have elements in the same order, we use the wavesurfer region for playback of the source
            var reg = vm.regionList[regidx];
            reg.play();
            wsPlayback.once('pause', function(){
                seekToTime(thisPosition);
                wsPlayback.toggleInteraction();
                var startpos = vm.segMap[regidx].child_samp[0];
                var endpos = vm.segMap[regidx].child_samp[1];
                audioService.playbackBuffer(respeakAudioContext, recordedAudioBuffer, startpos, endpos);
                //playbackAudio(reg.data.audio);
            });
        };

        // Most of these key handling functions will silently return if the user is holding another key
        // Note the order of setting the keydown status. We allow for people releasing keys before return, but we will not register keys down under simultaneous keypress conditions.
        // left key actions for playback
        function leftKeyDown() {
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
            wsPlayback.play(vm.playIn);
            lastAction = 'play';
            vm.isPlaying = true;
            recorder.clear();
            $scope.$apply();
        }
        function leftKeyUp() {
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
            $scope.$apply();
        }
        vm.playDown = leftKeyDown;
        vm.playUp = leftKeyUp;
        // right key actions for playback
        function rightKeyDown() {
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
            $scope.$apply();
        }
        function rightKeyUp() {
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
            $scope.$apply();
        }
        vm.recDown = rightKeyDown;
        vm.recUp = rightKeyUp;
        // fast forward key triggers playback at ffPlaybackRate times normal speed
        // We can also use this to create different region entry points, e.g. skip content we don't wish to respeak.
        function ffKeyDown() {
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
            $scope.$apply();
        }
        function ffKeyUp() {
            vm.ffKeyDown = false;
            if (vm.leftKeyDown || vm.rightKeyDown) {return;}  // Block multiple keys
            wsPlayback.pause();
            wsPlayback.setPlaybackRate(1);
        }
        // rewind key just jumps the cursor back 1 second each time. No playback.
        function rwKey() {
            disableRecording();
            var thistime =  wsPlayback.getCurrentTime();
            console.log('tt',thistime,vm.playIn);
            if ((thistime-skipTimeValue) < vm.playIn) {
                seekToPlayin();
            } else {
                wsPlayback.skipBackward(skipTimeValue);
            }
            $scope.$apply();
        }

        //
        // DELETE LAST REGION
        //
        // escape key to undo last region - currently infinite length
        // after removing a region, update the UI
        function escKey() {
            deleteLastRegion();
            updateHelpText();
            $scope.$apply();
        }

        // delete the last audio, remove the wavesurfer region, seek to playIn, disable recording and make a new Segmap
        function deleteLastRegion() {
            if (vm.regionList.length) {
                // if this is not the case, then the user is undoing a region that doesn't have recorded data yet.
                if (vm.segMap.length === vm.regionList.length) {
                    deleteLastAudio();
                }
                var reg = vm.regionList.pop();
                reg.remove();
                if (vm.regionList.length) {
                    vm.playIn = _.last(vm.regionList).end;
                } else {
                    vm.playIn = 0;
                }
                seekToPlayin();
                disableRecording();
                // this is so we don't start moving a record-mode region!
                lastAction = 'delete';
                makeSegmap(); // update the Segmap
            }
        }

        function deleteLastAudio() {
            if (!vm.segMap.length) {return;}
            var start = _.last(vm.segMap).child_samp[0];
            var end = _.last(vm.segMap).child_samp[1];
            recordedAudioBuffer = audioService.chopFromArray(recordedAudioBuffer, ((end - start) + 1));
            saveToBackend();
        }

        //
        // MAKE NEW REGION
        //

        // let's make a region when we begin playing (it'll be green at first)
        function makeNewRegion(starttime) {
            // this stuff just alternates which we use to colour when the region switches to record mode
            if (vm.regionList.length) {
                var colidx = _.last(vm.regionList).data.colidx;
            } else {
                var colidx = 1;
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
            if (vm.helpIdx == (textStrings.length-1)) {return;}
            ++vm.helpIdx;
            vm.helpText = textStrings[vm.helpIdx];
        }
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
            var newBlob = audioService.arrayToBlob(recordedAudioBuffer,1,config.sampleRate);
            var fileURL = URL.createObjectURL(newBlob);
            vm.recordingFile=$sce.trustAsResourceUrl(fileURL);
            vm.hasRecording = true;
        }

        //
        // This is called every time there is data to be saved
        //
        function saveToBackend() {
            var newBlob = audioService.arrayToBlob(recordedAudioBuffer,1,config.sampleRate);
            var fileURL = URL.createObjectURL(newBlob);
            // 1. do something with this fileURL
            
            // 2. do something with vm.segMap
        }


        // on navigating away, clean up the key events, wavesurfer instances and clear recorder data (it has no destroy method)
        $scope.$on('$destroy', function() {
            keyService.clearAll();
            wsPlayback.destroy();
            wsRecord.destroy();
            if(recorder) {recorder.clear();}
        });
    };
    respeak2DirectiveController.$inject = ['$timeout', 'config', '$scope', 'keyService', '$attrs', 'loginService', 'audioService', 'dataService', 'fileService', '$sce'];

})();
