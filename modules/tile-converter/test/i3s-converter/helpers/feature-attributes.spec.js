import test from 'tape-promise/tape';
import {
  flattenPropertyTableByFeatureIds,
  checkPropertiesLength
} from '../../../src/i3s-converter/helpers/feature-attributes';

test('#flattenPropertyTableByFeatureIds - Should return flatten property table', async (t) => {
  const featureIds = [0, 1, 3];
  const propertyTable = {
    component: ['Wall', 'Roof', 'Clock', 'Frames'],
    color: ['red', 'green', 'blue', 'white']
  };
  const expectedResult = {
    component: ['Wall', 'Roof', 'Frames'],
    color: ['red', 'green', 'white']
  };
  const result = flattenPropertyTableByFeatureIds(featureIds, propertyTable);
  t.deepEqual(result, expectedResult);
});

test('#checkPropertiesLength - Should return false if properies count is the same as featureIds count', async (t) => {
  const featureIds = [0, 1, 3];
  const propertyTable = {
    component: ['Wall', 'Roof', 'Clock'],
    color: ['red', 'green', 'blue']
  };
  const result = checkPropertiesLength(featureIds, propertyTable);
  t.deepEqual(result, false);
});

test('#checkPropertiesLength - Should return true if properies count is not the same as featureIds count', async (t) => {
  const featureIds = [0, 1, 3];
  const propertyTable = {
    component: ['Wall', 'Roof', 'Clock', 'Frames'],
    color: ['red', 'green', 'blue', 'white']
  };
  const result = checkPropertiesLength(featureIds, propertyTable);
  t.deepEqual(result, true);
});
