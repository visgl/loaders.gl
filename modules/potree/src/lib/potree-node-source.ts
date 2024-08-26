// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {Mesh} from '@loaders.gl/schema';
import {DataSource, DataSourceProps, LoaderOptions, resolvePath} from '@loaders.gl/loader-utils';
import {LASLoader} from '@loaders.gl/las';
import {PotreeMetadata} from '../types/potree-metadata';
import {POTreeNode} from '../parsers/parse-potree-hierarchy-chunk';
import {PotreeHierarchyChunkLoader} from '../potree-hierarchy-chunk-loader';
import {PotreeLoader} from '../potree-loader';
import {parseVersion} from '../utils/parse-version';

export type PotreeNodesSourceProps = DataSourceProps & {
  attributions?: string[];
  potree?: {
    loadOptions?: LoaderOptions; // PotreeLoaderOptions;
    // TODO - add options here
  };
};

/**
 * A Potree data source
 * @version 1.0 - https://github.com/potree/potree/blob/1.0RC/docs/file_format.md
 * @version 1.7 - https://github.com/potree/potree/blob/1.7/docs/potree-file-format.md
 * @note Point cloud nodes tile source
 */
export class PotreeNodesSource extends DataSource {
  /** Dataset base URL */
  baseUrl: string = '';
  /** Input data: string - dataset url, blob - single file data */
  data: string | Blob;
  /** Input props */
  props: PotreeNodesSourceProps;
  /** Meta information from `cloud.js` */
  metadata: PotreeMetadata | null = null;
  /** Root node */
  root: POTreeNode | null = null;
  /** Is data source ready to use after initial loading */
  isReady = false;

  private initPromise: Promise<void> | null = null;

  /**
   * @constructor
   * @param data  - if string - data set path url or path to `cloud.js` metadata file
   *              - if Blob - single file data
   * @param props - data source properties
   */
  constructor(data: string | Blob, props: PotreeNodesSourceProps) {
    super(props);
    this.props = props;
    this.data = data;
    this.makeBaseUrl(this.data);

    this.initPromise = this.init();
  }

  /** Initial data source loading */
  async init() {
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    this.metadata = await load(`${this.baseUrl}/cloud.js`, PotreeLoader);
    await this.loadHierarchy();
    this.isReady = true;
  }

  /** Is data set supported */
  isSupported(): boolean {
    const {minor, major} = parseVersion(this.metadata?.version ?? '');
    return (
      this.isReady &&
      major === 1 &&
      minor <= 8 &&
      typeof this.metadata?.pointAttributes === 'string' &&
      ['LAS', 'LAZ'].includes(this.metadata?.pointAttributes)
    );
  }

  /** Get content files extension */
  getContentExtension(): string | null {
    if (!this.isReady) {
      return null;
    }
    switch (this.metadata?.pointAttributes) {
      case 'LAS':
        return 'las';
      case 'LAZ':
        return 'laz';
      default:
        return 'bin';
    }
  }

  /**
   * Load octree node content
   * @param path array of numbers between 0-7 specifying successive octree divisions.
   * @return node content geometry or null if the node doesn't exist
   */
  async loadNodeContent(path: number[]): Promise<Mesh | null> {
    await this.initPromise;

    if (!this.isSupported()) {
      return null;
    }

    const isAvailable = await this.isNodeAvailable(path);
    if (isAvailable) {
      return load(
        `${this.baseUrl}/${this.metadata?.octreeDir}/r/r${path.join(
          ''
        )}.${this.getContentExtension()}`,
        LASLoader
      );
    }
    return null;
  }

  /**
   * Check if a node exists in the octree
   * @param path array of numbers between 0-7 specifying successive octree divisions
   * @returns true - the node does exist, false - the nodes doesn't exist
   */
  async isNodeAvailable(path: number[]): Promise<boolean> {
    if (this.metadata?.hierarchy) {
      return this.metadata.hierarchy.findIndex((item) => item[0] === `r${path.join()}`) !== -1;
    }

    if (!this.root) {
      return false;
    }
    let currentParent = this.root;
    let name = '';
    let result = true;
    for (const nodeLevel of path) {
      const newName = `${name}${nodeLevel}`;
      const node = currentParent.children.find((child) => child.name === newName);
      if (node) {
        currentParent = node;
        name = newName;
      } else {
        result = false;
        break;
      }
    }
    return result;
  }

  /**
   * Load data source hierarchy into tree of available nodes
   */
  private async loadHierarchy(): Promise<void> {
    this.root = await load(
      `${this.baseUrl}/${this.metadata?.octreeDir}/r/r.hrc`,
      PotreeHierarchyChunkLoader
    );
  }

  /**
   * Deduce base url from the input url sring
   * @param data - data source input data
   */
  private makeBaseUrl(data: string | Blob): void {
    this.baseUrl = typeof data === 'string' ? resolvePath(data) : '';
    if (this.baseUrl.endsWith('cloud.js')) {
      this.baseUrl = this.baseUrl.substring(0, -8);
    }
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.substring(0, -1);
    }
  }
}
