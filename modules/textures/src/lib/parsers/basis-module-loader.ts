import {loadLibrary} from '@loaders.gl/worker-utils';

let loadBasisTranscoderPromise;

/**
 * Loads wasm transcoder module
 * @param options
 * @returns {BasisFile} promise
 */
export async function loadBasisTrascoderModule(options) {
  const modules = options.modules || {};
  if (modules.basis) {
    return modules.basis;
  }

  loadBasisTranscoderPromise = loadBasisTranscoderPromise || loadBasisTrascoder(options);
  return await loadBasisTranscoderPromise;
}

/**
 * Loads wasm transcoder module
 * @param options
 * @returns {BasisFile} promise
 */
async function loadBasisTrascoder(options) {
  let BASIS = null;
  let wasmBinary = null;

  [BASIS, wasmBinary] = await Promise.all([
    await loadLibrary('basis_transcoder.js', 'textures', options),
    await loadLibrary('basis_transcoder.wasm', 'textures', options)
  ]);

  // Depends on how import happened...
  // @ts-ignore TS2339: Property does not exist on type
  BASIS = BASIS || globalThis.BASIS;
  return await initializeBasisTrascoderModule(BASIS, wasmBinary);
}

/**
 * Initialize wasm transcoder module
 * @param BasisModule - js part of the module
 * @param wasmBinary - wasm part of the module
 * @returns {BasisFile} promise
 */
function initializeBasisTrascoderModule(BasisModule, wasmBinary) {
  const options: {wasmBinary?} = {};

  if (wasmBinary) {
    options.wasmBinary = wasmBinary;
  }

  return new Promise((resolve) => {
    // if you try to return BasisModule the browser crashes!
    BasisModule(options).then((module) => {
      const {BasisFile, initializeBasis} = module;
      initializeBasis();
      resolve({BasisFile});
    });
  });
}

let loadBasisEncoderPromise;

/**
 * Loads wasm encoder module
 * @param options
 * @returns {BasisFile, KTX2File} promise
 */
export async function loadBasisEncoderModule(options) {
  const modules = options.modules || {};
  if (modules.basisEncoder) {
    return modules.basisEncoder;
  }

  loadBasisEncoderPromise = loadBasisEncoderPromise || loadBasisEncoder(options);
  return await loadBasisEncoderPromise;
}

/**
 * Loads wasm encoder module
 * @param options
 * @returns {BasisFile, KTX2File} promise
 */
async function loadBasisEncoder(options) {
  let BASIS_ENCODER = null;
  let wasmBinary = null;

  // TODO: load from `libs` path as soon as module is published on npm
  [BASIS_ENCODER, wasmBinary] = await Promise.all([
    await loadLibrary(
      'https://raw.githubusercontent.com/BinomialLLC/basis_universal/master/webgl/encoder/build/basis_encoder.js',
      null,
      options
    ),
    await loadLibrary(
      'https://raw.githubusercontent.com/BinomialLLC/basis_universal/master/webgl/encoder/build/basis_encoder.wasm',
      null,
      options
    )
  ]);

  // Depends on how import happened...
  // @ts-ignore TS2339: Property does not exist on type
  BASIS_ENCODER = BASIS_ENCODER || globalThis.BASIS_ENCODER;
  return await initializeBasisEncoderModule(BASIS_ENCODER, wasmBinary);
}

/**
 * Initialize wasm transcoder module
 * @param BasisEncoderModule - js part of the module
 * @param wasmBinary - wasm part of the module
 * @returns {BasisFile, KTX2File} promise
 */
function initializeBasisEncoderModule(BasisEncoderModule, wasmBinary) {
  const options: {wasmBinary?} = {};

  if (wasmBinary) {
    options.wasmBinary = wasmBinary;
  }

  return new Promise((resolve) => {
    // if you try to return BasisModule the browser crashes!
    BasisEncoderModule(options).then((module) => {
      const {BasisFile, KTX2File, initializeBasis} = module;
      initializeBasis();
      resolve({BasisFile, KTX2File});
    });
  });
}
