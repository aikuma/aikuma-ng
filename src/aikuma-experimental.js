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

        var ngAnnoController = function (annoServ, $scope, keyService, aikumaService, $timeout, $mdDialog, aikumaDialog, $translate) {
            var vm = this;
            // region status flags
            vm.curRegion = -1;
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
                if (annoServ.seeked) {
                    vm.curRegion = annoServ.getRegionFromTime(annoServ.seektime);
                    annoServ.seeked = false;
                }
                if (annoServ.regionMarked) {
                    annoServ.wavesurfer.play(annoServ.playIn);
                } else {
                    if (vm.curRegion > -1) {
                        annoServ.playAudio(vm.selectedAnno,vm.curRegion);
                    } else {
                        var thisTime = annoServ.wavesurfer.getCurrentTime();
                        annoServ.makeNewRegion(thisTime);
                        annoServ.regionMarked = true;
                        vm.curRegion = annoServ.regionList.length - 1;
                        // no amount of deleting or setting to undefine in the delete last region function will work
                        vm.annoList.forEach(function(anno){
                            anno.annos[vm.curRegion] = '';
                        });
                        annoServ.playIn = thisTime;
                        annoServ.wavesurfer.play();
                    }
                }
                if (nokey) {$scope.$apply();}
            };

            vm.playKeyUp = function(nokey) {
                vm.playKeyDownStat = false;
                if (vm.ffKeyDownStat) {return;}  // Block multiple keys
                if (annoServ.regionMarked) {
                    vm.isPlaying = false;
                    annoServ.wavesurfer.pause();
                }
            };

            vm.ffKeyDown = function(nokey) {
                if (annoServ.seeked) {vm.curRegion = annoServ.getRegionFromTime(); }
                if (vm.playKeyDownStat) {return;}  // Block multiple keys
                vm.ffKeyDownStat = true;
                if (annoServ.seeked) {
                    vm.curRegion = annoServ.getRegionFromTime(annoServ.seektime);
                    annoServ.seeked = false;
                }
                if (vm.curRegion > -1)  {
                    if (vm.curRegion == (annoServ.regionList.length -1)) {
                        vm.curRegion = -1;
                        annoServ.seekToTime(annoServ.playIn);
                    } else {
                        ++vm.curRegion;
                        annoServ.seekToTime(annoServ.regionList[vm.curRegion].start);
                    }
                } else {
                    if (annoServ.regionMarked) {
                        annoServ.deleteLastRegion();
                        vm.curRegion = -1;
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
                }
            };

            vm.rwKey = function(nokey) {
                if (annoServ.regionMarked) {
                    annoServ.deleteLastRegion();
                    vm.curRegion = -1;
                }
                if (annoServ.seeked) {
                    vm.curRegion = annoServ.getRegionFromTime(annoServ.seektime);
                    annoServ.seeked = false;
                }
                var thisTime = annoServ.wavesurfer.getCurrentTime();
                // We are in a region so navigate between regions
                if (vm.curRegion > -1) {
                    // if we are part way through a region, just go back to the start
                    if (thisTime > annoServ.regionList[vm.curRegion]) {
                        annoServ.seekToTime(annoServ.regionList[vm.curRegion].start);
                    } else {
                        if (vm.curRegion == 0) {return;} // if we are at the start, do nothing
                        --vm.curRegion;
                        annoServ.seekToTime(annoServ.regionList[vm.curRegion].start);
                    }
                } else {
                    // In this case, we are in unmarked territory so change modes to skip back
                    if ((thisTime - vm.skipTimeValue) < annoServ.playIn) {
                        annoServ.seekToTime(_.last(annoServ.regionList).start);
                        vm.curRegion = annoServ.regionList.length - 1;
                    } else {
                        annoServ.wavesurfer.skipBackward(vm.skipTimeValue);
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
                    var hasA = false;
                    var hasC = false;
                    if ('annotations' in anno.data.segment && anno.data.segment.annotations.length > 0) {hasA = true;}
                    if ('copied_from' in anno.data.segment) {hasA = true;}
                    vm.annoSettings[annoIdx] = {
                        loop: false,
                        enabled: anno.data._ID === $scope.selectedAnno,
                        playAudio: ['source'],
                        selectedTrack: 0,
                        hasAnnos: hasA,
                        hasCopied: hasC
                    };
                    vm.annoList = vm.annotations.map(function(anno) {
                        return {
                            _ID: anno.data._ID,
                            name: aikumaService.lookupLanguage(anno.data.source.langIds[0], langs),
                            type: angular.uppercase(anno.data.type),
                            annos: {}
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
            annoServ.initialize($scope.audioSourceUrl, $scope.annotationObjList, $scope.sessionObj, $scope.secondaryList, function() {
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
                annoServ.switchToAnno(vm.selectedAnno);
                if (annoServ.regionList.length) {vm.curRegion = 0;}
                $scope.$apply();
            });
            


            //
            // FUNCTIONS BOUND TO VIEW MODEL
            //
            // nuclear option, user wishes to clear all annotation data
            vm.clearAnno = function(annoIdx) {
                annoServ.clearAnno(annoIdx);
                vm.curRegion = -1;
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
                            vm.curRegion = 0;
                            annoServ.wavesurfer.seekTo(0);
                        });
                    });
                } else {
                    vm.copyTrack(annoIdx, trackIdx);
                    vm.curRegion = 0;
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
                    annoServ.switchToAnno(vm.selectedAnno);
                    vm.curRegion = annoServ.getRegionFromTime();
                }
            };
            vm.openMenu = function($mdOpenMenu, ev) {
                $mdOpenMenu(ev);
            };
            vm.inputReturn = function(annoIdx) {
                if (annoServ.regionMarked) {
                    annoServ.markLastRegionComplete();
                    annoServ.regionMarked = false;
                    vm.curRegion = -1;
                } else {
                    if (vm.curRegion === (annoServ.regionList.length -1)) {
                        annoServ.seekToTime(annoServ.regionList[vm.curRegion].end + 0.001);
                        vm.curRegion = -1;
                    } else {
                        ++vm.curRegion;
                        annoServ.seekRegion(vm.curRegion);
                    }
                }
                annoServ.saveAnnotation(annoIdx);
            };

            vm.help = function(ev) {
                aikumaDialog.help(ev, 'annotate');
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
    ngAnnoController.$inject = ['annoServ', '$scope', 'keyService', 'aikumaService', '$timeout', '$mdDialog', 'aikumaDialog', '$translate'];

})();
