import {DracoDocsTabs} from '@site/src/components/docs/draco-docs-tabs';

# DracoWriter

<DracoDocsTabs active="dracowriter" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

![logo](../images/draco-small.png)

The `DracoWriter` encodes [Mesh](/docs/specifications/category-mesh) or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) data using [Draco](/docs/modules/draco/formats/draco) compression.

## Support

See [Draco](/docs/modules/draco/formats/draco) docs.

## Usage

```typescript
import {DracoWriter} from '@loaders.gl/draco';
import {encode} from '@loaders.gl/core';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';

declare const mesh: Mesh | MeshArrowTable;

const data = await encode(mesh, DracoWriter, options);
```

## Data Format

`DracoWriter` accepts Mesh Arrow tables and legacy Mesh objects. Legacy Mesh input is normalized through the Mesh Arrow table conversion path before Draco data is encoded.

## Options

| Option               | Type               | Default | Description                                                                         |
| -------------------- | ------------------ | ------- | ----------------------------------------------------------------------------------- |
| `draco.pointcloud`   | `Boolean`          | `false` | Whether to compress as point cloud (GL.POINTS)                                      |
| `draco.speed`        | `Number`           |         | Speed vs Quality, see [Draco](https://google.github.io/draco/) documentation        |
| `draco.method`       | `String`           |         | Compression method, see [Draco](https://google.github.io/draco/) documentation      |
| `draco.quantization` | `[Number, Number]` |         | Quantization parameters, see [Draco](https://google.github.io/draco/) documentation |

## Dependencies

Draco libraries by default are loaded from CDN, but can be bundled and injected. See [modules/draco/docs] for details.

## Module Overrides

Use `options.modules` to override the Draco encoder runtime used by `DracoWriter`.

- `modules.draco3d`: supply the bundled `draco3d` package. `DracoWriter` uses `createEncoderModule()` from this object.
- `'draco_encoder.js'`: override the URL used for the Draco encoder runtime.
