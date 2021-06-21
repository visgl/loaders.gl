import {load} from '@loaders.gl/core';
import {getSupportedGPUTextureFormats} from '@loaders.gl/textures';
import {Tileset, NodePage} from '../../types';
import {I3SNodePageLoader} from '../../i3s-node-page-loader';
import {normalizeTileNonUrlData} from '../parsers/parse-i3s';
import {getUrlWithToken, generateTilesetAttributeUrls} from '../utils/url-utils';

/**
 * class I3SNodePagesTiles - loads nodePages and form i3s tiles from them
 */
export default class I3SNodePagesTiles {
  tileset: Tileset;
  nodePages: NodePage[];
  nodesPerPage: number;
  options: {[key: string]: any};
  lodSelectionMetricType: any;
  textureDefinitionsSelectedFormats: any[];

  /**
   * @constructs
   * Create a I3SNodePagesTiles instance.
   * @param tileset - i3s tileset header ('layers/0')
   * @param options - i3s loader options
   */
  constructor(tileset: Tileset, options: object) {
    this.tileset = {...tileset}; // spread the tileset to avoid circular reference
    this.nodesPerPage = tileset.nodePages.nodesPerPage;
    this.lodSelectionMetricType = tileset.nodePages.lodSelectionMetricType;
    this.options = options;
    this.nodePages = [];
    this.textureDefinitionsSelectedFormats = [];

    this._initSelectedFormatsForTextureDefinitions(tileset);
  }

  /**
   * Loads some nodePage and return a particular node from it
   * @param id - id of node through all node pages
   */
  async getNodeById(id: number) {
    const pageIndex = Math.floor(id / this.nodesPerPage);
    if (!this.nodePages[pageIndex]) {
      const nodePageUrl = getUrlWithToken(
        `${this.tileset.url}/nodepages/${pageIndex}`,
        this.options.token
      );
      this.nodePages[pageIndex] = load(nodePageUrl, I3SNodePageLoader, this.options);
      this.nodePages[pageIndex] = await this.nodePages[pageIndex];
    }
    if (this.nodePages[pageIndex] instanceof Promise) {
      this.nodePages[pageIndex] = await this.nodePages[pageIndex];
    }
    const nodeIndex = id % this.nodesPerPage;
    return this.nodePages[pageIndex].nodes[nodeIndex];
  }

  /**
   * Forms tile header using node and tileset data
   * @param id - id of node through all node pages
   */
  // eslint-disable-next-line complexity
  async formTileFromNodePages(id: number) {
    const node = await this.getNodeById(id);
    const children: any[] = [];
    for (const child of node.children || []) {
      const childNode = await this.getNodeById(child);
      children.push({
        id: child,
        obb: childNode.obb
      });
    }

    let contentUrl = null;
    let textureUrl: string | null = null;
    let materialDefinition = null;
    let textureFormat = 'jpeg';
    let attributeUrls: string[] = [];
    let isDracoGeometry = false;

    if (node && node.mesh) {
      // Get geometry resource URL and type (compressed / non-compressed)
      const {url, isDracoGeometry: isDracoGeometryResult} = (node.mesh.geometry &&
        this._getContentUrl(node.mesh.geometry)) || {url: null, isDracoGeometry: null};
      contentUrl = url;
      isDracoGeometry = isDracoGeometryResult;

      const [textureData, nodeMaterialDefinition] = this._getInformationFromMaterial(
        node.mesh.material
      );
      materialDefinition = nodeMaterialDefinition;
      textureFormat = textureData.format || textureFormat;
      if (textureData.name) {
        textureUrl = `${this.tileset.url}/nodes/${node.mesh.material.resource}/textures/${textureData.name}`;
      }

      if (this.tileset.attributeStorageInfo) {
        attributeUrls = generateTilesetAttributeUrls(this.tileset, node.mesh.attribute.resource);
      }
    }

    const lodSelection = this._getLodSelection(node);

    return normalizeTileNonUrlData({
      id,
      lodSelection,
      obb: node.obb,
      contentUrl,
      textureUrl,
      attributeUrls,
      materialDefinition,
      textureFormat,
      children,
      isDracoGeometry
    });
  }

  /**
   * Forms url and type of geometry resource by nodepage's data and `geometryDefinitions` in the tileset
   * @param {Object} meshGeometryData - data about the node's mesh from the nodepage
   * @returns {Object} -
   *   {string} url - url to the geometry resource
   *   {boolean} isDracoGeometry - whether the geometry resource contain DRACO compressed geometry
   */
  _getContentUrl(meshGeometryData) {
    let result = {};
    const geometryDefinition = this.tileset.geometryDefinitions[meshGeometryData.definition];
    let geometryIndex = -1;
    // Try to find DRACO geometryDefinition of `useDracoGeometry` option is set
    if (this.options.i3s && this.options.i3s.useDracoGeometry) {
      geometryIndex = geometryDefinition.geometryBuffers.findIndex(
        (buffer) => buffer.compressedAttributes && buffer.compressedAttributes.encoding === 'draco'
      );
    }
    // If DRACO geometry is not applicable try to select non-compressed geometry
    if (geometryIndex === -1) {
      geometryIndex = geometryDefinition.geometryBuffers.findIndex(
        (buffer) => !buffer.compressedAttributes
      );
    }
    if (geometryIndex !== -1) {
      const isDracoGeometry = Boolean(
        geometryDefinition.geometryBuffers[geometryIndex].compressedAttributes
      );
      result = {
        url: `${this.tileset.url}/nodes/${meshGeometryData.resource}/geometries/${geometryIndex}`,
        isDracoGeometry
      };
    }
    return result;
  }

  /**
   * Forms 1.6 compatible LOD selection object from a nodepage's node data
   * @param {Object} node - a node from nodepage
   * @returns {Object[]} - Array of object of following properties:
   *   {string} metricType - the label of the LOD metric
   *   {number} maxError - the value of the metric
   */
  _getLodSelection(node): object[] {
    const lodSelection: object[] = [];
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
    return lodSelection;
  }

  /**
   * Returns information about texture and material from `materialDefinitions`
   * @param {Object} material - material data from nodepage
   * @returns {Object[]} - Couple [textureData, materialDefinition]
   * {string} textureData.name - path name of the texture
   * {string} textureData.format - format of the texture
   * materialDefinition - PBR-like material definition from `materialDefinitions`
   */
  _getInformationFromMaterial(material) {
    const textureDataDefault = {name: null, format: null};
    if (material) {
      const materialDefinition = this.tileset.materialDefinitions[material.definition];
      const textureSetDefinitionIndex =
        materialDefinition &&
        materialDefinition.pbrMetallicRoughness &&
        materialDefinition.pbrMetallicRoughness.baseColorTexture &&
        materialDefinition.pbrMetallicRoughness.baseColorTexture.textureSetDefinitionId;
      if (textureSetDefinitionIndex || textureSetDefinitionIndex === 0) {
        const textureData =
          this.textureDefinitionsSelectedFormats[textureSetDefinitionIndex] || textureDataDefault;
        return [textureData, materialDefinition];
      }
      return [textureDataDefault, materialDefinition];
    }
    return [textureDataDefault, null];
  }

  /**
   * Sets preferable and supported format for each textureDefinition of the tileset
   * @param {Object} tileset - I3S layer data
   * @returns {void}
   */
  _initSelectedFormatsForTextureDefinitions(tileset) {
    this.textureDefinitionsSelectedFormats = [];
    const possibleI3sFormats = this._getSupportedTextureFormats();
    const textureSetDefinitions = tileset.textureSetDefinitions || [];
    for (const textureSetDefinition of textureSetDefinitions) {
      const formats = (textureSetDefinition && textureSetDefinition.formats) || [];
      let selectedFormat = null;
      for (const i3sFormat of possibleI3sFormats) {
        const format = formats.find((value) => value.format === i3sFormat);
        if (format) {
          selectedFormat = format;
          break;
        }
      }
      this.textureDefinitionsSelectedFormats.push(selectedFormat);
    }
  }

  /**
   * Returns the array of supported texture format
   * @returns list of format strings
   */
  _getSupportedTextureFormats(): string[] {
    const formats: string[] = [];
    if (!this.options.i3s || this.options.i3s.useCompressedTextures) {
      const supportedCompressedFormats = getSupportedGPUTextureFormats();
      // List of possible in i3s formats:
      // https://github.com/Esri/i3s-spec/blob/master/docs/1.7/textureSetDefinitionFormat.cmn.md
      if (supportedCompressedFormats.has('etc2')) {
        formats.push('ktx-etc2');
      }
      if (supportedCompressedFormats.has('dxt')) {
        formats.push('dds');
      }
    }

    formats.push('jpg');
    formats.push('png');
    return formats;
  }
}
