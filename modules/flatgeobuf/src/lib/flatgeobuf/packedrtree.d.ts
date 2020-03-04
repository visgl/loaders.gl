export interface Rect {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function calcTreeSize(numItems: number, nodeSize: number): number;

type ReadNodeFn = (treeOffset: number, size: number) => Promise<ArrayBuffer>

// export function * streamSearch(numItems: number, nodeSize: number, rect: Rect, readNode: ReadNodeFn): Promise<void>;
