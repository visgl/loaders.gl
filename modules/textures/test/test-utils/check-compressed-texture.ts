export function checkCompressedTexture(t, imageData, testCase) {
  t.ok(imageData instanceof Array);
  t.ok(imageData.length > 0);
  for (const level of imageData) {
    t.ok(level.compressed);
    t.equals(level.format, testCase.format);
    t.ok(level.data instanceof Uint8Array);
    t.ok(isFinite(level.width));
    t.ok(isFinite(level.height));
    t.ok(isFinite(level.levelSize));
  }
}
