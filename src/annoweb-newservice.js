/**
 * Created by Mat on 20/02/2016.
 */
(function(){
    'use strict';
    angular
        .module('annoweb-newservice', [])

        // We'll call this to get data. It's a stand-in for the local storage/sync service.
        .factory('mockService', [function () {
            // get the list of items for the 'home' state/view. We ignore userid for this.
            var ms = {};
            ms.getPrimaryList = function(userid) {
                var nowdate = new Date();
                var olddate = new Date();
                var reallyolddate = new Date();
                olddate.setDate(olddate.getDate() -30);
                reallyolddate.setDate(reallyolddate.getDate() -90);
                return [
                    {
                        'name': "The Rotunda Conversation",
                        'lastchanged': nowdate.toISOString(),
                        'details': "36 seconds. 3 annotations. Not archived.",
                        'id': '1'
                    },
                    {
                        'name': "A recording that doesn't actually exist",
                        'lastchanged': olddate.toISOString(),
                        'details': "1 hour, 36 minutes. 2 annotations, 1 picture, 9 comments. Archived.",
                        'id': '2'
                    },
                    {
                        'name': "Another fictional dummy data recording",
                        'lastchanged': reallyolddate.toISOString(),
                        'details': "24 minutes, 9 seconds. 1 annotation. Not archived.",
                        'id': '3'
                    }
                ];
            };
            ms.getPrimaryDetails = function(projectId) {
                var dummyProjects = [
                    {
                        'name': 'The Rotunda Conversation',
                        'files': [
                            {
                                'type': 'respeaking',
                                'icon': 'av:repeat'

                            },
                            {
                                'type': 'translation',
                                'icon': 'action:translate'
                            },
                            {
                                'type': 'commentary',
                                'icon': 'communication:comment'
                            }
                        ]
                    },
                    {
                        'name': "A recording that doesn't actually exist"
                    },
                    {
                        'name': "Another fictional dummy data recording"
                     }
                ];
                return dummyProjects[projectId-1];
            };

            return ms;
        }])
        .factory('newService', ['$rootScope', 'randomColor', 'extractRegions', function ($rootScope, randomColor, extractRegions) {
            var an = {};

            an.AnnoMeta = [];
            an.SegMap = [];
            an.Annotations = {};


            return an;
        } ]);

})();