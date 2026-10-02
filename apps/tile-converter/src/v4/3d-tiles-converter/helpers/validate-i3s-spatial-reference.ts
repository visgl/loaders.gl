// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

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
  const spatialReference = layer.spatialReference || layer.fullExtent?.spatialReference;
  const identifier = spatialReference?.latestWkid ?? spatialReference?.wkid;
  const declarations = [layer.store?.indexCRS, layer.store?.vertexCRS].filter(
    (declaration): declaration is string => Boolean(declaration)
  );
  const unsupportedDeclaration = declarations.find(
    declaration =>
      !/^(?:EPSG:4326|urn:ogc:def:crs:EPSG::4326|https?:\/\/www\.opengis\.net\/def\/crs\/EPSG\/0\/4326\/?)$/i.test(
        declaration
      )
  );
  if (
    (identifier !== undefined && identifier !== 4326) ||
    (identifier === undefined && spatialReference?.wkt) ||
    unsupportedDeclaration
  ) {
    const description =
      unsupportedDeclaration || (identifier !== undefined ? `EPSG:${identifier}` : 'custom WKT');
    throw new Error(
      `The legacy I3S-to-3D Tiles converter requires WGS-84 (EPSG:4326) input; received ${description}. Reproject the source I3S dataset to EPSG:4326 before conversion.`
    );
  }
}
