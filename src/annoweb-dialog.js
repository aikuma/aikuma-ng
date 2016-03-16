(function(){

    /* This module defines a service for displaying dialogs */
    angular
        .module('annoweb-dialog', [])
        .factory('AnnowebDialog', ['$document', '$mdDialog', '$mdToast', function ($document, $mdDialog, $mdToast) {
            var factory = {};
            factory.newMetadata = function(ev) {
                $mdDialog.show({
                    controller: newMetaDialogController,
                    controllerAs: 'mdxCtrl',
                    templateUrl: 'views/templates/dialog-newMeta.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    resolve: {
                        sessionObj: ['$route', 'dataService', function($route, dataService) {
                            var sessionId = $route.current.params.sessionId;
                            return dataService.get('session', sessionId);
                        }]
                    }
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
            factory.profile = function(ev) {
                $mdDialog.show({
                    controller: profileController,
                    controllerAs: 'pdCtrl',
                    templateUrl: 'views/templates/dialog-profile.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    resolve: {
                        userObj: ['loginService', 'dataService', function(loginService, dataService) {
                            return dataService.get('user', loginService.getLoggedinUserId());
                        }]
                    }
                });
             };
            return factory;
        }]);

    var profileController = function($mdDialog, $scope, userObj) {
        var vm = this;
        vm.namePlaceholder = 'Add names';
        vm.nameSecPlaceholder = 'Add more';
        vm.emailPlaceholder = 'Email';
        
        vm.userNames = userObj.data.names.slice();
        vm.userEmail = userObj.data.email; 
        
        vm.save = function() {
            userObj.data.names = vm.userNames;
            userObj.data.email = vm.userEmail;
            userObj.save();
            $mdDialog.hide();
        };
        
        vm.close = function() {$mdDialog.cancel();};
    };
    profileController.$inject = ['$mdDialog', '$scope', 'userObj'];

    var newMetaDialogController = function ($mdDialog, sessionObj) {
        var vm = this;
        
        vm.defaultMeta = [
            {
                name: 'META_CUSTOM',
                icon: 'action:assignment_ind'
            },
            {
                name: 'META_DESC',
                icon: 'action:description'
            },
            {
                name: 'META_LOC',
                icon: 'communication:location_on'
            },
            {
                name: 'META_CITY',
                icon: 'social:location_city'
            },
            {
                name: 'META_CONSENT',
                icon: 'communication:vpn_key'
            }
        ];
        vm.metaD = vm.defaultMeta[0];
        vm.save = function() {
            var detail = {};
            if(vm.metaD.name === 'META_CUSTOM')
                detail.name = vm.customName;
            else
                detail.name = vm.metaD.name;
            detail.icon = vm.metaD.icon;
            detail.data = vm.metaText;
            
            sessionObj.pushDetail(detail);
            sessionObj.save();
            $mdDialog.hide();
        };
        
        vm.close = function() {$mdDialog.cancel();};

    };
    newMetaDialogController.$inject = ['$mdDialog', 'sessionObj'];
    
})();


