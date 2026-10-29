ZIP API · archive loader

# Open an archive into named resources.

ZipLoader turns a ZIP archive into a file map, keeping each path and its decoded contents available to the application. It is the useful boundary for bundled assets, fixtures, and nested data packages.

[ZIP module](https://loaders.gl/next/docs/modules/archives.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/archives.md)[ZIP format](https://loaders.gl/next/docs/modules/archives/zip/formats/zip.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/archives/zip/formats/zip.md)[ZipWriter](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-writer.md)

The archive path

## Keep the archive boundary simple: path in, content out.

The loader handles ZIP structure and returns an object keyed by archive paths. The application decides which entries to parse next and which loaders should handle them.

01

Input

ZIP bytes as an ArrayBuffer or loader input

02

Output

File map keyed by names or relative paths

03

Contents

ArrayBuffer values for each file

04

Next step

Dispatch extracted resources to their format loaders

Detailed guide

## ZipLoader reference

The sections below document archive metadata, usage, file-map output, and native validation and decoded-output limits.

![From-v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)

Decodes a Zip Archive into a file map.

| ZipLoader      |                                                                                      |
| -------------- | ------------------------------------------------------------------------------------ |
| File Extension | `.zip`                                                                               |
| File Type      | Binary                                                                               |
| File Format    | [ZIP Archive](https://loaders.gl/next/docs/modules/archives/zip/formats/zip.md) |
| Data Format    | "File Map"                                                                           |
| Decoder Type   | Asynchronous                                                                         |
| Worker Thread  | ❌ No                                                                                |
| Streaming      | ❌ No                                                                                |

## Usage[​](#usage "Direct link to Usage")

```
import {parse} from '@loaders.gl/core';

import {ZipLoader} from '@loaders.gl/archives/zip';



const fileMap = await parse(arrayBuffer, ZipLoader);

for (const fileName in fileMap) {

  const fileData = fileMap[fileName];

  // Do something with the subfile

}
```

## Data Format[​](#data-format "Direct link to Data Format")

The file map is an object with keys representing file names or relative paths in the zip file, and values being the contents of each sub file as an `ArrayBuffer`. Directory entries are omitted. The map has a null prototype, so names such as `__proto__` remain ordinary file keys. Errors reject the parse instead of appearing as map values.

## Options[​](#options "Direct link to Options")

The typed `zip` namespace accepts the limits and `signal` documented for [`openZipArchive`](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-archive.md). Complete reads always verify decoded sizes and CRC-32. Unsupported ZIP profiles reject.

| Option                     | Type          | Default               | Description                                                                 |
| -------------------------- | ------------- | --------------------- | --------------------------------------------------------------------------- |
| `zip.maxTotalDecodedBytes` | `bigint`      | `64n * 1024n * 1024n` | Sum of file sizes retained in the result; checked before decoding payloads. |
| `zip.maxDecodedBytes`      | `bigint`      | `64n * 1024n * 1024n` | Maximum decoded bytes per complete entry.                                   |
| `zip.maxCompressedBytes`   | `bigint`      | `64n * 1024n * 1024n` | Maximum compressed bytes per complete entry.                                |
| `zip.signal`               | `AbortSignal` | —                     | Cancels archive initialization and reads.                                   |

The total-map, decoded-entry and compressed-entry limits are independent. Raising `maxTotalDecodedBytes` does not raise either entry limit. For an entry larger than 64 MiB, set `maxDecodedBytes` and, when its compressed payload is also larger, `maxCompressedBytes`. These limits bound encoded/decoded byte counts, not decoder intermediates or total heap. Use the shared archive API for incremental or range reads instead of retaining a complete map.

The package root exports metadata. For direct parser access:

```
import {ZipLoaderWithParser} from '@loaders.gl/archives/zip/zip-loader';

const files = await ZipLoaderWithParser.parse(arrayBuffer, {

  zip: {

    maxTotalDecodedBytes: 256n * 1024n * 1024n,

    maxDecodedBytes: 128n * 1024n * 1024n,

    maxCompressedBytes: 128n * 1024n * 1024n

  }

});
```
