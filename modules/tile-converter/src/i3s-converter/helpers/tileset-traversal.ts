import {Tiles3DTileJSONPostprocessed} from '@loaders.gl/3d-tiles';
import {NodeIndexDocument} from './node-index-document';
import {Matrix4} from '@math.gl/core';

export type TraversalConversionProps = {
  transform: Matrix4;
  parentNodes: NodeIndexDocument[];
};

export const traverseDatasetWith = async <TProps>(
  tile: Tiles3DTileJSONPostprocessed,
  traversalProps: TProps,
  processTile: (tile: Tiles3DTileJSONPostprocessed, traversalProps: TProps) => Promise<TProps>,
  postprocessTile: (processResults: TProps[], currentTraversalProps: TProps) => Promise<void>,
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
  await postprocessTile(processResults, traversalProps);
};
