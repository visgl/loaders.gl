import {Tiles3DTileJSONPostprocessed} from '@loaders.gl/3d-tiles';
import {NodeIndexDocument} from './node-index-document';
import {Matrix4} from '@math.gl/core';

/** Traversal props for the conversion stage */
export type TraversalConversionProps = {
  /** Transformation matrix for the specific tile */
  transform: Matrix4;
  /** Parent nodes of the converted tile. Multiple nodes can be if one tile is converted to multiple nodes*/
  parentNodes: NodeIndexDocument[];
};

/**
 * Travesal of 3DTile tiles tree with making specific actions with each tile
 * @param tile - 3DTiles tile JSON metadata
 * @param traversalProps - traversal props used to pass data through recursive calls
 * @param processTile - callback to make some actions with the current tile
 * @param postprocessTile - callback to make some action after processing of the current tile and all the subtree
 * @param maxDepth - max recursive calls number the travesal function will do. If not set, the traversal function will
 *                   go through all the tree.
 *                   This value is used to limit the convertion with only partial number of levels of the tileset
 * @param level - counter to keep recursive calls number of the tiles tree. This value used to be able to break
 *                traversal at the some level of the tree
 * @returns void
 */
export const traverseDatasetWith = async <TProps>(
  tile: Tiles3DTileJSONPostprocessed,
  traversalProps: TProps,
  processTile: (tile: Tiles3DTileJSONPostprocessed, traversalProps: TProps) => Promise<TProps>,
  postprocessTile?: (processResults: TProps[], currentTraversalProps: TProps) => Promise<void>,
  maxDepth?: number,
  level = 0
): Promise<void> => {
  if (maxDepth && level > maxDepth) {
    return;
  }
  const processResults: TProps[] = [];
  const newTraversalProps: TProps = await processTile(tile, traversalProps);
  processResults.push(newTraversalProps);
  for (const childTile of tile.children) {
    await traverseDatasetWith(
      childTile,
      newTraversalProps,
      processTile,
      postprocessTile,
      maxDepth,
      level + 1
    );
  }
  postprocessTile && (await postprocessTile(processResults, traversalProps));
};
