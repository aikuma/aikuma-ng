describe('aikuma-viewcontrollers', function(){
    var $controller,
        $q;
    
    module.sharedInjector();
    
    beforeAll(module(
            'pascalprecht.translate',  // AKA angular translate
            'aikuma-dataservice'       // data service dealing with metadata and files
    ));
    
    beforeAll(module(function($provide) {
        $provide.constant('config', {
            
        });
    }));
    
    beforeAll(inject(function(_$q_) {
        $q = _$q_;
    }));
    
    describe('aikumaUtils', function() {
        
        it('util function test', inject(function(aikumaUtils) {
            var alpha = aikumaUtils.createRandomAlphabets(8);
            var num = aikumaUtils.createRandomNumbers(8);
            
            expect(alpha).toEqual(jasmine.stringMatching(/[A-Z]{8}/));
            expect(num).toEqual(jasmine.stringMatching(/[0-9]{8}/));
            
        }));
    });

    

    
});