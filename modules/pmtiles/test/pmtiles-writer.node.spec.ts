// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import path from 'node:path';
import ts from 'typescript';
import {expect, test} from 'vitest';

const require = createRequire(import.meta.url);

test('PMTiles writer is available through built ESM and CommonJS package entrypoints', async () => {
  const esm = await import('../dist/index.js');
  const commonjs = require('../dist/index.cjs');
  const options = {tileType: 'png' as const};
  const tiles = [{z: 0, x: 0, y: 0, data: new Uint8Array([1, 2])}];
  const expected = await esm.encodePMTiles(tiles, options);
  expect(await commonjs.encodePMTiles(tiles, options)).toEqual(expected);
  expect(await commonjs.PMTilesWriter.encode(tiles, {pmtiles: options})).toEqual(expected);
});

/** Checks the documented consumer calls against the declarations emitted by the package build. */
test('exported PMTiles option types work with direct and standard writer APIs', () => {
  const filename = path.join(process.cwd(), 'modules/pmtiles/test/pmtiles-consumer.mts');
  const source = `import {encode} from '@loaders.gl/core';
    import {encodePMTiles, PMTilesWriter} from '@loaders.gl/pmtiles';
    import type {PMTilesEncodeOptions, PMTilesWriterOptions, PMTilesTile} from '@loaders.gl/pmtiles';
    import {encodeGeoArrowPMTiles} from '@loaders.gl/pmtiles/geoarrow';
    import type {GeoArrowPMTilesOptions} from '@loaders.gl/pmtiles';
    import type {ArrowTable} from '@loaders.gl/schema';
    declare const table: ArrowTable;
    const authoring: GeoArrowPMTilesOptions = {tiles: [{z: 0, x: 0, y: 0}], mvt: {propertyColumns: ['name']}};
    void encodeGeoArrowPMTiles(table, authoring);
    const tiles: PMTilesTile[] = [{z: 0, x: 0, y: 0, data: new Uint8Array([1])}];
    const options: PMTilesEncodeOptions = {tileType: 'png'};
    const writerOptions: PMTilesWriterOptions = {pmtiles: options};
    void encodePMTiles(tiles, options);
    void PMTilesWriter.encode(tiles, {pmtiles: options});
    void PMTilesWriter.encode(tiles, writerOptions);
    void encode(tiles, PMTilesWriter, {pmtiles: options});`;
  const options: ts.CompilerOptions = {
    strict: true,
    types: [],
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext
  };
  const host = ts.createCompilerHost(options);
  const readSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (file, languageVersion, onError, createNewSourceFile) =>
    file === filename
      ? ts.createSourceFile(filename, source, languageVersion, true)
      : readSourceFile(file, languageVersion, onError, createNewSourceFile);
  const program = ts.createProgram([filename], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  expect(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: file => file,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => '\n'
    })
  ).toBe('');
});
