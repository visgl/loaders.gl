/**
 * Convert LOD metric from "Screen Space Error" to "Screen Threshold"
 * 
 * @param tile - 3d-tiles tile Object
 * @param coordinates - node converted coordinates
 * @returns An array of LOD metrics in format compatible with i3s 3DNodeIndexDocument.lodSelection
 * @example 
 *  [
        {
            "metricType": "maxScreenThresholdSQ",
            "maxError": 870638.071285568
        },
        {
            "metricType": "maxScreenThreshold",
            "maxError": 1052.8679031638949
        }
    ]
 */
export function convertGeometricErrorToScreenThreshold(
  tile: Object,
  coordinates: {
    mbs?: number[];
  }
): Array<{metricType: string; maxError: number}>;

/**
 * Convert LOD metric from "Screen Threshold" to "Screen Space Error"
 * @param node - i3s node data
 * @returns lod metric in 3d-tiles format
 * @todo implement this function
 */
export function convertScreenThresholdToGeometricError(node: Object): void;
