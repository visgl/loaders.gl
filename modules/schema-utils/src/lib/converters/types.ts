// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Context passed to converter steps while executing a conversion path.
 */
export type ConversionContext<Shape extends string = string> = {
  /** Shape detected on the original input value. */
  sourceShape: Shape;
  /** Final shape requested by the caller. */
  targetShape: Shape;
  /** Shape of the value being passed into the current converter step. */
  currentShape: Shape;
  /** Planned shape path, including the source and final target shapes. */
  path: Shape[];
  /** Converter set available to the dispatcher for this request. */
  converters: Converter<Shape>[];
  /** Zero-based index of the current step in the conversion path. */
  stepIndex: number;
};

/**
 * A direct converter between one or more source and target shapes.
 */
export type Converter<Shape extends string = string, Options = unknown> = {
  /** Stable converter identifier for debugging and error messages. */
  id: string;
  /** Source shapes accepted by this converter. */
  from: readonly Shape[];
  /** Target shapes produced by this converter. */
  to: readonly Shape[];
  /** Optional runtime shape detector for raw inputs that do not expose a `shape` discriminator. */
  detectInputShape?: (input: unknown) => Shape | null;
  /** Optional guard to prune unsupported source/target pairs within the declared shape sets. */
  canConvert?: (sourceShape: Shape, targetShape: Shape) => boolean;
  /** Performs one direct conversion from the current shape to the requested target shape. */
  convert: (
    input: unknown,
    targetShape: Shape,
    options?: Options,
    context?: ConversionContext<Shape>
  ) => unknown;
};
