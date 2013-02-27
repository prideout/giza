var main = function() {

  // Provide a performance indicator in the upper-right corner.
  var stats = new Stats();
  stats.setMode(1); // 0: fps, 1: ms
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild( stats.domElement );  

  // The mode variable is either "glsl" or "js".  It specifies if
  // evaluation of the sinc function occurs on the CPU or on the GPU.
  var mode = $("input:checked")[0].id;
  $("#radio").buttonset().change(function (e) {
    mode = $("input:checked")[0].id;
  });

  GIZA.init();
  var gl = GIZA.context;
  var M4 = GIZA.Matrix4;

  var attribs = {
    POSITION: 0,
    COLOR: 1
  };

  var programs = GIZA.compile({
    simple: {
      vs: ['simple-vs'],
      fs: ['solid-color'],
      attribs: {
        Position: attribs.POSITION,
        Color: attribs.COLOR
      }
    },
    sinc: {
      vs: ['sinc-vs'],
      fs: ['solid-color'],
      attribs: {
        Position: attribs.POSITION
      }
    }
  });

  var buffers = {
    sincCoords: gl.createBuffer(),
    wireframe: gl.createBuffer()
  };

  var interval = 50;
  var width = 20;
  var maxHeight = 2;
  var rowTess = 120;
  var colTess = 500;
  var surfFlags = GIZA.surfaceFlags.POSITIONS | GIZA.surfaceFlags.COLORS;

  var sinc = GIZA.surface(
    GIZA.equations.sinc(interval, width, maxHeight),
    rowTess, colTess, surfFlags);

  var init = function() {
    gl.clearColor(0.2,0.2,0.2,1);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sincCoords);
    gl.bufferData(gl.ARRAY_BUFFER, sinc.points(), gl.STATIC_DRAW);
    buffers.wireframe.lineCount = sinc.lineCount();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.wireframe);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sinc.lines(), gl.STATIC_DRAW);
  }

  var draw = function(currentTime) {
    
    stats.begin();
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    var mv = M4.lookAt(
        [0,10,2], // eye
        [0,0,0],  // target
        [0,0,1]); // up

    M4.rotateZ(mv, currentTime / 1000);

    var proj = M4.perspective(
      30,        // fov in degrees
      GIZA.aspect,
      3, 200);   // near and far

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.wireframe)
    gl.enableVertexAttribArray(attribs.POSITION);
    gl.enableVertexAttribArray(attribs.COLOR);

    var sincHeight = maxHeight * Math.cos(currentTime / 500);
    sinc = GIZA.surface(
      GIZA.equations.sinc(interval, width, sincHeight),
      rowTess, colTess, surfFlags);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sincCoords);

    var program;
    if (mode == "glsl") {
      program = programs.sinc;
      gl.useProgram(program);
      gl.uniform1f(program.interval, interval);
      gl.uniform1f(program.width, width);
      gl.uniform1f(program.height, sincHeight);
    } else {
      program = programs.simple;
      gl.useProgram(program);

      var rawBuffer = sinc.points().buffer;
      var coordView = new Float32Array(rawBuffer)
      var colorView = new Uint8Array(rawBuffer, 12);

      var coordIndex = 0;
      var colorIndex = 0;
      for (var i = 0; i < sinc.pointCount(); i++) {
        var z = coordView[coordIndex+2];
        var v = 255 * Math.abs(z * 4);
        v = Math.min(v, 255);
        colorView[colorIndex+0] = v;     // red
        colorView[colorIndex+1] = 128;   // grn
        colorView[colorIndex+2] = 255-v; // blu
        colorView[colorIndex+3] = 64;    // alp
        colorIndex += 16;
        coordIndex += 4;
      }

      gl.bufferData(gl.ARRAY_BUFFER, rawBuffer, gl.STATIC_DRAW);
    }

    var stride = (surfFlags & GIZA.surfaceFlags.COLORS) ? 16 : 12;
    gl.vertexAttribPointer(attribs.POSITION, 3, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(attribs.COLOR, 4, gl.UNSIGNED_BYTE, true, stride, 12);

    gl.uniformMatrix4fv(program.projection, false, proj);
    gl.uniformMatrix4fv(program.modelview, false, mv);

    gl.drawElements(
      gl.LINES, // drawing primitive
      2 * buffers.wireframe.lineCount, // number of indices
      gl.UNSIGNED_SHORT, // index data type
      0) // offset in bytes

    gl.disableVertexAttribArray(attribs.POSITION);
    gl.disableVertexAttribArray(attribs.COLOR);

    stats.end();
  }

  init();
  GIZA.animate(draw);

};
