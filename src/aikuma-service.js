/**
 * Created by Mat on 20/02/2016.
 */
(function(){
    'use strict';
    angular
        .module('aikuma-service', [])
        .factory('keyService', [function () {
            var ser = {};
            var subscribers = [];
            ser.regKey= function(keypress, keypresstype, callback) {
                subscribers.push({'keypress':keypress, 'keypresstype':keypresstype, 'callback': callback});
            };
            ser.clearKey = function(keypress, keypresstype) {
                var max = subscribers ? subscribers.length : 0;
                for (var i = 0; i < max; i += 1) {
                    if (subscribers[i].keypress === keypress && subscribers[i].keypresstype === keypresstype) {
                        subscribers.splice(i, 1);
                        break;
                    }
                }
            };
            ser.handleKey = function(ev) {
                subscribers.forEach(function(sub){
                    if (ev.type === sub.keypresstype && ev.keyCode === sub.keypress) {
                        sub.callback(ev);
                    }
                });
            };
            ser.clearAll = function() {
                subscribers = [];
            };
            return ser;
        }])
        .factory('aikumaService', ['$rootScope', '$window', '$translate', function ($rootScope, $window, $translate) {
            var ser = {};
            ser.languages = [];
            
            function loadLanguages(callback) {
                Papa.parse("extdata/iso-639-3_20160115.tab", {
                    header: true,
                    download: true,
                    complete: function(results) {
                        ser.languages = results.data;
                        
                        ser.langOverrides = [];
                        ser.langValueSet = new Set(_.pluck(ser.languages, 'Ref_Name').map(s => s.toLocaleLowerCase()));
                        
                        for (var langId in aikumaLangData.localizedLanguages) {
                            var langPrefList = Object.keys(aikumaLangData.localizedLanguages[langId]);
                            var curLangPref = $translate.use();
                            if(langPrefList.indexOf(curLangPref) === -1)
                                continue;
                            
                            for (var langStr of aikumaLangData.localizedLanguages[langId][curLangPref]) {
                                var langVal = langStr.toLocaleLowerCase();
                                if(!ser.langValueSet.has(langVal)) {
                                    ser.langOverrides.push({
                                        Ref_Name: langStr,
                                        Id: langId
                                    });
                                    ser.langValueSet.add(langVal);
                                }
                            }
                        }
                        angular.extend(ser.languages,ser.langOverrides);
                        callback(ser.languages);
                    }
                });
            }
            
            ser.getLanguages = function(callback) {
                if(ser.languages.length === 0) {
                    loadLanguages(callback);
                } else {
                    callback(ser.languages);
                }
            };

            ser.lookupLanguage = function(id, langList) {
                var flang = _.find(langList, function(lang) {
                    return lang.Id === id;
                });
                if (!flang) {return {short: id, full: id};}
                return {short: flang.Ref_Name, full: flang.Ref_Name + ' (' + id + ')'};
            };

            ser.mockannotations = [
                {
                    'type': 'annotation',
                    'langStr': 'English',
                    'langISO': 'en',
                    'SegId': 'seg1',
                    'annos': ['This is a bit of English', 'and a little bit more']
                },
                {
                    'type': 'translation',
                    'langStr': 'Chinese Mandarin',
                    'langISO': 'cmn',
                    'SegId': 'seg2',
                    'annos': ['這是一段中文', '也多一小段']
                }
            ];
            ser.mocksegMap = {
                'seg1': [
                    {
                        'source': [0, 2000],
                        'map': null
                    },
                    {
                        'source': [2500, 4000],
                        'map': null
                    }
                ],
                'seg2': [
                    {
                        'source': [0, 2000],
                        'map': null
                    },
                    {
                        'source': [2500, 4000],
                        'map': null
                    }
                ]
            };

            ser.voice_langs =
                [['English',         ['en-AU', 'Australia'],
                    ['en-CA', 'Canada'],
                    ['en-IN', 'India'],
                    ['en-NZ', 'New Zealand'],
                    ['en-ZA', 'South Africa'],
                    ['en-GB', 'United Kingdom'],
                    ['en-US', 'United States']],
                    ['中文',             ['cmn-Hans-CN', '普通话 (中国大陆)'],
                        ['cmn-Hans-HK', '普通话 (香港)'],
                        ['cmn-Hant-TW', '中文 (台灣)'],
                        ['yue-Hant-HK', '粵語 (香港)']],
                    ['Afrikaans',       ['af-ZA']],
                    ['Bahasa Indonesia',['id-ID']],
                    ['Bahasa Melayu',   ['ms-MY']],
                    ['Català',          ['ca-ES']],
                    ['Čeština',         ['cs-CZ']],
                    ['Deutsch',         ['de-DE']],

                    ['Español',         ['es-AR', 'Argentina'],
                        ['es-BO', 'Bolivia'],
                        ['es-CL', 'Chile'],
                        ['es-CO', 'Colombia'],
                        ['es-CR', 'Costa Rica'],
                        ['es-EC', 'Ecuador'],
                        ['es-SV', 'El Salvador'],
                        ['es-ES', 'España'],
                        ['es-US', 'Estados Unidos'],
                        ['es-GT', 'Guatemala'],
                        ['es-HN', 'Honduras'],
                        ['es-MX', 'México'],
                        ['es-NI', 'Nicaragua'],
                        ['es-PA', 'Panamá'],
                        ['es-PY', 'Paraguay'],
                        ['es-PE', 'Perú'],
                        ['es-PR', 'Puerto Rico'],
                        ['es-DO', 'República Dominicana'],
                        ['es-UY', 'Uruguay'],
                        ['es-VE', 'Venezuela']],
                    ['Euskara',         ['eu-ES']],
                    ['Français',        ['fr-FR']],
                    ['Galego',          ['gl-ES']],
                    ['Hrvatski',        ['hr_HR']],
                    ['IsiZulu',         ['zu-ZA']],
                    ['Íslenska',        ['is-IS']],
                    ['Italiano',        ['it-IT', 'Italia'],
                        ['it-CH', 'Svizzera']],
                    ['Magyar',          ['hu-HU']],
                    ['Nederlands',      ['nl-NL']],
                    ['Norsk bokmål',    ['nb-NO']],
                    ['Polski',          ['pl-PL']],
                    ['Português',       ['pt-BR', 'Brasil'],
                        ['pt-PT', 'Portugal']],
                    ['Română',          ['ro-RO']],
                    ['Slovenčina',      ['sk-SK']],
                    ['Suomi',           ['fi-FI']],
                    ['Svenska',         ['sv-SE']],
                    ['Türkçe',          ['tr-TR']],
                    ['български',       ['bg-BG']],
                    ['Pусский',         ['ru-RU']],
                    ['Српски',          ['sr-RS']],
                    ['한국어',            ['ko-KR']],
                    ['日本語',           ['ja-JP']],
                    ['Lingua latīna',   ['la']]];

            ser.getAnnotations = function() {
                return ser.mockannotations;
            };
            // make a nice language string eg: English (en)
            ser.niceLangString = function(langObj) {
                if (!langObj.langStr) {
                    return "Unknown";
                }
                if (langObj.langISO) {
                    return langObj.langStr + ' (' + langObj.langISO + ')';
                }
                return langObj.langStr;
            };

            ser.getSegmap = function(id) {
                return ser.mocksegMap[id];
            };

            ser.exportAnno = function(segList, annoList, fileformat='webvtt') {
                var vtt = [];
                var fileExt;
                if (fileformat==='webvtt') {
                    vtt = ['WEBVTT \n\n'];
                    fileExt = 'vtt';
                } else {
                    fileExt = 'srt';
                }
                segList.forEach(function(seg, idx) {
                    vtt.push((idx + 1)+'\n');
                    var st_str = msToVtt(seg[0], fileformat);
                    var en_str = msToVtt(seg[1], fileformat);
                    vtt.push(st_str + ' --> ' + en_str + '\n');
                    annoList.forEach(function(anno){
                        if (anno[idx] !== undefined ) {
                            vtt.push(anno[idx] + '\n');
                        }
                    });
                    vtt.push('\n');
                });
                var blob = new Blob(vtt, {type: "text/plain;charset=utf-8"});
                // if this is running as Chrome Packaged App then let's use the file API
                if (window.chrome && chrome.app && chrome.app.runtime) {
                    chromeAppSave('annotation.' + fileExt, blob, function() {
                        console.log('saved');
                    });
                } else {
                    var a = document.createElement("a");
                    document.body.appendChild(a);
                    a.style = "display: none";
                    var url = window.URL.createObjectURL(blob);
                    a.href = url;
                    a.download = 'annotation.' + fileExt;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    return vtt;
                }
            };

            function chromeAppSave(filename, blobby, callback) {
                var config = {type: 'saveFile', suggestedName: filename};
                chrome.fileSystem.chooseEntry(config, function(writableEntry) {
                    writableEntry.createWriter(function (writer) {
                        writer.onerror = errorHandler;
                        writer.onwriteend = callback;
                        writer.truncate(blobby.size);
                        writer.seek(0);
                        writer.write(blobby, {type: 'text/plain'});
                    });
                });
            }

            function msToVtt(ms, fileformat) {
                var dotcomma;
                if (fileformat==='webvtt') {
                    dotcomma = '.';
                } else {
                    dotcomma = ',';
                }
                var milliseconds = parseInt(ms%1000);
                var seconds = parseInt((ms/1000)%60);
                var minutes = parseInt((ms/(1000*60))%60);
                var hours = parseInt((ms/(1000*60*60))%24);
                return pad(hours,2) + ':' + pad(minutes,2) + ':' + pad(seconds,2) + dotcomma + pad(milliseconds % 1000,3);
            }

            function pad(n, width, z) {
                z = z || '0';
                n = n + '';
                return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
            }
            function errorHandler(e) {
                console.error(e);
            }

            ser.onLine = $window.navigator.onLine;
            ser.isOnline = function() {
                return ser.onLine;
            };
            $window.addEventListener("online", function () {
                ser.onLine = true;
                $rootScope.$digest();
            }, true);
            $window.addEventListener("offline", function () {
                ser.onLine = false;
                $rootScope.$digest();
            }, true);


            return ser;
        }]);


})();
