// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {expect, test} from 'vitest';

const REPOSITORY_ROOT = process.cwd();

test.each([
  ['tables', 'CSVLoader', 'csv', 'CSVLoaderWithParser'],
  ['geospatial', 'KMLLoader', 'kml', 'KMLLoaderWithParser']
])('published %s ESM metadata preloads through real package exports', (group, metadata, subpath, parser) => {
  // A separate Node process bypasses Vitest source aliases and checks the published layout.
  const source = `import {${metadata}} from '@loaders.gl/${group}';
    import {${parser}} from '@loaders.gl/${group}/${subpath}';
    if (await ${metadata}.preload() !== ${parser}) process.exit(1);`;
  expect(() =>
    execFileSync(process.execPath, ['--input-type=module', '-e', source], {
      cwd: REPOSITORY_ROOT,
      timeout: 30000
    })
  ).not.toThrow();
});

test.each([
  ['tables', 'CSVLoader'],
  ['geospatial', 'KMLLoader']
])('grouped %s metadata keeps parser loaders out of the initial browser chunk', async (group, loader) => {
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
    eagerInputs.filter(filename =>
      /\/(?:csv|avro|kml|kmz|gpx|tcx|shapefile|shp|dbf)-loader\.js$/.test(filename)
    )
  ).toEqual([]);
  expect(
    Object.values(outputs).some(output =>
      output.imports.some(imported => imported.kind === 'dynamic-import')
    )
  ).toBe(true);
});
