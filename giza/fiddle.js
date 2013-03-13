
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

  // In Chrome, Cmd+Shift+R will reload with cache.
  // This seems to help too.
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

    compile = function(uberspec) {
      var spec = {};
      for (var key in uberspec) {
        var shaders = uberspec[key].split(' ');
        var vs = [shaders[0]];
        var fs = [shaders[1]];
        spec[key] = { vs: vs, fs: fs, attribs: attribs};
      }
      return GIZA.compile(spec);
    };

    init(gl);

    var wrapped = function(time) {
      draw(gl, time);
    };

    GIZA.animate(wrapped);
  });

});
