import {defineConfig} from 'vite';
import fs from 'fs';
import path from 'path';

const LOADERS_GL_VERSION = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../modules/core/package.json'), 'utf8')
).version;

const DEDUPED_PACKAGES = [
  '@deck.gl/core',
  '@deck.gl/extensions',
  '@deck.gl/geo-layers',
  '@deck.gl/layers',
  '@deck.gl/mesh-layers',
  '@deck.gl/react',
  '@luma.gl/constants',
  '@luma.gl/core',
  '@luma.gl/engine',
  '@luma.gl/gltf',
  '@luma.gl/shadertools',
  '@luma.gl/webgl',
  'react',
  'react-dom'
];

/** Ensures deck.gl and luma.gl resolve from the example package itself. */
const resolvePackageDirectory = (packageRootDir: string, packageName: string): string => {
  const localPackagePath = path.resolve(packageRootDir, 'node_modules', packageName, 'package.json');
  if (fs.existsSync(localPackagePath)) {
    return path.dirname(localPackagePath);
  }

  const workspacePackagePath = path.resolve(
    packageRootDir,
    '../../../node_modules',
    packageName,
    'package.json'
  );
  if (fs.existsSync(workspacePackagePath)) {
    return path.dirname(workspacePackagePath);
  }

  return path.resolve(packageRootDir, 'node_modules', packageName);
};

/** Ensures deck.gl and luma.gl resolve from the example package itself. */
const getPackageAliases = (packageRootDir: string): Record<string, string> => {
  const aliases: Record<string, string> = {};

  for (const packageName of DEDUPED_PACKAGES) {
    aliases[packageName] = resolvePackageDirectory(packageRootDir, packageName);
  }

  return aliases;
};

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const aliases = {
    ...getPackageAliases(__dirname)
  };

  return {
    define: {
      __VERSION__: JSON.stringify(LOADERS_GL_VERSION)
    },
    resolve: {
      alias: [
        {
          find: /^@loaders\.gl\/([^/]+)\/(.+)$/,
          replacement: path.resolve(__dirname, '../../../modules/$1/src/$2.ts')
        },
        {
          find: /^@loaders\.gl\/([^/]+)$/,
          replacement: path.resolve(__dirname, '../../../modules/$1/src/index.ts')
        },
        {
          find: /^@loaders\.gl\/arrow\/transport$/,
          replacement: path.resolve(__dirname, '../../../modules/arrow/src/transport.ts')
        },
        {
          find: /^@loaders\.gl\/compression\/(.+)$/,
          replacement: path.resolve(__dirname, '../../../modules/compression/src/$1.ts')
        },
        {
          find: /^@luma\.gl\/webgl\/constants$/,
          replacement: path.resolve(
            resolvePackageDirectory(__dirname, '@luma.gl/webgl'),
            'dist/constants/index.js'
          )
        },
        {
          find: /^fs$/,
          replacement: path.resolve(__dirname, './empty-module.js')
        },
        {
          find: /^path$/,
          replacement: path.resolve(__dirname, './empty-module.js')
        },
        {
          find: /^laz-perf$/,
          replacement: path.resolve(__dirname, './laz-perf-with-wasm.js')
        },
        ...Object.entries(aliases).map(([find, replacement]) => ({
          find,
          replacement
        }))
      ],
      dedupe: DEDUPED_PACKAGES,
      extensions: ['.ts', '.tsx', '.mjs', '.js', '.mts', '.jsx', '.json']
    },
    server: {open: true}
  };
});
