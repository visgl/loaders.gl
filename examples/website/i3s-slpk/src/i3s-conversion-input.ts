import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import {
  createTileConversionResourceFetcher,
  inspectI3SMeshConversionSource,
  createSelectedI3SMeshConversionSource
} from '@loaders.gl/tile-converter/v5/adapters';
import type {
  I3SMeshSourceFeatureOptions,
  I3SMeshConversionInspection,
  I3SMeshConversionResourceDescriptor
} from '@loaders.gl/tile-converter/v5/adapters';
import {
  CONVERSION_LIMITS,
  getDracoLibraryOptions,
  writeMeshConversionResources,
  createArchiveFile
} from './convert-tileset';
import type {ConversionFormat, ConversionResources, ConversionResult} from './convert-tileset';
import {openConversionArchive, type ConversionArchiveInput} from './conversion-archive-input';

export type I3SConversionResource = I3SMeshConversionResourceDescriptor;

/** Cloneable browser inspection with an optional archive identity for worker reopening. */
export interface I3SConversionInspection extends I3SMeshConversionInspection {
  /** Indexed local or remote SLPK descriptor. */
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

/** Inspects supported leaf declarations through the shared portable adapter. */
export async function inspectI3SConversionInput(
  input: string | File,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
  archiveInput = false
): Promise<I3SConversionInspection> {
  const transport = await openTransport(input, signal, fetcher, 0, archiveInput ? {input, format: 'slpk'} : undefined);
  try {
    const inspection = await inspectI3SMeshConversionSource({
      ...transport, signal, dracoLibraryOptions: getDracoLibraryOptions()
    });
    return {...inspection, metadataBytes: transport.getConsumedBytes(), ...(transport.archive ? {archive: transport.archive} : {})};
  } finally {
    await transport.close();
  }
}

/** Converts inspected I3S leaves into the existing bounded flat archive profiles. */
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
  if (format === '3tz' && (typeof geometricError !== 'number' || !Number.isFinite(geometricError) || geometricError < 0))
    throw new TileConversionError('MESH_GEOMETRIC_ERROR_INVALID', 'I3S to 3TZ requires an explicit nonnegative geometric error in meters.');
  const transport = await openTransport(inspection.archive?.input ?? inspection.rootUrl, signal, fetcher, inspection.metadataBytes, inspection.archive);
  try {
    const {source, spatialContext} = await createSelectedI3SMeshConversionSource(inspection, {
      ...transport, signal, resourceIds, features, dracoLibraryOptions: getDracoLibraryOptions()
    });
    const output = await writeMeshConversionResources(source, spatialContext, format, signal, onProgress,
      (geometricError ?? 0) + CONVERSION_LIMITS.maxPositionError, true);
    return {...output, name: `selected-${resourceIds.length === 1 ? 'mesh' : 'meshes'}.${format}`};
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
