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
                        // update this wavesurfer region on the fly and...
                        _.last(asx.regionList).update({end: currentPos});
                        // update the backend region on the fly
                        _.last(asx.sessionObj.data.segments[asx.r.tk])[1] = Math.floor(currentPos*1000);
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
                        asx.seekToTime(asx.regionList[asx.cursor[asx.r.tk]].start);
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
                asx.tracks.list = [];
                asx.tracks.audio = [];
                asx.secondaryObjList.forEach( function(secondary) {
                     if ('segMsec' in secondary.segment) {
                        ++trackidx;
                        var segid = secondary.segment.sourceSegId;
                        var coldat = [70+(trackidx*60),100];
                        asx.tracks[segid] = {
                            hasAudio: true,
                            audioFile: secondary.source.recordFileId,
                            segMsec: secondary.segment.segMsec,
                            type: angular.uppercase(secondary.type),
                            color: {color: 'hsl('+coldat[0]+','+coldat[1]+'%,30%)'},
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
                // some colour indication if this is a region out of bounds of secondary audio
                var thistrack = asx.tracks[asx.r.tk];
                if (thistrack.hasAudio && (asx.regionList.length >= thistrack.segMsec.length)) {
                    sat = sat * 0.2;
                }
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
                // push to real data
                asx.sessionObj.segments[asx.r.tk].pop();
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
                annoData.data.segment.annotations = []; // wipe them, don't need to init to length of seg map
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
                if (foundsec.length === 0) {
                    console.log('no more seg found, deleting '+oldseg);
                    delete asx.sessionObj.data.segments[oldseg];
                    asx.sessionObj.save();
                }

                // returns the annotation index for focus purposes
                return asx.tracks[strack].annos.indexOf(movedAnno);

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