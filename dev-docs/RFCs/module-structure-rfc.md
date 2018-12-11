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

* Splitting every loader, encoder and write into its own module is possible but will likely lead to dozens of modules.

* Dividing into groups of related loaders ensures that apps don't have to import big chunks of code they are not even remotely intending to use, while avoiding too much book-keeping.


## Proposal


### One loader per FORMAT

To manage dependency concerns and encourage loader discovery it is proposed that each format gets its own module.
This means we will probably have dozens of modules at some point, but that should not be an issue with our current lerna based monorepo infrastructure.

Note: We sometimes have both loaders and writers for the same format, but splitting those into separate modules would seem like overkill. We will rely on tree shaking top remove the unused classes (typically the writers) in that case.



| Module                     | Contents  |
| ---                        | ---       |
| `loaders.gl`               | Umbrella module, simply imports and forwards exports from all other modules. |
| `@loaders.gl/core`         | The user function library and common helper functions for loaders. |
| `@loaders.gl/gltf`         | GLTF2 related loaders/writers (GLTFLoader, GLBLoader, GLBBuilder, ...) |
| `@loaders.gl/draco`        | DRACO compressed mesh and point cloud loader and encoder. DRACO lib dependency. |
| `@loaders.gl/pcd`          | PCD point cloud loader. |
| `@loaders.gl/las`          | LAS point cloud loader. |
| `@loaders.gl/ply`          | PLY point cloud/mesh loader. |
| `@loaders.gl/obj`          | OBJ mesh loader. |
| `@loaders.gl/kml`          | KML geospatial loader. |


### @loaders.gl/core Details

The core module will contain a range of functionality, including:

* Image Classification Utilities
* Threading Utilities
* Loader Auto-Detect Functionality
* ...




## Future Extensions


### Split Core Module

Not yet clear how big the core module will become, we'll want to keep an eye on this. The core could potentially be split into finer granularity pieces, this can happen later.


### Loader Category Modules

We could define groups of related loaders, for apps that wanted to add support for all formats in a loader category

| `@loaders.gl/point-clouds` | Point-Cloud and Mesh Category loaders (PLY, PCS, LAZ, OBJ) |
| `@loaders.gl/geospatial`   | Geospatial format loaders (KML, TopoJSON, ...). |
| `@loaders.gl/draco`        | DRACO compressed mesh and point cloud loader and encoder. DRACO dependency. |
| `@loaders.gl/gltf`         | GLTF2 related loaders/writers (GLTFLoader, GLBLoader, GLBBuilder, ...) |

Remarks
:
* It would be neat to split point clouds and meshes into separate categories although there is overlap. Maybe some format submodules could simply appear as dependencies in more then one category module.


