// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import test from 'tape-promise/tape';
import {HTTPRangeReader} from '../../src/hdf5/http-range-reader';
import {decodeCFNumericValues, parseCFVariableMetadata} from '../../src/netcdf/cf-conventions';
import {HDF5Source} from '../../src/hdf5/hdf5-source';

test('strict HTTP byte-range transport', async t => {
  const reader = new HTTPRangeReader('https://example.invalid/data.nc', async (_url, init) => {
    t.equal((init?.headers as Record<string, string>).Range, 'bytes=2-4');
    return new Response(new Uint8Array([2, 3, 4]), {
      status: 206, headers: {'Content-Range': 'bytes 2-4/10'}
    });
  });
  t.deepEqual(Array.from(await reader.read(2, 3)), [2, 3, 4]);
  await t.rejects(new HTTPRangeReader('https://example.invalid', async () =>
    new Response('full file', {status: 200})).read(0, 4), /206 required/);
  t.end();
});

test('CF packed values and backend selection pushdown', async t => {
  const cf = parseCFVariableMetadata({
    units: 'K', standard_name: 'air_temperature', _FillValue: -9999,
    scale_factor: 0.5, add_offset: 200, valid_range: [0, 100]
  });
  t.deepEqual(Array.from(decodeCFNumericValues([10, -9999, 110], cf)), [205, NaN, NaN]);
  let fullReads = 0;
  const source = new HDF5Source({async listDatasets() {return [{
    path: '/t', dataset: {
      shape: [2, 3], dtype: 'float32',
      async read() {fullReads++; return new Float32Array(6);},
      async readSelection(ranges: readonly (readonly [number, number])[]) {
        t.deepEqual(ranges, [[0, 2], [1, 3]]);
        return new Float32Array([2, 3, 5, 6]);
      }
    }
  }];}});
  const values = await source.readScientificVariable('/t', {'/t:dim_1': [1, 3]});
  t.equal(fullReads, 0);
  t.deepEqual(Array.from(values.data as Float32Array), [2, 3, 5, 6]);
  t.end();
});
