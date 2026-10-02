// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {parseWKTCRS, type WKTCRSNode} from '@math.gl/crs';
import {getSpatialCoordinateFrame} from '@loaders.gl/tiles';

/** Horizontal CRS declarations consumed by the legacy I3S converter. */
export type I3SConversionSpatialReference = {
  /** Layer-level horizontal coordinate reference system. */
  spatialReference?: {
    /** Original spatial reference identifier. */
    wkid?: number;
    /** Current spatial reference identifier. */
    latestWkid?: number;
    /** Custom spatial reference definition. */
    wkt?: string;
  };
  /** Fallback CRS declaration on the layer extent. */
  fullExtent?: {
    /** Coordinate system shared by the extent and layer. */
    spatialReference?: I3SConversionSpatialReference['spatialReference'];
  };
  /** Coordinate systems declared for node bounds and geometry. */
  store?: {
    /** Coordinate system used by node bounds. */
    indexCRS?: string;
    /** Coordinate system used by geometry positions. */
    vertexCRS?: string;
  };
};

/**
 * Reject explicit horizontal CRS declarations that the legacy converter cannot transform.
 * Undeclared CRS metadata retains the historical WGS-84 assumption.
 * @param layer - Source layer metadata, before interpreting any coordinates as longitude/latitude.
 */
export function validateI3SConversionSpatialReference(layer: I3SConversionSpatialReference): void {
  const spatialReferences = [layer.spatialReference, layer.fullExtent?.spatialReference];
  const unsupportedSpatialReference = spatialReferences.find(spatialReference => {
    if (!spatialReference) {
      return false;
    }
    const identifier = spatialReference.latestWkid ?? spatialReference.wkid;
    return (
      (identifier !== undefined && identifier !== 4326 && identifier !== 4979) ||
      (spatialReference.wkt !== undefined && !isWgs84GeographicWkt(spatialReference.wkt))
    );
  });
  const declarations = [layer.store?.indexCRS, layer.store?.vertexCRS].filter(
    (declaration): declaration is string => Boolean(declaration)
  );
  const unsupportedDeclaration = declarations.find(
    declaration =>
      !/^(?:EPSG:(?:4326|4979)|urn:ogc:def:crs:EPSG::(?:4326|4979)|https?:\/\/www\.opengis\.net\/def\/crs\/EPSG\/0\/(?:4326|4979)\/?)$/i.test(
        declaration
      )
  );
  if (unsupportedSpatialReference || unsupportedDeclaration) {
    const identifier = unsupportedSpatialReference?.latestWkid ?? unsupportedSpatialReference?.wkid;
    const description =
      unsupportedDeclaration || (identifier !== undefined ? `EPSG:${identifier}` : 'custom WKT');
    throw new Error(
      `The legacy I3S-to-3D Tiles converter requires WGS-84 (EPSG:4326) input; received ${description}. Reproject the source I3S dataset to EPSG:4326 before conversion.`
    );
  }
}

/** Recognize geographic WGS-84 WKT with degree units and the Greenwich prime meridian. */
function isWgs84GeographicWkt(wellKnownText: string): boolean {
  try {
    if (getSpatialCoordinateFrame(wellKnownText) !== 'geographic') {
      return false;
    }
    const {root} = parseWKTCRS(wellKnownText);
    const nodes = collectWktNodes(root);
    const datum = root.values.find(
      value =>
        value.type === 'node' &&
        ['DATUM', 'ENSEMBLE', 'GEODETICDATUM'].includes(value.keyword.toUpperCase())
    );
    if (datum?.type !== 'node' || datum.values[0]?.type !== 'string') {
      return false;
    }
    const datumName = datum.values[0].value.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (
      ![
        'wgs84',
        'wgs1984',
        'dwgs1984',
        'worldgeodeticsystem1984',
        'worldgeodeticsystem1984ensemble'
      ].includes(datumName)
    ) {
      return false;
    }
    const angularUnits = nodes.filter(
      node =>
        ['UNIT', 'ANGLEUNIT'].includes(node.keyword.toUpperCase()) &&
        (node === root || root.values.includes(node) || node.keyword.toUpperCase() === 'ANGLEUNIT')
    );
    const primeMeridian = nodes.find(node => node.keyword.toUpperCase() === 'PRIMEM');
    return (
      angularUnits.length > 0 &&
      angularUnits.every(
        node =>
          node.values[1]?.type === 'number' &&
          Math.abs(node.values[1].value - Math.PI / 180) < 1e-12
      ) &&
      (!primeMeridian ||
        (primeMeridian.values[1]?.type === 'number' && primeMeridian.values[1].value === 0))
    );
  } catch {
    return false;
  }
}

/** Collect WKT nodes for semantic checks without inspecting quoted text as syntax. */
function collectWktNodes(node: WKTCRSNode): WKTCRSNode[] {
  return [
    node,
    ...node.values.flatMap(value => (value.type === 'node' ? collectWktNodes(value) : []))
  ];
}
