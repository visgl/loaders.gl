// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {convertTileset} from '../apps/tile-converter/src/v5/conversion-api';

/** Creates a tiny stream with observable conversion, destination, and reader cleanup. */
function createConversionOptions(resourceSizes = [2, 1]) {
  const closeReader = vi.fn();
  const inspect = vi.fn(async () => null);
  const read = vi.fn(async function* () {
    try {
      for (const size of resourceSizes) yield new Uint8Array(size);
    } finally {
      closeReader();
    }
  });
  const convert = vi.fn(async function* (resource: Uint8Array) {
    yield resource;
  });
  const sink = {
    write: vi.fn(async () => {}),
    finalize: vi.fn(async () => {}),
    abort: vi.fn(async () => {})
  };
  const options = {
    source: {inspect, read},
    codec: {convert},
    sink,
    measureInputBytes: vi.fn((resource: Uint8Array) => resource.byteLength),
    measureOutputBytes: (resource: Uint8Array) => resource.byteLength
  };
  return {options, closeReader};
}

test.each([undefined, Infinity, 2, 0])('input size gate accepts limit %s', async limit => {
  const {options, closeReader} = createConversionOptions(limit === 0 ? [0, 0] : [2, 1]);
  const report = await convertTileset({...options, maxInputResourceBytes: limit});
  expect(report).toMatchObject({inputResources: 2, inputBytes: limit === 0 ? 0 : 3});
  expect(options.measureInputBytes).toHaveBeenCalledTimes(2);
  expect(options.codec.convert).toHaveBeenCalledTimes(2);
  expect(options.sink.finalize).toHaveBeenCalledExactlyOnceWith(report);
  expect(options.sink.abort).not.toHaveBeenCalled();
  expect(closeReader).toHaveBeenCalledOnce();
});

test.each([
  0, 1
])('input size gate rejects input %s before encoding, closes the reader, and aborts', async index => {
  const {options, closeReader} = createConversionOptions(index === 0 ? [2, 1] : [1, 2]);
  await expect(convertTileset({...options, maxInputResourceBytes: 1})).rejects.toMatchObject({
    code: 'INPUT_RESOURCE_TOO_LARGE',
    message: 'Input resource is 2 bytes, exceeding the configured limit of 1 bytes'
  });
  expect(options.measureInputBytes).toHaveBeenCalledTimes(index + 1);
  expect(options.codec.convert).toHaveBeenCalledTimes(index);
  expect(options.sink.write).toHaveBeenCalledTimes(index);
  expect(options.sink.finalize).not.toHaveBeenCalled();
  expect(options.sink.abort).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({code: 'INPUT_RESOURCE_TOO_LARGE'})
  );
  expect(closeReader).toHaveBeenCalledOnce();
});

test.each([
  -1,
  NaN,
  -Infinity,
  0.5,
  Number.MAX_SAFE_INTEGER + 1
])('input size gate rejects invalid limit %s before reading', async limit => {
  const {options} = createConversionOptions();
  await expect(convertTileset({...options, maxInputResourceBytes: limit})).rejects.toMatchObject({
    code: 'INVALID_INPUT_RESOURCE_LIMIT'
  });
  expect(options.source.inspect).not.toHaveBeenCalled();
  expect(options.source.read).not.toHaveBeenCalled();
  expect(options.sink.abort).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({code: 'INVALID_INPUT_RESOURCE_LIMIT'})
  );
});

test.each([
  -1,
  NaN,
  Infinity,
  0.5,
  Number.MAX_SAFE_INTEGER + 1
])('input size gate rejects invalid measurement %s even without a limit', async size => {
  const {options, closeReader} = createConversionOptions();
  options.measureInputBytes.mockReturnValue(size);
  await expect(convertTileset(options)).rejects.toMatchObject({
    code: 'INVALID_INPUT_RESOURCE_SIZE'
  });
  expect(options.codec.convert).not.toHaveBeenCalled();
  expect(options.sink.write).not.toHaveBeenCalled();
  expect(options.sink.finalize).not.toHaveBeenCalled();
  expect(options.sink.abort).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({code: 'INVALID_INPUT_RESOURCE_SIZE'})
  );
  expect(closeReader).toHaveBeenCalledOnce();
});
