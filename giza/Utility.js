var GIZA = GIZA || {};

// Flattens a list-of-lists into a single list.  Doesn't go any deeper.
GIZA.flatten = function(array) {
    var element, flattened, _i, _len;
    flattened = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      element = array[_i];
      if (element instanceof Array) {
        flattened = flattened.concat(GIZA.flatten(element));
      } else {
        flattened.push(element);
      }
    }
    return flattened;
};

// Flattens a list-of-vectors into a pre-allocated typed array.
GIZA.flattenTo = function(src, dst, offset) {
  offset = offset || 0;
  for (var i = 0; i < src.length; i++) {
    for (var j = 0; j < src[i].length; j++) {
      dst[offset++] = src[i][j];
    }
  }
  return offset;
};

// String interpolation -- this is Douglas Crockford's "supplant" function.
GIZA.format = function (s, o) {
  return s.replace(
      /{([^{}]*)}/g,
    function (a, b) {
      var r = o[b];
      return typeof r === 'string' ||
        typeof r === 'number' ? r : a;
    }
  );
};

// Copy all (or some) attributes from b into a.
GIZA.merge = function (a, b, fields) {
  if (fields) {
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      a[field] = b[field];
    }
    return a;
  }
  for (var attrname in b) {
    a[attrname] = b[attrname];
  }
  return a;
};

// Extract a list of attributes from the given object,
// and use them to form a new object.
GIZA.extract = function(object, fields) {
  var retval = {};
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    retval[field] = object[field];
  }
  return retval;
};

// Aggregate a list of typed arrays by pre-allocating a giant array
// and blitting into it.
GIZA.joinBuffers = function(arrays, destType) {
  destType = destType || arrays[0].constructor;
  var totalSize = arrays.reduce(function(prev, curr) {
    return prev + curr.length;
  }, 0);
  var dest = new destType(totalSize);
  var offset = 0;
  for (var i = 0; i < arrays.length; i++) {
    dest.set(arrays[i], offset);
    offset += arrays[i].length;
  }
  return dest;
};

// Kinda like jQuery's get function, except that dataType can be
// either "binary" or "json".
GIZA.download = function(url, successFunc, dataType) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  if (dataType == 'json') {
    var onloadFunc = function() {
      if (xhr.responseText) {
        successFunc(JSON.parse(xhr.responseText));
      }
    };
  } else {
    xhr.responseType = 'arraybuffer';
    var onloadFunc = function() {
      if (xhr.response) {
        successFunc(xhr.response);
      }
    };
  }
  xhr.onload = onloadFunc;
  xhr.send(null);
};

// Take a screenshot of the canvas and open it in a new tab.
GIZA.grabCanvas = function () {
  var url = GIZA.canvas.toDataURL("image/png");
  window.open(url, '_blank');
  window.focus();
  return url;
};
