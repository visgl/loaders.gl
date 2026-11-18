---
title: '@loaders.gl/tile-converter'
description: JavaScript APIs for converting I3S and 3D Tiles datasets.
---

# @loaders.gl/tile-converter

Use the tile-converter APIs to make dataset conversion part of a JavaScript application or processing pipeline. For command-line workflows, installation, and build instructions, see the [Tile Converter application](../README.md).

## Package API

The root package exports the legacy Node.js converter classes:

| Export | Conversion |
| --- | --- |
| [`I3SConverter`](./i3s-converter.md) | Convert a 3D Tiles dataset to I3S. |
| [`Tiles3DConverter`](./3d-tiles-converter.md) | Convert an I3S dataset to 3D Tiles. |

```typescript
import {I3SConverter, Tiles3DConverter} from '@loaders.gl/tile-converter';
```

## Experimental v5 APIs

The [v5 conversion reference](./v5-conversion.md) documents the portable conversion core and its format adapters. Use `@loaders.gl/tile-converter/v5/core` for inspection, conversion, validation, and the shared contracts; use `@loaders.gl/tile-converter/v5/adapters` for format-specific integration.

See each API's reference for supported inputs, runtime requirements, options, and current limitations.
