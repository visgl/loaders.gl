// SPDX-License-Identifier: BSD-2-Clause

// This file is derived from the Cesium code base under BSD 2-clause license
// See LICENSE.md and https://github.com/potree/potree/blob/develop/LICENSE

// Potree Hierarchy Chunk file format
// https://github.com/potree/potree/blob/develop/docs/potree-file-format.md#index-files

import type {HierarchyItem} from '../types/potree-metadata';

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
  id: string;
  type: 'pointcloud';
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
  /** Is tile selected for rendering */
  selected: boolean;
  /** Points content data */
  content?: unknown;
  /** Is content loading */
  isContentLoading?: boolean;
  /** Viewport Ids */
  viewportIds: unknown[];
};

/**
 * load hierarchy
 * @param arrayBuffer - binary index data
 * @returns root node
 **/
export function parsePotreeHierarchyChunk(
  arrayBuffer: ArrayBuffer,
  options: {
    /** Global internal node name for a paged hierarchy root. */
    rootName?: string;
    /** Number of levels represented in this page. */
    maximumDepth?: number;
    /** Dataset root spacing, retained in global node levels. */
    spacing?: number;
  } = {}
): POTreeNode {
  const tileHeaders = parseBinaryChunk(arrayBuffer, options);
  return buildHierarchy(tileHeaders, options);
}

/**
 * Builds a Potree hierarchy tree from older `cloud.js` inline hierarchy metadata.
 * @param hierarchy - inline hierarchy items from Potree 1.4 style metadata
 * @param options - hierarchy construction options
 * @returns root node
 */
export function buildPotreeHierarchyFromMetadata(
  hierarchy: HierarchyItem[],
  options: {spacing?: number} = {}
): POTreeNode {
  const nodesByName = new Map<string, POTreeNode>();

  for (const [potreeName, pointCount] of hierarchy) {
    const name = getInternalNodeName(potreeName);
    nodesByName.set(name, {
      id: name,
      type: 'pointcloud',
      header: {
        childCount: 0,
        childMask: 0,
        name: potreeName
      },
      name,
      pointCount,
      level: 0,
      hasChildren: false,
      spacing: 0,
      children: [],
      childrenByIndex: [],
      selected: false,
      viewportIds: []
    });
  }

  if (!nodesByName.has('')) {
    throw new Error('Inline Potree hierarchy is missing root node r');
  }

  for (const name of nodesByName.keys()) {
    if (!name) {
      continue;
    }

    const childIndex = Number(name[name.length - 1]);
    const parentName = name.slice(0, -1);
    const parentNode = nodesByName.get(parentName);
    if (!parentNode) {
      throw new Error(`Inline Potree hierarchy is missing parent node r${parentName}`);
    }
    parentNode.header.childMask |= 1 << childIndex;
    parentNode.header.childCount++;
  }

  const flatNodes = Array.from(nodesByName.values()).sort((leftNode, rightNode) => {
    return (
      leftNode.name.length - rightNode.name.length || leftNode.name.localeCompare(rightNode.name)
    );
  });

  return buildHierarchy(flatNodes, options);
}

/**
 * Parses the binary rows
 * @param arrayBuffer - binary index data to parse
 * @param byteOffset - byte offset to start from
 * @returns flat nodes array
 * */
function parseBinaryChunk(
  arrayBuffer: ArrayBuffer,
  options: {rootName?: string; maximumDepth?: number}
): POTreeNode[] {
  const rootName = options.rootName ?? '';
  const maximumDepth = options.maximumDepth ?? 5;
  if (
    !/^[0-7]*$/.test(rootName) ||
    !Number.isSafeInteger(maximumDepth) ||
    maximumDepth < 1 ||
    maximumDepth > 24 ||
    !arrayBuffer.byteLength ||
    arrayBuffer.byteLength % 5 ||
    arrayBuffer.byteLength / 5 > 100000
  )
    throw new Error('Invalid Potree hierarchy page');
  const view = new DataView(arrayBuffer);
  const names = [rootName];
  const nodes: POTreeNode[] = [];
  for (let offset = 0; offset < arrayBuffer.byteLength; offset += 5) {
    const name = names[nodes.length];
    if (name === undefined) throw new Error('Unexpected Potree hierarchy records');
    const mask = view.getUint8(offset);
    const node = {
      name,
      pointCount: view.getUint32(offset + 1, true),
      header: {
        name: `r${name}`,
        childMask: mask,
        childCount: Array.from({length: 8}, (_, octant) =>
          mask & (1 << octant) ? Number(1) : Number(0)
        ).reduce((left, right) => left + right, 0)
      }
    } as POTreeNode;
    nodes.push(node);
    if (name.length - rootName.length < maximumDepth)
      for (let octant = 0; octant < 8; octant++)
        if (mask & (1 << octant)) names.push(`${name}${octant}`);
  }
  if (nodes.length !== names.length) throw new Error('Truncated Potree hierarchy page');
  return nodes;
}

/**
 * Reads next row from binary index file
 * @param dataView - index data
 * @param byteOffset - current offset in the index data
 * @param tileHeader - container to read to
 * @returns new offset
 */
/**
 * Converts Potree public node ids (`r`, `r123`) to internal node names (``, `123`).
 */
function getInternalNodeName(potreeName: string): string {
  return potreeName === 'r' ? '' : potreeName.replace(/^r/, '');
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
    const level = name.length;
    // assert(parentNode && level >= 0);

    node.level = level;
    node.hasChildren = Boolean(node.header.childMask);
    node.children = [];
    node.childrenByIndex = new Array(8).fill(null);
    node.spacing = (options?.spacing || 0) / Math.pow(2, level);
    node.type = 'pointcloud';
    node.id = node.name;
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
