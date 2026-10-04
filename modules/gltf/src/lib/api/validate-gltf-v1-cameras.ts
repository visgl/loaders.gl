// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTF} from '../types/gltf-types';

/** Check projection constraints without inventing replacement clipping planes or magnification. */
export function validateGLTFV1Cameras(
  json: GLTF,
  reportUnsupported: (feature: string) => void
): void {
  for (const [cameraIndex, camera] of (json.cameras || []).entries()) {
    const perspective = camera.perspective;
    const orthographic = camera.orthographic;
    const valid =
      camera.type === 'perspective'
        ? perspective &&
          isPositive(perspective.yfov) &&
          isPositive(perspective.znear) &&
          (perspective.aspectRatio === undefined || isPositive(perspective.aspectRatio)) &&
          (perspective.zfar === undefined ||
            (isPositive(perspective.zfar) && perspective.zfar > perspective.znear))
        : camera.type === 'orthographic' &&
          orthographic &&
          Number.isFinite(orthographic.xmag) &&
          orthographic.xmag !== 0 &&
          Number.isFinite(orthographic.ymag) &&
          orthographic.ymag !== 0 &&
          Number.isFinite(orthographic.znear) &&
          orthographic.znear >= 0 &&
          isPositive(orthographic.zfar) &&
          orthographic.zfar > orthographic.znear;
    if (!valid) reportUnsupported(`camera ${cameraIndex} invalid projection parameters`);
  }
}

/** Projection distances and perspective angles require finite positive numbers. */
function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
