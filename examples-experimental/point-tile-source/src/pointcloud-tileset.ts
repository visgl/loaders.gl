import {Vector3} from '@math.gl/core';
import {DataSource} from '@loaders.gl/loader-utils';
import {POTreeNode} from '@loaders.gl/potree';
import {PointTileSourceTraverser} from './point-tile-source-traverser';

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

  onTileLoaded?: (node: POTreeNode) => void;
};

const DEFAULT_PROPS: PointcloudTilesetProps = {
  debounceTime: 0
};

export class PointcloudTileset {
  private frameNumber: number = 0;
  private lastUpdatedVieports: Viewport[] | Viewport | null = null;
  private updatePromise: Promise<number> | null = null;
  private _selectedNodes: POTreeNode[] = [];
  private traverser: PointTileSourceTraverser;

  public options: PointcloudTilesetProps;

  constructor(
    public dataSource: DataSource<string, {}>,
    options?: Partial<PointcloudTilesetProps>
  ) {
    this.options = {...DEFAULT_PROPS, ...options};
    this.traverser = new PointTileSourceTraverser();

    this.dataSource.init().then(() => {
      this.traverser.root = this.dataSource.root;
    });
  }

  get isReady() {
    // @ts-expect-error isReady property is not present in the abstract class
    return this.dataSource.isReady;
  }

  get tiles() {
    return this._selectedNodes;
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
          if (this.lastUpdatedVieports) {
            this.doUpdate(this.lastUpdatedVieports);
          }

          resolve(this.frameNumber);
          this.updatePromise = null;
        }, this.options.debounceTime);
      });
    }
    return this.updatePromise;
  }

  doUpdate(viewports: Viewport[] | Viewport): void {
    const preparedViewports = viewports instanceof Array ? viewports : [viewports];

    this.frameNumber++;
    this._selectedNodes = this.traverser.traverse(preparedViewports);
    this.loadNodesContent(this.traverser.nodesToLoad);
  }

  loadNodesContent(nodes: POTreeNode[]) {
    for (const node of nodes) {
      this.loadNodeContent(node);
    }
  }

  async loadNodeContent(node: POTreeNode) {
    node.isContentLoading = true;
    node.content = await this.dataSource.loadNodeContent(node.name);
    this.onTileLoaded(node);
    node.isContentLoading = false;
  }

  onTileLoaded(node: POTreeNode) {
    if (this.options.onTileLoaded) {
      this.options.onTileLoaded(node);
    }
  }
}
