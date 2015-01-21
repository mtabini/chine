"use strict";

var util = require('util');

var EventEmitter = require('events').EventEmitter;
var State = require('./state');

var Chine = function Chine(initialState) {
  if (!initialState) {
    throw new Error('You must specify an initial state');
  }

  this.compiled = false;
  this.states = {};

  this.initialState = initialState;

  this.runtime = {};
};

util.inherits(Chine, EventEmitter);

Chine.prototype._checkCompiled = function checkMachineCompiled() {
  if (this.compiled) {
    throw new Error('You cannot modify a machine once it has been compiled');
  }
};

Chine.prototype.state = function addStateToMachine(callback) {
  this._checkCompiled();

  var state = new State(callback);

  state.validate();

  if (state.name() in this.states) {
    throw new Error('Duplicate state name ' + state.name());
  }

  this.states[state.name()] = state;
};

Chine.prototype._buildRuntime = function buildMachineRuntime(serialized) {
  var runtime = serialized || {};

  runtime.run = this.run.bind(this);
  runtime._machine = this;

  if (!serialized) {
    runtime.previousState = null;
    runtime.currentState = this.initialState;
    runtime._hasRunCurrentState = false;
    runtime._runtimes = {};

    Object.keys(this.states).forEach(function(stateName) {
      runtime._runtimes[stateName] = this.states[stateName]._createRuntime(runtime);
    }, this);
  }

  this.runtime = runtime;
};

Chine.prototype.clone = function createMachineClone(skipRuntime) {
  if (!this.compiled) {
    throw new Error('You cannot clone a machine that has not yet been compiled.');
  }

  var result = new Chine(this.initialState);

  result.compiled = true;
  result.states = this.states;

  if (!skipRuntime) {
    result._buildRuntime();
  }

  return result;
};

Chine.prototype.serialize = function serializeMachine() {
  if (!this.compiled) {
    throw new Error('You cannot serialize a machine that has not yet been compiled.');
  }

  var result = {};

  Object.keys(this.runtime).forEach(function(key) {
    result[key] = this.runtime[key];
  }, this);

  delete result.run;
  delete result._machine;

  result._runtimes = {};

  Object.keys(this.runtime._runtimes).forEach(function(key) {
    result._runtimes[key] = State._serializeRuntime(this.runtime._runtimes[key]);
  }, this);

  return result;
};

Chine.prototype.unserialize = function unserializeMachine(runtime) {
  if (!this.compiled) {
    throw new Error('You cannot unserialize a machine that has not yet been compiled.');
  }

  var result = this.clone(true);

  result._buildRuntime(runtime);

  Object.keys(runtime._runtimes).forEach(function(key) {
    runtime._runtimes[key] = this.states[key]._createRuntime(runtime, runtime._runtimes[key]);
  }, this);

  return result;
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

  if (!(this.initialState in this.states)) {
    throw new Error('Invalid initial state ' + this.initialState);
  }

  if (this.states[this.initialState].incoming().length === 0 && this.states[this.initialState].enter()) {
    throw new Error('The initial state `' + this.initialState + '` has an enter handler that will never be called.');
  }

  this._buildRuntime();
  this.compiled = true;
};

Chine.prototype.transition = function transitionMachine(stateName) {
  var state = this.states[stateName];

  if (!state) {
    throw new Error('Cannot transition to state ' + state + ', which doesn\'t exist');
  }

  state._checkIncomingTransition(this.runtime.currentState);

  var stateRuntime = this.runtime._runtimes[stateName];

  this.states[this.runtime.currentState]._handleLeave(stateRuntime);

  this.runtime.previousState = this.runtime.currentState;
  this.runtime.currentState = stateName;

  this.runtime._hasRunCurrentState = false;

  this.states[this.runtime.currentState]._handleEnter(stateRuntime);
};

Chine.prototype.run = function runMachine() {
  if (this.runtime._hasRunCurrentState) {
    throw new Error('The current state has already run.');
  }

  var state = this.states[this.runtime.currentState];

  state._run(this.runtime._runtimes[this.runtime.currentState], arguments);
};

module.exports = Chine;
