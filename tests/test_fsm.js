var Chine = require('../lib');

var expect = require('chai').expect;

describe('The finite-state machine system', function() {
   
    it('should allow specifying a valid machine', function(done) {
       
        var fsm = new Chine('initial');
        
        fsm.state(function() {
            
            this.name('initial');
            
            this.outgoing('step1');
            
            this.run(function() {
                this.transition('step1');
            });
            
        });
        
        fsm.state(function() {
            
            this.name('step1');
            
            this.incoming('initial');
            this.outgoing('step2');
            
            this.enter(function() {
                this.machine.run();
            });
            
            this.run(function() {
                this.transition('step2');
            });
            
        });
        
        fsm.state(function() {
            
            this.name('step2');
            
            this.incoming('step1');
            
            this.enter(function() {
                this.machine.run();
            });
            
            this.run(function() {
                done();
            });
            
        });
        
        fsm.compile();
        
        fsm.run();
        
    });

    it('should disallow transitioning to a non-existing state', function(done) {
       
        var fsm = new Chine('initial');
        
        fsm.state(function() {
            
            this.name('initial');
            
            this.outgoing('step1');
            
            this.run(function() {
                this.transition('step3');
            });
            
        });
        
        fsm.state(function() {
            
            this.name('step1');
            
            this.incoming('initial');
            
            this.enter(function() {
                this.machine.run();
            });
            
            this.run(function() {
                this.transition('step2');
            });
            
        });
        
        fsm.compile();
        
        expect(fsm.run).to.throw(Error);

        done();
        
    });

    it('should disallow specifying invalid incoming routes', function(done) {
       
        var fsm = new Chine('initial');
        
        fsm.state(function() {
            
            this.name('initial');
            
            this.outgoing('step1');
            
            this.run(function() {
                this.transition('step3');
            });
            
        });
        
        fsm.state(function() {
            
            this.name('step1');
            
            this.incoming('initial22');
            
            this.enter(function() {
                this.machine.run();
            });
            
            this.run(function() {
                this.transition('step2');
            });
            
        });
        
        expect(fsm.compile).to.throw(Error);

        done();
        
    });

    it('should disallow specifying invalid outgoing routes', function(done) {
       
        var fsm = new Chine('initial');
        
        fsm.state(function() {
            
            this.name('initial');
            
            this.outgoing('step12');
            
            this.run(function() {
                this.transition('step3');
            });
            
        });
        
        expect(fsm.compile).to.throw(Error);

        done();
        
    });

    
});
