// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PotreeSourceOptions} from '../potree-source';
import {load} from '@loaders.gl/core';
import {Mesh} from '@loaders.gl/schema';
import {DataSource, resolvePath} from '@loaders.gl/loader-utils';
import {LASLoader} from '@loaders.gl/las';
import {PotreeBoundingBox, PotreeMetadata} from '../types/potree-metadata';
import {POTreeNode} from '../parsers/parse-potree-hierarchy-chunk';
import {PotreeHierarchyChunkLoader} from '../potree-hierarchy-chunk-loader';
import {PotreeLoader} from '../potree-loader';
import {parseVersion} from '../utils/parse-version';
import {Proj4Projection} from '@math.gl/proj4';
import {LASMesh} from '@loaders.gl/las/src/lib/las-types';
import {createProjection} from '../utils/projection-utils';
import {getCartographicOriginFromBoundingBox} from '../utils/bounding-box-utils';

// https://github.com/visgl/deck.gl/blob/9548f43cba2234a1f4877b6b17f6c88eb35b2e08/modules/core/src/lib/constants.js#L27
// Describes the format of positions
export enum COORDINATE_SYSTEM {
  /**
   * `LNGLAT` if rendering into a geospatial viewport, `CARTESIAN` otherwise
   */
  DEFAULT = -1,
  /**
   * Positions are interpreted as [lng, lat, elevation]
   * lng lat are degrees, elevation is meters. distances as meters.
   */
  LNGLAT = 1,
  /**
   * Positions are interpreted as meter offsets, distances as meters
   */
  METER_OFFSETS = 2,
  /**
   * Positions are interpreted as lng lat offsets: [deltaLng, deltaLat, elevation]
   * deltaLng, deltaLat are delta degrees, elevation is meters.
   * distances as meters.
   */
  LNGLAT_OFFSETS = 3,
  /**
   * Non-geospatial
   */
  CARTESIAN = 0
}

export interface PotreeNodeMesh extends LASMesh {
  cartographicOrigin: number[];
  coordinateSystem: number;
}

/**
 * A Potree data source
 * @version 1.0 - @see https://github.com/potree/potree/blob/1.0RC/docs/file_format.md
 * @version 1.7 - @see https://github.com/potree/potree/blob/1.7/docs/potree-file-format.md
 * @note Point cloud nodes tile source
 */
export class PotreeNodesSource extends DataSource<string, PotreeSourceOptions> {
  /** Dataset base URL */
  baseUrl: string = '';
  /** Meta information from `cloud.js` */
  metadata: PotreeMetadata | null = null;
  /** Root node */
  root: POTreeNode | null = null;
  /** Is data source ready to use after initial loading */
  isReady = false;
  /** local CRS to WGS84 projection */
  projection: Proj4Projection | null = null;
  /** The data set minimum bounding box */
  boundingBox?: PotreeBoundingBox;

  private initPromise: Promise<void> | null = null;

  /**
   * @constructor
   * @param data  - if string - data set path url or path to `cloud.js` metadata file
   *              - if Blob - single file data
   * @param options - data source properties
   */
  constructor(data: string, options: PotreeSourceOptions) {
    super(data, options);
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
    this.projection = createProjection(this.metadata?.projection);
    this.parseBoundingVolume();

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
   * @param nodeName name of a node, string of numbers in range 0..7
   * @return node content geometry or null if the node doesn't exist
   */
  async loadNodeContent(nodeName: string): Promise<Mesh | null> {
    await this.initPromise;

    if (!this.isSupported()) {
      return null;
    }

    const isAvailable = await this.isNodeAvailable(nodeName);
    if (isAvailable) {
      const result: PotreeNodeMesh = (await load(
        `${this.baseUrl}/${this.metadata?.octreeDir}/r/r${nodeName}.${this.getContentExtension()}`,
        LASLoader
      )) as PotreeNodeMesh;

      if (result) {
        result.cartographicOrigin = getCartographicOriginFromBoundingBox(
          this.projection,
          result.header?.boundingBox
        );
        const position = result.attributes.POSITION.value as Float32Array;
        for (let i = 0; i < (result.header?.vertexCount ?? 0); i++) {
          let vertex: Float32Array | number[] = position.slice(i * 3, i * 3 + 2);
          if (this.projection) {
            vertex = this.projection.project(Array.from(vertex));
          }

          const offsets = [
            vertex[0] - result.cartographicOrigin[0],
            vertex[1] - result.cartographicOrigin[1],
            position[i * 3 + 2] - result.cartographicOrigin[2]
          ];
          position.set(offsets, i * 3);
        }
        result.attributes.positions = result.attributes.POSITION;
        result.attributes.colors = result.attributes.COLOR_0;
        result.attributes.normals = result.attributes.NORMAL;

        result.coordinateSystem = COORDINATE_SYSTEM.LNGLAT_OFFSETS;
        return result;
      }
    }
    return null;
  }

  /**
   * Check if a node exists in the octree
   * @param nodeName name of a node, string of numbers in range 0..7
   * @returns true - the node does exist, false - the nodes doesn't exist
   */
  async isNodeAvailable(nodeName: string): Promise<boolean> {
    if (this.metadata?.hierarchy) {
      return this.metadata.hierarchy.findIndex((item) => item[0] === `r${nodeName}`) !== -1;
    }

    if (!this.root) {
      return false;
    }
    let currentParent = this.root;
    let name = '';
    let result = true;
    for (const char of nodeName) {
      const newName = `${name}${char}`;
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

  private parseBoundingVolume(): void {
    if (this.metadata?.projection && this.metadata.tightBoundingBox) {
      const projection = new Proj4Projection({
        from: this.metadata.projection,
        to: 'WGS84'
      });

      const {lx, ly, ux, uy} = this.metadata.tightBoundingBox;
      const lCoord = [lx, ly];
      const wgs84LCood = projection.project(lCoord);

      const uCoord = [ux, uy];
      const wgs84UCood = projection.project(uCoord);

      this.boundingBox = {
        ...this.metadata.tightBoundingBox,
        lx: wgs84LCood[0],
        ly: wgs84LCood[1],
        ux: wgs84UCood[0],
        uy: wgs84UCood[1]
      };
    } else {
      this.boundingBox = this.metadata?.tightBoundingBox;
    }
  }
}
