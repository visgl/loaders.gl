import {join} from 'path';
import {
  BoundingVolumes,
  LodSelection,
  Node3DIndexDocument,
  NodeInPage,
  NodeReference
} from '@loaders.gl/i3s';
import transform from 'json-map-transform';
import {v4 as uuidv4} from 'uuid';
import {openJson, writeFileForSlpk} from '../../lib/utils/file-utils';
import I3SConverter from '../i3s-converter';
import {NODE as nodeTemplate} from '../json-templates/node';
import {I3SConvertedResources} from '../types';
import {DumpMetadata} from '../../lib/utils/conversion-dump';

/**
 * Wrapper for https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md data
 * The class allows working with 3DNodeIndexDocument in 2 modes:
 * in memory: the data is stored in `data` field
 * on disk: the data is written on disk in a file. The file can be rewritten when new childrend or neighbors have to be added
 */
export class NodeIndexDocument {
  /** Node id */
  public id: string;
  /** Id in node pages */
  public inPageId: number;
  /** 3DNodeIndexDocument data */
  public data: Node3DIndexDocument | null = null;
  /** children */
  public children: NodeIndexDocument[] = [];
  /** converter instance */
  private converter: I3SConverter;

  /**
   * Finalized property. It means that all child nodes are saved and their data
   * is unloaded
   */
  private _finalized: boolean = false;
  get finalized(): boolean {
    return this._finalized;
  }

  /**
   * Constructor
   * @param id - id of the node in node pages
   * @param converter - converter instance
   */
  constructor(id: number, converter: I3SConverter) {
    this.inPageId = id;
    this.id = id === 0 ? 'root' : id.toString();
    this.converter = converter;
  }

  /**
   * Add Node3DIndexDocument data to the node
   * @param data Node3DIndexDocument data
   * @returns this NodeIndexDocument instance (to recurring with constructor)
   */
  public async addData(data: Node3DIndexDocument): Promise<NodeIndexDocument> {
    if (this.converter.options.instantNodeWriting) {
      await this.write(data);
    } else {
      this.data = data;
    }
    return this;
  }

  /**
   * Add child node references
   * @param childNodes - child NodeIndexDocument instances
   */
  public async addChildren(childNodes: NodeIndexDocument[]): Promise<void> {
    const newChildren: NodeReference[] = [];
    for (const node of childNodes) {
      const nodeData = await node.load();
      newChildren.push({
        id: node.id,
        href: `../${node.id}`,
        obb: nodeData.obb,
        mbs: nodeData.mbs
      });
    }
    this.children = this.children.concat(childNodes);

    let data: Node3DIndexDocument | null = this.data;
    if (this.converter.options.instantNodeWriting) {
      data = await this.load();
    }
    if (data) {
      data.children = data.children ?? [];
      data.children = data.children.concat(newChildren);
    }
    if (this.converter.options.instantNodeWriting && data) {
      await this.write(data);
    }
  }

  /**
   * Add neighbors to child nodes of this node
   */
  public async addNeighbors(): Promise<void> {
    if (this.finalized) {
      return;
    }
    const nodeData = await this.load();
    for (const childNode of this.children) {
      const childNodeData = await childNode.load();
      childNodeData.neighbors = childNodeData.neighbors ?? [];

      // Don't do large amount of "neightbors" to avoid big memory consumption
      if (Number(nodeData?.children?.length) < 1000) {
        for (const neighbor of nodeData.children || []) {
          if (childNode.id === neighbor.id) {
            continue; // eslint-disable-line
          }

          childNodeData.neighbors.push({...neighbor});
        }
      } else {
        // eslint-disable-next-line no-console, no-undef
        console.warn(
          `Node ${childNode.id}: neighbors attribute is omited because of large number of neigbors`
        );
        delete childNodeData.neighbors;
      }

      if (this.converter.options.instantNodeWriting && childNodeData) {
        await childNode.write(childNodeData);
      }
      await childNode.save();
    }
    // The save after adding neighbors is the last one. Finalize the the node
    this.finalize();
  }

  /** Save 3DNodeIndexDocument in file on disk */
  public async save(): Promise<void> {
    if (this.data) {
      await this.write(this.data);
    }
  }

  /** Finalize the node */
  private finalize(): void {
    this._finalized = true;
    for (const child of this.children) {
      child.flush();
    }
  }

  /**
   * Write 3DNodeIndexDocument https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md
   * @param node - Node3DIndexDocument object
   */
  private async write(node: Node3DIndexDocument): Promise<void> {
    const path = join(this.converter.layers0Path, 'nodes', this.id);
    await this.converter.writeQueue.enqueue(
      {
        archiveKey: `nodes/${this.id}/3dNodeIndexDocument.json.gz`,
        writePromise: () =>
          writeFileForSlpk(
            path,
            JSON.stringify(node),
            '3dNodeIndexDocument.json',
            true,
            this.converter.compressList
          )
      },
      true
    );
  }

  /**
   * Load 3DNodeIndexDocument data from file on disk
   * @returns 3DNodeIndexDocument object
   */
  private async load(): Promise<Node3DIndexDocument> {
    if (this.data) {
      return this.data;
    }
    const path = this.id;
    const parentNodePath = join(this.converter.layers0Path, 'nodes', path);
    const parentNodeFileName = '3dNodeIndexDocument.json';
    return (await openJson(parentNodePath, parentNodeFileName)) as Node3DIndexDocument;
  }

  /**
   * Unload the Node data
   */
  private flush(): void {
    this.data = null;
  }

  /**
   * Create root node of the tree
   * @param boundingVolumes - MBS and OOB bounding volumes data
   * @param converter - I3SConverter instance
   * @returns instance of NodeIndexDocument
   */
  static async createRootNode(
    boundingVolumes: BoundingVolumes,
    converter: I3SConverter
  ): Promise<NodeIndexDocument> {
    const rootData = NodeIndexDocument.createRootNodeIndexDocument(boundingVolumes);
    const rootNode = await new NodeIndexDocument(0, converter).addData(rootData);
    return rootNode;
  }

  /**
   * Create NodeIndexDocument instance
   * @param parentNode - parent NodeIndexDocument
   * @param boundingVolumes - MBS and OOB bounding volumes data
   * @param lodSelection - LOD metrics data
   * @param nodeInPage - node data in node pages
   * @param resources - resources extracted from gltf/b3dm file
   * @param converter - I3SConverter instance
   * @returns NodeIndexDocument instance
   */
  static async createNode({
    parentNode,
    boundingVolumes,
    lodSelection,
    nodeInPage,
    resources,
    converter
  }: {
    parentNode: NodeIndexDocument;
    boundingVolumes: BoundingVolumes;
    lodSelection: LodSelection[];
    nodeInPage: NodeInPage;
    resources: I3SConvertedResources;
    converter: I3SConverter;
  }): Promise<NodeIndexDocument> {
    const data = await NodeIndexDocument.createNodeIndexDocument(
      parentNode,
      boundingVolumes,
      lodSelection,
      nodeInPage,
      resources
    );
    const node = await new NodeIndexDocument(nodeInPage.index, converter).addData(data);
    return node;
  }

  /**
   * Form 3DNodeIndexDocument data for the root node
   * @param boundingVolumes - mbs and obb data about node's bounding volume
   * @return 3DNodeIndexDocument data https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md
   */
  static createRootNodeIndexDocument(boundingVolumes: BoundingVolumes): Node3DIndexDocument {
    const root0data = {
      version: `{${uuidv4().toUpperCase()}}`,
      id: 'root',
      level: 0,
      lodSelection: [
        {
          metricType: 'maxScreenThresholdSQ',
          maxError: 0
        },
        {
          metricType: 'maxScreenThreshold',
          maxError: 0
        }
      ],
      ...boundingVolumes,
      children: []
    };
    return transform(root0data, nodeTemplate());
  }

  /**
   * Create a new Node3DIndexDocument
   * @param parentNode - 3DNodeIndexDocument https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md object of the parent node
   * @param boundingVolumes - Bounding volumes
   * @param lodSelection - Level of Details (LOD) metrics
   * @param nodeInPage - corresponding node object in a node page
   * @param resources - the node resources data
   * @param resources.texture - texture image
   * @param resources.attributes - feature attributes
   * @return 3DNodeIndexDocument https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md object
   */
  // eslint-disable-next-line complexity
  static async createNodeIndexDocument(
    parentNode: NodeIndexDocument,
    boundingVolumes: BoundingVolumes,
    lodSelection: LodSelection[],
    nodeInPage: NodeInPage,
    resources: I3SConvertedResources | DumpMetadata
  ): Promise<Node3DIndexDocument> {
    const nodeId = nodeInPage.index;
    const parentNodeData = await parentNode.load();
    const nodeData = {
      version: parentNodeData.version,
      id: nodeId.toString(),
      level: parentNodeData.level! + 1,
      ...boundingVolumes,
      lodSelection,
      parentNode: {
        id: parentNode.id,
        href: `../${parentNode.id}`,
        mbs: parentNodeData.mbs,
        obb: parentNodeData.obb
      },
      children: [],
      neighbors: []
    };
    const node = transform(nodeData, nodeTemplate());

    if (nodeInPage.mesh) {
      node.geometryData = [{href: './geometries/0'}];
      node.sharedResource = {href: './shared'};

      if (
        ('texture' in resources && resources.texture) ||
        ('texelCountHint' in resources && resources.texelCountHint)
      ) {
        node.textureData = [{href: './textures/0'}, {href: './textures/1'}];
      }

      if (
        ('attributes' in resources &&
          resources.attributes &&
          resources.attributes.length &&
          parentNode.converter.layers0?.attributeStorageInfo?.length) ||
        ('attributesCount' in resources &&
          resources.attributesCount &&
          parentNode.converter.layers0?.attributeStorageInfo?.length)
      ) {
        const attributesLength =
          ('attributes' in resources ? resources.attributes?.length : resources.attributesCount) ||
          0;
        node.attributeData = [];
        const minimumLength =
          attributesLength < parentNode.converter.layers0.attributeStorageInfo.length
            ? attributesLength
            : parentNode.converter.layers0.attributeStorageInfo.length;
        for (let index = 0; index < minimumLength; index++) {
          const folderName = parentNode.converter.layers0.attributeStorageInfo[index].key;
          node.attributeData.push({href: `./attributes/${folderName}/0`});
        }
      }
    }

    return node;
  }
}
