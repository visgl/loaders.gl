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

`DracoWriter` accepts Mesh Arrow tables, Mesh objects, and legacy flat attribute maps. Mesh attributes are passed directly to Draco without an intermediate Arrow conversion. Typed-array subviews retain their `byteOffset` and length, and the `normalized` flag on Mesh attributes is preserved in the encoded Draco attribute.

## Options

| Option               | Type                                                                     | Default | Description                                                                  |
| -------------------- | ------------------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------- |
| `draco.pointcloud`   | `boolean`                                                                | `false` | Whether to encode a point cloud instead of an indexed triangle mesh.          |
| `draco.speed`        | `[number, number]`                                                       | Draco   | Encoding and decoding speed, from `0` (slowest) to `10` (fastest).            |
| `draco.method`       | `'MESH_EDGEBREAKER_ENCODING' \| 'MESH_SEQUENTIAL_ENCODING'`             | Draco   | Triangle mesh encoding method.                                                |
| `draco.quantization` | `Record<string, number>`                                                 | Draco   | Quantization bit count keyed by Draco attribute type, such as `POSITION: 14`. |

## Dependencies

The default encoder is the official Draco 1.5.7 WebAssembly runtime. It can be loaded dynamically, resolved from the package-local assets with `useLocalLibraries`, or injected as a module.

## Module Overrides

Use `options.modules` to override the Draco encoder runtime used by `DracoWriter`.

- `modules.draco3d`: supply the bundled `draco3d` package. `DracoWriter` uses `createEncoderModule()` from this object.
- `'draco_encoder.js'`: override the URL used for the Draco encoder runtime.
- `'draco_encoder.wasm'`: override the URL used for the Draco encoder WebAssembly binary.
