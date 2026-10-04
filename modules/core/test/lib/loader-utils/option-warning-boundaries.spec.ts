// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {normalizeOptions} from '../../../src/lib/loader-utils/option-utils';
import {probeLog} from '../../../src/lib/loader-utils/loggers';

afterEach(() => vi.restoreAllMocks());

test('validation emits actionable scoped suggestions and deprecation warnings', () => {
  const level = probeLog.level;
  const emit = vi.fn();
  const warn = vi.spyOn(probeLog, 'warn').mockReturnValue(emit);
  const loader = {
    id: 'boundary-options',
    name: 'Boundary options',
    module: 'core',
    version: 'latest',
    extensions: ['boundary'],
    mimeTypes: [],
    options: {chunkCount: {size: 1}, 'boundary-options': {known: true}},
    deprecatedOptions: {'boundary-options': {removed: 'boundary-options.known'}}
  };
  try {
    probeLog.level = 1;
    normalizeOptions(
      {
        chunkCount: 2,
        CHUNK: 3,
        unrelated: 4,
        'boundary-options': {removed: true, unknown: true, workerUrl: 'memory-worker'},
        unrelatedScope: {allowed: true}
      },
      loader,
      [loader]
    );
    expect(warn.mock.calls.map(call => call[0])).toEqual([
      "Top level loader option 'chunkCount' not recognized. Did you mean 'boundary-options.chunkCount'?",
      "Top level loader option 'CHUNK' not recognized. Did you mean 'boundary-options.chunkCount'?",
      "Top level loader option 'unrelated' not recognized. ",
      "boundary-options loader option 'boundary-options.removed' no longer supported, use 'boundary-options.known'",
      "boundary-options loader option 'boundary-options.unknown' not recognized. "
    ]);
    expect(emit).toHaveBeenCalledTimes(5);
    warn.mockClear();
    probeLog.level = 0;
    normalizeOptions({'boundary-options': {removed: true, unknown: true}}, loader, [loader]);
    expect(warn).not.toHaveBeenCalled();
  } finally {
    probeLog.level = level;
  }
});
