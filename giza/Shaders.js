var GIZA = GIZA || {};

/**
 * Reads a JSON "shader spec" and fetches GLSL, compiles it, binds
 * attributes, and finally links it into a program object.
  *
  * @param {object} shaderSpecs - Maps from program names to shader specs, where each shader spec is an object with the following keys:
  * - **vs** List of DOM ids for elements that contain vertex shader source code.  These sources get concatenated together.
  * - **fs** List of DOM ids for elements that contain fragment shader source code.  These sources get concatenated together.
  * - **attribs** *(optional)* Maps from vertex attribute strings to integer slots.  If unspecified, the "global" attributes are used below.
  * @param {object} attribs - Optional global vertex attributes.  Maps from vertex attribute strings to integer slots, for all programs.
  * @returns {object} Mapping between program names and `WebGLProgram` objects.
 */
GIZA.compile = function(shaders, attribs) {
  var programs = {};
  for (var name in shaders) {
    var shd = shaders[name];
    programs[name] = GIZA.compileProgram(shd.vs, shd.fs, shd.attribs || attribs);
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
    if (typeof ids[i] == "function") {
      sourceText += ids[i].toString().
        replace(/^[^\/]+\/\*!?/, '').
        replace(/\*\/[^\/]+$/, '');
      continue;
    }
    var e = document.getElementById(ids[i]);
    if (!e) {
      console.error('Cannot find shader string named ' + ids[i]);
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
