// This file is derived from the Cesium code base under BSD 2-clause license
// See LICENSE.md and https://github.com/potree/potree/blob/develop/LICENSE

// Potree Hierarchy Chunk file format
// https://github.com/potree/potree/blob/develop/docs/potree-file-format.md#index-files

/*
### Hierarchy Chunk Files

As mentioned in the former section, the `.hrc` files contain the index structure
meaning a list of all the files stored within the directory tree.

An index file contains a list of tuple values with the first being a `uint8`
"mask" and the second being `uint32` "number of points" of a hierarchy level
in a [breadth first level order][breadth-first].

Per hierarchy level we have 8 possible nodes. To indicate whether a node exists
a simple binary mask is used:

| Position | Mask | [Binary][bin] |
|----------|------|---------------|
| 0        | 1    | 0b00000001    |
| 1        | 2    | 0b00000010    |
| 2        | 4    | 0b00000100    |
| 3        | 8    | 0b00001000    |
| 4        | 16   | 0b00010000    |
| 5        | 32   | 0b00100000    |
| 6        | 64   | 0b01000000    |
| 7        | 128  | 0b10000000    |

So if in a hierarchy the child node 3 and node 7 exist then the hierarchies
mask has to be `0b00001000 | 0b10000000` → `0b10001000` (=136).

_Example:_ A simple, non-realistic tree:

```
|- r1
|  |
|  \- r14 (2 Points)
|
\- r3
   |
   \- r36 (1 Point)
```

Would have an index looking like this:

| name | mask               | points |
|------|--------------------|--------|
| r    | `0b00001010` (=10) | `3`    |
| r1   | `0b00010000` (=16) | `2`    |
| r3   | `0b01000000` (=64) | `1`    |
| r14  | `0b00000000` (=0)  | `2`    |
| r36  | `0b00000000` (=0)  | `1`    |
*/

/** Node metadata from index file */
export type POTreeTileHeader = {
  /** Number of child nodes */
  childCount: number;
  /** Human readable name */
  name: string;
  /** Child availability mask */
  childMask: number;
};

/** Hierarchical potree node structure */
export type POTreeNode = {
  /** Index data */
  header: POTreeTileHeader;
  /** Human readable name */
  name: string;
  /** Number of points */
  pointCount: number;
  /** Node's level in the tree */
  level: number;
  /** Has children */
  hasChildren: boolean;
  /** Space between points */
  spacing: number;
  /** Available children */
  children: POTreeNode[];
  /** All children including unavailable */
  childrenByIndex: POTreeNode[];
};

/**
 * load hierarchy
 * @param arrayBuffer - binary index data
 * @returns root node
 **/
export function parsePotreeHierarchyChunk(arrayBuffer: ArrayBuffer): POTreeNode {
  const tileHeaders = parseBinaryChunk(arrayBuffer);
  return buildHierarchy(tileHeaders);
}

/**
 * Parses the binary rows
 * @param arrayBuffer - binary index data to parse
 * @param byteOffset - byte offset to start from
 * @returns flat nodes array
 * */
function parseBinaryChunk(arrayBuffer: ArrayBuffer, byteOffset = 0): POTreeNode[] {
  const dataView = new DataView(arrayBuffer);

  const stack: POTreeNode[] = [];

  // Get root mask
  // @ts-expect-error
  const topTileHeader: POTreeNode = {};
  byteOffset = decodeRow(dataView, byteOffset, topTileHeader);

  stack.push(topTileHeader);
  const tileHeaders: POTreeNode[] = [topTileHeader];

  while (stack.length > 0) {
    const snode = stack.shift();
    let mask = 1;

    for (let i = 0; i < 8; i++) {
      if (snode && (snode.header.childMask & mask) !== 0) {
        // @ts-expect-error
        const tileHeader: POTreeNode = {};
        byteOffset = decodeRow(dataView, byteOffset, tileHeader);
        tileHeader.name = snode.name + i;

        stack.push(tileHeader);
        tileHeaders.push(tileHeader);
        snode.header.childCount++;
      }
      mask = mask * 2;
    }

    if (byteOffset === dataView.byteLength) {
      break;
    }
  }

  return tileHeaders;
}

/**
 * Reads next row from binary index file
 * @param dataView - index data
 * @param byteOffset - current offset in the index data
 * @param tileHeader - container to read to
 * @returns new offset
 */
function decodeRow(dataView: DataView, byteOffset: number, tileHeader: POTreeNode): number {
  tileHeader.header = tileHeader.header || {};
  tileHeader.header.childMask = dataView.getUint8(byteOffset);
  tileHeader.header.childCount = 0;
  tileHeader.pointCount = dataView.getUint32(byteOffset + 1, true);
  tileHeader.name = '';
  byteOffset += 5;
  return byteOffset;
}

/** Resolves the binary rows into a hierarchy (tree structure) */
function buildHierarchy(flatNodes: POTreeNode[], options: {spacing?: number} = {}): POTreeNode {
  const DEFAULT_OPTIONS = {spacing: 100}; // TODO assert instead of default?
  options = {...DEFAULT_OPTIONS, ...options};

  const topNode: POTreeNode = flatNodes[0];
  const nodes = {};

  for (const node of flatNodes) {
    const {name} = node;

    const index = parseInt(name.charAt(name.length - 1), 10);
    const parentName = name.substring(0, name.length - 1);
    const parentNode = nodes[parentName];
    const level = name.length - 1;
    // assert(parentNode && level >= 0);

    node.level = level;
    node.hasChildren = Boolean(node.header.childCount);
    node.children = [];
    node.childrenByIndex = new Array(8).fill(null);
    node.spacing = (options?.spacing || 0) / Math.pow(2, level);
    // tileHeader.boundingVolume = Utils.createChildAABB(parentNode.boundingBox, index);

    if (parentNode) {
      parentNode.children.push(node);
      parentNode.childrenByIndex[index] = node;
    }

    // Add the node to the map
    nodes[name] = node;
  }

  // First node is the root
  return topNode;
}
