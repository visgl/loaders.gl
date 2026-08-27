import {expect, test} from 'vitest';
import draco3d from 'draco3d';
import {isBrowser} from '@loaders.gl/worker-utils';
import {DracoLoader} from '../src/draco-loader';
import {Draco3DLoaderWithParser} from '../src/draco3d-loader-with-parser';
import {DracoJavaScriptLoaderWithParser} from '../src/draco-javascript-loader-with-parser';
import {DracoWASMLoaderWithParser} from '../src/draco-wasm-loader-with-parser';
import {loadDracoDecoderModule, loadDracoEncoderModule} from '../src/lib/draco-module-loader';
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
