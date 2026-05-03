declare module '@loaders.gl/tiles' {
  import type {Viewport} from '@deck.gl/core';

  export type PointCloudAttribute = {
    value: ArrayBufferView;
    size: number;
    normalized?: boolean;
  };

  export type PointCloudTileContent = {
    attributes: {
      positions: PointCloudAttribute;
      colors?: PointCloudAttribute;
      normals?: PointCloudAttribute;
    };
    pointCount: number;
    cartographicOrigin: number[];
    coordinateSystem: 'default' | 'lnglat' | 'meter-offsets' | 'lnglat-offsets' | 'cartesian';
    constantRGBA?: number[];
    modelMatrix?: number[] | Float32Array;
  };

  export type PointCloudBoundingVolume = {
    cartographicBounds: [number[], number[]];
    center: number[];
    radius: number;
  };

  export type PointCloudTileHeader = {
    id: string;
    level: number;
    pointCount: number;
    geometricError: number;
    boundingVolume: PointCloudBoundingVolume;
  };

  export type PointCloudTilesetSource = {
    isReady: boolean;
    initialize(): Promise<void>;
    getMetadata?(): Promise<unknown>;
    getRootTile(): Promise<PointCloudTileHeader>;
    getChildren(tile: PointCloudTileHeader): Promise<PointCloudTileHeader[]>;
    loadTileContent(tile: PointCloudTileHeader): Promise<PointCloudTileContent | null>;
    getViewState?():
      | Promise<{
          boundingVolume?: PointCloudBoundingVolume;
          cartographicCenter?: number[];
          zoom?: number;
        }>
      | {
          boundingVolume?: PointCloudBoundingVolume;
          cartographicCenter?: number[];
          zoom?: number;
        };
  };

  export type PointCloudTilesetOptions = {
    debounceTime?: number;
    maximumScreenSpaceError?: number;
    pointBudget?: number;
    maxDepth?: number;
    onTileLoad?: (tile: PointCloudTile) => void;
    onTileError?: (tile: PointCloudTile, error: Error) => void;
    onTraversalComplete?: (selectedTiles: PointCloudTile[]) => PointCloudTile[];
    onUpdate?: () => void;
  };

  export class PointCloudTile {
    readonly id: string;
    readonly level: number;
    readonly pointCount: number;
    readonly geometricError: number;
    readonly boundingVolume: PointCloudBoundingVolume;
    selected: boolean;
    content: PointCloudTileContent | null;
    contentAvailable: boolean;
  }

  export class PointCloudTileset {
    constructor(
      dataSource: PointCloudTilesetSource,
      options?: Partial<PointCloudTilesetOptions>
    );
    readonly root: PointCloudTile | null;
    readonly tiles: PointCloudTile[];
    readonly selectedTiles: PointCloudTile[];
    readonly frameNumber: number;
    readonly visibleTilesCount: number;
    readonly cartographicCenter: number[] | null;
    readonly zoom: number;
    readonly boundingVolume: PointCloudBoundingVolume | null;
    isLoaded(): boolean;
    selectTiles(viewports: Viewport[] | Viewport | null): Promise<number>;
  }
}
