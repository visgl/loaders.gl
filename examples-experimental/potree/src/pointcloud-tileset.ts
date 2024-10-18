import {Vector3} from '@math.gl/core';
import {DataSource} from '@loaders.gl/loader-utils';

/** Deck.gl Viewport instance type.
 * We can't import it from Deck.gl to avoid circular reference */
export type Viewport = {
  id: string;
  cameraPosition: number[] | Vector3;
  height: number;
  width: number;
  zoom: number;
  distanceScales: {
    unitsPerMeter: number[];
    metersPerUnit: number[];
  };
  center: number[] | Vector3;
  unprojectPosition: (position: number[] | Vector3) => [number, number, number];
  project: (coorinates: number[] | Vector3) => number[];
};

type PointcloudTilesetProps = {
    /** Delay time before the tileset traversal. It prevents traversal requests spam.*/
    debounceTime: number;
  };
  
  const DEFAULT_PROPS: PointcloudTilesetProps = {
    debounceTime: 0,
  };

export class PointcloudTileset {
  private frameNumber: number = 0;
  private lastUpdatedVieports: Viewport[] | Viewport | null = null;
  private updatePromise: Promise<number> | null = null;

  public options: PointcloudTilesetProps;

  constructor(public dataSource: DataSource, options?: Partial<PointcloudTilesetProps>) {
    // PUBLIC MEMBERS
    this.options = {...DEFAULT_PROPS, ...options};
  }

  get isReady() {
    // @ts-expect-error isReady property is not present in the abstract class
    return this.dataSource.isReady;
  }

  get tiles() {
    return [];
  }

  get isLoaded() {
    return true;
  }

  async selectTiles(viewports: Viewport[] | Viewport | null = null): Promise<number> {
    // @ts-expect-error init property is not present in the abstract class
    await this.dataSource.init();
    if (viewports) {
      this.lastUpdatedVieports = viewports;
    }
    if (!this.updatePromise) {
      this.updatePromise = new Promise<number>((resolve) => {
        setTimeout(() => {
          console.log("update viewport");
          resolve(this.frameNumber++);
          this.updatePromise = null;
        }, this.options.debounceTime);
      });
    }
    return this.updatePromise;
  }
}
