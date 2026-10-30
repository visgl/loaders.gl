// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {build} from 'esbuild';

const repositoryRoot = process.cwd();
const importCases = [
  ['Grouped GeoTIFF metadata', '@loaders.gl/raster', 'GeoTIFFLoader'],
  ['Grouped numeric TIFF metadata', '@loaders.gl/raster', 'GeoTIFFRasterLoader'],
  ['GeoTIFF parser subpath', '@loaders.gl/raster/geotiff', 'GeoTIFFLoaderWithParser'],
  ['Grouped LERC metadata', '@loaders.gl/raster', 'LERCLoader'],
  ['LERC parser subpath', '@loaders.gl/raster/lerc', 'LERCLoaderWithParser'],
  ['Grouped terrain metadata', '@loaders.gl/raster', 'TerrainLoader'],
  ['Terrain parser subpath', '@loaders.gl/raster/terrain', 'TerrainLoaderWithParser'],
  ['Grouped quantized mesh metadata', '@loaders.gl/raster', 'QuantizedMeshLoader'],
  ['Quantized mesh parser subpath', '@loaders.gl/raster/quantized-mesh', 'QuantizedMeshLoaderWithParser'],
  ['Format Avro metadata', '@loaders.gl/tables/avro', 'AvroLoader'],
  ['Grouped Avro metadata', '@loaders.gl/tables', 'AvroLoader'],
  ['Avro parser subpath', '@loaders.gl/tables/avro-loader', 'AvroLoaderWithParser'],
  ['Format Shapefile metadata', '@loaders.gl/geospatial/shapefile', 'ShapefileLoader'],
  ['Grouped Shapefile metadata', '@loaders.gl/geospatial', 'ShapefileLoader'],
  ['Shapefile parser subpath', '@loaders.gl/geospatial/shapefile-loader', 'ShapefileLoaderWithParser'],
  ['Format Arrow metadata', '@loaders.gl/tables/arrow', 'ArrowLoader'],
  ['Grouped Arrow metadata', '@loaders.gl/tables', 'ArrowLoader'],
  ['Arrow parser subpath', '@loaders.gl/tables/arrow-loader', 'ArrowLoaderWithParser'],
  ['Format JSON metadata', '@loaders.gl/tables/json', 'JSONLoader'],
  ['Grouped JSON metadata', '@loaders.gl/tables', 'JSONLoader'],
  ['JSON parser subpath', '@loaders.gl/tables/json-loader', 'JSONLoaderWithParser'],
  ['Format Lance metadata', '@loaders.gl/tables/lance', 'LanceLoader'],
  ['Grouped Lance metadata', '@loaders.gl/tables', 'LanceLoader'],
  ['Lance parser subpath', '@loaders.gl/tables/lance-loader', 'LanceLoaderWithParser'],
  ['Format ORC metadata', '@loaders.gl/tables/orc', 'ORCLoader'],
  ['Grouped ORC metadata', '@loaders.gl/tables', 'ORCLoader'],
  ['ORC parser subpath', '@loaders.gl/tables/orc-loader', 'ORCLoaderWithParser'],
  ['Format Parquet metadata', '@loaders.gl/tables/parquet', 'ParquetLoader'],
  ['Grouped Parquet metadata', '@loaders.gl/tables', 'ParquetLoader'],
  ['Parquet parser subpath', '@loaders.gl/tables/parquet-loader', 'ParquetLoaderWithParser'],

  ['Format BSON metadata', '@loaders.gl/documents', 'BSONLoader'],
  ['BSON parser subpath', '@loaders.gl/documents/bson-loader', 'BSONLoaderWithParser'],
  ['Format Excel metadata', '@loaders.gl/tables/excel', 'ExcelLoader'],
  ['Grouped Excel metadata', '@loaders.gl/tables', 'ExcelLoader'],
  ['Excel parser subpath', '@loaders.gl/tables/excel-loader', 'ExcelLoaderWithParser'],
  ['Format FlatGeobuf metadata', '@loaders.gl/geospatial/flatgeobuf', 'FlatGeobufLoader'],
  ['Grouped FlatGeobuf metadata', '@loaders.gl/geospatial', 'FlatGeobufLoader'],
  ['FlatGeobuf parser subpath', '@loaders.gl/geospatial/flatgeobuf-loader', 'FlatGeobufLoaderWithParser'],
  ['Format GeoPackage metadata', '@loaders.gl/geospatial/geopackage', 'GeoPackageLoader'],
  ['Grouped GeoPackage metadata', '@loaders.gl/geospatial', 'GeoPackageLoader'],
  ['GeoPackage parser subpath', '@loaders.gl/geospatial/geopackage-loader', 'GeoPackageLoaderWithParser'],
  ['Format CSV metadata', '@loaders.gl/tables/csv', 'CSVLoader'],
  ['Grouped CSV metadata', '@loaders.gl/tables', 'CSVLoader'],
  ['CSV parser subpath', '@loaders.gl/tables/csv-loader', 'CSVLoaderWithParser'],
  ['Format KML metadata', '@loaders.gl/geospatial/kml', 'KMLLoader'],
  ['Grouped KML metadata', '@loaders.gl/geospatial', 'KMLLoader'],
  ['KML parser subpath', '@loaders.gl/geospatial/kml-loader', 'KMLLoaderWithParser']
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
    // LERC's Node-only import is not part of its browser implementation.
    external: ['module'],
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
