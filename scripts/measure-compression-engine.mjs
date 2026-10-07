// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {build} from 'esbuild';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'loaders-compression-'));

try {
  for (const [name, modulePath] of [
    ['internal', path.join(repositoryRoot, 'modules/compression/src/lib/fflate/index.ts')],
    ['upstream', 'fflate/browser']
  ]) {
    const bundle = await build({
      stdin: {
        contents: `export {gzipSync, gunzipSync, zlibSync, unzlibSync, deflateSync, inflateSync} from ${JSON.stringify(modulePath)};`,
        resolveDir: repositoryRoot,
        loader: 'ts'
      },
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2022',
      minify: true,
      write: false
    });
    const source = bundle.outputFiles[0].contents;
    const bundlePath = path.join(temporaryDirectory, `${name}.mjs`);
    await writeFile(bundlePath, source);
    const measurement = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import {pathToFileURL} from 'node:url';
      const started = performance.now();
      const engine = await import(pathToFileURL(process.argv[1]));
      const importMilliseconds = performance.now() - started;
      const input = new TextEncoder().encode('loaders.gl compression benchmark row,42\\n'.repeat(8192));
      const formats = [['gzipSync', 'gunzipSync'], ['zlibSync', 'unzlibSync'], ['deflateSync', 'inflateSync']];
      const compressedByteLengths = {};
      for (const [encode, decode] of formats) {
        const compressed = engine[encode](input, {level: 6, mtime: 0});
        const decoded = engine[decode](compressed);
        if (decoded.length !== input.length || decoded.some((value, index) => value !== input[index])) throw new Error('incorrect output');
        compressedByteLengths[encode] = compressed.length;
      }
      console.log(JSON.stringify({importMilliseconds, inputBytes: input.length, compressedByteLengths, processPeakResidentSetSizeBytes: process.resourceUsage().maxRSS * 1024}));
    `, bundlePath], {encoding: 'utf8'});
    if (measurement.status !== 0) throw new Error(measurement.stderr || 'measurement failed');
    console.log(JSON.stringify({
      implementation: name,
      runtime: process.version,
      platform: process.platform,
      architecture: process.arch,
      bundleBytes: source.length,
      gzipBundleBytes: gzipSync(source, {level: 9}).length,
      ...JSON.parse(measurement.stdout)
    }));
  }
} finally {
  await rm(temporaryDirectory, {recursive: true, force: true});
}
