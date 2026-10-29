Point-cloud format

LAS

# Point records that scale from files to the cloud.

LAS defines a widely used binary point-cloud record layout. loaders.gl reads LAS and LAZ into application-friendly point or Arrow data, and provides the same category boundary for writers and cloud-oriented COPC workflows.

[LAS module](https://loaders.gl/next/docs/modules/pointclouds/las.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/las.md)[LASLoader](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-loader.md)[COPC](https://loaders.gl/next/docs/modules/tiles-3d/copc.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/copc.md)

LAS[Try It](https://loaders.gl/next/examples/pointclouds/las)[Benchmarks](https://loaders.gl/next/docs/modules/pointclouds/las/benchmarks.md)[Overview](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)[Format](https://loaders.gl/next/docs/modules/pointclouds/las/format.md)[LASLoader](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-loader.md)[LASWriter](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-writer.md)

Point-cloud data path

## Choose a convenient view of the same records.

The format preserves point attributes and coordinate metadata while the loader can expose them as a render-ready point cloud or as typed columns for scans, transforms, workers, and writers.

01

LAS

Uncompressed binary records with a defined public header.

02

LAZ

Lossless compressed LAS records for smaller transfers.

03

Category data

PointCloud objects or Mesh Arrow tables.

04

Cloud access

Use COPC when hierarchy and range reads matter.

Detailed guide

## LAS format and API details

The reference below covers the record layout, versions, compression, coordinate metadata, loader behavior, and writer compatibility.

| Characteristic       | Value                                                                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Format          | [LAS / LAZ](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)                                                                                                    |
| Data Format          | [PointCloud](https://loaders.gl/next/docs/specifications/category-mesh.md), [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) |
| File Extensions      | `.las`, `.laz`                                                                                                                                                                           |
| MIME Type            | Not standardized                                                                                                                                                                         |
| File Type            | Binary                                                                                                                                                                                   |
| Loader APIs          | `load`, `parse`, `parseSync`, `parseInBatches`                                                                                                                                           |
| Loader Worker Thread | ✅ Yes                                                                                                                                                                                   |
| Loader Streaming     | ✅ Yes                                                                                                                                                                                   |
| Writer APIs          | `encode`, `encodeSync`                                                                                                                                                                   |

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

[Loader**LASLoader**Loads LAS and LAZ point clouds as PointCloud objects or Mesh Arrow tables.Output: PointCloud, Mesh Arrow tableAPIs: load, parse, parseSync](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-loader)[Writer**LASWriter**Writes Mesh or Mesh Arrow table point clouds as uncompressed LAS data.Input: Mesh, Mesh Arrow tableAPIs: encode, encodeSync](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-writer)

## LAS, LAZ, and COPC[​](#las-laz-and-copc "Direct link to LAS, LAZ, and COPC")

LAS stores uncompressed point cloud data. LAZ is the lossless compressed variant.

## Support[​](#support "Direct link to Support")

See the [LAS/LAZ implementation limits](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md#current-implementation-limits) for supported versions, point formats, codec combinations, and streaming behavior.
