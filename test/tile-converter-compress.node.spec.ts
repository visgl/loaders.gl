// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test} from 'vitest';
import {build} from 'esbuild';
import {spawn} from 'node:child_process';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';

let temporaryDirectory: string | undefined;

afterEach(async () => {
  if (temporaryDirectory) {
    await rm(temporaryDirectory, {recursive: true, force: true});
    temporaryDirectory = undefined;
  }
});

test('compressFileWithGzip resolves after writing a complete gzip file', async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), 'loaders-gl-gzip-'));
  const inputPath = join(temporaryDirectory, 'input.bin');
  const inputData = new Uint8Array(768 * 1024);
  let randomState = 0x12345678;

  for (let index = 0; index < inputData.length; index++) {
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    inputData[index] = randomState & 0xff;
  }

  await writeFile(inputPath, inputData);

  const compressModulePath = resolve('apps/tile-converter/src/lib/utils/compress-util.ts');
  const buildResult = await build({
    bundle: true,
    format: 'esm',
    platform: 'node',
    stdin: {
      contents: `
        import {compressFileWithGzip} from ${JSON.stringify(compressModulePath)};
        await compressFileWithGzip(process.argv[1]);
        process.exit(0);
      `,
      loader: 'ts',
      resolveDir: process.cwd()
    },
    write: false
  });
  const childScript = buildResult.outputFiles[0].text;
  const childProcess = spawn(
    process.execPath,
    ['--input-type=module', '--eval', childScript, inputPath],
    {stdio: 'ignore'}
  );

  await new Promise<void>((resolveChildProcess, rejectChildProcess) => {
    childProcess.on('error', rejectChildProcess);
    childProcess.on('exit', (exitCode, signal) => {
      if (exitCode === 0) {
        resolveChildProcess();
      } else {
        rejectChildProcess(
          new Error(`Compression child process exited with code ${exitCode} and signal ${signal}`)
        );
      }
    });
  });

  const compressedPath = `${inputPath}.gz`;
  const compressedData = await readFile(compressedPath);

  expect(compressedPath).toBe(`${inputPath}.gz`);
  expect([...compressedData.subarray(0, 2)]).toEqual([0x1f, 0x8b]);
  expect(gunzipSync(compressedData).equals(inputData)).toBe(true);
});
