// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Storage-independent dimension metadata. */
export type ScientificDimension = {name: string; length: number; unlimited?: boolean};
/** Physical meaning is preserved without imposing a particular CF or GRIB vocabulary. */
export type ScientificVariable = {
  name: string;
  dimensions: readonly string[];
  shape: readonly number[];
  dtype: string;
  attributes?: Readonly<Record<string, unknown>>;
  units?: string;
};
/** Half-open index ranges, or one selected index, keyed by dimension name. */
export type ScientificSelection = Readonly<Record<string, number | readonly [number, number]>>;
export type ScientificDatasetMetadata = {
  dimensions: readonly ScientificDimension[];
  variables: readonly ScientificVariable[];
  attributes?: Readonly<Record<string, unknown>>;
};
export type ScientificArray = {
  data: ArrayBufferView;
  dimensions: readonly string[];
  shape: readonly number[];
  attributes?: Readonly<Record<string, unknown>>;
};
/** Capability flags must describe actual execution, not merely accepted syntax. */
export type ScientificSourceCapabilities = {
  selection: 'none' | 'residual' | 'pushdown';
  remoteRanges: boolean;
  streaming: boolean;
  cancellation: boolean;
};
/** Shared adapter contract; implementations may expose additional format-specific methods. */
export interface ScientificArraySource {
  readonly scientificCapabilities: ScientificSourceCapabilities;
  getScientificMetadata(options?: {signal?: AbortSignal}): Promise<ScientificDatasetMetadata>;
  readScientificVariable(
    name: string,
    selection?: ScientificSelection,
    options?: {signal?: AbortSignal}
  ): Promise<ScientificArray>;
}
