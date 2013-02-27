var GIZA = GIZA || {};

// Restricts rotation to Spin (Y axis) and Tilt (X axis)
GIZA.Turntable = function(config) {

  var M3 = GIZA.Matrix3;
  var V3 = GIZA.Vector3;
  var V2 = GIZA.Vector2;
  
  // Allow clients to skip the "new"
  if (!(this instanceof GIZA.Turntable)) {
    return new GIZA.Turntable(config);
  }

  var defaults = {
    startSpin: 0.001, // radians per second
    allowTilt: true,
    allowSpin: true,
    spinFriction: 0.125, // 0 means no friction (infinite spin) while 1 means no inertia
    epsilon: 3, // distance (in pixels) to wait before deciding if a drag is a Tilt or a Spin
    radiansPerPixel: V2.make(0.01, 0.01),
    canvas: GIZA.canvas,
    trackpad: true,  // if true, compensate for the delay on trackpads that occur between touchup and mouseup
    lockAxes: false, // if true, don't allow simultaneous spin + tilt
    homeTilt: 0.25,
    //bounceTilt: false, // if true, returns the tilt to the "home" angle after a mouse release
    //boundSpin: false, // if true, returns to the startSpin state after a mouse release
  };

  this.config = config = GIZA.merge(defaults, config || {});

  // diagram please!
  var state = {
    Resting: 0,
    SpinningStart: 1,
    SpinningInertia: 2,
    DraggingInit: 3,
    DraggingSpin: 4,
    DraggingTilt: 5,
    ReturningHome: 6,
  };

  var startPosition = V2.make(0, 0);
  var currentPosition = V2.make(0, 0);

  // TODO make these into a "positionHistory"
  var previousPosition = currentPosition.slice(0);
  var previous2Position = currentPosition.slice(0);

  var currentSpin = 0;
  var currentTilt = config.homeTilt;
  var currentState = config.startSpin ?
    state.SpinningStart : state.Resting;
  var previousTime = null;
  var inertiaSpeed = 0;
  var initialInertia = 0.125;
  var turntable = this;

  GIZA.mousedown(function(position, modifiers) {
    turntable.startDrag(position);
  });

  GIZA.mouseup(function(position, modifiers) {
    turntable.endDrag(position);
  });

  GIZA.mousemove(function(position, modifiers) {
    if (modifiers.button) {
      turntable.updateDrag(position);
    }
  });

  GIZA.drawHooks.push(function(time) {
    if (previousTime == null) {
      previousTime = time;
    }
    var deltaTime = time - previousTime;
    previousTime = time;

    var isSpinning = currentState == state.DraggingSpin ||
      (currentState == state.DraggingInit && !config.lockAxes);

    if (currentState == state.SpinningStart) {
      currentSpin += config.startSpin * deltaTime;
    } else if (currentState == state.SpinningInertia) {
      currentSpin += inertiaSpeed * deltaTime;
      inertiaSpeed *= (1 - config.spinFriction);
      if (Math.abs(inertiaSpeed) < 0.0001) {
        currentState = state.Resting;
      }

    // Some trackpads have an intentional delay between fingers-up
    // and the time we receive the mouseup event.  To accomodate this,
    // we execute inertia even while we think the mouse is still down.
    // This behavior can be disabled with the "trackpad" config option.
    } else if (config.trackpad && isSpinning &&
               V2.equivalent(currentPosition, previous2Position, 0)) {
      currentSpin += inertiaSpeed * deltaTime;
      inertiaSpeed *= (1 - config.spinFriction);
    }

    previous2Position = previousPosition.slice(0);
    previousPosition = currentPosition.slice(0);
  });

  this.startDrag = function(position) {
    startPosition = position.slice(0);
    currentPosition = position.slice(0);
    currentState = state.DraggingInit;
  };

  this.updateDrag = function(position) {
    var delta = V2.subtract(position, startPosition);

    // If we haven't decided yet, decide if we're spinning or tilting.
    if (currentState == state.DraggingInit && config.lockAxes) {
      if (Math.abs(delta[0]) > config.epsilon && config.allowSpin) {
        currentState = state.DraggingSpin;
      } else if (Math.abs(delta[1]) > config.epsilon && config.allowTilt) {
        currentState = state.DraggingTilt;
      } else {
        return;
      }
    }

    var previousSpin = this.getAngles()[0];
    currentPosition = position.slice(0);

    // This is purely for trackpads:
    var spinDelta = this.getAngles()[0] - previousSpin;
    inertiaSpeed = initialInertia * spinDelta;
  };

  this.getAngles = function() {
    var delta = V2.subtract(currentPosition, startPosition);
    var spin = currentSpin;
    var tilt = currentTilt;
    if (currentState == state.DraggingSpin) {
      var radians = config.radiansPerPixel[0] * delta[0];
      spin += radians;
    } else if (currentState == state.DraggingTilt) {
      var radians = config.radiansPerPixel[1] * delta[1];
      tilt += radians;
    } else if (!config.lockAxes && currentState == state.DraggingInit) {
      spin += config.radiansPerPixel[0] * delta[0];
      tilt += config.radiansPerPixel[1] * delta[1];
    }
    return [spin, tilt];
  };

  this.getRotation = function() {
    var r = this.getAngles();
    var spin = M3.rotationY(r[0]);
    var tilt = M3.rotationX(r[1]);
    return M3.multiply(tilt, spin);
  };

  // When releasing the mouse, capture the current rotation and change
  // the state machine back to 'Resting' or 'SpinningInertia'.
  this.endDrag = function(position) {
    var previousSpin = this.getAngles()[0];
    currentPosition = position.slice(0);
    var r = this.getAngles();
    currentSpin = r[0];
    currentTilt = r[1];

    var spinDelta = currentSpin - previousSpin;

    if (config.spinFriction == 1) {
      currentState = state.Resting;
    } else {
      currentState = state.SpinningInertia;
      inertiaSpeed = initialInertia * spinDelta;
    }

  };

};

GIZA.Turntable.INFINITE = 1000; // not sure if I'll use this
