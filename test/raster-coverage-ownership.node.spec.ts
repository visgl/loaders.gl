// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fileSystem from 'node:fs';
import operatingSystem from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {expect, test} from 'vitest';

const CHECKER_PATH = path.resolve('scripts/check-coverage-thresholds.mjs');

test.each([95, 75])('moved format coverage keeps its original gate at %s percent', covered => {
  const directory = fileSystem.mkdtempSync(path.join(operatingSystem.tmpdir(), 'raster-coverage-'));
  try {
    const metrics = ['statements', 'lines', 'functions', 'branches'];
    const thresholds = Object.fromEntries(metrics.map(metric => [metric, 90]));
    const coverage = Object.fromEntries(
      metrics.map(metric => [metric, {total: 100, covered, pct: covered}])
    );
    const packages = {
      '@loaders.gl/raster': {path: 'modules/raster', browser: thresholds, merged: thresholds}
    };
    const formats = {
      terrain: {
        owner: '@loaders.gl/raster',
        path: 'modules/raster/src/terrain',
        sourcePaths: ['modules/raster/src/terrain/'],
        browser: thresholds,
        merged: thresholds
      }
    };
    /** Writes a fixture relative to the temporary repository. */
    function writeFixture(filename: string, value: unknown): void {
      const target = path.join(directory, filename);
      fileSystem.mkdirSync(path.dirname(target), {recursive: true});
      fileSystem.writeFileSync(target, JSON.stringify(value));
    }
    for (const name of ['raster'])
      writeFixture('modules/' + name + '/package.json', {name: '@loaders.gl/' + name});
    writeFixture('test/coverage-thresholds.json', {version: 1, target: 90, packages, formats});
    const healthyCoverage = Object.fromEntries(
      metrics.map(metric => [metric, {total: 1000, covered: 1000, pct: 100}])
    );
    const summary = {
      total: coverage,
      'modules/raster/src/terrain/parser.ts': coverage,
      'modules/raster/src/geotiff/parser.ts': healthyCoverage
    };
    writeFixture('coverage/browser/coverage-summary.json', summary);
    writeFixture('coverage/coverage-summary.json', summary);
    const result = spawnSync(process.execPath, [CHECKER_PATH], {cwd: directory, encoding: 'utf8'});
    expect(result.status, result.stderr).toBe(covered >= 90 ? 0 : 1);
    if (covered < 90) {
      expect(result.stderr).toContain('terrain browser statements coverage');
      expect(result.stderr).not.toContain('@loaders.gl/raster browser statements coverage');
    }
  } finally {
    fileSystem.rmSync(directory, {recursive: true, force: true});
  }
});
