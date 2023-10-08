// loaders.gl, MIT License

export function installFilePolyfills() {}

// Dummy export to avoid import errors in browser tests
export const NodeFileSystem = null;

export function fetchNode(path: string, options: RequestInit): Promise<Response> {
  throw new Error('fetchNode not available in browser');
}
