// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {registerJSModules, getJSModuleOrNull} from '@loaders.gl/loader-utils';
import {loadLibrary} from '@loaders.gl/worker-utils';

export const BASIS_EXTERNAL_LIBRARIES = {
  /** Basis transcoder, javascript wrapper part */
  TRANSCODER: 'basis_transcoder.js',
  /** Basis transcoder, compiled web assembly part */
  TRANSCODER_WASM: 'basis_transcoder.wasm',
  /** Basis encoder, javascript wrapper part */
  ENCODER: 'basis_encoder.js',
  /** Basis encoder, compiled web assembly part */
  ENCODER_WASM: 'basis_encoder.wasm'
};

let loadBasisTranscoderPromise;

/**
 * Loads wasm transcoder module
 * @param options
 * @returns {BasisFile} promise
 */
export async function loadBasisTranscoderModule(options) {
  registerJSModules(options.modules);
  const basis = getJSModuleOrNull('basis');
  if (basis) {
    return basis;
  }

  loadBasisTranscoderPromise ||= loadBasisTranscoder(options);
  return await loadBasisTranscoderPromise;
}

/**
 * Loads wasm transcoder module
 * @param options
 * @returns {BasisFile} promise
 */
async function loadBasisTranscoder(options) {
  let BASIS = null;
  let wasmBinary = null;

  [BASIS, wasmBinary] = await Promise.all([
    await loadLibrary(BASIS_EXTERNAL_LIBRARIES.TRANSCODER, 'textures', options),
    await loadLibrary(BASIS_EXTERNAL_LIBRARIES.TRANSCODER_WASM, 'textures', options)
  ]);

  // Depends on how import happened...
  // @ts-ignore TS2339: Property does not exist on type
  BASIS = BASIS || globalThis.BASIS;
  return await initializeBasisTranscoderModule(BASIS, wasmBinary);
}

/**
 * Initialize wasm transcoder module
 * @param BasisModule - js part of the module
 * @param wasmBinary - wasm part of the module
 * @returns {BasisFile} promise
 */
function initializeBasisTranscoderModule(BasisModule, wasmBinary) {
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
    await loadLibrary(BASIS_EXTERNAL_LIBRARIES.ENCODER, 'textures', options),
    await loadLibrary(BASIS_EXTERNAL_LIBRARIES.ENCODER_WASM, 'textures', options)
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
