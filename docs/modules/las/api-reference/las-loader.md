import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';

# LAS Loaders

<LasDocsTabs active="lasloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

`LASLoader` is the primary, pure TypeScript LAS/LAZ loader. It parses point clouds into the legacy [PointCloud](/docs/specifications/category-mesh) object by default. Set `las.shape: 'arrow-table'` to return a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

## Usage

```typescript
import {LASLoader} from '@loaders.gl/las';
import {load} from '@loaders.gl/core';

const data = await load(url, LASLoader, options);
const table = await load(url, LASLoader, {
  las: {
    ...options?.las,
    shape: 'arrow-table',
    columns: ['POSITION', 'COLOR_0']
  }
});
```

Select another implementation by importing its loader variant instead of setting an option:

```typescript
import {LASCOPCLoader, LAZPerfLoader, LAZRsLoader} from '@loaders.gl/las';

const copcDecodedData = await load(url, LASCOPCLoader, options);
```

## Loader Variants

| Loader variant | Decoder implementation | Packaged worker | Notes |
| --- | --- | --- | --- |
| `LASLoader` | Pure TypeScript | Yes | Primary implementation with LAS/LAZ streaming support. |
| `LAZPerfLoader` | Vendored laz-perf | No | Compatibility variant limited to LAS/LAZ through LAS 1.3. |
| `LASCOPCLoader` | laz-perf from the COPC package | No | Compatibility variant used by existing COPC/LAS paths. |
| `LAZRsLoader` | Rust/WASM laz-rs | No | Compatibility and parity-testing variant. |

Loader variants are selected by the loader import. There is no runtime backend option.
See [JavaScript and WebAssembly performance](/docs/developer-guide/concepts/javascript-and-wasm-performance)
for the pipeline effects that can let the TypeScript loader outperform a WASM variant, including
selective field decoding, direct typed output, memory copies, and module startup.

## Options

| Option                   | Type                 | Default    | Description                                                                                                                                                      |
| ------------------------ | -------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.las.shape`      | `string`             | `mesh`     | Format of parsed data, e.g: `'mesh'`, `'columnar-table'`, `'arrow-table'`.                                                                                       |
| `options.las.fp64`       | `number`             | `false`    | If `true`, positions are stored in 64-bit floats instead of 32-bit.                                                                                              |
| `options.las.colorDepth` | `number` or `string` | `8`        | Whether colors encoded using 8 or 16 bits? Can be set to `'auto'`. Note: LAS specification recommends 16 bits.                                                   |
| `options.las.columns`    | `string[]`           | all        | Arrow columns to decode: `POSITION`, `intensity`, `classification`, `synthetic`, `keyPoint`, `withheld`, `overlap`, `COLOR_0`, `GPS_TIME`, `NIR`, `scanAngle`, `userData`, `pointSourceId`, `returnNumber`, `numberOfReturns`, `scannerChannel`, `scanDirectionFlag`, `edgeOfFlightLine`, `WAVEFORM`, and `EXTRA_BYTES`. `POSITION` is always returned; an empty array requests positions only. |
| `options.las.extraBytes` | `'raw'` or `'typed'` | `raw`      | Controls `EXTRA_BYTES` output. `raw` returns the fixed-width byte payload; `typed` returns one `EXTRA_BYTES_<descriptor-name>` numeric Arrow attribute per supported scalar or vector descriptor, applying descriptor scale/offset values per component. Raw Extra Bytes require `EXTRA_BYTES` in `columns`; with `typed` and no `columns` list, Extra Bytes are included by default. 64-bit integer descriptors remain raw-only. |
| `options.las.workerUrl`  | `string`             | -          | Overrides the packaged `LASLoader` worker. Supplying a URL for another LAS loader opts that loader into an application-built worker.                            |
| `options.onProgress`     | `function`           | -          | Callback when a new chunk of data is read. Only works on the main thread.                                                                                        |

## Worker Execution

Atomic `load` and `parse` calls with `LASLoader` use the package's single prebuilt `las-worker.js` when workers are enabled. That worker contains the TypeScript implementation. The compatibility loaders parse on the calling thread by default and do not add more worker artifacts to the package.

Applications that need a compatibility loader in a worker can build one and provide it through `options.las.workerUrl`.

`parseInBatches` runs on the calling thread because its async input and output iterators provide the streaming boundary directly. Set `core.worker: false` on atomic calls when the same main-thread behavior is required.

## TypeScript LAZ Streaming

`LASLoader.parseInBatches` consumes compressed LAZ input incrementally. Legacy interleaved PDRF 0-5 chunks can emit complete Arrow batches before the current compressed chunk or file has finished arriving. Layered PDRF 6-10 table parsing emits after the compressed field ranges required by `las.columns` arrive. PDRF 9/10 waveform-reference rows can precede trailing Extra Bytes; raw or typed Extra Bytes are projected directly once their Byte14 layers arrive. Complete-buffer `parse` uses the same direct-column path instead of allocating and reparsing complete raw records. Legacy Point10/GPS/RGB/Byte item version 2, WavePacket13 item version 1, and modern item versions 2-4 are supported. Legacy LASzip item version 1 uses a different codec and is rejected. `GPS_TIME`, `NIR`, `synthetic`, `keyPoint`, `withheld`, `overlap`, `scanAngle`, `userData`, `pointSourceId`, `returnNumber`, `numberOfReturns`, `scannerChannel`, `scanDirectionFlag`, and `edgeOfFlightLine` are available as typed Arrow columns for records that contain them. Legacy PDRF 0-5 records report `overlap` as zero because that flag was introduced with PDRF 6. `WAVEFORM` exposes PDRF 4/5/9/10 packet references as fixed-width 29-byte rows. `EXTRA_BYTES` exposes raw bytes by default, or descriptor-defined numeric attributes through `las.extraBytes: 'typed'`. Waveform sample payloads are loaded separately through the range APIs below. The raw chunk decoder remains available when complete LAS point records, including currently unexposed fields, are required.

Atomic TypeScript parses attach typed file metadata to `loaderData.metadata`. This includes the public header identity and creation fields, raw VLR and EVLR records, Extra Bytes descriptors, waveform packet descriptors, WKT projection records, and GeoTIFF payloads. EVLR payloads are retained when they are present in the supplied complete buffer; streaming batches expose the header before later EVLR data is available.

## Waveform Sample Access

PDRF 4, 5, 9, and 10 store a fixed-width packet reference with each point, while the variable-length sample packet lives in an internal LAS waveform data record or a companion WDP file. The loader keeps the exact uint64 packet offset in the `WAVEFORM` Arrow column. Waveform helpers parse that reference and issue a byte-range read only when samples are requested:

```typescript
import {
  parseLASWaveformPacketReference,
  readLASWaveformPacket
} from '@loaders.gl/las';
import {HttpFile} from '@loaders.gl/loader-utils';

const metadata = table.loaderData.metadata;
const waveformRow = table.data.getChild('WAVEFORM').get(pointIndex);
const reference = parseLASWaveformPacketReference(Uint8Array.from(waveformRow));

// Use the LAS URL for internal data or the companion WDP URL for external data.
const waveformSource = new HttpFile(waveformUrl);
const packet = await readLASWaveformPacket(waveformSource, reference, metadata);
```

`packet.samples` contains unsigned integer samples and `packet.amplitudes` applies the descriptor's digitizer gain and offset. `readLASWaveformPackets` performs bounded concurrent range reads while preserving reference order. The standard LAS waveform compression type 0 and sample widths from 2 through 32 bits are supported; nonzero waveform compression types are rejected. Packet offsets remain `bigint` throughout.

For layered PDRF 6-10 chunks, omitted intensity, classification, RGB, GPS time, and NIR columns do not allocate output arrays or construct arithmetic decoders for those independent layers. Legacy PDRF 0-5 fields share an interleaved entropy stream, so column selection avoids output allocation and extraction but cannot skip the corresponding entropy decoding.

Legacy point-level progress preserves one interleaved arithmetic decoder and its PDRF 0-5 item predictors across input chunks. The decoder waits for a bounded lookahead before starting another point, so it never commits a partial point and does not replay previously emitted rows. It retains only the current compressed chunk prefix and a small lookahead until the chunk completes. Layered PDRF 6-10 remains chunk-streaming because its independent field ranges must be available before complete rows can be assembled. Variable-size chunk point counts are stored in the LASzip chunk table at EOF, so a forward-only variable-chunk input is buffered until the table is available. See the [LAS/LAZ format implementation limits](/docs/modules/las/formats/las#current-implementation-limits) for supported point formats and remaining limitations.
