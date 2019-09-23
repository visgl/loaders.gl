// This file is derived from the potree code base under BSD 2-clause license
// https://github.com/potree/potree/blob/develop/src/PointCloudEptGeometry.js
// Original Author: connormanning

import EPTKey from './ept-key';

// eptHierarchyFile = `${this.ept.url}ept-hierarchy/${this.filename()}.json`;
//
export default function parseETPHierarchySync(json) {
  const nodes = {};
  // nodes[this.filename()] = null; // this;
  // const hasChildren = false;

  const keys = getSortedKeys(json);

  for (const v of keys) {
    const [d, x, y, z] = v.split('-').map(n => parseInt(n, 10));
    const a = x & 1;
    const b = y & 1;
    const c = z & 1;
    const parentName = `${d - 1}-${x >> 1}-${y >> 1}-${z >> 1}`;

    const parentNode = nodes[parentName];
    if (!parentNode) {
      return;
    }
    parentNode.hasChildren = true;

    const key = parentNode.key.step(a, b, c);

    const node = new EPTKey(null /* this.ept */, key.b, key.d, key.x, key.y, key.z);

    node.level = d;
    node.numPoints = json[v];

    parentNode.addChild(node);
    nodes[key.name()] = node;
  }
}

// Since we want to traverse top-down, and 10 comes
// lexicographically before 9 (for example), do a deep sort.
function getSortedKeys(json) {
  return Object.keys(json).sort((a, b) => {
    const [da, xa, ya, za] = a.split('-').map(n => parseInt(n, 10));
    const [db, xb, yb, zb] = b.split('-').map(n => parseInt(n, 10));
    if (da < db) {
      return -1;
    }
    if (da > db) {
      return 1;
    }
    if (xa < xb) {
      return -1;
    }
    if (xa > xb) {
      return 1;
    }
    if (ya < yb) {
      return -1;
    }
    if (ya > yb) {
      return 1;
    }
    if (za < zb) {
      return -1;
    }
    if (za > zb) {
      return 1;
    }
    return 0;
  });
}
