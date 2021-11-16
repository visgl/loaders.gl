import {NodeInPage} from 'modules/i3s/src/types';

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
  readonly nodesCounter: number;
  readonly writeFile: any;
  readonly nodePages: {nodes: NodeInPage[]}[];

  /**
   * @constructs
   * Create a nodePages instance.
   * @param writeFileFunc - function to save one nodePage into a file
   * @param nodesPerPage - length limit for one nodePage. An additional nodePage is created when this limit is met
   */
  constructor(writeFileFunc, nodesPerPage);

  /**
   * Setup function to save node pages
   * @param func - function which should be used to save node pages
   */
  useWriteFunction(func: Function): void;

  /**
   * Get the node by its end-to-end index
   * @param id - end-to-end index of the node
   * @return the node object
   */
  getNodeById(id: number): object;

  /**
   * Add a child id into the parent node.children array
   * @param parentId - end-to-end parent node index
   * @param childId - end-to-end child node index
   */
  addChildRelation(parentId: number, childId: number): void;

  /**
   * Update resource index in node.mesh object
   * @param {object} node - node object
   */
  updateResourceInMesh(node: object): void;

  /**
   * Update material in node.mesh object by node id
   * @param id - end-to-end index of the node
   * @param materialId - id from scene layer materialDefinitions
   */
  updateMaterialByNodeId(id: number, materialId: number);

  /**
   * Update vertexCount in node.mesh.geometry object by node id
   * @param id - end-to-end index of the node
   * @param vertexCount - vertex count for particular node
   */
  updateVertexCountByNodeId(id: number, vertexCount: number);

  /**
   * Update resource in node.mesh.attribute object by node id
   * @param id - end-to-end index of the node
   */
  updateNodeAttributeByNodeId(id: number);

  /**
   * Update featureCount in node.mesh.geometry object by node id
   * @param id - end-to-end index of the node
   * @param featureCount - features count of the node
   */
  updateFeatureCountByNodeId(id: number, featureCount: number);

  /**
   * Update texelCountHint in node.mesh.material object by node id
   * @param id - end-to-end index of the node
   * @param texelCountHint - texelCountHint of particular node
   */
  updateTexelCountHintByNodeId(id: number, texelCountHint: number);

  /**
   * Put new node in nodePages array
   * @param node - node object
   * @param parentId - index of parent node
   * @return
   */
  push(node: NodeInPage, parentId?: number): number;

  /**
   * Save all the node pages
   * Run this method when all nodes is pushed in nodePages
   * @param {string} layers0path - path of layer
   * @param {Object} fileMap - fileMap which keep info for slpk archive
   * @param {boolean} slpk
   * @return {promise}
   */
  save(layers0path: string, fileMap: Object, slpk: boolean): Promise<void>;
}
