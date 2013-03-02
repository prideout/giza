var GIZA = GIZA || {};

GIZA.Path = {

  Turtle: function(x, y) {
    var coords = [[x,y]];
    return {
      getNearest: function(p, threshold) {
        var V2 = GIZA.Vector2;
        var minDist = threshold || 40;
        var minIndex = -1;

        for (var i = 0; i < coords.length; i++) {
          var d = V2.distanceSquared(coords[i], p);
          if (d < minDist) {
            minIndex = i;
            minDist = d;
          }
        }
        return minIndex;
      },
      coords: function() {
        return coords;
      },
      lineTo: function(x, y) {
        coords.push([x,y]);
      },
      bezierCurveTo: function(cp1x, cp1y, cp2x, cp2y, x, y) {
        coords.push([x,y]);
      },
      closePath: function() {
        coords.push(coords[0]);
      },
      mirror: function() {
        for (var i = 0; i < coords.length; i++) {
          coords[i] = [coords[i][1], coords[i][0]];
        }
      },
      translate: function(x, y) {
        for (var i = 0; i < coords.length; i++) {
          coords[i][0] += x;
          coords[i][1] += y;
        }
      },
      scale: function(x, y) {
        for (var i = 0; i < coords.length; i++) {
          coords[i][0] *= x;
          coords[i][1] *= y;
        }
      },
      write: function(typedArray, offset) {
        offset = offset || 0;
        for (var i = 0; i < coords.length; i++) {
          typedArray[offset++] = coords[i][0];
          typedArray[offset++] = coords[i][1];
        }
        return offset;
      }
    }
  },

  Circle: function(center, radius, normal) {

    // Allow clients to skip the "new"
    if (!(this instanceof GIZA.Path.Circle)) {
      return new GIZA.Path.Circle(center, radius, normal);
    }

    this.center = center;
    this.radius = radius;
    this.normal = normal;

    this.tessellate = function(numPoints) {
      var typedArray = new Float32Array(numPoints * 3);

      var theta = 0;
      var dtheta = 2 * Math.PI / numPoints;
      
      for (var i = 0; i < numPoints; i++) {
        typedArray[i*3 + 0] = center[0] + radius * Math.cos(theta);
        typedArray[i*3 + 1] = center[1] + radius * Math.sin(theta);
        typedArray[i*3 + 2] = 0;
        theta += dtheta;
      }
      
      return typedArray;
    };

  },

};
