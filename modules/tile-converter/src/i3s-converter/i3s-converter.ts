import type {Tile3D, Tileset3DProps} from '@loaders.gl/tiles';
import type {BatchTableJson, B3DMContent} from '@loaders.gl/3d-tiles';

import type {
  AttributeStorageInfo,
  SceneLayer3D,
  BoundingVolumes,
  Node3DIndexDocument,
  NodeReference,
  I3SGeometry,
  MaxScreenThresholdSQ,
  NodeInPage,
  LodSelection,
  SharedResources,
  Attribute,
  ESRIField,
  Field,
  PopupInfo,
  FieldInfo
} from '@loaders.gl/i3s';
import {load, encode} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {CesiumIonLoader, Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {join} from 'path';
import {v4 as uuidv4} from 'uuid';
import process from 'process';
import transform from 'json-map-transform';
import md5 from 'md5';

import NodePages from './helpers/node-pages';
import {writeFile, removeDir, writeFileForSlpk} from '../lib/utils/file-utils';
import {
  compressWithChildProcess
  // generateHash128FromZip,
  // addFileToZip
} from '../lib/utils/compress-util';
import {calculateFilesSize, timeConverter} from '../lib/utils/statistic-utills';
import convertB3dmToI3sGeometry from './helpers/geometry-converter';
import {
  createBoundingVolumes,
  convertCommonToI3SExtentCoordinate
} from './helpers/coordinate-converter';
import {createSceneServerPath} from './helpers/create-scene-server-path';
import {convertGeometricErrorToScreenThreshold} from '../lib/utils/lod-conversion-utils';
import {PGMLoader} from '../pgm-loader';

import {LAYERS as layersTemplate} from './json-templates/layers';
import {NODE as nodeTemplate} from './json-templates/node';
import {SHARED_RESOURCES_TEMPLATE} from './json-templates/shared-resources';
import {validateNodeBoundingVolumes} from './helpers/node-debug';
import {GeoidHeightModel} from '../lib/geoid-height-model';
import TileHeader from '@loaders.gl/tiles/src/tileset/tile-3d';
import {KTX2BasisUniversalTextureWriter} from '@loaders.gl/textures';
import {LoaderWithParser} from '@loaders.gl/loader-utils';
import {I3SMaterialDefinition} from '@loaders.gl/i3s/src/types';
import {ImageWriter} from '@loaders.gl/images';
import {GLTFImagePostprocessed} from '@loaders.gl/gltf';

const ION_DEFAULT_TOKEN =
  process.env.IonToken || // eslint-disable-line
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ'; // eslint-disable-line
const HARDCODED_NODES_PER_PAGE = 64;
const _3D_TILES = '3DTILES';
const _3D_OBJECT_LAYER_TYPE = '3DObject';
const STRING_TYPE = 'string';
const SHORT_INT_TYPE = 'Int32';
const DOUBLE_TYPE = 'double';
const OBJECT_ID_TYPE = 'OBJECTID';
const REFRESH_TOKEN_TIMEOUT = 1800; // 30 minutes in seconds
const CESIUM_DATASET_PREFIX = 'https://';
// const FS_FILE_TOO_LARGE = 'ERR_FS_FILE_TOO_LARGE';

/**
 * Converter from 3d-tiles tileset to i3s layer
 */
export default class I3SConverter {
  nodePages: NodePages;
  fileMap: {[key: string]: string};
  options: any;
  layers0Path: string;
  materialMap: Map<any, any>;
  materialDefinitions: I3SMaterialDefinition[];
  vertexCounter: number;
  layers0: SceneLayer3D | null;
  featuresHashArray: string[];
  refinementCounter: {
    tilesCount: number;
    tilesWithAddRefineCount: number;
  };
  validate: boolean;
  boundingVolumeWarnings?: string[] = [];
  conversionStartTime: [number, number] = [0, 0];
  refreshTokenTime: [number, number] = [0, 0];
  sourceTileset: Tileset3D | null = null;
  geoidHeightModel: GeoidHeightModel | null = null;
  Loader: LoaderWithParser = Tiles3DLoader;

  constructor() {
    this.nodePages = new NodePages(writeFile, HARDCODED_NODES_PER_PAGE);
    this.fileMap = {};
    this.options = {};
    this.layers0Path = '';
    this.materialMap = new Map();
    this.materialDefinitions = [];
    this.vertexCounter = 0;
    this.layers0 = null;
    this.featuresHashArray = [];
    this.refinementCounter = {
      tilesCount: 0,
      tilesWithAddRefineCount: 0
    };
    this.validate = false;
  }

  /**
   * Convert a 3d tileset
   * @param options
   * @param options.inputUrl the url to read the tileset from
   * @param options.outputPath the output filename
   * @param options.tilesetName the output name of the tileset
   * @param options.maxDepth The max tree depth of conversion
   * @param options.slpk Generate slpk (Scene Layer Packages) output file
   * @param options.sevenZipExe Location of 7z.exe archiver to create slpk on Windows
   * @param options.egmFilePath location of *.pgm file to convert heights from ellipsoidal to gravity-related format
   * @param options.token Token for Cesium ION tilesets authentication
   * @param options.draco Generate I3S 1.7 draco compressed geometries
   * @param options.validate -enable validation
   */
  async convert(options: {
    inputUrl: string;
    outputPath: string;
    tilesetName: string;
    sevenZipExe: string;
    egmFilePath: string;
    maxDepth?: number;
    slpk?: boolean;
    token?: string;
    draco?: boolean;
    validate?: boolean;
  }): Promise<any> {
    this.conversionStartTime = process.hrtime();
    const {
      tilesetName,
      slpk,
      egmFilePath,
      inputUrl,
      validate,
      outputPath,
      draco,
      sevenZipExe,
      maxDepth,
      token
    } = options;
    this.options = {maxDepth, slpk, sevenZipExe, egmFilePath, draco, token, inputUrl};
    this.validate = Boolean(validate);
    this.Loader = inputUrl.indexOf(CESIUM_DATASET_PREFIX) !== -1 ? CesiumIonLoader : Tiles3DLoader;

    console.log('Loading egm file...'); // eslint-disable-line
    this.geoidHeightModel = await load(egmFilePath, PGMLoader);
    console.log('Loading egm file completed!'); // eslint-disable-line

    if (slpk) {
      this.nodePages.useWriteFunction(writeFileForSlpk);
    }

    const preloadOptions = await this._fetchPreloadOptions();
    const tilesetOptions: Tileset3DProps = {loadOptions: {basis: {format: 'rgba32'}}};
    if (preloadOptions.headers) {
      tilesetOptions.loadOptions!.fetch = {headers: preloadOptions.headers};
    }
    Object.assign(tilesetOptions, preloadOptions);
    const sourceTilesetJson = await load(inputUrl, this.Loader, tilesetOptions.loadOptions);
    // console.log(tilesetJson); // eslint-disable-line
    this.sourceTileset = new Tileset3D(sourceTilesetJson, tilesetOptions);

    await this._createAndSaveTileset(outputPath, tilesetName);
    await this._finishConversion({slpk: Boolean(slpk), outputPath, tilesetName});
    return sourceTilesetJson;
  }

  /**
   * Convert and save the layer and embedded tiles
   * @param outputPath - path to save output data
   * @param tilesetName - new tileset path
   */
  private async _createAndSaveTileset(outputPath: string, tilesetName: string): Promise<void> {
    const tilesetPath = join(`${outputPath}`, `${tilesetName}`);
    // Removing the tilesetPath needed to exclude erroneous files after conversion
    try {
      await removeDir(tilesetPath);
    } catch (e) {
      // do nothing
    }

    this.layers0Path = join(tilesetPath, 'SceneServer', 'layers', '0');

    this._formLayers0(tilesetName);

    this.materialDefinitions = [];
    this.materialMap = new Map();

    const sourceRootTile: TileHeader = this.sourceTileset!.root!;
    const boundingVolumes = createBoundingVolumes(sourceRootTile, this.geoidHeightModel!);
    const parentId = this.nodePages.push({
      index: 0,
      lodThreshold: 0,
      obb: boundingVolumes.obb,
      children: []
    });

    const isCreateSlpk = this.options.slpk;
    const root0 = this._formRootNodeIndexDocument(boundingVolumes);

    await this._convertNodesTree(root0, sourceRootTile, parentId, boundingVolumes);

    this.layers0!.materialDefinitions = this.materialDefinitions;
    await this._writeLayers0();
    createSceneServerPath(tilesetName, this.layers0, tilesetPath);
    await this._writeNodeIndexDocument(root0, 'root', join(this.layers0Path, 'nodes', 'root'));
    await this.nodePages.save(this.layers0Path, this.fileMap, isCreateSlpk);
    await this._createSlpk(tilesetPath);
  }

  /**
   * Form object of 3DSceneLayer https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DSceneLayer.cmn.md
   * @param  tilesetName - Name of layer
   */
  private _formLayers0(tilesetName: string): void {
    const extent = convertCommonToI3SExtentCoordinate(this.sourceTileset);
    const layers0data = {
      version: `{${uuidv4().toUpperCase()}}`,
      id: 0,
      name: tilesetName,
      href: './layers/0',
      store: {
        id: `{${uuidv4().toUpperCase()}}`,
        extent
      },
      nodePages: {
        nodesPerPage: HARDCODED_NODES_PER_PAGE
      },
      compressGeometry: this.options.draco
    };

    this.layers0 = transform(layers0data, layersTemplate);
  }

  /**
   * Convert and save the layer and embedded tiles
   * @param boundingVolumes - mbs and obb data about node's bounding volume
   * @return 3DNodeIndexDocument data https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md
   */
  private _formRootNodeIndexDocument(boundingVolumes: BoundingVolumes): Node3DIndexDocument {
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
    return transform(root0data, nodeTemplate);
  }

  /**
   * Form object of 3DSceneLayer https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DSceneLayer.cmn.md
   * @param root0 - 3DNodeIndexDocument of root node https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md
   * @param sourceRootTile - Source (3DTile) tile data
   * @param parentId - node id in node pages
   * @param boundingVolumes - mbs and obb data about node's bounding volume
   */
  private async _convertNodesTree(
    root0: Node3DIndexDocument,
    sourceRootTile: TileHeader,
    parentId: number,
    boundingVolumes: BoundingVolumes
  ): Promise<void> {
    await this.sourceTileset!._loadTile(sourceRootTile);
    if (this.isContentSupported(sourceRootTile)) {
      root0.children = root0.children || [];
      root0.children.push({
        id: '1',
        href: './1',
        ...boundingVolumes
      });
      const [child] = await this._createNode(root0, sourceRootTile, parentId, 0);
      const childPath = join(this.layers0Path, 'nodes', child.path!);

      if (this.options.slpk) {
        this.fileMap['nodes/1/3dNodeIndexDocument.json.gz'] = await writeFileForSlpk(
          childPath,
          JSON.stringify(child),
          '3dNodeIndexDocument.json'
        );
      } else {
        await writeFile(childPath, JSON.stringify(child));
      }
    } else {
      await this._addChildrenWithNeighborsAndWriteFile({
        parentNode: root0,
        sourceTiles: sourceRootTile.children,
        parentId,
        level: 1
      });
    }
    await sourceRootTile.unloadContent();
  }

  /**
   * Write 3DSceneLayer https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DSceneLayer.cmn.md in file
   */
  private async _writeLayers0(): Promise<void> {
    if (this.options.slpk) {
      this.fileMap['3dSceneLayer.json.gz'] = await writeFileForSlpk(
        this.layers0Path,
        JSON.stringify(this.layers0),
        '3dSceneLayer.json'
      );
    } else {
      await writeFile(this.layers0Path, JSON.stringify(this.layers0));
    }
  }

  /**
   * Write 3DNodeIndexDocument https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md in file
   */
  private async _writeNodeIndexDocument(
    root0: Node3DIndexDocument,
    nodePath: string,
    rootPath: string
  ): Promise<void> {
    if (this.options.slpk) {
      this.fileMap[`nodes/${nodePath}/3dNodeIndexDocument.json.gz`] = await writeFileForSlpk(
        rootPath,
        JSON.stringify(root0),
        '3dNodeIndexDocument.json'
      );
    } else {
      await writeFile(rootPath, JSON.stringify(root0));
    }
  }

  /**
   * Pack files into *.slpk archive
   * @param tilesetPath - Path to save file
   */
  private async _createSlpk(tilesetPath: string): Promise<void> {
    if (this.options.slpk) {
      const slpkTilesetPath = join(tilesetPath, 'SceneServer', 'layers', '0');
      const slpkFileName = `${tilesetPath}.slpk`;
      await compressWithChildProcess(
        slpkTilesetPath,
        slpkFileName,
        0,
        '.',
        this.options.sevenZipExe
      );

      // TODO: `addFileToZip` corrupts archive so it can't be validated with windows i3s_converter.exe
      // const fileHash128Path = `${tilesetPath}/@specialIndexFileHASH128@`;
      // try {
      //   await generateHash128FromZip(slpkFileName, fileHash128Path);
      //   await addFileToZip(
      //     tilesetPath,
      //     '@specialIndexFileHASH128@',
      //     slpkFileName,
      //     this.options.sevenZipExe
      //   );
      // } catch (error) {
      //   if (error.code === FS_FILE_TOO_LARGE) {
      //     console.warn(`${slpkFileName} file is too big to generate a hash`); // eslint-disable-line
      //   } else {
      //     console.error(error); // eslint-disable-line
      //   }
      // }
      // All converted files are contained in slpk now they can be deleted
      try {
        await removeDir(tilesetPath);
      } catch (e) {
        // do nothing
      }
    }
  }

  /**
   * Add child nodes recursively and write them to files
   * @param data - arguments
   * @param data.sourceTiles - array of source child nodes
   * @param data.parentNode - 3DNodeIndexDocument of parent node for processing child nodes
   * @param data.parentId - id of parent node in node pages
   * @param data.level - level of node (distanse to root node in the tree)
   */
  private async _addChildrenWithNeighborsAndWriteFile(data: {
    parentNode: Node3DIndexDocument;
    sourceTiles: TileHeader[];
    parentId: number;
    level: number;
  }): Promise<void> {
    const childNodes = [];
    await this._addChildren({...data, childNodes});
    await this._addNeighborsAndWriteFile(data.parentNode, childNodes);
  }

  /**
   * Add child nodes recursively and write them to files
   * @param data - arguments
   * @param data.childNodes - array of target child nodes
   * @param data.sourceTiles - array of source child nodes
   * @param data.parentNode - 3DNodeIndexDocument of parent node for processing child nodes
   * @param data.parentId - id of parent node in node pages
   * @param data.level - level of node (distanse to root node in the tree)
   */
  private async _addChildren(data: {
    childNodes: NodeReference[];
    sourceTiles: TileHeader[];
    parentNode: Node3DIndexDocument;
    parentId: number;
    level: number;
  }): Promise<void> {
    const {childNodes, sourceTiles, parentNode, parentId, level} = data;
    if (this.options.maxDepth && level > this.options.maxDepth) {
      return;
    }
    for (const sourceTile of sourceTiles) {
      if (sourceTile.type === 'json') {
        await this.sourceTileset!._loadTile(sourceTile);
        await this._addChildren({
          parentNode,
          sourceTiles: sourceTile.children,
          childNodes,
          parentId,
          level: level + 1
        });
        await sourceTile.unloadContent();
      } else {
        const boundingVolumes = createBoundingVolumes(sourceTile, this.geoidHeightModel!);
        const children = await this._createNode(parentNode, sourceTile, parentId, level);
        parentNode.children = parentNode.children || [];
        for (const child of children) {
          parentNode.children.push({
            id: child.id,
            href: `../${child.path}`,
            ...boundingVolumes
          });
          childNodes.push(child);
        }
      }
      if (sourceTile.id) {
        console.log(sourceTile.id); // eslint-disable-line
      }
    }
  }

  /**
   * Add neightbors to 3DNodeIndexDocument and write it in a file
   * @param parentNode - arguments
   * @param childNodes - array of target child nodes
   */
  private async _addNeighborsAndWriteFile(
    parentNode: Node3DIndexDocument,
    childNodes: Node3DIndexDocument[]
  ): Promise<void> {
    for (const node of childNodes) {
      const childPath = join(this.layers0Path, 'nodes', node.path!);
      const nodePath = node.path;
      delete node.path;

      // Don't do large amount of "neightbors" to avoid big memory consumption
      if (Number(parentNode?.children?.length) < 1000) {
        for (const neighbor of parentNode.children || []) {
          // eslint-disable-next-line max-depth
          if (node.id === neighbor.id) {
            continue; // eslint-disable-line
          }

          if (node.neighbors) {
            node.neighbors.push({...neighbor});
          }
        }
      } else {
        // eslint-disable-next-line no-console, no-undef
        console.warn(
          `Node ${node.id}: neighbors attribute is omited because of large number of neigbors`
        );
        delete node.neighbors;
      }
      await this._writeNodeIndexDocument(node, nodePath!, childPath);
      node.neighbors = [];
    }
  }

  /**
   * Convert tile to one or more I3S nodes
   * @param parentTile - parent 3DNodeIndexDocument
   * @param sourceTile - source tile (3DTile)
   * @param parentId - id of parent node in node pages
   * @param level - level of node (distanse to root node in the tree)
   */
  private async _createNode(
    parentTile: Node3DIndexDocument,
    sourceTile: TileHeader,
    parentId: number,
    level: number
  ): Promise<Node3DIndexDocument[]> {
    if (this.validate) {
      this._checkAddRefinementTypeForTile(sourceTile);
    }

    await this._updateTilesetOptions();
    await this.sourceTileset!._loadTile(sourceTile);
    const boundingVolumes = createBoundingVolumes(sourceTile, this.geoidHeightModel!);

    const lodSelection = convertGeometricErrorToScreenThreshold(sourceTile, boundingVolumes);
    const maxScreenThresholdSQ = lodSelection.find(
      (val) => val.metricType === 'maxScreenThresholdSQ'
    ) || {maxError: 0};

    const batchTable = sourceTile?.content?.batchTableJson;

    if (batchTable) {
      this._convertAttributeStorageInfo(sourceTile.content);
    }

    const resourcesData = await this._convertResources(sourceTile);

    const nodes: Node3DIndexDocument[] = [];
    const nodesInPage: NodeInPage[] = [];
    const emptyResources = {
      geometry: null,
      compressedGeometry: null,
      texture: null,
      sharedResources: null,
      meshMaterial: null,
      vertexCount: null,
      attributes: null,
      featureCount: null
    };
    for (const resources of resourcesData || [emptyResources]) {
      const nodeInPage = this._createNodeInNodePages(
        maxScreenThresholdSQ,
        boundingVolumes,
        sourceTile,
        parentId,
        resources
      );
      const node = this._createNodeIndexDocument(
        parentTile,
        boundingVolumes,
        lodSelection,
        nodeInPage,
        resources
      );

      if (nodeInPage.mesh) {
        await this._writeResources(resources, node.path!);
      }

      if (this.validate) {
        this.boundingVolumeWarnings = validateNodeBoundingVolumes(node);

        if (this.boundingVolumeWarnings && this.boundingVolumeWarnings.length) {
          console.warn('Bounding Volume Warnings: ', ...this.boundingVolumeWarnings); //eslint-disable-line
        }
      }

      nodes.push(node);
      nodesInPage.push(nodeInPage);
    }

    sourceTile.unloadContent();

    await this._addChildrenWithNeighborsAndWriteFile({
      parentNode: nodes[0],
      sourceTiles: sourceTile.children,
      parentId: nodesInPage[0].index!,
      level: level + 1
    });
    return nodes;
  }

  /**
   * Convert attributesStorageInfo https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
   * from B3DM batch table
   * @param sourceTileContent - tile content of 3DTile
   * @return {void}
   */
  private _convertAttributeStorageInfo(sourceTileContent: B3DMContent): void {
    // In legacy b3dm files sometimes sourceTileContent is null.
    const batchTable = sourceTileContent && sourceTileContent.batchTableJson;
    if (batchTable && !this.layers0?.attributeStorageInfo?.length) {
      this._convertBatchTableInfoToNodeAttributes(batchTable);
    }
  }

  /**
   * Convert tile to one or more I3S nodes
   * @param sourceTile - source tile (3DTile)
   * result.geometry - ArrayBuffer with geometry attributes
   * result.compressedGeometry - ArrayBuffer with compressed (draco) geometry
   * result.texture - texture image
   * result.sharedResources - shared resource data object
   * result.meshMaterial - PBR-like material object
   * result.vertexCount - number of vertices in geometry
   * result.attributes - feature attributes
   * result.featureCount - number of features
   */
  private async _convertResources(sourceTile: TileHeader): Promise<I3SGeometry[] | null> {
    if (!this.isContentSupported(sourceTile)) {
      return null;
    }
    const resourcesData = await convertB3dmToI3sGeometry(
      sourceTile.content,
      Number(this.nodePages.nodesCounter),
      this.featuresHashArray,
      this.layers0?.attributeStorageInfo,
      this.options.draco
    );
    return resourcesData;
  }

  /**
   * Create a new node object (https://github.com/Esri/i3s-spec/blob/master/docs/1.7/node.cmn.md)
   * in node pages (https://github.com/Esri/i3s-spec/blob/master/docs/1.7/nodePage.cmn.md)
   * @param maxScreenThresholdSQ - Level of Details (LOD) metric
   * @param boundingVolumes - Bounding volumes
   * @param sourceTile - source tile (3DTile)
   * @param parentId - id of parent node in node pages
   * @param resources - the node resources data
   * @param resources.meshMaterial - PBR-like material object
   * @param resources.texture - texture image
   * @param resources.vertexCount - number of vertices in geometry
   * @param resources.featureCount - number of features
   * @return the node object in node pages
   */
  private _createNodeInNodePages(
    maxScreenThresholdSQ: MaxScreenThresholdSQ,
    boundingVolumes: BoundingVolumes,
    sourceTile: TileHeader,
    parentId: number,
    resources: I3SGeometry
  ): NodeInPage {
    const {meshMaterial, texture, vertexCount, featureCount, geometry} = resources;
    const nodeInPage: NodeInPage = {
      index: 0,
      lodThreshold: maxScreenThresholdSQ.maxError,
      obb: boundingVolumes.obb,
      children: []
    };
    if (geometry && this.isContentSupported(sourceTile)) {
      nodeInPage.mesh = {
        geometry: {
          definition: texture ? 0 : 1,
          resource: 0
        },
        attribute: {
          resource: 0
        },
        material: {
          definition: 0
        }
      };
    }
    const nodeId = this.nodePages.push(nodeInPage, parentId);

    if (meshMaterial) {
      this.nodePages.updateMaterialByNodeId(nodeId, this._findOrCreateMaterial(meshMaterial));
    }

    if (texture) {
      const texelCountHint = texture.image.height * texture.image.width;
      this.nodePages.updateTexelCountHintByNodeId(nodeId, texelCountHint);
    }

    if (vertexCount) {
      this.vertexCounter += vertexCount;
      this.nodePages.updateVertexCountByNodeId(nodeId, vertexCount);
    }
    this.nodePages.updateNodeAttributeByNodeId(nodeId);
    if (featureCount) {
      this.nodePages.updateFeatureCountByNodeId(nodeId, featureCount);
    }

    return nodeInPage;
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
  private _createNodeIndexDocument(
    parentNode: Node3DIndexDocument,
    boundingVolumes: BoundingVolumes,
    lodSelection: LodSelection[],
    nodeInPage: NodeInPage,
    resources: I3SGeometry
  ): Node3DIndexDocument {
    const {texture, attributes} = resources;
    const nodeId = nodeInPage.index!;
    const nodeData = {
      version: parentNode.version,
      id: nodeId.toString(),
      path: nodeId.toString(),
      level: parentNode.level! + 1,
      ...boundingVolumes,
      lodSelection,
      parentNode: {
        id: parentNode.id,
        href: `../${parentNode.id}`,
        mbs: parentNode.mbs,
        obb: parentNode.obb
      },
      children: [],
      neighbors: []
    };
    const node = transform(nodeData, nodeTemplate);

    if (nodeInPage.mesh) {
      node.geometryData = [{href: './geometries/0'}];
      node.sharedResource = {href: './shared'};

      if (texture) {
        node.textureData = [{href: './textures/0'}, {href: './textures/1'}];
      }

      if (attributes && attributes.length && this.layers0?.attributeStorageInfo?.length) {
        node.attributeData = [];
        for (let index = 0; index < attributes.length; index++) {
          const folderName = this.layers0.attributeStorageInfo[index].key;
          node.attributeData.push({href: `./attributes/${folderName}/0`});
        }
      }
    }

    return node;
  }

  /**
   * Write node resources in files
   * @param resources - source tile (3DTile)
   * @param resources.geometry - Uint8Array with geometry attributes
   * @param resources.compressedGeometry - Uint8Array with compressed (draco) geometry
   * @param resources.texture - texture image
   * @param resources.sharedResources - shared resource data object
   * @param resources.attributes - feature attributes
   * @return {Promise<void>}
   */
  private async _writeResources(resources: I3SGeometry, nodePath: string): Promise<void> {
    const {
      geometry: geometryBuffer,
      compressedGeometry,
      texture,
      sharedResources,
      attributes
    } = resources;
    const childPath = join(this.layers0Path, 'nodes', nodePath);
    const slpkChildPath = join('nodes', nodePath);

    await this._writeGeometries(geometryBuffer!, compressedGeometry!, childPath, slpkChildPath);
    await this._writeShared(sharedResources!, childPath, slpkChildPath, nodePath);
    await this._writeTexture(texture, childPath, slpkChildPath);
    await this._writeAttributes(attributes, childPath, slpkChildPath);
  }

  /**
   * Write non-compressed and compressed geometries in files
   * @param geometryBuffer - Uint8Array with geometry attributes
   * @param compressedGeometry - Uint8Array with compressed (draco) geometry
   * @param childPath - a child path to write resources
   * @param slpkChildPath - resource path inside *slpk file
   */
  private async _writeGeometries(
    geometryBuffer: ArrayBuffer,
    compressedGeometry: ArrayBuffer,
    childPath: string,
    slpkChildPath: string
  ): Promise<void> {
    if (this.options.slpk) {
      const slpkGeometryPath = join(childPath, 'geometries');
      this.fileMap[`${slpkChildPath}/geometries/0.bin.gz`] = await writeFileForSlpk(
        slpkGeometryPath,
        geometryBuffer,
        '0.bin'
      );
    } else {
      const geometryPath = join(childPath, 'geometries/0/');
      await writeFile(geometryPath, geometryBuffer, 'index.bin');
    }

    if (this.options.draco) {
      if (this.options.slpk) {
        const slpkCompressedGeometryPath = join(childPath, 'geometries');
        this.fileMap[`${slpkChildPath}/geometries/1.bin.gz`] = await writeFileForSlpk(
          slpkCompressedGeometryPath,
          compressedGeometry,
          '1.bin'
        );
      } else {
        const compressedGeometryPath = join(childPath, 'geometries/1/');
        await writeFile(compressedGeometryPath, compressedGeometry, 'index.bin');
      }
    }
  }

  /**
   * Write shared resources in a file
   * @param sharedResources - shared resource data object
   * @param childPath - a child path to write resources
   * @param slpkChildPath - resource path inside *slpk file
   * @param nodePath - a node path
   */
  private async _writeShared(
    sharedResources: SharedResources,
    childPath: string,
    slpkChildPath: string,
    nodePath: string
  ): Promise<void> {
    sharedResources.nodePath = nodePath;
    const sharedData = transform(sharedResources, SHARED_RESOURCES_TEMPLATE);
    const sharedDataStr = JSON.stringify(sharedData);
    if (this.options.slpk) {
      const slpkSharedPath = join(childPath, 'shared');
      this.fileMap[`${slpkChildPath}/shared/sharedResource.json.gz`] = await writeFileForSlpk(
        slpkSharedPath,
        sharedDataStr,
        'sharedResource.json'
      );
    } else {
      const sharedPath = join(childPath, 'shared/');
      await writeFile(sharedPath, sharedDataStr);
    }
  }

  /**
   * Write the texture image in a file
   * @param texture - the texture image
   * @param childPath - a child path to write resources
   * @param slpkChildPath - the resource path inside *slpk file
   */
  private async _writeTexture(
    texture: GLTFImagePostprocessed,
    childPath: string,
    slpkChildPath: string
  ): Promise<void> {
    if (texture) {
      const format = this._getFormatByMimeType(texture?.mimeType);
      if (!this.layers0!.textureSetDefinitions!.length) {
        this.layers0!.textureSetDefinitions!.push({
          formats: [
            {
              name: '0',
              format
            },
            {
              name: '1',
              format: 'ktx2'
            }
          ]
        });
      }

      let textureData;
      let ktx2TextureData;

      if (texture.mimeType === 'image/ktx2') {
        ktx2TextureData = texture.bufferView!.data;
        textureData = new Uint8Array(await encode(texture.image!.data[0], ImageWriter));
      } else {
        textureData = texture.bufferView!.data;
        ktx2TextureData = new Uint8Array(
          await encode(texture.image, KTX2BasisUniversalTextureWriter)
        );
      }

      if (this.options.slpk) {
        const slpkTexturePath = join(childPath, 'textures');
        const compress = false;

        this.fileMap[`${slpkChildPath}/textures/0.${format}`] = await writeFileForSlpk(
          slpkTexturePath,
          textureData,
          `0.${format}`,
          compress
        );

        this.fileMap[`${slpkChildPath}/textures/1.ktx2`] = await writeFileForSlpk(
          slpkTexturePath,
          ktx2TextureData,
          `1.ktx2`,
          compress
        );
      } else {
        const texturePath = join(childPath, 'textures/0/');
        await writeFile(texturePath, textureData, `index.${format}`);

        const ktx2TexturePath = join(childPath, 'textures/1/');
        await writeFile(ktx2TexturePath, ktx2TextureData, `index.ktx2`);
      }
    }
  }

  /**
   * Write feature attributes in files
   * @param attributes - feature attributes
   * @param childPath - a child path to write resources
   * @param slpkChildPath - the resource path inside *slpk file
   */
  private async _writeAttributes(
    attributes: ArrayBuffer[],
    childPath: string,
    slpkChildPath: string
  ): Promise<void> {
    if (attributes.length && this.layers0?.attributeStorageInfo?.length) {
      for (let index = 0; index < attributes.length; index++) {
        const folderName = this.layers0.attributeStorageInfo[index].key;
        const fileBuffer = new Uint8Array(attributes[index]);

        if (this.options.slpk) {
          const slpkAttributesPath = join(childPath, 'attributes', folderName);
          this.fileMap[`${slpkChildPath}/attributes/${folderName}.bin.gz`] = await writeFileForSlpk(
            slpkAttributesPath,
            fileBuffer,
            '0.bin'
          );
        } else {
          const attributesPath = join(childPath, `attributes/${folderName}/0`);
          await writeFile(attributesPath, fileBuffer, 'index.bin');
        }
      }
    }
  }

  /**
   * Return file format by its MIME type
   * @param mimeType - feature attributes
   */
  private _getFormatByMimeType(mimeType: string | undefined): 'jpg' | 'png' {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      default:
        return 'jpg';
    }
  }

  /**
   * Find or create material in materialDefinitions array
   * @param material - end-to-end index of the node
   * @return material id
   */
  private _findOrCreateMaterial(material: I3SMaterialDefinition): number {
    const hash = md5(JSON.stringify(material));
    if (this.materialMap.has(hash)) {
      return this.materialMap.get(hash);
    }
    const newMaterialId = this.materialDefinitions.push(material) - 1;
    this.materialMap.set(hash, newMaterialId);
    return newMaterialId;
  }

  /**
   * Generate storage attribute for map segmentation.
   * @param attributeIndex - order index of attribute (f_0, f_1 ...).
   * @param key - attribute key from batch table.\
   * @param attributeType - attribute type.
   * @return Updated storageAttribute.
   */
  private _createdStorageAttribute(
    attributeIndex: number,
    key: string,
    attributeType: Attribute
  ): AttributeStorageInfo {
    const storageAttribute = {
      key: `f_${attributeIndex}`,
      name: key,
      ordering: ['attributeValues'],
      header: [{property: 'count', valueType: 'UInt32'}],
      attributeValues: {valueType: 'Int32', valuesPerElement: 1}
    };

    switch (attributeType) {
      case OBJECT_ID_TYPE:
        this._setupIdAttribute(storageAttribute);
        break;
      case STRING_TYPE:
        this._setupStringAttribute(storageAttribute);
        break;
      case DOUBLE_TYPE:
        this._setupDoubleAttribute(storageAttribute);
        break;
      case SHORT_INT_TYPE:
        break;
      default:
        this._setupStringAttribute(storageAttribute);
    }

    return storageAttribute;
  }

  /**
   * Get the attribute type for attributeStorageInfo https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
   * @param key - attribute's key
   * @param attribute - attribute's type in batchTable
   */
  private getAttributeType(key: string, attribute: string): string {
    if (key === OBJECT_ID_TYPE) {
      return OBJECT_ID_TYPE;
    }
    if (typeof attribute === STRING_TYPE) {
      return STRING_TYPE;
    } else if (typeof attribute === 'number') {
      return Number.isInteger(attribute) ? SHORT_INT_TYPE : DOUBLE_TYPE;
    }
    return STRING_TYPE;
  }

  /**
   * Setup storage attribute as string.
   * @param storageAttribute - attribute for map segmentation.
   */
  private _setupStringAttribute(storageAttribute: AttributeStorageInfo): void {
    storageAttribute.ordering!.unshift('attributeByteCounts');
    storageAttribute.header.push({property: 'attributeValuesByteCount', valueType: 'UInt32'});
    storageAttribute.attributeValues = {
      valueType: 'String',
      encoding: 'UTF-8',
      valuesPerElement: 1
    };
    storageAttribute.attributeByteCounts = {
      valueType: 'UInt32',
      valuesPerElement: 1
    };
  }

  /**
   * Setup Id attribute for map segmentation.
   * @param storageAttribute - attribute for map segmentation .
   */
  private _setupIdAttribute(storageAttribute: AttributeStorageInfo): void {
    storageAttribute.attributeValues = {
      valueType: 'Oid32',
      valuesPerElement: 1
    };
  }

  /**
   * Setup double attribute for map segmentation.
   * @param storageAttribute - attribute for map segmentation .
   */
  private _setupDoubleAttribute(storageAttribute: AttributeStorageInfo): void {
    storageAttribute.attributeValues = {
      valueType: 'Float64',
      valuesPerElement: 1
    };
  }

  /**
   * Setup field attribute for map segmentation.
   * @param key - attribute for map segmentation.
   * @param fieldAttributeType - esri attribute type ('esriFieldTypeString' or 'esriFieldTypeOID').
   */
  private _createFieldAttribute(key: string, fieldAttributeType: ESRIField): Field {
    return {
      name: key,
      type: fieldAttributeType,
      alias: key
    };
  }

  /**
   * Do conversion of 3DTiles batch table to I3s node attributes.
   * @param batchTable - Table with layer meta data.
   */
  private _convertBatchTableInfoToNodeAttributes(batchTable: BatchTableJson): void {
    let attributeIndex = 0;
    const batchTableWithObjectId = {
      OBJECTID: [0],
      ...batchTable
    };

    for (const key in batchTableWithObjectId) {
      const firstAttribute = batchTableWithObjectId[key][0];
      const attributeType = this.getAttributeType(key, firstAttribute);

      const storageAttribute = this._createdStorageAttribute(attributeIndex, key, attributeType);
      const fieldAttributeType = this._getFieldAttributeType(attributeType);
      const fieldAttribute = this._createFieldAttribute(key, fieldAttributeType);
      const popupInfo = this._createPopupInfo(batchTableWithObjectId);

      this.layers0!.attributeStorageInfo!.push(storageAttribute);
      this.layers0!.fields!.push(fieldAttribute);
      this.layers0!.popupInfo = popupInfo;
      this.layers0!.layerType = _3D_OBJECT_LAYER_TYPE;

      attributeIndex += 1;
    }
  }

  /**
   * Find and return attribute type based on key form Batch table.
   * @param attributeType
   */
  private _getFieldAttributeType(attributeType: Attribute): ESRIField {
    switch (attributeType) {
      case OBJECT_ID_TYPE:
        return 'esriFieldTypeOID';
      case STRING_TYPE:
        return 'esriFieldTypeString';
      case SHORT_INT_TYPE:
        return 'esriFieldTypeInteger';
      case DOUBLE_TYPE:
        return 'esriFieldTypeDouble';
      default:
        return 'esriFieldTypeString';
    }
  }

  /**
   * Generate popup info to show metadata on the map.
   * @param batchTable - Batch table data with OBJECTID.
   * @return data for correct rendering of popup.
   */
  private _createPopupInfo(batchTable: BatchTableJson): PopupInfo {
    const title = '{OBJECTID}';
    const mediaInfos = [];
    const fieldInfos: FieldInfo[] = [];
    const popupElements: {
      fieldInfos: FieldInfo[];
      type: string;
    }[] = [];
    const expressionInfos = [];

    for (const key in batchTable) {
      fieldInfos.push({
        fieldName: key,
        visible: true,
        isEditable: false,
        label: key
      });
    }
    popupElements.push({
      fieldInfos,
      type: 'fields'
    });

    return {
      title,
      mediaInfos,
      popupElements,
      fieldInfos,
      expressionInfos
    };
  }

  /**
   * Print statistics in the end of conversion
   * @param params - output files data
   */
  private async _finishConversion(params: {
    slpk: boolean;
    outputPath: string;
    tilesetName: string;
  }): Promise<void> {
    const {tilesCount, tilesWithAddRefineCount} = this.refinementCounter;
    const addRefinementPercentage = tilesWithAddRefineCount
      ? (tilesWithAddRefineCount / tilesCount) * 100
      : 0;
    const filesSize = await calculateFilesSize(params);
    const diff = process.hrtime(this.conversionStartTime);
    const conversionTime = timeConverter(diff);
    console.log(`------------------------------------------------`); // eslint-disable-line no-undef, no-console
    console.log(`Finishing conversion of ${_3D_TILES}`); // eslint-disable-line no-undef, no-console
    console.log(`Total conversion time: ${conversionTime}`); // eslint-disable-line no-undef, no-console
    console.log(`Vertex count: `, this.vertexCounter); // eslint-disable-line no-undef, no-console
    console.log(`File(s) size: `, filesSize, ' bytes'); // eslint-disable-line no-undef, no-console
    console.log(`Percentage of tiles with "ADD" refinement type:`, addRefinementPercentage, '%'); // eslint-disable-line no-undef, no-console
    console.log(`------------------------------------------------`); // eslint-disable-line no-undef, no-console
  }

  /**
   * Fetch preload options for ION tileset
   */
  private async _fetchPreloadOptions(): Promise<any> {
    if (!this.Loader.preload) {
      return {};
    }
    const options = {
      'cesium-ion': {accessToken: this.options.token || ION_DEFAULT_TOKEN}
    };
    const preloadOptions = await this.Loader.preload(this.options.inputUrl, options);
    this.refreshTokenTime = process.hrtime();
    return {...options, ...preloadOptions};
  }

  /**
   * Update options of source tileset
   */
  private async _updateTilesetOptions(): Promise<void> {
    const diff = process.hrtime(this.refreshTokenTime);
    if (diff[0] < REFRESH_TOKEN_TIMEOUT) {
      return;
    }
    this.refreshTokenTime = process.hrtime();

    const preloadOptions = await this._fetchPreloadOptions();
    this.sourceTileset!.options = {...this.sourceTileset!.options, ...preloadOptions};
    if (preloadOptions.headers) {
      this.sourceTileset!.loadOptions.fetch = {
        ...this.sourceTileset!.loadOptions.fetch,
        headers: preloadOptions.headers
      };
      console.log('Authorization Bearer token has been updated'); // eslint-disable-line no-undef, no-console
    }
  }

  /** Do calculations of all tiles and tiles with "ADD" type of refinement.
   * @param tile
   */
  private _checkAddRefinementTypeForTile(tile: TileHeader): void {
    const ADD_TILE_REFINEMENT = 1;

    if (tile.refine === ADD_TILE_REFINEMENT) {
      this.refinementCounter.tilesWithAddRefineCount += 1;
      console.warn('This tile uses "ADD" type of refinement'); // eslint-disable-line
    }

    this.refinementCounter.tilesCount += 1;
  }
  /**
   * Check if the tile's content format is supported by the converter
   * @param sourceRootTile
   * @returns
   */
  private isContentSupported(sourceRootTile: Tile3D): boolean {
    return ['b3dm', 'glTF'].includes(sourceRootTile?.content?.type);
  }
}
