import {coreApi, parse} from '@loaders.gl/core';
import {I3SLoader} from '@loaders.gl/i3s';
import type {I3STileHeader, SceneLayer3D} from '@loaders.gl/i3s';
import {I3SSource, Tileset3D} from '@loaders.gl/tiles';
import type {TilesetSourceResolver} from '@loaders.gl/tiles';
import {
  createI3SConversionSpatialContext,
  TileConversionError
} from '@loaders.gl/tile-converter/v5/core';
import {
  createI3SMeshTilesetConversionSource,
  createTileConversionResourceFetcher
} from '@loaders.gl/tile-converter/v5/adapters';
import type {I3SMeshSourceFeatureOptions} from '@loaders.gl/tile-converter/v5/adapters';
import {
  CONVERSION_LIMITS,
  getDracoLibraryOptions,
  measureMeshBytes,
  writeMeshConversionResources,
  createArchiveFile
} from './convert-tileset';
import type {ConversionFormat, ConversionResources, ConversionResult} from './convert-tileset';

import {openConversionArchive, type ConversionArchiveInput} from './conversion-archive-input';

/** A leaf mesh node selected explicitly after bounded metadata inspection. */
export interface I3SConversionResource {
  /** Source node identity, unique within the inspected tree. */
  readonly resourceId: string;
  /** Source-managed geometry URL. */
  readonly uri: string;
  /** Normalized source header, without runtime objects or loader functions. */
  readonly header: I3STileHeader;
}

/** Structured-cloneable inspection; a local File can be read again by the disposable worker. */
export interface I3SConversionInspection {
  /** Distinguishes I3S inputs from explicit 3D Tiles inspections. */
  readonly kind: 'i3s';
  /** Absolute layer URL, or a synthetic archive root owned by the local reader. */
  readonly rootUrl: string;
  /** Original layer declarations; no inferred schema or normalized loader objects. */
  readonly layer: SceneLayer3D;
  /** Ordered leaf mesh nodes; nonleaf LOD representations are not offered for selection. */
  readonly resources: readonly I3SConversionResource[];
  /** Layer, node-page and header response bytes consumed during inspection. */
  readonly metadataBytes: number;
  /** Indexed local or remote SLPK and its immutable remote identity, if applicable. */
  readonly archive?: ConversionArchiveInput;
}

/** Opens bounded HTTP layer resources or indexed SLPK resources with one response budget. */
async function openTransport(
  input: string | File,
  signal: AbortSignal,
  fetcher: typeof fetch,
  initialInputBytes = 0,
  archiveInput?: ConversionArchiveInput
) {
  const archive =
    archiveInput || typeof input !== 'string'
      ? await openConversionArchive(
          archiveInput ?? {input, format: 'slpk'},
          CONVERSION_LIMITS.maxInputBytes,
          signal,
          fetcher
        )
      : undefined;
  const rootUrl = archive?.rootUrl ?? new URL(input as string).href;
  if (!['http:', 'https:'].includes(new URL(rootUrl).protocol))
    throw new Error('Use an HTTP(S) I3S layer URL.');
  try {
    const transport = archive?.fetcher ?? fetcher;
    const bounded = createTileConversionResourceFetcher({
      maxInputBytes: CONVERSION_LIMITS.maxInputBytes,
      initialInputBytes,
      fetcher: transport,
      signal
    });
    let consumedBytes = initialInputBytes;
    const boundedFetcher: typeof fetch = async (url, options) => {
      const requestUrl = new URL(url instanceof Request ? url.url : String(url));
      const root = new URL(rootUrl);
      if (
        requestUrl.origin === root.origin &&
        (requestUrl.pathname === root.pathname ||
          requestUrl.pathname.startsWith(`${root.pathname}/`))
      )
        for (const [key, value] of root.searchParams)
          if (!requestUrl.searchParams.has(key)) requestUrl.searchParams.set(key, value);
      const response = await bounded(
        url instanceof Request ? new Request(requestUrl, url) : requestUrl,
        options
      );
      const bytes = await response.arrayBuffer();
      consumedBytes += bytes.byteLength;
      return new Response(bytes, {status: response.status, headers: response.headers});
    };
    return {
      rootUrl,
      fetcher: boundedFetcher,
      /** Returns all response bytes charged to this operation, including nested metadata reads. */
      getConsumedBytes: () => consumedBytes,
      /** Releases the local readable-file handle on success, failure or cancellation. */
      close: async () => archive?.close(),
      archive: archive?.descriptor
    };
  } catch (error) {
    await archive?.close();
    throw error;
  }
}

/** Creates a dedicated source-coordinate runtime with transport and all decoder assets injected. */
function createRuntime(
  transport: Awaited<ReturnType<typeof openTransport>>,
  layer?: SceneLayer3D,
  header?: I3STileHeader
): Tileset3D {
  const libraries = getDracoLibraryOptions();
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
export async function inspectI3SConversionInput(
  input: string | File,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
  archiveInput = false
): Promise<I3SConversionInspection> {
  signal.throwIfAborted();
  const transport = await openTransport(
    input,
    signal,
    fetcher,
    0,
    archiveInput ? {input, format: 'slpk'} : undefined
  );
  let runtime: Tileset3D | undefined;
  try {
    const response = await transport.fetcher(transport.rootUrl);
    const layer = (await response.json()) as SceneLayer3D;
    if (!['3DObject', 'IntegratedMesh'].includes(layer.layerType))
      throw new Error('Conversion accepts I3S 3DObject or IntegratedMesh layers.');
    // Reuse the inspected root; all further metadata requests are still charged.
    const rootFetcher = transport.fetcher;
    transport.fetcher = (url, options) => {
      const requestUrl = new URL(url instanceof Request ? url.url : String(url));
      const root = new URL(transport.rootUrl);
      return requestUrl.origin === root.origin && requestUrl.pathname === root.pathname
        ? Promise.resolve(new Response(JSON.stringify(layer)))
        : rootFetcher(url, options);
    };
    runtime = createRuntime(transport);
    await runtime.tilesetInitializationPromise;
    await createI3SMeshTilesetConversionSource(runtime).inspect(signal);
    const stack = [runtime.root!];
    const identifiers = new Set<string>();
    const resources: I3SConversionResource[] = [];
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
        CONVERSION_LIMITS.maxInputResources
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
      metadataBytes: transport.getConsumedBytes(),
      ...(transport.archive ? {archive: transport.archive} : {})
    };
  } finally {
    runtime?.destroy();
    await transport.close();
  }
}

/** Converts explicitly selected I3S leaf meshes into a bounded flat collection in either format. */
export async function convertSelectedI3SContentsToResources(
  inspection: I3SConversionInspection,
  resourceIds: readonly string[],
  format: ConversionFormat,
  signal: AbortSignal,
  onProgress: (message: string) => void,
  fetcher: typeof fetch = fetch,
  features?: I3SMeshSourceFeatureOptions,
  geometricError?: number
): Promise<ConversionResources> {
  if (
    !resourceIds.length ||
    resourceIds.length > CONVERSION_LIMITS.maxSelectedResources ||
    new Set(resourceIds).size !== resourceIds.length ||
    resourceIds.some(
      identifier => !inspection.resources.some(resource => resource.resourceId === identifier)
    )
  )
    throw new Error('Select between 1 and 64 distinct leaf mesh nodes.');
  if (
    format === '3tz' &&
    (typeof geometricError !== 'number' || !Number.isFinite(geometricError) || geometricError < 0)
  )
    throw new Error('I3S to 3TZ requires an explicit nonnegative geometric error in meters.');
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
  const transport = await openTransport(
    inspection.archive?.input ?? inspection.rootUrl,
    signal,
    fetcher,
    inspection.metadataBytes,
    inspection.archive
  );
  let decodedBytes = 0;
  let meshCount = 0;
  try {
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
                ++meshCount > CONVERSION_LIMITS.maxMeshResources ||
                decodedBytes > CONVERSION_LIMITS.maxInputBytes
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
    // I3S screen-size metrics are not metric error. The application must supply a bound in meters
    // for 3TZ; add the qualified encoding error and export only a flat selected collection.
    const output = await writeMeshConversionResources(
      source,
      spatialContext,
      format,
      signal,
      onProgress,
      (geometricError ?? 0) + CONVERSION_LIMITS.maxPositionError,
      true
    );
    return {...output, name: `selected-${selected.length === 1 ? 'mesh' : 'meshes'}.${format}`};
  } finally {
    await transport.close();
  }
}

/** Collects a finalized partial I3S conversion archive for download/preview. */
export async function convertSelectedI3SContents(
  inspection: I3SConversionInspection,
  resourceIds: readonly string[],
  format: ConversionFormat,
  signal: AbortSignal,
  onProgress: (message: string) => void,
  fetcher: typeof fetch = fetch,
  features?: I3SMeshSourceFeatureOptions,
  geometricError?: number
): Promise<ConversionResult> {
  return createArchiveFile(
    await convertSelectedI3SContentsToResources(
      inspection,
      resourceIds,
      format,
      signal,
      onProgress,
      fetcher,
      features,
      geometricError
    ),
    format,
    signal,
    onProgress
  );
}
