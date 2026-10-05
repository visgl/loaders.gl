// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {spawnSync} from 'node:child_process';
import path from 'node:path';
import ts from 'typescript';
import {expect, test} from 'vitest';

test.each(['esm', 'commonjs'])('numeric raster exports work through built %s packages', format => {
  const imports =
    format === 'esm'
      ? `import {sampleRaster} from '@loaders.gl/loader-utils';
       import {GeoTIFFSourceLoader, discoverGeoTIFF} from '@loaders.gl/geotiff';`
      : `const {sampleRaster} = require('@loaders.gl/loader-utils');
       const {GeoTIFFSourceLoader, discoverGeoTIFF} = require('@loaders.gl/geotiff');`;
  const result = spawnSync(
    process.execPath,
    [
      ...(format === 'esm' ? ['--input-type=module'] : []),
      '-e',
      `${imports}
    const raster = {data: new Float32Array([4]), width: 1, height: 1, bandCount: 1,
      dtype: 'float32', interleaved: true};
    if (sampleRaster(raster, [0, 0]).values[0] !== 4 ||
        typeof discoverGeoTIFF !== 'function' || typeof GeoTIFFSourceLoader.createDataSource !== 'function')
      throw new Error('Raster package exports failed');`
    ],
    {cwd: process.cwd(), encoding: 'utf8', timeout: 30000}
  );
  expect(result.stderr).toBe('');
  expect(result.status).toBe(0);
});

test('published raster declarations support additive mixed regions and legacy common rasters', () => {
  const filename = path.join(process.cwd(), 'test/raster-consumer.mts');
  const source = `import type {RasterData, RasterMixedData, NumericRasterData, RasterRegionSource, RasterDeclaredBandStatistics} from '@loaders.gl/loader-utils';
    import {GeoTIFFRasterSource} from '@loaders.gl/geotiff';
    const source: RasterRegionSource = new GeoTIFFRasterSource(new Blob([]), {});
    const region: Promise<NumericRasterData> = source.getRasterForRegion({bounds: [[0, 0], [1, 1]],
      crs: 'EPSG:4326', width: 1, height: 1});
    const common: RasterData = {data: new Float32Array(1), dtype: 'float32',
      width: 1, height: 1, bandCount: 1, interleaved: true};
    const mixed: RasterMixedData = {data: [new Int16Array(1), new Float64Array(1)], dtype: 'mixed',
      width: 1, height: 1, bandCount: 2, interleaved: false,
      bands: [{index: 0, dtype: 'int16'}, {index: 1, dtype: 'float64'}]};
    const payloads: NumericRasterData[] = [common, mixed];
    const declaration: RasterDeclaredBandStatistics = {band: 0, domain: 'unknown', scope: 'source', method: 'declared'};
    void region; void payloads; void declaration;`;
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
