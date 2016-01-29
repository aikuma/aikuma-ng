(function (){
    //'use strict';
    angular
        .module('annoweb', [
            'ngMaterial',
            'annoweb-wavesurfer',
            'annoweb-data',
            'annoweb-dialog',
            'file-model'
        ])
        .controller('annoWebController',  annoWebController)
        .config(function($mdIconProvider) {
            $mdIconProvider
                .iconSet('social','img/icons/sets/social-icons.svg', 24)
                .iconSet('content','img/icons/sets/content-icons.svg', 24)
                .iconSet('action','img/icons/sets/action-icons.svg', 24)
                .iconSet('nav','img/icons/sets/navigation-icons.svg', 24)
                .iconSet('av','img/icons/sets/av-icons.svg', 24)
                .defaultIconSet('img/icons/sets/core-icons.svg', 24);
        })
        .filter('keyboardShortcut', function($window) {
            return function(str) {
                if (!str) return;
                var keys = str.split('-');
                var isOSX = /Mac OS X/.test($window.navigator.userAgent);
                var seperator = (!isOSX || keys.length > 2) ? '+' : '';
                var abbreviations = {
                    M: isOSX ? '⌘' : 'Ctrl',
                    A: isOSX ? 'Option' : 'Alt',
                    S: 'Shift'
                };
                return keys.map(function(key, index) {
                    var last = index == keys.length - 1;
                    return last ? key : abbreviations[key];
                }).join(seperator);
            };
        })
        .directive('ngMenubar', function() {
            return {
                restrict: "E",
                templateUrl: "views/menubar.html"
            }
        })
        /* This is a factory service that is used for inter-controller communication and so on */
        .factory('AnnowebService', function($rootScope) {
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
    /* This is the main controller for the web app. It handles initialization, loading files, menu actions and so on. */
    function annoWebController($mdDialog, $scope, AnnowebService) {
        console.log("annoWebController initialized");
        var vm = this;
        vm.settings = {
            printLayout: true,
            showRuler: true,
            showSpellingSuggestions: true,
            presentationMode: 'edit'
        };
        vm.sampleAction = function(ev) {
            if (name=='Open') vm.fileselect();
            else {
                $mdDialog.show($mdDialog.alert()
                    .title(name)
                    .textContent('You triggered the "' + name + '" action')
                    .ok('Great')
                    .targetEvent(ev)
                );
            }
        };
        /* A hack to click on the file element (called from menu etc) - some parts of web-apps are still kludgy */
        vm.fileselect = function() {
            setTimeout(function() {
                document.getElementById('fileinput').click()
                vm.clicked = true;
            }, 0);
        };
        /* If that's worked then the file selector value changes. Ask the service to load the file handle */
        $scope.$watch('file', function (newVal) {
            if (newVal) { AnnowebService.loadfile(newVal); }
        });

    }



})();
