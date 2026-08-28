# Overview

![logo](./images/draco-small.png)

The `@loaders.gl/draco` module handles compressing and decompressing of 3D meshes and point clouds with [DRACO](https://github.com/google/draco).

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/draco
```

## Loaders and Writers

| Loader                                                                | Description                                      |
| --------------------------------------------------------------------- | ------------------------------------------------ |
| [`DracoLoader`](/docs/modules/draco/api-reference/draco-loader)       | Loads Draco meshes and point clouds as Mesh objects or [Mesh Arrow tables](/docs/specifications/category-mesh#mesh-arrow-tables). |
| [`DracoWorkerLoader`](/docs/modules/draco/api-reference/draco-loader) | Loads Draco meshes and point clouds in a worker. |
| [`DracoWriter`](/docs/modules/draco/api-reference/draco-writer)       | Encodes Draco meshes and point clouds from Mesh or Mesh Arrow table data. |

`encodeDracoInBatches` accepts an async or synchronous iterator of geometry
batches. With `worker: true` it leases one worker for the full iterator and
keeps one Draco encoder alive, which is useful for large exports and stateful
batch pipelines. With `worker: false` it uses the same lifecycle locally.

The glTF writer exposes the same capability through
`{gltf: {draco: {enabled: true}}}`. This is asynchronous because the official
Draco encoder is WebAssembly-backed; use `GLTFWriter.encode` rather than
`encodeSync`. The writer appends `KHR_draco_mesh_compression` payloads to a
single buffer and leaves the original accessors in place for compatibility.

## Additional APIs

See the [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) and point cloud / mesh category documentation.

## Dependencies

Draco support requires the Draco libraries, which are quite big (see table below). By default, these will be loaded from CDN but can optionally be bundled and supplied by the application through the top-level `options.modules` option:

Bundling the entire `draco3d` library:

```typescript
import draco from 'draco3d';
import {setLoaderOptions} from '@loaders.gl/core';
setLoaderOptions({
  modules: {
    draco3d
  }
});
```

Bundling only the WebAssembly decoder

```typescript
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
| `options.modules.draco3d`                  | `require('draco3d')`              | `npm install draco3d` | ~1.5MB      | The full Draco library (encode + decode, web assembly + IE11 javascript fallback). |
| `options.modules['draco_decoder.wasm']`    | `ArrayBuffer`                     | ~320K                 | manual copy | Web Assembly Decoder (access using `draco_wasm_wrapper.js`)                        |
| `options.modules['draco_wasm_wrapper.js']` | `require('.../draco_decoder.js')` | ~64K                  | manual copy | JavaScript wrapper for `draco_decoder.wasm`                                        |
| `options.modules['draco_decoder.js']`      | `require('.../draco_decoder.js')` | ~790K                 | manual copy | JavaScript decoder (fallback for IE11)                                             |
| `options.modules['draco_encoder.js']`      | `require('.../draco_encode.js')`  | ~900K                 | manual copy | Encoder part of the library                                                        |

Remarks

- Due to the size of the Draco libraries, a reasonable strategy for applications that wish to bundle their dependencies (e.g to avoid relying on a potentially flaky CDN) might be to bundle and supply only `draco_decoder.wasm` and `draco_wasm_wrapper.js`, and still rely on the default setup to load the IE11 fallback library and the encoder code from CDN when needed.
- Web Assembly code (`wasm` files) must be imported/loaded as binary data (`ArrayBuffer`). An option for webpack users is the [`arraybuffer-loader`](https://www.npmjs.com/package/arraybuffer-loader#for-wasm-file) webpack "loader".

## Attributions

Based on the Google Draco 1.5.7 release under the Apache 2.0 license. Every
vendored runtime asset is recorded with its upstream URL and SHA-256 checksum
in [`src/libs/README.md`](https://github.com/visgl/loaders.gl/blob/master/modules/draco/src/libs/README.md).
# Draco roadmap

The Draco module now supports glTF-optimized decoding, retained quantization metadata,
selective extraction, encoding diagnostics, and batch encoding. The remaining planned work is
tracked as compatibility and lifecycle improvements rather than a worker-pool abstraction.

| Area | Current direction |
| --- | --- |
| Presets | `gltf`, `webgpu`, and `balanced` profiles provide explicit, reproducible defaults. |
| Conformance | Keep cross-runtime fixtures for full and glTF decoder builds. |
| Interoperability | Preserve names, normalized flags, transforms, and metadata across Arrow/Draco round trips. |
| Memory | Reuse initialized runtimes and process batches sequentially; worker pooling is tracked separately. |
| Compatibility | Retain legacy writer/loader entry points while steering new code to `encodeDraco` and typed reports. |

The browser encoder uses the versioned Draco 1.5.7 wrapper and WebAssembly pair. This keeps the
default writer path independent of the Node-only `draco3d` package entry point; applications that
need offline or worker-local loading can opt into the checked-in assets with `useLocalLibraries`.
