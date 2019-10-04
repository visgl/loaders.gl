# Draco 3D Data Compression

Draco is an open-source library for compressing and decompressing 3D geometric meshes and point clouds. It is intended to improve the storage and transmission of 3D graphics.

[Website](https://google.github.io/draco/) | [GitHub](https://github.com/google/draco)

## Contents

This folder contains three utilities:

- `draco_decoder.js` — Emscripten-compiled decoder, compatible with any modern browser.
- `draco_decoder.wasm` — WebAssembly decoder, compatible with newer browsers and devices.
- `draco_wasm_wrapper.js` — JavaScript wrapper for the WASM decoder.

Either variation may be used with `DRACOLoader`:

```js
import {load} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/draco';

load(DracoLoader, {
  libraryPath: 'path/to/decoders/',
  decoderType: 'js' // (Optional) Override detection of WASM support.
});
```

Further [documentation on GitHub](https://github.com/google/draco/tree/master/javascript/example#static-loading-javascript-decoder).

## License

[Apache License 2.0](https://github.com/google/draco/blob/master/LICENSE)
