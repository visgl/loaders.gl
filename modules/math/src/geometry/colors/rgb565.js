export function decodeRGB565(rgb565, target = [0, 0, 0]) {
  const r5 = (rgb565 >> 11) & 31;
  const g6 = (rgb565 >> 5) & 63;
  const b5 = rgb565 & 31;

  target[0] = r5 << 3;
  target[1] = g6 << 2;
  target[2] = b5 << 3;

  return target;
}

export function encodeRGB565(rgb) {
  const r5 = Math.floor(rgb[0] / 8) + 4;
  const g6 = Math.floor(rgb[1] / 4) + 2;
  const b5 = Math.floor(rgb[2] / 8) + 4;
  return r5 + (g6 << 5) + (b5 << 11);
}
