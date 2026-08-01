// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';

/** Reference to an external OpenUSD layer and optional prim within that layer. */
export type USDAssetPath = {
  /** URL or relative path to the referenced layer. */
  assetPath: string;
  /** Optional prim path within the referenced layer. */
  primPath?: string;
};

/** Reference to a prim in an OpenUSD scene. */
export type USDScenePath = {
  /** Absolute or relative scene path. */
  path: string;
};

/** Value types represented by the OpenUSD ASCII parser. */
export type USDValue =
  | string
  | number
  | boolean
  | null
  | USDAssetPath
  | USDScenePath
  | USDValue[]
  | {[name: string]: USDValue};

/** Parsed OpenUSD attribute declaration. */
export type USDAttribute = {
  /** Attribute name. */
  name: string;
  /** Authored OpenUSD type name. */
  type: string;
  /** Parsed attribute value. */
  value: USDValue;
  /** Attribute metadata. */
  metadata: Record<string, USDValue>;
};

/** Opinions authored by one variant. */
export type USDVariant = {
  /** Variant attributes. */
  attributes: Record<string, USDAttribute>;
  /** Variant metadata. */
  metadata: Record<string, USDValue>;
  /** Child prims introduced or overridden by the variant. */
  children: USDPrim[];
};

/** Parsed and optionally composed OpenUSD prim. */
export type USDPrim = {
  /** Prim name. */
  name: string;
  /** Absolute prim path. */
  path: string;
  /** URL of the layer that authored the prim. */
  sourceUrl?: string;
  /** Authored prim type, such as `Xform` or `Mesh`. */
  type: string;
  /** Prim specifier. */
  specifier: 'def' | 'over' | 'class';
  /** Authored attributes keyed by name. */
  attributes: Record<string, USDAttribute>;
  /** Prim metadata keyed by name. */
  metadata: Record<string, USDValue>;
  /** Variant sets keyed by set name and variant name. */
  variants: Record<string, Record<string, USDVariant>>;
  /** Child prims. */
  children: USDPrim[];
};

/** Parsed OpenUSD stage. */
export type USDStage = {
  /** Container format used for the root layer. */
  format: 'usda' | 'usdz';
  /** URL of the root layer when available. */
  url?: string;
  /** Root-layer metadata. */
  metadata: Record<string, USDValue>;
  /** Root prims in scene order. */
  rootPrims: USDPrim[];
  /** URLs of all layers used to compose the stage. */
  layers: string[];
};

/** Options for {@link USDLoader}. */
export type USDLoaderOptions = LoaderOptions & {
  /** OpenUSD-specific parser and composition options. */
  usd?: {
    /** Compose references and variants into the returned prim hierarchy. */
    compose?: boolean;
    /** Load referenced layers while composing the stage. */
    loadReferences?: boolean;
    /** Maximum recursive composition depth. */
    maxReferenceDepth?: number;
    /** Variant selections that override authored selections. */
    variantSelections?: Record<string, string>;
  };
};
