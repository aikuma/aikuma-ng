(function(){

    /* This module defines a service for displaying dialogs */
    angular
        .module('aikuma-dialog', [])
        .factory('aikumaDialog', ['$document', '$mdDialog', '$mdToast', function ($document, $mdDialog, $mdToast) {
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
            return factory;
        }]);

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


