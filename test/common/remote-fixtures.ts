// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Immutable loaders.gl commit that remote test fixture URLs point at.
 *
 * Tests must not reference fixtures by branch (e.g. `master`): release branches keep running
 * their tests after fixtures are moved or deleted on `master`, and a branch URL then returns 404.
 * Hermetic browser tests rewrite these URLs to repository-local files, so only `*.external.spec`
 * tests download them. Advance this commit when an external test needs a newer fixture.
 */
export const LOADERS_GL_FIXTURE_COMMIT = 'ab5ef39d7213a76ddc86e4f439b16b6ff73eebdc';

/** Raw GitHub URL of the repository root at {@link LOADERS_GL_FIXTURE_COMMIT}, with a trailing slash. */
export const LOADERS_GL_RAW_FIXTURE_URL = `https://raw.githubusercontent.com/visgl/loaders.gl/${LOADERS_GL_FIXTURE_COMMIT}/`;

/** GitHub `raw` URL of the repository root, which responds with a redirect to {@link LOADERS_GL_RAW_FIXTURE_URL}. */
export const LOADERS_GL_REDIRECTING_FIXTURE_URL = `https://github.com/visgl/loaders.gl/raw/${LOADERS_GL_FIXTURE_COMMIT}/`;
