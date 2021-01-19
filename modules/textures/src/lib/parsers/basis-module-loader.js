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

  const modules = {
    // Uncomment for local testing libs files
    // 'basis_transcoder.js': 'http://localhost:8080/modules/textures/src/libs/basis_transcoder.js',
    // 'basis_transcoder.wasm': 'http://localhost:8080/modules/textures/src/libs/basis_transcoder.wasm'
  };

  // TODO: load the module from 'textures' as soon as 'textures' npm package is published
  // [BASIS, wasmBinary] = await Promise.all([
  //   await loadLibrary('basis_transcoder.js', 'textures', options),
  //   await loadLibrary('basis_transcoder.wasm', 'textures', options)
  // ]);
  [BASIS, wasmBinary] = await Promise.all([
    await loadLibrary('basis_transcoder.js', 'basis', {...options, modules}),
    await loadLibrary('basis_transcoder.wasm', 'basis', {...options, modules})
  ]);

  // Depends on how import happened...
  // @ts-ignore TS2339: Property does not exist on type
  BASIS = BASIS || global.BASIS;
  return await initializeBasisModule(BASIS, wasmBinary);
}

function initializeBasisModule(BasisModule, wasmBinary) {
  const options = {};

  if (wasmBinary) {
    options.wasmBinary = wasmBinary;
  }

  return new Promise(resolve => {
    // if you try to return BasisModule the browser crashes!
    BasisModule(options).then(module => {
      const {BasisFile, initializeBasis} = module;
      initializeBasis();
      resolve({BasisFile});
    });
  });
}
