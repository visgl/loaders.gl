import {load} from '@loaders.gl/core';
import {MeshGeometry} from '@loaders.gl/schema';
import {DataSource, DataSourceProps, LoaderOptions, resolvePath} from '@loaders.gl/loader-utils';
import {LASLoader} from '@loaders.gl/las';
import {PotreeMetadata} from '../types/potree-metadata';
import {POTreeNode} from '../parsers/parse-potree-hierarchy-chunk';
import {PotreeHierarchyChunkLoader} from '../potree-hierarchy-chunk-loader';
import {PotreeLoader} from '../potree-loader';

export type PotreeNodesSourceProps = DataSourceProps & {
  attributions?: string[];
  potree?: {
    loadOptions?: LoaderOptions; // COPCLoaderOptions;
    // TODO - add options here
  };
};

/**
 * A Potree data source
 * @note Point cloud nodes tile source
 */
export class PotreeNodesSource extends DataSource {
  url: string;
  data: string | Blob;
  props: PotreeNodesSourceProps;
  metadata: PotreeMetadata | null = null;
  root: POTreeNode | null = null;
  isReady = false;

  private initPromise: Promise<void> | null = null;

  get isSupported(): boolean {
    return (
      this.isReady &&
      ['1.4', '1.7'].includes(this.metadata?.version ?? '') &&
      typeof this.metadata?.pointAttributes === 'string' &&
      ['LAS', 'LAZ'].includes(this.metadata?.pointAttributes)
    );
  }

  get contentExtension(): string | null {
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

  constructor(data: string | Blob, props: PotreeNodesSourceProps) {
    super(props);
    this.props = props;
    this.data = data;
    this.url = typeof data === 'string' ? resolvePath(data) : '';

    this.initPromise = this.init();
  }

  async init() {
    this.metadata = await load(`${this.url}/cloud.js`, PotreeLoader);
    await this.loadHierarchy();
    this.isReady = true;
  }

  async loadNodeContent(path: number[]): Promise<MeshGeometry | null> {
    await this.initPromise;

    if (!this.isSupported) {
      return null;
    }

    const isAvailable = await this.getNodeAvailability(path);
    if (isAvailable) {
      return load(
        `${this.url}/${this.metadata?.octreeDir}/r/r${path.join()}.${this.contentExtension}`,
        LASLoader
      );
    }
    return null;
  }

  async loadHierarchy(): Promise<void> {
    await this.initPromise;
    this.root = await load(
      `${this.url}/${this.metadata?.octreeDir}/r/r.hrc`,
      PotreeHierarchyChunkLoader
    );
  }

  async getNodeAvailability(path: number[]): Promise<boolean> {
    if (this.metadata?.hierarchy) {
      return this.metadata.hierarchy.findIndex((item) => item[0] === `r${path.join()}`) !== -1;
    }

    if (!this.root) {
      return false;
    }
    let currentParent = this.root;
    let name = '';
    let result = true;
    for (const levelNode of path) {
      const newName = `${name}${levelNode}`;
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
}
