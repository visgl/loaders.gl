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

This entrypoint is an experimental foundation. It does not yet adapt the legacy `I3SConverter` and `Tiles3DConverter`, define the stable 3D Tiles or I3S profiles, or ship browser and Node source/sink/codec adapters. Those integrations are staged in subsequent modernization work.
