var State = require('./state');

var Chine = function Chine(initialState) {
    if (!initialState) {
        throw new Error('You must specify an initial state');
    }

    this.currentState = initialState.trim();
        
    this.compiled = false;
    this.states = {};
    
    this.previousState = null;
    this.currentState = initialState;
    
    this._hasRunCurrentState = false;
};

Chine.prototype._checkCompiled = function checkMachineCompiled() {
    if (this.compiled) throw new Error('You cannot modify a machine once it has been compiled');
};

Chine.prototype.state = function addStateToMachine(callback) {
    this._checkCompiled();
    
    var state = new State(this, callback);
    
    state.validate();
    
    if (state.name() in this.states) {
        throw new Error('Duplicate state name ' + state.name());
    }
    
    this.states[state.name()] = state;
};

Chine.prototype.compile = function compileMachine() {
    Object.keys(this.states).forEach(function(stateName) {
        
        var state = this.states[stateName];
        
        state.incoming().forEach(function(incomingStateName) {
            var incomingState = this.states[incomingStateName];
            
            if (!incomingState) {
                throw new Error('State ' + stateName + ' allows incoming transition from nonexistent state ' + incomingStateName);
            }
            
            if (incomingState.outgoing().indexOf(stateName) === -1) {
                throw new Error('State ' + stateName + ' allows incoming transitions from ' + incomingStateName + ', but it is not in its allowed outgoing routes.');
            }
        }, this);
        
        state.outgoing().forEach(function(outgoingStateName) {
            var outgoingState = this.states[outgoingStateName];
            
            if (!outgoingState) {
                throw new Error('State ' + stateName + ' allows outgoing transition to nonexistent state ' + outgoingStateName);
            }
            
            if (outgoingState.incoming().indexOf(stateName) === -1) {
                throw new Error('State ' + stateName + ' allows outgoing transitions to ' + outgoingStateName + ', but it is not in its allowed incoming routes.');
            }
        }, this);
        
    }, this);
    
    if (!(this.currentState in this.states)) {
        throw new Error('Invalid initial state ' + this.currentState);
    }
    
    if (this.states[this.currentState].incoming().length === 0 && this.states[this.currentState].enter()) {
        throw new Error('The initial state `' + this.currentState + '` has an enter handler that will never be called.');
    }
    
    this.compiled = true;
}

Chine.prototype.transition = function transitionMachine(stateName) {
    var state = this.states[stateName];
    
    if (!state) {
        throw new Error('Cannot transition to state ' + state + ', which doesn\'t exist');
    }
    
    state._checkIncomingTransition(this.currentState);
    
    this.states[this.currentState]._handleLeave();
    
    this.previousState = this.currentState;
    this.currentState = stateName;

    this._hasRunCurrentState = false;
    
    this.states[this.currentState]._handleEnter();    
};

Chine.prototype.run = function runMachine() {
    if (this._hasRunCurrentState) {
        throw new Error('The current state has already run.');
    }
    
    var state = this.states[this.currentState];
    
    state._run.apply(state, arguments);
};

module.exports = Chine;