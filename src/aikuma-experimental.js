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
            vm.reg = annoServ.reg;
            vm.playCSS = {};
            vm.reg.curRegion = -1;
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

            vm.tracks = ['Respeaking', 'Translate', 'Manual'];

            var annotateAudioContext = new AudioContext();

            //
            // Called from View HTML
            //
            vm.toggleAnnoSetting = function(annoIdx, setting) {
                vm.annoSettings[annoIdx][setting] = !vm.annoSettings[annoIdx][setting];
                vm.restoreFocus();
            };

            //
            // KEY HANDLING
            //
            vm.playKeyDown = function(nokey) {
                if (vm.ffKeyDownStat) {return;}  // Block multiple keys
                vm.playKeyDownStat = true;
                vm.isPlaying = true;
                // if we have been making a region (we can assume this is repeat press) then re-play
                if (vm.reg.regionMarked) {
                    annoServ.wavesurfer.play(annoServ.playIn);
                } else {
                    if (vm.reg.curRegion > -1) {
                        // the service works out what audio is appropriate to play (which is why we pass the settings object
                        vm.playAudio(vm.selectedAnno, vm.reg.curRegion);
                    } else {
                        var thisTime = annoServ.wavesurfer.getCurrentTime();
                        thisTime = Math.round(thisTime*1000)/1000;
                        annoServ.makeNewRegion(thisTime);
                        vm.reg.regionMarked = true;
                        vm.reg.curRegion = annoServ.regionList.length - 1;
                        annoServ.playIn = thisTime;
                        annoServ.wavesurfer.play();
                    }
                }
                if (nokey) {$scope.$apply();}
            };

            vm.playKeyUp = function(nokey) {
                vm.playKeyDownStat = false;
                if (vm.ffKeyDownStat) {return;}  // Block multiple keys
                if (vm.reg.regionMarked) {
                    vm.isPlaying = false;
                    annoServ.wavesurfer.pause();
                }
            };

            vm.ffKeyDown = function(nokey) {
                if (vm.playKeyDownStat) {return;}  // Block multiple keys
                vm.ffKeyDownStat = true;
                if (vm.reg.curRegion > -1)  {
                    if (vm.reg.curRegion === (annoServ.regionList.length -1)) {
                        vm.reg.curRegion = -1;
                        annoServ.seekToTime(annoServ.playIn);
                    } else {
                        annoServ.seekToTime(annoServ.regionList[vm.reg.curRegion+1].start);
                    }
                } else {
                    if (vm.reg.regionMarked) {
                        annoServ.deleteLastRegion();
                        vm.reg.curRegion = -1;
                    }
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
                    vm.reg.curRegion = annoServ.getRegionFromTime();
                }
            };

            vm.rwKey = function(nokey) {
                if (vm.reg.regionMarked) {
                    annoServ.deleteLastRegion();
                    vm.reg.curRegion = -1;
                }
                var thisTime = annoServ.wavesurfer.getCurrentTime();
                thisTime = Math.round(thisTime*1000)/1000;
                // We are in a region so navigate between regions
                if (vm.reg.curRegion > -1) {
                    // if we are part way through a region, just go back to the start
                    if (thisTime > annoServ.regionList[vm.reg.curRegion].start) {
                        annoServ.seekToTime(annoServ.regionList[vm.reg.curRegion].start);
                        vm.restoreFocus();
                    } else {
                        if (vm.reg.curRegion === 0) {
                            if (thisTime > 0) { // we want to rewind past 0 but the first region doesn't start at 0
                                vm.reg.curRegion = -1;
                                annoServ.seekToTime(Math.max(0, (thisTime - vm.skipTimeValue)));
                                return;
                            } else {
                                // if we are at the start, do nothing
                                return;
                            }
                        }
                        --vm.reg.curRegion;
                        annoServ.seekToTime(annoServ.regionList[vm.reg.curRegion].start);
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
            vm.annotations = $scope.annotationObjList;
            vm.selectedAnno = _.findIndex($scope.annotationObjList, function(anno) {
                return anno.data._ID === $scope.selectedAnno;
            });
            aikumaService.getLanguages(function (langs) {
                $scope.annotationObjList.forEach(function (anno, annoIdx) {
                    var hasC = ('copiedFrom' in anno.data.segment);
                    var hasA = ('annotations' in anno.data.segment && (anno.data.segment.annotations.length > 0));
                    vm.annoSettings[annoIdx] = {
                        loop: false,
                        enabled: anno.data._ID === $scope.selectedAnno,
                        selectedTrack: 0,
                        hasAnnos: hasA,
                        hasCopied: hasC,
                        playSrc: true,
                        playSec: true
                    };
                    vm.annoList = vm.annotations.map(function(anno) {
                        return {
                            _ID: anno.data._ID,
                            name: aikumaService.lookupLanguage(anno.data.source.langIds[0], langs),
                            type: angular.uppercase(anno.data.type)
                        };
                    });
                    // 
                 });
                vm.annoSettings[vm.selectedAnno].enabled = true;
            });

            // Find secondary audio and build a source list that will be used in the UI as 'tracks'

            vm.translations = $scope.secondaryList.filter(function(secData) { return secData.type === 'translate'; });
            vm.respeakings = $scope.secondaryList.filter(function(secData) { return secData.type === 'respeak'; });
            vm.audioSourceList = [];
            // In this case we don't use any segmentation, this may be the only option if there are no other recordings
            vm.audioSourceList.push({
                name: 'SOURCE',
                action: 'MANUAL',
                color: {color: 'hsl(0,0%,50%)'},
                icon: 'mdi:plus-box'
                });
 
            var trackIdx = 0;
            vm.respeakings.forEach(function(r, indx){
                ++trackIdx;
                var coldat = [120+(indx*5),100];
                vm.audioSourceList.push({
                    id: r._ID,
                    name: 'RESPEAKING',
                    action: 'USE_RSPK',
                    color: {color: 'hsl('+coldat[0]+','+coldat[1]+'%,40%)'},
                    coldat: coldat,
                    icon: 'mdi:numeric-'+trackIdx+'-box'
                });
            });
            vm.translations.forEach(function(t, indx){
                ++trackIdx;
                var coldat = [210+(indx*5),60];
                vm.audioSourceList.push({
                    id: t._ID,
                    name: 'ANNO_TRANS',
                    action: 'USE_TRANS',
                    color: {color: 'hsl('+coldat[0]+','+coldat[1]+'%,40%)'},
                    coldat: coldat,
                    icon: 'mdi:numeric-'+trackIdx+'-box'
                });
            });


            // Set up wavesurfer
            // callback registers hotkeys and switches to the selected annotation
            annoServ.initialize($scope.audioSourceUrl, $scope.annotationObjList, $scope.sessionObj, $scope.secondaryList, $scope.userObj, function() {
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
                annoServ.switchToAnno(vm.selectedAnno, vm.audioSourceList);
                if (annoServ.regionList.length) {
                    annoServ.seekToTime(annoServ.regionList[0].start);
                }
                vm.restoreFocus();
                $scope.$apply();
            });
            


            //
            // FUNCTIONS BOUND TO VIEW MODEL
            //
            // nuclear option, user wishes to clear all annotation data
            vm.clearAnno = function(annoIdx) {
                annoServ.clearAnno(annoIdx);
                vm.reg.curRegion = -1;
                vm.annoSettings[annoIdx].hasAnnos = false;
                vm.annoSettings[annoIdx].hasCopied = false;
            };

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
                            vm.reg.curRegion = 0;
                            annoServ.wavesurfer.seekTo(0);
                        });
                    });
                } else {
                    vm.copyTrack(annoIdx, trackIdx);
                    vm.reg.curRegion = 0;
                    annoServ.wavesurfer.seekTo(0);
                }
            };
            
            vm.copyTrack = function(annoIdx, trackIdx) {
                annoServ.copySegment(annoIdx, vm.audioSourceList[trackIdx].id, vm.audioSourceList[trackIdx].coldat);
                vm.annoSettings[annoIdx].selectedTrack = trackIdx;
                vm.annoSettings[annoIdx].enabled = true;
                vm.selectedAnno = annoIdx;
                vm.restoreFocus();
            };
            
            vm.selectAnno = function(annoIdx) {
                if (annoIdx != vm.selectedAnno) {
                    vm.selectedAnno = annoIdx;
                    annoServ.switchToAnno(vm.selectedAnno, vm.audioSourceList);
                    vm.reg.curRegion = annoServ.getRegionFromTime();
                }
            };
            vm.openMenu = function($mdOpenMenu, ev) {
                $mdOpenMenu(ev);
            };
            vm.inputReturn = function(annoIdx) {
                if (vm.reg.regionMarked) {
                    annoServ.markLastRegionComplete();
                    vm.reg.regionMarked = false;
                    vm.reg.curRegion = -1;
                } else {
                    if (vm.reg.curRegion === (annoServ.regionList.length -1)) {
                        annoServ.seekToTime(annoServ.regionList[vm.reg.curRegion].end + 0.001);
                        vm.reg.curRegion = -1;
                    } else {
                        ++vm.reg.curRegion;
                        annoServ.seekRegion(vm.reg.curRegion);
                    }
                }
                annoServ.saveAnnotation(annoIdx);
            };
            vm.hasSecondaryAudio = function(annoIdx) {
                if (annoServ.availAudio(annoIdx, vm.reg.curRegion)) {
                    return true;
                } else {
                    return false;
                }
            };

            vm.help = function(ev) {
                aikumaDialog.help(ev, 'annotate');
            };

            vm.getRL = function() {
                return annoServ.regionList.length;
            };
            
            vm.audioAvail = function(annoIdx) {
                if ('copiedFrom' in $scope.annotationObjList[annoIdx].data.segment) {
                    var segId = $scope.annotationObjList[annoIdx].data.segment.copiedFrom.secondarySegId;
                    return _.findIndex(vm.audioSourceList, function(asl) {
                        return asl.id === segId;
                    });
                }
                return false;
            };
            vm.playAudio = function(annoIdx, region) {
                var timerval = 0;
                if (vm.annoSettings[annoIdx].playSrc) {
                    annoServ.regionList[region].play();
                    annoServ.regionPlayback = true;
                    timerval = (annoServ.regionList[region].end - annoServ.regionList[region].start) + 0.2;
                }
                console.log(timerval);
                if (vm.annoSettings[annoIdx].playSec) {
                    $timeout(function(){
                        var pooid = annoServ.availAudio(annoIdx, region);
                        if (pooid) {
                            var secObj = $scope.secondaryList.filter(function (secData) {
                                return secData._ID === pooid;
                            });
                            var audiofid = secObj[0].source.recordFileId;
                            var seglist = secObj[0].segment.segMsec;
                            var fileh = $scope.userObj.getFileUrl(audiofid);
                            vm.playCSS[1] = true;
                            $scope.$apply();
                            audioService.playbackLocalFile(annotateAudioContext, fileh, seglist[region][0], seglist[region][1], function () {
                                console.log('finished');
                                vm.playCSS[1] = false;
                                $scope.$apply();
                            });
                        }
                    }, timerval*1000);
                }
            };
            //
            // Utility horseshit
            //
            vm.restoreFocus = function() {
                $timeout(function() {
                    console.log('inputfoo'+vm.selectedAnno);
                    $scope.$broadcast('inputfoo'+vm.selectedAnno);
                }, 0);
            };
            // on navigating away, clean up the key events, wavesurfer instances
            $scope.$on('$destroy', function() {
                annoServ.destroyAll();
            });

        };
    ngAnnoController.$inject = ['annoServ', '$scope', 'keyService', 'aikumaService', '$timeout', '$mdDialog', 'aikumaDialog', '$translate', 'audioService'];

})();
