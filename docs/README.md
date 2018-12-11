# loaders.gl

A suite of portable, framework-independent loaders (parsers) for 3D point clouds, geometries, assets and geospatial formats.


## Why loaders.gl?

There is today wide range of excellent open source loaders for 3D and geospatial formats available under MIT license on github and other places.

However, many of these loaders were created for specific 3D frameworks (e.g. THREE.js) and contains code that create framework specific classes (e.g. `THREE.Mesh`) meaning that the returned objects are not immediately usable in Javascript c.

In addition, the functionality offered by each loader can vary quite a bit, e.g. in terms of the format of data they output for similar file formats, and whether they run under both browser and Node.js and worker threads etc.

loaders.gl is an effort to collect the best loaders created by the open source community and package them in a standardized, portable, framework-independent way.


## Overview

* **Loaders** - The core functionality is a set of loaders (parsers) for various major geometry formats.

* **Encoders** - In addition encoders (or writers) for selected key formats to support saving data.

* **Compression** - loaders.gl includes some encoder/decoder pairs that provide specialized compression/decompression support (e.g. [DRACO](https://google.github.io/draco/) compression).

* **Utilities** - Since the loaders and writers themselves only implement parsing and encoding (typically from strings or array buffers), i.e. they don't actually "load" or "save" any data, loaders.gl also provides a set of optional utility functions that perform actual loading from files, urls etc.



## Main Features

**Framework Agnosticism** - loaders.gl is not tied to any specific framework. They load data from supported file formats into clearly documented JavaScript data structures, but stops short of creating e.g. a `Mesh` object from loaded attributes. This means that in contrast to a number of other good open source loaders, loaders.gl can be used with any JavaScript framework or application.

**Unified Formats for Loaded Data** - All loaders in the same category return a "standardized" JavaScript object. For instance point cloud loaders use a header key-value map and a map of glTF2-style accessor objecs with typed arrays representing binary data attributes. This can significantly simplify applications that want to support multiple similar data formats.

**Binary Data** - Contiguous numeric arrays (e.g. mesh attributes) will be loaded using JavaScript typed arrays rather than native Arrays. Such binary arrays can be uploaded directly to GPU buffers and used for rendering or GPGPU calculations.

**Loader Descriptors** - Loaders are exported as objects that include metadata such as the name of the loader, the default extension, an optional test function and of course the parser function for the format. This allows applications to work with multiple loaders in a unified way, even allowing loaders.gl to automatically pick the right loader for a file.

**Optimized for Tree Shaking** - Each loader's metadata object is an independent named export, meaning that any loaders not explicitly imported by the application will be removed from the application bundle during tree-shaking.

**Works both on Browsers and Node.js** - TextEncoder polyfills? ArrayBuffers vs Buffers? Whether working with isomorpic applications, writing test suites etc, it is always great to know that running under Node is supported.


## Advantages

Some secondary attributes of loaders in this framework:

**Separates Parsing from Loading** - Applications can take full control of how data is requested/loaded and still use loader.gl's parsers.

**Data Normalization** - Especially for geospatial formats, the raw loaded data can have a lot of variations (e.g. `[lng, lat]` vs `{lat, lng}`). loaders.gl offers `normalize` options that lets your application work with data in a more consistent format across multiple loaders.


## Licenses

loaders.gl currently contains a collection of MIT licensed loaders. Each loader comes with its own license, so if the distinction matters to you, please check and decide accordingly. However, loaders.gl will not include any loaders with non-permissive, commercial or copy-left licenses.


## Credits and Attributions

loaders.gl is to a large extent just a simple curation and repackaging of the superb work done by many others in the open source community. We want to, and try to be as explicit as we can about the origins and attributions of each loader. Even though we try, sometimes we may not have based the code in loaders.gl on the original source, and we may not have a clear picture of the full history of the code we are reusing. If you feel that we have missed something, or that we could do better in this regard, please let us know.

Also check each loader directory for additional details, we strive to keep intact any comments inside the source code relating to authorship and contributions.


## Support

loaders.gl are part of the vis.gl framework ecosystem, and were mainly created to support various frameworks and apps within these frameworks.


## Contributions

Warmly welcomed, as long as they are reasonably aligned with the goals and principles outlined above.
