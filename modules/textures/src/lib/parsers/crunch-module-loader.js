/** @typedef {import('./crunch-module-loader')} types */
import {loadLibrary, global} from '@loaders.gl/worker-utils';

let CrunchModule;

/** @type {types['loadCrunchModule']} */
export async function loadCrunchModule(options) {
  const modules = options.modules || {};
  if (modules.crunch) {
    return modules.crunch;
  }

  return loadCrunch(options);
}

/**
 * Load crunch decoder module
 * @param {any} options - Loader options
 * @returns {Promise<any>} Promise of Module object
 */
async function loadCrunch(options) {
  if (CrunchModule) {
    return CrunchModule;
  }

  let LoadCrunchDecoder = null;

  [LoadCrunchDecoder] = await Promise.all([await loadLibrary('crunch.js', 'textures', options)]);

  // Depends on how import happened...
  // @ts-ignore TS2339: Property does not exist on type
  LoadCrunchDecoder = LoadCrunchDecoder || global.LoadCrunchDecoder;
  CrunchModule = LoadCrunchDecoder();
  return CrunchModule;
}
