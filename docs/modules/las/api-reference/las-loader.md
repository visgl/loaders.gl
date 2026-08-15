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
    shape: 'arrow-table'
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

## Options

| Option                   | Type                 | Default    | Description                                                                                                                                                      |
| ------------------------ | -------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.las.shape`      | `string`             | `mesh`     | Format of parsed data, e.g: `'mesh'`, `'columnar-table'`, `'arrow-table'`.                                                                                       |
| `options.las.fp64`       | `number`             | `false`    | If `true`, positions are stored in 64-bit floats instead of 32-bit.                                                                                              |
| `options.las.colorDepth` | `number` or `string` | `8`        | Whether colors encoded using 8 or 16 bits? Can be set to `'auto'`. Note: LAS specification recommends 16 bits.                                                   |
| `options.las.workerUrl`  | `string`             | -          | Overrides the packaged `LASLoader` worker. Supplying a URL for another LAS loader opts that loader into an application-built worker.                            |
| `options.onProgress`     | `function`           | -          | Callback when a new chunk of data is read. Only works on the main thread.                                                                                        |

## Worker Execution

Atomic `load` and `parse` calls with `LASLoader` use the package's single prebuilt `las-worker.js` when workers are enabled. That worker contains the TypeScript implementation. The compatibility loaders parse on the calling thread by default and do not add more worker artifacts to the package.

Applications that need a compatibility loader in a worker can build one and provide it through `options.las.workerUrl`.

`parseInBatches` runs on the calling thread because its async input and output iterators provide the streaming boundary directly. Set `core.worker: false` on atomic calls when the same main-thread behavior is required.

## TypeScript LAZ Streaming

`LASLoader.parseInBatches` consumes compressed LAZ input incrementally. Legacy interleaved PDRF 0-5 chunks can emit complete Arrow batches before the current compressed chunk or file has finished arriving. PDRF 6-10 table parsing emits after complete layered LAZ chunks are available and selectively decodes only the field layers represented by the returned Arrow schema. Complete-buffer `parse` uses the same direct-column path instead of allocating and reparsing complete raw records. Legacy Point10/GPS/RGB/Byte item version 2, WavePacket13 item version 1, and modern item versions 2-4 are supported. Legacy LASzip item version 1 uses a different codec and is rejected. NIR, PDRF 4/5/9/10 waveform packet references, and Extra Bytes remain available only through raw-record decoding because they are not yet represented in the returned Arrow schema. Waveform sample payloads referenced by those records are not loaded. The raw chunk decoder remains available when complete LAS point records, including currently unexposed fields, are required.

Legacy point-level progress uses bounded geometric replay: when more compressed bytes arrive, the decoder replays previously emitted points through a record-sized scratch buffer and writes only new points into reusable output batches. This avoids committing partially mutated arithmetic state and bounds retry work to a linear factor of the compressed chunk size, but it retains the compressed chunk until completion. Layered PDRF 6-10 remains chunk-streaming because its independent field ranges must be available before complete rows can be assembled. Variable-size chunk point counts are stored in the LASzip chunk table at EOF, so a forward-only variable-chunk input is buffered until the table is available. See the [LAS/LAZ format implementation limits](/docs/modules/las/formats/las#current-implementation-limits) for supported point formats and remaining limitations.
