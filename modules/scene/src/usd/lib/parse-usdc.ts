// SPDX-License-Identifier: MIT
import {USDCParser} from '../libs/usdc-parser.js';
import type {USDPrim, USDStage, USDValue} from './usd-types';

/** Decodes the supported binary crate subset into the same stage model as USDA. */
export function parseUSDC(data: ArrayBuffer, url?: string): USDStage {
  if (data.byteLength < 88 || data.byteLength > 64 * 1024 * 1024)
    throw new Error('USDC: invalid input size');
  const bytes = new Uint8Array(data);
  if (bytes[8] !== 0 || bytes[9] !== 8 || bytes[10] !== 0)
    throw new Error('USDC: initial decoder requires crate version 0.8.0');
  const reader = new DataView(data);
  const table = reader.getBigUint64(16, true);
  if (table > BigInt(data.byteLength - 8)) throw new Error('USDC: invalid section table');
  const offset = Number(table),
    count = reader.getBigUint64(offset, true);
  if (count > 16n || offset + 8 + Number(count) * 32 > data.byteLength)
    throw new Error('USDC: invalid section table length');
  const sectionNames = new Set<string>();
  for (let index = 0; index < Number(count); index++) {
    const entry = offset + 8 + index * 32;
    const name = new TextDecoder().decode(bytes.subarray(entry, entry + 16)).replace(/\0.*$/, '');
    if (sectionNames.has(name)) throw new Error('USDC: duplicate section');
    sectionNames.add(name);
    const start = reader.getBigUint64(entry + 16, true),
      size = reader.getBigUint64(entry + 24, true);
    if (start < 88n || start + size > BigInt(data.byteLength))
      throw new Error('USDC: section out of bounds');
  }
  for (const name of ['TOKENS', 'STRINGS', 'FIELDS', 'FIELDSETS', 'PATHS', 'SPECS'])
    if (!sectionNames.has(name)) throw new Error('USDC: missing required section');
  const {specsByPath} = new USDCParser().parseData(data);
  const prims = new Map<string, USDPrim>();
  for (const [path, specification] of Object.entries(specsByPath)) {
    if (specification.specType === 7 && path === '/') continue;
    if (specification.specType === 1 || specification.specType === 8) continue;
    if (specification.specType !== 6 || !/^\/(?:[A-Za-z_][\w:]*\/)*[A-Za-z_][\w:]*$/.test(path))
      throw new Error('USDC: unsupported prim specification');
    const fields = specification.fields;
    const specifier = fields.specifier ?? 0;
    if (specifier !== 0 && specifier !== 1 && specifier !== 2)
      throw new Error('USDC: invalid prim specifier');
    const metadata = convertFields(
      fields,
      new Set(['specifier', 'typeName', 'primChildren', 'properties'])
    );
    prims.set(path, {
      name: path.slice(path.lastIndexOf('/') + 1),
      path,
      sourceUrl: url,
      type: String(fields.typeName || ''),
      specifier: (['def', 'over', 'class'] as const)[specifier],
      attributes: Object.create(null),
      metadata,
      variants: Object.create(null),
      children: []
    });
  }
  const roots: USDPrim[] = [];
  for (const prim of prims.values()) {
    const parentPath = prim.path.slice(0, prim.path.lastIndexOf('/'));
    if (!parentPath) roots.push(prim);
    else {
      const parent = prims.get(parentPath);
      if (!parent) throw new Error('USDC: missing parent prim');
      parent.children.push(prim);
    }
  }
  for (const [path, specification] of Object.entries(specsByPath)) {
    if (specification.specType !== 1 && specification.specType !== 8) continue;
    const separator = path.indexOf('.');
    const prim = prims.get(path.slice(0, separator));
    if (separator < 0 || !prim) throw new Error('USDC: property has no owning prim');
    const name = path.slice(separator + 1),
      fields = specification.fields;
    const type = specification.specType === 8 ? 'rel' : String(fields.typeName || '');
    const value = convertAttributeValue(
      specification.specType === 8 ? fields.targetPaths : fields.default,
      type
    );
    prim.attributes[name] = {
      name,
      type,
      value,
      metadata: convertFields(fields, new Set(['typeName', 'default', 'targetPaths']))
    };
  }
  return {
    format: 'usdc',
    url,
    metadata: convertFields(specsByPath['/']?.fields || {}, new Set(['primChildren'])),
    rootPrims: roots,
    layers: []
  };
}

/** Converts raw field dictionaries while retaining authored values and time samples. */
function convertFields(
  fields: Record<string, unknown>,
  excluded: Set<string>
): Record<string, USDValue> {
  const result: Record<string, USDValue> = Object.create(null);
  for (const [name, value] of Object.entries(fields))
    if (!excluded.has(name)) result[name] = convertValue(value);
  return result;
}

/** Converts decoded typed arrays to the existing renderer-independent USD value contract. */
function convertValue(value: unknown): USDValue {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean')
    return value;
  if (Array.isArray(value)) return value.map(convertValue);
  if (ArrayBuffer.isView(value) && !(value instanceof DataView))
    return Array.from(value as unknown as ArrayLike<number>);
  if (typeof value === 'object') return convertFields(value as Record<string, unknown>, new Set());
  throw new Error('USDC: unsupported decoded value');
}

/** Preserves USDA-compatible asset/path values and vector-array tuple boundaries. */
function convertAttributeValue(raw: unknown, type: string): USDValue {
  const value = convertValue(raw);
  if (type === 'asset' && typeof value === 'string') return {assetPath: value};
  if (type === 'rel' && Array.isArray(value))
    return value.map(path => (typeof path === 'string' ? {path} : path));
  const tuple =
    /^(?:(?:point|normal|vector|color|texCoord)([234])[fdh]|(?:float|double|half|int)([234]))\[\]$/.exec(
      type
    );
  if (tuple && Array.isArray(value)) {
    const components = Number(tuple[1] || tuple[2]);
    if (value.length % components) throw new Error('USDC: incomplete vector tuple');
    const tuples: USDValue[] = [];
    for (let offset = 0; offset < value.length; offset += components)
      tuples.push(value.slice(offset, offset + components));
    return tuples;
  }
  return value;
}
