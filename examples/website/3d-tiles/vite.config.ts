import {getWorkspaceSourceAliases} from '../../../scripts/workspace-package-aliases.js';
import { defineConfig } from 'vite';


// https://vitejs.dev/config/
export default defineConfig(async () => ({
  resolve: {extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'], alias: getWorkspaceSourceAliases('@loaders.gl', `${__dirname}/../../..`)},
  server: {open: true}
}))

