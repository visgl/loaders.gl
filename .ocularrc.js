/** @typedef {import('@vis.gl/dev-tools').OcularConfig} OcularConfig */

import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const devModules = join(packageRoot, 'dev-modules');
const testDir = join(packageRoot, 'test');

/** @type {OcularConfig} */
const config = {
  babel: false,

  lint: {
    paths: ['modules', 'apps', 'dev-docs', 'docs', 'test'], //, 'examples'],
    extensions: ['js', 'jsx', 'cjs', 'mjs', 'ts', 'tsx', 'md'] // , 'mdx'],
  },

  // typescript: {
  //   project: 'tsconfig.build.json'
  // },

  aliases: {
    // TEST
    test: testDir
  },

  nodeAliases: {
    '@maplibre/mlt': join(packageRoot, 'modules/mlt/src/libs/mlt-decoder.cjs')
  },

  coverage: {
    test: 'browser'
  },

  // Local extensions for the in-repo devtools workspace.
  // Reusable logic lives under `dev-modules/devtools-extensions/`; repo-specific policy belongs here.
  devtools: {
    vitest: {
      // Plain `*.spec.*` files run in both Node and browser projects unless explicitly excluded.
      // Use `.node.spec.*`, `.browser.spec.*`, or conditional runtime helpers for runtime-specific cases.
      excludePatterns: [
        '**/*.disabled.*',
        'modules/**/wip/**',
        'modules/3d-tiles/test/lib/classes/tile-3d-batch-table-hierarchy.spec.ts',
        'modules/3d-tiles/test/lib/styles/**',
        'modules/core/test/lib/api/create-data-source.spec.ts',
        'modules/csv/test/csv-writer-papaparse.spec.ts',
        'modules/i3s/test/i3s-content-loader.spec.ts',
        'modules/las/test/**',
        'modules/loader-utils/test/categories/mesh/**',
        'modules/math/test/geometry/attributes/compute-vertex-normals.spec.js',
        'modules/mvt/test/lib/mapbox-vt-pbf/**',
        'modules/mvt/test/table-tile-source-loader-full.spec.ts',
        'modules/mvt/test/table-tile-source-loader-multi-world.spec.ts',
        'modules/polyfills/test/load-library/require-utils.spec.ts',
        'modules/video/test/**',
        'modules/xml/test/sax-ts/testcases/issue-30.spec.ts',
        'modules/zarr/test/**',
        'test/browser.ts',
        'test/init-browser-test.ts',
        'test/init-tests.ts',
        'test/modules.ts',
        'test/node.ts',
        'test/bench/**',
        'test/render/**'
      ],
      nodeExcludePatterns: [
        // These shared specs currently depend on browser fetch semantics or worker entrypoints
        // that are not valid in the Node Vitest project.
        'modules/arrow/test/triangulate-on-worker.spec.ts',
        'modules/compression/test/compression.spec.ts',
        'modules/crypto/test/crypto-worker.spec.ts',
        'modules/draco/test/draco-loader.spec.ts',
        'modules/draco/test/draco-writer.spec.ts',
        'modules/parquet/test/parquet-arrow-loader.spec.ts',
        'modules/parquet/test/parquetjs/integration.spec.ts',
        'modules/potree/test/potree-source.spec.ts',
        'modules/textures/test/basis-loader.spec.ts',
        'modules/textures/test/ktx2-basis-universal-texture-writer.spec.ts'
      ],
      softwareGpu: Boolean(process.env.CI)
    }
  },

  bundle: {
    globalName: 'loaders',
    externals: ['fs', 'path', 'util', 'events', 'stream', 'crypto', 'http', 'https'],
    target: ['chrome110', 'firefox110', 'safari15'],
    format: 'umd',
    globals: {
      '@loaders.gl/*': 'globalThis.loaders'
    }
  },

  entry: {
    test: 'test/node.ts',
    'test-browser': 'index.html',
    bench: 'test/bench/node.js',
    'bench-browser': 'test/bench/index.html',
    size: 'test/size/import-nothing.js'
  }
  // entry: {
  //   test: 'test/index.ts',
  //   'test-browser': 'test/browser.ts',
  //   bench: 'test/bench/index.js',
  //   'bench-browser': 'test/bench/browser.js',
  //   size: 'test/size/import-nothing.js'
  // }
};

export default config;
