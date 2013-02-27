var GIZA = GIZA || {};

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
      console.error("GIZA.BufferView is not aligned properly.");
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
    return retval;
  };

};
