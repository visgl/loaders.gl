import {loadLibrary} from '@loaders.gl/worker-utils';

let loadGifshotPromise;

export async function loadGifshotModule(options = {}) {
  const modules = options.modules || {};
  if (modules.gifshot) {
    return modules.gifshot;
  }
  loadGifshotPromise = loadGifshotPromise || loadGifshot(options);
  return await loadGifshotPromise;
}

async function loadGifshot(options) {
  options.libraryPath = options.libraryPath || 'libs/';
  const gifshot = await loadLibrary('gifshot.js', 'gifshot', options);

  // Depends on how import happened...
  // @ts-ignore TS2339: Property does not exist on type
  return gifshot || globalThis.gifshot;
}
