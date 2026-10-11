# ZipFileSystem

`ZipFileSystem` adapts the shared ZIP32/ZIP64 reader to the loaders.gl `FileSystem` interface.
It owns its input file and caches archive initialization and the directory index. Inputs can be
an `ArrayBuffer`, typed-array view, `Blob`, `ReadableFile`, or a Node file path. The optional second
argument accepts the same [limits and cancellation options as ZipArchive](/docs/modules/zip/api-reference/zip-archive).

```typescript
import {ZipFileSystem} from '@loaders.gl/zip';

const filesystem = new ZipFileSystem(blob);
try {
  const names = await filesystem.readdir();
  const metadata = await filesystem.stat(names[0]);
  const response = await filesystem.fetch(names[0], {headers: {Range: 'bytes=0-15'}});
  const prefix = await response.arrayBuffer();
} finally {
  await filesystem.destroy();
}
```

## Methods

| Method | Behavior |
| --- | --- |
| `readdir()` | Validated paths in directory order, including directory entries. |
| `stat(path)` | `ZipEntry` metadata with numeric `size` and exact bigint `uncompressedSize`. Rejects unsafe numeric sizes. |
| `fetch(path, requestOptions?)` | GET-only streaming decoded response, with `Content-Length` and per-request `signal`. |
| `destroy()` | Cancels reads and closes the owned transport once. Subsequent operations reject. |

Complete generic responses use bounded chunks and verify size and CRC when their body is fully
consumed. Cancelling a body releases its iterator and leaves the filesystem available for other
reads, but does not verify that entry's complete CRC. Body integrity, cancellation and read-limit
errors reject body consumption; browsers can report these as a generic fetch error.

Request cancellation is checked after shared metadata initialization and lookup, before a response
is returned, and throughout body reads. A request abort does not cancel metadata initialization
shared with other requests; use the constructor signal or `destroy()` to cancel the archive lifetime.

## Resource resolution

Resources stay inside the archive. Generic ZIP lookups first try the literal entry name, so names
returned by `readdir()` retain `%`, `?` and `#`. If no exact name exists, a resource URL is resolved:
query strings and fragments are removed and percent escapes are decoded once. `.` and `..` are
normalized, with traversal above the archive root rejected.
Archive-root paths beginning with `/` are accepted. External schemes, network paths, backslashes,
NUL bytes and malformed percent escapes in resource URLs reject. Response URLs can be passed back to the same
filesystem, including archive-qualified Node paths or indexed-adapter archive names. Relative
archive names use a `./` URL prefix to distinguish qualified responses from literal entry paths.
Indexed adapters keep raw resource names and interpret only qualified URLs.

## STORE ranges

A single `Range: bytes=start-end`, `bytes=start-`, or `bytes=-suffix` request on a STORE entry
returns status 206, `Content-Range`, `Content-Length` and `Accept-Ranges: bytes`. End positions are
inclusive in the HTTP header and clamped to the entry length. Empty, unsatisfiable, malformed or
multiple ranges return 416 with `Content-Range: bytes */size`.

Public ranges are bounded by `maxReadBytes` (default 1 MiB) and can access entries larger than the
complete-read limits. Range responses do not verify a complete-entry CRC. DEFLATE ranges reject;
complete DEFLATE responses stream decoded bytes and advertise `Accept-Ranges: none`.

## Indexed format adapters

An existing `IndexedArchive` adapter can still supply format-specific aliases and content decoding
through `getFile(path, 'http')`. This preserves its indexed lookup path. Such responses retain the
adapter's buffered behavior; ranges reject because aliases and gzip decoding can change the
returned resource bytes. SLPK/3TZ adapters share the same reader for indexed entry reads, CRC verification and ownership.

Configure reader limits and archive cancellation on the adapter: `IndexedArchive` subclass constructors,
`parseSLPKArchive(file, callback?, fileName?, options?)` and
`parse3DTilesArchive(file, callback?, fileName?, options?)` accept `ZipArchiveOptions` as their fourth
argument. The adapter owns the shared reader; `ZipFileSystem.destroy()` closes it exactly once.
Deck-layer `createSLPKArchiveResolver` and `createTiles3DArchiveResolver` accept the same options
as their third argument after the parser loader.

SLPK path hashing uses locale-independent case folding, including fallback indexes.
