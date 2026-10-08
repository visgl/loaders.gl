import {expect, test} from 'vitest';
import {getDracoLibraryOptions} from '../src/bundled';
import {loadDracoDecoderModule} from '../src/lib/draco-module-loader';

test('bundled Draco libraries default to the full decoder and include encoding and fallback', () => {
  const options = getDracoLibraryOptions();
  expect(options.decoderProfile).toBe('full');
  expect(Object.keys(options.modules!).sort()).toEqual([
    'draco_decoder.js',
    'draco_decoder.wasm',
    'draco_encoder.js',
    'draco_encoder.wasm',
    'draco_wasm_wrapper.js'
  ]);
  for (const [name, url] of Object.entries(options.modules!)) {
    expect(new URL(url).pathname).toContain(`/libs/${name}`);
  }
});

test.each([
  'full',
  'gltf'
] as const)('bundled Draco %s assets initialize without a CDN', async decoderProfile => {
  const options = getDracoLibraryOptions({decoderProfile, useLocalLibraries: false});
  const suffix = decoderProfile === 'gltf' ? '_gltf' : '';
  expect(options.modules![`draco_wasm_wrapper${suffix}.js`]).toBeTypeOf('string');
  expect(options.modules![`draco_decoder${suffix}.wasm`]).toBeTypeOf('string');
  const module = await loadDracoDecoderModule(options, 'wasm', options.decoderProfile);
  expect(module.draco.Decoder).toBeTypeOf('function');
});

test('bundled Draco libraries preserve application URL and injected-module overrides', () => {
  const binary = new ArrayBuffer(8);
  const overrides = {
    'draco_wasm_wrapper_gltf.js': 'https://example.invalid/decoder.js',
    'draco_decoder_gltf.wasm': binary,
    custom: 'custom asset'
  };
  const original = {...overrides};
  const options = getDracoLibraryOptions({
    decoderProfile: 'gltf',
    CDN: null,
    useLocalLibraries: true,
    modules: overrides
  });
  expect(options).toMatchObject({decoderProfile: 'gltf', CDN: null, useLocalLibraries: true});
  expect(options.modules).toMatchObject(overrides);
  expect(options.modules!['draco_decoder_gltf.wasm']).toBe(binary);
  expect(overrides).toEqual(original);
  expect(options.modules!['draco_wasm_wrapper.js']).toBeUndefined();
});
