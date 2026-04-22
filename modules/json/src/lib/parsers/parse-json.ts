// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrayRowTable, ObjectRowTable} from '@loaders.gl/schema';
import {makeTableFromData} from '@loaders.gl/schema-utils';
import type {JSONLoaderOptions} from '../../json-loader';
import {convertRowTableToArrowTable} from './parse-ndjson-to-arrow';

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
    if (options.json?.shape === 'arrow-table') {
      return convertRowTableToArrowTable(getJSONRowTable(data), {
        schema: options.json.schema,
        arrowConversion: options.json.arrowConversion,
        log: getJSONLoaderLog(options)
      });
    }
    return makeTableFromData(data);
  }

  return json;
}

/** Returns the loader log object from normalized or deprecated option locations. */
function getJSONLoaderLog(options: JSONLoaderOptions): any {
  return options.core?.log || options.log;
}

/** Returns whether JSONLoader should reinterpret the payload as table-shaped data. */
function shouldParseJSONAsTable(options: JSONLoaderOptions): boolean {
  return Boolean(options.json?.table || options.json?.shape);
}

/** Normalizes selected JSON data to a row table before Arrow conversion. */
function getJSONRowTable(data: unknown): ArrayRowTable | ObjectRowTable {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return {
        shape: 'object-row-table',
        schema: {fields: [], metadata: {}},
        data: []
      };
    }

    const rowTable = makeTableFromData(data);
    if (rowTable.shape === 'array-row-table' || rowTable.shape === 'object-row-table') {
      return rowTable;
    }
  }

  throw new Error(
    'JSONLoader: arrow-table shape requires the selected JSON value to be an array of object or array rows'
  );
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
