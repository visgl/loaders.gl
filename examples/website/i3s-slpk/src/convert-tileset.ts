import {parse} from '@loaders.gl/core';
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
  BrowserTileConversionFile,
  TileConversionReport
} from '@loaders.gl/tile-converter/v5/core';
import type {MeshSourceResource} from '@loaders.gl/tile-converter/v5/adapters';
import {
  createMeshTilesetConversionSource,
  createMeshConversionCodec,
  createI3SMeshConversionCodec,
  createSingleMeshTilesetSink,
  createSingleMeshI3SSink,
  createTileConversionArchive
} from '@loaders.gl/tile-converter/v5/adapters';

/** Formats authored by the example, rather than inferred from an output filename. */
export type ConversionFormat = 'slpk' | '3tz';
/** Required transport, decoded geometry, retained output, and archive budgets for this demo. */
export const CONVERSION_LIMITS = {
  /** Root JSON plus selected content transport bytes; also the decoded geometry byte gate. */
  maxInputBytes: 16 * 1024 * 1024,
  /** Maximum declared content placements inspected. */
  maxInputResources: 1000,
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

/** Inspects a bounded explicit tileset without fetching its content resources. */
export async function inspectConversionInput(
  input: string,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch
): Promise<BrowserTilesetConversionInspection> {
  if (!['http:', 'https:'].includes(new URL(input).protocol)) {
    throw new Error('Use an HTTP(S) tileset URL.');
  }
  return createBrowserTilesetConversionSource({input, ...CONVERSION_LIMITS, fetcher}).inspect(
    signal
  );
}

/**
 * Converts only the explicitly selected content placement. The initial profile requires exactly
 * one static, untextured mesh primitive; unsupported metadata and scene features fail explicitly.
 * Transport and retained output are bounded, but these limits do not bound peak decoder memory.
 */
export async function convertSelectedContent(
  inspection: BrowserTilesetConversionInspection,
  resourceId: string,
  format: ConversionFormat,
  signal: AbortSignal,
  onProgress: (message: string) => void,
  fetcher: typeof fetch = fetch
): Promise<ConversionResult> {
  const descriptor = inspection.resources.find(resource => resource.resourceId === resourceId);
  if (!descriptor) throw new Error('Select a content placement from the inspected tileset.');
  signal.throwIfAborted();
  onProgress('Loading selected content');
  const rawSource = createBrowserTilesetConversionSource({
    input: inspection.rootUrl,
    ...CONVERSION_LIMITS,
    fetcher
  });
  const iterator = rawSource
    .read({...inspection, resources: [descriptor]}, signal)
    [Symbol.asyncIterator]();
  const raw = await iterator.next();
  await iterator.return?.();
  if (raw.done) throw new Error('The selected content is empty.');
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
    .findIndex(resource => resource.resourceId === resourceId);
  const content = tile.contents?.[contentIndex] ?? tile.content!;
  tile.content = content;
  delete tile.contents;
  delete tile.children;

  /** Blocks external buffers, images, schemas, and decoder downloads outside the selected payload. */
  const rejectExternalFetch: typeof fetch = async () => {
    throw new TileConversionError(
      'EXTERNAL_RESOURCE_UNSUPPORTED',
      'Use self-contained GLB/B3DM content.'
    );
  };
  const loadOptions = {
    worker: false,
    fetch: rejectExternalFetch,
    gltf: {loadImages: false, decompressMeshes: false},
    '3d-tiles': {loadGLTF: true}
  };
  const runtime = new Tileset3D(
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
            return parse(raw.value.data, loader, options);
          }
        }
      },
      loadOptions
    )
  );
  try {
    // Observe initialization even when subsequent source qualification or output setup rejects.
    await runtime.tilesetInitializationPromise;
    const source = createMeshTilesetConversionSource(runtime, {unloadContent: true});
    const metadata = await source.inspect(signal);
    const spatialContext = createTiles3DConversionSpatialContext(metadata.spatialReference!);
    const common = {
      source,
      signal,
      maxInputResourceBytes: CONVERSION_LIMITS.maxInputBytes,
      maxOutputResourceBytes: CONVERSION_LIMITS.maxOutputBytes,
      measureInputBytes: (resource: MeshSourceResource) =>
        Object.values(resource.mesh.attributes).reduce(
          (bytes, attribute) => bytes + attribute.value.byteLength,
          resource.mesh.indices?.value.byteLength ?? 0
        ),
      onProgress: (progress: {phase: string}) => onProgress(progress.phase)
    };
    const sinkOptions = {maxTotalBytes: CONVERSION_LIMITS.maxOutputBytes};
    let report: TileConversionReport;
    let files: readonly BrowserTileConversionFile[];
    if (format === '3tz') {
      const sink = createSingleMeshTilesetSink({
        ...sinkOptions,
        geometricError: getGeometricError(document) + CONVERSION_LIMITS.maxPositionError
      });
      report = await convertTileset({
        ...common,
        sink,
        codec: createMeshConversionCodec({
          spatialContext,
          maxPositionError: CONVERSION_LIMITS.maxPositionError
        }),
        measureOutputBytes: resource => resource.glb.byteLength
      });
      files = sink.getFiles();
    } else {
      const sink = createSingleMeshI3SSink(sinkOptions);
      report = await convertTileset({
        ...common,
        sink,
        codec: createI3SMeshConversionCodec({
          spatialContext,
          maxPositionError: CONVERSION_LIMITS.maxPositionError,
          maxResourceBytes: CONVERSION_LIMITS.maxOutputBytes
        }),
        measureOutputBytes: resource =>
          Object.values(resource.files).reduce((bytes, buffer) => bytes + buffer.byteLength, 0)
      });
      files = sink.getFiles();
    }
    signal.throwIfAborted();
    onProgress('Packaging archive');
    signal.throwIfAborted();
    const archive = await createTileConversionArchive(files, {
      format,
      maxArchiveBytes: CONVERSION_LIMITS.maxOutputBytes
    });
    signal.throwIfAborted();
    return {file: new File([archive], `selected-mesh.${format}`, {type: archive.type}), report};
  } finally {
    runtime.destroy();
  }
}

/** Retains a conservative source LOD error from the selected hierarchy, rather than guessing zero. */
function getGeometricError(document: BrowserTilesetConversionInspection['tileset']): number {
  let maximum = 0;
  let tile: typeof document.root = document.root;
  while (tile) {
    const error = (tile as typeof tile & {geometricError?: number}).geometricError;
    if (typeof error !== 'number' || !Number.isFinite(error) || error < 0)
      throw new Error('Each selected tile must declare a finite nonnegative geometricError.');
    maximum = Math.max(maximum, error);
    tile = tile.children?.[0];
  }
  return maximum;
}
