
Giza.js
-------

**{@link GIZA.init}**
    Initializes the Giza library and returns the raw WebGL context.

Shaders.js
----------
**{@link GIZA.compile}**
    Fetches GLSL strings and builds them into program objects.

Utility.js
----------

**{@link GIZA.flatten}**
    Flattens a list-of-lists into a single list.

**{@link GIZA.flattenTo}**
    Flattens a list-of-vectors into a pre-allocated array.

**{@link GIZA.format}**
    Simple template string expansion.

**{@link GIZA.merge}**
    Copies properties from one object to another.

**{@link GIZA.clone}**
    Simple shallow copy.

**{@link GIZA.extract}**
    Creates a new object from a subset of properties.

**{@link GIZA.joinBuffers}**
    Combines a list of typed arrays.

**{@link GIZA.interleaveBuffers}**
    Combine a list of ArrayBuffer objects into a single ArrayBuffer, interleaving the elements.

**{@link GIZA.download}**
    Downloads an ArrayBuffer or JSON object from the given URL.

**{@link GIZA.grabCanvas}**
    Generates a PNG image from the current `canvas` element.

To Be Done Doc Tasks
--------------------

- add docstrings for everything in Animate.js
- GIZA.compile should support explicit strings -- DOM ids should only be used if the first token is #
- GIZA.compile needs usage examples (three ways of specifying strings)
- Vector / Matrix
- jsdoc for tutorials (use md suffix) http://usejsdoc.org/about-tutorials.html
- styling / templating https://github.com/jsdoc3/jsdoc/tree/master/templates
- if jsdoc is too complex, consider [jsdox](https://github.com/sutoiku/jsdox)
- http://orderedlist.com/modernist/
- Bower component and versioning.
