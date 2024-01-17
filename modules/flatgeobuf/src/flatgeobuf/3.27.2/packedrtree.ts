import Config from './config';
import Logger from './logger';

export const NODE_ITEM_BYTE_LEN: number = 8 * 4 + 8;
/**
 * @deprecated Use `NODE_ITEM_BYTE_LEN` instead.
 */
export const NODE_ITEM_LEN = NODE_ITEM_BYTE_LEN;

// default branching factor of a node in the rtree
//
// actual value will be specified in the header but
// this can be useful for having reasonably sized guesses for fetch-sizes when
// streaming results
export const DEFAULT_NODE_SIZE = 16;

export interface Rect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function calcTreeSize(numItems: number, nodeSize: number): number {
  nodeSize = Math.min(Math.max(Number(nodeSize), 2), 65535);
  let n = numItems;
  let numNodes = n;
  do {
    n = Math.ceil(n / nodeSize);
    numNodes += n;
  } while (n !== 1);
  return numNodes * NODE_ITEM_BYTE_LEN;
}

/**
 * returns [levelOffset, numNodes] for each level
 */
export function generateLevelBounds(numItems: number, nodeSize: number): Array<[number, number]> {
  if (nodeSize < 2) throw new Error('Node size must be at least 2');
  if (numItems === 0) throw new Error('Number of items must be greater than 0');

  // number of nodes per level in bottom-up order
  let n = numItems;
  let numNodes = n;
  const levelNumNodes = [n];
  do {
    n = Math.ceil(n / nodeSize);
    numNodes += n;
    levelNumNodes.push(n);
  } while (n !== 1);

  // bounds per level in reversed storage order (top-down)
  const levelOffsets: Array<number> = [];
  n = numNodes;
  for (const size of levelNumNodes) {
    levelOffsets.push(n - size);
    n -= size;
  }
  const levelBounds: Array<[number, number]> = [];
  for (let i = 0; i < levelNumNodes.length; i++)
    levelBounds.push([levelOffsets[i], levelOffsets[i] + levelNumNodes[i]]);
  return levelBounds;
}

type ReadNodeFn = (treeOffset: number, size: number) => Promise<ArrayBuffer>;

/**
 * A feature found to be within the bounding box `rect`
 *
 *  (offset, index)
 *  `offset`: Byte offset in feature data section
 *  `index`: feature number
 *  `featureLength`: featureLength, except for the last element
 */
export type SearchResult = [number, number, number | null];

/**
 * Yield's a `SearchResult` for each feature within the bounds of `rect`.
 *
 * Every node in the FGB index tree has a bounding rect, all of the nodes children
 * are contained within that bounding rect. The leaf nodes of the tree represent
 * the features of the collection.
 *
 * As we traverse the tree, starting from the root, we'll need to read more data
 * from the index. When we don't already have this range data buffered locally,
 * an HTTP fetch is triggered. For performance, we merge adjacent and nearby
 * request ranges into a single request, reasoning that fetching a few extra
 * bytes is a good tradeoff if it means we can reduce the number of requests.
 */
export async function* streamSearch(
  numItems: number,
  nodeSize: number,
  rect: Rect,
  readNode: ReadNodeFn
): AsyncGenerator<SearchResult, void, unknown> {
  type NodeIdx = number;
  class NodeRange {
    _level: number;
    nodes: [NodeIdx, NodeIdx];
    constructor(nodes: [NodeIdx, NodeIdx], level: number) {
      this._level = level;
      this.nodes = nodes;
    }

    level(): number {
      return this._level;
    }

    startNodeIdx(): NodeIdx {
      return this.nodes[0];
    }

    endNodeIdx(): NodeIdx {
      return this.nodes[1];
    }

    extendEndNodeIdx(newIdx: number) {
      console.assert(newIdx > this.nodes[1]);
      this.nodes[1] = newIdx;
    }

    toString(): string {
      return `[NodeRange level: ${this._level}, nodes: ${this.nodes[0]}-${this.nodes[1]}]`;
    }
  }

  const {minX, minY, maxX, maxY} = rect;
  Logger.info(`tree items: ${numItems}, nodeSize: ${nodeSize}`);
  const levelBounds = generateLevelBounds(numItems, nodeSize);
  const firstLeafNodeIdx = levelBounds[0][0];

  const rootNodeRange: NodeRange = (() => {
    const range: [number, number] = [0, 1];
    const level = levelBounds.length - 1;
    return new NodeRange(range, level);
  })();

  const queue: Array<NodeRange> = [rootNodeRange];

  Logger.debug(
    `starting stream search with queue: ${queue}, numItems: ${numItems}, nodeSize: ${nodeSize}, levelBounds: ${levelBounds}`
  );

  while (queue.length != 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const nodeRange = queue.shift()!;

    Logger.debug(`popped node: ${nodeRange}, queueLength: ${queue.length}`);

    const nodeRangeStartIdx = nodeRange.startNodeIdx();
    const isLeafNode = nodeRangeStartIdx >= firstLeafNodeIdx;

    // find the end index of the node
    const nodeRangeEndIdx = (() => {
      const [, levelBound] = levelBounds[nodeRange.level()];
      const nodeIdx = Math.min(nodeRange.endNodeIdx() + nodeSize, levelBound);

      if (isLeafNode && nodeIdx < levelBound) {
        // We can infer the length of *this* feature by getting the start of the *next*
        // feature, so we get an extra node.
        // This approach doesn't work for the final node in the index,
        // but in that case we know that the feature runs to the end of the FGB file and
        // could make an open ended range request to get "the rest of the data".
        return nodeIdx + 1;
      }
      return nodeIdx;
    })();

    const numNodesInRange = nodeRangeEndIdx - nodeRangeStartIdx;

    const buffer = await readNode(
      nodeRangeStartIdx * NODE_ITEM_BYTE_LEN,
      numNodesInRange * NODE_ITEM_BYTE_LEN
    );

    const dataView = new DataView(buffer);
    for (let nodeIdx = nodeRangeStartIdx; nodeIdx < nodeRangeEndIdx; nodeIdx++) {
      const nodeIdxInDataView = nodeIdx - nodeRangeStartIdx;
      const dataViewByteStart = nodeIdxInDataView * NODE_ITEM_BYTE_LEN;
      if (maxX < dataView.getFloat64(dataViewByteStart + 0, true)) continue; // maxX < nodeMinX
      if (maxY < dataView.getFloat64(dataViewByteStart + 8, true)) continue; // maxY < nodeMinY
      if (minX > dataView.getFloat64(dataViewByteStart + 16, true)) continue; // minX > nodeMaxX
      if (minY > dataView.getFloat64(dataViewByteStart + 24, true)) continue; // minY > nodeMaxY

      // `offset` is:
      // For leaf nodes: the byte-offset into the feature buffer.
      // For inner nodes: the node-idx of its first child.
      const offset = dataView.getBigUint64(dataViewByteStart + 32, true);

      if (isLeafNode) {
        const featureByteOffset = offset;
        const featureLength = (() => {
          if (nodeIdx < numItems - 1) {
            // Since features are tightly packed, we infer the
            // length of _this_ feature by measuring to the _next_
            // feature's start.
            const nextPos = (nodeIdxInDataView + 1) * NODE_ITEM_BYTE_LEN;
            // console.debug(`nodeIdx: ${nodeIdx} of ${numItems}, nodeRangeStartIdx: ${nodeRangeStartIdx}, nextPos: ${nextPos}, dataView.byteLength: ${dataView.byteLength}`,);
            const nextOffset = dataView.getBigUint64(nextPos + 32, true);
            return nextOffset - featureByteOffset;
          }
          // This is the last feature - there's no "next" feature
          // to measure to, so we can't know it's length.
          return null;
        })();

        // Logger.debug(`featureByteOffset: ${featureByteOffset}, nodeIdx: ${nodeIdx}, featureLength: ${featureLength}`);
        const featureIdx = nodeIdx - firstLeafNodeIdx;
        yield [Number(featureByteOffset), featureIdx, Number(featureLength)];
        continue;
      }

      const firstChildNodeIdx = offset;

      // request up to this many nodes if it means we can eliminate an
      // extra request
      const extraRequestThresholdNodes = Config.global.extraRequestThreshold() / NODE_ITEM_BYTE_LEN;

      // Since we're traversing the tree by monotonically increasing byte
      // offset, the most recently enqueued node range will be the
      // nearest, and thus presents the best candidate for merging.
      const nearestNodeRange = queue[queue.length - 1];
      if (
        nearestNodeRange !== undefined &&
        nearestNodeRange.level() == nodeRange.level() - 1 &&
        firstChildNodeIdx < nearestNodeRange.endNodeIdx() + extraRequestThresholdNodes
      ) {
        Logger.debug(
          `Merging "nodeRange" request into existing range: ${nearestNodeRange}, newEndNodeIdx: ${nearestNodeRange.endNodeIdx()} -> ${firstChildNodeIdx}`
        );
        nearestNodeRange.extendEndNodeIdx(Number(firstChildNodeIdx));
        continue;
      }

      const newNodeRange: NodeRange = (() => {
        const level = nodeRange.level() - 1;
        const range: [number, number] = [Number(firstChildNodeIdx), Number(firstChildNodeIdx) + 1];
        return new NodeRange(range, level);
      })();

      // We're going to add a new node range - log the reason
      if (nearestNodeRange !== undefined && nearestNodeRange.level() == newNodeRange.level()) {
        Logger.info(
          `Same level, but too far away. Pushing new request for nodeIdx: ${firstChildNodeIdx} rather than merging with distant ${nearestNodeRange}`
        );
      } else {
        Logger.info(
          `Pushing new level for ${newNodeRange} onto queue with nearestNodeRange: ${nearestNodeRange} since there's not already a range for this level.`
        );
      }

      queue.push(newNodeRange);
    }
  }
}
