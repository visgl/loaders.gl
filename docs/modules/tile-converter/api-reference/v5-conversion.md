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
GLB into I3S geometry or generate scene-layer/node metadata. The current v5 single-mesh codec
and sink author 3D Tiles; a qualified I3S mesh writer is still a subsequent tranche. Legacy
v4 converters retain their I3S/SLPK conversion workflow.

Both outputs use deterministic STORE ZIP32 with populated local headers and final indexes.
The budget includes headers/index and is checked before Blob reads. The first SLPK profile
supports archives below 2 GiB; 3TZ stays below the ZIP64 sentinel. Both support at most
65,533 resources and canonical ASCII paths. Invalid formats, budgets, or duplicate IDs fail
explicitly. The output-size budget is not a peak-memory budget. Streaming, ZIP64, cancellation
during packaging, workers, source extraction, and independent viewer qualification remain
future work. Applications own input qualification, download UI, and object-URL lifetime.

See [SLPKWriter](/docs/modules/i3s/api-reference/slpk-writer) and
[Tiles3DArchiveWriter](/docs/modules/3d-tiles/api-reference/tiles-3d-archive-writer).
