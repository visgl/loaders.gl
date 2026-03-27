import type {PointCloudTileContent, PointCloudTileHeader} from './types';

/**
 * Runtime tile state for PointCloudTileset traversal and loading.
 */
export class PointCloudTile {
  header: PointCloudTileHeader;
  parent: PointCloudTile | null;
  children: PointCloudTile[] = [];
  childrenLoaded = false;
  childrenPromise: Promise<PointCloudTile[]> | null = null;
  selected = false;
  viewportIds: string[] = [];
  content: PointCloudTileContent | null = null;
  contentAvailable = false;
  contentFailed = false;
  isContentLoading = false;

  constructor(header: PointCloudTileHeader, parent: PointCloudTile | null = null) {
    this.header = header;
    this.parent = parent;
  }

  /**
   * Tile identifier.
   */
  get id(): string {
    return this.header.id;
  }

  /**
   * Tile depth level.
   */
  get level(): number {
    return this.header.level;
  }

  /**
   * Tile point count.
   */
  get pointCount(): number {
    return this.header.pointCount;
  }

  /**
   * Tile geometric error.
   */
  get geometricError(): number {
    return this.header.geometricError;
  }

  /**
   * Tile bounds.
   */
  get boundingVolume() {
    return this.header.boundingVolume;
  }

  /**
   * Update the selected state for a traversal cycle.
   */
  setSelected(viewportId: string): void {
    this.selected = true;
    if (!this.viewportIds.includes(viewportId)) {
      this.viewportIds.push(viewportId);
    }
  }

  /**
   * Clear transient selection state.
   */
  clearSelection(): void {
    this.selected = false;
    this.viewportIds = [];
  }
}
