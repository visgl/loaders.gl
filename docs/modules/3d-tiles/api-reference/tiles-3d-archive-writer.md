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
compression. The size budget is not a peak-memory limit.

The result is an `ArrayBuffer`. For a browser download, wrap it in a Blob with MIME type
`application/vnd.maxar.archive.3tz+zip`, save as `.3tz`, and revoke object URLs when no longer
needed. The v5 tile converter provides `createSingleMeshTilesetArchive` for its finalized
single-mesh output. Existing 3TZ readers can read the resulting indexed archive.

`createTileConversionArchive` also provides a general finalized-resource Blob handoff for
3TZ and SLPK. Each format requires already-authored resources in its own layout. The shared
`@loaders.gl/zip/indexed-zip-writer` encoder retains the existing deterministic 3TZ layout.

### Cancellation and temporary buffers

Pass an optional `3tz.signal` (`AbortSignal`) to cancel between block reads and header
encodes. Cancellation rejects with the signal's reason and returns no partial archive. An
active Blob read or header encode finishes before cancellation is observed; terminate a
dedicated worker when immediate interruption is required.

Payload reads/copies use blocks of at most 64 KiB. A checksum pass precedes each populated
local header, followed by a second pass that writes the payload into the final archive buffer.
Caller-owned inputs, the final archive, index/directory metadata, and later Blob/worker transfer
copies still consume memory. This does not provide a total heap limit. For output to external
storage, use the iterator below.

### Stream to application-owned storage

`encodeTiles3DArchiveInBatches` is exported from the implementation subpath. It accepts the same
resources/options and yields `Uint8Array` views with byte-identical archive content:

```ts
import {encodeTiles3DArchiveInBatches} from '@loaders.gl/3d-tiles/3d-tiles-archive-writer';

try {
  for await (const chunk of encodeTiles3DArchiveInBatches(resources, {
    '3tz': {maxArchiveBytes: 32 * 1024 * 1024, signal}
  })) {
    await destination.write(chunk);
  }
  await destination.close();
} catch (error) {
  await destination.abort(error);
  throw error;
}
```

The first pull validates all declarations and the complete size budget before any output. Each
entry first uses bounded reads to calculate its CRC-32 before emitting a populated local header.
A second pass yields payload blocks of at most 64 KiB on demand; awaiting writes supplies
backpressure within the entry. Returning from iteration prevents further reads. No complete
entry or archive buffer is allocated. Caller-owned inputs and index/directory metadata remain
in memory, with index/directory storage growing with the declared entry count.

Use each chunk's byte view rather than writing its entire backing buffer. Finalize storage only
after iteration succeeds; failure, cancellation, or early exit may leave partial bytes that the
application must discard. Cancellation is checked between block reads and header encodes; an
active read finishes first.
