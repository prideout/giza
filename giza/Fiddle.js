// Fiddle.js
//
// This isn't part of the Giza core; it's a utility that makes it
// easier to use Giza from jsfiddle.com.  First, define two global
// functions in your fiddle:
//
// init = function(gl) { ... };
// draw = function(gl, time) { ... };
//
// Next, add this to the bottom of your fiddle:
//
// $.getScript('http://github.prideout.net/giza/Fiddle.js');
//
// And you're done!

var cdn = 'http://ajax.cdnjs.com/ajax/libs';
$.getScript(cdn + '/require.js/2.1.4/require.min.js', function() {

  var gizapath = 'http://github.prideout.net/giza/';

  var scripts = [
    gizapath + 'Giza.js',
    gizapath + 'Utility.js',
    gizapath + 'Animation.js',
    gizapath + 'Shaders.js',
    gizapath + 'BufferView.js',
    gizapath + 'Vector.js',
    gizapath + 'Matrix.js',
    gizapath + 'Color.js',
    gizapath + 'Topo.js',
    gizapath + 'Polygon.js',
    gizapath + 'Surface.js',
    gizapath + 'Path.js',
    gizapath + 'Mouse.js',
    gizapath + 'Turntable.js',
  ];

  require.config({
    urlArgs: "bust=" + (new Date()).getTime()
  });

  require(scripts, function() {

    var gl = GIZA.init();

    M4 = GIZA.Matrix4;
    M3 = GIZA.Matrix3;
    V2 = GIZA.Vector2;
    V3 = GIZA.Vector3;
    V4 = GIZA.Vector4;
    compile = GIZA.compile;

    init(gl);

    var wrapped = function(time) {
      draw(gl, time);
    };

    GIZA.animate(wrapped);
  });

});
