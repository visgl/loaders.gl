import {createServer} from 'vite';
import {chromium, firefox, webkit} from 'playwright';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;
const BROWSER_TYPES = {chromium, firefox, webkit};

/**
 * Runs the browser benchmark entrypoint in Playwright against a Vite dev server.
 */
export async function runBrowserBenchmarks(options = {}) {
  const browserName = options.browserName || 'chromium';
  const browserType = BROWSER_TYPES[browserName];

  if (!browserType) {
    throw new Error(`Unsupported browser for benchmarks: ${browserName}`);
  }

  const server = await createServer({
    configFile: 'vitest.config.ts',
    root: process.cwd(),
    optimizeDeps: {
      entries: ['test/bench/index.html']
    },
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
  const browser = await browserType.launch({
    headless: options.headless ?? true,
    args: [
      '--disable-dev-shm-usage',
      '--enable-unsafe-webgpu',
      '--ignore-gpu-blocklist',
      ...(process.env.CI ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [])
    ]
  });

  const page = await browser.newPage();
  forwardBrowserConsole(page);

  try {
    return await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(`Browser benchmarks timed out after ${options.timeoutMs || DEFAULT_TIMEOUT_MS}ms`)
        );
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

      page
        .exposeFunction('browserTestDriver_finish', message => {
          if (message) {
            settle(reject, new Error(String(message)));
          } else {
            settle(resolve, undefined);
          }
        })
        .catch(reject);

      page
        .exposeFunction('browserTestDriver_fail', message => {
          settle(reject, new Error(String(message || 'Browser benchmarks failed')));
        })
        .catch(reject);

      page
        .goto(createBenchmarkPageUrl(origin, options.filters), {waitUntil: 'load'})
        .catch(error => settle(reject, error));
    });
  } finally {
    await page.close();
    await browser.close();
    await server.close();
  }
}

/**
 * Creates the browser benchmark URL with optional module filters.
 * @param {string} origin Vite server origin.
 * @param {string[]} filters Benchmark module filters.
 * @returns {string} Browser benchmark page URL.
 */
export function createBenchmarkPageUrl(origin, filters = []) {
  const benchmarkUrl = new URL('/test/bench/index.html', origin);
  for (const filter of filters) {
    benchmarkUrl.searchParams.append('module', filter);
  }
  return benchmarkUrl.toString();
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
