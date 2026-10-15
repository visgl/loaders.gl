// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTF} from './gltf-json-schema';

/** KHR_interactivity socket values are arrays of typed components, not JS scalars. */
export type GLTFInteractivityValue = {
  node?: number;
  socket?: string;
  type?: number;
  value?: unknown[];
};
export type GLTFInteractivitySocket = {node: number; socket?: string};
export type GLTFInteractivityNode = {
  declaration: number;
  values?: Record<string, GLTFInteractivityValue>;
  flows?: Record<string, GLTFInteractivitySocket>;
  configuration?: Record<string, {value: unknown[]}>;
};
export type GLTFInteractivityDeclaration = {
  op: string;
  extension?: string;
  inputValueSockets?: Record<string, {type: number}>;
  outputValueSockets?: Record<string, {type: number}>;
};
export type GLTFInteractivityGraph = {
  declarations?: GLTFInteractivityDeclaration[];
  nodes?: GLTFInteractivityNode[];
  types?: Array<{signature: string}>;
  variables?: Array<{type: number; value?: unknown[]; name?: string}>;
  events?: Array<{id: string; [key: string]: unknown}>;
  name?: string;
};
/** Ratified KHR_interactivity root extension. Declarations and types belong to each graph. */
export type GLTF_KHR_interactivity = {
  graph?: number;
  graphs: GLTFInteractivityGraph[];
};

/** Read the raw extension without modifying graph indices or property pointers. */
export function getGLTFInteractivity(
  gltf: GLTF | {json: GLTF}
): GLTF_KHR_interactivity | null {
  const json = 'json' in gltf ? gltf.json : gltf;
  return (json.extensions?.KHR_interactivity as GLTF_KHR_interactivity | undefined) ?? null;
}
