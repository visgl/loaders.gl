// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {makeTableFromData, convert, type Converter, TableConverter} from '@loaders.gl/schema-utils';
import {ArrowConverter} from '@loaders.gl/arrow';
test('convert() selects direct converter over longer path', async () => {
  const calls: string[] = [];
  const directConverter: Converter<'start' | 'middle' | 'target'> = {
    id: 'direct',
    from: ['start'],
    to: ['target'],
    convert(input, targetShape) {
      calls.push(`direct:${targetShape}`);
      return {
        shape: targetShape,
        value:
          (
            input as {
              value: number;
            }
          ).value + 10
      };
    }
  };
  const firstHopConverter: Converter<'start' | 'middle' | 'target'> = {
    id: 'first-hop',
    from: ['start'],
    to: ['middle'],
    convert(input, targetShape) {
      calls.push(`first-hop:${targetShape}`);
      return {
        shape: targetShape,
        value:
          (
            input as {
              value: number;
            }
          ).value + 1
      };
    }
  };
  const secondHopConverter: Converter<'start' | 'middle' | 'target'> = {
    id: 'second-hop',
    from: ['middle'],
    to: ['target'],
    convert(input, targetShape) {
      calls.push(`second-hop:${targetShape}`);
      return {
        shape: targetShape,
        value:
          (
            input as {
              value: number;
            }
          ).value + 1
      };
    }
  };
  const result = convert({shape: 'start', value: 1}, 'target', [
    firstHopConverter,
    secondHopConverter,
    directConverter
  ]) as {
    shape: string;
    value: number;
  };
  expect(result.shape, 'selected the target shape').toBe('target');
  expect(result.value, 'used the direct path result').toBe(11);
  expect(calls, 'only executed the direct converter').toEqual(['direct:target']);
});
test('convert() rejects ambiguous source shape detection', async () => {
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
  expect(
    () =>
      convert({value: 1}, 'target', [
        firstConverter as Converter<string>,
        secondConverter as Converter<string>
      ]),
    'throws on ambiguous source shape'
  ).toThrow(/Ambiguous source shape/);
});
test('convert() forwards options to each step', async () => {
  const seenOptions: unknown[] = [];
  const converter: Converter<
    'start' | 'target',
    {
      flag: boolean;
    }
  > = {
    id: 'options',
    from: ['start'],
    to: ['target'],
    convert(input, targetShape, options) {
      seenOptions.push(options);
      return {
        ...(input as {
          shape: string;
        }),
        shape: targetShape
      };
    }
  };
  convert({shape: 'start'}, 'target', [converter], {flag: true});
  expect(seenOptions, 'forwarded options to the step').toEqual([{flag: true}]);
});
test('convert() performs a real arrow roundtrip with explicit converters', async () => {
  const table = makeTableFromData([
    {name: 'alpha', value: 1},
    {name: 'beta', value: 2}
  ]);
  const arrowTable = convert(table, 'arrow', [ArrowConverter, TableConverter]);
  const roundTrippedTable = convert(arrowTable, 'object-row-table', [ArrowConverter]) as {
    shape: string;
    data: Array<Record<string, unknown>>;
  };
  expect(roundTrippedTable.shape, 'returned the requested table shape').toBe('object-row-table');
  expect(
    roundTrippedTable.data,
    'round-tripped table rows through the generic convert dispatcher'
  ).toEqual([
    {name: 'alpha', value: 1},
    {name: 'beta', value: 2}
  ]);
});
