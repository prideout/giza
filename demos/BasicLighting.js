var main = function() {

  var options = {};
  COMMON.bindOptions(options, '#checks');
  
  GIZA.init();
  var gl = GIZA.context;
  var M4 = GIZA.Matrix4;

  var attribs = {
    POSITION: 0,
    NORMAL: 1,
  };

  var programs = GIZA.compile({
    lighting: {
      vs: ['litvs'],
      fs: ['litfs'],
      attribs: {
        Position: attribs.POSITION,
        Normal: attribs.NORMAL
      }
    }
  });

  var buffers = {
    sphereCoords: gl.createBuffer(),
    torusCoords: gl.createBuffer(),
    mesh: gl.createBuffer()
  };

  var init = function() {

    gl.clearColor(34 / 255, 74 / 255, 116 / 255, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    var lod = 64;

    var flags = function() {
      var f = GIZA.surfaceFlags;
      return f.POSITIONS | f.NORMALS | f.WRAP_COLS | f.WRAP_ROWS;
    }();

    var torus = function() {
      var equation = GIZA.equations.torus(.25, 1);
      var surface = GIZA.surface(equation, lod, lod, flags);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.torusCoords);
      gl.bufferData(gl.ARRAY_BUFFER, surface.points(), gl.STATIC_DRAW);
      return surface;
    }();

    var sphere = function() {
      var equation = GIZA.equations.sphere(1.25);
      var surface = GIZA.surface(equation, lod, lod, flags);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphereCoords);
      gl.bufferData(gl.ARRAY_BUFFER, surface.points(), gl.STATIC_DRAW);
      return surface;
    }();

    buffers.mesh.triangleCount = sphere.triangleCount();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.mesh);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.triangles(), gl.STATIC_DRAW);

    if (gl.getError() !== gl.NO_ERROR) {
      console.error('Error when trying to create VBOs');
    }
  }

  var draw = function(currentTime) {
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var mv = M4.lookAt(
      [0,0,-20], // eye
      [0,0,0],  // target
      [0,1,0]); // up

    var proj = M4.perspective(
      10,       // fov in degrees
      GIZA.aspect,
      3, 200);  // near and far

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.mesh)
    gl.enableVertexAttribArray(attribs.POSITION);
    gl.enableVertexAttribArray(attribs.NORMAL);

    var program = programs.lighting;
    gl.useProgram(program);
    gl.uniformMatrix4fv(program.projection, false, proj);
    gl.uniform4f(program.lightPosition, 0.75, .25, 1, 1);

    if (options.ambient) {
      gl.uniform3f(program.ambientMaterial, 0.2, 0.1, 0.1);
    } else {
      gl.uniform3f(program.ambientMaterial, 0, 0, 0);
    }

    if (options.diffuse) {
      gl.uniform4f(program.diffuseMaterial, 1, 209/255, 54/255, 1);
    } else {
      gl.uniform4f(program.diffuseMaterial, 0, 0, 0, 1);
    }

    gl.uniform1f(program.shininess, 180.0);
    if (options.specular) {
      gl.uniform3f(program.specularMaterial, 0.8, 0.8, 0.7);
    } else {
      gl.uniform3f(program.specularMaterial, 0, 0, 0);
    }

    if (options.fresnel) {
      gl.uniform1f(program.fresnel, 0.01);
    } else {
      gl.uniform1f(program.fresnel, 0);
    }

    var previous = M4.copy(mv);
    M4.translate(mv, [-1.5,0,0]);

    gl.uniformMatrix4fv(program.modelview, false, mv);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphereCoords);
    gl.vertexAttribPointer(attribs.POSITION, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(attribs.NORMAL, 3, gl.FLOAT, false, 24, 12);
    gl.drawElements(gl.TRIANGLES,
                    3 * buffers.mesh.triangleCount,
                    gl.UNSIGNED_SHORT,
                    0)
    
    mv = previous;
    M4.translate(mv, [1.5,0,0]);
    M4.rotateY(mv, currentTime / 1000);

    gl.uniformMatrix4fv(program.modelview, false, mv);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.torusCoords);
    gl.vertexAttribPointer(attribs.POSITION, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(attribs.NORMAL, 3, gl.FLOAT, false, 24, 12);
    gl.drawElements(gl.TRIANGLES,
                    3 * buffers.mesh.triangleCount,
                    gl.UNSIGNED_SHORT,
                    0)

    gl.disableVertexAttribArray(attribs.POSITION);
    gl.disableVertexAttribArray(attribs.NORMAL);
  }

  init();
  GIZA.animate(draw);

};
