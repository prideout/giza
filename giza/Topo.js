var GIZA = GIZA || {};

//  - quadsToTriangles
//
// TODO
//   - add processTriangles, similar API as quadsToTriangles
//   - add trianglesToLines, which is fairly simple, like quadsToLines

GIZA.Topo = {

  // Normals Enum
  NONE: 0,
  FACET: 1,
  SMOOTH: 2,

  // Convert an index buffer of 4-tuples (quad mesh) into an index
  // buffer of 3-tuples (triangle mesh).  Optionally dereference the
  // indices to produce a flattened vertex buffer.  If desired, smooth
  // normals or facet normals can be computed.
  //
  // Returns a dictionary with three keys:
  //    indexArray.....this is always filled with a buffer of 3-tupled, constructed with config.destIndexType
  //    pointsArray....if config.dereference is enabled, this returns a buffer of dereferenced coords of type config.destPointsType
  //    normalsArray...if config.normals is not GIZA.Topo.NONE, this holds the result of the computed normal vectors
  //
  quadsToTriangles: function(quadsArray, config) {

    var V3 = GIZA.Vector3;

    var defaults = {
      destIndexType: quadsArray.constructor,
      destPointsType: Float32Array,
      pointsArray: null,
      dereference: false,
      normals: GIZA.Topo.NONE,
    };

    config = GIZA.merge(defaults, config || {});

    var trianglesArray = new config.destIndexType(quadsArray.length * 6 / 4);
    
    var t = 0;
    for (var q = 0; q < quadsArray.length;) {
      var i0 = quadsArray[q++]; var i1 = quadsArray[q++];
      var i2 = quadsArray[q++]; var i3 = quadsArray[q++];
      trianglesArray[t++] = i2;
      trianglesArray[t++] = i1;
      trianglesArray[t++] = i0;
      trianglesArray[t++] = i0;
      trianglesArray[t++] = i3;
      trianglesArray[t++] = i2;
    }

    var getPoint = function(i) {
      var x = config.pointsArray[i*3+0];
      var y = config.pointsArray[i*3+1];
      var z = config.pointsArray[i*3+2];
      return V3.make(x, y, z);
    };

    if (config.dereference) {
      if (!config.pointsArray) {
        console.error('GIZA.Topo: Dereferencing was requested, but pointsArray was not specified.');
        return;
      }
      var pointsArray = new config.destPointsType(trianglesArray.length * 3);
      var p = 0;
      for (var t = 0; t < trianglesArray.length; t++) {
        var i = trianglesArray[t];
        pointsArray[p++] = config.pointsArray[i*3+0];
        pointsArray[p++] = config.pointsArray[i*3+1];
        pointsArray[p++] = config.pointsArray[i*3+2];
      }

      var normalsArray = null;
      if (config.normals == GIZA.Topo.FACET) {
        normalsArray = new Float32Array(pointsArray.length);
        var t = 0;
        for (var q = 0; q < quadsArray.length;) {
          var i0 = quadsArray[q++]; var i1 = quadsArray[q++];
          var i2 = quadsArray[q++]; var i3 = quadsArray[q++];
          var a = getPoint(i0);
          var b = getPoint(i1);
          var c = getPoint(i2);
          var u = V3.direction(a, b);
          var v = V3.direction(a, c);
          var n = V3.cross(u, v);
          for (var j = 0; j < 6; j++) {
            normalsArray[t++] = n[0];
            normalsArray[t++] = n[1];
            normalsArray[t++] = n[2];
          }
        }
      }
    }

    if (config.normals == GIZA.Topo.SMOOTH) {

      // Initialize a vertex-to-face table
      var vertToQuad = [];
      for (var v = 0; v < config.pointsArray.length / 3; v++) {
        vertToQuad.push([]);
      }

      // Compute facet normals and populate the v2f table.
      var quadNormals = [];
      for (var q = 0; q < quadsArray.length;) {
        var i0 = quadsArray[q++]; var i1 = quadsArray[q++];
        var i2 = quadsArray[q++]; var i3 = quadsArray[q++];

        vertToQuad[i0].push(q/4-1);
        vertToQuad[i1].push(q/4-1);
        vertToQuad[i2].push(q/4-1);
        vertToQuad[i3].push(q/4-1);

        var a = getPoint(i0);
        var b = getPoint(i1);
        var c = getPoint(i2);
        var u = V3.direction(a, b);
        var v = V3.direction(a, c);
        var n = V3.cross(u, v);
        quadNormals.push(n);
      }

      // Compute smooth normals by averaging neighboring face normals
      normalsArray = new Float32Array(config.pointsArray.length);
      var t = 0;
      for (var v = 0; v < config.pointsArray.length / 3; v++) {
        var n = V3.make(0, 0, 0);
        for (var i = 0; i < vertToQuad[v].length; i++) {
          n = V3.add(n, quadNormals[vertToQuad[v][i]]);
        }
        V3.normalize(n);
        normalsArray[t++] = n[0];
        normalsArray[t++] = n[1];
        normalsArray[t++] = n[2];
      }
    }

    return {
      indexArray: trianglesArray,
      pointsArray: pointsArray,
      normalsArray: normalsArray,
    };

  },

  // Convert an index buffer of 4-tuples (quad mesh) into an index
  // buffer of 2-tuples (wireframe) without duplicating edges.
  quadsToLines: function(quadsArray, destType) {
    destType = destType || quadsArray.constructor;
    edgeList = {};
    
    var addEdge = function(i0, i1) {
      var h0 = ("0000" + i0.toString(16)).slice(-4);
      var h1 = ("0000" + i1.toString(16)).slice(-4);
      if (i0 < i1) {
        edgeList[h0+h1] = [i0,i1];
      } else {
        edgeList[h1+h0] = [i1,i0];
      }
    };

    for (var q = 0; q < quadsArray.length;) {
      var i0 = quadsArray[q++]; var i1 = quadsArray[q++];
      var i2 = quadsArray[q++]; var i3 = quadsArray[q++];
      addEdge(i0, i1); addEdge(i1, i2);
      addEdge(i2, i3); addEdge(i3, i0);
    }

    var keys = Object.keys(edgeList).sort();
    var linesArray = new destType(keys.length * 2);
    var i = 0, j = 0;
    while (i < keys.length) {
      var edge = edgeList[keys[i++]];
      linesArray[j++] = edge[0];
      linesArray[j++] = edge[1];
    }
    return linesArray;
  },

  // Convert an index buffer of 3-tuples (triangle mesh) into an index
  // buffer of 2-tuples (wireframe) without duplicating edges.
  trianglesToLines: function(trianglesArray, destType) {
    destType = destType || trianglesArray.constructor;
    edgeList = {};
    
    var addEdge = function(i0, i1) {
      var h0 = ("0000" + i0.toString(16)).slice(-4);
      var h1 = ("0000" + i1.toString(16)).slice(-4);
      if (i0 < i1) {
        edgeList[h0+h1] = [i0,i1];
      } else {
        edgeList[h1+h0] = [i1,i0];
      }
    };

    for (var q = 0; q < trianglesArray.length;) {
      var i0 = trianglesArray[q++];
      var i1 = trianglesArray[q++];
      var i2 = trianglesArray[q++];
      addEdge(i0, i1);
      addEdge(i1, i2);
      addEdge(i2, i0);
    }

    var keys = Object.keys(edgeList).sort();
    var linesArray = new destType(keys.length * 2);
    var i = 0, j = 0;
    while (i < keys.length) {
      var edge = edgeList[keys[i++]];
      linesArray[j++] = edge[0];
      linesArray[j++] = edge[1];
    }
    return linesArray;
  },

};
