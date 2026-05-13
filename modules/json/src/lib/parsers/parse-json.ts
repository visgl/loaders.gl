// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeTableFromData} from '@loaders.gl/schema-utils';
import type {JSONLoaderOptions} from '../../json-loader';

/** Parses one JSON payload into either raw JSON or the requested table shape. */
export function parseJSONSync(jsonText: string, options: JSONLoaderOptions): unknown {
  let json;
  try {
    json = JSON.parse(jsonText);
  } catch (_error) {
    throw new Error('JSONLoader: failed to parse JSON');
  }

  if (shouldParseJSONAsTable(options)) {
    const data = getFirstArray(json) || json;
    return makeTableFromData(data);
  }

  return json;
}

/** Returns whether JSONLoader should reinterpret the payload as table-shaped data. */
function shouldParseJSONAsTable(options: JSONLoaderOptions): boolean {
  return Boolean(options.json?.table || options.json?.shape);
}

/** Returns the first streamable array in the JSON payload, if one exists. */
function getFirstArray(json) {
  if (Array.isArray(json)) {
    return json;
  }
  if (json && typeof json === 'object') {
    for (const value of Object.values(json)) {
      const array = getFirstArray(value);
      if (array) {
        return array;
      }
    }
  }
  return null;
}
