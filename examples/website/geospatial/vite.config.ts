import {getWorkspaceSourceAliases} from '../../../scripts/workspace-package-aliases.js';
import {defineConfig} from 'vite';
import fs from 'fs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);


// https://vitejs.dev/config/
export default defineConfig(async () => {
  return {
    resolve: {extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'], alias: [
        ...getWorkspaceSourceAliases('@loaders.gl', `${__dirname}/../../..`),
        {find: 'fs', replacement: require.resolve('./empty-fs.js')},
        {find: 'path', replacement: require.resolve('path-browserify')},
        {find: 'process', replacement: require.resolve('process/browser')}
      ]
    },
    server: {open: true}
  };
});
