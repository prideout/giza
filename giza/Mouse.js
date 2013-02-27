var GIZA = GIZA || {};

GIZA.mouseinit = function() {

  var giza = GIZA;
  var canvas = GIZA.canvas;

  giza.mouse = {
    position: null,
    modifiers: {},
    handlers: [],
  };

  var updateMouse = function(event) {
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

  canvas.addEventListener("mousedown", updateMouse);
  canvas.addEventListener("mouseup", updateMouse);
  canvas.addEventListener("mousemove", updateMouse);
  canvas.addEventListener("mouseenter", updateMouse);

  canvas.addEventListener("mouseout", function() {
    giza.mouse.position = null;
  });
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
