import {load} from '@loaders.gl/core';
import {getSupportedGPUTextureFormats, selectSupportedBasisFormat} from '@loaders.gl/textures';
import {I3SNodePageLoader} from '../../i3s-node-page-loader';
import {normalizeTileNonUrlData} from '../parsers/parse-i3s';
import {getUrlWithToken, generateTilesetAttributeUrls} from '../utils/url-utils';
import type {LoaderOptions} from '@loaders.gl/loader-utils';
import {
  I3sTilesetHeader,
  LodSelection,
  NodePage,
  NodeInPage,
  Obb,
  meshGeometry,
  meshMaterial
} from '../../types';

/**
 * class I3SNodePagesTiles - loads nodePages and form i3s tiles from them
 */
export default class I3SNodePagesTiles {
  tileset: I3sTilesetHeader;
  nodePages: NodePage[] = [];
  pendingNodePages: {promise: Promise<NodePage>; status: 'Pending' | 'Done'}[] = [];
  nodesPerPage: number;
  options: LoaderOptions;
  lodSelectionMetricType: any;
  textureDefinitionsSelectedFormats: any[] = [];
  private textureLoaderOptions: {[key: string]: any} = {};

  /**
   * @constructs
   * Create a I3SNodePagesTiles instance.
   * @param tileset - i3s tileset header ('layers/0')
   * @param options - i3s loader options
   */
  constructor(tileset: I3sTilesetHeader, options: LoaderOptions) {
    this.tileset = {...tileset}; // spread the tileset to avoid circular reference
    // @ts-ignore
    this.nodesPerPage = tileset.nodePages.nodesPerPage;
    // @ts-ignore
    this.lodSelectionMetricType = tileset.nodePages.lodSelectionMetricType;
    this.options = options;

    this.initSelectedFormatsForTextureDefinitions(tileset);
  }

  /**
   * Loads some nodePage and return a particular node from it
   * @param id - id of node through all node pages
   */
  async getNodeById(id: number): Promise<NodeInPage> {
    const pageIndex = Math.floor(id / this.nodesPerPage);
    if (!this.nodePages[pageIndex] && !this.pendingNodePages[pageIndex]) {
      const nodePageUrl = getUrlWithToken(
        `${this.tileset.url}/nodepages/${pageIndex}`,
        this.options.i3s?.token
      );
      this.pendingNodePages[pageIndex] = {
        status: 'Pending',
        promise: load(nodePageUrl, I3SNodePageLoader, this.options)
      };
      this.nodePages[pageIndex] = await this.pendingNodePages[pageIndex].promise;
      this.pendingNodePages[pageIndex].status = 'Done';
    }
    if (this.pendingNodePages[pageIndex].status === 'Pending') {
      this.nodePages[pageIndex] = await this.pendingNodePages[pageIndex].promise;
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
    const node: NodeInPage = await this.getNodeById(id);
    const children: {id: number; obb: Obb}[] = [];
    for (const child of node.children || []) {
      const childNode = await this.getNodeById(child);
      children.push({
        id: child,
        obb: childNode.obb
      });
    }

    let contentUrl: string | null = null;
    let textureUrl: string | null = null;
    let materialDefinition = null;
    let textureFormat = 'jpg';
    let attributeUrls: string[] = [];
    let isDracoGeometry: boolean | null = false;

    if (node && node.mesh) {
      // Get geometry resource URL and type (compressed / non-compressed)
      const {url, isDracoGeometry: isDracoGeometryResult} = (node.mesh.geometry &&
        this.getContentUrl(node.mesh.geometry)) || {url: null, isDracoGeometry: null};
      contentUrl = url;
      isDracoGeometry = isDracoGeometryResult;

      const [textureData, nodeMaterialDefinition] = this.getInformationFromMaterial(
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

    const lodSelection = this.getLodSelection(node);

    return normalizeTileNonUrlData({
      id,
      lodSelection,
      obb: node.obb,
      contentUrl,
      // @ts-ignore
      textureUrl,
      attributeUrls,
      // @ts-ignore
      materialDefinition,
      // @ts-ignore
      textureFormat,
      textureLoaderOptions: this.textureLoaderOptions,
      children,
      // @ts-ignore
      isDracoGeometry
    });
  }

  /**
   * Forms url and type of geometry resource by nodepage's data and `geometryDefinitions` in the tileset
   * @param - data about the node's mesh from the nodepage
   * @returns {Object} -
   *   {string} url - url to the geometry resource
   *   {boolean} isDracoGeometry - whether the geometry resource contain DRACO compressed geometry
   */
  private getContentUrl(meshGeometryData: meshGeometry) {
    let result: {url: string; isDracoGeometry: boolean} | null = null;
    // @ts-ignore
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
   * @returns- Array of LodSelection
   */
  private getLodSelection(node): LodSelection[] {
    const lodSelection: LodSelection[] = [];
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
   * @param material - material data from nodepage
   * @returns {Object[]} - Couple [textureData, materialDefinition]
   * {string} textureData.name - path name of the texture
   * {string} textureData.format - format of the texture
   * materialDefinition - PBR-like material definition from `materialDefinitions`
   */
  private getInformationFromMaterial(
    material: meshMaterial
  ): [{name: string | null; format: string | null}, any] {
    const textureDataDefault = {name: null, format: null};
    if (material) {
      // @ts-ignore
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
   * @param tileset - I3S layer data
   * @returns
   */
  private initSelectedFormatsForTextureDefinitions(tileset: I3sTilesetHeader): void {
    this.textureDefinitionsSelectedFormats = [];
    const possibleI3sFormats = this.getSupportedTextureFormats();
    const textureSetDefinitions = tileset.textureSetDefinitions || [];
    for (const textureSetDefinition of textureSetDefinitions) {
      const formats = (textureSetDefinition && textureSetDefinition.formats) || [];
      let selectedFormat: {format: string; name: string} | null = null;
      for (const i3sFormat of possibleI3sFormats) {
        const format = formats.find((value) => value.format === i3sFormat);
        if (format) {
          selectedFormat = format;
          break;
        }
      }
      // For I3S 1.8 need to define basis target format to decode
      if (selectedFormat && selectedFormat.format === 'ktx2') {
        this.textureLoaderOptions.basis = {
          format: selectSupportedBasisFormat(),
          containerFormat: 'ktx2',
          module: 'encoder'
        };
      }

      this.textureDefinitionsSelectedFormats.push(selectedFormat);
    }
  }

  /**
   * Returns the array of supported texture format
   * @returns list of format strings
   */
  private getSupportedTextureFormats(): string[] {
    const formats: string[] = [];
    if (!this.options.i3s || this.options.i3s.useCompressedTextures) {
      // I3S 1.7 selection
      const supportedCompressedFormats = getSupportedGPUTextureFormats();
      // List of possible in i3s formats:
      // https://github.com/Esri/i3s-spec/blob/master/docs/1.7/textureSetDefinitionFormat.cmn.md
      if (supportedCompressedFormats.has('etc2')) {
        formats.push('ktx-etc2');
      }
      if (supportedCompressedFormats.has('dxt')) {
        formats.push('dds');
      }

      // I3S 1.8 selection
      // ktx2 wraps basis texture which at the edge case can be decoded as uncompressed image
      formats.push('ktx2');
    }

    formats.push('jpg');
    formats.push('png');
    return formats;
  }
}
