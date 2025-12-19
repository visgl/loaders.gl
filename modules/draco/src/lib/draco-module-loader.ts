// Dynamic DRACO module loading inspired by THREE.DRACOLoader
// https://github.com/mrdoob/three.js/blob/398c4f39ebdb8b23eefd4a7a5ec49ec0c96c7462/examples/jsm/loaders/DRACOLoader.js
// by Don McCurdy / https://www.donmccurdy.com / MIT license

import {isBrowser, loadLibrary, type LoadLibraryOptions} from '@loaders.gl/worker-utils';

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

export async function loadDracoDecoderModule(
  options: LoadLibraryOptions = {},
  type: 'wasm' | 'js'
) {
  const modules = options.modules || {};

  // Check if a bundled draco3d library has been supplied by application
  if (modules.draco3d) {
    loadDecoderPromise ||= modules.draco3d.createDecoderModule({}).then((draco) => {
      return {draco};
    });
  } else {
    // If not, dynamically load the WASM script from our CDN
    loadDecoderPromise ||= loadDracoDecoder(options, type);
  }
  return await loadDecoderPromise;
}

export async function loadDracoEncoderModule(options: LoadLibraryOptions) {
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

function getLibraryExport(library: any, exportName: string): any {
  if (library && typeof library === 'object') {
    if (library.default) {
      return library.default;
    }
    if (library[exportName]) {
      return library[exportName];
    }
  }
  return library;
}

// DRACO DECODER LOADING
/** @todo - type the options, they are inconsistent */
async function loadDracoDecoder(options: LoadLibraryOptions, type: 'wasm' | 'js') {
  let DracoDecoderModule;
  let wasmBinary;
  switch (type) {
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
      try {
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
      } catch {
        DracoDecoderModule = null;
        wasmBinary = null;
      }
  }
  DracoDecoderModule = getLibraryExport(DracoDecoderModule, 'DracoDecoderModule');
  // @ts-ignore
  DracoDecoderModule = DracoDecoderModule || globalThis.DracoDecoderModule;

  // In Node environments without network access, fall back to local copies in the repo.
  if (!DracoDecoderModule && !isBrowser) {
    [DracoDecoderModule, wasmBinary] = await Promise.all([
      await loadLibrary(
        DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.DECODER],
        'draco',
        {...options, useLocalLibraries: true},
        DRACO_EXTERNAL_LIBRARIES.DECODER
      ),
      await loadLibrary(
        DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.DECODER_WASM],
        'draco',
        {...options, useLocalLibraries: true},
        DRACO_EXTERNAL_LIBRARIES.DECODER_WASM
      )
    ]);
    DracoDecoderModule = getLibraryExport(DracoDecoderModule, 'DracoDecoderModule');
    // @ts-ignore
    DracoDecoderModule = DracoDecoderModule || globalThis.DracoDecoderModule;
  }

  return await initializeDracoDecoder(DracoDecoderModule, wasmBinary);
}

function initializeDracoDecoder(DracoDecoderModule, wasmBinary) {
  if (typeof DracoDecoderModule !== 'function') {
    throw new Error('DracoDecoderModule could not be loaded');
  }

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

async function loadDracoEncoder(options: LoadLibraryOptions) {
  let DracoEncoderModule = await loadLibrary(
    DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.ENCODER],
    'draco',
    options,
    DRACO_EXTERNAL_LIBRARIES.ENCODER
  );
  DracoEncoderModule = getLibraryExport(DracoEncoderModule, 'DracoEncoderModule');
  // @ts-ignore
  DracoEncoderModule = DracoEncoderModule || globalThis.DracoEncoderModule;

  // In Node environments without network access, fall back to local copies in the repo.
  if (!DracoEncoderModule && !isBrowser) {
    DracoEncoderModule = await loadLibrary(
      DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.ENCODER],
      'draco',
      {...options, useLocalLibraries: true},
      DRACO_EXTERNAL_LIBRARIES.ENCODER
    );
    DracoEncoderModule = getLibraryExport(DracoEncoderModule, 'DracoEncoderModule');
    // @ts-ignore
    DracoEncoderModule = DracoEncoderModule || globalThis.DracoEncoderModule;
  }

  if (typeof DracoEncoderModule !== 'function') {
    throw new Error('DracoEncoderModule could not be loaded');
  }

  return new Promise((resolve) => {
    DracoEncoderModule({
      onModuleLoaded: (draco) => resolve({draco}) // Module is Promise-like. Wrap in object to avoid loop.
    });
  });
}
