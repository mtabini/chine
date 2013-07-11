var State = function State(setup) {
    this._name = null;
    
    this._runFunction = null;
    this._enter = null;
    this._leave = null;
    
    this._incomingStates = {};
    this._outgoingStates = {};

    setup.call(this);
};

State.prototype.validate = function validateState() {
    if (!this.name()) throw new Error('The state ' + this + ' does not have a name.');
    if (!this.run() && this._outgoingStates.length) throw new Error('The state ' + this.name() + ' does not have a run function.');
    
    if (Object.keys(this._incomingStates).length == 0)
    if (Object.keys(this._outgoingStates).length == 0) {
        throw new Error('The state' + this.name() + ' has no incoming or outgoing routes');
    }
};

State.prototype._createRuntime = function createStateRuntime(machine, runtime) {
    runtime = runtime || {};
    
    runtime._state = this;
    runtime.machine = machine;
    runtime.transition = this.transition.bind(runtime);
    runtime.emit = this.emit.bind(this);

    return runtime;
}

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

State.prototype.run = function setStateProcessor(run) {
    if (arguments.length) {
        this._runFunction = run; 
    } else {
        return this._runFunction;
    } 
};

State.prototype.transition = function transitionState(state) {
    if (!state) throw new Error('You must provide a state name when transitioning');
    
    if (!(state in this._state._outgoingStates)) {
        throw new Error('You cannot transition from state ' + this._name + ' to state ' + state + ' because the latter is not in the former\'s allowed outgoing routes.');
    }
    
    this.machine._machine.transition(state);
};

State.prototype._checkIncomingTransition = function canTransitionFromState(state) {
    if (!(state in this._incomingStates)) {
        throw new Error('You cannot transition from state ' + state + ' to state ' + this._name + ' because the former is not in the latter\'s allowed incoming routes.');
    }
};

State.prototype.emit = function emitProxy() {
    this.machine.emit.apply(this.machine, arguments);
}

State.prototype._handleEnter = function enterState(runtime) {
    if (this._enter) {
        this._enter.call(runtime);
    }
};

State.prototype._run = function runState(runtime, parameters) {
    if (!this._runFunction) {
        throw new Error('You cannot run on the `' + this.name() + '` state, because it does not have a run function.');
    }
    
    this._runFunction.apply(runtime, parameters);
};

State.prototype._handleLeave = function leaveState(runtime) {
    if (this._leave) {
        this._leave.call(runtime);
    }
};

module.exports = State;