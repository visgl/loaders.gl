# 3D Tiles Runtime Concepts

Loading a large 3D Tiles tileset is a continuous pipeline: traverse the hierarchy, decide which level of detail is needed, rank missing content, load within concurrency limits, render safe coverage, and retain useful content in the cache. These pages document each stage and the options that connect them.

| Guide | Question it answers |
| --- | --- |
| [Tile hierarchy and refinement](/docs/modules/3d-tiles/concepts/tile-hierarchy-and-refinement) | Which tiles can replace or augment their ancestors? |
| [Screen-space error and LOD](/docs/modules/3d-tiles/concepts/screen-space-error-and-lod) | How much detail does the current view require? |
| [Request scheduling and priorities](/docs/modules/3d-tiles/concepts/request-scheduling-and-priorities) | Which required tile should use the next network slot? |
| [Caching and memory](/docs/modules/3d-tiles/concepts/caching-and-memory) | Which loaded tiles remain resident, and when may the budget be exceeded? |
| [Runtime tuning and diagnostics](/docs/modules/3d-tiles/concepts/runtime-tuning-and-diagnostics) | Which controls and measurements explain visible behavior? |

The stages are related but not interchangeable. In particular, screen-space error determines the desired final LOD. Progressive and foveated scheduling normally change only the order and timing of requests needed to reach that LOD.

Start with [tile hierarchy and refinement](/docs/modules/3d-tiles/concepts/tile-hierarchy-and-refinement), or go directly to the [request-scheduling guide](/docs/modules/3d-tiles/concepts/request-scheduling-and-priorities) for foveated requests.
