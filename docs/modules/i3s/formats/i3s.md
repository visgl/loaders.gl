---
title: I3S format
description: A hierarchical scene-layer format for streaming large 3D geospatial datasets.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Hierarchical scene-layer format"
  title="Stream the scene layer the view can use."
  description="I3S organizes geometry, textures, attributes, and level-of-detail metadata into a node tree delivered through REST resources or Scene Layer Packages."
  tone="orange"
  meta={['I3S 1.7', 'OGC I3S 1.3', 'REST and SLPK']}
  links={[
    {label: 'I3S module', to: '/docs/modules/i3s'},
    {label: '3D data formats', to: '/docs/developer-guide/3d-data-formats'}
  ]}
/>

<DocOrientation
  eyebrow="The layer contract"
  title="Metadata, hierarchy, and payloads travel together."
  description="An I3S layer describes its profile and spatial reference before the source requests nodes. The runtime can then schedule geometry, textures, attributes, and point data according to visibility and level of detail."
  tone="orange"
  items={[
    {label: 'Profiles', value: '3D Object, Integrated Mesh, Building, Point'},
    {label: 'Delivery', value: 'REST resources or .slpk archives'},
    {label: 'Traversal', value: 'Node pages, bounds, and level of detail'},
    {label: 'Payloads', value: 'Mesh, textures, attributes, or LEPCC points'}
  ]}
/>

- _[`@loaders.gl/i3s`](/docs/modules/i3s)_
- _[I3S community specification](https://github.com/Esri/i3s-spec)_
- _[OGC I3S Community Standard](https://www.ogc.org/standard/i3s/)_

![arcgis-logo](../../../images/logos/arcgis-logo.svg)

Indexed 3D Scene Layer (I3S) is a hierarchical, streamable format for large geospatial 3D
datasets. A scene layer organizes geometry, textures, attributes, and level-of-detail information
into a node tree. It can be delivered through REST resources or packaged as a Scene Layer Package
(`.slpk`).

<ReferenceBoundary
  title="I3S profiles and conformance"
  description="The sections below cover supported profiles, specification generations, delivery forms, and the exact loaders.gl compatibility boundaries."
  tone="orange"
/>

## Compatibility at a glance

The tables below describe loaders.gl behavior in the current 5.0 development line. Support is
capability-based rather than inferred only from the version string in a layer document.

- **Supported** means the capability has an implementation and focused test coverage.
- **Partial** means a useful subset is implemented; the notes state the boundary.
- **Not supported** identifies a known gap rather than an untested claim.
- **Since** is the earliest stable loaders.gl release containing the implemented capability or
  useful subset. A dash means there is no implementation to date. **v5.0** entries are bolded to
  distinguish work added on the current development line.

A supported loader capability does not imply that every renderer implements the corresponding
visual effect. The [`I3SLoader`](../api-reference/i3s-loader) parses I3S resources, while
[`I3SSource`](/docs/modules/tiles/api-reference/i3s-source) and
[`Tileset3D`](/docs/modules/tiles/api-reference/tileset-3d) provide traversal, scheduling, and
caching.

The main **v5.0** I3S additions are the formal `I3SSource` API, archive-backed `SLPKSource`
traversal, lightweight metadata loaders with parser preloading, forward-compatible metadata
schemas, and complete PBR texture-set loading. The underlying mesh parser and most rendering capabilities predate v5.0 and retain their
original introduction versions below.

Point Cloud support in v5.0 is exposed through `I3SPointCloudSource`, a dependency-free TypeScript
LEPCC decoder, and the generic `PointCloudTileset` traversal API. The source supports REST layers
and SLPK archives while preserving explicit boundaries for producer-specific extensions.

The machine-readable [`I3S_CONFORMANCE_PROFILES`](../api-reference/i3s-loader) manifest records
the Esri community version, corresponding OGC profile, delivery forms, capability status, and
earliest loaders.gl release for each tested combination. It is deliberately narrower than a
blanket certification claim: a profile is listed only when its resource layout has a deterministic
fixture and unsupported semantics are reported explicitly.

For the current OGC Community Standard, the mapping used by the manifest is: MeshPyramids,
Integrated Mesh, 3D Object, Building, and Point profiles at community version 1.7 map to OGC I3S
1.3; Point Cloud community version 2.0 maps to OGC I3S 1.3. Later Esri revisions are tracked as
forward-compatible community profiles until a corresponding normative OGC fixture is available.

### Scene layer profiles

| Profile | Status | Since | Notes |
| --- | :---: | :---: | --- |
| 3D Object | **Supported** | v2.0 | End-to-end metadata, mesh, texture, feature ID, attribute, and traversal support. Feature IDs and full attribute loading arrived in later releases as detailed below. |
| Integrated Mesh | **Supported** | v2.0 | End-to-end textured-mesh loading and traversal. Feature-level operations are naturally narrower because this profile does not model discrete objects in the same way as 3D Object layers. |
| Building Scene Layer | **Partial** | v3.1 | `I3SBuildingSceneLayerLoader` parses the composite hierarchy and returns its renderable 3D Object and Point sublayers. Group structure remains in the header; Building filters are not evaluated by the loader. Point sublayers were added in **v5.0**. |
| Point | **Supported** | **v5.0** | `pointNodePages`, Draco point geometry, feature IDs, node-local attributes, point-list topology, and typed PointSymbol3D/renderer metadata are exposed through the standard I3S source. Expressions are preserved as metadata for downstream evaluation. |
| Point Cloud | **Supported** | **v5.0** | `I3SPointCloudSource` traverses I3S 2.x node pages, decodes LEPCC XYZ/RGB/intensity/flag resources, and returns point-list Arrow tables for REST and SLPK inputs. |

### Specification generations

The current community specification defines version 1.10 for mesh, Point, and Building profiles,
and version 2.1 for Point Cloud. loaders.gl does not claim blanket conformance to every feature in
those versions.

| Generation | Status | Since | Notes |
| --- | :---: | :---: | --- |
| I3S 1.6 mesh resources | **Partial** | v2.0 | Legacy `/nodes/{id}` hierarchies and uncompressed `defaultGeometrySchema` buffers are supported. Shared-resource materials are normalized from the first legacy definition, and appended mesh-segmentation payloads are retained but not decoded into draw segments. |
| I3S 1.7 mesh resources | **Supported** | v2.3 | Node pages, OBBs, and geometry definitions arrived in v2.3; Draco geometry, material definitions, and texture-set selection followed in v3.0. |
| I3S 1.8 mesh additions | **Supported** | v3.1 | KTX2/Basis textures and PBR material fields used by the rendering path are supported, subject to the material limitations below. |
| I3S 1.9-1.10 mesh documents | **Partial** | **v5.0** | Forward fields are preserved by v5.0 metadata schemas, dedicated 1.9/1.10 fixtures cover the scene-layer envelope, and established mesh resource layouts are consumed. Newer semantics remain bounded by the feature rows below. |
| I3S 1.7-1.10 Point | **Supported** | **v5.0** | Point-profile schemas, `pointNodePages`, required Draco geometry, feature-index metadata, symbols, and attributes are covered by a representative two-feature conformance fixture. |
| I3S 2.0-2.1 Point Cloud | **Partial** | **v5.0** | The Point Cloud source covers node pages, OBB bounds, LEPCC resources, standard attributes, and density thresholds. Producer-specific encodings and full renderer styling remain explicit follow-up work. |

### Delivery and resource access

| Capability | Status | Since | Notes |
| --- | :---: | :---: | --- |
| SceneServer / i3sREST resources | **Supported** | v2.0 | Loads a layer document and resolves node pages, nodes, geometries, textures, and attributes on demand. The formal `I3SSource` interface was added in **v5.0**. |
| ArcGIS SceneServer source facade | **Supported** | **v5.0** | `ArcGISSceneServerSource` normalizes a SceneServer layer and creates the existing mesh, Point, or Point Cloud source, preserving authentication and custom fetch options. |
| Cloud/object-store REST layouts | **Supported** | v2.0 | Relative resources are resolved from the layer URL; custom fetch support was added in v3.2 for application-specific transport. |
| ArcGIS token propagation | **Partial** | v3.1 | `I3SSource` appends `i3s.token` to the initial layer request as well as node, geometry, texture, and attribute requests. A direct `load(url, I3SLoader, ...)` call still needs the token in the input URL or authenticated fetch handling because core fetches the root before the parser runs. |
| Lightweight metadata loaders and preloading | **Supported** | **v5.0** | Root exports carry loader metadata and dynamically preload parser-bearing implementations, reducing eager imports without changing async `load` behavior. |
| SLPK archive traversal | **Supported** | **v5.0** | `SLPKSource` gives `Tileset3D` random access to URL- or `Blob`-backed archives through the same `I3SSource` contract used by REST layers. |
| Individual SLPK resource extraction | **Supported** | v3.4 | `SLPKLoader` and `parseSLPKArchive` expose raw or HTTP-style path access, gzip decompression, and hashed-index lookup. `I3SLoader` itself intentionally does not accept an SLPK byte stream. |
| Extracted SLPK / local resource tree | **Partial** | v2.0 | Works when resources are exposed through a compatible URL or custom fetch path. There is no separate high-level ESLPK directory source. |
| ArcGIS WebScene discovery | **Partial** | v3.2 | `ArcGISWebSceneLoader` discovers ArcGIS scene-service, Integrated Mesh, Building, and Group layers, validates every supported non-Group layer as WGS84 (`WKID 4326`), and reports unsupported operational layers. |
| Offline SLPK server | **Supported** | v4.0 | The `i3s-server` utility in `@loaders.gl/tile-converter` serves an SLPK or extracted converter output as SceneServer-compatible endpoints. |

### Hierarchy, bounds, and runtime

| Capability | Status | Since | Notes |
| --- | :---: | :---: | --- |
| Node pages | **Supported** | v2.3 | Pages are fetched lazily and coalesced when multiple child requests need the same page. |
| Legacy 3D node index documents | **Supported** | v2.0 | `/nodes/root` and child node documents are loaded lazily when node pages are absent. |
| Minimum bounding sphere (MBS) | **Supported** | v2.0 | Geographic centers are converted to Cartesian bounding spheres for culling and traversal. |
| Oriented bounding box (OBB) | **Supported** | v2.0 | OBBs are converted to Cartesian boxes and conservative spheres. |
| `maxScreenThreshold` LOD | **Supported** | v2.0 | Projected node size drives refinement for legacy node documents. |
| `maxScreenThresholdSQ` LOD | **Supported** | v2.3 | Node-page thresholds are normalized for the same projected-size traversal. |
| `screenSpaceRelative` LOD | **Supported** | **v5.0** | Point-profile scale thresholds are evaluated against the projected node diameter relative to viewport height. |
| `distanceRangeFromDefaultCamera` LOD | **Supported** | **v5.0** | Point-profile distance thresholds refine nodes as the camera approaches the bounding volume. |
| Density-threshold LOD | **Supported** | **v5.0** | Point Cloud node thresholds can drive projected point-density refinement through `PointCloudTileset`. Feature-count and texel-resolution resource-cost heuristics remain application-managed. |
| `REPLACE` refinement | **Supported** | v2.1 | I3S mesh ancestors are replaced as higher-detail children become renderable. |
| Lazy child metadata | **Supported** | v2.1 | Child headers are requested only when traversal reaches them. |
| Multiple viewports | **Supported** | v3.2.6 | Pending child-header requests are tracked independently by viewport and frame. |
| Request scheduling and cache eviction | **Supported** | v2.1 | Uses the shared `Tileset3D` request scheduler, loaded-tile cache, memory accounting, and callbacks. |
| Layer and node metadata preservation | **Supported** | **v5.0** | Unrecognized layer fields, legacy node-document fields, and node-page extension fields pass through normalized headers for application use. Typed forward-compatible input schemas were added in **v5.0**. |

### Mesh geometry

| Capability | Status | Since | Notes |
| --- | :---: | :---: | --- |
| Uncompressed binary geometry | **Supported** | v2.0 | Parses schema-described headers, vertex attributes, and feature attributes used by 1.6-compatible mesh resources. |
| Draco-compressed geometry | **Supported** | v3.0 | Decodes indexed geometry and I3S Draco metadata, including scale values and feature-ID tables. Uncompressed geometry is used as fallback when requested or available. |
| Triangle topology | **Supported** | v2.0 | Mesh content is normalized for triangle rendering. Other primitive topologies are not part of the supported I3S mesh path. |
| Positions | **Supported** | v2.0 | Converts geographic offsets to WGS84 Cartesian meter offsets, or exposes longitude/latitude offsets when selected. |
| Normals | **Supported** | v2.0 | Preserved when present in uncompressed or Draco geometry. |
| Vertex colors | **Supported** | v2.0 | RGB/RGBA byte colors are exposed as normalized attributes. |
| Texture coordinates | **Supported** | v2.0 | The primary `uv0` set is exposed as `texCoords`. |
| Texture-atlas regions | **Supported** | v3.0 | `uv-region` / `region` values are exposed as normalized attributes for atlas-aware rendering. |
| Feature IDs | **Supported** | v3.0 | Expands uncompressed face ranges and Draco feature-index metadata into per-vertex feature IDs. |
| Mesh indices | **Supported** | v3.0 | Draco indices are preserved; uncompressed I3S face order is represented by the expanded vertex stream. |
| Multiple UV sets | **Supported** | **v5.0** | Uncompressed `uv1` and Draco `TEXCOORD_n` attributes are exposed as `texCoords1`, `texCoords2`, and so on. |
| Legacy mesh segmentation | **Supported** | **v5.0** | Feature ID and inclusive face ranges are decoded into `drawRanges` with primitive and draw-element offsets. Unknown trailing producer bytes remain available as `meshSegmentation`. |
| 64-bit geometry attributes | **Partial** | **v5.0** | UInt64 values are returned in a `Float64Array` and preserved exactly through `Number.MAX_SAFE_INTEGER`; larger values cannot be represented exactly. Signed 64-bit geometry attributes are not decoded. |

### Point-cloud geometry and attributes

| Capability | Status | Since | Notes |
| --- | :---: | --- | --- |
| LEPCC point-cloud attribute blobs | **Supported** | **v5.0** | `I3SLEPCCDecoder` decodes standalone `lepcc-xyz`, `lepcc-rgb`, `lepcc-intensity`, and bit-stuffed or Huffman flag-byte resources. `I3SPointCloudSource` maps them to Arrow point attributes. |
| Point Cloud standard attributes | **Partial** | **v5.0** | RGB, intensity, flags, and metadata-described scalar arrays are normalized. Classification, returns, and producer-defined bit fields are preserved as raw attributes when no canonical mapping is declared. |

### Point geometry and styling metadata

| Capability | Status | Since | Notes |
| --- | :---: | :---: | --- |
| Draco point geometry | **Supported** | **v5.0** | Required Point-profile `position` and `feature-index` attributes are decoded through the existing Draco path and returned with `point-list` topology. |
| Point feature IDs and attributes | **Supported** | **v5.0** | Draco feature-ID tables align point vertices with the same typed node-local attribute resources used by mesh profiles, including OID fields named `FID` or other producer-specific names. |
| PointSymbol3D metadata | **Supported** | **v5.0** | Simple renderer symbols, ordered symbol layers, primitive/external resource declarations, material, dimensions, and forward fields are preserved as typed metadata on tileset, tile, and content results. |
| Classified Point renderers | **Partial** | **v5.0** | Complete renderer definitions, visual variables, labels, and popup expressions pass through typed metadata without loss; the loader intentionally does not evaluate them. |

### Textures and materials

| Capability | Status | Since | Notes |
| --- | :---: | :---: | --- |
| JPEG and PNG | **Supported** | v2.0 | Decoded through the image loaders, with a bitmap fallback path for mislabeled image resources. |
| DDS / S3TC | **Supported** | v3.0 | Selected when the runtime advertises S3TC support; decoding is provided by `CompressedTextureLoader`. |
| KTX / ETC2 | **Supported** | v3.0 | Selected when the runtime advertises ETC2 support; decoding is provided by `CompressedTextureLoader`. |
| KTX2 / Basis Universal | **Supported** | v3.1 | Decoded or transcoded through `BasisLoader`; used as the compressed fallback even when direct GPU compression is unavailable. |
| Runtime texture-format negotiation | **Supported** | v3.0 | Prefers a GPU-compatible compressed representation, then KTX2, JPEG, and PNG. `useCompressedTextures` can disable compressed choices. |
| Return undecoded texture bytes | **Supported** | v3.1 | `decodeTextures: false` preserves the selected texture as an `ArrayBuffer`. |
| Texture atlases | **Supported** | v3.0 | Primary atlas texture plus UV-region attributes are exposed. |
| PBR base color | **Supported** | v3.0 | Base-color factors and the base-color texture are normalized to a glTF-style material. |
| Alpha and basic material state | **Supported** | v3.0 | Alpha mode/cutoff, emissive factor, double-sided state, and other declared material fields are preserved or normalized. |
| Metallic, roughness, normal, occlusion, and emissive textures | **Supported** | **v5.0** | Every declared material texture slot is resolved to its selected texture-set resource and attached independently when that resource is available. |
| Multiple texture atlases or UV sets per mesh | **Supported** | **v5.0** | Multiple referenced texture sets can be loaded and every available UV attribute stream is exposed with a stable set index. |
| Texture wrap semantics | **Supported** | **v5.0** | Legacy `none`, `repeat`, and `mirror` declarations are preserved and mapped to glTF/WebGL `CLAMP_TO_EDGE` (33071), `REPEAT` (10497), and `MIRRORED_REPEAT` (33648) sampler constants. |

### Features, attributes, and styling

| Capability | Status | Since | Notes |
| --- | :---: | :---: | --- |
| Feature-to-geometry association | **Supported** | v3.0 | Feature IDs are exposed for 3D Object picking and application-level styling. |
| Per-feature attribute resource loading | **Supported** | v2.3 | `loadFeatureAttributes` loads a node's field resources and returns the values for a selected object ID. |
| String attributes | **Supported** | v2.3 | Variable-length UTF-8 strings are decoded. |
| OID32 and UInt32 attributes | **Supported** | v2.3 | Object IDs and common unsigned integer values are decoded. |
| Float64 attributes | **Supported** | v2.3 | Double-precision attribute values are decoded. |
| Int16 attributes | **Supported** | v3.1 | Used by tested Building Scene Layer attribute resources. |
| Typed numeric attributes (UInt8/16/32/64, Int16/32/64, Float32/64) | **Supported** | **v5.0** | Declared numeric types are decoded into matching typed arrays; 64-bit integers use `Float64Array` and are exact through `Number.MAX_SAFE_INTEGER`. |
| Date attributes | **Supported** | **v5.0** | `esriFieldTypeDate` values are normalized to ISO 8601 UTC strings from epoch-millisecond payloads. |
| GUID and GlobalID attributes | **Supported** | **v5.0** | GUID string payloads are preserved after UTF-8 and null-terminator decoding. |
| Null numeric values | **Supported** | **v5.0** | Numeric `NaN` sentinels are returned as `null`; unavailable resources retain the legacy empty-string fallback. |
| Coded-value domains | **Supported** | v3.0 | Numeric domain codes are mapped to their display names when loading a selected feature. |
| Attribute-driven colorization | **Supported** | v3.3 | Numeric attributes can replace or multiply vertex colors through `colorsByAttribute`. |
| Layer statistics | **Supported** | **v5.0** | `loadStatistics` fetches typed `StatsInfo` resources keyed by `statisticsInfo.key`; unavailable fields resolve to `null`. Query and client-side aggregation APIs remain open. |
| Popup and drawing metadata | **Supported** | **v5.0** | Renderer, visual-variable, label, and popup definitions are normalized into typed metadata while raw definitions and unknown properties remain available. Runtime expression evaluation is intentionally delegated to applications. |
| Server-side attribute query/filter | **Supported** | **v5.0** | `ArcGISSceneServerSource.query` supports authenticated filters, geometry constraints, field selection, pagination parameters, and cancellation. |

### Coordinate systems and scene semantics

See [Coordinate reference systems in I3S](../concepts/coordinate-reference-systems) for discovery
precedence, wire-axis order, height models, geoid conversion, elevation placement, and the staged
transformation boundary. The framework-wide [vertical coordinate systems and elevation placement
guide](/docs/developer-guide/vertical-coordinate-systems) documents exact formulas and provider
contracts.

| Capability | Status | Since | Notes |
| --- | :---: | :---: | --- |
| WGS84 geographic layers | **Supported** | v2.0 | Geometry, extents, MBSs, and OBB centers are interpreted as longitude, latitude, and elevation on the WGS84 ellipsoid. |
| Normalized CRS discovery metadata | **Supported** | **v5.0** | WKID aliases, WKT, VCS, height model, axis order, provenance, and placement qualifications are exposed on loader, source, service, and tileset results. |
| Cartesian meter-offset output | **Supported** | v2.0 | This is the default geometry representation for deck.gl-compatible rendering. |
| Longitude/latitude-offset output | **Supported** | v3.1 | Select with `i3s.coordinateSystem: 'lnglat-offsets'`. |
| Projected or custom horizontal CRS | **Supported** | **v5.0** | Mesh and Point Cloud sources transform vertices, stable origins, normals, and parallel `spatialBoundingVolume` metadata into supported Proj4 target definitions while retaining WGS84 traversal bounds. EPSG:4978 uses the WGS84 geocentric path. Custom definitions must be registered explicitly. The WebScene loader retains its WGS84 boundary. |
| Vertical CRS, units, and height models | **Supported** | **v5.0** | Mesh and Point Cloud sources normalize `ZFactor` or `heightUnit`, preserve VCS metadata, and convert ellipsoidal/orthometric heights with an application-supplied `@math.gl/geoid` model. |
| `elevationInfo` placement modes | **Supported** | **v5.0** | `absoluteHeight`, `onTheGround`, `relativeToGround`, and `relativeToScene` are applied to content and bounds. Ground and scene modes require the corresponding application elevation provider; feature-expression evaluation remains renderer work. |

### Authoring, conversion, and validation

These rows describe related `@loaders.gl/tile-converter` utilities rather than the browser loading
path.

| Capability | Status | Since | Notes |
| --- | :---: | :---: | --- |
| I3S to 3D Tiles conversion | **Supported** | v3.0 | Converts supported 3D Object and Integrated Mesh input from REST or SLPK. SLPK input was added in v4.2. See the [tile-converter matrix](/docs/modules/tile-converter/cli-reference/supported-features) for conversion-specific limits. |
| 3D Tiles to I3S conversion | **Supported** | v3.0 | Produces I3S 1.8 mesh layers and SLPK output, with optional Draco, KTX2/JPEG generation, feature metadata, and generated bounds. |
| SLPK / SceneServer serving | **Supported** | v4.0 | `i3s-server` exposes converter output or an SLPK through local REST endpoints. |
| Metadata schema validation | **Supported** | **v5.0** | Zod and generated JSON schemas cover mesh, Point, and Point Cloud scene-layer/node-page structures with forward-compatible passthrough fields. Profile capability reports distinguish supported, partial, unsupported, and malformed features. |
| Native Point or Point Cloud authoring | **Planned** | — | Generic typed-table writers and LEPCC encoding remain the next authoring tranche; existing conversion output remains mesh-focused. |

## I3S roadmap

The matrix turns I3S priorities into measurable tranches. The long-term target is for every current
mesh and point profile to have either end-to-end support or an explicit, tested boundary, with
renderer-ready semantics and conformance fixtures. The tranche list below is the delivery sequence;
the sub-tranches under feature intelligence keep the remaining gaps independently shippable:

| Tranche | Outcome | Status |
| --- | --- | :---: |
| 0. Conformance foundation | Freeze the matrix, keep representative 1.6–1.10 fixtures, and run automated support-status checks. | **Complete** |
| 1. Correctness hardening | Make root authentication, node metadata passthrough, UInt64 precision, and WebScene CRS validation match the documented boundaries. | **Complete** |
| 2. 1.10 mesh parity | Add legacy shared-resource material interpretation and mesh-segmentation preservation, then expand 1.9/1.10 conformance fixtures. | **Complete** |
| 3. Material fidelity | Load complete PBR texture sets, preserve multiple referenced atlases, and carry sampler wrap semantics into material metadata. | **Complete** |
| 4a. Feature attribute semantics | Decode declared numeric types, dates, GUIDs, coded domains, and null sentinels with deterministic output. | **Complete** |
| 4b. Layer statistics | Load typed `StatsInfo` resources, preserve missing-field isolation, and expose stable keys to applications. | **Complete** (**v5.0**) |
| 4c. Drawing and popup intelligence | Normalize renderer, visual variables, labels, and popup expressions as typed metadata while preserving unsupported definitions; evaluation remains an application concern. | **In progress** (**v5.0**) |
| 4d. Query and aggregation | Add authenticated SceneServer query helpers and client-side statistics aggregation over loaded features. | **In progress** (**v5.0**) |
| 5a. Point Cloud profile model | Add Point Cloud scene-layer schemas, node-page types, OBB bounds, and metadata preservation. | **Complete** (**v5.0**) |
| 5b. LEPCC geometry | Decode `lepcc-xyz` with checksum validation and point-count checks. | **Complete** (**v5.0**) |
| 5c. Point Cloud attributes | Decode RGB, intensity, flags, and metadata-described scalar resources into Arrow attributes. | **Complete** (**v5.0**) |
| 5d. Density traversal | Add density-threshold refinement to the shared point-cloud traversal and honor per-node thresholds. | **Complete** (**v5.0**) |
| 5e. REST and SLPK access | Resolve Point Cloud node pages and resources from SceneServer URLs and indexed SLPK archives. | **Complete** (**v5.0**) |
| 5f. Renderer metadata | Return point-list tables, coordinate-system/origin metadata, bounds, and stable canonical attribute names. | **Complete** (**v5.0**) |
| 5g. Point Cloud conformance | Add deterministic decoder/source fixtures and document unsupported producer-specific extensions. | **Complete** (**v5.0**) |
| 5h. Point profile support | Decode Point geometry, symbols, attributes, and renderer metadata with representative fixtures. | **Complete** (**v5.0**) |
| 6a. Horizontal CRS transforms | Reproject supported projected and geographic layer/node coordinates into the requested output coordinate system, with axis-order and unit tests. | **Complete** (**v5.0**) |
| 6b. Vertical CRS and elevation | Resolve vertical CRS units and apply every `elevationInfo` mode, including offsets, terrain, scene surfaces, and geoid conversion. | **Complete** (**v5.0**) |
| 6c. Precision and dateline handling | Preserve Float64 source precision through origin-relative output, and cover antimeridian/dateline bounds without discontinuities. | **Complete** (**v5.0**) |
| 7a. Profile schema validation | Add discriminated schemas for Point Cloud and mesh profiles, including required index/geometry fields and conditional profile checks. | **Complete** (**v5.0**) |
| 7b. Cross-profile conformance | Build a fixture matrix for mesh and Point Cloud metadata, malformed profiles, LOD, attributes, and renderer metadata. | **Complete** (**v5.0**) |
| 7c. Authoring parity | Add Point/Point Cloud converter output and make generated resources pass the same loader and conformance fixtures. | Planned |
| 8a. ArcGIS SceneServer source | Provide a typed service facade and registry entry that selects the existing mesh or Point Cloud source for an explicit SceneServer layer. | **Complete** (**v5.0**) |
| 8b. Service discovery and selection | Extend ArcGIS capability discovery to recognize SceneServer metadata and select compatible mesh, Point, and Point Cloud layers. | **In progress** (**v5.0**) |

| Mesh renderer fidelity | Decode mesh-segmentation draw ranges, expose additional UV sets, map sampler wrapping, and support all standard mesh/Point LOD policies. | **Complete** (**v5.0**) |

The next high-value work is conformance-matrix expansion, Point/Point Cloud authoring, and delivery
edge-case hardening. Renderer expression evaluation remains outside the loader contract.

### Remaining roadmap gaps

The completed tranches establish a strong 3D Object mesh baseline, but the following boundaries are
still visible in the matrix and should be treated as the open work list:

| Priority | Remaining gap | Exit criteria |
| --- | --- | --- |
| P0 | Drawing and popup metadata (4c) | Normalize supported renderers, visual variables, labels, and popup expressions while retaining raw definitions and documenting the downstream evaluation boundary. |
| P1 | Feature queries and aggregation (4d) | Add authenticated SceneServer attribute query/filter helpers and client-side aggregation over loaded feature batches. |
| P1 | Service discovery and selection (8b) | Recognize SceneServer entries in ArcGIS service directories and select compatible mesh, Point, and Point Cloud layer endpoints. |
| P0 | Version/profile conformance diagnostics | Add a table-driven Esri 1.6–1.10 / Point Cloud 2.0–2.1 and OGC-mapping fixture manifest with capability reports and CI assertions. |
| P2 | Authoring parity (7c) | Add Point/Point Cloud converter output and make generated resources pass the profile and semantic tests now covering the loaders. |
| P2 | Delivery edge cases | Resolve direct-load token propagation, provide a first-class extracted-SLPK source, and cover mixed REST/object-store authentication in tests. |

The roadmap is considered substantially complete when every P0 and P1 row is complete and the P2
rows have either landed or an explicit, versioned compatibility boundary. Renderer expression
evaluation is intentionally outside the loader contract; loaders.gl guarantees typed metadata and
loss-minimized preservation for downstream rendering systems.

## Related specifications and documentation

- [Current I3S format specification](https://github.com/Esri/i3s-spec/blob/master/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md)
- [I3S version history](https://github.com/Esri/i3s-spec/blob/master/version_history.md)
- [I3S texture resources](https://github.com/Esri/i3s-spec/blob/master/docs/1.10/texture.cmn.md)
- [I3S Point Cloud layer definition](https://github.com/Esri/i3s-spec/blob/master/docs/2.1/layer.pcsl.md)
- [`I3SLoader` API](../api-reference/i3s-loader)
- [`I3SSource` API](/docs/modules/tiles/api-reference/i3s-source)
- [Tile converter supported features](/docs/modules/tile-converter/cli-reference/supported-features)
