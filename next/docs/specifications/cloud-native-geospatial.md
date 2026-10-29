Cloud-native data access

# Ask the cloud for the part of the dataset you need.

Cloud-native geospatial formats combine spatial or tabular organization with ordinary object storage. Their indexes, chunks, tiles, and metadata let clients read selectively without an application server in the middle.

[Common scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)[Range requests](https://loaders.gl/next/docs/developer-guide/using-range-requests.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-range-requests.md)

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

The cloud-native pattern

## Index first. Range-read second. Decode only what matters.

The formats differ—columnar files, tiled archives, indexed point clouds, and catalogs—but the application goal is the same: turn a remote object into a bounded, useful request.

01

Storage

Files or archives on S3, CDN, or similar object storage

02

Index

Metadata identifies relevant chunks, tiles, or columns

03

Transport

HTTP range requests fetch selected byte spans

04

Output

Typed tables, rasters, features, or point batches

Cloud-native formats organize files, chunks, or tiles so clients can read selected data from object storage without downloading a complete dataset.

Detailed guide

## Formats and access patterns

The sections below compare cloud-native characteristics, notable formats, and the catalog or object-storage layers around them.

## Access patterns[​](#access-patterns "Direct link to Access patterns")

| Pattern                  | Purpose                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| Indexed records          | Identify features, points, or row groups relevant to a query.        |
| Tiled or chunked storage | Fetch a subset of a raster, scene, or array.                         |
| HTTP range requests      | Read selected byte spans when the server supports partial responses. |
| Catalog metadata         | Discover assets and their bounds before opening the data.            |

## Formats in loaders.gl[​](#formats-in-loadersgl "Direct link to Formats in loaders.gl")

| Format     | Access pattern                         | Reference                                                                                    |
| ---------- | -------------------------------------- | -------------------------------------------------------------------------------------------- |
| FlatGeobuf | Indexed feature access                 | [FlatGeobuf](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf.md)             |
| GeoParquet | Columnar rows with geospatial metadata | [GeoParquet](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md) |
| COG        | Tiled TIFF raster ranges               | [GeoTIFF](https://loaders.gl/next/docs/modules/raster/geotiff.md)                       |
| COPC       | Indexed LAS/LAZ point-cloud ranges     | [COPC](https://loaders.gl/next/docs/modules/tiles-3d/copc.md)                           |
| PMTiles    | Tile archive ranges                    | [PMTiles](https://loaders.gl/next/docs/modules/tiles/pmtiles.md)                        |
| Zarr       | Chunked multidimensional arrays        | [Zarr](https://loaders.gl/next/docs/modules/scientific/zarr.md)                         |
| STAC       | Catalog and asset discovery            | [STAC](https://loaders.gl/next/docs/modules/ogc/stac.md)                                |

Format structure alone does not guarantee selective reads. Check the source's supported queries and the server's range/CORS behavior. See the [range request guide](https://loaders.gl/next/docs/developer-guide/using-range-requests.md) and [common scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md).
