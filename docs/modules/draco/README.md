---
title: '@loaders.gl/draco'
description: Compress and decompress meshes and point clouds with Draco, including Arrow-compatible geometry paths.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Geometry compression module"
  title="Move geometry efficiently without changing its meaning."
  description="The Draco module decodes and encodes compressed meshes and point clouds. It supports render-ready mesh objects, Mesh Arrow tables, worker execution, and the glTF compression extension path."
  tone="blue"
  meta={['Draco', 'Mesh and point cloud', 'Worker and batch APIs']}
  links={[
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'},
    {label: '3D data formats', to: '/docs/developer-guide/3d-data-formats'}
  ]}
/>

<DocOrientation
  eyebrow="Compression as a pipeline stage"
  title="Decode for rendering, or keep the columns."
  description="Draco is a payload codec, not the application data model. The loader can return typed geometry for a renderer or Arrow-compatible columns for processing and conversion."
  tone="blue"
  items={[
    {label: 'Inputs', value: 'Compressed meshes and point clouds'},
    {label: 'Outputs', value: 'Mesh objects or Mesh Arrow tables'},
    {label: 'Execution', value: 'Main thread, worker, and stateful batch encoding'},
    {label: 'Composition', value: 'glTF KHR_draco_mesh_compression payloads'}
  ]}
/>

![logo](./images/draco-small.png)

<ReferenceBoundary
  title="Draco module details"
  description="The sections below cover installation, loaders, writers, batch encoding, worker behavior, and glTF integration."
  tone="blue"
/>

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
