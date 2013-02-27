var main = function() {

  GIZA.init();
  var gl = GIZA.context;
  var M4 = GIZA.Matrix4;
  var V2 = GIZA.Vector2;

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

  var contourPts = [];
  var holePts = [];
  var spriteTexture;
  var buffers = {
    coords: gl.createBuffer(),
    lines: gl.createBuffer(),
    triangles: gl.createBuffer(),
    mousePoints: gl.createBuffer()
  };
  var pointCount, outerPointCount, triangleCount;

  var init = function() {
    
    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.lineWidth(1.5 * GIZA.pixelScale);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var vec2ify = function(o) {
      return V2.make(600 - o[1], 35 + o[0]);
    };

    var turtle = GIZA.Path.Turtle(145.81951,11.151985);
    turtle.bezierCurveTo(95.611047,11.151985,64.330726,57.81599,65.04964,114.16208);
    turtle.bezierCurveTo(65.570813,155.00985,86.749849,194.54165,119.00057,243.25502);
    turtle.lineTo(11.1508857,230.99317);
    turtle.lineTo(11.1508857,291.06037);
    turtle.lineTo(127.32279,277.84718);
    turtle.lineTo(102.04307,503.55502);
    turtle.lineTo(189.62203,503.55502);
    turtle.lineTo(164.31623,277.84718);
    turtle.lineTo(280.51422,291.06037);
    turtle.lineTo(280.51422,230.99317);
    turtle.lineTo(172.63844,243.25502);
    turtle.bezierCurveTo(204.88917,194.54165,226.0682,155.00985,226.58938,114.16208);
    turtle.bezierCurveTo(227.30829,57.81599,196.02797,11.151985,145.81951,11.151985);
    turtle.closePath();
    contourPts = turtle.coords().map(vec2ify);

    var turtle = GIZA.Path.Turtle(145.81951,50.025214);
    turtle.bezierCurveTo(160.87845,50.025214,171.12769,56.48072,179.76059,69.052219);
    turtle.bezierCurveTo(188.3935,81.623719,193.95465,101.05069,193.87445,123.43774);
    turtle.bezierCurveTo(193.69265,174.18665,166.85172,209.27827,145.81951,241.22019);
    turtle.bezierCurveTo(124.7873,209.27827,97.946363,174.18665,97.764567,123.43774);
    turtle.bezierCurveTo(97.684371,101.05069,103.24552,81.623719,111.87842,69.052219);
    turtle.bezierCurveTo(120.51133,56.48072,130.76056,50.025214,145.81951,50.025214);
    turtle.closePath();
    holePts = turtle.coords().map(vec2ify);

    // Diagnostics
    if (false) {
      var c = [{x:570,y:336},{x:365,y:30},{x:140,y:336}];
      var h = [{x:350,y:201},{x:380,y:201},{x:365,y:282}];
      vec2ify = function(o) { return V2.make(o.x, o.y); }
      contourPts = c.map(vec2ify);
      holePts = h.map(vec2ify);
      console.info("outer =", JSON.stringify(contourPts));
      console.info("inner =", JSON.stringify(holePts));
    }

    // Outer hull
    outerPointCount = contourPts.length;
    pointCount = contourPts.length + holePts.length;
    var coordsArray = GIZA.flatten(contourPts.concat(holePts));
    var typedArray = new Float32Array(coordsArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.coords);
    gl.bufferData(gl.ARRAY_BUFFER, typedArray, gl.STATIC_DRAW);
    if (gl.getError() !== gl.NO_ERROR) {
      console.error('Error when trying to create points VBO');
    }

    // Run ear clipping
    var triangles = GIZA.tessellate(contourPts, [holePts]);

    // Diagnostics
    if (false) {
      console.info("result =", JSON.stringify(triangles, null, 4));
    }

    // Filled triangles
    triangleCount = triangles.length;
    typedArray = new Uint16Array(GIZA.flatten(triangles));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.triangles);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, typedArray, gl.STATIC_DRAW);
    if (gl.getError() !== gl.NO_ERROR) {
      console.error('Error when trying to create triangle VBO');
    }

    // Triangle outlines
    var outlines = [];
    for (var i = 0; i < triangles.length; i++) {
      var tri = triangles[i];
      outlines.push(tri[0]);
      outlines.push(tri[1]);
      outlines.push(tri[1]);
      outlines.push(tri[2]);
      outlines.push(tri[2]);
      outlines.push(tri[0]);
    }
    typedArray = new Uint16Array(outlines);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.lines);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, typedArray, gl.STATIC_DRAW);
    if (gl.getError() !== gl.NO_ERROR) {
      console.error('Error when trying to create skeleton VBO');
    }
  }

  var draw = function(currentTime) {

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
    gl.drawElements(gl.TRIANGLES, 3 * triangleCount, gl.UNSIGNED_SHORT, 0);

    // Draw the triangle borders to visualize the tessellation
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.lines);
    gl.drawElements(gl.LINES, 6 * triangleCount, gl.UNSIGNED_SHORT, 0);

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
    if (GIZA.mouse.position) {
      var typedArray = new Float32Array(GIZA.mouse.position);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.mousePoints);
      gl.bufferData(gl.ARRAY_BUFFER, typedArray, gl.STATIC_DRAW);
      gl.vertexAttribPointer(attribs.POSITION, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(program.pointSize, 12 * GIZA.pixelScale);
      gl.uniform4f(program.color, 0.5, 0.0, 0.0, 1);
      gl.drawArrays(gl.POINTS, 0, 1);
    }

    gl.disableVertexAttribArray(attribs.POSITION);
  }

  init();

  COMMON.loadTexture('media/PointSprite.png', function(i) {
    spriteTexture = i;
    GIZA.animate(draw);
  });

};
