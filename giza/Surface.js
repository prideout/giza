var GIZA = GIZA || {};

GIZA.equations = {};

GIZA.equations.sphere = function(radius) {
  return function(u, v) {
    u = Math.PI * u;
    v = 2.0 * Math.PI * v;
    return GIZA.Vector3.make(
      radius * Math.sin(u) * Math.cos(v),
      radius * Math.cos(u),
      radius * -Math.sin(u) * Math.sin(v)
    );
  };
};

GIZA.equations.plane = function(width) {
  return function(u, v) {
    var x = -width/2 + width * u;
    var y = -width/2 + width * v;
    return GIZA.Vector3.make(x, y, 0);
  };
};

GIZA.equations.sinc = function(interval, width, height) {
  var plane = GIZA.equations.plane(width);
  return function(u, v) {
    var p = plane(u, v);
    var x = p[0] * interval / width;
    var y = p[1] * interval / width;
    var r = Math.sqrt(x*x + y*y);
    p[2] = height * Math.sin(r) / r;
    return p;
  };
};

GIZA.equations.torus = function(minor, major) {
  return function(u, v) {
    u = 2.0 * Math.PI * u;
    v = 2.0 * Math.PI * v;
    return GIZA.Vector3.make(
      (major + minor * Math.cos(v)) * Math.cos(u),
      (major + minor * Math.cos(v)) * Math.sin(u),
      minor * Math.sin(v)
    );
  };
};

GIZA.equations.tube = function(curve, radius) {
  var V3 = GIZA.Vector3;
  var V4 = GIZA.Vector4;
  var M4 = GIZA.Matrix4;
  return function(u, v) {

    // Compute three basis vectors:
    var p1 = curve(u);
    var p2 = curve(u + 0.01);
    var a = V3.normalize(V3.subtract(p1, p2));
    var b = V3.perp(a);
    var c = V3.normalize(V3.cross(a, b));
    var m = M4.makeBasis(c, b, a);

    // Rotate the Z-plane circle appropriately:
    var spokeVector = V4.make(
      Math.cos(Math.PI * 4.0 * v),
      Math.sin(Math.PI * 4.0 * v),
      0, 0);
    spokeVector = M4.multiply(m, spokeVector);
    spokeVector = V4.scale(spokeVector, radius);

    // Add the spoke vector to the center to obtain the rim position:
    return V3.add(spokeVector, p1);
  };
};

GIZA.equations.grannyKnot = function(t) {
  t = 2 * Math.PI * t;
  var cos = Math.cos, sin = Math.sin;
  var x = -0.22 * cos(t) - 1.28 * sin(t) - 0.44 * cos(3 * t) - 0.78 * sin(3 * t);
  var y = -0.1 * cos(2 * t) - 0.27 * sin(2 * t) + 0.38 * cos(4 * t) + 0.46 * sin(4 * t);
  var z = 0.7 * cos(3 * t) - 0.4 * sin(3 * t);
  return GIZA.Vector3.make(x, y, z);
};

GIZA.surfaceFlags = {
  POSITIONS: 1,
  COLORS: 2,
  NORMALS: 4,
  WRAP_COLS: 8,
  WRAP_ROWS: 16
};

GIZA.surface = function(equation, rows, cols, flags) {
  
  var V3 = GIZA.Vector3;
  var V2 = GIZA.Vector2;

  if (flags == null) {
    var F = GIZA.surfaceFlags;
    flags = F.POSITIONS | F.WRAP_COLS | F.WRAP_ROWS;
  }

  // rows and cols refer to the number of quads or "cells" in the mesh.
  //
  // We always emit vertices for both endpoints of the interval, even
  // for wrapping meshes (for texture coordinate continuity).
  //
  // WRAP_COLS and WRAP_ROWS exist purely to prevent overdraw of
  // wireframe lines along the seam.

  var wrapCols = flags & GIZA.surfaceFlags.WRAP_COLS;
  var wrapRows = flags & GIZA.surfaceFlags.WRAP_ROWS;
  var colors   = flags & GIZA.surfaceFlags.COLORS;
  var normals  = flags & GIZA.surfaceFlags.NORMALS;

  var pointCount = (rows + 1) * (cols + 1);
  var triangleCount = 2 * rows * cols;
  var colLines = wrapCols ? cols : (cols+1);
  var rowLines = wrapRows ? rows : (rows+1);
  var lineCount = (colLines * rows) + (rowLines * cols);

  var numFloats = 3;
  if (normals) {
    numFloats += 3;
  }
  if (colors) {
    numFloats++;
  }
  var bytesPerPoint = 4 * numFloats;

  return {
    pointCount: function() { return pointCount; },
    lineCount: function() { return lineCount; },
    triangleCount: function() { return triangleCount; },

    points: function() {
      if (pointCount > 65535) {
        console.error("Too many points for 16-bit indices");
      }

      // Create a description of the vertex format.
      var desc = {};
      desc.position = [Float32Array, 3];
      if (normals) {
        desc.normal = [Float32Array, 3];
      }
      if (colors) {
        desc.color = [Uint8Array, 4];
      }

      // Allocate the interleaved buffer and create iterators.
      var bufferView = new GIZA.BufferView(desc);
      var points = bufferView.makeBuffer(pointCount);
      var position = bufferView.iterator('position');
      var normal = bufferView.iterator('normal');

      // Evaluate the parametric function and generate points.
      var du = 1.0 / cols;
      var dv = 1.0 / rows;
      var v = 0;
      for (var row = 0; row < rows + 1; row++) {
        var u = 0;
        for (var col = 0; col < cols + 1; col++) {
          var p = equation(u, v);
          V3.set(position.next(), p);

          if (normals) {
            var p2 = V3.subtract(equation(u+du, v), p);
            var p1 = V3.subtract(equation(u, v+dv), p);
            var n = V3.normalize(V3.cross(p1, p2));
            V3.set(normal.next(), n);
          }

          u = (col == cols) ? 1.0 : (u + du);
        }
        v = (row == rows) ? 1.0 : (v + dv);
      }
      return points;
    },

    lines: function(arrayType) {
      arrayType = arrayType || Uint16Array;
      var bufferView = new GIZA.BufferView({
        line: [arrayType, 2],
      });
      var lines = bufferView.makeBuffer(lineCount);
      var line = bufferView.iterator('line');
      var pointsPerRow = cols+1;
      var pointsPerCol = rows+1;
      for (var row = 0; row < rowLines; row++) {
        for (var col = 0; col < cols; col++) {
          var i = row * pointsPerRow + col;
          V2.set(line.next(), [i, i + 1]);
        }
      }
      for (var row = 0; row < rows; row++) {
        for (var col = 0; col < colLines; col++) {
          var i = row * pointsPerRow + col;
          V2.set(line.next(), [i, i + pointsPerRow]);
        }
      }
      return lines;
    },

    triangles: function(arrayType) {
      arrayType = arrayType || Uint16Array;
      var bufferView = new GIZA.BufferView({
        triangle: [arrayType, 3],
      });
      var triangles = bufferView.makeBuffer(triangleCount);
      var triangle = bufferView.iterator('triangle');
      var pointsPerRow = cols+1;
      for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
          var i = row * pointsPerRow + col;
          var a = i+pointsPerRow;
          var b = i+1;
          var c = i;
          var d = i+pointsPerRow+1;
          V3.set(triangle.next(), [a, b, c])
          V3.set(triangle.next(), [d, b, a])
        }
      }
      return triangles;
    }
  };
};
