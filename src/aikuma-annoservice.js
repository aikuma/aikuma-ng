/**
 * Created by Mat on 26/03/2016.
 */
(function(){
    'use strict';
    angular
        .module('aikuma-anno-service', [])
        .service('annoServ', ['$timeout', 'keyService', '$mdDialog', '$translate', 'audioService', function($timeout, keyService, $mdDialog, $translate, audioService) {
            var asx = this;

            asx.regionList = [];     // regions for the currently active wavesurfer view (e.g. particular annotation selected)
            asx.reg = {};
            asx.reg.regionMarked = false;
            asx.seeked = false;
            
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
                        asx.reg.curRegion = asx.getRegionFromTime();
                    }
                    var currentPos = asx.wavesurfer.getCurrentTime();
                    currentPos = Math.round(currentPos*1000)/1000;
                    if (asx.reg.regionMarked) {
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
                    if (asx.reg.regionMarked) {asx.deleteLastRegion();}
                });

            };


            asx.switchToAnno = function(annoIdx, audioSourceList) {
                asx.wavesurfer.clearRegions();
                asx.regionList = [];
                asx.reg.regionMarked = false;

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
            
            asx.playtest = function(context, fsUri, start, end) {
                audioService.playbackLocalFile(context, fsUri, start, end, function() {
                    console.log('finished');
                });
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
            asx.makeWSRegions = function(segMsec) {
                asx.regionList = [];
                segMsec.forEach(function(seg) {
                    var stime = seg[0] / 1000;
                    var etime = seg[1] / 1000;
                    asx.makeNewRegion(stime);
                    _.last(asx.regionList).update({end:etime});
                    asx.markLastRegionComplete();
                });
            };
            // builds wavesurfer regions from an annotation object (data)
            asx.makeWSRegions2 = function(annoObj, copyCol, defaultCol) {
                var sourceSegId = annoObj.segment.sourceSegId;
                var segList = asx.sessionObj.data.segments[sourceSegId];
                var copyPointCol = -1;
                if ('copiedFrom' in annoObj.segment) {
                    copyPointCol = annoObj.segment.copiedFrom.length -1;
                }
                asx.regionList = [];
                segList.forEach(function(seg, indx) {
                    var segcol;
                    var stime = seg[0] / 1000;
                    var etime = seg[1] / 1000;
                    // all this stuff is to set the colours of the regions depending if the data was copied (and hence has different audio) or not
                    if (indx <= copyPointCol) {
                        segcol = copyCol;
                    } else {
                        segcol = defaultCol;
                    }
                    asx.regionList.push(asx.makeCopyRegion(stime, etime, segcol));
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
                var hue = 198 + (colidx*40);
                _.last(asx.regionList).update(
                    {
                        color: 'hsla('+hue+', 100%, 30%, 0.1)',
                        data: {colidx:colidx}
                    }
                );
                asx.playIn = _.last(asx.regionList).end + 0.001;
            };

            asx.restoreAnnotations = function() {

            };

            // delete the last audio, remove the wavesurfer region, seek to playIn, disable recording and make a new Segmap
            asx.deleteLastRegion = function() {
                var reg = asx.regionList.pop();
                reg.remove();
                asx.reg.regionMarked = false;
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
            
            asx.availAudio = function(annoIdx, segIdx) {
                if ('copiedFrom' in asx.annoObjList[annoIdx].data.segment) {
                    if (segIdx < asx.annoObjList[annoIdx].data.segment.copiedFrom.length) {
                        return asx.annoObjList[annoIdx].data.segment.copiedFrom.secondarySegId;
                    }
                }
                return null;
            };
            
            
            asx.clearAnno = function(annoIdx) {
                asx.regionList = [];
                asx.playIn = 0;
                asx.wavesurfer.clearRegions();
                asx.wavesurfer.seekTo(0);
                var segmentId = asx.annoObjList[annoIdx].data.segment.sourceSegId;
                asx.sessionObj.setSrcSegment(segmentId, []);
                asx.annoObjList[annoIdx].data.segment.annotations = [];
                asx.reg.regionMarked = false;
                delete asx.annoObjList[annoIdx].data.segment.copiedFrom;
                asx.annoObjList[annoIdx].save();
            };

            asx.copySegment = function(annoIdx, secondaryId, color) {
                asx.clearAnno(annoIdx);
                var secondary = asx.secondaryObjList.filter(function(secData) { return secData._ID === secondaryId; });
                var sourceSegId = secondary[0].segment.sourceSegId;
                var segList = asx.sessionObj.data.segments[sourceSegId];
                var AnnoSegmentId = asx.annoObjList[annoIdx].data.segment.sourceSegId;
                asx.sessionObj.setSrcSegment(AnnoSegmentId, segList);
                asx.annoObjList[annoIdx].data.segment.copiedFrom = {
                    secondarySegId: secondaryId,
                    length: segList.length
                };
                //asx.makeWSRegions(segList);
                asx.makeWSRegions2(asx.annoObjList[annoIdx].data, color, [0,0]);
                asx.playIn = _.last(asx.regionList).end + 0.001;
                var emptyAnno = [];
                asx.regionList.forEach(function(){emptyAnno.push('');});
                asx.annoObjList[annoIdx].data.segment.annotations = emptyAnno;
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
                var length = asx.wavesurfer.getDuration();
                var floatpos = time / length;
                asx.wavesurfer.seekTo(floatpos);
            };
            asx.seekToTime_new = function(time) {
                asx.seeked = true;
                asx.wavesurfer.play(time);
            };

            asx.seekRegion = function(idx) {
                if (asx.reg.regionMarked) {
                    asx.deleteLastRegion();
                }
                asx.seekToTime(asx.regionList[idx].start);
                asx.regionList[idx].play();
            };
           
        }]);
})();