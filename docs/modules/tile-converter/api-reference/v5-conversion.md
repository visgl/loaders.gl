---
title: Tile-converter v5 conversion core
description: Experimental platform-neutral contracts for inspecting, converting, and validating tilesets.
---

# Tile-converter v5 conversion core

The `@loaders.gl/tile-converter/v5` entrypoint is the first part of the new conversion API. It has no Node.js imports. Input resolution, format codecs, destination writes, and validation are supplied by adapters so the core can run in browser or Node environments.

The current API exports `inspectTileset`, `convertTileset`, and `validateTileset`, together with types for sources, codecs, sinks, diagnostics, progress, and reports. `convertTileset` reads and converts one input resource at a time, awaits each destination write before requesting more output, supports `AbortSignal`, and reports resource and byte totals. Set `maxOutputResourceBytes` to reject an output resource that exceeds the configured per-resource budget. Policy and validation failures use `TileConversionError` with a stable code and associated diagnostics.

```ts
import {convertTileset} from '@loaders.gl/tile-converter/v5';

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

This entrypoint is experimental. Selected source adapters, mesh and point-cloud codecs, bounded browser sinks, and archive packaging are available. Applications still supply input/output integration for other profiles; the legacy `I3SConverter` and `Tiles3DConverter` remain separate.

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
explicitly. The output-size budget is not a peak-memory budget. Streaming, ZIP64, cancellation
during packaging, workers, broader source extraction, and broader viewer qualification remain
future work. Applications own input qualification, download UI, and object-URL lifetime.

See [SLPKWriter](/docs/modules/i3s/api-reference/slpk-writer) and
[Tiles3DArchiveWriter](/docs/modules/3d-tiles/api-reference/tiles-3d-archive-writer).

## Source mesh to I3S/SLPK

`createMeshTilesetConversionSource` connects a source-backed `Tileset3D` runtime to
`createI3SMeshConversionCodec` and `createSingleMeshI3SSink`. These APIs are exported from
both v5 entrypoints. The initial profile converts one static untextured GLB/B3DM primitive
from a native, resolved EPSG:4978 source to an I3S 1.7 3D Object layer. Enable decoded glTF
loading when constructing the runtime. A region bounding volume or explicit CRS metadata
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
Missing defaults can be supplied by the decoded class. noData, enum/array mappings and
64-bit property transforms are rejected until their semantics are separately qualified. Unmapped properties fail rather than disappearing.

The source applies node placement, the glTF up axis, RTC center, and tile placement once.
Absolute positions remain Float64; normals use the inverse transpose of the placement.
The codec then applies the shared source-to-ECEF spatial context once. It reports measured
position rounding and explicitly authorized 64-bit decimal-string mappings in `report`.
The sink exposes files only after successful finalization and clears partial files on abort.
A second mesh resource aborts this single-mesh output; hierarchy generation is separate work.

The initial source rejects animation, skins, morphs, GPU instancing, mirrored or singular
placements, textures, unmapped material/feature extensions, and tileset/group/tile/content
metadata that needs its own mapping. Decoded reader cleanup follows shared traversal; the
application still owns the runtime, worker, decoder, and archive lifetime. Synchronous
encoding cannot be interrupted mid-operation. Resource/retained-output/archive caps do
not constitute a total peak-memory budget.

Unannotated resources can also use the existing GLB codec and 3D Tiles/3TZ sink. The GLB
codec explicitly rejects feature-bearing resources until its target metadata writer is
qualified. See [I3S mesh authoring](/docs/modules/i3s/api-reference/i3s-mesh-writer) for the
precise target property/null profile.
