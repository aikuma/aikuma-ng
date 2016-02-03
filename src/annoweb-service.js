/**
 * Created by Mat on 31/01/2016.
 */
(function(){
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
            var factory = {};
            factory.regions = [];
            factory.annotationlist = [];
            factory.loadfile = function(newfile) {
                factory.filehandle = newfile;
                $rootScope.$broadcast('loadfile');
            };
            factory.fileloaded = function() {
                if (factory.regions.length) {
                    $rootScope.$broadcast('regions_loaded');
                }
            };
            factory.wavesurfer_ready = function() {
                $rootScope.$broadcast('load_dummydata');
            };
            Papa.parse("extdata/iso-639-3_20160115.tab", {
                header: true,
                download: true,
                complete: function(results) {
                    factory.languages = results.data;
                }
            });
            /* Set up new annotations */
            factory.setAnnos = function(annotations, options) {
                factory.annotationoptions = options;
                factory.annotationlist = annotations;
                factory.regions = [];
                console.log(factory.annotationoptions);
                if (factory.annotationoptions.autoregion) {
                    factory.autoregions();
                }
                $rootScope.$broadcast('regionsloaded');
            };

            // Add a region; start, end, object with annotations
            factory.add_region = function(start_t, end_t, annotations) {
                var reg = {
                    color: randomColor(0.1),
                    start: start_t,
                    end: end_t
                };
                var r = factory.wavesurfer.addRegion(reg);
                var pr = {
                    'r': r,
                    'start': start_t,
                    'end': end_t,
                    'anno': annotations
                };

                factory.regions.push(pr);
            };

            factory.dummyanno = function() {
                var danno = {};
                for (var i = 0; i < factory.annotationlist.length; i++) {
                    danno[i] = (Math.random() + 1).toString(36).substring(7);
                }
                return danno;
            };

            // Extract regions automatically based on silence.
            factory.autoregions = function() {
                /* take regions from extractRegions(), apply random color and add to wavesurfer */
                var loadRegions = function(regions) {
                    regions.forEach(function (region) {
                        var da = factory.dummyanno();
                        factory.add_region(region.start, region.end, da);
                    });
                };
                loadRegions(
                    // extractRegions() is in annoweb-util module.
                    extractRegions(
                        factory.wavesurfer.backend.getPeaks(512),
                        factory.wavesurfer.getDuration()
                    )
                );
            };


            return factory;
        }]);
})();