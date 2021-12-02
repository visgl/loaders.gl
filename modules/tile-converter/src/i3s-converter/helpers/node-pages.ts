import {join} from 'path';
import transform from 'json-map-transform';
import {METADATA as metadataTemplate} from '../json-templates/metadata';
import {NodeInPage} from '@loaders.gl/i3s';

// @ts-nocheck
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
  readonly nodesPerPage: number;
  nodesCounter: number;
  writeFile: Function;
  readonly nodePages: {nodes: NodeInPage[]}[];

  /**
   * @constructs
   * Create a nodePages instance.
   * @param writeFileFunc - function to save one nodePage into a file
   * @param nodesPerPage - length limit for one nodePage. An additional nodePage is created when this limit is met
   */
  constructor(writeFileFunc, nodesPerPage) {
    this.nodesPerPage = nodesPerPage;
    this.nodesCounter = 0;
    // @ts-expect-error
    this.nodePages = [{}];
    this.nodePages[0].nodes = [];
    this.writeFile = writeFileFunc;
  }

  /**
   * Setup function to save node pages
   * @param func - function which should be used to save node pages
   */
  useWriteFunction(func: Function): void {
    this.writeFile = func;
  }

  /**
   * Get the node by its end-to-end index
   * @param id - end-to-end index of the node
   * @return the node object
   */
  getNodeById(id: number): NodeInPage {
    const pageIndex = Math.floor(id / this.nodesPerPage);
    const nodeIndex = id % this.nodesPerPage;
    return this.nodePages[pageIndex].nodes[nodeIndex];
  }

  /**
   * Update material in node.mesh object by node id
   * @param id - end-to-end index of the node
   * @param materialId - id from scene layer materialDefinitions
   */
  updateMaterialByNodeId(id: number, materialId: number): void {
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
  updateVertexCountByNodeId(id: number, vertexCount: number): void {
    const node = this.getNodeById(id);
    if (!node.mesh) {
      return;
    }
    node.mesh.geometry.vertexCount = vertexCount;
  }

  /**
   * Update resource in node.mesh.attribute object by node id
   * @param id - end-to-end index of the node
   */
  updateNodeAttributeByNodeId(id: number): void {
    const node = this.getNodeById(id);
    if (!node.mesh) {
      return;
    }
    node.mesh.attribute.resource = node.index;
  }

  /**
   * Update featureCount in node.mesh.geometry object by node id
   * @param id - end-to-end index of the node
   * @param featureCount - features count of the node
   */
  updateFeatureCountByNodeId(id: number, featureCount: number): void {
    const node = this.getNodeById(id);
    if (!node.mesh) {
      return;
    }
    node.mesh.geometry.featureCount = featureCount;
  }

  /**
   * Update texelCountHint in node.mesh.material object by node id
   * @param id - end-to-end index of the node
   * @param texelCountHint - texelCountHint of particular node
   */
  updateTexelCountHintByNodeId(id: number, texelCountHint: number): void {
    const node = this.getNodeById(id);
    if (!node.mesh || !node.mesh.material) {
      return;
    }
    node.mesh.material.texelCountHint = texelCountHint;
  }

  /**
   * Add a child id into the parent node.children array
   * @param parentId - end-to-end parent node index
   * @param childId - end-to-end child node index
   */
  addChildRelation(parentId: number | undefined, childId: number): void {
    if (parentId === null || parentId === undefined) {
      return;
    }
    const parentNode = this.getNodeById(parentId);
    parentNode.children?.push(childId);
  }

  /**
   * Update resource index in node.mesh object
   * @param node - node object
   */
  updateResourceInMesh(node: NodeInPage): void {
    if (node.mesh) {
      node.mesh.geometry.resource = node.index;
    }
  }

  /**
   * Put new node in nodePages array
   * @param node - node object
   * @param parentId - index of parent node
   * @return
   */
  push(node: NodeInPage, parentId?: number): number {
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
   * @param {Object} fileMap - fileMap which keep info for slpk archive
   * @param {boolean} slpk
   * @return {promise}
   */
  async save(layers0Path: string, fileMap: Object, slpk: boolean = false): Promise<void> {
    const promises: Promise<any>[] = [];
    if (slpk) {
      for (const [index, nodePage] of this.nodePages.entries()) {
        const nodePageStr = JSON.stringify(nodePage);
        const slpkPath = join(layers0Path, 'nodepages');
        promises.push(this.writeFile(slpkPath, nodePageStr, `${index.toString()}.json`));
        fileMap[`nodePages/${index.toString()}.json.gz`] = `${slpkPath}.json.gz`;
      }
      const metadata = transform({nodeCount: this.nodesCounter}, metadataTemplate());
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
