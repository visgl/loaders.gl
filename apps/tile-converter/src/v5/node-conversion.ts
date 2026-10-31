// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {mkdir, open, rm, link, mkdtemp} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {convertTileset, TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import type {
  BrowserTileConversionFile,
  BrowserTilesetConversionInspection,
  TileConversionReport
} from '@loaders.gl/tile-converter/v5/core';
import {
  createSelectedMeshConversionSource,
  measureMeshBytes,
  SELECTED_MESH_LIMITS,
  createMeshConversionCodec,
  createI3SMeshConversionCodec,
  createMeshTilesetSink,
  createMeshHierarchyTilesetSink,
  createI3SMeshSink,
  encodeTileConversionArchiveInBatches
} from '@loaders.gl/tile-converter/v5/adapters';
import type {
  I3SMeshSourceFeatureOptions,
  MeshSourceFeatureOptions
} from '@loaders.gl/tile-converter/v5/adapters';
import {createNodeTilesetConversionSource} from './node-source.js';
import {createNodeI3SConversionSource} from './node-i3s-source.js';
import type {NodeTilesetConversionSourceOptions} from './node-source.js';

/** Explicit targets for the initial bounded Node mesh profile. */
export type NodeTileConversionOutputFormat = '3d-tiles' | '3tz' | 'slpk';

/** Selected static mesh conversion with application-owned Node output. */
export interface NodeTileConversionOptions
  extends Omit<NodeTilesetConversionSourceOptions, 'format'> {
  /** Include portable stages and Node setup/output elapsed milliseconds in the report. */
  readonly profile?: boolean;
  /** Explicit 3D Tiles, I3S layer or indexed archive source. */
  readonly format?: '3d-tiles' | '3tz' | 'i3s' | 'slpk';
  /** Explicit I3S attribute mapping, also supplied by the CLI feature-schema file. */
  readonly i3sFeatures?: I3SMeshSourceFeatureOptions;
  /** Required metric source error for I3S to 3D Tiles; no screen-size inference. */
  readonly geometricError?: number;
  /** Retain a complete explicit 3D Tiles tree, including inspected external documents in 3D Tiles/3TZ output. */
  readonly preserveHierarchy?: boolean;
  /** Authorizes IntegratedMesh to 3DObject output with a reported semantic warning. */
  readonly integratedMeshPolicy?: 'as-3d-object';
  /** One to 64 inspected content placement identifiers; no automatic all-content conversion. */
  readonly resourceIds: readonly string[];
  /** Explicit feature class/schema mapping, also supplied by the CLI feature-schema file. */
  readonly features?: MeshSourceFeatureOptions;
  /** Target mesh profile, independent of output filename. */
  readonly outputFormat: NodeTileConversionOutputFormat;
  /** New destination path; omitted for profile validation without writing. */
  readonly output?: string;
  /** Maximum retained files and, separately, archive bytes; at most 32 MiB. */
  readonly maxOutputBytes?: number;
}

/** Runs the qualified browser mesh codecs with confined Node input and optional output. */
export async function convertNodeTileset(
  options: NodeTileConversionOptions
): Promise<TileConversionReport> {
  const started = options.profile ? performance.now() : 0;
  let setupMilliseconds = 0;
  const signal = options.signal ?? new AbortController().signal;
  const maxOutputBytes = options.maxOutputBytes ?? SELECTED_MESH_LIMITS.maxOutputBytes;
  if (
    !['3d-tiles', '3tz', 'slpk'].includes(options.outputFormat) ||
    !Number.isSafeInteger(maxOutputBytes) ||
    maxOutputBytes < 1 ||
    maxOutputBytes > SELECTED_MESH_LIMITS.maxOutputBytes
  )
    throw new TileConversionError(
      'INVALID_NODE_CONVERSION_OPTIONS',
      'Select a supported output profile and a positive output budget at most 32 MiB'
    );
  const i3s = options.format === 'i3s' || options.format === 'slpk';
  if (
    (options.preserveHierarchy !== undefined && typeof options.preserveHierarchy !== 'boolean') ||
    (options.preserveHierarchy && (i3s || options.outputFormat === 'slpk'))
  )
    throw new TileConversionError(
      'MESH_HIERARCHY_UNSUPPORTED',
      'Hierarchy preservation requires 3D Tiles/3TZ input and output'
    );
  if (
    i3s &&
    ((options.outputFormat !== 'slpk' && options.geometricError === undefined) ||
      (options.geometricError !== undefined &&
        (typeof options.geometricError !== 'number' ||
          !Number.isFinite(options.geometricError) ||
          options.geometricError < 0)))
  )
    throw new TileConversionError(
      'MESH_GEOMETRIC_ERROR_INVALID',
      'I3S to 3D Tiles requires an explicit nonnegative geometric error in meters'
    );
  if (
    i3s
      ? options.features !== undefined
      : options.i3sFeatures !== undefined ||
        options.integratedMeshPolicy !== undefined ||
        options.geometricError !== undefined
  )
    throw new TileConversionError(
      'INVALID_NODE_CONVERSION_OPTIONS',
      'Feature and layer policies must match the selected input format'
    );
  const sourceOptions = {
    ...options,
    signal,
    inspectNestedTilesets: true,
    maxTilesetDocuments: options.maxTilesetDocuments ?? SELECTED_MESH_LIMITS.maxTilesetDocuments
  };
  const rawSource = i3s
    ? await createNodeI3SConversionSource({
        ...sourceOptions,
        format: options.format as 'i3s' | 'slpk'
      })
    : await createNodeTilesetConversionSource({
        ...sourceOptions,
        format: options.format as '3d-tiles' | '3tz' | undefined
      });
  let files: readonly BrowserTileConversionFile[];
  let report: TileConversionReport;
  try {
    const inspection = await rawSource.inspect(signal);
    await import('@loaders.gl/core/polyfills');
    const {getDracoLibraryOptions} = await import('@loaders.gl/scene/draco-library-options');
    const dracoLibraryOptions = getDracoLibraryOptions({
      decoderProfile: 'full',
      useLocalLibraries: true
    });
    const selection =
      'select' in rawSource
        ? {
            ...(await rawSource.select(
              inspection as Awaited<ReturnType<typeof rawSource.inspect>>,
              options.resourceIds,
              dracoLibraryOptions,
              options.i3sFeatures
            )),
            geometricError: (options.geometricError ?? 0) + SELECTED_MESH_LIMITS.maxPositionError
          }
        : await createSelectedMeshConversionSource(
            inspection as Awaited<ReturnType<typeof rawSource.inspect>>,
            {
              resourceIds: options.resourceIds,
              preserveHierarchy: options.preserveHierarchy,
              features: options.features,
              signal,
              source: rawSource,
              fetcher: rawSource.fetcher,
              dracoLibraryOptions,
              maxInputBytes: options.maxInputBytes
            }
          );
    const {source, spatialContext, geometricError} = selection;
    setupMilliseconds = options.profile ? performance.now() - started : 0;
    const common = {
      profile: options.profile,
      source,
      signal,
      measureInputBytes: measureMeshBytes,
      maxInputBytes: options.maxInputBytes ?? SELECTED_MESH_LIMITS.maxInputBytes,
      maxOutputBytes,
      maxInputResources: SELECTED_MESH_LIMITS.maxMeshResources,
      maxOutputResources: SELECTED_MESH_LIMITS.maxMeshResources
    };
    const codecOptions = {
      spatialContext,
      autoOrigin: i3s,
      integratedMeshPolicy: options.integratedMeshPolicy,
      dracoLibraryOptions,
      maxPositionError: SELECTED_MESH_LIMITS.maxPositionError
    };
    if (options.outputFormat === 'slpk') {
      const sink = createI3SMeshSink({
        maxTotalBytes: maxOutputBytes,
        maxMeshes: SELECTED_MESH_LIMITS.maxMeshResources,
        maxResourceBytes: maxOutputBytes
      });
      report = await convertTileset({
        ...common,
        sink,
        codec: createI3SMeshConversionCodec({...codecOptions, maxResourceBytes: maxOutputBytes}),
        measureOutputBytes: resource =>
          Object.values(resource.files).reduce((total, bytes) => total + bytes.byteLength, 0)
      });
      files = sink.getFiles();
    } else {
      const sink = options.preserveHierarchy
        ? createMeshHierarchyTilesetSink({
            inspection: inspection as BrowserTilesetConversionInspection,
            resourceIds: options.resourceIds,
            maxTotalBytes: maxOutputBytes,
            maxPositionError: SELECTED_MESH_LIMITS.maxPositionError
          })
        : createMeshTilesetSink({
            maxTotalBytes: maxOutputBytes,
            maxMeshes: SELECTED_MESH_LIMITS.maxMeshResources,
            geometricError
          });
      report = await convertTileset({
        ...common,
        sink,
        codec: createMeshConversionCodec(codecOptions),
        measureOutputBytes: resource => resource.glb.byteLength
      });
      files = sink.getFiles();
    }
  } finally {
    await rawSource.close();
  }
  const outputStarted = options.profile ? performance.now() : 0;
  signal.throwIfAborted();
  // Validate packaging as well as content, including on the write-free validation path.
  if (options.outputFormat !== '3d-tiles' && !options.output) {
    for await (const chunk of encodeTileConversionArchiveInBatches(files, {
      format: options.outputFormat,
      maxArchiveBytes: maxOutputBytes,
      signal
    }))
      void chunk;
  }
  if (options.output)
    await writeNodeTileConversionOutput(
      files,
      options.output,
      options.outputFormat,
      maxOutputBytes,
      signal
    );
  return report.timings
    ? {
        ...report,
        timings: {
          ...report.timings,
          setupMilliseconds,
          outputMilliseconds: performance.now() - outputStarted,
          totalMilliseconds: performance.now() - started
        }
      }
    : report;
}

/** Saves fixed relative resource names or an archive; existing destinations are never overwritten. */
export async function writeNodeTileConversionOutput(
  files: readonly BrowserTileConversionFile[],
  output: string,
  format: NodeTileConversionOutputFormat,
  maxOutputBytes: number,
  signal: AbortSignal
): Promise<void> {
  signal.throwIfAborted();
  if (
    !['3d-tiles', '3tz', 'slpk'].includes(format) ||
    !Number.isSafeInteger(maxOutputBytes) ||
    maxOutputBytes < 1
  )
    throw new TileConversionError(
      'INVALID_NODE_OUTPUT',
      'Output requires a supported format and positive safe byte limit'
    );
  let bytes = 0;
  const names = new Set<string>();
  for (const file of files) {
    const name = file.resourceId;
    if (
      !name ||
      name.includes('\\') ||
      name.includes('\0') ||
      name.includes(':') ||
      name.split('/').some(segment => !segment || segment === '.' || segment === '..') ||
      names.has(name)
    )
      throw new TileConversionError(
        'INVALID_NODE_OUTPUT',
        'Output names must be unique confined relative resource paths'
      );
    names.add(name);
    if (file.blob.size > maxOutputBytes - bytes)
      throw new TileConversionError(
        'OUTPUT_BYTES_LIMIT_EXCEEDED',
        'Output files exceed the byte budget'
      );
    bytes += file.blob.size;
  }
  const destination = resolve(output);
  if (format === '3d-tiles') {
    // Exclusive directory creation makes every subsequently created child application-owned.
    await mkdir(destination);
    try {
      for (const file of files) {
        signal.throwIfAborted();
        const path = join(destination, file.resourceId);
        await mkdir(dirname(path), {recursive: true});
        const handle = await open(path, 'wx');
        try {
          const reader = file.blob.stream().getReader();
          try {
            while (true) {
              signal.throwIfAborted();
              const {value, done} = await reader.read();
              if (done) break;
              await writeFileBytes(handle, value, signal);
            }
          } finally {
            await reader.cancel();
            reader.releaseLock();
          }
        } finally {
          await handle.close();
        }
      }
      signal.throwIfAborted();
    } catch (error) {
      await rm(destination, {recursive: true, force: true});
      throw error;
    }
  } else {
    const temporaryDirectory = await mkdtemp(join(dirname(destination), '.tile-converter-'));
    try {
      const path = join(temporaryDirectory, 'archive');
      const handle = await open(path, 'wx');
      try {
        for await (const chunk of encodeTileConversionArchiveInBatches(files, {
          format,
          maxArchiveBytes: maxOutputBytes,
          signal
        }))
          await writeFileBytes(handle, chunk, signal);
      } finally {
        await handle.close();
      }
      signal.throwIfAborted();
      // Same-filesystem hard link publishes a complete archive and fails if the destination exists.
      await link(path, destination);
    } finally {
      await rm(temporaryDirectory, {recursive: true, force: true});
    }
  }
}

/** Completes native typed-array writes, including partial writes and cooperative cancellation. */
async function writeFileBytes(
  handle: Awaited<ReturnType<typeof open>>,
  bytes: Uint8Array,
  signal: AbortSignal
): Promise<void> {
  let offset = 0;
  while (offset < bytes.byteLength) {
    signal.throwIfAborted();
    const result = await handle.write(bytes, offset, bytes.byteLength - offset);
    if (!result.bytesWritten)
      throw new TileConversionError('NODE_OUTPUT_WRITE_FAILED', 'Output write made no progress');
    offset += result.bytesWritten;
  }
}
