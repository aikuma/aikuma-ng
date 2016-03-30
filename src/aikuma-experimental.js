/**
 * Created by Mat on 9/03/2016.
 */
(function(){
    'use strict';
    angular
        .module('aikuma-experimental', [])
        .directive("aikumaAnno", function() {
            return {
                restrict: "E",
                templateUrl: "views/templates/newanno-template.html",
                scope: true,
                controller: ngAnnoController,
                controllerAs: 'annoC'
            };
        });

        var ngAnnoController = function (annoServ, $scope, keyService, aikumaService, $timeout, $mdDialog, aikumaDialog, $translate, audioService) {
            var vm = this;
            // region status flags
            vm.r = annoServ.r;
            vm.cursor = annoServ.cursor;
            vm.playCSS = {};

            // keyboard related constants
            vm.playKeyCode = 17;   // control key (16 is shift)
            vm.ffKeyCode = 39;     // right arrow
            vm.rwKeyCode = 37;     // left arrow
            vm.escKeyCode = 27;    // escape
            vm.ffPlaybackRate = 2.5; // playback speed in FF mode
            vm.skipTimeValue = 3;  // amount of time to skip backwards for rewind
            vm.oneMillisecond = 0.001;
            // used for guarding against multiple key presses
            vm.playKeyDownStat = false;
            vm.ffKeyDownStat = false;
            vm.isPlaying = false;

            // More view model settings
            vm.annoSettings = {};   // what source audio to play, looping, enabled or disabled etc
            vm.languageNames = {};  // constructed from short codes
            vm.annotations = $scope.annotationObjList;
            
            var annotateAudioContext = new AudioContext();

            //
            // Called from View HTML
            //
            vm.toggleAnnoSetting = function(annoIdx, setting) {
                vm.annoSettings[annoIdx][setting] = !vm.annoSettings[annoIdx][setting];
                vm.restoreFocus();
            };

            vm.toggleAnnoCfg = function(trackKey, idx, setting) {
                console.log(trackKey, idx);
                vm.tracks[trackKey].annos[idx].cfg[setting] = !vm.tracks[trackKey].annos[idx].cfg[setting];
                vm.restoreFocus();
            };

            //
            // KEY HANDLING
            //
            vm.playKeyDown = function(nokey) {
                if (vm.ffKeyDownStat) {return;}  // Block multiple keys
                console.log('play key');
                vm.playKeyDownStat = true;
                vm.isPlaying = true;
                // if we have been making a region (we can assume this is repeat press) then re-play
                if (vm.r.regionMarked) {
                    annoServ.wavesurfer.play(annoServ.playIn);
                } else {
                    console.log(vm.cursor[vm.r.tk]);
                    if (vm.cursor[vm.r.tk] > -1) {
                        // the service works out what audio is appropriate to play (which is why we pass the settings object
                        vm.playAudio();
                    } else {
                        console.log('start new region');
                        var thisTime = annoServ.wavesurfer.getCurrentTime();
                        thisTime = Math.round(thisTime*1000)/1000;
                        annoServ.makeNewRegion(thisTime);
                        vm.r.regionMarked = true;
                        vm.cursor[vm.r.tk] = annoServ.regionList.length - 1;
                        annoServ.playIn = thisTime;
                        annoServ.wavesurfer.play();
                        vm.restoreFocus();
                    }
                }
                if (nokey) {$scope.$apply();}
            };

            vm.playKeyUp = function(nokey) {
                vm.playKeyDownStat = false;
                if (vm.ffKeyDownStat) {return;}  // Block multiple keys
                if (vm.r.regionMarked) {
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

                    annoServ.wavesurfer.setPlaybackRate(vm.ffPlaybackRate);
                    annoServ.wavesurfer.play();
                }
                if (nokey) {$scope.$apply();}
            };

            vm.ffKeyUp = function(nokey) {
                vm.ffKeyDownStat = false;
                if (vm.playKeyDownStat) {return;}  // Block multiple keys
                if (annoServ.wavesurfer.isPlaying()) {
                    annoServ.wavesurfer.pause();
                    annoServ.wavesurfer.setPlaybackRate(1);
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
                annoServ.deleteLastRegion();
            };

            //
            // START UP
            //
            // Selected annotation is what we will start on, also enable that annotation

            vm.selectedAnno = _.findIndex($scope.annotationObjList, function(anno) {
                return anno.data._ID === $scope.selectedAnno;
            });

            // Find secondary audio and build a source list that will be used in the UI as 'tracks'

            // Set up wavesurfer
            // callback registers hotkeys and switches to the selected annotation
            annoServ.initialize($scope.audioSourceUrl, $scope.annotationObjList, $scope.sessionObj, $scope.secondaryList, $scope.userObj, function() {
                vm.setupKeys();
                vm.tracks = annoServ.tracks;
                vm.tracks.audio = annoServ.tracks.audio;
                vm.tracks.list = annoServ.tracks.list;
                //annoServ.switchToAnno(vm.selectedAnno, vm.audioSourceList);
                var axn = $scope.annotationObjList.filter(function(an){return an.data._ID === $scope.selectedAnno;});
                vm.r.tk = axn[0].data.segment.sourceSegId;
                console.log('sa', vm.r.tk);
                annoServ.switchToTrack(vm.r.tk);
                if (annoServ.regionList.length) {
                    annoServ.seekToTime(annoServ.regionList[0].start);
                } else {
                    vm.cursor[vm.r.tk] = -1;
                }
                vm.restoreFocus();
                $scope.$apply();
            });

            //
            // FUNCTIONS BOUND TO VIEW MODEL
            //
            // nuclear option, user wishes to clear all annotation data

            vm.copyTrackConf = function(ev, annoIdx, trackIdx) {
                if (vm.annoSettings[annoIdx].hasAnnos) {
                    var type = 'respeak';
                    $translate(['ANNO_EXIST', 'ANNO_DELCONF1', 'ANNO_DELCONF2', 'ANNO_DELNO', 'USE_RSPK', 'USE_TRANS']).then(function (translations) {
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
                            .textContent(translations.ANNO_DELCONF1)
                            .ariaLabel('Delete annotations')
                            .targetEvent(ev)
                            .ok(okaytext)
                            .cancel(translations.ANNO_DELNO);
                        $mdDialog.show(confirm).then(function () {
                            vm.copyTrack(annoIdx, trackIdx);
                            vm.cursor[vm.r.tk] = 0;
                            annoServ.wavesurfer.seekTo(0);
                            $scope.$apply();
                        });
                    });
                } else {
                    vm.copyTrack(annoIdx, trackIdx);
                    vm.cursor[vm.r.tk] = 0;
                    annoServ.wavesurfer.seekTo(0);
                }
            };

            vm.copyTrack = function(annoIdx, trackIdx) {
                annoServ.copySegment(annoIdx, vm.audioSourceList[trackIdx].id, vm.audioSourceList[trackIdx].coldat);
                vm.annoSettings[annoIdx].selectedTrack = trackIdx;
                vm.annoSettings[annoIdx].enabled = true;
                vm.annoSettings[annoIdx].hasCopied = true;
                vm.annoSettings[annoIdx].hasAnnos = true;
                vm.selectedAnno = annoIdx;
                vm.restoreFocus();
            };

            vm.selectAnno = function(annoIdx) {
                if (annoIdx != vm.selectedAnno) {
                    vm.selectedAnno = annoIdx;
                    //vm.cursor[vm.r.tk] = annoServ.getRegionFromTime();
                }
            };
            vm.openMenu = function($mdOpenMenu, ev) {
                $mdOpenMenu(ev);
            };
            vm.inputReturn = function(annoIdx) {
                if (vm.r.regionMarked) {
                    annoServ.markLastRegionComplete();
                    vm.r.regionMarked = false;
                    vm.cursor[vm.r.tk] = -1;
                } else {
                    if (vm.cursor[vm.r.tk] === (annoServ.regionList.length -1)) {
                        annoServ.seekToTime(annoServ.regionList[vm.cursor[vm.r.tk]].end + 0.001);
                        vm.cursor[vm.r.tk] = -1;
                    } else {
                        ++vm.cursor[vm.r.tk];
                        annoServ.seekRegion(vm.cursor[vm.r.tk]);
                    }
                }
                annoServ.saveAnnotation(annoIdx);
            };

            vm.help = function(ev) {
                aikumaDialog.help(ev, 'annotate');
            };

            vm.getRL = function() {
                return annoServ.regionList.length;
            };
            
            vm.selectRegion = function(region) {
                vm.cursor[vm.r.tk] = region;
                vm.playAudio();
            };

            vm.playAudio = function() {
                var timerval = 0;
                var region =  vm.cursor[vm.r.tk];
                if (vm.tracks[vm.r.tk].annos[vm.selectedAnno].cfg.playSrc) {
                    annoServ.regionList[region].play();
                    annoServ.regionPlayback = true;
                    timerval = (annoServ.regionList[region].end - annoServ.regionList[region].start) + 0.2;
                }
                if (vm.tracks[vm.r.tk].annos[vm.selectedAnno].cfg.playSrc && vm.tracks[vm.r.tk].hasAudio) {
                    $timeout(function(){
                        var seglist = vm.tracks[vm.r.tk].segMsec;
                        var fileh = $scope.userObj.getFileUrl(vm.tracks[vm.r.tk].audioFile);
                        vm.playCSS[vm.r.tk] = true;
                        $scope.$apply();
                        audioService.playbackLocalFile(annotateAudioContext, fileh, seglist[region][0], seglist[region][1], function () {
                            console.log('finished');
                            vm.playCSS[vm.r.tk] = false;
                            $scope.$apply();
                        });

                    }, timerval*1000);
                }
            };
            //
            // Utility horseshit
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
            };
            vm.selectTrack = function(track) {
                if (vm.r.tk !== track) {
                    vm.r.tk = track;
                    annoServ.switchToTrack(track);
                }
                vm.restoreFocus();
            };
            vm.joinTrackConf = function(ev, track, aIdx, strack) {
                if (vm.tracks[track].annos[aIdx].text.length > 0) {
                    var type = 'respeak';
                    $translate(['ANNO_EXIST', 'ANNO_DELCONF1', 'ANNO_DELCONF2', 'ANNO_DELNO', 'USE_RSPK', 'USE_TRANS']).then(function (translations) {
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
                            .textContent(translations.ANNO_DELCONF1)
                            .ariaLabel('Delete annotations')
                            .targetEvent(ev)
                            .ok(okaytext)
                            .cancel(translations.ANNO_DELNO);
                        $mdDialog.show(confirm).then(function () {
                            annoServ.joinTrack(track, aIdx, strack);
                            $scope.$apply();
                        });
                    });
                } else {
                    annoServ.joinTrack(track, aIdx, strack);
                    $scope.$apply();
                }

            };
            
            vm.restoreFocus = function() {
                $timeout(function() {
                    console.log(vm.tracks[vm.r.tk].annos[vm.selectedAnno].id);
                    $scope.$broadcast(vm.tracks[vm.r.tk].annos[vm.selectedAnno].id);
                }, 0);
            };
            // on navigating away, clean up the key events, wavesurfer instances
            $scope.$on('$destroy', function() {
                annoServ.destroyAll();
            });

        };
    ngAnnoController.$inject = ['annoServ', '$scope', 'keyService', 'aikumaService', '$timeout', '$mdDialog', 'aikumaDialog', '$translate', 'audioService'];

})();
