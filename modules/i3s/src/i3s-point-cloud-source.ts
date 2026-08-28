// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {DataSourceOptions, ReadableFile} from '@loaders.gl/loader-utils';
import {BlobFile, HttpFile} from '@loaders.gl/loader-utils';
import {makeMeshArrowTable} from '@loaders.gl/schema-utils';
import type {MeshAttributes} from '@loaders.gl/schema';
import {Matrix4, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import type {
  PointCloudBoundingVolume,
  PointCloudTileContent,
  PointCloudTileHeader,
  PointCloudTilesetSource,
  PointCloudCoordinateSystem,
  TilesetSpatialOptions,
  TilesetSpatialReference
} from '@loaders.gl/tiles';
import {
  applyTilesetSpatialOptions,
  getI3SSpatialReference,
  I3SSpatialTransformer
} from '@loaders.gl/tiles';
import {DataSource} from '@loaders.gl/loader-utils';
import {parseSLPKArchive} from './lib/parsers/parse-slpk/parse-slpk';
import type {SLPKArchive} from './lib/parsers/parse-slpk/slpk-archieve';
import {I3SLEPCCDecoder} from './i3s-lepcc';
import {I3SPointCloudNodePageSchema, I3SPointCloudSceneLayerSchema} from './i3s-zod-schema';
import type {
  I3SPointCloudAttributeInfo,
  I3SPointCloudNode,
  I3SPointCloudNodePage,
  SceneLayer3D
} from './types';
import {getUrlWithToken} from './lib/utils/url-utils';

/** Options for an {@link I3SPointCloudSource}. */
export type I3SPointCloudSourceOptions = DataSourceOptions & {
  /** Shared target CRS options. */
  spatial?: TilesetSpatialOptions;
  /** I3S point-cloud options. */
  i3s?: {
    /** ArcGIS access token. */
    token?: string;
    /** Verify LEPCC checksums. Defaults to true. */
    verifyChecksum?: boolean;
    /** Coordinate system used by the returned point attributes. */
    coordinateSystem?: PointCloudCoordinateSystem;
  };
};

/**
 * Point Cloud source for REST-served I3S layers and SLPK archives.
 *
 * The source intentionally implements the generic tiles point-cloud contract,
 * allowing applications to use it with {@link PointCloudTileset} while the
 * existing mesh-oriented I3S loader remains backwards compatible.
 */
export class I3SPointCloudSource
  extends DataSource<string | Blob, I3SPointCloudSourceOptions>
  implements PointCloudTilesetSource<string | Blob, I3SPointCloudSourceOptions>
{
  /** Whether layer metadata and the resource index have been initialized. */
  isReady = false;

  /** Parsed Point Cloud layer metadata. */
  metadata: SceneLayer3D | null = null;

  /** Normalized source CRS metadata populated during initialization. */
  spatialReference: TilesetSpatialReference | null = null;

  /** Random-access archive used for SLPK-backed resources. */
  private archive: SLPKArchive | null = null;
  /** Node pages cached by physical page index. */
  private readonly nodePages = new Map<number, I3SPointCloudNodePage>();
  /** Resolved hierarchy nodes cached by global node id. */
  private readonly nodes = new Map<string, I3SPointCloudNode>();
  /** Decoder used for LEPCC geometry and attribute resources. */
  private readonly decoder: I3SLEPCCDecoder;
  /** Normalized REST layer base URL. */
  private baseUrl = '';
  /** Number of global nodes stored in each physical index page. */
  private nodesPerPage = 1;
  /** Global node id of the hierarchy root. */
  private rootIndex = 0;
  /** Shared adapter used when a target CRS has been requested. */
  private spatialTransformer: I3SSpatialTransformer | null = null;
  /** Transformed root header cached for view-state initialization. */
  private rootTileHeader: PointCloudTileHeader | null = null;

  /**
   * Creates an I3S Point Cloud source.
   * @param data Layer REST URL or an SLPK Blob/URL.
   * @param options Source and loader options.
   */
  constructor(data: string | Blob, options: I3SPointCloudSourceOptions = {}) {
    super(data, options);
    this.decoder = new I3SLEPCCDecoder({verifyChecksum: options.i3s?.verifyChecksum});
  }

  /** Load and validate the scene-layer metadata. */
  async initialize(): Promise<void> {
    if (this.isReady) {
      return;
    }

    if (this.isArchiveInput()) {
      const file = await this.getArchiveFile();
      this.archive = await parseSLPKArchive(file);
    }

    const layerJson = await this.readJson('');
    const pointCloudLayer = I3SPointCloudSceneLayerSchema.parse(layerJson);
    this.metadata = pointCloudLayer as SceneLayer3D;
    this.spatialReference = applyTilesetSpatialOptions(
      getI3SSpatialReference(this.metadata),
      this.options.spatial
    );
    if (this.spatialReference.status === 'unresolved') {
      throw new Error(
        this.spatialReference.warnings[0] ||
          'I3S spatial operations cannot be resolved from the supplied metadata and options'
      );
    }
    if (this.spatialReference.status === 'transformable') {
      this.spatialTransformer = new I3SSpatialTransformer(
        this.spatialReference,
        this.options.spatial
      );
      this.spatialReference = this.spatialTransformer.spatialReference;
    }
    this.baseUrl = this.url.replace(/\/+$/, '');
    this.nodesPerPage = Math.max(
      1,
      Number(layerJson.nodePages?.nodesPerPage || layerJson.store?.index?.nodePerIndexBlock || 1)
    );
    this.rootIndex = Number(layerJson.nodePages?.rootIndex || 0);
    this.isReady = true;
  }

  /** Return the parsed scene-layer metadata. */
  async getMetadata(): Promise<SceneLayer3D> {
    await this.initialize();
    return this.metadata!;
  }

  /** Return the root point-cloud tile header. */
  async getRootTile(): Promise<PointCloudTileHeader> {
    await this.initialize();
    const node = await this.getNode(this.rootIndex);
    this.rootTileHeader ||= await this.makeTileHeader(this.rootIndex, node, 0);
    return this.rootTileHeader;
  }

  /** Return the children of a point-cloud tile. */
  async getChildren(tile: PointCloudTileHeader): Promise<PointCloudTileHeader[]> {
    await this.initialize();
    const node = this.nodes.get(tile.id);
    if (!node || !node.childCount || node.firstChild === undefined) {
      return [];
    }
    const children: PointCloudTileHeader[] = [];
    for (let index = 0; index < node.childCount; index++) {
      const childId = node.firstChild + index;
      const child = await this.getNode(childId);
      children.push(await this.makeTileHeader(childId, child, tile.level + 1));
    }
    return children;
  }

  /** Decode geometry and attribute resources for one point-cloud tile. */
  async loadTileContent(tile: PointCloudTileHeader): Promise<PointCloudTileContent | null> {
    await this.initialize();
    const node = this.nodes.get(tile.id);
    if (!node) {
      return null;
    }

    const resourceId = String(node.resourceId);
    const geometryResource = node.geometryResource ?? 0;
    const geometryBytes = await this.readBinary(
      this.resourceCandidates(`nodes/${resourceId}/geometries/${geometryResource}`)
    );
    const positions = this.decoder.decodeXyz(new Uint8Array(geometryBytes));
    const pointCount = positions.length / 3;
    if (node.vertexCount && node.vertexCount !== pointCount) {
      throw new Error(
        `I3S PointCloud geometry count mismatch: expected ${node.vertexCount}, got ${pointCount}`
      );
    }

    // MeshArrowTable's canonical POSITION field is Float32. Preserve the tile
    // origin separately in the returned content so renderers can reconstruct
    // full precision without widening the shared Arrow schema.
    const sourceCenter = Array.from(node.obb.center as number[]);
    const normalizedPositions = this.spatialTransformer
      ? await this.spatialTransformer.transformPositionsAsync(positions, sourceCenter)
      : normalizePointPositions(
          positions,
          tile.boundingVolume.center,
          this.options.i3s?.coordinateSystem
        );
    const attributes: MeshAttributes = {
      POSITION: {value: normalizedPositions.positions, size: 3}
    };
    const descriptors = this.getAttributeDescriptors();
    await Promise.all(
      descriptors.map(async descriptor => {
        const bytes = await this.readBinaryOptional(
          this.resourceCandidates(
            `nodes/${resourceId}/attributes/${descriptor.key || descriptor.name || ''}/${
              descriptor.resource ?? 0
            }`,
            descriptor.key || descriptor.name
          )
        );
        if (!bytes) {
          return;
        }
        const decoded = this.decodeAttribute(bytes, descriptor);
        if (decoded.value.length !== pointCount * decoded.size) {
          throw new Error(
            `I3S PointCloud attribute ${descriptor.name || descriptor.key || 'unknown'} count mismatch`
          );
        }
        const attributeName = this.getAttributeName(descriptor, decoded.kind);
        attributes[attributeName] = {
          value: decoded.value,
          size: decoded.size
        };
      })
    );

    const volume = tile.spatialBoundingVolume || tile.boundingVolume;
    const table = makeMeshArrowTable(attributes, {
      topology: 'point-list',
      boundingBox: volume.cartographicBounds
    });
    return {
      data: table,
      pointCount,
      cartographicOrigin: normalizedPositions.cartographicOrigin,
      coordinateSystem: normalizedPositions.coordinateSystem,
      modelMatrix: normalizedPositions.modelMatrix,
      spatialReference: this.spatialTransformer?.spatialReference,
      spatialBoundingVolume: tile.spatialBoundingVolume
    };
  }

  /** Return a view state suitable for PointCloudTileset initialization. */
  getViewState() {
    if (this.spatialTransformer && this.rootTileHeader) {
      const cartographicCenter = this.rootTileHeader.boundingVolume.center;
      return {
        cartographicCenter,
        boundingVolume: this.rootTileHeader.boundingVolume,
        zoom: 1
      };
    }
    const extent = this.metadata?.fullExtent;
    const center = extent?.xmin !== undefined ? [extent.xmin, extent.ymin, 0] : undefined;
    return center ? {cartographicCenter: center} : {};
  }

  private isArchiveInput(): boolean {
    return this.data instanceof Blob || /\.slpk(?:$|[?#])/i.test(this.url);
  }

  private async getArchiveFile(): Promise<ReadableFile> {
    if (this.data instanceof Blob) {
      return new BlobFile(this.data);
    }
    return new HttpFile(getUrlWithToken(this.url, this.options.i3s?.token || null), {
      fetch: this.fetch
    });
  }

  private async getNode(nodeId: number): Promise<I3SPointCloudNode> {
    const cached = this.nodes.get(String(nodeId));
    if (cached) {
      return cached;
    }
    const pageIndex = Math.floor(nodeId / this.nodesPerPage);
    const page = await this.getNodePage(pageIndex);
    const nodeIndex = nodeId % this.nodesPerPage;
    const node = page.nodes[nodeIndex];
    if (!node) {
      throw new Error(`I3S PointCloud node ${nodeId} is not present in node page ${pageIndex}`);
    }
    this.nodes.set(String(nodeId), node);
    return node;
  }

  private async getNodePage(pageIndex: number): Promise<I3SPointCloudNodePage> {
    const cached = this.nodePages.get(pageIndex);
    if (cached) {
      return cached;
    }
    const json = await this.readJson(`nodepages/${pageIndex}`);
    const page = I3SPointCloudNodePageSchema.parse(json) as I3SPointCloudNodePage;
    this.nodePages.set(pageIndex, page);
    return page;
  }

  private async makeTileHeader(
    nodeId: number,
    node: I3SPointCloudNode,
    level: number
  ): Promise<PointCloudTileHeader> {
    const center = Array.from(node.obb.center as number[]);
    const halfSize = Array.from(node.obb.halfSize as number[]);
    const radius = Math.hypot(...halfSize);
    const commonHeader = {
      id: String(nodeId),
      level,
      pointCount: node.vertexCount,
      geometricError: node.lodThreshold || 0,
      lodSelectionMetricType:
        (this.metadata?.nodePages?.lodSelectionMetricType as
          | 'maxScreenThresholdSQ'
          | 'density-threshold'
          | undefined) || 'maxScreenThresholdSQ',
      lodThreshold: node.lodThreshold
    };
    if (this.spatialTransformer) {
      const sourceBounds = {
        obb: node.obb,
        normalReferenceFrame: this.metadata?.store.normalReferenceFrame
      };
      const transformedBounds =
        await this.spatialTransformer.transformPointCloudBoundsAsync(sourceBounds);
      const boundingVolume = getTransformedPointCloudBounds(
        transformedBounds.boundingVolume,
        'geographic'
      );
      const spatialBoundingVolume = getTransformedPointCloudBounds(
        transformedBounds.spatialBoundingVolume,
        this.spatialTransformer.targetCoordinateFrame === 'geographic' ? 'geographic' : 'cartesian'
      );
      return {
        ...commonHeader,
        boundingVolume,
        spatialBoundingVolume
      };
    }
    const latitudeRadians = (center[1] * Math.PI) / 180;
    const latitudeDelta = (radius / EARTH_EQUATORIAL_RADIUS) * (180 / Math.PI);
    const longitudeDelta = Math.min(
      180,
      latitudeDelta / Math.max(Math.abs(Math.cos(latitudeRadians)), 1e-12)
    );
    const coversFullLongitude = longitudeDelta >= 180;
    const minimum = [
      normalizeLongitude(center[0] - longitudeDelta),
      Math.max(-90, center[1] - latitudeDelta),
      center[2] - radius
    ];
    const maximum = [
      normalizeLongitude(center[0] + longitudeDelta),
      Math.min(90, center[1] + latitudeDelta),
      center[2] + radius
    ];
    return {
      ...commonHeader,
      boundingVolume: {
        cartographicBounds: [minimum, maximum],
        wrapsDateline: !coversFullLongitude && minimum[0] > maximum[0],
        coversFullLongitude,
        center,
        radius
      }
    };
  }

  private getAttributeDescriptors(): I3SPointCloudAttributeInfo[] {
    const layer = this.metadata as
      | (SceneLayer3D & {
          attributeInfo?: I3SPointCloudAttributeInfo[];
        })
      | null;
    return (layer?.attributeInfo ||
      layer?.attributeStorageInfo ||
      []) as I3SPointCloudAttributeInfo[];
  }

  private decodeAttribute(
    bytes: ArrayBuffer,
    descriptor: I3SPointCloudAttributeInfo
  ): {
    value: Float32Array | Float64Array | Uint8Array | Uint16Array | Int32Array;
    size: number;
    kind: string;
  } {
    const data = new Uint8Array(bytes);
    const encoding = String(descriptor.encoding || '').toLowerCase();
    let magic = '';
    try {
      magic = this.decoder.getBlobType(data);
    } catch {
      // Uncompressed attributes have no LEPCC magic and are decoded from metadata below.
    }
    const kind = encoding || magic;
    if (magic === 'rgb' || encoding.includes('rgb')) {
      return {value: this.decoder.decodeRgb(data), size: 3, kind: 'rgb'};
    }
    if (magic === 'intensity' || encoding.includes('intensity')) {
      return {value: this.decoder.decodeIntensity(data), size: 1, kind: 'intensity'};
    }
    if (magic === 'flagBytes' || encoding.includes('flag')) {
      return {value: this.decoder.decodeFlagBytes(data), size: 1, kind: 'flags'};
    }

    const valueType = String(
      descriptor.attributeValues?.valueType || descriptor.valueType || 'UInt8'
    ).toLowerCase();
    const valueSize = descriptor.attributeValues?.valuesPerElement || descriptor.valueSize || 1;
    if (valueType.includes('float32')) {
      return {value: new Float32Array(bytes), size: valueSize, kind};
    }
    if (valueType.includes('float64')) {
      return {value: new Float64Array(bytes), size: valueSize, kind};
    }
    if (valueType.includes('uint16')) {
      return {value: new Uint16Array(bytes), size: valueSize, kind};
    }
    if (valueType.includes('int32')) {
      return {value: new Int32Array(bytes), size: valueSize, kind};
    }
    return {value: new Uint8Array(bytes), size: valueSize, kind};
  }

  private getAttributeName(descriptor: I3SPointCloudAttributeInfo, kind: string): string {
    if (kind.includes('rgb')) return 'COLOR_0';
    if (kind.includes('intensity')) return 'intensity';
    if (kind.includes('flag')) return 'flags';
    return descriptor.name || descriptor.key || 'attribute';
  }

  private resourceCandidates(path: string, alternateKey?: string): string[] {
    const paths = [path];
    if (alternateKey && !path.includes(`/${alternateKey}/`)) {
      paths.push(path.replace(/\/attributes\/[^/]+\//, `/attributes/${alternateKey}/`));
    }
    return paths;
  }

  private async readJson(path: string): Promise<any> {
    const bytes = await this.readBinary(path ? [path] : ['']);
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  private async readBinary(paths: string | string[]): Promise<ArrayBuffer> {
    const values = Array.isArray(paths) ? paths : [paths];
    let lastError: unknown;
    for (const path of values) {
      try {
        if (this.archive) {
          return await this.archive.getFile(path, 'http');
        }
        const url = path ? `${this.baseUrl || this.url}/${path}` : this.url;
        const response = await this.fetch(getUrlWithToken(url, this.options.i3s?.token || null));
        if (!response.ok) {
          throw new Error(`I3S resource request failed (${response.status}): ${url}`);
        }
        return await response.arrayBuffer();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('I3S resource request failed');
  }

  private async readBinaryOptional(paths: string | string[]): Promise<ArrayBuffer | null> {
    try {
      return await this.readBinary(paths);
    } catch {
      return null;
    }
  }
}

const EARTH_EQUATORIAL_RADIUS = 6378137;

/** Normalize a longitude into the conventional [-180, 180] interval. */
function normalizeLongitude(longitude: number): number {
  const normalizedLongitude = ((((longitude + 180) % 360) + 360) % 360) - 180;
  return normalizedLongitude === -180 && longitude > 0 ? 180 : normalizedLongitude;
}

/** Normalized point positions and renderer metadata for one coordinate-system request. */
type NormalizedPointPositions = Readonly<{
  /** Point coordinates passed to the Arrow mesh table. */
  positions: Float32Array;
  /** Geographic origin retained for offset coordinate systems. */
  cartographicOrigin: number[];
  /** Concrete renderer coordinate system after resolving `default`. */
  coordinateSystem: PointCloudCoordinateSystem;
  /** Optional translation for Cartesian offsets. */
  modelMatrix?: Matrix4;
}>;

/** Converts absolute geographic LEPCC positions to the requested renderer representation. */
function normalizePointPositions(
  positions: Float64Array,
  center: number[],
  requestedCoordinateSystem?: PointCloudCoordinateSystem
): NormalizedPointPositions {
  const coordinateSystem =
    !requestedCoordinateSystem || requestedCoordinateSystem === 'default'
      ? 'lnglat-offsets'
      : requestedCoordinateSystem;
  if (coordinateSystem === 'cartesian') {
    const cartesianPositions = new Float32Array(positions.length);
    const cartesian = new Vector3();
    for (let index = 0; index < positions.length; index += 3) {
      Ellipsoid.WGS84.cartographicToCartesian(
        new Vector3([positions[index], positions[index + 1], positions[index + 2]]),
        cartesian
      );
      cartesianPositions.set(cartesian, index);
    }
    return {positions: cartesianPositions, cartographicOrigin: [0, 0, 0], coordinateSystem};
  }
  if (coordinateSystem === 'meter-offsets') {
    const meterOffsets = new Float32Array(positions.length);
    const latitudeRadians = (center[1] * Math.PI) / 180;
    const metersPerLongitudeDegree =
      (Math.PI / 180) * EARTH_EQUATORIAL_RADIUS * Math.cos(latitudeRadians);
    const metersPerLatitudeDegree = (Math.PI / 180) * EARTH_EQUATORIAL_RADIUS;
    for (let index = 0; index < positions.length; index += 3) {
      meterOffsets[index] = (positions[index] - center[0]) * metersPerLongitudeDegree;
      meterOffsets[index + 1] = (positions[index + 1] - center[1]) * metersPerLatitudeDegree;
      meterOffsets[index + 2] = positions[index + 2] - center[2];
    }
    return {positions: meterOffsets, cartographicOrigin: [...center], coordinateSystem};
  }
  if (coordinateSystem === 'lnglat') {
    return {
      positions: Float32Array.from(positions),
      cartographicOrigin: [0, 0, 0],
      coordinateSystem
    };
  }
  return {
    positions: Float32Array.from(positions, (value, index) => value - center[index % 3]),
    cartographicOrigin: [...center],
    coordinateSystem: 'lnglat-offsets'
  };
}

/** Convert a generic transformed tile bound into the point-cloud source contract. */
function getTransformedPointCloudBounds(
  boundingVolume: {
    box?: number[];
    region?: number[];
  },
  coordinateFrame: 'geographic' | 'cartesian'
): PointCloudBoundingVolume {
  if (boundingVolume.region) {
    const [west, south, east, north, minimumHeight, maximumHeight] = boundingVolume.region;
    const minimum = [(west * 180) / Math.PI, (south * 180) / Math.PI, minimumHeight];
    const maximum = [(east * 180) / Math.PI, (north * 180) / Math.PI, maximumHeight];
    let eastUnwrapped = maximum[0];
    if (eastUnwrapped < minimum[0]) {
      eastUnwrapped += 360;
    }
    const centerLongitude = normalizeLongitude((minimum[0] + eastUnwrapped) / 2);
    const center = [centerLongitude, (minimum[1] + maximum[1]) / 2, (minimum[2] + maximum[2]) / 2];
    const longitudeSpan = eastUnwrapped - minimum[0];
    const coversFullLongitude = longitudeSpan >= 360 - 1e-9;
    const radius = Math.hypot(
      longitudeSpan / 2,
      (maximum[1] - minimum[1]) / 2,
      (maximum[2] - minimum[2]) / 2
    );
    return {
      cartographicBounds: [minimum, maximum],
      wrapsDateline: !coversFullLongitude && minimum[0] > maximum[0],
      coversFullLongitude,
      center,
      radius,
      coordinateFrame
    };
  }

  const box = boundingVolume.box;
  if (!box) {
    throw new Error('Transformed I3S Point Cloud bound must contain a box or region');
  }
  const center = box.slice(0, 3);
  const halfSize = [
    Math.hypot(box[3], box[4], box[5]),
    Math.hypot(box[6], box[7], box[8]),
    Math.hypot(box[9], box[10], box[11])
  ];
  const minimum = center.map((value, index) => value - halfSize[index]);
  const maximum = center.map((value, index) => value + halfSize[index]);
  return {
    cartographicBounds: [minimum, maximum],
    center,
    radius: Math.hypot(...halfSize),
    coordinateFrame
  };
}
