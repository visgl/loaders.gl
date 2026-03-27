import {Vector3} from '@math.gl/core';
import type {Viewport} from '../types';
import {PointCloudTile} from './point-cloud-tile';
import type {
  PointCloudBoundingVolume,
  PointCloudTileHeader,
  PointCloudTilesetSource
} from './types';

export type PointCloudTilesetOptions = {
  debounceTime?: number;
  maximumScreenSpaceError?: number;
  maxDepth?: number;
  onTileLoad?: (tile: PointCloudTile) => void;
  onTileError?: (tile: PointCloudTile, error: Error) => void;
  onTraversalComplete?: (selectedTiles: PointCloudTile[]) => PointCloudTile[];
  onUpdate?: () => void;
};

type PointCloudTilesetProps = Required<PointCloudTilesetOptions>;

const DEFAULT_PROPS: PointCloudTilesetProps = {
  debounceTime: 0,
  maximumScreenSpaceError: 24,
  maxDepth: Number.POSITIVE_INFINITY,
  onTileLoad: () => {},
  onTileError: () => {},
  onTraversalComplete: (selectedTiles: PointCloudTile[]) => selectedTiles,
  onUpdate: () => {}
};

const VISIBILITY_MARGIN_PIXELS = 64;

/**
 * A minimal point-cloud-oriented tileset manager backed by a DataSource.
 */
export class PointCloudTileset {
  readonly dataSource: PointCloudTilesetSource;
  options: PointCloudTilesetProps;
  root: PointCloudTile | null = null;
  cartographicCenter: Vector3 | null = null;
  zoom = 1;
  boundingVolume: PointCloudBoundingVolume | null = null;

  private frameNumberValue = 0;
  private pendingCount = 0;
  private lastUpdatedViewports: Viewport[] | Viewport | null = null;
  private updatePromise: Promise<number> | null = null;
  private readonly tilesMap: Map<string, PointCloudTile> = new Map();

  constructor(
    dataSource: PointCloudTilesetSource,
    options: Partial<PointCloudTilesetOptions> = {}
  ) {
    this.dataSource = dataSource;
    this.options = {...DEFAULT_PROPS, ...options};
    this.tilesetInitializationPromise = this.initialize();
  }

  readonly tilesetInitializationPromise: Promise<void>;

  /**
   * Whether the tileset finished initialization.
   */
  get isReady(): boolean {
    return this.dataSource.isReady;
  }

  /**
   * Runtime frame number.
   */
  get frameNumber(): number {
    return this.frameNumberValue;
  }

  /**
   * All discovered tiles.
   */
  get tiles(): PointCloudTile[] {
    return Array.from(this.tilesMap.values());
  }

  /**
   * Whether all currently selected tiles have finished loading.
   */
  isLoaded(): boolean {
    return (
      this.frameNumberValue > 0 &&
      this.pendingCount === 0 &&
      this.selectedTiles.every((tile) => tile.contentAvailable || tile.contentFailed)
    );
  }

  /**
   * Currently selected tiles.
   */
  selectedTiles: PointCloudTile[] = [];

  /**
   * Fire-and-forget update helper.
   */
  update(viewports: Viewport[] | Viewport | null = null): void {
    this.selectTiles(viewports).catch(() => undefined);
  }

  /**
   * Initialize the underlying source and the root tile.
   */
  async initialize(): Promise<void> {
    await this.dataSource.initialize();
    const rootHeader = await this.dataSource.getRootTile();
    this.root = this.getOrCreateTile(rootHeader, null);

    const viewState = await this.dataSource.getViewState?.();
    this.boundingVolume = viewState?.boundingVolume || this.root.boundingVolume;

    const center = viewState?.cartographicCenter || this.root.boundingVolume.center;
    this.cartographicCenter = new Vector3(center);
    this.zoom = viewState?.zoom || this.estimateZoom(this.boundingVolume);
  }

  /**
   * Debounced async tile selection.
   */
  async selectTiles(viewports: Viewport[] | Viewport | null = null): Promise<number> {
    await this.tilesetInitializationPromise;
    if (viewports) {
      this.lastUpdatedViewports = viewports;
    }

    if (!this.updatePromise) {
      this.updatePromise = new Promise<number>((resolve, reject) => {
        setTimeout(() => {
          this.doSelectTiles()
            .then(() => resolve(this.frameNumberValue))
            .catch(reject)
            .finally(() => {
              this.updatePromise = null;
            });
        }, this.options.debounceTime);
      });
    }

    return this.updatePromise;
  }

  private async doSelectTiles(): Promise<void> {
    if (!this.root || !this.lastUpdatedViewports) {
      return;
    }

    const previousSelectedIds = new Set(this.selectedTiles.map((tile) => tile.id));
    for (const tile of this.tilesMap.values()) {
      tile.clearSelection();
    }

    this.frameNumberValue++;

    const preparedViewports = Array.isArray(this.lastUpdatedViewports)
      ? this.lastUpdatedViewports
      : [this.lastUpdatedViewports];

    const selectedTilesById = new Map<string, PointCloudTile>();
    for (const viewport of preparedViewports) {
      await this.traverseTile(this.root, viewport, selectedTilesById);
    }

    this.selectedTiles = this.options.onTraversalComplete(Array.from(selectedTilesById.values()));

    for (const tile of this.selectedTiles) {
      this.loadTile(tile).catch(() => undefined);
    }

    const nextSelectedIds = new Set(this.selectedTiles.map((tile) => tile.id));
    if (!this.haveSameIds(previousSelectedIds, nextSelectedIds)) {
      this.options.onUpdate();
    }
  }

  private async traverseTile(
    tile: PointCloudTile,
    viewport: Viewport,
    selectedTilesById: Map<string, PointCloudTile>
  ): Promise<void> {
    if (!this.isVisible(tile, viewport)) {
      return;
    }

    if (this.shouldRefine(tile, viewport)) {
      const children = await this.getChildren(tile);
      if (children.length) {
        let selectedChild = false;
        for (const child of children) {
          await this.traverseTile(child, viewport, selectedTilesById);
          if (selectedTilesById.has(child.id)) {
            selectedChild = true;
          }
        }

        if (selectedChild) {
          return;
        }
      }
    }

    tile.setSelected(viewport.id);
    selectedTilesById.set(tile.id, tile);
  }

  private shouldRefine(tile: PointCloudTile, viewport: Viewport): boolean {
    return (
      tile.level < this.options.maxDepth &&
      tile.geometricError > 0 &&
      this.estimateScreenSpaceError(tile, viewport) > this.options.maximumScreenSpaceError
    );
  }

  private isVisible(tile: PointCloudTile, viewport: Viewport): boolean {
    const bounds = this.projectBounds(tile.boundingVolume, viewport);
    if (!bounds) {
      return false;
    }

    return !(
      bounds.maxX < -VISIBILITY_MARGIN_PIXELS ||
      bounds.minX > viewport.width + VISIBILITY_MARGIN_PIXELS ||
      bounds.maxY < -VISIBILITY_MARGIN_PIXELS ||
      bounds.minY > viewport.height + VISIBILITY_MARGIN_PIXELS
    );
  }

  private estimateScreenSpaceError(tile: PointCloudTile, viewport: Viewport): number {
    const bounds = this.projectBounds(tile.boundingVolume, viewport);
    if (!bounds) {
      return 0;
    }

    return Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  }

  private projectBounds(
    boundingVolume: PointCloudBoundingVolume,
    viewport: Viewport
  ): {minX: number; minY: number; maxX: number; maxY: number} | null {
    const [minBounds, maxBounds] = boundingVolume.cartographicBounds;
    const corners = [
      [minBounds[0], minBounds[1], minBounds[2] || 0],
      [minBounds[0], maxBounds[1], minBounds[2] || 0],
      [maxBounds[0], minBounds[1], maxBounds[2] || 0],
      [maxBounds[0], maxBounds[1], maxBounds[2] || 0]
    ];

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    try {
      for (const corner of corners) {
        const [x, y] = viewport.project(corner);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          return null;
        }
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    } catch {
      return null;
    }

    return {minX, minY, maxX, maxY};
  }

  private async getChildren(tile: PointCloudTile): Promise<PointCloudTile[]> {
    if (tile.childrenLoaded) {
      return tile.children;
    }

    if (!tile.childrenPromise) {
      const childrenPromise = this.dataSource
        .getChildren(tile.header)
        .then((headers) => headers.map((header) => this.getOrCreateTile(header, tile)))
        .then((children) => {
          tile.children = children;
          tile.childrenLoaded = true;
          return children;
        });

      tile.childrenPromise = childrenPromise.finally(() => {
        if (tile.childrenPromise === childrenPromise) {
          tile.childrenPromise = null;
        }
      });
    }

    return tile.childrenPromise;
  }

  private getOrCreateTile(
    header: PointCloudTileHeader,
    parent: PointCloudTile | null
  ): PointCloudTile {
    const existingTile = this.tilesMap.get(header.id);
    if (existingTile) {
      existingTile.header = header;
      if (parent && existingTile.parent !== parent) {
        existingTile.parent = parent;
      }
      return existingTile;
    }

    const tile = new PointCloudTile(header, parent);
    this.tilesMap.set(header.id, tile);
    if (parent && !parent.children.find((child) => child.id === tile.id)) {
      parent.children.push(tile);
    }
    return tile;
  }

  private async loadTile(tile: PointCloudTile): Promise<void> {
    if (tile.contentAvailable || tile.isContentLoading || tile.contentFailed) {
      return;
    }

    tile.isContentLoading = true;
    this.pendingCount++;

    try {
      const content = await this.dataSource.loadTileContent(tile.header);
      tile.content = content;
      tile.contentAvailable = Boolean(content);
      this.options.onTileLoad(tile);
    } catch (error) {
      tile.contentFailed = true;
      this.options.onTileError(tile, error as Error);
    } finally {
      tile.isContentLoading = false;
      this.pendingCount--;
    }
  }

  private estimateZoom(boundingVolume: PointCloudBoundingVolume | null): number {
    if (!boundingVolume) {
      return 1;
    }

    const [minBounds, maxBounds] = boundingVolume.cartographicBounds;
    const longitudeSpan = Math.max(Math.abs(maxBounds[0] - minBounds[0]), 0.000001);
    return Math.max(1, Math.round(Math.log2(360 / longitudeSpan)));
  }

  private haveSameIds(idsA: Set<string>, idsB: Set<string>): boolean {
    if (idsA.size !== idsB.size) {
      return false;
    }

    for (const id of idsA) {
      if (!idsB.has(id)) {
        return false;
      }
    }

    return true;
  }
}
