// This file defines groups of free functions (eg, GIZA.Vector2).  It
// does NOT define new JavaScript objects.  The underlying data can be
// native JavaScript Arrays or TypedArrays.
//
// See MochaTest.js for usage examples.
//

var GIZA = GIZA || {};

GIZA.Color3 = {

  make: function(r, g, b) {
    return [r, g, b];
  },

  equivalent: function(a, b, epsilon) {
    epsilon = epsilon || 1e-6;
    return GIZA.Vector3.distanceSquared(a, b) < epsilon;
  },

  copy: function(v) {
    return this.make(v[0], v[1], v[2]);
  },

  set: function(dest, src, scale) {
    scale = scale || 1.0;
    dest[0] = src[0] * scale;
    dest[1] = src[1] * scale;
    dest[2] = src[2] * scale;
    return dest;
  },

  // And if you want to do it in GLSL:
  //
  //   vec3 hsv(float h,float s,float v) {
  //     return mix(vec3(1.),clamp(
  //       (abs(fract(h+vec3(3.,2.,1.)/3.)*6.-3.)-1.),0.,1.),s)*v;
  //   }
  //
  hsvToRgb: function(h, s, v) {
    if (s <= 0 ) { return this.make(v, v, v); }
    h = h * 6;
    var c = v*s;
    var fract = h % 2;
    var x = (1-Math.abs(fract-1))*c;
    var m = v-c;
    var r = 0.0;
    var g = 0.0;
    var b = 0.0;
    if (h < 1) { r = c; g = x; b = 0.0; }
    else if (h < 2) { r = x; g = c; b = 0.0; }
    else if (h < 3) { r = 0.0; g = c; b = x; }
    else if (h < 4) { r = 0.0; g = x; b = c; }
    else if (h < 5) { r = x; g = 0.0; b = c; }
    else  { r = c; g = 0.0; b = x; }
    return this.make(r+m,g+m,b+m);
  },

};

GIZA.Color4 = {

  make: function(r, g, b, a) {
    return [r, g, b, a];
  },

  copy: function(v) {
    return this.make(v[0], v[1], v[2], v[3]);
  },

  set: function(dest, src, scale) {
    scale = scale || 1.0;
    dest[0] = src[0] * scale;
    dest[1] = src[1] * scale;
    dest[2] = src[2] * scale;
    dest[3] = src[3];
    return dest;
  },

  hsvToRgb: function(h, s, v) {
    var rgb = GIZA.Color3.hsvToRgb(h, s, v);
    rgb.push(1);
    return rgb;
  },

};
