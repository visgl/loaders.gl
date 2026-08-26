import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';

# 3D Tiles

<Tiles3DDocsTabs active="module" />

3D Tiles is a hierarchical, streamable format for rendering large geospatial datasets. A tileset
describes a tree of bounding volumes, geometric-error values, refinement rules, and references to
renderable tile payloads. The runtime selects the smallest useful set of payloads for the current
viewport instead of downloading the complete dataset.

## Compatibility at a glance

The checkboxes below describe loaders.gl behavior in the current 5.0 development line. A checked
item means the loader parses and exposes the capability; it does not imply that every renderer
provides a visual implementation for that feature.

### Tileset and traversal

| Capability | Status | Notes |
| --- | :---: | --- |
| 3D Tiles 1.0 tileset JSON | [x] | Parsed and normalized by [`Tiles3DLoader`](../api-reference/tiles-3d-loader). |
| 3D Tiles 1.1 tileset JSON | [x] | Includes implicit-tiling and metadata declarations. |
| Explicit child hierarchies | [x] | Traversed by [`Tileset3D`](../../tiles/api-reference/tileset-3d). |
| Lazy implicit subtrees | [x] | Availability resources are requested after visibility and LOD checks. |
| Implicit multiple contents | [x] | All declared content-availability streams produce ordered `content` and `contentUrls` entries. |
| `REPLACE` refinement | [x] | Ancestors are replaced as children become renderable. |
| `ADD` refinement | [x] | Ancestors and descendants may render together. |
| Geometric-error transform scaling | [x] | Uses the conservative maximum scale component. |
| Perspective and orthographic SSE | [x] | Uses logical/CSS viewport pixels. |
| Progressive and foveated request priority | [x] | Changes request order, not the final SSE target. |
| Skip-level-of-detail traversal | [ ] | Planned Cesium-parity tranche. |

### Tile payloads

| Payload | Status | Notes |
| --- | :---: | --- |
| `b3dm` batched 3D model | [x] | Batch tables and glTF payloads are exposed. |
| `i3dm` instanced 3D model | [x] | Instancing metadata is parsed. |
| i3dm oct-encoded orientation | [x] | `NORMAL_UP_OCT32P` and `NORMAL_RIGHT_OCT32P` are decoded into instance transforms. |
| `pnts` point cloud | [x] | Draco-compressed point attributes are supported. |
| `cmpt` composite | [x] | Child payloads are parsed through the composite loader. |
| `glb` / glTF tile content | [x] | Structure-first content detection supports extensionless resources. |
| External tileset content | [x] | Nested tilesets are installed below the owning tile. |
| Multiple contents per tile | [x] | Explicit content arrays are normalized and loaded in source order; `Tile3D.content` remains the primary payload and `Tile3D.contents` exposes all payloads. |
| `3tz` archive resources | [x] | Archive-backed sources use the same URL/content pipeline. |

### Extensions and metadata

| Capability | Status | Notes |
| --- | :---: | --- |
| Required-extension validation | [x] | Unsupported required names fail before normalization or network requests. |
| `3DTILES_implicit_tiling` | [x] | QUADTREE and OCTREE availability are supported. |
| `3DTILES_bounding_volume_S2` | [x] | S2 volumes are converted to traversal-ready oriented boxes. |
| `3DTILES_content_gltf` | [x] | glTF tile content is recognized. |
| `3DTILES_draco_point_compression` | [x] | Point-cloud Draco metadata is exposed to the decoder. |
| `3DTILES_batch_table_hierarchy` | [ ] | Parser scaffolding exists; complete hierarchy semantics remain planned. |
| `EXT_mesh_features` | [x] | Feature identifiers are preserved for supported glTF payloads. |
| `EXT_structural_metadata` | [x] | Schema and property-table metadata are exposed where present. |
| Metadata topology preservation | [x] | Schema, groups, tileset/tile/content entities, and implicit-subtree references are retained for application-level interpretation. Value/class decoding is not included. |
| Metadata-derived bounding volumes | [ ] | `TILE_BOUNDING_*` and `CONTENT_BOUNDING_*` semantics are planned. |
| Styling expressions | [ ] | Rendering-side style evaluation is not provided by this module. |

## How to read the matrix

The loader and runtime have separate responsibilities. `Tiles3DLoader` parses tileset and tile
payloads, while `Tileset3D` performs view-dependent traversal, request scheduling, caching, and
LOD selection. A checked parser capability may therefore still require application or renderer
work before it affects pixels.

For the selection algorithm, see [screen-space error and LOD](../concepts/screen-space-error-and-lod).
For hierarchy metadata and lazy requests, see [implicit tiling and subtrees](../concepts/implicit-tiling-and-subtrees).
For cache and request behavior, see [caching and memory](../concepts/caching-and-memory) and
[request scheduling and priorities](../concepts/request-scheduling-and-priorities).

## Supported coordinate and volume forms

The runtime accepts oriented boxes, spheres, and geographic regions. S2 extension volumes are
normalized to oriented boxes while retaining their source token and height range for implicit
subdivision. Tile transforms are composed with ancestor and tileset transforms before culling and
geometric-error scaling.

## Related specifications

- [OGC 3D Tiles Standard](https://www.ogc.org/standard/3dtiles/)
- [3D Tiles specification](https://github.com/CesiumGS/3d-tiles)
- [3DTILES_implicit_tiling](https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling)
- [3DTILES_multiple_contents](https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_multiple_contents)
