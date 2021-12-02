import test from 'tape-promise/tape';
// @ts-expect-error
import {convertTextureAtlas} from '@loaders.gl/tile-converter/3d-tiles-converter/helpers/texture-atlas';

test('3DTilesConverter#should convert texture atlas', async (t) => {
  const UV = new Float32Array([0.12345, 0.54321]);
  const uvRegion = new Uint16Array([12345, 54321, 56789, 98765]);
  const expectedUvs = new Float32Array([0.2720929682254791, 0.6540568470954895]);

  const convertedUVs = convertTextureAtlas(UV, uvRegion);
  t.ok(convertedUVs);
  t.deepEqual(convertedUVs, expectedUvs);
});
