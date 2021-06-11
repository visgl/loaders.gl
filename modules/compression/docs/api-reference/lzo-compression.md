# ZstdTransform

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" />
</p>

## Static Methods

#### `ZstdInflateTransform.preload(options?: object): Promise<void>`

Preloads the Zstd library

## Methods

#### `constructor(options?: object)`

#### `ZstdInflateTransform.run(data: ArrayBuffer, options?: object): Promise<ArrayBuffer>`

Compresses or decompresses Zstandard encoded data.
