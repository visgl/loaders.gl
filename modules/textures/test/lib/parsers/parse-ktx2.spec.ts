// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {parseKTX, readKTX2Container} from '../../../src/lib/parsers/parse-ktx';

const KTX2_IDENTIFIER = [0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a];

describe('KTX2 container reader', () => {
  test('reads a native GPU level', () => {
    const data = createKTX2();
    const container = readKTX2Container(data);
    const levels = parseKTX(data);

    expect(container.vkFormat).toBe(131);
    expect(container.levels[0].levelData.byteLength).toBe(8);
    expect(levels[0]).toMatchObject({
      width: 4,
      height: 4,
      compressed: true,
      textureFormat: 'bc1-rgb-unorm-webgl',
      levelSize: 8
    });
  });

  test('rejects truncated headers and level indexes', () => {
    expect(() => readKTX2Container(new Uint8Array(KTX2_IDENTIFIER).buffer)).toThrow(
      'Truncated KTX2 header'
    );
    expect(() => readKTX2Container(createKTX2({totalByteLength: 90}))).toThrow('KTX2 level index');
  });

  test('rejects unsafe and out-of-range level offsets', () => {
    const unsafeOffset = createKTX2();
    new DataView(unsafeOffset).setUint32(84, 0x20_0000, true);
    expect(() => readKTX2Container(unsafeOffset)).toThrow('safe integer range');

    const outOfRange = createKTX2();
    new DataView(outOfRange).setUint32(80, 10_000, true);
    expect(() => readKTX2Container(outOfRange)).toThrow('outside the KTX2 container');
  });

  test('routes supercompressed and undefined-format textures to BasisLoader', () => {
    expect(() => parseKTX(createKTX2({supercompressionScheme: 2}))).toThrow('BasisLoader');
    expect(() => parseKTX(createKTX2({vkFormat: 0}))).toThrow('BasisLoader');
  });

  test('rejects 3D textures', () => {
    expect(() => parseKTX(createKTX2({pixelDepth: 2}))).toThrow('3D KTX2');
  });
});

/** Creates a minimal KTX2 container for parser boundary tests. */
function createKTX2(
  options: {
    vkFormat?: number;
    pixelDepth?: number;
    supercompressionScheme?: number;
    totalByteLength?: number;
  } = {}
): ArrayBuffer {
  const totalByteLength = options.totalByteLength ?? 112;
  const data = new Uint8Array(totalByteLength);
  data.set(KTX2_IDENTIFIER);
  const dataView = new DataView(data.buffer);
  dataView.setUint32(12, options.vkFormat ?? 131, true);
  dataView.setUint32(16, 1, true);
  dataView.setUint32(20, 4, true);
  dataView.setUint32(24, 4, true);
  dataView.setUint32(28, options.pixelDepth ?? 0, true);
  dataView.setUint32(36, 1, true);
  dataView.setUint32(40, 1, true);
  dataView.setUint32(44, options.supercompressionScheme ?? 0, true);
  if (totalByteLength >= 104) {
    dataView.setUint32(80, 104, true);
    dataView.setUint32(88, 8, true);
    dataView.setUint32(96, 8, true);
  }
  return data.buffer;
}
