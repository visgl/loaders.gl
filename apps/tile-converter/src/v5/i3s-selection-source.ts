// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {coreApi, parse} from '@loaders.gl/core';
import {I3SLoader} from '@loaders.gl/i3s';
import type {I3STileHeader, SceneLayer3D} from '@loaders.gl/i3s';
import {I3SSource, Tileset3D} from '@loaders.gl/tiles';
import type {TilesetSourceResolver} from '@loaders.gl/tiles';
import {
  createI3SConversionSpatialContext,
  TileConversionError
} from '@loaders.gl/tile-converter/v5/core';
import {createI3SMeshTilesetConversionSource} from './i3s-mesh-source.js';
import type {I3SMeshSourceFeatureOptions} from './i3s-mesh-source.js';
import {SELECTED_MESH_LIMITS, measureMeshBytes} from './selected-mesh-source.js';
import type {SelectedMeshSourceOptions} from './selected-mesh-source.js';

/** Inspected leaf mesh identity and immutable normalized header. */
export interface I3SMeshConversionResourceDescriptor {
  /** Unique declared node identity. */
  readonly resourceId: string;
  /** Source-managed geometry URL. */
  readonly uri: string;
  /** Normalized header without runtime objects. */
  readonly header: I3STileHeader;
}

/** Metadata-only I3S selection, independent of browser or Node transport ownership. */
export interface I3SMeshConversionInspection {
  /** Discriminant for I3S mesh input. */
  readonly kind: 'i3s';
  /** Absolute layer or archive virtual root URL. */
  readonly rootUrl: string;
  /** Original layer declarations. */
  readonly layer: SceneLayer3D;
  /** Ordered leaf mesh declarations. */
  readonly resources: readonly I3SMeshConversionResourceDescriptor[];
  /** Previously consumed transport bytes, supplied by the owner. */
  readonly metadataBytes: number;
}

/** Platform-injected transport and decoder policy for bounded I3S selection. */
export interface I3SMeshSelectionOptions {
  /** Root layer or confined archive root URL. */
  readonly rootUrl: string;
  /** Lifetime-budgeted transport shared between metadata and payload reads. */
  readonly fetcher: typeof fetch;
  /** Operation cancellation. */
  readonly signal: AbortSignal;
  /** Bundled or application-owned Draco assets. */
  readonly dracoLibraryOptions: SelectedMeshSourceOptions['dracoLibraryOptions'];
  /** Maximum decoded mesh bytes; callers may lower the 16 MiB profile. */
  readonly maxInputBytes?: number;
  /** Maximum inspected nodes; callers may lower the 1,000 node profile. */
  readonly maxInputResources?: number;
}

/** Creates a dedicated source-coordinate runtime with transport and all decoder assets injected. */
function createRuntime(
  transport: I3SMeshSelectionOptions,
  layer?: SceneLayer3D,
  header?: I3STileHeader
): Tileset3D {
  const libraries = transport.dracoLibraryOptions;
  const sourceUrl = new URL(transport.rootUrl);
  sourceUrl.search = '';
  sourceUrl.hash = '';
  const options = {
    modules: libraries.modules,
    core: {
      worker: false,
      fetch: transport.fetcher,
      CDN: libraries.CDN,
      useLocalLibraries: libraries.useLocalLibraries
    },
    draco: {decoderProfile: libraries.decoderProfile},
    searchParams: Object.fromEntries(new URL(transport.rootUrl).searchParams),
    i3s: {geometryMode: 'source' as const, decodeTextures: false, useCompressedTextures: false}
  };
  /** Parses a source-managed resource with the same transport available to nested dependencies. */
  const loadResource: TilesetSourceResolver['loadResource'] = async (url, loader, loadOptions) => {
    const response = await transport.fetcher(url);
    const contextUrl = new URL(url);
    contextUrl.search = '';
    contextUrl.hash = '';
    return parse(await response.arrayBuffer(), loader, loadOptions, {
      url: contextUrl.href,
      fetch: transport.fetcher,
      coreApi,
      _parse: parse
    });
  };
  const source = new I3SSource(
    header && layer
      ? {
          ...layer,
          root: {...header, children: []},
          type: 'I3S',
          url: sourceUrl.href,
          basePath: sourceUrl.href,
          loader: I3SLoader,
          coreApi
        }
      : {
          url: sourceUrl.href,
          loader: I3SLoader,
          coreApi,
          resolver: {loadRoot: loadResource, loadResource}
        },
    options
  );
  // Preloaded selection still uses this resolver for content; never let core perform unbounded I/O.
  source.coreApi = {...coreApi, load: loadResource as typeof coreApi.load};
  return new Tileset3D(source, {i3s: options.i3s});
}

/** Inspects supported layer/leaf declarations without requesting geometry, textures or attributes. */
export async function inspectI3SMeshConversionSource(
  options: I3SMeshSelectionOptions
): Promise<I3SMeshConversionInspection> {
  const {signal} = options;
  validateSelectionOptions(options);
  signal.throwIfAborted();
  const transport = options;
  let runtime: Tileset3D | undefined;
  try {
    const response = await transport.fetcher(transport.rootUrl);
    const layer = (await response.json()) as SceneLayer3D;
    if (!['3DObject', 'IntegratedMesh'].includes(layer.layerType))
      throw new Error('Conversion accepts I3S 3DObject or IntegratedMesh layers.');
    // Reuse the inspected root; all further metadata requests are still charged.
    const rootFetcher = transport.fetcher;
    const cachedFetcher: typeof fetch = (url, options) => {
      const requestUrl = new URL(url instanceof Request ? url.url : String(url));
      const root = new URL(transport.rootUrl);
      return requestUrl.origin === root.origin && requestUrl.pathname === root.pathname
        ? Promise.resolve(new Response(JSON.stringify(layer)))
        : rootFetcher(url, options);
    };
    runtime = createRuntime({...transport, fetcher: cachedFetcher});
    await runtime.tilesetInitializationPromise;
    await createI3SMeshTilesetConversionSource(runtime).inspect(signal);
    const stack = [runtime.root!];
    const identifiers = new Set<string>();
    const resources: I3SMeshConversionResourceDescriptor[] = [];
    while (stack.length) {
      signal.throwIfAborted();
      const tile = stack.pop()!;
      if (
        !['string', 'number'].includes(typeof tile.header.id) ||
        String(tile.header.id).length === 0
      )
        throw new Error('I3S nodes require a declared identity.');
      const identifier = String(tile.header.id);
      if (identifiers.has(identifier))
        throw new Error('Repeated I3S node identity is unsupported.');
      identifiers.add(identifier);
      if (
        identifiers.size + stack.length + (tile.header.children?.length ?? 0) >
        (options.maxInputResources ?? SELECTED_MESH_LIMITS.maxInputResources)
      )
        throw new Error('I3S inspection exceeds the 1,000 node limit.');
      await runtime.source.loadTileChildrenForTraversal!(tile, signal);
      if (!tile.children.length && tile.contentUrl)
        resources.push({
          resourceId: identifier,
          uri: tile.contentUrl,
          header: structuredClone(tile.header)
        });
      for (const child of [...tile.children].reverse()) stack.push(child);
    }
    signal.throwIfAborted();
    if (!resources.length) throw new Error('No supported leaf mesh nodes are declared.');
    return {
      kind: 'i3s',
      rootUrl: transport.rootUrl,
      layer,
      resources,
      metadataBytes: 0
    };
  } finally {
    runtime?.destroy();
  }
}

/** Converts explicitly selected I3S leaf meshes into a bounded flat collection in either format. */
export async function createSelectedI3SMeshConversionSource(
  inspection: I3SMeshConversionInspection,
  options: I3SMeshSelectionOptions & {
    /** Explicit distinct inspected leaf-node identities. */
    readonly resourceIds: readonly string[];
    /** Explicit attribute mapping for feature-bearing meshes. */
    readonly features?: I3SMeshSourceFeatureOptions;
  }
) {
  const {resourceIds, signal, features} = options;
  validateSelectionOptions(options);
  signal.throwIfAborted();
  if (inspection.rootUrl !== options.rootUrl)
    throw new TileConversionError(
      'INVALID_I3S_SELECTION',
      'Selection transport must match the inspected layer'
    );
  if (
    !resourceIds.length ||
    resourceIds.length > SELECTED_MESH_LIMITS.maxSelectedResources ||
    new Set(resourceIds).size !== resourceIds.length ||
    resourceIds.some(
      identifier => !inspection.resources.some(resource => resource.resourceId === identifier)
    )
  )
    throw new Error('Select between 1 and 64 distinct leaf mesh nodes.');
  const selected = inspection.resources.filter(resource =>
    resourceIds.includes(resource.resourceId)
  );
  if (
    selected.some(
      resource =>
        resource.header.children?.length ||
        !resource.header.contentUrl ||
        resource.uri !== resource.header.contentUrl
    )
  )
    throw new Error('Only inspected leaf mesh headers can be converted.');
  const transport = options;
  let decodedBytes = 0;
  let meshCount = 0;
  {
    const qualification = createRuntime(transport, inspection.layer, selected[0].header);
    let spatialContext: ReturnType<typeof createI3SConversionSpatialContext>;
    try {
      await qualification.tilesetInitializationPromise;
      const metadata = await createI3SMeshTilesetConversionSource(qualification).inspect(signal);
      spatialContext = createI3SConversionSpatialContext(metadata.spatialReference!, {
        targetCrs: 'EPSG:4978'
      });
    } finally {
      qualification.destroy();
    }
    const source = {
      /** Reuses only immutable inspected declarations. */
      inspect: async () => inspection,
      /** Releases each dedicated node runtime before moving on or closing early. */
      async *read() {
        for (const descriptor of selected) {
          const runtime = createRuntime(transport, inspection.layer, descriptor.header);
          try {
            await runtime.tilesetInitializationPromise;
            const meshSource = createI3SMeshTilesetConversionSource(runtime, {
              unloadContent: true,
              features,
              readExternalResource: async uri =>
                new Uint8Array(
                  await (await transport.fetcher(runtime.source.getTileUrl(uri))).arrayBuffer()
                )
            });
            const metadata = await meshSource.inspect(signal);
            for await (const resource of meshSource.read(metadata, signal)) {
              decodedBytes += measureMeshBytes(resource);
              if (
                ++meshCount > SELECTED_MESH_LIMITS.maxMeshResources ||
                decodedBytes > (options.maxInputBytes ?? SELECTED_MESH_LIMITS.maxInputBytes)
              )
                throw new TileConversionError(
                  'INPUT_RESOURCE_TOO_LARGE',
                  'Selected I3S decoded resources exceed the input/mesh budget'
                );
              yield {...resource, id: descriptor.resourceId};
            }
          } finally {
            runtime.destroy();
          }
        }
      }
    };
    return {source, spatialContext};
  }
}

/** Keeps public selected-source limits within the same bounded profile as platform adapters. */
function validateSelectionOptions(options: I3SMeshSelectionOptions): void {
  for (const [value, maximum] of [
    [
      options.maxInputBytes ?? SELECTED_MESH_LIMITS.maxInputBytes,
      SELECTED_MESH_LIMITS.maxInputBytes
    ],
    [
      options.maxInputResources ?? SELECTED_MESH_LIMITS.maxInputResources,
      SELECTED_MESH_LIMITS.maxInputResources
    ]
  ])
    if (!Number.isSafeInteger(value) || value < 1 || value > maximum)
      throw new TileConversionError(
        'INVALID_I3S_SELECTION_LIMIT',
        'I3S selection limits must be positive safe integers within the bounded profile'
      );
}
