import type { GeoTIFFImage } from 'geotiff';
import type { PixelSource, PixelSourceSelection, PixelSourceMeta, Dtype, Labels, RasterSelection, TileSelection, PixelData } from '../types';
declare class TiffPixelSource<S extends string[]> implements PixelSource<S> {
    dtype: Dtype;
    tileSize: number;
    shape: number[];
    labels: Labels<S>;
    meta: PixelSourceMeta | undefined;
    private _indexer;
    constructor(indexer: (sel: PixelSourceSelection<S>) => Promise<GeoTIFFImage>, dtype: Dtype, tileSize: number, shape: number[], labels: Labels<S>, meta?: PixelSourceMeta);
    getRaster({ selection, signal }: RasterSelection<S>): Promise<PixelData>;
    getTile({ x, y, selection, signal }: TileSelection<S>): Promise<PixelData>;
    private _readRasters;
    private _getTileExtent;
    onTileError(err: Error): void;
}
export default TiffPixelSource;
