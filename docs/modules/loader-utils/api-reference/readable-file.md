# ReadableFile implementations

`ReadableFile` objects provide random access to binary content without exposing any platform-specific APIs. loaders.gl ships ready-made implementations for both browser and Node.js environments so that loaders can work with the same API regardless of where the data lives.

## Available classes

- `HttpFile` (browser & Node.js) – wraps a URL and downloads byte ranges with HTTP range requests when supported.
- `BlobFile` (browser & Node.js) – provides random access reads on `Blob` or `File` instances via the standard slicing APIs.
- `NodeFile` (Node.js) – exposes random access reads backed by the local file system without importing `fs` directly in application code.
- `DataViewReadableFile` (browser & Node.js) – adapts an in-memory `ArrayBuffer`/`DataView` into the `ReadableFile` interface for archive parsing or other buffer-first workflows.

All implementations satisfy the `ReadableFile` interface exported from `@loaders.gl/loader-utils` and support `slice`/`read` helpers for incremental processing of large files.

:::info
Legacy `FileProvider` classes have been removed from the default `@loaders.gl/loader-utils` exports. Use the `ReadableFile` implementations above instead.
:::

## Usage

### Reading from a URL

```typescript
import {HttpFile} from '@loaders.gl/loader-utils'

const file = new HttpFile('https://example.com/archive.3tz')
const header = await file.slice(0, 1024).arrayBuffer()
```

### Reading browser `File` drops

```typescript
import {BlobFile} from '@loaders.gl/loader-utils'

async function inspectUpload(fileInput: File) {
  const blobFile = new BlobFile(fileInput)
  const signature = await blobFile.slice(0, 8).arrayBuffer()
  return new Uint8Array(signature)
}
```

### Reading local files under Node.js

```typescript
import {NodeFile} from '@loaders.gl/loader-utils'

const nodeFile = new NodeFile('/data/tileset.slpk')
const footerBytes = await nodeFile.slice(-4096).arrayBuffer()
```

### Adapting an `ArrayBuffer`

```typescript
import {DataViewReadableFile} from '@loaders.gl/zip'

const archiveBuffer = await fetch(url).then((response) => response.arrayBuffer())
const archiveFile = new DataViewReadableFile(new DataView(archiveBuffer))
```

These adapters can be passed anywhere a loader expects a `ReadableFile`, ensuring consistent random access across browser and Node.js environments.
