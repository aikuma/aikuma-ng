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
                return $mdDialog.show({
                    controller: profileController,
                    controllerAs: 'pdCtrl',
                    templateUrl: 'views/templates/dialog-profile.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    resolve: {
                        userObj: ['loginService', 'dataService', function(loginService, dataService) {
                            var userId = loginService.getLoggedinUserId();
                            if(userId)
                                return dataService.get('user', userId);
                            else
                                return null;
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
        
        if(userObj) {
            vm.userNames = userObj.data.names.map(function(nameStr){return {name: nameStr};});
            vm.userEmail = userObj.data.email;
        } else {
            vm.userNames = [{name: ''}];
            vm.userEmail = '';
        }
        
        vm.addNewNameField = function() {
            vm.userNames.push({name: ''});
        };
        
        vm.lastFilled = function() {
            var lastName = _.last(vm.userNames);
            if (lastName.name.length > 0) {
                return true;
            } else {
                return false;
            }
        };
        
        vm.save = function() {
            var names = _.pluck(vm.userNames, 'name');
            if(userObj) {
                userObj.data.names = names;
                userObj.data.email = vm.userEmail;
                userObj.save();
            } else {
                userObj = {
                    names: names,
                    email: vm.userEmail,
                    preferences: {
                        langCode: 'en'
                    }
                };
            }
            $mdDialog.hide(userObj);
        };
        
        vm.close = function() {$mdDialog.cancel();};
    };
    profileController.$inject = ['$mdDialog', '$scope', '$translate', 'userObj'];


    
})();


