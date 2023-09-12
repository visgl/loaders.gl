import test from 'tape-promise/tape';
import {getLibraryUrl, isBrowser} from '@loaders.gl/worker-utils';
import {VERSION as __VERSION__} from '../../../src/lib/env-utils/version';

const LATEST = 'beta';
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : LATEST;

const DRACO_DECODER_URL =
  'https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.wasm';

test('getLibraryUrl # should return URL', (t) => {
  const result = getLibraryUrl(DRACO_DECODER_URL);
  t.equals(result, DRACO_DECODER_URL);
  t.end();
});

test('getLibraryUrl # should not return URL', (t) => {
  const result = getLibraryUrl(
    DRACO_DECODER_URL,
    'draco',
    {useLocalLibraries: true, CDN: 'https://c.d.n'},
    'draco_decoder.wasm'
  );
  if (isBrowser) {
    t.equals(result, `https://c.d.n/draco@${VERSION}/dist/libs/draco_decoder.wasm`);
  } else {
    t.equals(result, 'modules/draco/dist/libs/draco_decoder.wasm');
  }

  t.end();
});

test('getLibraryUrl # should get url from modules option', (t) => {
  const result = getLibraryUrl('draco_decoder.wasm', 'draco', {
    modules: {
      'draco_decoder.wasm': 'https://c.d.n/draco_decoder.wasm'
    }
  });
  t.equals(result, 'https://c.d.n/draco_decoder.wasm');

  t.end();
});

test('loadLibrary', (t) => {
  // loadLibrary({});
  t.end();
});
