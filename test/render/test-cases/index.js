import meshTestCases from './mesh';
import pointCloudTestCases from './point-cloud';

export const TEST_CASES = [...meshTestCases, ...pointCloudTestCases].filter(
  testCase => !testCase.disabled
);
