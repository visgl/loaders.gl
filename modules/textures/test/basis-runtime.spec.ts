// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test, vi} from 'vitest';
// @ts-ignore Vite supplies raw runtime source for this browser test.
import encoderSource from '../src/libs/basis_encoder.js?raw';
// @ts-ignore Vite supplies raw runtime source for this browser test.
import transcoderSource from '../src/libs/basis_transcoder.js?raw';
import {encodeKTX2BasisTexture} from '../src/lib/encoders/encode-ktx2-basis-texture';
import {parseBasis} from '../src/lib/parsers/parse-basis';

let basisEncoder: any;
let basis: any;
let basisInput: ArrayBuffer;

beforeAll(async () => {
  basisInput = await (await fetch('/modules/textures/test/data/alpha3.basis')).arrayBuffer();
  for (const runtime of ['encoder', 'transcoder']) {
    const source = runtime === 'encoder' ? encoderSource : transcoderSource;
    const wasmBinary = await (
      await fetch(`/modules/textures/src/libs/basis_${runtime}.wasm`)
    ).arrayBuffer();
    // Execute the unmodified vendored browser factory in its own function scope.
    // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
    const createModule = new Function(`${source}; return BASIS;`)();
    const module = await createModule({wasmBinary});
    module.initializeBasis();
    if (runtime === 'encoder') {
      basisEncoder = {
        BasisEncoder: module.BasisEncoder,
        BasisFile: module.BasisFile,
        KTX2File: module.KTX2File
      };
    } else {
      basis = {BasisFile: module.BasisFile};
    }
  }
});

test.each([false, true])(
  'round trips a tiny KTX2 image with encodeUASTC=%s',
  async (encodeUASTC) => {
    const data = new Uint8Array(4 * 4 * 4).fill(255);
    const encoded = await encodeKTX2BasisTexture(
      {data, width: 4, height: 4},
      {modules: {basisEncoder}, 'ktx2-basis-writer': {encodeUASTC}}
    );
    expect(encoded.byteLength).toBeLessThan(65536);
    expect(new DataView(encoded).getUint32(0, true)).toBe(0x58544bab);
    expect(new DataView(encoded).getUint32(20, true)).toBe(4);
    const file = new basisEncoder.KTX2File(new Uint8Array(encoded));
    try {
      expect(file.getBasisTexFormat()).toBe(encodeUASTC ? 1 : 0);
    } finally {
      file.close();
      file.delete();
    }
    const images = await parseBasis(encoded, {modules: {basisEncoder}, basis: {format: 'rgba32'}});
    expect(images[0][0].width).toBe(4);
    expect(images[0][0].height).toBe(4);
    expect(images[0][0].data.byteLength).toBe(64);
    expect(Array.from(images[0][0].data as Uint8Array)).toEqual(Array(64).fill(255));
  }
);

test.each(['bc7-m5', 'bc7-m6-opaque-only'] as const)(
  'preserves legacy BC7 output option %s',
  async (format) => {
    const images = await parseBasis(basisInput, {modules: {basis}, basis: {format}});
    expect(images[0][0].width).toBe(768);
    expect(images[0][0].height).toBe(512);
    expect(images[0][0].data.byteLength).toBe(393216);
  }
);

test('retains the legacy injected encoder transfer setter and trims output', async () => {
  const encoder = Object.fromEntries(
    [
      'setCreateKTX2File',
      'setKTX2UASTCSupercompression',
      'setKTX2SRGBTransferFunc',
      'setSliceSourceImage',
      'setPerceptual',
      'setMipSRGB',
      'setQualityLevel',
      'setUASTC',
      'setMipGen',
      'delete'
    ].map((name) => [name, vi.fn()])
  );
  encoder.encode = vi.fn((output) => {
    output.set([1, 2, 3, 4]);
    return 4;
  });
  const createEncoder = vi.fn(function () {
    return encoder;
  });
  const encoded = await encodeKTX2BasisTexture(
    {data: new Uint8Array(4), width: 1, height: 1},
    {modules: {basisEncoder: {BasisEncoder: createEncoder}}}
  );
  expect(encoder.setKTX2SRGBTransferFunc).toHaveBeenCalledWith(true);
  expect(new Uint8Array(encoded)).toEqual(new Uint8Array([1, 2, 3, 4]));
  expect(encoder.delete).toHaveBeenCalledOnce();
});
