// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {HDF5Backend, HDF5Dataset} from './hdf5-source';

const HDF5_SIGNATURE = [137, 72, 68, 70, 13, 10, 26, 10];
let nextFileId = 0;

/** Reject unrelated data before invoking the HDF5 runtime. */
export function isHDF5(input: Uint8Array): boolean {
  return HDF5_SIGNATURE.every((byte, index) => input[index] === byte);
}

type WasmDataset = {
  shape: number[];
  metadata: {type?: number; size?: number; signed?: boolean};
  value: unknown;
  attrs?: Record<string, unknown>;
};
type WasmNode = {
  keys?: () => string[];
  get?: (path: string) => WasmNode;
  shape?: number[];
  metadata?: WasmDataset['metadata'];
  value?: unknown;
  attrs?: Record<string, unknown>;
  close?: () => void;
};
type WasmModule = {
  ready: Promise<{FS: {writeFile(path: string, data: Uint8Array): void;
    unlink(path: string): void}}>;
  File: new (path: string, mode: string) => WasmNode;
};

function numericValues(value: unknown): ArrayBufferView {
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) return value;
  throw new Error('HDF5: dataset is not a supported numeric typed array');
}
function numericType(value: ArrayBufferView): string {
  const name = value.constructor.name;
  const types: Record<string, string> = {
    Int8Array: 'int8', Uint8Array: 'uint8', Int16Array: 'int16',
    Uint16Array: 'uint16', Int32Array: 'int32', Uint32Array: 'uint32',
    Float32Array: 'float32', Float64Array: 'float64',
    BigInt64Array: 'int64', BigUint64Array: 'uint64'
  };
  if (!types[name]) throw new Error('HDF5: unsupported numeric type ' + name);
  return types[name];
}

/**
 * Open a real HDF5 file through the optional h5wasm runtime.
 *
 * The input is copied into the WASM virtual filesystem. Full file buffering is
 * intentional; range-backed reads and lazy chunk loading are not supported here.
 */
export async function openH5WasmBackend(input: ArrayBuffer | Uint8Array): Promise<HDF5Backend> {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (!isHDF5(bytes)) throw new Error('HDF5: invalid file signature');
  const imported = await import('h5wasm');
  const wasm = (imported.default ?? imported) as unknown as WasmModule;
  const {FS} = await wasm.ready;
  const path = '/loaders-scientific-' + ++nextFileId + '.h5';
  FS.writeFile(path, bytes);
  let file: WasmNode;
  try {
    file = new wasm.File(path, 'r');
  } catch (error) {
    FS.unlink(path);
    throw error;
  }
  let closed = false;
  const assertOpen = () => {
    if (closed) throw new Error('HDF5: source is closed');
  };
  const datasets: {path: string; dataset: HDF5Dataset}[] = [];
  const visit = (node: WasmNode, prefix: string, depth: number) => {
    if (depth > 64) throw new Error('HDF5: group nesting exceeds supported depth');
    for (const key of node.keys?.() ?? []) {
      const name = prefix + '/' + key;
      const child = node.get?.(key);
      if (!child) throw new Error('HDF5: unresolved group member ' + name);
      if (Array.isArray(child.shape)) {
        // Lazy value access: enumeration does not materialize datasets.
        const sample = child;
        const dtype = (() => {
          const m = sample.metadata;
          if (!m) return 'unknown';
          if (m.type === 1) return m.size === 8 ? 'float64' : 'float32';
          if (m.type === 0) return (m.signed ? 'int' : 'uint') + String((m.size ?? 0) * 8);
          return 'unknown';
        })();
        datasets.push({path: name, dataset: {
          shape: [...child.shape], dtype, attributes: child.attrs,
          async read() {
            assertOpen();
            const data = numericValues(sample.value);
            numericType(data);
            return data;
          }
        }});
      } else if (child.keys) {
        visit(child, name, depth + 1);
      }
    }
  };
  try {visit(file, '', 0);} catch (error) {file.close?.(); FS.unlink(path); throw error;}
  return {
    async listDatasets() {assertOpen(); return datasets;},
    close() {
      if (closed) return;
      closed = true;
      file.close?.();
      FS.unlink(path);
    }
  };
}
