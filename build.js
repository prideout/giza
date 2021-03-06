#!/usr/bin/env node

var gizapath = "./giza/";
var scripts = [
  gizapath + "Giza.js",
  gizapath + "Utility.js",
  gizapath + "Animation.js",
  gizapath + "Shaders.js",
  gizapath + "BufferView.js",
  gizapath + "Vector.js",
  gizapath + "Bounds.js",
  gizapath + "Matrix.js",
  gizapath + "Color.js",
  gizapath + "Topo.js",
  gizapath + "Polygon.js",
  gizapath + "Surface.js",
  gizapath + "Path.js",
  gizapath + "Mouse.js",
  gizapath + "Turntable.js",
  gizapath + "Fullscreen.js"
];

var UglifyJS = require("uglify-js");
var fs = require("fs");
var result = UglifyJS.minify(scripts);
fs.writeFileSync('giza.min.js', result.code);

var exec = require('child_process').exec;
exec("./node_modules/.bin/jsdoc -c docs/conf.json", {}, function(err, stdout, stderr) {
  console.log(stdout);
  console.error(stderr);
});
