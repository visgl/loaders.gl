# Grouped loader packages: proof of concept

This POC completes the tables and geospatial candidate groups in [RFC #4248](https://github.com/visgl/loaders.gl/issues/4248). It moves implementations, rather than adding umbrella packages around the original owners.

| New owner | Formats moved | Compatibility packages |
| --- | --- | --- |
| \@loaders.gl/tables | Arrow (including GeoArrow), Avro, BSON, CSV, Excel, JSON (including GeoJSON and newline-delimited variants), Lance, ORC, Parquet (including GeoParquet) | \@loaders.gl/tables/csv, \@loaders.gl/tables/avro, \@loaders.gl/tables/bson, \@loaders.gl/tables/excel, \@loaders.gl/tables/arrow, \@loaders.gl/tables/json, \@loaders.gl/tables/lance, \@loaders.gl/tables/orc, \@loaders.gl/tables/parquet |
| \@loaders.gl/geospatial | KML (including GPX, TCX, KMZ), Shapefile (including SHP, DBF), FlatGeobuf, GeoPackage | \@loaders.gl/geospatial/kml, \@loaders.gl/geospatial/shapefile, \@loaders.gl/geospatial/flatgeobuf, \@loaders.gl/geospatial/geopackage |

## Metadata and parser imports

A metadata loader describes its format, options, and output types without including parsing methods. Its asynchronous preload function imports the parser only when needed. Core asynchronous APIs can use metadata loaders directly. Synchronous parsing requires a parser-bearing loader with synchronous support.

```ts
import {parse, parseSync} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/tables';
import {KMLLoader} from '@loaders.gl/geospatial';
import {CSVLoaderWithParser} from '@loaders.gl/tables/csv';

const table = await parse(csvData, CSVLoader, {worker: false});
const features = await parse(kmlData, KMLLoader);
const synchronousTable = parseSync(csvData, CSVLoaderWithParser);
```

Parser entry points are tables/csv, tables/avro, tables/avro-schema, tables/bson, tables/excel, tables/arrow, tables/json, tables/lance, tables/orc, tables/parquet, geospatial/kml, geospatial/kmz, geospatial/gpx, geospatial/tcx, geospatial/shapefile, geospatial/shp, geospatial/dbf, geospatial/flatgeobuf, and geospatial/geopackage, all under the @loaders.gl scope. Format-specific source, writer, and advanced APIs remain available through explicit nested exports, such as @loaders.gl/tables/csv/csv-source and @loaders.gl/geospatial/kml/kmz-source.

## Compatibility and assets

The thirteen former format packages have been removed. Install `@loaders.gl/tables` or `@loaders.gl/geospatial` and import the group root for metadata loaders or the format `index` subpath for former package-root APIs. Parser-bearing loaders remain available at the format subpath. Writers and public implementation entry points remain available from the group packages. Loader IDs and options stay stable. The format.module ownership field changes to tables or geospatial so default worker URLs target the new packages. New canonical worker bundles live at tables/dist/csv-worker.js and geospatial/dist/shp-worker.js or dbf-worker.js. The old worker bundle paths are no longer built. Until the grouped packages are published, use locally served worker assets with an explicit worker URL, or set worker: false; the new default CDN addresses are not available yet.

All nine table packages and all four geospatial packages proposed in the RFC now have grouped implementation owners, without the standalone forwarding packages.

## Dependency and coverage boundaries

Subpath imports control eager loading and tree shaking, but do not avoid installing a group's ordinary dependencies. Tables declares `bson`, `xlsx`, and `parquet-wasm` as optional dependencies. Package managers install them by default, but consumers may omit optional dependencies. Excel requires `xlsx`; BSON parsing and synchronous BSON writer exports require `bson`, including format indexes that re-export that writer. Use only entry points whose dependencies are installed. SQL.js is an optional peer dependency of geospatial. Install it explicitly with `npm install sql.js` when using GeoPackage loaders or sources; other geospatial formats do not require it. Root writer exports also carry encoding dependencies. After building, run `node scripts/measure-grouped-package-imports.mjs` to compare grouped format indexes, metadata roots, and parser subpaths. The script reports minified ESM initial bytes, total emitted bytes including deferred chunks, and chunk counts; it does not measure gzip size or installation weight. Measure installation, initial metadata code, and deferred parser chunks separately when reviewing further migration.

The format tests and fixtures now live under the owning group packages. The thirteen committed format coverage thresholds are unchanged and follow their implementation directories through independent format gates in the coverage manifest. Each group also retains the aggregate gate established in the initial CSV/Avro and KML/Shapefile POC; the unchanged individual gates continue to prevent cross-format coverage masking. The existing generated Parquet Thrift exclusion follows its moved directory, with its original audited reason; no new code is excluded.

Run yarn build, yarn build-workers, yarn test-node, yarn test-headless, yarn test-audit, and yarn lint fix when changing this POC.

The emitted ESM import and browser chunk-graph checks run in the hermetic slow lane: `yarn test-slow test/grouped-package-imports.node.slow.spec.ts`. Fast Chromium tests cover the grouped public entry points and lazy loader contract; fast Node tests check emitted export targets and CommonJS compatibility.

## Additional format APIs

Use `@loaders.gl/geospatial/flatgeobuf/flatgeobuf-source-loader` for the FlatGeobuf source/query API and `@loaders.gl/geospatial/geopackage/geopackage-source-loader` for GeoPackage sources. These stay outside the metadata-only group root. BSON keeps its writer at the group root and its synchronous parser helper at `@loaders.gl/tables/bson/index`. The former standalone package roots have been removed.

GeoPackage keeps its existing sql.js WASM resolution and `geopackage.sqlJsCDN` option; it does not acquire worker support. Its default CDN constant now lives in a neutral options file so importing metadata does not eagerly import sql.js. Excel and FlatGeobuf workers are emitted at their group package asset paths.

Excel Arrow worker transport hooks live on the parser-bearing loader, matching CSV and FlatGeobuf. Core preloads that implementation before dispatching workers, so grouped metadata imports do not eagerly load Apache Arrow to hydrate results. The Excel format subpath retains its transport hook fields through the format index.

## Complete table group

`@loaders.gl/tables/arrow` exports `ArrowLoaderWithParser` and `GeoArrowLoaderWithParser`. `@loaders.gl/tables/json` exports JSON, JSONTable, NDJSON, GeoJSON, and NDGeoJSON parser loaders. `@loaders.gl/tables/parquet` exports Parquet, ParquetJS, and GeoParquet parser loaders. Lance and ORC use the matching format subpaths. The root exports format metadata loaders, their options, existing writers, and metadata-only Lance, ORC, and Parquet source loaders. Delta and other advanced source APIs remain on their explicit nested entrypoints.

Shared Arrow converters, transport, type facades, and table utilities live under `@loaders.gl/tables/arrow/index`, `@loaders.gl/tables/arrow/transport`, and the original named nested entrypoints. JSON streaming helpers live under `@loaders.gl/tables/json/index`. Former package-root APIs are available from the grouped format `index` subpaths; implementation APIs use their named subpaths. Internal table implementations import these canonical entries directly, so tables never depends on an old compatibility owner. The focused `@loaders.gl/arrow-geometry`, schema, and schema-utils packages remain lower-level dependencies.

This consolidation broadens installation dependencies for consumers migrating from standalone Arrow and JSON packages: they now install tables and its ordinary dependencies, including BSON and XLSX. Parquet WASM remains optional. Geospatial uses geometry builders directly from arrow-geometry and worker transport from schema-utils/arrow-transport, so it does not install the tables group. Subpath exports and deferred parsers protect browser entry chunks, but cannot provide per-format dependency installation. Utility-only consumers can import @loaders.gl/core/schema-utils/arrow-transport without installing the tables group. This PR does not claim an overall installation-size reduction for table format consumers.

Parquet keeps its source/query, dataset, Iceberg REST catalog, Iceberg types, Delta source, JS backend, and optional WASM backend under explicit `tables/parquet/...` exports. Its workers are emitted in the tables dist root and its WASM binary beside the canonical Parquet implementation; the standalone package assets have been removed. Arrow triangulation workers and GeoJSON workers now build only in tables. Arrow geometry construction stays in arrow-geometry rather than the application-level geoarrow package.

GeoJSON follows Excel's transport split: grouped metadata defers Arrow hydration code to its parser, while the grouped GeoJSON metadata entrypoint preserves transport hook fields. Lance and ORC source metadata work with async `load()`; synchronous source construction requires their explicit source implementation subpaths. Lance's grouped source loader preloads its implementation; the Lance implementation subpath retains synchronous source construction.

Shared Arrow table transport and buffer splitting now belong to `@loaders.gl/core/schema-utils/arrow-transport`. Arrow and tables transport exports remain public facades. The original Arrow coverage gate still includes the moved transport implementation, while schema-utils also enforces its unchanged owning-package gate. Geospatial depends only on the focused geometry and schema utility packages, avoiding a dependency on all table engines.

Internal format code imports focused transport, UTF-8, and indexed-table helpers directly. Parquet BSON columns use the BSON encoding/decoding kernels rather than the public writer object. This keeps synchronous writer APIs compatible while preventing a deferred parser from anchoring BSON or source infrastructure in the initial metadata chunk. The emitted chunk-graph checks enforce that boundary.

## Raster consolidation

`@loaders.gl/raster` owns GeoTIFF (including numeric TIFF, COG and OME-TIFF), LERC, image-encoded
terrain and quantized mesh. Its root exports metadata loaders, writer and public types; parser
implementations use `/geotiff`, `/lerc`, `/terrain` and `/quantized-mesh` subpaths.
GeoTIFF and OME-TIFF source constructors remain on explicit source subpaths. Their metadata-only
root exports preload the constructors for asynchronous core APIs.

The standalone GeoTIFF, LERC and terrain packages are removed rather than retained as forwarding
packages. Install optional `geotiff` and `lerc` peers when using those engines. Existing format
option namespaces and output defaults remain unchanged. Terrain worker assets now belong to the
raster package, while the LERC WASM export is `@loaders.gl/raster/lerc/lerc-wasm.wasm`.
Each moved format retains its original independent browser and merged coverage gates.
ArcGIS services remain in `@loaders.gl/arcgis`.
