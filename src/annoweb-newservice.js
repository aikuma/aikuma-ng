/**
 * Created by Mat on 20/02/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-newservice', [])
        .factory('keyService', [function () {
            var ser = {};
            var subscribers = [];
            ser.regKey= function(keypress,keypresstype, callback) {
                subscribers.push({'keypress':keypress,'keypresstype':keypresstype, 'callback': callback});
            };
            ser.clearKey = function(keypress, keypresstype) {
                var max = subscribers ? subscribers.length : 0;
                for (var i = 0; i < max; i += 1) {
                    if (subscribers[i].keypress == keypress && subscribers[i].keypresstype == keypresstype) {
                        subscribers.splice(i, 1);
                        break;
                    }
                }
            };
            ser.handleKey = function(ev) {
                subscribers.forEach(function(sub){
                    if (ev.type == sub.keypresstype && ev.keyCode == sub.keypress) {
                        sub.callback(ev);
                    }
                });
            };
            ser.clearAll = function() {
                subscribers = [];
            };
            return ser;
        }])
        .factory('aikumaService', [function () {
            var ser = {};
            ser.languages = [];
            Papa.parse("extdata/iso-639-3_20160115.tab", {
                header: true,
                download: true,
                complete: function(results) {
                    ser.languages = results.data;
                }
            });
            ser.AnnoDesc = [
                {
                    'type': 'annotation',
                    'langStr': 'English',
                    'langISO': 'en',
                    'SegId': 'seg1'
                },
                {
                    'type': 'translation',
                    'langStr': 'Chinese Mandarin',
                    'langISO': 'cmn',
                    'SegId': 'seg1'
                }
            ];

            ser.getAnnotations = function() {
                return ser.AnnoDesc;
            };

            ser.createAnnotations = function(annotations) {
                var newid = Math.max(Object.keys(ser.SegMap))+1;
                ser.SegMap[newid] = [];
                annotations.forEach(function(anno) {
                    var newanno = {
                        SegId: newid,
                        type: anno.type,
                        langStr: anno.lang,
                        langISO: anno.ISO
                    };
                    ser.AnnoDesc.push(newanno);
                });
            };
            return ser;
        }]);


})();
