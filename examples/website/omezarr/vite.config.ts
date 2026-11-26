import {getWorkspaceSourceAliases} from '../../../scripts/workspace-package-aliases.js';
import {defineConfig} from 'vite';


export default defineConfig(async () => ({
  resolve: {alias: getWorkspaceSourceAliases('@loaders.gl', `${__dirname}/../../..`)},
  server: {open: true},
  debug: true,
  verbose: true
}));
