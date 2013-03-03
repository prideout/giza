var GIZA = GIZA || {};

// Use the supplied JSON metadata to fetch GLSL, compile it, bind
// attributes, and finally link it into a program object.
GIZA.compile = function(shaders) {
  var name, programs, shd;
  programs = {};
  for (name in shaders) {
    shd = shaders[name];
    programs[name] = GIZA.compileProgram(shd.vs, shd.fs, shd.attribs);
  }
  return programs;
};

GIZA.compileProgram = function(vNames, fNames, attribs) {
  var fShader, key, numUniforms, program, status, u, uniforms, vShader, value, _i, _len;
  var gl = GIZA.context;
  vShader = GIZA.compileShader(vNames, gl.VERTEX_SHADER);
  fShader = GIZA.compileShader(fNames, gl.FRAGMENT_SHADER);
  program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  for (key in attribs) {
    value = attribs[key];
    gl.bindAttribLocation(program, value, key);
  }
  gl.linkProgram(program);
  status = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!status) {
    console.error("Could not link " + vNames + " with " + fNames);
  }
  numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  uniforms = (function() {
    var _i, _results;
    _results = [];
    for (u = _i = 0; 0 <= numUniforms ? _i < numUniforms : _i > numUniforms; u = 0 <= numUniforms ? ++_i : --_i) {
      _results.push(gl.getActiveUniform(program, u).name);
    }
    return _results;
  })();
  for (_i = 0, _len = uniforms.length; _i < _len; _i++) {
    u = uniforms[_i];
    program[u] = gl.getUniformLocation(program, u);
  }
  return program;
};

GIZA.compileShader = function(ids, type) {
  var gl = GIZA.context;
  var sourceText = "";
  for (var i = 0; i < ids.length; i++) {
    var e = document.getElementById(ids[i]);
    if (!e) {
      console.error('Cannot find shader string named ' + id);
    } else {
      sourceText += e.innerHTML;
    }
  }
  var shaderObject = gl.createShader(type);
  gl.shaderSource(shaderObject, sourceText);
  gl.compileShader(shaderObject);
  status = gl.getShaderParameter(shaderObject, gl.COMPILE_STATUS);
  if (!status) {
    console.error('GLSL error in ' + ids + ':\n' +
                  gl.getShaderInfoLog(shaderObject));
  }
  return shaderObject;
};
