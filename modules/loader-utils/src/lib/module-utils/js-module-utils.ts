// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {log} from '../log-utils/log';

/**
 * Register application-imported modules
 * These modules are typically to big to bundle, or may have issues on some bundlers/environments
 */
export function registerJSModules(modules?: Record<string, any>): void {
  globalThis.loaders ||= {};
  globalThis.loaders.modules ||= {};
  Object.assign(globalThis.loaders.modules, modules);
}

/**
 * Get a pre-registered application-imported module, warn if not present
 */
export function checkJSModule(name: string, caller: string): void {
  const module = globalThis.loaders?.modules?.[name];
  if (!module) {
    log.warn(`${caller}: ${name} library not installed`)();
  }
}

/**
 * Get a pre-registered application-imported module, throw if not present
 */
export function getJSModule<ModuleT = any>(name: string, caller: string): ModuleT {
  const module = globalThis.loaders?.modules?.[name];
  if (!module) {
    throw new Error(`${caller}: ${name} library not installed`);
  }
  return module;
}

/**
 * Get a pre-registered application-imported module, return null if not present
 */
export function getJSModuleOrNull<ModuleT = any>(name: string): ModuleT | null {
  const module = globalThis.loaders?.modules?.[name];
  return module || null;
}
