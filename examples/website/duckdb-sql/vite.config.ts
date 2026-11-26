import {getWorkspaceSourceAliases} from '../../../scripts/workspace-package-aliases.js';
import {defineConfig} from 'vite'
import * as fs from 'fs'


export default defineConfig(async () => {
  return {
    resolve: {extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'], alias: getWorkspaceSourceAliases('@loaders.gl', `${__dirname}/../../..`)
    },
    server: {open: true}
  }
})
