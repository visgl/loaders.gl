// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ScientificArraySource,
  ScientificArray,
  ScientificDatasetMetadata,
  ScientificSelection,
  ScientificSourceCapabilities,
  ScientificVariable
} from '../scientific-array';

/** A dataset backend, independent of HDF5 binary decoding and filesystem strategy. */
export interface HDF5Dataset {
  /** Dataset dimensions in storage order. */
  readonly shape: readonly number[];
  /** Numeric element type exposed by the backend. */
  readonly dtype: string;
  /** Dataset attributes supplied by the backend. */
  readonly attributes?: Readonly<Record<string, unknown>>;
  /** Full data materialization. Backends may implement optimized slicing later. */
  read(): Promise<ArrayBufferView>;
  /** Optional storage-level hyperslab read. Must return a dense array in row-major order. */
  readSelection?(ranges: readonly (readonly [number, number])[]): Promise<ArrayBufferView>;
}
/** Backend contract for enumerating and reading HDF5 datasets. */
export interface HDF5Backend {
  /** Enumerate datasets and their absolute paths. */
  listDatasets(): Promise<readonly {path: string; dataset: HDF5Dataset}[]>;
  /** Release backend resources, if any. */
  close?(): Promise<void> | void;
}
/** Require a valid HDF5 condition and report a format-specific error. */
function requireValid(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('HDF5: ' + message);
}
/** Backend-neutral HDF5 dataset access. Does not silently claim remote range support. */
export class HDF5Source implements ScientificArraySource {
  /** Capabilities of this backend-neutral source. */
  readonly scientificCapabilities: ScientificSourceCapabilities = {
    selection: 'residual',
    remoteRanges: false,
    streaming: false,
    cancellation: false
  };
  /** Create a source backed by an HDF5 dataset provider. */
  constructor(readonly backend: HDF5Backend) {}
  /** Enumerate dataset variables and their dimensions. */
  async getScientificMetadata(): Promise<ScientificDatasetMetadata> {
    const datasets = await this.backend.listDatasets();
    const dimensions: {name: string; length: number}[] = [];
    const variables: ScientificVariable[] = [];
    for (const {path, dataset} of datasets) {
      const names = dataset.shape.map((size, axis) => {
        const name = path + ':dim_' + axis;
        dimensions.push({name, length: size});
        return name;
      });
      variables.push({
        name: path,
        dimensions: names,
        shape: [...dataset.shape],
        dtype: dataset.dtype,
        attributes: dataset.attributes
      });
    }
    return {dimensions, variables};
  }
  /** Read a dataset variable, applying a residual slice where requested. */
  async readScientificVariable(
    name: string,
    selection: ScientificSelection = {}
  ): Promise<ScientificArray> {
    const datasets = await this.backend.listDatasets();
    const found = datasets.find(item => item.path === name);
    requireValid(found, 'unknown dataset ' + name);
    const {dataset} = found;
    const names = dataset.shape.map((_, i) => name + ':dim_' + i);
    for (const key of Object.keys(selection))
      requireValid(names.includes(key), 'unknown dimension ' + key);
    const ranges = dataset.shape.map((size, axis): [number, number] => {
      const value = selection[names[axis]];
      const start = value === undefined ? 0 : typeof value === 'number' ? value : value[0];
      const end = value === undefined ? size : typeof value === 'number' ? value + 1 : value[1];
      requireValid(
        Number.isInteger(start) &&
          Number.isInteger(end) &&
          start >= 0 &&
          end <= size &&
          end > start,
        'invalid dimension slice'
      );
      return [start, end];
    });
    const pushedDown = Boolean(dataset.readSelection);
    const input = dataset.readSelection
      ? await dataset.readSelection(ranges)
      : await dataset.read();
    requireValid(
      ArrayBuffer.isView(input) && 'length' in input && typeof input.length === 'number',
      'backend must return a numeric typed array'
    );
    const values = input as unknown as {readonly length: number; [index: number]: number};
    const total = dataset.shape.reduce((a, b) => a * b, 1);
    const outputShape = ranges.map(([a, b]) => b - a);
    const length = outputShape.reduce((a, b) => a * b, 1);
    requireValid(
      values.length === (pushedDown ? length : total),
      'dataset shape does not match values'
    );
    if (pushedDown)
      return {data: input, dimensions: names, shape: outputShape, attributes: dataset.attributes};
    const constructor = input.constructor as {
      new (length: number): ArrayBufferView & {[index: number]: number};
    };
    const output = new constructor(length);
    for (let index = 0; index < length; index++) {
      let remainder = index,
        source = 0,
        stride = 1;
      for (let axis = dataset.shape.length - 1; axis >= 0; axis--) {
        const local = remainder % outputShape[axis];
        remainder = Math.floor(remainder / outputShape[axis]);
        source += (ranges[axis][0] + local) * stride;
        stride *= dataset.shape[axis];
      }
      output[index] = values[source];
    }
    return {data: output, dimensions: names, shape: outputShape, attributes: dataset.attributes};
  }
  /** Release backend resources. */
  async close(): Promise<void> {
    await this.backend.close?.();
  }
}
