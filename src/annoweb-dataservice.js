(function() {
    'use strict';
    
    angular
        .module('annoweb-dataservice', [])
        .factory('AnnowebUtils', function() {
            var NUMBER = '0123456789';
            var LOWER_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
            var UPPER_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

            return {
                createRandomAlphabets: function(length) {
                    var id = '';
                    for(var i = 0; i < length; i++) {
                        id += UPPER_ALPHABET.charAt(Math.floor(Math.random() * UPPER_ALPHABET.length));
                    }
                    return id;
                },
                createRandomNumbers: function(length) {
                    var id ='';
                    for(var i = 0; i < length; i++) {
                        id += NUMBER.charAt(Math.floor(Math.random() * NUMBER.length));
                    }
                    return id;
                }
            };
        })
        .factory('dataService', ['$localForage', 'AnnowebUtils', function($localForage, AnnowebUtils){
            // id, lastChanged is automatically created
            var USER_TYPE='user', ITEM_TYPE='item', SECONDARY_TYPE='secondary';
            var dataModel = {
                user: {
                    name: true,
                    email: true,
                    lastModified: true,
                    items: false
                },
                item: {
                    name: true,
                    type: true,
                    lastModified: true,
                    details: false,
                    secondaries: false
                },
                secondary: {
                    name: true,
                    type: true,
                    lastModified: true,
                    details: false
                }
            }
            var validation = {
                validateRequired: function(type, data) {
                    // Type check
                    if(Object.keys(dataModel).indexOf(type) == -1)
                        return false;
                    
                    // Key check
                    var model = dataModel[type];
                    var keys = Object.keys(data);
                    for(var prop in model) {
                        var keyIdx = keys.indexOf(prop);
                        
                        if(keyIdx != -1)
                            keys.splice(keyIdx, 1);
                        else if(model[prop])
                            return false;
                    }
                    
                    if(keys.length > 0)
                        return false;
                    else
                        return true;
                }
            }
            
            var dbOps = {
                set: function(type, id, data) {
                    data.lastModified = new Date().toISOString();
                    if(!validation.validateRequired(type, data)) {
                        throw 'Validation Error'
                    }
                    
                    return $localForage.setItem(id, data);
                },
                remove: function(type, id) {
                    return $localForage.removeItem(id);  
                },
                get: function(type, id) {
                    return $localForage.getItem(id);
                }
            }
            
            var service = {};
            service.setUser = function(data, callback) {
                var id = data.email;
                
                dbOps.set(USER_TYPE, id, data).then(callback);
            }
            // Danger: No transaction....
            service.setItem = function(userId, data, callback) {
                dbOps.get(null, userId).then(function(val) {
                   if(!val)
                       throw 'User(' + userId + ') does not exist';
                    console.log(val.items);
                    if(!val.items)
                        val.items = [];
                    
                    var id = AnnowebUtils.createRandomAlphabets(8);
                    val.items.push(id);
                    dbOps.set(USER_TYPE, userId, val);
                    dbOps.set(ITEM_TYPE, id, data).then(callback);
                });
            }
            // Danger: No transaction....
            service.setSecondary = function(itemId, data, callback) {
                dbOps.get(null, itemId).then(function(val) {
                    if(!val)
                        throw 'Item(' + itemId + ') does not exist';
                    
                    if(!val.secondaries)
                        val.secondaries = [];
                    
                    var id = itemId + AnnowebUtils.createRandomNumbers(6);
                    val.secondaries.push(id);
                    dbOps.set(ITEM_TYPE, itemId, val);
                    dbOps.set(SECONDARY_TYPE, id, data).then(callback);
                });
            }
            
            service.updateItem = function(itemId, data, callback) {
                dbOps.get(null, itemId).then(function(val) {
                    if(!val)
                        throw 'Item(' + itemId + ') does not exist';
                    
                    dbOps.set(ITEM_TYPE, itemId, data).then(callback);
                });
            }
            service.updateSecondary = function(id, data, callback) {
                dbOps.get(null, id).then(function(val) {
                    if(!val)
                        throw 'Secondary(' + id + ') does not exist';
                    dbOps.set(SECONDARY_TYPE, id, data).then(callback);
                });
            }
            
            service.remove = function(id, callback) {
                dbOps.remove(null, id).then(callback);
            }
            
            service.get = function(id, callback) {
                dbOps.get(null, id).then(callback);
            }
            
            service.getItemList = function(userId, callback) {
                dbOps.get(null, userId).then(function(val) {
                    if(!val)
                        throw 'ID(' + userId + ') does not exist';
                    
                    if(val.items) {        
                        var len = val.items.length,
                            idx = 0,
                            objList = [];
                        
                        dbOps.get(null, val.items[idx]).then(function addToObjList(itemMeta) {
                            objList.push(itemMeta);
                            idx += 1;
                            if(idx == len) {
                                objList.sort(function(a, b) {
                                    return new Date(b.lastModified) - new Date(a.lastModified);
                                })
                                callback(objList);
                            }
                            else
                                dbOps.get(null, val.items[idx]).then(addToObjList);
                        });
                    }
                })
            }
            
            return service;
        }]);
    
})();