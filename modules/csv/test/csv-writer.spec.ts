// loaders.gl, MIT license
// Copyright 2022 Foursquare Labs, Inc.

import test from 'tape-promise/tape';
import {CSVWriter} from '@loaders.gl/csv';
import {encodeTableAsText} from '@loaders.gl/core';

import {tableWithGeometryColumn} from '@loaders.gl/schema/test/shared-utils';

// type TestCase = {
//   name: string,
//   input: makeTestTable([]),
//   expected: ''
// },

import {Table, Field} from '@loaders.gl/schema';

type TestCase = {
  name: string;
  options?: Record<string, unknown>;
  input: Table;
  expected: any;
};

type TableColumn = [field: Field, data: ArrayLike<any>];

function makeTestTable(columns: TableColumn[]): Table {
  const table: Table = {
    shape: 'columnar-table',
    schema: {fields: [], metadata: {}},
    data: {}
  };

  for (const [field, data] of columns) {
    table.schema?.fields.push(field);
    table.data[field.name] = data;
  }

  return table;
}

test('CSVWriter ', async (t) => {
  const cases: TestCase[] = [
    {
      name: 'empty table',
      input: makeTestTable([]),
      expected: ''
    },
    {
      name: 'empty table, fields defined',
      input: makeTestTable([
        [{name: 'id', type: 'utf8'}, []],
        [{name: 'val', type: 'float64'}, []]
      ]),
      expected: 'id,val'
    },
    {
      name: 'table with metrics',
      input: makeTestTable([
        [{name: 'id', type: 'utf8'}, ['a', 'b', 'c']],
        [{name: 'val_uint', type: 'uint32'}, [1, 2, 3]],
        [{name: 'val_int', type: 'int32'}, [-1, -2, -3]],
        [{name: 'val_float', type: 'float64'}, [1.1, 2.2, 3.3]]
      ]),
      expected: `id,val_uint,val_int,val_float
a,1,-1,1.1
b,2,-2,2.2
c,3,-3,3.3`
    },
    {
      name: 'table with booleans',
      input: makeTestTable([
        [{name: 'id', type: 'utf8'}, ['a', 'b', 'c']],
        [{name: 'val', type: 'bool'}, [true, null, false]]
      ]),
      expected: `id,val
a,true
b,
c,false`
    },
    {
      name: 'table with geometry',
      input: tableWithGeometryColumn,
      expected: `geometry,population,growing,city
"{""type"":""Feature"",""geometry"":{""type"":""Point"",""coordinates"":[[0,0],[1,1]]}}",100,true,tableville
"{""type"":""Feature"",""geometry"":{""type"":""Point"",""coordinates"":[[2,2],[3,3]]}}",200,false,row city`
    },
    {
      name: 'Zeroes and nulls',
      input: makeTestTable([
        [{name: 'id', type: 'utf8'}, ['a', 'b', 'c', 'd']],
        [{name: 'val', type: 'int32'}, [0, -0, null, undefined]]
      ]),
      expected: `id,val
a,0
b,0
c,
d,`
    },
    {
      name: 'Values with quotes',
      input: makeTestTable([
        [{name: 'id', type: 'utf8'}, ['a', 'b', 'c', 'd', 'e', 'f', 'g']],
        [
          {name: 'val', type: 'utf8'},
          ['"Test"', 'Tes"t', 'Test test', 'Te\\"st', ',Test,', 'Test\nTest', '']
        ]
      ]),
      expected: `id,val
a,"""Test"""
b,"Tes""t"
c,Test test
d,"Te\\""st"
e,",Test,"
f,"Test\nTest"
g,` // TODO: This really ought to be g,"" but there doesn't seem to be a way to do this with dsv
    },
    {
      name: 'Dates',
      input: makeTestTable([
        [{name: 'id', type: 'utf8'}, ['a']],
        [{name: 'day', type: 'date-day'}, [new Date('2021-01-01T00:00:00Z')]],
        [{name: 'min', type: 'date-millisecond'}, [new Date('2021-01-01T11:12:13Z')]]
      ]),
      expected: `id,day,min
a,2021-01-01T00:00:00.000Z,2021-01-01T11:12:13.000Z`
    },
    {
      name: 'table with display names',
      input: makeTestTable([
        [{name: 'id', type: 'utf8', metadata: {displayName: 'foo'}}, ['a', 'b', 'c']],
        [{name: 'val_uint', type: 'uint32', metadata: {displayName: 'bar'}}, [1, 2, 3]]
      ]),
      expected: `foo,bar
a,1
b,2
c,3`
    },
    {
      name: 'table with display names (explicit options)',
      options: {useDisplayNames: true},
      input: makeTestTable([
        [{name: 'id', type: 'utf8', metadata: {displayName: 'foo'}}, ['a', 'b', 'c']],
        [{name: 'val_uint', type: 'uint32', metadata: {displayName: 'bar'}}, [1, 2, 3]]
      ]),
      expected: `foo,bar
a,1
b,2
c,3`
    },
    {
      name: 'table with display names (explicit suppression)',
      options: {useDisplayNames: false},
      input: makeTestTable([
        [{name: 'id', type: 'utf8', metadata: {displayName: 'foo'}}, ['a', 'b', 'c']],
        [{name: 'val_uint', type: 'uint32', metadata: {displayName: 'bar'}}, [1, 2, 3]]
      ]),
      expected: `id,val_uint
a,1
b,2
c,3`
    }
  ];

  for (const {name, input, options, expected} of cases) {
    const output = await encodeTableAsText(input, CSVWriter, options);
    t.equal(output, expected, name);
  }

  t.end();
});
