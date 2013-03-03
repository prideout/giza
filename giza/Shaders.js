var GIZA = GIZA || {};

// Use the supplied JSON metadata to fetch GLSL, compile it, bind
// attributes, and finally link it into a program object.
GIZA.compile = function(shaders) {
  var programs = {};
  for (var name in shaders) {
    var shd = shaders[name];
    programs[name] = GIZA.compileProgram(shd.vs, shd.fs, shd.attribs);
  }
  return programs;
};

GIZA.compileProgram = function(vNames, fNames, attribs) {
  var gl = GIZA.context;
  var vShader = GIZA.compileShader(vNames, gl.VERTEX_SHADER);
  var fShader = GIZA.compileShader(fNames, gl.FRAGMENT_SHADER);
  var program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  for (key in attribs) {
    value = attribs[key];
    gl.bindAttribLocation(program, value, key);
  }
  gl.linkProgram(program);
  var status = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!status) {
    console.error("Could not link " + vNames + " with " + fNames);
  }
  var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (var i = 0; i < numUniforms; i++) {
    var name = gl.getActiveUniform(program, i).name;
    program[name] = gl.getUniformLocation(program, name);
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
  var status = gl.getShaderParameter(shaderObject, gl.COMPILE_STATUS);
  if (!status) {
    console.error('GLSL error in ' + ids + ':\n' +
                  gl.getShaderInfoLog(shaderObject));
  }
  return shaderObject;
};
