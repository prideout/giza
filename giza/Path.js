var GIZA = GIZA || {};

GIZA.Path = {

  Turtle: function(x, y) {
    var coords = [[x,y]];
    return {
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
