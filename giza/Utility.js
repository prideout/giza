var GIZA = GIZA || {};

/**
  * Flattens a list-of-lists into a single list.
  *
  * @param {array} array - Nested Javascript array.
  * @returns {array} Flattened Javascript array.
  */
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

/**
  * Flattens a list-of-vectors into a pre-allocated array.
  *
  * @param src    {array-of-arrays} - Input source.
  * @param dst    {array} - Destination to be populated with the flattened data.
  * @param offset {integer} - Optional starting index (defaults to 0)
  * @returns {integer} Ending index (i.e., `offset` + number of copied elements)
  */
GIZA.flattenTo = function(src, dst, offset) {
  offset = offset || 0;
  for (var i = 0; i < src.length; i++) {
    for (var j = 0; j < src[i].length; j++) {
      dst[offset++] = src[i][j];
    }
  }
  return offset;
};

/**
  * String interpolation.
  *
  * @param template {string}  - Pattern string with curly braces around each key.
  * @param context  {object}  - Key-value pairs to replace.
  * @returns {string} Evaluated template string.
  *
  * This is Douglas Crockford's "supplant" function -- it's just a simple templating function.
  */
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

/**
  * Copy all (or some) attributes from b into a.
  *
  * @param dst {object}    - Destination object.
  * @param src {object}    - Source object.
  * @param fields {list} - List of property names to copy.  Defaults to all.
  * @returns {object} dst
  */
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

/**
  * Create a shallow clone of an object or array.
  *
  * @param obj {object}
  * @returns {object}
  */
GIZA.clone = function(obj) {
  var isObject = function(obj) {
    return obj === Object(obj);
  };
  if (!isObject(obj)) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.slice();
  }
  return GIZA.merge({}, obj);
};

/**
  * Extract a list of attributes from the given object,
  * and use them to form a new object.
  *
  * @param object {object}
  * @param fields {array-of-string}
  * @returns {object}
  */
GIZA.extract = function(object, fields) {
  var retval = {};
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    retval[field] = object[field];
  }
  return retval;
};

/**
  * Aggregate a list of typed arrays by pre-allocating a giant array
  * and blitting into it.
  *
  * @param arrays {list-of-typed-arrays} List of typed arrays to combine.
  * @param destType {type} Constructor for the new typed array (e.g., `Uint8Array`)
  * @returns {TypedArray}
  */
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

/**
  * Combine a list of ArrayBuffer objects into a single ArrayBuffer,
  * interleaving the elements.
  *
  * The total number of bytes in each source array must be evenly
  * divisble by `elementSize`.
  *
  * @param arrays {list-of-typed-arrays} List of typed arrays to combine.
  * @param elementSize {integer} Number of bytes per element.
  * @returns {ArrayBuffer}
  */
GIZA.interleaveBuffers = function(arrays, elementSize) {
  var elementCount = null;

  var totalSize = arrays.reduce(function(prev, curr) {
    var count = curr.byteLength / elementSize;
    if (count != Math.floor(count)) {
      console.error(
        'interleaveBuffers has a badly-sized input: ' +
          curr.length + ' / ' + elementSize);
      return;
    }
    if (elementCount != null && count != elementCount) {
      console.error(
        'interleaveBuffers has inconsistent inputs: ' +
          elementCount + ', ' + count);
      return;
    }
    elementCount = count;
    return prev + curr.byteLength;
  }, 0);

  var dest = new ArrayBuffer(totalSize);
  var destBytes = new Uint8Array(dest);
  var destOffset = 0, srcOffset = 0;
  for (var e = 0; e < elementCount; e++) {
    arrays.forEach(function(src) {
      var element = new Uint8Array(src, srcOffset, elementSize);
      destBytes.set(element, destOffset);
      destOffset += elementSize;
    });
    srcOffset += elementSize;
  }

  return dest;
};

/**
  * Similar to jQuery's get function, except that dataType can be
  * either "binary" or "json".
  *
  * @param url {string} Path to file.
  * @param successFunc {function} Callback that receives the `ArrayBuffer` or JSON object.
  * @param dataType {string} Either `json` or `binary`.
  * @param errorFunc {function} Optional callback passed to the `onerror` member of `XMLHttpRequest`.
  */
GIZA.download = function(url, successFunc, dataType, errorFunc) {
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
  xhr.onerror = errorFunc;
  xhr.send(null);
};

/**
  * Generate a PNG image from the `canvas` associated with the current
  * GIZA context.
  *
  * @param url {string} Path to file.
  * @returns {string} URL to image blob.
  */
GIZA.grabCanvas = function() {
  var url = GIZA.canvas.toDataURL("image/png");
  window.open(url, '_blank');
  window.focus();
  return url;
};
