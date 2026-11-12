// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {afterEach, expect, test} from 'vitest';
import YAML from 'yaml';

const workflow = YAML.parse(readFileSync('.github/workflows/release.yml', 'utf8'));
const cleanupScript = workflow.jobs.build.steps.find(
  step => step.name === 'Verify clean release checkout'
).run;
const temporaryDirectories: string[] = [];
const decoderPath = 'modules/tiles/src/mlt/libs/mlt-decoder.cjs';
const nestedComment =
  '// ../../node_modules/@maplibre/mlt/node_modules/@mapbox/point-geometry/index.js';
const hoistedComment = '// ../../node_modules/@mapbox/point-geometry/index.js';

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, {recursive: true, force: true});
});

/** Creates a minimal reviewed checkout with a tracked decoder and an unrelated source file. */
function createReleaseFixture(): string {
  const directory = mkdtempSync(path.join(tmpdir(), 'loaders-release-'));
  temporaryDirectories.push(directory);
  mkdirSync(path.dirname(path.join(directory, decoderPath)), {recursive: true});
  writeFileSync(path.join(directory, decoderPath), nestedComment + '\nmodule.exports = 42;\n');
  writeFileSync(path.join(directory, 'source.js'), 'export const value = 1;\n');
  execFileSync('git', ['init', '--quiet'], {cwd: directory});
  execFileSync('git', ['add', '.'], {cwd: directory});
  execFileSync(
    'git',
    [
      '-c',
      'user.name=Release test',
      '-c',
      'user.email=release@example.invalid',
      'commit',
      '--quiet',
      '-m',
      'Reviewed fixture'
    ],
    {cwd: directory}
  );
  return directory;
}

test('release checkout restores only the dependency-hoisting comment variation', () => {
  const directory = createReleaseFixture();
  writeFileSync(path.join(directory, decoderPath), hoistedComment + '\nmodule.exports = 42;\n');
  execFileSync('bash', ['-e', '-c', cleanupScript], {cwd: directory, stdio: 'pipe'});
  expect(readFileSync(path.join(directory, decoderPath), 'utf8')).toBe(
    nestedComment + '\nmodule.exports = 42;\n'
  );
  expect(execFileSync('git', ['status', '--porcelain'], {cwd: directory, encoding: 'utf8'})).toBe(
    ''
  );
});

test('release checkout refuses to discard a real decoder change', () => {
  const directory = createReleaseFixture();
  const changed = hoistedComment + '\nmodule.exports = 43;\n';
  writeFileSync(path.join(directory, decoderPath), changed);
  expect(() =>
    execFileSync('bash', ['-e', '-c', cleanupScript], {cwd: directory, stdio: 'pipe'})
  ).toThrow();
  expect(readFileSync(path.join(directory, decoderPath), 'utf8')).toBe(changed);
});

test('release checkout refuses unrelated tracked source changes', () => {
  const directory = createReleaseFixture();
  writeFileSync(path.join(directory, 'source.js'), 'export const value = 2;\n');
  expect(() =>
    execFileSync('bash', ['-e', '-c', cleanupScript], {cwd: directory, stdio: 'pipe'})
  ).toThrow();
});
