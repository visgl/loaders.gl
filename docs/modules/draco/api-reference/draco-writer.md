import {DracoDocsTabs} from '@site/src/components/docs/draco-docs-tabs';

# DracoWriter

For applications encoding many independent geometries, `encodeDracoBatch` initializes the
Draco runtime once and processes inputs sequentially, keeping peak native memory bounded while
avoiding per-geometry module startup overhead. It returns one `DracoEncodingResult` per input.

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

`DracoWriter` accepts Mesh Arrow tables, Mesh objects, and legacy flat attribute maps. Mesh attributes are passed directly to Draco without an intermediate Arrow conversion. Typed-array subviews retain their `byteOffset` and length, and the `normalized` flag on Mesh attributes is preserved in the encoded Draco attribute. Invalid component counts, mismatched attribute lengths, out-of-range triangle indices, and unsupported typed arrays are rejected before encoding.

## Options

| Option                     | Type                                                         | Default | Description                                                                                |
| -------------------------- | ------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------ |
| `draco.pointcloud`         | `boolean`                                                    | `false` | Whether to encode a point cloud instead of an indexed triangle mesh.                        |
| `draco.deduplicateValues`  | `boolean`                                                    | `false` | Whether Draco should deduplicate identical point-cloud attribute tuples.                    |
| `draco.speed`              | `[number, number]`                                           | Draco   | Encoding and decoding speed, from `0` (slowest) to `10` (fastest).                          |
| `draco.method`             | `'MESH_EDGEBREAKER_ENCODING' \| 'MESH_SEQUENTIAL_ENCODING'` | Draco   | Triangle mesh encoding method.                                                              |
| `draco.quantization`       | `Partial<Record<DracoAttributeType, number>>`                | Draco   | Quantization bits keyed by Draco attribute type, such as `POSITION: 14`.                    |
| `draco.attributeQuantization` | `Record<string, number \| DracoExplicitQuantization>`      | `{}`    | Quantization keyed by exact application attribute name.                                     |
| `draco.attributeTypes`     | `Record<string, DracoAttributeType>`                         | `{}`    | Overrides the Draco compression category for application attributes such as `coordinates`. |
| `draco.attributeNameEntry` | `string`                                                     | `name`  | Metadata key used to preserve each original application attribute name.                     |
| `draco.metadata`           | `DracoMetadata`                                              | `{}`    | Geometry metadata containing strings, numbers, or `Int32Array` values.                      |
| `draco.attributesMetadata` | `Record<string, DracoMetadata>`                              | `{}`    | Per-attribute metadata keyed by the original application attribute name.                    |

`POSITION`, `NORMAL`, `COLOR_n`, and `TEXCOORD_n` semantics are categorized automatically. Use `attributeTypes` when an application uses different names:

```typescript
await encode(mesh, DracoWriter, {
  draco: {
    attributeTypes: {coordinates: 'POSITION', uv1: 'TEX_COORD'},
    attributeNameEntry: 'semantic'
  }
});
```

Use `attributeQuantization` when attributes in the same Draco category need different settings.
An exact attribute setting overrides `quantization` for that attribute. A number selects only the
bit depth; an object also supplies the quantization origin and range.

```typescript
await encode(mesh, DracoWriter, {
  draco: {
    quantization: {TEX_COORD: 10},
    attributeQuantization: {
      TEXCOORD_1: {bits: 14, origin: [-1, -1], range: 2}
    }
  }
});
```

Quantization bits must be integers from `1` through `30`. Explicit origins must have one finite
value per attribute component, and explicit ranges must be positive and finite.

## Dependencies

The default encoder is the official Draco 1.5.7 WebAssembly runtime. It can be loaded dynamically, resolved from the package-local assets with `useLocalLibraries`, or injected as a module.

## Module Overrides

Use `options.modules` to override the Draco encoder runtime used by `DracoWriter`.

- `modules.draco3d`: supply the bundled `draco3d` package. `DracoWriter` uses `createEncoderModule()` from this object.
- `'draco_encoder.js'`: override the URL used for the Draco encoder runtime.
- `'draco_encoder.wasm'`: override the URL used for the Draco encoder WebAssembly binary.
