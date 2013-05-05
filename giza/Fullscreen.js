vendors = [null, 'webkit', 'apple', 'moz', 'o', 'xv', 'ms', 'khtml', 'atsc', 'wap', 'prince', 'ah', 'hp', 'ro', 'rim', 'tc'];

vendorName = function(name, vendor) {
  if (vendor === null) {
    return name;
  } else {
    return vendor + name[0].toUpperCase() + name.substr(1);
  }
};

getVendorAttrib = function(obj, name, def) {
  var attrib, attrib_name, vendor, _i, _len;
  if (obj) {
    for (_i = 0, _len = vendors.length; _i < _len; _i++) {
      vendor = vendors[_i];
      attrib_name = vendorName(name, vendor);
      attrib = obj[attrib_name];
      if (attrib !== void 0) {
        return attrib;
      }
    }
  }
  return def;
};

document.fullscreenEnabled = getVendorAttrib(document, 'fullscreenEnabled');

document.cancelFullscreen = getVendorAttrib(document, 'cancelFullScreen');

GIZA.requestFullscreen = function(el) {
  if (el == null) {
    el = this.canvas;
  }
  if (el.mozRequestFullScreen) {
    el.mozRequestFullScreen();
  } else if (el.webkitRequestFullScreen) {
    el.webkitRequestFullScreen();
  } else if (el.oRequestFullScreen) {
    el.oRequestFullScreen();
  }
};

GIZA.isFullscreen = function() {
  var a, b;
  a = getVendorAttrib(document, 'fullscreenElement');
  b = getVendorAttrib(document, 'fullScreenElement');
  return (a || b);
};

GIZA.onFullscreenChange = function(fun) {
  var callback, vendor, _i, _len,
  _this = this;
  callback = function() {
    return fun(_this.isFullscreen());
  };
  for (_i = 0, _len = vendors.length; _i < _len; _i++) {
    vendor = vendors[_i];
    document.addEventListener(vendor + 'fullscreenchange', callback, false);
  }
};

GIZA.exitFullscreen = function() {
  document.cancelFullscreen();
};

GIZA.toggleFullscreen = function(el) {
  el = el || this.canvas;
  if (this.isFullscreen()) {
    return this.exitFullscreen();
  }
  return this.requestFullscreen(el);
};
