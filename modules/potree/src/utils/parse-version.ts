// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Reads dataset major/minor versions, including legacy release-candidate suffixes. */
export function parseVersion(version: string): {major: number; minor: number} {
  const match = /^(\d+)\.(\d+)/.exec(version);
  return {major: match ? Number(match[1]) : NaN, minor: match ? Number(match[2]) : NaN};
}
