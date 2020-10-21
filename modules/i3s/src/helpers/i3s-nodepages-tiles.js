import {load} from '@loaders.gl/core';
import {normalizeTileNonUrlData} from '../lib/parsers/parse-i3s';
import {convertI3SObbToMbs} from '../utils/convert-i3s-obb-to-mbs';
import I3SNodePageLoader from '../i3s-node-page-loader';

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
      this.nodePages[pageIndex] = load(nodePageUrl, I3SNodePageLoader, this.options);
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
    for (const child of node.children || []) {
      const childNode = await this.getNodeById(child);
      children.push({
        id: child,
        obb: childNode.obb,
        mbs: convertI3SObbToMbs(childNode.obb)
      });
    }

    let contentUrl = null;
    let textureUrl = null;
    if (node && node.mesh) {
      if (node.mesh.geometry) {
        contentUrl = `${this.tileset.url}/nodes/${node.mesh.geometry.resource}/geometries/0`;
      }

      const textureName = this._getTextureName(node.mesh.material);
      if (textureName) {
        textureUrl = `${this.tileset.url}/nodes/${
          node.mesh.material.resource
        }/textures/${textureName}`;
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
      mbs: convertI3SObbToMbs(node.obb),
      contentUrl,
      textureUrl,
      children
    });
  }

  _getTextureName(material) {
    if (material) {
      const materialDefinition = this.tileset.materialDefinitions[material.definition];
      const textureSetDefinitionIndex =
        materialDefinition &&
        materialDefinition.pbrMetallicRoughness &&
        materialDefinition.pbrMetallicRoughness.baseColorTexture &&
        materialDefinition.pbrMetallicRoughness.baseColorTexture.textureSetDefinitionId;
      if (textureSetDefinitionIndex || textureSetDefinitionIndex === 0) {
        const textureSetDefinition = this.tileset.textureSetDefinitions[textureSetDefinitionIndex];
        const textureName =
          textureSetDefinition &&
          textureSetDefinition.formats &&
          textureSetDefinition.formats[0] &&
          textureSetDefinition.formats[0].name;
        return textureName;
      }
    }
    return null;
  }
}
