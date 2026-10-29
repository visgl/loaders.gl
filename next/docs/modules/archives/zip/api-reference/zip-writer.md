ZIP API · archive writer

# Package named resources into one archive.

ZipWriter accepts a file map and emits a valid ZIP archive. Paths can represent nested files or explicit directories, with typed compression, ZIP64, cancellation, and output limits.

[ZIP module](https://loaders.gl/next/docs/modules/archives.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/archives.md)[ZIP format](https://loaders.gl/next/docs/modules/archives/zip/formats/zip.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/archives/zip/formats/zip.md)[ZipLoader](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-loader.md)

The archive writing path

## Build the archive from the paths your application already owns.

Use a file map to describe archive contents without manually managing ZIP records. The writer preserves nested paths and delegates serialization to the native ZIP encoder.

01

Input

Object of archive paths and string or binary contents

02

Directories

Trailing slash keys become directory entries

03

Output

ArrayBuffer containing a ZIP archive

04

Control

Native ZIP options and parent directory creation

Detailed guide

## ZipWriter reference

The sections below document file-map input, nested paths, output behavior, progress callbacks, and archive options.

Encodes a filemap into a Zip Archive. Returns an `ArrayBuffer` that is a valid Zip Archive and can be written to file.

| ZipWriter      |                                                                                      |
| -------------- | ------------------------------------------------------------------------------------ |
| File Format    | [ZIP Archive](https://loaders.gl/next/docs/modules/archives/zip/formats/zip.md) |
| Data Format    | "File Map"                                                                           |
| File Extension | `.zip`                                                                               |
| File Type      | Binary                                                                               |
| Encoder Type   | Asynchronous                                                                         |
| Worker Thread  | ❌ No                                                                                |
| Streaming      | ❌ No                                                                                |

## Usage[​](#usage "Direct link to Usage")

```
import {encode} from '@loaders.gl/core';

import {writeFile} from 'node:fs/promises';

import {ZipWriter} from '@loaders.gl/archives/zip';



const FILE_MAP = {

  filename1: arrayBuffer1,

  'directory/filename2': arrayBuffer2,

  'directory/nested/': ''

};



const arrayBuffer = await encode(FILE_MAP, ZipWriter);

await writeFile(zipFileName, new Uint8Array(arrayBuffer));
```

## File Format[​](#file-format "Direct link to File Format")

The file map is an object with keys representing file names or relative paths in the zip file, and values being the contents of each subfile (either `ArrayBuffer` or `String`).

* Nested keys such as `folder/file.txt` are written as file paths inside the archive.
* Keys ending with `/` are written as directory entries.
* Parent directory entries can also be emitted for nested file keys.

## Options[​](#options "Direct link to Options")

Output is always an ArrayBuffer. The typed `zip` namespace accepts [`ZipEncodeOptions`](https://loaders.gl/next/docs/modules/archives/zip/api-reference/encode-zip.md), including lower-case `compression: 'store' | 'deflate'`, `zip64`, fixed UTC `date`, `signal`, and byte/count limits. Defaults are STORE, automatic ZIP64, sorted paths and the timestamp 1980-01-01 UTC.

| Option              | Type                                    | Default | Description                                                                                             |
| ------------------- | --------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `zip.createFolders` | `boolean`                               | `false` | Emits empty parent directory entries for nested file keys. Generated entries count toward `maxEntries`. |
| `zip.onUpdate`      | `(metadata: {percent: number}) => void` | —       | Receives 0 before encoding and 100 after successful completion; no intermediate progress is promised.   |

String values are encoded as UTF-8. Binary inputs, Blobs, byte streams and per-entry metadata are accepted as described by the native encoder. Directory keys require empty data. JSZip passthrough options have been removed; use `zip.compression` and the other native options. The writer buffers the complete output; use `encodeZipInBatches` for storage backpressure.

Explicit slash-suffixed keys are written as directory entries whether or not `zip.createFolders` is enabled.

## Indexed ZIP packaging[​](#indexed-zip-packaging "Direct link to Indexed ZIP packaging")

`encodeIndexedZip` is exported from `@loaders.gl/archives/zip/indexed-zip-writer` and `@loaders.gl/archives/zip`. It is the portable shared encoder used by the 3TZ and SLPK format writers. Supply immutable `ArrayBuffer`/`Blob` resources and `{indexPath, maxArchiveBytes, lowercasePaths?, zip64?, signal?}`. Paths must be canonical relative ASCII; the generated index name must be nonnumeric and absent from resources. Lowercasing hashes also rejects case-folded duplicate resource paths.

The deterministic STORE ZIP32/ZIP64 has a final 24-byte MD5/local-header-offset index, a fixed UTC timestamp, populated local headers, and no descriptors/comments/directories. The complete size is measured before Blob reads. Format writers supply format-specific root requirements, index names, and output budgets. Prefer those writers for 3TZ/SLPK. This function does not validate payloads or reference closure or impose a total peak-memory budget.

`encodeIndexedZipInBatches` is available from the implementation subpath for application-owned storage. It yields the same deterministic bytes without a complete archive or entry buffer. Payload reads/copies use blocks of at most 64 KiB. Each resource is read once to calculate its CRC-32 before the populated local header, then again to emit payload blocks on demand. Await each destination write for backpressure; finalize only after iteration succeeds and discard partial output on failure, cancellation, or early return. Inputs must remain immutable.

`zip64` accepts `'auto'` (default), `'always'` or `'never'`. Automatic selection accounts for sizes, offsets, entry counts and an optional format-specific `zip64Threshold`. The shared metadata limits are 100,000 entries and 32 MiB of central records, configurable through `maxEntries` and `maxDirectoryBytes`. The buffered API rejects output beyond 4 GiB; use streaming for larger archives.

Both APIs check `signal` between block reads and header encodes. Caller-owned inputs and index/directory metadata remain in memory; the buffered API also allocates the complete archive.

## Legacy Node composition[​](#legacy-node-composition "Direct link to Legacy Node composition")

`createZip` and `addOneFile` remain available for the converter CLI. They share native ZIP serializers; `addOneFile` validates existing records before mutation, preserves payload offsets and comments, and rejects duplicate paths. Files are closed on success and failure. A write failure can leave partial output, so callers must discard it. New portable code should use the encoders above.

`createZip(inputPath, outputPath, createAdditionalData?, options?)` accepts `maxArchiveBytes` (bigint, default 1 TiB), `maxEntries` (100,000), `maxDirectoryBytes` (32 MiB) and `signal`. It retains the legacy per-file buffering behavior. `addOneFile(path, bytes, name, options?)` accepts the shared reader limits and cancellation signal before modifying an archive.

Append transports require a directory offset within the safe integer range for truncation.
