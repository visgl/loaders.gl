// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export function parseVersion(version: string): {major: number; minor: number} {
  const parts = version.split('.').map(Number);
  return {major: parts[0], minor: parts[1]};
}
