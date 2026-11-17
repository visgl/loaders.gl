import {resolve} from 'node:path';
import {readdirSync} from 'node:fs';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  resolve: {alias: readdirSync('modules').map(name => ({find: `@loaders.gl/${name}`, replacement: resolve(`modules/${name}/src/index.ts`)}))},
  test: {environment: 'node', include: ['test/tile-converter-*.node.spec.ts']}
});
