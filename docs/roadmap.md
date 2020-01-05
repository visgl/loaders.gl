# Roadmap

We are trying to make the loaders.gl roadmap as public as possible. We share information about the direction of the framework in the following ways:

- **[RFCs](https://github.com/uber-web/loaders.gl/tree/master/dev-docs/RFCs)** - RFCs are technical writeups that describe proposed features in upcoming releases.
- **[Roadmap Document](https://github.com/uber-web/loaders.gl/tree/master/docs/overview/roadmap)** - (this document) A high-level summary of our current direction for future releases.
- **[Blog](https://medium.com/@vis.gl)** - We use the vis.gl blog to share information about what we are doing.
- **[Github Issues](https://github.com/uber-web/loaders.gl/issues)** - The traditional way to start or join a discussion.

## Core Feature Roadmap

Many ideas are in tracker tasks in github, but here are some ideas:

**Worker Improvements** - - Worker Warmup - loaders.gl core should have an option to pre-load workers so that loader thread pool is primed and ready to start off-thread parsing as soon as data arrives on the wire. This can avoid a typical 1-2 second lag to load and parse the worker script on the initial load using that worker.

**Progress Tracking** - loaders can provide progress callbacks and a `ProgressTracker` class to track the progress of a set of parallel loads.

**Automatic Timing** - loaders.gl could integrate with probe.gl `Stats`, ideas:

- loaders could export a global stats object.
- `load` options could accept a `stats` parameter.
- objects returned from loaders could contain a `stats` object with timing stats.
- `setDefaultOptions({stats: true})` to enable stats collection, etc.

**MIME types** - Allow MIME types (e.g. from response headers) to be provided to assist in loader auto-selection.

## Writer Roadmap

Writer support is currently minimal in loaders.gl.

- Worker support for writers
- Enable Writers to return recommended MIME type(s).

## Loader Roadmap

### Data loaders

- Develop table category helper classes
- Develop table to Arrow mapping support
- Develop GeoJSON to Arrow mapping

Streaming tabular loaders

- Improve perf of CSV Loader to match `d3.dsv`

### Images

- Good example that shows various (compressed) formats loading
- Decide on ImageWorkerLoader
- Decide on type: 'data'
- Basis image decoder, finalize API
- Compressed image decoder, finalize API
- Finalize documentation

### Geospatial loaders

Focus on loading of large, complex geospatial data.

- KML
- Shapefile

### Meshes

- MTL - Implement MTL format support, we should have full OBJ/MTL support.
- Determine how materials fit into the Mesh category, or if adding MTL returns a Scenegraph category object.
- OBJ can also support face groups => simple scenegraph?

Note: Given industry convergence on glTF, we do not envision supporting other mesh formats beyond OBJ/MTL.

### Point Clouds

Focus on support formats for large point clouds.

- Better example for point cloud loading
  - auto discover extents
  - support streaming loads (display points as they stream in).
  - better selector for data sets with preview images

**`LASLoader`**

- Implement streaming load
- load emscripten-lib from unpkg CDN
- compile C++ to WASM instead of JS?
- investigate support for LAS 1.4?

### 3D Tiles

- Support for alternative/non-geospatial coordinate systems (potree)
- Support unlit materials
- Finalize i3s support
- Finalize potree support
- Better example
  - better selector for data sets with preview images

### Scenegraph Formats

Focus on glTF/GLB - loaders.gl should to have a very solid implementation.

- The glTF loaders should handle (e.g. preprocess) any glTF extensions that can be handled during the load phase (such as Draco, Basis - but many can only be handled during rendering).

What loaders.gl will NOT support: Given the emergence of glTF as a major Khronos standard, and availability of good glTF conversion tools and exporters, loaders will most likely not supprt any other large scene/mesh description formats such as COLLADA.

### Other loaders

Finally, some "unusual" loaders may be included just for fun, e.g. SVG tesselation.
