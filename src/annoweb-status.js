/**
 * Created by Mat on 21/02/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-status', [])
        .directive('ngStatus', [ 'randomColor', 'extractRegions',
            function(randomColor, extractRegions) {
                return {
                    restrict: 'E',
                    templateUrl: 'views/templates/status-template.html',
                    controllerAs: 'sCtrl',
                    controller: statusController
                };
            }
        ]);

    var statusController = function ($timeout, $scope, $element, $attrs, AnnowebService) {

    };
    statusController.$inject = ['$timeout', '$scope', '$element', '$attrs', 'AnnowebService'];

})();