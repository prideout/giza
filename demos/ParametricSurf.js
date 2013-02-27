var main = function() {

  GIZA.init();
  var gl = GIZA.context;
  var M4 = GIZA.Matrix4;

  var attribs = {
    POSITION: 0,
    NORMAL: 1,
  };

  var programs = GIZA.compile({
    solid: {
      vs: ['solidvs'],
      fs: ['solidfs'],
      attribs: {
        Position: attribs.POSITION
      }
    }
  });
  
  var buffers = {
    sphereCoords: gl.createBuffer(),
    torusCoords: gl.createBuffer(),
    wireframe: gl.createBuffer()
  };

  var init = function() {

    gl.clearColor(1, 1, 1, 1);
    gl.lineWidth(1.5 * GIZA.pixelScale);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var lod = 32;

    var torus = function() {
      var equation = GIZA.equations.torus(.25, 1);
      var surface = GIZA.surface(equation, lod, lod);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.torusCoords);
      gl.bufferData(gl.ARRAY_BUFFER, surface.points(), gl.STATIC_DRAW);
      return surface;
    }();

    var sphere = function() {
      var equation = GIZA.equations.sphere(1.25);
      var surface = GIZA.surface(equation, lod, lod);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphereCoords);
      gl.bufferData(gl.ARRAY_BUFFER, surface.points(), gl.STATIC_DRAW);
      return surface;
    }();

    buffers.wireframe.lineCount = sphere.lineCount();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.wireframe);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.lines(), gl.STATIC_DRAW);

    if (gl.getError() !== gl.NO_ERROR) {
      console.error('Error when trying to create VBOs');
    }
  }

  var draw = function(currentTime) {
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    var mv = M4.lookAt(
      [0,0,-20], // eye
      [0,0,0],  // target
      [0,1,0]); // up

    var proj = M4.perspective(
      10,       // fov in degrees
      GIZA.aspect,
      3, 20);   // near and far

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.wireframe)
    gl.enableVertexAttribArray(attribs.POSITION);
    program = programs.solid;
    gl.useProgram(program);
    gl.uniformMatrix4fv(program.projection, false, proj);

    var theta = currentTime / 1000;
    var previous = M4.copy(mv);
    M4.translate(mv, [-1.5,0,0]);
    M4.rotateZ(mv, theta);

    gl.uniformMatrix4fv(program.modelview, false, mv);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphereCoords);
    gl.vertexAttribPointer(attribs.POSITION, 3, gl.FLOAT, false, 12, 0);
    gl.uniform4f(program.color, 0, 0, 0, 0.75);
    gl.drawElements(gl.LINES, 2 * buffers.wireframe.lineCount, gl.UNSIGNED_SHORT, 0)
    
    mv = previous;
    M4.translate(mv, [1.5,0,0]);
    M4.rotateZ(mv, theta);

    gl.uniformMatrix4fv(program.modelview, false, mv);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.torusCoords);
    gl.vertexAttribPointer(attribs.POSITION, 3, gl.FLOAT, false, 12, 0);
    gl.drawElements(gl.LINES, 2 * buffers.wireframe.lineCount, gl.UNSIGNED_SHORT, 0)

    gl.disableVertexAttribArray(attribs.POSITION);
  }

  init();
  GIZA.animate(draw);

};
