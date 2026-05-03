import {expect, test} from 'vitest';
import {copyPaddedStringToDataView} from '@loaders.gl/loader-utils';
test('copyPaddedStringToDataView', () => {
  const STRING = 'abcdef';
  const byteLength1 = copyPaddedStringToDataView(null, 0, STRING, 4);
  expect(byteLength1).toBe(8); // padded
  const arrayBuffer1 = new ArrayBuffer(byteLength1);
  const dataView1 = new DataView(arrayBuffer1);
  const finalLength1 = copyPaddedStringToDataView(dataView1, 0, STRING, 4);
  expect(finalLength1).toBe(8);
  // Optional padding === 8
  const OPTIONAL_PADDING = 8;
  const byteLength2 = copyPaddedStringToDataView(null, 0, STRING, OPTIONAL_PADDING);
  expect(byteLength2).toBe(OPTIONAL_PADDING); // padded
  const arrayBuffer2 = new ArrayBuffer(byteLength2);
  const dataView2 = new DataView(arrayBuffer2);
  const finalLength2 = copyPaddedStringToDataView(dataView2, 0, STRING, OPTIONAL_PADDING);
  expect(finalLength2).toBe(OPTIONAL_PADDING);
});
