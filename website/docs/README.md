# Introduction

loaders.gl is suite of portable, framework-independent loaders (parsers) and writers (encoders). The suite including loaders for 3D point clouds, geometries, 3D assets, geospatial formats as well as tabular data.

In spite of the name, loaders.gl does not have any WebGL dependencies, however the format of data returned by various loaders is optimized for use with WebGL (e.g. by using typed arrays when possible, enabling data to be directly uploaded to the GPU without additional processing).

## Why loaders.gl?

The open source community has already created many excellent loaders for 3D and geospatial formats available under permissive licenses on github, npm and similar sources, and loaders.gl is an effort to collect some of the best of those and package them in a unified, portable, framework-independent way.

Many of these loaders were created for specific use cases (e.g. as part of a frameworks like THREE.js) and contain code that depend on use-case specific classes (e.g. a loader might be 90% framework independent work but end by creating a `THREE.Mesh`, meaning that the returned objects are not easoly usable in Javascript applications that don't use that framework).

In addition, the functionality offered by open source loaders can vary quite a bit:

- The API, where e.g. some loaders accept URLs and implements the loading themselves, and then return promises or take callbacks, others are synchronous and just parse already loaded data, leaving more flexibility (and work) to the application.
- Installation procedures can vary.
- The format of the parsed data is usually different, even when parsing very similar file formats. This makes it harder to write applications that can accept data from multiple similar formats (e.g. an app that can load point clouds in PCD, PLY, LAS, Draco formats would need to deal with the idiosynchracies of multiple loaders).
- Does the loader can run under both browser and Node.js and worker threads, or does it e.g. need to be "commented out" in Node-based unit tests?
- Does the loader support streaming?
- What options does the loader accept?
- How is error handling implemented.
- etc.

## Contents of Loaders.gl

- **Loaders** - The core functionality is a set of loaders (parsers) for various major geometry formats.

- **Writers** - A number of formats also provide writers (or encoders for selected key formats to support saving data.

- **Utilities** - Since the loaders and writers themselves only implement parsing and encoding (typically from strings or array buffers), i.e. they don't actually "load" or "save" any data, loaders.gl also provides a set of utility functions that accept loader objects perform actual loading from files, urls etc.

## Main Design Goals

Some of the key design goals for loaders.gl.

**Framework Agnosticism** - loaders.gl is not tied to any specific framework. They load data from supported file formats into clearly documented JavaScript data structures, but stops short of creating e.g. a `Mesh` object from loaded attributes. This means that in contrast to a number of other good open source loaders, loaders.gl can be used with any JavaScript framework or application.

**Unified Formats for Loaded Data** - All loaders in the same category return a "standardized" JavaScript object. For instance point cloud loaders use a header key-value map and a map of glTF2-style accessor objecs with typed arrays representing binary data attributes. This can significantly simplify applications that want to support multiple similar data formats.

**Binary Data** - Contiguous numeric arrays (e.g. mesh attributes) will be loaded using JavaScript typed arrays rather than native Arrays. Such binary arrays can be uploaded directly to GPU buffers and used for rendering or GPGPU calculations.

**Loader Objects** - Loaders are exported as objects that include metadata such as the name of the loader, the default extension, an optional test function and of course the parser function for the format. This allows applications to work with multiple loaders in a unified way, even allowing loaders.gl to automatically pick the right loader for a file.

**Optimized for Tree Shaking** - Each loader's metadata object is an independent named export, meaning that any loaders not explicitly imported by the application will be removed from the application bundle during tree-shaking.

**Works in Browsers, Worker Threads and Node.js** - TextEncoder polyfills? ArrayBuffers vs Buffers? Whether optimizing interactivity, working with isomorpic applications, writing test suites etc, you'll know that running loaders on worker threads and Node is supported.

## Licenses

loaders.gl currently contains a collection of MIT licensed loaders. Each loader comes with its own license, so if the distinction matters to you, please check and decide accordingly. However, loaders.gl will not include any loaders with non-permissive, commercial or copy-left licenses.

## Credits and Attributions

loaders.gl is to a large extent just a simple curation and repackaging of the superb work done by many others in the open source community. We want to, and try to be as explicit as we can about the origins and attributions of each loader. Even though we try, sometimes we may not have based the code in loaders.gl on the original source, and we may not have a clear picture of the full history of the code we are reusing. If you feel that we have missed something, or that we could do better in this regard, please let us know.

Also check each loader directory for additional details, we strive to keep intact any comments inside the source code relating to authorship and contributions.

## Support

loaders.gl is part of the vis.gl framework ecosystem, and was mainly created to support various frameworks and apps within these frameworks such as luma.gl and deck.gl, but is intentionally designed in a framework-agnostic way.

Our intention is for loaders.gl to work well on recent versions of the major evergreen browsers (Chrome, Firefox, Safari) and Node.js (v10+).

Assuming appropriate polyfills are installed, we also want loaders.gl to run on Edge, IE11 and Node.js v8.
