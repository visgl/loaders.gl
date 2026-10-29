Geometry compression module

![](/next/images/format-logos/draco-logo.svg)

# Move geometry efficiently without changing its meaning.

The Draco module decodes and encodes compressed meshes and point clouds. It supports render-ready mesh objects, Mesh Arrow tables, worker execution, and the glTF compression extension path.

[Mesh category](https://loaders.gl/next/docs/specifications/category-mesh.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-mesh.md)[3D data formats](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

A layered 3D format stack

## Choose the delivery layer. Keep the data path.

A scene file, a tiled world, and a compressed payload solve different problems. loaders.gl keeps those boundaries visible while providing the readers needed to move between them.

Scene descriptions

Hierarchy, materials, transforms, and animation

[glTF 2.0 + draft 2.1↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)[GLB↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/glb.md)[OpenUSD↗](https://loaders.gl/next/docs/modules/scene/usd/formats/usd.md)

Tiled worlds and point clouds

Spatial hierarchy, level of detail, and selective delivery

[3D Tiles 1.0 / 1.1↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)[I3S 1.7 / 1.8 + PC 2.x↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)[COPC 1.0 · Potree 1.x↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

Geometry and texture payloads

Compression and GPU-ready delivery underneath the formats

[Draco↗](https://loaders.gl/next/docs/modules/draco/formats/draco.md)[Meshopt compression↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md#meshopt-compression)[Basis Universal / KTX2↗](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)

Application-facing results

scenegraphtile contentMesh / point-listTextureLevel

Compression as a pipeline stage

## Decode for rendering, or keep the columns.

Draco is a payload codec, not the application data model. The loader can return typed geometry for a renderer or Arrow-compatible columns for processing and conversion.

01

Inputs

Compressed meshes and point clouds

02

Outputs

Mesh objects or Mesh Arrow tables

03

Execution

Main thread, worker, and stateful batch encoding

04

Composition

glTF KHR\_draco\_mesh\_compression payloads

Detailed guide

## Draco module details

The sections below cover installation, loaders, writers, batch encoding, worker behavior, and glTF integration.

The `@loaders.gl/draco` module handles compressing and decompressing of 3D meshes and point clouds with [DRACO](https://github.com/google/draco).

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/draco
```

The injectable `draco3d` npm backend is an `optionalDependency`. The default loader and writer use vendored runtimes and work with `npm install --omit=optional`. If you omit optional dependencies and want to inject `options.modules.draco3d`, install `draco3d` explicitly.

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader                                                                                               | Description                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`DracoLoader`](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md)       | Loads Draco meshes and point clouds as Mesh objects or [Mesh Arrow tables](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables). |
| [`DracoWorkerLoader`](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md) | Loads Draco meshes and point clouds in a worker.                                                                                                                 |
| [`DracoWriter`](https://loaders.gl/next/docs/modules/draco/api-reference/draco-writer.md)       | Encodes Draco meshes and point clouds from Mesh or Mesh Arrow table data.                                                                                        |

`encodeDracoInBatches` accepts an async or synchronous iterator of geometry batches. With `worker: true` it leases one worker for the full iterator and keeps one Draco encoder alive, which is useful for large exports and stateful batch pipelines. With `worker: false` it uses the same lifecycle locally.

The glTF writer exposes the same capability through `{gltf: {draco: {enabled: true}}}`. This is asynchronous because the official Draco encoder is WebAssembly-backed; use `GLTFWriter.encode` rather than `encodeSync`. The writer appends `KHR_draco_mesh_compression` payloads to a single buffer and leaves the original accessors in place for compatibility.

## Additional APIs[​](#additional-apis "Direct link to Additional APIs")

See the [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) and point cloud / mesh category documentation.

## Dependencies[​](#dependencies "Direct link to Dependencies")

Draco support requires the Draco libraries, which are quite big (see table below). By default, these will be loaded from CDN but can optionally be bundled and supplied by the application through the top-level `options.modules` option:

Bundling the entire `draco3d` library:

```
import draco from 'draco3d';

import {setLoaderOptions} from '@loaders.gl/core';

setLoaderOptions({

  modules: {

    draco3d

  }

});
```

Bundling only the WebAssembly decoder

```
import {setLoaderOptions} from '@loaders.gl/core';

setLoaderOptions({

  modules: {

    'draco_wasm_wrapper.js': require('@loaders.gl/draco/libs/draco_wasm_wrapper.js'),

    'draco_decoder.wasm': require('@loaders.gl/draco/libs/draco_decoder.wasm') // NOTE: importing `wasm` requires bundler config

  }

});
```

| Library                                    | Import                            | Install               | Size        | Description                                                                        |
| ------------------------------------------ | --------------------------------- | --------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `options.modules.draco3d`                  | `require('draco3d')`              | `npm install draco3d` | \~1.5MB     | The full Draco library (encode + decode, web assembly + IE11 javascript fallback). |
| `options.modules['draco_decoder.wasm']`    | `ArrayBuffer`                     | \~320K                | manual copy | Web Assembly Decoder (access using `draco_wasm_wrapper.js`)                        |
| `options.modules['draco_wasm_wrapper.js']` | `require('.../draco_decoder.js')` | \~64K                 | manual copy | JavaScript wrapper for `draco_decoder.wasm`                                        |
| `options.modules['draco_decoder.js']`      | `require('.../draco_decoder.js')` | \~790K                | manual copy | JavaScript decoder (fallback for IE11)                                             |
| `options.modules['draco_encoder.js']`      | `require('.../draco_encode.js')`  | \~900K                | manual copy | Encoder part of the library                                                        |

Remarks

* Due to the size of the Draco libraries, a reasonable strategy for applications that wish to bundle their dependencies (e.g to avoid relying on a potentially flaky CDN) might be to bundle and supply only `draco_decoder.wasm` and `draco_wasm_wrapper.js`, and still rely on the default setup to load the IE11 fallback library and the encoder code from CDN when needed.
* Web Assembly code (`wasm` files) must be imported/loaded as binary data (`ArrayBuffer`). An option for webpack users is the [`arraybuffer-loader`](https://www.npmjs.com/package/arraybuffer-loader#for-wasm-file) webpack "loader".

## Attributions[​](#attributions "Direct link to Attributions")

Based on the Google Draco 1.5.7 release under the Apache 2.0 license. Every vendored runtime asset is recorded with its upstream URL and SHA-256 checksum in [`src/libs/README.md`](https://github.com/visgl/loaders.gl/blob/master/modules/draco/src/libs/README.md).

# Draco roadmap

The Draco module now supports glTF-optimized decoding, retained quantization metadata, selective extraction, encoding diagnostics, and batch encoding. The remaining planned work is tracked as compatibility and lifecycle improvements rather than a worker-pool abstraction.

| Area             | Current direction                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| Presets          | `gltf`, `webgpu`, and `balanced` profiles provide explicit, reproducible defaults.                   |
| Conformance      | Keep cross-runtime fixtures for full and glTF decoder builds.                                        |
| Interoperability | Preserve names, normalized flags, transforms, and metadata across Arrow/Draco round trips.           |
| Memory           | Reuse initialized runtimes and process batches sequentially; worker pooling is tracked separately.   |
| Compatibility    | Retain legacy writer/loader entry points while steering new code to `encodeDraco` and typed reports. |

The browser encoder uses the versioned Draco 1.5.7 wrapper and WebAssembly pair. This keeps the default writer path independent of the Node-only `draco3d` package entry point; applications that need offline or worker-local loading can opt into the checked-in assets with `useLocalLibraries`.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/draco/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
