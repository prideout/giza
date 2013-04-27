# To Be Done List

- doc ideas
 - http://capmousse.github.io/include.js/
 - http://socket.io/#home
 - http://wbpreview.com/previews/WB0K943X5/
 - consider purchase of [this image](http://www.shutterstock.com/pic-89787958/stock-vector-egyptian-pyramids-with-camels-at-sunrise.html
)
 - or, just Simonetta or Macondo from google fonts

- BufferView has alignment restrictions that are overkill (eg, can't create a 28-byte vertex format if there's a vec2 in there)

- BufferView takes a dictionary, which is wrong.  Should be an array because order is significant.

- See monarchy demo and figure out how to do something like this in Utility.js.
  Let's keep BufferView free of GL.

  this.enableAttribs = function(attribs, gl) {
    gl = gl || GIZA.context;
    var glTypes = {
      Float32Array: gl.FLOAT,
      Uint16Array: gl.UNSIGNED_SHORT
    };
    for (var key in attribs) {
      if (key in desc) {
        var arrayType = desc[key][0];
        var normalize = false;
        gl.enableVertexAttribArray(attribs[key]);
        gl.vertexAttribPointer(
          attribs[key],
          this.dims[key],
          glTypes[arrayType],
          normalize,
          this.elementSize,
          this.offsets[key]);
      }
    }
  };

  this.disableAttribs = function(attribs, gl) {
    gl = gl || GIZA.context;
    for (var key in attribs) {
      if (key in desc) {
        gl.disableVertexAttribArray(attribs[key]);
      }
    }
  };
  
- a build/minify system that uses jslint and minification
   - 2 space indention
   - ' over "
   - function expressions over declarations
    
 - write some rst docs like [this](http://vimalkumar.in/sphinx-themes/solar/html/index.html)
    
- PolygonTess
  - degenerate triangle
  - Move eval into a worker?
- Rewrite a portion (or all) of my Knot Browser with giza.
- Turntable: Spin inertia with physical mouse doesn't work.
  I think we can implement something robust by computing an average velocity:
  Keep around a small history of (time,spin,tilt) samples, taken during the drawHook.
- Combine Turtle and Path; use SVG [Path.getPointAtLength](http://stackoverflow.com/questions/12253855/svg-path-getpointatlength-returning-wrong-values)
- Turntable
  - HomePosition
  - Pan / Zoom (similar to tdsview controls)
- manipulators, BEAUTIFUL [docs](http://folyo.me/), fresnel/marble spiral horn
- test & impl rotateAxis and scale in Matrix4
    
- "strict" mode?

