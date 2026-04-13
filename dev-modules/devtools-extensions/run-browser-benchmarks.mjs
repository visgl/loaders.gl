import {createServer} from 'vite';
import {chromium, firefox, webkit} from 'playwright';

import {getPlaywrightLaunchOptions} from './get-playwright-launch-options.mjs';
import {getVitestConfig} from './get-vitest-config.mjs';
import {loadOcularConfig} from './load-ocular-config.mjs';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;
const BROWSER_TYPES = {chromium, firefox, webkit};

/**
 * Runs the browser benchmark entrypoint in Playwright against a Vite dev server.
 */
export async function runBrowserBenchmarks(options = {}) {
  const ocularConfig = options.ocularConfig || (await loadOcularConfig(options));
  const vitestConfig = ocularConfig.devtools?.vitest || {};
  const browserName = options.browserName || vitestConfig.browserName || 'chromium';
  const browserType = BROWSER_TYPES[browserName];

  if (!browserType) {
    throw new Error(`Unsupported browser for benchmarks: ${browserName}`);
  }

  const viteConfig = await getVitestConfig({ocularConfig});
  const server = await createServer({
    configFile: false,
    root: process.cwd(),
    plugins: viteConfig.plugins,
    resolve: viteConfig.resolve,
    optimizeDeps: viteConfig.optimizeDeps,
    server: {
      host: options.host || DEFAULT_HOST,
      port: options.port || 0
    }
  });

  await server.listen();

  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine browser benchmark server address');
  }

  const origin = `http://${options.host || DEFAULT_HOST}:${address.port}`;
  const browser = await browserType.launch(
    getPlaywrightLaunchOptions({
      ocularConfig,
      channel: vitestConfig.channel,
      softwareGpu: Boolean(vitestConfig.softwareGpu),
      launchOptions: vitestConfig.launchOptions,
      headless: options.headless ?? true
    })
  );

  const page = await browser.newPage();
  forwardBrowserConsole(page);

  const benchmarkResult = await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Browser benchmarks timed out after ${options.timeoutMs || DEFAULT_TIMEOUT_MS}ms`));
    }, options.timeoutMs || DEFAULT_TIMEOUT_MS);

    let isSettled = false;
    const settle = (callback, value) => {
      if (isSettled) {
        return;
      }
      isSettled = true;
      clearTimeout(timeoutId);
      callback(value);
    };

    page.on('pageerror', error => settle(reject, error));

    page.exposeFunction('browserTestDriver_finish', message => {
      if (message) {
        settle(reject, new Error(String(message)));
      } else {
        settle(resolve, undefined);
      }
    }).catch(reject);

    page.exposeFunction('browserTestDriver_fail', message => {
      settle(reject, new Error(String(message || 'Browser benchmarks failed')));
    }).catch(reject);

    page
      .goto(`${origin}/test/bench/index.html`, {waitUntil: 'load'})
      .catch(error => settle(reject, error));
  });

  await page.close();
  await browser.close();
  await server.close();

  return benchmarkResult;
}

function forwardBrowserConsole(page) {
  page.on('console', message => {
    const text = message.text();
    if (!text) {
      return;
    }

    switch (message.type()) {
      case 'warning':
        console.warn(text);
        break;
      case 'error':
        console.error(text);
        break;
      default:
        console.log(text);
        break;
    }
  });
}
