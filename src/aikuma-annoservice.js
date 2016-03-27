/**
 * Created by Mat on 26/03/2016.
 */
(function(){
    'use strict';
    angular
        .module('aikuma-anno-service', [])
        .service('annoServ', ['$timeout', 'keyService', function($timeout, keyService) {
            var asx = this;

            asx.regionList = [];     // regions for the currently active wavesurfer view (e.g. particular annotation selected)
            asx.regionMarked = false;

            // pass in the source file audio url for wavesurfer, list of annotation objects, and the session object (with wrappers)
            asx.initialize = function(audioSourceUrl, annoObjList, sessionObj, secondaryObjList, callback) {
                asx.annoObjList = annoObjList;
                asx.sessionObj = sessionObj;
                asx.secondaryObjList = secondaryObjList;
                //
                // Set up Wavesurfer
                //
                asx.wavesurfer = WaveSurfer.create({
                    backend: "WebAudio",
                    container: "#annotatePlayback",
                    normalize: true,
                    hideScrollbar: false,
                    scrollParent: true
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
                    progressColor: '#999',
                    cursorColor: '#999'
                });
                asx.wavesurfer.load(audioSourceUrl);
                asx.wavesurfer.on('audioprocess', function () {
                    var currentPos = asx.wavesurfer.getCurrentTime();
                    if (asx.regionMarked) {
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

            };

            asx.switchToAnno = function(annoIdx) {
                asx.wavesurfer.clearRegions();
                asx.regionList = [];
                asx.regionMarked = false;

                if ('annotations' in asx.annoObjList[annoIdx].data.segment) {
                    var segmentId = asx.annoObjList[annoIdx].data.segment.sourceSegId;
                    var seglist = asx.sessionObj.data.segments[segmentId];
                    asx.makeWSRegions(seglist);
                    asx.playIn = _.last(asx.regionList).end+0.001;
                }
            };

            asx.getRegionFromTime = function() {
                var thistime = asx.wavesurfer.getCurrentTime();
                asx.regionList.forEach(function(reg,idx){
                    if (thistime >= reg.start && thistime <= reg.end) {
                        return idx;
                    }
                });
                return -1;
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
            asx.makeNewRegion = function(starttime) {
                // this stuff just alternates which we use to colour when the region switches to record mode
                var colidx = 1;
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
                console.log(starttime);
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
                asx.playIn = _.last(asx.regionList).end;
            };

            asx.restoreAnnotations = function() {

            };

            // delete the last audio, remove the wavesurfer region, seek to playIn, disable recording and make a new Segmap
            asx.deleteLastRegion = function() {
                var reg = asx.regionList.pop();
                reg.remove();
                asx.regionMarked = false;
                if (asx.regionList.length) {
                    asx.playIn = _.last(asx.regionList).end;
                } else {
                    asx.playIn = 0;
                }
                asx.annoList[0].annos.pop();
            };
            
            asx.destroyAll = function() {
                keyService.clearAll();
                asx.timeline.destroy();
                asx.wavesurfer.destroy();
            };

            asx.restoreRegions = function() {

            };
            
            asx.clearAnno = function(annoIdx) {
                asx.regionList = [];
                asx.playIn = 0;
                asx.wavesurfer.clearRegions();
                asx.wavesurfer.seekTo(0);
                var segmentId = asx.annoObjList[annoIdx].data.segment.sourceSegId;
                asx.sessionObj.setSrcSegment(segmentId, []);
                asx.annoObjList[annoIdx].data.segment.annotations = [];
                asx.regionMarked = false;
            };
            
            asx.copySegment = function(annoIdx, secondaryId) {
                var secondary = asx.secondaryObjList.filter(function(secData) { return secData._ID === secondaryId; });
                var sourceSegId = secondary[0].segment.sourceSegId;
                var segList = asx.sessionObj.data.segments[sourceSegId];
                var AnnoSegmentId = asx.annoObjList[annoIdx].data.segment.sourceSegId;
                asx.sessionObj.setSrcSegment(AnnoSegmentId, segList);
                asx.annoObjList[annoIdx].data.segment.copied_from = {
                    secondarySegId: secondaryId,
                    length: segList.length
                };
                asx.makeWSRegions(segList);
                asx.playIn = _.last(asx.regionList).end + 0.001;
                asx.annoObjList[annoIdx].data.segment.annotations = [];
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
                if (asx.annoObjList[annoIdx].data.segment.hasOwnProperty('"sourceSegId"')) {
                    segmentId = asx.annoObjList[annoIdx].data.segment.sourceSegId;
                    asx.sessionObj.setSrcSegment(segmentId, seglist);
                } else {
                    segmentId = asx.sessionObj.addSrcSegment(seglist);
                    asx.annoObjList[annoIdx].data.segment['sourceSegId'] = segmentId;
                }
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
            asx.seekRegion = function(idx) {
                if (asx.regionMarked) {
                    asx.deleteLastRegion();
                    //vm.curRegion = -1;
                }
                asx.seekToTime(asx.regionList[idx].start);

                asx.regionList[idx].play();
            };
            asx.playAudio = function(annoIdx, region) {
                asx.regionList[region].play();
            };
        }]);
})();