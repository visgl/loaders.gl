# ZipArchive

`openZipArchive()` opens an owned random-access ZIP32/ZIP64 archive. Inputs can be an `ArrayBuffer`,
a typed-array/DataView slice, a `Blob`, or a `ReadableFile` from `@loaders.gl/core/loader-utils`.
The input must remain immutable while the archive is open. Always close the archive, including
when a read fails; closing also closes a supplied `ReadableFile`.

```typescript
import {openZipArchive} from '@loaders.gl/archives/zip';

const archive = await openZipArchive(blob);
try {
  for await (const entry of archive.entries()) {
    console.log(entry.path, entry.size); // bigint
  }
  const bytes = await archive.read('tileset.json');
  // A STORE entry can also be read without decoding unrelated bytes:
  const prefix = await archive.readRange('tileset.json', {start: 0n, end: 16n});
} finally {
  await archive.close();
}
```

## Methods and metadata

| Member | Behavior |
| --- | --- |
| `size`, `comment` | Archive byte length (`bigint`) and decoded archive comment. |
| `entries()` | Async iterable of validated entries in central-directory order. |
| `getLastEntry()` | Validates the final central entry with a bounded directory-tail read; ambiguous signatures fall back to directory indexing. |
| `getEntry(path)` | Caches successful named lookup; failed transport reads can retry; returns `undefined` for an absent entry. |
| `getEntryAt(localHeaderOffset)` | Direct populated-header lookup by `bigint` offset; descriptor entries fall back to the directory. |
| `read(entryOrPath, {signal}?)` | Complete decoded `ArrayBuffer`; checks size and CRC-32. |
| `readInBatches(entryOrPath, {signal}?)` | Async iterable of decoded `Uint8Array` chunks; checks size and CRC-32 at completion. |
| `readRange(entryOrPath, {start, end, signal}?)` | STORE-only range with an exclusive `end`. Cannot verify whole-entry CRC. |
| `close()` | Idempotent cancellation and transport release. Further reads reject. |

Entry metadata is immutable: `path`, `directory`, `compression` (`'store'` or `'deflate'`), `crc32`,
`comment`, and `bigint` values `size`, `compressedSize`, `localHeaderOffset`, and `dataOffset`.
Entry objects passed to read methods must originate from the same archive.

## Options and limits

| Option | Default | Scope |
| --- | --- | --- |
| `maxArchiveBytes` | `1024n ** 4n` (1 TiB) | Archive length. |
| `maxDirectoryBytes` | `32 * 1024 * 1024` | Retained central-directory bytes. |
| `maxEntries` | `100000` | Directory records. |
| `maxReadBytes` | `1024 * 1024` | Individual physical reads and public STORE ranges. |
| `maxCompressedBytes` | `64n * 1024n * 1024n` | Compressed bytes consumed for a complete entry. |
| `maxDecodedBytes` | `64n * 1024n * 1024n` | Decoded bytes consumed for a complete entry. |
| `chunkBytes` | `64 * 1024` | Streaming input chunks, capped by `maxReadBytes`. |
| `signal` | — | Cancellation during opening and subsequent reads. |

Number limits must be positive safe integers; bigint limits must be nonnegative. These independent
limits do not cap total application heap, retained source storage, or decoder intermediate
allocations. Range reads can access an entry larger than the complete-read limits.

Opening validates end records and bounds. Named lookup validates local/central consistency;
direct populated-header lookup validates the local layout without scanning the directory.
No complete-entry CRC is verified by metadata lookup. Streaming integrity checks require consuming
the iterator through completion.

See the [ZIP format support table](/docs/modules/archives/zip/formats/zip) for supported profiles.
