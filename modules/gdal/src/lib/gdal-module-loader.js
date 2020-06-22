// Dynamic GDAL module loading

import {loadLibrary, global} from '@loaders.gl/loader-utils';

let loadDecoderPromise;

export async function loadGDALModules(options) {
  const modules = options.modules || {};

  // If not, dynamically load the WASM script from our CDN
  loadDecoderPromise = loadDecoderPromise || loadDecoder(options);
  return await loadDecoderPromise;
}

async function loadDecoder(options) {
  let [DecoderModule, wasmBinary] = await Promise.all([
    await loadLibrary('gdal.js', 'gdal', options),
    await loadLibrary('gdal.wasm', 'gdal', options)
  ]);
  // Depends on how import happened...
  // @ts-ignore
  DecoderModule = DecoderModule || global.DecoderModule;
  return await initializeDecoder(DecoderModule, wasmBinary);
}

function initializeDecoder(DecoderModule, wasmBinary) {
  const options = {};
  if (wasmBinary) {
    options.wasmBinary = wasmBinary;
  }

  return new Promise(resolve => {
    DecoderModule({
      ...options,
      onModuleLoaded: gdal => resolve({gdal}) // Module is Promise-like. Wrap in object to avoid loop.
    });
  });
}
