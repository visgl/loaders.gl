// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {prepareMeshHierarchy} from './mesh-hierarchy.js';
import {coreApi, parse} from '@loaders.gl/core';
import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
import type {
  TilesetSourceInput,
  TilesetSourceMetadata,
  TilesetSpatialReference
} from '@loaders.gl/tiles';
import type {DracoLibraryOptions} from '@loaders.gl/draco/bundled';
import {
  createBrowserTilesetConversionSource,
  selectBrowserTilesetContent,
  createTiles3DConversionSpatialContext,
  TileConversionError
} from '@loaders.gl/tile-converter/v5/core';
import type {
  BrowserTilesetConversionInspection,
  BrowserTilesetConversionInputResource,
  TileConversionSource
} from '@loaders.gl/tile-converter/v5/core';
import {
  createMeshTilesetConversionSource,
  createTileConversionResourceFetcher
} from '@loaders.gl/tile-converter/v5/adapters';
import type {
  MeshSourceResource,
  MeshSourceFeatureOptions
} from '@loaders.gl/tile-converter/v5/adapters';

/** Required transport, decoded geometry, retained output, and archive budgets for this demo. */
export const SELECTED_MESH_LIMITS = {
  /** Root JSON plus selected content transport bytes; also the decoded geometry/image/feature byte gate. */
  maxInputBytes: 16 * 1024 * 1024,
  /** Maximum declared content placements inspected. */
  maxInputResources: 1000,
  /** Maximum inspected root/external document placements. */
  maxTilesetDocuments: 32,
  /** Maximum explicitly selected content placements in one partial archive. */
  maxSelectedResources: 64,
  /** Maximum primitive placements authored across all selected contents. */
  maxMeshResources: 64,
  /** Maximum retained file bytes and final archive bytes. */
  maxOutputBytes: 32 * 1024 * 1024,
  /** Maximum measured reconstruction error in meters. */
  maxPositionError: 0.01
} as const;

/** Injected transport and decoder assets for the bounded selected mesh profile. */
export interface SelectedMeshSourceOptions {
  /** Require a complete qualified explicit tree; pair with createMeshHierarchyTilesetSink. */
  readonly preserveHierarchy?: boolean;
  /** Inspected content placement identifiers; one to 64 distinct selections. */
  readonly resourceIds: readonly string[];
  /** Cancellation across qualification, raw reads and decoding. */
  readonly signal: AbortSignal;
  /** Application-owned decoder asset locations or modules. */
  readonly dracoLibraryOptions: DracoLibraryOptions;
  /** Transport for decoded buffers/images, confined by a platform adapter when local. */
  readonly fetcher?: typeof fetch;
  /** Optional source owning the raw input lifetime, such as a Node file/archive adapter. */
  readonly source?: TileConversionSource<
    BrowserTilesetConversionInspection,
    BrowserTilesetConversionInputResource
  >;
  /** Explicit feature mapping, or the qualified inline structural metadata profile. */
  readonly features?: MeshSourceFeatureOptions;
  /** Lower the shared 16 MiB transport and decoded mesh limit. */
  readonly maxInputBytes?: number;
}

/** Qualified selected-mesh decoding and source error policy. */
export interface SelectedMeshConversionSource {
  /** Lazy source that releases each dedicated mesh runtime after use. */
  readonly source: TileConversionSource<BrowserTilesetConversionInspection, MeshSourceResource>;
  /** Native ECEF coordinate context, qualified before reading mesh content. */
  readonly spatialContext: ReturnType<typeof createTiles3DConversionSpatialContext>;
  /** Conservative metric source error plus the position reconstruction allowance. */
  readonly geometricError: number;
}

/** Qualifies and constructs a lazy selected mesh source without platform I/O or output ownership. */
export async function createSelectedMeshConversionSource(
  inspection: BrowserTilesetConversionInspection,
  options: SelectedMeshSourceOptions
): Promise<SelectedMeshConversionSource> {
  const {
    resourceIds,
    signal,
    dracoLibraryOptions,
    features,
    preserveHierarchy,
    fetcher = fetch
  } = options;
  const maxInputBytes = options.maxInputBytes ?? SELECTED_MESH_LIMITS.maxInputBytes;
  if (
    !Number.isSafeInteger(maxInputBytes) ||
    maxInputBytes < 1 ||
    maxInputBytes > SELECTED_MESH_LIMITS.maxInputBytes
  )
    throw new TileConversionError(
      'INVALID_SELECTED_MESH_OPTIONS',
      'Selected mesh input budget must be a positive safe integer at most 16 MiB'
    );
  if (
    !resourceIds.length ||
    resourceIds.length > SELECTED_MESH_LIMITS.maxSelectedResources ||
    new Set(resourceIds).size !== resourceIds.length ||
    resourceIds.some(
      identifier => !inspection.resources.some(resource => resource.resourceId === identifier)
    )
  )
    throw new Error('Select between 1 and 64 distinct content placements.');
  if (preserveHierarchy !== undefined && typeof preserveHierarchy !== 'boolean')
    throw new TileConversionError(
      'MESH_HIERARCHY_UNSUPPORTED',
      'preserveHierarchy must be a boolean'
    );
  if (preserveHierarchy) prepareMeshHierarchy(inspection, resourceIds);
  const descriptors = inspection.resources.filter(resource =>
    resourceIds.includes(resource.resourceId)
  );
  const selections = descriptors.map(descriptor =>
    selectBrowserTilesetContent(inspection, descriptor)
  );
  const selectedContents = new Map(
    descriptors.map((descriptor, index) => [descriptor.resourceId, selections[index]])
  );
  if (
    !preserveHierarchy &&
    resourceIds.length > 1 &&
    selections.some(selection => !selection.isLeaf)
  )
    throw new Error(
      'Multi-selection requires leaf contents; source LOD hierarchy is not exported.'
    );
  signal.throwIfAborted();
  const boundedFetcher = createTileConversionResourceFetcher({
    maxInputBytes,
    initialInputBytes: inspection.tilesetBytes,
    fetcher,
    signal
  });
  const qualification = createSelectedRuntime(
    inspection.tileset,
    new Uint8Array(),
    signal,
    boundedFetcher,
    inspection.rootUrl,
    dracoLibraryOptions
  );
  let spatialContext: ReturnType<typeof createTiles3DConversionSpatialContext>;
  try {
    await qualification.tilesetInitializationPromise;
    const metadata = await createMeshTilesetConversionSource(qualification).inspect(signal);
    spatialContext = createTiles3DConversionSpatialContext(metadata.spatialReference!);
  } finally {
    qualification.destroy();
  }
  const rawSource =
    options.source ??
    createBrowserTilesetConversionSource({
      input: inspection.rootUrl,
      ...SELECTED_MESH_LIMITS,
      maxInputBytes,
      fetcher: boundedFetcher
    });
  const selectedInspection = {...inspection, resources: descriptors};
  const source = {
    /** Reuses inspected declarations without fetching the root again. */
    inspect: async (inspectionSignal?: AbortSignal) => {
      signal.throwIfAborted();
      inspectionSignal?.throwIfAborted();
      return selectedInspection;
    },
    /** Decodes and releases each selected placement in declaration order. */
    async *read(_inspection: BrowserTilesetConversionInspection, readSignal?: AbortSignal) {
      const signal = readSignal ? AbortSignal.any([options.signal, readSignal]) : options.signal;
      signal.throwIfAborted();
      let decodedBytes = 0;
      let primitiveCount = 0;
      for await (const raw of rawSource.read(selectedInspection, signal)) {
        const selection = selectedContents.get(raw.resourceId);
        if (!selection)
          throw new TileConversionError(
            'INVALID_BROWSER_SELECTION',
            'Source yielded an uninspected content placement'
          );
        const contentUrl = raw.contentUrl ?? selection.contentUrl;
        const runtime = createSelectedRuntime(
          selection.tileset,
          raw.data,
          signal,
          boundedFetcher,
          contentUrl,
          dracoLibraryOptions,
          spatialContext.spatialReference
        );
        try {
          await runtime.tilesetInitializationPromise;
          const meshSource = createMeshTilesetConversionSource(runtime, {
            unloadContent: true,
            features,
            readExternalResource: async (uri, _contentUri, resourceSignal) => {
              const response = await boundedFetcher(new URL(uri, contentUrl), {
                signal: resourceSignal
              });
              return new Uint8Array(await response.arrayBuffer());
            }
          });
          const metadata = await meshSource.inspect(signal);
          const selectedContext = createTiles3DConversionSpatialContext(metadata.spatialReference!);
          if (
            selectedContext.spatialReference.coordinateEpoch !==
            spatialContext.spatialReference.coordinateEpoch
          )
            throw new TileConversionError(
              'MESH_SOURCE_EPOCH_MISMATCH',
              'Selected content coordinate epoch must match the root; epoch transformations are unsupported'
            );
          let meshCount = 0;
          for await (const resource of meshSource.read(metadata, signal)) {
            meshCount++;
            if (preserveHierarchy && meshCount > 1)
              throw new TileConversionError(
                'MESH_HIERARCHY_UNSUPPORTED',
                'Hierarchy conversion requires one mesh primitive per content'
              );
            if (++primitiveCount > SELECTED_MESH_LIMITS.maxMeshResources)
              throw new Error('Selected contents exceed the mesh primitive placement limit.');
            decodedBytes += measureMeshBytes(resource);
            if (decodedBytes > maxInputBytes)
              throw new TileConversionError(
                'INPUT_RESOURCE_TOO_LARGE',
                'Selected decoded geometry and encoded images exceed the aggregate input byte limit.'
              );
            yield {
              ...resource,
              id: `${raw.resourceId}/${resource.id}`,
              contentResourceId: raw.resourceId
            };
          }
          if (!meshCount) throw new Error('Selected content has no mesh primitive.');
        } finally {
          runtime.destroy();
        }
      }
    }
  };
  return {
    source,
    spatialContext,
    geometricError:
      Math.max(...selections.map(selection => selection.geometricError)) +
      SELECTED_MESH_LIMITS.maxPositionError
  };
}

/** Dedicated runtime source that inherits an absent external-document CRS from the qualified root. */
class SelectedTiles3DSource extends Tiles3DSource {
  /** Parent frame; explicit, unknown or unresolved child declarations are never replaced. */
  private readonly inheritedSpatialReference?: TilesetSpatialReference;

  /** Creates a selected source with optional external-document frame inheritance. */
  constructor(
    input: TilesetSourceInput,
    options: LoaderOptions,
    inheritedSpatialReference?: TilesetSpatialReference
  ) {
    super(input, options);
    this.inheritedSpatialReference = inheritedSpatialReference;
  }

  /** Returns source metadata with the same absent-CRS inheritance used by external tilesets. */
  override getMetadata(): TilesetSourceMetadata {
    const metadata = super.getMetadata();
    const reference = metadata.spatialReference;
    if (
      this.inheritedSpatialReference &&
      reference?.crs.state === 'absent' &&
      reference.coordinateEpoch === undefined &&
      !reference.verticalCrs &&
      !reference.warnings.length
    )
      return {...metadata, spatialReference: this.inheritedSpatialReference};
    return metadata;
  }
}

/** Creates a dedicated runtime whose only content response is the bounded selected payload. */
function createSelectedRuntime(
  document: BrowserTilesetConversionInspection['tileset'],
  data: Uint8Array,
  signal: AbortSignal,
  boundedFetcher: typeof fetch,
  contentUrl: string,
  dracoLibraryOptions: DracoLibraryOptions,
  inheritedSpatialReference?: TilesetSpatialReference
): Tileset3D {
  const {
    modules,
    decoderProfile,
    CDN: contentDeliveryNetwork,
    useLocalLibraries
  } = dracoLibraryOptions;
  const loadOptions = {
    modules,
    core: {
      worker: false,
      fetch: boundedFetcher,
      CDN: contentDeliveryNetwork,
      useLocalLibraries
    },
    // Reuse the full decoder already bundled for output verification.
    draco: {decoderProfile},
    // Preserve authored UVs and the transform for the converter's qualified GLB writer.
    gltf: {
      loadImages: false,
      decompressMeshes: true,
      excludeExtensions: {
        KHR_texture_transform: false,
        // Only Draco input compression is qualified by this conversion profile.
        EXT_meshopt_compression: false,
        KHR_meshopt_compression: false
      }
    },
    '3d-tiles': {loadGLTF: true}
  };
  return new Tileset3D(
    new SelectedTiles3DSource(
      {
        url: contentUrl,
        loader: Tiles3DLoader,
        resolver: {
          /** Normalizes the selected hierarchy through the format loader, retaining ancestor transforms. */
          loadRoot: async (_url: string, loader: Loader, options: LoaderOptions) =>
            parse(new TextEncoder().encode(JSON.stringify(document)), loader, options),
          /** Decodes only the selected bounded payload; no sibling content can be requested. */
          loadResource: async (_url: string, loader: Loader, options: LoaderOptions) => {
            signal.throwIfAborted();
            return parse(data, loader, options, {
              url: contentUrl,
              baseUrl: contentUrl.startsWith('blob:') ? contentUrl : new URL('.', contentUrl).href,
              fetch: boundedFetcher,
              coreApi,
              _parse: parse
            });
          }
        }
      },
      loadOptions,
      inheritedSpatialReference
    )
  );
}

/** Charges geometry, encoded image bytes, triangle associations and Arrow columns after extraction. */
export function measureMeshBytes(resource: MeshSourceResource): number {
  const featureBytes = resource.features
    ? resource.features.triangleFeatureIndices.byteLength +
      resource.features.batches.reduce(
        (bytes, batch) =>
          bytes +
          batch.data.schema.fields.reduce(
            (columnBytes, field) =>
              columnBytes + (batch.data.getChild(field.name)?.byteLength ?? 0),
            0
          ),
        0
      )
    : 0;
  return Object.values(resource.mesh.attributes).reduce(
    (bytes, attribute) => bytes + attribute.value.byteLength,
    (resource.mesh.indices?.value.byteLength ?? 0) +
      (resource.material?.baseColorTexture?.data.byteLength ?? 0) +
      featureBytes
  );
}
