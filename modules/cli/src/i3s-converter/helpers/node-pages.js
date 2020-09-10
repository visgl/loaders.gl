import {join} from 'path';
import transform from 'json-map-transform';
import {METADATA as metadataTemplate} from '../json-templates/metadata';

/**
 * class NodePages - wrapper of nodePages array
 *
 * @example
 * import {writeFile} from './helpers/write-file';
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
    this.nodePages = [{}];
    this.nodePages[0].nodes = [];
    this.writeFile = writeFileFunc;
  }

  useWriteFunction(func) {
    this.writeFile = func;
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
   * Update material in node.mesh object by node id
   * @param id - end-to-end index of the node
   * @param materialId - id from scene layer materialDefinitions
   */
  updateMaterialByNodeId(id, materialId) {
    const node = this.getNodeById(id);
    if (!node.mesh) {
      return;
    }
    node.mesh.material = {
      definition: materialId,
      resource: node.index
    };
  }

  /**
   * Update vertexCount in node.mesh.geometry object by node id
   * @param id - end-to-end index of the node
   * @param vertexCount - vertex count for particular node
   */
  updateVertexCountByNodeId(id, vertexCount) {
    const node = this.getNodeById(id);
    if (!node.mesh) {
      return;
    }
    node.mesh.geometry.vertexCount = vertexCount;
  }

  /**
   * Add a child id into the parent node.children array
   * @param {number | null} parentId - end-to-end parent node index
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
      node.mesh.geometry.resource = node.index;
    }
  }

  /**
   * Put new node in nodePages array
   * @param {object} node - node object
   * @param {number | null} parentId - index of parent node
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
   * @param {string} layers0Path - path of layer
   * @param {Object} fileMap
   * @param {boolean} slpk
   * @return {promise}
   */
  async save(layers0Path, fileMap, slpk = false) {
    const promises = [];
    if (slpk) {
      for (const [index, nodePage] of this.nodePages.entries()) {
        const nodePageStr = JSON.stringify(nodePage);
        const slpkPath = join(layers0Path, 'nodepages');
        promises.push(this.writeFile(slpkPath, nodePageStr, `${index.toString()}.json`));
        fileMap[`nodePages/${index.toString()}.json.gz`] = `${slpkPath}.json.gz`;
      }
      const metadata = transform({nodeCount: this.nodesCounter}, metadataTemplate);
      const compress = false;
      fileMap['metadata.json'] = await this.writeFile(
        layers0Path,
        JSON.stringify(metadata),
        'metadata.json',
        compress
      );
    } else {
      for (const [index, nodePage] of this.nodePages.entries()) {
        const nodePageStr = JSON.stringify(nodePage);
        const nodePagePath = join(layers0Path, 'nodepages', index.toString());
        promises.push(this.writeFile(nodePagePath, nodePageStr));
      }
    }

    await Promise.all(promises);
  }
}
