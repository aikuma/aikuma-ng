(function(){

    /* This module defines a service for displaying dialogs */
    angular
        .module('aikuma-dialog', [])
        .factory('aikumaDialog', ['$document', '$mdDialog', '$mdToast', '$translate', '$templateRequest', '$sce', function ($document, $mdDialog, $mdToast, $translate, $templateRequest, $sce) {
            var factory = {};
            factory.newMetadata = function(ev) {
                
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
            factory.help = function(ev, page) {
                $mdDialog.show({
                    controller: helpDialogController,
                    templateUrl: 'views/templates/help/'+$translate.use()+'/'+page+'.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose:true
                });
            };
            return factory;
        }]);

    var helpDialogController = function($scope ,$mdDialog) {
        "use strict";
        $scope.hide = function() {
            $mdDialog.hide();
        };
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
    };
    helpDialogController.$inject = ['$scope','$mdDialog'];

    var profileController = function($mdDialog, $scope, $translate, userObj) {
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
    profileController.$inject = ['$mdDialog', '$scope', '$translate', 'userObj'];


    
})();


