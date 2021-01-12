import {loadLibrary, global} from '@loaders.gl/loader-utils';

let CrunchModule;

export async function loadCrunchModule(options) {
  const modules = options.modules || {};
  if (modules.crunch) {
    return modules.crunch;
  }

  return loadCrunch(options);
}

async function loadCrunch(options) {
  if (CrunchModule) {
    return CrunchModule;
  }

  let LoadCrunchDecoder = null;

  // TODO: load the module from 'textures' as soon as 'textures' npm package is published
  // [LoadCrunchDecoder] = await Promise.all([await loadLibrary('crunch.js', 'textures', options)]);
  [LoadCrunchDecoder] = await Promise.all([await loadLibrary('crunch.js', 'basis', options)]);

  // Depends on how import happened...
  // @ts-ignore TS2339: Property does not exist on type
  LoadCrunchDecoder = LoadCrunchDecoder || global.LoadCrunchDecoder;
  CrunchModule = LoadCrunchDecoder();
  return CrunchModule;
}
