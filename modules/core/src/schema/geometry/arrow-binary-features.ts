// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import type {BinaryFeatureCollection, BinaryProperties} from './binary-features';
import type {BinaryGeometryType} from './binary-geometries';

/** One Arrow-backed binary feature family table. */
export type ArrowBinaryFeatureTable = {
  /** Geometry family stored in this table. */
  type: BinaryGeometryType;
  /** Arrow table wrapper for the family. */
  table: arrow.Table;
  /** Original feature-level properties sidecar from the binary feature collection. */
  properties: BinaryProperties['properties'];
  /** Optional original feature fields sidecar. */
  fields?: BinaryProperties['fields'];
};

/** Arrow-backed wrapper for binary point features. */
export type ArrowBinaryPointFeature = ArrowBinaryFeatureTable & {
  type: 'Point';
};

/** Arrow-backed wrapper for binary line features. */
export type ArrowBinaryLineFeature = ArrowBinaryFeatureTable & {
  type: 'LineString';
};

/** Arrow-backed wrapper for binary polygon features. */
export type ArrowBinaryPolygonFeature = ArrowBinaryFeatureTable & {
  type: 'Polygon';
};

/**
 * Arrow-backed wrapper for a binary feature collection.
 *
 * This mirrors the existing `BinaryFeatureCollection` family split while exposing the
 * renderable arrays through Arrow nested list columns.
 */
export type ArrowBinaryFeatureCollection = {
  /** Discriminator for Arrow-backed binary feature collections. */
  shape: 'arrow-binary-feature-collection';
  /** Optional Arrow-backed point family table. */
  points?: ArrowBinaryPointFeature;
  /** Optional Arrow-backed line family table. */
  lines?: ArrowBinaryLineFeature;
  /** Optional Arrow-backed polygon family table. */
  polygons?: ArrowBinaryPolygonFeature;
};

/** Supported binary feature collection wrapper shapes. */
export type BinaryFeatureCollectionLike = BinaryFeatureCollection | ArrowBinaryFeatureCollection;
