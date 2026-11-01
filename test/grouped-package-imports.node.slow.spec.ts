// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {expect, test} from 'vitest';

const REPOSITORY_ROOT = process.cwd();

test.each([
  ['tables', 'ParquetLoader', 'parquet-loader', 'ParquetLoaderWithParser'],
  ['tables', 'ORCLoader', 'orc-loader', 'ORCLoaderWithParser'],
  ['tables', 'LanceLoader', 'lance-loader', 'LanceLoaderWithParser'],
  ['tables', 'JSONLoader', 'json-loader', 'JSONLoaderWithParser'],
  ['tables', 'ArrowLoader', 'arrow-loader', 'ArrowLoaderWithParser'],
  ['geospatial', 'FlatGeobufLoader', 'flatgeobuf-loader', 'FlatGeobufLoaderWithParser'],
  ['geospatial', 'GeoPackageLoader', 'geopackage-loader', 'GeoPackageLoaderWithParser'],
  ['tables', 'CSVLoader', 'csv-loader', 'CSVLoaderWithParser'],
  ['geospatial', 'KMLLoader', 'kml-loader', 'KMLLoaderWithParser']
])(
  'published %s %s metadata preloads through its flat parser export',
  (group, metadata, parserEntry, parser) => {
    // A separate Node process bypasses Vitest source aliases and checks the published layout.
    const source = `import {${metadata}} from '@loaders.gl/${group}';
    import {${parser}} from '@loaders.gl/${group}/${parserEntry}';
    if (await ${metadata}.preload() !== ${parser}) process.exit(1);`;
    expect(() =>
      execFileSync(process.execPath, ['--input-type=module', '-e', source], {
        cwd: REPOSITORY_ROOT,
        timeout: 30000
      })
    ).not.toThrow();
    // The subprocess has a 30-second deadline; allow time to report its result.
  },
  35_000
);

test.each([
  ['tables', 'ArrowLoader'],
  ['tables', 'JSONLoader'],
  ['tables', 'LanceLoader'],
  ['tables', 'ORCLoader'],
  ['tables', 'ParquetLoader'],
  ['tables', 'GeoJSONLoader'],
  ['geospatial', 'GeoPackageLoader'],
  ['tables', 'CSVLoader'],
  ['geospatial', 'KMLLoader']
])(
  'grouped %s %s metadata keeps parser loaders out of the initial browser chunk',
  async (group, loader) => {
    const result = await build({
      stdin: {
        contents: `import {${loader}} from '@loaders.gl/${group}'; console.log(${loader});`,
        resolveDir: REPOSITORY_ROOT,
        sourcefile: 'metadata-entry.js'
      },
      tsconfigRaw: {},
      bundle: true,
      splitting: true,
      format: 'esm',
      platform: 'browser',
      outdir: 'grouped-package-test-output',
      write: false,
      metafile: true
    });
    const outputs = result.metafile!.outputs;
    const entry = Object.entries(outputs).find(
      ([, output]) => output.entryPoint === 'metadata-entry.js'
    );
    expect(entry).toBeDefined();
    const visited = new Set<string>();
    /** Visits only statically imported chunks; parser chunks are deferred. */
    function visitOutput(filename: string): void {
      if (visited.has(filename)) return;
      visited.add(filename);
      for (const imported of outputs[filename].imports) {
        if (imported.kind !== 'dynamic-import' && !imported.external) visitOutput(imported.path);
      }
    }
    visitOutput(entry![0]);
    const eagerInputs = [...visited].flatMap(filename => Object.keys(outputs[filename].inputs));
    expect(
      eagerInputs.filter(
        filename =>
          // Arrow's legacy exports/* files contain metadata WorkerLoader aliases.
          !filename.includes('/arrow/exports/') &&
          /\/(?:csv|avro|kml|kmz|gpx|tcx|shapefile|shp|dbf|bson|excel|flatgeobuf|geopackage|arrow|geoarrow|json|json-table|ndjson|ndgeojson|geojson|lance|orc|parquet|parquet-js|geoparquet)-loader\.js$/.test(
            filename
          )
      )
    ).toEqual([]);
    expect(
      eagerInputs.filter(filename =>
        /node_modules\/(?:sql\.js|xlsx|apache-arrow|bson)\//.test(filename)
      )
    ).toEqual([]);
    if (group === 'tables') {
      expect(
        eagerInputs.filter(filename => filename.endsWith('/lib/sources/data-source.js'))
      ).toEqual([]);
    }
    expect(
      Object.values(outputs).some(output =>
        output.imports.some(imported => imported.kind === 'dynamic-import')
      )
    ).toBe(true);
  },
  30_000
);

test.each([
  ['tables', 'arrow-source', 'ArrowTableSource'],
  ['tables', 'arrow/geometry', 'WKBBuilder'],
  ['tables', 'ndjson-source', 'NDJSONTableSource'],
  ['tables', 'lance-source-loader', 'LanceSource'],
  ['tables', 'orc-source-loader', 'ORCSourceLoaderWithParser'],
  ['tables', 'parquet-source-loader', 'ParquetSourceLoaderWithParser'],
  ['tables', 'parquet-dataset-source', 'ParquetDatasetSource'],
  ['tables', 'iceberg-table-source', 'IcebergTableSource'],
  ['tables', 'parquet/iceberg-rest-catalog', 'IcebergRestCatalog'],
  ['tables', 'delta-source', 'DeltaSourceLoaderWithParser']
])(
  'published %s/%s exposes %s after forwarding removal',
  (group, subpath, exportName) => {
    const source = `import {${exportName}} from '@loaders.gl/${group}/${subpath}';
  if (!${exportName}) process.exit(1);`;
    expect(() =>
      execFileSync(process.execPath, ['--input-type=module', '-e', source], {
        cwd: REPOSITORY_ROOT,
        timeout: 30000
      })
    ).not.toThrow();
  },
  35_000
);

test('published Arrow transport compatibility uses the shared lower-level owner', () => {
  const source = `import {dehydrateArrowTable as legacy, splitArrowBuffers as legacySplit} from '@loaders.gl/tables/arrow/transport';
  import {dehydrateArrowTable, splitArrowBuffers} from '@loaders.gl/core/schema-utils/arrow-transport';
  if (legacy !== dehydrateArrowTable || legacySplit !== splitArrowBuffers) process.exit(1);`;
  expect(() =>
    execFileSync(process.execPath, ['--input-type=module', '-e', source], {
      cwd: REPOSITORY_ROOT,
      timeout: 30000
    })
  ).not.toThrow();
}, 35_000);
