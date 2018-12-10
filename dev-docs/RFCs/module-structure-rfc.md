# RFC: loaders.gl Module Structure

* **Author**: Ib Green
* **Date**: Dec, 2018
* **Status**: **Draft**


## Summary

This RFC proposes an npm module structure to manage the amount of code and dependencies that applications have to include from loaders.gl.


## Background

loaders.gl is expected to grow with additional loaders, e.g. TopoJSON, more extensive KML, additional mesh and point cloud formats etc.


## Alternatives

* Placing all loaders in a single npm module creates a big, growing dependency and even with fully optimized support for tree-shaking, there will be impact on development builds, and make dependency averse developers think twice about using the library.

* Splitting every loader, encoder and write into its own module is possible but easily leads to a system with dozens of modules and gets unmanageable in its own way.

* Dividing into groups of related loaders ensures that apps don't have to import big chunks of code they are not even remotely intending to use, while avoiding too much book-keeping.


## Proposal

Define groups of related loaders:

| Module                     | Contents  |
| ---                        | ---       |
| `loaders.gl`               | Umbrella module, just imports and forwards all other modules. |
| `@loaders.gl/core`         | The user function library and the common helper functions for loaders. |
| `@loaders.gl/mesh-loaders` | Mesh and Point-Cloud Category loaders (PLY, PCS, LAZ, OBJ) |
| `@loaders.gl/geospatial-loaders` | Geospatial format loaders (KML, TopoJSON, ...). |
| `@loaders.gl/draco`        | DRACO compressed mesh and point cloud loader and encoder. DRACO dependency. |
| `@loaders.gl/gltf`         | GLTF2 related loaders/writers (GLTFLoader, GLBLoader, GLBBuilder, ...) |

Comments:
* the core could potentially be split into finer granularity pieces, this can happen later.
* It would be neat to split meshes and point clouds although there is overlap.


### @loaders.gl/core Details

* Image Classification Utilities
* Threading Utilities
* Loader Auto-Detect Functionality
* ...
