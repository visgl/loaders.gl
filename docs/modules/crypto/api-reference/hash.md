# Hash

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

`Hash` is the abstract base class for loaders.gl hash classes.

## Fields

#### `name`: string

The name of the hash algorithm

#### `isSupported`: boolean

## Methods

#### `preload(): Promise<void>`

Asynchronously loads required libraries. For some hash classes this must be completed before
`hashSync()` is available.

#### `hash(data: ArrayBuffer): Promise<ArrayBuffer>`

Asynchronously hashes data.

#### `hashSync(data: ArrayBuffer): ArrayBuffer`

Synchronously hashes data.

For some hashions `preload()` must have been called and completed before
synchronous operations are available.

#### `hashBatches(data: AsyncIterable<ArrayBuffer>): AsyncIterable<ArrayBuffer>`

Asynchronously hashes data in batches.

If the underlying hashion does not support streaming hashion,
the incoming data will be concatenated into a single `ArrayBuffer`
and a single hashed batch will be yielded.
