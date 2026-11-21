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
  ['tables', 'ParquetLoader', 'parquet', 'ParquetLoaderWithParser'],
  ['tables', 'ORCLoader', 'orc', 'ORCLoaderWithParser'],
  ['tables', 'LanceLoader', 'lance', 'LanceLoaderWithParser'],
  ['tables', 'JSONLoader', 'json', 'JSONLoaderWithParser'],
  ['tables', 'ArrowLoader', 'arrow', 'ArrowLoaderWithParser'],
  ['geospatial', 'FlatGeobufLoader', 'flatgeobuf', 'FlatGeobufLoaderWithParser'],
  ['geospatial', 'GeoPackageLoader', 'geopackage', 'GeoPackageLoaderWithParser'],
  ['tables', 'CSVLoader', 'csv', 'CSVLoaderWithParser'],
  ['pointclouds', 'PCDLoader', 'pcd', 'PCDLoaderWithParser'],
  ['pointclouds', 'PLYLoader', 'ply', 'PLYLoaderWithParser'],
  ['scene', 'OBJLoader', 'obj', 'OBJLoaderWithParser'],
  ['scientific', 'NPYLoader', 'npy', 'NPYLoaderWithParser'],
  ['geospatial', 'KMLLoader', 'kml', 'KMLLoaderWithParser']
])(
  'published %s %s metadata preloads through its format export',
  (group, metadata, parserEntry, parser) => {
    // A separate Node process bypasses Vitest source aliases and checks the published layout.
    const source = `import {${metadata}} from '@loaders.gl/${group}';
    import {${parser}} from '@loaders.gl/${group}/${parserEntry}';
    if (await ${metadata}.preload() !== ${parser}) process.exit(1);
    if (${metadata}.loadWorker && ${metadata}.loadWorker !== ${parser}.loadWorker) process.exit(1);`;
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
  ['tables', 'arrow', 'ArrowTableSource'],
  ['tables', 'arrow/geometry', 'WKBBuilder'],
  ['tables', 'json', 'NDJSONTableSource'],
  ['tables', 'lance', 'LanceSource'],
  ['tables', 'orc', 'ORCLoaderWithParser'],
  ['tables', 'parquet', 'ParquetLoaderWithParser'],
  ['tables', 'parquet', 'ParquetDatasetSource'],
  ['tables', 'iceberg', 'IcebergTableSource'],
  ['tables', 'iceberg', 'IcebergRestCatalog'],
  ['tables', 'delta', 'DeltaLoaderWithParser']
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
  ['tables', 'parquet/parquet-loader-types.js', 'ParquetLoader', 'parquet'],
  ['tables', 'arrow/arrow-loader-types.js', 'ArrowLoader', 'arrow'],
  ['tables', 'json/json-table-loader-types.js', 'JSONTableLoader', 'json'],
  ['pointclouds', 'pcd/pcd-loader-types.js', 'PCDLoader', 'pcd'],
  ['scientific', 'npy-loader-types.js', 'NPYLoader', 'npy']
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
