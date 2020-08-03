import {join} from 'path';
import writeFile from './helpers/write-file';

export default class NodePages {
  constructor(nodesPerPage) {
    this.nodesPerPage = nodesPerPage;
    this.nodesCounter = 0;
    this.nodePages = [{nodes: []}];
  }

  getNodeById(id) {
    const pageIndex = Math.floor(id / this.nodesPerPage);
    const nodeIndex = id % this.nodesPerPage;
    return this.nodePages[pageIndex].nodes[nodeIndex];
  }

  addChildRelation(parentId, childId) {
    if (parentId === null) {
      return;
    }
    const parentNode = this.getNodeById(parentId);
    parentNode.children.push(childId);
  }

  updateResourceInMesh(node) {
    if (node.mesh) {
      node.mesh.material.resource = node.index;
      node.mesh.geometry.resource = node.index;
    }
  }

  push(node, parentId = null) {
    let currentNodePage = this.nodePages[this.nodePages.length - 1];
    if (currentNodePage.nodes.length === this.nodesPerPage) {
      currentNodePage = {nodes: []};
      this.nodePages.push(currentNodePage);
    }
    node.index = this.nodesCounter++;
    currentNodePage.nodes.push(node);
    this.addChildRelation(parentId, node.index);
    this.updateResourceInMesh(node);
    return node.index;
  }

  async save(layers0path) {
    const promises = [];
    for (const [index, nodePage] of this.nodePages.entries()) {
      const nodePagePath = join(layers0path, 'nodePages', index.toString());
      promises.push(writeFile(nodePagePath, JSON.stringify(nodePage)));
    }
    await Promise.all(promises);
  }
}
