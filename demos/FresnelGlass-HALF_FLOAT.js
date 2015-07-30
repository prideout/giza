var downloadBuffers = function(descs, onDone) {
  var expectedBufCount = Object.keys(descs).length;
  var bufCount = 0;
  var bufMap = {};

  var onError = function() {
    $('.tagline').text('Error: unable to download Buddha.');
  };

  var onReceive = function(dataType) {
    return function(data) {
      bufMap[dataType] = data;
      if (++bufCount == expectedBufCount) {
        onDone(bufMap);
      }
    };
  };

  for (var key in descs) {
    GIZA.download(descs[key], onReceive(key), 'binary', onError);
  }
};

var createQuad = function(l, b, r, t) {
  var positions = [ l, b, l, t, r, t, r, t, r, b, l, b ];
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  return positionBuffer;
}

var main = function() {

  var canvas3d = document.getElementById('canvas3d');
  gl = GIZA.init(canvas3d, {antialias: false});
  var M4 = GIZA.Matrix4;
  var C4 = GIZA.Color4;
  var V2 = GIZA.Vector2;

  var attribs = {
    POSITION: 0,
    NORMAL: 1,
    TEXCOORD: 2,
  };

  var prefix = 'http://github.prideout.net/giza/demos/media/';
  var vboFiles = {
    normals: prefix + "BuddhaNormals.bin",
    positions: prefix + "BuddhaPositions.bin",
    triangles: prefix + "BuddhaTriangles.bin",
  };

  var gpuBuffers = {};
  var textures = {};


  var glext = gl.getExtension("OES_texture_half_float");
  if (!glext) {
     alert("Your browser does not support FP16 textures.");
  }
  var HALF_FLOAT_OES = glext.HALF_FLOAT_OES;

  if (!gl.getExtension("OES_texture_half_float_linear")) {
     alert("Your browser does not support bilinear filtering with FP16 textures.");
  }

  downloadBuffers(vboFiles, function(cpuBuffers) {

    // First, create buffers for vertex attributes.

    gpuBuffers.positions = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gpuBuffers.positions);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cpuBuffers.positions), gl.STATIC_DRAW);

    gpuBuffers.normals = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gpuBuffers.normals);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cpuBuffers.normals), gl.STATIC_DRAW);

    gpuBuffers.triangles = gl.createBuffer();
    gpuBuffers.indexCount = cpuBuffers.triangles.byteLength / Uint16Array.BYTES_PER_ELEMENT;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuBuffers.triangles);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cpuBuffers.triangles), gl.STATIC_DRAW);

    $('.tagline').text('Rendering to a floating-point FBO.');

    // Create double-size, fp32 RGBA framebuffer object for depth and fresnel factor

    var texWidth = GIZA.canvas.width;
    var texHeight = GIZA.canvas.height;
    textures.depth = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textures.depth);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0, gl.RGBA, HALF_FLOAT_OES, null);
    if (gl.NO_ERROR != gl.getError()) {
       alert("Bad texture creation");
    }

    gpuBuffers.depth = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, gpuBuffers.depth);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures.depth, 0);
    if (gl.FRAMEBUFFER_COMPLETE != gl.checkFramebufferStatus(gl.FRAMEBUFFER)) {
       alert("Incomplete FBO");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gpuBuffers.quad = createQuad(-1, -1, 1, 1);
  });

  var programs = GIZA.compile({

    simple: {
      vs: ['simplevs'],
      fs: ['simplefs'],
      attribs: {
        Position: attribs.POSITION,
        TexCoord: attribs.TEXCOORD,
      }
    },

    depth: {
      vs: ['VS-Scene'],
      fs: ['FS-Depth'],
      attribs: {
        Position: attribs.POSITION,
        Normal: attribs.NORMAL,
      }
    },

    absorption: {
      vs: ['VS-Quad'],
      fs: ['FS-Absorption'],
      attribs: {
        Position: attribs.POSITION,
      }
    },

  });

  var numPoints = 4;
  var buffer = gl.createBuffer();
  var texture = gl.createTexture();

  var init = function() {

    // Set up a description of the vertex format.
    var bufferView = new GIZA.BufferView({
      p: [Float32Array, 2],
      t: [Float32Array, 2],
    });

    // Allocate and populate the ArrayBuffer.
    var vertexArray = bufferView.makeBuffer(numPoints);
    var iterator = bufferView.iterator();
    
    var vertex;
    vertex = iterator.next(); V2.set(vertex.p, [-1, -0.25]); V2.set(vertex.t, [0, 0]);
    vertex = iterator.next(); V2.set(vertex.p, [-1, 0.25]); V2.set(vertex.t, [0, 1]);
    vertex = iterator.next(); V2.set(vertex.p, [1, -0.25]); V2.set(vertex.t, [1, 0]);
    vertex = iterator.next(); V2.set(vertex.p, [1, 0.25]); V2.set(vertex.t, [1, 1]);

    // Create the vertex buffer object etc.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    gl.clearColor(0.6, 0.6, .6, 1.0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  };

  var draw = function(currentTime) {

    gl.clear(gl.COLOR_BUFFER_BIT);
    
    var proj = M4.orthographic(
        -GIZA.aspect, GIZA.aspect, // left right
        -1, +1, // bottom top
        0, 100);  // near far

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.enableVertexAttribArray(attribs.POSITION);

    ////////////////////////////////////////////////////////////////////////////////

    if (Object.keys(gpuBuffers).length == 0) {
      return;
    }

    gl.disable(gl.DEPTH_TEST);
 
    var view = M4.lookAt(
      [0,-20,0], // eye
      [0,0,0],  // target
      [0,0,-1]); // up

    var model = M4.rotationZ(currentTime * 0.001);
    var mv = M4.multiply(view, model);

    // Draw Buddha into the depth buffer

    gl.bindFramebuffer(gl.FRAMEBUFFER, gpuBuffers.depth);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    program = programs.depth;
    gl.useProgram(program);
    gl.uniformMatrix4fv(program.projection, false, proj);
    gl.uniformMatrix4fv(program.modelview, false, mv);
    gl.enableVertexAttribArray(attribs.POSITION);
    gl.bindBuffer(gl.ARRAY_BUFFER, gpuBuffers.positions);
    gl.vertexAttribPointer(attribs.POSITION, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribs.NORMAL);
    gl.bindBuffer(gl.ARRAY_BUFFER, gpuBuffers.normals);
    gl.vertexAttribPointer(attribs.NORMAL, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpuBuffers.triangles);
    gl.drawElements(gl.TRIANGLES, gpuBuffers.indexCount, gl.UNSIGNED_SHORT, 0);
    gl.disableVertexAttribArray(attribs.NORMAL);

    // Draw the image-processing quad

    gl.disable(gl.BLEND);
    program = programs.absorption;
    gl.useProgram(program);
    gl.uniform2f(program.Size, GIZA.canvas.width, GIZA.canvas.height);
    gl.uniform3f(program.DiffuseMaterial, 0.0, 0.75, 0.75);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindTexture(gl.TEXTURE_2D, textures.depth);
    gl.bindBuffer(gl.ARRAY_BUFFER, gpuBuffers.quad);
    gl.vertexAttribPointer(attribs.POSITION, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindTexture(gl.TEXTURE_2D, null);
  };

  init();
  GIZA.animate(draw);

};
