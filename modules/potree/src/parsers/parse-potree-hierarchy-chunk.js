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

// load hierarchy
export default function parsePotreeHierarchyChunk(arrayBuffer) {
  const tileHeaders = parseBinaryChunk(arrayBuffer);
  return buildHierarchy(tileHeaders);
}

// Parses the binary rows
function parseBinaryChunk(arrayBuffer, byteOffset = 0) {
  const dataView = new DataView(arrayBuffer);

  const stack = [];

  // Get root mask
  const topTileHeader = {};
  byteOffset = decodeRow(dataView, byteOffset, topTileHeader);

  stack.push(topTileHeader);

  const tileHeaders = [];

  while (stack.length > 0) {
    const snode = stack.shift();
    let mask = 1;

    for (let i = 0; i < 8; i++) {
      if ((snode.header.childMask & mask) !== 0) {
        const tileHeader = {};
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

function decodeRow(dataView, byteOffset, tileHeader) {
  tileHeader.header = tileHeader.header || {};
  tileHeader.header.childMask = dataView.getUint8(byteOffset);
  tileHeader.header.childCount = 0;
  tileHeader.pointCount = dataView.getUint32(byteOffset + 1, true);
  tileHeader.name = '';
  byteOffset += 5;
  return byteOffset;
}

// Resolves the binary rows into a hierarchy (tree structure)
function buildHierarchy(tileHeaders, options = {}) {
  const DEFAULT_OPTIONS = {spacing: 100}; // TODO assert instead of default?
  options = {...DEFAULT_OPTIONS, ...options};

  const topNode = tileHeaders[0];
  const nodes = {};

  for (const tileHeader of tileHeaders) {
    const {name} = tileHeader;

    const index = parseInt(name.charAt(name.length - 1), 10);
    const parentName = name.substring(0, name.length - 1);
    const parentNode = nodes[parentName];
    const level = name.length - 1;
    // assert(parentNode && level >= 0);

    tileHeader.level = level;
    tileHeader.hasChildren = tileHeader.header.childCount;
    tileHeader.children = [];
    tileHeader.childrenByIndex = new Array(8).fill(null);
    tileHeader.spacing = options.spacing / Math.pow(2, level);
    // tileHeader.boundingVolume = Utils.createChildAABB(parentNode.boundingBox, index);

    if (parentNode) {
      parentNode.children.push(tileHeader);
      parentNode.childrenByIndex[index] = tileHeader;
    }

    // Add the node to the map
    nodes[name] = tileHeader;
  }

  // First node is the root
  return topNode;
}
