// SPDX-License-Identifier: MIT

import type {CompositeImageManifest} from './composite-image-manifest-schema';

/** Tests a composite image manifest shape without loading its parser or schema. */
export function testCompositeImageManifestShape(
  text: string,
  shape: CompositeImageManifest['shape']
): boolean {
  try {
    return JSON.parse(text)?.shape === shape;
  } catch {
    return false;
  }
}
