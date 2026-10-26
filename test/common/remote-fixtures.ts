// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * loaders.gl branch that remote test fixture URLs point at. It must name the branch that contains
 * this file: `master` on master, and the release branch (e.g. `4.4-release`) on a release branch.
 *
 * A release branch that keeps fetching fixtures from `master` breaks once fixtures move or are
 * deleted there. When cutting a release branch, change this value on that branch. CI runs
 * `yarn test-audit`, which fails when this value differs from the target branch or when a test
 * hard-codes a different branch.
 */
export const LOADERS_GL_FIXTURE_BRANCH = 'master';

/** Raw GitHub URL of the repository root at {@link LOADERS_GL_FIXTURE_BRANCH}, with a trailing slash. */
export const LOADERS_GL_RAW_FIXTURE_URL = `https://raw.githubusercontent.com/visgl/loaders.gl/${LOADERS_GL_FIXTURE_BRANCH}/`;

/** GitHub `raw` URL of the repository root, which responds with a redirect to {@link LOADERS_GL_RAW_FIXTURE_URL}. */
export const LOADERS_GL_REDIRECTING_FIXTURE_URL = `https://github.com/visgl/loaders.gl/raw/${LOADERS_GL_FIXTURE_BRANCH}/`;
