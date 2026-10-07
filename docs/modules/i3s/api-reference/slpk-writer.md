# SLPKWriter

Packages already-authored I3S layer resources as a deterministic `.slpk` archive in browsers or Node.
The writer accepts `ArrayBuffer` and native `Blob` values without Node.js Buffer or filesystem APIs.

```ts
import {SLPKWriter} from '@loaders.gl/i3s/i3s-slpk-writer';

const archive = await SLPKWriter.encode(
  {
    '3dSceneLayer.json.gz': compressedLayerMetadata,
    'nodepages/0.json.gz': compressedNodePage,
    'nodes/0/geometries/0.bin.gz': compressedGeometry
  },
  {slpk: {maxArchiveBytes: 16 * 1024 * 1024}}
);
```

Also exported from `@loaders.gl/i3s`. Resource paths are canonical relative ASCII paths rooted
at the layer: exclude the service `SceneServer/layers/0` prefix. Root `3dSceneLayer.json.gz` is
required. Supply valid I3S resources with their required archive names and GZIP compression
already applied; image resources such as PNG/JPEG retain their own encoding. Inputs must
remain unchanged while packaging. Metadata, geometry, reference closure, and compression
validation remain the caller's responsibility. Use [encodeI3SMeshLayer](/docs/modules/i3s/api-reference/i3s-mesh-writer) to author the initial untextured mesh profile before packaging.

The outer ZIP uses STORE, populated local headers, no directory entries or descriptors,
and a fixed UTC timestamp. The last entry is the uncompressed `@specialIndexFileHASH128@`.
It contains lowercase MD5 path hashes and little-endian 64-bit local-header offsets, sorted
as two little-endian unsigned words, per the
[SLPK hash-table specification](https://github.com/Esri/i3s-spec/blob/master/docs/2.0/slpk_hashtable.pcsl.md).
It excludes itself. Original resource-name casing is retained in the ZIP; names that collide
when lowercased, including the reserved index name, are rejected.

`slpk.maxArchiveBytes` is a nonnegative safe integer, defaulting to `0x7fffffff`. The complete
archive budget includes ZIP headers and the index and is checked before any Blob reads.
The initial ZIP32 profile rejects output above 2 GiB and more than 65,533 resources. Larger
SLPK output requires a future ZIP64 writer. Resource compression and peak-memory
qualification are separate work; this budget bounds output size only.

Returns an `ArrayBuffer`. Wrap it in an `application/octet-stream` Blob and save as `.slpk`.
The v5 converter's `createTileConversionArchive` performs that Blob handoff for finalized
browser-sink resources. Existing `parseSLPKArchive` readers can use the generated hash index.

### Cancellation and temporary buffers

Pass an optional `slpk.signal` (`AbortSignal`) to cancel between block reads and header
encodes. Cancellation rejects with the signal's reason and returns no partial archive. An
active Blob read or header encode finishes before cancellation is observed; terminate a
dedicated worker when immediate interruption is required.

Payload reads/copies use blocks of at most 64 KiB. A checksum pass precedes each populated
local header, followed by a second pass that writes the payload into the final archive buffer.
Caller-owned inputs, the final archive, index/directory metadata, and later Blob/worker transfer
copies still consume memory. This does not provide a total heap limit. For output to external
storage, use the iterator below.

### Stream to application-owned storage

`encodeSLPKArchiveInBatches` is exported from the implementation subpath. It accepts the same
resources/options and yields `Uint8Array` views with byte-identical archive content:

```ts
import {encodeSLPKArchiveInBatches} from '@loaders.gl/i3s/i3s-slpk-writer';

try {
  for await (const chunk of encodeSLPKArchiveInBatches(resources, {
    slpk: {maxArchiveBytes: 32 * 1024 * 1024, signal}
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
