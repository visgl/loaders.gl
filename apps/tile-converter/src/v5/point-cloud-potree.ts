// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {PointCloudTiler, type PointCloudTilerOptions} from '@loaders.gl/schema-utils';
import {encodePotreeDataset} from '@loaders.gl/potree';
import type {PotreeDataset, PotreeWriterNode, PotreeWriterOptions} from '@loaders.gl/potree';
import {encodePotreeDatasetArchive} from './point-cloud-file.js';

/** Bounded authoring of one decoded dataset in its already placed native coordinates. */
export interface ConvertPointCloudToPotreeOptions {
  /** Explicit CRS declaration written verbatim; coordinates are not reprojected. */
  readonly projection: string;
  /** Maximum bytes retained across all gathered node attribute buffers. */
  readonly maxGatheredBytes: number;
  /** Maximum complete encoded dataset bytes, including metadata and hierarchy. */
  readonly maxOutputBytes: number;
  /** Input, index, per-node and node-count limits of the shared dynamic tiler. */
  readonly tiling?: Omit<PointCloudTilerOptions, 'signal'>;
  /** Existing version, precision, spacing and hierarchy controls. */
  readonly potree?: Omit<
    NonNullable<PotreeWriterOptions['potree']>,
    'projection' | 'signal' | 'maxOutputBytes'
  >;
  /** Also package the completed files as a loaders.gl STORE ZIP32 bundle. */
  readonly archive?: {readonly maxArchiveBytes: number};
  /** Cooperative cancellation during indexing, gathering, writing and packaging. */
  readonly signal?: AbortSignal;
}

/** Complete Potree files; no partial dataset is returned after a failure. */
export interface ConvertedPointCloudPotree {
  /** Exact input row count, emitted once across the additive octree. */
  readonly pointCount: number;
  /** Number of connected octree nodes, including an empty root for empty input. */
  readonly nodeCount: number;
  /** Metadata and encoded resources; applications own storage. */
  readonly dataset: PotreeDataset;
  /** Optional downloadable bundle; applications own object URL and saving lifetimes. */
  readonly archive?: Blob;
}

/**
 * Connects the portable point tiler to the existing Potree 1.x/2.0 dataset writer.
 * Retains additive octree addresses and every source row exactly once, including terminal
 * overflow. Input must be immutable, unindexed decoded points already placed in the declared
 * CRS. No origins, transforms, reprojection, attribute mappings or surface sampling are inferred.
 * The writer rejects attributes or precision that the selected version cannot represent.
 * Gathered nodes are bounded separately from source buffers, indexes, encoded output and ZIP
 * temporaries. This is in-memory authoring, not streaming ingestion or a peak-heap guarantee.
 * The shared tiler's sample coverage bound is not a qualified viewer LOD/error contract.
 * @param input - One decoded point Mesh or MeshArrowTable, including loader output.
 * @param options - Explicit native CRS, resource budgets and existing writer controls.
 * @returns A complete dataset and optional bundle after releasing the owned tiler.
 */
export async function convertPointCloudToPotree(
  input: Mesh | MeshArrowTable,
  options: ConvertPointCloudToPotreeOptions
): Promise<ConvertedPointCloudPotree> {
  if (typeof options.projection !== 'string' || !options.projection.trim()) {
    throw new Error('Potree authoring requires an explicit native CRS declaration');
  }
  for (const limit of [
    options.maxGatheredBytes,
    options.maxOutputBytes,
    options.archive?.maxArchiveBytes
  ]) {
    if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1)) {
      throw new RangeError('Potree authoring byte limits must be positive safe integers');
    }
  }
  // Required budgets must remain required for JavaScript callers too.
  if (options.maxGatheredBytes === undefined || options.maxOutputBytes === undefined) {
    throw new RangeError('Potree authoring requires gathered and encoded byte limits');
  }
  options.signal?.throwIfAborted();
  const tiler = new PointCloudTiler(input, {
    ...options.tiling,
    maxNodes: Math.min(options.tiling?.maxNodes ?? 100000, options.potree?.maxNodes ?? 100000),
    maxTileBytes: Math.min(
      options.tiling?.maxTileBytes ?? 64 * 1024 * 1024,
      options.maxGatheredBytes
    ),
    signal: options.signal
  });
  const nodes: PotreeWriterNode[] = [];
  let gatheredBytes = 0;
  let pointByteLength = 0;
  let pointCount: number;
  try {
    const pending = [await tiler.getRootNode()];
    pointCount = tiler.pointCount;
    while (pending.length) {
      options.signal?.throwIfAborted();
      const node = pending.pop()!;
      // Root gathering is bounded by maxTileBytes; its packed layout sizes later allocations.
      if (node.pointCount * pointByteLength > options.maxGatheredBytes - gatheredBytes) {
        throw new RangeError('Potree gathered node byte budget exceeded');
      }
      const mesh = await tiler.getTileMesh(node.id);
      const nodeBytes = Object.values(mesh.attributes).reduce(
        (bytes, attribute) => bytes + attribute.value.byteLength,
        0
      );
      if (nodeBytes > options.maxGatheredBytes - gatheredBytes) {
        throw new RangeError('Potree gathered node byte budget exceeded');
      }
      if (node.pointCount) pointByteLength = nodeBytes / node.pointCount;
      gatheredBytes += nodeBytes;
      nodes.push({id: node.id, mesh});
      const children = await tiler.getChildNodes(node.id);
      for (let index = children.length - 1; index >= 0; index--) pending.push(children[index]);
    }
  } finally {
    tiler.close();
  }
  const dataset = await encodePotreeDataset(nodes, {
    potree: {
      ...options.potree,
      projection: options.projection,
      maxOutputBytes: options.maxOutputBytes,
      signal: options.signal
    }
  });
  const archive = options.archive
    ? await encodePotreeDatasetArchive(dataset, options.archive.maxArchiveBytes, options.signal)
    : undefined;
  options.signal?.throwIfAborted();
  return {pointCount, nodeCount: nodes.length, dataset, archive};
}
