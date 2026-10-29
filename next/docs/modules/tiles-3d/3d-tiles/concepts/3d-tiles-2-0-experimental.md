3D Tiles runtime / experimental

![](/next/images/format-logos/3d-tiles-logo.png)

# Draft 3D Tiles 2.0, decoded and traversed.

loaders.gl can recognize the draft glTF-based 3D Tiles 2.0 representation, preserve its metadata, and expose a traversal-ready Tileset3D hierarchy. The profile is intentionally renderer-neutral and may change as the draft evolves.

![](/next/images/format-logos/3d-tiles-logo.png)[Module](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles.md)[Format](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)[Loader API](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md)[Runtime guides](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts.md)[Source API](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tiles-3d-source.md)

The experimental profile

## Use the same runtime for JSON and glTF-based tilesets.

The loader classifies a glTF or GLB resource by its structure, then adapts explicit nodes or an implicit subtree into the normalized 3D Tiles runtime. No filename convention or new option is required.

01

Detect

Recognize 3DTILES\_tileset and 3DTILES\_subtree glTF resources.

02

Normalize

Expose formatVersion, metadata, bounds, and vector descriptors.

03

Traverse

Reuse Tileset3D refinement, SSE, scheduling, and caching.

04

Integrate

Leave drawing, styling, and GPU policy to the application.

Detailed guide

## Draft scope and stability

This page describes the supported loaders.gl subset, not complete 3D Tiles 2.0 or renderer conformance.

The 3D Tiles 2.0 work follows the [glTF-based representation draft](https://github.com/CesiumGS/glTF/blob/3d-tiles-2.0/extensions/2.1/Vendor/3DTILES_tileset/README.md) at pinned revision [`1737151386460f190ffd90239b38eb0e3f1949f5`](https://github.com/CesiumGS/glTF/tree/1737151386460f190ffd90239b38eb0e3f1949f5/extensions/2.1/Vendor). It is compatible with the [Cesium vector technology preview](https://cesium.com/blog/2026/09/02/vector-tiles-technology-preview-cesium-and-3d-tiles/), including the 3D Tiles 1.1 `3DTILES_content_gltf_vector` designation. The draft and the Khronos vector extensions are not ratified, so the draft-facing API is experimental.

## What is supported[​](#what-is-supported "Direct link to What is supported")

| Area                         | Supported behavior                                                                                                                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resource detection           | Automatic classification of JSON glTF and GLB resources as render content, `3DTILES_tileset`, or `3DTILES_subtree`. Signed and extensionless URLs work the same way.                                                          |
| Explicit hierarchy           | glTF node hierarchies are adapted to the normalized `Tileset3D` header model; nested tilesets remain lazy.                                                                                                                    |
| Implicit hierarchy           | QUADTREE and OCTREE availability, lazy subtree loading/caching, tile/content overrides, property-table rows, and property-backed URI templates.                                                                               |
| Bounds and spatial semantics | Box, sphere, ellipsoid-region, S2, and cylinder-region inputs; CRS/georeference metadata and nested CRS placement are preserved or transformed when resolvable.                                                               |
| Vector topology              | Points, restart-separated polylines, and polygon loops/triangles are exposed through `Tiles3DVectorContent`. Both the 1.1 preview and draft 2.0 vector designations use this contract.                                        |
| Extensions                   | Unknown optional extensions are preserved. Unsupported required extensions fail deterministically during classification. Draft subtrees may resolve structural buffers needed for classification before that validation runs. |

See the [3D Tiles format compatibility matrix](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md) for the detailed capability, version, and limitation records.

## Detecting the draft version[​](#detecting-the-draft-version "Direct link to Detecting the draft version")

No option is needed to enable draft detection. The normalized tileset exposes `formatVersion: '2.0-draft'`; the original glTF `asset.version` remains available and is not rewritten. Applications can branch on the normalized discriminator while treating the draft API as unstable:

```
import {load} from '@loaders.gl/core';

import {Tiles3DLoader} from '@loaders.gl/tiles-3d/3d-tiles';



const tilesetUrl = 'https://example.com/tileset.glb';

const tileset = await load(tilesetUrl, Tiles3DLoader);



if (tileset.formatVersion === '2.0-draft') {

  // Draft-facing metadata and vector descriptors are available.

}
```

When using `Tileset3D`, decoded vector content is available as `tile.vectorContent` and as `content.vectorContent` on the loaded primary content. Set `'3d-tiles': {loadGLTF: true}` (the default) to decode the glTF attributes needed for topology.

## Renderer boundary[​](#renderer-boundary "Direct link to Renderer boundary")

`Tiles3DVectorContent` describes decoded geometry and topology; it does not draw it. The `clip` flag is retained as source metadata for an application-owned renderer. Styling, wide-line tessellation, visual clipping, terrain draping, and GPU upload policy remain outside loaders.gl. The current tileset profile also excludes full voxel/layer/visibility runtime semantics, horizon-occlusion optimization, and terrain/tileset clamping. The separate glTF `EXT_primitive_voxels` reader now exposes metadata-first descriptors, but does not enable required draft tileset voxel extensions or dense decoding. See [Gaussian, vector, and voxel contracts](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/gaussian-vector-voxel-extensions.md).

## Related guides[​](#related-guides "Direct link to Related guides")

* [3D Tiles format compatibility matrix](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)
* [Resource resolution and content detection](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/resource-resolution-and-content-detection.md)
* [Implicit tiling and lazy subtrees](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/implicit-tiling-and-subtrees.md)
* [Coordinate reference systems](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/coordinate-reference-systems.md)
* [Correctness and conformance](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/correctness-and-conformance.md)
