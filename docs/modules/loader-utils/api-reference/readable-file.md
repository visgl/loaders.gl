# ReadableFile implementations

`ReadableFile` objects provide random access to binary content without exposing any platform-specific APIs. loaders.gl ships ready-made implementations for both browser and Node.js environments so that loaders can work with the same API regardless of where the data lives.

## Available classes

- [`HttpFile`](./http-file) (browser & Node.js) – validates HTTP byte-range reads and pins remote object identity.
- `ArrayBufferFile` (browser & Node.js) – provides direct random-access reads over an in-memory `ArrayBuffer` without wrapping it in a `Blob`.
- `BlobFile` (browser & Node.js) – provides random access reads on `Blob` or `File` instances via the standard slicing APIs.
- `NodeFile` (Node.js) – exposes random access reads backed by the local file system without importing `fs` directly in application code.
- `DataViewReadableFile` (browser & Node.js) – adapts an in-memory `ArrayBuffer`/`DataView` into the `ReadableFile` interface for archive parsing or other buffer-first workflows.

All implementations satisfy the `ReadableFile` interface exported from `@loaders.gl/loader-utils` and support exact `read` operations for incremental processing of large files.

:::info
Legacy `FileProvider` classes have been removed from the default `@loaders.gl/loader-utils` exports. Use the `ReadableFile` implementations above instead.
:::

## Usage

### Reading from a URL

```typescript
import {HttpFile} from '@loaders.gl/loader-utils';

const file = await HttpFile.open('https://example.com/archive.3tz');
const header = await file.read(0, 1024);
```

### Reading browser `File` drops

```typescript
import {BlobFile} from '@loaders.gl/loader-utils';

async function inspectUpload(fileInput: File) {
  const blobFile = new BlobFile(fileInput);
  const signature = await blobFile.read(0, 8);
  return new Uint8Array(signature);
}
```

### Reading local files under Node.js

```typescript
import {NodeFile} from '@loaders.gl/loader-utils';

const nodeFile = new NodeFile('/data/tileset.slpk');
const {size} = await nodeFile.stat();
const footerLength = Math.min(size, 4096);
const footerBytes = await nodeFile.read(size - footerLength, footerLength);
```

### Adapting an `ArrayBuffer`

```typescript
import {ArrayBufferFile} from '@loaders.gl/loader-utils';

const archiveBuffer = await fetch(url).then((response) => response.arrayBuffer());
const archiveFile = new ArrayBufferFile(archiveBuffer);
const header = await archiveFile.read(0, 8);
```

These adapters can be passed anywhere a loader expects a `ReadableFile`, ensuring consistent random access across browser and Node.js environments.
