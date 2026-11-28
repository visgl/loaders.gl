// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {normalizeCRSIdentifier, type CRSIdentifier} from '@math.gl/geospatial/crs';

/** A CRS identifier accepted by OGC and ArcGIS services. */
export type ServiceCRS = CRSIdentifier | number;

/**
 * Order of the first two coordinates on the service wire: `xy` is x (easting or longitude) first,
 * `yx` is y (northing or latitude) first.
 */
export type ServiceCRSAxisOrder = 'xy' | 'yx';

/** Options for {@link getServiceCRSAxisOrder}. */
export type ServiceCRSAxisOrderOptions = {
  /** Axis order to use for every CRS. When set, it overrides the built-in table. */
  axisOrder?: ServiceCRSAxisOrder;
};

/** Length of one degree in meters, from the OGC equatorial convention (WMTS 1.0.0 Annex E). */
const METERS_PER_DEGREE = (2 * Math.PI * 6378137) / 360;

/** Normalized identifiers of the OGC longitude-first geographic CRSs, which use degrees. */
const OGC_DEGREE_CRS = new Set(['CRS:84', 'CRS:83', 'CRS:27', 'OGC:CRS84H']);

/** Normalized identifiers that services use for spherical Web Mercator. */
const WEB_MERCATOR_CRS = new Set([
  'EPSG:3857',
  'EPSG:3785',
  'EPSG:900913',
  'EPSG:102100',
  'EPSG:102113',
  'ESRI:102100',
  'ESRI:102113'
]);

/** EPSG codes of spherical Web Mercator that can occur in a versioned EPSG identifier. */
const WEB_MERCATOR_EPSG_CODES = new Set([3857, 3785]);

/**
 * EPSG geographic 2D CRSs. In the EPSG registry, each one uses coordinate system EPSG:6422
 * (ellipsoidal 2D CS; axes latitude, longitude; orientations north, east; unit degree).
 * The source of each row is the CRS entry at `https://epsg.org/crs_<code>/`.
 */
const LATITUDE_FIRST_EPSG_CODES: ReadonlyMap<number, string> = new Map([
  [4148, 'Hartebeesthoek94'],
  [4167, 'NZGD2000'],
  [4171, 'ETRS89-FRA [RGF93 v1]'],
  [4230, 'ED50'],
  [4258, 'ETRS89'],
  [4267, 'NAD27'],
  [4269, 'NAD83'],
  [4277, 'OSGB36'],
  [4283, 'GDA94'],
  [4314, 'DHDN'],
  [4326, 'WGS 84'],
  [4490, 'China Geodetic Coordinate System 2000'],
  [4612, 'JGD2000'],
  [4617, 'NAD83(CSRS)'],
  [4619, 'ETRS89-SWE [SWEREF 99]'],
  [4674, 'SIRGAS 2000'],
  [6318, 'NAD83(2011)'],
  [6668, 'JGD2024'],
  [7844, 'GDA2020']
]);

/**
 * EPSG projected CRSs whose first axis is northing. The source of each row is the CRS entry at
 * `https://epsg.org/crs_<code>/` and the coordinate system that it names. All of these
 * coordinate systems use the metre, but the unit is not built in: set `metersPerUnit` to use it.
 */
const NORTHING_FIRST_EPSG_CODES: ReadonlyMap<number, string> = new Map([
  // Coordinate system EPSG:4500: northing (N), easting (E).
  [2193, 'NZGD2000 / New Zealand Transverse Mercator 2000'],
  [3006, 'ETRS89-SWE [SWEREF 99 TM]'],
  [3034, 'ETRS89-extended / LCC Europe'],
  // Coordinate system EPSG:4531: northing (x), easting (y).
  [2180, 'ETRS89 / PL-1992'],
  // Coordinate system EPSG:4532: northing (Y), easting (X).
  [3035, 'ETRS89-extended / LAEA Europe'],
  // Coordinate system EPSG:4530: northing (X), easting (Y).
  [31466, 'DHDN / 3-degree Gauss-Kruger zone 2'],
  [31467, 'DHDN / 3-degree Gauss-Kruger zone 3'],
  [31468, 'DHDN / 3-degree Gauss-Kruger zone 4'],
  [31469, 'DHDN / 3-degree Gauss-Kruger zone 5']
]);

/** The WMS 1.3.0 `CRS:` codes, which are the normalized form of the OGC CRS84, CRS83 and CRS27. */
const WMS_CRS_CODES: ReadonlyMap<string, string> = new Map([
  ['OGC:CRS84', 'CRS:84'],
  ['OGC:CRS83', 'CRS:83'],
  ['OGC:CRS27', 'CRS:27']
]);

/** An upper-case `AUTHORITY:CODE` identifier. */
const AUTHORITY_CODE = /^[A-Z][A-Z0-9_-]*:[A-Z0-9_.-]+$/;
/** An EPSG URN without a version field, as in the pre-standard `urn:x-ogc:def:crs:EPSG:4326`. */
const LEGACY_EPSG_URN = /^urn:ogc:def:crs:EPSG:(\d+)$/i;
/**
 * A versioned EPSG URN. The version is numbers and dots, and can contain colons:
 * `urn:ogc:def:crs:EPSG:6.18:3:4326`.
 */
const VERSIONED_EPSG_URN = /^urn:(?:x-)?ogc:def:crs:EPSG:([\d.]+(?::[\d.]+)*):(\d+)$/i;
/** A versioned EPSG URI: `http://www.opengis.net/def/crs/EPSG/9.9/4326`. */
const VERSIONED_EPSG_URI = /^https?:\/\/www\.opengis\.net\/def\/crs\/EPSG\/([\d.]+)\/(\d+)\/?$/i;
/** An unversioned EPSG path on another host: `https://example.com/def/crs/EPSG/0/3857`. */
const EPSG_PATH = /\/EPSG\/(?:0\/)?(\d+)\/?$/i;

/**
 * Normalizes common OGC and ArcGIS CRS spellings to a stable, upper-case identifier.
 *
 * - EPSG codes, unversioned EPSG URNs and URIs, and `urn:x-ogc:` URNs give `EPSG:<code>`.
 * - `CRS:84`, `OGC:CRS84`, and the OGC CRS84 URN and URI forms give `CRS:84`.
 * - Other authorities keep their authority: `urn:ogc:def:crs:IAU::30100` gives `IAU:30100`.
 * - Versioned identifiers, such as `urn:ogc:def:crs:EPSG:6.3:4326`, are not equal to the
 *   unversioned code. They are returned in upper case.
 * - Other strings are returned in upper case.
 */
export function normalizeServiceCRS(crs: ServiceCRS | undefined): string | undefined {
  if (crs === undefined || crs === null) return undefined;
  if (typeof crs === 'number') return `EPSG:${crs}`;
  const value = crs.trim();
  if (!value) return undefined;
  // Read pre-standard `urn:x-ogc:` URNs as `urn:ogc:` URNs.
  const ogcValue = value.replace(/^urn:x-ogc:/i, 'urn:ogc:');
  const legacyMatch = LEGACY_EPSG_URN.exec(ogcValue);
  if (legacyMatch) return `EPSG:${legacyMatch[1]}`;
  const identifier = normalizeCRSIdentifier(ogcValue).toUpperCase();
  const wmsCode = WMS_CRS_CODES.get(identifier);
  if (wmsCode) return wmsCode;
  if (identifier !== ogcValue.toUpperCase() || AUTHORITY_CODE.test(identifier)) return identifier;
  // Keep the earlier rule for unversioned EPSG paths on other hosts.
  const pathMatch = EPSG_PATH.exec(value);
  return pathMatch ? `EPSG:${pathMatch[1]}` : identifier;
}

/**
 * Returns the EPSG code of an EPSG identifier, in an unversioned or a versioned form. A versioned
 * identifier has the same axis order and unit as the code, so the version is ignored here.
 */
function getEPSGCode(crs: ServiceCRS | undefined): number | undefined {
  if (typeof crs === 'string') {
    const versionedMatch =
      VERSIONED_EPSG_URN.exec(crs.trim()) || VERSIONED_EPSG_URI.exec(crs.trim());
    if (versionedMatch) return Number(versionedMatch[2]);
  }
  const epsgMatch = /^EPSG:(\d+)$/.exec(normalizeServiceCRS(crs) || '');
  return epsgMatch ? Number(epsgMatch[1]) : undefined;
}

/** Returns whether two CRS identifiers refer to the same service coordinate system. */
export function areServiceCRSEquivalent(
  firstCRS: ServiceCRS | undefined,
  secondCRS: ServiceCRS | undefined
): boolean {
  const first = normalizeServiceCRS(firstCRS);
  const second = normalizeServiceCRS(secondCRS);
  if (!first || !second) return false;
  if (first === second) return true;
  return WEB_MERCATOR_CRS.has(first) && WEB_MERCATOR_CRS.has(second);
}

/** Selects the first supported CRS compatible with a requested CRS. */
export function selectServiceCRS(
  requestedCRS: ServiceCRS | undefined,
  supportedCRS: readonly ServiceCRS[]
): string | undefined {
  if (!supportedCRS.length) return normalizeServiceCRS(requestedCRS);
  return (
    supportedCRS.find(crs => areServiceCRSEquivalent(requestedCRS, crs)) || supportedCRS[0]
  ).toString();
}

/**
 * Returns the authority axis order that a CRS uses on the service wire.
 *
 * WMS 1.3.0, WMTS, WFS 1.1/2.0 and OGC API `bbox-crs` use the axis order of the CRS authority.
 * Application bounding boxes stay canonical `xy` (x/easting or longitude first); callers use this
 * result only when constructing protocol-specific request coordinates and reading tile-grid
 * origins. Decoded response geometry is not swapped: for example, WFS GML coordinates are
 * returned in the order of the response.
 *
 * The result is `yx` for a small built-in table of EPSG geographic 2D CRSs (latitude first, for
 * example EPSG:4326 and EPSG:4258) and EPSG projected CRSs with northing first (for example
 * EPSG:3035). Versioned EPSG identifiers use the table entry of their code. All CRS84 forms,
 * other EPSG codes, other authorities and the legacy `epsg.xml#<code>` form are `xy`.
 * `options.axisOrder` overrides the table. A later math.gl authority axis-order query will
 * replace the built-in table.
 */
export function getServiceCRSAxisOrder(
  crs: ServiceCRS | undefined,
  options?: ServiceCRSAxisOrderOptions
): ServiceCRSAxisOrder {
  if (options?.axisOrder) return options.axisOrder;
  const code = getEPSGCode(crs);
  if (code === undefined) return 'xy';
  return LATITUDE_FIRST_EPSG_CODES.has(code) || NORTHING_FIRST_EPSG_CODES.has(code) ? 'yx' : 'xy';
}

/**
 * Returns the built-in length of one CRS unit in meters. Degrees (CRS84 forms and the EPSG
 * geographic CRSs of the axis-order table, also in versioned form) use the OGC equatorial
 * convention. Web Mercator uses meters. Other CRSs return undefined.
 */
export function getServiceCRSMetersPerUnit(crs: ServiceCRS | undefined): number | undefined {
  const normalizedCRS = normalizeServiceCRS(crs);
  if (!normalizedCRS) return undefined;
  if (OGC_DEGREE_CRS.has(normalizedCRS)) return METERS_PER_DEGREE;
  if (WEB_MERCATOR_CRS.has(normalizedCRS)) return 1;
  const code = getEPSGCode(crs);
  if (code === undefined) return undefined;
  if (LATITUDE_FIRST_EPSG_CODES.has(code)) return METERS_PER_DEGREE;
  return WEB_MERCATOR_EPSG_CODES.has(code) ? 1 : undefined;
}
