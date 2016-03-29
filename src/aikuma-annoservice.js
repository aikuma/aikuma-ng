/**
 * Created by Mat on 26/03/2016.
 */
(function(){
    'use strict';
    angular
        .module('aikuma-anno-service', [])
        .service('annoServ', ['aikumaService', '$timeout', 'keyService', function(aikumaService, $timeout, keyService) {
            var asx = this;

            asx.regionList = [];     // regions for the currently active wavesurfer view (e.g. particular annotation selected)
            asx.r = {};
            asx.r.regionMarked = false;
            asx.cursor = {};
            asx.seeked = false;
            asx.tracks = {};
            asx.tracks.audio = [];
            asx.tracks.list = [];
            
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
                    backend: "WebAudio",
                    container: "#annotatePlayback",
                    normalize: true,
                    hideScrollbar: false,
                    scrollParent: true,
                    progressColor: '#797',
                    waveColor: '#457'
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
                    waveColor: '#4FC3F7',
                    progressColor: '#4FC3F7',
                });
                asx.wavesurfer.load(audioSourceUrl);
                asx.wavesurfer.on('audioprocess', function () {
                    // so simple, but this solution was a long time coming
                    // When the user seeks in wavesurfer, you only get a float, and getRegionFromTime() is wrong
                    // So what we do is hook into seek, immediately trigger play(), set this variable and on the very first
                    // audioprocess callback, get the valid time, pause wavesurfer and turn the flag off
                    if (asx.seeked) {
                        asx.seeked = false;
                        asx.wavesurfer.pause();
                        //asx.reg.curRegion = asx.getRegionFromTime();
                        asx.cursor[asx.r.tk] = asx.getRegionFromTime();
                    }
                    var currentPos = asx.wavesurfer.getCurrentTime();
                    currentPos = Math.round(currentPos*1000)/1000;
                    if (asx.r.regionMarked) {
                        _.last(asx.regionList).update({end: currentPos});
                    }
                });
                asx.wavesurfer.on('ready', function () {
                    // this is a hack to resize the minimap when we resize wavesurfer, it depends on any-rezize-event.js
                    var wavesurferelement = document.getElementById('annotatePlayback');
                    wavesurferelement.addEventListener('onresize', _.debounce(function () {
                            asx.miniMap.render();
                            asx.miniMap.progress(asx.miniMap.wavesurfer.backend.getPlayedPercents());
                        }, 25)
                    );
                    callback();
                });
                asx.wavesurfer.on('pause', function () {
                    if (asx.regionPlayback) {
                        asx.regionPlayback = false;
                        asx.seekToTime(asx.regionList[asx.reg.curRegion].start);
                    }

                });
                asx.wavesurfer.on('seek', function () {
                    asx.seeked = true;
                    asx.wavesurfer.play();
                    if (asx.r.regionMarked) {asx.deleteLastRegion();}
                });
                
                aikumaService.getLanguages(function (languages) {
                    asx.buildTracks(languages);
                });
            };

            asx.buildTracks = function(languages) {
                var trackidx = 0;
                asx.secondaryObjList.forEach( function(secondary) {
                     if ('segMsec' in secondary.segment) {
                        ++trackidx;
                        var segid = secondary.segment.sourceSegId;
                        var coldat = [0+(trackidx*35),100];
                        asx.tracks[segid] = {
                            hasAudio: true,
                            type: angular.uppercase(secondary.type),
                            color: {color: 'hsl('+coldat[0]+','+coldat[1]+'%,35%)'},
                            coldat: coldat,
                            icon: 'mdi:numeric-'+trackidx+'-box',
                            annos: []
                        };
                        if (secondary.type == 'respeak') {
                            asx.tracks[segid].name = 'RESPEAKING';
                            asx.tracks[segid].name = 'USE_RSPK';
                        }
                        if (secondary.type == 'translate') {
                            asx.tracks[segid].name = 'ANNO_TRANS';
                            asx.tracks[segid].name = 'USE_TRANS';
                        }
                        asx.tracks.audio.push(segid); // a record of audio tracks for buttons etc
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
                    var thisAnnoObj = {
                        text: secondary.data.segment.annotations,
                        cfg: {playSrc: true, playSec: true},
                        id: secondary.data._ID,
                        type: angular.uppercase(secondary.data.type),
                        lang: aikumaService.lookupLanguage(secondary.data.source.langIds[0], languages)
                    };
                    // This annotation uses the segmap from one of the audio files
                    if (segmentId in asx.tracks) {
                        asx.tracks[segmentId].annos.push(thisAnnoObj);
                    } else {
                        ++trackidx;
                        var coldat = [0+(trackidx*35),100];
                        // this one seems to be stand alone
                        asx.tracks[segmentId] = {
                            hasAudio: false,
                            type: angular.uppercase(secondary.data.type),
                            color: {color: 'hsl('+coldat[0]+','+coldat[1]+'%,35%)'},
                            coldat: coldat,
                            icon: 'mdi:numeric-'+trackidx+'-box',
                            annos: [thisAnnoObj]
                        };
                        asx.tracks.list.push(segmentId);
                        asx.cursor[segmentId] = 0;
                    }
                });
            };

            asx.switchToAnno = function(annoIdx, audioSourceList) {
                asx.wavesurfer.clearRegions();
                asx.regionList = [];
                asx.r.regionMarked = false;

                if (!('annotations' in asx.annoObjList[annoIdx].data.segment)) {
                    console.log('initialized new annotation');
                    var segmentId = asx.sessionObj.addSrcSegment([]);
                    asx.annoObjList[annoIdx].data.segment.sourceSegId = segmentId;
                    asx.annoObjList[annoIdx].data.segment.annotations = [];
                    asx.annoObjList[annoIdx].save();
                    asx.sessionObj.save();
                }

                var color = [0,0]; // if we've copied data from a source, we need to fetch the color
                if ('copiedFrom' in asx.annoObjList[annoIdx].data.segment) {
                    var cfid = asx.annoObjList[annoIdx].data.segment.copiedFrom.secondarySegId;
                    color = _.find(audioSourceList, function(src) {
                        return src.id === cfid;
                    }).coldat;
                }

                if ('annotations' in asx.annoObjList[annoIdx].data.segment && asx.annoObjList[annoIdx].data.segment.annotations.length) {
                    asx.makeWSRegions2(asx.annoObjList[annoIdx].data, color, [0,0]);
                    asx.playIn = _.last(asx.regionList).end + 0.001;
                }
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
                var rego = asx.wavesurfer.addRegion({
                    start: starttime,
                    end: endtime,
                    color: 'hsla('+hue+','+sat+'%,'+vol+'%,0.20)',
                    drag: false,
                    resize: false,
                    data: col
                });
                return rego;
            };

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
                    color: 'hsla('+hue+', 100%, 30%, 0.15)',
                    drag: false,
                    resize: false,
                    data: col
                });
                asx.regionList.push(reg);
            };

            asx.markLastRegionComplete = function() {
                var colidx = _.last(asx.regionList).data.colidx;
                var color = asx.tracks[asx.r.tk].coldat;
                var hue = color[0] + (colidx*5);
                var sat = color[1];
                var vol = 50 + (colidx*25);
                _.last(asx.regionList).update(
                    {
                        color: 'hsla('+hue+','+sat+'%,'+vol+'%,0.20)',
                        data: {colidx:colidx}
                    }
                );
                asx.playIn = _.last(asx.regionList).end + 0.001;
            };

            // delete the last audio, remove the wavesurfer region, seek to playIn, disable recording and make a new Segmap
            asx.deleteLastRegion = function() {
                var reg = asx.regionList.pop();
                reg.remove();
                asx.r.regionMarked = false;
                if (asx.regionList.length) {
                    asx.playIn = _.last(asx.regionList).end + 0.001;
                } else {
                    asx.playIn = 0;
                }
            };
            
            asx.destroyAll = function() {
                keyService.clearAll();
                asx.timeline.destroy();
                asx.wavesurfer.destroy();
            };

            asx.joinTrack = function(track, aIdx, strack) {
                // move the anno object (text, cfg etc) from old track to new track
                var movedAnno = asx.tracks[track].annos.splice(aIdx, 1)[0];
                var annoData = asx.annoObjList.filter(function(sec){ return sec.data._ID === movedAnno.id;})[0];
                var oldseg = annoData.data.segment.sourceSegId;
                asx.tracks[strack].annos.push(movedAnno);
                annoData.data.segment.sourceSegId = strack; // because a track key is basically a sourcesegid
                annoData.data.segment.annotations = ['ffs']; // wipe them, don't need to init to length of seg map

                annoData.save();


                // If the track we moved from has no more annos... remove it from the tracks list
                if (asx.tracks[track].annos.length === 0) {
                    console.log('track has no more annotations, deleting it');
                    var idx = asx.tracks.list.indexOf(track);
                    asx.tracks.list.splice(idx,1);
                    delete asx.tracks[track];
                }
                // now let's see if we've orphaned a source seg
                var foundsec = asx.secondaryObjList.filter(function(sec) { return sec.segment.sourceSegId === oldseg;});
                // yep, so let's delete that shit
                console.log('fs',foundsec);
                if (foundsec.length === 0) {
                    console.log('no more seg found, deleting '+oldseg);
                    delete asx.sessionObj.data.segments[oldseg];
                    asx.sessionObj.save();
                }

            };
            

            // Pass index of annotation to save
            asx.saveAnnotation = function(annoIdx) {
                //asx.annoObjList
                //asx.sessionObj
                var seglist = [];
                asx.regionList.forEach(function(reg){
                    seglist.push([Math.round(reg.start * 1000),Math.round(reg.end * 1000)]);
                });
                var segmentId;
                segmentId = asx.annoObjList[annoIdx].data.segment.sourceSegId;
                asx.sessionObj.setSrcSegment(segmentId, seglist);
                asx.annoObjList[annoIdx].save();
                asx.sessionObj.save();
            };
            
            //
            // Wavesurfer nonsense
            //
            asx.seekToTime = function(time) {
                console.log('seek to', time);
                asx.r.regionMarked = false;
                var length = asx.wavesurfer.getDuration();
                var floatpos = time / length;
                asx.wavesurfer.seekTo(floatpos);
            };

            asx.seekRegion = function(idx) {
                if (asx.r.regionMarked) {
                    asx.deleteLastRegion();
                }
                asx.seekToTime(asx.regionList[idx].start);
                asx.regionList[idx].play();
            };
           
        }]);
})();