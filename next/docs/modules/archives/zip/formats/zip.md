Archive format

# ZIP

ZIP packages related files behind one container. loaders.gl’s random-access support validates local headers and central-directory metadata so applications can fetch or read individual entries when appropriate.

[ZIP module](https://loaders.gl/next/docs/modules/archives.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/archives.md)[ZipLoader](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-loader.md)[ZipArchive](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-archive.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-archive.md)

The archive path

## Inspect the directory. Select an entry. Read only what the pipeline needs.

The archive boundary separates container validation and entry lookup from the format-specific loader that decodes each selected member.

01

Container

Local headers, central directory, and ZIP64 metadata

02

Lookup

Entry names, offsets, compressed and uncompressed sizes

03

Read

Individual members through a virtual file system

04

Decode

Pass selected entries to their format loaders

> The [`loaders.gl/zip`](https://loaders.gl/next/docs/modules/archives.md) module provides support for working with Zip Archives.

Detailed guide

## ZIP container and validation details

The reference below covers local header layouts, data descriptors, ZIP64 validation, random access, and member loading.

## Format overview[​](#format-overview "Direct link to Format overview")

ZIP stores a collection of named entries and a central directory. Entries can use different compression methods. ZIP64 extends sizes, offsets, and entry counts beyond ZIP32 limits; it is part of ZIP, not a separate file extension. ZIP archives produced by 7-Zip are distinct from native `.7z` archives.

The shared [`openZipArchive`](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-archive.md) reader provides validated entry metadata, complete reads, streaming reads, and STORE byte ranges. [`ZipFileSystem`](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-filesystem.md) adapts these to confined resource URLs and streaming `Response` objects, with single STORE ranges returning 206 or 416. [`ZipLoader`](https://loaders.gl/next/docs/modules/archives/zip/api-reference/zip-loader.md) loads a complete collection; [`encodeZip` and `encodeZipInBatches`](https://loaders.gl/next/docs/modules/archives/zip/api-reference/encode-zip.md) write native ZIP32/ZIP64 collections. `ZipLoader` and `ZipWriter` delegate to these native APIs with typed `zip.*` options; the ZIP package has no external runtime dependencies.

## Feature support[​](#feature-support "Direct link to Feature support")

**Supported** means implemented for the stated profile. **Partial** means the restriction in Notes applies. **Unsupported** profiles fail in the shared reader. This table describes container capabilities, not decoding of the files stored inside an archive.

| Feature                                              | Read (`openZipArchive`) | Write (`encodeZip`) | Notes                                                                                                                                                               |
| ---------------------------------------------------- | ----------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ZIP32                                                | Supported               | Supported           | Single-disk archives.                                                                                                                                               |
| ZIP64 sizes and offsets                              | Supported               | Supported           | Reader metadata and native writer fields use `bigint`.                                                                                                              |
| ZIP64 entry counts                                   | Supported               | Supported           | Subject to configurable directory/entry limits.                                                                                                                     |
| STORE (method 0)                                     | Supported               | Supported           | Default writer compression.                                                                                                                                         |
| Raw DEFLATE (method 8)                               | Supported               | Supported           | Select native `compression: 'deflate'` globally or per entry.                                                                                                       |
| Signed and unsigned data descriptors                 | Supported               | Supported           | Reader accepts signed/unsigned ZIP32/ZIP64 descriptors; native writer emits signed descriptors.                                                                     |
| Directory entries                                    | Supported               | Supported           | Explicit empty entries ending in `/`; native writer does not create parent directories automatically.                                                               |
| Entry and archive comments                           | Supported               | Supported           | Archive comments use CP437 in the shared reader; entry comments follow UTF-8 flags/Unicode extras.                                                                  |
| UTF-8 names                                          | Supported               | Supported           | Invalid UTF-8 is rejected by the shared reader; native writers reject unpaired UTF-16 surrogates.                                                                   |
| Legacy CP437 names                                   | Supported               | Partial             | Native writer emits UTF-8 names and CP437 archive comments.                                                                                                         |
| Unicode path/comment extra fields                    | Supported               | Unsupported         | Reader validates original-byte CRC/version; native writer uses UTF-8 flags instead of Unicode extra fields.                                                         |
| Complete-entry CRC-32 validation                     | Supported               | Supported           | Reader verifies at completion; writer generates CRC metadata.                                                                                                       |
| STORE byte-range reads                               | Supported               | Unsupported         | Partial reads cannot verify a complete-entry CRC.                                                                                                                   |
| DEFLATE byte-range reads                             | Unsupported             | Unsupported         | Consume a complete or streaming decoded entry instead.                                                                                                              |
| Streaming entry reads                                | Supported               | —                   | CRC is verified only if the iterator is consumed through completion.                                                                                                |
| Streaming archive output                             | —                       | Supported           | Native writer streams ZIP32/ZIP64; indexed SLPK/3TZ writers stream populated STORE ZIP32/ZIP64.                                                                     |
| Indexed local-header access                          | Partial                 | Partial             | Populated headers avoid directory scans; descriptor entries use the cached directory. SLPK/3TZ define their own hash indexes and use the shared reader.             |
| Cancellation and close                               | Supported               | Supported           | Reader releases owned files; native writer supports `AbortSignal` and releases acquired stream locks.                                                               |
| Configurable byte/entry limits                       | Supported               | Supported           | Reader and native writer expose independent byte/count limits. Indexed writers also bound output, entries, and directory metadata. These are not total heap limits. |
| Encryption, split archives, self-extracting prefixes | Unsupported             | Unsupported         | Outside the qualified shared-container profile.                                                                                                                     |
| Native `.7z` and additional compression methods      | Unsupported             | Unsupported         | Separate formats/profiles; a ZIP produced by 7-Zip can use the supported ZIP methods.                                                                               |

Native writing defaults to STORE, automatic ZIP64, sorted paths and a fixed UTC timestamp. Auto ZIP64 reserves 64-bit sizes for stream/DEFLATE inputs whose encoded lengths are unknown. The buffered encoder retains the complete result; use the streaming encoder and explicit output budgets for large archives. Independent Info-ZIP and 7-Zip qualification uses small archives; exhaustive large-file interoperability remains separate work.

## Validation and random access[​](#validation-and-random-access "Direct link to Validation and random access")

The reader locates the end record, validates directory bounds, and caches the directory on the first named lookup or enumeration. It rejects duplicate paths/offsets, noncanonical relative paths, inconsistent local/central metadata, overlapping payloads, truncated reads, unsupported flags, and decoded sizes that differ from the declared size. Directory entries are validated as they are requested; opening a file does not decode every payload.

ZIP64 local size sentinels require both size fields in the ZIP64 extra record. The central directory supplies authoritative sizes for descriptor entries, with signed or unsigned ZIP32/ZIP64 descriptors validated against those values; redundant ZIP64 extras do not override a matching descriptor layout. Completed reads additionally verify CRC-32. A partial read or an iterator stopped before completion does not provide whole-entry integrity verification.

`getEntryAt()` supports format-provided local-header offsets. Populated headers are read directly; this path validates local metadata and payload bounds. Use named lookup when local/central consistency is required. Descriptor entries fall back to the shared directory.

## Archive profiles[​](#archive-profiles "Direct link to Archive profiles")

SLPK and 3TZ add required resources and hash indexes to ZIP. Those policies remain in their format adapters. SLPK stores resources in STORE entries and can gzip the resource content itself; this inner gzip is separate from ZIP compression. Esri specifies ZIP64 for SLPK archives above 2 GB. The SLPK writer defaults to a 2 GiB output budget; raise it explicitly for larger streaming output, which automatically uses ZIP64. [Esri I3S specification](https://github.com/Esri/i3s-spec/blob/master/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md).

## Specifications[​](#specifications "Direct link to Specifications")

* [PKWARE ZIP APPNOTE](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT)
* [7-Zip native 7z format](https://www.7-zip.org/7z.html)
