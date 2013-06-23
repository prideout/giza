var GIZA = GIZA || {};

// Utility class to manage interleaved data.
GIZA.BufferView = function(desc) {

  // Allow clients to skip the "new"
  if (!(this instanceof GIZA.BufferView)) {
    return new GIZA.BufferView(desc);
  }

  // First populate the offsets and lengths.
  this.offsets = {};
  this.dims = {};
  var offset = 0;
  for (var key in desc) {
    var arrayType = desc[key][0];
    var arrayDim = desc[key][1];
    var size = arrayDim * arrayType.BYTES_PER_ELEMENT;
    this.offsets[key] = offset;
    this.dims[key] = arrayDim;
    offset += size;
  }
  this.elementSize = offset;

  // Now compute a stride for each attribute.
  this.strides = {};
  for (var key in desc) {
    var arrayType = desc[key][0];
    var stride = this.elementSize / arrayType.BYTES_PER_ELEMENT;
    if (stride != Math.floor(stride)) {
      console.error("BufferView alignment error: '" + key + "' is " +
                    arrayType.BYTES_PER_ELEMENT + " bytes but element size is " +
                    this.elementSize + " bytes.");
    }
    this.strides[key] = stride;
  };

  // Populate the typed views.
  this.setArray = function(arrayBuffer) {
    this.numElements = arrayBuffer.byteLength / this.elementSize;
    this.typedArrays = {};
    for (var key in desc) {
      var arrayType = desc[key][0];
      this.typedArrays[key] = new arrayType(arrayBuffer, this.offsets[key]);
    }
  };

  // Create an array that can accommodate the specified element count.
  this.makeBuffer = function(elementCount) {
    var elementArray = new ArrayBuffer(elementCount * this.elementSize);
    this.setArray(elementArray);
    return elementArray;
  };

  // Create an iterator that can be used in a while loop via its
  // "next" method.  If the iterator is constructed without a
  // specified field, the next method returns the entire element.
  // Otherwise the specified field is extracted.
  this.iterator = function(field) {
    var bufferView = this;
    return {
      index: 0,
      clone: function() {
        var it = bufferView.iterator(field);
        it.index = this.index;
        return it;
      },
      next: function() {
        if (this.index >= bufferView.numElements) {
          return null;
        }
        var element = bufferView.getElement(this.index++);
        return field ? element[field] : element;
      }
    };
  };

  // Provide an object constructor.
  this.getElement = function(elementIndex) {
    retval = {};
    for (var key in desc) {
      var index = elementIndex * this.strides[key];
      retval[key] = this.typedArrays[key].subarray(
        index, index + this.dims[key]);
    }
    retval.set = function(values) {
      for (var key in values) {
        if (!(key in desc)) {
          continue;
        }
        var val = values[key];
        if (Array.isArray(val)) {
          retval[key].set(val);
        } else {
          retval[key][0] = val;
        }
      }
    };
    return retval;
  };

};
