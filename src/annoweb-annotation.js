/**
 * Created by Mat on 4/02/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-annotation', [])
        .directive("ngSimpleAnnotation", function() {
            return {
                restrict: "E",
                templateUrl: "views/edit-annotation-simple.html",
                controller: simpleAnnotationController,
                controllerAs: 'saCtrl'
            };
        });

    var simpleAnnotationController = function ($timeout, $scope, AnnowebDialog, AnnowebService, hotkeys) {
        var vm = this;
        vm.cur = 0;
        vm.regions = AnnowebService.regions;
        vm.annolist = AnnowebService.annotationlist;
        vm.active = {0:1}; // mark the first annotation as active
        vm.repeat = false;
        vm.curanno = 0; // the active annotation type index
        vm.isprevious = false;
        if (vm.cur<vm.regions.length-1) {vm.isnext = true;}
        else {vm.isnext = false;}
        vm.thisregion = AnnowebService.get_regionByIndex(vm.cur);

        vm.movePos = function (relative) {
            var sumpos = vm.cur + relative;
            if ((sumpos >= 0) && (sumpos < (vm.regions.length))) {
                vm.cur = sumpos;
                if (vm.cur==0) {vm.isprevious = false;}
                else {vm.isprevious=true;}
                if (vm.cur<vm.regions.length-2) {vm.isnext = true;}
                else {vm.isnext = false;}
                vm.thisregion = AnnowebService.get_regionByIndex(vm.cur);
                vm.start =  vm.thisregion.start;
                vm.nstart = vm.tstr(vm.start);
                vm.end =  vm.thisregion.end;
                vm.nend = vm.tstr(vm.end);
                vm.thisregion.play();
            }

        };

        // This is called when the user hits return in an input box
        vm.dataEnter = function(annoidx) {
            // is this the last annotation?
            if (AnnowebService.currentTime == 0) {
                AnnowebDialog.alert('Woah!', "Can't annotate a zero-length region matey! Play a bit first.");
                return;
            }
            if (vm.cur === vm.regions.length-1) {
                if (AnnowebService.currentTime < (AnnowebService.wavesurfer.getDuration() - 1)) {
                    AnnowebService.splitLastRegion();
                    vm.regions = AnnowebService.regions;
                    vm.movePos(1);
                    AnnowebDialog.toast('Added annotation!');
                } else {
                    AnnowebDialog.toast("You're at the end, can't add another annotation.");
                }
            } else {

            }

        };

        // pretty printing
        var makeNiceAnnoTypeStr = function(annoidx) {
            return vm.annolist[annoidx].type + ' (' + vm.annolist[annoidx].lang + ')';
        };
        // Fetch a summary object based on relative position to the vm.cur cursor.
        vm.getSummary = function(relpos) {
            var sumpos = vm.cur + relpos;
            if (sumpos >= 0 && sumpos < vm.regions.length-1) {
                var reg = AnnowebService.get_regionByIndex(sumpos);
                return {
                    'type': makeNiceAnnoTypeStr(vm.curanno),
                    'text': reg.data[vm.curanno]
                };
            }
        };
        vm.tstr = function(secs) {
            var date = new Date(null);
            date.setSeconds(secs);
            // retrieve each value individually - returns h:m:s
            if (date.getUTCHours() != 0) {
                return date.getUTCHours() + ':' + date.getUTCMinutes() + ':' +  date.getUTCSeconds() + '.' + (secs % 1).toFixed(1)*10;
            } else {
                return date.getUTCMinutes() + ':' +  date.getUTCSeconds() + '.' + (secs % 1).toFixed(1)*10;
            }

        };


        vm.togglerepeat = function() {
            AnnowebDialog.toast("That's buggy!");
            vm.repeat = !vm.repeat;
            vm.thisregion.update({loop:vm.repeat});
        };

        vm.debug = function () {
            vm.movePos(1);
            console.log(vm.regions);
        };


        $scope.$on('regionenter', function(region) {
            vm.thisregion = AnnowebService.currentRegion;
            vm.cur = vm.regions.indexOf(vm.thisregion.id);
            vm.start = vm.thisregion.start;
            vm.nstart = vm.tstr(vm.start);
            vm.end = vm.thisregion.end;
            vm.nend = vm.tstr(vm.end);
            if (vm.cur==0) {vm.isprevious = false;}
            else {vm.isprevious=true;}
            if (vm.cur<vm.regions.length-2) {vm.isnext = true;}
            else {vm.isnext = false;}
        });

        hotkeys.bindTo($scope)
            .add({
                combo: 'ctrl+space',
                description: 'Toggle playback',
                callback: function() {AnnowebService.playPause();},
                allowIn: ['INPUT']
            })
            .add({
                combo: 'ctrl+left',
                description: 'Go to previous region',
                callback: function() {vm.movePos(-1);},
                allowIn: ['INPUT']
            })
            .add({
                combo: 'ctrl+right',
                description: 'Go to next region',
                callback: function() {vm.movePos(1);},
                allowIn: ['INPUT']
            })
            .add({
                combo: 'ctrl+down',
                description: 'Alias for: Show / hide this help menu',
                callback: function() {hotkeys.toggleCheatSheet();},
                allowIn: ['INPUT']
            });

        // initially focus for the first annotation input
        $timeout(function () {
            $scope.$broadcast('inputfocus0');
            AnnowebDialog.toast('Tip: Press <control-down> for hotkeys!');
        }, 0, false);
        AnnowebService.wavesurfer.on('audioprocess', function() {
            vm.currentTime = AnnowebService.wavesurfer.getCurrentTime();
            var seglen = vm.end - vm.start;
            var progress = (100 / seglen) * (vm.currentTime-vm.start);
            vm.progressValue = progress;
            $scope.$apply();
        });

    };
    simpleAnnotationController.$inject = ['$timeout', '$scope', 'AnnowebDialog', 'AnnowebService', 'hotkeys'];

})();
