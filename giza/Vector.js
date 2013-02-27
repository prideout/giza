// This file defines groups of free functions (eg, GIZA.Vector2).  It
// does NOT define new JavaScript objects.  The underlying data can be
// native JavaScript Arrays or TypedArrays.

var GIZA = GIZA || {};

GIZA.Vector2 = {

  make: function(x, y) {
    return [x, y];
  },

  direction: function(src, dest) {
    return this.normalized(this.subtract(dest, src));
  },

  equivalent: function(a, b, epsilon) {
    epsilon = epsilon || 1e-6;
    return this.distanceSquared(a, b) < epsilon;
  },

  copy: function(v) {
    return this.make(v[0], v[1]);
  },

  set: function(dest, src) {
    dest[0] = src[0];
    dest[1] = src[1];
    return dest;
  },

  normalize: function(v) {
    var s = 1 / this.length(v);
    return this.scale(v, s);
  },

  normalized: function(v) {
    var s = 1 / this.length(v);
    return this.scaled(v, s);
  },

  translate: function(v, delta, ty) {
    if (ty) {
      v[0] += delta;
      v[1] += ty;
    } else {
      v[0] += delta[0];
      v[1] += delta[1];
    }
    return v;
  },

  translated: function(v, delta, ty) {
    var r = this.make();
    if (ty) {
      r[0] = v[0] + delta;
      r[1] = v[1] + ty;
    } else {
      r[0] = v[0] + delta[0];
      r[1] = v[1] + delta[1];
    }
    return r;
  },

  scale: function(v, s) {
    v[0] *= s;
    v[1] *= s;
    return v;
  },

  scaled: function(v, s) {
    return this.make(
      s * v[0],
      s * v[1]);
  },

  negate: function(v) {
    return this.scale(v, -1);
  },

  negated: function(v) {
    return this.scaled(v, -1);
  },

  length: function(v) {
    return Math.sqrt(this.dot(v, v));
  },

  lengthSquared: function(v) {
    return this.dot(v, v);
  },

  distance: function(a, b) {
    var d = this.subtract(a, b);
    return this.length(d);
  },

  distanceSquared: function(a, b) {
    var d = this.subtract(a, b);
    return this.lengthSquared(d);
  },

  // a cross product of 2D vectors you ask?
  // see "withinTriangle" and you'll see why!
  cross: function(a, b) {
    return a[0] * b[1] - a[1] * b[0];
  },

  // Walk around the edges and determine if
  // p is to the left or right of each edge.
  // If the answer is the same for all 3 edges,
  // then the point is inside.
  withinTriangle: function(p, a, b, c) {
    var ab = this.subtract(b, a);
    var bc = this.subtract(c, b);
    var ca = this.subtract(a, c);
    var ap = this.subtract(p, a);
    var bp = this.subtract(p, b);
    var cp = this.subtract(p, c);
    var a = this.cross(ab, ap);
    var b = this.cross(bc, bp);
    var c = this.cross(ca, cp);
    if (a < 0 && b < 0 && c < 0) {
      return true;
    }
    if (a > 0 && b > 0 && c > 0) {
      return true;
    }
    return false;
  },

  subtract: function(a, b) {
    return this.make(
      a[0] - b[0],
      a[1] - b[1]);
  },

  add: function(a, b) {
    return this.make(
      a[0] + b[0],
      a[1] + b[1]);
  },

  dot: function(a, b) {
    return a[0]*b[0] + a[1]*b[1];
  },

  lerp: function(a, b, t) {
    a = this.scaled(a, 1-t);
    b = this.scaled(b, t);
    return this.add(a, b);
  },  

};

GIZA.Vector3 = {

  make: function(x, y, z) {
    return [x, y, z];
  },

  direction: function(src, dest) {
    return this.normalized(this.subtract(dest, src));
  },

  equivalent: function(a, b, epsilon) {
    epsilon = epsilon || 1e-6;
    return this.distanceSquared(a, b) < epsilon;
  },

  copy: function(v) {
    return this.make(v[0], v[1], v[2]);
  },

  set: function(dest, src) {
    dest[0] = src[0];
    dest[1] = src[1];
    dest[2] = src[2];
    return dest;
  },

  normalize: function(v) {
    var s = 1 / this.length(v);
    return this.scale(v, s);
  },

  normalized: function(v) {
    var s = 1 / this.length(v);
    return this.scaled(v, s);
  },

  translate: function(v, delta, ty, tz) {
    if (ty) {
      v[0] += delta;
      v[1] += ty;
      v[2] += tz;
    } else {
      v[0] += delta[0];
      v[1] += delta[1];
      v[2] += delta[2];
    }
    return v;
  },

  translated: function(v, delta, ty, tz) {
    var r = this.make();
    if (ty) {
      r[0] = v[0] + delta;
      r[1] = v[1] + ty;
      r[2] = v[2] + tz;
    } else {
      r[0] = v[0] + delta[0];
      r[1] = v[1] + delta[1];
      r[2] = v[2] + delta[2];
    }
    return r;
  },

  scale: function(v, s) {
    v[0] *= s;
    v[1] *= s;
    v[2] *= s;
    return v;
  },

  scaled: function(v, s) {
    return this.make(
      s * v[0],
      s * v[1],
      s * v[2]);
  },

  negate: function(v) {
    return this.scale(v, -1);
  },

  negated: function(v) {
    return this.scaled(v, -1);
  },

  length: function(v) {
    return Math.sqrt(this.dot(v, v));
  },

  lengthSquared: function(v) {
    return this.dot(v, v);
  },

  distance: function(a, b) {
    var d = this.subtract(a, b);
    return this.length(d);
  },

  distanceSquared: function(a, b) {
    var d = this.subtract(a, b);
    return this.lengthSquared(d);
  },

  cross: function(a, b) {
    return this.make(
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]);
  },

  subtract: function(a, b) {
    return this.make(
      a[0] - b[0],
      a[1] - b[1],
      a[2] - b[2]);
  },

  add: function(a, b) {
    return this.make(
      a[0] + b[0],
      a[1] + b[1],
      a[2] + b[2]);
  },

  dot: function(a, b) {
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  },

  lerp: function(a, b, t) {
    a = this.scaled(a, 1-t);
    b = this.scaled(b, t);
    return this.add(a, b);
  },

  // Every vector in 3-space has an infinite number of perpendicular
  // vectors, so here we simply choose a reasonable one.
  perp: function(u) {
    var uprime = this.cross(u, this.make(1, 0, 0));
    if (this.lengthSquared(uprime) < 0.01) {
      uprime = this.cross(u, this.make(0, 1, 0));
    }
    return this.normalize(uprime);
  }

};

GIZA.Vector4 = {

  make: function(x, y, z, w) {
    return [x, y, z, w];
  },

  equivalent: function(a, b, epsilon) {
    epsilon = epsilon || 1e-6;
    return this.distanceSquared(a, b) < epsilon;
  },

  copy: function(v) {
    return this.make(v[0], v[1], v[2], v[3]);
  },

  set: function(dest, src) {
    dest[0] = src[0];
    dest[1] = src[1];
    dest[2] = src[2];
    dest[3] = src[3];
    return dest;
  },

  normalize: function(v) {
    var s = 1 / this.length(v);
    return this.scale(v, s);
  },

  normalized: function(v) {
    var s = 1 / this.length(v);
    return this.scaled(v, s);
  },

  translate: function(v, delta, ty, tz, tw) {
    if (ty) {
      v[0] += delta;
      v[1] += ty;
      v[2] += tz;
      v[3] += tw;
    } else {
      v[0] += delta[0];
      v[1] += delta[1];
      v[2] += delta[2];
      v[3] += delta[3];
    }
    return v;
  },

  translated: function(v, delta, ty, tz, tw) {
    var r = this.make();
    if (ty) {
      r[0] = v[0] + delta;
      r[1] = v[1] + ty;
      r[2] = v[2] + tz;
      r[3] = v[3] + tw;
    } else {
      r[0] = v[0] + delta[0];
      r[1] = v[1] + delta[1];
      r[2] = v[2] + delta[2];
      r[3] = v[3] + delta[3];
    }
    return r;
  },

  scale: function(v, s) {
    v[0] *= s;
    v[1] *= s;
    v[2] *= s;
    v[3] *= s;
    return v;
  },

  scaled: function(v, s) {
    return this.make(
      s * v[0],
      s * v[1],
      s * v[2],
      s * v[3]);
  },

  negate: function(v) {
    return this.scale(v, -1);
  },

  negated: function(v) {
    return this.scaled(v, -1);
  },

  length: function(v) {
    return Math.sqrt(this.dot(v, v));
  },

  lengthSquared: function(v) {
    return this.dot(v, v);
  },

  distance: function(a, b) {
    var d = this.subtract(a, b);
    return this.length(d);
  },

  distanceSquared: function(a, b) {
    var d = this.subtract(a, b);
    return this.lengthSquared(d);
  },

  subtract: function(a, b) {
    return this.make(
      a[0] - b[0],
      a[1] - b[1],
      a[2] - b[2],
      a[3] - b[3]);
  },

  add: function(a, b) {
    return this.make(
      a[0] + b[0],
      a[1] + b[1],
      a[2] + b[2],
      a[3] + b[3]);
  },

  dot: function(a, b) {
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
  },

  lerp: function(a, b, t) {
    a = this.scaled(a, 1-t);
    b = this.scaled(b, t);
    return this.add(a, b);
  },

};
