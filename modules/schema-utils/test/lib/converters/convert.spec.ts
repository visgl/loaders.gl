// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {makeTableFromData, convert, type Converter, TableConverter} from '@loaders.gl/schema-utils';
import {ArrowConverter} from '@loaders.gl/arrow';

test('convert() selects direct converter over longer path', async t => {
  const calls: string[] = [];
  const directConverter: Converter<'start' | 'middle' | 'target'> = {
    id: 'direct',
    from: ['start'],
    to: ['target'],
    convert(input, targetShape) {
      calls.push(`direct:${targetShape}`);
      return {shape: targetShape, value: (input as {value: number}).value + 10};
    }
  };
  const firstHopConverter: Converter<'start' | 'middle' | 'target'> = {
    id: 'first-hop',
    from: ['start'],
    to: ['middle'],
    convert(input, targetShape) {
      calls.push(`first-hop:${targetShape}`);
      return {shape: targetShape, value: (input as {value: number}).value + 1};
    }
  };
  const secondHopConverter: Converter<'start' | 'middle' | 'target'> = {
    id: 'second-hop',
    from: ['middle'],
    to: ['target'],
    convert(input, targetShape) {
      calls.push(`second-hop:${targetShape}`);
      return {shape: targetShape, value: (input as {value: number}).value + 1};
    }
  };

  const result = convert({shape: 'start', value: 1}, 'target', [
    firstHopConverter,
    secondHopConverter,
    directConverter
  ]) as {shape: string; value: number};

  t.equal(result.shape, 'target', 'selected the target shape');
  t.equal(result.value, 11, 'used the direct path result');
  t.deepEqual(calls, ['direct:target'], 'only executed the direct converter');
  t.end();
});

test('convert() rejects ambiguous source shape detection', async t => {
  const firstConverter: Converter<'alpha' | 'target'> = {
    id: 'alpha',
    from: ['alpha'],
    to: ['target'],
    detectInputShape() {
      return 'alpha';
    },
    convert(input) {
      return input;
    }
  };
  const secondConverter: Converter<'beta' | 'target'> = {
    id: 'beta',
    from: ['beta'],
    to: ['target'],
    detectInputShape() {
      return 'beta';
    },
    convert(input) {
      return input;
    }
  };

  t.throws(
    () =>
      convert({value: 1}, 'target', [
        firstConverter as Converter<string>,
        secondConverter as Converter<string>
      ]),
    /Ambiguous source shape/,
    'throws on ambiguous source shape'
  );
  t.end();
});

test('convert() forwards options to each step', async t => {
  const seenOptions: unknown[] = [];
  const converter: Converter<'start' | 'target', {flag: boolean}> = {
    id: 'options',
    from: ['start'],
    to: ['target'],
    convert(input, targetShape, options) {
      seenOptions.push(options);
      return {...(input as {shape: string}), shape: targetShape};
    }
  };

  convert({shape: 'start'}, 'target', [converter], {flag: true});
  t.deepEqual(seenOptions, [{flag: true}], 'forwarded options to the step');
  t.end();
});

test('convert() performs a real arrow roundtrip with explicit converters', async t => {
  const table = makeTableFromData([
    {name: 'alpha', value: 1},
    {name: 'beta', value: 2}
  ]);

  const arrowTable = convert(table, 'arrow', [ArrowConverter, TableConverter]);
  const roundTrippedTable = convert(arrowTable, 'object-row-table', [ArrowConverter]) as {
    shape: string;
    data: Array<Record<string, unknown>>;
  };

  t.equal(roundTrippedTable.shape, 'object-row-table', 'returned the requested table shape');
  t.deepEqual(
    roundTrippedTable.data,
    [
      {name: 'alpha', value: 1},
      {name: 'beta', value: 2}
    ],
    'round-tripped table rows through the generic convert dispatcher'
  );
  t.end();
});
