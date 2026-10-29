3D Tiles runtime

![](/next/images/format-logos/3d-tiles-logo.png)

# From tileset metadata to visible content.

These guides explain the decisions made between a tileset response and the content an application can render: resource detection, hierarchy traversal, level of detail, request priority, and memory.

![](/next/images/format-logos/3d-tiles-logo.png)[Module](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles.md)[Format](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)[Loader API](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md)[Runtime guides](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts.md)[Source API](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tiles-3d-source.md)

A view-dependent pipeline

## Each stage answers a different question.

A runtime first resolves and classifies resources, then traverses the hierarchy, chooses an acceptable level of detail, schedules missing content, and keeps useful results available for the next frame.

01

Resolve

Turn references, templates, and archives into fetchable resources.

02

Select

Use visibility, geometric error, and refinement to choose coverage.

03

Schedule

Rank required requests within network and decode limits.

04

Retain

Reuse current content while managing byte-native cache budgets.

Detailed guide

## The runtime guides

The sections below document each stage independently, with links back to the APIs and the measurements needed to diagnose a real tileset.

Loading a large 3D Tiles tileset is a continuous pipeline: traverse the hierarchy, decide which level of detail is needed, rank missing content, load within concurrency limits, render safe coverage, and retain useful content in the cache. These pages document each stage and the options that connect them.

| Guide                                                                                                                                                          | Question it answers                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [Renderer contracts and metadata](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/renderer-contracts-and-metadata.md)                     | How do I enumerate content, distinguish raw metadata from decoded values, and inspect renderability? |
| [Gaussian, vector, and voxel extensions](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/gaussian-vector-voxel-extensions.md)             | Which new payloads are read, which require a decoder, and which still require a renderer?            |
| [Coordinate reference systems](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/coordinate-reference-systems.md)                           | How are coordinate frames, epochs, reprojection, and nested placements handled?                      |
| [Correctness and conformance](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/correctness-and-conformance.md)                             | Which invariants and hermetic fixtures protect the runtime?                                          |
| [Resource resolution and content detection](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/resource-resolution-and-content-detection.md) | How are relative references, inherited queries, and extensionless content handled?                   |
| [Experimental 3D Tiles 2.0 profile](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/3d-tiles-2-0-experimental.md)                         | Which draft glTF-based 3D Tiles 2.0 structures and vector descriptors are supported?                 |
| [Tile hierarchy and refinement](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/tile-hierarchy-and-refinement.md)                         | Which tiles can replace or augment their ancestors?                                                  |
| [Implicit tiling and lazy subtrees](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/implicit-tiling-and-subtrees.md)                      | When are implicit availability files requested and materialized?                                     |
| [Screen-space error and LOD](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/screen-space-error-and-lod.md)                               | How much detail does the current view require?                                                       |
| [Request scheduling and priorities](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/request-scheduling-and-priorities.md)                 | Which required tile should use the next network slot?                                                |
| [Caching and memory](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/caching-and-memory.md)                                               | Which loaded tiles remain resident, and when may the budget be exceeded?                             |
| [Runtime tuning and diagnostics](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/runtime-tuning-and-diagnostics.md)                       | Which controls and measurements explain visible behavior?                                            |
| [Runtime observability and benchmark baselines](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/observability-and-benchmarks.md)          | How can traversal decisions and performance budgets be compared?                                     |
| [Styling and feature access](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/styling-and-feature-access.md)                               | How can metadata, feature IDs, and batch-table rows become renderer-neutral style inputs?            |

The stages are related but not interchangeable. In particular, screen-space error determines the desired final LOD. Progressive and foveated scheduling normally change only the order and timing of requests needed to reach that LOD.

Start with [resource resolution and content detection](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/resource-resolution-and-content-detection.md) to understand how a tileset enters the runtime, continue with [tile hierarchy and refinement](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/tile-hierarchy-and-refinement.md), follow [implicit tiling and lazy subtrees](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/implicit-tiling-and-subtrees.md) for availability-driven hierarchies, or go directly to the [request-scheduling guide](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/request-scheduling-and-priorities.md) for foveated requests. For feature metadata and style inputs, continue with [styling and feature access](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/styling-and-feature-access.md).
