# I3S

- _[`@loaders.gl/i3s`](/docs/modules/i3s)_
- _[I3S community specification](https://github.com/Esri/i3s-spec)_
- _[OGC I3S Community Standard](https://www.ogc.org/standard/i3s/)_

Indexed 3D Scene Layer (I3S) is a hierarchical, streamable format for large geospatial 3D
datasets. A scene layer organizes geometry, textures, attributes, and level-of-detail information
into a node tree. It can be delivered through REST resources or packaged as a Scene Layer Package
(`.slpk`).

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

The Point Cloud decoder seam added in v5.0 currently uses the browser WebAssembly build of
[`@bitruvius/turbo-lepcc`](https://www.npmjs.com/package/@bitruvius/turbo-lepcc), which is a
proprietary third-party dependency. It is isolated behind `I3SLEPCCDecoder` while licensing and
long-term maintenance are evaluated; a native decoder remains the fallback if that dependency
cannot be adopted.

### Scene layer profiles

| Profile | Status | Since | Notes |
| --- | :---: | :---: | --- |
| 3D Object | **Supported** | v2.0 | End-to-end metadata, mesh, texture, feature ID, attribute, and traversal support. Feature IDs and full attribute loading arrived in later releases as detailed below. |
| Integrated Mesh | **Supported** | v2.0 | End-to-end textured-mesh loading and traversal. Feature-level operations are naturally narrower because this profile does not model discrete objects in the same way as 3D Object layers. |
| Building Scene Layer | **Partial** | v3.1 | `I3SBuildingSceneLayerLoader` parses the composite hierarchy and returns its 3D Object sublayers. Group structure remains in the header; Point sublayers and Building filters are not evaluated by the loader. |
| Point | **Not supported** | — | Point geometry, symbols, and point renderers are not decoded. |
| Point Cloud | **Not supported** | — | I3S 2.x point-cloud node pages, density LOD, LEPCC geometry, and point-cloud attributes are not decoded. The loader rejects `PointCloud` layers explicitly. |

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
| I3S 2.0-2.1 Point Cloud | **Not supported** | — | The Point Cloud profile is outside the current mesh-oriented implementation. |

### Delivery and resource access

| Capability | Status | Since | Notes |
| --- | :---: | :---: | --- |
| SceneServer / i3sREST resources | **Supported** | v2.0 | Loads a layer document and resolves node pages, nodes, geometries, textures, and attributes on demand. The formal `I3SSource` interface was added in **v5.0**. |
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
| Other LOD metrics | **Not supported** | — | Density, feature-count, distance-range, and texel-resolution policies are not implemented. |
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
| Texture coordinates | **Supported** | v2.0 | The primary `uv0` set is exposed. |
| Texture-atlas regions | **Supported** | v3.0 | `uv-region` / `region` values are exposed as normalized attributes for atlas-aware rendering. |
| Feature IDs | **Supported** | v3.0 | Expands uncompressed face ranges and Draco feature-index metadata into per-vertex feature IDs. |
| Mesh indices | **Supported** | v3.0 | Draco indices are preserved; uncompressed I3S face order is represented by the expanded vertex stream. |
| Multiple UV sets | **Not supported** | — | Only the primary UV set is exposed. |
| Legacy mesh segmentation | **Partial** | **v5.0** | Bytes appended after schema-defined legacy geometry attributes are retained as `meshSegmentation`; the service-specific segment record is not yet decoded into renderer draw ranges. |
| 64-bit geometry attributes | **Partial** | **v5.0** | UInt64 values are returned in a `Float64Array` and preserved exactly through `Number.MAX_SAFE_INTEGER`; larger values cannot be represented exactly. Signed 64-bit geometry attributes are not decoded. |

### Point-cloud geometry and attributes

| Capability | Status | Since | Notes |
| --- | :---: | --- | --- |
| LEPCC point-cloud attribute blobs | **Partial** | **v5.0** | The `I3SLEPCCDecoder` adapter decodes standalone `lepcc-xyz`, `lepcc-rgb`, `lepcc-intensity`, and packed flag-byte resources. Point Cloud layer traversal, density LOD, and renderer integration remain planned. |

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
| Multiple texture atlases or UV sets per mesh | **Partial** | **v5.0** | Multiple referenced texture sets can be loaded, but only the primary `uv0` attribute is exposed; additional UV attribute streams remain a gap. |
| Texture wrap semantics | **Partial** | **v5.0** | Legacy `none`, `repeat`, and `mirror` declarations are preserved on material texture metadata. They are not yet converted into renderer-specific sampler constants. |

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
| Popup and drawing metadata | **Partial** | v2.0 | Metadata passes through for applications; popup expressions, renderer definitions, labels, and visual variables are not evaluated by the loader. |
| Server-side attribute query/filter | **Not supported** | — | The client loads node-local attribute resources; it does not implement SceneServer query operations. |

### Coordinate systems and scene semantics

| Capability | Status | Since | Notes |
| --- | :---: | :---: | --- |
| WGS84 geographic layers | **Supported** | v2.0 | Geometry, extents, MBSs, and OBB centers are interpreted as longitude, latitude, and elevation on the WGS84 ellipsoid. |
| Cartesian meter-offset output | **Supported** | v2.0 | This is the default geometry representation for deck.gl-compatible rendering. |
| Longitude/latitude-offset output | **Supported** | v3.1 | Select with `i3s.coordinateSystem: 'lnglat-offsets'`. |
| Projected or custom horizontal CRS | **Not supported** | — | `spatialReference` metadata is preserved but geometry is not reprojected. The WebScene loader rejects any supported layer whose horizontal CRS is not WGS84 (`WKID 4326`). |
| Vertical CRS and height models | **Not supported** | — | `heightModelInfo`, VCS WKIDs, and elevation units are preserved as metadata but are not transformed. |
| `elevationInfo` placement modes | **Not supported** | — | Ground-relative and scene-relative placement policies are not applied by the loader. |

### Authoring, conversion, and validation

These rows describe related `@loaders.gl/tile-converter` utilities rather than the browser loading
path.

| Capability | Status | Since | Notes |
| --- | :---: | :---: | --- |
| I3S to 3D Tiles conversion | **Supported** | v3.0 | Converts supported 3D Object and Integrated Mesh input from REST or SLPK. SLPK input was added in v4.2. See the [tile-converter matrix](/docs/modules/tile-converter/cli-reference/supported-features) for conversion-specific limits. |
| 3D Tiles to I3S conversion | **Supported** | v3.0 | Produces I3S 1.8 mesh layers and SLPK output, with optional Draco, KTX2/JPEG generation, feature metadata, and generated bounds. |
| SLPK / SceneServer serving | **Supported** | v4.0 | `i3s-server` exposes converter output or an SLPK through local REST endpoints. |
| Metadata schema validation | **Partial** | **v5.0** | Zod and generated JSON schemas cover mesh scene-layer and node-page structures with forward-compatible passthrough fields; this is not full I3S conformance validation. |
| Native Point or Point Cloud authoring | **Not supported** | — | The converter shares the mesh profile limits of the loaders. |

## I3S roadmap

The matrix turns I3S priorities into measurable tranches. **I3S supremacy** means that every current
mesh and point profile has either end-to-end support or an explicit, tested boundary, with renderer-
ready semantics and conformance fixtures. The tranche list below is the delivery sequence; the
sub-tranches under feature intelligence keep the remaining gaps independently shippable:

| Tranche | Outcome | Status |
| --- | --- | :---: |
| 0. Conformance foundation | Freeze the matrix, keep representative 1.6–1.10 fixtures, and run automated support-status checks. | **Complete** |
| 1. Correctness hardening | Make root authentication, node metadata passthrough, UInt64 precision, and WebScene CRS validation match the documented boundaries. | **Complete** |
| 2. 1.10 mesh parity | Add legacy shared-resource material interpretation and mesh-segmentation preservation, then expand 1.9/1.10 conformance fixtures. | **Complete** |
| 3. Material fidelity | Load complete PBR texture sets, preserve multiple referenced atlases, and carry sampler wrap semantics into material metadata. | **Complete** |
| 4a. Feature attribute semantics | Decode declared numeric types, dates, GUIDs, coded domains, and null sentinels with deterministic output. | **Complete** |
| 4b. Layer statistics | Load typed `StatsInfo` resources, preserve missing-field isolation, and expose stable keys to applications. | **Complete** (**v5.0**) |
| 4c. Drawing and popup intelligence | Evaluate renderer, visual variables, labels, and popup expressions while preserving unsupported definitions. | Planned |
| 4d. Query and aggregation | Add server-side attribute query/filter helpers and client-side statistics aggregation over loaded features. | Planned |
| 5. Profile coverage | Add Point, then I3S 2.1 Point Cloud (LEPCC and density-based traversal), including profile-specific attributes. | Planned |
| 6. Spatial semantics | Add projected and vertical CRS transforms plus `elevationInfo` placement modes. | Planned |
| 7. Validation and authoring parity | Expand schema validation and converter fixtures until supported loader and authoring paths have matching conformance guarantees. | Planned |

The next high-value tranche is **4c**, followed by **4d**. Tranches 5–7 close the remaining profile,
coordinate-system, and authoring gaps needed for full supremacy.

## Related specifications and documentation

- [Current I3S format specification](https://github.com/Esri/i3s-spec/blob/master/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md)
- [I3S version history](https://github.com/Esri/i3s-spec/blob/master/version_history.md)
- [I3S texture resources](https://github.com/Esri/i3s-spec/blob/master/docs/1.10/texture.cmn.md)
- [I3S Point Cloud layer definition](https://github.com/Esri/i3s-spec/blob/master/docs/2.1/layer.pcsl.md)
- [`I3SLoader` API](../api-reference/i3s-loader)
- [`I3SSource` API](/docs/modules/tiles/api-reference/i3s-source)
- [Tile converter supported features](/docs/modules/tile-converter/cli-reference/supported-features)
