// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TileConversionError} from './conversion-api.js';
import type {TileConversionReport, TileConversionSink} from './conversion-api.js';

const TILE_RESOURCE_MANIFEST_VERSION = 1;

/** Durable record for one successfully written, deterministic output resource. */
export interface TileResourceManifestEntry {
  /** Stable resource identifier supplied by the output profile. */
  readonly resourceId: string;
  /** Byte length of the output resource. */
  readonly byteLength: number;
  /** Stable caller-computed content fingerprint, such as a SHA-256 digest. */
  readonly fingerprint: string;
}

/** Versioned progress record used to resume deterministic output packaging. */
export interface TileResourceManifest {
  /** Manifest format version. */
  readonly version: 1;
  /** True only after the destination and report have been finalized successfully. */
  readonly complete: boolean;
  /** Resources durably written before interruption or completion. */
  readonly resources: readonly TileResourceManifestEntry[];
  /** Conversion summary saved after successful destination finalization. */
  readonly report?: TileConversionReport;
}

/** Application-owned persistence for a conversion manifest. */
export interface TileResourceManifestStore {
  /** Loads the previous manifest, or returns null when starting a new conversion. */
  load(): Promise<TileResourceManifest | null>;
  /** Atomically replaces the saved manifest with the supplied snapshot. */
  save(manifest: TileResourceManifest): Promise<void>;
}

/** Options for decorating a resource sink with restart-safe manifest tracking. */
export interface ManifestBackedTileConversionSinkOptions<TResource> {
  /** Output destination with deterministic, idempotent resource writes. */
  readonly sink: TileConversionSink<TResource>;
  /** Persistence adapter for snapshots written after each resource. */
  readonly manifestStore: TileResourceManifestStore;
  /** Stable profile-specific path or resource key. */
  readonly getResourceId: (resource: TResource) => string;
  /** Byte length used to detect changed content under an existing resource ID. */
  readonly measureResourceBytes: (resource: TResource) => number;
  /** Stable fingerprint used to detect changed content under an existing resource ID. */
  readonly fingerprintResource: (resource: TResource) => string;
}

/**
 * Creates a sink that skips matching checkpointed resources when a process restarts.
 *
 * The destination must write resources idempotently by the ID returned from `getResourceId`.
 * The manifest is persisted after every successful write; the store should replace snapshots
 * atomically. Existing IDs must retain their byte length and fingerprint or the resumed job fails
 * rather than silently mixing output from different conversion inputs. Writes are serialized even
 * when callers issue them concurrently. Reports count resources processed by the current run,
 * including writes skipped because the matching resource was already present. A graceful abort
 * clears the manifest checkpoint before asking the destination to clean partial output, so the
 * next run starts cleanly. A process interruption that does not call `abort` can resume from its
 * last saved checkpoint.
 *
 * @param options - Destination, manifest store, stable IDs, byte measurement, and fingerprinting.
 * @returns A `TileConversionSink` with resumable per-resource progress.
 */
export async function createManifestBackedTileConversionSink<TResource>(
  options: ManifestBackedTileConversionSinkOptions<TResource>
): Promise<TileConversionSink<TResource>> {
  const priorManifest = await options.manifestStore.load();
  const resources = new Map<string, TileResourceManifestEntry>();
  if (priorManifest) {
    validateManifest(priorManifest);
    for (const entry of priorManifest.resources) {
      resources.set(entry.resourceId, entry);
    }
  }

  let writeChain: Promise<void> = Promise.resolve();
  let writeFailed = false;
  let writeFailure: unknown;
  let closed = false;

  const persistManifest = async (complete: boolean, report?: TileConversionReport) => {
    await options.manifestStore.save({
      version: TILE_RESOURCE_MANIFEST_VERSION,
      complete,
      resources: [...resources.values()].sort((left, right) =>
        left.resourceId < right.resourceId ? -1 : left.resourceId > right.resourceId ? 1 : 0
      ),
      ...(report ? {report} : {})
    });
  };

  const writeResource = async (resource: TResource, signal?: AbortSignal): Promise<void> => {
    if (closed) {
      throw new TileConversionError('RESOURCE_SINK_CLOSED', 'Cannot write after sink finalization');
    }
    if (writeFailed) {
      throw writeFailure;
    }
    const entry = createManifestEntry(options, resource);
    const priorEntry = resources.get(entry.resourceId);
    if (priorEntry) {
      if (
        priorEntry.byteLength !== entry.byteLength ||
        priorEntry.fingerprint !== entry.fingerprint
      ) {
        throw new TileConversionError(
          'RESOURCE_RESUME_MISMATCH',
          `Resource "${entry.resourceId}" changed since the saved manifest`
        );
      }
      return;
    }

    await options.sink.write(resource, signal);
    resources.set(entry.resourceId, entry);
    await persistManifest(false);
  };

  return {
    write(resource, signal) {
      const operation = writeChain.then(() => writeResource(resource, signal));
      writeChain = operation.catch(error => {
        writeFailed = true;
        writeFailure = error;
      });
      return operation;
    },
    async finalize(report) {
      await writeChain;
      if (writeFailed) {
        throw writeFailure;
      }
      if (closed) {
        throw new TileConversionError('RESOURCE_SINK_CLOSED', 'Sink has already been finalized');
      }
      await options.sink.finalize(report);
      await persistManifest(true, report);
      closed = true;
    },
    async abort(reason) {
      await writeChain;
      if (closed) return;
      closed = true;
      resources.clear();
      await persistManifest(false);
      await options.sink.abort(reason);
    }
  };
}

/** Creates and validates the deterministic manifest entry for an output resource. */
function createManifestEntry<TResource>(
  options: ManifestBackedTileConversionSinkOptions<TResource>,
  resource: TResource
): TileResourceManifestEntry {
  const resourceId = options.getResourceId(resource);
  const byteLength = options.measureResourceBytes(resource);
  const fingerprint = options.fingerprintResource(resource);
  if (
    typeof resourceId !== 'string' ||
    resourceId.length === 0 ||
    typeof fingerprint !== 'string' ||
    fingerprint.length === 0 ||
    !Number.isSafeInteger(byteLength) ||
    byteLength < 0
  ) {
    throw new TileConversionError(
      'INVALID_RESOURCE_MANIFEST_ENTRY',
      'Resource manifest entries require an ID, a fingerprint, and a non-negative safe byte length'
    );
  }
  return {resourceId, byteLength, fingerprint};
}

/** Checks a loaded manifest before trusting it for restart decisions. */
function validateManifest(manifest: TileResourceManifest): void {
  if (
    typeof manifest !== 'object' ||
    manifest === null ||
    manifest.version !== TILE_RESOURCE_MANIFEST_VERSION ||
    typeof manifest.complete !== 'boolean' ||
    !Array.isArray(manifest.resources)
  ) {
    throw new TileConversionError(
      'UNSUPPORTED_RESOURCE_MANIFEST',
      `Unsupported or malformed resource manifest version: ${String(manifest.version)}`
    );
  }
  const resourceIds = new Set<string>();
  for (const entry of manifest.resources) {
    if (
      typeof entry?.resourceId !== 'string' ||
      entry.resourceId.length === 0 ||
      typeof entry?.fingerprint !== 'string' ||
      entry.fingerprint.length === 0 ||
      !Number.isSafeInteger(entry.byteLength) ||
      entry.byteLength < 0 ||
      resourceIds.has(entry.resourceId)
    ) {
      throw new TileConversionError(
        'INVALID_RESOURCE_MANIFEST',
        'Resource manifest contains an invalid or duplicate entry'
      );
    }
    resourceIds.add(entry.resourceId);
  }
}
