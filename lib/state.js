var State = function State(machine, setup) {
    this._name = null;
    
    this._process = null;
    this._enter = null;
    this._leave = null;
    
    this._incomingStates = {};
    this._outgoingStates = {};

    this.machine = machine;
    
    setup.call(this);
};

State.prototype.validate = function validateState() {
    if (!this.name) throw new Error('The state ' + this + ' does not have a name.');
    if (!this.process) throw new Error('The state' + this.name() + ' does not have a process function.');
    
    if (Object.keys(this._incomingStates).length == 0)
    if (Object.keys(this._outgoingStates).length == 0) {
        throw new Error('The state' + this.name() + ' has no incoming or outgoing routes');
    }
};

State.prototype.name = function nameState(name) {
    if (name) {
        this._name = name;
    } else {
        return this._name;
    } 
};

State.prototype.incoming = function allowIncomingStates() {
    if (arguments.length) {
        this._incomingStates = {};
        
        for (var index = 0, length = arguments.length; index < length; index++) {
            this._incomingStates[arguments[index]] = 1;
        }
    } else {
        return Object.keys(this._incomingStates);
    }
};

State.prototype.outgoing = function allowOutgoingStates() {
    if (arguments.length) {
        this._outgoingStates = {};
        
        for (var index = 0, length = arguments.length; index < length; index++) {
            this._outgoingStates[arguments[index]] = 1;
        }
    } else {
        return Object.keys(this._outgoingStates);
    }
};

State.prototype.enter = function setEnterCallback(callback) {
    if (arguments.length) {
        this._enter = callback;
    } else {
        return this._before;
    }
};

State.prototype.leave = function setLeaveCallback(callback) {
    if (arguments.length) {
        this._leave = callback;
    } else {
        return this._leave;
    }
};

State.prototype.process = function setStateProcessor(process) {
    if (arguments.length) {
        this._process = process; 
    } else {
        return process;
    } 
};

State.prototype.transition = function transitionState(state) {
    if (!state) throw new Error('You must provide a state name when transitioning');
    
    if (!(state in this._outgoingStates)) {
        throw new Error('You cannot transition from state ' + this._name + ' to state ' + state + ' because the latter is not in the former\'s allowed outgoing routes.');
    }
    
    this.machine.transition(state);
};

State.prototype._checkIncomingTransition = function canTransitionFromState(state) {
    if (!(state in this._incomingStates)) {
        console.log(this);
        throw new Error('You cannot transition from state ' + state + ' to state ' + this.name + ' because the former is not in the latter\'s allowed incoming routes.');
    }
};

State.prototype._handleEnter = function enterState() {
    if (this._enter) {
        this._enter();
    }
};

State.prototype._run = function runState() {
    this._process.apply(this, arguments);
};

State.prototype._handleLeave = function leaveState() {
    if (this._leave) {
        this._leave();
    }
};

module.exports = State;