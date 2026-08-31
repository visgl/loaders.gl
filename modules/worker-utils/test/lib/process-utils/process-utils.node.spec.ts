// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import ChildProcess from 'node:child_process';
import {afterEach, expect, test, vi} from 'vitest';
import {getAvailablePort} from '../../../src/lib/process-utils/process-utils';

afterEach(() => vi.restoreAllMocks());

test('getAvailablePort selects the first free port and falls back on process errors', async () => {
  vi.spyOn(ChildProcess, 'exec').mockImplementationOnce(((_command, callback) => {
    callback?.(
      null,
      'node 1 user 1u IPv4 TCP *:3000 (LISTEN)\nnode 2 user 1u IPv4 TCP *:3001 (LISTEN)',
      ''
    );
    return {} as any;
  }) as any);
  await expect(getAvailablePort(3000)).resolves.toBe(3002);

  vi.spyOn(ChildProcess, 'exec').mockImplementationOnce(((_command, callback) => {
    callback?.(new Error('lsof unavailable'), '', '');
    return {} as any;
  }) as any);
  await expect(getAvailablePort(4000)).resolves.toBe(4000);
});
