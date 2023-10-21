// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, Field, DataType} from '@loaders.gl/schema';
import type {
  Source,
  LoaderOptions,
  GetTileParameters,
  GetTileDataParameters
} from '@loaders.gl/loader-utils';
import type {TileSource} from '@loaders.gl/loader-utils';
// import {getArrayTypeFromDataType} from '@loaders.gl/schema';
import {DataSource, DataSourceProps, resolvePath} from '@loaders.gl/loader-utils';

import {Copc, Hierarchy, Dimension, Getter} from 'copc';

type COPCMetadata = Record<string, unknown>;

type GetNodeParameters = {
  nodeIndex: {
    x: number;
    y: number;
    z: number;
    d: number;
  };
  columns?: string[];
  offset?: number;
  limit?: number;
};

const VERSION = '1.0.0';

/**
 * Creates vector tile data sources for COPC urls or blobs
 */
export const COPCSource = {
  name: 'COPC',
  id: 'copc',
  module: 'copc',
  version: VERSION,
  extensions: ['laz'],
  mimeTypes: ['application/octet-stream'],
  options: {url: undefined!, copc: {}},
  type: 'copc',
  fromUrl: true,
  fromBlob: true,

  testURL: (url: string) => url.endsWith('.pmtiles'),
  createDataSource: (url: string | Blob, props: COPCTileSourceProps) =>
    new COPCTileSource(url, props)
} as const satisfies Source<COPCTileSource, COPCTileSourceProps>;

export type COPCTileSourceProps = DataSourceProps & {
  attributions?: string[];
  copc?: {
    loadOptions?: LoaderOptions; // COPCLoaderOptions;
    // TODO - add options here
  };
};

/**
 * A COPC data source
 * @note Can be either a raster or vector tile source depending on the contents of the COPC file.
 */
export class COPCTileSource extends DataSource implements TileSource {
  data: string | Blob;
  props: COPCTileSourceProps;
  mimeType: string | null = null;
  metadata: Promise<COPCMetadata>;

  protected _initPromise: Promise<{
    copc: Copc;
    hierarchy: Hierarchy.Subtree;
    rootNode: Hierarchy.Node;
  }>;
  protected _urlOrGetter: string | Getter;

  constructor(data: string | Blob, props: COPCTileSourceProps) {
    super(props);
    this.props = props;
    const url = typeof data === 'string' ? resolvePath(data) : '';
    this.data = data;
    this._urlOrGetter = url;
    this._initPromise = this._initCopc(url);
    this.metadata = this.getMetadata();
  }

  async getSchema(): Promise<Schema> {
    const {copc, rootNode} = await this._initPromise;
    const view = await Copc.loadPointDataView(this._urlOrGetter, copc, rootNode);

    const fields: Field[] = [];
    for (const [name, dimension] of Object.entries(view.dimensions)) {
      if (dimension) {
        const type = getDataTypeFromDimension(dimension);
        fields.push({name, type, nullable: false});
      }
    }

    return {fields, metadata: {}};
  }

  async getMetadata(): Promise<COPCMetadata> {
    const {copc} = await this._initPromise;
    const metadata: COPCMetadata = {
      formatSpecificMetadata: copc
    };
    return metadata;
  }

  async getTile(tileParams: GetTileParameters): Promise<number[] | null> {
    const nodeIndex = {x: tileParams.x, y: tileParams.y, z: tileParams.z, d: 0};
    return this.getPoints({nodeIndex});
  }

  async getTileData(parameters: GetTileDataParameters): Promise<unknown | null> {
    throw new Error('Not implemented');
  }

  async getPoints(parameters: GetNodeParameters) {
    const {copc} = await this._initPromise;
    const node = await this.getNode(parameters);
    const view = node && (await Copc.loadPointDataView(this._urlOrGetter, copc, node));
    if (!view) {
      return null;
    }

    // console.log('Dimensions:', view.dimensions);

    const schema = await this.getSchema();
    const columnNames = schema.fields.map((field) => field.name);
    const columnGetters = columnNames.map((name) => view.getter(name));

    // const offset = parameters.offset || 0;
    // const limit = Math.min(parameters.limit ?? view.pointCount, view.pointCount - offset);
    // const ArrayType = getArrayTypeFromDataType(limit);

    function getXyzi(index: number): number[] {
      return columnGetters.map((get) => get(index));
    }
    const point = getXyzi(0);
    // console.log('Point:', point);
    return point;
  }

  async getNode(parameters: GetNodeParameters): Promise<Hierarchy.Node | undefined> {
    const {hierarchy} = await this._initPromise;
    const {x, y, z, d} = parameters.nodeIndex;
    const key = `${x}-${y}-${z}-${d}`;
    const {[key]: node} = hierarchy.nodes;
    return node;
  }

  async _initCopc(url: string) {
    const copc = await Copc.create(this._urlOrGetter);
    const hierarchy = await Copc.loadHierarchyPage(this._urlOrGetter, copc.info.rootHierarchyPage);
    const {['0-0-0-0']: rootNode} = hierarchy.nodes;
    if (!rootNode) {
      throw new Error(`Failed to load COPC hierarchy root node ${url}`);
    }
    return {copc, hierarchy, rootNode};
  }

  /*
  async getTile(tileParams: GetTileParameters): Promise<ArrayBuffer | null> {
    const {x, y, z} = tileParams;
    const rangeResponse = await this.pmtiles.getZxy(z, x, y);
    const arrayBuffer = rangeResponse?.data;
    if (!arrayBuffer) {
      // console.error('No arrayBuffer', tileParams);
      return null;
    }
    return arrayBuffer;
  }

  // Tile Source interface implementation: deck.gl compatible API
  // TODO - currently only handles image tiles, not vector tiles

  async getTileData(tileParams: GetTileDataParameters): Promise<any> {
    const {x, y, z} = tileParams.index;
    const metadata = await this.metadata;
    switch (metadata.tileMIMEType) {
      case 'application/vnd.mapbox-vector-tile':
        return await this.getVectorTile({x, y, z, layers: []});
      default:
        return await this.getImageTile({x, y, z, layers: []});
    }
  }
  */
}

function getDataTypeFromDimension(dimension: Dimension): DataType {
  const {type, size} = dimension;
  switch (type) {
    case 'unsigned':
      return size === 1 ? 'uint8' : size === 2 ? 'uint16' : size === 4 ? 'uint32' : 'uint64';
    case 'signed':
      return size === 1 ? 'int8' : size === 2 ? 'int16' : size === 4 ? 'int32' : 'int64';
    case 'float':
      return size === 4 ? 'float32' : 'float64';
    default:
      return 'null';
  }
}
