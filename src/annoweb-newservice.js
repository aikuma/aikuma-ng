/**
 * Created by Mat on 20/02/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-newservice', [])

        // We'll call this to get data. It's a stand-in for the local storage/sync service.
        .factory('mockService', [function () {

        }])
        .factory('newService', ['$rootScope', 'randomColor', 'extractRegions', function ($rootScope, randomColor, extractRegions) {
            var an = {};

            an.AnnoMeta = [];
            an.SegMap = [];
            an.Annotations = {};

            return an;
        } ]);

})();