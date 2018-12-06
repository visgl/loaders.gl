# loaders.gl

A suite of framework-independent loaders (i.e. parsers) for 3D geometries and assets, as well as geospatial formats.

> In spite of the name loaders.gl, this itself does not have any WebGL dependencies. It does however load data in a way that is optimized for use with WebGL.


## Overview

loaders.gl is effectively an effort to collect the best loaders created by the open source community and package them in a standardized, framework-independent way.

Thus, the source code for these loaders is often based directly on open source loaders from other WebGL frameworks like THREE.js or individual github repos. Sometimes the core parsing is delegated to an installed npm module, and loaders.gl just provides a thin adaptor. Naturally, some loaders have been developed from scratch for loaders.gl.

* **Loaders** - The core functionality is a set of loaders (parsers) for various major geometry formats.

* **Encoders** - In addition encoders (or writers) for selected key formats to support saving data.

* **Compression** - loaders.gl includes some encoder/decoder pairs that provide specialized compression/decompression support (e.g. [DRACO](https://google.github.io/draco/) compression).

* **Utilities** - Since the loaders and writers themselves only implement parsing and encoding (typically from strings or array buffers), i.e. they don't actually "load" or "save" any data, loaders.gl also provides a set of optional utility functions that perform actual loading from files, urls etc.


## Main Features

**Framework Agnosticism** - There is a wide range of excellent loaders for 3D formats available as open source under MIT license. However, many of these loaders were created for a specific 3D framework (e.g. THREE.js) and are not immediately usable outside of that framework.

**Standard Format** - All 3D asset loaders return a "standardized" JavaScript objects with a header key-value map and a map of typed arrays representing binary data attributes. The binary attributes can be uploaded directly to GPU buffers and used for rendering or GPGPU calculations.

**Data Normalization** - Especially for geospatial formats, the raw loaded data can have a lot of variations (e.g. `[lng, lat]` vs `{lat, lng}`). loaders.gl offers `normalize` options that lets your application work with data in a more consistent format across multiple loaders.

**Loader Metadata** - Loaders are exported as objects that include metadata such as the name of the loader, the default extension, an optional test function and of course the parser function for the format.

**Separates Parsing from Loading** - Applications can take full control of how data is requested/loaded and still use loader.gl's parsers.

**Optimized for Tree Shaking** - Each loader's metadata object is an independent named export, meaning that any loaders not explicitly imported by the application will be removed from the application bundle during tree-shaking.

**Works both Browsers and Node.js** - TextEncoder polyfills? ArrayBuffers vs Buffers? All has been taken care of.

**Permissive Licenses** - Loaders in `loaders.gl` have permissive licenses. No commercial or copy-left requirements.


## Feature Roadmap

**Off-thread parsing support** - Off thread parsing is an obvious optimization however it has some major complications that often eat up any performance gains: and serialization/deserialization overhead. loaders.gl is designed to avoid serialization through direct transfer of typed arrays.

**Loader Worker Thread Pool** - Another performance "killer" for worker threads is multi-second startup time. loaders.gl exports an optional "loader worker manager" class that can help keep a loader thread pool loaded and primed and ready to start off-thread parsing as soon as data arrives on the wire.

**Progress Tracking** - loaders can provide progress callbacks and a `ProgressTracker` class is provided to track the progress of a set of parallel loads.

**Format Auto-Discovery** - Each loader can optionally expose a test function that can examine the "head" of a file to test if it is likely to be in a format this loader will be able to parse.

**Test Data** - Ideally loaders.gl will include test data for each format to ensure that the regression suite is as effective as possible.


## Format Roadmap

The emergence of glTF as a major Khronos standard with the ensuing massive industry adoption is a huge deal for the WebGL/3D community. The need to support long list of obscure loaders for e.g. various 3D asset authoring packages is quickly becoming a thing of the past as most major applications have started to offer high-quality, maintained glTF exporters.

Obviously we expect loaders.gl to have very solid glTF/GLB support. Also we will most likely not try to pursue "competing" scene/mesh description formats.

Still, for special data sets such as large point clouds or complex geospatial data, the need for special formats for (e.g. compactness or expressivity) is unchanged, so this is the direction we expect most new loaders.gl loaders to focus on.

Finally, some "unusual" loaders may be included just for the fun of it, e.g. SVG tesselation.


## Licenses

loaders.gl contains a collection of MIT licensed loaders. Each loader comes with its own license, so if the distinction matters to you, please check and decide accordingly. However, loaders.gl will not include any loaders with commercial or copy-left licenses.


## Credits and Attributions

loaders.gl is to a large extent just a simple curation and repackaging of the superb work done by many others in the open source community. We want to, and try to be as explicit as we can about the origins and attributions of each loader. Even though we try, sometimes we may not have based the code in loaders.gl on the original source, and we may not have a clear picture of the full history of the code we are reusing. If you feel that we have missed something, or that we could do better in this regard, please let us know.

Also check each loader directory for additional details, we strive to keep intact any comments inside the source code relating to authorship and contributions.


## Contributions

Warmly welcomed, as long as they are reasonably aligned with the goals and principles outlined above.
