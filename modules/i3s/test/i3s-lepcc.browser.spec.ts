// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, parse} from '@loaders.gl/core';
import {I3SLEPCCDecoder, I3SLEPCCLoader} from '@loaders.gl/i3s';
import {expect, test} from 'vitest';

const XYZ_FIXTURE = '@loaders.gl/i3s/test/data/point-cloud/SMALL_AUTZEN_LAS_All.pccxyz';
const INTENSITY_FIXTURE = '@loaders.gl/i3s/test/data/point-cloud/SMALL_AUTZEN_LAS_All.pccint';
const RGB_FIXTURE = '@loaders.gl/i3s/test/data/point-cloud/SMALL_AUTZEN_LAS_All.rgb';
const FLAGS_FIXTURE = '@loaders.gl/i3s/test/data/point-cloud/SMALL_AUTZEN_LAS_All.flags';

test('I3SLEPCCDecoder decodes LEPCC attribute blobs', async () => {
  const [xyzResponse, intensityResponse, rgbResponse, flagsResponse] = await Promise.all([
    fetchFile(XYZ_FIXTURE),
    fetchFile(INTENSITY_FIXTURE),
    fetchFile(RGB_FIXTURE),
    fetchFile(FLAGS_FIXTURE)
  ]);
  const decoder = new I3SLEPCCDecoder();
  const xyzBytes = new Uint8Array(await xyzResponse.arrayBuffer());
  const intensityBytes = new Uint8Array(await intensityResponse.arrayBuffer());
  const rgbBytes = new Uint8Array(await rgbResponse.arrayBuffer());
  const flagsBytes = new Uint8Array(await flagsResponse.arrayBuffer());

  expect(await decoder.getBlobType(xyzBytes)).toBe('xyz');
  expect(await decoder.getBlobType(intensityBytes)).toBe('intensity');
  expect(await decoder.getBlobType(rgbBytes)).toBe('rgb');
  expect(await decoder.getBlobType(flagsBytes)).toBe('flagBytes');

  const xyz = await decoder.decode(xyzBytes);
  const intensity = await decoder.decode(intensityBytes);
  const rgb = await decoder.decode(rgbBytes);
  const flags = await decoder.decode(flagsBytes);
  expect(xyz).toBeInstanceOf(Float64Array);
  expect(intensity).toBeInstanceOf(Uint16Array);
  expect(rgb).toBeInstanceOf(Uint8Array);
  expect(flags).toBeInstanceOf(Uint8Array);
  expect(xyz).toHaveLength(318);
  expect(intensity).toHaveLength(106);
  expect(rgb).toHaveLength(3000);
  expect(flags).toHaveLength(1000);
  expect(Array.from(xyz.slice(0, 3))).toEqual([
    -123.06543906752144, 44.050196998248175, 130.32028000000003
  ]);
  expect(Array.from(intensity.slice(0, 6))).toEqual([0, 238, 9, 29, 1, 65]);
  expect(Array.from(rgb.slice(0, 9))).toEqual([10, 40, 60, 20, 30, 60, 20, 40, 50]);
  expect(Array.from(flags.slice(0, 12))).toEqual([7, 3, 3, 3, 3, 3, 3, 3, 3, 3, 7, 3]);
});

test('I3SLEPCCLoader decodes resources in a worker', async () => {
  const response = await fetchFile(XYZ_FIXTURE);
  const result = await parse(await response.arrayBuffer(), I3SLEPCCLoader, {
    core: {worker: true, reuseWorkers: false, _workerType: 'test'}
  });
  expect(result.type).toBe('xyz');
  expect(result.value).toBeInstanceOf(Float64Array);
  expect(result.value).toHaveLength(318);
});
