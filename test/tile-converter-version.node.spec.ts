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

test('v5 errors remain a single JSON document including converter identity', async () => {
  const {runTileConverterCLI} = await import('../apps/tile-converter/src/v5/node-cli');
  const stdout: string[] = [];
  const stderr: string[] = [];
  expect(
    await runTileConverterCLI(['invalid'], {
      stdout: text => stdout.push(text),
      stderr: text => stderr.push(text)
    })
  ).toBe(1);
  expect(stdout).toEqual([]);
  expect(JSON.parse(stderr.join(''))).toMatchObject({
    code: 'CLI_USAGE_ERROR',
    converter: {package: '@loaders.gl/tile-converter', version, implementation: 'v5'}
  });
});
