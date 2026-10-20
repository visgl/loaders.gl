// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ConversionContext, Converter} from './types';

type ConversionStep<Shape extends string = string> = {
  shape: Shape;
  converter: Converter<Shape>;
};

/**
 * Converts a value to the requested target shape using the supplied converters.
 *
 * The dispatcher does not own any conversion logic. It detects an initial source shape,
 * finds the shortest supported path through the supplied converter set, and then executes
 * each direct conversion step in order.
 */
export function convert<Shape extends string>(
  input: unknown,
  targetShape: Shape,
  converters: Converter<Shape> | Converter<Shape>[],
  options?: unknown
): unknown {
  const normalizedConverters = Array.isArray(converters) ? converters : [converters];
  const sourceShape = detectSourceShape(input, normalizedConverters);

  if (sourceShape === targetShape) {
    return input;
  }

  const steps = findConversionPath(sourceShape, targetShape, normalizedConverters);
  if (!steps) {
    throw new Error(
      `No conversion path found from "${sourceShape}" to "${targetShape}" using converters: ${normalizedConverters
        .map(converter => converter.id)
        .join(', ')}`
    );
  }

  let currentValue = input;
  let currentShape = sourceShape;
  const path = [sourceShape, ...steps.map(step => step.shape)];

  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const step = steps[stepIndex];
    const context: ConversionContext<Shape> = {
      sourceShape,
      targetShape,
      currentShape,
      path,
      converters: normalizedConverters,
      stepIndex
    };
    currentValue = step.converter.convert(currentValue, step.shape, options, context);
    currentShape = step.shape;
  }

  return currentValue;
}

function detectSourceShape<Shape extends string>(
  input: unknown,
  converters: Converter<Shape>[]
): Shape {
  const detectedShapes = new Set<Shape>();

  const fallbackShape = getShapeFromInput(input);
  if (fallbackShape !== null) {
    detectedShapes.add(fallbackShape as Shape);
  }

  for (const converter of converters) {
    const detectedShape = converter.detectInputShape?.(input);
    if (detectedShape) {
      detectedShapes.add(detectedShape);
    }
  }

  if (detectedShapes.size === 0) {
    throw new Error('Could not detect source shape for conversion input');
  }

  if (detectedShapes.size > 1) {
    throw new Error(
      `Ambiguous source shape for conversion input: ${Array.from(detectedShapes).join(', ')}`
    );
  }

  return Array.from(detectedShapes)[0];
}

function getShapeFromInput(input: unknown): string | null {
  return typeof input === 'object' &&
    input !== null &&
    'shape' in input &&
    typeof input.shape === 'string'
    ? input.shape
    : null;
}

function findConversionPath<Shape extends string>(
  sourceShape: Shape,
  targetShape: Shape,
  converters: Converter<Shape>[]
): ConversionStep<Shape>[] | null {
  const queue: Array<{shape: Shape; path: ConversionStep<Shape>[]}> = [
    {shape: sourceShape, path: []}
  ];
  const visitedShapes = new Set<Shape>([sourceShape]);

  while (queue.length > 0) {
    const candidate = queue.shift()!;

    for (const converter of converters) {
      if (!converter.from.includes(candidate.shape)) {
        continue;
      }

      for (const nextShape of converter.to) {
        if (
          !converter.canConvert?.(candidate.shape, nextShape) &&
          converter.canConvert !== undefined
        ) {
          continue;
        }

        const nextPath = [...candidate.path, {shape: nextShape, converter}];
        if (nextShape === targetShape) {
          return nextPath;
        }

        if (!visitedShapes.has(nextShape)) {
          visitedShapes.add(nextShape);
          queue.push({shape: nextShape, path: nextPath});
        }
      }
    }
  }

  return null;
}
