// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

test('module workers import shipped decoder factories without leaking wrapper globals', async () => {
  const libraries = [
    ['draco', 'draco_decoder', 'DracoDecoderModule'],
    ['draco', 'draco_wasm_wrapper', 'DracoDecoderModule'],
    ['draco', 'draco_wasm_wrapper_gltf', 'DracoDecoderModule'],
    ['draco', 'draco_encoder', 'DracoEncoderModule'],
    ['images', 'basis_transcoder', 'BASIS'],
    ['images', 'basis_encoder', 'BASIS'],
    ['images', 'crunch', 'LoadCrunchDecoder']
  ];
  const libraryUrls = libraries.map(([moduleName, libraryName, globalName]) => [
    new URL(`/modules/${moduleName}/dist/libs/${libraryName}.mjs`, location.href).href,
    globalName
  ]);
  const source = `
    onmessage = async ({data}) => {
      try {
        const results = [];
        for (const [url, globalName] of data) {
          const library = await import(url);
          results.push({factory: typeof library.default, leaked: globalName in globalThis});
          if (url.endsWith('/crunch.mjs')) {
            const decoder = library.default();
            if (typeof decoder._crn_get_width !== 'function') throw new Error('Missing initialized Crunch decoder');
            if ('Module' in globalThis) throw new Error('Crunch leaked its legacy receiver');
          }
          if (url.endsWith('/draco_wasm_wrapper.mjs')) {
            const wasmBinary = await (await fetch(url.replace('draco_wasm_wrapper.mjs', 'draco_decoder.wasm'))).arrayBuffer();
            const decoder = await library.default({wasmBinary});
            if (typeof decoder.Decoder !== 'function') throw new Error('Missing initialized Draco decoder');
          }
        }
        postMessage({results});
      } catch (error) { postMessage({error: String(error)}); }
    };
  `;
  const workerUrl = URL.createObjectURL(new Blob([source], {type: 'text/javascript'}));
  const worker = new Worker(workerUrl, {type: 'module'});
  try {
    const result = await new Promise<{
      results?: {factory: string; leaked: boolean}[];
      error?: string;
    }>((resolve, reject) => {
      worker.onmessage = event => resolve(event.data);
      worker.onerror = event => reject(new Error(event.message));
      worker.postMessage(libraryUrls);
    });
    expect(result.error).toBeUndefined();
    expect(result.results).toEqual(libraries.map(() => ({factory: 'function', leaked: false})));
  } finally {
    worker.terminate();
    URL.revokeObjectURL(workerUrl);
  }
});
