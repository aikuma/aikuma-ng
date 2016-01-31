(function(){

/* This module defines a service for displaying dialogs */
angular
   .module('annoweb-dialog', [])
   .factory('AnnowebDialog', function($mdDialog, AnnowebService) {
      var factory = {};
      factory.newanno = function(ev) {
         $mdDialog.show({
            controller: DialogController,
            controllerAs: 'ctrl',
            templateUrl: 'views/edit-diag-new.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true
         })
         .then(function(answer) {
            factory.status = 'You said the information was "' + answer + '".';
         }, function() {
            factory.status = 'You cancelled the dialog.';
         });
      };
      return factory;
   })
   
function DialogController($mdDialog, $timeout, $q, $log, AnnowebService) {
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
      },
   ];
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
   self.options = [
      {
         name: 'Auto segment (by silence)',
         val: 'autoregion',
         selected: true
      },
      {
         name: 'Diarize (identify speakers) with entirely fictional algorithm',
         val: 'diarize',
         selected: false
      }
   ]
   self.choices = [{}];
   self.querySearch   = querySearch;
   self.selectedItemChange = selectedItemChange;
   self.invalid = true;
   self.addNewChoice = function() {
      self.choices.push({});
   };
   self.removeChoice = function(idx) {
      console.log(idx);
      self.choices.splice(idx);
   };
   self.makeAnno = function() {
      var annos = [];
      self.choices.forEach(function(choice){
         if (choice.searchText) {
            if (!choice.type) choice.type='Unknown';
            annos.push({
               lang: choice.searchText,
               ISO: choice.ISO,
               type: choice.type
            })
         }
      })
      var as_options = {};
      self.options.forEach(function(o){
         as_options[o.val] = true;
      })
      AnnowebService.setAnnos(annos, as_options);
      $mdDialog.hide();
   } 
    
    
    self.newLanguage = function(language) {
      }
      
  
    // ******************************
    // Internal methods
    // ******************************
    /**
     * Search for languages... use $timeout to simulate
     * remote dataservice call.
     */
    function querySearch (query) {
      var results = query ? self.languages.filter( createFilterFor(query) ) : self.languages;
      return results;
    }
    function selectedItemChange(item,idx) {
      $log.info('Item changed to ' + JSON.stringify(item));
      if (item.id) {self.choices[idx]['ISO'] = item.id;}
    }
     
    function loadAllx() {
       var languages=[];
       AnnowebService.languages.forEach( function(s) { 
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

}


})();


