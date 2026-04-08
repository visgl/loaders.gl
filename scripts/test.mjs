#!/usr/bin/env node

import {spawn} from 'child_process';
import {mkdirSync, rmSync, writeFileSync} from 'fs';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';

import {createServer} from 'vite';
import {chromium} from 'playwright';

import ocularConfig from '../.ocularrc.js';
import {getOcularConfig} from '../node_modules/@vis.gl/dev-tools/dist/helpers/get-ocular-config.js';
import diffImages from '../node_modules/@probe.gl/test-utils/dist/utils/diff-images.js';

const TEST_TIMEOUT_MILLISECONDS = 10 * 60 * 1000;
const MAX_CONSOLE_MESSAGE_LENGTH = 500;
const COVERAGE_TEMP_DIRECTORY = './coverage/tmp';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const devToolsViteConfig = resolve(
  repositoryRoot,
  'node_modules/@vis.gl/dev-tools/dist/configuration/vite.config.js'
);
const args = process.argv.slice(2);
const mode = args[0] || '';
const keepBrowserOpen = args.includes('--keep-open');

if (!mode) {
  printUsage();
} else if (mode === 'full') {
  process.exitCode = await runFullTest({keepBrowserOpen});
} else if (!isBrowserTestMode(mode)) {
  process.exitCode = await runNodeTestMode(mode, args);
} else {
  process.exitCode = await runPlaywrightBrowserTest(mode, {keepBrowserOpen});
}

/**
 * Prints supported test runner modes.
 */
function printUsage() {
  console.log(`loaders.gl test runner

Usage:
  yarn test <mode> [options]

Modes:
  full             Run node tests, then browser tests in headless mode
  node             Run node tests against source aliases
  browser          Run browser tests in a headed browser
  browser-headless Run browser tests in a headless browser
  bench            Run node benchmarks
  bench-browser    Run browser benchmarks in a headed browser
  cover            Run browser tests and generate coverage
  dist             Run node and browser tests against transpiled code

Options:
  --keep-open      Keep headed browsers open after completion for manual inspection
`);
}

/**
 * Returns whether a test mode should be run through the Playwright browser harness.
 * @param {string} testMode Test mode from the command line.
 * @returns {boolean} True when the test mode is a browser mode.
 */
function isBrowserTestMode(testMode) {
  return (
    testMode === 'cover' ||
    testMode === 'browser' ||
    testMode === 'browser-headless' ||
    /\bbrowser\b/.test(testMode)
  );
}

/**
 * Runs the default full test sequence.
 * @param {{keepBrowserOpen: boolean}} options Browser test runner options.
 * @returns {Promise<number>} Process exit code.
 */
async function runFullTest(options) {
  const nodeExitCode = await runNodeTest('test', 'src');
  if (nodeExitCode) {
    return nodeExitCode;
  }
  return await runPlaywrightBrowserTest('browser-headless', options);
}

/**
 * Runs a Node.js test mode without importing the Puppeteer-backed ocular browser driver.
 * @param {string} testMode Test mode from the command line.
 * @param {string[]} testArgs Arguments passed to this script.
 * @returns {Promise<number>} Process exit code.
 */
async function runNodeTestMode(testMode, testArgs) {
  if (testMode === 'node') {
    return await runNodeTest('test', 'src');
  }

  if (testMode === 'dist') {
    const nodeExitCode = await runNodeTest('test', 'dist');
    if (nodeExitCode) {
      return nodeExitCode;
    }
    return await runPlaywrightBrowserTest('browser-headless', {
      keepBrowserOpen: testArgs.includes('--keep-open')
    });
  }

  const ocularNodeConfig = await getOcularConfig({aliasMode: 'src', root: repositoryRoot});
  if (testMode in ocularNodeConfig.entry) {
    return await runNodeTest(testMode, 'src');
  }

  throw new Error(`Unknown test mode ${testMode}`);
}

/**
 * Runs a Node.js test entry with ocular aliases registered.
 * @param {string} entryKey Ocular entry key.
 * @param {'src' | 'dist'} aliasMode Alias mode to use for module resolution.
 * @returns {Promise<number>} Process exit code.
 */
async function runNodeTest(entryKey, aliasMode) {
  const ocularNodeConfig = await getOcularConfig({aliasMode, root: repositoryRoot});
  const entry = resolveNodeEntry(ocularNodeConfig, entryKey);
  writeFileSync(resolve(ocularNodeConfig.ocularPath, '.alias.json'), JSON.stringify(ocularNodeConfig.aliases));

  const nodeArgs = ocularNodeConfig.esm
    ? [
        '--import',
        `${ocularNodeConfig.ocularPath}/dist/helpers/esm-register.js`,
        '--es-module-specifier-resolution=node',
        entry
      ]
    : ['-r', `${ocularNodeConfig.ocularPath}/dist/helpers/cjs-register.cjs`, entry];

  return await runProcess(process.execPath, nodeArgs);
}

/**
 * Resolves an ocular Node.js entry.
 * @param {Record<string, any>} ocularNodeConfig Ocular configuration.
 * @param {string} entryKey Ocular entry key.
 * @returns {string} Absolute entry path.
 */
function resolveNodeEntry(ocularNodeConfig, entryKey) {
  const entry = ocularNodeConfig.entry[entryKey];
  if (typeof entry === 'string') {
    return resolve(entry);
  }
  throw new Error(`Cannot find entry point ${entryKey} in ocular config.`);
}

/**
 * Runs a Vite-backed browser test page in Playwright.
 * @param {string} testMode Browser test mode from the command line.
 * @param {{keepBrowserOpen: boolean}} options Browser test runner options.
 * @returns {Promise<number>} Process exit code.
 */
async function runPlaywrightBrowserTest(testMode, options) {
  const viteMode = getViteMode(testMode);
  const collectCoverage = testMode === 'cover';
  const headless = collectCoverage || /\bheadless\b/.test(testMode);
  const title = `${viteMode === 'bench' ? 'Bench' : 'Browser'} Test`;
  let failures = 0;
  let browser = null;
  let page = null;
  let server = null;
  let timeoutId = null;
  let coverageStarted = false;
  let coverageStopped = false;

  console.log(`Running ${testMode} tests...`);
  console.log(`browser-driver: ${title}`);

  try {
    server = await createServer({
      configFile: devToolsViteConfig,
      mode: viteMode,
      server: {port: 5173}
    });
    await server.listen();
    const serverUrl = server.resolvedUrls?.local[0];
    if (!serverUrl) {
      throw new Error('Vite server did not report a local URL.');
    }

    console.log(`browser-driver: Started server at ${serverUrl}`);

    const browserOptions = ocularConfig.browserTest?.browser || {};
    browser = await chromium.launch({...browserOptions, headless});
    console.log(`browser-driver: Launched browser version ${browser.version()}`);

    page = await browser.newPage();
    let pageLoaded = false;
    let resolveTestComplete = null;
    page.setDefaultNavigationTimeout(0);
    page.on('console', event => logConsoleMessage(event, headless));
    page.on('pageerror', error => {
      failures++;
      console.error(error);
      resolveTestComplete?.(error.message);
    });
    page.once('load', () => {
      pageLoaded = true;
    });
    page.on('requestfailed', request => {
      if (pageLoaded) {
        return;
      }
      failures++;
      const failure = request.failure();
      console.error(`cannot load ${request.url()}: ${failure?.errorText || 'unknown error'}`);
    });

    const testComplete = new Promise(resolveComplete => {
      resolveTestComplete = resolveComplete;
      timeoutId = setTimeout(
        () => resolveComplete(`Timed out after ${TEST_TIMEOUT_MILLISECONDS / 1000}s`),
        TEST_TIMEOUT_MILLISECONDS
      );
    });
    await registerBrowserCallbacks(page, headless, resolveTestComplete, () => failures++);

    if (collectCoverage) {
      clearCoverage();
      await page.coverage.startJSCoverage({includeRawScriptCoverage: true});
      coverageStarted = true;
    }

    console.log('browser-driver: Loading page in browser...');
    const browserEntry = ocularConfig.entry[`${viteMode}-browser`];
    await page.goto(new URL(browserEntry, serverUrl).href);

    const message = await testComplete;
    const isTimeout = message?.startsWith('Timed out after ');
    const exitCode = failures || isTimeout ? 1 : 0;
    const status = exitCode === 0 ? 'successful' : 'failed';
    console.log(
      `browser-driver: ${title} ${status}: ${message || (failures ? `${failures} failed` : 'All tests passed')}`
    );
    if (collectCoverage) {
      const coverage = await page.coverage.stopJSCoverage();
      coverageStopped = true;
      if (!exitCode) {
        writeCoverage(coverage);
        await browser?.close();
        browser = null;
        await server?.close();
        server = null;
        const coverageExitCode = await generateCoverageReport();
        if (coverageExitCode) {
          return coverageExitCode;
        }
      }
    }
    if (options.keepBrowserOpen) {
      console.log('browser-driver: Keeping browser open. Press Ctrl-C to exit.');
      await waitForInterrupt();
    }
    return exitCode;
  } catch (error) {
    console.error(`browser-driver: ${title} failed: ${error.message}`);
    return 1;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (coverageStarted && !coverageStopped) {
      await page?.coverage.stopJSCoverage().catch(() => {});
    }
    await browser?.close();
    await server?.close();
  }
}

/**
 * Clears raw c8 browser coverage data.
 */
function clearCoverage() {
  rmSync(COVERAGE_TEMP_DIRECTORY, {force: true, recursive: true});
  mkdirSync(COVERAGE_TEMP_DIRECTORY, {recursive: true});
}

/**
 * Writes Playwright Chrome coverage in c8-compatible raw coverage files.
 * @param {Array<Record<string, any>>} coverage Playwright JavaScript coverage.
 */
function writeCoverage(coverage) {
  const outputFile = `${COVERAGE_TEMP_DIRECTORY}/coverage-${Date.now()}`;
  let index = 0;
  for (const coverageEntry of coverage) {
    const rawCoverage = coverageEntry.rawScriptCoverage;
    if (!rawCoverage?.url) {
      continue;
    }
    const filePath = rawCoverage.url.replace(/^http:\/\/localhost:\d+\//, '');
    if (filePath.match(/(^|\/)(node_modules|test|@vite)\//)) {
      continue;
    }

    const fileUrl = `file://${resolve(filePath)}`;
    rawCoverage.url = fileUrl;
    const sourcemapCache = {};
    const [generatedSource, sourcemapDataUrl] = coverageEntry.text.split(/\/\/# sourceMappingURL=/);
    if (sourcemapDataUrl) {
      sourcemapCache[fileUrl] = {
        lineLengths: generatedSource.split('\n').map(line => line.length),
        data: sourcemapFromDataUrl(sourcemapDataUrl)
      };
    }
    writeFileSync(
      `${outputFile}-${index++}.json`,
      JSON.stringify({
        result: [rawCoverage],
        'source-map-cache': sourcemapCache
      }),
      'utf8'
    );
  }
}

/**
 * Parses a Vite inline sourcemap data URL.
 * @param {string} url Sourcemap data URL.
 * @returns {Record<string, any> | null} Parsed sourcemap.
 */
function sourcemapFromDataUrl(url) {
  const [format, data] = url.split(',');
  const base64 = format.endsWith('base64');
  const decodedData = base64 ? Buffer.from(data, 'base64').toString('utf8') : data;
  try {
    return JSON.parse(decodedData);
  } catch {
    return null;
  }
}

/**
 * Generates text and lcov coverage reports from raw c8 coverage.
 * @returns {Promise<number>} Process exit code.
 */
async function generateCoverageReport() {
  return await runProcess('npx', ['c8', 'report', '--reporter=text', '--reporter=lcov']);
}

/**
 * Waits until the user interrupts the manual browser inspection session.
 * @returns {Promise<void>} Resolves when the process receives SIGINT or SIGTERM.
 */
function waitForInterrupt() {
  return new Promise(resolveInterrupt => {
    process.once('SIGINT', resolveInterrupt);
    process.once('SIGTERM', resolveInterrupt);
  });
}

/**
 * Runs a child process and forwards stdio.
 * @param {string} command Command to run.
 * @param {string[]} commandArgs Command arguments.
 * @returns {Promise<number>} Process exit code.
 */
function runProcess(command, commandArgs) {
  return new Promise(resolveExitCode => {
    const childProcess = spawn(command, commandArgs, {
      cwd: repositoryRoot,
      env: {...process.env, NODE_ENV: 'test'},
      stdio: 'inherit'
    });

    childProcess.on('exit', exitCode => resolveExitCode(exitCode ?? 1));
    childProcess.on('error', error => {
      console.error(error);
      resolveExitCode(1);
    });
  });
}

/**
 * Registers Playwright functions that the browser tests call to report status.
 * @param {import('playwright').Page} page Playwright page.
 * @param {boolean} headless Whether the browser is running headlessly.
 * @param {(message: string) => void} resolveComplete Test completion callback.
 * @param {() => number} recordFailure Failure counter callback.
 * @returns {Promise<void>} Resolves after all callbacks are registered.
 */
async function registerBrowserCallbacks(page, headless, resolveComplete, recordFailure) {
  await page.exposeFunction('browserTestDriver_fail', recordFailure);
  await page.exposeFunction('browserTestDriver_finish', message => resolveComplete(message || ''));
  await page.exposeFunction('browserTestDriver_emulateInput', event => emulateInput(page, event));
  await page.exposeFunction('browserTestDriver_captureAndDiffScreen', options =>
    captureAndDiffScreen(page, headless, options)
  );
  if (headless) {
    await page.exposeFunction('browserTestDriver_isHeadless', () => true);
  }
}

/**
 * Maps ocular browser modes to Vite modes.
 * @param {string} testMode Browser test mode from the command line.
 * @returns {string} Vite mode to use for the browser entrypoint.
 */
function getViteMode(testMode) {
  return testMode === 'cover' || testMode === 'browser' || testMode === 'browser-headless'
    ? 'test'
    : testMode.replace('-browser', '').replace('-headless', '');
}

/**
 * Mirrors browser console messages in headless mode.
 * @param {import('playwright').ConsoleMessage} event Browser console event.
 * @param {boolean} headless Whether the browser is running headlessly.
 */
function logConsoleMessage(event, headless) {
  if (!headless) {
    return;
  }

  let text = event.text();
  if (!text.startsWith('data:')) {
    text = text.slice(0, MAX_CONSOLE_MESSAGE_LENGTH);
  }

  switch (event.type()) {
    case 'log':
      console.log(text);
      break;
    case 'warning':
      console.warn(text);
      break;
    case 'error':
      console.error(text);
      break;
    default:
      break;
  }
}

/**
 * Dispatches synthetic input events into the Playwright page.
 * @param {import('playwright').Page} page Playwright page.
 * @param {{type: string}} event Synthetic input event.
 * @returns {Promise<void>} Resolves after the event is dispatched.
 */
async function emulateInput(page, event) {
  switch (event.type) {
    case 'keypress':
      await functionKeysDown(page, event);
      await page.keyboard.press(event.key, {delay: event.delay || 0});
      await functionKeysUp(page, event);
      return;
    case 'click':
      await functionKeysDown(page, event);
      await page.mouse.click(event.x, event.y, {
        button: event.button || 'left',
        delay: event.delay || 0
      });
      await functionKeysUp(page, event);
      return;
    case 'mousemove':
      await page.mouse.move(event.x, event.y, {steps: event.steps || 1});
      return;
    case 'drag':
      await functionKeysDown(page, event);
      await page.mouse.move(event.startX, event.startY);
      await page.mouse.down({button: event.button || 'left'});
      await page.mouse.move(event.endX, event.endY, {steps: event.steps || 1});
      await page.mouse.up({button: event.button || 'left'});
      await functionKeysUp(page, event);
      return;
    default:
      throw new Error(`Unknown event: ${event.type}`);
  }
}

/**
 * Holds requested modifier keys down before synthetic input.
 * @param {import('playwright').Page} page Playwright page.
 * @param {{shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean}} event Synthetic input event.
 * @returns {Promise<void>} Resolves after modifiers are pressed.
 */
async function functionKeysDown(page, event) {
  if (event.shiftKey) {
    await page.keyboard.down('Shift');
  }
  if (event.ctrlKey) {
    await page.keyboard.down('Control');
  }
  if (event.metaKey) {
    await page.keyboard.down('Meta');
  }
}

/**
 * Releases requested modifier keys after synthetic input.
 * @param {import('playwright').Page} page Playwright page.
 * @param {{shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean}} event Synthetic input event.
 * @returns {Promise<void>} Resolves after modifiers are released.
 */
async function functionKeysUp(page, event) {
  if (event.shiftKey) {
    await page.keyboard.up('Shift');
  }
  if (event.ctrlKey) {
    await page.keyboard.up('Control');
  }
  if (event.metaKey) {
    await page.keyboard.up('Meta');
  }
}

/**
 * Captures a screenshot and compares it against a golden image.
 * @param {import('playwright').Page} page Playwright page.
 * @param {boolean} headless Whether the browser is running headlessly.
 * @param {Record<string, any>} options Diff image options.
 * @returns {Promise<Record<string, any>>} Diff result.
 */
async function captureAndDiffScreen(page, headless, options) {
  if (!options.goldenImage) {
    throw new Error('Must supply golden image for image diff');
  }

  try {
    const image = await page.screenshot({
      type: 'png',
      omitBackground: true,
      clip: options.region,
      fullPage: !options.region
    });
    const result = await diffImages(image, options.goldenImage, options);
    return {
      headless,
      match: result.match || 0,
      matchPercentage: result.matchPercentage || 'N/A',
      success: result.success,
      diffImage: result.diffImage || null,
      error: result.error || null
    };
  } catch (error) {
    return {
      headless,
      match: 0,
      matchPercentage: 'N/A',
      success: false,
      error: error.message
    };
  }
}
