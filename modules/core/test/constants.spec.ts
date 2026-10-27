// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {
  LOADERS_GL_FIXTURE_BRANCH,
  LOADERS_GL_RAW_FIXTURE_URL,
  LOADERS_GL_REDIRECTING_FIXTURE_URL,
  NPM_TAG
} from '@loaders.gl/core/constants';
import {getDefaultWorkerURL} from '../src/worker-utils/lib/worker-api/get-worker-url';

test('repository URLs follow the configured branch', () => {
  const rawUrl = new URL(LOADERS_GL_RAW_FIXTURE_URL);
  const redirectUrl = new URL(LOADERS_GL_REDIRECTING_FIXTURE_URL);
  expect(rawUrl.hostname).toBe('raw.githubusercontent.com');
  expect(rawUrl.pathname).toBe(`/visgl/loaders.gl/${LOADERS_GL_FIXTURE_BRANCH}/`);
  expect(redirectUrl.hostname).toBe('github.com');
  expect(redirectUrl.pathname).toBe(`/visgl/loaders.gl/raw/${LOADERS_GL_FIXTURE_BRANCH}/`);
});

test('worker fallback uses the configured npm tag', () => {
  expect(
    getDefaultWorkerURL({id: 'example', name: 'example', module: 'core', version: 'latest'})
  ).toContain(`@loaders.gl/core@${NPM_TAG}/dist/`);
});

test('a previously loaded version does not replace this build version', async () => {
  const previousGlobal = globalThis._loadersgl_;
  try {
    globalThis._loadersgl_ = {version: '1.2.3'};
    vi.resetModules();
    const {VERSION} = await import('../src/worker-utils/lib/env-utils/version');
    expect(VERSION).toBe(NPM_TAG);
    expect(globalThis._loadersgl_.version).toBe('1.2.3');
  } finally {
    globalThis._loadersgl_ = previousGlobal;
    vi.resetModules();
  }
});
