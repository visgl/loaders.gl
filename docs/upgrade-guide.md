---
title: Upgrade guide
description: Plan loaders.gl upgrades with focused notes on removals, deprecations, and behavior changes.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Migration guide"
  title="Upgrade with the data path in view."
  description="Use this guide to identify breaking changes, deprecated APIs, dependency alignment, and new defaults before moving an application to a newer loaders.gl release."
  tone="orange"
  meta={['v4.5 and v5.0', 'Breaking changes', 'Migration examples']}
  links={[
    {label: 'What’s new', to: '/docs/whats-new'},
    {label: 'Get started', to: '/docs/developer-guide/get-started'},
    {label: 'Apache Arrow', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<DocOrientation
  eyebrow="Before you upgrade"
  title="Check the boundary that changed."
  description="Most migrations are local to a package or return shape. Read the relevant section, update imports and options, then verify the resulting table, source, worker, or writer contract with the linked documentation."
  tone="orange"
  items={[
    {label: 'Imports', value: 'Packages, subpaths, and renamed APIs'},
    {label: 'Data shapes', value: 'Arrow tables, batches, and discriminated results'},
    {label: 'Runtime behavior', value: 'Caching, traversal, workers, and source lifecycles'},
    {label: 'Dependencies', value: 'Optional codecs, Arrow versions, and peer packages'}
  ]}
/>

<ReferenceBoundary
  title="Version-by-version migration details"
  description="The sections below record v4.5 additions and v5 deprecations, removals, defaults, and compatibility notes."
  tone="orange"
/>


## Image, texture, and video consolidation

- Replace dependencies on the removed `@loaders.gl/textures` and `@loaders.gl/video`
  packages with `@loaders.gl/images`; no compatibility packages are published.
- `ImageBitmapLoader` is now `ImageLoader` and always returns an `ImageBitmap`.
  The older environment-dependent loader is `LegacyImageLoader`, with
  `LegacyImageLoaderOptions`. `ImageLoaderOptions` describes the bitmap loader.
- Import metadata loaders from `@loaders.gl/images`. For direct implementations,
  import `*WithParser` exports from direct subpaths such as
  `@loaders.gl/images/basis-loader` or `@loaders.gl/images/image-loader`.
  Async core APIs continue to preload metadata loaders automatically. Sync parsing
  additionally requires an implementation with `parseSync`, such as
  `NPYLoaderWithParser` from `@loaders.gl/images/npy-loader`; image and Basis
  decoding remain asynchronous.
- Import texture writers and helper APIs from their direct subpaths, for example
  `@loaders.gl/images/ktx2-basis-writer` and `@loaders.gl/images/load-image`.
  Default texture worker and codec URLs now use the images package; update custom
  URLs and schema references that point at the removed textures package.
- Node image decoding and encoding through `@loaders.gl/core/polyfills` now require
  the optional `sharp` peer dependency. Install it explicitly (`npm install sharp`).
  Other polyfills and browser image decoding do not load or require Sharp.
  The optional `get-pixels`, `save-pixels`, and `ndarray` codec stack is removed.


## Upgrading to v5.0

Install the current owner packages and update format imports and worker asset URLs together. See the [Packages overview](./packages.md) for the supported package structure. The sections below describe removed or deprecated paths and their replacements.

### Geometry and scan utility packages move into core

The standalone `@loaders.gl/scan`, `@loaders.gl/arrow-geometry`, and `@loaders.gl/geoarrow` packages have been removed, without forwarding packages.

| Removed import | Replacement |
| --- | --- |
| `@loaders.gl/scan` | `@loaders.gl/core/scan` |
| `@loaders.gl/arrow-geometry` | `@loaders.gl/core/arrow-geometry` |
| `@loaders.gl/arrow-geometry/<utility>` | `@loaders.gl/core/arrow-geometry/<utility>` |
| `@loaders.gl/geoarrow` | `@loaders.gl/core/geoarrow` |
| `@loaders.gl/geoarrow/<utility>` | `@loaders.gl/core/geoarrow/<utility>` |
| `@loaders.gl/wkt/twkb` | `@loaders.gl/core/wkt/twkb` |
| `@loaders.gl/sql/arrow-query` | `@loaders.gl/core/scan/arrow-query` |
| `@loaders.gl/sql/table-query` | `@loaders.gl/core/scan/table-query` |
| `@loaders.gl/sql/sql-predicate` | `@loaders.gl/core/scan/sql-predicate` |
| `@loaders.gl/sql/sql-predicate-zod` | `@loaders.gl/core/scan/sql-predicate-zod` |

Remove the three deleted packages from dependencies and install `@loaders.gl/core`. Subpaths are imports, not separately installable packages. Format loaders and writers remain in `@loaders.gl/geospatial/wkt`; database adapters remain in `@loaders.gl/sql`.

### Table-format scan subpaths

The experimental `@loaders.gl/scan/iceberg`, `/delta`, and `/hudi` subpaths have been removed.
Import their source implementations from `@loaders.gl/tables/iceberg`,
`@loaders.gl/tables/delta`, and `@loaders.gl/tables/hudi`, respectively. `IcebergRestCatalog`
is also exported from `@loaders.gl/tables/iceberg`. The `@loaders.gl/core/scan` root continues
to provide the query engine and federation APIs without depending on `@loaders.gl/tables`.

### OGC service and STAC package imports

The standalone `@loaders.gl/wms` and `@loaders.gl/stac` packages are removed in v5. Install
`@loaders.gl/ogc` for OGC service protocols and STAC catalogs. Replace imports from
`@loaders.gl/wms` with `@loaders.gl/ogc/wms`, and imports from `@loaders.gl/stac` with
`@loaders.gl/ogc/stac`. Parser-bearing implementations remain on named subpaths, such as
`@loaders.gl/ogc/wms/gml-loader` and `@loaders.gl/ogc/stac/stac-source`.

`@loaders.gl/services` now contains provider authentication presets for Mapbox, Google Maps,
and Cesium ion. ArcGIS remains in `@loaders.gl/arcgis`. OGC loader IDs and option namespaces
remain unchanged; their `module` ownership and default package asset paths become `ogc`.

### Removed glTF rendering postprocessing

`@loaders.gl/scene/gltf` no longer exports `postProcessGLTF` or `GLTF*Postprocessed` types.
Import them from [`@luma.gl/gltf`](https://luma.gl/docs/api-reference/gltf/post-process-gltf)
in luma.gl v10 when preparing data for rendering. Pass the `GLTFLoader` result directly to the luma.gl function.
Keep `GLTFWithBuffers` and indexed JSON for loader-side processing, writing, and conversion;
use `getGLTFAccessorValue` and `GLTFIterator` to read resources without linking a second document.
`_getMemoryUsageGLTF` now accepts only the indexed `GLTFWithBuffers` container.

### 3D Tiles decoded glTF content

With `3d-tiles.loadGLTF: true`, `tile.gltf` now contains `GLTFWithBuffers` rather than a
postprocessed scene. Read metadata from `tile.gltf.json`. Scene, mesh, material, texture and accessor
references remain numeric indices. Read typed values with `getGLTFAccessorValue(tile.gltf, index)`
and replace transformed storage with `setGLTFAccessorValue`. Vector-content descriptors retain raw
primitive definitions. The tile converter consumes this indexed representation directly.

Luma.gl provides `postProcessGLTF` as an explicit application API. A renderer that requires linked
objects can call it at its rendering boundary. It is no longer called by the tile parsers.
See [glTF accessor helpers](./modules/scene/gltf/api-reference/gltf-accessors).

`GLTFScenegraph.getTypedArrayForAccessor()` now treats an omitted `bufferView` as implicit-zero
storage, including any sparse substitutions, as required by glTF. It no longer falls back to buffer
view 0. An explicit `bufferView: 0` continues to read the first buffer view.

### ArcGIS package extraction (v5)

ArcGIS exports have moved out of `@loaders.gl/services` into the `@loaders.gl/arcgis` package.
`SERVICE_LOADERS` and `getServiceLoader` are replaced by `ARCGIS_LOADERS` and `getArcGISLoader`.
No ArcGIS compatibility exports remain in services. Other providers’ credential helpers stay there.

The package root now exports lightweight service loaders for async `load()`. Synchronous
`createDataSource()` and direct source-class imports move to `@loaders.gl/arcgis/bundled`, using the
same export names. Credentials, discovery and aggregation helpers move to `/authentication`,
`/discovery` and `/scene-aggregation`, respectively, and remain available through `/bundled`.
Shared types remain at the root, including source instance types.
Explicit per-service subpaths export `*WithParser` loaders for synchronous construction.

#### ArcGIS single-response feature queries

`ArcGISVectorSource.getFeatures()` no longer returns a potentially truncated single response.
It retrieves a bounded complete query and throws when completeness cannot be established. Migrate
applications that intentionally consume partial data to `queryFeaturePage()` or inspect the
explicit `complete`/`reason` fields from `queryFeatures()` before displaying results. Spatial
GeoJSON output is restricted to EPSG:4326; use `requestCrs` for projected input bounds. See the
[query guide](/docs/developer-guide/arcgis/feature-layers) for the replacement contracts.

### Scientific format package consolidation (v5)

NetCDF and Zarr now share the public `@loaders.gl/scientific` package. Replace dependencies on `@loaders.gl/netcdf` or the previously private `@loaders.gl/zarr` package with `@loaders.gl/scientific`. Metadata loaders are exported from the package root; import implementation APIs from a format subpath:

```ts
import {NetCDFLoader, OMEZarrSourceLoader} from '@loaders.gl/scientific';
import {NetCDFLoaderWithParser} from '@loaders.gl/scientific/netcdf';
import {OMEZarrImageSource, loadZarr} from '@loaders.gl/scientific/zarr';
```

The NetCDF and Zarr documentation now lives under [the scientific module](/docs/modules/scientific). Zarr storage engines are installed as dependencies of the scientific package.

### Raster package consolidation

`@loaders.gl/geotiff`, `@loaders.gl/lerc`, and `@loaders.gl/terrain` have been removed.
Install `@loaders.gl/raster` and use its metadata-only root or explicit parser entry points.

| Removed import | Replacement |
| --- | --- |
| `@loaders.gl/geotiff` | `@loaders.gl/raster` for loader metadata; named `raster/geotiff/*` subpaths for source constructors and helpers |
| `@loaders.gl/lerc` | `@loaders.gl/raster` for metadata; `@loaders.gl/raster/lerc` for the parser |
| `@loaders.gl/terrain` | `@loaders.gl/raster` for metadata and writer; `@loaders.gl/raster/terrain` for advanced APIs |
| `@loaders.gl/terrain/heightmap` | `@loaders.gl/raster/terrain/heightmap` |

Direct parser filenames now use `*-loader` and metadata filenames use `*-loader-types`.
Replace `*-loader-with-parser` imports with their corresponding `@loaders.gl/raster/<format>/*-loader`.
Use `@loaders.gl/raster/quantized-mesh` for `QuantizedMeshLoaderWithParser`.
Worker URLs move to the raster package root; the LERC WASM export moves to `raster/lerc/lerc-wasm.wasm`.
Install optional peers `geotiff` or `lerc` explicitly when using their decoding backends.
GeoTIFF/OME-TIFF source metadata at the raster root needs asynchronous `load()`; import the explicit
source subpath when using synchronous `createDataSource()`.

### Point-cloud, scene and geometry package consolidation

The standalone `@loaders.gl/las`, `@loaders.gl/pcd`, `@loaders.gl/ply`, `@loaders.gl/obj`, `@loaders.gl/gltf`, and `@loaders.gl/wkt` packages are removed without forwarding packages.

| Removed package | Replacement format import |
| --- | --- |
| `@loaders.gl/las` | `@loaders.gl/pointclouds/las` |
| `@loaders.gl/pcd` | `@loaders.gl/pointclouds/pcd` |
| `@loaders.gl/ply` | `@loaders.gl/pointclouds/ply` |
| `@loaders.gl/obj` | `@loaders.gl/scene/obj` |
| `@loaders.gl/gltf` | `@loaders.gl/scene/gltf` |
| `@loaders.gl/wkt` | `@loaders.gl/geospatial/wkt`, `/wkb`, `/twkb` |

Install the owning package, not its subpath. Use parser-bearing loaders from named implementation subpaths such as `@loaders.gl/scene/gltf/gltf-loader` for synchronous parsing. PLY continues to support mesh faces. COPC and Potree stay in tiles-3d; geometry codec utilities stay in core/wkt. Rebuild custom workers and update worker/WASM asset paths to the new owners.

### Table and geospatial package consolidation

The standalone `@loaders.gl/arrow`, `avro`, `bson`, `csv`, `excel`, `json`, `lance`, `orc`, and `parquet` packages have been removed. Install `@loaders.gl/tables` and replace an import such as `@loaders.gl/csv` with `@loaders.gl/tables/csv` to retain the former root exports. The `@loaders.gl/tables` root and format subpaths export metadata loaders and writers; import `CSVLoaderWithParser` from `@loaders.gl/tables/csv/csv-loader` for synchronous parsing.

The standalone `@loaders.gl/flatgeobuf`, `geopackage`, `kml`, and `shapefile` packages have also been removed. Install `@loaders.gl/geospatial` and use matching format subpaths, such as `@loaders.gl/geospatial/kml`, for former package-root APIs. The group root and format subpaths export metadata loaders; import `KMLLoaderWithParser` from `@loaders.gl/geospatial/kml/kml-loader` for synchronous parsing. Other parser, source, writer, and worker entry points have corresponding explicit subpaths in the group packages. Update any hard-coded worker asset URLs to the group package paths.

**Schema packages move into core subpaths**

- Replace imports from `@loaders.gl/schema` with `@loaders.gl/core/schema`, and imports from `@loaders.gl/schema-utils` with `@loaders.gl/core/schema-utils`.
- Use `@loaders.gl/core/schema-utils/arrow-transport` for Arrow transport helpers and `@loaders.gl/core/schema/geospatial-metadata-zod-schema` for runtime metadata validation. The GeoParquet and GeoArrow JSON schema files are exported under `@loaders.gl/core/schema/`.
- Install `@loaders.gl/core` as the package. Published loaders use it as a peer dependency so applications can provide one compatible core version.

### math.gl package consolidation

math.gl alpha.19 removes the standalone leaf packages. Applications importing their APIs or types
alongside loaders.gl should install the grouped package and use the following public imports
for math.gl `5.0.0-beta.1`:

| Removed package | Replacement import |
| --- | --- |
| `@math.gl/types` | `@math.gl/core` |
| `@math.gl/culling` | `@math.gl/geometry/culling` |
| `@math.gl/geometry-utils` | `@math.gl/geometry` |
| `@math.gl/polygon` | `@math.gl/geometry` |
| `@math.gl/crs` | `@math.gl/geospatial/crs` |
| `@math.gl/projection` | `@math.gl/geospatial/projection` |
| `@math.gl/wkb` | `@math.gl/geospatial` |
| `@math.gl/geoarrow` | `@math.gl/geospatial/geoarrow` |
| `@math.gl/geoid` | `@math.gl/earth` |

Install the package name before the subpath, such as `@math.gl/geospatial`. Nested entry points move
with their parent API, for example `@math.gl/geospatial/projection/bulk`. TypeScript consumers need a
module resolver that reads package exports, such as `bundler`, `node16`, or `nodenext`.

The beta also removes several alpha subpaths. Replace `@math.gl/core/types` with `@math.gl/core`;
`@math.gl/geometry/polygon` and `@math.gl/geometry/utils` with `@math.gl/geometry`;
`@math.gl/geospatial/wkb`, `@math.gl/geospatial/ellipsoid`, and
`@math.gl/geospatial/tile-matrix` with `@math.gl/geospatial`; `@math.gl/dggs/s2` with
`@math.gl/dggs`; and `@math.gl/earth/geoid` with `@math.gl/earth`. Geoid grid assets remain
available under `@math.gl/earth/geoid/`.

### Core utility subpaths

The standalone `@loaders.gl/loader-utils` and `@loaders.gl/worker-utils` packages have moved to
`@loaders.gl/core/loader-utils` and `@loaders.gl/core/worker-utils`, respectively. Install
`@loaders.gl/core` and update imports to the corresponding subpath. Existing utility re-exports
from the `@loaders.gl/core` root remain available for compatibility; the full utility APIs live
at the subpaths.

Worker URLs previously pointing into `@loaders.gl/worker-utils` should use the matching
`@loaders.gl/core/worker-utils/null-worker.js` or `null-worker-node.js` subpath.

**Node polyfills**

The `@loaders.gl/polyfills` package has moved to the independent `@loaders.gl/core/polyfills` subpath. Install `@loaders.gl/core` and replace side-effect imports of the old package with `import '@loaders.gl/core/polyfills'`. The polyfills subpath does not load the core root entry point or another loaders.gl module. If an application configured file aliases through `@loaders.gl/loader-utils`, configure the polyfills path resolver separately with `setPathPrefix` and `addAliases` from `@loaders.gl/core/polyfills`.

### Tile package consolidation

The v5 tile packages are grouped by runtime dimension. Replace imports and
dependencies from the removed packages as follows:

| Removed package | New import prefix |
| --- | --- |
| `@loaders.gl/mlt` | `@loaders.gl/tiles/mlt` |
| `@loaders.gl/mvt` | `@loaders.gl/tiles/mvt` |
| `@loaders.gl/pmtiles` | `@loaders.gl/tiles/pmtiles` |
| `@loaders.gl/3d-tiles` | `@loaders.gl/tiles-3d/3d-tiles` |
| `@loaders.gl/i3s` | `@loaders.gl/tiles-3d/i3s` |

`Tileset3D`, `Tile3D`, 3D traversal and spatial helpers, and point-cloud tileset
APIs move from the `@loaders.gl/tiles` root to `@loaders.gl/tiles-3d`.
`Tileset2D`, `ImageSet`, and `RasterSet` remain at `@loaders.gl/tiles`.
Install the parent package (`@loaders.gl/tiles` or `@loaders.gl/tiles-3d`);
subpaths are import paths, not separate npm packages.


**OGC API Tiles matrix discovery**

`OGCAPITilesSource` now discovers matrix metadata for canonical `/{tileMatrix}` templates by default. Failed discovery rejects the request instead of silently substituting numeric zoom levels. Await `getMetadata()` before calling synchronous `getTileURL()`, or set `ogc-api.discoverTileMatrixSet: false` to retain the previous numeric-template behavior. Configured `tileMatrixSet` documents take precedence over discovery. See the [OGC API Tiles documentation](./modules/ogc/wms/services/ogc-api.md).

**@loaders.gl/zip package removal**

Install `@loaders.gl/archives` and replace `@loaders.gl/zip` imports with `@loaders.gl/archives/zip`. Direct parser access moves from `@loaders.gl/zip/zip-loader` to `@loaders.gl/archives/zip/zip-loader`. Import `TarBuilder` from `@loaders.gl/archives/tar`.

**ZIP archive API changes**

- Removed JSZip passthrough options. Replace `jszip.compression: 'STORE' | 'DEFLATE'` with
  `zip.compression: 'store' | 'deflate'` and use the typed native ZIP options. Writing now uses
  deterministic sorted paths, a fixed UTC timestamp and automatic ZIP64; exact legacy bytes are
  not preserved. `zip.onUpdate` reports start/completion only.
- Removed `/bundled` and `/unbundled`. Import metadata `ZipLoader` from the package root;
  direct parser access is `ZipLoaderWithParser` from `@loaders.gl/archives/zip/zip-loader`.
- `ZipLoader` returns ArrayBuffer values only and rejects invalid entries instead of placing
  errors in the map. Complete reads verify CRCs. The total decoded file-map default is 64 MiB;
  set `zip.maxTotalDecodedBytes` explicitly for larger maps. The independent per-entry limits
  `zip.maxDecodedBytes` and `zip.maxCompressedBytes` also default to 64 MiB; raise them explicitly
  when individual entries exceed those bounds, or use incremental archive reads.

- `ZipFileSystem.stat()` now returns validated `ZipEntry` metadata with numeric `size` and
  exact `uncompressedSize`. Replace raw-header fields such as `fileName` with `path`; header
  lengths and central-directory offsets are no longer exposed by this method.
- One-shot SLPK and 3TZ `parseFile()` extraction now closes the supplied file on success or
  failure. For repeated reads, use `parseSLPKArchive` or `parse3DTilesArchive` and close the
  returned archive after the final resource read.
- Raw ZIP header parsers/serializers, signature/search helpers, central-header iteration and ZIP
  file utilities are no longer root exports. Use `openZipArchive`, `ZipArchive.entries()`,
  `getEntryAt()` and the native encoders. Use `ArrayBufferFile`/`BlobFile` from
  `@loaders.gl/core/loader-utils` instead of the ZIP-exported `DataViewReadableFile`.
- Removed `ZIP_COMPRESSION_HANDLERS` and `CompressionHandler`. Use shared archive read methods
  instead of dispatching container compression in consumers. Complete generic filesystem
  responses now stream; consume the response body to observe integrity errors.

The sections below document the v5 removals, migrations, and deprecations that remain active.

### Module-worker decoder wrappers

Module workers no longer evaluate fetched classic JavaScript to install decoder globals.
Custom decoder URL overrides must provide ESM default factory exports (Draco also accepts named
factory exports). Built-in
Draco, Basis, and Crunch wrappers have generated `.mjs` adapters; custom CDNs must serve
these additional assets. Classic-worker `importScripts()` behavior is unchanged. See
[decoder library loading](/docs/modules/core/worker-utils#loading-decoder-libraries) for overrides
and content-security-policy limitations.

### Explicit reference compression backends

`@loaders.gl/compression` no longer automatically installs `brotli`, `fzstd`, `hysnappy`,
`lz4js`, `pako`, `snappyjs`, or `zstd-codec`. They are optional peer dependencies.
Default codecs continue to use native streams or the required `compress-utils` dependency.
Applications importing a backend-specific entry point must install its corresponding package
explicitly, for example `npm install pako` before importing `@loaders.gl/compression`.
Injectable Brotli and Zstandard implementations still require `modules` registration.
The deprecated `zstd-compression` asynchronous fallback needs an explicit `fzstd` installation;
prefer the default `ZstdDecompressor` if no reference backend is required.

### Alternate loader imports

Package roots expose the primary loader for each format. Alternate backend loaders
are available through implementation subpaths instead of root exports:

```typescript
import {LASCOPCLoaderWithParser} from '@loaders.gl/pointclouds/las/las-copc-loader';
import {LAZPerfLoaderWithParser} from '@loaders.gl/pointclouds/las/lazperf-loader';
import {LAZRsLoaderWithParser} from '@loaders.gl/pointclouds/las/laz-rs-loader';
import {ParquetJSLoaderWithParser} from '@loaders.gl/parquet/parquet-js-loader';
import {FastJSONLoader} from '@loaders.gl/json/fast-json-loader';
```

These replace the root exports `LASCOPCLoader`, `LAZPerfLoader`, `LAZRsLoader`,
`ParquetJSLoader`, and `_FastJSONLoader`. Implementation subpaths load the parser
eagerly and support direct parsing. Primary metadata loaders continue to preload
their implementations for asynchronous core APIs.

The explicit `@loaders.gl/arrow/types` facade exposes Apache Arrow names available
in the supported minimum release, Arrow 17. Import version-specific names such
as `Utf8View`, `BinaryView`, `LargeList`, compression helpers, and newer type
guards directly from your installed `apache-arrow` package.

### probe.gl imports

loaders.gl now uses `probe.gl@^5.0.0`. Applications that supply loggers or statistics
objects should replace the scoped v4 packages with `probe.gl` and import from its
subpaths:

```typescript
import {Log} from 'probe.gl/log';
import {Stats} from 'probe.gl/stats';
import {StatsWidget} from 'probe.gl/stats-widget';
```

### Graph loader output defaults

`GraphMLLoader` and `DOTLoader` now default to a `shape: 'tables'` collection with
named `nodes` and `edges` Arrow tables. Applications that consume `graph.nodes` and
`graph.edges`, including plain graph-layer integrations, must explicitly select
`{graphml: {shape: 'plain-graph-data'}}` or `{dot: {shape: 'plain-graph-data'}}`.

For Arrow output, read `graph.tables[0].table.data` and `graph.tables[1].table.data`
after checking the collection and table discriminators. Structural identifiers are
strings; GraphML `long` attributes become exact `bigint` values. See the
[graphs module](./modules/graphs/README.md) for schemas and object-row output.

**@loaders.gl/math**

- The temporary `@loaders.gl/math` package has been removed. Install `@math.gl/geometry`
  and update imports to `@math.gl/geometry` for GL constants, typed-array, geometry, color, and attribute-compression
  utilities.

**CRS and @loaders.gl/wkt**

- Replace `@math.gl/proj4` imports with `@math.gl/geospatial/projection` and `Proj4Projection` with
  `Projection`. Import `ReadonlyCRSDefinition` from `@math.gl/geospatial/crs` instead of the removed
  `Proj4CRSDefinition` type. loaders.gl now uses math.gl 5.0.0-alpha.19.

- Shared CRS definition types now come from `@math.gl/geospatial/crs`. Replace new uses of the deprecated
  `PROJ4CRS` alias with `PROJStringDefinition` and import `CRSIdentifier`, `CRSDefinition`, WKT,
  PROJ, and PROJJSON types directly from `@math.gl/geospatial/crs`.
- `WKTCRSLoader` now returns the discriminated, value-preserving `WKTCRSAst`. Code that indexed
  the v4 hybrid nested array/object must traverse `ast.root.values` and discriminate each value by
  its `type` field.
- `WKTCRSWriter` accepts `WKTCRSAst`. The legacy `raw:` value convention and `raw`, `sort`,
  `keywords`, and `debug` options have been removed. Numeric source lexemes and value order are
  always retained by the AST.
- GeoParquet `crs` is typed as PROJJSON or explicit `null`; omission still means the GeoParquet
  default `OGC:CRS84`. `crs_type` is not a GeoParquet member. Coordinate `epoch` remains separate.
- CRS metadata preservation does not reproject coordinates. See
  [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for current
  format support and the staged reprojection roadmap.
- Vector loader reprojection options now use `gis.targetCrs` consistently. The experimental
  `_targetCrs` spelling is not part of the v5 public contract. Service requests use `requestCrs`
  for the input bounding box and `crs` for returned feature coordinates.

**@loaders.gl/tiles**

- `Tileset3D.maximumMemoryUsage`, `maximumMemoryUsage`, and `memoryCacheOverflow` have been removed. Use `cacheBytes` and `maximumCacheOverflowBytes`, passing byte counts (for example, `256 * 1024 * 1024` for 256 MiB).
- The default 3D Tiles cache policy is now a 512 MiB base target plus 512 MiB of current-view overflow headroom, with memory-adjusted SSE enabled. To preserve the previous 32 MiB/1 MiB policy, configure both byte budgets explicitly and set `memoryAdjustedScreenSpaceError: false`.

See [Caching and memory](/docs/modules/tiles-3d/3d-tiles/concepts/caching-and-memory) for migration examples and runtime behavior.

**@loaders.gl/core**

- Sources no longer accept `core.loadOptions` or a top-level source `loadOptions` wrapper.
  Move nested `core` settings into the outer `core`, and parser namespaces to the root. Use
  `core.fetch`, `core.credentials`, and `core.worker` for source requests and internal parsers alike.
  Legacy unscoped settings inside the removed bag (such as `fetch`) must also move into `core`.
  This applies to `createDataSource`, `load` with a source loader, and direct source constructors.

```typescript
// Before
createDataSource(url, [PMTilesSourceLoader], {
  core: {loadOptions: {core: {worker: false}, mvt: {layerProperty: 'layer'}}},
  pmtiles: {shape: 'arrow-table'}
});

// v5
createDataSource(url, [PMTilesSourceLoader], {
  core: {worker: false},
  mvt: {layerProperty: 'layer'},
  pmtiles: {shape: 'arrow-table'}
});
```

When both the old outer and inner `core` had settings, merge them explicitly. Keep parser options
beside source namespaces, not inside them. The unused `mvt.loadOptions` declaration is also removed.
Explicit source settings (for example `pmtiles.shape`) still override parser settings.
`ImageSourceLayer` no longer forwards the inherited deck.gl `loadOptions` prop into sources.
Move those settings into `sourceOptions`, using the flat shape above. This matches
`Tile2DSourceLayer` and avoids two competing source-options entry points. The deck.gl property
itself and the separate `Tileset3D.loadOptions` API are not removed by this change.

- Deprecated top-level parser option aliases such as `fetch`, `worker`, and `shape` are still
  accepted by the current implementation. Migrate them to `core.fetch`, `core.worker`, and
  `core.shape`. These aliases are distinct from the removed source `loadOptions` wrappers above;
  their final v5 removal or retention decision is tracked in
  [the v5 release tracker](https://github.com/visgl/loaders.gl/issues/3316).
- `Source` has been replaced by `SourceLoader` for top-level runtime source factories.
- `load(url, SomeSourceLoader)` now returns the runtime `DataSource` instance created by that source loader instead of metadata or parsed payloads.
- `parse()` and `parseSync()` no longer accept source loaders. Use `load()` for source loaders and keep `parse()` for parser loaders.

**@loaders.gl/tiles/mlt**

 - `MLTLoader` and `MLTSourceLoader` now return an Arrow table with WKB-compatible GeoArrow geometry by
   default. Applications that expect the previous GeoJSON table default must set
   `mlt.shape: 'geojson-table'` explicitly. `binary-geometry` remains available as an explicit shape.

**@loaders.gl/tiles/mvt**

 - `MVTSourceLoader` now returns tiles in the Arrow-table shape by default, matching the source's
   columnar query path. Set `mvt.shape: 'geojson-table'` explicitly for object-row GeoJSON tiles.
 - The top-level `gis.format` compatibility alias has been removed. Use `mvt.shape` instead.

**@loaders.gl/json, @loaders.gl/traces, and @loaders.gl/wms**

- `NDGeoJSONLoader` now returns Arrow tables by default. Set `geojson.shape: 'object-row-table'`
  to keep complete GeoJSON features as object rows. Its loader ID is now `ndgeojson` rather than
  the ambiguous `ndjson`.
- `ChromeTraceLoader` now defaults to its existing native Apache Arrow `Table` output. Set
  `chromeTrace.shape: 'json'` (or the legacy top-level `shape: 'json'`) for the validated JSON
  container. Batched parsing defaults to native Arrow record batches.
- `GMLLoader` now defaults to a GeoArrow WKB table. Bare geometries become one-row tables.
  Set `gml.shape: 'geojson'` for the previous geometry/FeatureCollection/null result, including
  FeatureCollection batches. WFS source format selection is unchanged.

**@loaders.gl/draco, @loaders.gl/tiles-3d/potree, and @loaders.gl/raster/terrain**

 - `DracoLoader`, `PotreeBinLoader`, `TerrainLoader`, and `QuantizedMeshLoader` now return Mesh
   Arrow tables by default. Set the corresponding loader option to `shape: 'mesh'` to preserve
   the legacy Mesh object shape. Arrow results stay on the calling thread when worker execution
   would strip Arrow table methods.
 - `draco.decoderType` has been removed. Use `draco.backend: 'wasm' | 'javascript' | 'draco3d'`.

**COPC and Potree package consolidation**

- Replace imports from `@loaders.gl/copc` with `@loaders.gl/tiles-3d/copc`.
- Replace imports from `@loaders.gl/potree` with `@loaders.gl/tiles-3d/potree`.
- Install `@loaders.gl/tiles-3d` in place of the removed COPC and Potree packages.

**Removed GIS package**

- `@loaders.gl/gis` is removed in 5.0. Applications should replace it with
  `@loaders.gl/core/geoarrow` for conversion and processing. Use `GEOARROW_CONVERTERS`
  instead of `GIS_CONVERTERS`.
- Import geometry and metadata types from `@loaders.gl/core/schema`. Runtime validators
  use `@loaders.gl/core/schema/geospatial-metadata-zod-schema`; generated schemas use
  `@loaders.gl/core/schema/geoparquet.schema.json` and
  `@loaders.gl/core/schema/geoarrow-metadata.schema.json`.
- Use `convertGeojsonToBinaryFeatureCollection` and
  `convertBinaryFeatureCollectionToGeojson` from GeoArrow instead of the old
  `geojsonToBinary` and `binaryToGeojson` aliases. Existing binary layouts are unchanged;
  these conversions allocate and do not promise borrowed batch views.
- See the [complete replacement import map](./modules/core/geoarrow/gis-migration.md),
  including the lower-level loader helpers, direct math.gl codecs/CRS, and WKT's TWKB subpath.

**Removed compatibility aliases**

 - The nonfunctional `@loaders.gl/images` `loadImage()` placeholder has been removed. Use
   `load(url, ImageBitmapLoader)` or the texture helpers in `@loaders.gl/textures`.
 - `getMeshSize` is no longer exported from `@loaders.gl/core/schema`; import it from
   `@loaders.gl/core/schema-utils`. The `getMeshBoundingBox` root export is deprecated and retained
   temporarily for deck.gl 9.4 compatibility; migrate imports to `@loaders.gl/core/schema-utils`.
 - CRS forwarding exports (`PROJ4CRS`, `WKTCRS`, `parseWKTCRS`, and `encodeWKTCRS`) are no
   longer exported from `@loaders.gl/gis`; import the canonical definitions and helpers from
   `@math.gl/geospatial/crs`.
 - The parent-level `shapefile.workerUrl` option has been removed. Configure `shp.workerUrl`
   and `dbf.workerUrl` independently.
 - The PMTiles `tileRangeRequest` alias has been removed. Use `rangeRequests`.
 - Generic image-source requests no longer accept `bbox`; pass `boundingBox` as two coordinate
   pairs. Protocol-specific `bbox` request parameters remain unchanged.

**@loaders.gl/tiles/pmtiles**

 - PMTiles v3 archives with MapLibre Tile (MLT) payloads are supported through `@loaders.gl/tiles/mlt`.
 - The `pmtiles.shape: 'columnar-table'` option remains supported for MVT archives only. Passing it
   for an MLT archive now throws; use `geojson-table`, `binary-geometry`, or `arrow-table` instead.

- Synchronous `encodeI3SMeshLayer()` now requires `await preloadI3SMeshCompression()` once before
  encoding resources. The async Draco encoder and tile-converter pipeline initialize automatically.
- Direct synchronous RAD chunk helpers require `await preloadRADCompression()` from the
  `@loaders.gl/splats/rad-loader` subpath. RADSource read/query methods initialize automatically.

**@loaders.gl/compression**

- Default codec implementations now use compress-utils 0.9.0 instead of JavaScript fallbacks.
  Direct default subpaths require `await codec.preload()` before sync calls; async calls preload
  automatically. Native-only implementations remain async. Explicit JavaScript backend subpaths
  remain available for callers that require them.
  Configure default encoder levels with `compressUtils.level`, replacing `gzip.level` and
  `deflate.level`. Injected legacy Brotli/zstd-codec modules no longer override the default
  backend; select their explicit implementation subpaths instead.


- The compression package root now exports lightweight, library-neutral classes such as
  `GZipCompressor`, `GZipDecompressor`, and `ZstdDecompressor`. Their async methods prefer built-in
  codecs and dynamically import a fallback only when necessary. `preload()` returns the selected
  concrete implementation. Import direct `FORMAT-DIRECTION` or implementation-specific
  `FORMAT-DIRECTION-IMPLEMENTATION` subpaths only to prebundle or pin a backend.
- Removed deprecated root exports: `Compression`, `DeflateCompression`, `GZipCompression`,
  `NoCompression`, `CompressionMetadata`, and the `*Compression` metadata aliases such as
  `gzipCompression`. Use `Compressor`/`Decompressor` and the direction-specific root classes.
  Combined implementation subpaths remain available for migration. Root imports no longer
  statically include the DEFLATE/GZIP JavaScript fallback.

  | Deprecated combined import | Preferred root classes |
  | --- | --- |
  | `no-compression` | `NoCompressor`, `NoDecompressor` |
  | `gzip-fflate`, `gzip-pako` | `GZipCompressor`, `GZipDecompressor` |
  | `deflate-fflate`, `deflate-pako` | `DeflateCompressor`, `DeflateDecompressor` |
  | `FORMAT-compress-utils` | `FormatCompressor`, `FormatDecompressor` |
- Full bzip2 and XZ compression and incremental operation are available through the new
  direction-specific `bzip2-*-compress-utils` and `xz-*-compress-utils` implementations. The
  deprecated combined classes remain available for compatibility.
- DEFLATE and GZIP now prefer native runtime streams and use `fflate` as the compact fallback instead of Pako. Compressed bytes are format-compatible, but compression output is not guaranteed to be byte-for-byte identical across runtimes.
- Async Brotli decompression remains available without application changes: it tries native support first and lazily loads the bundled fallback decoder when needed. Applications that call `BrotliCompression.decompressSync()` must first `await compression.preload()` or inject `modules.brotli`.
- Snappy synchronous methods no longer initialize the optional `snappyjs` dependency implicitly. Call `await compression.preload()` before `compressSync()` or `decompressSync()`, or inject `modules: {snappyjs}`. Async methods preload it automatically.
- `BrotliCompression`, `ZstdCompression`, and frame-based `LZ4Compression` may load larger codec implementations asynchronously. Prefer their async APIs; synchronous callers must explicitly preload or inject the required codec.
- `transformBatches()` remains available for compatibility but is deprecated. Use `compressBatches()` or `decompressBatches()` for new code.

**@loaders.gl/core/loader-utils, @loaders.gl/core, and source modules**

If you are upgrading from the 4.4 release line, migrate top-level source factories and types as follows:

| v4.4 | v5.0 |
| --- | --- |
| `Source` | `SourceLoader` |
| `WMSSource` | `WMSSourceLoader` |
| `WFSSource` | `WFSSourceLoader` |
| `MVTSource` | `MVTSourceLoader` |
| `MLTSource` | `MLTSourceLoader` |
| `PMTilesSource` | `PMTilesSourceLoader` |
| `COPCSource` | `COPCSourceLoader` |
| `PotreeSource` | `PotreeSourceLoader` |
| `TableTileSource` | `TableTileSourceLoader` |
| `FlatGeobufSource` | `FlatGeobufSourceLoader` |
| `GeoTIFFSource` | `GeoTIFFSourceLoader` |
| `OMETiffSource` | `OMETiffSourceLoader` |

Concrete runtime classes are unchanged. For example:

- `WMSSourceLoader` still creates `WMSImageSource`
- `MVTSourceLoader` still creates `MVTTileSource`
- `PMTilesSourceLoader` still creates `PMTilesTileSource`
- `TableTileSourceLoader` still creates `TableVectorTileSource`

The old top-level `*Source` aliases have been removed, so imports must be updated explicitly.

### Source capability interfaces

`ImageSource`, `VectorSource`, and `RasterSource` are now type-only capability interfaces, matching
the existing tile, catalog, and scan source contracts. `DataSource` remains the implementation base
class. The obsolete `type` and `testURL` statics were removed from the capability contracts;
runtime source selection continues to use the corresponding fields on `SourceLoader`.

Custom sources that extended one of the old abstract classes should instead extend `DataSource`
and implement one or more capability interfaces:

```ts
import {DataSource} from '@loaders.gl/core/loader-utils';
import type {
  DataSourceOptions,
  GetImageParameters,
  ImageSource,
  ImageSourceMetadata,
  ImageType
} from '@loaders.gl/core/loader-utils';

class CustomImageSource
  extends DataSource<string, DataSourceOptions>
  implements ImageSource
{
  async getMetadata(): Promise<ImageSourceMetadata> {
    throw new Error('Return normalized image-source metadata.');
  }

  async getImage(parameters: GetImageParameters): Promise<ImageType> {
    throw new Error('Load the requested image.');
  }
}
```

Import these contracts with `import type`; they are no longer runtime constructor values. Concrete
source classes and operational methods such as `getMetadata()`, `getImage()`, `getRaster()`, and
`getFeatures()` are unchanged. `@loaders.gl/wms` temporarily retains a deprecated structural
`ImageSource` runtime guard for deck.gl 9.x compatibility; it is not a constructor or base class.

### Arrow loader and writer variant removal

Redundant Arrow-specific loader and writer variants have been removed where the primary loader or writer already supports Arrow table data.

| Removed API | Replacement |
| --- | --- |
| `ExcelArrowLoader` | `ExcelLoader` with `excel.shape: 'arrow-table'` |
| `LASArrowLoader` | `LASLoader` with `las.shape: 'arrow-table'` |
| `NDJSONArrowLoader` | `NDJSONLoader` with `ndjson.shape: 'arrow-table'` |
| `KMLArrowLoader` | `KMLLoader` with `kml.shape: 'arrow-table'` |
| `GPXArrowLoader` | `GPXLoader` with `gpx.shape: 'arrow-table'` |
| `TCXArrowLoader` | `TCXLoader` with `tcx.shape: 'arrow-table'` |
| `DracoArrowLoader` | `DracoLoader` with `draco.shape: 'arrow-table'` |
| `TerrainArrowLoader` | `TerrainLoader` with `terrain.shape: 'arrow-table'` |
| `QuantizedMeshArrowLoader` | `QuantizedMeshLoader` with `quantized-mesh.shape: 'arrow-table'` |
| `GeoPackageArrowLoader(tableName?)` | `GeoPackageLoader` with `geopackage.shape: 'arrow-table'` and optional `geopackage.table` |
| `ParquetArrowLoader` | `ParquetLoader` with `parquet.shape: 'arrow-table'` |
| `ParquetArrowWorkerLoader` | `ParquetLoader` with `parquet.shape: 'arrow-table'` |
| `ParquetArrowWriter` | `ParquetWriter` |
| `ShapefileArrowLoader` | `ShapefileLoader` with `shapefile.shape: 'arrow-table'` |

For example:

```ts
import {load, encode} from '@loaders.gl/core';
import {ExcelLoader} from '@loaders.gl/excel';
import {ParquetLoader, ParquetWriter} from '@loaders.gl/parquet';

const excelArrowTable = await load(excelUrl, ExcelLoader, {
  excel: {shape: 'arrow-table'}
});

const parquetArrowTable = await load(parquetUrl, ParquetLoader, {
  parquet: {shape: 'arrow-table'}
});

const parquetBuffer = await encode(parquetArrowTable, ParquetWriter);
```

### LAS point skipping option removal

`LASLoader` no longer supports `options.las.skip`. LAS loaders now return all points. Applications that need sampled point clouds should downsample the parsed mesh/table after loading, or use COPC/source-level filtering when working with large datasets.

`LASLoader` no longer supports `options.las.backend`. It now uses the pure TypeScript implementation. Import `LAZPerfLoader`, `LASCOPCLoader`, or `LAZRsLoader` explicitly when a compatibility loader is required.

`COPCSourceLoader` no longer supports `options.copc.decoder`. COPC headers, hierarchy pages, node ranges, and PDRF 6-8 LAZ chunks are now read by the native TypeScript implementation.

### SourceLoader migration examples

Before, in 4.4:

```ts
import type {Source} from '@loaders.gl/core/loader-utils';
import {createDataSource, load} from '@loaders.gl/core';
import {WMSSource} from '@loaders.gl/wms';
import {PMTilesSource} from '@loaders.gl/pmtiles';

const sources: Source[] = [WMSSource, PMTilesSource];
const wmsSource = createDataSource(url, [WMSSource], options);
const loaded = await load(url, WMSSource);
```

Now, in v5:

```ts
import type {SourceLoader} from '@loaders.gl/core/loader-utils';
import {createDataSource, load} from '@loaders.gl/core';
import {WMSSourceLoader} from '@loaders.gl/wms';
import {PMTilesSourceLoader} from '@loaders.gl/tiles/pmtiles';

const sources: SourceLoader[] = [WMSSourceLoader, PMTilesSourceLoader];
const wmsSource = createDataSource(url, [WMSSourceLoader], options);
const loaded = await load(url, WMSSourceLoader); // WMSImageSource
```

This unifies top-level loading behavior:

- parser loaders still return parsed data
- source loaders now return runtime source objects
- metadata remains available from the returned runtime object, typically via `await source.getMetadata()`

**@loaders.gl/parquet**

- `ParquetJSONLoader` and `ParquetJSONWriter` compatibility aliases have been removed. Use `ParquetLoader`, `ParquetWriter`, `ParquetJSLoader`, or `ParquetJSWriter` instead depending on the backend you want.
- `ParquetLoader` and `ParquetWriter` remain the canonical wasm-backed APIs. The experimental parquetjs backend now lives behind the explicit `ParquetJSLoader` and `ParquetJSWriter` exports.
- `parquet.backend` and the deprecated `parquet.implementation` options have been removed. Import `ParquetLoader` for WASM or `ParquetJSLoader` for the TypeScript parquetjs implementation.
- Unannotated Parquet `INT64` values now remain exact: Arrow output uses Arrow `Int64`, and object-row output uses JavaScript `bigint`. `ParquetJSWriter` accepts `bigint` and rejects unsafe `number` inputs for these fields rather than silently rounding them. Convert to `number` explicitly only when values are known to remain within JavaScript's safe integer range.

**@loaders.gl/images**

- The nonfunctional `loadImage()` placeholder export has been removed. Use the texture helpers in
  `@loaders.gl/textures` or `load(url, ImageBitmapLoader)`.

- ImageLoader now only returns ImageBitmap (never Image or data), with a polyfill under Node.js. There is a function to extract data from an ImageBitmap?

**@loaders.gl/json**

- The underscored GeoJSON exports have been removed. Replace `_GeoJSONLoader`, `_GeoJSONWorkerLoader`, and `_GeoJSONWriter` with `GeoJSONLoader`, `GeoJSONWorkerLoader`, and `GeoJSONWriter`.
- `GeoJSONLoader` now returns a GeoArrow-compatible Arrow table by default. Set `options.geojson.shape: 'geojson-table'` for the previous object-row feature table, or use `'binary-feature-collection'` for deck.gl-style binary features.
- `JSONLoader` remains the arbitrary JSON document loader. Use `JSONTableLoader` for table-only JSON workflows and for `json.shape: 'arrow-table'`.
- `JSONTableLoader` and `NDJSONLoader` no longer perform GeoJSON-specific Arrow conversion. Use `GeoJSONLoader` with `geojson.shape: 'arrow-table'` when GeoJSON features should become property columns plus a GeoArrow WKB `geometry` column.
- `JSONTableLoader` and `NDJSONLoader` support strict schema-aware Arrow conversion through `json.schema`, `ndjson.schema`, `json.arrowConversion`, and `ndjson.arrowConversion`. These options require `shape: 'arrow-table'`.

**@loaders.gl/pointclouds/ply, @loaders.gl/splats, and @loaders.gl/deck-layers**

- `PLYLoader` now returns a Mesh Arrow table by default. Set `ply.shape: 'mesh'` for the legacy Mesh object. `SPLATLoader` / `KSPLATLoader` also consume the Mesh Arrow path.
- `SplatLayer`'s WebGPU path is experimental. It supports GPU projection, culling, binning, tile sorting, and oriented covariance rendering, but WebGPU picking is disabled in this initial implementation.
- The CPU/WebGL fallback remains circular-billboard based. Applications that need the oriented Gaussian renderer should request `renderMode: 'gpu'` and handle the clear error raised when the current deck.gl device is not WebGPU.

**@loaders.gl/textures**

- `BasisLoader` now uses the v2.50 transcoder for both `.basis` and KTX2 data. Remove
  `basis.module`; decoder selection is automatic. `modules.basis` must provide both `BasisFile` and
  `KTX2File` when KTX2 decoding is required.
- Replace the removed `bc7-m5` and `bc7-m6-opaque-only` Basis targets with `bc7`.
- `KTX2BasisWriter` replaces `encodeUASTC`, `qualityLevel`, and `useSRGB` with `format`, `quality`,
  `effort`, and `contentType`. For example, `{encodeUASTC: true, useSRGB: true}` becomes
  `{format: 'uastc-ldr-4x4', contentType: 'srgb'}`.
- `@loaders.gl/textures` no longer depends on the deprecated `texture-compressor` package, which pulled in vulnerable versions of `image-size`. The package was only ever used as a command line tool by the experimental `CompressedTextureWriter`, and was installed for every consumer whether or not that writer was used.
- Applications that use `CompressedTextureWriter` must now install the package themselves, for example with `npm install --save-dev texture-compressor`. It is resolved as an optional peer dependency and called directly, without invoking `npx` or accessing the npm registry. If it cannot be resolved locally, `encodeURLtoURL()` rejects. All other `@loaders.gl/textures` loaders and writers are unaffected.

**@loaders.gl/tiles**

- `Tileset3D` now requires a `Tile3DSource` and can no longer be instantiated with a JSON payload.

## Upgrading to v4.5

v4.5 is additive. Existing loaders and defaults continue to work unchanged, except for the explicit installation requirement for the experimental texture writer noted below.

**@loaders.gl/splats**

- SPZ decoding requires an application-provided `zstd-codec` module passed through `options.modules`. RAD gzip chunks are decompressed internally and do not require `zstd-codec`.

**@loaders.gl/textures**

- `@loaders.gl/textures` no longer installs the deprecated `texture-compressor` package for every consumer. Applications that use the experimental `CompressedTextureWriter` must install `texture-compressor` explicitly. The CLI is invoked with `npx --no`, so it is never downloaded on demand; all other loaders and writers are unaffected.

## Upgrading to v4.4

**@loaders.gl/textures**

- `TextureLevel` now exposes `shape`, `format`, and `textureFormat`. Use `format` for WebGL APIs and `textureFormat` for WebGPU-style or luma.gl APIs.
- `BasisLoader` uses `basis.supportedTextureFormats` to control `'auto'` basis format selection, and can accept explicit `basis.format` targets.
- `@loaders.gl/textures` no longer exports `selectSupportedBasisFormat` or `getSupportedGPUTextureFormats`. Pass `basis.supportedTextureFormats` to `BasisLoader` instead of using exported auto-detection helpers.
- `BasisLoader`, `CrunchLoader`, and `CompressedTextureLoader` no longer support `libraryPath`. Supply runtime libraries through `options.modules` instead.

| Deprecated helper         | Replacement                     |
| ------------------------- | ------------------------------- |
| `loadImageTexture()`      | `load(url, TextureLoader)`      |
| `loadImageTextureArray()` | `load(url, TextureArrayLoader)` |
| `loadImageTextureCube()`  | `load(url, TextureCubeLoader)`  |

**@loaders.gl/draco**

- `DracoLoader` no longer supports `draco.libraryPath`. Supply `modules: {draco3d}` instead of configuring decoder library paths manually.

**@loaders.gl/compression**

- `LZOCompression` was removed due to maintenance and licensing concerns with the underlying `lzo-wasm` library.

**@loaders.gl/parquet**

- `@loaders.gl/parquet/buffer`, `BufferPolyfill`, and `installBufferPolyfill()` were removed. The JavaScript Parquet parser and writer now use `Uint8Array` internally instead of installing a global `Buffer`.
- `ParquetLoader` and the experimental parquetjs APIs now return unannotated Parquet `BYTE_ARRAY` and `FIXED_LEN_BYTE_ARRAY` values as `Uint8Array` instead of `Buffer`. Logical values such as `UTF8` and `JSON` are still decoded to JavaScript strings/objects according to the Parquet schema.
- `ParquetLoader` and `ParquetWriter` are now wasm-only. Use `ParquetJSLoader` and `ParquetJSWriter` for the experimental parquetjs plain-row/plain-table backend.

## Upgrading to v4.3

**Minor Breaking Changes**

- `loaders.gl/core` - Improved loader type inference: `load()`, `parse()`, etc now infer correct option and return types even when an array of loaders is passed. This can lead to previously undetected type errors now being reported and breaking your build, requiring you to fix the errors.
- `loaders.gl/core` - internal tile index in `Source` classes has changed from `tileIndex.zoom` to `tileIndex.z`. Should not impact most applications.
- `@loaders.gl/core/loader-utils` - Deprecated `FileProvider` classes have been removed from the main entrypoint; use `HttpFile`, `BlobFile`, `NodeFile`, or `ArrayBufferFile` to provide `ReadableFile` access instead.
- `@loaders.gl/zip`/`@loaders.gl/tiles-3d/i3s` - Archive parsing helpers expect `ReadableFile` inputs rather than custom provider classes.

**Deprecations**

- `loaders.gl/core` - `registerLoaders()` is deprecated. Loader registration erases types and it is preferable that applications manage loader registration themselves if needed.
- `loaders.gl/core` - Loader-wide options such as `fetch`, `worker`, `nothrow`, batching limits, etc. now live under `options.core`. The legacy top-level options continue to work (with warnings) for backwards compatibility.

**Recommendations**

- For improved type checks, make sure you do not erase types of arrays of Loader objects: Replace `const loaders: Loader[] = [CSVLoader, JSONLoader];` with `const loaders = [CSVLoader, JSONLoader] as const satisfies Loader[];` or `const loaders: Loader[] = [CSVLoader, JSONLoader] as const;`.

## Upgrading to v4.2

**Recommendations**

- For improved type checks, it is now possible to add `dataType` and `batchType` fields to any custom loader objects.

## Upgrading to v4.1

**Breaking Changes**

- `@loaders.gl/geospatial/wkt`- `WKBLoader`/`TWKBLoader`/`HexWKBLoader` - The default `shape` is now `geojson-geometry` rather than `binary-geometry`. If you were relying on `binary-geometry`, just add a `shape: 'binary-geometry'` option, as in `load(..., WKBLoader, {wkb: {shape: 'binary-geometry}})`.

**Deprecations**

- `@loaders.gl/geospatial/wkt`- The `geometry` shape is deprecated, and now called `geojson-geometry`.

## Upgrading to v4.0

**Node.js v18+**

When using loaders.gl on Node.js your application should import the `@loaders.gl/core/polyfills` module before calling any loaders.gl functions.

**Typed Loaders**

Loaders now return typed data. This addition of types into previously untyped code can generate type errors in existing applications. These type errors can just be a result of the typescript compiler making sure your application knows what it is doing, but they can also mean that you have been making wrong or unsafe assumptions about what is being returned from the loader in question. We recommend you review the errors rather than just defeat them with comments as some may be valid and should be fixed in the application.

**Shape of Returned Data**

Some loaders can return multiple formats, often controlled with the loader options `shape` parameter. Note that many returned data types now also include a `shape` field which contains a string value that specifies the shape of the data. This goal is that this should result in a "discriminated union". Switching on the `returnedData.shape` field will then allow typescript to correctly determine which type of data was returned.

**Apache Arrow JS**

loaders.gl now imports `apache-arrow` v13 which is a major upgrade but Apache Arrow JS v9 introduces breaking changes (compared with Apache Arrow v4 which is used by loaders.gl v3.x\_).

- `@loaders.gl/deck-layers` - `TileSourceLayer` now accepts the tile source only via `data`. The redundant `tileSource` prop has been removed.

If your application is using the Apache Arrow API directly to work with Apache Arrow tables returned from loaders.gl, note that the Apache Arrow v9 API contains a number of breaking changes.

On the upside, the new Apache Arrow API is more modular and "tree shakeable" (meaning that only the Apache Arrow functionality your application is actually using is included in your application bundle).

Since Apache Arrow JS does not yet come with upgrade notes, you can refer to the [loaders.gl Arrow documentation](/docs/arrowjs/upgrade-guide).

**Table Schemas**

If you are referencing table schemas returned by loaders, they will no longer be Apache Arrow schemas, but instead equivalent "serialized" lower-overhead loaders.gl schemas. You can recover Arrow schemas as follows

```typescript
import {deserializeArrowSchema} from '@loaders.gl/arrow';
const table = load(url, ParquetLoader);
const arrowSchema = deserializeArrowSchema(table.schema);
```

**Polyfills**

If you were relying on `@loaders.gl/core/polyfills` module to install a global `fetch()` function under Node.js that supported fetching from local files, loaders.gl v4 uses the built-in fetch in Node.js v18+ (which doesn't support fetching from local files), so to fetch from local files, you now need to use `fetchFile()` instead.

```typescript
import {fetchFile} from '@loaders.gl/core';
const response = await fetchFile('/path/to/local/file');
...
```

Note that `fetchFile` is called by all core `load()` functions unless the fetch function is overridden through
loader options.

Details: The expectation is that loaders.gl v4.0+ will be used with Node.js version 18 and higher,
which now provide a built-in browser-compatible `fetch()` function by default.
This new built-in Node.js `fetch` function does not support reading from the file system,
and loaders.gl v4.0 aligns with this practice.

---

Loader module changes, in order of estimated impact to applications:

**@loaders.gl/images**

- `loadImage()` has moved to `loaders.gl/textures`.

**@loaders.gl/gltf**

- `GLTFLoader` - no longer post processes data. Applications need to import and call the `postProcessGLTF` function after calling the loader to get the same result.

**@loaders.gl/crypto**

- All hashes now require an encoding parameter. To get previous behavior, just specify `.hash...(..., 'base64')`.

**@loaders.gl/arrow**

- Batches now contain a Table with a single `RecordBatch` (instead of just a `RecordBatch`).

**@loaders.gl/geopackage**

- `options.geopackage.shape` replaces all other format specification options, such as `options.gis.format`
- `options.geopackage.shape: 'tables'` - The default data format returned is now `tables` which returns the type `Tables<ObjectRowTable>`, where the `data` of each table is an array of GeoJSON features. (The `Tables` and `ObjectRowTable` types are exported from `@loaders.gl/core/schema`.) You can use `options.geopackage.shape: 'geojson-table'`.

**@loaders.gl/kml**

- `options.kml.shape` replaces all other mechanisms for specifying format of returned data (`.format` etc), and aligns with the `geojson-table` table shape as this is compatible with a GeoJSON `FeatureCollection`.
- `options.gpx.shape` applies the same changes as `options.kml.shape`.
- `options.tcx.shape` applies the same changes as `options.kml.shape`.
- `options.gpx.shape: 'binary'` and `options.tcx.shape: 'binary'` have been removed. Use `shape: 'binary-geometry'` instead.

**@loaders.gl/tiles/mvt, @loaders.gl/tiles/mlt, @loaders.gl/flatgeobuf**

- Geospatial loader shapes now use `geojson-table` for GeoJSON feature table output and `binary-geometry` for binary geometry output.
- The old `geojson` shape has been removed from `MVTLoader` and `MLTLoader`. Use `geojson-table` instead.
- The old `binary` shape has been removed from `MVTLoader`, `MLTLoader`, and `FlatGeobufLoader`. Use `binary-geometry` instead.
- `MVTLoader` and `MLTLoader` now default to `geojson-table`.

## Upgrading to v3.4

**@loaders.gl/wms**

This module is still marked as experimental and had some breaking changes.

- `WMSService` class
  - The `srs` parameters has been renamed to `crs` in alignment with the most recent WMS 1.3.0 conventions.
- `WMSCapabilities` type (returned by `WMSService` and `WMSCapabilitiesLoader`)
  - `WMSCapabilities.layer` is now `WMSCapabilities.layers`
  - `WMSCapabilities.boundingBox` is now `WMSCapabilities.geographicBoundingBox` (in generic lng/lats) and `WMSCapabilities.boundingBoxes` (array of bounding boxes in supported projections)

## Upgrading to v3.2

**@loaders.gl/geopackage**

- The default data format returned is now `options.gis.format: 'tables'`, which returns the type `Tables<ObjectRowTable>`, where the `data` of each table is an array of GeoJSON features. (The `Tables` and `ObjectRowTable` types are exported from `@loaders.gl/core/schema`.) You can use `options.gis.format: 'geojson'` to return an object mapping table names to an array of GeoJSON features.

## Upgrading to v3.0

**Platform Support Updates**

- Node.js 10 is no longer supported (LTS maintenance of Node.js 10 ended in May 2021).
- The `module` entry point in the published module is no longer transpiled to ES5 as modern JavaScript is supported now support recent evergreen browsers resulting bundle size reduction and better performance. The `main` entry point is still fully transpiled to `es5`, you can select this entry point using e.g. the `mainField` option in webpack.

**Worker Concurrency**

Default number of worker threads for each loader has been reduced from `5` to `3` on non-mobile devices and to `1` on mobile devices to reduce memory use. Generally, increasing the number of workers has diminishing returns.

**@loaders.gl/core**

- Passing `fetch` options (such as `headers`) to `load()` and `parse()` etc. should now be done via the `options.fetch` options object (e.g. `options.fetch.headers`). Specifying `fetch` options on the root options object was deprecated in v2.3 and is no longer supported in v3.0.

**@loaders.gl/compression**

- The `Transform` API in v2.3 has been replaced with `Compression` classes that handle both compression and decompression. Please refer to the documentation.

**@loaders.gl/crypto**

- The `Transform` API in v2.3 has been replaced with `Hash` classes that handle both compression and decompression. Please refer to the documentation.

**@loaders.gl/csv**

- The format of parsed data (i.e. whether table rows are objects or arrays) is now controlled by `options.csv.shape` instead of being dynamically selected based on whether the CSV file has a header row. The default `shape` is now `object-row-table`. Default column names are generated if no header row is present. This is a breaking change when loading CSV files without header rows.
- Duplicate column names will have a counter suffix added to ensure that they are unique. In rare cases this could be a breaking change.

**@loaders.gl/gltf**

- `GLTFScenegraph` is updated to provide modifying capabilities. Signatures of some methods have been changed to use named parameters (rather than positional parameters).
- The deprecated `GLBBuilder` class and `encodeGLTFSync` functions have now been removed.

**@loaders.gl/basis**

- Module has been moved to `@loaders.gl/textures`.

**@loaders.gl/images**

- The texture API `loadImage`, `loadImageArray`, `loadImageCube` has been moved to the new `@loaders.gl/textures` module, and have been renamed to `loadImageTexture*`.
- The binary image API has been consolidated in a single function `getBinaryImageMetadata()`:
- A number of previously deprecated exports have been removed:

| Export                                 | Replacement                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `isBinaryImage(arrayBuffer)`           | `Boolean(getBinaryImageMetadata(arrayBuffer))`                              |
| `getBinaryImageMIMEType(arrayBuffer)`  | `getBinaryImageMetadata(arrayBuffer)?.mimeType`                             |
| `getBinaryImageSize(arrayBuffer)`      | `getBinaryImageMetadata(arrayBuffer)?.{width, height}`                      |
| `HTMLImageLoader`                      | No direct replacement. `ImageLoader` now returns `ImageBitmap` in browsers. |
| `getDefaultImageType()`                | N/A                                                                         |
| `getSupportedImageType(imageType?)` | N/A |

**@loaders.gl/kml**

- The `KMLLoader`, `GPXLoader`, and `TCXLoader` now require a value for `options.gis.format`. Previously, the lack of a value would return data in "raw" format, i.e. not normalized to GeoJSON. To return GeoJSON-formatted data, use `options.gis.format: 'geojson'`. Other options are `binary` and `raw`.
- The `kml.normalize` option has been deprecated. When `options.gis.format` is `geojson`, coordinates will always be in longitude-latitude ordering.

**@loaders.gl/core/loader-utils**

- `createWorker()` now creates a generic worker. For loader workers use the new `createLoaderWorker()` function.

**@loaders.gl/tiles-3d-loader**

- Added `featureIds` attribute to i3s tile content. It is an array of feature ids which specify which feature each vertex belongs to. Can be used for picking functionality.

**@loaders.gl/tables**

- The (undocumented) `@loaders.gl/tables` module has been renamed to `@loaders.gl/core/schema`.

## Upgrading to v2.3

`@loaders.gl/core`:

- `selectLoader()` is now async and returns a `Promise` that resolves to a loader.
- `selectLoaderSync()` is available for situations when calling an async function is inconvenient.
- Passing `fetch` options to `load()` and `parse()` etc. should now be done via the `options.fetch` sub-options object. fetch options on the root object are now deprecated.

`@loaders.gl/kml`:

- The `KMLAsGeoJsonLoader` has been removed, use `KMLLoader`, with `options.gis.format: 'geojson'`.

## Upgrading to v2.2

**`@loaders.gl/core`**

- `selectLoader` is no longer experimental. If you were using the experimental export, replace `_selectLoader` with `selectLoader`. Also note that argument order has changed and now aligns with `load` and `parse`
- `parseInBatchesSync` has been removed, all batched parsing is now performed asynchronously.

Some iterator utilities that are mostly used internally have been changed.

| Function                    | Replacement / Status                  |
| --------------------------- | ------------------------------------- |
| `makeChunkIterator`         | combined into `makeIterator`          |
| `makeStreamIterator`        | combined into `makeIterator`          |
| `textDecoderAsyncIterator`  | `makeTextDecoderIterator`             |
| `lineAsyncIterator`         | `makeLineIterator`                    |
| `numberedLineAsyncIterator` | `makeNumberedLineIterator`            |
| `getStreamIterator`         | Deprecated in 2.1, now removed in 2.2 |
| `contatenateAsyncIterator`  | Deprecated in 2.1, now removed in 2.2 |

**`@loaders.gl/csv`**

- Header auto-detection now requires `options.csv.header` to be set to `'auto'` instead of `undefined`. `'auto'` is the new default value for this option, so this change is unlikely to affect applications.

**`@loaders.gl/json`**

- The experimental `json._rootObjectBatches` option is now deprecated. Use the top-level `metadata: true` option instead. Note that the `batchType` names have also changed, see the JSONLoader docs for details.

**`@loaders.gl/pointclouds/ply`**

The experimental streaming `_PLYStreamingLoader` has been removed. Use the non-streaming `PLYLoader` instead.

**`@loaders.gl/images`**

The new function `getBinaryImageMetadata()` replaces `isBinaryImage()`, `getBinaryImageSize()` and `getBinaryImageMIMEType()`. The old functions are now deprecated, but still available.

## Upgrading to v2.1

**`@loaders.gl/core`**

Some iterator helper functions have been renamed, the old naming is now deprecated.

| Old Name                   | New Name                 |
| -------------------------- | ------------------------ |
| `getStreamIterator`        | `makeStreamIterator`     |
| `contatenateAsyncIterator` | `concatenateChunksAsync` |

**`@loaders.gl/json`**

- Experimental exports have been removed `JSONParser`, `StreamingJSONParser`, `ClarinetParser`.

**`@loaders.gl/images`**

The experimental ImageLoaders for individual formats introduced in 2.0 have been removed, use `ImageLoader` for all formats.
`@loaders.gl/images`

- `getImageData(image)` now returns an object with `{data, width, height}` instead of just the `data` array. This small breaking change ensures that the concept of _image data_ is consistent across the API.
- `ImageBitmapLoader`: reintroduced in v4.4 as the preferred pure `ImageBitmap` loader.
- `ImageLoader`: deprecated in v4.4 and retained as the broad compatibility loader. If application code needs raw pixels from either loader, load the image and call `getImageData(image)`.

**`@loaders.gl/tiles-3d/3d-tiles`**

`Tileset3DLoader` and `Tile3DLoader` are replaced by `Tiles3DLoader`, which supports loading both a 3D tileset file and a tile. Check `loaders.gl/3d-tiles` for loaded data format.

## Upgrading to v2.0

Version 2.0 is a major release that consolidates functionality and APIs, and a number of deprecated functions have been removed.

Some general changes:

- All exported loader and writer objects now expose a `mimeType` field. This field is not yet used by `@loaders.gl/core` but is available for applications (e.g. see `selectLoader`).
- All (non-worker) loaders are now required to expose a `parse` function (in addition to any more specialized `parseSync/parseText/parseInBatches` functions). This simplifies using loaders without `@loaders.gl/core`, which can reduce footprint in small applications.

### `@loaders.gl/core`

| Removal            | Replacement                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| `TextEncoder`      | Use global `TextEncoder` instead and `@loaders.gl/core/polyfills` if needed |
| `TextDecoder`      | Use global `TextDecoder` instead and `@loaders.gl/core/polyfills` if needed |
| `createReadStream` | `fetch().then(resp => resp.body)`                                      |
| `parseFile`        | `parse`                                                                |
| `parseFileSync`    | `parseSync`                                                            |
| `loadFile`         | `load`                                                                 |

### `@loaders.gl/images`

| Removal             | Replacement                                     |
| ------------------- | ----------------------------------------------- |
| `ImageHTMLLoader`   | Deprecated `ImageLoader`                        |
| `ImageBitmapLoader` | `ImageBitmapLoader` (reintroduced in v4.4)      |
| `decodeImage`       | `parse(arrayBuffer, ImageLoader)`               |
| `isImage`           | `isBinaryImage`                                 |
| `getImageMIMEType`  | `getBinaryImageMIMEType`                        |
| `getImageSize`      | `getBinaryImageSize`                            |
| `getImageMetadata`  | `getBinaryImageMIMEType` + `getBinaryImageSize` |

### Loader Objects

- Loaders can no longer have a `loadAndParse` method. Remove it, and just make sure you define `parse` on your loaders instead.

### `@loaders.gl/scene/gltf`

The `GLTFLoader` now always uses the new v2 parser, and the original `GLTFParser` has been removed.

| Removal            | Replacement  |
| ------------------ | ------------ |
| `GLBParser`        | `GLBLoader`  |
| `GLBBuilder`       | `GLBWriter`  |
| `GLTFParser`       | `GLTFLoader` |
| `GLTFBuilder`      | `GLTFWriter` |
| `packBinaryJson`   | N/A          |
| `unpackBinaryJson` | N/A          |

Note that automatic packing of binary data (aka "packed JSON" support) was only implemented in the v1 `GLTFLoader` and has thus also been removed. Experience showed that packing of binary data for `.glb` files is best handled by applications.

**GLTFLoader option changes**

The foillowing top-level options are deprecated and will be removed in v2.0

| Removed Option         | Replacement                             | Descriptions                                                              |
| ---------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `gltf.parserVersion`   | N/A                                     | No longer needs to be specied, only the new gltf parser is available.     |
| `fetchLinkedResources` | `gltf.fetchBuffers`, `gltf.fetchImages` |                                                                           |
| `fetchImages`          | `gltf.fetchImages`                      |                                                                           |
| `createImages`         | N/A                                     | Images are now always created when fetched                                |
| `decompress`           | `gltf.decompressMeshes`                 | Decompress Draco compressed meshes (if DracoLoader available).            |
| `DracoLoader`          | N/A                                     | Supply `DracoLoader` to `parse`, or call `registerLoaders(pDracoLoader])` |
| `postProcess`          | `gltf.postProcess`                      | Perform additional post processing before returning data.                 |
| `uri`                  | `baseUri`                               | Auto-populated when loading from a url-equipped source                    |
| `fetch`                | N/A                                     | fetch is automatically available to sub-loaders.                          |

### `@loaders.gl/draco`

| Removal        | Replacement   |
| -------------- | ------------- |
| `DracoParser`  | `DracoLoader` |
| `DracoBuilder` | `DracoWriter` |

### Loader Objects

- Loaders no longer have a `loadAndParse` removed. Just define `parse` on your loaders.

## Upgrading from v1.2 to v1.3

- As with v1.1, `GLTFLoader` will no longer return a `GLTFParser` object in v2.0. A new option `options.gltf.parserVersion: 2` is provided to opt in to the new behavior now.

## Upgrading from v1.0 to v1.1

A couple of functions have been deprecated and will be removed in v2.0. They now emit console warnings. Start replacing your use of these functions now to remove the console warnings and ensure a smooth future upgrade to v2.0.

Also, Node support now requires installing `@loaders.gl/core/polyfills` before use.

### @loaders.gl/core

- Removal: Node support for `fetchFile` now requires importing `@loaders.gl/core/polyfills` before use.
- Removal: Node support for `TextEncoder`, and `TextDecoder` now requires importing `@loaders.gl/core/polyfills` before use.
- Deprecation: `TextEncoder` and `TextDecoder` will not be exported from `loaders.gl/core` in v2.0.

### @loaders.gl/images

- Removal: Node support for images now requires importing `@loaders.gl/core/polyfills` before use.

### @loaders.gl/scene/gltf

- Deprecation: `GLBParser`/`GLBBuilder` - These will be merged into GLTF classes..
- Deprecation: `GLTFParser`/`GLTFBuilder` - The new `GLTF` class can hold GLTF data and lets application access/modify it.
- Deprecation: `GLTFLoader` will no longer return a `GLTFParser` object in v2.0. Instead it will return a pure javascript object containing the parse json and any binary chunks. This object can be accessed through the `GLTF` class. Set `options.GLTFParser` to `false` to opt in to the new behavior now.

## v1.0

First official release of loaders.gl.
