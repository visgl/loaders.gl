// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

type TestGlobalThis = typeof globalThis & {
  fetch: typeof fetch;
};

declare const __TEST_REPOSITORY_ROOT__: string;

const LOCAL_FIXTURE_PREFIX = '/__loaders_gl_test_fixtures__/';
const LOADERS_GL_RAW_GITHUB_PREFIX = 'https://raw.githubusercontent.com/visgl/loaders.gl/master/';
const SQL_JS_WASM_URL = 'https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/sql-wasm-browser.wasm';

/** Configures browser globals and rewrites repository file paths through the raw fixture server. */
export function setupBrowserFileFetch(options?: {rewriteRemoteFixtures?: boolean}): void {
  if (typeof window === 'undefined') {
    return;
  }

  Object.defineProperty(globalThis, 'global', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: globalThis
  });

  const testGlobalThis = globalThis as TestGlobalThis;
  const fileSystemRootPath = __TEST_REPOSITORY_ROOT__;
  const originalFetch = testGlobalThis.fetch.bind(globalThis);

  testGlobalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    const parsedUrl = new URL(url, window.location.href);

    if (options?.rewriteRemoteFixtures !== false) {
      const remoteFixturePath = getRemoteFixturePath(parsedUrl.href);
      if (remoteFixturePath) {
        return originalFetch(
          `${window.location.origin}${LOCAL_FIXTURE_PREFIX}${remoteFixturePath}`,
          init
        );
      }
    }

    const repositoryPath = getRepositoryPath(parsedUrl, fileSystemRootPath);
    if (repositoryPath) {
      return originalFetch(
        `${window.location.origin}${LOCAL_FIXTURE_PREFIX}${repositoryPath}${parsedUrl.search}${parsedUrl.hash}`,
        init
      );
    }

    return originalFetch(input, init);
  };
}

/** Maps an approved remote URL to its hermetic repository-local equivalent. */
function getRemoteFixturePath(url: string): string | null {
  if (url.startsWith(LOADERS_GL_RAW_GITHUB_PREFIX)) {
    return url.slice(LOADERS_GL_RAW_GITHUB_PREFIX.length).split(/[?#]/, 1)[0];
  }
  if (url === SQL_JS_WASM_URL) {
    return 'node_modules/sql.js/dist/sql-wasm-browser.wasm';
  }
  return null;
}

/** Extracts a repository-relative path from a same-origin browser test URL. */
function getRepositoryPath(parsedUrl: URL, fileSystemRootPath: string): string | null {
  if (parsedUrl.origin !== window.location.origin) {
    return null;
  }

  if (parsedUrl.pathname.startsWith(LOCAL_FIXTURE_PREFIX)) {
    return null;
  }

  if (parsedUrl.pathname === '/laz-perf.wasm') {
    return 'node_modules/laz-perf/lib/web/laz-perf.wasm';
  }

  if (parsedUrl.pathname.startsWith('/modules/')) {
    return parsedUrl.pathname.slice(1);
  }

  const fileSystemPrefix = `/@fs${fileSystemRootPath}/`;
  if (parsedUrl.pathname.startsWith(fileSystemPrefix)) {
    return parsedUrl.pathname.slice(fileSystemPrefix.length);
  }

  const repositoryUrlPrefix = `${fileSystemRootPath}/`;
  return parsedUrl.pathname.startsWith(repositoryUrlPrefix)
    ? parsedUrl.pathname.slice(repositoryUrlPrefix.length)
    : null;
}
