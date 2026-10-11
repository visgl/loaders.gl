// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadonlyCRSDefinition} from '@math.gl/crs';

/** Extracts the horizontal WKT1 component of a compound CRS in one bounded linear scan. */
export function normalizeCOPCProjectionDefinition(
  projectionData: ReadonlyCRSDefinition
): ReadonlyCRSDefinition {
  if (typeof projectionData !== 'string' || !projectionData.startsWith('COMPD_CS['))
    return projectionData;
  let depth = 0;
  let quoted = false;
  let horizontalStart = -1;
  let horizontalEnd = -1;
  for (let index = 0; index < projectionData.length; index++) {
    const character = projectionData[index];
    if (character === '"') {
      if (quoted && projectionData[index + 1] === '"') index++;
      else quoted = !quoted;
      continue;
    }
    if (quoted) continue;
    if (character === '[') depth++;
    else if (character === ']') {
      depth--;
      if (depth < 0 || (depth === 0 && index !== projectionData.length - 1)) return projectionData;
      if (depth === 1 && horizontalStart >= 0 && horizontalEnd < 0) horizontalEnd = index + 1;
    } else if (character === ',' && depth === 1 && horizontalStart < 0) {
      const start = index + 1;
      if (
        projectionData.startsWith('PROJCS[', start) ||
        projectionData.startsWith('GEOGCS[', start)
      )
        horizontalStart = start;
      else return projectionData;
    }
  }
  if (
    quoted ||
    depth !== 0 ||
    horizontalEnd < 0 ||
    !projectionData.startsWith(',VERT_CS[', horizontalEnd)
  )
    return projectionData;
  return projectionData.slice(horizontalStart, horizontalEnd);
}
