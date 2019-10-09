// Dynamic DRACO module loading inspired by THREE.DRACOLoader
// https://github.com/mrdoob/three.js/blob/398c4f39ebdb8b23eefd4a7a5ec49ec0c96c7462/examples/jsm/loaders/DRACOLoader.js
// by Don McCurdy / https://www.donmccurdy.com / MIT license

import {loadLibrary, global} from '@loaders.gl/loader-utils';

let loadDecoderPromise;
let loadEncoderPromise;

export async function loadDracoDecoderModule(options) {
  // modules: {draco3d: require('draco3d')}; // if draco is bundled, we are done
  const modules = options.modules || {};
  if (modules.draco3d) {
    return modules.draco3d;
  }

  loadDecoderPromise = loadDecoderPromise || loadDracoDecoder(options);
  return await loadDecoderPromise;
}

export async function loadDracoEncoderModule(options) {
  // modules: {draco3d: require('draco3d')}; // if draco is bundled, we are done
  const modules = options.modules || {};
  if (modules.draco3d) {
    return modules.draco3d;
  }

  loadEncoderPromise = loadEncoderPromise || loadDracoEncoder(options);
  return await loadEncoderPromise;
}

// DRACO DECODER LOADING

async function loadDracoDecoder(options) {
  let DracoDecoderModule;
  let wasmBinary;
  switch (options.draco && options.draco.decoderType) {
    case 'js':
      DracoDecoderModule = await loadLibrary('draco_decoder.js', 'draco', options);
      break;

    case 'wasm':
    default:
      [DracoDecoderModule, wasmBinary] = await Promise.all([
        await loadLibrary('draco_wasm_wrapper.js', 'draco', options),
        await loadLibrary('draco_decoder.wasm', 'draco', options)
      ]);
  }
  // Depends on how import happened...
  DracoDecoderModule = DracoDecoderModule || global.DracoDecoderModule;
  return await initializeDracoDecoder(DracoDecoderModule, wasmBinary);
}

function initializeDracoDecoder(DracoDecoderModule, wasmBinary) {
  const options = {};
  if (wasmBinary) {
    options.wasmBinary = wasmBinary;
  }

  return new Promise(resolve => {
    DracoDecoderModule({
      ...options,
      onModuleLoaded: draco => resolve({draco}) // Module is Promise-like. Wrap in object to avoid loop.
    });
  });
}

// ENCODER

async function loadDracoEncoder(options) {
  let DracoEncoderModule = await loadLibrary('draco_encoder.js', 'draco', options);
  DracoEncoderModule = DracoEncoderModule || global.DracoEncoderModule;

  return new Promise(resolve => {
    DracoEncoderModule({
      onModuleLoaded: draco => resolve({draco}) // Module is Promise-like. Wrap in object to avoid loop.
    });
  });
}
