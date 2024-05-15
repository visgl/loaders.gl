// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RowTable} from '@loaders.gl/schema';
import {makeTableFromData} from '@loaders.gl/schema';
import type {JSONLoaderOptions} from '../../json-loader';

export function parseJSONSync(jsonText: string, options: JSONLoaderOptions): RowTable {
  try {
    const json = JSON.parse(jsonText);
    if (options.json?.table) {
      const data = getFirstArray(json) || json;
      return makeTableFromData(data);
    }
    return json;
  } catch (error) {
    throw new Error('JSONLoader: failed to parse JSON');
  }
}

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
