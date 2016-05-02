/**
 * Created by Mat on 18/04/2016.
 */
(function() {
    'use strict';
    angular
        .module('aikuma-experimental', [])
        .directive("ngAnnoList", function () {
            return {
                restrict: "E",
                scope: {
                    secondaryList: '=',
                    sessionObj: '=',
                    annoObjList: '=',
                    wavesurfer: '=',
                    userObj: '='
                },
                templateUrl: "views/templates/annoList-template.html",
                controller: annoListController,
                controllerAs: 'alCtrl'
            };
        });

    var annoListController = function ($timeout, audioService, $location, $scope, $translate, aikumaService, $mdDialog, $mdToast, $q, loginService, dataService, fileService) {
        var vm = this;
        vm.trackList = [];
        vm.tracks = {};
        function makeTracks() {
            var countTypes = {rsp: 0, tran: 0};
            
            $scope.secondaryList.forEach( function(secondary) {
                if ('segMsec' in secondary.segment) {
                    var segid = secondary.segment.sourceSegId;
                    var track = {};
                    if (secondary.type === 'respeak') {
                        ++countTypes.rsp;
                        track.cnt = countTypes.rsp;
                        track.type = 'RESPEAKING';
                        track.action = 'USE_RSPK';
                        track.play = 'PLAY_RSPK';
                        track.icon = 'mdi:repeat';
                    } else if (secondary.type === 'translate') {
                        ++countTypes.tran;
                        track.cnt = countTypes.tran;
                        track.type = 'ANNO_TRANS';
                        track.action = 'USE_TRANS';
                        track.play = 'PLAY_TRANS';
                        track.icon = 'action:translate';
                    }
                    track.hasAudio = true;
                    track.hasAnnos = false;
                    track.annos = [];
                    track.secondary = secondary;
                    vm.trackList.push(segid);
                    vm.tracks[segid] = track;
                }
            });
            // These objects have a wrapper
            $scope.annoObjList.forEach(function(secondary) {
                if (secondary.data.type.indexOf('anno_') === 0) {
                    var segid;
                    if (!('sourceSegId' in secondary.data.segment)) {
                        segid = $scope.sessionObj.addSrcSegment([]);
                        secondary.data.segment.sourceSegId = segid;
                        secondary.data.segment.annotations = [];
                        secondary.save();
                        $scope.sessionObj.save();
                    } else {
                        segid = secondary.data.segment.sourceSegId;
                    }
                    var anno = {
                        id: secondary.data._ID,
                        type: angular.uppercase(secondary.data.type),
                        lang: aikumaService.niceLangString(secondary.data.source.langIds[0]),
                        summary: makeSummary(secondary.data.segment.annotations ? secondary.data.segment.annotations : '', 0),
                        text: secondary.data.segment.annotations
                    };
                    if (segid in vm.tracks) {
                        vm.tracks[segid].hasAnnos = true;
                        vm.tracks[segid].annos.push(anno);
                    } else {
                        var track = {
                            hasAudio: false,
                            annos: [anno],
                            hasAnnos: true,
                            type: 'AUDIO_NOEXIST',
                            icon: 'av:volume_off',
                            secondary: secondary.data,
                            play: 'PLAY_SRC'
                        };
                        vm.trackList.push(segid);
                        vm.tracks[segid] = track;
                    }
                }
            });
        }

        function makeSummary(annotations, index) {
            if (!annotations || !annotations.length) {return [null, null, null];}
            var summarytext = [];
            summarytext[0] = null;
            if (index === 0) {
                summarytext[0] = annotations[index];
                summarytext[1] = annotations[index+1];
                summarytext[2] = annotations[index+2];
                vm.sline = 0;
            } else if (index == (annotations.length-1)) {
                summarytext[0] = annotations[index-2];
                summarytext[1] = annotations[index-1];
                summarytext[2] = annotations[index];
                vm.sline = 2;
            } else {
                summarytext[0] = annotations[index - 1];
                summarytext[1] = annotations[index];
                summarytext[2] = annotations[index + 1];
                vm.sline = 1;
            }
            return summarytext;
        }
        

        vm.addAnno = function (ev, track = null) {
            if (vm.playingSec) {vm.stopPlayingSecondary();}
            $mdDialog.show({
                controller: newAnnotationController,
                controllerAs: 'dCtrl',
                templateUrl: 'views/templates/dialog-newAnnotation.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true,
                locals: {thisScope: $scope}
            }).then(function(annotations){
                var promises = [];
                var segObj = {annotations: []};
                console.log('t',track);
                if (track) {
                    segObj.sourceSegId = track;
                }
                annotations.forEach(function(anno) {
                    var annotationData = {
                        names: [],  // need UI
                        type: angular.lowercase(anno.type),
                        creatorId: loginService.getLoggedinUserId(),
                        source: {
                            created: Date.now(),
                            langIds: [{
                                langISO: anno.langISO,
                                langStr: anno.langStr
                            }]
                        },
                        segment: segObj
                    };
                    var promise = dataService.setSecondary(loginService.getLoggedinUserId(), $scope.sessionObj.data._ID, annotationData);
                    promises.push(promise);
                });
                $q.all(promises).then(function(res) {
                    $location.path('/session/'+$scope.sessionObj.data._ID+'/annotate/' + res[0][0]);
/*                    var promise = dataService.getAnnotationObjList(loginService.getLoggedinUserId(), $scope.sessionObj.data._ID);
                    promise.then(function(res){
                        // rebuild the track list
                        $scope.annoObjList = res;
                        vm.trackList = [];
                        vm.tracks = {};
                        makeTracks();
                    });*/
                });

            }, function() {
                console.log('cancelled');
            });
        };

        vm.deleteAnno = function(ev, track, annoidx) {
            if (vm.playingSec) {vm.stopPlayingSecondary();}
            $translate(["ANNO_DELCONF1", "ANNO_DELCONF2", "ANNO_DELNO", "ANNO_DELYES"]).then(function (translations) {
                var confirm = $mdDialog.confirm()
                    .title(translations.ANNO_DELCONF1)
                    .textContent(translations.ANNO_DELCONF2)
                    .targetEvent(ev)
                    .ok(translations.ANNO_DELYES)
                    .cancel(translations.ANNO_DELNO);
                $mdDialog.show(confirm).then(function () {
                    var annoid = vm.tracks[track].annos[annoidx].id;
                    fileService.removeData('secondary', annoid).then(function() {
                        vm.tracks[track].annos.splice(annoidx, 1);
                    });
                }, function () {
                    // removed comedy toast
                });
            });
        };
        vm.editAnno = function(annoId) {
            $location.path('/session/'+$scope.sessionObj.data._ID+'/annotate/' + annoId);
        };

        vm.hasAnnotations = function() {
            if ($scope.annoObjList.length > 0) {
                return true;
            } else {
                return false;
            }
        };

        function updateAnnoSummary(track, index) {
            vm.tracks[track].annos.forEach(function(anno){
                anno.summary = makeSummary(anno.text, index);
            });
        }
        
        vm.trackNumSegs = function(track) {
            if (!('secondary' in vm.tracks[track])) {return null;}
            var secondary = vm.tracks[track].secondary;
            var ssid = secondary.segment.sourceSegId;
            return $scope.sessionObj.data.segments[ssid].length;
        };

        var audioContext = new AudioContext();
        vm.pcss = {};
        vm.pcssthis = {};
        vm.playingSec = false;
        vm.stopPlayingSecondary = function () {
            $scope.wavesurfer.unAll();
            $scope.wavesurfer.clearRegions();
            $scope.wavesurfer.stop();
            vm.pcss[vm.playingSec] = false;
            vm.playingSec = false;
        };
        vm.playSecondary = function(track) {
            if (vm.playingSec) {vm.stopPlayingSecondary();}
            vm.playingSec = track;
            var secondary = vm.tracks[track].secondary;
            var ssid = secondary.segment.sourceSegId;
            var srcseg = $scope.sessionObj.data.segments[ssid];
            var sat = 100;
            $scope.wavesurfer.clearRegions();
            vm.playregions = [];
            srcseg.forEach(function(seg, idx){
                var vol = 60 + ((idx % 2) * 30);
                var hue = 200 + ((idx % 2) * 10);
                vm.playregions.push($scope.wavesurfer.addRegion(
                    {
                        start:seg[0]/1000,
                        end:seg[1]/1000,
                        color: 'hsla('+hue+','+sat+'%,'+vol+'%,0.35)'
                    }
                ));
            });
            var secseg = secondary.segment.segMsec;
            var fileh = $scope.userObj.getFileUrl(secondary.source.recordFileId);
            var ascallback = function() {
                vm.pcssthis[track] = false;
                $scope.$apply();
                ++vm.playindex;
                if (vm.playindex === vm.playregions.length) {
                    vm.stopPlayingSecondary();
                    vm.playindex = 0;
                } else {
                    vm.playregions[vm.playindex].play();
                }
                updateAnnoSummary(track, vm.playindex);
                $scope.$apply();
            };
            var wscallback = function() {
                // If we are only playing the source
                if (!vm.tracks[track].hasAudio) {
                    ++vm.playindex;
                    if (vm.playindex === vm.playregions.length) {
                        vm.stopPlayingSecondary();
                        vm.playindex = 0;
                    } else {
                        updateAnnoSummary(track, vm.playindex);
                        vm.playregions[vm.playindex].play();
                    }
                } else {
                    var start = secseg[vm.playindex][0];
                    var end = secseg[vm.playindex][1];
                    vm.pcssthis[track] = true;
                    audioService.playbackLocalFile(audioContext, fileh, start, end, ascallback);
                }
                $scope.$apply();
            };
            $scope.wavesurfer.on('pause', wscallback);
            vm.playindex = 0;
            vm.pcss[track] = true;
            vm.playregions[0].play();
        };

        // on navigating away, clean up the key events, wavesurfer instances
        $scope.$on('$destroy', function() {
            audioContext.close();
        });

        makeTracks();

    };
    annoListController.$inject = ['$timeout', 'audioService', '$location', '$scope', '$translate', 'aikumaService', '$mdDialog', '$mdToast', '$q', 'loginService', 'dataService', 'fileService'];

    var newAnnotationController = function ($mdDialog, $timeout, $q, $log, aikumaService) {
        var vm = this;
        vm.types = ['ANNO_ANNO','ANNO_TRANS','ANNO_COMM','ANNO_OTH'];
        vm.choices = [{type:'ANNO_ANNO'}];
        vm.hide = function() {
            $mdDialog.hide();
        };
        vm.cancel = function() {
            $mdDialog.cancel();
        };
        vm.answer = function(answer) {
            $mdDialog.hide(answer);
        };
        // list of `language` value/display objects
        vm.languages = loadAllx();

        vm.querySearch   = querySearch;
        vm.selectedItemChange = selectedItemChange;
        vm.invalid = true;
        vm.addNewChoice = function() {
            vm.choices.push({});
        };
        vm.removeChoice = function(idx) {
            vm.choices.splice(idx);
        };
        vm.makeAnno = function() {
            var annos = [];
            vm.choices.forEach(function(choice){
                if (choice.searchText) {
                    if (!choice.type) {choice.type='Unknown';}
                    annos.push({
                        langStr: choice.searchText,
                        langISO: choice.ISO,
                        type: choice.type
                    });
                }
            });
            $mdDialog.hide(annos);
        };
        vm.newLanguage = function(language) {
        };

        vm.isDisabled = function(item) {
            return vm.options[item].disabled;
        };

        vm.lastFilled = function() {
            var lastitem = _.last(vm.choices);
            if (lastitem.searchText && lastitem.type) {
                return true;
            } else {
                return false;
            }
        };

        function querySearch (query) {
            return query ? vm.languages.filter( createFilterFor(query) ) : vm.languages;
        }
        function selectedItemChange(item,idx) {
            if (item.id) {vm.choices[idx].ISO = item.id;}
        }

        function loadAllx() {
            var languages=[];
            aikumaService.languages.forEach( function(s) {
                languages.push({
                    value: s.Ref_Name.toLowerCase(),
                    display: s.Ref_Name,
                    id: s.Id
                });
            });
            return languages;
        }

        /**
         * Create filter function for a query string
         */
        function createFilterFor(query) {
            var lowercaseQuery = angular.lowercase(query);
            return function filterFn(language) {
                return (language.value.indexOf(lowercaseQuery) === 0);
            };
        }
    };
    newAnnotationController.$inject = ['$mdDialog', '$timeout', '$q', '$log', 'aikumaService'];

})();