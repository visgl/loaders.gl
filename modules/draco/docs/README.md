# Overview

![logo](./images/draco-small.png)

The `@loaders.gl/draco` module handles compressing and decompressing of 3D meshes and point clouds with [DRACO](https://github.com/google/draco).

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/draco
```

## Loaders and Writers

| Loader                                                               |
| -------------------------------------------------------------------- |
| [`DracoLoader`](modules/draco/docs/api-reference/draco-loader)       |
| [`DracoWorkerLoader`](modules/draco/docs/api-reference/draco-loader) |
| [`DracoWriter`](modules/draco/docs/api-reference/draco-writer)       |

## Additional APIs

See point cloud / mesh category.

## Dependencies

Draco support requires the Draco libraries, which are quite big (see table below). By default, these will be loaded from CDN but can optionally be bundled and supplied by the application through the top-level `options.modules` option:

Bundling the entire `draco3d` library:

```js
import draco from 'draco3d';
import {setLoaderOptions} from '@loaders.gl/core';
setLoaderOptions({
  modules: {
    draco3d
  }
});
```

Bundling only the WebAssembly decoder

```js
import {setLoaderOptions} from '@loaders.gl/core';
setLoaderOptions({
  modules: {
    'draco_wasm_wrapper.js': require('@loaders.gl/draco/libs/draco_wasm_wrapper.js'),
    'draco_decoder.wasm': require('@loaders.gl/draco/libs/draco_decoder.wasm') // NOTE: importing `wasm` requires bundler config
  }
});
```

| Library                                 | Import                            | Install               | Size        | Description                                                                        |
| --------------------------------------- | --------------------------------- | --------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `options.libs.draco3d`                  | `require('draco3d')`              | `npm install draco3d` | ~1.5MB      | The full Draco library (encode + decode, web assembly + IE11 javascript fallback). |
| `options.libs['draco_decoder.wasm']`    | [`ArrayBuffer`]()                 | ~320K                 | manual copy | Web Assembly Decoder (access using `draco_wasm_wrapper.js`)                        |
| `options.libs['draco_wasm_wrapper.js']` | `require('.../draco_decoder.js')` | ~64K                  | manual copy | JavaScript wrapper for `draco_decoder.wasm`                                        |
| `options.libs['draco_decoder.js']`      | `require('.../draco_decoder.js')` | ~790K                 | manual copy | JavaScript decoder (fallback for IE11)                                             |
| `options.libs['draco_encoder.js']`      | `require('.../draco_encode.js')`  | ~900K                 | manual copy | Encoder part of the library                                                        |

Remarks

- Due to the size of the Draco libraries, a reasonable strategy for applications that wish to bundle their dependencies (e.g to avoid relying on a potentially flaky CDN) might be to bundle and supply only `draco_decoder.wasm` and `draco_wasm_wrapper.js`, and still rely on the default setup to load the IE11 fallback library and the encoder code from CDN when needed.
- Web Assembly code (`wasm` files) must be imported/loaded as binary data (`ArrayBuffer`). An option for webpack users is the [`arraybuffer-loader`](https://www.npmjs.com/package/arraybuffer-loader#for-wasm-file) webpack "loader".

## Attributions

Based on Draco examples, under the Apache 2.0 license.
