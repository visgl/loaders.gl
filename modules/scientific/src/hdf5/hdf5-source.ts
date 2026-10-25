// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ScientificArraySource, ScientificArray, ScientificDatasetMetadata,
  ScientificSelection, ScientificSourceCapabilities, ScientificVariable
} from '../scientific-array';

/** A dataset backend, independent of HDF5 binary decoding and filesystem strategy. */
export interface HDF5Dataset {
  readonly shape: readonly number[];
  readonly dtype: string;
  readonly attributes?: Readonly<Record<string, unknown>>;
  /** Full data materialization. Backends may implement optimized slicing later. */
  read(): Promise<ArrayBufferView>;
}
export interface HDF5Backend {
  listDatasets(): Promise<readonly {path: string; dataset: HDF5Dataset}[]>;
  close?(): Promise<void> | void;
}
function requireValid(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('HDF5: ' + message);
}
/** Backend-neutral HDF5 dataset access. Does not silently claim remote range support. */
export class HDF5Source implements ScientificArraySource {
  readonly scientificCapabilities: ScientificSourceCapabilities = {
    selection: 'residual', remoteRanges: false, streaming: false, cancellation: false
  };
  constructor(readonly backend: HDF5Backend) {}
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
      variables.push({name: path, dimensions: names, shape: [...dataset.shape],
        dtype: dataset.dtype, attributes: dataset.attributes});
    }
    return {dimensions, variables};
  }
  async readScientificVariable(
    name: string, selection: ScientificSelection = {}
  ): Promise<ScientificArray> {
    const datasets = await this.backend.listDatasets();
    const found = datasets.find(item => item.path === name);
    requireValid(found, 'unknown dataset ' + name);
    const {dataset} = found;
    const names = dataset.shape.map((_, i) => name + ':dim_' + i);
    for (const key of Object.keys(selection)) requireValid(names.includes(key), 'unknown dimension ' + key);
    const ranges = dataset.shape.map((size, axis): [number, number] => {
      const value = selection[names[axis]];
      const start = value === undefined ? 0 : typeof value === 'number' ? value : value[0];
      const end = value === undefined ? size : typeof value === 'number' ? value + 1 : value[1];
      requireValid(Number.isInteger(start) && Number.isInteger(end) &&
        start >= 0 && end <= size && end > start, 'invalid dimension slice');
      return [start, end];
    });
    const input = await dataset.read();
    requireValid(ArrayBuffer.isView(input) && 'length' in input &&
      typeof input.length === 'number', 'backend must return a numeric typed array');
    const values = input as unknown as {readonly length: number; [index: number]: number};
    const total = dataset.shape.reduce((a, b) => a * b, 1);
    requireValid(values.length === total, 'dataset shape does not match values');
    const outputShape = ranges.map(([a, b]) => b - a);
    const length = outputShape.reduce((a, b) => a * b, 1);
    const constructor = input.constructor as {new (length: number): ArrayBufferView & {[index: number]: number}};
    const output = new constructor(length);
    for (let index = 0; index < length; index++) {
      let remainder = index, source = 0, stride = 1;
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
  async close(): Promise<void> {await this.backend.close?.();}
}
