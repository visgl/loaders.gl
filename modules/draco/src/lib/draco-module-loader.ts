// Dynamic DRACO module loading inspired by THREE.DRACOLoader
// https://github.com/mrdoob/three.js/blob/398c4f39ebdb8b23eefd4a7a5ec49ec0c96c7462/examples/jsm/loaders/DRACOLoader.js
// by Don McCurdy / https://www.donmccurdy.com / MIT license

import {loadLibrary} from '@loaders.gl/worker-utils';

const DRACO_DECODER_VERSION = '1.5.5';
const DRACO_ENCODER_VERSION = '1.4.1';

const STATIC_DECODER_URL = `https://www.gstatic.com/draco/versioned/decoders/${DRACO_DECODER_VERSION}`;

export const DRACO_JS_DECODER_NAME = 'draco_decoder.js';
export const DRACO_JS_DECODER_URL = `${STATIC_DECODER_URL}/${DRACO_JS_DECODER_NAME}`;
export const DRACO_WASM_WRAPPER_NAME = 'draco_wasm_wrapper.js';
export const DRACO_WASM_WRAPPER_URL = `${STATIC_DECODER_URL}/${DRACO_WASM_WRAPPER_NAME}`;
export const DRACO_WASM_DECODER_NAME = 'draco_decoder.wasm';
export const DRACO_WASM_DECODER_URL = `${STATIC_DECODER_URL}/${DRACO_WASM_DECODER_NAME}`;

export const DRACO_ENCODER_NAME = 'draco_encoder.js';
export const DRACO_ENCODER_URL = `https://raw.githubusercontent.com/google/draco/${DRACO_ENCODER_VERSION}/javascript/${DRACO_ENCODER_NAME}`;

let loadDecoderPromise;
let loadEncoderPromise;

export async function loadDracoDecoderModule(options) {
  const modules = options.modules || {};

  // Check if a bundled draco3d library has been supplied by application
  if (modules.draco3d) {
    loadDecoderPromise =
      loadDecoderPromise ||
      modules.draco3d.createDecoderModule({}).then((draco) => {
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
      modules.draco3d.createEncoderModule({}).then((draco) => {
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
      DracoDecoderModule = await loadLibrary(
        DRACO_JS_DECODER_URL,
        'draco',
        options,
        DRACO_JS_DECODER_NAME
      );
      break;

    case 'wasm':
    default:
      [DracoDecoderModule, wasmBinary] = await Promise.all([
        await loadLibrary(DRACO_WASM_WRAPPER_URL, 'draco', options, DRACO_WASM_WRAPPER_NAME),
        await loadLibrary(DRACO_WASM_DECODER_URL, 'draco', options, DRACO_WASM_DECODER_NAME)
      ]);
  }
  // Depends on how import happened...
  // @ts-ignore
  DracoDecoderModule = DracoDecoderModule || globalThis.DracoDecoderModule;
  return await initializeDracoDecoder(DracoDecoderModule, wasmBinary);
}

function initializeDracoDecoder(DracoDecoderModule, wasmBinary) {
  const options: {wasmBinary?: any} = {};
  if (wasmBinary) {
    options.wasmBinary = wasmBinary;
  }

  return new Promise((resolve) => {
    DracoDecoderModule({
      ...options,
      onModuleLoaded: (draco) => resolve({draco}) // Module is Promise-like. Wrap in object to avoid loop.
    });
  });
}

// ENCODER

async function loadDracoEncoder(options) {
  let DracoEncoderModule = await loadLibrary(
    DRACO_ENCODER_URL,
    'draco',
    options,
    DRACO_ENCODER_NAME
  );
  // @ts-ignore
  DracoEncoderModule = DracoEncoderModule || globalThis.DracoEncoderModule;

  return new Promise((resolve) => {
    DracoEncoderModule({
      onModuleLoaded: (draco) => resolve({draco}) // Module is Promise-like. Wrap in object to avoid loop.
    });
  });
}
