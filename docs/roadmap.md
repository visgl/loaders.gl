# Roadmap

We are trying to make the loaders.gl roadmap as public as possible. We share information about the direction of the framework in the following ways:

- **[RFCs](https://github.com/uber-web/loaders.gl/tree/master/dev-docs/RFCs)** - RFCs are technical writeups that describe proposed features in upcoming releases.
- **[Roadmap Document](https://github.com/uber-web/loaders.gl/tree/master/docs/overview/roadmap)** - (this document) A high-level summary of our current direction for future releases.
- **[Blog](https://medium.com/@vis.gl)** - We use the vis.gl blog to share information about what we are doing.
- **[Github Issues](https://github.com/uber-web/loaders.gl/issues)** - The traditional way to start or join a discussion.

## Feature Roadmap

**Off-thread parsing support** - Off thread parsing is an obvious optimization however it has some major complications that often eat up any performance gains: and serialization/deserialization overhead. loaders.gl is designed to avoid serialization through direct transfer of typed arrays.

**Loader Worker Thread Pool** - Another performance "killer" for worker threads is multi-second startup time. loaders.gl exports an optional "loader worker manager" class that can help keep a loader thread pool loaded and primed and ready to start off-thread parsing as soon as data arrives on the wire.

**Progress Tracking** - loaders can provide progress callbacks and a `ProgressTracker` class is provided to track the progress of a set of parallel loads.

**Improved Format Auto-Discovery** - Each loader can optionally expose a test function that can examine the "head" of a file to test if it is likely to be in a format this loader will be able to parse.

## Format Roadmap

### Scenegraph Formats

- We expect loaders.gl to have very solid ("reference caliber") glTF/GLB implementation.
- Support for glTF extensions that can be handled during the load phase (many can only be handled during rendering).
- Given the emergence of glTF as a major Khronos standard, and availability of good glTF conversion tools and exporters, we will most likely not implement any other scene/mesh description formats such as COLLADA.

### Point Clouds

Still, for special data sets such as large point clouds or complex geospatial data, the need for special formats for (e.g. compactness or expressivity) is unchanged, so this is the direction we expect most new loaders.gl loaders to focus on.

### Meshes

- Currently no support beyond OBJ.
- For OBJ, should we support MTL?

### Massive Point Clouds/Data Sets

* 3D Tiles
* potree?

These critically need to include traversal and tile loading caches

### Other loaders

Finally, some "unusual" loaders may be included just for fun, e.g. SVG tesselation.
