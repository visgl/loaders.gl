// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Geoid, parsePGM} from '@math.gl/geoid';
import {FullProjectionEngine, parseNTv2Grid} from '@math.gl/projection';
import type {DatumGrid, ProjectionEngine} from '@math.gl/projection';
import type {ReadonlyCRSDefinition} from '@math.gl/crs';

const geoidModels = new Map<string, Geoid>();
const projectionAliases: Record<string, ReadonlyCRSDefinition> = {};
const datumGrids: Record<string, DatumGrid> = {};
let spatialProjectionEngine: ProjectionEngine = new FullProjectionEngine();

/** Returns the projection engine containing application-registered spatial resources. */
export function getSpatialProjectionEngine(): ProjectionEngine {
  return spatialProjectionEngine;
}

/**
 * Registers an application-supplied CRS alias for deterministic coordinate transformations.
 *
 * loaders.gl never downloads registry definitions implicitly.
 *
 * @param name - Identifier used by dataset metadata or application options.
 * @param definition - CRS definition understood by `@math.gl/projection`.
 */
export function registerSpatialCrs(name: string, definition: ReadonlyCRSDefinition): void {
  validateResourceName(name, 'CRS');
  projectionAliases[name] = definition;
  spatialProjectionEngine = new FullProjectionEngine({aliases: projectionAliases, datumGrids});
}

/**
 * Registers an NTv2 datum grid used by a previously or subsequently registered CRS definition.
 *
 * @param name - Grid name referenced by the Proj4 definition.
 * @param data - Complete NTv2 grid bytes.
 */
export function registerSpatialDatumGrid(name: string, data: ArrayBuffer): void {
  validateResourceName(name, 'datum grid');
  datumGrids[name] = parseNTv2Grid(data);
  spatialProjectionEngine = new FullProjectionEngine({aliases: projectionAliases, datumGrids});
}

/**
 * Registers an already parsed geoid model.
 *
 * @param name - Stable application-local model name.
 * @param geoid - Parsed `@math.gl/geoid` model.
 */
export function registerGeoidModel(name: string, geoid: Geoid): void {
  validateResourceName(name, 'geoid model');
  geoidModels.set(name, geoid);
}

/**
 * Parses and registers a GeographicLib PGM geoid model.
 *
 * @param name - Stable application-local model name.
 * @param data - Complete PGM model bytes.
 * @param options - Interpolation options forwarded to `@math.gl/geoid`.
 * @returns The parsed and registered geoid model.
 */
export function registerGeoidModelFromPgm(
  name: string,
  data: Uint8Array,
  options: {cubic?: boolean} = {}
): Geoid {
  const geoid = parsePGM(data, options);
  registerGeoidModel(name, geoid);
  return geoid;
}

/**
 * Returns a registered geoid model without initiating network access.
 *
 * @param name - Application-local model name.
 * @returns Registered model, or `undefined` when the application has not supplied it.
 */
export function getGeoidModel(name: string): Geoid | undefined {
  return geoidModels.get(name);
}

/** Validate a caller-controlled spatial resource name. */
function validateResourceName(name: string, resourceType: string): void {
  if (!name.trim()) {
    throw new Error(`${resourceType} name must not be empty`);
  }
}
