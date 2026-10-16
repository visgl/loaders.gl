// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const libraryExports = {
  draco: {
    'draco_decoder': 'DracoDecoderModule',
    'draco_wasm_wrapper': 'DracoDecoderModule',
    'draco_wasm_wrapper_gltf': 'DracoDecoderModule',
    'draco_encoder': 'DracoEncoderModule'
  },
  textures: {
    'basis_transcoder': 'BASIS',
    'basis_encoder': 'BASIS',
    'crunch': 'LoadCrunchDecoder'
  }
};

const moduleName = process.argv[2];
if (!Object.hasOwn(libraryExports, moduleName)) {
  throw new Error(`No ESM library adapters configured for ${moduleName}`);
}

await buildLibraryModules(moduleName, libraryExports[moduleName]);

/** Generates explicit ESM factory exports while leaving audited upstream classic assets untouched. */
async function buildLibraryModules(moduleName, exportsByLibrary) {
  const outputDirectory = resolve('dist/libs');
  await mkdir(outputDirectory, {recursive: true});
  for (const [libraryName, exportName] of Object.entries(exportsByLibrary)) {
    let factoryExport = exportName;
    let source = await readFile(resolve(`src/libs/${libraryName}.js`), 'utf8');
    if (moduleName === 'textures' && libraryName === 'crunch') {
      // The old worker shim assigns to an undeclared window and relies on classic-script `this`.
      // Give it a module-local binding instead of changing the worker global or vendor source.
      if (!source.includes('window = this;')) {
        throw new Error('Crunch worker shim changed; review its ESM adapter');
      }
      // Other generated functions read Module directly; retain a module-local binding too.
      source = source.replace('window = this;', 'var window = globalThis; var Module;');
      source = source.replaceAll('this.Module=s', 'this.Module=Module=s');
      // The factory assigns this.Module; isolate that legacy receiver from worker globals.
      factoryExport = `${exportName}.bind({})`;
    }
    await writeFile(
      resolve(outputDirectory, `${libraryName}.mjs`),
      `${source}\n// loaders.gl ESM adapter: explicit factory export, no global installation.\nexport default ${factoryExport};\n`
    );
  }
}
