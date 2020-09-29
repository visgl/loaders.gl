import {load} from '@loaders.gl/core';
import {normalizeTileNonUrlData} from '../lib/parsers/parse-i3s';

export default class I3SNodePagesTiles {
  constructor(tileset, options) {
    this.tileset = tileset;
    this.nodesPerPage = tileset.nodePages.nodesPerPage;
    this.lodSelectionMetricType = tileset.nodePages.lodSelectionMetricType;
    this.options = options;
    this.nodePages = [];
  }

  async getNodeById(id) {
    const pageIndex = Math.floor(id / this.nodesPerPage);
    if (!this.nodePages[pageIndex]) {
      const nodePageUrl = `${this.tileset.url}/nodepages/${pageIndex}`;
      const options = {
        i3s: {
          ...this.tileset.fetchOptions,
          isNodePage: true
        }
      };
      this.nodePages[pageIndex] = load(nodePageUrl, this.tileset.loader, options);
      this.nodePages[pageIndex] = await this.nodePages[pageIndex];
    }
    if (this.nodePages[pageIndex] instanceof Promise) {
      this.nodePages[pageIndex] = await this.nodePages[pageIndex];
    }
    const nodeIndex = id % this.nodesPerPage;
    return this.nodePages[pageIndex].nodes[nodeIndex];
  }

  async formTileFromNodePages(id) {
    const node = await this.getNodeById(id);
    const children = [];
    for (const child of node.children) {
      const childNode = await this.getNodeById(child);
      children.push({
        id: child,
        obb: childNode.obb,
        mbs: this._convertObbToMbs(childNode.obb)
      });
    }

    let contentUrl = null;
    let textureUrl = null;
    if (node && node.mesh) {
      if (node.mesh.geometry) {
        contentUrl = `${this.tileset.url}/nodes/${node.mesh.geometry.resource}/geometries/0`;
      }
      if (node.mesh.material) {
        textureUrl = `${this.tileset.url}/nodes/${node.mesh.material.resource}/textures/0`;
      }
    }

    const lodSelection = [];
    if (this.lodSelectionMetricType === 'maxScreenThresholdSQ') {
      lodSelection.push({
        metricType: 'maxScreenThreshold',
        maxError: Math.sqrt(node.lodThreshold / (Math.PI * 0.25))
      });
    }
    lodSelection.push({
      metricType: this.lodSelectionMetricType,
      maxError: node.lodThreshold
    });

    return normalizeTileNonUrlData({
      id,
      lodSelection,
      obb: node.obb,
      mbs: this._convertObbToMbs(node.obb),
      contentUrl,
      textureUrl,
      children
    });
  }

  _convertObbToMbs(obb) {
    const halfSize = obb.halfSize;
    const radius =
      (Math.sqrt(
        Math.pow(Math.sqrt(Math.pow(halfSize[0], 2) + Math.pow(halfSize[1], 2)), 2) +
          Math.pow(halfSize[2] * 2, 2)
      ) +
        Math.sqrt(
          Math.pow(Math.sqrt(Math.pow(halfSize[0], 2) + Math.pow(halfSize[2], 2)), 2) +
            Math.pow(halfSize[1] * 2, 2)
        ) +
        Math.sqrt(
          Math.pow(Math.sqrt(Math.pow(halfSize[1], 2) + Math.pow(halfSize[2], 2)), 2) +
            Math.pow(halfSize[0] * 2, 2)
        )) /
      3;
    return [...obb.center, radius];
  }
}
