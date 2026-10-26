// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** JSON worker payload: all decoded document, row, and metadata values live inside owned bytes. */
export type BinaryJSONResult = {
  /** Identifies the UTF-8 JSON frame and its exceptional-value side table. */
  transport: 'json-utf8';
  /** Transferable frame containing the value and exceptional-value paths. */
  data: Uint8Array;
};

/** Values that ordinary JSON serialization would change or omit. */
type ExceptionalValue = {
  /** Own-property path from the root; an empty path denotes the root itself. */
  path: string[];
  /** Value kind needed to restore JavaScript parser semantics. */
  type: 'undefined' | 'number' | 'bigint';
  /** Exact numeric spelling, including negative zero and nonfinite numbers. */
  value?: string;
};

/** Encodes JSON parser results without cloning decoded object graphs across the worker boundary. */
export function serializeBinaryJSON(result: unknown): BinaryJSONResult {
  const paths = new WeakMap<object, string[]>();
  const exceptionalValues: ExceptionalValue[] = [];
  const json = JSON.stringify(result, function encodeValue(key, value: unknown) {
    const parentPath = paths.get(this);
    const path = parentPath ? [...parentPath, key] : [];
    if (value && typeof value === 'object') {
      paths.set(value, path);
    }
    if (value === undefined) {
      exceptionalValues.push({path, type: 'undefined'});
      return null;
    }
    if (typeof value === 'bigint') {
      exceptionalValues.push({path, type: 'bigint', value: String(value)});
      return null;
    }
    if (typeof value === 'number' && (!Number.isFinite(value) || Object.is(value, -0))) {
      exceptionalValues.push({
        path,
        type: 'number',
        value: Object.is(value, -0) ? '-0' : String(value)
      });
      return null;
    }
    if (typeof value === 'function' || typeof value === 'symbol') {
      throw new Error('JSON worker results must contain JSON values');
    }
    return value;
  });
  return {
    transport: 'json-utf8',
    data: new TextEncoder().encode(`[${json},${JSON.stringify(exceptionalValues)}]`)
  };
}

/** Materializes JSON values on the caller, preserving negative zero and parser overflow values. */
export function deserializeBinaryJSON(result: unknown): any {
  const frame = result as BinaryJSONResult;
  // Older custom JSON workers return decoded values directly, including arbitrary tag-like fields.
  if (frame?.transport !== 'json-utf8' || !(frame.data instanceof Uint8Array)) {
    return result;
  }
  let [value, exceptionalValues] = JSON.parse(new TextDecoder().decode(frame.data)) as [
    any,
    ExceptionalValue[]
  ];
  for (const exceptionalValue of exceptionalValues) {
    const restored =
      exceptionalValue.type === 'undefined'
        ? undefined
        : exceptionalValue.type === 'bigint'
          ? BigInt(exceptionalValue.value!)
          : Number(exceptionalValue.value);
    if (!exceptionalValue.path.length) {
      value = restored;
      continue;
    }
    let parent = value;
    for (const key of exceptionalValue.path.slice(0, -1)) {
      if (!parent || !Object.prototype.hasOwnProperty.call(parent, key)) {
        throw new Error('Invalid JSON worker value path');
      }
      parent = parent[key];
    }
    const key = exceptionalValue.path.at(-1)!;
    if (!parent || !Object.prototype.hasOwnProperty.call(parent, key)) {
      throw new Error('Invalid JSON worker value path');
    }
    Object.defineProperty(parent, key, {
      value: restored,
      writable: true,
      enumerable: true,
      configurable: true
    });
  }
  return value;
}
