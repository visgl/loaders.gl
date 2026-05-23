// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Screen-space basis for one projected Gaussian splat. */
export type ProjectedSplatCovariance = {
  /** First one-sigma ellipse axis in screen pixels. */
  axis0: readonly [number, number];
  /** Second one-sigma ellipse axis in screen pixels. */
  axis1: readonly [number, number];
  /** Maximum one-sigma axis length in screen pixels. */
  maxAxisPixels: number;
  /** Alpha multiplier that preserves energy after adding the screen-space kernel. */
  alphaScale: number;
};

const MIN_AXIS_PIXELS = 1e-3;
const MIN_PROJECTION_DERIVATIVE_STEP = 1e-3;

/** Projects a 3D anisotropic Gaussian to a stable 2D screen-space covariance basis. */
export function projectSplatCovarianceToScreen(options: {
  /** Center of the Gaussian in world coordinates. */
  position: readonly [number, number, number];
  /** Decoded one-sigma Gaussian scale values. */
  scale: readonly [number, number, number];
  /** Quaternion rotation in `[w, x, y, z]` order. */
  rotation: readonly [number, number, number, number];
  /** Column-major view-projection matrix. */
  modelViewProjectionMatrix?: readonly number[];
  /** Viewport size in pixels. */
  viewportSize?: readonly [number, number];
  /** Additional two-dimensional screen-space Gaussian kernel radius in pixels. */
  kernel2DSize?: number;
  /** Maximum one-sigma screen-space axis length in pixels. */
  maxScreenSpaceSplatSize?: number;
}): ProjectedSplatCovariance {
  const {position, scale, rotation} = options;
  const center = projectWorldPositionToScreen(
    options.modelViewProjectionMatrix,
    options.viewportSize,
    position
  );
  const axes = getQuaternionScaledAxes(rotation, scale);
  let covariance00 = 0;
  let covariance01 = 0;
  let covariance11 = 0;

  for (const axis of axes) {
    const axisLength = Math.hypot(axis[0], axis[1], axis[2]);
    if (!Number.isFinite(axisLength) || axisLength <= Number.EPSILON) {
      continue;
    }
    const derivativeStep = Math.min(axisLength, MIN_PROJECTION_DERIVATIVE_STEP);
    const derivativeScale = axisLength / derivativeStep;
    const stepScale = derivativeStep / axisLength;
    const endpoint: [number, number, number] = [
      position[0] + axis[0] * stepScale,
      position[1] + axis[1] * stepScale,
      position[2] + axis[2] * stepScale
    ];
    const projectedEndpoint = projectWorldPositionToScreen(
      options.modelViewProjectionMatrix,
      options.viewportSize,
      endpoint
    );
    const deltaX = (projectedEndpoint[0] - center[0]) * derivativeScale;
    const deltaY = (projectedEndpoint[1] - center[1]) * derivativeScale;
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
      continue;
    }
    covariance00 += deltaX * deltaX;
    covariance01 += deltaX * deltaY;
    covariance11 += deltaY * deltaY;
  }

  const detOrig = Math.max(covariance00 * covariance11 - covariance01 * covariance01, 0);
  const kernel2DSize = Math.max(options.kernel2DSize ?? 0, 0);
  const kernelVariance = kernel2DSize * kernel2DSize;
  const blurredCovariance00 = covariance00 + kernelVariance;
  const blurredCovariance11 = covariance11 + kernelVariance;
  const det = Math.max(blurredCovariance00 * blurredCovariance11 - covariance01 * covariance01, 0);
  const alphaScale = det > Number.EPSILON ? Math.sqrt(Math.max(detOrig / det, 0)) : 1;
  const covariance = clampCovarianceAxes(
    getCovarianceEllipseAxes(blurredCovariance00, covariance01, blurredCovariance11),
    options.maxScreenSpaceSplatSize
  );
  return {
    ...covariance,
    alphaScale
  };
}

/** Returns three world-space Gaussian axes from a quaternion and scale vector. */
export function getQuaternionScaledAxes(
  rotation: readonly [number, number, number, number],
  scale: readonly [number, number, number]
): readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number]
] {
  const [w, x, y, z] = normalizeQuaternion(rotation);
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const xy = x * y;
  const xz = x * z;
  const yz = y * z;
  const wx = w * x;
  const wy = w * y;
  const wz = w * z;

  return [
    [(1 - 2 * (yy + zz)) * scale[0], 2 * (xy + wz) * scale[0], 2 * (xz - wy) * scale[0]],
    [2 * (xy - wz) * scale[1], (1 - 2 * (xx + zz)) * scale[1], 2 * (yz + wx) * scale[1]],
    [2 * (xz + wy) * scale[2], 2 * (yz - wx) * scale[2], (1 - 2 * (xx + yy)) * scale[2]]
  ];
}

/** Projects a world-space position to screen pixels. */
export function projectWorldPositionToScreen(
  matrix: readonly number[] | undefined,
  viewportSize: readonly [number, number] | undefined,
  position: readonly [number, number, number]
): readonly [number, number] {
  const clipPosition = transformPosition(matrix, position);
  const width = viewportSize?.[0] || 1;
  const height = viewportSize?.[1] || 1;
  const inverseW = clipPosition[3] !== 0 ? 1 / clipPosition[3] : 0;
  const normalizedX = clipPosition[0] * inverseW;
  const normalizedY = clipPosition[1] * inverseW;
  return [(normalizedX * 0.5 + 0.5) * width, (0.5 - normalizedY * 0.5) * height];
}

/** Returns one-sigma ellipse axes for a two-dimensional symmetric covariance matrix. */
export function getCovarianceEllipseAxes(
  covariance00: number,
  covariance01: number,
  covariance11: number
): ProjectedSplatCovariance {
  if (
    !Number.isFinite(covariance00) ||
    !Number.isFinite(covariance01) ||
    !Number.isFinite(covariance11)
  ) {
    return getFallbackCovarianceAxes();
  }

  const trace = covariance00 + covariance11;
  const difference = covariance00 - covariance11;
  const discriminant = Math.sqrt(
    Math.max(difference * difference * 0.25 + covariance01 * covariance01, 0)
  );
  const lambda0 = Math.max(trace * 0.5 + discriminant, 0);
  const lambda1 = Math.max(trace * 0.5 - discriminant, 0);
  const vector0 = getEigenVector(covariance00, covariance01, covariance11, lambda0);
  const vector1: [number, number] = [-vector0[1], vector0[0]];
  const length0 = Math.max(Math.sqrt(lambda0), MIN_AXIS_PIXELS);
  const length1 = Math.max(Math.sqrt(lambda1), MIN_AXIS_PIXELS);

  return {
    axis0: [vector0[0] * length0, vector0[1] * length0],
    axis1: [vector1[0] * length1, vector1[1] * length1],
    maxAxisPixels: Math.max(length0, length1),
    alphaScale: 1
  };
}

/** Transforms a position by an optional column-major matrix. */
export function transformPosition(
  matrix: readonly number[] | undefined,
  position: readonly [number, number, number]
): readonly [number, number, number, number] {
  const [x, y, z] = position;
  if (!matrix) {
    return [x, y, z, 1];
  }

  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
    matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15]
  ];
}

/** Returns a normalized quaternion, falling back to identity when invalid. */
function normalizeQuaternion(
  rotation: readonly [number, number, number, number]
): readonly [number, number, number, number] {
  const length = Math.hypot(rotation[0], rotation[1], rotation[2], rotation[3]);
  if (!Number.isFinite(length) || length <= Number.EPSILON) {
    return [1, 0, 0, 0];
  }
  return [rotation[0] / length, rotation[1] / length, rotation[2] / length, rotation[3] / length];
}

/** Returns the dominant eigenvector for a two-dimensional symmetric matrix. */
function getEigenVector(
  covariance00: number,
  covariance01: number,
  covariance11: number,
  eigenvalue: number
): [number, number] {
  let x = covariance01;
  let y = eigenvalue - covariance00;
  if (Math.hypot(x, y) <= Number.EPSILON) {
    x = eigenvalue - covariance11;
    y = covariance01;
  }
  const length = Math.hypot(x, y);
  if (!Number.isFinite(length) || length <= Number.EPSILON) {
    return [1, 0];
  }
  return [x / length, y / length];
}

/** Returns finite non-zero fallback axes for degenerate covariance. */
function getFallbackCovarianceAxes(): ProjectedSplatCovariance {
  return {
    axis0: [MIN_AXIS_PIXELS, 0],
    axis1: [0, MIN_AXIS_PIXELS],
    maxAxisPixels: MIN_AXIS_PIXELS,
    alphaScale: 1
  };
}

/** Clamp projected covariance axes to a maximum one-sigma screen-space size. */
function clampCovarianceAxes(
  covariance: ProjectedSplatCovariance,
  maxScreenSpaceSplatSize: number | undefined
): ProjectedSplatCovariance {
  const maxAxisPixels = Math.max(
    maxScreenSpaceSplatSize ?? Number.POSITIVE_INFINITY,
    MIN_AXIS_PIXELS
  );
  if (covariance.maxAxisPixels <= maxAxisPixels) {
    return covariance;
  }

  const scale = maxAxisPixels / covariance.maxAxisPixels;
  return {
    axis0: [covariance.axis0[0] * scale, covariance.axis0[1] * scale],
    axis1: [covariance.axis1[0] * scale, covariance.axis1[1] * scale],
    maxAxisPixels,
    alphaScale: covariance.alphaScale
  };
}
