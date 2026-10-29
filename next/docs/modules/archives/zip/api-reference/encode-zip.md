# encodeZip

`encodeZip(files, options)` writes a native ZIP32/ZIP64 archive and returns an `ArrayBuffer`. `encodeZipInBatches(files, options)` yields independent `Uint8Array` chunks with backpressure. Both use the shared native record serializer, first-party CRC-32, and raw DEFLATE.

```
import {encodeZip, encodeZipInBatches} from '@loaders.gl/archives/zip';



const bytes = await encodeZip({

  'tileset.json': new TextEncoder().encode(JSON.stringify(tileset)),

  'textures/image.png': imageBlob

}, {maxArchiveBytes: 64n * 1024n * 1024n});



for await (const chunk of encodeZipInBatches({

  'points.bin': pointByteStream

}, {zip64: 'auto', maxArchiveBytes: 8n * 1024n ** 3n, signal})) {

  await destination.write(chunk);

}
```

## Inputs and metadata[​](#inputs-and-metadata "Direct link to Inputs and metadata")

Keys are canonical relative paths. Values can be `ArrayBuffer`, typed-array/DataView slices, `Blob`, `ReadableStream`, or sync/async iterables of binary chunks. Streams are consumed once; source bytes must remain immutable during encoding. An entry can instead use `{data, compression?, date?, comment?}` to override metadata. Directory names end in `/` and require empty data; parent directories are not generated automatically.

Paths are sorted. Names and entry comments use UTF-8; unpaired UTF-16 surrogates reject before any source reads. Dates use UTC DOS timestamps, with two-second precision. Archive comments use CP437 because ZIP has no archive-level UTF-8 flag; unrepresentable characters reject. Native writers emit signed data descriptors and validate final CRC/size metadata.

## Options[​](#options "Direct link to Options")

| Option              | Default            | Behavior                                                       |
| ------------------- | ------------------ | -------------------------------------------------------------- |
| `compression`       | `'store'`          | `'store'` or raw `'deflate'`; each entry can override it.      |
| `zip64`             | `'auto'`           | `'auto'`, `'always'`, or `'never'`.                            |
| `date`              | 1980-01-01 UTC     | Valid UTC date in 1980–2107; entries can override it.          |
| `comment`           | `''`               | CP437 archive comment, at most 65535 encoded bytes.            |
| `maxArchiveBytes`   | `1024n ** 4n`      | Complete output, including headers, descriptors and directory. |
| `maxEntryBytes`     | `1024n ** 4n`      | Decoded input bytes per entry.                                 |
| `maxDirectoryBytes` | `32 * 1024 * 1024` | Retained central-directory bytes.                              |
| `maxEntries`        | `100000`           | Entry count.                                                   |
| `chunkBytes`        | `64 * 1024`        | Maximum input block/output chunk size.                         |
| `signal`            | —                  | Cancellation during source reads and between output pulls.     |

Auto ZIP64 reserves 64-bit fields for streams and DEFLATE because their final encoded sizes are unknown when the local header is written. Known STORE buffers/Blobs use ZIP32 until a field requires ZIP64. `'never'` rejects overflow; for streams the failure can occur after partial output. ZIP64 sizes and offsets are serialized as `bigint` without converting through `Number`.

## Storage and cancellation[​](#storage-and-cancellation "Direct link to Storage and cancellation")

The streaming encoder retains bounded directory metadata and processes payloads in blocks. It releases acquired stream locks and stops further reads when iteration ends early or is cancelled. Caller-owned sources and decoder/compressor intermediate storage are outside these byte budgets.

The buffered encoder retains all output chunks and allocates the final buffer; use explicit output budgets for it. It rejects output beyond its 4 GiB buffer capacity. The streaming encoder can emit larger ZIP64 archives without allocating a complete payload or archive.

Consumers must discard partial streamed output on errors/cancellation and finalize storage only when iteration completes. `ZipWriter` delegates to the buffered native encoder. Indexed SLPK/3TZ writers share the native serializers and support populated ZIP32/ZIP64 local headers. Their format adapters supply required root/index names, hashing rules and output budgets.

See the [ZIP feature table](https://loaders.gl/next/docs/modules/archives/zip/formats/zip.md).
