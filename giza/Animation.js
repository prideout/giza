var GIZA = GIZA || {};

GIZA.drawHooks = []

// Kicks off an infinite series of animation frames, honoring 'pause'
// and 'resume'.  Prevents cascading errors by halting animation after
// a WebGL error.
GIZA.animate = function(drawFunction) {

  GIZA.paused = false;
  GIZA.animation = drawFunction;
  var gizaContext = GIZA.currentGizaContext;

  var renderFrame = function(time) {

    // There may be multiple canvases, so select the "current"
    // GIZA context before calling the draw function.
    GIZA.setGizaContext(gizaContext);
    if (GIZA.paused) {
      return;
    }

    // Clear out the GL error state at the beginning of the frame.
    // This is a workaround for a Safari bug.
    var gl = GIZA.context;
    gl.getError();

    // Before drawing the main frame, execute all draw hooks.
    time += GIZA.timeOffset;
    for (var i = 0; i < GIZA.drawHooks.length; i++) {
      GIZA.drawHooks[i](time);
    }

    // Set the viewport and execute the draw function.
    gl.viewport(0, 0, GIZA.canvas.width, GIZA.canvas.height);
    GIZA.animation(time);

    // Check WebGL error state before requesting the next animation
    // frame.
    err = gl.getError();
    if (err == gl.NO_ERROR) {
      window.requestAnimationFrame(renderFrame, GIZA.canvas);
    } else {
      console.error("WebGL error during draw cycle: ", err);
    }
  };

  renderFrame(GIZA.getTime());
};

GIZA.pause = function() {
  GIZA.paused = true;
  GIZA.pauseTime = GIZA.getTime();
};

GIZA.resume = function() {
  if (GIZA.paused) {
    var resumeTime = GIZA.getTime();
    var deltaTime = resumeTime - GIZA.pauseTime;
    GIZA.timeOffset -= deltaTime;
    GIZA.paused = false;
    GIZA.animate(GIZA.animation);
  }
};

// Return a high-precision time that's consistent with what the
// browser passes to the requestAnimationFrame function, and that
// honors an offset created by the pause and resume.
GIZA.getTime = function() {

  var now;

  // Firefox
  if ('mozAnimationStartTime' in window) {
    now = window.mozAnimationStartTime;
  }
      
  // Chrome
  else if (window.performance && 'now' in window.performance) {
    now = window.performance.now();
  }
  
  // Safari
  else {
    now = Date.now();
  }

  return now + GIZA.timeOffset;
};
