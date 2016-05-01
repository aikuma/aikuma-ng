describe('aikuma-viewcontrollers', function(){
    var $controller,
        $rootScope,
        $q;
    
    module.sharedInjector();
    
    beforeAll(module(
            'ngRoute',
            'ngMaterial',
            'aikuma-dialog',           // dialog and alert service (being deprecated)    
            'pascalprecht.translate',  // AKA angular translate
            'aikuma-service',          // Aikuma service (annotations)
            'aikuma-annotation',       // directive and controller for annotation UI
            'aikuma-experimental',     // experimental directives
            'aikuma-anno-service',     // Annotation UI service helper
            'aikuma-viewcontrollers',  // common controllers for view routes (when we don't have separate files)
            'aikuma-commondirectives', // common directives including the nav bar
            'aikuma-audio',            // respeaking, recording
            'aikuma-audioService',     // resampling and audio format conversion
            'angularResizable',        // used by annotation controller, Angular Material doesn't usually resize
            'indexedDB',               // used by dataservice to store metadata
            'aikuma-dataservice'       // data service dealing with metadata and files
    ));
    
    beforeAll(module(function($provide) {
        $provide.constant('config', {
            
        });
    }));
    
    beforeAll(inject(function(_$rootScope_, _$controller_, _$q_) {
        $rootScope = _$rootScope_;
        $controller = _$controller_;
        $q = _$q_;
    }));
    
    describe('homeController', function() {
        var controller, scope, location;
        
        beforeEach(function() {
            scope = $rootScope.$new();
            location = jasmine.createSpyObj('location', ['path']);
            controller = $controller('homeController', {
                $scope: scope,
                $location: location
            });
        });
        
        it('initialization test', function() {
            expect(controller.speedDial).toBeFalsy();
            expect(controller.numberOfSessions).toBe(0);
            expect(controller.getLoginStatus()).toBeFalsy();
            
            scope.$digest();
            expect(controller.currentUserName()).toBe('Unknown user');
            
        });
        
        it('internal function test', function() {
            controller.recordNew();
            expect(location.path).toHaveBeenCalledTimes(1);
            expect(location.path).toHaveBeenCalledWith('/new');
        });
    });
    
    describe('settingsController', function() {
        var controller, scope, config, userObj;
        
        beforeEach(function() {
            scope = $rootScope.$new();
            config = {
                debugMode: false,
                timeStretch: false
            }
            userObj = { 
                save: jasmine.createSpy('save'),
                data:{
                    preferences: {}
            }};
            
            controller = $controller('settingsController', {
                $scope: scope,
                userObj: userObj,
                config: config
            
            });
        })
        
        it('initialization test', function() {
            expect(controller.preferences).toEqual({});
            expect(controller.timeStretching).toBeFalsy();
            expect(controller.debugMode).toBeFalsy();
        })
        
        it('internal function test', function() {
            controller.timeStretching = true;
            controller.timeStretch();
            expect(config.timeStretch).toBeTruthy();
            
            controller.saveSetting();
            expect(userObj.save).toHaveBeenCalledTimes(1);
            
            controller.debugMode = true;
            controller.saveDebug();
            expect(config.debug).toBeTruthy();
        })
        
    });
    
});