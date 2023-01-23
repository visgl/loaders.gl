import {ArrayRowTable, ObjectRowTable} from '@loaders.gl/schema';

export function parseNDJSONSync(ndjsonText: string): ArrayRowTable | ObjectRowTable {
  const lines = ndjsonText.trim().split('\n');
  const parsedLines = lines.map((line, counter) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`NDJSONLoader: failed to parse JSON on line ${counter + 1}`);
    }
  });
  if (parsedLines.length === 0) {
    return {shape: 'array-row-table', schema: {fields: [], metadata: {}}, data: []};
  }
  const firstRow = parsedLines[0];
  if (firstRow && typeof firstRow === 'object') {
    return {shape: 'object-row-table', data: parsedLines};
  }
  if (Array.isArray(firstRow)) {
    return {shape: 'array-row-table', data: parsedLines};
  }

  // TODO - deduce schema

  // TODO - we could wrap JS primitive in array?
  throw new Error('ndjson not a table');
}
