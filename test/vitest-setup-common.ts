// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {version} from '../lerna.json';

type TestGlobalThis = typeof globalThis & {
  __VERSION__: string;
  fetch: typeof fetch;
  nodeVersion?: number;
};

const testGlobalThis = globalThis as TestGlobalThis;

/** Configures globals shared by all Vitest projects. */
export function setupTestEnvironment(options: {blockExternalNetwork: boolean}): void {
  testGlobalThis.__VERSION__ = version;

  if (typeof process !== 'undefined' && typeof process.version === 'string') {
    const matches = process.version.match(/v([0-9]*)/);
    testGlobalThis.nodeVersion = (matches && parseFloat(matches[1])) || 10;
  }

  if (options.blockExternalNetwork) {
    blockExternalNetworkRequests();
  }
}

/** Rejects HTTP requests outside the local fixture server in hermetic test projects. */
function blockExternalNetworkRequests(): void {
  if (typeof testGlobalThis.fetch !== 'function') {
    return;
  }

  const originalFetch = testGlobalThis.fetch.bind(globalThis);
  testGlobalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    const baseUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost/';
    const parsedUrl = new URL(url, baseUrl);

    if (
      (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') &&
      !isLoopbackHostname(parsedUrl.hostname)
    ) {
      throw new Error(
        `External network request blocked in hermetic tests: ${parsedUrl.href}. ` +
          'Move this test to an *.external.spec.* file.'
      );
    }

    return originalFetch(input, init);
  };
}

/** Returns true when a hostname resolves to the local test process. */
function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '::1'
  );
}
