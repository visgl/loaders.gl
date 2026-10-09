# @loaders.gl/tile-converter

[loaders.gl](https://loaders.gl/docs) is a collection of framework independent 3D and geospatial parsers and encoders.

This module contains command line scripts and JavaScript APIs for converting between formats, for instance betwen 3D Tiles and I3S tilesets.

For documentation please visit the [website](https://loaders.gl).

## Source layout

The original converter implementation lives in `src/v4`, and the newer conversion APIs live in
`src/v5`. The package root remains the compatibility entrypoint for the original converter. Shared
implementation belongs in `src/common` only when it is intentionally used by multiple versions.

## Portable core and format adapters

The v5 implementation is split into two entrypoints inside this application:

- `@loaders.gl/tile-converter/v5/core`: portable conversion orchestration, source traversal,
  spatial preparation and bounded Blob or manifest-backed sinks.
- `@loaders.gl/tile-converter/v5/adapters`: format encoders, source mesh extraction,
  Arrow feature mapping, output packaging and archive helpers.

The existing `/v5` and `/v5/browser` imports remain compatible. The adapters consume the
same core functions, types and error class. No implementation or dependencies move into
other packages; CLI and v4 code are unchanged. Applications supply platform I/O adapters.

## V5 source-backed mesh traversal

`createTilesetConversionSource(tileset)` adapts an initializing or initialized `Tileset3D` backed
by `Tiles3DSource`, `I3SSource`, or a compatible archive source to the v5 conversion core. Inspection
returns normalized source metadata after initialization. Reading delegates to shared
camera-independent traversal and yields one placement with all its ordered decoded content entries,
including empty placements. A codec can inspect each content's payload, feature descriptors and
bounds together with the tile's placement transform.

```ts
import {createTilesetConversionSource, convertTileset} from '@loaders.gl/tile-converter/v5';

const report = await convertTileset({
  source: createTilesetConversionSource(tileset, {unloadContent: true}),
  codec: meshCodec,
  sink: outputSink,
  measureInputBytes: measureDecodedTileBytes,
  measureOutputBytes: measureEncodedResourceBytes,
  maxInputResourceBytes: 16 * 1024 * 1024,
  signal: abortController.signal
});
```

Writes are awaited by the core before traversal advances. The example uses a runtime dedicated to
conversion and enables `unloadContent` to release newly loaded payloads after their codec and writes
finish. Cleanup also runs when iteration closes on failure or cancellation, including rejection by
the input-size gate. Consume payloads before advancing; codecs and sinks must not retain them after
their work completes. Preloaded payloads are retained. Omit the option to keep all loaded content
attached, as before. Applications still own tileset destruction and source/archive lifetimes.
With `Tiles3DSource`, repeated reads reuse installed nested roots and descendants while reloading
their payloads. Separate content slots and parent placements retain their own nested roots even
when they reference the same resource URL.

This adapter does not bound aggregate input memory, apply CRS transforms, or supply a mesh codec
or output packaging. Inspection observes
cancellation before and after initialization; initialization and in-flight content reads retain the
underlying source's cancellation behavior.

`maxInputResourceBytes` limits one decoded input placement before the codec runs. The example
allows up to 16 MiB as measured by the application's `measureInputBytes` callback, which must return
a nonnegative safe integer and account for all decoded contents in the placement. Equality is
allowed; zero permits only empty inputs. Omit the limit or use `Infinity` for no limit. Oversized
inputs throw `INPUT_RESOURCE_TOO_LARGE`, close source iteration, and abort the destination.
This check runs after the source read, so decoding allocations and retained source content still
require source-level controls. `convertPointCloudSource` accepts the same option for decoded tiles.

## V5 single mesh encoding

`encodeMeshTile(mesh, {material})` is available from both `/v5` and `/v5/browser`. It encodes one
triangle-list `MeshGeometry` (`mode: 4`) into a self-contained glTF 2.0 GLB.

```ts
import {encodeMeshTile} from '@loaders.gl/tile-converter/v5/browser';

const glb = encodeMeshTile({
  topology: 'triangle-list',
  mode: 4,
  attributes: {
    POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), size: 3}
  }
});
```

The initial profile accepts finite packed Float32 `POSITION` and optional `NORMAL` xyz
triples. Normals must have unit length within 0.0001 and match the vertex count. Optional
indices are packed Uint8, Uint16, or Uint32 scalars forming complete triangles, referencing
existing vertices and excluding each type's maximum primitive-restart value. Typed array
subviews are supported; descriptor offsets/strides and encoded transforms
are rejected. Normalization is supported only for the selected integer colors and UVs below. Other attributes fail with typed diagnostics instead of disappearing.

The encoder preserves coordinates and does not mutate input arrays. Callers select a local
coordinate frame and own CRS conversion, double-precision origins, placement, source
material mapping, feature mappings, and tileset packaging. This geometry helper does not extract an entire
source scene or preserve its metadata and appearance automatically.

### Selected appearance

Optional `COLOR_0` contains packed Float32 linear RGB (`size: 3`) or RGBA (`size: 4`)
values in [0, 1], or packed `Uint8Array`/`Uint16Array` values with `normalized: true`, one per
position. Integer colors represent linear values divided by 255 or 65535, including alpha;
no sRGB conversion is performed. Component types, normalization, and subview values are preserved.
Other color sets remain unsupported.

One optional `MeshTileMaterial` applies to every triangle:

```ts
const glb = encodeMeshTile(mesh, {
  material: {
    baseColorFactor: [0.8, 0.5, 0.2, 0.75],
    metallicFactor: 0,
    roughnessFactor: 1,
    alphaMode: 'BLEND',
    doubleSided: true
  }
});
```

Base color is a linear RGBA multiplier in [0, 1], multiplied by `COLOR_0` when present.
Metallic/roughness factors are in [0, 1]. Alpha mode is `OPAQUE`, `MASK`, or `BLEND`;
finite nonnegative `alphaCutoff` is allowed only with `MASK`. Omitted properties retain
[glTF defaults](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#materials):
white base color, metallic/roughness 1, opaque alpha, mask cutoff 0.5, and single-sided rendering.
No material is added unless explicitly supplied. Unsupported material properties and extensions
fail with `MESH_MATERIAL_UNSUPPORTED`; invalid values fail with
`MESH_MATERIAL_INVALID`. Invalid color values/counts/types fail with `MESH_COLOR_INVALID`.
Inputs are not mutated. Applications explicitly map source colors and materials into this
subset; other texture maps, multiple materials, and
feature mappings remain open work.

Optional `TEXCOORD_0` contains packed finite Float32 or explicitly normalized Uint8/Uint16
UV pairs (`size: 2`), one per position. Float32 values outside [0, 1] are allowed for repeating
textures; integer values represent [0, 1] after division by 255 or 65535. Integer storage requires
`normalized: true`; signed, Uint32, and normalized floating-point appearance attributes are rejected.
The glTF writer pads vertex elements to four-byte alignment without changing their values.
Texture transforms apply to the normalized UV values. A selected `baseColorTexture` requires
these UVs and embeds an already encoded PNG or JPEG:

```ts
const glb = encodeMeshTile(meshWithUvs, {
  material: {
    baseColorTexture: {
      data: encodedImageBytes,
      mimeType: 'image/png',
      sampler: {wrapS: 33071, wrapT: 33071, minFilter: 9729, magFilter: 9729},
      transform: {offset: [0, 1], scale: [1, -1]}
    },
    metallicFactor: 0,
    roughnessFactor: 1
  }
});
```

`MeshTileTexture.data` is a `Uint8Array`; subviews preserve only their selected bytes. The
encoder checks header MIME type and positive dimensions, then copies the encoded bytes
without decoding, re-encoding, flipping UVs, or changing the selected sampling controls. Applications
supply valid encoded image payloads and map source sampling conventions explicitly. Base-color
images use glTF's sRGB interpretation and multiply the linear material factor and vertex colors.
Optional `MeshTileSampler` preserves glTF `wrapS`/`wrapT` (33071 clamp-to-edge,
33648 mirrored-repeat, 10497 repeat), `magFilter` (9728 nearest, 9729 linear), and
`minFilter` (9728/9729 or mipmap filters 9984–9987). Omitted wrapping uses repeat;
omitted filters are chosen by the renderer. An omitted sampler emits no sampler resource;
an explicitly selected `{}` emits an empty sampler using the same defaults. Invalid values
or malformed selected samplers fail with `MESH_SAMPLER_INVALID`; unsupported sampler
properties fail with `MESH_SAMPLER_UNSUPPORTED`. Inputs are not mutated. Mipmap filter
selection does not generate mip levels; source adapters own sampling and image conventions.
Optional `MeshTileTextureTransform` preserves finite `offset`/`scale` UV pairs and a finite
counterclockwise `rotation` in radians through
[KHR_texture_transform](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_transform/README.md).
The reader applies scale, then rotation about the UV origin, then offset. Omitted controls use
[0, 0], 0, and [1, 1]; zero/negative scales are supported. An omitted transform adds no extension;
a selected `{}` adds the default transform. The extension is declared required because no baked
fallback UV set is generated. UV/image bytes are unchanged and inputs are not mutated.
Malformed/nonfinite controls fail with `MESH_TEXTURE_TRANSFORM_INVALID`; unsupported properties
(including a `texCoord` override) fail with `MESH_TEXTURE_TRANSFORM_UNSUPPORTED`.
Source transform extraction/mapping, external image URLs, other UV sets, and other texture
extensions remain unsupported.
Invalid selected UVs fail with `MESH_TEXCOORD_INVALID`, missing UVs with
`MESH_TEXCOORD_REQUIRED`, and invalid/unsupported image descriptors or headers with
`MESH_TEXTURE_INVALID`. The spatial mesh codec forwards the same selected UVs, images, sampling, and transforms.

## V5 spatial mesh codec

`createMeshConversionCodec` connects the mesh encoder to `convertTileset`. Supply
selected triangle geometries with **absolute source-frame positions**, matching normals, a
resource ID, an explicit target-frame origin, and an optional selected `material`. Positions
may be packed Float32 or Float64; the remaining geometry restrictions match `encodeMeshTile`.
The input byte estimator must include selected image bytes as well as geometry buffers.

```ts
import {
  convertTileset,
  createMeshConversionCodec,
  createTiles3DConversionSpatialContext
} from '@loaders.gl/tile-converter/v5/browser';

const spatialContext = createTiles3DConversionSpatialContext(sourceSpatialReference, {
  targetCrs: 'EPSG:3857'
});
const report = await convertTileset({
  source: selectedMeshSource, // Yields {id, mesh, origin, material?}; origin is in the target frame.
  codec: createMeshConversionCodec({spatialContext, maxPositionError: 0.001}),
  sink: meshSink,
  measureInputBytes: measureDecodedMeshBytes,
  measureOutputBytes: resource => resource.glb.byteLength,
  maxInputResourceBytes: 16 * 1024 * 1024,
  maxOutputResourceBytes: 16 * 1024 * 1024,
  signal: abortController.signal
});
```

The codec applies the shared position/normal operations once, subtracts the selected origin
in double precision, then encodes local Float32 positions. `maxPositionError` is required,
finite and nonnegative: it limits Euclidean reconstruction error per vertex in **target
coordinate units** (0.001 meters for EPSG:3857). Equality is allowed; zero requires exact
reconstruction. Geographic/unknown output frames are rejected. Native coordinates require
an explicitly declared Cartesian frame in the discovered spatial metadata.

Each output contains `{id, glb, origin, boundingBox, localBoundingBox, spatialReference, maximumPositionError}`.
`localBoundingBox` bounds the actual encoded Float32 positions before adding the origin; use
it for packaging to avoid precision loss from subtracting large absolute coordinates.
Accepted rounding is recorded as an informational `MESH_POSITION_ROUNDING` diagnostic in
the conversion report, with its resource ID and measured error. Bounds describe the
reconstructed encoded vertices in the target frame, including float32 rounding. Preserve
this metadata when writing resources: the GLB itself contains local coordinates and does
not embed its absolute origin or CRS. Source arrays are not mutated. The conversion core
awaits writes, checks byte limits, reports progress, finalizes on success, and aborts on
read/codec/write/cancellation failure.

Applications still select source geometry, apply source placement and corresponding normal
transforms before conversion, reconcile format axis conventions, and package hierarchy,
refinement and geometric error. This increment does not extract complete scenes, convert
I3S elevation placement, map full source materials/features, or emit a complete tileset.

## V5 single-mesh browser package

`createSingleMeshTilesetSink` connects the spatial mesh codec to a bounded **3D Tiles 1.1**
output package. It accepts exactly one unmodified codec output, with resolved **EPSG:4978**
ECEF xyz coordinates in meters and ellipsoidal heights. The CRS must use the compact string
`'EPSG:4978'`; other output frames and identifiers are rejected in this initial profile.

```ts
import {createSingleMeshTilesetSink} from '@loaders.gl/tile-converter/v5/browser';

const meshSink = createSingleMeshTilesetSink({
  maxTotalBytes: 16 * 1024 * 1024,
  geometricError: 0.001 // Meters; include source geometric error and position rounding.
});
// Pass meshSink to convertTileset with a mesh codec targeting EPSG:4978.
// After conversion completes, save both files together in the same directory:
const files = meshSink.getFiles(); // [{resourceId: 'mesh.glb', blob}, {resourceId: 'tileset.json', blob}]
```

The package uses fixed relative names, a single root tile with `REPLACE` refinement, and
explicit geometric error. The tile transform cancels the standard glTF y-up to z-up rotation
and adds the ECEF origin; its box encloses encoded local positions in the corresponding tile
frame. The supplied `geometricError` must be finite, nonnegative, and at least the codec's
measured reconstruction error. It is the application's responsibility to include source
LOD or simplification error; the sink does not estimate it.

`maxTotalBytes` is captured when the sink is created and includes the GLB and UTF-8 JSON Blob sizes. This bounds **retained output**,
not peak conversion or serialization memory. Conversion report counts/byte totals describe
codec resources (one GLB), while this sink retains two files. Files are exposed only after
successful finalization; failed writes, cancellation, zero/multiple meshes, or conversion
failure abort and clear the package through the core lifecycle. The sink trusts codec GLB
and local-bound metadata; applications must not alter them before writing. Download UI,
workers, multi-tile hierarchy, and source-scene extraction remain separate work.

### Download a 3TZ archive

`createSingleMeshTilesetArchive` packages the finalized sink's two files into a **3TZ archive**
with a final `@3dtilesIndex1@` path-hash index. The format writer lives in `@loaders.gl/3d-tiles`,
uses typed arrays and native Blobs, and needs no filesystem or Node.js Buffer.

```ts
import {createSingleMeshTilesetArchive} from '@loaders.gl/tile-converter/v5/browser';

const archive = await createSingleMeshTilesetArchive(meshSink.getFiles(), {
  maxArchiveBytes: 16 * 1024 * 1024
});
const downloadUrl = URL.createObjectURL(archive);
// Attach downloadUrl to an application-owned link with download="tileset.3tz".
// When the link is no longer needed:
URL.revokeObjectURL(downloadUrl);
```

The required budget includes all ZIP headers and the index (368 bytes of overhead for this
fixed two-file profile) and is checked **before either Blob is read**. STORE compression,
fixed timestamps, stable file order, and relative paths produce deterministic bytes. The
returned Blob uses `application/vnd.maxar.archive.3tz+zip`; save it with `.3tz`. Inputs must be
unmodified output from a successfully finalized sink. The budget covers archive size, not
peak memory: the input Blobs and transient ZIP buffers remain additional allocations.
Both archive helpers accept an optional `signal` for cooperative cancellation between block
reads and header encodes. Cancellation rejects with its reason and exposes no partial archive;
active reads/encodes finish first. The example also terminates its worker for immediate cancellation.
Packaging reads/copies payloads in blocks of at most 64 KiB, using a checksum pass before each
populated header and a second pass into the final archive buffer. Caller-owned inputs, index
metadata, the final archive, and Blob/worker transfer copies still require memory. Total
peak-memory qualification remains open.

### Stream an archive to storage

`encodeTileConversionArchiveInBatches` accepts the same finalized files and options as
`createTileConversionArchive`, and yields byte-identical SLPK/3TZ output without allocating a
complete archive buffer. Conversion code remains in this application; format layout and encoding
stay in their owning modules.

```ts
import {encodeTileConversionArchiveInBatches} from '@loaders.gl/tile-converter/v5/adapters';

try {
  for await (const chunk of encodeTileConversionArchiveInBatches(sink.getFiles(), {
    format: 'slpk', // or '3tz', with resources authored for that format
    maxArchiveBytes: 32 * 1024 * 1024,
    signal
  })) {
    await destination.write(chunk); // Application-owned storage; respect the byte view.
  }
  await destination.close();
} catch (error) {
  await destination.abort(error); // Discard partial output; do not publish it as a finished archive.
  throw error;
}
```

The iterator checks every declaration and the full budget on its first pull, before output. It
emits the next header or payload block only when pulled, so awaiting storage writes supplies
backpressure within each entry. Returning early prevents further I/O. Callers own storage finalization and discarding partial bytes
on failure/cancellation. Payload reads/copies are at most 64 KiB: one checksum pass precedes
each populated header, then output blocks are read on demand. Inputs and index/directory metadata
remain in memory; this does not cap total decoding/conversion heap usage.

The legacy v4 I3S converter already writes **SLPK** archives. Portable v5 SLPK output requires
an I3S scene-layer writer and its node/resource layout; a 3D Tiles package cannot be saved as
SLPK merely by changing its extension.

## V5 spatial conversion

The `@loaders.gl/tile-converter/v5` entrypoint can reuse the CRS and elevation operations from
`@loaders.gl/tiles` when preparing conversion resources. Discover source metadata with
`get3DTilesSpatialReference` or `getI3SSpatialReference`, then create the matching conversion
context with an explicit target CRS or height reference when transformation is required. The
context provides double-precision positions, transformed normals and conservative bounds, plus the
spatial reference that belongs in output metadata. Required geoid grids and terrain or scene
providers are passed by the application; the conversion core does not guess a CRS or fetch spatial
resources implicitly.

```ts
import {createI3SConversionSpatialContext} from '@loaders.gl/tile-converter/v5';
import {getI3SSpatialReference} from '@loaders.gl/tiles';

const spatial = createI3SConversionSpatialContext(
  getI3SSpatialReference(layerMetadata),
  {targetCrs: 'EPSG:3857'}
);
const transformed = spatial.transformPositions(positions, nodeOrigin);
```

## V5 feature attributes

`convertFeatureAttributesToArrowBatches` writes decoded feature attributes using an explicit Arrow
schema. The schema owns property types, nested list/struct mappings, enum representations, and the
feature ID type. IDs may be strings or exact integer values (`bigint` for values outside JavaScript's
safe integer range). Unknown properties fail instead of disappearing. Supply a binary
`rawMetadataField` to retain the original encoded metadata alongside interpreted values. Pass each
source metadata class separately so its name remains attached to the batch schema.

```ts
import {convertFeatureAttributesToArrowBatches} from '@loaders.gl/tile-converter/v5';

const batches = convertFeatureAttributesToArrowBatches(features, {
  schema: {
    fields: [
      {name: 'feature_id', type: 'int64', nullable: false},
      {name: 'name', type: 'utf8', nullable: true}
    ],
    metadata: {}
  },
  batchSize: 65536
});
```

## V5 restartable output sinks

`createManifestBackedTileConversionSink` resumes matching resources using caller-provided IDs and
fingerprints. Applications provide an atomic manifest store and an idempotent resource sink, keeping
filesystem and archive choices outside the conversion API.

## V5 point-cloud sources

`traversePointCloudSource` walks an I3S Point Cloud, COPC, or compatible source independently of a
render camera. It yields each reachable tile's header and decoded Mesh Arrow content in
depth-first order, retaining source bounds, coordinate-system metadata, and placement information
for the output encoder. `encodePointCloudSource` streams non-empty PNTS resources, each paired with
its original header, coordinate system, origin, and transform. `encodePointCloudSourceTile` encodes
one yielded tile. Set `maxDepth` to bound traversal; pass an `AbortSignal` to stop between source
operations. These helpers do not transform coordinates or package a tileset manifest.

Pass encoder options directly to `encodePointCloudSourceTile`, or select them for each non-empty
tile with `encodePointCloudSource`'s `getTileEncodingOptions` callback. A declared `rtcCenter` in the
point-position coordinate frame is subtracted before float32 encoding and stored as PNTS
`RTC_CENTER`, retaining small offsets in large double-precision coordinates. `batchTableJson`
supplies properties for existing `BATCH_ID` values. An explicit `constantRGBA` overrides the source
constant color; the source origin and placement transform remain attached to the encoded tile.

The PNTS encoder accepts `POSITION`, `NORMAL`, `BATCH_ID`, and one color attribute (`COLOR_0` or
`COLOR`). Other attributes, including classification, intensity, and an additional color column,
raise `POINT_CLOUD_ATTRIBUTE_UNSUPPORTED` rather than silently disappearing. Applications must
explicitly map unsupported fields to supported batch-table properties or remove them before
encoding; this initial encoder does not automatically map point attributes.

`convertPointCloudSource` connects the same traversal and encoder to a
`TileConversionSink<EncodedPointCloudSourceTile>`. Writes are awaited before reading the next tile;
the sink is finalized on success and aborted on failures or cancellation. Set
`maxOutputResourceBytes` to limit each PNTS resource and use `onProgress` for the shared v5 progress
report. `maxDepth`, `signal`, and `getTileEncodingOptions` have the same meanings as above.
Applications provide `measureInputBytes` for decoded input accounting, returning zero for empty
tiles when appropriate. Reports count visited tile headers as inputs, including empty tiles, and
encoded PNTS tiles as outputs. Applications own source cleanup and output naming and packaging.

```ts
import {convertPointCloudSource} from '@loaders.gl/tile-converter/v5';

const report = await convertPointCloudSource(pointCloudSource, {
  sink: outputSink,
  measureInputBytes: measureDecodedTileBytes,
  maxOutputResourceBytes: 8 * 1024 * 1024,
  signal: abortController.signal
});
```

## V5 browser entrypoint

Import `@loaders.gl/tile-converter/v5/browser` for the portable conversion API,
`createBrowserTileConversionSource`, `createBrowserTilesetConversionSource`, and
`createBoundedMemoryTileConversionSink`. The single-resource source reads one URL or Blob. The
tileset source traverses explicit 3D Tiles 1.0 and 1.1 documents in depth-first order and reads each
declared content placement under aggregate byte and resource limits. It rejects implicit tiling and
nested JSON content. Both sources yield raw bytes to an application-provided codec. The sink retains
named Blob outputs under a required total-byte limit; applications remain responsible for codecs,
packaging, and triggering downloads.

## Installation

```bash
npm install @loaders.gl/tile-converter
```


## V5 partial mesh collections

`createMeshTilesetSink` from `@loaders.gl/tile-converter/v5/adapters` packages independent
`createMeshConversionCodec` outputs as a flat **3D Tiles 1.1** collection. Supply
`maxTotalBytes`, `maxMeshes`, and a conservative `geometricError` in meters. The ECEF and
ellipsoidal-height requirements match `createSingleMeshTilesetSink`.

Each unique placement gets `meshes/0.glb`, `meshes/1.glb`, etc.; source IDs never become paths.
A contentless ADD root encloses all encoded leaf bounds, and each leaf retains its own
transform. The contentless root's geometric error covers the enclosing box diagonal;
leaf errors retain the supplied source/rounding budget. This keeps exact leaves discoverable
when their error is zero. Files become visible through `getFiles()` only after successful finalization.
Duplicate placement IDs, excess meshes, failed writes, cancellation and final-JSON budget
failures clear output through the conversion core. The byte budget includes GLBs and JSON;
the mesh count bounds retained hierarchy metadata. Neither bounds peak serialization memory.
Pass finalized files to `createTileConversionArchive` with `format: '3tz'`.

Applications must explicitly select independent leaf representations and preserve source
error in the supplied budget. This sink does not infer source LOD relationships or retile.
The [browser example](../../examples/website/i3s-slpk/README.md) demonstrates up to 64
selected leaf contents, aggregate transport/decoded byte gates, download and incremental
preview. SLPK still uses the single-mesh sink; multi-node I3S authoring is a separate increment.


### Source CRS preparation

Both mesh codecs accept `createI3SConversionSpatialContext` for selected absolute I3S
geometry. Its `transformGeometryAsync` keeps positions in Float64 through unit, elevation,
and CRS operations before destination writers rebase to float32 and check precision.
Use the explicit I3S `normalReferenceFrame` when its vectors use a local ENU basis.

Point-source conversion accepts the same context as `spatialContext`. Cartesian affine
placement or longitude/latitude offsets are resolved before the CRS operation;
`getTileEncodingOptions` then receives the prepared target-frame tile for RTC selection.
The direct async `transformPointCloudSourceTile` helper supports separate preparation.
Source metadata must agree with the context. For already transformed ECEF content, a native
EPSG:4978 context can flatten renderer placement without repeating the source operation.
Ambiguous renderer coordinates fail explicitly. See the [v5 API guide](../../docs/modules/tile-converter/api-reference/v5-conversion.md)
for supported layouts, normal frames, and application-owned spatial resources.

### Original I3S mesh input

The v5 adapters export `createI3SMeshTilesetConversionSource` for a selected
I3S mesh profile. Use a dedicated source-backed runtime with `i3s.geometryMode: 'source'`
to retain absolute Float64 source coordinates and original normals. Pair the GLB codec
with `autoOrigin: true` to choose the placement origin after spatial transformation.
One encoded PNG/JPEG base-color texture and explicit wrapping are preserved without decoding
pixels. `features` reads standard scalar/string attribute resources into a caller-declared Arrow
schema using an `objectIdProperty`, optional `sourceFeatureIdProperty` and `maxAttributeBytes`.
Signed/unsigned 64-bit properties retain exact bigint values; triangle ownership must be complete.
Supply `readExternalResource` for external textures/attributes, including byte limits, archive
resolution, authentication and decompression. `getFeatures` remains the custom alternative.
Unsupported atlas regions, colors, richer maps, domains/dates and layouts fail explicitly.
See the v5 conversion API reference for the exact source profile and an example mapping.
See the [v5 conversion reference](../../docs/modules/tile-converter/api-reference/v5-conversion.md).
