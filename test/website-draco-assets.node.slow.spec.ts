// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {createRequire} from 'node:module';
import {mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve, join} from 'node:path';
import {runInNewContext} from 'node:vm';

const require = createRequire(import.meta.url);

// Production bundling is an integration check; keep it out of the required fast Node suite.
test('website production assets preserve the classic Draco initializer globals', async () => {
  const {rspack, SwcJsMinimizerRspackPlugin} = require('@rspack/core');
  const {getSwcJsMinimizerOptions} = require('@docusaurus/faster');
  const preserveDracoAssets = require('../website/plugins/preserve-draco-assets');
  const directory = await mkdtemp(join(tmpdir(), 'loaders-website-draco-'));
  const entry = join(directory, 'entry.js');
  const runtime = resolve('modules/scene/dist/libs/draco_encoder.js');
  const decoder = resolve('modules/scene/src/draco/libs/draco_wasm_wrapper_gltf.js');
  const ordinaryScript = join(directory, 'ordinary.js');
  const output = join(directory, 'output');
  let compiler: ReturnType<typeof rspack> | undefined;
  try {
    const ordinarySource = 'var longVariableName = 1; globalThis.value = longVariableName;';
    await writeFile(ordinaryScript, ordinarySource);
    await writeFile(
      entry,
      `globalThis.runtimeUrls = [${[runtime, decoder, ordinaryScript].map(path => `new URL(${JSON.stringify(path)}, import.meta.url).href`).join(',')}];`
    );
    compiler = rspack({
      mode: 'production',
      entry,
      target: 'webworker',
      output: {path: output, filename: 'bundle.js', publicPath: '/'},
      plugins: [preserveDracoAssets],
      optimization: {
        minimizer: [new SwcJsMinimizerRspackPlugin({minimizerOptions: getSwcJsMinimizerOptions()})]
      },
      module: {
        rules: [
          {test: /(?:draco_encoder|draco_wasm_wrapper_gltf|ordinary)\.js$/, type: 'asset/resource'}
        ]
      }
    });
    await new Promise<void>((resolveBuild, reject) => {
      compiler!.run((error: Error | null, stats: {hasErrors(): boolean; toString(): string}) => {
        if (error || stats.hasErrors()) reject(error || new Error(stats.toString()));
        else resolveBuild();
      });
    });
    const assets = await Promise.all(
      (await readdir(output))
        .filter(name => name !== 'bundle.js' && name.endsWith('.js'))
        .map(name => readFile(join(output, name), 'utf8'))
    );
    expect(assets).toHaveLength(3);
    for (const [filename, initializer] of [
      [runtime, 'DracoEncoderModule'],
      [decoder, 'DracoDecoderModule']
    ]) {
      const original = await readFile(filename, 'utf8');
      expect(assets).toContain(original);
      const scope = {setTimeout, clearTimeout};
      runInNewContext(original, scope);
      expect(scope).toHaveProperty(initializer, expect.any(Function));
    }
    expect(assets).not.toContain(ordinarySource);
    expect(assets.some(source => source.includes('globalThis.value'))).toBe(true);
  } finally {
    await new Promise<void>((resolveClose, reject) => {
      if (!compiler) return resolveClose();
      compiler.close((error: Error | null) => (error ? reject(error) : resolveClose()));
    });
    await rm(directory, {recursive: true, force: true});
  }
}, 30000);
