// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {build} from 'esbuild';

const repositoryRoot = process.cwd();
const importCases = [
  ['Compatibility Avro metadata', '@loaders.gl/avro', 'AvroLoader'],
  ['Grouped Avro metadata', '@loaders.gl/tables', 'AvroLoader'],
  ['Avro parser subpath', '@loaders.gl/tables/avro', 'AvroLoaderWithParser'],
  ['Compatibility Shapefile metadata', '@loaders.gl/shapefile', 'ShapefileLoader'],
  ['Grouped Shapefile metadata', '@loaders.gl/geospatial', 'ShapefileLoader'],
  ['Shapefile parser subpath', '@loaders.gl/geospatial/shapefile', 'ShapefileLoaderWithParser'],
  ['Compatibility Arrow metadata', '@loaders.gl/arrow', 'ArrowLoader'],
  ['Grouped Arrow metadata', '@loaders.gl/tables', 'ArrowLoader'],
  ['Arrow parser subpath', '@loaders.gl/tables/arrow', 'ArrowLoaderWithParser'],
  ['Compatibility JSON metadata', '@loaders.gl/json', 'JSONLoader'],
  ['Grouped JSON metadata', '@loaders.gl/tables', 'JSONLoader'],
  ['JSON parser subpath', '@loaders.gl/tables/json', 'JSONLoaderWithParser'],
  ['Compatibility Lance metadata', '@loaders.gl/lance', 'LanceLoader'],
  ['Grouped Lance metadata', '@loaders.gl/tables', 'LanceLoader'],
  ['Lance parser subpath', '@loaders.gl/tables/lance', 'LanceLoaderWithParser'],
  ['Compatibility ORC metadata', '@loaders.gl/orc', 'ORCLoader'],
  ['Grouped ORC metadata', '@loaders.gl/tables', 'ORCLoader'],
  ['ORC parser subpath', '@loaders.gl/tables/orc', 'ORCLoaderWithParser'],
  ['Compatibility Parquet metadata', '@loaders.gl/parquet', 'ParquetLoader'],
  ['Grouped Parquet metadata', '@loaders.gl/tables', 'ParquetLoader'],
  ['Parquet parser subpath', '@loaders.gl/tables/parquet', 'ParquetLoaderWithParser'],

  ['Compatibility BSON metadata', '@loaders.gl/bson', 'BSONLoader'],
  ['Grouped BSON metadata', '@loaders.gl/tables', 'BSONLoader'],
  ['BSON parser subpath', '@loaders.gl/tables/bson', 'BSONLoaderWithParser'],
  ['Compatibility Excel metadata', '@loaders.gl/excel', 'ExcelLoader'],
  ['Grouped Excel metadata', '@loaders.gl/tables', 'ExcelLoader'],
  ['Excel parser subpath', '@loaders.gl/tables/excel', 'ExcelLoaderWithParser'],
  ['Compatibility FlatGeobuf metadata', '@loaders.gl/flatgeobuf', 'FlatGeobufLoader'],
  ['Grouped FlatGeobuf metadata', '@loaders.gl/geospatial', 'FlatGeobufLoader'],
  ['FlatGeobuf parser subpath', '@loaders.gl/geospatial/flatgeobuf', 'FlatGeobufLoaderWithParser'],
  ['Compatibility GeoPackage metadata', '@loaders.gl/geopackage', 'GeoPackageLoader'],
  ['Grouped GeoPackage metadata', '@loaders.gl/geospatial', 'GeoPackageLoader'],
  ['GeoPackage parser subpath', '@loaders.gl/geospatial/geopackage', 'GeoPackageLoaderWithParser'],
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
