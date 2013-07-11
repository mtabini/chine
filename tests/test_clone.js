var Chine = require('../lib');

var expect = require('chai').expect;

describe('The finite-state machine cloning system', function() {
   
    it('should allow cloning a fsm without confusing contexts', function() {
       
        var fsm = new Chine('initial');
        
        fsm.state(function() {
            
            this.name('initial');
            
            this.outgoing('step1');
            
            this.run(function(value) {
                expect(this.machine.value).to.be.undefined;
                
                this.machine.value = value;
                this.transition('step1');
            });
            
        });
        
        fsm.state(function() {
            
            this.name('step1');
            
            this.incoming('initial');
            
            this.run(function(compare) {
                expect(this.machine.value).to.equal(compare);
            });
            
        });
        
        fsm.compile();
        
        var left = fsm.clone();
        var right = fsm.clone();
        
        left.run(10);
        right.run(20);
        
        left.run(10);
        right.run(20);
    });
    
    it('should allow serializing a fsm', function() {
        var hasRun = false;
       
        var fsm = new Chine('initial');
        
        fsm.state(function() {
            
            this.name('initial');
            
            this.outgoing('step1');
            
            this.run(function() {
                this.machine.test = 'test';
                this.transition('step1');
            });
            
        });
        
        fsm.state(function() {
            
            this.name('step1');
            
            this.incoming('initial');
            
            this.run(function(compare) {
                expect(this.machine.test).to.equal('test');
                hasRun = true;
            });
            
        });
        
        fsm.compile();

        fsm.run();
        
        var serialized = fsm.serialize();
        
        var unserialized = fsm.unserialize(serialized);
        
        expect(unserialized).not.to.equal(fsm);
        
        unserialized.run();
        
        expect(hasRun).to.equal(true);
    });
    
});
