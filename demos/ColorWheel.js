var main = function() {

  var gl = GIZA.init();
  var M4 = GIZA.Matrix4;
  var C4 = GIZA.Color4;
  var V2 = GIZA.Vector2;

  var attribs = {
    POSITION: 0,
    COLOR: 1,
  };

  var programs = GIZA.compile({
    simple: {
      vs: ['simplevs'],
      fs: ['simplefs'],
      attribs: {
        Position: attribs.POSITION,
        Color: attribs.COLOR,
      }
    }
  });

  var numPoints = 64;
  var buffer = gl.createBuffer();

  var init = function() {

    // Set up a description of the vertex format.
    var bufferView = new GIZA.BufferView({
      position: [Float32Array, 2],
      color: [Uint8Array, 4],
    });

    // Allocate the memory.
    var vertexArray = bufferView.makeBuffer(numPoints);

    // Initialize the center point of the wheel.
    var iterator = bufferView.iterator();
    var vertex = iterator.next();
    V2.set(vertex.position, [0, 0]);
    C4.set(vertex.color, [1, 1, 1, 1], 255);

    // Now create the vertices along the circumference.
    var dtheta = Math.PI * 2 / (numPoints - 2);
    var theta = 0;
    var radius = .75;
    while (vertex = iterator.next()) {
      var x = radius * Math.cos(theta);
      var y = radius * Math.sin(theta);
      V2.set(vertex.position, [x, y]);

      var hue = (iterator.index - 1) / (numPoints - 1);
      C4.set(vertex.color, C4.hsvToRgb(hue, 1, 1), 255);
      theta += dtheta;
    }

    // Populate the vertex buffer obejct.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    gl.clearColor(0.61, 0.527, .397, 1.0);
  };

  var draw = function(currentTime) {

    gl.clear(gl.COLOR_BUFFER_BIT);
    
    var proj = M4.orthographic(
        -GIZA.aspect, GIZA.aspect, // left right
        -1, +1, // bottom top
        -10, 10);  // near far

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.enableVertexAttribArray(attribs.POSITION);
    gl.vertexAttribPointer(attribs.POSITION, 2, gl.FLOAT, false, 12, 0);

    gl.enableVertexAttribArray(attribs.COLOR);
    gl.vertexAttribPointer(attribs.COLOR, 4, gl.UNSIGNED_BYTE, true, 12, 8);

    var program = programs.simple;
    gl.useProgram(program);
    gl.uniformMatrix4fv(program.projection, false, proj);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    var mv = M4.rotationZ(currentTime * 0.01);
    gl.uniformMatrix4fv(program.modelview, false, mv);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, numPoints);
  };

  init();
  GIZA.animate(draw);

};
