// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext} from '@loaders.gl/loader-utils';
import {parseUSDA} from './parse-usda';
import {parseUSDZArchive} from './parse-usdz';
import type {USDAssetPath, USDLoaderOptions, USDPrim, USDStage, USDValue} from './usd-types';

type USDParseEnvironment = {
  /** Fetch implementation used for external layers. */
  fetch: (url: string) => Promise<Response>;
  /** Pending and resolved external layers keyed by URL. */
  cache: Map<string, Promise<USDStage>>;
  /** Files extracted from the active USDZ archive. */
  archiveFiles: Map<string, ArrayBuffer>;
  /** Layer URLs participating in the composed stage. */
  layers: Set<string>;
  /** Effective loader options. */
  options: USDLoaderOptions;
};

const TEXT_DECODER = new TextDecoder();
const CRATE_SIGNATURE = 'PXR-USDC';
const ZIP_SIGNATURE = 0x04034b50;

/** Parses and optionally composes an OpenUSD stage. */
export async function parseUSD(
  data: ArrayBuffer,
  options: USDLoaderOptions = {},
  context?: LoaderContext
): Promise<USDStage> {
  const url = getSourceLocation(options.core?.baseUrl, context?.url);
  const environment: USDParseEnvironment = {
    fetch: async resourceUrl => {
      const response = await (context?.fetch || fetch)(resourceUrl);
      if (!(response instanceof Response)) {
        throw new Error(`OpenUSD reference "${resourceUrl}" did not return an HTTP response.`);
      }
      if (!response.ok) {
        throw new Error(`Unable to load OpenUSD reference "${resourceUrl}": ${response.status}.`);
      }
      return response;
    },
    cache: new Map(),
    archiveFiles: new Map(),
    layers: new Set(),
    options: {
      ...options,
      usd: {...USD_LOADER_DEFAULT_OPTIONS, ...options.usd}
    }
  };

  let stage: USDStage;
  if (isZIPArchive(data)) {
    const archive = parseUSDZArchive(data);
    const rootFilename = Array.from(archive.keys()).find(filename => /\.usda?$/i.test(filename));
    if (!rootFilename) {
      throw new Error('USDZ archives with binary USDC root layers are not implemented yet.');
    }

    const archiveBase = 'https://usd.archive/';
    for (const [filename, content] of archive) {
      environment.archiveFiles.set(new URL(filename, archiveBase).href, content);
    }
    const rootUrl = new URL(rootFilename, archiveBase).href;
    stage = parseUSDLayer(archive.get(rootFilename)!, rootUrl);
    stage.format = 'usdz';
  } else {
    stage = parseUSDLayer(data, url);
  }

  if (stage.url) {
    environment.layers.add(stage.url);
  }
  if (environment.options.usd?.compose !== false) {
    stage.rootPrims = await composePrims(stage.rootPrims, stage.url, {}, environment, 0);
  }
  stage.layers = Array.from(environment.layers);
  if (url) {
    stage.url = url;
  }
  return stage;
}

/** Selects a source location suitable for resolving referenced layers. */
function getSourceLocation(
  configuredLocation: string | undefined,
  contextLocation: string | undefined
): string | undefined {
  const configuredUrl = getAbsoluteUrl(configuredLocation);
  if (configuredUrl) {
    return configuredUrl;
  }
  const contextUrl = getAbsoluteUrl(contextLocation);
  return contextUrl || configuredLocation || contextLocation;
}

/** Returns an absolute URL when the candidate contains one. */
function getAbsoluteUrl(candidate: string | undefined): string | undefined {
  try {
    return candidate ? new URL(candidate).href : undefined;
  } catch {
    return undefined;
  }
}

/** Resolves an asset path against either a URL or a filesystem path. */
function resolveAssetPath(assetPath: string, sourceLocation: string): string {
  try {
    return new URL(assetPath, sourceLocation).href;
  } catch {
    const slashIndex = Math.max(sourceLocation.lastIndexOf('/'), sourceLocation.lastIndexOf('\\'));
    return slashIndex >= 0 ? `${sourceLocation.slice(0, slashIndex + 1)}${assetPath}` : assetPath;
  }
}

const USD_LOADER_DEFAULT_OPTIONS = {
  compose: true,
  loadReferences: true,
  maxReferenceDepth: 12,
  variantSelections: {}
};

/** Parses one ASCII or binary OpenUSD layer. */
function parseUSDLayer(data: ArrayBuffer, url?: string): USDStage {
  const signature = TEXT_DECODER.decode(data.slice(0, 8));
  if (signature === CRATE_SIGNATURE) {
    throw new Error('Binary USDC crate layers are not implemented yet; use ASCII USDA layers.');
  }
  return parseUSDA(TEXT_DECODER.decode(data), url);
}

/** Recursively applies variants, references, overrides, and class filtering. */
async function composePrims(
  prims: USDPrim[],
  sourceUrl: string | undefined,
  inheritedVariants: Record<string, string>,
  environment: USDParseEnvironment,
  depth: number
): Promise<USDPrim[]> {
  if (depth > (environment.options.usd?.maxReferenceDepth ?? 12)) {
    throw new Error('OpenUSD reference composition exceeded the configured depth limit.');
  }

  const composedPrims: USDPrim[] = [];
  for (const sourcePrim of prims) {
    if (sourcePrim.specifier === 'class') {
      continue;
    }

    const localSelections = getVariantSelections(sourcePrim.metadata['variants']);
    const selections = {
      ...localSelections,
      ...inheritedVariants,
      ...environment.options.usd?.variantSelections
    };
    const primSourceUrl = sourcePrim.sourceUrl || sourceUrl;
    let composedPrim = clonePrim(sourcePrim);

    for (const [variantSetName, variantSet] of Object.entries(composedPrim.variants)) {
      const selection = selections[variantSetName] || Object.keys(variantSet)[0];
      const variant = variantSet[selection];
      if (variant) {
        composedPrim = mergePrim(composedPrim, {
          ...composedPrim,
          attributes: variant.attributes,
          metadata: variant.metadata,
          children: variant.children,
          variants: {}
        });
      }
    }

    const references = getPrimReferences(composedPrim);
    if (environment.options.usd?.loadReferences !== false && references.length > 0) {
      for (const reference of references) {
        if (!primSourceUrl) {
          throw new Error('OpenUSD references require a source URL or options.core.baseUrl.');
        }
        const referencedUrl = resolveAssetPath(reference.assetPath, primSourceUrl);
        const stage = await loadReferencedStage(referencedUrl, environment);
        const referencedPrims = selectReferencedPrims(stage, reference.primPath);
        const resolvedPrims = await composePrims(
          referencedPrims,
          referencedUrl,
          selections,
          environment,
          depth + 1
        );
        for (const referencedPrim of resolvedPrims) {
          composedPrim = mergePrim(rebasePrim(referencedPrim, composedPrim.path), composedPrim);
        }
      }
    }

    composedPrim.children = await composePrims(
      composedPrim.children,
      primSourceUrl,
      selections,
      environment,
      depth
    );
    composedPrims.push(composedPrim);
  }

  return composedPrims;
}

/** Loads and parses one referenced layer, with per-parse caching. */
async function loadReferencedStage(
  url: string,
  environment: USDParseEnvironment
): Promise<USDStage> {
  let pendingStage = environment.cache.get(url);
  if (!pendingStage) {
    pendingStage = (async () => {
      const archiveContent = environment.archiveFiles.get(url);
      let content: ArrayBuffer | Promise<ArrayBuffer> | undefined = archiveContent;
      if (!content) {
        let response: Response;
        try {
          response = await environment.fetch(url);
        } catch (error) {
          throw new Error(`Unable to fetch USD layer "${url}": ${String(error)}`);
        }
        content = response.arrayBuffer();
      }
      const stage = parseUSDLayer(await content, url);
      environment.layers.add(url);
      return stage;
    })();
    environment.cache.set(url, pendingStage);
  }
  return pendingStage;
}

/** Selects the referenced prim or default prim from a stage. */
function selectReferencedPrims(stage: USDStage, primPath?: string): USDPrim[] {
  const targetPath = primPath || stage.metadata['defaultPrim'];
  if (typeof targetPath !== 'string') {
    return stage.rootPrims;
  }

  const normalizedPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const target = findPrim(stage.rootPrims, normalizedPath);
  return target ? [target] : [];
}

/** Finds a prim recursively by absolute path. */
function findPrim(prims: USDPrim[], path: string): USDPrim | undefined {
  for (const prim of prims) {
    if (prim.path === path) {
      return prim;
    }
    const child = findPrim(prim.children, path);
    if (child) {
      return child;
    }
  }
  return undefined;
}

/** Collects reference and payload asset paths from a prim. */
function getPrimReferences(prim: USDPrim): USDAssetPath[] {
  const references: USDAssetPath[] = [];
  for (const value of [
    prim.metadata['references'],
    prim.metadata['payload'],
    prim.metadata['payloads']
  ]) {
    if (Array.isArray(value)) {
      references.push(...value.filter(isAssetPath));
    } else if (isAssetPath(value)) {
      references.push(value);
    }
  }
  return references;
}

/** Converts authored variant metadata into a selection map. */
function getVariantSelections(value: USDValue | undefined): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || isAssetPath(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
}

/** Returns whether a parsed value is an external asset path. */
function isAssetPath(value: USDValue | undefined): value is USDAssetPath {
  return Boolean(
    value && typeof value === 'object' && !Array.isArray(value) && 'assetPath' in value
  );
}

/** Deep-clones a prim hierarchy while preserving scalar values. */
function clonePrim(prim: USDPrim): USDPrim {
  return {
    ...prim,
    attributes: {...prim.attributes},
    metadata: {...prim.metadata},
    variants: {...prim.variants},
    children: prim.children.map(clonePrim)
  };
}

/** Rebases a prim hierarchy at a new composed path. */
function rebasePrim(prim: USDPrim, path: string): USDPrim {
  const rebased = clonePrim(prim);
  rebased.path = path;
  rebased.children = rebased.children.map(child => rebasePrim(child, `${path}/${child.name}`));
  return rebased;
}

/** Merges a stronger local prim opinion over a referenced prim. */
function mergePrim(reference: USDPrim, override: USDPrim): USDPrim {
  const children = reference.children.map(clonePrim);
  for (const overridingChild of override.children) {
    const matchingIndex = children.findIndex(child => child.name === overridingChild.name);
    if (matchingIndex >= 0) {
      children[matchingIndex] = mergePrim(children[matchingIndex], overridingChild);
    } else {
      children.push(clonePrim(overridingChild));
    }
  }

  return {
    ...reference,
    ...override,
    sourceUrl:
      getPrimReferences(override).length > 0
        ? override.sourceUrl
        : reference.sourceUrl || override.sourceUrl,
    type: override.type || reference.type,
    attributes: {...reference.attributes, ...override.attributes},
    metadata: {...reference.metadata, ...override.metadata},
    variants: {...reference.variants, ...override.variants},
    children
  };
}

/** Returns whether a buffer starts with a ZIP local-file signature. */
function isZIPArchive(arrayBuffer: ArrayBuffer): boolean {
  return (
    arrayBuffer.byteLength >= 4 && new DataView(arrayBuffer).getUint32(0, true) === ZIP_SIGNATURE
  );
}
