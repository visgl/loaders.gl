import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';
import ts from 'typescript';

import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';
import {loadOcularConfig} from './load-ocular-config.mjs';

const require = createRequire(import.meta.url);
const VITEST_INTERNAL_BROWSER_PATH = require.resolve('vitest/internal/browser');
const TAPE_TEST_UTILS_PATH = fileURLToPath(new URL('./tape-test-utils.mjs', import.meta.url));

export async function getVitestConfig(options = {}) {
  const ocularConfig = options.ocularConfig || (await loadOcularConfig(options));
  const vitestConfig = ocularConfig.devtools?.vitest || {};
  const tsconfigProjects = vitestConfig.tsconfigProjects || ['./tsconfig.json'];
  const excludePatterns = vitestConfig.excludePatterns || [];
  const setupFiles = vitestConfig.setupFiles || ['./test/vitest-setup.ts'];
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
    plugins: [serveRangeRequestsPlugin(repositoryRoot)],
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
            passWithNoTests: true,
            setupFiles,
            include: ['modules/**/*.node.spec.{ts,js}', 'test/**/*.node.spec.{ts,js}'],
            exclude: ['modules/**/*.browser.spec.{ts,js}', 'test/**/*.browser.spec.{ts,js}', ...excludePatterns],
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
            setupFiles,
            include: ['modules/**/*.spec.{ts,js}', 'test/**/*.spec.{ts,js}'],
            exclude: ['modules/**/*.node.spec.{ts,js}', 'test/**/*.node.spec.{ts,js}', ...excludePatterns],
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
            setupFiles,
            include: ['modules/**/*.spec.{ts,js}', 'test/**/*.spec.{ts,js}'],
            exclude: ['modules/**/*.node.spec.{ts,js}', 'test/**/*.node.spec.{ts,js}', ...excludePatterns],
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
        reporter: ['text', 'lcov'],
        all: false,
        include: c8CoverageConfig.include,
        exclude: [...c8CoverageConfig.exclude, '**/*.json', ...(vitestConfig.coverage?.exclude || [])],
        excludeAfterRemap: true
      }
    }
  });
}

/**
 * Serves local fixture files with HTTP byte-range support for browser tests.
 * Vite's static middleware can answer these files with 200 responses, but range-oriented loaders need 206.
 */
function serveRangeRequestsPlugin(repositoryRoot) {
  return {
    name: 'loaders-gl-test-range-requests',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const rangeHeader = request.headers.range;
        if (!rangeHeader || (request.method !== 'GET' && request.method !== 'HEAD')) {
          next();
          return;
        }

        const filePath = getRangeRequestFilePath(request.url, repositoryRoot);
        if (!filePath) {
          next();
          return;
        }

        const fileStat = getRangeRequestFileStat(filePath, repositoryRoot);
        if (!fileStat) {
          next();
          return;
        }

        const ranges = parseRangeHeader(rangeHeader, fileStat.size);
        if (!ranges) {
          next();
          return;
        }
        if (ranges.length === 0) {
          response.writeHead(416, {'Content-Range': `bytes */${fileStat.size}`});
          response.end();
          return;
        }

        if (ranges.length === 1) {
          serveSingleByteRange(request, response, next, filePath, ranges[0], fileStat.size);
          return;
        }

        serveMultipartByteRanges(request, response, next, filePath, ranges, fileStat.size);
      });
    }
  };
}

/**
 * Serves one normalized byte range from a file.
 */
function serveSingleByteRange(request, response, next, filePath, range, fileSize) {
  response.writeHead(206, {
    'Accept-Ranges': 'bytes',
    'Content-Length': String(range.end - range.start + 1),
    'Content-Range': `bytes ${range.start}-${range.end}/${fileSize}`
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  const fileStream = fs.createReadStream(filePath, range);
  fileStream.on('error', next);
  fileStream.pipe(response);
}

/**
 * Serves normalized byte ranges with a multipart/byteranges response body.
 */
function serveMultipartByteRanges(request, response, next, filePath, ranges, fileSize) {
  const boundary = `loaders-gl-vitest-${Date.now().toString(36)}`;
  response.writeHead(206, {
    'Accept-Ranges': 'bytes',
    'Content-Type': `multipart/byteranges; boundary=${boundary}`
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  void writeMultipartByteRanges(response, filePath, ranges, fileSize, boundary).catch(next);
}

/**
 * Writes a multipart/byteranges response sequentially so the fixture file is streamed, not buffered.
 */
async function writeMultipartByteRanges(response, filePath, ranges, fileSize, boundary) {
  for (const range of ranges) {
    response.write(
      `--${boundary}\r\n` +
        'Content-Type: application/octet-stream\r\n' +
        `Content-Range: bytes ${range.start}-${range.end}/${fileSize}\r\n\r\n`
    );
    await writeFileRange(response, filePath, range);
    response.write('\r\n');
  }

  response.end(`--${boundary}--\r\n`);
}

/**
 * Pipes one file range to an HTTP response without ending the response.
 */
function writeFileRange(response, filePath, range) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath, range);
    fileStream.on('error', reject);
    fileStream.on('end', resolve);
    fileStream.pipe(response, {end: false});
  });
}

/**
 * Resolves a Vite browser-test URL to a repository-local file path.
 */
function getRangeRequestFilePath(url, repositoryRoot) {
  if (!url) {
    return null;
  }

  const pathname = decodeURIComponent(url.split('?')[0]);
  const filePath = pathname.startsWith('/@fs/')
    ? pathname.slice('/@fs/'.length)
    : path.join(repositoryRoot, pathname);

  const resolvedFilePath = path.resolve(filePath);
  const resolvedRepositoryRoot = path.resolve(repositoryRoot);
  return isFilePathInside(resolvedFilePath, resolvedRepositoryRoot) ? resolvedFilePath : null;
}

/**
 * Returns stat information for an existing regular file.
 */
function getRangeRequestFileStat(filePath) {
  try {
    const fileStat = fs.statSync(filePath);
    return fileStat.isFile() ? fileStat : null;
  } catch {
    return null;
  }
}

/**
 * Parses an HTTP byte-range header into satisfiable inclusive ranges.
 */
function parseRangeHeader(rangeHeader, fileSize) {
  if (!rangeHeader.startsWith('bytes=')) {
    return null;
  }

  const ranges = [];
  for (const rangeText of rangeHeader.slice('bytes='.length).split(',')) {
    const range = parseRangeText(rangeText.trim(), fileSize);
    if (range) {
      ranges.push(range);
    }
  }
  return ranges;
}

/**
 * Parses one byte-range-set value.
 */
function parseRangeText(rangeText, fileSize) {
  const match = /^(\d*)-(\d*)$/.exec(rangeText);
  if (!match) {
    return null;
  }

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!suffixLength) {
      return null;
    }
    return {
      start: Math.max(fileSize - suffixLength, 0),
      end: fileSize - 1
    };
  }

  const start = Number(match[1]);
  const end = Math.min(match[2] ? Number(match[2]) : fileSize - 1, fileSize - 1);
  return start < fileSize && end >= start ? {start, end} : null;
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
