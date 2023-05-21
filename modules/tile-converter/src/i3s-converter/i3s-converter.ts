// loaders.gl, MIT license

import type {Tileset3DProps} from '@loaders.gl/tiles';
import type {FeatureTableJson} from '@loaders.gl/3d-tiles';
import type {WriteQueueItem} from '../lib/utils/write-queue';
import type {
  SceneLayer3D,
  BoundingVolumes,
  MaxScreenThresholdSQ,
  NodeInPage
} from '@loaders.gl/i3s';
import {load, encode, fetchFile, getLoaderOptions, isBrowser} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {CesiumIonLoader, Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Geoid} from '@math.gl/geoid';
import {join} from 'path';
import {v4 as uuidv4} from 'uuid';
import process from 'process';
import transform from 'json-map-transform';
import md5 from 'md5';

import NodePages from './helpers/node-pages';
import {writeFile, removeDir, writeFileForSlpk, removeFile} from '../lib/utils/file-utils';
import {
  compressFileWithGzip,
  compressWithChildProcess
  // generateHash128FromZip,
  // addFileToZip
} from '../lib/utils/compress-util';
import {calculateFilesSize, timeConverter} from '../lib/utils/statistic-utills';
import convertB3dmToI3sGeometry, {getPropertyTable} from './helpers/geometry-converter';
import {
  createBoundingVolumes,
  convertBoundingVolumeToI3SFullExtent
} from './helpers/coordinate-converter';
import {createSceneServerPath} from './helpers/create-scene-server-path';
import {convertGeometricErrorToScreenThreshold} from '../lib/utils/lod-conversion-utils';
import {PGMLoader} from '../pgm-loader';

import {LAYERS as layersTemplate} from './json-templates/layers';
import {GEOMETRY_DEFINITION as geometryDefinitionTemlate} from './json-templates/geometry-definitions';
import {SHARED_RESOURCES as sharedResourcesTemplate} from './json-templates/shared-resources';
import {validateNodeBoundingVolumes} from './helpers/node-debug';
// loaders.gl, MIT license

import {Tile3D} from '@loaders.gl/tiles';
import {KTX2BasisWriterWorker} from '@loaders.gl/textures';
import {LoaderWithParser} from '@loaders.gl/loader-utils';
import {I3SMaterialDefinition, TextureSetDefinitionFormats} from '@loaders.gl/i3s/src/types';
import {ImageWriter} from '@loaders.gl/images';
import {GLTFImagePostprocessed} from '@loaders.gl/gltf';
import {I3SConvertedResources, SharedResourcesArrays} from './types';
import {getWorkerURL, WorkerFarm} from '@loaders.gl/worker-utils';
import {DracoWriterWorker} from '@loaders.gl/draco';
import WriteQueue from '../lib/utils/write-queue';
import {I3SAttributesWorker} from '../i3s-attributes-worker';
import {BROWSER_ERROR_MESSAGE} from '../constants';
import {
  createdStorageAttribute,
  createFieldAttribute,
  createPopupInfo,
  getAttributeType,
  getFieldAttributeType
} from './helpers/feature-attributes';
import {NodeIndexDocument} from './helpers/node-index-document';

const ION_DEFAULT_TOKEN =
  process.env?.IonToken || // eslint-disable-line
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ'; // eslint-disable-line
const HARDCODED_NODES_PER_PAGE = 64;
const _3D_TILES = '3DTILES';
const _3D_OBJECT_LAYER_TYPE = '3DObject';
const REFRESH_TOKEN_TIMEOUT = 1800; // 30 minutes in seconds
const CESIUM_DATASET_PREFIX = 'https://';
// const FS_FILE_TOO_LARGE = 'ERR_FS_FILE_TOO_LARGE';

/**
 * Converter from 3d-tiles tileset to i3s layer
 */
export default class I3SConverter {
  nodePages: NodePages;
  options: any;
  layers0Path: string;
  materialMap: Map<string, number>;
  materialDefinitions: I3SMaterialDefinition[];
  geometryMap: Map<string, number>;
  geometryConfigs: {hasTexture: boolean; hasUvRegions: boolean}[];
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
  geoidHeightModel: Geoid | null = null;
  Loader: LoaderWithParser = Tiles3DLoader;
  generateTextures: boolean;
  generateBoundingVolumes: boolean;
  layersHasTexture: boolean;
  workerSource: {[key: string]: string} = {};
  writeQueue: WriteQueue<WriteQueueItem> = new WriteQueue();
  compressList: string[] | null = null;

  constructor() {
    this.nodePages = new NodePages(writeFile, HARDCODED_NODES_PER_PAGE, this);
    this.options = {};
    this.layers0Path = '';
    this.materialMap = new Map();
    this.materialDefinitions = [];
    this.geometryMap = new Map();
    this.geometryConfigs = [];
    this.vertexCounter = 0;
    this.layers0 = null;
    this.featuresHashArray = [];
    this.refinementCounter = {
      tilesCount: 0,
      tilesWithAddRefineCount: 0
    };
    this.validate = false;
    this.generateTextures = false;
    this.generateBoundingVolumes = false;
    this.layersHasTexture = false;
    this.compressList = null;
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
   * @param options.generateTextures - generate alternative type of textures (to have non-compressed jpeg/png and compressed ktx2)
   * @param options.generateBoundingVolumes - generate bounding volumes from vertices coordinates instead of source tiles bounding volumes
   * @param options.instantNodeWriting - Keep created 3DNodeIndexDocument files on disk instead of memory. This option reduce memory usage but decelerates conversion speed
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
    mergeMaterials?: boolean;
    validate?: boolean;
    generateTextures?: boolean;
    generateBoundingVolumes?: boolean;
    instantNodeWriting?: boolean;
  }): Promise<any> {
    if (isBrowser) {
      console.log(BROWSER_ERROR_MESSAGE);
      return BROWSER_ERROR_MESSAGE;
    }
    this.conversionStartTime = process.hrtime();
    const {
      tilesetName,
      slpk,
      egmFilePath,
      inputUrl,
      validate,
      outputPath,
      draco = true,
      sevenZipExe,
      maxDepth,
      token,
      generateTextures,
      generateBoundingVolumes,
      instantNodeWriting = false,
      mergeMaterials = true
    } = options;
    this.options = {
      maxDepth,
      slpk,
      sevenZipExe,
      egmFilePath,
      draco,
      token,
      inputUrl,
      instantNodeWriting,
      mergeMaterials
    };
    this.compressList = (this.options.instantNodeWriting && []) || null;
    this.validate = Boolean(validate);
    this.Loader = inputUrl.indexOf(CESIUM_DATASET_PREFIX) !== -1 ? CesiumIonLoader : Tiles3DLoader;
    this.generateTextures = Boolean(generateTextures);
    this.generateBoundingVolumes = Boolean(generateBoundingVolumes);

    this.writeQueue = new WriteQueue();
    this.writeQueue.startListening();

    console.log('Loading egm file...'); // eslint-disable-line
    this.geoidHeightModel = await load(egmFilePath, PGMLoader);
    console.log('Loading egm file completed!'); // eslint-disable-line

    if (slpk) {
      this.nodePages.useWriteFunction(writeFileForSlpk);
    }

    await this.loadWorkers();

    try {
      const preloadOptions = await this._fetchPreloadOptions();
      const tilesetOptions: Tileset3DProps = {
        loadOptions: {
          _nodeWorkers: true,
          reuseWorkers: true,
          basis: {format: 'rgba32'}
          // TODO - should no longer be needed with new Node workers
          // 'basis-nodejs': {
          //   format: 'rgba32',
          //   workerUrl: './modules/textures/dist/basis-worker-node.js'
          // },
          // 'draco-nodejs': {workerUrl: './modules/draco/dist/draco-worker-node.js'}
        }
      };
      if (preloadOptions.headers) {
        tilesetOptions.loadOptions!.fetch = {headers: preloadOptions.headers};
      }
      Object.assign(tilesetOptions, preloadOptions);
      const sourceTilesetJson = await load(inputUrl, this.Loader, tilesetOptions.loadOptions);
      // console.log(tilesetJson); // eslint-disable-line
      this.sourceTileset = new Tileset3D(sourceTilesetJson, tilesetOptions);

      await this._createAndSaveTileset(
        outputPath,
        tilesetName,
        sourceTilesetJson?.root?.boundingVolume?.region
      );
      await this._finishConversion({slpk: Boolean(slpk), outputPath, tilesetName});
      return sourceTilesetJson;
    } catch (error) {
      throw error;
    } finally {
      // Clean up worker pools
      const workerFarm = WorkerFarm.getWorkerFarm({});
      workerFarm.destroy();
    }
  }

  /**
   * Convert and save the layer and embedded tiles
   * @param outputPath - path to save output data
   * @param tilesetName - new tileset path
   */
  private async _createAndSaveTileset(
    outputPath: string,
    tilesetName: string,
    boundingVolumeRegion?: number[]
  ): Promise<void> {
    const tilesetPath = join(`${outputPath}`, `${tilesetName}`);
    // Removing the tilesetPath needed to exclude erroneous files after conversion
    try {
      await removeDir(tilesetPath);
    } catch (e) {
      // do nothing
    }

    this.layers0Path = join(tilesetPath, 'SceneServer', 'layers', '0');

    this._formLayers0(tilesetName, boundingVolumeRegion);

    this.materialDefinitions = [];
    this.materialMap = new Map();

    const sourceRootTile: Tile3D = this.sourceTileset!.root!;
    const boundingVolumes = createBoundingVolumes(sourceRootTile, this.geoidHeightModel!);
    await this.nodePages.push({
      index: 0,
      lodThreshold: 0,
      obb: boundingVolumes.obb,
      children: []
    });

    const rootNode = await NodeIndexDocument.createRootNode(boundingVolumes, this);
    await this._convertNodesTree(rootNode, sourceRootTile);

    this.layers0!.materialDefinitions = this.materialDefinitions;
    // @ts-ignore
    this.layers0.geometryDefinitions = transform(
      this.geometryConfigs.map((config) => ({
        geometryConfig: {...config, draco: this.options.draco}
      })),
      geometryDefinitionTemlate()
    );

    if (this.layersHasTexture === false) {
      this.layers0!.store.defaultGeometrySchema.ordering =
        this.layers0!.store.defaultGeometrySchema.ordering.filter(
          (attribute) => attribute !== 'uv0'
        );
    }

    await this._writeLayers0();
    createSceneServerPath(tilesetName, this.layers0!, tilesetPath);
    for (const filePath of this.compressList || []) {
      await compressFileWithGzip(filePath);
      await removeFile(filePath);
    }
    await this.nodePages.save();
    await this.writeQueue.finalize();
    await this._createSlpk(tilesetPath);
  }

  /**
   * Form object of 3DSceneLayer https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DSceneLayer.cmn.md
   * @param  tilesetName - Name of layer
   */
  private _formLayers0(tilesetName: string, boundingVolumeRegion?: number[]): void {
    const fullExtent = convertBoundingVolumeToI3SFullExtent(
      this.sourceTileset?.boundingVolume || this.sourceTileset?.root?.boundingVolume
    );
    if (boundingVolumeRegion) {
      fullExtent.zmin = boundingVolumeRegion[4];
      fullExtent.zmax = boundingVolumeRegion[5];
    }
    const extent = [fullExtent.xmin, fullExtent.ymin, fullExtent.xmax, fullExtent.ymax];
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
      compressGeometry: this.options.draco,
      fullExtent
    };
    this.layers0 = transform(layers0data, layersTemplate());
  }

  /**
   * Form object of 3DSceneLayer https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DSceneLayer.cmn.md
   * @param rootNode - 3DNodeIndexDocument of root node https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md
   * @param sourceRootTile - Source (3DTile) tile data
   */
  private async _convertNodesTree(
    rootNode: NodeIndexDocument,
    sourceRootTile: Tile3D
  ): Promise<void> {
    await this.sourceTileset!._loadTile(sourceRootTile);
    if (this.isContentSupported(sourceRootTile)) {
      const childNodes = await this._createNode(rootNode, sourceRootTile, 0);
      for (const childNode of childNodes) {
        await childNode.save();
      }
      await rootNode.addChildren(childNodes);
    } else {
      await this._addChildrenWithNeighborsAndWriteFile({
        parentNode: rootNode,
        sourceTiles: sourceRootTile.children,
        level: 1
      });
    }
    await sourceRootTile.unloadContent();
    await rootNode.save();
  }

  /**
   * Write 3DSceneLayer https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DSceneLayer.cmn.md in file
   */
  private async _writeLayers0(): Promise<void> {
    if (this.options.slpk) {
      await this.writeQueue.enqueue({
        archiveKey: '3dSceneLayer.json.gz',
        writePromise: () =>
          writeFileForSlpk(this.layers0Path, JSON.stringify(this.layers0), '3dSceneLayer.json')
      });
    } else {
      await this.writeQueue.enqueue({
        writePromise: () => writeFile(this.layers0Path, JSON.stringify(this.layers0))
      });
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
   * @param data.parentNode - 3DNodeIndexDocument of parent node
   * @param data.sourceTiles - array of source child nodes
   * @param data.level - level of node (distanse to root node in the tree)
   */
  private async _addChildrenWithNeighborsAndWriteFile(data: {
    parentNode: NodeIndexDocument;
    sourceTiles: Tile3D[];
    level: number;
  }): Promise<void> {
    await this._addChildren(data);
    await data.parentNode.addNeighbors();
  }

  /**
   * Convert nested subtree of 3DTiles dataset
   * @param param0
   * @param data.parentNode - 3DNodeIndexDocument of parent node
   * @param param0.sourceTile - source 3DTile data
   * @param param0.level - tree level
   */
  private async convertNestedTileset({
    parentNode,
    sourceTile,
    level
  }: {
    parentNode: NodeIndexDocument;
    sourceTile: Tile3D;
    level: number;
  }) {
    await this.sourceTileset!._loadTile(sourceTile);
    await this._addChildren({
      parentNode,
      sourceTiles: sourceTile.children,
      level: level + 1
    });
    await sourceTile.unloadContent();
  }

  /**
   * Convert 3DTiles tile to I3S node
   * @param param0
   * @param param0.parentNode - 3DNodeIndexDocument of parent node
   * @param param0.sourceTile - source 3DTile data
   * @param param0.level - tree level
   */
  private async convertNode({
    parentNode,
    sourceTile,
    level
  }: {
    parentNode: NodeIndexDocument;
    sourceTile: Tile3D;
    level: number;
  }) {
    const childNodes = await this._createNode(parentNode, sourceTile, level);
    await parentNode.addChildren(childNodes);
  }

  /**
   * Add child nodes recursively and write them to files
   * @param param0 - arguments
   * @param param0.parentNode - 3DNodeIndexDocument of parent node
   * @param param0.sourceTile - source 3DTile data
   * @param param0.level - tree level
   */
  private async _addChildren(data: {
    parentNode: NodeIndexDocument;
    sourceTiles: Tile3D[];
    level: number;
  }): Promise<void> {
    const {sourceTiles, parentNode, level} = data;
    if (this.options.maxDepth && level > this.options.maxDepth) {
      return;
    }
    for (const sourceTile of sourceTiles) {
      if (sourceTile.type === 'json') {
        await this.convertNestedTileset({parentNode, sourceTile, level});
      } else {
        await this.convertNode({parentNode, sourceTile, level});
      }
      if (sourceTile.id) {
        console.log(sourceTile.id); // eslint-disable-line
      }
    }
  }

  /**
   * Convert tile to one or more I3S nodes
   * @param parentNode - 3DNodeIndexDocument of parent node
   * @param sourceTile - source 3DTile data
   * @param level - tree level
   */
  private async _createNode(
    parentNode: NodeIndexDocument,
    sourceTile: Tile3D,
    level: number
  ): Promise<NodeIndexDocument[]> {
    this._checkAddRefinementTypeForTile(sourceTile);

    await this._updateTilesetOptions();
    await this.sourceTileset!._loadTile(sourceTile);

    let boundingVolumes = createBoundingVolumes(sourceTile, this.geoidHeightModel!);

    const propertyTable = getPropertyTable(sourceTile.content);

    if (propertyTable && !this.layers0?.attributeStorageInfo?.length) {
      this._convertPropertyTableToNodeAttributes(propertyTable);
    }

    const resourcesData = await this._convertResources(
      sourceTile,
      parentNode.inPageId,
      propertyTable
    );

    const nodes: NodeIndexDocument[] = [];
    const nodeIds: number[] = [];
    const nodesInPage: NodeInPage[] = [];
    const emptyResources = {
      geometry: null,
      compressedGeometry: null,
      texture: null,
      hasUvRegions: false,
      sharedResources: null,
      meshMaterial: null,
      vertexCount: null,
      attributes: null,
      featureCount: null,
      boundingVolumes: null
    };

    for (const resources of resourcesData || [emptyResources]) {
      this.layersHasTexture = this.layersHasTexture || Boolean(resources.texture);

      if (this.generateBoundingVolumes && resources.boundingVolumes) {
        boundingVolumes = resources.boundingVolumes;
      }

      const lodSelection = convertGeometricErrorToScreenThreshold(sourceTile, boundingVolumes);
      const maxScreenThresholdSQ = lodSelection.find(
        (val) => val.metricType === 'maxScreenThresholdSQ'
      ) || {maxError: 0};

      const nodeInPage = await this._updateNodeInNodePages(
        maxScreenThresholdSQ,
        boundingVolumes,
        sourceTile,
        parentNode.inPageId,
        resources
      );

      const nodeData = await NodeIndexDocument.createNodeIndexDocument(
        parentNode,
        boundingVolumes,
        lodSelection,
        nodeInPage,
        resources
      );
      const node = await new NodeIndexDocument(nodeInPage.index, this).addData(nodeData);
      nodes.push(node);

      if (nodeInPage.mesh) {
        await this._writeResources(resources, node.id);
      }

      if (this.validate) {
        this.boundingVolumeWarnings = validateNodeBoundingVolumes(nodeData);

        if (this.boundingVolumeWarnings && this.boundingVolumeWarnings.length) {
          console.warn('Bounding Volume Warnings: ', ...this.boundingVolumeWarnings); //eslint-disable-line
        }
      }

      nodeIds.push(nodeInPage.index);
      nodesInPage.push(nodeInPage);
    }

    sourceTile.unloadContent();

    await this._addChildrenWithNeighborsAndWriteFile({
      parentNode: nodes[0],
      sourceTiles: sourceTile.children,
      level: level + 1
    });
    return nodes;
  }

  /**
   * Convert tile to one or more I3S nodes
   * @param sourceTile - source tile (3DTile)
   * @param parentId - id of parent node in node pages
   * @param propertyTable - batch table from b3dm / feature properties from EXT_FEATURE_METADATA
   * @returns - converted node resources
   */
  private async _convertResources(
    sourceTile: Tile3D,
    parentId: number,
    propertyTable: FeatureTableJson | null
  ): Promise<I3SConvertedResources[] | null> {
    if (!this.isContentSupported(sourceTile)) {
      return null;
    }
    const draftObb = {
      center: [],
      halfSize: [],
      quaternion: []
    };
    const resourcesData = await convertB3dmToI3sGeometry(
      sourceTile.content,
      async () => (await this.nodePages.push({index: 0, obb: draftObb}, parentId)).index,
      propertyTable,
      this.featuresHashArray,
      this.layers0?.attributeStorageInfo,
      this.options.draco,
      this.generateBoundingVolumes,
      this.options.mergeMaterials,
      this.geoidHeightModel!,
      this.workerSource
    );
    return resourcesData;
  }

  /**
   * Update node object (https://github.com/Esri/i3s-spec/blob/master/docs/1.7/node.cmn.md)
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
   * @param resources.geometry - Uint8Array with geometry attributes
   * @return the node object in node pages
   */
  private async _updateNodeInNodePages(
    maxScreenThresholdSQ: MaxScreenThresholdSQ,
    boundingVolumes: BoundingVolumes,
    sourceTile: Tile3D,
    parentId: number,
    resources: I3SConvertedResources
  ): Promise<NodeInPage> {
    const {meshMaterial, texture, vertexCount, featureCount, geometry, hasUvRegions} = resources;
    const nodeInPage: NodeInPage = {
      index: 0,
      lodThreshold: maxScreenThresholdSQ.maxError,
      obb: boundingVolumes.obb,
      children: []
    };
    if (geometry && this.isContentSupported(sourceTile)) {
      nodeInPage.mesh = {
        geometry: {
          definition: this.findOrCreateGeometryDefinition(Boolean(texture), hasUvRegions),
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

    let nodeId = resources.nodeId;
    let node;
    if (!nodeId) {
      node = await this.nodePages.push(nodeInPage, parentId);
    } else {
      node = await this.nodePages.getNodeById(nodeId);
    }

    NodePages.updateAll(node, nodeInPage);
    if (meshMaterial) {
      NodePages.updateMaterialByNodeId(node, this._findOrCreateMaterial(meshMaterial));
    }
    if (texture) {
      const texelCountHint = texture.image.height * texture.image.width;
      NodePages.updateTexelCountHintByNodeId(node, texelCountHint);
    }
    if (vertexCount) {
      this.vertexCounter += vertexCount;
      NodePages.updateVertexCountByNodeId(node, vertexCount);
    }
    NodePages.updateNodeAttributeByNodeId(node);
    if (featureCount) {
      NodePages.updateFeatureCountByNodeId(node, featureCount);
    }

    this.nodePages.saveNode(node);

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
  private async _writeResources(resources: I3SConvertedResources, nodePath: string): Promise<void> {
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
    await this._writeShared(sharedResources, childPath, slpkChildPath, nodePath);
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
    compressedGeometry: Promise<ArrayBuffer>,
    childPath: string,
    slpkChildPath: string
  ): Promise<void> {
    if (this.options.slpk) {
      const slpkGeometryPath = join(childPath, 'geometries');
      await this.writeQueue.enqueue({
        archiveKey: `${slpkChildPath}/geometries/0.bin.gz`,
        writePromise: () => writeFileForSlpk(slpkGeometryPath, geometryBuffer, '0.bin')
      });
    } else {
      const geometryPath = join(childPath, 'geometries/0/');
      await this.writeQueue.enqueue({
        writePromise: () => writeFile(geometryPath, geometryBuffer, 'index.bin')
      });
    }

    if (this.options.draco) {
      if (this.options.slpk) {
        const slpkCompressedGeometryPath = join(childPath, 'geometries');
        await this.writeQueue.enqueue({
          archiveKey: `${slpkChildPath}/geometries/1.bin.gz`,
          writePromise: () =>
            writeFileForSlpk(slpkCompressedGeometryPath, compressedGeometry, '1.bin')
        });
      } else {
        const compressedGeometryPath = join(childPath, 'geometries/1/');
        await this.writeQueue.enqueue({
          writePromise: () => writeFile(compressedGeometryPath, compressedGeometry, 'index.bin')
        });
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
    sharedResources: SharedResourcesArrays | null,
    childPath: string,
    slpkChildPath: string,
    nodePath: string
  ): Promise<void> {
    if (!sharedResources) {
      return;
    }
    sharedResources.nodePath = nodePath;
    const sharedData = transform(sharedResources, sharedResourcesTemplate());
    const sharedDataStr = JSON.stringify(sharedData);
    if (this.options.slpk) {
      const slpkSharedPath = join(childPath, 'shared');
      await this.writeQueue.enqueue({
        archiveKey: `${slpkChildPath}/shared/sharedResource.json.gz`,
        writePromise: () => writeFileForSlpk(slpkSharedPath, sharedDataStr, 'sharedResource.json')
      });
    } else {
      const sharedPath = join(childPath, 'shared/');
      await this.writeQueue.enqueue({writePromise: () => writeFile(sharedPath, sharedDataStr)});
    }
  }

  /**
   * Generates textures based on texture mime type and fill in textureSetDefinitions data.
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
      const formats: TextureSetDefinitionFormats = [];
      const textureData = texture.bufferView!.data;

      switch (format) {
        case 'jpg':
        case 'png': {
          formats.push({name: '0', format});
          await this.writeTextureFile(textureData, '0', format, childPath, slpkChildPath);

          if (this.generateTextures) {
            formats.push({name: '1', format: 'ktx2'});
            // For Node.js texture.image.data is type of Buffer
            const copyArrayBuffer = texture.image.data.subarray();
            const arrayToEncode = new Uint8Array(copyArrayBuffer);
            const ktx2TextureData = encode(
              {...texture.image, data: arrayToEncode},
              KTX2BasisWriterWorker,
              {
                ...KTX2BasisWriterWorker.options,
                source: this.workerSource.ktx2,
                reuseWorkers: true,
                _nodeWorkers: true
              }
            );

            await this.writeTextureFile(ktx2TextureData, '1', 'ktx2', childPath, slpkChildPath);
          }

          break;
        }

        case 'ktx2': {
          formats.push({name: '1', format});
          await this.writeTextureFile(textureData, '1', format, childPath, slpkChildPath);

          if (this.generateTextures) {
            formats.push({name: '0', format: 'jpg'});
            const decodedFromKTX2TextureData = encode(texture.image!.data[0], ImageWriter);
            await this.writeTextureFile(
              decodedFromKTX2TextureData,
              '0',
              'jpg',
              childPath,
              slpkChildPath
            );
          }
        }
      }

      if (!this.layers0!.textureSetDefinitions!.length) {
        this.layers0!.textureSetDefinitions!.push({formats});
        this.layers0!.textureSetDefinitions!.push({formats, atlas: true});
      }
    }
  }

  /**
   * Write the texture image in a file
   * @param textureData
   * @param name
   * @param format
   * @param childPath
   * @param slpkChildPath
   */
  private async writeTextureFile(
    textureData: Uint8Array | Promise<ArrayBuffer>,
    name: string,
    format: 'jpg' | 'png' | 'ktx2',
    childPath: string,
    slpkChildPath: string
  ): Promise<void> {
    if (this.options.slpk) {
      const slpkTexturePath = join(childPath, 'textures');
      const compress = false;

      await this.writeQueue.enqueue({
        archiveKey: `${slpkChildPath}/textures/${name}.${format}`,
        writePromise: () =>
          writeFileForSlpk(slpkTexturePath, textureData, `${name}.${format}`, compress)
      });
    } else {
      const texturePath = join(childPath, `textures/${name}/`);
      await this.writeQueue.enqueue({
        writePromise: () => writeFile(texturePath, textureData, `index.${format}`)
      });
    }
  }

  /**
   * Write feature attributes in files
   * @param attributes - feature attributes
   * @param childPath - a child path to write resources
   * @param slpkChildPath - the resource path inside *slpk file
   */
  private async _writeAttributes(
    attributes: ArrayBuffer[] | null = [],
    childPath: string,
    slpkChildPath: string
  ): Promise<void> {
    if (attributes?.length && this.layers0?.attributeStorageInfo?.length) {
      for (let index = 0; index < attributes.length; index++) {
        const folderName = this.layers0.attributeStorageInfo[index].key;
        const fileBuffer = new Uint8Array(attributes[index]);

        if (this.options.slpk) {
          const slpkAttributesPath = join(childPath, 'attributes', folderName);
          await this.writeQueue.enqueue({
            archiveKey: `${slpkChildPath}/attributes/${folderName}.bin.gz`,
            writePromise: () => writeFileForSlpk(slpkAttributesPath, fileBuffer, '0.bin')
          });
        } else {
          const attributesPath = join(childPath, `attributes/${folderName}/0`);
          await this.writeQueue.enqueue({
            writePromise: () => writeFile(attributesPath, fileBuffer, 'index.bin')
          });
        }
      }
    }
  }

  /**
   * Return file format by its MIME type
   * @param mimeType - feature attributes
   */
  private _getFormatByMimeType(mimeType: string | undefined): 'jpg' | 'png' | 'ktx2' {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/ktx2':
        return 'ktx2';
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
      return this.materialMap.get(hash) || 0;
    }
    const newMaterialId = this.materialDefinitions.push(material) - 1;
    this.materialMap.set(hash, newMaterialId);
    return newMaterialId;
  }

  /**
   * Get unique geometry configuration index
   * In the end of conversion configurations will be transformed to geometryDefinitions array
   * @param hasTexture
   * @param hasUvRegions
   * @returns
   */
  private findOrCreateGeometryDefinition(hasTexture: boolean, hasUvRegions: boolean): number {
    const geometryConfig = {hasTexture, hasUvRegions};
    const hash = md5(JSON.stringify(geometryConfig));
    if (this.geometryMap.has(hash)) {
      return this.geometryMap.get(hash) || 0;
    }
    const newGeometryId = this.geometryConfigs.push(geometryConfig) - 1;
    this.geometryMap.set(hash, newGeometryId);
    return newGeometryId;
  }

  /**
   * Do conversion of 3DTiles property table to I3s node attributes.
   * @param propertyTable - Table with layer meta data.
   */
  private _convertPropertyTableToNodeAttributes(propertyTable: FeatureTableJson): void {
    let attributeIndex = 0;
    const propertyTableWithObjectId = {
      OBJECTID: [0],
      ...propertyTable
    };

    for (const key in propertyTableWithObjectId) {
      const firstAttribute = propertyTableWithObjectId[key][0];
      const attributeType = getAttributeType(key, firstAttribute);

      const storageAttribute = createdStorageAttribute(attributeIndex, key, attributeType);
      const fieldAttributeType = getFieldAttributeType(attributeType);
      const fieldAttribute = createFieldAttribute(key, fieldAttributeType);
      const popupInfo = createPopupInfo(propertyTableWithObjectId);

      this.layers0!.attributeStorageInfo!.push(storageAttribute);
      this.layers0!.fields!.push(fieldAttribute);
      this.layers0!.popupInfo = popupInfo;
      this.layers0!.layerType = _3D_OBJECT_LAYER_TYPE;

      attributeIndex += 1;
    }
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
  private _checkAddRefinementTypeForTile(tile: Tile3D): void {
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

  private async loadWorkers(): Promise<void> {
    console.log(`Loading workers source...`); // eslint-disable-line no-undef, no-console
    if (this.options.draco) {
      const url = getWorkerURL(DracoWriterWorker, {...getLoaderOptions()});
      const sourceResponse = await fetchFile(url);
      const source = await sourceResponse.text();
      this.workerSource.draco = source;
    }

    if (this.generateTextures) {
      const url = getWorkerURL(KTX2BasisWriterWorker, {...getLoaderOptions()});
      const sourceResponse = await fetchFile(url);
      const source = await sourceResponse.text();
      this.workerSource.ktx2 = source;
    }

    const i3sAttributesWorkerUrl = getWorkerURL(I3SAttributesWorker, {...getLoaderOptions()});
    const sourceResponse = await fetchFile(i3sAttributesWorkerUrl);
    const source = await sourceResponse.text();
    this.workerSource.I3SAttributes = source;
    console.log(`Loading workers source completed!`); // eslint-disable-line no-undef, no-console
  }
}
