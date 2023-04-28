import {Source, PMTiles, Header, TileType} from 'pmtiles';
// import {Source, RangeResponse, PMTiles, Header, Compression, TileType} from 'pmtiles';

// export enum Compression {
//   Unknown = 0,
//   None = 1,
//   Gzip = 2,
//   Brotli = 3,
//   Zstd = 4,
// }

// export enum TileType {
//   Unknown = 0,
//   Mvt = 1,
//   Png = 2,
//   Jpeg = 3,
//   Webp = 4,
// }

export interface PMTilesMetadata {
  format: 'pmtiles';
  /** PMTiles format specific header */
  formatHeader?: Header;
  version: number;
  tileType: TileType;
  minZoom: number;
  maxZoom: number;
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
  centerZoom: number;
  centerLon: number;
  centerLat: number;
  etag?: string;
  // Addition
  metadata: unknown;
}

export type ParsePMTilesOptions = {
  tileZxy?: [number, number, number];
}

export async function loadPMTilesHeader(source: Source): Promise<PMTilesMetadata> {
  const pmTiles = new PMTiles(source);
  const header = await pmTiles.getHeader();
  const metadata = await pmTiles.getMetadata();
  return parsePMTilesMetadata(header, metadata);
}

export async function loadPMTile(source: Source, options: ParsePMTilesOptions): Promise<ArrayBuffer | undefined>  {
  const pmTiles = new PMTiles(source);
  if (!options.tileZxy) {
    throw new Error('tile zxy missing')
  }
  const [z, x, y] = options.tileZxy;
  const tile = await pmTiles.getZxy(z, x, y);
  return tile?.data;
}

export async function parsePMTilesMetadata(header: Header, metadata: unknown): Promise<PMTilesMetadata> {
  return {
    // The assumption is that this is a tileJSON style metadata generated by e.g. tippecanone
    metadata,
    format: 'pmtiles',
    version: header.specVersion,
    tileType: header.tileType,
    minZoom: header.minZoom,
    maxZoom: header.maxZoom,
    minLon: header.minLon,
    minLat: header.minLat,
    maxLon: header.maxLon,
    maxLat: header.maxLat,
    centerZoom: header.centerZoom,
    centerLon: header.centerLon,
    centerLat: header.centerLat,
    etag: header.etag,

    formatHeader: header
  };
}
