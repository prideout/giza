var main = function() {

  GIZA.init();
  var gl = GIZA.context;
  var M4 = GIZA.Matrix4;
  var V2 = GIZA.Vector2;
  var dragPoint = null;

  var attribs = {
    POSITION: 0,
    VERTEXID: 0,
    NORMAL: 1,
    TEXCOORD: 2
  };

  var programs = GIZA.compile({
    dot: {
      vs: ['dotvs'],
      fs: ['dotfs'],
      attribs: {
        Position: attribs.POSITION
      }
    },
    contour: {
      vs: ['contourvs'],
      fs: ['contourfs'],
      attribs: {
        Position: attribs.POSITION
      }
    }
  });

  var spriteTexture;
  var buffers = {
    coords: gl.createBuffer(),
    lines: gl.createBuffer(),
    triangles: gl.createBuffer(),
  };

  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.lineWidth(1.5 * GIZA.pixelScale);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  var outerContour = GIZA.Path.Turtle(145.81951,11.151985);
  outerContour.bezierCurveTo(95.611047,11.151985,64.330726,57.81599,65.04964,114.16208);
  outerContour.bezierCurveTo(65.570813,155.00985,86.749849,194.54165,119.00057,243.25502);
  outerContour.lineTo(11.1508857,230.99317);
  outerContour.lineTo(11.1508857,291.06037);
  outerContour.lineTo(127.32279,277.84718);
  outerContour.lineTo(102.04307,503.55502);
  outerContour.lineTo(189.62203,503.55502);
  outerContour.lineTo(164.31623,277.84718);
  outerContour.lineTo(280.51422,291.06037);
  outerContour.lineTo(280.51422,230.99317);
  outerContour.lineTo(172.63844,243.25502);
  outerContour.bezierCurveTo(204.88917,194.54165,226.0682,155.00985,226.58938,114.16208);
  outerContour.bezierCurveTo(227.30829,57.81599,196.02797,11.151985,145.81951,11.151985);
  outerContour.closePath();
  outerContour.mirror();
  outerContour.scale(-1, 1);
  outerContour.translate(600, 35);

  var innerContour = GIZA.Path.Turtle(145.81951,50.025214);
  innerContour.bezierCurveTo(160.87845,50.025214,171.12769,56.48072,179.76059,69.052219);
  innerContour.bezierCurveTo(188.3935,81.623719,193.95465,101.05069,193.87445,123.43774);
  innerContour.bezierCurveTo(193.69265,174.18665,166.85172,209.27827,145.81951,241.22019);
  innerContour.bezierCurveTo(124.7873,209.27827,97.946363,174.18665,97.764567,123.43774);
  innerContour.bezierCurveTo(97.684371,101.05069,103.24552,81.623719,111.87842,69.052219);
  innerContour.bezierCurveTo(120.51133,56.48072,130.76056,50.025214,145.81951,50.025214);
  innerContour.closePath();
  innerContour.mirror();
  innerContour.scale(-1, 1);
  innerContour.translate(600, 35);

  // Outer hull
  var outerPointCount = outerContour.coords().length;
  var pointCount = outerContour.coords().length + innerContour.coords().length;

  // Computational geometry tells us the # of triangles is n-2.
  // However. since we have a hole, we're effectively building two
  // polygons with two shared points, for a total of a n+4 points.
  // (n+4)-2 is n+2, so:
  var triangleCount = pointCount + 2;
  var coordsArray = new Float32Array(pointCount * 2);
  var elementArray = new Uint16Array(triangleCount * 3);

  var draw = function(currentTime) {

    // Flatten the coordinates.
    var offset = 0;
    offset = outerContour.write(coordsArray, offset);
    offset = innerContour.write(coordsArray, offset);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.coords);
    gl.bufferData(gl.ARRAY_BUFFER, coordsArray, gl.STATIC_DRAW);

    // Run ear clipping.
    var triangles = GIZA.tessellate(outerContour.coords(), [innerContour.coords()]);

    // Flatten the triangles.
    GIZA.flattenTo(triangles, elementArray);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.triangles);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elementArray, gl.STATIC_DRAW);
    if (gl.getError() !== gl.NO_ERROR) {
      console.error('Error when trying to create triangle VBO');
    }

    // Triangle outlines
    var outlines = GIZA.Topo.trianglesToLines(elementArray);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.lines);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, outlines, gl.STATIC_DRAW);

    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // This is 1-to-1 with "CSS pixels" and "mouse pixels"
    var mv = M4.identity();
    var proj = M4.orthographic(
      0, GIZA.canvas.clientWidth,
      0, GIZA.canvas.clientHeight,
      0, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.coords);
    gl.enableVertexAttribArray(attribs.POSITION);
    gl.vertexAttribPointer(attribs.POSITION, 2, gl.FLOAT, false, 8, 0);

    // Draw the filled triangles
    var program = programs.contour;
    gl.useProgram(program);
    gl.uniformMatrix4fv(program.modelview, false, mv);
    gl.uniformMatrix4fv(program.projection, false, proj);
    gl.uniform4f(program.color, 0.25, 0.25, 0, 0.5);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.triangles);
    gl.drawElements(gl.TRIANGLES, elementArray.length, gl.UNSIGNED_SHORT, 0);

    // Draw the triangle borders to visualize the tessellation
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.lines);
    gl.drawElements(gl.LINES, outlines.length, gl.UNSIGNED_SHORT, 0);

    // Draw the outer contour
    program = programs.contour;
    gl.useProgram(program);
    gl.uniformMatrix4fv(program.modelview, false, mv);
    gl.uniformMatrix4fv(program.projection, false, proj);
    gl.uniform4f(program.color, 0, 0.4, 0.8, 1);
    gl.drawArrays(gl.LINE_LOOP, 0, outerPointCount);

    // Draw the hole outline if it exists
    var innerPointCount = pointCount - outerPointCount;
    if (innerPointCount > 0) {
      gl.uniform4f(program.color, 0.8, 0.4, 0, 1);
      gl.drawArrays(gl.LINE_LOOP, outerPointCount, innerPointCount);
    }

    // Finally draw the dots
    program = programs.dot;
    gl.useProgram(program);
    gl.uniformMatrix4fv(program.modelview, false, mv);
    gl.uniformMatrix4fv(program.projection, false, proj);
    gl.uniform1f(program.pointSize, 6 * GIZA.pixelScale);
    gl.bindTexture(gl.TEXTURE_2D, spriteTexture);
    gl.uniform4f(program.color, 0, 0.25, 0.5, 1);
    gl.drawArrays(gl.POINTS, 0, pointCount);

    // Draw the mouse cursor
    if (dragPoint != null) {
      gl.uniform1f(program.pointSize, 10 * GIZA.pixelScale);
      gl.uniform4f(program.color, 0.5, 0.0, 0.0, 1);
      gl.drawArrays(gl.POINTS, dragPoint, 1);
    }

    gl.disableVertexAttribArray(attribs.POSITION);
  }

  GIZA.mousemove(function(position, modifiers) {
    var i = outerContour.getNearest(position);
    if (i != null) {
      dragPoint = i;
      return;
    }
    var i = innerContour.getNearest(position);
    if (i != null) {
      dragPoint = i + outerPointCount;
      return;
    }
    dragPoint = null;
  });

  COMMON.loadTexture('media/PointSprite.png', function(i) {
    spriteTexture = i;
    GIZA.animate(draw);
  });

};
