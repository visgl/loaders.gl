Indexed geospatial format

[![](/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)

# A binary feature stream with a spatial index.

FlatGeobuf stores geospatial features in a compact binary layout and can include a packed Hilbert R-tree. loaders.gl uses that structure for streaming, Arrow conversion, and viewport-sized reads from remote files.

[FlatGeobuf module](https://loaders.gl/docs/modules/geospatial/flatgeobuf.md)

<!-- -->

[ ↗](https://loaders.gl/docs/modules/geospatial/flatgeobuf.md)[FlatGeobufLoader](https://loaders.gl/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-loader.md)

<!-- -->

[ ↗](https://loaders.gl/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-loader.md)[Remote source](https://loaders.gl/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-source.md)

<!-- -->

[ ↗](https://loaders.gl/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-source.md)

[![](/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)[Try It](https://loaders.gl/examples/geospatial/flatgeobuf)[Overview](https://loaders.gl/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)[Format](https://loaders.gl/docs/modules/geospatial/flatgeobuf/format.md)[FlatGeobufLoader](https://loaders.gl/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-loader.md)[FlatGeobufLoaderWithParser](https://loaders.gl/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-source.md)

Indexed feature data

## Read features without downloading unrelated space.

FlatGeobuf keeps feature records binary and streamable, while its optional index lets a source select records intersecting a bounding box before decoding the complete file.

01

Header

Schema, geometry metadata, bounds, and optional index information.

02

Index

Packed spatial nodes guide bounding-box range requests.

03

Decode

Return GeoJSON, Arrow, columnar, or binary feature data.

04

Stream

Process features incrementally when a complete table is unnecessary.

Detailed guide

## FlatGeobuf format and API details

The reference below covers the binary layout, spatial index, feature encodings, streaming behavior, and source selection rules.

| Characteristic       | Value                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| File Format          | [FlatGeobuf](https://loaders.gl/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)                |
| Data Format          | [Geometry Tables](https://loaders.gl/docs/specifications/category-gis.md), Arrow tables, binary features |
| File Extension       | `.fgb`                                                                                                   |
| MIME Type            | `application/octet-stream`                                                                               |
| File Type            | Binary                                                                                                   |
| Loader APIs          | `load`, `loadInBatches`, `parse`, `parseSync`, `parseInBatches`                                          |
| Loader Worker Thread | ✅ Yes                                                                                                   |
| Loader Streaming     | ✅ Yes                                                                                                   |
| Source APIs          | `createDataSource`, `getMetadata`, `getSchema`, `getFeatures`                                            |

## Loaders and Sources[​](#loaders-and-sources "Direct link to Loaders and Sources")

[Loader**FlatGeobufLoader**Loads FlatGeobuf files as GeoJSON, Arrow, columnar, or binary geometry data.Output: GeoJSONTable, Apache Arrow table, ColumnarTable, BinaryFeatureCollectionAPIs: load, parse, parseSync, parseInBatches](https://loaders.gl/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-loader.md)[Source**FlatGeobufLoader**Creates an indexed vector source for remote FlatGeobuf datasets.Output: VectorSourceAPIs: createDataSource, getFeatures](https://loaders.gl/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-source.md)

## Spatial Indexes[​](#spatial-indexes "Direct link to Spatial Indexes")

FlatGeobuf files can include a packed spatial index for range-request access. `FlatGeobufLoader` uses that index when present to fetch viewport-sized feature subsets from remote files.

## Arrow[​](#arrow "Direct link to Arrow")

Set `flatgeobuf.shape: 'arrow'` to preserve FlatGeobuf property columns in an Arrow table and append a WKB `geometry` column with geospatial metadata.
