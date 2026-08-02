// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderContext} from '@loaders.gl/loader-utils';
import {
  createImplicitSubtreeReference,
  materializeImplicitSubtree,
  replaceImplicitUrlTemplate
} from '@loaders.gl/tiles';
import type {Subtree} from '../../../types';
import type {Tiles3DLoaderOptions} from '../../../tiles-3d-loader';
import type {ImplicitOptions} from '../parse-3d-tile-header';

/**
 * Materializes one implicit subtree without recursively loading child subtree resources.
 *
 * This compatibility helper preserves the former parser entry point while enforcing the lazy
 * subtree boundary. `loaderOptions` and `context` are intentionally unused: source-managed
 * traversal now owns all I/O, scheduling, query inheritance, and archive resolution.
 *
 * @param params - Parsed subtree, hierarchy descriptor, and legacy loading parameters.
 * @returns Materialized subtree-root header.
 */
export async function parseImplicitTiles(params: {
  /** Parsed availability data for the requested subtree. */
  subtree: Subtree;
  /** Serializable implicit hierarchy description. */
  implicitOptions: ImplicitOptions;
  /** Loader options retained for source compatibility. */
  loaderOptions?: Tiles3DLoaderOptions;
  /** Loader context retained for source compatibility. */
  context?: LoaderContext;
  /** Global coordinates of the subtree root. */
  subtreeData?: {level: number; x: number; y: number; z: number};
}): Promise<Record<string, any>> {
  void params.loaderOptions;
  void params.context;
  const coordinates = params.subtreeData || {level: 0, x: 0, y: 0, z: 0};
  const reference = createImplicitSubtreeReference(params.implicitOptions, coordinates);
  return materializeImplicitSubtree(params.subtree, reference).root;
}

/**
 * Replaces legacy positional implicit URL-template arguments.
 *
 * @param templateUrl - URL containing level/x/y/z placeholders.
 * @param level - Global tile level.
 * @param x - Global x coordinate.
 * @param y - Global y coordinate.
 * @param z - Global z coordinate.
 * @returns Concrete URL.
 */
export function replaceContentUrlTemplate(
  templateUrl: string,
  level: number,
  x: number,
  y: number,
  z: number
): string {
  return replaceImplicitUrlTemplate(templateUrl, {level, x, y, z});
}
