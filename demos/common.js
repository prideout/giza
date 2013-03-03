var COMMON = (function (common) {

  // If the Giza path wasn't specified, assume it's a sibling.
  var gizapath = common.gizapath || "../giza/";

  // Path to a content delivery network for jQuery etc.
  var cdn = "http://ajax.googleapis.com/ajax/libs/";

  // Actually, don't use a CDN just yet while we're developing.
  var cdn = "lib/";

  // Strip off the .html extension from the URL.
  var basepath = window.location.toString().slice(0, -5)

  // Extract the name of the recipe from the basepath.
  var recipe = basepath.split('/').pop();

  // After Giza has a build process in place, we'll replace the
  // following source list with a single minified file.
  common.scripts = [
    gizapath + "Giza.js",
    gizapath + "Utility.js",
    gizapath + "Animation.js",
    gizapath + "Shaders.js",
    gizapath + "BufferView.js",
    gizapath + "Vector.js",
    gizapath + "Matrix.js",
    gizapath + "Color.js",
    gizapath + "Topo.js",
    gizapath + "Polygon.js",
    gizapath + "Surface.js",
    gizapath + "Path.js",
    gizapath + "Mouse.js",
    gizapath + "Turntable.js",
    cdn + "jquery/1.8.0/jquery.min.js",
    cdn + "jqueryui/1.9.2/jquery-ui.min.js",
    basepath + ".js"
  ];

  // In Chrome, Cmd+Shift+R will reload with cache.
  // This seems to help too.
  var prefix = "http://localhost";
  if (basepath.substring(0, prefix.length) == prefix) {
    console.log("Busting cache.");
    require.config({
      urlArgs: "bust=" + (new Date()).getTime()
    });
  }

  return common;

}(COMMON || {}));

// After all scripts have been loaded AND after the document is
// "Ready", do this:
require(COMMON.scripts, function() {

  // Execute the recipe's main() function
  main();

  var canvas = GIZA.canvas;

  // For now use a local copy of highlightjs instead of a CDN.
  var hljsurl = "http://yandex.st/highlightjs/7.3/highlight.min.js";
  var hljsurl = "lib/highlight.min.js";

  // Download highlightjs and provide buttons for it
  $.getScript(hljsurl, function() {

    // Add some links into the button-bar element
    var slash = document.URL.lastIndexOf("/");
    var recipe = document.URL.slice(slash+1, -4);
    var index = "index.html";
    $('#button-bar').html([
      "<a href='" + index + "'>",
      "    go to recipe list",
      "</a>",
      "<button id='view-html'>",
      "    view HTML source",
      "</button>",
      "<button id='view-js'>",
      "    view JavaScript source",
      "</button>",
    ].join('\n'));

    // Define a generic click handler for the "view source" buttons.
    var clickHandler = function(id, lang) {
      return function(src) {
        var inner = hljs.highlight(lang, src).value;
        $('body').html("<pre>" + inner + "</pre>");
        window.location = '#' + id;
        $(window).bind('hashchange', function(e) {
          if (window.location.hash == "") {
            $(window).unbind('hashchange');
            window.location.reload();
          }
        });
      };
    };

    // Assign the click handlers.
    var base = document.URL.slice(0, -4);
    $('#view-js').button().click(function() {
      $.get(base + 'js', clickHandler(this.id, 'javascript'));
    });
    $('#view-html').button().click(function() {
      $.get(base + 'html', clickHandler(this.id, 'xml'));
    });

    // Tell jQueryUI to style the links as buttons
    $("a").button()

  });

});

// Simple texture loader for point sprite textures etc.
COMMON.loadTexture = function (filename, onLoaded) {

  var gl = GIZA.context;
  var tex = gl.createTexture();
  tex.image = new Image();
  tex.image.onload = function() {

    // clear out the GL error state to appease Safari
    gl.getError();

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);

    if (gl.getError() != gl.NO_ERROR) {
      console.error('GL error when loading texture');
    }
    return onLoaded(tex);
  };
  return tex.image.src = filename;
};

// If you wish the store your shaders in a separate HTML file,
// include this at the bottom of your main page body:
//
//   <iframe src="ResizeTest-Shaders.html" width="0" height="0" />
//
// This function will extract the spec and attribs for you.
COMMON.initFrame = function() {
  eval($('iframe').contents().find('#shaders').text());
  COMMON.programs = GIZA.compile(spec);
  COMMON.attribs = attribs;
};

// If you have a div with radio buttons inside, this function will
// synchronize a given dictionary of attributes to the radio button
// states.  For example:
//
//  var options = {};
//  COMMON.syncOptions(options, '#checks');
//
COMMON.bindOptions = function(options, divid) {
  var updateOptions = function() {
    $(divid + " > input").each(function() {
      var id = $(this).attr('id');
      var checked = $(this).attr('checked') ? true : false;
      options[id] = checked;
    });
  };
  updateOptions();
  $(divid).buttonset().change(function() {
    updateOptions();
  });

  // Avoid flash of unstyled content:
  $(divid).buttonset().css({visibility: 'visible'});
};

// Create an event handler that listens for a chosen screenshot key,
// which is 's' if unspecified.  When pressed, a new tab opens with
// the PNG image.
COMMON.enableScreenshot = function(drawFunc, triggerKey) {
  triggerKey = triggerKey || 83;
  $(document).keydown(function(e) {
    if (e.keyCode == triggerKey) {
      GIZA.grabCanvas();
    }
  });

};

COMMON.initMultiple = function(canvasList) {
  var global = Function('return this')();
  canvasList.forEach(function(session) {
    $.getScript(session.scriptUrl, function() {

      // Select the chosen canvas element for GIZA.init, and execute
      // the entry point function for the canvas.
      GIZA.startCanvas = document.getElementById(session.canvasId);
      global[session.entryFunction || 'main']();
      
      // If the canvas opts for "lazy" animation, then it pauses when
      // the mouse leaves, and resumes when the mouse enters.
      if (session.lazy) {
        var gizaContext = GIZA.currentGizaContext;
        var canvas = $(GIZA.startCanvas);
        var resume = function() {
          GIZA.setGizaContext(gizaContext);
          GIZA.resume();
        };
        canvas.mouseenter(resume);
        canvas.mousemove(resume);
        canvas.mouseleave(function() {
          GIZA.setGizaContext(gizaContext);
          GIZA.pause();
        });
        GIZA.pause();
      }

    });
  });
};
