import {defineConfig} from 'vite';
import fs from 'fs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);

/** Run against local source */
const getAliases = async (frameworkName, frameworkRootDir) => {
  const modules = await fs.promises.readdir(`${frameworkRootDir}/modules`);
  const aliases = {};
  modules.forEach((module) => {
    aliases[`${frameworkName}/${module}`] = `${frameworkRootDir}/modules/${module}/src`;
  });
  // console.log(aliases);
  return aliases;
};

// https://vitejs.dev/config/
export default defineConfig(async () => {
  return {
    resolve: {extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'], alias: {
        ...(await getAliases('@loaders.gl', `${__dirname}/../../..`)),
        fs: require.resolve('./empty-fs.js'),
        path: require.resolve('path-browserify'),
        process: require.resolve('process/browser'),
      }
    },
    server: {open: true}
  };
});
