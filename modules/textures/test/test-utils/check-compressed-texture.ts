// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect} from 'vitest';

export function checkCompressedTexture(imageData, testCase) {
  expect(imageData instanceof Array).toBeTruthy();
  expect(imageData.length > 0).toBeTruthy();
  for (const level of imageData) {
    expect(level.shape).toBe('texture-level');
    expect(level.compressed).toBeTruthy();
    expect(level.format).toBe(testCase.format);
    if (testCase.textureFormat) {
      expect(level.textureFormat).toBe(testCase.textureFormat);
    }
    expect(level.data instanceof Uint8Array).toBeTruthy();
    expect(isFinite(level.width)).toBeTruthy();
    expect(isFinite(level.height)).toBeTruthy();
    expect(isFinite(level.levelSize)).toBeTruthy();
  }
}
