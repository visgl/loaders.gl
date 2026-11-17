import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {expect, test} from 'vitest';

const packagePath = new URL('../apps/tile-converter/package.json', import.meta.url);
const {version} = JSON.parse(readFileSync(packagePath, 'utf8'));

test.each([
  ['converter.js', 'legacy-v4'],
  ['converter-v5.js', 'v5']
])('converter --version identifies the installed package and implementation (%s)', (entry, implementation) => {
  const output = execFileSync(
    process.execPath,
    [new URL(`../apps/tile-converter/bin/${entry}`, import.meta.url).pathname, '--version'],
    {encoding: 'utf8'}
  );
  expect(output).toBe(
    `@loaders.gl/tile-converter ${version} (implementation: ${implementation})\n`
  );
});
