// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Parsed legacy VTK ASCII numeric attribute. */
export type VTKDataArray = {
  /** Name of the attribute. */
  name: string;
  /** Number of values per tuple. */
  components: number;
  /** Numeric values in tuple order. */
  data: Float32Array;
};
/** Parsed legacy VTK ASCII geometry and numeric attributes. */
export type VTKDataset = {
  /** Supported legacy encoding. */
  format: 'legacy-ascii';
  /** Legacy dataset kind. */
  datasetType: 'POLYDATA' | 'STRUCTURED_POINTS' | 'UNSTRUCTURED_GRID';
  /** Point coordinates, when present. */
  points?: Float32Array;
  /** Structured grid dimensions, when present. */
  dimensions?: [number, number, number];
  /** Structured grid origin, when present. */
  origin?: [number, number, number];
  /** Structured grid spacing, when present. */
  spacing?: [number, number, number];
  /** Cell offsets, connectivity, and optional VTK cell types. */
  cells?: {offsets: Uint32Array; connectivity: Uint32Array; types?: Uint32Array};
  /** Point attribute arrays. */
  pointData: VTKDataArray[];
  /** Cell attribute arrays. */
  cellData: VTKDataArray[];
};

/** Require a supported VTK construct and report a format-specific error. */
function requireVTK(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('VTK: ' + message);
}
const FLOAT_TYPES = new Set([
  'float',
  'double',
  'int',
  'unsigned_int',
  'short',
  'unsigned_short',
  'char',
  'unsigned_char'
]);
/** Read a bounded sequence of legacy ASCII numeric tokens. */
function numbers(tokens: string[], index: number, count: number): [Float32Array, number] {
  requireVTK(
    Number.isSafeInteger(count) && count >= 0 && count <= 100_000_000,
    'invalid array length'
  );
  requireVTK(index + count <= tokens.length, 'truncated numeric data');
  const data = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const value = Number(tokens[index + i]);
    requireVTK(Number.isFinite(value), 'invalid numeric value');
    data[i] = value;
  }
  return [data, index + count];
}
/** Strict, bounded initial subset of VTK legacy ASCII; unsupported syntax fails explicitly. */
export function parseVTKLegacy(input: string): VTKDataset {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  requireVTK(/^# vtk DataFile Version\s+\d+/i.test(lines[0] ?? ''), 'invalid legacy header');
  requireVTK(
    lines.length >= 4 && lines[2].trim().toUpperCase() === 'ASCII',
    'only legacy ASCII is supported'
  );
  const declaration = lines[3].trim().split(/\s+/);
  requireVTK(declaration[0]?.toUpperCase() === 'DATASET', 'missing dataset declaration');
  const datasetType = declaration[1]?.toUpperCase();
  requireVTK(
    ['POLYDATA', 'STRUCTURED_POINTS', 'UNSTRUCTURED_GRID'].includes(datasetType),
    'unsupported dataset type'
  );
  const result: VTKDataset = {
    format: 'legacy-ascii',
    datasetType: datasetType as VTKDataset['datasetType'],
    pointData: [],
    cellData: []
  };
  const tokens = lines.slice(4).join(' ').trim().split(/\s+/).filter(Boolean);
  let i = 0;
  let active: VTKDataArray[] | null = null;
  let tupleCount = 0;
  while (i < tokens.length) {
    const keyword = tokens[i++].toUpperCase();
    if (keyword === 'POINTS') {
      const count = Number(tokens[i++]),
        type = tokens[i++].toLowerCase();
      requireVTK(FLOAT_TYPES.has(type), 'unsupported point data type');
      [result.points, i] = numbers(tokens, i, count * 3);
    } else if (
      keyword === 'DIMENSIONS' ||
      keyword === 'ORIGIN' ||
      keyword === 'SPACING' ||
      keyword === 'ASPECT_RATIO'
    ) {
      const [data, next] = numbers(tokens, i, 3);
      i = next;
      const triple = Array.from(data) as [number, number, number];
      if (keyword === 'DIMENSIONS') {
        requireVTK(
          triple.every(n => Number.isInteger(n) && n > 0),
          'invalid dimensions'
        );
        result.dimensions = triple;
      } else if (keyword === 'ORIGIN') result.origin = triple;
      else result.spacing = triple;
    } else if (
      keyword === 'VERTICES' ||
      keyword === 'LINES' ||
      keyword === 'POLYGONS' ||
      keyword === 'TRIANGLE_STRIPS' ||
      keyword === 'CELLS'
    ) {
      const cellCount = Number(tokens[i++]),
        size = Number(tokens[i++]);
      const [packed, next] = numbers(tokens, i, size);
      i = next;
      const offsets = new Uint32Array(cellCount + 1);
      const connectivity: number[] = [];
      let cursor = 0;
      for (let cell = 0; cell < cellCount; cell++) {
        requireVTK(cursor < packed.length, 'truncated cell');
        const length = packed[cursor++];
        requireVTK(
          Number.isInteger(length) && length >= 0 && cursor + length <= packed.length,
          'invalid cell'
        );
        for (let j = 0; j < length; j++) {
          requireVTK(
            Number.isInteger(packed[cursor + j]) && packed[cursor + j] >= 0,
            'invalid vertex index'
          );
          connectivity.push(packed[cursor + j]);
        }
        cursor += length;
        offsets[cell + 1] = connectivity.length;
      }
      requireVTK(cursor === packed.length, 'cell size mismatch');
      // The initial subset supports one cell topology block per file.
      requireVTK(!result.cells, 'multiple topology blocks are not yet supported');
      result.cells = {offsets, connectivity: Uint32Array.from(connectivity)};
    } else if (keyword === 'CELL_TYPES') {
      const count = Number(tokens[i++]);
      const [types, next] = numbers(tokens, i, count);
      i = next;
      requireVTK(
        result.cells && count === result.cells.offsets.length - 1,
        'cell type count mismatch'
      );
      result.cells.types = Uint32Array.from(types);
    } else if (keyword === 'POINT_DATA' || keyword === 'CELL_DATA') {
      tupleCount = Number(tokens[i++]);
      requireVTK(Number.isSafeInteger(tupleCount) && tupleCount >= 0, 'invalid tuple count');
      active = keyword === 'POINT_DATA' ? result.pointData : result.cellData;
    } else if (keyword === 'SCALARS') {
      requireVTK(active, 'SCALARS requires POINT_DATA or CELL_DATA');
      const name = tokens[i++],
        type = tokens[i++].toLowerCase();
      requireVTK(FLOAT_TYPES.has(type), 'unsupported scalar type');
      let components = 1;
      if (tokens[i]?.toUpperCase() !== 'LOOKUP_TABLE') components = Number(tokens[i++]);
      requireVTK(
        Number.isInteger(components) && components > 0 && components <= 16,
        'invalid scalar components'
      );
      requireVTK(tokens[i++]?.toUpperCase() === 'LOOKUP_TABLE', 'missing lookup table declaration');
      i++; // Lookup table name
      let data: Float32Array;
      [data, i] = numbers(tokens, i, tupleCount * components);
      active.push({name, components, data});
    } else if (keyword === 'VECTORS' || keyword === 'NORMALS') {
      requireVTK(active, keyword + ' requires POINT_DATA or CELL_DATA');
      const name = tokens[i++],
        type = tokens[i++].toLowerCase();
      requireVTK(FLOAT_TYPES.has(type), 'unsupported vector type');
      let data: Float32Array;
      [data, i] = numbers(tokens, i, tupleCount * 3);
      active.push({name, components: 3, data});
    } else {
      throw new Error('VTK: unsupported keyword ' + keyword);
    }
  }
  return result;
}
