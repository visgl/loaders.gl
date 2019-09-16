# Roadmap

We are trying to make the loaders.gl roadmap as public as possible. We share information about the direction of the framework in the following ways:

- **[RFCs](https://github.com/uber-web/loaders.gl/tree/master/dev-docs/RFCs)** - RFCs are technical writeups that describe proposed features in upcoming releases.
- **[Roadmap Document](https://github.com/uber-web/loaders.gl/tree/master/docs/overview/roadmap)** - (this document) A high-level summary of our current direction for future releases.
- **[Blog](https://medium.com/@vis.gl)** - We use the vis.gl blog to share information about what we are doing.
- **[Github Issues](https://github.com/uber-web/loaders.gl/issues)** - The traditional way to start or join a discussion.

## Feature Roadmap

Many ideas are in tracker tasks in github, but here are some ideas:

**Worker Thread Pool Priming** - Worker Pools should have an option to pre-warm so that loader thread pool is primed and ready to start off-thread parsing as soon as data arrives on the wire.

**Progress Tracking** - loaders can provide progress callbacks and a `ProgressTracker` class to track the progress of a set of parallel loads.

**Automatic Timing** - objects returned from loaders could contain a `stats` object with timing stats.

**Stats and Default Settings** - Set `setDefaultOptions({stats: true})` to enable stats collection, etc.

**MIME types** - Allow MIME types (e.g. from response headers) to be provided to assist in loader auto-selection. Enable Writers to return recommended MIMEtypes.

## Loader Roadmap

### Data loaders

Streaming tabular loaders

- Streaming JSON loader

### Geospatial loaders

Focus on loading of complex geospatial data.

Focus on loading of large, complex geospatial data.

- KML
- Shapefile
  > > > > > > > Add tests
- Streaming GeoJSON loader

### Images

- Basis image decoder
- Better image loaders

### Meshes

- MTL - we should have full OBJ/MTL support.
- Given industry convergence on glTF, we do not envision supporting any otherr mesh formats beyond OBJ/MTL.

### Point Clouds

Focus on loading formats for large point clouds.

### Massive Point Clouds/Data Sets

Complement 3D Tiles with:

- potree
- i3s

### Scenegraph Formats

- Focus on glTF/GLB - loaders.gl should to have a very solid implementation.
- The glTF loaders should handle (e.g. preprocess) any glTF extensions that can be handled during the load phase (such as Draco, Basis - but many can only be handled during rendering).
- Limited alternatives: Given the emergence of glTF as a major Khronos standard, and availability of good glTF conversion tools and exporters, loaders will most likely not implement any other scene/mesh description formats such as COLLADA.

### Other loaders

Finally, some "unusual" loaders may be included just for fun, e.g. SVG tesselation.
