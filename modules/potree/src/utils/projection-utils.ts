import {Proj4Projection} from '@math.gl/proj4';

/**
 * Create projection from proj4 definition to WGS84
 * @param projectionData - proj4 definition
 * @returns projection instance
 */
export const createProjection = (projectionData?: string): Proj4Projection | null => {
  if (!projectionData) {
    return null;
  }
  return new Proj4Projection({
    from: projectionData,
    to: 'WGS84'
  });
};
