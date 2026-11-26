import { defineConfig } from 'vite';
import fs from 'fs';

/** Run against local source */
const getAliases = async (frameworkName, frameworkRootDir) => {
  const modules = await fs.promises.readdir(`${frameworkRootDir}/modules`)
  const aliases = {}
  modules.forEach(module => {
    // Images exposes format subpaths through its package export map.
    if (module === 'images') return;
    aliases[`${frameworkName}/${module}`] = `${frameworkRootDir}/modules/${module}/src`;
  })
  // console.log(aliases);
  return aliases
}

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  resolve: {extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'], alias: await getAliases('@loaders.gl', `${__dirname}/../../..`)},
  server: {open: true}
}))

