/**
 * Created by Mat on 31/01/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-service', ['annoweb-util'])
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
                    $rootScope.$broadcast('regionenter');
                });
                aw.wavesurfer.on('region-out', function() {
                    aw.currentRegion = null;
                    $rootScope.$broadcast('regionexit');
                });
            };
            Papa.parse("extdata/iso-639-3_20160115.tab", {
                header: true,
                download: true,
                complete: function(results) {
                    aw.languages = results.data;
                }
            });
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
                            for (var i = 0; i < annotations.length; i++) {
                                blankanno[i] = '';
                            }
                        }
                        aw.add_region(0, aw.wavesurfer.getDuration(), blankanno);
                    }
                }
                $rootScope.$broadcast('regionsloaded');
            };

            // Add a region; start, end, object with annotations
            aw.add_region = function(start_t, end_t, annotations) {
                var reg = {
                    color: randomColor(0.1),
                    start: start_t,
                    end: end_t,
                    data: annotations
                };
                var newregion = aw.wavesurfer.addRegion(reg);
                aw.regions.push(newregion.id);
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

            // annotation functions
            aw.splitLastRegion = function() {
                aw.wavesurfer.pause();
                var curt = aw.currentTime;
                var endt = aw.wavesurfer.getDuration();
                var lastregion = aw.wavesurfer.regions.list[_.last(aw.regions)];
                lastregion.update({end: curt});
                var blankanno = {};
                for (var i = 0; i < aw.annotationlist.length; i++) {
                    blankanno[i] = '';
                }
                aw.add_region(curt, endt, blankanno);
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