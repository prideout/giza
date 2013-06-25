var downloadBuffers = function(descs, onDone) {
  var expectedBufCount = Object.keys(descs).length;
  var bufCount = 0;
  var bufMap = {};

  var onReceive = function(dataType) {
    return function(data) {
      bufMap[dataType] = data;
      if (++bufCount == expectedBufCount) {
        onDone(bufMap);
      }
    };
  };

  for (var key in descs) {
    GIZA.download(descs[key], onReceive(key), 'binary');
  }
};

var main = function() {

  var canvas2d = document.getElementById('canvas2d');
  var pixelScale = window.devicePixelRatio || 1;
  canvas2d.width = canvas2d.clientWidth * pixelScale;
  canvas2d.height = canvas2d.clientHeight * pixelScale;

  var ctx = canvas2d.getContext('2d');

  ctx.lineWidth = 5;
  ctx.scale(pixelScale / 2, pixelScale / 2);

  ctx.save();
  ctx.translate(0, -10);
  ctx.beginPath();
  ctx.arc(75,75,50,0,Math.PI*2,true); // Outer circle
  ctx.moveTo(110,75);
  ctx.arc(75,75,35,0,Math.PI,false);   // Mouth (clockwise)
  ctx.moveTo(65,65);
  ctx.arc(60,65,5,0,Math.PI*2,true);  // Left eye
  ctx.moveTo(95,65);
  ctx.arc(90,65,5,0,Math.PI*2,true);  // Right eye
  ctx.stroke();
  ctx.restore();

  ctx.font = 'bold 50px Verdana';
  ctx.fillStyle = "rgba(0, 150, 200, 255)";
  ctx.fillText('grasshopper', 150, 80);

  var canvas3d = document.getElementById('canvas3d');
  var gl = GIZA.init(canvas3d);
  var M4 = GIZA.Matrix4;
  var C4 = GIZA.Color4;
  var V2 = GIZA.Vector2;

  var attribs = {
    POSITION: 0,
    NORMAL: 1,
    TEXCOORD: 2,
  };

  var vboFiles = {
    normals: 'media/BuddhaNormals.bin',
    positions: 'media/BuddhaPositions.bin',
    triangles: 'media/BuddhaTriangles.bin',
  };

  var gpuBuffers = {};

  downloadBuffers(vboFiles, function(cpuBuffers) {

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

    console.info('Downloaded buffers.');
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

    // Copy the 2D canvas into the texture object.
    var canvas2d = document.getElementById('canvas2d');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  };

  var draw = function(currentTime) {

    gl.clear(gl.COLOR_BUFFER_BIT);
    
    var proj = M4.orthographic(
        -GIZA.aspect, GIZA.aspect, // left right
        -1, +1, // bottom top
        0, 100);  // near far

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.enableVertexAttribArray(attribs.POSITION);
    gl.vertexAttribPointer(attribs.POSITION, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(attribs.TEXCOORD);
    gl.vertexAttribPointer(attribs.TEXCOORD, 2, gl.FLOAT, false, 16, 8);

    var program = programs.simple;
    gl.useProgram(program);
    gl.uniformMatrix4fv(program.projection, false, proj);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    var mv = M4.rotationZ(currentTime * 0.01);
    gl.uniformMatrix4fv(program.modelview, false, mv);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, numPoints);

    gl.disableVertexAttribArray(attribs.TEXCOORD);

    ////////////////////////////////////////////////////////////////////////////////

    if (Object.keys(gpuBuffers).length == 0) {
      return;
    }

    gl.disable(gl.DEPTH_TEST);
 
    var view = M4.lookAt(
      [0,-17,-1], // eye
      [0,0,-1],  // target
      [0,0,1]); // up

    var model = M4.rotationZ(currentTime * 0.001);
    var mv = M4.multiply(view, model);

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
    gl.drawElements(gl.TRIANGLES, gpuBuffers.indexCount / 3, gl.UNSIGNED_SHORT, 0);

    gl.disableVertexAttribArray(attribs.NORMAL);
  };

  init();
  GIZA.animate(draw);

};
