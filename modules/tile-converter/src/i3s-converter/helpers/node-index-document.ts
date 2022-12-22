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
import {openJson, writeFile, writeFileForSlpk} from '../../lib/utils/file-utils';
import I3SConverter from '../i3s-converter';
import {NODE as nodeTemplate} from '../json-templates/node';
import {I3SConvertedResources} from '../types';

export class NodeIndexDocument {
  public id: string;
  public inPageId: number;
  public data: Node3DIndexDocument | null = null;
  public children: NodeIndexDocument[] = [];
  private converter: I3SConverter;

  constructor(id: number, converter: I3SConverter) {
    this.inPageId = id;
    this.id = id === 0 ? 'root' : id.toString();
    this.converter = converter;
  }

  public async addData(data: Node3DIndexDocument): Promise<NodeIndexDocument> {
    if (this.converter.options.instantNodesWriting) {
      await this.write(data);
    } else {
      this.data = data;
    }
    return this;
  }

  public async addChildren(childNodes: NodeIndexDocument[]): Promise<NodeIndexDocument> {
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
    if (this.converter.options.instantNodesWriting) {
      data = (await this.load()) as Node3DIndexDocument;
    }
    if (data) {
      data.children = data.children ?? [];
      data.children = data.children.concat(newChildren);
    }
    if (this.converter.options.instantNodesWriting && data) {
      await this.write(data);
    }
    return this;
  }

  /**
   * Add neightbors to 3DNodeIndexDocument and write it in a file
   * @param parentNode - arguments
   * @param childNodes - array of target child nodes
   */
  public async addNeighbors(): Promise<void> {
    const nodeData = await this.load();
    for (const childNode of this.children) {
      const childNodeData = await childNode.load();
      childNodeData.neighbors = childNodeData.neighbors ?? [];

      // Don't do large amount of "neightbors" to avoid big memory consumption
      if (Number(nodeData?.children?.length) < 1000) {
        for (const neighbor of nodeData.children || []) {
          // eslint-disable-next-line max-depth
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

      if (this.converter.options.instantNodesWriting && childNodeData) {
        await childNode.write(childNodeData);
      }
      childNode.save();
    }
  }

  public async save(): Promise<void> {
    if (this.data) {
      await this.write(this.data);
    }
  }

  /**
   * Write 3DNodeIndexDocument https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md
   */
  private async write(node: Node3DIndexDocument): Promise<void> {
    const path = join(this.converter.layers0Path, 'nodes', this.id);
    if (this.converter.options.slpk) {
      await this.converter.writeQueue.enqueue(
        {
          archiveKey: `nodes/${this.id}/3dNodeIndexDocument.json.gz`,
          writePromise: writeFileForSlpk(
            path,
            JSON.stringify(node),
            '3dNodeIndexDocument.json',
            true,
            this.converter.compressList
          )
        },
        true
      );
    } else {
      await this.converter.writeQueue.enqueue(
        {writePromise: writeFile(path, JSON.stringify(node))},
        true
      );
    }
  }

  private async load(): Promise<Node3DIndexDocument> {
    if (this.data) {
      return this.data;
    }
    const path = this.id;
    const parentNodePath = join(this.converter.layers0Path, 'nodes', path);
    let parentNodeFileName = 'index.json';
    if (this.converter.options.slpk) {
      parentNodeFileName = '3dNodeIndexDocument.json';
    }
    return (await openJson(parentNodePath, parentNodeFileName)) as Node3DIndexDocument;
  }

  static async createRootNode(boundingVolumes, converter): Promise<NodeIndexDocument> {
    const rootData = NodeIndexDocument.createRootNodeIndexDocument(boundingVolumes);
    const rootNode = await new NodeIndexDocument(0, converter).addData(rootData);
    return rootNode;
  }

  static async createNode(
    parentNode: NodeIndexDocument,
    boundingVolumes: BoundingVolumes,
    lodSelection: LodSelection[],
    nodeInPage: NodeInPage,
    resources: I3SConvertedResources,
    converter: I3SConverter
  ): Promise<NodeIndexDocument> {
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
   * Convert and save the layer and embedded tiles
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
   * Create a new node page object in node pages
   * @param parentNode - 3DNodeIndexDocument https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md object of the parent node
   * @param boundingVolumes - Bounding volumes
   * @param lodSelection - Level of Details (LOD) metrics
   * @param nodeInPage - corresponding node object in a node page
   * @param resources - the node resources data
   * @param resources.texture - texture image
   * @param resources.attributes - feature attributes
   * @return 3DNodeIndexDocument https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md object
   */
  static async createNodeIndexDocument(
    parentNode: NodeIndexDocument,
    boundingVolumes: BoundingVolumes,
    lodSelection: LodSelection[],
    nodeInPage: NodeInPage,
    resources: I3SConvertedResources
  ): Promise<Node3DIndexDocument> {
    const {texture, attributes} = resources;
    const nodeId = nodeInPage.index!;
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

      if (texture) {
        node.textureData = [{href: './textures/0'}, {href: './textures/1'}];
      }

      if (
        attributes &&
        attributes.length &&
        parentNode.converter.layers0?.attributeStorageInfo?.length
      ) {
        node.attributeData = [];
        for (let index = 0; index < attributes.length; index++) {
          const folderName = parentNode.converter.layers0.attributeStorageInfo[index].key;
          node.attributeData.push({href: `./attributes/${folderName}/0`});
        }
      }
    }

    return node;
  }
}
