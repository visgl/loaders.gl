// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fileSystem from 'node:fs';
import operatingSystem from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {expect, test} from 'vitest';
import {globSync} from 'tinyglobby';

const CHECKER_PATH = path.resolve('scripts/check-coverage-thresholds.mjs');

test.each([95, 75])('moved format coverage keeps its original gate at %s percent', covered => {
  const directory = fileSystem.mkdtempSync(
    path.join(operatingSystem.tmpdir(), 'grouped-coverage-')
  );
  try {
    const metrics = ['statements', 'lines', 'functions', 'branches'];
    const thresholds = Object.fromEntries(metrics.map(metric => [metric, 90]));
    const coverage = Object.fromEntries(
      metrics.map(metric => [metric, {total: 100, covered, pct: covered}])
    );
    const packages = {
      '@loaders.gl/csv': {
        path: 'modules/csv',
        sourcePaths: ['modules/csv/src/', 'modules/tables/src/csv/'],
        browser: thresholds,
        merged: thresholds
      },
      '@loaders.gl/tables': {path: 'modules/tables', browser: thresholds, merged: thresholds}
    };
    /** Writes a fixture relative to the temporary repository. */
    function writeFixture(filename: string, value: unknown): void {
      const target = path.join(directory, filename);
      fileSystem.mkdirSync(path.dirname(target), {recursive: true});
      fileSystem.writeFileSync(target, JSON.stringify(value));
    }
    for (const name of ['csv', 'tables'])
      writeFixture('modules/' + name + '/package.json', {name: '@loaders.gl/' + name});
    writeFixture('test/coverage-thresholds.json', {version: 1, target: 90, packages});
    const healthyCoverage = Object.fromEntries(
      metrics.map(metric => [metric, {total: 1000, covered: 1000, pct: 100}])
    );
    const summary = {
      total: coverage,
      'modules/tables/src/csv/parser.ts': coverage,
      'modules/tables/src/avro/parser.ts': healthyCoverage
    };
    writeFixture('coverage/browser/coverage-summary.json', summary);
    writeFixture('coverage/coverage-summary.json', summary);
    const result = spawnSync(process.execPath, [CHECKER_PATH], {cwd: directory, encoding: 'utf8'});
    expect(result.status, result.stderr).toBe(covered >= 90 ? 0 : 1);
    if (covered < 90) {
      expect(result.stderr).toContain('@loaders.gl/csv browser statements coverage');
      expect(result.stderr).not.toContain('@loaders.gl/tables browser statements coverage');
    }
  } finally {
    fileSystem.rmSync(directory, {recursive: true, force: true});
  }
});

test('Node-only subpath stays out of browser coverage but remains in merged coverage', () => {
  const directory = fileSystem.mkdtempSync(path.join(operatingSystem.tmpdir(), 'core-coverage-'));
  try {
    const metrics = ['statements', 'lines', 'functions', 'branches'];
    const thresholds = Object.fromEntries(metrics.map(metric => [metric, 75]));
    const covered = Object.fromEntries(
      metrics.map(metric => [metric, {total: 100, covered: 100, pct: 100}])
    );
    const uncovered = Object.fromEntries(
      metrics.map(metric => [metric, {total: 100, covered: 0, pct: 0}])
    );
    /** Writes a fixture relative to the temporary repository. */
    function writeFixture(filename: string, value: unknown): void {
      const target = path.join(directory, filename);
      fileSystem.mkdirSync(path.dirname(target), {recursive: true});
      fileSystem.writeFileSync(target, JSON.stringify(value));
    }
    writeFixture('modules/core/package.json', {name: '@loaders.gl/core'});
    writeFixture('test/coverage-thresholds.json', {
      version: 1,
      target: 90,
      packages: {
        '@loaders.gl/core': {
          path: 'modules/core',
          browserExcludedSourcePaths: ['modules/core/src/polyfills/'],
          browserExclusionReason: 'Node-only adapters cannot execute in Chromium.',
          browser: thresholds,
          merged: thresholds
        }
      }
    });
    const browserSummary = {
      total: covered,
      'modules/core/src/index.ts': covered,
      'modules/core/src/polyfills/index.ts': uncovered
    };
    writeFixture('coverage/browser/coverage-summary.json', browserSummary);
    writeFixture('coverage/coverage-summary.json', browserSummary);
    const failedMergedCoverage = spawnSync(process.execPath, [CHECKER_PATH], {
      cwd: directory,
      encoding: 'utf8'
    });
    expect(failedMergedCoverage.status).toBe(1);
    expect(failedMergedCoverage.stderr).toContain('@loaders.gl/core merged statements coverage');
    expect(failedMergedCoverage.stderr).not.toContain(
      '@loaders.gl/core browser statements coverage'
    );

    writeFixture('coverage/coverage-summary.json', {
      ...browserSummary,
      'modules/core/src/polyfills/index.ts': covered
    });
    const passedMergedCoverage = spawnSync(process.execPath, [CHECKER_PATH], {
      cwd: directory,
      encoding: 'utf8'
    });
    expect(passedMergedCoverage.status, passedMergedCoverage.stderr).toBe(0);
  } finally {
    fileSystem.rmSync(directory, {recursive: true, force: true});
  }
});

const coverageConfig = JSON.parse(fileSystem.readFileSync('.nycrc', 'utf8'));
const productionSources = new Set(
  globSync(coverageConfig.include, {ignore: coverageConfig.exclude})
);

test.each([
  'modules/core/src/schema-utils/lib/arrow/arrow-table-transport.ts',
  'modules/core/src/schema-utils/lib/arrow/split-arrow-buffers.ts',
  'modules/tables/src/arrow/arrow-loader.ts',
  'modules/tables/src/json/json-loader.ts',
  'modules/tables/src/lance/lance-loader.ts',
  'modules/tables/src/orc/orc-loader.ts',
  'modules/tables/src/parquet/parquet-loader.ts',
  'modules/tables/src/csv/csv-loader.ts',
  'modules/tables/src/avro/avro-loader.ts',
  'modules/tables/src/bson/bson-loader.ts',
  'modules/tables/src/excel/excel-loader.ts',
  'modules/geospatial/src/kml/kml-loader.ts',
  'modules/geospatial/src/shapefile/shapefile-loader.ts',
  'modules/geospatial/src/flatgeobuf/flatgeobuf-loader.ts',
  'modules/geospatial/src/flatgeobuf/lib/flatgeobuf-reader.ts',
  'modules/geospatial/src/geopackage/geopackage-loader.ts'
])('%s remains in the production coverage denominator', source => {
  expect(productionSources.has(source)).toBe(true);
});
