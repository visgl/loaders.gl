# @loaders.gl/tile-converter

[loaders.gl](https://loaders.gl/docs) is a collection of framework independent 3D and geospatial parsers and encoders.

This module contains command line scripts and JavaScript APIs for converting between formats, for instance betwen 3D Tiles and I3S tilesets.

For documentation please visit the [website](https://loaders.gl).

## Source layout

The original converter implementation lives in `src/v4`, and the newer conversion APIs live in
`src/v5`. The package root remains the compatibility entrypoint for the original converter. Shared
implementation belongs in `src/common` only when it is intentionally used by multiple versions.

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
