import {join} from 'path';
import transform from 'json-map-transform';
import {METADATA as metadataTemplate} from '../json-templates/metadata';
import {NodeInPage} from '@loaders.gl/i3s';
import {isFileExists, openJson} from '../../lib/utils/file-utils';
import I3SConverter from '../i3s-converter';

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
 * const parent = await nodePages.push({
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
 * const node = await this.nodePages.push(nodeInPage, parent.index);
 * ...
 * // save all the nodePages in the end of pushing all the nodes
 * await this.nodePages.save(layers0path);
 */
export default class NodePages {
  readonly nodesPerPage: number;
  nodesCounter: number;
  writeFile: (...args) => Promise<null | string>;
  converter: I3SConverter;
  readonly nodePages: {nodes: NodeInPage[]}[];
  readonly length: number = 0;

  /**
   * @constructs
   * Create a nodePages instance.
   * @param writeFileFunc - function to save one nodePage into a file
   * @param nodesPerPage - length limit for one nodePage. An additional nodePage is created when this limit is met
   */
  constructor(writeFileFunc, nodesPerPage, converter: I3SConverter) {
    this.nodesPerPage = nodesPerPage;
    this.nodesCounter = 0;
    // @ts-expect-error
    this.nodePages = [{}];
    this.nodePages[0].nodes = [];
    this.writeFile = writeFileFunc;
    this.converter = converter;
    this.length = 0;
  }

  /**
   * Setup function to save node pages
   * @param func - function which should be used to save node pages
   */
  useWriteFunction(func: (...args) => Promise<null | string>): void {
    this.writeFile = func;
  }

  /**
   * Get file path and file name of the node page with the particular id
   * @param nodePageId - node page id
   * @returns file path and file name
   */
  private getNodePageFileName(nodePageId): {filePath: string; fileName: string} {
    let filePath;
    let fileName;
    if (this.converter.options.slpk) {
      filePath = join(this.converter.layers0Path, 'nodepages');
      fileName = `${nodePageId.toString()}.json`;
    } else {
      filePath = join(this.converter.layers0Path, 'nodepages', nodePageId.toString());
      fileName = 'index.json';
    }
    return {filePath, fileName};
  }

  /**
   * Load node page from a file on the disk
   * @param nodePageId - node page id
   * @returns - node page data
   */
  private async loadNodePage(nodePageId: number): Promise<{nodes: NodeInPage[]}> {
    const {filePath, fileName} = this.getNodePageFileName(nodePageId);
    const fullName = join(filePath, fileName);
    if (await isFileExists(fullName)) {
      console.log(`load ${fullName}.`); // eslint-disable-line
      return (await openJson(filePath, fileName)) as {nodes: NodeInPage[]};
    }
    return {nodes: []};
  }

  /**
   * Get nodepage id by node id
   * @param id node id
   * @returns node page id
   */
  private getPageIndexByNodeId(id: number): number {
    return Math.floor(id / this.nodesPerPage);
  }

  /**
   * Get node page data by node id
   * @param id node id
   * @returns node page data
   */
  private async getPageByNodeId(id: number): Promise<{nodes: NodeInPage[]}> {
    const pageIndex = this.getPageIndexByNodeId(id);
    if (this.converter.options.instantNodeWriting) {
      return await this.loadNodePage(pageIndex);
    }
    return this.nodePages[pageIndex];
  }

  /**
   * Get the node by its end-to-end index
   * @param id - end-to-end index of the node
   * @return the node object
   */
  async getNodeById(id: number, nodePage?: {nodes: NodeInPage[]}): Promise<NodeInPage> {
    const nodeIndex = id % this.nodesPerPage;
    nodePage = nodePage || (await this.getPageByNodeId(id));
    return nodePage.nodes[nodeIndex];
  }

  /**
   * Add a child id into the parent node.children array
   * @param parentId - end-to-end parent node index
   * @param childId - end-to-end child node index
   */
  private async addChildRelation(parentId: number | undefined, childId: number): Promise<void> {
    if (parentId === null || parentId === undefined) {
      return;
    }
    const parentNode = await this.getNodeById(parentId);
    parentNode.children?.push(childId);
    await this.saveNode(parentNode);
  }

  /**
   * Put new node in nodePages array
   * @param node - node object
   * @param parentId - index of parent node
   * @return
   */
  async push(node: NodeInPage, parentId?: number): Promise<NodeInPage> {
    node.index = this.nodesCounter++;
    if (!this.converter.options.instantNodeWriting) {
      let currentNodePage = this.nodePages[this.nodePages.length - 1];
      if (currentNodePage.nodes.length === this.nodesPerPage) {
        currentNodePage = {nodes: []};
        this.nodePages.push(currentNodePage);
      }
      currentNodePage.nodes.push(node);
    }
    await this.addChildRelation(parentId, node.index);
    NodePages.updateResourceInMesh(node);
    await this.saveNode(node);
    return node;
  }

  /**
   * Save node to the file on the disk
   * @param node - node data
   */
  async saveNode(node: NodeInPage): Promise<void> {
    if (!this.converter.options.instantNodeWriting) {
      return;
    }
    const nodePageIndex = this.getPageIndexByNodeId(node.index);
    const nodePage = await this.getPageByNodeId(node.index);
    const {filePath, fileName} = this.getNodePageFileName(nodePageIndex);
    const nodeToUpdate = await this.getNodeById(node.index, nodePage);
    if (nodeToUpdate) {
      NodePages.updateAll(nodeToUpdate, node);
    } else {
      nodePage.nodes.push(node);
    }
    const nodePageStr = JSON.stringify(nodePage);
    if (this.converter.options.slpk) {
      await this.converter.writeQueue.enqueue(
        {
          archiveKey: `nodePages/${nodePageIndex.toString()}.json.gz`,
          writePromise: () =>
            this.writeFile(filePath, nodePageStr, fileName, true, this.converter.compressList)
        },
        true
      );
    } else {
      await this.converter.writeQueue.enqueue(
        {
          writePromise: () => this.writeFile(filePath, nodePageStr)
        },
        true
      );
    }
  }

  /**
   * Save metadata file (for slpk only)
   */
  async saveMetadata(): Promise<void> {
    const metadata = transform({nodeCount: this.nodesCounter}, metadataTemplate());
    const compress = false;
    await this.converter.writeQueue.enqueue({
      archiveKey: 'metadata.json',
      writePromise: () =>
        this.writeFile(
          this.converter.layers0Path,
          JSON.stringify(metadata),
          'metadata.json',
          compress
        )
    });
  }

  /**
   * Save all the node pages
   * Run this method when all nodes is pushed in nodePages
   */
  async save(): Promise<void> {
    if (this.converter.options.instantNodeWriting) {
      await this.saveMetadata();
      return;
    }
    if (this.converter.options.slpk) {
      for (const [index, nodePage] of this.nodePages.entries()) {
        const nodePageStr = JSON.stringify(nodePage);
        const slpkPath = join(this.converter.layers0Path, 'nodepages');
        await this.converter.writeQueue.enqueue({
          archiveKey: `nodePages/${index.toString()}.json.gz`,
          writePromise: () => this.writeFile(slpkPath, nodePageStr, `${index.toString()}.json`)
        });
      }
      await this.saveMetadata();
    } else {
      for (const [index, nodePage] of this.nodePages.entries()) {
        const nodePageStr = JSON.stringify(nodePage);
        const nodePagePath = join(this.converter.layers0Path, 'nodepages', index.toString());
        await this.converter.writeQueue.enqueue({
          writePromise: () => this.writeFile(nodePagePath, nodePageStr)
        });
      }
    }
  }

  /**
   * Update resource index in node.mesh object
   * @param node - node object
   */
  static updateResourceInMesh(node: NodeInPage): void {
    if (node.mesh && isFinite(node.index)) {
      node.mesh.geometry.resource = node.index;
    }
  }

  /**
   * Update all fields in the node excluding id
   * @param node - node object
   * @param data - NodeInPage data to replace original data
   */
  static updateAll(node: NodeInPage, data: NodeInPage): NodeInPage {
    Object.assign(node, data, {index: node.index});
    NodePages.updateResourceInMesh(node);
    return node;
  }

  /**
   * Update material in node.mesh object by node id
   * @param id - end-to-end index of the node
   * @param materialId - id from scene layer materialDefinitions
   */
  static updateMaterialByNodeId(node: NodeInPage, materialId: number): void {
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
  static updateVertexCountByNodeId(node: NodeInPage, vertexCount: number): void {
    if (!node.mesh) {
      return;
    }
    node.mesh.geometry.vertexCount = vertexCount;
  }

  /**
   * Update resource in node.mesh.attribute object by node id
   * @param node - node object
   */
  static updateNodeAttributeByNodeId(node: NodeInPage): void {
    if (!node.mesh || !node.index) {
      return;
    }
    node.mesh.attribute.resource = node.index;
  }

  /**
   * Update featureCount in node.mesh.geometry object by node id
   * @param node - node object
   * @param featureCount - features count of the node
   */
  static updateFeatureCountByNodeId(node: NodeInPage, featureCount: number): void {
    if (!node.mesh) {
      return;
    }
    node.mesh.geometry.featureCount = featureCount;
  }

  /**
   * Update texelCountHint in node.mesh.material object by node id
   * @param node - node object
   * @param texelCountHint - texelCountHint of particular node
   */
  static updateTexelCountHintByNodeId(node: NodeInPage, texelCountHint: number): void {
    if (!node.mesh || !node.mesh.material) {
      return;
    }
    node.mesh.material.texelCountHint = texelCountHint;
  }
}
