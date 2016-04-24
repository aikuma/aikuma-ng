/**
 * Created by Mat on 9/03/2016.
 */
(function(){
    'use strict';
    angular
        .module('aikuma-annotation', [])
        .directive("aikumaAnno", function() {
            return {
                restrict: "E",
                templateUrl: "views/templates/newanno-template.html",
                scope: true,
                controller: ngAnnoController,
                controllerAs: 'annoC'
            };
        });

        var ngAnnoController = function (config, annoServ, $scope, keyService, aikumaService, $timeout, $mdDialog, aikumaDialog, $translate, audioService) {
            var vm = this;
            $scope.onlineStatus = aikumaService;
            $scope.$watch('onlineStatus.isOnline()', function(online) {
                vm.onlineStatus = online;
            });
            // set up play rate defaults based on the user preference for enabling time stretching
            if ($scope.userObj.data.preferences.timeStretchSrc) {
                vm.timestretchEnabled = true;
                annoServ.timestretechEnabled = true;
                vm.playRate = 80;
            } else {
                vm.playRate = 100;
            }
            // region status flags
            vm.r = annoServ.r;
            vm.cursor = annoServ.cursor;
            vm.playCSS = {};
            // keyboard related constants
            vm.playKeyCode = 17;   // control key (16 is shift)
            vm.ffKeyCode = 39;     // right arrow
            vm.rwKeyCode = 37;     // left arrow
            vm.escKeyCode = 27;    // escape
            vm.switchTrackCode = 9; // tab
            vm.prevAnnoCode = 38;  // up arrow
            vm.nextAnnoCode = 40;  // down arrow
            vm.voiceCode = 220;     // backslash key
            vm.skipTimeValue = 3;  // amount of time to skip backwards for rewind
            vm.oneMillisecond = 0.001;
            vm.ffPlaybackRate = 2.5; // playback speed in FF mode
            // used for guarding against multiple key presses
            vm.playKeyDownStat = false;
            vm.ffKeyDownStat = false;
            vm.isPlaying = false;
            vm.selAnno = {};
            vm.debug = function() { return config.debug; };

            // More view model settings
            vm.annoSettings = {};   // what source audio to play, looping, enabled or disabled etc
            vm.languageNames = {};  // constructed from short codes
            vm.annotations = $scope.annotationObjList;
            
            var annotateAudioContext = new AudioContext();
            audioService.initVoiceRecog();

            //
            // Called from View HTML
            //
            vm.toggleAnnoSetting = function(annoIdx, setting) {
                vm.annoSettings[annoIdx][setting] = !vm.annoSettings[annoIdx][setting];
                vm.restoreFocus();
            };

            vm.toggleAnnoCfg = function(trackKey, idx, setting) {
                vm.tracks[trackKey].annos[idx].cfg[setting] = !vm.tracks[trackKey].annos[idx].cfg[setting];
                vm.restoreFocus();
            };

            //
            // KEY HANDLING
            //
            vm.playKeyDown = function(nokey) {
                if (vm.ffKeyDownStat) {return;}  // Block multiple keys
                vm.playKeyDownStat = true;
                // if we have been making a region (we can assume this is repeat press) then re-play
                if (vm.r.regionMarked) {
                    vm.isPlaying = true;
                    annoServ.wavesurfer.setPlaybackRate(vm.playRate/100);
                    annoServ.wavesurfer.play(annoServ.playIn);
                } else {
                    if (vm.cursor[vm.r.tk] > -1) {
                        // the service works out what audio is appropriate to play (which is why we pass the settings object
                        annoServ.wavesurfer.setPlaybackRate(vm.playRate/100);
                        vm.playAudio();
                    } else {
                        vm.isPlaying = true;
                        var thisTime = annoServ.wavesurfer.getCurrentTime();
                        thisTime = Math.round(thisTime*1000)/1000;
                        if (thisTime >= annoServ.playIn) {
                            annoServ.makeNewRegion(thisTime);
                            vm.r.regionMarked = true;
                            vm.cursor[vm.r.tk] = annoServ.regionList.length - 1;
                        }
                        annoServ.wavesurfer.setPlaybackRate(vm.playRate/100);
                        annoServ.wavesurfer.play();
                        vm.restoreFocus();
                    }
                }
                if (nokey) {$scope.$apply();}
            };

            vm.playKeyUp = function(nokey) {
                vm.playKeyDownStat = false;
                if (vm.ffKeyDownStat) {return;}  // Block multiple keys
                if (vm.isPlaying) {
                    vm.isPlaying = false;
                    annoServ.wavesurfer.pause();
                }
            };

            vm.ffKeyDown = function(nokey) {
                if (vm.playKeyDownStat) {return;}  // Block multiple keys
                vm.ffKeyDownStat = true;
                if (vm.r.regionMarked) {
                    annoServ.deleteLastRegion();
                    vm.cursor[vm.r.tk] = -1;
                }
                if (vm.cursor[vm.r.tk] > -1)  {
                    if (vm.cursor[vm.r.tk] === (annoServ.regionList.length -1)) {
                        vm.cursor[vm.r.tk] = -1;
                        annoServ.seekToTime(annoServ.playIn);
                    } else {
                        // seek to next region, curRegion will auto update
                        annoServ.seekToTime(annoServ.regionList[vm.cursor[vm.r.tk] +1 ].start);
                    }
                } else {
                    if (annoServ.wavesurfer.getCurrentTime() === 0 && annoServ.regionList.length > 0) {
                        annoServ.seekToTime(annoServ.regionList[0].start);
                    } else {
                        annoServ.wavesurfer.setPlaybackRate(vm.ffPlaybackRate);
                        annoServ.wavesurfer.play();
                    }
                }
                if (nokey) {$scope.$apply();}
            };

            vm.ffKeyUp = function(nokey) {
                vm.ffKeyDownStat = false;
                if (vm.playKeyDownStat) {return;}  // Block multiple keys
                if (annoServ.wavesurfer.isPlaying()) {
                    annoServ.wavesurfer.pause();
                    vm.cursor[vm.r.tk] = annoServ.getRegionFromTime();
                }
            };

            vm.rwKey = function(nokey) {
                if (vm.r.regionMarked) {
                    annoServ.deleteLastRegion();
                    vm.cursor[vm.r.tk] = -1;
                }
                var thisTime = annoServ.wavesurfer.getCurrentTime();
                thisTime = Math.round(thisTime*1000)/1000;
                // We are in a region so navigate between regions
                if (vm.cursor[vm.r.tk] > -1) {
                    // if we are part way through a region, just go back to the start
                    if (thisTime > annoServ.regionList[vm.cursor[vm.r.tk]].start) {
                        annoServ.seekToTime(annoServ.regionList[vm.cursor[vm.r.tk]].start);
                        vm.restoreFocus();
                    } else {
                        if (vm.cursor[vm.r.tk] === 0) {
                            if (thisTime > 0) { // we want to rewind past 0 but the first region doesn't start at 0
                                vm.cursor[vm.r.tk] = -1;
                                annoServ.seekToTime(Math.max(0, (thisTime - vm.skipTimeValue)));
                                return;
                            } else {
                                // if we are at the start, do nothing
                                return;
                            }
                        }
                        annoServ.seekToTime(annoServ.regionList[vm.cursor[vm.r.tk] - 1].start);
                        vm.restoreFocus();
                    }
                } else {
                    // In this case, we are in unmarked territory so check to see if we end up seeking into a region
                    if (thisTime === 0) {return;}
                    var wantSeek = Math.max(0, (thisTime - vm.skipTimeValue));
                    var seekRegion = _.findLastIndex(annoServ.regionList, function(reg){
                        return (wantSeek <= reg.end);
                    });
                    if (seekRegion > -1) { // if so, seek to the start of that
                        annoServ.seekToTime(annoServ.regionList[seekRegion].start);
                        vm.restoreFocus();
                    } else {
                        annoServ.seekToTime(wantSeek); // otherwise just skip back as planned
                    }
                }
                if (nokey) {$scope.$apply();}
            };

            vm.escKey = function(nokey) {
                if (vm.hasAudio(vm.r.tk)) {
                    $translate('AUDIO_NODEL').then(function (message) {
                        aikumaDialog.toast(message);
                    });
                    return;
                }
                annoServ.deleteLastRegion();
                vm.cursor[vm.r.tk] = annoServ.getRegionFromTime();
            };

            vm.switchAnnoKey = function(reverse) {
                var spos = vm.getNextAnno(vm.selAnno[vm.r.tk], reverse);
                if (spos > -1) {
                    vm.selAnno[vm.r.tk] = spos;
                    vm.restoreFocus();
                }
            };


            // cycle to next track (on tab)
            vm.switchTrackKey = function(nokey) {
                var numtracks = vm.tracks.list.length;
                var tpos = vm.tracks.list.indexOf(vm.r.tk);
                var found = false;
                while (!found) {
                    ++tpos;
                    if (tpos === numtracks) {tpos = 0;}
                    if (tpos === vm.tracks.list.indexOf(vm.r.tk)) {return;}
                    if (vm.tracks[vm.tracks.list[tpos]].hasAnno) {found=true;}
                }
                if (found) {
                    vm.selectTrack(vm.tracks.list[tpos]);
                }
            };

            
            //
            vm.voiceRecogActive = false;
            vm.voiceInputKey = function(nokey) {
                if (!vm.onlineStatus) {
                    $translate('OFFLINE_MSG').then(function (message) {
                        aikumaDialog.toast(message);
                    });
                    return;
                }
                if (vm.cursor[vm.r.tk] !== -1) {
                    var tt = vm.tracks[vm.r.tk];
                    var langCode = tt.annos[vm.selAnno[vm.r.tk]].cfg.voice.code;
                    var recogFinished = function(text_final) {
                        vm.voiceRecogActive = false;
                        tt.annos[vm.selAnno[vm.r.tk]].text[vm.cursor[vm.r.tk]] = text_final;
                        $scope.$apply();
                    };
                    var recogUpdate = function(text_final, text_temp) {
                        tt.annos[vm.selAnno[vm.r.tk]].text[vm.cursor[vm.r.tk]] = text_temp;
                        $scope.$apply();
                    };
                    vm.voiceRecogActive = true;
                    audioService.startVoiceRecog(langCode, recogUpdate, recogFinished);
                    if (nokey) {$scope.$apply();}
                }

            };
   

            //
            // START UP
            //
            // Set up wavesurfer
            // callback registers hotkeys and switches to the selected annotation
            annoServ.initialize($scope.audioSourceUrl, $scope.annotationObjList, $scope.sessionObj, $scope.secondaryList, $scope.userObj, function() {
                vm.setupKeys();
                vm.tracks = annoServ.tracks;                // array of objects per respeak/translate
                vm.tracks.audio = annoServ.tracks.audio;
                vm.tracks.list = annoServ.tracks.list;
                var axn = $scope.annotationObjList.filter(function(an){return an.data._ID === $scope.selectedAnno;});
                vm.r.tk = axn[0].data.segment.sourceSegId;  // initial selected anno's sourceSegment
                vm.selAnno[vm.r.tk] = _.findIndex(annoServ.tracks[vm.r.tk].annos, function(a) {return a.id === $scope.selectedAnno;});  // index of anno in a track
                annoServ.switchToTrack(vm.r.tk);
                if (annoServ.regionList.length) {
                    vm.cursor[vm.r.tk] = 0;
                    annoServ.seekRegion(0);
                    vm.restoreFocus();
                } else {
                    vm.cursor[vm.r.tk] = -1;
                }
                 $scope.$apply();
            });

            //
            // FUNCTIONS BOUND TO VIEW MODEL
            //

            vm.selectAnno = function(annoIdx) {
                if (annoIdx !== vm.selAnno[vm.r.tk]) {
                    vm.selAnno[vm.r.tk] = annoIdx;
                    //vm.cursor[vm.r.tk] = annoServ.getRegionFromTime();
                }
            };
            vm.openMenu = function($mdOpenMenu, ev) {
                $mdOpenMenu(ev);
            };
            vm.inputReturn = function(annoIdx) {
                annoServ.saveAnnotation(annoIdx);
                // if this is a brand new region, then just complete it
                if (vm.r.regionMarked) {
                    for(var i = 0; i < vm.tracks[vm.r.tk].annos.length; i++) {
                        annoServ.saveAnnotation(i);
                    }
                    annoServ.markLastRegionComplete();
                    vm.r.regionMarked = false;
                    annoServ.seekToTime(annoServ.regionList[vm.cursor[vm.r.tk]].end + 0.001);
                    vm.cursor[vm.r.tk] = -1;
                    return;
                }
                // If it's not a new region, we have some complex behavior depending on position
                // and enabled annotations. First, search for next active annotations
                // Change focus to the next enabled annotation
                var spos = vm.getNextAnno(annoIdx);
                var found = spos > -1;
                var cycled = spos < annoIdx;
                // If there's an annotation at this position, just go to that one
                if (found && !cycled) {
                    vm.selAnno[vm.r.tk] = spos;
                    vm.restoreFocus();
                    return;
                }
                // In all following cases, we are advancing the region
                if (vm.cursor[vm.r.tk] === (annoServ.regionList.length -1)) {
                    // but in this case there are no more regions so move to new space
                    annoServ.seekToTime(annoServ.regionList[vm.cursor[vm.r.tk]].end + 0.001);
                    vm.cursor[vm.r.tk] = -1;
                } else {
                    // just move on
                    ++vm.cursor[vm.r.tk];
                    annoServ.seekToTime(annoServ.regionList[vm.cursor[vm.r.tk]].start);
                }
                // finally, if we advanced but found a different active anno, then switch to that one
                if (found && cycled) {
                    vm.selAnno[vm.r.tk] = spos;
                    vm.restoreFocus();
                }
            };

            vm.getNextAnno = function(annoIdx, reverse) {
                reverse = typeof reverse !== 'undefined' ? reverse : false;
                // Change focus to the next enabled annotation
                var alen = vm.tracks[vm.r.tk].annos.length;
                var spos = annoIdx;
                var found = false;
                var cycled = false;
                while (!found) {
                    if (reverse) {--spos;}
                    else {++spos;}
                    if (reverse && (spos < 0)) {
                        spos = alen -1;
                        cycled = true;
                    }
                    if (!reverse && (spos === alen)) {
                        spos = 0;
                        cycled = true;
                    }
                    if (spos === vm.selAnno[vm.r.tk]) {break;}
                    if (vm.tracks[vm.r.tk].annos[spos].cfg.enabled) {return spos;}
                }
                return -1;
            };

            vm.help = function(ev) {
                aikumaDialog.help(ev, 'annotate');
            };
            // Handle clicks on transcript line
            vm.selectRegion = function(region) {
                vm.cursor[vm.r.tk] = region;
                vm.playAudio();
                vm.restoreFocus();
            };

            vm.playAudio = function() {
                var timerval = 0;
                var selAnno = vm.selAnno[vm.r.tk];
                var region =  vm.cursor[vm.r.tk];
                var thisTrack = vm.tracks[vm.r.tk];
                // someone might trigger play during a FF/RW
                if (!vm.tracks[vm.r.tk].annos[selAnno].cfg.playSrc && !vm.tracks[vm.r.tk].annos[selAnno].cfg.playSec) {
                    $translate('AUDIO_NOSEL').then(function (trans) {
                        aikumaDialog.toast(trans);
                    });
                    return;
                }
                if (vm.tracks[vm.r.tk].annos[selAnno].cfg.playSrc) {
                    annoServ.wavesurfer.setPlaybackRate(
                        vm.tracks[vm.r.tk].annos[selAnno].cfg.timestretchSrc ? (vm.playRate/100) : 1
                    );
                    annoServ.regionList[region].play();
                    annoServ.regionPlayback = true;
                    timerval = ((annoServ.regionList[region].end - annoServ.regionList[region].start) * (100/vm.playRate)) + 0.2;
                }
                // This timeout occurs when playback has finished.
                $timeout(function(){
                    if (thisTrack.annos[selAnno].cfg.playSec && thisTrack.hasAudio && (region < thisTrack.segMsec.length)) {
                        var seglist = thisTrack.segMsec;
                        var fileh = $scope.userObj.getFileUrl(thisTrack.audioFile);
                        var playtrack = vm.r.tk; // keep this in case it changes when we try to unset
                        vm.playCSS[vm.r.tk] = true;
                        $scope.$apply();
                        var secPlayRate =  vm.tracks[vm.r.tk].annos[selAnno].cfg.timestretchSec ? (vm.playRate/100) : 1;
                        audioService.playbackLocalFile(annotateAudioContext, fileh, seglist[region][0], seglist[region][1], function () {
                            console.log('finished');
                            vm.playCSS[playtrack] = false;
                            $scope.$apply();
                        }, secPlayRate);
                    } else {
                        //
                    }
                }, timerval*1000);

            };
            //
            // Utility stuff
            //
            vm.setupKeys = function() {
                keyService.regKey(vm.playKeyCode, 'keydown', function () {
                    vm.playKeyDown(true);
                });
                keyService.regKey(vm.playKeyCode, 'keyup', function () {
                    vm.playKeyUp(true);
                });
                keyService.regKey(vm.ffKeyCode, 'keydown', function () {
                    vm.ffKeyDown(true);
                });
                keyService.regKey(vm.ffKeyCode, 'keyup', function () {
                    vm.ffKeyUp(true);
                });
                keyService.regKey(vm.rwKeyCode, 'keydown', function () {
                    vm.rwKey(true);
                });
                keyService.regKey(vm.escKeyCode, 'keydown', function () {
                    vm.escKey(true);
                });
                keyService.regKey(vm.prevAnnoCode, 'keydown', function () {
                    vm.switchAnnoKey(true); // search in reverse
                });
                keyService.regKey(vm.nextAnnoCode, 'keydown', function () {
                    vm.switchAnnoKey(false); // search forwards
                });
                keyService.regKey(vm.switchTrackCode, 'keydown', function () {
                    vm.switchTrackKey(true);
                });
                keyService.regKey(vm.voiceCode, 'keydown', function () {
                    vm.voiceInputKey(true);
                });
                
            };
            vm.selectTrack = function(track) {
                if (vm.r.tk !== track) {
                    vm.r.tk = track;
                    if (!vm.selAnno[vm.r.tk]) {vm.selAnno[vm.r.tk]=0;}
                    annoServ.switchToTrack(track);
                    if(annoServ.regionList && annoServ.regionList.length > 0) {
                        if (vm.cursor[vm.r.tk] > -1) {
                            annoServ.seekToTime(annoServ.regionList[vm.cursor[vm.r.tk]].start);
                        }
                    }
                    else
                        annoServ.seekToTime(0);
                    vm.restoreFocus(100); // this takes a while so let's chillax on setting focus for 100ms
                }
            };
            vm.joinTrackConf = function(ev, track, aIdx, strack) {
                if (vm.tracks[track].annos[aIdx].text.length > 0) {
                    var type = 'respeak';
                    $translate(['ANNO_EXIST', 'ANNO_REMCONF', 'ANNO_DELNO', 'USE_RSPK', 'USE_TRANS']).then(function (translations) {
                        var okaytext;
                        switch (type) {
                            case 'respeak':
                                okaytext = translations.USE_RSPK;
                                break;
                            case 'translate':
                                okaytext = translations.USE_TRANS;
                                break;
                        }
                        var confirm = $mdDialog.confirm()
                            .title(translations.ANNO_EXIST)
                            .textContent(translations.ANNO_REMCONF)
                            .ariaLabel('Delete annotations')
                            .targetEvent(ev)
                            .ok(okaytext)
                            .cancel(translations.ANNO_DELNO);
                        $mdDialog.show(confirm).then(function () {
                            vm.joinAndMove(track, aIdx, strack);
                        }, function() {
                            // no more chicken sound!
                        });

                    });
                } else {
                    vm.joinAndMove(track, aIdx, strack);
                }
            };

            // Execute the join track and then switch track to the track we joined
            vm.joinAndMove = function(track, aIdx, strack) {
                vm.r.tk = strack;
                vm.selAnno[vm.r.tk] = annoServ.joinTrack(track, aIdx, strack);
                annoServ.switchToTrack(vm.r.tk);
                vm.restoreFocus();
            };
            //
            vm.splitTrack = function(ev, track, aIdx) {
                $translate(['TRACK_NEWCONF', 'TRACK_NEW', 'ANNO_DELNO', 'TRACK_SPLITCONF']).then(function (translations) {
                    var confirm = $mdDialog.confirm()
                        .title(translations.TRACK_SPLITCONF)
                        .textContent(translations.TRACK_NEWCONF)
                        .ariaLabel('Switch to new track')
                        .targetEvent(ev)
                        .ok(translations.TRACK_NEW)
                        .cancel(translations.ANNO_DELNO);
                    $mdDialog.show(confirm).then(function () {
                        //
                        annoServ.trackSplit(track, aIdx);
                        vm.selAnno[vm.r.vt] = 0;
                    }, function() {
                        // no more chicken sound!
                    });
                });
            };

            // used in the UI for greying out audio track button
            vm.hasAudio = function(track) {
                var thisT = vm.tracks[track];
                if (!thisT.hasAudio || track !== vm.r.tk) {return false;}
                if (vm.cursor[vm.r.tk] > (thisT.segMsec.length - 1)) {return false;}
                return true;
            };
            // used for simple loop in trnscript
            vm.getRegions = function() {
                return new Array(annoServ.regionList.length);
            };
            //
            vm.padOut = function(annotext) {
              if (annotext === null || annotext === '') {
                  annotext = ' ';
              }
                return annotext;
            };
            // Test to see if there's something to export
            vm.canExport = function() {
                if (!vm.r.tk) {return false;}
                if(vm.tracks) {
                    return vm.tracks[vm.r.tk].annos.some(function(thisanno){
                        return (thisanno.cfg.enabled && (thisanno.text.length > 0));
                    });
                } else {
                    return false;
                }
            };
            
            // Send the segmentation and an array of annotations to the WebVTT exporter
            vm.export = function(format) {
                var segs = $scope.sessionObj.data.segments[vm.r.tk];
                var annolist = [];
                var trackannos = vm.tracks[vm.r.tk].annos;
                trackannos.forEach(function(thisanno){
                    if (thisanno.cfg.enabled) {
                        annolist.push(thisanno.text);
                    }
                });
                vm.vtt = aikumaService.exportAnno(segs, annolist, format);
            };

            vm.setVoiceRecogLang = function(ev, track, annoidx) {
                var vcfg = vm.tracks[track].annos[annoidx].cfg.voice;
                aikumaDialog.voiceCfg(ev, vcfg, function(rcfg) {
                    vm.tracks[track].annos[annoidx].cfg.voice = rcfg;
                });
            };

            vm.restoreFocus = function(delay) {
                delay = typeof delay !== 'undefined' ? delay : 0;
                $timeout(function() {
                    var selAnno = vm.selAnno[vm.r.tk];
                    $scope.$broadcast(vm.tracks[vm.r.tk].annos[selAnno].id);
                }, delay);
            };
            // on navigating away, clean up the key events, wavesurfer instances
            $scope.$on('$destroy', function() {
                annoServ.destroyAll();
                annotateAudioContext.close();
            });
            
            // debug stuff
            vm.getplayin = function() {
                return annoServ.playIn;
            };

        };
    ngAnnoController.$inject = ['config', 'annoServ', '$scope', 'keyService', 'aikumaService', '$timeout', '$mdDialog', 'aikumaDialog', '$translate', 'audioService'];

})();
