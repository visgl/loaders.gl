import {loadLibrary, global} from '@loaders.gl/loader-utils';

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
    await loadLibrary('basis_transcoder.js', 'basis', options),
    await loadLibrary('basis_transcoder.wasm', 'basis', options)
  ]);

  // Depends on how import happened...
  BASIS = BASIS || global.BASIS;
  return await initializeBasis(BASIS, wasmBinary);
}

function initializeBasis(BASIS, wasmBinary) {
  // const options = {};
  // if (wasmBinary) {
  //   options.wasmBinary = wasmBinary;
  // }
  // return new Promise(resolve => {
  //   BasisModule({
  //     ...options,
  //     onModuleLoaded: draco => resolve({draco}) // Module is Promise-like. Wrap in object to avoid loop.
  //   });
  // });
}
