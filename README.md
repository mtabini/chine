# Chine: a finite-state machine execution engine

Chine (pronounced “sheen”) allows you to split a task into a variety of steps that can be executed asynchronously by a finite-state machine (fsm). The machine can be executed in a deterministic, but arbitrarily complex, sequence.

## Example

Here's a simple example that asks for a username (it's only a couple dozen or so lines without the comments):

```javascript

var readline = require('readline');

var Chine = require('./lib');

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

```

## What happens in this script

Any time the `run` method of the machine is executed, the corresponding `run` method of the current state is invoked. At each state, you get to decide what can be done and what the next state is going to be. Chine helps you by giving you way to express which steps are admissible in input and output, thus reducing the complexity of the overall task.

Here's what happens in this script as you go through its execution (you can run it a copy of it in the `/demo` directory):

    node demo/auth.js

As the script starts, it defines the various states of the fsm and specifies the starting state, `initial`. It then creates a `readline` object and starts listening for user input.

The `initial` state's `run` method is invoked when the last line of the script is executed; it outputs a string of text and then transitions to `wait for username`. The transition is legal, because `wait for username` is in `initial`'s outgoing routes, and `initial` is in `wait for username`'s incoming routes. If this weren't the case, or if you tried to transition to a non-existing route, Chine would throw an exception.

    > Enter a username
    invalid

We have now entered a new line of text, which causes the `line` event to trigger on our `readline` instance. The `fsm.run` method is used as its handler; it receives the text of the line, which is transparently passed to the `run` method of the current state.

Here, we check the input and transition to `success` if it's correct. In `success`'s `run` method, we output some more text and, since `Chine` is a subclass of `EventEmitter`, emit the `success` event, which is caught by a handler that terminates the script.

If the value the user has input is _incorrect,_ on the other hand, we transition back to `initial`. In `initial`, we now have an `enter` handler, which is triggered as soon as the machine enters the state. In enter, we simply tell the machine to run again, which causes our state to be executed and the cycle to start from the beginning.

This is important, because transitioning to a state does not cause it to be executed—if we didn't have an `enter` handler that forces the machine to execute one more time, the process would just stall. (Incidentally, the `enter` handler is not called when the machine is first run in its starting state.)

There is also a corresponding `leave` handler, but we're not using it here.

## Cloning and serializing
Because creating a new machine is a very expensive operation, you can actually _clone_ one, thus creating a copy that has its own runtime context:

```javascript

var fsm = new Chine('initial state');

// Configure your fsm

var clone = fsm.clone();

```

You can clone a machine as many times as you want; note that the `clone` method doesn't create a copy of the current machine execution state—it _always_ creates a new one.

If you actually want to “freeze” a machine _and_ its current execution state—including any data you may have stored in it at runtime, you can instead serialize it:

```

var serialized = fsm.serialize();

// Later:

var fsm_new = fsm.unserialize(serialized);

```

The `unserialize` method takes control of the serialized object you pass to it, which can no longer be reused. If you need unserialize the same machine, in the same execution state, more than once, you must feed `unserialize` a _copy_ of the original serialized object (you can just use `JSON.stringify()` and `JSON.parse()` to create a quick clone of a serialized fsm).

Note that serialization will likely fail if you attach any functions to the runtime context of a fsm, particularly if you intend to serialize to an external resource. Also, note that `unserialize()`, much like `clone()` returns a _new_ fsm. The original fsm is left intact and is just used as a factory.

## When to use Chine

The script above also serves as a good example of when _not_ to use Chine. This trivial login system could be written in a few lines of code and doesn't require anything as complex as a finite-state machine.

Chine gives you a couple of interesting features. The first is that it helps you to break down a complex process into a series of discrete steps. You can focus on each state individually, and avoid having to deal with a massive amount of logic all in one place. Because state is incorporated in the fsm's design, you can also use it as a session object to maintain information across multiple requests, for example in a web app.

In general, fsms are useful whenever you have complex tasks that follow a determistic but very complex flow. A typical example would be an online shopping cart, which follows a set of discrete steps (shipping, billing, charging, confirmation, processing, notifications, etc.), some of which could happen days or even weeks apart from each other. Chine can greatly simplify their implementation, and serialization allows you to “freeze and thaw” a machine as needed.

## Contribute

Patches are welcome, but only if accompanied by a matching test case. Bug reports, questions, and comments are equally appreciated! You can also reach the author directly [on Twitter](https://twitter.com/mtabini).
