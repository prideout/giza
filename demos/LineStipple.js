var main = function() {

  var gl = GIZA.init();
  var M4 = GIZA.Matrix4;
  var C4 = GIZA.Color4;
  var V2 = GIZA.Vector2;

  var attribs = {
    POSITION: 0,
    TEXCOORD: 1,
  };

  var programs = GIZA.compile({
    simple: {
      vs: ['simplevs'],
      fs: ['simplefs'],
      attribs: {
        Position: attribs.POSITION,
        TexCoord: attribs.TEXCOORD,
      }
    }
  });

  var numPoints = 2;
  var buffer = gl.createBuffer();

  var init = function() {

    // Set up a description of the vertex format.
    var bufferView = new GIZA.BufferView({
      position: [Float32Array, 2],
      texCoord: [Float32Array, 1],
    });

    // Allocate and populate the ArrayBuffer.
    var vertexArray = bufferView.makeBuffer(numPoints);
    var iterator = bufferView.iterator();
    var vertex = iterator.next();
    V2.set(vertex.position, [0, 0]);
    vertex.texCoord[0] = 0;
    var vertex = iterator.next();
    V2.set(vertex.position, [0.5, 0.5]);
    vertex.texCoord[0] = 1;

    // Create the vertex buffer object etc.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    gl.clearColor(0.61, 0.527, .397, 1.0);
    gl.lineWidth(10);
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

    gl.enableVertexAttribArray(attribs.TEXCOORD);
    gl.vertexAttribPointer(attribs.TEXCOORD, 1, gl.FLOAT, false, 12, 8);

    var program = programs.simple;
    gl.useProgram(program);
    gl.uniformMatrix4fv(program.projection, false, proj);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    var mv = M4.rotationZ(currentTime * 0.001);
    gl.uniformMatrix4fv(program.modelview, false, mv);

    gl.drawArrays(gl.LINES, 0, numPoints);
  };

  init();
  GIZA.animate(draw);

};
