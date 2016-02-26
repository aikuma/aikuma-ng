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

            //
            // Everything to user data
            //
            ms.data = {};

            ms.data.fileStore = {
                '1': 'img/dummy_user.jpg',
                '2': 'img/test_small.jpg'
            };

            ms.data.user = {
                'people': {
                    '1': {
                        'names': ['Mat Bettinson', '茂修'],
                        'imageFileId': '1',
                        'email': 'foo@bar'
                    },
                    '2': {
                        'names': ['Bo:ong Wind', '風高清'],
                        'imageFileId': '1',
                        'email': 'foo@bar'
                    },
                    '3': {
                        'names': ['Nick Giannopoulos'],
                        'imageFileId': '1',
                        'email': 'foo@bar'
                    },
                    '4': {
                        'names': ['Some-guy withalongalastaname', 'Terry'],
                        'imageFileId': '1',
                        'email': ''
                    }
                },
                'tags': {
                    '1': 'poor quality',
                    '2': 'good quality',
                    '3': 'requires approval',
                    '4': 'received approval',
                    '5': 'archived'
                }
            };

            // Return user data structure as above
            ms.getUserData = function(userId) {
                return ms.data.user;
            };

            // examples of methods to add or set all tags.
            // Should probably use a better id generating system :)
            ms.addUserTag = function(userId, newTagStr) {
                var newid = Math.max(Object.keys(ms.data.user.tags))+1;
                ms.data.user.tags[newid] = newTagStr;
                return newid;
            };
            ms.setUserTags = function(userId, newTagObj) {
                ms.data.user.tags = newTagObj;
            };

            //
            // Everything to handle sessions.
            //

            // mock data
            ms.data.session = {
                '1': {
                    'name': 'The Rotunda Conversation',
                    'roles': {
                        'speakers': ['1', '2', '3']
                    },
                    'tags': ['1', '3'],
                    'source': {
                        'duration': '30'
                    },
                    'images': [
                        {
                            'desc': 'A picture that has nothing to do with the recording.',
                            'fileId': '2'
                        }
                    ]
                },
                '2': {
                    'name': "A recording that doesn't actually exist",
                    'roles': {
                        'speakers': ['1', '2', '3']
                    },
                    'tags': ['1', '3']     ,
                    'source': {
                        'duration': '395'
                    },
                    'images': []
                },
                '3': {
                    'name': "Another fictional dummy data recording",
                    'roles': {
                        'speakers': ['1', '2', '3']
                    },
                    'tags': ['1', '3'],
                    'source': {
                        'duration': '2210'
                    },
                    'images': []
                }
            };
            // poke in some dates
            var nowdate = new Date();
            var olddate = new Date();
            var reallyolddate = new Date();
            olddate.setDate(olddate.getDate() -30);
            reallyolddate.setDate(reallyolddate.getDate() -90);
            ms.data.session['1'].lastChanged = nowdate.toDateString();
            ms.data.session['2'].lastChanged = olddate.toDateString();
            ms.data.session['3'].lastChanged = reallyolddate.toDateString();

            // main function to get everything
            ms.getSessionData = function(userId, sessionId) {
                return ms.data.session[sessionId];
            };

            // stupid simple function to return a session list from the session data. The real thing should sort by dates
            ms.getSessionList = function(userId) {
                var seshList = [];
                _.each(_.keys(ms.data.session), function (id) {
                    var imageLink = null;
                    if (ms.data.session[id].images.length) {
                        imageLink = ms.getFileURL(userId, ms.data.session[id].images[0].fileId);
                    } else {
                        imageLink = 'img/placeholder.png';
                    }
                    seshList.push({
                        'name': ms.data.session[id].name,
                        'lastChanged': ms.data.session[id].lastChanged,
                        'details': 'make up a details string or something',
                        'id': id,
                        'image': imageLink
                    });
                });
                console.log(seshList);
                return seshList;
            };

            // Set the person roles data. role is a string (object key) and newMembers is an array
            // overwriting previous settings
            ms.setSessionPersonRoles = function(userId, sessionId, role, newMembers) {
                ms.data.session[sessionId].roles[role] = newMembers;
            };

            // utility function

            // returns a URL for an image Id.
            ms.getFileURL = function(userId, fileId) {
                return ms.data.fileStore[fileId];
            };
            // returns a file handle for reading
            ms.getFileHandle = function(userId, fileId) {
                //
            };

            return ms;

        }]);


})();