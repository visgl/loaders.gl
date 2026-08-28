import {expect, test} from 'vitest';
import draco3d from 'draco3d';
import {isBrowser} from '@loaders.gl/worker-utils';
import {DracoLoader} from '../src/draco-loader';
import {Draco3DLoaderWithParser} from '../src/draco3d-loader-with-parser';
import {DracoJavaScriptLoaderWithParser} from '../src/draco-javascript-loader-with-parser';
import {DracoWASMLoaderWithParser} from '../src/draco-wasm-loader-with-parser';
import {
  DRACO_EXTERNAL_LIBRARIES,
  DRACO_EXTERNAL_LIBRARY_URLS,
  loadDracoDecoderModule,
  loadDracoDecoderModuleFromDraco3D,
  loadDracoEncoderModule
} from '../src/lib/draco-module-loader';
test('DracoLoader#preload selects backend loader', async () => {
  expect(
    await DracoLoader.preload?.('', {draco: {backend: 'wasm'}}),
    'selects the WASM backend loader'
  ).toBe(DracoWASMLoaderWithParser);
  expect(
    await DracoLoader.preload?.('', {draco: {backend: 'javascript'}}),
    'selects the JavaScript backend loader'
  ).toBe(DracoJavaScriptLoaderWithParser);
  expect(
    await DracoLoader.preload?.('', {draco: {backend: 'draco3d'}, modules: {draco3d}}),
    'selects the injected draco3d backend loader'
  ).toBe(Draco3DLoaderWithParser);
  expect(
    await DracoLoader.preload?.('', {draco: {decoderType: 'js'}}),
    'maps legacy decoderType to the JavaScript backend loader'
  ).toBe(DracoJavaScriptLoaderWithParser);
});
test('draco-module-loader#uses injected decoder module', async () => {
  if (isBrowser) {
    console.log('Skipping Draco WASM module test in browser');
    return;
  }
  const module = await loadDracoDecoderModule(
    {
      modules: {
        draco3d
      }
    },
    'wasm'
  );
  expect(module.draco, 'returns a decoder instance from the injected draco3d package').toBeTruthy();
});
test('draco-module-loader#uses injected encoder module', async () => {
  if (isBrowser) {
    console.log('Skipping Draco WASM module test in browser');
    return;
  }
  const module = await loadDracoEncoderModule({
    modules: {
      draco3d
    }
  });
  expect(
    module.draco,
    'returns an encoder instance from the injected draco3d package'
  ).toBeTruthy();
});

test('draco-module-loader#loads vendored 1.5.7 WASM runtimes in browsers', async () => {
  if (!isBrowser) {
    return;
  }
  const decoderModule = await loadDracoDecoderModule({useLocalLibraries: true}, 'wasm');
  const javascriptDecoderModule = await loadDracoDecoderModule({useLocalLibraries: true}, 'js');
  const encoderModule = await loadDracoEncoderModule({useLocalLibraries: true});
  expect(decoderModule.draco.Decoder).toBeTypeOf('function');
  expect(javascriptDecoderModule.draco.Decoder).toBeTypeOf('function');
  expect(encoderModule.draco.Encoder).toBeTypeOf('function');
});

test('draco-module-loader#pins all default runtimes to Draco 1.5.7', () => {
  const dracoReleaseCommit = '8786740086a9f4d83f44aa83badfbea4dce7a1b5';
  expect(DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.DECODER]).toContain('/1.5.7/');
  expect(DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.DECODER_WASM]).toContain('/1.5.7/');
  expect(DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.ENCODER]).toContain(
    `cdn.jsdelivr.net/gh/google/draco@${dracoReleaseCommit}/javascript/draco_encoder.js`
  );
  expect(DRACO_EXTERNAL_LIBRARY_URLS[DRACO_EXTERNAL_LIBRARIES.ENCODER_WASM]).toContain(
    `cdn.jsdelivr.net/gh/google/draco@${dracoReleaseCommit}/javascript/draco_encoder.wasm`
  );
});

test('draco-module-loader#keeps injected modules isolated', async () => {
  const firstDecoder = {name: 'first-decoder'};
  const secondDecoder = {name: 'second-decoder'};
  const firstModule = {createDecoderModule: async () => firstDecoder};
  const secondModule = {createDecoderModule: async () => secondDecoder};

  expect((await loadDracoDecoderModuleFromDraco3D(firstModule)).draco).toBe(firstDecoder);
  expect((await loadDracoDecoderModuleFromDraco3D(secondModule)).draco).toBe(secondDecoder);
});
