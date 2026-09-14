// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {LOD_METRIC_TYPE, TILE_REFINEMENT, TILE_TYPE} from '../../constants';

const QUADTREE_CHILD_COUNT = 4;
const OCTREE_CHILD_COUNT = 8;
const AVAILABILITY_RANK_CACHE = new WeakMap<ImplicitAvailability, Uint32Array>();

/** Global coordinates of a tile in an implicit quadtree or octree. */
export type ImplicitTileCoordinates = {
  /** Zero-based level relative to the implicit-tile root. */
  level: number;
  /** Zero-based horizontal coordinate at {@link level}. */
  x: number;
  /** Zero-based vertical coordinate at {@link level}. */
  y: number;
  /** Zero-based height coordinate at {@link level}; always zero for quadtrees. */
  z: number;
};

/** Serializable information shared by every subtree in one implicit-tile hierarchy. */
export type ImplicitTilingDescriptor = {
  /** Absolute template URL for render content, or an empty string for a contentless hierarchy. */
  contentUrlTemplate: string;
  /** Absolute templates for every implicit content stream, in source order. */
  contentUrlTemplates?: string[];
  /** Non-URI content metadata inherited by each available implicit content resource. */
  contentHeader?: Record<string, any>;
  /** Metadata inherited by every implicit content stream, in source order. */
  contentHeaders?: Array<Record<string, any>>;
  /** Absolute template URL for subtree availability files. */
  subtreesUrlTemplate: string;
  /** Spatial subdivision used by the hierarchy. */
  subdivisionScheme: 'QUADTREE' | 'OCTREE';
  /** Number of tile levels represented inside each subtree file. */
  subtreeLevels: number;
  /** Last valid global tile level, where the implicit root is level zero. */
  maximumLevel: number;
  /** Refinement mode inherited by generated tiles. */
  refine: TILE_REFINEMENT | string;
  /** LOD metric used by generated tiles. */
  lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR;
  /** Source geometric error of the implicit root, in local meters. */
  rootLodMetricValue: number;
  /** Bounding volume of the complete implicit hierarchy. */
  rootBoundingVolume: Record<string, any>;
  /** Whether runtime transforms scale geometric error; false for draft 2.0. */
  scaleGeometricError?: boolean;
  /** Package files that may satisfy concrete content and subtree template references. */
  resourceFiles?: ImplicitPackageFile[];
};

/** Structured-cloneable file retained from a draft glTF package. */
export type ImplicitPackageFile = {
  name?: string;
  mimeType: string;
  uri?: string;
  originalUri?: string;
  data?: ArrayBuffer;
  byteOffset: number;
  byteLength: number;
  bufferUri?: string;
};

/** Package reference attached to a generated content or subtree URL. */
export type ImplicitPackageResource = {
  fileIndex: number;
  files: ImplicitPackageFile[];
};

/** Lazy pointer from a runtime tile to the subtree that defines it and its descendants. */
export type ImplicitSubtreeReference = {
  /** Global coordinates of the referenced subtree root. */
  coordinates: ImplicitTileCoordinates;
  /** Absolute subtree URL before source-level query inheritance is applied. */
  subtreeUrl: string;
  /** Serializable hierarchy description used to materialize the subtree. */
  descriptor: ImplicitTilingDescriptor;
  /** Embedded package resource matching {@link subtreeUrl}, when available. */
  resource?: ImplicitPackageResource;
};

/** Constant or bitstream-backed availability declaration from a parsed subtree. */
export type ImplicitAvailability = {
  /** Constant availability value applied to every addressed element. */
  constant?: number;
  /** Expanded least-significant-bit-first availability buffer. */
  explicitBitstream?: Uint8Array;
};

/** Parsed subset of the 3D Tiles subtree schema needed for hierarchy materialization. */
export type ParsedImplicitSubtree = {
  /** Availability of tiles inside this subtree. */
  tileAvailability: ImplicitAvailability;
  /**
   * Availability of tile content. Array entries correspond to content templates in source order.
   * Omitted availability denotes a metadata-only subtree with no render content.
   */
  contentAvailability?: ImplicitAvailability | ImplicitAvailability[];
  /** Availability of subtree roots immediately below this subtree. */
  childSubtreeAvailability: ImplicitAvailability;
  /** Property-table payloads referenced by subtree metadata declarations. */
  propertyTables?: unknown;
  /** Property-table reference for metadata attached to each available tile. */
  tileMetadata?: unknown;
  /** Property-table references for metadata attached to each content stream. */
  contentMetadata?: unknown;
  /** Metadata entity attached to the subtree itself. */
  subtreeMetadata?: unknown;
  /** Decoded standard attribute accessors keyed by tile semantic. */
  tileAttributes?: Record<string, ArrayLike<number>>;
  /** Decoded standard attribute accessors keyed by content semantic. */
  contentAttributes?: Record<string, ArrayLike<number>>;
  /** Index of the property table assigned to available tiles. */
  tileProperties?: unknown;
  /** Index of the property table assigned to available contents. */
  contentProperties?: unknown;
  /** Fully decoded property rows for available tiles, in availability order. */
  tilePropertyRows?: Array<Record<string, unknown>>;
  /** Fully decoded property rows for available contents, in availability order. */
  contentPropertyRows?: Array<Record<string, unknown>>;
  /** Tile property rows filtered to values permitted in URI templates. */
  tileTemplatePropertyRows?: Array<Record<string, unknown>>;
  /** Content property rows filtered to values permitted in URI templates. */
  contentTemplatePropertyRows?: Array<Record<string, unknown>>;
  /** Files retained by a glTF subtree package for later content/subtree resolution. */
  resourceFiles?: ImplicitPackageFile[];
};

/** Runtime header produced for an available implicit tile. */
export type ImplicitTileHeader = Record<string, any> & {
  /** Stable source identity, including global implicit coordinates. */
  id: string;
  /** Materialized children that are represented by the same subtree file. */
  children: ImplicitTileHeader[];
  /** Optional lazy reference when this tile begins a child subtree. */
  implicitSubtree?: ImplicitSubtreeReference;
  /** Raw subtree metadata references preserved for application-level interpretation. */
  implicitMetadata?: ImplicitSubtreeMetadata;
};

/** Metadata references inherited by generated implicit tile headers. */
export type ImplicitSubtreeMetadata = {
  /** Property tables declared by the subtree. */
  propertyTables?: unknown;
  /** Tile-level metadata property-table reference. */
  tileMetadata?: unknown;
  /** Content-level metadata property-table references in content order. */
  contentMetadata?: unknown;
  /** Subtree-level metadata entity. */
  subtreeMetadata?: unknown;
  /** Decoded property-table row for this tile. */
  tileProperties?: Record<string, unknown>;
  /** Decoded property-table row for this tile's available content. */
  contentProperties?: Record<string, unknown>;
};

/** Result of materializing exactly one subtree resource. */
export type MaterializedImplicitSubtree = {
  /** Header for the subtree root, including its in-subtree descendants. */
  root: ImplicitTileHeader;
  /** Number of available headers materialized from this subtree. */
  tileCount: number;
  /** Number of lazy child-subtree references created at the subtree boundary. */
  childSubtreeCount: number;
};

/**
 * Creates the lazy reference stored on an implicit subtree-root header.
 *
 * @param descriptor - Shared implicit hierarchy description.
 * @param coordinates - Global coordinates of the subtree root.
 * @returns Serializable reference with its concrete subtree URL.
 */
export function createImplicitSubtreeReference(
  descriptor: ImplicitTilingDescriptor,
  coordinates: ImplicitTileCoordinates
): ImplicitSubtreeReference {
  return {
    coordinates,
    subtreeUrl: replaceImplicitUrlTemplate(descriptor.subtreesUrlTemplate, coordinates),
    descriptor,
    resource: findImplicitPackageResource(
      descriptor.resourceFiles,
      replaceImplicitUrlTemplate(descriptor.subtreesUrlTemplate, coordinates)
    )
  };
}

/**
 * Materializes the available tiles described by one subtree file without performing I/O.
 *
 * The function deliberately stops at the subtree boundary. Available child subtrees become lazy
 * references so traversal, SSE, request-volume checks, and the request scheduler decide when the
 * next network request is useful.
 *
 * @param subtree - Parsed availability data for one subtree resource.
 * @param reference - Coordinates and hierarchy description for the subtree root.
 * @returns Materialized root and diagnostic counts.
 * @throws If the subtree root is unavailable or the descriptor is invalid.
 */
export function materializeImplicitSubtree(
  subtree: ParsedImplicitSubtree,
  reference: ImplicitSubtreeReference
): MaterializedImplicitSubtree {
  const {descriptor} = reference;
  validateImplicitDescriptor(descriptor);
  validateImplicitSubtree(subtree, descriptor);

  const counters = {tileCount: 0, childSubtreeCount: 0};
  const root = materializeAvailableTile(
    subtree,
    reference,
    {localLevel: 0, mortonIndex: 0},
    reference.coordinates,
    counters
  );

  if (!root) {
    throw new Error(
      `Invalid 3D Tiles subtree: root tile is unavailable at ${reference.subtreeUrl}`
    );
  }

  return {root, ...counters};
}

/** Validates availability lengths and tightly packed draft attribute/property row counts. */
function validateImplicitSubtree(
  subtree: ParsedImplicitSubtree,
  descriptor: ImplicitTilingDescriptor
): void {
  const childCount = getImplicitChildCount(descriptor.subdivisionScheme);
  const tileElementCount = (childCount ** descriptor.subtreeLevels - 1) / (childCount - 1);
  const childSubtreeElementCount = childCount ** descriptor.subtreeLevels;
  validateAvailabilityLength(subtree.tileAvailability, tileElementCount, 'tile');
  const contentAvailabilityStreams = Array.isArray(subtree.contentAvailability)
    ? subtree.contentAvailability
    : subtree.contentAvailability
      ? [subtree.contentAvailability]
      : [];
  for (const contentAvailability of contentAvailabilityStreams) {
    validateAvailabilityLength(contentAvailability, tileElementCount, 'content');
  }
  validateAvailabilityLength(
    subtree.childSubtreeAvailability,
    childSubtreeElementCount,
    'child subtree'
  );
  const availableTileCount = countAvailableElements(subtree.tileAvailability, tileElementCount);
  const availableContentCount = contentAvailabilityStreams[0]
    ? countAvailableElements(contentAvailabilityStreams[0], tileElementCount)
    : 0;
  validateAttributeLengths(subtree.tileAttributes, availableTileCount, 'tile');
  validateAttributeLengths(subtree.contentAttributes, availableContentCount, 'content');
  if (subtree.tilePropertyRows && subtree.tilePropertyRows.length !== availableTileCount) {
    throw new Error('3DTILES_subtree: tile property-table count does not match availability');
  }
  if (subtree.contentPropertyRows && subtree.contentPropertyRows.length !== availableContentCount) {
    throw new Error('3DTILES_subtree: content property-table count does not match availability');
  }
}

/** Verifies that a bitstream contains every bit required by its implicit subtree. */
function validateAvailabilityLength(
  availability: ImplicitAvailability,
  elementCount: number,
  label: string
): void {
  if (availability.constant === 0 || availability.constant === 1) {
    return;
  }
  if (
    !availability.explicitBitstream ||
    availability.explicitBitstream.byteLength * 8 < elementCount
  ) {
    throw new Error(`3DTILES_subtree: ${label} availability bitstream is too short`);
  }
}

/** Counts available elements within the meaningful, unpadded part of an availability stream. */
function countAvailableElements(availability: ImplicitAvailability, elementCount: number): number {
  if (availability.constant === 1) {
    return elementCount;
  }
  if (availability.constant === 0) {
    return 0;
  }
  let availableCount = 0;
  for (let index = 0; index < elementCount; index++) {
    if (getAvailabilityValue(availability, index)) {
      availableCount++;
    }
  }
  return availableCount;
}

/** Validates standard subtree attribute accessor counts after availability expansion. */
function validateAttributeLengths(
  attributes: Record<string, ArrayLike<number>> | undefined,
  availableCount: number,
  label: string
): void {
  const componentCounts: Record<string, number> = {
    TILE_BOUNDING_BOX: 16,
    TILE_BOUNDING_SPHERE: 4,
    TILE_GEOMETRIC_ERROR: 1,
    TILE_REFINE: 1,
    TILE_TRANSFORM: 16,
    CONTENT_BOUNDING_BOX: 16,
    CONTENT_BOUNDING_SPHERE: 4
  };
  for (const [semantic, values] of Object.entries(attributes || {})) {
    const componentCount = componentCounts[semantic];
    if (componentCount && values.length !== availableCount * componentCount) {
      throw new Error(
        `3DTILES_subtree: ${label} attribute ${semantic} count does not match availability`
      );
    }
  }
}

/**
 * Replaces implicit coordinate placeholders in a content or subtree URL.
 *
 * @param templateUrl - URL containing level/x/y/z placeholders.
 * @param coordinates - Global coordinates to insert.
 * @returns URL with all coordinate placeholders replaced.
 */
export function replaceImplicitUrlTemplate(
  templateUrl: string,
  coordinates: ImplicitTileCoordinates,
  properties: Record<string, unknown> = {}
): string {
  const values: Record<string, unknown> = {
    level: coordinates.level,
    x: coordinates.x,
    y: coordinates.y,
    z: coordinates.z,
    ...properties
  };
  return templateUrl.replace(/{([^{}]+)}/g, (match, propertyName: string) => {
    const value = Object.hasOwn(values, propertyName)
      ? values[propertyName]
      : values[propertyName.toLowerCase()];
    return value === undefined ? match : String(value);
  });
}

/**
 * Builds one available tile and recursively materializes descendants in the same subtree.
 *
 * @param subtree - Parsed availability declarations.
 * @param reference - Current subtree reference.
 * @param localCoordinates - Level and Morton index relative to the current subtree.
 * @param globalCoordinates - Coordinates relative to the complete implicit hierarchy.
 * @param counters - Mutable diagnostic counters owned by the public materializer call.
 * @returns Header for an available tile, or `null` for a sparse unavailable position.
 */
function materializeAvailableTile(
  subtree: ParsedImplicitSubtree,
  reference: ImplicitSubtreeReference,
  localCoordinates: {localLevel: number; mortonIndex: number},
  globalCoordinates: ImplicitTileCoordinates,
  counters: {tileCount: number; childSubtreeCount: number}
): ImplicitTileHeader | null {
  const {descriptor} = reference;
  const childCount = getImplicitChildCount(descriptor.subdivisionScheme);
  const availabilityIndex =
    getLevelOffset(childCount, localCoordinates.localLevel) + localCoordinates.mortonIndex;

  if (!getAvailabilityValue(subtree.tileAvailability, availabilityIndex)) {
    return null;
  }

  counters.tileCount++;
  const contentAvailability = getContentAvailability(
    subtree.contentAvailability,
    availabilityIndex
  );
  const children: ImplicitTileHeader[] = [];

  if (globalCoordinates.level < descriptor.maximumLevel) {
    if (localCoordinates.localLevel + 1 < descriptor.subtreeLevels) {
      for (let childIndex = 0; childIndex < childCount; childIndex++) {
        const childCoordinates = getChildCoordinates(
          globalCoordinates,
          childIndex,
          descriptor.subdivisionScheme
        );
        const childHeader = materializeAvailableTile(
          subtree,
          reference,
          {
            localLevel: localCoordinates.localLevel + 1,
            mortonIndex: localCoordinates.mortonIndex * childCount + childIndex
          },
          childCoordinates,
          counters
        );
        if (childHeader) {
          children.push(childHeader);
        }
      }
    } else {
      for (let childIndex = 0; childIndex < childCount; childIndex++) {
        const childSubtreeIndex = localCoordinates.mortonIndex * childCount + childIndex;
        if (getAvailabilityValue(subtree.childSubtreeAvailability, childSubtreeIndex)) {
          const childCoordinates = getChildCoordinates(
            globalCoordinates,
            childIndex,
            descriptor.subdivisionScheme
          );
          children.push(createLazyImplicitTileHeader(subtree, descriptor, childCoordinates));
          counters.childSubtreeCount++;
        }
      }
    }
  }

  return formatImplicitTileHeader(
    subtree,
    descriptor,
    reference,
    globalCoordinates,
    availabilityIndex,
    contentAvailability,
    children
  );
}

/**
 * Creates a contentless placeholder for an available child subtree.
 *
 * @param descriptor - Shared implicit hierarchy description.
 * @param coordinates - Global coordinates of the child subtree root.
 * @returns Header that participates in culling and SSE before its subtree is requested.
 */
function createLazyImplicitTileHeader(
  subtree: ParsedImplicitSubtree,
  descriptor: ImplicitTilingDescriptor,
  coordinates: ImplicitTileCoordinates
): ImplicitTileHeader {
  const childDescriptor = subtree.resourceFiles?.length
    ? {...descriptor, resourceFiles: subtree.resourceFiles}
    : descriptor;
  const reference = createImplicitSubtreeReference(childDescriptor, coordinates);
  return {
    id: getImplicitTileId(reference, coordinates),
    children: [],
    implicitSubtree: reference,
    boundingVolume: calculateImplicitBoundingVolume(
      descriptor.rootBoundingVolume,
      coordinates,
      descriptor.subdivisionScheme
    ),
    geometricError: descriptor.rootLodMetricValue / 2 ** coordinates.level,
    lodMetricType: descriptor.lodMetricType,
    lodMetricValue: descriptor.rootLodMetricValue / 2 ** coordinates.level,
    refine: descriptor.refine,
    type: TILE_TYPE.EMPTY,
    implicitMetadata: getImplicitSubtreeMetadata(subtree),
    _scaleGeometricError: descriptor.scaleGeometricError !== false
  };
}

type ImplicitAttributeOverrides = {
  boundingVolume?: Record<string, any>;
  geometricError?: number;
  refine?: TILE_REFINEMENT;
  transform?: number[];
};

/** Decodes supported standard subtree attributes for one tightly packed available row. */
function getSubtreeAttributeOverrides(
  attributes: Record<string, ArrayLike<number>> | undefined,
  rowIndex: number,
  scope: 'tile' | 'content'
): ImplicitAttributeOverrides {
  if (!attributes || rowIndex < 0) {
    return {};
  }
  const box = getAttributeComponents(
    attributes[scope === 'tile' ? 'TILE_BOUNDING_BOX' : 'CONTENT_BOUNDING_BOX'],
    rowIndex,
    16
  );
  const sphere = getAttributeComponents(
    attributes[scope === 'tile' ? 'TILE_BOUNDING_SPHERE' : 'CONTENT_BOUNDING_SPHERE'],
    rowIndex,
    4
  );
  const boundingVolume = box
    ? {
        box: [
          box[12],
          box[13],
          box[14],
          box[0] / 2,
          box[1] / 2,
          box[2] / 2,
          box[4] / 2,
          box[5] / 2,
          box[6] / 2,
          box[8] / 2,
          box[9] / 2,
          box[10] / 2
        ]
      }
    : sphere
      ? {sphere}
      : undefined;
  if (scope === 'content') {
    return {boundingVolume};
  }
  const geometricError = getAttributeComponents(attributes.TILE_GEOMETRIC_ERROR, rowIndex, 1)?.[0];
  if (geometricError !== undefined && (!Number.isFinite(geometricError) || geometricError < 0)) {
    throw new Error('3DTILES_subtree: TILE_GEOMETRIC_ERROR must be nonnegative');
  }
  const refineValue = getAttributeComponents(attributes.TILE_REFINE, rowIndex, 1)?.[0];
  if (refineValue !== undefined && refineValue !== 0 && refineValue !== 1) {
    throw new Error('3DTILES_subtree: TILE_REFINE must be 0 or 1');
  }
  return {
    boundingVolume,
    geometricError,
    refine:
      refineValue === undefined
        ? undefined
        : refineValue === 0
          ? TILE_REFINEMENT.ADD
          : TILE_REFINEMENT.REPLACE,
    transform: getAttributeComponents(attributes.TILE_TRANSFORM, rowIndex, 16)
  };
}

/** Copies one logical accessor element and validates its available-row count. */
function getAttributeComponents(
  values: ArrayLike<number> | undefined,
  rowIndex: number,
  componentCount: number
): number[] | undefined {
  if (!values) {
    return undefined;
  }
  const offset = rowIndex * componentCount;
  if (offset + componentCount > values.length) {
    throw new Error('3DTILES_subtree: attribute accessor is shorter than availability');
  }
  return Array.from({length: componentCount}, (_unused, componentIndex) =>
    Number(values[offset + componentIndex])
  );
}

/** Returns the tightly packed property/attribute row index for an available element. */
function getAvailabilityRank(availability: ImplicitAvailability, index: number): number {
  if (availability.constant === 1) {
    return index;
  }
  if (availability.constant === 0) {
    return 0;
  }
  let ranks = AVAILABILITY_RANK_CACHE.get(availability);
  if (!ranks) {
    const bitCount = (availability.explicitBitstream?.byteLength || 0) * 8;
    ranks = new Uint32Array(bitCount + 1);
    for (let candidateIndex = 0; candidateIndex < bitCount; candidateIndex++) {
      ranks[candidateIndex + 1] =
        ranks[candidateIndex] + Number(getAvailabilityValue(availability, candidateIndex));
    }
    AVAILABILITY_RANK_CACHE.set(availability, ranks);
  }
  return ranks[index];
}

/** Locates a concrete generated URI in a retained glTF package. */
function findImplicitPackageResource(
  files: ImplicitPackageFile[] | undefined,
  resourceUrl: string
): ImplicitPackageResource | undefined {
  if (!files?.length) {
    return undefined;
  }
  const urlWithoutQuery = resourceUrl.split('?')[0];
  const fileIndex = files.findIndex(file => {
    if (file.uri === urlWithoutQuery) {
      return true;
    }
    const reference = file.originalUri || file.name;
    return Boolean(
      reference &&
        (urlWithoutQuery === reference ||
          urlWithoutQuery.endsWith(`/${reference}`) ||
          urlWithoutQuery.endsWith(`:${reference}`))
    );
  });
  return fileIndex < 0 ? undefined : {fileIndex, files};
}

/**
 * Formats an available implicit tile as a runtime header.
 *
 * @param descriptor - Shared implicit hierarchy description.
 * @param reference - Current subtree reference used to build stable IDs.
 * @param coordinates - Global tile coordinates.
 * @param contentAvailability - Availability for each content stream in source order.
 * @param children - Materialized or lazy child headers.
 * @returns Runtime tile header.
 */
function formatImplicitTileHeader(
  subtree: ParsedImplicitSubtree,
  descriptor: ImplicitTilingDescriptor,
  reference: ImplicitSubtreeReference,
  coordinates: ImplicitTileCoordinates,
  availabilityIndex: number,
  contentAvailability: boolean[],
  children: ImplicitTileHeader[]
): ImplicitTileHeader {
  const tilePropertyIndex = getAvailabilityRank(subtree.tileAvailability, availabilityIndex);
  const tileProperties = subtree.tilePropertyRows?.[tilePropertyIndex];
  const primaryContentAvailability = Array.isArray(subtree.contentAvailability)
    ? subtree.contentAvailability[0]
    : subtree.contentAvailability;
  const contentPropertyIndex =
    primaryContentAvailability &&
    getAvailabilityValue(primaryContentAvailability, availabilityIndex)
      ? getAvailabilityRank(primaryContentAvailability, availabilityIndex)
      : -1;
  const contentProperties = subtree.contentPropertyRows?.[contentPropertyIndex];
  const tileTemplateProperties =
    subtree.tileTemplatePropertyRows?.[tilePropertyIndex] || tileProperties;
  const contentTemplateProperties =
    subtree.contentTemplatePropertyRows?.[contentPropertyIndex] || contentProperties;
  const templateProperties = {...tileTemplateProperties, ...contentTemplateProperties};
  const tileAttributes = getSubtreeAttributeOverrides(
    subtree.tileAttributes,
    tilePropertyIndex,
    'tile'
  );
  const contentAttributes = getSubtreeAttributeOverrides(
    subtree.contentAttributes,
    contentPropertyIndex,
    'content'
  );
  const contentUrlTemplates = descriptor.contentUrlTemplates?.length
    ? descriptor.contentUrlTemplates
    : [descriptor.contentUrlTemplate];
  const contentEntries = contentUrlTemplates
    .map((templateUrl, contentIndex) => {
      if (!contentAvailability[contentIndex] || !templateUrl) {
        return null;
      }
      const contentUrl = replaceImplicitUrlTemplate(templateUrl, coordinates, templateProperties);
      if (/{[^{}]+}/.test(contentUrl)) {
        throw new Error(`Implicit content URI has unresolved template values: ${contentUrl}`);
      }
      return {
        contentIndex,
        contentUrl
      };
    })
    .filter((entry): entry is {contentIndex: number; contentUrl: string} => Boolean(entry));
  const availableContentUrls = contentEntries.map(entry => entry.contentUrl);
  const resourceFiles = subtree.resourceFiles?.length
    ? subtree.resourceFiles
    : descriptor.resourceFiles;
  const content = contentEntries.map(({contentIndex, contentUrl}) => {
    const packageResource = findImplicitPackageResource(resourceFiles, contentUrl);
    return {
      ...(descriptor.contentHeaders?.[contentIndex] ||
        (contentIndex === 0 ? descriptor.contentHeader : {}) ||
        {}),
      ...contentAttributes,
      uri: contentUrl,
      ...(contentProperties ? {metadata: {properties: contentProperties}} : {}),
      ...(packageResource ? {_resource: packageResource} : {})
    };
  });
  const contentUrl = availableContentUrls[0];
  const computedLodMetricValue = descriptor.rootLodMetricValue / 2 ** coordinates.level;
  const lodMetricValue = tileAttributes.geometricError ?? computedLodMetricValue;
  const computedBoundingVolume = calculateImplicitBoundingVolume(
    descriptor.rootBoundingVolume,
    coordinates,
    descriptor.subdivisionScheme
  );

  return {
    id: getImplicitTileId(reference, coordinates),
    children,
    contentUrl,
    content: content.length > 1 ? content : content[0],
    contentUrls: availableContentUrls,
    refine: tileAttributes.refine || descriptor.refine,
    type: getImplicitTileType(contentUrl),
    lodMetricType: descriptor.lodMetricType,
    lodMetricValue,
    geometricError: lodMetricValue,
    boundingVolume: tileAttributes.boundingVolume || computedBoundingVolume,
    transform: tileAttributes.transform,
    transformMatrix: tileAttributes.transform,
    metadata: tileProperties ? {properties: tileProperties} : undefined,
    implicitMetadata: getImplicitSubtreeMetadata(subtree, tileProperties, contentProperties),
    _scaleGeometricError: descriptor.scaleGeometricError !== false
  };
}

/**
 * Copies subtree metadata references without interpreting property-table schemas.
 *
 * Keeping the references on generated headers makes metadata available to applications while
 * avoiding a false promise that the runtime has already decoded classes, enums, or values.
 *
 * @param subtree - Parsed subtree containing optional metadata declarations.
 * @returns Metadata references, or `undefined` when the subtree declares none.
 */
function getImplicitSubtreeMetadata(
  subtree: ParsedImplicitSubtree,
  tileProperties?: Record<string, unknown>,
  contentProperties?: Record<string, unknown>
): ImplicitSubtreeMetadata | undefined {
  if (
    !subtree.propertyTables &&
    subtree.tileMetadata === undefined &&
    !subtree.contentMetadata &&
    subtree.subtreeMetadata === undefined &&
    !tileProperties &&
    !contentProperties
  ) {
    return undefined;
  }
  return {
    propertyTables: subtree.propertyTables,
    tileMetadata: subtree.tileMetadata,
    contentMetadata: subtree.contentMetadata,
    subtreeMetadata: subtree.subtreeMetadata,
    tileProperties,
    contentProperties
  };
}

/**
 * Returns a stable identity for contentless and content-bearing implicit tiles.
 *
 * @param reference - Owning subtree reference.
 * @param coordinates - Global tile coordinates.
 * @returns Stable source identity independent of content availability.
 */
function getImplicitTileId(
  reference: ImplicitSubtreeReference,
  coordinates: ImplicitTileCoordinates
): string {
  return `${reference.subtreeUrl}#implicit=${coordinates.level}/${coordinates.x}/${coordinates.y}/${coordinates.z}`;
}

/**
 * Reads an availability bit without assuming 32-bit coordinate or Morton arithmetic.
 *
 * @param availability - Constant or expanded bitstream availability.
 * @param index - Zero-based availability index.
 * @returns Whether the addressed tile, content, or child subtree exists.
 */
function getAvailabilityValue(availability: ImplicitAvailability, index: number): boolean {
  if (typeof availability?.constant === 'number') {
    return Boolean(availability.constant);
  }
  const bitstream = availability?.explicitBitstream;
  if (!bitstream) {
    return false;
  }
  const byteIndex = Math.floor(index / 8);
  const bitIndex = index % 8;
  return Boolean((bitstream[byteIndex] >> bitIndex) & 1);
}

/**
 * Reads every content availability stream for one tile in descriptor/source order.
 *
 * @param availability - Single or multiple-content availability declaration.
 * @returns Availability flags aligned with the content URL templates.
 */
function getContentAvailability(
  availability: ImplicitAvailability | ImplicitAvailability[] | undefined,
  index: number
): boolean[] {
  const streams = Array.isArray(availability) ? availability : [availability];
  return streams.map(stream => getAvailabilityValue(stream || {constant: 0}, index));
}

/**
 * Calculates the breadth-first availability offset for a local subtree level.
 *
 * @param childCount - Branching factor of the subdivision scheme.
 * @param localLevel - Level relative to the subtree root.
 * @returns First availability index for the requested level.
 */
function getLevelOffset(childCount: number, localLevel: number): number {
  return (childCount ** localLevel - 1) / (childCount - 1);
}

/**
 * Calculates one child's global implicit coordinates.
 *
 * @param parent - Global parent coordinates.
 * @param childIndex - Morton-ordered child index.
 * @param subdivisionScheme - Quadtree or octree subdivision.
 * @returns Global child coordinates.
 */
function getChildCoordinates(
  parent: ImplicitTileCoordinates,
  childIndex: number,
  subdivisionScheme: 'QUADTREE' | 'OCTREE'
): ImplicitTileCoordinates {
  return {
    level: parent.level + 1,
    x: parent.x * 2 + (childIndex & 1),
    y: parent.y * 2 + ((childIndex >> 1) & 1),
    z: subdivisionScheme === 'OCTREE' ? parent.z * 2 + ((childIndex >> 2) & 1) : 0
  };
}

/**
 * Returns the branching factor for a supported implicit subdivision scheme.
 *
 * @param subdivisionScheme - Quadtree or octree subdivision.
 * @returns Four for quadtrees or eight for octrees.
 */
function getImplicitChildCount(subdivisionScheme: 'QUADTREE' | 'OCTREE'): number {
  return subdivisionScheme === 'OCTREE' ? OCTREE_CHILD_COUNT : QUADTREE_CHILD_COUNT;
}

/**
 * Calculates the bounding volume for global implicit coordinates.
 *
 * Region volumes are divided in longitude/latitude and, for octrees, height. Oriented boxes are
 * divided along their half-axis vectors. S2-derived boxes retain the root box conservatively: the
 * lower-level tiles module intentionally does not duplicate the S2 geometry implementation owned
 * by `@loaders.gl/3d-tiles`, and a conservative volume avoids incorrect culling.
 *
 * @param rootBoundingVolume - Bounding volume of the complete implicit hierarchy.
 * @param coordinates - Global tile coordinates.
 * @param subdivisionScheme - Quadtree or octree subdivision.
 * @returns Bounding volume for the addressed tile.
 */
function calculateImplicitBoundingVolume(
  rootBoundingVolume: Record<string, any>,
  coordinates: ImplicitTileCoordinates,
  subdivisionScheme: 'QUADTREE' | 'OCTREE'
): Record<string, any> {
  if (rootBoundingVolume.region) {
    const [west, south, east, north, minimumHeight, maximumHeight] = rootBoundingVolume.region;
    const divisionCount = 2 ** coordinates.level;
    const longitudeSize = (east - west) / divisionCount;
    const latitudeSize = (north - south) / divisionCount;
    const childWest = west + longitudeSize * coordinates.x;
    const childSouth = south + latitudeSize * coordinates.y;
    let childMinimumHeight = minimumHeight;
    let childMaximumHeight = maximumHeight;
    if (subdivisionScheme === 'OCTREE') {
      const heightSize = (maximumHeight - minimumHeight) / divisionCount;
      childMinimumHeight = minimumHeight + heightSize * coordinates.z;
      childMaximumHeight = childMinimumHeight + heightSize;
    }
    return {
      region: [
        childWest,
        childSouth,
        childWest + longitudeSize,
        childSouth + latitudeSize,
        childMinimumHeight,
        childMaximumHeight
      ]
    };
  }

  if (rootBoundingVolume.box) {
    if (
      rootBoundingVolume.s2VolumeInfo ||
      rootBoundingVolume.extensions?.['3DTILES_shape_cylinder_region']
    ) {
      return {
        ...rootBoundingVolume,
        box: [...rootBoundingVolume.box]
      };
    }
    const box = rootBoundingVolume.box;
    const divisionCount = 2 ** coordinates.level;
    const xOffset = -1 + (2 * coordinates.x + 1) / divisionCount;
    const yOffset = -1 + (2 * coordinates.y + 1) / divisionCount;
    const zOffset = -1 + (2 * coordinates.z + 1) / divisionCount;
    const divideHeight = subdivisionScheme === 'OCTREE';
    const center = [
      box[0] + box[3] * xOffset + box[6] * yOffset + (divideHeight ? box[9] * zOffset : 0),
      box[1] + box[4] * xOffset + box[7] * yOffset + (divideHeight ? box[10] * zOffset : 0),
      box[2] + box[5] * xOffset + box[8] * yOffset + (divideHeight ? box[11] * zOffset : 0)
    ];
    return {
      box: [
        ...center,
        box[3] / divisionCount,
        box[4] / divisionCount,
        box[5] / divisionCount,
        box[6] / divisionCount,
        box[7] / divisionCount,
        box[8] / divisionCount,
        divideHeight ? box[9] / divisionCount : box[9],
        divideHeight ? box[10] / divisionCount : box[10],
        divideHeight ? box[11] / divisionCount : box[11]
      ]
    };
  }

  throw new Error(
    `Unsupported implicit 3D Tiles bounding volume: ${JSON.stringify(rootBoundingVolume)}`
  );
}

/**
 * Detects the runtime tile category from an available content URL.
 *
 * @param contentUrl - Concrete content URL, if content is available.
 * @returns Runtime tile category.
 */
function getImplicitTileType(contentUrl?: string): TILE_TYPE | string {
  if (!contentUrl) {
    return TILE_TYPE.EMPTY;
  }
  const extension = contentUrl.split('?')[0].split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pnts':
      return TILE_TYPE.POINTCLOUD;
    case 'i3dm':
    case 'b3dm':
    case 'glb':
    case 'gltf':
      return TILE_TYPE.SCENEGRAPH;
    default:
      return extension || TILE_TYPE.EMPTY;
  }
}

/**
 * Validates descriptor invariants before allocating a runtime subtree.
 *
 * @param descriptor - Serializable implicit hierarchy description.
 * @throws If levels, scheme, or maximum-level semantics are invalid.
 */
function validateImplicitDescriptor(descriptor: ImplicitTilingDescriptor): void {
  if (descriptor.subdivisionScheme !== 'QUADTREE' && descriptor.subdivisionScheme !== 'OCTREE') {
    throw new Error(`Unsupported implicit subdivision scheme: ${descriptor.subdivisionScheme}`);
  }
  if (!Number.isInteger(descriptor.subtreeLevels) || descriptor.subtreeLevels < 1) {
    throw new Error('Implicit subtreeLevels must be a positive integer');
  }
  if (!Number.isInteger(descriptor.maximumLevel) || descriptor.maximumLevel < 0) {
    throw new Error('Implicit availableLevels must describe at least the root level');
  }
}
