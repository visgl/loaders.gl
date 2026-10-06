# Tiles3DArchiveWriter

Packages already-authored 3D Tiles resources into a deterministic indexed `.3tz` archive.
This writes an archive container, not a scene, mesh hierarchy, or I3S layer.

```ts
import {Tiles3DArchiveWriter} from '@loaders.gl/3d-tiles/3d-tiles-archive-writer';

const archive = await Tiles3DArchiveWriter.encode(
  {'tileset.json': tilesetBlob, 'mesh.glb': meshArrayBuffer},
  {'3tz': {maxArchiveBytes: 16 * 1024 * 1024}}
);
```

Also exported from `@loaders.gl/3d-tiles`. Inputs are native `Blob` or `ArrayBuffer` values
keyed by canonical relative ASCII paths. Root `tileset.json` is required; content must already
be valid, immutable during encoding, and reference the intended resources. Content/schema
validation and checking reference closure are the caller's responsibility.

The writer uses STORE compression, populated local headers (CRC and sizes), no directory
entries or data descriptors, a fixed UTC timestamp, and stable file ordering. The final
uncompressed `@3dtilesIndex1@` entry stores case-sensitive MD5 path hashes and little-endian
64-bit local-header offsets, sorted according to the
[3TZ specification](https://github.com/Maxar-Public/3tz-specification/blob/main/Specification.md).
The index has no file comment and excludes itself.

`3tz.maxArchiveBytes` is a nonnegative safe integer, defaulting to `0xfffffffe`. The complete
archive size, including headers and index, is checked before reading Blobs or serializing.
Archives exceeding that ZIP32 capacity, 65,533 resource files, noncanonical or non-ASCII
paths, and nested archive paths are rejected. This first version does not support ZIP64,
compression, or streaming. The size budget is not a peak-memory limit.

The result is an `ArrayBuffer`. For a browser download, wrap it in a Blob with MIME type
`application/vnd.maxar.archive.3tz+zip`, save as `.3tz`, and revoke object URLs when no longer
needed. The v5 tile converter provides `createSingleMeshTilesetArchive` for its finalized
single-mesh output. Existing 3TZ readers can read the resulting indexed archive.

`createTileConversionArchive` also provides a general finalized-resource Blob handoff for
3TZ and SLPK. Each format requires already-authored resources in its own layout. The shared
`@loaders.gl/zip/indexed-zip-writer` encoder retains the existing deterministic 3TZ layout.

### Cancellation and temporary buffers

Pass an optional `3tz.signal` (`AbortSignal`) to cancel between resource reads and entry
encodes. Cancellation rejects with the signal's reason and returns no partial archive. An
active Blob read or entry encode finishes before cancellation is observed; terminate a
dedicated worker when immediate interruption is required.

Entries are encoded one at a time into one final archive buffer. Temporary buffers for one
Blob read and its encoded entry can be released before the next resource is read; all Blob
read buffers are no longer retained together. Caller-owned inputs, the final archive, the
current entry's temporary allocations, and later Blob/worker transfer copies still consume
memory. This does not provide a total heap limit or stream output to external storage.
