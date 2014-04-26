/**
 * Giza: a low-level utility layer for WebGL
 *
 * Giza doesn't have dependencies on any other JavaScript libraries.  It's
 * a low-level utility layer rather than a scene graph or effects
 * library.
 */

/** @namespace */
var GIZA = GIZA || { REVISION : '0' };

/**
  * Initializes the Giza library and returns the raw WebGL context.
  *
  * @param {HTMLCanvasElement} canvas  - Optional DOM element for the canvas.  If not specified, GIZA chooses the first `<canvas>` in the current document.
  * @param {object}            options - Dictionary of WebGL options that Giza should pass to `getContext`.
  * - **preserveDrawingBuffer** If false, discards contents of framebuffer of every frame.  Defaults to false.
  * - **antialias** Enables multisampling.  Defaults to true.
  * @returns {WebGLRenderingContext}
  */
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

  // Create the WebGL context and fail gracefully.
  options = options || {
    preserveDrawingBuffer: false,
    antialias: true
  };
  var gl = GIZA.createContext(canvas, options);
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
  window.onresize = function() {
    GIZA.refreshSize();
    for (var i = 0; i < GIZA.gizaContexts.length; i++) {
      GIZA.refreshSize(GIZA.gizaContexts[i]);
    }
  };

  GIZA.mouseinit();
  return gl;
};

GIZA.refreshSize = function(gizaContext) {
  gizaContext = gizaContext || GIZA;
  var width = gizaContext.canvas.clientWidth;
  var height = gizaContext.canvas.clientHeight;
  gizaContext.aspect = width / height;
  gizaContext.canvas.width = width * GIZA.pixelScale;
  gizaContext.canvas.height = height * GIZA.pixelScale;
};

GIZA.createContext = function(el, opts) {
  var gl = null;
  var names = 'webgl experimental-webgl webkit-3d moz-webgl'.split(' ');
  for (var i = 0; i < names.length && !gl; i++) {
    try {
      gl = el.getContext(names[i], opts);
    }
    catch (e) { }
  }
  return gl;
};
