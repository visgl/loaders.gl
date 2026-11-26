---
title: Upgrade guide
description: Find the package, API, and output changes needed to upgrade loaders.gl.
hide_title: true
page_style: designed
toc_max_heading_level: 3
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';

<DocPageHeader
  eyebrow="Upgrade guide"
  title="Upgrade the parts your application uses."
  description="Update package imports first, then check the source APIs, output shapes, and codecs you depend on."
  tone="orange"
  links={[{label: 'What’s new', to: '/docs/whats-new'}]}
/>

## Updating from 5.0.0

Format packages now expose their loaders through subpaths. Replace a package-root loader
import with `@loaders.gl/<package>/<format>`. For eager parsing, writers, and direct source
construction, use `@loaders.gl/<package>/<format>/bundled`. Both paths export loaders
under their ordinary names. The core framework is available at `@loaders.gl/core/api`,
and tileset traversal at `@loaders.gl/tiles-3d/tileset`. Existing core root imports remain supported.
Image utilities such as `getBinaryImageMetadata` now use `@loaders.gl/images/api`.
The `@loaders.gl/images/gl-extensions` subpath was removed. Texture levels still carry
the numeric WebGL `format` when available. Use the level’s `textureFormat` for renderer
capability checks, or use WebGL context and extension constants for numeric comparisons.

Update existing `@loaders.gl/tiles-3d` root imports as follows.

| Symbol | Import |
| --- | --- |
| `Tileset3D`, `Tile3D`, `TILE_TYPE` | `@loaders.gl/tiles-3d/tileset` |
| `Tiles3DSource` | `@loaders.gl/tiles-3d/3d-tiles/bundled` |
| `I3SSource` | `@loaders.gl/tiles-3d/i3s/bundled` |

Update downstream packages that import these symbols before adopting this release. An existing
`^5.0.0` dependency range can select a release with these import changes.


For table formats, use the following subpaths.

| Loaders | Subpath under `@loaders.gl/tables` |
| --- | --- |
| `CSVLoader` | `/csv` |
| `AvroLoader`, `AvroSchemaLoader` | `/avro` |
| `ArrowLoader`, `GeoArrowLoader` | `/arrow` |
| `JSONLoader`, `JSONTableLoader`, `NDJSONLoader`, `GeoJSONLoader`, `NDGeoJSONLoader` | `/json` |
| `LanceLoader` | `/lance` |
| `ORCLoader` | `/orc` |
| `ParquetLoader`, `GeoParquetLoader` | `/parquet` |

For eager Parquet parsers, writers, and sources, use `@loaders.gl/tables/parquet/bundled`. The bundled entry point exports
the parser-bearing loaders as `ParquetLoader` and `GeoParquetLoader`. Use these loaders, their sources, and the bundled writer for Parquet I/O. Arrow conversion utilities live in `@loaders.gl/core/schema-utils`.

## Upgrading to v5.0

This section covers upgrades from stable loaders.gl 4.x to 5.0. Update all loaders.gl
dependencies together and regenerate your lockfile. See [What's New](./whats-new.mdx#v50)
for new features.

### Arrow query results

Relational Arrow queries use math.gl’s Arrow result types. Read `COUNT` fields as Arrow `Int64` values (JavaScript `bigint`). An empty ungrouped aggregate yields one row with `COUNT` equal to `0n` and `NULL` in aggregates such as `SUM` and `AVG`. A zero divisor in a portable `divide` expression produces `NULL`.

Arrow temporal predicates use storage units. Use epoch days for numeric `Date32`
literals and a `bigint` in the column unit for `Timestamp` literals. A JavaScript
`Date` is converted to the column unit, including its UTC day for `Date32`.

Direct and streaming Arrow predicates follow math.gl's operand restrictions.
For predicates on `LargeUtf8` or `LargeBinary`, use a standard-width column
when the offsets fit. Convert `Float16` to `Float32` on runtimes without
`Float16Array`. Compare `FixedSizeBinary` values against literals of the
column's declared byte width.

### Package and import migrations

Install the grouped npm package and use its format subpath. For example, replace
`@loaders.gl/csv` with `@loaders.gl/tables/csv`.

| v4 packages | v5 entry points |
| --- | --- |
| `arrow`, `csv`, `json`, `parquet` | [`@loaders.gl/tables`](./modules/tables/README.md) with the matching format suffix |
| `geoarrow` utilities | [`@loaders.gl/core/geoarrow`](./modules/core/geoarrow/README.md) |
| `bson`, `xml` | [`@loaders.gl/documents`](./modules/documents/README.md) with the matching format suffix |
| `flatgeobuf`, `geopackage`, `kml`, `shapefile`, `wkt` | [`@loaders.gl/geospatial`](./modules/geospatial/README.md) with the matching format suffix |
| `las`, `pcd`, `ply` | [`@loaders.gl/pointclouds`](./modules/pointclouds/README.md) with the matching format suffix |
| `draco`, `gltf`, `obj` | [`@loaders.gl/scene`](./modules/scene/README.md) with the matching format suffix |
| `geotiff`, `lerc`, `terrain` | [`@loaders.gl/raster`](./modules/raster/README.md) with the matching format suffix |
| `netcdf`, `zarr` | [`@loaders.gl/scientific`](./modules/scientific/README.md) with the matching format suffix |
| `3d-tiles`, `copc`, `i3s`, `potree` | [`@loaders.gl/tiles-3d`](./modules/tiles-3d/README.md) with the matching format suffix |
| `mlt`, `mvt`, `pmtiles` | [`@loaders.gl/tiles`](./modules/tiles/README.md) with the matching format suffix |
| `textures`, `video` | [`@loaders.gl/images/texture`](./modules/images/README.md), `@loaders.gl/images/video` |
| `wms` | [`@loaders.gl/ogc/wms`](./modules/ogc/wms/README.md) |
| `zip` | [`@loaders.gl/archives/zip`](./modules/archives/zip/README.md) |
| `loader-utils`, `polyfills`, `schema`, `schema-utils`, `worker-utils` | [`@loaders.gl/core`](./modules/core/README.md) with the matching suffix |

The GeoArrow IPC loader and writer are available from `@loaders.gl/tables/geoarrow`.

### Format entry points

- Use format loaders with `load()` or `parse()`. For `parseSync()`, use the parser-bearing
  loader from the format's `/bundled` entry point where available, such as
  `@loaders.gl/tables/csv/bundled`.
- Rebuild custom workers and update hard-coded worker and WASM URLs to the owning
  package. Install optional decoder peers for the formats you use.
- Excel loading and the deprecated compressed-texture writer were removed. Convert
  Excel input to a supported table format before loading it.

### Loader outputs

- Table loaders return native Apache Arrow `Table` objects and batch iterators yield
  `RecordBatch` objects. Replace wrapper access such as `result.data` or `batch.recordBatch`
  with the returned value. See the [table guide](./modules/core/schema/table-guide.md#native-apache-arrow-output).
- Choose a format's `shape: 'arrow'` option in place of a dedicated Arrow loader variant.
  For GeoJSON object rows, use `geojson.shape: 'geojson-table'`.
- GraphML and DOT default to Arrow node and edge tables. Set the format's
  `shape: 'plain-graph-data'` to keep reading `graph.nodes` and `graph.edges`.

### Tile converter defaults to v5

The `tile-converter` CLI and the package root now use the v5 engine. The
`tile-converter-v4` command and `@loaders.gl/tile-converter/v4` export were removed.
If you still need the legacy workflow, use a [previous release](./modules/tile-converter/cli-reference/tile-converter.md). See the
[v5 CLI reference](./modules/tile-converter/cli-reference/tile-converter-v5.md) for the
new options and supported inputs.

### Worker task runtime

Task scheduling and worker execution moved to [`@math.gl/tasks`](https://math.gl/docs/modules/tasks).
Use [Core worker utilities](./modules/core/worker-utils/README.md) for loader-specific
worker processing. Replace direct worker-pool controls with a task runner and use
`destroyWorkerTasks()` to shut down loader-managed requests.

### Native BSON value contract

Update callers that depended on MongoDB wrapper instances. The
[BSON format reference](./modules/documents/bson/formats/bson.md) documents the native
value representation.

## Upgrading to v4.5

Supply `zstd-codec` through `options.modules` when decoding SPZ. Install
`texture-compressor` explicitly if you use the experimental compressed texture writer.

## Upgrading to v4.4

Texture levels distinguish WebGL `format` from GPU `textureFormat`. Pass
`basis.supportedTextureFormats` when selecting a Basis target automatically. Supply
decoder libraries through `options.modules` in place of `libraryPath`.
Parquet byte array columns return `Uint8Array`.

## Upgrading to v4.3

Move shared loader options to `options.core`. Replace deprecated file providers with
`HttpFile`, `BlobFile`, `NodeFile`, or `ArrayBufferFile`. Use `tileIndex.z`
in place of `tileIndex.zoom` in source implementations.

## Upgrading to v4.2

Custom loaders can declare `dataType` and `batchType` for return-type inference.

## Upgrading to v4.1

WKB loaders default to `geojson-geometry`. Set `wkb.shape: 'binary-geometry'` for
binary output. Replace the old `geometry` shape with `geojson-geometry`.

## Upgrading to v4.0

Use Node.js 18 or later. Import the Node polyfills before calling loader functions.
Review typed loader results where the new types surface assumptions about data shapes.

## Upgrading to v3.4

Use `crs` in place of `srs` in WMS requests. Read `layers`,
`geographicBoundingBox`, and `boundingBoxes` from WMS capabilities.

## Upgrading to v3.2

GeoPackage defaults to tables. Set `gis.format: 'geojson'` for the previous
mapping of table names to feature arrays.

## Upgrading to v3.0

Use a supported Node version and evergreen browsers for the module build. Check
worker concurrency settings if the lower defaults affect your application.

## Upgrading to v2.3

Await `selectLoader()` or use `selectLoaderSync()`. Move fetch settings into
`options.fetch`. Replace `KMLAsGeoJsonLoader` with `KMLLoader` and
`gis.format: 'geojson'`.

## Upgrading to v2.2

Replace `_selectLoader` with `selectLoader` and use async `parseInBatches()`
in place of `parseInBatchesSync()`.

## Upgrading to v2.1

Replace `getStreamIterator` with `makeStreamIterator` and
`contatenateAsyncIterator` with `concatenateChunksAsync`.

## Upgrading to v2.0

Nest format-specific options under each loader's option key. Custom loader objects
must provide `parse`. Review the glTF output shape if your code used the parser object.

## Upgrading from v1.2 to v1.3

Set `gltf.parserVersion: 2` to opt into the updated glTF output before v2.

## Upgrading from v1.0 to v1.1

Load the Node polyfills before using `fetchFile`, `TextEncoder`, or `TextDecoder`
in Node.

## v1.0

Initial release.

See the [v4.5.4 guide](https://github.com/visgl/loaders.gl/blob/v4.5.4/docs/upgrade-guide.md)
for the full historical migration details.
