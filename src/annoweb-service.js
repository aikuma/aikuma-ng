/**
 * Created by Mat on 31/01/2016.
 */
(function(){
    angular
        .module('annoweb-service', [])
        /* This is a factory service that is used for inter-controller communication and so on */
        .factory('AnnowebService', function ($rootScope) {
            var factory = {};
            factory.regionlist = [];
            factory.loadfile = function(newfile) {
                factory.filehandle = newfile;
                $rootScope.$broadcast('loadfile');
            };
            factory.fileloaded = function() {
                if (factory.regionlist.length) {
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
                factory.regionlist = [];
                $rootScope.$broadcast('initannotations');
                console.log(factory.annotationoptions);
                if (factory.annotationoptions.autoregion) {
                    console.log('yep');
                    $rootScope.$broadcast('autoregion');
                }
            };
            factory.newregions = function(regions) {
                factory.regionlist=regions;
                $rootScope.$broadcast('initregions');
            };
            factory.autoregions = function() {
                $rootScope.$broadcast('autoregions');
            };
            return factory;
        });
})();