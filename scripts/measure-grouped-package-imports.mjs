// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {build} from 'esbuild';

const repositoryRoot = process.cwd();
const importCases = [
  ['Compatibility CSV metadata', '@loaders.gl/csv', 'CSVLoader'],
  ['Grouped CSV metadata', '@loaders.gl/tables', 'CSVLoader'],
  ['CSV parser subpath', '@loaders.gl/tables/csv', 'CSVLoaderWithParser'],
  ['Compatibility KML metadata', '@loaders.gl/kml', 'KMLLoader'],
  ['Grouped KML metadata', '@loaders.gl/geospatial', 'KMLLoader'],
  ['KML parser subpath', '@loaders.gl/geospatial/kml', 'KMLLoaderWithParser']
];

console.log('| Import | Initial bytes | Total emitted bytes | Chunks |');
console.log('| --- | ---: | ---: | ---: |');
for (const [name, specifier, exportName] of importCases) {
  const result = await build({
    stdin: {
      contents: `import {${exportName}} from '${specifier}'; console.log(${exportName});`,
      resolveDir: repositoryRoot,
      sourcefile: 'entry.js'
    },
    // Exercise emitted package exports instead of the repository's source aliases.
    tsconfigRaw: {},
    bundle: true,
    minify: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    outdir: 'grouped-measure-output',
    write: false,
    metafile: true
  });
  const outputs = result.metafile.outputs;
  const entry = Object.entries(outputs).find(([, output]) => output.entryPoint === 'entry.js');
  const initialOutputs = new Set();

  /** Includes statically imported chunks without counting deferred parser chunks. */
  function visitOutput(filename) {
    if (initialOutputs.has(filename)) return;
    initialOutputs.add(filename);
    for (const imported of outputs[filename].imports) {
      if (imported.kind !== 'dynamic-import' && !imported.external) visitOutput(imported.path);
    }
  }

  visitOutput(entry[0]);
  const initialBytes = [...initialOutputs].reduce(
    (sum, filename) => sum + outputs[filename].bytes,
    0
  );
  const totalBytes = Object.values(outputs).reduce((sum, output) => sum + output.bytes, 0);
  console.log(`| ${name} | ${initialBytes} | ${totalBytes} | ${Object.keys(outputs).length} |`);
}
