Arrow writer

![](/next/images/format-logos/apache-arrow-logo.png)

![Apache Software Foundation](/next/assets/images/apache-logo-3530356552600b45779f409084590362.png)

# ArrowWriter

ArrowWriter turns typed arrays and table-oriented data into Apache Arrow IPC bytes. Use it when a result should remain columnar across files, streams, workers, or another language.

[Arrow format](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[Arrow module](https://loaders.gl/next/docs/modules/tables/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow.md)

![](/next/images/format-logos/apache-arrow-logo.png)[Try It](https://loaders.gl/next/examples/table/arrow)[Overview](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[Format](https://loaders.gl/next/docs/modules/tables/arrow/format.md)[ArrowLoader](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)[ArrowWriter](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-writer.md)[GeoArrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)[GeoArrowLoader](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/geoarrow-loader.md)

Portable output

## One application shape. Many destinations.

Writers keep encoding at the edge of the pipeline. Prepare a documented category shape, choose the destination format, and let that writer own its physical layout and compression.

Application data

[Arrow tabletyped columns and batches↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)[Mesh dataattributes and geometry↗](https://loaders.gl/next/docs/specifications/category-mesh.md)[GeoJSON datafeatures and geometry↗](https://loaders.gl/next/docs/specifications/category-gis.md)

→

encode()

Writer boundary

validate · encode · compress

→

Portable files

[Parquetcolumnar analytical files↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[glTF / GLBportable scene assets↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)[Draco / LAScompressed geometry and points↗](https://loaders.gl/next/docs/modules/draco/formats/draco.md)

The application chooses the data shape; the writer chooses the bytes.

Encode once, reuse elsewhere

## Keep types and column boundaries intact.

The writer accepts table-oriented arrays and emits an IPC representation that Arrow readers can consume. The output can be saved, streamed, or passed to another loaders.gl pipeline.

01

Input

Typed arrays, dates, strings, and Arrow-compatible fields

02

Output

Apache Arrow IPC ArrayBuffer data

03

Use with

encode, writeFile, workers, and table sources

04

Next step

Read with ArrowLoader or any Arrow implementation

![From-v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

The `ArrowWriter` encodes a set of arrays into an Apache Arrow IPC stream or file. The file container is Feather V2 and can optionally use LZ4-frame or Zstandard embedded buffer compression.

Detailed guide

## ArrowWriter options and shapes

The sections below cover usage, input arrays, options, and the resulting Arrow IPC data.

## Usage[​](#usage "Direct link to Usage")

```
import {encodeSync} from '@loaders.gl/core';

import {ArrowWriter, VECTOR_TYPES} from '@loaders.gl/tables/arrow';



const LENGTH = 2000;



const rainAmounts = Float32Array.from({length: LENGTH}, () =>

  Number((Math.random() * 20).toFixed(1))

);



const rainDates = Array.from(

  {length: LENGTH},

  (_, i) => new Date(Date.now() - 1000 * 60 * 60 * 24 * i)

);



const arraysData = [

  {array: rainAmounts, name: 'precipitation', type: VECTOR_TYPES.FLOAT},

  {array: rainDates, name: 'date', type: VECTOR_TYPES.DATE}

];



const arrayBuffer = encodeSync(arraysData, ArrowWriter);
```

To write a compressed Feather V2 file:

```
import {encode} from '@loaders.gl/core';



const featherBuffer = await encode(arraysData, ArrowWriter, {

  arrow: {

    container: 'file',

    compression: 'zstd'

  }

});
```

LZ4 and Zstandard encoding use compress-utils. Async `encode()` preloads the requested codec. Call it once before using `encodeSync()` with that codec; no external module injection is needed.

## Options[​](#options "Direct link to Options")

| Option              | Type                          | Default    | Description                                                                                           |
| ------------------- | ----------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `arrow.container`   | `'stream'` \| `'file'`        | `'stream'` | Selects the Arrow IPC stream or file container. Feather V2 uses `'file'`.                             |
| `arrow.compression` | `null` \| `'lz4'` \| `'zstd'` | `null`     | Selects embedded record-batch buffer compression. Compression requires Apache Arrow JS 21.2 or later. |

The input arrays determine the Arrow field names and types; use the exported `VECTOR_TYPES` constants when constructing the input.

## Dependencies[​](#dependencies "Direct link to Dependencies")

[Apache Arrow JS](https://arrow.apache.org/docs/js/) library is included into the bundle.

Compression uses the default compress-utils codecs from `@loaders.gl/compression`.
