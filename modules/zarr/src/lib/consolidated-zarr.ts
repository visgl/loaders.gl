// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type ZarrConsolidatedFormat = 'v2' | 'v3';

export type ZarrConsolidatedMetadata = {
  format: ZarrConsolidatedFormat;
  metadataPath: '.zmetadata' | 'zmetadata' | 'zarr.json';
  metadata: Record<string, unknown>;
  topLevelGroups: string[];
};

type V2ConsolidatedMetadata = {
  metadata?: Record<string, unknown>;
};

type V3ConsolidatedMetadata = {
  consolidated_metadata?: {
    metadata?: Record<string, unknown>;
  };
};

type LoadConsolidatedMetadataOptions = {
  metadataPath?: 'auto' | '.zmetadata' | 'zmetadata' | 'zarr.json';
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

    const json = (await response.json()) as V2ConsolidatedMetadata | V3ConsolidatedMetadata;
    return normalizeConsolidatedMetadata(json, metadataPath);
  }

  throw new Error(
    `Could not load consolidated Zarr metadata for ${url}. Tried ${metadataPaths.join(', ')}. ${errors.join('; ')}`
  );
}

function getMetadataPaths(
  metadataPath: 'auto' | '.zmetadata' | 'zmetadata' | 'zarr.json' = 'auto'
): Array<'.zmetadata' | 'zmetadata' | 'zarr.json'> {
  if (metadataPath === 'auto') {
    return ['zarr.json', '.zmetadata', 'zmetadata'];
  }

  return [metadataPath];
}

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
      topLevelGroups: extractTopLevelGroups(Object.keys(normalizedMetadata))
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
    topLevelGroups: extractTopLevelGroups(Object.keys(normalizedMetadata).map(normalizeV2Path))
  };
}

function normalizeV2Path(path: string): string {
  return path
    .replace(/\/\.(?:zattrs|zarray|zgroup)$/i, '')
    .replace(/^\.(?:zattrs|zarray|zgroup)$/i, '');
}

function extractTopLevelGroups(paths: string[]): string[] {
  const topLevelGroups = new Set<string>();

  for (const path of paths) {
    const normalizedPath = path.replace(/^\/+/, '');
    if (!normalizedPath) {
      continue;
    }

    const [topLevelGroup] = normalizedPath.split('/');
    if (topLevelGroup) {
      topLevelGroups.add(topLevelGroup);
    }
  }

  return [...topLevelGroups].sort();
}
