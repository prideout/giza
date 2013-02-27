var main = function() {

  GIZA.init();
  var gl = GIZA.context;
  var M4 = GIZA.Matrix4;

  var attribs = {
    POSITION: 0,
    NORMAL: 1,
  };

  var programs = GIZA.compile({
    lit: {
      vs: ['genericvs'],
      fs: ['litfs'],
      attribs: {
        Position: attribs.POSITION,
        Normal: attribs.NORMAL
      }
    },
    solid: {
      vs: ['genericvs'],
      fs: ['solidfs'],
      attribs: {
        Position: attribs.POSITION,
      }
    }
  });

  var buffers = {
    modelCoords: gl.createBuffer(),
    modelNormals: gl.createBuffer(),
  };

  var quadArray = null;
  var quadPoints = null;
  var prims = [];
  var numPendingLoadTasks = 3;
  var turntable = new GIZA.Turntable();

  var onArrival = function(userdata) {

    // Give a status update on what's been downloaded so far.
    if ($('.status').text().length) {
      $('.status').append(" ~ ");
    }
    $('.status').append(userdata);
    numPendingLoadTasks--;

    // Leave early if we're not done downloading all items.
    if (numPendingLoadTasks != 0) {
        return;
    }
    console.info("Done loading", prims.length, "prims.");

    var tris = [];
    var triOffset = 0;
    var coords = [];
    var coordOffset = 0;
    var normals = [];

    for (var i = 0; i < prims.length; i++) {
      var prim = prims[i];

      // Create subarray views
      var quads = quadArray.subarray(
        4 * prim.quadsOffset,
        4 * (prim.quadsOffset + prim.quadsCount));

      var points = quadPoints.subarray(
        3 * prim.vertsOffset,
        3 * (prim.vertsOffset + prim.vertsCount));

      // Now for the filled thingy.
      var triMesh = GIZA.Topo.quadsToTriangles(quads, {
        pointsArray: points,
        dereference: true,
        normals: GIZA.Topo.FACET,
      });

      normals.push(triMesh.normalsArray);
      coords.push(triMesh.pointsArray);
      prim.coordOffset = coordOffset;
      prim.coordCount = triMesh.pointsArray.length / 3;
      coordOffset += prim.coordCount;
    }

    // Aggregate the buffers into a monolithic VBO.
    coords = GIZA.joinBuffers(coords);
    normals = GIZA.joinBuffers(normals);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.modelCoords);
    gl.bufferData(gl.ARRAY_BUFFER, coords, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.modelNormals);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    console.info("Done processing quads.");
  };

  var onCoords = function(data) {
    quadPoints = new Float32Array(data);
    onArrival('coords');
  };

  var onQuads = function(data) {
    quadArray = new Uint16Array(data);
    onArrival('quads');
  };

  var onMeta = function(data) {
    var vertsCount = 0;
    for (var name in data) {
      prim = {};
      prim.name = name;
      prim.displayColor = data[name][0];
      prim.transform = data[name][1];
      prim.vertsOffset = data[name][2];
      prim.vertsCount = data[name][3];
      prim.quadsOffset = data[name][4];
      prim.quadsCount = data[name][5];
      prims.push(prim);
      vertsCount += prim.vertsCount;
    }
    console.info('Total vert count =', vertsCount);
    onArrival('meta');
  };

  var draw = function(currentTime) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    if (numPendingLoadTasks != 0) {
      return;
    }

    var view = M4.lookAt(
      [0,0,-17], // eye
      [0,0,0],  // target
      [0,1,0]); // up

    var proj = M4.perspective(
      10,       // fov in degrees
      GIZA.aspect,
      3, 200);  // near and far

    var spin = M4.make(turntable.getRotation());

    var program = programs.lit;
    gl.useProgram(program);    
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.uniformMatrix4fv(program.projection, false, proj);

    gl.enableVertexAttribArray(attribs.POSITION);
    gl.enableVertexAttribArray(attribs.NORMAL);

    gl.uniform4f(program.lightPosition, 0.75, .25, 1, 1);
    gl.uniform3f(program.ambientMaterial, 0.2, 0.1, 0.1);
    gl.uniform4f(program.diffuseMaterial, 1, 209/255, 54/255, 1);
    gl.uniform1f(program.shininess, 180.0);
    gl.uniform3f(program.specularMaterial, 0.8, 0.8, 0.7);
    gl.uniform1f(program.fresnel, 0.01);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.modelCoords);
    gl.vertexAttribPointer(attribs.POSITION, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.modelNormals);
    gl.vertexAttribPointer(attribs.NORMAL, 3, gl.FLOAT, false, 0, 0);

    for (var i = 0; i < prims.length; i++) {
      var prim = prims[i];

      if (-1 != prim.name.indexOf("Glass")) { // HACK
        continue;
      }

      var color = prim.displayColor.slice(0).concat(1);
      gl.uniform4fv(program.color, color);
    
      var local = M4.make(prim.transform);
      var model = M4.multiply(spin, local);
      var mv = M4.multiply(view, model);
      gl.uniformMatrix4fv(program.modelview, false, mv);
    
      gl.drawArrays(gl.TRIANGLES, prim.coordOffset, prim.coordCount);
    }

    gl.disableVertexAttribArray(attribs.POSITION);
    gl.disableVertexAttribArray(attribs.NORMAL);
  }

  GIZA.download('media/Gizmo.coords.bin', onCoords, 'binary');
  GIZA.download('media/Gizmo.quads.bin', onQuads, 'binary');
  GIZA.download('media/Gizmo.meta.json', onMeta, 'json');
  gl.clearColor(0.9, 0.9, 0.9, 1);
  GIZA.animate(draw);

  COMMON.enableScreenshot(draw);
};
