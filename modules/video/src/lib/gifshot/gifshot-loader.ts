// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// @ts-nocheck
import {loadLibrary} from '@loaders.gl/worker-utils';
import {registerJSModules, getJSModule} from '@loaders.gl/loader-utils';

let loadGifshotPromise;

export async function loadGifshotModule(options = {}) {
  registerJSModules(options.modules);
  const gifshot = getJSModule('gifshot');
  if (gifshot) {
    return gifshot;
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
