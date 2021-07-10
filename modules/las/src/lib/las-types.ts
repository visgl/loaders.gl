/**
 * Type for header of the .las file
 */
export type LASHeader = {
  pointsOffset: number;
  pointsFormatId: number;
  pointsStructSize: number;
  pointsCount: number;
  scale: [number, number, number];
  offset: [number, number, number];
  maxs?: number[];
  mins?: number[];
  totalToRead: number;
  totalRead: number;
  versionAsString?: string;
  isCompressed?: boolean;
};
