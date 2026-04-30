import {defineConfig} from 'vite';
import fs from 'fs';

/** Run against local loaders.gl source. */
const getAliases = async (frameworkName: string, frameworkRootDir: string) => {
  const modules = await fs.promises.readdir(`${frameworkRootDir}/modules`);
  const aliases: Record<string, string> = {};
  modules.forEach((module) => {
    aliases[`${frameworkName}/${module}`] = `${frameworkRootDir}/modules/${module}/src`;
  });
  return aliases;
};

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    alias: await getAliases('@loaders.gl', `${__dirname}/../../..`)
  },
  server: {open: true}
}));
