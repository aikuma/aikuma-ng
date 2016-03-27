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
                annoServ.restoreFocus(vm.selectedAnno);
            };

            //
            // KEY HANDLING
            //
            vm.playKeyDown = function(nokey) {
                if (vm.ffKeyDownStat) {return;}  // Block multiple keys
                vm.playKeyDownStat = true;
                vm.isPlaying = true;

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
                        $scope.$apply();
                        vm.restoreFocus(vm.selectedAnno);
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
                if (vm.playKeyDownStat) {return;}  // Block multiple keys
                vm.ffKeyDownStat = true;
                var thisTime = annoServ.wavesurfer.getCurrentTime();
                if (thisTime < annoServ.playIn) {
                    var seeked = false;
                    annoServ.regionList.every(function(reg, index) {
                        if (reg.start > thisTime) {
                            // we are now seeking to this region
                            annoServ.seekToTime(reg.start);
                            vm.curRegion = index;
                            $timeout(function() {
                                $scope.$broadcast('inputfoo0');
                            }, 0);
                            seeked = true;
                            return false;
                        } else {return true;}
                    });
                    if (!seeked) {
                        vm.curRegion = -1;
                        annoServ.seekToTime(annoServ.playIn+vm.oneMillisecond);
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
                var thisTime = annoServ.wavesurfer.getCurrentTime();
                if ((thisTime - vm.skipTimeValue) < annoServ.playIn) {
                    if (annoServ.regionList.length) {
                        var lastidx = _.findLastIndex(annoServ.regionList, function (reg) {
                            if (reg.start < thisTime) {return true;}
                        });
                        if (lastidx > -1) {
                            annoServ.seekToTime(annoServ.regionList[lastidx].start);
                            vm.curRegion = lastidx;
                            $timeout(function () {
                                $scope.$broadcast('inputfoo0');
                            }, 0);
                        }
                    } else {
                        seekToTime(0);
                    }
                } else {
                    annoServ.wavesurfer.skipBackward(skipTimeValue);
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
                    vm.annoSettings[annoIdx] = {
                        loop: false,
                        enabled: false,
                        playAudio: ['source']
                    };
                    vm.annoList = vm.annotations.map(function(anno) {
                        return {
                            _ID: anno.data._ID,
                            name: aikumaService.lookupLanguage(anno.data.source.langIds[0], langs),
                            type: angular.uppercase(anno.data.type),
                            enabled: anno.data._ID === $scope.selectedAnno,
                            loop: false,
                            annos: {}
                        };
                    });
                });
                vm.annoSettings[vm.selectedAnno].enabled = true;
            });

            // Set up wavesurfer
            // callback registers hotkeys
            annoServ.initialize($scope.audioSourceUrl, $scope.annotationObjList, $scope.sessionObj, function() {
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
            });
            
            //annoServ.restoreAnnotations();
            // This will populate wavesurfer with this annotation
            //annoServ.switchToAnno(vm.selectedAnno);
            //vm.curRegion = -1;

            //shitty restore
/*
            if (vm.annotations[0].data.segment.annotations) {
                var segmentId = vm.annotations[0].data.segment.sourceSegId;
                makeWSRegions($scope.sessionObj.data.segments[segmentId]);
                console.log(vm.annoList);
                vm.annoList[0].annos = vm.annotations[0].data.segment.annotations;
            }
*/
//
            // FUNCTIONS BOUND TO VIEW MODEL
            //
            vm.selectAnno = function(annoIdx) {
                vm.selectedAnno = annoIdx;
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
            vm.restoreFocus = function(focusId) {
                $timeout(function() {
                    console.log('inputfoo'+focusId);
                    $scope.$broadcast('inputfoo'+focusId);
                }, 0);
            };
            // on navigating away, clean up the key events, wavesurfer instances
            $scope.$on('$destroy', function() {
                annoServ.destroyAll();
            });

        };
    ngAnnoController.$inject = ['annoServ', '$scope', 'keyService', 'aikumaService', '$timeout', '$mdDialog', 'aikumaDialog', '$translate'];

})();
