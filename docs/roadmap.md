# Roadmap

We are trying to make the loaders.gl roadmap as public as possible.

We share information about the direction of the framework in the following ways:

* **[RFCs](https://github.com/uber-web/loaders.gl/tree/master/dev-docs/RFCs)** - RFCs are technical writeups that describe proposed features in upcoming releases.
* **[Roadmap Document](https://github.com/uber-web/loaders.gl/tree/master/docs/overview/roadmap)** - (this document) A high-level summary of our current direction for future releases.
* **[Blog](https://medium.com/@vis.gl)** - We use the vis.gl blog to share information about what we are doing.
* **[Github Issues](https://github.com/uber-web/loaders.gl/issues)** - The traditional way to start or join a discussion.


## Feature Roadmap

**Off-thread parsing support** - Off thread parsing is an obvious optimization however it has some major complications that often eat up any performance gains: and serialization/deserialization overhead. loaders.gl is designed to avoid serialization through direct transfer of typed arrays.

**Loader Worker Thread Pool** - Another performance "killer" for worker threads is multi-second startup time. loaders.gl exports an optional "loader worker manager" class that can help keep a loader thread pool loaded and primed and ready to start off-thread parsing as soon as data arrives on the wire.

**Progress Tracking** - loaders can provide progress callbacks and a `ProgressTracker` class is provided to track the progress of a set of parallel loads.

**Format Auto-Discovery** - Each loader can optionally expose a test function that can examine the "head" of a file to test if it is likely to be in a format this loader will be able to parse.

**Stream Support**  - Support stream based loaders... `loader.loadStream`


## Format Roadmap

The emergence of glTF as a major Khronos standard with the ensuing massive industry adoption is a huge deal for the WebGL/3D community. The need to support long list of obscure loaders for e.g. various 3D asset authoring packages is quickly becoming a thing of the past as most major applications have started to offer high-quality, maintained glTF exporters.

Obviously we expect loaders.gl to have very solid glTF/GLB support. Also we will most likely not try to pursue "competing" scene/mesh description formats.

Still, for special data sets such as large point clouds or complex geospatial data, the need for special formats for (e.g. compactness or expressivity) is unchanged, so this is the direction we expect most new loaders.gl loaders to focus on.

Finally, some "unusual" loaders may be included just for the fun of it, e.g. SVG tesselation.


## Implemented

**Test Data** - Ideally loaders.gl will include test data for each format to ensure that the regression suite is as effective as possible.

