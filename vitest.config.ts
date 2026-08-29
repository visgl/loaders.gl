import fs from 'node:fs';
import path from 'node:path';

import {getVitestConfig} from '@vis.gl/dev-tools';
import {playwright} from '@vitest/browser-playwright';

import {createRangeServerMiddleware} from './scripts/range-server.mjs';

const LOCAL_FIXTURE_PREFIX = '/__loaders_gl_test_fixtures__/';

const excludePatterns = [
  '**/*.disabled.*',
  'modules/**/wip/**',
  'modules/3d-tiles/test/lib/styles/**',
  'modules/xml/test/sax-ts/testcases/**/!(issue-30).spec.ts',
  'modules/core/test/lib/api/create-data-source.spec.ts',
  'modules/i3s/test/i3s-content-loader.spec.ts',
  'modules/loader-utils/test/categories/mesh/**',
  'modules/mvt/test/lib/mapbox-vt-pbf/**',
  'modules/mvt/test/table-tile-source-loader-full.spec.ts',
  'modules/mvt/test/table-tile-source-loader-multi-world.spec.ts',
  'modules/polyfills/test/load-library/require-utils.spec.ts',
  'test/browser.ts',
  'test/init-browser-test.ts',
  'test/init-tests.ts',
  'test/modules.ts',
  'test/node.ts',
  'test/**/node_modules/**',
  'test/bench/**',
  'test/render/**'
];

const sharedTestOptions = {
  passWithNoTests: true,
  include: ['modules/**/*.spec.{ts,js}', 'test/**/*.spec.{ts,js}']
};
const browserOnlyPatterns = [
  'modules/**/*.node.spec.{ts,js}',
  'modules/**/*.node.slow.spec.{ts,js}',
  'modules/**/*.external.spec.{ts,js}',
  'modules/**/*.slow.spec.{ts,js}',
  'test/**/*.node.spec.{ts,js}',
  'test/**/*.node.slow.spec.{ts,js}',
  'test/**/*.external.spec.{ts,js}',
  'test/**/*.slow.spec.{ts,js}'
];
const browserLaunchArguments = [
  '--disable-dev-shm-usage',
  '--enable-unsafe-webgpu',
  '--ignore-gpu-blocklist',
  ...(process.env.CI ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [])
];
const createHeadlessBrowser = () => ({
  enabled: true,
  instances: [{browser: 'chromium' as const, headless: true}],
  provider: playwright({launchOptions: {args: browserLaunchArguments}})
});
const coverageConfig = loadCoverageConfig();

export default getVitestConfig({
  excludePatterns,
  launchOptions: {
    args: browserLaunchArguments
  },
  overrides: {
    define: {
      __TEST_REPOSITORY_ROOT__: JSON.stringify(process.cwd())
    },
    plugins: [
      serveRangeRequestsPlugin(process.cwd()),
      serveLocalTestAssetsPlugin(process.cwd())
    ],
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
        '@math.gl/geometry-utils',
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
        color: 'blue',
        browser: {enabled: false},
        environment: 'node',
        exclude: excludePatterns,
        include: [
          'modules/**/*.node.spec.{ts,js}',
          'modules/**/*.cross.spec.{ts,js}',
          'test/**/*.node.spec.{ts,js}',
          'test/**/*.cross.spec.{ts,js}'
        ],
        isolate: true,
        passWithNoTests: true,
        pool: 'threads',
        setupFiles: ['./test/vitest-setup-node.ts']
      }
    },
    browser: {
      test: {
        ...sharedTestOptions,
        color: 'green',
        environment: 'node',
        exclude: [...browserOnlyPatterns, ...excludePatterns],
        fileParallelism: false,
        isolate: true,
        maxWorkers: 1,
        minWorkers: 1,
        setupFiles: ['./test/vitest-setup-browser.ts']
      }
    },
    headless: {
      test: {
        ...sharedTestOptions,
        color: 'cyan',
        environment: 'node',
        exclude: [...browserOnlyPatterns, ...excludePatterns],
        fileParallelism: false,
        isolate: true,
        maxWorkers: 1,
        minWorkers: 1,
        setupFiles: ['./test/vitest-setup-browser.ts']
      }
    },
    'slow-node': {
      test: {
        browser: {enabled: false},
        color: 'yellow',
        environment: 'node',
        exclude: excludePatterns,
        include: [
          'modules/**/*.node.slow.spec.{ts,js}',
          'test/**/*.node.slow.spec.{ts,js}'
        ],
        isolate: true,
        passWithNoTests: true,
        pool: 'threads',
        setupFiles: ['./test/vitest-setup-node.ts']
      }
    },
    'slow-headless': {
      test: {
        ...sharedTestOptions,
        browser: createHeadlessBrowser(),
        color: 'yellow',
        environment: 'node',
        exclude: [
          'modules/**/*.node.slow.spec.{ts,js}',
          'modules/**/*.external.spec.{ts,js}',
          'test/**/*.node.slow.spec.{ts,js}',
          'test/**/*.external.spec.{ts,js}',
          ...excludePatterns
        ],
        fileParallelism: false,
        include: ['modules/**/*.slow.spec.{ts,js}', 'test/**/*.slow.spec.{ts,js}'],
        isolate: true,
        maxWorkers: 1,
        minWorkers: 1,
        setupFiles: ['./test/vitest-setup-browser.ts']
      }
    },
    'external-node': {
      test: {
        browser: {enabled: false},
        color: 'magenta',
        environment: 'node',
        exclude: excludePatterns,
        include: [
          'modules/**/*.node.external.spec.{ts,js}',
          'test/**/*.node.external.spec.{ts,js}'
        ],
        isolate: true,
        passWithNoTests: true,
        pool: 'threads',
        setupFiles: ['./test/vitest-setup-node-external.ts']
      }
    },
    'external-headless': {
      test: {
        browser: createHeadlessBrowser(),
        color: 'magenta',
        environment: 'node',
        exclude: [
          'modules/**/*.node.external.spec.{ts,js}',
          'test/**/*.node.external.spec.{ts,js}',
          ...excludePatterns
        ],
        fileParallelism: false,
        include: ['modules/**/*.external.spec.{ts,js}', 'test/**/*.external.spec.{ts,js}'],
        isolate: true,
        maxWorkers: 1,
        minWorkers: 1,
        passWithNoTests: true,
        setupFiles: ['./test/vitest-setup-browser-external.ts']
      }
    }
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'lcov', 'json', 'json-summary'],
    include: coverageConfig.include,
    exclude: [...coverageConfig.exclude, '**/*.json'],
    excludeAfterRemap: true
  }
});

/** Serves repository fixtures and built workers without Vite transforms or HTML fallback. */
function serveLocalTestAssetsPlugin(repositoryRoot: string) {
  return {
    name: 'loaders-gl-test-built-assets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url || (request.method !== 'GET' && request.method !== 'HEAD')) {
          next();
          return;
        }

        const pathname = decodeURIComponent(request.url.split('?')[0]);
        const repositoryPath = getLocalTestAssetPath(pathname);
        if (!repositoryPath) {
          next();
          return;
        }

        const filePath = path.resolve(repositoryRoot, repositoryPath);
        if (
          !isFilePathInside(filePath, repositoryRoot) ||
          !fs.existsSync(filePath) ||
          !fs.statSync(filePath).isFile()
        ) {
          next();
          return;
        }

        const extension = path.extname(filePath);
        const contentTypes: Record<string, string> = {
          '.cjs': 'application/javascript',
          '.csv': 'text/csv',
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.json': 'application/json',
          '.mjs': 'application/javascript',
          '.txt': 'text/plain',
          '.wasm': 'application/wasm',
          '.xml': 'application/xml'
        };
        response.statusCode = 200;
        response.setHeader('Content-Type', contentTypes[extension] || 'application/octet-stream');
        response.setHeader('Content-Length', String(fs.statSync(filePath).size));
        if (request.method === 'HEAD') {
          response.end();
          return;
        }
        fs.createReadStream(filePath).pipe(response);
      });
    }
  };
}

/** Resolves a raw test-asset URL to a repository-relative path. */
function getLocalTestAssetPath(pathname: string): string | null {
  if (pathname.startsWith(LOCAL_FIXTURE_PREFIX)) {
    return pathname.slice(LOCAL_FIXTURE_PREFIX.length);
  }

  const modulePathIndex = pathname.indexOf('/modules/');
  const modulePath = modulePathIndex >= 0 ? pathname.slice(modulePathIndex) : '';
  return /^\/modules\/[^/]+\/dist\//.test(modulePath) ? modulePath.slice(1) : null;
}

/** Returns whether a resolved file remains inside the repository root. */
function isFilePathInside(filePath: string, repositoryRoot: string): boolean {
  const relativePath = path.relative(path.resolve(repositoryRoot), path.resolve(filePath));
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

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
  const filePath = pathname.startsWith(LOCAL_FIXTURE_PREFIX)
    ? path.join(repositoryRoot, pathname.slice(LOCAL_FIXTURE_PREFIX.length))
    : pathname.startsWith('/@fs/')
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
