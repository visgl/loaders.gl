// Dynamic DRACO module loading inspired by THREE.DRACOLoader
// https://github.com/mrdoob/three.js/blob/398c4f39ebdb8b23eefd4a7a5ec49ec0c96c7462/examples/jsm/loaders/DRACOLoader.js
// by Don McCurdy / https://www.donmccurdy.com / MIT license

import {loadLibrary} from '@loaders.gl/worker-utils';

const DRACO_DECODER_VERSION = '1.5.6';
const DRACO_ENCODER_VERSION = '1.4.1';

const STATIC_DECODER_URL = `https://www.gstatic.com/draco/versioned/decoders/${DRACO_DECODER_VERSION}`;

export const DRACO_EXTERNAL_LIBRARIES = {
  /** The primary Draco3D encoder, javascript wrapper part */
  DECODER: 'draco_wasm_wrapper.js',
  /** The primary draco decoder, compiled web assembly part */
  DECODER_WASM: 'draco_decoder.wasm',
  /** Fallback decoder for non-webassebly environments. Very big bundle, lower performance */
  FALLBACK_DECODER: 'draco_decoder.js',
  /** Draco encoder */
  ENCODER: 'draco_encoder.js'
};

export const DRACO_EXTERNAL_LIBRARY_URLS = {
  [DRACO_EXTERNAL_LIBRARIES.DECODER]: `${STATIC_DECODER_URL}/${DRACO_EXTERNAL_LIBRARIES.DECODER}`,
  [DRACO_EXTERNAL_LIBRARIES.DECODER_WASM]: `${STATIC_DECODER_URL}/${DRACO_EXTERNAL_LIBRARIES.DECODER_WASM}`,
  [DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER]: `${STATIC_DECODER_URL}/${DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER}`,
  [DRACO_EXTERNAL_LIBRARIES.ENCODER]: `https://raw.githubusercontent.com/google/draco/${DRACO_ENCODER_VERSION}/javascript/${DRACO_EXTERNAL_LIBRARIES.ENCODER}`
};

let loadDecoderPromise;
let loadEncoderPromise;

export async function loadDracoDecoderModule(options) {
  const modules = options.modules || {};

  // Check if a bundled draco3d library has been supplied by application
  if (modules.draco3d) {
    loadDecoderPromise ||= modules.draco3d.createDecoderModule({}).then((draco) => {
      return {draco};
    });
  } else {
    // If not, dynamically load the WASM script from our CDN
    loadDecoderPromise ||= loadDracoDecoder(options);
  }
  return await loadDecoderPromise;
}

export async function loadDracoEncoderModule(options) {
  const modules = options.modules || {};

  // Check if a bundled draco3d library has been supplied by application
  if (modules.draco3d) {
    loadEncoderPromise ||= modules.draco3d.createEncoderModule({}).then((draco) => {
      return {draco};
    });
  } else {
    // If not, dynamically load the WASM script from our CDN
    loadEncoderPromise ||= loadDracoEncoder(options);
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
        DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER],
        'draco',
        options,
        DRACO_EXTERNAL_LIBRARIES.FALLBACK_DECODER
      );
      break;

    case 'wasm':
    default:
      [DracoDecoderModule, wasmBinary] = await Promise.all([
        await loadLibrary(
          DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.DECODER],
          'draco',
          options,
          DRACO_EXTERNAL_LIBRARIES.DECODER
        ),
        await loadLibrary(
          DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.DECODER_WASM],
          'draco',
          options,
          DRACO_EXTERNAL_LIBRARIES.DECODER_WASM
        )
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
    DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.ENCODER],
    'draco',
    options,
    DRACO_EXTERNAL_LIBRARIES.ENCODER
  );
  // @ts-ignore
  DracoEncoderModule = DracoEncoderModule || globalThis.DracoEncoderModule;

  return new Promise((resolve) => {
    DracoEncoderModule({
      onModuleLoaded: (draco) => resolve({draco}) // Module is Promise-like. Wrap in object to avoid loop.
    });
  });
}
