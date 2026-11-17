import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {expect, test} from 'vitest';

const converterPackage = new URL('../apps/tile-converter/', import.meta.url);
const {version} = JSON.parse(readFileSync(new URL('package.json', converterPackage), 'utf8'));

test.each(['bin/converter.js', 'dist/converter.min.cjs'])('%s reports its version', entrypoint => {
  const output = execFileSync(
    process.execPath,
    ['--no-deprecation', fileURLToPath(new URL(entrypoint, converterPackage)), '--version'],
    {encoding: 'utf8'}
  );
  expect(output).toBe(`@loaders.gl/tile-converter ${version} (implementation: legacy-v4)\n`);
});
