// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DataSource} from '@loaders.gl/loader-utils';
import type {
  GetFeaturesParameters,
  VectorSource,
  VectorSourceData,
  VectorSourceMetadata
} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  Feature,
  GeoArrowEncoding,
  GeoJSONTable,
  Geometry,
  Schema
} from '@loaders.gl/schema';
import {
  convertGeometryToWKB,
  makeWKBGeometryField,
  setWKBGeometrySchemaMetadata,
  convertGeojsonToBinaryFeatureCollection
} from '@loaders.gl/gis';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
import {getGeometryColumnsFromSchema} from '../metadata/geoarrow-metadata';
import {
  convertGeoArrowVectorCellToGeoJSON,
  convertGeoArrowGeometry
} from '../geoarrow-converter/convert-geoarrow-geometry';
import {getGeoArrowRowBounds} from '../geoarrow-bounds';
import {
  ClusterIndex,
  type ClusterAggregation,
  type ClusterIndexOptions,
  type ClusterNode
} from './cluster-index';
import {getRepresentativePoint, type RepresentativePointStrategy} from './get-representative-point';

/** Complete materialized input; remote viewport subsets must be collected before indexing. */
export type ClusterSourceData = GeoJSONTable | ArrowTable;

/** Cluster source construction options; inputs must use longitude/latitude. */
export type ClusterSourceOptions = Omit<ClusterIndexOptions, 'rowIndices' | 'aggregations'> & {
  /** Arrow geometry column; inferred only when exactly one is declared. */
  geometryColumn?: string;
  /** Representative policy; defaults to point geometries only. */
  positionStrategy?: RepresentativePointStrategy;
  /** Overrides extraction; null skips the row. Called once per input row during construction. */
  getClusterPosition?: (
    geometry: Geometry | null,
    rowIndex: number
  ) => readonly [number, number] | null;
  /** Numeric aggregations keyed by output name. Null/nonfinite input values are rejected. */
  aggregations?: Readonly<
    Record<
      string,
      {
        /** Input property or Arrow column name. */
        column: string;
        /** Associative operation over included rows. */
        operation: ClusterAggregation['operation'];
      }
    >
  >;
};

/**
 * VectorSource adapter for a complete point/geometry table and an immutable ClusterIndex.
 *
 * Input positions and output are longitude/latitude. Query bounds are geographic, as in
 * VectorSourceLayer. Original geometries stay in data; returned features are representative
 * markers. Reconstruct the source after changing input, radius, filters or aggregation policy.
 */
export class ClusterSource extends DataSource<ClusterSourceData, {}> implements VectorSource {
  /** Immutable hierarchy exposed for member, expansion and columnar queries. */
  readonly index: ClusterIndex;
  /** Original rows included in the index; excluded geometries retain their original offsets. */
  readonly indexedRowCount: number;
  /** Geometry column used to retrieve original Arrow geometries. */
  private readonly geometryColumn?: string;
  /** Declared Arrow geometry encoding. */
  private readonly geometryEncoding?: GeoArrowEncoding;
  /** Stable output property schema, also used for empty query results. */
  private readonly propertySchema: Schema;

  /** Extracts positions once, then constructs a reusable hierarchy without fetching data. */
  constructor(data: ClusterSourceData, options: ClusterSourceOptions = {}) {
    super(data, {});
    const positions: number[] = [];
    const rowIndices: number[] = [];
    if (data.shape === 'arrow-table') {
      const columns = getGeometryColumnsFromSchema(data.data.schema);
      const columnNames = Object.keys(columns);
      this.geometryColumn =
        options.geometryColumn ?? (columnNames.length === 1 ? columnNames[0] : undefined);
      this.geometryEncoding = this.geometryColumn
        ? columns[this.geometryColumn]?.encoding
        : undefined;
      if (
        !this.geometryColumn ||
        !this.geometryEncoding ||
        !data.data.getChild(this.geometryColumn)
      ) {
        throw new Error('ClusterSource requires an explicitly identified GeoArrow geometry column');
      }
    }
    const geometryVector =
      data.shape === 'arrow-table' ? data.data.getChild(this.geometryColumn!)! : null;
    // Native point bounds read Arrow buffers directly, including chunks, slices and nulls.
    const pointBounds =
      geometryVector && this.geometryEncoding === 'geoarrow.point' && !options.getClusterPosition
        ? getGeoArrowRowBounds(geometryVector, this.geometryEncoding)
        : null;
    const rowCount = data.shape === 'arrow-table' ? data.data.numRows : data.features.length;
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      let position: readonly [number, number] | null;
      if (pointBounds) {
        const bounds = pointBounds[rowIndex];
        position = bounds ? [bounds[0], bounds[1]] : null;
      } else {
        const geometry = this.getGeometry(rowIndex);
        position = options.getClusterPosition
          ? options.getClusterPosition(geometry, rowIndex)
          : getRepresentativePoint(geometry, options.positionStrategy);
      }
      if (position) {
        positions.push(position[0], position[1]);
        rowIndices.push(rowIndex);
      }
    }
    const aggregations: Record<string, ClusterAggregation> = Object.create(null);
    for (const [name, aggregation] of Object.entries(options.aggregations || {})) {
      if (['cluster', 'clusterId', 'pointCount', 'rowIndex', 'geometry'].includes(name)) {
        throw new Error(`Reserved cluster property: ${name}`);
      }
      const column = data.shape === 'arrow-table' ? data.data.getChild(aggregation.column) : null;
      const values = rowIndices.map(rowIndex => {
        const value =
          data.shape === 'arrow-table'
            ? column?.get(rowIndex)
            : data.features[rowIndex].properties?.[aggregation.column];
        if (typeof value !== 'number' || !Number.isFinite(value))
          throw new Error(`Cluster aggregation ${name} requires finite numeric values`);
        return value;
      });
      aggregations[name] = {values, operation: aggregation.operation};
    }
    this.index = new ClusterIndex(positions, {...options, rowIndices, aggregations});
    this.indexedRowCount = rowIndices.length;
    this.propertySchema = {
      metadata: {},
      fields: [
        {name: 'cluster', type: 'bool', nullable: false},
        {name: 'clusterId', type: 'float64', nullable: false},
        {name: 'pointCount', type: 'float64', nullable: false},
        {name: 'rowIndex', type: 'float64', nullable: true},
        ...Object.keys(aggregations).map(name => ({
          name,
          type: 'float64' as const,
          nullable: false
        })),
        makeWKBGeometryField('geometry', false)
      ]
    };
    setWKBGeometrySchemaMetadata(this.propertySchema, {
      geometryColumnName: 'geometry',
      primaryColumnName: 'geometry',
      geometryTypes: ['Point']
    });
  }

  /** Describes the default WKB Arrow output, including cluster and aggregate properties. */
  async getSchema(): Promise<Schema> {
    return structuredClone(this.propertySchema);
  }

  /** Exposes one geographic vector layer named clusters. */
  async getMetadata(): Promise<VectorSourceMetadata> {
    return {
      name: 'clusters',
      title: 'Clustered features',
      keywords: ['clustering'],
      layers: [{name: 'clusters', crs: ['EPSG:4326']}]
    };
  }

  /** Queries markers at an explicit map zoom; supports GeoJSON, binary and GeoArrow output. */
  async getFeatures(parameters: GetFeaturesParameters): Promise<VectorSourceData> {
    parameters.signal?.throwIfAborted();
    const layers = typeof parameters.layers === 'string' ? [parameters.layers] : parameters.layers;
    if (layers.some(layer => layer !== 'clusters'))
      throw new Error('ClusterSource only exposes the clusters layer');
    if (parameters.zoom === undefined)
      throw new Error('ClusterSource requires a zoom in each feature request');
    if (parameters.crs && !['EPSG:4326', 'OGC:CRS84', 'CRS:84'].includes(parameters.crs)) {
      throw new Error(
        'ClusterSource returns longitude/latitude; reproject input before construction'
      );
    }
    const [[west, south], [east, north]] = parameters.boundingBox;
    if (
      parameters.requestCrs &&
      !['EPSG:4326', 'OGC:CRS84', 'CRS:84'].includes(parameters.requestCrs)
    ) {
      throw new Error('ClusterSource requires longitude/latitude request bounds');
    }
    const nodes = this.index.getClusters([west, south, east, north], parameters.zoom);
    const features = nodes.map(createClusterFeature);
    if (parameters.format === 'geojson')
      return {shape: 'geojson-table', type: 'FeatureCollection', features};
    if (parameters.format === 'binary') return convertGeojsonToBinaryFeatureCollection(features);
    const builder = new ArrowTableBuilder(this.propertySchema);
    for (const feature of features)
      builder.addObjectRow({
        ...feature.properties,
        geometry: new Uint8Array(convertGeometryToWKB(feature.geometry!))
      });
    const table = builder.finishTable();
    const preference = parameters.geoarrow?.encodingPreference;
    if (preference && preference !== 'geoarrow.wkb') {
      return {
        shape: 'arrow-table',
        data: convertGeoArrowGeometry(
          table.data,
          preference === 'optimized' ? 'geoarrow.point' : 'geoarrow.geometry'
        )
      };
    }
    return table;
  }

  /** Retrieves a member's original geometry and properties; Arrow rows are materialized on demand. */
  getFeature(rowIndex: number): Feature<Geometry | null> {
    const rowCount =
      this.data.shape === 'arrow-table' ? this.data.data.numRows : this.data.features.length;
    if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= rowCount)
      throw new Error('Invalid cluster source row');
    if (this.data.shape === 'geojson-table') return this.data.features[rowIndex];
    const properties = {...this.data.data.get(rowIndex)!.toJSON()};
    delete properties[this.geometryColumn!];
    return {type: 'Feature', geometry: this.getGeometry(rowIndex), properties};
  }

  /** Decodes one geometry only when extraction or member retrieval needs it. */
  private getGeometry(rowIndex: number): Geometry | null {
    return this.data.shape === 'geojson-table'
      ? this.data.features[rowIndex].geometry
      : convertGeoArrowVectorCellToGeoJSON(
          this.data.data.getChild(this.geometryColumn!)!,
          rowIndex,
          this.geometryEncoding!
        );
  }
}

/** Converts an index node into a marker without copying original feature properties. */
function createClusterFeature(node: ClusterNode): Feature {
  return {
    type: 'Feature',
    id: node.id,
    geometry: {type: 'Point', coordinates: node.position},
    properties: {
      ...node.properties,
      cluster: node.isCluster,
      clusterId: node.id,
      pointCount: node.pointCount,
      rowIndex: node.rowIndex
    }
  };
}
