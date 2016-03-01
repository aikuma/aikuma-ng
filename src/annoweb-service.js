/**
 * Created by Mat on 31/01/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-service', [])
        /* This is a factory service that is used for inter-controller communication and so on
         *
         * .setAnnos(annotations, options)
         * .newregions(regions)
         * .autoregions()
         * .
         * regions = a list of region objects
         * region object = { r: wavesurfer region object, start: <start>, end: <end>, anno: {annotation object} }
         * annotation object = { '0': 'first annotation', '1': 'second annotation etc'}
         *   note: keyed against the annotation list
         * annotation list = a list of annotation desc objects
         * annotation desc object = {'lang': <language name>, 'ISO': <optional language ISO code>, 'type': <type of annotation>}
         * */

        .factory('AnnowebService', ['$rootScope', 'randomColor', 'extractRegions', function ($rootScope, randomColor, extractRegions) {
            var aw = {};
            aw.debuglevel = 1; // 1 = load dummy waveform, 2 = also load dummy anno
            aw.regions = []; // IDs in ORDER
            aw.currentanno = {};
            aw.annotationlist = [];
            aw.currentRegion = null;
            aw.currentTime = 0;
            aw.color_sel = "rgba(63, 81, 181, 0.3)";
            aw.color_unsel = "rgba(63, 81, 181, 0.1)";
            aw.loadfile = function(newfile) {
                aw.filehandle = newfile;
                $rootScope.$broadcast('loadfile');
            };
            aw.fileloaded = function() {
                if (aw.debuglevel > 1) {
                    aw.setAnnos([{'lang':'Cool language', 'type':'Annotation'}, {'lang': 'Boring language', 'type': 'Translation'}] ,{'continuous': true, 'dummydata': false, 'autoregion': false});
                }
                $rootScope.$broadcast('regions_loaded');
            };
            // This is called after the wavesurfer directive has rendered (uses a timeout)
            aw.wavesurfer_ready = function() {
                if (aw.debuglevel > 0) {
                    $rootScope.$broadcast('load_dummydata');
                }
            };
            aw.registerWavesurfer = function(wsinstance) {
                aw.wavesurfer = wsinstance;
                // This is the only reliable figure, wavesurfer keeps counting after pausing!
                aw.wavesurfer.on('audioprocess', function() {
                    aw.currentTime = aw.wavesurfer.getCurrentTime();
                });
                aw.wavesurfer.on('region-in', function(reg) {
                    aw.currentRegion = reg;
                    reg.update({color: aw.color_sel});
                    $rootScope.$broadcast('regionenter');
                });
                aw.wavesurfer.on('region-out', function(reg) {
                    reg.update({color: aw.color_unsel});
                    $rootScope.$broadcast('regionexit');
                });
                aw.wavesurfer.on('seek', function(seekfloat) {
                    aw.seekspot = aw.wavesurfer.getDuration() * seekfloat;
                });
                // Behavior to move the currently selected region when you click on it
                aw.wavesurfer.on('region-click', function(region) {
                    if (aw.currentRegion.id == region.id) {
                        $rootScope.$broadcast('sameregionclick');
                    } else {
                        aw.currentRegion.update({color: aw.color_unsel});
                        aw.currentRegion = region;
                        aw.currentRegion.update({color: aw.color_sel});
                        $rootScope.$broadcast('regionclick');
                    }
                });

            };

            /* Set up new annotations
             * Args: List of annotations objects, option object
             * Results: Annotationlist set up. If autoregion then build region list, otherwise
             * make one region of the entire recording. If dummydata option, poke random string into each annotation
             * Finally, broadcast regions loaded event.
             * */
            aw.setAnnos = function(annotations, options) {
                aw.annotationoptions = options;
                aw.annotationlist = annotations;
                aw.regions = [];
                aw.annotations = [];
                if (aw.annotationoptions.autoregion) {
                    aw.autoregions();
                } else {
                    // no auto regions - but are we operating in simple (continous mode?)
                    if (aw.annotationoptions.continuous) {
                        // if so make one region for the entire recording
                        var blankanno = {};
                        if (aw.annotationoptions.dummydata) {
                            blankanno = aw.dummyanno();
                        } else {
                            blankanno = aw.blankAnno();
                        }
                        aw.add_region(0, aw.wavesurfer.getDuration(), blankanno);
                        aw.currentRegion = aw.get_regionByIndex(0);
                    }
                }
                $rootScope.$broadcast('regionsloaded');
            };

            // Add a region; start, end, object with annotations
            aw.add_region = function(start_t, end_t, annotations) {
                var reg = {
                    color: aw.annotationoptions.continuous ? aw.color_sel: randomColor(0.1),
                    start: start_t,
                    end: end_t,
                    data: annotations
                };
                var newregion = aw.wavesurfer.addRegion(reg);
                aw.customStyle(newregion);
                aw.regions.push(newregion.id);
            };

            aw.insert_region = function(start_t, end_t, position, annotations) {
                var reg = {
                    color: aw.annotationoptions.continuous ? aw.color_sel: randomColor(0.1),
                    start: start_t,
                    end: end_t,
                    data: annotations
                };
                var newregion = aw.wavesurfer.addRegion(reg);
                aw.customStyle(newregion);
                aw.regions.splice(position, 0, newregion.id);
            };

            aw.customStyle = function(region) {
                region.style(region.element, {
                    boxSizing: 'border-box',
                    borderRight: 'solid #3F51B5 1px'
                });
            };

            aw.get_region = function(id) {
                return aw.wavesurfer.regions.list[id];
            };
            aw.get_regionByIndex = function(idx) {
                var id = aw.regions[idx];
                return aw.wavesurfer.regions.list[id];
            };

            aw.dummyanno = function() {
                var danno = {};
                for (var i = 0; i < aw.annotationlist.length; i++) {
                    danno[i] = (Math.random() + 1).toString(36).substring(7);
                }
                return danno;
            };

            aw.blankAnno = function() {
                var blankanno = {};
                for (var i = 0; i < aw.annotationlist.length; i++) {
                    blankanno[i] = '';
                }
                return blankanno;
            };

            // annotation functions
            aw.splitLastRegion = function() {
                aw.wavesurfer.pause();
                var curt = aw.currentTime;
                var endt = aw.wavesurfer.getDuration();
                var lastregion = aw.wavesurfer.regions.list[_.last(aw.regions)];
                lastregion.update({end: curt});
                aw.add_region(curt, endt, aw.blankAnno());
            };

            aw.splitCurrentRegion = function() {
                var thispos = aw.regions.indexOf(aw.currentRegion.id);
                aw.wavesurfer.pause();
                var curt = aw.seekSpot;
                var this_start = aw.currentRegion.start;
                var this_end = aw.currentRegion.end;
                aw.currentRegion.update({end: curt});
                aw.insert_region(curt, this_end, thispos, aw.blankAnno());
            };

            aw.playPause = function () {
                aw.wavesurfer.playPause();
            };
            // Extract regions automatically based on silence.
            aw.autoregions = function() {
                /* take regions from extractRegions(), apply random color and add to wavesurfer */
                var loadRegions = function(regions) {
                    regions.forEach(function (region) {
                        var da = {};
                        console.log(aw.annotationoptions.dummydata);
                        if (aw.annotationoptions.dummydata) {
                            var da = aw.dummyanno();
                        }
                        aw.add_region(region.start, region.end, da);
                    });
                };
                loadRegions(
                    // extractRegions() is in annoweb-util module.
                    extractRegions(
                        aw.wavesurfer.backend.getPeaks(512),
                        aw.wavesurfer.getDuration()
                    )
                );
            };
            return aw;
        }]);

})();