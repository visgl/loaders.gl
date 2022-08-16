import type {FeatureTableJson} from '@loaders.gl/3d-tiles';

/**
 * Takes attributes from property table based on featureIds.
 * If there is no property value for particular featureId (index) the property will be null.
 * Example:
 * Initial data:
 *   OBJECTID: [0, 1, 5]
 *   component: ['Windows', 'Frames', 'Wall', 'Roof', 'Skylight']
 * Result:
 *   OBJECTID: [0, 1, 5]
 *   component: ['Windows', 'Frames', 'null']
 * @param featureIds
 * @param propertyTable
 */
export function flattenPropertyTableByFeatureIds(
  featureIds: number[],
  propertyTable: FeatureTableJson
): FeatureTableJson {
  const resultPropertyTable: FeatureTableJson = {};
  for (const propertyName in propertyTable) {
    const properties = propertyTable[propertyName];
    resultPropertyTable[propertyName] = getPropertiesByFeatureIds(properties, featureIds);
  }

  return resultPropertyTable;
}

/**
 * Getting properties by featureId index
 * @param properties
 * @param featureIds
 */
function getPropertiesByFeatureIds(properties: any[], featureIds: number[]): any[] {
  const resultProperties: any = [];

  for (const featureId of featureIds) {
    const property = properties[featureId] || null;
    resultProperties.push(property);
  }

  return resultProperties;
}

/**
 * Check that all attributes in propertyTable have the same length as FeatureIds.
 * If there are differencies between lengths we should flatten property table based on exiesting featureIds.
 * @param featureIds
 * @param propertyTable
 * @returns
 */
export function checkPropertiesLength(
  featureIds: number[],
  propertyTable: FeatureTableJson
): boolean {
  let needFlatten = false;

  for (const attribute of Object.values(propertyTable)) {
    if (featureIds.length !== attribute.length) {
      needFlatten = true;
    }
  }

  return needFlatten;
}
