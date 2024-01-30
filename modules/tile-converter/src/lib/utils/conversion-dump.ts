import {DUMP_FILE_SUFFIX} from '../../constants';
import {removeFile, writeFile} from './file-utils';
import {join} from 'path';

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
  nodeId: number;
  done: boolean;
  progress: Record<string, boolean>;
};

type TilesConverted = {
  nodes: NodeDoneStatus[];
};

export class ConversionDump {
  /** Conversion options */
  private options?: ConversionDumpOptions;
  /** Tiles conversion progress status map */
  tilesConverted: Record<string, TilesConverted>;

  constructor() {
    this.tilesConverted = {};
  }

  /**
   * Create a dump file with convertion options
   * @param options - converter options
   */
  async createDumpFile(options: ConversionDumpOptions): Promise<void> {
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
    } = options;
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

    try {
      await writeFile(
        options.outputPath,
        JSON.stringify({options: this.options}),
        `${options.tilesetName}${DUMP_FILE_SUFFIX}`
      );
    } catch (error) {
      console.log("Can't create dump file", error);
    }
  }

  /**
   * Update conversion status in the dump file
   */
  private async updateDumpFile(): Promise<void> {
    if (this.options?.outputPath && this.options.tilesetName) {
      try {
        await writeFile(
          this.options.outputPath,
          JSON.stringify({
            options: this.options,
            tilesConverted: this.tilesConverted
          }),
          `${this.options.tilesetName}${DUMP_FILE_SUFFIX}`
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
    if (this.options?.outputPath && this.options.tilesetName) {
      await removeFile(
        join(this.options.outputPath, `${this.options.tilesetName}${DUMP_FILE_SUFFIX}`)
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
  async addNode(filename: string, nodeId: number) {
    const {nodes} = this.getRecord(filename) || {nodes: []};
    nodes.push({nodeId, done: false, progress: {}});
    if (nodes.length === 1) {
      this.setRecord(filename, {nodes});
    }
    await this.updateDumpFile();
  }

  /**
   * Update done status object for the writing resources
   * @param fileName - key - source filename
   * @param nodeId - nodeId for the source filename
   * @param resourceType - resource type to update status
   * @param value - value
   */
  updateDoneStatus(filename: string, nodeId: number, resourceType: string, value: boolean) {
    const nodeDump = this.tilesConverted[filename]?.nodes.find(
      (element) => element.nodeId === nodeId
    );
    if (nodeDump) {
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
    changedRecords: {outputId?: number; sourceId?: string; resourceType?: string}[],
    writeResults: PromiseSettledResult<string | null>[]
  ) {
    for (let i = 0; i < changedRecords.length; i++) {
      if (changedRecords[i] && 'value' in writeResults[i]) {
        const {sourceId, resourceType, outputId} = changedRecords[i];
        if (!sourceId || !resourceType || !outputId) continue;
        for (const node of this.tilesConverted[sourceId].nodes) {
          if (node.nodeId === outputId) {
            node.progress[resourceType] = true;

            let done = false;
            for (const key in node.progress) {
              done = node.progress[key];
              if (!done) break;
            }
            node.done = done;
            if (node.done) {
              node.progress = {};
            }
            break;
          }
        }
      }
    }
    await this.updateDumpFile();
  }
}
