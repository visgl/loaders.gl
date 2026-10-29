Portable output

# Encode the data you already have.

Convert application and category data at the edge of the pipeline, then let a format-specific writer own validation, compression, and output bytes.

encode()conversioncompression

Arrow table

→

validate

→

Parquet

Core API

# Using writers

Turn tables, geometry, images, and other application data back into portable files with the same explicit module boundaries used for loading.

[Writer object format](https://loaders.gl/next/docs/specifications/writer-object-format.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/writer-object-format.md)[Converting data](https://loaders.gl/next/docs/developer-guide/converting-data.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/converting-data.md)

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

The writer path

## Encode the application shape you already have.

Writers sit at the far edge of a pipeline. Convert into the format’s documented input shape, choose the output container, and keep format-specific encoding behind one explicit module.

01

Prepare

Use a category shape or format-specific writer input

02

Encode

Call encode() or encodeSync() with one writer

03

Compress

Pass codec and container options where supported

04

Save

Write a buffer, stream, file, or application response

Writers allow applications to encode data into many of the formats supported by loaders.gl.

For a detailed specification of the writer object format see the [API reference](https://loaders.gl/next/docs/specifications/writer-object-format.md).

Detailed guide

## Writer inputs and output behavior

The guide below covers writer selection, category-compatible input data, asynchronous encoding, options, and format-specific boundaries.

## Usage[​](#usage "Direct link to Usage")

As an example, to Draco-compress a mesh using the `DracoWriter`:

```
import {DracoWriter} from '@loaders.gl/draco';

import {encode} from '@loaders.gl/core';



const mesh = {

  attributes: {

    POSITION: {...}

  }

};



const data = await encode(mesh, DracoWriter);
```

## Input Data[​](#input-data "Direct link to Input Data")

*Writers* accept the same format of data that is produced by the corresponding loaders. This format is documented either in each loader or usually as part of the documentation for that loader category.

Mesh category writers can accept either plain Mesh objects or Mesh Arrow tables. Plain Mesh data is normalized through the Mesh Arrow table conversion path before encoding.

If applications have data in a different format, they will need to first transform the data to the format expected by the *writer*.
