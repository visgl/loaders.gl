import {expect, test} from 'vitest';
import {extractLoadLibraryOptions, getLibraryUrl, isBrowser} from '@loaders.gl/worker-utils';
import {VERSION} from '../../../src/lib/env-utils/version';
const DRACO_DECODER_URL =
  'https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.wasm';
test('getLibraryUrl # should return URL', () => {
  const result = getLibraryUrl(DRACO_DECODER_URL);
  expect(result).toBe(DRACO_DECODER_URL);
});
test('getLibraryUrl # should not return URL', () => {
  const result = getLibraryUrl(
    DRACO_DECODER_URL,
    'draco',
    {useLocalLibraries: true, CDN: 'https://c.d.n'},
    'draco_decoder.wasm'
  );
  if (isBrowser) {
    expect(result).toBe(`https://c.d.n/draco@${VERSION}/dist/libs/draco_decoder.wasm`);
  } else {
    expect(result).toBe('modules/draco/dist/libs/draco_decoder.wasm');
  }
});
test('getLibraryUrl # should get url from modules option', () => {
  const result = getLibraryUrl('draco_decoder.wasm', 'draco', {
    modules: {
      'draco_decoder.wasm': 'https://c.d.n/draco_decoder.wasm'
    }
  });
  expect(result).toBe('https://c.d.n/draco_decoder.wasm');
});
test('extractLoadLibraryOptions # flattens core options and preserves modules', () => {
  const modules = {
    'draco_decoder.wasm': 'https://c.d.n/draco_decoder.wasm'
  };
  const result = extractLoadLibraryOptions({
    core: {
      CDN: 'https://c.d.n',
      useLocalLibraries: true
    },
    modules
  });
  expect(result).toEqual({
    CDN: 'https://c.d.n',
    useLocalLibraries: true,
    modules
  });
});
test('library option normalization covers top-level overrides and invalid inputs', () => {
  expect(
    extractLoadLibraryOptions({
      useLocalLibraries: false,
      CDN: null,
      core: {useLocalLibraries: true, CDN: 'https://legacy.example.com'}
    })
  ).toEqual({useLocalLibraries: false, CDN: null});
  expect(extractLoadLibraryOptions()).toEqual({});
  expect(() => getLibraryUrl('decoder.js', 'test', {core: {} as any} as any)).toThrow(
    /must be pre-normalized/
  );
  expect(() => getLibraryUrl('decoder.js', 'test', {CDN: 42 as any})).toThrow(
    /must be a string or null/
  );
});
test('loadLibrary', () => {});
