// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile} from '@loaders.gl/core';
import {I3SLEPCCDecoder} from '@loaders.gl/i3s';
import {expect, test} from 'vitest';

const XYZ_FIXTURE = '@loaders.gl/i3s/test/data/point-cloud/SMALL_AUTZEN_LAS_All.pccxyz';
const INTENSITY_FIXTURE = '@loaders.gl/i3s/test/data/point-cloud/SMALL_AUTZEN_LAS_All.pccint';
const LEPCC_WASM_URL = '/node_modules/@bitruvius/turbo-lepcc/wasm/turbolepcc_wasm_bg.wasm';

test('I3SLEPCCDecoder decodes XYZ and intensity blobs', async () => {
  const [xyzResponse, intensityResponse] = await Promise.all([
    fetchFile(XYZ_FIXTURE),
    fetchFile(INTENSITY_FIXTURE)
  ]);
  const wasmResponse = await fetch(LEPCC_WASM_URL);
  expect(wasmResponse.ok).toBe(true);
  const decoder = new I3SLEPCCDecoder({wasmInit: {wasmBytes: await wasmResponse.arrayBuffer()}});
  const xyzBytes = new Uint8Array(await xyzResponse.arrayBuffer());
  const intensityBytes = new Uint8Array(await intensityResponse.arrayBuffer());

  expect(await decoder.getBlobType(xyzBytes)).toBe('xyz');
  expect(await decoder.getBlobType(intensityBytes)).toBe('intensity');

  const xyz = await decoder.decode(xyzBytes);
  const intensity = await decoder.decode(intensityBytes);
  expect(xyz).toBeInstanceOf(Float64Array);
  expect(intensity).toBeInstanceOf(Uint16Array);
  expect(xyz).toHaveLength(318);
  expect(intensity).toHaveLength(106);
  expect(Array.from(xyz.slice(0, 3))).toEqual([
    -123.06543906752144, 44.050196998248175, 130.32028000000003
  ]);
  expect(Array.from(intensity.slice(0, 6))).toEqual([0, 238, 9, 29, 1, 65]);
});
