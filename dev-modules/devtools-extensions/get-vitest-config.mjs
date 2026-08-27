import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';
import ts from 'typescript';

import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';
import {loadOcularConfig} from './load-ocular-config.mjs';
import {createRangeServerMiddleware} from './range-server.mjs';

const require = createRequire(import.meta.url);
const VITEST_INTERNAL_BROWSER_PATH = require.resolve('vitest/internal/browser');
const TAPE_TEST_UTILS_PATH = fileURLToPath(new URL('./tape-test-utils.mjs', import.meta.url));
const LOCAL_FIXTURE_PREFIX = '/__loaders_gl_test_fixtures__/';

export async function getVitestConfig(options = {}) {
  const ocularConfig = options.ocularConfig || (await loadOcularConfig(options));
  const vitestConfig = ocularConfig.devtools?.vitest || {};
  const tsconfigProjects = vitestConfig.tsconfigProjects || ['./tsconfig.json'];
  const excludePatterns = vitestConfig.excludePatterns || [];
  const browserExcludePatterns = vitestConfig.browserExcludePatterns || [];
  const sharedExcludePatterns = ['**/node_modules/**', ...excludePatterns];
  const nodeSetupFiles =
    vitestConfig.nodeSetupFiles || vitestConfig.setupFiles || ['./test/vitest-setup-node.ts'];
  const browserSetupFiles =
    vitestConfig.browserSetupFiles || vitestConfig.setupFiles || ['./test/vitest-setup-browser.ts'];
  const nodeExternalSetupFiles = vitestConfig.nodeExternalSetupFiles || [
    './test/vitest-setup-node-external.ts'
  ];
  const browserExternalSetupFiles = vitestConfig.browserExternalSetupFiles || [
    './test/vitest-setup-browser-external.ts'
  ];
  const browserName = vitestConfig.browserName || 'chromium';
  const testTimeout = vitestConfig.testTimeout || 60_000;
  const softwareGpu = Boolean(vitestConfig.softwareGpu);
  const tsconfigAliases = getTsconfigAliases(tsconfigProjects);
  const c8CoverageConfig = loadC8CoverageConfig();
  const repositoryRoot = process.cwd();
  const testAliases = [
    ...tsconfigAliases,
    {find: /^@loaders\.gl\/bson$/, replacement: path.resolve(repositoryRoot, 'modules/bson/src')},
    {find: /^@loaders\.gl\/bson\/test$/, replacement: path.resolve(repositoryRoot, 'modules/bson/test')},
    {find: /^tape$/, replacement: TAPE_TEST_UTILS_PATH},
    {find: /^tape-promise\/tape$/, replacement: TAPE_TEST_UTILS_PATH}
  ];

  const createPlaywrightProvider = () =>
    playwright({
      launchOptions: getPlaywrightLaunchOptions({
        ocularConfig,
        channel: vitestConfig.channel,
        softwareGpu,
        launchOptions: vitestConfig.launchOptions
      })
    });

  return defineConfig({
    define: {
      __TEST_REPOSITORY_ROOT__: JSON.stringify(repositoryRoot)
    },
    plugins: [serveRangeRequestsPlugin(repositoryRoot), serveLocalTestAssetsPlugin(repositoryRoot)],
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
    },
    resolve: {
      alias: [
        ...testAliases,
        {find: /^vitest\/internal\/browser$/, replacement: VITEST_INTERNAL_BROWSER_PATH}
      ]
    },
    test: {
      alias: testAliases,
      projects: [
        {
          extends: true,
          test: {
            name: 'node',
            color: 'blue',
            environment: 'node',
            pool: 'threads',
            isolate: true,
            passWithNoTests: true,
            testTimeout,
            setupFiles: nodeSetupFiles,
            include: [
              'modules/**/*.node.spec.{ts,js}',
              'modules/**/*.cross.spec.{ts,js}',
              'test/**/*.node.spec.{ts,js}',
              'test/**/*.cross.spec.{ts,js}'
            ],
            exclude: sharedExcludePatterns,
            browser: {
              enabled: false
            }
          }
        },
        {
          extends: true,
          test: {
            name: 'browser',
            color: 'green',
            environment: 'node',
            passWithNoTests: true,
            testTimeout,
            maxWorkers: 1,
            minWorkers: 1,
            fileParallelism: false,
            setupFiles: browserSetupFiles,
            include: ['modules/**/*.spec.{ts,js}', 'test/**/*.spec.{ts,js}'],
            exclude: [
              'modules/**/*.node.spec.{ts,js}',
              'modules/**/*.node.slow.spec.{ts,js}',
              'modules/**/*.slow.spec.{ts,js}',
              'modules/**/*.external.spec.{ts,js}',
              'test/**/*.node.spec.{ts,js}',
              'test/**/*.node.slow.spec.{ts,js}',
              'test/**/*.slow.spec.{ts,js}',
              'test/**/*.external.spec.{ts,js}',
              ...browserExcludePatterns,
              ...sharedExcludePatterns
            ],
            browser: {
              enabled: true,
              provider: createPlaywrightProvider(),
              instances: [{browser: browserName, headless: false}]
            }
          }
        },
        {
          extends: true,
          test: {
            name: 'headless',
            color: 'cyan',
            environment: 'node',
            passWithNoTests: true,
            testTimeout,
            maxWorkers: 1,
            minWorkers: 1,
            fileParallelism: false,
            setupFiles: browserSetupFiles,
            include: ['modules/**/*.spec.{ts,js}', 'test/**/*.spec.{ts,js}'],
            exclude: [
              'modules/**/*.node.spec.{ts,js}',
              'modules/**/*.node.slow.spec.{ts,js}',
              'modules/**/*.slow.spec.{ts,js}',
              'modules/**/*.external.spec.{ts,js}',
              'test/**/*.node.spec.{ts,js}',
              'test/**/*.node.slow.spec.{ts,js}',
              'test/**/*.slow.spec.{ts,js}',
              'test/**/*.external.spec.{ts,js}',
              ...browserExcludePatterns,
              ...sharedExcludePatterns
            ],
            browser: {
              enabled: true,
              provider: createPlaywrightProvider(),
              instances: [{browser: browserName, headless: true}]
            }
          }
        },
        {
          extends: true,
          test: {
            name: 'slow-node',
            color: 'yellow',
            environment: 'node',
            pool: 'threads',
            isolate: true,
            passWithNoTests: true,
            testTimeout,
            setupFiles: nodeSetupFiles,
            include: [
              'modules/**/*.node.slow.spec.{ts,js}',
              'test/**/*.node.slow.spec.{ts,js}'
            ],
            exclude: sharedExcludePatterns,
            browser: {
              enabled: false
            }
          }
        },
        {
          extends: true,
          test: {
            name: 'slow-headless',
            color: 'yellow',
            environment: 'node',
            passWithNoTests: true,
            testTimeout,
            maxWorkers: 1,
            minWorkers: 1,
            fileParallelism: false,
            setupFiles: browserSetupFiles,
            include: ['modules/**/*.slow.spec.{ts,js}', 'test/**/*.slow.spec.{ts,js}'],
            exclude: [
              'modules/**/*.node.slow.spec.{ts,js}',
              'test/**/*.node.slow.spec.{ts,js}',
              ...browserExcludePatterns,
              ...sharedExcludePatterns
            ],
            browser: {
              enabled: true,
              provider: createPlaywrightProvider(),
              instances: [{browser: browserName, headless: true}]
            }
          }
        },
        {
          extends: true,
          test: {
            name: 'external-node',
            color: 'magenta',
            environment: 'node',
            pool: 'threads',
            isolate: true,
            passWithNoTests: true,
            testTimeout,
            setupFiles: nodeExternalSetupFiles,
            include: [
              'modules/**/*.node.external.spec.{ts,js}',
              'test/**/*.node.external.spec.{ts,js}'
            ],
            exclude: sharedExcludePatterns,
            browser: {
              enabled: false
            }
          }
        },
        {
          extends: true,
          test: {
            name: 'external-headless',
            color: 'magenta',
            environment: 'node',
            passWithNoTests: true,
            testTimeout,
            maxWorkers: 1,
            minWorkers: 1,
            fileParallelism: false,
            setupFiles: browserExternalSetupFiles,
            include: ['modules/**/*.external.spec.{ts,js}', 'test/**/*.external.spec.{ts,js}'],
            exclude: [
              'modules/**/*.node.external.spec.{ts,js}',
              'test/**/*.node.external.spec.{ts,js}',
              ...browserExcludePatterns,
              ...sharedExcludePatterns
            ],
            browser: {
              enabled: true,
              provider: createPlaywrightProvider(),
              instances: [{browser: browserName, headless: true}]
            }
          }
        }
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'json', 'json-summary'],
        include: c8CoverageConfig.include,
        exclude: [...c8CoverageConfig.exclude, '**/*.json', ...(vitestConfig.coverage?.exclude || [])],
        excludeAfterRemap: true
      }
    }
  });
}

/** Serves repository fixtures and built workers without Vite transforms or HTML fallback. */
function serveLocalTestAssetsPlugin(repositoryRoot) {
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
        const contentTypes = {
          '.js': 'application/javascript',
          '.cjs': 'application/javascript',
          '.mjs': 'application/javascript',
          '.json': 'application/json',
          '.wasm': 'application/wasm',
          '.csv': 'text/csv',
          '.html': 'text/html',
          '.txt': 'text/plain',
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
function getLocalTestAssetPath(pathname) {
  if (pathname.startsWith(LOCAL_FIXTURE_PREFIX)) {
    return pathname.slice(LOCAL_FIXTURE_PREFIX.length);
  }

  const modulePathIndex = pathname.indexOf('/modules/');
  const modulePath = modulePathIndex >= 0 ? pathname.slice(modulePathIndex) : '';
  return /^\/modules\/[^/]+\/dist\//.test(modulePath) ? modulePath.slice(1) : null;
}

/**
 * Serves local fixture files with HTTP byte-range support for browser tests.
 * Vite's static middleware can answer these files with 200 responses, but range-oriented loaders need 206.
 */
function serveRangeRequestsPlugin(repositoryRoot) {
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

/**
 * Resolves a Vite browser-test URL to a repository-local file path.
 */
function resolveViteRangeRequestFilePath(url, repositoryRoot) {
  if (!url) {
    return null;
  }

  const pathname = decodeURIComponent(url.split('?')[0]);
  let filePath;
  if (pathname.startsWith(LOCAL_FIXTURE_PREFIX)) {
    filePath = path.join(repositoryRoot, pathname.slice(LOCAL_FIXTURE_PREFIX.length));
  } else if (pathname.startsWith('/@fs/')) {
    filePath = pathname.slice('/@fs/'.length);
  } else {
    filePath = path.join(repositoryRoot, pathname);
  }

  const resolvedFilePath = path.resolve(filePath);
  const resolvedRepositoryRoot = path.resolve(repositoryRoot);
  return isFilePathInside(resolvedFilePath, resolvedRepositoryRoot) ? resolvedFilePath : null;
}

/**
 * Returns true when a resolved path is inside a resolved parent directory.
 */
function isFilePathInside(filePath, parentDirectory) {
  const relativePath = path.relative(parentDirectory, filePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

/**
 * Loads the legacy c8 coverage include/exclude globs for Vitest coverage.
 * @returns {{include: string[] | undefined, exclude: string[]}} Coverage include and exclude globs.
 */
function loadC8CoverageConfig() {
  const configPath = path.resolve('.nycrc');
  if (!fs.existsSync(configPath)) {
    return {include: undefined, exclude: []};
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return {
    include: config.include,
    exclude: config.exclude || []
  };
}

function getTsconfigAliases(tsconfigProjects) {
  const aliasEntries = [];

  for (const tsconfigProject of tsconfigProjects) {
    const tsconfigPath = path.resolve(tsconfigProject);
    if (!fs.existsSync(tsconfigPath)) {
      continue;
    }

    const {config, error} = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    if (error || !config?.compilerOptions?.paths) {
      continue;
    }

    const baseUrl = config.compilerOptions.baseUrl || '.';
    const configDirectory = path.dirname(tsconfigPath);

    for (const [aliasPattern, targets] of Object.entries(config.compilerOptions.paths)) {
      const firstTarget = Array.isArray(targets) ? targets[0] : undefined;
      if (!firstTarget) {
        continue;
      }

      if (aliasPattern.endsWith('/*') && firstTarget.endsWith('/*')) {
        const escapedPrefix = escapeRegExp(aliasPattern.slice(0, -2));
        const replacementPrefix = path
          .resolve(configDirectory, baseUrl, firstTarget.slice(0, -2))
          .replace(/\\/g, '/');
        aliasEntries.push({
          key: aliasPattern,
          alias: {
            find: new RegExp(`^${escapedPrefix}/(.+)$`),
            replacement: `${replacementPrefix}/$1`
          }
        });
      } else {
        aliasEntries.push({
          key: aliasPattern,
          alias: {
            find: aliasPattern,
            replacement: path.resolve(configDirectory, baseUrl, firstTarget).replace(/\\/g, '/')
          }
        });
      }
    }
  }

  aliasEntries.sort((left, right) => right.key.length - left.key.length);
  return aliasEntries.map(entry => entry.alias);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
