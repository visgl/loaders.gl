/* eslint-disable max-len */
import test from 'tape-promise/tape';

import {copyPaddedStringToDataView} from '@loaders.gl/loader-utils';

test('encode-utils', t => {
  const STRING = 'abcdef';
  const byteLength = copyPaddedStringToDataView(null, 0, STRING);
  t.equals(byteLength, 8); // padded
  const arrayBuffer = new ArrayBuffer(byteLength);
  const dataView = new DataView(arrayBuffer);
  const finalLength = copyPaddedStringToDataView(dataView, 0, STRING);
  t.equals(finalLength, 8);
  t.end();
});
