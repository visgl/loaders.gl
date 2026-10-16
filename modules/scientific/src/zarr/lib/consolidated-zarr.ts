// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Consolidated metadata files supported by Zarr v2 and v3 stores. */
export type ZarrMetadataPath = 'auto' | '.zmetadata' | 'zmetadata' | 'zarr.json';

/** Zarr format generation represented by normalized consolidated metadata. */
export type ZarrConsolidatedFormat = 'v2' | 'v3';

/** Normalized consolidated metadata and the top-level nodes it describes. */
export type ZarrConsolidatedMetadata = {
  /** Zarr format generation used by the consolidated metadata document. */
  format: ZarrConsolidatedFormat;
  /** Metadata file that was loaded. */
  metadataPath: '.zmetadata' | 'zmetadata' | 'zarr.json';
  /** Format-specific consolidated metadata entries keyed by Zarr path. */
  metadata: Record<string, unknown>;
  /** Attributes declared on the root group. */
  rootAttributes: Record<string, unknown>;
  /** Top-level group paths. */
  topLevelGroups: string[];
  /** Top-level array paths. */
  topLevelArrays: string[];
};

type V2ConsolidatedMetadata = {
  metadata?: Record<string, unknown>;
};

type V3ConsolidatedMetadata = {
  attributes?: Record<string, unknown>;
  consolidated_metadata?: {
    metadata?: Record<string, unknown>;
  };
};

/** Options for loading consolidated Zarr metadata. */
export type LoadConsolidatedMetadataOptions = {
  /** Metadata file to load, or `auto` to probe v3 and v2 names in order. */
  metadataPath?: ZarrMetadataPath;
  /** Abort signal forwarded to metadata requests. */
  signal?: AbortSignal;
};

/**
 * Loads and normalizes consolidated Zarr metadata across v2 and v3 layouts.
 */
export async function loadConsolidatedMetadata(
  url: string,
  fetcher: (url: string, options?: RequestInit) => Promise<Response>,
  options: LoadConsolidatedMetadataOptions = {}
): Promise<ZarrConsolidatedMetadata> {
  const metadataPaths = getMetadataPaths(options.metadataPath);
  const normalizedUrl = url.replace(/\/+$/, '');
  const errors: string[] = [];

  for (const metadataPath of metadataPaths) {
    const metadataUrl = `${normalizedUrl}/${metadataPath}`;
    const response = await fetcher(metadataUrl, {signal: options.signal});

    if (response.status === 404) {
      errors.push(`${metadataPath}: 404`);
      continue;
    }

    if (!response.ok) {
      errors.push(`${metadataPath}: ${response.status} ${response.statusText}`);
      continue;
    }

    try {
      const json = (await response.json()) as V2ConsolidatedMetadata | V3ConsolidatedMetadata;
      return normalizeConsolidatedMetadata(json, metadataPath);
    } catch (error) {
      if (options.signal?.aborted || options.metadataPath !== undefined && options.metadataPath !== 'auto') {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${metadataPath}: ${message}`);
    }
  }

  throw new Error(
    `Could not load consolidated Zarr metadata for ${url}. Tried ${metadataPaths.join(', ')}. ${errors.join('; ')}`
  );
}

/** Returns metadata filenames in the order they should be probed. */
function getMetadataPaths(
  metadataPath: ZarrMetadataPath = 'auto'
): Array<'.zmetadata' | 'zmetadata' | 'zarr.json'> {
  if (metadataPath === 'auto') {
    return ['zarr.json', '.zmetadata', 'zmetadata'];
  }

  return [metadataPath];
}

/** Normalizes one v2 or v3 consolidated metadata document. */
function normalizeConsolidatedMetadata(
  metadata: V2ConsolidatedMetadata | V3ConsolidatedMetadata,
  metadataPath: '.zmetadata' | 'zmetadata' | 'zarr.json'
): ZarrConsolidatedMetadata {
  if (metadataPath === 'zarr.json') {
    const normalizedMetadata = (metadata as V3ConsolidatedMetadata).consolidated_metadata?.metadata;
    if (!normalizedMetadata || typeof normalizedMetadata !== 'object') {
      throw new Error('Invalid zarr.json: missing consolidated_metadata.metadata object.');
    }

    return {
      format: 'v3',
      metadataPath,
      metadata: normalizedMetadata,
      rootAttributes: {...((metadata as V3ConsolidatedMetadata).attributes || {})},
      topLevelGroups: extractV3TopLevelNodes(normalizedMetadata, 'group'),
      topLevelArrays: extractV3TopLevelNodes(normalizedMetadata, 'array')
    };
  }

  const normalizedMetadata = (metadata as V2ConsolidatedMetadata).metadata;
  if (!normalizedMetadata || typeof normalizedMetadata !== 'object') {
    throw new Error(`Invalid ${metadataPath}: missing metadata object.`);
  }

  return {
    format: 'v2',
    metadataPath,
    metadata: normalizedMetadata,
    rootAttributes: getV2RootAttributes(normalizedMetadata),
    topLevelGroups: extractV2TopLevelNodes(Object.keys(normalizedMetadata), 'zgroup'),
    topLevelArrays: extractV2TopLevelNodes(Object.keys(normalizedMetadata), 'zarray')
  };
}

/** Extracts root attributes from a consolidated Zarr v2 metadata map. */
function getV2RootAttributes(metadata: Record<string, unknown>): Record<string, unknown> {
  const attributes = metadata['.zattrs'];
  return attributes && typeof attributes === 'object'
    ? {...(attributes as Record<string, unknown>)}
    : {};
}

/** Extracts top-level v2 nodes represented by `.zgroup` or `.zarray` keys. */
function extractV2TopLevelNodes(paths: string[], nodeType: 'zgroup' | 'zarray'): string[] {
  const suffix = `.${nodeType}`;
  const nodePaths = paths
    .filter(path => path === suffix || path.endsWith(`/${suffix}`))
    .map(path => path.slice(0, -suffix.length).replace(/\/+$/, ''));
  return extractDirectChildren(nodePaths);
}

/** Extracts top-level v3 nodes with the requested `node_type`. */
function extractV3TopLevelNodes(
  metadata: Record<string, unknown>,
  nodeType: 'group' | 'array'
): string[] {
  const nodePaths = Object.entries(metadata)
    .filter(([, value]) =>
      Boolean(value && typeof value === 'object' && (value as {node_type?: unknown}).node_type === nodeType)
    )
    .map(([path]) => path);
  return extractDirectChildren(nodePaths);
}

/** Returns normalized paths that are direct children of the store root. */
function extractDirectChildren(paths: string[]): string[] {
  const directChildren = new Set<string>();

  for (const path of paths) {
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    if (!normalizedPath || normalizedPath.includes('/')) {
      continue;
    }
    directChildren.add(normalizedPath);
  }

  return [...directChildren].sort();
}
