# Grouped loader packages: proof of concept

This POC implements a representative subset of [RFC #4248](https://github.com/visgl/loaders.gl/issues/4248). It moves implementations, rather than adding umbrella packages around the original owners.

| New owner | Formats moved | Compatibility packages |
| --- | --- | --- |
| \@loaders.gl/tables | CSV, Avro | \@loaders.gl/csv, \@loaders.gl/avro |
| \@loaders.gl/geospatial | KML (including GPX, TCX, KMZ), Shapefile (including SHP, DBF) | \@loaders.gl/kml, \@loaders.gl/shapefile |

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

Parser entry points are tables/csv, tables/avro, tables/avro-schema, geospatial/kml, geospatial/kmz, geospatial/gpx, geospatial/tcx, geospatial/shapefile, geospatial/shp, and geospatial/dbf, all under the @loaders.gl scope. Format-specific source, writer, and advanced APIs remain available through explicit nested exports, such as @loaders.gl/tables/csv/csv-source and @loaders.gl/geospatial/kml/kmz-source.

## Compatibility and assets

The original four package roots, bundled/unbundled entry points where previously available, writers, and existing public subpaths forward to their new owners. Loader IDs and options stay stable. The format.module ownership field changes to tables or geospatial so default worker URLs target the new packages. New canonical worker bundles live at tables/dist/csv-worker.js and geospatial/dist/shp-worker.js or dbf-worker.js. Legacy worker build paths still produce compatibility bundles. Until the grouped packages are published, use locally served worker assets with an explicit worker URL, or set worker: false; the new default CDN addresses are not available yet.

This POC retains all four compatibility packages, so it temporarily adds two packages. The eventual package-count reduction requires retiring compatibility packages in a major release. Other table and geospatial formats remain in their current packages.

## Dependency and coverage boundaries

Subpath imports control eager loading and tree shaking, but do not avoid installing a group's ordinary dependencies. Importing only CSV still installs the dependencies required by Avro. Root writer exports also carry encoding dependencies. After building, run `node scripts/measure-grouped-package-imports.mjs` to compare compatibility roots, grouped metadata roots, and parser subpaths. The script reports minified ESM initial bytes, total emitted bytes including deferred chunks, and chunk counts; it does not measure gzip size or installation weight. Measure installation, initial metadata code, and deferred parser chunks separately before expanding the migration.

The existing test locations and fixture URLs stay stable. The four committed format coverage thresholds are unchanged and follow both compatibility sources and moved implementation directories through sourcePaths in the coverage manifest. Each new group also has an aggregate gate initialized from its strictest common inherited baseline (the minimum per metric across its formats); the unchanged individual gates continue to prevent cross-format coverage masking. No coverage exclusions are added.

Run yarn build, yarn build-workers, yarn test-node, yarn test-headless, yarn test-audit, and yarn lint fix when changing this POC.

The emitted ESM import and browser chunk-graph checks run in the hermetic slow lane: `yarn test-slow test/grouped-package-imports.node.slow.spec.ts`. Fast Chromium tests cover the grouped public entry points and lazy loader contract; fast Node tests check emitted export targets and CommonJS compatibility.
