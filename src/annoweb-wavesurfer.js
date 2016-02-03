(function(){
    'use strict';
    /* annoweb-wavesurfer directive module. */
    angular
        .module('annoweb-wavesurfer', ['annoweb-util'])
        .directive('ngWavesurfer', [ 'randomColor', 'extractRegions',
            function(randomColor, extractRegions) {
                return {
                    restrict: 'E',
                    templateUrl: 'views/edit-waveform.html',
                    controllerAs: 'wavesurf',
                    controller: WavesurferController
                };
            }
        ]);

    var WavesurferController = function ($timeout, $scope, $element, $attrs, AnnowebService) {
        var vm = this,
            wsdefaults = {
                container: "#wave-form",
                normalize: true,
                scrollParent: true
            };
        /* default variables */
        vm.paused = true;
        vm.region = {};
        vm.file = null;
        vm.zoomval = 150;
        vm.autoregion = true;
        vm.elanreader = false;
        vm.activeUrl = null;
        vm.playbackdisabled = true;
        /* create a wavesurfer instance and bind it to this scope */
        vm.wavesurfer = Object.create(WaveSurfer);
        /* Options crafted out of the directive's attr. HTML needs undorscores to map to the camel case
         of wavesurfer.options(). Since the timeline renders into a different container, container ids are
         hard coded here and refer to elements in the templateUrl specified above. */
        vm.options = angular.extend(wsdefaults, $attrs);

        vm.initwavesurfer = function () {
            vm.wavesurfer.init(wsdefaults);
            /* Initialize the time line */
            vm.timeline = Object.create(vm.wavesurfer.Timeline);
            vm.timeline.init({
                wavesurfer: vm.wavesurfer,
                container: "#wave-timeline"
            });
            // Init ELAN plugin
            if (vm.elanreader) {
                vm.elan = Object.create(vm.wavesurfer.ELAN);
            }
            /* Minimap plugin */
            vm.wavesurfer.initMinimap({
                height: 40,
                waveColor: '#555',
                progressColor: '#999',
                cursorColor: '#999'
            });
            AnnowebService.wavesurfer = vm.wavesurfer;
        };

        vm.initwavesurfer();

        vm.wavesurfer.on('play', function () {
            vm.paused = false;
        });

        vm.wavesurfer.on('pause', function () {
            vm.paused = true;
        });

        vm.wavesurfer.on('finish', function () {
            vm.paused = true;
            vm.wavesurfer.seekTo(0);
            vm.$apply();
        });

        // move to a link
        vm.wavesurfer.on('region-mouseenter', function(regionobj) {
            vm.region = regionobj;
            $scope.$apply();
        });

        /* "When audio is loaded, decoded and the waveform drawn." */
        vm.wavesurfer.on('ready', function () {
            console.log("wavesurfer reports ready");

            /* Optionally run auto region extraction */
            AnnowebService.regionlist = [];
            vm.playbackdisabled = false;
            AnnowebService.fileloaded();
            $scope.$apply();
        });

        vm.loadnew = function(fileOrUrl) {
            /* Wavesurfer has different methods for reading a URL or a file/blob locally */
            if (typeof fileOrUrl == "string") {
                vm.wavesurfer.load(fileOrUrl);
            } else {
                vm.wavesurfer.loadBlob(fileOrUrl);
            }

        };

        /* If you use the zoom slider */
        vm.zoomhandler = function() {
            vm.wavesurfer.zoom(vm.zoomval);
        };
        /* If you use the zoom buttons */
        vm.zoomOut = function() {
            if (vm.zoomval > 50) vm.zoomval--; /* It seems to break if we try to zoom out tooo much, find out why */
            vm.wavesurfer.zoom(vm.zoomval);
        };
        vm.zoomIn = function() {
            if (vm.zoomval < 350) {vm.zoomval++;}
            vm.wavesurfer.zoom(vm.zoomval);
        };

        vm.play = function (url) {
            if (!vm.wavesurfer) {
                return;
            }
            vm.activeUrl = url;
            vm.wavesurfer.once('ready', function () {
                vm.wavesurfer.play();
                //$scope.$apply();
            });

            vm.wavesurfer.load(vm.activeUrl);
        };

        vm.isPlaying = function (url) {
            return url == vm.activeUrl;
        };

        /* This will load an annotation. It uses the ELAN plug-in for now but we need a generic load from data structure decoupled from
         specific file formats.
         */
        vm.loadannotation = function() {
            /* hard coded for now */
            if (vm.elanreader) {
                var tiersel = {};
                tiersel.Text = true; /* long form is because there might be funny chars in elan tier names */
                tiersel.Comments = true;
                vm.elan.init({
                    url: 'media/001z.xml',
                    //url: 'media/elan-example1.xml',
                    container: '#annotations',
                    tiers: tiersel
                });

                vm.elan.on('ready', function () {
                    console.log('elan plugin reported ready');
                    // $scope.wavesurfer.load('media/001z.mp3');
                });

                vm.elan.on('select', function (start, end) {
                    vm.wavesurfer.backend.play(start, end);
                });

                vm.elan.on('ready', function () {
                    var classList = vm.elan.container.querySelector('table').classList;
                    [ 'table', 'table-striped', 'table-hover' ].forEach(function (cl) {
                        classList.add(cl);
                    });
                });
            }
        };

        /*
         THIS CODE NEEDS TO BE RE-WRITTEN / REMOVED
         This is elan playback progress indication, called from the wavesurfer 'audioprocess' event as seen at the end
         Note that the elan plugin does not register annotations as regions and work with that, but rather you repeatedly
         call elan.getRenderedAnnotation(time) and have the note returned. This should be discarded. We need a generic way
         perform the same job but with wavesurfer regions. Our data might come from multiple sources and not just elan.
         Besides, the elan plugin builds a hard coded table in the javascript. We just want to expose data to angular.
         */

        var prevAnnotation, prevRow, region;
        var onProgress = function (time) {
            var annotation = vm.elan.getRenderedAnnotation(time);

            if (prevAnnotation != annotation) {
                prevAnnotation = annotation;

                region && region.remove();
                region = null;

                if (annotation) {
                    // Highlight annotation table row
                    var row = vm.elan.getAnnotationNode(annotation);
                    prevRow && prevRow.classList.remove('success');
                    prevRow = row;
                    row.classList.add('success');
                    var before = row.previousSibling;
                    if (before) {
                        vm.elan.container.scrollTop = before.offsetTop;
                    }
                    // Region
                    region = vm.wavesurfer.addRegion({
                        start: annotation.start,
                        end: annotation.end,
                        resize: false,
                        color: 'rgba(223, 240, 216, 0.7)'
                    });
                }
            }
        };
        if (vm.elanreader) vm.wavesurfer.on('audioprocess', onProgress);

        /* This listener may typically be called from somewhere else. For example, the elan plug-in needs a container. The container has not yet loaded when
         this code in the wavesurfer directive is first run. The annotation directive has no parent/child relationship to wavesurfer, so calling this will need
         passing in of the $rootScope and then calling broadcast, e.g. $rootScope.$broadcast('initializewavesurfer').

         This has ramifications: It would be best to use initialize to load a previous state. In development this will load a toy example. It would probably
         be better to call new file loads from the parent. So the main app.js controller handles user input for new files and so on. app.js controller only
         needs $broadcast, since all other direcives are children.
         */
        $scope.$on('load_dummydata', function() {
            vm.loadnew('media/elan-example1.mp3');
        });
        $scope.$on('loadfile', function() {
            vm.wavesurfer.clearRegions();
            vm.wavesurfer.destroy();
            vm.initwavesurfer();
            AnnowebService.regionlist = [];
            vm.loadnew(AnnowebService.filehandle);
        });

        $timeout(function () {
            AnnowebService.wavesurfer_ready();
        }, 0, false);
    };
    WavesurferController.$inject = ['$timeout', '$scope', '$element', '$attrs', 'AnnowebService'];

})();