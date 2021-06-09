import {loadLibrary} from '@loaders.gl/worker-utils';

let loadBasisPromise;

export async function loadBasisModule(options) {
  const modules = options.modules || {};
  if (modules.basis) {
    return modules.basis;
  }

  loadBasisPromise = loadBasisPromise || loadBasis(options);
  return await loadBasisPromise;
}

async function loadBasis(options) {
  let BASIS = null;
  let wasmBinary = null;

  [BASIS, wasmBinary] = await Promise.all([
    await loadLibrary('basis_transcoder.js', 'textures', options),
    await loadLibrary('basis_transcoder.wasm', 'textures', options)
  ]);

  // Depends on how import happened...
  // @ts-ignore TS2339: Property does not exist on type
  BASIS = BASIS || globalThis.BASIS;
  return await initializeBasisModule(BASIS, wasmBinary);
}

function initializeBasisModule(BasisModule, wasmBinary) {
  const options = {};

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
