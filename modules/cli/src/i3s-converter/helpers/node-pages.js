import {join} from 'path';

/**
 * class NodePages - wrapper of nodePages array
 * 
 * @example
 * import writeFile from './helpers/write-file';
 * 
 * // create an instance of the class
 * const nodePages = new NodePages(writeFile, HARDCODED_NODES_PER_PAGE); 
 * ...
 * // push root node
 * const parentId = nodePages.push({                                     
      lodThreshold: HARDCODED_MAX_SCREEN_THRESHOLD_SQ,
      obb: coordinates.obb,
      children: []
    });
 * ...
 * // push node with parent relation
 * const nodeInPage = {                                                  
      lodThreshold: HARDCODED_MAX_SCREEN_THRESHOLD_SQ,
      obb: coordinates.obb,
      children: [],
      mesh: {
        material: {
          definition: 0
        },
        geometry: {
          definition: 0
        }
      }
    };
 * const nodeId = this.nodePages.push(nodeInPage, parentId);            
 * ...
 * // save all the nodePages in the end of pushing all the nodes
 * await this.nodePages.save(layers0path);                              
 */
export default class NodePages {
  /**
   * @constructs
   * Create a nodePages instance.
   * @param writeFileFunc - function to save one nodePage into a file
   * @param nodesPerPage - length limit for one nodePage. An additional nodePage is created when this limit is met
   */
  constructor(writeFileFunc, nodesPerPage) {
    this.nodesPerPage = nodesPerPage;
    this.nodesCounter = 0;
    this.nodePages = [{nodes: []}];
    this.writeFile = writeFileFunc;
  }

  /**
   * Get the node by its end-to-end index
   * @param {number} id - end-to-end index of the node
   * @return {object} the node object
   */
  getNodeById(id) {
    const pageIndex = Math.floor(id / this.nodesPerPage);
    const nodeIndex = id % this.nodesPerPage;
    return this.nodePages[pageIndex].nodes[nodeIndex];
  }

  /**
   * Add a child id into the parent node.children array
   * @param {number} parentId - end-to-end parent node index
   * @param {number} childId - end-to-end child node index
   * @return {void}
   */
  addChildRelation(parentId, childId) {
    if (parentId === null) {
      return;
    }
    const parentNode = this.getNodeById(parentId);
    parentNode.children.push(childId);
  }

  /**
   * Update resource index in node.mesh object
   * @param {object} node - node object
   * @return {void}
   */
  updateResourceInMesh(node) {
    if (node.mesh) {
      node.mesh.material.resource = node.index;
      node.mesh.geometry.resource = node.index;
    }
  }

  /**
   * Put new node in nodePages array
   * @param {object} node - node object
   * @param {number} parentId - index of parent node
   * @return {number}
   */
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

  /**
   * Save all the node pages
   * Run this method when all nodes is pushed in nodePages
   * @param {string} layers0path - path of layer
   * @return {promise}
   */
  async save(layers0path) {
    const promises = [];
    for (const [index, nodePage] of this.nodePages.entries()) {
      const nodePagePath = join(layers0path, 'nodepages', index.toString());
      promises.push(this.writeFile(nodePagePath, JSON.stringify(nodePage)));
    }
    await Promise.all(promises);
  }
}
