// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve, sep} from 'node:path';
import {chromium} from 'playwright';
import {build} from 'esbuild';
import {expect, test} from 'vitest';

const REPOSITORY_ROOT = process.cwd();

test.each([
  ['tables', 'ParquetLoader', 'parquet', 'ParquetLoader'],
  ['tables', 'GeoParquetLoader', 'parquet', 'GeoParquetLoader'],
  ['tables', 'ORCLoader', 'orc', 'ORCLoader'],
  ['tables', 'LanceLoader', 'lance', 'LanceLoader'],
  ['tables', 'JSONLoader', 'json', 'JSONLoader'],
  ['tables', 'ArrowLoader', 'arrow', 'ArrowLoader'],
  ['geospatial', 'FlatGeobufLoader', 'flatgeobuf', 'FlatGeobufLoader'],
  ['geospatial', 'GeoPackageLoader', 'geopackage', 'GeoPackageLoader'],
  ['tables', 'CSVLoader', 'csv', 'CSVLoader'],
  ['pointclouds', 'PCDLoader', 'pcd', 'PCDLoader'],
  ['pointclouds', 'PLYLoader', 'ply', 'PLYLoader'],
  ['scene', 'OBJLoader', 'obj', 'OBJLoader'],
  ['scientific', 'NPYLoader', 'npy', 'NPYLoader'],
  ['geospatial', 'KMLLoader', 'kml', 'KMLLoader']
])(
  'published %s %s metadata preloads through its format export',
  (group, metadata, parserEntry, parser) => {
    // A separate Node process bypasses Vitest source aliases and checks the published layout.
    const metadataPath = `${group}/${parserEntry}`;
    const parserPath = `${parserEntry}/bundled`;
    const source = `import {${metadata}} from '@loaders.gl/${metadataPath}';
    import {${parser} as bundledParser} from '@loaders.gl/${group}/${parserPath}';
    if (await ${metadata}.preload() !== bundledParser) process.exit(1);
    if (${metadata}.loadWorker && ${metadata}.loadWorker !== bundledParser.loadWorker) process.exit(1);`;
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
  ['geospatial/geopackage', 'GeoPackageLoader'],
  ['geospatial/kml', 'KMLLoader']
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
    expect(
      Object.values(outputs).some(output =>
        output.imports.some(imported => imported.kind === 'dynamic-import')
      )
    ).toBe(true);
  },
  30_000
);

test.each([
  'ParquetLoader',
  'GeoParquetLoader'
])('the Parquet format entry does not pull unrelated format helpers into %s preload', async loader => {
  const {metafile} = await build({
    stdin: {
      contents: `export {${loader}} from '@loaders.gl/tables/parquet';`,
      resolveDir: REPOSITORY_ROOT,
      sourcefile: 'parquet-metadata-entry.js'
    },
    tsconfigRaw: {},
    bundle: true,
    minify: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    outdir: 'grouped-package-test-output',
    write: false,
    metafile: true
  });
  const outputs = metafile.outputs;
  const entry = Object.keys(outputs).find(
    filename => outputs[filename].entryPoint === 'parquet-metadata-entry.js'
  );
  expect(entry).toBeDefined();
  const eager = new Set([entry!]);
  for (const filename of eager) {
    for (const dependency of outputs[filename].imports) {
      if (dependency.kind !== 'dynamic-import' && !dependency.external) {
        eager.add(dependency.path);
      }
    }
  }
  const eagerBytes = [...eager].reduce((sum, filename) => sum + outputs[filename].bytes, 0);
  const eagerInputs = [...eager].flatMap(filename => Object.keys(outputs[filename].inputs));
  expect(
    eagerInputs.filter(filename =>
      /(?:parquet-loader|parquet-source|parquet-writer|geoparquet-loader)\.js$/.test(filename)
    )
  ).toEqual([]);
  expect(eagerBytes).toBeLessThan(8 * 1024);
});

test.each([
  ['tables', 'arrow/bundled', 'ArrowTableSource'],
  ['tables', 'arrow/geometry', 'WKBBuilder'],
  ['tables', 'json/bundled', 'NDJSONTableSource'],
  ['tables', 'lance/bundled', 'LanceSource'],
  ['tables', 'orc/bundled', 'ORCLoaderWithParser'],
  ['tables', 'parquet/bundled', 'ParquetLoaderWithParser'],
  ['tables', 'parquet/bundled', 'ParquetDatasetSource'],
  ['tables', 'iceberg', 'IcebergTableSource'],
  ['tables', 'iceberg', 'IcebergRestCatalog'],
  ['tables', 'delta/bundled', 'DeltaLoaderWithParser']
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

test.each([
  ['tables', 'parquet/parquet-loader-types.js', 'ParquetLoader', 'parquet/parquet-loader-types.js'],
  ['tables', 'arrow/arrow-loader-types.js', 'ArrowLoader', 'arrow/arrow-loader-types.js'],
  [
    'tables',
    'json/json-table-loader-types.js',
    'JSONTableLoader',
    'json/json-table-loader-types.js'
  ],
  ['pointclouds', 'pcd/pcd-loader-types.js', 'PCDLoader', 'pcd/pcd-loader-types.js'],
  ['scientific', 'npy-loader-types.js', 'NPYLoader', 'npy-loader-types.js']
])(
  'native browser ESM starts a standalone worker from %s/%s',
  async (packageName, entry, loaderName, workerName) => {
    const root = resolve(REPOSITORY_ROOT, 'modules', packageName, 'dist');
    const server = createServer(async (request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (url.pathname === '/') {
        response.writeHead(200, {'Content-Type': 'text/html'}).end(`<!doctype html>
        <script type="importmap">{"imports":{"loader":"/dist/${entry}"}}</script>
        <script type="module">
          import {${loaderName}} from 'loader';
          const worker = ${loaderName}.loadWorker();
          worker.addEventListener('message', event => {
            if (event.data?.type === 'ready') window.workerResult = 'ready';
          });
          worker.addEventListener('error', event => {
            window.workerResult = event.message || 'worker failed to load';
          });
        </script>`);
        return;
      }
      const file = resolve(root, url.pathname.slice('/dist/'.length));
      if (!url.pathname.startsWith('/dist/') || !file.startsWith(root + sep)) {
        response.writeHead(404).end();
        return;
      }
      try {
        const contents = await readFile(file);
        response.writeHead(200, {'Content-Type': 'text/javascript'}).end(contents);
      } catch {
        response.writeHead(404).end();
      }
    });
    await new Promise<void>(complete => server.listen(0, '127.0.0.1', complete));
    try {
      const browser = await chromium.launch();
      try {
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('Expected HTTP port');
        const page = await browser.newPage();
        const workers: string[] = [];
        page.on('worker', worker => workers.push(worker.url()));
        await page.goto(`http://127.0.0.1:${address.port}/`);
        const result = await page.waitForFunction(
          () => Reflect.get(window, 'workerResult'),
          undefined,
          {timeout: 10000}
        );
        expect(await result.jsonValue()).toBe('ready');
        expect(workers).toEqual([`http://127.0.0.1:${address.port}/dist/${workerName}-worker.js`]);
      } finally {
        await browser.close();
      }
    } finally {
      await new Promise<void>(complete => server.close(() => complete()));
    }
  },
  20_000
);
