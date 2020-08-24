/**
 * Represents one page node
 * {@link https://github.com/Esri/i3s-spec/blob/master/docs/1.7/node.cmn.md}
 */
export type PageNodeType = {
  lodThreshold: number;
  obb: any;
  children: any[];
  mesh?: {
    geometry: {
      resource?: number;
      definition?: number;
    },
    material?: {
      resource?: number;
      definition?: number;
    }
  };
}

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
  readonly nodePages: {nodes: PageNodeType[]}[];

  /**
   * @constructs
   * Create a nodePages instance.
   * @param writeFileFunc - function to save one nodePage into a file
   * @param nodesPerPage - length limit for one nodePage. An additional nodePage is created when this limit is met
   */
  constructor(writeFileFunc, nodesPerPage);

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
  updateMaterialByNodeId(id: number, materialId: number)

  /**
   * Put new node in nodePages array
   * @param node - node object
   * @param parentId - index of parent node
   * @return
   */
  push(node: PageNodeType, parentId?: number): number;

  /**
   * Save all the node pages
   * Run this method when all nodes is pushed in nodePages
   * @param {string} layers0path - path of layer
   * @return {promise}
   */
  save(layers0path: string): Promise<void>;
}
