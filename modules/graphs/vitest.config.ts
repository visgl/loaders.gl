import {resolve} from 'node:path';
import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';

export default defineConfig({
  resolve: {
    alias: {
      '@loaders.gl/core': resolve('modules/core/src/index.ts'),
      '@loaders.gl/loader-utils': resolve('modules/loader-utils/src/index.ts'),
      '@loaders.gl/worker-utils': resolve('modules/worker-utils/src/index.ts'),
      '@loaders.gl/schema': resolve('modules/schema/src/index.ts'),
      '@loaders.gl/schema-utils': resolve('modules/schema-utils/src/index.ts')
    }
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['modules/graphs/test/*.cross.spec.ts'],
          environment: 'node'
        }
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['modules/graphs/test/*.spec.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{browser: 'chromium', headless: true}]
          }
        }
      }
    ]
  }
});
