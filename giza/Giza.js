// Giza: a low-level utility layer for WebGL
//
// Giza doesn't have dependencies on any other JavaScript libraries.  It's
// a low-level utility layer rather than a scene graph or effects
// library.

var GIZA = GIZA || { REVISION : '0' };

GIZA.init = function(canvas, options) {

  if (GIZA.saveGizaContext) {
    GIZA.saveGizaContext();
  }

  window.requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

  // Find a canvas element if one wasn't specified.
  canvas = canvas || GIZA.startCanvas || document.getElementsByTagName('canvas')[0];

  // Gather information about the canvas.
  var pixelScale = window.devicePixelRatio || 1;
  var width = canvas.clientWidth;
  var height = canvas.clientHeight;
  var aspect = width / height;

  // Handle retina displays correctly.
  // At the time of writing (Dec 30 2012) this only works for Chrome.
  canvas.width = width * pixelScale;
  canvas.height = height * pixelScale;

  // Set up the WebGL context.
  options = options || {
    preserveDrawingBuffer: false,
    antialias: true
  };
  var gl = canvas.getContext('experimental-webgl', options);

  if (!gl) {
    var msg = document.createElement('p');
    msg.classList.add('error');
    msg.innerHTML = "Alas, your browser does not support WebGL.";
    canvas.parentNode.replaceChild(msg, canvas);
    return null;
  }

  // Publish some globally-accessible properties.
  GIZA.context = gl;
  GIZA.pixelScale = pixelScale;
  GIZA.canvas = canvas;
  GIZA.aspect = aspect;
  GIZA.timeOffset = 0;

  // Use a subset of fields to form the gizaContext,
  // just in case multiple canvases are needed.
  var gizaContextFields = [
    'context',
    'canvas',
    'aspect',
    'drawHooks',
    'animation',
    'paused',
    'timeOffset',
    'pauseTime',
    'mouse',
  ];
  GIZA.currentGizaContext = GIZA.extract(GIZA, gizaContextFields);

  // Methods to handle multiple canvases.  Client should rarely (if ever)
  // need to call these methods, even if when using multiple canvases.
  GIZA.saveGizaContext = function() {
    if (GIZA.currentGizaContext) {
      GIZA.merge(GIZA.currentGizaContext, GIZA, gizaContextFields);
    }
  };
  GIZA.setGizaContext = function(gizaContext) {
    GIZA.saveGizaContext();
    GIZA.currentGizaContext = gizaContext;
    GIZA.merge(GIZA, gizaContext);
  };
  GIZA.gizaContexts = GIZA.gizaContexts || [];
  GIZA.gizaContexts.push(GIZA.currentGizaContext);

  // Handle resize events appropriately.
  var resize = function(gizaContext) {
    var width = gizaContext.canvas.clientWidth;
    var height = gizaContext.canvas.clientHeight;
    gizaContext.aspect = width / height;
    gizaContext.canvas.width = width * gizaContext.pixelScale;
    gizaContext.canvas.height = height * gizaContext.pixelScale;
  };
  window.onresize = function() {
    resize(GIZA);
    for (var i = 0; i < GIZA.gizaContexts.length; i++) {
      resize(GIZA.gizaContexts[i]);
    }
  };

  GIZA.mouseinit();
  return gl;
}
