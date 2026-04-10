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

#### `preload()`

`preload(): Promise<void>`

Asynchronously loads required libraries. For some hash classes this must be completed before
`hashSync()` is available.

#### `hash()`

```typescript
  hash.hash(data: ArrayBuffer, encoding: 'hex' | 'base64'): Promise<ArrayBuffer>
```

Asynchronously hashes data.

#### `hashSync()`

```typescript
  hash.hashSync(data: ArrayBuffer, encoding: 'hex' | 'base64'): ArrayBuffer
```

Synchronously hashes data.

:::caution
For some hash sub classes, `preload()` must have been called and completed before
synchronous operations are available.
:::

#### `hashInBactches()`

```typescript
  hash.hashBatches(data: AsyncIterable<ArrayBuffer>, encoding: 'hex' | 'base64'): AsyncIterable<ArrayBuffer>
```

Asynchronously hashes data in batches.

If the underlying hashion does not support streaming hashion,
the incoming data will be concatenated into a single `ArrayBuffer`
and a single hashed batch will be yielded.
