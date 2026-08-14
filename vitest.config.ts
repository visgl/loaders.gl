import fs from 'node:fs';
import path from 'node:path';

import {getVitestConfig} from '@vis.gl/dev-tools';

import {createRangeServerMiddleware} from './scripts/range-server.mjs';

const excludePatterns = [
  '**/*.disabled.*',
  'modules/**/wip/**',
  'modules/3d-tiles/test/lib/classes/tile-3d-batch-table-hierarchy.spec.ts',
  'modules/3d-tiles/test/lib/styles/**',
  'modules/core/test/lib/api/create-data-source.spec.ts',
  'modules/csv/test/csv-writer-papaparse.spec.ts',
  'modules/i3s/test/i3s-content-loader.spec.ts',
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
];

const nodeExcludePatterns = [
  'modules/compression/test/compression.spec.ts',
  'modules/crypto/test/crypto-worker.spec.ts',
  'modules/deck-layers/test/any-layer.spec.ts',
  'modules/deck-layers/test/geoarrow-layer.spec.ts',
  'modules/deck-layers/test/image-source-layer.spec.ts',
  'modules/deck-layers/test/shared-tile-2d-view.spec.ts',
  'modules/deck-layers/test/splat-layer.spec.ts',
  'modules/deck-layers/test/tile-2d-source-layer.spec.ts',
  'modules/deck-layers/test/tile-3d-source-layer.spec.ts',
  'modules/deck-layers/test/vector-source-layer.spec.ts',
  'modules/draco/test/draco-loader.spec.ts',
  'modules/draco/test/draco-writer.spec.ts',
  'modules/parquet/test/parquet-arrow-loader.spec.ts',
  'modules/parquet/test/parquetjs/integration.spec.ts',
  'modules/potree/test/potree-source.spec.ts',
  'modules/textures/test/basis-loader.spec.ts',
  'modules/textures/test/ktx2-basis-universal-texture-writer.spec.ts',
  'modules/tiles/test/tileset/format-i3s/i3s-lod.spec.ts',
  'modules/tiles/test/tileset/helpers/get-frame-state.spec.ts',
  'modules/tiles/test/tileset/tileset-3d-traversal.spec.ts',
  'modules/tiles/test/tileset/tileset-traverser.spec.ts'
];

const browserExcludePatterns = ['modules/las/test/!(typescript-laz).spec.ts'];
const sharedTestOptions = {
  passWithNoTests: true,
  setupFiles: ['./test/vitest-setup.ts'],
  include: ['modules/**/*.spec.{ts,js}', 'test/**/*.spec.{ts,js}']
};
const browserLaunchArguments = [
  '--disable-dev-shm-usage',
  '--enable-unsafe-webgpu',
  '--ignore-gpu-blocklist',
  ...(process.env.CI ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [])
];
const coverageConfig = loadCoverageConfig();

export default getVitestConfig({
  excludePatterns,
  launchOptions: {
    args: browserLaunchArguments
  },
  overrides: {
    plugins: [serveRangeRequestsPlugin(process.cwd())],
    optimizeDeps: {
      noDiscovery: true,
      entries: [],
      include: [
        '@deck.gl/core',
        '@deck.gl/geo-layers',
        '@deck.gl/layers',
        '@duckdb/duckdb-wasm',
        '@luma.gl/core',
        '@luma.gl/engine',
        '@mapbox/martini',
        '@maplibre/mlt',
        '@math.gl/core',
        '@math.gl/culling',
        '@math.gl/geospatial',
        '@math.gl/polygon',
        '@math.gl/proj4',
        '@math.gl/types',
        '@math.gl/web-mercator',
        '@probe.gl/env',
        '@probe.gl/log',
        '@probe.gl/stats',
        '@repeaterjs/repeater',
        '@tmcw/togeojson',
        '@turf/rewind',
        '@xmldom/xmldom',
        'apache-arrow',
        'apache-arrow/type',
        'brotli/decompress',
        'bson',
        'copc',
        'crypto-js',
        'd3-dsv',
        'draco3d',
        'fast-xml-parser',
        'flatbuffers',
        'fuzzer',
        'geotiff',
        'get-pixels',
        'jszip',
        'ktx-parse',
        'lerc',
        'long',
        'lz4js',
        'ndarray',
        'node-int64',
        'pako',
        'parquet-wasm/esm/parquet_wasm.js',
        'pbf',
        'pmtiles',
        'save-pixels',
        'slice-source',
        'snappyjs',
        'sql.js',
        'thrift',
        'varint',
        'vitest',
        'web-streams-polyfill',
        'xlsx',
        'zarr',
        'zod',
        'zstd-codec'
      ]
    }
  },
  projects: {
    node: {
      test: {
        ...sharedTestOptions,
        color: 'blue',
        browser: {enabled: false},
        exclude: [
          'modules/**/*.browser.spec.{ts,js}',
          'test/**/*.browser.spec.{ts,js}',
          ...nodeExcludePatterns,
          ...excludePatterns
        ]
      }
    },
    browser: {
      test: {
        ...sharedTestOptions,
        color: 'green',
        environment: 'node',
        exclude: [
          'modules/**/*.node.spec.{ts,js}',
          'test/**/*.node.spec.{ts,js}',
          ...browserExcludePatterns,
          ...excludePatterns
        ]
      }
    },
    headless: {
      test: {
        ...sharedTestOptions,
        color: 'cyan',
        environment: 'node',
        exclude: [
          'modules/**/*.node.spec.{ts,js}',
          'test/**/*.node.spec.{ts,js}',
          ...browserExcludePatterns,
          ...excludePatterns
        ]
      }
    }
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov'],
    include: coverageConfig.include,
    exclude: [...coverageConfig.exclude, '**/*.json'],
    excludeAfterRemap: true
  }
});

function serveRangeRequestsPlugin(repositoryRoot: string) {
  const serveRangeRequest = createRangeServerMiddleware({
    rootDirectory: repositoryRoot,
    corsOrigin: '*',
    fallthrough: true,
    resolveFilePath: resolveViteRangeRequestFilePath
  });

  return {
    name: 'loaders-gl-test-range-requests',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const rangeHeader = request.headers.range;
        if (!rangeHeader || (request.method !== 'GET' && request.method !== 'HEAD')) {
          next();
          return;
        }
        serveRangeRequest(request, response, next);
      });
    }
  };
}

function resolveViteRangeRequestFilePath(url: string | undefined, repositoryRoot: string) {
  if (!url) {
    return null;
  }

  const pathname = decodeURIComponent(url.split('?')[0]);
  const filePath = pathname.startsWith('/@fs/')
    ? pathname.slice('/@fs/'.length)
    : path.join(repositoryRoot, pathname);
  const resolvedFilePath = path.resolve(filePath);
  const resolvedRepositoryRoot = path.resolve(repositoryRoot);
  const relativePath = path.relative(resolvedRepositoryRoot, resolvedFilePath);

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
    ? resolvedFilePath
    : null;
}

function loadCoverageConfig(): {include?: string[]; exclude: string[]} {
  const configPath = path.resolve('.nycrc');
  if (!fs.existsSync(configPath)) {
    return {include: undefined, exclude: []};
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return {include: config.include, exclude: config.exclude || []};
}
