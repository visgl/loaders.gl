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
| Metadata-derived bounding volumes | [x] | Direct numeric `TILE_BOUNDING_*` and `CONTENT_BOUNDING_*` semantic arrays are normalized; property-table value decoding remains application-owned. |
| Styling expressions | [ ] | Rendering-side style evaluation is not provided by this module. |

## How to read the matrix

The loader and runtime have separate responsibilities. `Tiles3DLoader` parses tileset and tile
payloads, while `Tileset3D` performs view-dependent traversal, request scheduling, caching, and
LOD selection. A checked parser capability may therefore still require application or renderer
work before it affects pixels.

## Detailed compatibility matrix

The table below is the compatibility record for the 5.0 development line. It is intentionally
more specific than the checklist above: **stage** says where loaders.gl implements the feature,
while **status** says whether that implementation is complete. A renderer can consume the
normalized data without being implemented by this package; renderer-facing rows are therefore
called out explicitly rather than being counted as parser support.

| Area | Feature | Status | Stage | Coverage and limitations |
| --- | --- | :---: | --- | --- |
| Version | 3D Tiles 1.0 tileset JSON | [x] | Parse + normalize | Legacy tileset fields and explicit hierarchies are covered by loader fixtures. |
| Version | 3D Tiles 1.1 tileset JSON | [x] | Parse + normalize | Implicit tiling, multiple contents, and metadata declarations are retained. |
| Version | 3D Tiles Next declarations | [~] | Parse + preserve | Unknown extension fields remain available as JSON; only listed extensions are interpreted. |
| Container | JSON tileset and extensionless resources | [x] | Resource resolution | Content is detected from structure or binary magic, not from a filename suffix. |
| Container | `3tz` archive resources | [x] | Resource resolution | Archive-backed URLs use the same tile-content pipeline and URI cache. |
| Payload | `b3dm` batched model | [x] | Parse | Batch-table data and the embedded glTF payload are exposed. |
| Payload | `i3dm` instanced model | [x] | Parse | Feature and instance transforms are decoded, including oct-encoded orientations. |
| Payload | `pnts` point cloud | [x] | Parse | Draco point attributes are supported when the Draco decoder is available. |
| Payload | `cmpt` composite | [x] | Parse | Child payloads are parsed recursively through the composite loader. |
| Payload | glTF / GLB tile content | [x] | Parse + normalize | Embedded and external content are accepted; glTF extensions are handled by `@loaders.gl/gltf`. |
| Payload | External tileset content | [x] | Traversal | Nested roots are installed below the owning tile and participate in selection. |
| Payload | Multiple contents per tile | [x] | Parse + traversal | Source order is preserved in `Tile3D.contents`; `Tile3D.content` remains the primary payload. |
| Hierarchy | Explicit child hierarchy | [x] | Traversal | Visibility, distance, refinement, and loading are evaluated per tile. |
| Hierarchy | `REPLACE` refinement | [x] | Traversal | Ancestors remain usable until selected descendants are renderable. |
| Hierarchy | `ADD` refinement | [x] | Traversal | Ancestors and descendants may be selected together. |
| Hierarchy | Implicit QUADTREE/OCTREE tiling | [x] | Lazy traversal | Subtrees and availability bitstreams are requested only when traversal needs them. |
| LOD | Transform-scaled geometric error | [x] | LOD metric | Raw error is retained; world-space error uses the conservative maximum composed scale. |
| LOD | Perspective and orthographic SSE | [x] | LOD metric | Logical/CSS viewport pixels are used; invalid orthographic pixel scales fall back to perspective. |
| LOD | Dynamic SSE | [x] | Traversal tuning | Perspective distance-based adjustment is preserved; it does not change the declared error. |
| Scheduling | Progressive and foveated priorities | [x] | Request scheduling | Priorities affect request order and cancellation, not the final SSE threshold. |
| Scheduling | Skip-level-of-detail traversal | [x] | Traversal | Ready ancestors remain selected while deep descendants stream; this can increase temporary overdraw and bandwidth. |
| Cache | Byte-based tile cache | [x] | Runtime | Cache residency and overflow are measured in bytes; I3S defaults remain isolated. |
| Extension | Required-extension validation | [x] | Parse boundary | Unsupported `extensionsRequired` names fail before normalization or network access. |
| Extension | `3DTILES_implicit_tiling` | [x] | Parse + traversal | Availability, subdivision scheme, and subtree references are normalized. |
| Extension | `3DTILES_bounding_volume_S2` | [x] | Parse + culling input | S2 volumes become traversal-ready oriented boxes while source tokens are retained. |
| Extension | `3DTILES_content_gltf` | [x] | Content detection | glTF tile content is recognized independently of URL extension. |
| Extension | `3DTILES_draco_point_compression` | [x] | Parse + decode input | Point-cloud compression metadata is passed to the decoder. |
| Extension | `3DTILES_batch_table_hierarchy` | [~] | Parse validation | Parser scaffolding and boundary validation exist; complete hierarchy semantics remain planned. |
| Metadata | `EXT_mesh_features` | [x] | Parse + preserve | Feature identifiers are retained for supported glTF payloads. |
| Metadata | `EXT_structural_metadata` | [x] | Parse + preserve | Schema, property tables, groups, and entity links are exposed; value decoding is application-side. |
| Metadata | Metadata-derived bounding volumes | [x] | Culling | Direct numeric semantic arrays are normalized into tile/content volumes; property-table decoding remains application-owned. |
| Renderer | Styling expressions | [ ] | Renderer | Style evaluation and visual feature selection are outside this loader/runtime package. |
| Renderer | GPU upload and draw policy | [ ] | Renderer | Applications such as deck.gl or Cesium decide how normalized payloads become draw calls. |

`[~]` means partial support: the loader preserves or validates the feature, but does not yet
implement the complete runtime semantics. `[ ]` means that the feature is intentionally not
implemented in the current module. This distinction prevents a parser-only capability from being
mistaken for end-to-end renderer support.

For the selection algorithm, see [screen-space error and LOD](../concepts/screen-space-error-and-lod).
For hierarchy metadata and lazy requests, see [implicit tiling and subtrees](../concepts/implicit-tiling-and-subtrees).
For cache and request behavior, see [caching and memory](../concepts/caching-and-memory) and
[request scheduling and priorities](../concepts/request-scheduling-and-priorities).

## Supported coordinate and volume forms

The runtime accepts oriented boxes, spheres, and geographic regions, including regions that cross
the antimeridian and degenerate-height regions. S2 extension volumes are
normalized to oriented boxes while retaining their source token and height range for implicit
subdivision. Tile transforms are composed with ancestor and tileset transforms before culling and
geometric-error scaling.

## Related specifications

- [OGC 3D Tiles Standard](https://www.ogc.org/standard/3dtiles/)
- [3D Tiles specification](https://github.com/CesiumGS/3d-tiles)
- [3DTILES_implicit_tiling](https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling)
- [3DTILES_multiple_contents](https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_multiple_contents)
