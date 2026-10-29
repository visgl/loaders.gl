PCD module · loader API

PCD

# PCDLoader

Decode ASCII, binary, and compressed Point Cloud Data into a point-cloud object or a Mesh Arrow table with named attributes.

[PCD format](https://loaders.gl/next/docs/modules/pointclouds/pcd/formats/pcd.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/pcd/formats/pcd.md)[PCDWriter](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-writer.md)[PCD module](https://loaders.gl/next/docs/modules/pointclouds/pcd.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/pcd.md)

PCD[Try It](https://loaders.gl/next/examples/pointclouds/pcd)[Overview](https://loaders.gl/next/docs/modules/pointclouds/pcd/formats/pcd.md)[Format](https://loaders.gl/next/docs/modules/pointclouds/pcd/format.md)[PCDLoader](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md)[PCDWriter](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-writer.md)

What it returns

## Keep point positions and named attributes together.

PCDLoader reads the schema in the PCD header, then decodes the point records into the representation that best fits the next stage of the pipeline.

01

Input

ASCII, binary, or compressed PCD

02

Default

Legacy PointCloud mesh object

03

Arrow

Mesh Arrow table with columns

04

Streaming

Batches for ASCII and uncompressed binary

Detailed guide

## PCDLoader reference

The sections below document format metadata, usage, batch parsing, output shapes, and options.

`PCDLoader` parses point cloud data in the Point Cloud Data (PCD) format and returns a [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) by default.

Set `pcd.shape: 'mesh'` when a legacy [PointCloud](https://loaders.gl/next/docs/specifications/category-mesh.md) object is required.

| Shape         | Output             | Use when                                  |
| ------------- | ------------------ | ----------------------------------------- |
| `arrow-table` | `Mesh Arrow table` | You want columnar point cloud attributes. |
| `mesh`        | `PointCloud`       | You need the legacy point cloud object.   |

Note: Currently supports `ascii`, `binary` and compressed binary files.

## Usage[​](#usage "Direct link to Usage")

```
import {PCDLoader} from '@loaders.gl/pointclouds/pcd';

import {load} from '@loaders.gl/core';



const data = await load(url, PCDLoader, options);

const table = await load(url, PCDLoader, {pcd: {shape: 'arrow-table'}});
```

## Batched Parsing[​](#batched-parsing "Direct link to Batched Parsing")

`PCDLoader` supports `loadInBatches` and `parseInBatches` for ASCII and uncompressed binary PCD data. When `pcd.shape: 'arrow-table'` is set, each yielded batch is an `ArrowTableBatch` with `shape: 'arrow-table'`, `batchType: 'data'`, and `data` containing an Apache Arrow table. Compressed binary PCD files fall back to a single parsed batch.

```
import {loadInBatches} from '@loaders.gl/core';

import {PCDLoader} from '@loaders.gl/pointclouds/pcd';



const batches = await loadInBatches(url, PCDLoader, {

  batchSize: 100_000,

  pcd: {shape: 'arrow-table'}

});



for await (const batch of batches) {

  console.log(batch.length, batch.data);

}
```

## Options[​](#options "Direct link to Options")

| Option      | Type                      | Default         | Description                                    |
| ----------- | ------------------------- | --------------- | ---------------------------------------------- |
| `pcd.shape` | `'mesh' \| 'arrow-table'` | `'arrow-table'` | Selects PointCloud or Mesh Arrow table output. |

## Worker batches[​](#worker-batches "Direct link to Worker batches")

`PCDLoader` supports `parseInBatches()` on its built-in browser worker. The worker stays leased for the input iterator and transfers owned Arrow column buffers. The caller hydrates Mesh Arrow tables and performs any requested legacy `shape: 'mesh'` conversion. Schemas and small loader/batch descriptors accompany the binary buffers; decoded row objects are not sent from the worker. JSON conversion, if needed by an application, happens on the caller.

```
const batches = await parseInBatches(input, PCDLoader, {

  core: {worker: true, batchSize: 1000},

  pcd: {shape: 'arrow-table'}

});

for await (const batch of batches) {

  consume(batch.data);

}
```

PCD currently collects the complete input before decoding. ASCII and uncompressed binary output is split by `core.batchSize`; compressed input may produce a single batch.

Cancellation uses the shared `signal` option. Aborting or ending iteration releases the worker; transferred input buffers remain detached. Self-hosted workers must implement the batch protocol and opt in with `core.workerInBatches: true`. Custom workers must use the current Arrow column wire format. This module ships a browser worker; Node workers require a compatible Node artifact. The parser-bearing loader is available from `@loaders.gl/pointclouds/pcd/pcd-loader`.
