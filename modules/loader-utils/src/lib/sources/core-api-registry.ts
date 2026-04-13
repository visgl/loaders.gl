// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI} from './data-source';

let registeredCoreApi: CoreAPI | undefined;

/**
 * Registers the shared Core API singleton for internal package-to-package integration.
 * @param coreApi - Core API implementation exported by `@loaders.gl/core`.
 */
export function _registerCoreApi(coreApi: CoreAPI): void {
  registeredCoreApi = coreApi;
}

/**
 * Returns the shared Core API singleton when one has been registered.
 */
export function _getRegisteredCoreApi(): CoreAPI | undefined {
  return registeredCoreApi;
}
