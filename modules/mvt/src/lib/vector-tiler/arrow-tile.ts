// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable} from '@loaders.gl/schema';
import {makeWKBGeometryDataFromWriters, type WKBBuilder} from '@loaders.gl/gis';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import type {ProtoTile} from './proto-tile';
import type {ProtoFeature} from './features/proto-feature';
import {classifyRings} from '../utils/geometry-utils';

/** Gathers source attribute columns and writes clipped geometry directly into Arrow WKB buffers. */
export function createArrowTile(
  table: arrow.Table,
  schema: arrow.Schema,
  geometryColumn: string,
  tile: ProtoTile,
  extent: number,
  localCoordinates: boolean
): ArrowTable {
  const rowIndices = tile.protoFeatures.map(feature => Number(feature.tags!.sourceRowIndex));
  const geometryData = makeWKBGeometryDataFromWriters(
    tile.protoFeatures.map(feature => builder => writeTileGeometry(builder, feature)),
    {
      transform: coordinate => {
        if (localCoordinates) return [coordinate[0] / extent, coordinate[1] / extent];
        const size = extent * 2 ** tile.z;
        const latitude = 180 - ((coordinate[1] + extent * tile.y) * 360) / size;
        return [
          ((coordinate[0] + extent * tile.x) * 360) / size - 180,
          (360 / Math.PI) * Math.atan(Math.exp((latitude * Math.PI) / 180)) - 90
        ];
      }
    }
  );
  const columns: Record<string, arrow.Vector> = Object.create(null);
  for (const field of schema.fields) {
    const column = table.getChild(field.name)!;
    columns[field.name] =
      field.name === geometryColumn
        ? arrow.makeVector(geometryData)
        : gatherColumnRows(column, rowIndices);
  }
  const data = new arrow.Table(schema, columns);
  return {shape: 'arrow-table', schema: convertArrowToSchema(data.schema), data};
}

/** Gathers contiguous row runs as Arrow views, preserving nested values and dictionary buffers. */
function gatherColumnRows(column: arrow.Vector, rowIndices: number[]): arrow.Vector {
  const chunks: arrow.Data[] = [];
  for (let index = 0; index < rowIndices.length; ) {
    const start = rowIndices[index];
    let end = start + 1;
    index++;
    while (index < rowIndices.length && rowIndices[index] === end) {
      end++;
      index++;
    }
    chunks.push(...column.slice(start, end).data);
  }
  return new arrow.Vector(chunks);
}

/** Writes a transformed proto-feature without mutating the cached tile coordinates. */
function writeTileGeometry(builder: WKBBuilder, feature: ProtoFeature): void {
  if (feature.simplifiedType === 1) {
    const points = feature.geometry as number[][];
    if (points.length !== 1) builder.beginMultiPoint(points.length);
    for (const point of points) {
      builder.beginPoint();
      builder.writeCoordinate(point[0], point[1]);
    }
  } else if (feature.simplifiedType === 2) {
    const lines = feature.geometry as number[][][];
    if (lines.length !== 1) builder.beginMultiLineString(lines.length);
    for (const line of lines) {
      builder.beginLineString(line.length);
      for (const point of line) builder.writeCoordinate(point[0], point[1]);
    }
  } else {
    const polygons = classifyRings(feature.geometry as number[][][]);
    if (polygons.length !== 1) builder.beginMultiPolygon(polygons.length);
    for (const polygon of polygons) {
      builder.beginPolygon(polygon.length);
      for (const ring of polygon) {
        builder.beginLinearRing(ring.length);
        for (const point of ring) builder.writeCoordinate(point[0], point[1]);
      }
    }
  }
}
