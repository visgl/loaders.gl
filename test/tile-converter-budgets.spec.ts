// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {convertTileset} from '@loaders.gl/tile-converter/v5/core';

/** Creates observable tiny streams without allocating their reported byte sizes. */
function createOptions(inputSizes = [2, 1], outputSizes = inputSizes) {
  const inputClosed = vi.fn();
  const outputClosed = vi.fn();
  let index = 0;
  const options = {
    source: {
      inspect: vi.fn(async () => null),
      read: async function* () {
        try {
          for (const size of inputSizes) yield size;
        } finally {
          inputClosed();
        }
      }
    },
    codec: {
      convert: vi.fn(async function* () {
        try {
          yield outputSizes[index++];
        } finally {
          outputClosed();
        }
      }),
      validateOutput: vi.fn(async () => [])
    },
    sink: {
      write: vi.fn(async () => {}),
      finalize: vi.fn(async () => {}),
      abort: vi.fn(async () => {})
    },
    measureInputBytes: (size: number) => size,
    measureOutputBytes: (size: number) => size
  };
  return {options, inputClosed, outputClosed};
}

const limits = [
  ['maxInputBytes', 'INVALID_INPUT_BYTES_LIMIT'],
  ['maxOutputBytes', 'INVALID_OUTPUT_BYTES_LIMIT'],
  ['maxInputResources', 'INVALID_INPUT_COUNT_LIMIT'],
  ['maxOutputResources', 'INVALID_OUTPUT_COUNT_LIMIT'],
  ['maxOutputResourceBytes', 'INVALID_OUTPUT_RESOURCE_LIMIT']
] as const;

test.each(limits)('rejects invalid %s before source inspection', async (name, code) => {
  for (const value of [-1, NaN, -Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
    const {options} = createOptions();
    await expect(convertTileset({...options, [name]: value})).rejects.toMatchObject({code});
    expect(options.source.inspect).not.toHaveBeenCalled();
    expect(options.sink.abort).toHaveBeenCalledOnce();
  }
});

test('aggregate budgets accept exact boundaries and report zero-byte resources', async () => {
  const {options} = createOptions([2, 0, 1]);
  await expect(
    convertTileset({
      ...options,
      maxInputBytes: 3,
      maxOutputBytes: 3,
      maxInputResources: 3,
      maxOutputResources: 3
    })
  ).resolves.toMatchObject({inputBytes: 3, outputBytes: 3, inputResources: 3, outputResources: 3});
  const empty = createOptions([]).options;
  await expect(
    convertTileset({
      ...empty,
      maxInputBytes: 0,
      maxOutputBytes: 0,
      maxInputResources: 0,
      maxOutputResources: 0
    })
  ).resolves.toMatchObject({inputResources: 0, outputResources: 0});
});

test.each([
  ['maxInputBytes', 2, 'INPUT_BYTES_LIMIT_EXCEEDED', 1],
  ['maxInputResources', 1, 'INPUT_COUNT_LIMIT_EXCEEDED', 1],
  ['maxInputResources', 0, 'INPUT_COUNT_LIMIT_EXCEEDED', 0]
] as const)('input %s stops encoding and closes the reader', async (name, value, code, writes) => {
  const {options, inputClosed} = createOptions();
  await expect(convertTileset({...options, [name]: value})).rejects.toMatchObject({code});
  expect(options.codec.convert).toHaveBeenCalledTimes(writes);
  expect(options.sink.write).toHaveBeenCalledTimes(writes);
  expect(options.sink.finalize).not.toHaveBeenCalled();
  expect(options.sink.abort).toHaveBeenCalledOnce();
  expect(inputClosed).toHaveBeenCalledOnce();
});

test.each([
  ['maxOutputBytes', 2, 'OUTPUT_BYTES_LIMIT_EXCEEDED', 1],
  ['maxOutputResources', 1, 'OUTPUT_COUNT_LIMIT_EXCEEDED', 1],
  ['maxOutputResources', 0, 'OUTPUT_COUNT_LIMIT_EXCEEDED', 0],
  ['maxOutputResourceBytes', 1, 'OUTPUT_RESOURCE_TOO_LARGE', 0]
] as const)('output %s stops writes and closes both streams', async (name, value, code, writes) => {
  const {options, inputClosed, outputClosed} = createOptions();
  await expect(convertTileset({...options, [name]: value})).rejects.toMatchObject({code});
  expect(options.codec.validateOutput).toHaveBeenCalledTimes(
    name === 'maxOutputResources' ? writes : writes + 1
  );
  expect(options.sink.write).toHaveBeenCalledTimes(writes);
  expect(options.sink.finalize).not.toHaveBeenCalled();
  expect(options.sink.abort).toHaveBeenCalledOnce();
  expect(inputClosed).toHaveBeenCalledOnce();
  expect(outputClosed).toHaveBeenCalledTimes(writes + 1);
});

test.each([
  -1,
  NaN,
  Infinity,
  0.5,
  Number.MAX_SAFE_INTEGER + 1
])('rejects invalid output measurement %s', async size => {
  const {options} = createOptions([1], [size]);
  await expect(convertTileset(options)).rejects.toMatchObject({
    code: 'INVALID_OUTPUT_RESOURCE_SIZE'
  });
  expect(options.sink.write).not.toHaveBeenCalled();
});

test.each([
  'input',
  'output'
] as const)('rejects unsafe %s total without allocating large buffers', async kind => {
  const {options} =
    kind === 'input'
      ? createOptions([Number.MAX_SAFE_INTEGER, 1], [0, 0])
      : createOptions([0, 0], [Number.MAX_SAFE_INTEGER, 1]);
  await expect(convertTileset(options)).rejects.toMatchObject({code: 'RESOURCE_TOTAL_OVERFLOW'});
  expect(options.sink.write).toHaveBeenCalledOnce();
  expect(options.sink.finalize).not.toHaveBeenCalled();
});

test('output count budget covers fan-out and zero-byte outputs', async () => {
  const {options, inputClosed} = createOptions([0]);
  const outputClosed = vi.fn();
  options.codec.convert = vi.fn(async function* () {
    try {
      yield 0;
      yield 0;
    } finally {
      outputClosed();
    }
  });
  await expect(convertTileset({...options, maxOutputResources: 1})).rejects.toMatchObject({
    code: 'OUTPUT_COUNT_LIMIT_EXCEEDED'
  });
  expect(options.sink.write).toHaveBeenCalledOnce();
  expect(inputClosed).toHaveBeenCalledOnce();
  expect(outputClosed).toHaveBeenCalledOnce();
});
