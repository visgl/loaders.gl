Archive module

# Open archives at the edge of your data pipeline.

`@loaders.gl/archives/zip` handles ZIP decompression and construction behind a small browser- and Node.js-friendly surface. Use it when a loader or application needs to inspect an archive before handing its contents to another format handler.

[ZIP format](https://loaders.gl/next/docs/modules/archives/zip/formats/zip.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/archives/zip/formats/zip.md)[Using loaders](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-loaders.md)[ZIP APIs](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-loader.md)

The archive path

## Open the container. Hand each entry to the right loader.

Archive handling is usually an intermediate step: inspect entries, extract the bytes that matter, and continue through the normal loaders.gl format pipeline.

01

Input

ZIP archive data

02

Inspect

Archive entries and their payload bytes

03

Compose

ZIP output through native encoders

04

Next step

Pass extracted data to a format loader

Detailed guide

## Archive implementation details

The reference below covers installation, ZIP loading and writing, options, and the upstream libraries used by the module.

The `@loaders.gl/archives/zip` subpath handles ZIP archive reading and writing.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/archives
```

## Random-access archives[​](#random-access-archives "Direct link to Random-access archives")

Use [`openZipArchive`](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-archive.md) to inspect a ZIP32/ZIP64 archive, read complete members with CRC validation, stream decoded entries, or read STORE byte ranges. See the [ZIP feature table](https://loaders.gl/next/docs/modules/archives/zip/formats/zip.md) for the supported container profiles and the limits of the current writer.

Use [`ZipFileSystem`](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-filesystem.md) when consumers need `fetch` responses, a cached directory, confined resource URLs, or incremental STORE ranges.

## Native writing[​](#native-writing "Direct link to Native writing")

[`encodeZip` and `encodeZipInBatches`](https://loaders.gl/next/docs/modules/archives/zip/api-reference/encode-zip.md) write ZIP32/ZIP64 from named buffers, Blobs or byte streams, with STORE/DEFLATE, deterministic metadata, cancellation and output budgets. Indexed archives use the same native serializers while retaining populated local headers. `ZipWriter` delegates to the same native encoder and additionally accepts UTF-8 string values and optional parent directory entries.

## Attributions[​](#attributions "Direct link to Attributions")

`ZipLoader` delegates to the shared native reader, verifies complete-entry CRCs and returns ArrayBuffer values. Its root export is metadata only; direct parser access uses `@loaders.gl/archives/zip/zip-loader`. The ZIP package runtime dependencies are loaders.gl modules only.
