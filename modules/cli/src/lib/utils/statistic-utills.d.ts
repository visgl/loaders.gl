/**
 * Do milliseconds time conversion to readable time string.
 * @param tile - 3d-tiles tile Object
 * @param coordinates - node converted coordinates
 * @returns String which characterizes conversion time period
 */
export function timeConverter(time: [number, number]): String;

/**
 * Calculate files sizes after conversion.
 * @param params - Object with params of conversion.
 * @returns Promise with generated files size in bytes.
 */
export function calculateFilesSize(params: {
  slpk: boolean;
  outputPath: string;
  tilesetName: string;
}): Number;

/**
 * Reqursivelly calculate files sizes in directory.
 * @param dirPath - Directory path.
 * @returns Promise with files size in directory.
 */
export function getTotalFilesSize(dirPath: string): Number;
