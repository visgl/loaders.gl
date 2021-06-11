# LZ4DeflateTransform

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" />
</p>

## Methods

#### `constructor(options?: object)`

#### `LZ4DeflateTransform.run(data: ArrayBuffer): Promise<ArrayBuffer>`

Compresses (deflates) LZ4 encoded data.

#### `LZ4DeflateTransform.runSync(data: ArrayBuffer): Promise<ArrayBuffer>`

Compresses (deflates) LZ4 encoded data.

#### `LZ4DeflateTransform.runInBatches(data: ArrayBuffer): Promise<ArrayBuffer>`

Compresses (deflates) LZ4 encoded data.
