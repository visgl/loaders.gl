# @loaders.gl/tile-converter

[loaders.gl](https://loaders.gl/docs) is a collection of framework independent 3D and geospatial parsers and encoders.

This module contains command line scripts and JavaScript APIs for converting between formats, for instance betwen 3D Tiles and I3S tilesets.

For documentation please visit the [website](https://loaders.gl).

## Source layout

The original converter implementation lives in `src/v4`, and the newer conversion APIs live in
`src/v5`. The package root remains the compatibility entrypoint for the original converter. Shared
implementation belongs in `src/common` only when it is intentionally used by multiple versions.

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

`encodeMeshTile(mesh)` is available from both `/v5` and `/v5/browser`. It encodes one
untextured triangle-list `MeshGeometry` (`mode: 4`) into a self-contained glTF 2.0 GLB.

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
subviews are supported; descriptor offsets/strides, normalization, and encoded transforms
are rejected. Other attributes fail with typed diagnostics instead of disappearing.

The encoder preserves coordinates and does not mutate input arrays. Callers select a local
coordinate frame and own CRS conversion, double-precision origins, placement, materials,
feature mappings, and tileset packaging. This geometry helper does not extract an entire
source scene or preserve its metadata and appearance automatically.

## V5 spatial mesh codec

`createMeshConversionCodec` connects the untextured encoder to `convertTileset`. Supply
selected triangle geometries with **absolute source-frame positions**, matching normals, a
resource ID, and an explicit target-frame origin. Positions may be packed Float32 or Float64;
the remaining geometry restrictions match `encodeMeshTile`.

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
  source: selectedMeshSource, // Yields {id, mesh, origin}; origin is in the target frame.
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

Each output contains `{id, glb, origin, boundingBox, spatialReference, maximumPositionError}`.
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
I3S elevation placement, preserve materials/features, or emit a complete tileset.

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
