// loaders.gl, MIT license

/** Stores a reference to the intercepted requestInit object under the url */
export const requestInits: Record<string, RequestInit | undefined> = {};
export const mockResults: Record<string, string | Blob> = {};

const originalFetch = globalThis.fetch;

/** Calls global fetch after storing the request info */
export async function fetchSpy(
  input: RequestInfo | URL,
  init?: RequestInit | undefined
): Promise<Response> {
  if (typeof input === 'string') {
    requestInits[input] = init;
  }
  return originalFetch(input, init);
}

/** Calls global fetch after storing the request info */
export async function fetchMock(
  input: RequestInfo | URL,
  init?: RequestInit | undefined
): Promise<Response> {
  if (typeof input === 'string') {
    requestInits[input] = init;
    const mockResult = mockResults[input];
    if (mockResult) {
      return new Response(mockResult);
    }
  }
  throw new Error('no mock result found');
}

/** Calls global fetch after storing the request info */
export async function withFetchSpy(
  func: () => Promise<void>
): Promise<Record<string, RequestInit | undefined>> {
  let promise;
  try {
    globalThis.fetch = fetchSpy;
    promise = func();
    globalThis.fetch = originalFetch;
  } finally {
    globalThis.fetch = originalFetch;
  }
  await promise;
  return requestInits;
}

export async function withFetchMock(
  func: () => Promise<void>
): Promise<Record<string, RequestInit | undefined>> {
  let promise;
  try {
    globalThis.fetch = fetchMock;
    promise = func();
    globalThis.fetch = originalFetch;
  } finally {
    globalThis.fetch = originalFetch;
  }
  await promise;
  return requestInits;
}
