Draco module · writer API

![](/next/images/format-logos/draco-logo.svg)

# DracoWriter

Encode meshes and point clouds with Draco compression, retaining application attribute names, metadata, and configurable quantization at the compression boundary.

[Draco format](https://loaders.gl/next/docs/modules/draco/formats/draco.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/draco/formats/draco.md)[DracoLoader](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md)[Draco module](https://loaders.gl/next/docs/modules/draco.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/draco.md)

![](/next/images/format-logos/draco-logo.svg)[Try It](https://loaders.gl/next/examples/pointclouds/draco)[Overview](https://loaders.gl/next/docs/modules/draco/formats/draco.md)[Format](https://loaders.gl/next/docs/modules/draco/format.md)[DracoLoader](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md)[DracoWriter](https://loaders.gl/next/docs/modules/draco/api-reference/draco-writer.md)

What it writes

## Compress geometry without throwing away its contract.

DracoWriter accepts mesh-oriented data, validates its attributes and indices, and encodes the result with controls for point clouds, speed, quantization, and metadata.

01

Input

Mesh, Mesh Arrow table, or flat attributes

02

Output

Draco-compressed geometry

03

Control

Speed, method, and quantization

04

Metadata

Geometry and per-attribute metadata

Detailed guide

## DracoWriter reference

The sections below document batch encoding, usage, input normalization, validation, options, and metadata.

For applications encoding many independent geometries, `encodeDracoBatch` initializes the Draco runtime once and processes inputs sequentially, keeping peak native memory bounded while avoiding per-geometry module startup overhead. It returns one `DracoEncodingResult` per input. An optional `AbortSignal` cancels between geometries, and `onProgress` receives a completion count after each successful encode. Worker pooling is intentionally tracked separately for the shared loaders.gl worker framework.

The `DracoWriter` encodes [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) or [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) data using [Draco](https://loaders.gl/next/docs/modules/draco/formats/draco.md) compression.

## Support[​](#support "Direct link to Support")

See [Draco](https://loaders.gl/next/docs/modules/draco/formats/draco.md) docs.

## Usage[​](#usage "Direct link to Usage")

```
import {DracoWriter} from '@loaders.gl/draco';

import {encode} from '@loaders.gl/core';

import type {Mesh, MeshArrowTable} from '@loaders.gl/core/schema';



declare const mesh: Mesh | MeshArrowTable;



const data = await encode(mesh, DracoWriter, options);
```

## Data Format[​](#data-format "Direct link to Data Format")

`DracoWriter` accepts Mesh Arrow tables, Mesh objects, and legacy flat attribute maps. Mesh attributes are passed directly to Draco without an intermediate Arrow conversion. Typed-array subviews retain their `byteOffset` and length, and the `normalized` flag on Mesh attributes is preserved in the encoded Draco attribute. Invalid component counts, mismatched attribute lengths, out-of-range triangle indices, and unsupported typed arrays are rejected before encoding.

## Options[​](#options "Direct link to Options")

| Option                        | Type                                                        | Default | Description                                                                                |
| ----------------------------- | ----------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `draco.pointcloud`            | `boolean`                                                   | `false` | Whether to encode a point cloud instead of an indexed triangle mesh.                       |
| `draco.deduplicateValues`     | `boolean`                                                   | `false` | Whether Draco should deduplicate identical point-cloud attribute tuples.                   |
| `draco.speed`                 | `[number, number]`                                          | Draco   | Encoding and decoding speed, from `0` (slowest) to `10` (fastest).                         |
| `draco.method`                | `'MESH_EDGEBREAKER_ENCODING' \| 'MESH_SEQUENTIAL_ENCODING'` | Draco   | Triangle mesh encoding method.                                                             |
| `draco.quantization`          | `Partial<Record<DracoAttributeType, number>>`               | Draco   | Quantization bits keyed by Draco attribute type, such as `POSITION: 14`.                   |
| `draco.attributeQuantization` | `Record<string, number \| DracoExplicitQuantization>`       | `{}`    | Quantization keyed by exact application attribute name.                                    |
| `draco.attributeTypes`        | `Record<string, DracoAttributeType>`                        | `{}`    | Overrides the Draco compression category for application attributes such as `coordinates`. |
| `draco.attributeNameEntry`    | `string`                                                    | `name`  | Metadata key used to preserve each original application attribute name.                    |
| `draco.metadata`              | `DracoMetadata`                                             | `{}`    | Geometry metadata containing strings, numbers, or `Int32Array` values.                     |
| `draco.attributesMetadata`    | `Record<string, DracoMetadata>`                             | `{}`    | Per-attribute metadata keyed by the original application attribute name.                   |

`POSITION`, `NORMAL`, `COLOR_n`, and `TEXCOORD_n` semantics are categorized automatically. Use `attributeTypes` when an application uses different names:

```
await encode(mesh, DracoWriter, {

  draco: {

    attributeTypes: {coordinates: 'POSITION', uv1: 'TEX_COORD'},

    attributeNameEntry: 'semantic'

  }

});
```

Use `attributeQuantization` when attributes in the same Draco category need different settings. An exact attribute setting overrides `quantization` for that attribute. A number selects only the bit depth; an object also supplies the quantization origin and range.

```
await encode(mesh, DracoWriter, {

  draco: {

    quantization: {TEX_COORD: 10},

    attributeQuantization: {

      TEXCOORD_1: {bits: 14, origin: [-1, -1], range: 2}

    }

  }

});
```

Quantization bits must be integers from `1` through `30`. Explicit origins must have one finite value per attribute component, and explicit ranges must be positive and finite.

## Dependencies[​](#dependencies "Direct link to Dependencies")

The default encoder is the official Draco 1.5.7 WebAssembly runtime. In browsers it is loaded from the versioned browser-compatible Draco assets on jsDelivr; in workers and offline builds, set `useLocalLibraries: true` to use the package-local wrapper and WebAssembly binary. An application can also inject a `draco3d` module through `options.modules`.

## Module Overrides[​](#module-overrides "Direct link to Module Overrides")

Use `options.modules` to override the Draco encoder runtime used by `DracoWriter`.

* `modules.draco3d`: supply the bundled `draco3d` package. `DracoWriter` uses `createEncoderModule()` from this object.
* `'draco_encoder.js'`: override the URL used for the Draco encoder runtime.
* `'draco_encoder.wasm'`: override the URL used for the Draco encoder WebAssembly binary.
