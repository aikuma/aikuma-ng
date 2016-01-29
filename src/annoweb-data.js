(function(){
   angular
      .module('annoweb-data',[])
      .directive("ngTabs", function() {
        return {
            restrict: "E",
            templateUrl: "views/tab-main.html"
        };
      })
      .directive("annotation", function() {
         return {
            restrict: "E",
            templateUrl: "views/tab-annotate.html",
            controller: annoTabController,
            controllerAs: 'aeditCtrl'
         };
    })
    .directive("metadata", function() {
        return {
            restrict: "E",
            templateUrl: "views/tab-metadata.html",
            controller: function($scope, AnnowebService) {
                $scope.today = function() {
                    $scope.dt = new Date();
                };
                $scope.today();

                $scope.clear = function() {
                    $scope.dt = null;
                };

                $scope.open1 = function() {
                    $scope.popup1.opened = true;
                };

                $scope.setDate = function(year, month, day) {
                    $scope.dt = new Date(year, month, day);
                };

                $scope.dateOptions = {
                    formatYear: 'yy',
                    startingDay: 1
                };

                $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
                $scope.format = $scope.formats[0];
                $scope.altInputFormats = ['M!/d!/yyyy'];

                $scope.popup1 = {
                    opened: false
                };

                $scope.popup2 = {
                    opened: false
                };


                $scope.getDayClass = function(date, mode) {
                    if (mode === 'day') {
                        var dayToCheck = new Date(date).setHours(0,0,0,0);

                        for (var i = 0; i < $scope.events.length; i++) {
                            var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

                            if (dayToCheck === currentDay) {
                                return $scope.events[i].status;
                            }
                        }
                    }
                    return '';
                };
                
                $scope.tags = ["Needs approval", "Unsolicited", "Narrative"];
            }
        };
    })
    .directive("export", function() {
        return {
            restrict: "E",
            templateUrl: "views/tab-export.html"
        };
    })
    .directive("changes", function() {
        return {
            restrict: "E",
            templateUrl: "views/tab-changes.html"
        };
    })
    .directive("status", function() {
        return {
            restrict: "E",
            templateUrl: "views/tab-messages.html",
            controller: function($scope, AnnowebService) {
                $scope.alerts = [
                    { type: 'danger', msg: 'Oh snap! Change a few things up and try submitting again.' },
                    { type: 'success', msg: 'Well done! You successfully read this important alert message.' }
                ];
                $scope.addAlert = function() {
                    $scope.alerts.push({msg: 'Another alert!'});
                };
                $scope.closeAlert = function(index) {
                    $scope.alerts.splice(index, 1);
                }; 
            }
        };       
    });
    
   /* Controller functions rather than in-line anonymous functions in the directives */
    
   function annoTabController($scope, AnnowebService, AnnowebDialog) {
      var vm = this;
      $scope.$on('regions_loaded', function() {
         console.log('annotation controller received msg.');
         console.log(AnnowebService.regionlist);
         vm.regionlist = AnnowebService.regionlist;
         if (vm.regionlist.length) vm.editable = true;
         $scope.$apply();
      })
      vm.addanno = function(ev) {
         AnnowebDialog.newanno();
      }
      $scope.$on('initannotations', function() {
         vm.editable = true;
         vm.alist = AnnowebService.annotationlist;
      });
      $scope.$on('initregions', function() {
         vm.editable = true;
         vm.regionlist = AnnowebService.regionlist;
      });
   };
   
 
    
})();