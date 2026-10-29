Random-access file interface

# Give every binary loader the same file-shaped input.

`ReadableFile` implementations hide whether bytes live in a cloud object, an in-memory buffer, a browser Blob, or a Node.js file. Format loaders can request exact ranges without importing platform-specific APIs.

[Loader utilities](https://loaders.gl/next/docs/modules/core/loader-utils.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils.md)[HTTP file](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/http-file.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/http-file.md)[Range scheduler](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-scheduler.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-scheduler.md)

The file boundary

## Open the source. Read exact bytes. Keep the parser portable.

The same \`read\` operation can target remote HTTP ranges, browser-owned bytes, or a local file. That lets archives, tiles, point clouds, and analytical formats share access code.

01

Remote

HttpFile with validators and HTTP Range

02

Memory

ArrayBufferFile

03

Browser

BlobFile and File-backed reads

04

Node.js

NodeFile backed by the local filesystem

`ReadableFile` objects provide random access to binary content without exposing any platform-specific APIs. loaders.gl ships ready-made implementations for both browser and Node.js environments so that loaders can work with the same API regardless of where the data lives.

Detailed guide

## Readable-file implementations

The reference below compares remote, memory, browser, and Node.js implementations and shows how each one supports exact reads.

## Available classes[​](#available-classes "Direct link to Available classes")

* [`HttpFile`](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/http-file.md) (browser & Node.js) – validates HTTP byte-range reads and pins remote object identity.
* `ArrayBufferFile` (browser & Node.js) – provides direct random-access reads over an in-memory `ArrayBuffer` without wrapping it in a `Blob`.
* `BlobFile` (browser & Node.js) – provides random access reads on `Blob` or `File` instances via the standard slicing APIs.
* `NodeFile` (Node.js) – exposes random access reads backed by the local file system without importing `fs` directly in application code.
* `ArrayBufferFile` (browser & Node.js) – adapts an in-memory `ArrayBuffer` into the `ReadableFile` interface for archive parsing or other buffer-first workflows.

All implementations satisfy the `ReadableFile` interface exported from `@loaders.gl/core/loader-utils` and support exact `read` operations for incremental processing of large files.

info

Legacy `FileProvider` classes have been removed from the default `@loaders.gl/core/loader-utils` exports. Use the `ReadableFile` implementations above instead.

## Usage[​](#usage "Direct link to Usage")

### Reading from a URL[​](#reading-from-a-url "Direct link to Reading from a URL")

```
import {HttpFile} from '@loaders.gl/core/loader-utils';



const file = await HttpFile.open('https://example.com/archive.3tz');

const header = await file.read(0, 1024);
```

### Reading browser `File` drops[​](#reading-browser-file-drops "Direct link to reading-browser-file-drops")

```
import {BlobFile} from '@loaders.gl/core/loader-utils';



async function inspectUpload(fileInput: File) {

  const blobFile = new BlobFile(fileInput);

  const signature = await blobFile.read(0, 8);

  return new Uint8Array(signature);

}
```

### Reading local files under Node.js[​](#reading-local-files-under-nodejs "Direct link to Reading local files under Node.js")

```
import {NodeFile} from '@loaders.gl/core/loader-utils';



const nodeFile = new NodeFile('/data/tileset.slpk');

const {size} = await nodeFile.stat();

const footerLength = Math.min(size, 4096);

const footerBytes = await nodeFile.read(size - footerLength, footerLength);
```

### Adapting an `ArrayBuffer`[​](#adapting-an-arraybuffer "Direct link to adapting-an-arraybuffer")

```
import {ArrayBufferFile} from '@loaders.gl/core/loader-utils';



const archiveBuffer = await fetch(url).then((response) => response.arrayBuffer());

const archiveFile = new ArrayBufferFile(archiveBuffer);

const header = await archiveFile.read(0, 8);
```

These adapters can be passed anywhere a loader expects a `ReadableFile`, ensuring consistent random access across browser and Node.js environments.
