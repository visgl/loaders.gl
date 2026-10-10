import {coreApi, getLoaderOptions, parse} from '@loaders.gl/core';
import {getDracoLibraryOptions as getBundledDracoLibraryOptions} from '@loaders.gl/draco/bundled';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
import {
  convertTileset,
  createBrowserTilesetConversionSource,
  createTiles3DConversionSpatialContext,
  TileConversionError
} from '@loaders.gl/tile-converter/v5/core';
import type {
  BrowserTilesetConversionInspection,
  BrowserTilesetResourceDescriptor,
  BrowserTileConversionFile,
  TileConversionReport,
  TileConversionSource,
  I3SConversionSpatialContext,
  Tiles3DConversionSpatialContext
} from '@loaders.gl/tile-converter/v5/core';
import type {
  MeshSourceResource,
  MeshSourceFeatureOptions
} from '@loaders.gl/tile-converter/v5/adapters';
import {
  createMeshTilesetConversionSource,
  createMeshConversionCodec,
  createI3SMeshConversionCodec,
  createMeshTilesetSink,
  createI3SMeshSink,
  createTileConversionResourceFetcher,
  encodeTileConversionArchiveInBatches
} from '@loaders.gl/tile-converter/v5/adapters';

import {openConversionArchive, type ConversionArchiveInput} from './conversion-archive-input';

/** Explicit 3D Tiles inspection with an optional indexed archive retained for worker reopening. */
export interface Tiles3DConversionInspection extends BrowserTilesetConversionInspection {
  /** Local or remote 3TZ input; resources remain relative to its virtual root. */
  readonly archive?: ConversionArchiveInput;
}

/** Formats authored by the example, rather than inferred from an output filename. */
export type ConversionFormat = 'slpk' | '3tz';
/** Required transport, decoded geometry, retained output, and archive budgets for this demo. */
export const CONVERSION_LIMITS = {
  /** Root JSON plus selected content transport bytes; also the decoded geometry/image/feature byte gate. */
  maxInputBytes: 16 * 1024 * 1024,
  /** Maximum declared content placements inspected. */
  maxInputResources: 1000,
  /** Maximum explicitly selected content placements in one partial archive. */
  maxSelectedResources: 64,
  /** Maximum primitive placements authored across all selected contents. */
  maxMeshResources: 64,
  /** Maximum retained file bytes and final archive bytes. */
  maxOutputBytes: 32 * 1024 * 1024,
  /** Maximum measured reconstruction error in meters. */
  maxPositionError: 0.01
} as const;

/** Finalized partial archive and conversion diagnostics, exposed only on success. */
export interface ConversionResult {
  /** Browser-native archive ready for download or incremental preview. */
  readonly file: File;
  /** Completed portable conversion report, including measured precision diagnostics. */
  readonly report: TileConversionReport;
}

/** Finalized resources, ready for packaging after the source runtime has been released. */
export interface ConversionResources {
  /** Immutable output files from the successfully finalized sink. */
  readonly files: readonly BrowserTileConversionFile[];
  /** Archive download filename. */
  readonly name: string;
  /** Completed portable conversion report. */
  readonly report: TileConversionReport;
}

/** MIME types matching the existing format-specific archive writers. */
export const ARCHIVE_MIME_TYPES = {
  /** I3S scene layer package MIME type. */
  slpk: 'application/octet-stream',
  /** Indexed 3D Tiles archive MIME type. */
  '3tz': 'application/vnd.maxar.archive.3tz+zip'
} as const;

/** Inspects a bounded explicit tileset without fetching its content resources. */
export async function inspectConversionInput(
  input: string | File,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
  archiveInput = false
): Promise<Tiles3DConversionInspection> {
  if (
    !archiveInput &&
    typeof input === 'string' &&
    !['http:', 'https:'].includes(new URL(input).protocol)
  )
    throw new Error('Use an HTTP(S) tileset URL.');
  const archive =
    archiveInput || typeof input !== 'string'
      ? await openConversionArchive(
          {input, format: '3tz'},
          CONVERSION_LIMITS.maxInputBytes,
          signal,
          fetcher
        )
      : undefined;
  try {
    const inspection = await createBrowserTilesetConversionSource({
      input: archive?.rootUrl ?? (input as string),
      ...CONVERSION_LIMITS,
      fetcher: archive?.fetcher ?? fetcher
    }).inspect(signal);
    return {...inspection, ...(archive ? {archive: archive.descriptor} : {})};
  } finally {
    await archive?.close();
  }
}

/**
 * Converts the explicitly selected content's static primitive placements. Both formats preserve
 * explicit-schema features and target-supported appearance. Transport and retained output are
 * bounded, but these limits do not bound peak decoder memory.
 */
export async function convertSelectedContent(
  inspection: Tiles3DConversionInspection,
  resourceId: string,
  format: ConversionFormat,
  signal: AbortSignal,
  onProgress: (message: string) => void,
  fetcher: typeof fetch = fetch,
  features?: MeshSourceFeatureOptions
): Promise<ConversionResult> {
  const output = await convertSelectedContentsToResources(
    inspection,
    [resourceId],
    format,
    signal,
    onProgress,
    fetcher,
    features
  );
  return createArchiveFile(output, format, signal, onProgress);
}

/** Applies the application's bundled or configured assets to Draco decoding and encoding. */
export function getDracoLibraryOptions() {
  const {core, modules} = getLoaderOptions();
  return getBundledDracoLibraryOptions({
    decoderProfile: 'full',
    CDN: core?.CDN,
    useLocalLibraries: core?.useLocalLibraries,
    modules
  });
}

/** Retains a conservative source LOD error from the selected hierarchy, rather than guessing zero. */
function getGeometricError(
  document: BrowserTilesetConversionInspection['tileset'],
  tilePath?: readonly number[]
): number {
  let maximum = 0;
  let depth = 0;
  let tile: typeof document.root = document.root;
  while (tile) {
    const error = (tile as typeof tile & {geometricError?: number}).geometricError;
    if (typeof error !== 'number' || !Number.isFinite(error) || error < 0)
      throw new Error('Each selected tile must declare a finite nonnegative geometricError.');
    maximum = Math.max(maximum, error);
    tile = tile.children?.[tilePath ? tilePath[depth++] : 0];
  }
  return maximum;
}

/** Clones one content path, retaining ancestor transforms and removing all unselected content. */
function selectContentDocument(
  inspection: Tiles3DConversionInspection,
  descriptor: BrowserTilesetResourceDescriptor
): BrowserTilesetConversionInspection['tileset'] {
  const document = structuredClone(inspection.tileset);
  let tile = document.root!;
  for (const childIndex of descriptor.tilePath) {
    const child = tile.children![childIndex];
    delete tile.content;
    delete tile.contents;
    tile.children = [child];
    tile = child;
  }
  const contentIndex = inspection.resources
    .filter(resource => resource.tilePath.join('/') === descriptor.tilePath.join('/'))
    .findIndex(resource => resource.resourceId === descriptor.resourceId);
  const content = tile.contents?.[contentIndex] ?? tile.content!;
  tile.content = content;
  delete tile.contents;
  delete tile.children;

  return document;
}

/** Creates a dedicated runtime whose only content response is the bounded selected payload. */
function createSelectedRuntime(
  inspection: Tiles3DConversionInspection,
  document: BrowserTilesetConversionInspection['tileset'],
  data: Uint8Array,
  signal: AbortSignal,
  boundedFetcher: typeof fetch,
  contentUrl: string
): Tileset3D {
  const {
    modules,
    decoderProfile,
    CDN: contentDeliveryNetwork,
    useLocalLibraries
  } = getDracoLibraryOptions();
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
    new Tiles3DSource(
      {
        url: inspection.rootUrl,
        loader: Tiles3DLoader,
        resolver: {
          /** Normalizes the selected hierarchy through the format loader, retaining ancestor transforms. */
          loadRoot: async (_url, loader, options) =>
            parse(new TextEncoder().encode(JSON.stringify(document)), loader, options),
          /** Decodes only the selected bounded payload; no sibling content can be requested. */
          loadResource: async (_url, loader, options) => {
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
      loadOptions
    )
  );
}

/**
 * Exports up to 64 static primitive placements as a flat SLPK or 3TZ collection. Multi-selection
 * requires leaf contents and retains ancestor placement without reproducing source LOD.
 * Selected contents and external dependencies share a transport budget; decoded geometry,
 * encoded images and features share a separate decoded byte gate. Failure discards all output.
 */
export async function convertSelectedContents(
  inspection: Tiles3DConversionInspection,
  resourceIds: readonly string[],
  format: ConversionFormat,
  signal: AbortSignal,
  onProgress: (message: string) => void,
  fetcher: typeof fetch = fetch,
  features?: MeshSourceFeatureOptions
): Promise<ConversionResult> {
  const output = await convertSelectedContentsToResources(
    inspection,
    resourceIds,
    format,
    signal,
    onProgress,
    fetcher,
    features
  );
  return createArchiveFile(output, format, signal, onProgress);
}

/** Authors selected meshes without allocating an archive; used by the streaming worker. */
export async function convertSelectedContentsToResources(
  inspection: Tiles3DConversionInspection,
  resourceIds: readonly string[],
  format: ConversionFormat,
  signal: AbortSignal,
  onProgress: (message: string) => void,
  fetcher: typeof fetch = fetch,
  features?: MeshSourceFeatureOptions
): Promise<ConversionResources> {
  if (
    !resourceIds.length ||
    resourceIds.length > CONVERSION_LIMITS.maxSelectedResources ||
    new Set(resourceIds).size !== resourceIds.length ||
    resourceIds.some(
      identifier => !inspection.resources.some(resource => resource.resourceId === identifier)
    )
  )
    throw new Error('Select between 1 and 64 distinct content placements.');
  const descriptors = inspection.resources.filter(resource =>
    resourceIds.includes(resource.resourceId)
  );
  for (const descriptor of resourceIds.length > 1 ? descriptors : []) {
    let tile = inspection.tileset.root!;
    for (const childIndex of descriptor.tilePath) tile = tile.children![childIndex];
    if (tile.children?.length)
      throw new Error(
        'Multi-selection requires leaf contents; source LOD hierarchy is not exported.'
      );
  }
  signal.throwIfAborted();
  const archive = inspection.archive
    ? await openConversionArchive(
        inspection.archive,
        CONVERSION_LIMITS.maxInputBytes,
        signal,
        fetcher
      )
    : undefined;
  try {
    const boundedFetcher = createTileConversionResourceFetcher({
      maxInputBytes: CONVERSION_LIMITS.maxInputBytes,
      initialInputBytes: inspection.tilesetBytes,
      fetcher: archive?.fetcher ?? fetcher,
      signal
    });
    const qualification = createSelectedRuntime(
      inspection,
      selectContentDocument(inspection, descriptors[0]),
      new Uint8Array(),
      signal,
      boundedFetcher,
      new URL(descriptors[0].uri, inspection.rootUrl).href
    );
    let spatialContext: ReturnType<typeof createTiles3DConversionSpatialContext>;
    try {
      await qualification.tilesetInitializationPromise;
      const metadata = await createMeshTilesetConversionSource(qualification).inspect(signal);
      spatialContext = createTiles3DConversionSpatialContext(metadata.spatialReference!);
    } finally {
      qualification.destroy();
    }
    const rawSource = createBrowserTilesetConversionSource({
      input: inspection.rootUrl,
      ...CONVERSION_LIMITS,
      fetcher: boundedFetcher
    });
    const selectedInspection = {...inspection, resources: descriptors};
    const source = {
      /** Reuses inspected declarations without fetching the root again. */
      inspect: async () => selectedInspection,
      /** Decodes and releases each selected placement in declaration order. */
      async *read() {
        let decodedBytes = 0;
        let primitiveCount = 0;
        for await (const raw of rawSource.read(selectedInspection, signal)) {
          const runtime = createSelectedRuntime(
            inspection,
            selectContentDocument(inspection, raw),
            raw.data,
            signal,
            boundedFetcher,
            new URL(raw.uri, inspection.rootUrl).href
          );
          try {
            await runtime.tilesetInitializationPromise;
            const meshSource = createMeshTilesetConversionSource(runtime, {
              unloadContent: true,
              features,
              readExternalResource: async (uri, _contentUri, resourceSignal) => {
                const response = await boundedFetcher(
                  new URL(uri, new URL(raw.uri, inspection.rootUrl).href),
                  {signal: resourceSignal}
                );
                return new Uint8Array(await response.arrayBuffer());
              }
            });
            const metadata = await meshSource.inspect(signal);
            let meshCount = 0;
            for await (const resource of meshSource.read(metadata, signal)) {
              meshCount++;
              if (++primitiveCount > CONVERSION_LIMITS.maxMeshResources)
                throw new Error('Selected contents exceed the mesh primitive placement limit.');
              decodedBytes += measureMeshBytes(resource);
              if (decodedBytes > CONVERSION_LIMITS.maxInputBytes)
                throw new TileConversionError(
                  'INPUT_RESOURCE_TOO_LARGE',
                  'Selected decoded geometry and encoded images exceed the aggregate input byte limit.'
                );
              yield {...resource, id: `${raw.resourceId}/${resource.id}`};
            }
            if (!meshCount) throw new Error('Selected content has no mesh primitive.');
          } finally {
            runtime.destroy();
          }
        }
      }
    };
    const output = await writeMeshConversionResources(
      source,
      spatialContext,
      format,
      signal,
      onProgress,
      Math.max(
        ...descriptors.map(descriptor => getGeometricError(inspection.tileset, descriptor.tilePath))
      ) + CONVERSION_LIMITS.maxPositionError
    );
    return {...output, name: `selected-${resourceIds.length === 1 ? 'mesh' : 'meshes'}.${format}`};
  } finally {
    await archive?.close();
  }
}

/** Authors a bounded flat mesh collection through the shared qualified format codecs. */
export async function writeMeshConversionResources(
  source: TileConversionSource<unknown, MeshSourceResource>,
  spatialContext: Tiles3DConversionSpatialContext | I3SConversionSpatialContext,
  format: ConversionFormat,
  signal: AbortSignal,
  onProgress: (message: string) => void,
  geometricError: number,
  autoOrigin = false
): Promise<Omit<ConversionResources, 'name'>> {
  const common = {
    source,
    signal,
    measureInputBytes: measureMeshBytes,
    maxInputResourceBytes: CONVERSION_LIMITS.maxInputBytes,
    maxOutputResourceBytes: CONVERSION_LIMITS.maxOutputBytes,
    onProgress: (progress: {phase: string}) => onProgress(progress.phase)
  };
  const codecOptions = {
    dracoLibraryOptions: getDracoLibraryOptions(),
    spatialContext,
    autoOrigin,
    maxPositionError: CONVERSION_LIMITS.maxPositionError
  };
  let files: readonly BrowserTileConversionFile[];
  let report: TileConversionReport;
  if (format === '3tz') {
    const sink = createMeshTilesetSink({
      maxTotalBytes: CONVERSION_LIMITS.maxOutputBytes,
      maxMeshes: CONVERSION_LIMITS.maxMeshResources,
      geometricError
    });
    report = await convertTileset({
      ...common,
      sink,
      codec: createMeshConversionCodec(codecOptions),
      measureOutputBytes: resource => resource.glb.byteLength
    });
    files = sink.getFiles();
  } else {
    const sink = createI3SMeshSink({
      maxTotalBytes: CONVERSION_LIMITS.maxOutputBytes,
      maxMeshes: CONVERSION_LIMITS.maxMeshResources,
      maxResourceBytes: CONVERSION_LIMITS.maxOutputBytes
    });
    report = await convertTileset({
      ...common,
      sink,
      codec: createI3SMeshConversionCodec({
        ...codecOptions,
        maxResourceBytes: CONVERSION_LIMITS.maxOutputBytes
      }),
      measureOutputBytes: resource =>
        Object.values(resource.files).reduce((bytes, buffer) => bytes + buffer.byteLength, 0)
    });
    files = sink.getFiles();
  }
  signal.throwIfAborted();
  return {files, report};
}

/** Collects archive chunks as Blob parts for the main-thread integration helpers. */
export async function createArchiveFile(
  output: ConversionResources,
  format: ConversionFormat,
  signal: AbortSignal,
  onProgress: (message: string) => void
): Promise<ConversionResult> {
  signal.throwIfAborted();
  onProgress('Packaging archive');
  const parts: Blob[] = [];
  for await (const chunk of encodeTileConversionArchiveInBatches(output.files, {
    format,
    maxArchiveBytes: CONVERSION_LIMITS.maxOutputBytes,
    signal
  })) {
    parts.push(new Blob([chunk]));
  }
  signal.throwIfAborted();
  return {
    file: new File(parts, output.name, {type: ARCHIVE_MIME_TYPES[format]}),
    report: output.report
  };
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
