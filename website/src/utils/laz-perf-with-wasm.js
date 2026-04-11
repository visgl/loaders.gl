import createLazPerfBase from 'laz-perf/lib/laz-perf.js';
import wasmUrl from 'laz-perf/lib/laz-perf.wasm';

/**
 * Ensures laz-perf resolves its wasm binary through webpack assets.
 * @param {object} [moduleOptions]
 * @returns {object}
 */
function createModuleOptions(moduleOptions = {}) {
  const {locateFile} = moduleOptions;
  return {
    ...moduleOptions,
    locateFile(path, scriptDirectory) {
      if (path === 'laz-perf.wasm') {
        return wasmUrl;
      }
      return locateFile ? locateFile(path, scriptDirectory) : `${scriptDirectory}${path}`;
    }
  };
}

/**
 * Creates a laz-perf instance with a stable wasm URL.
 * @param {object} [moduleOptions]
 * @returns {Promise<object>}
 */
export function createLazPerf(moduleOptions) {
  return createLazPerfBase(createModuleOptions(moduleOptions));
}

export const create = createLazPerf;
export const LazPerf = {create: createLazPerf};
export default createLazPerf;
