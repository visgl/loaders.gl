---
title: 3D Tiles format
description: A hierarchical, streamable format for rendering large geospatial datasets.
hide_title: true
page_style: designed
---

import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';
import {TiledSceneGraphic} from '@site/src/components/docs/tiled-scene-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tiled scene format"
  title="3D Tiles"
  description="Describe a large scene as a hierarchy of bounded, streamable pieces so a renderer can request the detail that matters for the current view."
  tone="violet"
  hideTitle={true}
  logos={[
    {alt: 'OGC logo', src: '/images/format-logos/ogc-logo-transparent.png', href: 'https://www.ogc.org/standard/3dtiles/'},
    {alt: '3D Tiles logo', src: '/images/format-logos/3d-tiles-logo-transparent.png', href: 'https://github.com/CesiumGS/3d-tiles'}
  ]}
  meta={['Hierarchical', 'Streamable', 'Level-of-detail aware']}
/>

<Tiles3DDocsTabs active="format" />

<TiledSceneGraphic />

<DocOrientation
  eyebrow="The 3D Tiles delivery model"
  title="A large scene, divided into useful requests."
  description="A tileset describes the hierarchy and the rules for selecting content. Traversal chooses what the current view needs, while loaders.gl preserves the payload and metadata needed by the application."
  tone="violet"
  items={[
    {label: 'Hierarchy', value: 'Bounding volumes, geometric error, and refinement'},
    {label: 'Payloads', value: 'glTF, batched models, instancing, points, and composites'},
    {label: 'Requests', value: 'Lazy content, implicit subtrees, archives, and caching'},
    {label: 'Application', value: 'Traversal-ready tiles with source metadata intact'}
  ]}
/>

3D Tiles is a hierarchical, streamable format for rendering large geospatial datasets. A tileset
describes a tree of bounding volumes, geometric-error values, refinement rules, and references to
renderable tile payloads. The runtime selects the smallest useful set of payloads for the current
viewport instead of downloading the complete dataset.

<ReferenceBoundary
  title="Compatibility and implementation details"
  description="The matrices below distinguish parser support, traversal behavior, payload handling, metadata preservation, and renderer-owned features."
  tone="violet"
/>

## Compatibility at a glance

The checkboxes below describe loaders.gl behavior in the current 5.0 development line.

Renderer-neutral content, feature-ID, metadata, and visibility descriptors are available from the public `@loaders.gl/tiles` runtime for renderer integrations. See the [content contracts guide](../concepts/renderer-contracts-and-metadata) and [Tile3D API](../../tiles/api-reference/tile-3d). A checked
item means the loader parses and exposes the capability; it does not imply that every renderer
provides a visual implementation for that feature.

### Tileset and traversal

| Capability | <span data-docs-table-status>Status</span> | Notes |
| --- | :---: | --- |
| 3D Tiles 1.0 tileset JSON | ✅ | Parsed and normalized by [`Tiles3DLoader`](../api-reference/tiles-3d-loader). |
| 3D Tiles 1.1 tileset JSON | ✅ | Includes implicit-tiling and metadata declarations. |
| Draft glTF-based 3D Tiles 2.0 | ◐ v5.0 | Experimental parsing, explicit/implicit traversal, spatial interpretation, and vector descriptors; renderer features are excluded. |
| Explicit child hierarchies | ✅ | Traversed by [`Tileset3D`](../../tiles/api-reference/tileset-3d). |
| Lazy implicit subtrees | ✅ v5.0 | Availability resources are requested after visibility and LOD checks. |
| Implicit multiple contents | ✅ v5.0 | Available streams produce ordered `contentUrls`, `contents`, and `contentEntries`; `content` remains the primary payload. |
| `REPLACE` refinement | ✅ | Ancestors are replaced as children become renderable. |
| `ADD` refinement | ✅ | Ancestors and descendants may render together. |
| Geometric-error transform scaling | ✅ v5.0 | 1.x uses the conservative maximum composed scale; draft 2.0 error is unscaled. |
| Perspective and orthographic SSE | ✅ v5.0 | Uses logical/CSS viewport pixels. |
| Progressive and foveated request priority | ✅ v5.0 | Changes request order, not the final SSE target. |
| Skip-level-of-detail traversal | ✅ v5.0 | Ready ancestors remain selected while deeper descendants stream. |
| Viewer request volumes | ✅ v5.0 | Transformed volumes gate request eligibility separately from render culling. |
| Indexed and union content visibility | ✅ v5.0 | Content bounds and clipping planes affect render visibility, not descendant traversal. |
| Traversal snapshots | ✅ v5.0 | Deterministic selection/request IDs, cache counters, and optional implicit-subtree diagnostics. |

### Tile payloads

| Payload | <span data-docs-table-status>Status</span> | Notes |
| --- | :---: | --- |
| `b3dm` batched 3D model | ✅ | Batch tables and glTF payloads are exposed. |
| `i3dm` instanced 3D model | ✅ | Instancing metadata is parsed. |
| i3dm oct-encoded orientation | ✅ v5.0 | `NORMAL_UP_OCT32P` and `NORMAL_RIGHT_OCT32P` are decoded into instance transforms. |
| `pnts` point cloud | ✅ | Draco-compressed point attributes are supported. |
| `cmpt` composite | ✅ | Child payloads are parsed through the composite loader. |
| `glb` / glTF tile content | ✅ | Structure-first content detection supports extensionless resources. |
| External tileset content | ✅ | Nested tilesets are installed below the owning tile. |
| Multiple contents per tile | ✅ v5.0 | Explicit content arrays are normalized and loaded in source order; `Tile3D.content` remains the primary payload and `Tile3D.contents` exposes all payloads. |
| `3tz` archive resources | ✅ v5.0 | Archive-backed sources use the same URL/content pipeline. |
| Draft glTF package files | ✅ v5.0 | URI and buffer-view `files`/`externalAssets` resolve lazily, including nested tilesets and subtrees. |

### Extensions and metadata

| Capability | <span data-docs-table-status>Status</span> | Notes |
| --- | :---: | --- |
| Required-extension validation | ✅ v5.0 | Unsupported required names fail before header normalization; draft subtree classification may first load structural buffers. |
| `3DTILES_implicit_tiling` | ✅ | QUADTREE and OCTREE availability are supported. |
| `3DTILES_bounding_volume_S2` | ✅ v5.0 | S2 volumes are converted to traversal-ready oriented boxes. |
| `3DTILES_content_gltf` | ✅ | glTF tile content is recognized. |
| `3DTILES_draco_point_compression` | ✅ | Point-cloud Draco metadata is exposed to the decoder. |
| `3DTILES_batch_table_hierarchy` | ◐ v5.0 | Hierarchy-aware JSON batch-table property access is supported; binary hierarchy property access is not. |
| `EXT_mesh_features` | ✅ v5.0 | Feature identifiers are preserved for supported glTF payloads. |
| `EXT_structural_metadata` | ✅ v5.0 | Loaded property-table columns decode numeric, boolean, string, enum, vector/matrix, and array values; row helpers apply defaults/noData. |
| Draft `3DTILES_subtree` | ◐ v5.0 | QUADTREE/OCTREE availability, attribute overrides, property rows, URI properties, and lazy caching are supported. |
| Draft vector topology | ◐ v5.0 | Point, restart-separated polyline, and polygon topology is exposed; drawing and styling are renderer-owned. |
| `KHR_gaussian_splatting` | ◐ v5.0 | Per-primitive descriptors and validation are available; node placement, accessor interpretation, and rendering remain consumer responsibilities. |
| SPZ v2/v3/v4 standalone files | ✅ v5.0 | The separate `@loaders.gl/splats` loader decodes gzip v2/v3 and TLV/zstd v4 into Arrow tables; this is not a direct SPZ tile-content loader. |
| glTF SPZ2 compression | ◐ v5.0 | Buffer views and loaded compressed bytes are preserved; an injected decoder receives an explicit LUF source-coordinate hint. |
| `EXT_primitive_voxels` / `3DTILES_content_voxels` | ◐ v5.0 | Primitive shape/dimensions/accessor declarations are preserved and the 1.x content extension is recognized; no dense decoding or full draft voxel-profile support. |
| Metadata topology preservation | ✅ v5.0 | Raw schema, groups, tileset/tile/content entities, and subtree references remain available alongside supported decoded columns. |
| Metadata-derived bounding volumes | ✅ v5.0 | Supported `TILE_BOUNDING_*` and `CONTENT_BOUNDING_*` semantics feed normalized tile/content bounds; not every metadata encoding defines a usable bound. |
| Renderer-neutral content contracts | ✅ v5.0 | Ordered entries expose payload, metadata, feature-ID declarations, transformed bounds, and renderability. |
| Renderer-neutral style inputs | ✅ v5.0 | Property-table rows, hierarchy-aware batch-table access, metadata precedence, and property-source diagnostics are exposed without style evaluation. |
| Styling expressions | — | Rendering-side style evaluation is not provided by this module. |

### Coordinate reference systems

See [Coordinate reference systems in 3D Tiles](../concepts/coordinate-reference-systems) for CRS
semantic discovery, regions, affine versus nonlinear transforms, nested tilesets, epochs, local
frames, and precision rules.

| Capability | <span data-docs-table-status>Status</span> | Notes |
| --- | :---: | --- |
| `TILESET_CRS_GEOCENTRIC` | ✅ v5.0 | Resolved from inline schema and tileset metadata; explicit `UNKNOWN` remains unknown. |
| `TILESET_CRS_COORDINATE_EPOCH` | ✅ v5.0 | Finite epoch values are preserved in normalized metadata. |
| Region-established global frame | ✅ v5.0 | A root region establishes the specification frame without coordinate-magnitude guessing. |
| Local or ambiguous frames | ✅ v5.0 | Stay unknown unless metadata or an expert override resolves them. |
| Horizontal/geocentric transform primitive | ✅ v5.0 | Shared Proj4 pipeline and custom definition/grid registration are available. |
| Complete nonlinear content reprojection | ◐ | Box/sphere/region bounds, decoded POSITION/NORMAL attributes, traversal headers, and nested CRS placement are transformed; cross-epoch execution remains staged. |
| Dynamic cross-epoch transformation | — | Epoch is preserved; current Proj4 bindings do not execute epoch operations. |

### Experimental 3D Tiles 2.0 exclusions

The experimental tileset profile does not implement the complete voxel, layer, or visibility
extension families, horizon-occlusion optimization, styling, visual clipping, terrain draping, or
terrain/tileset clamping. The glTF voxel primitive reader described above does not enable a required
draft tileset voxel extension. Likewise, runtime clipping-plane classification does not itself draw
clipped geometry. These capabilities are not implied by parsing an optional extension name.
Unknown optional extensions are preserved; an unsupported name in `extensionsRequired` is rejected
during classification. Draft subtree classification may first resolve structural buffers needed to
read availability and metadata, so this rejection does not promise that every subtree dependency
is untouched.

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
| Version | 3D Tiles 1.0 tileset JSON | ✅ | Parse + normalize | Legacy tileset fields and explicit hierarchies are covered by loader fixtures. |
| Version | 3D Tiles 1.1 tileset JSON | ✅ | Parse + normalize | Implicit tiling, multiple contents, and metadata declarations are retained. |
| Version | Draft glTF-based 3D Tiles 2.0 | ◐ v5.0 | Parse + normalize + traversal | Supported against pinned draft revision `1737151386460f190ffd90239b38eb0e3f1949f5`; experimental APIs may change with the draft. |
| Version | 3D Tiles Next declarations | ◐ | Parse + preserve | Unknown extension fields remain available as JSON; only listed extensions are interpreted. |
| Container | JSON tileset and extensionless resources | ✅ | Resource resolution | Content is detected from structure or binary magic, not from a filename suffix. |
| Container | `3tz` archive resources | ✅ v5.0 | Resource resolution | Archive-backed URLs use the same tile-content pipeline and URI cache. |
| Payload | `b3dm` batched model | ✅ | Parse | Batch-table data and the embedded glTF payload are exposed. |
| Payload | `i3dm` instanced model | ✅ | Parse | Feature and instance transforms are decoded, including oct-encoded orientations. |
| Payload | `pnts` point cloud | ✅ | Parse | Draco point attributes are supported when the Draco decoder is available. |
| Payload | `cmpt` composite | ✅ | Parse | Child payloads are parsed recursively through the composite loader. |
| Payload | glTF / GLB tile content | ✅ | Parse + normalize | Embedded and external content are accepted; glTF extensions are handled by `@loaders.gl/gltf`. |
| Payload | External tileset content | ✅ | Traversal | Nested roots are installed below the owning tile and participate in selection. |
| Payload | Multiple contents per tile | ✅ v5.0 | Parse + traversal | Source order is preserved in `Tile3D.contents`; `Tile3D.content` remains the primary payload. |
| Hierarchy | Explicit child hierarchy | ✅ | Traversal | Visibility, distance, refinement, and loading are evaluated per tile. |
| Hierarchy | `REPLACE` refinement | ✅ | Traversal | Ancestors remain usable until selected descendants are renderable. |
| Hierarchy | `ADD` refinement | ✅ | Traversal | Ancestors and descendants may be selected together. |
| Hierarchy | Implicit QUADTREE/OCTREE tiling | ✅ | Lazy traversal | Subtrees and availability bitstreams are requested only when traversal needs them. |
| Hierarchy | Draft glTF `3DTILES_subtree` | ◐ v5.0 | Lazy traversal | Availability, supported attributes/property rows, embedded resources, and URI substitution are normalized. |
| LOD | Transform-scaled geometric error | ✅ v5.0 | LOD metric | 1.x raw error is retained and scaled once using the maximum composed scale; draft 2.0 error stays unscaled. |
| LOD | Perspective and orthographic SSE | ✅ v5.0 | LOD metric | Logical/CSS viewport pixels are used; invalid orthographic pixel scales fall back to perspective. |
| LOD | Dynamic SSE | ✅ | Traversal tuning | Perspective distance-based adjustment is preserved; it does not change the declared error. |
| Scheduling | Progressive and foveated priorities | ✅ v5.0 | Request scheduling | Priorities affect request order and cancellation, not the final SSE threshold. |
| Scheduling | Skip-level-of-detail traversal | ✅ v5.0 | Traversal | Ready ancestors remain selected while deep descendants stream; this can increase temporary overdraw and bandwidth. |
| Cache | Byte-based tile cache | ✅ v5.0 | Runtime | Cache residency and overflow are measured in bytes; I3S defaults remain isolated. |
| Extension | Required-extension validation | ✅ v5.0 | Parse boundary | Unsupported `extensionsRequired` names fail during classification and before header normalization; draft subtrees may first resolve structural buffers needed for classification. |
| Extension | `3DTILES_implicit_tiling` | ✅ | Parse + traversal | Availability, subdivision scheme, and subtree references are normalized. |
| Extension | `3DTILES_bounding_volume_S2` | ✅ v5.0 | Parse + culling input | S2 volumes become traversal-ready oriented boxes while source tokens are retained. |
| Extension | `3DTILES_content_gltf` | ✅ | Content detection | glTF tile content is recognized independently of URL extension. |
| Extension | `3DTILES_draco_point_compression` | ✅ | Parse + decode input | Point-cloud compression metadata is passed to the decoder. |
| Extension | `3DTILES_batch_table_hierarchy` | ◐ v5.0 | Parse + property access | JSON class instances and inherited properties are accessible; unsupported binary hierarchy access rejects explicitly. |
| Metadata | `EXT_mesh_features` | ✅ v5.0 | Parse + preserve | Feature identifiers are retained for supported glTF payloads. |
| Metadata | `EXT_structural_metadata` | ✅ v5.0 | Parse + decode | Buffer-backed property-table columns decode when buffers are loaded. Raw values are retained for noData matching; row access applies class defaults. This does not decode arbitrary property textures. |
| Metadata | Metadata-derived bounding volumes | ✅ v5.0 | Culling | Supported schema semantics and numeric values are normalized into tile/content volumes. |
| Metadata | Style-input snapshots | ✅ v5.0 | Property access | Tileset/group/tile/content/batch precedence and source diagnostics; no style-language evaluation. |
| Runtime | Viewer request volumes | ✅ v5.0 | Request gating | Camera containment in transformed request volumes governs eligibility independently of render-content visibility. |
| Runtime | Traversal snapshots | ✅ v5.0 | Diagnostics | Sorted selection/request sets, counters, cache bytes, and optional implicit diagnostics; benchmark budgets are guidance, not performance guarantees. |
| Contract | Ordered content and feature IDs | ✅ v5.0 | Renderer input | `contentEntries`, `getContentEntry`, `isContentRenderable`, and raw `metadataContext` preserve legacy primary-content access. |
| Contract | Indexed/union visibility | ✅ v5.0 | Render culling | Explicit content bounds fall back to tile bounds; clipping planes do not prune the tile hierarchy. |
| Extension | Gaussian primitives | ◐ v5.0 | Parse + descriptors | Mesh/primitive descriptors preserve attributes and raw JSON; node transforms remain in the glTF scene graph. |
| Codec | SPZ v2/v3/v4 | ✅ v5.0 | Standalone decode | Public `SPZLoader` returns Arrow tables; explicit RUB/LUF options control coordinate conversion. |
| Extension | Embedded SPZ2 | ◐ v5.0 | Optional decode hook | Preserves compressed bytes when loaded and accepts an injected decoder; no automatic SPZ-to-glTF attribute conversion or count reconciliation. |
| Extension | Voxel primitives | ◐ v5.0 | Metadata-first reader | Shape index, positive dimensions, mode, and accessor references are checked; no dense sample decoding or shape interpretation. |
| Spatial | CRS and coordinate-epoch semantics | ✅ v5.0 | Parse + normalize | Inline semantics produce readonly `spatialMetadata`; explicit unknown and invalid epochs retain diagnostics. |
| Spatial | Draft CRS and georeference extensions | ◐ v5.0 | Parse + runtime transform | WKID/WKT2 metadata and recognized frames are preserved; requested target CRS transforms decoded content and conservative box/sphere bounds. Cross-epoch execution remains excluded. |
| Renderer | Vector drawing, styling, and clipping | — | Renderer | Vector descriptors and `clip` metadata are exposed without tessellation, styling, clipping, or draw calls. |
| Renderer | Voxel rendering and advanced draft features | — | Renderer/runtime | Voxel textures/ray marching, layer/visibility runtime semantics, horizon optimization, terrain draping, and clamping are unsupported. |
| Spatial | End-to-end nonlinear reprojection | ◐ | Runtime | Shared operations cover decoded content, traversal headers, normals, conservative box/sphere/region bounds, and nested-CRS composition; cross-epoch execution remains staged. |
| Renderer | Styling expressions | — | Renderer | Style evaluation and visual feature selection are outside this loader/runtime package. |
| Renderer | GPU upload and draw policy | — | Renderer | Applications such as deck.gl or Cesium decide how normalized payloads become draw calls. |

`◐` means partial support: the loader preserves or validates the feature, but does not yet
implement the complete runtime semantics. `—` means that the feature is intentionally not
implemented in the current module. This distinction prevents a parser-only capability from being
mistaken for end-to-end renderer support.

For the selection algorithm, see [screen-space error and LOD](../concepts/screen-space-error-and-lod).
For Gaussian, vector/CAD, and voxel extension boundaries, see [extension contracts](../concepts/gaussian-vector-voxel-extensions).
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
