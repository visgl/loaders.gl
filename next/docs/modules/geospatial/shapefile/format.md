GIS dataset format

SHP

# A geospatial dataset, not just a .shp file.

A Shapefile is a coordinated set of geometry, attribute, index, projection, and text-encoding files. loaders.gl assembles those pieces into common GIS and Arrow data shapes.

[Shapefile module](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)[ShapefileLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md)[GIS category](https://loaders.gl/next/docs/specifications/category-gis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-gis.md)

SHP[Try It](https://loaders.gl/next/examples/geospatial/shapefile)[Overview](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)[Format](https://loaders.gl/next/docs/modules/geospatial/shapefile/format.md)[ShapefileLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader.md)[SHPLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shp-loader.md)[DBFLoader](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/dbf-loader.md)

The dataset boundary

## Keep geometry and sidecars together.

The main geometry file is only one part of the format. The loader coordinates the sidecars so application code can work with features, attributes, and spatial metadata as one result.

01

Geometry

.shp stores the shape records

02

Attributes

.dbf stores the tabular properties

03

Index and CRS

.shx indexes records; .prj describes projection

04

Text encoding

.cpg can identify DBF character encoding

Detailed guide

## Shapefile structure and loaders

The reference below covers the file set, loaders, Arrow output, sidecar behavior, and compatibility details.

| Characteristic       | Value                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| File Format          | [Shapefile](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)  |
| Data Format          | [Geometry Tables](https://loaders.gl/next/docs/specifications/category-gis.md), Arrow tables |
| File Extensions      | `.shp`, `.shx`, `.dbf`, `.prj`, `.cpg`                                                            |
| MIME Type            | `application/octet-stream`                                                                        |
| File Type            | Binary, multi-file                                                                                |
| Loader APIs          | `load`, `parse`, `parseSync`, `parseInBatches`                                                    |
| Loader Worker Thread | ✅ Yes                                                                                            |
| Loader Streaming     | ✅ Yes                                                                                            |

## Loaders[​](#loaders "Direct link to Loaders")

[Loader**ShapefileLoader**Loads Shapefile geometries and DBF properties as loaders.gl geometry tables.Output: GeoJSONTable, ArrowTable, legacy Shapefile outputAPIs: load, parse, parseSync, parseInBatches](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shapefile-loader)[Subloader**SHPLoader**Loads the `.shp` geometry component of a Shapefile.Output: geometry recordsAPIs: load, parse, parseSync](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/shp-loader)[Subloader**DBFLoader**Loads the `.dbf` attribute table component of a Shapefile.Output: object rowsAPIs: load, parse, parseSync](https://loaders.gl/next/docs/modules/geospatial/shapefile/api-reference/dbf-loader)

## Multi-File Datasets[​](#multi-file-datasets "Direct link to Multi-File Datasets")

A Shapefile dataset is normally a set of sidecar files. `.shp` stores geometry, `.dbf` stores attributes, `.shx` stores the index, `.prj` stores projection text, and `.cpg` stores DBF text encoding.

## Arrow[​](#arrow "Direct link to Arrow")

Set `shapefile.shape: 'arrow-table'` to return an Arrow table with DBF property columns and a WKB `geometry` column.
