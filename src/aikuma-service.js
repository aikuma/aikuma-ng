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
        .factory('aikumaService', ['$animate', '$rootScope', '$window', '$translate', 'audioService', 'fileService',
                                    function ($animate, $rootScope, $window, $translate, audioService, fileService) {
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

            function createShiftArr (step) {
                var space = '';
                if (isNaN(parseInt(step))) // argument is string
                    space = step;
                else // argument is integer
                    for (var i = 0; i < step; i++)
                        space += ' ';

                var shift = ['\n']; // array of shifts

                for (var ix = 0; ix < 100; ix++)
                    shift.push(shift[ix] + space);

                return shift;
            }

            ser.prettify = function(xml, indent) {
                if (isFinite(indent)) {
                    if (indent !== 0)
                        indent = indent || 2;
                } else if (!angular.isString(indent))
                    indent = 2;

                var arr = xml.replace(/>\s*</gm, '><')
                    .replace(/</g, '~::~<')
                    .replace(/\s*xmlns([=:])/g, '~::~xmlns$1')
                    .split('~::~');

                var len = arr.length,
                    inComment = false,
                    depth = 0,
                    string = '',
                    shift = createShiftArr(indent);

                for (var i = 0; i < len; i++) {
                    // start comment or <![CDATA[...]]> or <!DOCTYPE //
                    if (arr[i].indexOf('<!') !== -1) {
                        string += shift[depth] + arr[i];
                        inComment = true;

                        // end comment or <![CDATA[...]]> //
                        if (arr[i].indexOf('-->') !== -1 || arr[i].indexOf(']>') !== -1 ||
                            arr[i].indexOf('!DOCTYPE') !== -1) {
                            inComment = false;
                        }
                    } else if (arr[i].indexOf('-->') !== -1 || arr[i].indexOf(']>') !== -1) { // end comment  or <![CDATA[...]]> //
                        string += arr[i];
                        inComment = false;
                    } else if (/^<\w/.test(arr[i - 1]) && /^<\/\w/.test(arr[i]) && // <elm></elm> //
                        /^<[\w:\-\.,]+/.exec(arr[i - 1]) == /^<\/[\w:\-\.,]+/.exec(arr[i])[0].replace('/', '')) { // fixme WTF?
                        string += arr[i];
                        if (!inComment) depth--;
                    } else if (arr[i].search(/<\w/) !== -1 && arr[i].indexOf('</') === -1 && arr[i].indexOf('/>') === -1) // <elm> //
                        string += !inComment ? (shift[depth++] + arr[i]) : arr[i];
                    else if (arr[i].search(/<\w/) !== -1 && arr[i].indexOf('</') !== -1) // <elm>...</elm> //
                        string += !inComment ? shift[depth] + arr[i] : arr[i];
                    else if (arr[i].search(/<\//) > -1) // </elm> //
                        string += !inComment ? shift[--depth] + arr[i] : arr[i];
                    else if (arr[i].indexOf('/>') !== -1) // <elm/> //
                        string += !inComment ? shift[depth] + arr[i] : arr[i];
                    else if (arr[i].indexOf('<?') !== -1) // <? xml ... ?> //
                        string += shift[depth] + arr[i];
                    else if (arr[i].indexOf('xmlns:') !== -1 || arr[i].indexOf('xmlns=') !== -1) // xmlns //
                        string += shift[depth] + arr[i];
                    else
                        string += arr[i];
                }
                return string.trim();
            };


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

            ser.writeElanXML = function(sourceFileBlob, sourceFileType, plainFileName, userData, sessionData, annotationObjList) {
                //
                // These functions create timeslot ids, tier ids and annotation ids
                //
                var tsidx = 0;
                var timeSlots = {};
                function getTimeslot(time) {
                    tsidx++;
                    timeSlots['ts'+tsidx] = time;
                    return 'ts'+tsidx;
                }
                var tierIds = [];
                function getTierId(instr) {
                    var tid = 1;
                    while (tierIds.indexOf(instr+tid) !== -1) {
                        ++tid;
                    }
                    tierIds.push(instr+tid);
                    return instr+tid;
                }
                var annoIds = [];
                function getAnnoId(instr) {
                    var tid = 1;
                    while (annoIds.indexOf(instr+tid) !== -1) {
                        ++tid;
                    }
                    annoIds.push(instr+tid);
                    return instr+tid;
                }
                //
                // Build an array of tiers which we will use in the XML writing phase
                //
                var tiers = [];
                // loop through each segID
                _.each(sessionData.segments, function(segdata, segment) {
                    // get the annotations for this segID
                    var thisAnnos = _.filter(annotationObjList, function(anno){
                        return anno.data.segment.sourceSegId === segment;
                    });
                    // if we have annotations, start making tiers
                    var segHandles = [];
                    var parTier = '';
                    if (thisAnnos.length > 0 && thisAnnos[0].data.segment.annotations.length) {
                        segdata.forEach(function(seg){
                            var ts1 = getTimeslot(seg[0]);
                            var ts2 = getTimeslot(seg[1]);
                            segHandles.push([ts1,ts2]);
                        });
                        var annodata = [];
                        thisAnnos[0].data.segment.annotations.forEach(function(anno){
                            annodata.push({
                                txt: anno,
                                id: getAnnoId('a')
                            });
                        });
                        var tiername = thisAnnos[0].data.type.replace('anno_','');
                        parTier = getTierId(tiername);
                        var tier = {
                            id: parTier,
                            type: 'parent',
                            annos: annodata,
                            seg: segHandles // segdata
                        };
                        tiers.push(tier);
                    }
                    if (thisAnnos.length > 1) {
                        for (var i = 1; i < thisAnnos.length; i++) {

                            var sannodata = [];
                            thisAnnos[i].data.segment.annotations.forEach(function(anno, idx){
                                sannodata.push({
                                    txt: anno,
                                    id: getAnnoId('a'),
                                    ref: annodata[idx].id // this gets the id from the parent
                                });
                            });
                            var stier = {
                                id: getTierId(thisAnnos[i].data.type),
                                type: 'ref',
                                ref: parTier,
                                annos: sannodata,
                                seg: segHandles
                            };
                            tiers.push(stier);
                        }
                    }
                });
                //
                // Create the XML
                //
                var xmldef = '<?xml version="1.0" encoding="UTF-8"?>';
                var doc = document.implementation.createDocument('', 'ANNOTATION_DOCUMENT', null);
                doc.documentElement.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:noNamespaceSchemaLocation', 'http://www.mpi.nl/tools/elan/EAFv2.3.xsd');
                var elements = doc.getElementsByTagName("ANNOTATION_DOCUMENT");
                var annodoc = elements[0];
                // AUTHOR="" DATE="2006-06-13T15:09:43+01:00" FORMAT="2.3" VERSION="2.3"
                var nd = new Date();
                var xsdtime = nd.toISOString();
                var tz = nd.getTimezoneOffset() / 60;
                if (tz >= 0) {xsdtime += "+";}
                xsdtime += tz + ":00";
                annodoc.setAttribute('AUTHOR', userData.names[0]);          // First name of the user
                annodoc.setAttribute('DATE', xsdtime);                      // Constructed time, still incorrect
                annodoc.setAttribute('FORMAT', '2.3');
                annodoc.setAttribute('VERSION', '2.3');
                var header = doc.createElement('HEADER');
                header.setAttribute('MEDIA_FILE', '');           // We get this from the filename Aikuma decides
                header.setAttribute('TIME_UNITS', 'milliseconds');
                var mediadesc = doc.createElement('MEDIA_DESCRIPTOR');
                mediadesc.setAttribute('MEDIA_URL', 'file://'+plainFileName);
                mediadesc.setAttribute('MIME_TYPE', sourceFileType);
                // If operating on extracted audio, we should make a MEDIA_DESCRIPTOR like this
                // <MEDIA_DESCRIPTOR EXTRACTED_FROM="file:///D:/Data/elan/elan-example1.mpg" MEDIA_URL="file:///D:/Data/elan/elan-example1.wav" MIME_TYPE="audio/x-wav"/>
                header.appendChild(mediadesc);
                annodoc.appendChild(header);
                //
                // Time slots --- <TIME_SLOT TIME_SLOT_ID="ts1" TIME_VALUE="0"/>
                //
                var timeorder = doc.createElement('TIME_ORDER');
                _.each(timeSlots, function(time, id) {
                    var timeslot = doc.createElement('TIME_SLOT');
                    timeslot.setAttribute('TIME_SLOT_ID', id);
                    timeslot.setAttribute('TIME_VALUE', time);
                    timeorder.appendChild(timeslot);
                });
                annodoc.appendChild(timeorder);
                //
                // Tiers
                //
                tiers.forEach(function(tierx) {
                    var tier = doc.createElement('TIER');
                    tier.setAttribute('DEFAULT_LOCALE', 'en');
                    if (tierx.type === 'parent') {
                        tier.setAttribute('LINGUISTIC_TYPE_REF', 'utterance');
                    } else if (tierx.type === 'ref') {
                        tier.setAttribute('LINGUISTIC_TYPE_REF', 'secondary');
                        tier.setAttribute('PARENT_REF', tierx.ref);
                    }
                    tier.setAttribute('PARTICIPANT', '');
                    tier.setAttribute('TIER_ID', tierx.id);
                    // If this is a parent tier then the annotation is time alignable
                    if (tierx.type === 'parent') {
                        tierx.annos.forEach(function(anno, idx) {
                            var annotation = doc.createElement('ANNOTATION');
                            var annoalign = doc.createElement('ALIGNABLE_ANNOTATION');
                            annoalign.setAttribute('ANNOTATION_ID', anno.id);
                            annoalign.setAttribute('TIME_SLOT_REF1', tierx.seg[idx][0]);
                            annoalign.setAttribute('TIME_SLOT_REF2', tierx.seg[idx][1]);
                            var annovalue = doc.createElement('ANNOTATION_VALUE');
                            var aval = doc.createTextNode(anno.txt);
                            annovalue.appendChild(aval);
                            annoalign.appendChild(annovalue);
                            annotation.appendChild(annoalign);
                            tier.appendChild(annotation);
                        });
                    } else if (tierx.type === 'ref') { // if it's not then it's a reference annotation
                        tierx.annos.forEach(function(anno, idx) {
                            var annotation = doc.createElement('ANNOTATION');
                            var annoaref = doc.createElement('REF_ANNOTATION');
                            annoaref.setAttribute('ANNOTATION_ID', anno.id);
                            annoaref.setAttribute('ANNOTATION_REF', anno.ref);
                            var annovalue = doc.createElement('ANNOTATION_VALUE');
                            var aval = doc.createTextNode(anno.txt);
                            annovalue.appendChild(aval);
                            annoaref.appendChild(annovalue);
                            annotation.appendChild(annoaref);
                            tier.appendChild(annotation);
                        });
                    }
                    annodoc.appendChild(tier);
                });
                //
                // LINGUISTIC_TYPE -- We just make two, one which is an utterance and the other which is a symbolic association for translations and whatnot
                //
                var lingtype = doc.createElement('LINGUISTIC_TYPE');
                lingtype.setAttribute('GRAPHIC_REFERENCES', 'false');
                lingtype.setAttribute('LINGUISTIC_TYPE_ID', 'utterance');
                lingtype.setAttribute('TIME_ALIGNABLE', 'true');
                annodoc.appendChild(lingtype);
                lingtype = doc.createElement('LINGUISTIC_TYPE');
                lingtype.setAttribute('CONSTRAINTS', 'Symbolic_Association');
                lingtype.setAttribute('GRAPHIC_REFERENCES', 'false');
                lingtype.setAttribute('LINGUISTIC_TYPE_ID', 'secondary'); // Do we really need to say what it is for this?
                lingtype.setAttribute('TIME_ALIGNABLE', 'false');
                annodoc.appendChild(lingtype);
                // <CONSTRAINT DESCRIPTION="1-1 association with a parent annotation" STEREOTYPE="Symbolic_Association"/>
                var constraint = doc.createElement('CONSTAINT');
                constraint.setAttribute('DESCRIPTION', '1-1 association with a parent annotation');
                constraint.setAttribute('STEREOTYPE', 'Symbolic_Association');
                annodoc.appendChild(constraint);
                //
                // LOCALE --- apparently this is for setting IMEs for the tiers, so it might be a good idea to have major languages like cmn
                //
                var locale = doc.createElement('LOCALE');
                locale.setAttribute('COUNTRY_CODE', 'US');
                locale.setAttribute('LANGUAGE_CODE', 'en');
                annodoc.appendChild(locale);
                // CONSTRAINT & CONTROLLED VOCABULARY  not implemented

                //
                // Get XML string, run it through the prettifier and create a blob out of it
                //
                var serializer = new XMLSerializer();
                var xmlString = xmldef + serializer.serializeToString(doc);
                xmlString = ser.prettify(xmlString,2);
                zip.workerScriptsPath = "src/lib/";
                zip.createWriter(new zip.BlobWriter("application/zip"), function(writer) {
                    // use a TextReader to read the String to add
                    writer.add(plainFileName+'.eaf', new zip.TextReader(xmlString), function() {
                        // onsuccess callback, write the audio source file out
                        //writer.add(plainFileName, new zip.Data64URIReader(sourcedatauri), function() {
                        writer.add(plainFileName, new zip.BlobReader(sourceFileBlob), function() {
                            // onsuccess callback, close the zip and do the usual trick to download a blob
                            writer.close(function (blob) {
                                // blob contains the zip file as a Blob object
                                if (window.chrome && chrome.app && chrome.app.runtime) {
                                    chromeAppSave('ElanExport.zip', blob, function() {
                                        console.log('saved');
                                    });
                                } else {
                                    var a = document.createElement("a");
                                    document.body.appendChild(a);
                                    a.style = "display: none";
                                    var url = window.URL.createObjectURL(blob);
                                    a.href = url;
                                    a.download = 'ElanExport.zip';
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                }
                            });
                        });
                    }, function(currentIndex, totalIndex) {
                        //console.log(currentIndex, totalIndex);
                    });
                }, function(error) {
                    console.log('zip error',error);
                });
            };
            //
            // Uber ELAN export... exports source file and ELAN file in a zip.
            //
            ser.exportElan = function(userData, sessionData, annotationObjList, sourceFile) {
                 // now do stuff
                var plainFileName = sourceFile.split('/').pop();
                // read the file first because we need the MIME type
                fileService.getFile(sourceFile).then(function(file) {
                    ser.writeElanXML(file, file.type, plainFileName, userData, sessionData, annotationObjList, sourceFile);
                });
            };

            return ser;
        }]);


})();
