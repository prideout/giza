var GIZA = GIZA || {};

GIZA.Bounds = {

  min: [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE],
  max: [ Number.MAX_VALUE,  Number.MAX_VALUE,  Number.MAX_VALUE],

  // Takes a Float32Array composed of 3-tuples and returns a simple
  // object with keys "min" and "max", each of which is a 3-tuple.
  aabb: function(coordsArray) {
    var V3 = GIZA.Vector3;
    var retval = {
      min: V3.copy(this.max),
      max: V3.copy(this.min)
    };
    for (var q = 0; q < coordsArray.length; q += 3) {
      retval.min[0] = Math.min(coordsArray[q+0], retval.min[0]);
      retval.min[1] = Math.min(coordsArray[q+1], retval.min[1]);
      retval.min[2] = Math.min(coordsArray[q+2], retval.min[2]);
      retval.max[0] = Math.max(coordsArray[q+0], retval.max[0]);
      retval.max[1] = Math.max(coordsArray[q+1], retval.max[1]);
      retval.max[2] = Math.max(coordsArray[q+2], retval.max[2]);
    }
    return retval;
  },

  size: function(aabb) {
    var V3 = GIZA.Vector3;
    return V3.subtract(aabb.max, aabb.min);
  },

  extent: function(aabb) {
    var s = this.size(aabb);
    return Math.max(Math.max(s[0], s[1]), s[2]);
  },

  center: function(aabb) {
    var V3 = GIZA.Vector3;
    return V3.lerp(aabb.min, aabb.max, 0.5);
  }

};
