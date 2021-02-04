// Dynamic DRACO module loading inspired by THREE.DRACOLoader
// https://github.com/mrdoob/three.js/blob/398c4f39ebdb8b23eefd4a7a5ec49ec0c96c7462/examples/jsm/loaders/DRACOLoader.js
// by Don McCurdy / https://www.donmccurdy.com / MIT license

import {loadLibrary, global} from '@loaders.gl/worker-utils';

const DRACO_VERSION = '1.4.1';
const DRACO_JS_DECODER_URL = `https://www.gstatic.com/draco/versioned/decoders/${DRACO_VERSION}/draco_decoder.js`;
const DRACO_WASM_WRAPPER_URL = `https://www.gstatic.com/draco/versioned/decoders/${DRACO_VERSION}/draco_wasm_wrapper.js`;
const DRACO_WASM_DECODER_URL = `https://www.gstatic.com/draco/versioned/decoders/${DRACO_VERSION}/draco_decoder.wasm`;

const DRACO_ENCODER_URL = `https://raw.githubusercontent.com/google/draco/${DRACO_VERSION}/javascript/draco_encoder.js`;

let loadDecoderPromise;
let loadEncoderPromise;

export async function loadDracoDecoderModule(options) {
  const modules = options.modules || {};

  // Check if a bundled draco3d library has been supplied by application
  if (modules.draco3d) {
    loadDecoderPromise =
      loadDecoderPromise ||
      modules.draco3d.createDecoderModule({}).then(draco => {
        return {draco};
      });
  } else {
    // If not, dynamically load the WASM script from our CDN
    loadDecoderPromise = loadDecoderPromise || loadDracoDecoder(options);
  }
  return await loadDecoderPromise;
}

export async function loadDracoEncoderModule(options) {
  const modules = options.modules || {};

  // Check if a bundled draco3d library has been supplied by application
  if (modules.draco3d) {
    loadEncoderPromise =
      loadEncoderPromise ||
      modules.draco3d.createEncoderModule({}).then(draco => {
        return {draco};
      });
  } else {
    // If not, dynamically load the WASM script from our CDN
    loadEncoderPromise = loadEncoderPromise || loadDracoEncoder(options);
  }
  return await loadEncoderPromise;
}

// DRACO DECODER LOADING

async function loadDracoDecoder(options) {
  let DracoDecoderModule;
  let wasmBinary;
  switch (options.draco && options.draco.decoderType) {
    case 'js':
      DracoDecoderModule = await loadLibrary(DRACO_JS_DECODER_URL, 'draco', options);
      break;

    case 'wasm':
    default:
      [DracoDecoderModule, wasmBinary] = await Promise.all([
        await loadLibrary(DRACO_WASM_WRAPPER_URL, 'draco', options),
        await loadLibrary(DRACO_WASM_DECODER_URL, 'draco', options)
      ]);
  }
  // Depends on how import happened...
  // @ts-ignore
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
  let DracoEncoderModule = await loadLibrary(DRACO_ENCODER_URL, 'draco', options);
  // @ts-ignore
  DracoEncoderModule = DracoEncoderModule || global.DracoEncoderModule;

  return new Promise(resolve => {
    DracoEncoderModule({
      onModuleLoaded: draco => resolve({draco}) // Module is Promise-like. Wrap in object to avoid loop.
    });
  });
}
