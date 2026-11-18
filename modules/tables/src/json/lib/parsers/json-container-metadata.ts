// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import JSONPath from '../jsonpath/jsonpath';

/** Serializes container properties without copying or retaining the streamed row array. */
export function getJSONContainerMetadata(
  container: unknown,
  jsonpath?: string
): Record<string, string> {
  if (!container || typeof container !== 'object' || Array.isArray(container)) return {};
  const rows =
    jsonpath && jsonpath !== '$'
      ? new JSONPath(jsonpath).getFieldAtPath(container)
      : findFirstArray(container);
  return {
    'loaders.gl.containerJson': JSON.stringify(container, (_key, value) =>
      Array.isArray(rows) && value === rows ? [] : value
    )
  };
}

/** Finds the row array selected by the JSON table parser's default traversal. */
function findFirstArray(value: object): unknown[] | undefined {
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) return child;
    if (child && typeof child === 'object') {
      const rows = findFirstArray(child);
      if (rows) return rows;
    }
  }
  return undefined;
}
