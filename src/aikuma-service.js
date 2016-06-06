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
        .factory('aikumaService', ['$animate', '$rootScope', '$window', '$translate', 'audioService', function ($animate, $rootScope, $window, $translate, audioService) {
            var ser = {};
            ser.languages = [];
            
            ser.errorFlash = function(element) {
                audioService.errorBeep();
                $animate.addClass(element, 'errorflash').then(function() {
                    $animate.removeClass(element, 'errorflash');
                    console.log('removing');
                });
            };
            
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
                var blobzor = new Blob(vtt, {type: "text/plain;charset=utf-8"});
                // if this is running as Chrome Packaged App then let's use the file API
                if (window.chrome && chrome.app && chrome.app.runtime) {
                    chromeAppSave('annotation.' + fileExt, blobzor, function() {
                        console.log('saved');
                    });
                } else {
                    var a = document.createElement("a");
                    document.body.appendChild(a);
                    a.style = "display: none";
                    var url = window.URL.createObjectURL(blobzor);
                    a.href = url;
                    a.download = 'annotation.' + fileExt;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    return vtt;
                }
            };

            ser.elan = function() {
                var xmldef = '<?xml version="1.0" encoding="UTF-8"?>';
                var doc = document.implementation.createDocument('http://www.w3.org/2001/XMLSchema-instance', 'ANNOTATION_DOCUMENT', null);
                var elements = doc.getElementsByTagName("ANNOTATION_DOCUMENT");
                var annodoc = elements[0];
                // AUTHOR="" DATE="2006-06-13T15:09:43+01:00" FORMAT="2.3" VERSION="2.3"
                var nd = new Date();
                var xsdtime = nd.toISOString();
                var tz = nd.getTimezoneOffset() / 60;
                if (tz >= 0) {xsdtime += "+";}
                xsdtime += tz + ":00";
                annodoc.setAttribute('xsi:noNamespaceSchemaLocation', 'http://www.mpi.nl/tools/elan/EAFv2.3.xsd');
                annodoc.setAttribute('AUTHOR', '');
                annodoc.setAttribute('DATE', xsdtime);
                annodoc.setAttribute('FORMAT', '2.3');
                annodoc.setAttribute('VERSION', '2.3');
                var header = doc.createElement('HEADER');
                header.setAttribute('MEDIA_FILE', '');
                header.setAttribute('TIME_UNITS', 'milliseconds');
                var mediadesc = doc.createElement('MEDIA_DESCRIPTOR');
                mediadesc.setAttribute('MEDIA_URL', '');
                mediadesc.setAttribute('MIME_TYPE', '');
                // If operating on extracted audio, we should make a MEDIA_DESCRIPTOR like this
                // <MEDIA_DESCRIPTOR EXTRACTED_FROM="file:///D:/Data/elan/elan-example1.mpg" MEDIA_URL="file:///D:/Data/elan/elan-example1.wav" MIME_TYPE="audio/x-wav"/>
                header.appendChild(mediadesc);
                annodoc.appendChild(header);
                //
                // Time slots
                // <TIME_SLOT TIME_SLOT_ID="ts1" TIME_VALUE="0"/>
                var timeorder = doc.createElement('TIME_ORDER');

                var timeslot = doc.createElement('TIME_SLOT');
                timeslot.setAttribute('TIME_SLOT_ID', '');
                timeslot.setAttribute('TIME_VALUE', '');

                timeorder.appendChild(timeslot);

                annodoc.appendChild(timeorder);
                //
                // Tiers
                //
                var tier = doc.createElement('TIER');
                //<TIER DEFAULT_LOCALE="en" LINGUISTIC_TYPE_REF="utterance" PARTICIPANT="" TIER_ID="K-Spch">
                tier.setAttribute('DEFAULT_LOCALE', '');
                tier.setAttribute('LINGUISTIC_TYPE_REF', 'utterance'); // adopt this for simple annotations
                tier.setAttribute('PARTICIPANT', '');
                tier.setAttribute('TIER_ID', '');

                //<ANNOTATION>
                //<ALIGNABLE_ANNOTATION ANNOTATION_ID="a8" TIME_SLOT_REF1="ts4" TIME_SLOT_REF2="ts23">
                //    <ANNOTATION_VALUE>so you go out of the Institute to the Saint Anna Straat.</ANNOTATION_VALUE>
                //</ALIGNABLE_ANNOTATION>
                //</ANNOTATION>

                var annotation = doc.createElement('ANNOTATION');
                var annoalign = tier.appendChild(annotation);
                annoalign.setAttribute('ANNOTATION_ID', '');
                annoalign.setAttribute('TIME_SLOT_REF1', '');
                annoalign.setAttribute('TIME_SLOT_REF2', '');

                var annoval = doc.createElement('ANNOTATION_VALUE');
                annoval.value = '';
                var foo = annoalign.appendChild(annoval);

                annodoc.appendChild(tier);

                //
                // LINGUISTIC_TYPE
                //
                // <LINGUISTIC_TYPE GRAPHIC_REFERENCES="false" LINGUISTIC_TYPE_ID="utterance" TIME_ALIGNABLE="true"/>
                var lingtype = doc.createElement('LINGUISTIC_TYPE');
                lingtype.setAttribute('GRAPHIC_REFERENCES', 'false');
                lingtype.setAttribute('LINGUISTIC_TYPE_ID', 'utterance');
                lingtype.setAttribute('TIME_ALIGNABLE', 'true');

                annodoc.appendChild(lingtype);
                //
                // LOCALE
                //
                // <LOCALE COUNTRY_CODE="US" LANGUAGE_CODE="en"/>
                var locale = doc.createElement('LOCALE');
                locale.setAttribute('COUNTRY_CODE', 'US');
                locale.setAttribute('LANGUAGE_CODE', 'en');

                annodoc.appendChild(locale);
                //
                // CONSTRAINT & CONTROLLED VOCABULARY  not implemented
                //


                //doc.appendChild(annodoc);

                var serializer = new XMLSerializer();
                var xmlString = xmldef + serializer.serializeToString(doc);
                xmlString = xmlString.split('>').join('>\n');

                var blobzor = new Blob([xmlString], {type: "text/xml;charset=utf-8"});
                // if this is running as Chrome Packaged App then let's use the file API
                if (window.chrome && chrome.app && chrome.app.runtime) {
                    chromeAppSave('annotation.xml', blobzor, function () {
                        console.log('saved');
                    });
                } else {
                    var a = document.createElement("a");
                    document.body.appendChild(a);
                    a.style = "display: none";
                    var url = window.URL.createObjectURL(blobzor);
                    a.href = url;
                    a.download = 'annotation.xml';
                    a.click();
                    window.URL.revokeObjectURL(url);
                }
            };

            function errorHandler(e) {
                console.error(e);
            }

            function chromeAppSave(filename, blobby, callback) {
                var config = {type: 'saveFile', suggestedName: filename};
                chrome.fileSystem.chooseEntry(config, function(writableEntry) {
                    if (!writableEntry) {return;}
                    writableEntry.createWriter(function (writer) {
                        writer.onerror = errorHandler;
                        writer.onwriteend = function(e) {
                            e.currentTarget.truncate(e.currentTarget.position);
                            callback();
                        };
                        console.log('b',blobby);
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
