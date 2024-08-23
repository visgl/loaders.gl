// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {AttributeMetadataInfo} from './helpers/attribute-metadata-info';

import type {
  FeatureTableJson,
  Tiles3DLoaderOptions,
  Tiles3DTileContent,
  Tiles3DTileJSONPostprocessed,
  Tiles3DTilesetJSONPostprocessed
} from '@loaders.gl/3d-tiles';
import type {WriteQueueItem} from '../lib/utils/write-queue';
import type {
  SceneLayer3D,
  BoundingVolumes,
  MaxScreenThresholdSQ,
  NodeInPage,
  Attribute,
  Node3DIndexDocument
} from '@loaders.gl/i3s';
import {load, encode, isBrowser} from '@loaders.gl/core';
import {CesiumIonLoader, Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Geoid} from '@math.gl/geoid';
import {join} from 'path';
import {v4 as uuidv4} from 'uuid';
import process from 'process';
import transform from 'json-map-transform';
import md5 from 'md5';

import NodePages from './helpers/node-pages';
import {writeFile, removeDir, writeFileForSlpk, removeFile} from '../lib/utils/file-utils';
import {compressFileWithGzip} from '../lib/utils/compress-util';
import {calculateFilesSize, timeConverter} from '../lib/utils/statistic-utils';
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
import {KTX2BasisWriterWorker} from '@loaders.gl/textures';
import {LoaderWithParser} from '@loaders.gl/loader-utils';
import {I3SMaterialDefinition, TextureSetDefinitionFormats} from '@loaders.gl/i3s';
import {ImageWriter} from '@loaders.gl/images';
import {GLTFImagePostprocessed} from '@loaders.gl/gltf';
import {
  GLTFPrimitiveModeString,
  I3SConvertedResources,
  PreprocessData,
  ResourceType,
  SharedResourcesArrays
} from './types';
import {WorkerFarm} from '@loaders.gl/worker-utils';
import WriteQueue from '../lib/utils/write-queue';
import {BROWSER_ERROR_MESSAGE} from '../constants';
import {
  getAttributeTypesMapFromPropertyTable,
  getAttributeTypesMapFromSchema
} from './helpers/feature-attributes';
import {NodeIndexDocument} from './helpers/node-index-document';
import {
  isNestedTileset,
  loadNestedTileset,
  loadTile3DContent,
  loadFromArchive
} from './helpers/load-3d-tiles';
import {Matrix4} from '@math.gl/core';
import {BoundingSphere, OrientedBoundingBox} from '@math.gl/culling';
import {TILE_REFINEMENT, createBoundingVolume} from '@loaders.gl/tiles';
import {TraversalConversionProps, traverseDatasetWith} from './helpers/tileset-traversal';
import {analyzeTileContent, mergePreprocessData} from './helpers/preprocess-3d-tiles';
import {Progress} from './helpers/progress';
import {composeHashFile, createZip} from '@loaders.gl/zip';
import {ConversionDump, ConversionDumpOptions, DumpMetadata} from '../lib/utils/conversion-dump';
import {PromptModule} from 'inquirer';

const ION_DEFAULT_TOKEN = process.env?.IonToken;
const HARDCODED_NODES_PER_PAGE = 64;
const _3D_TILES = '3DTILES';
const _3D_OBJECT_LAYER_TYPE = '3DObject';
const REFRESH_TOKEN_TIMEOUT = 1800; // 30 minutes in seconds
const CESIUM_DATASET_PREFIX = 'https://';
// const FS_FILE_TOO_LARGE = 'ERR_FS_FILE_TOO_LARGE';
const PROGRESS_PHASE1_COUNT = 'phase1-count';

type ConverterProps = {
  inputUrl: string;
  outputPath: string;
  tilesetName: string;
  egmFilePath: string;
  maxDepth?: number;
  token?: string;
  draco?: boolean;
  mergeMaterials?: boolean;
  validate?: boolean;
  generateTextures?: boolean;
  generateBoundingVolumes?: boolean;
  instantNodeWriting?: boolean;
  inquirer?: {prompt: PromptModule};
  metadataClass?: string;
  analyze?: boolean;
};

/**
 * Converter from 3d-tiles tileset to i3s layer
 */
export default class I3SConverter {
  attributeMetadataInfo: AttributeMetadataInfo;
  nodePages: NodePages;
  options: Partial<ConverterProps>;
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
  sourceTileset: Tiles3DTilesetJSONPostprocessed | null = null;
  loadOptions: Tiles3DLoaderOptions = {
    _nodeWorkers: true,
    reuseWorkers: true,
    useLocalLibraries: true,
    basis: {
      format: 'rgba32',
      // We need to load local fs workers because nodejs can't load workers from the Internet
      workerUrl: './modules/textures/dist/basis-worker-node.js'
    },
    // We need to load local fs workers because nodejs can't load workers from the Internet
    draco: {workerUrl: './modules/draco/dist/draco-worker-node.js'},
    fetch: {},
    modules: {}
  };
  geoidHeightModel: Geoid | null = null;
  Loader: LoaderWithParser = Tiles3DLoader;
  generateTextures: boolean;
  generateBoundingVolumes: boolean;
  layersHasTexture: boolean;
  workerSource: {[key: string]: string} = {};
  writeQueue: WriteQueue<WriteQueueItem> = new WriteQueue(new ConversionDump());
  compressList: string[] | null = null;
  preprocessData: PreprocessData = {
    meshTopologyTypes: new Set(),
    metadataClasses: new Set()
  };
  progresses: Record<string, Progress> = {};
  conversionDump: ConversionDump;

  constructor() {
    this.attributeMetadataInfo = new AttributeMetadataInfo();
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
    this.conversionDump = new ConversionDump();
  }

  /**
   * Convert a 3d tileset
   * @param options
   * @param options.inputUrl the url to read the tileset from
   * @param options.outputPath the output filename
   * @param options.tilesetName the output name of the tileset
   * @param options.maxDepth The max tree depth of conversion
   * @param options.egmFilePath location of *.pgm file to convert heights from ellipsoidal to gravity-related format
   * @param options.token Token for Cesium ION tilesets authentication
   * @param options.draco Generate I3S 1.7 draco compressed geometries
   * @param options.validate -enable validation
   * @param options.generateTextures - generate alternative type of textures (to have non-compressed jpeg/png and compressed ktx2)
   * @param options.generateBoundingVolumes - generate bounding volumes from vertices coordinates instead of source tiles bounding volumes
   * @param options.instantNodeWriting - Keep created 3DNodeIndexDocument files on disk instead of memory. This option reduce memory usage but decelerates conversion speed
   */
  // eslint-disable-next-line max-statements, complexity
  async convert(options: ConverterProps): Promise<string> {
    if (isBrowser) {
      console.log(BROWSER_ERROR_MESSAGE); // eslint-disable-line no-console
      return BROWSER_ERROR_MESSAGE;
    }
    this.conversionStartTime = process.hrtime();
    const {
      tilesetName,
      egmFilePath,
      inputUrl,
      validate,
      outputPath,
      draco = true,
      maxDepth,
      token,
      generateTextures,
      generateBoundingVolumes,
      instantNodeWriting = false,
      mergeMaterials = true,
      inquirer,
      metadataClass,
      analyze = false
    } = options;
    this.options = {
      outputPath,
      tilesetName,
      maxDepth,
      egmFilePath,
      draco,
      token,
      inputUrl,
      instantNodeWriting,
      mergeMaterials,
      inquirer,
      metadataClass
    };
    this.progresses[PROGRESS_PHASE1_COUNT] = new Progress();
    this.compressList = (this.options.instantNodeWriting && []) || null;
    this.validate = Boolean(validate);
    this.Loader = inputUrl.indexOf(CESIUM_DATASET_PREFIX) !== -1 ? CesiumIonLoader : Tiles3DLoader;
    this.generateTextures = Boolean(generateTextures);
    this.generateBoundingVolumes = Boolean(generateBoundingVolumes);

    this.writeQueue = new WriteQueue(this.conversionDump);
    this.writeQueue.startListening();

    if (egmFilePath.toLowerCase() === 'none') {
      console.log('--egm chousen to be "none", skip loading egm file'); // eslint-disable-line
    } else {
      console.log('Loading egm file...'); // eslint-disable-line
      this.geoidHeightModel = await load(egmFilePath, PGMLoader);
      console.log('Loading egm file completed!'); // eslint-disable-line
    }

    this.nodePages.useWriteFunction(writeFileForSlpk);

    try {
      const preloadOptions = await this._fetchPreloadOptions();
      let tilesetUrl = inputUrl;
      if (preloadOptions.url) {
        tilesetUrl = preloadOptions.url;
      }
      if (preloadOptions.headers) {
        this.loadOptions.fetch = {headers: preloadOptions.headers};
      }
      this.sourceTileset = await loadFromArchive(tilesetUrl, this.Loader, this.loadOptions);

      const preprocessResult =
        this.Loader === Tiles3DLoader || analyze ? await this.preprocessConversion() : true;

      if (preprocessResult && !analyze) {
        const selectMetadataClassResult = await this.selectMetadataClass();
        if (selectMetadataClassResult) {
          await this._createAndSaveTileset(outputPath, tilesetName);
          await this._finishConversion({outputPath, tilesetName});
        }
      }
    } catch (error) {
      throw error;
    } finally {
      await this.writeQueue.finalize();
      // Clean up worker pools
      const workerFarm = WorkerFarm.getWorkerFarm({});
      workerFarm.destroy();
    }
    return 'success';
  }

  /**
   * Preprocess stage of the tile converter. Traverse all the tiles tree and
   * check a tile content to be sure that the data is supported
   * @returns true - the conversion is possible, false - the tileset's content is not supported
   */
  private async preprocessConversion(): Promise<boolean> {
    // eslint-disable-next-line no-console
    console.log('Analyze source tileset');
    const sourceRootTile: Tiles3DTileJSONPostprocessed = this.sourceTileset!.root;
    await traverseDatasetWith<null>({
      tile: sourceRootTile,
      traversalProps: null,
      processTile: this.analyzeTile.bind(this),
      postprocessTile: undefined,
      maxDepth: this.options.maxDepth
    });
    const {meshTopologyTypes, metadataClasses} = this.preprocessData;

    // eslint-disable-next-line no-console
    console.log('------------------------------------------------');
    // eslint-disable-next-line no-console
    console.log('Preprocess results:');
    // eslint-disable-next-line no-console
    console.log(`Tile count: ${this.progresses[PROGRESS_PHASE1_COUNT].stepsTotal}`);
    // eslint-disable-next-line no-console
    console.log(`glTF mesh topology types: ${Array.from(meshTopologyTypes).join(', ')}`);

    if (metadataClasses.size) {
      // eslint-disable-next-line no-console
      console.log(
        `Feature metadata classes have been found: ${Array.from(metadataClasses).join(', ')}`
      );
    } else {
      // eslint-disable-next-line no-console
      console.log('Feature metadata classes have not been found');
    }

    if (
      !meshTopologyTypes.has(GLTFPrimitiveModeString.TRIANGLES) &&
      !meshTopologyTypes.has(GLTFPrimitiveModeString.TRIANGLE_STRIP)
    ) {
      // eslint-disable-next-line no-console
      console.log(
        'The tileset is of unsupported mesh topology types. The conversion will be interrupted.'
      );
      // eslint-disable-next-line no-console
      console.log('------------------------------------------------');
      return false;
    }

    // eslint-disable-next-line no-console
    console.log('------------------------------------------------');
    return true;
  }

  /**
   * Analyze a tile content. The callback for preprocess stage.
   * @param sourceTile - 3DTiles tile JSON metadata
   * @param traversalProps - mandatory argument but it is not used for the preprocess stage
   * @returns - nothing
   */
  private async analyzeTile(
    sourceTile: Tiles3DTileJSONPostprocessed,
    traversalProps: null
  ): Promise<null> {
    const isTileset = isNestedTileset(sourceTile);
    if (isTileset) {
      await loadNestedTileset(this.sourceTileset, sourceTile, this.loadOptions);
      return null;
    }
    if (sourceTile.id) {
      this.progresses[PROGRESS_PHASE1_COUNT].stepsTotal += 1;
      console.log(`[analyze]: ${sourceTile.id}`); // eslint-disable-line
    }

    let tileContent: Tiles3DTileContent | null = null;
    try {
      tileContent = await loadTile3DContent(this.sourceTileset, sourceTile, {
        ...this.loadOptions,
        '3d-tiles': {...this.loadOptions['3d-tiles'], loadGLTF: false}
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(
        `[warning]: Failed to load ${sourceTile.contentUrl}. An I3S tile with empty content will be added to the output tileset`
      );
    }
    const tilePreprocessData = await analyzeTileContent(tileContent);
    mergePreprocessData(this.preprocessData, tilePreprocessData);
    return null;
  }

  /**
   * Select metadata class associated with the set of feature attributes
   * @returns true if the metadata class has been successfully selected
   */
  private async selectMetadataClass() {
    const {metadataClasses} = this.preprocessData;
    if (metadataClasses.size > 1) {
      if (this.options.metadataClass?.length) {
        // eslint-disable-next-line no-console
        console.log(`${this.options.metadataClass} has been selected`);
      } else if (this.options.inquirer) {
        const result = await this.options.inquirer.prompt([
          {
            name: 'metadataClass',
            type: 'list',
            message: 'Select feature metadata data class to convert...',
            choices: Array.from(metadataClasses)
          }
        ]);
        this.options.metadataClass = result.metadataClass;
        // eslint-disable-next-line no-console
        console.log(`${result.metadataClass} has been selected`);
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `A feature metadata class has not been selected. Start the converter with option "--metadata-class". For example, "npx tile-converter ... --metadata-class ${
            Array.from(metadataClasses)[0]
          }"`
        );
        // eslint-disable-next-line no-console
        console.log('------------------------------------------------');
        return false;
      }
    }
    return true;
  }

  /**
   * Convert and save the layer and embedded tiles
   * @param outputPath - path to save output data
   * @param tilesetName - new tileset path
   */
  // eslint-disable-next-line max-statements, complexity
  private async _createAndSaveTileset(outputPath: string, tilesetName: string): Promise<void> {
    const tilesetPath = join(`${outputPath}`, `${tilesetName}`);

    await this.conversionDump.createDump(this.options as ConversionDumpOptions);
    if (this.conversionDump.restored && this.options.inquirer) {
      const result = await this.options.inquirer.prompt([
        {
          name: 'resumeConversion',
          type: 'confirm',
          message:
            'Dump file of the previous conversion exists, do you want to resume that conversion?'
        }
      ]);
      if (!result.resumeConversion) {
        this.conversionDump.reset();
      }
    }

    this.layers0Path = join(tilesetPath, 'SceneServer', 'layers', '0');

    // Removing the tilesetPath needed to exclude erroneous files after conversion
    const removePath = this.conversionDump.restored
      ? join(this.layers0Path, 'nodepages')
      : tilesetPath;
    try {
      await removeDir(removePath);
    } catch (e) {
      // do nothing
    }

    if (this.conversionDump.restored && this.conversionDump.attributeMetadataInfo) {
      this.attributeMetadataInfo.fromObject(this.conversionDump.attributeMetadataInfo);
    }

    this.materialDefinitions = [];
    this.materialMap = new Map();

    if (this.conversionDump.restored && this.conversionDump.materialDefinitions) {
      for (let i = 0; i < this.conversionDump.materialDefinitions.length; i++) {
        const hash = md5(JSON.stringify(this.conversionDump.materialDefinitions[i]));
        this.materialMap.set(hash, i);
      }
      this.materialDefinitions = this.conversionDump.materialDefinitions;
    }

    const sourceRootTile: Tiles3DTileJSONPostprocessed = this.sourceTileset!.root;
    const sourceBoundingVolume = createBoundingVolume(
      sourceRootTile.boundingVolume,
      new Matrix4(sourceRootTile.transform),
      null
    );

    this._formLayers0(
      tilesetName,
      sourceBoundingVolume,
      this.sourceTileset?.root?.boundingVolume?.region
    );

    const boundingVolumes = createBoundingVolumes(sourceBoundingVolume, this.geoidHeightModel);

    await this.nodePages.push({
      index: 0,
      lodThreshold: 0,
      obb: boundingVolumes.obb,
      children: []
    });
    this.progresses[PROGRESS_PHASE1_COUNT].startMonitoring();
    const rootNode = await NodeIndexDocument.createRootNode(boundingVolumes, this);
    await traverseDatasetWith<TraversalConversionProps>({
      tile: sourceRootTile,
      traversalProps: {
        transform: new Matrix4(sourceRootTile.transform),
        parentNodes: [rootNode]
      },
      processTile: this.convertTile.bind(this),
      postprocessTile: this.finalizeTile.bind(this),
      maxDepth: this.options.maxDepth
    });
    this.progresses[PROGRESS_PHASE1_COUNT].stopMonitoring();
    console.log(`[finalizing conversion]`); // eslint-disable-line

    this.layers0!.attributeStorageInfo = this.attributeMetadataInfo.attributeStorageInfo;
    this.layers0!.fields = this.attributeMetadataInfo.fields;
    this.layers0!.popupInfo = this.attributeMetadataInfo.popupInfo;

    if (this.attributeMetadataInfo.attributeStorageInfo.length) {
      this.layers0!.layerType = _3D_OBJECT_LAYER_TYPE;
    }

    if (this.conversionDump.restored && this.conversionDump.textureSetDefinitions) {
      this.layers0!.textureSetDefinitions = this.conversionDump.textureSetDefinitions;
    }

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
   * @param tilesetName - Name of layer
   * @param sourceBoundingVolume - initialized bounding volume of the source root tile
   * @param boundingVolumeRegion - region bounding volume of the source root tile
   */
  private _formLayers0(
    tilesetName: string,
    sourceBoundingVolume: OrientedBoundingBox | BoundingSphere,
    boundingVolumeRegion?: number[]
  ): void {
    if (!this.sourceTileset?.root) {
      return;
    }
    const fullExtent = convertBoundingVolumeToI3SFullExtent(sourceBoundingVolume);
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
   * Write 3DSceneLayer https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DSceneLayer.cmn.md in file
   */
  private async _writeLayers0(): Promise<void> {
    await this.writeQueue.enqueue({
      archiveKey: '3dSceneLayer.json.gz',
      writePromise: () =>
        writeFileForSlpk(this.layers0Path, JSON.stringify(this.layers0), '3dSceneLayer.json')
    });
  }

  /**
   * Pack files into *.slpk archive
   * @param tilesetPath - Path to save file
   */
  private async _createSlpk(tilesetPath: string): Promise<void> {
    await this.conversionDump.deleteDumpFile();
    const slpkTilesetPath = join(tilesetPath, 'SceneServer', 'layers', '0');
    const slpkFileName = `${tilesetPath}.slpk`;

    await createZip(slpkTilesetPath, slpkFileName, async (fileList) => ({
      path: '@specialIndexFileHASH128@',
      file: await composeHashFile(fileList)
    }));

    try {
      await removeDir(tilesetPath);
    } catch (e) {
      // do nothing
    }
  }

  /**
   * Convert the specific 3DTiles tile to I3S nodes.
   * This is callback function for the traversal generic function
   * @param sourceTile - current 3DTiles tile JSON metadata
   * @param traversalProps - traversal properties calculated recursively
   * @returns - traversal properties for the child tiles
   */
  // eslint-disable-next-line max-statements
  private async convertTile(
    sourceTile: Tiles3DTileJSONPostprocessed,
    traversalProps: TraversalConversionProps
  ): Promise<TraversalConversionProps> {
    const isTileset = isNestedTileset(sourceTile);
    if (isTileset || sourceTile.type === 'empty') {
      if (isTileset) {
        if (sourceTile.id) {
          console.log(`[load]: ${sourceTile.id}`); // eslint-disable-line
        }
        await loadNestedTileset(this.sourceTileset, sourceTile, this.loadOptions);
      }
      return traversalProps;
    }
    if (sourceTile.id) {
      console.log(`[convert]: ${sourceTile.id}`); // eslint-disable-line
    }

    const {parentNodes, transform} = traversalProps;
    let transformationMatrix: Matrix4 = transform.clone();
    if (sourceTile.transform) {
      transformationMatrix = transformationMatrix.multiplyRight(sourceTile.transform);
    }
    const parentNode = parentNodes[0];
    const restoreResult = await this._restoreNode(parentNode, sourceTile, transformationMatrix);
    let childNodes;
    if (restoreResult === null) {
      childNodes = await this._createNode(parentNode, sourceTile, transformationMatrix);
    } else {
      childNodes = restoreResult;
    }
    await parentNode.addChildren(childNodes);

    const newTraversalProps: TraversalConversionProps = {
      transform: transformationMatrix,
      parentNodes: childNodes
    };

    if (sourceTile.id) {
      this.progresses[PROGRESS_PHASE1_COUNT].stepsDone += 1;

      let timeRemainingString = 'Calculating time left...';
      const timeRemainingStringBasedOnCount =
        this.progresses[PROGRESS_PHASE1_COUNT].getTimeRemainingString();
      if (timeRemainingStringBasedOnCount) {
        timeRemainingString = `${timeRemainingStringBasedOnCount} left`;
      }

      const percentString = this.progresses[PROGRESS_PHASE1_COUNT].getPercentString();
      const progressString = percentString ? ` ${percentString}%, ${timeRemainingString}` : '';
      console.log(`[converted${progressString}]: ${sourceTile.id}`); // eslint-disable-line
    }
    return newTraversalProps;
  }

  /**
   * Do final action with nodes after the current node and all child nodes been converted.
   * @param conversionResults - array of conversion results of the current node
   * @param currentTraversalProps - traversal properties of the current node
   */
  private async finalizeTile(
    conversionResults: TraversalConversionProps[],
    currentTraversalProps: TraversalConversionProps
  ): Promise<void> {
    for (const result of conversionResults) {
      for (const node of result.parentNodes) {
        await node.addNeighbors();
      }
    }
    for (const node of currentTraversalProps.parentNodes) {
      await node.save();
    }
  }

  /**
   * Generate NodeIndexDocument
   * @param boundingVolumes - Bounding volumes
   * @param resources - converted or dumped node resources data
   * @param parentNode - 3DNodeIndexDocument of parent node
   * @param sourceTile - source 3DTile data
   * @param isDumped - indicator if the node is dumped
   * @return NodeIndexDocument, nodeInPage and node data
   */
  private async _generateNodeIndexDocument(
    boundingVolumes: BoundingVolumes,
    resources: I3SConvertedResources | DumpMetadata,
    parentNode: NodeIndexDocument,
    sourceTile: Tiles3DTileJSONPostprocessed,
    isDumped: boolean
  ): Promise<{node: NodeIndexDocument; nodeInPage: NodeInPage; nodeData: Node3DIndexDocument}> {
    this.layersHasTexture =
      this.layersHasTexture ||
      Boolean(
        ('texture' in resources && resources.texture) ||
          ('texelCountHint' in resources && resources.texelCountHint)
      );

    if (this.generateBoundingVolumes && resources.boundingVolumes) {
      boundingVolumes = resources.boundingVolumes;
    }

    const lodSelection = convertGeometricErrorToScreenThreshold(sourceTile, boundingVolumes);
    const maxScreenThresholdSQ = lodSelection.find(
      (val) => val.metricType === 'maxScreenThresholdSQ'
    ) || {maxError: 0};

    if (isDumped) {
      const draftObb = {
        center: [],
        halfSize: [],
        quaternion: []
      };
      await this.nodePages.push({index: 0, obb: draftObb}, parentNode.inPageId);
    }

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
    return {node, nodeInPage, nodeData};
  }

  /**
   * Restore 3DNodeIndexDocument from a comversion dump file
   * @param parentNode - 3DNodeIndexDocument of parent node
   * @param sourceTile - source 3DTile data
   * @param transformationMatrix - transformation matrix of the current tile, calculated recursively multiplying
   *                               transform of all parent tiles and transform of the current tile
   */
  private async _restoreNode(
    parentNode: NodeIndexDocument,
    sourceTile: Tiles3DTileJSONPostprocessed,
    transformationMatrix: Matrix4
  ): Promise<null | NodeIndexDocument[]> {
    this._checkAddRefinementTypeForTile(sourceTile);
    await this._updateTilesetOptions();
    if (
      this.conversionDump.restored &&
      sourceTile.id &&
      this.conversionDump.isFileConversionComplete(sourceTile.id)
    ) {
      const sourceBoundingVolume = createBoundingVolume(
        sourceTile.boundingVolume,
        transformationMatrix,
        null
      );
      const boundingVolumes = createBoundingVolumes(sourceBoundingVolume, this.geoidHeightModel);
      const nodes: NodeIndexDocument[] = [];
      for (const convertedNode of this.conversionDump.tilesConverted[sourceTile.id].nodes) {
        const {node} = await this._generateNodeIndexDocument(
          boundingVolumes,
          {
            ...(convertedNode.dumpMetadata as DumpMetadata),
            nodeId: convertedNode.nodeId
          } as I3SConvertedResources | DumpMetadata,
          parentNode,
          sourceTile,
          true
        );
        nodes.push(node);
      }
      return nodes;
    } else if (this.conversionDump.restored && sourceTile.id) {
      // clear existing record in a dump
      this.conversionDump.clearDumpRecord(sourceTile.id);
    }
    return null;
  }

  /**
   * Convert tile to one or more I3S nodes
   * @param parentNode - 3DNodeIndexDocument of parent node
   * @param sourceTile - source 3DTile data
   * @param transformationMatrix - transformation matrix of the current tile, calculated recursively multiplying
   *                               transform of all parent tiles and transform of the current tile
   * @param level - tree level
   */
  // eslint-disable-next-line max-statements
  private async _createNode(
    parentNode: NodeIndexDocument,
    sourceTile: Tiles3DTileJSONPostprocessed,
    transformationMatrix: Matrix4
  ): Promise<NodeIndexDocument[]> {
    this._checkAddRefinementTypeForTile(sourceTile);

    await this._updateTilesetOptions();

    let tileContent: Tiles3DTileContent | null = null;
    try {
      tileContent = await loadTile3DContent(this.sourceTileset, sourceTile, this.loadOptions);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`[warning]: Failed to load ${sourceTile.contentUrl}`);
    }
    const sourceBoundingVolume = createBoundingVolume(
      sourceTile.boundingVolume,
      transformationMatrix,
      null
    );
    const boundingVolumes = createBoundingVolumes(sourceBoundingVolume, this.geoidHeightModel);

    const propertyTable = getPropertyTable(tileContent, this.options.metadataClass);
    this.createAttributeStorageInfo(tileContent, propertyTable);

    this.conversionDump.attributeMetadataInfo = {
      attributeStorageInfo: this.attributeMetadataInfo.attributeStorageInfo,
      fields: this.attributeMetadataInfo.fields,
      popupInfo: this.attributeMetadataInfo.popupInfo
    };

    const resourcesData = await this._convertResources({
      sourceTile,
      transformationMatrix,
      boundingVolume: sourceBoundingVolume,
      tileContent,
      parentId: parentNode.inPageId,
      propertyTable
    });

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
      const {node, nodeInPage, nodeData} = await this._generateNodeIndexDocument(
        boundingVolumes,
        resources,
        parentNode,
        sourceTile,
        false
      );
      nodes.push(node);

      if (nodeInPage.mesh) {
        // update a record in a dump file
        if (sourceTile.id) {
          const dumpMetadata = {
            boundingVolumes: resources.boundingVolumes,
            attributesCount: resources.attributes?.length,
            featureCount: resources.featureCount,
            geometry: Boolean(resources.geometry),
            hasUvRegions: resources.hasUvRegions,
            materialId: nodeInPage.mesh.material.definition,
            texelCountHint: nodeInPage.mesh.material.texelCountHint,
            vertexCount: resources.vertexCount
          };
          this.conversionDump.setMaterialsDefinitions(this.materialDefinitions);
          await this.conversionDump.addNode(sourceTile.id, nodeInPage.index, dumpMetadata);
        }

        // write resources
        await this._writeResources(resources, node.id, sourceTile);
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

    return nodes;
  }

  /**
   * Convert tile to one or more I3S nodes
   * @param sourceTile - source tile (3DTile)
   * @param transformationMatrix - transformation matrix of the current tile, calculated recursively multiplying
   *                               transform of all parent tiles and transform of the current tile
   * @param boundingVolume - initialized bounding volume of the source tile
   * @param tileContent - content of the source tile
   * @param parentId - id of parent node in node pages
   * @param propertyTable - batch table from b3dm / feature properties from EXT_FEATURE_METADATA, EXT_MESH_FEATURES or EXT_STRUCTURAL_METADATA
   * @returns - converted node resources
   */
  private async _convertResources({
    sourceTile,
    transformationMatrix,
    boundingVolume,
    tileContent,
    parentId,
    propertyTable
  }: {
    sourceTile: Tiles3DTileJSONPostprocessed;
    transformationMatrix: Matrix4;
    boundingVolume: OrientedBoundingBox | BoundingSphere;
    tileContent: Tiles3DTileContent | null;
    parentId: number;
    propertyTable: FeatureTableJson | null;
  }): Promise<I3SConvertedResources[] | null> {
    if (!this.isContentSupported(sourceTile) || !tileContent) {
      return null;
    }
    const draftObb = {
      center: [],
      halfSize: [],
      quaternion: []
    };
    const resourcesData = await convertB3dmToI3sGeometry({
      tileContent,
      tileTransform: transformationMatrix,
      tileBoundingVolume: boundingVolume,
      addNodeToNodePage: async () =>
        (await this.nodePages.push({index: 0, obb: draftObb}, parentId)).index,
      propertyTable,
      featuresHashArray: this.featuresHashArray,
      attributeStorageInfo: this.attributeMetadataInfo.attributeStorageInfo,
      draco: this.options.draco ?? false,
      generateBoundingVolumes: this.generateBoundingVolumes,
      shouldMergeMaterials: this.options.mergeMaterials ?? false,
      geoidHeightModel: this.geoidHeightModel,
      libraries: this.loadOptions.modules as Record<string, string>,
      metadataClass: this.options.metadataClass
    });
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
  // eslint-disable-next-line max-statements, complexity
  private async _updateNodeInNodePages(
    maxScreenThresholdSQ: MaxScreenThresholdSQ,
    boundingVolumes: BoundingVolumes,
    sourceTile: Tiles3DTileJSONPostprocessed,
    parentId: number,
    resources: I3SConvertedResources | DumpMetadata
  ): Promise<NodeInPage> {
    const {vertexCount, featureCount, geometry, hasUvRegions} = resources;
    const nodeInPage: NodeInPage = {
      index: 0,
      lodThreshold: maxScreenThresholdSQ.maxError,
      obb: boundingVolumes.obb,
      children: []
    };
    if (geometry && this.isContentSupported(sourceTile)) {
      nodeInPage.mesh = {
        geometry: {
          definition: this.findOrCreateGeometryDefinition(
            Boolean(
              ('texture' in resources && resources.texture) ||
                ('texelCountHint' in resources && resources.texelCountHint)
            ),
            hasUvRegions
          ),
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

    const nodeId = 'nodeId' in resources ? resources.nodeId : undefined;
    let node: NodeInPage;
    if (!nodeId) {
      node = await this.nodePages.push(nodeInPage, parentId);
    } else {
      node = await this.nodePages.getNodeById(nodeId);
    }

    if (!nodeInPage.mesh) {
      // eslint-disable-next-line no-console
      console.log(`[warning]: node ${node.index} is created with empty content`);
    }

    NodePages.updateAll(node, nodeInPage);
    if ('meshMaterial' in resources && resources.meshMaterial) {
      NodePages.updateMaterialByNodeId(node, this._findOrCreateMaterial(resources.meshMaterial));
    } else if ('materialId' in resources && resources.materialId !== null) {
      NodePages.updateMaterialByNodeId(node, resources.materialId);
    }
    if ('texture' in resources && resources.texture) {
      const texelCountHint = resources.texture.image.height * resources.texture.image.width;
      NodePages.updateTexelCountHintByNodeId(node, texelCountHint);
    } else if ('texelCountHint' in resources && resources.texelCountHint) {
      NodePages.updateTexelCountHintByNodeId(node, resources.texelCountHint);
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
   * @param nodePath - node path
   * @param sourceTile - source tile (3DTile)
   * @return {Promise<void>}
   */
  private async _writeResources(
    resources: I3SConvertedResources,
    nodePath: string,
    sourceTile: Tiles3DTileJSONPostprocessed
  ): Promise<void> {
    const {
      geometry: geometryBuffer,
      compressedGeometry,
      texture,
      sharedResources,
      attributes
    } = resources;
    const childPath = join(this.layers0Path, 'nodes', nodePath);
    const slpkChildPath = join('nodes', nodePath);

    await this._writeGeometries({
      geometryBuffer,
      compressedGeometry,
      childPath,
      slpkChildPath,
      sourceId: sourceTile.id || '',
      nodeId: parseInt(nodePath)
    });
    await this._writeShared({
      sharedResources,
      childPath,
      slpkChildPath,
      nodePath,
      sourceId: sourceTile.id || '',
      nodeId: parseInt(nodePath)
    });
    await this._writeTexture(
      texture,
      childPath,
      slpkChildPath,
      sourceTile.id || '',
      parseInt(nodePath)
    );
    await this._writeAttributes(
      attributes,
      childPath,
      slpkChildPath,
      sourceTile.id || '',
      parseInt(nodePath)
    );
  }

  /**
   * Write non-compressed and compressed geometries in files
   * @param geometryBuffer - Uint8Array with geometry attributes
   * @param compressedGeometry - Uint8Array with compressed (draco) geometry
   * @param childPath - a child path to write resources
   * @param slpkChildPath - resource path inside *slpk file
   * @param sourceId - source filename
   * @param nodeId - nodeId of a converted node for the writing
   */
  private async _writeGeometries({
    geometryBuffer,
    compressedGeometry,
    childPath,
    slpkChildPath,
    sourceId,
    nodeId
  }: {
    geometryBuffer: ArrayBuffer | null;
    compressedGeometry?: Promise<ArrayBuffer> | null;
    childPath: string;
    slpkChildPath: string;
    sourceId: string;
    nodeId: number;
  }): Promise<void> {
    if (!geometryBuffer) {
      return;
    }

    this.conversionDump.updateDoneStatus(sourceId, nodeId, ResourceType.GEOMETRY, false);

    const slpkGeometryPath = join(childPath, 'geometries');
    await this.writeQueue.enqueue({
      archiveKey: `${slpkChildPath}/geometries/0.bin.gz`,
      sourceId,
      outputId: nodeId,
      resourceType: ResourceType.GEOMETRY,
      writePromise: () => writeFileForSlpk(slpkGeometryPath, geometryBuffer, '0.bin')
    });

    if (this.options.draco && compressedGeometry) {
      this.conversionDump.updateDoneStatus(sourceId, nodeId, ResourceType.DRACO_GEOMETRY, false);

      const slpkCompressedGeometryPath = join(childPath, 'geometries');
      await this.writeQueue.enqueue({
        archiveKey: `${slpkChildPath}/geometries/1.bin.gz`,
        sourceId,
        outputId: nodeId,
        resourceType: ResourceType.DRACO_GEOMETRY,
        writePromise: () =>
          writeFileForSlpk(slpkCompressedGeometryPath, compressedGeometry, '1.bin')
      });
    }
  }

  /**
   * Write shared resources in a file
   * @param sharedResources - shared resource data object
   * @param childPath - a child path to write resources
   * @param slpkChildPath - resource path inside *slpk file
   * @param nodePath - a node path
   * @param sourceId - source filename
   * @param nodeId - nodeId of a converted node for the writing
   */
  private async _writeShared({
    sharedResources,
    childPath,
    slpkChildPath,
    nodePath,
    sourceId,
    nodeId
  }: {
    sharedResources: SharedResourcesArrays | null;
    childPath: string;
    slpkChildPath: string;
    nodePath: string;
    sourceId: string;
    nodeId: number;
  }): Promise<void> {
    if (!sharedResources) {
      return;
    }
    sharedResources.nodePath = nodePath;
    const sharedData = transform(sharedResources, sharedResourcesTemplate());
    const sharedDataStr = JSON.stringify(sharedData);
    this.conversionDump.updateDoneStatus(sourceId, nodeId, ResourceType.SHARED, false);
    const slpkSharedPath = join(childPath, 'shared');
    await this.writeQueue.enqueue({
      archiveKey: `${slpkChildPath}/shared/sharedResource.json.gz`,
      sourceId,
      outputId: nodeId,
      resourceType: ResourceType.SHARED,
      writePromise: () => writeFileForSlpk(slpkSharedPath, sharedDataStr, 'sharedResource.json')
    });
  }

  /**
   * Generates textures based on texture mime type and fill in textureSetDefinitions data.
   * @param texture - the texture image
   * @param childPath - a child path to write resources
   * @param slpkChildPath - the resource path inside *slpk file
   * @param sourceId - source filename
   * @param nodeId - nodeId of a converted node for the writing
   */
  // eslint-disable-next-line max-statements
  private async _writeTexture(
    texture: GLTFImagePostprocessed,
    childPath: string,
    slpkChildPath: string,
    sourceId: string,
    nodeId: number
  ): Promise<void> {
    if (texture) {
      const format = this._getFormatByMimeType(texture?.mimeType);
      const formats: TextureSetDefinitionFormats = [];
      const textureData = texture.bufferView!.data;

      switch (format) {
        case 'jpg':
        case 'png': {
          formats.push({name: '0', format});
          this.conversionDump.updateDoneStatus(
            sourceId,
            nodeId,
            `${ResourceType.TEXTURE}/${format}`,
            false
          );
          await this.writeTextureFile({
            textureData,
            name: '0',
            format,
            childPath,
            slpkChildPath,
            sourceId,
            nodeId
          });

          if (this.generateTextures) {
            formats.push({name: '1', format: 'ktx2'});
            // For Node.js texture.image.data is type of Buffer
            const copyArrayBuffer = texture.image.data.subarray();
            const arrayToEncode = new Uint8Array(copyArrayBuffer);
            const ktx2TextureData = encode(
              {...texture.image, data: arrayToEncode},
              // @ts-expect-error - Worker encoder typing is still WIP
              KTX2BasisWriterWorker,
              {
                ...KTX2BasisWriterWorker.options,
                ['ktx2-basis-writer']: {
                  // We need to load local fs workers because nodejs can't load workers from the Internet
                  workerUrl: './modules/textures/dist/ktx2-basis-writer-worker-node.js'
                },
                reuseWorkers: true,
                _nodeWorkers: true,
                useLocalLibraries: true
              }
            );

            this.conversionDump.updateDoneStatus(
              sourceId,
              nodeId,
              `${ResourceType.TEXTURE}/ktx2`,
              false
            );

            await this.writeTextureFile({
              textureData: ktx2TextureData,
              name: '1',
              format: 'ktx2',
              childPath,
              slpkChildPath,
              sourceId,
              nodeId
            });
          }

          break;
        }

        case 'ktx2': {
          formats.push({name: '1', format});
          this.conversionDump.updateDoneStatus(
            sourceId,
            nodeId,
            `${ResourceType.TEXTURE}/${format}`,
            false
          );
          await this.writeTextureFile({
            textureData,
            name: '1',
            format,
            childPath,
            slpkChildPath,
            sourceId,
            nodeId
          });

          if (this.generateTextures) {
            formats.push({name: '0', format: 'jpg'});
            const decodedFromKTX2TextureData = encode(texture.image.data[0], ImageWriter);
            this.conversionDump.updateDoneStatus(
              sourceId,
              nodeId,
              `${ResourceType.TEXTURE}/jpg`,
              false
            );
            await this.writeTextureFile({
              textureData: decodedFromKTX2TextureData,
              name: '0',
              format: 'jpg',
              childPath,
              slpkChildPath,
              sourceId,
              nodeId
            });
          }
          break;
        }
        default:
      }

      if (!this.layers0!.textureSetDefinitions!.length) {
        this.layers0!.textureSetDefinitions!.push({formats});
        this.layers0!.textureSetDefinitions!.push({formats, atlas: true});
        if (this.layers0!.textureSetDefinitions) {
          this.conversionDump.addTexturesDefinitions(this.layers0!.textureSetDefinitions);
        }
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
   * @param sourceId
   * @param nodeId
   */
  private async writeTextureFile({
    textureData,
    name,
    format,
    childPath,
    slpkChildPath,
    sourceId,
    nodeId
  }: {
    textureData: Uint8Array | Promise<ArrayBuffer>;
    name: string;
    format: 'jpg' | 'png' | 'ktx2';
    childPath: string;
    slpkChildPath: string;
    sourceId: string;
    nodeId: number;
  }): Promise<void> {
    const slpkTexturePath = join(childPath, 'textures');
    const compress = false;

    await this.writeQueue.enqueue({
      archiveKey: `${slpkChildPath}/textures/${name}.${format}`,
      sourceId,
      outputId: nodeId,
      resourceType: `${ResourceType.TEXTURE}/${format}`,
      writePromise: () =>
        writeFileForSlpk(slpkTexturePath, textureData, `${name}.${format}`, compress)
    });
  }

  /**
   * Write feature attributes in files
   * @param attributes - feature attributes
   * @param childPath - a child path to write resources
   * @param slpkChildPath - the resource path inside *slpk file
   * @param sourceId - source filename
   * @param nodeId - nodeId of a converted node for the writing
   */
  private async _writeAttributes(
    attributes: ArrayBuffer[] | null = [],
    childPath: string,
    slpkChildPath: string,
    sourceId: string,
    nodeId: number
  ): Promise<void> {
    if (attributes?.length && this.attributeMetadataInfo.attributeStorageInfo.length) {
      const minimumLength =
        attributes.length < this.attributeMetadataInfo.attributeStorageInfo.length
          ? attributes.length
          : this.attributeMetadataInfo.attributeStorageInfo.length;

      for (let index = 0; index < minimumLength; index++) {
        const folderName = this.attributeMetadataInfo.attributeStorageInfo[index].key;
        const fileBuffer = new Uint8Array(attributes[index]);
        this.conversionDump.updateDoneStatus(
          sourceId,
          nodeId,
          `${ResourceType.ATTRIBUTES}/${folderName}`,
          false
        );
        const slpkAttributesPath = join(childPath, 'attributes', folderName);
        await this.writeQueue.enqueue({
          archiveKey: `${slpkChildPath}/attributes/${folderName}.bin.gz`,
          sourceId,
          outputId: nodeId,
          resourceType: `${ResourceType.ATTRIBUTES}/${folderName}`,
          writePromise: () => writeFileForSlpk(slpkAttributesPath, fileBuffer, '0.bin')
        });
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
   * Creates attribute storage info based on either extension schema or property table.
   * @param tileContent - content of the source tile
   * @param propertyTable - feature properties from EXT_FEATURE_METADATA, EXT_STRUCTURAL_METADATA
   */
  private createAttributeStorageInfo(
    tileContent: Tiles3DTileContent | null,
    propertyTable: FeatureTableJson | null
  ): void {
    /*
    In case the tileset doesn't have either EXT_structural_metadata or EXT_feature_metadata
    that can be a source of attribute information so metadataClass is not specified
    we will collect attribute information for node attributes from the property table
    taken from each tile.
    */
    let attributeTypesMap: Record<string, Attribute> | null = null;
    if (this.options.metadataClass) {
      if (!this.attributeMetadataInfo.attributeStorageInfo.length && tileContent?.gltf) {
        attributeTypesMap = getAttributeTypesMapFromSchema(
          tileContent.gltf,
          this.options.metadataClass
        );
      }
    } else if (propertyTable) {
      attributeTypesMap = getAttributeTypesMapFromPropertyTable(propertyTable);
    }

    if (attributeTypesMap) {
      // Add new storage attributes, fields and create popupInfo
      this.attributeMetadataInfo.addMetadataInfo(attributeTypesMap);
    }
  }

  /**
   * Print statistics in the end of conversion
   * @param params - output files data
   */
  private async _finishConversion(params: {
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
    console.log('------------------------------------------------'); // eslint-disable-line no-undef, no-console
    console.log(`Finishing conversion of ${_3D_TILES}`); // eslint-disable-line no-undef, no-console
    console.log(`Total conversion time: ${conversionTime}`); // eslint-disable-line no-undef, no-console
    console.log('Vertex count: ', this.vertexCounter); // eslint-disable-line no-undef, no-console
    console.log('File(s) size: ', filesSize, ' bytes'); // eslint-disable-line no-undef, no-console
    console.log('Percentage of tiles with "ADD" refinement type:', addRefinementPercentage, '%'); // eslint-disable-line no-undef, no-console
    console.log('------------------------------------------------'); // eslint-disable-line no-undef, no-console
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
    const preloadOptions = await this.Loader.preload(this.options.inputUrl ?? '', options);
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
    if (preloadOptions.headers) {
      this.loadOptions.fetch = {
        ...this.loadOptions.fetch,
        headers: preloadOptions.headers
      };
      console.log('Authorization Bearer token has been updated'); // eslint-disable-line no-undef, no-console
    }
  }

  /** Do calculations of all tiles and tiles with "ADD" type of refinement.
   * @param tile
   */
  private _checkAddRefinementTypeForTile(tile: Tiles3DTileJSONPostprocessed): void {
    const ADD_TILE_REFINEMENT = TILE_REFINEMENT.ADD;

    if (tile.refine === ADD_TILE_REFINEMENT) {
      this.refinementCounter.tilesWithAddRefineCount += 1;
      console.warn('This tile uses "ADD" type of refinement'); // eslint-disable-line
    }

    this.refinementCounter.tilesCount += 1;
  }

  /**
   * Check if the tile's content format is supported by the converter
   * @param sourceTile
   * @returns
   */
  private isContentSupported(sourceTile: Tiles3DTileJSONPostprocessed): boolean {
    return ['b3dm', 'glTF', 'scenegraph'].includes(sourceTile.type || '');
  }
}
