/**
 * Created by Mat on 4/02/2016.
 */
(function(){
    'use strict';
    angular
        .module('aikuma-annotation', [])
        .directive("ngAnnotator", function() {
            return {
                restrict: "E",
                templateUrl: "views/templates/annotate-template.html",
                scope: {
                    source: '@',
                    userObj: '=',
                    sessionObj: '=',
                    annotationObj: "="
                },
                controller: annotationController,
                controllerAs: 'axCtrl'
            };
        });

    // The new annotation controller.
    var annotationController = function ($scope, keyService, aikumaService, $timeout, $mdDialog) {
        var vm = this;
        vm.userObj = $scope.userObj;
        vm.sessionObj = $scope.sessionObj;
        var playKeyCode = 17;   // control key (16 is shift)
        var ffKeyCode = 39;     // right arrow
        var rwKeyCode = 37;     // left arrow
        var escKeyCode = 27;    // escape
        var tabKeyCode = 9;     // tab - also prevents default
        var ffPlaybackRate = 2.5; // playback speed in FF mode
        var skipTimeValue = 3;  // amount of time to skip backwards for rewind
        var oneMillisecond = 0.001;
        vm.selectedAnno = 0;
        vm.annoEnabled = {};
        vm.curRegion = 0;
        vm.annoEnabled[0] = true;
        vm.annotations = aikumaService.getAnnotations();
        // used for guarding against multiple key presses
        vm.playKeyDown = false;
        vm.ffKeyDown = false;
        vm.regionList = [];
        vm.isPlaying = false;
        vm.regionMarked = false;

        vm.respeakings = [0,1,2];
        vm.curRespeak = 0;
        vm.activeRespeak = {0:true,1:true,2:true};
        vm.translations = [0,1];
        vm.activeTranslation = {0:true,1:true};
        vm.curTranslate = 0;
        vm.childMode = 'respeak';

        //
        // Set up Wavesurfer
        //
        var wsAnnotate = WaveSurfer.create({
            backend: "WebAudio",
            container: "#annotatePlayback",
            normalize: true,
            hideScrollbar: false,
            scrollParent: true
        });

        /* Initialize the time line */
        var timeline = Object.create(wsAnnotate.Timeline);
        timeline.init({
            wavesurfer: wsAnnotate,
            container: "#annotate-timeline"
        });
        /* Minimap plugin */
        var miniMap = wsAnnotate.initMinimap({
            height: 40,
            waveColor: '#555',
            progressColor: '#999',
            cursorColor: '#999'
        });
        wsAnnotate.load($scope.source);
        wsAnnotate.on('ready', function(){
            // this is a hack to resize the minimap when we resize wavesurfer, it depends on any-rezize-event.js
            var wavesurferelement = document.getElementById('annotatePlayback');
            wavesurferelement.addEventListener('onresize', _.debounce(function(){
                    miniMap.render();
                    miniMap.progress(miniMap.wavesurfer.backend.getPlayedPercents());
                }, 25)
            );
            keyService.regKey(playKeyCode,'keydown', function() {playKeyDown(true);});
            keyService.regKey(playKeyCode,'keyup', function()   {playKeyUp(true);});
            keyService.regKey(ffKeyCode,'keydown',  function()  {ffKeyDown(true);});
            keyService.regKey(ffKeyCode,'keyup',    function()  {ffKeyUp(true);});
            keyService.regKey(rwKeyCode,'keydown',  function()  {rwKey(true);});
            keyService.regKey(escKeyCode,'keydown', function()  {escKey(true);});
            keyService.regKey(tabKeyCode,'keydown', function()  {tabKey(true);});
            setWsRegions(0);
            vm.playIn = _.last(vm.regionList).end;
            $scope.$broadcast('inputfoo0');
        });
        wsAnnotate.on('region-in', function(reg) {
            // When are we going to PLAY into a region? or is it not just play?
            $scope.$apply();
        });
        wsAnnotate.on('region-out', function(reg) {
            // This will fire if we pause while doing the region-resize thing on play
            // vm.isPlaying = false if a playKeyUp event has occurred.
            // What other conditions will we play through a region?
            $scope.$apply();
        });
        wsAnnotate.on('audioprocess', function() {
            var currentPos = wsAnnotate.getCurrentTime();
            if (vm.regionMarked) {
                _.last(vm.regionList).update({end: currentPos});
            }
        });

        vm.test = function() {

        };

        function playKeyDown(nokey) {
            if (vm.ffKeyDown) {return;}  // Block multiple keys
            vm.playKeyDown = true;
            vm.isPlaying = true;

            if (vm.regionMarked) {
                wsAnnotate.play(vm.playIn);
            } else {
                var thisTime = wsAnnotate.getCurrentTime();
                if (thisTime >= vm.playIn) {
                    makeNewRegion(thisTime);
                    vm.regionMarked = true;
                    vm.curRegion = vm.regionList.length - 1;
                    vm.playIn = thisTime;
                    $scope.$apply();
                    $timeout(function() {
                        $scope.$broadcast('inputfoo0');
                    }, 0);
                }
                wsAnnotate.play();
            }
            if (nokey) {$scope.$apply();}

        }
        vm.playDown = function() {
            playKeyDown(true);
        };
        function playKeyUp(nokey) {
            vm.playKeyDown = false;
            if (vm.ffKeyDown) {return;}  // Block multiple keys
            vm.isPlaying = false;
            wsAnnotate.pause();
        }
        vm.playUp = function() {
            playKeyUp(true);
        };
        function ffKeyDown(nokey) {
            if (vm.playKeyDown) {return;}  // Block multiple keys
            vm.ffKeyDown = true;
            var thisTime = wsAnnotate.getCurrentTime();
            if (thisTime < vm.playIn) {
                var seeked = false;
                vm.regionList.every(function(reg, index) {
                    if (reg.start > thisTime) {
                        // we are now seeking to this region
                        seekToTime(reg.start);
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
                    seekToTime(vm.playIn+oneMillisecond);
                    seekToPlayin();
                }

            } else {
                if (vm.regionMarked) {
                    deleteLastRegion();
                    vm.curRegion = -1;
                }
                wsAnnotate.setPlaybackRate(ffPlaybackRate);
                wsAnnotate.play();
            }
            if (nokey) {$scope.$apply();}
        }

        function ffKeyUp(nokey) {
            vm.ffKeyDown = false;
            if (vm.playKeyDown) {return;}  // Block multiple keys
            if (wsAnnotate.isPlaying()) {
                wsAnnotate.pause();
                wsAnnotate.setPlaybackRate(1);
            }
        }

        function rwKey(nokey) {
            if (vm.regionMarked) {deleteLastRegion();}
            var thisTime = wsAnnotate.getCurrentTime();
            if ((thisTime - skipTimeValue) < vm.playIn) {
                if (vm.curRegion !== 0) {
                    var lastidx = _.findLastIndex(vm.regionList, function (reg) {
                        if (reg.start < thisTime) {return true;}
                    });
                    seekToTime(vm.regionList[lastidx].start);
                    vm.curRegion = lastidx;
                    $timeout(function() {
                        $scope.$broadcast('inputfoo0');
                    }, 0);
                } else {
                    seekToTime(vm.regionList[0].start);
                }
            } else {
                wsAnnotate.skipBackward(skipTimeValue);
            }
            if (nokey) {$scope.$apply();}
        }

        function escKey(nokey) {
            deleteLastRegion();
        }

        function tabKey(nokey) {
            if (vm.childMode === 'respeak') {toggleRespeak();}
            if (vm.childMode === 'translate') {toggleTranslate();}
        }

        function toggleRespeak() {
            var found = false;
            var newrsp = vm.curRespeak;
            while (!found) {
                ++newrsp;
                if (newrsp > (vm.respeakings.length - 1)) {
                    newrsp = 0;
                }
                if (newrsp === vm.curRespeak) {
                    break;
                }
                if (vm.activeRespeak[newrsp]) {
                    found = true;
                }
            }
            if (found) {vm.curRespeak = newrsp;}
        }
        function toggleTranslate() {
            var found = false;
            var newrsp = vm.curTranslate;
            while (!found) {
                ++newrsp;
                if (newrsp > (vm.translations.length - 1)) {
                    newrsp = 0;
                }
                if (newrsp === vm.curTranslate) {
                    break;
                }
                if (vm.activeTranslation[newrsp]) {
                    found = true;
                }
            }
            if (found) {vm.curTranslate = newrsp;}
        }

        vm.selectAnno = function(annoIdx) {
            vm.selectedAnno = annoIdx;
            //setWsRegions(annoIdx);
        };
        vm.openMenu = function($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        };
        vm.toggleRespeaking = function(idx) {
            vm.activeRespeak[idx] = !vm.activeRespeak[idx];
            restoreFocus();
        };
        vm.toggleTranslation = function(idx) {
            vm.activeTranslation[idx] = !vm.activeTranslation[idx];
            restoreFocus();
        };
        vm.toggleChildMode = function() {
            if (vm.childMode === 'respeak') {
                vm.childMode = 'translate';
                restoreFocus();
                return;
            }
            if (vm.childMode === 'translate') {
                vm.childMode = 'respeak';
                restoreFocus();
                return;
            }
        };



        function restoreFocus() {
            $timeout(function() {
                $scope.$broadcast('inputfoo0');
            }, 0);
        }

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
            var reg = wsAnnotate.addRegion({
                start: starttime,
                end: starttime,
                color: 'hsla('+hue+', 100%, 30%, 0.15)',
                drag: false,
                resize: false,
                data: col
            });
            vm.regionList.push(reg);
        }

        // delete the last audio, remove the wavesurfer region, seek to playIn, disable recording and make a new Segmap
        function deleteLastRegion() {
            var reg = vm.regionList.pop();
            reg.remove();
            vm.regionMarked = false;
            vm.playIn = _.last(vm.regionList).end;
            vm.curRegion = -1;
        }

        vm.inputReturn = function() {
            if (vm.regionMarked) {
                markLastRegionComplete();
                vm.regionMarked = false;
                vm.curRegion = -1;
            }
        };

        vm.seekRegion = function(idx) {
            console.log(idx);
            if (vm.regionMarked) {
                deleteLastRegion();
                vm.curRegion = -1;
            }
            seekToTime(vm.regionList[idx].start);
            vm.curRegion = idx;
            vm.regionList[idx].play();
            $timeout(function() {
                $scope.$broadcast('inputfoo0');
            }, 0);
        };

        function markLastRegionComplete() {
            var colidx = _.last(vm.regionList).data.colidx;
            var hue = 198 + (colidx*40);
            _.last(vm.regionList).update(
                {
                    color: 'hsla('+hue+', 100%, 30%, 0.1)',
                    data: {colidx:colidx}
                }
            );
            vm.playIn = _.last(vm.regionList).end;


        }

        // Often we force seek to play-in because we don't allow the user to play back where they cannot record.
        function seekToPlayin() {
            var length = wsAnnotate.getDuration();
            var floatpos = vm.playIn / length;
            wsAnnotate.seekTo(floatpos);
        }
        function seekToTime(time) {
            var length = wsAnnotate.getDuration();
            var floatpos = time / length;
            wsAnnotate.seekTo(floatpos);
        }




        function setWsRegions(annoIdx) {
            wsAnnotate.clearRegions();
            var sm = aikumaService.getSegmap(vm.annotations[annoIdx].SegId);
            var aix = 0;
            vm.annotations[annoIdx].annos.forEach(function(an){
                var stime = sm[aix].source[0] / 1000;
                var etime = sm[aix].source[1] / 1000;
                makeNewRegion(stime);
                _.last(vm.regionList).update({end:etime});
                markLastRegionComplete();
                ++aix;
            });

        }
        annotationController.$inject = ['$scope', 'keyService', 'aikumaService', '$timeout', '$mdDialog'];
    };

})();
