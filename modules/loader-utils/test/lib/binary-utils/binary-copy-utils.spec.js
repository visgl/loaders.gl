/* eslint-disable max-len */
import test from 'tape-promise/tape';

import {copyPaddedStringToDataView} from '@loaders.gl/loader-utils';

test('copyPaddedStringToDataView', (t) => {
  const STRING = 'abcdef';
  const byteLength1 = copyPaddedStringToDataView(null, 0, STRING, 4);
  t.equals(byteLength1, 8); // padded
  const arrayBuffer1 = new ArrayBuffer(byteLength1);
  const dataView1 = new DataView(arrayBuffer1);
  const finalLength1 = copyPaddedStringToDataView(dataView1, 0, STRING, 4);
  t.equals(finalLength1, 8);

  // Optional padding === 8
  const OPTIONAL_PADDING = 8;
  const byteLength2 = copyPaddedStringToDataView(null, 0, STRING, OPTIONAL_PADDING);
  t.equals(byteLength2, OPTIONAL_PADDING); // padded
  const arrayBuffer2 = new ArrayBuffer(byteLength2);
  const dataView2 = new DataView(arrayBuffer2);
  const finalLength2 = copyPaddedStringToDataView(dataView2, 0, STRING, OPTIONAL_PADDING);
  t.equals(finalLength2, OPTIONAL_PADDING);

  t.end();
});
