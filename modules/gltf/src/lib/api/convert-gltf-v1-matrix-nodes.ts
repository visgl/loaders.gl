// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix4, Quaternion} from '@math.gl/core';
import type {GLTF} from '../types/gltf-types';

/** Convert translation-only animated matrices while preserving their entire linear transform. */
export function convertGLTFV1MatrixNodes(
  json: GLTF,
  reportUnsupported: (feature: string) => void,
  reportNote: (message: string) => void
): void {
  const targets = new Map<number, Set<string>>();
  for (const animation of json.animations || [])
    for (const channel of animation.channels || []) {
      const nodeIndex = channel.target?.node;
      if (!Number.isSafeInteger(nodeIndex)) continue;
      const paths = targets.get(nodeIndex as number) || new Set<string>();
      paths.add(channel.target.path);
      targets.set(nodeIndex as number, paths);
    }
  const plans: Array<() => void> = [];
  for (const [nodeIndex, paths] of targets) {
    const node = json.nodes?.[nodeIndex];
    if (node?.matrix === undefined) continue;
    const label = `animated matrix node ${nodeIndex}`;
    if (paths.size !== 1 || !paths.has('translation')) {
      reportUnsupported(`${label} rotation or scale animation requires an unambiguous TRS basis`);
      continue;
    }
    if (
      node.translation !== undefined ||
      node.rotation !== undefined ||
      node.scale !== undefined ||
      node.extensions !== undefined
    ) {
      reportUnsupported(`${label} has conflicting TRS fields or opaque extensions`);
      continue;
    }
    const transform = decomposeMatrix(node.matrix);
    if (!transform) {
      reportUnsupported(`${label} requires a finite affine, nonsingular matrix without shear`);
      continue;
    }
    plans.push(() => {
      Object.assign(node, transform);
      delete node.matrix;
      reportNote(
        `Decomposed translation-only animated matrix node ${nodeIndex}, preserving its linear transform.`
      );
    });
  }
  for (const apply of plans) apply();
}

/** TRS representation checked by recomposing the complete source transform. */
type MatrixTransform = {
  /** Original local translation. */
  translation: number[];
  /** Unit quaternion, with reflected scale assigned to the first axis. */
  rotation: number[];
  /** Column lengths, retaining the determinant sign on the first axis. */
  scale: number[];
};

/** Decompose orthogonal columns; reject singular, perspective, and shear transforms. */
function decomposeMatrix(matrix: number[]): MatrixTransform | null {
  if (
    !Array.isArray(matrix) ||
    matrix.length !== 16 ||
    Array.from(matrix).some(value => !Number.isFinite(value)) ||
    matrix[3] !== 0 ||
    matrix[7] !== 0 ||
    matrix[11] !== 0 ||
    matrix[15] !== 1
  )
    return null;
  const scale = [0, 1, 2].map(column => Math.hypot(...matrix.slice(column * 4, column * 4 + 3)));
  if (scale.some(value => !Number.isFinite(value) || value === 0)) return null;
  const columns = scale.map((length, column) =>
    matrix.slice(column * 4, column * 4 + 3).map(value => value / length)
  );
  for (let first = 0; first < 3; first++)
    for (let second = first + 1; second < 3; second++)
      if (
        Math.abs(
          columns[first].reduce((sum, value, row) => sum + value * columns[second][row], 0)
        ) > 1e-6
      )
        return null;
  const determinant =
    columns[0][0] * (columns[1][1] * columns[2][2] - columns[1][2] * columns[2][1]) -
    columns[1][0] * (columns[0][1] * columns[2][2] - columns[0][2] * columns[2][1]) +
    columns[2][0] * (columns[0][1] * columns[1][2] - columns[0][2] * columns[1][1]);
  if (Math.abs(Math.abs(determinant) - 1) > 1e-6) return null;
  if (determinant < 0) {
    scale[0] = -scale[0];
    columns[0] = columns[0].map(value => -value);
  }
  const rotation = Array.from(new Quaternion().fromMatrix3(columns.flat()).normalize());
  const translation = matrix.slice(12, 15);
  const reconstructed = new Matrix4()
    .translate(translation)
    .multiplyRight(new Matrix4().fromQuaternion(rotation))
    .scale(scale);
  if (
    Array.from(reconstructed).some(
      (value, index) =>
        !Number.isFinite(value) ||
        Math.abs(value - matrix[index]) > 1e-6 * Math.max(1, Math.abs(matrix[index]))
    )
  )
    return null;
  return {translation, rotation, scale};
}
