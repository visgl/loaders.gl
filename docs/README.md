# loaders.gl

A suite of portable, framework-independent loaders (parsers) and writers (encoders), including loaders for 3D point clouds, geometries, assets and geospatial formats. In spite of the name, loaders.gl does not have any WebGL dependencies, however the format of data returned by various loaders is optimized for use with WebGL.

> Note that loaders.gl is still a Work-in-Progress. We have chose to develop loaders.gl in the open because many of the loaders are already stable and useful, and we like to share direction and intentions around what we are building. You are welcome to use loaders.gl, but be aware that APIs and designs are still being fine-tuned.



## Why loaders.gl?

There are many excellent open source loaders for 3D and geospatial formats available under MIT license on github etc.

However, many of these loaders were created for specific frameworks (e.g. THREE.js) and contain code that depejnd on framework specific classes (e.g. a loader might do 90% framework independent work but end by creating a `THREE.Mesh`, meaning that the returned objects are not immediately usable in Javascript applications that don't use that framework).

In addition, the functionality offered by each loader can vary quite a bit. The format of the parsed data is usually different, even when parsing very similar file formats, making it harder to write applications that support loading point clouds in multiple formats. Other things that differs is whether they run under both browser and Node.js and worker threads, support streaming etc, what APIs and options they provide, error handling and logging support etc.

loaders.gl is an effort to collect some of the best loaders created by the open source community and package them in a unified, portable, framework-independent way.


## Contents of Loaders.gl

* **Loaders** - The core functionality is a set of loaders (parsers) for various major geometry formats.

* **Writers** - A number of formats also provide writers (or encoders for selected key formats to support saving data.

* **Utilities** - Since the loaders and writers themselves only implement parsing and encoding (typically from strings or array buffers), i.e. they don't actually "load" or "save" any data, loaders.gl also provides a set of utility functions that accept loader objects perform actual loading from files, urls etc.



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


## Contributions

Warmly welcomed, as long as they are reasonably aligned with the goals and principles outlined above. PRs and discussions around making loaders.gl more generally useful to non-vis.gl are welcome.
