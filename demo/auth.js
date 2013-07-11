var readline = require('readline');

var Chine = require('../lib');

// Create a new state machine

var fsm = new Chine('initial');

// Define the initial state. This will be our
// starting point.

fsm.state(function() {
    // Assign a name
    
    this.name('initial');
    
    // Define the states from which it is legal
    // to transition to this state. Attempts to transition
    // to or from anything else will result in an exception
    
    this.incoming('wait for username');
    this.outgoing('wait for username');
    
    // Execute this code as soon as the machine transitions into
    // this state

    this.enter(function() {
        // In this case, force the machine to run as soon as you
        // transition, triggering the execution of this state automatically
        
        this.machine.run();
    });
    
    // This code is execute when the machine is run in this state
    // This closure *must* either transition to a new state; attempting
    // to run the machine on the same state twice without transitioning
    // to a new state first will result in an exception.
    
    this.run(function() {
        console.log('Enter username');
        
        // Force a transition
        this.transition('wait for username');
    });
});

// A second state.

fsm.state(function() {
    this.name('wait for username');
    this.incoming('initial');
    this.outgoing('success', 'initial');
    
    this.run(function(input) {
        if (input == 'marco') {
            console.log('Congratulations! You unlock the secret');
            
            this.transition('success');
        } else {
            console.log('Invalid username. No prize for you.\n');
            
            this.transition('initial');
        }
    });
});

// A final state.

fsm.state(function() {
    this.name('success');
    this.incoming('wait for username');
    
    this.enter(function() {
        this.emit('success');
    });
});

// Instantiate an interface to stdin

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// When we get a line, we run the machine. Note that
// this portion of the app knows nothing about state--
// that's all saved in the machine itself.

rl.on('line', fsm.run.bind(fsm));

// The machine is also an event emitter, so we
// can listen for a success condition.

fsm.on('success', function() {
    console.log('Closing down. Goodbye!');
    rl.close();
});

// We can now compile and perform the initial run of
// the machine.

fsm.compile();
fsm.run();