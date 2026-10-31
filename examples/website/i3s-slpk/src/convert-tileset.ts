import {getLoaderOptions} from '@loaders.gl/core';
import {getDracoLibraryOptions as getBundledDracoLibraryOptions} from '@loaders.gl/scene/draco-library-options';
import {
  convertTileset,
  createBrowserTilesetConversionSource
} from '@loaders.gl/tile-converter/v5/core';
import type {
  BrowserTilesetConversionInspection,
  BrowserTileConversionFile,
  TileConversionReport,
  TileConversionProgress,
  TileConversionSource,
  I3SConversionSpatialContext,
  Tiles3DConversionSpatialContext
} from '@loaders.gl/tile-converter/v5/core';
import type {
  MeshSourceResource,
  MeshSourceFeatureOptions
} from '@loaders.gl/tile-converter/v5/adapters';
import {
  createMeshConversionCodec,
  createI3SMeshConversionCodec,
  createMeshTilesetSink,
  createI3SMeshSink,
  encodeTileConversionArchiveInBatches,
  createSelectedMeshConversionSource,
  measureMeshBytes,
  SELECTED_MESH_LIMITS
} from '@loaders.gl/tile-converter/v5/adapters';

import type {ConversionProgressSnapshot} from '../../common/conversion-progress';

import {openConversionArchive, type ConversionArchiveInput} from './conversion-archive-input';

/** Explicit 3D Tiles inspection with an optional indexed archive retained for worker reopening. */
export interface Tiles3DConversionInspection extends BrowserTilesetConversionInspection {
  /** Local or remote 3TZ input; resources remain relative to its virtual root. */
  readonly archive?: ConversionArchiveInput;
}

/** Cooperative controls created inside the worker, separate from cancellation. */
export type MeshConversionControls = {
  /** Receives actual meshes written and decoded input bytes. Mesh totals remain unknown until completion. */
  onProgress?: (progress: ConversionProgressSnapshot) => void;
  /** Stops before pulling the next mesh and finalizes already written output. */
  shouldFinish?: () => boolean;
};

/** Formats authored by the example, rather than inferred from an output filename. */
export type ConversionFormat = 'slpk' | '3tz';
/** Shared bounded selected-mesh profile, used by browser controls and Node services. */
export const CONVERSION_LIMITS = SELECTED_MESH_LIMITS;
export {measureMeshBytes} from '@loaders.gl/tile-converter/v5/adapters';

/** Finalized partial archive and conversion diagnostics, exposed only on success. */
export interface ConversionResult {
  /** Browser-native archive ready for download or incremental preview. */
  readonly file: File;
  /** Completed portable conversion report, including measured precision diagnostics. */
  readonly report: TileConversionReport;
  /** True when Finish stopped mesh enumeration before natural completion. */
  readonly partial?: boolean;
}

/** Finalized resources, ready for packaging after the source runtime has been released. */
export interface ConversionResources {
  /** Immutable output files from the successfully finalized sink. */
  readonly files: readonly BrowserTileConversionFile[];
  /** Archive download filename. */
  readonly name: string;
  /** Completed portable conversion report. */
  readonly report: TileConversionReport;
  /** True when Finish stopped source enumeration before natural exhaustion. */
  readonly partial?: boolean;
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
      inspectNestedTilesets: true,
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
  features?: MeshSourceFeatureOptions,
  controls: MeshConversionControls = {}
): Promise<ConversionResources> {
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
    const {source, spatialContext, geometricError} = await createSelectedMeshConversionSource(
      inspection,
      {
        resourceIds,
        signal,
        features,
        fetcher: archive?.fetcher ?? fetcher,
        dracoLibraryOptions: getDracoLibraryOptions()
      }
    );
    const output = await writeMeshConversionResources(
      source,
      spatialContext,
      format,
      signal,
      onProgress,
      geometricError,
      false,
      controls
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
  autoOrigin = false,
  controls: MeshConversionControls = {}
): Promise<Omit<ConversionResources, 'name'>> {
  let currentResource: string | undefined;
  let partial = false;
  const controlledSource: typeof source = {
    /** Delegates qualification to the existing lazy source. */
    inspect: inspectionSignal => source.inspect(inspectionSignal),
    /** Closes the underlying iterator before another mesh can be fetched or decoded. */
    async *read(inspection, readSignal) {
      const iterator = source.read(inspection, readSignal)[Symbol.asyncIterator]();
      try {
        while (true) {
          // Let the worker receive Finish between meshes, including during synchronous codecs.
          await new Promise(resolve => setTimeout(resolve, 0));
          signal.throwIfAborted();
          if (controls.shouldFinish?.()) {
            partial = true;
            break;
          }
          const step = await iterator.next();
          if (step.done) break;
          currentResource = step.value.id;
          yield step.value;
        }
      } finally {
        await iterator.return?.();
      }
    }
  };
  const common = {
    source: controlledSource,
    signal,
    measureInputBytes: measureMeshBytes,
    maxInputResourceBytes: CONVERSION_LIMITS.maxInputBytes,
    maxOutputResourceBytes: CONVERSION_LIMITS.maxOutputBytes,
    onProgress: (progress: TileConversionProgress) => {
      onProgress(progress.phase);
      controls.onProgress?.({
        phase:
          progress.phase === 'inspect'
            ? 'reading'
            : progress.phase === 'finalize'
              ? 'packaging'
              : 'tiles',
        completedUnits: progress.outputResources,
        totalUnits: null,
        currentResource,
        bytesRead: progress.inputBytes,
        outputBytes: 0
      });
    }
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
  return {files, report, ...(partial ? {partial: true} : {})};
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
    report: output.report,
    ...(output.partial ? {partial: true} : {})
  };
}
