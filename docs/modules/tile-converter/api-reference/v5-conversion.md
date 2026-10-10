---
title: Tile-converter v5 conversion core
description: Experimental platform-neutral contracts for inspecting, converting, and validating tilesets.
---

# Tile-converter v5 conversion core

The portable conversion core is available from `@loaders.gl/tile-converter/v5/core`. Format-specific codecs, Arrow mapping and archive packaging are available from `@loaders.gl/tile-converter/v5/adapters`. Both remain inside the tile-converter application; no code or dependencies are moved to the tiles module. The core has no Node.js imports. Input resolution, format codecs, destination writes, and validation are supplied by adapters so the core can run in browser or Node environments.

The current API exports `inspectTileset`, `convertTileset`, and `validateTileset`, together with types for sources, codecs, sinks, diagnostics, progress, and reports. `convertTileset` reads and converts one input resource at a time, awaits each destination write before requesting more output, supports `AbortSignal`, and reports resource and byte totals. Set `maxOutputResourceBytes` to reject an output resource that exceeds the configured per-resource budget. Policy and validation failures use `TileConversionError` with a stable code and associated diagnostics.

```ts
import {convertTileset} from '@loaders.gl/tile-converter/v5/core';

const report = await convertTileset({
  source,
  codec,
  sink,
  measureInputBytes: resource => resource.byteLength,
  measureOutputBytes: resource => resource.byteLength,
  maxOutputResourceBytes: 16 * 1024 * 1024,
  signal: abortController.signal,
  onProgress: progress => updateProgress(progress)
});
```

This API is experimental. The core provides source adapters and bounded browser sinks; the format adapters provide mesh and point-cloud codecs and archive packaging. Applications still supply input/output integration for other profiles; the legacy `I3SConverter` and `Tiles3DConverter` remain separate.

See the [conversion support matrix](/docs/modules/tile-converter/cli-reference/supported-features#experimental-v5-conversion-support)
for current input/output profiles, browser limits and remaining qualification work.

## Core and format adapters

The core entrypoint exports conversion contracts, inspection, validation, progress,
cancellation, resource limits, source-backed traversal, point-cloud traversal, spatial
preparation, bounded Blob sinks and manifest-backed sinks. It uses the existing tiles
and math dependencies without importing format encoders, Arrow construction or archive
writers. Applications initialize sources and supply codecs, sinks and validators.

The adapters entrypoint exports the existing mesh and point-cloud encoders, source mesh
extraction, Arrow feature mapping, bounded mesh output sinks and archive packaging. It
uses the core's shared functions, types and `TileConversionError`; there is one core
implementation per module format.

```ts
import {convertTileset, createTiles3DConversionSpatialContext} from '@loaders.gl/tile-converter/v5/core';
import {createMeshConversionCodec, createSingleMeshTilesetSink} from '@loaders.gl/tile-converter/v5/adapters';
```

Existing `/v5` and `/v5/browser` imports remain compatible and combine their previous
core and adapter exports. The split adds no package dependencies. CLI, v4 and Node
filesystem/service integration remain separate and unchanged. Core and adapters have
ESM, CommonJS and TypeScript declaration exports. The app still declares its existing
format and Node service dependencies; importing the core isolates its runtime and
bundle imports, but does not remove those installation dependencies.

## Draco mesh output

`createMeshConversionCodec` now encodes GLB geometry with lossless Draco Edge Breaker
by default, including GLBs packaged as 3TZ by the mesh sinks. Output requires
`KHR_draco_mesh_compression` support in the reader and contains no uncompressed geometry
fallback. Materials, encoded PNG/JPEG images, samplers and texture transforms are preserved;
images are not recompressed. `encodeMeshTile` remains the synchronous uncompressed encoder.

```ts
const codec = createMeshConversionCodec({
  spatialContext,
  maxPositionError: 0.01,
  // Set draco: false to generate uncompressed GLB geometry instead.
  // dracoLibraryOptions: {useLocalLibraries: true}
});
```

No attribute quantization is enabled. The codec verifies the decoded Float32 positions,
uses decoded vertex counts and bounds in the GLB accessors and placement metadata, and
retains the existing position-rounding budget. Draco may reorder vertices and triangles or
remove unused vertices. Compression is not guaranteed to reduce very small mesh files.

Encoding and verification need both Draco encoder and decoder runtimes. The optional
`dracoLibraryOptions` accepts the existing `LoadLibraryOptions` (`modules`, `CDN`,
`useLocalLibraries`) for applications that inject runtimes or serve local assets. The default
runtime uses the Draco module's CDN configuration. Browser deployments must allow these
assets through CORS and content security policy. The browser archive example runs this work
inside its conversion worker with bundled encoder/decoder assets; direct codec calls execute
in their caller's environment. Module workers evaluate the library wrappers, which must be
allowed by the application's content security policy.

`createI3SMeshConversionCodec` also uses lossless Draco Edge Breaker by default. It retains
the geographic Float32 rounding/precision budget and verifies oriented triangles, normals,
and feature-to-geometry ownership after decompression. Set `draco: false` to retain raw
I3S geometry. Pass `dracoLibraryOptions` to supply the full decoder and encoder runtimes;
`getDracoLibraryOptions()` from `@loaders.gl/draco/bundled` provides application asset URLs.
The browser example reuses its bundled full runtime for both archive formats.

Lossy presets, quantization controls, texture compression and broader external-viewer
qualification remain follow-up work. Per-resource byte gates do not bound Draco or
verification allocations. Degenerate triangles that Draco cannot preserve fail explicitly;
use raw output where needed.

## Archive output: 3TZ and SLPK

Use `createTileConversionArchive` from either v5 entrypoint to package the unmodified files
of a successfully finalized browser sink. The selected format requires resources already
encoded for that format. `createSingleMeshTilesetArchive` remains the narrower helper for
the two files from `createSingleMeshTilesetSink`.

```ts
import {createTileConversionArchive} from '@loaders.gl/tile-converter/v5/browser';

const archive = await createTileConversionArchive(sink.getFiles(), {
  format: 'slpk', // Use '3tz' for authored 3D Tiles resources instead.
  maxArchiveBytes: 16 * 1024 * 1024
});
const downloadUrl = URL.createObjectURL(archive);
// Save with the selected .slpk or .3tz extension; revoke after the application is done.
URL.revokeObjectURL(downloadUrl);
```

3TZ requires root `tileset.json`. SLPK requires root `3dSceneLayer.json.gz`, I3S node resources
and individually compressed resources with the archive path layout; PNG/JPEG stay encoded
as images. The format writers own ZIP/index encoding. Selecting `slpk` does not convert a
GLB into I3S geometry or generate scene-layer/node metadata. Use the I3S authoring codec and sink below to generate those resources from a
supported source mesh. Legacy v4 converters retain their broader I3S/SLPK conversion workflow.

Both outputs use deterministic STORE ZIP32 with populated local headers and final indexes.
The budget includes headers/index and is checked before Blob reads. The first SLPK profile
supports archives below 2 GiB; 3TZ stays below the ZIP64 sentinel. Both support at most
65,533 resources and canonical ASCII paths. Invalid formats, budgets, or duplicate IDs fail
explicitly. The output-size budget is not a peak-memory budget.
`encodeTileConversionArchiveInBatches` streams these resources in payload blocks of at most
64 KiB with consumer-controlled backpressure and cooperative cancellation between reads.
Applications must await writes, finalize storage only after iteration succeeds and discard
partial output on failure. ZIP64 and broader independent-viewer qualification remain future
work. The browser example can also interrupt synchronous work by terminating its disposable
worker. Applications own input qualification, download UI and object-URL lifetime.

See [SLPKWriter](/docs/modules/i3s/api-reference/slpk-writer) and
[Tiles3DArchiveWriter](/docs/modules/3d-tiles/api-reference/tiles-3d-archive-writer).

## Original I3S mesh sources

`createI3SMeshTilesetConversionSource` reads selected `3DObject` and `IntegratedMesh`
content through the shared camera-independent traversal. Construct a dedicated `Tileset3D`
runtime with `i3s.geometryMode: 'source'`, `i3s.decodeTextures: false` and
`i3s.useCompressedTextures: false` to select supported PNG/JPEG resources. Source decoding
reconstructs absolute Float64 positions from node offsets without per-vertex renderer
projection or Float32 placement. Normals retain the store's original vector basis, which the source forwards to both writer codecs. Runtime
header/bounds preparation still follows the runtime spatial policy.

```ts
const source = createI3SMeshTilesetConversionSource(tileset, {
  unloadContent: true,
  // Required for external textures/attributes; own byte limits, archive resolution,
  // authentication and decompression in this reader.
  readExternalResource: readEncodedResource
  // features: {schema, metadataClass, objectIdProperty, maxAttributeBytes}
  // Or getFeatures: applicationOwnedArrowMapper
});
const metadata = await source.inspect();
const spatialContext = createI3SConversionSpatialContext(metadata.spatialReference, {
  targetCrs: 'EPSG:4978'
});
const codec = createMeshConversionCodec({
  spatialContext,
  autoOrigin: true,
  maxPositionError: 0.01
});
```

Use the adapters entrypoint for the source and codec and the core entrypoint for the spatial
context. `autoOrigin` chooses the transformed bounds center before Float32 encoding;
its default is `false`, preserving existing explicit target origins. Pair this codec with the
bounded 3D Tiles sinks and optional 3TZ packaging. The I3S writer codec can also consume
these source resources and performs its own geographic rebasing.

The source preserves triangle positions, normals, one UV set, normalized basic PBR factors
and one encoded PNG/JPEG base-color texture. It reuses encoded texture bytes loaded with
`decodeTextures: false`, or reads a declared texture resource through `readExternalResource`.
Legacy singleton texture URLs without a material declaration are treated as base-color maps.
Header formats must match the image bytes; explicitly declared wrapping is retained. Image
subviews are preserved, source objects are not mutated, and pixels are never decoded or
transcoded. Decoded pixel images, extra maps/texture sets, UV regions, vertex colors,
additional producer attributes and opaque segmentation fail explicitly.

Nodes with feature IDs or layer attribute declarations require either `features` or
`getFeatures` (never both). The `features` option reads standard scalar/string resources in
layer declaration order through the same application reader, checks a per-node aggregate
encoded byte budget before parsing, and validates complete triangle ownership:

```ts
const source = createI3SMeshTilesetConversionSource(tileset, {
  unloadContent: true,
  readExternalResource: readEncodedResource,
  features: {
    metadataClass: 'buildings',
    objectIdProperty: 'OBJECTID', // Resource column matching geometry IDs.
    sourceFeatureIdProperty: 'stable_id', // Optional; defaults to objectIdProperty.
    maxAttributeBytes: 1024 * 1024,
    schema: {
      fields: [
        {name: 'feature_id', type: 'uint64', nullable: false},
        {name: 'name', type: 'utf8', nullable: true}
      ]
    }
  }
});
```

`objectIdProperty` maps geometry identifiers to attribute rows even when row order differs.
The selected stable-ID property populates `featureIdField` (default `feature_id`); the two
selected identifier columns are consumed by the mapping. Every other property must be mapped
by name in the explicit Arrow schema. All rows must own geometry and stable IDs must be unique.
Signed/unsigned 64-bit properties are decoded as `bigint`; strings preserve Unicode, whitespace,
empty strings and nulls. Numeric geometry IDs outside JavaScript's safe-integer range remain
rejected, since precision already lost during geometry decoding cannot be recovered from a
property resource. I3S output still requires explicit `integer64Encoding: 'decimal-string'`
for 64-bit target fields; GLB retains their integer representation.

Custom `getFeatures` remains available for domains/enums, dates, numeric noData/defaults,
raw metadata or nonstandard resource layouts. Those semantics are rejected by the initial
resource mapper. It does not infer a schema or stringify values. The reader must return
uncompressed attribute payloads; archive/authentication/token policy remains application-owned.
Cancellation and failed attribute/texture reads close shared traversal without emitting a partial
mesh. These resource gates run after reading and do not bound reader/decoder peak allocations.

Source positions retain their declared units, elevation reference and CRS. Supply the desired
output and any elevation providers to the shared conversion spatial context so geometry is
transformed once. Rendering runtimes should keep the default `geometryMode: 'render'`.
This is a bounded source profile, not qualification of every I3S dataset or appearance profile.

## Source mesh to I3S/SLPK

`createMeshTilesetConversionSource` connects a source-backed `Tileset3D` runtime to
`createI3SMeshConversionCodec` and `createSingleMeshI3SSink`. These APIs are exported from
both v5 entrypoints. The initial profile converts static GLB/B3DM primitives
from a native, resolved EPSG:4978 source to an I3S 1.7 3D Object layer. Enable decoded glTF
loading when constructing the runtime, including `gltf.decompressMeshes: true` for Draco
content. Triangle lists and indexed/non-indexed triangle strips are supported; strips become
triangle lists with alternating winding before placement and feature mapping. Triangle fans are
normalized by the glTF loader. Draco-compressed primitives are normalized to triangle lists
before source extraction. Vertex attributes and source buffers remain unchanged. Degenerate
strip connectors are retained and advance winding parity. Repeated-index connectors use the
first corner's feature row; nondegenerate mixed-feature triangles still fail.
Draco output may reject them, so select `draco: false` on the GLB or I3S codec when needed. Points, lines and primitive-restart indices remain unsupported. A region bounding volume or explicit CRS metadata
must establish the ECEF source frame; sphere/box bounds alone do not imply a CRS.

```ts
import {
  convertTileset,
  createMeshTilesetConversionSource,
  createI3SMeshConversionCodec,
  createSingleMeshI3SSink,
  createTiles3DConversionSpatialContext,
  createTileConversionArchive
} from '@loaders.gl/tile-converter/v5/browser';

const source = createMeshTilesetConversionSource(tileset, {
  unloadContent: true,
  features: {
    metadataClass: 'building',
    sourceFeatureIdProperty: 'source_id',
    featureIdField: 'source_id',
    integer64Encoding: 'decimal-string',
    schema: {fields: [
      {name: 'source_id', type: 'uint64', nullable: false},
      {name: 'label', type: 'utf8', nullable: true}
    ]}
  }
});
const inspection = await source.inspect();
const spatialContext = createTiles3DConversionSpatialContext(inspection.spatialReference!);
const sink = createSingleMeshI3SSink({maxTotalBytes: 16 * 1024 * 1024});
const report = await convertTileset({
  source,
  codec: createI3SMeshConversionCodec({
    spatialContext,
    maxPositionError: 0.001,
    maxResourceBytes: 8 * 1024 * 1024
  }),
  sink,
  measureInputBytes: resource => resource.mesh.attributes.POSITION.value.byteLength,
  measureOutputBytes: resource => Object.values(resource.files).reduce(
    (total, buffer) => total + buffer.byteLength, 0
  )
});
const archive = await createTileConversionArchive(sink.getFiles(), {
  format: 'slpk',
  maxArchiveBytes: 32 * 1024 * 1024
});
```

Omit `features` for unannotated geometry. Feature-bearing inputs require an explicit Arrow
schema. The source supports `_BATCHID` with decoded B3DM batch columns or one
`EXT_mesh_features` attribute set referencing one decoded `EXT_structural_metadata` table.
The declared class, counts, row indices, stable IDs, and geometry association are validated.
Missing defaults can be supplied by the decoded class. Untransformed scalar/string noData values restore null (or the declared default), including exact 64-bit sentinels. Enum/array mappings, transformed noData values and
64-bit property transforms require separate qualification. Unmapped properties fail rather than disappearing.

The source applies node placement, the glTF up axis, RTC center, and tile placement once.
Absolute positions remain Float64; normals use the inverse transpose of the placement.
The codec then applies the shared source-to-ECEF spatial context once. It reports measured
position rounding and explicitly authorized 64-bit decimal-string mappings in `report`.
The sink exposes files only after successful finalization and clears partial files on abort.
`createSingleMeshI3SSink` retains its one-mesh compatibility profile. Use `createI3SMeshSink` for up to 64 mesh placements sharing one feature schema and legacy geometry layout. The codec allocates disjoint generated object IDs across nodes.

The initial source rejects animation, skins, morphs, GPU instancing, mirrored or singular
placements, unmapped material/feature extensions, and tileset/group/tile/content
metadata that needs its own mapping. Decoded reader cleanup follows shared traversal; the
application still owns the runtime, worker, decoder, and archive lifetime. Synchronous
encoding cannot be interrupted by an AbortSignal mid-operation; applications can terminate a
disposable worker instead. Resource/retained-output/archive caps do
not constitute a total peak-memory budget.

Resources can also use the GLB codec and 3D Tiles/3TZ sink. The source
retains `TEXCOORD_0` (packed Float32 or normalized Uint8/Uint16) and one embedded PNG/JPEG
base-color image from a glTF buffer view or base64 data URI, including declared wrapping/filtering and
`KHR_texture_transform` offset/rotation/scale on `TEXCOORD_0`. Load source content with
`gltf.excludeExtensions: {KHR_texture_transform: false}` so the adapter receives the original
UVs and authored transform. The GLB writer retains the transform as a required extension;
conversion does not bake it into UVs. Encoded
image bytes are forwarded without pixel decoding or transcoding. Inline images accept
`data:image/png;base64,...` or `data:image/jpeg;base64,...`; an optional image `mimeType` must
match the URI. Base64 is decoded directly into a typed array without fetching the image;
the decoded encoded-image bytes count against the input gates. External image URLs require an injected `readExternalResource` reader on the mesh source.
Other data-URI encodings/MIME types,
other UV sets, texture-info extensions other than `KHR_texture_transform`,
texture/image/sampler extensions and other texture maps are
rejected. I3S preserves PNG/JPEG bytes and UVs, bakes the selected UV transform, and maps wrapping. Explicit texture filtering and vertex colors remain unsupported for I3S. GLB feature output supports one inline structural metadata table and one attribute-backed feature set. Scalar integer and float32/float64 columns and UTF-8 strings are supported; exact int64/uint64 values remain binary integers. Nullable scalar/string columns use an unused `noData` sentinel, failing if no collision-free sentinel exists. Nested/boolean/enum columns remain unsupported. Stable IDs must be unique; shared vertices are expanded to preserve triangle ownership through Draco. See [I3S mesh authoring](/docs/modules/i3s/api-reference/i3s-mesh-writer) for the
precise target property/null profile.

### Browser example

The [tile archive example](/examples/i3s-slpk) can inspect an explicit 3D Tiles URL,
convert selected static mesh contents to SLPK or 3TZ, and preview or
download the partial archive. Draco-compressed GLB/B3DM input is decoded with bundled
application assets before extraction. `createTileConversionResourceFetcher` shares one aggregate transport budget across selected contents and external buffers/images, forwards cancellation, and cancels response streams on failure. Applications may inject an archive-backed fetcher; the example uses HTTP(S). The
conversion error budget applies to the decoded source, rather than qualifying earlier source
quantization. The decoded byte gates run after extraction and do not cap decoder allocations.
It demonstrates the separate core and adapters entrypoints,
required byte/precision budgets, cancellation and explicit profile rejection. See the
[example README](https://github.com/visgl/loaders.gl/tree/master/examples/website/i3s-slpk)
for limits and supported inputs. The controls accept an explicit JSON `MeshSourceFeatureOptions` or `I3SMeshSourceFeatureOptions`
mapping for SLPK or 3TZ output; no schema is inferred. The decoded byte gate charges geometry, encoded base-color image bytes,
Arrow columns and triangle associations after extraction. Exact 64-bit decimal-string mappings are
reported as diagnostics. Untextured material factors are preserved in both formats; `COLOR_0` is
preserved for 3TZ and rejected for SLPK. PNG/JPEG base-color textures and `TEXCOORD_0` are preserved for both formats; I3S bakes UV transforms while GLB retains the extension.

### Partial mesh collections

`createMeshTilesetSink` (`/v5/adapters`) accepts independent mesh codec outputs with the
same ECEF frame and precision requirements as the single-mesh sink. Required options are
`maxTotalBytes`, `maxMeshes`, and `geometricError`. It emits deterministic relative GLB
resources and a contentless ADD root enclosing every placed leaf. Its geometric error
covers the enclosing diagonal; leaf errors retain the supplied source/rounding budget.
Unique source placement
IDs are required. Final JSON counts toward the retained-output budget; failed conversion
aborts all output. Applications own source selection and conservative geometric error.
This flat collection does not reproduce a source LOD hierarchy.

The [tile archive example](https://loaders.gl/examples/i3s-slpk) supports up to 64 explicitly
selected leaf contents and at most 64 total primitive placements for either archive format, with aggregate input/decoded byte gates.
`createI3SMeshSink` requires `maxTotalBytes`, `maxMeshes` (1–64), and `maxResourceBytes`. It rebuilds legacy and paged indices, per-node material/texture references, and enclosing ECEF bounds. The 64th leaf uses a second node page. All nodes must share feature fields and the legacy geometry layout; schema mismatches abort the collection. Directly authored resources must allocate disjoint `objectIdOffset` ranges. Final metadata counts against byte budgets; unfinished/failed sinks expose no files. Source hierarchy/refinement preservation remains separate work.

### Browser worker execution

The archive viewer example runs selected-content loading, decoding, conversion and packaging in
one disposable module worker per operation. It transfers acknowledged archive chunks one at a
time and publishes a completed File/report only after successful finalization. Direct file saving
awaits each write before acknowledging the next chunk and commits only after successful
completion. Cancel or unmount terminates the worker; failed and canceled operations expose no
downloadable archive. Inspection remains on the main thread. This example
boundary does not add a public worker API or move the conversion implementation between modules.

Existing transport, decoded-input and retained-output byte gates still apply. Moving work off the
main thread does not cap peak decoder/Arrow/packager allocations. Streaming packaging avoids
a complete archive buffer in the worker; finalized resources and index metadata remain retained.

### Point-cloud precision and partial 3TZ packages

`encodePointCloudTileWithMetadata` accepts the same Mesh or Mesh Arrow input as
`encodePointCloudTile` and returns `pnts`, the actual `pointCount`, `rtcCenter`,
`localBoundingBox`, and `maximumPositionError`. Bounds describe the encoded float32
positions before adding the RTC center. The error is the maximum Euclidean difference
between source positions (after decoding quantization) and reconstructed positions.
Set `maxPositionError` to a finite nonnegative limit in source units to reject excessive
rounding before serialization. Select a nearby `rtcCenter` to preserve precision at large
coordinate magnitudes. Source arrays are unchanged; invalid positions, unsupported packed
layouts and invalid quantization fail explicitly. The existing byte-only encoder retains
its return type and also accepts the optional precision gate.

`encodePointCloudSourceTile`, `encodePointCloudSource` and `convertPointCloudSource`
retain this metadata and validate the decoded source's declared point count against the
actual encoded rows. No coordinate transformation is implied by encoding a source tile.

`createPointCloudTilesetSink` packages independent PNTS resources as a flat 3D Tiles 1.0
collection. It requires `maxTiles`, `maxTotalBytes`, and an explicit `geometricError` in
meters that includes source sampling error and the measured position rounding. Files use
`points/0.pnts`, `points/1.pnts`, etc.; source IDs identify placements and never become paths.
A contentless ADD root encloses every leaf. Leaf bounds come from the encoded positions
plus their RTC center, without glTF axis rotation or a second application of the origin.

The initial profile requires declared EPSG:4978 xyz coordinates in meters with ellipsoidal
heights, `cartesian` source coordinates, zero source origin and no additional transform
(an explicit identity matrix is accepted). Already transformed EPSG:4978 outputs are also
accepted. Pass an explicit `spatialContext` to `convertPointCloudSource` or
`encodePointCloudSource` to prepare geographic, projected, or offset content before encoding.
Use `createI3SConversionSpatialContext` to declare the decoded source CRS, vertical units,
height reference, elevation placement, and target EPSG:4978/ellipsoidal output.
`getTileEncodingOptions` receives the prepared target-frame tile, so its RTC center and
precision budget use target units. `measureInputBytes` still receives the original decoded tile.
The synchronous `encodePointCloudSourceTile` retains its source-coordinate behavior;
`transformPointCloudSourceTile` exposes asynchronous spatial preparation separately.

Spatial preparation supports absolute longitude/latitude, longitude/latitude offsets, and
Cartesian positions with a finite invertible affine model matrix. Quantized positions are
decoded to doubles before placement and reprojection. Source arrays and traversal headers
remain unchanged; output content has absolute target positions and measured point bounds.
A context that would reapply a source operation to already transformed content, conflicting
source metadata, authority y/x order, renderer
`default`/`meter-offsets` coordinates, and nonidentity geographic placement fail explicitly.
Already transformed ECEF sources may use a native EPSG:4978 context to flatten their
renderer-relative placement without a second CRS operation.
Point normals require an explicit I3S `normalReferenceFrame`; their placement must be a
translation. Register application-owned CRS/grid/geoid resources through `@loaders.gl/tiles`;
no spatial resources are fetched implicitly. Epoch-tagged reprojection is rejected with
`SPATIAL_EPOCH_UNSUPPORTED`; native epoch metadata is retained. Cancellation is checked after elevation sampling. This sink authors a partial collection; it does not preserve source LOD
or automatically remove overlapping parent/descendant point samples. Applications must
select independent samples and provide a conservative sampling error. PNTS is a 3D Tiles
1.0 format deprecated in 1.1; modern glTF point output remains follow-up work.

```typescript
import {
  convertPointCloudSource,
  createPointCloudTilesetSink,
  createI3SConversionSpatialContext,
  createTileConversionArchive
} from '@loaders.gl/tile-converter/v5/browser';

// Select independent point samples. Declare metadata for their decoded coordinate frame.
const spatialContext = createI3SConversionSpatialContext(sourceSpatialReference, {
  targetCrs: 'EPSG:4978',
  targetHeightReference: 'ellipsoidal',
  geoidModel: registeredGeoidName // Required only when converting orthometric heights.
});
const sink = createPointCloudTilesetSink({
  maxTiles: 64,
  maxTotalBytes: 32 * 1024 * 1024,
  geometricError: 1
});
await convertPointCloudSource(selectedSource, {
  sink,
  spatialContext,
  measureInputBytes: measureDecodedPointBytes,
  maxInputResourceBytes: 8 * 1024 * 1024,
  maxOutputResourceBytes: 8 * 1024 * 1024,
  getTileEncodingOptions: tile => ({
    rtcCenter: selectEcefRtcCenter(tile),
    maxPositionError: 0.001
  }),
  signal
});
const archive = await createTileConversionArchive(sink.getFiles(), {
  format: '3tz',
  maxArchiveBytes: 40 * 1024 * 1024,
  signal
});
```

Files become visible only after successful finalization and are cleared on abort. The
retained byte budget includes the final UTF-8 tileset JSON; `maxTiles` bounds hierarchy
metadata. These limits do not bound peak decoding/encoding memory. Use
`encodeTileConversionArchiveInBatches` for the existing streaming archive adapter. Reverse
I3S PointCloud/SLPK writing and general LAS/COPC/I3S source qualification remain separate
work under tranche 7.

### Native CRS and opt-in reprojection

Retain native coordinates and CRS metadata when the selected writer and consumer support
that CRS. `spatialContext` is optional on point-source conversion; omitting it preserves
source coordinates and placement. Mesh codecs accept native contexts as well as explicitly
requested transformations. A CRS-aware renderer can consume native data without first
projecting every vertex. Rendering policy is separate from archive authoring policy.

The current 3D Tiles/3TZ collection sinks require ECEF/ellipsoidal content, and the current
I3S writer profile consumes ECEF before writing geographic I3S geometry. Those specific
profiles may require an explicit source-to-target operation; they reject incompatible
content instead of silently reprojecting it. Broader CRS-preserving writers can be added
without changing the conversion core's default behavior.

### Double-precision I3S geometry conversion

`createMeshConversionCodec` and `createI3SMeshConversionCodec` also accept an
`I3SConversionSpatialContext`. Supply packed **absolute source positions**, reconstructed
from any format offsets before calling the codec. The context's `transformGeometryAsync`
applies source height units, elevation placement, and horizontal/vertical transformation
once, returning absolute Float64 positions and matching normals. It batches asynchronous
elevation sampling for positions and normals and leaves float32 rebasing to the destination
writer, whose precision gate measures the resulting rounding. `normalReferenceFrame`
defaults to `earth-centered`; pass `vertex-reference-frame` for I3S local ENU vectors.
I3S normals are mapped into the writer coordinate basis even when positions retain a native
projected CRS; retaining the position CRS does not imply retaining the I3S vector representation.
Native local or CRS-less geometry retains its vector basis and normalizes normals without
constructing a geographic transformer or requiring projection resources.

This supports explicitly selected projected I3S geometry through both mesh writers.
`createMeshTilesetConversionSource` continues to extract native ECEF GLB/B3DM content;
original I3S source extraction and its selected material/attribute profile are described above.
Broader source appearance/metadata and product wiring remain separate increments. CRS
accuracy depends on supplied definitions and datum grids; the registered UTM test exercises
the static projection path and does not qualify time-dependent datum transformations.

These conversion operations are opt-in authoring work and can run in a conversion worker in
browser applications. They do not add per-vertex reprojection to ordinary Tile3D loading.
Native rendering should retain tile-local positions and use a separately qualified tile
placement/coordinate-origin contract; an application layer's `modelMatrix` must not be
repurposed for converter spatial policy. Nonlinear CRS and elevation operations still require
an explicit conversion stage; a renderer-only local affine approximation is not an archive
accuracy guarantee. Point identity/translation placement avoids per-point matrix allocations.

Earth-centered I3S normals targeting EPSG:4978 are normalized directly, without projecting
the corresponding position for every normal. Other vector frames still use their declared
basis transformation. This optimization also applies to the existing I3S spatial adapter.

## Browser I3S conversion example

The [archive example](https://github.com/visgl/loaders.gl/tree/master/examples/website/i3s-slpk)
accepts I3S `3DObject`/`IntegratedMesh` layer URLs and local/remote SLPK files up to 16 MiB for
conversion into either partial SLPK or 3TZ. Metadata inspection visits at most 1,000 nodes,
without loading geometry/texture/attribute payloads. Select up to 64 leaf mesh nodes explicitly.
Conversion reuses the source-coordinate adapter, exact attribute mapping and encoded base-color
profile described above, in a disposable worker with streaming download/direct-save output.

For I3S input, the feature JSON also requires `objectIdProperty` and `maxAttributeBytes`.
For 3TZ output, declare a conservative geometric error in meters; I3S screen-size LOD metrics
cannot be inferred as a metric bound. The output is a flat selected collection, with no source
hierarchy/refinement preservation. CRS/height operations must be available explicitly; missing
resources are rejected. The example's transport, decoded-resource and output limits remain
separate gates and do not claim bounded peak decoder/decompressor memory.

The same controls accept local/remote 3TZ archives containing an explicit root `tileset.json`
and supported static GLB/B3DM content. Archive inputs are capped at 16 MiB and use indexed
reads, with dependency URLs confined to the archive. Remote inputs require HTTP 206 byte-range
responses and CORS-exposed `Content-Range` plus an ETag or Last-Modified validator. The
inspected identity is retained across worker reopening; replaced archives fail instead of
using stale content declarations. Readers close on success, failure and cancellation.
Nested/external tilesets and implicit tiling remain unsupported by this bounded example.

## COPC batch output

[Explicit point mapping and COPC output](./point-cloud-copc) adds decoded Mesh/Arrow batch authoring
with caller-declared CRS, quantization precision, input/output budgets and semantic loss reports.
The codec emits one independent COPC file per input batch; whole-dataset assembly remains a separate gate.
