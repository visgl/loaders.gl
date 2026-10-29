OBJ loader

OBJ

# Bring Wavefront geometry into a shared mesh pipeline.

`OBJLoader` parses the classic OBJ/MTL text format and can return a legacy Mesh object or Mesh Arrow table. For large vertex-only files, it also exposes a batched point-cloud path.

[OBJ module](https://loaders.gl/next/docs/modules/scene/obj.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/obj.md)[Mesh category](https://loaders.gl/next/docs/specifications/category-mesh.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-mesh.md)[OBJWriter](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-writer.md)

The OBJ path

## Read text geometry. Preserve the representation you need.

OBJ is human-readable and widely supported, but its records are not columnar. The loader resolves faces, materials, and attributes before exposing a renderer-friendly or Arrow-backed result.

01

Input

OBJ geometry with optional MTL materials

02

Records

Vertices, normals, UVs, colors, and faces

03

Output

Mesh object or Mesh Arrow table

04

Streaming

Batched vertex parsing for point clouds

OBJ[Try It](https://loaders.gl/next/examples/pointclouds/obj)[Overview](https://loaders.gl/next/docs/modules/scene/obj/formats/obj.md)[Format](https://loaders.gl/next/docs/modules/scene/obj/format.md)[OBJLoader](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-loader.md)[OBJWriter](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-writer.md)

Detailed guide

## OBJ parsing and output details

The reference below covers output shapes, material and geometry records, batched parsing, and loader options.

![From-v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)

`OBJLoader` parses the OBJ half of the classic Wavefront OBJ/MTL format and returns a [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) by default.

Set `obj.shape: 'mesh'` when a legacy [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) object is required.

| Shape         | Output             | Use when                           |
| ------------- | ------------------ | ---------------------------------- |
| `arrow-table` | `Mesh Arrow table` | You want columnar mesh attributes. |
| `mesh`        | `Mesh`             | You need the legacy mesh object.   |

## Usage[​](#usage "Direct link to Usage")

```
import {OBJLoader} from '@loaders.gl/scene/obj';

import {load} from '@loaders.gl/core';



const data = await load(url, OBJLoader, options);

const table = await load(url, OBJLoader, {obj: {shape: 'arrow-table'}});
```

## Batched Parsing[​](#batched-parsing "Direct link to Batched Parsing")

`OBJLoader` supports `loadInBatches` and `parseInBatches` for vertex-only OBJ point clouds. By default, the loader scans the OBJ text before batching; if `f` face records or `l` line records are present, it falls back to atomic parsing and yields one batch.

Set `obj.pointCloud: true` when the input is known to be a point cloud and should stream `v` vertex records without waiting for a whole-file geometry scan. With `obj.shape: 'arrow-table'`, each yielded batch is an `ArrowTableBatch` with `shape: 'arrow-table'`, `batchType: 'data'`, and `data` containing an Apache Arrow table.

```
import {loadInBatches} from '@loaders.gl/core';

import {OBJLoader} from '@loaders.gl/scene/obj';



const batches = await loadInBatches(url, OBJLoader, {

  batchSize: 100_000,

  obj: {shape: 'arrow-table', pointCloud: true}

});



for await (const batch of batches) {

  console.log(batch.length, batch.data);

}
```

## Options[​](#options "Direct link to Options")

| Option           | Type                      | Default         | Description                                                                                |
| ---------------- | ------------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| `obj.shape`      | `'mesh' \| 'arrow-table'` | `'arrow-table'` | Selects Mesh or Mesh Arrow table output.                                                   |
| `obj.pointCloud` | `boolean`                 | `false`         | Streams OBJ `v` records as point-cloud batches. Use only for known point-cloud OBJ inputs. |

Remarks:

* vertex colors are parsed as a `COLOR_0` attribute when red, green and blue values are included after x y and z (this precludes specifying w). The color values range from 0 to 1.

## Attribution[​](#attribution "Direct link to Attribution")

OBJLoader is a port of [three.js](https://github.com/mrdoob/three.js)'s OBJLoader under MIT License.

## Worker batches[​](#worker-batches "Direct link to Worker batches")

`OBJLoader` supports `parseInBatches()` on its built-in browser worker. The worker stays leased for the input iterator and transfers owned Arrow column buffers. The caller hydrates Mesh Arrow tables and performs any requested legacy `shape: 'mesh'` conversion. Schemas and small loader/batch descriptors accompany the binary buffers; decoded row objects are not sent from the worker. JSON conversion, if needed by an application, happens on the caller.

```
const batches = await parseInBatches(input, OBJLoader, {

  core: {worker: true, batchSize: 1000},

  obj: {shape: 'arrow-table', pointCloud: true}

});

for await (const batch of batches) {

  consume(batch.data);

}
```

With `obj.pointCloud: true`, vertex batches can arrive before input ends. General OBJ geometry is collected before parsing so faces can reference earlier vertices.

Cancellation uses the shared `signal` option. Aborting or ending iteration releases the worker; transferred input buffers remain detached. Self-hosted workers must implement the batch protocol and opt in with `core.workerInBatches: true`. Custom workers must use the current Arrow column wire format. This module ships a browser worker; Node workers require a compatible Node artifact. The parser-bearing loader is available from `@loaders.gl/scene/obj/obj-loader`.
