var GIZA = GIZA || {};

GIZA.mouseinit = function() {

  var giza = GIZA;
  var canvas = GIZA.canvas;

  giza.mouse = {
    position: null,
    modifiers: {},
    handlers: [],
  };

  var onmouse = function(event) {
    var box = canvas.getBoundingClientRect();
    var x = event.clientX - box.left;
    var y = event.clientY - box.top;
    giza.mouse.modifiers.alt = event.altKey;
    giza.mouse.modifiers.shift = event.shiftKey;
    giza.mouse.modifiers.alt = event.altKey;
    giza.mouse.position = [x, y];

    var etype = event.type;
    if (etype == "mousedown") {
      giza.mouse.modifiers.button = true;
    } else if (etype == "mouseup") {
      giza.mouse.modifiers.button = false;
    }

    for (var i = 0; i < giza.mouse.handlers.length; i++) {
      var handler = giza.mouse.handlers[i];
      handler(etype, giza.mouse.position, giza.mouse.modifiers);
    }
  };

  var mouseout = function() {
    giza.mouse.position = null;
  };

  GIZA._onmouse = onmouse;
  GIZA._onmouseout = onmouseout;

  canvas.addEventListener("mousedown", onmouse);
  canvas.addEventListener("mouseup", onmouse);
  canvas.addEventListener("mousemove", onmouse);
  canvas.addEventListener("mouseenter", onmouse);
  canvas.addEventListener("mouseout", onmouseout);
};

GIZA.mouseshutdown = function() {
  var canvas = GIZA.canvas;
  var onmouse = GIZA._onmouse;
  var onmouseout = GIZA._onmouseout;
  GIZA._onmouse = undefined;
  GIZA._onmouseout = undefined;
  canvas.removeEventListener("mousedown", onmouse);
  canvas.removeEventListener("mouseup", onmouse);
  canvas.removeEventListener("mousemove", onmouse);
  canvas.removeEventListener("mouseenter", onmouse);
  canvas.removeEventListener("mouseout", onmouseout);
};

GIZA.mousedown = function(handler) {
  GIZA.mouse.handlers.push(function(etype, position, modifiers) {
    if (etype == "mousedown") {
      handler(position, modifiers);
    }
  });
};

GIZA.mouseup = function(handler) {
  GIZA.mouse.handlers.push(function(etype, position, modifiers) {
    if (etype == "mouseup") {
      handler(position, modifiers);
    }
  });
};

GIZA.mousemove = function(handler) {
  GIZA.mouse.handlers.push(function(etype, position, modifiers) {
    if (etype == "mousemove") {
      handler(position, modifiers);
    }
  });
};
