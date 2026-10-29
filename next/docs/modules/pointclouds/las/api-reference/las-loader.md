LAS loader

LAS

# LASLoader

Read LAS and LAZ records into Arrow columns for analysis, scans, and writers, or request a render-ready mesh compatibility shape when needed.

[LAS / LAZ format](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)[LASWriter](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-writer.md)

LAS[Try It](https://loaders.gl/next/examples/pointclouds/las)[Benchmarks](https://loaders.gl/next/docs/modules/pointclouds/las/benchmarks.md)[Overview](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)[Format](https://loaders.gl/next/docs/modules/pointclouds/las/format.md)[LASLoader](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-loader.md)[LASWriter](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-writer.md)

One parser, several uses

## Keep only the representation you need.

The same point records can become a legacy point-cloud object or typed columns. Column selection keeps optional fields from expanding the result unnecessarily.

01

Default

Mesh Arrow table with shape: 'arrow-table'

02

Compatibility

PointCloud object with shape: 'mesh'

03

Fields

Position, color, returns, time, NIR, waveform, and Extra Bytes

04

Variants

TypeScript, LASzip-compatible, and COPC decoding paths

![From-v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)

`LASLoader` is the primary, pure TypeScript LAS/LAZ loader. It returns a [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) by default. Set `las.shape: 'mesh'` to return the legacy [PointCloud](https://loaders.gl/next/docs/specifications/category-mesh.md) object for compatibility.

Detailed guide

## LASLoader details

The sections below cover usage, output shapes, decoder variants, options, streaming, and compatibility.

## Usage[​](#usage "Direct link to Usage")

```
import {LASLoader} from '@loaders.gl/pointclouds/las';

import {load} from '@loaders.gl/core';



const table = await load(url, LASLoader, {

  las: {

    ...options?.las,

    columns: ['POSITION', 'COLOR_0']

  }

});



const mesh = await load(url, LASLoader, {las: {shape: 'mesh'}});
```

Select another implementation by importing its loader variant instead of setting an option:

```
import {LASCOPCLoaderWithParser as LASCOPCLoader} from '@loaders.gl/pointclouds/las/las-copc-loader';

import {LAZPerfLoaderWithParser as LAZPerfLoader} from '@loaders.gl/pointclouds/las/lazperf-loader';

import {LAZRsLoaderWithParser as LAZRsLoader} from '@loaders.gl/pointclouds/las/laz-rs-loader';



const copcDecodedData = await load(url, LASCOPCLoader, options);
```

## Loader Variants[​](#loader-variants "Direct link to Loader Variants")

| Loader variant  | Decoder implementation         | Packaged worker | Notes                                                     |
| --------------- | ------------------------------ | --------------- | --------------------------------------------------------- |
| `LASLoader`     | Pure TypeScript                | ✅ Yes          | Primary implementation with LAS/LAZ streaming support.    |
| `LAZPerfLoader` | Vendored laz-perf              | ❌ No           | Compatibility variant limited to LAS/LAZ through LAS 1.3. |
| `LASCOPCLoader` | laz-perf from the COPC package | ❌ No           | Compatibility variant used by existing COPC/LAS paths.    |
| `LAZRsLoader`   | Rust/WASM laz-rs               | ❌ No           | Compatibility and parity-testing variant.                 |

Loader variants are selected by the loader import. There is no runtime backend option. See [JavaScript and WebAssembly performance](https://loaders.gl/next/docs/developer-guide/concepts/javascript-and-wasm-performance.md) for the pipeline effects that can let the TypeScript loader outperform a WASM variant, including selective field decoding, direct typed output, memory copies, and module startup.

## Options[​](#options "Direct link to Options")

| Option                   | Type                 | Default       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------ | -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `options.las.shape`      | `string`             | `arrow-table` | Format of parsed data, e.g: `'mesh'`, `'columnar-table'`, `'arrow-table'`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `options.las.fp64`       | `number`             | `false`       | If `true`, positions are stored in 64-bit floats instead of 32-bit.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `options.las.colorDepth` | `number` or `string` | `8`           | Whether colors encoded using 8 or 16 bits? Can be set to `'auto'`. Note: LAS specification recommends 16 bits.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `options.las.columns`    | `string[]`           | all           | Arrow columns to decode: `POSITION`, `intensity`, `classification`, `synthetic`, `keyPoint`, `withheld`, `overlap`, `COLOR_0`, `GPS_TIME`, `NIR`, `scanAngle`, `userData`, `pointSourceId`, `returnNumber`, `numberOfReturns`, `scannerChannel`, `scanDirectionFlag`, `edgeOfFlightLine`, `WAVEFORM`, and `EXTRA_BYTES`. `POSITION` is always returned; an empty array requests positions only.                                                                                                                                                                    |
| `options.las.extraBytes` | `'raw'` or `'typed'` | `raw`         | Controls `EXTRA_BYTES` output. `raw` returns the fixed-width byte payload; `typed` returns one `EXTRA_BYTES_<descriptor-name>` numeric Arrow attribute per supported scalar or vector descriptor, applying descriptor scale/offset values per component. Raw Extra Bytes require `EXTRA_BYTES` in `columns`; with `typed` and no `columns` list, Extra Bytes are included by default. 64-bit integer descriptors use exact Arrow Uint64/Int64 values. Nonidentity scale/offset transforms use Float64 and may lose precision; identity transforms preserve BigInt. |
| `options.las.workerUrl`  | `string`             | -             | Overrides the packaged `LASLoader` worker. Supplying a URL for another LAS loader opts that loader into an application-built worker.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `options.onProgress`     | `function`           | -             | Callback when a new chunk of data is read. Only works on the main thread.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### Interrupted LAZ writers[​](#interrupted-laz-writers "Direct link to Interrupted LAZ writers")

`las.recoverMissingChunkTable: true` allows fixed-size LAZ chunks to be read when the LASzip chunk-table pointer equals the point-data offset, the marker left by an interrupted writer. The default remains strict. Recovery uses the header point count and fixed chunk size, verifies all point data, and rejects truncated records and unexpected trailing bytes. Variable-size chunks require their table; malformed existing tables are never bypassed. Recovery cannot restore points that the writer did not finish.

### LASzip compatibility mode[​](#laszip-compatibility-mode "Direct link to LASzip compatibility mode")

LASzip can store modern LAS 1.4 point formats in legacy records with a `lascompatible` VLR and named Extra Bytes descriptors. `LASLoader` detects this explicit layout and restores classification, extended returns, overlap, scanner channel, scan angle, and NIR in the returned columns. Scan angles use modern 0.006-degree units after reconstruction. Complete and streaming LAS/LAZ parsing apply the same reconstruction, including selected columns.

Set `las.compatibilityMode: 'raw'` to retain the physical legacy column values; the default is `'auto'`. Raw decompression always retains the original point-record bytes. `loaderData` preserves the physical file header and VLRs; `loaderData.metadata.compatibility` identifies the logical modern point format and version. Raw or typed Extra Bytes remain available independently of reconstruction.

## Worker Execution[​](#worker-execution "Direct link to Worker Execution")

The primary TypeScript `LASLoader` supports browser workers for atomic parsing and `parseInBatches`, including LAZ decoding. One worker retains decoder state for the entire input stream. Results transfer owned Arrow column buffers, including safe copies of retained binary file metadata. No Arrow IPC encoding is involved. Requested mesh output and color format conversion run on the caller after column hydration.

```
import {parseInBatches} from '@loaders.gl/core';

import {LASLoader} from '@loaders.gl/pointclouds/las';



const controller = new AbortController();

const batches = await parseInBatches(response, LASLoader, {

  core: {worker: true, batchSize: 10000},

  signal: controller.signal,

  las: {shape: 'arrow-table'}

});

for await (const batch of batches) {

  consume(batch.data);

}
```

Abort or close the iterator to release its worker. Already transferred input buffers remain detached. LAZPerf and LAZ-RS implementation subpaths are unchanged and do not gain prebuilt worker batch support. COPC range/chunk APIs are separate from this full-file stream.

## TypeScript LAZ Streaming[​](#typescript-laz-streaming "Direct link to TypeScript LAZ Streaming")

`LASLoader.parseInBatches` consumes compressed LAZ input incrementally. Legacy interleaved PDRF 0-5 chunks can emit complete Arrow batches before the current compressed chunk or file has finished arriving. Layered PDRF 6-10 table parsing emits after the compressed field ranges required by `las.columns` arrive. PDRF 9/10 waveform-reference rows can precede trailing Extra Bytes; raw or typed Extra Bytes are projected directly once their Byte14 layers arrive. Complete-buffer `parse` uses the same direct-column path instead of allocating and reparsing complete raw records. Legacy Point10/GPS/RGB/Byte item versions 1 and 2, WavePacket13 item version 1, and modern item versions 2-4 are supported. Legacy files may use either pointwise compressor 1 (one continuous stream without a chunk table) or chunked compressor 2. Pointwise parsing preserves predictors across batches and releases consumed compressed bytes. `GPS_TIME`, `NIR`, `synthetic`, `keyPoint`, `withheld`, `overlap`, `scanAngle`, `userData`, `pointSourceId`, `returnNumber`, `numberOfReturns`, `scannerChannel`, `scanDirectionFlag`, and `edgeOfFlightLine` are available as typed Arrow columns for records that contain them. Legacy PDRF 0-5 records report `overlap` as zero because that flag was introduced with PDRF 6. `WAVEFORM` exposes PDRF 4/5/9/10 packet references as fixed-width 29-byte rows. `EXTRA_BYTES` exposes raw bytes by default, or descriptor-defined numeric attributes through `las.extraBytes: 'typed'`. Waveform sample payloads are loaded separately through the range APIs below. The raw chunk decoder remains available when complete LAS point records, including currently unexposed fields, are required.

Atomic TypeScript parses attach typed file metadata to `loaderData.metadata`. This includes the public header identity and creation fields, raw VLR and EVLR records, Extra Bytes descriptors, waveform packet descriptors, WKT projection records, and GeoTIFF payloads. EVLR payloads are retained when they are present in the supplied complete buffer; streaming batches expose the header before later EVLR data is available.

## Waveform Sample Access[​](#waveform-sample-access "Direct link to Waveform Sample Access")

PDRF 4, 5, 9, and 10 store a fixed-width packet reference with each point, while the variable-length sample packet lives in an internal LAS waveform data record or a companion WDP file. The loader keeps the exact uint64 packet offset in the `WAVEFORM` Arrow column. Waveform helpers parse that reference and issue a byte-range read only when samples are requested:

```
import {

  parseLASWaveformPacketReference,

  readLASWaveformPacket

} from '@loaders.gl/pointclouds/las';

import {HttpFile} from '@loaders.gl/core/loader-utils';



const metadata = table.loaderData.metadata;

const waveformRow = table.data.getChild('WAVEFORM').get(pointIndex);

const reference = parseLASWaveformPacketReference(Uint8Array.from(waveformRow));



// Use the LAS URL for internal data or the companion WDP URL for external data.

const waveformSource = new HttpFile(waveformUrl);

const packet = await readLASWaveformPacket(waveformSource, reference, metadata);
```

`packet.samples` contains unsigned integer samples and `packet.amplitudes` applies the descriptor's digitizer gain and offset. `readLASWaveformPackets` performs bounded concurrent range reads while preserving reference order. The standard LAS waveform compression type 0 and sample widths from 2 through 32 bits are supported; nonzero waveform compression types are rejected. Packet offsets remain `bigint` throughout.

For layered PDRF 6-10 chunks, omitted intensity, classification, RGB, GPS time, and NIR columns do not allocate output arrays or construct arithmetic decoders for those independent layers. Legacy PDRF 0-5 fields share an interleaved entropy stream, so column selection avoids output allocation and extraction but cannot skip the corresponding entropy decoding.

Legacy point-level progress preserves one interleaved arithmetic decoder and its PDRF 0-5 item predictors across input chunks. The decoder waits for a bounded lookahead before starting another point, so it never commits a partial point and does not replay previously emitted rows. It retains only the current compressed chunk prefix and a small lookahead until the chunk completes. Layered PDRF 6-10 remains chunk-streaming because its independent field ranges must be available before complete rows can be assembled. Variable-size chunk point counts are stored in the LASzip chunk table at EOF, so a forward-only variable-chunk input is buffered until the table is available. See the [LAS/LAZ format implementation limits](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md#current-implementation-limits) for supported point formats and remaining limitations.
