import {defineConfig} from 'vite';
import fs from 'fs';
import path from 'path';

const LOADERS_GL_VERSION = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../modules/core/package.json'), 'utf8')
).version;

const DEDUPED_PACKAGES = [
  '@deck.gl/core',
  '@deck.gl/extensions',
  '@deck.gl/geo-layers',
  '@deck.gl/layers',
  '@deck.gl/mesh-layers',
  '@deck.gl/react',
  '@deck.gl/widgets',
  '@luma.gl/constants',
  '@luma.gl/core',
  '@luma.gl/engine',
  '@luma.gl/gltf',
  '@luma.gl/shadertools',
  '@luma.gl/webgl',
  'react',
  'react-dom'
];

/** Run against local source */
const getAliases = async (frameworkName, frameworkRootDir) => {
  const modules = await fs.promises.readdir(`${frameworkRootDir}/modules`);
  const aliases = {};
  modules.forEach((module) => {
    // TODO: schema wasn't compatible with @deck.gl v9.0.32
    if (module !== 'schema') {
      aliases[`${frameworkName}/${module}`] = `${frameworkRootDir}/modules/${module}/src/index.ts`;
    }
  });
  // console.log(aliases);
  return aliases;
};

const getPackageAliases = (packageRootDir) => {
  const aliases = {};
  for (const packageName of DEDUPED_PACKAGES) {
    aliases[packageName] = path.resolve(packageRootDir, 'node_modules', packageName);
  }
  return aliases;
};

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  define: {
    __VERSION__: JSON.stringify(LOADERS_GL_VERSION)
  },
  resolve: {
    alias: {
      ...(await getAliases('@loaders.gl', `${__dirname}/../..`)),
      ...getPackageAliases(__dirname)
    },
    dedupe: DEDUPED_PACKAGES,
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.mts', '.jsx', '.json']
  },
  server: {open: true}
}));
