// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {getGeoArrowTransferList} from '@loaders.gl/geoarrow';

test('getGeoArrowTransferList returns unique nested Arrow backing buffers', () => {
  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('value', new arrow.Float64(), false)
  );
  const lineType = new arrow.List(new arrow.Field('value', coordinateType, true));
  const column = arrow.vectorFromArray(
    [
      [
        [1, 2],
        [3, 4]
      ],
      null
    ],
    lineType
  );

  const transferList = getGeoArrowTransferList(column);

  expect(transferList.length).toBeGreaterThan(1);
  expect(new Set(transferList).size).toBe(transferList.length);
  expect(transferList.every(buffer => buffer instanceof ArrayBuffer)).toBe(true);
});

test('getGeoArrowTransferList includes variadic buffers from Arrow view storage', () => {
  const column = arrow.vectorFromArray([new Uint8Array(128)], new arrow.BinaryView());
  const data = column.data[0] as arrow.Data & {
    variadicBuffers?: Uint8Array[];
  };
  const variadicBuffer = data.variadicBuffers?.[0];

  expect(variadicBuffer).toBeTruthy();
  expect(getGeoArrowTransferList(column)).toContain(variadicBuffer!.buffer);
});
