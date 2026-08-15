import {defineConfig} from 'vite';
import fs from 'fs';

/** Resolves loaders.gl packages to local source while developing the example. */
const getAliases = async (frameworkName, frameworkRootDirectory) => {
  const modules = await fs.promises.readdir(`${frameworkRootDirectory}/modules`);
  const aliases = {};
  modules.forEach(module => {
    aliases[`${frameworkName}/${module}`] = `${frameworkRootDirectory}/modules/${module}/src`;
  });
  return aliases;
};

export default defineConfig(async () => ({
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    alias: await getAliases('@loaders.gl', `${__dirname}/../../..`)
  },
  server: {open: true}
}));
