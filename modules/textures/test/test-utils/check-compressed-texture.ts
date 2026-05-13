// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export function checkCompressedTexture(t, imageData, testCase) {
  t.ok(imageData instanceof Array);
  t.ok(imageData.length > 0);
  for (const level of imageData) {
    t.equals(level.shape, 'texture-level');
    t.ok(level.compressed);
    t.equals(level.format, testCase.format);
    if (testCase.textureFormat) {
      t.equals(level.textureFormat, testCase.textureFormat);
    }
    t.ok(level.data instanceof Uint8Array);
    t.ok(isFinite(level.width));
    t.ok(isFinite(level.height));
    t.ok(isFinite(level.levelSize));
  }
}
