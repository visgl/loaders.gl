import {resolve} from 'node:path';
import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';

export default defineConfig({
  resolve: {
    alias: {
      '@loaders.gl/images': resolve('modules/images/src/index.ts'),
      '@loaders.gl/core': resolve('modules/core/src/index.ts'),
      '@loaders.gl/loader-utils': resolve('modules/loader-utils/src/index.ts'),
      '@loaders.gl/worker-utils': resolve('modules/worker-utils/src/index.ts'),
      '@loaders.gl/schema': resolve('modules/schema/src/index.ts')
    }
  },
  test: {
    setupFiles: ['test/setup/wasm-browser.ts'],
    include: [
      'modules/textures/test/lib/parsers/basis-module-loader.spec.ts',
      'modules/textures/test/basis-runtime.spec.ts',
      'modules/loader-utils/test/lib/module-utils/initialize-wasm-module.spec.ts',
      'modules/crypto/test/lib/md5-wasm.spec.ts',
      'modules/compression/test/zstd-initialization.spec.ts',
      'modules/draco/test/draco-initialization.spec.ts'
    ],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{browser: 'chromium', headless: true}]
    }
  }
});
