Point-cloud module

LAS

# @loaders.gl/pointclouds/las

Keep the point record, or keep the columns. Read and write LAS/LAZ exchange data as raw records, a render-ready point cloud, or a typed Mesh Arrow table.

[LAS / LAZ format](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)[Mesh category](https://loaders.gl/next/docs/specifications/category-mesh.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-mesh.md)

LAS[Try It](https://loaders.gl/next/examples/pointclouds/las)[Benchmarks](https://loaders.gl/next/docs/modules/pointclouds/las/benchmarks.md)[Overview](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)[Format](https://loaders.gl/next/docs/modules/pointclouds/las/format.md)[LASLoader](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-loader.md)[LASWriter](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-writer.md)

One point-cloud family

## Keep the points. Change the delivery layer.

LAS defines the record, LAZ compresses it, and COPC indexes it for cloud range reads. The logical attributes can continue into Arrow, rendering, or a writer without being reduced to positions alone.

Formats

[LASuncompressed records↗](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)[LAZlossless compression↗](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md#las-laz-and-copc)[COPChierarchy + ranges↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)

decod&#x65;**→**

point record

Typed point columns

POSITIONintensityclassificationCOLOR\_0GPS\_TIMEEXTRA\_BYTES

scale · offset · metadata

shap&#x65;**→**

Application paths

[Arrow point tabletyped columns↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)[Mesh / point cloudrender-ready positions↗](https://loaders.gl/next/docs/specifications/category-mesh.md)[LAS / LAZ writerexchange the records↗](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-writer.md)

Select raw records, typed columns, or spatial ranges according to the next operation.

The LAS path

## Decode the fields your workflow actually uses.

LAS and LAZ carry more than positions. loaders.gl exposes standard attributes, flags, colors, time, waveform references, and Extra Bytes while allowing applications to choose the output shape.

01

Geometry

Scaled positions with source offsets and bounds

02

Attributes

Classification, returns, color, time, NIR, and waveform data

03

Columnar path

Use shape: 'arrow-table' and select columns

04

Write back

Encode Mesh or Mesh Arrow tables as LAS or LAZ

See [Coordinate Reference Systems](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md) for the current LAS/LAZ projection-record support and vertical/compound CRS roadmap.

The `@loaders.gl/pointclouds/las` module supports the [LAS file format](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md) and its compressed version (LAZ).

Detailed guide

## LAS implementation details

The sections below cover installation, loaders and writers, point-record support, and current compatibility limits.

`LASLoader` supports LAZ point formats 0-10 for documented LASzip codec combinations. Arrow output exposes positions, intensity, classification, RGB, GPS time, NIR, waveform references, and Extra Bytes where present, while the raw APIs preserve complete supported point records. Waveform helpers range-read internal LAS or external WDP sample packets on demand. See the [LAS/LAZ implementation limits](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md#current-implementation-limits) for exact codec, point-format, fixture, and streaming details.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/pointclouds
```

The default TypeScript LAS/LAZ loader does not require the optional `copc` or `laz-perf` npm packages. They are declared as `optionalDependencies`, so consumers can omit them with `npm install --omit=optional`. Install `copc` explicitly when using the alternative `@loaders.gl/pointclouds/las/las-copc-loader` implementation. The LAZPerf and LAZRs loader paths include their vendored runtimes.

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader or Writer                                                                                     | Description                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`LASLoader`](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-loader.md) | Loads LAS/LAZ point clouds as Mesh objects or [Mesh Arrow tables](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables). |
| [`LASWriter`](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-writer.md) | Writes Mesh or Mesh Arrow table point clouds as LAS or LAZ data.                                                                                        |

`LASMesh`, `LASHeader`, and `LASMetadata` are available as type-only imports from `@loaders.gl/pointclouds/las`. Use `LASMesh` when describing the loader's mesh output without importing implementation files.

## Attribution[​](#attribution "Direct link to Attribution")

LASLoader is a fork of Uday Verma and Howard Butler's [plasio](https://github.com/verma/plasio/) under MIT License.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/pointclouds/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
