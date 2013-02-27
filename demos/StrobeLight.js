var main = function() {

  GIZA.init();
  var gl = GIZA.context;

  var draw = function(currentTime) {
    var x = 0.5 + 0.5 * Math.sin(currentTime / 100);
    x = 0.25 + x * 0.5;
    gl.clearColor(x, x, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  GIZA.animate(draw);
};
