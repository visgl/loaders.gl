import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {expect, test} from 'vitest';

const packagePath = new URL('../apps/tile-converter/package.json', import.meta.url);
const {version} = JSON.parse(readFileSync(packagePath, 'utf8'));

test.each([
  ['bin/converter.js', 'legacy-v4'],
  ['bin/converter-v5.js', 'v5'],
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
