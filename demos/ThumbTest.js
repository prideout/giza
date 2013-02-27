var main = function() {

  COMMON.initMultiple([
    {
      canvasId: 'canvas1',
      scriptUrl: 'ParametricSurf.js',
      lazy: true,
    },
    {
      canvasId: 'canvas2',
      scriptUrl: 'BasicLighting.js',
      lazy: true,
    }
  ]);

};
