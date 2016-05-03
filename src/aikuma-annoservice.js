/**
 * Created by Mat on 26/03/2016.
 */
(function(){
    'use strict';
    angular
        .module('aikuma-anno-service', [])
        .service('annoServ', ['$interval', 'config', 'aikumaService', '$timeout', 'keyService', function($interval, config, aikumaService, $timeout, keyService) {
            var asx = this;

            asx.regionList = [];     // regions for the currently active wavesurfer view (e.g. particular annotation selected)
            asx.r = {};
            asx.r.regionMarked = false;
            asx.cursor = {};
            asx.seeked = false;
            asx.tracks = {};
            asx.tracks.audio = [];
            asx.tracks.list = [];
            // for making colours for tracks
            asx.startHue = 120;
            asx.stepHue = 60;
            asx.userMediaElement = false;
            asx.mediaElementResolution = 25; // ms value for manual interval check
            asx.zoomMax = 200;               // maximum zoom in in pixels per second
            
            // pass in the source file audio url for wavesurfer, list of annotation objects, and the session object (with wrappers)
            asx.initialize = function(audioSourceUrl, annoObjList, sessionObj, secondaryObjList, userObj, callback) {
                asx.annoObjList = annoObjList;
                asx.sessionObj = sessionObj;
                asx.secondaryObjList = secondaryObjList;
                asx.userObj = userObj;
                //
                // Set up Wavesurfer
                //
                asx.wavesurfer = WaveSurfer.create({
                    backend: asx.timestretchEnabled ? 'MediaElement' : 'WebAudio',
                    container: "#annotatePlayback",
                    renderer: "MultiCanvas",
                    normalize: true,
                    hideScrollbar: false,
                    scrollParent: true,
                    //progressColor: '#797',
                    //waveColor: '#457'
                    progressColor: '#33627c',
                    waveColor: '#4FC3F7'
                });

                /* Initialize the time line */
                asx.timeline = Object.create(asx.wavesurfer.Timeline);
                asx.timeline.init({
                    wavesurfer: asx.wavesurfer,
                    container: "#annotate-timeline"
                });
                /* Minimap plugin */
                asx.miniMap = asx.wavesurfer.initMinimap({
                    height: 40,
                    waveColor: '#555',
                    progressColor: '#999'
                });
                asx.wavesurfer.load(audioSourceUrl);
                asx.wavesurfer.on('audioprocess', function () {
                    // so simple, but this solution was a long time coming
                    // When the user seeks in wavesurfer, you only get a float, and getRegionFromTime() is wrong
                    // So what we do is hook into seek, immediately trigger play(), set this variable and on the very first
                    // audioprocess callback, get the valid time, pause wavesurfer and turn the flag off
                    if (asx.seeked) {
                        if (config.debug){console.log('audio process event: seeked so pausing');}
                        asx.seeked = false;
                        asx.wavesurfer.pause();
                        //asx.reg.curRegion = asx.getRegionFromTime();
                        asx.cursor[asx.r.tk] = asx.getRegionFromTime();
                    } else if (asx.r.regionMarked) {
                        var currentPos = Math.round(asx.wavesurfer.getCurrentTime()*1000)/1000;
                        // update this wavesurfer region on the fly and...
                        _.last(asx.regionList).update({end: currentPos});
                        // update the backend region on the fly
                        _.last(asx.sessionObj.data.segments[asx.r.tk])[1] = Math.floor(currentPos*1000);
                    }
                });
                asx.wavesurfer.on('error', function(err) {
                    console.log('ws error: '+err);
                });
                asx.wavesurfer.on('finish', function() {
                    var currentTime = asx.wavesurfer.getCurrentTime();
                });
                asx.wavesurfer.on('ready', function () {
                    // set the minimum zoom level based on the duration and current screen width
                    asx.zoomMin = asx.wavesurfer.drawer.container.clientWidth / asx.wavesurfer.getDuration();
                    asx.currentZoom = 100;
                    // this is a hack to resize the minimap when we resize wavesurfer, it depends on any-rezize-event.js
                    asx.wavesurferElement = document.getElementById('annotatePlayback');
                    asx.resizeEvent = function() {
                        asx.miniMap.render();
                        asx.miniMap.progress(asx.miniMap.wavesurfer.backend.getPlayedPercents());
                        asx.wavesurfer.drawer.containerWidth = asx.wavesurfer.drawer.container.clientWidth;
                        asx.zoomMin = asx.wavesurfer.drawer.container.clientWidth / asx.wavesurfer.getDuration(); // set the minimum zoom level based on the duration and current screen width
                        if (asx.currentZoom < asx.zoomMin) {
                            asx.currentZoom = asx.zoomMin;
                        }
                        asx.wavesurfer.zoom(asx.currentZoom);
                    };
                    asx.wavesurferElement.addEventListener('onresize', asx.resizeEvent);
                    callback();
                });
                asx.wavesurfer.on('pause', function () {
                    if (asx.intervalPromise) {
                        $interval.cancel(asx.intervalPromise);
                        asx.endTime = false;
                    }
                    if (asx.regionPlayback) {
                        asx.regionPlayback = false;
                        asx.seekToTime(asx.regionList[asx.cursor[asx.r.tk]].start);
                    }
                });
                asx.wavesurfer.on('seek', function () {
                    if (config.debug){console.log('seek event: set seeked, begin play');}
                    if (asx.intervalPromise) {
                        $interval.cancel(asx.intervalPromise);
                        asx.endTime = false;
                    }
                    asx.seeked = true;
                    asx.wavesurfer.play();
                    if (asx.r.regionMarked) {
                        if (config.debug){console.log('seek event: regionMarked so deleteLastRegion()');}
                        asx.deleteLastRegion();
                    }
                });
                asx.wavesurfer.on('play', function () {
                    if (asx.timestretchEnabled && asx.endTime) {
                        if (config.debug){console.log('starting interval');}
                        if (!asx.intervalPromise || asx.intervalPromise.$$state.status !== 1) {
                            asx.intervalPromise = $interval(intervalUpdateTime, asx.mediaElementResolution);
                        }
                    }
                });
                var intervalUpdateTime = function() {
                    var currentTime = asx.wavesurfer.getCurrentTime();
                    if (currentTime >= asx.endTime) {
                        $interval.cancel(asx.intervalPromise);
                        if (config.debug){console.log('intervalUpdateTime: getCurrentTime() >= asx.endTime so pause');}
                        asx.wavesurfer.pause();
                        asx.endTime = false; // we must set this so interval is not triggered for regular playback

                    }
                };

                aikumaService.getLanguages(function (languages) {
                    languages = _.object(languages.map(function(obj) { return [obj.Id, obj.Ref_Name]; }));
                    asx.buildTracks(languages);
                });
            };

            asx.zoomOut = function() {
                asx.currentZoom = asx.currentZoom - 5;
                if (asx.currentZoom < asx.zoomMin) {
                    asx.currentZoom = asx.zoomMin;
                }
                asx.wavesurfer.zoom(asx.currentZoom);
            };
            asx.zoomIn = function() {
                asx.currentZoom = asx.currentZoom + 5;
                if (asx.currentZoom > asx.zoomMax) {
                    asx.currentZoom = asx.zoomMax;
                }
                asx.wavesurfer.zoom(asx.currentZoom);
            };
            asx.changeZoom = function(val) {
                   asx.currentZoom = val;
                asx.wavesurfer.zoom(val);
            };
            
            asx.buildTracks = function(languages) {
                var trackidx = 0;
                asx.tracks = {};
                asx.tracks.audio = [];
                asx.tracks.list = [];
                
                asx.secondaryObjList.forEach( function(secondary) {
                     if ('segMsec' in secondary.segment) {
                        ++trackidx;
                        var segid = secondary.segment.sourceSegId;
                        var coldat = asx.getHue(trackidx);
                        asx.tracks[segid] = {
                            trackNum: trackidx,
                            hasAudio: true,                             // When this is true, it means we have a respeaking or translation
                            hasAnno: false,                             // When this is true, we have at east one annotation (e.g. display the track)
                            audioFile: secondary.source.recordFileId,
                            segMsec: secondary.segment.segMsec,
                            color: {color: 'hsl('+coldat[0]+','+coldat[1]+'%,30%)'},
                            coldat: coldat,
                            icon: 'mdi:numeric-'+trackidx+'-box',
                            annos: []
                        };
                        if (secondary.type === 'respeak') {
                            asx.tracks[segid].type = 'RESPEAKING';
                            asx.tracks[segid].action = 'USE_RSPK';
                        }
                        if (secondary.type === 'translate') {
                            asx.tracks[segid].type = 'ANNO_TRANS';
                            asx.tracks[segid].action = 'USE_TRANS';
                        }
                        asx.tracks.audio.push(segid); // a record of audio tracks used for buttons underneath the waveform
                        asx.tracks.list.push(segid);
                        asx.cursor[segid] = 0;
                    }
                });
                asx.annoObjList.forEach(function(secondary) {
                    var segmentId;
                    if (!('sourceSegId' in secondary.data.segment)) {
                        segmentId = asx.sessionObj.addSrcSegment([]);
                        secondary.data.segment.sourceSegId = segmentId;
                        secondary.data.segment.annotations = [];
                        secondary.save();
                        asx.sessionObj.save();
                    } else {
                        segmentId = secondary.data.segment.sourceSegId;
                    }
                    secondary.data.source.langIds.forEach(function(langData) {
                        if(langData.langISO) {
                            var defaultLangStr = languages[langData.langISO];
                            if(!langData.langStr && defaultLangStr) {
                                langData.langStr = defaultLangStr;
                            }   
                        }  
                    });
                    var annoConfObj = {
                        playSrc: true, 
                        playSec: true, 
                        enabled: true, 
                        voice: asx.setVoice(secondary.data.source.langIds[0]),
                        timestretchSrc: true,
                        timestretchSec: false
                    };
                    var thisAnnoObj = {
                        
                        text: secondary.data.segment.annotations,
                        cfg: annoConfObj,
                        id: secondary.data._ID,
                        type: angular.uppercase(secondary.data.type),
                        lang: aikumaService.niceLangString(secondary.data.source.langIds[0])
                    };
                    // This annotation uses the segmap from one of the audio files
                    if (segmentId in asx.tracks) {
                        asx.tracks[segmentId].hasAnno = true;
                        asx.tracks[segmentId].annos.push(thisAnnoObj);
                    } else {
                        ++trackidx;
                        var coldat = asx.getHue(trackidx);
                        // this one seems to be stand alone
                        asx.tracks[segmentId] = {
                            hasAudio: false,
                            trackNum: trackidx,
                            hasAnno: true,
                            type: angular.uppercase(secondary.data.type),
                            color: {color: 'hsl('+coldat[0]+','+coldat[1]+'%,35%)'},
                            coldat: coldat,
                            icon: 'mdi:numeric-'+trackidx+'-box',
                            annos: [thisAnnoObj]
                        };
                        asx.tracks[segmentId].action = angular.uppercase(secondary.data.type);
                        asx.tracks.list.push(segmentId);
                        asx.cursor[segmentId] = 0;
                    }
                });
            };

            // make a default voice config option based on the language. It should be better than this, there's a lot of languages
            // which could be correctly mapped. It ought to be in aikumaService
            asx.setVoice = function(langCode) {
                var vcfg = {};
                if (langCode.langISO === 'cmn') {
                    vcfg.name = '中文';
                    vcfg.region = '中文 (台灣)';
                    vcfg.code = 'cmn-Hant-TW';
                    return;
                }
                vcfg.name = 'English';
                vcfg.region = 'United States';
                vcfg.code = 'en-US';
                return vcfg;
            };

            asx.switchToTrack = function(track) {
                asx.r.regionMarked = false;
                asx.makeWSRegions3(track);
                if (asx.regionList.length > 0) {
                    asx.playIn = _.last(asx.regionList).end + 0.001;
                } else {
                    asx.playIn = 0;
                }
            };
            
            asx.playRegion = function(region) {
                // Needed for interval process of using MediaElement
                if (asx.timestretchEnabled) {
                    asx.endTime = asx.regionList[region].end;
                }
                asx.regionList[region].play();
                asx.regionPlayback = true; // flag indicates will seek wavesurfer to start of session at the end.
            };
            
            asx.getRegionFromTime = function(seektime) {
                if (seektime === undefined) {seektime = asx.wavesurfer.getCurrentTime();}
                seektime = Math.round(seektime*1000)/1000;
                var fidx = _.findIndex(asx.regionList, function(reg){
                    return ((seektime >= reg.start) && (seektime < reg.end));
                });
                return fidx;
            };

            // make a new region list out of an array of millisecond segments
            asx.makeWSRegions3 = function(track) {
                asx.wavesurfer.clearRegions();
                var segList = asx.sessionObj.data.segments[track];
                asx.regionList = [];
                segList.forEach(function(seg, indx) {
                    var stime = seg[0] / 1000;
                    var etime = seg[1] / 1000;
                    asx.regionList.push(asx.makeCopyRegion(stime, etime, asx.tracks[track].coldat));
                });
            };

            asx.makeCopyRegion = function(starttime, endtime, color) {
                // this stuff just alternates which we use to colour when the region switches to record mode
                var colidx;
                if (asx.regionList.length) {
                    colidx = _.last(asx.regionList).data.colidx;
                } else {
                    colidx = 1;
                }
                colidx = !colidx;
                var col = {
                    colidx: colidx
                };
                var hue = color[0] + (colidx*5);
                var sat = color[1];
                var vol = 50 + (colidx*25);
                // some colour indication if this is a region out of bounds of secondary audio
                var thistrack = asx.tracks[asx.r.tk];
                if (thistrack.hasAudio && (asx.regionList.length >= thistrack.segMsec.length)) {
                    sat = sat * 0.2;
                }
                var rego = asx.wavesurfer.addRegion({
                    start: starttime,
                    end: endtime,
                    color: 'hsla('+hue+','+sat+'%,'+vol+'%,0.10)',
                    drag: false,
                    resize: false,
                    data: col
                });
                return rego;
            };

            // this is used for making regions manually, e.g. keys in the anno UI
            asx.makeNewRegion = function(starttime) {
                // this stuff just alternates which we use to colour when the region switches to record mode
                var colidx;
                if (asx.regionList.length) {
                    colidx = _.last(asx.regionList).data.colidx;
                } else {
                    colidx = 1;
                }
                if (colidx === 0) {
                    colidx = 1;
                } else {
                    colidx = 0;
                }
                var col = {
                    colidx: colidx
                };
                var hue = 90; // region is green for now
                var reg = asx.wavesurfer.addRegion({
                    start: starttime,
                    end: starttime,
                    color: 'hsla('+hue+', 100%, 30%, 0.10)',
                    drag: false,
                    resize: false,
                    data: col
                });
                asx.regionList.push(reg);
                asx.sessionObj.data.segments[asx.r.tk].push(
                    [
                        Math.floor(starttime*1000),
                        Math.floor(starttime*1000)
                    ]
                );
            };

            asx.markLastRegionComplete = function() {
                var thistrack = asx.tracks[asx.r.tk];
                var color = thistrack.coldat;
                var colidx = _.last(asx.regionList).data.colidx;
                var hue = color[0] + (colidx*5);
                var sat = color[1];
                var vol = 50 + (colidx*25);
                // some colour indication if this is a region out of bounds of secondary audio
                if (thistrack.hasAudio && (asx.regionList.length > thistrack.segMsec.length)) {
                    sat = sat * 0.2;
                    //vol = vol * 1.2;
                }
                _.last(asx.regionList).update(
                    {
                        color: 'hsla('+hue+','+sat+'%,'+vol+'%,0.10)',
                        data: {colidx:colidx}
                    }
                );
                asx.playIn = _.last(asx.regionList).end + 0.001;
            };

            // delete the last audio, remove the wavesurfer region, seek to playIn, disable recording and make a new Segmap
            asx.deleteLastRegion = function() {
                if (config.debug) {console.log('deleteLastRegion()');}
                var reg = asx.regionList.pop();
                reg.remove();
                asx.r.regionMarked = false;
                if (asx.regionList.length) {
                    if (config.debug) {console.log('still have regions, set playin to last region end:' + (_.last(asx.regionList).end + 0.001));}
                    asx.playIn = _.last(asx.regionList).end + 0.001;
                } else {
                    if (config.debug) {console.log('no regions playIn set to 0');}
                    asx.playIn = 0;
                }
                // push to real data
                asx.sessionObj.data.segments[asx.r.tk].pop();
                // The user may have entered an annotation for the current or other annotations
                // we need to clear those, otherwise they will mysteriously come back when they mark a new segment
                var lenseg = asx.sessionObj.data.segments[asx.r.tk].length;
                asx.tracks[asx.r.tk].annos.forEach(function(anno) {
                    if (anno.text.length > lenseg) {
                        anno.text.pop();
                    }
                });
            };
            
            asx.destroyAll = function() {
                if (asx.intervalPromise) {$interval.cancel(asx.intervalPromise);}
                asx.timeline.destroy();
                asx.wavesurferElement.removeEventListener('onresize', asx.resizeEvent);
                asx.wavesurfer.destroy();
            };

            asx.joinTrack = function(track, aIdx, strack) {
                // move the anno object (text, cfg etc) from old track to new track
                var movedAnno = asx.tracks[track].annos.splice(aIdx, 1)[0];
                var annoData = asx.annoObjList.filter(function(sec){ return sec.data._ID === movedAnno.id;})[0];
                var oldseg = annoData.data.segment.sourceSegId;
                asx.tracks[strack].annos.push(movedAnno);
                asx.tracks[strack].hasAnno = true;
                
                annoData.data.segment.sourceSegId = strack; // because a track key is basically a sourcesegid
                annoData.data.segment.annotations = []; // wipe them, don't need to init to length of seg map
                annoData.save();

                // We have slit from a track but the track has audio, so set the hasAnno flag false so it doesn't show up in the UI
                if (asx.tracks[track].annos.length === 0 && asx.tracks[track].hasAudio) {
                    asx.tracks[track].hasAnno = false;
                }

                // If the track we moved from has no more annos... remove it from the tracks list
                if (asx.tracks[track].annos.length === 0 && !asx.tracks[track].hasAudio) {
                    console.log('track has no more annotations and is not an audioTrack, deleting it');
                    var idx = asx.tracks.list.indexOf(track);
                    asx.tracks.list.splice(idx,1);
                    delete asx.tracks[track];
                }

                // now let's see if we've orphaned a source seg
                var foundsecLen = asx.secondaryObjList.filter(function(sec) { return sec.type.indexOf('anno_') !== 0 && sec.segment.sourceSegId === oldseg;}).length;
                foundsecLen += asx.annoObjList.filter(function(annoObj) { return annoObj.data.segment.sourceSegId === oldseg; }).length;
                
                // yep, so let's delete that shit
                if (foundsecLen === 0) {    // If nothing refers to the sourceSegment
                    console.log('no more seg found, deleting '+oldseg);
                    delete asx.sessionObj.data.segments[oldseg];
                    asx.sessionObj.save();
                }

                // returns the annotation index for focus purposes
                return asx.tracks[strack].annos.indexOf(movedAnno);

            };

            // split an annotation from a track. This can only happen if it was assigned to a track with audio
            // So we don't need to worry about orphaning anything. We just create a new segment id, copy relevant data
            // and make a new track. This will not wipe the annotations and will copy the segments from the prior track
            asx.trackSplit = function(track, aIdx) {
                var movedAnno = asx.tracks[track].annos.splice(aIdx, 1)[0];
                if (asx.tracks[track].annos.length === 0) {
                    asx.tracks[track].hasAnno = false;
                }
                var thisanno = asx.annoObjList.filter(function(ao) {return ao.data._ID === movedAnno.id;})[0];
                var copyseg = angular.copy(asx.sessionObj.data.segments[track]);
                var newsegid = asx.sessionObj.addSrcSegment(copyseg);
                thisanno.data.segment.sourceSegId = newsegid;
                // We need a new colour, and a new icon, otherwise copy stuff from old track

                var idx = 0;
                var found = false;
                while (!found) {
                    ++idx;
                    if (!_.findWhere(asx.tracks, {trackNum: idx})) {
                        found=true;
                    }
                }

                var coldat = asx.getHue(idx+1);
                asx.tracks[newsegid] = {
                    trackNum: idx,
                    hasAudio: false,
                    hasAnno: true,
                    type: asx.tracks[track].type,
                    color: {color: 'hsl('+coldat[0]+','+coldat[1]+'%,35%)'},
                    coldat: coldat,
                    icon: 'mdi:numeric-'+(idx)+'-box',
                    annos: [movedAnno]
                };
                asx.tracks[newsegid].action = angular.uppercase(asx.tracks[track].type);
                asx.tracks.list.splice(idx,0,newsegid);
                asx.cursor[newsegid] = asx.cursor[track]; // set the cursor on this track to the same as where it came from
                asx.sessionObj.save();
                thisanno.save();
                asx.r.vt = newsegid;
            };

            asx.getHue = function(index) {
                return [asx.startHue + ((index-1)*asx.stepHue), 100];
                //return [asx.startHue + (asx.tracks.list.length*asx.stepHue), 100];
            };

            // Pass index of annotation to save
            asx.saveAnnotation = function(annoIdx) {
                var aid = asx.tracks[asx.r.tk].annos[annoIdx].id;
                var thisanno = asx.annoObjList.filter(function(ao) {return ao.data._ID === aid;});
                thisanno[0].save();
                asx.sessionObj.save();
            };
            
            //
            // Wavesurfer nonsense
            //
            asx.seekToTime = function(time) {
                asx.r.regionMarked = false;
                asx.regionPlayback = false;
                var length = asx.wavesurfer.getDuration();
                var floatpos = time / length;
                asx.wavesurfer.seekTo(floatpos);
            };

            asx.seekRegion = function(idx) {
                if (asx.r.regionMarked) {
                    asx.deleteLastRegion();
                }
                asx.seekToTime(asx.regionList[idx].start);
            };
           
        }]);
})();