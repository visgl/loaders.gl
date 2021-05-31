export type Tileset3DProps = {
  ellipsoid: object,
  modelMatrix: number[],
  throttleRequests: boolean,
  maximumMemoryUsage: number,
  onTileLoad: () => any,
  onTileUnload: () => any,
  onTileError: (tile, message, url) => any,
  maximumScreenSpaceError: number
}

export default class Tileset3D {
  readonly props: Tileset3DProps;
  readonly tileset: {[key: string]: any};
  readonly loader: object;
  readonly type: string;
  readonly url: string;
  readonly basePath: string;
  readonly modelMatrix: number[];
  readonly ellipsoid: any;
  readonly lodMetricType: string;
  readonly lodMetricValue: number;
  readonly refine: string;
  readonly root: {[key: string]: any};

  /** @deprecated */
  readonly options: Tileset3DProps;

  /**
   * Create a new Tileset3D
   * @param {*} json 
   * @param {Tileset3DProps} props
   */
  constructor(json, options = {});

  /** Release resources */
  destroy(): void;

  /** Is the tileset loaded (update needs to have been called at least once) */
  isLoaded(): boolean;

  get tiles(): object[];

  get frameNumber(): number;

  setProps(props: Tileset3DProps): void;

  /** @deprecated */
  setOptions(options: Tileset3DProps): void;

  /**
   * Return a loadable tile url for a specific tile subpath
   * @param tilePath a tile subpath
   */
  getTileUrl(tilePath: string): string;

  /**
   * Update visible tiles relying on a list of deck.gl viewports
   * @param {WebMercatorViewport[]} viewports - list of deck.gl viewports
   * @return {void}
   */
  update(viewports): void;

  // TODO CESIUM specific
  hasExtension(extensionName): boolean;

  get queryParams(): string;

  _loadTile(tile): Promise<any>;
}
