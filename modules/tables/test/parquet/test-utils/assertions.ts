// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { expect } from "vitest";
const EPSILON_DEFAULT = 0.01;
export function assertArrayEqualEpsilon(actualValues, expectedValues, epsilon = EPSILON_DEFAULT) {
    expect(actualValues.length).toBe(expectedValues.length);
    for (let i = 0; i < actualValues.length; ++i) {
        expect(Math.abs(actualValues[i] - expectedValues[i]) < epsilon).toBeTruthy();
    }
}
