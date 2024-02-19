import {isDeepStrictEqual} from 'util';
import {DUMP_FILE_SUFFIX} from '../../constants';
import {isFileExists, openJson, removeFile, renameFile, writeFile} from './file-utils';
import {join} from 'path';
import {BoundingVolumes, I3SMaterialDefinition, TextureSetDefinitionFormats} from '@loaders.gl/i3s';
import {AttributeMetadataInfoObject} from '../../i3s-converter/helpers/attribute-metadata-info';
import process from 'process';
import Ajv from 'ajv';
import {dumpJsonSchema} from '../json-schemas/conversion-dump-json-schema';

export type ConversionDumpOptions = {
  inputUrl: string;
  outputPath: string;
  tilesetName: string;
  maxDepth: number;
  slpk: boolean;
  egmFilePath: string;
  token: string;
  draco: boolean;
  mergeMaterials: boolean;
  generateTextures: boolean;
  generateBoundingVolumes: boolean;
  metadataClass: string;
  analyze: boolean;
};

type NodeDoneStatus = {
  nodeId: number | string;
  done: boolean;
  progress?: Record<string, boolean>;
  dumpMetadata?: DumpMetadata;
};

type TilesConverted = {
  nodes: NodeDoneStatus[];
};

export type DumpMetadata = {
  boundingVolumes: BoundingVolumes | null;
  attributesCount?: number;
  featureCount: number | null;
  geometry: boolean;
  hasUvRegions: boolean;
  materialId: number | null;
  texelCountHint?: number;
  vertexCount: number | null;
};

export type TextureSetDefinition = {
  formats: TextureSetDefinitionFormats;
  atlas?: boolean;
};

export class ConversionDump {
  /**Restored/resumed dump indicator */
  restored: boolean = false;
  /** Conversion options */
  private options?: ConversionDumpOptions;
  /** Tiles conversion progress status map */
  tilesConverted: Record<string, TilesConverted>;
  /** Textures formats definitions */
  textureSetDefinitions?: TextureSetDefinition[];
  /** Attributes Metadata */
  attributeMetadataInfo?: AttributeMetadataInfoObject;
  /** Array of materials definitions */
  materialDefinitions?: I3SMaterialDefinition[];

  constructor() {
    this.tilesConverted = {};
  }

  /**
   * Create a dump with convertion options
   * @param currentOptions - converter options
   */
  async createDump(currentOptions: ConversionDumpOptions): Promise<void> {
    const {
      tilesetName,
      slpk,
      egmFilePath,
      inputUrl,
      outputPath,
      draco = true,
      maxDepth,
      token,
      generateTextures,
      generateBoundingVolumes,
      mergeMaterials = true,
      metadataClass,
      analyze = false
    } = currentOptions;
    this.options = {
      tilesetName,
      slpk,
      egmFilePath,
      inputUrl,
      outputPath,
      draco,
      maxDepth,
      token,
      generateTextures,
      generateBoundingVolumes,
      mergeMaterials,
      metadataClass,
      analyze
    };

    const dumpFilename = join(
      this.options.outputPath,
      this.options.tilesetName,
      `${this.options.tilesetName}${DUMP_FILE_SUFFIX}`
    );
    if (await isFileExists(dumpFilename)) {
      try {
        const dump = await openJson(
          join(this.options.outputPath, this.options.tilesetName),
          `${this.options.tilesetName}${DUMP_FILE_SUFFIX}`
        );

        const {
          options,
          tilesConverted,
          textureSetDefinitions,
          attributeMetadataInfo,
          materialDefinitions
        } = dump;

        const ajv = new Ajv();
        const dumpJsonValidate = ajv.compile(dumpJsonSchema);
        const isDumpValid = dumpJsonValidate(dump);

        if (isDumpValid && isDeepStrictEqual(options, JSON.parse(JSON.stringify(this.options)))) {
          this.tilesConverted = tilesConverted;
          this.textureSetDefinitions = textureSetDefinitions;
          this.attributeMetadataInfo = attributeMetadataInfo;
          this.materialDefinitions = materialDefinitions;
          this.restored = true;
          return;
        }
      } catch (error) {
        console.log("Can't open dump file", error);
      }
    }
    await this.deleteDumpFile();
  }

  /**
   * Reset a dump
   */
  reset(): void {
    this.restored = false;
    this.tilesConverted = {};
    if (this.textureSetDefinitions) {
      delete this.textureSetDefinitions;
    }
    if (this.attributeMetadataInfo) {
      delete this.attributeMetadataInfo;
    }
    if (this.materialDefinitions) {
      delete this.materialDefinitions;
    }
  }

  /**
   * Update conversion status in the dump file
   */
  private async updateDumpFile(): Promise<void> {
    if (this.options?.outputPath && this.options.tilesetName) {
      try {
        const time = process.hrtime();
        await writeFile(
          join(this.options.outputPath, this.options.tilesetName),
          JSON.stringify({
            options: this.options,
            tilesConverted: this.tilesConverted,
            textureSetDefinitions: this.textureSetDefinitions,
            attributeMetadataInfo: this.attributeMetadataInfo,
            materialDefinitions: this.materialDefinitions
          }),
          `${this.options.tilesetName}${DUMP_FILE_SUFFIX}.${time[0]}.${time[1]}`
        );
        await renameFile(
          join(
            this.options.outputPath,
            this.options.tilesetName,
            `${this.options.tilesetName}${DUMP_FILE_SUFFIX}.${time[0]}.${time[1]}`
          ),
          join(
            this.options.outputPath,
            this.options.tilesetName,
            `${this.options.tilesetName}${DUMP_FILE_SUFFIX}`
          )
        );
      } catch (error) {
        console.log("Can't update dump file", error);
      }
    }
  }

  /**
   * Delete a dump file
   */
  async deleteDumpFile(): Promise<void> {
    if (
      this.options?.outputPath &&
      this.options.tilesetName &&
      (await isFileExists(
        join(
          this.options.outputPath,
          this.options.tilesetName,
          `${this.options.tilesetName}${DUMP_FILE_SUFFIX}`
        )
      ))
    ) {
      await removeFile(
        join(
          this.options.outputPath,
          this.options.tilesetName,
          `${this.options.tilesetName}${DUMP_FILE_SUFFIX}`
        )
      );
    }
  }

  /**
   * Get record from the tilesConverted Map
   * @param fileName - source filename
   * @returns existing object from the tilesConverted Map
   */
  private getRecord(fileName: string) {
    return this.tilesConverted[fileName];
  }

  /**
   * Set a record for the dump file
   * @param fileName - key - source filename
   * @param object - value
   */
  private setRecord(fileName: string, object: any) {
    this.tilesConverted[fileName] = object;
  }

  /**
   * Add a node into the dump file for the source file record
   * @param fileName - source filename
   * @param nodeId - nodeId of the node
   */
  async addNode(filename: string, nodeId: number | string, dumpMetadata?: DumpMetadata) {
    const {nodes} = this.getRecord(filename) || {nodes: []};
    nodes.push({nodeId, done: false, dumpMetadata});
    if (nodes.length === 1) {
      this.setRecord(filename, {nodes});
    }
    await this.updateDumpFile();
  }

  /**
   * Clear dump record got the source filename
   * @param fileName - source filename
   */
  clearDumpRecord(filename: string) {
    this.setRecord(filename, {nodes: []});
  }

  /**
   * Add textures definitions into the dump file
   * @param textureDefinitions - textures definitions array
   */
  addTexturesDefinitions(textureDefinitions: TextureSetDefinition[]) {
    this.textureSetDefinitions = textureDefinitions;
  }

  /**
   * Update done status object for the writing resources
   * @param fileName - key - source filename
   * @param nodeId - nodeId for the source filename
   * @param resourceType - resource type to update status
   * @param value - value
   */
  updateDoneStatus(
    filename: string,
    nodeId: number | string,
    resourceType: string,
    value: boolean
  ) {
    const nodeDump = this.tilesConverted[filename]?.nodes.find(
      (element) => element.nodeId === nodeId
    );
    if (nodeDump) {
      if (!nodeDump.progress) {
        nodeDump.progress = {};
      }
      nodeDump.progress[resourceType] = value;
      if (!value) {
        nodeDump.done = false;
      }
    }
  }

  /**
   * Update dump file according to writing results
   * @param changedRecords - array of parameters ids for the written resources
   * @param writeResults - array of writing resource files results
   */
  async updateConvertedTilesDump(
    changedRecords: {outputId?: number | string; sourceId?: string; resourceType?: string}[],
    writeResults: PromiseSettledResult<string | null>[]
  ) {
    for (let i = 0; i < changedRecords.length; i++) {
      if (changedRecords[i] && 'value' in writeResults[i]) {
        const {sourceId, resourceType, outputId} = changedRecords[i];
        if (!sourceId || !resourceType || !outputId) continue;
        for (const node of this.tilesConverted[sourceId].nodes) {
          if (node.nodeId === outputId && node.progress) {
            node.progress[resourceType] = true;

            let done = false;
            for (const key in node.progress) {
              done = node.progress[key];
              if (!done) break;
            }
            node.done = done;
            if (node.done) {
              delete node.progress;
            }
            break;
          }
        }
      }
    }
    await this.updateDumpFile();
  }

  /**
   * Update 3d-tiles-converter dump file
   * @param filename - source filename
   * @param nodeId - nodeId
   * @param done - conversion status
   */
  async updateConvertedNodesDumpFile(
    filename: string,
    nodeId: number | string,
    done: boolean
  ): Promise<void> {
    const nodeDump = this.tilesConverted[filename]?.nodes.find(
      (element) => element.nodeId === nodeId
    );
    if (nodeDump) {
      nodeDump.done = done;
      await this.updateDumpFile();
    }
  }

  /**
   * Check is source file conversion complete
   * @param filename - source filename
   * @returns true if source file conversion complete
   */
  isFileConversionComplete(filename: string): boolean {
    let result = true;
    for (const node of this.tilesConverted[filename]?.nodes || []) {
      if (!node.done) {
        result = false;
        break;
      }
    }
    return result && this.tilesConverted[filename]?.nodes?.length > 0;
  }

  /**
   * Set materialDefinitions into a dump
   * @param materialDefinitions - Array materialDefinitions
   */
  setMaterialsDefinitions(materialDefinitions: I3SMaterialDefinition[]): void {
    this.materialDefinitions = materialDefinitions;
  }
}
