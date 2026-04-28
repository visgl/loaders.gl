import {version} from '../lerna.json';

const testGlobalThis = globalThis as typeof globalThis & {
  __VERSION__: string;
  fetch: typeof fetch;
  nodeVersion?: number;
};

testGlobalThis.__VERSION__ = version;

if (typeof process !== 'undefined' && typeof process.version === 'string') {
  const matches = process.version.match(/v([0-9]*)/);
  testGlobalThis.nodeVersion = (matches && parseFloat(matches[1])) || 10;
}

await import('@loaders.gl/polyfills');

const [{default: aliases}, {_addAliases}] = await Promise.all([
  import('./aliases'),
  import('@loaders.gl/loader-utils')
]);

_addAliases(aliases);

if (typeof window !== 'undefined') {
  const {setLoaderOptions} = await import('@loaders.gl/core');
  setLoaderOptions({_workerType: 'test'});

  Object.defineProperty(globalThis, 'global', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: globalThis
  });

  const setupUrl = new URL(import.meta.url);
  const rootPath = setupUrl.pathname.replace(/\/test\/vitest-setup\.ts$/, '');
  const originalFetch = testGlobalThis.fetch.bind(globalThis);

  testGlobalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    const parsedUrl = new URL(url, window.location.href);
    let rewrittenUrl: string | undefined;

    if (parsedUrl.origin === window.location.origin && parsedUrl.pathname.startsWith(rootPath)) {
      rewrittenUrl = `${window.location.origin}/@fs${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
      const response = await originalFetch(rewrittenUrl, init);
      const contentType = response.headers.get('content-type') || '';
      if (
        contentType.includes('text/html') &&
        !/\.(html?|[cm]?[jt]sx?)$/i.test(parsedUrl.pathname)
      ) {
        return new Response(null, {status: 404, statusText: 'Not Found'});
      }
      return response;
    }

    return originalFetch(input, init);
  };
}
