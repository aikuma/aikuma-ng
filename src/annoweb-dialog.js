(function(){

    /* This module defines a service for displaying dialogs */
    angular
        .module('annoweb-dialog', [])
        .factory('AnnowebDialog', ['$document', '$mdDialog', '$mdToast', function ($document, $mdDialog, $mdToast) {
            var factory = {};
            factory.newAnno = function(ev, userId, sessionId) {
                $mdDialog.show({
                        controller: newAnnotationController,
                        controllerAs: 'dCtrl',
                        templateUrl: 'views/templates/dialog-newAnnotation.html',
                        parent: angular.element(document.body),
                        targetEvent: ev,
                        clickOutsideToClose: true,
                        locals: {userId: userId, sessionId: sessionId}
                    });
            };
            factory.newMetadata = function(ev, userId, sessionId) {
                $mdDialog.show({
                    controller: newMetaDialogController,
                    controllerAs: 'mdCtrl',
                    templateUrl: 'views/templates/dialog-newMeta.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    locals: {userId: userId, sessionId: sessionId}
                });
            };
            factory.alert = function(alerttitle, alerttext, callbackfunc) {
                $mdDialog.show(
                    $mdDialog.alert({onRemoving: callbackfunc})
                        .parent(angular.element(document.querySelector('#popupContainer')))
                        .clickOutsideToClose(true)
                        .title(alerttitle)
                        .textContent(alerttext)
                        .ariaLabel(alerttitle)
                        .ok('Yeah OK')
                    //.targetEvent(ev)
                );
            };
            factory.toast = function(toasttext) {
                $mdToast.show(
                    $mdToast.simple()
                        .parent($document[0].querySelector('#popupContainer'))
                        .hideDelay(2000)
                        .position("top left")
                        .textContent(toasttext)
                );
            };
            return factory;
        }]);

    var newAnnotationController = function ($mdDialog, $timeout, $q, $log, userId, sessionId, annoService) {
        var self = this;
        self.types = [
            {
                name: 'Annotation'
            },
            {
                name: 'Translation'
            },
            {
                name: 'Comments'
            },
            {
                name: 'Other'
            }
        ];
        self.choices = [{type:'Annotation'}];
        self.hide = function() {
            $mdDialog.hide();
        };
        self.cancel = function() {
            $mdDialog.cancel();
        };
        self.answer = function(answer) {
            $mdDialog.hide(answer);
        };
        // list of `language` value/display objects
        self.languages = loadAllx();
        self.options = {
            'autoregion': {
                name: 'Auto segment (by silence)',
                selected: false,
                disabled: true,
                incompatible: 'continuous'
            },
            'dummydata': {
                name: 'Insert dummy data',
                selected: false,
                disabled: false,
                incompatible: null
            },
            'continuous': {
                name: 'Simple annotation',
                selected: true,
                disabled: false,
                incompatible: 'autoregion'
            }
        };
        self.optionlist = Object.keys(self.options);

        self.querySearch   = querySearch;
        self.selectedItemChange = selectedItemChange;
        self.invalid = true;
        self.addNewChoice = function() {
            self.choices.push({});
        };
        self.removeChoice = function(idx) {
            self.choices.splice(idx);
        };
        self.makeAnno = function() {
            var annos = [];
            self.choices.forEach(function(choice){
                if (choice.searchText) {
                    if (!choice.type) {choice.type='Unknown';}
                    annos.push({
                        lang: choice.searchText,
                        ISO: choice.ISO,
                        type: choice.type
                    });
                }
            });
            var as_options = {};
            self.optionlist.forEach(function(o) {
                as_options[o] = self.options[o].selected;
            });
            annoService.createAnnotations(userId, sessionId, annos, as_options);
            $mdDialog.hide();
        };

        self.newLanguage = function(language) {
        };

        self.optionToggle = function(item) {
            if (self.options[item].disabled) {return;}
            var newstate = !self.options[item].selected;
            var incitem = self.options[item].incompatible;
            if (newstate) {
                if (incitem) {
                    self.options[incitem].selected = false;
                    self.options[incitem].disabled = true;
                }
            } else {
                if (incitem) {
                    self.options[incitem].disabled = false;
                }
            }
            self.options[item].selected = newstate;
        };

        self.isDisabled = function(item) {
            return self.options[item].disabled;
        };

        self.lastFilled = function() {
            var lastitem = _.last(self.choices);
            if (lastitem.searchText && lastitem.type) {
                return true;
            } else {
                return false;
            }
        };

        function querySearch (query) {
            return query ? self.languages.filter( createFilterFor(query) ) : self.languages;
        }
        function selectedItemChange(item,idx) {
            $log.info('Item changed to ' + JSON.stringify(item));
            if (item.id) {self.choices[idx].ISO = item.id;}
        }

        function loadAllx() {
            var languages=[];
            annoService.languages.forEach( function(s) {
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
    newAnnotationController.$inject = ['$mdDialog', '$timeout', '$q', '$log', 'userId', 'sessionId', 'annoService'];

    var newMetaDialogController = function ($mdDialog, userId, sessionId, annoService) {
        var vm = this;
        var defaultMeta = [
            {
                name: 'Description',
                icon: 'action:description',
                type: 'text'
            },
            {
                name: 'Location',
                icon: 'action:description',
                type: 'text'
            },
            {
                name: 'Discourse type',
                icon: 'action:description',
                type: 'text'
            },
            {
                name: 'Description',
                icon: 'action:description',
                type: 'text'
            },
            {
                name: 'Description',
                icon: 'action:description',
                type: 'text'
            },
            {
                name: 'Description',
                icon: 'action:description',
                type: 'text'
            },
            {
                name: 'Description',
                icon: 'action:description',
                type: 'text'
            },
        ]



    };
    newAnnotationController.$inject = ['$mdDialog', 'userId', 'sessionId', 'annoService'];
    
})();


