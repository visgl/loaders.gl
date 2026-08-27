// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Vector3} from '@math.gl/core';
import {BoundingSphere, CullingVolume, Plane} from '@math.gl/culling';
import type {Viewport} from '../types';
import {PointCloudTile} from './point-cloud-tile';
import type {
  PointCloudBoundingVolume,
  PointCloudTileHeader,
  PointCloudTilesetSource
} from './types';

export type PointCloudTilesetOptions = {
  debounceTime?: number;
  minimumNodePixelSize?: number;
  maximumScreenSpaceError?: number;
  /** Override source LOD metric for point-cloud traversal. */
  lodSelectionMetricType?: 'maxScreenThresholdSQ' | 'density-threshold';
  /** Minimum projected point density at which a node is refined. */
  densityThreshold?: number;
  pointBudget?: number;
  maxDepth?: number;
  onTileLoad?: (tile: PointCloudTile) => void;
  onTileError?: (tile: PointCloudTile, error: Error) => void;
  onTraversalComplete?: (selectedTiles: PointCloudTile[]) => PointCloudTile[];
  onUpdate?: () => void;
};

type PointCloudTilesetProps = Required<PointCloudTilesetOptions>;

const DEFAULT_PROPS: PointCloudTilesetProps = {
  debounceTime: 0,
  minimumNodePixelSize: 150,
  maximumScreenSpaceError: 1,
  lodSelectionMetricType: 'maxScreenThresholdSQ',
  densityThreshold: 1,
  pointBudget: 2_000_000,
  maxDepth: Number.POSITIVE_INFINITY,
  onTileLoad: () => {},
  onTileError: () => {},
  onTraversalComplete: (selectedTiles: PointCloudTile[]) => selectedTiles,
  onUpdate: () => {}
};

const VISIBILITY_MARGIN_PIXELS = 64;

type TraversalCandidate = {
  tile: PointCloudTile;
  weight: number;
};

type ProjectedBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type ProjectedFootprint = {
  x: number;
  y: number;
  radius: number;
};

type FrustumPlane = {
  distance: number;
  normal: number[] | Vector3;
};

type PointCloudViewport = Viewport & {
  cameraPosition?: number[] | Vector3;
  getFrustumPlanes?: () => Record<string, FrustumPlane>;
  projectPosition?: (coordinates: number[] | Vector3) => number[];
  projectionMatrix?: number[];
};

type TraversalContext = {
  viewport: Viewport;
  cullingVolume: CullingVolume | null;
};

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
  visibleTilesCount = 0;

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
      this.selectedTiles.every(tile => tile.contentAvailable || tile.contentFailed)
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
   * Releases traversal state held by this tileset.
   */
  destroy(): void {
    this.selectedTiles = [];
    this.tilesMap.clear();
    this.root = null;
    this.cartographicCenter = null;
    this.boundingVolume = null;
    this.visibleTilesCount = 0;
    this.pendingCount = 0;
    this.lastUpdatedViewports = null;
    this.updatePromise = null;
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

    const previousSelectedIds = new Set(this.selectedTiles.map(tile => tile.id));
    for (const tile of this.tilesMap.values()) {
      tile.clearSelection();
    }

    this.frameNumberValue++;

    const preparedViewports = Array.isArray(this.lastUpdatedViewports)
      ? this.lastUpdatedViewports
      : [this.lastUpdatedViewports];

    const selectedTilesById = new Map<string, PointCloudTile>();
    const visibleTileIds = new Set<string>();
    let selectedPointCount = 0;
    for (const viewport of preparedViewports) {
      const traversalContext = this.getTraversalContext(viewport);
      selectedPointCount = await this.traverseTiles(
        traversalContext,
        selectedTilesById,
        selectedPointCount,
        visibleTileIds
      );
    }
    this.visibleTilesCount = visibleTileIds.size;

    this.selectedTiles = this.options.onTraversalComplete(Array.from(selectedTilesById.values()));

    for (const tile of this.selectedTiles) {
      this.loadTile(tile).catch(() => undefined);
    }

    const nextSelectedIds = new Set(this.selectedTiles.map(tile => tile.id));
    if (!this.haveSameIds(previousSelectedIds, nextSelectedIds)) {
      this.options.onUpdate();
    }
  }

  /**
   * Traverses visible tiles in descending projected-size order, similar to Potree's viewer update loop.
   */
  private async traverseTiles(
    traversalContext: TraversalContext,
    selectedTilesById: Map<string, PointCloudTile>,
    initialSelectedPointCount: number,
    visibleTileIds: Set<string>
  ): Promise<number> {
    if (!this.root) {
      return initialSelectedPointCount;
    }

    let selectedPointCount = initialSelectedPointCount;
    const traversalQueue: TraversalCandidate[] = [
      {tile: this.root, weight: this.estimateScreenRadius(this.root, traversalContext.viewport)}
    ];

    while (traversalQueue.length > 0) {
      traversalQueue.sort((candidateA, candidateB) => candidateB.weight - candidateA.weight);
      const candidate = traversalQueue.shift();
      if (!candidate) {
        break;
      }

      const {tile, weight} = candidate;
      if (!this.isVisible(tile, traversalContext)) {
        continue;
      }
      visibleTileIds.add(tile.id);

      if (!selectedTilesById.has(tile.id) && tile.pointCount > 0) {
        const exceedsPointBudget =
          selectedPointCount > 0 && selectedPointCount + tile.pointCount > this.options.pointBudget;
        if (exceedsPointBudget) {
          break;
        }

        selectedTilesById.set(tile.id, tile);
        selectedPointCount += tile.pointCount;
      }

      if (selectedTilesById.has(tile.id)) {
        tile.setSelected(traversalContext.viewport.id);
      }

      if (!this.shouldRefine(tile, weight)) {
        continue;
      }

      const visibleChildren = await this.getVisibleChildren(tile, traversalContext);
      if (visibleChildren.length > 0) {
        traversalQueue.push(...visibleChildren);
      }
    }

    return selectedPointCount;
  }

  /** Whether a tile should refine to children based on its projected screen radius. */
  private shouldRefine(tile: PointCloudTile, traversalWeight: number): boolean {
    if (
      tile.level < this.options.maxDepth &&
      Number.isFinite(traversalWeight) &&
      (tile.header.lodSelectionMetricType || this.options.lodSelectionMetricType) ===
        'density-threshold'
    ) {
      const projectedArea = Math.max(1, Math.PI * traversalWeight * traversalWeight);
      const density = tile.pointCount / projectedArea;
      const threshold = tile.header.lodThreshold || this.options.densityThreshold;
      return density >= threshold;
    }
    return (
      tile.level < this.options.maxDepth &&
      Number.isFinite(traversalWeight) &&
      traversalWeight >= this.options.minimumNodePixelSize
    );
  }

  /**
   * Build per-viewport traversal state once per traversal pass.
   */
  private getTraversalContext(viewport: Viewport): TraversalContext {
    const cullingVolume = this.getCullingVolume(viewport as PointCloudViewport);
    return {
      viewport,
      cullingVolume: this.shouldUseCullingVolume(viewport, cullingVolume) ? cullingVolume : null
    };
  }

  /**
   * Check tile visibility against the viewport frustum when possible.
   */
  private isVisible(tile: PointCloudTile, traversalContext: TraversalContext): boolean {
    if (traversalContext.cullingVolume) {
      const boundingSphere = this.getCommonSpaceBoundingSphere(
        tile.boundingVolume,
        traversalContext.viewport as PointCloudViewport
      );

      if (boundingSphere) {
        return this.isBoundingSphereInsideCullingVolume(
          boundingSphere,
          traversalContext.cullingVolume
        );
      }
    }

    const footprint = this.getProjectedFootprint(tile.boundingVolume, traversalContext.viewport);
    if (!footprint) {
      return false;
    }

    return this.isProjectedFootprintVisible(footprint, traversalContext.viewport);
  }

  /**
   * Returns true when the viewport frustum appears usable for this tileset's coordinate space.
   */
  private shouldUseCullingVolume(
    viewport: Viewport,
    cullingVolume: CullingVolume | null
  ): cullingVolume is CullingVolume {
    if (!this.root || !cullingVolume) {
      return false;
    }

    const rootBoundingSphere = this.getCommonSpaceBoundingSphere(
      this.root.boundingVolume,
      viewport as PointCloudViewport
    );
    if (!rootBoundingSphere) {
      return false;
    }

    if (this.isBoundingSphereInsideCullingVolume(rootBoundingSphere, cullingVolume)) {
      return true;
    }

    const projectedFootprint = this.getProjectedFootprint(this.root.boundingVolume, viewport);
    return !projectedFootprint || !this.isProjectedFootprintVisible(projectedFootprint, viewport);
  }

  /**
   * Checks whether a common-space bounding sphere intersects a culling volume.
   */
  private isBoundingSphereInsideCullingVolume(
    boundingSphere: BoundingSphere,
    cullingVolume: CullingVolume
  ): boolean {
    return (
      cullingVolume.computeVisibilityWithPlaneMask(
        boundingSphere,
        CullingVolume.MASK_INDETERMINATE
      ) !== CullingVolume.MASK_OUTSIDE
    );
  }

  /**
   * Checks a projected screen-space footprint against the viewport rectangle.
   */
  private isProjectedFootprintVisible(footprint: ProjectedFootprint, viewport: Viewport): boolean {
    return !(
      footprint.x + footprint.radius < -VISIBILITY_MARGIN_PIXELS ||
      footprint.x - footprint.radius > viewport.width + VISIBILITY_MARGIN_PIXELS ||
      footprint.y + footprint.radius < -VISIBILITY_MARGIN_PIXELS ||
      footprint.y - footprint.radius > viewport.height + VISIBILITY_MARGIN_PIXELS
    );
  }

  /** Estimate traversal priority from projected node radius in screen pixels. */
  private estimateScreenRadius(tile: PointCloudTile, viewport: Viewport): number {
    const footprint = this.getProjectedFootprint(tile.boundingVolume, viewport);
    return footprint ? footprint.radius : 0;
  }

  /**
   * Project a tile AABB into screen space and return its 2D footprint.
   */
  private projectBounds(
    boundingVolume: PointCloudBoundingVolume,
    viewport: Viewport
  ): ProjectedBounds | null {
    const corners = this.getBoundingVolumeCorners(boundingVolume);

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    try {
      for (const corner of corners) {
        const [x, y] = viewport.project(corner);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          continue;
        }
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    } catch {
      return null;
    }

    if (
      !Number.isFinite(minX) ||
      !Number.isFinite(minY) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(maxY)
    ) {
      return null;
    }

    return {minX, minY, maxX, maxY};
  }

  /**
   * Project a tile to a screen-space center/radius footprint.
   */
  private getProjectedFootprint(
    boundingVolume: PointCloudBoundingVolume,
    viewport: Viewport
  ): ProjectedFootprint | null {
    let centerX = Number.NaN;
    let centerY = Number.NaN;

    try {
      [centerX, centerY] = viewport.project(boundingVolume.center);
    } catch {
      return null;
    }

    if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) {
      return null;
    }

    const corners = this.getBoundingVolumeCorners(boundingVolume);
    let projectedRadius = 0;

    try {
      for (const corner of corners) {
        const [x, y] = viewport.project(corner);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          continue;
        }

        projectedRadius = Math.max(projectedRadius, Math.hypot(x - centerX, y - centerY));
      }
    } catch {
      return null;
    }

    if (projectedRadius === 0) {
      const fallbackBounds = this.projectBounds(boundingVolume, viewport);
      if (fallbackBounds) {
        projectedRadius =
          Math.max(
            fallbackBounds.maxX - fallbackBounds.minX,
            fallbackBounds.maxY - fallbackBounds.minY
          ) / 2;
      }
    }

    return {x: centerX, y: centerY, radius: projectedRadius};
  }

  /**
   * Returns visible children ordered by their projected importance.
   */
  private async getVisibleChildren(
    tile: PointCloudTile,
    traversalContext: TraversalContext
  ): Promise<TraversalCandidate[]> {
    if (tile.level >= this.options.maxDepth) {
      return [];
    }

    const children = await this.getChildren(tile);

    return children
      .map(child => ({
        tile: child,
        weight: this.estimateScreenRadius(child, traversalContext.viewport)
      }))
      .filter(candidate => this.isVisible(candidate.tile, traversalContext));
  }

  private async getChildren(tile: PointCloudTile): Promise<PointCloudTile[]> {
    if (tile.childrenLoaded) {
      return tile.children;
    }

    if (!tile.childrenPromise) {
      const childrenPromise = this.dataSource
        .getChildren(tile.header)
        .then(headers => headers.map(header => this.getOrCreateTile(header, tile)))
        .then(children => {
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
    if (parent && !parent.children.find(child => child.id === tile.id)) {
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
      tile.contentAvailable = true;
      if (content) {
        this.options.onTileLoad(tile);
      }
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

  /**
   * Convert a tile bounding box into its eight corners.
   */
  private getBoundingVolumeCorners(boundingVolume: PointCloudBoundingVolume): number[][] {
    const [minBounds, maxBounds] = boundingVolume.cartographicBounds;
    return [
      [minBounds[0], minBounds[1], minBounds[2] || 0],
      [minBounds[0], minBounds[1], maxBounds[2] || 0],
      [minBounds[0], maxBounds[1], minBounds[2] || 0],
      [minBounds[0], maxBounds[1], maxBounds[2] || 0],
      [maxBounds[0], minBounds[1], minBounds[2] || 0],
      [maxBounds[0], minBounds[1], maxBounds[2] || 0],
      [maxBounds[0], maxBounds[1], minBounds[2] || 0],
      [maxBounds[0], maxBounds[1], maxBounds[2] || 0]
    ];
  }

  /**
   * Build a culling volume directly from the viewport frustum in common space.
   */
  private getCullingVolume(viewport: PointCloudViewport): CullingVolume | null {
    const getFrustumPlanes = viewport.getFrustumPlanes?.bind(viewport);
    if (!getFrustumPlanes) {
      return null;
    }

    const frustumPlanes = getFrustumPlanes();
    const directions = ['left', 'right', 'bottom', 'top', 'near', 'far'];
    const planes: Plane[] = [];

    for (const direction of directions) {
      const plane = frustumPlanes[direction];
      if (!plane) {
        return null;
      }

      planes.push(new Plane(plane.normal, -plane.distance));
    }

    return new CullingVolume(planes);
  }

  /**
   * Approximate a tile AABB by a common-space bounding sphere for frustum culling.
   */
  private getCommonSpaceBoundingSphere(
    boundingVolume: PointCloudBoundingVolume,
    viewport: PointCloudViewport
  ): BoundingSphere | null {
    const projectPosition = viewport.projectPosition?.bind(viewport);
    if (!projectPosition) {
      return null;
    }

    const corners = this.getBoundingVolumeCorners(boundingVolume);
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;

    try {
      for (const corner of corners) {
        const [x, y, z = 0] = projectPosition(corner);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
          continue;
        }

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        minZ = Math.min(minZ, z);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        maxZ = Math.max(maxZ, z);
      }
    } catch {
      return null;
    }

    if (
      !Number.isFinite(minX) ||
      !Number.isFinite(minY) ||
      !Number.isFinite(minZ) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(maxY) ||
      !Number.isFinite(maxZ)
    ) {
      return null;
    }

    return new BoundingSphere().fromCornerPoints([minX, minY, minZ], [maxX, maxY, maxZ]);
  }
}
