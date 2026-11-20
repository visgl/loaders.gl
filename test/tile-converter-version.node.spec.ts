import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {expect, test} from 'vitest';

const packagePath = new URL('../apps/tile-converter/package.json', import.meta.url);
/** Package identity and actual bin declarations used by installed npm commands. */
const {version, bin} = JSON.parse(readFileSync(packagePath, 'utf8'));

test.each([
  [bin['tile-converter'], 'v5'],
  [bin['tile-converter-v4'], 'legacy-v4'],
  [bin['tile-converter-v5'], 'v5'],
  ['dist/converter.min.cjs', 'legacy-v4']
])('converter --version identifies the installed package and implementation (%s)', (entry, implementation) => {
  const output = execFileSync(
    process.execPath,
    [
      '--no-deprecation',
      fileURLToPath(new URL(`../apps/tile-converter/${entry}`, import.meta.url)),
      '--version'
    ],
    {encoding: 'utf8'}
  );
  expect(output).toBe(
    `@loaders.gl/tile-converter ${version} (implementation: ${implementation})\n`
  );
});

test('the default converter dispatches to the v5 CLI for normal invocations', () => {
  const output = execFileSync(
    process.execPath,
    [fileURLToPath(new URL(bin['tile-converter'], packagePath)), '--help'],
    {encoding: 'utf8'}
  );
  expect(output).toMatch(/Usage: tile-converter inspect\|convert\|validate/);
});

test.each([
  'module',
  'commonjs'
])('built converter exports use v5 by default and opt in to v4 (%s)', format => {
  /** Loader syntax differs between the two published Node module formats. */
  const load = format === 'module' ? 'await import' : 'require';
  execFileSync(
    process.execPath,
    [
      `--input-type=${format}`,
      '--eval',
      `
          const assert = ${load}('node:assert/strict');
          const root = ${load}('@loaders.gl/tile-converter');
          const v5 = ${load}('@loaders.gl/tile-converter/v5');
          const v4 = ${load}('@loaders.gl/tile-converter/v4');
          assert.strictEqual(root, v5);
          assert.equal(typeof root.convertTileset, 'function');
          assert.equal(root.I3SConverter, undefined);
          assert.equal(typeof v4.I3SConverter, 'function');
          assert.equal(typeof v4.Tiles3DConverter, 'function');
        `
    ],
    {cwd: fileURLToPath(new URL('.', packagePath))}
  );
});
