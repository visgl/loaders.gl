// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Partial converter input; missing and null fields both select legacy defaults. */
export type BuilderInput<T> = {
  [Property in keyof T]?: T[Property] | null;
};
