// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// @ts-nocheck
import {loadLibrary} from '@loaders.gl/worker-utils';

const BASIS_CDN_ENCODER_WASM = `https://unpkg.com/@loaders.gl/textures@${VERSION}/dist/libs/basis_encoder.wasm`;
const BASIS_CDN_ENCODER_JS = `https://unpkg.com/@loaders.gl/textures@${VERSION}/dist/libs/basis_encoder.js`;

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

  [BASIS_ENCODER, wasmBinary] = await Promise.all([
    await loadLibrary(BASIS_CDN_ENCODER_JS, 'textures', options),
    await loadLibrary(BASIS_CDN_ENCODER_WASM, 'textures', options)
  ]);

  // Depends on how import happened...
  // @ts-ignore TS2339: Property does not exist on type
  BASIS_ENCODER = BASIS_ENCODER || globalThis.BASIS;
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
      const {BasisFile, KTX2File, initializeBasis, BasisEncoder} = module;
      initializeBasis();
      resolve({BasisFile, KTX2File, BasisEncoder});
    });
  });
}
