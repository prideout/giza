// TODO
//  - fix the degenerate triangle seen in demo
//  - make it less CoffeeScripty

var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

GIZA.tessellate = function(coords, holes) {
  var ab, ac, ap, bc, bp, ca, checkEar, convex, cp, earIndex, ears, getNeighbors, getSlice, h, hole, holeStart, i, intersectSegmentX, isEar, isReflexAngle, isReflexIndex, n, neighbor, newPolygon, ntriangle, p, pcurr, pnext, polygon, pprev, ptriangle, reflex, reflexCount, slice, triangles, vec2, verbose, wasEar, watchdog, _, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _o, _p, _q, _ref, _ref1, _ref2, _ref3, _ref4, _results;
  var V2 = GIZA.Vector2;

  isReflexAngle = function(a, b, c) {
    var ac = V2.subtract(c, a);
    var ab = V2.subtract(b, a);
    var result = 0 > V2.cross(ac, ab);
    return result;
  };

  intersectSegmentX = function(p0, p1, y) {
    var t;
    if (p0[1] === p1[1]) {
      return p0[0];
    }
    if (p0[1] < p1[1]) {
      t = (y - p0[1]) / (p1[1] - p0[1]);
      return p0[0] + t * (p1[0] - p0[0]);
    } else {
      t = (y - p1[1]) / (p0[1] - p1[1]);
      return p1[0] + t * (p0[0] - p1[0]);
    }
  };

  if (coords.length < 3) {
    return [];
  }
  if (coords.length === 3 && holes.length === 0) {
    return [0, 1, 2];
  }
  reflex = [];
  polygon = (function() {
    _results = [];
    for (var _i = 0, _ref = coords.length; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
    return _results;
  }).apply(this);
  reflexCount = 0;

  getSlice = function(hole) {
    var E, I, M, Mn, P, Pn, R, Rn, Rslope, c0, c1, coord, dx, dy, n, ncurr, nnext, p, slice, slope, tricoords, x, xrightmost, _j, _k, _l, _len, _len1, _len2, _ref1, _ref2;
    Mn = 0;
    xrightmost = -10000;
    for (n = _j = 0, _len = hole.length; _j < _len; n = ++_j) {
      coord = hole[n];
      if (coord[0] > xrightmost) {
        xrightmost = coord[0];
        Mn = n;
      }
    }
    M = hole[Mn];
    E = 0.0001;
    I = V2.make(10000, M[1]);
    P = V2.make();
    Pn = -1;
    for (ncurr = _k = 0, _len1 = coords.length; _k < _len1; ncurr = ++_k) {
      c0 = coords[ncurr];
      nnext = (ncurr + 1) % coords.length;
      c1 = coords[nnext];
      if (c0[0] < M[0] && c1[0] < M[0]) {
        continue;
      }
      if (c0[0] > I[0] && c1[0] > I[0]) {
        continue;
      }
      if (((c0[1] <= (_ref1 = M[1]) && _ref1 <= c1[1])) || ((c1[1] <= (_ref2 = M[1]) && _ref2 <= c0[1]))) {
        x = intersectSegmentX(c0, c1, M[1]);
        if (x < I[0]) {
          I[0] = x;
          if (c0[0] > c1[0]) {
            P = c0;
            Pn = ncurr;
          } else {
            P = c1;
            Pn = nnext;
          }
        }
      }
    }
    tricoords = [M, I, P];
    Rslope = 1000;
    Rn = -1;
    for (p = _l = 0, _len2 = polygon.length; _l < _len2; p = ++_l) {
      n = polygon[p];
      if (!reflex[p]) {
        continue;
      }
      R = coords[n];
      if (V2.withinTriangle(R, tricoords[0], tricoords[1], tricoords[2])) {
        dy = Math.abs(R[1] - P[1]);
        dx = Math.abs(R[0] - P[0]);
        if (dx === 0) {
          continue;
        }
        slope = dy / dx;
        if (slope < Rslope) {
          Rslope = slope;
          Rn = n;
        }
      }
    }
    if (Rn !== -1) {
      Pn = Rn;
    }
    slice = [Pn, Mn];
    return slice;
  };

  getNeighbors = function(pcurr) {
    var pnext, pprev;
    pprev = (pcurr + polygon.length - 1) % polygon.length;
    pnext = (pcurr + 1) % polygon.length;
    return [pprev, pnext];
  };

  checkEar = function(pcurr) {
    var i, isEar, n, ntriangle, p, pnext, pprev, ptriangle, tricoords, _j, _len, _ref1;
    if (reflexCount === 0) {
      return true;
    }
    _ref1 = getNeighbors(pcurr), pprev = _ref1[0], pnext = _ref1[1];
    ptriangle = [pprev, pcurr, pnext];
    ntriangle = (function() {
      var _j, _len, _results1;
      _results1 = [];
      for (_j = 0, _len = ptriangle.length; _j < _len; _j++) {
        p = ptriangle[_j];
        _results1.push(polygon[p]);
      }
      return _results1;
    })();
    tricoords = (function() {
      var _j, _len, _results1;
      _results1 = [];
      for (_j = 0, _len = ntriangle.length; _j < _len; _j++) {
        i = ntriangle[_j];
        _results1.push(coords[i]);
      }
      return _results1;
    })();
    isEar = true;
    for (p = _j = 0, _len = polygon.length; _j < _len; p = ++_j) {
      n = polygon[p];
      if (__indexOf.call(ntriangle, n) >= 0) {
        continue;
      }
      if (!reflex[p]) {
        continue;
      }
      if (V2.withinTriangle(coords[n], tricoords[0], tricoords[1], tricoords[2])) {
        isEar = false;
        break;
      }
    }
    return isEar;
  };

  isReflexIndex = function(pcurr) {
    var a, b, c, pnext, pprev, _ref1;
    _ref1 = getNeighbors(pcurr), pprev = _ref1[0], pnext = _ref1[1];
    a = coords[polygon[pprev]];
    b = coords[polygon[pcurr]];
    c = coords[polygon[pnext]];
    return isReflexAngle(a, b, c);
  };

  slice = [];
  if (holes.length && holes[0].length >= 3) {
    for (p = _j = 0, _len = polygon.length; _j < _len; p = ++_j) {
      n = polygon[p];
      reflex.push(isReflexIndex(p));
    }
    hole = holes[0];
    slice = getSlice(hole);
    coords = coords.slice(0);
    holeStart = coords.length;
    for (_k = 0, _len1 = hole.length; _k < _len1; _k++) {
      h = hole[_k];
      coords.push(h);
    }
    newPolygon = [];
    i = (slice[0] + 1) % polygon.length;
    for (_ = _l = 0, _ref1 = polygon.length; 0 <= _ref1 ? _l < _ref1 : _l > _ref1; _ = 0 <= _ref1 ? ++_l : --_l) {
      newPolygon.push(polygon[i]);
      i = (i + 1) % polygon.length;
    }
    i = slice[1];
    for (_ = _m = 0, _ref2 = hole.length; 0 <= _ref2 ? _m < _ref2 : _m > _ref2; _ = 0 <= _ref2 ? ++_m : --_m) {
      newPolygon.push(holeStart + i);
      i = (i + 1) % hole.length;
    }
    newPolygon.push(newPolygon[polygon.length]);
    newPolygon.push(newPolygon[polygon.length - 1]);
    polygon = newPolygon;
  }

  convex = [];
  reflex = [];
  reflexCount = 0;
  for (p = _n = 0, _len2 = polygon.length; _n < _len2; p = ++_n) {
    n = polygon[p];
    if (isReflexIndex(p)) {
      reflex.push(true);
      reflexCount = reflexCount + 1;
    } else {
      reflex.push(false);
      convex.push(p);
    }
  }

  ears = [];
  for (_o = 0, _len3 = convex.length; _o < _len3; _o++) {
    p = convex[_o];
    if (checkEar(p)) {
      ears.push(p);
    }
  }

  verbose = false;
  if (verbose) {
    console.info("");
    console.info("ears    " + ears);
    console.info("reflex  " + reflex);
    console.info("convex  " + convex);
  }

  triangles = [];
  while (polygon.length > 0) {
    pcurr = ears.pop();
    watchdog = watchdog - 1;
    _ref3 = getNeighbors(pcurr), pprev = _ref3[0], pnext = _ref3[1];
    ptriangle = [pprev, pcurr, pnext];
    ntriangle = (function() {
      var _len4, _p, _results1;
      _results1 = [];
      for (_p = 0, _len4 = ptriangle.length; _p < _len4; _p++) {
        p = ptriangle[_p];
        _results1.push(polygon[p]);
      }
      return _results1;
    })();
    triangles.push(ntriangle);
    polygon.splice(pcurr, 1);
    reflex.splice(pcurr, 1);
    for (i = _p = 0, _len4 = ears.length; _p < _len4; i = ++_p) {
      p = ears[i];
      if (p > pcurr) {
        ears[i] = ears[i] - 1;
      }
    }
    if (pnext > pcurr) {
      pnext = pnext - 1;
    }
    if (pprev > pcurr) {
      pprev = pprev - 1;
    }
    _ref4 = [pprev, pnext];
    for (_q = 0, _len5 = _ref4.length; _q < _len5; _q++) {
      neighbor = _ref4[_q];
      if (reflex[neighbor] && (!isReflexIndex(neighbor))) {
        reflex[neighbor] = false;
        reflexCount = reflexCount - 1;
      }
      if (!reflex[neighbor]) {
        isEar = checkEar(neighbor);
        earIndex = ears.indexOf(neighbor);
        wasEar = earIndex !== -1;
        if (isEar && !wasEar) {
          ears.push(neighbor);
        } else if (!isEar && wasEar) {
          ears.splice(earIndex, 1);
        }
      }
    }
  }
  return triangles;
};
