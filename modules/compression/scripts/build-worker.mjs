// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {build} from 'esbuild';
import {createCompressUtilsAssetPlugin} from '../../../scripts/lib/compress-utils-assets.mjs';

const platform = process.argv[2] === 'node' ? 'node' : 'browser';
const moduleWorker = process.argv[2] === 'module';
const entry = platform === 'node' ? 'src/workers/compression-worker-node.ts' : 'src/workers/compression-worker.ts';

const workerConfig = {
  entryPoints: [entry],
  outfile: moduleWorker ? 'dist/compression-worker.mjs' : platform === 'node' ? 'dist/compression-worker-node.js' : 'dist/compression-worker.js',
  platform,
  format: moduleWorker || platform === 'node' ? 'esm' : 'iife',
  assetNames: 'codec-assets/[name]-[hash]',
  target: platform === 'node' ? 'node16' : 'esnext',
  bundle: true,
  minify: true,
  sourcemap: true,
  external: platform === 'browser' ? ['fs', 'path', 'crypto'] : [],
  define: {__VERSION__: JSON.stringify(process.env.npm_package_version)},
  loader: {'.wasm': 'dataurl'},
  plugins: [createCompressUtilsAssetPlugin()]
};

if (process.argv[2]?.startsWith('bundle')) {
  const {getBundleConfig} = await import('../../../node_modules/@vis.gl/dev-tools/dist/configuration/get-esbuild-config.js');
  const development = process.argv[2] === 'bundle-dev';
  const configuration = await getBundleConfig({input: './bundle.ts', output: development ? 'dist/dist.dev.js' : 'dist/dist.min.js', ...(development ? {env: 'dev'} : {})});
  await build({...configuration, loader: {...configuration.loader, '.wasm': 'dataurl'}, plugins: [...(configuration.plugins || []), ...workerConfig.plugins]});
} else {
  await build(workerConfig);
}
