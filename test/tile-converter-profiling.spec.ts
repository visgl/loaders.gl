// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {convertTileset} from '@loaders.gl/tile-converter/v5/core';

test.each([
  false,
  true
])('profiling separates generator work from sink backpressure; enabled=%s', async profile => {
  let clock = 0;
  const timer = vi.spyOn(performance, 'now').mockImplementation(() => clock);
  try {
    const report = await convertTileset({
      profile,
      source: {
        inspect: async () => {
          clock += 2;
          return null;
        },
        read: async function* () {
          clock += 3;
          yield 1;
          clock += 1;
        }
      },
      codec: {
        convert: async () => {
          clock += 4;
          return (async function* () {
            clock += 5;
            yield 1;
            clock += 6;
            yield 2;
            clock += 7;
          })();
        },
        validateOutput: async () => {
          clock += 8;
          return [];
        }
      },
      sink: {
        write: async () => {
          clock += 9;
        },
        finalize: async report => {
          expect(report.timings).toBeUndefined();
          clock += 10;
        },
        abort: async () => {
          throw new Error('unexpected abort');
        }
      },
      measureInputBytes: () => 1,
      measureOutputBytes: () => 1
    });
    expect(report.timings).toEqual(
      profile
        ? {
            inspectMilliseconds: 2,
            readMilliseconds: 4,
            convertMilliseconds: 22,
            validateMilliseconds: 16,
            writeMilliseconds: 18,
            finalizeMilliseconds: 10,
            totalMilliseconds: 72
          }
        : undefined
    );
    if (!profile) expect(timer).not.toHaveBeenCalled();
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
  } finally {
    timer.mockRestore();
  }
});

test('profiling preserves iterator cleanup and the original failure', async () => {
  const sourceClosed = vi.fn();
  const codecClosed = vi.fn();
  const abort = vi.fn();
  await expect(
    convertTileset({
      profile: true,
      source: {
        inspect: async () => null,
        read: async function* () {
          try {
            yield 1;
          } finally {
            sourceClosed();
          }
        }
      },
      codec: {
        convert: async function* () {
          try {
            yield 1;
            yield 2;
          } finally {
            codecClosed();
          }
        }
      },
      sink: {
        write: async () => {
          throw new Error('destination failure');
        },
        finalize: async () => {},
        abort
      },
      measureInputBytes: () => 1,
      measureOutputBytes: () => 1
    })
  ).rejects.toThrow('destination failure');
  expect(sourceClosed).toHaveBeenCalledOnce();
  expect(codecClosed).toHaveBeenCalledOnce();
  expect(abort).toHaveBeenCalledWith(expect.objectContaining({message: 'destination failure'}));
});

test('profiling accepts an empty iterator without optional cleanup methods', async () => {
  const convert = vi.fn();
  const write = vi.fn();
  const report = await convertTileset({
    profile: true,
    source: {
      inspect: async () => null,
      read: () => ({
        [Symbol.asyncIterator]: () => ({next: async () => ({done: true, value: undefined})})
      })
    },
    codec: {convert},
    sink: {write, finalize: async () => {}, abort: async () => {}},
    measureInputBytes: () => 0,
    measureOutputBytes: () => 0
  });
  expect(report.inputResources).toBe(0);
  expect(report.outputResources).toBe(0);
  expect(report.timings).toMatchObject({
    convertMilliseconds: 0,
    validateMilliseconds: 0,
    writeMilliseconds: 0
  });
  expect(convert).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
});
