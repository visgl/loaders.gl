FlatGeobuf source loader

![](/next/images/format-logos/flatgeobuf-logo.png)

# Query an indexed vector file from the browser.

`FlatGeobufSourceLoader` uses the FlatGeobuf spatial index and HTTP range requests to return only the features needed for a query. It can expose GeoJSON-style, binary, or Arrow table results.

[FlatGeobuf module](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf.md)[FlatGeobuf format](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

The indexed query path

## Read the header. Select the index ranges. Return matching features.

A FlatGeobuf source keeps the file remote and lets the spatial index narrow the bytes before geometry decoding.

01

Open

Remote \`.fgb\` URL or supported loaded data

02

Filter

Bounding box, layers, and output format

03

Transport

Coalesced byte ranges for selected index nodes

04

Output

GeoJSON table, binary features, or Arrow table

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![range requests from v5.0](https://img.shields.io/badge/range_requests-From_v5.0-blue.svg?style=flat-square)

![](/next/images/format-logos/flatgeobuf-logo.png)[Try It](https://loaders.gl/next/examples/geospatial/flatgeobuf)[Overview](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)[Format](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/format.md)[FlatGeobufLoader](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-loader.md)[FlatGeobufSourceLoader](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-source-loader.md)

Cloud-native reads

## Ask for the data. Fetch only the bytes behind it.

Range-aware sources translate a logical request into scheduled byte ranges. Metadata, caching, and cancellation stay in the transport layer while the application works with a normal decoded result.

Logical request

[**A tile**visible scene content↗](https://loaders.gl/next/docs/modules/tiles.md)[**A column**selected table data↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[**A window**selected raster pixels↗](https://loaders.gl/next/docs/modules/raster/geotiff/formats/geotiff.md)[**A point region**bounded cloud data↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

locat&#x65;**→**

\[ ]

Range scheduler

mergecacheabort

offsets · limits · HTTP Range

rea&#x64;**→**

Useful bytes

**Header bytes**discover the layout

**Selected intervals**fetch only what is needed

**Decoded result**table, tile, or raster data

The same access pattern powers tiled scenes, columnar files, point clouds, and windowed rasters without making the whole object a prerequisite.

Detailed guide

## Source behavior and output contracts

The reference below covers construction, query results, metadata, CRS handling, range requirements, and empty-result behavior.

The `FlatGeobufSourceLoader` creates an indexed vector source for remote `.fgb` datasets and serves viewport-sized feature subsets through HTTP range requests.

## Usage[​](#usage "Direct link to Usage")

```
import {createDataSource} from '@loaders.gl/core';

import {FlatGeobufSourceLoader} from '@loaders.gl/geospatial/flatgeobuf';



const source = createDataSource(url, [FlatGeobufSourceLoader]);



const arrowTable = await source.getFeatures({

  layers: 'dataset',

  boundingBox: [

    [-12, 35],

    [30, 60]

  ],

  format: 'arrow'

});
```

## Outputs[​](#outputs "Direct link to Outputs")

* `format: 'geojson'` returns a `GeoJSONTable`.
* `format: 'binary'` returns a binary feature collection.
* `format: 'arrow'` returns an Arrow table with FlatGeobuf property columns plus a WKB `geometry` column annotated with geospatial schema metadata.

## Metadata[​](#metadata "Direct link to Metadata")

`getMetadata()` returns one logical source layer for the dataset, including:

* dataset name and title when available
* source bounds from the FlatGeobuf header envelope
* CRS identifiers from the FlatGeobuf header
* optional `formatSpecificMetadata` when requested

## Notes[​](#notes "Direct link to Notes")

* `FlatGeobufSourceLoader` is optimized for remote URL access and expects byte-range fetches.
* Bounding box requests use the FlatGeobuf spatial index when present and return empty valid tables when nothing matches.
* Source-level reprojection matches `FlatGeobufLoader` behavior.
