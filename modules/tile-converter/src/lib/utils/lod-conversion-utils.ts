import {Tiles3DTileJSONPostprocessed} from '@loaders.gl/3d-tiles';
import {BoundingVolumes} from '@loaders.gl/i3s';
import {Tile3D} from '@loaders.gl/tiles';

// https://cesium.com/docs/cesiumjs-ref-doc/Cesium3DTileset.html
const DEFAULT_MAXIMUM_SCREEN_SPACE_ERROR = 16;
/**
 * Do conversion from geometric error to screen threshold
 * 
 * In 3DTiles we have HLOD logic and parent tile also has bigger lodMetric value then its children.
 * In I3s we have reverse logic related to maxError. Parent has lower maxError than its child.
 * In nodes where are no children tile.lodMetricValue is 0. This is because of logic of HLOD in 3DTiles
 * 3DTiles spec:
 * https://github.com/CesiumGS/3d-tiles/tree/master/specification#geometric-error
 * I3S spec:
 * https://github.com/Esri/i3s-spec/blob/master/docs/1.7/lodSelection.cmn.md
 * To avoid infinity values when we do calculations of maxError we shold replace 0 with value which allows us
 * to make child maxError bigger than his parent maxError.
 * 
 * @param tile - 3d-tiles tile JSON
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
  tile: Tiles3DTileJSONPostprocessed,
  coordinates: BoundingVolumes
) {
  const lodSelection: {metricType: string; maxError: number}[] = [];
  const boundingVolume = tile.boundingVolume;
  const lodMetricValue = tile.lodMetricValue || 0.1;
  const maxScreenThreshold = {
    metricType: 'maxScreenThreshold',
    maxError: (coordinates.mbs[3] * 2 * DEFAULT_MAXIMUM_SCREEN_SPACE_ERROR) / lodMetricValue
  };
  const maxScreenThresholdSQ = {
    metricType: 'maxScreenThresholdSQ',
    maxError: Math.PI * 0.25 * maxScreenThreshold.maxError * maxScreenThreshold.maxError
  };

  if (boundingVolume.constructor.name === 'OrientedBoundingBox') {
    lodSelection.push(maxScreenThresholdSQ);
    lodSelection.push(maxScreenThreshold);
  } else {
    lodSelection.push(maxScreenThreshold);
    lodSelection.push(maxScreenThresholdSQ);
  }

  return lodSelection;
}

/**
 * Convert LOD metric from "Screen Threshold" to "Screen Space Error"
 * @param node - i3s node data
 * @returns lod metric in 3d-tiles format
 */
export function convertScreenThresholdToGeometricError(node: Tile3D): number {
  const metricData = node.header.lodSelection.maxScreenThreshold || {};
  let maxError = metricData.maxError;
  if (!maxError) {
    const sqMetricData = node.header.lodSelection.maxScreenThresholdSQ;
    if (sqMetricData) {
      maxError = Math.sqrt(sqMetricData.maxError / (Math.PI * 0.25));
    }
  }

  if (!maxError) {
    maxError = DEFAULT_MAXIMUM_SCREEN_SPACE_ERROR;
  }

  return (node.header.mbs[3] * 2 * DEFAULT_MAXIMUM_SCREEN_SPACE_ERROR) / maxError;
}
